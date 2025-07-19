import { GameConfig, Level } from '@/types/Game';

export const GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  gravity: 300, // pixels per second squared
  partSpeed: 100, // horizontal movement speed
  maxParts: 10
};

export const PART_TYPES = ['base', 'wall', 'tower', 'decoration'] as const;
export type PartType = typeof PART_TYPES[number];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "First Drop",
    targetParts: 2,
    partTypes: ['base', 'base'],
    maxAttempts: 3
  },
  {
    id: 2,
    name: "Simple Stack",
    targetParts: 3,
    partTypes: ['base', 'wall', 'wall'],
    maxAttempts: 3
  },
  {
    id: 3,
    name: "Add Height", 
    targetParts: 4,
    partTypes: ['base', 'base', 'wall', 'wall'],
    maxAttempts: 3
  },
  {
    id: 4,
    name: "Tower Challenge",
    targetParts: 5,
    partTypes: ['base', 'wall', 'wall', 'tower', 'decoration'],
    maxAttempts: 3
  },
  {
    id: 5,
    name: "Complete Castle",
    targetParts: 6,
    partTypes: ['base', 'base', 'wall', 'wall', 'tower', 'decoration'],
    maxAttempts: 3
  }
];

export const COLORS = {
  SAND: 0xF4D03F,
  SAND_DARK: 0xE67E22,
  SAND_LIGHT: 0xF7DC6F,
  OCEAN: 0x3498DB,
  SKY: 0x87CEEB,
  WHITE: 0xFFFFFF,
  GREEN: 0x27AE60, // Stable indicator
  YELLOW: 0xF39C12, // Warning indicator  
  RED: 0xE74C3C // Unstable indicator
} as const; 