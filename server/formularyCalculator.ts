/**
 * Formulary Drug Cost Calculator — 2026 Medicare Part D Model
 *
 * Calculates estimated annual drug costs for a member's drug list against
 * each plan's UNIQUE formulary tier structure.
 *
 * 2026 Part D has THREE phases (donut hole eliminated in 2025):
 *  1. Deductible phase: Member pays 100% until plan drug deductible is met
 *     - Max deductible is $615 for 2026, but many plans have $0
 *     - Tier 1 generics are often exempt from deductible
 *  2. Initial coverage phase: Member pays tier copay/coinsurance
 *     - Continues until member OOP spending reaches $2,100
 *  3. Catastrophic phase: Member pays $0 for rest of year
 *     - Once $2,100 OOP is reached, plan covers 100%
 *
 * Key: Each plan has DIFFERENT tier copays, deductibles, and gap coverage
 * which produces DIFFERENT estimated costs per plan.
 */

// — Drug classification database ——————————————————————————————————
interface DrugProfile {
  tier: 1 | 2 | 3 | 4;
  avgMonthlyCost: number;
  isGeneric: boolean;
}

const DRUG_DATABASE: Record<string, DrugProfile> = {
  // ============================================================
  // TIER 1: Generics ($5-30/month retail)
  // ============================================================

  // --- Cardiovascular / Blood Pressure ---
  "lisinopril":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "losartan":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "amlodipine":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "metoprolol":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "carvedilol":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "hydrochlorothiazide":   { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "furosemide":            { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "spironolactone":        { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "valsartan":             { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "irbesartan":            { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "ramipril":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "enalapril":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "benazepril":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "diltiazem":             { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "verapamil":             { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "nifedipine":            { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "atenolol":              { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "propranolol":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "bisoprolol":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "nebivolol":             { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "hydralazine":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "clonidine":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "doxazosin":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "terazosin":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "prazosin":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "triamterene":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "chlorthalidone":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "bumetanide":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "torsemide":             { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "olmesartan":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "telmisartan":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "candesartan":           { tier: 1, avgMonthlyCost: 15, isGeneric: true },

  // --- Cholesterol / Statins ---
  "atorvastatin":          { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "simvastatin":           { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "rosuvastatin":          { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "pravastatin":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "lovastatin":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "fluvastatin":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "ezetimibe":             { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "fenofibrate":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "gemfibrozil":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "cholestyramine":        { tier: 1, avgMonthlyCost: 18, isGeneric: true },

  // --- Blood Thinners ---
  "warfarin":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "clopidogrel":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "aspirin":               { tier: 1, avgMonthlyCost: 5, isGeneric: true },
  "dipyridamole":          { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "enoxaparin":            { tier: 1, avgMonthlyCost: 25, isGeneric: true },

  // --- Diabetes ---
  "metformin":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "glipizide":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "glyburide":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "glimepiride":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "pioglitazone":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "acarbose":              { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "nateglinide":           { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "repaglinide":           { tier: 1, avgMonthlyCost: 20, isGeneric: true },

  // --- Thyroid ---
  "levothyroxine":         { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "methimazole":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "propylthiouracil":      { tier: 1, avgMonthlyCost: 15, isGeneric: true },

  // --- GI / Acid Reflux ---
  "omeprazole":            { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "pantoprazole":          { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "lansoprazole":          { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "esomeprazole":          { tier: 1, avgMonthlyCost: 16, isGeneric: true },
  "ranitidine":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "famotidine":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "sucralfate":            { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "misoprostol":           { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "dicyclomine":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "ondansetron":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "metoclopramide":        { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "lactulose":             { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "polyethylene glycol":   { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "docusate":              { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "bisacodyl":             { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "loperamide":            { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "sulfasalazine":         { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "mesalamine":            { tier: 1, avgMonthlyCost: 25, isGeneric: true },

  // --- Pain / Anti-inflammatory ---
  "meloxicam":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "ibuprofen":             { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "naproxen":              { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "diclofenac":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "indomethacin":          { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "celecoxib":             { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "acetaminophen":         { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "tramadol":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "gabapentin":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "pregabalin":            { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "cyclobenzaprine":       { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "baclofen":              { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "tizanidine":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "lidocaine":             { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "capsaicin":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "colchicine":            { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  "allopurinol":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "febuxostat":            { tier: 1, avgMonthlyCost: 18, isGeneric: true },

  // --- Mental Health / Antidepressants / Anxiety ---
  "sertraline":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "fluoxetine":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "escitalopram":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "citalopram":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "paroxetine":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "venlafaxine":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "duloxetine":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "bupropion":             { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "mirtazapine":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "trazodone":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "amitriptyline":         { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "nortriptyline":         { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "doxepin":               { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "buspirone":             { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "hydroxyzine":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "lorazepam":             { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "alprazolam":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "diazepam":              { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "clonazepam":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "quetiapine":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "olanzapine":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "risperidone":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "aripiprazole":          { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "haloperidol":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "lithium":               { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "valproic acid":         { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "lamotrigine":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "carbamazepine":         { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "topiramate":            { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "levetiracetam":         { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "phenytoin":             { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "zolpidem":              { tier: 1, avgMonthlyCost: 10, isGeneric: true },

  // --- Respiratory ---
  "albuterol":             { tier: 1, avgMonthlyCost: 25, isGeneric: true },
  "ipratropium":           { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  "fluticasone":           { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "budesonide":            { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  "montelukast":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "theophylline":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "tiotropium":            { tier: 1, avgMonthlyCost: 25, isGeneric: true },
  "benzonatate":           { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "guaifenesin":           { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "cetirizine":            { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "loratadine":            { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "fexofenadine":          { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "diphenhydramine":       { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "promethazine":          { tier: 1, avgMonthlyCost: 10, isGeneric: true },

  // --- Antibiotics ---
  "amoxicillin":           { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "azithromycin":          { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "ciprofloxacin":         { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "levofloxacin":          { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "doxycycline":           { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "metronidazole":         { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "sulfamethoxazole":      { tier: 1, avgMonthlyCost: 8, isGeneric: true },
  "cephalexin":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "clindamycin":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "nitrofurantoin":        { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "fluconazole":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },

  // --- Eye ---
  "latanoprost":           { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "timolol":               { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "brimonidine":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "dorzolamide":           { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "artificial tears":      { tier: 1, avgMonthlyCost: 8, isGeneric: true },

  // --- Urinary / Prostate ---
  "tamsulosin":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "finasteride":           { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "dutasteride":           { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "oxybutynin":            { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "tolterodine":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "solifenacin":           { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "sildenafil":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "tadalafil":             { tier: 1, avgMonthlyCost: 18, isGeneric: true },

  // --- Dementia / Alzheimer's ---
  "donepezil":             { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "memantine":             { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  "rivastigmine":          { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "galantamine":           { tier: 1, avgMonthlyCost: 20, isGeneric: true },

  // --- Steroids / Hormones / Other ---
  "prednisone":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "prednisolone":          { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "methylprednisolone":    { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "dexamethasone":         { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "testosterone":          { tier: 1, avgMonthlyCost: 25, isGeneric: true },
  "estradiol":             { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "progesterone":          { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "alendronate":           { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "risedronate":           { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "methotrexate":          { tier: 1, avgMonthlyCost: 20, isGeneric: true },
  "hydroxychloroquine":    { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "isosorbide":            { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "nitroglycerin":         { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "digoxin":               { tier: 1, avgMonthlyCost: 12, isGeneric: true },
  "amiodarone":            { tier: 1, avgMonthlyCost: 15, isGeneric: true },
  "flecainide":            { tier: 1, avgMonthlyCost: 18, isGeneric: true },
  "sotalol":               { tier: 1, avgMonthlyCost: 14, isGeneric: true },
  "potassium chloride":    { tier: 1, avgMonthlyCost: 10, isGeneric: true },
  "ferrous sulfate":       { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "vitamin d":             { tier: 1, avgMonthlyCost: 6, isGeneric: true },
  "folic acid":            { tier: 1, avgMonthlyCost: 5, isGeneric: true },
  "cyanocobalamin":        { tier: 1, avgMonthlyCost: 8, isGeneric: true },

  // ============================================================
  // TIER 2: Preferred Brand ($100-500/month retail)
  // ============================================================

  // --- Blood Thinners (Brand) ---
  "eliquis":               { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "xarelto":               { tier: 2, avgMonthlyCost: 290, isGeneric: false },
  "pradaxa":               { tier: 2, avgMonthlyCost: 260, isGeneric: false },
  "savaysa":               { tier: 2, avgMonthlyCost: 250, isGeneric: false },
  "brilinta":              { tier: 2, avgMonthlyCost: 240, isGeneric: false },

  // --- Diabetes (Brand) ---
  "jardiance":             { tier: 2, avgMonthlyCost: 340, isGeneric: false },
  "farxiga":               { tier: 2, avgMonthlyCost: 320, isGeneric: false },
  "invokana":              { tier: 2, avgMonthlyCost: 310, isGeneric: false },
  "januvia":               { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "tradjenta":             { tier: 2, avgMonthlyCost: 270, isGeneric: false },
  "onglyza":               { tier: 2, avgMonthlyCost: 250, isGeneric: false },
  "ozempic":               { tier: 2, avgMonthlyCost: 450, isGeneric: false },
  "rybelsus":              { tier: 2, avgMonthlyCost: 420, isGeneric: false },
  "trulicity":             { tier: 2, avgMonthlyCost: 400, isGeneric: false },
  "victoza":               { tier: 2, avgMonthlyCost: 380, isGeneric: false },
  "mounjaro":              { tier: 2, avgMonthlyCost: 500, isGeneric: false },
  "byetta":                { tier: 2, avgMonthlyCost: 350, isGeneric: false },
  "bydureon":              { tier: 2, avgMonthlyCost: 380, isGeneric: false },

  // --- Insulin ---
  "lantus":                { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "levemir":               { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "tresiba":               { tier: 2, avgMonthlyCost: 200, isGeneric: false },
  "toujeo":                { tier: 2, avgMonthlyCost: 190, isGeneric: false },
  "basaglar":              { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "humalog":               { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "novolog":               { tier: 2, avgMonthlyCost: 170, isGeneric: false },
  "admelog":               { tier: 2, avgMonthlyCost: 160, isGeneric: false },
  "fiasp":                 { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "novolin":               { tier: 2, avgMonthlyCost: 140, isGeneric: false },
  "humulin":               { tier: 2, avgMonthlyCost: 140, isGeneric: false },

  // --- Heart / Cardiovascular (Brand) ---
  "entresto":              { tier: 2, avgMonthlyCost: 380, isGeneric: false },
  "corlanor":              { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "ranexa":                { tier: 2, avgMonthlyCost: 240, isGeneric: false },
  "multaq":                { tier: 2, avgMonthlyCost: 300, isGeneric: false },
  "verquvo":               { tier: 2, avgMonthlyCost: 350, isGeneric: false },
  "vascepa":               { tier: 2, avgMonthlyCost: 200, isGeneric: false },
  "repatha":               { tier: 2, avgMonthlyCost: 400, isGeneric: false },
  "praluent":              { tier: 2, avgMonthlyCost: 380, isGeneric: false },
  "leqvio":                { tier: 2, avgMonthlyCost: 450, isGeneric: false },

  // --- Respiratory (Brand) ---
  "symbicort":             { tier: 2, avgMonthlyCost: 180, isGeneric: false },
  "spiriva":               { tier: 2, avgMonthlyCost: 260, isGeneric: false },
  "advair":                { tier: 2, avgMonthlyCost: 200, isGeneric: false },
  "breo":                  { tier: 2, avgMonthlyCost: 220, isGeneric: false },
  "trelegy":               { tier: 2, avgMonthlyCost: 350, isGeneric: false },
  "dulera":                { tier: 2, avgMonthlyCost: 190, isGeneric: false },
  "incruse":               { tier: 2, avgMonthlyCost: 200, isGeneric: false },
  "anoro":                 { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "stiolto":               { tier: 2, avgMonthlyCost: 260, isGeneric: false },
  "nucala":                { tier: 2, avgMonthlyCost: 1800, isGeneric: false },
  "fasenra":               { tier: 2, avgMonthlyCost: 1600, isGeneric: false },

  // --- Pain (Brand) ---
  "lyrica":                { tier: 2, avgMonthlyCost: 240, isGeneric: false },
  "cymbalta":              { tier: 2, avgMonthlyCost: 200, isGeneric: false },
  "nucynta":               { tier: 2, avgMonthlyCost: 280, isGeneric: false },

  // --- Eye (Brand) ---
  "lumigan":               { tier: 2, avgMonthlyCost: 120, isGeneric: false },
  "restasis":              { tier: 2, avgMonthlyCost: 300, isGeneric: false },
  "xiidra":                { tier: 2, avgMonthlyCost: 350, isGeneric: false },
  "eylea":                 { tier: 2, avgMonthlyCost: 800, isGeneric: false },
  "lucentis":              { tier: 2, avgMonthlyCost: 900, isGeneric: false },

  // --- Osteoporosis (Brand) ---
  "prolia":                { tier: 2, avgMonthlyCost: 500, isGeneric: false },
  "evenity":               { tier: 2, avgMonthlyCost: 600, isGeneric: false },
  "forteo":                { tier: 2, avgMonthlyCost: 1400, isGeneric: false },
  "tymlos":                { tier: 2, avgMonthlyCost: 1200, isGeneric: false },

  // --- Mental Health (Brand) ---
  "vraylar":               { tier: 2, avgMonthlyCost: 500, isGeneric: false },
  "rexulti":               { tier: 2, avgMonthlyCost: 480, isGeneric: false },
  "latuda":                { tier: 2, avgMonthlyCost: 450, isGeneric: false },
  "trintellix":            { tier: 2, avgMonthlyCost: 280, isGeneric: false },
  "spravato":              { tier: 2, avgMonthlyCost: 600, isGeneric: false },

  // --- Other Brand ---
  "xeljanz":               { tier: 2, avgMonthlyCost: 2800, isGeneric: false },
  "aubagio":               { tier: 2, avgMonthlyCost: 3000, isGeneric: false },
  "gilenya":               { tier: 2, avgMonthlyCost: 3500, isGeneric: false },
  "tecfidera":             { tier: 2, avgMonthlyCost: 3200, isGeneric: false },
  "synthroid":             { tier: 2, avgMonthlyCost: 40, isGeneric: false },
  "eliquis":               { tier: 2, avgMonthlyCost: 280, isGeneric: false },

  // ============================================================
  // TIER 3: Non-Preferred Brand ($500-5000/month retail)
  // ============================================================
  "humira":                { tier: 3, avgMonthlyCost: 2800, isGeneric: false },
  "enbrel":                { tier: 3, avgMonthlyCost: 2600, isGeneric: false },
  "otezla":                { tier: 3, avgMonthlyCost: 1800, isGeneric: false },
  "rinvoq":                { tier: 3, avgMonthlyCost: 3200, isGeneric: false },
  "cosentyx":              { tier: 3, avgMonthlyCost: 2400, isGeneric: false },
  "taltz":                 { tier: 3, avgMonthlyCost: 3000, isGeneric: false },
  "skyrizi":               { tier: 3, avgMonthlyCost: 3500, isGeneric: false },
  "tremfya":               { tier: 3, avgMonthlyCost: 2800, isGeneric: false },
  "cimzia":                { tier: 3, avgMonthlyCost: 2200, isGeneric: false },
  "simponi":               { tier: 3, avgMonthlyCost: 2500, isGeneric: false },
  "orencia":               { tier: 3, avgMonthlyCost: 2400, isGeneric: false },
  "actemra":               { tier: 3, avgMonthlyCost: 2600, isGeneric: false },
  "kevzara":               { tier: 3, avgMonthlyCost: 2200, isGeneric: false },
  "olumiant":              { tier: 3, avgMonthlyCost: 2500, isGeneric: false },
  "sotyktu":               { tier: 3, avgMonthlyCost: 2800, isGeneric: false },
  "wegovy":                { tier: 3, avgMonthlyCost: 800, isGeneric: false },
  "zepbound":              { tier: 3, avgMonthlyCost: 750, isGeneric: false },

  // ============================================================
  // TIER 4: Specialty ($5000+/month retail)
  // ============================================================
  "keytruda":              { tier: 4, avgMonthlyCost: 10000, isGeneric: false },
  "opdivo":                { tier: 4, avgMonthlyCost: 9500, isGeneric: false },
  "tecentriq":             { tier: 4, avgMonthlyCost: 9000, isGeneric: false },
  "yervoy":                { tier: 4, avgMonthlyCost: 12000, isGeneric: false },
  "revlimid":              { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "ibrance":               { tier: 4, avgMonthlyCost: 7500, isGeneric: false },
  "imbruvica":             { tier: 4, avgMonthlyCost: 8500, isGeneric: false },
  "jakafi":                { tier: 4, avgMonthlyCost: 9000, isGeneric: false },
  "stelara":               { tier: 4, avgMonthlyCost: 6000, isGeneric: false },
  "dupixent":              { tier: 4, avgMonthlyCost: 2400, isGeneric: false },
  "ocrevus":               { tier: 4, avgMonthlyCost: 5500, isGeneric: false },
  "tysabri":               { tier: 4, avgMonthlyCost: 5000, isGeneric: false },
  "kisqali":               { tier: 4, avgMonthlyCost: 7000, isGeneric: false },
  "verzenio":              { tier: 4, avgMonthlyCost: 7200, isGeneric: false },
  "tagrisso":              { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "calquence":             { tier: 4, avgMonthlyCost: 7500, isGeneric: false },
  "venclexta":             { tier: 4, avgMonthlyCost: 6500, isGeneric: false },
  "pomalyst":              { tier: 4, avgMonthlyCost: 8500, isGeneric: false },
  "ninlaro":               { tier: 4, avgMonthlyCost: 7000, isGeneric: false },
  "darzalex":              { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "rituxan":               { tier: 4, avgMonthlyCost: 6000, isGeneric: false },
  "herceptin":             { tier: 4, avgMonthlyCost: 5500, isGeneric: false },
  "avastin":               { tier: 4, avgMonthlyCost: 5000, isGeneric: false },
  "erbitux":               { tier: 4, avgMonthlyCost: 6000, isGeneric: false },
  "opdualag":              { tier: 4, avgMonthlyCost: 11000, isGeneric: false },
  "enhertu":               { tier: 4, avgMonthlyCost: 9000, isGeneric: false },
  "padcev":                { tier: 4, avgMonthlyCost: 8500, isGeneric: false },
  "trodelvy":              { tier: 4, avgMonthlyCost: 8000, isGeneric: false },
  "spinraza":              { tier: 4, avgMonthlyCost: 12000, isGeneric: false },
  "zolgensma":             { tier: 4, avgMonthlyCost: 15000, isGeneric: false },
  "soliris":               { tier: 4, avgMonthlyCost: 14000, isGeneric: false },
  "ultomiris":             { tier: 4, avgMonthlyCost: 13000, isGeneric: false },
};

function classifyUnknownDrug(name: string, dosage: string): DrugProfile {
  const lower = name.toLowerCase();
  const genericSuffixes = ["pril", "olol", "sartan", "statin", "prazole", "tidine", "dipine", "azepam", "oxetine", "pram", "azole", "mycin", "cillin", "cycline", "gliptin", "gliflozin", "glutide", "mab", "nib", "tinib", "zomib", "parib", "lisib", "fenac", "profen", "coxib", "olone", "asone", "onide", "lukast", "phylline", "tropium", "terol", "amide", "thiazide", "pamine", "setron", "pride"];
  const isLikelyGeneric = genericSuffixes.some(s => lower.endsWith(s));
  if (isLikelyGeneric) {
    return { tier: 1, avgMonthlyCost: 15, isGeneric: true };
  }
  // Check for common brand name patterns
  const brandIndicators = ["xr", "er", "sr", "cr", "la", "xl", "hfa"];
  const hasBrandSuffix = brandIndicators.some(s => lower.endsWith(s));
  if (hasBrandSuffix) {
    return { tier: 2, avgMonthlyCost: 200, isGeneric: false };
  }
  return { tier: 2, avgMonthlyCost: 200, isGeneric: false };
}

// — Copay/coinsurance parsers ——————————————————————————————
function parseCopayAmount(copayStr: string): { type: "flat" | "percent"; value: number } {
  if (!copayStr) return { type: "flat", value: 0 };
  const str = copayStr.toLowerCase().trim();
  const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { type: "percent", value: parseFloat(pctMatch[1]) };
  const dollarMatch = str.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollarMatch) return { type: "flat", value: parseFloat(dollarMatch[1]) };
  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) return { type: "flat", value: parseFloat(numMatch[1]) };
  return { type: "flat", value: 0 };
}

function parseDeductible(deductStr: string | number | undefined): number {
  if (typeof deductStr === "number") return deductStr;
  if (!deductStr) return 0;
  const match = String(deductStr).match(/\$?\s*(\d+(?:,\d{3})*)/);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return 0;
}

// — Core types ———————————————————————————————————
export interface DrugInput {
  name: string;
  dosage: string;
}

export interface DrugCostBreakdown {
  drugName: string;
  tier: number;
  monthlyRetailCost: number;
  monthlyCopay: number;
  annualCost: number;
  phase: string;
}

export interface FormularyResult {
  estimatedAnnualDrugCost: number;
  drugBreakdowns: DrugCostBreakdown[];
  deductibleApplied: number;
  reachesCatastrophic: boolean;
  monthCatastrophicReached: number | null;
  totalRetailCost: number;
  oopBreakdown: {
    deductiblePhase: number;
    initialCoveragePhase: number;
    catastrophicPhase: number;
  };
}

// — 2026 Medicare Part D Parameters ————————————————————————
const OOP_CAP_2026 = 2100;
const MAX_DEDUCTIBLE_2026 = 615;

export function calculateDrugCosts(
  drugs: DrugInput[],
  planRx: {
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
    deductible: string | number;
    gap: boolean;
    initialCoverageLimit?: string;
  }
): FormularyResult {
  if (!drugs || drugs.length === 0) {
    return {
      estimatedAnnualDrugCost: 0,
      drugBreakdowns: [],
      deductibleApplied: 0,
      reachesCatastrophic: false,
      monthCatastrophicReached: null,
      totalRetailCost: 0,
      oopBreakdown: { deductiblePhase: 0, initialCoveragePhase: 0, catastrophicPhase: 0 },
    };
  }

  const drugDeductible = Math.min(parseDeductible(planRx.deductible), MAX_DEDUCTIBLE_2026);
  const tierCopays = {
    1: parseCopayAmount(planRx.tier1),
    2: parseCopayAmount(planRx.tier2),
    3: parseCopayAmount(planRx.tier3),
    4: parseCopayAmount(planRx.tier4),
  };

  const drugProfiles = drugs.map(drug => {
    const key = drug.name.toLowerCase().trim();
    const profile = DRUG_DATABASE[key] || classifyUnknownDrug(drug.name, drug.dosage);
    return { drug, profile };
  });

  let cumulativeOOP = 0;
  let deductibleRemaining = drugDeductible;
  let totalRetailAnnual = 0;
  let deductiblePhaseCost = 0;
  let initialCoveragePhaseCost = 0;
  let catastrophicPhaseCost = 0;
  let monthCatastrophicReached: number | null = null;

  const drugAnnualCosts: Map<string, number> = new Map();
  for (const { drug } of drugProfiles) {
    drugAnnualCosts.set(drug.name, 0);
  }

  for (let month = 0; month < 12; month++) {
    if (cumulativeOOP >= OOP_CAP_2026) {
      if (monthCatastrophicReached === null) monthCatastrophicReached = month;
      for (const { drug, profile } of drugProfiles) {
        totalRetailAnnual += profile.avgMonthlyCost;
      }
      continue;
    }

    for (const { drug, profile } of drugProfiles) {
      const retailCost = profile.avgMonthlyCost;
      totalRetailAnnual += retailCost;
      let memberPays = 0;

      if (cumulativeOOP >= OOP_CAP_2026) {
        catastrophicPhaseCost += 0;
        continue;
      }

      if (deductibleRemaining > 0 && profile.tier > 1) {
        const deductiblePortion = Math.min(retailCost, deductibleRemaining);
        memberPays = deductiblePortion;
        deductibleRemaining -= deductiblePortion;
        deductiblePhaseCost += memberPays;
      } else {
        const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
        if (copay.type === "flat") {
          memberPays = copay.value;
        } else {
          memberPays = retailCost * (copay.value / 100);
        }
        initialCoveragePhaseCost += memberPays;
      }

      const remainingToOOPCap = OOP_CAP_2026 - cumulativeOOP;
      if (memberPays > remainingToOOPCap) {
        memberPays = remainingToOOPCap;
        if (monthCatastrophicReached === null) monthCatastrophicReached = month + 1;
      }

      cumulativeOOP += memberPays;
      const prev = drugAnnualCosts.get(drug.name) || 0;
      drugAnnualCosts.set(drug.name, prev + memberPays);
    }
  }

  const breakdowns: DrugCostBreakdown[] = drugProfiles.map(({ drug, profile }) => {
    const copay = tierCopays[profile.tier as 1 | 2 | 3 | 4];
    const monthlyCopay = copay.type === "flat" ? copay.value : profile.avgMonthlyCost * (copay.value / 100);
    const annualCost = drugAnnualCosts.get(drug.name) || 0;
    return {
      drugName: drug.name,
      tier: profile.tier,
      monthlyRetailCost: profile.avgMonthlyCost,
      monthlyCopay: Math.round(monthlyCopay * 100) / 100,
      annualCost: Math.round(annualCost),
      phase: cumulativeOOP >= OOP_CAP_2026 ? "catastrophic" : "initial",
    };
  });

  return {
    estimatedAnnualDrugCost: Math.round(cumulativeOOP),
    drugBreakdowns: breakdowns,
    deductibleApplied: drugDeductible - deductibleRemaining,
    reachesCatastrophic: cumulativeOOP >= OOP_CAP_2026,
    monthCatastrophicReached,
    totalRetailCost: Math.round(totalRetailAnnual),
    oopBreakdown: {
      deductiblePhase: Math.round(deductiblePhaseCost),
      initialCoveragePhase: Math.round(initialCoveragePhaseCost),
      catastrophicPhase: Math.round(catastrophicPhaseCost),
    },
  };
}

export function enrichPlansWithDrugCosts(
  plans: any[],
  drugs: DrugInput[]
): any[] {
  if (!drugs || drugs.length === 0) return plans;

  return plans.map(plan => {
    const rxStructure = {
      tier1: plan.rxDrugs?.tier1 ?? "$0",
      tier2: plan.rxDrugs?.tier2 ?? "$10",
      tier3: plan.rxDrugs?.tier3 ?? "$42",
      tier4: plan.rxDrugs?.tier4 ?? "25%",
      deductible: plan.rxDrugs?.deductible ?? "$0",
      gap: plan.rxDrugs?.gap ?? false,
    };

    const result = calculateDrugCosts(drugs, rxStructure);
    const annualPremium = (plan.premium ?? 0) * 12;

    return {
      ...plan,
      formularyDrugCost: result,
      estimatedAnnualDrugCost: result.estimatedAnnualDrugCost,
      estimatedTotalAnnualCost: annualPremium + result.estimatedAnnualDrugCost,
    };
  });
}
