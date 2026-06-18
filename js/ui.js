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
  function countUp(el, to, { duration = 900, decimals = 0, prefix = '', suffix = '', group = false } = {}) {
    if (!el) return;
    const target = Number(to) || 0;
    const fmt = (v) => `${prefix}${group ? Math.round(v).toLocaleString() : v.toFixed(decimals)}${suffix}`;
    if (reduceMotion) { el.textContent = fmt(target); el.dataset.countFrom = target; return; }
    const from = Number(el.dataset.countFrom ?? 0);
    if (from === target) { el.textContent = fmt(target); return; }
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(from + (target - from) * eased);
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

  // ---- Floating action button with an expanding quick-log menu ----
  // Injected on every page so we don't have to edit each page's markup.
  function buildFab() {
    if (document.getElementById('vgFab') || !document.body) return;
    const inPages = location.pathname.includes('/pages/');
    const base = inPages ? '' : 'pages/';
    const home = inPages ? '../index.html' : 'index.html';

    const scrim = document.createElement('div');
    scrim.className = 'fab-scrim'; scrim.id = 'vgFabScrim';

    const wrap = document.createElement('div');
    wrap.className = 'fab-wrap'; wrap.id = 'vgFab';
    wrap.innerHTML =
      `<div class="fab-menu" id="vgFabMenu">
         <a class="fab-item" style="--i:3" href="${base}calories.html"><span class="fab-label">Food</span><span class="fab-ic"><i class="fas fa-utensils"></i></span></a>
         <a class="fab-item" style="--i:2" href="${base}weight.html"><span class="fab-label">Weight</span><span class="fab-ic"><i class="fas fa-weight-scale"></i></span></a>
         <a class="fab-item" style="--i:1" href="${base}walk.html"><span class="fab-label">Walk</span><span class="fab-ic"><i class="fas fa-person-walking"></i></span></a>
         <button class="fab-item" style="--i:0" type="button" data-water><span class="fab-label">Water +250ml</span><span class="fab-ic">💧</span></button>
       </div>
       <button class="fab-main" id="vgFabBtn" type="button" aria-label="Quick add" aria-expanded="false"><i class="fas fa-plus"></i></button>`;

    document.body.appendChild(scrim);
    document.body.appendChild(wrap);

    const btn = wrap.querySelector('#vgFabBtn');
    const setOpen = (open) => {
      wrap.classList.toggle('open', open);
      scrim.classList.toggle('show', open);
      btn.setAttribute('aria-expanded', String(open));
      haptic(open ? 'medium' : 'light');
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!wrap.classList.contains('open')); });
    scrim.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    wrap.querySelectorAll('a.fab-item').forEach(a => a.addEventListener('click', () => setOpen(false)));

    const waterBtn = wrap.querySelector('[data-water]');
    if (waterBtn) waterBtn.addEventListener('click', async () => {
      setOpen(false);
      try {
        if (typeof window.changeWater === 'function') { await window.changeWater(1); window.showToast?.('💧 +1 glass logged'); }
        else { location.href = home; }
      } catch { location.href = home; }
    });
  }

  // ---- Tiny inline SVG trend line for stat cards ----
  function sparklineSvg(values, { width = 64, height = 28, color = '#38c47d', fill = true } = {}) {
    const vals = (values || []).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length < 2) return '';
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const step = width / (vals.length - 1);
    const pts = vals.map((v, i) => [Math.round(i * step * 10) / 10, Math.round((height - ((v - min) / range) * height) * 10) / 10]);
    const lineStr = pts.map(p => p.join(',')).join(' ');
    const areaStr = fill ? `${pts[0][0]},${height} ${lineStr} ${pts[pts.length - 1][0]},${height}` : '';
    return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">
      ${fill ? `<polygon points="${areaStr}" fill="${color}" opacity="0.12"/>` : ''}
      <polyline points="${lineStr}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function init() {
    wireHaptics();      // delegated press feedback — safe before full DOM parse
    wrapToast();        // showToast is declared by app.js, which loads before this file
    initReveal();       // observe any .reveal elements already in the document
    buildFab();         // inject the floating quick-log button
  }

  // This script sits at the end of <body>, so the DOM is ready; init immediately
  // but guard against the unlikely "still loading" case.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { haptic, setHaptics, hapticsEnabled, countUp, initReveal, scanReveal, reduceMotion, sparkline: sparklineSvg };
})();
