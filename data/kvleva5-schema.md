# კვლევა 5.0 — Schema Handoff

**Owner of this file:** the კვლევა 5.0 agent (research engine + `/functions/api/*`).
**Audience:** the agent building `/kvleva5/journal` and `/kvleva5/legal`.
Last updated: 2026-07-12. If the contract below changes, this file changes with it.

This document is the single source of truth for two things:

1. the exact JSON shape of the **signal track record** (`data/kvleva5-signals.json` + `GET /api/signals`), and
2. the mandatory **bilingual disclaimer block** that must appear on every კვლევა 5.0 page.

---

## 1 · Signal track record

Every time `/api/dossier` produces a real composite score, it appends one **signal
record** to the running log. This is the track record the journal page reads and grades.

### 1.1 Where the data lives

| Source | What it is | Use it for |
|---|---|---|
| `GET /api/signals` | **Live log** — reads from KV (`TP_KV`), newest-first. This is canonical. | The journal page should read this first. |
| `data/kvleva5-signals.json` | **Static seed baseline**, committed to the repo. Ships as `[]`. | Fallback when the Functions runtime is unavailable (e.g. the `github.io` static mirror, which cannot run Functions). |

**Recommended read pattern for the journal page** (same one `/kvleva5/index.html` uses):

```js
async function loadSignals() {
  try {
    const r = await fetch('/api/signals', { cache: 'no-store' });
    if (!r.ok) throw 0;
    return (await r.json()).signals;          // live, newest-first
  } catch (e) {
    const r = await fetch('/data/kvleva5-signals.json?t=' + Date.now());
    return r.ok ? await r.json() : [];        // static seed fallback
  }
}
```

### 1.2 `GET /api/signals` — response envelope

```json
{
  "ok": true,
  "source": "kv",          // "kv" | "kv-error" | "none" (no KV bound)
  "count": 3,
  "signals": [ /* signal records, NEWEST FIRST */ ]
}
```

### 1.3 The signal record (the important part)

`data/kvleva5-signals.json` is a **flat JSON array** of signal records. Each record:

```json
{
  "id": "2026-07-12-AAPL-lqx3f9",
  "ts": "2026-07-12T18:22:04.517Z",
  "date": "2026-07-12",
  "ticker": "AAPL",
  "price": 227.50,
  "score": 79,
  "band": "STRONG RESEARCH INTEREST",
  "bandKa": "ძლიერი კვლევითი ინტერესი"
}
```

**Field contract:**

| field | type | required | notes |
|---|---|---|---|
| `id` | string | yes | Stable unique id: `` `${date}-${ticker}-${base36(now)}` ``. Safe as a list key. |
| `ts` | string (ISO 8601) | yes | Full UTC timestamp the signal was logged. |
| `date` | string `YYYY-MM-DD` | yes | UTC date of generation. **This is the field the brief calls for.** |
| `ticker` | string | yes | Uppercase symbol, e.g. `"AAPL"`, `"BRK.B"`. |
| `price` | number | yes | Price used at generation, in the instrument's currency (USD unless noted), 2 dp. |
| `score` | number \| null | yes | Composite **0–100** integer. `null` only if it was ever logged with insufficient data (the engine normally does **not** log null-score dossiers). |
| `band` | string | yes | English canonical band (see enum below). |
| `bandKa` | string \| null | no | Georgian band label, for display convenience. |

> The four fields the original brief specifies — `date`, `ticker`, `price`, `score`, `band` —
> are all present and stable. `id`, `ts`, `bandKa` are additive extras; ignore them if you don't need them.

### 1.4 Band enum (score → band)

Bands are a **research classification, never buy/sell advice.** Thresholds:

| score range | `band` (English canonical) | `bandKa` (Georgian) |
|---|---|---|
| 75–100 | `STRONG RESEARCH INTEREST` | ძლიერი კვლევითი ინტერესი |
| 60–74  | `WATCH` | სათვალყურო |
| 45–59  | `NEUTRAL` | ნეიტრალური |
| 30–44  | `WEAK` | სუსტი |
| 0–29   | `SHORT-SIDE CANDIDATE` | ქვევითი მოძრაობის კანდიდატი |

(When a score cannot be computed the dossier reports band `INSUFFICIENT DATA` /
`არასაკმარისი მონაცემები`, but such records are **not** written to the log.)

### 1.5 `POST /api/signals` — append (optional, for tooling)

The dossier endpoint logs automatically, so the journal page usually only **reads**.
If you ever need to append manually:

```
POST /api/signals
content-type: application/json
{ "ticker": "AAPL", "price": 227.5, "score": 79, "band": "STRONG RESEARCH INTEREST" }
```
→ `{ "ok": true, "stored": true, "signal": { ...full record... }, "count": 42 }`
If KV is not bound: `{ "ok": true, "stored": false, "reason": "kv-not-configured", ... }` (still HTTP 200 — never throws).

### 1.6 Persistence note

Signals persist in the **`TP_KV`** Cloudflare KV namespace (key `kvleva5:signals`, capped at
the most recent 750). Cloudflare Pages Functions cannot write to static files at runtime, so
the committed `data/kvleva5-signals.json` stays `[]` — it is only the seed/fallback. **Do not
try to write to the static file from a page; write via `POST /api/signals`.**

---

## 2 · Mandatory disclaimer block (every page)

This exact bilingual block **must render on every კვლევა 5.0 page** — and on
`/kvleva5/index.html` it must sit **above the composite score.** Copy verbatim.

### 2.1 Plain text (canonical wording)

```
ეს არის კვლევითი ინფორმაცია და არა საინვესტიციო რჩევა. პირადი გარემოებები არ არის გათვალისწინებული. თქვენ თავად იღებთ გადაწყვეტილებას.

This is research information, not investment advice. No personal circumstances are considered. You make your own decisions.
```

### 2.2 Drop-in HTML (matches the site's newspaper styling)

```html
<div class="kv5-disclaimer">
  <span class="d-tag">⚠ განცხადება / Disclaimer</span>
  <div class="d-ka">ეს არის კვლევითი ინფორმაცია და არა საინვესტიციო რჩევა. პირადი გარემოებები არ არის გათვალისწინებული. თქვენ თავად იღებთ გადაწყვეტილებას.</div>
  <div class="d-en">This is research information, not investment advice. No personal circumstances are considered. You make your own decisions.</div>
</div>
```

The `.kv5-disclaimer` / `.d-tag` / `.d-ka` / `.d-en` styles are defined inline in
`/kvleva5/index.html`. If your page does not share that stylesheet, copy those rules,
or reuse the site tokens (`var(--rule)`, `var(--ink)`, `var(--muted)`, `var(--red)`).

The site footer also carries the short form
("ეს არის კვლევითი ინფორმაცია და არა საინვესტიციო რჩევა · This is research information, not investment advice");
keep it there too.

---

## 3 · Full dossier shape (reference — for deeper journal features)

`GET /api/dossier?ticker=SYMBOL` returns the object below. The journal only needs the
signal fields above, but this is the full shape if you want to show more per entry:

```jsonc
{
  "ok": true,
  "ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology",
  "currency": "USD", "exchange": "NASDAQ", "logo": "…", "asOf": "ISO-8601",
  "configured": true,                         // any provider key present?
  "sections": {
    "price":     { "status": "ok"|"unavailable", "price", "dayChangePct", "weekChangePct", "monthChangePct", "hi52", "lo52", "rangePosPct", … },
    "momentum":  { "status", "rsi14", "sma50", "sma200", "priceVs50Pct", "priceVs200Pct", "volVsAvgPct", … },
    "sentiment": { "status", "market": { "score", "rating", … }, "headlines": { "net", "label", "recent":[…] } },
    "valuation": { "status", "peTTM", "sectorMedianPE", "peVsSectorPct", "marketCapBn", "capTier", "capTierKa", "sector" },
    "cfd":       { "status", "vol30Pct", "atr14", "atr14Pct", "financingNote" }
  },
  "score": 79,
  "band": { "en": "STRONG RESEARCH INTEREST", "ka": "ძლიერი კვლევითი ინტერესი", "color": "#166534" },
  "availableWeight": 100,
  "contributions": { "momentum": { "subScore", "weight", "available" }, "trend": {…}, "sentiment": {…}, "valuation": {…}, "cfd": {…} },
  "signal": { "logged": true, "reason": null }
}
```

Any section can be `{ "status": "unavailable", "reason": "…" }` — always guard on
`status === "ok"` before reading a section's numbers.
