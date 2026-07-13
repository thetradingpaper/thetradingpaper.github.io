// ============================================================
// The Trading Paper — Shared Masthead (logo + clocks + nav)
// One source of truth for the header on every page.
// Include AFTER page content, BEFORE js/clocks.js:
//   <script src="/js/masthead.js"></script>
//   <script src="/js/clocks.js"></script>
//
// TWO nav systems, working together (see change spec §1):
//   TABS  = primary horizontal tabs (feel like the main navigation)
//   MENU  = secondary cabinet-tools sub-nav (horizontal tab row shown
//           only inside the Cabinet area; replaced the old dropdown)
// Watchlist removed everywhere (see §9). To retarget a tab, edit
// the TABS / MENU arrays below — it updates every page at once.
// ============================================================
(function () {
  var lang = 'ka';
  try { lang = localStorage.getItem('tp_lang') === 'en' ? 'en' : 'ka'; } catch (e) {}

  // ---- PRIMARY horizontal tabs -------------------------------------------
  // My Cabinet · Market Notes · Analysis · Kvleva 3.0 · Kvleva 5.0 (BETA)
  var TABS = [
    { href: '/',                   label: lang === 'ka' ? 'ჩემი კაბინეტი' : 'My Cabinet',   re: /^\/(index\.html)?$/ },
    { href: '/meportfolio/',       label: lang === 'ka' ? 'ანალიზი' : 'Analysis',         re: /^\/meportfolio/ },
    { href: '/research.html',      label: lang === 'ka' ? 'კვლევითი ცენტრი' : 'Research Center', re: /^\/(research|kvleva)/ }
  ];

  // ---- SECONDARY sub-nav (cabinet tools) — horizontal tab row ------------
  // Shown as a red-underline sub-nav line when inside the Cabinet area
  // (dashboard + its tools). Replaced the old "კაბინეტი ▾" dropdown.
  var MENU = [
    { href: '/goals.html',     label: lang === 'ka' ? 'მიზნები' : 'Goals' },
    { href: '/notes.html',     label: lang === 'ka' ? 'ჩემი ჩანაწერები' : 'My Notes' },
    { href: '/ledger.html',    label: lang === 'ka' ? 'ბიუჯეტი' : 'Ledger' },
    { href: '/dividends.html', label: lang === 'ka' ? 'დივიდენდები' : 'Dividends' },
    { href: '/edit.html',      label: lang === 'ka' ? 'რედაქტირება' : 'Edit' }
  ];

  var path = location.pathname;
  var isCabinet = /^\/(index\.html)?$/.test(path);
  // Cabinet area = dashboard + any cabinet tool page → show the sub-nav there.
  var inCabArea = (path === '/' || path === '/index.html'
    || /^\/(goals|notes|ledger|dividends|edit)/.test(path));

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
    // secondary sub-nav (cabinet tools) — horizontal tab row, red active underline
    + 'nav.tpm-subnav{display:flex;justify-content:center;align-items:center;gap:24px;flex-wrap:wrap;'
    +   'padding:9px 0 10px;border-bottom:1px solid var(--border,#d9d4c8);margin-bottom:14px;'
    +   'font-family:"Noto Sans Georgian",sans-serif;font-size:12px;letter-spacing:.3px;}'
    + 'nav.tpm-subnav a{color:var(--muted,#6b6b6b);text-decoration:none;padding-bottom:3px;border-bottom:2px solid transparent;}'
    + 'nav.tpm-subnav a:hover{color:var(--ink,#1a1a1a);border-bottom-color:var(--muted,#6b6b6b);}'
    + 'nav.tpm-subnav a.active{color:var(--ink,#1a1a1a);border-bottom-color:#b91c1c;font-weight:700;}'
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
    + '@media print{header.tpm,#tpm-sticky{display:none!important;}}'
    + '#tpm-center-ticker{display:flex;align-items:center;border:1px dashed var(--border,#d9d4c8);'
    +   'padding:5px 0;background:var(--paper,#fffdf7);border-radius:4px;width:380px;overflow:hidden;'
    +   'white-space:nowrap;position:relative;line-height:1.2;}'
    + '#tpm-center-ticker::before,#tpm-center-ticker::after{content:"";position:absolute;top:0;bottom:0;width:20px;pointer-events:none;z-index:2;}'
    + '#tpm-center-ticker::before{left:0;background:linear-gradient(to right,var(--paper,#fffdf7),transparent);}'
    + '#tpm-center-ticker::after{right:0;background:linear-gradient(to left,var(--paper,#fffdf7),transparent);}'
    + '.tpm-marquee-wrap{display:inline-flex;gap:24px;padding-left:12px;animation:tpm-marquee-scroll 25s linear infinite;}'
    + '.tpm-marquee-wrap:hover{animation-play-state:paused;}'
    + '.tpm-marquee-wrap a{text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:6px;}'
    + '.tpm-marquee-wrap a:hover{color:var(--red,#b91c1c);}'
    + '.tpm-marquee-wrap .tk{font-family:"Noto Serif Georgian",serif;font-weight:700;color:var(--ink,#1a1a1a);}'
    + '.tpm-marquee-wrap .pos{color:var(--green,#166534);font-weight:700;}'
    + '.tpm-marquee-wrap .neg{color:var(--red,#b91c1c);font-weight:700;}'
    + '@keyframes tpm-marquee-scroll{0%{transform:translate3d(0,0,0);}100%{transform:translate3d(-50%,0,0);}}'
    + '@media(max-width:1200px){#tpm-center-ticker{display:none;}}';
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
  // sub-nav links (cabinet tools) — active = current page
  function subnavLinks() {
    return MENU.map(function (p) {
      // tolerant match so the active underline works on clean URLs (/ledger) and /ledger.html
      var base = p.href.split('#')[0].replace(/\.html$/, '');
      var active = (path === base || path === base + '.html' || path === base + '/') ? ' class="active"' : '';
      return '<a href="' + p.href + '"' + active + '>' + p.label + '</a>';
    }).join('');
  }

  // ---------- date --------------------------------------------------------
  var MONTHS_KA = ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი','ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'];
  var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var d = new Date();
  var dateStr = lang === 'ka'
    ? d.getDate() + ' ' + MONTHS_KA[d.getMonth()] + ' ' + d.getFullYear()
    : MONTHS_EN[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

  // ---------- capture old header's page title (if any) --------------------
  var old = document.querySelector('header.masthead');
  var pageTitle = '', pageTag = '';
  if (old) {
    var oh = old.querySelector('h1');
    var ot = old.querySelector('.tagline');
    if (oh) pageTitle = (oh.textContent || '').trim();
    if (ot) pageTag = (ot.textContent || '').trim();
    if (pageTitle === 'The Trading Paper') { pageTitle = ''; pageTag = ''; }
    // The cabinet dashboard breadcrumb is replaced by the sub-nav tab row.
    if (pageTitle === 'ჩემი კაბინეტი') { pageTitle = ''; pageTag = ''; }
  }

  // ---------- build header -------------------------------------------------
  var header = document.createElement('header');
  header.className = 'tpm masthead';
  header.innerHTML =
      '<div class="tpm-top top-bar">'
    +   '<span id="today-date">' + dateStr + '</span>'
    +   '<span>' + (lang === 'ka' ? 'გამოცემა · ვისბადენი' : 'Edition · Wiesbaden') + ' &nbsp;·&nbsp; '
    +   '<a id="tp-lang-btn" style="cursor:pointer;font-weight:bold;margin-right:8px;" class="no-print">' + (lang === 'ka' ? 'EN' : 'KA') + '</a> &nbsp;·&nbsp; '
    +   '<a href="/tp-logout" class="tpm-out no-print">' + (lang === 'ka' ? 'გასვლა' : 'Logout') + '</a></span>'
    + '</div>'
    + '<div class="tpm-row">'
    +   '<div class="tpm-brand"><h1><a href="/meportfolio/">The Trading Paper</a></h1>'
    +   '<p class="tpm-tag tagline">' + (lang === 'ka' ? 'ბაზარი · ცოცხალი მაჩვენებლები · რეიტინგი' : 'Market · Live Indicators · Rating') + '</p></div>'
    +   '<div id="tpm-center-ticker" class="no-print"></div>'
    +   '<div id="tp-clocks" class="no-print"></div>'
    + '</div>'
    + '<nav class="tpm-nav">' + tabLinks() + '</nav>';

  if (old) old.replaceWith(header);
  else document.body.insertBefore(header, document.body.firstChild);

  // language toggle handler
  var lBtn = document.getElementById('tp-lang-btn');
  if (lBtn) {
    lBtn.addEventListener('click', function () {
      var next = lang === 'ka' ? 'en' : 'ka';
      try { localStorage.setItem('tp_lang', next); } catch (e) {}
      location.reload();
    });
  }

  // secondary sub-nav (cabinet tools) — only inside the Cabinet area
  var anchor = header;
  if (inCabArea) {
    var sub = document.createElement('nav');
    sub.className = 'tpm-subnav no-print';
    sub.innerHTML = subnavLinks();
    header.insertAdjacentElement('afterend', sub);
    anchor = sub;
  }

  // page-title strip (preserves e.g. "ყოველთვიური წიგნი" on ledger)
  if (pageTitle) {
    var strip = document.createElement('div');
    strip.className = 'tpm-pagetitle';
    strip.innerHTML = '<b>' + pageTitle + '</b>' + (pageTag ? ' · ' + pageTag : '');
    anchor.insertAdjacentElement('afterend', strip);
  }

  // ---------- sticky -------------------------------------------------------
  function makeSticky() {
    var bar = document.createElement('div');
    bar.id = 'tpm-sticky';
    bar.innerHTML = '<a class="b" href="/meportfolio/">The Trading Paper</a><nav>' + tabLinks() + '</nav>';
    document.body.appendChild(bar);
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
          nv.innerHTML = tabLinks();
          brand.insertAdjacentElement('afterend', nv);
        }
      } else if (tries > 15) { clearInterval(t); makeSticky(); }
    }, 250);
  } else {
    makeSticky();
  }

  // Populate the center masthead ticker from kvleva3-picks
  (function() {
    var el = document.getElementById('tpm-center-ticker');
    if (!el) return;
    
    // Universal path resolver for both web server and local file system
    var base = '/';
    if (location.protocol === 'file:') {
      var path = location.pathname.toLowerCase();
      if (path.indexOf('/meportfolio/') !== -1) base = '../';
      else if (path.indexOf('/articles/') !== -1) base = '../';
      else if (path.indexOf('/stock/ttp-issue10-update/') !== -1) base = '../../';
      else if (path.indexOf('/stock/') !== -1) base = '../';
      else base = '';
    }
    
    fetch(base + 'data/kvleva3-picks.json?t=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var picks = data.picks || [];
        if (picks.length === 0) { el.style.display = 'none'; return; }
        
        var html = '<div class="tpm-marquee-wrap">';
        var itemsHtml = '<span style="font-weight:700;color:var(--red,#b91c1c);letter-spacing:0.5px;">კვლევა 3.0:</span>&nbsp;&nbsp;';
        
        itemsHtml += picks.slice(0, 5).map(function(p) {
          var isPos = p.change >= 0;
          var sign = isPos ? '+' : '−';
          return '<a href="/kvleva3.html"><span class="tk">' + p.ticker + '</span> '
            + '<span class="' + (isPos ? 'pos' : 'neg') + '">' + sign + Math.abs(p.changePct).toFixed(1) + '%</span></a>';
        }).join('&nbsp;·&nbsp;&nbsp;');
        
        // Duplicate for seamless infinite scrolling loop
        html += itemsHtml + '&nbsp;&nbsp;·&nbsp;&nbsp;' + itemsHtml + '</div>';
        el.innerHTML = html;
      })
      .catch(function() {
        el.style.display = 'none';
      });
  })();
})();
