import { AUTO } from 'phaser';
import { GAME_CONFIG, PHYSICS_CONFIG } from '@/config/gameConfig';

/**
 * Phaser Game Configuration
 * 
 * This file contains all the core Phaser.js configuration.
 * Separated from main.ts to keep initialization logic clean.
 */
export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: PHYSICS_CONFIG.gravity },
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
  // Don't auto-start any scenes - we'll determine the correct one after initialization
  autoFocus: false
}; 