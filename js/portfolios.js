// ============================================================
// The Trading Paper — Portfolios & Transactions Data
// ============================================================
//
// Two portfolios, each with own history & rules:
//  - BOG (Bank of Georgia) — long-term DCA, $100-200/month, goal 35%/yr
//  - TBC — active single-stock trading, full balance, goal 150%/yr
//
// To add a new transaction, push to the portfolio.transactions array.
// Sort transactions descending (newest first) for display.
// ============================================================

const portfolios = {

  // -----------------------------------------------------------
  // BOG — Bank of Georgia (long-term)
  // -----------------------------------------------------------
  bog: {
    name: 'BOG',
    fullName: 'Bank of Georgia',
    tagline: 'გრძელვადიანი DCA · $100-200/თვე · მიზანი 35%/წელი',
    startDate: '2026-05-17',          // tracking starts today, no past history
    annualGoalPct: 35,
    holdings: [
      // Current snapshot — auto-updated via TradingView widgets shown alongside
      { ticker: 'SMH',  name: 'VanEck Semiconductors ETF',   value: 443.88, color: '#b91c1c' },
      { ticker: 'VOO',  name: 'Vanguard S&P 500 ETF',        value: 297.65, color: '#166534' },
      { ticker: 'ASX',  name: 'ASE Industrial Holding',      value: 201.57, color: '#8b6914' },
      { ticker: 'KOID', name: 'Robotics & Automation ETF',   value: 135.17, color: '#4b5563' },
    ],
    cash: 0,
    priorDeposits: 907.76,    // carried over from prior tracking (before 2026-05-17)
    priorCostBasis: 907.76,
    transactions: [
      // No detailed transactions yet — starts fresh from 2026-05-17
    ],
  },

  // -----------------------------------------------------------
  // TBC — Active trading (single company)
  // -----------------------------------------------------------
  tbc: {
    name: 'TBC',
    fullName: 'TBC Capital',
    tagline: 'აქტიური ვაჭრობა · ერთი კომპანია · მიზანი 150%/წელი',
    startDate: '2026-05-12',
    annualGoalPct: 150,
    holdings: [
      { ticker: 'MSTR', name: 'Strategy Inc', shares: 2.04739861, value: 363.25, color: '#1a1a1a' },
    ],
    cash: 0,
    transactions: [
      { date: '2026-05-15', type: 'buy',     ticker: 'MSTR', shares: 0.63346818, price: 176.21, commission: 0 },
      { date: '2026-05-15', type: 'deposit', amount: 111.61 },
      { date: '2026-05-12', type: 'buy',     ticker: 'MSTR', shares: 1.41393043, price: 190.06, commission: 0 },
      { date: '2026-05-12', type: 'deposit', amount: 268.75 },
    ],
  },

};

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

function txPaid(tx)     { return tx.shares * tx.price + (tx.commission || 0); }
function txReceived(tx) { return tx.shares * tx.price - (tx.commission || 0); }

function aggregate(p) {
  let deposits = (p.priorDeposits || 0);
  let bought   = (p.priorCostBasis || 0);
  let sold = 0, fees = 0;
  for (const tx of p.transactions) {
    if (tx.type === 'deposit') deposits += tx.amount;
    if (tx.type === 'buy')     { bought += tx.shares * tx.price; fees += (tx.commission || 0); }
    if (tx.type === 'sell')    { sold   += tx.shares * tx.price; fees += (tx.commission || 0); }
    if (tx.type === 'fee')     fees += tx.amount;
  }
  const currentValue = p.holdings.reduce((s,h) => s + h.value, 0) + p.cash;
  const netInvested  = deposits - fees;
  const pnl          = currentValue - netInvested;
  const pnlPct       = netInvested > 0 ? (pnl / netInvested) * 100 : 0;
  const hasHistory   = p.transactions.length > 0 || (p.priorDeposits || 0) > 0;
  return { deposits, bought, sold, fees, currentValue, netInvested, pnl, pnlPct, hasHistory };
}

// ============================================================
// Renderers
// ============================================================

function renderTx(tx) {
  const date = `<span class="tx-date">${fmtDate(tx.date)}</span>`;

  if (tx.type === 'deposit') return `<div class="tx tx-deposit">
    ${date}
    <span class="tx-badge badge-deposit">DEPOSIT</span>
    <span class="tx-line"><strong>+${fmtMoney(tx.amount)}</strong> &nbsp;→ CASH</span>
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

  if (tx.type === 'fee') return `<div class="tx tx-fee">
    ${date}
    <span class="tx-badge badge-fee">FEE</span>
    <span class="tx-line">−${fmtMoney(tx.amount)} ${tx.note ? '· ' + tx.note : ''}</span>
  </div>`;

  return '';
}

// Stat banner at top of each portfolio section
function renderStatBanner(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const el = document.getElementById(containerId);
  if (!el) return;

  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlStr = a.hasHistory ? fmtMoney(a.pnl) : '—';
  const pctStr = a.hasHistory ? fmtPct(a.pnlPct) : '—';
  const depStr = a.hasHistory ? fmtMoney(a.deposits) : '—';

  el.innerHTML = `
    <div class="stat-banner">
      <div class="stat-banner-head">
        <span class="stat-name">${p.name} · ${p.fullName.toUpperCase()}</span>
        <span class="stat-tag">${p.tagline}</span>
      </div>
      <div class="stat-grid">
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
        </div>
      </div>
      <div class="stat-foot">
        <span>თვალყურის დევნება დაიწყო: ${fmtDate(p.startDate)}</span>
        <span class="live-dot">● LIVE</span>
      </div>
    </div>
  `;
}

// Donut chart of holdings allocation
function renderDonut(canvasId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = p.holdings.map(h => h.ticker);
  const data   = p.holdings.map(h => h.value);
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

// Paginated tx list (4 per page) - for portfolio.html sections
function renderPaginated(listId, pagerId, portfolioKey, perPage = 4) {
  const p = portfolios[portfolioKey];
  const list  = document.getElementById(listId);
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

// Holdings table for a portfolio
function renderHoldings(tableBodyId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const tb = document.getElementById(tableBodyId);
  if (!tb) return;
  const total = p.holdings.reduce((s, h) => s + h.value, 0) + p.cash;
  let html = '';
  for (const h of p.holdings) {
    const pct = ((h.value / total) * 100).toFixed(1);
    const sharesCol = h.shares !== undefined ? `<td class="num">${h.shares}</td>` : '<td>—</td>';
    html += `<tr><td><strong>${h.ticker}</strong></td>${sharesCol}<td class="num">${fmtMoney(h.value)}</td><td class="num">${pct}%</td><td>${h.name}</td></tr>`;
  }
  if (p.cash > 0) html += `<tr><td>ნაღდი</td><td>—</td><td class="num">${fmtMoney(p.cash)}</td><td class="num">${((p.cash/total)*100).toFixed(1)}%</td><td>რეზერვი</td></tr>`;
  tb.innerHTML = html;
}

// Full tx list (used on history pages, no pagination)
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

// Summary for history page
function renderSummary(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const c = document.getElementById(containerId);
  if (!c) return;
  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlSign  = a.pnl >= 0 ? '+' : '−';
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

// Bar chart for history page
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
