import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  detailsTable,
  emailShell,
  formatMoney,
  renderTemplate,
  sendEmail,
  senderAddress,
} from "../_shared/email.ts";

/**
 * Sends pledge payment reminders:
 *  - "half" reminder when half of the chosen pledge period has elapsed
 *  - "final" reminder one day before the deadline
 * Safe to run repeatedly: each reminder is stamped on the pledge row.
 */
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pledges, error } = await supabase
      .from("event_pledges")
      .select(
        "id, event_id, name, email, amount, currency, created_at, payment_deadline, pledge_duration_days, is_confirmed, is_archived, reminder_half_sent_at, reminder_final_sent_at",
      )
      .eq("is_confirmed", false)
      .eq("is_archived", false)
      .not("payment_deadline", "is", null)
      .limit(1000);

    if (error) throw error;

    const now = Date.now();
    const events = new Map<string, { title: string; template: string; admin_id: string }>();
    let sent = 0;
    const results: Record<string, string> = {};

    for (const pledge of pledges ?? []) {
      if (!pledge.email) continue;

      const created = new Date(pledge.created_at).getTime();
      const deadline = new Date(pledge.payment_deadline as string).getTime();
      if (deadline <= now) continue;

      const halfPoint = created + (deadline - created) / 2;
      const oneDayBefore = deadline - 24 * 60 * 60 * 1000;

      let stage: "half" | "final" | null = null;
      if (!pledge.reminder_final_sent_at && now >= oneDayBefore) {
        stage = "final";
      } else if (!pledge.reminder_half_sent_at && now >= halfPoint) {
        stage = "half";
      }
      if (!stage) continue;

      if (!events.has(pledge.event_id)) {
        const { data: event } = await supabase
          .from("fundraising_events")
          .select("title, template_payment_reminder, admin_id, sender_email, sender_name")
          .eq("id", pledge.event_id)
          .maybeSingle();
        events.set(pledge.event_id, {
          title: event?.title ?? "Tuendelee fundraiser",
          template:
            event?.template_payment_reminder ??
            "Reminder: your pledge of ${amount} ${currency} is due on ${deadline}. Pledge reference: ${pledge_id}.",
          admin_id: event?.admin_id ?? "",
          from: senderAddress(event?.sender_name, event?.sender_email),
        });
      }
      const eventInfo = events.get(pledge.event_id)!;

      const deadlineLabel = new Date(deadline).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const daysLeft = Math.max(1, Math.ceil((deadline - now) / (24 * 60 * 60 * 1000)));

      const messageText = renderTemplate(eventInfo.template, {
        name: pledge.name ?? "Friend",
        amount: String(pledge.amount),
        currency: pledge.currency,
        pledge_id: pledge.id.slice(0, 8).toUpperCase(),
        deadline: deadlineLabel,
      });

      const html = emailShell(
        stage === "final"
          ? `Your pledge is due tomorrow, ${pledge.name}`
          : `Halfway reminder, ${pledge.name}`,
        `<p style="font-size:15px;line-height:1.6;">${messageText}</p>
         ${detailsTable([
           ["Campaign", eventInfo.title],
           ["Pledge reference", pledge.id.slice(0, 8).toUpperCase()],
           ["Amount", formatMoney(Number(pledge.amount), pledge.currency)],
           ["Due", deadlineLabel],
           ["Days remaining", String(daysLeft)],
         ])}
         <p style="font-size:14px;color:#6b7280;">Open the fundraising room and use “Find My Pledge” to record your payment — that keeps your pledge from being counted twice.</p>`,
      );

      const result = await sendEmail(
        pledge.email,
        stage === "final" ? "Your pledge is due tomorrow" : "Halfway to your pledge deadline",
        html,
        eventInfo.from,
      );

      await supabase
        .from("event_pledges")
        .update(
          stage === "final"
            ? { reminder_final_sent_at: new Date().toISOString() }
            : { reminder_half_sent_at: new Date().toISOString() },
        )
        .eq("id", pledge.id);

      await supabase.from("pledge_notifications").insert({
        pledge_id: pledge.id,
        notification_type: stage === "final" ? "reminder_final" : "reminder_half",
        channel: "email",
        recipient: pledge.email,
        message: messageText,
        status: result.status,
        error_message: result.error ?? null,
      });

      if (eventInfo.admin_id) {
        await supabase.from("admin_notifications").insert({
          admin_id: eventInfo.admin_id,
          event_id: pledge.event_id,
          pledge_id: pledge.id,
          type: stage === "final" ? "reminder_final" : "reminder_half",
          title: `Reminder sent to ${pledge.name}`,
          body: `${stage === "final" ? "Final" : "Halfway"} payment reminder for ${formatMoney(Number(pledge.amount), pledge.currency)} (due ${deadlineLabel}).`,
        });
      }

      results[pledge.id] = `${stage}:${result.status}`;
      sent += 1;
    }

    return json({ processed: pledges?.length ?? 0, sent, results });
  } catch (error) {
    console.error("pledge-reminders failed:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
