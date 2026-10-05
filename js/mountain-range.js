/* ============================================================
   Mountain time-scale selector — adds YTD / 1Y / 2Y / 5Y / ALL
   buttons above each book's mountain chart and re-draws it from
   data/history.json filtered to the chosen range.
   Self-contained: loaded after the page's own scripts. If anything
   fails it silently leaves the default mountains in place.
   ============================================================ */
(function () {
  'use strict';
  var BOOKS = ['bog', 'tbc'];               // GALT is closed
  var RANGES = [
    { key: 'ytd', label: 'წელს' },
    { key: '1y',  label: '1 წელი' },
    { key: '2y',  label: '2 წელი' },
    { key: '5y',  label: '5 წელი' },
    { key: 'all', label: 'ყველა' }
  ];
  var COLORS = {
    bog: { line: '#b91c1c', fill: 'rgba(185,28,28,0.12)' },
    tbc: { line: '#1a1a1a', fill: 'rgba(26,26,26,0.10)' }
  };
  var state = {};   // per-book selected range
  var HIST = null;

  function cutoff(rangeKey) {
    var now = new Date();
    if (rangeKey === 'all') return '0000-00-00';
    if (rangeKey === 'ytd') return now.getFullYear() + '-01-01';
    var y = { '1y': 1, '2y': 2, '5y': 5 }[rangeKey] || 1;
    var d = new Date(now.getFullYear() - y, now.getMonth(), now.getDate());
    return d.toISOString().slice(0, 10);
  }

  function seriesFor(key, rangeKey) {
    var cut = cutoff(rangeKey);
    var pts = (HIST || []).filter(function (e) {
      return e.books && e.books[key] && e.date >= cut;
    });
    if (pts.length < 2) {                 // not enough in range -> show all we have
      pts = (HIST || []).filter(function (e) { return e.books && e.books[key]; });
    }
    return {
      labels: pts.map(function (e) { return e.date.slice(5).replace('-', '/'); }),
      deposited: pts.map(function (e) { return e.books[key].deposited; }),
      value: pts.map(function (e) { return e.books[key].value; })
    };
  }

  function draw(key) {
    var canvas = document.getElementById(key + '-mountain-top');
    if (!canvas || typeof Chart === 'undefined') return;
    var s = seriesFor(key, state[key]);
    var ex = Chart.getChart(canvas);
    if (ex) ex.destroy();
    var c = COLORS[key] || COLORS.bog;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: s.labels,
        datasets: [
          { label: 'ღირებულება', data: s.value, borderColor: c.line, backgroundColor: c.fill,
            fill: true, tension: 0.25, borderWidth: 2, pointRadius: 3, pointBackgroundColor: c.line },
          { label: 'ჩარიცხული', data: s.deposited, borderColor: '#6b6b6b', backgroundColor: 'transparent',
            borderDash: [5, 4], borderWidth: 1.5, pointRadius: 2, pointBackgroundColor: '#6b6b6b', fill: false, tension: 0.1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 14, font: { family: "'Noto Sans Georgian', sans-serif", size: 11 } } },
          tooltip: { callbacks: { label: function (ctx) { return ctx.dataset.label + ': $' + ctx.parsed.y.toFixed(2); } } }
        },
        scales: {
          y: { beginAtZero: false, ticks: { callback: function (v) { return '$' + v; }, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  function buildBar(key) {
    var canvas = document.getElementById(key + '-mountain-top');
    if (!canvas) return;
    var wrap = canvas.closest('.mountain-chart-wrap') || canvas.parentNode;
    if (!wrap || wrap.previousElementSibling && wrap.previousElementSibling.classList.contains('mt-range')) return;
    var bar = document.createElement('div');
    bar.className = 'mt-range';
    bar.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin:0 0 8px;';
    RANGES.forEach(function (r) {
      var b = document.createElement('button');
      b.textContent = r.label;
      b.dataset.r = r.key;
      b.style.cssText = 'font-family:\'Noto Sans Georgian\',sans-serif;font-size:10px;letter-spacing:.5px;padding:3px 9px;border:1px solid #d9d2c4;background:#fff;color:#1a1a1a;cursor:pointer;border-radius:4px;';
      b.addEventListener('click', function () {
        state[key] = r.key;
        bar.querySelectorAll('button').forEach(function (x) { x.style.background = '#fff'; x.style.color = '#1a1a1a'; x.style.borderColor = '#d9d2c4'; });
        b.style.background = '#b91c1c'; b.style.color = '#fff'; b.style.borderColor = '#b91c1c';
        draw(key);
      });
      bar.appendChild(b);
    });
    wrap.parentNode.insertBefore(bar, wrap);
    // default highlight = ALL
    var def = bar.querySelector('button[data-r="all"]');
    if (def) { def.style.background = '#b91c1c'; def.style.color = '#fff'; def.style.borderColor = '#b91c1c'; }
  }

  function init() {
    fetch('data/history.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (h) {
        HIST = Array.isArray(h) ? h.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }) : [];
        BOOKS.forEach(function (k) { state[k] = 'all'; buildBar(k); draw(k); });
      })
      .catch(function () { /* leave defaults */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 400); });
  else setTimeout(init, 400);
})();
