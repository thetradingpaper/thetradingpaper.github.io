// ============================================================
// The Trading Paper — Shared Masthead (logo + clocks + nav)
// One source of truth for the header on every page.
// Include AFTER page content, BEFORE js/clocks.js:
//   <script src="/js/masthead.js"></script>
//   <script src="/js/clocks.js"></script>
//
// TWO nav systems, working together (see change spec §1):
//   TABS  = primary horizontal tabs (feel like the main navigation)
//   MENU  = secondary "კაბინეტი ▾" dropdown (cabinet tools)
// Watchlist removed everywhere (see §9). To retarget a tab, edit
// the TABS / MENU arrays below — it updates every page at once.
// ============================================================
(function () {
  // ---- PRIMARY horizontal tabs -------------------------------------------
  // My Cabinet · Market Notes · Analysis · Journal
  var TABS = [
    { href: '/',                   label: 'ჩემი კაბინეტი',   re: /^\/(index\.html)?$/ },
    { href: '/notes.html',         label: 'ბაზრის ჩანაწერი', re: /^\/notes/ },
    { href: '/meportfolio/',       label: 'ანალიზი',         re: /^\/meportfolio/ },
    { href: '/journal.html',       label: 'ჟურნალი',         re: /^\/journal/ }
  ];

  // ---- SECONDARY dropdown menu (cabinet tools) ---------------------------
  var MENU = [
    { href: '/goals.html',     label: 'მიზნები' },
    { href: '/notes.html',     label: 'ჩემი ჩანაწერები' },
    { href: '/ledger.html',    label: 'ბიუჯეტი' },
    { href: '/dividends.html', label: 'დივიდენდები' },
    { href: '/edit.html',      label: 'რედაქტირება' }
  ];

  var path = location.pathname;
  var isCabinet = /^\/(index\.html)?$/.test(path);

  // ---------- styles (self-contained; works with or without style.css) ----
  var css = ''
    + 'header.tpm{border-bottom:3px double var(--rule,#1a1a1a);margin-bottom:6px;background:transparent;}'
    + '.tpm-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;'
    +   'font-family:"Noto Sans Georgian",sans-serif;font-size:11px;letter-spacing:1px;color:var(--muted,#6b6b6b);'
    +   'border-bottom:1px solid var(--border,#d9d4c8);padding:9px 4px;}'
    + '.tpm-top a{text-decoration:none;border:1px solid var(--rule,#1a1a1a);padding:1px 8px;border-radius:3px;font-size:11px;color:inherit;}'
    + '.tpm-top a.tpm-out{color:#b91c1c;}'
    + '.tpm-row{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:12px 4px 8px;}'
    + '.tpm-brand h1{font-family:"Noto Serif Georgian",serif;font-weight:900;font-size:34px;margin:0;line-height:1.05;'
    +   'letter-spacing:-0.5px;color:var(--ink,#1a1a1a);}'
    + '.tpm-brand h1 a{color:inherit;text-decoration:none;}'
    + '.tpm-brand .tpm-tag{font-family:"Noto Sans Georgian",sans-serif;font-size:11px;font-style:italic;'
    +   'color:var(--muted,#6b6b6b);margin:3px 0 0;}'
    // primary tab row
    + 'nav.tpm-nav{display:flex;justify-content:center;align-items:center;gap:26px;flex-wrap:wrap;border-top:1px solid var(--border,#d9d4c8);'
    +   'padding:11px 0 12px;font-family:"Noto Sans Georgian",sans-serif;font-size:13.5px;}'
    + 'nav.tpm-nav a{color:var(--ink,#1a1a1a);text-decoration:none;padding-bottom:3px;border-bottom:2px solid transparent;}'
    + 'nav.tpm-nav a:hover{border-bottom-color:var(--muted,#6b6b6b);}'
    + 'nav.tpm-nav a.active{border-bottom-color:#b91c1c;font-weight:700;}'
    // dropdown
    + '.tpm-dd{position:relative;display:inline-block;}'
    + '.tpm-dd>button{font-family:"Noto Sans Georgian",sans-serif;font-size:13.5px;color:var(--ink,#1a1a1a);background:none;'
    +   'border:none;cursor:pointer;padding:0 0 3px;border-bottom:2px solid transparent;display:inline-flex;align-items:center;gap:5px;}'
    + '.tpm-dd>button:hover{border-bottom-color:var(--muted,#6b6b6b);}'
    + '.tpm-dd>button .caret{font-size:10px;transition:transform .15s;}'
    + '.tpm-dd.open>button{border-bottom-color:#b91c1c;font-weight:700;}'
    + '.tpm-dd.open>button .caret{transform:rotate(180deg);}'
    + '.tpm-dd-menu{position:absolute;top:100%;left:50%;transform:translateX(-50%);min-width:180px;background:var(--paper,#fffdf7);'
    +   'border:1px solid var(--ink,#1a1a1a);box-shadow:0 6px 20px rgba(0,0,0,0.12);padding:6px 0;margin-top:8px;z-index:10000;'
    +   'display:none;}'
    + '.tpm-dd.open .tpm-dd-menu{display:block;}'
    + '.tpm-dd-menu a{display:block;padding:8px 18px;font-family:"Noto Sans Georgian",sans-serif;font-size:13px;'
    +   'color:var(--ink,#1a1a1a);text-decoration:none;white-space:nowrap;border-bottom:1px solid rgba(0,0,0,0.05);}'
    + '.tpm-dd-menu a:last-child{border-bottom:none;}'
    + '.tpm-dd-menu a:hover{background:rgba(185,28,28,0.07);color:#b91c1c;}'
    + '.tpm-dd-menu a.active{color:#b91c1c;font-weight:700;}'
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
    + '#tpm-sticky nav{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-family:"Noto Sans Georgian",sans-serif;font-size:12px;}'
    + '#tpm-sticky nav a{color:var(--ink,#1a1a1a);text-decoration:none;}'
    + '#tpm-sticky nav a.active{color:#b91c1c;font-weight:700;border-bottom:2px solid #b91c1c;}'
    + '.tpm-mini-nav{display:flex;gap:13px;margin-left:16px;flex-wrap:wrap;align-items:center;font-family:"Noto Sans Georgian",sans-serif;font-size:11.5px;}'
    + '.tpm-mini-nav a{color:var(--ink,#1a1a1a);text-decoration:none;}'
    + '.tpm-mini-nav a.active{color:#b91c1c;font-weight:700;}'
    + '@media print{header.tpm,#tpm-sticky{display:none!important;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ---------- nav html ----------------------------------------------------
  function tabLinks() {
    return TABS.map(function (p) {
      var active = p.re.test(path) ? ' class="active"' : '';
      return '<a href="' + p.href + '"' + active + '>' + p.label + '</a>';
    }).join('');
  }
  function menuItems() {
    return MENU.map(function (p) {
      var active = (p.href.split('#')[0] === path) ? ' class="active"' : '';
      return '<a href="' + p.href + '"' + active + '>' + p.label + '</a>';
    }).join('');
  }
  function dropdown() {
    return '<span class="tpm-dd">'
      + '<button type="button" aria-haspopup="true" aria-expanded="false">კაბინეტი <span class="caret">▾</span></button>'
      + '<span class="tpm-dd-menu">' + menuItems() + '</span>'
      + '</span>';
  }
  function fullNav() { return tabLinks() + dropdown(); }

  // wire up every dropdown that exists (header + sticky + mini)
  function wireDropdowns(root) {
    (root || document).querySelectorAll('.tpm-dd').forEach(function (dd) {
      var btn = dd.querySelector('button');
      if (!btn || btn._tpmWired) return;
      btn._tpmWired = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wasOpen = dd.classList.contains('open');
        document.querySelectorAll('.tpm-dd.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); });
        if (!wasOpen) { dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }
  document.addEventListener('click', function () {
    document.querySelectorAll('.tpm-dd.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('button').setAttribute('aria-expanded', 'false'); });
  });

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
  var header = document.createElement('header');
  header.className = 'tpm masthead';
  header.innerHTML =
      '<div class="tpm-top top-bar">'
    +   '<span id="today-date">' + dateStr + '</span>'
    +   '<span>გამოცემა · ვისბადენი &nbsp;·&nbsp; <a href="/tp-logout" class="tpm-out no-print">გასვლა</a></span>'
    + '</div>'
    + '<div class="tpm-row">'
    +   '<div class="tpm-brand"><h1><a href="/meportfolio/">The Trading Paper</a></h1>'
    +   '<p class="tpm-tag tagline">ბაზარი · ცოცხალი მაჩვენებლები · რეიტინგი</p></div>'
    +   '<div id="tp-clocks" class="no-print"></div>'
    + '</div>'
    + '<nav class="tpm-nav">' + fullNav() + '</nav>';

  if (old) old.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);
  wireDropdowns(header);

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
    bar.innerHTML = '<a class="b" href="/meportfolio/">The Trading Paper</a><nav>' + fullNav() + '</nav>';
    document.body.appendChild(bar);
    wireDropdowns(bar);
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
          nv.innerHTML = fullNav();
          brand.insertAdjacentElement('afterend', nv);
          wireDropdowns(nv.parentNode);
        }
      } else if (tries > 15) { clearInterval(t); makeSticky(); }
    }, 250);
  } else {
    makeSticky();
  }
})();
