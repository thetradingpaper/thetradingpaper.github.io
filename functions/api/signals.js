/* ============================================================
   /api/signals  — the კვლევა 5.0 track record
     GET  → { ok, source, count, signals:[ newest-first ] }
     POST → append one {ticker,price,score,band} record
   The journal page reads GET /api/signals as the live log; the
   committed /data/kvleva5-signals.json is the static seed baseline
   (used when the Functions runtime is unavailable, e.g. the
   github.io mirror). Records are stored in KV (TP_KV). Without KV
   the endpoint still responds — it just cannot persist.
   ============================================================ */
import { json, badRequest, todayUTC, readSignals, writeSignal, bandFor } from "./_lib.js";

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "GET") {
    const { source, signals } = await readSignals(env);
    return json({ ok: true, source, count: signals.length, signals });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch (_) { return badRequest("invalid JSON body"); }
    const ticker = String(body.ticker || "").trim().toUpperCase();
    const price = Number(body.price);
    const score = body.score == null ? null : Number(body.score);
    if (!ticker) return badRequest("ticker required");
    if (!isFinite(price)) return badRequest("valid price required");
    const band = body.band || (score != null ? bandFor(score).en : null);
    const bandKa = body.bandKa || (score != null ? bandFor(score).ka : null);
    const res = await writeSignal(env, { date: body.date || todayUTC(), ticker, price, score, band, bandKa });
    return json({ ok: true, stored: res.stored, reason: res.reason || null, signal: res.signal, count: res.count || null });
  }

  return json({ ok: false, error: "method not allowed" }, 405, { Allow: "GET, POST" });
}
