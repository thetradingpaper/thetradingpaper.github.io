// ============================================================
// The Trading Paper — Auth UI (top-right corner button)
// Injects a "შესვლა" or "გასვლა" button into the masthead based on /api/me
// ============================================================

(function () {
  async function checkAuth() {
    let authed = false;
    let streak = 0;
    try {
      const r = await fetch('/api/me');
      if (r.ok) {
        const d = await r.json();
        authed = !!d.authed;
        streak = d.streak || 0;
      }
    } catch(e) {}
    return { authed, streak };
  }

  async function inject() {
    const topBar = document.querySelector('.masthead .top-bar');
    if (!topBar) return;
    
    // Remove any existing auth-btn
    const existing = document.querySelector('.masthead .auth-btn');
    if (existing) existing.remove();

    const { authed, streak } = await checkAuth();

    const btn = document.createElement('a');
    btn.className = 'auth-btn no-print';
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

    if (authed) {
      btn.href = '/tp-logout';
      let streakHtml = streak > 0 ? `🔥 ${streak} დღე · ` : '';
      btn.innerHTML = `${streakHtml}გასვლა`;
      btn.title = 'გასვლა სისტემიდან';
    } else {
      const isIndex = location.pathname === '/' || location.pathname.endsWith('index.html');
      btn.href = isIndex ? '#login-experience' : '/';
      btn.textContent = 'შესვლა';
      
      if (isIndex) {
        btn.addEventListener('click', (e) => {
          const target = document.getElementById('login-experience');
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
            const input = target.querySelector('input');
            if (input) setTimeout(() => input.focus(), 500);
          }
        });
      }
    }

    const masthead = document.querySelector('.masthead');
    if (masthead && getComputedStyle(masthead).position === 'static') {
      masthead.style.position = 'relative';
    }
    masthead.appendChild(btn);
    
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
  }

  function navResearch() {
    const nav = document.querySelector('.masthead nav');
    if (!nav || nav.querySelector('a[href="research.html"]')) return;
    const a = document.createElement('a');
    a.href = 'research.html';
    a.textContent = 'კვლევა';
    const sig = nav.querySelector('a[href="signals.html"]');
    if (sig && sig.nextSibling) { nav.insertBefore(a, sig.nextSibling); } else { nav.appendChild(a); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { inject(); navResearch(); });
  } else {
    inject();
    navResearch();
  }
})();
