import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Creates the new organiser's contact directly in the sub-account — no form
// submission, so it does not log a "Form" entry on the contact record. Stamps
// the Account Level custom field ("free" at sign-up) and the marketing-consent
// tag matching the tick-box choice. Fire-and-forget from the signup flow.
export const createOrganiserContact = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        marketingConsent: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const token = process.env["HL_API_TOKEN"];
    const locationId = process.env["HL_LOCATION_ID"];
    if (!token || !locationId) return { ok: false };
    try {
      const res = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          locationId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          source: "Klokk",
          tags: ["klokk", data.marketingConsent ? "mktg-consent=yes" : "mktg-consent=no"],
          // Registered custom field: "Account Level". Reflects the plan tier.
          customFields: [{ id: "HW6sdINihzHa9KowrSTE", field_value: "free" }],
        }),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  });
