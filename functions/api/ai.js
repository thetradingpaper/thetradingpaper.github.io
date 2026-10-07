/* ============================================================
   /api/ai — The Paper AI (Claude mode)
   GET  → { ok, enabled }   (feature probe; no secrets leaked)
   POST → { ok, answer }    body: { messages:[{role,content}], context:"..." }

   The browser sends the question history plus a compact text
   snapshot of the site's own data (books, holdings, prices,
   dividends, issues). Claude answers in Georgian, grounded ONLY
   in that snapshot. ANTHROPIC_API_KEY lives in the Cloudflare
   Pages env and never reaches the browser. If the key is absent
   the endpoint answers enabled:false and the page silently uses
   its built-in local engine instead.
   CORS: allows the public GitHub Pages mirror to call this.
   ============================================================ */

const ALLOWED = [
  "https://thetradingpaper.github.io",
  "https://thetradingpaper.pages.dev",
];

function cors(request) {
  const o = request.headers.get("Origin") || "";
  const ok = ALLOWED.includes(o) || /^https:\/\/[a-z0-9-]+\.thetradingpaper\.pages\.dev$/.test(o);
  return ok ? {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  } : {};
}

function out(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      cors(request)
    ),
  });
}

const SYSTEM = `შენ ხარ "The Paper AI" — The Trading Paper-ის (ლაშა ფხაკაძის ფინანსური გაზეთი, ვისბადენი) ასისტენტი.

წესები:
- უპასუხე ქართულად (თუ კითხვა ინგლისურადაა — ინგლისურად). მოკლედ, გაზეთის ტონით: ზუსტი, მშვიდი, კონკრეტული რიცხვებით.
- პორტფელზე, ტრანზაქციებზე, დივიდენდებსა და გამოცემებზე უპასუხე მხოლოდ ქვემოთ მოცემული SITE DATA-ის მიხედვით. რიცხვები არასოდეს მოიგონო. თუ მონაცემი არ არის — თქვი, რომ საიტზე ეს არ ჩანს.
- ზოგად ცნებებზე (ETF, DCA, დივიდენდი, P/E, მარჟა, volatility decay და ა.შ.) შეგიძლია ახსნა ზოგადი ცოდნით.
- ეს არის კვლევა და ჩანაწერი, არა ფინანსური რჩევა. არასოდეს უთხრა მკითხველს იყიდოს, გაყიდოს ან შეინარჩუნოს რამე. თუ ასე გკითხეს — აღწერე ფაქტები და შეახსენე, რომ გადაწყვეტილება მისია.
- ზარალი არ დამალო და არ შეალამაზო.
- ფული: $ და 2 ათწილადი. პროცენტი: 2 ათწილადი.
- პასუხი 120 სიტყვაზე ნაკლები, თუ მეტი არ მოგთხოვეს. შეგიძლია **მუქი** და მოკლე სიები.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method === "GET") return out(request, { ok: true, enabled: !!env.ANTHROPIC_API_KEY });
  if (request.method !== "POST") return out(request, { ok: false, error: "POST only" }, 405);
  if (!env.ANTHROPIC_API_KEY) return out(request, { ok: false, error: "ANTHROPIC_API_KEY not set" }, 501);

  let body;
  try { body = await request.json(); } catch (_) { return out(request, { ok: false, error: "invalid JSON" }, 400); }
  const ctx = String((body && body.context) || "").slice(0, 12000);
  let msgs = Array.isArray(body && body.messages) ? body.messages : [];
  msgs = msgs
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-8)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return out(request, { ok: false, error: "question required" }, 400);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 700,
        system: SYSTEM + "\n\nSITE DATA (" + new Date().toISOString().slice(0, 10) + "):\n" + ctx,
        messages: msgs,
      }),
    });
    const data = await r.json();
    if (!r.ok) return out(request, { ok: false, error: (data && data.error && data.error.message) || ("Anthropic HTTP " + r.status) }, 502);
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("\n").trim();
    if (!text) return out(request, { ok: false, error: "empty response" }, 502);
    return out(request, { ok: true, answer: text });
  } catch (e) {
    return out(request, { ok: false, error: String((e && e.message) || e) }, 502);
  }
}
