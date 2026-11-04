<!--
Grounded in raw/get-started--changelog--keep-a-changelog-2.0.0.md and
raw/get-started--versioning--semver-2.0.0-official.md. Six change types only:
Added, Changed, Deprecated, Removed, Fixed, Security. Do not invent a
seventh. Keep Unreleased at the top always; rename it to a dated version at
release time and start a fresh empty Unreleased. Delete this comment block
once the file has its first real entry.
-->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Create-event time step explains how to offer several times on one date, with AM/PM dropdowns and times grouped by date.
- "Embed on a website" button on the event-created screen and an "Embed code" button on the event page.

- Post-signup "Check your inbox" screen explaining how to verify an email, with a resend button; the same guidance on sign-in and on the dashboard for unverified accounts.
- Embed panel: a "website this link is for" field next to Create link (adds the site to the allowed list), with script and iframe code shown straight away and a copy button.
- Plan limits guide on event creation covering participants per plan, pricing and overage.

### Changed

- Creating an event is blocked at the first step until the email is verified, instead of failing at the end.
- Every price shown to users now states its currency (AUD).
- Wildcard entries on shared domains (for example `*.co.uk`, `*.vercel.app`) are rejected from the embed allowed-websites list.

### Deprecated

### Removed

### Fixed

- `profiles.email_verified` is now reconciled with Supabase Auth on the server when the account loads, because the `auth.users` trigger that did this is not available on this platform. Without it, people who verified their email stayed blocked from creating events.

### Security

- Migration `20261104000000` attaches the profile protection triggers (`profiles_protect_privileged`, `on_auth_user_email_confirmed`) that were missing from the live database, so signed-in users can no longer edit their own plan, verified flag, event counter or billing fields.

[Unreleased]: https://github.com/PBT-tech/Klokk/commits/main
