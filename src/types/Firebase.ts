import { Timestamp } from 'firebase/firestore';
import { GameState, CastlePartData } from './Game';

// User Profile stored in Firestore
export interface UserProfile {
  userId: string;
  displayName: string;
  isAnonymous: boolean;
  currentLevel: number;
  highScore: number;
  totalCastlesBuilt: number;
  perfectDrops: number;
  totalPlayTime: number; // in seconds
  gamesPlayed: number;
  createdAt: Timestamp;
  lastPlayedAt: Timestamp;
  achievements: string[]; // Array of achievement IDs
  preferences: UserPreferences;
  statistics: UserStatistics;
}

// User preferences and settings
export interface UserPreferences {
  language: string; // 'en' | 'ua' | etc.
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  notifications: boolean;
  shareScores: boolean; // Whether to share scores on leaderboards
}

// Detailed user statistics
export interface UserStatistics {
  totalPartsDropped: number;
  successfulPlacements: number;
  wrongPlacements: number;
  castlesCollapsed: number;
  averageScore: number;
  bestStreak: number; // Best consecutive correct placements
  totalPlayingSessions: number;
  averageSessionDuration: number; // in seconds
  levelCompletionRate: number; // percentage 0-100
  favoriteLevel: number;
  partsByLevel: Record<number, number>; // Level -> count of parts placed
  achievementProgress: Record<string, number>; // Achievement ID -> progress
}

// Game Session for detailed analytics
export interface GameSession {
  sessionId: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  level: number;
  finalScore: number;
  initialScore: number;
  partsDropped: number;
  correctPlacements: number;
  wrongPlacements: number;
  completed: boolean;
  duration: number; // in seconds
  drops: GameDrop[];
  achievements?: string[]; // Achievements earned during this session
  metadata: SessionMetadata;
}

// Individual drop/placement data for analytics
export interface GameDrop {
  partId: string;
  partLevel: number;
  accuracy: number; // 0-1 scale
  points: number;
  timestamp: number; // relative to session start
  placementValid: boolean;
  stabilityScore: number;
  position: { x: number; y: number };
}

// Session metadata for analytics
export interface SessionMetadata {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  screenSize: { width: number; height: number };
  userAgent: string;
  gameVersion: string;
  language: string;
  isReturningUser: boolean;
}

// Leaderboard entry
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  level: number;
  rank: number;
  timestamp: Timestamp;
  sessionId: string;
  isAnonymous: boolean;
  castleData?: CastleSnapshot; // Optional castle configuration for sharing
}

// Castle snapshot for sharing high-score castles
export interface CastleSnapshot {
  parts: CastlePartData[];
  maxHeight: number;
  totalParts: number;
  stabilityScore: number;
  levelDistribution: Record<number, number>; // Level -> count
}

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  requirements: AchievementRequirements;
  rewards: AchievementRewards;
  rarity: AchievementRarity;
  isSecret: boolean; // Hidden until unlocked
  icon: string; // Icon identifier
  sortOrder: number;
}

// Achievement categories
export type AchievementCategory = 
  | 'building' // Castle building achievements
  | 'precision' // Accuracy and placement achievements
  | 'progression' // Level and score achievements  
  | 'persistence' // Time and session achievements
  | 'exploration' // Trying different things
  | 'mastery' // High skill achievements
  | 'social' // Leaderboard and sharing achievements
  | 'special'; // Event or secret achievements

// Achievement types
export type AchievementType = 
  | 'count' // Reach X number of something
  | 'threshold' // Exceed a certain value
  | 'streak' // Consecutive successes
  | 'perfect' // Complete something without errors
  | 'time' // Time-based achievements
  | 'combination' // Complex multi-requirement
  | 'discovery'; // Find or unlock something

// Achievement requirements (flexible system)
export interface AchievementRequirements {
  // Count-based requirements
  totalCastles?: number;
  totalParts?: number;
  perfectDrops?: number;
  
  // Threshold requirements
  singleGameScore?: number;
  totalScore?: number;
  levelReached?: number;
  
  // Streak requirements
  consecutiveCorrect?: number;
  consecutiveLevels?: number;
  
  // Time requirements
  totalPlayTime?: number; // in seconds
  fastestLevel?: number; // complete level in X seconds
  
  // Perfect requirements
  perfectLevel?: boolean; // complete level without mistakes
  noCollapses?: boolean; // never have castle collapse
  
  // Complex requirements
  multiRequirements?: {
    operator: 'AND' | 'OR';
    conditions: AchievementRequirements[];
  };
  
  // Special requirements
  useAllLevels?: boolean; // use parts from all 6 levels in one game
  buildTower?: { minHeight: number; maxWidth: number }; // build tall, narrow castle
}

// Achievement rewards
export interface AchievementRewards {
  points: number; // Points added to total score
  title?: string; // Special title/badge
  unlocksAchievement?: string; // Unlocks another achievement
  specialContent?: string; // Unlocks special game content
}

// Achievement rarity levels
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// User achievement progress tracking
export interface UserAchievement {
  achievementId: string;
  userId: string;
  progress: number; // Current progress toward requirement
  maxProgress: number; // Total needed for completion
  isCompleted: boolean;
  completedAt?: Timestamp;
  notified: boolean; // Whether user has been notified of completion
}

// Cloud save data structure
export interface CloudSave {
  userId: string;
  saveId: string;
  timestamp: Timestamp;
  version: string; // Game version
  gameState: GameState;
  userProfile: Partial<UserProfile>; // Relevant profile data
  sessionData: {
    currentLevelIndex: number;
    droppedParts: CastlePartData[];
    statistics: Partial<UserStatistics>;
  };
  metadata: {
    deviceType: string;
    platform: string;
    autoSave: boolean; // true for automatic saves, false for manual
  };
}

// Social features
export interface FriendRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  toDisplayName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}

export interface Friendship {
  friendshipId: string;
  user1Id: string;
  user2Id: string;
  user1DisplayName: string;
  user2DisplayName: string;
  createdAt: Timestamp;
  lastInteraction?: Timestamp;
}

// Shared castle/score
export interface SharedContent {
  contentId: string;
  userId: string;
  displayName: string;
  type: 'score' | 'castle' | 'achievement';
  content: {
    score?: number;
    level?: number;
    castle?: CastleSnapshot;
    achievement?: string;
    description?: string;
  };
  isPublic: boolean;
  likes: number;
  shares: number;
  createdAt: Timestamp;
  tags: string[];
}

// Real-time notifications
export interface GameNotification {
  notificationId: string;
  userId: string;
  type: 'achievement' | 'friend_request' | 'leaderboard' | 'game_update';
  title: string;
  message: string;
  data?: any; // Additional notification data
  isRead: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// Firestore collection names (for consistency)
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  LEADERBOARDS: 'leaderboards',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  CLOUD_SAVES: 'cloud_saves',
  FRIEND_REQUESTS: 'friend_requests',
  FRIENDSHIPS: 'friendships',
  SHARED_CONTENT: 'shared_content',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics'
} as const;

// Leaderboard types for different categories
export type LeaderboardType = 
  | 'global_high_score' // Overall highest scores
  | 'weekly_high_score' // This week's highest scores
  | 'monthly_high_score' // This month's highest scores
  | 'level_best' // Best scores per level
  | 'friends_only' // Friends-only leaderboard
  | 'fastest_completion' // Fastest level completions
  | 'most_castles' // Most castles built
  | 'perfect_games'; // Most perfect games

// API response types for Firebase functions
export interface FirebaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
  totalEntries: number;
  lastUpdated: Timestamp;
}

export interface AchievementResponse {
  achievements: Achievement[];
  userProgress: UserAchievement[];
  newlyUnlocked: string[]; // Recently unlocked achievement IDs
  totalPoints: number;
}

// Error types for Firebase operations
export type FirebaseError = {
  code: string;
  message: string;
  details?: any;
};

// Custom claims for user roles (if needed later)
export interface UserClaims {
  admin?: boolean;
  moderator?: boolean;
  betaTester?: boolean;
  premium?: boolean;
} 