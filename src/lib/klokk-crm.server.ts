// Organiser CRM connections (server only). Phase 1.2 starts with HighLevel.
//
// An organiser on a monthly plan (Organiser or Teams) links their own HighLevel sub-account
// with a Private Integration token. When a participant ticks "the organiser may contact me",
// the participant is added to that CRM as a contact. People who do not tick it are never sent.
//
// The token is encrypted with AES-GCM before it is stored. The key lives only in the server
// environment (CRM_ENCRYPTION_KEY, 32 random bytes, base64). Nothing here is ever returned to
// the browser except the connection status.

/* eslint-disable @typescript-eslint/no-explicit-any */

const HL = "https://services.leadconnectorhq.com";

/** Plans that include the organiser CRM connection (all monthly subscriptions). */
export function planHasCrm(plan: string | null | undefined): boolean {
  return plan === "organiser" || plan === "teams";
}

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- encryption ----------

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function cryptoKey(): Promise<CryptoKey> {
  const raw = process.env["CRM_ENCRYPTION_KEY"];
  if (!raw) throw new Error("CRM connections are not configured (CRM_ENCRYPTION_KEY is missing)");
  const bytes = b64ToBytes(raw);
  if (bytes.length !== 32) throw new Error("CRM_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return crypto.subtle.importKey("raw", bytes as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Output format: base64(iv[12] + ciphertext). */
export async function encryptSecret(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await cryptoKey(),
      new TextEncoder().encode(plain),
    ),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return bytesToB64(out);
}

export async function decryptSecret(packed: string): Promise<string> {
  const bytes = b64ToBytes(packed);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.slice(0, 12) as BufferSource },
    await cryptoKey(),
    bytes.slice(12) as BufferSource,
  );
  return new TextDecoder().decode(plain);
}

// ---------- HighLevel ----------

function hlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/** Confirms the token can reach the location. Throws a plain-language error if not. */
export async function verifyHighLevel(locationId: string, token: string): Promise<void> {
  const res = await fetch(`${HL}/locations/${encodeURIComponent(locationId)}`, {
    headers: hlHeaders(token),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "HighLevel rejected that token. Check it is a Private Integration token for this location.",
    );
  }
  if (res.status === 404 || res.status === 422) {
    throw new Error("HighLevel could not find that Location ID.");
  }
  if (!res.ok) throw new Error(`HighLevel returned an error (${res.status}). Try again shortly.`);
}

export interface CrmParticipant {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  eventTitle: string;
}

const TAG_YES = "mktg-consent=yes";
const TAG_NO = "mktg-consent=no";

/**
 * Creates or updates the contact, then makes the consent tags match the participant's choice:
 * consent adds mktg-consent=yes and removes mktg-consent=no; withdrawal does the reverse.
 * "klokk" and the contact's source show where they came from.
 */
async function setHighLevelConsent(
  locationId: string,
  token: string,
  p: CrmParticipant,
  consent: boolean,
): Promise<void> {
  const res = await fetch(`${HL}/contacts/upsert`, {
    method: "POST",
    headers: hlHeaders(token),
    body: JSON.stringify({
      locationId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      ...(p.phone ? { phone: p.phone } : {}),
      source: "Klokk",
      tags: consent ? ["klokk", TAG_YES] : ["klokk", TAG_NO],
    }),
  });
  if (!res.ok) throw new Error(`HighLevel contact upsert failed (${res.status})`);
  const j: any = await res.json();
  const id = j.contact?.id ?? j.id;
  if (!id) throw new Error("HighLevel did not return a contact id");
  // Upsert only adds tags, so remove the opposite one explicitly.
  const del = await fetch(`${HL}/contacts/${encodeURIComponent(String(id))}/tags`, {
    method: "DELETE",
    headers: hlHeaders(token),
    body: JSON.stringify({ tags: [consent ? TAG_NO : TAG_YES] }),
  });
  if (!del.ok && del.status !== 404) throw new Error(`HighLevel tag update failed (${del.status})`);
}

/**
 * Push a participant's consent choice to the organiser's connected CRM. Best effort: never throws.
 * The outcome is written to crm_sync_log so the organiser can see failures in Settings.
 */
export async function pushParticipantToCrm(opts: {
  ownerId: string;
  ownerPlan: string | null | undefined;
  responseId: string | null;
  eventId: string;
  consent: boolean;
  participant: CrmParticipant;
}): Promise<void> {
  if (!planHasCrm(opts.ownerPlan)) return;
  const db = await admin();
  try {
    const { data: conn } = await db
      .from("crm_connections")
      .select("id, provider, external_account_id, token_ciphertext")
      .eq("user_id", opts.ownerId)
      .eq("provider", "highlevel")
      .maybeSingle();
    if (!conn) return;
    try {
      const token = await decryptSecret(conn.token_ciphertext);
      await setHighLevelConsent(conn.external_account_id, token, opts.participant, opts.consent);
      await db
        .from("crm_connections")
        .update({ status: "active", last_error: null, last_success_at: new Date().toISOString() })
        .eq("id", conn.id);
      await db.from("crm_sync_log").insert({
        user_id: opts.ownerId,
        provider: "highlevel",
        response_id: opts.responseId,
        event_id: opts.eventId,
        status: "ok",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message.slice(0, 300) : "Unknown error";
      await db
        .from("crm_connections")
        .update({ status: "error", last_error: message, updated_at: new Date().toISOString() })
        .eq("id", conn.id);
      await db.from("crm_sync_log").insert({
        user_id: opts.ownerId,
        provider: "highlevel",
        response_id: opts.responseId,
        event_id: opts.eventId,
        status: "failed",
        error: message,
      });
    }
  } catch (e) {
    console.error("[klokk] crm push failed:", e);
  }
}
