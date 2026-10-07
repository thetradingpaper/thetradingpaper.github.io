// ============================================================
// The Trading Paper — slim site navigation for pages without the
// big masthead (cabinet, fee/dividend detail pages, issues).
// Adds one thin bar at the very top; touches nothing else.
// ============================================================
(function () {
  'use strict';
  if (document.querySelector('header.tpm') || document.getElementById('tp-sitenav')) return;
  var p = location.pathname;
  var logged = false;
  try { logged = !!JSON.parse(localStorage.getItem('pai.session.v1') || 'null'); } catch (e) {}
  var L = [
    ['/meportfolio/', 'ბაზარი', /^\/meportfolio/],
    ['/cabinet.html', 'ჩემი კაბინეტი', /^\/(cabinet|index\.html|annual-income|dividends|history-bog|commissions|service-fee|learning)|^\/$/],
    ['/ai.html', 'Portfolio AI', /^\/(ai\.html|app\/)/]
  ];
  var css = '#tp-sitenav{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 18px;border-bottom:1px solid var(--rule,#1a1a1a);background:var(--bg,#fffdf7);font-family:"Noto Sans Georgian",sans-serif;font-size:13px;position:relative;z-index:60}' +
    '#tp-sitenav .b{font-family:"Noto Serif Georgian",Georgia,serif;font-weight:900;font-size:15px;text-decoration:none;color:var(--ink,#1a1a1a);margin-right:12px}' +
    '#tp-sitenav a.l{text-decoration:none;color:var(--muted,#6b6b6b);padding:4px 9px;border-bottom:2px solid transparent;font-weight:600}' +
    '#tp-sitenav a.l:hover{color:var(--ink,#1a1a1a)} #tp-sitenav a.l.on{color:var(--ink,#1a1a1a);border-bottom-color:var(--red,#b91c1c)}' +
    '#tp-sitenav .sp{flex:1}' +
    '#tp-sitenav a.u{text-decoration:none;font-weight:700;font-size:12px;color:#fff;background:var(--red,#b91c1c);padding:4px 10px}' +
    '@media print{#tp-sitenav{display:none}} @media (max-width:560px){#tp-sitenav .b{display:none}#tp-sitenav{padding:6px 10px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var bar = document.createElement('nav'); bar.id = 'tp-sitenav'; bar.className = 'no-print'; bar.setAttribute('aria-label', 'საიტის ნავიგაცია');
  bar.innerHTML = '<a class="b" href="/cabinet.html">The Trading Paper</a>' +
    L.map(function (x) { return '<a class="l' + (x[2].test(p) ? ' on' : '') + '" href="' + x[0] + '">' + x[1] + '</a>'; }).join('') +
    '<span class="sp"></span><a class="u" href="' + (logged ? '/app/index.html' : '/app/login.html') + '">' + (logged ? 'ჩემი პორტფელი →' : 'შესვლა') + '</a>';
  document.body.insertBefore(bar, document.body.firstChild);
})();
