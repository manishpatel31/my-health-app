// ===== VITALGREEN v2 — GITHUB GIST STORAGE =====
const GIST_FILENAME = 'vitalgreen-data.json';

const Storage = (() => {

  function getConfig() {
    return {
      token:    localStorage.getItem('vg_gh_token'),
      gistId:   localStorage.getItem('vg_gist_id'),
      userName: localStorage.getItem('vg_user_name'),
      groqKey:  localStorage.getItem('vg_groq_key'),
    };
  }

  function setConfig(obj) {
    if (obj.token    !== undefined) localStorage.setItem('vg_gh_token',  obj.token);
    if (obj.gistId   !== undefined) localStorage.setItem('vg_gist_id',   obj.gistId);
    if (obj.userName !== undefined) localStorage.setItem('vg_user_name', obj.userName);
    if (obj.groqKey  !== undefined) localStorage.setItem('vg_groq_key',  obj.groqKey);
  }

  function isSetup() {
    const c = getConfig();
    return !!(c.token && c.userName && c.groqKey);
  }

  function getCache() {
    try { return JSON.parse(localStorage.getItem('vg_cache') || '{}'); }
    catch { return {}; }
  }
  function setCache(data) { localStorage.setItem('vg_cache', JSON.stringify(data)); }

  function defaultData() {
    return {
      weights: [],
      foods: [],
      foodLibrary: [],   // saved foods for quick-add
      walks: [],         // walk log entries
      water: [],         // water intake entries
      settings: {
        calorieGoal: 2000,
        heightCm: null,
        targetWeightKg: null,
        targetDateISO: null,   // date by which the user wants to hit targetWeightKg
        weeklyLossKg: 0.5,
        dailyStepsGoal: 8000,
        waterGoalGlasses: 8,
        activityLevel: 'moderate',
        age: null,
        gender: 'male',
      }
    };
  }

  async function ghHeaders() {
    return {
      'Authorization': `token ${getConfig().token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    };
  }

  async function loadData() {
    const { token, gistId } = getConfig();
    if (!token) return defaultData();
    if (!gistId) {
      const found = await findExistingGist();
      if (found) { localStorage.setItem('vg_gist_id', found); return await loadData(); }
      return await createGist();
    }
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: await ghHeaders() });
      if (!res.ok) throw new Error('not found');
      const gist = await res.json();
      const content = gist.files[GIST_FILENAME]?.content;
      if (!content) return defaultData();
      const data = JSON.parse(content);
      // migrate old data
      if (!data.foodLibrary) data.foodLibrary = [];
      if (!data.walks) data.walks = [];
      if (!data.water) data.water = [];
      if (!data.settings.dailyStepsGoal) data.settings.dailyStepsGoal = 8000;
      if (!data.settings.waterGoalGlasses) data.settings.waterGoalGlasses = 8;
      if (!data.settings.targetWeightKg) data.settings.targetWeightKg = null;
      if (data.settings.targetDateISO === undefined) data.settings.targetDateISO = null;
      if (!data.settings.weeklyLossKg) data.settings.weeklyLossKg = 0.5;
      setCache(data);
      return data;
    } catch(e) {
      console.warn('Gist load failed, using cache', e);
      const c = getCache();
      return Object.keys(c).length ? c : defaultData();
    }
  }

  async function saveData(data) {
    const { token, gistId } = getConfig();
    setCache(data);
    if (!token) return;
    const body = { files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } };
    if (!gistId) { await createGist(data); return; }
    try {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH', headers: await ghHeaders(), body: JSON.stringify(body)
      });
    } catch(e) { console.warn('Gist save failed', e); }
  }

  // Look for a gist (under this token's account) that already holds our data file,
  // so a second device using the same token syncs to the existing gist instead of creating a new one
  async function findExistingGist() {
    try {
      const res = await fetch('https://api.github.com/gists?per_page=100', { headers: await ghHeaders() });
      if (!res.ok) return null;
      const gists = await res.json();
      const match = gists.find(g => g.files && g.files[GIST_FILENAME]);
      return match ? match.id : null;
    } catch { return null; }
  }

  async function createGist(initialData) {
    const data = initialData || defaultData();
    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST', headers: await ghHeaders(),
        body: JSON.stringify({
          description: 'VitalGreen Health App Data', public: false,
          files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });
      const gist = await res.json();
      localStorage.setItem('vg_gist_id', gist.id);
      setCache(data);
      return data;
    } catch(e) { console.warn('Gist create failed', e); return data; }
  }

  // ---- Weight ----
  async function addWeight(kg, date) {
    const data = await loadData();
    const entry = { id: Date.now(), kg: parseFloat(kg), date: date || today(), ts: Date.now() };
    data.weights = [entry, ...(data.weights||[])].sort((a,b) => b.ts - a.ts);
    await saveData(data); return entry;
  }
  async function deleteWeight(id) {
    const data = await loadData();
    data.weights = (data.weights||[]).filter(w => w.id !== id);
    await saveData(data);
  }
  async function getWeights() { const d = await loadData(); return d.weights||[]; }

  // ---- Food Log ----
  async function addFood(entry) {
    const data = await loadData();
    const food = { id: Date.now(), ...entry, date: entry.date||today(), ts: Date.now() };
    data.foods = [food, ...(data.foods||[])];
    // Auto-save to food library
    const key = entry.name.trim().toLowerCase();
    const existing = (data.foodLibrary||[]).find(f => f.name.toLowerCase() === key);
    if (!existing) {
      data.foodLibrary = [{ id: Date.now()+1, name: entry.name, portion: entry.portion,
        calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat,
        usageCount: 1, lastUsed: today() }, ...(data.foodLibrary||[])].slice(0,200);
    } else {
      existing.usageCount = (existing.usageCount||0) + 1;
      existing.lastUsed = today();
    }
    await saveData(data); return food;
  }
  async function deleteFood(id) {
    const data = await loadData();
    data.foods = (data.foods||[]).filter(f => f.id !== id);
    await saveData(data);
  }
  async function getFoods(date) {
    const d = await loadData(); const all = d.foods||[];
    return date ? all.filter(f => f.date === date) : all;
  }

  // ---- Food Library ----
  async function getFoodLibrary() { const d = await loadData(); return d.foodLibrary||[]; }
  async function deleteFoodFromLibrary(id) {
    const data = await loadData();
    data.foodLibrary = (data.foodLibrary||[]).filter(f => f.id !== id);
    await saveData(data);
  }

  // ---- Walk Log ----
  async function addWalk(entry) {
    const data = await loadData();
    const walk = { id: Date.now(), ...entry, date: entry.date||today(), ts: Date.now() };
    data.walks = [walk, ...(data.walks||[])];
    await saveData(data); return walk;
  }
  // Set the TOTAL steps for a given day (replaces any existing entry for that date)
  async function setSteps(steps, caloriesBurned, date) {
    const data = await loadData();
    const d = date || today();
    data.walks = (data.walks||[]).filter(w => w.date !== d);
    const walk = { id: Date.now(), steps: parseInt(steps)||0, caloriesBurned: caloriesBurned||0, date: d, ts: Date.now() };
    data.walks = [walk, ...data.walks];
    await saveData(data); return walk;
  }
  async function deleteWalk(id) {
    const data = await loadData();
    data.walks = (data.walks||[]).filter(w => w.id !== id);
    await saveData(data);
  }
  async function getWalks(date) {
    const d = await loadData(); const all = d.walks||[];
    return date ? all.filter(w => w.date === date) : all;
  }

  // ---- Water ----
  // Adjust today's (or given day's) water by +/- glasses; never below 0
  async function addWater(glasses, date) {
    const data = await loadData();
    const d = date || today();
    data.water = data.water || [];
    let entry = data.water.find(w => w.date === d);
    if (!entry) { entry = { id: Date.now(), date: d, glasses: 0, ts: Date.now() }; data.water.unshift(entry); }
    entry.glasses = Math.max(0, (entry.glasses||0) + glasses);
    await saveData(data); return entry;
  }
  async function getWater(date) {
    const d = await loadData(); const all = d.water||[];
    if (!date) return all;
    const e = all.find(w => w.date === date);
    return e ? e.glasses : 0;
  }

  // ---- Settings ----
  async function getSettings() {
    const d = await loadData();
    return { calorieGoal:2000, heightCm:null, targetWeightKg:null, targetDateISO:null, weeklyLossKg:0.5,
      dailyStepsGoal:8000, waterGoalGlasses:8, activityLevel:'moderate', age:null, gender:'male',
      ...d.settings };
  }
  async function saveSettings(patch) {
    const data = await loadData();
    data.settings = { ...data.settings, ...patch };
    await saveData(data);
  }

  function today() { return new Date().toISOString().split('T')[0]; }

  return {
    getConfig, setConfig, isSetup,
    loadData, saveData,
    addWeight, deleteWeight, getWeights,
    addFood, deleteFood, getFoods,
    getFoodLibrary, deleteFoodFromLibrary,
    addWalk, setSteps, deleteWalk, getWalks,
    addWater, getWater,
    getSettings, saveSettings,
    today,
  };
})();
