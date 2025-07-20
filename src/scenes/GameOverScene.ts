import { 
  createResponsiveTitle, 
  createResponsiveSubtitle, 
  createCenteredResponsiveText, 
  calculateDynamicSpacing,
  TEXT_CONFIGS 
} from '@/utils/TextUtils';
import { createKidFriendlyButton, BUTTON_CONFIGS } from '@/utils/ButtonUtils';
import { BaseScene } from '@/scenes/BaseScene';

interface GameOverData {
  score: number;
  level: number;
  isVictory: boolean;
  castlesBuilt: number;
  perfectDrops: number;
}

export class GameOverScene extends BaseScene {
  private gameData?: GameOverData;
  private celebrationElements: Phaser.GameObjects.GameObject[] = [];
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  
  constructor() {
    super('GameOverScene');
    // Set background music based on victory/defeat (will be set dynamically in customCreate)
    this.setBackgroundMusic('achievement'); // Default to achievement music
  }

  // Implementation of BaseScene abstract methods
  protected async customPreload(): Promise<void> {
    // No custom preload logic needed - BaseScene handles audio and i18n
  }

  protected onLanguageChanged(): void {
    // Update any text that might need language updates
    // Most text in this scene uses static English for celebration messages
    // Could be enhanced later to translate celebration messages
  }

  init(data: GameOverData): void {
    this.gameData = data;
    
    // Set appropriate background music based on victory/defeat
    if (data?.isVictory) {
      this.setBackgroundMusic('achievement'); // Celebration music for victory
    } else {
      this.setBackgroundMusic('background-music'); // Calm music for game over
    }
  }

  protected customCreate(): void {
    this.createBackground();
    
    if (this.gameData?.isVictory) {
      this.createVictoryScreen();
    } else {
      this.createGameOverScreen();
    }
    
    this.createScoreDisplay();
    this.createActionButtons();
    this.createCelebrationEffects();
    // Mobile optimizations are handled by BaseScene
  }

  private createBackground(): void {
    // Create gradient background - different colors for victory vs game over
    this.backgroundGradient = this.add.graphics();
    
    if (this.gameData?.isVictory) {
      // Victory: warm golden gradient
      this.backgroundGradient.fillGradientStyle(
        0xFFD700, 0xFFA500, // Gold to orange
        0xFF6B35, 0xF7931E, // Orange to warm yellow
        1
      );
    } else {
      // Game Over: softer, encouraging gradient
      this.backgroundGradient.fillGradientStyle(
        0x74B9FF, 0x0984E3, // Light blue to darker blue
        0x6C5CE7, 0xA29BFE, // Purple gradient
        1
      );
    }
    
    this.backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);
  }

  private createVictoryScreen(): void {
    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 40);
    
    // Large victory title with celebration style and responsive sizing
    const victoryTitleConfig = {
      ...TEXT_CONFIGS.TITLE_LARGE,
      stroke: '#FFD700',
      strokeThickness: 6,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 3,
        fill: true
      }
    };
    
    const victoryTitle = createResponsiveTitle(
      this,
      this.scale.width / 2,
      this.scale.height * 0.12, // Moved up slightly
      'Level Complete!',
      victoryTitleConfig
    );
    victoryTitle.setOrigin(0.5);

    // Encouraging subtitle with responsive sizing
    const encouragementMessages = [
      'Amazing Castle!',
      'Super Builder!',
      'Fantastic!',
      'Brilliant!',
      'Well Done!'
    ];
    
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    
    const subtitleConfig = {
      ...TEXT_CONFIGS.SUBTITLE_LARGE,
      color: '#FFD700'
    };
    
    const subtitle = createResponsiveSubtitle(
      this,
      this.scale.width / 2,
      victoryTitle.y + victoryTitle.height / 2 + spacing, // Position relative to title
      randomMessage,
      subtitleConfig
    );
    subtitle.setOrigin(0.5);
  }

  private createGameOverScreen(): void {
    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 40);
    
    // Encouraging game over title (not harsh) with responsive sizing
    const gameOverTitleConfig = {
      ...TEXT_CONFIGS.TITLE_MEDIUM,
      stroke: '#74B9FF',
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 2,
        fill: true
      }
    };
    
    const gameOverTitle = createResponsiveTitle(
      this,
      this.scale.width / 2,
      this.scale.height * 0.12, // Moved up slightly
      'Game Over',
      gameOverTitleConfig
    );
    gameOverTitle.setOrigin(0.5);

    // Encouraging subtitle with responsive sizing
    const encouragingMessages = [
      'Keep Going!',
      "You're Getting Better!",
      'Try Again!',
      'Good Job!'
    ];
    
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    
    const subtitleConfig = {
      ...TEXT_CONFIGS.SUBTITLE_MEDIUM,
      color: '#74B9FF'
    };
    
    const subtitle = createResponsiveSubtitle(
      this,
      this.scale.width / 2,
      gameOverTitle.y + gameOverTitle.height / 2 + spacing, // Position relative to title
      randomMessage,
      subtitleConfig
    );
    subtitle.setOrigin(0.5);
  }

  private createScoreDisplay(): void {
    if (!this.gameData) return;

    // Calculate dynamic spacing based on screen size
    const spacing = calculateDynamicSpacing(this, 40);
    
    // Start score display after subtitle with proper spacing
    const scoreStartY = this.scale.height * 0.35; // Adjusted starting position

    // Main score display
    const scoreText = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      scoreStartY,
      'Score: {{score}}',
      TEXT_CONFIGS.STATS_LARGE,
      { score: this.gameData.score }
    );

    // Level reached
    const levelText = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      scoreText.y + scoreText.height / 2 + spacing,
      'Level {{level}}',
      TEXT_CONFIGS.STATS_SMALL,
      { level: this.gameData.level }
    );

    let currentY = levelText.y + levelText.height / 2 + spacing;

    // Additional stats for victory
    if (this.gameData.isVictory) {
      const castlesText = createCenteredResponsiveText(
        this,
        this.scale.width / 2,
        currentY,
        'Total Castles Built: {{count}}',
        TEXT_CONFIGS.STATS_SMALL,
        { count: this.gameData.castlesBuilt }
      );
      
      currentY = castlesText.y + castlesText.height / 2 + spacing;

      if (this.gameData.perfectDrops > 0) {
        const perfectConfig = {
          ...TEXT_CONFIGS.STATS_TINY,
          color: '#27AE60',
          fontStyle: 'bold'
        };
        
        createCenteredResponsiveText(
          this,
          this.scale.width / 2,
          currentY,
          'Perfect Drops: {{count}}',
          perfectConfig,
          { count: this.gameData.perfectDrops }
        );
      }
    }
  }

  private createActionButtons(): void {
    const buttonY = this.scale.height * 0.7;
    const buttonSpacing = calculateDynamicSpacing(this, 90);

    // Primary action button using BaseScene helper
    const primaryAction = this.gameData?.isVictory ? 'Next Level' : 'Try Again';
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY,
      primaryAction,
      BUTTON_CONFIGS.PRIMARY,
      () => this.handlePrimaryAction()
    );

    // Secondary action - Menu button using BaseScene helper
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY + buttonSpacing,
      'Main Menu',
      BUTTON_CONFIGS.SECONDARY,
      () => this.goToMenu() // Use BaseScene navigation helper
    );

    // If game over, add restart level option
    if (!this.gameData?.isVictory) {
      createKidFriendlyButton(
        this,
        this.scale.width / 2,
        buttonY - buttonSpacing,
        'Restart Level',
        BUTTON_CONFIGS.WARNING,
        () => this.restartLevel()
      );
    }
  }

  private createCelebrationEffects(): void {
    if (this.gameData?.isVictory) {
      this.createFireworks();
      this.createConfetti();
    } else {
      this.createEncouragingSparkles();
    }
  }

  private createFireworks(): void {
    // Create simple firework effect
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 1000, () => {
        const x = Phaser.Math.Between(100, this.scale.width - 100);
        const y = Phaser.Math.Between(100, this.scale.height / 2);
        
        // Firework explosion
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let j = 0; j < 8; j++) {
          const particle = this.add.circle(x, y, 4, color);
          
          const angle = (j / 8) * Math.PI * 2;
          const distance = Phaser.Math.Between(50, 100);
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      });
    }
  }

  private createConfetti(): void {
    // Falling confetti
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(Phaser.Math.Between(0, 3000), () => {
        const confetti = this.add.rectangle(
          Phaser.Math.Between(0, this.scale.width),
          -20,
          10, 6,
          Phaser.Math.Between(0x000000, 0xFFFFFF)
        );
        
        this.tweens.add({
          targets: confetti,
          y: this.scale.height + 20,
          rotation: Math.PI * 4,
          duration: Phaser.Math.Between(2000, 4000),
          ease: 'Linear',
          onComplete: () => confetti.destroy()
        });
        
        this.celebrationElements.push(confetti);
      });
    }
  }

  private createEncouragingSparkles(): void {
    // Gentle sparkles for encouragement
    for (let i = 0; i < 10; i++) {
      const sparkle = this.add.star(
        Phaser.Math.Between(50, this.scale.width - 50),
        Phaser.Math.Between(100, this.scale.height - 100),
        5, 4, 8,
        0x74B9FF,
        0.7
      );
      
      this.tweens.add({
        targets: sparkle,
        alpha: 0.3,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
      
      this.celebrationElements.push(sparkle);
    }
  }

  private handlePrimaryAction(): void {
    if (this.gameData?.isVictory) {
      // For victory (level 5+), go to next level
      this.transitionToScene('GameScene', {
        continueFromLevel: true,
        currentLevel: (this.gameData?.level || 5) + 1,
        totalScore: this.gameData?.score || 0
      });
    } else {
      // Try again (restart current level)
      this.restartLevel();
    }
  }

  private restartLevel(): void {
    this.transitionToScene('GameScene');
  }

  protected customShutdown(): void {
    // Clean up celebration elements
    this.celebrationElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.celebrationElements = [];
  }
} 