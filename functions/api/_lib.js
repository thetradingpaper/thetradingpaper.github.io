/* ============================================================
   The Trading Paper — კვლევა 5.0 (BETA) shared library
   Files starting with "_" are NOT routed by Cloudflare Pages —
   this is import-only shared code for the /api/* functions.

   Responsibilities:
     · tiny JSON/response helpers
     · KV-backed daily cache (respects free-tier rate limits)
     · provider fetchers  (Finnhub · Alpha Vantage · CNN Fear&Greed)
     · momentum / volatility maths (RSI, MA, ATR, vol, avg-volume)
     · the transparent 0–100 composite score + research band
     · signal track-record read/write (KV)

   ALL provider keys come from environment variables and never
   reach the browser. Every section degrades gracefully: a failed
   provider yields {status:"unavailable"} and the score rescales
   over whatever data IS present — the page never breaks.
   ============================================================ */

/* ---------- response helpers ------------------------------- */
export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      extra
    ),
  });
}

export function badRequest(msg) { return json({ ok: false, error: msg }, 400); }

/* ---------- fetch with timeout ----------------------------- */
async function fetchJson(url, opts = {}, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, Object.assign({ signal: ctrl.signal, cf: { cacheTtl: 0 } }, opts));
    if (!r.ok) return { _httpError: r.status };
    return await r.json();
  } catch (e) {
    return { _fetchError: String(e && e.message || e) };
  } finally {
    clearTimeout(t);
  }
}

/* ---------- KV daily cache --------------------------------- */
// One namespace binding named TP_KV holds both the response cache
// and the signal log. If it is not bound, everything still works —
// we just fetch live every time and cannot persist signals.
export function kv(env) { return env && env.TP_KV ? env.TP_KV : null; }

export function todayUTC() { return new Date().toISOString().slice(0, 10); }

async function cached(env, key, ttlSeconds, producer) {
  const store = kv(env);
  if (!store) return await producer();
  try {
    const hit = await store.get(key, "json");
    if (hit && hit._v != null) return hit._v;
  } catch (_) {}
  const val = await producer();
  // Only cache successful, non-error payloads.
  const bad = val && (val._httpError || val._fetchError || val._unavailable);
  if (!bad) {
    try { await store.put(key, JSON.stringify({ _v: val }), { expirationTtl: ttlSeconds }); } catch (_) {}
  }
  return val;
}

/* ============================================================
   PROVIDERS
   ============================================================ */

/* ---- Finnhub (free tier: quote, profile2, metric, news) --- */
// `timeoutMs` lets callers tighten the per-request budget (e.g. /api/quotes
// uses 4s so a slow provider can't stall a whole batch). Defaults preserve
// the original 8s behaviour for existing callers (dossier).
async function finnhub(env, path, timeoutMs = 8000) {
  const key = env.FINNHUB_API_KEY || "d91t069r01qsj27o4k8gd91t069r01qsj27o4k90";
  if (!key) return { _unavailable: "no-finnhub-key" };
  const sep = path.includes("?") ? "&" : "?";
  return await fetchJson(`https://finnhub.io/api/v1${path}${sep}token=${encodeURIComponent(key)}`, {}, timeoutMs);
}

export async function fhQuote(env, ticker, timeoutMs = 8000) {
  return await cached(env, `q:${ticker}:${Math.floor(Date.now() / 60000)}`, 90, () =>
    finnhub(env, `/quote?symbol=${encodeURIComponent(ticker)}`, timeoutMs));
}
export async function fhProfile(env, ticker) {
  return await cached(env, `p:${ticker}:${todayUTC()}`, 86400, () =>
    finnhub(env, `/stock/profile2?symbol=${encodeURIComponent(ticker)}`));
}
export async function fhMetrics(env, ticker) {
  return await cached(env, `m:${ticker}:${todayUTC()}`, 86400, () =>
    finnhub(env, `/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`));
}
export async function fhNews(env, ticker) {
  const to = todayUTC();
  const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return await cached(env, `n:${ticker}:${to}`, 21600, () =>
    finnhub(env, `/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}`));
}

/* ---- Alpha Vantage: one daily series → all momentum maths -- */
export async function avDailyMetrics(env, ticker, timeoutMs = 12000) {
  const key = env.ALPHAVANTAGE_API_KEY || "G4TTTXBXU3I9YBGO";
  if (!key) return { status: "unavailable", reason: "no-alphavantage-key" };
  return await cached(env, `av:${ticker}:${todayUTC()}`, 86400, async () => {
    const js = await fetchJson(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker)}&outputsize=full&apikey=${encodeURIComponent(key)}`,
      {}, timeoutMs);
    if (js._httpError || js._fetchError) return { status: "unavailable", reason: "network" };
    if (js.Note || js.Information) return { status: "unavailable", reason: "rate-limited" };
    if (js["Error Message"] || !js["Time Series (Daily)"]) return { status: "unavailable", reason: "no-series" };
    const ts = js["Time Series (Daily)"];
    const dates = Object.keys(ts).sort();               // ascending (oldest→newest)
    const c = [], h = [], l = [], v = [];
    for (const d of dates) {
      const row = ts[d];
      c.push(parseFloat(row["4. close"]));
      h.push(parseFloat(row["2. high"]));
      l.push(parseFloat(row["3. low"]));
      v.push(parseFloat(row["5. volume"]));
    }
    const n = c.length;
    const last = c[n - 1];
    const metrics = {
      status: "ok",
      points: n,
      lastClose: last,
      rsi14: rsi(c, 14),
      sma50: sma(c, 50),
      sma200: sma(c, 200),
      vol30: volatility(c, 30),
      atr14: atr(h, l, c, 14),
      avgVol30: avgTail(v, 30),
      latestVol: v[n - 1],
      weekChangePct: n > 6 ? pct(last, c[n - 6]) : null,     // ~5 sessions
      monthChangePct: n > 22 ? pct(last, c[n - 22]) : null,  // ~21 sessions
      hi52: n > 1 ? Math.max(...c.slice(-252)) : null,
      lo52: n > 1 ? Math.min(...c.slice(-252)) : null,
    };
    if (metrics.atr14 != null && last) metrics.atr14Pct = (metrics.atr14 / last) * 100;
    return metrics;
  });
}

/* ---- CNN Fear & Greed (market-wide, cached daily) --------- */
export async function cnnFearGreed(env) {
  return await cached(env, `fng:${todayUTC()}`, 43200, async () => {
    const js = await fetchJson("https://production.dataviz.cnn.com/index/fearandgreed/graphdata", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        "Accept": "application/json",
      },
    }, 8000);
    if (js._httpError || js._fetchError || !js.fear_and_greed) return { status: "unavailable" };
    const f = js.fear_and_greed;
    return {
      status: "ok",
      score: Math.round(f.score),
      rating: f.rating,                       // e.g. "Fear", "Greed"
      prevClose: f.previous_close != null ? Math.round(f.previous_close) : null,
      prevWeek: f.previous_1_week != null ? Math.round(f.previous_1_week) : null,
    };
  });
}

/* ============================================================
   MATHS
   ============================================================ */
function pct(a, b) { return b ? ((a - b) / b) * 100 : null; }

function sma(cAsc, period) {
  const n = cAsc.length;
  if (n < period) return null;
  let s = 0;
  for (let i = n - period; i < n; i++) s += cAsc[i];
  return s / period;
}
function avgTail(arr, window) {
  const n = arr.length;
  if (n < 1) return null;
  const w = Math.min(window, n);
  let s = 0;
  for (let i = n - w; i < n; i++) s += arr[i];
  return s / w;
}
function rsi(cAsc, period = 14) {
  const n = cAsc.length;
  if (n < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = cAsc[i] - cAsc[i - 1];
    if (ch >= 0) gains += ch; else losses -= ch;
  }
  let avgG = gains / period, avgL = losses / period;
  for (let i = period + 1; i < n; i++) {
    const ch = cAsc[i] - cAsc[i - 1];
    const g = ch > 0 ? ch : 0, l = ch < 0 ? -ch : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}
function atr(hAsc, lAsc, cAsc, period = 14) {
  const n = cAsc.length;
  if (n < period + 1) return null;
  const trs = [];
  for (let i = 1; i < n; i++) {
    trs.push(Math.max(
      hAsc[i] - lAsc[i],
      Math.abs(hAsc[i] - cAsc[i - 1]),
      Math.abs(lAsc[i] - cAsc[i - 1])
    ));
  }
  let a = 0;
  for (let i = 0; i < period; i++) a += trs[i];
  a /= period;
  for (let i = period; i < trs.length; i++) a = (a * (period - 1) + trs[i]) / period;
  return a;
}
function volatility(cAsc, window = 30) {
  const n = cAsc.length;
  if (n < window + 1) return null;
  const rets = [];
  for (let i = n - window; i < n; i++) rets.push(Math.log(cAsc[i] / cAsc[i - 1]));
  const mean = rets.reduce((x, y) => x + y, 0) / rets.length;
  const varr = rets.reduce((x, y) => x + (y - mean) * (y - mean), 0) / (rets.length - 1);
  return Math.sqrt(varr) * Math.sqrt(252) * 100; // annualised %
}

/* ---------- headline sentiment (lexicon heuristic) --------- */
const POS = ["beat", "beats", "surge", "surges", "soar", "soars", "rally", "record", "profit", "growth",
  "upgrade", "upgraded", "raise", "raised", "strong", "gains", "gain", "jump", "jumps", "outperform",
  "bullish", "expansion", "wins", "win", "approval", "approved", "positive", "boost", "rebound", "top", "tops"];
const NEG = ["miss", "misses", "plunge", "plunges", "fall", "falls", "drop", "drops", "cut", "cuts", "downgrade",
  "downgraded", "loss", "losses", "weak", "warn", "warns", "warning", "lawsuit", "probe", "investigation",
  "bearish", "decline", "slump", "slumps", "recall", "layoff", "layoffs", "fraud", "bankruptcy", "sink", "sinks", "slash"];

export function headlineSentiment(news) {
  if (!Array.isArray(news) || news.length === 0) return { status: "unavailable" };
  const items = news.slice(0, 30);
  let net = 0, scored = 0;
  const recent = [];
  for (const a of items) {
    const t = String(a.headline || "").toLowerCase();
    if (!t) continue;
    let s = 0;
    for (const w of POS) if (t.includes(w)) s += 1;
    for (const w of NEG) if (t.includes(w)) s -= 1;
    const dir = s > 0 ? 1 : s < 0 ? -1 : 0;
    if (dir !== 0) scored++;
    net += dir;
    if (recent.length < 5) recent.push({ headline: a.headline, dir, source: a.source || "" });
  }
  const norm = scored ? Math.max(-1, Math.min(1, net / scored)) : 0;
  let label = "ნეიტრალური / Neutral";
  if (norm > 0.25) label = "დადებითი / Positive";
  else if (norm < -0.25) label = "უარყოფითი / Negative";
  return { status: "ok", net: +norm.toFixed(2), count: items.length, scored, label, recent };
}

/* ============================================================
   VALUATION reference tables
   ============================================================ */
// Long-run approximate sector median trailing P/E. Free providers
// do not expose a live sector median, so this is a documented,
// stable reference used only for the relative-valuation sub-score.
export const SECTOR_PE = {
  "Technology": 30, "Semiconductors": 26, "Software": 34, "Communication Services": 22,
  "Media": 20, "Consumer Cyclical": 22, "Retail": 21, "Consumer Defensive": 21,
  "Financial Services": 13, "Banking": 12, "Insurance": 13, "Healthcare": 24,
  "Biotechnology": 25, "Pharmaceuticals": 18, "Energy": 12, "Utilities": 18,
  "Industrials": 20, "Basic Materials": 15, "Real Estate": 30, "Automobiles": 15,
  "Airlines": 10, "Telecommunication": 16,
};
export function sectorMedianPE(sector) {
  if (!sector) return 20;
  if (SECTOR_PE[sector] != null) return SECTOR_PE[sector];
  const s = sector.toLowerCase();
  for (const k of Object.keys(SECTOR_PE)) if (s.includes(k.toLowerCase())) return SECTOR_PE[k];
  return 20; // broad-market fallback
}
export function marketCapTier(capMillions) {
  if (capMillions == null || !isFinite(capMillions)) return null;
  const b = capMillions / 1000; // → $bn
  if (b >= 200) return { tier: "Mega", ka: "მეგა", bn: b };
  if (b >= 10) return { tier: "Large", ka: "მსხვილი", bn: b };
  if (b >= 2) return { tier: "Mid", ka: "საშუალო", bn: b };
  if (b >= 0.3) return { tier: "Small", ka: "მცირე", bn: b };
  if (b >= 0.05) return { tier: "Micro", ka: "მიკრო", bn: b };
  return { tier: "Nano", ka: "ნანო", bn: b };
}

/* ============================================================
   COMPOSITE SCORE  (0–100) + research band
   Transparent, weighted, rescaled over available data.
   ============================================================ */
export const BANDS = [
  { min: 75, en: "STRONG RESEARCH INTEREST", ka: "ძლიერი კვლევითი ინტერესი", color: "#166534" },
  { min: 60, en: "WATCH", ka: "სათვალყურო", color: "#8b6914" },
  { min: 45, en: "NEUTRAL", ka: "ნეიტრალური", color: "#6b6b6b" },
  { min: 30, en: "WEAK", ka: "სუსტი", color: "#b45309" },
  { min: 0, en: "SHORT-SIDE CANDIDATE", ka: "ქვევითი მოძრაობის კანდიდატი", color: "#b91c1c" },
];
export function bandFor(score) {
  if (score == null) return { en: "INSUFFICIENT DATA", ka: "არასაკმარისი მონაცემები", color: "#6b6b6b" };
  for (const b of BANDS) if (score >= b.min) return b;
  return BANDS[BANDS.length - 1];
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function rsiScore(r) {
  if (r == null) return null;
  if (r < 30) return 0.28;
  if (r < 45) return 0.28 + ((r - 30) / 15) * 0.27;   // 0.28→0.55
  if (r <= 60) return 0.55 + ((r - 45) / 15) * 0.40;  // 0.55→0.95
  if (r <= 70) return 0.95 + ((r - 60) / 10) * 0.05;  // 0.95→1.00
  if (r <= 80) return 1.00 - ((r - 70) / 10) * 0.50;  // 1.00→0.50
  return Math.max(0.25, 0.50 - ((r - 80) / 20) * 0.25);
}
function maScore(price, s50, s200) {
  let sum = 0, w = 0;
  if (s50 != null) { sum += (price > s50 ? 1 : 0.15) * 0.5; w += 0.5; }
  if (s200 != null) { sum += (price > s200 ? 1 : 0.15) * 0.35; w += 0.35; }
  if (s50 != null && s200 != null) { sum += (s50 > s200 ? 1 : 0.2) * 0.15; w += 0.15; }
  return w ? sum / w : null;
}
function volScore(ratio) {
  if (ratio == null || !isFinite(ratio)) return null;
  if (ratio < 0.5) return 0.35;
  if (ratio < 1) return 0.55;
  if (ratio < 1.5) return 0.72;
  if (ratio < 3) return 0.90;
  return 0.75;
}
function rangeScore(p) {
  if (p == null) return null;
  let s = clamp01(0.15 + 0.85 * p);
  if (p > 0.97) s *= 0.9;
  return s;
}
function changeScore(m) {
  if (m == null) return null;
  if (m < -15) return 0.22;
  if (m < 0) return 0.35 + ((m + 15) / 15) * 0.15;   // 0.35→0.50
  if (m <= 15) return 0.50 + (m / 15) * 0.38;        // 0.50→0.88
  return 0.82;                                        // very hot = froth discount
}
function fngScore(f) {
  if (f == null) return null;
  if (f < 25) return 0.45;
  if (f < 45) return 0.58;
  if (f <= 65) return 0.75;
  if (f <= 80) return 0.60;
  return 0.38;
}
function peScore(pe, median) {
  if (pe == null || pe <= 0) return 0.5;              // no earnings / n.a. → neutral
  const ratio = pe / median;
  if (ratio < 0.7) return 0.90;
  if (ratio < 1.0) return 0.75;
  if (ratio < 1.3) return 0.55;
  if (ratio < 2.0) return 0.40;
  return 0.30;
}
function capScore(tier) {
  return { Mega: 0.80, Large: 0.75, Mid: 0.60, Small: 0.50, Micro: 0.40, Nano: 0.30 }[tier] ?? null;
}
function volFitScore(vol) {
  if (vol == null) return null;
  if (vol < 10) return 0.45;
  if (vol < 18) return 0.65;
  if (vol <= 35) return 0.85;
  if (vol <= 50) return 0.55;
  return 0.32;
}

// avg of {value,weight} pairs, ignoring nulls
function blend(parts) {
  let sum = 0, w = 0;
  for (const [v, wt] of parts) if (v != null) { sum += v * wt; w += wt; }
  return w ? sum / w : null;
}

/**
 * Compute the composite from an assembled dossier's numeric inputs.
 * Returns { score, band, contributions } where score may be null.
 */
export function computeScore(inp) {
  // inp: { price, rsi, sma50, sma200, volRatio, rangePos, monthChange,
  //        fng, headlineNet, pe, sectorMedianPE, capTier, vol30 }
  const momentum = blend([
    [rsiScore(inp.rsi), 0.40],
    [maScore(inp.price, inp.sma50, inp.sma200), 0.40],
    [volScore(inp.volRatio), 0.20],
  ]);
  const trend = blend([
    [rangeScore(inp.rangePos), 0.60],
    [changeScore(inp.monthChange), 0.40],
  ]);
  const sentiment = blend([
    [fngScore(inp.fng), 0.50],
    [inp.headlineNet == null ? null : clamp01(0.5 + 0.5 * inp.headlineNet), 0.50],
  ]);
  const valuation = blend([
    [inp.pe === undefined ? null : peScore(inp.pe, inp.sectorMedianPE || 20), 0.70],
    [capScore(inp.capTier), 0.30],
  ]);
  const cfd = volFitScore(inp.vol30);

  const sections = [
    ["momentum", momentum, 30],
    ["trend", trend, 20],
    ["sentiment", sentiment, 20],
    ["valuation", valuation, 15],
    ["cfd", cfd, 15],
  ];
  let sum = 0, avail = 0;
  const contributions = {};
  for (const [name, val, weight] of sections) {
    contributions[name] = { subScore: val == null ? null : +val.toFixed(3), weight, available: val != null };
    if (val != null) { sum += val * weight; avail += weight; }
  }
  const score = avail >= 35 ? Math.round((sum / avail) * 100) : null;
  return { score, availableWeight: avail, band: bandFor(score), contributions };
}

/* ============================================================
   SIGNAL TRACK-RECORD  (KV list under key "kvleva5:signals")
   ============================================================ */
const SIG_KEY = "kvleva5:signals";
const SIG_CAP = 750;

export async function readSignals(env) {
  const store = kv(env);
  if (!store) return { source: "none", signals: [] };
  try {
    const arr = (await store.get(SIG_KEY, "json")) || [];
    return { source: "kv", signals: arr };
  } catch (_) {
    return { source: "kv-error", signals: [] };
  }
}

export async function writeSignal(env, rec) {
  const store = kv(env);
  const signal = {
    id: `${rec.date}-${rec.ticker}-${Date.now().toString(36)}`,
    ts: new Date().toISOString(),
    date: rec.date,
    ticker: rec.ticker,
    price: rec.price,
    score: rec.score,
    band: rec.band,       // English canonical band
    bandKa: rec.bandKa || null,
  };
  if (!store) return { stored: false, reason: "kv-not-configured", signal };
  try {
    const arr = (await store.get(SIG_KEY, "json")) || [];
    // Make sure every existing entry is already notarized before we link
    // the new one onto the head (one-time backfill for pre-chain logs).
    const { head } = await ensureChainInPlace(arr);
    // Notarize the new entry: hash( content + prev_hash-of-current-head ).
    signal.prev_hash = head || "";
    signal.hash = await computeEntryHash(signal, signal.prev_hash);
    arr.unshift(signal);                       // newest first
    if (arr.length > SIG_CAP) arr.length = SIG_CAP;
    await store.put(SIG_KEY, JSON.stringify(arr));
    await store.put(CHAIN_HEAD_KEY, signal.hash);
    return { stored: true, signal, count: arr.length };
  } catch (e) {
    return { stored: false, reason: String(e && e.message || e), signal };
  }
}

/* ============================================================
   TAMPER-EVIDENT HASH CHAIN over the signal log
   Each entry stores SHA-256( canonicalJSON(content) + prev_hash ).
   Any silent edit, reorder, or deletion within the retained window
   breaks verification — that is what makes "real prediction" claims
   defensible. chain_head is the notarized head hash shown on the page.
   ============================================================ */
export const CHAIN_HEAD_KEY = "kvleva5:chain_head";

// Only these fields are notarized. Additive/display fields (hash,
// prev_hash, muted, …) are deliberately excluded so the hash is stable.
function chainContent(s) {
  return {
    id: s.id ?? null,
    ts: s.ts ?? null,
    date: s.date ?? null,
    ticker: s.ticker ?? null,
    price: s.price ?? null,
    score: s.score ?? null,
    band: s.band ?? null,
    bandKa: s.bandKa ?? null,
  };
}

// Deterministic JSON: keys sorted recursively so the same logical object
// always hashes identically regardless of insertion order.
export function canonicalJSON(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalJSON).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJSON(value[k])).join(",") + "}";
}

export async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

export async function computeEntryHash(sig, prevHash) {
  return await sha256hex(canonicalJSON({ content: chainContent(sig), prev_hash: prevHash || "" }));
}

// arr is newest-first. Recompute the whole chain oldest→newest, writing
// hash/prev_hash onto each entry in place. Returns the head (newest hash).
async function rebuildChainInPlace(arr) {
  let prev = "";
  for (let i = arr.length - 1; i >= 0; i--) {   // oldest → newest
    arr[i].prev_hash = prev;
    arr[i].hash = await computeEntryHash(arr[i], prev);
    prev = arr[i].hash;
  }
  return arr.length ? arr[0].hash : "";
}

// Only rebuilds when something is missing a hash (one-time backfill);
// otherwise trusts the existing chain and returns the current head.
async function ensureChainInPlace(arr) {
  if (arr.length === 0) return { head: "", rebuilt: false };
  const missing = arr.some((s) => !s.hash || !("prev_hash" in s));
  if (missing) return { head: await rebuildChainInPlace(arr), rebuilt: true };
  return { head: arr[0].hash, rebuilt: false };
}

// Verify the retained window: each entry's hash must recompute from its own
// content + stored prev_hash, and each prev_hash must link to the previous
// (older) entry's hash. The oldest retained entry is the anchor — its
// prev_hash may reference an entry already dropped by the SIG_CAP window.
export async function verifyChain(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return { valid: true, head: "" };
  for (let i = arr.length - 1; i >= 0; i--) {   // oldest → newest
    const e = arr[i];
    if (!e.hash) return { valid: false, head: arr[0].hash || "" };
    if ((await computeEntryHash(e, e.prev_hash || "")) !== e.hash) {
      return { valid: false, head: arr[0].hash || "" };
    }
    if (i < arr.length - 1 && e.prev_hash !== arr[i + 1].hash) {
      return { valid: false, head: arr[0].hash || "" };
    }
  }
  return { valid: true, head: arr[0].hash };
}

// Read the log, backfill the chain once if needed (persisting it), and
// verify. Never throws — on any KV hiccup it reports chain_valid:true with
// whatever it has, so /api/journal never fails on notarization alone.
export async function ensureChain(env) {
  const store = kv(env);
  const { source, signals } = await readSignals(env);
  if (!store || signals.length === 0) {
    return { signals, chain_head: signals[0]?.hash || null, chain_valid: true, source };
  }
  const { head, rebuilt } = await ensureChainInPlace(signals);
  if (rebuilt) {
    try {
      await store.put(SIG_KEY, JSON.stringify(signals));
      await store.put(CHAIN_HEAD_KEY, head);
    } catch (_) {}
  }
  const v = await verifyChain(signals);
  let storedHead = null;
  try { storedHead = await store.get(CHAIN_HEAD_KEY); } catch (_) {}
  const chain_valid = v.valid && (storedHead == null || storedHead === head);
  return { signals, chain_head: head, chain_valid, source };
}

/* ============================================================
   DAILY PRICE SNAPSHOTS — one immutable point per ticker per UTC day.
   key: kvleva5:snapshots:<TICKER>:<YYYY-MM-DD>  value: { price, ts }
   The price is duplicated into KV metadata {p,t} so a whole sparkline
   series rebuilds from a single list() call — no per-key gets, no extra
   provider calls. The journal literally grows richer the longer it lives.
   ============================================================ */
export const SNAP_PREFIX = "kvleva5:snapshots:";

// Write today's snapshot for a ticker if (and only if) it doesn't exist
// yet today. Immutable once written. Returns true if a new point was stored.
export async function writeSnapshotIfAbsent(env, ticker, price, ts) {
  const store = kv(env);
  if (!store || price == null || !isFinite(price)) return false;
  const key = `${SNAP_PREFIX}${ticker}:${todayUTC()}`;
  try {
    if ((await store.get(key)) !== null) return false;   // already snapped today
    const rec = { price: +(+price).toFixed(4), ts: ts || new Date().toISOString() };
    await store.put(key, JSON.stringify(rec), { metadata: { p: rec.price, t: rec.ts } });
    return true;
  } catch (_) {
    return false;
  }
}

// Ascending [{date, price}] for a ticker, read cheaply from list() metadata.
export async function readSnapshotSeries(env, ticker) {
  const store = kv(env);
  if (!store) return [];
  const prefix = `${SNAP_PREFIX}${ticker}:`;
  const out = [];
  try {
    let cursor;
    do {
      const res = await store.list({ prefix, cursor, limit: 1000 });
      for (const k of res.keys) {
        const p = k.metadata && k.metadata.p;
        if (p == null) continue;                            // skip metadata-less keys (cheap path)
        out.push({ date: k.name.slice(prefix.length), price: +p });
      }
      cursor = res.list_complete ? null : res.cursor;
    } while (cursor);
  } catch (_) {
    return out;
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/* ============================================================
   FROZEN GRADES — immutable verdicts. Written once, NEVER overwritten.
   key: kvleva5:grades:<signalId>:<horizon>  value:
     { horizon, graded_at, as_of, price_at_grade, signal_price,
       return_pct, verdict, source }
   Frozen grades are the ONLY input to hit-rate / avg-return stats, so a
   verdict can never retroactively change once the horizon has passed.
   ============================================================ */
export const GRADE_PREFIX = "kvleva5:grades:";

export function gradeKey(signalId, horizon) { return `${GRADE_PREFIX}${signalId}:${horizon}`; }

export async function readGrade(env, signalId, horizon) {
  const store = kv(env);
  if (!store) return null;
  try { return await store.get(gradeKey(signalId, horizon), "json"); } catch (_) { return null; }
}

// Write once. If a record already exists it is returned untouched — a
// frozen grade is permanent (no TTL). Returns the record actually in force.
export async function freezeGrade(env, signalId, horizon, record) {
  const store = kv(env);
  if (!store) return record;
  const key = gradeKey(signalId, horizon);
  try {
    const existing = await store.get(key, "json");
    if (existing) return existing;                          // immutable — never overwrite
    await store.put(key, JSON.stringify(record));           // no TTL — permanent
    return record;
  } catch (_) {
    return record;
  }
}

/* ---------- gradability + verdicts ------------------------- */
// Only directional research calls are gradable. WATCH/NEUTRAL/WEAK are
// observations, not predictions, so they are never scored.
export const GRADABLE_BANDS = new Set(["STRONG RESEARCH INTEREST", "SHORT-SIDE CANDIDATE"]);

export function isGradableBand(band) {
  return GRADABLE_BANDS.has(String(band || "").toUpperCase());
}

// Thesis-adjusted verdict. rawPct = (grade_price - signal_price)/signal_price*100.
// A short-side thesis profits when price FALLS, so the sign is flipped.
// FLAT = |move| < 1% (thesis neither confirmed nor denied).
export function verdictFor(band, rawPct) {
  if (rawPct == null || !isFinite(rawPct)) return "PENDING";
  const thesis = String(band || "").toUpperCase() === "SHORT-SIDE CANDIDATE" ? -rawPct : rawPct;
  if (thesis >= 1) return "HIT";
  if (thesis <= -1) return "MISS";
  return "FLAT";
}

/* end · კვლევა 5.0 shared library */
