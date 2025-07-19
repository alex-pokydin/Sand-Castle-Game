import { Scene } from 'phaser';
import { CastlePartData } from '@/types/Game';
import { COLORS, PartType } from '@/config/gameConfig';

export class CastlePart extends Phaser.GameObjects.Rectangle {
  private partData: CastlePartData;
  private partType: PartType;
  private isDropped: boolean = false;
  private shadow?: Phaser.GameObjects.Rectangle;
  
  constructor(scene: Scene, x: number, y: number, width: number, height: number, partType: PartType) {
    super(scene, x, y, width, height, COLORS.SAND);
    
    this.partType = partType;
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
  
  public drop(gravity: number): void {
    if (!this.isDropped) {
      this.isDropped = true;
      
      // Remove shadow when part is dropped
      if (this.shadow) {
        this.shadow.destroy();
        this.shadow = undefined;
      }
      
      // Enable physics
      this.scene.physics.world.enable(this);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setGravityY(gravity);
      body.setBounce(0.1); // Slight bounce for sand-like feel
      body.setCollideWorldBounds(true);
    }
  }
  
  public checkStability(): boolean {
    if (!this.isDropped) return true;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return true;
    
    // Simple stability check based on velocity
    const velocity = Math.abs(body.velocity.x) + Math.abs(body.velocity.y);
    this.partData.isStable = velocity < 10;
    
    // Update visual feedback
    this.updateStabilityVisual();
    
    return this.partData.isStable;
  }
  
  private updateStabilityVisual(): void {
    // TODO: Add visual stability feedback (color changes) in next phase
    // For foundation phase, keeping it simple
  }
  
  public getPartData(): CastlePartData {
    return {
      ...this.partData,
      x: this.x,
      y: this.y,
      velocity: this.body ? {
        x: (this.body as Phaser.Physics.Arcade.Body).velocity.x,
        y: (this.body as Phaser.Physics.Arcade.Body).velocity.y
      } : { x: 0, y: 0 }
    };
  }
  
  public getPartType(): PartType {
    return this.partType;
  }
  
  public isPartDropped(): boolean {
    return this.isDropped;
  }
} 