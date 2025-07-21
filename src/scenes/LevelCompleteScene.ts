import { tSync } from '@/i18n';
import { phaserStateManager, PhaserGameState } from '@/utils/PhaserStateManager';
import { 
  createResponsiveTitle, 
  createResponsiveSubtitle, 
  createCenteredResponsiveText, 
  calculateDynamicSpacing,
  TEXT_CONFIGS 
} from '@/utils/TextUtils';
import { createKidFriendlyButton, BUTTON_CONFIGS } from '@/utils/ButtonUtils';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { BaseScene } from '@/scenes/BaseScene';

interface LevelCompleteData {
  level: number;
  score: number;
  partsPlaced: number;
  perfectDrops: number;
  totalScore: number;
}

export class LevelCompleteScene extends BaseScene {
  private levelData?: LevelCompleteData;
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  private celebrationElements: Phaser.GameObjects.GameObject[] = [];
  private confirmationDialog?: ConfirmationDialog;
  
  constructor() {
    super('LevelCompleteScene');
    // Set celebration music for level completion
    this.setBackgroundMusic('level-complete-music');
  }

  // Implementation of BaseScene abstract methods
  protected async customPreload(): Promise<void> {
    // No custom preload logic needed - BaseScene handles audio and i18n
  }

  protected onLanguageChanged(): void {
    // BaseScene components automatically handle translations
    // Only update custom text objects here if needed
  }

  init(data?: LevelCompleteData & { restoreFromState?: boolean; savedState?: PhaserGameState }): void {
    // Handle scene restoration from saved state
    if (data?.restoreFromState && data?.savedState) {
      this.restoreLevelCompleteState(data.savedState);
      return;
    }
    
    this.levelData = data;
  }

  /**
   * Restore level complete state from saved data
   */
  private restoreLevelCompleteState(savedState: PhaserGameState): void {
    // Restore level data from saved state
    this.levelData = {
      level: savedState.gameState.currentLevel,
      score: 100, // Level completion bonus
      partsPlaced: savedState.successfulPartsInstalled,
      perfectDrops: 0,
      totalScore: savedState.gameState.score
    };
  }

  protected customCreate(): void {
    this.createBackground();
    this.createLevelCompleteTitle();
    this.createStatsDisplay();
    this.createActionButtons();
    this.createCelebrationEffects();
    // Mobile optimizations and auto-save are handled by BaseScene
  }

  private createBackground(): void {
    // Create warm, encouraging gradient background
    this.backgroundGradient = this.add.graphics();
    this.backgroundGradient.fillGradientStyle(
      0x4ECDC4, 0x45B7D1, // Teal to blue
      0x96CEB4, 0xFFEAA7, // Mint to light yellow
      1
    );
    this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  private createLevelCompleteTitle(): void {
    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 40);
    
    // Main level complete title with responsive sizing
    const title = createResponsiveTitle(
      this,
      this.scale.width / 2,
      this.scale.height * 0.12, // Moved up slightly
      'Level {{level}} Complete!',
      TEXT_CONFIGS.TITLE_MEDIUM,
      { level: this.levelData?.level || 1 }
    );
    title.setOrigin(0.5);

    // Encouraging subtitle with responsive sizing
    const encouragementMessages = [
      'Great Building!',
      'Well Done!',
      'Excellent Work!',
      'Fantastic Progress!',
      'Amazing Skills!'
    ];
    
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    
    const subtitle = createResponsiveSubtitle(
      this,
      this.scale.width / 2,
      title.y + title.height / 2 + spacing, // Position relative to title
      randomMessage,
      TEXT_CONFIGS.SUBTITLE_MEDIUM
    );
    subtitle.setOrigin(0.5);
  }

  private createStatsDisplay(): void {
    if (!this.levelData) return;

    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 35);
    
    // Start stats display after subtitle with proper spacing
    const statsStartY = this.scale.height * 0.35; // Adjusted starting position

    // Level score with responsive sizing
    const scoreText = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      statsStartY,
      'Level Score: {{score}}',
      TEXT_CONFIGS.STATS_MEDIUM,
      { score: this.levelData.score }
    );

    // Parts placed
    const partsText = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      scoreText.y + scoreText.height / 2 + spacing,
      'Parts Placed: {{count}}',
      TEXT_CONFIGS.STATS_SMALL,
      { count: this.levelData.partsPlaced }
    );

    let currentY = partsText.y + partsText.height / 2 + spacing;

    // Perfect drops (if any)
    if (this.levelData.perfectDrops > 0) {
      const perfectConfig = {
        ...TEXT_CONFIGS.STATS_TINY,
        color: '#27AE60',
        fontStyle: 'bold'
      };
      
      const perfectText = createCenteredResponsiveText(
        this,
        this.scale.width / 2,
        currentY,
        'Perfect Drops: {{count}}',
        perfectConfig,
        { count: this.levelData.perfectDrops }
      );
      
      currentY = perfectText.y + perfectText.height / 2 + spacing;
    }

    // Total score
    const totalScoreConfig = {
      ...TEXT_CONFIGS.STATS_MEDIUM,
      color: '#E67E22'
    };
    
    createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      currentY,
      'Total Score: {{score}}',
      totalScoreConfig,
      { score: this.levelData.totalScore }
    );
  }

  private createActionButtons(): void {
    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 90);
    
    // Position buttons in the lower portion of the screen
    const buttonY = this.scale.height * 0.8; // Moved down slightly

    // Continue to next level button (primary action) using BaseScene helper
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY,
      'Next Level',
      BUTTON_CONFIGS.PRIMARY,
      () => this.continueToNextLevel()
    );

    // Finish game button (secondary action) using BaseScene helper
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY + spacing,
      'Finish Game',
      BUTTON_CONFIGS.SECONDARY,
      () => this.finishGame()
    );
  }

  private createCelebrationEffects(): void {
    this.createConfetti();
    this.createSparkles();
  }

  private createConfetti(): void {
    // Falling confetti
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(Phaser.Math.Between(0, 2000), () => {
        const confetti = this.add.rectangle(
          Phaser.Math.Between(0, this.scale.width),
          -20,
          8, 5,
          Phaser.Math.Between(0x000000, 0xFFFFFF)
        );
        
        this.tweens.add({
          targets: confetti,
          y: this.scale.height + 20,
          rotation: Math.PI * 3,
          duration: Phaser.Math.Between(2000, 3500),
          ease: 'Linear',
          onComplete: () => confetti.destroy()
        });
        
        this.celebrationElements.push(confetti);
      });
    }
  }

  private createSparkles(): void {
    // Gentle sparkles around the screen
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.star(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(100, this.scale.height - 100),
        5, 4, 6,
        0x4ECDC4,
        0.6
      );
      
      this.tweens.add({
        targets: sparkle,
        alpha: 0.3,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
      
      this.celebrationElements.push(sparkle);
    }
  }

  private continueToNextLevel(): void {
    // Use BaseScene transition helper with music handling
    this.transitionToScene('GameScene', {
      continueFromLevel: true,
      currentLevel: (this.levelData?.level || 1) + 1,
      totalScore: this.levelData?.totalScore || 0
    });
  }

  private finishGame(): void {
    // Show confirmation dialog before finishing game
    this.showFinishGameConfirmation();
  }

  private showFinishGameConfirmation(): void {
    this.confirmationDialog = new ConfirmationDialog(this, {
      title: tSync('Finish Game?'),
      message: tSync('Your progress will be lost.'),
      confirmText: tSync('Yes'),
      cancelText: tSync('No'),
      onConfirm: () => this.confirmFinishGame(),
      onCancel: () => this.cancelFinishGame()
    });
    
    this.confirmationDialog.show();
  }

  private confirmFinishGame(): void {
    // Use BaseScene navigation helper
    this.goToMenu();
  }

  private cancelFinishGame(): void {
    // Dialog is automatically cleaned up by the component
  }

  /**
   * Override base class method to save level complete-specific game state
   */
  protected saveGameState(): void {
    const state: Omit<PhaserGameState, 'timestamp'> = {
      currentScene: 'LevelCompleteScene',
      sceneStack: [], // Will be populated by PhaserStateManager
      activeScenes: ['LevelCompleteScene'], // Explicitly set this scene as active
      gameState: {
        currentLevel: this.levelData?.level || 1,
        score: this.levelData?.totalScore || 0,
        lives: 3,
        droppedParts: [],
        isGameActive: false,
        isFirstPart: true
      },
      currentLevelIndex: (this.levelData?.level || 1) - 1,
      droppedParts: [],
      groundViolations: [],
      totalPartsDropped: 0,
      overallPartsPlaced: this.levelData?.partsPlaced || 0,
      successfulPartsInstalled: this.levelData?.partsPlaced || 0,
      wrongPartsCurrentLevel: 0,
      totalSuccessfulPlaced: this.levelData?.partsPlaced || 0,
      rewardedCastleCount: 0,
      partSpeed: 80,
      direction: 1
    };

    phaserStateManager.saveGameState(this.game, state);
  }

  /**
   * Override base class method to provide level complete-specific restore data
   */
  protected getSceneDataForRestore(): any {
    return {
      levelData: this.levelData,
      // Add any other level complete-specific data that should survive page reload
    };
  }

  /**
   * Override base class method to restore level complete-specific data
   */
  protected restoreSceneData(data: any): void {
    if (data.levelData) {
      this.levelData = data.levelData;
    }
    console.log(`[LevelCompleteScene] Restored level complete state:`, this.levelData);
  }

  protected customShutdown(): void {
    // Clean up celebration elements
    this.celebrationElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.celebrationElements = [];

    // Clean up confirmation dialog
    if (this.confirmationDialog) {
      this.confirmationDialog.destroy();
      this.confirmationDialog = undefined;
    }
  }
} 