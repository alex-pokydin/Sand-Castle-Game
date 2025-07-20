import { Game } from 'phaser';
import { phaserConfig } from '@/config/phaserConfig';
import { SystemInitializer } from '@/utils/SystemInitializer';

/**
 * Main Game Entry Point
 * 
 * This file serves as the main entry point for the Sand Castle Game.
 * It creates the Phaser game instance and delegates all initialization
 * to the SystemInitializer for clean separation of concerns.
 * 
 * All complex logic has been extracted to dedicated modules:
 * - Game config: src/config/phaserConfig.ts
 * - Scene registry: src/scenes.ts
 * - System initialization: src/utils/SystemInitializer.ts
 * - Debug functions: src/utils/DebugConsole.ts
 * - Mobile events: src/utils/MobileEventHandlers.ts
 * - Game events: src/utils/GameEventHandlers.ts
 */

console.log('[Main] 🎮 Initializing Sand Castle Game...');

// Create the Phaser game instance
const game = new Game(phaserConfig);

// Create system initializer
const systemInitializer = new SystemInitializer(game);

// Wait for Phaser to be ready, then initialize all systems
game.events.once('ready', () => {
  console.log('[Main] ⚡ Phaser ready, starting system initialization...');
  
  systemInitializer
    .initializeAllSystems()
    .catch(error => {
      console.error('[Main] ❌ System initialization failed:', error);
      systemInitializer.handleInitializationError(error);
    });
});

// Export game instance for potential external use
export default game; 