// ===== VITALGREEN — DASHBOARD =====

// ---- Setup / Config ----
function saveSetup() {
  const token    = document.getElementById('ghToken')?.value?.trim();
  const name     = document.getElementById('userName')?.value?.trim();
  const groqKey  = document.getElementById('groqKey')?.value?.trim();

  if (!token || !name || !groqKey) {
    showToast('Please fill in all fields');
    return;
  }

  Storage.setConfig({ token, userName: name, groqKey });
  document.getElementById('setupModal')?.classList.add('hidden');
  initDashboard();
}

function showSettings() {
  const cfg = Storage.getConfig();
  document.getElementById('ghToken').value  = cfg.token  || '';
  document.getElementById('userName').value = cfg.userName || '';
  document.getElementById('groqKey').value  = cfg.groqKey || '';
  document.getElementById('setupModal')?.classList.remove('hidden');
}

// ---- Dashboard Init ----
async function initDashboard() {
  if (!Storage.isSetup()) {
    document.getElementById('setupModal')?.classList.remove('hidden');
    return;
  }

  const cfg = Storage.getConfig();

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const el = document.getElementById('greeting');
  if (el) el.textContent = greet;
  const nameEl = document.getElementById('dashName');
  if (nameEl) nameEl.textContent = cfg.userName + ' 👋';

  // Date
  const dateEl = document.getElementById('dashDate');
  if (dateEl) {
    const d = new Date();
    dateEl.innerHTML = d.toLocaleDateString('en-IN', { weekday: 'long' }) + '<br>' +
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Load data
  const [weights, foods, settings] = await Promise.all([
    Storage.getWeights(),
    Storage.getFoods(Storage.today()),
    Storage.getSettings(),
  ]);

  // Weight stat
  const weightEl = document.getElementById('statWeight');
  const weightDeltaEl = document.getElementById('statWeightDelta');
  if (weightEl) {
    if (weights.length > 0) {
      weightEl.textContent = weights[0].kg + ' kg';
      if (weights.length > 1) {
        const diff = (weights[0].kg - weights[1].kg).toFixed(1);
        const sign = diff > 0 ? '+' : '';
        weightDeltaEl.textContent = `${sign}${diff} kg from last`;
        weightDeltaEl.style.color = diff <= 0 ? 'var(--green-500)' : 'var(--accent)';
      }
    } else {
      weightEl.textContent = '— kg';
      weightDeltaEl.textContent = 'No data yet';
    }
  }

  // BMI stat
  const bmiEl = document.getElementById('statBMI');
  const bmiLabelEl = document.getElementById('statBMILabel');
  if (bmiEl && weights.length > 0) {
    const heightM = (settings.heightCm || 170) / 100;
    const bmi = (weights[0].kg / (heightM * heightM)).toFixed(1);
    bmiEl.textContent = bmi;
    if (bmiLabelEl) bmiLabelEl.textContent = bmiCategory(parseFloat(bmi));
  }

  // Calorie stat
  const calEl = document.getElementById('statCal');
  if (calEl) {
    const total = foods.reduce((s, f) => s + (f.calories || 0), 0);
    calEl.textContent = Math.round(total) + ' kcal';
  }

  // Today's food log
  renderFoodPreview(foods);

  // Mini weight chart
  renderMiniWeightChart(weights.slice(0, 14).reverse());
}

function renderFoodPreview(foods) {
  const el = document.getElementById('recentFoodLog');
  if (!el) return;
  if (!foods || foods.length === 0) {
    el.innerHTML = '<p class="empty-state">No food logged today. <a href="pages/calories.html">Add a meal →</a></p>';
    return;
  }
  el.innerHTML = foods.slice(0, 5).map(f => `
    <div class="food-entry">
      <div class="food-entry-icon">🍽️</div>
      <div class="food-entry-info">
        <div class="food-entry-name">${escHtml(f.name)}</div>
        <div class="food-entry-portion">${escHtml(f.portion || '')}</div>
      </div>
      <div class="food-entry-cal">${Math.round(f.calories)} kcal</div>
    </div>
  `).join('');
  if (foods.length > 5) {
    el.innerHTML += `<a href="pages/calories.html" style="display:block;text-align:center;font-size:0.85rem;color:var(--green-500);margin-top:0.5rem;">+${foods.length - 5} more →</a>`;
  }
}

function renderMiniWeightChart(weights) {
  const canvas = document.getElementById('miniWeightChart');
  if (!canvas || weights.length === 0) {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.height = 140;
      ctx.fillStyle = '#f4faf7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b8070';
      ctx.font = '14px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Log your weight to see trends', canvas.width / 2, 75);
    }
    return;
  }

  const labels = weights.map(w => {
    const d = new Date(w.date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  });
  const values = weights.map(w => w.kg);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: '#2d8a55',
        backgroundColor: 'rgba(45,138,85,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#2d8a55',
        pointRadius: 4,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'DM Sans' }, color: '#6b8070', callback: v => v + ' kg' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'DM Sans' }, color: '#6b8070', maxRotation: 45 }
        }
      }
    }
  });
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

function showToast(msg, duration = 2800) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ---- Groq API ----
async function callGroq(messages, systemPrompt) {
  const { groqKey } = Storage.getConfig();
  if (!groqKey) throw new Error('Groq API key not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful health assistant.' },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Groq API error');
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
