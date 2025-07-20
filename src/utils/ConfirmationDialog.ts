import { Scene } from 'phaser';
import { tSync } from '@/i18n';

export interface ConfirmationDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: number;
  cancelColor?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export class ConfirmationDialog {
  private scene: Scene;
  private overlay?: Phaser.GameObjects.Rectangle;
  private dialog?: Phaser.GameObjects.Container;
  private options: ConfirmationDialogOptions;

  constructor(scene: Scene, options: ConfirmationDialogOptions) {
    this.scene = scene;
    this.options = {
      confirmText: tSync('Yes'),
      cancelText: tSync('No'),
      confirmColor: 0xE74C3C, // Red for destructive actions
      cancelColor: 0x3498DB,  // Blue for safe actions
      ...options
    };
  }

  show(): void {
    // Create a semi-transparent overlay
    this.overlay = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.7
    );

    // Create confirmation dialog - responsive width
    const dialogWidth = Math.min(400, this.scene.scale.width * 0.9); // 90% of screen width, max 400px
    const dialogHeight = 200;
    const padding = 20; // Padding from dialog edges
    this.dialog = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);

    // Dialog background
    const dialogBg = this.scene.add.rectangle(0, 0, dialogWidth, dialogHeight, 0xFFFFFF);
    dialogBg.setStrokeStyle(3, 0x3498DB);
    this.dialog.add(dialogBg);

    // Dialog title
    const titleFontSize = Math.max(18, Math.min(24, dialogWidth * 0.06)); // Responsive font size
    const title = this.scene.add.text(0, -60, this.options.title, {
      fontSize: `${titleFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.dialog.add(title);

    // Dialog message
    const messageFontSize = Math.max(14, Math.min(18, dialogWidth * 0.045)); // Responsive font size
    const message = this.scene.add.text(0, -20, this.options.message, {
      fontSize: `${messageFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#7F8C8D',
      align: 'center'
    });
    message.setOrigin(0.5);
    this.dialog.add(message);

    // Buttons - create manually to ensure proper positioning with padding
    const availableWidth = dialogWidth - (padding * 2); // Account for padding
    const buttonWidth = Math.min(200, availableWidth * 0.4); // 40% of available width, max 200px
    const buttonHeight = 50;
    const buttonSpacing = Math.max(20, availableWidth * 0.1); // 10% of available width, min 20px
    
    // Calculate button positions to respect padding
    const leftButtonX = -buttonSpacing - buttonWidth/2;
    const rightButtonX = buttonSpacing + buttonWidth/2;
    const buttonY = 40;
    
    // Confirm button (left side)
    const confirmButtonBg = this.scene.add.rectangle(
      leftButtonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      this.options.confirmColor!
    );
    confirmButtonBg.setStrokeStyle(3, 0xFFFFFF);
    confirmButtonBg.setInteractive();
    this.dialog.add(confirmButtonBg);
    
    const buttonFontSize = Math.max(14, Math.min(18, buttonWidth * 0.09)); // Responsive font size
    const confirmButtonText = this.scene.add.text(
      leftButtonX,
      buttonY,
      this.options.confirmText!,
      {
        fontSize: `${buttonFontSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    );
    confirmButtonText.setOrigin(0.5);
    this.dialog.add(confirmButtonText);
    
    // Cancel button (right side)
    const cancelButtonBg = this.scene.add.rectangle(
      rightButtonX,
      buttonY,
      buttonWidth,
      buttonHeight,
      this.options.cancelColor!
    );
    cancelButtonBg.setStrokeStyle(3, 0xFFFFFF);
    cancelButtonBg.setInteractive();
    this.dialog.add(cancelButtonBg);
    
    const cancelButtonText = this.scene.add.text(
      rightButtonX,
      buttonY,
      this.options.cancelText!,
      {
        fontSize: `${buttonFontSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    );
    cancelButtonText.setOrigin(0.5);
    this.dialog.add(cancelButtonText);
    
    // Add click handlers
    confirmButtonBg.on('pointerdown', () => this.confirm());
    cancelButtonBg.on('pointerdown', () => this.cancel());

    // Make overlay and dialog interactive
    this.overlay.setInteractive();
    this.dialog.setSize(dialogWidth, dialogHeight);
    this.dialog.setInteractive();
  }

  private confirm(): void {
    this.hide();
    this.options.onConfirm();
  }

  private cancel(): void {
    this.hide();
    this.options.onCancel();
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = undefined;
    }
    if (this.dialog) {
      this.dialog.destroy();
      this.dialog = undefined;
    }
  }

  destroy(): void {
    this.hide();
  }
} 