/* ============================================================
   The Trading Paper — ქარ / ENG language toggle
   Swaps known Georgian strings to English (and back) across the
   page, including content rendered later by portfolios.js.
   Choice persists in localStorage ("tp_lang").
   ============================================================ */
(function () {
  "use strict";

  // Exact / substring translation pairs. Longest first at runtime.
  var DICT = {
    "ჩემი კაბინეტი": "My Cabinet",
    "ბაზრის ჩანაწერი · ანალიზი · ჟურნალი": "Market record · Analysis · Journal",
    "მთლიანი პორტფელი": "Total portfolio",
    "სამი წიგნი": "Three books",
    "ვისბადენი": "Wiesbaden",
    "გამოცემა": "Issue",
    "რედაქტირება": "Edit",
    "წიგნი პირველი": "Book One",
    "წიგნი მეორე": "Book Two",
    "წიგნი მესამე": "Book Three",
    "გრძელვადიანი ETF-ების / აქციების შეგროვება": "Accumulate long-term ETFs / stocks",
    "გრძელვადიანი": "Long-term",
    "აქტიური ვაჭრობა": "Active trading",
    "გადანაწილება": "Allocation",
    "ინვესტიციის წილი": "share of investment",
    "ღირებულება vs ჩარიცხული": "Value vs deposited",
    "ჩარიცხული": "Deposited",
    "ბოლო ტრანზაქციები": "Recent transactions",
    "ტრანზაქციების ისტორია": "Transaction history",
    "ცოცხალი ფასები": "Live prices",
    "ცოცხალი ფასი": "Live price",
    "Dogma წესები": "Dogma rules",
    "Active წესები": "Active rules",
    "თვიური $100-200 DCA — დისციპლინა მნიშვნელოვანია": "Monthly $100–200 DCA — discipline matters",
    "არ ვყიდი — ვამოწმებ მხოლოდ ფასი ეცემაა თუ იზრდება": "Never selling — only checking whether price falls or rises",
    "ფასი ეცემა → DCA. ფასი იზრდება → ვფლობ": "Price falls → DCA. Price rises → hold",
    "ერთი კომპანიით ვაჭრობა, მთლიანი ბალანსით": "Trade one company with the full balance",
    "თეზისი ფურცელზე ჯერ — შემდეგ შესვლა": "Thesis on paper first — then entry",
    "დროული რეალიზება — როცა მიზანი მიღწეულია, გადი": "Take profit on time — goal hit, exit",
    "თვიური დამატება $100 — საჭიროებისამებრ": "Monthly add $100 — as needed",
    "დანაკარგი არ ვცვლი BOG-დან — ცალკე კაპიტალი, ცალკე რისკი": "Losses never covered from BOG — separate capital, separate risk",
    "წლიური ზრდა": "annual growth",
    "მიზანი:": "Goal:",
    "მთა": "The Mountain",
    "ბერკეტი": "leverage",
    "დახურულია უვადოდ": "Closed indefinitely",
    "დახურული": "Closed",
    "შიდა გადატანები": "Internal transfers",
    "არქივი": "Archive",
    "ამობეჭდვა": "Print",
    "დააჭირე ღილაკს და შეინახე ეს გვერდი PDF-ად ან ამობეჭდე.": "Press the button to save this page as a PDF or print it.",
    "გადახდილი საკომისიო/გადასახადი:": "Fees/taxes paid:",
    "დეპოზიტი:": "Deposit:",
    "გატანილი → BOG": "Withdrawn → BOG",
    "გატანილი:": "Withdrawn:",
    "საიდან → სად": "From → To",
    "თარიღი": "Date",
    "ოპერაცია": "Operation",
    "თანხა": "Amount",
    "საკომისიო": "Fee",
    "ნახვა": "View",
    "ვერ მოიძებნა": "Not found",
    "იტვირთება…": "Loading…",
    "ლაშა ფხაკაძე": "Lasha Pkhakadze",
    "ეს არ არის ფინანსური რჩევა": "This is not financial advice",
    "გასვლა": "Log out",
    // Ledger page
    "ყოველთვიური წიგნი": "The Monthly Ledger",
    "ბიუჯეტი": "Budget",
    "თვიური შემოსავალი": "Monthly net income",
    "ფიქსირებული ხარჯები": "Fixed / Essentials",
    "ქირა (თბილი)": "Rent (warm)",
    "საკვები": "Groceries",
    "ტელეფონი + ინტერნეტი": "Phone + internet",
    "დენი": "Electricity",
    "მომავალი": "Your Future",
    "ინვესტიცია (DCA)": "Investing (DCA)",
    "ბუფერი": "Cash buffer",
    "ჩემი ცხოვრება": "My Life",
    "საბრძოლო კლუბი (MMA)": "Fighting club (MMA)",
    "დარბაზი": "Gym",
    "წიგნები / სწავლა": "Books / study",
    "გასვლები ბუნებაში": "Outdoor trips",
    "თავისუფალი დასახარჯი": "Free to spend",
    "ბიუჯეტს გადააჭარბე — შეამცირე": "Over budget — trim below",
    "შემოსავალი": "Income",
    "ფიქსირებულის შემდეგ": "after essentials",
    "საცხოვრებლად დარჩა": "left to live on",
    "ერთი წესი": "The one rule",
    "ხელფასის დღეს ჯერ მომავალი გადაირიცხოს — ინვესტიცია და ბუფერი, ავტომატურად. რაც ანგარიშზე დარჩება, მთლიანად შენია.": "On payday, move the Future section out first — investing and buffer, automatically. Whatever stays in the account is fully yours.",
    "თვის ანალიზი · ჩანაწერები": "Monthly analysis · Notes",
    "შენახულია": "Saved",
    "ჩაწერე აქ თვის შენიშვნები…": "Write this month's notes here…"
  };

  var KEYS = Object.keys(DICT).sort(function (a, b) { return b.length - a.length; });

  function getLang() {
    try { return localStorage.getItem("tp_lang") || "ka"; } catch (e) { return "ka"; }
  }
  function setLang(l) {
    try { localStorage.setItem("tp_lang", l); } catch (e) {}
  }

  var observer = null;
  var applying = false;

  function translateNode(node) {
    var t = node.nodeValue;
    if (!t || !/[ა-ჰ]/.test(t)) return;
    if (node.__tpOriginal === undefined) node.__tpOriginal = t;
    var out = t;
    for (var i = 0; i < KEYS.length; i++) {
      var k = KEYS[i];
      if (out.indexOf(k) !== -1) out = out.split(k).join(DICT[k]);
    }
    if (out !== t) node.nodeValue = out;
  }

  function walk(root, fn) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n;
    while ((n = w.nextNode())) {
      var p = n.parentNode && n.parentNode.nodeName;
      if (p === "SCRIPT" || p === "STYLE") continue;
      fn(n);
    }
  }

  function applyEnglish(root) {
    applying = true;
    walk(root || document.body, translateNode);
    applying = false;
  }

  function restoreGeorgian() {
    applying = true;
    walk(document.body, function (n) {
      if (n.__tpOriginal !== undefined && n.nodeValue !== n.__tpOriginal) {
        n.nodeValue = n.__tpOriginal;
      }
    });
    applying = false;
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      if (applying || getLang() !== "en") return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "characterData") translateNode(m.target);
        for (var j = 0; j < m.addedNodes.length; j++) {
          var nd = m.addedNodes[j];
          if (nd.nodeType === 3) translateNode(nd);
          else if (nd.nodeType === 1) applyEnglish(nd);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function updateButton(btn) {
    var en = getLang() === "en";
    btn.textContent = en ? "ქარ" : "ENG";
    btn.setAttribute("aria-label", en ? "ქართულად გადართვა" : "Switch to English");
    btn.title = en ? "ქართული" : "English";
  }

  function toggle(btn) {
    var next = getLang() === "en" ? "ka" : "en";
    setLang(next);
    if (next === "en") { applyEnglish(); startObserver(); }
    else restoreGeorgian();
    updateButton(btn);
    document.documentElement.setAttribute("lang", next);
  }

  function init() {
    var btn = document.createElement("button");
    btn.id = "tp-lang";
    btn.type = "button";
    btn.style.cssText =
      "border:1px solid var(--border,#d4cfc4);background:transparent;color:inherit;" +
      "font:inherit;font-size:11px;letter-spacing:1.5px;padding:1px 10px;border-radius:3px;" +
      "cursor:pointer;text-transform:uppercase;margin-left:10px;";
    btn.addEventListener("click", function () { toggle(btn); });

    var bar = document.querySelector(".masthead .top-bar span:last-child") ||
              document.querySelector(".masthead .top-bar") || document.body;
    bar.appendChild(btn);
    updateButton(btn);

    if (getLang() === "en") {
      document.documentElement.setAttribute("lang", "en");
      applyEnglish();
      startObserver();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
