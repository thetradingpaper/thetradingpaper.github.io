#!/usr/bin/env node
// ============================================================
// The Trading Paper — price & history snapshot
// Runs in GitHub Actions (see .github/workflows/snapshot.yml).
// 1. Reads js/portfolios.js (single source of truth)
// 2. Fetches live quotes from Yahoo Finance for every ticker
// 3. Writes data/prices.json  (price cache used by the site as fallback)
// 4. Upserts today's row in data/history.json (The Mountain chart data)
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// --- load portfolios.js (browser script; top level is data + function defs only)
const src = fs.readFileSync(path.join(ROOT, 'js', 'portfolios.js'), 'utf8');
const sandbox = {};
new Function('exports', src + '\nexports.portfolios = portfolios; exports.aggregate = aggregate;')(sandbox);
const { portfolios, aggregate } = sandbox;

const tickers = [...new Set(Object.values(portfolios).flatMap(p => (p.holdings || []).map(h => h.ticker)))];

async function fetchQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d&includePrePost=true`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (snapshot-bot)' } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || !meta.regularMarketPrice) return null;
    const state = meta.marketState || 'REGULAR';
    const reg = meta.regularMarketPrice;
    const pre = meta.preMarketPrice;
    const post = meta.postMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose || reg;
    let price = reg, session = 'REG';
    if ((state === 'PRE' || state === 'PREPRE') && pre) { price = pre; session = 'PRE'; }
    else if ((state === 'POST' || state === 'POSTPOST') && post) { price = post; session = 'POST'; }
    else if (state === 'CLOSED' && post) { price = post; session = 'POST'; }
    return { price: +price.toFixed(4), previousClose: +prev.toFixed(4), session, state };
  } catch (e) {
    console.error(`fetch ${ticker} failed:`, e.message);
    return null;
  }
}

(async () => {
  const quotes = {};
  for (const t of tickers) {
    const q = await fetchQuote(t);
    if (q) quotes[t] = q;
    await new Promise(r => setTimeout(r, 400)); // be polite
  }
  console.log(`fetched ${Object.keys(quotes).length}/${tickers.length} quotes`);
  if (!Object.keys(quotes).length) { console.error('no quotes — keeping previous data'); process.exit(0); }

  // ---- prices.json
  const pricesPath = path.join(ROOT, 'data', 'prices.json');
  fs.writeFileSync(pricesPath, JSON.stringify({
    updated: new Date().toISOString(),
    source: 'yahoo-finance-v8 via GitHub Actions',
    quotes,
  }, null, 2) + '\n');

  // ---- history.json (one row per UTC day, per book: value + deposited)
  const histPath = path.join(ROOT, 'data', 'history.json');
  let history = [];
  try { history = JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch (e) {}

  const today = new Date().toISOString().slice(0, 10);
  const books = {};
  for (const [key, p] of Object.entries(portfolios)) {
    let value = p.cash || 0;
    for (const h of p.holdings || []) {
      const q = quotes[h.ticker];
      value += q ? h.shares * q.price : h.value; // fall back to cached value
    }
    const a = aggregate(p);
    books[key] = { value: +value.toFixed(2), deposited: +a.deposits.toFixed(2) };
  }

  const i = history.findIndex(r => r.date === today);
  const row = { date: today, books };
  if (i >= 0) history[i] = row; else history.push(row);
  history.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(histPath, JSON.stringify(history, null, 1) + '\n');

  console.log('snapshot written:', today, JSON.stringify(books));
})();
