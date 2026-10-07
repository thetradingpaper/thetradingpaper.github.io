// ============================================================
// Portfolio AI — configuration (public values only, no secrets)
// ------------------------------------------------------------
// supabaseUrl / supabaseAnonKey : fill these to move accounts from
//   "this device" (localStorage) to the cloud (Supabase). The anon key
//   is public by design — Row Level Security protects the data.
//   Run supabase/portfolio_ai.sql once before switching on.
// visionEndpoint : server endpoint that reads screenshots with Gemini
//   using a server-side key (Cloudflare Pages function /api/vision).
// geminiModel : cheapest vision-capable Gemini model.
// ============================================================
window.PAI_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  visionEndpoint: 'https://thetradingpaper.pages.dev/api/vision',
  geminiModel: 'gemini-3.1-flash-lite',
  geminiFallbackModel: 'gemini-3.5-flash-lite',
  priceGEL: 29.99
};
