# Handoff — Login unification + platform polish + engagement mechanics

Two agents work in parallel on `1 inv/ნამდვილი ვებსაიტი` (The Trading Paper, live at thetradingpaper.pages.dev). Strict file-ownership firewall so simultaneous work never merge-conflicts.

## Ownership firewall

| Owner | Owns (may edit) | MUST NOT touch |
|---|---|---|
| **Opus (Claude)** — backend/auth | `functions/**`, `js/gate.js`, auth/session logic, all new `functions/api/*` | any `*.html`, `css/**`, `js/auth-ui.js`, `js/enhance.js`, presentational JS |
| **Gemini (Antigravity)** — frontend/visual | all `*.html`, `css/**`, `js/auth-ui.js`, `js/enhance.js`, new `js/engage-ui.js`, images | `functions/**`, session/cookie logic |

Shared contract = the JSON shapes below. Opus produces them; Gemini consumes them. Neither redefines the other's files.

## The current mess (why login feels incomplete)

Three overlapping gates today:
1. `functions/_middleware.js` — the REAL server gate (cookie session, `TP_USER`/`TP_PASS_HASH`/`TP_SECRET`). Keep this.
2. `js/gate.js` — soft hardcoded `111` gate in localStorage. Redundant, bypassable. **Retire.**
3. `js/auth-ui.js` + `register.html` + localStorage `ttp_users`/`ttp_session` — fake account system, not tied to the real login. **Reduce to cosmetic display only** (or retire) — the real login is the server one.

Goal: ONE coherent login that gates everything, plus a beautiful shell and habit-forming (but honest) engagement loop.

## Interface contract (Opus → Gemini)

`GET /api/me` (session-aware; never 500s):
```json
{
  "authed": true,
  "streak": 5,                 // consecutive UTC days visited
  "best_streak": 12,
  "last_visit": "2026-07-12",  // previous visit (UTC date), null on first
  "counts": { "new_signals": 3, "new_grades": 2, "new_articles": 1 },  // since last_visit
  "daily_reward_available": true   // once per UTC day, for the reveal animation
}
```
`POST /api/seen` — marks "caught up" (updates last_visit, zeroes counts, banks the streak). Body optional `{ "claim_daily": true }`.

Guest (`authed:false`) returns zeros so the public page can still render teasers.

## Engagement mechanics (ethical: real numbers only, drive the RESEARCH habit — never nudge real-money risk)

- **Streaks** 🔥 — daily visit streak, loss-aversion ("don't lose your 5-day streak").
- **Variable reward** — daily reveal (signal-of-the-day / grade flip) with a stamp animation; unpredictable payoff.
- **Curiosity gap** — public front page shows blurred/locked teasers → login reveals. Drives sign-in.
- **Notification badges** — red dots on nav for new signals/grades/articles since last visit (from `counts`).
- **Progress** — completion ring / "research N tickers to unlock the weekly digest".
- **Social proof / FOMO** — live ticker marquee, "N grades frozen today", "updated 2m ago" — REAL counts only (the paper's brand is honesty; no fabricated "1,240 viewing now").
- **Endless feed** — journal/signals as an always-fresh feed with skeleton shimmer + smooth reveals.
- **Micro-interactions** — count-ups, red/green flashes, rubber-stamp HIT/MISS, satisfying transitions.

Guardrail (both agents): engagement hooks must not undermine the "ეს არ არის ფინანსური რჩევა" integrity and must not push users toward more trading/risk. Habit = come back and read/research, not trade more.

---

## TASK — Opus (backend/auth), owns `functions/**` + `js/gate.js`

1. **Unify the gate.** Make `functions/_middleware.js` the single source of truth.
   - Fix the public allowlist deliberately: decide public vs private per route (see the open decision on the ticker tool). Ensure `data/*.json`, private pages, and non-public `/api/*` require a valid session.
   - Retire `js/gate.js` (make it a no-op / remove its behavior) so there is exactly one password — the server login. Do not touch pages that `<script src>` it (Gemini removes the includes); just neuter the file so it can't double-gate.
   - Keep login/logout POST flow (`/tp-login`, `/tp-logout`) working; keep secrets contract (`TP_USER`, `TP_PASS_HASH`, `TP_SECRET`).
2. **Engagement backend** in `functions/api/me.js` + helpers:
   - Implement `GET /api/me` and `POST /api/seen` per the contract. Store per-session engagement state (streak, last_visit, seen markers) in `TP_KV` keyed by a stable session id derived from the cookie; fall back to a signed cookie if KV absent. UTC day math. Never 500.
   - `counts` computed against existing data sources (signals log / kvleva5 grades / articles list) since `last_visit`.
3. **Do NOT** edit HTML/CSS or presentational JS. Keep everything in `functions/` + neutering `js/gate.js`.
4. Verify with `new Function`/browser as before (no Node on this machine). List any KV keys introduced.

## TASK — Gemini (frontend/visual), owns `*.html` + `css/**` + presentational JS

See the copy-paste prompt in chat. Summary: redesign the login popup + public front page, apply a cohesive premium visual system across the platform, remove the `js/gate.js` includes, and build the engagement UI (`js/engage-ui.js`) that renders `/api/me` (streak, badges, daily-reward reveal, curiosity-gap teasers, skeleton feeds, micro-interactions). Georgian UI copy, newspaper aesthetic, keep the disclaimer.
