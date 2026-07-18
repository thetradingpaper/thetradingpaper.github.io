/* ============================================================
   The Trading Paper — shared theme bootstrap
   Loaded synchronously in <head> of EVERY page, BEFORE stylesheets,
   so the dark class is set before first paint (no white flash).
   Exposes window.tpTheme() and window.tpToggleTheme().
   ============================================================ */
(function(){
  'use strict';
  function cur(){ try{return localStorage.getItem('tp_theme')==='dark'?'dark':'light';}catch(e){return 'light';} }
  if(cur()==='dark') document.documentElement.setAttribute('data-theme','dark');
  // Chart.js may load after us; set defaults when available
  function chartDefaults(){ if(window.Chart){ var d=cur()==='dark';
    Chart.defaults.color=d?'#b8b1a0':'#6b6b6b';
    Chart.defaults.borderColor=d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)'; return true;} return false; }
  if(!chartDefaults()) document.addEventListener('DOMContentLoaded', chartDefaults);
  window.tpTheme=cur;
  window.tpToggleTheme=function(){ var n=cur()==='dark'?'light':'dark';
    try{localStorage.setItem('tp_theme',n);}catch(e){} location.reload(); };
})();
