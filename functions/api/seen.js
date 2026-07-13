/* POST /api/seen — mark the user "caught up": advance the daily streak and
   stamp last_visit. Call it once per session (and on daily-reward claim).
   Requires a valid session; returns the updated streak fields. Never 500s. */
import {
  sbConfig, json, getCookie, ACCESS_COOKIE,
  sbGetUser, sbGetProfile, sbUpdateProfile,
} from "./_supabase.js";

function todayUTC() { return new Date().toISOString().slice(0, 10); }
function daysBetween(fromStr, toStr) {
  const a = Date.parse(fromStr + "T00:00:00Z");
  const b = Date.parse(toStr + "T00:00:00Z");
  if (isNaN(a) || isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

export async function onRequest({ request, env }) {
  const cfg = sbConfig(env);
  if (!cfg) return json({ ok: false, error: "auth-not-configured" }, 500);

  const access = getCookie(request, ACCESS_COOKIE);
  const user = await sbGetUser(env, access);
  if (!user || !user.id) return json({ ok: false, error: "not-authed" }, 401);

  const p = (await sbGetProfile(env, access, user.id)) || {};
  const today = todayUTC();
  const last = p.last_visit || null;

  // Streak logic: consecutive UTC days keep the streak; a gap resets to 1;
  // same-day revisit leaves it unchanged.
  let streak = p.streak || 0;
  if (last === today) {
    // already counted today — no change
    streak = streak || 1;
  } else {
    const gap = last ? daysBetween(last, today) : null;
    streak = gap === 1 ? streak + 1 : 1;
  }
  const best = Math.max(p.best_streak || 0, streak);

  const updated = await sbUpdateProfile(env, access, user.id, {
    streak,
    best_streak: best,
    last_visit: today,
    seen_at: new Date().toISOString(),
  });

  return json({
    ok: true,
    streak: (updated && updated.streak) ?? streak,
    best_streak: (updated && updated.best_streak) ?? best,
    last_visit: today,
  });
}
