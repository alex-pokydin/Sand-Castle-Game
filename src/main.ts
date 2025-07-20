import { Game, AUTO } from 'phaser';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { LevelCompleteScene } from '@/scenes/LevelCompleteScene';
import { SettingsScene } from '@/scenes/SettingsScene';
import { GAME_CONFIG, PHYSICS_CONFIG } from '@/config/gameConfig';

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: PHYSICS_CONFIG.gravity }, // Use config gravity instead of hardcoded 0.8
      debug: false,
      enableSleeping: true // Improve performance
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 240
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  scene: [MenuScene, GameScene, GameOverScene, LevelCompleteScene, SettingsScene]
};

// Initialize the game
const game = new Game(config);

// Check for saved state and restore scene if available
import { phaserStateManager } from '@/utils/PhaserStateManager';

// Wait for game to be ready, then check for saved state
game.events.once('ready', () => {
  const savedState = phaserStateManager.loadGameState(game);
  
  if (savedState) {
    // Found saved state, restoring scenes
    
    // Smart scene restoration - prioritize LevelCompleteScene if it's active
    if (savedState.activeScenes.includes('LevelCompleteScene')) {
      game.scene.start('LevelCompleteScene', { restoreFromState: true, savedState });
    } else if (savedState.currentScene === 'LevelCompleteScene') {
      game.scene.start('LevelCompleteScene', { restoreFromState: true, savedState });
    } else if (savedState.currentScene === 'MenuScene') {
      // If MenuScene is already active, stop and restart it with restoration data
      if (game.scene.isActive('MenuScene')) {
        game.scene.stop('MenuScene');
        game.scene.start('MenuScene', { restoreFromState: true, savedState });
      } else {
        game.scene.start('MenuScene', { restoreFromState: true, savedState });
      }
    } else if (savedState.currentScene === 'GameScene') {
      game.scene.start('GameScene', { restoreFromState: true, savedState });
    } else if (savedState.currentScene === 'SettingsScene') {
      game.scene.start('SettingsScene', { restoreFromState: true, savedState });
    } else {
      game.scene.start('MenuScene');
    }
  } else {
    // No saved state found, starting MenuScene
    game.scene.start('MenuScene');
  }
  
  // Set up immediate state saving on scene changes
  setupImmediateStateSaving(game);
});

/**
 * Set up immediate state saving when scenes change
 */
function setupImmediateStateSaving(game: Game): void {
  // Listen for scene start events
  game.events.on('scene-start', (sceneKey: string) => {
    // Trigger immediate state save after a short delay to ensure scene is fully initialized
    setTimeout(() => {
      const currentScene = game.scene.getScene(sceneKey);
      if (currentScene && typeof (currentScene as any).saveCurrentState === 'function') {
        (currentScene as any).saveCurrentState();
      }
    }, 100);
  });
}

// Handle window resize for mobile
window.addEventListener('resize', () => {
  game.scale.refresh();
});

// Prevent context menu on touch devices
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Prevent scrolling/bounce on mobile
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Debug functions for testing (available in browser console)
import { debugI18n, testSetLanguage, testTranslation, clearSavedLanguage, testSystemLanguageDetection, checkMissingTranslations } from '@/i18n';
import { debugPhaserState } from '@/utils/PhaserStateManager';

(window as any).debugI18n = debugI18n;
(window as any).testSetLanguage = testSetLanguage;
(window as any).testTranslation = testTranslation;
(window as any).clearSavedLanguage = clearSavedLanguage;
(window as any).testSystemLanguageDetection = testSystemLanguageDetection;
(window as any).checkMissingTranslations = checkMissingTranslations;
(window as any).debugPhaserState = debugPhaserState;

// Add additional debug function to check current state
(window as any).checkCurrentState = () => {
  const savedState = phaserStateManager.loadGameState(game);
  if (savedState) {
    console.log('📊 Current saved state:', {
      currentScene: savedState.currentScene,
      activeScenes: savedState.activeScenes,
      activeScenesDetails: savedState.activeScenes.map(sceneKey => {
        const scene = game.scene.getScene(sceneKey);
        return `${sceneKey}(${scene?.scene?.isActive() ? 'active' : 'inactive'})`;
      }),
      timestamp: new Date(savedState.timestamp).toLocaleString(),
      level: savedState.gameState.currentLevel,
      score: savedState.gameState.score
    });
  } else {
    console.log('📊 No saved state found');
  }
};

// Add debug function to check current scene states
(window as any).checkSceneStates = () => {
  console.log('🎭 Current scene states:');
  game.scene.scenes.forEach((scene) => {
    console.log(`  ${scene.scene.key}: active=${scene.scene.isActive()}, visible=${scene.scene.isVisible()}, paused=${scene.scene.isPaused()}`);
  });
};

// Add debug function to force clear state and restart
(window as any).clearStateAndRestart = () => {
  console.log('🗑️ Clearing state and restarting...');
  phaserStateManager.clearGameState(game);
  game.scene.start('MenuScene');
};

// Add debug function to manually trigger state save
(window as any).triggerStateSave = () => {
  const activeScenes = game.scene.scenes.filter(scene => scene.scene.isActive());
  if (activeScenes.length > 0) {
    const currentScene = activeScenes[0];
    if (typeof (currentScene as any).saveCurrentState === 'function') {
      console.log('💾 Manually triggering state save for:', currentScene.scene.key);
      (currentScene as any).saveCurrentState();
    } else {
      console.log('❌ No saveCurrentState method found for current scene');
    }
  } else {
    console.log('❌ No active scene found');
  }
};

export default game; 