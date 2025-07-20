// Utility functions related to castle part spawning and sizing

import { CastlePart } from '@/objects/CastlePart';
import { PartLevel, CastleState } from '@/types/Game';

/**
 * Maximum number of parts allowed for each level
 * This creates realistic castle building constraints
 */
export const PART_LEVEL_CAPACITIES: Record<PartLevel, number> = {
  1: 4,  // Foundation blocks - only 4 can fit as base
  2: 5,  // Base walls - can build on foundation
  3: 6,  // Upper walls - more flexibility as castle grows
  4: 6,  // Tower sections - fewer as we go higher
  5: 4,  // Decorative elements - limited decorations
  6: 3   // Pinnacles/flags - only a few at the top
};

/**
 * Calculate current castle state based on dropped parts.
 */
export function getCastleState(droppedParts: CastlePart[]): CastleState {
  const partsByLevel = new Map<number, any[]>();
  let maxLevel = 0;

  droppedParts.forEach((part) => {
    if (part && part.scene && part.active) {
      const partLevel = part.getPartLevel();
      maxLevel = Math.max(maxLevel, partLevel);

      if (!partsByLevel.has(partLevel)) {
        partsByLevel.set(partLevel, []);
      }
      partsByLevel.get(partLevel)!.push(part.getPartData());
    }
  });

  return {
    maxLevel,
    partsByLevel,
    totalParts: droppedParts.length,
  };
}

/**
 * Count how many parts of each level we currently have
 */
export function getPartCountsByLevel(droppedParts: CastlePart[]): Record<PartLevel, number> {
  const counts: Record<PartLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  
  droppedParts.forEach((part) => {
    if (part && part.scene && part.active) {
      const partLevel = part.getPartLevel();
      counts[partLevel]++;
    }
  });
  
  return counts;
}

/**
 * Determine which part levels can be spawned next, considering both castle progression 
 * and capacity limits for each level.
 */
export function getAvailablePartLevels(droppedParts: CastlePart[]): PartLevel[] {
  const castleState = getCastleState(droppedParts);
  const partCounts = getPartCountsByLevel(droppedParts);

  // If no castle yet, only level 1 parts can be spawned (if capacity allows)
  if (castleState.maxLevel === 0) {
    return partCounts[1] < PART_LEVEL_CAPACITIES[1] ? [1] : [];
  }

  // Check which levels can be spawned based on progression and capacity
  const availableLevels: PartLevel[] = [];
  
  // Allow spawning up to one level higher than current max, capped at 6
  const maxAllowedLevel = Math.min(castleState.maxLevel + 1, 6);
  
  for (let lvl = 1; lvl <= maxAllowedLevel; lvl++) {
    const partLevel = lvl as PartLevel;
    const currentCount = partCounts[partLevel];
    const maxCapacity = PART_LEVEL_CAPACITIES[partLevel];
    
    // Only add this level if we haven't reached its capacity
    if (currentCount < maxCapacity) {
      availableLevels.push(partLevel);
    }
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