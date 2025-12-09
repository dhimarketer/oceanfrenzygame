
import { LEVELS, COLORS, getEnemyProperties } from "./gameConfig";
import { Entity } from "./types";

export const spawnEnemy = (canvasWidth: number, canvasHeight: number, playerTier: number, levelIdx: number): Entity => {
  const side = Math.random() < 0.5 ? "left" : "right";
  const id = Math.random();
  const config = LEVELS[levelIdx];
  
  // Decide Entity Type based on Level
  let type: Entity['type'] = "normal";
  let isGold = false;

  const randType = Math.random();

  // Probability config
  const shieldProb = 0.01; // Rare (1%)
  const goldProb = 0.05;
  const jellyProb = levelIdx >= 1 ? 0.08 : 0; // Starts Level 2
  const mineProb = levelIdx >= 2 ? 0.05 : 0; // Starts Level 3
  const electricProb = levelIdx >= 2 ? 0.05 : 0; // Starts Level 3

  if (randType < shieldProb) {
      type = "shield_item";
  } else if (randType < shieldProb + goldProb) {
      isGold = true;
      type = "gold";
  } else if (randType < shieldProb + goldProb + jellyProb) {
      type = "jelly";
  } else if (randType < shieldProb + goldProb + jellyProb + mineProb) {
      type = "mine";
  } else if (randType < shieldProb + goldProb + jellyProb + mineProb + electricProb) {
      type = "electric";
  }

  // Tier Logic (for Normal/Electric)
  let tier = 0;
  if (!isGold && type !== "mine" && type !== "jelly" && type !== "shield_item") {
      const rand = Math.random();
      // Difficulty progression
      if (levelIdx === 0) {
          tier = rand > 0.7 ? 1 : 0;
      } else if (levelIdx === 1) {
          if (rand < 0.3) tier = 0; else if (rand < 0.7) tier = 1; else tier = 2;
      } else if (levelIdx === 2) {
          if (rand < 0.2) tier = 1; else if (rand < 0.5) tier = 2; else if (rand < 0.8) tier = 3; else tier = 4;
      } else {
          // Levels 4 & 5: Harder, mostly big fish
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
  }

  if (type === "shield_item") {
      radius = 20;
      color = COLORS.shield;
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

  return { id, x, y, radius, vx, vy, color, speed, tier, type, stunTimer: 0 };
};
