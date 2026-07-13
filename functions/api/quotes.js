/* ============================================================
   GET /api/quotes?tickers=A,B,C — light current-price batch used by
   the cabinet, masthead ticker-tape, and (as a fallback) the journal.

   Hardening:
     · validate + uppercase + dedupe tickers, cap the batch at 25
     · Finnhub first, Alpha Vantage on failure, per-provider 4s timeout
       (both via _lib helpers — no duplicated fetch logic)
     · 15-min KV cache (kvleva5:quotes:<TICKER>) so repeat loads and
       multiple open tabs don't burn the free-tier quota
     · writes a daily immutable snapshot on every fresh fetch (feeds the
       journal sparklines with 0 extra provider calls)
     · NEVER 500s on partial failure — failed tickers come back as null

   Response (values in `quotes` stay plain numbers for back-compat):
   { ok, asOf,
     quotes:  { TICKER: number|null },
     sources: { TICKER: "cache"|"finnhub"|"alphavantage"|null },
     cached:  { TICKER: boolean } }
   ============================================================ */
import { json, fhQuote, avDailyMetrics, writeSnapshotIfAbsent } from "./_lib.js";

// Keep only the characters real symbols use, uppercase.
function cleanTicker(t) {
  return String(t || "").trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
}
// Accept standard equities and common extended forms (AAPL, BRK.B, RDS-A);
// reject anything else. This is the input-hardening boundary.
function validTicker(t) {
  return /^[A-Z0-9]{1,6}([.\-][A-Z0-9]{1,4})?$/.test(t);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const tickersParam = url.searchParams.get("tickers");
  if (!tickersParam) return json({ ok: false, error: "tickers parameter required" }, 400);

  // Validate → dedupe → cap at 25.
  const seen = new Set();
  const tickerList = [];
  for (const part of tickersParam.split(",")) {
    const t = cleanTicker(part);
    if (!t || !validTicker(t) || seen.has(t)) continue;
    seen.add(t);
    tickerList.push(t);
    if (tickerList.length >= 25) break;
  }

  const store = env.TP_KV;
  const asOf = new Date().toISOString();
  const quotes = {};    // TICKER -> number | null   (plain numbers — do not nest)
  const sources = {};   // TICKER -> "cache" | "finnhub" | "alphavantage" | null
  const cached = {};    // TICKER -> boolean

  await Promise.all(tickerList.map(async (ticker) => {
    // 1 · warm 15-min cache
    if (store) {
      try {
        const hit = await store.get(`kvleva5:quotes:${ticker}`);
        if (hit !== null) {
          const p = parseFloat(hit);
          if (!isNaN(p)) { quotes[ticker] = p; sources[ticker] = "cache"; cached[ticker] = true; return; }
        }
      } catch (_) { /* ignore cache read failure */ }
    }

    // 2 · Finnhub first, Alpha Vantage on failure (4s per-provider timeout)
    let price = null, source = null;
    try {
      const q = await fhQuote(env, ticker, 4000);
      if (q && q.c != null && !q._httpError && !q._fetchError && !q._unavailable) {
        price = parseFloat(q.c); source = "finnhub";
      } else {
        const av = await avDailyMetrics(env, ticker, 4500);
        if (av && av.status === "ok" && av.lastClose != null) {
          price = parseFloat(av.lastClose); source = "alphavantage";
        }
      }
    } catch (_) { /* ignore provider failure — falls through to null */ }

    if (price != null && isFinite(price)) {
      quotes[ticker] = price; sources[ticker] = source; cached[ticker] = false;
      if (store) {
        try { await store.put(`kvleva5:quotes:${ticker}`, String(price), { expirationTtl: 900 }); } catch (_) {}
      }
      await writeSnapshotIfAbsent(env, ticker, price);   // daily immutable snapshot
    } else {
      quotes[ticker] = null; sources[ticker] = null; cached[ticker] = false;   // never 500
    }
  }));

  return json({ ok: true, asOf, quotes, sources, cached });
}
