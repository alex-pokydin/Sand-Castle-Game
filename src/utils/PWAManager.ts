/**
 * PWA Manager handles Progressive Web App features including
 * service worker registration, installation prompts, and offline functionality
 */
export class PWAManager {
  private static instance: PWAManager;
  private registration?: ServiceWorkerRegistration;
  private deferredPrompt?: any;
  private isInstalled: boolean = false;
  private updateAvailable: boolean = false;

  private constructor() {
    this.init();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  /**
   * Initialize PWA features
   */
  private async init(): Promise<void> {
    console.log('PWA Manager: Initializing...');
    console.log('PWA Manager: Development mode:', this.isDevelopmentMode());
    
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupUpdateDetection();
    this.checkInstallationStatus();
    
    console.log('PWA Manager: Status:', this.getPWAStatus());
  }

  /**
   * Check if we're in development mode
   */
  private isDevelopmentMode(): boolean {
    // Check for localhost development
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.port === '5173' ||
           window.location.protocol === 'http:';
  }

  /**
   * Check if we're in development mode (public method for debugging)
   */
  public isInDevelopmentMode(): boolean {
    return this.isDevelopmentMode();
  }

  /**
   * Register service worker for offline functionality
   */
  private async registerServiceWorker(): Promise<void> {
    // Skip service worker registration in development mode
    if (this.isDevelopmentMode()) {
      console.log('Service Worker: Skipped in development mode');
      // Unregister any existing service workers in development
      await this.unregisterServiceWorkers();
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.registration);

        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.showUpdateNotification();
              }
            });
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.warn('Service Worker not supported');
    }
  }

  /**
   * Unregister all service workers (for development mode)
   */
  private async unregisterServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service Worker unregistered:', registration);
        }
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    }
  }

  /**
   * Setup install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Store the event so it can be triggered later
      this.deferredPrompt = event;
      
      console.log('Install prompt ready');
      
      // Show custom install button if needed
      this.showInstallButton();
    });

    // Detect if app is already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('App installed successfully');
      
      // Hide install button
      this.hideInstallButton();
    });
  }

  /**
   * Setup update detection
   */
  private setupUpdateDetection(): void {
    if (this.registration) {
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.showUpdateNotification();
            }
          });
        }
      });
    }
  }

  /**
   * Check if app is already installed
   */
  private checkInstallationStatus(): void {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('App is running in standalone mode (installed)');
    }
  }

  /**
   * Show install button (custom implementation)
   */
  private showInstallButton(): void {
    // Create or show install button in UI
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        this.installApp();
      });
    }
  }

  /**
   * Hide install button
   */
  private hideInstallButton(): void {
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    // Create update notification
    const updateNotification = document.createElement('div');
    updateNotification.id = 'update-notification';
    updateNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 300px;
      ">
        <h4 style="margin: 0 0 10px 0;">Update Available</h4>
        <p style="margin: 0 0 15px 0;">A new version of Sand Castle Game is available!</p>
        <button id="update-button" style="
          background: white;
          color: #4CAF50;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        ">Update Now</button>
        <button id="dismiss-update" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Dismiss</button>
      </div>
    `;

    document.body.appendChild(updateNotification);

    // Handle update button click
    document.getElementById('update-button')?.addEventListener('click', () => {
      this.updateApp();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-update')?.addEventListener('click', () => {
      updateNotification.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (updateNotification.parentNode) {
        updateNotification.remove();
      }
    }, 10000);
  }

  /**
   * Trigger app installation
   */
  public async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.isInstalled = true;
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferred prompt
      this.deferredPrompt = null;

      // Hide install button
      this.hideInstallButton();

    } catch (error) {
      console.error('Error during app installation:', error);
    }
  }

  /**
   * Update the app
   */
  public async updateApp(): Promise<void> {
    if (this.registration && this.updateAvailable) {
      try {
        // Send message to service worker to skip waiting
        if (this.registration.waiting) {
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Reload the page to activate the new service worker
        window.location.reload();
      } catch (error) {
        console.error('Error updating app:', error);
      }
    }
  }

  /**
   * Check if app can be installed
   */
  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  /**
   * Check if app is installed
   */
  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Check if update is available
   */
  public hasUpdate(): boolean {
    return this.updateAvailable;
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Send notification
   */
  public sendNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted' && this.registration) {
      this.registration.showNotification(title, {
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        ...options
      });
    }
  }

  /**
   * Cache game data for offline use
   */
  public cacheGameData(data: any): void {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'CACHE_GAME_DATA',
        data: data
      });
    }
  }

  /**
   * Check if app is running offline
   */
  public isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get offline status
   */
  public getOfflineStatus(): { isOffline: boolean; lastOnline?: Date } {
    return {
      isOffline: !navigator.onLine,
      lastOnline: this.getLastOnlineTime()
    };
  }

  /**
   * Get last online time from localStorage
   */
  private getLastOnlineTime(): Date | undefined {
    const lastOnline = localStorage.getItem('lastOnline');
    return lastOnline ? new Date(lastOnline) : undefined;
  }

  /**
   * Update last online time
   */
  private updateLastOnlineTime(): void {
    localStorage.setItem('lastOnline', new Date().toISOString());
  }

  /**
   * Setup online/offline event listeners
   */
  public setupConnectivityListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.updateLastOnlineTime();
      this.showOnlineNotification();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.showOfflineNotification();
    });
  }

  /**
   * Show online notification
   */
  private showOnlineNotification(): void {
    this.sendNotification('Sand Castle Game', {
      body: 'You\'re back online!',
      icon: '/assets/icons/icon-192x192.png'
    });
  }

  /**
   * Show offline notification
   */
  private showOfflineNotification(): void {
    this.sendNotification('Sand Castle Game', {
      body: 'You\'re offline. Some features may be limited.',
      icon: '/assets/icons/icon-192x192.png'
    });
  }

  /**
   * Get PWA status information
   */
  public getPWAStatus(): {
    isInstalled: boolean;
    canInstall: boolean;
    hasUpdate: boolean;
    isOffline: boolean;
    notificationsEnabled: boolean;
    serviceWorkerEnabled: boolean;
  } {
    return {
      isInstalled: this.isInstalled,
      canInstall: this.canInstall(),
      hasUpdate: this.updateAvailable,
      isOffline: this.isOffline(),
      notificationsEnabled: Notification.permission === 'granted',
      serviceWorkerEnabled: !this.isDevelopmentMode() && !!this.registration
    };
  }
} 