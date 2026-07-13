/* GET /api/me — session-aware profile + engagement snapshot for the UI.
   Never 500s; guests get a zeroed payload so the public page still renders.
   Contract consumed by js/engage-ui.js (Gemini owns the rendering). */
import { sbConfig, json, getCookie, ACCESS_COOKIE, sbGetUser, sbGetProfile } from "./_supabase.js";

function todayUTC() { return new Date().toISOString().slice(0, 10); }

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
    // counts are wired to signals/grades/articles in a follow-up; shape is stable.
    counts: { new_signals: 0, new_grades: 0, new_articles: 0 },
    daily_reward_available: last !== todayUTC(),
  });
}
