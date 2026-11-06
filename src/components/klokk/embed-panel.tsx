import { useState } from "react";
import { plainError } from "@/lib/klokk-errors";
import { Ban, Check, Code2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useCreateEmbed,
  useEmbeds,
  useRevokeEmbed,
  useUpdateEmbedSettings,
} from "@/lib/klokk-hooks";
import { DOMAIN_HELP, isAllowedDomain, normaliseAllowedDomain } from "@/lib/klokk-domains";
import type { KlokkAccount, KlokkEvent } from "@/lib/klokk-types";

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://klokk.com";
}

function scriptCode(token: string): string {
  return `<div data-klokk-embed="${token}"></div>\n<script async src="${origin()}/embed.js"></script>`;
}

function iframeCode(token: string): string {
  return `<iframe src="${origin()}/embed/${token}" title="Klokk scheduling" style="width:100%;height:640px;border:0" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>`;
}

function copy(text: string, label: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Couldn't copy. Select the code and copy it by hand."),
    );
  } else {
    toast.error("Couldn't copy. Select the code and copy it by hand.");
  }
}

/** The ready-to-paste code for one embed link, in the format the organiser picks. */
function EmbedCode({ token }: { token: string }) {
  const [format, setFormat] = useState<"script" | "iframe">("script");
  const code = format === "script" ? scriptCode(token) : iframeCode(token);
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Which kind of code" className="flex gap-1">
          {(["script", "iframe"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={format === f}
              onClick={() => setFormat(f)}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium ${
                format === f
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "script" ? "Easiest (recommended)" : "If that does not work"}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(code, format === "script" ? "Script embed" : "iframe embed")}
        >
          <Copy className="size-3.5" />
          Copy code
        </Button>
      </div>
      <textarea
        readOnly
        value={code}
        rows={4}
        aria-label="Code to paste"
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-md border border-border bg-card p-2 font-mono text-xs text-card-foreground"
      />
      <p className="text-sm text-muted-foreground">
        {format === "script"
          ? "Paste this on your web page, where you want the event to show."
          : "Use this if the easiest one does not work on your website. Paste it into an HTML or custom code box."}
      </p>
    </div>
  );
}

export function EmbedPanel({ event, account }: { event: KlokkEvent; account: KlokkAccount }) {
  const embeds = useEmbeds(event.id);
  const create = useCreateEmbed();
  const revoke = useRevokeEmbed();
  const updateSettings = useUpdateEmbedSettings();
  const [days, setDays] = useState("");
  const [site, setSite] = useState("");
  // ids whose embed code is expanded; a freshly created link opens automatically
  const [open, setOpen] = useState<Set<string>>(new Set());
  const allowed = account.embedSettings?.domainAllowlist ?? [];
  const noDomains = allowed.length === 0;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const make = async () => {
    const n = days.trim() ? Number(days) : undefined;
    if (n !== undefined && (!Number.isInteger(n) || n < 1 || n > 730)) {
      toast.error("Enter a whole number of days from 1 to 730, or leave it empty to never stop");
      return;
    }
    const domain = normaliseAllowedDomain(site);
    if (site.trim() && !isAllowedDomain(domain)) {
      toast.error(DOMAIN_HELP);
      return;
    }

    // The embed only loads on websites on the allow-list, so add this one if it's new.
    if (domain && !allowed.includes(domain)) {
      try {
        await updateSettings.mutateAsync({
          settings: {
            accentOverride: account.embedSettings?.accentOverride || "#c9a84c",
            embedExpiry: account.embedSettings?.embedExpiry ?? "",
            domainAllowlist: [...allowed, domain],
            hideSignupPrompt: account.embedSettings?.hideSignupPrompt === true,
          },
        });
      } catch (err) {
        toast.error(plainError(err, "Could not add that website to your allowed list"));
        return;
      }
    }

    create.mutate(
      n === undefined ? { eventId: event.id } : { eventId: event.id, expiresInDays: n },
      {
        onSuccess: (res: { id: string }) => {
          setOpen((prev) => new Set(prev).add(res.id));
          setSite("");
          setDays("");
          toast.success("Your code is ready. Copy it from below.");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create embed"),
      },
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-3 text-sm text-muted-foreground">
        Show this event on your own website. Make a code for each website, copy it, and paste it
        into that website. You can turn a code off at any time.
      </p>

      <div className="mb-3 space-y-2 rounded-lg border border-border p-2">
        <label className="block text-sm font-medium text-card-foreground" htmlFor="embed-site">
          Website this link is for
        </label>
        <input
          id="embed-site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          placeholder="www.yoursite.com"
          className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {noDomains
            ? "No websites are allowed yet, so embeds are blocked everywhere. Enter your website here and it will be allowed automatically."
            : "If this website isn't on your allowed list yet, it is added when you create the link. It stays allowed for all your embeds until you remove it in Settings."}{" "}
          Manage the full list in{" "}
          <a href="/settings?tab=embed" className="underline underline-offset-4">
            Settings → Embed
          </a>
          .
        </p>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Stop working after how many days? (optional)"
            aria-label="Days until the code stops working"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm"
          />
          <Button
            size="sm"
            onClick={() => void make()}
            disabled={create.isPending || updateSettings.isPending}
          >
            <Plus className="size-3.5" />
            Make my website code
          </Button>
        </div>
      </div>

      {embeds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No codes yet. Press "Make my website code" above and your code appears here.
        </p>
      )}
      <ul className="space-y-3">
        {embeds.map((e) => {
          const dead =
            !!e.revokedAt || (e.expiresAt !== null && new Date(e.expiresAt).getTime() < Date.now());
          const shown = open.has(e.id);
          return (
            <li key={e.id} className="rounded-lg border border-border p-2">
              <div className="flex items-center justify-between text-sm">
                <span className={dead ? "text-muted-foreground line-through" : "font-medium"}>
                  {e.revokedAt
                    ? "Turned off"
                    : dead
                      ? "Stopped working"
                      : e.expiresAt
                        ? `Works until ${new Date(e.expiresAt).toLocaleDateString()}`
                        : "Working"}
                </span>
                <span className="text-muted-foreground">
                  {e.views} looked · {e.interactions} clicked · {e.submissions} replied
                </span>
              </div>
              {!dead && (
                <>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggle(e.id)}>
                      {shown ? <Check className="size-3.5" /> : <Code2 className="size-3.5" />}
                      {shown ? "Hide the code" : "Show the code"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        revoke.mutate(
                          { id: e.id },
                          { onSuccess: () => toast.message("Code turned off") },
                        )
                      }
                    >
                      <Ban className="size-3.5" />
                      Turn off
                    </Button>
                  </div>
                  {shown && <EmbedCode token={e.token} />}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
