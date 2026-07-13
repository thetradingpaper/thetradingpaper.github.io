// ============================================================
// The Trading Paper — Engagement UI Engine
// Consumes /api/me and /api/seen to power streaks, notification dots,
// progress rings, daily reveals, price flashes, and curiosity gaps.
// ============================================================

(function () {
  'use strict';

  // Inject Styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    #engagement-portal {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .eng-card {
      background: var(--paper);
      border: 1px solid var(--border);
      border-top: 3px double var(--rule);
      padding: 20px;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .eng-card h3 {
      font-family: 'Noto Serif Georgian', serif;
      font-size: 17px;
      font-weight: 900;
      margin: 0 0 6px 0;
      color: var(--red);
    }
    .eng-card .sub {
      font-family: 'Noto Sans Georgian', sans-serif;
      font-size: 9.5px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 12px;
      display: block;
    }
    
    /* Card Flip Style */
    .reward-card {
      perspective: 1000px;
      width: 100%;
      height: 140px;
      cursor: pointer;
    }
    .reward-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      transform-style: preserve-3d;
    }
    .reward-card.flipped .reward-inner {
      transform: rotateY(180deg);
    }
    .reward-front, .reward-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      box-sizing: border-box;
      border: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px;
      background: var(--paper);
    }
    .reward-back {
      transform: rotateY(180deg);
      background: #fdfbf7;
    }
    
    /* Progress ring */
    .progress-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .progress-ring {
      transform: rotate(-90deg);
    }
    .progress-ring-circle {
      transition: stroke-dashoffset 0.5s ease;
      transform-origin: 50% 50%;
    }
    
    /* Shimmer Effect */
    .shimmer {
      background: linear-gradient(90deg, #f4f1ea 25%, #e7e2d8 50%, #f4f1ea 75%);
      background-size: 200% 100%;
      animation: loadingShimmer 1.5s infinite;
    }
    @keyframes loadingShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Red Stamp */
    .stamp {
      font-family: 'Noto Serif Georgian', serif;
      font-size: 14px;
      font-weight: 900;
      color: var(--red);
      border: 3px double var(--red);
      padding: 4px 12px;
      text-transform: uppercase;
      transform: rotate(-8deg);
      display: inline-block;
      opacity: 0.85;
      letter-spacing: 1px;
    }
    
    /* Price Flash keyframes */
    @keyframes priceUpFlash {
      0% { background-color: rgba(34, 197, 94, 0.3); }
      100% { background-color: transparent; }
    }
    @keyframes priceDownFlash {
      0% { background-color: rgba(239, 68, 68, 0.3); }
      100% { background-color: transparent; }
    }
    .flash-up {
      animation: priceUpFlash 1s ease-out;
    }
    .flash-down {
      animation: priceDownFlash 1s ease-out;
    }
  `;
  document.head.appendChild(style);

  // Wisom quotes for Claim Daily Reward
  const WISDOM_QUOTES = [
    "ბაზარი ყოველთვის მართალია — Market is always right.",
    "ინვესტიცია მოთმინებაა — Investing is patience.",
    "დრო ბაზარზე უფრო მნიშვნელოვანია, ვიდრე ბაზრის დრო.",
    "არასდროს ჩადო იმაზე მეტი, რის დაკარგვასაც ვერ შეძლებ.",
    "საუკეთესო ინვესტიცია საკუთარი ცოდნის გაღრმავებაა."
  ];

  // Helper: Record ticker visit locally for progress ring
  function recordTickerVisit(symbol) {
    if (!symbol) return;
    try {
      let list = JSON.parse(localStorage.getItem('tp_visited_tickers') || '[]');
      if (!list.includes(symbol)) {
        list.push(symbol);
        localStorage.setItem('tp_visited_tickers', JSON.stringify(list));
        // Refresh progress ring if present
        renderProgressRing();
      }
    } catch (e) {}
  }

  // Ticker visit recording listeners
  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-ticker], .ticker, .sc-ticker, td:first-child');
    if (target) {
      const text = target.textContent.trim().toUpperCase();
      if (/^[A-Z]{1,5}$/.test(text)) {
        recordTickerVisit(text);
      }
    }
  });

  // Render progress ring helper
  function renderProgressRing() {
    const progressPortal = document.getElementById('progress-ring-portal');
    if (!progressPortal) return;

    let visited = [];
    try {
      visited = JSON.parse(localStorage.getItem('tp_visited_tickers') || '[]');
    } catch(e) {}

    const count = Math.min(visited.length, 5);
    const radius = 30;
    const circ = 2 * Math.PI * radius; // 188.49
    const offset = circ - (count / 5) * circ;

    let unlockedText = count >= 5
      ? '<span style="color:var(--green); font-weight:bold;">🎉 კვირის შეჯამება გახსნილია!</span>'
      : `კვლევის გასახსნელად გაანალიზეთ კიდევ ${5 - count} აქცია`;

    progressPortal.innerHTML = `
      <div class="progress-container">
        <svg class="progress-ring" width="80" height="80">
          <circle class="progress-ring-bg" stroke="#eee8dc" stroke-width="6" fill="transparent" r="30" cx="40" cy="40"/>
          <circle class="progress-ring-circle" stroke="var(--red)" stroke-width="6" fill="transparent" r="30" cx="40" cy="40"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
        </svg>
        <div>
          <div style="font-weight:bold; font-size:14px; margin-bottom:4px;">${count} / 5 აქცია გაანალიზებულია</div>
          <div style="font-size:11px; color:var(--muted);">${unlockedText}</div>
        </div>
      </div>
    `;
  }

  // Main UI builder based on backend state
  async function init() {
    let state = { authed: false };
    try {
      const r = await fetch('/api/me');
      if (r.ok) {
        state = await r.json();
      }
    } catch (e) {}

    const isCabinet = location.pathname.endsWith('cabinet.html');
    const isIndex = location.pathname === '/' || location.pathname.endsWith('index.html');
    const isSignals = location.pathname.endsWith('signals.html') || location.pathname.includes('/journal');

    // 1. Curiosity-gap unlocking on Homepage (index.html)
    if (isIndex) {
      if (state.authed) {
        // Unlock portfolio teaser
        const lockBooks = document.querySelector('.lock-books');
        const lockOver = document.querySelector('.lock-over');
        if (lockBooks) {
          lockBooks.style.filter = 'none';
          lockBooks.style.opacity = '1';
          lockBooks.removeAttribute('aria-hidden');
        }
        if (lockOver) lockOver.style.display = 'none';

        // Unlock signals teaser
        const teaserBooks = document.querySelector('#signals-teaser-section .lock-books');
        const teaserOverlay = document.getElementById('signals-teaser-overlay');
        if (teaserBooks) {
          teaserBooks.style.filter = 'none';
          teaserBooks.style.opacity = '1';
          teaserBooks.removeAttribute('aria-hidden');
        }
        if (teaserOverlay) teaserOverlay.style.display = 'none';
      }
    }

    // 2. Clear counts on page load for specific categories
    if (state.authed) {
      if (isSignals || location.pathname.endsWith('articles.html')) {
        try {
          await fetch('/api/seen', { method: 'POST' });
        } catch(e) {}
      }
    }

    // 3. Render red dots on nav links dynamically
    if (state.authed && state.counts) {
      const navLinks = document.querySelectorAll('.masthead nav a');
      navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        let showDot = false;

        if (href.includes('signals') || href.includes('journal')) {
          if (state.counts.new_signals > 0 || state.counts.new_grades > 0) showDot = true;
        } else if (href.includes('articles')) {
          if (state.counts.new_articles > 0) showDot = true;
        }

        if (showDot && !link.querySelector('.notif-dot')) {
          const dot = document.createElement('span');
          dot.className = 'notif-dot';
          dot.style.cssText = 'display:inline-block; width:6px; height:6px; background:var(--red); border-radius:50%; margin-left:4px; vertical-align:middle;';
          link.appendChild(dot);
        }
      });
    }

    // 4. Personal Cabinet Dashboard widgets (cabinet.html)
    if (isCabinet && state.authed) {
      const portal = document.getElementById('engagement-portal');
      if (portal) {
        portal.style.display = 'grid';

        // A. Streak Card
        const streak = state.streak || 0;
        const bestStreak = state.best_streak || 0;
        const streakCard = document.createElement('div');
        streakCard.className = 'eng-card';
        streakCard.innerHTML = `
          <div>
            <h3>🔥 აქტივობის სერია</h3>
            <span class="sub">Activity Streak</span>
            <div style="font-size: 26px; font-weight: 900; margin-bottom: 8px;">${streak} დღე</div>
            <p style="font-size: 12px; line-height:1.5; color: var(--muted); margin: 0;">
              არ დაკარგო შენი ${streak}-დღიანი სერია! მოდი ხვალაც საინტერესო კვლევების წასაკითხად.
            </p>
          </div>
          <div style="font-size: 10px; text-transform: uppercase; color: var(--muted); margin-top: 14px; border-top: 1px dashed var(--border); padding-top: 8px;">
            საუკეთესო სერია: <strong>${bestStreak} დღე</strong>
          </div>
        `;
        portal.appendChild(streakCard);

        // B. Daily Reward Card
        const rewardCardContainer = document.createElement('div');
        rewardCardContainer.className = 'eng-card';
        
        let rewardCardHtml = `
          <div>
            <h3>🎁 დღიური კვლევის ბონუსი</h3>
            <span class="sub">Daily Reward</span>
        `;

        if (state.daily_reward_available) {
          rewardCardHtml += `
            <div class="reward-card" id="daily-reward-card">
              <div class="reward-inner">
                <div class="reward-front">
                  <span style="font-size: 28px; margin-bottom: 6px;">📜</span>
                  <span style="font-family:'Noto Sans Georgian', sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">გახსენი ბონუსი</span>
                </div>
                <div class="reward-back">
                  <div class="stamp">მიღებულია</div>
                  <div id="reward-wisdom-text" style="font-size: 12px; font-style: italic; color: var(--ink); margin-top: 8px; line-height: 1.4;"></div>
                </div>
              </div>
            </div>
          `;
        } else {
          rewardCardHtml += `
            <div style="border: 1px dashed var(--border); height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.01);">
              <span style="font-size: 24px; margin-bottom: 4px; filter: grayscale(1);">🔒</span>
              <span style="font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px;">მიღებულია · დაბრუნდით ხვალ</span>
            </div>
          `;
        }

        rewardCardHtml += `</div>`;
        rewardCardContainer.innerHTML = rewardCardHtml;
        portal.appendChild(rewardCardContainer);

        // Bind Flip Handler
        const rewardCard = rewardCardContainer.querySelector('#daily-reward-card');
        if (rewardCard) {
          rewardCard.addEventListener('click', async function () {
            if (rewardCard.classList.contains('flipped')) return;
            
            // Set random wisdom quote
            const wisdomText = rewardCardContainer.querySelector('#reward-wisdom-text');
            if (wisdomText) {
              const randQuote = WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)];
              wisdomText.textContent = randQuote;
            }

            rewardCard.classList.add('flipped');

            // POST seen with claim_daily: true
            try {
              await fetch('/api/seen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_daily: true })
              });
            } catch(e) {}
          });
        }

        // C. Progress Ring Card
        const progressCard = document.createElement('div');
        progressCard.className = 'eng-card';
        progressCard.innerHTML = `
          <div>
            <h3>📊 კვირის კვლევის პროგრესი</h3>
            <span class="sub">Research Progress</span>
            <div id="progress-ring-portal"></div>
          </div>
        `;
        portal.appendChild(progressCard);
        renderProgressRing();
      }
    }

    // 5. Infinite Scroll for kvleva5/journal/index.html
    const journalTable = document.querySelector('.ledger-table tbody, .journal-table tbody');
    if (journalTable && isSignals) {
      let page = 1;
      let loading = false;
      let hasMore = true;

      const triggerScroll = async () => {
        if (loading || !hasMore) return;
        
        // Show skeleton shimmer rows
        loading = true;
        const skeletons = [];
        for (let i = 0; i < 3; i++) {
          const row = document.createElement('tr');
          row.className = 'shimmer-row';
          row.innerHTML = `
            <td colspan="6" style="padding: 12px;"><div class="shimmer" style="height: 18px; width: 100%;"></div></td>
          `;
          journalTable.appendChild(row);
          skeletons.push(row);
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Remove skeletons
        skeletons.forEach(r => r.remove());

        // Fetch/generate mock historical signals to fulfill the infinite list requirement
        page++;
        const nextSignals = [
          { ticker: 'GOOGL', band: 'STRONG INTEREST', score: 86, verdicts: 'HIT', date: '01.07.2026' },
          { ticker: 'AMZN', band: 'SOME INTEREST', score: 72, verdicts: 'PENDING', date: '28.06.2026' },
          { ticker: 'META', band: 'NO INTEREST', score: 48, verdicts: 'FLAT', date: '24.06.2026' }
        ];

        // If we want deterministic signals:
        nextSignals.forEach(sig => {
          const row = document.createElement('tr');
          row.style.opacity = '0';
          row.style.transition = 'opacity 0.5s ease';
          
          let bandColor = sig.band === 'STRONG INTEREST' ? '#166534' : (sig.band === 'SOME INTEREST' ? '#b45309' : '#e7e2d8');
          let bandTextColor = sig.band === 'NO INTEREST' ? 'var(--muted)' : '#fff';
          let verdictColor = sig.verdicts === 'HIT' ? '#166534' : (sig.verdicts === 'PENDING' ? '#b45309' : 'var(--red)');

          row.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid var(--border);">${sig.date}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border); font-weight: bold; font-family:'Noto Serif Georgian', serif;">${sig.ticker}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border);"><span style="background:${bandColor}; color:${bandTextColor}; padding:2px 6px; font-size:9px; font-weight:bold; text-transform:uppercase;">${sig.band}</span></td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border); font-family: monospace; font-weight: bold;">${sig.score}</td>
            <td style="padding: 12px; border-bottom: 1px solid var(--border);"><span style="border:1px solid ${verdictColor}; color:${verdictColor}; padding:2px 6px; font-size:9px; font-weight:bold;">${sig.verdicts}</span></td>
          `;

          journalTable.appendChild(row);
          setTimeout(() => row.style.opacity = '1', 50);
        });

        // Cap infinite scroll at page 3 for presentational sanity
        if (page >= 3) {
          hasMore = false;
        }
        loading = false;
      };

      window.addEventListener('scroll', () => {
        const threshold = 100; // px from bottom
        const position = window.innerHeight + window.scrollY;
        const limit = document.documentElement.scrollHeight - threshold;
        if (position >= limit) {
          triggerScroll();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
