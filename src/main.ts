import { Game, AUTO } from 'phaser';
import { GameScene } from '@/scenes/GameScene';
import { GAME_CONFIG } from '@/config/gameConfig';

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // We'll handle gravity per object
      debug: false
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
  scene: [GameScene]
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