# Full-app translation in the donor's chosen language

Goal: when a donor picks EN/IT/FR/SW/ES/DE, every written word they see or receive switches to that language. Admin-uploaded videos, audio and photos stay as they are.

## What changes for donors

1. **Payment instructions** – M-Pesa Paybill steps, PayPal, bank, Benevity instructions, "Already paid?" notes, upload-evidence hints, all pop-up messages (success/error, "not available yet").
2. **Pledge flow** – remaining English on the pledge form, Find My Pledge, receipt download, recent donations list, thermometer labels (Raised, Pledged, Paid, Goal, milestones).
3. **Help pages** – both Help dialogs (homepage and event room), fully translated.
4. **Emails** – pledge received, payment receipt, payment reminders, follow-ups and the thank-you-to-all message are sent in the language the donor was using when they pledged.
5. **Admin-written text** (event wording, thank-you notes, email templates, story titles/descriptions) – shown in the donor's language. Where the admin already typed a translation, that is used; where not, it is translated automatically by AI and saved, so the admin can still correct it later.

## What stays unchanged
- Videos, audio and images uploaded by the admin.
- Admin dashboard stays in the admin's chosen language (already translated where it exists).
- Names, amounts, transaction codes.

## Technical details
- Move all hardcoded strings in PaymentConfirmation, ImprovedPaymentOptions, PledgeReceipt, RecentPledges, ImprovedThermometer, HelpDialog, HomeHelpDialog, FindMyPledge, EventRoom toasts into `i18nApp.ts` with all 6 languages.
- Migration: add `preferred_language text default 'en'` to `event_pledges` (and `event_sessions`); set it from the language context when joining/pledging.
- Edge functions (`send-pledge-email`, `pledge-reminders`, `send-followup-email`, `send-thank-you-all`): shared `_shared/emailI18n.ts` with translated subjects, headings, table labels, footers; admin templates translated via Lovable AI gateway, cached in a new `translation_cache` table (source hash + language).
- Custom event texts and impact stories: fall back to cached AI translation when the per-language field is empty.
