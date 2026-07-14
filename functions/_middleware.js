// Cloudflare Pages middleware - Bypassed to support static standalone routing
export async function onRequest(context) {
  return context.next();
}
