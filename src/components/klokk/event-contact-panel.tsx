import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrmStatus, useSetEventContactSettings } from "@/lib/klokk-hooks";
import type { KlokkAccount, KlokkEvent } from "@/lib/klokk-types";

/**
 * Per event: which of the organiser's saved CRMs receives participants who tick
 * "the organiser may contact me", and an optional host name for the tick box.
 * Organiser and Teams plans only.
 */
export function EventContactPanel({
  event,
  account,
}: {
  event: KlokkEvent;
  account: KlokkAccount;
}) {
  const status = useCrmStatus();
  const save = useSetEventContactSettings();
  const [connectionId, setConnectionId] = useState(event.crmConnectionId ?? "");
  const [hostName, setHostName] = useState(event.hostName ?? "");
  useEffect(() => setConnectionId(event.crmConnectionId ?? ""), [event.crmConnectionId]);
  useEffect(() => setHostName(event.hostName ?? ""), [event.hostName]);

  if (account.plan !== "organiser" && account.plan !== "teams") {
    return (
      <p className="text-sm text-muted-foreground">
        Choosing a CRM for each event is included with the Organiser and Teams monthly plans.
      </p>
    );
  }
  if (status.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const conns = status.data?.connections ?? [];
  const def = conns.find((c) => c.isDefault);

  if (conns.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p className="font-medium text-card-foreground">No CRM connected yet</p>
        <p className="mt-1">
          Add your HighLevel details so people who tick "may contact me" on this event are added to
          your CRM.
        </p>
        <Link
          to="/settings"
          className="mt-3 inline-block text-primary underline-offset-4 hover:underline"
        >
          Add CRM details in Settings → Integrations
        </Link>
      </div>
    );
  }

  const dirty =
    connectionId !== (event.crmConnectionId ?? "") || hostName.trim() !== (event.hostName ?? "");

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-card-foreground" htmlFor="event-crm">
          Send contacts who tick the box to
        </label>
        <select
          id="event-crm"
          value={connectionId}
          onChange={(e) => setConnectionId(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">My default{def ? ` (${def.label})` : ""}</option>
          {conns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-card-foreground" htmlFor="event-host">
          Host name (optional)
        </label>
        <Input
          id="event-host"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          maxLength={80}
          placeholder="For example Acme Partners"
          className="bg-background text-foreground"
        />
        <p className="text-sm text-muted-foreground">
          Shown in the tick box instead of "the organiser of this event". Use it when you run the
          event with or for someone else, and connect their CRM above.
        </p>
      </div>
      <Button
        type="button"
        disabled={!dirty || save.isPending}
        onClick={() =>
          save.mutate(
            {
              eventId: event.id,
              connectionId: connectionId || null,
              hostName: hostName.trim() || null,
            },
            {
              onSuccess: () => toast.success("Saved"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
            },
          )
        }
      >
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
