import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Klokk" },
      {
        name: "description",
        content:
          "Terms of Service for the Klokk platform, provided by Pegasus Apps. Plans, pricing, credit packs, acceptable use, privacy and liability.",
      },
      { property: "og:title", content: "Terms of Service — Klokk" },
      {
        property: "og:description",
        content: "Terms of Service for the Klokk platform, provided by Pegasus Apps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Back to Klokk
      </Link>

      <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date and last updated: 01 Nov 2026 · Provider: Pegasus Apps
      </p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        By accessing or using the Klokk platform (klokk.com or any subdomain), you agree to these
        Terms of Service (Terms). If you do not agree, do not use the Platform.
      </p>

      {/* 1. Definitions */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">1. Definitions</h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Account</span> — a registered Organiser
            account.
          </li>
          <li>
            <span className="font-medium text-foreground">Credit / Casual Credit</span> — a
            single-use entitlement to create one Event, purchased as part of a Credit Pack.
          </li>
          <li>
            <span className="font-medium text-foreground">Credit Pack / Casual Plan</span> — a
            bundle of Credits purchased for a fixed price with a 3-month expiry.
          </li>
          <li>
            <span className="font-medium text-foreground">Event</span> — an
            availability-coordination session created by an Organiser.
          </li>
          <li>
            <span className="font-medium text-foreground">Organiser</span> — a registered user who
            creates and manages Events.
          </li>
          <li>
            <span className="font-medium text-foreground">Participant</span> — an individual who
            submits their availability in response to an Event link, without holding an Account.
          </li>
          <li>
            <span className="font-medium text-foreground">Plan</span> — a subscription or
            credit-pack tier as described in clause 4.
          </li>
          <li>
            <span className="font-medium text-foreground">Platform</span> — the Klokk web
            application, APIs, and associated services.
          </li>
          <li>
            <span className="font-medium text-foreground">Seat</span> — a licensed organiser / admin
            or user position within a Teams Plan.
          </li>
        </ul>
      </section>

      {/* 2. Eligibility */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">2. Eligibility</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You must be at least 18 years old to create an Account. If you are using the Platform on
          behalf of a business, you represent that you have authority to bind that business to these
          Terms. You must not use the Platform if you are prohibited by law, sanction, or court
          order from doing so.
        </p>
      </section>

      {/* 3. Account Registration and Security */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          3. Account Registration and Security
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You must provide accurate and current information when registering. You are responsible
          for all activity under your Account. You must not share your login credentials. If you
          suspect unauthorised access to your Account, notify us immediately via the chat widget.
        </p>
      </section>

      {/* 4. Plans, Pricing, and Feature Availability */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          4. Plans, Pricing, and Feature Availability
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          All prices are in AUD, inclusive of GST and subject to change at any time.
        </p>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-display text-base font-semibold">Free Trial Plan — $0</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>3 lifetime Events</li>
              <li>Maximum 35 Participants per Event (hard cap; no overage)</li>
              <li>1 Account seat</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-display text-base font-semibold">Casual Plan (Credit Packs)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>5 Credits: $32.30 — 5 events, expires 3 months from purchase</li>
              <li>10 Credits: $53.00 — 10 events, expires 3 months from purchase</li>
              <li>15 Credits: $71.00 — 15 events, expires 3 months from purchase</li>
              <li>
                Maximum 35 Participants per Event (more participants available as overage — see
                clause 5)
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-display text-base font-semibold">Organiser Plan — $28.70/month</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Unlimited Events</li>
              <li>Up to 80 Participants per Event</li>
              <li>1 Account seat</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-display text-base font-semibold">
              Teams Plan — $55.70/month base + $15.20/month per additional Seat
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Base includes 3 Seats</li>
              <li>Unlimited Events</li>
              <li>Unlimited Participants</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-display text-base font-semibold">
              Participant Overage (Casual Plan only)
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>
                36 to 50 Participants (1–3 blocks above base): $6.20 per block of 5 participants
              </li>
              <li>51+ Participants (4 blocks and above): $5.30 per block of 5 participants</li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          For subscription Plans, we will give you at least 30 days' notice by Email before a price
          change applies to your Account. Continued use after the notice period constitutes
          acceptance of the new pricing.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Upgrade prompts may appear when you approach a Plan's limits. These are informational only
          and show the financial benefit of moving to the next Plan tier.
        </p>
      </section>

      {/* 5. Credit Pack Terms */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">5. Credit Pack Terms</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Credits purchased as a Credit Pack:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>expire 3 months from the date of purchase, regardless of whether they are used;</li>
          <li>are non-refundable after purchase except as required by Australian Consumer Law;</li>
          <li>are non-transferable and may not be sold or gifted;</li>
          <li>
            are forfeited on expiry and will not be restored, refunded, or applied to a subscription
            upgrade; and
          </li>
          <li>are associated with your Account and are not restored if your Account is deleted.</li>
        </ul>
      </section>

      {/* 6. Acceptable Use */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">6. Acceptable Use</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You must not use the Platform to:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            (a) send unsolicited bulk invitations or any communication that would breach the Spam
            Act 2003 (Cth), the GDPR, the CAN-SPAM Act, or the TCPA;
          </li>
          <li>(b) harvest, scrape, or collect data from the Platform by automated means;</li>
          <li>(c) access, copy, or use another person's Event or account without authorisation;</li>
          <li>(d) impersonate any person or entity;</li>
          <li>(e) upload or transmit malicious code or interfere with the Platform's integrity;</li>
          <li>(f) use the Platform for any unlawful purpose; or</li>
          <li>(g) resell or sublicense access to the Platform without our written consent.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We may suspend or terminate Accounts that breach this clause without prior notice where
          the breach is severe.
        </p>
      </section>

      {/* 7. Event Data and Participant Content */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          7. Event Data and Participant Content
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You retain ownership of your Event data and Participant responses. By using the Platform,
          you grant us a limited licence to store, process, and display that data solely for the
          purpose of operating the Platform.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-foreground">Plan</th>
                <th className="px-4 py-2 text-left font-medium text-foreground">
                  Retention period
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr>
                <td className="px-4 py-2 font-medium text-foreground">Free Trial</td>
                <td className="px-4 py-2">30 days after Event close</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-foreground">Casual, Organiser, Teams</td>
                <td className="px-4 py-2">
                  Life of active Account; 90 days after account cancellation, then permanently
                  deleted
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Deletion is permanent and cannot be undone. Keep your own records of any data you need to
          retain.
        </p>
      </section>

      {/* 8. Contacting Participants and CRM Integration */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          8. Contacting Participants and CRM Integration
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You may only contact Participants who have expressly opted in. The Platform provides two
          optional consent checkboxes, both unticked by default:
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Klokk communications</span> — allows Klokk
            to contact the Participant about its own services.
          </li>
          <li>
            <span className="font-medium text-foreground">Organiser communications</span> — allows
            you to add the Participant to your own customer system and contact them directly.
          </li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You must only market to or contact Participants who have ticked the second checkbox. You
          must honour all unsubscribe and withdrawal requests promptly. You must comply with the
          Spam Act 2003 (Cth), the Australian Privacy Act 1988 (Cth), and all other applicable laws.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">CRM Integration.</span> On paid Plans, you
          may connect your own account with a supported CRM (including HighLevel right now and
          HubSpot, Salesforce, ActiveCampaign, Pipedrive, and Zoho will be available in the future)
          to automatically add opted-in Participants to your CRM. You must hold authority to connect
          any CRM account you link. You are solely responsible for ensuring your use of Participant
          data within your CRM complies with applicable privacy and marketing laws.
        </p>
      </section>

      {/* 9. Embed Widget */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">9. Embed Widget</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Organisers on paid Plans may embed the Event response widget on a third-party web page.
          You are responsible for the security of the page on which the widget is embedded. We are
          not liable for any breach, data loss, or harm resulting from the security of a third-party
          page.
        </p>
      </section>

      {/* 10. Intellectual Property */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          10. Intellectual Property
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The Platform, including its software, design, branding, and content, is owned by or
          licensed to Pegasus Apps. All rights are reserved. You must not copy, modify, distribute,
          or create derivative works from any part of the Platform without our prior written
          consent.
        </p>
      </section>

      {/* 11. Australian Consumer Law */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          11. Australian Consumer Law
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing in these Terms excludes, restricts, or modifies any right or remedy you have under
          the Australian Consumer Law (Schedule 2, Competition and Consumer Act 2010 (Cth)). If the
          Platform fails to meet a consumer guarantee, you may be entitled to a remedy including, in
          the case of a major failure, a refund.
        </p>
      </section>

      {/* 12. Limitation of Liability */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          12. Limitation of Liability
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To the maximum extent permitted by law:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>(a) the Platform is provided "as is" and without warranty;</li>
          <li>
            (b) we are not liable for any indirect, incidental, special, or consequential loss,
            including loss of data, missed meetings, or lost revenue; and
          </li>
          <li>
            (c) our total liability for any claim arising under or in connection with these Terms is
            limited to the fees you paid to us in the 3 months before the event giving rise to the
            claim.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing in this clause limits our liability for death or personal injury caused by our
          negligence, fraud, or any liability that cannot be limited by law.
        </p>
      </section>

      {/* 13. Indemnification */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">13. Indemnification</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You agree to indemnify and hold harmless Pegasus Apps, its directors, employees, and
          agents from and against any claims, losses, damages, or expenses (including legal fees)
          arising from your use of the Platform, your breach of these Terms, or your violation of
          any third party's rights.
        </p>
      </section>

      {/* 14. Account Suspension and Termination */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          14. Account Suspension and Termination
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We may suspend or terminate your Account if:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            (a) you breach these Terms and fail to remedy the breach within 7 days of written notice
            (where capable of remedy);
          </li>
          <li>
            (b) you breach clause 6 (Acceptable Use) — where severe, suspension may be immediate; or
          </li>
          <li>(c) we are required to do so by law.</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You may cancel your Account at any time from Account Settings. On cancellation, your
          Account and associated data will be retained for 90 days before permanent deletion.
        </p>
      </section>

      {/* 15. Changes to These Terms */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          15. Changes to These Terms
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We may update these Terms from time to time. For material changes, we will give you at
          least 30 days' notice by email. Continued use after the notice period constitutes
          acceptance. If you do not agree to the changes, stop using the Platform before they take
          effect.
        </p>
      </section>

      {/* 16. General */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">16. General</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Governing law.</span> These Terms are
          governed by the laws of Queensland, Australia. You submit to the exclusive jurisdiction of
          the courts of Queensland.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Dispute resolution.</span> Before commencing
          legal proceedings, you agree to contact us via the webchat to attempt resolution in good
          faith within 30 days.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Entire agreement.</span> These Terms,
          together with our Privacy Policy and Billing &amp; Refund Policy, constitute the entire
          agreement between you and us in relation to the Platform.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Severability.</span> If any provision is
          unenforceable, the remaining provisions continue in full force.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Assignment.</span> We may assign these Terms
          to a successor entity. You may not assign your rights without our written consent.
        </p>
      </section>
    </div>
  );
}
