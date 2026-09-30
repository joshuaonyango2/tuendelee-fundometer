// Shared AI translation helper with a database cache (translation_cache).
const LANG_NAMES: Record<string, string> = {
  en: "English",
  it: "Italian",
  fr: "French",
  sw: "Kiswahili",
  es: "Spanish",
  de: "German",
};

export const SUPPORTED_LANGS = Object.keys(LANG_NAMES);

export function normalizeLang(lang?: string | null): string {
  const l = (lang ?? "en").toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(l) ? l : "en";
}

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Translates texts into `target`. Returns originals on any failure. */
export async function translateTexts(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  texts: string[],
  target: string,
): Promise<string[]> {
  const lang = normalizeLang(target);
  if (lang === "en" || texts.length === 0) return texts;

  const hashes = await Promise.all(texts.map((t) => sha(t)));
  const result = [...texts];
  const { data: cached } = await supabase
    .from("translation_cache")
    .select("source_hash, translated")
    .eq("language", lang)
    .in("source_hash", [...new Set(hashes)]);
  const map = new Map<string, string>((cached ?? []).map((r: any) => [r.source_hash, r.translated]));

  const missing: number[] = [];
  texts.forEach((t, i) => {
    if (!t.trim()) return;
    const hit = map.get(hashes[i]);
    if (hit !== undefined) result[i] = hit;
    else missing.push(i);
  });
  const uniqueMissing = [...new Map(missing.map((i) => [hashes[i], i])).values()];
  if (uniqueMissing.length === 0) return result;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return result;

  try {
    const source = uniqueMissing.map((i) => texts[i]);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              `You translate user-interface and email text for the Tuendelee Foundation charity fundraising app into ${LANG_NAMES[lang]}. ` +
              "Return ONLY a JSON array of strings, same length and order as the input. Keep placeholders like ${name}, {amount}, URLs, emails, phone numbers, " +
              "brand names (Tuendelee, Fundometer, M-Pesa, PayPal, Benevity, Paybill, Zoom), numbers, currency codes, HTML tags, line breaks and emojis unchanged. Use a warm, simple, respectful tone.",
          },
          { role: "user", content: JSON.stringify(source) },
        ],
      }),
    });
    if (!res.ok) {
      console.error("translate failed", res.status, await res.text());
      return result;
    }
    const body = await res.json();
    let content: string = body.choices?.[0]?.message?.content ?? "[]";
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const out = JSON.parse(content);
    if (!Array.isArray(out) || out.length !== source.length) return result;

    const rows: { source_hash: string; language: string; translated: string }[] = [];
    uniqueMissing.forEach((idx, k) => {
      const tr = String(out[k] ?? texts[idx]);
      rows.push({ source_hash: hashes[idx], language: lang, translated: tr });
      map.set(hashes[idx], tr);
    });
    missing.forEach((i) => (result[i] = map.get(hashes[i]) ?? texts[i]));
    await supabase.from("translation_cache").upsert(rows, { onConflict: "source_hash,language" });
  } catch (e) {
    console.error("translate error", e);
  }
  return result;
}

export async function translateOne(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  text: string,
  target: string,
): Promise<string> {
  return (await translateTexts(supabase, [text], target))[0];
}
