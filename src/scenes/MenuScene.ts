import { Scene } from 'phaser';
import { tSync, initI18n, onLanguageChange, offLanguageChange, getCurrentLanguage, setLanguage } from '@/i18n';
import { supportsVibration } from '@/utils/DeviceUtils';

export class MenuScene extends Scene {
  private titleText?: Phaser.GameObjects.Text;
  private playButton?: Phaser.GameObjects.Container;
  private settingsButton?: Phaser.GameObjects.Container;
  private highScoreText?: Phaser.GameObjects.Text;
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  private decorativeElements: Phaser.GameObjects.GameObject[] = [];
  private isGamePaused: boolean = false;
  private languageChangeHandler?: (lang: any) => void;
  private pauseData?: { isPaused: boolean };
  
  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data?: { isPaused: boolean }): void {
    console.log('MenuScene init called with data:', data);
    this.pauseData = data;
  }

  async preload(): Promise<void> {
    // Initialize i18n system
    await initI18n();
    
    // Subscribe to language changes to update UI
    this.languageChangeHandler = () => {
      // Only update if scene is active to avoid calling on destroyed objects
      if (this.scene.isActive()) {
        this.updateTexts();
      }
    };
    onLanguageChange(this.languageChangeHandler);
  }

  async create(): Promise<void> {
    // Check if we're coming from a paused game - use passed data or fallback to scene check
    this.isGamePaused = this.pauseData?.isPaused || (this.scene.isActive('GameScene') && this.scene.isPaused('GameScene'));
    
    // Ensure language is fully set before creating UI
    const currentLang = getCurrentLanguage();
    
    // If language is not Ukrainian but should be, force a refresh
    if (currentLang.code === 'en') {
      const savedLang = localStorage.getItem('sand-castle-language');
      if (savedLang === 'ua') {
        await setLanguage('ua');
      }
    }
    
    this.createBackground();
    this.createTitle();
    this.createMenuButtons();
    this.createHighScoreDisplay();
    this.createDecorativeElements();
    this.setupMobileOptimizations();
  }

  private createBackground(): void {
    // Create beach-themed gradient background
    this.backgroundGradient = this.add.graphics();
    
    // Beach sky gradient - light blue to sandy yellow
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
    
    // Create wave path
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
    // Large, colorful title with shadow for depth
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '40px',
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
      tSync('Sand Castle'),
      titleStyle
    );
    this.titleText.setOrigin(0.5);

    // Add gentle bounce animation
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createMenuButtons(): void {
    const buttonY = this.scale.height * 0.4;
    const buttonSpacing = 100;

    if (this.isGamePaused) {
      // Resume Button - Large and prominent (green)
      this.playButton = this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY,
        tSync('Resume Game'),
        0x27AE60, // Green
        0x2ECC71,
        () => this.resumeGame()
      );

      // New Game Button - Secondary option (orange)
      const newGameButton = this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY + buttonSpacing,
        tSync('New Game'),
        0xE67E22, // Orange
        0xF39C12,
        () => this.startGame(),
        0.8 // Slightly smaller
      );

      // Settings Button - Smaller
      this.settingsButton = this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY + buttonSpacing * 2,
        tSync('Settings'),
        0x3498DB, // Blue
        0x5DADE2,
        () => this.openSettings(),
        0.7 // Smaller
      );

      this.setupButtonSounds([this.playButton, newGameButton, this.settingsButton]);
    } else {
      // Play Button - Large and prominent
      this.playButton = this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY,
        tSync('Play Game'),
        0x27AE60, // Green
        0x2ECC71,
        () => this.startGame()
      );

      // Settings Button - Smaller but still kid-friendly
      this.settingsButton = this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY + buttonSpacing,
        tSync('Settings'),
        0x3498DB, // Blue
        0x5DADE2,
        () => this.openSettings(),
        0.8 // Slightly smaller
      );

      this.setupButtonSounds([this.playButton, this.settingsButton]);
    }
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

    // Button background with rounded corners effect
    const buttonWidth = 280 * scale;
    const buttonHeight = 80 * scale;
    
    const background = this.add.graphics();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
    
    // Add white border for definition
    background.lineStyle(4, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: `${32 * scale}px`,
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

    // Make interactive with generous touch area
    container.setSize(buttonWidth + 20, buttonHeight + 20);
    container.setInteractive();

    // Button animations and feedback
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
      
      // Add satisfying click animation
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



  private createHighScoreDisplay(): void {
    const highScore = this.getHighScore();
    
    this.highScoreText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.85,
      tSync('High Score') + ': ' + highScore.toLocaleString(),
      {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 2
      }
    );
    this.highScoreText.setOrigin(0.5);
  }

  private createDecorativeElements(): void {
    // Add some playful sand castle silhouettes in background
    for (let i = 0; i < 3; i++) {
      const castle = this.add.graphics();
      castle.fillStyle(0x2C3E50, 0.1);
      
      const x = (this.scale.width / 4) * (i + 1);
      const y = this.scale.height * 0.85;
      
      // Simple castle shape
      castle.fillRect(x - 20, y - 30, 40, 30); // Base
      castle.fillRect(x - 15, y - 50, 30, 20); // Middle
      castle.fillRect(x - 10, y - 65, 20, 15); // Top
      castle.fillTriangle(x - 8, y - 65, x + 8, y - 65, x, y - 75); // Flag
      
      this.decorativeElements.push(castle);
    }

    // Add floating sparkles for magical feel
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.star(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(100, this.scale.height - 200),
        5, 3, 6,
        0xFFD700,
        0.6
      );
      
      // Gentle floating animation
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - 20,
        alpha: 0.3,
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
      
      this.decorativeElements.push(sparkle);
    }
  }

  private setupMobileOptimizations(): void {
    // Ensure all interactive elements have minimum 44px touch targets
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Determine if this was a genuine touch interaction
      const isTouchInput = (pointer as any).pointerType === 'touch' || (pointer.event as any)?.pointerType === 'touch';

      if (isTouchInput && supportsVibration()) {
        navigator.vibrate(50);
      }

      // Resume / unlock the Web Audio context as soon as we have a user gesture
      if (this.sound.locked) {
        this.sound.unlock();
      } else {
        const ctx = (this.sound as any).context as AudioContext | undefined;
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {/* ignore */});
        }
      }
    });

    // Add orientation change handling
    this.scale.on('orientationchange', () => {
      this.time.delayedCall(100, () => {
        this.refreshLayout();
      });
    });
  }

  private setupButtonSounds(buttons: Phaser.GameObjects.Container[]): void {
    buttons.forEach(button => {
      button.on('pointerover', () => {
        // Add subtle hover sound
        // this.sound.play('buttonHover', { volume: 0.3 });
      });
      
      button.on('pointerdown', () => {
        // Add satisfying click sound
        // this.sound.play('buttonClick', { volume: 0.5 });
      });
    });
  }

  private updateTexts(): void {
    // Update all text elements when language changes
    if (this.titleText) {
      this.titleText.setText(tSync('Sand Castle'));
    }
    
    const playButtonText = this.playButton?.list?.[1] as Phaser.GameObjects.Text;
    if (playButtonText) {
      const buttonText = this.isGamePaused ? tSync('Resume Game') : tSync('Play Game');
      playButtonText.setText(buttonText);
    }
    
    const settingsButtonText = this.settingsButton?.list?.[1] as Phaser.GameObjects.Text;
    if (settingsButtonText) {
      settingsButtonText.setText(tSync('Settings'));
    }
    
    if (this.highScoreText) {
      const highScore = this.getHighScore();
      this.highScoreText.setText(tSync('High Score') + ': ' + highScore.toLocaleString());
    }
  }

  private refreshLayout(): void {
    // Refresh layout for orientation changes
    // This would recalculate positions based on new screen dimensions
    const newWidth = this.scale.width;
    const newHeight = this.scale.height;
    
    // Update background
    if (this.backgroundGradient) {
      this.backgroundGradient.clear();
      this.backgroundGradient.fillGradientStyle(
        0x87CEEB, 0x87CEEB,
        0xF4D03F, 0xE67E22,
        1
      );
      this.backgroundGradient.fillRect(0, 0, newWidth, newHeight);
    }
    
    // Update positions of main elements
    if (this.titleText) {
      this.titleText.setPosition(newWidth / 2, newHeight * 0.15);
    }
    
    // Update other elements similarly...
  }

  private getHighScore(): number {
    try {
      return parseInt(localStorage.getItem('sand-castle-high-score') || '0');
    } catch {
      return 0;
    }
  }

  private resumeGame(): void {
    console.log('Resume Game button clicked');
    console.log('Attempting to resume GameScene');
    // Resume and show the GameScene, then stop MenuScene
    this.scene.resume('GameScene');
    this.scene.get('GameScene').cameras.main.setVisible(true);
    console.log('GameScene resumed, stopping MenuScene');
    this.scene.stop(); // Stop MenuScene after resuming GameScene
  }

  private startGame(): void {
    // Transition to GameScene with nice effect
    this.cameras.main.fadeOut(300, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private openSettings(): void {
    // Transition to SettingsScene with fade effect
    this.cameras.main.fadeOut(300, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('SettingsScene');
    });
  }

  shutdown(): void {
    // Unsubscribe language change listener
    if (this.languageChangeHandler) {
      offLanguageChange(this.languageChangeHandler);
      this.languageChangeHandler = undefined;
    }
  }
} 