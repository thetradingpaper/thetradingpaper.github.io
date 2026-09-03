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
      { ticker: 'QBTS', name: 'D-Wave Quantum Inc',           shares: 5.53863195, avgBuy: 18.06,  invested: 100.00, value: 100.00, color: '#a855f7', divYield: 0.00 },
      { ticker: 'NVTS', name: 'Navitas Semiconductor Corp', shares: 1.19821705, avgBuy: 12.52,  invested: 15.00,  value: 15.00,  color: '#06b6d4', divYield: 0.00 },
      { ticker: 'BE',   name: 'Bloom Energy Corp',            shares: 0.06874464, avgBuy: 218.20, invested: 15.00,  value: 15.00,  color: '#84cc16', divYield: 0.00 },
      { ticker: 'SOXX', name: 'iShares Semiconductor ETF',    shares: 0.02880467, avgBuy: 520.75, invested: 15.00,  value: 15.00,  color: '#0f766e', divYield: 0.70 },
      { ticker: 'SMH',  name: 'VanEck Semiconductor ETF',     shares: 0.02845432, avgBuy: 567.23, invested: 16.14,  value: 16.11,  color: '#0284c7', divYield: 0.80 },
      { ticker: 'VRT',  name: 'Vertiv Holdings Co',           shares: 0.04262412, avgBuy: 262.53, invested: 11.19,  value: 11.20,  color: '#16a34a', divYield: 0.10 },
      { ticker: 'RKLB', name: 'Rocket Lab USA Inc',           shares: 0.24470449, avgBuy: 65.63,  invested: 16.06,  value: 16.01,  color: '#e11d48', divYield: 0.00 },
      { ticker: 'MU',   name: 'Micron Technology Inc',        shares: 0.01210279, avgBuy: 908.88, invested: 11.00,  value: 11.01,  color: '#8b5cf6', divYield: 0.50 },
      { ticker: 'MRVL', name: 'Marvell Technology Group Ltd', shares: 0.08123873, avgBuy: 217.63, invested: 17.68,  value: 17.62,  color: '#2563eb', divYield: 0.00 },
    ],
    cash: 0.00, // 03 Sep 2026: NVDA liquidated -> RKLB; 02 Sep: SNDK liquidated -> MRVL -> net cash balance $0.00
    previousValue: 671.08, // 11 Aug 2026 value prior to closing SMCZ position
    priorDeposits: 2297.66, // $997.66 base + $1,300.00 historical lost BOG bank deposits
    priorCostBasis: 1007.05,
    transactions: [
      // Newest first
      // --- 03 სექ 2026 BOG rotation: NVDA liquidation → RKLB buy · BOG app · net cash $0.00 ---
      { date: '2026-09-03', type: 'buy',     ticker: 'RKLB', shares: 0.08024256, price: 63.0588,  commission: 0 },
      { date: '2026-09-03', type: 'sell',    ticker: 'NVDA', shares: 0.02220260, price: 227.9012, commission: 0 },
      // --- 02 სექ 2026 BOG rotation: SNDK liquidation → MRVL buy · BOG app · net cash $0.00 ---
      { date: '2026-09-02', type: 'buy',     ticker: 'MRVL', shares: 0.05565943, price: 205.8950, commission: 0 },
      { date: '2026-09-02', type: 'sell',    ticker: 'SNDK', shares: 0.00744074, price: 1540.1694, commission: 0 },
      // --- 27 აგვ 2026 BOG $210.22 deposit & 12 purchases · BOG app · net cash $0.00 ---
      { date: '2026-08-27', type: 'buy',     ticker: 'QBTS', shares: 0.53863195, price: 18.05,   commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'QBTS', shares: 5.00000000, price: 18.056,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'NVDA', shares: 0.02220260, price: 225.20,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'MU',   shares: 0.01098902, price: 910.00,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'VRT',  shares: 0.03791198, price: 263.77,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'SNDK', shares: 0.00681060, price: 1468.30, commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'SOXX', shares: 0.02880467, price: 520.75,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'NVTS', shares: 0.19821705, price: 12.51,   commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'NVTS', shares: 1.00000000, price: 12.52,   commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'BE',   shares: 0.06874464, price: 218.20,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'SMH',  shares: 0.02642060, price: 567.74,  commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'RKLB', shares: 0.15058245, price: 66.41,   commission: 0 },
      { date: '2026-08-27', type: 'buy',     ticker: 'MRVL', shares: 0.02148512, price: 242.96,  commission: 0 },
      { date: '2026-08-27', type: 'deposit', amount: 210.22, note: 'ახალი დეპოზიტი ($210.22)' },
      // --- 24 აგვ 2026 BOG new portfolio (მძიმე ტექნოლოგიური სექტორი) · $6.33 deposit & 6 buys · BOG app · net cash $0.00 ---
      { date: '2026-08-24', type: 'buy',     ticker: 'VRT',  shares: 0.00471214, price: 252.54,  commission: 0 },
      { date: '2026-08-24', type: 'buy',     ticker: 'SMH',  shares: 0.00203372, price: 560.55,  commission: 0 },
      { date: '2026-08-24', type: 'buy',     ticker: 'MU',   shares: 0.00111377, price: 897.85,  commission: 0 },
      { date: '2026-08-24', type: 'buy',     ticker: 'RKLB', shares: 0.01387948, price: 72.05,   commission: 0 },
      { date: '2026-08-24', type: 'buy',     ticker: 'MRVL', shares: 0.00409418, price: 244.25,  commission: 0 },
      { date: '2026-08-24', type: 'buy',     ticker: 'SNDK', shares: 0.00063014, price: 1586.95, commission: 0 },
      { date: '2026-08-24', type: 'deposit', amount: 6.33, note: 'ახალი დეპოზიტი (მძიმე ტექნოლოგიური სექტორი)' },
      // --- 17 აგვ 2026 BOG fully cleared · $400 → TBC ($4 bank fee), $214.82 withdrawn · BOG app · net cash $0.00 ---
      { date: '2026-08-17', type: 'withdraw', amount: 214.82, note: 'BOG ანგარიშის სრული დახურვა · გატანა' },
      { date: '2026-08-17', type: 'fee',      amount: 4.00,   note: 'ბანკის საკომისიო · გადარიცხვა $250 TBC-ში' },
      { date: '2026-08-17', type: 'fee',      amount: 4.00,   note: 'ბანკის საკომისიო · გადარიცხვა BOG→TBC' },
      { date: '2026-08-17', type: 'deposit',  amount: -400.00, note: 'გადატანა → TBC' },
      { date: '2026-08-14', type: 'sell', ticker: 'SNDK', shares: 0.35000000, price: 1659.4857, commission: 0 },
      { date: '2026-08-14', type: 'buy',  ticker: 'SNDK', shares: 0.35000000, price: 1600.00,    commission: 0 },
      { date: '2026-08-14', type: 'sell', ticker: 'CRWV', shares: 0.93720800, price: 113.6353,   commission: 0 },
      { date: '2026-08-14', type: 'sell', ticker: 'AMD',  shares: 0.20521711, price: 518.9626,   commission: 0 },
      { date: '2026-08-14', type: 'sell', ticker: 'NBIS', shares: 0.40464532, price: 263.1930,   commission: 0 },
      { date: '2026-08-14', type: 'sell', ticker: 'SNDK', shares: 0.08041847, price: 1461.3551,  commission: 0 },
      { date: '2026-08-14', type: 'sell', ticker: 'SMCI', shares: 4.09108811, price: 39.3584,    commission: 0 },
      // --- 13 აგვ 2026 BOG deposit ($51.00) & SMCI purchases (1.28671554 sh total) · BOG app · net cash $0.00 ---
      { date: '2026-08-13', type: 'buy',  ticker: 'SMCI', shares: 0.28671554, price: 39.6211843, commission: 0 },
      { date: '2026-08-13', type: 'buy',  ticker: 'SMCI', shares: 1.00000000, price: 39.64,      commission: 0 },
      { date: '2026-08-13', type: 'deposit', amount: 51.00 },
      // --- 12 აგვ 2026 BOG 5-stock reinvestment (SMCI, SNDK, NBIS, AMD, CRWV) · BOG app · $510.40 total invested · net cash $0.00 ---
      { date: '2026-08-12', type: 'buy',  ticker: 'CRWV', shares: 0.93720800, price: 106.70, commission: 0 },
      { date: '2026-08-12', type: 'buy',  ticker: 'AMD',  shares: 0.20521711, price: 487.29, commission: 0 },
      { date: '2026-08-12', type: 'buy',  ticker: 'NBIS', shares: 0.40464532, price: 247.13, commission: 0 },
      { date: '2026-08-12', type: 'buy',  ticker: 'SNDK', shares: 0.08041847, price: 1372.82, commission: 0 },
      { date: '2026-08-12', type: 'buy',  ticker: 'SMCI', shares: 2.80437257, price: 35.66,  commission: 0 },
      // --- 12 აგვ 2026 BOG SMCZ (2X Short SMCI ETF) closed · BOG app · proceeds $510.40 · net cash $510.40 ---
      { date: '2026-08-12', type: 'sell', ticker: 'SMCZ', shares: 118.14776384, price: 4.32001557, commission: 0 },
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
      { ticker: 'MSTR', name: 'Strategy Inc', shares: 6.15861531, avgBuy: 125.66, invested: 773.90, value: 755.23, color: '#1a1a1a', divYield: 0.00 },
      { ticker: 'ARCC', name: 'Ares Capital Corporation', shares: 2.27151778, avgBuy: 18.47, invested: 41.96, value: 44.73, color: '#1d4ed8', divYield: 10.40 },
      { ticker: 'MAIN', name: 'Main Street Capital Corporation', shares: 3.597, avgBuy: 53.51, invested: 192.48, value: 211.05, color: '#15803d', divYield: 6.20 },
      { ticker: 'BXSL', name: 'Blackstone Secured Lending Fund', shares: 3.09841001, avgBuy: 23.35, invested: 72.34, value: 75.45, color: '#7c3aed', divYield: 12.90 },
      { ticker: 'LYG', name: 'Lloyds Banking Group plc', shares: 39.60600954, avgBuy: 6.07, invested: 240.23, value: 245.16, color: '#006a4d', divYield: 3.66 },
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 1.00686969, avgBuy: 696.35, invested: 701.13, value: 717.23, color: '#2563eb', divYield: 1.30 },
      { ticker: 'KO',   name: 'Coca-Cola Company, The', shares: 2.28860792, avgBuy: 87.13, invested: 199.40, value: 199.04, color: '#dc2626', divYield: 3.10 },
      { ticker: 'DIVO', name: 'Amplify CWP Enhanced Dividend ETF', shares: 3.11960181, avgBuy: 48.59, invested: 151.58, value: 151.58, color: '#0284c7', divYield: 4.50 },
    ],
    cash: 0.00, // 02 Sep 2026: DIVO dividend ($0.43) fully reinvested into MSTR (0.00351396 sh) -> net cash $0.00
    priorDeposits: 2215.00, // $2,215.00 historical lost TBC bank deposits
    priorCostBasis: 0.00,
    transactions: [
      // Dividend rows feed dividends.html (სულ მიღებული) and the historical-growth graph.
      // Shape — amount is ALWAYS the NET figure credited to the account (after 30% GE tax):
      //   { date: '2026-08-15', type: 'dividend', ticker: 'MAIN', amount: 0.62, note: 'monthly · net after 30% GE' },
      // Add one row per real credit from the TBC statement. Never estimate — the
      // upcoming calendar projects estimates; this array holds actual receipts only.
      // --- 02 სექ 2026 MSTR purchase from DIVO dividend ($0.43) · TBC app · net cash $0.00 ---
      { date: '2026-09-02', type: 'buy',     ticker: 'MSTR', shares: 0.00351396, price: 122.37,   commission: 0 },
      // --- 31 აგვ 2026 DIVO dividend · TBC app · net cash $0.43 ---
      { date: '2026-08-31', type: 'dividend', ticker: 'DIVO', amount: 0.43, note: 'დივიდენდის ჩარიცხვა $0.61 − გადასახადი $0.18 = წმინდა $0.43' },
      // --- 25 აგვ 2026 TBC GOOG liquidation → MSTR purchases ($126.50 + $72.75) · TBC app · net cash $0.00 ---
      { date: '2026-08-25', type: 'buy',     ticker: 'MSTR', shares: 0.59324798, price: 122.63,   commission: 0.22 },
      { date: '2026-08-25', type: 'buy',     ticker: 'MSTR', shares: 1.03155835, price: 122.63,   commission: 0.38 },
      { date: '2026-08-25', type: 'sell',    ticker: 'GOOG', shares: 0.58494925, price: 342.6791, commission: 0.60 },
      // --- 17 აგვ 2026 TBC $250 deposit & purchases (DIVO, KO) · TBC app · net cash $0.00 ---
      { date: '2026-08-17', type: 'buy',     ticker: 'DIVO', shares: 0.02850092, price: 48.42,  commission: 0.15 },
      { date: '2026-08-17', type: 'buy',     ticker: 'DIVO', shares: 1.00000000, price: 48.47,  commission: 0 },
      { date: '2026-08-17', type: 'buy',     ticker: 'KO',   shares: 0.28860792, price: 87.14,  commission: 0.60 },
      { date: '2026-08-17', type: 'buy',     ticker: 'KO',   shares: 2.00000000, price: 87.125, commission: 0 },
      { date: '2026-08-17', type: 'deposit', amount: 250.00 },
      // --- 17 აგვ 2026 BOG→TBC transfer ($400.00) & purchases (DIVO, GOOG, VOO, MSTR) · TBC app · net cash $0.00 ---
      { date: '2026-08-17', type: 'buy',     ticker: 'DIVO', shares: 2.09110089, price: 47.82,  commission: 0 },
      { date: '2026-08-17', type: 'buy',     ticker: 'GOOG', shares: 0.58494925, price: 341.91,  commission: 0 },
      { date: '2026-08-17', type: 'buy',     ticker: 'VOO',  shares: 0.02806820, price: 712.55,  commission: 0.06 },
      { date: '2026-08-17', type: 'buy',     ticker: 'MSTR', shares: 0.84429502, price: 95.18,   commission: 0.24 },
      { date: '2026-08-17', type: 'deposit', amount: 400.00, note: 'გადმოტანა ← BOG' },
      // --- 14 აგვ 2026 MAIN dividend · TBC app · net cash $0.66 ---
      { date: '2026-08-14', type: 'dividend', ticker: 'MAIN', amount: 0.66, note: 'დივიდენდის ჩარიცხვა $0.95 − გადასახადი $0.29 = წმინდა $0.66' },
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
