import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { CreateEventFlow } from "@/components/klokk/create-event-flow";
import { draftFromEvent } from "@/lib/klokk-create";
import { useCurrentAccount, useEventById, useSession } from "@/lib/klokk-hooks";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Create an event — Klokk" },
      {
        name: "description",
        content: "Create a new scheduling event and share it with participants.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { from?: string } =>
    typeof search["from"] === "string" ? { from: search["from"] } : {},
  component: CreateEvent,
});

function CreateEvent() {
  const session = useSession();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  // "Duplicate" sends people here as /events/new?from=<event id>.
  const fromId = Route.useSearch().from ?? null;
  const source = useEventById(fromId ?? undefined);
  const initial = useMemo(() => (source ? draftFromEvent(source) : undefined), [source]);

  useEffect(() => {
    if (!session) navigate({ to: "/signin" });
  }, [session, navigate]);

  if (!session || !account) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  if (fromId && !source) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">
        Getting your event ready…
      </div>
    );
  }

  return (
    <CreateEventFlow
      key={source?.id ?? "new"}
      account={account}
      {...(initial ? { initial } : {})}
      {...(source ? { copyFrom: source } : {})}
    />
  );
}
