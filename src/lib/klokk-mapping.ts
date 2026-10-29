// Pure DB-row → UI-type mappers. No secrets, safe for client and server.

import {
  DEFAULT_EMBED_SETTINGS,
  DEFAULT_NOTIFICATION_PREFS,
  type ChatMessage,
  type KlokkAccount,
  type KlokkEvent,
  type NamedParticipant,
  type ParticipantResponse,
  type SmsUsageEntry,
  type TimeSlot,
} from "./klokk-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapSlot(r: any): TimeSlot {
  return { id: r.id, date: r.date, startTime: r.start_time, endTime: r.end_time };
}

export function mapNamed(r: any): NamedParticipant {
  return { id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email };
}

export function mapResponse(r: any): ParticipantResponse {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    slotIds: r.slot_ids ?? [],
    submittedAt: r.submitted_at,
  };
}

export function mapChat(r: any): ChatMessage {
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

export function mapEvent(row: any): KlokkEvent {
  return {
    id: row.id,
    token: row.token,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    slots: (row.time_slots ?? []).map(mapSlot),
    participationMode: row.participation_mode,
    minimumCount: row.minimum_count ?? undefined,
    namedParticipants: (row.named_participants ?? []).map(mapNamed),
    deadline: row.deadline,
    responses: (row.participant_responses ?? []).map(mapResponse),
    chat: (row.chat_messages ?? []).map(mapChat),
    status: row.status,
    confirmedSlotId: row.confirmed_slot_id ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? undefined,
  };
}

export function mapSmsUsage(r: any): SmsUsageEntry {
  return {
    id: r.id,
    date: r.date,
    recipient: r.recipient,
    eventId: r.event_id ?? "",
    eventTitle: r.event_title ?? "",
    type: r.type,
    credits: r.credits,
  };
}

export function mapProfile(row: any, usage: any[]): KlokkAccount {
  return {
    id: row.id,
    email: row.email ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    emailVerified: row.email_verified ?? false,
    createdAt: row.created_at,
    plan: row.plan ?? "free",
    smsCredits: row.sms_credits ?? 0,
    smsAutoTopUp: row.sms_auto_top_up ?? false,
    smsLowBalanceThreshold: row.sms_low_balance_threshold ?? 50,
    smsUsageLog: (usage ?? []).map(mapSmsUsage),
    notificationPrefs: row.notification_prefs ?? DEFAULT_NOTIFICATION_PREFS,
    embedSettings: row.embed_settings ?? DEFAULT_EMBED_SETTINGS,
  };
}
