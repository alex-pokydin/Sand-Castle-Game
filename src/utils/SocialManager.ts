import { firebaseService } from './FirebaseService';
import { achievementManager } from './AchievementManager';
import { 
  SharedContent, 
  Achievement, 
  CastleSnapshot,
  LeaderboardEntry 
} from '@/types/Firebase';
import { CastlePartData } from '@/types/Game';
import { tSync } from '@/i18n';

export interface ShareOptions {
  includeScore: boolean;
  includeCastle: boolean;
  includeAchievement: boolean;
  customMessage?: string;
  tags?: string[];
}

export interface SocialStats {
  totalShares: number;
  totalLikes: number;
  achievementsShared: number;
  castlesShared: number;
  scoresShared: number;
}

export class SocialManager {
  private static instance: SocialManager;
  private socialStats: SocialStats = {
    totalShares: 0,
    totalLikes: 0,
    achievementsShared: 0,
    castlesShared: 0,
    scoresShared: 0
  };

  private constructor() {
    this.loadSocialStats();
  }

  static getInstance(): SocialManager {
    if (!SocialManager.instance) {
      SocialManager.instance = new SocialManager();
    }
    return SocialManager.instance;
  }

  /**
   * Share a high score achievement
   */
  async shareScore(
    score: number, 
    level: number, 
    castleParts?: CastlePartData[], 
    options: Partial<ShareOptions> = {}
  ): Promise<boolean> {
    if (!firebaseService.isAuthenticated()) {
      console.log('[SocialManager] Cannot share: not authenticated');
      return false;
    }

    try {
      const userProfile = await firebaseService.getUserProfile();
      if (!userProfile) {
        console.log('[SocialManager] Cannot share: no user profile');
        return false;
      }

      const defaultOptions: ShareOptions = {
        includeScore: true,
        includeCastle: !!castleParts,
        includeAchievement: false,
        tags: ['high-score', `level-${level}`],
        ...options
      };

      // Create castle snapshot if parts provided
      let castleSnapshot: CastleSnapshot | undefined;
      if (defaultOptions.includeCastle && castleParts && castleParts.length > 0) {
        castleSnapshot = this.createCastleSnapshot(castleParts);
      }

      // Generate share message
      const message = this.generateScoreMessage(score, level, defaultOptions.customMessage);

      // Create shared content
      const sharedContent: Omit<SharedContent, 'contentId'> = {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        type: 'score',
        content: {
          score,
          level,
          castle: castleSnapshot,
          description: message
        },
        isPublic: true,
        likes: 0,
        shares: 0,
        createdAt: new Date() as any,
        tags: defaultOptions.tags || []
      };

      // Here you would save to Firebase Collections.SHARED_CONTENT
      // For now, just simulate the sharing
      console.log('[SocialManager] ✅ Score shared successfully:', sharedContent);

      // Update local stats
      this.socialStats.totalShares++;
      this.socialStats.scoresShared++;
      if (castleSnapshot) {
        this.socialStats.castlesShared++;
      }
      this.saveSocialStats();

      return true;
    } catch (error) {
      console.error('[SocialManager] Failed to share score:', error);
      return false;
    }
  }

  /**
   * Share an achievement unlock
   */
  async shareAchievement(achievementId: string, options: Partial<ShareOptions> = {}): Promise<boolean> {
    if (!firebaseService.isAuthenticated()) {
      console.log('[SocialManager] Cannot share: not authenticated');
      return false;
    }

    try {
      const userProfile = await firebaseService.getUserProfile();
      const achievement = achievementManager.getAchievement(achievementId);

      if (!userProfile || !achievement) {
        console.log('[SocialManager] Cannot share: missing profile or achievement');
        return false;
      }

      const defaultOptions: ShareOptions = {
        includeScore: false,
        includeCastle: false,
        includeAchievement: true,
        tags: ['achievement', achievement.category, achievement.rarity],
        ...options
      };

      // Generate share message
      const message = this.generateAchievementMessage(achievement, defaultOptions.customMessage);

      // Create shared content
      const sharedContent: Omit<SharedContent, 'contentId'> = {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        type: 'achievement',
        content: {
          achievement: achievementId,
          description: message
        },
        isPublic: true,
        likes: 0,
        shares: 0,
        createdAt: new Date() as any,
        tags: defaultOptions.tags || []
      };

      // Here you would save to Firebase Collections.SHARED_CONTENT
      console.log('[SocialManager] ✅ Achievement shared successfully:', sharedContent);

      // Update local stats
      this.socialStats.totalShares++;
      this.socialStats.achievementsShared++;
      this.saveSocialStats();

      return true;
    } catch (error) {
      console.error('[SocialManager] Failed to share achievement:', error);
      return false;
    }
  }

  /**
   * Share a castle design
   */
  async shareCastle(
    castleParts: CastlePartData[], 
    score: number, 
    level: number,
    options: Partial<ShareOptions> = {}
  ): Promise<boolean> {
    if (!firebaseService.isAuthenticated()) {
      console.log('[SocialManager] Cannot share: not authenticated');
      return false;
    }

    try {
      const userProfile = await firebaseService.getUserProfile();
      if (!userProfile) {
        console.log('[SocialManager] Cannot share: no user profile');
        return false;
      }

      const defaultOptions: ShareOptions = {
        includeScore: true,
        includeCastle: true,
        includeAchievement: false,
        tags: ['castle-design', `level-${level}`, `parts-${castleParts.length}`],
        ...options
      };

      const castleSnapshot = this.createCastleSnapshot(castleParts);
      const message = this.generateCastleMessage(castleSnapshot, score, defaultOptions.customMessage);

      // Create shared content
      const sharedContent: Omit<SharedContent, 'contentId'> = {
        userId: userProfile.userId,
        displayName: userProfile.displayName,
        type: 'castle',
        content: {
          castle: castleSnapshot,
          score,
          level,
          description: message
        },
        isPublic: true,
        likes: 0,
        shares: 0,
        createdAt: new Date() as any,
        tags: defaultOptions.tags || []
      };

      // Here you would save to Firebase Collections.SHARED_CONTENT
      console.log('[SocialManager] ✅ Castle shared successfully:', sharedContent);

      // Update local stats
      this.socialStats.totalShares++;
      this.socialStats.castlesShared++;
      this.saveSocialStats();

      return true;
    } catch (error) {
      console.error('[SocialManager] Failed to share castle:', error);
      return false;
    }
  }

  /**
   * Generate native share data for Web Share API
   */
  generateNativeShare(
    type: 'score' | 'achievement' | 'castle',
    data: {
      score?: number;
      level?: number;
      achievement?: Achievement;
      castle?: CastleSnapshot;
      customMessage?: string;
    }
  ): { title: string; text: string; url: string } {
    const baseUrl = window.location.origin;
    let title = '';
    let text = '';
    let url = baseUrl;

    switch (type) {
      case 'score':
        title = tSync('Check out my Sand Castle score!');
        text = data.customMessage || this.generateScoreMessage(data.score || 0, data.level || 1);
        url = `${baseUrl}?shared=score&s=${data.score}&l=${data.level}`;
        break;

      case 'achievement':
        title = tSync('I unlocked an achievement in Sand Castle!');
        text = data.customMessage || this.generateAchievementMessage(data.achievement!);
        url = `${baseUrl}?shared=achievement&id=${data.achievement?.id}`;
        break;

      case 'castle':
        title = tSync('Look at my amazing Sand Castle!');
        text = data.customMessage || this.generateCastleMessage(data.castle!, data.score);
        url = `${baseUrl}?shared=castle&s=${data.score}&p=${data.castle?.totalParts}`;
        break;
    }

    return { title, text, url };
  }

  /**
   * Use native Web Share API if available
   */
  async nativeShare(shareData: { title: string; text: string; url: string }): Promise<boolean> {
    if (!navigator.share) {
      console.log('[SocialManager] Native sharing not available');
      return false;
    }

    try {
      await navigator.share(shareData);
      console.log('[SocialManager] ✅ Native share successful');
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[SocialManager] Native share failed:', error);
      }
      return false;
    }
  }

  /**
   * Copy share text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('[SocialManager] ✅ Copied to clipboard');
      return true;
    } catch (error) {
      console.error('[SocialManager] Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Create a castle snapshot for sharing
   */
  private createCastleSnapshot(parts: CastlePartData[]): CastleSnapshot {
    const levelDistribution: Record<number, number> = {};
    let maxHeight = 0;

    parts.forEach(part => {
      levelDistribution[part.level] = (levelDistribution[part.level] || 0) + 1;
      maxHeight = Math.max(maxHeight, part.y);
    });

    // Calculate stability score (simplified)
    const stabilityScore = parts.filter(part => part.isStable).length / parts.length;

    return {
      parts,
      maxHeight,
      totalParts: parts.length,
      stabilityScore,
      levelDistribution
    };
  }

  /**
   * Generate score share message
   */
  private generateScoreMessage(score: number, level: number, customMessage?: string): string {
    if (customMessage) return customMessage;
    
    return tSync('I scored {{score}} points on level {{level}} in Sand Castle! 🏰', {
      score: score.toLocaleString(),
      level
    });
  }

  /**
   * Generate achievement share message
   */
  private generateAchievementMessage(achievement: Achievement, customMessage?: string): string {
    if (customMessage) return customMessage;
    
    const rarityEmoji = {
      common: '🥉',
      rare: '🥈',
      epic: '🥇',
      legendary: '👑'
    };

    return tSync('I unlocked "{{name}}" {{emoji}} in Sand Castle! {{description}}', {
      name: achievement.name,
      description: achievement.description,
      emoji: rarityEmoji[achievement.rarity]
    });
  }

  /**
   * Generate castle share message
   */
  private generateCastleMessage(castle: CastleSnapshot, score?: number, customMessage?: string): string {
    if (customMessage) return customMessage;
    
    if (score) {
      return tSync('Check out my {{parts}}-part castle! Score: {{score}} 🏰', {
        parts: castle.totalParts,
        score: score.toLocaleString()
      });
    } else {
      return tSync('Built an amazing {{parts}}-part castle! 🏰', {
        parts: castle.totalParts
      });
    }
  }

  /**
   * Get social statistics
   */
  getSocialStats(): SocialStats {
    return { ...this.socialStats };
  }

  /**
   * Check if sharing is available
   */
  isSharingAvailable(): {
    native: boolean;
    clipboard: boolean;
    firebase: boolean;
  } {
    return {
      native: !!navigator.share,
      clipboard: !!navigator.clipboard,
      firebase: firebaseService.isAuthenticated()
    };
  }

  /**
   * Save social stats to local storage
   */
  private saveSocialStats(): void {
    try {
      localStorage.setItem('sand-castle-social-stats', JSON.stringify(this.socialStats));
    } catch (error) {
      console.warn('[SocialManager] Failed to save social stats:', error);
    }
  }

  /**
   * Load social stats from local storage
   */
  private loadSocialStats(): void {
    try {
      const saved = localStorage.getItem('sand-castle-social-stats');
      if (saved) {
        this.socialStats = { ...this.socialStats, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('[SocialManager] Failed to load social stats:', error);
    }
  }

  /**
   * Reset social statistics
   */
  resetStats(): void {
    this.socialStats = {
      totalShares: 0,
      totalLikes: 0,
      achievementsShared: 0,
      castlesShared: 0,
      scoresShared: 0
    };
    this.saveSocialStats();
    console.log('[SocialManager] ✅ Social stats reset');
  }
}

// Export singleton instance
export const socialManager = SocialManager.getInstance();

// Debug functions for development
export const debugSocial = {
  shareScore: (score: number, level: number) => socialManager.shareScore(score, level),
  shareAchievement: (id: string) => socialManager.shareAchievement(id),
  getStats: () => socialManager.getSocialStats(),
  isAvailable: () => socialManager.isSharingAvailable(),
  resetStats: () => socialManager.resetStats(),
  copyText: (text: string) => socialManager.copyToClipboard(text)
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugSocial = debugSocial;
} 