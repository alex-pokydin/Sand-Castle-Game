import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  Timestamp,
  writeBatch,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';

import { firebaseManager } from './FirebaseConfig';
import { 
  UserProfile, 
  UserPreferences, 
  UserStatistics, 
  GameSession,
  LeaderboardEntry,
  LeaderboardType,
  LeaderboardResponse,
  CloudSave,
  COLLECTIONS,
  FirebaseError
} from '@/types/Firebase';
import { GameState } from '@/types/Game';

export class FirebaseService {
  private static instance: FirebaseService;
  private currentUserId: string | null = null;
  private userProfileCache: UserProfile | null = null;
  private unsubscriptions: Array<() => void> = [];

  private constructor() {
    // Listen for auth state changes
    firebaseManager.onAuthStateChanged((user) => {
      this.currentUserId = user?.uid || null;
      this.userProfileCache = null; // Clear cache when user changes
      
      if (user) {
        this.initializeUserIfNeeded(user);
      }
    });
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // === Authentication & User Management ===

  /**
   * Sign in anonymously and initialize user profile
   */
  async signInAnonymously(): Promise<User> {
    try {
      const user = await firebaseManager.signInAnonymously();
      await this.initializeUserIfNeeded(user);
      return user;
    } catch (error) {
      console.error('[FirebaseService] Sign in failed:', error);
      throw this.createFirebaseError('auth/signin-failed', 'Failed to sign in', error);
    }
  }

  /**
   * Sign in with Google and initialize user profile
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const user = await firebaseManager.signInWithGoogle();
      await this.initializeUserIfNeeded(user);
      return user;
    } catch (error) {
      console.error('[FirebaseService] Google sign in failed:', error);
      throw this.createFirebaseError('auth/google-signin-failed', 'Failed to sign in with Google', error);
    }
  }

  /**
   * Sign in with Google redirect (for mobile devices)
   */
  async signInWithGoogleRedirect(): Promise<void> {
    try {
      await firebaseManager.signInWithGoogleRedirect();
    } catch (error) {
      console.error('[FirebaseService] Google redirect failed:', error);
      throw this.createFirebaseError('auth/google-redirect-failed', 'Failed to initiate Google sign in', error);
    }
  }

  /**
   * Get redirect result (call after page load)
   */
  async getRedirectResult(): Promise<User | null> {
    try {
      const user = await firebaseManager.getRedirectResult();
      if (user) {
        await this.initializeUserIfNeeded(user);
      }
      return user;
    } catch (error) {
      console.error('[FirebaseService] Redirect result failed:', error);
      throw this.createFirebaseError('auth/redirect-result-failed', 'Failed to get redirect result', error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseManager.signOut();
      this.currentUserId = null;
      this.userProfileCache = null;
      console.log('[FirebaseService] ✅ Sign out successful');
    } catch (error) {
      console.error('[FirebaseService] Sign out failed:', error);
      throw this.createFirebaseError('auth/signout-failed', 'Failed to sign out', error);
    }
  }

  /**
   * Link anonymous account with Google account
   */
  async linkWithGoogle(): Promise<User> {
    try {
      const user = await firebaseManager.linkWithGoogle();
      await this.initializeUserIfNeeded(user);
      return user;
    } catch (error) {
      console.error('[FirebaseService] Account linking failed:', error);
      throw this.createFirebaseError('auth/link-failed', 'Failed to link account', error);
    }
  }

  /**
   * Initialize user profile if it doesn't exist
   */
  private async initializeUserIfNeeded(user: User): Promise<void> {
    if (!user.uid) return;

    try {
      const { firestore } = await firebaseManager.getServices();
      const userDoc = doc(firestore, COLLECTIONS.USERS, user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        // Create new user profile
        const newProfile: UserProfile = {
          userId: user.uid,
          displayName: user.displayName || `Player ${user.uid.slice(-6)}`,
          isAnonymous: user.isAnonymous,
          currentLevel: 1,
          highScore: 0,
          totalCastlesBuilt: 0,
          perfectDrops: 0,
          totalPlayTime: 0,
          gamesPlayed: 0,
          createdAt: serverTimestamp() as Timestamp,
          lastPlayedAt: serverTimestamp() as Timestamp,
          achievements: [],
          preferences: this.getDefaultPreferences(),
          statistics: this.getDefaultStatistics()
        };

        await setDoc(userDoc, newProfile);
        this.userProfileCache = newProfile;
        console.log('[FirebaseService] ✅ New user profile created');
      } else {
        // Update profile with latest Google info if available
        const existingProfile = userSnapshot.data() as UserProfile;
        const updates: any = {
          lastPlayedAt: serverTimestamp()
        };

        // Update display name if user has Google account and name changed
        if (!user.isAnonymous && user.displayName && user.displayName !== existingProfile.displayName) {
          updates.displayName = user.displayName;
        }

        // Update anonymous status if user linked Google account
        if (existingProfile.isAnonymous && !user.isAnonymous) {
          updates.isAnonymous = false;
        }

        await updateDoc(userDoc, updates);
        console.log('[FirebaseService] ✅ Existing user signed in');
      }
    } catch (error) {
      console.error('[FirebaseService] Failed to initialize user:', error);
      // Don't throw - allow offline play
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.currentUserId) {
      return null;
    }

    // Return cached profile if available
    if (this.userProfileCache) {
      return this.userProfileCache;
    }

    try {
      const { firestore } = await firebaseManager.getServices();
      const userDoc = doc(firestore, COLLECTIONS.USERS, this.currentUserId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const profile = userSnapshot.data() as UserProfile;
        this.userProfileCache = profile;
        return profile;
      }
    } catch (error) {
      console.error('[FirebaseService] Failed to get user profile:', error);
    }

    return null;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { firestore } = await firebaseManager.getServices();
      const userDoc = doc(firestore, COLLECTIONS.USERS, this.currentUserId);
      
      await updateDoc(userDoc, {
        ...updates,
        lastPlayedAt: serverTimestamp()
      });

      // Update cache
      if (this.userProfileCache) {
        this.userProfileCache = { ...this.userProfileCache, ...updates };
      }

      console.log('[FirebaseService] ✅ User profile updated');
    } catch (error) {
      console.error('[FirebaseService] Failed to update user profile:', error);
      throw this.createFirebaseError('profile/update-failed', 'Failed to update profile', error);
    }
  }

  // === Game Sessions & Analytics ===

  /**
   * Start a new game session
   */
  async startGameSession(level: number, initialScore: number = 0): Promise<string> {
    if (!this.currentUserId) {
      throw this.createFirebaseError('auth/not-authenticated', 'User not authenticated');
    }

    try {
      const { firestore } = await firebaseManager.getServices();
      const sessionData: Omit<GameSession, 'sessionId'> = {
        userId: this.currentUserId,
        startTime: serverTimestamp() as Timestamp,
        level,
        finalScore: initialScore,
        initialScore,
        partsDropped: 0,
        correctPlacements: 0,
        wrongPlacements: 0,
        completed: false,
        duration: 0,
        drops: [],
        metadata: {
          deviceType: this.getDeviceType(),
          screenSize: { width: window.innerWidth, height: window.innerHeight },
          userAgent: navigator.userAgent,
          gameVersion: '1.0.0', // TODO: Get from package.json
          language: 'en', // TODO: Get from i18n
          isReturningUser: ((await this.getUserProfile())?.gamesPlayed ?? 0) > 0
        }
      };

      const sessionRef = await addDoc(collection(firestore, COLLECTIONS.SESSIONS), sessionData);
      console.log('[FirebaseService] ✅ Game session started:', sessionRef.id);
      return sessionRef.id;
    } catch (error) {
      console.error('[FirebaseService] Failed to start game session:', error);
      throw this.createFirebaseError('session/start-failed', 'Failed to start session', error);
    }
  }

  /**
   * End a game session
   */
  async endGameSession(
    sessionId: string, 
    finalScore: number, 
    completed: boolean,
    sessionStats: {
      partsDropped: number;
      correctPlacements: number;
      wrongPlacements: number;
      drops: any[];
    }
  ): Promise<void> {
    try {
      const { firestore } = await firebaseManager.getServices();
      const sessionDoc = doc(firestore, COLLECTIONS.SESSIONS, sessionId);
      const sessionSnapshot = await getDoc(sessionDoc);

      if (!sessionSnapshot.exists()) {
        console.warn('[FirebaseService] Session not found:', sessionId);
        return;
      }

      const sessionData = sessionSnapshot.data() as GameSession;
      const duration = Math.round((Date.now() - sessionData.startTime.toMillis()) / 1000);

      await updateDoc(sessionDoc, {
        endTime: serverTimestamp(),
        finalScore,
        completed,
        duration,
        ...sessionStats
      });

      // Update user statistics
      await this.updateUserStatistics(finalScore, completed, duration, sessionStats);

      console.log('[FirebaseService] ✅ Game session ended');
    } catch (error) {
      console.error('[FirebaseService] Failed to end game session:', error);
      // Don't throw - session ending is not critical
    }
  }

  // === Leaderboards ===

  /**
   * Submit score to leaderboard
   */
  async submitScore(score: number, level: number, sessionId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const userProfile = await this.getUserProfile();
      if (!userProfile) return;

      const { firestore } = await firebaseManager.getServices();
      
      const leaderboardEntry: Omit<LeaderboardEntry, 'rank'> = {
        userId: this.currentUserId,
        displayName: userProfile.displayName,
        score,
        level,
        timestamp: serverTimestamp() as Timestamp,
        sessionId,
        isAnonymous: userProfile.isAnonymous,
        // castleData can be added later for sharing castles
      };

      // Submit to multiple leaderboards
      const leaderboardTypes: LeaderboardType[] = ['global_high_score'];
      
      // Add weekly and monthly leaderboards
      // const now = new Date();
      // const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      // const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const batch = writeBatch(firestore);
      
      for (const type of leaderboardTypes) {
        const leaderboardRef = collection(firestore, COLLECTIONS.LEADERBOARDS, type, 'entries');
        const entryRef = doc(leaderboardRef);
        batch.set(entryRef, { ...leaderboardEntry, rank: 0 }); // Rank will be calculated later
      }

      await batch.commit();
      console.log('[FirebaseService] ✅ Score submitted to leaderboards');
    } catch (error) {
      console.error('[FirebaseService] Failed to submit score:', error);
      // Don't throw - leaderboard submission is not critical
    }
  }

  /**
   * Get leaderboard entries
   */
  async getLeaderboard(
    type: LeaderboardType = 'global_high_score', 
    limitCount: number = 50
  ): Promise<LeaderboardResponse> {
    try {
      const { firestore } = await firebaseManager.getServices();
      const leaderboardRef = collection(firestore, COLLECTIONS.LEADERBOARDS, type, 'entries');
      const leaderboardQuery = query(
        leaderboardRef,
        orderBy('score', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(leaderboardQuery);
      const entries: LeaderboardEntry[] = [];
      
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data() as Omit<LeaderboardEntry, 'rank'>;
        entries.push({
          ...data,
          rank: index + 1
        });
      });

      // Find user's entry and rank
      let userRank: number | undefined;
      let userEntry: LeaderboardEntry | undefined;
      
      if (this.currentUserId) {
        const userEntryQuery = query(
          leaderboardRef,
          where('userId', '==', this.currentUserId),
          orderBy('score', 'desc'),
          limit(1)
        );
        
        const userSnapshot = await getDocs(userEntryQuery);
        if (!userSnapshot.empty) {
          userEntry = userSnapshot.docs[0].data() as LeaderboardEntry;
          // Calculate rank by counting higher scores
          const rankQuery = query(
            leaderboardRef,
            where('score', '>', userEntry.score)
          );
          const rankSnapshot = await getDocs(rankQuery);
          userRank = rankSnapshot.size + 1;
        }
      }

      return {
        entries,
        userRank,
        userEntry,
        totalEntries: entries.length,
        lastUpdated: Timestamp.now()
      };
    } catch (error) {
      console.error('[FirebaseService] Failed to get leaderboard:', error);
      return {
        entries: [],
        totalEntries: 0,
        lastUpdated: Timestamp.now()
      };
    }
  }

  // === Cloud Saves ===

  /**
   * Save game state to cloud
   */
  async saveToCloud(gameState: GameState, sessionData: any, isAutoSave: boolean = true): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const userProfile = await this.getUserProfile();
      if (!userProfile) return;

      const { firestore } = await firebaseManager.getServices();
      
      const cloudSave: Omit<CloudSave, 'saveId'> = {
        userId: this.currentUserId,
        timestamp: serverTimestamp() as Timestamp,
        version: '1.0.0', // TODO: Get from package.json
        gameState,
        userProfile: {
          currentLevel: userProfile.currentLevel,
          highScore: userProfile.highScore,
          totalCastlesBuilt: userProfile.totalCastlesBuilt
        },
        sessionData,
        metadata: {
          deviceType: this.getDeviceType(),
          platform: navigator.platform,
          autoSave: isAutoSave
        }
      };

      const saveRef = await addDoc(collection(firestore, COLLECTIONS.CLOUD_SAVES), cloudSave);
      console.log('[FirebaseService] ✅ Game saved to cloud:', saveRef.id);
    } catch (error) {
      console.error('[FirebaseService] Failed to save to cloud:', error);
      // Don't throw - cloud saves are not critical for gameplay
    }
  }

  /**
   * Load latest game state from cloud
   */
  async loadFromCloud(): Promise<CloudSave | null> {
    if (!this.currentUserId) return null;

    try {
      const { firestore } = await firebaseManager.getServices();
      const cloudSavesRef = collection(firestore, COLLECTIONS.CLOUD_SAVES);
      const saveQuery = query(
        cloudSavesRef,
        where('userId', '==', this.currentUserId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(saveQuery);
      if (!querySnapshot.empty) {
        const saveData = querySnapshot.docs[0].data() as CloudSave;
        console.log('[FirebaseService] ✅ Game loaded from cloud');
        return saveData;
      }
    } catch (error) {
      console.error('[FirebaseService] Failed to load from cloud:', error);
    }

    return null;
  }

  // === Utility Methods ===

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      soundEnabled: true,
      musicEnabled: true,
      masterVolume: 0.7,
      musicVolume: 0.4,
      effectsVolume: 0.7,
      notifications: true,
      shareScores: true
    };
  }

  /**
   * Get default user statistics
   */
  private getDefaultStatistics(): UserStatistics {
    return {
      totalPartsDropped: 0,
      successfulPlacements: 0,
      wrongPlacements: 0,
      castlesCollapsed: 0,
      averageScore: 0,
      bestStreak: 0,
      totalPlayingSessions: 0,
      averageSessionDuration: 0,
      levelCompletionRate: 0,
      favoriteLevel: 1,
      partsByLevel: {},
      achievementProgress: {}
    };
  }

  /**
   * Update user statistics after a game session
   */
  private async updateUserStatistics(
    finalScore: number, 
    completed: boolean, 
    duration: number,
    sessionStats: any
  ): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const { firestore } = await firebaseManager.getServices();
      const userDoc = doc(firestore, COLLECTIONS.USERS, this.currentUserId);
      
      const updates: any = {
        gamesPlayed: increment(1),
        totalPlayTime: increment(duration),
        lastPlayedAt: serverTimestamp()
      };

      if (finalScore > 0) {
        updates['statistics.totalPartsDropped'] = increment(sessionStats.partsDropped);
        updates['statistics.successfulPlacements'] = increment(sessionStats.correctPlacements);
        updates['statistics.wrongPlacements'] = increment(sessionStats.wrongPlacements);
        updates['statistics.totalPlayingSessions'] = increment(1);
      }

      if (completed) {
        updates.totalCastlesBuilt = increment(1);
      }

      await updateDoc(userDoc, updates);
      
      // Clear cache to force reload
      this.userProfileCache = null;
    } catch (error) {
      console.error('[FirebaseService] Failed to update user statistics:', error);
    }
  }

  /**
   * Get device type for analytics
   */
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/i.test(navigator.userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Create standardized Firebase error
   */
  private createFirebaseError(code: string, message: string, originalError?: any): FirebaseError {
    return {
      code,
      message,
      details: originalError
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserId !== null;
  }

  /**
   * Check if current user is anonymous
   */
  isAnonymous(): boolean {
    return firebaseManager.isAnonymous();
  }

  /**
   * Check if current user has Google account linked
   */
  hasGoogleAccount(): boolean {
    return firebaseManager.hasGoogleAccount();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Cleanup method for destroying the service
   */
  cleanup(): void {
    this.unsubscriptions.forEach(unsubscribe => unsubscribe());
    this.unsubscriptions = [];
    this.userProfileCache = null;
  }
}

// Export singleton instance
export const firebaseService = FirebaseService.getInstance();

// Debug functions for development
export const debugFirebaseService = {
  signIn: () => firebaseService.signInAnonymously(),
  signInWithGoogle: () => firebaseService.signInWithGoogle(),
  signOut: () => firebaseService.signOut(),
  linkWithGoogle: () => firebaseService.linkWithGoogle(),
  getProfile: () => firebaseService.getUserProfile(),
  updateProfile: (updates: any) => firebaseService.updateUserProfile(updates),
  getLeaderboard: (type?: LeaderboardType) => firebaseService.getLeaderboard(type),
  saveToCloud: (gameState: any, sessionData: any) => firebaseService.saveToCloud(gameState, sessionData),
  loadFromCloud: () => firebaseService.loadFromCloud(),
  isAuthenticated: () => firebaseService.isAuthenticated(),
  isAnonymous: () => firebaseService.isAnonymous(),
  hasGoogleAccount: () => firebaseService.hasGoogleAccount(),
  getUserId: () => firebaseService.getCurrentUserId()
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugFirebaseService = debugFirebaseService;
} 