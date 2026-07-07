# CAPITAL LOG — The Trading Paper

Living memory of capital, trades, and the build. I update this every time you report a trade or we change the site.
**Last updated: 18 Jun 2026.**

---

## 1 · Current capital (snapshot · 18 Jun 2026)

| Book | Broker | Role | Deposited | Value | P/L |
|---|---|---|---|---|---|
| **BOG (Dogma)** | Bank of Georgia | Long-term core · **never withdraw** | $1,199.26 | **$1,517.54** (live) | **+$318.28 (+26.54%)** |
| **TBC** | TBC Capital | Active, one position | $380.36 | $233.94 | −$146.42 (−38.5%) |
| **GALT** | Galt & Taggart | 2.5× margin (MSTR.CFD) | $290.00 | $297.91 equity | +$7.91 (+ realised +$18.85) |
| **TOTAL** | — | — | **$1,869.62** | **$2,049.39** | **+$179.77 (+9.61%)** |

> BOG value is live (your prices, not cached). Net dividend ≈ $6.81/yr (after 30% GE tax). Tracking since 09 Dec 2025.

---

## 2 · Rules (your words)

- **BOG (Dogma):** DCA into ETFs/quality names. **Never withdraw** money. Reallocating *between* holdings by conviction is fine. All trading profit flows here.
- **TBC:** one position at a time, written thesis before entry, profits → BOG.
- **GALT:** 2.5× margin, separate capital, **never refilled** from the other books. Goal: build base to **$1,250**, then route profit to BOG.

---

## 3 · Trade log (newest first)

| Date | Book | Action |
|---|---|---|
| 2026-06-18 | GALT | **BUY 6 MSTR.CFD @ $112.22** — position $673.32, margin $269.33, borrowed $403.99, liq ~$99.50, comm $10. Order CF26M18500515. Equity → $297.91. |
| 2026-06-17 | GALT | **SELL 5 MSTR.CFD @ $124.06** — closed; realised **+$18.85** after $20 commissions. Account → $307.91 flat. |
| 2026-06-17 | BOG | **Rotation:** SELL 1.30645860 ASX @ $38.27 ($50.00, fee $0.50) → BUY 1.46712736 SSRM @ $33.40 ($49.00, fee $0.50). Cash-neutral. |
| 2026-06-10 | GALT | BUY 5 MSTR.CFD @ $116.29 (filled 14:04). |

---

## 4 · Website build status — thetradingpaper.github.io

- **Source of truth = the LIVE repo** `github.com/thetradingpaper/thetradingpaper.github.io` (bots commit `data/*.json` + signals/research constantly; never `portfolios.js`). The local `Desktop/ნამდვილი ვებსაიტი` folder is an **Issue-09 base and is STALE** — do not deploy its HTML wholesale.
- **✅ DEPLOYED 19 Jun (commit 051ce81):** `js/portfolios.js` — reconciled onto the live base (kept your 15 Jun MSTR→WQTM roll; MSTR removed from BOG) + added GALT re-entry (6 @112.22) and BOG ASX→SSRM rotation. The trades are now LIVE.
- **Resolved:** MSTR is **not** in BOG (you closed it 15 Jun, rolled into WQTM). BOG = 10 names + now SSRM.

### Still to do (NOT yet deployed)
- **New Trading Paper:** `thetradingpaper10.pdf` **already exists** on live (published 15 Jun). So the new 18-Jun issue must be **#11** — I have NOT overwritten #10. Needs: renumber HTML→Issue 11, render `pdfs/thetradingpaper11.pdf`, add archive entry to the **live** `portfolio.html`.
- **Cosmetic HTML** (dark `margin.html`, homepage 3rd-book live balance, `strategy.html` GALT banner): local versions are stale (live added a "Total Portfolio hero" on 15 Jun the local lacks). Must re-apply onto the LIVE files before deploying — do NOT push local HTML.

---

## 5 · The money plan (why we're doing this)

1. **GALT** — disciplined leveraged trades on confirmed edge; grow the base to $1,250.
2. **Profit → BOG** — the long-term compounding core (goal 35%/yr), never withdrawn.
3. **The website** — public journal = credibility + future monetization (articles, community, the bot's signals).
4. Build online presence step by step; each issue of The Trading Paper documents the progress.

---

## 6 · Next steps

- [ ] Confirm whether MSTR is held in BOG (live shows 10 names).
- [ ] Deploy the pending files + upload `pdfs/thetradingpaper10.pdf`.
- [ ] Daily per-company articles on the სტატიები page (you provide the content).
