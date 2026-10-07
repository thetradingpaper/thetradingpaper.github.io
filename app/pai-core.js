// ============================================================
// Portfolio AI — core (accounts · storage · engine · prices · nav)
// Window API: window.PAI
//   PAI.auth      — register / login / logout / current
//   PAI.save(acc) — persist the logged-in account
//   PAI.compute(acc, ctx) — portfolio maths (same rules as the cabinet)
//   PAI.market    — quotes (prices.json → Finnhub → Yahoo), FX, metadata
//   PAI.ui        — app nav, toasts, formatting
// Storage: this device (localStorage) by default; Supabase when
// PAI_CONFIG.supabaseUrl + supabaseAnonKey are set.
// Rules kept from The Trading Paper:
//   · internal transfers never change total deposited
//   · every fee is recorded and counted
//   · P/L = value + withdrawn − deposited; losses are never hidden
// ============================================================
(function () {
  'use strict';
  var CFG = window.PAI_CONFIG || {};
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var K = { accounts: 'pai.accounts.v1', session: 'pai.session.v1', secrets: 'pai.secrets.v1', quotes: 'pai.cache.quotes', meta: 'pai.cache.meta', fx: 'pai.cache.fx' };
  var ROOT = location.protocol === 'file:' ? '../' : '/';

  // ---------------- brokers (Georgia + international) ----------------
  var BROKERS = [
    { id: 'bog', name: 'Bank of Georgia', short: 'BOG', country: 'GE', currency: 'USD', color: '#b91c1c' },
    { id: 'tbc', name: 'TBC Capital', short: 'TBC', country: 'GE', currency: 'USD', color: '#0e7490' },
    { id: 'galt', name: 'Galt & Taggart', short: 'GALT', country: 'GE', currency: 'USD', color: '#8b6914' },
    { id: 'liberty', name: 'Liberty Bank', short: 'Liberty', country: 'GE', currency: 'GEL', color: '#1d4ed8' },
    { id: 'ibkr', name: 'Interactive Brokers', short: 'IBKR', country: 'INT', currency: 'USD', color: '#d81e05' },
    { id: 't212', name: 'Trading 212', short: 'T212', country: 'INT', currency: 'EUR', color: '#0a85c2' },
    { id: 'revolut', name: 'Revolut', short: 'Revolut', country: 'INT', currency: 'EUR', color: '#191c1f' },
    { id: 'etoro', name: 'eToro', short: 'eToro', country: 'INT', currency: 'USD', color: '#13c636' },
    { id: 'freedom24', name: 'Freedom24', short: 'F24', country: 'INT', currency: 'USD', color: '#4caf50' },
    { id: 'xtb', name: 'XTB', short: 'XTB', country: 'INT', currency: 'EUR', color: '#c8102e' },
    { id: 'traderepublic', name: 'Trade Republic', short: 'TR', country: 'DE', currency: 'EUR', color: '#111111' },
    { id: 'scalable', name: 'Scalable Capital', short: 'Scalable', country: 'DE', currency: 'EUR', color: '#2b2b6b' },
    { id: 'degiro', name: 'DEGIRO', short: 'DEGIRO', country: 'NL', currency: 'EUR', color: '#00a3e0' },
    { id: 'saxo', name: 'Saxo Bank', short: 'Saxo', country: 'DK', currency: 'EUR', color: '#003d7a' },
    { id: 'robinhood', name: 'Robinhood', short: 'Robinhood', country: 'US', currency: 'USD', color: '#00c805' },
    { id: 'schwab', name: 'Charles Schwab', short: 'Schwab', country: 'US', currency: 'USD', color: '#00a0df' },
    { id: 'fidelity', name: 'Fidelity', short: 'Fidelity', country: 'US', currency: 'USD', color: '#368727' },
    { id: 'vanguard', name: 'Vanguard', short: 'Vanguard', country: 'US', currency: 'USD', color: '#96151d' },
    { id: 'other', name: 'სხვა ბროკერი', short: 'სხვა', country: 'INT', currency: 'USD', color: '#6b6b6b' }
  ];
  var CUR = { USD: '$', EUR: '€', GEL: '₾', GBP: '£', CHF: 'CHF ', TRY: '₺' };
  var PALETTE = ['#b91c1c', '#0e7490', '#8b6914', '#166534', '#7c3aed', '#c2410c', '#1d4ed8', '#be185d', '#4d7c0f', '#0f766e'];

  function brokerById(id) { for (var i = 0; i < BROKERS.length; i++) if (BROKERS[i].id === id) return BROKERS[i]; return BROKERS[BROKERS.length - 1]; }
  function brokerFromText(t) {
    var s = String(t || '').toLowerCase();
    var map = [[/bank of georgia|საქართველოს ბანკ|\bbog\b|ფასიანი ქაღალდის შეძენა|ფასიანი ქაღალდის გაყიდვა/, 'bog'], [/tbc|თიბისი/, 'tbc'], [/galt|taggart|გალტ/, 'galt'],
      [/liberty|ლიბერთი/, 'liberty'], [/interactive brokers|ibkr/, 'ibkr'], [/trading ?212/, 't212'], [/revolut/, 'revolut'], [/etoro/, 'etoro'],
      [/freedom ?24|freedom finance/, 'freedom24'], [/\bxtb\b/, 'xtb'], [/trade republic/, 'traderepublic'], [/scalable/, 'scalable'], [/degiro/, 'degiro'],
      [/saxo/, 'saxo'], [/robinhood/, 'robinhood'], [/schwab/, 'schwab'], [/fidelity/, 'fidelity'], [/vanguard/, 'vanguard']];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(s)) return map[i][1];
    return null;
  }

  // ---------------- utils ----------------
  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function r2(n) { return Math.round((+n || 0) * 100) / 100; }
  function money(n, cur) {
    cur = cur || 'USD'; n = +n || 0;
    var s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var neg = n < 0 ? '−' : '';
    if (cur === 'GEL') return neg + s + ' ₾';
    return neg + (CUR[cur] || (cur + ' ')) + s;
  }
  function smoney(n, cur) { return (n >= 0 ? '+' : '−') + money(Math.abs(n), cur); }
  function pct(n) { return (n >= 0 ? '+' : '−') + Math.abs(n || 0).toFixed(2) + '%'; }
  function cls(n) { return n >= 0 ? 'pos' : 'neg'; }
  var MON = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
  var MONFULL = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
  function gDate(iso) { if (!iso) return '—'; var p = String(iso).slice(0, 10).split('-'); if (p.length < 3) return esc(iso); return (+p[2]) + ' ' + MON[(+p[1]) - 1] + ' ' + p[0]; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function shares(n) { return (+n).toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); }
  async function sha256(s) {
    if (window.crypto && crypto.subtle) {
      var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; } return 'weak' + h;
  }

  // ---------------- secrets (device-level, never synced) ----------------
  var secrets = {
    get: function () { return LS.get(K.secrets, {}); },
    set: function (o) { LS.set(K.secrets, Object.assign(secrets.get(), o)); }
  };

  // ---------------- site-linked books (Lasha's real portfolio) ----------------
  var SITE_META = {
    bog: { broker: 'bog', color: '#b91c1c' },
    tbc: { broker: 'tbc', color: '#0e7490' },
    galt: { broker: 'galt', color: '#8b6914' }
  };
  function siteBooks() {
    var P = window.PORTFOLIOS || {}, M = window.MEPORTF || {}, out = [];
    var feeMap = {}; (M.feesByBook || []).forEach(function (f) { feeMap[String(f.book).toLowerCase()] = f.amount; });
    Object.keys(P).forEach(function (k) {
      var p = P[k]; if (!p) return;
      var dep = p.priorDeposits || 0, wd = 0, fees = 0, divs = 0;
      (p.transactions || []).forEach(function (t) {
        if (t.type === 'deposit') dep += t.amount;
        if (t.type === 'withdraw') wd += t.amount;
        if (t.type === 'buy' || t.type === 'sell') fees += (t.commission || 0);
        if (t.type === 'fee') fees += t.amount;
        if (t.type === 'dividend') divs += (+t.amount || 0);
      });
      var nm = String(p.name || k).toLowerCase();
      var fb = feeMap[nm] != null ? feeMap[nm] : (k === 'galt' ? feeMap['galt & taggart'] : null);
      var meta = SITE_META[k] || { broker: 'other', color: PALETTE[out.length % PALETTE.length] };
      out.push({
        id: k, name: p.name || k.toUpperCase(), broker: meta.broker, currency: 'USD', color: meta.color,
        note: p.tagline || '', closed: p.status === 'closed', site: true, startDate: p.startDate,
        opening: {
          deposits: dep, withdrawn: wd, cash: p.cash || 0, fees: fb != null ? fb : fees, dividends: divs,
          holdings: (p.holdings || []).map(function (h) { return { ticker: h.ticker, name: h.name, shares: h.shares, cost: h.invested, divYield: h.divYield || 0 }; }),
          history: (p.transactions || []).map(function (t) {
            return { date: t.date, type: t.type, ticker: t.ticker || null, shares: t.shares || null, price: t.price || null, fee: t.commission || 0, amount: t.amount != null ? t.amount : null, note: t.note || '' };
          }),
          galt: k === 'galt' ? (M.galt || null) : null
        }
      });
    });
    return out;
  }
  function txKey(t) { return [t.date, t.type, t.ticker || '', t.shares ? (+t.shares).toFixed(6) : '', t.amount != null && !t.shares ? (+t.amount).toFixed(2) : ''].join('|'); }
  // merge fresh site data into a linked account; drop local tx the site already has
  function hydrate(acc) {
    if (!acc) return acc;
    acc.books = acc.books || []; acc.tx = acc.tx || []; acc.settings = acc.settings || {};
    if (acc.linkSite && window.PORTFOLIOS) {
      var sb = siteBooks(), seen = {};
      sb.forEach(function (b) { b.opening.history.forEach(function (t) { seen[b.id + '|' + txKey(t)] = 1; }); });
      var local = acc.books.filter(function (b) { return !b.site; });
      acc.books = sb.concat(local);
      acc.tx = acc.tx.filter(function (t) { return !seen[t.bookId + '|' + txKey(t)]; });
    }
    return acc;
  }
  function dehydrate(acc) { // what we persist (site books are rebuilt on load)
    var c = JSON.parse(JSON.stringify(acc));
    if (c.linkSite) c.books = c.books.filter(function (b) { return !b.site; });
    return c;
  }

  function newAccount(o) {
    return { v: 1, id: o.id || uid('u'), email: (o.email || '').toLowerCase(), name: o.name || '', createdAt: new Date().toISOString(), plan: 'free', linkSite: !!o.linkSite,
      settings: { currency: 'USD', autoAdd: true, autoDeposit: true, taxPct: 30 }, books: [], tx: [], manualPrices: {} };
  }
  function addBook(acc, brokerId, name, currency) {
    var br = brokerById(brokerId);
    var used = acc.books.map(function (b) { return b.color; });
    var color = used.indexOf(br.color) === -1 ? br.color : (PALETTE.filter(function (c) { return used.indexOf(c) === -1; })[0] || br.color);
    var b = { id: uid('b'), name: name || br.short || br.name, broker: br.id, currency: currency || br.currency, color: color, note: '', closed: false, createdAt: today() };
    acc.books.push(b); return b;
  }

  // ---------------- storage adapters ----------------
  var local = {
    mode: 'local',
    _all: function () { return LS.get(K.accounts, { byId: {}, email: {} }); },
    _put: function (all) { return LS.set(K.accounts, all); },
    async register(email, pass, name) {
      email = String(email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('ელფოსტა არასწორია');
      if (String(pass || '').length < 6) throw new Error('პაროლი მინიმუმ 6 სიმბოლო');
      var all = this._all(); if (all.email[email]) throw new Error('ეს ელფოსტა უკვე რეგისტრირებულია — შედი');
      var acc = newAccount({ email: email, name: name || email.split('@')[0] });
      var salt = uid('s'); acc.auth = { salt: salt, hash: await sha256(salt + ':' + pass) };
      all.byId[acc.id] = acc; all.email[email] = acc.id; this._put(all); LS.set(K.session, acc.id);
      return hydrate(acc);
    },
    async login(email, pass) {
      email = String(email || '').trim().toLowerCase();
      var all = this._all(), id = all.email[email], acc = id && all.byId[id];
      if (!acc) throw new Error('ასეთი ანგარიში ამ მოწყობილობაზე არ არის — დარეგისტრირდი');
      if (acc.auth && acc.auth.hash !== await sha256(acc.auth.salt + ':' + pass)) throw new Error('პაროლი არასწორია');
      LS.set(K.session, acc.id); return hydrate(acc);
    },
    async demo() {
      var all = this._all(), id = 'lasha';
      if (!all.byId[id]) { var acc = newAccount({ id: id, email: 'lasha@thetradingpaper', name: 'ლაშა ფხაკაძე', linkSite: true }); all.byId[id] = acc; all.email[acc.email] = id; this._put(all); }
      LS.set(K.session, id); return hydrate(all.byId[id]);
    },
    async current() { var id = LS.get(K.session, null); if (!id) return null; var all = this._all(); return all.byId[id] ? hydrate(all.byId[id]) : null; },
    async save(acc) { var all = this._all(); var keepAuth = all.byId[acc.id] && all.byId[acc.id].auth; var c = dehydrate(acc); if (keepAuth) c.auth = keepAuth; all.byId[acc.id] = c; if (c.email) all.email[c.email] = c.id; return this._put(all); },
    async logout() { LS.del(K.session); },
    async remove(acc) { var all = this._all(); delete all.byId[acc.id]; if (acc.email) delete all.email[acc.email]; this._put(all); LS.del(K.session); }
  };

  var cloud = {
    mode: 'cloud', sb: null,
    async client() {
      if (this.sb) return this.sb;
      if (!window.supabase) await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      this.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
      return this.sb;
    },
    async _load(user) {
      var sb = await this.client();
      var r = await sb.from('pai_portfolios').select('data').eq('user_id', user.id).maybeSingle();
      var acc = r.data && r.data.data;
      if (!acc) { acc = newAccount({ id: user.id, email: user.email, name: (user.user_metadata && user.user_metadata.name) || user.email.split('@')[0] }); await this.save(acc); }
      acc.id = user.id; return hydrate(acc);
    },
    async register(email, pass, name) {
      var sb = await this.client();
      var r = await sb.auth.signUp({ email: email, password: pass, options: { data: { name: name } } });
      if (r.error) throw new Error(r.error.message);
      if (!r.data.session) throw new Error('დაადასტურე ელფოსტა — ბმული გამოგიგზავნეთ');
      return this._load(r.data.user);
    },
    async login(email, pass) {
      var sb = await this.client();
      var r = await sb.auth.signInWithPassword({ email: email, password: pass });
      if (r.error) throw new Error(r.error.message === 'Invalid login credentials' ? 'ელფოსტა ან პაროლი არასწორია' : r.error.message);
      return this._load(r.data.user);
    },
    async demo() { return local.demo(); },
    async current() {
      if (LS.get(K.session, null) === 'lasha') return local.current();
      var sb = await this.client(); var r = await sb.auth.getUser();
      return r.data && r.data.user ? this._load(r.data.user) : null;
    },
    async save(acc) {
      if (acc.id === 'lasha') return local.save(acc);
      var sb = await this.client();
      var r = await sb.from('pai_portfolios').upsert({ user_id: acc.id, data: dehydrate(acc), updated_at: new Date().toISOString() });
      if (r.error) throw new Error(r.error.message); return true;
    },
    async logout() { LS.del(K.session); try { var sb = await this.client(); await sb.auth.signOut(); } catch (e) {} },
    async remove(acc) { var sb = await this.client(); await sb.from('pai_portfolios').delete().eq('user_id', acc.id); await this.logout(); }
  };
  var store = (CFG.supabaseUrl && CFG.supabaseAnonKey) ? cloud : local;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[data-src="' + src + '"]')) { res(); return; }
      var s = document.createElement('script'); s.src = src; s.async = true; s.setAttribute('data-src', src);
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error('load failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  // ---------------- market data ----------------
  var FINNHUB_PUBLIC = 'd91t069r01qsj27o4k8gd91t069r01qsj27o4k90'; // same public read-only key the site already uses
  function finnhubKey() { var s = secrets.get(); return (s.finnhubKey || '').trim() || FINNHUB_PUBLIC; }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]); }
  async function getJSON(url, ms) { var r = await withTimeout(fetch(url, { cache: 'no-store' }), ms || 8000); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }

  var market = {
    snapshotUpdated: null,
    async quotes(tickers, opts) {
      opts = opts || {};
      var uniq = Array.from(new Set((tickers || []).filter(Boolean)));
      var cache = LS.get(K.quotes, {}), now = Date.now(), out = {};
      try {
        var snap = await getJSON(ROOT + 'data/prices.json', 6000); market.snapshotUpdated = snap.updated;
        Object.keys(snap.quotes || {}).forEach(function (t) { var q = snap.quotes[t]; if (q && q.price) out[t] = { price: +q.price, prev: q.previousClose ? +q.previousClose : null, src: 'snapshot' }; });
      } catch (e) {}
      var need = uniq.filter(function (t) { var c = cache[t]; if (c && now - c.t < 60000) { out[t] = c.q; return false; } return true; });
      var key = finnhubKey(), i = 0;
      async function worker() {
        while (i < need.length) {
          var t = need[i++];
          var q = null;
          try {
            var d = await getJSON('https://finnhub.io/api/v1/quote?symbol=' + encodeURIComponent(t) + '&token=' + encodeURIComponent(key), 6000);
            if (d && d.c) q = { price: +d.c, prev: d.pc ? +d.pc : null, src: 'live' };
          } catch (e) {}
          if (!q && /\.|^[A-Z]{1,5}$/.test(t) && !out[t]) {
            try {
              var y = await getJSON('https://corsproxy.io/?url=' + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(t) + '?interval=1d&range=5d'), 7000);
              var m = y && y.chart && y.chart.result && y.chart.result[0] && y.chart.result[0].meta;
              if (m && m.regularMarketPrice) q = { price: +m.regularMarketPrice, prev: +(m.chartPreviousClose || m.previousClose || m.regularMarketPrice), src: 'live', currency: m.currency };
            } catch (e) {}
          }
          if (q) { out[t] = q; cache[t] = { q: q, t: Date.now() }; }
        }
      }
      if (!opts.snapshotOnly) await Promise.all([worker(), worker(), worker(), worker()]);
      LS.set(K.quotes, cache);
      return out;
    },
    async meta(ticker) { // name + dividend yield (cached 1 day)
      var cache = LS.get(K.meta, {}), c = cache[ticker];
      if (c && Date.now() - c.t < 86400000) return c.m;
      var m = { name: null, divYield: null, currency: null };
      try {
        var key = finnhubKey();
        var p = await getJSON('https://finnhub.io/api/v1/stock/profile2?symbol=' + encodeURIComponent(ticker) + '&token=' + key, 6000);
        if (p && p.name) { m.name = p.name; m.currency = p.currency || null; }
        var f = await getJSON('https://finnhub.io/api/v1/stock/metric?symbol=' + encodeURIComponent(ticker) + '&metric=all&token=' + key, 6000);
        var y = f && f.metric && (f.metric.dividendYieldIndicatedAnnual != null ? f.metric.dividendYieldIndicatedAnnual : f.metric.currentDividendYieldTTM);
        if (y != null && isFinite(y)) m.divYield = +(+y).toFixed(2);
      } catch (e) {}
      cache[ticker] = { m: m, t: Date.now() }; LS.set(K.meta, cache);
      return m;
    },
    async fx() {
      var c = LS.get(K.fx, null);
      if (c && Date.now() - c.t < 6 * 3600000) return c.rates;
      var fallback = { USD: 1, EUR: 0.86, GEL: 2.70, GBP: 0.75, CHF: 0.80, TRY: 41 };
      try { var d = await getJSON('https://open.er-api.com/v6/latest/USD', 6000); if (d && d.rates && d.rates.GEL) { LS.set(K.fx, { rates: d.rates, t: Date.now() }); return d.rates; } } catch (e) {}
      return (c && c.rates) || fallback;
    }
  };

  // ---------------- engine ----------------
  // ctx: { quotes:{T:{price,prev}}, rates:{CUR:per USD}, display:'USD' }
  function compute(acc, ctx) {
    ctx = ctx || {}; var quotes = ctx.quotes || {}, rates = ctx.rates || { USD: 1 }, disp = ctx.display || (acc.settings && acc.settings.currency) || 'USD';
    var manual = acc.manualPrices || {}, taxPct = acc.settings && acc.settings.taxPct != null ? +acc.settings.taxPct : 30;
    function conv(n, from) { if (from === disp) return n; var rf = rates[from] || 1, rt = rates[disp] || 1; return n / rf * rt; }
    var books = [], allRows = [], allTx = [], realizedAll = [], warnings = [];
    acc.books.forEach(function (b) {
      var op = b.opening || {};
      var st = { dep: op.deposits || 0, wd: op.withdrawn || 0, cash: op.cash || 0, fees: op.fees || 0, divs: op.dividends || 0 };
      var pos = {};
      (op.holdings || []).forEach(function (h) { pos[h.ticker] = { sh: +h.shares || 0, cost: +h.cost || 0, name: h.name, divYield: h.divYield || 0 }; });
      // realized from site history (display only — opening already includes it)
      var hist = (op.history || []).slice().map(function (t, i) { return Object.assign({ _i: i }, t); })
        .sort(function (a, b2) { return a.date < b2.date ? -1 : a.date > b2.date ? 1 : b2._i - a._i; });
      var hp = {};
      hist.forEach(function (t) {
        allTx.push(Object.assign({ book: b.id, hist: true }, t));
        if (!t.ticker) return; var s = hp[t.ticker] || (hp[t.ticker] = { sh: 0, cost: 0 });
        if (t.type === 'buy') { s.sh += t.shares; s.cost += t.shares * t.price + (t.fee || 0); }
        if (t.type === 'sell' && s.sh > 1e-9) { var q = Math.min(t.shares, s.sh), avg = s.cost / s.sh, recv = q * t.price - (t.fee || 0), basis = q * avg; realizedAll.push({ book: b.id, ticker: t.ticker, date: t.date, pl: recv - basis, plPct: basis ? (recv - basis) / basis * 100 : 0, cur: b.currency }); s.sh -= q; s.cost -= basis; if (s.sh < 1e-9) { s.sh = 0; s.cost = 0; } }
      });
      // live transactions for this book
      var txs = acc.tx.filter(function (t) { return t.bookId === b.id; }).map(function (t, i) { return Object.assign({ _i: i }, t); })
        .sort(function (a, b2) { return a.date < b2.date ? -1 : a.date > b2.date ? 1 : a._i - b2._i; });
      txs.forEach(function (t) {
        allTx.push(Object.assign({ book: b.id }, t));
        var fee = +t.fee || 0;
        if (t.type === 'deposit') { st.dep += +t.amount; st.cash += +t.amount; }
        else if (t.type === 'withdraw') { st.wd += +t.amount; st.cash -= +t.amount; }
        else if (t.type === 'dividend') { st.divs += +t.amount; st.cash += +t.amount; }
        else if (t.type === 'fee') { st.fees += +t.amount; st.cash -= +t.amount; }
        else if (t.type === 'buy') {
          var p = pos[t.ticker] || (pos[t.ticker] = { sh: 0, cost: 0, name: t.name, divYield: 0 });
          var c = t.shares * t.price + fee; p.sh += +t.shares; p.cost += c; st.cash -= c; st.fees += fee; if (t.name && !p.name) p.name = t.name;
        } else if (t.type === 'sell') {
          var p2 = pos[t.ticker] || (pos[t.ticker] = { sh: 0, cost: 0, name: t.name, divYield: 0 });
          var recv = t.shares * t.price - fee; st.cash += recv; st.fees += fee;
          if (p2.sh > 1e-9) { var q = Math.min(+t.shares, p2.sh), avg = p2.cost / p2.sh, basis = q * avg; realizedAll.push({ book: b.id, ticker: t.ticker, date: t.date, pl: (q * t.price - fee) - basis, plPct: basis ? ((q * t.price - fee) - basis) / basis * 100 : 0, cur: b.currency }); p2.sh -= q; p2.cost -= basis; if (p2.sh < 1e-9) { p2.sh = 0; p2.cost = 0; } }
          else warnings.push('გაყიდვა ' + t.ticker + ' (' + gDate(t.date) + ') — პოზიცია არ მოიძებნა');
        }
      });
      if (st.cash < -0.01) warnings.push(b.name + ': ნაღდი უარყოფითია (' + money(st.cash, b.currency) + ') — დაამატე დეპოზიტი');
      var rows = [];
      Object.keys(pos).forEach(function (tk) {
        var p = pos[tk]; if (p.sh <= 1e-9) return;
        var q = quotes[tk], price = manual[tk] != null ? +manual[tk] : (q && q.price ? q.price : (p.cost / p.sh)), live = manual[tk] == null && !!(q && q.price);
        var value = p.sh * price, pl = value - p.cost;
        var prev = live && q.prev ? q.prev : null;
        var meta = (ctx.meta || {})[tk] || {};
        var dy = p.divYield || meta.divYield || 0;
        var row = { book: b.id, bookName: b.name, color: b.color, cur: b.currency, ticker: tk, name: p.name || meta.name || tk, shares: p.sh, avgBuy: p.cost / p.sh, invested: p.cost,
          price: price, live: live, manual: manual[tk] != null, value: value, pl: pl, plPct: p.cost ? pl / p.cost * 100 : 0, day: prev ? (price - prev) / prev * 100 : null, dayAbs: prev ? p.sh * (price - prev) : 0, divYield: dy };
        rows.push(row); allRows.push(row);
      });
      rows.sort(function (a, b2) { return b2.value - a.value; });
      var value = rows.reduce(function (s, r) { return s + r.value; }, 0) + st.cash;
      var net = st.dep - st.wd, pnl = value + st.wd - st.dep;
      var dayAbs = rows.reduce(function (s, r) { return s + r.dayAbs; }, 0);
      var annualDiv = rows.reduce(function (s, r) { return s + r.value * (r.divYield || 0) / 100; }, 0) * (1 - taxPct / 100);
      // Lasha's site-linked TBC book: use the cabinet's per-share dividend schedule (same number as the site)
      if (b.site && b.id === 'tbc' && window.TP_DIVIDENDS && taxPct === 30) { try { annualDiv = window.TP_DIVIDENDS.getSummary().annualNet; } catch (e) {} }
      var pctBase = net > 0 ? net : 0;
      if (op.galt && op.galt.deposit) pctBase = op.galt.deposit;               // closed GALT: % of the money put in, like the cabinet
      books.push({ id: b.id, key: b.id, name: b.name, full: brokerById(b.broker).name, broker: b.broker, currency: b.currency, color: b.color, closed: !!b.closed, site: !!b.site, note: b.note, tagline: b.note,
        deposits: st.dep, withdrawn: st.wd, netInvested: net, fees: st.fees, dividends: st.divs, cash: st.cash, value: value, pnl: pnl, pnlPct: pctBase > 0 ? pnl / pctBase * 100 : 0,
        dayAbs: dayAbs, annualDiv: annualDiv, rows: rows, galt: op.galt || null, startDate: b.startDate || b.createdAt });
    });
    allTx.sort(function (a, b2) { return a.date < b2.date ? 1 : a.date > b2.date ? -1 : (a.hist === b2.hist ? 0 : a.hist ? 1 : -1); });
    var T = { value: 0, deposited: 0, withdrawn: 0, netInvested: 0, pnl: 0, fees: 0, dividends: 0, dayAbs: 0, annualDiv: 0 };
    books.forEach(function (b) {
      T.value += conv(b.value, b.currency); T.deposited += conv(b.deposits, b.currency); T.withdrawn += conv(b.withdrawn, b.currency);
      T.fees += conv(b.fees, b.currency); T.dividends += conv(b.dividends, b.currency); T.dayAbs += conv(b.dayAbs, b.currency); T.annualDiv += conv(b.annualDiv, b.currency);
    });
    T.netInvested = T.deposited - T.withdrawn; T.pnl = T.value - T.netInvested; T.pnlPct = T.netInvested > 0 ? T.pnl / T.netInvested * 100 : 0;
    var prevVal = T.value - T.dayAbs; T.dayPct = prevVal > 0 ? T.dayAbs / prevVal * 100 : 0;
    allRows.forEach(function (r) { r.valueD = conv(r.value, r.cur); r.plD = conv(r.pl, r.cur); });
    allRows.sort(function (a, b2) { return b2.valueD - a.valueD; });
    return { display: disp, totals: T, books: books, rows: allRows, tx: allTx, realized: realizedAll, warnings: warnings, conv: conv, taxPct: taxPct };
  }

  // Adapter so js/paper-ai.js (the assistant) works on any account — all money in display currency
  function assistantEngine(acc, model, extra) {
    var d = model.display, conv = model.conv;
    var bookById = {}; model.books.forEach(function (b) { bookById[b.id] = b; });
    function rowD(r) { return { book: r.book, ticker: r.ticker, name: r.name, shares: r.shares, avgBuy: conv(r.avgBuy, r.cur), invested: conv(r.invested, r.cur), price: conv(r.price, r.cur), live: r.live, value: conv(r.value, r.cur), pl: conv(r.pl, r.cur), plPct: r.plPct, day: r.day, divYield: r.divYield }; }
    function bookD(b) {
      var c = function (n) { return conv(n, b.currency); };
      return { key: b.id, name: b.name, full: b.full + (b.currency !== d ? ' (' + b.currency + ')' : ''), closed: b.closed, tagline: b.note || '', deposits: c(b.deposits), withdrawn: c(b.withdrawn), netInvested: c(b.netInvested),
        fees: c(b.fees), dividends: c(b.dividends), value: c(b.value), cash: c(b.cash), pnl: c(b.pnl), pnlPct: b.pnlPct, rows: b.rows.map(rowD), startDate: b.startDate, galt: b.galt };
    }
    return {
      money: function (n) { return money(n, d); },
      userName: acc.name,
      bookKeys: function () { return model.books.map(function (b) { return b.id; }); },
      bookNames: function () { var o = {}; model.books.forEach(function (b) { o[b.id] = [b.name, b.full]; }); return o; },
      bookAgg: function (k) { return bookById[k] ? bookD(bookById[k]) : null; },
      holdingRows: function (k) { return bookById[k] ? bookById[k].rows.map(rowD) : []; },
      allRows: function () { return model.rows.map(rowD); },
      totals: function () { var T = model.totals; return { books: model.books.map(bookD), deposited: T.deposited, withdrawn: T.withdrawn, netInvested: T.netInvested, value: T.value, pnl: T.pnl, pnlPct: T.pnlPct, dividends: T.dividends }; },
      allTx: function () { return model.tx.map(function (t) { var b = bookById[t.book] || {}; return { book: t.book, date: t.date, type: t.type, ticker: t.ticker, shares: t.shares, price: t.price != null ? conv(+t.price, b.currency || d) : null, commission: conv(+t.fee || 0, b.currency || d), amount: t.amount != null ? conv(+t.amount, b.currency || d) : null, note: t.note }; }); },
      realized: function () { return model.realized.map(function (r) { return { book: r.book, ticker: r.ticker, date: r.date, pl: conv(r.pl, r.cur), plPct: r.plPct }; }); },
      meta: function () { return { feesPaid: model.totals.fees, feesByBook: model.books.map(function (b) { return { book: b.name, amount: conv(b.fees, b.currency), note: b.full }; }), transfers: (extra && extra.transfers) || [] }; },
      dividends: function () { return { annualNet: model.totals.annualDiv, monthlyNetAvg: model.totals.annualDiv / 12, nextDividend: null, taxPct: model.taxPct }; },
      price: function (t) { var r = model.rows.filter(function (x) { return x.ticker === t; })[0]; return r ? conv(r.price, r.cur) : null; }
    };
  }

  // ---------------- Gemini (browser, device key) ----------------
  var gemini = {
    key: function () { return (secrets.get().geminiKey || '').trim(); },
    model: function () { return (secrets.get().geminiModel || CFG.geminiModel || 'gemini-3.1-flash-lite').trim(); },
    async generate(parts, opts) {
      opts = opts || {};
      var key = this.key(); if (!key) throw new Error('no key');
      var models = [this.model()]; if (CFG.geminiFallbackModel && models.indexOf(CFG.geminiFallbackModel) === -1) models.push(CFG.geminiFallbackModel);
      var lastErr;
      for (var i = 0; i < models.length; i++) {
        try {
          var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { temperature: opts.temperature != null ? opts.temperature : 0.1, maxOutputTokens: opts.maxTokens || 2048 } };
          if (opts.json) body.generationConfig.responseMimeType = 'application/json';
          if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] };
          var r = await withTimeout(fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[i]) + ':generateContent', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body)
          }), 60000);
          var d = await r.json();
          if (!r.ok) { lastErr = new Error((d && d.error && d.error.message) || ('Gemini HTTP ' + r.status)); if (r.status === 404 || r.status === 400) continue; throw lastErr; }
          var txt = (((d.candidates || [])[0] || {}).content || {}).parts || [];
          return txt.map(function (p) { return p.text || ''; }).join('').trim();
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('Gemini failed');
    }
  };

  // ---------------- UI helpers ----------------
  function toast(msg, kind, undo) {
    var t = document.createElement('div'); t.className = 'pai-toast ' + (kind || '');
    t.innerHTML = '<span>' + msg + '</span>' + (undo ? ' <button type="button">გაუქმება</button>' : '');
    document.body.appendChild(t);
    if (undo) t.querySelector('button').onclick = function () { undo(); t.remove(); };
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, undo ? 9000 : 3500);
  }
  function nav(active, acc) {
    var tabs = [['index', 'დაფა', 'index.html'], ['editor', 'რედაქტორი', 'editor.html'], ['paper', 'გაზეთი', 'paper.html'], ['assistant', 'ასისტენტი', 'index.html#assistant'], ['settings', 'პარამეტრები', 'settings.html']];
    var el = document.createElement('div'); el.className = 'pai-nav no-print';
    var initials = String(acc && acc.name || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    el.innerHTML = '<div class="pai-nav-in"><a class="pai-brand" href="index.html">Portfolio <b>AI</b></a><nav>' +
      tabs.map(function (t) { return '<a href="' + t[2] + '"' + (t[0] === active ? ' class="on"' : '') + '>' + t[1] + '</a>'; }).join('') +
      '</nav><div class="pai-user">' + (acc ? '<span class="pai-av" title="' + esc(acc.email || '') + '">' + esc(initials) + '</span><span class="pai-un">' + esc(acc.name || '') + '</span><a href="login.html?logout=1" class="pai-out">გასვლა</a>' : '<a href="login.html">შესვლა</a>') + '</div></div>';
    var host = document.getElementById('pai-nav-host');
    if (host) host.replaceWith(el); else document.body.insertBefore(el, document.body.firstChild);
    var strip = document.createElement('div'); strip.className = 'pai-mode no-print';
    strip.innerHTML = store.mode === 'cloud' ? '● ღრუბლოვანი ანგარიში' : (acc && acc.linkSite ? '● შენი რეალური პორტფელი — ავტომატურად სინქრონდება The Trading Paper-თან' : '● მონაცემები ინახება ამ მოწყობილობაზე · ექსპორტი — პარამეტრებში');
    strip.innerHTML += ' &nbsp;·&nbsp; <a href="../cabinet.html" style="color:inherit">The Trading Paper</a> · <a href="../ai.html" style="color:inherit">Portfolio AI-ის შესახებ</a>';
    el.appendChild(strip);
  }
  async function requireAuth() {
    var acc = null;
    try { acc = await store.current(); } catch (e) {}
    if (!acc) { location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.hash)); return new Promise(function () {}); }
    return acc;
  }
  var saveTimer = null;
  function save(acc, now) {
    clearTimeout(saveTimer);
    var run = function () { return store.save(acc).catch(function (e) { toast('შენახვა ვერ მოხერხდა: ' + esc(e.message), 'err'); }); };
    if (now) return run();
    saveTimer = setTimeout(run, 250);
  }

  window.PAI = {
    CFG: CFG, BROKERS: BROKERS, brokerById: brokerById, brokerFromText: brokerFromText,
    auth: store, store: store, save: save, requireAuth: requireAuth, secrets: secrets, gemini: gemini,
    newAccount: newAccount, addBook: addBook, hydrate: hydrate, siteBooks: siteBooks, txKey: txKey,
    compute: compute, assistantEngine: assistantEngine, market: market, loadScript: loadScript,
    util: { uid: uid, esc: esc, r2: r2, money: money, smoney: smoney, pct: pct, cls: cls, gDate: gDate, today: today, shares: shares, MON: MON, MONFULL: MONFULL },
    ui: { nav: nav, toast: toast }
  };
})();
