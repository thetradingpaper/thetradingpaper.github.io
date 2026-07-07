#!/usr/bin/env node
// ============================================================
// The Trading Paper — BOT · Signal Desk engine
// Runs every 30 min during US market hours (.github/workflows/signals.yml)
//
// - Watchlist: 5 liquid, volatile stocks (edit WATCHLIST below)
// - Computes RSI(14), SMA5/20, ATR(14), 20d-high breakout, volume surge
// - 3 transparent long rules, swing horizon max 5 trading days
// - Paper portfolio: $100 start, $20 per slot, 5 slots
// - Every signal logged; outcomes tracked -> honest win rate
//
// Outputs: data/signals.json, data/bot-state.json, data/signals-log.json
// This produces INFORMATION, not financial advice. It never trades real money.
// ============================================================

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DATA = p => path.join(ROOT, 'data', p);

// ---- CONFIG -------------------------------------------------
const WATCHLIST = ['NVDA', 'TSLA', 'MSTR', 'PLTR', 'BABA'];
const START_CASH = 100;
const SLOT = 20;               // $ per position
const MAX_HOLD_DAYS = 5;       // time stop
const TARGET_ATR = 2.0;        // take profit = entry + 2.0 x ATR
const STOP_ATR = 1.5;          // stop loss  = entry - 1.5 x ATR

// ---- data fetch ---------------------------------------------
async function fetchDaily(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=4mo`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (ttp-bot)' } });
  if (!res.ok) throw new Error(`${ticker} HTTP ${res.status}`);
  const j = await res.json();
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error(`${ticker} no result`);
  const q = r.indicators.quote[0];
  const out = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    if (q.close[i] == null) continue;
    out.push({ t: r.timestamp[i], date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
      o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] });
  }
  const meta = r.meta || {};
  // include live price if market open (last candle may be intraday already)
  return { candles: out, live: meta.regularMarketPrice || out[out.length - 1].c };
}

// ---- indicators ---------------------------------------------
const sma = (a, n) => a.length >= n ? a.slice(-n).reduce((s, x) => s + x, 0) / n : null;

function rsi(closes, n = 14) {
  if (closes.length < n + 1) return null;
  let g = 0, l = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / l);
}

function atr(c, n = 14) {
  if (c.length < n + 1) return null;
  let s = 0;
  for (let i = c.length - n; i < c.length; i++) {
    s += Math.max(c[i].h - c[i].l, Math.abs(c[i].h - c[i - 1].c), Math.abs(c[i].l - c[i - 1].c));
  }
  return s / n;
}

// ---- rules --------------------------------------------------
function evaluate(t, candles, live) {
  const closes = candles.map(x => x.c);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const ind = {
    price: +live.toFixed(2),
    rsi: +(rsi(closes) ?? 0).toFixed(1),
    sma5: +(sma(closes, 5) ?? 0).toFixed(2),
    sma20: +(sma(closes, 20) ?? 0).toFixed(2),
    atr: +(atr(candles) ?? 0).toFixed(2),
    high20: +Math.max(...candles.slice(-21, -1).map(x => x.h)).toFixed(2),
    vol: last.v,
    avgVol20: Math.round(candles.slice(-21, -1).reduce((s, x) => s + x.v, 0) / 20),
    chg1d: +(((live - prev.c) / prev.c) * 100).toFixed(2),
  };
  const reasons = [];
  let buy = false;

  // R1 oversold bounce: RSI<32 and price reclaiming above yesterday close
  if (ind.rsi < 32 && live > prev.c) { buy = true; reasons.push(`R1 oversold bounce · RSI ${ind.rsi} < 32 · პირველი მწვანე`); }
  // R2 breakout: above 20d high on 1.4x volume
  if (live > ind.high20 && ind.vol > 1.4 * ind.avgVol20) { buy = true; reasons.push(`R2 breakout · ფასი > 20დ მაქსიმუმი $${ind.high20} · მოცულობა ${(ind.vol / ind.avgVol20).toFixed(1)}×`); }
  // R3 trend pullback: uptrend (sma5>sma20), dip touched sma5, closing back above
  if (ind.sma5 > ind.sma20 && last.l <= ind.sma5 && live > ind.sma5) { buy = true; reasons.push(`R3 trend pullback · SMA5>SMA20 · ფასი დაუბრუნდა SMA5-ს`); }

  const entry = +live.toFixed(2);
  return {
    ticker: t, ...ind,
    signal: buy ? 'BUY' : 'WAIT',
    reasons,
    plan: buy ? {
      entry,
      target: +(entry + TARGET_ATR * ind.atr).toFixed(2),
      stop: +(entry - STOP_ATR * ind.atr).toFixed(2),
      horizon: `${MAX_HOLD_DAYS} სავაჭრო დღე max`,
    } : null,
  };
}

// ---- paper portfolio ----------------------------------------
function loadJSON(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; } }

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const state = loadJSON(DATA('bot-state.json'), { startDate: today, startCash: START_CASH, cash: START_CASH, positions: [], equityHistory: [] });
  const log = loadJSON(DATA('signals-log.json'), []);

  const results = [];
  for (const t of WATCHLIST) {
    try {
      const { candles, live } = await fetchDaily(t);
      results.push({ ok: true, ...evaluate(t, candles, live) });
    } catch (e) {
      console.error(t, e.message);
      results.push({ ok: false, ticker: t, signal: 'ERROR', reasons: [e.message] });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const px = Object.fromEntries(results.filter(r => r.ok).map(r => [r.ticker, r.price]));

  // 1) manage open positions: stop / target / time exit
  const tradingDaysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000 * 5 / 7);
  for (const pos of [...state.positions]) {
    const p = px[pos.ticker];
    if (!p) continue;
    let exit = null;
    if (p >= pos.target) exit = 'TARGET';
    else if (p <= pos.stop) exit = 'STOP';
    else if (tradingDaysBetween(pos.opened.slice(0, 10), today) >= MAX_HOLD_DAYS) exit = 'TIME';
    if (exit) {
      const proceeds = pos.shares * p;
      const pnl = proceeds - pos.cost;
      state.cash = +(state.cash + proceeds).toFixed(2);
      state.positions = state.positions.filter(x => x !== pos);
      log.unshift({ closed: now, opened: pos.opened, ticker: pos.ticker, rule: pos.rule,
        entry: pos.entry, exit: +p.toFixed(2), exitType: exit,
        pnl: +pnl.toFixed(2), pnlPct: +((pnl / pos.cost) * 100).toFixed(2) });
      console.log(`CLOSE ${pos.ticker} ${exit} pnl ${pnl.toFixed(2)}`);
    }
  }

  // 2) open new BUYs if slot free and not already holding
  for (const r of results) {
    if (!r.ok || r.signal !== 'BUY') continue;
    if (state.positions.find(p => p.ticker === r.ticker)) continue;
    if (state.positions.length >= 5 || state.cash < SLOT) continue;
    const shares = +(SLOT / r.plan.entry).toFixed(6);
    state.cash = +(state.cash - SLOT).toFixed(2);
    state.positions.push({ ticker: r.ticker, opened: now, rule: r.reasons[0]?.slice(0, 2) || 'R?',
      reason: r.reasons.join(' | '), entry: r.plan.entry, shares, cost: SLOT,
      target: r.plan.target, stop: r.plan.stop });
    console.log(`OPEN ${r.ticker} @ ${r.plan.entry}`);
  }

  // 3) equity + stats
  const posValue = state.positions.reduce((s, p) => s + p.shares * (px[p.ticker] || p.entry), 0);
  const equity = +(state.cash + posValue).toFixed(2);
  const hIdx = state.equityHistory.findIndex(e => e.date === today);
  const eRow = { date: today, equity };
  if (hIdx >= 0) state.equityHistory[hIdx] = eRow; else state.equityHistory.push(eRow);

  const wins = log.filter(x => x.pnl > 0).length;
  const stats = {
    closedTrades: log.length, wins, losses: log.length - wins,
    winRate: log.length ? +((wins / log.length) * 100).toFixed(1) : null,
    totalPnl: +log.reduce((s, x) => s + x.pnl, 0).toFixed(2),
    equity, returnPct: +(((equity - state.startCash) / state.startCash) * 100).toFixed(2),
  };

  fs.writeFileSync(DATA('signals.json'), JSON.stringify({ updated: now, watchlist: WATCHLIST, results, stats }, null, 1) + '\n');
  fs.writeFileSync(DATA('bot-state.json'), JSON.stringify(state, null, 1) + '\n');
  fs.writeFileSync(DATA('signals-log.json'), JSON.stringify(log.slice(0, 200), null, 1) + '\n');
  console.log('signals written', today, 'equity', equity, 'open', state.positions.length);
})();
