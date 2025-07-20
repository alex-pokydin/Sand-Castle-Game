/**
 * Settings Manager - Handles game settings persistence and propagation
 */
export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  isMuted: boolean;
  musicEnabled: boolean;
  effectsEnabled: boolean;
}

export class SettingsManager {
  private static instance: SettingsManager;
  private readonly SETTINGS_KEY = 'sand-castle-audio-settings';
  
  private constructor() {}

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get default audio settings
   */
  private getDefaultSettings(): AudioSettings {
    return {
      masterVolume: 0.7,
      musicVolume: 0.4,
      effectsVolume: 0.7,
      isMuted: false,
      musicEnabled: true,
      effectsEnabled: true
    };
  }

  /**
   * Load audio settings from localStorage
   */
  public loadAudioSettings(): AudioSettings {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved) as AudioSettings;
        // Ensure all required properties exist (for backwards compatibility)
        return {
          ...this.getDefaultSettings(),
          ...settings
        };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
    
    return this.getDefaultSettings();
  }

  /**
   * Save audio settings to localStorage
   */
  public saveAudioSettings(settings: AudioSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  /**
   * Apply settings to AudioManager
   */
  public applySettingsToAudioManager(audioManager: any, settings: AudioSettings): void {
    // Apply volume settings
    audioManager.setVolume(settings.effectsVolume);
    audioManager.setMusicVolume(settings.musicVolume);
    
    // Apply mute state
    if (settings.isMuted) {
      audioManager.toggleMute();
    }
    
    // Apply music enabled/disabled state
    if (settings.musicEnabled) {
      audioManager.startBackgroundMusic();
    } else {
      audioManager.stopBackgroundMusic();
    }
  }

  /**
   * Get current settings and update them with AudioManager state
   */
  public syncSettingsWithAudioManager(audioManager: any): AudioSettings {
    return {
      masterVolume: audioManager.getVolume(),
      musicVolume: audioManager.getMusicVolume(),
      effectsVolume: audioManager.getVolume(),
      isMuted: audioManager.isMutedState(),
      musicEnabled: audioManager.isMusicEnabled(),
      effectsEnabled: audioManager.isEffectsEnabled ? audioManager.isEffectsEnabled() : true
    };
  }

  /**
   * Clear all settings (reset to defaults)
   */
  public clearSettings(): void {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.warn('Failed to clear settings:', error);
    }
  }
} 