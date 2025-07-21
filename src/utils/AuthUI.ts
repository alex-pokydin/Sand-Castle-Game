import { Scene } from 'phaser';
import { firebaseService } from './FirebaseService';
import { createKidFriendlyButton, BUTTON_CONFIGS } from './ButtonUtils';
import { createResponsiveText, TEXT_CONFIGS } from './TextUtils';
import { tSync } from '@/i18n';

export interface AuthUIOptions {
  x: number;
  y: number;
  width?: number;
  onAuthStateChanged?: (isAuthenticated: boolean, isAnonymous: boolean) => void;
}

export class AuthUI {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private options: AuthUIOptions;
  private authStateText?: Phaser.GameObjects.Text;
  private signInButton?: Phaser.GameObjects.Container;
  private signOutButton?: Phaser.GameObjects.Container;
  private linkButton?: Phaser.GameObjects.Container;
  private isLoading: boolean = false;

  constructor(scene: Scene, options: AuthUIOptions) {
    this.scene = scene;
    this.options = options;
    this.container = scene.add.container(options.x, options.y);
    this.createUI();
    this.updateAuthState();
  }

  private createUI(): void {
    // Create auth state text
    const authStateResult = createResponsiveText(
      this.scene,
      -120,
      0,
      '',
      TEXT_CONFIGS.STATS_SMALL
    );
    this.authStateText = authStateResult.text;
    this.container.add(this.authStateText);

    // Create sign in button
    this.signInButton = createKidFriendlyButton(
      this.scene,
      0,
      60,
      tSync('Sign In with Google'),
      BUTTON_CONFIGS.PRIMARY,
      () => this.handleSignIn()
    );
    this.container.add(this.signInButton);

    // Create sign out button
    this.signOutButton = createKidFriendlyButton(
      this.scene,
      0,
      60,
      tSync('Sign Out'),
      BUTTON_CONFIGS.WARNING,
      () => this.handleSignOut()
    );
    this.container.add(this.signOutButton);

    // Create link account button
    this.linkButton = createKidFriendlyButton(
      this.scene,
      0,
      120,
      tSync('Link Google Account'),
      BUTTON_CONFIGS.SECONDARY,
      () => this.handleLinkAccount()
    );
    this.container.add(this.linkButton);

    // Set initial visibility
    this.updateButtonVisibility();
  }

  private async handleSignIn(): Promise<void> {
    if (this.isLoading) return;
    
    this.setLoading(true);
    try {
      await firebaseService.signInWithGoogle();
      this.updateAuthState();
    } catch (error) {
      console.error('[AuthUI] Sign in failed:', error);
      // Show error message to user
      this.showError(tSync('Sign in failed. Please try again.'));
    } finally {
      this.setLoading(false);
    }
  }

  private async handleSignOut(): Promise<void> {
    if (this.isLoading) return;
    
    this.setLoading(true);
    try {
      await firebaseService.signOut();
      this.updateAuthState();
    } catch (error) {
      console.error('[AuthUI] Sign out failed:', error);
      this.showError(tSync('Sign out failed. Please try again.'));
    } finally {
      this.setLoading(false);
    }
  }

  private async handleLinkAccount(): Promise<void> {
    if (this.isLoading) return;
    
    this.setLoading(true);
    try {
      await firebaseService.linkWithGoogle();
      this.updateAuthState();
    } catch (error) {
      console.error('[AuthUI] Account linking failed:', error);
      this.showError(tSync('Account linking failed. Please try again.'));
    } finally {
      this.setLoading(false);
    }
  }

  private updateAuthState(): void {
    const isAuthenticated = firebaseService.isAuthenticated();
    const isAnonymous = firebaseService.isAnonymous();
    const hasGoogleAccount = firebaseService.hasGoogleAccount();

    // Update auth state text
    if (this.authStateText) {
      if (isAuthenticated) {
        if (hasGoogleAccount) {
          this.authStateText.setText(tSync('Signed in with Google'));
        } else if (isAnonymous) {
          this.authStateText.setText(tSync('Playing as Guest'));
        } else {
          this.authStateText.setText(tSync('Signed In'));
        }
      } else {
        this.authStateText.setText(tSync('Not Signed In'));
      }
    }

    // Update button visibility
    this.updateButtonVisibility();

    // Notify parent component
    if (this.options.onAuthStateChanged) {
      this.options.onAuthStateChanged(isAuthenticated, isAnonymous);
    }
  }

  private updateButtonVisibility(): void {
    const isAuthenticated = firebaseService.isAuthenticated();
    const isAnonymous = firebaseService.isAnonymous();

    // Show/hide sign in button
    if (this.signInButton) {
      this.signInButton.setVisible(!isAuthenticated);
    }

    // Show/hide sign out button
    if (this.signOutButton) {
      this.signOutButton.setVisible(isAuthenticated);
    }

    // Show/hide link button (only for anonymous users)
    if (this.linkButton) {
      this.linkButton.setVisible(isAuthenticated && isAnonymous);
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    
    // Update button states
    const buttons = [this.signInButton, this.signOutButton, this.linkButton];
    buttons.forEach(button => {
      if (button) {
        button.setAlpha(loading ? 0.5 : 1);
        button.setInteractive(!loading);
      }
    });
  }

  private showError(message: string): void {
    // Create temporary error message
    const errorResult = createResponsiveText(
      this.scene,
      0,
      -40,
      message,
      { ...TEXT_CONFIGS.STATS_SMALL, color: '#ff4444' }
    );
    this.container.add(errorResult.text);

    // Remove after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      errorResult.text.destroy();
    });
  }

  /**
   * Update UI when language changes
   */
  public updateLanguage(): void {
    if (this.authStateText) {
      this.updateAuthState();
    }

    // Update button texts
    if (this.signInButton) {
      const buttonText = this.signInButton.getByName('text') as Phaser.GameObjects.Text;
      if (buttonText) {
        buttonText.setText(tSync('Sign In with Google'));
      }
    }

    if (this.signOutButton) {
      const buttonText = this.signOutButton.getByName('text') as Phaser.GameObjects.Text;
      if (buttonText) {
        buttonText.setText(tSync('Sign Out'));
      }
    }

    if (this.linkButton) {
      const buttonText = this.linkButton.getByName('text') as Phaser.GameObjects.Text;
      if (buttonText) {
        buttonText.setText(tSync('Link Google Account'));
      }
    }
  }

  /**
   * Get the container for positioning
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Destroy the UI
   */
  public destroy(): void {
    this.container.destroy();
  }
}

// Helper function to create auth UI
export function createAuthUI(scene: Scene, options: AuthUIOptions): AuthUI {
  return new AuthUI(scene, options);
} 