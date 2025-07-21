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
 * - Google profile picture loading with round cropping
 * - Default avatar with user initials
 * - Multiple styling options (full, compact, minimal, chip)
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
 * // Chip style with round photo and name
 * const chipUserButton = createUserButton(this, {
 *   x: this.scale.width / 2,
 *   y: 50,
 *   style: 'chip',
 *   onClick: () => this.openUserMenu()
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
  /** Width of the button (default: auto-calculated based on content) */
  width?: number;
  /** Height of the button (default: 50) */
  height?: number;
  /** Whether to show the user's name (default: true) */
  showName?: boolean;
  /** Whether to show the user's picture (default: true) */
  showPicture?: boolean;
  /** Styling option: 'full' | 'compact' | 'minimal' | 'chip' (default: 'full') */
  style?: 'compact' | 'full' | 'minimal' | 'chip';
  /** Optional click handler */
  onClick?: () => void;
  /** Optional callback when authentication state changes */
  onAuthStateChanged?: (isAuthenticated: boolean, isAnonymous: boolean) => void;
  /** Minimum width for the button (default: 120) */
  minWidth?: number;
  /** Maximum width for the button (default: 300) */
  maxWidth?: number;
  /** Padding around content (default: 20) */
  padding?: number;
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
      height: 50,
      showName: true,
      showPicture: true,
      style: 'full',
      minWidth: 120,
      maxWidth: 300,
      padding: 20,
      ...options
    };
    
    this.container = scene.add.container(options.x, options.y);
    this.createUI();
    this.setupAuthStateListener();
  }

  private createUI(): void {
    // Create background first (so it's behind everything)
    this.createBackground();

    // Create profile picture
    if (this.options.showPicture) {
      this.createProfilePicture();
    }

    // Create user name text (on top of background)
    if (this.options.showName) {
      this.createUserNameText();
    }

    // Make interactive if onClick is provided
    if (this.options.onClick) {
      this.makeInteractive();
    }

    // Initially hide the container
    this.container.setVisible(false);
    
    // Set initial positioning
    this.updateButtonWidth();
  }

  private calculateInitialWidth(): number {
    const { height = 50, style, minWidth = 120, maxWidth = 300, padding = 20 } = this.options;
    
    let totalWidth = padding * 2; // Start with padding on both sides
    
    // Add photo width
    if (this.options.showPicture) {
      let photoSize: number;
      switch (style) {
        case 'compact':
          photoSize = height * 0.8;
          break;
        case 'chip':
          photoSize = height * 0.7;
          break;
        default:
          photoSize = 40;
          break;
      }
      totalWidth += photoSize;
    }
    
    // Add estimated text width for initial creation
    if (this.options.showName) {
      totalWidth += 80; // Estimated text width
    }
    
    // Apply min/max constraints
    return Math.max(minWidth, Math.min(maxWidth, totalWidth));
  }

  private calculateDynamicWidth(): number {
    const { height = 50, style, minWidth = 120, maxWidth = 300, padding = 20 } = this.options;
    
    let totalWidth = padding * 2; // Start with padding on both sides
    
    // Add photo width
    if (this.options.showPicture) {
      let photoSize: number;
      switch (style) {
        case 'compact':
          photoSize = height * 0.8;
          break;
        case 'chip':
          photoSize = height * 0.7;
          break;
        default:
          photoSize = 40;
          break;
      }
      totalWidth += photoSize;
    }
    
    // Add text width if showing name
    if (this.options.showName && this.userNameText) {
      const textWidth = this.userNameText.width;
      totalWidth += textWidth + 10; // Add spacing between photo and text
    }
    
    // Apply min/max constraints
    return Math.max(minWidth, Math.min(maxWidth, totalWidth));
  }

  private updateButtonWidth(): void {
    const dynamicWidth = this.calculateDynamicWidth();
    
    // Update background with new width
    this.updateBackground();
    
    // Update photo position to be left-aligned
    if (this.userProfilePicture) {
      const { height = 50, style, padding = 20 } = this.options;
      let pictureSize: number;
      
      switch (style) {
        case 'compact':
          pictureSize = height * 0.8;
          break;
        case 'chip':
          pictureSize = height * 0.7;
          break;
        default:
          pictureSize = 40;
          break;
      }
      
      // Position photo at the left edge with padding
      const leftPosition = -(dynamicWidth / 2) + padding;
      this.userProfilePicture.setPosition(leftPosition, 0);
      console.log('[UserButton] Photo positioned at:', leftPosition, 'for width:', dynamicWidth, 'padding:', padding);
    }
    
    // Update text position
    if (this.userNameText) {
      const { height = 50, style, padding = 20 } = this.options;
      let pictureSize: number;
      
      switch (style) {
        case 'compact':
          pictureSize = height * 0.8;
          break;
        case 'chip':
          pictureSize = height * 0.7;
          break;
        default:
          pictureSize = 40;
          break;
      }
      
      // Position text after the photo
      const leftPosition = -(dynamicWidth / 2) + padding;
      const textX = leftPosition + pictureSize + 15;
      this.userNameText.setPosition(textX, 0);
      this.userNameText.setDepth(1); // Ensure text is on top
    }
    
    // Update interactive area
    if (this.options.onClick) {
      this.container.setSize(dynamicWidth, this.options.height || 50);
    }
  }

  private createBackground(): void {
    const { height = 50, style } = this.options;
    
    // For initial creation, use a default width
    // The width will be updated later when we have the text
    const initialWidth = this.options.width || this.calculateInitialWidth();
    
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
        
      case 'chip':
        // Pill-shaped background for chip style
        const chipHeight = height;
        const chipWidth = initialWidth;
        const radius = chipHeight / 2;
        
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
        break;
        
      case 'minimal':
        // No background
        break;
        
      case 'full':
      default:
        // Full rectangular background with rounded corners
        this.background.fillStyle(0x3498DB, 0.8);
        this.background.fillRoundedRect(-initialWidth / 2, -height / 2, initialWidth, height, 10);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-initialWidth / 2, -height / 2, initialWidth, height, 10);
        break;
    }

    this.container.add(this.background);
  }

  private createProfilePicture(): void {
    const { height = 50, style, padding = 20 } = this.options;
    let pictureSize: number;
    
    switch (style) {
      case 'compact':
        pictureSize = height * 0.8;
        break;
      case 'chip':
        pictureSize = height * 0.7;
        break;
      default:
        pictureSize = 40;
        break;
    }

    // Create a simple colored circle as the default profile picture
    const defaultProfile = this.scene.add.graphics();
    defaultProfile.fillStyle(0x3498DB); // Blue background
    defaultProfile.fillCircle(0, 0, pictureSize / 2);
    defaultProfile.lineStyle(2, 0xFFFFFF);
    defaultProfile.strokeCircle(0, 0, pictureSize / 2);
    
    // Add a user icon
    const placeholderText = this.scene.add.text(0, 0, '👤', {
      fontSize: `${pictureSize * 0.4}px`,
      fontFamily: 'Arial, sans-serif'
    });
    placeholderText.setOrigin(0.5);
    
    // Create a container for the default profile - position will be set later
    const profileContainer = this.scene.add.container(0, 0, [defaultProfile, placeholderText]);
    profileContainer.setVisible(false);
    
    // Store the container as the profile picture
    this.userProfilePicture = profileContainer as any;
    
    // Add the container to the main container
    this.container.add(profileContainer);
  }

  private makeImageRound(image: Phaser.GameObjects.Image, size: number): void {
    // Create a circular mask to make the image round
    const mask = this.scene.add.graphics();
    mask.fillStyle(0xFFFFFF);
    mask.fillCircle(0, 0, size / 2);
    
    // Apply the mask to the image
    image.setMask(mask.createGeometryMask());
  }

  private createUserNameText(): void {
    const { height = 50, style } = this.options;
    
    let fontSize = '16px';
    
    switch (style) {
      case 'compact':
        // For compact style, don't show text
        return;
      case 'chip':
        fontSize = '16px';
        break;
      case 'full':
        fontSize = '18px';
        break;
      default:
        fontSize = '16px';
        break;
    }

    this.userNameText = this.scene.add.text(0, 0, '', {
      fontSize,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#2C3E50',
      strokeThickness: 1
    });
    this.userNameText.setOrigin(0, 0.5);
    this.userNameText.setVisible(false);
    this.userNameText.setDepth(1); // Ensure text is on top

    this.container.add(this.userNameText);
  }

  private makeInteractive(): void {
    const dynamicWidth = this.calculateDynamicWidth();
    this.container.setSize(dynamicWidth, this.options.height || 50);
    this.container.setInteractive();

    // Add hover effects
    this.container.on('pointerover', () => {
      this.container.setScale(1.05);
      this.updateBackground(true); // true for hover state
    });

    this.container.on('pointerout', () => {
      this.container.setScale(1);
      this.updateBackground(false); // false for normal state
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

  private updateBackground(isHover: boolean = false): void {
    if (!this.background) return;

    const { height = 50, style } = this.options;
    const backgroundColor = isHover ? 0x2980B9 : 0x3498DB;
    const alpha = isHover ? 0.9 : 0.8;
    
    // Calculate dynamic width
    const dynamicWidth = this.calculateDynamicWidth();
    
    this.background.clear();
    
    switch (style) {
      case 'compact':
        this.background.fillStyle(backgroundColor, alpha);
        this.background.fillCircle(0, 0, height / 2);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeCircle(0, 0, height / 2);
        break;
        
      case 'chip':
        // Pill-shaped background for chip style
        const chipHeight = height;
        const chipWidth = dynamicWidth;
        const radius = chipHeight / 2;
        
        this.background.fillStyle(backgroundColor, alpha);
        this.background.fillRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
        break;
        
      case 'full':
        this.background.fillStyle(backgroundColor, alpha);
        this.background.fillRoundedRect(-dynamicWidth / 2, -height / 2, dynamicWidth, height, 10);
        this.background.lineStyle(2, 0xFFFFFF);
        this.background.strokeRoundedRect(-dynamicWidth / 2, -height / 2, dynamicWidth, height, 10);
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
        
        // Update button width based on new text
        this.updateButtonWidth();
      }

      // Handle profile picture - always show the default profile picture
      if (this.userProfilePicture) {
        // For now, always show the default profile picture
        // In the future, we can implement proper image loading
        this.userProfilePicture.setVisible(true);
        
        // Create a default avatar with user's initials
        this.createDefaultAvatar(displayName);
      }

      // Update button width and positioning after showing profile
      this.updateButtonWidth();

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
    
    // Add error handling for the load
    this.scene.load.once('loaderror', (file: any) => {
      console.warn('[UserButton] Failed to load profile picture:', file.src);
      // Fall back to default avatar
      this.createDefaultAvatar('User');
    });

    this.scene.load.image(textureKey, photoURL);
    
    this.scene.load.once('complete', () => {
      if (this.userProfilePicture) {
        try {
          this.userProfilePicture.setTexture(textureKey);
          this.userProfilePicture.setVisible(true);
          
          // Reapply the round mask after texture change
          const { height = 50, style } = this.options;
          let pictureSize: number;
          
          switch (style) {
            case 'compact':
              pictureSize = height * 0.8;
              break;
            case 'chip':
              pictureSize = height * 0.7;
              break;
            default:
              pictureSize = 40;
              break;
          }
          
          this.makeImageRound(this.userProfilePicture, pictureSize);
          console.log('[UserButton] ✅ Profile picture loaded successfully');
        } catch (error) {
          console.error('[UserButton] Error setting profile picture texture:', error);
          // Fall back to default avatar
          this.createDefaultAvatar('User');
        }
      }
    });

    // Start loading
    this.scene.load.start();
  }

  private createDefaultAvatar(displayName: string): void {
    if (!this.userProfilePicture) return;

    const { height = 50, style, padding = 20 } = this.options;
    let avatarSize: number;
    
    switch (style) {
      case 'compact':
        avatarSize = height * 0.6;
        break;
      case 'chip':
        avatarSize = height * 0.5;
        break;
      default:
        avatarSize = 32;
        break;
    }

    // Get initials from display name
    const initials = displayName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');

    // Calculate the left position for the avatar
    const dynamicWidth = this.calculateDynamicWidth();
    const leftPosition = -(dynamicWidth / 2) + padding * 1.5;

    // Create a graphics object for the avatar background
    const graphics = this.scene.add.graphics();
    
    // Create a circular background
    graphics.fillStyle(0x2ECC71); // Green background
    graphics.fillCircle(leftPosition, 0, avatarSize / 2);
    
    // Add white border
    graphics.lineStyle(2, 0xFFFFFF);
    graphics.strokeCircle(leftPosition, 0, avatarSize / 2);

    // Add initials text
    let fontSize: string;
    switch (style) {
      case 'compact':
        fontSize = '12px';
        break;
      case 'chip':
        fontSize = '14px';
        break;
      default:
        fontSize = '14px';
        break;
    }
    
    const initialsText = this.scene.add.text(leftPosition, 0, initials, {
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
    if (this.userProfilePicture && typeof this.userProfilePicture.setVisible === 'function') {
      this.userProfilePicture.setVisible(false);
    }
  }

  private clearAvatarElements(): void {
    // Remove and destroy existing avatar elements
    this.avatarElements.forEach(element => {
      this.container.remove(element);
      element.destroy();
    });
    this.avatarElements = [];

    // Show the original profile picture again
    if (this.userProfilePicture && typeof this.userProfilePicture.setVisible === 'function') {
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