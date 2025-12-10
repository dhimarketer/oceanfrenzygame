import React from "react";
import { LEVELS, SCORING, getEnemyProperties } from "./gameConfig";
import { Entity, Particle, FloatingText } from "./types";
import { drawBackground, drawFish, drawBubble, drawParticle, drawFloatingText } from "./graphics";
import { playSound } from "./audio";
import { spawnEnemy } from "./gameLogic";

interface UpdateParams {
    canvas: HTMLCanvasElement;
    player: Entity;
    enemies: Entity[];
    bubbles: Particle[];
    particles: Particle[];
    texts: FloatingText[];
    input: {
        keys: Set<string>;
        mouse: { x: number, y: number };
        mode: "mouse" | "keyboard";
    };
    refs: {
        dashCooldown: React.MutableRefObject<number>;
        frenzyMeter: React.MutableRefObject<number>;
        comboCount: React.MutableRefObject<number>;
        lastEatTime: React.MutableRefObject<number>;
        score: React.MutableRefObject<number>;
        localScore: React.MutableRefObject<number>;
        freezeTimer: React.MutableRefObject<number>; 
    };
    level: number;
    setScore: (s: number) => void;
    setLocalScore: (s: number) => void;
    setCombo: (c: number) => void;
    setFrenzyActive: (b: boolean) => void;
    setGameState: (s: any) => void;
    setGrowthProgress: (n: number) => void;
}

export const updateGame = ({
    canvas, player, enemies, bubbles, particles, texts, input, refs, level,
    setScore, setLocalScore, setCombo, setFrenzyActive, setGameState, setGrowthProgress
}: UpdateParams) => {
    const width = canvas.width;
    const height = canvas.height;
    const levelConfig = LEVELS[level];
    const now = performance.now();
    const { dashCooldown, frenzyMeter, comboCount, lastEatTime, score, localScore, freezeTimer } = refs;

    // -- Cooldowns --
    if (dashCooldown.current > 0) dashCooldown.current--;
    if (player.stunTimer && player.stunTimer > 0) player.stunTimer--;
    if (player.speedBoostTimer && player.speedBoostTimer > 0) player.speedBoostTimer--;
    if (freezeTimer.current && freezeTimer.current > 0) freezeTimer.current--;

    const isFrozen = freezeTimer.current > 0;

    // -- Frenzy Logic --
    if (frenzyMeter.current > 0) frenzyMeter.current -= 0.1;
    const isFrenzy = frenzyMeter.current >= 100;
    setFrenzyActive(isFrenzy);
    
    // -- Combo Logic --
    if (now - lastEatTime.current > SCORING.comboTimeWindow && comboCount.current > 0) {
        comboCount.current = 0;
        setCombo(0);
    }

    // -- Player Movement --
    let baseSpeed = player.speed;
    if (isFrenzy) baseSpeed *= 1.3;
    if (player.speedBoostTimer && player.speedBoostTimer > 0) baseSpeed *= 1.8;
    
    const isStunned = (player.stunTimer || 0) > 0;

    // -- Suction / Inhale Ability --
    const isInhaling = !isStunned && (input.keys.has("contextmenu") || input.keys.has("shift"));
    
    if (isInhaling) {
         baseSpeed *= 0.5;
         if (Math.random() < 0.1) playSound("suction");

         enemies.forEach(e => {
             // Pull items and edible fish
             if (!e.type.includes("item") && (e.type === "mine" || e.type === "jelly" || e.radius >= player.radius * 0.9)) {
                 // Too big to inhale
             } else {
                 const dx = player.x - e.x;
                 const dy = player.y - e.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist < 300) { 
                     if (Math.random() < 0.2) {
                        particles.push({
                            x: e.x, y: e.y,
                            vx: dx * 0.05, vy: dy * 0.05,
                            life: 0.5, color: "rgba(255, 255, 255, 0.3)", size: 1
                        });
                     }
                     e.x += dx * 0.02;
                     e.y += dy * 0.02;
                 }
             }
         });
    }

    if (!isStunned) {
        if (input.mode === "keyboard") {
            let dx = 0, dy = 0;
            const k = input.keys;
            if (k.has("w") || k.has("arrowup")) dy -= 1;
            if (k.has("s") || k.has("arrowdown")) dy += 1;
            if (k.has("a") || k.has("arrowleft")) dx -= 1;
            if (k.has("d") || k.has("arrowright")) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx*dx + dy*dy);
                const targetVx = (dx / len) * baseSpeed;
                const targetVy = (dy / len) * baseSpeed;
                player.vx += (targetVx - player.vx) * 0.1;
                player.vy += (targetVy - player.vy) * 0.1;
            } else {
                player.vx *= 0.95; player.vy *= 0.95;
            }
        } else {
            const dx = input.mouse.x - player.x;
            const dy = input.mouse.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 1) {
                player.vx += ((dx/dist)*baseSpeed - player.vx) * 0.1;
                player.vy += ((dy/dist)*baseSpeed - player.vy) * 0.1;
            } else {
                player.vx *= 0.9; player.vy *= 0.9;
            }
        }

        // Dash Logic
        if (input.keys.has("click") || input.keys.has(" ")) {
             if (dashCooldown.current <= 0) {
                 dashCooldown.current = 60;
                 const boost = 15;
                 let dirX = player.vx, dirY = player.vy;
                 if (Math.abs(dirX) < 0.1 && Math.abs(dirY) < 0.1) { dirX = 1; dirY = 0; }
                 const len = Math.sqrt(dirX*dirX + dirY*dirY) || 1;
                 player.vx = (dirX/len) * boost;
                 player.vy = (dirY/len) * boost;
                 playSound("dash");
                 // Particles
                 for(let i=0; i<8; i++) {
                     particles.push({
                         x: player.x, y: player.y,
                         vx: -player.vx*0.5 + (Math.random()-0.5)*2,
                         vy: -player.vy*0.5 + (Math.random()-0.5)*2,
                         life: 1.0, color: "white", size: 3
                     });
                 }
             }
        }
    } else {
        player.vx *= 0.95;
        player.vy *= 0.95;
    }

    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // -- Level Progress --
    // Player always starts at radius 15 at the beginning of each level
    const startRadius = 15;
    const currentGoal = levelConfig.goalSize;
    const progress = Math.min(1, Math.max(0, (player.radius - startRadius) / (currentGoal - startRadius)));
    setGrowthProgress(progress);

    if (player.radius >= levelConfig.goalSize) {
        playSound("levelup");
        setGameState(level === LEVELS.length - 1 ? "VICTORY" : "LEVEL_COMPLETE");
    }

    // -- Spawning --
    // Spawn less if frozen to prevent stacking
    if (!isFrozen && Math.random() < levelConfig.spawnRate && enemies.length < 40) {
        enemies.push(spawnEnemy(width, height, player.tier, level));
    }
    
    // Bubbles
    if (Math.random() < 0.05) {
        bubbles.push({
            x: Math.random() * width, y: height + 10,
            vx: 0, vy: -1 - Math.random(),
            life: 1, color: "rgba(255,255,255,0.1)", size: 2 + Math.random() * 4
        });
    }

    // -- Entities Loop --
    for(let i=bubbles.length-1; i>=0; i--) {
        const b = bubbles[i];
        b.y += b.vy; b.x += Math.sin(b.y*0.05)*0.5;
        if(b.y < -10) bubbles.splice(i, 1);
    }
    
    for(let i=enemies.length-1; i>=0; i--) {
        const e = enemies[i];
        
        // Entity Movement (Only move if NOT frozen, or if it's an item/jelly drifting)
        // Items and Jellies drift even during freeze for visual flair
        const canMove = !isFrozen || e.type.includes("item"); 

        if (canMove) {
            // Chaser Logic
            if (e.isChaser && e.radius > player.radius && !player.hasShield) {
                const dx = player.x - e.x;
                const dy = player.y - e.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                // Accelerate towards player slightly
                if (dist < 500) {
                    e.vx += (dx/dist) * 0.1;
                    e.vy += (dy/dist) * 0.1;
                    // Cap speed
                    const s = Math.sqrt(e.vx*e.vx + e.vy*e.vy);
                    if (s > e.speed * 1.5) {
                        e.vx = (e.vx/s) * e.speed * 1.5;
                        e.vy = (e.vy/s) * e.speed * 1.5;
                    }
                }
            }

            if (e.type === "jelly") {
                e.y += e.vy;
                if (e.y < -50 || e.y > height + 50) {
                     enemies.splice(i, 1);
                     continue;
                }
            } else if (e.type.includes("item")) {
                e.y += e.vy;
                if (e.y > height + 50) {
                    enemies.splice(i, 1);
                    continue;
                }
            } else {
                e.x += e.vx; e.y += e.vy;
                if((e.vx > 0 && e.x > width + 200) || (e.vx < 0 && e.x < -200)) {
                    enemies.splice(i, 1);
                    continue;
                }
            }
        }

        // Collision
        const d = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
        if (d < player.radius + e.radius) {
            const overlap = 0.8;
            if (d < (player.radius + e.radius) * overlap) {
                
                // --- POWER UP COLLISION ---
                if (e.type.includes("item")) {
                    enemies.splice(i, 1);
                    playSound("powerup");
                    
                    if (e.type === "shield_item") {
                        player.hasShield = true;
                        playSound("shield");
                        texts.push({x: player.x, y: player.y, text: "SHIELD UP!", life: 60, maxLife: 60, color: "#00BFFF"});
                    } else if (e.type === "speed_item") {
                        player.speedBoostTimer = 600; // 10 seconds
                        texts.push({x: player.x, y: player.y, text: "SPEED BOOST!", life: 60, maxLife: 60, color: "#FF4500"});
                    } else if (e.type === "freeze_item") {
                        freezeTimer.current = 300; // 5 seconds
                        playSound("freeze");
                        texts.push({x: player.x, y: player.y, text: "TIME FREEZE!", life: 60, maxLife: 60, color: "#00FFFF"});
                    } else if (e.type === "growth_item") {
                        player.radius += 5;
                        playSound("levelup");
                        texts.push({x: player.x, y: player.y, text: "GROWTH!", life: 60, maxLife: 60, color: "#32CD32"});
                    }
                    continue;
                }

                // --- MINE COLLISION ---
                if (e.type === "mine") {
                    enemies.splice(i, 1);
                    playSound("explode");
                    
                    if (player.hasShield) {
                        player.hasShield = false;
                        texts.push({x: player.x, y: player.y, text: "BLOCKED!", life: 60, maxLife: 60, color: "#00BFFF"});
                        player.stunTimer = 30; 
                    } else {
                        player.radius = Math.max(15, player.radius * 0.7); 
                        player.stunTimer = 60; 
                        texts.push({x: player.x, y: player.y, text: "BOOM!", life: 60, maxLife: 60, color: "red"});
                    }
                    const angle = Math.atan2(player.y - e.y, player.x - e.x);
                    player.vx = Math.cos(angle) * 15;
                    player.vy = Math.sin(angle) * 15;
                    continue;
                }

                // --- JELLY COLLISION ---
                if (e.type === "jelly") {
                    const angle = Math.atan2(player.y - e.y, player.x - e.x);
                    player.vx = Math.cos(angle) * 10;
                    player.vy = Math.sin(angle) * 10;
                    player.stunTimer = 30;
                    playSound("zap");
                    texts.push({x: player.x, y: player.y, text: "OUCH!", life: 40, maxLife: 40, color: "#E040FB"});
                    continue;
                }
                
                // --- FISH COLLISION (Eat or Die) ---
                if (player.radius > e.radius) {
                    // EAT
                    enemies.splice(i, 1);
                    playSound("eat");

                    if (e.type === "electric") {
                         playSound("zap");
                         player.stunTimer = 90;
                         texts.push({x: player.x, y: player.y, text: "STUNNED!", life: 60, maxLife: 60, color: "yellow"});
                    }
                    
                    const isGold = e.type === "gold";
                    
                    const ct = now - lastEatTime.current;
                    if(ct < SCORING.comboTimeWindow) {
                        comboCount.current++;
                        if(comboCount.current > 1) playSound("combo");
                    } else {
                        comboCount.current = 1;
                    }
                    lastEatTime.current = now;
                    setCombo(comboCount.current);

                    const cm = 1 + (comboCount.current * 0.1);
                    const fm = isFrenzy ? SCORING.frenzyMultiplier : 1;
                    const gm = isGold ? SCORING.goldMultiplier : 1;
                    
                    const pts = Math.floor(Math.floor(e.radius) * SCORING.basePoints * 0.1 * cm * fm * gm);
                    // Add to both local score (level-specific) and overall score
                    localScore.current += pts;
                    score.current += pts;
                    setLocalScore(localScore.current);
                    setScore(score.current);

                    const grow = Math.max(0.2, e.radius * 0.05) * (isGold ? 2 : 1);
                    player.radius += grow;
                    frenzyMeter.current = Math.min(100, frenzyMeter.current + (isGold ? 50 : 15));

                    if (e.type !== "electric") {
                        texts.push({
                            x: e.x, y: e.y,
                            text: `+${pts}` + (isGold ? " GOLD" : ""),
                            life: 30, maxLife: 30,
                            color: isGold ? "gold" : (comboCount.current > 3 ? "#76ff03" : "#fff")
                        });
                    }

                } else {
                    // DIE
                    if (!isStunned) { 
                        if (player.hasShield) {
                            player.hasShield = false;
                            playSound("explode"); 
                            texts.push({x: player.x, y: player.y, text: "SHIELD BROKEN!", life: 60, maxLife: 60, color: "#00BFFF"});
                            const angle = Math.atan2(player.y - e.y, player.x - e.x);
                            player.vx = Math.cos(angle) * 20;
                            player.vy = Math.sin(angle) * 20;
                            player.stunTimer = 45;
                        } else {
                            playSound("die");
                            setGameState("GAMEOVER");
                        }
                    }
                }
            }
        }
    }
    
    // Particles & Text
    for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if(p.life <= 0) particles.splice(i, 1);
    }
    for(let i=texts.length-1; i>=0; i--) {
        const t = texts[i];
        t.y -= 1; t.life--;
        if(t.life <= 0) texts.splice(i, 1);
    }
};

export interface DrawParams {
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null | undefined;
    gameState: string;
    level: number;
    player: Entity;
    enemies: Entity[];
    bubbles: Particle[];
    particles: Particle[];
    texts: FloatingText[];
    frenzyActive: boolean;
    inputMode: "mouse" | "keyboard";
    mouse: { x: number, y: number };
}

export const drawGame = ({
    canvas, ctx, gameState, level, player, enemies, bubbles, particles, texts, frenzyActive, inputMode, mouse
}: DrawParams) => {
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const levelConfig = LEVELS[level];

    // Clear and Background
    ctx.clearRect(0, 0, width, height);
    
    // Determine background asset
    const bgAsset = levelConfig ? levelConfig.bgAsset : "background1";
    const bgTop = levelConfig ? levelConfig.bgTop : "#000";
    const bgBottom = levelConfig ? levelConfig.bgBottom : "#000";

    drawBackground(ctx, width, height, bgTop, bgBottom, bgAsset);

    if (gameState === "PLAYING" || gameState === "PAUSED" || gameState === "GAMEOVER" || gameState === "VICTORY" || gameState === "LEVEL_COMPLETE") {
        // Bubbles (Background layer)
        bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.size, b.color));

        // Enemies
        enemies.forEach(e => {
            const facingRight = e.vx > 0;
            drawFish(ctx, e, false, false, facingRight);
        });

        // Player
        if (gameState !== "GAMEOVER" || (gameState === "GAMEOVER" && player.radius > 0)) {
             const facingRight = inputMode === "mouse" 
                ? mouse.x > player.x 
                : player.vx > 0;
             drawFish(ctx, player, true, frenzyActive, facingRight);
        }

        // Particles
        particles.forEach(p => drawParticle(ctx, p.x, p.y, p.size, p.color, p.life));

        // Floating Texts
        texts.forEach(t => drawFloatingText(ctx, t.x, t.y, t.text, t.color, t.life, t.maxLife));
        
        // Cursor
        if (inputMode === "mouse" && gameState === "PLAYING") {
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
};
