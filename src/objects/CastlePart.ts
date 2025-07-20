import { Scene } from 'phaser';
import { CastlePartData, PartLevel, PlacementResult } from '@/types/Game';
import { COLORS, PHYSICS_CONFIG, getPartColor, PLACEMENT_CONFIG } from '@/config/gameConfig';
import { StabilityManager } from '@/objects/StabilityManager';
import { AudioManager } from '@/utils/AudioManager';

export class CastlePart extends Phaser.GameObjects.Rectangle {
  private partData: CastlePartData;
  private partLevel: PartLevel;
  private isDropped: boolean = false;
  private shadow?: Phaser.GameObjects.Rectangle;
  private stabilityManager: StabilityManager;
  private audioManager: AudioManager;
  private stabilityGlow?: Phaser.GameObjects.Arc;
  private lastStabilityLevel: 'stable' | 'warning' | 'unstable' = 'stable';
  private matterBody?: MatterJS.BodyType;
  private levelDisplay?: Phaser.GameObjects.Text;
  private customGraphics?: Phaser.GameObjects.Graphics; // Custom graphics overlay
  
  constructor(scene: Scene, x: number, y: number, width: number, height: number, partLevel: PartLevel) {
    // Create Rectangle with base color
    const partColor = getPartColor(partLevel);
    super(scene, x, y, width, height, partColor);
    
    this.partLevel = partLevel;
    this.stabilityManager = new StabilityManager();
    this.audioManager = AudioManager.getInstance();
    
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
    // Set stroke based on level
    const strokeColor = this.partLevel <= 2 ? COLORS.SAND_DARK : COLORS.WHITE;
    this.setStrokeStyle(2, strokeColor);
  }
  
  /**
   * Create custom graphics overlay for castle part textures
   */
  private createCustomGraphics(): void {
    if (!this.scene) return;
    
    this.customGraphics = this.scene.add.graphics();
    this.customGraphics.setPosition(this.x - this.width / 2, this.y - this.height / 2);
    this.customGraphics.setDepth(this.depth + 1); // Above the rectangle
    
    // Draw textures based on level
    switch (this.partLevel) {
      case 1: // Foundation block - solid rectangle with base pattern
        this.drawFoundationTexture();
        break;
      case 2: // Base wall - rectangle with brick pattern
        this.drawBrickTexture();
        break;
      case 3: // Upper wall - thinner rectangle with windows
        this.drawUpperWallTexture();
        break;
      case 4: // Tower section - narrower with architectural details
        this.drawTowerTexture();
        break;
      case 5: // Decorative element - ornate shape
        this.drawDecorativeTexture();
        break;
      case 6: // Pinnacle/flag - triangular top piece
        this.drawPinnacleTexture();
        break;
    }
  }
  
  private drawFoundationTexture(): void {
    if (!this.customGraphics) return;
    
    // Add foundation texture lines
    this.customGraphics.lineStyle(1, COLORS.SAND_DARK, 0.5);
    for (let y = 5; y < this.height; y += 8) {
      this.customGraphics.beginPath();
      this.customGraphics.moveTo(2, y);
      this.customGraphics.lineTo(this.width - 2, y);
      this.customGraphics.strokePath();
    }
  }
  
  private drawBrickTexture(): void {
    if (!this.customGraphics) return;
    
    // Add brick pattern
    this.customGraphics.lineStyle(1, COLORS.SAND_DARK, 0.7);
    const brickHeight = 8;
    const brickWidth = this.width / 3;
    
    for (let y = 0; y < this.height; y += brickHeight) {
      const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      
      // Horizontal line
      this.customGraphics.beginPath();
      this.customGraphics.moveTo(0, y);
      this.customGraphics.lineTo(this.width, y);
      this.customGraphics.strokePath();
      
      // Vertical lines
      for (let x = offset; x < this.width; x += brickWidth) {
        this.customGraphics.beginPath();
        this.customGraphics.moveTo(x, y);
        this.customGraphics.lineTo(x, Math.min(y + brickHeight, this.height));
        this.customGraphics.strokePath();
      }
    }
  }
  
  private drawUpperWallTexture(): void {
    if (!this.customGraphics) return;
    
    // Add window
    const windowWidth = this.width * 0.3;
    const windowHeight = this.height * 0.4;
    const windowX = (this.width - windowWidth) / 2;
    const windowY = (this.height - windowHeight) / 2;
    
    this.customGraphics.fillStyle(COLORS.SKY, 0.8);
    this.customGraphics.fillRect(windowX, windowY, windowWidth, windowHeight);
    this.customGraphics.lineStyle(1, COLORS.SAND_DARK);
    this.customGraphics.strokeRect(windowX, windowY, windowWidth, windowHeight);
    
    // Window cross
    this.customGraphics.beginPath();
    this.customGraphics.moveTo(windowX + windowWidth / 2, windowY);
    this.customGraphics.lineTo(windowX + windowWidth / 2, windowY + windowHeight);
    this.customGraphics.moveTo(windowX, windowY + windowHeight / 2);
    this.customGraphics.lineTo(windowX + windowWidth, windowY + windowHeight / 2);
    this.customGraphics.strokePath();
  }
  
  private drawTowerTexture(): void {
    if (!this.customGraphics) return;
    
    // Add battlements on top
    const merlonWidth = this.width / 5;
    const merlonHeight = this.height * 0.2;
    
    this.customGraphics.fillStyle(getPartColor(this.partLevel));
    this.customGraphics.lineStyle(1, COLORS.WHITE);
    for (let i = 0; i < 5; i += 2) {
      const x = i * merlonWidth;
      this.customGraphics.fillRect(x, -merlonHeight, merlonWidth, merlonHeight);
      this.customGraphics.strokeRect(x, -merlonHeight, merlonWidth, merlonHeight);
    }
    
    // Add small windows
    const windowSize = 4;
    const windowY = this.height * 0.3;
    this.customGraphics.fillStyle(COLORS.SKY, 0.8);
    this.customGraphics.fillRect((this.width - windowSize) / 2, windowY, windowSize, windowSize);
    this.customGraphics.strokeRect((this.width - windowSize) / 2, windowY, windowSize, windowSize);
  }
  
  private drawDecorativeTexture(): void {
    if (!this.customGraphics) return;
    
    // Draw decorative arch
    const archWidth = this.width * 0.8;
    
    this.customGraphics.lineStyle(2, COLORS.WHITE);
    this.customGraphics.beginPath();
    this.customGraphics.arc(this.width / 2, this.height * 0.6, archWidth / 2, Math.PI, 0, true);
    this.customGraphics.strokePath();
    
    // Add decorative details
    this.customGraphics.lineStyle(1, COLORS.WHITE);
    for (let i = 0; i < 3; i++) {
      const y = this.height * 0.7 + i * 3;
      this.customGraphics.beginPath();
      this.customGraphics.moveTo(2, y);
      this.customGraphics.lineTo(this.width - 2, y);
      this.customGraphics.strokePath();
    }
  }
  
  private drawPinnacleTexture(): void {
    if (!this.customGraphics) return;
    
    // Draw flag pole (thin rectangle)
    const poleWidth = this.width * 0.2;
    const poleX = (this.width - poleWidth) / 2;
    this.customGraphics.fillStyle(getPartColor(this.partLevel));
    this.customGraphics.fillRect(poleX, 0, poleWidth, this.height);
    this.customGraphics.strokeRect(poleX, 0, poleWidth, this.height);
    
    // Draw flag (triangle)
    const flagWidth = this.width * 0.6;
    const flagHeight = this.height * 0.4;
    const flagX = poleX + poleWidth;
    const flagY = this.height * 0.1;
    
    this.customGraphics.fillStyle(COLORS.RED);
    this.customGraphics.beginPath();
    this.customGraphics.moveTo(flagX, flagY);
    this.customGraphics.lineTo(flagX + flagWidth, flagY + flagHeight / 2);
    this.customGraphics.lineTo(flagX, flagY + flagHeight);
    this.customGraphics.closePath();
    this.customGraphics.fillPath();
    this.customGraphics.strokePath();
  }
  
  private createLevelDisplay(): void {
    if (!this.scene) return;
    
    // Create text to display the part level - always visible and centered
    this.levelDisplay = this.scene.add.text(
      this.x,
      this.y,
      this.partLevel.toString(),
      {
        fontSize: '18px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          fill: true
        }
      }
    );
    this.levelDisplay.setOrigin(0.5, 0.5);
    this.levelDisplay.setDepth(2000); // Ensure it's always on top
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
  
  /**
   * Update graphics and level display position when part moves
   */
  private updatePositions(): void {
    if (!this.scene || !this.active) return;

    // Update custom graphics position
    if (this.customGraphics) {
      this.customGraphics.setPosition(this.x - this.width / 2, this.y - this.height / 2);
    }
    if (this.levelDisplay) {
      this.levelDisplay.setPosition(this.x, this.y);
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
      
      if (this.matterBody) {
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
    if (!this.isDropped || !this.matterBody) return true;
    
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
      this.audioManager.playSound('wobble');
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
    if (!this.matterBody) return;
    
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
  public validatePlacement(existingParts: CastlePart[]): PlacementResult {
    // Level 1 parts can only be placed on ground (not on other parts)
    if (this.partLevel === 1) {
      // Check if this Level 1 part is actually on the ground
      const isOnGround = this.isPartOnGround();
      
      // Also check if it's NOT on top of another part
      const isOnAnotherPart = this.isPartOnTopOfOtherParts(existingParts);
      

      
      return { 
        valid: isOnGround && !isOnAnotherPart, 
        targetLevel: 0, 
        penaltyApplied: !isOnGround || isOnAnotherPart 
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
      penaltyApplied: !validTarget
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
} 