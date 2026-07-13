/* ============================================================
   The Trading Paper — shared Supabase helpers (import-only; the "_"
   prefix keeps Cloudflare Pages from routing this file).

   Secrets (Cloudflare → Pages → Settings → Variables and Secrets):
     SUPABASE_URL              e.g. https://xxxx.supabase.co   (required)
     SUPABASE_ANON_KEY         public anon key                 (required)
     SUPABASE_SERVICE_ROLE_KEY optional — admin scripts only, never sent to client

   Auth model: login/signup call Supabase Auth (GoTrue) server-side; the
   access + refresh tokens are stored in HttpOnly cookies so they never
   reach client JS. The middleware validates the access token (and silently
   refreshes it when expired).
   ============================================================ */

export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";
const SESSION_DAYS = 30;

export function sbConfig(env) {
  if (!env || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  return { url: String(env.SUPABASE_URL).replace(/\/+$/, ""), anon: env.SUPABASE_ANON_KEY };
}

/* ---------- tiny JSON response helpers ---------- */
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// JSON response that also sets/clears the session cookies.
export function jsonWithCookies(body, cookies, status = 200) {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  for (const c of cookies) h.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers: h });
}

/* ---------- cookies ---------- */
export function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookies(session) {
  const base = `Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`;
  return [
    `${ACCESS_COOKIE}=${session.access_token}; ${base}`,
    `${REFRESH_COOKIE}=${session.refresh_token || ""}; ${base}`,
  ];
}

export function clearedCookies() {
  const base = `Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
  return [`${ACCESS_COOKIE}=; ${base}`, `${REFRESH_COOKIE}=; ${base}`];
}

/* ---------- Supabase Auth (GoTrue) ---------- */
// Validate an access token → returns the user object, or null.
// Works for every Supabase project (HS256 or asymmetric keys) because
// Supabase itself validates the token.
export async function sbGetUser(env, accessToken) {
  const cfg = sbConfig(env);
  if (!cfg || !accessToken) return null;
  try {
    const r = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.anon, Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return null;
    return await r.json(); // { id, email, ... }
  } catch (_) {
    return null;
  }
}

// Exchange a refresh token for a fresh session. Returns the session
// ({ access_token, refresh_token, user }) or null.
export async function sbRefresh(env, refreshToken) {
  const cfg = sbConfig(env);
  if (!cfg || !refreshToken) return null;
  try {
    const r = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: cfg.anon, "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.access_token ? d : null;
  } catch (_) {
    return null;
  }
}

// Read the caller's own profile row via PostgREST (RLS: select own).
export async function sbGetProfile(env, accessToken, userId) {
  const cfg = sbConfig(env);
  if (!cfg || !accessToken || !userId) return null;
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=handle,display_name,role,streak,best_streak,last_visit,seen_at`,
      { headers: { apikey: cfg.anon, Authorization: `Bearer ${accessToken}` } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (_) {
    return null;
  }
}

// Patch the caller's own profile (RLS: update own).
export async function sbUpdateProfile(env, accessToken, userId, patch) {
  const cfg = sbConfig(env);
  if (!cfg || !accessToken || !userId) return null;
  try {
    const r = await fetch(
      `${cfg.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: cfg.anon,
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(patch),
      }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch (_) {
    return null;
  }
}
