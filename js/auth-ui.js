// ============================================================
// The Trading Paper — Auth UI (top-right corner button)
// Injects a "რეგისტრაცია" or "@handle ▾" button into the masthead
// ============================================================

(function () {
  function getSession() {
    try {
      const raw = localStorage.getItem('ttp_session');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    try {
      const users = JSON.parse(localStorage.getItem('ttp_users') || '{}');
      return users[s.handle] || null;
    } catch { return null; }
  }

  function inject() {
    const topBar = document.querySelector('.masthead .top-bar');
    if (!topBar || topBar.querySelector('.auth-btn')) return;

    const u = getCurrentUser();

    // The top-bar is flex with two spans (date · issue). We'll wrap them and add the button at the right edge.
    const btn = document.createElement('a');
    btn.className = 'auth-btn';
    btn.style.cssText = `
      position:absolute;
      top:10px; right:24px;
      font-family:'Noto Sans Georgian', sans-serif;
      font-size:11px;
      letter-spacing:1.5px;
      text-transform:uppercase;
      color:#fffdf7;
      background:var(--red);
      padding:6px 14px;
      text-decoration:none;
      border-radius:2px;
      font-weight:500;
      z-index:10;
    `;

    if (u) {
      btn.href = 'my-portfolio.html';
      const av = u.avatarImg
        ? `<img src="${u.avatarImg}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;">`
        : `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${u.accent || '#fffdf7'};color:var(--red);font-weight:700;font-size:9px;text-align:center;line-height:18px;vertical-align:middle;margin-right:6px;">${u.avatar || (u.handle||'').slice(1,3).toUpperCase()}</span>`;
      btn.innerHTML = `${av} ${u.handle || '@' + u.id}`;
      btn.title = 'ჩემი პორტფელი';
    } else {
      btn.href = 'register.html';
      btn.textContent = '+ რეგისტრაცია';
    }

    // Make masthead position relative if not already
    const masthead = document.querySelector('.masthead');
    if (masthead && getComputedStyle(masthead).position === 'static') {
      masthead.style.position = 'relative';
    }
    masthead.appendChild(btn);

    // Hover state
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
