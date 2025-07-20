import { PartLevel } from '@/types/Game';
import { COLORS } from '@/config/gameConfig';

/**
 * Enhanced castle part types with more variety
 */
export interface EnhancedPartData {
  level: PartLevel;
  type: string;
  width: number;
  height: number;
  color: number;
  shape: 'rectangle' | 'tower' | 'arch' | 'decoration' | 'flag';
  specialEffect?: 'glow' | 'sparkle' | 'pulse';
  rarity: 'common' | 'uncommon' | 'rare';
}

/**
 * Enhanced part configurations with more variety
 */
export const ENHANCED_PART_CONFIGS: Record<PartLevel, EnhancedPartData[]> = {
  1: [
    {
      level: 1,
      type: 'foundation',
      width: 80,
      height: 50,
      color: COLORS.LEVEL_1,
      shape: 'rectangle',
      rarity: 'common'
    },
    {
      level: 1,
      type: 'wide-foundation',
      width: 100,
      height: 45,
      color: COLORS.LEVEL_1,
      shape: 'rectangle',
      rarity: 'uncommon'
    },
    {
      level: 1,
      type: 'thick-foundation',
      width: 70,
      height: 60,
      color: COLORS.LEVEL_1,
      shape: 'rectangle',
      rarity: 'rare'
    }
  ],
  2: [
    {
      level: 2,
      type: 'base-wall',
      width: 75,
      height: 45,
      color: COLORS.LEVEL_2,
      shape: 'rectangle',
      rarity: 'common'
    },
    {
      level: 2,
      type: 'tall-wall',
      width: 65,
      height: 55,
      color: COLORS.LEVEL_2,
      shape: 'rectangle',
      rarity: 'uncommon'
    },
    {
      level: 2,
      type: 'arched-base',
      width: 80,
      height: 40,
      color: COLORS.LEVEL_2,
      shape: 'arch',
      rarity: 'rare'
    }
  ],
  3: [
    {
      level: 3,
      type: 'upper-wall',
      width: 70,
      height: 40,
      color: COLORS.LEVEL_3,
      shape: 'rectangle',
      rarity: 'common'
    },
    {
      level: 3,
      type: 'narrow-wall',
      width: 55,
      height: 45,
      color: COLORS.LEVEL_3,
      shape: 'rectangle',
      rarity: 'uncommon'
    },
    {
      level: 3,
      type: 'tower-base',
      width: 60,
      height: 35,
      color: COLORS.LEVEL_3,
      shape: 'tower',
      rarity: 'rare'
    }
  ],
  4: [
    {
      level: 4,
      type: 'tower-section',
      width: 60,
      height: 35,
      color: COLORS.LEVEL_4,
      shape: 'tower',
      rarity: 'common'
    },
    {
      level: 4,
      type: 'tall-tower',
      width: 50,
      height: 45,
      color: COLORS.LEVEL_4,
      shape: 'tower',
      rarity: 'uncommon'
    },
    {
      level: 4,
      type: 'crystal-tower',
      width: 55,
      height: 40,
      color: COLORS.LEVEL_4,
      shape: 'tower',
      specialEffect: 'glow',
      rarity: 'rare'
    }
  ],
  5: [
    {
      level: 5,
      type: 'decoration',
      width: 45,
      height: 30,
      color: COLORS.LEVEL_5,
      shape: 'decoration',
      rarity: 'common'
    },
    {
      level: 5,
      type: 'sparkle-decoration',
      width: 50,
      height: 25,
      color: COLORS.LEVEL_5,
      shape: 'decoration',
      specialEffect: 'sparkle',
      rarity: 'uncommon'
    },
    {
      level: 5,
      type: 'pulse-decoration',
      width: 40,
      height: 35,
      color: COLORS.LEVEL_5,
      shape: 'decoration',
      specialEffect: 'pulse',
      rarity: 'rare'
    }
  ],
  6: [
    {
      level: 6,
      type: 'flag',
      width: 40,
      height: 25,
      color: COLORS.LEVEL_6,
      shape: 'flag',
      rarity: 'common'
    },
    {
      level: 6,
      type: 'golden-flag',
      width: 45,
      height: 20,
      color: COLORS.LEVEL_6,
      shape: 'flag',
      specialEffect: 'glow',
      rarity: 'uncommon'
    },
    {
      level: 6,
      type: 'magical-flag',
      width: 35,
      height: 30,
      color: COLORS.LEVEL_6,
      shape: 'flag',
      specialEffect: 'sparkle',
      rarity: 'rare'
    }
  ]
};

/**
 * Get a random part configuration for a given level
 */
export function getRandomPartConfig(level: PartLevel): EnhancedPartData {
  const configs = ENHANCED_PART_CONFIGS[level];
  if (!configs || configs.length === 0) {
    // Fallback to basic configuration
    return {
      level,
      type: 'basic',
      width: 70,
      height: 40,
      color: COLORS[`LEVEL_${level}` as keyof typeof COLORS] || COLORS.SAND,
      shape: 'rectangle',
      rarity: 'common'
    };
  }
  
  // Weighted random selection based on rarity
  const weights = {
    common: 0.7,
    uncommon: 0.25,
    rare: 0.05
  };
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      const rarityConfigs = configs.filter(config => config.rarity === rarity);
      if (rarityConfigs.length > 0) {
        return rarityConfigs[Math.floor(Math.random() * rarityConfigs.length)];
      }
    }
  }
  
  // Fallback to random selection
  return configs[Math.floor(Math.random() * configs.length)];
}

/**
 * Get all available part configurations for a level
 */
export function getAvailablePartConfigs(level: PartLevel): EnhancedPartData[] {
  return ENHANCED_PART_CONFIGS[level] || [];
}

/**
 * Get part configuration by type
 */
export function getPartConfigByType(level: PartLevel, type: string): EnhancedPartData | null {
  const configs = ENHANCED_PART_CONFIGS[level];
  if (!configs) return null;
  
  return configs.find(config => config.type === type) || null;
}

/**
 * Get enhanced part width based on configuration
 */
export function getEnhancedPartWidth(partConfig: EnhancedPartData): number {
  return partConfig.width;
}

/**
 * Get enhanced part height based on configuration
 */
export function getEnhancedPartHeight(partConfig: EnhancedPartData): number {
  return partConfig.height;
}

/**
 * Get enhanced part color based on configuration
 */
export function getEnhancedPartColor(partConfig: EnhancedPartData): number {
  return partConfig.color;
}

/**
 * Check if part has special effects
 */
export function hasSpecialEffect(partConfig: EnhancedPartData): boolean {
  return !!partConfig.specialEffect;
}

/**
 * Get special effect type
 */
export function getSpecialEffect(partConfig: EnhancedPartData): string | undefined {
  return partConfig.specialEffect;
}

/**
 * Get part shape type
 */
export function getPartShape(partConfig: EnhancedPartData): string {
  return partConfig.shape;
}

/**
 * Get part rarity
 */
export function getPartRarity(partConfig: EnhancedPartData): string {
  return partConfig.rarity;
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: string): number {
  switch (rarity) {
    case 'common':
      return 0xFFFFFF; // White
    case 'uncommon':
      return 0x00FF00; // Green
    case 'rare':
      return 0x0080FF; // Blue
    default:
      return 0xFFFFFF;
  }
}

/**
 * Get rarity weight for spawning
 */
export function getRarityWeight(rarity: string): number {
  switch (rarity) {
    case 'common':
      return 0.7;
    case 'uncommon':
      return 0.25;
    case 'rare':
      return 0.05;
    default:
      return 0.7;
  }
}

/**
 * Get part description for UI
 */
export function getPartDescription(partConfig: EnhancedPartData): string {
  const shapeNames = {
    rectangle: 'Block',
    tower: 'Tower',
    arch: 'Arch',
    decoration: 'Decoration',
    flag: 'Flag'
  };
  
  const effectNames = {
    glow: 'Glowing',
    sparkle: 'Sparkling',
    pulse: 'Pulsing'
  };
  
  let description = shapeNames[partConfig.shape] || 'Part';
  
  if (partConfig.specialEffect) {
    description = `${effectNames[partConfig.specialEffect]} ${description}`;
  }
  
  return description;
} 