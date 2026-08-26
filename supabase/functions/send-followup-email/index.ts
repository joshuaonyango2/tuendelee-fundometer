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
  resolveSender,
} from "../_shared/email.ts";

const BodySchema = z.object({
  eventId: z.string().uuid(),
  pledgeIds: z.array(z.string().uuid()).min(1).max(500),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(4000),
  kind: z.string().trim().min(3).max(40).default("reconciliation_followup"),
});

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
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { eventId, pledgeIds, subject, message, kind } = parsed.data;

    const { data: event } = await admin
      .from("fundraising_events")
      .select("id, title, admin_id, sender_email, sender_name")
      .eq("id", eventId)
      .maybeSingle();

    if (!event || event.admin_id !== userData.user.id) {
      return json({ error: "Not authorized for this event" }, 403);
    }

    const from = await resolveSender(supabase, event);

    const { data: pledges, error } = await admin
      .from("event_pledges")
      .select("id, name, email, amount, currency, payment_method, payment_reference, is_confirmed")
      .eq("event_id", eventId)
      .in("id", pledgeIds)
      .not("email", "is", null);

    if (error) throw error;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const pledge of pledges ?? []) {
      const email = (pledge.email as string)?.trim();
      if (!email) {
        skipped += 1;
        continue;
      }

      const body = renderTemplate(message, {
        name: pledge.name ?? "Friend",
        amount: String(Math.round(Number(pledge.amount))),
        currency: pledge.currency,
        event_title: event.title,
        reference: pledge.payment_reference ?? "",
      });

      const html = emailShell(
        `Hello ${pledge.name ?? "Friend"}`,
        `<p style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${body}</p>
         ${detailsTable([
           ["Campaign", event.title],
           ["Amount on record", formatMoney(Number(pledge.amount), pledge.currency)],
           ["Payment method", pledge.payment_method ?? "-"],
           ["Reference on record", pledge.payment_reference ?? "-"],
         ])}`,
        event.sender_email
          ? `Sent by ${event.sender_name ?? "Tuendelee Foundation"} • ${event.sender_email}`
          : undefined,
      );

      const result = await sendEmail(email, subject, html, from);
      if (result.status === "failed") failed += 1;
      else sent += 1;

      await admin.from("pledge_notifications").insert({
        pledge_id: pledge.id,
        notification_type: kind,
        channel: "email",
        recipient: email,
        message: body,
        status: result.status,
        error_message: result.error ?? null,
      });
    }

    return json({ requested: pledgeIds.length, sent, failed, skipped });
  } catch (error) {
    console.error("send-followup-email failed:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
