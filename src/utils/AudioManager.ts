import { Howl, Howler } from 'howler';

/**
 * AudioManager handles all sound effects and background music using Howler.js
 * Optimized for mobile devices with proper audio context handling
 */
export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private isAudioContextReady: boolean = false;
  
  private constructor() {
    this.setupAudioContext();
  }
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
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
        onloaderror: (_soundId, error) => {
          console.warn(`Failed to load sound ${id}:`, error);
          // Create silent placeholder to prevent errors
          this.sounds.set(id, new Howl({ src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMe'] }));
        },
        onload: () => {
          console.log(`Sound ${id} loaded successfully`);
        }
      });
      
      this.sounds.set(id, sound);
    } catch (error) {
      console.warn(`Error creating sound ${id}:`, error);
      // Create silent placeholder
      this.sounds.set(id, new Howl({ src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMe'] }));
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
   * Play drop sound with decreasing pitch effect
   */
  public playDropSound(): void {
    this.playSound('drop', { rate: 1.2 }); // Slightly higher pitch for drop
  }
  
  /**
   * Play placement sound based on stability
   */
  public playPlacementSound(stabilityLevel: 'stable' | 'warning' | 'unstable'): void {
    switch (stabilityLevel) {
      case 'stable':
        this.playSound('place-perfect');
        break;
      case 'warning':
        this.playSound('place-good');
        break;
      case 'unstable':
        this.playSound('wobble');
        break;
    }
  }
  
  /**
   * Play collapse sound
   */
  public playCollapseSound(): void {
    this.playSound('collapse');
  }
  
  /**
   * Play level complete sound
   */
  public playLevelCompleteSound(): void {
    this.playSound('level-complete');
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
    return this.isMuted;
  }
  
  /**
   * Check if audio is muted
   */
  public isMutedState(): boolean {
    return this.isMuted;
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
   * Destroy all sounds (cleanup)
   */
  public destroy(): void {
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
  }
} 