// ============================================================
// The Trading Paper — Portfolios & Transactions Data
// ============================================================
//
// Two portfolios, each with own history & rules:
//  - BOG (Bank of Georgia) — long-term DCA, $100-200/month, goal 35%/yr
//  - TBC — active single-stock trading, full balance, goal 150%/yr
//
// Last sync: Issue 13 · 2026-06-29 — TBC ARCC/MAIN adds + MSTR top-up; BOG MNST top-up
// To add a new transaction, push to the portfolio.transactions array.
// Sort transactions descending (newest first) for display.
// ============================================================

// Data now lives in js/portfolios.data.js (window.PORTFOLIOS) so the
// manual editor (edit.html) can regenerate it cleanly. Helpers stay here.
const portfolios = window.PORTFOLIOS || {};


// ============================================================
// Helpers
// ============================================================

function fmtMoney(n) {
  const s = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '−$' : '$') + s;
}

function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function fmtDate(s) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function txPaid(tx) { return tx.shares * tx.price + (tx.commission || 0); }
function txReceived(tx) { return tx.shares * tx.price - (tx.commission || 0); }

function aggregate(p) {
  let deposits = (p.priorDeposits || 0);
  let bought = (p.priorCostBasis || 0);
  let sold = 0, fees = 0, withdrawn = 0;
  for (const tx of p.transactions) {
    if (tx.type === 'deposit') deposits += tx.amount;
    if (tx.type === 'withdraw') withdrawn += tx.amount; // cash taken OUT
    if (tx.type === 'buy') { bought += tx.shares * tx.price; fees += (tx.commission || 0); }
    if (tx.type === 'sell') { sold += tx.shares * tx.price; fees += (tx.commission || 0); }
    if (tx.type === 'fee') fees += tx.amount;
  }
  const currentValue = p.holdings.reduce((s,h) => s + h.value, 0) + p.cash;
  const netInvested = deposits - withdrawn;
  // withdrawn cash is realized value that left the book — count it so P/L stays honest
  const pnl = currentValue + withdrawn - deposits;
  const pnlPct = netInvested > 0 ? (pnl / netInvested) * 100 : 0;
  const hasHistory = p.transactions.length > 0 || (p.priorDeposits || 0) > 0;
  return { deposits, bought, sold, fees, withdrawn, currentValue, netInvested, pnl, pnlPct, hasHistory };
}

// ============================================================
// Renderers
// ============================================================

function renderTx(tx) {
  const date = `<span class="tx-date">${fmtDate(tx.date)}</span>`;

  if (tx.type === 'deposit') return `<div class="tx tx-deposit">
${date}
<span class="tx-badge badge-deposit">${(tx.amount<0||/transfer|გადა|გადმ/i.test(tx.note||''))?'TRANSFER':'DEPOSIT'}</span>
<span class="tx-line"><strong>${tx.amount<0?'−':'+'}${fmtMoney(Math.abs(tx.amount))}</strong> &nbsp;${tx.note?tx.note:'→ CASH'}</span>
</div>`;

  if (tx.type === 'withdraw') return `<div class="tx tx-sell">
${date}
<span class="tx-badge badge-sell">WITHDRAW</span>
<span class="tx-line"><strong>−${fmtMoney(tx.amount)}</strong> &nbsp;CASH → ბარათი${tx.note ? ` · <span class="muted">${tx.note}</span>` : ''}</span>
</div>`;

  if (tx.type === 'buy') return `<div class="tx tx-buy">
${date}
<span class="tx-badge badge-buy">BUY</span>
<span class="tx-line">
<strong>${tx.ticker}</strong> ·
${tx.shares} sh @ ${fmtMoney(tx.price)}${tx.commission ? ` · <span class="muted">fee ${fmtMoney(tx.commission)}</span>` : ''} ·
paid <strong>${fmtMoney(txPaid(tx))}</strong>
</span>
</div>`;

  if (tx.type === 'sell') return `<div class="tx tx-sell">
${date}
<span class="tx-badge badge-sell">SELL</span>
<span class="tx-line">
<strong>${tx.ticker}</strong> ·
${tx.shares} sh @ ${fmtMoney(tx.price)}${tx.commission ? ` · <span class="muted">fee ${fmtMoney(tx.commission)}</span>` : ''} ·
received <strong>${fmtMoney(txReceived(tx))}</strong>
</span>
</div>`;

  if (tx.type === 'dividend') return `<div class="tx tx-deposit">
${date}
<span class="tx-badge badge-deposit">DIVIDEND</span>
<span class="tx-line"><strong>${tx.ticker||''}</strong> &nbsp;+${fmtMoney(tx.amount)}${tx.note ? ` &middot; <span class="muted">${tx.note}</span>` : ''}</span>
</div>`;

  if (tx.type === 'fee') return `<div class="tx tx-fee">
${date}
<span class="tx-badge badge-fee">FEE</span>
<span class="tx-line">−${fmtMoney(tx.amount)} ${tx.note ? '· ' + tx.note : ''}</span>
</div>`;

  return '';
}

function renderStatBanner(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const el = document.getElementById(containerId);
  if (!el) return;

  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlStr = a.hasHistory ? fmtMoney(a.pnl) : '—';
  const pctStr = a.hasHistory ? fmtPct(a.pnlPct) : '—';
  let depStr = '—';
  if (a.hasHistory) {
    if (a.withdrawn > 0) {
      depStr = `<div style="font-size:9.5px;color:var(--muted);margin-bottom:3px;font-family:'Noto Sans Georgian',sans-serif;letter-spacing:0.2px;font-weight:400;text-transform:none;line-height:1.2;">ჩარ: <span style="color:#0056b3;font-weight:700;">${fmtMoney(a.deposits)}</span> &nbsp;·&nbsp; გატ: <span style="color:#166534;font-weight:700;">${fmtMoney(a.withdrawn)}</span></div>
      <div>${fmtMoney(a.netInvested)}</div>`;
    } else {
      depStr = fmtMoney(a.netInvested);
    }
  }

  // Annual dividend — sum across holdings that have a divYield, then net after 30% GE withholding.
  // Only show the cell when at least one holding actually pays a dividend.
  let divGross = 0;
  let anyYield = false;
  for (const h of p.holdings) {
    if (typeof h.divYield === 'number' && h.divYield > 0) {
      divGross += h.value * (h.divYield / 100);
      anyYield = true;
    }
  }
  const divNet = divGross * 0.70; // GE 30% withholding tax
  const portYieldPct = a.currentValue > 0 ? (divGross / a.currentValue) * 100 : 0;

  const divCell = anyYield ? `
<div class="stat-cell">
<div class="stat-label">წლიური დივიდენდი (წმინდა)</div>
<div class="stat-val pos">${fmtMoney(divNet)}<span class="stat-sub">≈ ${portYieldPct.toFixed(2)}% / წელი · 30% GE გადასახადის შემდეგ</span></div>
</div>` : '';

  let divReceived = 0;
  for (const tx of p.transactions) { if (tx.type === 'dividend') divReceived += (tx.amount || 0); }
  const recvCell = divReceived > 0 ? `
<div class="stat-cell">
<div class="stat-label">სულ მიღებული დივიდენდი <a href="dividends.html" style="text-decoration:none;color:#b91c1c;font-weight:800" title="დივიდენდების ისტორია">↗</a></div>
<div class="stat-val pos">${fmtMoney(divReceived)}<span class="stat-sub">წმინდა · მიღებული</span></div>
</div>` : '';

  const wdCell = (a.withdrawn > 0) ? `
<div class="stat-cell">
<div class="stat-label">გატანილი · Withdrawn</div>
<div class="stat-val pos">${fmtMoney(a.withdrawn)}</div>
</div>` : '';

  const gridClass = anyYield ? 'stat-grid with-div' : 'stat-grid';

  el.innerHTML = `
<div class="stat-banner">
<div class="stat-banner-head">
<span class="stat-name">${p.name} · ${p.fullName.toUpperCase()}</span>
<span class="stat-tag">${p.tagline}</span>
</div>
<div class="${gridClass}">
<div class="stat-cell">
<div class="stat-label">სრული ჩარიცხული</div>
<div class="stat-val">${depStr}</div>
</div>
<div class="stat-cell">
<div class="stat-label">პორტფელის ღირებულება</div>
<div class="stat-val">${fmtMoney(a.currentValue)}</div>
</div>
<div class="stat-cell">
<div class="stat-label">წმინდა P/L</div>
<div class="stat-val ${pnlClass}">${pnlStr}</div>
</div>
<div class="stat-cell">
<div class="stat-label">უკუგება</div>
<div class="stat-val ${pnlClass}">${pctStr}</div>
</div>${wdCell}${divCell}${recvCell}
</div>
<div class="stat-foot">
<span>თვალყურის დევნება დაიწყო: ${fmtDate(p.startDate)}</span>
<span class="live-dot">● LIVE</span>
</div>
</div>
`;
}

function renderDonut(canvasId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = p.holdings.map(h => h.ticker);
  const data = p.holdings.map(h => h.value);
  const colors = p.holdings.map(h => h.color);

  if (p.cash > 0) {
    labels.push('CASH'); data.push(p.cash); colors.push('#9ca3af');
  }

  new Chart(canvas, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fffdf7' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { family: "'Noto Sans Georgian', sans-serif", size: 12 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtMoney(ctx.parsed)}` } }
      }
    }
  });
}

function renderPaginated(listId, pagerId, portfolioKey, perPage = 4) {
  const p = portfolios[portfolioKey];
  const list = document.getElementById(listId);
  const pager = document.getElementById(pagerId);
  if (!list) return;

  if (!p.transactions.length) {
    list.innerHTML = `<div class="empty-state">ჯერ არ არსებობს ტრანზაქცია — დაიწყე აღრიცხვა აქედან</div>`;
    if (pager) pager.innerHTML = '';
    return;
  }

  let page = 1;
  const total = Math.ceil(p.transactions.length / perPage);
  function draw() {
    const start = (page - 1) * perPage;
    list.innerHTML = p.transactions.slice(start, start + perPage).map(renderTx).join('');
    if (!pager) return;
    let html = '';
    if (page > 1) html += `<button class="page-link" data-p="${page-1}">← წინა</button>`;
    for (let i = 1; i <= total; i++)
      html += i === page ? `<span class="page-current">${i}</span>` : `<button class="page-link" data-p="${i}">${i}</button>`;
    if (page < total) html += `<button class="page-link" data-p="${page+1}">შემდეგი →</button>`;
    pager.innerHTML = html;
    pager.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { page = +b.dataset.p; draw(); }));
  }
  draw();
}

// Newspaper-style card grid for holdings (PDF aesthetic) — one card per stock
function renderHoldingsCards(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const c = document.getElementById(containerId);
  if (!c) return;
  let html = '';
  for (const h of p.holdings) {
    const price = h.livePrice || h.avgBuy || 0;
    const value = (h.shares !== undefined && price)
      ? +(h.shares * price).toFixed(2)
      : h.value;
    const invested = h.invested || 0;
    const unreal = value - invested;
    const unrealPct = invested > 0 ? (unreal / invested) * 100 : 0;
    const dayPct = h.dayChangePct;
    const dayDollar = (h.dayChangePct !== undefined && h.shares !== undefined && h.previousClose)
      ? +((price - h.previousClose) * h.shares).toFixed(2)
      : null;

    const sess = (h.liveSession === 'PRE') ? ` <span class="sess-badge pre">PRE</span>`
      : (h.liveSession === 'POST') ? ` <span class="sess-badge post">POST</span>`
      : '';

    const unrealClass = unreal >= 0 ? 'pos' : 'neg';
    const dayClass = (dayPct >= 0) ? 'pos' : 'neg';

    html += `
<div class="hcard">
<div class="hcard-head">
<span class="hcard-ticker">${h.ticker}</span>
<span class="hcard-name">${h.name.toUpperCase()}</span>
</div>
<table class="hcard-tbl">
<tr><td>SHARES</td><td class="num">${(+h.shares).toFixed(8).replace(/0+$/, '').replace(/\.$/, '')}</td></tr>
<tr><td>AVG BUY</td><td class="num">$${h.avgBuy.toFixed(2)}</td></tr>
<tr><td>PRICE</td><td class="num">$${price.toFixed(2)}${sess}</td></tr>
<tr><td>INVESTED</td><td class="num">$${invested.toFixed(2)}</td></tr>
<tr><td>VALUE</td><td class="num">$${value.toFixed(2)}</td></tr>
<tr><td>UNREALISED</td><td class="num ${unrealClass}">${unreal >= 0 ? '+' : '−'}$${Math.abs(unreal).toFixed(2)} (${unreal >= 0 ? '+' : '−'}${Math.abs(unrealPct).toFixed(2)}%)</td></tr>
${dayDollar !== null ? `<tr><td>DAY</td><td class="num ${dayClass}">${dayDollar >= 0 ? '+' : '−'}$${Math.abs(dayDollar).toFixed(2)} (${dayPct >= 0 ? '+' : '−'}${Math.abs(dayPct).toFixed(2)}%)</td></tr>` : ''}
</table>
</div>`;
  }
  c.innerHTML = html;
}

function renderHoldings(tableBodyId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const tb = document.getElementById(tableBodyId);
  if (!tb) return;
  const total = p.holdings.reduce((s, h) => s + h.value, 0) + p.cash;
  let html = '';
  for (const h of p.holdings) {
    const pct = ((h.value / total) * 100).toFixed(1);
    const sharesCol = h.shares !== undefined ? `<td class="num">${(+h.shares).toFixed(4)}</td>` : '<td class="num">—</td>';

    let liveCell;
    if (h.livePrice) {
      const sessBadge = (h.liveSession === 'PRE') ? ` <span class="sess-badge pre">PRE</span>`
        : (h.liveSession === 'POST') ? ` <span class="sess-badge post">POST</span>`
        : '';
      const chg = (h.dayChangePct !== undefined && h.dayChangePct !== null)
        ? `<div class="day-chg ${h.dayChangePct >= 0 ? 'pos' : 'neg'}">${h.dayChangePct >= 0 ? '+' : ''}${h.dayChangePct.toFixed(2)}%</div>`
        : '';
      liveCell = `<td class="num"><strong>${fmtMoney(h.livePrice)}</strong>${sessBadge}${chg}</td>`;
    } else {
      liveCell = `<td class="num muted">…</td>`;
    }

    html += `<tr><td><strong>${h.ticker}</strong></td>${sharesCol}${liveCell}<td class="num">${fmtMoney(h.value)}</td><td class="num">${pct}%</td><td>${h.name}</td></tr>`;
  }
  if (p.cash > 0) html += `<tr><td>ნაღდი</td><td class="num">—</td><td class="num">—</td><td class="num">${fmtMoney(p.cash)}</td><td class="num">${((p.cash/total)*100).toFixed(1)}%</td><td>რეზერვი</td></tr>`;
  tb.innerHTML = html;
}

// ============================================================
// LIVE PRICE FETCHING
// Primary: Finnhub (real-time, direct CORS) when a key is set.
// Fallback: Yahoo Finance v8 chart API via public CORS proxies.
// Last resort: data/prices.json (committed by the snapshot Action).
// ============================================================

// Finnhub real-time quotes. Free tier = 60 calls/min, direct browser access (CORS).
// Set the key here for ALL devices, OR per-browser via the editor (localStorage
// 'tp_finnhub_key', which overrides this). Empty key → skip Finnhub, use Yahoo.
// Public on purpose (Lasha's free personal key, authorized 2026-06-30). Free tier,
// read-only quotes, 60 calls/min — low risk. Per-browser localStorage still overrides.
const FINNHUB_KEY = 'd91t069r01qsj27o4k8gd91t069r01qsj27o4k90';
function _finnhubKey() {
  try { const k = localStorage.getItem('tp_finnhub_key'); if (k && k.trim()) return k.trim(); } catch (e) {}
  return FINNHUB_KEY || '';
}

// Finnhub /quote → { c:current, d:change, dp:%chg, pc:prevClose, ... }. Direct fetch,
// no proxy needed. Returns null on miss (unknown symbol → c:0) so we fall back to Yahoo.
async function fetchFinnhubQuote(ticker) {
  const key = _finnhubKey();
  if (!key) return null;
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), PROXY_TIMEOUT_MS);
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(key)}`, { cache: 'no-store', signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) return null;            // 401 bad key / 429 rate-limited → fall back to Yahoo
    const d = await r.json();
    if (!d || !d.c) return null;       // c===0 → Finnhub has no data for this symbol
    return { price: d.c, session: 'REG', state: 'REGULAR', regular: d.c, previousClose: (d.pc || d.c) };
  } catch (e) { return null; }
}

const PRICE_PROXIES = [
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(u),
  u => 'https://thingproxy.freeboard.io/fetch/' + u,
];

function _parseYahooMeta(data) {
  const meta = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
  if (!meta || !meta.regularMarketPrice) throw new Error('no meta');
  const state = meta.marketState || 'REGULAR';
  const reg = meta.regularMarketPrice, pre = meta.preMarketPrice, post = meta.postMarketPrice;
  const prev = meta.chartPreviousClose || meta.previousClose || reg;
  let price = reg, session = 'REG';
  if ((state === 'PRE' || state === 'PREPRE') && pre) { price = pre; session = 'PRE'; }
  else if ((state === 'POST' || state === 'POSTPOST') && post) { price = post; session = 'POST'; }
  else if (state === 'CLOSED' && post) { price = post; session = 'POST'; }
  return { price, session, state, regular: reg, pre, post, previousClose: prev };
}

// Hedged proxy race — fire the first proxy immediately, then stagger the rest
// ~1.1s apart and take the first valid response. When a proxy answers quickly
// (the common case) only ONE request is made; slow/dead proxies trigger the next
// wave. This cuts request volume ~3× vs. blasting all proxies every time, which
// is what lets us poll faster without re-flooding the public proxies.
const PROXY_STAGGER_MS = 1100;   // gap before escalating to the next proxy
const PROXY_TIMEOUT_MS = 7000;   // abort a single proxy attempt after this

// Orchestrator: real-time Finnhub first (if a key is set), else the Yahoo proxy race.
async function fetchLiveQuote(ticker) {
  const fh = await fetchFinnhubQuote(ticker);
  if (fh && fh.price) return fh;
  return fetchYahooQuote(ticker);
}

async function fetchYahooQuote(ticker) {
  // Cache-bust the *target* URL (not just the browser fetch): public proxies like
  // allorigins/codetabs cache Yahoo responses server-side, so without a fresh
  // nonce they hand back stale quotes even when we poll. This is the main reason
  // prices looked "late". A unique _ param forces the proxy to refetch Yahoo.
  const nonce = Date.now() + '' + Math.floor(Math.random() * 1000);
  const target = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d&includePrePost=true&_=${nonce}`;

  return new Promise(resolve => {
    let idx = 0, pending = 0, settled = false;
    const controllers = [];
    const finish = v => {
      if (settled) return;
      settled = true;
      controllers.forEach(c => { try { c.abort(); } catch (e) {} });
      resolve(v);
    };
    const tryNext = () => {
      if (settled) return;
      if (idx >= PRICE_PROXIES.length) { if (pending === 0) finish(null); return; }
      const mk = PRICE_PROXIES[idx++];
      pending++;
      const ctrl = new AbortController(); controllers.push(ctrl);
      const to = setTimeout(() => ctrl.abort(), PROXY_TIMEOUT_MS);
      // Hedge: if this proxy is just SLOW (not failed), start the next one in
      // parallel after a short gap so latency stays low. On an outright FAILURE
      // we escalate immediately (in .catch) — no need to wait for the gap.
      const hedge = setTimeout(() => { if (!settled) tryNext(); }, PROXY_STAGGER_MS);
      fetch(mk(target), { cache: 'no-store', signal: ctrl.signal })
        .then(r => { if (!r.ok) throw new Error('bad status ' + r.status); return r.json(); })
        .then(_parseYahooMeta)
        .then(q => { clearTimeout(to); clearTimeout(hedge); pending--; finish(q); })
        .catch(() => { clearTimeout(to); clearTimeout(hedge); pending--; tryNext(); });
    };
    tryNext();
  });
}

async function fetchLivePrice(ticker) {
  const q = await fetchLiveQuote(ticker);
  return q ? q.price : null;
}

// ---- cached snapshot data committed by GitHub Action (scripts/snapshot.js) ----
let _cachedPrices = null;
let _cachedPricesTried = false;
async function loadCachedPrices() {
  if (_cachedPricesTried) return _cachedPrices;
  _cachedPricesTried = true;
  try {
    const base = (location.pathname.indexOf('/articles/') !== -1) ? '../' : '';
    const r = await fetch(base + 'data/prices.json', { cache: 'no-store' });
    if (r.ok) _cachedPrices = await r.json();
  } catch (e) { /* offline / first deploy */ }
  return _cachedPrices;
}

async function loadHistory() {
  try {
    const base = (location.pathname.indexOf('/articles/') !== -1) ? '../' : '';
    const r = await fetch(base + 'data/history.json', { cache: 'no-store' });
    if (r.ok) return await r.json();
  } catch (e) { /* offline / first deploy */ }
  return null;
}

async function refreshLivePrices(portfolioKey) {
  const p = portfolios[portfolioKey];
  const results = await Promise.all(p.holdings.map(h => fetchLiveQuote(h.ticker)));

  // Fallback: any ticker the live fetch missed gets the Action-cached quote
  if (results.some(q => !q || !q.price)) {
    const cached = await loadCachedPrices();
    if (cached && cached.quotes) {
      for (let i = 0; i < p.holdings.length; i++) {
        if ((!results[i] || !results[i].price) && cached.quotes[p.holdings[i].ticker]) {
          const c = cached.quotes[p.holdings[i].ticker];
          results[i] = { price: c.price, session: 'REG', state: 'CACHED', previousClose: c.previousClose };
        }
      }
    }
  }

  let updated = 0;
  for (let i = 0; i < p.holdings.length; i++) {
    const q = results[i];
    if (q && q.price) {
      p.holdings[i].livePrice = q.price;
      p.holdings[i].liveSession = q.session;
      p.holdings[i].liveState = q.state;
      p.holdings[i].previousClose = q.previousClose;
      p.holdings[i].dayChangePct = q.previousClose ? ((q.price - q.previousClose) / q.previousClose) * 100 : 0;
      if (p.holdings[i].shares !== undefined && p.holdings[i].shares > 0) {
        p.holdings[i].value = +(p.holdings[i].shares * q.price).toFixed(2);
      }
      updated++;
    }
  }
  return updated;
}

async function refreshAndRender(portfolioKey, opts = {}) {
  const updated = await refreshLivePrices(portfolioKey);
  if (opts.holdingsId) renderHoldings(opts.holdingsId, portfolioKey);
  if (opts.cardsId) renderHoldingsCards(opts.cardsId, portfolioKey);
  if (opts.bannerId) renderStatBanner(opts.bannerId, portfolioKey);
  if (opts.donutId && typeof Chart !== 'undefined') {
    const canvas = document.getElementById(opts.donutId);
    if (canvas) {
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
      renderDonut(opts.donutId, portfolioKey);
    }
  }
  const stamp = document.getElementById(opts.stampId || `${portfolioKey}-live-stamp`);
  if (stamp) {
    const now = new Date();
    stamp.textContent = `● LIVE · ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  }
  return updated;
}

function renderAllTx(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const c = document.getElementById(containerId);
  if (!c) return;
  if (!p.transactions.length) {
    c.innerHTML = `<div class="empty-state">ჯერ არ არსებობს ტრანზაქცია — დაიწყე აღრიცხვა</div>`;
    return;
  }
  c.innerHTML = p.transactions.map(renderTx).join('');
}

function renderSummary(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const c = document.getElementById(containerId);
  if (!c) return;
  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlSign = a.pnl >= 0 ? '+' : '−';
  const has = a.hasHistory;

  c.innerHTML = `
<div class="summary-grid">
<div class="summary-card"><div class="summary-label">სრული deposit</div><div class="summary-value">${has ? fmtMoney(a.deposits) : '—'}</div></div>
<div class="summary-card"><div class="summary-label">საკომისიო</div><div class="summary-value">${fmtMoney(a.fees)}</div></div>
<div class="summary-card"><div class="summary-label">სრული ნაყიდი</div><div class="summary-value">${fmtMoney(a.bought)}</div></div>
<div class="summary-card"><div class="summary-label">სრული გაყიდული</div><div class="summary-value">${fmtMoney(a.sold)}</div></div>
<div class="summary-card"><div class="summary-label">წმინდა ჩადებული</div><div class="summary-value">${has ? fmtMoney(a.netInvested) : '—'}</div></div>
<div class="summary-card big">
<div class="summary-label">მიმდინარე ღირებულება</div>
<div class="summary-value">${fmtMoney(a.currentValue)}</div>
${has ? `<div class="summary-pnl ${pnlClass}">${pnlSign}${fmtMoney(Math.abs(a.pnl))} (${pnlSign}${Math.abs(a.pnlPct).toFixed(2)}%)</div>` : `<div class="summary-pnl muted">— ცარიელი ისტორია —</div>`}
</div>
</div>
`;
}

function renderChart(canvasId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Deposit', 'ნაყიდი', 'გაყიდული', 'საკომისიო', 'მიმდინარე'],
      datasets: [{
        data: [a.deposits, a.bought, a.sold, a.fees, a.currentValue],
        backgroundColor: ['#166534', '#1f2937', '#b91c1c', '#8b6914', '#2563eb'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + v } }, x: { grid: { display: false } } }
    }
  });
}
