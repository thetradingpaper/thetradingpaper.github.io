// ============================================================
// The Trading Paper — Access Gate
// ============================================================
// SOFT password protection. Anyone who views source can see the
// password. This is a casual barrier, not real security.
// ============================================================
(function () {
  const PASS = '50511';
  const KEY  = 'ttp_unlock_v1';

  // Already unlocked this device — skip the gate
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) {}

  // Hide page content while gate is up
  const html = document.documentElement;
  const prevOverflow = html.style.overflow;
  html.style.overflow = 'hidden';

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #ttp-gate {
      position: fixed; inset: 0; z-index: 999999;
      background: #ffffff;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px;
      font-family: 'Noto Serif Georgian', Georgia, serif;
      color: #1a1a1a;
    }
    #ttp-gate h1 {
      font-weight: 900; font-size: 38px; margin: 0; letter-spacing: -0.5px;
    }
    #ttp-gate .sub {
      font-style: italic; color: #6b6b6b; font-size: 14px; margin-bottom: 24px;
    }
    #ttp-gate input {
      font-family: ui-monospace, monospace;
      font-size: 28px; letter-spacing: 12px; text-align: center;
      width: 220px; padding: 14px 16px;
      border: 1px solid #1a1a1a; background: #fff; color: #1a1a1a;
      outline: none; border-radius: 0;
    }
    #ttp-gate input:focus { border-color: #b91c1c; }
    #ttp-gate button {
      font-family: 'Noto Sans Georgian', sans-serif;
      font-size: 13px; letter-spacing: 3px; text-transform: uppercase;
      padding: 10px 32px; background: #1a1a1a; color: #fff;
      border: none; cursor: pointer; border-radius: 0;
    }
    #ttp-gate button:hover { background: #b91c1c; }
    #ttp-gate .err {
      color: #b91c1c; font-size: 13px; height: 18px; letter-spacing: 1px;
    }
  `;
  document.head.appendChild(style);

  function buildGate() {
    const gate = document.createElement('div');
    gate.id = 'ttp-gate';
    gate.innerHTML = `
      <h1>The Trading Paper</h1>
      <div class="sub">შეიყვანე კოდი</div>
      <input id="ttp-pass" type="password" inputmode="numeric" autocomplete="off" maxlength="10" />
      <button id="ttp-btn">გახსნა</button>
      <div class="err" id="ttp-err"></div>
    `;
    document.body.prepend(gate);

    const input = document.getElementById('ttp-pass');
    const btn   = document.getElementById('ttp-btn');
    const err   = document.getElementById('ttp-err');
    setTimeout(() => input.focus(), 50);

    function unlock() {
      if (input.value === PASS) {
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        gate.remove(); style.remove();
        html.style.overflow = prevOverflow;
      } else {
        err.textContent = '✕ არასწორი კოდი';
        input.value = ''; input.focus();
      }
    }

    btn.addEventListener('click', unlock);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildGate);
  } else {
    buildGate();
  }
})();
