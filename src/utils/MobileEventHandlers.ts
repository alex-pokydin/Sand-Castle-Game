import { Game } from 'phaser';

/**
 * Mobile Event Handlers
 * 
 * This file handles mobile-specific events and optimizations.
 * Separated from main.ts to keep initialization logic clean.
 */

export function setupMobileEventHandlers(game: Game): (() => void) {
  console.log('[Mobile] 📱 Setting up mobile event handlers...');

  // Handle window resize for mobile
  const handleResize = () => {
    game.scale.refresh();
  };
  window.addEventListener('resize', handleResize);

  // Prevent context menu on touch devices
  const preventContextMenu = (e: Event) => {
    e.preventDefault();
  };
  document.addEventListener('contextmenu', preventContextMenu);

  // Prevent scrolling/bounce on mobile
  const preventTouchMove = (e: TouchEvent) => {
    e.preventDefault();
  };
  document.addEventListener('touchmove', preventTouchMove, { passive: false });

  console.log('[Mobile] ✅ Mobile event handlers ready');

  // Return cleanup function for potential future use
  return () => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('contextmenu', preventContextMenu);
    document.removeEventListener('touchmove', preventTouchMove);
    console.log('[Mobile] 🧹 Mobile event handlers cleaned up');
  };
} 