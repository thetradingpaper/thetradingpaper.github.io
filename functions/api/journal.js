/* ============================================================
   GET /api/journal — the ONE consolidated endpoint the კვლევა 5.0
   journal page renders. The backend does ALL the work so the frontend
   is a dumb renderer (and this is the merge-conflict firewall: this
   file owns computation, the page owns presentation):

     · dedup (same ticker + same UTC date → newest kept, rest muted)
     · live current price per ticker (display-only)
     · LAZY grade-freezing — immutable HIT/MISS/FLAT verdicts frozen
       into KV the first time a 7/30/90-day horizon has passed; never
       recomputed or overwritten afterwards
     · hit-rate / avg-return computed ONLY from frozen grades
     · sparkline series assembled from daily snapshots (0 extra calls)
     · tamper-evident hash-chain head + validity

   Response shape:
   {
     ok, generated_at, chain_head, chain_valid,
     budget: { cap, spent },
     stats: { total, gradable, graded, frozen_grades,
              hit_rate_30d, hit_rate_overall, avg_return, by_horizon },
     signals: [ {
       id, date_utc, ts, ticker, band, band_ka, score, gradable, muted,
       signal_price, current_price, return_pct, hash,
       verdicts: { d7, d30, d90 },   // frozen record | { verdict:"PENDING", ... }
       sparkline: [ { date, price }, … ]
     } … ]
   }

   Cache-Control: no-store — set by json(); KV is the cache layer and a
   grade must be able to freeze on ANY page load.
   ============================================================ */
import {
  json, todayUTC,
  fhQuote, avDailyMetrics,
  ensureChain, writeSnapshotIfAbsent, readSnapshotSeries,
  readGrade, freezeGrade, isGradableBand, verdictFor,
} from "./_lib.js";

const HORIZONS = [7, 30, 90];
const QUOTE_BUDGET = 8;          // max fresh upstream quote fetches per request
const SNAP_TOLERANCE_DAYS = 7;   // accept a snapshot up to N days after the horizon
const MAX_SPARK_POINTS = 180;    // cap sparkline density (downsample beyond this)

/* ---------- UTC date helpers (whole-day math, no timezones) ---------- */
function daysElapsed(dateStr) {
  const p = String(dateStr || "").split("-");
  if (p.length !== 3) return null;
  const sig = Date.UTC(+p[0], +p[1] - 1, +p[2]);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - sig) / 86400000);
}
function addDaysUTC(dateStr, n) {
  const p = String(dateStr).split("-");
  const d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function round2(x) { return x == null || !isFinite(x) ? null : +(+x).toFixed(2); }

/* ---------- per-request price getter (cache-first, budget-capped) ----------
   The 15-min KV cache (kvleva5:quotes:<T>, shared with /api/quotes) is free
   and does NOT count against the budget. Only genuine upstream fetches do,
   capped at QUOTE_BUDGET per request so a cold page with many tickers can't
   burn the Finnhub/Alpha Vantage quota. Prices are memoized per request and
   reused for both grading and display. */
function makePriceGetter(env, budget) {
  const memo = new Map();   // ticker -> number|null
  const store = env.TP_KV;
  return async function getLivePrice(ticker, allowFetch) {
    if (memo.has(ticker)) return memo.get(ticker);

    if (store) {                                    // warm cache — 0 budget
      try {
        const cached = await store.get(`kvleva5:quotes:${ticker}`);
        if (cached !== null) {
          const p = parseFloat(cached);
          if (!isNaN(p)) { memo.set(ticker, p); return p; }
        }
      } catch (_) {}
    }

    if (!allowFetch || budget.spent >= budget.cap) { memo.set(ticker, null); return null; }
    budget.spent++;                                 // count the upstream attempt

    let price = null;
    try {
      const q = await fhQuote(env, ticker, 4000);   // Finnhub first, 4s cap
      if (q && q.c != null && !q._httpError && !q._fetchError && !q._unavailable) {
        price = parseFloat(q.c);
      } else {
        const av = await avDailyMetrics(env, ticker, 4500);  // Alpha Vantage fallback
        if (av && av.status === "ok" && av.lastClose != null) price = parseFloat(av.lastClose);
      }
    } catch (_) {}

    if (price != null && isFinite(price)) {
      memo.set(ticker, price);
      if (store) {
        try { await store.put(`kvleva5:quotes:${ticker}`, String(price), { expirationTtl: 900 }); } catch (_) {}
      }
      await writeSnapshotIfAbsent(env, ticker, price);   // daily immutable point
      return price;
    }
    memo.set(ticker, null);
    return null;
  };
}

/* ---------- sparkline: signal anchor + snapshots-in-range + live tip ---------- */
function buildSparkline(signalDate, signalPrice, series, currentPrice) {
  const byDate = new Map();
  if (signalPrice != null) byDate.set(signalDate, +signalPrice);   // the signal IS a real datapoint
  for (const pt of series) {
    if (pt.date >= signalDate) byDate.set(pt.date, pt.price);       // snapshots win over the anchor
  }
  if (currentPrice != null) byDate.set(todayUTC(), +currentPrice);  // live tip
  let pts = [...byDate.entries()]
    .map(([date, price]) => ({ date, price: round2(price) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (pts.length > MAX_SPARK_POINTS) {              // even downsample, keep endpoints
    const step = (pts.length - 1) / (MAX_SPARK_POINTS - 1);
    const sampled = [];
    for (let i = 0; i < MAX_SPARK_POINTS; i++) sampled.push(pts[Math.round(i * step)]);
    pts = sampled.filter((v, i, a) => i === 0 || v.date !== a[i - 1].date);
  }
  return pts;
}

export async function onRequest(context) {
  const { env } = context;
  const generated_at = new Date().toISOString();

  try {
    /* 1 · Read the log and verify (backfilling once if needed) the chain. */
    const { signals: raw, chain_head, chain_valid } = await ensureChain(env);

    /* 2 · Dedup. The log is newest-first, so the FIRST time a ticker+date
           key appears is the newest signal; later duplicates are muted and
           excluded from stats (but still returned for display). */
    const seen = new Set();
    const rows = raw.map((s) => {
      const key = `${s.date}_${s.ticker}`;
      const muted = seen.has(key);
      if (!muted) seen.add(key);
      return { s, muted };
    });

    const budget = { cap: QUOTE_BUDGET, spent: 0 };
    const getLivePrice = makePriceGetter(env, budget);

    // Per-ticker snapshot series, memoized (also reused for sparklines).
    const seriesCache = new Map();
    const getSeries = async (ticker) => {
      if (seriesCache.has(ticker)) return seriesCache.get(ticker);
      const ser = await readSnapshotSeries(env, ticker);
      seriesCache.set(ticker, ser);
      return ser;
    };

    /* 3 · GRADING PASS — spend the budget where it matters: oldest gradable,
           already-elapsed, not-yet-frozen signals first. Freeze immutably. */
    const gradeStore = new Map();   // `${id}:${h}` -> frozen record | { verdict:"PENDING", … }
    const gradable = rows
      .filter((r) => !r.muted && isGradableBand(r.s.band) && r.s.price > 0)
      .sort((a, b) => String(a.s.ts || a.s.date).localeCompare(String(b.s.ts || b.s.date)));

    for (const { s } of gradable) {
      for (const h of HORIZONS) {
        const elapsed = (daysElapsed(s.date) ?? -1) >= h;
        if (!elapsed) { gradeStore.set(`${s.id}:${h}`, { verdict: "PENDING", elapsed: false }); continue; }

        const existing = await readGrade(env, s.id, h);        // already frozen? verbatim.
        if (existing) { gradeStore.set(`${s.id}:${h}`, existing); continue; }

        // Prefer a snapshot at/just after the horizon date (accurate, free).
        const target = addDaysUTC(s.date, h);
        const series = await getSeries(s.ticker);
        const limit = addDaysUTC(target, SNAP_TOLERANCE_DAYS);
        const snap = series.find((pt) => pt.date >= target && pt.date <= limit);

        let priceAtGrade = null, source = null, asOf = null;
        if (snap) {
          priceAtGrade = snap.price; source = "snapshot"; asOf = snap.date;
        } else {
          const lp = await getLivePrice(s.ticker, true);       // else current quote (budget-capped)
          if (lp != null) { priceAtGrade = lp; source = "live"; asOf = todayUTC(); }
        }

        if (priceAtGrade == null) {                            // budget exhausted → stays pending
          gradeStore.set(`${s.id}:${h}`, { verdict: "PENDING", elapsed: true, reason: "budget" });
          continue;
        }

        const rawPct = ((priceAtGrade - s.price) / s.price) * 100;
        const record = {
          horizon: h,
          graded_at: new Date().toISOString(),
          as_of: asOf,
          price_at_grade: round2(priceAtGrade),
          signal_price: round2(s.price),
          return_pct: round2(rawPct),
          verdict: verdictFor(s.band, rawPct),
          source,
        };
        gradeStore.set(`${s.id}:${h}`, await freezeGrade(env, s.id, h, record));  // immutable
      }
    }

    /* 4 · DISPLAY PASS — current price for every non-muted ticker (newest
           first). Reuses the grading memo; spends only leftover budget. */
    const displayTickers = [];
    for (const { s, muted } of rows) {
      if (!muted && !displayTickers.includes(s.ticker)) displayTickers.push(s.ticker);
    }
    for (const t of displayTickers) await getLivePrice(t, true);

    /* 5 · Assemble stats from FROZEN grades only. */
    const hz = { 7: { hit: 0, miss: 0, flat: 0 }, 30: { hit: 0, miss: 0, flat: 0 }, 90: { hit: 0, miss: 0, flat: 0 } };
    let frozen_grades = 0, thesisSum = 0, thesisN = 0;
    const gradedSignalIds = new Set();

    for (const { s, muted } of rows) {
      if (muted || !isGradableBand(s.band)) continue;
      for (const h of HORIZONS) {
        const rec = gradeStore.get(`${s.id}:${h}`);
        if (!rec || !rec.source) continue;                     // frozen records carry a `source`
        frozen_grades++;
        gradedSignalIds.add(s.id);
        if (rec.verdict === "HIT") hz[h].hit++;
        else if (rec.verdict === "MISS") hz[h].miss++;
        else if (rec.verdict === "FLAT") hz[h].flat++;
        if (rec.return_pct != null) {
          const thesis = String(s.band).toUpperCase() === "SHORT-SIDE CANDIDATE" ? -rec.return_pct : rec.return_pct;
          thesisSum += thesis; thesisN++;
        }
      }
    }
    // Hit rate = HITs / (HITs + MISSes); FLATs and PENDINGs are excluded.
    const rate = (o) => { const res = o.hit + o.miss; return res ? +((o.hit / res) * 100).toFixed(1) : null; };
    const by_horizon = {};
    for (const h of HORIZONS) {
      by_horizon[`d${h}`] = {
        hit: hz[h].hit, miss: hz[h].miss, flat: hz[h].flat,
        graded: hz[h].hit + hz[h].miss + hz[h].flat, hit_rate: rate(hz[h]),
      };
    }
    const overall = {
      hit: hz[7].hit + hz[30].hit + hz[90].hit,
      miss: hz[7].miss + hz[30].miss + hz[90].miss,
    };
    const nonMuted = rows.filter((r) => !r.muted);
    const stats = {
      total: nonMuted.length,
      gradable: nonMuted.filter((r) => isGradableBand(r.s.band)).length,
      graded: gradedSignalIds.size,
      frozen_grades,
      hit_rate_30d: by_horizon.d30.hit_rate,
      hit_rate_overall: rate(overall),
      avg_return: thesisN ? round2(thesisSum / thesisN) : null,   // by thesis direction
      by_horizon,
    };

    /* 6 · Build the signal payloads in original (newest-first) order. */
    const verdictsFor = (s, gradableFlag) => {
      const out = { d7: null, d30: null, d90: null };
      if (!gradableFlag) return out;
      for (const h of HORIZONS) {
        out[`d${h}`] = gradeStore.get(`${s.id}:${h}`)
          || { verdict: "PENDING", elapsed: (daysElapsed(s.date) ?? -1) >= h };
      }
      return out;
    };

    const signals = [];
    for (const { s, muted } of rows) {
      const gradableFlag = isGradableBand(s.band);
      const current = await getLivePrice(s.ticker, false);       // memo/cache only — no new fetch
      const return_pct = (current != null && s.price > 0) ? round2(((current - s.price) / s.price) * 100) : null;
      const series = await getSeries(s.ticker);
      signals.push({
        id: s.id,
        date_utc: s.date,
        ts: s.ts || null,
        ticker: s.ticker,
        band: s.band,
        band_ka: s.bandKa || null,
        score: s.score ?? null,
        gradable: gradableFlag,
        muted,
        signal_price: round2(s.price),
        current_price: round2(current),
        return_pct,
        hash: s.hash || null,
        verdicts: verdictsFor(s, gradableFlag),
        sparkline: buildSparkline(s.date, s.price, series, current),
      });
    }

    return json({
      ok: true,
      generated_at,
      chain_head: chain_head || null,
      chain_valid,
      budget: { cap: budget.cap, spent: budget.spent },
      stats,
      signals,
    });
  } catch (e) {
    // Never hard-500 the journal — return an empty-but-valid envelope so the
    // page renders its empty state instead of breaking.
    return json({
      ok: false,
      generated_at,
      error: String((e && e.message) || e),
      chain_head: null,
      chain_valid: true,
      budget: { cap: QUOTE_BUDGET, spent: 0 },
      stats: {
        total: 0, gradable: 0, graded: 0, frozen_grades: 0,
        hit_rate_30d: null, hit_rate_overall: null, avg_return: null,
        by_horizon: {
          d7: { hit: 0, miss: 0, flat: 0, graded: 0, hit_rate: null },
          d30: { hit: 0, miss: 0, flat: 0, graded: 0, hit_rate: null },
          d90: { hit: 0, miss: 0, flat: 0, graded: 0, hit_rate: null },
        },
      },
      signals: [],
    });
  }
}
