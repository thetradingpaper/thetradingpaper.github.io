/* ============================================================
   /api/vision — Portfolio AI screenshot reader (server-side Gemini)
   GET  → { ok, enabled }                 feature probe, no secrets
   POST → { ok, broker, transactions[] }  body: { images:[{mime,data(base64)}], instruction }
   Uses env.GEMINI_API_KEY (Cloudflare Pages secret) so every user gets
   AI reading without their own key. Model: env.GEMINI_MODEL or the
   cheapest vision model. CORS: GitHub Pages mirror + pages.dev.
   ============================================================ */
const ALLOWED = ["https://thetradingpaper.github.io", "https://thetradingpaper.pages.dev"];
function cors(req) {
  const o = req.headers.get("Origin") || "";
  const ok = ALLOWED.includes(o) || /^https:\/\/[a-z0-9-]+\.thetradingpaper\.pages\.dev$/.test(o);
  return ok ? { "Access-Control-Allow-Origin": o, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" } : {};
}
function out(req, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: Object.assign({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, cors(req)) });
}
const PROMPT = `You read screenshots from brokerage and banking apps (Georgian, English, German or any language; brokers worldwide).
Extract EVERY executed transaction visible. Return ONLY JSON:
{"broker": string|null, "transactions": [{"date":"YYYY-MM-DD","time":"HH:MM"|null,"type":"buy|sell|deposit|withdraw|dividend|fee","ticker":string|null,"name":string|null,"shares":number|null,"price":number|null,"amount":number|null,"fee":number|null,"currency":"USD|EUR|GEL|GBP|...","note":string|null}]}
Rules: copy numbers with full precision (prefer the most precise figure shown, e.g. in a comment line); amount = absolute total cash value; never guess — use null; ignore pending/cancelled orders.
Georgian: შეძენა/ყიდვა=buy, გაყიდვა=sell, დივიდენდი=dividend, შევსება/ჩარიცხვა/დეპოზიტი=deposit, გატანა/განაღდება=withdraw, საკომისიო=fee.`;

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method === "GET") return out(request, { ok: true, enabled: !!env.GEMINI_API_KEY });
  if (request.method !== "POST") return out(request, { ok: false, error: "POST only" }, 405);
  if (!env.GEMINI_API_KEY) return out(request, { ok: false, error: "GEMINI_API_KEY not set" }, 501);
  let body; try { body = await request.json(); } catch (_) { return out(request, { ok: false, error: "invalid JSON" }, 400); }
  const images = Array.isArray(body && body.images) ? body.images.slice(0, 8) : [];
  if (!images.length) return out(request, { ok: false, error: "images required" }, 400);
  if (images.some(i => !i || typeof i.data !== "string" || i.data.length > 4_000_000)) return out(request, { ok: false, error: "image too large" }, 413);
  const parts = [{ text: PROMPT + (body.instruction ? "\nUser instruction: " + String(body.instruction).slice(0, 300) : "") }]
    .concat(images.map(i => ({ inline_data: { mime_type: /^image\//.test(i.mime) ? i.mime : "image/jpeg", data: i.data } })));
  const models = [env.GEMINI_MODEL || "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
  let last = "";
  for (const m of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 2048 } }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { last = (d.error && d.error.message) || ("Gemini HTTP " + r.status); if (r.status === 404 || r.status === 400) continue; break; }
    const txt = (((d.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || "").join("") || "";
    try { const j = JSON.parse(txt.replace(/^```(?:json)?|```$/g, "")); return out(request, { ok: true, model: m, broker: j.broker || null, transactions: j.transactions || (Array.isArray(j) ? j : []) }); }
    catch (_) { last = "unparseable model output"; }
  }
  return out(request, { ok: false, error: last || "vision failed" }, 502);
}
