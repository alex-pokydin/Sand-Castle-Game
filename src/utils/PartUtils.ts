// Utility functions related to castle part spawning and sizing

import { CastlePart } from '@/objects/CastlePart';
import { PartLevel, CastleState } from '@/types/Game';

/**
 * Calculate current castle state based on dropped parts.
 */
export function getCastleState(droppedParts: CastlePart[]): CastleState {
  const partsByLevel = new Map<number, any[]>();
  let maxLevel = 0;

  droppedParts.forEach((part) => {
    const partLevel = part.getPartLevel();
    maxLevel = Math.max(maxLevel, partLevel);

    if (!partsByLevel.has(partLevel)) {
      partsByLevel.set(partLevel, []);
    }
    partsByLevel.get(partLevel)!.push(part.getPartData());
  });

  return {
    maxLevel,
    partsByLevel,
    totalParts: droppedParts.length,
  };
}

/**
 * Determine which part levels can be spawned next, given the current castle state.
 */
export function getAvailablePartLevels(droppedParts: CastlePart[]): PartLevel[] {
  const castleState = getCastleState(droppedParts);

  // If no castle yet, only level 1 parts can be spawned
  if (castleState.maxLevel === 0) {
    return [1];
  }

  // Otherwise allow up to one level higher than current max, capped at 6
  const availableLevels: PartLevel[] = [];
  for (let lvl = 1; lvl <= Math.min(castleState.maxLevel + 1, 6); lvl++) {
    availableLevels.push(lvl as PartLevel);
  }
  return availableLevels;
}

/**
 * Get a part's visual width based on its level.
 */
export function getPartWidth(partLevel: PartLevel): number {
  const baseWidth = 80;
  // Level 1: 80px, Level 6: 40px
  return Math.max(40, baseWidth - (partLevel - 1) * 8);
}

/**
 * Get a part's visual height based on its level.
 */
export function getPartHeight(partLevel: PartLevel): number {
  switch (partLevel) {
    case 1:
      return 50; // Foundation blocks (thicker)
    case 2:
      return 45; // Base walls
    case 3:
      return 40; // Upper walls
    case 4:
      return 35; // Tower sections
    case 5:
      return 30; // Decorative elements
    case 6:
      return 25; // Pinnacles/flags
    default:
      return 40;
  }
}