import { Game, Scene } from 'phaser';
import { GameState, CastlePartData, GroundViolation } from '@/types/Game';

export interface PhaserGameState {
  // Scene stack information
  sceneStack: SceneState[];
  currentScene: string;
  activeScenes: string[]; // All currently active scenes
  
  // Core game state
  gameState: GameState;
  
  // Level-specific data
  currentLevelIndex: number;
  droppedParts: CastlePartData[];
  groundViolations: GroundViolation[];
  
  // Statistics
  totalPartsDropped: number;
  overallPartsPlaced: number;
  successfulPartsInstalled: number;
  wrongPartsCurrentLevel: number;
  totalSuccessfulPlaced: number;
  rewardedCastleCount: number;
  
  // Game mechanics state
  partSpeed: number;
  direction: number;
  
  // Timestamp for when state was saved
  timestamp: number;
}

export interface SceneState {
  sceneKey: string;
  isActive: boolean;
  isVisible: boolean;
  isPaused: boolean;
  data?: any; // Scene-specific data
}

export class PhaserStateManager {
  private static instance: PhaserStateManager;
  private readonly REGISTRY_KEY = 'sand-castle-game-state';
  private readonly SCENE_DATA_PREFIX = 'sand-castle-scene-';
  private readonly LAST_SCENE_KEY = 'sand-castle-last-scene';
  private readonly LAST_SAVE_TIME_KEY = 'sand-castle-last-save-time';

  private constructor() {}

  static getInstance(): PhaserStateManager {
    if (!PhaserStateManager.instance) {
      PhaserStateManager.instance = new PhaserStateManager();
    }
    return PhaserStateManager.instance;
  }

  /**
   * Save game state using Phaser's registry system
   */
  saveGameState(game: Game, state: Omit<PhaserGameState, 'timestamp'>): void {
    try {
      // Capture current scene stack state
      const sceneStack: SceneState[] = [];
      let activeScenes: string[] = [];
      
      game.scene.scenes.forEach((scene) => {
        const sceneState: SceneState = {
          sceneKey: scene.scene.key,
          isActive: scene.scene.isActive(),
          isVisible: scene.scene.isVisible(),
          isPaused: scene.scene.isPaused(),
          data: {} // Scene-specific data will be saved by each scene
        };
        
        sceneStack.push(sceneState);
        
        if (scene.scene.isActive()) {
          activeScenes.push(scene.scene.key);
        }
      });

      // If the state already has activeScenes defined, use those instead
      // This allows scenes to explicitly set their active state
      if (state.activeScenes && state.activeScenes.length > 0) {
        activeScenes = state.activeScenes;
      }

      const completeState: PhaserGameState = {
        ...state,
        sceneStack,
        activeScenes,
        timestamp: Date.now()
      };

      // Save to Phaser's global registry
      game.registry.set(this.REGISTRY_KEY, completeState);
      
      // Also save to localStorage for persistence across page refreshes
      localStorage.setItem(this.REGISTRY_KEY, JSON.stringify(completeState));
      
      // State saved successfully
    } catch (error) {
      console.warn('❌ Failed to save game state:', error);
    }
  }

  /**
   * Load game state from Phaser's registry or localStorage
   */
  loadGameState(game: Game): PhaserGameState | null {
    try {
      // First try to get from Phaser registry (for scene transitions)
      let state = game.registry.get(this.REGISTRY_KEY) as PhaserGameState | undefined;
      
      if (!state) {
        // Fallback to localStorage (for page refreshes)
        const serializedState = localStorage.getItem(this.REGISTRY_KEY);
        if (!serializedState) {
          // No saved state found
          return null;
        }
        
        state = JSON.parse(serializedState) as PhaserGameState;
      }

      // Check if state is too old (older than 24 hours)
      const stateAge = Date.now() - state.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (stateAge > maxAge) {
        // Saved state is too old, clearing
        this.clearGameState(game);
        return null;
      }

      // Game state loaded successfully

      return state;
    } catch (error) {
      console.warn('❌ Failed to load game state:', error);
      this.clearGameState(game);
      return null;
    }
  }

  /**
   * Clear saved game state
   */
  clearGameState(game: Game): void {
    try {
      // Clear from Phaser registry
      game.registry.remove(this.REGISTRY_KEY);
      
      // Clear from localStorage
      localStorage.removeItem(this.REGISTRY_KEY);
      
      // Game state cleared
    } catch (error) {
      console.warn('❌ Failed to clear game state:', error);
    }
  }

  /**
   * Check if there's a saved state
   */
  hasSavedState(game: Game): boolean {
    return game.registry.has(this.REGISTRY_KEY) || localStorage.getItem(this.REGISTRY_KEY) !== null;
  }

  /**
   * Get state info for debugging
   */
  getStateInfo(game: Game): { exists: boolean; timestamp?: number; age?: string } | null {
    try {
      let state = game.registry.get(this.REGISTRY_KEY) as PhaserGameState | undefined;
      
      if (!state) {
        const serializedState = localStorage.getItem(this.REGISTRY_KEY);
        if (!serializedState) {
          return { exists: false };
        }
        state = JSON.parse(serializedState) as PhaserGameState;
      }

      const age = Date.now() - state.timestamp;
      
      return {
        exists: true,
        timestamp: state.timestamp,
        age: Math.round(age / 1000 / 60) + ' minutes ago'
      };
    } catch (error) {
      console.warn('❌ Failed to get state info:', error);
      return null;
    }
  }

  /**
   * Save scene-specific data to scene registry
   */
  saveSceneData(scene: Scene, key: string, data: any): void {
    try {
      scene.registry.set(key, data);
      // Scene data saved
    } catch (error) {
      console.warn(`❌ Failed to save scene data: ${key}`, error);
    }
  }

  /**
   * Load scene-specific data from scene registry
   */
  loadSceneData<T>(scene: Scene, key: string): T | null {
    try {
      const data = scene.registry.get(key) as T | undefined;
      if (data !== undefined) {
        // Scene data loaded
        return data;
      }
      return null;
    } catch (error) {
      console.warn(`❌ Failed to load scene data: ${key}`, error);
      return null;
    }
  }

  /**
   * Clear scene-specific data
   */
  clearSceneData(scene: Scene, key: string): void {
    try {
      scene.registry.remove(key);
      // Scene data cleared
    } catch (error) {
      console.warn(`❌ Failed to clear scene data: ${key}`, error);
    }
  }

  /**
   * Restore complete scene stack from saved state
   */
  restoreSceneStack(game: Game, savedState: PhaserGameState): void {
    if (!savedState.sceneStack || savedState.sceneStack.length === 0) {
      // No scene stack to restore
      return;
    }

    // Restoring complete scene stack

    // Stop all current scenes
    game.scene.scenes.forEach(scene => {
      if (scene.scene.isActive()) {
        game.scene.stop(scene.scene.key);
      }
    });

    // Restore scenes in order
    savedState.sceneStack.forEach((sceneState, index) => {
      if (sceneState.isActive) {
        // Starting scene
        
        game.scene.start(sceneState.sceneKey, {
          restoreFromState: true,
          savedState,
          sceneStack: savedState.sceneStack,
          sceneIndex: index,
          sceneData: sceneState.data
        });

        // Set scene visibility and pause state
        const scene = game.scene.getScene(sceneState.sceneKey);
        if (scene) {
          scene.scene.setVisible(sceneState.isVisible);
          if (sceneState.isPaused) {
            scene.scene.pause();
          }
          
          // Special handling for scene stack restoration
          if (sceneState.sceneKey === 'GameScene' && savedState.activeScenes.includes('LevelCompleteScene')) {
            // If LevelCompleteScene is also active, pause GameScene
            // Pausing GameScene because LevelCompleteScene is active
            scene.scene.pause();
          }
        }
      }
    });

    // Scene stack restoration completed
  }

  /**
   * Save scene-specific data for page reload restoration (localStorage)
   */
  saveSceneRestoreData(sceneKey: string, data: any): void {
    try {
      const sceneDataKey = `${this.SCENE_DATA_PREFIX}${sceneKey}`;
      localStorage.setItem(sceneDataKey, JSON.stringify(data));
      localStorage.setItem(this.LAST_SCENE_KEY, sceneKey);
      localStorage.setItem(this.LAST_SAVE_TIME_KEY, Date.now().toString());
      console.log(`[StateManager] Saved restore data for scene '${sceneKey}'`);
    } catch (error) {
      console.warn(`[StateManager] Failed to save scene restore data for '${sceneKey}':`, error);
    }
  }

  /**
   * Load scene-specific data for page reload restoration (localStorage)
   */
  loadSceneRestoreData(sceneKey: string): any | null {
    try {
      const sceneDataKey = `${this.SCENE_DATA_PREFIX}${sceneKey}`;
      const savedData = localStorage.getItem(sceneDataKey);
      if (savedData) {
        console.log(`[StateManager] Loaded restore data for scene '${sceneKey}'`);
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.warn(`[StateManager] Failed to load scene restore data for '${sceneKey}':`, error);
      this.clearSceneRestoreData(sceneKey);
    }
    return null;
  }

  /**
   * Clear scene-specific restore data (localStorage)
   */
  clearSceneRestoreData(sceneKey: string): void {
    const sceneDataKey = `${this.SCENE_DATA_PREFIX}${sceneKey}`;
    localStorage.removeItem(sceneDataKey);
    console.log(`[StateManager] Cleared restore data for scene '${sceneKey}'`);
  }

  /**
   * Get the last active scene for page reload restoration
   */
  getLastActiveScene(): { sceneKey: string; timestamp: number } | null {
    try {
      const lastScene = localStorage.getItem(this.LAST_SCENE_KEY);
      const lastSaveTimestamp = parseInt(localStorage.getItem(this.LAST_SAVE_TIME_KEY) || '0');
      
      if (lastScene && lastSaveTimestamp) {
        return { sceneKey: lastScene, timestamp: lastSaveTimestamp };
      }
    } catch (error) {
      console.warn('[StateManager] Failed to get last active scene:', error);
    }
    return null;
  }

  /**
   * Check if scene restoration is valid (within time window)
   */
  isSceneRestorationValid(maxAgeMs: number = 5 * 60 * 1000): boolean {
    const lastActive = this.getLastActiveScene();
    if (!lastActive) return false;
    
    const currentTime = Date.now();
    const isValid = currentTime - lastActive.timestamp < maxAgeMs;
    
    console.log(`[StateManager] Scene restoration valid: ${isValid} (age: ${Math.round((currentTime - lastActive.timestamp) / 1000)}s)`);
    return isValid;
  }

  /**
   * Get initial scene for page load with restoration logic
   */
  getInitialScene(defaultScene: string = 'MenuScene'): string {
    if (this.isSceneRestorationValid()) {
      const lastActive = this.getLastActiveScene();
      if (lastActive) {
        console.log(`[StateManager] Restoring to scene: ${lastActive.sceneKey}`);
        return lastActive.sceneKey;
      }
    }
    
    console.log(`[StateManager] Starting fresh with: ${defaultScene}`);
    return defaultScene;
  }

  /**
   * Clear all scene restoration data
   */
  clearAllSceneRestoreData(): void {
    try {
      // Clear scene-specific data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.SCENE_DATA_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear restoration tracking
      localStorage.removeItem(this.LAST_SCENE_KEY);
      localStorage.removeItem(this.LAST_SAVE_TIME_KEY);
      
      console.log('[StateManager] Cleared all scene restoration data');
    } catch (error) {
      console.warn('[StateManager] Failed to clear scene data:', error);
    }
  }
}

// Export singleton instance
export const phaserStateManager = PhaserStateManager.getInstance();

// Debug functions for development
export const debugPhaserState = {
  save: (game: Game, state: any) => {
    phaserStateManager.saveGameState(game, state);
  },
  load: (game: Game) => {
    const state = phaserStateManager.loadGameState(game);
    if (state) {
      console.log('📊 Saved state details:', {
        level: state.gameState.currentLevel,
        score: state.gameState.score,
        lives: state.gameState.lives,
        parts: state.droppedParts.length,
        timestamp: new Date(state.timestamp).toLocaleString()
      });
    }
    return state;
  },
  clear: (game: Game) => {
    phaserStateManager.clearGameState(game);
  },
  info: (game: Game) => {
    const info = phaserStateManager.getStateInfo(game);
    console.log('ℹ️ State info:', info);
    return info;
  },
  hasState: (game: Game) => {
    const hasState = phaserStateManager.hasSavedState(game);
    console.log('🔍 Has saved state:', hasState);
    return hasState;
  }
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugPhaserState = debugPhaserState;
} 