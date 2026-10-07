// ============================================================
// Portfolio AI — screenshot reader
// Order: 1) Gemini with this device's key  2) server /api/vision
//        3) free in-browser OCR (Tesseract, Georgian + English) + rules
// Output: normalised transactions ready for the editor.
// ============================================================
(function () {
  'use strict';
  var PAI = window.PAI;

  var PROMPT = [
    'You read screenshots from brokerage and banking apps (Georgian, English, German or any language; brokers worldwide: Bank of Georgia, TBC Capital, Galt & Taggart, Interactive Brokers, Trading 212, Revolut, eToro, Trade Republic, etc.).',
    'Extract EVERY executed transaction visible. Return ONLY JSON of this shape:',
    '{"broker": string|null, "transactions": [{"date":"YYYY-MM-DD","time":"HH:MM"|null,"type":"buy|sell|deposit|withdraw|dividend|fee","ticker":string|null,"name":string|null,"shares":number|null,"price":number|null,"amount":number|null,"fee":number|null,"currency":"USD|EUR|GEL|GBP|...","note":string|null}]}',
    'Rules:',
    '- Copy numbers with FULL precision exactly as shown (e.g. 0.02972724, 1681.9588). If a comment/detail line shows a more precise price than the headline, use the precise one.',
    '- "amount" = absolute total cash value of the transaction (positive number).',
    '- Never guess. If a value is not visible use null. Ignore pending, cancelled or rejected orders.',
    '- Georgian: შეძენა/ყიდვა = buy, გაყიდვა = sell, დივიდენდი = dividend, შევსება/ჩარიცხვა/დეპოზიტი = deposit, გატანა/განაღდება = withdraw, საკომისიო = fee.',
    '- ticker = exchange symbol in capitals (e.g. SNDK, VOO, SAP.DE). broker = the app/bank name if recognisable.'
  ].join('\n');

  // ---------- image helpers ----------
  function fileToImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { rej(new Error('სურათი ვერ წავიკითხე')); };
      img.src = url;
    });
  }
  async function toBase64(file, maxSide) {
    var o = await fileToImage(file), img = o.img, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, (maxSide || 1800) / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    var data = c.toDataURL('image/jpeg', 0.9).split(',')[1];
    return { mime: 'image/jpeg', data: data };
  }

  // ---------- number parsing ----------
  function num(s) {
    if (s == null) return null;
    s = String(s).replace(/[\s ]/g, '').replace(/[$€₾£]/g, '').replace(/^[−–-]/, '-');
    if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');      // 1.234,56
    else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');                                      // 12,5
    else s = s.replace(/,/g, '');                                                                 // 1,234.56
    var n = parseFloat(s); return isFinite(n) ? n : null;
  }
  var GMON = { 'იან': 1, 'თებ': 2, 'მარ': 3, 'აპრ': 4, 'მაი': 5, 'ივნ': 6, 'ივლ': 7, 'აგვ': 8, 'სექ': 9, 'ოქტ': 10, 'ნოე': 11, 'დეკ': 12 };
  var EMON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  function pad(n) { return String(n).padStart(2, '0'); }
  function findDate(t) {
    var m = t.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})(?:[ T,]+(\d{1,2}:\d{2}))?/);
    if (m) return { date: m[1] + '-' + pad(m[2]) + '-' + pad(m[3]), time: m[4] || null };
    m = t.match(/(\d{1,2})[./](\d{1,2})[./](20\d{2})(?:[ ,]+(\d{1,2}:\d{2}))?/);
    if (m) return { date: m[3] + '-' + pad(m[2]) + '-' + pad(m[1]), time: m[4] || null };
    m = t.match(/(\d{1,2})\s+(იან|თებ|მარ|აპრ|მაი|ივნ|ივლ|აგვ|სექ|ოქტ|ნოე|დეკ)[ა-ჰ]*[,.]?\s+(20\d{2})/);
    if (m) return { date: m[3] + '-' + pad(GMON[m[2]]) + '-' + pad(m[1]), time: null };
    m = t.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[,.]?\s+(20\d{2})/i);
    if (m) return { date: m[3] + '-' + pad(EMON[m[2].toLowerCase()]) + '-' + pad(m[1]), time: null };
    m = t.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(20\d{2})/i);
    if (m) return { date: m[3] + '-' + pad(EMON[m[1].toLowerCase()]) + '-' + pad(m[2]), time: null };
    return null;
  }
  function firstNum(s) { var m = String(s || '').match(/-?[\d.,]*\d/); return m ? num(m[0]) : null; }
  function currencyOf(t) { if (/₾|\bGEL\b|ლარ/.test(t)) return 'GEL'; if (/€|\bEUR\b/.test(t)) return 'EUR'; if (/£|\bGBP\b/.test(t)) return 'GBP'; return 'USD'; }
  function after(lines, re) { // value on the same line after a label, or the next non-empty line
    for (var i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        var rest = lines[i].replace(re, '').replace(/^[\s:–-]+/, '').trim();
        if (rest) return rest;
        for (var j = i + 1; j < Math.min(lines.length, i + 3); j++) if (lines[j].trim()) return lines[j].trim();
      }
    }
    return null;
  }

  // ---------- rule-based parser for OCR text ----------
  function parseText(text) {
    var t = String(text || '').replace(/\r/g, ''), lines = t.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var out = [], d = findDate(t), cur = currencyOf(t);
    // 1) explicit order comments: "Buy 0.0297 shares of SNDK at 1681.9588"
    var re = /\b(buy|bought|sell|sold)\s+([\d.,]+)\s+(?:shares?\s+(?:of\s+)?)?([A-Z][A-Z0-9.\-]{0,9})\s+(?:at|@)\s*[$€£]?\s*([\d.,]+)/gi, m;
    while ((m = re.exec(t))) {
      out.push({ date: d && d.date, time: d && d.time, type: /^b/i.test(m[1]) ? 'buy' : 'sell', ticker: m[3].toUpperCase(), shares: num(m[2]), price: num(m[4]), amount: null, fee: null, currency: cur, conf: 0.95 });
    }
    // 2) label-based (Georgian bank apps + generic English)
    if (!out.length) {
      var low = t.toLowerCase(), type = null;
      if (/შეძენა|ყიდვა|\bbuy\b|\bbought\b|purchase/.test(low)) type = 'buy';
      else if (/გაყიდვა|\bsell\b|\bsold\b/.test(low)) type = 'sell';
      else if (/დივიდენდ|dividend/.test(low)) type = 'dividend';
      else if (/გატანა|განაღდ|withdraw/.test(low)) type = 'withdraw';
      else if (/შევსება|ჩარიცხვ|დეპოზიტ|deposit|top.?up/.test(low)) type = 'deposit';
      var ticker = after(lines, /^(ინსტრუმენტის იდენტიფიკატორი|იდენტიფიკატორი|ticker|symbol|instrument)(?=$|[\s:])/i);
      if (ticker) ticker = (ticker.match(/[A-Z][A-Z0-9.\-]{0,9}/) || [null])[0];
      if (!ticker) { var STOP = /^(USD|EUR|GEL|GBP|FULL|BUY|SELL|ETF|AM|PM|OK|ID|NEW)$/; for (var li = 0; li < lines.length; li++) { if (/^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(lines[li]) && !STOP.test(lines[li])) { ticker = lines[li]; break; } } }
      var qty = firstNum(after(lines, /^(ფასიანი ქაღალდების რაოდენობა|რაოდენობა|quantity|qty|shares|units)(?=$|[\s:])/i));
      var price = firstNum(after(lines, /^(ფასიანი ქაღალდების ფასი|ერთეულის ფასი|ფასი|price|avg\.? price|execution price)(?=$|[\s:])/i));
      var amtLine = after(lines, /^(ტრანზაქციის თანხა|თანხა|amount|total|net amount)(?=$|[\s:])/i);
      var amount = amtLine ? Math.abs(firstNum(amtLine) || 0) || null : null;
      if (amount == null) { var am = t.match(/[−–+-]\s*([\d.,]+)\s*[$€₾£]/); if (am) amount = num(am[1]); }
      var feeL = after(lines, /^(საკომისიო|commission|fee|fees)(?=$|[\s:])/i);
      var fee = feeL ? firstNum(feeL) : null;
      if (type) out.push({ date: d && d.date, time: d && d.time, type: type, ticker: ticker, shares: qty, price: price, amount: amount, fee: fee, currency: cur, conf: 0.7 });
    }
    // fill fee/amount from labels for comment-parsed rows
    if (out.length === 1 && out[0].conf > 0.9) {
      var a2 = after(lines, /^(ტრანზაქციის თანხა|თანხა|amount|total)(?=$|[\s:])/i); if (a2) out[0].amount = Math.abs(firstNum(a2) || 0) || null;
      var f2 = after(lines, /^(საკომისიო|commission|fee)(?=$|[\s:])/i); if (f2) out[0].fee = firstNum(f2);
      var nm = after(lines, /^(ინსტრუმენტის დასახელება|instrument name|name)(?=$|[\s:])/i); if (nm) out[0].name = nm;
    }
    return { broker: PAI.brokerFromText(t), transactions: out };
  }

  // ---------- normalise any engine's output ----------
  function normalise(list, defaults) {
    return (list || []).map(function (x) {
      var t = {
        date: x.date || defaults.date, time: x.time || null, type: String(x.type || '').toLowerCase(), ticker: x.ticker ? String(x.ticker).toUpperCase().trim() : null, name: x.name || null,
        shares: x.shares != null ? +x.shares : null, price: x.price != null ? +x.price : null, amount: x.amount != null ? Math.abs(+x.amount) : null, fee: x.fee != null ? Math.abs(+x.fee) : 0,
        currency: (x.currency || defaults.currency || 'USD').toUpperCase(), note: x.note || '', conf: x.conf != null ? x.conf : 0.9
      };
      if (t.type === 'bought' || t.type === 'purchase') t.type = 'buy';
      if (t.type === 'sold') t.type = 'sell';
      if (t.type === 'buy' || t.type === 'sell') {
        if (t.shares && t.price && t.amount == null) t.amount = PAI.util.r2(t.shares * t.price + (t.type === 'buy' ? t.fee : -t.fee));
        if (!t.shares && t.price && t.amount) t.shares = +((t.amount - (t.type === 'buy' ? t.fee : -t.fee)) / t.price).toFixed(8);
        if (t.shares && !t.price && t.amount) t.price = +((t.amount - (t.type === 'buy' ? t.fee : -t.fee)) / t.shares).toFixed(6);
        // amount shown by the app vs shares×price → implied fee (only if clearly positive)
        if (t.shares && t.price && t.amount && !t.fee && t.type === 'buy') { var diff = PAI.util.r2(t.amount - t.shares * t.price); if (diff > 0.009 && diff < t.amount * 0.05) t.fee = diff; }
      }
      t.problems = validate(t);
      return t;
    });
  }
  function validate(t) {
    var p = [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date || '')) p.push('თარიღი');
    if (['buy', 'sell', 'deposit', 'withdraw', 'dividend', 'fee'].indexOf(t.type) === -1) p.push('ტიპი');
    if (t.type === 'buy' || t.type === 'sell') { if (!t.ticker) p.push('ტიკერი'); if (!(t.shares > 0)) p.push('რაოდენობა'); if (!(t.price > 0)) p.push('ფასი'); }
    else if (!(t.amount > 0)) p.push('თანხა');
    if (t.type === 'dividend' && !t.ticker) { /* optional */ }
    return p;
  }

  // ---------- engines ----------
  async function viaGemini(files, instruction) {
    var parts = [{ text: PROMPT + (instruction ? '\nUser instruction: ' + instruction : '') }];
    for (var i = 0; i < files.length; i++) { var b = await toBase64(files[i]); parts.push({ inline_data: { mime_type: b.mime, data: b.data } }); }
    var txt = await PAI.gemini.generate(parts, { json: true, temperature: 0 });
    var j = JSON.parse(txt.replace(/^```(?:json)?|```$/g, ''));
    if (Array.isArray(j)) j = { transactions: j };
    return { engine: 'Gemini · ' + PAI.gemini.model(), broker: j.broker ? (PAI.brokerFromText(j.broker) || null) : null, transactions: j.transactions || [], raw: txt };
  }
  async function viaServer(files, instruction) {
    var ep = PAI.CFG.visionEndpoint; if (!ep) throw new Error('no endpoint');
    var probe = await fetch(ep, { method: 'GET' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    if (!probe || !probe.enabled) throw new Error('server vision off');
    var images = []; for (var i = 0; i < files.length; i++) images.push(await toBase64(files[i]));
    var r = await fetch(ep, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ images: images, instruction: instruction }) });
    var d = await r.json(); if (!d.ok) throw new Error(d.error || 'server error');
    return { engine: 'Gemini (სერვერი)', broker: d.broker ? PAI.brokerFromText(d.broker) : null, transactions: d.transactions || [], raw: '' };
  }
  var ocrWorker = null;
  async function viaOCR(files, onProgress) {
    if (!window.Tesseract) await PAI.loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    if (!ocrWorker) {
      onProgress && onProgress('ვტვირთავ ტექსტის ამომცნობს (ერთჯერადად, ~4MB)…');
      ocrWorker = await window.Tesseract.createWorker(['eng', 'kat'], 1);
    }
    var all = [], broker = null, texts = [];
    for (var i = 0; i < files.length; i++) {
      onProgress && onProgress('ვკითხულობ სურათს ' + (i + 1) + '/' + files.length + '…');
      var r = await ocrWorker.recognize(files[i]);
      texts.push(r.data.text);
      var p = parseText(r.data.text); broker = broker || p.broker; all = all.concat(p.transactions);
    }
    return { engine: 'ტექსტის ამოცნობა (უფასო, ბრაუზერში)', broker: broker, transactions: all, raw: texts.join('\n-----\n') };
  }

  async function analyze(files, opts) {
    opts = opts || {}; var prog = opts.onProgress || function () {};
    var res = null, errs = [];
    if (PAI.gemini.key()) { try { prog('Gemini კითხულობს სქრინშოტებს…'); res = await viaGemini(files, opts.instruction); } catch (e) { errs.push('Gemini: ' + e.message); } }
    if (!res) { try { prog('ვცდი სერვერის AI-ს…'); res = await viaServer(files, opts.instruction); } catch (e) { errs.push(e.message); } }
    if (!res) { res = await viaOCR(files, prog); }
    res.errors = errs;
    res.items = normalise(res.transactions, { date: PAI.util.today(), currency: 'USD' });
    return res;
  }

  window.PAI_VISION = { analyze: analyze, parseText: parseText, normalise: normalise, validate: validate, num: num, findDate: findDate };
})();
