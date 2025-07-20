import { Scene } from 'phaser';
import { tSync } from '@/i18n';

export interface ResponsiveTextConfig {
  fontSize: number;
  minFontSize?: number;
  maxWidth?: number; // Can be pixels or percentage (0-1)
  maxHeight?: number; // Can be pixels or percentage (0-1)
  fontFamily?: string;
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  fontStyle?: string;
  shadow?: {
    offsetX: number;
    offsetY: number;
    color: string;
    blur: number;
    fill: boolean;
  };
  align?: string;
  lineSpacing?: number;
}

export interface ResponsiveTextResult {
  text: Phaser.GameObjects.Text;
  finalFontSize: number;
  actualWidth: number;
  actualHeight: number;
}

/**
 * Creates responsive text that automatically adjusts font size to fit screen width and height
 */
export function createResponsiveText(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): ResponsiveTextResult {
  const text = variables ? tSync(textKey, variables) : tSync(textKey);
  
  // Default values
  const {
    fontSize = 32,
    minFontSize = 16,
    maxWidth = 0.9, // Default to 90% of screen width
    maxHeight = 0.2, // Default to 20% of screen height
    fontFamily = 'Arial, sans-serif',
    color = '#FFFFFF',
    stroke = '#000000',
    strokeThickness = 2,
    fontStyle = 'normal',
    shadow,
    align = 'center',
    lineSpacing = 2
  } = config;

  // Convert percentages to pixels
  const maxWidthPx = typeof maxWidth === 'number' && maxWidth <= 1 
    ? scene.scale.width * maxWidth 
    : maxWidth;
  const maxHeightPx = typeof maxHeight === 'number' && maxHeight <= 1 
    ? scene.scale.height * maxHeight 
    : maxHeight;

  // Calculate responsive font size considering both width and height
  const finalFontSize = calculateResponsiveFontSize(
    scene,
    text,
    fontSize,
    minFontSize,
    maxWidthPx,
    maxHeightPx,
    fontFamily,
    lineSpacing
  );

  // Create the text object with word wrapping
  const textObject = scene.add.text(x, y, text, {
    fontSize: `${finalFontSize}px`,
    fontFamily,
    color,
    stroke,
    strokeThickness,
    fontStyle,
    shadow,
    align,
    lineSpacing,
    wordWrap: { 
      width: maxWidthPx,
      useAdvancedWrap: true
    }
  });

  return {
    text: textObject,
    finalFontSize,
    actualWidth: textObject.width,
    actualHeight: textObject.height
  };
}

/**
 * Calculates the optimal font size for text to fit within maxWidth and maxHeight
 */
export function calculateResponsiveFontSize(
  scene: Scene,
  text: string,
  initialFontSize: number,
  minFontSize: number = 16,
  maxWidth: number = scene.scale.width * 0.9,
  maxHeight: number = scene.scale.height * 0.2,
  fontFamily: string = 'Arial, sans-serif',
  lineSpacing: number = 2
): number {
  let fontSize = initialFontSize;
  
  // Create temporary text to measure
  const tempText = scene.add.text(0, 0, text, {
    fontSize: `${fontSize}px`,
    fontFamily,
    align: 'center',
    lineSpacing,
    wordWrap: { 
      width: maxWidth,
      useAdvancedWrap: true
    }
  });
  
  // Reduce font size if text is too wide or too tall
  while ((tempText.width > maxWidth || tempText.height > maxHeight) && fontSize > minFontSize) {
    fontSize -= fontSize > 24 ? 2 : 1; // Reduce by 2 for larger fonts, 1 for smaller
    tempText.setFontSize(fontSize);
  }
  
  // Destroy temporary text
  tempText.destroy();
  
  return fontSize;
}

/**
 * Creates a title with responsive sizing and bounce animation
 */
export function createResponsiveTitle(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const result = createResponsiveText(scene, x, y, textKey, config, variables);
  const text = result.text;
  
  // Add bounce animation
  scene.tweens.add({
    targets: text,
    scaleX: 1.05,
    scaleY: 1.05,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  return text;
}

/**
 * Creates a subtitle with responsive sizing and sparkle animation
 */
export function createResponsiveSubtitle(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const result = createResponsiveText(scene, x, y, textKey, config, variables);
  const text = result.text;
  
  // Add gentle sparkle animation
  scene.tweens.add({
    targets: text,
    alpha: 0.8,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  return text;
}

/**
 * Creates centered responsive text with origin set to center
 */
export function createCenteredResponsiveText(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const result = createResponsiveText(scene, x, y, textKey, config, variables);
  const text = result.text;
  text.setOrigin(0.5);
  return text;
}

/**
 * Creates centered responsive text from pre-translated text (avoids double translation)
 */
export function createCenteredResponsiveTextFromTranslated(
  scene: Scene,
  x: number,
  y: number,
  translatedText: string,
  config: ResponsiveTextConfig
): Phaser.GameObjects.Text {
  // Default values
  const {
    fontSize = 32,
    minFontSize = 16,
    maxWidth = 0.9, // Default to 90% of screen width
    maxHeight = 0.2, // Default to 20% of screen height
    fontFamily = 'Arial, sans-serif',
    color = '#FFFFFF',
    stroke = '#000000',
    strokeThickness = 2,
    fontStyle = 'normal',
    shadow,
    align = 'center',
    lineSpacing = 2
  } = config;

  // Convert percentages to pixels
  const maxWidthPx = typeof maxWidth === 'number' && maxWidth <= 1 
    ? scene.scale.width * maxWidth 
    : maxWidth;
  const maxHeightPx = typeof maxHeight === 'number' && maxHeight <= 1 
    ? scene.scale.height * maxHeight 
    : maxHeight;

  // Calculate responsive font size considering both width and height
  const finalFontSize = calculateResponsiveFontSize(
    scene,
    translatedText,
    fontSize,
    minFontSize,
    maxWidthPx,
    maxHeightPx,
    fontFamily,
    lineSpacing
  );

  // Create the text object with word wrapping
  const textObject = scene.add.text(x, y, translatedText, {
    fontSize: `${finalFontSize}px`,
    fontFamily,
    color,
    stroke,
    strokeThickness,
    fontStyle,
    shadow,
    align,
    lineSpacing,
    wordWrap: { 
      width: maxWidthPx,
      useAdvancedWrap: true
    }
  });

  // Set origin to center
  textObject.setOrigin(0.5);
  
  return textObject;
}

/**
 * Calculates dynamic spacing based on text height and screen size
 */
export function calculateDynamicSpacing(
  scene: Scene,
  baseSpacing: number = 35,
  screenHeight: number = scene.scale.height
): number {
  // Adjust spacing based on screen height
  const heightRatio = screenHeight / 800; // Base height of 800px
  return Math.max(baseSpacing * heightRatio, 20); // Minimum 20px spacing
}

/**
 * Predefined text configurations for common use cases
 */
export const TEXT_CONFIGS = {
  // Title configurations
  TITLE_LARGE: {
    fontSize: 56,
    minFontSize: 28,
    maxWidth: 0.9, // 90% of screen width
    maxHeight: 0.15, // 15% of screen height
    color: '#FFFFFF',
    stroke: '#2C3E50',
    strokeThickness: 4,
    lineSpacing: 4,
    shadow: {
      offsetX: 3,
      offsetY: 3,
      color: '#000000',
      blur: 2,
      fill: true
    }
  },
  
  TITLE_MEDIUM: {
    fontSize: 48,
    minFontSize: 24,
    maxWidth: 0.9,
    maxHeight: 0.12, // 12% of screen height
    color: '#FFFFFF',
    stroke: '#2C3E50',
    strokeThickness: 4,
    lineSpacing: 3,
    shadow: {
      offsetX: 3,
      offsetY: 3,
      color: '#000000',
      blur: 2,
      fill: true
    }
  },
  
  // Subtitle configurations
  SUBTITLE_LARGE: {
    fontSize: 32,
    minFontSize: 18,
    maxWidth: 0.85, // 85% of screen width
    maxHeight: 0.1, // 10% of screen height
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 2,
    fontStyle: 'bold',
    lineSpacing: 2
  },
  
  SUBTITLE_MEDIUM: {
    fontSize: 28,
    minFontSize: 16,
    maxWidth: 0.85,
    maxHeight: 0.08, // 8% of screen height
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 2,
    fontStyle: 'bold',
    lineSpacing: 2
  },
  
  // Stats configurations
  STATS_LARGE: {
    fontSize: 36,
    minFontSize: 20,
    maxWidth: 0.9,
    maxHeight: 0.08,
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 3,
    fontStyle: 'bold',
    lineSpacing: 2
  },
  
  STATS_MEDIUM: {
    fontSize: 32,
    minFontSize: 18,
    maxWidth: 0.9,
    maxHeight: 0.07,
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 2,
    fontStyle: 'bold',
    lineSpacing: 2
  },
  
  STATS_SMALL: {
    fontSize: 24,
    minFontSize: 16,
    maxWidth: 0.9,
    maxHeight: 0.06,
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 1,
    lineSpacing: 1
  },
  
  STATS_TINY: {
    fontSize: 20,
    minFontSize: 14,
    maxWidth: 0.9,
    maxHeight: 0.05,
    color: '#2C3E50',
    stroke: '#FFFFFF',
    strokeThickness: 1,
    lineSpacing: 1
  }
} as const; 