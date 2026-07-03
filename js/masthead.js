// ============================================================
// The Trading Paper — Shared Masthead (logo + clocks + nav)
// One source of truth for the header on every page.
// v2: GUEST MODE — set  window.TP_GUEST = true  BEFORE this
// script (public.html does it). Guests get შესვლა/გამოწერა
// buttons in the top bar and nav clicks open the login popup
// (event: 'tp-open-login').
// Include AFTER page content, BEFORE js/clocks.js:
//   <script src="/js/masthead.js"></script>
//   <script src="/js/clocks.js"></script>
// ============================================================
(function () {
  var GUEST = !!window.TP_GUEST;

  var PAGES = [
    { href: '/meportfolio/',   label: 'ბაზარი',        re: /^\/meportfolio/ },
    { href: '/',               label: 'ჩემი კაბინეტი', re: /^\/(index\.html)?$/ },
    { href: '/ledger.html',    label: 'ბიუჯეტი',       re: /^\/ledger/ },
    { href: '/dividends.html', label: 'დივიდენდები',   re: /^\/dividends/ },
    { href: '/edit.html',      label: 'რედაქტირება',   re: /^\/edit/ }
  ];
  var path = location.pathname;
  var isCabinet = !GUEST && /^\/(index\.html)?$/.test(path);

  // ---------- styles (self-contained; works with or without style.css) ----
  var css = ''
    + 'header.tpm{border-bottom:3px double var(--rule,#1a1a1a);margin-bottom:6px;background:transparent;}'
    + '.tpm-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;'
    +   'font-family:"Noto Sans Georgian",sans-serif;font-size:11px;letter-spacing:1px;color:var(--muted,#6b6b6b);'
    +   'border-bottom:1px solid var(--border,#d9d4c8);padding:9px 4px;}'
    + '.tpm-top a{text-decoration:none;border:1px solid var(--rule,#1a1a1a);padding:1px 8px;border-radius:3px;font-size:11px;color:inherit;}'
    + '.tpm-top a.tpm-out{color:#b91c1c;}'
    + '.tpm-top a.tpm-in{color:var(--paper,#fffdf7);background:#1a1a1a;border-color:#1a1a1a;letter-spacing:2px;}'
    + '.tpm-top a.tpm-in:hover{background:#b91c1c;border-color:#b91c1c;}'
    + '.tpm-top a.tpm-sub{color:#b91c1c;border-color:#b91c1c;letter-spacing:2px;}'
    + '.tpm-top a.tpm-sub:hover{background:#b91c1c;color:var(--paper,#fffdf7);}'
    + '.tpm-row{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:12px 4px 8px;}'
    + '.tpm-brand h1{font-family:"Noto Serif Georgian",serif;font-weight:900;font-size:34px;margin:0;line-height:1.05;'
    +   'letter-spacing:-0.5px;color:var(--ink,#1a1a1a);}'
    + '.tpm-brand h1 a{color:inherit;text-decoration:none;}'
    + '.tpm-brand .tpm-tag{font-family:"Noto Sans Georgian",sans-serif;font-size:11px;font-style:italic;'
    +   'color:var(--muted,#6b6b6b);margin:3px 0 0;}'
    + 'nav.tpm-nav{display:flex;justify-content:center;gap:26px;flex-wrap:wrap;border-top:1px solid var(--border,#d9d4c8);'
    +   'padding:11px 0 12px;font-family:"Noto Sans Georgian",sans-serif;font-size:13.5px;}'
    + 'nav.tpm-nav a{color:var(--ink,#1a1a1a);text-decoration:none;padding-bottom:3px;border-bottom:2px solid transparent;}'
    + 'nav.tpm-nav a:hover{border-bottom-color:var(--muted,#6b6b6b);}'
    + 'nav.tpm-nav a.active{border-bottom-color:#b91c1c;font-weight:700;}'
    + 'nav.tpm-nav a .tpm-lock{font-size:10px;opacity:0.55;margin-left:3px;}'
    + '.tpm-pagetitle{text-align:center;font-family:"Noto Sans Georgian",sans-serif;font-size:10.5px;letter-spacing:2.5px;'
    +   'text-transform:uppercase;color:var(--muted,#6b6b6b);padding:9px 0 10px;border-bottom:1px solid var(--border,#d9d4c8);margin-bottom:14px;}'
    + '.tpm-pagetitle b{color:var(--ink,#1a1a1a);letter-spacing:3px;}'
    + '@media(max-width:860px){.tpm-row{justify-content:center;}.tpm-brand{text-align:center;width:100%;}}'
    // sticky bar
    + '#tpm-sticky{position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--paper,#fffdf7);'
    +   'border-bottom:2px solid var(--ink,#1a1a1a);box-shadow:0 2px 10px rgba(0,0,0,0.07);'
    +   'display:flex;align-items:center;gap:20px;padding:7px 20px;transform:translateY(-100%);transition:transform .2s ease;}'
    + '#tpm-sticky.show{transform:translateY(0);}'
    + '#tpm-sticky .b{font-family:"Noto Serif Georgian",serif;font-weight:900;font-size:15px;color:var(--ink,#1a1a1a);white-space:nowrap;text-decoration:none;}'
    + '#tpm-sticky nav{display:flex;gap:16px;flex-wrap:wrap;font-family:"Noto Sans Georgian",sans-serif;font-size:12px;}'
    + '#tpm-sticky nav a{color:var(--ink,#1a1a1a);text-decoration:none;}'
    + '#tpm-sticky nav a.active{color:#b91c1c;font-weight:700;border-bottom:2px solid #b91c1c;}'
    + '#tpm-sticky .tpm-sticky-in{margin-left:auto;font-family:"Noto Sans Georgian",sans-serif;font-size:11px;letter-spacing:2px;'
    +   'background:#1a1a1a;color:var(--paper,#fffdf7);padding:3px 12px;border-radius:3px;text-decoration:none;white-space:nowrap;}'
    + '#tpm-sticky .tpm-sticky-in:hover{background:#b91c1c;}'
    + '.tpm-mini-nav{display:flex;gap:13px;margin-left:16px;font-family:"Noto Sans Georgian",sans-serif;font-size:11.5px;}'
    + '.tpm-mini-nav a{color:var(--ink,#1a1a1a);text-decoration:none;}'
    + '.tpm-mini-nav a.active{color:#b91c1c;font-weight:700;}'
    + '@media print{header.tpm,#tpm-sticky{display:none!important;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ---------- helpers ------------------------------------------------------
  function openLogin(e) {
    if (e) e.preventDefault();
    try { document.dispatchEvent(new CustomEvent('tp-open-login')); } catch (err) { location.href = '/?login=1'; }
  }

  // ---------- nav html ----------------------------------------------------
  function navLinks() {
    return PAGES.map(function (p) {
      var active = (!GUEST && p.re.test(path)) ? ' class="active"' : '';
      var lock = GUEST ? '<span class="tpm-lock">🔒</span>' : '';
      return '<a href="' + p.href + '"' + active + (GUEST ? ' data-tpm-locked="1"' : '') + '>' + p.label + lock + '</a>';
    }).join('');
  }
  function wireLocked(root) {
    if (!GUEST || !root) return;
    root.querySelectorAll('a[data-tpm-locked]').forEach(function (a) {
      a.addEventListener('click', openLogin);
    });
  }

  // ---------- date --------------------------------------------------------
  var MONTHS = ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'];
  var d = new Date();
  var dateStr = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

  // ---------- capture old header's page title (if any) --------------------
  var old = document.querySelector('header.masthead');
  var pageTitle = '', pageTag = '';
  if (old) {
    var oh = old.querySelector('h1');
    var ot = old.querySelector('.tagline');
    if (oh) pageTitle = (oh.textContent || '').trim();
    if (ot) pageTag = (ot.textContent || '').trim();
    if (pageTitle === 'The Trading Paper') { pageTitle = ''; pageTag = ''; }
  }

  // ---------- build header -------------------------------------------------
  var topRight = GUEST
    ? '<span>გამოცემა · ვისბადენი &nbsp;·&nbsp; '
      + '<a href="#packets" class="tpm-sub">გამოწერა</a> '
      + '<a href="#" class="tpm-in" id="tpm-login-btn">შესვლა · SIGN IN</a></span>'
    : '<span>გამოცემა · ვისბადენი &nbsp;·&nbsp; <a href="/tp-logout" class="tpm-out no-print">გასვლა</a></span>';

  var header = document.createElement('header');
  header.className = 'tpm masthead';
  header.innerHTML =
      '<div class="tpm-top top-bar">'
    +   '<span id="today-date">' + dateStr + '</span>'
    +   topRight
    + '</div>'
    + '<div class="tpm-row">'
    +   '<div class="tpm-brand"><h1><a href="' + (GUEST ? '/' : '/meportfolio/') + '">The Trading Paper</a></h1>'
    +   '<p class="tpm-tag tagline">ბაზარი · ცოცხალი მაჩვენებლები · რეიტინგი</p></div>'
    +   '<div id="tp-clocks" class="no-print"></div>'
    + '</div>'
    + '<nav class="tpm-nav">' + navLinks() + '</nav>';

  if (old) old.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);

  wireLocked(header);
  var lb = header.querySelector('#tpm-login-btn');
  if (lb) lb.addEventListener('click', openLogin);

  // page-title strip (preserves e.g. "ყოველთვიური წიგნი" on ledger)
  if (pageTitle) {
    var strip = document.createElement('div');
    strip.className = 'tpm-pagetitle';
    strip.innerHTML = '<b>' + pageTitle + '</b>' + (pageTag ? ' · ' + pageTag : '');
    header.insertAdjacentElement('afterend', strip);
  }

  // ---------- sticky -------------------------------------------------------
  function makeSticky() {
    var bar = document.createElement('div');
    bar.id = 'tpm-sticky';
    bar.innerHTML = '<a class="b" href="' + (GUEST ? '/' : '/meportfolio/') + '">The Trading Paper</a>'
      + '<nav>' + navLinks() + '</nav>'
      + (GUEST ? '<a href="#" class="tpm-sticky-in">შესვლა</a>' : '');
    document.body.appendChild(bar);
    wireLocked(bar);
    var sin = bar.querySelector('.tpm-sticky-in');
    if (sin) sin.addEventListener('click', openLogin);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        bar.classList.toggle('show', !en[0].isIntersecting);
      }, { threshold: 0 });
      io.observe(header);
    } else {
      window.addEventListener('scroll', function () {
        bar.classList.toggle('show', window.scrollY > header.offsetHeight + 40);
      });
    }
  }

  if (isCabinet) {
    // cabinet has enhance.js #tp-mini (brand + live totals) — inject nav into it
    var tries = 0;
    var t = setInterval(function () {
      var mini = document.getElementById('tp-mini');
      tries++;
      if (mini) {
        clearInterval(t);
        var brand = mini.querySelector('.tp-mini-brand');
        if (brand && !mini.querySelector('.tpm-mini-nav')) {
          var nv = document.createElement('span');
          nv.className = 'tpm-mini-nav';
          nv.innerHTML = navLinks();
          brand.insertAdjacentElement('afterend', nv);
        }
      } else if (tries > 15) { clearInterval(t); makeSticky(); }
    }, 250);
  } else {
    makeSticky();
  }
})();
