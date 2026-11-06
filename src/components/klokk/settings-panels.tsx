import { useEffect, useState } from "react";
import { CalendarClock, Globe, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentCheckoutBlock } from "@/integrations/payments";
import {
  useBilling,
  useClaimOrder,
  useConnectHighLevel,
  useConsentedContacts,
  useCrmStatus,
  useDisconnectCrm,
  useSetDefaultCrm,
  useUpdateEmbedSettings,
  useUpdateMarketingConsent,
} from "@/lib/klokk-hooks";
import { FREE_LIFETIME_EVENTS } from "@/lib/klokk-limits";
import { eventsWarning } from "@/lib/klokk-warnings";
import { LimitBanner } from "@/components/klokk/limit-banner";
import { DOMAIN_HELP, isAllowedDomain } from "@/lib/klokk-domains";
import type { KlokkAccount } from "@/lib/klokk-types";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-premium">
      <h2 className="font-display text-lg font-semibold text-card-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

const PLAN_LABEL: Record<string, string> = {
  free: "Free (Trial)",
  casual: "Casual (Credit Packs)",
  organiser: "Organiser",
  teams: "Teams",
};

const ORDER_KEY = "klokk-last-order";
const rememberOrder = (id: string) => {
  try {
    localStorage.setItem(ORDER_KEY, id);
  } catch {
    /* storage unavailable */
  }
};
const lastOrder = (): string | undefined => {
  try {
    return localStorage.getItem(ORDER_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};
const forgetOrder = () => {
  try {
    localStorage.removeItem(ORDER_KEY);
  } catch {
    /* storage unavailable */
  }
};

const PLANS = [
  {
    id: "free",
    name: "Free (Trial)",
    price: "$0 AUD",
    cta: "",
    points: [
      "3 events in total",
      "Up to 35 participants per event (no more can respond after that)",
      "1 organiser seat",
    ],
  },
  {
    id: "casual",
    name: "Casual (Credit Packs)",
    price: "$25 AUD for 5 events · $45 AUD for 10 · $60 AUD for 15",
    cta: "Buy a credit pack",
    points: [
      "Credits expire 3 months after purchase",
      "35 participants per event included (more are allowed, billed as overage)",
      "Extra participants: $6.20 AUD per block of 5 (36–50), then $5.30 AUD per block from 51, charged per event",
    ],
  },
  {
    id: "organiser",
    name: "Organiser",
    price: "$17 AUD / month",
    cta: "Choose Organiser",
    points: [
      "Unlimited events",
      "Up to 80 participants per event",
      "Annual: pay for 10 months, get 12",
    ],
  },
  {
    id: "teams",
    name: "Teams",
    price: "$35 AUD / month + $8 AUD / month per extra seat",
    cta: "Choose Teams",
    points: [
      "3 organiser seats included",
      "Unlimited events and participants",
      "Annual: pay for 10 months, get 12",
    ],
  },
] as const;

function cancelMailto(plan: string): string {
  const subject = encodeURIComponent("Klokk: change or cancel my plan");
  const body = encodeURIComponent(
    `Hi, please change or cancel my Klokk ${plan} plan at the end of my current billing period.\n\nMy account email: `,
  );
  return `mailto:info@platinumbusinessteams.com?subject=${subject}&body=${body}`;
}

export function BillingTab() {
  const billing = useBilling();
  const claim = useClaimOrder();
  const [open, setOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<string | undefined>(() => lastOrder());

  // HighLevel can take a few seconds to make a new order readable, so retry a few times.
  const claimWithRetry = async (orderId: string) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await claim.mutateAsync({ orderId });
        forgetOrder();
        setPendingOrder(undefined);
        toast.success("Payment confirmed — your plan has been updated");
        setOpen(false);
        return;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const retryable = /could not verify|not been paid|could not be read/i.test(msg);
        if (!retryable || attempt === 4) {
          setPendingOrder(orderId);
          toast.error(
            retryable
              ? "Payment received, but we couldn't confirm it yet. Use “Re-check my payment” in a minute."
              : msg || "We couldn't update your plan.",
          );
          setOpen(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      }
    }
  };

  if (!billing) {
    return <p className="text-sm text-muted-foreground">Loading your plan…</p>;
  }

  const freeLeft = Math.max(0, FREE_LIFETIME_EVENTS - billing.eventsCreated);
  const warning = eventsWarning(billing);

  return (
    <div className="space-y-8">
      <Card title="Your plan" subtitle="What you're on and what's left.">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-3">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium text-card-foreground">{PLAN_LABEL[billing.plan]}</dd>
          </div>
          {billing.plan === "free" && (
            <div className="flex justify-between border-b border-border/60 pb-3">
              <dt className="text-muted-foreground">Free events left</dt>
              <dd className="font-medium text-card-foreground">
                {freeLeft} of {FREE_LIFETIME_EVENTS}
              </dd>
            </div>
          )}
          {billing.plan === "casual" && (
            <div className="flex justify-between border-b border-border/60 pb-3">
              <dt className="text-muted-foreground">Event credits left</dt>
              <dd className="font-medium text-card-foreground">{billing.creditsLeft}</dd>
            </div>
          )}
          {(billing.plan === "organiser" || billing.plan === "teams") && (
            <>
              <div className="flex justify-between border-b border-border/60 pb-3">
                <dt className="text-muted-foreground">Billing</dt>
                <dd className="font-medium text-card-foreground">
                  {billing.billingInterval === "year" ? "Annual" : "Monthly"}
                  {billing.billingStatus !== "active" &&
                    ` · ${billing.billingStatus.replace("_", " ")}`}
                </dd>
              </div>
              {billing.planRenewsAt && (
                <div className="flex justify-between border-b border-border/60 pb-3">
                  <dt className="text-muted-foreground">
                    {billing.billingStatus === "cancelled" ? "Access until" : "Renews"}
                  </dt>
                  <dd className="font-medium text-card-foreground">
                    {new Date(billing.planRenewsAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </>
          )}
          {billing.plan === "teams" && (
            <div className="flex justify-between border-b border-border/60 pb-3">
              <dt className="text-muted-foreground">Organiser seats</dt>
              <dd className="font-medium text-card-foreground">{3 + billing.extraSeats}</dd>
            </div>
          )}
        </dl>

        {warning && <LimitBanner warning={warning} />}

        <div className="mt-5">
          <Button onClick={() => setOpen(true)} className="shadow-premium">
            <Package className="size-4" />
            {billing.plan === "free" ? "Buy a pack or subscribe" : "Change plan or buy a pack"}
          </Button>
        </div>
      </Card>

      <Card
        title="Choose a plan"
        subtitle="Prices are in Australian dollars. Annual billing on Organiser and Teams includes 2 months free."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => {
            const current = billing.plan === p.id;
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-xl border p-4 ${current ? "border-primary/60 bg-primary/5" : "border-border"}`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-base font-semibold text-card-foreground">
                    {p.name}
                  </h3>
                  {current && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Current plan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-card-foreground">{p.price}</p>
                <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {p.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
                {p.id === "free" ? (
                  billing.plan !== "free" && (
                    <a
                      href={cancelMailto(billing.plan)}
                      className="mt-4 text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Request a downgrade / cancellation
                    </a>
                  )
                ) : (
                  <Button
                    variant={current ? "outline" : "default"}
                    size="sm"
                    className="mt-4"
                    onClick={() => setOpen(true)}
                  >
                    {current
                      ? p.id === "casual"
                        ? "Buy another pack"
                        : "Manage / change billing period"
                      : p.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Checkout opens with all current prices. To switch between Organiser and Teams, or to
          cancel, email us and we'll update your subscription (you keep access until the end of the
          period you've paid for).
        </p>
      </Card>

      {pendingOrder && (
        <p className="rounded-xl border border-border bg-surface/60 p-4 text-sm text-foreground">
          Paid but your plan hasn't updated?{" "}
          <button
            type="button"
            onClick={() => void claimWithRetry(pendingOrder)}
            className="font-medium text-primary underline underline-offset-4"
          >
            Re-check my payment
          </button>
          . If it still doesn't update, make sure you paid with the same email address as your Klokk
          account, or email us.
        </p>
      )}

      {billing.packs.length > 0 && (
        <Card
          title="Credit packs"
          subtitle="Each pack covers a set number of events and expires 3 months after purchase."
        >
          <ul className="space-y-2 text-sm">
            {billing.packs.map((k) => {
              const expired = new Date(k.expiresAt).getTime() < Date.now();
              return (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className={expired ? "text-muted-foreground line-through" : ""}>
                    {k.eventsTotal - k.eventsUsed} of {k.eventsTotal} events left
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {expired ? "Expired" : "Expires"} {new Date(k.expiresAt).toLocaleDateString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose your plan</DialogTitle>
            <DialogDescription>
              Credit packs, Organiser and Teams. Your plan updates as soon as payment is confirmed.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto py-2">
            {open && (
              <PaymentCheckoutBlock
                checkoutMode="all"
                onSuccess={(order) => {
                  rememberOrder(order.orderId);
                  void claimWithRetry(order.orderId);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EmbedTab({ account }: { account: KlokkAccount }) {
  const update = useUpdateEmbedSettings();
  const initial = account.embedSettings;
  const [domains, setDomains] = useState<string[]>(initial?.domainAllowlist ?? []);
  const [draft, setDraft] = useState("");
  const [accent, setAccent] = useState(initial?.accentOverride ?? "#c9a84c");

  useEffect(() => {
    setDomains(initial?.domainAllowlist ?? []);
    setAccent(initial?.accentOverride ?? "#c9a84c");
  }, [initial]);

  const addDomain = () => {
    const d = draft
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!isAllowedDomain(d)) {
      toast.error(DOMAIN_HELP);
      return;
    }
    if (!domains.includes(d)) setDomains([...domains, d]);
    setDraft("");
  };

  const save = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
      toast.error("Accent colour must look like #c9a84c");
      return;
    }
    update.mutate(
      { settings: { accentOverride: accent, domainAllowlist: domains, embedExpiry: "" } },
      {
        onSuccess: () => toast.success("Embed settings saved"),
        onError: () => toast.error("Could not save"),
      },
    );
  };

  return (
    <div className="space-y-8">
      <Card
        title="Websites that may show your events"
        subtitle="Your events only show on the websites you add here. Every other website is blocked."
      >
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDomain();
              }
            }}
            placeholder="www.yoursite.com"
            className="bg-card text-card-foreground"
          />
          <Button type="button" onClick={addDomain} variant="outline">
            <Globe className="size-4" />
            Add
          </Button>
        </div>
        {domains.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No websites added yet, so your events cannot show anywhere.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {domains.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                {d}
                <button
                  type="button"
                  aria-label={`Remove ${d}`}
                  onClick={() => setDomains(domains.filter((x) => x !== d))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Accent colour"
        subtitle="The colour of the buttons when your event shows on your website."
      >
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#c9a84c"}
            onChange={(e) => setAccent(e.target.value)}
            aria-label="Accent colour"
            className="h-10 w-14 cursor-pointer rounded border border-border bg-card"
          />
          <Input
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="max-w-[9rem] bg-card text-card-foreground"
          />
        </div>
      </Card>

      <Button onClick={save} disabled={update.isPending} className="shadow-premium">
        Save embed settings
      </Button>
    </div>
  );
}

function csvCell(v: string): string {
  // Quote, and neutralise spreadsheet formulas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

function ConsentedContactsCard() {
  const q = useConsentedContacts();
  const [eventId, setEventId] = useState("all");
  const d = q.data;
  if (!d?.available) return null;
  const events = [...new Map(d.contacts.map((c) => [c.eventId, c.eventTitle])).entries()];
  const shown = eventId === "all" ? d.contacts : d.contacts.filter((c) => c.eventId === eventId);
  const download = () => {
    const lines = [
      ["Name", "Email", "Mobile", "Event", "Agreed on"].map(csvCell).join(","),
      ...shown.map((c) =>
        [c.name, c.email, c.phone ?? "", c.eventTitle, c.consentedAt ?? ""].map(csvCell).join(","),
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "klokk-contacts-who-agreed.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card
      title="People who agreed to hear from you"
      subtitle="Participants who ticked the box saying you may contact them. Only they may be contacted."
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-card-foreground">
          <span className="font-display text-2xl font-semibold">{shown.length}</span>{" "}
          {shown.length === 1 ? "person" : "people"}
        </p>
        {events.length > 1 && (
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="h-9 max-w-[14rem] rounded-md border border-input bg-background px-2 text-sm text-foreground"
            aria-label="Show people from"
          >
            <option value="all">All my events</option>
            {events.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={download}
          disabled={shown.length === 0}
        >
          Download CSV
        </Button>
      </div>
      {shown.length > 0 && (
        <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Agreed</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 200).map((c) => (
                <tr key={`${c.email}-${c.eventTitle}`} className="border-t border-border">
                  <td className="px-3 py-2 text-card-foreground">{c.name}</td>
                  <td className="px-3 py-2 text-card-foreground">{c.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.eventTitle}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.consentedAt ? new Date(c.consentedAt).toLocaleDateString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        If someone withdraws, they drop off this list. Remove them from your own systems too.
      </p>
    </Card>
  );
}

export function IntegrationsTab() {
  const status = useCrmStatus();
  const connect = useConnectHighLevel();
  const disconnect = useDisconnectCrm();
  const makeDefault = useSetDefaultCrm();
  const [label, setLabel] = useState("");
  const [locationId, setLocationId] = useState("");
  const [token, setToken] = useState("");

  if (status.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const data = status.data;
  const conns = data?.connections ?? [];

  const save = () => {
    connect.mutate(
      { ...(label.trim() ? { label: label.trim() } : {}), locationId, token },
      {
        onSuccess: () => {
          setToken("");
          setLabel("");
          setLocationId("");
          toast.success("HighLevel connected");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not connect"),
      },
    );
  };

  return (
    <div className="space-y-8">
      <ConsentedContactsCard />
      <Card
        title="Your contact lists (HighLevel)"
        subtitle="People who say you may contact them are added to your HighLevel account for you. Add more than one if you run events for different businesses."
      >
        {!data?.available ? (
          <p className="text-sm text-muted-foreground">
            Adding a contact list is included with the Organiser and Teams monthly plans. Upgrade in
            Plan &amp; billing to use it.
          </p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              People replying to your event see a box asking if you may contact them. Only people
              who tick it are added to your HighLevel account. Events with no list chosen use the
              one marked Default. You can pick a different list for each event on its page. After
              that, how you contact people is up to you, so make sure they can unsubscribe.
            </p>
            {conns.map((conn) => (
              <div
                key={conn.id}
                className="rounded-xl border border-border bg-background p-4 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-card-foreground">{conn.label}</p>
                  {conn.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm text-primary">
                      Default
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {conn.status === "active" ? "Connected" : "Last send failed"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Location ID: {conn.locationId}</p>
                {conn.lastError && (
                  <p className="mt-2 text-sm text-destructive">{conn.lastError}</p>
                )}
                {conn.lastSuccessAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last contact added: {new Date(conn.lastSuccessAt).toLocaleString()}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {!conn.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={makeDefault.isPending}
                      onClick={() =>
                        makeDefault.mutate(conn.id, {
                          onSuccess: () => toast.success("Default updated"),
                          onError: () => toast.error("Could not update"),
                        })
                      }
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      disconnect.mutate(conn.id, {
                        onSuccess: () => toast.success("Disconnected"),
                        onError: () => toast.error("Could not disconnect"),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-card-foreground">
                {conns.length > 0 ? "Add another HighLevel account" : "Add your HighLevel account"}
              </p>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="A name for this list, for example Acme Partners"
                maxLength={60}
                className="bg-card text-card-foreground"
              />
              <Input
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                placeholder="Location ID"
                className="bg-card text-card-foreground"
              />
              <Input
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Private Integration token (the long key)"
                className="bg-card text-card-foreground"
              />
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-card-foreground">How to find these two things</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open your HighLevel account.</li>
                  <li>
                    Location ID: go to Settings, then Business Profile. Copy the long code called
                    Location ID.
                  </li>
                  <li>
                    Private Integration token: go to Settings, then Private Integrations. Make a new
                    one, tick only the contacts permission that lets it edit contacts, and copy the
                    key it shows you.
                  </li>
                  <li>Paste both above and press Save and test.</li>
                </ol>
                <p className="mt-2">
                  We keep the key safe and never show it again. Adding a Location ID you have
                  already saved swaps in the new key.
                </p>
              </div>
              <Button
                type="button"
                onClick={save}
                disabled={connect.isPending || !locationId.trim() || !token.trim()}
              >
                {connect.isPending ? "Checking…" : "Save and test"}
              </Button>
            </div>
            {data.recent.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-card-foreground">Recent deliveries</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {data.recent.map((r) => (
                    <li key={r.at}>
                      {new Date(r.at).toLocaleString()}:{" "}
                      {r.status === "ok" ? "added" : `failed${r.error ? ` (${r.error})` : ""}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export function MarketingConsentCard({ account }: { account: KlokkAccount }) {
  const update = useUpdateMarketingConsent();
  const [on, setOn] = useState(account.marketingConsent);
  useEffect(() => setOn(account.marketingConsent), [account.marketingConsent]);
  const change = (next: boolean) => {
    setOn(next);
    update.mutate(
      { consent: next },
      {
        onSuccess: () => toast.success(next ? "You will hear from Klokk" : "You have opted out"),
        onError: () => {
          setOn(!next);
          toast.error("Could not save");
        },
      },
    );
  };
  return (
    <Card
      title="Messages from Klokk"
      subtitle="News, tips and offers about Klokk. You always get emails about your events and account."
    >
      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <Checkbox
          checked={on}
          onCheckedChange={(v) => change(v === true)}
          disabled={update.isPending}
          className="mt-0.5"
        />
        <span>Klokk (Pegasus Apps) may contact me about Klokk. I can change this at any time.</span>
      </label>
    </Card>
  );
}
