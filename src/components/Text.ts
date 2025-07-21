import { Scene } from 'phaser';
import { tSync } from '@/i18n';
import { TEXT_COLORS, STROKE_COLORS } from '@/config/ColorConfig';
import { TEXT_CONFIGS as CONFIG_TEXT_CONFIGS, FONT_FAMILIES, LINE_SPACING } from '@/config/TextConfig';

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

export interface TextOptions {
  x: number;
  y: number;
  textKey: string;
  config: ResponsiveTextConfig;
  variables?: Record<string, any>;
  centerOrigin?: boolean;
}

export class Text {
  private scene: Scene;
  private textObject: Phaser.GameObjects.Text;
  private options: TextOptions;
  private finalFontSize: number;
  private actualWidth: number;
  private actualHeight: number;

  constructor(scene: Scene, options: TextOptions) {
    this.scene = scene;
    this.options = options;
    
    const result = this.createText();
    this.textObject = result.text;
    this.finalFontSize = result.finalFontSize;
    this.actualWidth = result.actualWidth;
    this.actualHeight = result.actualHeight;
  }

  private createText(): {
    text: Phaser.GameObjects.Text;
    finalFontSize: number;
    actualWidth: number;
    actualHeight: number;
  } {
    const { textKey, config, variables, centerOrigin = true } = this.options;
    const text = variables ? tSync(textKey, variables) : tSync(textKey);
    
    // Default values
    const {
      fontSize = 32,
      minFontSize = 16,
      maxWidth = 0.9, // Default to 90% of screen width
      maxHeight = 0.2, // Default to 20% of screen height
      fontFamily = FONT_FAMILIES.PRIMARY,
      color = TEXT_COLORS.PRIMARY,
      stroke = STROKE_COLORS.PRIMARY,
      strokeThickness = 2,
      fontStyle = 'normal',
      shadow,
      align = 'center',
      lineSpacing = LINE_SPACING.NORMAL
    } = config;

    // Convert percentages to pixels
    const maxWidthPx = typeof maxWidth === 'number' && maxWidth <= 1 
      ? this.scene.scale.width * maxWidth 
      : maxWidth;
    const maxHeightPx = typeof maxHeight === 'number' && maxHeight <= 1 
      ? this.scene.scale.height * maxHeight 
      : maxHeight;

    // Calculate responsive font size considering both width and height
    const finalFontSize = this.calculateResponsiveFontSize(
      text,
      fontSize,
      minFontSize,
      maxWidthPx,
      maxHeightPx,
      fontFamily,
      lineSpacing
    );

    // Create the text object with word wrapping
    const textObject = this.scene.add.text(this.options.x, this.options.y, text, {
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

    if (centerOrigin) {
      textObject.setOrigin(0.5);
    }

    return {
      text: textObject,
      finalFontSize,
      actualWidth: textObject.width,
      actualHeight: textObject.height
    };
  }

  private calculateResponsiveFontSize(
    text: string,
    initialFontSize: number,
    minFontSize: number = 16,
    maxWidth: number = this.scene.scale.width * 0.9,
    maxHeight: number = this.scene.scale.height * 0.2,
    fontFamily: string = FONT_FAMILIES.PRIMARY,
    lineSpacing: number = LINE_SPACING.NORMAL
  ): number {
    let fontSize = initialFontSize;
    const tempText = this.scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      fontFamily,
      wordWrap: { 
        width: maxWidth,
        useAdvancedWrap: true
      },
      lineSpacing
    });

    // Reduce font size until text fits both width and height
    while ((tempText.width > maxWidth || tempText.height > maxHeight) && fontSize > minFontSize) {
      fontSize -= 1;
      tempText.setFontSize(fontSize);
    }

    tempText.destroy();
    return fontSize;
  }

  // Public methods

  /**
   * Get the text object
   */
  public getTextObject(): Phaser.GameObjects.Text {
    return this.textObject;
  }

  /**
   * Set the position of the text
   */
  public setPosition(x: number, y: number): void {
    this.textObject.setPosition(x, y);
  }

  /**
   * Set the text content
   */
  public setText(textKey: string, variables?: Record<string, any>): void {
    const text = variables ? tSync(textKey, variables) : tSync(textKey);
    this.textObject.setText(text);
    
    // Recalculate dimensions
    this.actualWidth = this.textObject.width;
    this.actualHeight = this.textObject.height;
  }

  /**
   * Set the font size
   */
  public setFontSize(size: number): void {
    this.textObject.setFontSize(size);
    this.finalFontSize = size;
    
    // Recalculate dimensions
    this.actualWidth = this.textObject.width;
    this.actualHeight = this.textObject.height;
  }

  /**
   * Set the color of the text
   */
  public setColor(color: string): void {
    this.textObject.setColor(color);
  }

  /**
   * Set the stroke color and thickness
   */
  public setStroke(color: string, thickness: number): void {
    this.textObject.setStroke(color, thickness);
  }

  /**
   * Set the alpha (transparency) of the text
   */
  public setAlpha(alpha: number): void {
    this.textObject.setAlpha(alpha);
  }

  /**
   * Show or hide the text
   */
  public setVisible(visible: boolean): void {
    this.textObject.setVisible(visible);
  }

  /**
   * Get the current font size
   */
  public getFontSize(): number {
    return this.finalFontSize;
  }

  /**
   * Get the actual width of the text
   */
  public getWidth(): number {
    return this.actualWidth;
  }

  /**
   * Get the actual height of the text
   */
  public getHeight(): number {
    return this.actualHeight;
  }

  /**
   * Destroy the text and clean up resources
   */
  public destroy(): void {
    this.textObject.destroy();
  }
}

// Re-export text configurations from TextConfig
export const TEXT_CONFIGS = CONFIG_TEXT_CONFIGS;

// Helper functions for backward compatibility
export function createResponsiveText(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): { text: Phaser.GameObjects.Text; finalFontSize: number; actualWidth: number; actualHeight: number } {
  const textComponent = new Text(scene, { x, y, textKey, config, variables });
  return {
    text: textComponent.getTextObject(),
    finalFontSize: textComponent.getFontSize(),
    actualWidth: textComponent.getWidth(),
    actualHeight: textComponent.getHeight()
  };
}

export function createResponsiveTitle(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const textComponent = new Text(scene, { x, y, textKey, config, variables });
  const textObject = textComponent.getTextObject();
  
  // Add bounce animation
  scene.tweens.add({
    targets: textObject,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  return textObject;
}

export function createResponsiveSubtitle(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const textComponent = new Text(scene, { x, y, textKey, config, variables });
  const textObject = textComponent.getTextObject();
  
  // Add sparkle animation
  scene.tweens.add({
    targets: textObject,
    alpha: 0.7,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
  
  return textObject;
}

export function createCenteredResponsiveText(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ResponsiveTextConfig,
  variables?: Record<string, any>
): Phaser.GameObjects.Text {
  const textComponent = new Text(scene, { x, y, textKey, config, variables, centerOrigin: true });
  return textComponent.getTextObject();
}

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
  const textComponent = new Text(scene, {
    x: 0,
    y: 0,
    textKey: text,
    config: { fontSize: initialFontSize, minFontSize, maxWidth, maxHeight, fontFamily, lineSpacing }
  });
  return textComponent.getFontSize();
}

export function calculateDynamicSpacing(
  scene: Scene,
  baseSpacing: number = 35,
  screenHeight: number = scene.scale.height
): number {
  // Calculate spacing that adapts to screen size
  const heightRatio = screenHeight / 600; // Base height of 600px
  return Math.round(baseSpacing * heightRatio);
} 