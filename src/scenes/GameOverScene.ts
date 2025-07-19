import { Scene } from 'phaser';
import { tSync } from '@/i18n';
import { supportsVibration } from '@/utils/DeviceUtils';

interface GameOverData {
  score: number;
  level: number;
  isVictory: boolean;
  castlesBuilt: number;
  perfectDrops: number;
}

export class GameOverScene extends Scene {
  private gameData?: GameOverData;
  private celebrationElements: Phaser.GameObjects.GameObject[] = [];
  private backgroundGradient?: Phaser.GameObjects.Graphics;
  
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.gameData = data;
  }

  create(): void {
    this.createBackground();
    
    if (this.gameData?.isVictory) {
      this.createVictoryScreen();
    } else {
      this.createGameOverScreen();
    }
    
    this.createScoreDisplay();
    this.createActionButtons();
    this.createCelebrationEffects();
    this.setupMobileOptimizations();
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
    // Large victory title with celebration style
    const victoryTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      tSync('Level Complete!'),
      {
        fontSize: '56px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        stroke: '#FFD700',
        strokeThickness: 6,
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: '#000000',
          blur: 3,
          fill: true
        },
        align: 'center'
      }
    );
    victoryTitle.setOrigin(0.5);

    // Victory bounce animation
    this.tweens.add({
      targets: victoryTitle,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Encouraging subtitle
    const encouragementMessages = [
      'Amazing Castle!',
      'Super Builder!',
      'Fantastic!',
      'Brilliant!',
      'Well Done!'
    ];
    
    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    
    const subtitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.25,
      tSync(randomMessage),
      {
        fontSize: '32px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold'
      }
    );
    subtitle.setOrigin(0.5);

    // Sparkle animation for subtitle
    this.tweens.add({
      targets: subtitle,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createGameOverScreen(): void {
    // Encouraging game over title (not harsh)
    const gameOverTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      tSync('Game Over'),
      {
        fontSize: '48px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFFFFF',
        stroke: '#74B9FF',
        strokeThickness: 4,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 2,
          fill: true
        },
        align: 'center'
      }
    );
    gameOverTitle.setOrigin(0.5);

    // Encouraging subtitle
    const encouragingMessages = [
      'Keep Going!',
      "You're Getting Better!",
      'Try Again!',
      'Good Job!'
    ];
    
    const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
    
    const subtitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.25,
      tSync(randomMessage),
      {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#74B9FF',
        fontStyle: 'bold'
      }
    );
    subtitle.setOrigin(0.5);
  }

  private createScoreDisplay(): void {
    const scoreY = this.scale.height * 0.4;
    const spacing = 40;
    
    if (!this.gameData) return;

    // Main score display
    const scoreText = this.add.text(
      this.scale.width / 2,
      scoreY,
      tSync('Score: {{score}}', { score: this.gameData.score }),
      {
        fontSize: '36px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 3,
        fontStyle: 'bold'
      }
    );
    scoreText.setOrigin(0.5);

    // Level reached
    const levelText = this.add.text(
      this.scale.width / 2,
      scoreY + spacing,
      tSync('Level {{level}}', { level: this.gameData.level }),
      {
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 2
      }
    );
    levelText.setOrigin(0.5);

    // Additional stats for victory
    if (this.gameData.isVictory) {
      const castlesText = this.add.text(
        this.scale.width / 2,
        scoreY + spacing * 2,
        tSync('Total Castles Built: {{count}}', { count: this.gameData.castlesBuilt }),
        {
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
          color: '#2C3E50',
          stroke: '#FFFFFF',
          strokeThickness: 1
        }
      );
      castlesText.setOrigin(0.5);

      if (this.gameData.perfectDrops > 0) {
        const perfectText = this.add.text(
          this.scale.width / 2,
          scoreY + spacing * 3,
          `Perfect Drops: ${this.gameData.perfectDrops}`,
          {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#27AE60',
            stroke: '#FFFFFF',
            strokeThickness: 1,
            fontStyle: 'bold'
          }
        );
        perfectText.setOrigin(0.5);
      }
    }

    // Check and display high score
    this.checkHighScore();
  }

  private createActionButtons(): void {
    const buttonY = this.scale.height * 0.7;
    const buttonSpacing = 100;

    // Primary action button
    const primaryAction = this.gameData?.isVictory ? 'Next Level' : 'Try Again';
    this.createKidFriendlyButton(
      this.scale.width / 2,
      buttonY,
      tSync(primaryAction),
      0x27AE60, // Green
      0x2ECC71,
      () => this.handlePrimaryAction()
    );

    // Secondary action - Menu button
    this.createKidFriendlyButton(
      this.scale.width / 2,
      buttonY + buttonSpacing,
      tSync('Main Menu'),
      0x3498DB, // Blue
      0x5DADE2,
      () => this.goToMenu(),
      0.8 // Slightly smaller
    );

    // If game over, add restart level option
    if (!this.gameData?.isVictory) {
      this.createKidFriendlyButton(
        this.scale.width / 2,
        buttonY - buttonSpacing,
        tSync('Restart Level'),
        0xE67E22, // Orange
        0xF39C12,
        () => this.restartLevel(),
        0.8
      );
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

    // Button background with rounded corners
    const buttonWidth = 280 * scale;
    const buttonHeight = 70 * scale;
    
    const background = this.add.graphics();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
    
    // White border for definition
    background.lineStyle(4, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

    // Button text
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

    // Interactive area with generous touch target
    container.setSize(buttonWidth + 20, buttonHeight + 20);
    container.setInteractive();

    // Button animations
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
      
      // Click animation
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

  private setupMobileOptimizations(): void {
    // Mobile haptic feedback
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

    // Handle orientation changes
    this.scale.on('orientationchange', () => {
      this.time.delayedCall(100, () => {
        this.refreshLayout();
      });
    });
  }

  private checkHighScore(): void {
    if (!this.gameData) return;

    try {
      const currentHighScore = parseInt(localStorage.getItem('sand-castle-high-score') || '0');
      
      if (this.gameData.score > currentHighScore) {
        localStorage.setItem('sand-castle-high-score', this.gameData.score.toString());
        
        // Show new high score celebration
        const newHighScoreText = this.add.text(
          this.scale.width / 2,
          this.scale.height * 0.75,
          'NEW HIGH SCORE!',
          {
            fontSize: '32px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFD700',
            stroke: '#FF6B6B',
            strokeThickness: 3,
            fontStyle: 'bold'
          }
        );
        newHighScoreText.setOrigin(0.5);
        
        // Pulsing animation for new high score
        this.tweens.add({
          targets: newHighScoreText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }

  private refreshLayout(): void {
    // Refresh layout for orientation changes
    // Similar to MenuScene implementation
    const newWidth = this.scale.width;
    const newHeight = this.scale.height;
    
    if (this.backgroundGradient) {
      this.backgroundGradient.clear();
      
      if (this.gameData?.isVictory) {
        this.backgroundGradient.fillGradientStyle(
          0xFFD700, 0xFFA500,
          0xFF6B35, 0xF7931E,
          1
        );
      } else {
        this.backgroundGradient.fillGradientStyle(
          0x74B9FF, 0x0984E3,
          0x6C5CE7, 0xA29BFE,
          1
        );
      }
      
      this.backgroundGradient.fillRect(0, 0, newWidth, newHeight);
    }
  }

  private handlePrimaryAction(): void {
    if (this.gameData?.isVictory) {
      // Go to next level
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    } else {
      // Try again (restart current level)
      this.restartLevel();
    }
  }

  private restartLevel(): void {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  private goToMenu(): void {
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