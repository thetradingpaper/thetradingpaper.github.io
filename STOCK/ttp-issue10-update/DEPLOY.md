# The Trading Paper — Issue №10 update (15 Jun 2026)

## Today's trades (BOG · Bank of Georgia book)
- SOLD MSTR — full position 0.29757007 sh @ ~$132.57 → +$39.45 (realized +$4.95; bought 11 Jun @ $114.26)
- BOUGHT WQTM — +1.00906981 sh @ $38.10 ($38.45). New WQTM: 1.68379924 sh, avg $38.09, invested $64.13
- Net cash ≈ $0 (MSTR sale funded the WQTM buy). BOG deposited unchanged at $1,199.26.

## Site changes
- js/portfolios.js — today's two BOG transactions; WQTM updated; MSTR removed from BOG.
- portfolio.html — Book Three (GALT · Leverage) added so all three books show; cache-buster -> ?v=20260615-snap2; masthead -> No.10; archive entry for Issue 10.
- data/history.json — today's row tagged ISS 10.
- 17 other pages — masthead issue number bumped to No.10.
- issue10.html — NEW lean print edition (3 books: holdings, value, deposited, method, history).

## Snapshot (tracked figures)
| Book            | Deposited  | Value      | P/L       | Return |
|-----------------|------------|------------|-----------|--------|
| BOG · Dogma     | $1,199.26  | $1,490.02  | +$290.76  | +24.2% |
| TBC · Active    | $380.36    | $268.50    | -$111.86  | -29.4% |
| GALT · Leverage | $290.00    | $354.25    | +$64.25   | +22.2% |
| TOTAL           | $1,869.62  | $2,112.77  | +$243.15  | +13.0% |

## How to deploy (live site)
1. Copy these files over the same paths in your thetradingpaper.github.io repo (this folder mirrors the repo).
2. (Optional, for the archive link) Open issue10.html -> Print -> Save as PDF -> save as pdfs/thetradingpaper10.pdf.
3. Run deploy.bat  (or: git add -A && git commit -m "Issue 10" && git pull --rebase && git push). Pages redeploys in 1-2 min.

Note: the hourly snapshot bot refreshes live prices after its next run.
If you'd rather I push this for you, point me at the repo folder or your logged-in GitHub in Chrome.
