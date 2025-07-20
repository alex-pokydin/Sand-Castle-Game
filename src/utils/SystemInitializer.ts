import { Game } from 'phaser';
import { BaseScene } from '@/scenes/BaseScene';
import { SCENES } from '@/scenes';
import { PWAManager } from '@/utils/PWAManager';
import { AudioManager } from '@/utils/AudioManager';
import { SettingsManager } from '@/utils/SettingsManager';
import { phaserStateManager } from '@/utils/PhaserStateManager';
import { setupDebugConsole } from '@/utils/DebugConsole';
import { setupMobileEventHandlers } from '@/utils/MobileEventHandlers';
import { setupGameEventHandlers } from '@/utils/GameEventHandlers';

/**
 * System Initializer
 * 
 * This file handles the initialization of all game systems.
 * Separated from main.ts to keep the entry point clean and focused.
 */

export class SystemInitializer {
  private game: Game;
  private pwaManager: PWAManager;
  private audioManager: AudioManager;
  private settingsManager: SettingsManager;

  constructor(game: Game) {
    this.game = game;
    this.pwaManager = PWAManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.settingsManager = SettingsManager.getInstance();
  }

  /**
   * Initialize all game systems and start the correct scene
   */
  async initializeAllSystems(): Promise<void> {
    console.log('[SystemInit] 🚀 Starting system initialization...');
    
    // Register all scenes with Phaser
    this.registerScenes();
    
    // Wait for all systems to be ready
    await this.initializeSystems();
    
    // Determine and start the correct scene
    this.startInitialScene();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Setup debug console
    this.setupDebugMode();
    
    console.log('[SystemInit] ✨ System initialization complete!');
  }

  /**
   * Register all scenes with Phaser
   */
  private registerScenes(): void {
    console.log('[SystemInit] 📝 Registering scenes...');
    
    Object.entries(SCENES).forEach(([key, SceneClass]) => {
      this.game.scene.add(key, SceneClass);
      console.log(`[SystemInit]   ✓ ${key} registered`);
    });
  }

  /**
   * Initialize all core systems
   */
  private async initializeSystems(): Promise<void> {
    console.log('[SystemInit] ⚙️ Initializing systems...');
    
    await Promise.all([
      this.initializeAudioSystem(),
      this.initializeSettingsSystem(),
      this.initializePWASystem(),
      // Wait a small delay to ensure all systems are stable
      new Promise<void>((resolve) => setTimeout(resolve, 100))
    ]);
  }

  /**
   * Initialize audio system
   */
  private async initializeAudioSystem(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        this.audioManager.createSounds();
        this.audioManager.reloadSettings();
        console.log('[SystemInit] ✅ Audio system ready');
        resolve();
      } catch (error) {
        console.warn('[SystemInit] ⚠️ Audio system initialization failed:', error);
        resolve(); // Don't block game start if audio fails
      }
    });
  }

  /**
   * Initialize settings system
   */
  private async initializeSettingsSystem(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        this.settingsManager.loadAudioSettings();
        console.log('[SystemInit] ✅ Settings system ready');
        resolve();
      } catch (error) {
        console.warn('[SystemInit] ⚠️ Settings system initialization failed:', error);
        resolve(); // Don't block game start if settings fail
      }
    });
  }

  /**
   * Initialize PWA system
   */
  private async initializePWASystem(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        this.pwaManager.setupConnectivityListeners();
        console.log('[SystemInit] ✅ PWA system ready');
        resolve();
      } catch (error) {
        console.warn('[SystemInit] ⚠️ PWA system initialization failed:', error);
        resolve(); // Don't block game start if PWA fails
      }
    });
  }

  /**
   * Determine and start the initial scene
   */
  private startInitialScene(): void {
    console.log('[SystemInit] 🎬 Determining initial scene...');
    
    // Check for last active scene from state manager
    const initialScene = BaseScene.getInitialScene();
    console.log('[SystemInit] 🎬 Starting scene:', initialScene);
    
    // Check if we have saved state for restoration
    const savedState = phaserStateManager.loadGameState(this.game);
    const sceneData = savedState ? { restoreFromState: true, savedState } : undefined;
    
    this.game.scene.start(initialScene, sceneData);
  }

  /**
   * Set up all event handlers
   */
  private setupEventHandlers(): void {
    console.log('[SystemInit] ⚙️ Setting up event handlers...');
    
    setupGameEventHandlers(this.game);
    setupMobileEventHandlers(this.game);
    
    console.log('[SystemInit] ✅ Event handlers ready');
  }

  /**
   * Setup debug mode
   */
  private setupDebugMode(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SystemInit] 🔧 Setting up debug mode...');
      setupDebugConsole(this.game);
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error: Error): void {
    console.error('[SystemInit] ❌ System initialization failed:', error);
    
    // Fallback to MenuScene if initialization fails
    try {
      this.game.scene.add('MenuScene', SCENES['MenuScene']);
      this.game.scene.start('MenuScene');
      console.log('[SystemInit] 🔄 Fallback to MenuScene successful');
    } catch (fallbackError) {
      console.error('[SystemInit] ❌ Fallback initialization also failed:', fallbackError);
    }
  }
} 