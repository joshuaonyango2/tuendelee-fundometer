// Shared email + template helpers for Tuendelee Fundometer notifications.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export const FROM_ADDRESS =
  Deno.env.get("FUNDOMETER_FROM_EMAIL") ?? "Tuendelee Fundometer <onboarding@resend.dev>";

export interface SendResult {
  status: "sent" | "queued" | "failed";
  error?: string;
}

/**
 * Sends an email through the Resend connector gateway.
 * When the Resend connection is not linked yet, the message is reported as
 * "queued" so the caller can still record it in the notification log.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string,
): Promise<SendResult> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  if (!lovableKey || !resendKey) {
    console.warn("Resend is not connected yet — recording notification without delivery");
    return { status: "queued", error: "Email provider not connected" };
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({ from: from || FROM_ADDRESS, to: [to], subject, html }),
  });


  if (!response.ok) {
    const details = await response.text();
    console.error(`Resend request failed [${response.status}]: ${details}`);
    return { status: "failed", error: `[${response.status}] ${details}` };
  }

  return { status: "sent" };
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_match, key: string) => vars[key] ?? "");
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function emailShell(heading: string, bodyHtml: string, footerNote?: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f7f9;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#0f766e;padding:20px 24px;">
        <h1 style="margin:0;font-size:20px;color:#ffffff;">Tuendelee Foundation</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#d1fae5;">Fundometer</p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px;font-size:18px;">${heading}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#6b7280;">
        ${footerNote ?? "Questions? Reply to this email and our team will help you."}
      </div>
    </div>
  </body>
</html>`;
}

export function detailsTable(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0;">
    ${rows
      .filter(([, value]) => value && value !== "-")
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 0;color:#6b7280;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${value}</td></tr>`,
      )
      .join("")}
  </table>`;
}

/** Builds a formal "Name <email>" From header from admin-provided values. */
export function senderAddress(name?: string | null, email?: string | null): string | undefined {
  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) return undefined;
  const trimmedName = (name ?? "").trim().replace(/["<>]/g, "");
  return trimmedName ? `${trimmedName} <${trimmedEmail}>` : trimmedEmail;
}

/**
 * Resolves the From header for an event: the event's own sender address when set,
 * otherwise the organisation-wide official address stored on the admin profile.
 * This keeps outgoing mail on the Tuendelee organisational address even when an
 * individual admin account changes.
 */
export async function resolveSender(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  event?: { sender_name?: string | null; sender_email?: string | null; admin_id?: string | null } | null,
): Promise<string | undefined> {
  const eventSender = senderAddress(event?.sender_name, event?.sender_email);
  if (eventSender) return eventSender;

  if (!event?.admin_id) return undefined;
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("org_name, org_email")
    .eq("user_id", event.admin_id)
    .maybeSingle();

  return senderAddress(profile?.org_name ?? event?.sender_name, profile?.org_email);
}

