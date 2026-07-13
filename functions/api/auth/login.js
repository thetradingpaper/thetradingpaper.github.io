/* POST /api/auth/login  { email, password }  (JSON or form-encoded)
   Signs in via Supabase Auth, stores the session in HttpOnly cookies.
   Returns { ok:true } on success; never leaks tokens to client JS. */
import { sbConfig, json, jsonWithCookies, sessionCookies } from "../_supabase.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "method-not-allowed" }, 405);
  const cfg = sbConfig(env);
  if (!cfg) return json({ ok: false, error: "auth-not-configured" }, 500);

  let email = "", password = "";
  try {
    const b = await request.json();
    email = String(b.email || "").trim();
    password = String(b.password || "");
  } catch (_) {
    try {
      const f = await request.formData();
      email = String(f.get("email") || "").trim();
      password = String(f.get("password") || "");
    } catch (__) {}
  }
  if (!email || !password) return json({ ok: false, error: "missing-credentials" }, 400);

  try {
    const r = await fetch(`${cfg.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: cfg.anon, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.access_token) {
      return json({ ok: false, error: data.error_description || data.msg || "invalid-login" }, 401);
    }
    return jsonWithCookies({ ok: true }, sessionCookies(data));
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 502);
  }
}
