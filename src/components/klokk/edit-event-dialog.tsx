import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlotsStep } from "@/components/klokk/create-event-slots";
import { emptyDraft, sortSlots, type Draft } from "@/lib/klokk-create";
import { toSlotLabel } from "@/lib/klokk-format";
import { useEditEvent } from "@/lib/klokk-hooks";
import type { KlokkEvent, TimeSlot } from "@/lib/klokk-types";

const keyOf = (s: { date: string; startTime: string; endTime: string }) =>
  `${s.date}|${s.startTime}|${s.endTime}`;

/** Slots are compared by date and time, so removing then re-adding the same time keeps its votes. */
const draftSlot = (s: TimeSlot): TimeSlot => ({
  ...s,
  id: `slot_${s.date}_${s.startTime.replace(":", "")}_${s.endTime.replace(":", "")}`,
});

/** Edit an open event's title, description, location and the times people can pick from. */
export function EditEventDialog({ event }: { event: KlokkEvent }) {
  const edit = useEditEvent();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [confirmRemoval, setConfirmRemoval] = useState(false);

  // Time slots can't change once the meeting time is decided.
  const slotsLocked = ["confirmed", "cancelled", "closed"].includes(event.status);

  const reset = () => {
    setTitle(event.title);
    setDescription(event.description ?? "");
    setLocation(event.location ?? "");
    setDraft({ ...emptyDraft(), slots: sortSlots(event.slots.map(draftSlot)) });
    setConfirmRemoval(false);
  };

  const original = useMemo(() => new Map(event.slots.map((s) => [keyOf(s), s])), [event.slots]);
  const current = useMemo(() => new Map(draft.slots.map((s) => [keyOf(s), s])), [draft.slots]);
  const added = [...current.entries()].filter(([k]) => !original.has(k)).map(([, s]) => s);
  const removed = [...original.entries()].filter(([k]) => !current.has(k)).map(([, s]) => s);
  const affected = removed
    .map((s) => ({
      slot: s,
      people: event.responses.filter((r) => r.slotIds.includes(s.id)).length,
    }))
    .filter((x) => x.people > 0);

  const save = () => {
    if (!title.trim()) {
      toast.error("The event needs a title");
      return;
    }
    if (current.size < 1) {
      toast.error("Keep at least one time slot");
      return;
    }
    if (affected.length > 0 && !confirmRemoval) {
      setConfirmRemoval(true);
      return;
    }
    edit.mutate(
      {
        id: event.id,
        title: title.trim(),
        description,
        location,
        addSlots: added.map((s) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })),
        removeSlotIds: removed.map((s) => s.id),
      },
      {
        onSuccess: () => {
          toast.success("Event updated");
          setOpen(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save changes"),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>
            Change the details or the times people can pick from. Participants see the changes
            straight away, and everyone on the event is emailed a list of exactly what changed. You
            get a copy too.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-semibold">
              Event title
            </Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc" className="text-sm font-semibold">
              Description (optional)
            </Label>
            <Textarea
              id="edit-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-loc" className="text-sm font-semibold">
              Location or link (optional)
            </Label>
            <Input id="edit-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Time slots people can pick from</p>
            {slotsLocked ? (
              <p className="rounded-lg border border-border bg-surface/40 p-3 text-sm text-muted-foreground">
                Time slots can't be changed once an event is confirmed, closed or cancelled.
              </p>
            ) : (
              <SlotsStep
                draft={draft}
                set={(key, value) => {
                  setConfirmRemoval(false);
                  setDraft((d) => ({ ...d, [key]: value }));
                }}
              />
            )}
          </div>

          {!slotsLocked && (added.length > 0 || removed.length > 0) && (
            <p className="text-xs text-muted-foreground" role="status">
              {added.length > 0 && `${added.length} time${added.length === 1 ? "" : "s"} added. `}
              {removed.length > 0 &&
                `${removed.length} time${removed.length === 1 ? "" : "s"} removed. `}
              Changes are saved when you click Save changes.
            </p>
          )}

          {confirmRemoval && affected.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm"
            >
              <p className="font-semibold text-card-foreground">
                Some people have already picked times you are removing
              </p>
              <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                {affected.map(({ slot, people }) => (
                  <li key={slot.id}>
                    {toSlotLabel(slot.date, slot.startTime, slot.endTime)}: {people}{" "}
                    {people === 1 ? "person" : "people"}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">
                Their choice for those times is removed. They stay on the list and can answer again
                with the same link. Click Save changes again to continue.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={edit.isPending}>
            {confirmRemoval && affected.length > 0 ? "Save and remove those times" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
