import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Klokk" },
      {
        name: "description",
        content:
          "Privacy Policy for the Klokk platform, provided by Pegasus Apps. Information we collect, how we use it, data retention, security, and your rights under Australian and GDPR law.",
      },
      { property: "og:title", content: "Privacy Policy — Klokk" },
      {
        property: "og:description",
        content: "Privacy Policy for the Klokk platform, provided by Pegasus Apps.",
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

      <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: 01 Nov 2026 · Controller: Pegasus Apps
      </p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        This Privacy Policy explains how we collect, use, disclose, and protect personal information
        in connection with the Klokk platform (Platform). It applies to both Organisers (registered
        Account holders) and Participants (individuals who submit availability in response to an
        Event link).
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        We are bound by the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
        Where you are located in the European Economic Area or the United Kingdom, we also process
        your data in accordance with the General Data Protection Regulation (GDPR) and UK GDPR as
        described in Section 14.
      </p>

      {/* 1. Information We Collect */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          1. Information We Collect
        </h2>

        <p className="mt-3 text-sm font-medium text-foreground">
          From Organisers — at registration and ongoing use:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Name, Email address, and password (hashed)</li>
          <li>
            Billing name, billing address, and payment card metadata (last 4 digits, expiry, card
            type) — full card details are processed exclusively by Stripe and never stored on our
            servers
          </li>
          <li>Plan tier and usage data (Events created, Credits consumed, Seats used)</li>
          <li>IP address and device/browser information for security logging</li>
          <li>Communications with our support team</li>
        </ul>

        <p className="mt-4 text-sm font-medium text-foreground">
          From Participants — when submitting availability:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Name and email address (required to send confirmation and results)</li>
          <li>Availability selections submitted in response to an Event</li>
          <li>Optional consent selections (Klokk communications; Organiser communications)</li>
          <li>IP address and browser information for fraud prevention</li>
        </ul>

        <p className="mt-4 text-sm font-medium text-foreground">Automatically from all users:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Log data: pages visited, timestamps, referrer, session duration</li>
          <li>Cookies and similar tracking technologies (see Section 9)</li>
        </ul>
      </section>

      {/* 2. How We Use Your Information */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          2. How We Use Your Information
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-foreground">Purpose</th>
                <th className="pb-2 font-medium text-foreground">
                  Lawful basis (Australia / GDPR)
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Provide and operate the Platform</td>
                <td className="py-2">Performance of contract / APP 3</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Process payments and manage subscriptions</td>
                <td className="py-2">Performance of contract / APP 3</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">
                  Send transactional emails (confirmations, results, receipts)
                </td>
                <td className="py-2">Performance of contract / APP 3</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Detect fraud and ensure Platform security</td>
                <td className="py-2">Legitimate interests / APP 3</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Comply with legal obligations</td>
                <td className="py-2">Legal obligation / APP 3</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">
                  Send marketing emails to Organisers (product updates, tips)
                </td>
                <td className="py-2">Consent / APP 3 — opt-out available at any time</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Enable Organisers to contact opted-in Participants</td>
                <td className="py-2">Consent (Participant's) / APP 3</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Improve the Platform through aggregate analytics</td>
                <td className="py-2">Legitimate interests / APP 3</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We will not use your personal information for any purpose that is incompatible with the
          purpose for which it was collected without your consent.
        </p>
      </section>

      {/* 3. Participant Consent and Organiser Use */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          3. Participant Consent and Organiser Use
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Participants are shown two clearly labelled, unticked checkboxes:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Klokk communications</span> — Participant
            consents to Klokk contacting them about Klokk's own products and services.
          </li>
          <li>
            <span className="font-medium text-foreground">Organiser communications</span> —
            Participant consents to the Organiser adding their details to the Organiser's own
            customer system and contacting them.
          </li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          An Organiser may only contact, market to, or add to a CRM a Participant who has explicitly
          ticked checkbox 2. Organisers who misuse Participant data are in breach of these Terms and
          applicable law, and we reserve the right to terminate their Account.
        </p>
      </section>

      {/* 4. CRM Integration and Data Transfer to Organisers */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          4. CRM Integration and Data Transfer to Organisers
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          On paid Plans, Organisers may connect a supported CRM (HighLevel now and HubSpot,
          Salesforce, ActiveCampaign, Pipedrive, Zoho in the future) to receive opted-in Participant
          data automatically. When this feature is used:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            We act as a data processor on behalf of the Organiser (the data controller) in respect
            of Participant data transferred to their CRM.
          </li>
          <li>
            The Organiser is solely responsible for their use of that data and for complying with
            applicable privacy and marketing laws (including the Privacy Act 1988 (Cth) and the Spam
            Act 2003 (Cth)).
          </li>
          <li>
            We do not retain copies of data once it is transferred to the Organiser's CRM beyond
            what is required for audit and security logging.
          </li>
        </ul>
      </section>

      {/* 5. Disclosure of Personal Information */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          5. Disclosure of Personal Information
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We do not sell, rent, or trade personal information. We disclose personal information
          only:
        </p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>to our sub-processors (see Section 6) for the purposes described in this Policy;</li>
          <li>to Organisers, in respect of Participant data, as described in Sections 3 and 4;</li>
          <li>if required or authorised by law, a court order, or a government agency;</li>
          <li>to enforce our rights or protect the safety of users; or</li>
          <li>
            to a successor entity in the event of a merger, acquisition, or sale of assets, provided
            that the successor is bound by equivalent privacy obligations.
          </li>
        </ol>
      </section>

      {/* 6. Sub-processors */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">6. Sub-processors</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We use the following third-party sub-processors to operate the Platform. Each
          sub-processor is bound by contract to process data only on our instructions and to
          maintain appropriate security.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-foreground">Sub-processor</th>
                <th className="pb-2 pr-4 font-medium text-foreground">Purpose</th>
                <th className="pb-2 pr-4 font-medium text-foreground">Location</th>
                <th className="pb-2 font-medium text-foreground">Privacy reference</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 font-medium text-foreground">Stripe</td>
                <td className="py-2 pr-4">Payment processing and subscription management</td>
                <td className="py-2 pr-4">USA (global)</td>
                <td className="py-2">stripe.com/privacy</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 font-medium text-foreground">
                  GoHighLevel / HL AI Studio
                </td>
                <td className="py-2 pr-4">
                  Platform infrastructure, AI scheduling features, CRM integration relay
                </td>
                <td className="py-2 pr-4">USA</td>
                <td className="py-2">gohighlevel.com/privacy</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Twilio</td>
                <td className="py-2 pr-4">SMS and email notification delivery</td>
                <td className="py-2 pr-4">USA (global)</td>
                <td className="py-2">twilio.com/privacy</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We will notify you of any material changes to our sub-processor list by updating this
          Policy and, for significant changes, by email.
        </p>
      </section>

      {/* 7. Data Retention */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">7. Data Retention</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-foreground">Data type</th>
                <th className="pb-2 font-medium text-foreground">Retention period</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Free Trial Event data and Participant responses</td>
                <td className="py-2">30 days after Event close, then permanently deleted</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Paid plan Event data and Participant responses</td>
                <td className="py-2">
                  Life of active Account; 90 days after account cancellation, then permanently
                  deleted
                </td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Organiser Account data (profile, billing metadata)</td>
                <td className="py-2">
                  Life of active Account; 7 years after cancellation for tax and legal compliance
                </td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">Payment transaction records</td>
                <td className="py-2">7 years (required by tax law)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Security and access logs</td>
                <td className="py-2">12 months rolling</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Deletion is permanent and cannot be reversed. If you need a copy of your data, download it
          from Account Settings before cancelling.
        </p>
      </section>

      {/* 8. Security */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">8. Security</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We implement appropriate technical and organisational measures to protect personal
          information from unauthorised access, loss, misuse, or alteration. These include:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Encryption at rest: AES-256</li>
          <li>Encryption in transit: TLS 1.3</li>
          <li>
            Access controls: Role-based access; production data access restricted to authorised
            personnel on a need-to-know basis
          </li>
          <li>Penetration testing: Conducted periodically by independent third parties</li>
          <li>Incident response: We maintain a documented data breach response plan</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          In the event of a data breach that is likely to result in serious harm, we will notify
          affected individuals and the Office of the Australian Information Commissioner (OAIC) in
          accordance with the Notifiable Data Breaches scheme (Privacy Act 1988 (Cth), Part IIIC) as
          soon as practicable.
        </p>
      </section>

      {/* 9. Cookies and Tracking */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          9. Cookies and Tracking
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We use the following types of cookies:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-foreground">Cookie type</th>
                <th className="pb-2 pr-4 font-medium text-foreground">Purpose</th>
                <th className="pb-2 font-medium text-foreground">Opt-out</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 font-medium text-foreground">Essential</td>
                <td className="py-2 pr-4">Session authentication, security tokens</td>
                <td className="py-2">Cannot be disabled — required for Platform function</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 font-medium text-foreground">Functional</td>
                <td className="py-2 pr-4">Remembering language and display preferences</td>
                <td className="py-2">Via browser settings</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Analytics</td>
                <td className="py-2 pr-4">Aggregate usage statistics to improve the Platform</td>
                <td className="py-2">Via cookie banner or browser settings</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We do not use advertising or cross-site tracking cookies. You can control non-essential
          cookies through the cookie banner displayed on first visit or through your browser
          settings. Disabling essential cookies will prevent you from using the Platform.
        </p>
      </section>

      {/* 10. Your Rights (Australian Users) */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          10. Your Rights (Australian Users)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Under the Privacy Act 1988 (Cth) and the APPs, you have the right to:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Access</span> — request access to the
            personal information we hold about you (APP 12);
          </li>
          <li>
            <span className="font-medium text-foreground">Correction</span> — request that we
            correct inaccurate, incomplete, or out-of-date personal information (APP 13);
          </li>
          <li>
            <span className="font-medium text-foreground">Complaint</span> — lodge a complaint with
            us and, if unresolved, with the OAIC (oaic.gov.au).
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To exercise these rights, contact us via the webchat. We will respond via Email within 30
          days.
        </p>
      </section>

      {/* 11. Children */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">11. Children</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The Platform is not directed at children under 16 years of age, and we do not knowingly
          collect personal information from anyone under 16. If we become aware that we have
          inadvertently collected personal information from a child under 16, we will delete it
          promptly. If you believe we have such information, contact us at privacy@[domain].
        </p>
      </section>

      {/* 12. Links to Third-Party Services */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          12. Links to Third-Party Services
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The Platform may contain links to third-party websites or integrations (including CRM
          platforms). We are not responsible for the privacy practices of those services. We
          encourage you to read their privacy policies before providing personal information.
        </p>
      </section>

      {/* 13. Changes to This Policy */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          13. Changes to This Policy
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We may update this Privacy Policy from time to time. For material changes, we will notify
          you by email at least 30 days before the change takes effect. The updated Policy will be
          available at [domain]/privacy. Continued use after the notice period constitutes
          acceptance. If you do not agree, stop using the Platform and contact us to request
          deletion of your data.
        </p>
      </section>

      {/* 14. Additional Rights for EEA and UK Users */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          14. Additional Rights for EEA and UK Users (GDPR / UK GDPR)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If you are located in the European Economic Area or the United Kingdom, in addition to the
          rights in Section 10 you have the following rights under GDPR and UK GDPR:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Art. 15 — Right of access:</span> Obtain a
            copy of your personal data and information about how it is processed.
          </li>
          <li>
            <span className="font-medium text-foreground">Art. 16 — Right to rectification:</span>{" "}
            Have inaccurate data corrected.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Art. 17 — Right to erasure ("right to be forgotten"):
            </span>{" "}
            Request deletion of your personal data, subject to legal retention requirements.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Art. 18 — Right to restriction of processing:
            </span>{" "}
            Request that we restrict processing in certain circumstances.
          </li>
          <li>
            <span className="font-medium text-foreground">Art. 19 — Notification obligation:</span>{" "}
            We will notify sub-processors of rectification, erasure, or restriction requests.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Art. 20 — Right to data portability:
            </span>{" "}
            Receive your data in a structured, machine-readable format.
          </li>
          <li>
            <span className="font-medium text-foreground">Art. 21 — Right to object:</span> Object
            to processing based on legitimate interests or for direct marketing.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Art. 22 — Automated decision-making:
            </span>{" "}
            You have the right not to be subject to solely automated decisions that produce
            significant legal effects, unless necessary for a contract, authorised by law, or based
            on your explicit consent.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">International data transfers.</span> Our
          sub-processors (Stripe, GoHighLevel, Twilio) are based in the United States. Where we
          transfer personal data from the EEA or UK to these sub-processors, we do so under Standard
          Contractual Clauses approved by the European Commission, or equivalent UK transfer
          mechanisms, as applicable.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Supervisory authority.</span> You have the
          right to lodge a complaint with your national data protection authority. A list of EEA
          authorities is available at edpb.europa.eu.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Lawful bases summary.</span> We rely on
          contract performance (Art. 6(1)(b)) for core Platform services, legitimate interests (Art.
          6(1)(f)) for security and analytics, legal obligation (Art. 6(1)(c)) for tax and
          regulatory compliance, and consent (Art. 6(1)(a)) for marketing communications and CRM
          transfer.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To exercise any GDPR rights, contact us via webchat. We will respond via Email within 30
          days (or one calendar month as required by GDPR).
        </p>
      </section>

      {/* 15. Contact and Complaints */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          15. Contact and Complaints
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Privacy Officer</span> — Pegasus Apps.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          If you have a complaint about how we have handled your personal information and are not
          satisfied with our response, you may contact:
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Office of the Australian Information Commissioner (OAIC) — www.oaic.gov.au | 1300 363 992
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          EEA/UK users may contact their national supervisory authority (see Section 14).
        </p>
      </section>
    </div>
  );
}
