// ============================================================
// The Trading Paper — Cabinet subpages data
// (ჩემი კაბინეტი → მიზნები / ჩემი ჩანაწერები)
// SINGLE SOURCE OF TRUTH for these pages.
// To add or change entries: edit the arrays below and commit.
// (The pages also have an "add" form that builds the new file
//  content for you to paste back here.)
// Watchlist removed — see change spec §9.
// ============================================================
window.CABINET = {

  // ---- მიზნები · Goals ------------------------------------
  // { title, detail, deadline:'YYYY-MM-DD' | '', progress:0-100, done:true|false }
  goals: [],

  // ---- ჩემი ჩანაწერები · Notes (seed / permanent diary) ---
  // { date:'YYYY-MM-DD', title, body }
  // Note: the journal page also stores your own notes in the browser
  // (localStorage) so they persist across restarts — see notes.html.
  notes: [
    { date: '2026-07-03', title: 'დღიურის დასაწყისი', body: 'ეს არის ჩემი ჩანაწერების გვერდი — იდეები, თეზისები, ბაზრის დაკვირვებები და გაკვეთილები. სანამ შევდივარ პოზიციაში, თეზისი ჯერ აქ ჩავიწერო.' }
  ]

};
