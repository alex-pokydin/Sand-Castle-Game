import { Scene } from 'phaser';
import { tSync } from '@/i18n';
import { BUTTON_COLORS } from '@/config/ColorConfig';

export interface ButtonConfig {
  primaryColor: number;
  hoverColor: number;
  scale?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  borderRadius?: number;
  borderWidth?: number;
}

export interface ButtonOptions {
  x: number;
  y: number;
  textKey: string;
  config: ButtonConfig;
  onClick: () => void;
  variables?: Record<string, any>;
  container?: Phaser.GameObjects.Container;
}

export class Button {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private options: ButtonOptions;
  private isHovered: boolean = false;

  constructor(scene: Scene, options: ButtonOptions) {
    this.scene = scene;
    this.options = options;
    
    const { x, y, container } = options;
    
    // Create container in the specified parent or scene
    if (container) {
      this.container = scene.add.container(x, y);
      container.add(this.container);
    } else {
      this.container = scene.add.container(x, y);
    }
    
    this.createButton();
    this.setupInteractivity();
  }

  private createButton(): void {
    const {
      config,
      textKey,
      variables
    } = this.options;

    const {
      primaryColor,
      scale = 1,
      width = 280,
      height = 70,
      fontSize = 28,
      borderRadius = 20,
      borderWidth = 4
    } = config;

    const buttonWidth = width * scale;
    const buttonHeight = height * scale;

    // Button background with rounded corners
    this.background = this.scene.add.graphics();
    this.background.fillStyle(primaryColor);
    this.background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    
    // White border for definition
    this.background.lineStyle(borderWidth, 0xFFFFFF);
    this.background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);

    // Button text
    this.text = this.scene.add.text(0, 0, variables ? tSync(textKey, variables) : tSync(textKey), {
      fontSize: `${fontSize * scale}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 2,
        fill: true
      }
    });
    this.text.setOrigin(0.5);

    this.container.add([this.background, this.text]);

    // Interactive area with generous touch target
    this.container.setSize(buttonWidth + 20, buttonHeight + 20);
  }

  private setupInteractivity(): void {
    this.container.setInteractive();

    // Button animations
    this.container.on('pointerover', () => {
      this.isHovered = true;
      this.updateBackground();
      this.container.setScale(1.05);
    });

    this.container.on('pointerout', () => {
      this.isHovered = false;
      this.updateBackground();
      this.container.setScale(1);
    });

    this.container.on('pointerdown', () => {
      this.container.setScale(0.95);
      
      // Click animation
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          if (this.options.onClick) {
            this.options.onClick();
          }
        }
      });
    });
  }

  private updateBackground(): void {
    const {
      scale = 1,
      width = 280,
      height = 70,
      borderRadius = 20,
      borderWidth = 4
    } = this.options.config;

    const buttonWidth = width * scale;
    const buttonHeight = height * scale;
    const color = this.isHovered ? this.options.config.hoverColor : this.options.config.primaryColor;

    this.background.clear();
    this.background.fillStyle(color);
    this.background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    this.background.lineStyle(borderWidth, 0xFFFFFF);
    this.background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
  }

  // Public methods

  /**
   * Get the button container
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Set the position of the button
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Set the scale of the button
   */
  public setScale(scale: number): void {
    this.container.setScale(scale);
  }

  /**
   * Update the button text
   */
  public setText(textKey: string, variables?: Record<string, any>): void {
    this.text.setText(variables ? tSync(textKey, variables) : tSync(textKey));
  }

  /**
   * Enable or disable the button
   */
  public setEnabled(enabled: boolean): void {
    this.container.setInteractive(enabled);
    this.container.setAlpha(enabled ? 1 : 0.5);
  }

  /**
   * Show or hide the button
   */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Destroy the button and clean up resources
   */
  public destroy(): void {
    this.container.destroy();
  }
}

// Predefined button configurations
export const BUTTON_CONFIGS = {
  PRIMARY: {
    primaryColor: BUTTON_COLORS.PRIMARY.primary,
    hoverColor: BUTTON_COLORS.PRIMARY.hover,
    scale: 1
  },
  SECONDARY: {
    primaryColor: BUTTON_COLORS.SECONDARY.primary,
    hoverColor: BUTTON_COLORS.SECONDARY.hover,
    scale: 1
  },
  WARNING: {
    primaryColor: BUTTON_COLORS.WARNING.primary,
    hoverColor: BUTTON_COLORS.WARNING.hover,
    scale: 1
  },
  SMALL: {
    primaryColor: BUTTON_COLORS.SMALL.primary,
    hoverColor: BUTTON_COLORS.SMALL.hover,
    scale: 0.8
  },
  DANGER: {
    primaryColor: BUTTON_COLORS.DANGER.primary,
    hoverColor: BUTTON_COLORS.DANGER.hover,
    scale: 1
  },
  SUCCESS: {
    primaryColor: BUTTON_COLORS.SUCCESS.primary,
    hoverColor: BUTTON_COLORS.SUCCESS.hover,
    scale: 1
  }
} as const;

// Helper functions for backward compatibility
export function createKidFriendlyButton(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ButtonConfig,
  onClick: () => void,
  variables?: Record<string, any>
): Phaser.GameObjects.Container {
  const button = new Button(scene, { x, y, textKey, config, onClick, variables });
  return button.getContainer();
}

export function createKidFriendlyButtonInContainer(
  scene: Scene,
  container: Phaser.GameObjects.Container,
  x: number,
  y: number,
  textKey: string,
  config: ButtonConfig,
  onClick: () => void,
  variables?: Record<string, any>
): Phaser.GameObjects.Container {
  const button = new Button(scene, { x, y, textKey, config, onClick, variables, container });
  return button.getContainer();
} 