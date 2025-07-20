import { Scene } from 'phaser';
import { CastlePart } from '@/objects/CastlePart';
import { GAME_CONFIG, LEVELS, COLORS, PHYSICS_CONFIG, SCORING_CONFIG, generateLevel } from '@/config/gameConfig';
import { GameState, GroundViolation } from '@/types/Game';
import { StabilityManager } from '@/objects/StabilityManager';
import { EnhancedAudioManager } from '@/utils/EnhancedAudioManager';
import { VisualEffects } from '@/utils/VisualEffects';
import { getAvailablePartLevels, getPartWidth, getPartHeight } from '@/utils/PartUtils';
import { tSync, initI18n, onLanguageChange, offLanguageChange } from '@/i18n';
import { supportsVibration } from '@/utils/DeviceUtils';
import { phaserStateManager, PhaserGameState } from '@/utils/PhaserStateManager';

export class GameScene extends Scene {
  private currentPart?: CastlePart;
  private droppedParts: CastlePart[] = [];
  private gameState: GameState;
  private partSpeed: number = GAME_CONFIG.partSpeed;
  private direction: number = 1; // 1 for right, -1 for left
  private levelText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private instructionText?: Phaser.GameObjects.Text;
  private penaltyText?: Phaser.GameObjects.Text;
  private currentLevelIndex: number = 0;
  private stabilityManager: StabilityManager;
  private audioManager: EnhancedAudioManager;
  private visualEffects: VisualEffects;
  private groundViolations: GroundViolation[] = [];
  private totalPartsDropped: number = 0; // Track total parts dropped including destroyed ones
  private groundSprite?: Phaser.GameObjects.Rectangle; // Reference to ground sprite for collision detection
  private overallPartsPlaced: number = 0; // NEW: track total parts placed across entire run
  private successfulPartsInstalled: number = 0; // NEW: count of valid placements in current level
  private wrongPartsCurrentLevel: number = 0; // NEW: wrong placements in current level
  private totalSuccessfulPlaced: number = 0; // NEW: cumulative successful placements across game
  private rewardedCastleCount: number = 0; // NEW: total rewards triggered by level-6 clears

  // UI text objects for new stats
  private totalSuccessText?: Phaser.GameObjects.Text;
  private rewardCountText?: Phaser.GameObjects.Text;
  private wrongLevelText?: Phaser.GameObjects.Text;
  private languageChangeHandler?: (lang: any) => void;


  constructor() {
    super({ key: 'GameScene' });
    this.stabilityManager = new StabilityManager();
    this.audioManager = EnhancedAudioManager.getInstance();
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

  init(data?: any): void {
    // Handle scene restoration from saved state
    if (data?.restoreFromState) {
      // Restoring GameScene from saved state
      const savedState = phaserStateManager.loadGameState(this.game);
      if (savedState) {
        this.restoreGameState(savedState);
        
        // Note: With the new approach, GameScene and LevelCompleteScene are never active simultaneously
        
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
      this.direction = 1;
      this.groundViolations = [];
      this.totalPartsDropped = 0;
      this.overallPartsPlaced = 0;
      this.successfulPartsInstalled = 0;
      this.wrongPartsCurrentLevel = 0;
      this.totalSuccessfulPlaced = 0;
      this.rewardedCastleCount = 0;
    }
  }

  async create(): Promise<void> {
    // GameScene create() called
    // Initialize i18n system
    await initI18n();

    // Subscribe to language changes to update UI
    this.languageChangeHandler = () => {
      // Only update if scene is active to avoid calling on destroyed objects
      if (this.scene.isActive()) {
        this.updateTexts();
      }
    };
    onLanguageChange(this.languageChangeHandler);

    // Load audio
    this.audioManager.loadBasicSounds();

    // Setup physics first with proper configuration
    this.setupPhysics();

    this.createBackground();
    this.createUI();
    this.setupInput();
    this.setupMobileOptimizations();
    this.updateUI(); // Ensure UI reflects current game state
    
    // Enable auto-save for development persistence
    this.enableAutoSave();
    
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
    // Restoring game state

    // Restore core game state
    this.gameState = savedState.gameState;
    
    // Ensure game is active when restoring (user wants to continue playing)
    this.gameState.isGameActive = true;
    // Set game to active for restoration
    
    this.currentLevelIndex = savedState.currentLevelIndex;
    this.partSpeed = savedState.partSpeed;
    this.direction = savedState.direction;
    
    // Restore statistics
    this.totalPartsDropped = savedState.totalPartsDropped;
    this.overallPartsPlaced = savedState.overallPartsPlaced;
    this.successfulPartsInstalled = savedState.successfulPartsInstalled;
    this.wrongPartsCurrentLevel = savedState.wrongPartsCurrentLevel;
    this.totalSuccessfulPlaced = savedState.totalSuccessfulPlaced;
    this.rewardedCastleCount = savedState.rewardedCastleCount;
    
    // Restore ground violations
    this.groundViolations = savedState.groundViolations;

    // Restore dropped parts (will be recreated in create method)
    this.gameState.droppedParts = savedState.droppedParts;
    
    // Game state restored successfully
  }

  /**
   * Recreate dropped parts from saved state
   */
  private recreateDroppedParts(): void {
    if (this.gameState.droppedParts.length === 0) {
      return;
    }

    // Recreating dropped parts from saved state
    
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
    
    // Recreated dropped parts
  }

  /**
   * Enable automatic saving of game state
   */
  private enableAutoSave(): void {
    // Save every 5 seconds using Phaser's timer
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.saveCurrentState();
      },
      loop: true
    });
    
    // Also save on important game events
    this.events.on('partDropped', () => {
      this.saveCurrentState();
    });
    
    this.events.on('levelComplete', () => {
      this.saveCurrentState();
    });
    
    this.events.on('gameOver', () => {
      this.saveCurrentState();
    });
  }

  /**
   * Save current state using Phaser's registry
   */
  private saveCurrentState(): void {
    const state: Omit<PhaserGameState, 'timestamp'> = {
      currentScene: 'GameScene',
      sceneStack: [], // Will be populated by PhaserStateManager
      activeScenes: [], // Will be populated by PhaserStateManager
      gameState: { ...this.gameState },
      currentLevelIndex: this.currentLevelIndex,
      droppedParts: this.droppedParts.map(part => part.getPartData()),
      groundViolations: this.groundViolations,
      totalPartsDropped: this.totalPartsDropped,
      overallPartsPlaced: this.overallPartsPlaced,
      successfulPartsInstalled: this.successfulPartsInstalled,
      wrongPartsCurrentLevel: this.wrongPartsCurrentLevel,
      totalSuccessfulPlaced: this.totalSuccessfulPlaced,
      rewardedCastleCount: this.rewardedCastleCount,
      partSpeed: this.partSpeed,
      direction: this.direction
    };

    phaserStateManager.saveGameState(this.game, state);
  }

  shutdown(): void {
    // Save state before shutting down
    this.saveCurrentState();
    
    // Unsubscribe language change listener
    if (this.languageChangeHandler) {
      offLanguageChange(this.languageChangeHandler);
      this.languageChangeHandler = undefined;
    }
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
    // Cleaning up existing game objects and physics bodies
    
    // Clean up current part
    if (this.currentPart) {
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
    
    // Game objects cleanup completed
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
    // Kid-friendly UI styling
    const primaryTextStyle = {
      fontSize: '28px',
      color: '#2C3E50',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    };

    const secondaryTextStyle = {
      fontSize: '22px',
      color: '#2C3E50',
      fontFamily: 'Arial, sans-serif',
      stroke: '#FFFFFF',
      strokeThickness: 1
    };

    const statsTextStyle = {
      fontSize: '18px',
      color: '#7F8C8D',
      fontFamily: 'Arial, sans-serif'
    };

    // Level indicator - larger and more prominent
    this.levelText = this.add.text(20, 20, tSync('Level {{level}}', { level: this.gameState.currentLevel }), primaryTextStyle);

    // Score display - colorful and kid-friendly
    this.scoreText = this.add.text(20, 60, tSync('Score: {{score}}', { score: this.gameState.score }), secondaryTextStyle);

    // Parts Left display (remaining parts to complete current level)
    const initialLevel = LEVELS[this.currentLevelIndex];
    const initialPartsLeft = initialLevel ? initialLevel.targetParts : 0;

    this.livesText = this.add.text(20, 100, tSync('Target: {{target}} parts', { target: initialPartsLeft }), {
      ...secondaryTextStyle,
      color: '#E67E22' // Orange color for target
    });

    // Statistics display (smaller and less prominent)
    this.totalSuccessText = this.add.text(20, 180, `Total Installed: 0`, statsTextStyle);
    this.rewardCountText = this.add.text(20, 210, `Castles Rewarded: 0`, statsTextStyle);
    this.wrongLevelText = this.add.text(20, 240, `Wrong Parts: 0`, statsTextStyle);

    // Instructions - subtle and encouraging
    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height - 100,
      tSync('Tap to drop parts!') + '\n' + 
      tSync('Level 1 on ground, higher levels on top') + '\n' +
      tSync('Level 6 parts create castles for bonus!'),
      {
        fontSize: '16px',
        color: '#34495E',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        backgroundColor: '#F8F9FA',
        padding: { x: 10, y: 8 },
        stroke: '#BDC3C7',
        strokeThickness: 1
      }
    );
    this.instructionText.setOrigin(0.5);

    // Add a pause button in top-right corner
    this.createPauseButton();
  }

  private createPauseButton(): void {
    const pauseButton = this.add.container(this.scale.width - 60, 40);

    // Button background
    const bg = this.add.circle(0, 0, 25, 0x3498DB);
    bg.setStrokeStyle(3, 0xFFFFFF);

    // Pause icon (two vertical rectangles)
    const pauseIcon1 = this.add.rectangle(-6, 0, 4, 20, 0xFFFFFF);
    const pauseIcon2 = this.add.rectangle(6, 0, 4, 20, 0xFFFFFF);

    pauseButton.add([bg, pauseIcon1, pauseIcon2]);
    pauseButton.setSize(50, 50);
    pauseButton.setInteractive();

    // Pause functionality
    pauseButton.on('pointerdown', () => {
      // Pause button clicked - pausing GameScene and launching MenuScene
      // Pause and hide the GameScene
      this.scene.pause();
      this.input.enabled = false; // Disable input when pausing
      this.cameras.main.setVisible(false);
              // GameScene paused, launching MenuScene with isPaused: true
      this.scene.launch('MenuScene', { isPaused: true }); // Pass pause context to MenuScene
    });

    // Hover effects
    pauseButton.on('pointerover', () => {
      pauseButton.setScale(1.1);
    });

    pauseButton.on('pointerout', () => {
      pauseButton.setScale(1);
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
        // Play soft collision sound for part-to-part or part-to-ground contact
        this.audioManager.playSound('drop');

        // Handle ground collision if detected
        if (isGroundCollision) {
          const castlePart = bodyA instanceof CastlePart ? bodyA : bodyB;
          if (castlePart) {
            this.handleGroundCollision(castlePart);
          }
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

  private showPenaltyFeedback(penalty: number, message: string = "Part touched ground!"): void {
    // Create penalty text
    if (this.penaltyText) {
      this.penaltyText.destroy();
    }

    this.penaltyText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 - 50,
      `PENALTY: -${penalty} points\n${message}`,
      {
        fontSize: '24px',
        color: '#E74C3C',
        fontFamily: 'Arial',
        align: 'center',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    );
    this.penaltyText.setOrigin(0.5);

    // Animate penalty text
    this.tweens.add({
      targets: this.penaltyText,
      y: this.penaltyText.y - 30,
      alpha: 0,
      duration: 2000,
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
    // Create destruction particles
    this.createDestructionParticles(part.x, part.y);

    // Shake effect
    this.cameras.main.shake(200, 0.01);

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
    // spawnNextPart called
    if (!this.gameState.isGameActive) {
              // Cannot spawn part - game is not active
      return;
    }

    const currentLevel = LEVELS[this.currentLevelIndex] || generateLevel(this.currentLevelIndex + 1);
    // spawnNextPart - currentLevel
    if (!currentLevel) {
              // Cannot spawn part - no level data
      return;
    }

    // Smart spawning: determine available part levels based on current castle (now via PartUtils)
    const availableLevels = getAvailablePartLevels(this.droppedParts);
    // Available part levels

    if (availableLevels.length === 0) {
              // Cannot spawn part - no available part levels
      return;
    }

    // Randomly select a part level from available options
    const partLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];
    // Selected part level

    // Create new part at top of screen
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

    // Part spawned successfully

    // Reset movement direction randomly
    this.direction = Math.random() > 0.5 ? 1 : -1;
  }

  // NOTE: `getAvailablePartLevels` has been extracted to PartUtils.

  // NOTE: `getCastleState` has been extracted to PartUtils.

  // NOTE: `getPartWidth` moved to PartUtils.

  // NOTE: `getPartHeight` moved to PartUtils.

  private dropCurrentPart(): void {
    if (!this.currentPart || !this.gameState.isGameActive) return;

    // Drop the current part
    this.currentPart.drop(GAME_CONFIG.gravity);
    const droppedPart = this.currentPart;
    this.droppedParts.push(droppedPart);
    this.totalPartsDropped++;
    this.overallPartsPlaced++; // NEW: increment overall parts counter
    this.currentPart = undefined;

    // New placement validation after parts have more time to settle
    this.time.delayedCall(2500, () => {
      this.validatePartPlacement(droppedPart);
    });

    // Ground violation check still happens, but only for parts that weren't already destroyed
    this.time.delayedCall(2500, () => {
      // Only check if part still exists (wasn't destroyed by placement validation)
      if (this.droppedParts.includes(droppedPart)) {
        this.checkPartForGroundViolation(droppedPart);
      }
    });

    // Check if level is complete after this drop
    const currentLevel = LEVELS[this.currentLevelIndex];
    // Finish level when enough successful installations done, independent of reward clears
    if (currentLevel && this.successfulPartsInstalled >= currentLevel.targetParts) {
      // Wait longer for parts to fully settle before completing level
      this.time.delayedCall(3000, () => {
        if (droppedPart.isPartDropped()) {
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

          // Complete the level
          this.completeLevel();
        }
      });
    } else {
      // Continue with current level - spawn next part

      // Wait longer for part to settle and then check for stability and score
      this.time.delayedCall(3000, () => {
        if (droppedPart.isPartDropped()) {
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

      // Spawn next part after a short delay
      this.time.delayedCall(1000, () => {
        this.spawnNextPart();
      });
    }
  }

  /**
   * Validate if a dropped part has correct level placement
   */
  private validatePartPlacement(part: CastlePart): void {
    if (!part || !part.isPartDropped()) return;

    // Safety check: ensure part still has valid physics body
    if (!part.body || !part.body.position) {
      return;
    }

    // Get all other parts (excluding the one being validated) that are still valid
    const otherParts = this.droppedParts.filter(p => {
      return p !== part && p.body && p.body.position; // Only include parts with valid physics
    });



    // Validate placement
    const placementResult = part.validatePlacement(otherParts);

    if (!placementResult.valid) {
      // Wrong placement - destroy part and apply penalty
      this.handleWrongPlacement(part, placementResult);
    } else {
      // Correct placement - mark as valid and give bonus
      part.setPlacementValid(true);
      this.handleCorrectPlacement(part, placementResult);
    }
  }

  /**
   * Handle wrong part placement
   */
  private handleWrongPlacement(part: CastlePart, _placementResult: any): void {
    // Record wrong placement event (for future analytics)
    // const wrongPlacement: WrongPlacementEvent = {
    //   partId: part.getPartData().id,
    //   partLevel: part.getPartLevel(),
    //   attemptedTargetLevel: placementResult.targetLevel,
    //   penaltyApplied: SCORING_CONFIG.wrongPlacementPenalty,
    //   timestamp: Date.now()
    // };

    // Apply score penalty
    this.gameState.score = Math.max(0, this.gameState.score - SCORING_CONFIG.wrongPlacementPenalty);

    // Show penalty feedback
    this.showPenaltyFeedback(SCORING_CONFIG.wrongPlacementPenalty, "Wrong Level!");

    // Play penalty sound
    this.audioManager.playSound('collapse');

    // Remove part from dropped parts array
    const partIndex = this.droppedParts.indexOf(part);
    if (partIndex > -1) {
      this.droppedParts.splice(partIndex, 1);
    }

    // Destroy the part with effect
    this.destroyPartWithEffect(part);

    // Update UI
    this.updateUI();

    // NEW: increment wrong parts counter for current level
    this.wrongPartsCurrentLevel++;
  }

  /**
   * Handle correct part placement
   */
  private handleCorrectPlacement(part: CastlePart, _placementResult: any): void {
    // Give placement bonus
    const placementBonus = SCORING_CONFIG.placementBonus;

    // Give level multiplier bonus (higher levels worth more points)
    const levelMultiplier = part.getPartLevel() * SCORING_CONFIG.levelMultiplier;
    const levelBonus = SCORING_CONFIG.baseScore * levelMultiplier;

    // Calculate total bonus
    const totalBonus = placementBonus + levelBonus;
    this.gameState.score += totalBonus;

    // Show positive feedback
    this.showSuccessFeedback(totalBonus, `Level ${part.getPartLevel()}!`);

    // Play success sound
    this.audioManager.playSound('place-good');

    // Update counters
    this.totalSuccessfulPlaced++;
    this.successfulPartsInstalled++;

    // NEW: special behaviour for level 6 parts
    if (part.getPartLevel() === 6) {
      this.handleLevelSixPlacement(part);
    }

    // Update UI at end (to reflect new counters)
    this.updateUI();
  }

  // NEW: remove all parts situated under a correctly placed level-6 part and award bonus points
  private handleLevelSixPlacement(levelSixPart: CastlePart): void {
    // Identify parts that are physically below the level-6 part and horizontally overlapping
    const partsToRemove = this.droppedParts.filter(p => {
      const horizontallyAligned = Math.abs(p.x - levelSixPart.x) < (p.width + levelSixPart.width) / 2;
      const belowOrSame = p.y >= levelSixPart.y; // include same Y to capture the level-6 part itself later
      return horizontallyAligned && belowOrSame;
    });

    // Ensure the level-6 part itself is included (in case numeric comparisons excluded it)
    if (!partsToRemove.includes(levelSixPart)) {
      partsToRemove.push(levelSixPart);
    }

    if (partsToRemove.length === 0) return;

    // Award bonus – generous reward to celebrate clearing (includes the level-6 part itself)
    const bonusPerPart = SCORING_CONFIG.baseScore * 10;
    const bonus = bonusPerPart * partsToRemove.length;
    this.gameState.score += bonus;
    this.showSuccessFeedback(bonus, `Level 6 Clear!`);

    // Increase rewarded castle count
    this.rewardedCastleCount++;

    // Remove the parts with visual effect
    partsToRemove.forEach(p => {
      const idx = this.droppedParts.indexOf(p);
      if (idx > -1) {
        this.droppedParts.splice(idx, 1);
      }
      this.destroyPartWithEffect(p);
    });

    // Update UI to reflect new parts left / score
    this.updateUI();
  }

  /**
   * Show success feedback to player
   */
  private showSuccessFeedback(bonus: number, message: string): void {
    const successText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 3,
      `${message}\n+${bonus} points`,
      {
        fontSize: '20px',
        color: '#00FF00',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    successText.setOrigin(0.5);

    // Animate success text
    this.tweens.add({
      targets: successText,
      y: successText.y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        successText.destroy();
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
      'Castle Collapsed!\nTry Again',
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
    // Clear dropped parts
    this.droppedParts.forEach(part => part.destroy());
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

    // Transition to GameOverScene with game data
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOverScene', {
        score: this.gameState.score,
        level: this.gameState.currentLevel,
        isVictory: false,
        castlesBuilt: this.rewardedCastleCount,
        perfectDrops: 0 // Can be enhanced later to track perfect drops
      });
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

    // Stop this scene and start LevelCompleteScene (cleaner approach)
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Stop GameScene before starting LevelCompleteScene to prevent background execution
      this.scene.stop();
      this.scene.start('LevelCompleteScene', {
        level: this.gameState.currentLevel,
        score: 100, // Level completion bonus
        partsPlaced: this.successfulPartsInstalled,
        perfectDrops: 0, // Can be enhanced later to track perfect drops
        totalScore: this.gameState.score
      });
    });
  }



  private updateUI(): void {
    if (this.levelText) {
      this.levelText.setText(tSync('Level {{level}}', { level: this.gameState.currentLevel }));
    }
    if (this.scoreText) {
      this.scoreText.setText(tSync('Score: {{score}}', { score: this.gameState.score }));
    }
    if (this.livesText) {
      const currentLevel = LEVELS[this.currentLevelIndex];
      const partsLeft = currentLevel ? Math.max(0, currentLevel.targetParts - this.successfulPartsInstalled) : 0;
      this.livesText.setText(tSync('Target: {{target}} parts', { target: partsLeft }));
    }

    // Update stats texts
    if (this.totalSuccessText) {
      this.totalSuccessText.setText(`Total Installed: ${this.totalSuccessfulPlaced}`);
    }
    if (this.rewardCountText) {
      this.rewardCountText.setText(`Castles Rewarded: ${this.rewardedCastleCount}`);
    }
    if (this.wrongLevelText) {
      this.wrongLevelText.setText(`Wrong Parts: ${this.wrongPartsCurrentLevel}`);
    }
  }

  update(_time: number, delta: number): void {
    // Re-enable input after a delay when resuming from pause
    if (!this.input.enabled && this.gameState.isGameActive) {
      this.time.delayedCall(1000, () => {
        this.input.enabled = true;
      });
    }

    // Move current part horizontally
    if (this.currentPart && this.currentPart.active && this.gameState.isGameActive) {
      this.currentPart.moveHorizontally(this.direction * this.partSpeed, delta / 1000);

      // Reverse direction at screen edges
      if (this.currentPart.x <= this.currentPart.width / 2 ||
          this.currentPart.x >= this.scale.width - this.currentPart.width / 2) {
        this.direction *= -1;
      }
    } else {
      // Debug logging for why part is not moving
      if (!this.currentPart) {
        // No current part to move
      } else if (!this.currentPart.active) {
        // Current part is not active
      } else if (!this.gameState.isGameActive) {
        // Game is not active
      }
    }

    // Check stability of dropped parts (ground violations now handled by collision detection)
    this.droppedParts.forEach((part) => {
      if (part && part.active && part.body) {
        part.checkStability();
      }
    });
  }

  private setupMobileOptimizations(): void {
    // Add haptic feedback for mobile devices
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

    // Prevent default touch behaviors that might interfere with game
    this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.preventDefault();
    });

    // Add touch-friendly feedback
    this.input.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
    });

    this.input.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });
  }

  private updateTexts(): void {
    // Update all UI text elements when language changes
    if (this.instructionText) {
      this.instructionText.setText(
        tSync('Tap to drop parts!') + '\n' + 
        tSync('Level 1 on ground, higher levels on top') + '\n' +
        tSync('Level 6 parts create castles for bonus!')
      );
    }

    // Update other text elements
    this.updateUI();
  }

  private refreshLayout(): void {
    // Refresh layout for orientation changes
    // This helps ensure the game remains playable across different orientations
    const newWidth = this.scale.width;
    const newHeight = this.scale.height;

    // Update instruction text position
    if (this.instructionText) {
      this.instructionText.setPosition(newWidth / 2, newHeight - 100);
    }

    // Update UI positions if needed
    // Other UI elements are positioned relative to screen edges so they should adapt automatically
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
} 