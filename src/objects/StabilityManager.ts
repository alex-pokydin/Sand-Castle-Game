import { CastlePartData, StabilityResult } from '@/types/Game';

/**
 * StabilityManager handles physics-based stability detection for castle parts
 * using Matter.js for realistic sand-like behavior
 */
export class StabilityManager {
  private static readonly STABLE_VELOCITY_THRESHOLD = 0.1;
  private static readonly UNSTABLE_VELOCITY_THRESHOLD = 0.5;
  private static readonly CHECK_INTERVAL = 100; // ms
  
  private lastCheckTime: number = 0;
  
  /**
   * Check stability of all castle parts using Matter.js physics
   */
  public checkStability(castleParts: CastlePartData[]): StabilityResult {
    const now = Date.now();
    
    // Throttle stability checks for performance
    if (now - this.lastCheckTime < StabilityManager.CHECK_INTERVAL) {
      return this.getLastResult(castleParts);
    }
    
    this.lastCheckTime = now;
    
    const unstableParts = castleParts.filter(part => 
      this.isPartUnstable(part)
    );
    
    const stabilityScore = this.calculateStabilityScore(castleParts, unstableParts);
    
    return {
      stable: unstableParts.length === 0,
      unstableParts,
      stabilityScore
    };
  }
  
  /**
   * Determine if a part is unstable based on velocity
   */
  private isPartUnstable(part: CastlePartData): boolean {
    const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
    return velocity > StabilityManager.STABLE_VELOCITY_THRESHOLD;
  }
  
  /**
   * Calculate overall stability score (0-1)
   */
  private calculateStabilityScore(allParts: CastlePartData[], unstableParts: CastlePartData[]): number {
    if (allParts.length === 0) return 1;
    return (allParts.length - unstableParts.length) / allParts.length;
  }
  
  /**
   * Get stability level for visual feedback
   */
  public getStabilityLevel(part: CastlePartData): 'stable' | 'warning' | 'unstable' {
    const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
    
    if (velocity <= StabilityManager.STABLE_VELOCITY_THRESHOLD) {
      return 'stable';
    } else if (velocity <= StabilityManager.UNSTABLE_VELOCITY_THRESHOLD) {
      return 'warning';
    } else {
      return 'unstable';
    }
  }
  
  /**
   * Calculate points based on stability
   */
  public calculateStabilityPoints(part: CastlePartData): number {
    const level = this.getStabilityLevel(part);
    
    switch (level) {
      case 'stable': return 100;  // Perfect stability
      case 'warning': return 75;  // Good stability
      case 'unstable': return 25; // Poor stability
      default: return 0;
    }
  }
  
  /**
   * Get fallback result when throttling checks
   */
  private getLastResult(_castleParts: CastlePartData[]): StabilityResult {
    // Simple fallback - assume current state is stable if no major movement
    return {
      stable: true,
      unstableParts: [],
      stabilityScore: 1
    };
  }
  
  /**
   * Check if castle has collapsed (major instability)
   */
  public hasCollapsed(castleParts: CastlePartData[]): boolean {
    if (castleParts.length === 0) return false;
    
    // Consider collapsed if more than 50% of parts are highly unstable
    const highlyUnstableParts = castleParts.filter(part => {
      const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
      return velocity > StabilityManager.UNSTABLE_VELOCITY_THRESHOLD * 2;
    });
    
    return highlyUnstableParts.length > castleParts.length * 0.5;
  }
} 