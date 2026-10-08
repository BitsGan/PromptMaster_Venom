import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API successfully initialized on full-stack server.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found or standard placeholder is active. Running in Local Semantic Evaluation mode.");
}

interface Level {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetImageUrl: string;
  targetKeywords: string[];
  hints: string;
  description: string;
  proceduralTheme: string;
}

interface VisualElement {
  type: string;
  color: string;
  intensity?: number;
  visible: boolean;
  label?: string;
}

interface EvaluationResult {
  score: number;
  matchedKeywords: string[];
  missedKeywords: string[];
  feedback: string;
  visualElements: VisualElement[];
  isAiEvaluated: boolean;
}

const levels: Level[] = [
  {
    id: 1,
    title: "The Autumn Fruit",
    difficulty: "Easy",
    targetImageUrl: "level1_autumn_fruit",
    targetKeywords: ["apple", "red", "wooden", "table", "rustic"],
    hints: "Describe a main red object (apple) resting on a specific texture and material surface (rustic wood table).",
    description: "A ripe red apple resting on a rustic wooden table with realistic grain.",
    proceduralTheme: "autumn_fruit"
  },
  {
    id: 2,
    title: "Cyberpunk Alley",
    difficulty: "Medium",
    targetImageUrl: "level2_cyberpunk_alley",
    targetKeywords: ["rainy", "alley", "neon", "purple", "cyan", "cyberpunk"],
    hints: "Incorporate weather conditions (rain, wet floor), futuristic vibes (cyberpunk alley), and bright glowing signage (neon cyan and purple signs).",
    description: "A narrow rainy cyberpunk neon alley with glowing purple and cyan signs reflecting on wet asphalt.",
    proceduralTheme: "cyberpunk_alley"
  },
  {
    id: 3,
    title: "Lost Astronaut",
    difficulty: "Hard",
    targetImageUrl: "level3_lost_astronaut",
    targetKeywords: ["astronaut", "floating", "space", "cosmic", "yellow", "balloon"],
    hints: "Center a human in a suit (astronaut) floating in a starry dark sky (cosmic deep space), holding a striking contrast item (yellow balloon).",
    description: "An astronaut floating in deep cosmic starry space holding a glowing yellow balloon.",
    proceduralTheme: "lost_astronaut"
  },
  {
    id: 4,
    title: "Forest Sanctuary",
    difficulty: "Hard",
    targetImageUrl: "level4_forest_sanctuary",
    targetKeywords: ["temple", "golden", "misty", "emerald", "forest", "minimalist"],
    hints: "Detail a small golden sacred building (minimalist temple/pagoda) tucked inside an emerald green fog weather environment (misty ancient forest).",
    description: "A minimalist golden temple nestled inside a misty emerald forest with lush green canopies.",
    proceduralTheme: "forest_sanctuary"
  },
  {
    id: 5,
    title: "Desert Oasis",
    difficulty: "Easy",
    targetImageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["palm", "oasis", "dunes", "pool", "desert", "sun"],
    hints: "Mention a liquid body (oasis pool), desert environment (golden sand dunes), local vegetation (palm trees), and overhead sky element (blazing sun).",
    description: "A serene desert oasis pool surrounded by green palm trees nestled in golden sand dunes under a blazing sun.",
    proceduralTheme: "desert_oasis"
  },
  {
    id: 6,
    title: "Volcano Caldera",
    difficulty: "Medium",
    targetImageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["lava", "magma", "smoke", "volcano", "crater", "ash", "glowing"],
    hints: "Include active magma/lava flow, hot conditions (glowing), dark rocks/crater walls, and heavy atmospheric emissions (smoke and ash).",
    description: "An active volcanic crater with bright orange glowing lava bubbling up amidst dark basalt rocks and pillars of dark smoke.",
    proceduralTheme: "volcano_caldera"
  },
  {
    id: 7,
    title: "Subsea Coral Reef",
    difficulty: "Easy",
    targetImageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["fish", "coral", "reef", "submarine", "bubbles", "ocean", "turquoise"],
    hints: "Describe underwater features (coral reef), clear seawater (turquoise ocean), dynamic aquatic creatures (fish), and underwater physics (bubbles).",
    description: "An underwater tropical paradise filled with colorful neon corals, tiny yellow fish swimming through turquoise water and bubbles.",
    proceduralTheme: "subsea_coral"
  },
  {
    id: 8,
    title: "Steampunk Workshop",
    difficulty: "Medium",
    targetImageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["gears", "steampunk", "pipes", "brass", "valve", "steam", "lantern"],
    hints: "Focus on metallic retro-tech elements (brass pipes and gears/cogs), mechanical actuators (valves), and local lighting conditions (warm glowing lantern and steam particles).",
    description: "A cozy steampunk machine room with heavy brass cogs, pipes expelling steam, and warm glowing lanterns reflecting on copper panels.",
    proceduralTheme: "steampunk_workshop"
  },
  {
    id: 9,
    title: "Retro Arcade",
    difficulty: "Medium",
    targetImageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["arcade", "joystick", "cabinet", "retro", "glowing", "neon", "pixel"],
    hints: "Include vintage gaming elements (retro arcade cabinet box), physical controls (joystick), glowing display symbols (pixel art), and ambient illumination (neon glow).",
    description: "A vintage arcade cabinet with glowing joystick, coin slot, neon side art, and pixel symbols on the screen.",
    proceduralTheme: "retro_arcade"
  },
  {
    id: 10,
    title: "Snowy Cozy Cabin",
    difficulty: "Medium",
    targetImageUrl: "https://images.unsplash.com/photo-1482862549707-f63cb32c5fd9?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["cabin", "snowy", "pines", "smoke", "winter", "warm", "chimney"],
    hints: "Mention a timber wood building (cabin), cold climate settings (winter snow), surround vegetation (snowy pine trees), chimney exhaust (cozy smoke), and internal ambience (warm windows glow).",
    description: "A picturesque winter wooden cabin surrounded by snowy pine trees with warm light shining from windows and cozy chimney smoke.",
    proceduralTheme: "snowy_cabin"
  },
  {
    id: 11,
    title: "Celestial Portal",
    difficulty: "Hard",
    targetImageUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=400&h=400&q=80",
    targetKeywords: ["portal", "ring", "energy", "floating", "crystals", "obelisk", "stars"],
    hints: "Detail an gateway structure (stone ring portal), energy emissions (plasma energy), floating crystal nodes (amethyst crystals), background sky (starry voids), and tall pillars (obelisk).",
    description: "A gigantic stone ring portal radiating cosmic blue plasma energy, surrounded by floating amethyst crystals and ancient obelisks.",
    proceduralTheme: "celestial_portal"
  }
];

// Offline validation logic with synonyms to be forgiving and intelligent
function evaluateOffline(level: Level, prompt: string): EvaluationResult {
  const normalized = prompt.toLowerCase();
  
  const synonymMap: Record<string, string[]> = {
    "apple": ["apple", "apples", "fruit", "pomme", "malus"],
    "red": ["red", "crimson", "scarlet", "ruby", "rosy", "reddish"],
    "wooden": ["wooden", "wood", "timber", "tabletop", "oak", "mahogany", "plank"],
    "table": ["table", "desk", "surface", "bench", "countertop", "stand"],
    "rustic": ["rustic", "weathered", "grain", "cozy", "old", "rough", "vintage", "textures", "texture"],
    
    "rainy": ["rain", "rainy", "wet", "puddle", "puddles", "shimmering", "drizzle", "raining", "drops"],
    "alley": ["alley", "passage", "street", "lane", "pathway", "alleyway"],
    "neon": ["neon", "glowing", "sign", "billboard", "lights", "glow", "luminous"],
    "purple": ["purple", "violet", "magenta", "pink", "fuchsia"],
    "cyan": ["cyan", "blue", "teal", "turquoise", "light-blue", "electric-blue"],
    "cyberpunk": ["cyberpunk", "futuristic", "future", "neo-tokyo", "sci-fi", "dystopian", "cyber"],
    
    "astronaut": ["astronaut", "cosmonaut", "spaceman", "suit", "helmet", "explorer"],
    "floating": ["floating", "float", "drift", "drifting", "zero-gravity", "zero-g", "suspension", "hovering", "weightless"],
    "space": ["space", "stars", "starry", "galaxy", "universe", "galactic", "stellar"],
    "cosmic": ["cosmic", "nebula", "constellation", "milkyway", "cosmos"],
    "yellow": ["yellow", "gold", "golden", "amber", "lemon"],
    "balloon": ["balloon", "orb", "globe", "sphere", "inflated"],
    
    "temple": ["temple", "shrine", "pagoda", "building", "structure", "sanctuary", "pavilion"],
    "golden": ["golden", "gold", "gilded", "bronze", "glowing", "glimmering"],
    "misty": ["misty", "foggy", "mist", "fog", "haze", "hazy", "smoky", "moisture"],
    "emerald": ["emerald", "green", "jade", "mossy", "lush", "vibrant-green"],
    "forest": ["forest", "trees", "woods", "jungle", "canopy", "woodland", "groves"],
    "minimalist": ["minimalist", "minimal", "zen", "simple", "clean", "stripped-back", "basic"],

    "palm": ["palm", "palms", "tree", "trees", "oasis-palm", "frond", "fronds", "foliage"],
    "oasis": ["oasis", "spring", "waterhole", "watering", "haven", "sanctuary"],
    "dunes": ["dunes", "dune", "sand", "sandy", "hills", "hill", "slopes", "sahara"],
    "pool": ["pool", "pond", "water", "lake", "lagoon", "basin"],
    "desert": ["desert", "arid", "barren", "safari", "wasteland"],
    "sun": ["sun", "sunny", "sunlight", "blazing", "solar", "glare", "skyline", "sky"],

    "lava": ["lava", "magma", "molten", "liquid-rock", "flow", "glow", "pyroclastic"],
    "magma": ["magma", "lava", "core", "chamber"],
    "smoke": ["smoke", "fumes", "vapor", "plume", "steam", "emission", "exhaust", "cloud"],
    "volcano": ["volcano", "volcanic", "vent", "mountain", "peak", "tectonic"],
    "crater": ["crater", "caldera", "opening", "pit", "mouth", "depression"],
    "ash": ["ash", "ashes", "cinders", "debris", "soot", "dust"],
    "glowing": ["glowing", "glow", "radiant", "luminous", "incandescent", "bright", "orange", "yellow"],

    "fish": ["fish", "fishes", "marine", "fauna", "swimmer", "yellow-fish", "school", "aquatic"],
    "coral": ["coral", "corals", "polyps", "reef", "anemone"],
    "reef": ["reef", "corals", "atoll", "shelf", "barrier"],
    "submarine": ["submarine", "submersible", "scuba", "diver", "underwater", "aquatic", "subsea"],
    "bubbles": ["bubbles", "bubble", "froth", "foam", "fizz", "rising"],
    "ocean": ["ocean", "sea", "marine", "deep", "abyss", "water"],
    "turquoise": ["turquoise", "cyan", "blue", "teal", "light-blue", "azure", "clear"],

    "gears": ["gears", "gear", "cogs", "cog", "wheels", "wheel", "clockwork", "machinery"],
    "steampunk": ["steampunk", "victorian", "industrial", "brass", "copper", "retro-tech"],
    "pipes": ["pipes", "pipe", "tubing", "tubes", "conduit", "plumbing"],
    "brass": ["brass", "copper", "bronze", "metallic", "golden"],
    "valve": ["valve", "valves", "regulator", "handle", "control", "faucet"],
    "steam": ["steam", "vapor", "condensation", "mist", "fumes"],
    "lantern": ["lantern", "lamp", "light", "candle", "illumination", "burner"],

    "arcade": ["arcade", "gaming", "gameroom", "cabinet", "machine", "playroom"],
    "joystick": ["joystick", "stick", "lever", "knob", "controller", "button", "buttons"],
    "cabinet": ["cabinet", "chassis", "console", "machine", "box", "housing"],
    "retro": ["retro", "vintage", "classic", "old-school", "nostalgic", "80s", "90s"],
    "pixel": ["pixel", "pixelated", "pixels", "sprite", "8-bit", "16-bit", "aliased"],

    "cabin": ["cabin", "cottage", "chalet", "lodge", "shack", "house", "home"],
    "snowy": ["snowy", "snow", "frosty", "icy", "frozen", "white"],
    "pines": ["pines", "pine", "firs", "spruce", "trees", "forest", "evergreen", "woodland"],
    "winter": ["winter", "cold", "chilly", "seasonal", "solstice"],
    "warm": ["warm", "cozy", "glowing", "inviting", "golden", "amber"],
    "chimney": ["chimney", "hearth", "fireplace", "flue", "pipe"],

    "portal": ["portal", "gate", "gateway", "doorway", "rift", "vortex", "wormhole"],
    "ring": ["ring", "circle", "loop", "torus", "annulus", "hoop", "circular"],
    "energy": ["energy", "plasma", "lightning", "beam", "radiance", "force", "magical"],
    "crystals": ["crystals", "crystal", "gem", "gems", "quartz", "amethyst", "prism"],
    "obelisk": ["obelisk", "pillar", "monolith", "tower", "column", "stone"],
    "stars": ["stars", "starry", "cosmic", "galaxy", "starlight", "nebula"]
  };

  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const keyword of level.targetKeywords) {
    const synonyms = synonymMap[keyword] || [keyword];
    const isMatched = synonyms.some(syn => normalized.includes(syn));
    if (isMatched) {
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  }

  const score = Math.round((matchedKeywords.length / level.targetKeywords.length) * 100);
  const visualElements = getProceduralVisualElements(level.proceduralTheme, matchedKeywords, score);

  let feedback = "";
  if (score === 100) {
    feedback = `Spectacular Prompting! You described all keywords and nuances perfectly. The canvas is fully resolved in high fidelity.`;
  } else if (score >= 50) {
    feedback = `Excellent progress! You matched ${matchedKeywords.length} of the ${level.targetKeywords.length} key aspects ("${matchedKeywords.join(", ")}"). Look at the missing attributes: "${missedKeywords.join(", ")}" and think how to synthesize them into your prompt flow!`;
  } else {
    feedback = `Keep refining your engineering. Focus on describing details, materials, and atmosphere. To unlock more vector elements, try to incorporate keywords matching: "${missedKeywords.join(", ")}".`;
  }

  return {
    score,
    matchedKeywords,
    missedKeywords,
    feedback,
    visualElements,
    isAiEvaluated: false
  };
}

function getProceduralVisualElements(theme: string, matched: string[], score: number): VisualElement[] {
  const elements: VisualElement[] = [];
  
  if (theme === "autumn_fruit") {
    const hasTable = matched.includes("wooden") || matched.includes("table");
    const hasApple = matched.includes("apple");
    
    elements.push({
      type: "table",
      color: hasTable ? "#5c3a21" : "#1a130f",
      visible: true,
      intensity: matched.includes("rustic") ? 0.9 : 0.4,
      label: "Rustic Wooden Table Surface"
    });
    elements.push({
      type: "apple",
      color: matched.includes("red") ? "#d62828" : "#9db4c0",
      visible: hasApple,
      intensity: hasApple ? 1.0 : 0.0,
      label: "Ripe Crimson Apple"
    });
    elements.push({
      type: "leaf",
      color: "#2a9d8f",
      visible: hasApple && score >= 40,
      intensity: 0.8,
      label: "Foliage Leaf Stem"
    });
    elements.push({
      type: "shadow",
      color: "#000000",
      visible: hasTable && hasApple,
      intensity: matched.includes("rustic") ? 0.75 : 0.4,
      label: "Depth Ambient Shadow"
    });
    
  } else if (theme === "cyberpunk_alley") {
    const hasAlley = matched.includes("alley");
    
    elements.push({
      type: "ground",
      color: matched.includes("rainy") ? "#181824" : "#101014",
      visible: true,
      intensity: matched.includes("rainy") ? 0.85 : 0.3,
      label: "Wet Reflective Floor"
    });
    elements.push({
      type: "walls",
      color: "#242530",
      visible: hasAlley,
      intensity: matched.includes("cyberpunk") ? 1.0 : 0.5,
      label: "Distant Alley Perspective Walls"
    });
    elements.push({
      type: "neon_purple",
      color: "#c77dff",
      visible: matched.includes("purple") || matched.includes("neon"),
      intensity: matched.includes("neon") ? 0.9 : 0.4,
      label: "Violet Neon Board"
    });
    elements.push({
      type: "neon_cyan",
      color: "#4cc9f0",
      visible: matched.includes("cyan") || matched.includes("neon"),
      intensity: matched.includes("neon") ? 0.9 : 0.4,
      label: "Cyan Glow Neon Sceptre"
    });
    elements.push({
      type: "rain",
      color: "#6b7280",
      visible: matched.includes("rainy"),
      intensity: score >= 70 ? 0.9 : 0.4,
      label: "Simulated Dripping Raindrops"
    });
    
  } else if (theme === "lost_astronaut") {
    const hasSpace = matched.includes("space");
    const hasSuit = matched.includes("astronaut");
    
    elements.push({
      type: "background",
      color: "#050510",
      visible: true,
      intensity: hasSpace ? 1.0 : 0.2,
      label: "Deep Starry Galactic Voids"
    });
    elements.push({
      type: "nebula",
      color: matched.includes("cosmic") ? "#4f46e5" : "#0f172a",
      visible: matched.includes("cosmic"),
      intensity: 0.65,
      label: "Dust Nebula Color Gradient"
    });
    elements.push({
      type: "astronaut",
      color: "#f8fafc",
      visible: hasSuit,
      intensity: matched.includes("floating") ? 1.0 : 0.5,
      label: "Astronaut Spacesuit Dome"
    });
    elements.push({
      type: "balloon",
      color: matched.includes("yellow") ? "#ffd166" : "#475569",
      visible: matched.includes("balloon"),
      intensity: 1.0,
      label: "Radiant Floating Balloon"
    });
    
  } else if (theme === "forest_sanctuary") {
    const hasForest = matched.includes("forest");
    const hasTemple = matched.includes("temple");
    
    elements.push({
      type: "background",
      color: matched.includes("emerald") ? "#071e14" : "#0f172a",
      visible: true,
      intensity: hasForest ? 1.0 : 0.25,
      label: "Chthonic Dense Pine Canopies"
    });
    elements.push({
      type: "temple",
      color: matched.includes("golden") ? "#ffbe0b" : "#94a3b8",
      visible: hasTemple,
      intensity: matched.includes("minimalist") ? 0.4 : 1.0,
      label: "Zen Pagoda Structure"
    });
    elements.push({
      type: "mist",
      color: "#e2e8f0",
      visible: matched.includes("misty"),
      intensity: score >= 60 ? 0.8 : 0.35,
      label: "Primal Forest Morning Mist"
    });
  } else if (theme === "desert_oasis") {
    const hasDunes = matched.includes("dunes") || matched.includes("desert");
    const hasPool = matched.includes("pool") || matched.includes("oasis");
    const hasPalm = matched.includes("palm");
    const hasSun = matched.includes("sun");

    elements.push({
      type: "dunes",
      color: "#e9c46a",
      visible: true,
      intensity: hasDunes ? 1.0 : 0.4,
      label: "Golden Sand Dunes"
    });
    elements.push({
      type: "pool",
      color: "#2a9d8f",
      visible: hasPool,
      intensity: 1.0,
      label: "Shimmering Oasis Pool"
    });
    elements.push({
      type: "palm",
      color: "#264653",
      visible: hasPalm,
      intensity: 0.85,
      label: "Emerald Palm Fronds"
    });
    elements.push({
      type: "sun",
      color: "#e76f51",
      visible: hasSun,
      intensity: 0.9,
      label: "Blazing Desert Sun"
    });

  } else if (theme === "volcano_caldera") {
    const hasCrater = matched.includes("crater") || matched.includes("volcano");
    const hasLava = matched.includes("lava") || matched.includes("magma");
    const hasSmoke = matched.includes("smoke") || matched.includes("ash");
    const hasGlow = matched.includes("glowing");

    elements.push({
      type: "crater",
      color: "#1d1e22",
      visible: true,
      intensity: hasCrater ? 1.0 : 0.5,
      label: "Dark Basalt Caldera"
    });
    elements.push({
      type: "lava",
      color: "#f95738",
      visible: hasLava,
      intensity: 1.0,
      label: "Liquid Magma Flow"
    });
    elements.push({
      type: "smoke",
      color: "#4a4e69",
      visible: hasSmoke,
      intensity: score >= 60 ? 0.85 : 0.4,
      label: "Rising Ash Plumes"
    });
    elements.push({
      type: "glow",
      color: "#ee964b",
      visible: hasGlow || hasLava,
      intensity: 0.95,
      label: "Sulfuric Volcanic Glow"
    });

  } else if (theme === "subsea_coral") {
    const hasWater = matched.includes("ocean") || matched.includes("turquoise");
    const hasCoral = matched.includes("coral") || matched.includes("reef");
    const hasFish = matched.includes("fish");
    const hasBubbles = matched.includes("bubbles");

    elements.push({
      type: "water",
      color: "#0077b6",
      visible: true,
      intensity: hasWater ? 1.0 : 0.3,
      label: "Clear Turquoise Waters"
    });
    elements.push({
      type: "coral",
      color: "#f35b04",
      visible: hasCoral,
      intensity: 0.9,
      label: "Neon Coral Reefs"
    });
    elements.push({
      type: "fish",
      color: "#ffb703",
      visible: hasFish,
      intensity: 0.85,
      label: "Golden Yellow Fish"
    });
    elements.push({
      type: "bubbles",
      color: "#90e0ef",
      visible: hasBubbles,
      intensity: 0.6,
      label: "Rising Oxygen Bubbles"
    });

  } else if (theme === "steampunk_workshop") {
    const hasBg = matched.includes("steampunk");
    const hasGears = matched.includes("gears");
    const hasPipes = matched.includes("pipes") || matched.includes("brass");
    const hasLantern = matched.includes("lantern");

    elements.push({
      type: "background",
      color: "#2b1c11",
      visible: true,
      intensity: hasBg ? 1.0 : 0.4,
      label: "Industrial Copper Workshop"
    });
    elements.push({
      type: "gears",
      color: "#d4af37",
      visible: hasGears,
      intensity: 0.95,
      label: "Rotating Brass Cogs"
    });
    elements.push({
      type: "pipes",
      color: "#8b5a2b",
      visible: hasPipes,
      intensity: 0.8,
      label: "Exhaust Steam Pipes"
    });
    elements.push({
      type: "lantern",
      color: "#ffbe0b",
      visible: hasLantern,
      intensity: 0.9,
      label: "Warm Amber Lantern"
    });

  } else if (theme === "retro_arcade") {
    const hasRoom = matched.includes("retro") || matched.includes("neon");
    const hasCabinet = matched.includes("arcade") || matched.includes("cabinet");
    const hasScreen = matched.includes("pixel");
    const hasJoy = matched.includes("joystick");

    elements.push({
      type: "room",
      color: "#0b0c10",
      visible: true,
      intensity: hasRoom ? 1.0 : 0.3,
      label: "Dimly Lit Arcade Room"
    });
    elements.push({
      type: "cabinet",
      color: "#1f2833",
      visible: hasCabinet,
      intensity: 0.9,
      label: "Nostalgic Cabinet Shell"
    });
    elements.push({
      type: "screen",
      color: "#66fcf1",
      visible: hasScreen || hasCabinet,
      intensity: 0.85,
      label: "Flashing CRT Display"
    });
    elements.push({
      type: "joystick",
      color: "#c5a059",
      visible: hasJoy,
      intensity: 1.0,
      label: "Tactile Arcade Controls"
    });

  } else if (theme === "snowy_cabin") {
    const hasSky = matched.includes("winter") || matched.includes("snowy");
    const hasPines = matched.includes("pines");
    const hasCabin = matched.includes("cabin");
    const hasSmoke = matched.includes("smoke") || matched.includes("chimney");

    elements.push({
      type: "sky",
      color: "#1a2536",
      visible: true,
      intensity: hasSky ? 1.0 : 0.35,
      label: "Twilight Winter Sky"
    });
    elements.push({
      type: "pines",
      color: "#1e352f",
      visible: hasPines,
      intensity: 0.8,
      label: "Snowy Pine Trees"
    });
    elements.push({
      type: "cabin",
      color: "#5c4033",
      visible: hasCabin,
      intensity: 1.0,
      label: "Warm Wooden Lodge"
    });
    elements.push({
      type: "smoke",
      color: "#d1d5db",
      visible: hasSmoke,
      intensity: 0.75,
      label: "Cozy Chimney Smoke"
    });

  } else if (theme === "celestial_portal") {
    const hasStars = matched.includes("stars") || matched.includes("cosmic");
    const hasObelisks = matched.includes("obelisk");
    const hasPortal = matched.includes("portal") || matched.includes("ring");
    const hasCrystals = matched.includes("crystals");

    elements.push({
      type: "stars",
      color: "#0c0a1a",
      visible: true,
      intensity: hasStars ? 1.0 : 0.3,
      label: "Ethereal Cosmic Void"
    });
    elements.push({
      type: "obelisks",
      color: "#2d3748",
      visible: hasObelisks,
      intensity: 0.75,
      label: "Surrounding Stone Monoliths"
    });
    elements.push({
      type: "portal",
      color: "#3182ce",
      visible: hasPortal,
      intensity: 1.0,
      label: "Glowing Plasma Ring"
    });
    elements.push({
      type: "crystals",
      color: "#805ad5",
      visible: hasCrystals,
      intensity: 0.9,
      label: "Floating Amethyst Geodes"
    });
  }
  
  return elements;
}

// API Endpoints
app.get("/api/levels", (req, res) => {
  res.json(levels);
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const { levelId, prompt, challengeDetails } = req.body;
    
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt submission." });
    }
    
    let level = levels.find(l => l.id === Number(levelId));
    if (!level && Number(levelId) === 100 && challengeDetails) {
      level = {
        id: 100,
        title: challengeDetails.title,
        difficulty: challengeDetails.difficulty || "Hard",
        targetImageUrl: challengeDetails.targetImageUrl || "",
        targetKeywords: challengeDetails.targetKeywords || [],
        hints: challengeDetails.hints || "",
        description: challengeDetails.description || "",
        proceduralTheme: challengeDetails.proceduralTheme || "cyberpunk_alley"
      };
    }
    
    if (!level) {
      return res.status(404).json({ error: "Selected level is invalid." });
    }
    
    // Attempt Gemini Pro Vision / Text semantic comparison if API key is active
    if (ai) {
      try {
        console.log(`Evaluating level ${level.id} using server-side Gemini 3.5-flash...`);
        const targetThemeDesc = `
          The Target Concept is: "${level.description}"
          Target Key-concepts: ${level.targetKeywords.join(", ")}
          Level Difficulty: ${level.difficulty}
          Hints provided: "${level.hints}"
        `;
        
        const evaluationPrompt = `
          You are the visual trainer engine for 'PromptMaster'.
          Your task is to analyze the student's prompt and evaluate how closely it describes the requested target concept.
          
          Target Concept Specification:
          ${targetThemeDesc}
          
          Student's Attempted Prompt:
          "${prompt}"
          
          Based on standard prompt engineering principles (descriptiveness, specifying colors, textures, framing, styles, subjects and backgrounds):
          1. Evaluate and calculate a 'score' from 0 to 100. Be fair:
             - 100 means they described the entire target perfectly with style details.
             - >= 50 means they matched the essential objects and adjectives.
             - < 50 means they missed critical nouns or mismatched the essence entirely.
          2. Calculate which of the target keywords (${level.targetKeywords.join(", ")}) are clearly mentioned or closely referenced as synonyms. Return these in 'matchedKeywords'.
          3. Identify which keywords are fully ignored or missing. Return these in 'missedKeywords'.
          4. Give a brief, encouraging terminal-style feedback message (max 2-3 sentences), highlighting specifically how style/scenery descriptions could be enriched.
          5. Map which of the 4 procedural graphic elements are fulfilled based on their prompt words, configuring HEX colors matching their description.
          
          Target visual layout blueprint types:
          - For theme "autumn_fruit": types are ["table", "apple", "leaf", "shadow"].
          - For theme "cyberpunk_alley": types are ["ground", "walls", "neon_purple", "neon_cyan", "rain"].
          - For theme "lost_astronaut": types are ["background", "nebula", "astronaut", "balloon"].
          - For theme "forest_sanctuary": types are ["background", "temple", "mist"].
          - For theme "desert_oasis": types are ["dunes", "pool", "palm", "sun"].
          - For theme "volcano_caldera": types are ["crater", "lava", "smoke", "glow"].
          - For theme "subsea_coral": types are ["water", "coral", "fish", "bubbles"].
          - For theme "steampunk_workshop": types are ["background", "gears", "pipes", "lantern"].
          - For theme "retro_arcade": types are ["room", "cabinet", "screen", "joystick"].
          - For theme "snowy_cabin": types are ["sky", "pines", "cabin", "smoke"].
          - For theme "celestial_portal": types are ["stars", "obelisks", "portal", "crystals"].

          Provide your response strictly in the JSON layout specified in the schema.
        `;

        const responseObj = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: evaluationPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                missedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualElements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      color: { type: Type.STRING },
                      intensity: { type: Type.NUMBER },
                      visible: { type: Type.BOOLEAN },
                      label: { type: Type.STRING }
                    },
                    required: ["type", "color", "visible", "label"]
                  }
                }
              },
              required: ["score", "feedback", "matchedKeywords", "missedKeywords", "visualElements"]
            }
          }
        });

        const textOutput = responseObj.text?.trim() || "{}";
        const result = JSON.parse(textOutput) as EvaluationResult;
        result.isAiEvaluated = true;
        
        // Ensure score is correct & realistic bound
        if (typeof result.score !== "number") result.score = 0;
        result.score = Math.min(100, Math.max(0, result.score));
        
        return res.json(result);
      } catch (geminiError) {
        console.error("Gemini prompt evaluation errored. Falling back to robust offline evaluators:", geminiError);
        const fallback = evaluateOffline(level, prompt);
        return res.json(fallback);
      }
    } else {
      // Fallback mode
      const result = evaluateOffline(level, prompt);
      return res.json(result);
    }
  } catch (error) {
    console.error("Endpoint execution failure:", error);
    res.status(500).json({ error: "Internal evaluation system breakdown." });
  }
});

// Vite Middleware & Production Routing Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PromptMaster Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
