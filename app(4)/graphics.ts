


import { ASSETS } from "./gameConfig";
import { Entity } from "./types";

// This file contains all the rendering logic.

export interface RenderEntity {
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    color: string;
    type: "normal" | "gold" | "mine" | "jelly" | "electric" | "shield_item" | "speed_item" | "freeze_item" | "growth_item";
    tier: number; // Used for asset lookup
    stunTimer?: number;
    oscillationOffset?: number;
    hasShield?: boolean;
    speedBoostTimer?: number;
    isChaser?: boolean;
}

// --- Asset Management ---

const loadedImages: Record<string, HTMLImageElement> = {};
const missingAssets: string[] = [];

// FIX: Return a copy of the array so React detects state changes
export const getMissingAssets = () => [...missingAssets];

// Helper to get the current source URL for settings preview
export const getCurrentAssetUrl = (key: string): string | null => {
    return loadedImages[key] ? loadedImages[key].src : null;
};

// --- Smart Background Removal ---
// Automatically detects and removes the background color based on corner pixels.
// Uses a Flood Fill algorithm with tolerance to handle artifacts.
const smartRemoveBackground = (img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img.src;

    ctx.drawImage(img, 0, 0);
    
    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        // Helper: Get pixel index
        const getIdx = (x: number, y: number) => (y * w + x) * 4;

        // 1. Sample Top-Left Pixel as Target Background Color
        // We assume the top-left corner is background.
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        // If it's already transparent, abort
        if (bgA === 0) return img.src;

        // 2. Flood Fill (BFS)
        const queue: number[] = [];
        const visited = new Uint8Array(w * h); // 0 = unvisited, 1 = visited

        // Tolerance for compression noise (0-255)
        const TOLERANCE = 40; 
        const matchCondition = (r: number, g: number, b: number) => {
            return Math.abs(r - bgR) < TOLERANCE &&
                   Math.abs(g - bgG) < TOLERANCE &&
                   Math.abs(b - bgB) < TOLERANCE;
        };

        // Seed all 4 corners if they match the background color
        // This handles cases where the fish touches an edge and splits the background
        const corners = [[0,0], [w-1, 0], [0, h-1], [w-1, h-1]];
        
        for (const [cx, cy] of corners) {
            const idx = getIdx(cx, cy);
            if (matchCondition(data[idx], data[idx+1], data[idx+2])) {
                queue.push(cx, cy);
                visited[cy * w + cx] = 1;
            }
        }

        // If no corners match (e.g. full screen image), return original
        if (queue.length === 0) return img.src;

        console.log(`[Graphics] Removing background (RGB: ${bgR},${bgG},${bgB}) from image...`);

        while (queue.length > 0) {
            const y = queue.pop()!;
            const x = queue.pop()!;
            
            const idx = getIdx(x, y);
            
            // Make Transparent
            data[idx + 3] = 0;

            // Check Neighbors (Up, Down, Left, Right)
            const neighbors = [
                [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nPos = ny * w + nx;
                    if (visited[nPos] === 0) {
                        const nIdx = getIdx(nx, ny);
                        if (matchCondition(data[nIdx], data[nIdx+1], data[nIdx+2])) {
                            visited[nPos] = 1;
                            queue.push(nx, ny);
                        }
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL();

    } catch (e) {
        console.warn("[Graphics] CORS error or processing failed. Using original.", e);
        return img.src;
    }
};

// Helper to hot-swap an asset from a Blob URL
// Added callback for when processing is fully done
export const updateAssetImage = (key: string, url: string, onComplete?: () => void) => {
    const img = new Image();
    img.onload = () => {
        // Auto-fix transparency for Entities (not backgrounds)
        const isBackground = key.startsWith("background") || key.startsWith("bg");
        if (!isBackground) {
            // Apply smart removal
            const processed = smartRemoveBackground(img);
            if (processed !== img.src) {
                const finalImg = new Image();
                finalImg.onload = () => {
                    loadedImages[key] = finalImg;
                    console.log(`[Graphics] Hot-swapped & Processed: ${key}`);
                    if (onComplete) onComplete();
                };
                finalImg.src = processed;
                return;
            }
        }

        loadedImages[key] = img;
        console.log(`[Graphics] Hot-swapped asset: ${key}`);
        
        // Remove from missing list
        const missingIndex = missingAssets.findIndex(str => str.includes(`(Key: ${key})`));
        if (missingIndex > -1) {
            missingAssets.splice(missingIndex, 1);
        }
        
        if (onComplete) onComplete();
    };
    img.src = url.trim();
};

// Helper to reset an asset to default
export const resetAssetToDefault = (key: string, onComplete?: () => void) => {
    // @ts-ignore
    const defaultUrl = ASSETS.images[key];
    if (defaultUrl) {
        // Force cache bust to reload original
        const bustUrl = defaultUrl.trim() + "?t=" + new Date().getTime();
        updateAssetImage(key, bustUrl, onComplete);
    }
};

export const loadGraphicsAssets = async (): Promise<void> => {
  const promises = Object.entries(ASSETS.images).map(([key, url]) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      const cleanUrl = url.trim();

      img.onload = () => {
        const isBackground = key.startsWith("background") || key.startsWith("bg");
        
        if (!isBackground) {
             const processed = smartRemoveBackground(img);
             if (processed !== img.src) {
                 const finalImg = new Image();
                 finalImg.onload = () => {
                     loadedImages[key] = finalImg;
                     console.log(`[Graphics] Loaded & Processed: ${key}`);
                     resolve();
                 };
                 finalImg.src = processed;
                 return;
             }
        }

        loadedImages[key] = img;
        console.log(`[Graphics] Loaded: ${key}`);
        resolve();
      };
      
      img.onerror = () => {
        console.warn(`[Graphics] Failed to load: ${cleanUrl} (Key: ${key}). Using fallback graphics.`);
        missingAssets.push(`${cleanUrl} (Key: ${key})`);
        resolve(); 
      };

      img.src = cleanUrl + "?t=" + new Date().getTime();
    });
  });
  await Promise.all(promises);
};

// --- Drawing Functions ---

export const drawBackground = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  topColor: string, 
  bottomColor: string,
  assetKey?: string
) => {
    const img = assetKey ? loadedImages[assetKey] : null;

    if (img) {
        // Draw image covering the canvas (like object-fit: cover)
        const ratio = Math.max(width / img.width, height / img.height);
        const centerShift_x = (width - img.width * ratio) / 2;
        const centerShift_y = (height - img.height * ratio) / 2;
        
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        
        // Add a slight dark overlay to ensure game elements pop
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, width, height);
    } else {
        // Fallback Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
};

const drawMine = (ctx: CanvasRenderingContext2D, r: number) => {
    const img = loadedImages["mine"];
    if (img) {
        ctx.drawImage(img, -r, -r, r*2, r*2);
        return;
    }
    // Fallback Mine
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(0,0,r*0.8,0,Math.PI*2);
    ctx.fill();
    // Spikes
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 4;
    for(let i=0; i<8; i++) {
        ctx.rotate(Math.PI/4);
        ctx.beginPath();
        ctx.moveTo(r*0.8,0);
        ctx.lineTo(r*1.2,0);
        ctx.stroke();
    }
    // Red Light
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(0, -r*0.3, r*0.15, 0, Math.PI*2);
    ctx.fill();
};

const drawJelly = (ctx: CanvasRenderingContext2D, r: number, offset: number) => {
    const img = loadedImages["jelly"];
    const pulse = Math.sin(performance.now() * 0.005 + offset) * 0.1;

    if (img) {
        const h = r * 2 * (1 + pulse);
        const w = r * 2 * (1 - pulse * 0.5);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        return;
    }
    // Fallback Jelly
    ctx.fillStyle = "rgba(224, 64, 251, 0.6)";
    ctx.beginPath();
    ctx.arc(0, -r*0.2, r, Math.PI, 0); // Head
    ctx.fill();
    // Tentacles
    ctx.strokeStyle = "rgba(224, 64, 251, 0.4)";
    ctx.lineWidth = 2;
    for(let i=-2; i<=2; i++) {
        ctx.beginPath();
        ctx.moveTo(i*r*0.3, -r*0.2);
        ctx.lineTo(i*r*0.3 + Math.sin(performance.now()*0.01 + i)*5, r);
        ctx.stroke();
    }
};

const drawPowerUp = (ctx: CanvasRenderingContext2D, r: number, type: string) => {
    let imgKey = "shield_item";
    let color = "#00BFFF";
    let fallbackText = "?";

    if (type === "shield_item") { imgKey = "shield_item"; color = "#00BFFF"; fallbackText = "🛡️"; }
    else if (type === "speed_item") { imgKey = "speed_item"; color = "#FF4500"; fallbackText = "⚡"; }
    else if (type === "freeze_item") { imgKey = "freeze_item"; color = "#00FFFF"; fallbackText = "❄️"; }
    else if (type === "growth_item") { imgKey = "growth_item"; color = "#32CD32"; fallbackText = "🍄"; }

    const img = loadedImages[imgKey];
    
    // Bobbing animation
    const bob = Math.sin(performance.now() * 0.005) * 5;
    ctx.translate(0, bob);

    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;

    if (img) {
        ctx.drawImage(img, -r, -r, r*2, r*2);
    } else {
        // Fallback
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(fallbackText, 0, 0);
    }
    ctx.shadowBlur = 0;
};

export const drawFish = (
  ctx: CanvasRenderingContext2D, 
  fish: RenderEntity, 
  isPlayer: boolean, 
  isFrenzy: boolean, 
  facingRight: boolean
) => {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    
    // Stunned Effect (Shake)
    if (fish.stunTimer && fish.stunTimer > 0) {
        ctx.translate((Math.random()-0.5)*5, (Math.random()-0.5)*5);
    }

    // Handle Rotation/Orientation
    if (fish.type === "jelly") {
        // Vertical entities don't rotate left/right like fish
        // Just Pulse
    } else if (fish.type === "mine") {
        // Mines spin slowly
        ctx.rotate(performance.now() * 0.001);
    } else if (fish.type.includes("item")) {
        // Items float upright
    } else {
         // Fish Orientation
        const tiltAmount = Math.max(-0.45, Math.min(0.45, fish.vy * 0.08));
        if (facingRight) {
            ctx.rotate(tiltAmount);
        } else {
            ctx.scale(-1, 1);
            ctx.rotate(-tiltAmount);
        }
    }

    // Shadows & Glows
    if (fish.type === "gold") {
        ctx.shadowBlur = 20; ctx.shadowColor = "gold";
    } else if (fish.type === "electric") {
        ctx.shadowBlur = 15; ctx.shadowColor = "#FFFF00";
    } else if (fish.isChaser) {
        ctx.shadowBlur = 10; ctx.shadowColor = "red";
    } else if (isPlayer) {
        if (isFrenzy) {
            ctx.shadowBlur = 20; ctx.shadowColor = "#FFD700";
        } else if ((fish.speedBoostTimer || 0) > 0) {
            ctx.shadowBlur = 20; ctx.shadowColor = "#FF4500";
        } else {
            ctx.shadowBlur = 10; ctx.shadowColor = "rgba(0,0,0,0.5)";
        }
    }

    // Render Logic Based on Type
    if (fish.type === "mine") {
        drawMine(ctx, fish.radius);
    } else if (fish.type === "jelly") {
        drawJelly(ctx, fish.radius, fish.oscillationOffset || 0);
    } else if (fish.type.includes("item")) {
        drawPowerUp(ctx, fish.radius, fish.type);
    } else {
        // Standard Fish Rendering (Normal, Gold, Electric, Player)
        let assetKey = "";
        if (isPlayer) assetKey = "player";
        else if (fish.type === "gold") assetKey = "gold";
        else if (fish.type === "electric") assetKey = "electric";
        else assetKey = `enemy${Math.min(4, fish.tier)}`;

        const img = loadedImages[assetKey];
        if (img) {
            const visualScale = 1.35; 
            const aspect = img.width / img.height;
            const drawHeight = fish.radius * 2 * visualScale;
            const drawWidth = drawHeight * aspect;
            
            // Chaser Filter (Tint Red)
            if (fish.isChaser && !isPlayer) {
                // In a complex engine we'd use composite operations, but canvas simple drawImage is faster
                // We'll just rely on the red shadow glow added above
            }
            
            ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        } else {
            // Procedural Fallback
            ctx.fillStyle = fish.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, fish.radius, fish.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(-fish.radius * 0.8, 0);
            ctx.lineTo(-fish.radius * 1.6, -fish.radius * 0.6);
            ctx.lineTo(-fish.radius * 1.6, fish.radius * 0.6);
            ctx.fill();
        }
    }

    // Electric Overlay Effect
    if (fish.type === "electric") {
        if (Math.floor(performance.now() / 100) % 2 === 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, fish.radius * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Stunned Overlay
    if (fish.stunTimer && fish.stunTimer > 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "yellow";
        ctx.fillText("⚡", 0, -fish.radius);
    }
    
    // Player Shield Overlay
    if (isPlayer && fish.hasShield) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00BFFF";
        ctx.fillStyle = "rgba(0, 191, 255, 0.3)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, fish.radius * 1.5, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
    }
    
    // Player Speed Boost Overlay
    if (isPlayer && (fish.speedBoostTimer || 0) > 0) {
        ctx.strokeStyle = "#FF4500";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, fish.radius * 1.3, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore();
};

export const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
};

export const drawParticle = (
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    size: number, color: string, 
    alpha: number
) => {
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
};

export const drawFloatingText = (
    ctx: CanvasRenderingContext2D, 
    x: number, y: number, 
    text: string, color: string, 
    life: number, maxLife: number
) => {
    ctx.save();
    const alpha = life / maxLife;
    ctx.globalAlpha = alpha;
    ctx.font = "900 24px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
};
