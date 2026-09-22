/**
 * Registry of every event text the admin can override.
 * Each entry has a stable key (stored in public.event_custom_texts),
 * a human label for the editor, and the original default wording.
 */

export interface EventTextField {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
  hint?: string;
}

export interface EventTextGroup {
  group: string;
  description: string;
  fields: EventTextField[];
}

export const EVENT_TEXT_GROUPS: EventTextGroup[] = [
  {
    group: "Donor event room",
    description:
      "Words donors see on the live event page. These override the built-in translations for every language.",
    fields: [
      { key: "room.progress", label: "Progress section title", defaultValue: "Live Fundraising Progress" },
      { key: "room.recentDonations", label: "Recent donations title", defaultValue: "Recent Donations" },
      { key: "room.noDonations", label: "No donations yet message", defaultValue: "No pledges yet. Be the first to make a difference!" },
      { key: "room.makePledge", label: "Pledge form title", defaultValue: "Make a Pledge" },
      { key: "room.eventEnded", label: "Event ended title", defaultValue: "This Event Has Ended" },
      {
        key: "room.eventEndedBody",
        label: "Event ended message",
        defaultValue: "Thank you for your interest. This fundraising event is no longer accepting pledges.",
        multiline: true,
      },
    ],
  },
  {
    group: "Thermometer tab",
    description: "Heading on the admin thermometer tab.",
    fields: [
      { key: "thermometer.title", label: "Title", defaultValue: "Fundraising Progress" },
    ],
  },
  {
    group: "Meetings tab",
    description: "Heading and empty-state text on the admin meetings tab.",
    fields: [
      { key: "meetings.title", label: "Title", defaultValue: "Your Scheduled Meetings" },
      { key: "meetings.empty", label: "No meetings message", defaultValue: "No meetings scheduled yet." },
    ],
  },
  {
    group: "Participants tab",
    description: "Heading on the admin participants tab.",
    fields: [
      { key: "participants.title", label: "Title", defaultValue: "Event Participants" },
    ],
  },
  {
    group: "Reports tab",
    description: "Heading on the admin reports tab.",
    fields: [
      { key: "reports.title", label: "Title", defaultValue: "Pledge Reports" },
    ],
  },
  {
    group: "Add Pledge tab",
    description: "Heading and explanation on the manual pledge entry tab.",
    fields: [
      { key: "manual.title", label: "Title", defaultValue: "Manual Pledge Entry" },
      { key: "manual.description", label: "Description", defaultValue: "Add pledges manually on behalf of donors" },
    ],
  },
  {
    group: "Verify Payments tab",
    description: "Heading, explanation and the blue reference-rules box.",
    fields: [
      { key: "verify.title", label: "Title", defaultValue: "Verify transaction evidence" },
      {
        key: "verify.description",
        label: "Description",
        defaultValue:
          "Check each donor's transaction code and uploaded receipt, then mark the payment verified or rejected. Donors keep their pledge record either way — nothing is counted twice.",
        multiline: true,
      },
      {
        key: "verify.rulesTitle",
        label: "Rules box title",
        defaultValue: "How references are checked automatically",
      },
      {
        key: "verify.rules",
        label: "Rules box content",
        defaultValue:
          "M-Pesa: 10 characters, letters and numbers (e.g. QA12B3C4D5).\nPayPal: 17 characters, letters and numbers.\nBank transfer: 6–40 characters, letters, numbers or slashes.\nBenevity: the donation ID from your company portal (4–60 characters).\nAny reference already used on this event is flagged as a possible duplicate so the same payment is never counted twice.",
        multiline: true,
        hint: "One rule per line — each line becomes a bullet point.",
      },
    ],
  },
  {
    group: "Reconciliation tab",
    description: "Headings and explanations on the bank reconciliation tab.",
    fields: [
      { key: "recon.senderTitle", label: "Sending email card title", defaultValue: "Official sending email" },
      {
        key: "recon.senderDescription",
        label: "Sending email card description",
        defaultValue:
          "All system emails (pledge confirmations, reminders, receipts and follow-ups) will be sent from this organisational address.",
        multiline: true,
      },
      { key: "recon.uploadTitle", label: "Upload card title", defaultValue: "Upload bank / M-Pesa statement" },
      {
        key: "recon.uploadDescription",
        label: "Upload card description",
        defaultValue:
          "Upload the CSV exported from your bank or M-Pesa account. Columns are detected automatically (date, reference/receipt, payer name, description, amount). The system then compares every deposit against the pledges recorded here.",
        multiline: true,
      },
      { key: "recon.overviewTitle", label: "Overview chart title", defaultValue: "Reconciliation overview" },
      { key: "recon.followupTitle", label: "Follow-up email title", defaultValue: "Follow-up email" },
    ],
  },
  {
    group: "Power BI tab",
    description: "Headings and explanations on the Power BI export tab.",
    fields: [
      { key: "powerbi.exportTitle", label: "Export card title", defaultValue: "Power BI & Excel visualisation" },
      {
        key: "powerbi.exportDescription",
        label: "Export card description",
        defaultValue:
          "Export this event's pledge and payment data, or connect Power BI straight to the database for dashboards that refresh on their own.",
        multiline: true,
      },
      { key: "powerbi.liveTitle", label: "Live connection title", defaultValue: "Live connection (auto-refreshing dashboards)" },
      { key: "powerbi.scheduleTitle", label: "Refresh schedule title", defaultValue: "Refresh schedule" },
    ],
  },
];

const DEFAULTS: Record<string, string> = Object.fromEntries(
  EVENT_TEXT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.defaultValue]))
);

/** Original wording for a key (used as fallback when no override is saved). */
export function defaultEventText(key: string): string {
  return DEFAULTS[key] ?? "";
}
