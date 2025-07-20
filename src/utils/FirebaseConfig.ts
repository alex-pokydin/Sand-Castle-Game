import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, User, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  enableNetwork, 
  disableNetwork,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  // TODO: Replace with your actual Firebase config
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sand-castle-game-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sand-castle-game-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sand-castle-game-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234"
};

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  analytics?: Analytics;
}

export class FirebaseManager {
  private static instance: FirebaseManager;
  private services: FirebaseServices | null = null;
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];
  private isOnline: boolean = navigator.onLine;
  
  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.enableFirestore();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.disableFirestore();
    });
  }

  static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  /**
   * Initialize Firebase services
   */
  async initialize(): Promise<FirebaseServices> {
    try {
      console.log('[Firebase] Initializing Firebase services...');
      
      // Initialize Firebase app
      const app = initializeApp(firebaseConfig);
      
      // Initialize Auth
      const auth = getAuth(app);
      
      // Initialize Firestore
      const firestore = getFirestore(app);
      
      // Initialize Analytics (only in production)
      let analytics: Analytics | undefined;
      if (import.meta.env.PROD && typeof window !== 'undefined') {
        try {
          analytics = getAnalytics(app);
        } catch (error) {
          console.warn('[Firebase] Analytics not available:', error);
        }
      }
      
      // Connect to Firestore emulator in development
      if (import.meta.env.DEV) {
        try {
          connectFirestoreEmulator(firestore, 'localhost', 8080);
          console.log('[Firebase] Connected to Firestore emulator');
        } catch (error) {
          // Emulator might already be connected
          console.log('[Firebase] Firestore emulator connection skipped (likely already connected)');
        }
      }
      
      this.services = { app, auth, firestore, analytics };
      
      // Set up auth state listener
      this.setupAuthStateListener();
      
      // Handle offline/online state
      if (!this.isOnline) {
        await this.disableFirestore();
      }
      
      console.log('[Firebase] ✅ Firebase services initialized successfully');
      return this.services;
      
    } catch (error) {
      console.error('[Firebase] ❌ Failed to initialize Firebase:', error);
      throw error;
    }
  }

  /**
   * Get Firebase services (initializes if needed)
   */
  async getServices(): Promise<FirebaseServices> {
    if (!this.services) {
      return await this.initialize();
    }
    return this.services;
  }

  /**
   * Sign in anonymously (for guest users)
   */
  async signInAnonymously(): Promise<User> {
    try {
      const services = await this.getServices();
      const result = await signInAnonymously(services.auth);
      console.log('[Firebase] ✅ Anonymous authentication successful');
      return result.user;
    } catch (error) {
      console.error('[Firebase] ❌ Anonymous authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get user ID (anonymous or authenticated)
   */
  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Enable Firestore (when coming back online)
   */
  private async enableFirestore(): Promise<void> {
    if (this.services?.firestore) {
      try {
        await enableNetwork(this.services.firestore);
        console.log('[Firebase] ✅ Firestore network enabled');
      } catch (error) {
        console.warn('[Firebase] Failed to enable Firestore network:', error);
      }
    }
  }

  /**
   * Disable Firestore (when going offline)
   */
  private async disableFirestore(): Promise<void> {
    if (this.services?.firestore) {
      try {
        await disableNetwork(this.services.firestore);
        console.log('[Firebase] 📴 Firestore network disabled');
      } catch (error) {
        console.warn('[Firebase] Failed to disable Firestore network:', error);
      }
    }
  }

  /**
   * Set up auth state listener
   */
  private setupAuthStateListener(): void {
    if (!this.services?.auth) return;
    
    onAuthStateChanged(this.services.auth, (user) => {
      this.currentUser = user;
      console.log('[Firebase] Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      // Notify all listeners
      this.authStateListeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('[Firebase] Auth state listener error:', error);
        }
      });
    });
  }
}

// Export singleton instance
export const firebaseManager = FirebaseManager.getInstance();

// Debug functions for development
export const debugFirebase = {
  getServices: () => firebaseManager.getServices(),
  getCurrentUser: () => firebaseManager.getCurrentUser(),
  signInAnonymously: () => firebaseManager.signInAnonymously(),
  isOnline: () => firebaseManager.isOnlineStatus(),
  isAuthenticated: () => firebaseManager.isAuthenticated()
};

// Make debug functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugFirebase = debugFirebase;
} 