


import { LEVELS, COLORS, getEnemyProperties } from "./gameConfig";
import { Entity } from "./types";

export const spawnEnemy = (canvasWidth: number, canvasHeight: number, playerTier: number, levelIdx: number): Entity => {
  const side = Math.random() < 0.5 ? "left" : "right";
  const id = Math.random();
  const config = LEVELS[levelIdx];
  
  let type: Entity['type'] = "normal";
  let isGold = false;
  let isChaser = false;

  const randType = Math.random();

  // Spawning Probabilities based on Level Hazard Config
  const itemProb = 0.02; // Power-ups (Shield, Speed, Freeze, Growth)
  const goldProb = 0.05;
  const hazardProb = config.hazardProb; 

  // Distribution within Hazard bucket
  const jellyWeight = levelIdx >= 4 ? 0.4 : 0; // Starts zone 2
  const mineWeight = levelIdx >= 8 ? 0.3 : 0; // Starts zone 3
  const electricWeight = levelIdx >= 5 ? 0.3 : 0; // Starts zone 2

  if (randType < itemProb) {
      // Pick random powerup
      const pRand = Math.random();
      if (pRand < 0.25) type = "shield_item";
      else if (pRand < 0.50) type = "speed_item";
      else if (pRand < 0.75) type = "freeze_item";
      else type = "growth_item";
  } else if (randType < itemProb + goldProb) {
      isGold = true;
      type = "gold";
  } else if (randType < itemProb + goldProb + hazardProb) {
      // Determine hazard type
      const hRand = Math.random();
      if (hRand < jellyWeight) type = "jelly";
      else if (hRand < jellyWeight + mineWeight) type = "mine";
      else type = "electric";
  } else {
      type = "normal";
      // Chaser logic: Higher levels have more aggressive fish
      if (levelIdx >= 8 && Math.random() < 0.1 + (levelIdx * 0.01)) {
          isChaser = true;
      }
  }

  // Tier Logic (for Normal/Electric/Chaser)
  let tier = 0;
  if (!isGold && !type.includes("item") && type !== "mine" && type !== "jelly") {
      const rand = Math.random();
      // Complex Tier Distribution based on Level Index (0-19)
      if (levelIdx < 4) { // Reef
          if (rand < 0.7) tier = 0; else if (rand < 0.9) tier = 1; else tier = 2;
      } else if (levelIdx < 8) { // Twilight
          if (rand < 0.5) tier = 0; else if (rand < 0.8) tier = 1; else if (rand < 0.95) tier = 2; else tier = 3;
      } else if (levelIdx < 12) { // Abyss
          if (rand < 0.3) tier = 0; else if (rand < 0.6) tier = 1; else if (rand < 0.85) tier = 2; else tier = 3;
      } else if (levelIdx < 16) { // Shipwreck
          if (rand < 0.2) tier = 1; else if (rand < 0.5) tier = 2; else if (rand < 0.8) tier = 3; else tier = 4;
      } else { // Trench
          if (rand < 0.1) tier = 1; else if (rand < 0.3) tier = 2; else if (rand < 0.6) tier = 3; else tier = 4;
      }
  }

  // Set Properties
  let { r: radius, c: color, asset } = getEnemyProperties(tier);
  let speed = (2 + Math.random()) * config.enemySpeedMult;
  let vx = 0;
  let vy = 0;

  if (isGold) {
      color = COLORS.gold;
      speed *= 1.5; 
      radius = 15;
  } else if (type === "electric") {
      color = COLORS.electric;
      speed *= 1.2;
      radius *= 0.9; 
  } else if (isChaser) {
      color = COLORS.chaser;
      speed *= 1.3;
  }

  if (type.includes("item")) {
      radius = 20;
      if (type === "shield_item") color = COLORS.shield;
      else if (type === "speed_item") color = COLORS.speed;
      else if (type === "freeze_item") color = COLORS.freeze;
      else if (type === "growth_item") color = COLORS.growth;
      
      speed = 1.0;
      vx = 0;
      // Drifts down from top
      const x = Math.random() * (canvasWidth - 100) + 50;
      const y = -50;
      vy = 0.5 + Math.random() * 0.5;
      return { id, x, y, radius, vx, vy, color, speed, tier: 0, type };
  } else if (type === "mine") {
      radius = 25;
      color = COLORS.mine;
      speed = 0.5; 
      vx = side === "left" ? speed : -speed;
      vy = (Math.random() - 0.5) * 0.5;
  } else if (type === "jelly") {
      radius = 20 + Math.random() * 10;
      color = COLORS.jelly;
      speed = 1.0;
      const startTop = Math.random() < 0.5;
      const x = Math.random() * (canvasWidth - 100) + 50;
      const y = startTop ? -radius * 2 : canvasHeight + radius * 2;
      vx = 0; 
      vy = startTop ? speed : -speed;
      return { id, x, y, radius, vx, vy, color, speed, tier: 0, type, oscillationOffset: Math.random() * Math.PI * 2 };
  } else {
      vx = side === "left" ? speed : -speed;
      vy = (Math.random() - 0.5) * 1; 
  }
  
  const x = side === "left" ? -radius * 2 : canvasWidth + radius * 2;
  const y = Math.random() * (canvasHeight - radius*2) + radius;

  return { id, x, y, radius, vx, vy, color, speed, tier, type, stunTimer: 0, isChaser };
};
