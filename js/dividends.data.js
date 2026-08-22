// ============================================================
// The Trading Paper — Dividend Engine & Schedule Data (window.TP_DIVIDENDS)
// Calculates dividend pay dates ("day sitting on account"), ex-dates,
// expected net amounts (after 30% GE withholding tax), next dividend payout,
// upcoming payout calendar, and payout graph datasets dynamically from window.PORTFOLIOS.
// Last updated: 22 Aug 2026 — added KO & DIVO schedules, corrected MAIN regular
// monthly rate to $0.265 + quarterly supplementals, fixed local-timezone date math.
// ============================================================
(function () {
  'use strict';

  var TAX_MULTIPLIER = 0.70; // 30% Georgian withholding tax

  // Known dividend schedules & payout parameters per ticker
  var DIV_META = {
    MAIN: {
      name: 'Main Street Capital',
      freq: 'monthly',
      estDivPerShare: 0.265,
      // MAIN also pays a SUPPLEMENTAL dividend once a quarter (Mar/Jun/Sep/Dec),
      // paid around the 28th. Optional fields — every other ticker omits them.
      supplementalPerShare: 0.30,
      supplementalMonths: [2, 5, 8, 11], // Mar, Jun, Sep, Dec (0-indexed)
      // Monthly pay dates around 14th-15th of each month; ex-date ~8 days prior
      getDates: function (year, month) {
        var pDay = 15;
        var exDay = 7;
        return {
          exDate: formatDateIso(year, month, exDay),
          payDate: formatDateIso(year, month, pDay)
        };
      },
      getSupplementalDates: function (year, month) {
        var pDay = 28;
        return {
          exDate: shiftIso(year, month, pDay, -14),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    ARCC: {
      name: 'Ares Capital Corp',
      freq: 'quarterly',
      estDivPerShare: 0.48,
      months: [2, 5, 8, 11], // Mar, Jun, Sep, Dec (0-indexed)
      getDates: function (year, month) {
        var exDay = 14;
        var pDay = (month === 2) ? 31 : (month === 5) ? 30 : (month === 8) ? 30 : 31;
        return {
          exDate: formatDateIso(year, month, exDay),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    BXSL: {
      name: 'Blackstone Secured Lending',
      freq: 'quarterly',
      estDivPerShare: 0.77,
      months: [0, 3, 6, 9], // Jan, Apr, Jul, Oct (0-indexed)
      getDates: function (year, month) {
        var days = [23, 23, 24, 23];
        var idx = [0, 3, 6, 9].indexOf(month);
        var pDay = days[idx] || 23;
        return {
          exDate: formatDateIso(year, month, Math.max(1, pDay - 10)),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    LYG: {
      name: 'Lloyds Banking Group',
      freq: 'semi-annual',
      estDivPerShare: 0.11,
      months: [4, 8], // May, Sep (0-indexed)
      getDates: function (year, month) {
        var pDay = (month === 4) ? 22 : 18;
        return {
          exDate: formatDateIso(year, month, pDay - 14),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    VOO: {
      name: 'Vanguard S&P 500 ETF',
      freq: 'quarterly',
      estDivPerShare: 1.962,
      months: [2, 5, 8, 11], // Mar, Jun, Sep, Dec (0-indexed)
      getDates: function (year, month) {
        var pDays = { 2: 29, 5: 30, 8: 30, 11: 29 };
        var pDay = pDays[month] || 30;
        return {
          exDate: formatDateIso(year, month, Math.max(1, pDay - 5)),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    KO: {
      name: 'Coca-Cola Company',
      freq: 'quarterly',
      estDivPerShare: 0.53,
      months: [3, 6, 9, 11], // Apr, Jul, Oct, Dec (0-indexed)
      getDates: function (year, month) {
        // Pays the 1st of Apr/Jul/Oct and ~the 15th of December; ex-date ~15 days prior
        var pDay = (month === 11) ? 15 : 1;
        return {
          exDate: shiftIso(year, month, pDay, -15),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    DIVO: {
      name: 'Amplify CWP Enhanced Dividend Income ETF',
      freq: 'monthly',
      estDivPerShare: 0.1834,
      // Distributes on the last business day of every month; ex-date ~1 day prior
      getDates: function (year, month) {
        var pDay = new Date(year, month + 1, 0).getDate();
        return {
          exDate: shiftIso(year, month, pDay, -1),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    }
  };

  function formatDateIso(y, m, d) {
    var mm = String(m + 1).padStart(2, '0');
    var dd = String(d).padStart(2, '0');
    return y + '-' + mm + '-' + dd;
  }

  // Shift a calendar date by N days and return it as a local-safe ISO string.
  // Handles month/year rollover (e.g. 1 Apr minus 15 days -> 17 Mar).
  function shiftIso(y, m, d, deltaDays) {
    var dt = new Date(y, m, d);
    dt.setDate(dt.getDate() + deltaDays);
    return formatDateIso(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  // Parse a 'YYYY-MM-DD' string as a LOCAL date. new Date('2026-08-22') is parsed
  // as UTC midnight, which reads as the previous day west of Greenwich and skews
  // every countdown by a day east of it. Split the parts and build locally instead.
  function parseIsoLocal(value) {
    if (value instanceof Date) return value;
    var parts = String(value).slice(0, 10).split('-');
    if (parts.length === 3) {
      return new Date(+parts[0], (+parts[1]) - 1, +parts[2]);
    }
    return new Date(value);
  }

  // Local 'YYYY-MM-DD' for a Date object (never via toISOString, which is UTC)
  function toIsoLocal(dt) {
    return formatDateIso(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  function parsePortfolios() {
    return window.PORTFOLIOS || {};
  }

  // Get active holdings across all portfolios that yield dividends
  function getActiveDivHoldings() {
    var P = parsePortfolios();
    var holdings = [];
    ['bog', 'tbc', 'galt'].forEach(function (bookKey) {
      var book = P[bookKey];
      if (!book || !book.holdings || book.status === 'closed') return;
      book.holdings.forEach(function (h) {
        var shares = +h.shares || 0;
        if (shares <= 0) return;
        var meta = DIV_META[h.ticker];
        var divYield = typeof h.divYield === 'number' ? h.divYield : 0;
        if (meta || divYield > 0) {
          holdings.push({
            ticker: h.ticker,
            name: h.name || (meta ? meta.name : h.ticker),
            bookKey: bookKey,
            bookName: book.name || bookKey.toUpperCase(),
            shares: shares,
            value: +h.value || (shares * (+h.avgBuy || 0)),
            divYield: divYield,
            meta: meta
          });
        }
      });
    });
    return holdings;
  }

  // Build an upcoming dividend payout schedule from a reference date.
  // months = how many calendar months to walk (default 13 = the next 12 + current).
  function buildUpcomingSchedule(refDate, months) {
    var now = refDate ? parseIsoLocal(refDate) : new Date();
    var todayIso = toIsoLocal(now);
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth();
    var horizon = (typeof months === 'number' && months > 0) ? Math.floor(months) : 13;

    var holdings = getActiveDivHoldings();
    var schedule = [];

    for (var mOffset = 0; mOffset < horizon; mOffset++) {
      var targetDate = new Date(currentYear, currentMonth + mOffset, 1);
      var y = targetDate.getFullYear();
      var m = targetDate.getMonth();

      holdings.forEach(function (h) {
        var meta = h.meta;
        if (!meta) {
          // General fallback for any dividend stock without explicit schedule
          if (h.divYield > 0 && mOffset % 3 === 0) {
            var annualGross = h.value * (h.divYield / 100);
            var qGross = annualGross / 4;
            var payIso = formatDateIso(y, m, 15);
            if (payIso >= todayIso) {
              schedule.push({
                payDate: payIso,
                exDate: formatDateIso(y, m, 7),
                ticker: h.ticker,
                name: h.name,
                bookKey: h.bookKey,
                bookName: h.bookName,
                shares: h.shares,
                kind: 'regular',
                grossAmount: qGross,
                netAmount: qGross * TAX_MULTIPLIER,
                status: 'upcoming'
              });
            }
          }
          return;
        }

        var isPayMonth = false;
        if (meta.freq === 'monthly') {
          isPayMonth = true;
        } else if (meta.months && meta.months.indexOf(m) !== -1) {
          isPayMonth = true;
        }

        if (isPayMonth) {
          var dates = meta.getDates(y, m);
          if (dates.payDate >= todayIso) {
            var gross = h.shares * meta.estDivPerShare;
            var net = gross * TAX_MULTIPLIER;
            schedule.push({
              payDate: dates.payDate,
              exDate: dates.exDate,
              ticker: h.ticker,
              name: h.name,
              bookKey: h.bookKey,
              bookName: h.bookName,
              shares: h.shares,
              kind: 'regular',
              grossAmount: gross,
              netAmount: net,
              status: 'upcoming'
            });
          }
        }

        // Optional supplemental dividend (currently MAIN only). No-op for every
        // ticker without supplementalPerShare / supplementalMonths.
        if (meta.supplementalPerShare && meta.supplementalMonths &&
            meta.supplementalMonths.indexOf(m) !== -1) {
          var sDates = meta.getSupplementalDates
            ? meta.getSupplementalDates(y, m)
            : meta.getDates(y, m);
          if (sDates.payDate >= todayIso) {
            var sGross = h.shares * meta.supplementalPerShare;
            schedule.push({
              payDate: sDates.payDate,
              exDate: sDates.exDate,
              ticker: h.ticker + ' SUPP',
              name: h.name + ' · supplemental',
              bookKey: h.bookKey,
              bookName: h.bookName,
              shares: h.shares,
              kind: 'supplemental',
              grossAmount: sGross,
              netAmount: sGross * TAX_MULTIPLIER,
              status: 'upcoming'
            });
          }
        }
      });
    }

    // Sort by payDate ascending
    schedule.sort(function (a, b) { return a.payDate < b.payDate ? -1 : (a.payDate > b.payDate ? 1 : 0); });
    return schedule;
  }

  // Extract past received dividends from portfolio transaction logs.
  // Reads { date, type:'dividend', ticker, amount, note } rows — amount is NET
  // (after the 30% GE withholding), matching the label on dividends.html.
  function getReceivedHistory() {
    var P = parsePortfolios();
    var history = [];
    Object.keys(P).forEach(function (k) {
      var p = P[k];
      if (!p || !p.transactions) return;
      p.transactions.forEach(function (t) {
        if (t.type === 'dividend') {
          history.push({
            date: t.date,
            ticker: t.ticker || 'DIV',
            bookKey: k,
            bookName: p.name || k.toUpperCase(),
            amount: +t.amount || 0,
            note: t.note || ''
          });
        }
      });
    });
    history.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    return history;
  }

  // Calculates days remaining between today and payDate (both local midnight)
  function getDaysRemaining(payDateIso) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var pDate = parseIsoLocal(payDateIso);
    pDate.setHours(0, 0, 0, 0);
    var diffTime = pDate - today;
    var diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  }

  // Global Engine Object
  window.TP_DIVIDENDS = {
    DIV_META: DIV_META,

    // Returns the single next dividend payment object
    getNextDividend: function () {
      var sched = buildUpcomingSchedule();
      if (!sched || !sched.length) return null;
      var next = sched[0];
      next.daysRemaining = getDaysRemaining(next.payDate);
      return next;
    },

    // Returns upcoming dividend payment list.
    // months (optional) = how many calendar months to walk; defaults to 13.
    getUpcomingSchedule: function (months) {
      return buildUpcomingSchedule(null, months);
    },

    // Exposed for testing / date-independent verification
    buildUpcomingSchedule: buildUpcomingSchedule,

    // Returns past received history
    getReceivedHistory: function () {
      return getReceivedHistory();
    },

    // Calculates overall summary totals
    getSummary: function () {
      var P = parsePortfolios();
      var holdings = getActiveDivHoldings();
      var grossTot = 0;
      var divValTot = 0;
      var totalPortVal = 0;

      Object.keys(P).forEach(function(k) {
        var p = P[k];
        if (!p || p.status === 'closed') return;
        totalPortVal += (+p.cash || 0);
        if (p.holdings) {
          p.holdings.forEach(function(h) {
            totalPortVal += (+h.value || 0);
          });
        }
      });

      holdings.forEach(function (h) {
        divValTot += h.value;
        var meta = h.meta;
        if (meta && meta.estDivPerShare) {
          var freqMult = (meta.freq === 'monthly') ? 12 : (meta.freq === 'semi-annual') ? 2 : 4;
          grossTot += h.shares * meta.estDivPerShare * freqMult;
          // Supplementals (MAIN only today) — no-op without the optional fields
          if (meta.supplementalPerShare && meta.supplementalMonths) {
            grossTot += h.shares * meta.supplementalPerShare * meta.supplementalMonths.length;
          }
        } else if (h.divYield > 0) {
          grossTot += h.value * (h.divYield / 100);
        }
      });

      var netTot = grossTot * TAX_MULTIPLIER;
      var recHistory = getReceivedHistory();
      var totalReceived = recHistory.reduce(function (s, r) { return s + r.amount; }, 0);
      var next = window.TP_DIVIDENDS.getNextDividend();

      return {
        annualGross: grossTot,
        annualNet: netTot,
        monthlyNetAvg: netTot / 12,
        divHoldingsValue: divValTot,
        totalPortfolioValue: totalPortVal,
        portfolioYieldPct: totalPortVal > 0 ? (netTot / totalPortVal) * 100 : 0,
        divHoldingsYieldPct: divValTot > 0 ? (netTot / divValTot) * 100 : 0,
        totalReceived: totalReceived,
        receivedCount: recHistory.length,
        nextDividend: next
      };
    },

    // Generates graph dataset for Chart.js (Dates vs Payout Amount)
    getTimelineChartData: function () {
      var sched = buildUpcomingSchedule();
      var labels = [];
      var netAmounts = [];
      var tickers = [];
      var fullDetails = [];

      // Group by payDate or list sequentially
      sched.slice(0, 12).forEach(function (item) {
        var d = parseIsoLocal(item.payDate);
        var label = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
        labels.push(label + ' (' + item.ticker + ')');
        netAmounts.push(+item.netAmount.toFixed(2));
        tickers.push(item.ticker);
        fullDetails.push(item);
      });

      return {
        labels: labels,
        datasets: [{
          label: 'ჩარიცხვის თანხა ($ net)',
          data: netAmounts,
          backgroundColor: '#166534',
          borderColor: '#15803d',
          borderWidth: 1,
          borderRadius: 4
        }],
        details: fullDetails
      };
    }
  };

})();
