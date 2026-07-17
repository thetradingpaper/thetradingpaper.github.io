/* ============================================================
   GET /api/config — client feature flags (no secrets leaked,
   only booleans). The page uses these to decide whether to show
   the ანალიტიკოსი (analyst) button and whether live providers are
   configured (else it offers the labelled DEMO fallback).
   ============================================================ */
import { json } from "./_lib.js";

export async function onRequest(context) {
  const { env } = context;
  return json({
    ok: true,
    beta: true,
    analyst: !!env.ANTHROPIC_API_KEY,
    kv: !!env.TP_KV,
    providers: {
      finnhub: !!(env.FINNHUB_API_KEY || "d91t069r01qsj27o4k8gd91t069r01qsj27o4k90"),
      alphavantage: !!env.ALPHAVANTAGE_API_KEY,
    },
  });
}
