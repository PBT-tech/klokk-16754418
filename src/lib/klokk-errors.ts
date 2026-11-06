// Error messages shown to people must be plain. Our own messages ("This event has reached its
// participant limit (35).") are kept. Technical ones from the database or network are swapped
// for the fallback so nobody sees "violates row-level security policy".

const TECHNICAL =
  /violates|constraint|relation "|column "|syntax|row-level|jwt|pgrst|postgres|supabase|fetch failed|failed to fetch|networkerror|typeerror|undefined|null value|\bsql\b|stack|econn|timeout|<[a-z]+>|\{|\}/i;

const KNOWN: [RegExp, string][] = [
  [
    /invalid login credentials/i,
    "That email and password do not match. Try again, or reset your password.",
  ],
  [/email not confirmed/i, "Please click the link in the email we sent you, then try again."],
  [
    /user already registered|already been registered/i,
    "That email already has an account. Try signing in.",
  ],
  [/password should be at least/i, "Please choose a longer password."],
  [
    /rate limit|too many requests|over_email_send_rate_limit/i,
    "Too many tries. Please wait a minute and try again.",
  ],
];

export function plainError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!msg) return fallback;
  for (const [re, text] of KNOWN) if (re.test(msg)) return text;
  if (msg.length > 160 || TECHNICAL.test(msg)) return fallback;
  return msg;
}
