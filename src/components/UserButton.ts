import { Scene } from 'phaser';
import { firebaseManager } from '@/utils/FirebaseConfig';
import { firebaseService } from '@/utils/FirebaseService';
import { User } from 'firebase/auth';

/**
 * UserButton Component
 * 
 * A reusable component that displays user profile information (name and picture)
 * when the user is authenticated. Automatically handles authentication state changes
 * and provides different styling options.
 * 
 * Features:
 * - Automatic authentication state monitoring
 * - Google profile picture loading
 * - Default avatar with user initials
 * - Multiple styling options (full, compact, minimal)
 * - Interactive with hover effects and click animations
 * - Responsive design
 * 
 * Usage Examples:
 * 
 * // Basic usage in a scene
 * const userButton = createUserButton(this, {
 *   x: this.scale.width / 2,
 *   y: this.scale.height * 0.95,
 *   style: 'full'
 * });
 * 
 * // Compact style for top-right corner
 * const compactUserButton = createUserButton(this, {
 *   x: this.scale.width - 30,
 *   y: 30,
 *   style: 'compact',
 *   showName: false
 * });
 * 
 * // Minimal style with custom click handler
 * const minimalUserButton = createUserButton(this, {
 *   x: 20,
 *   y: 20,
 *   style: 'minimal',
 *   onClick: () => this.openUserMenu()
 * });
 */
export interface UserButtonOptions {
  /** X position of the button */
  x: number;
  /** Y position of the button */
  y: number;
  /** Width of the button (default: 200) */
  width?: number;
  /** Height of the button (default: 50) */
  height?: number;
  /** Whether to show the user's name (default: true) */
  showName?: boolean;
  /** Whether to show the user's picture (default: true) */
  showPicture?: boolean;
  /** Styling option: 'full' | 'compact' | 'minimal' (default: 'full') */
  style?: 'compact' | 'full' | 'minimal';
  /** Optional click handler */
  onClick?: () => void;
  /** Optional callback when authentication state changes */
  onAuthStateChanged?: (isAuthenticated: boolean, isAnonymous: boolean) => void;
}

export class UserButton {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private options: UserButtonOptions;
  private userProfilePicture?: Phaser.GameObjects.Image;
  private userNameText?: Phaser.GameObjects.Text;
  private background?: Phaser.GameObjects.Graphics;
  private authStateUnsubscribe?: () => void;
  private avatarElements: Phaser.GameObjects.GameObject[] = [];
  private isAuthenticated: boolean = false;
  private isAnonymous: boolean = false;

  constructor(scene: Scene, options: UserButtonOptions) {
    this.scene = scene;
    this.options = {
      width: 200,
      height: 50,
      showName: true,
      showPicture: true,
      style: 'full',
      ...options
    };
    
    this.container = scene.add.container(options.x, options.y);
    this.createUI();
    this.setupAuthStateListener();
  }

  private createUI(): void {
    // Create background based on style
    this.createBackground();

    // Create profile picture
    if (this.options.showPicture) {
      this.createProfilePicture();
    }

    // Create user name text
    if (this.options.showName) {
      this.createUserNameText();
    }

    // Make interactive if onClick is provided
    if (this.options.onClick) {
      this.makeInteractive();
    }

    // Initially hide the container
    this.container.setVisible(false);
  }

  private createBackground(): void {
    const { width = 200, height = 50, style } = this.options;
    
    this.background = this.scene.add.graphics();
    
    // Different background styles
    switch (style) {
      case 'compact':
        // Small circular background
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillCircle(0, 0, height / 2);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeCircle(0, 0, height / 2);
        break;
        
      case 'minimal':
        // No background
        break;
        
      case 'full':
      default:
        // Full rectangular background with rounded corners
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        break;
    }

    this.container.add(this.background);
  }

  private createProfilePicture(): void {
    const { height = 50, style } = this.options;
    const pictureSize = style === 'compact' ? height * 0.8 : 40;

    this.userProfilePicture = this.scene.add.image(0, 0, 'particle'); // Use existing particle texture as placeholder
    this.userProfilePicture.setDisplaySize(pictureSize, pictureSize);
    this.userProfilePicture.setOrigin(0.5);
    this.userProfilePicture.setVisible(false);

    this.container.add(this.userProfilePicture);
  }

  private createUserNameText(): void {
    const { style } = this.options;
    
    let x = 0;
    let fontSize = '16px';
    
    if (style === 'compact') {
      // For compact style, don't show text
      return;
    } else if (style === 'full') {
      // For full style, position text next to picture
      x = 50;
      fontSize = '18px';
    } else {
      // For minimal style, center text
      x = 0;
      fontSize = '16px';
    }

    this.userNameText = this.scene.add.text(x, 0, '', {
      fontSize,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#2C3E50',
      strokeThickness: 1
    });
    this.userNameText.setOrigin(0, 0.5);
    this.userNameText.setVisible(false);

    this.container.add(this.userNameText);
  }

  private makeInteractive(): void {
    this.container.setSize(this.options.width || 200, this.options.height || 50);
    this.container.setInteractive();

    // Add hover effects
    this.container.on('pointerover', () => {
      this.container.setScale(1.05);
      if (this.background) {
        this.background.clear();
        this.background.fillStyle(0x2980B9, 0.9);
        this.background.fillRoundedRect(-(this.options.width || 200) / 2, -(this.options.height || 50) / 2, this.options.width || 200, this.options.height || 50, 10);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-(this.options.width || 200) / 2, -(this.options.height || 50) / 2, this.options.width || 200, this.options.height || 50, 10);
      }
    });

    this.container.on('pointerout', () => {
      this.container.setScale(1);
      this.updateBackground();
    });

    this.container.on('pointerdown', () => {
      this.container.setScale(0.95);
      
      // Add satisfying click animation
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          if (this.options.onClick) {
            this.options.onClick();
          }
        }
      });
    });
  }

  private updateBackground(): void {
    if (!this.background) return;

    const { width = 200, height = 50, style } = this.options;
    
    this.background.clear();
    
    switch (style) {
      case 'compact':
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillCircle(0, 0, height / 2);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeCircle(0, 0, height / 2);
        break;
        
      case 'full':
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        break;
        
      case 'minimal':
        // No background for minimal style
        break;
    }
  }

  private setupAuthStateListener(): void {
    this.authStateUnsubscribe = firebaseManager.onAuthStateChanged((user: User | null) => {
      this.updateAuthState(user);
    });
  }

  private async updateAuthState(user: User | null): Promise<void> {
    this.isAuthenticated = !!user;
    this.isAnonymous = user?.isAnonymous || false;

    if (user) {
      await this.showUserProfile(user);
    } else {
      this.hideUserProfile();
    }

    // Notify parent component
    if (this.options.onAuthStateChanged) {
      this.options.onAuthStateChanged(this.isAuthenticated, this.isAnonymous);
    }
  }

  private async showUserProfile(user: User): Promise<void> {
    try {
      // Clear any existing avatar elements
      this.clearAvatarElements();

      // Get user profile from Firebase service for display name
      const userProfile = await firebaseService.getUserProfile();
      const displayName = userProfile?.displayName || user.displayName || `Player ${user.uid.slice(-6)}`;

      // Update user name text
      if (this.userNameText) {
        this.userNameText.setText(displayName);
        this.userNameText.setVisible(true);
      }

      // Handle profile picture
      if (this.userProfilePicture) {
        if (user.photoURL) {
          // Load user's profile picture
          this.loadUserProfilePicture(user.photoURL);
        } else {
          // Create a default avatar with user's initials
          this.createDefaultAvatar(displayName);
        }
      }

      // Show the container with animation
      this.container.setVisible(true);
      this.container.setScale(0);
      
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut'
      });

      console.log('[UserButton] ✅ User profile displayed:', displayName);
    } catch (error) {
      console.error('[UserButton] Failed to show user profile:', error);
      this.hideUserProfile();
    }
  }

  private loadUserProfilePicture(photoURL: string): void {
    if (!this.userProfilePicture) return;

    const textureKey = `profile-${Date.now()}`;
    this.scene.load.image(textureKey, photoURL);
    
    this.scene.load.once('complete', () => {
      if (this.userProfilePicture) {
        this.userProfilePicture.setTexture(textureKey);
        this.userProfilePicture.setVisible(true);
      }
    });

    this.scene.load.start();
  }

  private createDefaultAvatar(displayName: string): void {
    if (!this.userProfilePicture) return;

    const { height = 50, style } = this.options;
    const avatarSize = style === 'compact' ? height * 0.6 : 32;

    // Get initials from display name
    const initials = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

    // Create a graphics object for the avatar background
    const graphics = this.scene.add.graphics();
    
    // Create a circular background
    graphics.fillStyle(0x2ECC71); // Green background
    graphics.fillCircle(0, 0, avatarSize / 2);
    
    // Add white border
    graphics.lineStyle(2, 0xFFFFFF);
    graphics.strokeCircle(0, 0, avatarSize / 2);

    // Add initials text
    const fontSize = style === 'compact' ? '12px' : '14px';
    const initialsText = this.scene.add.text(0, 0, initials, {
      fontSize,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
    initialsText.setOrigin(0.5);

    // Add both elements to the container
    this.container.add([graphics, initialsText]);
    this.avatarElements.push(graphics, initialsText);

    // Hide the original profile picture since we're using graphics
    this.userProfilePicture.setVisible(false);
  }

  private clearAvatarElements(): void {
    // Remove and destroy existing avatar elements
    this.avatarElements.forEach(element => {
      this.container.remove(element);
      element.destroy();
    });
    this.avatarElements = [];

    // Show the original profile picture again
    if (this.userProfilePicture) {
      this.userProfilePicture.setVisible(true);
    }
  }

  private hideUserProfile(): void {
    // Clear avatar elements
    this.clearAvatarElements();

    // Hide with animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0,
      scaleY: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
      }
    });
  }

  // Public methods for external control

  /**
   * Get the container for positioning
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Set the position of the user button
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  /**
   * Set the scale of the user button
   */
  public setScale(scale: number): void {
    this.container.setScale(scale);
  }

  /**
   * Show the user button (if authenticated)
   */
  public show(): void {
    if (this.isAuthenticated) {
      this.container.setVisible(true);
    }
  }

  /**
   * Hide the user button
   */
  public hide(): void {
    this.container.setVisible(false);
  }

  /**
   * Check if user is authenticated
   */
  public isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Check if user is anonymous
   */
  public isUserAnonymous(): boolean {
    return this.isAnonymous;
  }

  /**
   * Manually trigger auth state update
   */
  public async refreshAuthState(): Promise<void> {
    const currentUser = firebaseManager.getCurrentUser();
    await this.updateAuthState(currentUser);
  }

  /**
   * Destroy the user button and clean up resources
   */
  public destroy(): void {
    // Clean up auth state listener
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
      this.authStateUnsubscribe = undefined;
    }

    // Clear avatar elements
    this.clearAvatarElements();

    // Destroy the container
    this.container.destroy();
  }
}

/**
 * Helper function to create a UserButton component
 * 
 * @param scene - The Phaser scene to add the button to
 * @param options - Configuration options for the button
 * @returns A new UserButton instance
 */
export function createUserButton(scene: Scene, options: UserButtonOptions): UserButton {
  return new UserButton(scene, options);
} 