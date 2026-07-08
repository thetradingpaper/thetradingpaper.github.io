// ============================================================
// The Trading Paper — World Exchange Clocks  (v2: engraved emblems)
// Renders into <div id="tp-clocks"></div> (if present).
// New York (NYSE) · London (LSE) · Shanghai (SSE) + visitor local.
// Each clock carries a hand-engraved landmark in newspaper ink:
//   NYSE — columned facade · London — Big Ben ·
//   Shanghai — Oriental Pearl · you — compass rose.
// ============================================================
(function () {
  var mount = document.getElementById('tp-clocks');
  if (!mount) return;

  var css = ''
    + '#tp-clocks{display:flex;gap:0;flex-wrap:wrap;justify-content:center;'
    +   'border:1px solid var(--border,#d9d4c8);border-top:3px double var(--rule,#1a1a1a);'
    +   'background:var(--paper,#fffdf7);box-shadow:0 1px 0 var(--border,#d9d4c8);}'
    + '#tp-clocks .clk{padding:8px 15px 9px;border-right:1px solid var(--border,#d9d4c8);text-align:center;min-width:104px;position:relative;}'
    + '#tp-clocks .clk:last-child{border-right:none;}'
    + '#tp-clocks .clk .c-emblem{height:26px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:3px;}'
    + '#tp-clocks .clk .c-emblem svg{display:block;height:24px;width:auto;stroke:var(--ink,#1a1a1a);opacity:0.9;}'
    + '#tp-clocks .clk .c-city{font-family:"Noto Sans Georgian",sans-serif;font-size:8.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--muted,#6b6b6b);white-space:nowrap;margin-top:2px;}'
    + '#tp-clocks .clk .c-city b{color:var(--ink,#1a1a1a);font-weight:700;}'
    + '#tp-clocks .clk .c-time{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:700;font-size:16px;letter-spacing:0.5px;color:var(--ink,#1a1a1a);font-variant-numeric:tabular-nums;line-height:1.3;}'
    + '#tp-clocks .clk .c-st{font-family:"Noto Sans Georgian",sans-serif;font-size:8px;letter-spacing:1px;white-space:nowrap;}'
    + '#tp-clocks .clk .c-st .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:4px;vertical-align:middle;}'
    + '#tp-clocks .clk .c-st.open{color:#166534;}#tp-clocks .clk .c-st.open .dot{background:#16a34a;box-shadow:0 0 4px rgba(22,163,74,.55);}'
    + '#tp-clocks .clk .c-st.closed{color:#b91c1c;}#tp-clocks .clk .c-st.closed .dot{background:#b91c1c;}'
    + '#tp-clocks .clk.me{background:rgba(139,105,20,0.07);}'
    + '#tp-clocks .clk.me .c-emblem svg{stroke:#8b6914;opacity:1;}'
    + '#tp-clocks .clk.me .c-st{color:#8b6914;}#tp-clocks .clk.me .c-st .dot{background:#8b6914;}'
    + '@media(max-width:700px){#tp-clocks .clk{min-width:80px;padding:6px 9px 7px;}'
    +   '#tp-clocks .clk .c-time{font-size:13px;}#tp-clocks .clk .c-emblem{height:21px;}#tp-clocks .clk .c-emblem svg{height:19px;}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ---- engraved landmark emblems (stroke = ink, no fill) -------------------
  var EMBLEMS = {
    // NYSE — classical columned facade with pediment
    nyse: '<svg viewBox="0 0 34 24" fill="none" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M3 9.5 L17 2.5 L31 9.5 Z"/>'
      + '<path d="M5 9.5 H29"/>'
      + '<path d="M6.5 12 V20 M11 12 V20 M15.5 12 V20 M20 12 V20 M24.5 12 V20 M27.5 12 V20"/>'
      + '<path d="M5 12 H29" stroke-width="0.8"/>'
      + '<path d="M3.5 21.5 H30.5 M4.5 20 H29.5" stroke-width="0.9"/>'
      + '<path d="M14.5 6.5 L17 5.2 L19.5 6.5" stroke-width="0.7"/>'
      + '</svg>',
    // London — Big Ben (Elizabeth Tower)
    lse: '<svg viewBox="0 0 16 24" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M8 1 L10.5 5 H5.5 Z"/>'
      + '<path d="M5.5 5 H10.5 V9 H5.5 Z"/>'
      + '<circle cx="8" cy="7" r="1.4" stroke-width="0.8"/>'
      + '<path d="M8 6.2 V7 L8.6 7.4" stroke-width="0.6"/>'
      + '<path d="M6 9 V22 M10 9 V22"/>'
      + '<path d="M6 12 H10 M6 15 H10 M6 18 H10" stroke-width="0.6"/>'
      + '<path d="M4 22 H12" stroke-width="1.1"/>'
      + '</svg>',
    // Shanghai — Oriental Pearl tower
    sse: '<svg viewBox="0 0 16 24" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'
      + '<path d="M8 1 V4" stroke-width="0.8"/>'
      + '<circle cx="8" cy="6" r="2"/>'
      + '<path d="M8 8 V10.5" stroke-width="0.9"/>'
      + '<circle cx="8" cy="13.5" r="3"/>'
      + '<path d="M6.2 16 L4.5 22 M9.8 16 L11.5 22 M8 16.5 V22" stroke-width="0.9"/>'
      + '<path d="M3 22 H13" stroke-width="1.1"/>'
      + '<path d="M6.4 12.4 A2.2 2.2 0 0 1 9.6 12.4" stroke-width="0.5"/>'
      + '</svg>',
    // visitor — compass rose
    me: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="12" cy="12" r="9.5"/>'
      + '<circle cx="12" cy="12" r="7" stroke-width="0.5"/>'
      + '<path d="M12 4 L13.8 10.2 L12 12 L10.2 10.2 Z"/>'
      + '<path d="M12 20 L10.2 13.8 L12 12 L13.8 13.8 Z" stroke-width="0.7"/>'
      + '<path d="M4 12 H6.5 M17.5 12 H20 M12 2.5 V4 M12 20 V21.5" stroke-width="0.6"/>'
      + '</svg>'
  };

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
      + '<div class="c-emblem">' + (EMBLEMS[id] || '') + '</div>'
      + '<div class="c-city"><b>' + cityName + '</b>' + (sub ? ' · ' + sub : '') + '</div>'
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
