#!/usr/bin/env node
/* ============================================================
   The Trading Paper — daily snapshot
   Runs after US market close (via GitHub Action). Reads the
   portfolio data, fetches live prices, computes deposited + value
   per book, and appends ONE dated point to data/history.json.
   The mountain charts read history.json, so they grow every day.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HIST = path.join(ROOT, 'data', 'history.json');

// ---- load portfolios.js (browser file) into a sandbox ----
function loadPortfolios() {
  let src = fs.readFileSync(path.join(ROOT, 'js', 'portfolios.js'), 'utf8');
  src = src.replace('const portfolios', 'globalThis.portfolios'); // expose
  const ctx = { globalThis: {}, document: { getElementById: () => null }, console, fetch: () => {} };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.portfolios;
}

// ---- load portfolio-data.js (window.MEPORTF) ----
function loadMeportf() {
  let src = fs.readFileSync(path.join(ROOT, 'portfolio-data.js'), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.MEPORTF || {};
}

// ---- live price from Yahoo (server-side: no CORS, no proxy needed) ----
async function fetchPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
    return (m && (m.regularMarketPrice || m.previousClose)) || null;
  } catch (e) { return null; }
}

function deposits(p) {
  let d = p.priorDeposits || 0;
  for (const t of (p.transactions || [])) if (t.type === 'deposit') d += t.amount;
  return d;
}

async function bookValue(p) {
  let v = p.cash || 0;
  for (const h of p.holdings) {
    const price = (await fetchPrice(h.ticker)) || h.avgBuy || 0;
    v += (h.shares !== undefined) ? h.shares * price : h.value;
  }
  return +v.toFixed(2);
}

(async () => {
  const P = loadPortfolios();
  const D = loadMeportf();

  // BOG: cash deployed (0). TBC: as-is. GALT: closed -> net deposit, value 0.
  const bog = { deposited: +deposits(P.bog).toFixed(2), value: await bookValue(P.bog) };
  const tbc = { deposited: +deposits(P.tbc).toFixed(2), value: await bookValue(P.tbc) };

  let galt;
  if (D.galt && D.galt.closed) {
    galt = { deposited: +((D.galt.deposit || 0) - (D.galt.withdrawnToBOG || 0)).toFixed(2), value: 0 };
  } else {
    galt = { deposited: +deposits(P.galt).toFixed(2), value: await bookValue(P.galt) };
  }

  const today = new Date().toISOString().slice(0, 10);
  const entry = { date: today, books: { bog, tbc, galt } };

  // short "story" line comparing value vs deposited per book
  const pct = b => b.deposited > 0 ? ((b.value - b.deposited) / b.deposited * 100) : 0;
  entry.note = `BOG $${bog.value} (${pct(bog) >= 0 ? '+' : ''}${pct(bog).toFixed(1)}%) · ` +
               `TBC $${tbc.value} (${pct(tbc) >= 0 ? '+' : ''}${pct(tbc).toFixed(1)}%) · ` +
               `GALT closed`;

  let hist = [];
  try { hist = JSON.parse(fs.readFileSync(HIST, 'utf8')); } catch (e) { hist = []; }
  hist = hist.filter(e => e.date !== today);   // replace today if re-run
  hist.push(entry);
  hist.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(HIST, JSON.stringify(hist, null, 2) + '\n');
  console.log('snapshot written:', JSON.stringify(entry));
})();
