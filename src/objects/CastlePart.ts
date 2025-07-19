import { Scene } from 'phaser';
import { CastlePartData } from '@/types/Game';
import { COLORS, PartType } from '@/config/gameConfig';
import { StabilityManager } from '@/objects/StabilityManager';
import { AudioManager } from '@/utils/AudioManager';

export class CastlePart extends Phaser.GameObjects.Rectangle {
  private partData: CastlePartData;
  private partType: PartType;
  private isDropped: boolean = false;
  private shadow?: Phaser.GameObjects.Rectangle;
  private stabilityManager: StabilityManager;
  private audioManager: AudioManager;
  private stabilityGlow?: Phaser.GameObjects.Arc;
  private lastStabilityLevel: 'stable' | 'warning' | 'unstable' = 'stable';
  private matterBody?: MatterJS.BodyType;
  
  constructor(scene: Scene, x: number, y: number, width: number, height: number, partType: PartType) {
    super(scene, x, y, width, height, COLORS.SAND);
    
    this.partType = partType;
    this.stabilityManager = new StabilityManager();
    this.audioManager = AudioManager.getInstance();
    
    this.partData = {
      id: `part_${Date.now()}_${Math.random()}`,
      x,
      y,
      width,
      height,
      velocity: { x: 0, y: 0 },
      isStable: true
    };
    
    // Set visual properties based on part type
    this.setPartAppearance();
    
    // Create shadow for visual feedback
    this.createShadow();
    
    // Create stability glow (initially hidden)
    this.createStabilityGlow();
    
    // Add to scene
    scene.add.existing(this);
  }
  
  private setPartAppearance(): void {
    switch (this.partType) {
      case 'base':
        this.setFillStyle(COLORS.SAND);
        this.setStrokeStyle(2, COLORS.SAND_DARK);
        break;
      case 'wall':
        this.setFillStyle(COLORS.SAND_DARK);
        this.setStrokeStyle(2, COLORS.SAND);
        break;
      case 'tower':
        this.setFillStyle(COLORS.SAND_LIGHT);
        this.setStrokeStyle(2, COLORS.SAND_DARK);
        break;
      case 'decoration':
        this.setFillStyle(COLORS.RED);
        this.setStrokeStyle(2, COLORS.WHITE);
        break;
    }
  }
  
  private createShadow(): void {
    if (this.scene && !this.isDropped) {
      this.shadow = this.scene.add.rectangle(
        this.x,
        this.scene.scale.height - 50, // Near bottom of screen
        this.width,
        10,
        0x000000,
        0.3
      );
    }
  }
  
  private createStabilityGlow(): void {
    if (this.scene) {
      this.stabilityGlow = this.scene.add.circle(
        this.x,
        this.y,
        Math.max(this.width, this.height) / 2 + 5,
        COLORS.GREEN,
        0.3
      );
      this.stabilityGlow.setVisible(false);
    }
  }
  
  public moveHorizontally(speed: number, deltaTime: number): void {
    if (!this.isDropped) {
      this.x += speed * deltaTime;
      
      // Bounce off screen edges
      if (this.x <= this.width / 2 || this.x >= this.scene.scale.width - this.width / 2) {
        speed *= -1;
        return;
      }
      
      // Update shadow position
      if (this.shadow) {
        this.shadow.x = this.x;
      }
    }
  }
  
  public drop(_gravity: number): void {
    if (!this.isDropped) {
      this.isDropped = true;
      
      // Play drop sound
      this.audioManager.playDropSound();
      
      // Remove shadow when part is dropped
      if (this.shadow) {
        this.shadow.destroy();
        this.shadow = undefined;
      }
      
      // Enable Matter.js physics with sand-like properties
      this.scene.matter.add.gameObject(this, {
        shape: 'rectangle',
        density: 0.8,      // Sand density
        friction: 0.3,     // Sand friction
        frictionStatic: 0.8, // High static friction
        restitution: 0.1,  // Low bounce for sand
        chamfer: { radius: 2 }, // Slightly rounded edges
      });
      
      // Store Matter.js body reference
      this.matterBody = this.body as MatterJS.BodyType;
      
      // Set collision category and mask
      if (this.matterBody) {
        this.scene.matter.world.add(this.matterBody);
      }
    }
  }
  
  public checkStability(): boolean {
    if (!this.isDropped || !this.matterBody) return true;
    
    // Get current velocity from Matter.js body
    const velocity = this.matterBody.velocity;
    this.partData.velocity = { x: velocity.x, y: velocity.y };
    
    // Update position
    this.partData.x = this.x;
    this.partData.y = this.y;
    
    // Check stability using StabilityManager
    const stabilityLevel = this.stabilityManager.getStabilityLevel(this.partData);
    
    // Update visual feedback if stability changed
    if (stabilityLevel !== this.lastStabilityLevel) {
      this.updateStabilityVisual(stabilityLevel);
      
      // Play appropriate sound for placement
      if (this.lastStabilityLevel === 'unstable' && stabilityLevel !== 'unstable') {
        this.audioManager.playPlacementSound(stabilityLevel);
      }
      
      this.lastStabilityLevel = stabilityLevel;
    }
    
    this.partData.isStable = stabilityLevel === 'stable';
    return this.partData.isStable;
  }
  
  private updateStabilityVisual(stabilityLevel: 'stable' | 'warning' | 'unstable'): void {
    if (!this.stabilityGlow) return;
    
    // Update glow position to follow part
    this.stabilityGlow.x = this.x;
    this.stabilityGlow.y = this.y;
    
    switch (stabilityLevel) {
      case 'stable':
        this.stabilityGlow.setFillStyle(COLORS.GREEN, 0.3);
        this.stabilityGlow.setVisible(true);
        // Fade out after 1 second
        this.scene.time.delayedCall(1000, () => {
          if (this.stabilityGlow) this.stabilityGlow.setVisible(false);
        });
        break;
        
      case 'warning':
        this.stabilityGlow.setFillStyle(COLORS.YELLOW, 0.4);
        this.stabilityGlow.setVisible(true);
        break;
        
      case 'unstable':
        this.stabilityGlow.setFillStyle(COLORS.RED, 0.5);
        this.stabilityGlow.setVisible(true);
        // Add wobble effect
        this.scene.tweens.add({
          targets: this,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100,
          yoyo: true,
          repeat: -1
        });
        break;
    }
  }
  
  public getPartData(): CastlePartData {
    return {
      ...this.partData,
      x: this.x,
      y: this.y,
      velocity: this.matterBody ? {
        x: this.matterBody.velocity.x,
        y: this.matterBody.velocity.y
      } : { x: 0, y: 0 }
    };
  }
  
  public getPartType(): PartType {
    return this.partType;
  }
  
  public isPartDropped(): boolean {
    return this.isDropped;
  }
  
  public getStabilityPoints(): number {
    return this.stabilityManager.calculateStabilityPoints(this.partData);
  }
  
  public destroy(): void {
    // Clean up visual effects
    if (this.shadow) {
      this.shadow.destroy();
    }
    if (this.stabilityGlow) {
      this.stabilityGlow.destroy();
    }
    
    // Stop any running tweens
    this.scene.tweens.killTweensOf(this);
    
    super.destroy();
  }
} 