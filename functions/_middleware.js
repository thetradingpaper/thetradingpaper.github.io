// Old site closed 2026-11-12 (Lasha): every request goes to the real site.
// Nothing is deleted — files stay in the repo; revert this file to reopen.
export async function onRequest() {
  return Response.redirect('https://tradingpaper.ge/', 301);
}
