import { Game, AUTO } from 'phaser';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { GameOverScene } from '@/scenes/GameOverScene';
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
  scene: [MenuScene, GameScene, GameOverScene]
};

// Initialize the game
const game = new Game(config);

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

export default game; 