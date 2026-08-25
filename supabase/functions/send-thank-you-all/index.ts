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
  eventId: z.string().uuid(),
  template: z.string().trim().min(10).max(4000).optional(),
  subject: z.string().trim().min(3).max(160).optional(),
  audience: z.enum(["all", "paid", "unpaid"]).default("all"),
  saveTemplate: z.boolean().default(true),
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
    const { eventId, template, subject, audience, saveTemplate } = parsed.data;

    const { data: event } = await admin
      .from("fundraising_events")
      .select("id, title, admin_id, sender_email, sender_name, template_thank_you_all")
      .eq("id", eventId)
      .maybeSingle();

    if (!event || event.admin_id !== userData.user.id) {
      return json({ error: "Not authorized for this event" }, 403);
    }

    const bodyTemplate = template ?? event.template_thank_you_all ??
      "Dear ${name}, thank you for standing with the Tuendelee Foundation.";

    if (saveTemplate && template) {
      await admin
        .from("fundraising_events")
        .update({ template_thank_you_all: template })
        .eq("id", eventId);
    }

    let query = admin
      .from("event_pledges")
      .select("id, name, email, amount, currency, is_confirmed, badge_rank")
      .eq("event_id", eventId)
      .not("email", "is", null);

    if (audience === "paid") query = query.eq("is_confirmed", true);
    if (audience === "unpaid") query = query.eq("is_confirmed", false);

    const { data: pledges, error } = await query.limit(1000);
    if (error) throw error;

    // One email per donor address, totalling their contributions.
    const donors = new Map<
      string,
      { name: string; total: number; currency: string; ids: string[]; badge: number | null }
    >();
    for (const p of pledges ?? []) {
      const key = (p.email as string).toLowerCase().trim();
      const existing = donors.get(key);
      if (existing) {
        existing.total += Number(p.amount);
        existing.ids.push(p.id);
        existing.badge = existing.badge ?? p.badge_rank;
      } else {
        donors.set(key, {
          name: p.name ?? "Friend",
          total: Number(p.amount),
          currency: p.currency,
          ids: [p.id],
          badge: p.badge_rank,
        });
      }
    }

    let sent = 0;
    let failed = 0;

    for (const [email, donor] of donors) {
      const messageText = renderTemplate(bodyTemplate, {
        name: donor.name,
        amount: String(Math.round(donor.total)),
        currency: donor.currency,
        event_title: event.title,
      });

      const html = emailShell(
        `Thank you, ${donor.name}!`,
        `<p style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${messageText}</p>
         ${detailsTable([
           ["Campaign", event.title],
           ["Your total contribution", formatMoney(donor.total, donor.currency)],
         ])}
         ${
           donor.badge
             ? `<p style="margin:16px 0;padding:12px;border-radius:8px;background:#ecfdf5;color:#065f46;font-weight:600;">🏅 Tuendelee Founding Supporter — donor #${donor.badge}</p>`
             : ""
         }`,
        "Tuendelee Foundation • Asante sana",
      );

      const result = await sendEmail(
        email,
        subject ?? `Thank you for supporting ${event.title}`,
        html,
        senderAddress(event.sender_name, event.sender_email),
      );
      if (result.status === "failed") failed += 1;
      else sent += 1;

      await admin.from("pledge_notifications").insert({
        pledge_id: donor.ids[0],
        notification_type: "thank_you_bulk",
        channel: "email",
        recipient: email,
        message: messageText,
        status: result.status,
        error_message: result.error ?? null,
      });

      await admin
        .from("event_pledges")
        .update({ thank_you_sent_at: new Date().toISOString() })
        .in("id", donor.ids);
    }

    await admin
      .from("fundraising_events")
      .update({ thank_you_all_sent_at: new Date().toISOString() })
      .eq("id", eventId);

    await admin.from("admin_notifications").insert({
      admin_id: event.admin_id,
      event_id: eventId,
      type: "thank_you_bulk",
      title: "Thank-you notes sent",
      body: `${sent} donor${sent === 1 ? "" : "s"} emailed${failed ? `, ${failed} failed` : ""}.`,
    });

    return json({ recipients: donors.size, sent, failed });
  } catch (error) {
    console.error("send-thank-you-all failed:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
