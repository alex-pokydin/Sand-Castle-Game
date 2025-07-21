/**
 * Centralized text configuration for the Sand Castle Game
 * All text-related settings are defined here for consistency and easy theming
 */

// Font Families
export const FONT_FAMILIES = {
  PRIMARY: 'Arial, sans-serif',
  SECONDARY: 'Comic Sans MS, cursive',
  KID_FRIENDLY: 'Comic Sans MS, Arial, sans-serif',
  BOLD: 'Arial Black, Arial, sans-serif',
  DECORATIVE: 'Brush Script MT, cursive',
  MONOSPACE: 'Courier New, monospace'
} as const;

// Font Sizes (in pixels)
export const FONT_SIZES = {
  TINY: 8,
  SMALL: 12,
  MEDIUM: 16,
  LARGE: 20,
  XLARGE: 24,
  XXLARGE: 28,
  TITLE_SMALL: 32,
  TITLE_MEDIUM: 36,
  TITLE_LARGE: 42,
  TITLE_XLARGE: 48,
  TITLE_XXLARGE: 56
} as const;

// Line Spacing
export const LINE_SPACING = {
  TIGHT: 1,
  NORMAL: 2,
  LOOSE: 4,
  VERY_LOOSE: 8
} as const;

// Text Alignment
export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify'
} as const;

// Font Styles
export const FONT_STYLES = {
  NORMAL: 'normal',
  BOLD: 'bold',
  ITALIC: 'italic',
  BOLD_ITALIC: 'bold italic'
} as const;

// Shadow Configurations
export const SHADOW_CONFIGS = {
  NONE: null,
  LIGHT: {
    offsetX: 1,
    offsetY: 1,
    color: '#000000',
    blur: 1,
    fill: true
  },
  MEDIUM: {
    offsetX: 2,
    offsetY: 2,
    color: '#000000',
    blur: 2,
    fill: true
  },
  HEAVY: {
    offsetX: 3,
    offsetY: 3,
    color: '#000000',
    blur: 3,
    fill: true
  },
  WHITE: {
    offsetX: 2,
    offsetY: 2,
    color: '#FFFFFF',
    blur: 2,
    fill: true
  }
} as const;

// Word Wrap Settings
export const WORD_WRAP_CONFIGS = {
  NONE: null,
  BASIC: {
    width: 0.9, // 90% of screen width
    useAdvancedWrap: false
  },
  ADVANCED: {
    width: 0.9, // 90% of screen width
    useAdvancedWrap: true
  },
  NARROW: {
    width: 0.7, // 70% of screen width
    useAdvancedWrap: true
  },
  WIDE: {
    width: 0.95, // 95% of screen width
    useAdvancedWrap: true
  }
} as const;

// Predefined Text Configurations
export const TEXT_CONFIGS = {
  // Title configurations
  TITLE_XXLARGE: {
    fontSize: FONT_SIZES.TITLE_XXLARGE,
    minFontSize: FONT_SIZES.TITLE_LARGE,
    maxWidth: 0.95,
    maxHeight: 0.2,
    fontFamily: FONT_FAMILIES.KID_FRIENDLY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.HEAVY,
    lineSpacing: LINE_SPACING.NORMAL
  },
  TITLE_XLARGE: {
    fontSize: FONT_SIZES.TITLE_XLARGE,
    minFontSize: FONT_SIZES.TITLE_MEDIUM,
    maxWidth: 0.95,
    maxHeight: 0.18,
    fontFamily: FONT_FAMILIES.KID_FRIENDLY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.HEAVY,
    lineSpacing: LINE_SPACING.NORMAL
  },
  TITLE_LARGE: {
    fontSize: FONT_SIZES.TITLE_LARGE,
    minFontSize: FONT_SIZES.TITLE_SMALL,
    maxWidth: 0.9,
    maxHeight: 0.15,
    fontFamily: FONT_FAMILIES.KID_FRIENDLY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.MEDIUM,
    lineSpacing: LINE_SPACING.NORMAL
  },
  TITLE_MEDIUM: {
    fontSize: FONT_SIZES.TITLE_MEDIUM,
    minFontSize: FONT_SIZES.XLARGE,
    maxWidth: 0.9,
    maxHeight: 0.12,
    fontFamily: FONT_FAMILIES.KID_FRIENDLY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.MEDIUM,
    lineSpacing: LINE_SPACING.NORMAL
  },
  TITLE_SMALL: {
    fontSize: FONT_SIZES.TITLE_SMALL,
    minFontSize: FONT_SIZES.LARGE,
    maxWidth: 0.9,
    maxHeight: 0.1,
    fontFamily: FONT_FAMILIES.KID_FRIENDLY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },

  // Subtitle configurations
  SUBTITLE_LARGE: {
    fontSize: FONT_SIZES.XXLARGE,
    minFontSize: FONT_SIZES.LARGE,
    maxWidth: 0.9,
    maxHeight: 0.1,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },
  SUBTITLE_MEDIUM: {
    fontSize: FONT_SIZES.XLARGE,
    minFontSize: FONT_SIZES.MEDIUM,
    maxWidth: 0.9,
    maxHeight: 0.08,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },
  SUBTITLE_SMALL: {
    fontSize: FONT_SIZES.LARGE,
    minFontSize: FONT_SIZES.SMALL,
    maxWidth: 0.9,
    maxHeight: 0.06,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.BOLD,
    lineSpacing: LINE_SPACING.NORMAL
  },

  // Body text configurations
  BODY_LARGE: {
    fontSize: FONT_SIZES.LARGE,
    minFontSize: FONT_SIZES.MEDIUM,
    maxWidth: 0.85,
    maxHeight: 0.08,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.NORMAL
  },
  BODY_MEDIUM: {
    fontSize: FONT_SIZES.MEDIUM,
    minFontSize: FONT_SIZES.SMALL,
    maxWidth: 0.85,
    maxHeight: 0.06,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.NORMAL
  },
  BODY_SMALL: {
    fontSize: FONT_SIZES.SMALL,
    minFontSize: FONT_SIZES.TINY,
    maxWidth: 0.85,
    maxHeight: 0.04,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.TIGHT
  },

  // Stats configurations
  STATS_XLARGE: {
    fontSize: FONT_SIZES.XXLARGE,
    minFontSize: FONT_SIZES.LARGE,
    maxWidth: 0.8,
    maxHeight: 0.08,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },
  STATS_LARGE: {
    fontSize: FONT_SIZES.XLARGE,
    minFontSize: FONT_SIZES.MEDIUM,
    maxWidth: 0.8,
    maxHeight: 0.06,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },
  STATS_MEDIUM: {
    fontSize: FONT_SIZES.LARGE,
    minFontSize: FONT_SIZES.SMALL,
    maxWidth: 0.8,
    maxHeight: 0.05,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    lineSpacing: LINE_SPACING.NORMAL
  },
  STATS_SMALL: {
    fontSize: FONT_SIZES.MEDIUM,
    minFontSize: FONT_SIZES.TINY,
    maxWidth: 0.8,
    maxHeight: 0.04,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    lineSpacing: LINE_SPACING.TIGHT
  },
  STATS_TINY: {
    fontSize: FONT_SIZES.SMALL,
    minFontSize: FONT_SIZES.TINY,
    maxWidth: 0.8,
    maxHeight: 0.03,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    lineSpacing: LINE_SPACING.TIGHT
  },

  // Button text configurations
  BUTTON_LARGE: {
    fontSize: FONT_SIZES.XLARGE,
    minFontSize: FONT_SIZES.MEDIUM,
    maxWidth: 0.8,
    maxHeight: 0.06,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.MEDIUM,
    lineSpacing: LINE_SPACING.NORMAL
  },
  BUTTON_MEDIUM: {
    fontSize: FONT_SIZES.LARGE,
    minFontSize: FONT_SIZES.SMALL,
    maxWidth: 0.8,
    maxHeight: 0.05,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    shadow: SHADOW_CONFIGS.LIGHT,
    lineSpacing: LINE_SPACING.NORMAL
  },
  BUTTON_SMALL: {
    fontSize: FONT_SIZES.MEDIUM,
    minFontSize: FONT_SIZES.TINY,
    maxWidth: 0.8,
    maxHeight: 0.04,
    fontFamily: FONT_FAMILIES.BOLD,
    fontStyle: FONT_STYLES.BOLD,
    lineSpacing: LINE_SPACING.TIGHT
  },

  // UI text configurations
  UI_LARGE: {
    fontSize: FONT_SIZES.LARGE,
    minFontSize: FONT_SIZES.MEDIUM,
    maxWidth: 0.9,
    maxHeight: 0.06,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.NORMAL
  },
  UI_MEDIUM: {
    fontSize: FONT_SIZES.MEDIUM,
    minFontSize: FONT_SIZES.SMALL,
    maxWidth: 0.9,
    maxHeight: 0.04,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.NORMAL
  },
  UI_SMALL: {
    fontSize: FONT_SIZES.SMALL,
    minFontSize: FONT_SIZES.TINY,
    maxWidth: 0.9,
    maxHeight: 0.03,
    fontFamily: FONT_FAMILIES.PRIMARY,
    fontStyle: FONT_STYLES.NORMAL,
    lineSpacing: LINE_SPACING.TIGHT
  }
} as const;

// Text utility functions
export const TextUtils = {
  /**
   * Get font family by type
   */
  getFontFamily(type: keyof typeof FONT_FAMILIES): string {
    return FONT_FAMILIES[type];
  },

  /**
   * Get font size by type
   */
  getFontSize(type: keyof typeof FONT_SIZES): number {
    return FONT_SIZES[type];
  },

  /**
   * Get line spacing by type
   */
  getLineSpacing(type: keyof typeof LINE_SPACING): number {
    return LINE_SPACING[type];
  },

  /**
   * Get text alignment by type
   */
  getTextAlign(type: keyof typeof TEXT_ALIGN): string {
    return TEXT_ALIGN[type];
  },

  /**
   * Get font style by type
   */
  getFontStyle(type: keyof typeof FONT_STYLES): string {
    return FONT_STYLES[type];
  },

  /**
   * Get shadow configuration by type
   */
  getShadowConfig(type: keyof typeof SHADOW_CONFIGS) {
    return SHADOW_CONFIGS[type];
  },

  /**
   * Get word wrap configuration by type
   */
  getWordWrapConfig(type: keyof typeof WORD_WRAP_CONFIGS) {
    return WORD_WRAP_CONFIGS[type];
  },

  /**
   * Get text configuration by type
   */
  getTextConfig(type: keyof typeof TEXT_CONFIGS) {
    return TEXT_CONFIGS[type];
  },

  /**
   * Calculate responsive font size based on screen dimensions
   */
  calculateResponsiveFontSize(
    screenWidth: number,
    screenHeight: number,
    baseFontSize: number,
    minFontSize: number = FONT_SIZES.SMALL
  ): number {
    // Scale font size based on screen size
    const scaleFactor = Math.min(screenWidth / 800, screenHeight / 600);
    const scaledFontSize = Math.round(baseFontSize * scaleFactor);
    
    return Math.max(minFontSize, Math.min(scaledFontSize, baseFontSize));
  },

  /**
   * Calculate dynamic spacing based on screen size
   */
  calculateDynamicSpacing(
    screenHeight: number,
    baseSpacing: number = 35
  ): number {
    const heightRatio = screenHeight / 600; // Base height of 600px
    return Math.round(baseSpacing * heightRatio);
  }
} as const; 