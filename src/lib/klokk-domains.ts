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

export const DOMAIN_HELP =
  "Enter your website like example.com (www.example.com is allowed too), or *.example.com for all of its subdomains. Wildcards on shared domains such as *.co.uk or *.vercel.app aren't allowed.";
