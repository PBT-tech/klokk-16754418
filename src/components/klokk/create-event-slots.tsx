/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { makeSlot, sortSlots, type Draft } from "@/lib/klokk-create";
import { format12, toSlotLabel } from "@/lib/klokk-format";
import { TimePicker } from "@/components/klokk/time-picker";

export function SlotsStep({
  draft,
  set,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}) {
  const [mode, setMode] = useState<"range" | "single">("range");
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(),
    to: new Date(Date.now() + 86_400_000 * 4),
  });
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [skipWeekends, setSkipWeekends] = useState(false);

  const addSingleSlot = () => {
    const slot = makeSlot(singleDate, start, end);
    if (!slot) {
      toast.error("Start time must be before end time");
      return;
    }
    if (draft.slots.some((s) => s.id === slot.id)) {
      toast.error("That slot already exists");
      return;
    }
    set("slots", sortSlots([...draft.slots, slot]));
    toast.success(
      `Added ${toSlotLabel(slot.date, slot.startTime, slot.endTime)}. Change the times and add again for another option on the same date.`,
    );
  };

  const addRangeSlots = () => {
    if (!dateRange.from) {
      toast.error("Please pick a start date");
      return;
    }
    if (start >= end) {
      toast.error("Start time must be before end time");
      return;
    }
    const from = new Date(dateRange.from);
    const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    if (to < from) {
      toast.error("End date must be on or after start date");
      return;
    }

    const newSlots = [...draft.slots];
    let count = 0;
    const cur = new Date(from);
    // Normalize time to avoid DST issues
    cur.setHours(12, 0, 0, 0);
    const normalizedTo = new Date(to);
    normalizedTo.setHours(12, 0, 0, 0);

    while (cur <= normalizedTo) {
      const day = cur.getDay();
      if (!skipWeekends || (day !== 0 && day !== 6)) {
        const slot = makeSlot(cur, start, end);
        if (slot && !newSlots.some((s) => s.id === slot.id)) {
          newSlots.push(slot);
          count++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (count === 0) {
      toast.info("All slots for this range and time are already added");
      return;
    }

    set("slots", sortSlots(newSlots));
    toast.success(
      `Added ${count} option${count === 1 ? "" : "s"} (${format12(start)}–${format12(end)}). Change the times and add again to offer more times on the same dates.`,
    );
  };

  const byDate = groupByDate(draft.slots);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-border bg-surface/40 p-4 text-xs text-card-foreground">
        <p className="text-sm font-semibold">How to add times</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Pick a date (or a range of dates) on the calendar.</li>
          <li>
            Choose a <strong className="text-card-foreground">start</strong> and{" "}
            <strong className="text-card-foreground">end</strong> time. Use the AM / PM box to
            switch between morning and afternoon.
          </li>
          <li>
            Click <strong className="text-card-foreground">Add</strong>. The option appears in the
            list on the right.
          </li>
          <li>
            <strong className="text-card-foreground">
              Want more than one time on the same day?
            </strong>{" "}
            Change the start and end time, then click Add again. For example, add 9:00 AM–10:00 AM,
            then 2:00 PM–3:00 PM. Participants can say yes to any of them.
          </li>
        </ol>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-semibold text-card-foreground">Select date range</Label>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("range")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  mode === "range"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                Start &amp; end range
              </button>
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  mode === "single"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-card-foreground"
                }`}
              >
                Single date
              </button>
            </div>
          </div>

          {mode === "range" ? (
            <div>
              {}
              <Calendar
                mode="range"
                selected={dateRange as any}
                onSelect={(range: any) => setDateRange(range ?? { from: undefined, to: undefined })}
                className="rounded-xl border border-border p-3 bg-card"
              />
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  id="skip-weekends"
                  type="checkbox"
                  checked={skipWeekends}
                  onChange={(e) => setSkipWeekends(e.target.checked)}
                  className="size-4 rounded border-border text-primary accent-primary"
                />
                <label
                  htmlFor="skip-weekends"
                  className="cursor-pointer text-xs font-medium text-card-foreground select-none"
                >
                  Exclude Saturdays and Sundays
                </label>
              </div>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={singleDate}
              onSelect={(d) => setSingleDate(d ?? undefined)}
              className="rounded-xl border border-border p-3 bg-card"
            />
          )}

          <div className="mt-4 space-y-3">
            <TimePicker label="Start time" value={start} onChange={setStart} />
            <TimePicker label="End time" value={end} onChange={setEnd} />
          </div>
          {start >= end && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              The end time must be after the start time. Check AM and PM.
            </p>
          )}

          {mode === "range" ? (
            <Button className="mt-4 w-full" onClick={addRangeSlots} variant="default">
              <Plus className="size-4" />
              Add {format12(start)}–{format12(end)} on every date in the range
            </Button>
          ) : (
            <Button className="mt-4 w-full" onClick={addSingleSlot} variant="default">
              <Plus className="size-4" />
              Add{" "}
              {singleDate ? toSlotLabel(singleDate.toISOString().slice(0, 10), start, end) : "slot"}
            </Button>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-semibold text-card-foreground">
              Time options you are offering ({draft.slots.length})
            </Label>
            {draft.slots.length > 0 && (
              <button
                type="button"
                onClick={() => set("slots", [])}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          {draft.slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-muted-foreground">
              Nothing added yet. Follow the steps above: pick a date, choose a start and end time,
              then click Add.
            </div>
          ) : (
            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {byDate.map(([date, slots]) => (
                <div key={date}>
                  <p className="mb-1 text-xs font-semibold text-card-foreground">
                    {toSlotLabel(date, "00:00", "00:00").split(" · ")[0]}
                    {slots.length > 1 && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        · {slots.length} times
                      </span>
                    )}
                  </p>
                  <ul className="space-y-1.5">
                    {slots.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2 shadow-xs"
                      >
                        <span className="text-sm font-medium text-card-foreground">
                          {format12(s.startTime)}–{format12(s.endTime)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "slots",
                              draft.slots.filter((x) => x.id !== s.id),
                            )
                          }
                          className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remove ${toSlotLabel(s.date, s.startTime, s.endTime)}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByDate(slots: Draft["slots"]): [string, Draft["slots"]][] {
  const map = new Map<string, Draft["slots"]>();
  for (const s of slots) map.set(s.date, [...(map.get(s.date) ?? []), s]);
  return [...map.entries()];
}
