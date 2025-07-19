export interface CastlePartData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: { x: number; y: number };
  isStable: boolean;
}

export interface StabilityResult {
  stable: boolean;
  unstableParts: CastlePartData[];
  stabilityScore: number;
}

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
  partSpeed: number;
  maxParts: number;
}

export interface Level {
  id: number;
  name: string;
  targetParts: number;
  partTypes: string[];
  targetShape?: string;
  maxAttempts: number;
}

export interface GameState {
  currentLevel: number;
  score: number;
  lives: number;
  droppedParts: CastlePartData[];
  isGameActive: boolean;
} 