import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { translateTexts, SUPPORTED_LANGS } from "../_shared/translate.ts";

const BodySchema = z.object({
  texts: z.array(z.string().max(6000)).min(1).max(150),
  target: z.enum(SUPPORTED_LANGS as [string, ...string[]]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (p: unknown, status = 200) =>
    new Response(JSON.stringify(p), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const translations = await translateTexts(supabase, parsed.data.texts, parsed.data.target);
    return json({ translations });
  } catch (e) {
    console.error("translate function failed", e);
    return json({ error: (e as Error).message }, 500);
  }
});
