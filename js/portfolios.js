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
// CHAPTERS — "a new chapter" resets the scoreboard.
// From `start` on, every book is measured against its market value on
// that day (`baseline`, frozen from data/history.json), plus only the
// money deposited/withdrawn after it. Everything before stays in the
// transaction history and is summarised once as the closed Chapter I.
// To start the next chapter: add a new object with the new start date
// and that day's values from data/history.json.
// ============================================================
const TP_CHAPTER = window.TP_CHAPTER || {
  no: 'II',
  title: 'თავი II',
  start: '2026-10-03',                          // first day of the new chapter
  baseline: { bog: 150.43, tbc: 3006.35, galt: 0 } // book values on 2026-10-03 (data/history.json)
};
window.TP_CHAPTER = TP_CHAPTER;

function tpBookKey(p) {
  for (const k in portfolios) if (portfolios[k] === p) return k;
  return null;
}


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

function aggregate(p, opts) {
  // Chapter mode (default): baseline value + money moved after the chapter start.
  // Lifetime mode ({ lifetime: true }): every deposit since the very first day.
  const ch = (opts && opts.lifetime) ? null : TP_CHAPTER;
  const key = ch ? tpBookKey(p) : null;
  const inCh = !!(ch && key && ch.baseline && ch.baseline[key] != null);
  const before = !!(opts && opts.before);        // lifetime, but only up to the chapter start
  let deposits = inCh ? ch.baseline[key] : (p.priorDeposits || 0);
  let bought = inCh ? ch.baseline[key] : (p.priorCostBasis || 0);
  let sold = 0, fees = 0, withdrawn = 0;
  for (const tx of p.transactions) {
    if (inCh && tx.date < ch.start) continue;
    if (before && TP_CHAPTER && tx.date >= TP_CHAPTER.start) continue;
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
  const hasHistory = inCh || p.transactions.length > 0 || (p.priorDeposits || 0) > 0;
  return { deposits, bought, sold, fees, withdrawn, currentValue, netInvested, pnl, pnlPct, hasHistory, chapter: inCh ? ch : null };
}

// Closed previous chapter: everything deposited before the chapter start vs
// what it was worth on the start day. Returned per book and in total.
function chapterOneSummary() {
  const ch = TP_CHAPTER, out = { books: {}, deposited: 0, endValue: 0, result: 0 };
  if (!ch) return out;
  for (const k of ['bog', 'tbc', 'galt']) {
    const p = portfolios[k]; if (!p) continue;
    const a = aggregate(p, { lifetime: true, before: true });
    const dep = a.deposits - a.withdrawn;
    const end = (ch.baseline && ch.baseline[k]) || 0;
    out.books[k] = { deposited: dep, endValue: end, result: end - dep };
    out.deposited += dep; out.endValue += end;
  }
  out.result = out.endValue - out.deposited;
  out.resultPct = out.deposited > 0 ? out.result / out.deposited * 100 : 0;
  return out;
}
window.chapterOneSummary = chapterOneSummary;

// Rebase data/history.json rows onto the current chapter: keep rows from the
// start date, shift "deposited" so the chapter starts at its baseline.
// If fewer than 2 rows exist yet, add a "now" point from the current data.
function chapterHistory(rows) {
  const ch = TP_CHAPTER;
  const nd = new Date();
  const today = nd.getFullYear() + '-' + String(nd.getMonth() + 1).padStart(2, '0') + '-' + String(nd.getDate()).padStart(2, '0');
  if (!ch || !Array.isArray(rows)) return rows;
  const sorted = rows.slice().sort((a, b) => a.date.localeCompare(b.date));
  const kept = sorted.filter(e => e.date >= ch.start && e.books);
  const first = kept[0];
  const out = kept.map(e => {
    const books = {};
    for (const k in e.books) {
      const base = (ch.baseline && ch.baseline[k] != null) ? ch.baseline[k] : 0;
      const startDep = (first && first.books[k]) ? (+first.books[k].deposited || 0) : 0;
      books[k] = { deposited: +((+e.books[k].deposited || 0) - startDep + base).toFixed(2), value: e.books[k].value };
    }
    return Object.assign({}, e, { books, label: e.date === ch.start ? ch.title : e.label });
  });
  if (!out.length || out[out.length - 1].date < today) {
    if (!out.length) {
      const b0 = {};
      for (const k of ['bog', 'tbc', 'galt']) if (portfolios[k]) b0[k] = { deposited: ch.baseline[k] || 0, value: ch.baseline[k] || 0 };
      out.push({ date: ch.start, label: ch.title, books: b0 });
    }
    if (out.length < 2) {
      const bn = {};
      for (const k of ['bog', 'tbc', 'galt']) {
        const p = portfolios[k]; if (!p) continue;
        const a = aggregate(p);
        bn[k] = { deposited: +(a.deposits - a.withdrawn).toFixed(2), value: +a.currentValue.toFixed(2) };
      }
      out.push({ date: today, label: 'ახლა', books: bn });
    }
  }
  return out;
}
window.chapterHistory = chapterHistory;

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

window.__depDrawerOpen = window.__depDrawerOpen || {};

function toggleBookDeposits(key) {
  const drawer = document.getElementById('dep-drawer-' + key);
  const arrow = document.getElementById('dep-arrow-' + key);
  const btn = document.getElementById('dep-btn-' + key);
  if (!drawer) return;
  const isOpening = drawer.style.display === 'none' || !drawer.style.display;
  drawer.style.display = isOpening ? 'block' : 'none';
  if (arrow) arrow.textContent = isOpening ? '▴' : '▾';
  if (btn) btn.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
  window.__depDrawerOpen[key] = isOpening;
}
window.toggleBookDeposits = toggleBookDeposits;

function getDepositDetailsHtml(portfolioKey) {
  const p = portfolios[portfolioKey];
  if (!p) return '';
  const a = aggregate(p);
  const rows = [];

  const chD = a.chapter;
  if (p.transactions && p.transactions.length) {
    p.transactions.forEach(tx => {
      if (chD && tx.date < chD.start) return;
      if (tx.type === 'deposit') {
        const isXfer = (tx.amount < 0 || /transfer|გადა|გადმ/i.test(tx.note || ''));
        rows.push({
          date: fmtDate(tx.date),
          type: isXfer ? (tx.amount < 0 ? 'TRANSFER OUT' : 'TRANSFER IN') : 'DEPOSIT',
          badgeClass: 'badge-deposit',
          note: tx.note || (isXfer ? 'შიდა გადატანა' : 'ჩარიცხვა → CASH'),
          amount: Math.abs(tx.amount),
          isPositive: tx.amount >= 0
        });
      } else if (tx.type === 'withdraw') {
        rows.push({
          date: fmtDate(tx.date),
          type: 'WITHDRAW',
          badgeClass: 'badge-sell',
          note: tx.note || 'CASH → გატანა',
          amount: Math.abs(tx.amount),
          isPositive: false
        });
      }
    });
  }

  if (chD) {
    rows.push({
      date: fmtDate(chD.start),
      type: 'START',
      badgeClass: 'badge-deposit',
      note: chD.title + ' · საწყისი ღირებულება (წინა თავი დახურულია)',
      amount: chD.baseline[portfolioKey] || 0,
      isPositive: true
    });
  } else if (p.priorDeposits && p.priorDeposits > 0) {
    rows.push({
      date: 'ISS 01 → 07',
      type: 'INITIAL',
      badgeClass: 'badge-deposit',
      note: 'წინა გამოშვებების ჯამური დეპოზიტები',
      amount: p.priorDeposits,
      isPositive: true
    });
  }

  let rowsHtml = '';
  if (rows.length === 0) {
    rowsHtml = `<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--muted);">ჩარიცხვების ჩანაწერი არ მოიძებნა</td></tr>`;
  } else {
    rowsHtml = rows.map(r => `
      <tr style="border-bottom:1px solid var(--border,#e5e7eb);">
        <td style="padding:6px 8px;color:var(--muted);white-space:nowrap;">${r.date}</td>
        <td style="padding:6px 8px;"><span class="tx-badge ${r.badgeClass}" style="font-size:9px;padding:2px 6px;">${r.type}</span></td>
        <td style="padding:6px 8px;color:var(--ink);">${r.note}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:700;color:${r.isPositive ? 'var(--green,#166534)' : 'var(--red,#b91c1c)'};white-space:nowrap;">
          ${r.isPositive ? '+' : '−'}${fmtMoney(r.amount)}
        </td>
      </tr>
    `).join('');
  }

  return `
    <div style="max-width:100%;overflow-x:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border,#d9d4c8);">
        <span style="font-family:'Noto Sans Georgian',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink);">
          ჩარიცხვის ისტორია & დეტალები · Deposits
        </span>
        <a href="history-bog.html" class="no-print" style="font-family:'Noto Sans Georgian',sans-serif;font-size:10.5px;color:var(--red);text-decoration:none;font-weight:700;">
          სრული ისტორია ↗
        </a>
      </div>
      <table style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:11px;">
        <thead>
          <tr style="text-align:left;color:var(--muted);font-size:9.5px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid var(--border);">
            <th style="padding:4px 8px;">თარიღი</th>
            <th style="padding:4px 8px;">ტიპი</th>
            <th style="padding:4px 8px;">დანიშნულება</th>
            <th style="padding:4px 8px;text-align:right;">თანხა</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="border-top:1px solid var(--border);font-weight:700;">
            <td colspan="3" style="padding:8px 8px;color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:1px;">
              სრული ჩარიცხული (წმინდა ინვესტირებული)
            </td>
            <td style="padding:8px 8px;text-align:right;font-size:12px;color:var(--ink);">
              ${fmtMoney(a.netInvested)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}
window.getDepositDetailsHtml = getDepositDetailsHtml;

function getGaltDepositDetailsHtml(g) {
  var dep = +g.deposit || 0;
  var wd = +g.withdrawnToBOG || 0;
  var net = dep - wd;
  return `
    <div style="max-width:100%;overflow-x:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border,#d9d4c8);">
        <span style="font-family:'Noto Sans Georgian',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink);">
          GALT ჩარიცხვის ისტორია & დეტალები
        </span>
        <a href="history-bog.html" class="no-print" style="font-family:'Noto Sans Georgian',sans-serif;font-size:10.5px;color:var(--red);text-decoration:none;font-weight:700;">
          სრული ისტორია ↗
        </a>
      </div>
      <table style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:11px;">
        <thead>
          <tr style="text-align:left;color:var(--muted);font-size:9.5px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid var(--border);">
            <th style="padding:4px 8px;">თარიღი</th>
            <th style="padding:4px 8px;">ტიპი</th>
            <th style="padding:4px 8px;">დანიშნულება</th>
            <th style="padding:4px 8px;text-align:right;">თანხა</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid var(--border,#e5e7eb);">
            <td style="padding:6px 8px;color:var(--muted);white-space:nowrap;">29 მაი 2026</td>
            <td style="padding:6px 8px;"><span class="tx-badge badge-deposit" style="font-size:9px;padding:2px 6px;">DEPOSIT</span></td>
            <td style="padding:6px 8px;color:var(--ink);">საწყისი ჩარიცხვა GALT &amp; Taggart-ში</td>
            <td style="padding:6px 8px;text-align:right;font-weight:700;color:var(--green,#166534);white-space:nowrap;">+${M(dep)}</td>
          </tr>
          <tr style="border-bottom:1px solid var(--border,#e5e7eb);">
            <td style="padding:6px 8px;color:var(--muted);white-space:nowrap;">09 ივლ 2026</td>
            <td style="padding:6px 8px;"><span class="tx-badge badge-sell" style="font-size:9px;padding:2px 6px;">TRANSFER</span></td>
            <td style="padding:6px 8px;color:var(--ink);">დახურვის შემდეგ დარჩენილი თანხის გატანა → BOG</td>
            <td style="padding:6px 8px;text-align:right;font-weight:700;color:var(--red,#b91c1c);white-space:nowrap;">−${M(wd)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top:1px solid var(--border);font-weight:700;">
            <td colspan="3" style="padding:8px 8px;color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:1px;">
              სრული ჩარიცხული: ${M(dep)} · წმინდა დახარჯული:
            </td>
            <td style="padding:8px 8px;text-align:right;font-size:12px;color:var(--ink);">
              ${M(net)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}
window.getGaltDepositDetailsHtml = getGaltDepositDetailsHtml;

function renderStatBanner(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const a = aggregate(p);
  const el = document.getElementById(containerId);
  if (!el) return;

  const pnlClass = a.pnl >= 0 ? 'pos' : 'neg';
  const pnlStr = a.hasHistory ? fmtMoney(a.pnl) : '—';
  const pctStr = a.hasHistory ? fmtPct(a.pnlPct) : '—';
  const depStr = a.hasHistory ? fmtMoney(a.netInvested) : '—';

  // Annual dividend — sum across holdings that have a divYield, then net after 30% GE withholding.
  // Only show the cell when at least one holding actually pays a dividend.
  // BOG holds temporary/active trading stocks; dividends are excluded for BOG per user request.
  let divGross = 0;
  let divNet = 0;
  let anyYield = false;

  if (portfolioKey === 'tbc') {
    if (window.TP_DIVIDENDS && typeof window.TP_DIVIDENDS.getSummary === 'function') {
      const s = window.TP_DIVIDENDS.getSummary();
      divGross = s.annualGross || 0;
      divNet = s.annualNet || 0;
      anyYield = divGross > 0;
    } else {
      for (const h of p.holdings) {
        if (typeof h.divYield === 'number' && h.divYield > 0) {
          divGross += h.value * (h.divYield / 100);
          anyYield = true;
        }
      }
      divNet = divGross * 0.70;
    }
  } else if (portfolioKey !== 'bog') {
    for (const h of p.holdings) {
      if (typeof h.divYield === 'number' && h.divYield > 0) {
        divGross += h.value * (h.divYield / 100);
        anyYield = true;
      }
    }
    divNet = divGross * 0.70;
  }
  const portYieldPct = a.currentValue > 0 ? (divGross / a.currentValue) * 100 : 0;

  const divCell = anyYield ? `
<div class="stat-cell">
<div class="stat-label">წლიური დივიდენდი (წმინდა)</div>
<div class="stat-val pos">${fmtMoney(divNet)}<span class="stat-sub">≈ ${portYieldPct.toFixed(2)}% / წელი · 30% GE გადასახადის შემდეგ</span></div>
</div>` : '';

  let divReceived = 0;
  if (portfolioKey !== 'bog') {
    for (const tx of p.transactions) { if (tx.type === 'dividend') divReceived += (tx.amount || 0); }
  }
  const recvCell = divReceived > 0 ? `
<div class="stat-cell">
<div class="stat-label">სულ მიღებული დივიდენდი <a href="dividends.html" style="text-decoration:none;color:#b91c1c;font-weight:800" title="დივიდენდების ისტორია">↗</a></div>
<div class="stat-val pos">${fmtMoney(divReceived)}<span class="stat-sub">წმინდა · მიღებული</span></div>
</div>` : '';

  const wdCell = '';

  // Commissions already paid on this book — from the transaction log.
  // Always shown, pinned to the LAST grid column, separated by its own rules.
  let commPaid = 0, commCount = 0;
  for (const tx of p.transactions) {
    const c = +tx.commission || 0;
    if (c > 0) { commPaid += c; commCount++; }
  }
  const commCell = `
<div class="stat-cell" style="grid-column:-2/-1;border-left:1px solid var(--border,#d9d4c8);border-top:1px solid var(--border,#d9d4c8);padding-top:10px;">
<div class="stat-label">გადახდილი საკომისიო <a href="commissions.html" class="no-print" style="text-decoration:none;color:#b91c1c;font-weight:800" title="საკომისიოების ჟურნალი">↗</a></div>
<div class="stat-val ${commPaid > 0 ? 'neg' : ''}">${commPaid > 0 ? '−' : ''}${fmtMoney(commPaid)}<span class="stat-sub">${commCount} საკომისიო · Commissions</span></div>
</div>`;

  // Day change calculation
  let dayDollar = 0, prevVal = 0, havePrev = false;
  if (p.holdings) {
    for (const h of p.holdings) {
      if (h.previousClose && h.shares !== undefined) {
        const price = h.livePrice || (h.shares ? h.value / h.shares : 0);
        prevVal += h.shares * h.previousClose;
        dayDollar += (price - h.previousClose) * h.shares;
        havePrev = true;
      }
    }
  }
  const dayPct = (havePrev && prevVal > 0) ? (dayDollar / prevVal * 100) : 0;
  const dayCls = dayDollar >= 0 ? 'pos' : 'neg';
  const daySign = dayDollar >= 0 ? '+' : '−';
  const dayStr = havePrev ? `${daySign}${fmtMoney(Math.abs(dayDollar))}` : '—';
  const dayPctStr = havePrev ? `${daySign}${Math.abs(dayPct).toFixed(2)}%` : '';

  const dayCell = `
<div class="stat-cell">
<div class="stat-label">დღიური ცვლილება</div>
<div class="stat-val ${dayCls}">${dayStr}${dayPctStr ? `<span class="stat-sub" style="color:inherit;font-weight:700;">${dayPctStr} (1D)</span>` : ''}</div>
</div>`;

  const gridClass = 'stat-grid with-div';

  const isDrawerOpen = !!(window.__depDrawerOpen && window.__depDrawerOpen[portfolioKey]);
  const drawerDisplay = isDrawerOpen ? 'block' : 'none';
  const drawerArrow = isDrawerOpen ? '▴' : '▾';
  const drawerDetailsHtml = getDepositDetailsHtml(portfolioKey);

  el.innerHTML = `
<div class="stat-banner">
<div class="stat-banner-head">
<span class="stat-name">${p.name} · ${p.fullName.toUpperCase()}</span>
<span class="stat-tag">${p.tagline}</span>
</div>
<div class="${gridClass}">
<div class="stat-cell">
<div class="stat-label">პორტფელის ღირებულება</div>
<div class="stat-val">${fmtMoney(a.currentValue)}</div>
</div>
${dayCell}
<div class="stat-cell">
<div class="stat-label">წმინდა P/L</div>
<div class="stat-val ${pnlClass}">${pnlStr}</div>
</div>
<div class="stat-cell">
<div class="stat-label">უკუგება</div>
<div class="stat-val ${pnlClass}">${pctStr}</div>
</div>${wdCell}${divCell}${recvCell}${commCell}
</div>
<div class="stat-foot" style="flex-wrap:wrap;gap:10px;">
<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
<span>თვალყურის დევნება დაიწყო: ${fmtDate(p.startDate)}</span>
<span style="opacity:0.35;">·</span>
<span style="display:inline-flex;align-items:center;gap:6px;">
<span style="color:var(--muted);">ჩარიცხული:</span>
<strong style="color:var(--ink);font-family:ui-monospace,monospace;font-size:12px;">${depStr}</strong>
<button type="button" class="dep-toggle-btn" onclick="toggleBookDeposits('${portfolioKey}')" id="dep-btn-${portfolioKey}" aria-expanded="${isDrawerOpen ? 'true' : 'false'}" title="ჩარიცხვის დეტალები">
ჩარიცხვის დეტალები <span id="dep-arrow-${portfolioKey}">${drawerArrow}</span>
</button>
</span>
</div>
<div>
<span class="live-dot">● LIVE</span>
</div>
</div>
<div id="dep-drawer-${portfolioKey}" class="dep-drawer" style="display:${drawerDisplay};">
${drawerDetailsHtml}
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
const ASSET_META_PORTFOLIOS = {
  VOO:  { sector: 'S&P 500 Index ETF', desc: 'აშშ-ის 500 უმსხვილესი კორპორაცია · საბაზრო საძირკველი', icon: '🏛️' },
  MAIN: { sector: 'BDC · Private Credit', desc: 'ამერიკის საშუალო ბიზნესის დაკრედიტება · თვიური დივიდენდი', icon: '🏢' },
  BXSL: { sector: 'Senior Secured Loans', desc: 'Blackstone-ის პირველი რიგის უზრუნველყოფილი სესხები (12.9% yield)', icon: '🛡️' },
  LYG:  { sector: 'UK Banking Group', desc: 'დიდი ბრიტანეთის წამყვანი რითეილ ბანკი · Deep Value', icon: '🏦' },
  KO:   { sector: 'Consumer Monopoly', desc: 'Coca-Cola · 62-წლიანი დივიდენდური არისტოკრატი (Dividend King)', icon: '🥤' },
  O:    { sector: 'Commercial REIT', desc: 'The Monthly Dividend Co. · 15,400+ კომერციული ობიექტი', icon: '🏬' },
  DIVO: { sector: 'Covered Call ETF', desc: 'დივიდენდური ლურჯი ჩიპები + ტაქტიკური დაფარული ოფციონები', icon: '📈' },
  QQQI: { sector: 'Nasdaq-100 Income', desc: 'Nasdaq ზრდა + ყოველთვიური ოფციონური ფულადი ნაკადი (13.7%)', icon: '⚡' },
  ARCC: { sector: 'Direct Lending BDC', desc: 'აშშ-ის უდიდესი საჯარო BDC · $22B+ დივერსიფიცირებული პორტფელი', icon: '💼' },
  MRVL: { sector: 'AI Optics & Silicon', desc: 'AI მონაცემთა ცენტრების ოპტიკური ჩიპები & ASIC პროცესორები', icon: '🔬' },
  SNDK: { sector: 'NAND & Flash Storage', desc: 'Enterprise SSD დისკები და ფლეშ-მეხსიერების სუპერციკლი', icon: '💾' },
  VRT:  { sector: 'Liquid Cooling Systems', desc: 'AI კლასტერების თხევადი გაგრილების გლობალური მონოპოლისტი', icon: '❄️' },
  BE:   { sector: 'Clean Energy & SOFC', desc: 'On-Site მყაროქსიდიანი გენერაცია AI სერვერებისთვის ქსელის გარეშე', icon: '🔋' }
};

// Newspaper-style card grid for holdings — modern illustrated cards
function renderHoldingsCards(containerId, portfolioKey) {
  const p = portfolios[portfolioKey];
  const c = document.getElementById(containerId);
  if (!c) return;
  let html = '';
  const totalVal = p.holdings.reduce((s, h) => s + (h.value || 0), 0) + (p.cash || 0);

  for (const h of p.holdings) {
    const meta = ASSET_META_PORTFOLIOS[h.ticker] || { sector: 'Stock', desc: h.name || h.ticker, icon: '📌' };
    const price = h.livePrice || h.avgBuy || 0;
    const value = (h.shares !== undefined && price)
      ? +(h.shares * price).toFixed(2)
      : h.value;
    const invested = h.invested || 0;
    const unreal = value - invested;
    const unrealPct = invested > 0 ? (unreal / invested) * 100 : 0;
    const dayPct = h.dayChangePct;
    const hasDay = (dayPct !== undefined && dayPct !== null && h.previousClose && h.shares !== undefined);
    const dayDollar = hasDay ? +((price - h.previousClose) * h.shares).toFixed(2) : null;

    const sess = (h.liveSession === 'PRE') ? '<span class="sess-badge pre">PRE</span>'
      : (h.liveSession === 'POST') ? '<span class="sess-badge post">POST</span>'
      : (price && h.livePrice) ? '<span class="sess-badge" style="background:rgba(22,101,52,0.12);color:var(--green)">LIVE</span>' : '';

    const unrealClass = unreal >= 0 ? 'pos' : 'neg';
    const dayClass = (dayPct >= 0) ? 'pos' : 'neg';
    const sharesStr = (+h.shares).toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
    const weightPct = totalVal > 0 ? (value / totalVal * 100) : 0;

    let divBanner = '';
    if (portfolioKey === 'tbc') {
      const dMeta = (window.TP_DIVIDENDS && window.TP_DIVIDENDS.DIV_META) ? window.TP_DIVIDENDS.DIV_META[h.ticker] : null;
      let annualGross = 0;
      let freqLabel = '';
      if (dMeta && dMeta.estDivPerShare) {
        const freqMult = (dMeta.freq === 'monthly') ? 12 : (dMeta.freq === 'semi-annual') ? 2 : 4;
        annualGross = h.shares * dMeta.estDivPerShare * freqMult;
        if (dMeta.supplementalPerShare && dMeta.supplementalMonths) {
          annualGross += h.shares * dMeta.supplementalPerShare * dMeta.supplementalMonths.length;
        }
        freqLabel = (dMeta.freq === 'monthly') ? 'ყოველთვიური (Monthly)' : (dMeta.freq === 'semi-annual') ? 'ნახევარწლიური' : 'კვარტალური (Quarterly)';
      } else if (h.divYield > 0) {
        annualGross = value * (h.divYield / 100);
        freqLabel = 'რეგულარული დივიდენდი';
      }
      if (annualGross > 0) {
        const annualNet = annualGross * 0.70;
        const yld = h.divYield ? (h.divYield.toFixed(2) + '%') : (value > 0 ? (annualGross / value * 100).toFixed(2) + '%' : '—');
        divBanner = `
<div class="hc-div-banner">
  <div class="hc-div-title">💰 დივიდენდი · ${yld} Yield</div>
  <div class="hc-div-stats">
    <span class="hc-div-item">წლიური: <strong>${fmtMoney(annualGross)} gross</strong></span>
    <span class="hc-div-item">წმინდა: <strong style="color:var(--green)">+${fmtMoney(annualNet)} net</strong></span>
    <span class="hc-div-item">გრაფიკი: <strong>${freqLabel}</strong></span>
  </div>
</div>`;
      }
    }

    const brandColor = h.color || '#1a1a1a';
    const dayStr = hasDay ? `${dayPct >= 0 ? '+' : '−'}${Math.abs(dayPct).toFixed(2)}% (${dayDollar >= 0 ? '+' : '−'}${fmtMoney(Math.abs(dayDollar))})` : '—';

    html += `
<div class="hcard-v2" style="border-top: 3px solid ${brandColor};">
  <div class="hc-head">
    <div class="hc-identity">
      <span class="hc-icon">${meta.icon}</span>
      <div>
        <div class="hc-title-row">
          <span class="hc-ticker" style="background:${brandColor};">${h.ticker}</span>
          <span class="hc-name">${h.name || h.ticker}</span>
          <span class="hc-book-tag ${portfolioKey}">${portfolioKey.toUpperCase()} · ${portfolioKey === 'tbc' ? 'დივიდენდი' : 'ტექ-ზრდა'}</span>
        </div>
        <div class="hc-desc">${meta.sector} — ${meta.desc}</div>
      </div>
    </div>
    <div class="hc-links">
      <a href="https://www.tradingview.com/symbols/${h.ticker}/" target="_blank" rel="noopener" class="hc-link-btn">📊 TradingView ↗</a>
    </div>
  </div>
  <div class="hc-grid">
    <div class="hc-tile">
      <div class="hc-label">საბაზრო ღირებულება · Value</div>
      <div class="hc-val">${fmtMoney(value)}</div>
      <div class="hc-sub">ჩადებული: ${fmtMoney(invested)} <span class="hc-dot">·</span> Avg: $${h.avgBuy.toFixed(2)}</div>
    </div>
    <div class="hc-tile">
      <div class="hc-label">მიმდინარე ფასი · Live Price ${sess}</div>
      <div class="hc-val">$${price.toFixed(2)}</div>
      <div class="hc-sub ${hasDay ? dayClass : ''}">${dayStr} (1D)</div>
    </div>
    <div class="hc-tile ${unrealClass}-bg">
      <div class="hc-label">წმინდა P/L · Total Return</div>
      <div class="hc-val ${unrealClass}">${unreal >= 0 ? '+' : '−'}${fmtMoney(Math.abs(unreal))}</div>
      <div class="hc-sub ${unrealClass}">${unreal >= 0 ? '+' : '−'}${Math.abs(unrealPct).toFixed(2)}% მთლიანი უკუგება</div>
    </div>
    <div class="hc-tile">
      <div class="hc-label">წილები &amp; წილი წიგნში</div>
      <div class="hc-val">${sharesStr} <span style="font-size:11px;font-weight:600;color:var(--muted)">sh</span></div>
      <div class="hc-sub">${weightPct > 0 ? (weightPct.toFixed(1) + '% ' + portfolioKey.toUpperCase() + '-ში') : 'პოზიციის წილი'}</div>
    </div>
  </div>
  ${divBanner}
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
  
  const extPrice = (post || pre || null);
  const extDiff = (extPrice && reg) ? (extPrice - reg) : 0;
  const extPct = (extPrice && reg && reg > 0) ? ((extPrice - reg) / reg * 100) : 0;

  return { price, session, state, regular: reg, pre, post, previousClose: prev, extPrice, extDiff, extPct };
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
    if (r.ok) return chapterHistory(await r.json());
  } catch (e) { /* offline / first deploy */ }
  return TP_CHAPTER ? chapterHistory([]) : null;
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
      p.holdings[i].regularPrice = q.regular || q.price;
      p.holdings[i].prePrice = q.pre || null;
      p.holdings[i].postPrice = q.post || null;
      p.holdings[i].extPrice = q.extPrice || q.post || q.pre || null;
      p.holdings[i].extDiff = q.extDiff || 0;
      p.holdings[i].extPct = q.extPct || 0;
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
