import { CastlePartData, StabilityResult } from '@/types/Game';

/**
 * StabilityManager handles physics-based stability detection for castle parts
 * using Matter.js for realistic sand-like behavior
 */
export class StabilityManager {
  private static readonly STABLE_VELOCITY_THRESHOLD = 0.05; // More forgiving for success
  private static readonly UNSTABLE_VELOCITY_THRESHOLD = 0.3; // Tightened for clearer failure
  private static readonly CHECK_INTERVAL = 100; // ms
  
  private lastCheckTime: number = 0;
  private stabilityHistory: Map<string, number[]> = new Map(); // Track stability over time
  
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
   * Determine if a part is unstable based on velocity with historical smoothing
   */
  private isPartUnstable(part: CastlePartData): boolean {
    const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
    
    // Track velocity history for smoother stability detection
    if (!this.stabilityHistory.has(part.id)) {
      this.stabilityHistory.set(part.id, []);
    }
    
    const history = this.stabilityHistory.get(part.id)!;
    history.push(velocity);
    
    // Keep only last 5 measurements
    if (history.length > 5) {
      history.shift();
    }
    
    // Average velocity over recent history for stability
    const avgVelocity = history.reduce((sum, v) => sum + v, 0) / history.length;
    
    return avgVelocity > StabilityManager.STABLE_VELOCITY_THRESHOLD;
  }
  
  /**
   * Calculate overall stability score (0-1)
   */
  private calculateStabilityScore(allParts: CastlePartData[], unstableParts: CastlePartData[]): number {
    if (allParts.length === 0) return 1;
    return (allParts.length - unstableParts.length) / allParts.length;
  }
  
  /**
   * Get stability level for visual feedback with improved thresholds
   */
  public getStabilityLevel(part: CastlePartData): 'stable' | 'warning' | 'unstable' {
    const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
    
    // More forgiving thresholds for better user experience
    if (velocity <= StabilityManager.STABLE_VELOCITY_THRESHOLD) {
      return 'stable';
    } else if (velocity <= StabilityManager.UNSTABLE_VELOCITY_THRESHOLD) {
      return 'warning';
    } else {
      return 'unstable';
    }
  }
  
  /**
   * Calculate points based on stability with bonus for perfect placements
   */
  public calculateStabilityPoints(part: CastlePartData): number {
    const level = this.getStabilityLevel(part);
    const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
    
    switch (level) {
      case 'stable': 
        // Bonus points for extremely stable placements
        if (velocity <= 0.01) {
          return 150; // Perfect placement bonus
        }
        return 100;  // Standard stable placement
        
      case 'warning': return 75;  // Good but not perfect stability
      case 'unstable': return 25; // Poor stability - minimal points
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
    // Need at least 2 parts to have a meaningful collapse
    if (castleParts.length < 2) return false;
    
    // Filter out parts that are likely just falling naturally (high Y velocity, low X velocity)
    const settledParts = castleParts.filter(part => {
      const yVel = Math.abs(part.velocity.y);
      const xVel = Math.abs(part.velocity.x);
      
      // If part is falling straight down fast, it's probably just dropping, not collapsing
      if (yVel > 2 && xVel < 0.5) {
        return false; // Exclude from collapse consideration
      }
      return true; // Include in collapse analysis
    });
    
    // Need at least 2 settled parts to check for collapse
    if (settledParts.length < 2) return false;
    
    // Consider collapsed if more than 60% of settled parts are highly unstable
    // Use a higher threshold for "highly unstable" to avoid false positives
    const highlyUnstableParts = settledParts.filter(part => {
      const velocity = Math.abs(part.velocity.x) + Math.abs(part.velocity.y);
      // Increased threshold to avoid detecting normal settling as collapse
      return velocity > StabilityManager.UNSTABLE_VELOCITY_THRESHOLD * 3; // Was * 2, now * 3
    });
    
    // Require more than 60% to be unstable (was 50%)
    return highlyUnstableParts.length > settledParts.length * 0.6;
  }
  
  /**
   * Calculate level-based stability points for a part
   * Higher level parts get more points when stable
   */
  public calculateLevelBasedStabilityPoints(part: CastlePartData): number {
    const basePoints = this.calculateStabilityPoints(part);
    
    // Level multiplier: higher levels get more points
    const levelMultiplier = part.level || 1;
    
    // Apply level multiplier to base points
    return Math.floor(basePoints * levelMultiplier);
  }
} 