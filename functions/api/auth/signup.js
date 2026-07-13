/* POST /api/auth/signup  { email, password, display_name? }
   Registers a new user via Supabase Auth. The DB trigger files them into
   public.profiles as a REGULAR user. If email confirmation is OFF, Supabase
   returns a session and we log them straight in; if ON, we ask them to
   confirm. Never leaks tokens to client JS. */
import { sbConfig, json, jsonWithCookies, sessionCookies } from "../_supabase.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "method-not-allowed" }, 405);
  const cfg = sbConfig(env);
  if (!cfg) return json({ ok: false, error: "auth-not-configured" }, 500);

  let email = "", password = "", display_name = "";
  try {
    const b = await request.json();
    email = String(b.email || "").trim();
    password = String(b.password || "");
    display_name = String(b.display_name || "").trim();
  } catch (_) {
    try {
      const f = await request.formData();
      email = String(f.get("email") || "").trim();
      password = String(f.get("password") || "");
      display_name = String(f.get("display_name") || "").trim();
    } catch (__) {}
  }
  if (!email || !password) return json({ ok: false, error: "missing-credentials" }, 400);
  if (password.length < 6) return json({ ok: false, error: "weak-password" }, 400);

  try {
    const r = await fetch(`${cfg.url}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: cfg.anon, "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        data: display_name ? { display_name } : undefined,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return json({ ok: false, error: data.error_description || data.msg || "signup-failed" }, 400);
    }
    // Email confirmation OFF → session present → log them in immediately.
    if (data.access_token) return jsonWithCookies({ ok: true, authed: true }, sessionCookies(data));
    // Email confirmation ON → they must click the link first.
    return json({ ok: true, authed: false, needs_confirm: true });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e) }, 502);
  }
}
