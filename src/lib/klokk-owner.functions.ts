// System owner console (Phase 1.3). The "system owner" runs the Klokk system itself. This is
// separate from a Teams "account admin", who manages a team inside their own account.
//
// The role lives in the server-only table system_roles and is checked on every call. The
// browser never decides who is an owner. Everything here uses the service role.
//
// First owner: when no owner exists yet, the earliest account created in Klokk becomes owner.
// SYSTEM_OWNER_EMAILS (optional, comma separated) can also name owners explicitly.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function db(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type SystemRole = "owner" | "admin";

/** Returns the caller's system role, creating the first owner if none exists yet. */
async function roleFor(userId: string): Promise<SystemRole | null> {
  const admin = await db();
  const { data: row } = await admin
    .from("system_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (row?.role) return row.role as SystemRole;

  // Identity comes from Supabase Auth (users cannot edit it), never from the profiles table,
  // which a signed-in user can write to.
  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const authUser = authData?.user;
  const listed = (process.env["SYSTEM_OWNER_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = authUser?.email_confirmed_at ? (authUser.email ?? "").toLowerCase() : "";
  let becomeOwner = !!email && listed.includes(email);

  if (!becomeOwner && authUser?.created_at) {
    // No owner yet: the earliest Auth account is the owner. Once any owner exists this never runs.
    const { data: owners } = await admin
      .from("system_roles")
      .select("user_id")
      .eq("role", "owner")
      .limit(1);
    // The bootstrap is one-time: the audit log keeps a permanent record, so it can never
    // re-run (for example if the only owner later deletes their account).
    const { data: prior } = await admin
      .from("system_audit_log")
      .select("id")
      .eq("action", "owner_bootstrapped")
      .limit(1);
    if ((!owners || owners.length === 0) && (!prior || prior.length === 0)) {
      const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const users = (page?.users ?? []) as { id: string; created_at: string }[];
      users.sort((x, y) => Date.parse(x.created_at) - Date.parse(y.created_at));
      becomeOwner = users[0]?.id === userId;
    }
  }
  if (!becomeOwner) return null;
  const { error } = await admin
    .from("system_roles")
    .upsert({ user_id: userId, role: "owner" }, { onConflict: "user_id" });
  if (error) throw error;
  await admin.from("system_audit_log").insert({
    actor_id: userId,
    action: "owner_bootstrapped",
    target_user_id: userId,
  });
  return "owner";
}

async function requireOwner(userId: string): Promise<void> {
  if ((await roleFor(userId)) !== "owner") throw new Error("Not allowed");
}

/** Used by the navigation to decide whether to show the owner console link. */
export const getSystemRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await roleFor(context.userId);
    return { role };
  });

export const listSystemUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    const admin = await db();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    const [{ data: events }, { data: conns }, { data: roles }] = await Promise.all([
      admin.from("events").select("owner_id").limit(50000),
      admin.from("crm_connections").select("user_id"),
      admin.from("system_roles").select("user_id, role"),
    ]);
    const eventCount = new Map<string, number>();
    for (const e of (events ?? []) as any[]) {
      eventCount.set(e.owner_id, (eventCount.get(e.owner_id) ?? 0) + 1);
    }
    const crm = new Set(((conns ?? []) as any[]).map((c) => c.user_id as string));
    const roleOf = new Map(
      ((roles ?? []) as any[]).map((r) => [r.user_id as string, r.role as string]),
    );
    return ((profiles ?? []) as any[]).map((p) => ({
      id: p.id as string,
      email: (p.email as string | null) ?? "",
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      plan: ((p.plan as string | null) ?? "free") as string,
      billingStatus: (p.billing_status as string | null) ?? null,
      eventsTotal: eventCount.get(p.id) ?? 0,
      createdAt: (p.created_at as string | null) ?? null,
      marketingConsent: p.marketing_consent === true,
      crmConnected: crm.has(p.id),
      systemRole: roleOf.get(p.id) ?? null,
    }));
  });

export const setUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      userId: z.string().uuid(),
      plan: z.enum(["free", "casual", "organiser", "teams"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const admin = await db();
    const { data: before } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", data.userId)
      .maybeSingle();
    if (!before) throw new Error("User not found");
    // Service role writes are allowed through the profiles protection trigger.
    const { error } = await admin
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", data.userId);
    if (error) throw error;
    await admin.from("system_audit_log").insert({
      actor_id: context.userId,
      action: "plan_changed",
      target_user_id: data.userId,
      detail: { from: before.plan ?? "free", to: data.plan },
    });
    return { ok: true };
  });

export const deleteSystemUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    if (data.userId === context.userId) {
      throw new Error("Use your own Settings to delete your own account");
    }
    const admin = await db();
    const { data: target } = await admin
      .from("system_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (target) throw new Error("Remove their system role before deleting this account");
    const { data: prof } = await admin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();
    await admin.from("system_audit_log").insert({
      actor_id: context.userId,
      action: "user_deleted",
      target_user_id: data.userId,
      detail: { email: prof?.email ?? null },
    });
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listSystemAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    const admin = await db();
    const { data, error } = await admin
      .from("system_audit_log")
      .select("id, actor_id, action, target_user_id, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id as string,
      action: r.action as string,
      targetUserId: (r.target_user_id as string | null) ?? null,
      detail: r.detail ? JSON.stringify(r.detail) : null,
      at: r.created_at as string,
    }));
  });
