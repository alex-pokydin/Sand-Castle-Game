import { firebaseService } from './FirebaseService';
import { phaserStateManager, PhaserGameState } from './PhaserStateManager';
import { CloudSave } from '@/types/Firebase';
import { GameState } from '@/types/Game';
import { Game } from 'phaser';

export interface CloudSaveOptions {
  autoSave: boolean;
  saveInterval: number; // in milliseconds
  maxSaves: number; // maximum number of cloud saves to keep
}

export interface SyncResult {
  success: boolean;
  synced: boolean;
  direction: 'up' | 'down' | 'none';
  timestamp: number;
  error?: string;
}

export class CloudSaveManager {
  private static instance: CloudSaveManager;
  private game: Game | null = null;
  private autoSaveInterval: number | null = null;
  private options: CloudSaveOptions = {
    autoSave: true,
    saveInterval: 30000, // 30 seconds
    maxSaves: 5
  };
  private lastSyncTimestamp: number = 0;
  private isSyncing: boolean = false;

  private constructor() {}

  static getInstance(): CloudSaveManager {
    if (!CloudSaveManager.instance) {
      CloudSaveManager.instance = new CloudSaveManager();
    }
    return CloudSaveManager.instance;
  }

  /**
   * Initialize cloud save manager with game instance
   */
  initialize(game: Game, options?: Partial<CloudSaveOptions>): void {
    this.game = game;
    
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Listen for authentication state changes
    firebaseService.getCurrentUserId();
    
    // Start auto-save if enabled
    if (this.options.autoSave) {
      this.startAutoSave();
    }

    console.log('[CloudSaveManager] ✅ Initialized with options:', this.options);
  }

  /**
   * Save current game state to cloud
   */
  async saveToCloud(isAutoSave: boolean = true): Promise<boolean> {
    if (!this.game || !firebaseService.isAuthenticated()) {
      console.log('[CloudSaveManager] Cannot save: no game instance or not authenticated');
      return false;
    }

    try {
      // Get current game state from Phaser state manager
      const phaserState = phaserStateManager.loadGameState(this.game);
      if (!phaserState) {
        console.log('[CloudSaveManager] No local state to save');
        return false;
      }

             // Prepare session data for cloud save
       const sessionData = {
         currentLevelIndex: phaserState.currentLevelIndex,
         droppedParts: phaserState.droppedParts,
         statistics: {
           totalPartsDropped: phaserState.totalPartsDropped,
           overallPartsPlaced: phaserState.overallPartsPlaced,
           successfulPartsInstalled: phaserState.successfulPartsInstalled,
           wrongPartsCurrentLevel: phaserState.wrongPartsCurrentLevel,
           totalSuccessfulPlaced: phaserState.totalSuccessfulPlaced,
           rewardedCastleCount: phaserState.rewardedCastleCount
         } as any // Type assertion to bypass interface mismatch
       };

      await firebaseService.saveToCloud(phaserState.gameState, sessionData, isAutoSave);
      this.lastSyncTimestamp = Date.now();
      
      console.log('[CloudSaveManager] ✅ Saved to cloud successfully');
      return true;
    } catch (error) {
      console.error('[CloudSaveManager] Failed to save to cloud:', error);
      return false;
    }
  }

  /**
   * Load game state from cloud and merge with local state
   */
  async loadFromCloud(): Promise<SyncResult> {
    if (!this.game || !firebaseService.isAuthenticated()) {
      return {
        success: false,
        synced: false,
        direction: 'none',
        timestamp: Date.now(),
        error: 'Not authenticated or no game instance'
      };
    }

    this.isSyncing = true;

    try {
      const cloudSave = await firebaseService.loadFromCloud();
      const localState = phaserStateManager.loadGameState(this.game);

      if (!cloudSave) {
        console.log('[CloudSaveManager] No cloud save found');
        this.isSyncing = false;
        return {
          success: true,
          synced: false,
          direction: 'none',
          timestamp: Date.now()
        };
      }

      // Determine which state is newer
      const cloudTimestamp = cloudSave.timestamp.toMillis();
      const localTimestamp = localState?.timestamp || 0;

      let direction: 'up' | 'down' | 'none' = 'none';
      let synced = false;

      if (cloudTimestamp > localTimestamp) {
        // Cloud state is newer, download it
        await this.applyCloudState(cloudSave);
        direction = 'down';
        synced = true;
        console.log('[CloudSaveManager] ⬇️ Downloaded newer state from cloud');
      } else if (localTimestamp > cloudTimestamp) {
        // Local state is newer, upload it
        await this.saveToCloud(false); // Manual save
        direction = 'up';
        synced = true;
        console.log('[CloudSaveManager] ⬆️ Uploaded newer local state to cloud');
      } else {
        console.log('[CloudSaveManager] States are in sync');
      }

      this.lastSyncTimestamp = Date.now();
      this.isSyncing = false;

      return {
        success: true,
        synced,
        direction,
        timestamp: this.lastSyncTimestamp
      };
    } catch (error) {
      console.error('[CloudSaveManager] Failed to sync with cloud:', error);
      this.isSyncing = false;
      return {
        success: false,
        synced: false,
        direction: 'none',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Apply cloud save state to local state
   */
  private async applyCloudState(cloudSave: CloudSave): Promise<void> {
    if (!this.game) return;

    // Create a complete Phaser state from cloud save
    const phaserState: PhaserGameState = {
      sceneStack: [], // Will be reconstructed
      currentScene: 'GameScene', // Default to game scene when restoring
      activeScenes: ['GameScene'],
      gameState: cloudSave.gameState,
      currentLevelIndex: cloudSave.sessionData.currentLevelIndex,
      droppedParts: cloudSave.sessionData.droppedParts,
      groundViolations: [], // Reset violations
             totalPartsDropped: (cloudSave.sessionData.statistics as any)?.totalPartsDropped || 0,
       overallPartsPlaced: (cloudSave.sessionData.statistics as any)?.overallPartsPlaced || 0,
       successfulPartsInstalled: (cloudSave.sessionData.statistics as any)?.successfulPartsInstalled || 0,
       wrongPartsCurrentLevel: (cloudSave.sessionData.statistics as any)?.wrongPartsCurrentLevel || 0,
       totalSuccessfulPlaced: (cloudSave.sessionData.statistics as any)?.totalSuccessfulPlaced || 0,
       rewardedCastleCount: (cloudSave.sessionData.statistics as any)?.rewardedCastleCount || 0,
      partSpeed: 80, // Default part speed
      direction: 1, // Default direction
      timestamp: cloudSave.timestamp.toMillis()
    };

    // Save the state locally
    phaserStateManager.saveGameState(this.game, phaserState);
    
    console.log('[CloudSaveManager] ✅ Applied cloud state locally');
  }

  /**
   * Sync with cloud (two-way sync)
   */
  async syncWithCloud(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[CloudSaveManager] Sync already in progress');
      return {
        success: false,
        synced: false,
        direction: 'none',
        timestamp: Date.now(),
        error: 'Sync already in progress'
      };
    }

    return await this.loadFromCloud();
  }

  /**
   * Start automatic cloud saves
   */
  startAutoSave(): void {
    if (this.autoSaveInterval) {
      this.stopAutoSave();
    }

    this.autoSaveInterval = window.setInterval(async () => {
      if (firebaseService.isAuthenticated()) {
        await this.saveToCloud(true);
      }
    }, this.options.saveInterval);

    console.log('[CloudSaveManager] ✅ Auto-save started (interval:', this.options.saveInterval, 'ms)');
  }

  /**
   * Stop automatic cloud saves
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('[CloudSaveManager] 📴 Auto-save stopped');
    }
  }

  /**
   * Force sync on user action (manual sync)
   */
  async forceSyncNow(): Promise<SyncResult> {
    console.log('[CloudSaveManager] 🔄 Force sync requested');
    const result = await this.syncWithCloud();
    
    if (result.success && result.synced) {
      // Notify user of sync result if needed
      console.log(`[CloudSaveManager] Sync completed: ${result.direction === 'up' ? 'Uploaded' : 'Downloaded'} state`);
    }
    
    return result;
  }

  /**
   * Check if cloud saves are available
   */
  isCloudSaveAvailable(): boolean {
    return firebaseService.isAuthenticated();
  }

  /**
   * Get last sync timestamp
   */
  getLastSyncTimestamp(): number {
    return this.lastSyncTimestamp;
  }

  /**
   * Get time since last sync in human readable format
   */
  getTimeSinceLastSync(): string {
    if (this.lastSyncTimestamp === 0) {
      return 'Never';
    }

    const now = Date.now();
    const diff = now - this.lastSyncTimestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    } else {
      return `${seconds}s ago`;
    }
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Update cloud save options
   */
  updateOptions(options: Partial<CloudSaveOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Restart auto-save if interval changed
    if (options.autoSave !== undefined || options.saveInterval !== undefined) {
      if (this.options.autoSave) {
        this.startAutoSave();
      } else {
        this.stopAutoSave();
      }
    }

    console.log('[CloudSaveManager] ✅ Options updated:', this.options);
  }

  /**
   * Cleanup when shutting down
   */
  cleanup(): void {
    this.stopAutoSave();
    this.game = null;
    this.lastSyncTimestamp = 0;
    this.isSyncing = false;
    console.log('[CloudSaveManager] 📴 Cleaned up');
  }
}

// Export singleton instance
export const cloudSaveManager = CloudSaveManager.getInstance();

// Debug functions for development
export const debugCloudSaves = {
  saveNow: () => cloudSaveManager.saveToCloud(false),
  loadNow: () => cloudSaveManager.loadFromCloud(),
  syncNow: () => cloudSaveManager.forceSyncNow(),
  isAvailable: () => cloudSaveManager.isCloudSaveAvailable(),
  lastSync: () => cloudSaveManager.getTimeSinceLastSync(),
  isSyncing: () => cloudSaveManager.isSyncInProgress(),
  startAutoSave: () => cloudSaveManager.startAutoSave(),
  stopAutoSave: () => cloudSaveManager.stopAutoSave()
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugCloudSaves = debugCloudSaves;
} 