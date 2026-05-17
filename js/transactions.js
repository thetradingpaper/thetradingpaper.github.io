// ============================================================
// The Trading Paper — Transactions Data & Renderer
// ============================================================
//
// HOW TO ADD A NEW TRANSACTION:
// Just add an object to the `transactions` array below.
// Keep dates as 'YYYY-MM-DD'. Sort descending (newest first).
//
// TYPES:
//   deposit:    { date, type:'deposit', amount }
//   buy:        { date, type:'buy', ticker, shares, price, commission }
//   sell:       { date, type:'sell', ticker, shares, price, commission }
//   fee:        { date, type:'fee', amount, note }
// ============================================================

const transactions = [
  // === REPLACE WITH YOUR REAL HISTORY ===
  // Newest first. Examples below match the screenshot total ~$1,078.
  { date: '2026-05-15', type: 'buy',     ticker: 'SMH',  shares: 0.20, price: 250.00, commission: 0.50 },
  { date: '2026-05-10', type: 'deposit', amount: 200 },
  { date: '2026-04-22', type: 'buy',     ticker: 'VOO',  shares: 0.15, price: 540.00, commission: 0.50 },
  { date: '2026-04-15', type: 'buy',     ticker: 'KOID', shares: 5.00, price:  27.00, commission: 0.50 },
  { date: '2026-04-10', type: 'deposit', amount: 200 },
  { date: '2026-03-25', type: 'buy',     ticker: 'ASX',  shares: 2.50, price:  80.00, commission: 0.50 },
  { date: '2026-03-12', type: 'buy',     ticker: 'SMH',  shares: 0.40, price: 230.00, commission: 0.50 },
  { date: '2026-03-10', type: 'deposit', amount: 200 },
  { date: '2026-02-20', type: 'buy',     ticker: 'VOO',  shares: 0.25, price: 510.00, commission: 0.50 },
  { date: '2026-02-15', type: 'sell',    ticker: 'MSTR', shares: 0.10, price: 320.00, commission: 0.50 },
  { date: '2026-02-10', type: 'deposit', amount: 200 },
  { date: '2026-01-15', type: 'buy',     ticker: 'SMH',  shares: 0.50, price: 220.00, commission: 0.50 },
  { date: '2026-01-10', type: 'deposit', amount: 200 },
  { date: '2025-12-20', type: 'buy',     ticker: 'ASX',  shares: 1.00, price:  75.00, commission: 0.50 },
  { date: '2025-12-10', type: 'deposit', amount: 200 },
  { date: '2025-11-15', type: 'buy',     ticker: 'VOO',  shares: 0.20, price: 470.00, commission: 0.50 },
  { date: '2025-11-10', type: 'deposit', amount: 200 },
];

// Current portfolio market value (sync this with your live data)
const currentMarketValue = 1078.26;

// ============================================================
// Helpers
// ============================================================

function fmtMoney(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(s) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function txTotal(tx) {
  if (tx.type === 'deposit') return tx.amount;
  if (tx.type === 'fee')     return tx.amount;
  return tx.shares * tx.price;
}

function txPaid(tx) {
  return tx.shares * tx.price + tx.commission;
}

function txReceived(tx) {
  return tx.shares * tx.price - tx.commission;
}

// ============================================================
// Aggregates (for summary widgets)
// ============================================================

function aggregate(list = transactions) {
  let deposits = 0, bought = 0, sold = 0, fees = 0;
  for (const tx of list) {
    if (tx.type === 'deposit') deposits += tx.amount;
    if (tx.type === 'buy')     { bought += tx.shares * tx.price; fees += tx.commission; }
    if (tx.type === 'sell')    { sold   += tx.shares * tx.price; fees += tx.commission; }
    if (tx.type === 'fee')     fees += tx.amount;
  }
  const netInvested = deposits - fees;
  const pnl = currentMarketValue - netInvested;
  const pnlPct = netInvested > 0 ? (pnl / netInvested) * 100 : 0;
  return { deposits, bought, sold, fees, netInvested, currentValue: currentMarketValue, pnl, pnlPct };
}

// ============================================================
// Renderer (single row)
// ============================================================

function renderTx(tx) {
  const date = `<span class="tx-date">${fmtDate(tx.date)}</span>`;

  if (tx.type === 'deposit') {
    return `<div class="tx tx-deposit">
      ${date}
      <span class="tx-badge badge-deposit">DEPOSIT</span>
      <span class="tx-line"><strong>+${fmtMoney(tx.amount)}</strong> &nbsp;→ ცეშ</span>
    </div>`;
  }

  if (tx.type === 'buy') {
    return `<div class="tx tx-buy">
      ${date}
      <span class="tx-badge badge-buy">BUY</span>
      <span class="tx-line">
        <strong>${tx.ticker}</strong> ·
        ${tx.shares} sh @ ${fmtMoney(tx.price)} ·
        <span class="muted">fee ${fmtMoney(tx.commission)}</span> ·
        paid <strong>${fmtMoney(txPaid(tx))}</strong>
      </span>
    </div>`;
  }

  if (tx.type === 'sell') {
    return `<div class="tx tx-sell">
      ${date}
      <span class="tx-badge badge-sell">SELL</span>
      <span class="tx-line">
        <strong>${tx.ticker}</strong> ·
        ${tx.shares} sh @ ${fmtMoney(tx.price)} ·
        <span class="muted">fee ${fmtMoney(tx.commission)}</span> ·
        received <strong>${fmtMoney(txReceived(tx))}</strong>
      </span>
    </div>`;
  }

  if (tx.type === 'fee') {
    return `<div class="tx tx-fee">
      ${date}
      <span class="tx-badge badge-fee">FEE</span>
      <span class="tx-line">−${fmtMoney(tx.amount)} ${tx.note ? '· ' + tx.note : ''}</span>
    </div>`;
  }

  return '';
}

// ============================================================
// Paginated list (used on portfolio.html — 4 per page)
// ============================================================

function renderPaginated(containerId, paginationId, perPage = 4) {
  const container = document.getElementById(containerId);
  const pager     = document.getElementById(paginationId);
  if (!container) return;

  let page = 1;
  const totalPages = Math.ceil(transactions.length / perPage);

  function draw() {
    const start = (page - 1) * perPage;
    const slice = transactions.slice(start, start + perPage);
    container.innerHTML = slice.map(renderTx).join('');

    if (!pager) return;
    let html = '';
    if (page > 1) html += `<button class="page-link" data-p="${page - 1}">← წინა</button>`;
    for (let p = 1; p <= totalPages; p++) {
      html += p === page
        ? `<span class="page-current">${p}</span>`
        : `<button class="page-link" data-p="${p}">${p}</button>`;
    }
    if (page < totalPages) html += `<button class="page-link" data-p="${page + 1}">შემდეგი →</button>`;
    pager.innerHTML = html;
    pager.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => { page = +b.dataset.p; draw(); });
    });
  }

  draw();
}

// ============================================================
// Full list (used on history.html — no pagination)
// ============================================================

function renderAll(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = transactions.map(renderTx).join('');
}

// ============================================================
// Summary widget (used on history.html)
// ============================================================

function renderSummary(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const a = aggregate();
  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlSign  = a.pnl >= 0 ? '+' : '−';

  container.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">სრული deposit</div>
        <div class="summary-value">${fmtMoney(a.deposits)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">საკომისიო</div>
        <div class="summary-value">${fmtMoney(a.fees)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">სრული ნაყიდი</div>
        <div class="summary-value">${fmtMoney(a.bought)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">სრული გაყიდული</div>
        <div class="summary-value">${fmtMoney(a.sold)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">წმინდა ჩადებული</div>
        <div class="summary-value">${fmtMoney(a.netInvested)}</div>
      </div>
      <div class="summary-card big">
        <div class="summary-label">მიმდინარე ღირებულება</div>
        <div class="summary-value">${fmtMoney(a.currentValue)}</div>
        <div class="summary-pnl ${pnlClass}">${pnlSign}${fmtMoney(Math.abs(a.pnl))} &nbsp;(${pnlSign}${Math.abs(a.pnlPct).toFixed(2)}%)</div>
      </div>
    </div>
  `;
}

// ============================================================
// Chart (used on history.html — Chart.js)
// ============================================================

function renderChart(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;
  const a = aggregate();

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Deposit', 'ნაყიდი', 'გაყიდული', 'საკომისიო', 'მიმდინარე'],
      datasets: [{
        label: 'USD',
        data: [a.deposits, a.bought, a.sold, a.fees, a.currentValue],
        backgroundColor: ['#166534', '#1f2937', '#b91c1c', '#8b6914', '#2563eb'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '$' + v } },
        x: { grid: { display: false } }
      }
    }
  });
}
