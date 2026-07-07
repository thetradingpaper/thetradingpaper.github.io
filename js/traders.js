// ============================================================
// The Trading Paper — Registered Traders
// ============================================================
//
// Two sources of traders:
//   1) baseTraders — hard-coded (currently only LASHA, real data)
//   2) localStorage 'ttp_users' — anyone who registers in browser
//
// Combined view exposed as `traders` object and `rankedTraders()`.
// ============================================================

const baseTraders = {

  lasha: {
    id: 'lasha',
    name: 'ლაშა ფხაკაძე',
    handle: '@lasha',
    avatar: 'ლშ',          // initials
    avatarImg: null,       // optional base64 image
    accent: '#b91c1c',
    city: 'ვისბადენი · DE',
    broker: 'BOG',
    joinedDate: '2025-12-09',
    bio: 'The Trading Paper-ის ავტორი. ორი წიგნი: Dogma (გრძელვადიანი DCA) + Active (ერთი კომპანია).',
    tagline: 'Dogma + Active · BOG + TBC',
    locked: true,          // owner — not editable
    holdings: [
      { ticker: 'SMH',  name: 'VanEck Semiconductors ETF',         shares: 0.79785924, avgBuy: 493.41, invested: 393.67, value: 463.64, color: '#b91c1c' },
      { ticker: 'VOO',  name: 'Vanguard S&P 500 ETF',              shares: 0.43807493, avgBuy: 633.25, invested: 277.41, value: 301.33, color: '#166534' },
      { ticker: 'ASX',  name: 'ASE Industrial Holding',            shares: 6.6170481,  avgBuy:  33.60, invested: 222.36, value: 231.66, color: '#8b6914' },
      { ticker: 'KOID', name: 'KraneShares Humanoid Robotics ETF', shares: 3.34000784, avgBuy:  40.15, invested: 134.11, value: 139.61, color: '#4b5563' },
      { ticker: 'WQTM', name: 'WisdomTree Quantum Computing Fund', shares: 0.67472943, avgBuy:  38.06, invested:  25.68, value:  26.08, color: '#2563eb' },
      { ticker: 'MSTR', name: 'Strategy Inc',                      shares: 2.04739861, avgBuy: 185.78, invested: 380.36, value: 334.69, color: '#1a1a1a' },
    ],
    cash: 0,
    deposited: 1329.12,
    articles: [],
  },

};

// ============================================================
// localStorage layer
// ============================================================
const TTP_USERS_KEY    = 'ttp_users';     // {handle: traderObj}
const TTP_SESSION_KEY  = 'ttp_session';   // {handle, expires}

function loadLocalUsers() {
  try {
    const raw = localStorage.getItem(TTP_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveLocalUsers(users) {
  localStorage.setItem(TTP_USERS_KEY, JSON.stringify(users));
}
function getSession() {
  try {
    const raw = localStorage.getItem(TTP_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setSession(handle) {
  localStorage.setItem(TTP_SESSION_KEY, JSON.stringify({ handle, ts: Date.now() }));
}
function clearSession() {
  localStorage.removeItem(TTP_SESSION_KEY);
}
function currentUser() {
  const s = getSession();
  if (!s) return null;
  const users = loadLocalUsers();
  return users[s.handle] || null;
}

// Color palette for new users' accents — assigned round-robin
const ACCENT_PALETTE = ['#166534', '#2563eb', '#8b6914', '#4b5563', '#7c3aed', '#0e7490', '#be185d'];

// Brokerage code → display label
const BROKER_LABELS = {
  BOG:       'BOG · Bank of Georgia',
  TBC:       'TBC Capital',
  GALT:      'Galt & Taggart',
  IBKR:      'Interactive Brokers',
  ROBINHOOD: 'Robinhood',
  ETORO:     'eToro',
  TRADE212:  'Trading 212',
  REVOLUT:   'Revolut',
  OTHER:     'სხვა საბროკერო',
};
function brokerLabel(code) { return BROKER_LABELS[code] || code || '—'; }

function registerUser({ name, handle, password, city, bio, broker }) {
  handle = (handle || '').trim().toLowerCase().replace(/^@/, '');
  if (!handle) throw new Error('handle required');
  if (handle === 'lasha') throw new Error('handle reserved');
  const users = loadLocalUsers();
  if (users[handle]) throw new Error('handle already taken');

  // Build initials from name (first letter of first two words)
  const initials = (name || handle).trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || handle.slice(0,2).toUpperCase();
  const palette = ACCENT_PALETTE[Object.keys(users).length % ACCENT_PALETTE.length];

  users[handle] = {
    id: handle,
    name: name || handle,
    handle: '@' + handle,
    password: password,       // demo only — plaintext in localStorage. real site needs backend hashing.
    avatar: initials,
    avatarImg: null,
    accent: palette,
    city: city || '',
    broker: broker || '',
    joinedDate: new Date().toISOString().slice(0, 10),
    bio: bio || '',
    tagline: broker ? brokerLabel(broker) : 'ახალი ტრეიდერი',
    holdings: [],
    cash: 0,
    deposited: 0,
    articles: [],
  };
  saveLocalUsers(users);
  setSession(handle);
  return users[handle];
}

function loginUser(handle, password) {
  handle = (handle || '').trim().toLowerCase().replace(/^@/, '');
  const users = loadLocalUsers();
  const u = users[handle];
  if (!u) throw new Error('user not found');
  if (u.password !== password) throw new Error('wrong password');
  setSession(handle);
  return u;
}

function updateCurrentUser(patch) {
  const s = getSession();
  if (!s) throw new Error('not logged in');
  const users = loadLocalUsers();
  if (!users[s.handle]) throw new Error('user vanished');
  users[s.handle] = { ...users[s.handle], ...patch };
  saveLocalUsers(users);
  return users[s.handle];
}

// ============================================================
// Combined traders view (base + local)
// ============================================================
function allTraders() {
  return { ...baseTraders, ...loadLocalUsers() };
}

// kept as a non-const proxy so existing pages keep working
const traders = new Proxy({}, {
  get(_, k) { return allTraders()[k]; },
  ownKeys() { return Object.keys(allTraders()); },
  getOwnPropertyDescriptor(_, k) {
    const v = allTraders()[k];
    return v === undefined ? undefined : { value: v, enumerable: true, configurable: true };
  },
  has(_, k) { return k in allTraders(); }
});

// ============================================================
// Helpers
// ============================================================
if (typeof fmtMoney === 'undefined') {
  function fmtMoney(n) {
    const s = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '−$' : '$') + s;
  }
}
if (typeof fmtPct === 'undefined') {
  function fmtPct(n) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }
}

function traderStats(t) {
  if (!t) return { value: 0, invested: 0, deposited: 0, pnl: 0, pnlPct: 0, holdingsCount: 0, topHolding: null };
  const value = (t.holdings || []).reduce((s, h) => s + (h.value || 0), 0) + (t.cash || 0);
  const invested = (t.holdings || []).reduce((s, h) => s + (h.invested || 0), 0);
  const deposited = t.deposited || invested;
  const pnl = value - deposited;
  const pnlPct = deposited > 0 ? (pnl / deposited) * 100 : 0;
  const holdingsCount = (t.holdings || []).length;
  const topHolding = (t.holdings || []).slice().sort((a,b) => b.value - a.value)[0];
  return { value, invested, deposited, pnl, pnlPct, holdingsCount, topHolding };
}

function rankedTraders() {
  return Object.values(allTraders())
    .map(t => ({ ...t, ...traderStats(t) }))
    .sort((a, b) => b.pnlPct - a.pnlPct);
}

function emptySlotsCount(minSlots = 3) {
  const real = Object.keys(allTraders()).length;
  return Math.max(0, minSlots - real);
}
