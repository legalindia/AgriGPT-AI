import { PracticalCategory, PracticalCard } from '../types';

export const PRACTICAL_CATEGORIES: {
  id: PracticalCategory;
  label: string;
  subtitle: string;
}[] = [
  { id: 'weeds', label: 'Weeds', subtitle: 'Morphology, mimicry & herbicide specificity' },
  { id: 'pests', label: 'Insect Pests', subtitle: 'Damage symptoms, life stages & ETL' },
  { id: 'diseases', label: 'Plant Diseases', subtitle: 'Causal organisms, spores & diagnostics' },
  { id: 'soil_instruments', label: 'Soil & Agro-Met Instruments', subtitle: 'Lab apparatus, analytical principles & field gauges' },
  { id: 'fertilizers', label: 'Fertilizers', subtitle: 'Nutrient % grade, hygroscopicity & soil reaction' },
];

export const SEED_PRACTICAL_CARDS: PracticalCard[] = [
  // WEEDS
  {
    id: 'weed-1',
    category: 'weeds',
    title: 'Little Seed Canary Grass (Gullidanda / Mandusi)',
    scientificOrTechnicalSubtitle: 'Phalaris minor Retz.',
    classificationOrPrinciple: 'Family: Poaceae · Narrow-leaf annual Rabi grassy weed (Wheat mimic)',
    identifyingFeatures: [
      'Basal node shows a distinct reddish/pinkish pigmentation at seedling stage',
      'Ligule is prominent, papery, membranous, and long; auricles are absent',
      'Produces compact cylindrical panicle; test weight ~2 g per 1000 seeds',
    ],
    practicalSignificance:
      'Mimics Triticum aestivum before flowering; Sulfosulfuron (25 g a.i./ha) or Clodinafop-propargyl (60 g a.i./ha) at 30–35 DAS controls resistant biotypes.',
    vivaQuestion: 'How do you distinguish Phalaris minor from wheat at the 2–3 leaf stage in the field?',
    vivaAnswer:
      'Phalaris minor has a pinkish/reddish tinge at the basal culm, lacks auricles, and has a long membranous ligule, whereas wheat has prominent hairy auricles and a green base.',
  },
  {
    id: 'weed-2',
    category: 'weeds',
    title: 'Purple Nutsedge (Motha)',
    scientificOrTechnicalSubtitle: 'Cyperus rotundus L.',
    classificationOrPrinciple: 'Family: Cyperaceae · Perennial sedge (World’s worst weed)',
    identifyingFeatures: [
      'Triangular solid stem (3-ranked leaves) with no nodes/internodes above ground',
      'Extensive underground network of dark brown aromatic tubers connected by rhizomes',
      'Reddish-brown umbel inflorescence subtended by leaf-like involucral bracts',
    ],
    practicalSignificance:
      'Tubers exhibit apical dominance; Halosulfuron-methyl 75% WG @ 67.5 g a.i./ha gives selective post-emergence sedge control in maize and sugarcane.',
    vivaQuestion: 'Why is Cyperus rotundus classified as a sedge rather than a grass?',
    vivaAnswer:
      'It belongs to Cyperaceae with a solid triangular stem and 3-ranked leaves, whereas true grasses (Poaceae) have hollow cylindrical stems with distinct nodes and 2-ranked leaves.',
  },
  {
    id: 'weed-3',
    category: 'weeds',
    title: 'Congress Grass (Gajar Ghas)',
    scientificOrTechnicalSubtitle: 'Parthenium hysterophorus L.',
    classificationOrPrinciple: 'Family: Asteraceae · Invasive annual broad-leaf weed',
    identifyingFeatures: [
      'Deeply lobed, carrot-like rosette leaves in early vegetative phase',
      'Profusely branched stem bearing numerous small white capitula (flower heads)',
      'Contains sesquiterpene lactone "Parthenin" causing contact dermatitis',
    ],
    practicalSignificance:
      'Controlled biologically using the Mexican beetle (Zygogramma bicolorata) and competitive botanical suppression using Cassia tora.',
    vivaQuestion: 'Name the biological control agent successfully used against Parthenium hysterophorus in India.',
    vivaAnswer:
      'Zygogramma bicolorata (Mexican leaf-feeding beetle) defoliates Parthenium plants during monsoon; introduced by IIHR/NBAIR.',
  },

  // PESTS
  {
    id: 'pest-1',
    category: 'pests',
    title: 'Rice Yellow Stem Borer',
    scientificOrTechnicalSubtitle: 'Scirpophaga incertulas (Walker)',
    classificationOrPrinciple: 'Order: Lepidoptera · Family: Crambidae · Monophagous on Oryza sativa',
    identifyingFeatures: [
      'Female moth has bright yellowish forewings with a single prominent black spot in the center',
      'Egg masses are laid near leaf tips and covered with buff-colored anal hairs',
      'Produces "Dead Heart" in vegetative stage and "White Earhead" at reproductive stage',
    ],
    practicalSignificance:
      'ETL is 5% dead heart or 1 egg mass/m². Managed via Trichogramma japonicum @ 50,000 eggs/ha or Cartap hydrochloride 4G @ 25 kg/ha.',
    vivaQuestion: 'Differentiate between "Dead Heart" and "White Ear" caused by Yellow Stem Borer.',
    vivaAnswer:
      'Dead Heart occurs during the vegetative stage when the central shoot dries and pulls out easily; White Ear occurs at panicle stage resulting in chaffy, empty white panicles.',
  },
  {
    id: 'pest-2',
    category: 'pests',
    title: 'Gram Pod Borer / American Bollworm',
    scientificOrTechnicalSubtitle: 'Helicoverpa armigera (Hübner)',
    classificationOrPrinciple: 'Order: Lepidoptera · Family: Noctuidae · Polyphagous pest',
    identifyingFeatures: [
      'Larva shows variable green/brown body colors with wavy longitudinal lateral white stripes',
      'Circular bore holes on chickpea pods; larva feeds with anterior half inside and posterior outside',
      'Adult moth is stout, yellowish-brown with a dark speck and kidney-shaped mark on forewing',
    ],
    practicalSignificance:
      'Major pest of chickpea, pigeonpea, and cotton; managed via HaNPV (250 LE/ha), pheromone traps (5/ha), and Emamectin benzoate 5 SG.',
    vivaQuestion: 'What is the characteristic feeding habit of Helicoverpa armigera larvae on chickpea pods?',
    vivaAnswer:
      'The larva thrusts only its head and thorax inside the circular bore hole to eat developing seeds while keeping the posterior half of its body outside.',
  },
  {
    id: 'pest-3',
    category: 'pests',
    title: 'Brown Planthopper (BPH)',
    scientificOrTechnicalSubtitle: 'Nilaparvata lugens (Stål)',
    classificationOrPrinciple: 'Order: Hemiptera · Family: Delphacidae · Phloem-sucking vector',
    identifyingFeatures: [
      'Nymphs and adults congregate at the base of rice tillers just above water level',
      'Two adult wing forms: macropterous (long-winged) and brachypterous (short-winged)',
      'Causes circular drying patches called "Hopper Burn"; transmits Grassy Stunt & Ragged Stunt viruses',
    ],
    practicalSignificance:
      'Alley-ways (30 cm every 2–3 m) reduce canopy humidity; avoid synthetic pyrethroids which trigger BPH resurgence.',
    vivaQuestion: 'What is "Hopper Burn" and why are alley-ways recommended in rice?',
    vivaAnswer:
      'Hopper burn is circular yellowing and drying of rice plants caused by heavy phloem sap sucking by BPH. Alley-ways improve aeration and sunlight at the culm base, curbing BPH buildup.',
  },

  // DISEASES
  {
    id: 'dis-1',
    category: 'diseases',
    title: 'Stem / Black Rust of Wheat',
    scientificOrTechnicalSubtitle: 'Puccinia graminis f. sp. tritici',
    classificationOrPrinciple: 'Phylum: Basidiomycota · Macrocyclic heteroecious rust fungus',
    identifyingFeatures: [
      'Elongated reddish-brown uredial pustules on stems and leaf sheaths rupturing the epidermis',
      'Later turns black due to dark two-celled pedicellate teliospores',
      'Completes sexual stages (0, I) on alternate host Berberis vulgaris in temperate hills',
    ],
    practicalSignificance:
      'In India, inoculum survives in Nilgiri/Pulney hills and spreads northward via wind (K.C. Mehta’s Puccinia path); resistant variety HD 2967 / DBW 187.',
    vivaQuestion: 'Name all five spore stages of Puccinia graminis tritici and the repeating stage on wheat.',
    vivaAnswer:
      'Pycniospore (0) and Aeciospore (I) on Barberry; Urediniospore (II) and Teliospore (III) on Wheat; Basidiospore (IV) on straw. Urediniospore is the repeating stage on wheat.',
  },
  {
    id: 'dis-2',
    category: 'diseases',
    title: 'Rice Blast',
    scientificOrTechnicalSubtitle: 'Magnaporthe oryzae (Anamorph: Pyricularia oryzae)',
    classificationOrPrinciple: 'Phylum: Ascomycota · Affects leaf, node & panicle neck',
    identifyingFeatures: [
      'Spindle-shaped (eye-shaped) lesions on leaves with ashy-grey center and dark brown margin',
      'Pyriform (pear-shaped), hyaline, 3-celled (2-septate) conidia under microscope',
      'Neck blast causes blackening and breaking of panicle base resulting in chaffy grains',
    ],
    practicalSignificance:
      'Favored by >90% RH and excess nitrogen; Tricyclazole 75% WP @ 0.6 g/L is the benchmark systemic fungicide.',
    vivaQuestion: 'What is the diagnostic shape of leaf lesions and conidia in Rice Blast?',
    vivaAnswer:
      'Leaf lesions are spindle- or boat-shaped with an ashy-grey center and brown border; conidia are pear-shaped (pyriform) and three-celled.',
  },
  {
    id: 'dis-3',
    category: 'diseases',
    title: 'Late Blight of Potato',
    scientificOrTechnicalSubtitle: 'Phytophthora infestans (Mont.) de Bary',
    classificationOrPrinciple: 'Kingdom: Stramenopila (Oomycota) · 1845 Irish Famine pathogen',
    identifyingFeatures: [
      'Water-soaked dark brown/black lesions starting from leaf tips and margins',
      'White downy sporangial ring visible on lower leaf surface during cool humid mornings',
      'Lemon-shaped papillate sporangia borne on sympodially branched sporangiophores',
    ],
    practicalSignificance:
      'Favored by 10–20°C and >90% RH; prophylactic Mancozeb 75% WP or curative Metalaxyl + Mancozeb.',
    vivaQuestion: 'Why is Phytophthora infestans not a true fungus, and what is its cell wall composed of?',
    vivaAnswer:
      'It belongs to Oomycota (Stramenopila) because its cell wall contains cellulose and β-glucans instead of chitin, and it produces biflagellate zoospores.',
  },

  // SOIL & AGROMET INSTRUMENTS
  {
    id: 'soil-1',
    category: 'soil_instruments',
    title: 'Walkley & Black Organic Carbon Apparatus + Titration',
    scientificOrTechnicalSubtitle: 'Walkley and Black (1934) Wet Oxidation Method',
    classificationOrPrinciple: 'Oxidation of ~77% Soil Organic Carbon using 1N K2Cr2O7 + Conc. H2SO4',
    identifyingFeatures: [
      'Uses heat of dilution of Conc. H2SO4 (~120°C) to oxidize organic carbon without external heating',
      'Back-titrated against 0.5N Ferrous Ammonium Sulphate (FAS) using Diphenylamine indicator',
      'Endpoint shifts sharply from violet-blue to brilliant green',
    ],
    practicalSignificance:
      'Correction factor 1.3 recovers total OC; Van Bemmelen factor 1.724 converts OC% to Soil Organic Matter %.',
    vivaQuestion: 'What is the Van Bemmelen factor and its underlying assumption?',
    vivaAnswer:
      'The Van Bemmelen factor is 1.724 (100/58), assuming soil organic matter contains an average of 58% organic carbon.',
  },
  {
    id: 'soil-2',
    category: 'soil_instruments',
    title: 'Tensiometer (Irrometer)',
    scientificOrTechnicalSubtitle: 'Porous Ceramic Cup Soil Matric Potential Gauge',
    classificationOrPrinciple: 'Measures soil moisture tension in situ up to 0.85 bar (85 centibars)',
    identifyingFeatures: [
      'Consists of a porous ceramic cup, water-filled transparent tube, and Bourdon vacuum gauge',
      'Water moves out into drier soil creating partial vacuum read directly in centibars',
      'Only accurate in sandy to loamy soils within 0 to 0.85 bar tension range',
    ],
    practicalSignificance:
      'Widely used in scheduling drip irrigation in orchards and vegetable crops (e.g., irrigate tomato at 25–30 cb).',
    vivaQuestion: 'Why does a tensiometer fail beyond 0.85 bar soil moisture tension?',
    vivaAnswer:
      'Above 0.85 bar (85 kPa), air enters through the porous ceramic cup pores, breaking the water column and causing cavitation inside the tube.',
  },
  {
    id: 'soil-3',
    category: 'soil_instruments',
    title: 'Stevenson Screen',
    scientificOrTechnicalSubtitle: 'Standard Agro-Meteorological Thermometer Shelter',
    classificationOrPrinciple: 'Double-louvered white wooden shelter mounted at 1.22 m (4 ft) height',
    identifyingFeatures: [
      'White paint reflects solar radiation; louvered walls ensure free air ventilation',
      'Door faces North in Northern Hemisphere so direct sun never strikes thermometer bulbs',
      'Houses Maximum, Minimum, Dry-Bulb, and Wet-Bulb thermometers',
    ],
    practicalSignificance:
      'Measures true ambient shade air temperature and wet-bulb depression for Relative Humidity.',
    vivaQuestion: 'Why must the Stevenson Screen door face North in India?',
    vivaAnswer:
      'Because India lies in the Northern Hemisphere where the sun remains in the southern sky; facing North prevents direct sunlight from hitting the bulbs during 07:00 and 14:00 LMT readings.',
  },

  // FERTILIZERS
  {
    id: 'fert-1',
    category: 'fertilizers',
    title: 'Urea (Carbamide)',
    scientificOrTechnicalSubtitle: 'CO(NH2)2 · White Crystalline / Prilled Organic Nitrogenous Fertilizer',
    classificationOrPrinciple: 'Grade: 46% N (Amide form) · Equivalent Acidity: 80–84 kg CaCO3 / 100 kg urea',
    identifyingFeatures: [
      'Highest nitrogen percentage (46% N) among solid granular nitrogen fertilizers',
      'Hygroscopic white prills; rapidly soluble in water; converted by urease enzyme to NH4+',
      'Biuret content must not exceed 1.5% under Indian FCO standards (0.5% for foliar spray)',
    ],
    practicalSignificance:
      'In India, 100% Neem-Coated Urea (NCU) is mandated to slow nitrification, curb leaching/volatilization, and prevent industrial diversion.',
    vivaQuestion: 'Why is biuret content strictly regulated in Urea, especially for foliar application?',
    vivaAnswer:
      'Biuret (NH2-CO-NH-CO-NH2) formed during overheating in granulation is phytotoxic and causes leaf tip scorching/chlorosis; FCO limits it to 1.5% (soil) and <0.5% (foliar).',
  },
  {
    id: 'fert-2',
    category: 'fertilizers',
    title: 'Di-Ammonium Phosphate (DAP)',
    scientificOrTechnicalSubtitle: '(NH4)2HPO4 · Granular Complex NP Fertilizer',
    classificationOrPrinciple: 'Grade: 18% N and 46% P2O5 (Water-soluble P ~41%)',
    identifyingFeatures: [
      'Dark grey/brown hard granules, non-hygroscopic and free-flowing',
      'Creates a temporary alkaline zone (pH ~8.0) immediately around the dissolving granule',
      'Equivalent acidity is ~77 kg CaCO3 per 100 kg fertilizer upon nitrification of NH4+',
    ],
    practicalSignificance:
      'Most widely used basal phosphatic fertilizer in India; ideal for neutral to slightly acidic soils, applied at sowing below the seed.',
    vivaQuestion: 'What is the N and P2O5 percentage in DAP and why should it not be surface-broadcast on calcareous soils?',
    vivaAnswer:
      'DAP contains 18% N and 46% P2O5. Its initial dissolution pH (~8.0) promotes ammonia volatilization losses and Ca-phosphate precipitation if left on the surface of calcareous soils.',
  },
  {
    id: 'fert-3',
    category: 'fertilizers',
    title: 'Single Super Phosphate (SSP)',
    scientificOrTechnicalSubtitle: 'Ca(H2PO4)2 + CaSO4·2H2O · Multi-Nutrient Straight Phosphatic Fertilizer',
    classificationOrPrinciple: 'Grade: 16% P2O5, 11–12% Sulphur, 19–21% Calcium (Neutral soil reaction)',
    identifyingFeatures: [
      'Greyish powder or granular form manufactured by treating Rock Phosphate with H2SO4',
      'Contains ~50% Monocalcium Phosphate and ~50% Gypsum (providing S and Ca)',
      'Neutral residual effect on soil pH (neither acid-forming nor alkaline)',
    ],
    practicalSignificance:
      'Superior to DAP for oilseeds (Groundnut, Mustard, Soybean) and pulses because its 12% Sulphur boosts oil and protein synthesis.',
    vivaQuestion: 'Why is SSP preferred over DAP in Groundnut (Arachis hypogaea) and Mustard?',
    vivaAnswer:
      'SSP supplies 12% Sulphur and 19–21% Calcium alongside 16% P2O5—Sulphur is vital for oil/glucosinolate synthesis and Calcium is essential for groundnut pod filling.',
  },
  {
    id: 'fert-4',
    category: 'fertilizers',
    title: 'Muriate of Potash (MOP / Potassium Chloride)',
    scientificOrTechnicalSubtitle: 'KCl · Straight Potassic Fertilizer',
    classificationOrPrinciple: 'Grade: 60% K2O (Water-soluble) · Neutral residual effect on soil pH',
    identifyingFeatures: [
      'Pinkish-red or white fine crystalline salt (pink color from trace iron oxide impurities)',
      'Contains ~47% Chloride (Cl-) ions alongside 60% K2O',
      'High salt index (116); completely water soluble and readily adsorbed on clay CEC',
    ],
    practicalSignificance:
      'Avoided in chloride-sensitive crops like Tobacco (hurts burning quality), Potato (reduces starch), and Grapes; SOP (K2SO4, 50% K2O) is used instead.',
    vivaQuestion: 'Why is Sulphate of Potash (SOP) recommended instead of MOP for Tobacco and Potato?',
    vivaAnswer:
      'MOP contains ~47% Chloride which impairs leaf burning quality in tobacco and reduces tuber starch/dry matter in potato, whereas SOP supplies 50% K2O + 17.5% S without chloride.',
  },
];
