// Klokk notification layer — posts structured events to the HL tracking
// endpoint, which triggers branded email workflows for each notification type.
// Fire-and-forget from server functions; never blocks the user-facing action.
//
// Custom field IDs (registered via the form-tracking integration):
import type { KlokkEvent } from "./klokk-types";
import { toInternationalPhone } from "./klokk-phone";
import { confirmedTimeLabel } from "./klokk-format";

const ENDPOINT = "https://backend.leadconnectorhq.com/external-tracking/events";
const TRACKING_ID = "tk_9fa1b07fdc4a47ce8e0d2f1b7bdba934";
const LOCATION_ID = "0FNYpxrhqqIS9bIV2FDq";
const PROJECT_ID = "1793243379516754418";

// Registered custom-field IDs.
const CF = {
  eventTitle: "BxxH5sILUN4RK6sC86La",
  eventLink: "tmdysJH7XzvRTHOWwchv",
  organiserName: "rxFXBhwHKyMMiaTEGSaC",
  deadline: "MvPKxBEG24r1HEYB54oQ",
  confirmedTime: "TqQZz1icLo4ZgVxyvoex",
  location: "XTwVtYzAxKIeTSmbxNdC",
  eventDescription: "pRn1lQsay3AmlpQewGEW",
  // "What changed" text for the event-updated email. Set HL_CF_EVENT_CHANGES to the id of the
  // matching HighLevel custom field; without it the text is sent under the plain key below.
  changes:
    (typeof process !== "undefined" && process.env?.["HL_CF_EVENT_CHANGES"]) || "event_changes",
};

type NotificationType =
  | "invitation"
  | "submission_confirmation"
  | "reminder"
  | "meeting_confirmation"
  | "event_cancelled"
  | "event_updated"
  | "signup_notification"
  | "klokk_marketing_optin"
  | "klokk_marketing_optout";

const FORM_IDS: Record<NotificationType, string> = {
  invitation: "klokk-event-invitation",
  submission_confirmation: "klokk-submission-confirmation",
  reminder: "klokk-response-reminder",
  meeting_confirmation: "klokk-meeting-confirmation",
  event_cancelled: "klokk-event-cancelled",
  event_updated: "klokk-event-updated",
  signup_notification: "klokk-signup-notification",
  // Same form id the participant-response workflow already listens to ("contact capture").
  klokk_marketing_optin: "klokk-participant-response",
  // Withdrawal: the automation on this form id should remove mktg-consent=yes and add mktg-consent=no.
  klokk_marketing_optout: "klokk-marketing-optout",
};

const FORM_NAMES: Record<NotificationType, string> = {
  invitation: "Klokk Event Invitation",
  submission_confirmation: "Klokk Submission Confirmation",
  reminder: "Klokk Response Reminder",
  meeting_confirmation: "Klokk Meeting Confirmation",
  event_cancelled: "Klokk Event Cancelled",
  event_updated: "Klokk Event Updated",
  signup_notification: "Klokk Signup Notification",
  klokk_marketing_optin: "Klokk Participant Response",
  klokk_marketing_optout: "Klokk Marketing Opt-out",
};

interface BasePayload {
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
  /** Optional. Sent as the contact's phone number when given. */
  recipientPhone?: string | undefined;
  /** Optional. Shown as the contact's Source in HighLevel (the event name). */
  sourceName?: string | undefined;
  /** Optional. The organiser's name, added to the Source after the event name. */
  organiserName?: string | undefined;
}

interface EventPayload extends BasePayload {
  event: KlokkEvent;
  organiserName: string;
  origin: string;
}

const HL_API = "https://services.leadconnectorhq.com";

function hlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Saves the person on Klokk's own HighLevel contact by calling the API directly: name, email,
 * phone (international format) and Source (event name and organiser). The form-tracking event
 * does not reliably fill those standard fields, and every form event adds a "form" entry to the
 * contact record. Tags are added and removed one by one, because sending a tag list on the
 * upsert would replace all of them. Returns true when the contact was saved. With no token set,
 * or on any error, it returns false and nothing is changed.
 */
async function saveOwnContact(
  payload: BasePayload,
  source: string,
  tags?: { add: string[]; remove: string[] },
): Promise<boolean> {
  const token = typeof process !== "undefined" ? process.env?.["HL_API_TOKEN"] : undefined;
  const locationId = typeof process !== "undefined" ? process.env?.["HL_LOCATION_ID"] : undefined;
  if (!token || !locationId) return false;
  const phone = toInternationalPhone(payload.recipientPhone);
  try {
    const res = await fetch(`${HL_API}/contacts/upsert`, {
      method: "POST",
      headers: hlHeaders(token),
      body: JSON.stringify({
        locationId,
        firstName: payload.recipientFirstName,
        lastName: payload.recipientLastName,
        email: payload.recipientEmail,
        source,
        ...(phone ? { phone } : {}),
      }),
    });
    if (!res.ok) return false;
    if (!tags) return true;
    const json = (await res.json().catch(() => null)) as { contact?: { id?: string } } | null;
    const id = json?.contact?.id;
    if (!id) return false;
    if (tags.remove.length > 0) {
      await fetch(`${HL_API}/contacts/${id}/tags`, {
        method: "DELETE",
        headers: hlHeaders(token),
        body: JSON.stringify({ tags: tags.remove }),
      });
    }
    const added = await fetch(`${HL_API}/contacts/${id}/tags`, {
      method: "POST",
      headers: hlHeaders(token),
      body: JSON.stringify({ tags: tags.add }),
    });
    return added.ok;
  } catch {
    return false;
  }
}

function postEvent(
  type: NotificationType,
  payload: BasePayload,
  customFields: Record<string, { value: unknown; label: string }>,
): Promise<boolean> {
  const formData: Record<string, unknown> = {
    first_name: payload.recipientFirstName,
    last_name: payload.recipientLastName,
    email: payload.recipientEmail,
  };
  const formLabels: Record<string, string> = {
    first_name: "First name",
    last_name: "Last name",
    email: "Email",
  };
  const phone = toInternationalPhone(payload.recipientPhone);
  if (phone) {
    formData["phone"] = phone;
    formLabels["phone"] = "Phone";
  }

  for (const [key, field] of Object.entries(customFields)) {
    if (field.value === undefined || field.value === null) continue;
    formData[key] = field.value;
    formLabels[key] = field.label;
  }

  const eventName = (
    payload.sourceName ??
    (payload as { event?: KlokkEvent }).event?.title ??
    ""
  ).trim();
  const organiser = payload.organiserName?.trim();
  const sourceLabel = eventName
    ? organiser
      ? `${eventName} (organiser: ${organiser})`
      : eventName
    : "Klokk";

  const pageUrl =
    typeof window !== "undefined" ? window.location.href : "https://klokk.vibepreview.app";

  const eventPayload = {
    type: "external_form_submission",
    timestamp: Date.now(),
    formId: FORM_IDS[type],
    formData,
    formLabels,
    pageUrl,
    url: pageUrl,
    title: FORM_NAMES[type],
    path: typeof window !== "undefined" ? window.location.pathname : "",
    userAgent: "klokk-server",
    trackingId: TRACKING_ID,
    locationId: LOCATION_ID,
    projectId: PROJECT_ID,
    sessionId: crypto.randomUUID(),
    properties: {
      deviceType: "desktop",
      source: sourceLabel,
      projectId: PROJECT_ID,
      formName: FORM_NAMES[type],
    },
  };

  const body = new FormData();
  body.append("event", JSON.stringify(eventPayload));

  // Returned (not fire-and-forget) so serverless callers can await it before the
  // function ends; otherwise the platform may drop the request.
  return saveOwnContact(payload, sourceLabel).then(() =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: { version: "2021-07-28" },
      body,
    })
      .then((res) => res.ok)
      .catch(() => false),
  );
}

function eventLink(origin: string, token: string) {
  return `${origin}/event/${token}`;
}

function eventCustomFields(
  event: KlokkEvent,
  organiserName: string,
  origin: string,
  extra?: Record<string, { value: unknown; label: string }>,
) {
  return {
    [CF.eventTitle]: { value: event.title, label: "Event Title" },
    [CF.eventLink]: { value: eventLink(origin, event.token), label: "Event Link" },
    [CF.organiserName]: { value: organiserName, label: "Organiser Name" },
    [CF.deadline]: { value: new Date(event.deadline).toLocaleString(), label: "Deadline" },
    [CF.location]: { value: event.location ?? "", label: "Location" },
    [CF.eventDescription]: { value: event.description ?? "", label: "Event Description" },
    ...extra,
  };
}

// ---------- Public notification triggers ----------

/** F7: invitation email to a participant (contains the unique link). */
export function sendInvitation(p: EventPayload) {
  return postEvent("invitation", p, eventCustomFields(p.event, p.organiserName, p.origin));
}

/** F4/F7: submission confirmation email to the participant who just submitted. */
export function sendSubmissionConfirmation(p: EventPayload) {
  return postEvent(
    "submission_confirmation",
    p,
    eventCustomFields(p.event, p.organiserName, p.origin),
  );
}

/** F7: reminder to an outstanding named participant. */
export function sendReminder(p: EventPayload) {
  return postEvent("reminder", p, eventCustomFields(p.event, p.organiserName, p.origin));
}

/** F6/F7: final meeting confirmation to all participants who responded. */
export function sendMeetingConfirmation(p: EventPayload) {
  const confirmedTime = confirmedTimeLabel(p.event);
  return postEvent(
    "meeting_confirmation",
    p,
    eventCustomFields(p.event, p.organiserName, p.origin, {
      [CF.confirmedTime]: { value: confirmedTime, label: "Confirmed Time" },
    }),
  );
}

/** F9: cancellation notice to participants. */
export function sendCancellation(p: EventPayload) {
  return postEvent("event_cancelled", p, eventCustomFields(p.event, p.organiserName, p.origin));
}

/** The organiser changed the event: tell the recipient exactly what is different. */
export function sendEventUpdated(p: EventPayload & { changes: string }) {
  return postEvent(
    "event_updated",
    p,
    eventCustomFields(p.event, p.organiserName, p.origin, {
      [CF.changes]: { value: p.changes, label: "What Changed" },
    }),
  );
}

/** Notify the sub-account owner that a new organiser signed up.
 *  Posts the new organiser as the contact; the HL workflow (location owner)
 *  handles the owner-facing notification email. */
export function sendSignupNotification(p: { newOrganiserEmail: string; newOrganiserName: string }) {
  const [first = "", ...rest] = p.newOrganiserName.split(" ");
  return postEvent(
    "signup_notification",
    {
      recipientEmail: p.newOrganiserEmail,
      recipientFirstName: first,
      recipientLastName: rest.join(" "),
    },
    {
      // The user type goes in the contact's Type field ({{contact.type}}) and nowhere else.
      type: { value: "organiser", label: "Type" },
      [CF.organiserName]: { value: p.newOrganiserName, label: "New Organiser Name" },
      [CF.eventTitle]: { value: p.newOrganiserEmail, label: "New Organiser Email" },
    },
  );
}

/**
 * A participant or organiser changed their "Klokk may contact me" choice. Ticked posts the
 * participant-response form; unticked (withdrawal) posts the opt-out form, so the form itself
 * says yes or no. The only extra value sent is the user type, which maps to the contact's Type
 * field ({{contact.type}}) and to no other field. People who never ticked the box are never
 * sent here.
 */
export async function sendKlokkMarketingChoice(
  p: BasePayload,
  consent: boolean,
  role: "participant" | "organiser" = "participant",
): Promise<boolean> {
  // Preferred route: straight to the HighLevel API. No form entry is added to the contact, and
  // the tags show the choice: mktg-consent=yes or mktg-consent=no, plus the user type tag.
  const eventName = p.sourceName?.trim();
  const organiser = p.organiserName?.trim();
  const source = eventName
    ? organiser
      ? `${eventName} (organiser: ${organiser})`
      : eventName
    : "Klokk";
  const saved = await saveOwnContact(p, source, {
    add: consent ? ["klokk", role, "mktg-consent=yes"] : ["mktg-consent=no"],
    remove: [consent ? "mktg-consent=no" : "mktg-consent=yes"],
  });
  if (saved) return true;
  // No API token set (or the call failed): fall back to the form event.
  return postEvent(consent ? "klokk_marketing_optin" : "klokk_marketing_optout", p, {
    // Maps to the contact's Type field in HighLevel ({{contact.type}}).
    type: { value: role, label: "Type" },
  });
}
