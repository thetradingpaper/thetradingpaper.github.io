# Portfolio AI — what's live and which keys turn on the rest

Live at `/ai.html` (landing) and `/app/` (the app). Price: **29.99 ₾ / month** (payments not wired yet).

## Pages
| Page | What it does |
|---|---|
| `app/login.html` | Register / log in. "შედი როგორც ლაშა" = Lasha's real portfolio (synced from `js/portfolios.data.js`). |
| `app/index.html` | Dashboard: totals, books (any broker, any currency), allocation, positions with live prices, recent ops, AI assistant. |
| `app/editor.html` | Drop/paste screenshots → AI reads them → adds to the portfolio automatically (with undo). Manual entry, books (Georgian + foreign brokers), all operations. |
| `app/paper.html` | Monthly personal newspaper, printable to PDF; "AI-ით დაწერა" rewrites it with Gemini. |
| `app/settings.html` | Name, currency (USD/GEL/EUR), dividend tax %, Gemini key, manual prices, export/import, logout/delete. |

## Works today with no keys
- Accounts + data stored **on the user's device** (localStorage).
- Screenshot reading with **free in-browser OCR** (Tesseract, Georgian + English) + rules — tested on a BOG "ფასიანი ქაღალდის შეძენა" screen.
- Live US prices via the site's public Finnhub key; FX via open.er-api.com.

## Keys that switch on the full product
| Key | Where it goes | What it unlocks | Cost |
|---|---|---|---|
| `GEMINI_API_KEY` | Cloudflare Pages → Settings → Variables (Secret) | `/api/vision` — every user's screenshots read by Gemini (any bank, any language) | Gemini 3.1 Flash-Lite ≈ $0.25 / 1M input, $1.50 / 1M output tokens |
| Gemini key (personal) | app → Settings → AI | Same, but only on that device (for testing / Lasha) | same |
| `supabaseUrl` + `supabaseAnonKey` | `app/pai-config.js` (public values) after running `supabase/portfolio_ai.sql` | Cloud accounts: log in from any device | Free tier (pauses after 7 idle days) → Pro $25/mo |
| `ANTHROPIC_API_KEY` (optional) | Cloudflare Pages secret | Claude mode for the assistant (`/api/ai`) | per token |
| Payments | BOG / TBC merchant account | 29.99 ₾ subscription | merchant fees |

Note: `/api/vision` and `/api/ai` run on **thetradingpaper.pages.dev** (Cloudflare Pages Functions). The GitHub Pages site calls them cross-origin; if pages.dev isn't deployed from this repo, the app silently falls back to the free OCR / local assistant.
