// Organiser server functions — protected by requireSupabaseAuth (RLS-scoped
// to the signed-in organiser). Used for dashboard, event management, settings.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mapEvent, mapProfile } from "./klokk-mapping";
import { makeToken } from "./klokk-store";
import { participantCapForPlan } from "./klokk-limits";
import { eventsWarning } from "./klokk-warnings";
import {
  sendMeetingConfirmation,
  sendCancellation,
  sendReminder,
  sendInvitation,
  sendEventUpdated,
} from "./klokk-email";
import { isAllowedDomain } from "./klokk-domains";
import { toSlotLabel } from "./klokk-format";
import type { ChatMessage, KlokkEvent, NamedParticipant, TimeSlot } from "./klokk-types";

const EVENT_SELECT = `
  *,
  time_slots ( id, date, start_time, end_time ),
  named_participants ( id, first_name, last_name, email, avatar_url ),
  participant_responses ( id, first_name, last_name, email, phone, slot_ids, notes, avatar_url, submitted_at ),
  chat_messages ( id, author_name, author_email, is_organiser, text, pinned, created_at )
`;

function mapChat(r: any): ChatMessage {
  return {
    id: r.id,
    authorName: r.author_name,
    authorEmail: r.author_email ?? undefined,
    isOrganiser: r.is_organiser,
    text: r.text,
    pinned: r.pinned,
    createdAt: r.created_at,
  };
}

const channelSchema = z.object({ email: z.boolean(), sms: z.boolean() });
const notifPrefsSchema = z.object({
  eventUpdates: channelSchema,
  reminders: channelSchema,
  chatMessages: channelSchema,
});

// ---------- profile ----------

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    let row = profile;
    if (!row) {
      const { data: user } = await supabase.auth.getUser();
      const email = user?.user?.email ?? "";
      const { data: created, error: insErr } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          first_name: String(user?.user?.user_metadata?.["first_name"] ?? "").slice(0, 100),
          last_name: String(user?.user?.user_metadata?.["last_name"] ?? "").slice(0, 100),
          email_verified: !!user?.user?.email_confirmed_at,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      row = created;
    }
    // email_verified is derived from Supabase Auth. There is no database trigger on
    // auth.users for this (Cloud projects can't safely have one), so reconcile it here:
    // if Auth says the address is confirmed but the profile does not yet, set it with the
    // service role (the profile protection trigger blocks the user's own session).
    if (row && !row.email_verified) {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.id === userId && authUser.user.email_confirmed_at) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: syncErr } = await supabaseAdmin
          .from("profiles")
          .update({ email_verified: true })
          .eq("id", userId);
        if (!syncErr) row = { ...row, email_verified: true };
      }
    }
    const { data: usage } = await supabase
      .from("sms_usage")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(50);
    return mapProfile(row, usage ?? []);
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      avatarUrl: z.string().nullable().optional(),
      smsAutoTopUp: z.boolean().optional(),
      smsLowBalanceThreshold: z.number().optional(),
      notificationPrefs: notifPrefsSchema.optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = {};
    if (data.firstName !== undefined) patch["first_name"] = data.firstName;
    if (data.lastName !== undefined) patch["last_name"] = data.lastName;
    if (data.avatarUrl !== undefined) patch["avatar_url"] = data.avatarUrl;
    if (data.smsAutoTopUp !== undefined) patch["sms_auto_top_up"] = data.smsAutoTopUp;
    if (data.smsLowBalanceThreshold !== undefined)
      patch["sms_low_balance_threshold"] = data.smsLowBalanceThreshold;
    if (data.notificationPrefs !== undefined) patch["notification_prefs"] = data.notificationPrefs;
    const { error } = await supabase
      .from("profiles")
      .update(patch as any)
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- events ----------

export const getMyEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapEvent);
  });

export const getMyEvent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", data.id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    return mapEvent(row);
  });

const slotSchema = z.object({
  id: z.string().max(64),
  date: z.string().max(10),
  startTime: z.string().max(5),
  endTime: z.string().max(5),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** time_slots.id is a global primary key: add a random part so identical times never collide. */
function uniqueSlotId(s: { date: string; startTime: string; endTime: string }): string {
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return `slot_${s.date}_${s.startTime.replace(":", "")}_${s.endTime.replace(":", "")}_${rand}`;
}
const namedSchema = z.object({
  id: z.string().max(64),
  firstName: z.string().max(100),
  lastName: z.string().max(100),
  email: z.string().email().max(254),
  avatarUrl: z.string().max(2000).startsWith("https://").optional(),
});

export const createMyEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      location: z.string().max(300).optional(),
      participationMode: z.enum(["minimum", "named"]),
      minimumCount: z.number().int().min(1).max(10000).optional(),
      deadline: z.string().max(40),
      slots: z.array(slotSchema).max(200),
      namedParticipants: z.array(namedSchema).max(200),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Server-side plan check (the database trigger enforces the same limits).
    const { data: prof } = await supabase
      .from("profiles")
      .select("plan, email_verified")
      .eq("id", userId)
      .maybeSingle();
    if (!prof?.email_verified) {
      throw new Error("Please verify your email address before creating an event.");
    }
    const cap = participantCapForPlan(prof.plan);
    if (cap !== null && data.namedParticipants.length > cap) {
      throw new Error(`Your plan allows up to ${cap} participants per event.`);
    }
    if (cap !== null && data.participationMode === "minimum" && (data.minimumCount ?? 1) > cap) {
      throw new Error(`Your plan allows up to ${cap} participants per event.`);
    }
    const token = makeToken();
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        token,
        owner_id: userId,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        participation_mode: data.participationMode,
        minimum_count: data.participationMode === "minimum" ? (data.minimumCount ?? 1) : null,
        deadline: data.deadline,
        status: "awaiting_responses",
      })
      .select("*")
      .single();
    if (error) throw error;

    const eventId = event.id;

    if (data.slots.length > 0) {
      const { error: sErr } = await supabase.from("time_slots").insert(
        data.slots.map((s: TimeSlot) => ({
          // time_slots.id is unique across ALL events, so two organisers offering the same
          // date and time would collide. Make every id unique.
          id: uniqueSlotId(s),
          event_id: eventId,
          date: s.date,
          start_time: s.startTime,
          end_time: s.endTime,
        })),
      );
      if (sErr) throw sErr;
    }

    if (data.participationMode === "named" && data.namedParticipants.length > 0) {
      const { error: nErr } = await supabase.from("named_participants").insert(
        data.namedParticipants.map((p) => ({
          id: p.id,
          event_id: eventId,
          first_name: p.firstName,
          last_name: p.lastName,
          email: p.email,
          avatar_url: p.avatarUrl ?? null,
        })),
      );
      if (nErr) throw nErr;
    }

    const { data: full } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", eventId)
      .single();

    // Email a heads-up when the free event allowance is nearly or fully used.
    try {
      const { data: after } = await (supabase as any)
        .from("profiles")
        .select("plan, events_created")
        .eq("id", userId)
        .maybeSingle();
      const warning = eventsWarning({
        plan: after?.plan ?? "free",
        eventsCreated: after?.events_created ?? 0,
        creditsLeft: 99,
        nextExpiry: null,
      });
      if (warning && after?.plan === "free") {
        const { maybeSendWarning } = await import("./klokk-notify.server");
        await maybeSendWarning({ userId, warning, period: String(after.events_created) });
      }
    } catch {
      /* warnings are best-effort */
    }

    // F3: send invitation emails to named participants on creation.
    if (data.participationMode === "named" && data.namedParticipants.length > 0) {
      try {
        const mapped: KlokkEvent = mapEvent(full ?? event);
        const { data: owner } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", userId)
          .maybeSingle();
        const organiserName =
          owner && (owner.first_name || owner.last_name)
            ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
            : "Your organiser";
        const origin = await (await import("./klokk-origin.server")).appOrigin();
        for (const p of mapped.namedParticipants) {
          await sendInvitation({
            recipientEmail: p.email,
            recipientFirstName: p.firstName,
            recipientLastName: p.lastName,
            event: mapped,
            organiserName,
            origin,
          });
        }
      } catch {
        /* invitations are best-effort */
      }
    }

    return mapEvent(full ?? event);
  });

export const updateMyEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string(),
      status: z
        .enum([
          "awaiting_responses",
          "ready_to_confirm",
          "confirmed",
          "expired",
          "cancelled",
          "closed",
        ])
        .optional(),
      confirmedSlotId: z.string().nullable().optional(),
      confirmedCustomDate: z.string().nullable().optional(),
      confirmedCustomStart: z.string().nullable().optional(),
      confirmedCustomEnd: z.string().nullable().optional(),
      confirmedAt: z.string().nullable().optional(),
      deadline: z.string().optional(),
      closedAt: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: before } = await supabase
      .from("events")
      .select("status")
      .eq("id", data.id)
      .eq("owner_id", userId)
      .maybeSingle();
    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) patch["status"] = data.status;
    if (data.confirmedSlotId !== undefined) patch["confirmed_slot_id"] = data.confirmedSlotId;
    if (data.confirmedCustomDate !== undefined)
      patch["confirmed_custom_date"] = data.confirmedCustomDate;
    if (data.confirmedCustomStart !== undefined)
      patch["confirmed_custom_start"] = data.confirmedCustomStart;
    if (data.confirmedCustomEnd !== undefined)
      patch["confirmed_custom_end"] = data.confirmedCustomEnd;
    if (data.confirmedAt !== undefined) patch["confirmed_at"] = data.confirmedAt;
    if (data.deadline !== undefined) {
      patch["deadline"] = data.deadline;
      // Extending the deadline of an auto-expired event re-opens it for responses.
      if (data.status === undefined && new Date(data.deadline).getTime() > Date.now()) {
        const { data: current } = await supabase
          .from("events")
          .select("status")
          .eq("id", data.id)
          .eq("owner_id", userId)
          .maybeSingle();
        if (current?.status === "expired") {
          patch["status"] = "awaiting_responses";
          patch["reminder_sent_at"] = null;
        }
      }
    }
    if (data.closedAt !== undefined) patch["closed_at"] = data.closedAt;
    const { data: row, error } = await supabase
      .from("events")
      .update(patch as any)
      .eq("id", data.id)
      .eq("owner_id", userId)
      .select(EVENT_SELECT)
      .single();
    if (error) throw error;
    const event: KlokkEvent = mapEvent(row);

    // F6/F7/F9: trigger branded emails on confirm / cancel.
    try {
      const { data: owner } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();
      const organiserName =
        owner && (owner.first_name || owner.last_name)
          ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
          : "Your organiser";
      const origin = await (await import("./klokk-origin.server")).appOrigin();

      if (data.status === "confirmed" && before?.status !== "confirmed") {
        // Casual organisers are invoiced for participants above the 35 included.
        const { invoiceOverage } = await import("./klokk-notify.server");
        await invoiceOverage(event.id);
        // Notify every participant who responded (and named participants who didn't).
        const recipients = new Map<string, { first: string; last: string }>();
        for (const r of event.responses) {
          recipients.set(r.email.toLowerCase(), { first: r.firstName, last: r.lastName });
        }
        for (const n of event.namedParticipants) {
          if (!recipients.has(n.email.toLowerCase())) {
            recipients.set(n.email.toLowerCase(), { first: n.firstName, last: n.lastName });
          }
        }
        for (const [email, { first, last }] of recipients) {
          await sendMeetingConfirmation({
            recipientEmail: email,
            recipientFirstName: first,
            recipientLastName: last,
            event,
            organiserName,
            origin,
          });
        }
      } else if (data.status === "cancelled" && before?.status !== "cancelled") {
        const recipients = new Map<string, { first: string; last: string }>();
        for (const r of event.responses) {
          recipients.set(r.email.toLowerCase(), { first: r.firstName, last: r.lastName });
        }
        for (const n of event.namedParticipants) {
          if (!recipients.has(n.email.toLowerCase())) {
            recipients.set(n.email.toLowerCase(), { first: n.firstName, last: n.lastName });
          }
        }
        for (const [email, { first, last }] of recipients) {
          await sendCancellation({
            recipientEmail: email,
            recipientFirstName: first,
            recipientLastName: last,
            event,
            organiserName,
            origin,
          });
        }
      }
    } catch {
      /* notifications are best-effort */
    }

    return event;
  });

/**
 * Organiser edits an event's details and the time slots people can pick from.
 * Text can be changed while the event is open. Slots can be added or removed until the
 * event is confirmed, cancelled or closed; removing a slot also removes it from the
 * answers of anyone who had picked it.
 */
export const editMyEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string().max(64),
      title: z.string().trim().min(1).max(200),
      description: z.string().max(2000),
      location: z.string().max(300),
      addSlots: z
        .array(
          z.object({
            date: z.string().regex(DATE_RE),
            startTime: z.string().regex(TIME_RE),
            endTime: z.string().regex(TIME_RE),
          }),
        )
        .max(200),
      removeSlotIds: z.array(z.string().max(80)).max(200),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", data.id)
      .eq("owner_id", userId)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev) throw new Error("Event not found");
    const before: KlokkEvent = mapEvent(ev);

    const changingSlots = data.addSlots.length > 0 || data.removeSlotIds.length > 0;
    if (changingSlots && ["confirmed", "cancelled", "closed"].includes(ev.status)) {
      throw new Error(
        "Time slots can't be changed once an event is confirmed, closed or cancelled.",
      );
    }
    for (const a of data.addSlots) {
      if (a.startTime >= a.endTime)
        throw new Error("Each slot's start time must be before its end time.");
    }

    const existing = new Set(before.slots.map((t) => t.id));
    const toRemove = data.removeSlotIds.filter((id) => existing.has(id));
    const finalCount = existing.size - toRemove.length + data.addSlots.length;
    if (finalCount < 1) throw new Error("An event needs at least one time slot.");
    if (finalCount > 200) throw new Error("An event can have at most 200 time slots.");

    // Add before removing so a failure never leaves the event without slots.
    if (data.addSlots.length > 0) {
      const { error } = await supabase.from("time_slots").insert(
        data.addSlots.map((a) => ({
          id: uniqueSlotId(a),
          event_id: ev.id,
          date: a.date,
          start_time: a.startTime,
          end_time: a.endTime,
        })),
      );
      if (error) throw error;
    }
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("event_id", ev.id)
        .in("id", toRemove);
      if (error) throw error;
      // Take the removed slots out of participants' answers. Participants can't be edited
      // with the organiser's own session, so this uses the server-only key (ownership
      // was verified above).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: answers } = await supabaseAdmin
        .from("participant_responses")
        .select("id, slot_ids")
        .eq("event_id", ev.id)
        .overlaps("slot_ids", toRemove);
      for (const r of answers ?? []) {
        await supabaseAdmin
          .from("participant_responses")
          .update({
            slot_ids: ((r.slot_ids ?? []) as string[]).filter((x) => !toRemove.includes(x)),
          })
          .eq("id", r.id);
      }
    }

    const { data: row, error } = await supabase
      .from("events")
      .update({
        title: data.title,
        description: data.description.trim() || null,
        location: data.location.trim() || null,
      })
      .eq("id", ev.id)
      .eq("owner_id", userId)
      .select(EVENT_SELECT)
      .single();
    if (error) throw error;
    const after: KlokkEvent = mapEvent(row);

    // Email everyone involved, in detail, about what changed (best-effort).
    try {
      await notifyEventEdited({ supabase, userId, before, after, removedIds: toRemove });
    } catch {
      /* notifications are best-effort */
    }
    return after;
  });

/** Plain-text list of what the organiser changed, or "" when nothing visible changed. */
function describeChanges(before: KlokkEvent, after: KlokkEvent): string[] {
  const lines: string[] = [];
  if (before.title !== after.title) lines.push(`Title: "${before.title}" is now "${after.title}"`);
  if ((before.description ?? "") !== (after.description ?? "")) {
    lines.push(
      after.description
        ? `Description updated. It now reads: ${after.description}`
        : "Description removed.",
    );
  }
  if ((before.location ?? "") !== (after.location ?? "")) {
    lines.push(
      after.location
        ? `Location: "${before.location || "not set"}" is now "${after.location}"`
        : "Location removed.",
    );
  }
  const label = (s: TimeSlot) => toSlotLabel(s.date, s.startTime, s.endTime);
  const key = (s: TimeSlot) => `${s.date}|${s.startTime}|${s.endTime}`;
  const oldKeys = new Set(before.slots.map(key));
  const newKeys = new Set(after.slots.map(key));
  const addedSlots = after.slots.filter((s) => !oldKeys.has(key(s))).map(label);
  const removedSlots = before.slots.filter((s) => !newKeys.has(key(s))).map(label);
  if (addedSlots.length) lines.push(`New times you can pick: ${addedSlots.join("; ")}`);
  if (removedSlots.length) lines.push(`Times no longer available: ${removedSlots.join("; ")}`);
  return lines;
}

async function notifyEventEdited(args: {
  supabase: any;
  userId: string;
  before: KlokkEvent;
  after: KlokkEvent;
  removedIds: string[];
}) {
  const { supabase, userId, before, after, removedIds } = args;
  const lines = describeChanges(before, after);
  if (lines.length === 0) return;

  const { data: owner } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", userId)
    .maybeSingle();
  const organiserName =
    owner && (owner.first_name || owner.last_name)
      ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
      : "Your organiser";
  const origin = await (await import("./klokk-origin.server")).appOrigin();

  type Who = { first: string; last: string; lostPick: boolean };
  const recipients = new Map<string, Who>();
  for (const n of after.namedParticipants) {
    recipients.set(n.email.toLowerCase(), {
      first: n.firstName,
      last: n.lastName,
      lostPick: false,
    });
  }
  for (const r of before.responses) {
    // Anyone who had picked a time that is now gone needs to choose again.
    const lostPick = r.slotIds.some((id) => removedIds.includes(id));
    recipients.set(r.email.toLowerCase(), { first: r.firstName, last: r.lastName, lostPick });
  }

  const send = (email: string, first: string, last: string, extra: string[], intro: string) =>
    sendEventUpdated({
      recipientEmail: email,
      recipientFirstName: first,
      recipientLastName: last,
      event: after,
      organiserName,
      origin,
      changes: [intro, ...lines.map((l) => `- ${l}`), ...extra].join("\n"),
    });

  const jobs: (() => Promise<unknown>)[] = [];
  for (const [email, w] of recipients) {
    jobs.push(() =>
      send(
        email,
        w.first,
        w.last,
        w.lostPick
          ? [
              "",
              "One of the times you picked is no longer available. Please open your link and choose again.",
            ]
          : [],
        `${organiserName} has updated "${after.title}":`,
      ),
    );
  }
  // A copy for the organiser, as a record of what was sent.
  if (owner?.email && !recipients.has(String(owner.email).toLowerCase())) {
    jobs.push(() =>
      send(
        owner.email,
        owner.first_name ?? "",
        owner.last_name ?? "",
        [
          "",
          `This update was emailed to ${recipients.size} participant${recipients.size === 1 ? "" : "s"}.`,
        ],
        `You updated "${after.title}":`,
      ),
    );
  }
  for (let i = 0; i < jobs.length; i += 10) {
    await Promise.allSettled(jobs.slice(i, i + 10).map((j) => j()));
  }
}

export const deleteMyEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const addChatMessageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      eventId: z.string(),
      authorName: z.string(),
      authorEmail: z.string().optional(),
      text: z.string().min(1),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", data.eventId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev) throw new Error("Event not found");
    const { data: row, error } = await supabase
      .from("chat_messages")
      .insert({
        event_id: data.eventId,
        author_name: data.authorName,
        author_email: data.authorEmail ?? null,
        is_organiser: true,
        text: data.text,
        pinned: false,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapChat(row);
  });

export const togglePinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ eventId: z.string(), messageId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id")
      .eq("id", data.eventId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (evErr) throw evErr;
    if (!ev) throw new Error("Event not found");
    const { data: msg, error } = await supabase
      .from("chat_messages")
      .select("pinned")
      .eq("id", data.messageId)
      .eq("event_id", data.eventId)
      .maybeSingle();
    if (error) throw error;
    if (!msg) throw new Error("Message not found");
    const pinnedCount = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.eventId)
      .eq("pinned", true);
    if (pinnedCount.error) throw pinnedCount.error;
    if (!msg.pinned && (pinnedCount.count ?? 0) >= 3) {
      throw new Error("Maximum of 3 pinned messages");
    }
    const { data: updated, error: upErr } = await supabase
      .from("chat_messages")
      .update({ pinned: !msg.pinned })
      .eq("id", data.messageId)
      .select("*")
      .single();
    if (upErr) throw upErr;
    return mapChat(updated);
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Deleting the sign-in account removes the profile, events, responses, credit packs
    // and embeds with it (they all cascade from auth.users). Only the server may do this.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("We couldn't delete your account. Please try again or contact us.");
    return { ok: true };
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ prefs: notifPrefsSchema }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: data.prefs })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const updateEmbedSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      settings: z.object({
        accentOverride: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        domainAllowlist: z
          .array(z.string().refine(isAllowedDomain, "Not an allowed website entry"))
          .max(25),
        embedExpiry: z.string().max(40).optional(),
      }),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ embed_settings: data.settings })
      .eq("id", userId);
    if (error) throw error;
    return { ok: true };
  });

// F3: send invitation emails to named participants on event creation.
export const sendInvitationsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", data.eventId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Event not found");
    const event: KlokkEvent = mapEvent(row);
    if (event.participationMode !== "named" || event.namedParticipants.length === 0) {
      return { sent: 0 };
    }
    const { data: owner } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    const organiserName =
      owner && (owner.first_name || owner.last_name)
        ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
        : "Your organiser";
    const origin = await (await import("./klokk-origin.server")).appOrigin();
    let sent = 0;
    for (const p of event.namedParticipants) {
      try {
        await sendInvitation({
          recipientEmail: p.email,
          recipientFirstName: p.firstName,
          recipientLastName: p.lastName,
          event,
          organiserName,
          origin,
        });
        sent++;
      } catch {
        /* best-effort */
      }
    }
    return { sent };
  });

// F7: reminder to outstanding named participants (organiser-triggered).
export const sendReminderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("id", data.eventId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Event not found");
    const event: KlokkEvent = mapEvent(row);
    if (event.participationMode !== "named") {
      return { sent: 0 };
    }
    const respondedEmails = new Set(event.responses.map((r) => r.email.toLowerCase()));
    const outstanding = event.namedParticipants.filter(
      (p) => !respondedEmails.has(p.email.toLowerCase()),
    );
    if (outstanding.length === 0) return { sent: 0 };
    const { data: owner } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    const organiserName =
      owner && (owner.first_name || owner.last_name)
        ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim()
        : "Your organiser";
    const origin = await (await import("./klokk-origin.server")).appOrigin();
    let sent = 0;
    for (const p of outstanding) {
      try {
        await sendReminder({
          recipientEmail: p.email,
          recipientFirstName: p.firstName,
          recipientLastName: p.lastName,
          event,
          organiserName,
          origin,
        });
        sent++;
      } catch {
        /* best-effort */
      }
    }
    return { sent };
  });

// ---------- embed widget (F10) ----------

export interface EmbedLink {
  id: string;
  eventId: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  views: number;
  interactions: number;
  submissions: number;
}

export const listEmbeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const db = supabase as any;
    const { data: rows, error } = await db
      .from("embed_tokens")
      .select("id, event_id, created_at, expires_at, revoked_at, events ( token )")
      .eq("event_id", data.eventId)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { signEmbed } = await import("./klokk-embed.server");
    const out: EmbedLink[] = [];
    for (const r of rows ?? []) {
      const { data: ev } = await db.from("embed_events").select("kind").eq("embed_id", r.id);
      const kinds: string[] = (ev ?? []).map((e: any) => e.kind);
      out.push({
        id: r.id,
        eventId: r.event_id,
        token: await signEmbed({ i: r.id }),
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        revokedAt: r.revoked_at,
        views: kinds.filter((k) => k === "view").length,
        interactions: kinds.filter((k) => k === "interaction").length,
        submissions: kinds.filter((k) => k === "submit").length,
      });
    }
    return out;
  });

export const createEmbed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      eventId: z.string(),
      /** days until the link stops working; omit to keep it valid until the event is removed */
      expiresInDays: z.number().int().min(1).max(730).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const db = supabase as any;
    const { data: ev } = await db
      .from("events")
      .select("id, token")
      .eq("id", data.eventId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!ev) throw new Error("Event not found");
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString()
      : null;
    const { data: row, error } = await db
      .from("embed_tokens")
      .insert({ event_id: ev.id, owner_id: userId, expires_at: expiresAt })
      .select("id")
      .single();
    if (error) throw error;
    const { signEmbed } = await import("./klokk-embed.server");
    return { id: row.id as string, token: await signEmbed({ i: row.id }) };
  });

export const revokeEmbed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase as any)
      .from("embed_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw error;
    return { ok: true };
  });
