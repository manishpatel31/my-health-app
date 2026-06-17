// ===== VITALGREEN — LOCAL FOOD NUTRITION DATABASE =====
// Curated, fixed nutrition facts for common foods (Indian-focused + everyday staples).
// Matched locally first so most entries need zero AI tokens and are exact, not guessed.
// calories/protein/carbs/fat are per the listed "portion" (one standard serving/unit).
const FoodDB = (() => {

  const ENTRIES = [
    // --- Breads & grains ---
    { names:['roti','chapati','phulka','fulka'], portion:'1 medium (40g)', calories:120, protein:3, carbs:18, fat:3.7 },
    { names:['naan'], portion:'1 piece (90g)', calories:260, protein:9, carbs:50, fat:3.7 },
    { names:['paratha','plain paratha'], portion:'1 piece (60g)', calories:260, protein:4, carbs:32, fat:13 },
    { names:['aloo paratha'], portion:'1 piece (100g)', calories:290, protein:6, carbs:40, fat:12 },
    { names:['puri'], portion:'1 piece (25g)', calories:100, protein:1.5, carbs:11, fat:5.5 },
    { names:['rice','white rice','steamed rice','cooked rice'], portion:'1 cup (158g)', calories:205, protein:4.3, carbs:45, fat:0.4 },
    { names:['brown rice'], portion:'1 cup (195g)', calories:216, protein:5, carbs:45, fat:1.8 },
    { names:['bread','white bread'], portion:'1 slice (28g)', calories:75, protein:2.6, carbs:14, fat:1 },
    { names:['brown bread','wheat bread'], portion:'1 slice (28g)', calories:70, protein:3, carbs:12, fat:1 },
    { names:['oats','oatmeal'], portion:'1 bowl cooked (150g)', calories:150, protein:5, carbs:27, fat:3 },
    { names:['cornflakes'], portion:'1 bowl with milk (40g cereal)', calories:200, protein:6, carbs:36, fat:4 },
    { names:['pasta'], portion:'1 cup cooked (140g)', calories:220, protein:8, carbs:43, fat:1.3 },
    { names:['noodles','maggi','instant noodles'], portion:'1 packet cooked (70g)', calories:350, protein:7, carbs:48, fat:14 },

    // --- Dals & curries ---
    { names:['dal','toor dal','arhar dal','dal fry'], portion:'1 bowl (150g)', calories:150, protein:9, carbs:24, fat:2 },
    { names:['dal makhani'], portion:'1 bowl (150g)', calories:280, protein:9, carbs:22, fat:18 },
    { names:['rajma','kidney bean curry'], portion:'1 bowl (150g)', calories:210, protein:10, carbs:30, fat:5 },
    { names:['chole','chickpea curry','chana masala'], portion:'1 bowl (150g)', calories:270, protein:11, carbs:35, fat:9 },
    { names:['sambar'], portion:'1 bowl (150g)', calories:100, protein:4, carbs:14, fat:3 },
    { names:['khichdi'], portion:'1 bowl (200g)', calories:250, protein:8, carbs:45, fat:5 },

    // --- Paneer / veg dishes ---
    { names:['paneer'], portion:'100g', calories:265, protein:18, carbs:1.2, fat:21 },
    { names:['paneer butter masala','paneer makhani'], portion:'1 bowl (150g)', calories:320, protein:12, carbs:12, fat:24 },
    { names:['palak paneer'], portion:'1 bowl (150g)', calories:220, protein:11, carbs:8, fat:15 },
    { names:['mixed veg','mixed vegetable curry','sabji','mixed sabji'], portion:'1 bowl (150g)', calories:130, protein:4, carbs:16, fat:6 },
    { names:['aloo sabji','aloo gobi','potato curry'], portion:'1 bowl (150g)', calories:160, protein:3, carbs:20, fat:8 },
    { names:['bhindi','bhindi sabji','okra curry'], portion:'1 bowl (150g)', calories:100, protein:2.5, carbs:10, fat:6 },
    { names:['baingan bharta'], portion:'1 bowl (150g)', calories:150, protein:3, carbs:14, fat:9 },
    { names:['salad','mixed salad','veg salad'], portion:'1 bowl (150g)', calories:50, protein:2, carbs:10, fat:0.3 },
    { names:['sprouts','sprouts salad'], portion:'1 bowl (100g)', calories:100, protein:7, carbs:17, fat:0.8 },
    { names:['boiled chana','boiled chickpeas'], portion:'1 bowl (150g)', calories:220, protein:12, carbs:36, fat:3.6 },
    { names:['boiled potato'], portion:'1 medium (170g)', calories:130, protein:2.7, carbs:30, fat:0.2 },
    { names:['sweet potato','boiled sweet potato'], portion:'1 medium (130g)', calories:115, protein:2, carbs:27, fat:0.1 },

    // --- Eggs, meat, fish ---
    { names:['egg','boiled egg'], portion:'1 large (50g)', calories:78, protein:6.3, carbs:0.6, fat:5.3 },
    { names:['fried egg'], portion:'1 piece', calories:90, protein:6, carbs:0.4, fat:7 },
    { names:['omelette','omelet'], portion:'2 eggs', calories:180, protein:13, carbs:2, fat:14 },
    { names:['egg white','boiled egg white'], portion:'2 whites', calories:35, protein:7, carbs:0.6, fat:0.2 },
    { names:['chicken curry'], portion:'1 bowl (150g)', calories:250, protein:22, carbs:6, fat:16 },
    { names:['butter chicken'], portion:'1 bowl (150g)', calories:320, protein:20, carbs:10, fat:22 },
    { names:['tandoori chicken'], portion:'100g', calories:165, protein:25, carbs:2, fat:6 },
    { names:['chicken breast','grilled chicken breast'], portion:'100g', calories:165, protein:31, carbs:0, fat:3.6 },
    { names:['chicken thigh'], portion:'100g', calories:209, protein:26, carbs:0, fat:11 },
    { names:['chicken biryani'], portion:'1 plate (300g)', calories:450, protein:22, carbs:55, fat:15 },
    { names:['veg biryani'], portion:'1 plate (300g)', calories:380, protein:8, carbs:60, fat:12 },
    { names:['mutton curry'], portion:'1 bowl (150g)', calories:280, protein:20, carbs:6, fat:19 },
    { names:['fish curry'], portion:'1 bowl (150g)', calories:200, protein:20, carbs:6, fat:11 },
    { names:['soya chunks'], portion:'1 bowl cooked (100g)', calories:130, protein:16, carbs:10, fat:1 },
    { names:['tofu'], portion:'100g', calories:76, protein:8, carbs:1.9, fat:4.8 },

    // --- Snacks / street food ---
    { names:['idli'], portion:'1 piece (40g)', calories:39, protein:1.5, carbs:8, fat:0.2 },
    { names:['dosa','plain dosa'], portion:'1 piece (80g)', calories:130, protein:3, carbs:22, fat:3.5 },
    { names:['masala dosa'], portion:'1 piece (150g)', calories:220, protein:4, carbs:35, fat:8 },
    { names:['upma'], portion:'1 bowl (150g)', calories:200, protein:5, carbs:30, fat:7 },
    { names:['poha'], portion:'1 bowl (150g)', calories:180, protein:4, carbs:30, fat:5 },
    { names:['vada','medu vada'], portion:'1 piece (40g)', calories:90, protein:3, carbs:10, fat:4.5 },
    { names:['samosa'], portion:'1 piece (60g)', calories:260, protein:4, carbs:28, fat:15 },
    { names:['pakora','bhajji','bhajiya'], portion:'5 pieces (100g)', calories:280, protein:6, carbs:25, fat:18 },
    { names:['dhokla'], portion:'4 pieces (100g)', calories:160, protein:6, carbs:26, fat:4 },
    { names:['bhel puri'], portion:'1 bowl (100g)', calories:200, protein:4, carbs:30, fat:7 },
    { names:['pani puri','golgappa'], portion:'6 pieces', calories:150, protein:3, carbs:28, fat:3 },
    { names:['pav bhaji'], portion:'1 plate (250g)', calories:400, protein:8, carbs:55, fat:16 },
    { names:['vada pav'], portion:'1 piece (150g)', calories:290, protein:6, carbs:40, fat:12 },
    { names:['momos veg','veg momos'], portion:'6 pieces (150g)', calories:220, protein:6, carbs:35, fat:6 },
    { names:['momos chicken','chicken momos'], portion:'6 pieces (150g)', calories:260, protein:12, carbs:32, fat:9 },
    { names:['pizza','pizza slice'], portion:'1 medium slice (107g)', calories:285, protein:12, carbs:36, fat:10 },
    { names:['burger'], portion:'1 regular', calories:350, protein:17, carbs:35, fat:16 },
    { names:['french fries','fries'], portion:'1 medium serving (117g)', calories:365, protein:4, carbs:48, fat:17 },
    { names:['biscuits','biscuit'], portion:'2 pieces (20g)', calories:90, protein:1.5, carbs:14, fat:3.5 },

    // --- Dairy ---
    { names:['curd','yogurt','dahi'], portion:'1 cup (200g)', calories:120, protein:7, carbs:9, fat:6 },
    { names:['raita'], portion:'1 bowl (100g)', calories:70, protein:3, carbs:6, fat:3.5 },
    { names:['greek yogurt'], portion:'1 cup (200g)', calories:130, protein:22, carbs:8, fat:0.7 },
    { names:['milk','whole milk'], portion:'1 cup (240ml)', calories:150, protein:8, carbs:12, fat:8 },
    { names:['toned milk','low fat milk'], portion:'1 cup (240ml)', calories:110, protein:7.5, carbs:11, fat:4.5 },
    { names:['ghee'], portion:'1 tsp (5g)', calories:45, protein:0, carbs:0, fat:5 },
    { names:['butter'], portion:'1 tsp (5g)', calories:36, protein:0, carbs:0, fat:4 },
    { names:['ice cream'], portion:'1 scoop (65g)', calories:137, protein:2.3, carbs:16, fat:7.3 },

    // --- Fruits ---
    { names:['banana'], portion:'1 medium (118g)', calories:105, protein:1.3, carbs:27, fat:0.4 },
    { names:['apple'], portion:'1 medium (182g)', calories:95, protein:0.5, carbs:25, fat:0.3 },
    { names:['orange'], portion:'1 medium (131g)', calories:62, protein:1.2, carbs:15, fat:0.2 },
    { names:['mango'], portion:'1 medium (200g)', calories:150, protein:1.4, carbs:38, fat:0.6 },
    { names:['papaya'], portion:'1 cup (145g)', calories:55, protein:0.6, carbs:14, fat:0.2 },
    { names:['grapes'], portion:'1 cup (151g)', calories:104, protein:1.1, carbs:27, fat:0.2 },
    { names:['watermelon'], portion:'1 cup (152g)', calories:46, protein:0.9, carbs:11.5, fat:0.2 },

    // --- Nuts, oils, sweeteners, condiments ---
    { names:['peanut butter'], portion:'1 tbsp (16g)', calories:95, protein:4, carbs:3, fat:8 },
    { names:['almonds'], portion:'10 pieces (12g)', calories:70, protein:2.6, carbs:2.5, fat:6 },
    { names:['cashews'], portion:'10 pieces (15g)', calories:85, protein:2.8, carbs:4.5, fat:6.8 },
    { names:['walnuts'], portion:'1 oz (28g)', calories:185, protein:4.3, carbs:3.9, fat:18.5 },
    { names:['cooking oil','oil'], portion:'1 tsp (5g)', calories:40, protein:0, carbs:0, fat:4.5 },
    { names:['sugar'], portion:'1 tsp (4g)', calories:16, protein:0, carbs:4, fat:0 },
    { names:['honey'], portion:'1 tbsp (21g)', calories:64, protein:0.1, carbs:17, fat:0 },
    { names:['jaggery','gur'], portion:'1 tbsp (20g)', calories:76, protein:0, carbs:19.6, fat:0 },
    { names:['pickle','achar'], portion:'1 tbsp', calories:35, protein:0.2, carbs:2, fat:3 },
    { names:['chutney','green chutney'], portion:'2 tbsp', calories:20, protein:0.5, carbs:3, fat:0.5 },

    // --- Drinks ---
    { names:['tea','chai'], portion:'1 cup (150ml)', calories:60, protein:1.5, carbs:9, fat:2 },
    { names:['coffee'], portion:'1 cup (150ml)', calories:65, protein:1.5, carbs:10, fat:2 },
    { names:['orange juice'], portion:'1 cup (240ml)', calories:110, protein:1.7, carbs:26, fat:0.5 },
    { names:['coke','soda','cold drink'], portion:'1 can (330ml)', calories:140, protein:0, carbs:39, fat:0 },
    { names:['protein shake'], portion:'1 scoop with water', calories:120, protein:24, carbs:3, fat:1.5 },
    { names:['chocolate','chocolate bar'], portion:'1 standard bar (40g)', calories:210, protein:3, carbs:24, fat:12 },
  ];

  function normalize(s) {
    return (s || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  }
  function singularize(w) { return (w.endsWith('s') && w.length > 3) ? w.slice(0, -1) : w; }

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

  return { find };
})();
