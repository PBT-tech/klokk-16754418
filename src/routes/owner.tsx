import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteSystemUser,
  useSession,
  useSetUserPlan,
  useSystemAudit,
  useSystemRole,
  useSystemUsers,
} from "@/lib/klokk-hooks";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [{ title: "System owner — Klokk" }, { name: "robots", content: "noindex" }],
  }),
  component: OwnerPage,
});

const PLANS = ["free", "casual", "organiser", "teams"] as const;
type Plan = (typeof PLANS)[number];

function OwnerPage() {
  const session = useSession();
  const navigate = useNavigate();
  const role = useSystemRole(!!session);
  const isOwner = role.data?.role === "owner";
  const users = useSystemUsers(isOwner);
  const audit = useSystemAudit(isOwner);
  const setPlan = useSetUserPlan();
  const del = useDeleteSystemUser();
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | Plan>("all");

  useEffect(() => {
    if (!session) navigate({ to: "/signin" });
  }, [session, navigate]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users.data ?? []).filter(
      (u) =>
        (planFilter === "all" || u.plan === planFilter) &&
        (!term || u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term)),
    );
  }, [users.data, q, planFilter]);

  if (!session || role.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Loading…</div>
    );
  }
  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-foreground">Not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for the owner of the Klokk system.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const all = users.data ?? [];
  const count = (p: Plan) => all.filter((u) => u.plan === p).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        System owner
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Users and plans across all of Klokk. Changes here are recorded in the audit log below.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Users" value={all.length} />
        {PLANS.map((p) => (
          <Stat key={p} label={p[0]!.toUpperCase() + p.slice(1)} value={count(p)} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Klokk marketing OK" value={all.filter((u) => u.marketingConsent).length} />
        <Stat label="CRM connected" value={all.filter((u) => u.crmConnected).length} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="max-w-xs bg-card text-card-foreground"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as "all" | Plan)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          aria-label="Filter by plan"
        >
          <option value="all">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {users.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading users…</p>
      ) : users.error ? (
        <p className="mt-6 text-sm text-destructive">Could not load users.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Events</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Klokk mktg</th>
                <th className="px-3 py-2">CRM</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium text-card-foreground">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email}
                      {u.systemRole ? ` · ${u.systemRole}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.plan}
                      disabled={setPlan.isPending}
                      onChange={(e) => {
                        const next = e.target.value as Plan;
                        if (!window.confirm(`Change ${u.email} from ${u.plan} to ${next}?`)) return;
                        setPlan.mutate(
                          { userId: u.id, plan: next },
                          {
                            onSuccess: () => toast.success("Plan updated"),
                            onError: (err) =>
                              toast.error(err instanceof Error ? err.message : "Could not update"),
                          },
                        );
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                      aria-label={`Plan for ${u.email}`}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">{u.eventsTotal}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2">{u.marketingConsent ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{u.crmConnected ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-right">
                    {!u.systemRole && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={del.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(`Permanently delete ${u.email} and all their events?`)
                          )
                            return;
                          del.mutate(u.id, {
                            onSuccess: () => toast.success("Account deleted"),
                            onError: (err) =>
                              toast.error(err instanceof Error ? err.message : "Could not delete"),
                          });
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-foreground">Audit log</h2>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {(audit.data ?? []).map((a) => (
          <li key={a.id}>
            {new Date(a.at).toLocaleString()}: {a.action.replace(/_/g, " ")}
            {a.detail ? ` ${a.detail}` : ""}
          </li>
        ))}
        {audit.data?.length === 0 && <li>Nothing recorded yet.</li>}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-semibold text-card-foreground">{value}</p>
    </div>
  );
}
