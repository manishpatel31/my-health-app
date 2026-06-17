// ===== VITALGREEN — LOCAL FOOD NUTRITION DATABASE =====
// Curated, fixed nutrition facts for common foods (Indian-focused + Bihari/regional + everyday staples).
// Matched locally first so most entries need zero AI tokens and are exact, not guessed.
// calories/protein/carbs/fat are per the listed "portion" (one standard serving/unit).
const FoodDB = (() => {

  const CATEGORIES = ['breakfast', 'lunch_dinner', 'snack', 'drink', 'other'];
  const CATEGORY_LABELS = {
    breakfast: '🌅 Breakfast', lunch_dinner: '🍛 Lunch / Dinner',
    snack: '🍪 Snacks & Sweets', drink: '🥤 Drinks', other: '🧂 Condiments & Extras',
  };

  const ENTRIES = [
    // --- Breakfast ---
    { names:['idli'], cat:'breakfast', portion:'1 piece (40g)', calories:39, protein:1.5, carbs:8, fat:0.2 },
    { names:['dosa','plain dosa'], cat:'breakfast', portion:'1 piece (80g)', calories:130, protein:3, carbs:22, fat:3.5 },
    { names:['masala dosa'], cat:'breakfast', portion:'1 piece (150g)', calories:220, protein:4, carbs:35, fat:8 },
    { names:['upma'], cat:'breakfast', portion:'1 bowl (150g)', calories:200, protein:5, carbs:30, fat:7 },
    { names:['poha'], cat:'breakfast', portion:'1 bowl (150g)', calories:180, protein:4, carbs:30, fat:5 },
    { names:['paratha','plain paratha'], cat:'breakfast', portion:'1 piece (60g)', calories:260, protein:4, carbs:32, fat:13 },
    { names:['aloo paratha'], cat:'breakfast', portion:'1 piece (100g)', calories:290, protein:6, carbs:40, fat:12 },
    { names:['puri'], cat:'breakfast', portion:'1 piece (25g)', calories:100, protein:1.5, carbs:11, fat:5.5 },
    { names:['oats','oatmeal'], cat:'breakfast', portion:'1 bowl cooked (150g)', calories:150, protein:5, carbs:27, fat:3 },
    { names:['cornflakes'], cat:'breakfast', portion:'1 bowl with milk (40g cereal)', calories:200, protein:6, carbs:36, fat:4 },
    { names:['bread','white bread'], cat:'breakfast', portion:'1 slice (28g)', calories:75, protein:2.6, carbs:14, fat:1 },
    { names:['brown bread','wheat bread'], cat:'breakfast', portion:'1 slice (28g)', calories:70, protein:3, carbs:12, fat:1 },
    { names:['egg','boiled egg'], cat:'breakfast', portion:'1 large (50g)', calories:78, protein:6.3, carbs:0.6, fat:5.3 },
    { names:['fried egg'], cat:'breakfast', portion:'1 piece', calories:90, protein:6, carbs:0.4, fat:7 },
    { names:['omelette','omelet'], cat:'breakfast', portion:'2 eggs', calories:180, protein:13, carbs:2, fat:14 },
    { names:['egg white','boiled egg white'], cat:'breakfast', portion:'2 whites', calories:35, protein:7, carbs:0.6, fat:0.2 },
    // Bihari / regional breakfast
    { names:['sattu paratha'], cat:'breakfast', portion:'1 piece (90g)', calories:220, protein:6, carbs:28, fat:9 },
    { names:['dahi chura','curd chura','poha with curd'], cat:'breakfast', portion:'1 bowl (200g)', calories:250, protein:8, carbs:40, fat:6 },
    { names:['chura matar','flattened rice with peas'], cat:'breakfast', portion:'1 bowl (150g)', calories:220, protein:6, carbs:36, fat:6 },

    // --- Lunch / Dinner ---
    { names:['roti','chapati','phulka','fulka'], cat:'lunch_dinner', portion:'1 medium (40g)', calories:120, protein:3, carbs:18, fat:3.7 },
    { names:['naan'], cat:'lunch_dinner', portion:'1 piece (90g)', calories:260, protein:9, carbs:50, fat:3.7 },
    { names:['rice','white rice','steamed rice','cooked rice'], cat:'lunch_dinner', portion:'1 cup (158g)', calories:205, protein:4.3, carbs:45, fat:0.4 },
    { names:['brown rice'], cat:'lunch_dinner', portion:'1 cup (195g)', calories:216, protein:5, carbs:45, fat:1.8 },
    { names:['pasta'], cat:'lunch_dinner', portion:'1 cup cooked (140g)', calories:220, protein:8, carbs:43, fat:1.3 },
    { names:['noodles','maggi','instant noodles'], cat:'lunch_dinner', portion:'1 packet cooked (70g)', calories:350, protein:7, carbs:48, fat:14 },
    { names:['dal','toor dal','arhar dal','dal fry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:150, protein:9, carbs:24, fat:2 },
    { names:['dal makhani'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:280, protein:9, carbs:22, fat:18 },
    { names:['rajma','kidney bean curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:210, protein:10, carbs:30, fat:5 },
    { names:['chole','chickpea curry','chana masala'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:270, protein:11, carbs:35, fat:9 },
    { names:['sambar'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:100, protein:4, carbs:14, fat:3 },
    { names:['khichdi'], cat:'lunch_dinner', portion:'1 bowl (200g)', calories:250, protein:8, carbs:45, fat:5 },
    { names:['paneer'], cat:'lunch_dinner', portion:'100g', calories:265, protein:18, carbs:1.2, fat:21 },
    { names:['paneer butter masala','paneer makhani'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:320, protein:12, carbs:12, fat:24 },
    { names:['palak paneer'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:220, protein:11, carbs:8, fat:15 },
    { names:['mixed veg','mixed vegetable curry','sabji','mixed sabji'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:130, protein:4, carbs:16, fat:6 },
    { names:['aloo sabji','aloo gobi','potato curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:160, protein:3, carbs:20, fat:8 },
    { names:['bhindi','bhindi sabji','okra curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:100, protein:2.5, carbs:10, fat:6 },
    { names:['baingan bharta'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:150, protein:3, carbs:14, fat:9 },
    { names:['salad','mixed salad','veg salad'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:50, protein:2, carbs:10, fat:0.3 },
    { names:['sprouts','sprouts salad'], cat:'lunch_dinner', portion:'1 bowl (100g)', calories:100, protein:7, carbs:17, fat:0.8 },
    { names:['boiled chana','boiled chickpeas'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:220, protein:12, carbs:36, fat:3.6 },
    { names:['boiled potato'], cat:'lunch_dinner', portion:'1 medium (170g)', calories:130, protein:2.7, carbs:30, fat:0.2 },
    { names:['sweet potato','boiled sweet potato'], cat:'lunch_dinner', portion:'1 medium (130g)', calories:115, protein:2, carbs:27, fat:0.1 },
    { names:['chicken curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:250, protein:22, carbs:6, fat:16 },
    { names:['butter chicken'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:320, protein:20, carbs:10, fat:22 },
    { names:['tandoori chicken'], cat:'lunch_dinner', portion:'100g', calories:165, protein:25, carbs:2, fat:6 },
    { names:['chicken breast','grilled chicken breast'], cat:'lunch_dinner', portion:'100g', calories:165, protein:31, carbs:0, fat:3.6 },
    { names:['chicken thigh'], cat:'lunch_dinner', portion:'100g', calories:209, protein:26, carbs:0, fat:11 },
    { names:['chicken biryani'], cat:'lunch_dinner', portion:'1 plate (300g)', calories:450, protein:22, carbs:55, fat:15 },
    { names:['veg biryani'], cat:'lunch_dinner', portion:'1 plate (300g)', calories:380, protein:8, carbs:60, fat:12 },
    { names:['mutton curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:280, protein:20, carbs:6, fat:19 },
    { names:['fish curry'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:200, protein:20, carbs:6, fat:11 },
    { names:['soya chunks'], cat:'lunch_dinner', portion:'1 bowl cooked (100g)', calories:130, protein:16, carbs:10, fat:1 },
    { names:['tofu'], cat:'lunch_dinner', portion:'100g', calories:76, protein:8, carbs:1.9, fat:4.8 },
    // Bihari / regional mains
    { names:['litti chokha','litti'], cat:'lunch_dinner', portion:'2 littis with chokha (250g)', calories:380, protein:10, carbs:55, fat:14 },
    { names:['chana ghugni','ghugni'], cat:'lunch_dinner', portion:'1 bowl (150g)', calories:180, protein:9, carbs:25, fat:5 },
    { names:['dal pitha','pitha'], cat:'lunch_dinner', portion:'4 pieces (150g)', calories:220, protein:7, carbs:38, fat:4 },

    // --- Snacks & sweets ---
    { names:['vada','medu vada'], cat:'snack', portion:'1 piece (40g)', calories:90, protein:3, carbs:10, fat:4.5 },
    { names:['samosa'], cat:'snack', portion:'1 piece (60g)', calories:260, protein:4, carbs:28, fat:15 },
    { names:['pakora','bhajji','bhajiya'], cat:'snack', portion:'5 pieces (100g)', calories:280, protein:6, carbs:25, fat:18 },
    { names:['dhokla'], cat:'snack', portion:'4 pieces (100g)', calories:160, protein:6, carbs:26, fat:4 },
    { names:['bhel puri'], cat:'snack', portion:'1 bowl (100g)', calories:200, protein:4, carbs:30, fat:7 },
    { names:['pani puri','golgappa'], cat:'snack', portion:'6 pieces', calories:150, protein:3, carbs:28, fat:3 },
    { names:['pav bhaji'], cat:'snack', portion:'1 plate (250g)', calories:400, protein:8, carbs:55, fat:16 },
    { names:['vada pav'], cat:'snack', portion:'1 piece (150g)', calories:290, protein:6, carbs:40, fat:12 },
    { names:['momos veg','veg momos'], cat:'snack', portion:'6 pieces (150g)', calories:220, protein:6, carbs:35, fat:6 },
    { names:['momos chicken','chicken momos'], cat:'snack', portion:'6 pieces (150g)', calories:260, protein:12, carbs:32, fat:9 },
    { names:['pizza','pizza slice'], cat:'snack', portion:'1 medium slice (107g)', calories:285, protein:12, carbs:36, fat:10 },
    { names:['burger'], cat:'snack', portion:'1 regular', calories:350, protein:17, carbs:35, fat:16 },
    { names:['french fries','fries'], cat:'snack', portion:'1 medium serving (117g)', calories:365, protein:4, carbs:48, fat:17 },
    { names:['biscuits','biscuit'], cat:'snack', portion:'2 pieces (20g)', calories:90, protein:1.5, carbs:14, fat:3.5 },
    { names:['ice cream'], cat:'snack', portion:'1 scoop (65g)', calories:137, protein:2.3, carbs:16, fat:7.3 },
    { names:['chocolate','chocolate bar'], cat:'snack', portion:'1 standard bar (40g)', calories:210, protein:3, carbs:24, fat:12 },
    { names:['peanut butter'], cat:'snack', portion:'1 tbsp (16g)', calories:95, protein:4, carbs:3, fat:8 },
    { names:['almonds'], cat:'snack', portion:'10 pieces (12g)', calories:70, protein:2.6, carbs:2.5, fat:6 },
    { names:['cashews'], cat:'snack', portion:'10 pieces (15g)', calories:85, protein:2.8, carbs:4.5, fat:6.8 },
    { names:['walnuts'], cat:'snack', portion:'1 oz (28g)', calories:185, protein:4.3, carbs:3.9, fat:18.5 },
    // Bihari / regional snacks & sweets
    { names:['khaja'], cat:'snack', portion:'2 pieces (50g)', calories:230, protein:2, carbs:28, fat:12 },
    { names:['thekua'], cat:'snack', portion:'2 pieces (50g)', calories:220, protein:3, carbs:30, fat:10 },
    { names:['anarsa'], cat:'snack', portion:'2 pieces (50g)', calories:210, protein:2, carbs:32, fat:8 },
    { names:['malpua'], cat:'snack', portion:'2 pieces (80g)', calories:280, protein:4, carbs:40, fat:11 },
    { names:['makhana','roasted fox nuts','phool makhana'], cat:'snack', portion:'1 cup roasted (30g)', calories:110, protein:3, carbs:20, fat:1 },

    // --- Drinks ---
    { names:['curd','yogurt','dahi'], cat:'drink', portion:'1 cup (200g)', calories:120, protein:7, carbs:9, fat:6 },
    { names:['raita'], cat:'drink', portion:'1 bowl (100g)', calories:70, protein:3, carbs:6, fat:3.5 },
    { names:['greek yogurt'], cat:'drink', portion:'1 cup (200g)', calories:130, protein:22, carbs:8, fat:0.7 },
    { names:['milk','whole milk'], cat:'drink', portion:'1 cup (240ml)', calories:150, protein:8, carbs:12, fat:8 },
    { names:['toned milk','low fat milk'], cat:'drink', portion:'1 cup (240ml)', calories:110, protein:7.5, carbs:11, fat:4.5 },
    { names:['tea','chai'], cat:'drink', portion:'1 cup (150ml)', calories:60, protein:1.5, carbs:9, fat:2 },
    { names:['coffee'], cat:'drink', portion:'1 cup (150ml)', calories:65, protein:1.5, carbs:10, fat:2 },
    { names:['orange juice'], cat:'drink', portion:'1 cup (240ml)', calories:110, protein:1.7, carbs:26, fat:0.5 },
    { names:['coke','soda','cold drink'], cat:'drink', portion:'1 can (330ml)', calories:140, protein:0, carbs:39, fat:0 },
    { names:['protein shake'], cat:'drink', portion:'1 scoop with water', calories:120, protein:24, carbs:3, fat:1.5 },
    // Bihari / regional drinks
    { names:['sattu sharbat','sattu drink'], cat:'drink', portion:'1 glass (250ml)', calories:140, protein:6, carbs:24, fat:2 },

    // --- Fruits (filed under snack for browsing) ---
    { names:['banana'], cat:'snack', portion:'1 medium (118g)', calories:105, protein:1.3, carbs:27, fat:0.4 },
    { names:['apple'], cat:'snack', portion:'1 medium (182g)', calories:95, protein:0.5, carbs:25, fat:0.3 },
    { names:['orange'], cat:'snack', portion:'1 medium (131g)', calories:62, protein:1.2, carbs:15, fat:0.2 },
    { names:['mango'], cat:'snack', portion:'1 medium (200g)', calories:150, protein:1.4, carbs:38, fat:0.6 },
    { names:['papaya'], cat:'snack', portion:'1 cup (145g)', calories:55, protein:0.6, carbs:14, fat:0.2 },
    { names:['grapes'], cat:'snack', portion:'1 cup (151g)', calories:104, protein:1.1, carbs:27, fat:0.2 },
    { names:['watermelon'], cat:'snack', portion:'1 cup (152g)', calories:46, protein:0.9, carbs:11.5, fat:0.2 },

    // --- Condiments & extras ---
    { names:['cooking oil','oil'], cat:'other', portion:'1 tsp (5g)', calories:40, protein:0, carbs:0, fat:4.5 },
    { names:['ghee'], cat:'other', portion:'1 tsp (5g)', calories:45, protein:0, carbs:0, fat:5 },
    { names:['butter'], cat:'other', portion:'1 tsp (5g)', calories:36, protein:0, carbs:0, fat:4 },
    { names:['sugar'], cat:'other', portion:'1 tsp (4g)', calories:16, protein:0, carbs:4, fat:0 },
    { names:['honey'], cat:'other', portion:'1 tbsp (21g)', calories:64, protein:0.1, carbs:17, fat:0 },
    { names:['jaggery','gur'], cat:'other', portion:'1 tbsp (20g)', calories:76, protein:0, carbs:19.6, fat:0 },
    { names:['pickle','achar'], cat:'other', portion:'1 tbsp', calories:35, protein:0.2, carbs:2, fat:3 },
    { names:['chutney','green chutney'], cat:'other', portion:'2 tbsp', calories:20, protein:0.5, carbs:3, fat:0.5 },
  ];

  function normalize(s) {
    return (s || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  }
  function singularize(w) { return (w.endsWith('s') && w.length > 3) ? w.slice(0, -1) : w; }
  function titleCase(s) { return s.replace(/\b\w/g, c => c.toUpperCase()); }

  const index = new Map();
  ENTRIES.forEach(entry => entry.names.forEach(n => index.set(normalize(n), entry)));

  // Exact/alias match first; falls back to token-overlap fuzzy match (e.g. "plain dosa with sambar"
  // still hits "dosa") so close-enough phrasing doesn't fall through to the AI unnecessarily.
  function find(query) {
    // strip a leading quantity the user may have typed into the name itself (e.g. "2 rotis")
    const q = normalize(query).replace(/^\d+(\.\d+)?\s+/, '');
    if (!q) return null;
    if (index.has(q)) return index.get(q);
    const qs = q.split(' ').map(singularize).join(' ');
    if (index.has(qs)) return index.get(qs);

    const qTokens = new Set(qs.split(' '));
    let best = null, bestScore = 0;
    for (const [name, entry] of index) {
      const nTokens = name.split(' ').map(singularize);
      const overlap = nTokens.filter(t => qTokens.has(t)).length;
      const score = overlap / Math.max(nTokens.length, qTokens.size);
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    return bestScore >= 0.6 ? best : null;
  }

  // Flat list for the dish-picker UI: one row per entry, with a display label
  // (Title Case of the canonical/first name) and its category.
  function list() {
    return ENTRIES.map(e => ({ label: titleCase(e.names[0]), cat: e.cat, entry: e }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return { find, list, categories: CATEGORIES, categoryLabels: CATEGORY_LABELS };
})();
