import { Scene } from 'phaser';
import { COLORS } from '@/config/gameConfig';

/**
 * VisualEffects handles all particle effects, glows, and smooth animations
 * for enhanced visual feedback and polish
 */
export class VisualEffects {
  private scene: Scene;
  private particleManagers: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Create sand dust particles when a part lands
   */
  createSandDustEffect(x: number, y: number, intensity: number = 1): void {
    const particles = this.scene.add.particles(x, y, 'particle', {
      frame: 0,
      lifespan: 800,
      speed: { min: 50, max: 150 },
      scale: { start: 0.3 * intensity, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: COLORS.SAND_LIGHT,
      gravityY: 100,
      quantity: Math.floor(15 * intensity),
      blendMode: 'ADD',
      emitZone: {
        type: 'circle',
        source: new Phaser.Geom.Circle(0, 0, 20)
      } as any
    });

    // Auto-destroy after emission
    this.scene.time.delayedCall(100, () => {
      particles.destroy();
    });
  }

  /**
   * Create destruction explosion particles
   */
  createDestructionEffect(x: number, y: number, color: number = COLORS.RED): void {
    const particles = this.scene.add.particles(x, y, 'particle', {
      frame: 0,
      lifespan: 1200,
      speed: { min: 100, max: 300 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: color,
      gravityY: 50,
      quantity: 25,
      blendMode: 'ADD',
      emitZone: {
        type: 'circle',
        source: new Phaser.Geom.Circle(0, 0, 30)
      } as any
    });

    // Auto-destroy after emission
    this.scene.time.delayedCall(200, () => {
      particles.destroy();
    });
  }

  /**
   * Create success sparkle effect
   */
  createSuccessSparkles(x: number, y: number): void {
    const particles = this.scene.add.particles(x, y, 'particle', {
      frame: 0,
      lifespan: 1500,
      speed: { min: 30, max: 80 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: COLORS.GREEN,
      gravityY: -50,
      quantity: 12,
      blendMode: 'ADD',
      emitZone: {
        type: 'circle',
        source: new Phaser.Geom.Circle(0, 0, 15)
      } as any
    });

    // Auto-destroy after emission
    this.scene.time.delayedCall(300, () => {
      particles.destroy();
    });
  }

  /**
   * Create glow effect around a game object
   */
  createGlowEffect(target: Phaser.GameObjects.GameObject, color: number, intensity: number = 1): Phaser.GameObjects.Graphics {
    const glow = this.scene.add.graphics();
    
    // Position glow at target's position
    const targetX = (target as any).x || 0;
    const targetY = (target as any).y || 0;
    const targetWidth = (target as any).width || 50;
    const targetHeight = (target as any).height || 50;
    
    glow.setPosition(targetX, targetY);
    
    // Create glow effect
    glow.lineStyle(4 * intensity, color, 0.6);
    glow.strokeRoundedRect(-targetWidth / 2 - 2, -targetHeight / 2 - 2, targetWidth + 4, targetHeight + 4, 4);
    
    // Add inner glow
    glow.lineStyle(2 * intensity, color, 0.3);
    glow.strokeRoundedRect(-targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight, 2);
    
    return glow;
  }

  /**
   * Create pulsing glow effect
   */
  createPulsingGlow(target: Phaser.GameObjects.GameObject, color: number, duration: number = 1000): Phaser.GameObjects.Graphics {
    const glow = this.createGlowEffect(target, color);
    
    // Create pulsing animation
    this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.8, to: 0.2 },
      scaleX: { from: 1.1, to: 0.9 },
      scaleY: { from: 1.1, to: 0.9 },
      duration: duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    return glow;
  }

  /**
   * Create smooth bounce animation for text
   */
  createBounceAnimation(target: Phaser.GameObjects.GameObject, delay: number = 0): void {
    this.scene.tweens.add({
      targets: target,
      scaleX: { from: 0, to: 1.2 },
      scaleY: { from: 0, to: 1.2 },
      alpha: { from: 0, to: 1 },
      duration: 400,
      delay: delay,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: target,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
  }

  /**
   * Create floating animation for UI elements
   */
  createFloatingAnimation(target: Phaser.GameObjects.GameObject, amplitude: number = 5): void {
    const startY = (target as any).y || 0;
    
    this.scene.tweens.add({
      targets: target,
      y: startY - amplitude,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Create shake effect for unstable parts
   */
  createShakeEffect(target: Phaser.GameObjects.GameObject, intensity: number = 5, duration: number = 500): void {
    const startX = (target as any).x || 0;
    const startY = (target as any).y || 0;
    
    this.scene.tweens.add({
      targets: target,
      x: { from: startX - intensity, to: startX + intensity },
      y: { from: startY - intensity, to: startY + intensity },
      duration: 50,
      yoyo: true,
      repeat: Math.floor(duration / 100),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        (target as any).setPosition?.(startX, startY);
      }
    });
  }

  /**
   * Create level completion celebration effect
   */
  createLevelCompleteEffect(x: number, y: number): void {
    // Create multiple particle bursts
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const angle = (i / 5) * Math.PI * 2;
        const burstX = x + Math.cos(angle) * 50;
        const burstY = y + Math.sin(angle) * 50;
        
        const particles = this.scene.add.particles(burstX, burstY, 'particle', {
          frame: 0,
          lifespan: 2000,
          speed: { min: 80, max: 200 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          tint: [COLORS.GREEN, COLORS.SAND_LIGHT, COLORS.OCEAN],
          gravityY: -30,
          quantity: 8,
          blendMode: 'ADD',
          emitZone: {
            type: 'circle',
            source: new Phaser.Geom.Circle(0, 0, 10)
          } as any
        });

        this.scene.time.delayedCall(500, () => {
          particles.destroy();
        });
      });
    }
  }

  /**
   * Create smooth fade transition
   */
  createFadeTransition(target: Phaser.GameObjects.GameObject, fadeIn: boolean = true, duration: number = 500): void {
    this.scene.tweens.add({
      targets: target,
      alpha: fadeIn ? 1 : 0,
      duration: duration,
      ease: 'Power2'
    });
  }

  /**
   * Create smooth scale transition
   */
  createScaleTransition(target: Phaser.GameObjects.GameObject, scale: number, duration: number = 300): void {
    this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: duration,
      ease: 'Power2'
    });
  }

  /**
   * Create smooth slide transition
   */
  createSlideTransition(target: Phaser.GameObjects.GameObject, x: number, y: number, duration: number = 300): void {
    this.scene.tweens.add({
      targets: target,
      x: x,
      y: y,
      duration: duration,
      ease: 'Power2'
    });
  }

  /**
   * Create ripple effect (for button clicks)
   */
  createRippleEffect(x: number, y: number, color: number = COLORS.WHITE): void {
    const ripple = this.scene.add.graphics();
    ripple.setPosition(x, y);
    
    this.scene.tweens.add({
      targets: ripple,
      scaleX: { from: 0, to: 3 },
      scaleY: { from: 0, to: 3 },
      alpha: { from: 0.6, to: 0 },
      duration: 600,
      ease: 'Power2',
      onUpdate: () => {
        ripple.clear();
        ripple.lineStyle(2, color, ripple.alpha);
        ripple.strokeCircle(0, 0, 20);
      },
      onComplete: () => {
        ripple.destroy();
      }
    });
  }

  /**
   * Create smooth color transition
   */
  createColorTransition(target: Phaser.GameObjects.GameObject, startColor: number, endColor: number, duration: number = 1000): void {
    const startRGB = Phaser.Display.Color.ValueToColor(startColor);
    const endRGB = Phaser.Display.Color.ValueToColor(endColor);
    
    this.scene.tweens.add({
      targets: {},
      progress: { from: 0, to: 1 },
      duration: duration,
      ease: 'Power2',
      onUpdate: (tween) => {
        const progress = tween.progress;
        const currentColor = Phaser.Display.Color.Interpolate.ColorWithColor(startRGB, endRGB, 255, progress * 255);
        (target as any).setTint?.(Phaser.Display.Color.GetColor(currentColor.r, currentColor.g, currentColor.b));
      }
    });
  }

  /**
   * Clean up all effects
   */
  destroy(): void {
    this.particleManagers.forEach(manager => {
      manager.destroy();
    });
    this.particleManagers.clear();
  }
} 