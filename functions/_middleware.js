/* ============================================================
   The Trading Paper — server-side gate (Cloudflare Pages Function)
   v2 — GUEST MODE:
   · index.html is now the PUBLIC front page (teaser, packets,
     login popup). It is served to everyone at "/".
   · The private cabinet lives in cabinet.html. Signed-in users
     get it AT "/" (server-side rewrite), so old links still work.
   · Login happens in the popup (POST /tp-login). Wrong password
     → redirect back to /?login=wrong (popup reopens with error).
   · Every other page & data file stays server-protected.

   Required environment variables (Cloudflare dashboard →
   Pages project → Settings → Variables and Secrets):
     TP_USER       login username (e.g. NAPOLEON)
     TP_PASS_HASH  SHA-256 hex of the password (NOT the password!)
     TP_SECRET     long random string used to sign session cookies
   ============================================================ */

const COOKIE = "tp_session";
const LOGIN_PATH = "/tp-login";
const LOGOUT_PATH = "/tp-logout";
const SESSION_DAYS = 30;

/* What a guest may load. NOTE: no portfolio data files here. */
const PUBLIC_EXACT = new Set([
  "/",
  "/index.html",
  "/js/masthead.js",
  "/js/clocks.js",
  "/favicon.ico",
  "/robots.txt",
]);
const PUBLIC_PREFIXES = ["/css/"];

function isPublic(pathname) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

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

function redirect(location, extraHeaders) {
  return new Response(null, {
    status: 302,
    headers: Object.assign({ Location: location }, extraHeaders || {}),
  });
}

/* Serve a static asset other than the one requested (URL stays the same). */
async function serveAsset(context, url, assetPath) {
  const req = new Request(new URL(assetPath, url.origin), { method: "GET" });
  const res = await context.env.ASSETS.fetch(req);
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/* Minimal fallback — only shown if secrets are missing. */
function unconfiguredPage() {
  return new Response(
    "<h1>Auth not configured</h1><p>Set TP_USER, TP_PASS_HASH, TP_SECRET in Cloudflare → Pages → Settings → Variables.</p>",
    { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // ---- Logout: clear cookie, back to the public front page ----------------
  if (url.pathname === LOGOUT_PATH) {
    return redirect("/", {
      "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    });
  }

  // ---- Login attempt (posted from the popup modal) -------------------------
  if (url.pathname === LOGIN_PATH && request.method === "POST") {
    if (!env.TP_USER || !env.TP_PASS_HASH || !env.TP_SECRET) return unconfiguredPage();
    let user = "", pass = "";
    try {
      const form = await request.formData();
      user = String(form.get("user") || "").trim();
      pass = String(form.get("pass") || "");
    } catch (_) { return redirect("/?login=wrong"); }

    const passHash = await sha256hex(pass);
    const ok = safeEqual(user, env.TP_USER) &&
               safeEqual(passHash, String(env.TP_PASS_HASH).toLowerCase());
    if (!ok) return redirect("/?login=wrong");

    const exp = String(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    const sig = await hmacHex(exp, env.TP_SECRET);
    return redirect("/", {
      "Set-Cookie": `${COOKIE}=${exp}.${sig}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
    });
  }

  // ---- Signed in: full site -------------------------------------------------
  if (await hasValidSession(request, env)) {
    // the cabinet lives at "/" for members (index.html is the public page now)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return serveAsset(context, url, "/cabinet.html");
    }
    if (url.pathname === "/cabinet.html") return redirect("/");
    return next();
  }

  if (!env.TP_USER || !env.TP_PASS_HASH || !env.TP_SECRET) return unconfiguredPage();

  // ---- Guest ---------------------------------------------------------------
  if (isPublic(url.pathname)) return next();
  // everything else → front page with the login popup opened
  return redirect("/?login=1");
}
