import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Normalise any Kenyan phone format to 2547XXXXXXXX / 2541XXXXXXXX
function normalisePhone(raw: string): string | null {
  const digits = (raw || "").replace(/[^0-9]/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
  return null;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(
    d.getUTCMinutes(),
  )}${p(d.getUTCSeconds())}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const env = (Deno.env.get("MPESA_ENVIRONMENT") || "sandbox").toLowerCase();

    const body = await req.json().catch(() => ({}));
    const pledgeId = typeof body.pledgeId === "string" ? body.pledgeId : "";
    const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";
    const phone = normalisePhone(typeof body.phone === "string" ? body.phone : "");

    if (!pledgeId || !sessionToken) {
      return json({ error: "Missing pledge or session details." }, 400);
    }
    if (!phone) {
      return json({ error: "Enter a valid Safaricom number, e.g. 0712345678." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // The pledge and the donor's event session must belong to the same event.
    const { data: pledge, error: pledgeError } = await supabase
      .from("event_pledges")
      .select("id, event_id, amount_in_kes, is_confirmed, name")
      .eq("id", pledgeId)
      .maybeSingle();

    if (pledgeError || !pledge) return json({ error: "Pledge not found." }, 404);
    if (pledge.is_confirmed) return json({ error: "This pledge is already paid." }, 409);

    const { data: session } = await supabase
      .from("event_sessions")
      .select("event_id")
      .eq("session_token", sessionToken)
      .maybeSingle();

    if (!session || session.event_id !== pledge.event_id) {
      return json({ error: "Session expired. Please rejoin the event." }, 403);
    }

    const amount = Math.max(1, Math.round(Number(pledge.amount_in_kes ?? 0)));
    if (!amount) return json({ error: "Pledge amount is not valid for M-Pesa." }, 400);

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return json(
        {
          error: "not_configured",
          message:
            "Instant M-Pesa payment is not switched on yet. Pay using the Paybill details and enter your M-Pesa code below.",
        },
        503,
      );
    }

    const base = env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}` },
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      console.error("M-Pesa token error", tokenRes.status, tokenJson);
      return json({ error: "Could not reach M-Pesa right now. Please try again." }, 502);
    }

    const ts = timestamp();
    const password = btoa(`${shortcode}${passkey}${ts}`);
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;
    const accountRef = `PLEDGE-${pledgeId.slice(0, 8).toUpperCase()}`;

    const stkRes = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountRef,
        TransactionDesc: "Tuendelee Foundation donation",
      }),
    });

    const stkJson = await stkRes.json().catch(() => ({}));

    if (!stkRes.ok || stkJson?.ResponseCode !== "0") {
      console.error("M-Pesa STK error", stkRes.status, stkJson);
      return json(
        {
          error: stkJson?.errorMessage || stkJson?.ResponseDescription || "M-Pesa request failed.",
        },
        502,
      );
    }

    await supabase.from("mpesa_transactions").insert({
      event_id: pledge.event_id,
      pledge_id: pledge.id,
      source: "stk",
      phone,
      amount,
      currency: "KES",
      merchant_request_id: stkJson.MerchantRequestID ?? null,
      checkout_request_id: stkJson.CheckoutRequestID ?? null,
      status: "pending",
    });

    return json({
      success: true,
      checkoutRequestId: stkJson.CheckoutRequestID,
      message: "Check your phone and enter your M-Pesa PIN to complete the donation.",
    });
  } catch (error) {
    console.error("mpesa-stk-push failure", error);
    return json({ error: "Unexpected error starting the M-Pesa payment." }, 500);
  }
});
