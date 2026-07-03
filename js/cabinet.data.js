// ============================================================
// The Trading Paper — Cabinet subpages data
// (ჩემი კაბინეტი → მიზნები / ჩემი ჩანაწერები / Watchlist)
// SINGLE SOURCE OF TRUTH for these three pages.
// To add or change entries: edit the arrays below and commit.
// (The pages also have an "add" form that builds the new file
//  content for you to paste back here.)
// ============================================================
window.CABINET = {

  // ---- მიზნები · Goals ------------------------------------
  // { title, detail, deadline:'YYYY-MM-DD' | '', progress:0-100, done:true|false }
  goals: [
    { title: 'BOG — 35% წლიური ზრდა', detail: 'Dogma · გრძელვადიანი DCA', deadline: '2026-12-31', progress: 20, done: false },
    { title: 'TBC — 150% წლიური ზრდა', detail: 'Active · ერთი კომპანია, დისციპლინა', deadline: '2026-12-31', progress: 10, done: false },
    { title: 'ფინანსური თავისუფლება', detail: 'ყოველდღიური ჩვევები · დისციპლინა · მოთმინება', deadline: '', progress: 5, done: false }
  ],

  // ---- ჩემი ჩანაწერები · Notes ----------------------------
  // { date:'YYYY-MM-DD', title, body }
  notes: [
    { date: '2026-07-03', title: 'დღიურის დასაწყისი', body: 'ეს არის ჩემი ჩანაწერების გვერდი — იდეები, თეზისები, ბაზრის დაკვირვებები და გაკვეთილები. სანამ შევდივარ პოზიციაში, თეზისი ჯერ აქ ჩავიწერო.' }
  ],

  // ---- Watchlist · სათვალთვალო სია ------------------------
  // { ticker, name, note, target }
  watchlist: [
    { ticker: 'NVDA', name: 'NVIDIA', note: 'AI — ვაკვირდები ჩასვლის წერტილს', target: '—' },
    { ticker: 'MSTR', name: 'Strategy Inc', note: 'TBC · აქტიური თვალყური', target: '—' }
  ]

};
