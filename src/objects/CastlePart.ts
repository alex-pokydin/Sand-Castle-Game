import { Scene } from 'phaser';
import { CastlePartData } from '@/types/Game';
import { COLORS, PartType, PHYSICS_CONFIG } from '@/config/gameConfig';
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
      
      // Enable Matter.js physics with improved sand-like properties
      this.scene.matter.add.gameObject(this, {
        shape: 'rectangle',
        density: PHYSICS_CONFIG.sand.density,
        friction: PHYSICS_CONFIG.sand.friction,
        frictionStatic: PHYSICS_CONFIG.sand.frictionStatic,
        restitution: PHYSICS_CONFIG.sand.restitution,
        frictionAir: PHYSICS_CONFIG.sand.frictionAir,
        chamfer: { radius: 2 }, // Slightly rounded edges
        // Remove problematic inertia settings - let Matter.js handle this naturally
        // inertia: Infinity, // Remove this
        // inverseInertia: 0, // Remove this
        plugin: {
          attractors: []
        }
      });
      
      // Store Matter.js body reference
      this.matterBody = this.body as MatterJS.BodyType;
      
      // Set collision category and mask for proper collision detection
      if (this.matterBody) {
        // Set collision filtering
        this.matterBody.collisionFilter = {
          category: 0x0001,
          mask: 0x0001,
          group: 0
        };
        
        // Apply initial downward velocity (controlled drop) - reduced to prevent conflicts
        this.scene.matter.body.setVelocity(this.matterBody, { x: 0, y: 1 });
        
        // Don't add to world again - this.scene.matter.add.gameObject() already did this
        // this.scene.matter.world.add(this.matterBody); // Remove this line
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
      
      // Enhanced audio feedback for placement
      this.handleStabilityAudio(this.lastStabilityLevel, stabilityLevel);
      
      this.lastStabilityLevel = stabilityLevel;
    }
    
    this.partData.isStable = stabilityLevel === 'stable';
    return this.partData.isStable;
  }
  
  private handleStabilityAudio(previousLevel: 'stable' | 'warning' | 'unstable', currentLevel: 'stable' | 'warning' | 'unstable'): void {
    // Play appropriate sounds based on stability transitions
    
    if (currentLevel === 'stable' && previousLevel !== 'stable') {
      // Successful stabilization
      this.audioManager.playPlacementSound('stable');
    } else if (currentLevel === 'warning' && previousLevel === 'unstable') {
      // Improving from unstable to warning
      this.audioManager.playPlacementSound('warning');
    } else if (currentLevel === 'unstable' && previousLevel !== 'unstable') {
      // Becoming unstable - warning sound
      this.audioManager.playPlacementSound('unstable');
    }
    
    // Special case: if transitioning from unstable to stable (rare but possible)
    if (previousLevel === 'unstable' && currentLevel === 'stable') {
      // Play extra success sound for recovery
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(300, () => {
          this.audioManager.playPlacementSound('stable');
        });
      }
    }
  }
  
  private updateStabilityVisual(stabilityLevel: 'stable' | 'warning' | 'unstable'): void {
    if (!this.stabilityGlow || !this.scene) return;
    
    // Update glow position to follow part
    this.stabilityGlow.x = this.x;
    this.stabilityGlow.y = this.y;
    
    // Stop any existing tweens
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
      this.scene.tweens.killTweensOf(this.stabilityGlow);
    }
    
    switch (stabilityLevel) {
      case 'stable':
        // Clear success indication
        this.stabilityGlow.setFillStyle(COLORS.GREEN, 0.6);
        this.stabilityGlow.setRadius(Math.max(this.width, this.height) / 2 + 10);
        this.stabilityGlow.setVisible(true);
        
        // Success pulse animation
        if (this.scene && this.scene.tweens) {
          this.scene.tweens.add({
            targets: this.stabilityGlow,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0.8,
            duration: 300,
            ease: 'Back.easeOut',
            yoyo: true,
            onComplete: () => {
              // Keep visible for 2 seconds, then fade out
              if (this.scene && this.scene.time) {
                this.scene.time.delayedCall(2000, () => {
                  if (this.stabilityGlow && this.scene && this.scene.tweens) {
                    this.scene.tweens.add({
                      targets: this.stabilityGlow,
                      alpha: 0,
                      duration: 500,
                      onComplete: () => {
                        if (this.stabilityGlow) this.stabilityGlow.setVisible(false);
                      }
                    });
                  }
                });
              }
            }
          });
        }
        
        // Add success particle effect
        this.createSuccessParticles();
        break;
        
      case 'warning':
        // Warning indication - yellow pulsing
        this.stabilityGlow.setFillStyle(COLORS.YELLOW, 0.5);
        this.stabilityGlow.setRadius(Math.max(this.width, this.height) / 2 + 8);
        this.stabilityGlow.setVisible(true);
        
        // Warning pulse
        if (this.scene && this.scene.tweens) {
          this.scene.tweens.add({
            targets: this.stabilityGlow,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 0.3,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
          });
          
          // Slight shake on the part
          this.scene.tweens.add({
            targets: this,
            x: this.x - 1,
            duration: 50,
            yoyo: true,
            repeat: 3
          });
        }
        break;
        
      case 'unstable':
        // Danger indication - red flashing
        this.stabilityGlow.setFillStyle(COLORS.RED, 0.7);
        this.stabilityGlow.setRadius(Math.max(this.width, this.height) / 2 + 12);
        this.stabilityGlow.setVisible(true);
        
        // Urgent flashing
        if (this.scene && this.scene.tweens) {
          this.scene.tweens.add({
            targets: this.stabilityGlow,
            alpha: 0.2,
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
          });
          
          // Strong wobble effect
          this.scene.tweens.add({
            targets: this,
            scaleX: 1.05,
            scaleY: 1.05,
            rotation: 0.02,
            duration: 150,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
          });
        }
        
        // Add unstable particle effect
        this.createUnstableParticles();
        break;
    }
  }
  
  private createSuccessParticles(): void {
    if (!this.scene) return;
    
    // Create simple success particles (green sparkles)
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * this.width,
        this.y + (Math.random() - 0.5) * this.height,
        2,
        COLORS.GREEN
      );
      
      if (this.scene.tweens) {
        this.scene.tweens.add({
          targets: particle,
          x: particle.x + (Math.random() - 0.5) * 60,
          y: particle.y - Math.random() * 40 - 20,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 800,
          ease: 'Power2.easeOut',
          onComplete: () => particle.destroy()
        });
      }
    }
  }
  
  private createUnstableParticles(): void {
    if (!this.scene) return;
    
    // Create warning particles (red dust)
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * this.width,
        this.y + this.height / 2,
        1,
        COLORS.RED
      );
      
      if (this.scene.tweens) {
        this.scene.tweens.add({
          targets: particle,
          x: particle.x + (Math.random() - 0.5) * 30,
          y: particle.y + Math.random() * 20 + 10,
          alpha: 0,
          duration: 600,
          ease: 'Power1.easeOut',
          onComplete: () => particle.destroy()
        });
      }
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
    
    // Stop any running tweens (with null check)
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
      if (this.stabilityGlow) {
        this.scene.tweens.killTweensOf(this.stabilityGlow);
      }
    }
    
    super.destroy();
  }
} 