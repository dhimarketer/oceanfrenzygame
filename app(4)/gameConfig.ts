

export interface LevelConfig {
  goalSize: number;
  bgTop: string;
  bgBottom: string;
  enemySpeedMult: number;
  spawnRate: number;
  name: string;
  bgAsset: string; // Key for the background image in ASSETS
  hazardProb: number; // General hazard probability
}

// NOTE: Ensure your files are in an 'assets' folder next to your index.html
// If files are missing, the game will use built-in fallbacks (procedural graphics/synthesis).
export const ASSETS = {
  images: {
    background1: "./assets/bg_reef.png",
    background2: "./assets/bg_deep.png",
    background3: "./assets/bg_abyss.png",
    background4: "./assets/bg_shipwreck.png",
    background5: "./assets/bg_trench.png",
    // Extra slots for user customization
    background6: "./assets/bg_custom1.png",
    background7: "./assets/bg_custom2.png",
    background8: "./assets/bg_custom3.png",
    background9: "./assets/bg_custom4.png",
    background10: "./assets/bg_custom5.png",
    
    player: "./assets/fish_player.png",
    enemy0: "./assets/fish_small.png",
    enemy1: "./assets/fish_medium.png",
    enemy2: "./assets/fish_large.png",
    enemy3: "./assets/fish_giant.png",
    enemy4: "./assets/fish_shark.png",
    gold: "./assets/fish_gold.png",
    mine: "./assets/mine.png",
    jelly: "./assets/jelly.png",
    electric: "./assets/electric.png",
    shield_item: "./assets/shield_item.png",
    speed_item: "./assets/speed_item.png",
    freeze_item: "./assets/freeze_item.png",
    growth_item: "./assets/growth_item.png",
  },
  sounds: {
    bgm: "./assets/music_main.mp3",
    eat: "./assets/sfx_eat.mp3",
    die: "./assets/sfx_die.mp3",
    levelup: "./assets/sfx_levelup.mp3",
    dash: "./assets/sfx_dash.mp3",
    frenzy: "./assets/sfx_frenzy.mp3",
    combo: "./assets/sfx_combo.mp3",
    win: "./assets/sfx_win.mp3",
    zap: "./assets/sfx_zap.mp3",
    explode: "./assets/sfx_explode.mp3",
    shield: "./assets/sfx_shield.mp3",
    suction: "./assets/sfx_suction.mp3",
    powerup: "./assets/sfx_powerup.mp3",
    freeze: "./assets/sfx_freeze.mp3",
  }
};

export const ASSET_LABELS: Record<string, string> = {
    player: "Player Fish",
    enemy0: "Small Enemy (Tier 1)",
    enemy1: "Medium Enemy (Tier 2)",
    enemy2: "Large Enemy (Tier 3)",
    enemy3: "Giant Enemy (Tier 4)",
    enemy4: "Shark / Apex (Tier 5)",
    gold: "Golden Fish (Special)",
    mine: "Sea Mine (Hazard)",
    jelly: "Jellyfish (Hazard)",
    electric: "Electric Eel (Hazard)",
    shield_item: "Shield Power-up",
    speed_item: "Speed Bolt (Power-up)",
    freeze_item: "Stopwatch (Power-up)",
    growth_item: "Growth Pill (Power-up)",
    background1: "BG: Reef",
    background2: "BG: Deep",
    background3: "BG: Abyss",
    background4: "BG: Shipwreck",
    background5: "BG: Trench",
    background6: "BG: Custom 6",
    background7: "BG: Custom 7",
    background8: "BG: Custom 8",
    background9: "BG: Custom 9",
    background10: "BG: Custom 10",
    
    // Sounds
    bgm: "Music: Background",
    eat: "SFX: Eat",
    die: "SFX: Game Over",
    levelup: "SFX: Level Up",
    dash: "SFX: Dash",
    frenzy: "SFX: Frenzy",
    combo: "SFX: Combo",
    win: "SFX: Victory",
    zap: "SFX: Electric Shock",
    explode: "SFX: Explosion",
    shield: "SFX: Shield Up",
    suction: "SFX: Suction",
    powerup: "SFX: General Power-up",
    freeze: "SFX: Time Freeze",
};

// Procedural Level Generation or Defined 20 Levels
export const LEVELS: LevelConfig[] = [
  // --- ZONE 1: REEF (Tutorial & Speed) ---
  { name: "1-1: Shallow Reef", goalSize: 40, bgTop: "#4ECDC4", bgBottom: "#556270", enemySpeedMult: 1.0, spawnRate: 0.03, bgAsset: "background1", hazardProb: 0.0 },
  { name: "1-2: Feeding Time", goalSize: 55, bgTop: "#4ECDC4", bgBottom: "#556270", enemySpeedMult: 1.1, spawnRate: 0.04, bgAsset: "background1", hazardProb: 0.01 },
  { name: "1-3: Gold Rush",    goalSize: 70, bgTop: "#4ECDC4", bgBottom: "#556270", enemySpeedMult: 1.2, spawnRate: 0.05, bgAsset: "background1", hazardProb: 0.02 },
  { name: "1-4: Reef Shark",   goalSize: 90, bgTop: "#3b9a92", bgBottom: "#44505b", enemySpeedMult: 1.3, spawnRate: 0.05, bgAsset: "background1", hazardProb: 0.03 },

  // --- ZONE 2: TWILIGHT (Jellyfish & Electric) ---
  { name: "2-1: The Drop-off", goalSize: 110, bgTop: "#006994", bgBottom: "#003366", enemySpeedMult: 1.3, spawnRate: 0.04, bgAsset: "background2", hazardProb: 0.05 },
  { name: "2-2: Sting City",   goalSize: 130, bgTop: "#006994", bgBottom: "#003366", enemySpeedMult: 1.4, spawnRate: 0.05, bgAsset: "background2", hazardProb: 0.08 },
  { name: "2-3: Shock Wave",   goalSize: 150, bgTop: "#006994", bgBottom: "#003366", enemySpeedMult: 1.5, spawnRate: 0.05, bgAsset: "background2", hazardProb: 0.10 },
  { name: "2-4: Deep Dive",    goalSize: 175, bgTop: "#005073", bgBottom: "#002244", enemySpeedMult: 1.6, spawnRate: 0.06, bgAsset: "background2", hazardProb: 0.12 },

  // --- ZONE 3: ABYSS (Mines & Darkness) ---
  { name: "3-1: Into Darkness", goalSize: 200, bgTop: "#0f2027", bgBottom: "#203a43", enemySpeedMult: 1.6, spawnRate: 0.05, bgAsset: "background3", hazardProb: 0.15 },
  { name: "3-2: Minefield",     goalSize: 230, bgTop: "#0f2027", bgBottom: "#203a43", enemySpeedMult: 1.7, spawnRate: 0.06, bgAsset: "background3", hazardProb: 0.20 },
  { name: "3-3: Bioluminescence", goalSize: 260, bgTop: "#0f2027", bgBottom: "#203a43", enemySpeedMult: 1.8, spawnRate: 0.07, bgAsset: "background3", hazardProb: 0.15 },
  { name: "3-4: The Void",      goalSize: 300, bgTop: "#051014", bgBottom: "#102025", enemySpeedMult: 1.9, spawnRate: 0.07, bgAsset: "background3", hazardProb: 0.20 },

  // --- ZONE 4: SHIPWRECK (Density & Chaos) ---
  { name: "4-1: Sunken Hope",   goalSize: 340, bgTop: "#1a2a1a", bgBottom: "#0d1a0d", enemySpeedMult: 1.8, spawnRate: 0.06, bgAsset: "background4", hazardProb: 0.10 },
  { name: "4-2: Treasure Trove", goalSize: 380, bgTop: "#1a2a1a", bgBottom: "#0d1a0d", enemySpeedMult: 1.9, spawnRate: 0.08, bgAsset: "background4", hazardProb: 0.15 },
  { name: "4-3: Skeleton Crew", goalSize: 420, bgTop: "#1a2a1a", bgBottom: "#0d1a0d", enemySpeedMult: 2.0, spawnRate: 0.08, bgAsset: "background4", hazardProb: 0.18 },
  { name: "4-4: Ghost Ship",    goalSize: 460, bgTop: "#0f1a0f", bgBottom: "#050a05", enemySpeedMult: 2.1, spawnRate: 0.09, bgAsset: "background4", hazardProb: 0.20 },

  // --- ZONE 5: TRENCH (Nightmare Mode) ---
  { name: "5-1: Pressure Point", goalSize: 500, bgTop: "#000000", bgBottom: "#0a0a2a", enemySpeedMult: 2.2, spawnRate: 0.07, bgAsset: "background5", hazardProb: 0.20 },
  { name: "5-2: Leviathan",      goalSize: 550, bgTop: "#000000", bgBottom: "#0a0a2a", enemySpeedMult: 2.3, spawnRate: 0.08, bgAsset: "background5", hazardProb: 0.25 },
  { name: "5-3: Midnight Zone",  goalSize: 600, bgTop: "#000000", bgBottom: "#0a0a2a", enemySpeedMult: 2.4, spawnRate: 0.09, bgAsset: "background5", hazardProb: 0.30 },
  { name: "5-4: KING OF SEAS",   goalSize: 700, bgTop: "#000000", bgBottom: "#050515", enemySpeedMult: 2.5, spawnRate: 0.10, bgAsset: "background5", hazardProb: 0.35 }
];

export const COLORS = {
  player: "#FF6B6B", // Coral Red
  gold: "#FFD700",   // Golden Fish
  tier0: "#A8E6CF", // Light Green
  tier1: "#DCEDC1", // Pale Yellow
  tier2: "#FFD3B6", // Peach
  tier3: "#FF8B94", // Pinkish Red
  tier4: "#2C3E50", // Dark Shark
  mine: "#333333",
  jelly: "#E040FB",
  electric: "#FFFF00",
  shield: "#00BFFF",
  speed: "#FF4500",
  freeze: "#00FFFF",
  growth: "#32CD32",
  chaser: "#FF0000" // Angry fish
};

export const SCORING = {
  basePoints: 10,
  goldMultiplier: 5,
  frenzyMultiplier: 2,
  comboTimeWindow: 2500,
};

// Logic to determine enemy properties based on tier
export const getEnemyProperties = (tier: number) => {
    switch(tier) {
        case 0: return { r: 10 + Math.random() * 5, c: COLORS.tier0, asset: "enemy0" };
        case 1: return { r: 25 + Math.random() * 8, c: COLORS.tier1, asset: "enemy1" };
        case 2: return { r: 45 + Math.random() * 10, c: COLORS.tier2, asset: "enemy2" };
        case 3: return { r: 70 + Math.random() * 15, c: COLORS.tier3, asset: "enemy3" };
        case 4: return { r: 110 + Math.random() * 20, c: COLORS.tier4, asset: "enemy4" };
        default: return { r: 10, c: COLORS.tier0, asset: "enemy0" };
    }
};
