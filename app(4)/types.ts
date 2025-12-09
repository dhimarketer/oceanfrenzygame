

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  speed: number;
  tier: number; // 0 is smallest
  type: "normal" | "gold" | "mine" | "jelly" | "electric" | "shield_item" | "speed_item" | "freeze_item" | "growth_item"; 
  isChaser?: boolean; // If true, fish swims towards player
  stunTimer?: number; // If > 0, entity is stunned (no movement/input)
  oscillationOffset?: number; // For Jellyfish movement
  hasShield?: boolean; // For Player
  speedBoostTimer?: number; // For Player: duration of speed boost
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    life: number;
    maxLife: number;
    color: string;
}
