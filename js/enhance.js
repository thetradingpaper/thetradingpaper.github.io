/* ============================================================
   The Trading Paper — interactive enhancements
   1) Count-up animation on the total-portfolio numbers
   2) Dark / light theme toggle (remembered)
   3) Sticky mini-header with live total + P/L
   Self-contained & defensive: if anything is missing it no-ops.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------
  // 1. THEME TOGGLE  (reloads so charts redraw theme-correct)
  // ---------------------------------------------------------
  function currentTheme() {
    try { return localStorage.getItem('tp_theme') === 'dark' ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }
  function buildThemeButton() {
    var btn = document.createElement('button');
    btn.id = 'tp-theme-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'თემის გადართვა — ბნელი/ნათელი');
    btn.title = 'ბნელი / ნათელი თემა';
    btn.textContent = currentTheme() === 'dark' ? '☀' : '☾';
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('tp_theme', next); } catch (e) {}
      location.reload();
    });
    document.body.appendChild(btn);
  }

  // ---------------------------------------------------------
  // 2. STICKY MINI-HEADER
  // ---------------------------------------------------------
  function buildMiniHeader() {
    var hero = document.querySelector('.total-hero');
    if (!hero) return;
    var bar = document.createElement('div');
    bar.id = 'tp-mini';
    bar.innerHTML =
      '<span class="tp-mini-brand">The Trading Paper</span>' +
      '<span class="tp-mini-spacer"></span>' +
      '<span class="tp-mini-label">სრული</span>' +
      '<span class="tp-mini-val" id="tp-mini-val">—</span>' +
      '<span class="tp-mini-pl" id="tp-mini-pl">—</span>';
    document.body.appendChild(bar);

    var valOut = document.getElementById('tp-mini-val');
    var plOut = document.getElementById('tp-mini-pl');

    function sync() {
      var cells = document.querySelectorAll('#total-stats .c');
      if (cells.length < 4) return;
      var val = cells[1].querySelector('.v');   // მთლიანი პორტფელი
      var pct = cells[3].querySelector('.v');   // უკუგება %
      if (val && valOut) valOut.textContent = val.textContent;
      if (pct && plOut) {
        plOut.textContent = pct.textContent;
        plOut.className = 'tp-mini-pl ' + (pct.classList.contains('neg') ? 'neg' : 'pos');
      }
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        if (e.isIntersecting) {
          bar.classList.remove('show');
        } else {
          sync();
          bar.classList.add('show');
        }
      }, { threshold: 0 });
      io.observe(hero);
    }
    // keep numbers fresh while the bar is visible (page refreshes every 60s)
    setInterval(function () { if (bar.classList.contains('show')) sync(); }, 3000);
  }

  // ---------------------------------------------------------
  // 3. COUNT-UP on the total-portfolio numbers
  // ---------------------------------------------------------
  function countUp(el) {
    var orig = (el.textContent || '').trim();
    var m = orig.match(/[\d,]*\.?\d+/);            // first number (sign stays in prefix)
    if (!m) return;
    var raw = m[0];
    var num = parseFloat(raw.replace(/,/g, ''));
    if (!isFinite(num)) return;
    var prefix = orig.slice(0, m.index);            // e.g. "$", "−$", "+", "−"
    var suffix = orig.slice(m.index + raw.length);  // e.g. "%"
    var hasComma = raw.indexOf(',') !== -1;
    var decimals = (raw.split('.')[1] || '').length;
    var dur = 1100, t0 = null;

    function fmt(v) {
      var s = Math.abs(v).toFixed(decimals);
      if (hasComma) s = (+s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      return prefix + s + suffix;
    }
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
      el.textContent = fmt(num * eased);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = orig;                   // restore exact original string
    }
    requestAnimationFrame(frame);
  }
  function runCountUp() {
    if (reduce) return;
    var els = document.querySelectorAll('#total-stats .v');
    for (var i = 0; i < els.length; i++) countUp(els[i]);
  }

  // ---------------------------------------------------------
  function init() {
    buildThemeButton();
    buildMiniHeader();
    runCountUp();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
