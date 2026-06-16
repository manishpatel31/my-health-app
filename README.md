# 🌿 VitalGreen — Personal Health Tracker

A beautiful, mobile-friendly health tracking web app that runs entirely in your browser and syncs data across devices using **GitHub Gists** as a free database.

## ✨ Features

- **Weight Logging & BMI** — Log daily weights, see trends on a chart, and get BMI status
- **AI Calorie Counter** — Type any food + portion in plain English, Groq AI instantly calculates calories, protein, carbs & fat
- **AI Health Coach** — Chat with an AI coach that knows your actual health data (powered by Groq + Llama 3)
- **Cross-device sync** — Your data lives in a private GitHub Gist, synced everywhere for free
- **Mobile-first design** — Works great on phones with bottom navigation

---

## 🚀 Deploy to GitHub Pages (5 minutes)

### Step 1 — Fork / Upload this repo
1. Create a new GitHub repository (e.g. `my-health-app`)
2. Upload all these files keeping the folder structure intact
3. Go to **Settings → Pages**
4. Set source to **"Deploy from a branch"** → `main` → `/ (root)`
5. Click **Save** — your site will be live at `https://yourusername.github.io/my-health-app`

### Step 2 — Get your API keys

**Groq API Key (free):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in
3. Create an API key
4. Copy it (starts with `gsk_...`)

**GitHub Personal Access Token (for Gist storage):**
1. Go to GitHub → Settings → Developer Settings
2. Personal Access Tokens → Tokens (classic)
3. Click "Generate new token (classic)"
4. Give it a name like "VitalGreen App"
5. Tick only the **`gist`** scope
6. Click Generate and copy the token (starts with `ghp_...`)

### Step 3 — Open your app and set up
1. Visit your GitHub Pages URL
2. Fill in the setup form with your name, GitHub token, and Groq key
3. Click **Get Started** — your private Gist is created automatically!

---

## 📁 File Structure

```
/
├── index.html          # Dashboard
├── css/
│   └── style.css       # All styles
├── js/
│   ├── storage.js      # GitHub Gist data layer
│   └── app.js          # Shared utilities & Groq API
└── pages/
    ├── weight.html     # Weight logging & BMI
    ├── calories.html   # AI calorie counter
    └── coach.html      # AI health coach chat
```

---

## 🔒 Privacy

- Your API keys are stored only in your browser's `localStorage`
- Your health data is stored in a **private** GitHub Gist (only you can see it)
- No third-party analytics or tracking
- No server — this is a 100% static site

---

## 🛠️ Customization

Edit `js/storage.js` to change:
- Default calorie goal (line: `calorieGoal: 2000`)

Edit `css/style.css` to change colors — the `--green-*` CSS variables control the entire theme.

---

## 💡 Tips

- On mobile, tap "Add to Home Screen" in your browser to install it like an app
- The AI calorie counter works best with specific descriptions: *"2 rotis with 1 bowl rajma"* vs just *"lunch"*
- The AI Coach reads your real data — the more you log, the better advice it gives
