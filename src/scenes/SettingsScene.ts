import { Scene } from 'phaser';
import { tSync, setLanguage, getCurrentLanguage, getAvailableLanguages, onLanguageChange, offLanguageChange } from '@/i18n';
import { supportsVibration } from '@/utils/DeviceUtils';

export class SettingsScene extends Scene {
  private titleText?: Phaser.GameObjects.Text;
  private languageButtons: Phaser.GameObjects.Container[] = [];
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  private languageChangeHandler?: (lang: any) => void;
  
  constructor() {
    super({ key: 'SettingsScene' });
  }

  async preload(): Promise<void> {
    // Subscribe to language changes to update UI
    this.languageChangeHandler = () => {
      if (this.scene.isActive()) {
        this.updateLanguageButtons();
      }
    };
    onLanguageChange(this.languageChangeHandler);
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createLanguageSelector();
    this.createBackButton();
    this.setupMobileOptimizations();
  }

  private createBackground(): void {
    // Create beach-themed gradient background (same as menu)
    this.backgroundGradient = this.add.graphics();
    
    this.backgroundGradient.fillGradientStyle(
      0x87CEEB, 0x87CEEB, // Sky blue at top
      0xF4D03F, 0xE67E22, // Sandy yellow to orange at bottom
      1
    );
    this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);

    // Add simple wave effect at bottom
    const waves = this.add.graphics();
    waves.fillStyle(0x3498DB, 0.3);
    waves.beginPath();
    waves.moveTo(0, this.scale.height * 0.8);
    
    for (let x = 0; x <= this.scale.width; x += 20) {
      const waveHeight = Math.sin((x * 0.02) + (Date.now() * 0.001)) * 10;
      waves.lineTo(x, this.scale.height * 0.8 + waveHeight);
    }
    
    waves.lineTo(this.scale.width, this.scale.height);
    waves.lineTo(0, this.scale.height);
    waves.closePath();
    waves.fillPath();
  }

  private createTitle(): void {
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      stroke: '#FFFFFF',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#34495E',
        blur: 2,
        fill: true
      },
      align: 'center'
    };

    this.titleText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      tSync('Settings'),
      titleStyle
    );
    this.titleText.setOrigin(0.5);
  }

  private createLanguageSelector(): void {
    const languages = getAvailableLanguages();
    const currentLang = getCurrentLanguage();
    
    // Language section title
    const sectionTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.3,
      tSync('Language'),
      {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 2,
        align: 'center'
      }
    );
    sectionTitle.setOrigin(0.5);

    // Create language buttons
    const buttonY = this.scale.height * 0.45;
    const buttonSpacing = 120;

    languages.forEach((lang, index) => {
      const isSelected = lang.code === currentLang.code;
      const button = this.createLanguageButton(
        this.scale.width / 2,
        buttonY + (index * buttonSpacing),
        lang,
        isSelected,
        () => this.selectLanguage(lang.code)
      );
      
      this.languageButtons.push(button);
    });
  }

  private createLanguageButton(
    x: number,
    y: number,
    language: any,
    isSelected: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const buttonWidth = 300;
    const buttonHeight = 80;
    
    // Button background
    const background = this.add.graphics();
    const primaryColor = isSelected ? 0x27AE60 : 0x3498DB; // Green if selected, blue if not
    const hoverColor = isSelected ? 0x2ECC71 : 0x5DADE2;
    
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
    background.lineStyle(4, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

    // Language name text
    const buttonText = this.add.text(0, 0, language.name, {
      fontSize: '24px',
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

    // Selection indicator
    let selectionIndicator: Phaser.GameObjects.Graphics | undefined;
    if (isSelected) {
      selectionIndicator = this.add.graphics();
      selectionIndicator.fillStyle(0xFFFFFF);
      selectionIndicator.fillCircle(buttonWidth/2 - 20, 0, 8);
    }

    const elements = [background, buttonText];
    if (selectionIndicator) {
      elements.push(selectionIndicator);
    }
    
    container.add(elements);
    container.setSize(buttonWidth + 20, buttonHeight + 20);
    container.setInteractive();

    // Store references for updates
    (container as any).background = background;
    (container as any).text = buttonText;
    (container as any).selectionIndicator = selectionIndicator;
    (container as any).language = language;
    (container as any).onClick = onClick;

    // Button interactions
    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(hoverColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.95);
      
      this.tweens.add({
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

  private createBackButton(): void {
    this.createKidFriendlyButton(
      this.scale.width / 2,
      this.scale.height * 0.85,
      tSync('Back to Menu'),
      0xE74C3C, // Red
      0xEC7063,
      () => this.goBack()
    );
  }

  private createKidFriendlyButton(
    x: number,
    y: number,
    text: string,
    primaryColor: number,
    hoverColor: number,
    onClick: () => void,
    scale: number = 1
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const buttonWidth = 280 * scale;
    const buttonHeight = 80 * scale;
    
    const background = this.add.graphics();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
    background.lineStyle(4, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: `${28 * scale}px`,
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
    container.setSize(buttonWidth + 20, buttonHeight + 20);
    container.setInteractive();

    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(hoverColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.95);
      
      this.tweens.add({
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

  private setupMobileOptimizations(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const isTouchInput = (pointer as any).pointerType === 'touch' || (pointer.event as any)?.pointerType === 'touch';

      if (isTouchInput && supportsVibration()) {
        navigator.vibrate(50);
      }

      if (this.sound.locked) {
        this.sound.unlock();
      } else {
        const ctx = (this.sound as any).context as AudioContext | undefined;
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {/* ignore */});
        }
      }
    });
  }

  private async selectLanguage(languageCode: string): Promise<void> {
    // Selecting language
    await setLanguage(languageCode);
    this.updateLanguageButtons();
  }

  private updateLanguageButtons(): void {
    const currentLang = getCurrentLanguage();
    
    this.languageButtons.forEach(button => {
      const language = (button as any).language;
      const isSelected = language.code === currentLang.code;
      const background = (button as any).background;
      const selectionIndicator = (button as any).selectionIndicator;
      
      // Update background color
      const primaryColor = isSelected ? 0x27AE60 : 0x3498DB;
      const buttonWidth = 300;
      const buttonHeight = 80;
      
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

      // Update selection indicator
      if (isSelected && !selectionIndicator) {
        const newIndicator = this.add.graphics();
        newIndicator.fillStyle(0xFFFFFF);
        newIndicator.fillCircle(buttonWidth/2 - 20, 0, 8);
        button.add(newIndicator);
        (button as any).selectionIndicator = newIndicator;
      } else if (!isSelected && selectionIndicator) {
        selectionIndicator.destroy();
        (button as any).selectionIndicator = undefined;
      }
    });
  }

  private goBack(): void {
    // Stop SettingsScene and return to MenuScene (which should be running in background)
    this.scene.stop();
  }

  shutdown(): void {
    if (this.languageChangeHandler) {
      offLanguageChange(this.languageChangeHandler);
      this.languageChangeHandler = undefined;
    }
  }
} 