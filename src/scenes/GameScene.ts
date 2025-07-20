import { CastlePart } from '@/objects/CastlePart';
import { GAME_CONFIG, LEVELS, COLORS, PHYSICS_CONFIG, SCORING_CONFIG, generateLevel } from '@/config/gameConfig';
import { GameState, GroundViolation } from '@/types/Game';
import { StabilityManager } from '@/objects/StabilityManager';
import { VisualEffects } from '@/utils/VisualEffects';
import { getAvailablePartLevels, getPartWidth, getPartHeight } from '@/utils/PartUtils';
import { tSync } from '@/i18n';
import { phaserStateManager, PhaserGameState } from '@/utils/PhaserStateManager';
import { BaseScene } from '@/scenes/BaseScene';
import { 
  createResponsiveText, 
  createCenteredResponsiveText,
  calculateDynamicSpacing,
  TEXT_CONFIGS 
} from '@/utils/TextUtils';

export class GameScene extends BaseScene {
  private currentPart?: CastlePart;
  private droppedParts: CastlePart[] = [];
  private gameState: GameState;
  private partSpeed: number = GAME_CONFIG.partSpeed;
  private levelText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private targetText?: Phaser.GameObjects.Text; // Displays target parts remaining
  private instructionText?: Phaser.GameObjects.Text;
  private penaltyText?: Phaser.GameObjects.Text;
  private currentLevelIndex: number = 0;
  private stabilityManager: StabilityManager;
  private visualEffects: VisualEffects;
  private groundViolations: GroundViolation[] = [];
  private totalPartsDropped: number = 0; // Track total parts dropped including destroyed ones
  private groundSprite?: Phaser.GameObjects.Rectangle; // Reference to ground sprite for collision detection
  private overallPartsPlaced: number = 0; // NEW: track total parts placed across entire run
  private successfulPartsInstalled: number = 0; // NEW: count of valid placements in current level
  private wrongPartsCurrentLevel: number = 0; // NEW: wrong placements in current level
  private totalSuccessfulPlaced: number = 0; // NEW: cumulative successful placements across game
  private rewardedCastleCount: number = 0; // NEW: total rewards triggered by level-6 clears

  // Enhanced scoring system
  private comboCount: number = 0; // Consecutive correct placements
  private maxCombo: number = 0; // Best combo streak
  private perfectPlacements: number = 0; // Parts placed with bonus criteria
  private lastPlacementTime: number = 0; // For timing bonuses

  // Level completion state
  private isLevelCompleting: boolean = false; // Prevent spawning new parts during level completion

  // UI text objects for new stats
  private totalSuccessText?: Phaser.GameObjects.Text;
  private rewardCountText?: Phaser.GameObjects.Text;
  private wrongLevelText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBarBg?: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
    // Set calm beach ambient music for gameplay
    this.setBackgroundMusic('background-music');
    
    this.stabilityManager = new StabilityManager();
    this.visualEffects = new VisualEffects(this);

    this.gameState = {
      currentLevel: 1,
      score: 0,
      lives: 3,
      droppedParts: [],
      isGameActive: true,
      isFirstPart: true // Start with the first part
    };
  }

  // Implementation of BaseScene abstract methods
  protected async customPreload(): Promise<void> {
    // No additional preload logic needed - BaseScene handles audio and i18n
  }

  protected onLanguageChanged(): void {
    this.updateTexts();
  }

  init(data?: any): void {
    // Handle scene restoration from saved state
    if (data?.restoreFromState) {
      // Restoring GameScene from saved state
      const savedState = phaserStateManager.loadGameState(this.game);
      if (savedState) {
        this.restoreGameState(savedState);
        return;
      }
    }
    
    // Try to load saved game state first (for development persistence)
    const savedState = phaserStateManager.loadGameState(this.game);
    
    if (savedState && !data?.continueFromLevel) {
      // Restoring saved game state from development persistence
      this.restoreGameState(savedState);
      return;
    }
    
    // Handle continuation from level complete scene
    if (data?.continueFromLevel) {
      // Starting fresh GameScene for level
      
      // Clean up existing game objects and physics bodies
      this.cleanupGameObjects();
      
      this.gameState.currentLevel = data.currentLevel || 1;
      this.gameState.score = data.totalScore || 0;
      this.currentLevelIndex = this.gameState.currentLevel - 1;
      
      // Ensure we have the level data
      if (this.currentLevelIndex >= LEVELS.length) {
        const newLevelId = this.currentLevelIndex + 1;
        const newLevel = generateLevel(newLevelId);
        LEVELS.push(newLevel);
      }
      
      // Reset level-specific counters for the new level
      this.successfulPartsInstalled = 0;
      this.wrongPartsCurrentLevel = 0;
      this.totalPartsDropped = 0;
      this.groundViolations = [];
      this.gameState.isFirstPart = true;
      
      // Reset combo for new level
      this.comboCount = 0;
      
      // Reset level completion state
      this.isLevelCompleting = false;
      
      // Ensure game is active and input is enabled
      this.gameState.isGameActive = true;
      this.input.enabled = true;
    } else {
      // Reset game state for new game
      // Starting new game - resetting all game state
      
      // Clean up existing game objects and physics bodies
      this.cleanupGameObjects();
      
      this.gameState = {
        currentLevel: 1,
        score: 0,
        lives: 3,
        droppedParts: [],
        isGameActive: true,
        isFirstPart: true
      };
      this.currentLevelIndex = 0;
      this.droppedParts = [];
      this.currentPart = undefined;
      this.partSpeed = GAME_CONFIG.partSpeed;
      this.groundViolations = [];
      this.totalPartsDropped = 0;
      this.overallPartsPlaced = 0;
      this.successfulPartsInstalled = 0;
      this.wrongPartsCurrentLevel = 0;
      this.totalSuccessfulPlaced = 0;
      this.rewardedCastleCount = 0;
      
      // Reset enhanced scoring system
      this.comboCount = 0;
      this.maxCombo = 0;
      this.perfectPlacements = 0;
      this.lastPlacementTime = 0;
      
      // Reset level completion state
      this.isLevelCompleting = false;
    }
  }

  protected customCreate(): void {
    // Setup physics first with proper configuration
    this.setupPhysics();

    this.createBackground();
    this.createUI();
    this.setupInput();
    this.updateUI(); // Ensure UI reflects current game state
    
    // Setup debug functions
    this.setupDebugFunctions();
    
    // Recreate dropped parts if state was restored
    if (this.gameState.droppedParts.length > 0) {
      this.recreateDroppedParts();
    }
    
    // Spawn next part (or restore existing parts if state was loaded)
    if (this.droppedParts.length === 0) {
      // New game - spawning first part
      this.spawnNextPart();
    } else {
      // State was restored, but we still need a current part to move
      // Game state restored, spawning new current part
      this.spawnNextPart();
    }
  }

  /**
   * Restore complete game state from saved data
   */
  private restoreGameState(savedState: PhaserGameState): void {
    // Restore core game state
    this.gameState = savedState.gameState;
    
    // Ensure game is active when restoring (user wants to continue playing)
    this.gameState.isGameActive = true;
    
    this.currentLevelIndex = savedState.currentLevelIndex;
    this.partSpeed = savedState.partSpeed;
    
    // Restore statistics
    this.totalPartsDropped = savedState.totalPartsDropped;
    this.overallPartsPlaced = savedState.overallPartsPlaced;
    this.successfulPartsInstalled = savedState.successfulPartsInstalled;
    this.wrongPartsCurrentLevel = savedState.wrongPartsCurrentLevel;
    this.totalSuccessfulPlaced = savedState.totalSuccessfulPlaced;
    this.rewardedCastleCount = savedState.rewardedCastleCount;
    
    // Restore enhanced scoring system (use defaults if not present)
    this.comboCount = (savedState as any).comboCount || 0;
    this.maxCombo = (savedState as any).maxCombo || 0;
    this.perfectPlacements = (savedState as any).perfectPlacements || 0;
    this.lastPlacementTime = (savedState as any).lastPlacementTime || 0;
    
    // Restore ground violations
    this.groundViolations = savedState.groundViolations;

    // Restore dropped parts (will be recreated in create method)
    this.gameState.droppedParts = savedState.droppedParts;
  }

  /**
   * Recreate dropped parts from saved state
   */
  private recreateDroppedParts(): void {
    if (this.gameState.droppedParts.length === 0) {
      return;
    }

    this.gameState.droppedParts.forEach(partData => {
      const part = new CastlePart(
        this,
        partData.x,
        partData.y,
        partData.width,
        partData.height,
        partData.level as 1 | 2 | 3 | 4 | 5 | 6
      );
      
      // Set the part as dropped and add to physics
      part.drop(PHYSICS_CONFIG.gravity);
      
      // Add to dropped parts array
      this.droppedParts.push(part);
    });
  }

  /**
   * Expose debug functions for development
   */
  private setupDebugFunctions(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugPhaserState = {
        ...(window as any).debugPhaserState,
        save: () => {
          this.saveCurrentState();
        },
        forceSave: () => {
          this.saveCurrentState();
        }
      };
    }
  }

  private cleanupGameObjects(): void {
    // Clean up current part
    if (this.currentPart && this.currentPart.active) {
      this.currentPart.destroy();
      this.currentPart = undefined;
    }
    
    // Clean up all dropped parts
    this.droppedParts.forEach(part => {
      if (part && part.destroy) {
        part.destroy();
      }
    });
    this.droppedParts = [];
    
    // Clear all physics bodies except the ground
    const bodies = this.matter.world.getAllBodies();
    bodies.forEach(body => {
      // Don't destroy the ground body or world bounds
      if (body && !body.isStatic && body.label !== 'ground') {
        this.matter.world.remove(body);
      }
    });
    
    // Clear any existing tweens
    this.tweens.killAll();
  }

  private createBackground(): void {
    // Use BaseScene helper for beautiful beach background
    this.createBeachBackground();

    // Add enhanced ground with subtle texture
    const ground = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 25,
      this.scale.width,
      50,
      COLORS.SAND
    );
    ground.setStrokeStyle(2, COLORS.SAND_DARK);
    
    // Add subtle ground texture lines
    const groundTexture = this.add.graphics();
    groundTexture.lineStyle(1, COLORS.SAND_DARK, 0.3);
    for (let i = 0; i < 3; i++) {
      const y = this.scale.height - 40 + i * 8;
      groundTexture.moveTo(20, y);
      groundTexture.lineTo(this.scale.width - 20, y);
    }
    groundTexture.strokePath();
  }

  private createUI(): void {
    // Calculate dynamic spacing for responsive layout
    const spacing = calculateDynamicSpacing(this, 35);
    const smallSpacing = calculateDynamicSpacing(this, 20);
    
    // Main game info panel - positioned at top-left with proper spacing
    let currentY = smallSpacing;
    
    // Level indicator with animation - using TEXT_CONFIGS for consistency
    const levelResult = createResponsiveText(
      this,
      smallSpacing,
      currentY,
      'Level {{level}}',
      {
        ...TEXT_CONFIGS.TITLE_MEDIUM,
        maxWidth: 0.4, // 40% of screen width for HUD
        color: '#FFFFFF',
        stroke: '#2C3E50',
        strokeThickness: 3
      },
      { level: this.gameState.currentLevel }
    );
    this.levelText = levelResult.text;
    
    // Add bounce animation for level text
    this.visualEffects.createBounceAnimation(this.levelText, 100);
    
    currentY += levelResult.actualHeight + smallSpacing * 2;

    // Score display with glow effect
    const scoreResult = createResponsiveText(
      this,
      smallSpacing,
      currentY,
      'Score: {{score}}',
      {
        ...TEXT_CONFIGS.SUBTITLE_MEDIUM,
        maxWidth: 0.4,
        color: '#F39C12', // Gold color for score
        stroke: '#FFFFFF',
        strokeThickness: 2
      },
      { score: this.gameState.score }
    );
    this.scoreText = scoreResult.text;
    
    currentY += scoreResult.actualHeight + smallSpacing / 2;

    // Target parts remaining display
    const initialLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
    const initialPartsLeft = initialLevel ? initialLevel.targetParts : 0;
    
    const targetResult = createResponsiveText(
      this,
      smallSpacing,
      currentY,
      'Target: {{target}} parts',
      {
        ...TEXT_CONFIGS.STATS_SMALL,
        maxWidth: 0.5,
        color: '#E67E22', // Orange for target
        stroke: '#FFFFFF',
        strokeThickness: 2
      },
      { target: initialPartsLeft }
    );
    this.targetText = targetResult.text;
    
    currentY += targetResult.actualHeight + spacing;

    // Statistics panel - smaller and more subtle
    const statsStartY = currentY;
    
    const totalSuccessResult = createResponsiveText(
      this,
      smallSpacing,
      statsStartY,
      'Total Installed: {{count}}',
      TEXT_CONFIGS.STATS_SMALL,
      { count: 0 }
    );
    this.totalSuccessText = totalSuccessResult.text;
    
    const rewardCountResult = createResponsiveText(
      this,
      smallSpacing,
      statsStartY + totalSuccessResult.actualHeight + 5,
      'Castles Rewarded: {{count}}',
      TEXT_CONFIGS.STATS_SMALL,
      { count: 0 }
    );
    this.rewardCountText = rewardCountResult.text;
    
    const wrongLevelResult = createResponsiveText(
      this,
      smallSpacing,
      statsStartY + totalSuccessResult.actualHeight + rewardCountResult.actualHeight + 10,
      'Wrong Parts: {{count}}',
      {
        ...TEXT_CONFIGS.STATS_SMALL,
        color: '#E74C3C' // Red for wrong parts
      },
      { count: 0 }
    );
    this.wrongLevelText = wrongLevelResult.text;

    // Combo counter - positioned on the right side below pause button to avoid conflict
    const comboResult = createResponsiveText(
      this,
      this.scale.width - smallSpacing,
      smallSpacing * 5, // Move even lower to provide enough clearance
      'Combo: {{count}}x',
      {
        ...TEXT_CONFIGS.SUBTITLE_MEDIUM,
        maxWidth: 0.4,
        color: '#9B59B6', // Purple for combo
        stroke: '#FFFFFF',
        strokeThickness: 2,
        align: 'right'
      },
      { count: 0 }
    );
    this.comboText = comboResult.text;
    this.comboText.setOrigin(1, 0); // Right-aligned

    // Instructions panel - centered at bottom with dynamic level description
    const instructionText = this.createDynamicInstructions();
    this.instructionText = instructionText;

    // Removed static pulsing glow - now triggered dynamically on score updates

    // Create level progress indicator
    this.createProgressBar();

    // Add a pause button in top-right corner using BaseScene helper
    this.createPauseButton(() => {
      this.scene.pause();
      this.input.enabled = false; // Disable input when pausing
      this.cameras.main.setVisible(false);
      this.scene.launch('MenuScene', { isPaused: true }); // Pass pause context to MenuScene
    });
  }

  private setupInput(): void {
    // Handle both touch and mouse input
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
      // Only drop if game is active and input is enabled
      if (this.gameState.isGameActive && this.input.enabled) {
        this.dropCurrentPart();
      }
    }, this);

    // Keyboard input for desktop testing
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.gameState.isGameActive && this.input.enabled) {
        this.dropCurrentPart();
      }
    }, this);
  }

  private setupPhysics(): void {
    // Configure Matter.js physics engine for enhanced sand-like behavior
    this.matter.world.setGravity(0, PHYSICS_CONFIG.gravity);

    // Configure world bounds with high friction walls
    this.matter.world.setBounds(0, 0, this.scale.width, this.scale.height, 32, true, true, true, false);

    // Set high friction for world bounds to prevent parts from sliding along walls
    const worldBounds = this.matter.world.walls;
    if (worldBounds.left) {
      this.matter.body.set(worldBounds.left, 'friction', 1.0);
      this.matter.body.set(worldBounds.left, 'frictionStatic', 1.5);
    }
    if (worldBounds.right) {
      this.matter.body.set(worldBounds.right, 'friction', 1.0);
      this.matter.body.set(worldBounds.right, 'frictionStatic', 1.5);
    }
    if (worldBounds.top) {
      this.matter.body.set(worldBounds.top, 'friction', 1.0);
      this.matter.body.set(worldBounds.top, 'frictionStatic', 1.5);
    }

    // Create enhanced static ground for collision
    const groundY = this.scale.height - 25;
    const groundHeight = 50;

    this.groundSprite = this.add.rectangle(
      this.scale.width / 2,
      groundY,
      this.scale.width,
      groundHeight,
      COLORS.SAND_DARK
    );

    // Add Matter.js physics to ground with enhanced sand-friendly properties
    this.matter.add.gameObject(this.groundSprite, {
      isStatic: true,
      friction: PHYSICS_CONFIG.ground.friction,
      frictionStatic: PHYSICS_CONFIG.ground.frictionStatic,
      restitution: PHYSICS_CONFIG.ground.restitution,
      // Rougher surface texture for better grip
      chamfer: { radius: 1 },
      // Label for collision detection
      label: 'ground',
      // Ensure ground collision filter matches parts
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001,
        group: 0
      }
    });

    // Configure Matter.js engine for better stability
    this.matter.world.engine.constraintIterations = 3; // More constraint solving iterations
    this.matter.world.engine.positionIterations = 8; // More position iterations for stability
    this.matter.world.engine.velocityIterations = 6; // Better velocity resolution

    // Enable collision events for enhanced stability tracking
    this.matter.world.on('collisionstart', this.onCollisionStart, this);
    this.matter.world.on('collisionend', this.onCollisionEnd, this);
  }

  private onCollisionStart(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    // Handle collision start for sound effects and ground detection
    const pairs = event.pairs;

    for (const pair of pairs) {
      // Check if collision involves castle parts
      const bodyA = pair.bodyA.gameObject as CastlePart;
      const bodyB = pair.bodyB.gameObject as CastlePart;

      // Check for ground collisions
      const isGroundCollision = this.checkGroundCollision(pair.bodyA, pair.bodyB);

      if (bodyA instanceof CastlePart || bodyB instanceof CastlePart) {
        const castlePart = bodyA instanceof CastlePart ? bodyA : bodyB;
        
        // Create sand dust effect when part lands (visual feedback)
        if (castlePart) {
          this.visualEffects.createSandDustEffect(castlePart.x, castlePart.y, 0.8);
        }

        // Handle ground collision if detected (includes audio feedback)
        if (isGroundCollision && castlePart) {
          this.handleGroundCollision(castlePart);
        }
      }
    }
  }

  private checkGroundCollision(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType): boolean {
    // Check if either body is the ground
    return (bodyA.label === 'ground') || (bodyB.label === 'ground');
  }

  private handleGroundCollision(part: CastlePart): void {
    // Safety check: ensure part still has valid physics body
    if (!part || !part.body || !part.body.position) {
      return; // Skip if part is already destroyed or invalid
    }

    const partIndex = this.droppedParts.indexOf(part);
    if (partIndex === -1) return; // Part not in array

    // NEW LEVEL-BASED RULES: Level 1 parts are allowed on ground
    if (part.getPartLevel() === 1) {
      // Level 1 parts are allowed on ground - no penalty
      // Mark that first part has been placed
      if (this.gameState.isFirstPart) {
        this.gameState.isFirstPart = false;
      }
    } else {
      // Level 2+ parts touching ground get penalty
      this.handleGroundContact(part);
    }
  }

  private checkPartForGroundViolation(part: CastlePart): void {
    // Safety check: ensure part still exists and has a position
    if (!part || !part.body || part.body.position === undefined) {
      return;
    }

    // Note: This method is now mainly for safety checks - actual ground detection happens via collision
  }

  private handleGroundContact(part: CastlePart): void {
    // Safety check: ensure part still exists and is valid
    if (!part || !part.active) return;
    
    // Check if this part has already been penalized to avoid multiple penalties
    const partId = part.getPartData().id;
    const alreadyPenalized = this.groundViolations.some(violation => violation.partId === partId);

    if (alreadyPenalized) {
      return; // Don't apply penalty multiple times to the same part
    }

    // Check if part has already been marked as having valid placement by our new system
    if (part.getPartData().placedOnValidTarget) {
      return; // Don't penalize parts that passed placement validation
    }

    // Apply penalty for Level 2+ parts touching ground
    this.applyGroundPenalty(part);
  }

  private applyGroundPenalty(part: CastlePart): void {
    // Safety check: ensure part still exists and is valid
    if (!part || !part.active) return;
    
    // Apply penalty
    const penalty = GAME_CONFIG.groundPenalty.scoreReduction;
    this.gameState.score = Math.max(0, this.gameState.score - penalty);

    // Record violation
    const violation: GroundViolation = {
      partId: part.getPartData().id,
      penaltyApplied: penalty,
      timestamp: Date.now()
    };
    this.groundViolations.push(violation);

    // Show penalty feedback
    this.showPenaltyFeedback(penalty);

    // Play penalty sound
    this.audioManager.playSound('collapse');

    // Remove the part from dropped parts array
    const partIndex = this.droppedParts.indexOf(part);
    if (partIndex > -1) {
      this.droppedParts.splice(partIndex, 1);
    }

    // Destroy the part with effect
    this.destroyPartWithEffect(part);

    // Update UI
    this.updateUI();
  }

  private showPenaltyFeedback(penalty: number, message: string = tSync("Part touched ground!")): void {
    // Destroy existing penalty text
    if (this.penaltyText) {
      this.penaltyText.destroy();
    }

    const x = this.scale.width / 2;
    const y = this.scale.height / 2 - 50;

    // Create destruction effect at penalty position
    this.visualEffects.createDestructionEffect(x, y, COLORS.RED);

    // Create enhanced penalty text with responsive design
    this.penaltyText = createCenteredResponsiveText(
      this,
      x,
      y,
      `${tSync('Penalty')}: -${penalty} ${tSync('points')}\n${message}`,
      {
        ...TEXT_CONFIGS.SUBTITLE_MEDIUM,
        maxWidth: 0.8,
        color: '#E74C3C', // Red penalty color
        stroke: '#FFFFFF',
        strokeThickness: 3,
        fontStyle: 'bold'
      }
    );

    // Shake animation for penalty
    this.tweens.add({
      targets: this.penaltyText,
      x: x + 5,
      duration: 50,
      yoyo: true,
      repeat: 5,
      ease: 'Power2.easeInOut'
    });

    // Animate penalty text with fade out
    this.tweens.add({
      targets: this.penaltyText,
      y: y - 40,
      alpha: 0,
      duration: 2500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.penaltyText) {
          this.penaltyText.destroy();
          this.penaltyText = undefined;
        }
      }
    });
  }

  private destroyPartWithEffect(part: CastlePart): void {
    // Safety check: ensure part still exists and is valid
    if (!part || !part.active) return;
    
    // Create destruction particles
    this.createDestructionParticles(part.x, part.y);

    // Shake effect
    // this.cameras.main.shake(200, 0.01);

    // Destroy the part
    part.destroy();
  }

  private createDestructionParticles(x: number, y: number): void {
    // Use enhanced visual effects
    this.visualEffects.createDestructionEffect(x, y, COLORS.RED);
  }

  private onCollisionEnd(_event: Phaser.Physics.Matter.Events.CollisionEndEvent): void {
    // Handle collision end if needed for stability calculations
  }

  private spawnNextPart(): void {
    if (!this.gameState.isGameActive || this.isLevelCompleting) return;

    const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
    if (!currentLevel) return;

    // Smart spawning: determine available part levels based on current castle
    const availableLevels = getAvailablePartLevels(this.droppedParts);
    if (availableLevels.length === 0) return;

    // Randomly select a part level from available options
    const partLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];

    // Create new part with autonomous movement
    const partWidth = getPartWidth(partLevel);
    const partHeight = getPartHeight(partLevel);

    this.currentPart = new CastlePart(
      this,
      this.scale.width / 2,
      50,
      partWidth,
      partHeight,
      partLevel
    );

    // Initialize autonomous movement
    this.currentPart.initializeMovement(this.partSpeed, 0, this.scale.width);
  }

  private dropCurrentPart(): void {
    if (!this.currentPart || !this.gameState.isGameActive) return;

    // Drop the current part with enhanced audio feedback
    this.currentPart.drop(GAME_CONFIG.gravity);
    const droppedPart = this.currentPart;
    this.droppedParts.push(droppedPart);
    this.totalPartsDropped++;
    this.overallPartsPlaced++; // NEW: increment overall parts counter
    
    // Play drop sound immediately for responsive feedback
    this.audioManager.playSound('drop');
    
    this.currentPart = undefined;

    // New placement validation after parts have more time to settle
    this.time.delayedCall(2500, () => {
      // Safety check: ensure part still exists and is valid
      if (droppedPart && droppedPart.active && this.droppedParts.includes(droppedPart)) {
        this.validatePartPlacement(droppedPart);
      }
    });

    // Ground violation check still happens, but only for parts that weren't already destroyed
    this.time.delayedCall(2500, () => {
      // Only check if part still exists (wasn't destroyed by placement validation)
      if (droppedPart && droppedPart.active && this.droppedParts.includes(droppedPart)) {
        this.checkPartForGroundViolation(droppedPart);
      }
    });

    // Wait for part to settle and then check for stability and score
    this.time.delayedCall(3000, () => {
      // Safety check: ensure part still exists and is valid
      if (droppedPart && droppedPart.active && droppedPart.isPartDropped()) {
        // Calculate stability points
        const stabilityPoints = droppedPart.getStabilityPoints();
        this.gameState.score += stabilityPoints;

        // Only check for collapse if we have multiple parts and they've had time to settle
        if (this.droppedParts.length >= 2) {
          const allPartData = this.droppedParts.map(part => part.getPartData());
          if (this.stabilityManager.hasCollapsed(allPartData)) {
            this.handleCastleCollapse();
            return;
          }
        }

        this.updateUI();
      }
    });

    // Spawn next part after a short delay (level completion is now handled in validatePartPlacement)
    this.time.delayedCall(1000, () => {
      // Only spawn next part if level hasn't been completed and we're not in completion state
      if (!this.isLevelCompleting) {
        const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
        if (currentLevel && this.successfulPartsInstalled < currentLevel.targetParts) {
          this.spawnNextPart();
        }
      }
    });
  }

  /**
   * Validate if a dropped part has correct level placement
   */
  private validatePartPlacement(part: CastlePart): void {
    if (!part || !part.active || !part.isPartDropped()) return;
    if (!part.body || !part.body.position) return;

    // Get all other parts (excluding the one being validated) that are still valid
    const otherParts = this.droppedParts.filter(p => {
      return p !== part && p.body && p.body.position;
    });

    // Calculate timing bonus for quick placement
    const currentTime = Date.now();
    let timingBonus = 0;
    if (this.lastPlacementTime > 0) {
      const timeDiff = currentTime - this.lastPlacementTime;
      if (timeDiff < 3000) { // 3 seconds
        timingBonus = Math.floor(50 * (3000 - timeDiff) / 3000);
        this.perfectPlacements++;
      }
    }
    this.lastPlacementTime = currentTime;

    // Use autonomous part validation with scoring
    const result = part.validatePlacementWithScoring(otherParts, this.comboCount, timingBonus);

    if (result.valid) {
      // Correct placement
      this.comboCount++;
      this.maxCombo = Math.max(this.maxCombo, this.comboCount);
      this.gameState.score += result.scoreData.totalBonus;
      this.totalSuccessfulPlaced++;
      this.successfulPartsInstalled++;

      // Mark as valid and show effects
      part.setPlacementValid(true);
      part.showSuccessEffects(result.scoreData.totalBonus, result.scoreData.feedbackMessage, this.comboCount, timingBonus > 0);

      // Handle Level 6 castle clearing
      if (result.shouldTriggerCastleClear) {
        this.handleLevelSixPlacement(part);
      }

      // Check if level is complete immediately after successful placement
      const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
      
      if (currentLevel && this.successfulPartsInstalled >= currentLevel.targetParts) {
        // Level completed! Complete it immediately
        this.isLevelCompleting = true; // Prevent spawning new parts
        this.time.delayedCall(1000, () => {
          this.completeLevel();
        });
        return; // Exit early to prevent further processing
      }
    } else {
      // Wrong placement
      if (this.comboCount > 0) {
        this.showComboBreakFeedback(this.comboCount);
        this.comboCount = 0;
      }

      this.gameState.score = Math.max(0, this.gameState.score - SCORING_CONFIG.wrongPlacementPenalty);
      this.wrongPartsCurrentLevel++;

      // Let part handle its own destruction effects
      part.showDestructionEffects();

      // Remove part from array and destroy
      const partIndex = this.droppedParts.indexOf(part);
      if (partIndex > -1) {
        this.droppedParts.splice(partIndex, 1);
      }
      this.destroyPartWithEffect(part);
    }

    this.updateUI();
  }



  /**
   * Show combo break feedback
   */
  private showComboBreakFeedback(brokenCombo: number): void {
    if (brokenCombo < 2) return; // Only show for combos of 2+

    const comboBreakText = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      this.scale.height / 2 + 100,
      `Combo Broken! (${brokenCombo}x)`,
      {
        ...TEXT_CONFIGS.STATS_MEDIUM,
        maxWidth: 0.6,
        color: '#E74C3C',
        stroke: '#FFFFFF',
        strokeThickness: 2
      }
    );

    this.tweens.add({
      targets: comboBreakText,
      y: comboBreakText.y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        comboBreakText.destroy();
      }
    });
  }



  // Level 6 castle clearing - simplified using autonomous part methods
  private handleLevelSixPlacement(levelSixPart: CastlePart): void {
    // Safety check: ensure part still exists and is valid
    if (!levelSixPart || !levelSixPart.active) return;
    
    // Let the part determine what to remove
    const partsToRemove = levelSixPart.findCastlePartsToRemove(this.droppedParts);
    if (partsToRemove.length === 0) return;

    // Let the part create its own celebration
    levelSixPart.createCastleCelebration();

    // Award bonus and update counters
    const bonusPerPart = SCORING_CONFIG.baseScore * 10;
    const bonus = bonusPerPart * partsToRemove.length;
    this.gameState.score += bonus;
    this.rewardedCastleCount++;

    // Show celebration feedback
    this.showCastleCelebrationFeedback(bonus, partsToRemove.length, levelSixPart.x, levelSixPart.y);

    // Remove parts after celebration delay
    this.time.delayedCall(500, () => {
      partsToRemove.forEach(p => {
        // Safety check: ensure part still exists before destroying
        if (p && p.active) {
          const idx = this.droppedParts.indexOf(p);
          if (idx > -1) {
            this.droppedParts.splice(idx, 1);
          }
          this.destroyPartWithEffect(p);
        }
      });
    });

    this.updateUI();
  }



  /**
   * Show enhanced celebration feedback for castle completion
   */
  private showCastleCelebrationFeedback(bonus: number, partsCount: number, castleX?: number, castleY?: number): void {
    // Use castle position if provided, otherwise center screen (but slightly offset up for visibility)
    const x = castleX || this.scale.width / 2;
    const y = (castleY ? castleY - 100 : this.scale.height / 4);

    // Create celebration text
    const celebrationText = createCenteredResponsiveText(
      this,
      x,
      y,
      `🏰 CASTLE COMPLETE! 🏰\n${partsCount} parts cleared\n+${bonus} BONUS POINTS!`,
      {
        ...TEXT_CONFIGS.TITLE_MEDIUM,
        maxWidth: 0.8,
        color: '#FFD700', // Gold color for celebration
        stroke: '#2C3E50',
        strokeThickness: 4,
        fontStyle: 'bold'
      }
    );

    // Enhanced animation with multiple stages
    this.visualEffects.createBounceAnimation(celebrationText, 0);
    
    this.tweens.add({
      targets: celebrationText,
      y: y - 50,
      alpha: 0,
      duration: 3000,
      ease: 'Power2.easeOut',
      onComplete: () => {
        celebrationText.destroy();
      }
    });
  }





  private handleCastleCollapse(): void {
    this.gameState.isGameActive = false;

    // Play collapse sound
    this.audioManager.playSound('collapse');

    // Show collapse message
    const collapseText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      tSync('Castle Collapsed!') + '\n' + tSync('Try Again'),
      {
        fontSize: '28px',
        color: '#E74C3C',
        fontFamily: 'Arial',
        align: 'center'
      }
    );
    collapseText.setOrigin(0.5);

    // Restart level after delay
    this.time.delayedCall(3000, () => {
      this.restartLevel();
    });
  }

  private restartLevel(): void {
    // Clear dropped parts (with safety check)
    this.droppedParts.forEach(part => {
      if (part && part.active) {
        part.destroy();
      }
    });
    this.droppedParts = [];

    // Reset game state
    this.gameState.isGameActive = true;
    this.gameState.lives--;
    this.gameState.isFirstPart = true; // Reset first part flag

    // Clear ground violations and reset counters
    this.groundViolations = [];
    this.totalPartsDropped = 0;
    this.successfulPartsInstalled = 0;
    this.wrongPartsCurrentLevel = 0;
    // totalSuccessfulPlaced and rewardedCastleCount persist across levels
    
    // Reset combo when restarting level
    this.comboCount = 0;

    if (this.gameState.lives <= 0) {
      this.gameOver();
    } else {
      this.spawnNextPart();
      this.updateUI();
    }
  }

  private gameOver(): void {
    this.gameState.isGameActive = false;

    // Save high score
    this.saveHighScore();

    // Use BaseScene transition helper
    this.transitionToScene('GameOverScene', {
      score: this.gameState.score,
      level: this.gameState.currentLevel,
      isVictory: false,
      castlesBuilt: this.rewardedCastleCount,
      perfectDrops: 0 // Can be enhanced later to track perfect drops
    });
  }

  private completeLevel(): void {
    // Play level complete sound
    this.audioManager.playSound('level-complete');

    // Award bonus for completing the level
    const levelBonus = 100;
    this.gameState.score += levelBonus;

    // Save high score
    this.saveHighScore();

    // Show level complete scene for every level
    this.showLevelCompleteScreen();
  }

  private showLevelCompleteScreen(): void {
    this.gameState.isGameActive = false;

    // Use BaseScene transition helper
    this.transitionToScene('LevelCompleteScene', {
      level: this.gameState.currentLevel,
      score: 100, // Level completion bonus
      partsPlaced: this.successfulPartsInstalled,
      perfectDrops: 0, // Can be enhanced later to track perfect drops
      totalScore: this.gameState.score
    });
  }

  private updateUI(): void {
    // Animate UI updates for better visual feedback
    if (this.levelText) {
      this.levelText.setText(tSync('Level {{level}}', { level: this.gameState.currentLevel }));
    }
    
    if (this.scoreText) {
      const oldText = this.scoreText.text;
      const newText = tSync('Score: {{score}}', { score: this.gameState.score });
      
      if (oldText !== newText) {
        this.scoreText.setText(newText);
        this.animateStatUpdate(this.scoreText);
      }
    }
    
    if (this.targetText) {
      const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
      const partsLeft = currentLevel ? Math.max(0, currentLevel.targetParts - this.successfulPartsInstalled) : 0;
      const newText = tSync('Target: {{target}} parts', { target: partsLeft });
      

      
      if (this.targetText.text !== newText) {
        this.targetText.setText(newText);
        this.animateStatUpdate(this.targetText);
      }
      
      // When partsLeft reaches 0, level completion is handled immediately in validatePartPlacement()
    }

    // Update stats texts with subtle animations
    if (this.totalSuccessText) {
      const newText = tSync('Total Installed: {{count}}', { count: this.totalSuccessfulPlaced });
      if (this.totalSuccessText.text !== newText) {
        this.totalSuccessText.setText(newText);
        this.animateStatUpdate(this.totalSuccessText);
      }
    }
    
    if (this.rewardCountText) {
      const newText = tSync('Castles Rewarded: {{count}}', { count: this.rewardedCastleCount });
      if (this.rewardCountText.text !== newText) {
        this.rewardCountText.setText(newText);
        this.animateStatUpdate(this.rewardCountText); // Scale animation only
      }
    }
    
    if (this.wrongLevelText) {
      const newText = tSync('Wrong Parts: {{count}}', { count: this.wrongPartsCurrentLevel });
      if (this.wrongLevelText.text !== newText) {
        this.wrongLevelText.setText(newText);
        this.animateStatUpdate(this.wrongLevelText); // Scale animation only
      }
    }

    // Update combo counter with dynamic styling
    if (this.comboText) {
      const newText = tSync('Combo: {{count}}x', { count: this.comboCount });
      if (this.comboText.text !== newText) {
        this.comboText.setText(newText);
        
        // Simple scale animation for combo updates - no color changes
        this.animateStatUpdate(this.comboText);
             }
     }

         // Update progress bar
    this.updateProgressBar();

    // Update instructions based on current level
    this.updateInstructions();
  }

   /**
   * Create level progress bar indicator
   */
  private createProgressBar(): void {
    const barWidth = this.scale.width * 0.7;
    const barHeight = 8;
    const barX = this.scale.width / 2 - barWidth / 2;
    const barY = calculateDynamicSpacing(this, 100); // Move much lower to avoid overlap with stats

    // Background bar
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x2C3E50, 0.8);
    this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    this.progressBarBg.lineStyle(2, 0xFFFFFF, 0.8);
    this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 4);

    // Progress fill
    this.progressBar = this.add.graphics();

    // // Progress label
    // createCenteredResponsiveText(
    //   this,
    //   this.scale.width / 2,
    //   barY - 25, // Slightly more space above the bar
    //   'Level Progress',
    //   {
    //     ...TEXT_CONFIGS.STATS_SMALL,
    //     color: '#FFFFFF',
    //     stroke: '#2C3E50',
    //     strokeThickness: 1
    //   }
    // );

    this.updateProgressBar();
  }

  /**
   * Update progress bar based on current level completion
   */
  private updateProgressBar(): void {
    if (!this.progressBar || !this.progressBarBg) return;

    const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
    if (!currentLevel) return;

    const progress = Math.min(this.successfulPartsInstalled / currentLevel.targetParts, 1);
    const barWidth = this.scale.width * 0.7;
    const barHeight = 8;
    const barX = this.scale.width / 2 - barWidth / 2;
    const barY = calculateDynamicSpacing(this, 100); // Match the positioning from createProgressBar

    this.progressBar.clear();
    
    // Color changes based on progress
    let fillColor: number = COLORS.RED;
    if (progress >= 0.8) {
      fillColor = COLORS.GREEN;
    } else if (progress >= 0.5) {
      fillColor = COLORS.YELLOW;
    } else if (progress >= 0.3) {
      fillColor = COLORS.YELLOW;
    }

    this.progressBar.fillStyle(fillColor);
    this.progressBar.fillRoundedRect(barX, barY, barWidth * progress, barHeight, 4);

    // Add glow effect for near-completion
    if (progress >= 0.8) {
      this.progressBar.lineStyle(2, fillColor, 0.6);
      this.progressBar.strokeRoundedRect(barX - 2, barY - 2, barWidth * progress + 4, barHeight + 4, 6);
    }
  }

  /**
   * Animate stat text updates with scale pulse
   */
  private animateStatUpdate(textObject: Phaser.GameObjects.Text): void {
    // Simplified animation - just scale pulse, no color tinting that might create overlay effects
    this.tweens.add({
      targets: textObject,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Power2.easeInOut'
    });
  }

  /**
   * Create dynamic instructions text based on current level
   */
  private createDynamicInstructions(): Phaser.GameObjects.Text {
    // Base instruction that's always shown
    let instructionText = tSync('Tap to drop parts!');
    
    // Add level description if available
    const currentLevel = LEVELS[this.currentLevelIndex];
    if (currentLevel && currentLevel.description) {
      instructionText += '\n' + tSync(currentLevel.description);
    }
    
    const text = createCenteredResponsiveText(
      this,
      this.scale.width / 2,
      this.scale.height / 1.5,
      instructionText,
      {
        ...TEXT_CONFIGS.STATS_MEDIUM,
        maxWidth: 0.85,
        color: '#34495E',
        stroke: '#FFFFFF',
        strokeThickness: 3,
        align: 'center'
      }
    );
    
    return text;
  }

  /**
   * Update instructions text when level changes
   */
  private updateInstructions(): void {
    if (!this.instructionText) return;
    
    // Base instruction that's always shown
    let instructionText = tSync('Tap to drop parts!');
    
    // Add level description if available
    const currentLevel = LEVELS[this.currentLevelIndex];
    if (currentLevel && currentLevel.description) {
      instructionText += '\n' + tSync(currentLevel.description);
    }
    
    this.instructionText.setText(instructionText);
  }

  update(_time: number, delta: number): void {
    // Re-enable input after a delay when resuming from pause
    if (!this.input.enabled && this.gameState.isGameActive) {
      this.time.delayedCall(1000, () => {
        this.input.enabled = true;
      });
    }

    // Let current part handle its own movement
    if (this.currentPart && this.currentPart.active && this.gameState.isGameActive) {
      this.currentPart.updateMovement(delta / 1000);
    }

    // Let dropped parts handle their own stability checking
    this.droppedParts.forEach((part) => {
      if (part && part.active && part.body) {
        part.checkStability();
      }
    });
  }

  private updateTexts(): void {
    // Update dynamic instructions with level description
    this.updateInstructions();

    // Update other translatable text elements
    this.updateUI();
  }

  /**
   * Override base class method to save game-specific state
   */
  protected saveGameState(): void {
    // Filter out destroyed parts before saving
    const validDroppedParts = this.droppedParts.filter(part => part && part.active);
    
    const state: Omit<PhaserGameState, 'timestamp'> & any = {
      currentScene: 'GameScene',
      sceneStack: [], // Will be populated by PhaserStateManager
      activeScenes: [], // Will be populated by PhaserStateManager
      gameState: { ...this.gameState },
      currentLevelIndex: this.currentLevelIndex,
      droppedParts: validDroppedParts.map(part => part.getPartData()),
      groundViolations: this.groundViolations,
      totalPartsDropped: this.totalPartsDropped,
      overallPartsPlaced: this.overallPartsPlaced,
      successfulPartsInstalled: this.successfulPartsInstalled,
      wrongPartsCurrentLevel: this.wrongPartsCurrentLevel,
      totalSuccessfulPlaced: this.totalSuccessfulPlaced,
      rewardedCastleCount: this.rewardedCastleCount,
      partSpeed: this.partSpeed,
      // Enhanced scoring system
      comboCount: this.comboCount,
      maxCombo: this.maxCombo,
      perfectPlacements: this.perfectPlacements,
      lastPlacementTime: this.lastPlacementTime
    };

    phaserStateManager.saveGameState(this.game, state);
  }

  /**
   * Override base class method to provide game-specific restore data
   */
  protected getSceneDataForRestore(): any {
    return {
      gameState: this.gameState,
      currentLevelIndex: this.currentLevelIndex,
      totalPartsDropped: this.totalPartsDropped,
      overallPartsPlaced: this.overallPartsPlaced,
      successfulPartsInstalled: this.successfulPartsInstalled,
      wrongPartsCurrentLevel: this.wrongPartsCurrentLevel,
      totalSuccessfulPlaced: this.totalSuccessfulPlaced,
      rewardedCastleCount: this.rewardedCastleCount,
      partSpeed: this.partSpeed,
      // Enhanced scoring system
      comboCount: this.comboCount,
      maxCombo: this.maxCombo,
      perfectPlacements: this.perfectPlacements,
      lastPlacementTime: this.lastPlacementTime,
      // Add any other game-specific data that should survive page reload
    };
  }

  /**
   * Override base class method to restore game-specific data
   */
  protected restoreSceneData(data: any): void {
    if (data.gameState) {
      this.gameState = data.gameState;
    }
    if (data.currentLevelIndex !== undefined) {
      this.currentLevelIndex = data.currentLevelIndex;
    }
    if (data.totalPartsDropped !== undefined) {
      this.totalPartsDropped = data.totalPartsDropped;
    }
    if (data.overallPartsPlaced !== undefined) {
      this.overallPartsPlaced = data.overallPartsPlaced;
    }
    if (data.successfulPartsInstalled !== undefined) {
      this.successfulPartsInstalled = data.successfulPartsInstalled;
    }
    if (data.wrongPartsCurrentLevel !== undefined) {
      this.wrongPartsCurrentLevel = data.wrongPartsCurrentLevel;
    }
    if (data.totalSuccessfulPlaced !== undefined) {
      this.totalSuccessfulPlaced = data.totalSuccessfulPlaced;
    }
    if (data.rewardedCastleCount !== undefined) {
      this.rewardedCastleCount = data.rewardedCastleCount;
    }
    if (data.partSpeed !== undefined) {
      this.partSpeed = data.partSpeed;
    }
    
    // Restore enhanced scoring system
    if (data.comboCount !== undefined) {
      this.comboCount = data.comboCount;
    }
    if (data.maxCombo !== undefined) {
      this.maxCombo = data.maxCombo;
    }
    if (data.perfectPlacements !== undefined) {
      this.perfectPlacements = data.perfectPlacements;
    }
    if (data.lastPlacementTime !== undefined) {
      this.lastPlacementTime = data.lastPlacementTime;
    }
    
    console.log(`[GameScene] Restored game state:`, { 
      level: this.gameState.currentLevel, 
      score: this.gameState.score,
      combo: this.comboCount,
      maxCombo: this.maxCombo
    });
  }

  private saveHighScore(): void {
    try {
      const currentHighScore = parseInt(localStorage.getItem('sand-castle-high-score') || '0');
      if (this.gameState.score > currentHighScore) {
        localStorage.setItem('sand-castle-high-score', this.gameState.score.toString());
      }
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }

  protected customShutdown(): void {
    // Clean up any game-specific resources
    this.cleanupGameObjects();
  }
} 