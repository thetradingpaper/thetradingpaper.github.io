// ============================================================
// The Paper AI — საიტის ასისტენტი (ai.html)
// Two engines:
//   1. LOCAL  — always on, free, offline. Answers from the site's own
//               data (window.PORTFOLIOS, MEPORTF, prices.json, issues,
//               signals, dividends). Never invents numbers.
//   2. CLAUDE — if /api/ai (Cloudflare Pages function) has an
//               ANTHROPIC_API_KEY, questions go to Claude together with
//               a compact snapshot of the same data. Falls back to
//               LOCAL on any error.
// Reads data only. Never writes anything. Not financial advice.
// ============================================================
(function () {
  'use strict';

  var P = window.PORTFOLIOS || {};
  var M = window.MEPORTF || {};
  var BOOKS = ['bog', 'tbc', 'galt'];
  var BOOKFULL = { bog: 'BOG · Bank of Georgia', tbc: 'TBC Capital', galt: 'Galt & Taggart' };
  // Portfolio AI app plugs any user's portfolio in through window.TP_AI_ENGINE (see app/pai-core.js)
  function E() { return window.TP_AI_ENGINE || null; }
  function MM() { return E() ? E().meta() : M; }
  function bname(k) { if (E()) { var n = E().bookNames()[k]; return n ? n[0] : k; } return String(k).toUpperCase(); }
  var KB = { prices: {}, pricesUpdated: null, issues: [], signals: null };
  var HISTORY = [];               // [{role, content}] for Claude mode
  var REMOTE = null;              // endpoint URL when Claude mode is live

  // ---------- formatting ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function usd(n) { if (E()) return E().money(n); var s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return (n < 0 ? '−$' : '$') + s; }
  function sUsd(n) { return (n >= 0 ? '+' : '−') + usd(Math.abs(n)); }
  function pct(n) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%'; }
  function cls(n) { return n >= 0 ? 'pos' : 'neg'; }
  var MON = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
  function gDate(iso) { if (!iso) return '—'; var p = String(iso).slice(0, 10).split('-'); if (p.length < 3) return esc(iso); return (+p[2]) + ' ' + MON[(+p[1]) - 1] + ' ' + p[0]; }
  function shares(n) { return (+n).toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); }

  // ---------- computations (same formulas as cabinet.html) ----------
  function livePrice(t) { if (E()) return E().price(t); var q = KB.prices[t]; return q && q.price ? +q.price : null; }
  function holdingRows(bookKey) {
    if (E()) return E().holdingRows(bookKey);
    var b = P[bookKey]; if (!b || !b.holdings) return [];
    return b.holdings.map(function (h) {
      var px = livePrice(h.ticker); var live = px != null;
      if (!live) px = h.shares ? h.value / h.shares : 0;
      var value = h.shares * px, pl = value - h.invested;
      var q = KB.prices[h.ticker], prev = live && q.previousClose ? +q.previousClose : null;
      return { book: bookKey, ticker: h.ticker, name: h.name, shares: h.shares, avgBuy: h.avgBuy, invested: h.invested,
        price: px, live: live, value: value, pl: pl, plPct: h.invested ? pl / h.invested * 100 : 0,
        day: prev ? (px - prev) / prev * 100 : null, divYield: h.divYield || 0 };
    });
  }
  function allRows() { if (E()) return E().allRows(); var r = []; BOOKS.forEach(function (k) { r = r.concat(holdingRows(k)); }); return r; }
  function bookAgg(k) {
    if (E()) return E().bookAgg(k);
    var p = P[k]; if (!p) return null;
    var dep = p.priorDeposits || 0, wd = 0, fees = 0, divs = 0;
    (p.transactions || []).forEach(function (t) {
      if (t.type === 'deposit') dep += t.amount;
      if (t.type === 'withdraw') wd += t.amount;
      if (t.type === 'buy' || t.type === 'sell') fees += (t.commission || 0);
      if (t.type === 'fee') fees += t.amount;
      if (t.type === 'dividend') divs += (+t.amount || 0);
    });
    var rows = holdingRows(k);
    var value = rows.reduce(function (s, r) { return s + r.value; }, 0) + (p.cash || 0);
    var pnl = value + wd - dep, net = dep - wd;
    return { key: k, name: p.name, full: BOOKFULL[k] || p.fullName, closed: p.status === 'closed', tagline: p.tagline,
      deposits: dep, withdrawn: wd, netInvested: net, fees: fees, dividends: divs, value: value, cash: p.cash || 0,
      pnl: pnl, pnlPct: net > 0 ? pnl / net * 100 : 0, rows: rows, startDate: p.startDate };
  }
  function totals() {
    if (E()) return E().totals();
    var dep = 0, wd = 0, val = 0, divs = 0;
    var books = BOOKS.map(bookAgg).filter(Boolean);
    books.forEach(function (b) { dep += b.deposits; wd += b.withdrawn; val += b.value; divs += b.dividends; });
    var gross = dep + (M.marginFinancingEst || 0), net = gross - wd, pl = val - net;
    return { books: books, deposited: gross, withdrawn: wd, netInvested: net, value: val, pnl: pl, pnlPct: net > 0 ? pl / net * 100 : 0, dividends: divs };
  }
  function allTx() {
    if (E()) return E().allTx();
    var out = [];
    BOOKS.forEach(function (k) { var p = P[k]; if (!p) return; (p.transactions || []).forEach(function (t, i) { out.push(Object.assign({ book: k, _i: i }, t)); }); });
    out.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : a._i - b._i; });
    return out;
  }
  // realized P/L per SELL — average cost incl. buy fees
  function realized() {
    if (E()) return E().realized();
    var res = [];
    BOOKS.forEach(function (k) {
      var p = P[k]; if (!p) return;
      var tx = (p.transactions || []).map(function (t, i) { return Object.assign({ _i: i }, t); })
        .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : b._i - a._i; });
      var pos = {};
      tx.forEach(function (t) {
        if (!t.ticker) return;
        var s = pos[t.ticker] || (pos[t.ticker] = { sh: 0, cost: 0 });
        if (t.type === 'buy') { s.sh += t.shares; s.cost += t.shares * t.price + (t.commission || 0); }
        if (t.type === 'sell' && s.sh > 1e-9) {
          var q = Math.min(t.shares, s.sh), avg = s.cost / s.sh;
          var recv = q * t.price - (t.commission || 0), basis = q * avg;
          res.push({ book: k, ticker: t.ticker, date: t.date, pl: recv - basis, plPct: basis ? (recv - basis) / basis * 100 : 0 });
          s.sh -= q; s.cost -= basis; if (s.sh < 1e-9) { s.sh = 0; s.cost = 0; }
        }
      });
    });
    return res;
  }
  function divSummary() { if (E()) return E().dividends(); try { return window.TP_DIVIDENDS ? window.TP_DIVIDENDS.getSummary() : null; } catch (e) { return null; } }

  // ---------- known tickers ----------
  function knownTickers() {
    var set = {};
    allTx().forEach(function (t) { if (t.ticker) set[t.ticker] = 1; });
    allRows().forEach(function (r) { set[r.ticker] = 1; });
    Object.keys(KB.prices).forEach(function (t) { set[t] = 1; });
    if (KB.signals && KB.signals.watchlist) KB.signals.watchlist.forEach(function (t) { set[t] = 1; });
    return Object.keys(set);
  }
  var NAMES = { 'სანდისკ': 'SNDK', 'sandisk': 'SNDK', 'მარველ': 'MRVL', 'marvell': 'MRVL', 'ვერტივ': 'VRT', 'vertiv': 'VRT', 'ბლუმ': 'BE', 'bloom': 'BE',
    'კოკა': 'KO', 'coca': 'KO', 'ლოიდს': 'LYG', 'lloyds': 'LYG', 'realty income': 'O', 'რეალტი': 'O', 'მაიკროსტრატეჯ': 'MSTR', 'microstrategy': 'MSTR',
    'ვანგარდ': 'VOO', 'vanguard': 'VOO', 'blackstone': 'BXSL', 'ბლექსთოუნ': 'BXSL', 'ares capital': 'ARCC', 'main street': 'MAIN', 'ენვიდია': 'NVDA', 'nvidia': 'NVDA', 'ტესლა': 'TSLA', 'tesla': 'TSLA' };
  function findTickers(q) {
    var up = q.toUpperCase(), found = [];
    knownTickers().forEach(function (t) {
      var ok;
      if (t.length === 1) ok = new RegExp('(^|[\\s$(])' + t + '(?=$|[\\s?,.!)])').test(q);   // single-letter only as a capital standalone
      else ok = new RegExp('(^|[^A-Z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Z0-9])').test(up);
      if (ok && t !== 'AI') found.push(t);
    });
    var low = q.toLowerCase();
    Object.keys(NAMES).forEach(function (n) { if (low.indexOf(n) !== -1 && found.indexOf(NAMES[n]) === -1) found.push(NAMES[n]); });
    return found.slice(0, 4);
  }

  // ---------- glossary ----------
  var GLOSS = [
    [/\bdca\b/i, 'DCA (Dollar-Cost Averaging)', 'რეგულარული, ერთნაირი თანხის ინვესტირება (მაგ. $100–200 თვეში) ფასის მიუხედავად. საშუალო ფასი თავისით „სწორდება“ და ემოცია ნაკლებად ერევა. BOG წიგნი ამ პრინციპზე დგას.'],
    [/\betf/i, 'ETF', 'ბირჟაზე სავაჭრო ფონდი — ერთი ინსტრუმენტი, რომლის შიგნით ბევრი აქციაა (მაგ. VOO = S&P 500-ის 500 კომპანია). იაფი დივერსიფიკაციის გზაა.'],
    [/დივიდენდ|dividend/i, 'დივიდენდი', 'კომპანიის მოგების ნაწილი, რომელსაც აქციონერებს უხდის. საიტი ყველგან წმინდას აჩვენებს: საქართველოში 30% იკავებენ, ანუ წმინდა = მთლიანი × 0.70.'],
    [/p\/e|\bpe\b/i, 'P/E', 'ფასი გაყოფილი ერთ აქციაზე მოგებაზე. აჩვენებს, რამდენ წლიურ მოგებას იხდი აქციის ფასში. მაღალი P/E = ბაზარი დიდ ზრდას ელის (ან ძვირია).'],
    [/მარჟ|margin|ბერკეტ|leverage|cfd/i, 'მარჟა / ბერკეტი (CFD)', 'ნასესხები ფულით ვაჭრობა: 2.5× ბერკეტზე 10% ვარდნა = 25% ზარალი. GALT წიგნი (MSTR CFD) სწორედ ამით დაიხურა.'],
    [/volatility decay|ვოლატილობ|decay|2x|3x|ლევერიჯ/i, 'Volatility Decay', 'ბერკეტიანი (2×/3×) ETF-ები ყოველდღე ბალანსდება. მერყევ ბაზარზე ფასი ადგილზე ბრუნდება, ETF კი ფულს კარგავს. გამოცემა №19 სწორედ ამაზეა.'],
    [/\bbdc/i, 'BDC', 'Business Development Company — კომპანია, რომელიც საშუალო ბიზნესებს სესხს აძლევს და მოგების უდიდეს ნაწილს დივიდენდად არიგებს (ARCC, MAIN, BXSL).'],
    [/\breit/i, 'REIT', 'უძრავი ქონების საინვესტიციო ფონდი — შემოსავლის 90%+ დივიდენდად უნდა გაანაწილოს. მაგ. Realty Income (O), რომელიც ყოველთვიურად იხდის.'],
    [/\brsi/i, 'RSI', 'Relative Strength Index (0–100). 70-ზე მეტი — „გადახურებული“, 30-ზე ნაკლები — „გადაყიდული“. სიგნალების ბოტი თავის წესებში იყენებს.'],
    [/stop.?loss|სტოპ/i, 'Stop-loss', 'წინასწარ დადგენილი ფასი, სადაც პოზიცია იხურება, რომ ზარალი შეიზღუდოს.'],
    [/p\/l|pnl/i, 'P/L', 'მოგება/ზარალი. საიტზე: მიმდინარე ღირებულება + გატანილი − ჩარიცხული. დეპოზიტი P/L-ს არ ცვლის, შიდა გადატანა — არც ჩარიცხულს.'],
  ];

  // ---------- intents ----------
  var RE = {
    greet: /^(გამარჯობა|სალამი|გაუმარჯოს|hello|hi|hey)(?=$|[\s!,.?])/i,
    help: /რა შეგიძლია|დახმარებ|help|რას აკეთებ|რა იცი|როგორ გამოგიყენო/i,
    total: /მთლიან|ჯამ|სულ რამდენ|პორტფელ|ღირებულებ|რამდენი მაქვს|net worth|total|portfolio|ბალანს/i,
    pnl: /მოგებ|ზარალ|p\/l|pnl|უკუგებ|წაგებ|profit|loss|return/i,
    div: /დივიდენდ|dividend|პასიური/i,
    fees: /საკომისიო|კომისი|\bfees?\b/i,
    dep: /დეპოზიტ|ჩარიცხ|შევიტან|შეტან|deposit|გატან|withdraw|გადატან|transfer/i,
    recent: /ბოლო|ტრანზაქცი|ისტორი|recent|last|latest|დღეს|გუშინ/i,
    best: /საუკეთესო|ყველაზე|best|worst|ცუდ|ლიდერ|\btop\b|წამგებ|მომგებ/i,
    alloc: /განაწილებ|წილ|allocation|დივერსიფ|სექტორ/i,
    issues: /გამოცემ|issue|სტატი|article|გაზეთ/i,
    signals: /სიგნალ|ბოტ|signal|\bbot\b|watchlist/i,
    rules: /წეს|სტრატეგი|rule|strategy|გეგმ|მიზან|goal/i,
    advice: /ვიყიდო|გავყიდო|უნდა ვიყიდ|ღირს ყიდვ|should i (buy|sell)|buy or sell|რჩევ/i,
    whatis: /რა არის|რას ნიშნავს|what is|what's|ახსენი|explain/i,
  };
  function bookIn(q) {
    var out = [];
    if (E()) {
      var names = E().bookNames(), low = q.toLowerCase();
      Object.keys(names).forEach(function (k) { var n = names[k]; if ((n[0] && n[0].length > 1 && low.indexOf(n[0].toLowerCase()) !== -1) || (n[1] && low.indexOf(n[1].toLowerCase()) !== -1)) out.push(k); });
      if (/საქართველოს ბანკ|ბოგ/.test(low) && names.bog && out.indexOf('bog') === -1) out.push('bog');
      if (/თიბისი/.test(low) && names.tbc && out.indexOf('tbc') === -1) out.push('tbc');
      return out;
    }
    if (/\bbog\b|საქართველოს ბანკ|ბოგ/i.test(q)) out.push('bog');
    if (/\btbc\b|თიბისი/i.test(q)) out.push('tbc');
    if (/\bgalt\b|გალტ|taggart/i.test(q)) out.push('galt');
    return out;
  }

  // ---------- answer blocks ----------
  function tbl(head, rows) {
    return '<div class="ai-tw"><table class="ai-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function priceNote() {
    if (E()) return '';
    return KB.pricesUpdated
      ? '<div class="ai-src">ფასები: ' + gDate(KB.pricesUpdated) + ' ' + String(KB.pricesUpdated).slice(11, 16) + ' UTC · ავტომატური სნეპშოტი</div>'
      : '<div class="ai-src">ცოცხალი ფასი ვერ ჩაიტვირთა — ნაჩვენებია ბოლო შენახული ღირებულება.</div>';
  }

  function aTotal() {
    var T = totals();
    var rows = T.books.map(function (b) {
      return ['<b>' + esc(b.name) + '</b>' + (b.closed ? ' <span class="mut">· დახურული</span>' : ''), usd(b.value), usd(b.netInvested), '<span class="' + cls(b.pnl) + '">' + sUsd(b.pnl) + '</span>'];
    });
    return '<p>მთლიანი პორტფელი ახლა <b>' + usd(T.value) + '</b>. წმინდა ჩარიცხული: <b>' + usd(T.netInvested) + '</b> (ჩარიცხული ' + usd(T.deposited) + ', გატანილი ' + usd(T.withdrawn) + ').</p>' +
      '<p>წმინდა შედეგი: <b class="' + cls(T.pnl) + '">' + sUsd(T.pnl) + ' (' + pct(T.pnlPct) + ')</b>.</p>' +
      tbl(['წიგნი', 'ღირებულება', 'წმ. ჩარიცხული', 'P/L'], rows) + priceNote();
  }
  function aBook(k) {
    var b = bookAgg(k); if (!b) return '';
    var h = '<p><b>' + esc(b.full) + '</b> — ' + esc(b.tagline || '') + '</p>';
    if (b.closed && E() && !b.galt) return h + '<p>წიგნი <b>დახურულია</b>. ჩარიცხული ' + usd(b.deposits) + ', გატანილი ' + usd(b.withdrawn) + ' → შედეგი <b class="' + cls(b.pnl) + '">' + sUsd(b.pnl) + '</b>.</p>';
    if (b.closed) {
      var g = (E() ? b.galt : M.galt) || {};
      return h + '<p>წიგნი <b>დახურულია</b>. ჩარიცხული ' + usd(g.deposit || 0) + ', საკომისიო ' + usd(g.fees || 0) + ', BOG-ში დაბრუნდა ' + usd(g.withdrawnToBOG || 0) +
        ' → წმინდა შედეგი <b class="neg">' + usd(g.net || 0) + '</b>. ზარალი სრულად ჩანს — ესაა გაკვეთილი ბერკეტზე.</p>';
    }
    h += '<p>ღირებულება <b>' + usd(b.value) + '</b> · წმ. ჩარიცხული ' + usd(b.netInvested) + ' · P/L <b class="' + cls(b.pnl) + '">' + sUsd(b.pnl) + ' (' + pct(b.pnlPct) + ')</b> · ნაღდი ' + usd(b.cash) + '</p>';
    if (b.rows.length) h += tbl(['აქტივი', 'ფასი', 'ღირებულება', 'P/L'], b.rows.map(function (r) {
      return ['<b>' + r.ticker + '</b>', usd(r.price), usd(r.value), '<span class="' + cls(r.pl) + '">' + sUsd(r.pl) + ' (' + pct(r.plPct) + ')</span>'];
    }));
    return h + priceNote();
  }
  function txLabel(t) {
    if (t.type === 'buy') return 'ყიდვა ' + t.ticker + ' ' + shares(t.shares) + ' @ ' + usd(t.price) + ' = ' + usd(t.shares * t.price + (t.commission || 0));
    if (t.type === 'sell') return 'გაყიდვა ' + t.ticker + ' ' + shares(t.shares) + ' @ ' + usd(t.price) + ' = ' + usd(t.shares * t.price - (t.commission || 0));
    if (t.type === 'deposit') return (t.amount < 0 || /transfer|გადატან|გადმოტან/i.test(t.note || '') ? 'გადატანა ' : 'დეპოზიტი ') + usd(t.amount);
    if (t.type === 'withdraw') return 'გატანა ' + usd(t.amount);
    if (t.type === 'dividend') return 'დივიდენდი ' + (t.ticker || '') + ' ' + usd(+t.amount || 0);
    if (t.type === 'fee') return 'საკომისიო ' + usd(t.amount);
    return esc(t.type);
  }
  function txRow(t) { return [gDate(t.date), bname(t.book), txLabel(t)]; }
  function aTicker(t) {
    var rows = allRows().filter(function (r) { return r.ticker === t; });
    var tx = allTx().filter(function (x) { return x.ticker === t; });
    var h = '';
    rows.forEach(function (r) {
      h += '<p><b>' + t + '</b> · ' + esc(r.name) + ' · <span class="mut">' + bname(r.book) + '</span></p>' +
        tbl(['', ''], [
          ['აქციები', shares(r.shares)], ['საშუალო ფასი', usd(r.avgBuy)], ['ჩადებული', usd(r.invested)],
          ['ფასი ახლა', usd(r.price) + (r.day != null ? ' <span class="' + cls(r.day) + '">' + pct(r.day) + ' დღეს</span>' : '')],
          ['ღირებულება', usd(r.value)], ['P/L', '<span class="' + cls(r.pl) + '">' + sUsd(r.pl) + ' (' + pct(r.plPct) + ')</span>'],
          ['დივ. შემოსავლიანობა', r.divYield ? r.divYield.toFixed(2) + '% (წმ. ≈ ' + (r.divYield * 0.7).toFixed(2) + '%)' : '—']
        ]);
    });
    if (!rows.length) {
      var px = livePrice(t);
      h += '<p><b>' + t + '</b> ახლა პორტფელში <b>არ არის</b>.' + (px ? ' ბოლო ფასი: <b>' + usd(px) + '</b>.' : '') + '</p>';
      var rz = realized().filter(function (r) { return r.ticker === t; });
      if (rz.length) {
        var sum = rz.reduce(function (s, r) { return s + r.pl; }, 0);
        h += '<p>დახურული გაყიდვების რეალიზებული შედეგი: <b class="' + cls(sum) + '">' + sUsd(sum) + '</b> (' + rz.length + ' გაყიდვა).</p>';
      }
    }
    if (KB.signals && KB.signals.results) {
      var s = KB.signals.results.filter(function (x) { return x.ticker === t; })[0];
      if (s) h += '<p class="mut">სიგნალების ბოტი (მხოლოდ ქაღალდზე): <b>' + esc(s.signal) + '</b> · RSI ' + esc(s.rsi) + (s.reasons && s.reasons.length ? ' · ' + esc(s.reasons.join('; ')) : '') + '</p>';
    }
    if (tx.length) h += '<p class="mut">ბოლო ოპერაციები:</p>' + tbl(['თარიღი', 'წიგნი', 'ოპერაცია'], tx.slice(0, 6).map(txRow));
    return h;
  }
  function aRecent(books) {
    var tx = allTx().filter(function (t) { return !books.length || books.indexOf(t.book) !== -1; }).slice(0, 10);
    return '<p>ბოლო ' + tx.length + ' ოპერაცია' + (books.length ? ' (' + books.join(', ').toUpperCase() + ')' : '') + ':</p>' + tbl(['თარიღი', 'წიგნი', 'ოპერაცია'], tx.map(txRow));
  }
  function aDiv() {
    var S = divSummary(), T = totals(), h = '';
    if (S) {
      h += '<p>პროგნოზირებული წლიური დივიდენდი (წმინდა, ' + ((S && S.taxPct != null) ? S.taxPct : 30) + '% დაკავების შემდეგ): <b>' + usd(S.annualNet) + '</b> — თვეში საშუალოდ <b>' + usd(S.monthlyNetAvg) + '</b>.</p>';
      var n = S.nextDividend;
      if (n) h += '<p>შემდეგი გადახდა: <b>' + esc(n.ticker) + '</b> · ' + gDate(n.payDate) + (n.netAmount != null ? ' · ≈ ' + usd(n.netAmount) : '') + (n.daysRemaining != null ? ' · ' + n.daysRemaining + ' დღეში' : '') + '.</p>';
    }
    h += '<p>სულ მიღებული დივიდენდი: <b>' + usd(T.dividends) + '</b>. პირველი წლიური მიზანი: $100.</p>';
    var dv = allRows().filter(function (r) { return r.divYield > 0; }).sort(function (a, b) { return b.divYield - a.divYield; });
    if (dv.length) h += tbl(['აქტივი', 'შემოსავლ.', 'წლ. წმინდა ≈'], dv.map(function (r) { return ['<b>' + r.ticker + '</b>', r.divYield.toFixed(2) + '%', usd(r.value * r.divYield / 100 * 0.7)]; }));
    return h + '<div class="ai-src">დეტალები: <a href="dividends.html">დივიდენდების გვერდი</a></div>';
  }
  function aFees() {
    var rows = (MM().feesByBook || []).map(function (f) { return [esc(f.book), usd(f.amount), '<span class="mut">' + esc(f.note || '') + '</span>']; });
    return '<p>სულ გადახდილი საკომისიო: <b class="neg">' + usd(MM().feesPaid || 0) + '</b>.</p>' + tbl(['წიგნი', 'თანხა', 'შენიშვნა'], rows) +
      '<div class="ai-src"><a href="commissions.html">საკომისიოების გვერდი</a></div>';
  }
  function aDep(books) {
    var T = totals();
    var tx = allTx().filter(function (t) { return (t.type === 'deposit' || t.type === 'withdraw') && (!books.length || books.indexOf(t.book) !== -1); }).slice(0, 8);
    var h = '<p>სულ ჩარიცხული <b>' + usd(T.deposited) + '</b>, გატანილი <b>' + usd(T.withdrawn) + '</b>, წმინდა <b>' + usd(T.netInvested) + '</b>. შიდა გადატანა (წიგნიდან წიგნში) ჯამს არ ცვლის.</p>';
    if (tx.length) h += tbl(['თარიღი', 'წიგნი', 'ოპერაცია'], tx.map(txRow));
    if ((MM().transfers || []).length) h += '<p class="mut">შიდა გადატანები: ' + MM().transfers.slice(0, 4).map(function (x) { return esc(x.date) + ' ' + esc(x.from) + ' → ' + esc(x.to) + ' ' + usd(x.amount); }).join(' · ') + '</p>';
    return h + '<div class="ai-src"><a href="history-bog.html">ჩარიცხვები & გატანები</a></div>';
  }
  function aBest() {
    var rows = allRows().slice().sort(function (a, b) { return b.plPct - a.plPct; }), h = '';
    if (rows.length) {
      var top = rows.slice(0, 3), bot = rows.slice(-3).reverse();
      h += '<p><b>ღია პოზიციები — ლიდერები:</b> ' + top.map(function (r) { return r.ticker + ' <span class="' + cls(r.plPct) + '">' + pct(r.plPct) + '</span>'; }).join(' · ') + '</p>';
      h += '<p><b>ჩამორჩენილები:</b> ' + bot.map(function (r) { return r.ticker + ' <span class="' + cls(r.plPct) + '">' + pct(r.plPct) + '</span>'; }).join(' · ') + '</p>';
    }
    var rz = realized().sort(function (a, b) { return b.pl - a.pl; });
    if (rz.length) {
      var b1 = rz[0], w1 = rz[rz.length - 1];
      h += '<p><b>დახურული ვაჭრობები:</b> საუკეთესო — ' + b1.ticker + ' (' + gDate(b1.date) + ') <span class="' + cls(b1.pl) + '">' + sUsd(b1.pl) + '</span>; ყველაზე ცუდი — ' + w1.ticker + ' (' + gDate(w1.date) + ') <span class="' + cls(w1.pl) + '">' + sUsd(w1.pl) + '</span>.</p>';
    }
    return (h || '<p>ჯერ საკმარისი მონაცემი არ არის.</p>') + priceNote();
  }
  function aAlloc() {
    var rows = allRows(), tot = rows.reduce(function (s, r) { return s + r.value; }, 0);
    rows.sort(function (a, b) { return b.value - a.value; });
    return '<p>ღია პოზიციები: <b>' + rows.length + '</b> აქტივი, სულ ' + usd(tot) + '.</p>' +
      tbl(['აქტივი', 'წიგნი', 'ღირებულება', 'წილი'], rows.map(function (r) { return ['<b>' + r.ticker + '</b>', bname(r.book), usd(r.value), (tot ? r.value / tot * 100 : 0).toFixed(1) + '%']; }));
  }
  function aIssues(q) {
    var m = q.match(/№\s*(\d{1,3})|(\d{1,3})/), list = KB.issues || [];
    if (m) {
      var n = m[1] || m[2];
      var hit = list.filter(function (i) { return new RegExp('№' + n + '(\\D|$)').test(i.title); })[0];
      if (hit) return '<p><b>' + esc(hit.title) + '</b> · ' + gDate(hit.date) + '</p><p>' + esc(hit.desc) + '</p><p><a href="' + esc(hit.file) + '">წაკითხვა →</a></p>';
    }
    if (!list.length) return '<p>გამოცემების სია ვერ ჩაიტვირთა.</p>';
    return '<p>ბოლო გამოცემები:</p><ul class="ai-ul">' + list.slice(0, 5).map(function (i) { return '<li><a href="' + esc(i.file) + '"><b>' + esc(i.title) + '</b></a> · ' + gDate(i.date) + '<br><span class="mut">' + esc(i.desc) + '</span></li>'; }).join('') + '</ul>';
  }
  function aSignals() {
    var S = KB.signals; if (!S || !S.results) return '<p>სიგნალების მონაცემი ვერ ჩაიტვირთა.</p>';
    return '<p>სიგნალების ბოტი — <b>მხოლოდ ქაღალდზე ვაჭრობა</b>, რეალურ ფულს არ ეხება. განახლდა ' + gDate(S.updated) + '.</p>' +
      tbl(['ტიკერი', 'ფასი', 'RSI', 'სიგნალი'], S.results.filter(function (r) { return r.ok; }).map(function (r) {
        return ['<b>' + esc(r.ticker) + '</b>', usd(r.price), esc(r.rsi), '<b>' + esc(r.signal) + '</b>' + (r.plan ? ' <span class="mut">სამიზნე ' + usd(r.plan.target) + ' / სტოპი ' + usd(r.plan.stop) + '</span>' : '')];
      })) + '<div class="ai-src">ეს კვლევითი სიგნალია და არა რჩევა.</div>';
  }
  function aRules(books) {
    var R = {
      bog: '<b>BOG</b> — გრძელვადიანი DCA, $100–200 თვეში, მიზანი 35%/წელი. აქტივებს შორის გადანაწილება დასაშვებია.',
      tbc: '<b>TBC</b> — დივიდენდების წიგნი: BDC-ები, REIT, ETF-ები. დივიდენდი ითვლება წმინდად (−30%).',
      galt: '<b>GALT</b> — 2.5× ბერკეტიანი MSTR ვაჭრობა. დახურულია უვადოდ; სხვა წიგნიდან არ ივსება.'
    };
    if (E()) {
      var ks2 = books.length ? books : E().bookKeys();
      return '<ul class="ai-ul">' + ks2.map(function (k) { var b = bookAgg(k); return b ? '<li><b>' + esc(b.name) + '</b> — ' + esc(b.full) + (b.tagline ? ' · ' + esc(b.tagline) : '') + '</li>' : ''; }).join('') + '</ul>' +
        '<p class="mut">წესები, რომლითაც Portfolio AI ითვლის: შიდა გადატანა ჯამს არ ცვლის · ყველა საკომისიო აღირიცხება · ზარალი არასოდეს იმალება.</p>';
    }
    var ks = books.length ? books : BOOKS;
    return '<ul class="ai-ul">' + ks.map(function (k) { return '<li>' + R[k] + '</li>'; }).join('') + '</ul>' +
      '<p class="mut">საერთო წესები: შიდა გადატანა ჯამს არ ცვლის · ყველა საკომისიო აღირიცხება · ზარალი არასოდეს იმალება.</p>' +
      '<div class="ai-src"><a href="learning.html">სწავლის წიგნი — შეცდომები და წესები</a></div>';
  }
  function aGloss(q) {
    return GLOSS.filter(function (g) { return g[0].test(q); }).slice(0, 2).map(function (g) { return '<p><b>' + g[1] + '</b> — ' + g[2] + '</p>'; }).join('');
  }
  var EXAMPLES = ['რამდენია მთლიანი პორტფელი?', 'BOG-ის მდგომარეობა', 'SNDK როგორ არის?', 'რამდენ დივიდენდს ველი წელიწადში?', 'ბოლო ტრანზაქციები', 'საუკეთესო და ყველაზე ცუდი ვაჭრობა', 'რამდენი საკომისიო გადავიხადე?', 'გამოცემა №19', 'რა არის volatility decay?'];
  function aHelp() {
    return '<p>მე ვარ <b>Portfolio AI</b> — ვკითხულობ ' + (E() ? 'შენს პორტფელს' : 'ამ საიტის მონაცემებს') + ' და ვპასუხობ ქართულად. მკითხე, მაგალითად:</p><ul class="ai-ul">' +
      EXAMPLES.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
  }

  function localAnswer(q) {
    var parts = [], books = bookIn(q), tick = findTickers(q);
    if (RE.greet.test(q) && q.length < 25) return '<p>გამარჯობა! რით დაგეხმარო?</p>' + aHelp();
    if (RE.help.test(q)) return aHelp();
    var advice = RE.advice.test(q);
    if (advice) parts.push('<p class="ai-warn">ყიდვა/გაყიდვაზე რჩევას ვერ მოგცემ — ეს გაზეთია და არა საინვესტიციო მრჩეველი. აი ფაქტები, გადაწყვეტილება შენია.</p>');
    var gl = RE.whatis.test(q) ? aGloss(q) : '';
    if (gl) parts.push(gl);
    tick.forEach(function (t) { var a = aTicker(t); if (a) parts.push(a); });
    if (!tick.length && !gl) {
      var specific = RE.dep.test(q) || RE.recent.test(q) || RE.rules.test(q) || RE.fees.test(q) || RE.div.test(q) || RE.best.test(q) || RE.alloc.test(q);
      if (books.length && !specific) books.forEach(function (k) { parts.push(aBook(k)); });
      if (RE.div.test(q)) parts.push(aDiv());
      if (RE.fees.test(q)) parts.push(aFees());
      if (RE.dep.test(q)) parts.push(aDep(books));
      if (RE.recent.test(q) && !RE.issues.test(q) && !RE.dep.test(q)) parts.push(aRecent(books));
      if (RE.best.test(q)) parts.push(aBest());
      if (RE.alloc.test(q)) parts.push(aAlloc());
      if (RE.issues.test(q)) parts.push(aIssues(q));
      if (RE.signals.test(q)) parts.push(aSignals());
      if (RE.rules.test(q)) parts.push(aRules(books));
      if (!books.length && (RE.total.test(q) || RE.pnl.test(q)) && !RE.div.test(q) && !RE.best.test(q)) parts.unshift(aTotal());
      if (parts.length === (advice ? 1 : 0)) { var g2 = aGloss(q); if (g2) parts.push(g2); }
    }
    if (parts.length === (advice ? 1 : 0)) {
      parts.push('<p>ამ კითხვაზე საიტის მონაცემებში ზუსტი პასუხი ვერ ვიპოვე. სცადე უფრო კონკრეტულად — ტიკერი (მაგ. <b>VOO</b>), წიგნი (<b>BOG</b> / <b>TBC</b>), „დივიდენდი“, „საკომისიო“, „ბოლო ტრანზაქციები“ ან „გამოცემა №20“.</p>');
    }
    return parts.slice(0, 4).join('<hr class="ai-hr">');
  }

  // ---------- compact context for Claude ----------
  function buildContext() {
    var T = totals(), L = [];
    L.push('TOTAL: value ' + usd(T.value) + ', deposited ' + usd(T.deposited) + ', withdrawn ' + usd(T.withdrawn) + ', net invested ' + usd(T.netInvested) + ', P/L ' + sUsd(T.pnl) + ' (' + pct(T.pnlPct) + '), dividends received ' + usd(T.dividends) + ', fees paid ' + usd(MM().feesPaid || 0));
    T.books.forEach(function (b) {
      L.push('BOOK ' + b.name + ' (' + b.full + ')' + (b.closed ? ' CLOSED' : '') + ': ' + (b.tagline || '') + '; value ' + usd(b.value) + ', net invested ' + usd(b.netInvested) + ', P/L ' + sUsd(b.pnl) + ' (' + pct(b.pnlPct) + '), cash ' + usd(b.cash));
      b.rows.forEach(function (r) { L.push('  ' + r.ticker + ' ' + r.name + ': ' + shares(r.shares) + ' sh, avg ' + usd(r.avgBuy) + ', invested ' + usd(r.invested) + ', price ' + usd(r.price) + (r.day != null ? ' (' + pct(r.day) + ' today)' : '') + ', value ' + usd(r.value) + ', P/L ' + sUsd(r.pl) + ' (' + pct(r.plPct) + ')' + (r.divYield ? ', div yield ' + r.divYield + '%' : '')); });
    });
    if (!E() && M.galt) L.push('GALT closed book: deposit ' + usd(M.galt.deposit || 0) + ', fees ' + usd(M.galt.fees || 0) + ', returned to BOG ' + usd(M.galt.withdrawnToBOG || 0) + ', net ' + usd(M.galt.net || 0));
    L.push('RECENT TRANSACTIONS:'); allTx().slice(0, 18).forEach(function (t) { L.push('  ' + t.date + ' ' + bname(t.book) + ' ' + txLabel(t)); });
    var rz = realized(); if (rz.length) { L.push('REALIZED SELLS (avg cost incl. fees):'); rz.slice(-15).forEach(function (r) { L.push('  ' + r.date + ' ' + bname(r.book) + ' ' + r.ticker + ' ' + sUsd(r.pl) + ' (' + pct(r.plPct) + ')'); }); }
    var S = divSummary(); if (S) L.push('DIVIDENDS: projected annual net ' + usd(S.annualNet) + ', monthly avg ' + usd(S.monthlyNetAvg) + (S.nextDividend ? ', next ' + S.nextDividend.ticker + ' on ' + S.nextDividend.payDate : '') + '. Georgian withholding 30%.');
    L.push('FEES BY BOOK: ' + (MM().feesByBook || []).map(function (f) { return f.book + ' ' + usd(f.amount); }).join(', '));
    if ((MM().transfers || []).length) L.push('INTERNAL TRANSFERS (do not change total deposited): ' + MM().transfers.map(function (x) { return x.date + ' ' + x.from + '->' + x.to + ' ' + usd(x.amount); }).join('; '));
    if (KB.issues.length) { L.push('ISSUES:'); KB.issues.slice(0, 6).forEach(function (i) { L.push('  ' + i.title + ' (' + i.date + '): ' + i.desc); }); }
    if (KB.signals && KB.signals.results) L.push('SIGNAL BOT (paper only): ' + KB.signals.results.filter(function (r) { return r.ok; }).map(function (r) { return r.ticker + ' ' + r.signal + ' RSI ' + r.rsi; }).join(', '));
    if (!E()) L.push('RULES: BOG long-term DCA $100-200/month, goal 35%/yr; TBC dividend book; GALT 2.5x margin MSTR, closed. Prices as of ' + (KB.pricesUpdated || 'n/a') + '.');
    return L.join('\n');
  }

  // ---------- markdown-lite for Claude answers ----------
  function md(s) {
    var lines = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n/), out = [], inList = false;
    lines.forEach(function (l) {
      var m = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (m) { if (!inList) { out.push('<ul class="ai-ul">'); inList = true; } out.push('<li>' + m[1] + '</li>'); return; }
      if (inList) { out.push('</ul>'); inList = false; }
      if (l.trim()) out.push('<p>' + l.replace(/^#+\s*/, '') + '</p>');
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  // ---------- UI ----------
  var log, form, input, modeEl, sendBtn, busy = false;
  function bubble(role, html) {
    var d = document.createElement('div');
    d.className = 'ai-msg ' + (role === 'user' ? 'me' : 'bot');
    d.innerHTML = '<div class="ai-who">' + (role === 'user' ? 'შენ' : 'Portfolio AI') + '</div><div class="ai-body">' + html + '</div>';
    log.appendChild(d);
    log.scrollTop = log.scrollHeight; // scroll inside the chat box only — never jump the page
    return d;
  }
  function ask(q) {
    q = (q || '').trim(); if (!q || busy) return;
    busy = true; sendBtn.disabled = true;
    bubble('user', esc(q));
    input.value = '';
    HISTORY.push({ role: 'user', content: q });
    if (!REMOTE) { setTimeout(function () { finish(localAnswer(q), null); }, 180); return; }
    if (REMOTE === 'llm' && window.TP_AI_LLM) {
      var w2 = bubble('bot', '<p class="mut ai-dots">ვფიქრობ</p>');
      window.TP_AI_LLM(HISTORY.slice(-8), buildContext()).then(function (txt) { w2.remove(); finish(md(txt), txt); })
        .catch(function () { w2.remove(); finish(localAnswer(q) + '<div class="ai-src">AI ახლა მიუწვდომელია — პასუხი ლოკალური ძრავიდანაა.</div>', null); });
      return;
    }
    var wait = bubble('bot', '<p class="mut ai-dots">ვფიქრობ</p>');
    fetch(REMOTE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: HISTORY.slice(-8), context: buildContext() }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        wait.remove();
        if (d && d.ok && d.answer) finish(md(d.answer), d.answer);
        else finish(localAnswer(q) + '<div class="ai-src">Claude ახლა მიუწვდომელია — პასუხი ლოკალური ძრავიდანაა.</div>', null);
      })
      .catch(function () { wait.remove(); finish(localAnswer(q), null); });
  }
  function finish(html, raw) {
    bubble('bot', html);
    var txt = raw || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
    HISTORY.push({ role: 'assistant', content: txt });
    if (HISTORY.length > 16) HISTORY = HISTORY.slice(-16);
    busy = false; sendBtn.disabled = false; input.focus({ preventScroll: true });
  }
  function setMode() {
    if (!modeEl) return;
    if (REMOTE === 'llm') { modeEl.innerHTML = '<span class="ai-dot on"></span> Gemini ჩართულია · პასუხები შენს მონაცემებზე დაყრდნობით'; return; }
    var src = E() ? 'შენს მონაცემებზე' : 'საიტის მონაცემებზე';
    modeEl.innerHTML = REMOTE
      ? '<span class="ai-dot on"></span> Claude ჩართულია · პასუხები ' + src + ' დაყრდნობით'
      : '<span class="ai-dot"></span> ლოკალური ძრავა · პასუხები პირდაპირ ' + (E() ? 'შენი მონაცემებიდან' : 'საიტის მონაცემებიდან');
  }
  function getJSON(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function probe(url) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 5000);
    return fetch(url, { method: 'GET', cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { clearTimeout(t); return d && d.enabled ? url : null; })
      .catch(function () { clearTimeout(t); return null; });
  }

  function init() {
    log = document.getElementById('ai-log'); form = document.getElementById('ai-form');
    input = document.getElementById('ai-input'); modeEl = document.getElementById('ai-mode'); sendBtn = document.getElementById('ai-send');
    if (!log || !form) return;
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ask]'), function (b) { b.addEventListener('click', function () { ask(b.getAttribute('data-ask')); }); });
    setMode();

    var base = location.protocol === 'file:' ? '' : '/';
    Promise.all([
      getJSON(base + 'data/prices.json').then(function (d) { KB.prices = d.quotes || {}; KB.pricesUpdated = d.updated; }).catch(function () {}),
      getJSON(base + 'issues/issues.json').then(function (d) { KB.issues = d || []; }).catch(function () {}),
      getJSON(base + 'data/signals.json').then(function (d) { KB.signals = d; }).catch(function () {})
    ]).then(function () {
      var T = totals();
      if (E()) {
        bubble('bot', '<p>გამარჯობა' + (E().userName ? ', <b>' + esc(String(E().userName).split(' ')[0]) + '</b>' : '') + '! მე ვარ <b>Portfolio AI</b> — ვიცი შენი ყველა წიგნი, პოზიცია და ტრანზაქცია.</p>' +
          '<p>ახლა: პორტფელი <b>' + usd(T.value) + '</b>, წმინდა შედეგი <b class="' + cls(T.pnl) + '">' + sUsd(T.pnl) + ' (' + pct(T.pnlPct) + ')</b>. რა გაინტერესებს?</p>');
        return;
      }
      bubble('bot', '<p>გამარჯობა — მე ვარ <b>Portfolio AI</b>. ეს დემოა: ვკითხულობ ლაშას რეალურ პორტფელს (BOG · TBC · GALT) — ყველა ტრანზაქციას, დივიდენდს, საკომისიოს და გამოცემას.</p>' +
        '<p>მოკლედ ახლა: პორტფელი <b>' + usd(T.value) + '</b>, წმინდა შედეგი <b class="' + cls(T.pnl) + '">' + sUsd(T.pnl) + ' (' + pct(T.pnlPct) + ')</b>. რა გაინტერესებს?</p>');
    });

    // Claude mode: same-origin on Cloudflare Pages, cross-origin from the GitHub mirror.
    if (window.TP_AI_LLM) { REMOTE = 'llm'; setMode(); return; }
    var cfg = window.TP_AI_CONFIG || {}, cands = [];
    if (cfg.endpoint) cands.push(cfg.endpoint);
    if (/pages\.dev$/.test(location.hostname)) cands.push('/api/ai');
    else if (location.protocol !== 'file:' && cfg.tryPagesDev !== false) cands.push('https://thetradingpaper.pages.dev/api/ai');
    (function next(i) {
      if (i >= cands.length) return;
      probe(cands[i]).then(function (u) { if (u) { REMOTE = u; setMode(); } else next(i + 1); });
    })(0);
  }

  // exposed for testing / other pages
  window.TP_AI = { answer: localAnswer, context: buildContext, totals: totals, _kb: KB };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
