import { Scene } from 'phaser';
import { supportsVibration } from '@/utils/DeviceUtils';
import { 
  createResponsiveTitle, 
  createResponsiveSubtitle, 
  createCenteredResponsiveText, 
  calculateDynamicSpacing,
  TEXT_CONFIGS 
} from '@/utils/TextUtils';
import { createKidFriendlyButton, BUTTON_CONFIGS } from '@/utils/ButtonUtils';

interface LevelCompleteData {
  level: number;
  score: number;
  partsPlaced: number;
  perfectDrops: number;
  totalScore: number;
}

export class LevelCompleteScene extends Scene {
  private levelData?: LevelCompleteData;
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  private celebrationElements: Phaser.GameObjects.GameObject[] = [];
  
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  init(data: LevelCompleteData): void {
    this.levelData = data;
  }

  create(): void {
    this.createBackground();
    this.createLevelCompleteTitle();
    this.createStatsDisplay();
    this.createActionButtons();
    this.createCelebrationEffects();
    this.setupMobileOptimizations();
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

    // Continue to next level button (primary action)
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY,
      'Next Level',
      BUTTON_CONFIGS.PRIMARY,
      () => this.continueToNextLevel()
    );

    // Main menu button (secondary action)
    createKidFriendlyButton(
      this,
      this.scale.width / 2,
      buttonY + spacing,
      'Main Menu',
      BUTTON_CONFIGS.SECONDARY,
      () => this.goToMainMenu()
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

  private setupMobileOptimizations(): void {
    // Mobile haptic feedback
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const isTouchInput = (pointer as any).pointerType === 'touch' || (pointer.event as any)?.pointerType === 'touch';

      if (isTouchInput && supportsVibration()) {
        navigator.vibrate(30);
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

    // Handle orientation changes
    this.scale.on('orientationchange', () => {
      this.time.delayedCall(100, () => {
        this.refreshLayout();
      });
    });
  }

  private refreshLayout(): void {
    // Refresh layout for orientation changes
    const newWidth = this.scale.width;
    const newHeight = this.scale.height;
    
    if (this.backgroundGradient) {
      this.backgroundGradient.clear();
      this.backgroundGradient.fillGradientStyle(
        0x4ECDC4, 0x45B7D1,
        0x96CEB4, 0xFFEAA7,
        1
      );
      this.backgroundGradient.fillRect(0, 0, newWidth, newHeight);
    }
  }

  private continueToNextLevel(): void {
    // Fade out and continue to next level
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Pass the current game state to continue
      this.scene.start('GameScene', {
        continueFromLevel: true,
        currentLevel: (this.levelData?.level || 1) + 1,
        totalScore: this.levelData?.totalScore || 0
      });
    });
  }

  private goToMainMenu(): void {
    // Fade out and go to main menu
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  shutdown(): void {
    // Clean up celebration elements
    this.celebrationElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.celebrationElements = [];
  }
} 