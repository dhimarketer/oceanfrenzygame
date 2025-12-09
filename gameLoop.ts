
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
    };
    level: number;
    setScore: (s: number) => void;
    setCombo: (c: number) => void;
    setFrenzyActive: (b: boolean) => void;
    setGameState: (s: any) => void;
    setGrowthProgress: (n: number) => void;
}

export const updateGame = ({
    canvas, player, enemies, bubbles, particles, texts, input, refs, level,
    setScore, setCombo, setFrenzyActive, setGameState, setGrowthProgress
}: UpdateParams) => {
    const width = canvas.width;
    const height = canvas.height;
    const levelConfig = LEVELS[level];
    const now = performance.now();
    const { dashCooldown, frenzyMeter, comboCount, lastEatTime, score } = refs;

    // -- Cooldowns --
    if (dashCooldown.current > 0) dashCooldown.current--;
    if (player.stunTimer && player.stunTimer > 0) player.stunTimer--;

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
    
    const isStunned = (player.stunTimer || 0) > 0;

    // -- Suction / Inhale Ability --
    // Right Click or Shift Key
    const isInhaling = !isStunned && (input.keys.has("contextmenu") || input.keys.has("shift"));
    
    if (isInhaling) {
         // Slow down player while inhaling
         baseSpeed *= 0.5;
         
         // Only play sound periodically
         if (Math.random() < 0.1) playSound("suction");

         // Physics: Pull edible fish closer
         enemies.forEach(e => {
             // Only affect things we can eat (smaller radius)
             if (e.type !== "mine" && e.type !== "jelly" && e.radius < player.radius * 0.9) {
                 const dx = player.x - e.x;
                 const dy = player.y - e.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 if (dist < 300) { // Range
                     // Visual: Stream lines
                     if (Math.random() < 0.2) {
                        particles.push({
                            x: e.x, y: e.y,
                            vx: dx * 0.05, vy: dy * 0.05,
                            life: 0.5, color: "rgba(255, 255, 255, 0.3)", size: 1
                        });
                     }
                     // Pull force
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
        const currentSpeed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
        if (dashCooldown.current < 50 && currentSpeed > baseSpeed * 1.5) {
            player.vx *= 0.9; 
            player.vy *= 0.9;
        }

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
        // Stunned movement: Drift loosely
        player.vx *= 0.95;
        player.vy *= 0.95;
    }

    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // -- Level Progress --
    const prevGoal = level === 0 ? 15 : LEVELS[level-1].goalSize;
    const currentGoal = levelConfig.goalSize;
    const progress = Math.min(1, Math.max(0, (player.radius - prevGoal) / (currentGoal - prevGoal)));
    setGrowthProgress(progress);

    if (player.radius >= levelConfig.goalSize) {
        playSound("levelup");
        setGameState(level === LEVELS.length - 1 ? "VICTORY" : "LEVEL_COMPLETE");
    }

    // -- Spawning --
    if (Math.random() < levelConfig.spawnRate && enemies.length < 30) {
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
        
        // Entity Movement
        if (e.type === "jelly") {
            e.y += e.vy;
            if (e.y < -50 || e.y > height + 50) {
                 enemies.splice(i, 1);
                 continue;
            }
        } else if (e.type === "shield_item") {
            e.y += e.vy;
            if (e.y > height + 50) {
                enemies.splice(i, 1);
                continue;
            }
        } else {
            // Horizontal swim
            e.x += e.vx; e.y += e.vy;
            if((e.vx > 0 && e.x > width + 200) || (e.vx < 0 && e.x < -200)) {
                enemies.splice(i, 1);
                continue;
            }
        }

        // Collision
        const d = Math.sqrt((player.x - e.x)**2 + (player.y - e.y)**2);
        if (d < player.radius + e.radius) {
            const overlap = 0.8;
            if (d < (player.radius + e.radius) * overlap) {
                
                // --- SHIELD ITEM PICKUP ---
                if (e.type === "shield_item") {
                    enemies.splice(i, 1);
                    player.hasShield = true;
                    playSound("shield");
                    texts.push({x: player.x, y: player.y, text: "SHIELD UP!", life: 60, maxLife: 60, color: "#00BFFF"});
                    continue;
                }

                // --- MINE COLLISION ---
                if (e.type === "mine") {
                    enemies.splice(i, 1);
                    playSound("explode");
                    
                    if (player.hasShield) {
                        // Shield blocks damage
                        player.hasShield = false;
                        texts.push({x: player.x, y: player.y, text: "BLOCKED!", life: 60, maxLife: 60, color: "#00BFFF"});
                        player.stunTimer = 30; // Minor stun
                    } else {
                        // Damage
                        player.radius = Math.max(15, player.radius * 0.7); 
                        player.stunTimer = 60; 
                        texts.push({x: player.x, y: player.y, text: "BOOM!", life: 60, maxLife: 60, color: "red"});
                    }
                    
                    // Knockback
                    const angle = Math.atan2(player.y - e.y, player.x - e.x);
                    player.vx = Math.cos(angle) * 15;
                    player.vy = Math.sin(angle) * 15;

                    for(let p=0; p<15; p++) {
                        particles.push({
                            x: e.x, y: e.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                            life: 1.5, color: "orange", size: 5
                        });
                    }
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
                         for(let p=0; p<10; p++) {
                            particles.push({x: player.x, y: player.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color: "yellow", size: 3});
                         }
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
                    score.current += pts;
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
                    
                    for(let p=0; p<5; p++) {
                        particles.push({
                            x: e.x, y: e.y,
                            vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
                            life: 1, color: e.color, size: 4
                        });
                    }

                } else {
                    // DIE (eaten by bigger fish)
                    if (!isStunned) { 
                        if (player.hasShield) {
                            // Shield saves you
                            player.hasShield = false;
                            playSound("explode"); // Shield pop sound
                            texts.push({x: player.x, y: player.y, text: "SHIELD BROKEN!", life: 60, maxLife: 60, color: "#00BFFF"});
                            
                            // Massive knockback
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

interface DrawParams {
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
    inputMode: string;
    mouse: { x: number, y: number };
}

export const drawGame = ({
    canvas, ctx, gameState, level, player, enemies, bubbles, particles, texts, frenzyActive, inputMode, mouse
}: DrawParams) => {
    if (!canvas || !ctx) return;
    
    const config = LEVELS[level];
    
    drawBackground(ctx, canvas.width, canvas.height, config.bgTop, config.bgBottom, config.bgAsset);
    
    bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.size, b.color));
    
    enemies.forEach(e => {
        let facingRight = e.vx > 0;
        drawFish(ctx, e, false, false, facingRight);
    });

    if (gameState !== "GAMEOVER") {
        let facingRight = player.vx > 0;
        if (inputMode === "mouse") facingRight = mouse.x > player.x;
        else if (Math.abs(player.vx) > 0.1) facingRight = player.vx > 0;
        
        drawFish(ctx, player, true, frenzyActive, facingRight);
    }

    particles.forEach(p => drawParticle(ctx, p.x, p.y, p.size, p.color, p.life));
    texts.forEach(t => drawFloatingText(ctx, t.x, t.y, t.text, t.color, t.life, t.maxLife));
};
