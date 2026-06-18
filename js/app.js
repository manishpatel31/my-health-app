// ===== VITALGREEN v2 — SHARED UTILITIES =====
let _dashSnapshot = null; // holds weights/foods/settings for on-demand AI insight

// ---- Live sync ----
// This app has no backend/websocket — data lives in a GitHub Gist that other devices
// write to. We can't get instant push updates, but we can get close: re-fetch as soon
// as the app/tab regains focus (covers switching back from another app, unlocking the
// phone, etc.) plus a light poll while the page stays open, so edits from another
// device show up without the user having to close and reopen the app.
function initLiveSync(refreshFn, intervalMs = 10000) {
  if (typeof refreshFn !== 'function') return;
  let running = false;
  const tick = async () => {
    if (running) return; // avoid overlapping fetches if one is already in flight
    running = true;
    try { await refreshFn(); } catch (e) { console.warn('Live sync refresh failed', e); }
    running = false;
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
  window.addEventListener('focus', tick);
  window.addEventListener('online', tick);
  setInterval(() => { if (document.visibilityState === 'visible') tick(); }, intervalMs);
}

// ---- Setup ----
async function saveSetup() {
  const token   = document.getElementById('ghToken')?.value?.trim();
  const name    = document.getElementById('userName')?.value?.trim();
  const groqKey = document.getElementById('groqKey')?.value?.trim();
  const gistId  = document.getElementById('gistIdField')?.value?.trim();
  if (!token || !name || !groqKey) { showToast('Please fill in all fields'); return; }
  Storage.setConfig({ token, userName: name, groqKey, gistId: gistId || undefined });

  // Verify the token/gist actually work before closing setup, so sync problems
  // surface here instead of silently failing on another device later.
  showToast('🔄 Checking GitHub connection...');
  const result = await Storage.testConnection();
  if (!result.ok) { showToast('❌ ' + result.message); return; }
  showToast('✅ ' + result.message);
  document.getElementById('setupModal')?.classList.add('hidden');
  if (typeof initDashboard === 'function') initDashboard();
}

async function showSettings() {
  const cfg = Storage.getConfig();
  const el = document.getElementById('ghToken'); if (el) el.value = cfg.token || '';
  const el2 = document.getElementById('userName'); if (el2) el2.value = cfg.userName || '';
  const el3 = document.getElementById('groqKey'); if (el3) el3.value = cfg.groqKey || '';
  const el4 = document.getElementById('gistIdField');
  if (el4) el4.value = cfg.gistId || '';
  const hap = document.getElementById('hapticsToggle');
  if (hap && typeof UI !== 'undefined') hap.checked = UI.hapticsEnabled();
  document.getElementById('setupModal')?.classList.remove('hidden');
}

function toggleKeyVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === 'password') { inp.type = 'text'; btn.innerHTML = '<i class="fas fa-eye-slash"></i>'; }
  else { inp.type = 'password'; btn.innerHTML = '<i class="fas fa-eye"></i>'; }
}

async function copyApiKey(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value) { showToast('No key to copy'); return; }
  try {
    await navigator.clipboard.writeText(inp.value);
    showToast('✓ Copied to clipboard!');
  } catch {
    inp.select(); document.execCommand('copy');
    showToast('✓ Copied!');
  }
}

// ---- Dashboard ----
async function initDashboard() {
  if (!Storage.isSetup()) {
    document.getElementById('setupModal')?.classList.remove('hidden');
    return;
  }
  const cfg = Storage.getConfig();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('greeting'); if (el) el.textContent = greet;
  const nameEl = document.getElementById('dashName'); if (nameEl) nameEl.textContent = cfg.userName + ' 👋';
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    const d = new Date();
    dateEl.innerHTML = d.toLocaleDateString('en-IN',{weekday:'long'}) + '<br>' +
      d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  }

  const [weights, allFoods, settings, allWalks, allWater] = await Promise.all([
    Storage.getWeights(), Storage.getFoods(),
    Storage.getSettings(), Storage.getWalks(), Storage.getWater(),
  ]);
  const today = Storage.today();
  const foods = allFoods.filter(f => f.date === today);
  const walks = allWalks.filter(w => w.date === today);

  // Weight stat
  const weightEl = document.getElementById('statWeight');
  const weightDeltaEl = document.getElementById('statWeightDelta');
  if (weightEl) {
    if (weights.length > 0) {
      weightEl.textContent = weights[0].kg + ' kg';
      if (weights.length > 1) {
        const diff = (weights[0].kg - weights[1].kg).toFixed(1);
        weightDeltaEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg from last';
        weightDeltaEl.style.color = diff <= 0 ? 'var(--green-500)' : 'var(--accent)';
      }
      // Target weight progress
      if (settings.targetWeightKg) {
        const targetEl = document.getElementById('statWeightTarget');
        if (targetEl) targetEl.textContent = `Target: ${settings.targetWeightKg} kg`;
      }
    } else { weightEl.textContent = '— kg'; if(weightDeltaEl) weightDeltaEl.textContent = 'No data yet'; }
  }

  // BMI
  const bmiEl = document.getElementById('statBMI');
  if (bmiEl && weights.length > 0 && settings.heightCm) {
    const h = settings.heightCm / 100;
    const bmi = (weights[0].kg / (h*h)).toFixed(1);
    bmiEl.textContent = bmi;
    const lb = document.getElementById('statBMILabel'); if(lb) lb.textContent = bmiCategory(parseFloat(bmi));
  }

  // Calories
  const calEl = document.getElementById('statCal');
  if (calEl) {
    const total = foods.reduce((s,f) => s + (f.calories||0), 0);
    calEl.textContent = Math.round(total) + ' kcal';
    const sub = document.getElementById('statCalSub');
    if (sub && settings.calorieGoal) {
      const rem = settings.calorieGoal - Math.round(total);
      sub.textContent = rem > 0 ? `${rem} remaining` : `${Math.abs(rem)} over goal`;
      sub.style.color = rem < 0 ? 'var(--accent)' : '';
    }
  }

  // Steps
  const stepsEl = document.getElementById('statSteps');
  if (stepsEl) {
    const totalSteps = walks.reduce((s,w) => s + (w.steps||0), 0);
    stepsEl.textContent = totalSteps.toLocaleString();
    const sub = document.getElementById('statStepsSub');
    if (sub && settings.dailyStepsGoal) {
      const pct = Math.min(100, Math.round(totalSteps/settings.dailyStepsGoal*100));
      sub.textContent = `${pct}% of ${settings.dailyStepsGoal.toLocaleString()} goal`;
    }
  }

  // Render the daily insight banner first and isolate every widget below in its own
  // try/catch — one widget throwing (e.g. a chart issue) must never blank out the rest
  // of the dashboard, including this banner.
  _dashSnapshot = { weights, foods, settings, walksToday: walks };
  try { renderDailyInsightBanner(); } catch(e) { console.error('renderDailyInsightBanner failed', e); }
  try { renderFoodPreview(foods); } catch(e) { console.error('renderFoodPreview failed', e); }
  try { renderMiniWeightChart(weights.slice(0,14).reverse()); } catch(e) { console.error('renderMiniWeightChart failed', e); }
  try { renderEnergyCard(weights, settings); } catch(e) { console.error('renderEnergyCard failed', e); }
  try { renderStreakCard(allFoods, allWalks, allWater, weights); } catch(e) { console.error('renderStreakCard failed', e); }
  try { renderWaterWidget(allWater, settings); } catch(e) { console.error('renderWaterWidget failed', e); }
  try { renderCalorieTrend(allFoods, settings); } catch(e) { console.error('renderCalorieTrend failed', e); }
}

// ===== ENERGY / DEFICIT CARD (TDEE → how much to eat to hit your goal) =====
function renderEnergyCard(weights, settings) {
  const el = document.getElementById('energyCard'); if (!el) return;
  const cw = weights[0]?.kg;
  if (!cw || !settings.heightCm) {
    el.innerHTML = `<div class="card-title">⚡ Your Energy Needs</div>
      <p class="empty-state" style="margin:0">Add your weight and set up your profile to see how many calories your body needs.
      <a href="pages/insights.html">Open the planner →</a></p>`;
    return;
  }
  const r = calcDeficit(settings, cw);
  const targetW = settings.targetWeightKg;
  const daysLeft = daysUntil(settings.targetDateISO);
  let goalLine;
  if (!targetW) {
    goalLine = `Set a time-bound target weight in the planner to get a daily calorie target.`;
  } else if (Math.abs(cw - targetW) < 0.1) {
    goalLine = `🎉 You're at your target weight of <strong>${targetW} kg</strong>!`;
  } else {
    const timeLine = daysLeft != null
      ? (daysLeft > 0 ? ` — <strong>${daysLeft} day${daysLeft===1?'':'s'}</strong> left until your goal date.`
                      : ` — your target date has passed, time to set a new one.`)
      : (r.weeksToGoal ? ` — about <strong>${r.weeksToGoal} weeks</strong> away.` : '.');
    goalLine = `To reach <strong>${targetW} kg</strong>, eat <strong>${r.targetCal} kcal/day</strong>${timeLine}`;
  }
  el.innerHTML = `
    <div class="card-title">⚡ Your Energy Needs</div>
    <div class="energy-grid">
      <div class="energy-item"><div class="e-val">${r.bmr}</div><div class="e-label">BMR<br><span>at rest</span></div></div>
      <div class="energy-item e-tdee"><div class="e-val">${r.tdee}</div><div class="e-label">TDEE<br><span>burned/day</span></div></div>
      <div class="energy-item"><div class="e-val">−${r.dailyDeficit}</div><div class="e-label">Deficit<br><span>to lose ${settings.weeklyLossKg||0.5}kg/wk</span></div></div>
      <div class="energy-item e-target"><div class="e-val">${r.targetCal}</div><div class="e-label">Eat this<br><span>kcal/day</span></div></div>
    </div>
    <p class="energy-goal-line">${goalLine}</p>
    <a href="pages/insights.html" class="energy-roadmap-link">🗺️ View your weight-loss roadmap →</a>`;
}

function daysUntil(dateISO) {
  if (!dateISO) return null;
  const ms = new Date(dateISO+'T00:00:00') - new Date(Storage.today()+'T00:00:00');
  return Math.round(ms / 86400000);
}

// ===== STREAK + GAMIFICATION =====
function loggedDateSet(allFoods, allWalks, allWater, weights) {
  const s = new Set();
  (allFoods||[]).forEach(f => f.date && s.add(f.date));
  (allWalks||[]).forEach(w => (w.steps>0) && s.add(w.date));
  (allWater||[]).forEach(w => (w.glasses>0) && s.add(w.date));
  (weights||[]).forEach(w => w.date && s.add(w.date));
  return s;
}
function computeStreak(dateSet) {
  const dayMs = 86400000;
  const fmt = d => d.toISOString().split('T')[0];
  let cur = 0;
  const start = new Date();
  // If today not logged yet, the streak can still be "alive" from yesterday
  if (!dateSet.has(fmt(start))) start.setTime(start.getTime() - dayMs);
  let cursor = new Date(start);
  while (dateSet.has(fmt(cursor))) { cur++; cursor.setTime(cursor.getTime() - dayMs); }
  // best streak across all logged dates
  const sorted = [...dateSet].sort();
  let best = 0, run = 0, prev = null;
  for (const ds of sorted) {
    if (prev && (new Date(ds) - new Date(prev)) === dayMs) run++; else run = 1;
    best = Math.max(best, run); prev = ds;
  }
  return { current: cur, best };
}
function earnedBadges(streak, dateSet, allFoods, weights, allWater) {
  const days = dateSet.size;
  const waterDays = (allWater||[]).filter(w => w.glasses>=8).length;
  const all = [
    { id:'first',  emoji:'🌱', label:'First Log',     got: days >= 1 },
    { id:'s3',     emoji:'🔥', label:'3-Day Streak',  got: streak.best >= 3 },
    { id:'s7',     emoji:'⚡', label:'7-Day Streak',  got: streak.best >= 7 },
    { id:'s30',    emoji:'🏆', label:'30-Day Streak', got: streak.best >= 30 },
    { id:'food50', emoji:'🍽️', label:'50 Meals',      got: (allFoods||[]).length >= 50 },
    { id:'weigh10',emoji:'⚖️', label:'10 Weigh-ins',  got: (weights||[]).length >= 10 },
    { id:'hydrate',emoji:'💧', label:'Hydrated 5×',   got: waterDays >= 5 },
    { id:'commit', emoji:'💎', label:'30 Days Logged', got: days >= 30 },
  ];
  return all;
}
function renderStreakCard(allFoods, allWalks, allWater, weights) {
  const el = document.getElementById('streakCard'); if (!el) return;
  const dateSet = loggedDateSet(allFoods, allWalks, allWater, weights);
  const streak = computeStreak(dateSet);
  const badges = earnedBadges(streak, dateSet, allFoods, weights, allWater);
  const earned = badges.filter(b => b.got);
  const flame = streak.current > 0 ? '🔥' : '💤';
  const msg = streak.current === 0 ? 'Log anything today to start a streak!'
    : streak.current === 1 ? 'Nice start — come back tomorrow to keep it going!'
    : `${streak.current} days strong — keep it up! 💪`;
  el.innerHTML = `
    <div class="streak-top">
      <div class="streak-flame">${flame}</div>
      <div class="streak-info">
        <div class="streak-num">${streak.current} <span>day${streak.current===1?'':'s'}</span></div>
        <div class="streak-msg">${msg}</div>
        <div class="streak-best">Best: ${streak.best} days</div>
      </div>
    </div>
    <div class="badge-row">
      ${badges.map(b => `<div class="badge ${b.got?'got':''}" title="${b.label}">
        <span class="badge-emoji">${b.emoji}</span><span class="badge-label">${b.label}</span></div>`).join('')}
    </div>
    <div class="streak-foot">${earned.length}/${badges.length} badges earned</div>`;
}

// ===== WATER INTAKE WIDGET =====
async function renderWaterWidget(allWater, settings) {
  const el = document.getElementById('waterWidget'); if (!el) return;
  const today = Storage.today();
  const goal = settings.waterGoalGlasses || 8;
  const cur = (allWater||[]).find(w => w.date === today)?.glasses || 0;
  const pct = Math.min(100, Math.round(cur/goal*100));
  const glasses = Array.from({length: goal}, (_,i) =>
    `<span class="glass ${i < cur ? 'full':''}">${i < cur ? '💧' : '🥛'}</span>`).join('');
  el.innerHTML = `
    <div class="card-title">💧 Water Intake</div>
    <div class="water-top">
      <div class="water-num">${cur} <span>/ ${goal} glasses</span></div>
      <div class="water-ml">${(cur*250).toLocaleString()} ml</div>
    </div>
    <div class="water-glasses">${glasses}</div>
    <div class="progress-bar-wrap" style="margin-top:0.7rem"><div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#5b8dee,#6fc3ff)"></div></div>
    <div class="water-btns">
      <button class="btn-secondary" onclick="changeWater(-1)"><i class="fas fa-minus"></i></button>
      <button class="btn-primary" style="flex:1" onclick="changeWater(1)"><i class="fas fa-plus"></i> Add a glass (250ml)</button>
    </div>`;
}
async function changeWater(delta) {
  await Storage.addWater(delta);
  const [allWater, settings] = await Promise.all([Storage.getWater(), Storage.getSettings()]);
  renderWaterWidget(allWater, settings);
  if (delta > 0) {
    const cur = (allWater||[]).find(w => w.date === Storage.today())?.glasses || 0;
    if (cur === (settings.waterGoalGlasses||8)) showToast('🎉 Hydration goal reached!');
  }
}

// ===== 7-DAY CALORIE TREND (mini bar chart) =====
function renderCalorieTrend(allFoods, settings) {
  const canvas = document.getElementById('calorieTrendChart'); if (!canvas) return;
  const goal = settings.calorieGoal || 2000;
  const days = [], labels = [], totals = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    days.push(ds);
    labels.push(d.toLocaleDateString('en-IN',{weekday:'short'}));
    totals.push((allFoods||[]).filter(f => f.date === ds).reduce((s,f)=>s+(f.calories||0),0));
  }
  const colors = totals.map(t => t === 0 ? 'rgba(93,119,104,0.18)' : t > goal ? '#ff6b35' : '#38c47d');
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type:'bar',
    data:{ labels, datasets:[{ data: totals, backgroundColor: colors, borderRadius:8, maxBarThickness:38 }] },
    options:{ responsive:true, plugins:{ legend:{display:false},
        tooltip:{ callbacks:{ label: c => `${Math.round(c.raw)} kcal` } } },
      scales:{ y:{ beginAtZero:true, grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{family:'DM Sans'},color:'#6b8070'} },
               x:{ grid:{display:false}, ticks:{font:{family:'DM Sans'},color:'#6b8070'} } } }
  });
}

function renderFoodPreview(foods) {
  const el = document.getElementById('recentFoodLog'); if (!el) return;
  if (!foods || foods.length === 0) {
    el.innerHTML = '<p class="empty-state">No food logged today. <a href="pages/calories.html">Add a meal →</a></p>'; return;
  }
  el.innerHTML = foods.slice(0,5).map((f,i) => `
    <div class="food-entry" style="animation:slideUp .35s ease both;animation-delay:${i*0.05}s">
      <div class="food-entry-icon">${typeof FoodDB!=='undefined' ? FoodDB.emojiFor(f.name) : '🍽️'}</div>
      <div class="food-entry-info">
        <div class="food-entry-name">${escHtml(f.name)}</div>
        <div class="food-entry-portion">${escHtml(f.portion||'')}</div>
      </div>
      <div class="food-entry-cal">${Math.round(f.calories)} kcal</div>
    </div>`).join('');
  if (foods.length > 5)
    el.innerHTML += `<a href="pages/calories.html" style="display:block;text-align:center;font-size:0.85rem;color:var(--green-500);margin-top:0.5rem;">+${foods.length-5} more →</a>`;
}

function renderMiniWeightChart(weights) {
  const canvas = document.getElementById('miniWeightChart'); if (!canvas) return;
  if (weights.length === 0) {
    const ctx = canvas.getContext('2d'); canvas.height=140;
    ctx.fillStyle='#f4faf7'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#6b8070'; ctx.font='14px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText('Log your weight to see trends', canvas.width/2, 75); return;
  }
  const labels = weights.map(w => { const d=new Date(w.date); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); });
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type:'line', data:{ labels, datasets:[{
      data: weights.map(w=>w.kg), borderColor:'#2d8a55', backgroundColor:'rgba(45,138,85,0.08)',
      borderWidth:2.5, pointBackgroundColor:'#2d8a55', pointRadius:4, tension:0.4, fill:true
    }]},
    options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ y:{grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{family:'DM Sans'},color:'#6b8070',callback:v=>v+' kg'}},
               x:{grid:{display:false}, ticks:{font:{family:'DM Sans'},color:'#6b8070',maxRotation:45}} } }
  });
}

// The exact numbers the plan is grounded in — used to detect when logging more
// food/steps has made a cached plan stale, without ever auto-calling the AI.
function dailyPlanFacts() {
  const { weights=[], foods=[], settings={}, walksToday=[] } = _dashSnapshot || {};
  const todayKcal = Math.round(foods.reduce((s,f)=>s+(f.calories||0),0));
  const goal = settings.calorieGoal || 2000;
  const stepsSoFar = walksToday.reduce((s,w)=>s+(w.steps||0),0);
  const stepsGoal = settings.dailyStepsGoal || 8000;
  return { todayKcal, goal, stepsSoFar, stepsGoal };
}

// Renders the daily action plan WITHOUT calling the AI. Shows the cached plan for
// today (if any), otherwise a Generate button. AI is only called on button press.
// If today's logging has changed since the plan was generated, flags it as stale
// (still requires a manual tap to regenerate — we never auto-call the AI).
function renderDailyInsightBanner() {
  const el = document.getElementById('aiInsightBanner'); if (!el) return;
  if (!Storage.getConfig().groqKey) { el.style.display='none'; return; }
  el.style.display = 'block';
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('vg_daily_insight') || 'null'); } catch {}
  const genBtn = (label) => `<button class="insight-gen-btn" onclick="generateDailyInsight()">${label}</button>`;
  if (cached && cached.date === Storage.today() && cached.text) {
    const now = dailyPlanFacts();
    const stale = cached.facts && (
      cached.facts.todayKcal !== now.todayKcal || cached.facts.goal !== now.goal ||
      cached.facts.stepsSoFar !== now.stepsSoFar || cached.facts.stepsGoal !== now.stepsGoal
    );
    const staleNote = stale ? `<div class="insight-stale">📊 You've logged more since this was made — tap Regenerate for fresh numbers</div>` : '';
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">📋</span><div>${formatDailyTips(cached.text)}${staleNote}</div></div>${genBtn('<i class="fas fa-rotate-right"></i> Regenerate')}`;
  } else {
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">✨</span><p>Get today's action plan — exact calories left, steps to walk, and what to do next.</p></div>${genBtn('<i class="fas fa-wand-magic-sparkles"></i> Generate today’s plan')}`;
  }
}

async function generateDailyInsight() {
  const el = document.getElementById('aiInsightBanner'); if (!el) return;
  const { weights=[], foods=[], settings={}, walksToday=[] } = _dashSnapshot || {};
  el.innerHTML = `<div class="insight-loading"><span class="spinner-sm"></span> AI is building today's plan...</div>`;
  try {
    const todayKcal = foods.reduce((s,f)=>s+(f.calories||0),0);
    const latestW = weights[0]?.kg || 70;
    const targetW = settings.targetWeightKg;
    const bmi = weights[0]?.kg && settings.heightCm ? (weights[0].kg/((settings.heightCm/100)**2)).toFixed(1) : null;
    const goal = settings.calorieGoal || 2000;
    const remaining = Math.round(goal - todayKcal);
    const stepsSoFar = walksToday.reduce((s,w)=>s+(w.steps||0),0);
    const stepsGoal = settings.dailyStepsGoal || 8000;
    const stepsRemaining = Math.max(0, stepsGoal - stepsSoFar);
    const daysLeft = daysUntil(settings.targetDateISO);

    // Precompute the grounding numbers ourselves — the AI is told to use them, not invent its own
    let budgetLine;
    if (remaining >= 0) {
      budgetLine = `Has ${remaining} kcal left in today's budget (goal ${goal}, eaten ${Math.round(todayKcal)}).`;
    } else {
      const over = Math.abs(remaining);
      const extraSteps = caloriesToSteps(over, latestW);
      budgetLine = `Is ${over} kcal OVER today's budget (goal ${goal}, eaten ${Math.round(todayKcal)}). Walking an EXTRA ${extraSteps.toLocaleString()} steps today would burn that off (use this exact number).`;
    }
    const stepsLine = stepsRemaining > 0
      ? `Has walked ${stepsSoFar.toLocaleString()} of ${stepsGoal.toLocaleString()} steps today — needs ${stepsRemaining.toLocaleString()} more steps to hit the goal (use this exact number).`
      : `Already hit today's step goal of ${stepsGoal.toLocaleString()} (${stepsSoFar.toLocaleString()} steps) 🎉.`;
    const targetLine = targetW
      ? `Target weight: ${targetW}kg${daysLeft!=null ? `, ${daysLeft} day(s) left to reach it` : ''}.`
      : `No target weight set yet.`;

    const prompt = `User snapshot for today:
- Current weight: ${weights[0]?.kg||'?'}kg, BMI: ${bmi||'unknown'}
- ${targetLine}
- ${budgetLine}
- ${stepsLine}
- Today's foods so far: ${foods.map(f=>f.name).join(', ')||'none yet'}

Write exactly 3 short action items for the rest of today as a bullet list (one line each, start each line with "- "). You MUST use the exact numbers given above (steps, kcal) — do not invent new numbers or estimates. Be direct, specific and motivating. No intro, no headings, just the 3 bullets.`;
    const reply = await callGroq([{role:'user',content:prompt}],
      'You are a sharp, numbers-driven health coach. Always reuse the exact figures the user gives you instead of making up your own.');
    localStorage.setItem('vg_daily_insight', JSON.stringify({ date: Storage.today(), text: reply, facts: { todayKcal: Math.round(todayKcal), goal, stepsSoFar, stepsGoal } }));
    renderDailyInsightBanner();
  } catch(e) {
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">⚠️</span><p>Couldn't generate your plan — check your Groq API key in settings.</p></div><button class="insight-gen-btn" onclick="generateDailyInsight()"><i class="fas fa-rotate-right"></i> Try again</button>`;
  }
}

// Renders AI bullet-list replies (lines starting with "- ") as a clean <ul>; escapes HTML first
function formatDailyTips(text) {
  const esc = escHtml(text).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  const lines = esc.split('\n').map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^[-•]\s+/.test(l)).map(l => l.replace(/^[-•]\s+/,''));
  if (bullets.length) return `<ul class="ai-bullets">${bullets.map(b=>`<li>${b}</li>`).join('')}</ul>`;
  return `<p>${esc.replace(/\n/g,'<br>')}</p>`;
}

// ---- Utilities ----
function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal weight';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, duration=2800) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ---- Calorie deficit calculator ----
function calcDeficit(settings, currentWeightKg) {
  const weeklyLoss = settings.weeklyLossKg || 0.5;
  const dailyDeficit = Math.round(weeklyLoss * 7700 / 7);
  const bmr = calcBMR(currentWeightKg, settings.heightCm, settings.age, settings.gender);
  const tdee = Math.round(bmr * activityMultiplier(settings.activityLevel));
  const targetCal = Math.max(1200, tdee - dailyDeficit);
  const weeksToGoal = settings.targetWeightKg
    ? Math.ceil(Math.abs(currentWeightKg - settings.targetWeightKg) / weeklyLoss)
    : null;
  return { dailyDeficit, bmr: Math.round(bmr), tdee, targetCal, weeksToGoal };
}

function calcBMR(weight, height, age, gender) {
  if (!weight || !height) return 2000;
  const a = age || 30;
  if (gender === 'female') return 10*weight + 6.25*height - 5*a - 161;
  return 10*weight + 6.25*height - 5*a + 5;
}

function activityMultiplier(level) {
  return { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, veryactive:1.9 }[level] || 1.55;
}

// ---- Steps <-> calories (shared by Walk page + daily action plan) ----
function stepsToCalories(steps, weightKg) {
  // ~0.04 kcal per step per 70kg person, scaled
  const w = weightKg || 70;
  return Math.round(steps * 0.04 * (w/70));
}
function caloriesToSteps(cal, weightKg) {
  const w = weightKg || 70;
  return Math.round(cal / (0.04 * (w/70)));
}

// ---- Groq API ----
async function callGroq(messages, systemPrompt, maxTokens=800, temperature=0.7) {
  const { groqKey } = Storage.getConfig();
  if (!groqKey) throw new Error('Groq API key not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${groqKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role:'system', content: systemPrompt||'You are a helpful health assistant.' }, ...messages],
      temperature, max_tokens: maxTokens,
    })
  });
  if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||'Groq API error'); }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ===== PWA: register service worker (works on every page) =====
function initPWA() {
  if (!('serviceWorker' in navigator)) return;
  const swUrl = location.pathname.includes('/pages/') ? '../sw.js' : './sw.js';
  navigator.serviceWorker.register(swUrl).catch(e => console.warn('SW register failed', e));
}

// ===== LOCAL REMINDERS / NOTIFICATIONS =====
// Note: these are in-app reminders that fire while the app/tab is open. A static
// site has no push server, so they can't fire when the app is fully closed.
function getReminderPrefs() {
  try { return { enabled:false, water:true, food:true, weight:true, ...JSON.parse(localStorage.getItem('vg_reminders')||'{}') }; }
  catch { return { enabled:false, water:true, food:true, weight:true }; }
}
function setReminderPrefs(p) { localStorage.setItem('vg_reminders', JSON.stringify(p)); }

async function vgNotify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg && reg.active) reg.active.postMessage({ type:'notify', title, body, tag });
    else new Notification(title, { body });
  } catch { try { new Notification(title, { body }); } catch {} }
}

function reminderSlots(p) {
  const slots = [];
  if (p.weight) slots.push(['08:00','⚖️ Time to weigh in','Log your weight to track your progress.']);
  if (p.food) {
    slots.push(['09:00','🌅 Breakfast time','Log your breakfast in VitalGreen.']);
    slots.push(['13:30','☀️ Lunch time',"Don't forget to log your lunch."]);
    slots.push(['20:00','🌙 Dinner time','Log your dinner to close out the day.']);
  }
  if (p.water) ['10:00','12:00','14:00','16:00','18:00'].forEach(t =>
    slots.push([t,'💧 Hydration check','Have a glass of water and log it.']));
  return slots;
}

let _reminderTimer = null;
function initReminders() {
  const p = getReminderPrefs();
  if (!p.enabled) return;
  if (_reminderTimer) clearInterval(_reminderTimer);
  checkReminders();
  _reminderTimer = setInterval(checkReminders, 60 * 1000);
}
function checkReminders() {
  const p = getReminderPrefs();
  if (!p.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  const today = Storage.today();
  let fired = {}; try { fired = JSON.parse(localStorage.getItem('vg_rem_fired')||'{}'); } catch {}
  reminderSlots(p).forEach(([t,title,body]) => {
    if (hhmm === t) {
      const key = today + '_' + t;
      if (!fired[key]) { vgNotify(title, body, 'vg-'+t); fired[key] = 1; }
    }
  });
  Object.keys(fired).forEach(k => { if (!k.startsWith(today)) delete fired[k]; });
  localStorage.setItem('vg_rem_fired', JSON.stringify(fired));
}

// Reminders UI (rendered on the home page)
function renderReminderCard() {
  const el = document.getElementById('reminderCard'); if (!el) return;
  const p = getReminderPrefs();
  const supported = 'Notification' in window;
  const denied = supported && Notification.permission === 'denied';
  if (!supported) { el.innerHTML = `<div class="card-title">🔔 Reminders</div><p class="empty-state" style="margin:0">Notifications aren't supported on this browser.</p>`; return; }
  const row = (id,label,sub,on) => `
    <label class="rem-row">
      <span><span class="rem-label">${label}</span><span class="rem-sub">${sub}</span></span>
      <input type="checkbox" ${on?'checked':''} ${p.enabled?'':'disabled'} onchange="toggleReminderType('${id}',this.checked)"/>
    </label>`;
  el.innerHTML = `
    <div class="card-title">🔔 Reminders</div>
    <label class="rem-row rem-master">
      <span><span class="rem-label">Enable reminders</span><span class="rem-sub">${denied?'Blocked — allow notifications in browser settings':'Get nudges while the app is open'}</span></span>
      <input type="checkbox" ${p.enabled?'checked':''} ${denied?'disabled':''} onchange="setRemindersEnabled(this.checked)"/>
    </label>
    ${row('weight','⚖️ Weigh-in','Every morning at 8:00 AM', p.weight)}
    ${row('food','🍽️ Meal logging','Breakfast, lunch & dinner', p.food)}
    ${row('water','💧 Hydration','Every 2 hours, 10AM–6PM', p.water)}
    <p class="rem-note">ℹ️ Reminders fire while VitalGreen is open in a tab. Install the app (Add to Home Screen) for the best experience.</p>`;
}
async function setRemindersEnabled(on) {
  const p = getReminderPrefs();
  if (on && Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { showToast('Enable notifications in your browser to use reminders'); renderReminderCard(); return; }
  }
  p.enabled = on; setReminderPrefs(p);
  showToast(on ? '🔔 Reminders enabled' : 'Reminders turned off');
  renderReminderCard();
  if (on) { initReminders(); vgNotify('🌿 VitalGreen reminders on', "We'll nudge you to log while the app is open."); }
  else if (_reminderTimer) clearInterval(_reminderTimer);
}
function toggleReminderType(type, on) {
  const p = getReminderPrefs(); p[type] = on; setReminderPrefs(p);
}

// Boot PWA + reminders on every page
initPWA();
initReminders();
