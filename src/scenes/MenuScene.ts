import { tSync, getCurrentLanguage, setLanguage } from '@/i18n';
import { phaserStateManager, PhaserGameState } from '@/utils/PhaserStateManager';
import { BaseScene } from '@/scenes/BaseScene';

export class MenuScene extends BaseScene {
  private titleText?: Phaser.GameObjects.Text;
  private playButton?: Phaser.GameObjects.Container;
  private settingsButton?: Phaser.GameObjects.Container;
  private highScoreText?: Phaser.GameObjects.Text;
  private decorativeElements: Phaser.GameObjects.GameObject[] = [];
  private isGamePaused: boolean = false;
  private pauseData?: { 
    isPaused: boolean; 
    fromLevelComplete?: boolean;
    levelData?: { level: number; totalScore: number };
  };
  
  constructor() {
    super('MenuScene');
    // Menu scene uses dedicated menu theme music
    this.setBackgroundMusic('menu-theme');
  }

  init(data?: { 
    isPaused: boolean; 
    fromLevelComplete?: boolean;
    levelData?: { level: number; totalScore: number };
    restoreFromState?: boolean;
    savedState?: PhaserGameState;
  }): void {
    // MenuScene init called
    
    // Handle scene restoration from saved state
    if (data?.restoreFromState && data?.savedState) {
      // Restoring MenuScene from saved state
      this.restoreMenuState(data.savedState);
    }
    
    this.pauseData = data;
  }

  // Implementation of BaseScene abstract methods
  protected async customPreload(): Promise<void> {
    // MenuScene specific preload (if needed)
    // BaseScene handles audio and i18n initialization
  }

  /**
   * Restore menu state from saved data
   */
  private restoreMenuState(_savedState: PhaserGameState): void {
    // Restoring menu state from saved state

    // For now, we'll restore basic menu state
    // In the future, we can enhance this to restore from scene stack data
    this.isGamePaused = false;
    this.pauseData = undefined;
    
    // Menu state restored successfully
  }

  protected customCreate(): void {
    // Check if we're coming from a paused game or level complete scene
    this.isGamePaused = this.pauseData?.isPaused || this.pauseData?.fromLevelComplete || false;
    
    // Ensure language is fully set before creating UI
    this.ensureCorrectLanguage();
    
    this.createBackground();
    this.createTitle();
    this.createMenuButtons();
    this.createHighScoreDisplay();
    this.createDecorativeElements();
    
    // Enable auto-save for development persistence
    this.enableAutoSave();
  }

  protected onLanguageChanged(): void {
    this.updateTexts();
  }

  private async ensureCorrectLanguage(): Promise<void> {
    const currentLang = getCurrentLanguage();
    
    // If language is not Ukrainian but should be, force a refresh
    if (currentLang.code === 'en') {
      const savedLang = localStorage.getItem('sand-castle-language');
      if (savedLang === 'ua') {
        await setLanguage('ua');
      }
    }
  }

  private createBackground(): void {
    // Use the common beach background from BaseScene
    this.createBeachBackground();
  }

  private createTitle(): void {
    // Use standardized title creation from BaseScene
    this.titleText = this.createStandardTitle(
      this.scale.width / 2,
      this.scale.height * 0.15,
      tSync('Sand Castle'),
      true // Enable animation
    );
  }

  private createMenuButtons(): void {
    const buttonY = this.scale.height * 0.4;
    const buttonSpacing = 100;

    if (this.isGamePaused) {
      // Check if we're coming from level complete scene
      if (this.pauseData?.fromLevelComplete) {
        // Continue Current Game Button - Large and prominent (green)
        this.playButton = this.createKidFriendlyButton(
          this.scale.width / 2,
          buttonY,
          tSync('Continue Game'),
          0x27AE60, // Green
          0x2ECC71,
          () => this.continueCurrentGame()
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
        // Resume Button - Large and prominent (green) for paused game
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
      }
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

  // Mobile optimizations are handled by BaseScene

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

  // Layout refreshing is handled by BaseScene

  private getHighScore(): number {
    try {
      return parseInt(localStorage.getItem('sand-castle-high-score') || '0');
    } catch {
      return 0;
    }
  }

  private resumeGame(): void {
    // Resume Game button clicked
    // Resume and show the GameScene, then stop MenuScene
    this.scene.resume('GameScene');
    this.scene.get('GameScene').cameras.main.setVisible(true);
    // GameScene resumed, stopping MenuScene
    this.scene.stop(); // Stop MenuScene after resuming GameScene
  }

  private startGame(): void {
    // Use BaseScene transition with music fade
    this.transitionToScene('GameScene');
  }

  private continueCurrentGame(): void {
    // Continue the current game by starting the next level
    if (this.pauseData?.levelData) {
      this.transitionToScene('GameScene', {
        continueFromLevel: true,
        currentLevel: this.pauseData.levelData.level + 1, // Continue to next level
        totalScore: this.pauseData.levelData.totalScore
      });
    } else {
      // Fallback to starting a new game if no level data
      this.transitionToScene('GameScene');
    }
  }

  private openSettings(): void {
    // Use standardized navigation helper from BaseScene
    this.goToSettings();
  }

  /**
   * Override base class method to save menu-specific game state
   */
  protected saveGameState(): void {
    const state: Omit<PhaserGameState, 'timestamp'> = {
      currentScene: 'MenuScene',
      sceneStack: [], // Will be populated by PhaserStateManager
      activeScenes: [], // Will be populated by PhaserStateManager
      gameState: {
        currentLevel: 1,
        score: 0,
        lives: 3,
        droppedParts: [],
        isGameActive: false,
        isFirstPart: true
      },
      currentLevelIndex: 0,
      droppedParts: [],
      groundViolations: [],
      totalPartsDropped: 0,
      overallPartsPlaced: 0,
      successfulPartsInstalled: 0,
      wrongPartsCurrentLevel: 0,
      totalSuccessfulPlaced: 0,
      rewardedCastleCount: 0,
      partSpeed: 80,
      direction: 1
    };

    phaserStateManager.saveGameState(this.game, state);
  }

  /**
   * Override base class method to provide menu-specific restore data
   */
  protected getSceneDataForRestore(): any {
    return {
      isGamePaused: this.isGamePaused,
      pauseData: this.pauseData,
      // Add any other menu-specific data that should survive page reload
    };
  }

  /**
   * Override base class method to restore menu-specific data
   */
  protected restoreSceneData(data: any): void {
    if (data.isGamePaused !== undefined) {
      this.isGamePaused = data.isGamePaused;
    }
    if (data.pauseData) {
      this.pauseData = data.pauseData;
    }
    console.log(`[MenuScene] Restored menu state:`, { isGamePaused: this.isGamePaused });
  }

  protected customShutdown(): void {
    // Save state before shutting down
    this.saveCurrentState();
    // BaseScene handles language change cleanup automatically
  }
} 