import type { KlokkPlanTier } from "@/lib/klokk-types";

const ROWS: {
  id: KlokkPlanTier;
  name: string;
  price: string;
  limit: string;
}[] = [
  {
    id: "free",
    name: "Free (Trial)",
    price: "$0 AUD",
    limit:
      "3 events in total, up to 35 participants per event. When an event has 35 participants, no one else can respond.",
  },
  {
    id: "casual",
    name: "Casual (Credit Packs)",
    price: "$25 AUD for 5 events · $45 AUD for 10 · $60 AUD for 15",
    limit:
      "Credits expire 3 months after purchase. 35 participants per event are included. Beyond 35 people can still respond and you are charged per event: $6.20 AUD for each extra block of 5 (36–50 participants), then $5.30 AUD per block from 51 up.",
  },
  {
    id: "organiser",
    name: "Organiser",
    price: "$17 AUD / month",
    limit:
      "Unlimited events, up to 80 participants per event. Pay annually and get 2 months free (10 months for 12).",
  },
  {
    id: "teams",
    name: "Teams",
    price: "$35 AUD / month, plus $8 AUD / month per extra seat",
    limit:
      "Unlimited events and unlimited participants. 3 organiser seats included. Annual billing: 10 months for 12.",
  },
];

/** Plain-language participant limits and prices for every plan, with the user's plan marked. */
export function PlanLimitsGuide({ currentPlan }: { currentPlan: KlokkPlanTier }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className="text-sm font-semibold text-card-foreground">
        How many participants can respond? It depends on your plan. All prices are in Australian
        dollars (AUD).
      </p>
      <ul className="mt-3 space-y-3">
        {ROWS.map((r) => {
          const current = r.id === currentPlan;
          return (
            <li
              key={r.id}
              className={`rounded-lg border p-3 text-sm ${current ? "border-primary/60 bg-primary/5" : "border-border"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-semibold text-card-foreground">{r.name}</span>
                {current && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Your plan
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-medium text-card-foreground">{r.price}</p>
              <p className="mt-1 text-muted-foreground">{r.limit}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">
        You can change plan any time in Settings → Plan &amp; billing.
      </p>
    </div>
  );
}
