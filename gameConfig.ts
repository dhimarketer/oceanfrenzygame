

export interface LevelConfig {
  goalSize: number;
  bgTop: string;
  bgBottom: string;
  enemySpeedMult: number;
  spawnRate: number;
  name: string;
  bgAsset: string; // Key for the background image in ASSETS
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
    background1: "Background: Level 1",
    background2: "Background: Level 2",
    background3: "Background: Level 3",
    background4: "Background: Level 4",
    background5: "Background: Level 5",
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
    suction: "SFX: Suction/Inhale",
};

export const LEVELS: LevelConfig[] = [
  {
    name: "Shallow Reef",
    goalSize: 40,
    bgTop: "#4ECDC4",
    bgBottom: "#556270",
    enemySpeedMult: 1.0,
    spawnRate: 0.03,
    bgAsset: "background1"
  },
  {
    name: "Twilight Zone",
    goalSize: 70,
    bgTop: "#006994",
    bgBottom: "#003366",
    enemySpeedMult: 1.3,
    spawnRate: 0.045,
    bgAsset: "background2"
  },
  {
    name: "The Abyss",
    goalSize: 100,
    bgTop: "#0f2027",
    bgBottom: "#203a43",
    enemySpeedMult: 1.6,
    spawnRate: 0.06,
    bgAsset: "background3"
  },
  {
    name: "The Shipwreck",
    goalSize: 150,
    bgTop: "#1a2a1a",
    bgBottom: "#0d1a0d",
    enemySpeedMult: 1.8,
    spawnRate: 0.07,
    bgAsset: "background4"
  },
  {
    name: "Midnight Trench",
    goalSize: 250,
    bgTop: "#000000",
    bgBottom: "#0a0a2a",
    enemySpeedMult: 2.2,
    spawnRate: 0.08,
    bgAsset: "background5"
  }
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
  shield: "#00BFFF"
};

export const SCORING = {
  basePoints: 10,
  goldMultiplier: 5,
  frenzyMultiplier: 2,
  comboTimeWindow: 2500, // ms to keep combo alive
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
