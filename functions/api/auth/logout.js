/* POST (or GET) /api/auth/logout — clears the session cookies and, best
   effort, revokes the refresh token on Supabase. Always returns ok. */
import { sbConfig, jsonWithCookies, clearedCookies, getCookie, ACCESS_COOKIE } from "../_supabase.js";

export async function onRequest({ request, env }) {
  const cfg = sbConfig(env);
  const access = getCookie(request, ACCESS_COOKIE);
  if (cfg && access) {
    try {
      await fetch(`${cfg.url}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: cfg.anon, Authorization: `Bearer ${access}` },
      });
    } catch (_) { /* ignore — we clear cookies regardless */ }
  }
  return jsonWithCookies({ ok: true }, clearedCookies());
}
