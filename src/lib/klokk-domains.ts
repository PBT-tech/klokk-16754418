// Allowed-website rules shared by the browser and the server functions.

const DOMAIN_RE = /^(\*\.)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d{1,5})?$/;

/** Shared hosting / registry suffixes where a wildcard would cover unrelated sites. */
const PUBLIC_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "co.za",
  "com.br",
  "co.in",
  "co.jp",
  "vercel.app",
  "netlify.app",
  "github.io",
  "pages.dev",
  "web.app",
  "firebaseapp.com",
  "herokuapp.com",
  "azurewebsites.net",
  "onrender.com",
  "fly.dev",
  "workers.dev",
  "blogspot.com",
  "wordpress.com",
  "wixsite.com",
  "myshopify.com",
]);

export function normaliseAllowedDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

/** True when the string is an acceptable website entry for the embed allow-list. */
export function isAllowedDomain(d: string): boolean {
  if (!DOMAIN_RE.test(d)) return false;
  if (d.startsWith("*.")) {
    const base = d.slice(2).replace(/:\d+$/, "");
    // A wildcard must sit under a real registrable domain, not a public suffix or a bare TLD.
    if (base.split(".").length < 2 || PUBLIC_SUFFIXES.has(base)) return false;
  }
  return true;
}

/**
 * Turn the organiser's allowed websites into the hosts a page may be framed from.
 * Entering example.com (or www.example.com) allows example.com, www.example.com and every
 * subdomain of it. Pages on any path are covered automatically (the browser check ignores paths).
 * Shared hosts such as co.uk or vercel.app are never widened to their subdomains.
 */
export function frameAncestorHosts(entries: string[]): string[] {
  const out = new Set<string>();
  for (const raw of entries) {
    const d = raw.trim().toLowerCase();
    if (!DOMAIN_RE.test(d)) continue;
    const port = d.match(/:\d+$/)?.[0] ?? "";
    const host = d
      .replace(/:\d+$/, "")
      .replace(/^\*\./, "")
      .replace(/^www\./, "");
    out.add(`${host}${port}`);
    out.add(`www.${host}${port}`);
    const labels = host.split(".");
    if (labels.length >= 2 && !PUBLIC_SUFFIXES.has(host)) out.add(`*.${host}${port}`);
  }
  return [...out];
}

export const DOMAIN_HELP =
  "Enter your website like example.com. Its www version, every subdomain (blog.example.com) and every page on it are allowed automatically. Wildcards on shared domains such as *.co.uk or *.vercel.app aren't allowed.";
