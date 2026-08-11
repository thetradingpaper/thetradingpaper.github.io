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
      { ticker: 'SMCZ', name: 'Defiance Daily Target 2X Short SMCI ETF', shares: 118.14776384, avgBuy: 5.69, invested: 671.80, value: 671.08, color: '#dc2626', divYield: 0.00 },
    ],
    cash: 0.00, // 11 Aug 2026: BOG cash $671.80 fully deployed into SMCZ 2X Short SMCI ETF · holding overnight
    previousValue: 624.98, // 10 Aug 2026 value prior to today's closing & scalping trades
    priorDeposits: 997.66,
    priorCostBasis: 1007.05,
    transactions: [
      // Newest first
      // --- 11 აგვ 2026 BOG SMCZ (2X Short SMCI ETF) purchase · BOG app · $671.80 invested · holding overnight ---
      { date: '2026-08-11', type: 'buy',  ticker: 'SMCZ', shares: 118.14776384, price: 5.68608405, commission: 0 },
      // --- 11 აგვ 2026 BOG 2X ETF positions closed & intraday trading · BOG app · net cash $666.28 ---
      { date: '2026-08-11', type: 'sell', ticker: 'RKLZ', shares: 76.99477619, price: 2.94, commission: 0 },
      { date: '2026-08-11', type: 'sell', ticker: 'SPCG', shares: 10.12658227, price: 19.70, commission: 0 },
      { date: '2026-08-11', type: 'sell', ticker: 'SNXX', shares: 21.09971726, price: 9.45, commission: 0 },
      // --- 10 აგვ 2026 BOG 2X leveraged ETF purchases (SNXX, SPCG, RKLZ) · BOG app · net cash $48.38 ---
      { date: '2026-08-10', type: 'buy',  ticker: 'RKLZ', shares: 76.99477619, price: 2.9289, commission: 0 },
      { date: '2026-08-10', type: 'buy',  ticker: 'SPCG', shares: 10.12658227, price: 19.7500, commission: 0 },
      { date: '2026-08-10', type: 'buy',  ticker: 'SNXX', shares: 21.09971726, price: 9.4788, commission: 0 },
      // --- 07 აგვ 2026 BOG SNXX round-trip scalp · BOG app · net cash $673.89 ---
      { date: '2026-08-07', type: 'sell', ticker: 'SNXX', shares: 72.21708957, price: 9.33144815, commission: 0 },
      { date: '2026-08-07', type: 'buy',  ticker: 'SNXX', shares: 72.21708957, price: 9.30860857, commission: 0 },
      // --- 05 აგვ 2026 BOG 30+ intraday trades · BOG app · net cash $790.49 (+ $3.15 P/L) ---
      // --- 04 აგვ 2026 BOG GOOGL scalp · BOG app · $0.01 fee · net cash $787.34 (+ $1.56 P/L) ---
      { date: '2026-08-04', type: 'sell', ticker: 'GOOGL', shares: 0.07624049, price: 379.1947, commission: 0 },
      { date: '2026-08-04', type: 'sell', ticker: 'GOOGL', shares: 2.00000000, price: 379.215,  commission: 0 },
      { date: '2026-08-04', type: 'buy',  ticker: 'GOOGL', shares: 0.07624049, price: 378.4077, commission: 0.01 },
      { date: '2026-08-04', type: 'buy',  ticker: 'GOOGL', shares: 1.00000000, price: 378.46,   commission: 0 },
      { date: '2026-08-04', type: 'buy',  ticker: 'GOOGL', shares: 1.00000000, price: 378.46,   commission: 0 },
      // --- 04 აგვ 2026 BOG SNDK liquidation & intraday scalp · BOG app · commission-free · net cash $785.78 ---
      { date: '2026-08-04', type: 'sell', ticker: 'SNDK', shares: 0.55453637, price: 1417.00355, commission: 0 },
      { date: '2026-08-04', type: 'buy',  ticker: 'SNDK', shares: 0.55453637, price: 1428.5988,  commission: 0 },
      { date: '2026-08-04', type: 'sell', ticker: 'SNDK', shares: 0.33020674, price: 1396.8522,  commission: 0 },
      { date: '2026-08-04', type: 'sell', ticker: 'SNDK', shares: 0.03583609, price: 1395.2415,  commission: 0 },
      { date: '2026-08-04', type: 'sell', ticker: 'SNDK', shares: 0.07050187, price: 1372.8714,  commission: 0 },
      { date: '2026-08-04', type: 'sell', ticker: 'SNDK', shares: 0.13541911, price: 1360.00,    commission: 0 },
      // --- 30 Jul 2026 BOG rotation: MNST liquidation → SNDK buy · BOG app · commission-free · net cash $0.00 ---
      { date: '2026-07-30', type: 'buy',  ticker: 'SNDK', shares: 0.14687144, price: 1259.4688, commission: 0 },
      { date: '2026-07-30', type: 'sell', ticker: 'MNST', shares: 0.92424354, price: 96.1328,   commission: 0 },
      { date: '2026-07-30', type: 'sell', ticker: 'MNST', shares: 1.00000000, price: 96.1300,   commission: 0 },
      // --- 29 Jul 2026 deposit ($339.87) & purchases · BOG app ---
      { date: '2026-07-29', type: 'buy',  ticker: 'MNST',  shares: 0.92424354, price: 98.74,   commission: 0 },
      { date: '2026-07-29', type: 'buy',  ticker: 'MNST',  shares: 1.00000000, price: 98.74,   commission: 0 },
      { date: '2026-07-29', type: 'buy',  ticker: 'SNDK',  shares: 0.00968542, price: 1032.48, commission: 0 },
      { date: '2026-07-29', type: 'buy',  ticker: 'SNDK',  shares: 0.04778475, price: 1046.36, commission: 0 },
      { date: '2026-07-29', type: 'buy',  ticker: 'SNDK',  shares: 0.04741229, price: 1054.58, commission: 0 },
      { date: '2026-07-29', type: 'buy',  ticker: 'SNDK',  shares: 0.03792127, price: 1051.39, commission: 0 },
      { date: '2026-07-29', type: 'deposit', amount: 339.87 },
      // --- 24 Jul 2026 19:33 SSRM final liquidation → SNDK top-up ---
      { date: '2026-07-24', type: 'buy',  ticker: 'SNDK',  shares: 0.09225935, price: 1500.12,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'SSRM',  shares: 0.05993725, price: 27.362,    commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'SSRM',  shares: 5.00000000, price: 27.352,    commission: 0 },
      // --- 24 Jul 2026 intraday scalps & rebalancing · BOG app · commission-free · net cash $0.00 ---
      { date: '2026-07-24', type: 'buy',  ticker: 'SNDK',  shares: 0.00115663, price: 1504.37,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'SSRM',  shares: 0.06313222, price: 27.56,     commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'SNDK',  shares: 0.04649844, price: 1496.39,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'MSTR',  shares: 0.75274572, price: 92.4349,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'MSTR',  shares: 0.75274572, price: 92.2888,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'AAL',   shares: 0.82695175, price: 14.3902,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'AAL',   shares: 4.00000000, price: 14.3925,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'AAL',   shares: 0.82695175, price: 14.3539,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'AAL',   shares: 4.00000000, price: 14.3475,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'MSTR',  shares: 0.75154874, price: 92.1564,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'MSTR',  shares: 0.75154874, price: 92.0100,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'INTC',  shares: 0.71727963, price: 96.4059,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'INTC',  shares: 0.71727963, price: 97.3400,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'MSTR',  shares: 0.76437096, price: 91.3428,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'MSTR',  shares: 0.76437096, price: 91.3298,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'RNG',   shares: 0.46780064, price: 47.5629,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'RNG',   shares: 1.00000000, price: 47.5600,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'RNG',   shares: 0.46780064, price: 47.6912,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'RNG',   shares: 1.00000000, price: 47.6900,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'AAL',   shares: 0.97056014, price: 14.0846,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'AAL',   shares: 4.00000000, price: 14.0825,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'AAL',   shares: 0.97056014, price: 14.0331,   commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'AAL',   shares: 4.00000000, price: 14.0275,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'THC',   shares: 0.28834853, price: 241.8254,  commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'THC',   shares: 0.28834853, price: 241.9988,  commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'GOOGL', shares: 0.21895639, price: 318.6936,  commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'GOOGL', shares: 0.21895639, price: 320.7437,  commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'CRDO',  shares: 0.10565843, price: 215.0325,  commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'VRT',   shares: 0.16056065, price: 295.9006,  commission: 0 },
      { date: '2026-07-24', type: 'buy',  ticker: 'SNDK',  shares: 0.08165826, price: 1477.988,  commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'KOID',  shares: 0.34000784, price: 36.1462,   commission: 0 },
      { date: '2026-07-24', type: 'sell', ticker: 'KOID',  shares: 3.00000000, price: 36.1333,   commission: 0 },
      // --- 23 Jul 2026 (evening) · intraday scalps · BOG app · commission-free · net cash $0.00 (sells $385.08 = buys $385.08) ---
      // MSTR opened then flipped same day (+$1.46). SNDK & HIMS round-tripped; HIMS net −$2.43; day realized ≈ −$0.73. Ends: SNDK 0.05694973 sh open.
      { date: '2026-07-23', type: 'buy',  ticker: 'MSTR', shares: 1.00000000, price: 92.82,    commission: 0 }, // reshuffle open
      { date: '2026-07-23', type: 'buy',  ticker: 'MSTR', shares: 0.02519351, price: 92.88,    commission: 0 }, // reshuffle open
      { date: '2026-07-23', type: 'sell', ticker: 'MSTR', shares: 1.00000000, price: 94.25,    commission: 0 }, // 19:34 close · P/L +1.43
      { date: '2026-07-23', type: 'sell', ticker: 'MSTR', shares: 0.02519351, price: 94.0718,  commission: 0 }, // 19:34 close · P/L +0.03
      { date: '2026-07-23', type: 'buy',  ticker: 'SNDK', shares: 0.05789723, price: 1668.819, commission: 0 }, // 19:37
      { date: '2026-07-23', type: 'sell', ticker: 'SNDK', shares: 0.05789723, price: 1672.9643, commission: 0 }, // 19:47 · P/L +0.24
      { date: '2026-07-23', type: 'buy',  ticker: 'HIMS', shares: 2.00000000, price: 34.575,   commission: 0 }, // 19:48
      { date: '2026-07-23', type: 'buy',  ticker: 'HIMS', shares: 0.80150285, price: 34.5726,  commission: 0 }, // 19:48
      { date: '2026-07-23', type: 'sell', ticker: 'HIMS', shares: 2.00000000, price: 34.685,   commission: 0 }, // 19:49 · P/L +0.22
      { date: '2026-07-23', type: 'sell', ticker: 'HIMS', shares: 0.80150285, price: 34.6848,  commission: 0 }, // 19:49 · P/L +0.09
      { date: '2026-07-23', type: 'buy',  ticker: 'HIMS', shares: 2.00000000, price: 34.315,   commission: 0 }, // 19:51
      { date: '2026-07-23', type: 'buy',  ticker: 'HIMS', shares: 0.83187955, price: 34.3079,  commission: 0 }, // 19:51
      { date: '2026-07-23', type: 'sell', ticker: 'HIMS', shares: 2.00000000, price: 33.345,   commission: 0 }, // 20:19 · P/L −1.94
      { date: '2026-07-23', type: 'sell', ticker: 'HIMS', shares: 0.83187955, price: 33.3462,  commission: 0 }, // 20:19 · P/L −0.80
      { date: '2026-07-23', type: 'buy',  ticker: 'SNDK', shares: 0.05694973, price: 1658.129, commission: 0 }, // 20:37 open (held)
      { date: '2026-07-23', type: 'deposit', amount: 9.44 },
      { date: '2026-07-23', type: 'sell', ticker: 'WQTM', shares: 0.68379924, price: 31.37, commission: 0 },
      { date: '2026-07-23', type: 'sell', ticker: 'WQTM', shares: 1.00000000, price: 31.36, commission: 0 },
      { date: '2026-07-23', type: 'sell', ticker: 'WMT',  shares: 0.22569679, price: 108.02, commission: 0 },
      { date: '2026-07-23', type: 'sell', ticker: 'SPCX', shares: 0.07576271, price: 112.59, commission: 0 },
      { date: '2026-07-23', type: 'buy',  ticker: 'SSRM', shares: 0.71518624, price: 26.72, commission: 0 },
      { date: '2026-07-23', type: 'buy',  ticker: 'SSRM', shares: 1.00000000, price: 26.71, commission: 0 },
      { date: '2026-07-23', type: 'sell', ticker: 'MP',   shares: 0.03896426, price: 44.14, commission: 0 },
      { date: '2026-07-23', type: 'sell', ticker: 'MP',   shares: 1.00000000, price: 44.10, commission: 0 },
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
      { ticker: 'LYG', name: 'Lloyds Banking Group plc', shares: 39.60600954, avgBuy: 6.07, invested: 240.23, value: 240.23, color: '#006a4d', divYield: 3.66 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 0.97880149, avgBuy: 695.88, invested: 681.13, value: 681.13, color: '#2563eb', divYield: 1.30 },
    ],
    cash: 0.00, // 10 Aug 2026: GOOG sold @ $312.10 + $17.82 cash = $329.92 -> bought 0.46380149 VOO @ $329.92 -> net cash $0.00
    transactions: [
      // --- 10 აგვ 2026 GOOG liquidation → VOO buy · TBC app · net cash $0.00 ---
      { date: '2026-08-10', type: 'buy',  ticker: 'VOO',  shares: 0.46380149, price: 711.3388, commission: 0 },
      { date: '2026-08-10', type: 'sell', ticker: 'GOOG', shares: 0.88443382, price: 352.8805, commission: 0 },
      // --- 07 აგვ 2026 EGGY liquidation · TBC app · net cash $17.82 ---
      { date: '2026-08-07', type: 'sell', ticker: 'EGGY', shares: 0.52795069, price: 33.753155, commission: 0 },
      // --- 31 Jul 2026 transactions · TBC app ---
      { date: '2026-07-31', type: 'buy',     ticker: 'LYG',  shares: 0.84200954, price: 6.1638, commission: 0.09 },
      { date: '2026-07-31', type: 'buy',     ticker: 'LYG',  shares: 4.00000000, price: 6.1575, commission: 0 },
      { date: '2026-07-31', type: 'sell',    ticker: 'GOOG', shares: 0.08489656, price: 353.3712, commission: 0.09 },
      { date: '2026-07-31', type: 'buy',     ticker: 'EGGY', shares: 0.52795069, price: 32.5788, commission: 0.05 },
      { date: '2026-07-31', type: 'deposit', amount: 17.25 },
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
