/**
 * Scene Registry
 * 
 * This file defines all available scenes in the game.
 * To add a new scene:
 * 1. Import your scene class
 * 2. Add it to the SCENES object
 * 
 * The key should match the scene's constructor key parameter.
 */

import { BaseScene } from '@/scenes/BaseScene';
import { MenuScene } from '@/scenes/MenuScene';
import { GameScene } from '@/scenes/GameScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { LevelCompleteScene } from '@/scenes/LevelCompleteScene';
import { SettingsScene } from '@/scenes/SettingsScene';

export const SCENES: Record<string, typeof BaseScene> = {
  'MenuScene': MenuScene,
  'GameScene': GameScene,
  'GameOverScene': GameOverScene,
  'LevelCompleteScene': LevelCompleteScene,
  'SettingsScene': SettingsScene
};

// Export scene keys for convenience
export const SCENE_KEYS = Object.keys(SCENES);

// Helper function to check if a scene exists
export function isValidScene(sceneKey: string): boolean {
  return SCENES.hasOwnProperty(sceneKey);
}

// Helper function to get all scene names
export function getAllScenes(): string[] {
  return SCENE_KEYS;
} 