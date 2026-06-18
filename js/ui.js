// VitalGreen UI layer — haptic feedback, micro-interactions, count-ups & scroll reveals.
// Loaded after app.js on every page; self-initialises at the bottom.
const UI = (() => {
  const HAPTICS_KEY = 'vg_haptics';
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hapticsOn = localStorage.getItem(HAPTICS_KEY) !== 'off';

  // Vibration patterns (ms, or arrays for buzz-pause-buzz sequences)
  const PATTERNS = {
    tick: 6, light: 10, medium: 18, heavy: 32,
    success: [10, 35, 16], warning: [22, 55, 22], error: [30, 45, 30, 45, 30],
  };

  function haptic(type = 'light') {
    if (!hapticsOn || !canVibrate) return;
    try { navigator.vibrate(PATTERNS[type] ?? 10); } catch { /* unsupported */ }
  }
  function hapticsEnabled() { return hapticsOn; }
  function setHaptics(on) {
    hapticsOn = !!on;
    localStorage.setItem(HAPTICS_KEY, hapticsOn ? 'on' : 'off');
    if (hapticsOn) haptic('medium');
  }

  // ---- Auto-wire tactile feedback to interactive elements (event delegation) ----
  // Map a target to the strength of feedback it should produce on press.
  function feedbackFor(t) {
    if (t.closest('.btn-danger, .weight-entry-del, .food-entry-del, .library-item-del')) return 'warning';
    if (t.closest('.btn-primary, .chat-send-btn, .fab-main')) return 'medium';
    if (t.closest('.btn-secondary, .btn-icon, .tab-btn, .nav-link, .bnav-link, .quick-card, .suggestion-chip, .fab-item, .insight-gen-btn, .insight-refresh-btn, .input-action-btn, .water-btns button, button, a[href]')) return 'light';
    return null;
  }
  function wireHaptics() {
    // pointerdown gives the feedback the instant a press starts (feels native)
    document.addEventListener('pointerdown', e => {
      const type = feedbackFor(e.target);
      if (type) haptic(type);
    }, { passive: true });
    // toggles / checkboxes report on state change
    document.addEventListener('change', e => {
      if (e.target.matches('input[type=checkbox], input[type=radio], select')) haptic('tick');
    }, { passive: true });
  }

  // Wrap app.js's showToast so every toast carries a success buzz.
  function wrapToast() {
    if (typeof window.showToast !== 'function' || window.showToast.__vgWrapped) return;
    const orig = window.showToast;
    const wrapped = function (msg, ...rest) { haptic('success'); return orig.call(this, msg, ...rest); };
    wrapped.__vgWrapped = true;
    window.showToast = wrapped;
  }

  // ---- Number count-up (tabular stats feel alive) ----
  function countUp(el, to, { duration = 900, decimals = 0, prefix = '', suffix = '' } = {}) {
    if (!el) return;
    const target = Number(to) || 0;
    if (reduceMotion) { el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`; return; }
    const from = Number(el.dataset.countFrom ?? 0);
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = from + (target - from) * eased;
      el.textContent = `${prefix}${val.toFixed(decimals)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
      else el.dataset.countFrom = target;
    }
    requestAnimationFrame(frame);
  }

  // ---- Scroll reveal: opt-in via .reveal class, fades/rises into view once ----
  let revealObserver = null;
  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('revealed'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }
  // Re-scan for dynamically inserted .reveal nodes (call after rendering lists).
  function scanReveal(root = document) {
    if (!revealObserver) { root.querySelectorAll?.('.reveal:not(.revealed)').forEach(el => el.classList.add('revealed')); return; }
    root.querySelectorAll?.('.reveal:not(.revealed)').forEach(el => revealObserver.observe(el));
  }

  function init() {
    wireHaptics();      // delegated press feedback — safe before full DOM parse
    wrapToast();        // showToast is declared by app.js, which loads before this file
    initReveal();       // observe any .reveal elements already in the document
  }

  // This script sits at the end of <body>, so the DOM is ready; init immediately
  // but guard against the unlikely "still loading" case.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { haptic, setHaptics, hapticsEnabled, countUp, initReveal, scanReveal, reduceMotion };
})();
