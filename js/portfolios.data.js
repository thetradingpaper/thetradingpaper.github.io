// ============================================================
// mePortfolio — PORTFOLIO DATA (auto-editable)
// This file holds ONLY data: brokers, holdings, transactions.
// Edited via edit.html (manual editor). Helpers live in js/portfolios.js.
// ============================================================
window.PORTFOLIOS = {

  // -----------------------------------------------------------
  // BOG — Bank of Georgia (long-term · Dogma)
  // -----------------------------------------------------------
  bog: {
    name: 'BOG',
    fullName: 'Bank of Georgia',
    tagline: 'გრძელვადიანი DCA · $100-200/თვე · მიზანი 35%/წელი',
    startDate: '2025-12-09',
    annualGoalPct: 35,
    holdings: [
      // Cached values from Issue 06 snapshot — live prices repaint these every 10s.
      // divYield = approx. annual dividend yield in % (BOG taxes dividends 30% at source → net = gross × 0.70)
      { ticker: 'SPCX', name: 'Space Exploration Technologies Corp', shares: 0.07576271, avgBuy: 171.59, invested: 13.00, value: 11.73, color: '#0f3057', divYield: 0.00 },
      { ticker: 'SMH', name: 'VanEck Semiconductors ETF', shares: 0.79785924, avgBuy: 493.41, invested: 393.67, value: 503.96, color: '#b91c1c', divYield: 0.26 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 0.43807493, avgBuy: 633.25, invested: 277.41, value: 295.77, color: '#166534', divYield: 1.11 },
      { ticker: 'ASX', name: 'ASE Industrial Holding', shares: 9.99266799, avgBuy: 37.24, invested: 372.13, value: 415.79, color: '#8b6914', divYield: 1.52 },
      { ticker: 'SSRM', name: 'SSR Mining Inc', shares: 3.40788323, avgBuy: 31.25, invested: 106.50, value: 98.39, color: '#0891b2', divYield: 0.00 },
      { ticker: 'KOID', name: 'KraneShares Humanoid Robotics ETF', shares: 3.34000784, avgBuy: 40.15, invested: 134.11, value: 134.34, color: '#4b5563', divYield: 0.01 },
      { ticker: 'MP', name: 'MP Materials Corp', shares: 1.03896426, avgBuy: 64.97, invested: 67.50, value: 57.85, color: '#b5651d', divYield: 0.00 },
      { ticker: 'VRT', name: 'Vertiv Holdings Co', shares: 0.16056065, avgBuy: 314.52, invested: 50.50, value: 53.54, color: '#3d8c7a', divYield: 0.08 },
      { ticker: 'WMT', name: 'Walmart Inc', shares: 0.22569679, avgBuy: 117.41, invested: 26.50, value: 26.61, color: '#7a8c2a', divYield: 0.90 },
      { ticker: 'WQTM', name: 'WisdomTree Quantum Computing Fund', shares: 1.68379924, avgBuy: 38.68, invested: 65.13, value: 60.90, color: '#2563eb', divYield: 0.00 },
      { ticker: 'MNST', name: 'Monster Beverage Corporation', shares: 1.67377224, avgBuy: 97.04, invested: 162.43, value: 163.04, color: '#65a30d', divYield: 0.00 },
      { ticker: 'CRDO', name: 'Credo Technology Group Holding', shares: 0.10565843, avgBuy: 265.29, invested: 28.03, value: 28.03, color: '#9d174d', divYield: 0.00 },
    ],
    cash: 0.00, // $185 deposit fully deployed on 29 May 2026
    priorDeposits: 907.76,
    priorCostBasis: 1007.05,
    transactions: [
      // Newest first
      { date: '2026-07-01', type: 'buy', ticker: 'CRDO', shares: 0.10565843, price: 265.29, commission: 0.50 },
      { date: '2026-07-01', type: 'deposit', amount: 11.84 },
      { date: '2026-07-01', type: 'deposit', amount: 16.09 },
      { date: '2026-06-30', type: 'dividend', ticker: 'VOO', amount: 0.60, note: '$1.9622/share · მთლიანი $0.86 − 30% GE tax $0.26 = წმინდა $0.60' },
      { date: '2026-06-29', type: 'deposit', amount: 144.93 },
      { date: '2026-06-29', type: 'buy', ticker: 'MNST', shares: 1.00000000, price: 97.41, commission: 0.50 },
      { date: '2026-06-29', type: 'buy', ticker: 'MNST', shares: 0.48276591, price: 97.40, commission: 0 },
      { date: '2026-06-25', type: 'buy', ticker: 'ASX', shares: 3.63656193, price: 42.18, commission: 0.50 },
      { date: '2026-06-25', type: 'buy', ticker: 'SSRM', shares: 1.94075587, price: 29.37, commission: 0.50 },
      { date: '2026-06-25', type: 'dividend', ticker: 'VRT', amount: 0.01, note: '$0.0625/share' },
      { date: '2026-06-24', type: 'deposit', amount: 211.37, note: 'transfer in' },
      { date: '2026-06-17', type: 'buy', ticker: 'SSRM', shares: 1.46712736, price: 33.40, commission: 0.50 },
      { date: '2026-06-17', type: 'sell', ticker: 'ASX', shares: 1.30645860, price: 38.27, commission: 0.50 },
      { date: '2026-06-15', type: 'buy', ticker: 'WQTM', shares: 1.00906981, price: 38.10, commission: 0.50 },
      { date: '2026-06-15', type: 'sell', ticker: 'MSTR', shares: 0.29757007, price: 132.57, commission: 0.50 },
      { date: '2026-06-12', type: 'buy', ticker: 'SPCX', shares: 0.07576271, price: 164.99, commission: 0.50 },
      { date: '2026-06-12', type: 'deposit', amount: 13.00 },
      { date: '2026-06-11', type: 'buy', ticker: 'MSTR', shares: 0.29757007, price: 114.2588, commission: 0.50 },
      { date: '2026-06-11', type: 'deposit', amount: 34.50 },
      { date: '2026-06-11', type: 'buy', ticker: 'MNST', shares: 0.19100633, price: 91.62, commission: 0.50 },
      { date: '2026-06-11', type: 'deposit', amount: 18.00 },
      { date: '2026-05-29', type: 'deposit', amount: 185.00 },
      { date: '2026-05-29', type: 'buy', ticker: 'ASX', shares: 1.04551656, price: 38.2585, commission: 0.50 },
      { date: '2026-05-29', type: 'buy', ticker: 'MP', shares: 1.03896426, price: 64.49, commission: 0.50 },
      { date: '2026-05-29', type: 'buy', ticker: 'VRT', shares: 0.16056065, price: 311.41, commission: 0.50 },
      { date: '2026-05-29', type: 'buy', ticker: 'WMT', shares: 0.22569679, price: 115.20, commission: 0.50 },
      { date: '2026-05-22', type: 'buy', ticker: 'WQTM', shares: 0.67472943, price: 38.06, commission: 0.50 },
      { date: '2026-05-21', type: 'sell', ticker: 'QBTS', shares: 1.09717696, price: 24.32, commission: 0.50 },
      { date: '2026-05-19', type: 'buy', ticker: 'QBTS', shares: 1.09717696, price: 18.2272, commission: 0.50 },
      { date: '2026-05-19', type: 'deposit', amount: 20.50 },
      { date: '2026-05-19', type: 'buy', ticker: 'ASX', shares: 0.65530799, price: 30.5202, commission: 0.50 },
      { date: '2026-05-19', type: 'deposit', amount: 20.50 },
    ],
  },

  // -----------------------------------------------------------
  // TBC — Dividend / stable-income book (see change spec §5)
  // Reframed from aggressive active trading → gradual dividend-payer
  // collection. Goal: long-term passive income, not a % growth target.
  // -----------------------------------------------------------
  tbc: {
    name: 'TBC',
    fullName: 'TBC Capital',
    tagline: 'დივიდენდი · სტაბილური შემოსავალი · გრძელვადიანი პასიური შემოსავალი',
    startDate: '2026-05-12',
    annualGoalPct: null,
    holdings: [
      { ticker: 'MSTR', name: 'Strategy Inc', shares: 2.06839171, avgBuy: 163.33, invested: 337.82, value: 182.48, color: '#1a1a1a', divYield: 0.00 },
      { ticker: 'ARCC', name: 'Ares Capital Corporation', shares: 0.27151778, avgBuy: 18.42, invested: 5.00, value: 5.00, color: '#1d4ed8', divYield: 10.40 },
      { ticker: 'MAIN', name: 'Main Street Capital Corporation', shares: 0.09765853, avgBuy: 51.20, invested: 5.00, value: 4.98, color: '#15803d', divYield: 6.20 },
      { ticker: 'BXSL', name: 'Blackstone Secured Lending Fund', shares: 0.94841001, avgBuy: 23.84, invested: 22.61, value: 22.63, color: '#7c3aed', divYield: 12.90 },
      { ticker: 'LYG', name: 'Lloyds Banking Group plc', shares: 9.75831896, avgBuy: 6.1486, invested: 60.00, value: 60.00, color: '#006a4d', divYield: 3.66 },
    ],
    cash: 0,
    transactions: [
      // 2026-07-06 rotation: sold MSTR, bought LYG with exact proceeds (net cash $0)
      { date: '2026-07-06', type: 'sell', ticker: 'MSTR', shares: 0.59481794, price: 100.87, commission: 0 },
      { date: '2026-07-06', type: 'buy', ticker: 'LYG', shares: 9.00000000, price: 6.1489, commission: 0 },
      { date: '2026-07-06', type: 'buy', ticker: 'LYG', shares: 0.75831896, price: 6.1451, commission: 0 },
      { date: '2026-06-30', type: 'deposit', amount: 22.61 },
      { date: '2026-06-30', type: 'buy', ticker: 'BXSL', shares: 0.94841001, price: 23.84, commission: 0 },
      { date: '2026-06-29', type: 'deposit', amount: 64.61 },
      { date: '2026-06-29', type: 'buy', ticker: 'MSTR', shares: 0.61581104, price: 88.68, commission: 0 },
      { date: '2026-06-29', type: 'buy', ticker: 'ARCC', shares: 0.27151778, price: 18.42, commission: 0 },
      { date: '2026-06-29', type: 'buy', ticker: 'MAIN', shares: 0.09765853, price: 51.20, commission: 0 },
      { date: '2026-05-15', type: 'buy', ticker: 'MSTR', shares: 0.63346818, price: 176.21, commission: 0 },
      { date: '2026-05-15', type: 'deposit', amount: 111.61 },
      { date: '2026-05-12', type: 'buy', ticker: 'MSTR', shares: 1.41393043, price: 190.06, commission: 0 },
      { date: '2026-05-12', type: 'deposit', amount: 268.75 },
    ],
  },

  // -----------------------------------------------------------
  // GALT — Galt & Taggart (re-entry long 18 Jun 2026 · $112.22 · 6 contracts · filled)
  // -----------------------------------------------------------
  galt: {
    name: 'GALT',
    fullName: 'Galt & Taggart',
    tagline: '2.5× margin · MSTR.CFD · შესრულდა $112.22 · 6 კონტრაქტი',
    startDate: '2026-05-29',
    annualGoalPct: null,
    status: 'active', // OPEN: 6 MSTR.CFD @ $112.22 (filled 18 Jun 2026, Order No CF26M18500515)
    // History: 5 @116.29 (10 Jun) → sold 5 @124.06 (17 Jun, realized +$18.85) → account $307.91 flat
    // → re-entered 6 @112.22 (18 Jun).
    // CFD position: 6 contracts MSTR @ 112.22 = $673.32 gross.
    // Margin 40% = $269.33 own, borrowed $403.99, commission $10.
    // cash = free cash ($28.58) - borrowed ($403.99) = -375.41,
    // so currentValue = 6 x livePrice - 375.41 = real equity. Entry equity $297.91.
    holdings: [
      { ticker: 'MSTR', name: 'Strategy Inc · CFD 2.5×', shares: 6, avgBuy: 112.22, invested: 673.32, value: 673.32, color: '#8b6914' },
    ],
    cash: -375.41,
    priorDeposits: 0,
    priorCostBasis: 0,
    transactions: [
      { date: '2026-06-18', type: 'buy', ticker: 'MSTR', shares: 6, price: 112.22, commission: 10.00 },
      { date: '2026-06-17', type: 'sell', ticker: 'MSTR', shares: 5, price: 124.06, commission: 10.00 },
      { date: '2026-06-10', type: 'buy', ticker: 'MSTR', shares: 5, price: 116.29, commission: 10.00 },
      { date: '2026-05-29', type: 'deposit', amount: 290.00 },
    ],
    // FILLED ORDER — Order No CF26M18500515 · Galt & Taggart
    order: {
      placed: '2026-06-18',
      filledAt: '2026-06-18',
      asset: 'MSTR.CFD',
      side: 'buy', // long
      type: 'limit',
      entry: 112.22, // re-entry after closing prior 5 @116.29 at $124.06
      contracts: 6,
      orderValue: 673.32,
      marginPct: 40, // 40% initial margin = 2.5× leverage
      initialMargin: 269.33,
      borrowed: 403.99,
      commission: 10,
      balance: 307.91,
      liquidation: 99.50, // ≈ -11.3% buffer ratio (same leverage as prior trade)
      drawdownPct: -11.2,
      filled: true,
      thesis: 're-entry long after taking +$18.85 on the prior MSTR position',
    },
    // Prior closed trade: bought 5 @116.29 (10 Jun) → sold 5 @124.06 (17 Jun), realized +$18.85 after $20 commissions.
    plan: {
      asset: 'MSTR',
      leverage: 2.5,
      entry: 112.22,
      target: 460,
      horizonMonths: '5–7',
      estMarginInterestPct: 12, // estimated annual rate
      estCommissionPct: 0.5,
      nextPhase: 'short-side trading',
    },
  },

};

// Manual editor sets window.PORTFOLIOS_META on export (timestamp etc.)
