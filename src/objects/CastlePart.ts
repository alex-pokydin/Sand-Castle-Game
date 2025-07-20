import { Scene } from 'phaser';
import { CastlePartData, PartLevel, PlacementResult } from '@/types/Game';
import { COLORS, PHYSICS_CONFIG, getPartColor, PLACEMENT_CONFIG, SCORING_CONFIG } from '@/config/gameConfig';
import { StabilityManager } from '@/objects/StabilityManager';
import { AudioManager } from '@/utils/AudioManager';
import { VisualEffects } from '@/utils/VisualEffects';
import { IPartRenderer, createPartRenderer } from '@/objects/PartRenderers';

/**
 * CastlePart - Realistic sand castle building blocks
 * 
 * Features authentic sand castle textures with beach aesthetics:
 * - Level 1: Trapezoid sand foundation blocks with white outline and compression marks
 * - Level 2: Trapezoid hand-sculpted walls with white outline and tool marks
 * - Level 3: Trapezoid detailed structures with white outline and carved windows
 * - Level 4: Sand castle towers with finger battlements and arrow slits
 * - Level 5: Trapezoidal sand castle roof with flat top for flag placement
 * - Level 6: Victory flag with driftwood pole and royal banner (flag-only design)
 * 
 * Enhanced visual features:
 * - Pure custom graphics rendering (no underlying rectangle visible)
 * - Solid color fills with proper contrast between background and details
 * - Consistent white outlines on all parts for clear definition and contrast
 * - Trapezoid shapes (1-3, 5) for realistic sand castle stability and flag platform
 * - Natural randomness and size variations for authentic hand-built sand castle appearance
 * - Organic sand textures with grain details, roof tiles, and drip effects on top of fills
 * - Consistent seeded randomness ensures parts look the same across game sessions
 * - Flag-only pinnacle design for triumphant castle completion
 * - Full rotation support with attached architectural details
 */

// Enhanced placement result with scoring information
export interface EnhancedPlacementResult extends PlacementResult {
  scoreData: {
    placementBonus: number;
    levelBonus: number;
    totalBonus: number;
    feedbackMessage: string;
  };
  isLevelSix: boolean;
  shouldTriggerCastleClear: boolean;
}

// Ground collision result
export interface GroundCollisionResult {
  isTouchingGround: boolean;
  shouldApplyPenalty: boolean;
  penaltyAmount: number;
  penaltyMessage: string;
}

// Movement state for autonomous part movement
export interface PartMovementState {
  speed: number;
  direction: number; // 1 or -1
  boundaryLeft: number;
  boundaryRight: number;
}

export class CastlePart extends Phaser.GameObjects.Rectangle {
  private partData: CastlePartData;
  private partLevel: PartLevel;
  private isDropped: boolean = false;
  private shadow?: Phaser.GameObjects.Rectangle;
  private stabilityManager: StabilityManager;
  private audioManager: AudioManager;
  private visualEffects: VisualEffects;
  private stabilityGlow?: Phaser.GameObjects.Arc;
  private lastStabilityLevel: 'stable' | 'warning' | 'unstable' = 'stable';
  private matterBody?: MatterJS.BodyType;
  private levelDisplay?: Phaser.GameObjects.Text;
  private customGraphics?: Phaser.GameObjects.Graphics; // Custom graphics overlay
  private partRenderer: IPartRenderer; // Modular sand-texture renderer
  
  // Autonomous movement state
  private movementState?: PartMovementState;
  
  constructor(scene: Scene, x: number, y: number, width: number, height: number, partLevel: PartLevel) {
    // Create Rectangle with base color (will be made transparent)
    const partColor = getPartColor(partLevel);
    super(scene, x, y, width, height, partColor);
    
    // Make the base rectangle transparent - we only want our custom graphics to show
    this.setFillStyle(0x000000, 0); // Transparent fill
    
    this.partLevel = partLevel;
    this.stabilityManager = new StabilityManager();
    this.audioManager = AudioManager.getInstance();
    this.visualEffects = new VisualEffects(scene);
    this.partRenderer = createPartRenderer(partLevel);
    
    this.partData = {
      id: `part_${Date.now()}_${Math.random()}`,
      x,
      y,
      width,
      height,
      level: partLevel,
      velocity: { x: 0, y: 0 },
      isStable: true,
      placedOnValidTarget: false
    };
    
    // Set visual properties
    this.setPartAppearance();
    
    // Create custom graphics overlay for textures
    this.createCustomGraphics();
    
    // Create level display (always visible)
    this.createLevelDisplay();
    
    // Create shadow for visual feedback
    this.createShadow();
    
    // Create stability glow (initially hidden)
    this.createStabilityGlow();
    
    // Add to scene
    scene.add.existing(this);
  }
  
  private setPartAppearance(): void {
    // Remove any stroke from base rectangle - custom graphics handle all visuals
    this.setStrokeStyle(0, 0x000000, 0);
  }
  
  /**
   * Create custom graphics overlay for castle part textures
   * Graphics will follow the part's rotation and transformations
   */
  private createCustomGraphics(): void {
    if (!this.scene) return;
    
    // Create graphics that will manually sync with the rectangle's transformations
    this.customGraphics = this.scene.add.graphics();
    
    // Position graphics at the rectangle's position
    this.customGraphics.setPosition(this.x, this.y);
    this.customGraphics.setRotation(this.rotation);
    this.customGraphics.setScale(this.scaleX, this.scaleY);
    
    // Set depth to be above the rectangle
    this.customGraphics.setDepth(this.depth + 1);
    
    // Use modular renderer system for sand-like textures
    this.renderSandTextures();
  }

  /**
   * Render sand-like textures using the modular renderer system
   */
  private renderSandTextures(): void {
    if (!this.customGraphics) return;
    
    // Clear previous graphics
    this.customGraphics.clear();
    
    // Calculate offsets for center-relative drawing
    const offsetX = -this.width / 2;
    const offsetY = -this.height / 2;
    
    // Use the appropriate renderer for this part level
    this.partRenderer.render(this.customGraphics, this.width, this.height, offsetX, offsetY);
  }

  private createStabilityGlow(): void {
    // Stability glow circles removed - replaced with modern visual effects
    // Legacy red/green circles that were confusing to players
    this.stabilityGlow = undefined;
  }
  
  private createLevelDisplay(): void {
    if (!this.scene) return;
    
    // Create elegant level display that complements the enhanced visuals
    this.levelDisplay = this.scene.add.text(
      this.x,
      this.y,
      this.partLevel.toString(),
      {
        fontSize: '20px',
        color: '#FFFFFF',
        fontFamily: 'Arial Black, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 3,
          fill: true
        }
      }
    );
    this.levelDisplay.setOrigin(0.5, 0.5);
    this.levelDisplay.setDepth(2000); // Ensure it's always on top of enhanced graphics
    
    // Add subtle glow effect for better visibility against complex textures
    this.levelDisplay.setTint(0xFFFFFF);
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
  
  /**
   * Update graphics and level display to follow part's transformations
   * Syncs position, rotation, and scale for all visual elements
   */
  private updatePositions(): void {
    if (!this.scene || !this.active) return;

    // Sync custom graphics with rectangle's full transformation
    if (this.customGraphics) {
      this.customGraphics.setPosition(this.x, this.y);
      this.customGraphics.setRotation(this.rotation);
      this.customGraphics.setScale(this.scaleX, this.scaleY);
    }
    
    // Sync level display with rectangle's transformations
    if (this.levelDisplay) {
      this.levelDisplay.setPosition(this.x, this.y);
      this.levelDisplay.setRotation(this.rotation);
      this.levelDisplay.setScale(this.scaleX, this.scaleY);
    }
    
    // Update shadow position (shadow stays at bottom but follows x position, no rotation)
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.shadow.y);
    }
  }
  
  public moveHorizontally(speed: number, deltaTime: number): void {
    if (!this.isDropped && this.scene && this.active) {
      this.x += speed * deltaTime;
      
      // Bounce off screen edges
      if (this.x <= this.width / 2 || this.x >= this.scene.scale.width - this.width / 2) {
        speed *= -1;
        return;
      }
      
      // Update positions of graphics and text
      this.updatePositions();
      
      // Update shadow position
      if (this.shadow) {
        this.shadow.x = this.x;
      }
    }
  }
  
  public drop(_gravity: number): void {
    if (!this.isDropped) {
      // Safety check: ensure scene and matter physics are available
      if (!this.scene || !this.scene.matter) {
        console.warn('CastlePart.drop(): Scene or matter physics not available, skipping drop');
        return;
      }
      
      this.isDropped = true;
      
      // Play drop sound
      this.audioManager.playSound('drop');
      
      // Remove shadow when part is dropped
      if (this.shadow) {
        this.shadow.destroy();
        this.shadow = undefined;
      }
      
      // Enable Matter.js physics with enhanced sand-like properties
      this.scene.matter.add.gameObject(this, {
        shape: 'rectangle',
        density: PHYSICS_CONFIG.sand.density,
        friction: PHYSICS_CONFIG.sand.friction,
        frictionStatic: PHYSICS_CONFIG.sand.frictionStatic,
        restitution: PHYSICS_CONFIG.sand.restitution,
        frictionAir: PHYSICS_CONFIG.sand.frictionAir,
        chamfer: { radius: 2 } // Slightly rounded edges for better contact
      });
      
      // Store Matter.js body reference
      this.matterBody = this.body as MatterJS.BodyType;
      
      if (this.matterBody && this.scene && this.scene.matter) {
        // Enhanced sand-like physics properties
        this.scene.matter.body.set(this.matterBody, 'angularDamping', PHYSICS_CONFIG.sand.angularDamping);
        this.scene.matter.body.set(this.matterBody, 'sleepThreshold', PHYSICS_CONFIG.sand.sleepThreshold);
        
        // Set collision category and mask for proper collision detection
        this.matterBody.collisionFilter = {
          category: 0x0001,
          mask: 0x0001,
          group: 0
        };
        
        // Apply gentle initial downward velocity to start the fall
        this.scene.matter.body.setVelocity(this.matterBody, { x: 0, y: 0.5 });
        
        // Add event listener for contact with other parts to enhance sticking behavior
        this.scene.matter.world.on('collisionstart', this.handleSandContact.bind(this));
      }
    }
  }
  
  public checkStability(): boolean {
    if (!this.isDropped || !this.matterBody || !this.scene) return true;
    
    // Get current velocity from Matter.js body
    const velocity = this.matterBody.velocity;
    this.partData.velocity = { x: velocity.x, y: velocity.y };
    
    // Update position data and graphics
    this.partData.x = this.x;
    this.partData.y = this.y;
    this.updatePositions();
    
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
      this.audioManager.playSound('place-perfect');
    } else if (currentLevel === 'warning' && previousLevel === 'unstable') {
      // Improving from unstable to warning
      this.audioManager.playSound('place-good');
    } else if (currentLevel === 'unstable' && previousLevel !== 'unstable') {
      // Becoming unstable - warning sound
      // Note: Wobble sound disabled - enhanced visual feedback is sufficient
      //this.audioManager.playSound('wobble');
    }
    
    // Special case: if transitioning from unstable to stable (rare but possible)
    if (previousLevel === 'unstable' && currentLevel === 'stable') {
      // Play extra success sound for recovery
      if (this.scene && this.scene.time) {
        this.scene.time.delayedCall(300, () => {
          this.audioManager.playSound('place-perfect');
        });
      }
    }
  }
  
  private updateStabilityVisual(stabilityLevel: 'stable' | 'warning' | 'unstable'): void {
    // Legacy glow circles removed - use modern particle effects instead
    if (!this.scene) return;
    
    // Stop any existing tweens on the part
    if (this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
    }
    
    switch (stabilityLevel) {
      case 'stable':
        // Subtle success particle effect only
        this.createSuccessParticles();
        break;
        
      case 'warning':
        // Slight shake on the part only
        if (this.scene.tweens) {
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
        // Strong wobble effect and particles
        if (this.scene.tweens) {
          this.scene.tweens.add({
            targets: this,
            scaleX: 1.05,
            scaleY: 1.05,
            rotation: 0.02,
            duration: 150,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 3 // Limited repeats instead of infinite
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
  
  /**
   * Enhanced contact handling for sand-like behavior
   */
  private handleSandContact(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    if (!this.matterBody) return;
    
    const pairs = event.pairs;
    
    for (const pair of pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check if this part is involved in the collision
      if (bodyA === this.matterBody || bodyB === this.matterBody) {
        const otherBody = bodyA === this.matterBody ? bodyB : bodyA;
        const otherPart = otherBody.gameObject as CastlePart;
        
        // If colliding with another sand part, enhance friction
        if (otherPart instanceof CastlePart) {
          this.enhanceSandToSandContact(otherBody);
        }
      }
    }
  }
  
  /**
   * Enhance friction between sand parts to prevent sliding
   */
  private enhanceSandToSandContact(otherBody: MatterJS.BodyType): void {
    if (!this.matterBody || !this.scene || !this.scene.matter) return;
    
    // Check if bodies are in contact
    const bodyA = this.matterBody;
    const bodyB = otherBody;
    
    // Apply friction damping to reduce sliding
    const currentVel = bodyA.velocity;
    const otherVel = bodyB.velocity;
    
    // Apply friction damping to reduce sliding
    const dampingFactor = 0.8;
    this.scene.matter.body.setVelocity(bodyA, {
      x: currentVel.x * dampingFactor,
      y: currentVel.y
    });
    
    // Reduce angular velocity to prevent spinning
    this.scene.matter.body.setAngularVelocity(bodyA, bodyA.angularVelocity * 0.5);
    
    // If both parts are moving slowly, apply additional stabilization
    const combinedSpeed = Math.abs(currentVel.x) + Math.abs(currentVel.y) + 
                         Math.abs(otherVel.x) + Math.abs(otherVel.y);
    
    if (combinedSpeed < 1.0) {
      // Both parts are nearly stationary - enhance static friction
      this.scene.matter.body.setVelocity(bodyA, {
        x: currentVel.x * 0.2,
        y: currentVel.y
      });
      
      // Apply strong damping for very slow parts to simulate sticking
      if (combinedSpeed < 0.1) {
        // Apply very strong velocity damping to nearly stop the part
        this.scene.matter.body.setVelocity(bodyA, {
          x: currentVel.x * 0.05,
          y: currentVel.y * 0.05
        });
        // Also dampen angular velocity heavily
        this.scene.matter.body.setAngularVelocity(bodyA, bodyA.angularVelocity * 0.05);
      }
    }
  }
  
  public getPartData(): CastlePartData {
    // If the GameObject has already been destroyed its internal transform may be undefined.
    // Accessing `this.x` or `this.y` would then throw. Guard against that so utility
    // functions can still iterate over stale references without crashing.
    let currentX = this.partData.x;
    let currentY = this.partData.y;
    try {
      // `x` / `y` getters can throw if transform is missing
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      currentX = (this as any).x ?? currentX;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      currentY = (this as any).y ?? currentY;
    } catch {
      // ignore – we’ll fall back to stored values
    }

    return {
      ...this.partData,
      x: currentX,
      y: currentY,
      velocity: this.matterBody ? {
        x: this.matterBody.velocity.x,
        y: this.matterBody.velocity.y
      } : { x: 0, y: 0 }
    };
  }
  
  public getPartLevel(): PartLevel {
    return this.partLevel;
  }
  
  public isPartDropped(): boolean {
    return this.isDropped;
  }
  
  public getStabilityPoints(): number {
    return this.stabilityManager.calculateStabilityPoints(this.partData);
  }
  
  /**
   * Validate if this part can be placed on the given existing parts
   */
  public validatePlacement(existingParts: CastlePart[]): EnhancedPlacementResult {
    // Level 1 parts can only be placed on ground (not on other parts)
    if (this.partLevel === 1) {
      // Check if this Level 1 part is actually on the ground
      const isOnGround = this.isPartOnGround();
      
      // Also check if it's NOT on top of another part
      const isOnAnotherPart = this.isPartOnTopOfOtherParts(existingParts);
      

      
      return { 
        valid: isOnGround && !isOnAnotherPart, 
        targetLevel: 0, 
        penaltyApplied: !isOnGround || isOnAnotherPart,
        scoreData: {
          placementBonus: 0,
          levelBonus: 0,
          totalBonus: 0,
          feedbackMessage: ''
        },
        isLevelSix: false,
        shouldTriggerCastleClear: false
      };
    }
    
    // For Level 2+ parts, find parts underneath this position
    const partsBelow = existingParts.filter(existing => {
      // Safety check: ensure existing part has valid physics
      if (!existing.body || !existing.body.position) {
        return false;
      }
      
      try {
        const existingData = existing.getPartData();
        const horizontalOverlap = Math.abs(existingData.x - this.partData.x) < (existingData.width + this.partData.width) / 2;
        
        // Determine vertical relationship
        const isBelow = existingData.y > this.partData.y; // existing part must be below current one

        // Distance between centres on Y axis
        const verticalDistance = Math.abs(existingData.y - this.partData.y);

        // Compute the minimum distance at which the two rectangles would be
        // just touching (half heights added together) and allow a small
        // tolerance.
        const minTouchDistance = (existingData.height + this.partData.height) / 2;
        const isClose = verticalDistance <= minTouchDistance + PLACEMENT_CONFIG.collisionTolerance;
        
        
        
        return horizontalOverlap && isBelow && isClose;
              } catch (e) {
          return false;
        }
    });
    
    
    
    // Check if any part below has the correct level (this.partLevel - 1)
    const validTarget = partsBelow.find(below => below.getPartLevel() === this.partLevel - 1);
    
    
    
    return {
      valid: validTarget !== undefined,
      targetLevel: validTarget?.getPartLevel() || null,
      penaltyApplied: !validTarget,
      scoreData: {
        placementBonus: 0,
        levelBonus: 0,
        totalBonus: 0,
        feedbackMessage: ''
      },
      isLevelSix: false,
      shouldTriggerCastleClear: false
    };
  }
  
  /**
   * Check if the bottom of this part is touching (or very close to) the ground line.
   * We no longer use a “bottom-half of screen” heuristic because that allowed
   * multiple level-1 parts to stack. Instead we compare the part’s bottom Y
   * coordinate against the known ground top Y coordinate.
   */
  private isPartOnGround(): boolean {
    if (!this.scene) return false;

    // In GameScene the ground sprite is created with height 50 and its centre
    // positioned at  (sceneHeight - 25).
    const GROUND_HEIGHT = 50;
    const groundTopY = this.scene.scale.height - GROUND_HEIGHT; // top edge of ground sprite

    // Bottom Y of the rectangular part (this.y is centre)
    const partBottomY = this.y + this.height / 2;

    const tolerance = PLACEMENT_CONFIG.collisionTolerance; // pixels

    return Math.abs(partBottomY - groundTopY) <= tolerance;
  }
  
  /**
   * Check if this part is positioned on top of other parts
   */
  private isPartOnTopOfOtherParts(existingParts: CastlePart[]): boolean {
    return existingParts.some(existing => {
      // Safety check: ensure existing part has valid physics
      if (!existing.body || !existing.body.position) {
        return false;
      }
      
      try {
        const existingData = existing.getPartData();
        const horizontalOverlap = Math.abs(existingData.x - this.partData.x) < (existingData.width + this.partData.width) / 2;
        
        // Check if this part is above the existing part (lower Y = higher on screen)
        const isAbove = this.partData.y < existingData.y;
        const verticalDistance = Math.abs(existingData.y - this.partData.y);
        const isTouching = verticalDistance < this.height + PLACEMENT_CONFIG.collisionTolerance;
        
        return horizontalOverlap && isAbove && isTouching;
          } catch (e) {
      return false;
    }
    });
  }
  
  /**
   * Mark this part as having valid or invalid placement
   */
  public setPlacementValid(valid: boolean): void {
    this.partData.placedOnValidTarget = valid;
    
    // Update visual feedback based on placement validity
    if (!valid && this.isDropped) {
      // Add red glow for invalid placement
      this.updateStabilityVisual('unstable');
    }
  }
  
  /**
   * Check if this part should be destroyed due to wrong placement
   */
  public shouldDestroy(): boolean {
    return this.isDropped && !this.partData.placedOnValidTarget;
  }
  
  // Level display now moves automatically as part of the container
  // No need for manual position updates
  
  public destroy(): void {
    // Clean up visual effects
    if (this.shadow) {
      this.shadow.destroy();
    }
    if (this.stabilityGlow) {
      this.stabilityGlow.destroy();
    }
    if (this.levelDisplay) {
      this.levelDisplay.destroy();
    }
    if (this.customGraphics) {
      this.customGraphics.destroy();
    }
    
    // Clean up Matter.js event listeners
    if (this.scene && this.scene.matter && this.scene.matter.world) {
      this.scene.matter.world.off('collisionstart', this.handleSandContact);
    }
    
    // Stop any running tweens (with null check)
    if (this.scene && this.scene.tweens) {
      this.scene.tweens.killTweensOf(this);
      if (this.stabilityGlow) {
        this.scene.tweens.killTweensOf(this.stabilityGlow);
      }
      if (this.levelDisplay) {
        this.scene.tweens.killTweensOf(this.levelDisplay);
      }
    }
    
    super.destroy();
  }

  /**
   * Enhanced placement validation with scoring calculation
   */
  public validatePlacementWithScoring(existingParts: CastlePart[], comboCount: number, timingBonus: number): EnhancedPlacementResult {
    const baseResult = this.validatePlacement(existingParts);
    
    if (baseResult.valid) {
      // Calculate placement bonuses
      const placementBonus = SCORING_CONFIG.placementBonus;
      const levelMultiplier = this.partLevel * SCORING_CONFIG.levelMultiplier;
      const levelBonus = SCORING_CONFIG.baseScore * levelMultiplier;
      
      // Combo multiplier bonus
      const comboMultiplier = Math.min(1 + (comboCount - 1) * 0.1, 3.0);
      const comboBonus = Math.floor((placementBonus + levelBonus) * (comboMultiplier - 1));
      
      const totalBonus = placementBonus + levelBonus + comboBonus + timingBonus;
      
      // Generate feedback message
      let feedbackMessage = `Level ${this.partLevel}!`;
      if (comboCount > 1) {
        feedbackMessage += `\n${comboCount}x COMBO!`;
      }
      if (timingBonus > 0) {
        feedbackMessage += `\nQuick! +${timingBonus}`;
      }
      
      return {
        ...baseResult,
        scoreData: {
          placementBonus,
          levelBonus,
          totalBonus,
          feedbackMessage
        },
        isLevelSix: this.partLevel === 6,
        shouldTriggerCastleClear: this.partLevel === 6
      };
    } else {
      return {
        ...baseResult,
        scoreData: {
          placementBonus: 0,
          levelBonus: 0,
          totalBonus: 0,
          feedbackMessage: 'Wrong Level!'
        },
        isLevelSix: false,
        shouldTriggerCastleClear: false
      };
    }
  }

  /**
   * Check ground collision and return penalty information
   */
  public checkGroundCollision(): GroundCollisionResult {
    const isTouchingGround = this.isPartOnGround();
    
    // Level 1 parts are allowed on ground
    if (this.partLevel === 1) {
      return {
        isTouchingGround,
        shouldApplyPenalty: false,
        penaltyAmount: 0,
        penaltyMessage: ''
      };
    }
    
    // Level 2+ parts should not touch ground
    if (isTouchingGround) {
      return {
        isTouchingGround: true,
        shouldApplyPenalty: true,
        penaltyAmount: SCORING_CONFIG.wrongPlacementPenalty,
        penaltyMessage: 'Part touched ground!'
      };
    }
    
    return {
      isTouchingGround: false,
      shouldApplyPenalty: false,
      penaltyAmount: 0,
      penaltyMessage: ''
    };
  }

  /**
   * Trigger visual effects for successful placement
   */
  public showSuccessEffects(_bonus: number, _message: string, comboLevel: number, _isQuickPlacement: boolean): void {
    // Create sparkles based on combo level
    if (comboLevel >= 5) {
      // Epic combo effects
      this.visualEffects.createSuccessSparkles(this.x, this.y);
      this.visualEffects.createSuccessSparkles(this.x - 30, this.y - 20);
      this.visualEffects.createSuccessSparkles(this.x + 30, this.y - 20);
    } else {
      this.visualEffects.createSuccessSparkles(this.x, this.y);
    }
    
    // Play appropriate sound
    if (comboLevel >= 5) {
      this.audioManager.playSound('place-perfect');
    } else {
      this.audioManager.playSound('place-good');
    }
  }

  /**
   * Trigger visual effects for destruction
   */
  public showDestructionEffects(): void {
    this.visualEffects.createDestructionEffect(this.x, this.y, COLORS.RED);
    this.audioManager.playSound('collapse');
  }

  /**
   * Initialize autonomous movement for active part
   */
  public initializeMovement(speed: number, boundaryLeft: number, boundaryRight: number): void {
    this.movementState = {
      speed,
      direction: Math.random() > 0.5 ? 1 : -1,
      boundaryLeft,
      boundaryRight
    };
  }

  /**
   * Update autonomous movement (called from scene update)
   */
  public updateMovement(deltaTime: number): void {
    if (!this.movementState || this.isDropped) return;
    
    // Move horizontally
    const moveDistance = this.movementState.direction * this.movementState.speed * deltaTime;
    this.x += moveDistance;
    
    // Check boundaries and reverse direction
    if (this.x <= this.movementState.boundaryLeft + this.width / 2) {
      this.x = this.movementState.boundaryLeft + this.width / 2;
      this.movementState.direction = 1;
    } else if (this.x >= this.movementState.boundaryRight - this.width / 2) {
      this.x = this.movementState.boundaryRight - this.width / 2;
      this.movementState.direction = -1;
    }
    
    // Update part data position
    this.partData.x = this.x;
    
    // Update all visual elements to follow the part
    this.updatePositions();
  }

  /**
   * Find parts that should be cleared when this Level 6 part is placed
   */
  public findCastlePartsToRemove(allParts: CastlePart[]): CastlePart[] {
    if (this.partLevel !== 6) return [];
    
    const partsToRemove = allParts.filter(p => {
      const horizontallyAligned = Math.abs(p.x - this.x) < (p.width + this.width) / 2;
      const belowOrSame = p.y >= this.y;
      return horizontallyAligned && belowOrSame;
    });
    
    // Ensure this Level 6 part itself is included
    if (!partsToRemove.includes(this)) {
      partsToRemove.push(this);
    }
    
    return partsToRemove;
  }

  /**
   * Create spectacular castle completion celebration
   */
  public createCastleCelebration(): void {
    // Multiple sparkle effects at different positions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.visualEffects.createSuccessSparkles(
          this.x + (Math.random() - 0.5) * 100,
          this.y - i * 20
        );
      }, i * 100);
    }
    
    this.audioManager.playSound('level-complete');
  }
} 