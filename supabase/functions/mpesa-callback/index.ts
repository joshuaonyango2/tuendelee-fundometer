import { createClient } from "npm:@supabase/supabase-js@2";

// Safaricom calls this endpoint directly. It never returns donor data and it
// only ever trusts a callback that matches a CheckoutRequestID we created.
Deno.serve(async (req) => {
  const ok = () =>
    new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return ok();

  try {
    const payload = await req.json().catch(() => null);
    const stk = payload?.Body?.stkCallback;
    const checkoutRequestId = stk?.CheckoutRequestID;

    if (!checkoutRequestId) {
      console.error("mpesa-callback: payload without CheckoutRequestID");
      return ok();
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: txn } = await supabase
      .from("mpesa_transactions")
      .select("id, pledge_id, amount, status")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (!txn) {
      console.error("mpesa-callback: unknown CheckoutRequestID", checkoutRequestId);
      return ok();
    }

    // Idempotent: a repeated callback for an already settled payment is ignored.
    if (txn.status === "success") return ok();

    const items: Array<{ Name?: string; Value?: unknown }> = stk?.CallbackMetadata?.Item ?? [];
    const meta = (name: string) => items.find((i) => i.Name === name)?.Value;

    const resultCode = Number(stk?.ResultCode ?? 1);
    const receipt = typeof meta("MpesaReceiptNumber") === "string"
      ? String(meta("MpesaReceiptNumber")).toUpperCase()
      : null;
    const paidAmount = Number(meta("Amount") ?? 0);

    if (resultCode !== 0) {
      await supabase
        .from("mpesa_transactions")
        .update({
          status: "failed",
          result_code: resultCode,
          result_desc: stk?.ResultDesc ?? null,
          raw_callback: payload,
        })
        .eq("id", txn.id);
      return ok();
    }

    const expected = Number(txn.amount ?? 0);
    const amountMatches = paidAmount > 0 && Math.abs(paidAmount - expected) <= 1;

    await supabase
      .from("mpesa_transactions")
      .update({
        status: amountMatches ? "success" : "amount_mismatch",
        mpesa_receipt: receipt,
        result_code: resultCode,
        result_desc: stk?.ResultDesc ?? null,
        raw_callback: payload,
      })
      .eq("id", txn.id);

    if (!txn.pledge_id) return ok();

    if (!amountMatches) {
      await supabase
        .from("event_pledges")
        .update({
          payment_method: "mpesa",
          payment_reference: receipt,
          verification_status: "pending",
          verification_note: `M-Pesa paid ${paidAmount} but pledge expects ${expected}. Needs admin review.`,
        })
        .eq("id", txn.pledge_id);
      return ok();
    }

    await supabase
      .from("event_pledges")
      .update({
        payment_method: "mpesa",
        payment_reference: receipt,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
        verification_status: "verified",
        verified_at: new Date().toISOString(),
      })
      .eq("id", txn.pledge_id);

    try {
      await supabase.functions.invoke("send-pledge-email", {
        body: { pledgeId: txn.pledge_id, kind: "payment_confirmed", internal: true },
      });
    } catch (mailError) {
      console.error("mpesa-callback: confirmation email failed", mailError);
    }

    return ok();
  } catch (error) {
    console.error("mpesa-callback failure", error);
    return ok();
  }
});
