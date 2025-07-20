import { Scene } from 'phaser';
import { tSync } from '@/i18n';

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

/**
 * Creates a kid-friendly button with animations and touch feedback
 * Positioned at absolute screen coordinates
 */
export function createKidFriendlyButton(
  scene: Scene,
  x: number,
  y: number,
  textKey: string,
  config: ButtonConfig,
  onClick: () => void,
  variables?: Record<string, any>
): Phaser.GameObjects.Container {
  const {
    primaryColor,
    hoverColor,
    scale = 1,
    width = 280,
    height = 70,
    fontSize = 28,
    borderRadius = 20,
    borderWidth = 4
  } = config;

  const container = scene.add.container(x, y);
  const buttonWidth = width * scale;
  const buttonHeight = height * scale;

  // Button background with rounded corners
  const background = scene.add.graphics();
  background.fillStyle(primaryColor);
  background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
  
  // White border for definition
  background.lineStyle(borderWidth, 0xFFFFFF);
  background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);

  // Button text
  const buttonText = scene.add.text(0, 0, variables ? tSync(textKey, variables) : tSync(textKey), {
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
  buttonText.setOrigin(0.5);

  container.add([background, buttonText]);

  // Interactive area with generous touch target
  container.setSize(buttonWidth + 20, buttonHeight + 20);
  container.setInteractive();

  // Button animations
  container.on('pointerover', () => {
    background.clear();
    background.fillStyle(hoverColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    background.lineStyle(borderWidth, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    
    container.setScale(1.05);
  });

  container.on('pointerout', () => {
    background.clear();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    background.lineStyle(borderWidth, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    
    container.setScale(1);
  });

  container.on('pointerdown', () => {
    container.setScale(0.95);
    
    // Click animation
    scene.tweens.add({
      targets: container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      onComplete: onClick
    });
  });

  return container;
}

/**
 * Creates a kid-friendly button within a container
 * Positioned relative to the container's origin
 */
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
  const {
    primaryColor,
    hoverColor,
    scale = 1,
    width = 280,
    height = 70,
    fontSize = 28,
    borderRadius = 20,
    borderWidth = 4
  } = config;

  const buttonContainer = scene.add.container(0, 0); // Create at origin
  const buttonWidth = width * scale;
  const buttonHeight = height * scale;

  // Button background with rounded corners
  const background = scene.add.graphics();
  background.fillStyle(primaryColor);
  background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
  
  // White border for definition
  background.lineStyle(borderWidth, 0xFFFFFF);
  background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);

  // Button text
  const buttonText = scene.add.text(0, 0, variables ? tSync(textKey, variables) : tSync(textKey), {
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
  buttonText.setOrigin(0.5);

  buttonContainer.add([background, buttonText]);

  // Interactive area with generous touch target
  buttonContainer.setSize(buttonWidth + 20, buttonHeight + 20);
  buttonContainer.setInteractive();

  // Button animations
  buttonContainer.on('pointerover', () => {
    background.clear();
    background.fillStyle(hoverColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    background.lineStyle(borderWidth, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    
    buttonContainer.setScale(1.05);
  });

  buttonContainer.on('pointerout', () => {
    background.clear();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    background.lineStyle(borderWidth, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, borderRadius);
    
    buttonContainer.setScale(1);
  });

  buttonContainer.on('pointerdown', () => {
    buttonContainer.setScale(0.95);
    
    // Click animation
    scene.tweens.add({
      targets: buttonContainer,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      onComplete: onClick
    });
  });

  // Position the button container within the parent container
  buttonContainer.setPosition(x, y);
  container.add(buttonContainer);

  return buttonContainer;
}

/**
 * Predefined button configurations for common use cases
 */
export const BUTTON_CONFIGS = {
  // Primary action buttons (Next Level, Try Again)
  PRIMARY: {
    primaryColor: 0x27AE60, // Green
    hoverColor: 0x2ECC71,
    scale: 1,
    width: 280,
    height: 70,
    fontSize: 28,
    borderRadius: 20,
    borderWidth: 4
  },
  
  // Secondary action buttons (Main Menu)
  SECONDARY: {
    primaryColor: 0x3498DB, // Blue
    hoverColor: 0x5DADE2,
    scale: 0.8,
    width: 280,
    height: 70,
    fontSize: 28,
    borderRadius: 18,
    borderWidth: 3
  },
  
  // Warning/restart buttons (Restart Level)
  WARNING: {
    primaryColor: 0xE67E22, // Orange
    hoverColor: 0xF39C12,
    scale: 0.8,
    width: 280,
    height: 70,
    fontSize: 28,
    borderRadius: 18,
    borderWidth: 3
  },
  
  // Small buttons for compact layouts
  SMALL: {
    primaryColor: 0x3498DB,
    hoverColor: 0x5DADE2,
    scale: 0.7,
    width: 260,
    height: 65,
    fontSize: 26,
    borderRadius: 18,
    borderWidth: 3
  }
} as const; 