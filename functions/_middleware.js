/* ============================================================
   The Trading Paper — server-side gate (Cloudflare Pages Function)
   Protects EVERY path on the site. Runs on Cloudflare's servers,
   so the password never reaches the visitor's browser.

   Required environment variables (set in Cloudflare dashboard →
   Pages project → Settings → Variables and Secrets):
     TP_USER       login username (e.g. NAPOLEON)
     TP_PASS_HASH  SHA-256 hex of the password (NOT the password!)
     TP_SECRET     long random string used to sign session cookies
   ============================================================ */

const COOKIE = "tp_session";
const LOGIN_PATH = "/tp-login";
const LOGOUT_PATH = "/tp-logout";
const SESSION_DAYS = 30;

const enc = new TextEncoder();

async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(message, secret) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

async function hasValidSession(request, env) {
  const c = getCookie(request, COOKIE);
  if (!c || !env.TP_SECRET) return false;
  const dot = c.lastIndexOf(".");
  if (dot < 1) return false;
  const exp = c.slice(0, dot);
  const sig = c.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await hmacHex(exp, env.TP_SECRET);
  return safeEqual(sig, expected);
}

function loginPage(state) {
  // state: "" | "wrong" | "unconfigured"
  const err =
    state === "wrong" ? "არასწორი მონაცემები · Wrong credentials" :
    state === "unconfigured" ? "Auth not configured: set TP_USER, TP_PASS_HASH, TP_SECRET in Cloudflare → Pages → Settings → Variables." : "";
  const html = `<!doctype html>
<html lang="ka">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>The Trading Paper · შესვლა</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;700;900&family=Noto+Sans+Georgian:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#f4f1ea; font-family:'Noto Serif Georgian', Georgia, serif; color:#1a1a1a; }
  .card { text-align:center; max-width:340px; width:100%; padding:34px 26px;
          background:#fffdf7; border:1px solid #d4cfc4; border-top:3px double #1a1a1a; border-bottom:3px double #1a1a1a; }
  h1 { font-weight:900; font-size:30px; letter-spacing:-0.5px; }
  .sub { font-family:'Noto Sans Georgian',sans-serif; font-size:11px; letter-spacing:3px;
         text-transform:uppercase; color:#b91c1c; margin:6px 0 24px; }
  input { display:block; width:100%; margin:0 0 12px; padding:11px 12px; font-size:16px;
          border:1px solid #ccc; background:#fff; font-family:'Noto Sans Georgian',sans-serif; }
  input:focus { outline:2px solid #b91c1c; outline-offset:1px; }
  label { display:block; text-align:left; font-family:'Noto Sans Georgian',sans-serif;
          font-size:10.5px; letter-spacing:1px; text-transform:uppercase; color:#6b6b6b; margin-bottom:4px; }
  button { margin-top:6px; width:100%; padding:11px; background:#1a1a1a; color:#fff; border:none;
           font-size:12px; letter-spacing:2px; cursor:pointer; text-transform:uppercase;
           font-family:'Noto Sans Georgian',sans-serif; }
  button:hover { background:#b91c1c; }
  .err { min-height:18px; color:#b91c1c; font-size:11.5px; margin:10px 0 0; font-family:'Noto Sans Georgian',sans-serif; }
  .foot { margin-top:18px; font-size:10.5px; color:#6b6b6b; font-style:italic; }
</style>
</head>
<body>
  <form class="card" method="POST" action="${LOGIN_PATH}">
    <h1>The Trading Paper</h1>
    <div class="sub">Private · შესვლა / Sign in</div>
    <label for="u">მომხმარებელი · Username</label>
    <input id="u" name="user" type="text" autocomplete="username" autocapitalize="off" autofocus required>
    <label for="p">პაროლი · Password</label>
    <input id="p" name="pass" type="password" autocomplete="current-password" required>
    <button type="submit">შესვლა</button>
    <div class="err">${err}</div>
    <div class="foot">© The Trading Paper · ვისბადენი</div>
  </form>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Logout: clear cookie, back to login
  if (url.pathname === LOGOUT_PATH) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // Login attempt
  if (url.pathname === LOGIN_PATH && request.method === "POST") {
    if (!env.TP_USER || !env.TP_PASS_HASH || !env.TP_SECRET) return loginPage("unconfigured");
    let user = "", pass = "";
    try {
      const form = await request.formData();
      user = String(form.get("user") || "").trim();
      pass = String(form.get("pass") || "");
    } catch (_) { return loginPage("wrong"); }

    const passHash = await sha256hex(pass);
    const ok = safeEqual(user, env.TP_USER) &&
               safeEqual(passHash, String(env.TP_PASS_HASH).toLowerCase());
    if (!ok) return loginPage("wrong");

    const exp = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    const sig = await hmacHex(exp, env.TP_SECRET);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE}=${exp}.${sig}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // Everything else requires a valid session
  if (await hasValidSession(request, env)) return next();
  if (!env.TP_USER || !env.TP_PASS_HASH || !env.TP_SECRET) return loginPage("unconfigured");
  return loginPage("");
}
