// ============================================================
// mePortfolio — supplementary data (window.MEPORTF)
// Fees total, BOG cash transfer, GALT closed book, internal transfers.
// Holdings & transactions live in js/portfolios.js.
// Last updated: 2026-07-14
// ============================================================
window.MEPORTF = {
  lastUpdated: '2026-07-14',
  feesPaid: 52.40,                      // running total of all commissions + taxes (+$1.68: SNDK sell + ASX buy, 14 Jul)
  feesByBook: [
    { book: 'BOG', amount: 12.40, note: 'ისტორიის საკომისიოები' },
    { book: 'Galt & Taggart', amount: 40, note: '4 × $10' },
  ],
  marginFinancingEst: 0,
  // BOG uninvested cash for the meportfolio page (index.html sets
  // portfolios.bog.cash = cashAdded). 14 Jul 2026: SNDK proceeds ($279.81) were
  // immediately redeployed into ASX, so cash nets to $0.
  bog: { cashAdded: 0, countedAsDeposit: false },
  galt: {
    closed: true,
    statusShort: 'დახურულია უვადო დროით',
    statusNote: 'ანგარიში დახურულია უვადო დროით — ველოდები დამატებით სახსრებს.',
    deposit: 290,
    fees: 40,
    withdrawnToBOG: 211.37,
    net: -78.63,
    trades: [
      { date: '29 მაი 2026', op: 'დეპოზიტი · $290.00', price: '—', fee: '—' },
      { date: '10 ივნ 2026', op: 'ყიდვა · 5 × MSTR.CFD', price: '$116.29', fee: '$10.00' },
      { date: '17 ივნ 2026', op: 'გაყიდვა · 5 × MSTR.CFD', price: '$124.06', fee: '$10.00' },
      { date: '18 ივნ 2026', op: 'ყიდვა · 6 × MSTR.CFD', price: '$112.22', fee: '$10.00' },
      { date: '24 ივნ 2026', op: 'დახურვა · 6 × MSTR.CFD', price: '$99.61', fee: '$10.00' },
    ],
  },
  transfers: [
    { date: '09 ივლ 2026', from: 'BOG', to: 'TBC', type: 'გადატანა', amount: 102.00 },
    { date: '24 ივნ 2026', from: 'Galt & Taggart', to: 'BOG', type: 'გატანა · გადატანა', amount: 211.37 },
  ],
};
