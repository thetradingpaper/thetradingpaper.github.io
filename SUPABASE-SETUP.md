# Supabase multi-user — turn it on (you do these; ~10 min)

The backend code is written. It stays dormant until these are set. I never see your
keys — you paste them into Supabase / Cloudflare yourself.

## 1 · Create the users list (Supabase → SQL Editor)
Paste and run **`supabase/schema.sql`**. This creates the `profiles` table (your
"users list"), locks it with row-level security, and adds a trigger so every new
signup is filed as a **regular user** (`role = 'user'`). It also backfills any
account you already made.

## 2 · Enable email login (Supabase → Authentication)
- **Providers → Email**: enabled.
- For an instant launch, **turn OFF "Confirm email"** (Authentication → Providers →
  Email → uncheck *Confirm email*). Otherwise new users must click a link before they
  can log in. You can turn it back on later.

## 3 · Add / migrate your account (Supabase → Authentication → Users)
- Click **Add user** → your email + a password. Done — the trigger files you into the
  users list as a regular user automatically.
- (Or just use the new "რეგისტრაცია" form once it's live — same result.)
- Optional, make yourself admin later: run the last (commented) line in `schema.sql`.

## 4 · Give the site the keys (Cloudflare → Pages → your project → Settings → Variables and Secrets)
Add these (Production), type **Secret**:

| Name | Where (Supabase → Project Settings → API) |
|---|---|
| `SUPABASE_URL` | Project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Project API keys → `anon` `public` |

`SUPABASE_SERVICE_ROLE_KEY` is **not** needed at runtime — only add it if/when we
build admin tools. Never expose it client-side.
Then **Deployments → Retry deployment** (secrets inject at deploy time).

## 5 · Verify
- `GET /api/me` while logged out → `{"authed":false,...}`.
- Log in via the form → `/api/me` returns `{"authed":true, "user":{...,"role":"user"}, "streak":...}`.
- The cabinet (private) loads at `/`; guests get the public front page with the login popup.

---

## What the backend now does (files I own — `functions/`)
- `functions/_middleware.js` — validates the Supabase session cookie, silently refreshes it, gates every private route. (Old `TP_USER`/`TP_PASS_HASH`/`TP_SECRET` retired.)
- `functions/api/auth/login.js` · `signup.js` · `logout.js` — Supabase Auth, tokens in HttpOnly cookies (never in JS).
- `functions/api/me.js` — `GET /api/me` profile + engagement snapshot for the UI.
- `functions/api/seen.js` — `POST /api/seen` advances the daily streak.
- `functions/api/_supabase.js` — shared Supabase helpers.
- `js/gate.js` — the old `111` gate is now a no-op.

## ⚠️ Tell Gemini (contract change)
The login form must POST to **`/api/auth/login`** (JSON `{email,password}`) and the
register form to **`/api/auth/signup`** — NOT the old `/tp-login`. On success both
return `{ok:true}` and the session cookie is set; then reload. `/api/me` and
`/api/seen` are unchanged from the handoff.

## KV keys introduced
None. All state lives in Supabase (`public.profiles`). The engagement `counts`
(new signals/grades/articles) are stubbed at 0 for now — wired to data sources next.
