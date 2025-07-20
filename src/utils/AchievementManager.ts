import { 
  Achievement, 
  UserAchievement, 
  AchievementResponse
} from '@/types/Firebase';
import { firebaseService } from './FirebaseService';

export interface AchievementProgress {
  [achievementId: string]: {
    current: number;
    target: number;
    completed: boolean;
    completedAt?: Date;
  };
}

export interface AchievementEvent {
  type: 'part_dropped' | 'correct_placement' | 'wrong_placement' | 'level_complete' | 'castle_collapse' | 'perfect_level' | 'game_start' | 'session_duration';
  data: any;
  timestamp: number;
}

export class AchievementManager {
  private static instance: AchievementManager;
  private achievements: Achievement[] = [];
  private userProgress: AchievementProgress = {};
  private recentlyUnlocked: string[] = [];
  private eventListeners: Array<(achievement: Achievement) => void> = [];
  private sessionStats = {
    startTime: 0,
    partsDropped: 0,
    correctPlacements: 0,
    consecutiveCorrect: 0,
    wrongPlacements: 0,
    levelsCompleted: 0,
    perfectLevels: 0,
    useAllLevels: false,
    usedLevels: new Set<number>()
  };

  private constructor() {
    this.initializeAchievements();
    this.loadLocalProgress();
  }

  static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }

  /**
   * Initialize predefined achievements for Sand Castle game
   */
  private initializeAchievements(): void {
    this.achievements = [
      // Building achievements
      {
        id: 'first_castle',
        name: 'First Castle',
        description: 'Build your first castle by completing any level',
        category: 'building',
        type: 'count',
        requirements: { totalCastles: 1 },
        rewards: { points: 100 },
        rarity: 'common',
        isSecret: false,
        icon: 'castle-basic',
        sortOrder: 1
      },
      {
        id: 'castle_builder',
        name: 'Castle Builder',
        description: 'Build 10 castles',
        category: 'building',
        type: 'count',
        requirements: { totalCastles: 10 },
        rewards: { points: 500, title: 'Builder' },
        rarity: 'common',
        isSecret: false,
        icon: 'castle-multiple',
        sortOrder: 2
      },
      {
        id: 'master_architect',
        name: 'Master Architect',
        description: 'Build 50 castles',
        category: 'building',
        type: 'count',
        requirements: { totalCastles: 50 },
        rewards: { points: 2000, title: 'Architect' },
        rarity: 'rare',
        isSecret: false,
        icon: 'castle-master',
        sortOrder: 3
      },

      // Precision achievements
      {
        id: 'perfect_drop',
        name: 'Perfect Drop',
        description: 'Make your first perfect placement',
        category: 'precision',
        type: 'count',
        requirements: { perfectDrops: 1 },
        rewards: { points: 50 },
        rarity: 'common',
        isSecret: false,
        icon: 'target-perfect',
        sortOrder: 10
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Make 25 perfect placements',
        category: 'precision',
        type: 'count',
        requirements: { perfectDrops: 25 },
        rewards: { points: 750, title: 'Sharpshooter' },
        rarity: 'rare',
        isSecret: false,
        icon: 'target-multi',
        sortOrder: 11
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Make 10 consecutive correct placements in a single game',
        category: 'precision',
        type: 'streak',
        requirements: { consecutiveCorrect: 10 },
        rewards: { points: 1000, title: 'Streak Master' },
        rarity: 'epic',
        isSecret: false,
        icon: 'streak-fire',
        sortOrder: 12
      },

      // Progression achievements
      {
        id: 'level_5_complete',
        name: 'Foundation Master',
        description: 'Complete all 5 basic levels',
        category: 'progression',
        type: 'threshold',
        requirements: { levelReached: 5 },
        rewards: { points: 1500, title: 'Foundation Master' },
        rarity: 'rare',
        isSecret: false,
        icon: 'levels-complete',
        sortOrder: 20
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score 1000 points in a single game',
        category: 'progression',
        type: 'threshold',
        requirements: { singleGameScore: 1000 },
        rewards: { points: 500 },
        rarity: 'common',
        isSecret: false,
        icon: 'score-high',
        sortOrder: 21
      },
      {
        id: 'score_legend',
        name: 'Score Legend',
        description: 'Score 5000 points in a single game',
        category: 'progression',
        type: 'threshold',
        requirements: { singleGameScore: 5000 },
        rewards: { points: 2500, title: 'Score Legend' },
        rarity: 'legendary',
        isSecret: false,
        icon: 'score-legend',
        sortOrder: 22
      },

      // Mastery achievements
      {
        id: 'perfect_level',
        name: 'Flawless Victory',
        description: 'Complete a level without any wrong placements',
        category: 'mastery',
        type: 'perfect',
        requirements: { perfectLevel: true },
        rewards: { points: 800, title: 'Flawless' },
        rarity: 'epic',
        isSecret: false,
        icon: 'perfect-crown',
        sortOrder: 30
      },
      {
        id: 'all_levels_single_game',
        name: 'Rainbow Builder',
        description: 'Use parts from all 6 levels in a single game',
        category: 'mastery',
        type: 'combination',
        requirements: { useAllLevels: true },
        rewards: { points: 1200, title: 'Rainbow Builder' },
        rarity: 'epic',
        isSecret: false,
        icon: 'rainbow-castle',
        sortOrder: 31
      },
      {
        id: 'tower_master',
        name: 'Tower Master',
        description: 'Build a castle that is 10 parts tall and no more than 3 parts wide',
        category: 'mastery',
        type: 'combination',
        requirements: { buildTower: { minHeight: 10, maxWidth: 3 } },
        rewards: { points: 1800, title: 'Tower Master' },
        rarity: 'legendary',
        isSecret: false,
        icon: 'tower-tall',
        sortOrder: 32
      },

      // Persistence achievements
      {
        id: 'dedicated_player',
        name: 'Dedicated Player',
        description: 'Play for a total of 1 hour',
        category: 'persistence',
        type: 'time',
        requirements: { totalPlayTime: 3600 }, // 1 hour in seconds
        rewards: { points: 600, title: 'Dedicated' },
        rarity: 'rare',
        isSecret: false,
        icon: 'clock-dedicated',
        sortOrder: 40
      },
      {
        id: 'marathon_builder',
        name: 'Marathon Builder',
        description: 'Play for a total of 10 hours',
        category: 'persistence',
        type: 'time',
        requirements: { totalPlayTime: 36000 }, // 10 hours in seconds
        rewards: { points: 3000, title: 'Marathon Builder' },
        rarity: 'legendary',
        isSecret: false,
        icon: 'clock-marathon',
        sortOrder: 41
      },

      // Special/Secret achievements
      {
        id: 'crash_survivor',
        name: 'Crash Survivor',
        description: 'Complete a level after having your castle collapse 3 times',
        category: 'special',
        type: 'combination',
        requirements: { 
          multiRequirements: {
            operator: 'AND',
            conditions: [
              { totalCastles: 1 }, // Complete at least one castle
              { // Custom logic needed for tracking collapses in session
                multiRequirements: {
                  operator: 'AND',
                  conditions: []
                }
              }
            ]
          }
        },
        rewards: { points: 1000, title: 'Survivor' },
        rarity: 'epic',
        isSecret: true,
        icon: 'phoenix-rise',
        sortOrder: 50
      },
      {
        id: 'speed_builder',
        name: 'Speed Builder',
        description: 'Complete a level in under 30 seconds',
        category: 'special',
        type: 'time',
        requirements: { fastestLevel: 30 },
        rewards: { points: 1500, title: 'Speed Builder' },
        rarity: 'epic',
        isSecret: true,
        icon: 'speed-lightning',
        sortOrder: 51
      }
    ];

    console.log('[AchievementManager] ✅ Initialized', this.achievements.length, 'achievements');
  }

  /**
   * Process a game event and check for achievement progress
   */
  processEvent(event: AchievementEvent): string[] {
    const newlyUnlocked: string[] = [];

    switch (event.type) {
      case 'game_start':
        this.resetSessionStats();
        this.sessionStats.startTime = event.timestamp;
        break;

      case 'part_dropped':
        this.sessionStats.partsDropped++;
        this.updateProgress('total_parts', 1);
        
        // Track which levels are being used
        if (event.data.partLevel) {
          this.sessionStats.usedLevels.add(event.data.partLevel);
          if (this.sessionStats.usedLevels.size === 6) {
            this.sessionStats.useAllLevels = true;
          }
        }
        break;

      case 'correct_placement':
        this.sessionStats.correctPlacements++;
        this.sessionStats.consecutiveCorrect++;
        this.updateProgress('perfect_drops', 1);
        this.updateProgress('consecutive_correct', this.sessionStats.consecutiveCorrect);
        break;

      case 'wrong_placement':
        this.sessionStats.wrongPlacements++;
        this.sessionStats.consecutiveCorrect = 0; // Reset streak
        break;

      case 'level_complete':
        this.sessionStats.levelsCompleted++;
        this.updateProgress('total_castles', 1);
        this.updateProgress('level_reached', event.data.level);
        this.updateProgress('single_game_score', event.data.score);
        
        // Check for perfect level (no wrong placements)
        if (this.sessionStats.wrongPlacements === 0 && this.sessionStats.correctPlacements > 0) {
          this.sessionStats.perfectLevels++;
          this.updateProgress('perfect_level', 1);
        }
        
        // Check for all levels used
        if (this.sessionStats.useAllLevels) {
          this.updateProgress('use_all_levels', 1);
        }
        
        // Check session duration
        const sessionDuration = (event.timestamp - this.sessionStats.startTime) / 1000;
        this.updateProgress('fastest_level', sessionDuration);
        this.updateProgress('total_play_time', sessionDuration);
        break;

      case 'castle_collapse':
        // Handle collapse-related achievements
        break;

      case 'session_duration':
        this.updateProgress('total_play_time', event.data.duration);
        break;
    }

    // Check all achievements for completion
    for (const achievement of this.achievements) {
      if (this.checkAchievementCompletion(achievement)) {
        if (!this.userProgress[achievement.id]?.completed) {
          this.unlockAchievement(achievement);
          newlyUnlocked.push(achievement.id);
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if an achievement's requirements are met
   */
  private checkAchievementCompletion(achievement: Achievement): boolean {
    const progress = this.userProgress[achievement.id];
    if (!progress) return false;

    const req = achievement.requirements;

    // Simple count/threshold checks
    if (req.totalCastles && progress.current < req.totalCastles) return false;
    if (req.totalParts && progress.current < req.totalParts) return false;
    if (req.perfectDrops && progress.current < req.perfectDrops) return false;
    if (req.singleGameScore && progress.current < req.singleGameScore) return false;
    if (req.totalScore && progress.current < req.totalScore) return false;
    if (req.levelReached && progress.current < req.levelReached) return false;
    if (req.consecutiveCorrect && progress.current < req.consecutiveCorrect) return false;
    if (req.totalPlayTime && progress.current < req.totalPlayTime) return false;
    if (req.fastestLevel && progress.current > req.fastestLevel) return false; // Faster is lower

    // Boolean checks
    if (req.perfectLevel && progress.current < 1) return false;
    if (req.useAllLevels && progress.current < 1) return false;

    return true;
  }

  /**
   * Update progress for a specific achievement metric
   */
  private updateProgress(metric: string, value: number): void {
    for (const achievement of this.achievements) {
      if (this.userProgress[achievement.id]?.completed) continue;

      const req = achievement.requirements;
      let shouldUpdate = false;
      let newValue = value;

      // Map metrics to requirements
      switch (metric) {
        case 'total_castles':
          if (req.totalCastles) shouldUpdate = true;
          break;
        case 'total_parts':
          if (req.totalParts) shouldUpdate = true;
          break;
        case 'perfect_drops':
          if (req.perfectDrops) shouldUpdate = true;
          break;
        case 'single_game_score':
          if (req.singleGameScore) {
            shouldUpdate = true;
            // Only update if this score is higher
            const current = this.userProgress[achievement.id]?.current || 0;
            if (value <= current) continue;
          }
          break;
        case 'level_reached':
          if (req.levelReached) {
            shouldUpdate = true;
            // Only update if this level is higher
            const current = this.userProgress[achievement.id]?.current || 0;
            if (value <= current) continue;
          }
          break;
        case 'consecutive_correct':
          if (req.consecutiveCorrect) {
            shouldUpdate = true;
            // Only update if this streak is higher
            const current = this.userProgress[achievement.id]?.current || 0;
            if (value <= current) continue;
          }
          break;
        case 'total_play_time':
          if (req.totalPlayTime) {
            shouldUpdate = true;
            // Accumulate total time
            const current = this.userProgress[achievement.id]?.current || 0;
            newValue = current + value;
          }
          break;
        case 'fastest_level':
          if (req.fastestLevel) {
            shouldUpdate = true;
            // Only update if this time is faster (lower)
            const current = this.userProgress[achievement.id]?.current || Infinity;
            if (value >= current) continue;
          }
          break;
        case 'perfect_level':
          if (req.perfectLevel) {
            shouldUpdate = true;
            newValue = 1; // Boolean achievement
          }
          break;
        case 'use_all_levels':
          if (req.useAllLevels) {
            shouldUpdate = true;
            newValue = 1; // Boolean achievement
          }
          break;
      }

      if (shouldUpdate) {
        if (!this.userProgress[achievement.id]) {
          this.userProgress[achievement.id] = {
            current: 0,
            target: this.getTargetValue(achievement),
            completed: false
          };
        }
        this.userProgress[achievement.id].current = newValue;
      }
    }

    this.saveLocalProgress();
  }

  /**
   * Get target value for achievement
   */
  private getTargetValue(achievement: Achievement): number {
    const req = achievement.requirements;
    
    if (req.totalCastles) return req.totalCastles;
    if (req.totalParts) return req.totalParts;
    if (req.perfectDrops) return req.perfectDrops;
    if (req.singleGameScore) return req.singleGameScore;
    if (req.totalScore) return req.totalScore;
    if (req.levelReached) return req.levelReached;
    if (req.consecutiveCorrect) return req.consecutiveCorrect;
    if (req.totalPlayTime) return req.totalPlayTime;
    if (req.fastestLevel) return req.fastestLevel;
    if (req.perfectLevel) return 1;
    if (req.useAllLevels) return 1;
    
    return 1;
  }

  /**
   * Unlock an achievement
   */
  private unlockAchievement(achievement: Achievement): void {
    if (!this.userProgress[achievement.id]) {
      this.userProgress[achievement.id] = {
        current: 0,
        target: this.getTargetValue(achievement),
        completed: false
      };
    }

    this.userProgress[achievement.id].completed = true;
    this.userProgress[achievement.id].completedAt = new Date();
    this.recentlyUnlocked.push(achievement.id);

    console.log('[AchievementManager] 🏆 Achievement unlocked:', achievement.name);

    // Notify listeners
    this.eventListeners.forEach(listener => {
      try {
        listener(achievement);
      } catch (error) {
        console.error('[AchievementManager] Error in achievement listener:', error);
      }
    });

    this.saveLocalProgress();

    // Sync to Firebase if authenticated
    if (firebaseService.isAuthenticated()) {
      this.syncToFirebase();
    }
  }

  /**
   * Reset session statistics
   */
  private resetSessionStats(): void {
    this.sessionStats = {
      startTime: 0,
      partsDropped: 0,
      correctPlacements: 0,
      consecutiveCorrect: 0,
      wrongPlacements: 0,
      levelsCompleted: 0,
      perfectLevels: 0,
      useAllLevels: false,
      usedLevels: new Set<number>()
    };
  }

  /**
   * Get all achievements with progress
   */
  getAchievements(): AchievementResponse {
    const userAchievements: UserAchievement[] = this.achievements.map(achievement => {
      const progress = this.userProgress[achievement.id] || {
        current: 0,
        target: this.getTargetValue(achievement),
        completed: false
      };

      return {
        achievementId: achievement.id,
        userId: firebaseService.getCurrentUserId() || 'local',
        progress: progress.current,
        maxProgress: progress.target,
        isCompleted: progress.completed,
        completedAt: progress.completedAt ? { 
          toDate: () => progress.completedAt! 
        } as any : undefined,
        notified: true // For now, assume all are notified
      };
    });

    const totalPoints = this.achievements
      .filter(a => this.userProgress[a.id]?.completed)
      .reduce((sum, a) => sum + a.rewards.points, 0);

    return {
      achievements: this.achievements,
      userProgress: userAchievements,
      newlyUnlocked: [...this.recentlyUnlocked],
      totalPoints
    };
  }

  /**
   * Clear recently unlocked achievements
   */
  clearRecentlyUnlocked(): void {
    this.recentlyUnlocked = [];
  }

  /**
   * Add achievement unlock listener
   */
  onAchievementUnlocked(callback: (achievement: Achievement) => void): () => void {
    this.eventListeners.push(callback);
    
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Save progress to local storage
   */
  private saveLocalProgress(): void {
    try {
      localStorage.setItem('sand-castle-achievements', JSON.stringify(this.userProgress));
    } catch (error) {
      console.warn('[AchievementManager] Failed to save progress locally:', error);
    }
  }

  /**
   * Load progress from local storage
   */
  private loadLocalProgress(): void {
    try {
      const saved = localStorage.getItem('sand-castle-achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        Object.keys(parsed).forEach(key => {
          if (parsed[key].completedAt && typeof parsed[key].completedAt === 'string') {
            parsed[key].completedAt = new Date(parsed[key].completedAt);
          }
        });
        this.userProgress = parsed;
        console.log('[AchievementManager] ✅ Loaded progress from local storage');
      }
    } catch (error) {
      console.warn('[AchievementManager] Failed to load progress from local storage:', error);
    }
  }

  /**
   * Sync achievements to Firebase
   */
  private async syncToFirebase(): Promise<void> {
    // This would sync to Firebase when implemented
    // For now, just log the attempt
    console.log('[AchievementManager] 📤 Would sync to Firebase:', Object.keys(this.userProgress).length, 'achievements');
  }

  /**
   * Get achievement by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.find(a => a.id === id);
  }

  /**
   * Get progress for specific achievement
   */
  getProgress(achievementId: string): { current: number; target: number; completed: boolean } | null {
    const progress = this.userProgress[achievementId];
    if (!progress) return null;
    
    return {
      current: progress.current,
      target: progress.target,
      completed: progress.completed
    };
  }
}

// Export singleton instance
export const achievementManager = AchievementManager.getInstance();

// Debug functions
export const debugAchievements = {
  getAll: () => achievementManager.getAchievements(),
  processEvent: (type: string, data: any) => achievementManager.processEvent({ type: type as any, data, timestamp: Date.now() }),
  getProgress: (id: string) => achievementManager.getProgress(id),
  clearProgress: () => {
    localStorage.removeItem('sand-castle-achievements');
    console.log('Achievement progress cleared');
  }
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAchievements = debugAchievements;
} 