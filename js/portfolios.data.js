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
      { ticker: 'KOID', name: 'KraneShares Humanoid Robotics ETF', shares: 3.34000784, avgBuy: 40.15, invested: 134.11, value: 125.72, color: '#4b5563', divYield: 0.01 },
      { ticker: 'SSRM', name: 'SSR Mining Inc', shares: 3.40788323, avgBuy: 31.397, invested: 107.00, value: 95.69, color: '#0891b2', divYield: 0.00 },
      { ticker: 'WQTM', name: 'WisdomTree Quantum Computing Fund', shares: 1.68379924, avgBuy: 38.68, invested: 65.13, value: 54.02, color: '#2563eb', divYield: 0.00 },
      { ticker: 'VRT', name: 'Vertiv Holdings Co', shares: 0.16056065, avgBuy: 314.52, invested: 50.50, value: 48.35, color: '#3d8c7a', divYield: 0.08 },
      { ticker: 'MP', name: 'MP Materials Corp', shares: 1.03896426, avgBuy: 64.97, invested: 67.50, value: 47.46, color: '#b5651d', divYield: 0.00 },
      { ticker: 'WMT', name: 'Walmart Inc', shares: 0.22569679, avgBuy: 117.41, invested: 26.50, value: 24.68, color: '#7a8c2a', divYield: 0.90 },
      { ticker: 'CRDO', name: 'Credo Technology Group Holding', shares: 0.10565843, avgBuy: 270.02, invested: 28.53, value: 24.12, color: '#9d174d', divYield: 0.00 },
      { ticker: 'SPCX', name: 'Space Exploration Technologies Corp', shares: 0.07576271, avgBuy: 171.59, invested: 13.00, value: 8.73, color: '#0f3057', divYield: 0.00 },
    ],
    cash: 0.00, // 23 Jul 2026: withdrew full $1,161.44 ($1,140 transfer to TBC, $9.44 pocket, $12 bank fee)
    priorDeposits: 997.66,
    priorCostBasis: 1007.05,
    transactions: [
      // Newest first
      { date: '2026-07-23', type: 'fee', amount: 12.00, note: 'ბანკის საკომისიო · გადარიცხვა' },
      { date: '2026-07-23', type: 'withdraw', amount: 9.44, note: 'ჯიბეში შენახვა' },
      { date: '2026-07-23', type: 'deposit', amount: -1140.00, note: 'გადატანა → TBC' },
      { date: '2026-07-22', type: 'sell', ticker: 'ASX', shares: 0.74832191, price: 40.5307, commission: 0 },
      { date: '2026-07-22', type: 'sell', ticker: 'ASX', shares: 16.00000000, price: 40.53125, commission: 2.04 },
      { date: '2026-07-22', type: 'deposit', amount: 1.17 },
      { date: '2026-07-22', type: 'sell', ticker: 'SNDK', shares: 0.30257297, price: 1602.69, commission: 1.45 },
      { date: '2026-07-15', type: 'buy', ticker: 'SNDK', shares: 0.30257297, price: 1538.44, commission: 1.40 },
      { date: '2026-07-15', type: 'sell', ticker: 'VOO', shares: 0.43807493, price: 692.55, commission: 0.91 },
      { date: '2026-07-15', type: 'sell', ticker: 'MNST', shares: 0.67377222, price: 98.52, commission: 0.50 },
      { date: '2026-07-15', type: 'sell', ticker: 'MNST', shares: 1.00000000, price: 98.53, commission: 0 },
      { date: '2026-07-14', type: 'buy', ticker: 'ASX', shares: 6.00000000, price: 41.295, commission: 0.84 },
      { date: '2026-07-14', type: 'buy', ticker: 'ASX', shares: 0.75565392, price: 41.29, commission: 0 },
      { date: '2026-07-14', type: 'sell', ticker: 'SNDK', shares: 0.15652776, price: 1792.97, commission: 0.84 },
      { date: '2026-07-13', type: 'buy', ticker: 'SNDK', shares: 0.15652776, price: 1716.79, commission: 0.81 },
      { date: '2026-07-13', type: 'deposit', amount: 0.28 },
      { date: '2026-07-13', type: 'sell', ticker: 'SMH', shares: 0.45510661, price: 593.42, commission: 0.81 },
      { date: '2026-07-08', type: 'withdraw', amount: 97.40, note: 'გატანა ბარათზე — ტანსაცმლისთვის' },
      { date: '2026-07-08', type: 'deposit', amount: -102.00, note: 'გადატანა → TBC' },
      { date: '2026-07-07', type: 'sell', ticker: 'SMH', shares: 0.34275263, price: 583.51, commission: 0.60 },
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
    tagline: 'დივერსიფიცირებული პორტფელი',
    startDate: '2026-05-12',
    annualGoalPct: null,
    holdings: [
      { ticker: 'MSTR', name: 'Strategy Inc', shares: 3.686, avgBuy: 133.82, invested: 493.26, value: 493.26, color: '#1a1a1a', divYield: 0.00 },
      { ticker: 'ARCC', name: 'Ares Capital Corporation', shares: 2.27151778, avgBuy: 18.47, invested: 41.96, value: 41.96, color: '#1d4ed8', divYield: 10.40 },
      { ticker: 'MAIN', name: 'Main Street Capital Corporation', shares: 3.597, avgBuy: 53.51, invested: 192.48, value: 192.48, color: '#15803d', divYield: 6.20 },
      { ticker: 'BXSL', name: 'Blackstone Secured Lending Fund', shares: 3.09841001, avgBuy: 23.35, invested: 72.34, value: 72.34, color: '#7c3aed', divYield: 12.90 },
      { ticker: 'LYG', name: 'Lloyds Banking Group plc', shares: 34.764, avgBuy: 6.05, invested: 210.32, value: 210.32, color: '#006a4d', divYield: 3.66 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 0.515, avgBuy: 681.96, invested: 351.21, value: 351.21, color: '#2563eb', divYield: 1.30 },
      { ticker: 'GOOG', name: 'Alphabet Inc.', shares: 0.969, avgBuy: 320.77, invested: 310.83, value: 310.83, color: '#ea4335', divYield: 0.00 },
    ],
    cash: 0.02,
    transactions: [
      { date: '2026-07-23', type: 'deposit', amount: 1140.00, note: 'გადმოტანა ← BOG' },
      { date: '2026-07-23', type: 'buy', ticker: 'GOOG', shares: 0.96900000, price: 320.77, commission: 0.68 },
      { date: '2026-07-23', type: 'buy', ticker: 'VOO', shares: 0.51500000, price: 681.96, commission: 0.68 },
      { date: '2026-07-23', type: 'buy', ticker: 'LYG', shares: 25.00568104, price: 6.0114, commission: 0.68 },
      { date: '2026-07-23', type: 'buy', ticker: 'MAIN', shares: 3.20349606, price: 53.7444, commission: 0.68 },
      { date: '2026-07-23', type: 'buy', ticker: 'MSTR', shares: 1.61760829, price: 96.0924, commission: 0.68 },
      { date: '2026-07-15', type: 'dividend', ticker: 'MAIN', amount: 0.02, note: 'დივიდენდის ჩარიცხვა $0.03 − გადასახადი $0.01 = წმინდა $0.02' },
      { date: '2026-07-09', type: 'deposit', amount: 102.00, note: 'გადმოტანა ← BOG' },
      { date: '2026-07-09', type: 'buy', ticker: 'MAIN', shares: 0.29584541, price: 51.75, commission: 0 },
      { date: '2026-07-09', type: 'buy', ticker: 'ARCC', shares: 2.00000000, price: 18.48, commission: 0 },
      { date: '2026-07-09', type: 'buy', ticker: 'BXSL', shares: 0.15000000, price: 23.13, commission: 0 },
      { date: '2026-07-09', type: 'buy', ticker: 'BXSL', shares: 2.00000000, price: 23.13, commission: 0 },
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
    tagline: 'დახურულია უვადო დროით · CLOSED',
    startDate: '2026-05-29',
    annualGoalPct: null,
    status: 'closed',
    holdings: [],
    cash: 0.00,
    priorDeposits: 0,
    priorCostBasis: 0,
    transactions: [
      { date: '2026-06-24', type: 'deposit', amount: -211.37, note: 'transfer to BOG' },
      { date: '2026-06-24', type: 'sell', ticker: 'MSTR', shares: 6, price: 99.61, commission: 10.00 },
      { date: '2026-06-18', type: 'buy', ticker: 'MSTR', shares: 6, price: 112.22, commission: 10.00 },
      { date: '2026-06-17', type: 'sell', ticker: 'MSTR', shares: 5, price: 124.06, commission: 10.00 },
      { date: '2026-06-10', type: 'buy', ticker: 'MSTR', shares: 5, price: 116.29, commission: 10.00 },
      { date: '2026-05-29', type: 'deposit', amount: 290.00 },
    ],
    order: null,
    plan: null,
  },

};

// Manual editor sets window.PORTFOLIOS_META on export (timestamp etc.)
