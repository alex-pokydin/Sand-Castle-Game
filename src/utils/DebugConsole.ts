import { Game } from 'phaser';
import { AudioManager } from '@/utils/AudioManager';
import { SettingsManager } from '@/utils/SettingsManager';
import { PWAManager } from '@/utils/PWAManager';
import { phaserStateManager } from '@/utils/PhaserStateManager';
import { debugI18n, testSetLanguage, testTranslation, clearSavedLanguage, testSystemLanguageDetection, checkMissingTranslations } from '@/i18n';
import { debugPhaserState } from '@/utils/PhaserStateManager';
import { SCENES, getAllScenes, isValidScene } from '@/scenes';

/**
 * Debug Console Functions
 * 
 * This file contains all debug functions available in the browser console.
 * Separated from main.ts to keep initialization logic clean.
 */

export function setupDebugConsole(game: Game): void {
  console.log('🔧 Setting up debug console functions...');
  
  const audioManager = AudioManager.getInstance();
  const settingsManager = SettingsManager.getInstance();
  const pwaManager = PWAManager.getInstance();

  // === I18N Debug Functions ===
  (window as any).debugI18n = debugI18n;
  (window as any).testSetLanguage = testSetLanguage;
  (window as any).testTranslation = testTranslation;
  (window as any).clearSavedLanguage = clearSavedLanguage;
  (window as any).testSystemLanguageDetection = testSystemLanguageDetection;
  (window as any).checkMissingTranslations = checkMissingTranslations;

  // === State Management Debug Functions ===
  (window as any).debugPhaserState = debugPhaserState;
  (window as any).debugLastScene = () => {
    return phaserStateManager.debugLastSceneTracking();
  };
  (window as any).clearSceneRestoration = () => {
    phaserStateManager.clearAllSceneRestoreData();
    console.log('🗑️ Cleared all scene restoration data');
  };
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
  (window as any).clearStateAndRestart = () => {
    console.log('🗑️ Clearing state and restarting...');
    phaserStateManager.clearGameState(game);
    game.scene.start('MenuScene');
  };

  // === Scene Debug Functions ===
  (window as any).debugSceneRegistry = () => {
    console.log('🎭 Available Scenes:');
    console.table(Object.entries(SCENES).map(([key, SceneClass]) => ({
      key: key,
      className: SceneClass.name
    })));
    return Object.entries(SCENES);
  };
  (window as any).getRegisteredScenes = () => {
    return getAllScenes();
  };
  (window as any).validateScene = (sceneKey: string) => {
    const exists = isValidScene(sceneKey);
    console.log(`🔍 Scene validation for '${sceneKey}':`, {
      exists,
      status: exists ? 'Yes' : 'No'
    });
    return { exists };
  };
  (window as any).switchToScene = (sceneKey: string, data?: any) => {
    if (!isValidScene(sceneKey)) {
      console.error(`❌ Invalid scene key: ${sceneKey}`);
      console.log('Valid scenes:', getAllScenes());
      return false;
    }
    console.log(`🎬 Switching to scene: ${sceneKey}`);
    game.scene.start(sceneKey, data);
    return true;
  };
  (window as any).checkSceneStates = () => {
    console.log('🎭 Current scene states:');
    game.scene.scenes.forEach((scene) => {
      console.log(`  ${scene.scene.key}: active=${scene.scene.isActive()}, visible=${scene.scene.isVisible()}, paused=${scene.scene.isPaused()}`);
    });
  };

  // === PWA Debug Functions ===
  (window as any).debugPWA = () => {
    console.log('📱 PWA Status:', pwaManager.getPWAStatus());
  };
  (window as any).installApp = () => {
    pwaManager.installApp();
  };
  (window as any).updateApp = () => {
    pwaManager.updateApp();
  };

  // === Audio Debug Functions ===
  (window as any).debugAudio = () => {
    console.log('🔊 Audio Status:', {
      volume: audioManager.getVolume(),
      musicVolume: audioManager.getMusicVolume(),
      isMuted: audioManager.isMutedState(),
      poolStatus: audioManager.getAudioPoolStatus()
    });
  };
  (window as any).testAudio = () => {
    console.log('🎵 Testing audio sounds...');
    audioManager.playSound('drop');
    setTimeout(() => audioManager.playSound('place-good'), 500);
    setTimeout(() => audioManager.playSound('place-perfect'), 1000);
    setTimeout(() => audioManager.playSound('wobble'), 1500);
    setTimeout(() => audioManager.playSound('collapse'), 2000);
    setTimeout(() => audioManager.playSound('level-complete'), 2500);
  };
  (window as any).quickAudioTest = () => {
    console.log('🔊 Quick audio test...');
    audioManager.playSound('drop');
  };
  (window as any).testVolume = (volume = 0.5) => {
    audioManager.setVolume(volume);
    audioManager.playSound('place-good');
    console.log(`🔊 Volume set to ${volume} and test sound played`);
  };
  (window as any).testMusic = (volume = 0.3) => {
    audioManager.setMusicVolume(volume);
    audioManager.startBackgroundMusic();
    console.log(`🎵 Music volume set to ${volume} and music started`);
  };
  (window as any).testFadeEffects = () => {
    console.log('🎵 Testing fade effects (should eliminate clicking)...');
    console.log('Playing sounds with 50ms fade-in and 100ms fade-out:');
    audioManager.playSound('drop');
    setTimeout(() => audioManager.playSound('place-good'), 200);
    setTimeout(() => audioManager.playSound('place-perfect'), 400);
    setTimeout(() => audioManager.playSound('wobble'), 600);
    setTimeout(() => audioManager.playSound('collapse'), 800);
    setTimeout(() => audioManager.playSound('level-complete'), 1000);
  };
  (window as any).testRapidSounds = () => {
    console.log('🎵 Testing rapid sound playback (stress test for fade system)...');
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        audioManager.playSound('drop');
      }, i * 100);
    }
  };

  // === Settings Debug Functions ===
  (window as any).debugSettings = () => {
    const settings = settingsManager.loadAudioSettings();
    console.log('🎛️ Current Audio Settings:', settings);
  };
  (window as any).resetSettings = () => {
    settingsManager.clearSettings();
    console.log('🔄 Settings reset to defaults');
  };

  // === Legacy Audio Functions (for compatibility) ===
  (window as any).resetAudioPool = () => {
    console.log('🔄 Audio pool reset - Phaser handles this automatically');
  };
  (window as any).forceAudioResume = () => {
    console.log('🔊 Audio resume - Phaser handles this automatically');
  };
  (window as any).retryAudioCreation = () => {
    console.log('🔄 Audio retry - Phaser handles this automatically');
  };
  (window as any).forceAudioRecovery = () => {
    console.log('🚀 Audio recovery - Phaser handles this automatically');
  };
  (window as any).forceLoadSounds = () => {
    console.log('🔊 Force load - Phaser handles this automatically');
  };
  (window as any).forceCreateBackgroundMusic = () => {
    console.log('🎵 Force create music - Phaser handles this automatically');
  };

  console.log('✅ Debug console functions ready! Type any function name to use.');
} 