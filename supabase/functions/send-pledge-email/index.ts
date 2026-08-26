import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import {
  detailsTable,
  emailShell,
  formatMoney,
  renderTemplate,
  sendEmail,
  senderAddress,
} from "../_shared/email.ts";

const BodySchema = z.object({
  pledgeId: z.string().uuid(),
  kind: z.enum(["pledge_created", "payment_confirmed"]),
  sessionToken: z.string().min(24).max(128),
});

const SUBJECTS: Record<string, string> = {
  pledge_created: "We received your pledge — thank you!",
  payment_confirmed: "Payment received — your receipt",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { pledgeId, kind, sessionToken } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pledge, error: pledgeError } = await supabase
      .from("event_pledges")
      .select(
        "id, event_id, name, email, amount, currency, payment_type, payment_method, payment_reference, payment_deadline, verification_status, badge_rank, is_confirmed",
      )
      .eq("id", pledgeId)
      .maybeSingle();

    if (pledgeError) throw pledgeError;
    if (!pledge) return json({ error: "Pledge not found" }, 404);
    if (!pledge.email) return json({ skipped: "Pledge has no email address" });

    const { data: eventSession, error: sessionError } = await supabase
      .from("event_sessions")
      .select("id")
      .eq("event_id", pledge.event_id)
      .eq("session_token", sessionToken)
      .gt("last_activity", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!eventSession) return json({ error: "Invalid or expired event session" }, 403);

    const { data: event } = await supabase
      .from("fundraising_events")
      .select("id, title, sender_email, sender_name, template_pledge_created, template_payment_confirmed")
      .eq("id", pledge.event_id)
      .maybeSingle();

    const money = formatMoney(Number(pledge.amount), pledge.currency);
    const deadline = pledge.payment_deadline
      ? new Date(pledge.payment_deadline).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

    const template =
      kind === "pledge_created"
        ? event?.template_pledge_created ??
          "Thank you for pledging ${amount} ${currency}! Your pledge reference is ${pledge_id}. Payment is due by ${deadline}."
        : event?.template_payment_confirmed ??
          "Thank you for your generous donation of ${amount} ${currency}! Your payment has been recorded.";

    const messageText = renderTemplate(template, {
      name: pledge.name ?? "Friend",
      amount: String(pledge.amount),
      currency: pledge.currency,
      pledge_id: pledge.id.slice(0, 8).toUpperCase(),
      deadline,
      receipt_url: "",
    });

    const badgeBlock =
      kind === "payment_confirmed" && pledge.badge_rank
        ? `<p style="margin:16px 0;padding:12px;border-radius:8px;background:#ecfdf5;color:#065f46;font-weight:600;">
             🏅 You are donor #${pledge.badge_rank} for this campaign — a Tuendelee Founding Supporter badge is now on your donor card.
           </p>`
        : "";

    const html = emailShell(
      kind === "pledge_created" ? `Thank you, ${pledge.name}!` : `Payment recorded, ${pledge.name}!`,
      `<p style="font-size:15px;line-height:1.6;">${messageText}</p>
       ${detailsTable([
         ["Pledge reference", pledge.id.slice(0, 8).toUpperCase()],
         ["Campaign", event?.title ?? "-"],
         ["Amount", money],
         ["Payment method", pledge.payment_method ?? "-"],
         ["Transaction reference", pledge.payment_reference ?? "-"],
         ["Payment due", kind === "pledge_created" ? deadline : "-"],
         [
           "Verification",
           pledge.verification_status === "verified"
             ? "Verified by our team"
             : pledge.verification_status === "reference_ok"
               ? "Reference format checked — awaiting final reconciliation"
               : pledge.verification_status === "reference_invalid"
                 ? "Reference needs review — our team will contact you"
                 : "Pending review",
         ],
       ])}
       ${badgeBlock}
       <p style="font-size:14px;color:#6b7280;">Keep this email as your record. You can revisit the fundraising room at any time and use “Find My Pledge” to complete or review a payment.</p>`,
      "Tuendelee Foundation • Nairobi, Kenya",
    );

    const result = await sendEmail(
      pledge.email,
      SUBJECTS[kind],
      html,
      senderAddress(event?.sender_name, event?.sender_email),
    );

    await supabase.from("pledge_notifications").insert({
      pledge_id: pledge.id,
      notification_type: kind,
      channel: "email",
      recipient: pledge.email,
      message: messageText,
      status: result.status,
      error_message: result.error ?? null,
    });

    if (kind === "payment_confirmed") {
      await supabase
        .from("event_pledges")
        .update({ receipt_sent_at: new Date().toISOString() })
        .eq("id", pledge.id);
    }

    return json({ status: result.status, error: result.error ?? null });
  } catch (error) {
    console.error("send-pledge-email failed:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
