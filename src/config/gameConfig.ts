import { GameConfig, Level, LevelBasedScoring, PartLevel } from '@/types/Game';

export const GAME_CONFIG: GameConfig = {
  // Fixed virtual canvas size (portrait 9:16). Phaser Scale Manager will fit/letterbox this on all devices
  width: 360,
  height: 640,
  gravity: 150, // Reduced from 300 for sand-like falling
  partSpeed: 80, // Slightly slower horizontal movement for better control
  maxParts: 10,
  // Ground rule penalties
  groundPenalty: {
    scoreReduction: 50, // Points lost when non-first part touches ground
    timeReduction: 5,   // Seconds reduced from timer (if applicable)
    livesReduction: 0   // Lives lost (0 = no life penalty, just score)
  }
};

// Add physics constants for sand-like behavior
export const PHYSICS_CONFIG = {
  gravity: 0.5, // Slightly reduced gravity for more controlled falling
  airResistance: 0.01, // Air resistance for slower falling
  sand: {
    density: 0.8, // Increased density for more stable stacking
    friction: 1.2, // Much higher friction for sand-to-sand contact
    frictionStatic: 1.5, // Very high static friction to prevent sliding
    restitution: 0.02, // Extremely low bounce for sand
    frictionAir: 0.03, // More air resistance
    angularDamping: 0.1, // Add angular damping to resist rotation
    sleepThreshold: 30, // Parts sleep faster when stable
    stabilityThreshold: 60 // Enhanced stability detection
  },
  ground: {
    friction: 1.2, // High ground friction
    frictionStatic: 1.5, // Very high static friction with ground
    restitution: 0.05 // Low bounce on ground
  }
} as const;

// Level-based part system (1-6 levels)
export const PART_LEVELS = [1, 2, 3, 4, 5, 6] as const;

// New progressive level system with strategic part counts
export const LEVELS: Level[] = [
  {
    id: 1,
    name: "First Steps",
    targetParts: 2,
    maxAttempts: 3,
    description: "Level 1 blocks can only be placed on the ground. Place 2 foundation blocks to start your castle!"
  },
  {
    id: 2,
    name: "Level Up",
    targetParts: 3,
    maxAttempts: 3,
    description: "Level 2 blocks can only be placed on Level 1 blocks. Build up with 3 blocks and watch your castle grow!"
  },
  {
    id: 3,
    name: "Build Strategy",
    targetParts: 5,
    maxAttempts: 3,
    description: "Level 3 blocks go on Level 2 blocks. Plan your logistics carefully - you need 5 blocks for a stable structure!"
  },
  {
    id: 4,
    name: "Logistics Challenge",
    targetParts: 10,
    maxAttempts: 3,
    description: "Level 4 blocks on Level 3 blocks. Manage 10 parts across multiple levels - logistics become crucial!"
  },
  {
    id: 5,
    name: "Master Builder",
    targetParts: 15,
    maxAttempts: 3,
    description: "Level 5 blocks on Level 4 blocks. Complete your 15-part castle masterpiece for bonus points! Watch your statistics!"
  }
];

// Generate additional levels dynamically (+5 parts each)
export const generateLevel = (levelId: number): Level => ({
  id: levelId,
  name: `Advanced Level ${levelId - 5}`,
  targetParts: 15 + (levelId - 5) * 5,
  maxAttempts: 3,
  description: `Endless challenge - build a {{parts}}-part castle`
});

// Level-based scoring system
export const SCORING_CONFIG: LevelBasedScoring = {
  baseScore: 10, // Base points per part
  levelMultiplier: 1, // Level N parts give N times base score (1x, 2x, 3x, etc.)
  placementBonus: 10, // Bonus for correct placement
  wrongPlacementPenalty: 50, // Penalty for wrong placement
  comboMultiplier: 1.2 // 20% bonus for consecutive correct placements
};

export const COLORS = {
  SAND: 0xF4D03F,
  SAND_DARK: 0xE67E22,
  SAND_LIGHT: 0xF7DC6F,
  OCEAN: 0x3498DB,
  SKY: 0x87CEEB,
  WHITE: 0xFFFFFF,
  GREEN: 0x27AE60, // Stable indicator
  YELLOW: 0xF39C12, // Warning indicator  
  RED: 0xE74C3C, // Unstable indicator
  
  // Level-based part colors (distinct visual hierarchy)
  LEVEL_1: 0x8B4513, // Brown (foundation)
  LEVEL_2: 0xD2691E, // Chocolate (base walls)
  LEVEL_3: 0xF4A460, // Sandy brown (upper walls)
  LEVEL_4: 0xDDA0DD, // Plum (tower sections)
  LEVEL_5: 0x9370DB, // Medium purple (decorative)
  LEVEL_6: 0xFFD700  // Gold (pinnacles/flags)
} as const;

// Helper function to get color by part level
export const getPartColor = (level: PartLevel): number => {
  const colorMap: Record<PartLevel, number> = {
    1: COLORS.LEVEL_1,
    2: COLORS.LEVEL_2,
    3: COLORS.LEVEL_3,
    4: COLORS.LEVEL_4,
    5: COLORS.LEVEL_5,
    6: COLORS.LEVEL_6
  };
  return colorMap[level];
};

// Placement validation configuration
export const PLACEMENT_CONFIG = {
  collisionTolerance: 10, // pixels tolerance for overlap detection
  snapDistance: 5, // pixels for snapping to valid placement
  validationDelay: 100, // ms delay before validating placement
  destructionDelay: 500, // ms delay before destroying wrong placement
  particleCount: 20 // number of destruction particles
} as const; 