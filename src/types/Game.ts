export interface CastlePartData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number; // NEW: 1-6 part level
  velocity: { x: number; y: number };
  isStable: boolean;
  placedOnValidTarget: boolean; // NEW: placement validation
}

export interface StabilityResult {
  stable: boolean;
  unstableParts: CastlePartData[];
  stabilityScore: number;
}

export interface PlacementResult {
  valid: boolean;
  targetLevel: number | null; // What level this part was placed on (0 = ground)
  penaltyApplied: boolean;
}

export interface CastleState {
  maxLevel: number; // Highest level part currently in castle (0 = empty castle)
  partsByLevel: Map<number, CastlePartData[]>; // Parts organized by level
  totalParts: number;
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  partSpeed: number;
  maxParts: number;
  groundPenalty: {
    scoreReduction: number;
    timeReduction: number;
    livesReduction: number;
  };
}

export interface Level {
  id: number;
  name: string;
  targetParts: number;
  maxAttempts: number;
  description: string; // Level description for players
}

export interface GameState {
  currentLevel: number;
  score: number;
  lives: number;
  droppedParts: CastlePartData[];
  isGameActive: boolean;
  isFirstPart: boolean; // Track if next part is the first part (allowed on ground)
}

export interface GroundViolation {
  partId: string;
  penaltyApplied: number;
  timestamp: number;
}

// Part level constants and types
export const PART_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type PartLevel = typeof PART_LEVELS[number];

export interface LevelBasedScoring {
  baseScore: number;
  levelMultiplier: number; // Level N parts give N times base score
  placementBonus: number; // Bonus for correct placement
  wrongPlacementPenalty: number; // Penalty for wrong placement
  comboMultiplier: number; // Multiplier for consecutive correct placements
}

export interface WrongPlacementEvent {
  partId: string;
  partLevel: number;
  attemptedTargetLevel: number | null;
  penaltyApplied: number;
  timestamp: number;
}