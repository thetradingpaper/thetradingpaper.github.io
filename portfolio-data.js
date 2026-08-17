// ============================================================
// mePortfolio — supplementary data (window.MEPORTF)
// Fees total, BOG cash transfer, GALT closed book, internal transfers.
// Holdings & transactions live in js/portfolios.js.
// Last updated: 2026-08-05
// ============================================================
window.MEPORTF = {
  lastUpdated: '2026-08-17',
  feesPaid: 84.39,                      // reconciled 17 Aug 2026: BOG $39.71 ($19.71 + $20 bank fees) + TBC $4.68 (12 fees) + Galt $40.00
  feesByBook: [
    { book: 'BOG', amount: 39.71, note: '30 საკომისიო ($19.71) + ბანკის გადარიცხვის საკომისიო ($20.00)' },
    { book: 'TBC', amount: 4.68, note: '12 ვაჭრობის საკომისიო (17 აგვ 2026)' },
    { book: 'Galt & Taggart', amount: 40, note: '4 × $10' },
  ],
  marginFinancingEst: 0,
  // BOG cash balance: 17 Aug 2026: BOG account fully cleared ($400 to TBC, $4 bank fee, $214.82 withdrawn) -> cash balance $0.00.
  bog: { cashAdded: 0.00, countedAsDeposit: false },
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
    { date: '17 აგვ 2026', from: 'BOG', to: 'TBC', type: 'გადატანა', amount: 400.00 },
    { date: '23 ივლ 2026', from: 'BOG', to: 'TBC', type: 'გადატანა', amount: 1140.00 },
    { date: '09 ივლ 2026', from: 'BOG', to: 'TBC', type: 'გადატანა', amount: 102.00 },
    { date: '24 ივნ 2026', from: 'Galt & Taggart', to: 'BOG', type: 'გატანა · გადატანა', amount: 211.37 },
  ],
};
