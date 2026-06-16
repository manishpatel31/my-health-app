// ===== VITALGREEN — GITHUB GIST STORAGE =====
// All data is stored in a private GitHub Gist as JSON

const GIST_FILENAME = 'vitalgreen-data.json';

const Storage = (() => {

  // ---- Config ----
  function getConfig() {
    return {
      token:    localStorage.getItem('vg_gh_token'),
      gistId:   localStorage.getItem('vg_gist_id'),
      userName: localStorage.getItem('vg_user_name'),
      groqKey:  localStorage.getItem('vg_groq_key'),
      height:   parseFloat(localStorage.getItem('vg_height')) || null,
    };
  }

  function setConfig(obj) {
    if (obj.token)    localStorage.setItem('vg_gh_token',   obj.token);
    if (obj.gistId)   localStorage.setItem('vg_gist_id',    obj.gistId);
    if (obj.userName) localStorage.setItem('vg_user_name',  obj.userName);
    if (obj.groqKey)  localStorage.setItem('vg_groq_key',   obj.groqKey);
    if (obj.height)   localStorage.setItem('vg_height',     obj.height);
  }

  function isSetup() {
    const c = getConfig();
    return !!(c.token && c.userName && c.groqKey);
  }

  // ---- Local Cache ----
  function getCache() {
    try {
      return JSON.parse(localStorage.getItem('vg_cache') || '{}');
    } catch { return {}; }
  }

  function setCache(data) {
    localStorage.setItem('vg_cache', JSON.stringify(data));
  }

  // Default data structure
  function defaultData() {
    return { weights: [], foods: [], settings: { calorieGoal: 2000, heightCm: null } };
  }

  // ---- Gist API ----
  async function headers() {
    const { token } = getConfig();
    return {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    };
  }

  async function loadData() {
    const { token, gistId } = getConfig();
    if (!token) return defaultData();

    // If no gistId, create gist
    if (!gistId) {
      return await createGist();
    }

    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: await headers(),
      });
      if (!res.ok) throw new Error('Gist not found');
      const gist = await res.json();
      const content = gist.files[GIST_FILENAME]?.content;
      if (!content) return defaultData();
      const data = JSON.parse(content);
      setCache(data);
      return data;
    } catch (e) {
      console.warn('Gist load failed, using cache:', e);
      const cached = getCache();
      return Object.keys(cached).length ? cached : defaultData();
    }
  }

  async function saveData(data) {
    const { token, gistId } = getConfig();
    if (!token) { setCache(data); return; }

    setCache(data); // Optimistic local save

    const body = {
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) }
      }
    };

    if (!gistId) {
      await createGist(data);
      return;
    }

    try {
      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: await headers(),
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.warn('Gist save failed:', e);
    }
  }

  async function createGist(initialData) {
    const data = initialData || defaultData();
    const { token } = getConfig();
    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: await headers(),
        body: JSON.stringify({
          description: 'VitalGreen Health App Data',
          public: false,
          files: {
            [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) }
          }
        }),
      });
      const gist = await res.json();
      localStorage.setItem('vg_gist_id', gist.id);
      setCache(data);
      return data;
    } catch (e) {
      console.warn('Gist create failed:', e);
      return data;
    }
  }

  // ---- Weight Methods ----
  async function addWeight(kg, date) {
    const data = await loadData();
    const entry = { id: Date.now(), kg: parseFloat(kg), date: date || today(), ts: Date.now() };
    data.weights = [entry, ...(data.weights || [])].sort((a, b) => b.ts - a.ts);
    await saveData(data);
    return entry;
  }

  async function deleteWeight(id) {
    const data = await loadData();
    data.weights = (data.weights || []).filter(w => w.id !== id);
    await saveData(data);
  }

  async function getWeights() {
    const data = await loadData();
    return data.weights || [];
  }

  // ---- Food Methods ----
  async function addFood(entry) {
    const data = await loadData();
    const food = { id: Date.now(), ...entry, date: entry.date || today(), ts: Date.now() };
    data.foods = [food, ...(data.foods || [])];
    await saveData(data);
    return food;
  }

  async function deleteFood(id) {
    const data = await loadData();
    data.foods = (data.foods || []).filter(f => f.id !== id);
    await saveData(data);
  }

  async function getFoods(date) {
    const data = await loadData();
    const all = data.foods || [];
    return date ? all.filter(f => f.date === date) : all;
  }

  // ---- Settings ----
  async function getSettings() {
    const data = await loadData();
    return data.settings || { calorieGoal: 2000, heightCm: null };
  }

  async function saveSettings(settings) {
    const data = await loadData();
    data.settings = { ...data.settings, ...settings };
    await saveData(data);
  }

  // ---- Helpers ----
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  return {
    getConfig, setConfig, isSetup,
    loadData, saveData,
    addWeight, deleteWeight, getWeights,
    addFood, deleteFood, getFoods,
    getSettings, saveSettings,
    today,
  };
})();
