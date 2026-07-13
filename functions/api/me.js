/* GET /api/me — session-aware profile + engagement snapshot for the UI.
   Never 500s; guests get a zeroed payload so the public page still renders.
   Contract consumed by js/engage-ui.js (Gemini owns the rendering).

   counts are REAL "new since your last visit" numbers, pulled from the site's
   dated feeds (only for returning users — a first login has no baseline):
     new_signals  = fresh BUY setups when the signal desk refreshed since last visit
     new_grades   = newly resolved outcomes (closed bot trades + graded research)
     new_articles = articles published since last visit (data/articles.json)
*/
import { sbConfig, json, getCookie, ACCESS_COOKIE, sbGetUser, sbGetProfile } from "./_supabase.js";

function todayUTC() { return new Date().toISOString().slice(0, 10); }
function datePart(iso) { return typeof iso === "string" ? iso.slice(0, 10) : null; }

// Read a static data file through the ASSETS binding. This bypasses the auth
// gate (so it works server-side here) and is edge-cached. Returns JSON | null.
async function readAssetJSON(env, origin, path) {
  try {
    if (!env.ASSETS) return null;
    const res = await env.ASSETS.fetch(new Request(new URL(path, origin)));
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

// Count array items whose ISO `field` lands on a UTC day strictly after last_visit.
function countNewer(arr, field, lastVisit) {
  if (!Array.isArray(arr) || !lastVisit) return 0;
  let n = 0;
  for (const it of arr) {
    const d = datePart(it && it[field]);
    if (d && d > lastVisit) n++;
  }
  return n;
}

const GUEST = {
  authed: false,
  streak: 0, best_streak: 0, last_visit: null,
  counts: { new_signals: 0, new_grades: 0, new_articles: 0 },
  daily_reward_available: false,
};

export async function onRequest({ request, env }) {
  const cfg = sbConfig(env);
  if (!cfg) return json(GUEST);

  const access = getCookie(request, ACCESS_COOKIE);
  const user = await sbGetUser(env, access);
  if (!user || !user.id) return json(GUEST);

  const p = (await sbGetProfile(env, access, user.id)) || {};
  const last = p.last_visit || null;

  // "New since last visit" — only for returning users; a null last_visit has
  // no baseline, so counts stay 0 on the very first login.
  let counts = { new_signals: 0, new_grades: 0, new_articles: 0 };
  if (last) {
    const origin = new URL(request.url).origin;
    const [sig, slog, rlog, arts] = await Promise.all([
      readAssetJSON(env, origin, "/data/signals.json"),
      readAssetJSON(env, origin, "/data/signals-log.json"),
      readAssetJSON(env, origin, "/data/research-log.json"),
      readAssetJSON(env, origin, "/data/articles.json"),
    ]);
    let new_signals = 0;
    if (sig && Array.isArray(sig.results) && datePart(sig.updated) > last) {
      new_signals = sig.results.filter((r) => r && r.signal === "BUY").length;
    }
    counts = {
      new_signals,
      new_grades: countNewer(slog, "closed", last) + countNewer(rlog, "date", last),
      new_articles: countNewer(arts, "date", last),
    };
  }

  return json({
    authed: true,
    user: {
      id: user.id,
      email: user.email || null,
      handle: p.handle || null,
      display_name: p.display_name || (user.email ? user.email.split("@")[0] : null),
      role: p.role || "user",
    },
    streak: p.streak || 0,
    best_streak: p.best_streak || 0,
    last_visit: last,
    counts,
    daily_reward_available: last !== todayUTC(),
  });
}
