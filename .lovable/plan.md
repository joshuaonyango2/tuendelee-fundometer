# Fundometer upgrade: media, payment proof, live thermometer, admin control

This is a large request, so it is split into phases you can approve and see shipped in order. Phase 1 and 2 give the biggest donor-facing impact.

## Phase 1 — Thermometer that feels alive

- Use the exact same colour tokens as the four progress cards (goal / total pledged / paid / needed) inside the thermometer fill, so nothing looks mismatched.
- Calibrated scale read bottom-up: tick marks every 10% with USD on the left and KES on the right, plus bold labelled bands at 25%, 50%, 75%, 100%.
- Rising animation: when a new pledge or payment arrives in real time, the mercury animates up from its old level, the changed amount pulses, and a floating "+$X just pledged" bubble appears.
- Milestone celebrations at 25%, 50%, 75% and 100%: confetti burst, a celebratory sound (mutable, remembered per visitor), and a milestone banner. Each milestone fires once per session so it is not spammy.
- Fix the reported discrepancy: paid + unpaid totals will be computed from one shared helper for both donor and admin views so the cards, thermometer and reports always agree.

## Phase 2 — Payment proof and verification

- Payment confirmation form gains: transaction code (required) **and** optional receipt/screenshot upload (image or PDF, max ~5 MB) stored in a private storage bucket.
- Format validation on entry, using the existing rules: M-Pesa 10-character code, PayPal 17-character ID, bank reference, Benevity. Bad formats are flagged immediately with a hint, not rejected outright.
- Admin sees each proof inline in the pledge report and reconciliation tabs: thumbnail/preview, transaction code, auto-check result, plus Verify / Reject buttons with a note.
- Duplicate transaction codes stay flagged as they are today, and the admin now sees the uploaded proof side by side to judge.

Note on automatic verification: neither Safaricom nor PayPal lets an app confirm a payment from a code alone without a merchant API integration (M-Pesa Daraja / PayPal REST). The above gives format checking, proof capture and bank-statement matching now; a true live M-Pesa/PayPal lookup can be a later phase if you obtain merchant API credentials.

## Phase 3 — YouTube channel on Impact Stories

- Admin sets a YouTube channel URL/handle (plus optional playlist) in the Impact Stories manager.
- Impact Stories page shows a gallery of the channel's videos the donor can pick from and watch inline, with a "Donate now" button beside the player.
- Existing single featured story stays on the homepage; the channel gallery lives on `/impact-stories`.

## Phase 4 — Admin content control (WordPress-like editing)

- New **Site Content** tab in the admin dashboard: every donor-facing block of text (hero headline and subtext, CTA labels, section titles, help/FAQ articles, payment instructions, email templates) becomes editable per language (EN / IT / FR / SW).
- Stored in a `site_content` table with a key per block; the app reads it with the current hard-coded text as fallback, so nothing breaks if a key is missing.
- Admin can also reorder, hide or delete optional sections (impact story, recent donations, help entries).

## Phase 5 — Look and feel

- Refreshed visual language on both sides: warmer palette drawn from the existing tokens, stronger typography scale, card depth, subtle motion on load, better empty and loading states.
- Admin dashboard gets a cleaner shell: summary strip, grouped tabs, denser but readable tables.
- Payment and "how to use the Fundometer" instructions rewritten to match the new proof-upload flow, in all four languages.

## Phase 6 — Power BI

Power BI cannot be embedded from the app without a Power BI Pro/Embedded licence and an Azure app registration. What is practical now:

- A stable, authenticated CSV/JSON export endpoint per event that Power BI Desktop or Service can pull from on a refresh schedule ("Get data → Web").
- A one-click "Copy Power BI data URL" button in the reconciliation tab.
- If you later provide Power BI Embedded credentials, an embedded report tile can be added to the admin dashboard.

## Technical notes

- New tables/columns: `payment_proofs` (or `proof_url` + `proof_uploaded_at` on `event_pledges`), `site_content`, YouTube channel fields on an admin settings row. All with explicit GRANTs and RLS (admins full access, donors insert-only on their own proof via a security-definer RPC guarded by the session token).
- New private storage bucket `payment-proofs`; admin reads via signed URLs.
- Thermometer work stays in `src/components/ImprovedThermometer.tsx` plus a shared `useEventTotals` hook; celebrations via a small confetti + audio helper.
- Export endpoint as a Supabase edge function with a rotating access token, so no service-role key is exposed.
