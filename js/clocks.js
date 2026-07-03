// ============================================================
// The Trading Paper — World Exchange Clocks
// Renders into <div id="tp-clocks"></div> (if present).
// New York (NYSE) · London (LSE) · Shanghai (SSE) + visitor local.
// ============================================================
(function () {
  var mount = document.getElementById('tp-clocks');
  if (!mount) return;

  var css = ''
    + '#tp-clocks{display:flex;gap:0;flex-wrap:wrap;justify-content:center;border:1px solid var(--border,#d9d4c8);background:var(--paper,#fffdf7);}'
    + '#tp-clocks .clk{padding:7px 14px 8px;border-right:1px solid var(--border,#d9d4c8);text-align:center;min-width:96px;}'
    + '#tp-clocks .clk:last-child{border-right:none;}'
    + '#tp-clocks .clk .c-city{font-family:"Noto Sans Georgian",sans-serif;font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted,#6b6b6b);white-space:nowrap;}'
    + '#tp-clocks .clk .c-time{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:700;font-size:16px;letter-spacing:0.5px;color:var(--ink,#1a1a1a);font-variant-numeric:tabular-nums;line-height:1.25;}'
    + '#tp-clocks .clk .c-st{font-family:"Noto Sans Georgian",sans-serif;font-size:8px;letter-spacing:1px;white-space:nowrap;}'
    + '#tp-clocks .clk .c-st .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;vertical-align:middle;}'
    + '#tp-clocks .clk .c-st.open{color:#166534;}#tp-clocks .clk .c-st.open .dot{background:#16a34a;}'
    + '#tp-clocks .clk .c-st.closed{color:#b91c1c;}#tp-clocks .clk .c-st.closed .dot{background:#b91c1c;}'
    + '#tp-clocks .clk.me{background:rgba(139,105,20,0.06);}'
    + '#tp-clocks .clk.me .c-st{color:#8b6914;}#tp-clocks .clk.me .c-st .dot{background:#8b6914;}'
    + '@media(max-width:700px){#tp-clocks .clk{min-width:74px;padding:5px 8px 6px;}#tp-clocks .clk .c-time{font-size:13px;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // sessions: [ [startMin, endMin], ... ] in exchange-local minutes, Mon-Fri
  var EX = [
    { id: 'nyse', city: 'ნიუ-იორკი', sub: 'NYSE', tz: 'America/New_York',  sessions: [[570, 960]] },
    { id: 'lse',  city: 'ლონდონი',   sub: 'LSE',  tz: 'Europe/London',     sessions: [[480, 990]] },
    { id: 'sse',  city: 'შანხაი',    sub: 'SSE',  tz: 'Asia/Shanghai',     sessions: [[570, 690], [780, 900]] }
  ];

  var GEO = { 'Tbilisi': 'თბილისი', 'Berlin': 'ბერლინი', 'London': 'ლონდონი', 'Paris': 'პარიზი',
    'New_York': 'ნიუ-იორკი', 'Moscow': 'მოსკოვი', 'Kiev': 'კიევი', 'Kyiv': 'კიევი', 'Istanbul': 'სტამბოლი',
    'Yerevan': 'ერევანი', 'Baku': 'ბაქო', 'Amsterdam': 'ამსტერდამი', 'Madrid': 'მადრიდი', 'Rome': 'რომი',
    'Warsaw': 'ვარშავა', 'Vienna': 'ვენა', 'Dubai': 'დუბაი', 'Shanghai': 'შანხაი', 'Tokyo': 'ტოკიო',
    'Los_Angeles': 'ლოს-ანჯელესი', 'Chicago': 'ჩიკაგო', 'Athens': 'ათენი', 'Zurich': 'ციურიხი',
    'Brussels': 'ბრიუსელი', 'Prague': 'პრაღა', 'Lisbon': 'ლისაბონი', 'Stockholm': 'სტოკჰოლმი' };
  var tz = 'UTC', city = 'UTC';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    var raw = tz.split('/').pop();
    city = GEO[raw] || raw.replace(/_/g, ' ');
  } catch (e) { /* keep UTC */ }

  function cell(id, cityName, sub, extra) {
    return '<div class="clk' + (extra || '') + '" id="clk-' + id + '">'
      + '<div class="c-city">' + cityName + (sub ? ' · ' + sub : '') + '</div>'
      + '<div class="c-time">--:--:--</div>'
      + '<div class="c-st closed"><span class="dot"></span><span class="c-lbl">—</span></div>'
      + '</div>';
  }
  mount.innerHTML = EX.map(function (e) { return cell(e.id, e.city, e.sub, ''); }).join('')
    + cell('me', 'შენი დრო', city, ' me');

  function partsIn(tzName) {
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: tzName, hour12: false,
      weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var o = {};
    f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function tick() {
    EX.forEach(function (e) {
      var p, el = document.getElementById('clk-' + e.id);
      if (!el) return;
      try { p = partsIn(e.tz); } catch (err) { return; }
      el.querySelector('.c-time').textContent = p.hour + ':' + p.minute + ':' + p.second;
      var wd = p.weekday, mins = (+p.hour) * 60 + (+p.minute);
      var weekday = (wd !== 'Sat' && wd !== 'Sun');
      var open = weekday && e.sessions.some(function (s) { return mins >= s[0] && mins < s[1]; });
      var stEl = el.querySelector('.c-st');
      stEl.className = 'c-st ' + (open ? 'open' : 'closed');
      stEl.querySelector('.c-lbl').textContent = open ? 'ღიაა' : 'დაკეტილია';
    });
    var me = document.getElementById('clk-me');
    if (me) {
      try {
        var p2 = partsIn(tz);
        me.querySelector('.c-time').textContent = p2.hour + ':' + p2.minute + ':' + p2.second;
        me.querySelector('.c-st').className = 'c-st';
        me.querySelector('.c-lbl').textContent = tz;
      } catch (err) { /* ignore */ }
    }
  }
  tick();
  setInterval(tick, 1000);
})();
