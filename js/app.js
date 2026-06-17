// ===== VITALGREEN v2 — SHARED UTILITIES =====
let _dashSnapshot = null; // holds weights/foods/settings for on-demand AI insight

// ---- Setup ----
function saveSetup() {
  const token   = document.getElementById('ghToken')?.value?.trim();
  const name    = document.getElementById('userName')?.value?.trim();
  const groqKey = document.getElementById('groqKey')?.value?.trim();
  if (!token || !name || !groqKey) { showToast('Please fill in all fields'); return; }
  Storage.setConfig({ token, userName: name, groqKey });
  document.getElementById('setupModal')?.classList.add('hidden');
  if (typeof initDashboard === 'function') initDashboard();
}

function showSettings() {
  const cfg = Storage.getConfig();
  const el = document.getElementById('ghToken'); if (el) el.value = cfg.token || '';
  const el2 = document.getElementById('userName'); if (el2) el2.value = cfg.userName || '';
  const el3 = document.getElementById('groqKey'); if (el3) el3.value = cfg.groqKey || '';
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

  const [weights, foods, settings, walks] = await Promise.all([
    Storage.getWeights(), Storage.getFoods(Storage.today()),
    Storage.getSettings(), Storage.getWalks(Storage.today()),
  ]);

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

  renderFoodPreview(foods);
  renderMiniWeightChart(weights.slice(0,14).reverse());
  _dashSnapshot = { weights, foods, settings };
  renderDailyInsightBanner();
}

function renderFoodPreview(foods) {
  const el = document.getElementById('recentFoodLog'); if (!el) return;
  if (!foods || foods.length === 0) {
    el.innerHTML = '<p class="empty-state">No food logged today. <a href="pages/calories.html">Add a meal →</a></p>'; return;
  }
  el.innerHTML = foods.slice(0,5).map(f => `
    <div class="food-entry">
      <div class="food-entry-icon">🍽️</div>
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
  new Chart(canvas, {
    type:'line', data:{ labels, datasets:[{
      data: weights.map(w=>w.kg), borderColor:'#2d8a55', backgroundColor:'rgba(45,138,85,0.08)',
      borderWidth:2.5, pointBackgroundColor:'#2d8a55', pointRadius:4, tension:0.4, fill:true
    }]},
    options:{ responsive:true, plugins:{legend:{display:false}},
      scales:{ y:{grid:{color:'rgba(0,0,0,0.04)'}, ticks:{font:{family:'DM Sans'},color:'#6b8070',callback:v=>v+' kg'}},
               x:{grid:{display:false}, ticks:{font:{family:'DM Sans'},color:'#6b8070',maxRotation:45}} } }
  });
}

// Renders the daily insight WITHOUT calling the AI. Shows the cached insight for
// today (if any), otherwise a Generate button. AI is only called on button press.
function renderDailyInsightBanner() {
  const el = document.getElementById('aiInsightBanner'); if (!el) return;
  if (!Storage.getConfig().groqKey) { el.style.display='none'; return; }
  el.style.display = 'block';
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('vg_daily_insight') || 'null'); } catch {}
  const genBtn = (label) => `<button class="insight-gen-btn" onclick="generateDailyInsight()">${label}</button>`;
  if (cached && cached.date === Storage.today() && cached.text) {
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">💡</span><p>${escHtml(cached.text)}</p></div>${genBtn('<i class="fas fa-rotate-right"></i> Regenerate')}`;
  } else {
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">✨</span><p>Get a personalized AI insight based on today's data.</p></div>${genBtn('<i class="fas fa-wand-magic-sparkles"></i> Generate insight')}`;
  }
}

async function generateDailyInsight() {
  const el = document.getElementById('aiInsightBanner'); if (!el) return;
  const { weights=[], foods=[], settings={} } = _dashSnapshot || {};
  el.innerHTML = `<div class="insight-loading"><span class="spinner-sm"></span> AI is reading your data...</div>`;
  try {
    const todayKcal = foods.reduce((s,f)=>s+(f.calories||0),0);
    const latestW = weights[0]?.kg;
    const targetW = settings.targetWeightKg;
    const bmi = latestW && settings.heightCm ? (latestW/((settings.heightCm/100)**2)).toFixed(1) : null;
    const prompt = `User health snapshot:
- Weight: ${latestW ? latestW+'kg' : 'not set'}, Target: ${targetW ? targetW+'kg' : 'not set'}
- BMI: ${bmi||'unknown'}, Calorie goal: ${settings.calorieGoal}, Consumed today: ${Math.round(todayKcal)} kcal
- Steps goal: ${settings.dailyStepsGoal}
- Today's foods: ${foods.map(f=>f.name).join(', ')||'none yet'}

Give ONE short, specific, motivating insight or tip for today. Max 2 sentences. Be direct and personal.`;
    const reply = await callGroq([{role:'user',content:prompt}],
      'You are a sharp health coach. Give daily insights in 1-2 sentences max. Be specific, not generic.');
    localStorage.setItem('vg_daily_insight', JSON.stringify({ date: Storage.today(), text: reply }));
    renderDailyInsightBanner();
  } catch(e) {
    el.innerHTML = `<div class="insight-content"><span class="insight-icon">⚠️</span><p>Couldn't generate insight — check your Groq API key in settings.</p></div><button class="insight-gen-btn" onclick="generateDailyInsight()"><i class="fas fa-rotate-right"></i> Try again</button>`;
  }
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

// ---- Groq API ----
async function callGroq(messages, systemPrompt, maxTokens=800) {
  const { groqKey } = Storage.getConfig();
  if (!groqKey) throw new Error('Groq API key not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${groqKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role:'system', content: systemPrompt||'You are a helpful health assistant.' }, ...messages],
      temperature: 0.7, max_tokens: maxTokens,
    })
  });
  if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||'Groq API error'); }
  const data = await res.json();
  return data.choices[0].message.content;
}
