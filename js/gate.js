(function() {
  var lang = 'ka';
  try { lang = localStorage.getItem('tp_lang') === 'en' ? 'en' : 'ka'; } catch (e) {}

  // 1. Check if already unlocked
  if (localStorage.getItem('cabinet_auth') === 'true') {
    // If authed, let's run a quick clean-up of any blurred blocks on the current page
    function unlockVisually() {
      document.querySelectorAll('.lock-over').forEach(function(el) { el.remove(); });
      document.querySelectorAll('.lock-books').forEach(function(el) {
        el.style.setProperty('filter', 'none', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('user-select', 'auto', 'important');
      });
      // Handle the home page teaser blocks
      var guestView = document.getElementById('login-guest-view');
      if (guestView) guestView.remove();
      var authedView = document.getElementById('login-authed-view');
      if (authedView) authedView.style.setProperty('display', 'block', 'important');
      var exp = document.getElementById('login-experience');
      if (exp) exp.style.setProperty('display', 'block', 'important');
    }

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', unlockVisually);
    } else {
      unlockVisually();
    }
    return;
  }

  // 2. Hide body content immediately to prevent flashing while loading
  var style = document.createElement('style');
  style.id = 'tp-gate-hide-style';
  style.innerHTML = 'body { display: none !important; }';
  document.documentElement.appendChild(style);

  // 3. Inject the gate overlay once DOM is ready
  function initGate() {
    // Double check auth in case it changed
    if (localStorage.getItem('cabinet_auth') === 'true') {
      var hStyle = document.getElementById('tp-gate-hide-style');
      if (hStyle) hStyle.remove();
      return;
    }

    var gate = document.createElement('div');
    gate.id = 'tp-global-gate';
    gate.style.cssText = 'position:fixed; inset:0; background:#f4f1ea; z-index:999999; display:flex; align-items:center; justify-content:center; padding:24px; font-family:"Noto Sans Georgian", sans-serif;';
    
    var title = lang === 'ka' ? 'The Trading Paper' : 'The Trading Paper';
    var subtitle = lang === 'ka' ? 'დაცული კაბინეტი · Password Protected' : 'Private Access · Password Protected';
    var placeholder = lang === 'ka' ? 'პაროლი' : 'Password';
    var buttonText = lang === 'ka' ? 'შესვლა' : 'Enter';
    var errorText = lang === 'ka' ? 'არასწორი პაროლი!' : 'Incorrect password!';

    gate.innerHTML = 
      '<div style="background:#fffdf7; border:1px solid #d9d4c8; border-top:3px double #1a1a1a; border-bottom:3px double #1a1a1a; padding:40px; max-width:400px; width:100%; text-align:center; box-shadow:0 12px 24px rgba(0,0,0,0.05);">'
      + '  <h2 style="font-family:\'Noto Serif Georgian\', Georgia, serif; font-weight:900; font-size:26px; margin-bottom:12px; color:#1a1a1a; margin-top:0;">' + title + '</h2>'
      + '  <p style="font-size:12px; color:#6b6b6b; text-transform:uppercase; letter-spacing:1px; margin-bottom:24px; margin-top:0;">' + subtitle + '</p>'
      + '  <form id="global-gate-form">'
      + '    <input type="password" id="global-gate-pass" placeholder="' + placeholder + '" required style="width:100%; padding:12px; border:1px solid #d9d4c8; background:#fffdf7; color:#1a1a1a; font-size:14px; text-align:center; margin-bottom:16px; outline:none; height:44px; box-sizing:border-box;">'
      + '    <button type="submit" style="width:100%; padding:12px; background:#1a1a1a; color:#fffdf7; border:none; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; cursor:pointer; height:44px; box-sizing:border-box;">' + buttonText + '</button>'
      + '    <p id="global-gate-error" style="color:#b91c1c; font-size:12px; margin-top:12px; display:none; font-weight:bold;">' + errorText + '</p>'
      + '  </form>'
      + '</div>';
      
    document.body.appendChild(gate);
    document.body.style.overflow = 'hidden';
    
    // Set style to hide everything except our gate
    style.innerHTML = 'body > :not(#tp-global-gate) { display: none !important; }';

    var form = document.getElementById('global-gate-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var pass = document.getElementById('global-gate-pass').value;
        if (pass === 'salamandra123' || pass === '111') {
          localStorage.setItem('cabinet_auth', 'true');
          gate.remove();
          if (style) style.remove();
          document.body.style.overflow = '';
          window.location.reload();
        } else {
          var err = document.getElementById('global-gate-error');
          if (err) err.style.display = 'block';
        }
      });
    }
  }

  if (document.body) {
    initGate();
  } else {
    window.addEventListener('DOMContentLoaded', initGate);
  }
})();
