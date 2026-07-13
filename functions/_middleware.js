/* ============================================================
   The Trading Paper — server-side gate (Cloudflare Pages Function)
   v3 — SUPABASE MULTI-USER:
   · index.html is the PUBLIC front page (teaser + login/register).
   · The private cabinet lives in cabinet.html; signed-in users get it
     AT "/" (server-side rewrite) so old links still work.
   · Auth is Supabase (email + password). login/signup/logout live at
     /api/auth/*; the access + refresh tokens ride in HttpOnly cookies.
     This middleware validates the access token and silently refreshes it.
   · Every other page & data file stays server-protected.

   Secrets (Cloudflare → Pages → Settings → Variables and Secrets):
     SUPABASE_URL, SUPABASE_ANON_KEY   (see functions/api/_supabase.js)
   Old TP_USER / TP_PASS_HASH / TP_SECRET are no longer used.
   ============================================================ */
import {
  sbConfig, getCookie, ACCESS_COOKIE, REFRESH_COOKIE,
  sbGetUser, sbRefresh, sessionCookies,
} from "./api/_supabase.js";

/* What a guest may load without a session. */
const PUBLIC_EXACT = new Set([
  "/", "/index.html", "/favicon.ico", "/robots.txt",
  // self-authorizing endpoints (they return guest/401 on their own)
  "/api/me", "/api/seen",
]);
const PUBLIC_PREFIXES = ["/css/", "/js/", "/images/", "/api/auth/"];

function isPublic(pathname) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function redirect(location, cookies) {
  const h = new Headers({ Location: location });
  for (const c of cookies || []) h.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers: h });
}

/* Serve a different static asset (URL stays the same), carrying any refreshed cookies. */
async function serveAsset(context, url, assetPath, cookies) {
  const req = new Request(new URL(assetPath, url.origin), { method: "GET" });
  const res = await context.env.ASSETS.fetch(req);
  const h = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  for (const c of cookies || []) h.append("Set-Cookie", c);
  return new Response(res.body, { status: 200, headers: h });
}

/* Attach refreshed session cookies to a downstream response. */
function withCookies(res, cookies) {
  if (!cookies || !cookies.length) return res;
  const out = new Response(res.body, res);
  for (const c of cookies) out.headers.append("Set-Cookie", c);
  return out;
}

function unconfiguredPage() {
  return new Response(
    "<h1>Auth not configured</h1><p>Set SUPABASE_URL and SUPABASE_ANON_KEY in Cloudflare → Pages → Settings → Variables, then redeploy.</p>",
    { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/* Resolve the session: validate the access token, silently refreshing it
   from the refresh token when it has expired. Returns { user, cookies }
   where `cookies` is a fresh Set-Cookie pair only when a refresh happened. */
async function resolveSession(request, env) {
  const access = getCookie(request, ACCESS_COOKIE);
  const user = await sbGetUser(env, access);
  if (user && user.id) return { user, cookies: null };

  const refresh = getCookie(request, REFRESH_COOKIE);
  if (refresh) {
    const s = await sbRefresh(env, refresh);
    if (s && s.access_token) {
      const u = s.user && s.user.id ? s.user : await sbGetUser(env, s.access_token);
      if (u && u.id) return { user: u, cookies: sessionCookies(s) };
    }
  }
  return { user: null, cookies: null };
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Not configured yet → keep public pages open, notice on private routes,
  // so the site isn't bricked while secrets are still being set.
  if (!sbConfig(env)) {
    return isPublic(url.pathname) ? next() : unconfiguredPage();
  }

  const { user, cookies } = await resolveSession(request, env);

  // ---- Signed in: full site ----
  if (user) {
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return serveAsset(context, url, "/cabinet.html", cookies); // cabinet at "/"
    }
    if (url.pathname === "/cabinet.html") return redirect("/", cookies);
    return withCookies(await next(), cookies);
  }

  // ---- Guest ----
  if (isPublic(url.pathname)) return next();
  return redirect("/?login=1"); // everything else → front page with login popup
}
