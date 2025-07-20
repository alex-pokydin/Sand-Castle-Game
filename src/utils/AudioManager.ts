/**
 * Simple AudioManager using Phaser's built-in sound system
 * Phaser handles mobile audio context, pooling, and cross-platform compatibility automatically
 */
import { SettingsManager, AudioSettings } from '@/utils/SettingsManager';

export class AudioManager {
  private static instance: AudioManager;
  private scene?: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private backgroundMusic?: Phaser.Sound.BaseSound;
  private currentMusicKey?: string; // Track which music is currently playing
  private settingsManager: SettingsManager;
  private currentSettings: AudioSettings;
  private isInitialized: boolean = false;
  private musicFadeTween?: Phaser.Tweens.Tween;

  private constructor() {
    this.settingsManager = SettingsManager.getInstance();
    this.currentSettings = this.settingsManager.loadAudioSettings();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize with a Phaser scene (needed for sound creation)
   */
  public init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Load all game sounds
   */
  public loadSounds(): void {
    if (!this.scene) {
      console.warn('AudioManager: Scene not initialized');
      return;
    }

    // Load sound effects
    this.scene.load.audio('drop', 'assets/sounds/effects/drop.wav');
    this.scene.load.audio('place-good', 'assets/sounds/effects/place-good.wav');
    this.scene.load.audio('place-perfect', 'assets/sounds/effects/place-perfect.wav');
    this.scene.load.audio('wobble', 'assets/sounds/effects/wobble.wav');
    this.scene.load.audio('collapse', 'assets/sounds/effects/collapse.wav');
    this.scene.load.audio('level-complete', 'assets/sounds/effects/level-complete.wav');
    
    // Load background music tracks
    this.scene.load.audio('background-music', 'assets/sounds/music/beach-ambient.mp3');
    this.scene.load.audio('menu-theme', 'assets/sounds/music/menu-theme.mp3');
    this.scene.load.audio('achievement', 'assets/sounds/music/achievement.mp3');
    this.scene.load.audio('level-complete-music', 'assets/sounds/music/level-complete.mp3');

    // Start loading
    this.scene.load.start();
  }

  /**
   * Create sound objects after loading is complete and apply settings
   */
  public createSounds(): void {
    if (!this.scene) return;

    // Create sound effects with Phaser's built-in pooling
    this.sounds.set('drop', this.scene.sound.add('drop', { volume: 0.6 }));
    this.sounds.set('place-good', this.scene.sound.add('place-good', { volume: 0.8 }));
    this.sounds.set('place-perfect', this.scene.sound.add('place-perfect', { volume: 0.9 }));
    this.sounds.set('wobble', this.scene.sound.add('wobble', { volume: 0.4 }));
    this.sounds.set('collapse', this.scene.sound.add('collapse', { volume: 0.7 }));
    this.sounds.set('level-complete', this.scene.sound.add('level-complete', { volume: 0.8 }));

    // Create background music (default)
    this.backgroundMusic = this.scene.sound.add('background-music', { 
      volume: this.currentSettings.musicVolume, 
      loop: true 
    });
    this.currentMusicKey = 'background-music';

    // Apply current settings
    this.applyCurrentSettings();
    this.isInitialized = true;
  }

  /**
   * Apply current settings to audio system
   */
  private applyCurrentSettings(): void {
    if (!this.scene) return;

    // Apply effects volume (not affected by global mute)
    this.scene.sound.setVolume(this.currentSettings.effectsVolume);
    
    // Apply music settings
    if (this.backgroundMusic) {
      (this.backgroundMusic as any).volume = this.currentSettings.musicVolume;
      
      if (this.currentSettings.musicEnabled) {
        this.backgroundMusic.play();
      } else {
        this.backgroundMusic.stop();
      }
    }
  }

  /**
   * Reload settings from SettingsManager and apply them
   */
  public reloadSettings(): void {
    this.currentSettings = this.settingsManager.loadAudioSettings();
    if (this.isInitialized) {
      this.applyCurrentSettings();
    }
  }

  /**
   * Play a sound effect
   */
  public playSound(id: string, options?: { volume?: number; rate?: number }): void {
    // Check both effects enabled and master mute
    if (!this.currentSettings.effectsEnabled || this.currentSettings.isMuted) return;

    const sound = this.sounds.get(id);
    if (sound) {
      const config: Phaser.Types.Sound.SoundConfig = {};
      
      if (options?.volume !== undefined) {
        config.volume = options.volume * this.currentSettings.effectsVolume;
      }
      if (options?.rate !== undefined) {
        config.rate = options.rate;
      }
      
      sound.play(config);
    } else {
      console.warn(`Sound '${id}' not found`);
    }
  }

  /**
   * Start background music immediately
   */
  public startBackgroundMusic(): void {
    this.stopMusicFade(); // Stop any existing fade
    if (this.backgroundMusic && this.currentSettings.musicEnabled) {
      // Set to current volume before playing
      (this.backgroundMusic as any).volume = this.currentSettings.musicVolume;
      this.backgroundMusic.play();
    }
  }

  /**
   * Start background music with fade in effect
   * Smart continuation: if the same music is already playing, don't restart it
   */
  public fadeInBackgroundMusic(duration: number = 2000, musicKey?: string): void {
    // Use default background music if no key specified
    const targetMusicKey = musicKey || 'background-music';
    
    // Smart continuation: if the same music is already playing, just continue
    if (this.isCurrentMusicPlaying(targetMusicKey)) {
      console.log(`[AudioManager] Continuing ${targetMusicKey} - same track already playing`);
      return;
    }

    // Switch to different music if specified
    if (targetMusicKey !== this.currentMusicKey) {
      console.log(`[AudioManager] Switching music: ${this.currentMusicKey || 'none'} → ${targetMusicKey}`);
      this.switchBackgroundMusic(targetMusicKey);
    }

    if (!this.backgroundMusic || !this.currentSettings.musicEnabled) {
      return;
    }

    this.stopMusicFade(); // Stop any existing fade
    
    // Start music at volume 0
    (this.backgroundMusic as any).volume = 0;
    this.backgroundMusic.play();
    
    // Fade in to current volume setting (updates dynamically during fade)
    if (this.scene) {
      this.musicFadeTween = this.scene.tweens.add({
        targets: { progress: 0 },
        progress: 1,
        duration: duration,
        ease: 'Power2.easeOut',
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          if (this.backgroundMusic) {
            const progress = tween.getValue() || 0;
            // Always use current volume setting as target
            (this.backgroundMusic as any).volume = progress * this.currentSettings.musicVolume;
          }
        }
      });
    }
  }

  /**
   * Check if the specified music track is currently playing
   */
  private isCurrentMusicPlaying(musicKey: string): boolean {
    return !!(this.currentMusicKey === musicKey && 
              this.backgroundMusic && 
              this.backgroundMusic.isPlaying);
  }

  /**
   * Switch to a different background music track
   */
  private switchBackgroundMusic(musicKey: string): void {
    if (!this.scene) return;

    // Stop current music if playing
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }

    // Create new background music
    this.backgroundMusic = this.scene.sound.add(musicKey, { 
      volume: this.currentSettings.musicVolume, 
      loop: true 
    });
    this.currentMusicKey = musicKey;
  }

  /**
   * Stop background music with fade out effect
   */
  public fadeOutBackgroundMusic(duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) {
        resolve();
        return;
      }

      this.stopMusicFade(); // Stop any existing fade
      
      if (this.scene) {
        // Start fade from current volume setting (not whatever volume happens to be set)
        const startVolume = this.currentSettings.musicVolume;
        (this.backgroundMusic as any).volume = startVolume;
        
        this.musicFadeTween = this.scene.tweens.add({
          targets: { progress: 0 },
          progress: 1,
          duration: duration,
          ease: 'Power2.easeIn',
          onUpdate: (tween: Phaser.Tweens.Tween) => {
            if (this.backgroundMusic) {
              const progress = tween.getValue() || 0;
              // Fade from current volume setting to 0
              (this.backgroundMusic as any).volume = startVolume * (1 - progress);
            }
          },
          onComplete: () => {
            this.backgroundMusic?.stop();
            resolve();
          }
        });
      } else {
        this.backgroundMusic.stop();
        resolve();
      }
    });
  }

  /**
   * Stop background music immediately
   */
  public stopBackgroundMusic(): void {
    this.stopMusicFade();
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
  }

  /**
   * Smart music transition: only stop if switching to different music or no music
   */
  public handleMusicTransition(nextMusicKey?: string): void {
    // If next scene has no music, stop current music
    if (!nextMusicKey) {
      console.log('[AudioManager] Next scene has no music - stopping current music');
      this.stopAllMusic();
      return;
    }

    // If next scene has same music, keep playing
    if (this.isCurrentMusicPlaying(nextMusicKey)) {
      console.log(`[AudioManager] Same music (${nextMusicKey}) - continuing seamlessly`);
      return;
    }

    // Different music - stop current and prepare for switch
    console.log(`[AudioManager] Music change: ${this.currentMusicKey || 'none'} → ${nextMusicKey}`);
    this.stopAllMusic();
  }

  /**
   * Stop all music (for scene transitions)
   */
  public stopAllMusic(): void {
    this.stopMusicFade();
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    this.currentMusicKey = undefined;
  }

  /**
   * Pause background music
   */
  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Resume background music
   */
  public resumeBackgroundMusic(): void {
    if (this.backgroundMusic && this.currentSettings.musicEnabled) {
      this.backgroundMusic.resume();
    }
  }

  /**
   * Stop any active music fade tween
   */
  private stopMusicFade(): void {
    if (this.musicFadeTween) {
      this.musicFadeTween.remove();
      this.musicFadeTween = undefined;
    }
  }

  /**
   * Set master volume and save to settings
   */
  public setVolume(volume: number): void {
    this.currentSettings.effectsVolume = Math.max(0, Math.min(1, volume));
    
    // Apply to Phaser
    if (this.scene) {
      this.scene.sound.setVolume(this.currentSettings.effectsVolume);
    }
    
    // Save settings
    this.settingsManager.saveAudioSettings(this.currentSettings);
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.currentSettings.effectsVolume;
  }

  /**
   * Set music volume and save to settings
   */
  public setMusicVolume(volume: number): void {
    this.currentSettings.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Immediately apply to currently playing music (if not fading)
    this.applyCurrentMusicVolume();
    
    // Save settings
    this.settingsManager.saveAudioSettings(this.currentSettings);
  }

  /**
   * Apply current music volume setting to playing music
   * (unless a fade is in progress, which manages volume dynamically)
   */
  private applyCurrentMusicVolume(): void {
    if (this.backgroundMusic && !this.musicFadeTween) {
      (this.backgroundMusic as any).volume = this.currentSettings.musicVolume;
    }
  }

  /**
   * Get current music volume
   */
  public getMusicVolume(): number {
    return this.currentSettings.musicVolume;
  }

  /**
   * Toggle master mute state (affects everything) and save to settings
   * Note: Use setMusicEnabled() and setEffectsEnabled() for separate control
   */
  public toggleMute(): boolean {
    this.currentSettings.isMuted = !this.currentSettings.isMuted;
    
    // Master mute affects everything
    if (this.scene) {
      this.scene.sound.setMute(this.currentSettings.isMuted);
    }
    
    // Handle background music
    if (this.currentSettings.isMuted) {
      this.pauseBackgroundMusic();
    } else if (this.currentSettings.musicEnabled) {
      this.resumeBackgroundMusic();
    }
    
    // Save settings
    this.settingsManager.saveAudioSettings(this.currentSettings);
    
    return this.currentSettings.isMuted;
  }

  /**
   * Set music enabled state and save to settings
   */
  public setMusicEnabled(enabled: boolean): void {
    this.currentSettings.musicEnabled = enabled;
    
    if (enabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    
    // Save settings
    this.settingsManager.saveAudioSettings(this.currentSettings);
  }

  /**
   * Check if audio is muted
   */
  public isMutedState(): boolean {
    return this.currentSettings.isMuted;
  }

  /**
   * Check if music is enabled
   */
  public isMusicEnabled(): boolean {
    return this.currentSettings.musicEnabled;
  }

  /**
   * Set effects enabled state and save to settings
   */
  public setEffectsEnabled(enabled: boolean): void {
    this.currentSettings.effectsEnabled = enabled;
    
    // Save settings
    this.settingsManager.saveAudioSettings(this.currentSettings);
  }

  /**
   * Check if effects are enabled
   */
  public isEffectsEnabled(): boolean {
    return this.currentSettings.effectsEnabled;
  }

  /**
   * Get current audio settings
   */
  public getCurrentSettings(): AudioSettings {
    return { ...this.currentSettings };
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    if (this.scene) {
      this.scene.sound.stopAll();
    }
  }

  /**
   * Cleanup all audio resources
   */
  public destroy(): void {
    this.stopAll();
    this.sounds.clear();
    this.backgroundMusic = undefined;
    this.scene = undefined;
    this.isInitialized = false;
  }

  // Legacy methods for compatibility with existing code
  public loadBasicSounds(): void {
    // For compatibility - actual loading happens in scene preload
    console.log('AudioManager: Use scene.load methods and call createSounds() after loading');
  }

  public getAudioPoolStatus(): any {
    return {
      healthy: true,
      soundCount: this.sounds.size,
      musicLoaded: !!this.backgroundMusic,
      settings: this.currentSettings
    };
  }

  public resetAudioPool(): void {
    // Phaser handles pooling automatically
  }

  public forceAudioContextResume(): void {
    // Phaser handles audio context automatically
  }

  public retryAudioCreation(): void {
    // Phaser handles retries automatically
  }

  public forceAudioRecovery(): void {
    // Phaser handles recovery automatically
  }

  public forceLoadSounds(): void {
    // Phaser handles loading automatically
  }

  public forceCreateBackgroundMusic(): void {
    // Phaser handles creation automatically
  }
} 