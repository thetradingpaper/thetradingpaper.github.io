/* ============================================================
   POST /api/analyst  — Claude research narrative
   Body: the dossier JSON returned by /api/dossier.
   Returns a 5-sentence bilingual (KA/EN) newspaper-style research
   note. Uses ANTHROPIC_API_KEY from env. If the key is absent the
   endpoint returns 501 and the page simply hides the button
   (see /api/config → analyst:false).
   ============================================================ */
import { json, badRequest } from "./_lib.js";

function factLine(d) {
  const s = d.sections || {};
  const bits = [];
  bits.push(`Ticker: ${d.ticker} (${d.name || "?"}), sector ${d.sector || "n/a"}.`);
  if (s.price && s.price.status === "ok") {
    bits.push(`Price ${d.currency || "USD"} ${s.price.price}, day ${fmt(s.price.dayChangePct)}%, week ${fmt(s.price.weekChangePct)}%, month ${fmt(s.price.monthChangePct)}%, 52-week range position ${fmt(s.price.rangePosPct)}%.`);
  }
  if (s.momentum && s.momentum.status === "ok") {
    bits.push(`RSI(14) ${fmt(s.momentum.rsi14)}, price vs 50-day MA ${fmt(s.momentum.priceVs50Pct)}%, vs 200-day MA ${fmt(s.momentum.priceVs200Pct)}%, volume vs 30-day avg ${fmt(s.momentum.volVsAvgPct)}%.`);
  }
  if (s.sentiment && s.sentiment.status === "ok") {
    const mk = s.sentiment.market || {}; const hl = s.sentiment.headlines || {};
    bits.push(`Market Fear & Greed ${mk.score != null ? mk.score + " (" + mk.rating + ")" : "n/a"}; ticker headline tone ${hl.label || "n/a"} (net ${fmt(hl.net)}).`);
  }
  if (s.valuation && s.valuation.status === "ok") {
    bits.push(`P/E ${fmt(s.valuation.peTTM)} vs sector median ${fmt(s.valuation.sectorMedianPE)} (${fmt(s.valuation.peVsSectorPct)}%), market cap ${s.valuation.capTier || "?"} ($${fmt(s.valuation.marketCapBn)}bn).`);
  }
  if (s.cfd && s.cfd.status === "ok") {
    bits.push(`30-day volatility ${fmt(s.cfd.vol30Pct)}% annualised, ATR(14) ${fmt(s.cfd.atr14)} (${fmt(s.cfd.atr14Pct)}% of price).`);
  }
  bits.push(`Composite research score ${d.score == null ? "n/a" : d.score}/100, band "${d.band ? d.band.en : "?"}".`);
  return bits.join("\n");
}
function fmt(x) { return x == null ? "n/a" : x; }

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405, { Allow: "POST" });
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: "ANTHROPIC_API_KEY not set" }, 501);

  let dossier;
  try { dossier = await request.json(); } catch (_) { return badRequest("invalid JSON body"); }
  if (!dossier || !dossier.ticker) return badRequest("dossier with ticker required");

  const model = env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  const facts = factLine(dossier);

  const prompt =
`You are the staff research analyst for "The Trading Paper" (ლაშა ფხაკაძე, Wiesbaden), a bilingual Georgian/English financial broadsheet. Write a compact research note on the dossier below.

DOSSIER FACTS:
${facts}

STRICT RULES:
- Exactly FIVE sentences. Number them 1–5.
- Each numbered sentence is bilingual: Georgian first, then the English in parentheses. Example: "1. [ქართული წინადადება] (English sentence.)"
- Newspaper op-ed voice: measured, precise, a little literary.
- This is RESEARCH CLASSIFICATION, not investment advice. NEVER use the words buy, sell, hold, or any imperative to trade. Describe the setup, the momentum, the valuation, the volatility/CFD implication, and what the composite band means as a research signal.
- Ground every claim in the numbers above; do not invent data. If a section was unavailable, you may note the gap.
- Sentence 5 must restate that this is research information, not advice, and that the reader decides for themselves.
Output ONLY the five numbered sentences, nothing else.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return json({ ok: false, error: (data && data.error && data.error.message) || `Anthropic HTTP ${r.status}`, model }, 502);
    }
    const text = (data.content && data.content[0] && data.content[0].text || "").trim();
    if (!text) return json({ ok: false, error: "empty response", model }, 502);
    return json({ ok: true, model, ticker: dossier.ticker, narrative: text });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502);
  }
}
