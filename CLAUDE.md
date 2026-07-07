# CLAUDE.md — The Trading Paper playbook

Personal finance/trading site of **Lasha Pkhakadze** (ლაშა ფხაკაძე), Wiesbaden.
Live at **https://thetradingpaper.github.io** (GitHub Pages, branch `main`, no build step).
**All visible content is in Georgian.** Newspaper aesthetic (serif, rules, "გამოცემა №NN").
Every page footer: "ეს არ არის ფინანსური რჩევა" (not financial advice). Keep both.

## The three books (portfolios)

| Key | Broker | Style | Rules |
|---|---|---|---|
| `bog` | Bank of Georgia | Long-term DCA, ETFs, **never withdraw** (reallocate between holdings by conviction is fine) | $100–200/month, goal 35%/yr |
| `tbc` | TBC Capital | Active, one position at a time | written thesis before entry, profits flow to BOG |
| `galt` | Galt & Taggart | 2.5× margin trades (MSTR) | separate capital, never refilled from other books |

## Single source of truth: `js/portfolios.js`

All balances, holdings, transactions and the GALT order live in the `portfolios`
object. Pages render from it. **Never hardcode numbers in HTML that exist there.**

## Auto data (do not hand-edit prices.json)

`.github/workflows/snapshot.yml` runs `scripts/snapshot.js` hourly on weekdays:
fetches Yahoo quotes → commits `data/prices.json` (price fallback for the site)
and upserts today's row in `data/history.json` (drives The Mountain charts on
portfolio.html). If the Action breaks, check the Actions tab first.

**After any edit to `portfolios.js`, always pull/rebase before pushing** — the
bot commits to `main` hourly and you will conflict otherwise.

## Playbook 1 — user drops NEWS or PHOTOS → make an article

1. Photos → `images/YYYY-MM-DD-slug.jpg` (compress if >500KB).
2. Copy `articles/_template.html` → `articles/NN-slug.html` (next number, look at the folder).
3. Fill the `{{...}}` placeholders, write body **in Georgian** in his voice:
   short punchy sentences, newspaper tone, concrete numbers, no hype.
4. Add a card at the TOP of `<div class="grid cols-2">` in `articles.html`
   (copy an existing `<article class="card">`, mark `· ახალი`, remove `ახალი` from older ones).
5. Optionally feature it on `index.html` (the front-page link cards near the top).
6. Commit + push.

## Playbook 2 — user reports a TRADE / DEPOSIT

1. In `js/portfolios.js`, prepend to that book's `transactions` (newest first):
   `{ date, type: 'deposit'|'buy'|'sell', ticker, shares, price, commission }`
2. Update the same book's `holdings` (shares, avgBuy, invested, value) and `cash`.
3. Sanity-check: deposits drive P/L (`aggregate()`); holdings drive value.
4. Bump every `js/portfolios.js?v=...` cache-buster (search-replace across *.html).
5. If GALT limit order fills: set `order.filled = true`, move position into
   `galt.holdings`, set `cash`, and update status text on `margin.html` +
   the GALT banner on `strategy.html` (both have status lines).

## Playbook 3 — new ISSUE (PDF edition)

1. PDF → `pdfs/thetradingpaperN.pdf`.
2. Add entry to `ARCHIVE` array in `portfolio.html` (archive section).
3. Search-replace `გამოცემა №0X` → new number across all *.html (incl. articles/).
4. Mountain history: `data/history.json` keeps daily rows automatically; you may
   add `"label": "ISS 0N"` to today's row so the chart marks the issue.

## Deploy

`git add -A && git commit && git pull --rebase && git push` — Pages redeploys
automatically (1–2 min). The user also has `deploy.bat` scripts on Windows.
If working without git credentials, files can be committed via github.com web UI.

## Gotchas

- `js/gate.js` = soft password gate (pass `111`, localStorage `ttp_unlock_v1`). Don't break the include.
- `js/transactions.js` + `my-*.html`, `trader.html`, `community.html`, `register.html` are legacy/demo (fake data). `history.html` now redirects to portfolio.html. Don't extend them.
- BOG dividend yields: site nets 30% Georgian withholding (`× 0.70` in renderStatBanner).
- TradingView widgets are embedded `<script>` JSON blobs — fragile, don't reformat.
- Yahoo tickers must match exactly (e.g. `WQTM`, `KOID`); new holding = add `divYield` + `color`.

## The Bot · Signal Desk (signals.html)

Book Four: a mechanical swing-signal bot, **paper trading only** — it never touches real money.

- Engine: `scripts/signals.js`, run by `.github/workflows/signals.yml` every 30 min
  during US market hours. Watchlist (5 tickers), rules (R1 oversold bounce / R2
  breakout / R3 trend pullback) and ATR-based exits are constants at the top of the script.
- State: `data/signals.json` (current), `data/bot-state.json` ($100 paper portfolio),
  `data/signals-log.json` (closed trades → public win rate).
- To change watchlist/rules: edit constants in `scripts/signals.js` only. Do NOT
  hand-edit bot data files except to reset (restore the seeded empty shapes).
- The page must always keep the disclaimer: signals are mechanical rules, not advice;
  the user decides real trades. Never frame bot output as guaranteed profit.
