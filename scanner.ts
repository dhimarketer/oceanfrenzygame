
import { ASSETS } from "./gameConfig";
import { updateAssetAudio } from "./audio";
import { updateAssetImage, getMissingAssets } from "./graphics";

// --- Smart Matching Configuration ---

const KEY_ALIASES: Record<string, string[]> = {
    // Images
    "player": ["fishplayer", "player", "hero", "mainfish", "fish_player", "fish_1", "character"],
    "enemy0": ["fishsmall", "small", "enemy0", "tier0", "fish_small", "fish_2", "guppy"],
    "enemy1": ["fishmedium", "medium", "enemy1", "tier1", "fish_medium", "fish_3"],
    "enemy2": ["fishlarge", "large", "enemy2", "tier2", "fish_large", "fish_4"],
    "enemy3": ["fishgiant", "giant", "enemy3", "tier3", "fish_giant", "fish_5", "whale"],
    "enemy4": ["fishshark", "shark", "enemy4", "tier4", "apex", "fish_shark", "shark", "boss"],
    "gold":   ["fishgold", "gold", "golden", "special", "bonus", "fish_gold", "rare"],
    "mine":   ["mine", "bomb", "spike", "hazard", "trap", "explosive"],
    "jelly":  ["jelly", "jellyfish", "sting", "squid", "medusa"],
    "electric": ["electric", "eel", "shock", "lightning", "volt", "thunder"],
    "shield_item": ["shield", "bubble", "protection", "powerup", "item_shield", "1up"],
    
    "background1": ["bgreef", "reef", "background1", "bg1", "level1", "bg_reef", "shallow"],
    "background2": ["bgdeep", "deep", "background2", "bg2", "level2", "bg_deep", "twilight"],
    "background3": ["bgabyss", "abyss", "background3", "bg3", "level3", "bg_abyss", "dark"],
    "background4": ["bgshipwreck", "shipwreck", "background4", "bg4", "level4", "bg_shipwreck", "ruins"],
    "background5": ["bgtrench", "trench", "background5", "bg5", "level5", "bg_trench", "midnight"],
    
    // Sounds
    "bgm": ["music", "main", "bgm", "theme", "music_main", "song"],
    "eat": ["eat", "chomp", "bite", "sfx_eat", "crunch"],
    "die": ["die", "death", "gameover", "lose", "sfx_die", "fail"],
    "levelup": ["levelup", "level", "grow", "upgrade", "sfx_levelup", "evolve"],
    "dash": ["dash", "boost", "speed", "sfx_dash", "swim"],
    "frenzy": ["frenzy", "powerup", "sfx_frenzy", "bonus_mode"],
    "combo": ["combo", "hit", "score", "sfx_combo", "chain"],
    "win": ["win", "victory", "success", "sfx_win", "complete"],
    "zap": ["zap", "shock", "stun", "sfx_zap", "electric"],
    "explode": ["explode", "boom", "bang", "sfx_explode", "bomb"],
    "shield": ["shield", "bubble", "sfx_shield", "pickup"],
    "suction": ["suction", "inhale", "sfx_suction", "breath"],
};

// Simplify a filename for comparison
const normalizeFilename = (filename: string): string => {
    let name = filename.toLowerCase();
    
    // Remove extension, allowing for potential whitespace before the dot (e.g. "image .png")
    name = name.replace(/\s*\.[^/.]+$/, "");
    
    // Remove " (1)" suffixes (common in downloads)
    name = name.replace(/\s\(\d+\)$/, "");
    
    // Remove all non-alphanumeric chars (underscore, dash, space)
    name = name.replace(/[^a-z0-9]/g, ""); 
    
    return name;
};

export interface ScanResult {
    totalFound: number;
    matchedCount: number;
    autoFilledCount: number;
    errors: string[];
    messages: string[];
}

export const scanUserFolder = async (
    files: FileList | null
): Promise<ScanResult> => {
    const result: ScanResult = {
        totalFound: 0,
        matchedCount: 0,
        autoFilledCount: 0,
        errors: [],
        messages: []
    };

    if (!files || files.length === 0) {
        result.errors.push("No files detected. Please select a folder containing images.");
        return result;
    }
      
    result.totalFound = files.length;
    console.log(`[Scanner] Started scanning ${files.length} files...`);
      
    const promises: Promise<void>[] = [];
    const filledKeys = new Set<string>();
    const unusedImageFiles: File[] = [];

    // --- Pass 1: Strict & Fuzzy Matching ---
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip hidden files
        if (file.name.startsWith("._") || file.name.startsWith(".")) continue;

        const normalizedName = normalizeFilename(file.name);
        let matchedKey: string | null = null;
        
        // Try to match against aliases
        for (const [key, aliases] of Object.entries(KEY_ALIASES)) {
            if (aliases.includes(normalizedName) || normalizedName === key) {
                matchedKey = key;
                break;
            }
            if (aliases.some(alias => normalizedName.includes(alias))) {
                matchedKey = key;
                break;
            }
        }

        if (matchedKey && !filledKeys.has(matchedKey)) {
            console.log(`[Scanner] Match: "${file.name}" -> Key: "${matchedKey}"`);
            result.messages.push(`Matched: ${file.name} -> ${matchedKey}`);
            filledKeys.add(matchedKey);
            result.matchedCount++;
            promises.push(loadFile(matchedKey, file));
        } else {
            // Check extension. File.type can be unreliable/empty on some OS.
            const ext = file.name.split('.').pop()?.toLowerCase().trim();
            const isImage = file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext || "");
            
            if (isImage) {
                unusedImageFiles.push(file);
            }
        }
    }

    // --- Pass 2: Blind Auto-Fill ---
    // Sort unused files alphabetically
    unusedImageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const neededImageKeys = [
        "player", "enemy0", "enemy1", "enemy2", "enemy3", "enemy4", "gold", 
        "mine", "jelly", "electric", "shield_item",
        "background1", "background2", "background3", "background4", "background5"
    ];

    for (const key of neededImageKeys) {
        if (!filledKeys.has(key) && unusedImageFiles.length > 0) {
            const file = unusedImageFiles.shift()!;
            console.log(`[Scanner] Auto-Fill: "${file.name}" -> Key: "${key}"`);
            result.messages.push(`Auto-Filled: ${file.name} -> ${key}`);
            filledKeys.add(key);
            result.autoFilledCount++;
            result.matchedCount++;
            promises.push(loadFile(key, file));
        }
    }

    await Promise.all(promises);
    return result;
};

const loadFile = (key: string, file: File): Promise<void> => {
    return new Promise<void>((resolve) => {
        const isAudioKey = ASSETS.sounds.hasOwnProperty(key);
        const reader = new FileReader();

        if (isAudioKey) {
            reader.onload = (e) => {
                if (e.target?.result instanceof ArrayBuffer) {
                    updateAssetAudio(key, e.target.result).then(() => resolve());
                } else resolve();
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                if (e.target?.result && typeof e.target.result === 'string') {
                    updateAssetImage(key, e.target.result as string, () => resolve());
                } else resolve();
            };
            reader.readAsDataURL(file);
        }
    });
};
