// ============================================================
// mePortfolio — supplementary data (window.MEPORTF)
// Fees total, BOG cash transfer, GALT closed book, internal transfers.
// Holdings & transactions live in js/portfolios.js.
// Last updated: 2026-06-29
// ============================================================
window.MEPORTF = {
  lastUpdated: '2026-06-30',
  feesPaid: 49.0,                       // running total of all commissions + taxes
  feesByBook: [
    { book: 'BOG', amount: 9.0, note: 'ისტორიის საკომისიოები' },
    { book: 'Galt & Taggart', amount: 40, note: '4 × $10' },
  ],
  marginFinancingEst: 1.96,
  // BOG: the 24 Jun GALT→BOG transfer is now recorded directly in
  // js/portfolios.js as a dated deposit (and was deployed on 25 Jun into stocks),
  // so it is no longer re-applied here.
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
    { date: '24 ივნ 2026', from: 'Galt & Taggart', to: 'BOG', type: 'გატანა · გადატანა', amount: 211.37 },
  ],
};
