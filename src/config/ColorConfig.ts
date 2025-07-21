/**
 * Centralized color configuration for the Sand Castle Game
 * All color values are defined here for consistency and easy theming
 */

// Button Colors
export const BUTTON_COLORS = {
  PRIMARY: {
    primary: 0x27AE60,    // Green
    hover: 0x2ECC71,      // Light green
    text: '#FFFFFF'       // White text
  },
  SECONDARY: {
    primary: 0x3498DB,    // Blue
    hover: 0x5DADE2,      // Light blue
    text: '#FFFFFF'       // White text
  },
  WARNING: {
    primary: 0xE67E22,    // Orange
    hover: 0xF39C12,      // Light orange
    text: '#FFFFFF'       // White text
  },
  SMALL: {
    primary: 0x95A5A6,    // Gray
    hover: 0xBDC3C7,      // Light gray
    text: '#FFFFFF'       // White text
  },
  DANGER: {
    primary: 0xE74C3C,    // Red
    hover: 0xEC7063,      // Light red
    text: '#FFFFFF'       // White text
  },
  SUCCESS: {
    primary: 0x27AE60,    // Green
    hover: 0x2ECC71,      // Light green
    text: '#FFFFFF'       // White text
  }
} as const;

// Text Colors
export const TEXT_COLORS = {
  PRIMARY: '#FFFFFF',     // White
  SECONDARY: '#BDC3C7',   // Light gray
  ACCENT: '#F39C12',      // Orange
  SUCCESS: '#27AE60',     // Green
  WARNING: '#E67E22',     // Orange
  DANGER: '#E74C3C',      // Red
  DARK: '#2C3E50',        // Dark blue-gray
  LIGHT: '#ECF0F1'        // Very light gray
} as const;

// Stroke Colors (for text outlines)
export const STROKE_COLORS = {
  PRIMARY: '#000000',     // Black
  WHITE: '#FFFFFF',       // White
  DARK: '#2C3E50',        // Dark blue-gray
  LIGHT: '#BDC3C7'        // Light gray
} as const;

// Background Colors
export const BACKGROUND_COLORS = {
  PRIMARY: 0x87CEEB,      // Sky blue
  SECONDARY: 0xF4A460,    // Sandy brown
  OVERLAY: 0x000000,      // Black (for overlays)
  TRANSPARENT: 0x000000   // Transparent (alpha 0)
} as const;

// UI Element Colors
export const UI_COLORS = {
  BORDER: 0xFFFFFF,       // White border
  SHADOW: '#000000',      // Black shadow
  HIGHLIGHT: 0xFFFF00,    // Yellow highlight
  DISABLED: 0x95A5A6      // Gray for disabled elements
} as const;

// Game-Specific Colors
export const GAME_COLORS = {
  SAND: 0xF4A460,         // Sandy brown
  WATER: 0x4682B4,        // Steel blue
  SKY: 0x87CEEB,          // Sky blue
  GRASS: 0x228B22,        // Forest green
  STONE: 0x696969,        // Dim gray
  WOOD: 0x8B4513          // Saddle brown
} as const;

// Particle Colors
export const PARTICLE_COLORS = {
  SPARKLE: 0xFFFF00,      // Yellow sparkle
  DUST: 0xF4A460,         // Sandy dust
  WATER_SPLASH: 0x4682B4, // Water splash
  FIRE: 0xFF4500          // Orange fire
} as const;

// Accessibility Colors (High contrast)
export const ACCESSIBILITY_COLORS = {
  HIGH_CONTRAST_TEXT: '#FFFFFF',
  HIGH_CONTRAST_BACKGROUND: '#000000',
  HIGH_CONTRAST_BORDER: '#FFFFFF'
} as const;

// Color utility functions
export const ColorUtils = {
  /**
   * Convert hex color to number for Phaser
   */
  hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  },

  /**
   * Convert number to hex color string
   */
  numberToHex(num: number): string {
    return '#' + num.toString(16).padStart(6, '0');
  },

  /**
   * Get button colors by type
   */
  getButtonColors(type: keyof typeof BUTTON_COLORS) {
    return BUTTON_COLORS[type];
  },

  /**
   * Get text color by type
   */
  getTextColor(type: keyof typeof TEXT_COLORS): string {
    return TEXT_COLORS[type];
  },

  /**
   * Get stroke color by type
   */
  getStrokeColor(type: keyof typeof STROKE_COLORS): string {
    return STROKE_COLORS[type];
  },

  /**
   * Get background color by type
   */
  getBackgroundColor(type: keyof typeof BACKGROUND_COLORS): number {
    return BACKGROUND_COLORS[type];
  },

  /**
   * Get game color by type
   */
  getGameColor(type: keyof typeof GAME_COLORS): number {
    return GAME_COLORS[type];
  }
} as const; 