import { Scene } from 'phaser';
import { CastlePart } from '@/objects/CastlePart';
import { GAME_CONFIG, LEVELS, COLORS, PartType } from '@/config/gameConfig';
import { GameState } from '@/types/Game';

export class GameScene extends Scene {
  private currentPart?: CastlePart;
  private droppedParts: CastlePart[] = [];
  private gameState: GameState;
  private partSpeed: number = GAME_CONFIG.partSpeed;
  private direction: number = 1; // 1 for right, -1 for left
  private levelText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;
  private currentLevelIndex: number = 0;
  
  constructor() {
    super({ key: 'GameScene' });
    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      droppedParts: [],
      isGameActive: true
    };
  }
  
  create(): void {
    this.createBackground();
    this.createUI();
    this.setupInput();
    this.setupPhysics();
    this.spawnNextPart();
  }
  
  private createBackground(): void {
    // Create simple gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(COLORS.SKY, COLORS.SKY, COLORS.SAND_LIGHT, COLORS.SAND_LIGHT);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    
    // Add simple ground line
    const ground = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 25,
      this.scale.width,
      50,
      COLORS.SAND
    );
    ground.setStrokeStyle(2, COLORS.SAND_DARK);
  }
  
  private createUI(): void {
    // Level indicator
    this.levelText = this.add.text(20, 20, `Level: ${this.gameState.currentLevel}`, {
      fontSize: '24px',
      color: '#2C3E50',
      fontFamily: 'Arial'
    });
    
    // Score display
    this.scoreText = this.add.text(20, 60, `Score: ${this.gameState.score}`, {
      fontSize: '20px',
      color: '#2C3E50',
      fontFamily: 'Arial'
    });
    
    // Instructions
    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 100,
      'Tap/Click to drop castle part',
      {
        fontSize: '18px',
        color: '#34495E',
        fontFamily: 'Arial'
      }
    );
    this.instructionText.setOrigin(0.5);
  }
  
  private setupInput(): void {
    // Handle both touch and mouse input
    this.input.on('pointerdown', this.dropCurrentPart, this);
    
    // Keyboard input for desktop testing
    this.input.keyboard?.on('keydown-SPACE', this.dropCurrentPart, this);
  }
  
  private setupPhysics(): void {
    // Enable Arcade Physics
    this.physics.world.gravity.y = 0; // We'll handle gravity per object
    
    // Create static ground for collision
    const ground = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 25,
      this.scale.width,
      50
    );
    this.physics.add.existing(ground, true); // true = static body
  }
  
  private spawnNextPart(): void {
    if (!this.gameState.isGameActive) return;
    
    const currentLevel = LEVELS[this.currentLevelIndex];
    if (!currentLevel) return;
    
    // Check if level is complete
    if (this.droppedParts.length >= currentLevel.targetParts) {
      this.completeLevel();
      return;
    }
    
    // Get next part type for this level
    const partTypeIndex = this.droppedParts.length % currentLevel.partTypes.length;
    const partType = currentLevel.partTypes[partTypeIndex] as PartType;
    
    // Create new part at top of screen
    const partWidth = this.getPartWidth(partType);
    const partHeight = this.getPartHeight(partType);
    
    this.currentPart = new CastlePart(
      this,
      this.scale.width / 2,
      50,
      partWidth,
      partHeight,
      partType
    );
    
    // Reset movement direction randomly
    this.direction = Math.random() > 0.5 ? 1 : -1;
  }
  
  private getPartWidth(partType: PartType): number {
    switch (partType) {
      case 'base': return 80;
      case 'wall': return 60;
      case 'tower': return 40;
      case 'decoration': return 30;
      default: return 60;
    }
  }
  
  private getPartHeight(partType: PartType): number {
    switch (partType) {
      case 'base': return 40;
      case 'wall': return 60;
      case 'tower': return 80;
      case 'decoration': return 25;
      default: return 50;
    }
  }
  
  private dropCurrentPart(): void {
    if (!this.currentPart || !this.gameState.isGameActive) return;
    
    // Drop the current part
    this.currentPart.drop(GAME_CONFIG.gravity);
    this.droppedParts.push(this.currentPart);
    
    // Add collision detection with other parts and ground
    this.setupPartCollisions(this.currentPart);
    
    // Spawn next part after a short delay
    this.time.delayedCall(1000, () => {
      this.spawnNextPart();
    });
    
    this.currentPart = undefined;
    
    // Update score
    this.gameState.score += 10;
    this.updateUI();
  }
  
  private setupPartCollisions(part: CastlePart): void {
    // Collision with ground
    const ground = this.physics.world.staticBodies.entries[0];
    if (ground) {
      this.physics.add.collider(part, ground);
    }
    
    // Collision with other dropped parts
    this.droppedParts.forEach(otherPart => {
      if (otherPart !== part) {
        this.physics.add.collider(part, otherPart);
      }
    });
  }
  
  private completeLevel(): void {
    this.gameState.score += 100; // Bonus for completing level
    this.currentLevelIndex++;
    
    if (this.currentLevelIndex >= LEVELS.length) {
      // Game complete!
      this.gameWon();
    } else {
      // Next level
      this.gameState.currentLevel++;
      this.nextLevel();
    }
  }
  
  private nextLevel(): void {
    // Clear dropped parts
    this.droppedParts.forEach(part => part.destroy());
    this.droppedParts = [];
    
    // Increase part speed slightly
    this.partSpeed += 10;
    
    // Show level complete message
    const levelCompleteText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      `Level ${this.gameState.currentLevel - 1} Complete!\nGet ready for Level ${this.gameState.currentLevel}`,
      {
        fontSize: '24px',
        color: '#27AE60',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    levelCompleteText.setOrigin(0.5);
    
    // Continue to next level after delay
    this.time.delayedCall(2000, () => {
      levelCompleteText.destroy();
      this.spawnNextPart();
    });
    
    this.updateUI();
  }
  
  private gameWon(): void {
    this.gameState.isGameActive = false;
    
    const winText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      `Congratulations!\nYou built all the castles!\nFinal Score: ${this.gameState.score}`,
      {
        fontSize: '28px',
        color: '#27AE60',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    winText.setOrigin(0.5);
  }
  
  private updateUI(): void {
    if (this.levelText) {
      this.levelText.setText(`Level: ${this.gameState.currentLevel}`);
    }
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.gameState.score}`);
    }
  }
  
  update(_time: number, delta: number): void {
    // Move current part horizontally
    if (this.currentPart && this.gameState.isGameActive) {
      this.currentPart.moveHorizontally(this.direction * this.partSpeed, delta / 1000);
      
      // Reverse direction at screen edges
      if (this.currentPart.x <= this.currentPart.width / 2 || 
          this.currentPart.x >= this.scale.width - this.currentPart.width / 2) {
        this.direction *= -1;
      }
    }
    
    // Check stability of dropped parts
    this.droppedParts.forEach(part => {
      part.checkStability();
    });
  }
} 