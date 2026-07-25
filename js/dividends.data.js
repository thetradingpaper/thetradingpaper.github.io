// ============================================================
// The Trading Paper — Dividend Engine & Schedule Data (window.TP_DIVIDENDS)
// Calculates dividend pay dates ("day sitting on account"), ex-dates,
// expected net amounts (after 30% GE withholding tax), next dividend payout,
// upcoming payout calendar, and payout graph datasets dynamically from window.PORTFOLIOS.
// ============================================================
(function () {
  'use strict';

  var TAX_MULTIPLIER = 0.70; // 30% Georgian withholding tax

  // Known dividend schedules & payout parameters per ticker
  var DIV_META = {
    MAIN: {
      name: 'Main Street Capital',
      freq: 'monthly',
      estDivPerShare: 0.245,
      // Monthly pay dates around 14th-15th of each month; ex-date ~8 days prior
      getDates: function (year, month) {
        var pDay = 15;
        var exDay = 7;
        return {
          exDate: formatDateIso(year, month, exDay),
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
      months: [2, 6, 9, 11], // Mar, Jul, Oct, Dec
      getDates: function (year, month) {
        var pDays = { 2: 29, 6: 2, 9: 2, 11: 29 };
        var pDay = pDays[month] || 2;
        return {
          exDate: formatDateIso(year, month, Math.max(1, pDay - 5)),
          payDate: formatDateIso(year, month, pDay)
        };
      }
    },
    GOOG: {
      name: 'Alphabet Inc',
      freq: 'quarterly',
      estDivPerShare: 0.20,
      months: [2, 5, 8, 11], // Mar, Jun, Sep, Dec
      getDates: function (year, month) {
        var pDay = 16;
        return {
          exDate: formatDateIso(year, month, 5),
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

  // Build 12-month upcoming dividend payout schedule from current date
  function buildUpcomingSchedule(refDate) {
    var now = refDate ? new Date(refDate) : new Date();
    var todayIso = now.toISOString().slice(0, 10);
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth();

    var holdings = getActiveDivHoldings();
    var schedule = [];

    // Generate schedule for 12 months ahead
    for (var mOffset = 0; mOffset < 13; mOffset++) {
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
            // Adjust if divYield is specified and higher
            if (h.divYield > 0 && h.value > 0) {
              var altGross = (h.value * (h.divYield / 100)) / (meta.freq === 'monthly' ? 12 : meta.freq === 'semi-annual' ? 2 : 4);
              if (altGross > gross) gross = altGross;
            }
            var net = gross * TAX_MULTIPLIER;
            schedule.push({
              payDate: dates.payDate,
              exDate: dates.exDate,
              ticker: h.ticker,
              name: h.name,
              bookKey: h.bookKey,
              bookName: h.bookName,
              shares: h.shares,
              grossAmount: gross,
              netAmount: net,
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

  // Extract past received dividends from portfolio transaction logs
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

  // Calculates days remaining between today and payDate
  function getDaysRemaining(payDateIso) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var pDate = new Date(payDateIso);
    pDate.setHours(0, 0, 0, 0);
    var diffTime = pDate - today;
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  }

  // Global Engine Object
  window.TP_DIVIDENDS = {
    // Returns the single next dividend payment object
    getNextDividend: function () {
      var sched = buildUpcomingSchedule();
      if (!sched || !sched.length) return null;
      var next = sched[0];
      next.daysRemaining = getDaysRemaining(next.payDate);
      return next;
    },

    // Returns upcoming dividend payment list
    getUpcomingSchedule: function (months) {
      return buildUpcomingSchedule();
    },

    // Returns past received history
    getReceivedHistory: function () {
      return getReceivedHistory();
    },

    // Calculates overall summary totals
    getSummary: function () {
      var holdings = getActiveDivHoldings();
      var grossTot = 0;
      var valTot = 0;
      holdings.forEach(function (h) {
        valTot += h.value;
        if (h.divYield > 0) {
          grossTot += h.value * (h.divYield / 100);
        } else if (h.meta && h.meta.estDivPerShare) {
          var mult = h.meta.freq === 'monthly' ? 12 : h.meta.freq === 'semi-annual' ? 2 : 4;
          grossTot += h.shares * h.meta.estDivPerShare * mult;
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
        portfolioYieldPct: valTot > 0 ? (netTot / valTot) * 100 : 0,
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
        var d = new Date(item.payDate);
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
