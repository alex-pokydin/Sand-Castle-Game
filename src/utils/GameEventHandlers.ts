import { Game } from 'phaser';

/**
 * Game Event Handlers
 * 
 * This file handles game-specific events like state saving triggers.
 * Separated from main.ts to keep initialization logic clean.
 */

export function setupGameEventHandlers(game: Game): void {
  console.log('[Events] ⚙️ Setting up game event handlers...');

  setupImmediateStateSaving(game);

  console.log('[Events] ✅ Game event handlers ready');
}

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