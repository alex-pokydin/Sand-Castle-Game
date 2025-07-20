import { Scene } from 'phaser';
import { initI18n, onLanguageChange, offLanguageChange } from '@/i18n';
import { AudioManager } from '@/utils/AudioManager';
import { supportsVibration } from '@/utils/DeviceUtils';
import { phaserStateManager, PhaserGameState } from '@/utils/PhaserStateManager';
import { createKidFriendlyButton, BUTTON_CONFIGS } from '@/utils/ButtonUtils';

/**
 * Common configuration constants for consistent UI styling
 */
export const SCENE_CONFIG = {
  // Layout constants
  LAYOUT: {
    TITLE_Y: 0.15,           // Title position as % of screen height
    BUTTON_START_Y: 0.4,     // First button position as % of screen height
    BUTTON_SPACING: 100,     // Spacing between buttons in pixels
    EDGE_PADDING: 20,        // Padding from screen edges
    BOTTOM_AREA: 0.8,        // Bottom area threshold for button placement
  },
  
  // Text styles - consistent across all scenes
  TEXT_STYLES: {
    TITLE: {
      fontSize: '40px',
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      stroke: '#FFFFFF',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#34495E',
        blur: 2,
        fill: true
      },
      align: 'center'
    } as Phaser.Types.GameObjects.Text.TextStyle,
    
    SUBTITLE: {
      fontSize: '30px',
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      stroke: '#FFFFFF',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#34495E',
        blur: 1,
        fill: true
      },
      align: 'center'
    } as Phaser.Types.GameObjects.Text.TextStyle,
    
    PRIMARY: {
      fontSize: '28px',
      color: '#2C3E50',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 2
    } as Phaser.Types.GameObjects.Text.TextStyle,
    
    SECONDARY: {
      fontSize: '22px',
      color: '#2C3E50',
      fontFamily: 'Arial, sans-serif',
      stroke: '#FFFFFF',
      strokeThickness: 1
    } as Phaser.Types.GameObjects.Text.TextStyle,
    
    STATS: {
      fontSize: '18px',
      color: '#7F8C8D',
      fontFamily: 'Arial, sans-serif'
    } as Phaser.Types.GameObjects.Text.TextStyle,
    
    INSTRUCTIONS: {
      fontSize: '16px',
      color: '#34495E',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      backgroundColor: '#F8F9FA',
      padding: { x: 10, y: 8 },
      stroke: '#BDC3C7',
      strokeThickness: 1
    } as Phaser.Types.GameObjects.Text.TextStyle
  },
  
  // Note: Button configurations are available from ButtonUtils.BUTTON_CONFIGS
};

/**
 * Abstract base scene that handles common functionality
 * All game scenes should extend this class
 */
export abstract class BaseScene extends Scene {
  protected audioManager: AudioManager;
  protected languageChangeHandler?: (lang: any) => void;
  protected backgroundMusic: string | null = 'background-music'; // Default beach music
  private sceneCreateTime: number = Date.now(); // Track when the scene was created

  constructor(key: string) {
    super({ key });
    this.sceneCreateTime = Date.now(); // Track when the scene was created
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Standard init that handles state restoration from page reload
   */
  init(data?: any): void {
    // Handle page reload state restoration
    if (this.shouldRestoreFromReload()) {
      this.restoreFromPageReload();
    }
    
    // Call custom init logic
    this.customInit(data);
  }

  /**
   * Standard preload that handles audio and i18n initialization
   * Override this method and call super.preload() for custom loading
   */
  async preload(): Promise<void> {
    // Initialize audio manager with this scene
    this.audioManager.init(this);
    
    // Load audio assets
    this.audioManager.loadSounds();
    
    // Initialize i18n system
    await initI18n();
    
    // Subscribe to language changes to update UI
    this.languageChangeHandler = () => {
      // Only update if scene is active to avoid calling on destroyed objects
      if (this.scene.isActive()) {
        this.onLanguageChanged();
      }
    };
    onLanguageChange(this.languageChangeHandler);

    // Setup automatic music management based on scene activity
    this.setupSceneActivityListeners();

    // Call custom preload logic
    await this.customPreload();
  }

  /**
   * Standard create that handles audio setup
   * Override this method and call super.create() for custom creation
   */
  create(): void {
    // Create audio objects and reload settings
    this.audioManager.createSounds();
    this.audioManager.reloadSettings();
    
    // Setup mobile optimizations
    this.setupMobileOptimizations();

    // Start background music with fade in (after a small delay to ensure scene is ready)
    // Note: Scene activity listeners will also handle music, but this ensures music starts on initial scene creation
    if (this.shouldStartMusic() && this.backgroundMusic) {
      this.time.delayedCall(100, () => {
        this.audioManager.fadeInBackgroundMusic(1500, this.backgroundMusic || undefined); // 1.5 second fade in with specific music
      });
    }

    // Call custom create logic
    this.customCreate();

    // Save state immediately after scene creation (solidifies the game flow)
    this.time.delayedCall(300, () => {
      this.saveCurrentState();
      console.log(`[BaseScene] Scene '${this.scene.key}' created & state saved`);
    });

    // Schedule delayed last scene tracking update for transition destinations
    // This ensures legitimate scene stays become the new "last active scene"
    this.time.delayedCall(3000, () => {
      this.updateLastSceneTrackingDelayed();
    });
  }

  /**
   * Delayed update of last scene tracking for legitimate scene stays
   * Called 3 seconds after scene creation to establish it as the active scene
   */
  private updateLastSceneTrackingDelayed(): void {
    if (this.scene.isActive()) {
      const sceneData = this.getSceneDataForRestore();
      phaserStateManager.saveSceneRestoreData(this.scene.key, sceneData, true);
      console.log(`[BaseScene] Scene '${this.scene.key}' established as last active scene after delay`);
    }
  }

  /**
   * Setup mobile-specific optimizations
   */
  protected setupMobileOptimizations(): void {
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
  }

  /**
   * Cleanup language change handler on scene shutdown
   * Note: Music stopping is handled automatically by scene activity listeners
   */
  shutdown(): void {
    if (this.languageChangeHandler) {
      offLanguageChange(this.languageChangeHandler);
      this.languageChangeHandler = undefined;
    }

    // Call custom shutdown logic
    this.customShutdown();
  }

  /**
   * Transition to another scene with smart music handling
   */
  protected transitionToScene(sceneKey: string, data?: any, fadeOutDuration: number = 1000): void {
    // Get the target scene's background music (if we can determine it)
    const nextSceneMusic = this.getSceneMusicKey(sceneKey);
    
    // Handle smart music transition
    this.audioManager.handleMusicTransition(nextSceneMusic);
    
    // If music is changing, fade out first
    if (nextSceneMusic !== this.backgroundMusic) {
      this.audioManager.fadeOutBackgroundMusic(fadeOutDuration).then(() => {
        this.scene.start(sceneKey, data);
      });
    } else {
      // Same music or no music change - transition immediately
      this.scene.start(sceneKey, data);
    }
  }

  /**
   * Get the background music key for a specific scene
   * Override in child classes for scene-specific music mapping
   */
  protected getSceneMusicKey(sceneKey: string): string | undefined {
    // Default scene music mapping - can be overridden by child classes
    const sceneMusicMap: Record<string, string | undefined> = {
      'MenuScene': 'menu-theme',
      'GameScene': 'background-music',
      'SettingsScene': 'background-music',
      'LevelCompleteScene': 'level-complete-music',
      'GameOverScene': 'achievement'
    };
    
    return sceneMusicMap[sceneKey];
  }

  /**
   * Override this method to control music behavior for specific scenes
   * Return false to prevent automatic music start
   */
  protected shouldStartMusic(): boolean {
    return true;
  }

  /**
   * Override this property to set scene-specific background music
   * Set to null to disable music for this scene
   * Set to music key (e.g., 'background-music', 'menu-theme') to play specific track
   */
  protected setBackgroundMusic(musicKey: string | null): void {
    this.backgroundMusic = musicKey;
  }

  /**
   * Setup automatic music management and state saving based on scene activity
   * This prevents music overlap and ensures immediate state persistence
   */
  private setupSceneActivityListeners(): void {
    // Listen for scene becoming active (wake up from sleep)
    this.events.on('wake', () => {
      console.log(`[BaseScene] Scene '${this.scene.key}' woke up - starting music & saving state`);
      
      // Start music
      if (this.shouldStartMusic() && this.backgroundMusic) {
        // Small delay to ensure scene is fully ready
        this.time.delayedCall(100, () => {
          this.audioManager.fadeInBackgroundMusic(1500, this.backgroundMusic || undefined);
        });
      }
      
      // Save state immediately when scene becomes active
      this.time.delayedCall(200, () => {
        this.saveCurrentState();
      });
      
      // Schedule delayed last scene tracking update for resumed scenes
      // This ensures scenes that become active later are tracked as the last active scene
      this.time.delayedCall(2000, () => {
        this.updateLastSceneTrackingDelayed();
      });
    });

    // Listen for scene going to sleep (becoming inactive)
    this.events.on('sleep', () => {
      console.log(`[BaseScene] Scene '${this.scene.key}' going to sleep - handling music transition & saving state`);
      
      // Smart music transition: only stop if needed (will be handled by next scene)
      // Note: The next scene will call audioManager.fadeInBackgroundMusic() which handles continuation
      
      // Save state before going inactive
      this.saveCurrentState();
    });

    // Listen for scene being paused (from pause button)
    this.events.on('pause', () => {
      console.log(`[BaseScene] Scene '${this.scene.key}' paused - pausing music & saving state`);
      this.audioManager.pauseBackgroundMusic();
      
      // Save state when paused
      this.saveCurrentState();
    });

    // Listen for scene being resumed (from pause)
    this.events.on('resume', () => {
      console.log(`[BaseScene] Scene '${this.scene.key}' resumed - resuming music & saving state`);
      this.audioManager.resumeBackgroundMusic();
      
      // Save state when resumed
      this.saveCurrentState();
    });

    // Listen for scene shutdown (complete stop)
    this.events.on('shutdown', () => {
      console.log(`[BaseScene] Scene '${this.scene.key}' shutting down - handling music cleanup & final save`);
      
      // On scene shutdown, stop music unless another scene is taking over
      // Note: This is called when scenes are completely destroyed, not just sleeping
      const activeScenes = this.scene.manager.getScenes(true); // Get all active scenes
      if (activeScenes.length <= 1) { // Only this scene is active
        this.audioManager.stopAllMusic();
      }
      
      // Final state save before shutdown
      this.saveCurrentState();
    });
  }

  /**
   * Create beach-themed gradient background (common across many scenes)
   */
  protected createBeachBackground(): Phaser.GameObjects.Graphics {
    const backgroundGradient = this.add.graphics();
    
    backgroundGradient.fillGradientStyle(
      0x87CEEB, 0x87CEEB, // Sky blue at top
      0xF4D03F, 0xE67E22, // Sandy yellow to orange at bottom
      1
    );
    backgroundGradient.fillRect(0, 0, this.scale.width, this.scale.height);

    // Add simple wave effect at bottom
    const waves = this.add.graphics();
    waves.fillStyle(0x3498DB, 0.3);
    waves.beginPath();
    waves.moveTo(0, this.scale.height * 0.8);
    
    for (let x = 0; x <= this.scale.width; x += 20) {
      const waveHeight = Math.sin((x * 0.02) + (Date.now() * 0.001)) * 10;
      waves.lineTo(x, this.scale.height * 0.8 + waveHeight);
    }
    
    waves.lineTo(this.scale.width, this.scale.height);
    waves.lineTo(0, this.scale.height);
    waves.closePath();
    waves.fillPath();

    return backgroundGradient;
  }

  /**
   * Create a standardized kid-friendly button using existing ButtonUtils
   */
  protected createStandardButton(
    x: number,
    y: number,
    text: string,
    style: keyof typeof BUTTON_CONFIGS = 'PRIMARY',
    onClick: () => void
  ): Phaser.GameObjects.Container {
    return createKidFriendlyButton(
      this,
      x,
      y,
      text,
      BUTTON_CONFIGS[style],
      onClick
    );
  }

  /**
   * Create a standardized title with consistent styling and animations
   */
  protected createStandardTitle(x: number, y: number, text: string, animate: boolean = true): Phaser.GameObjects.Text {
    const titleText = this.add.text(x, y, text, SCENE_CONFIG.TEXT_STYLES.TITLE);
    titleText.setOrigin(0.5);

    if (animate) {
      this.tweens.add({
        targets: titleText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return titleText;
  }

  /**
   * Create a standardized subtitle
   */
  protected createStandardSubtitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    const subtitleText = this.add.text(x, y, text, SCENE_CONFIG.TEXT_STYLES.SUBTITLE);
    subtitleText.setOrigin(0.5);
    return subtitleText;
  }

  /**
   * Create a standardized pause button in the top-right corner
   */
  protected createPauseButton(onPause: () => void): Phaser.GameObjects.Container {
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

    pauseButton.on('pointerdown', onPause);

    // Hover effects
    pauseButton.on('pointerover', () => pauseButton.setScale(1.1));
    pauseButton.on('pointerout', () => pauseButton.setScale(1));

    return pauseButton;
  }

  /**
   * Enable automatic development state persistence
   * Note: BaseScene already saves on all major scene events (wake, sleep, pause, resume, create, shutdown)
   * This provides additional periodic saving for long-running scenes
   */
  protected enableAutoSave(intervalMs: number = 15000): void {
    this.time.addEvent({
      delay: intervalMs, // Default: Save every 15 seconds (less frequent since we save on events)
      callback: () => {
        this.saveCurrentState();
        console.log(`[BaseScene] Periodic auto-save for '${this.scene.key}'`);
      },
      loop: true
    });
  }

  /**
   * Navigate to common scenes with standardized transitions
   */
  protected goToMenu(): void {
    this.transitionToScene('MenuScene');
  }

  protected goToSettings(): void {
    this.transitionToScene('SettingsScene');
  }

  protected startNewGame(): void {
    this.transitionToScene('GameScene');
  }

  /**
   * Save current scene state for development persistence
   * This method orchestrates both game state and scene-specific state saving
   */
  protected saveCurrentState(): void {
    // Save game state using StateManager
    this.saveGameState();
    
    // Save scene-specific restoration data using StateManager
    const sceneData = this.getSceneDataForRestore();
    
    // Determine if this scene should update the "last active scene" tracking
    // Don't update immediately after creation to prevent transition overwrites
    const shouldUpdateLastScene = this.shouldUpdateLastSceneTracking();
    
    phaserStateManager.saveSceneRestoreData(this.scene.key, sceneData, shouldUpdateLastScene);
  }

  /**
   * Determine if this scene should update the last scene tracking
   * Prevents immediate overwrites during scene transitions
   */
  private shouldUpdateLastSceneTracking(): boolean {
    // Check if the scene was just created (within last 1 second)
    const currentTime = Date.now();
    const sceneAge = currentTime - this.sceneCreateTime;
    
    // If scene is very new (< 1 second), it's likely a transition destination
    // Don't update last scene tracking immediately to preserve the source scene
    if (sceneAge < 1000) {
      console.log(`[BaseScene] Scene '${this.scene.key}' is new (${sceneAge}ms), preserving last scene tracking`);
      return false;
    }
    
    // For older scenes or scenes that become active later, update tracking
    return true;
  }

  /**
   * Save game state - override in child classes for scene-specific game state
   */
  protected saveGameState(): void {
    // Default implementation - child classes should override for scene-specific state
    const state: Omit<PhaserGameState, 'timestamp'> = {
      currentScene: this.scene.key,
      sceneStack: [],
      activeScenes: [],
      gameState: {
        currentLevel: 1,
        score: 0,
        lives: 3,
        droppedParts: [],
        isGameActive: false,
        isFirstPart: true
      },
      currentLevelIndex: 0,
      droppedParts: [],
      groundViolations: [],
      totalPartsDropped: 0,
      overallPartsPlaced: 0,
      successfulPartsInstalled: 0,
      wrongPartsCurrentLevel: 0,
      totalSuccessfulPlaced: 0,
      rewardedCastleCount: 0,
      partSpeed: 80,
      direction: 1
    };

    phaserStateManager.saveGameState(this.game, state);
  }

  /**
   * Check if we should restore state from page reload
   */
  private shouldRestoreFromReload(): boolean {
    return phaserStateManager.isSceneRestorationValid() && 
           phaserStateManager.getLastActiveScene()?.sceneKey === this.scene.key;
  }

  /**
   * Restore scene state from page reload
   */
  private restoreFromPageReload(): void {
    try {
      const sceneData = phaserStateManager.loadSceneRestoreData(this.scene.key);
      if (sceneData) {
        this.restoreSceneData(sceneData);
        console.log(`[BaseScene] Restored ${this.scene.key} from page reload`);
      }
    } catch (error) {
      console.warn('[BaseScene] Failed to restore scene from page reload:', error);
      // Clear corrupted data
      phaserStateManager.clearSceneRestoreData(this.scene.key);
    }
  }

  /**
   * Get scene-specific data for page reload restoration
   * Override in child classes to provide scene-specific data
   */
  protected getSceneDataForRestore(): any {
    return {};
  }

  /**
   * Restore scene-specific data from page reload
   * Override in child classes to handle scene-specific restoration
   */
  protected restoreSceneData(_data: any): void {
    // Default implementation - child classes can override
  }

  /**
   * Custom init logic - called after base init and restoration
   * Override in child classes for scene-specific init
   */
  protected customInit(_data?: any): void {
    // Default empty implementation - child classes can override
  }

  /**
   * Static helper to determine which scene to start with on page load
   * Call this from main.ts to handle page reload scene restoration
   */
  public static getInitialScene(): string {
    return phaserStateManager.getInitialScene('MenuScene');
  }

  /**
   * Clear page reload restoration data (call when user explicitly starts new game)
   */
  public static clearRestorationData(): void {
    phaserStateManager.clearAllSceneRestoreData();
    console.log('[BaseScene] Cleared restoration data');
  }

  // Abstract methods that child classes must implement
  
  /**
   * Custom preload logic - called after base preload
   */
  protected abstract customPreload(): Promise<void>;

  /**
   * Custom create logic - called after base create
   */
  protected abstract customCreate(): void;

  /**
   * Called when language changes - implement to update UI text
   */
  protected abstract onLanguageChanged(): void;

  /**
   * Custom shutdown logic - called before base shutdown
   */
  protected customShutdown(): void {
    // Default empty implementation - override if needed
  }
} 