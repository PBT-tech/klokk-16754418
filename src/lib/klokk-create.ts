// Pure helpers for the create-event flow. No React, no store — safe anywhere.

import type { KlokkEvent, NamedParticipant, ParticipationMode, TimeSlot } from "./klokk-types";
import { toISODate } from "./klokk-format";

export type Draft = {
  title: string;
  description: string;
  location: string;
  slots: TimeSlot[];
  participationMode: ParticipationMode;
  minimumCount: number;
  namedParticipants: NamedParticipant[];
  deadline: string; // ISO
};

export function emptyDraft(): Draft {
  return {
    title: "",
    description: "",
    location: "",
    slots: [],
    participationMode: "minimum",
    minimumCount: 5,
    namedParticipants: [],
    deadline: new Date(Date.now() + 86_400_000 * 3).toISOString(),
  };
}

export function sortSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );
}

export function makeSlot(date: Date | undefined, start: string, end: string): TimeSlot | null {
  if (!date) return null;
  if (start >= end) return null;
  const iso = toISODate(date);
  return {
    id: `slot_${iso}_${start.replace(":", "")}_${end.replace(":", "")}`,
    date: iso,
    startTime: start,
    endTime: end,
  };
}

export function toLocalInput(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  const local = new Date(d.getTime() - tz);
  return local.toISOString().slice(0, 16);
}

export const CREATE_STEPS = [
  "Details",
  "Time slots",
  "Participants",
  "Deadline",
  "Review",
] as const;

const DAY_MS = 86_400_000;

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = Date.UTC(y!, (m ?? 1) - 1, d ?? 1) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * A starting point for "Duplicate this event". Everything is copied except the responses and
 * the share links. If the old times are in the past they move forward by whole weeks, so a
 * weekly meeting lands on the same weekday and time next week. The organiser can still change
 * anything before the new event is created.
 */
export function draftFromEvent(source: KlokkEvent, now: Date = new Date()): Draft {
  const base = emptyDraft();
  const today = toISODate(now);
  const tomorrow = shiftDate(today, 1);
  const earliest = source.slots.map((s) => s.date).sort()[0];
  let shift = 0;
  if (earliest && earliest < tomorrow) {
    const [ey, em, ed] = earliest.split("-").map(Number);
    const [ty, tm, td] = tomorrow.split("-").map(Number);
    const gap = Math.round(
      (Date.UTC(ty!, (tm ?? 1) - 1, td ?? 1) - Date.UTC(ey!, (em ?? 1) - 1, ed ?? 1)) / DAY_MS,
    );
    shift = Math.ceil(gap / 7) * 7;
  }
  const slots = source.slots.map((s) => {
    const date = shiftDate(s.date, shift);
    return {
      id: `slot_${date}_${s.startTime.replace(":", "")}_${s.endTime.replace(":", "")}`,
      date,
      startTime: s.startTime,
      endTime: s.endTime,
    };
  });
  return {
    ...base,
    title: `${source.title} (copy)`.slice(0, 200),
    description: source.description ?? "",
    location: source.location ?? "",
    slots: sortSlots(slots),
    participationMode: source.participationMode,
    minimumCount: source.minimumCount ?? base.minimumCount,
    namedParticipants: source.namedParticipants.map((p) => ({
      ...p,
      id: `np_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    })),
  };
}
