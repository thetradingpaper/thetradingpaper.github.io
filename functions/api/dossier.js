/* ============================================================
   GET /api/dossier?ticker=SYMBOL
   Assembles the full research dossier server-side (all keys stay
   in env vars), computes the composite score, logs a signal to the
   track record, and returns one structured JSON payload.

   Response shape (see /data/kvleva5-schema.md for the signal log):
   {
     ok, ticker, name, sector, currency, exchange, asOf,
     configured,                     // any provider key present?
     sections: {
       price:      {status, ...},
       momentum:   {status, ...},
       sentiment:  {status, market:{...}, headlines:{...}},
       valuation:  {status, ...},
       cfd:        {status, ...}
     },
     score, band:{en,ka,color}, contributions, signal
   }
   Sections that fail carry {status:"unavailable", reason} — the
   page renders a clean "data unavailable" state for just that block.
   ============================================================ */
import {
  json, badRequest, todayUTC,
  fhQuote, fhProfile, fhMetrics, fhNews,
  avDailyMetrics, cnnFearGreed, headlineSentiment,
  sectorMedianPE, marketCapTier, computeScore, writeSignal,
} from "./_lib.js";

function cleanTicker(t) {
  return String(t || "").trim().toUpperCase().replace(/[^A-Z0-9.\-:]/g, "").slice(0, 12);
}
function num(x) { return (x == null || !isFinite(x)) ? null : x; }

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ticker = cleanTicker(url.searchParams.get("ticker"));
  if (!ticker) return badRequest("ticker required");

  const configured = !!(env.FINNHUB_API_KEY || "d91t069r01qsj27o4k8gd91t069r01qsj27o4k90" || env.ALPHAVANTAGE_API_KEY);

  // Fire all providers in parallel; each degrades on its own.
  const [quote, profile, metrics, news, av, fng] = await Promise.all([
    fhQuote(env, ticker),
    fhProfile(env, ticker),
    fhMetrics(env, ticker),
    fhNews(env, ticker),
    avDailyMetrics(env, ticker),
    cnnFearGreed(env),
  ]);

  const m = (metrics && metrics.metric) || {};
  const price = num(quote && quote.c) || (av && av.status === "ok" ? num(av.lastClose) : null);

  /* ---------- 1 · PRICE & MOVEMENT ---------- */
  let priceSec;
  const hi52 = num(m["52WeekHigh"]) ?? (av && av.status === "ok" ? num(av.hi52) : null);
  const lo52 = num(m["52WeekLow"]) ?? (av && av.status === "ok" ? num(av.lo52) : null);
  const rangePos = (price != null && hi52 != null && lo52 != null && hi52 > lo52)
    ? (price - lo52) / (hi52 - lo52) : null;
  if (price != null) {
    priceSec = {
      status: "ok",
      price,
      dayChange: num(quote && quote.d),
      dayChangePct: num(quote && quote.dp),
      prevClose: num(quote && quote.pc),
      open: num(quote && quote.o), high: num(quote && quote.h), low: num(quote && quote.l),
      weekChangePct: av && av.status === "ok" ? num(av.weekChangePct) : null,
      monthChangePct: av && av.status === "ok" ? num(av.monthChangePct) : null,
      hi52, lo52,
      rangePosPct: rangePos != null ? +(rangePos * 100).toFixed(1) : null,
    };
  } else {
    priceSec = { status: "unavailable", reason: "no-quote" };
  }

  /* ---------- 2 · MOMENTUM ---------- */
  let momentumSec;
  if (av && av.status === "ok") {
    const volRatio = (av.avgVol30 && av.latestVol) ? av.latestVol / av.avgVol30 : null;
    momentumSec = {
      status: "ok",
      rsi14: num(av.rsi14) != null ? +av.rsi14.toFixed(1) : null,
      sma50: num(av.sma50) != null ? +av.sma50.toFixed(2) : null,
      sma200: num(av.sma200) != null ? +av.sma200.toFixed(2) : null,
      priceVs50Pct: (price != null && av.sma50) ? +(((price - av.sma50) / av.sma50) * 100).toFixed(1) : null,
      priceVs200Pct: (price != null && av.sma200) ? +(((price - av.sma200) / av.sma200) * 100).toFixed(1) : null,
      avgVol30: av.avgVol30 != null ? Math.round(av.avgVol30) : null,
      latestVol: av.latestVol != null ? Math.round(av.latestVol) : null,
      volVsAvgPct: volRatio != null ? +((volRatio - 1) * 100).toFixed(0) : null,
      dataPoints: av.points,
    };
  } else {
    momentumSec = { status: "unavailable", reason: (av && av.reason) || "no-history" };
  }

  /* ---------- 3 · SENTIMENT ---------- */
  const headlines = headlineSentiment(news && Array.isArray(news) ? news : []);
  const market = (fng && fng.status === "ok") ? fng : { status: "unavailable" };
  const sentimentSec = {
    status: (market.status === "ok" || headlines.status === "ok") ? "ok" : "unavailable",
    market, headlines,
  };

  /* ---------- 4 · VALUATION ---------- */
  let valuationSec;
  const sector = (profile && profile.finnhubIndustry) || null;
  const pe = num(m.peTTM) ?? num(m.peBasicExclExtraTTM) ?? num(m.peInclExtraTTM);
  const capMillions = num(profile && profile.marketCapitalization);
  const tier = marketCapTier(capMillions);
  const medPE = sectorMedianPE(sector);
  if (pe != null || tier != null) {
    valuationSec = {
      status: "ok",
      peTTM: pe != null ? +pe.toFixed(1) : null,
      sectorMedianPE: medPE,
      peVsSectorPct: (pe != null && pe > 0) ? +(((pe - medPE) / medPE) * 100).toFixed(0) : null,
      marketCapBn: tier ? +tier.bn.toFixed(2) : null,
      capTier: tier ? tier.tier : null,
      capTierKa: tier ? tier.ka : null,
      sector,
    };
  } else {
    valuationSec = { status: "unavailable", reason: "no-fundamentals" };
  }

  /* ---------- 5 · CFD PANEL ---------- */
  let cfdSec;
  if (av && av.status === "ok" && (av.vol30 != null || av.atr14 != null)) {
    const vol = num(av.vol30);
    let note;
    if (vol == null) note = null;
    else if (vol < 20) note = "დაბალი ვოლატილობა — ვიწრო სტოპები, დაბალი დაფინანსების რისკი. (Low volatility — tighter stops, lower financing drag.)";
    else if (vol <= 40) note = "ზომიერი ვოლატილობა — სტანდარტული სტოპ-მართვა CFD-სთვის. (Moderate volatility — standard stop management for CFDs.)";
    else note = "მაღალი ვოლატილობა — გააფართოვე სტოპები; დაფინანსების ღირებულება და overnight რისკი იზრდება. (High volatility — widen stops; financing cost and overnight risk rise.)";
    cfdSec = {
      status: "ok",
      vol30Pct: vol != null ? +vol.toFixed(1) : null,
      atr14: num(av.atr14) != null ? +av.atr14.toFixed(2) : null,
      atr14Pct: num(av.atr14Pct) != null ? +av.atr14Pct.toFixed(2) : null,
      financingNote: note,
    };
  } else {
    cfdSec = { status: "unavailable", reason: "no-history" };
  }

  /* ---------- COMPOSITE SCORE ---------- */
  const volRatio = (av && av.status === "ok" && av.avgVol30 && av.latestVol) ? av.latestVol / av.avgVol30 : null;
  const scored = computeScore({
    price,
    rsi: av && av.status === "ok" ? av.rsi14 : null,
    sma50: av && av.status === "ok" ? av.sma50 : null,
    sma200: av && av.status === "ok" ? av.sma200 : null,
    volRatio,
    rangePos,
    monthChange: av && av.status === "ok" ? av.monthChangePct : null,
    fng: market.status === "ok" ? market.score : null,
    headlineNet: headlines.status === "ok" ? headlines.net : null,
    pe: valuationSec.status === "ok" ? (pe != null ? pe : undefined) : undefined,
    sectorMedianPE: medPE,
    capTier: tier ? tier.tier : null,
    vol30: av && av.status === "ok" ? av.vol30 : null,
  });

  const dossier = {
    ok: true,
    ticker,
    name: (profile && profile.name) || ticker,
    sector,
    currency: (profile && profile.currency) || "USD",
    exchange: (profile && profile.exchange) || null,
    logo: (profile && profile.logo) || null,
    asOf: new Date().toISOString(),
    configured,
    sections: {
      price: priceSec,
      momentum: momentumSec,
      sentiment: sentimentSec,
      valuation: valuationSec,
      cfd: cfdSec,
    },
    score: scored.score,
    band: { en: scored.band.en, ka: scored.band.ka, color: scored.band.color },
    availableWeight: scored.availableWeight,
    contributions: scored.contributions,
  };

  /* ---------- LOG THE SIGNAL (track record) ---------- */
  // Every generated dossier writes {date,ticker,price,score,band}.
  // Only log when we actually produced a score from real data.
  if (dossier.score != null && price != null) {
    try {
      const res = await writeSignal(env, {
        date: todayUTC(), ticker, price: +price.toFixed(2),
        score: dossier.score, band: scored.band.en, bandKa: scored.band.ka,
      });
      dossier.signal = { logged: res.stored, reason: res.reason || null };
    } catch (e) {
      dossier.signal = { logged: false, reason: String(e && e.message || e) };
    }
  } else {
    dossier.signal = { logged: false, reason: "insufficient-data" };
  }

  return json(dossier);
}
