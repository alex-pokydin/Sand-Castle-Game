import { Howl, Howler } from 'howler';

/**
 * EnhancedAudioManager provides background music, adaptive audio,
 * and more sophisticated sound effects
 */
export class EnhancedAudioManager {
  private static instance: EnhancedAudioManager;
  private sounds: Map<string, Howl> = new Map();
  private backgroundMusic?: Howl;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private musicVolume: number = 0.4; // Lower than sound effects
  private isAudioContextReady: boolean = false;
  private isMusicPlaying: boolean = false;


  private constructor() {
    this.setupAudioContext();
    this.setupBackgroundMusic();
  }

  public static getInstance(): EnhancedAudioManager {
    if (!EnhancedAudioManager.instance) {
      EnhancedAudioManager.instance = new EnhancedAudioManager();
    }
    return EnhancedAudioManager.instance;
  }

  /**
   * Setup audio context for mobile compatibility
   */
  private setupAudioContext(): void {
    // Handle mobile audio restrictions
    const enableAudio = () => {
      if (!this.isAudioContextReady) {
        Howler.ctx?.resume();
        this.isAudioContextReady = true;
        document.removeEventListener('touchstart', enableAudio);
        document.removeEventListener('click', enableAudio);
      }
    };
    
    document.addEventListener('touchstart', enableAudio);
    document.addEventListener('click', enableAudio);
  }

  /**
   * Load basic sound effects for the game
   */
  public loadBasicSounds(): void {
    // Part drop sound - 0.2s whoosh decreasing pitch
    this.loadSound('drop', {
      src: ['assets/sounds/effects/drop.wav'],
      volume: 0.6,
      rate: 1.0
    });
    
    // Successful placement - 0.1s click sound
    this.loadSound('place-good', {
      src: ['assets/sounds/effects/place-good.wav'],
      volume: 0.8,
      rate: 1.0
    });
    
    // Perfect placement - 0.5s ascending chime
    this.loadSound('place-perfect', {
      src: ['assets/sounds/effects/place-perfect.wav'],
      volume: 0.9,
      rate: 1.0
    });
    
    // Unstable warning - 0.1s wobble sound
    this.loadSound('wobble', {
      src: ['assets/sounds/effects/wobble.wav'],
      volume: 0.4,
      rate: 1.0,
      loop: false
    });
    
    // Castle collapse - 1s collapse sound
    this.loadSound('collapse', {
      src: ['assets/sounds/effects/collapse.wav'],
      volume: 0.7,
      rate: 1.0
    });
    
    // Level complete - 2s celebratory melody
    this.loadSound('level-complete', {
      src: ['assets/sounds/effects/level-complete.wav'],
      volume: 0.8,
      rate: 1.0
    });
  }

  /**
   * Load a single sound with error handling
   */
  private loadSound(id: string, config: any): void {
    try {
      const sound = new Howl({
        ...config,
        volume: config.volume * this.volume,
        pool: 2, // Limit concurrent instances of this sound
        onloaderror: (_soundId, error) => {
          console.warn(`Failed to load sound ${id}:`, error);
          // Create silent placeholder to prevent errors
          this.sounds.set(id, new Howl({ 
            src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMe'],
            pool: 1
          }));
        },
        onload: () => {
          // Sound loaded successfully
        }
      });
      
      this.sounds.set(id, sound);
    } catch (error) {
      console.warn(`Error creating sound ${id}:`, error);
      // Create silent placeholder
      this.sounds.set(id, new Howl({ 
        src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMe'],
        pool: 1
      }));
    }
  }

  /**
   * Play a sound effect
   */
  public playSound(id: string, options?: { volume?: number; rate?: number }): void {
    if (this.isMuted || !this.isAudioContextReady) return;
    
    const sound = this.sounds.get(id);
    if (sound) {
      try {
        if (options?.volume !== undefined) {
          sound.volume(options.volume * this.volume);
        }
        if (options?.rate !== undefined) {
          sound.rate(options.rate);
        }
        sound.play();
      } catch (error) {
        console.warn(`Error playing sound ${id}:`, error);
      }
    } else {
      console.warn(`Sound ${id} not found`);
    }
  }

  /**
   * Check if audio is muted
   */
  public isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Setup background music with adaptive features
   */
  private setupBackgroundMusic(): void {
    // Create beach ambient music
    this.backgroundMusic = new Howl({
      src: ['assets/sounds/music/beach-ambient.mp3'],
      volume: this.musicVolume,
      loop: true,
      html5: true, // Better for longer audio files
      pool: 1, // Only one instance needed for background music
      onloaderror: (_soundId, error) => {
        console.warn('Failed to load background music:', error);
        // Create silent placeholder
        this.backgroundMusic = new Howl({ 
          src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMe'],
          volume: 0,
          loop: true,
          pool: 1
        });
      },
      onload: () => {
        console.log('Background music loaded successfully');
      }
    });
  }

  /**
   * Start background music
   */
  public startBackgroundMusic(): void {
    if (this.backgroundMusic && !this.isMusicPlaying && !this.isMutedState()) {
      this.backgroundMusic.play();
      this.isMusicPlaying = true;
    }
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.stop();
      this.isMusicPlaying = false;
    }
  }

  /**
   * Pause background music
   */
  public pauseBackgroundMusic(): void {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.pause();
      this.isMusicPlaying = false;
    }
  }

  /**
   * Resume background music
   */
  public resumeBackgroundMusic(): void {
    if (this.backgroundMusic && !this.isMusicPlaying && !this.isMutedState()) {
      this.backgroundMusic.play();
      this.isMusicPlaying = true;
    }
  }

  /**
   * Update music based on current level (adaptive audio)
   */
  public updateMusicForLevel(level: number): void {
    // Update music based on level
    
    if (this.backgroundMusic) {
      // Adjust tempo based on level (faster for higher levels)
      const tempoMultiplier = Math.min(1.5, 1 + (level - 1) * 0.1);
      this.backgroundMusic.rate(tempoMultiplier);
      
      // Slightly increase volume for higher levels
      const volumeMultiplier = Math.min(1.2, 1 + (level - 1) * 0.05);
      this.backgroundMusic.volume(this.musicVolume * volumeMultiplier);
    }
  }

  /**
   * Play enhanced drop sound with pitch variation
   */
  public playEnhancedDropSound(partLevel: number): void {
    // Higher level parts get higher pitch
    const pitchVariation = 0.8 + (partLevel - 1) * 0.1;
    this.playSound('drop', { rate: pitchVariation });
  }

  /**
   * Play enhanced placement sound with stability feedback
   */
  public playEnhancedPlacementSound(stabilityLevel: 'stable' | 'warning' | 'unstable', partLevel: number): void {
    // Add level-based pitch variation
    const pitchVariation = 0.9 + (partLevel - 1) * 0.05;
    
    switch (stabilityLevel) {
      case 'stable':
        this.playSound('place-perfect', { rate: pitchVariation });
        break;
      case 'warning':
        this.playSound('place-good', { rate: pitchVariation });
        break;
      case 'unstable':
        this.playSound('wobble', { rate: pitchVariation });
        break;
    }
  }

  /**
   * Play combo sound for consecutive successful placements
   */
  public playComboSound(comboCount: number): void {
    // Create ascending pitch for combo sounds
    const pitch = Math.min(1.5, 1 + comboCount * 0.1);
    this.playSound('place-good', { rate: pitch, volume: 0.9 });
  }

  /**
   * Play level progression sound
   */
  public playLevelProgressionSound(): void {
    // Play a special sound for level progression
    this.playSound('level-complete', { rate: 1.1, volume: 0.9 });
  }

  /**
   * Play achievement sound
   */
  public playAchievementSound(): void {
    // Play a special achievement sound
    this.playSound('place-perfect', { rate: 1.3, volume: 1.0 });
  }

  /**
   * Set master volume (0-1)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update all loaded sounds
    this.sounds.forEach(sound => {
      sound.volume(sound.volume() * this.volume);
    });
    
    // Update music volume proportionally
    if (this.backgroundMusic) {
      this.backgroundMusic.volume(this.musicVolume * volume);
    }
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    Howler.mute(this.isMuted);
    
    // Handle music based on mute state
    if (this.isMuted) {
      this.pauseBackgroundMusic();
    } else {
      this.resumeBackgroundMusic();
    }
    
    return this.isMuted;
  }

  /**
   * Set music volume separately from sound effects
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume(this.musicVolume * this.getVolume());
    }
  }

  /**
   * Get current music volume
   */
  public getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Play ambient sounds (waves, seagulls, etc.)
   */
  public playAmbientSound(type: 'waves' | 'seagull' | 'wind'): void {
    const ambientSounds = {
      waves: { src: 'assets/sounds/effects/waves.wav', volume: 0.3 },
      seagull: { src: 'assets/sounds/effects/seagull.wav', volume: 0.4 },
      wind: { src: 'assets/sounds/effects/wind.wav', volume: 0.2 }
    };
    
    const sound = ambientSounds[type];
    if (sound) {
      const ambientSound = new Howl({
        src: [sound.src],
        volume: sound.volume * this.getVolume(),
        onloaderror: () => {
          console.warn(`Failed to load ambient sound: ${type}`);
        }
      });
      
      ambientSound.play();
      
      // Auto-destroy after playing
      ambientSound.once('end', () => {
        ambientSound.unload();
      });
    }
  }

  /**
   * Create dynamic soundscape based on game state
   */
  public updateSoundscape(castleHeight: number, partCount: number): void {
    // Play ambient sounds based on castle progress
    if (castleHeight > 3 && Math.random() < 0.1) {
      this.playAmbientSound('seagull');
    }
    
    if (partCount > 5 && Math.random() < 0.05) {
      this.playAmbientSound('wind');
    }
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    this.sounds.forEach(sound => {
      sound.stop();
    });
  }

  /**
   * Destroy all sounds and music (cleanup)
   */
  public destroy(): void {
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
    
    if (this.backgroundMusic) {
      this.backgroundMusic.unload();
      this.backgroundMusic = undefined;
    }
    
    this.isMusicPlaying = false;
  }

  /**
   * Clean up audio resources to prevent memory leaks
   */
  public cleanup(): void {
    // Stop all currently playing sounds
    this.sounds.forEach(sound => {
      if (sound.playing()) {
        sound.stop();
      }
    });
    
    // Stop background music if playing
    if (this.backgroundMusic && this.backgroundMusic.playing()) {
      this.backgroundMusic.stop();
    }
  }
} 