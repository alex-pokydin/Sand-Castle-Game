import { BaseScene } from './BaseScene';
import { tSync } from '@/i18n';
import { createKidFriendlyButton, BUTTON_CONFIGS } from '@/utils/ButtonUtils';
import { createResponsiveTitle, createCenteredResponsiveText, TEXT_CONFIGS, calculateDynamicSpacing } from '@/utils/TextUtils';
import { firebaseService } from '@/utils/FirebaseService';
import { LeaderboardEntry, LeaderboardType, LeaderboardResponse } from '@/types/Firebase';

export class LeaderboardScene extends BaseScene {
  private currentLeaderboardType: LeaderboardType = 'global_high_score';
  private leaderboardData: LeaderboardResponse | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private errorText: Phaser.GameObjects.Text | null = null;
  private leaderboardContainer: Phaser.GameObjects.Container | null = null;
  private typeButtons: Phaser.GameObjects.Container[] = [];
  private retryButton: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('LeaderboardScene');
    this.setBackgroundMusic('menu-theme');
  }

  protected async customPreload(): Promise<void> {
    // No specific assets needed for leaderboard
  }

  protected customCreate(): void {
    this.createBeachBackground();
    this.createUI();
    this.loadLeaderboard();
  }

  private createUI(): void {
    const centerX = this.scale.width / 2;
    const spacing = calculateDynamicSpacing(this, 35);

    // Title
    const title = createResponsiveTitle(
      this,
      centerX,
      this.scale.height * 0.08,
      tSync('Leaderboards'),
      TEXT_CONFIGS.TITLE_LARGE,
      undefined
    );

    // Leaderboard type buttons
    this.createTypeButtons(title.y + title.height / 2 + spacing);

    // Back button
    createKidFriendlyButton(
      this,
      this.scale.width * 0.15,
      this.scale.height * 0.05,
      tSync('Back'),
      BUTTON_CONFIGS.SMALL,
      () => this.goToMenu()
    );

    // Refresh button
    createKidFriendlyButton(
      this,
      this.scale.width * 0.85,
      this.scale.height * 0.05,
      tSync('Refresh'),
      BUTTON_CONFIGS.SMALL,
      () => this.loadLeaderboard()
    );

    // Loading text
    this.loadingText = createCenteredResponsiveText(
      this,
      centerX,
      this.scale.height * 0.5,
      tSync('Loading leaderboard...'),
      TEXT_CONFIGS.STATS_MEDIUM
    );

    // Error text (initially hidden)
    this.errorText = createCenteredResponsiveText(
      this,
      centerX,
      this.scale.height * 0.4,
      '',
      TEXT_CONFIGS.STATS_MEDIUM
    );
    this.errorText.setVisible(false);
  }

  private createTypeButtons(startY: number): void {
    const centerX = this.scale.width / 2;
    const buttonSpacing = calculateDynamicSpacing(this, 25);
    
    const leaderboardTypes: { type: LeaderboardType; label: string }[] = [
      { type: 'global_high_score', label: tSync('Global') },
      { type: 'weekly_high_score', label: tSync('Weekly') },
      { type: 'monthly_high_score', label: tSync('Monthly') },
      { type: 'friends_only', label: tSync('Friends') }
    ];

    const totalWidth = leaderboardTypes.length * 120 + (leaderboardTypes.length - 1) * buttonSpacing;
    const startX = centerX - totalWidth / 2;

    leaderboardTypes.forEach((item, index) => {
      const x = startX + index * (120 + buttonSpacing) + 60; // 60 is half button width
      
      const button = createKidFriendlyButton(
        this,
        x,
        startY,
        item.label,
        this.currentLeaderboardType === item.type ? BUTTON_CONFIGS.PRIMARY : BUTTON_CONFIGS.SECONDARY,
        () => this.switchLeaderboardType(item.type)
      );

      this.typeButtons.push(button);
    });
  }

  private async loadLeaderboard(): Promise<void> {
    this.showLoading();
    
    try {
      // Check if user is authenticated
      if (!firebaseService.isAuthenticated()) {
        // Attempt to sign in anonymously
        await firebaseService.signInAnonymously();
      }

      this.leaderboardData = await firebaseService.getLeaderboard(this.currentLeaderboardType, 20);
      this.displayLeaderboard();
    } catch (error) {
      console.error('[LeaderboardScene] Failed to load leaderboard:', error);
      this.showError(tSync('Failed to load leaderboard. Please check your connection.'));
    }
  }

  private switchLeaderboardType(type: LeaderboardType): void {
    if (this.currentLeaderboardType === type) return;

    this.currentLeaderboardType = type;
    this.updateTypeButtonStates();
    this.loadLeaderboard();

    // Play sound effect
    this.audioManager.playSound('button');
  }

  private updateTypeButtonStates(): void {
    // This would update the visual state of type buttons
    // For now, just recreate them
    this.typeButtons.forEach(button => button.destroy());
    this.typeButtons = [];
    
    // Find the title by searching for text objects with the title content
    const titleText = this.children.list.find(child => 
      child instanceof Phaser.GameObjects.Text && 
      child.text.includes('Leaderboards')
    ) as Phaser.GameObjects.Text;
    
    if (titleText) {
      const spacing = calculateDynamicSpacing(this, 35);
      this.createTypeButtons(titleText.y + titleText.height / 2 + spacing);
    }
  }

  private showLoading(): void {
    this.hideError();
    this.hideLeaderboard();
    
    if (this.loadingText) {
      this.loadingText.setVisible(true);
      this.loadingText.setText(tSync('Loading leaderboard...'));
    }
  }

  private showError(message: string): void {
    this.hideLoading();
    this.hideLeaderboard();
    
    if (this.errorText) {
      this.errorText.setVisible(true);
      this.errorText.setText(message);
    }

    // Show retry button
    if (!this.retryButton) {
      this.retryButton = createKidFriendlyButton(
        this,
        this.scale.width / 2,
        this.scale.height * 0.6,
        tSync('Retry'),
        BUTTON_CONFIGS.PRIMARY,
        () => this.loadLeaderboard()
      );
    } else {
      this.retryButton.setVisible(true);
    }
  }

  private hideLoading(): void {
    if (this.loadingText) {
      this.loadingText.setVisible(false);
    }
  }

  private hideError(): void {
    if (this.errorText) {
      this.errorText.setVisible(false);
    }
    if (this.retryButton) {
      this.retryButton.setVisible(false);
    }
  }

  private hideLeaderboard(): void {
    if (this.leaderboardContainer) {
      this.leaderboardContainer.setVisible(false);
    }
  }

  private displayLeaderboard(): void {
    this.hideLoading();
    this.hideError();

    if (!this.leaderboardData || this.leaderboardData.entries.length === 0) {
      this.showError(tSync('No leaderboard data available.'));
      return;
    }

    // Clear existing leaderboard
    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy();
    }

    this.leaderboardContainer = this.add.container(0, 0);

    const centerX = this.scale.width / 2;
    const startY = this.scale.height * 0.25;
    const entryHeight = calculateDynamicSpacing(this, 40);
    const maxEntries = Math.min(10, this.leaderboardData.entries.length);

    // Header
    const headerY = startY - entryHeight;
    this.createLeaderboardHeader(headerY);

    // Entries
    for (let i = 0; i < maxEntries; i++) {
      const entry = this.leaderboardData.entries[i];
      const entryY = startY + i * entryHeight;
      const isCurrentUser = entry.userId === firebaseService.getCurrentUserId();
      
      this.createLeaderboardEntry(entry, entryY, isCurrentUser);
    }

    // User's rank (if not in top 10)
    if (this.leaderboardData.userRank && this.leaderboardData.userRank > maxEntries && this.leaderboardData.userEntry) {
      const userEntryY = startY + (maxEntries + 1) * entryHeight;
      
      // Separator
      const separatorY = userEntryY - entryHeight / 2;
      const separator = this.add.graphics();
      separator.lineStyle(2, 0x666666, 0.5);
      separator.lineBetween(centerX - 150, separatorY, centerX + 150, separatorY);
      this.leaderboardContainer.add(separator);

      // User entry
      this.createLeaderboardEntry(this.leaderboardData.userEntry, userEntryY, true);
    }

    // Stats summary
    this.createStatsSummary(startY + (maxEntries + 2) * entryHeight);
  }

  private createLeaderboardHeader(y: number): void {
    const centerX = this.scale.width / 2;
    
    // Rank
    const rankHeader = createCenteredResponsiveText(
      this,
      centerX - 120,
      y,
      tSync('Rank'),
      TEXT_CONFIGS.STATS_SMALL
    );
    rankHeader.setStyle({ fontStyle: 'bold' });
    this.leaderboardContainer?.add(rankHeader);

    // Name
    const nameHeader = createCenteredResponsiveText(
      this,
      centerX - 20,
      y,
      tSync('Player'),
      TEXT_CONFIGS.STATS_SMALL
    );
    nameHeader.setStyle({ fontStyle: 'bold' });
    this.leaderboardContainer?.add(nameHeader);

    // Score
    const scoreHeader = createCenteredResponsiveText(
      this,
      centerX + 80,
      y,
      tSync('Score'),
      TEXT_CONFIGS.STATS_SMALL
    );
    scoreHeader.setStyle({ fontStyle: 'bold' });
    this.leaderboardContainer?.add(scoreHeader);

    // Level
    const levelHeader = createCenteredResponsiveText(
      this,
      centerX + 150,
      y,
      tSync('Level'),
      TEXT_CONFIGS.STATS_SMALL
    );
    levelHeader.setStyle({ fontStyle: 'bold' });
    this.leaderboardContainer?.add(levelHeader);
  }

  private createLeaderboardEntry(entry: LeaderboardEntry, y: number, isCurrentUser: boolean): void {
    const centerX = this.scale.width / 2;
    const textColor = isCurrentUser ? '#FFD700' : '#FFFFFF'; // Gold for current user
    const backgroundColor = isCurrentUser ? 0x333333 : 0x000000;
    const alpha = isCurrentUser ? 0.3 : 0.1;

    // Background for current user
    if (isCurrentUser) {
      const bg = this.add.graphics();
      bg.fillStyle(backgroundColor, alpha);
      bg.fillRoundedRect(centerX - 160, y - 15, 320, 30, 5);
      this.leaderboardContainer?.add(bg);
    }

    // Rank
    const rankText = createCenteredResponsiveText(
      this,
      centerX - 120,
      y,
      `#${entry.rank}`,
      TEXT_CONFIGS.STATS_SMALL
    );
    rankText.setColor(textColor);
    this.leaderboardContainer?.add(rankText);

    // Name (truncate if too long)
    let displayName = entry.displayName;
    if (displayName.length > 12) {
      displayName = displayName.substring(0, 9) + '...';
    }
    
    const nameText = createCenteredResponsiveText(
      this,
      centerX - 20,
      y,
      displayName,
      TEXT_CONFIGS.STATS_SMALL
    );
    nameText.setColor(textColor);
    this.leaderboardContainer?.add(nameText);

    // Score
    const scoreText = createCenteredResponsiveText(
      this,
      centerX + 80,
      y,
      entry.score.toLocaleString(),
      TEXT_CONFIGS.STATS_SMALL
    );
    scoreText.setColor(textColor);
    this.leaderboardContainer?.add(scoreText);

    // Level
    const levelText = createCenteredResponsiveText(
      this,
      centerX + 150,
      y,
      entry.level.toString(),
      TEXT_CONFIGS.STATS_SMALL
    );
    levelText.setColor(textColor);
    this.leaderboardContainer?.add(levelText);

    // Crown icon for top 3
    if (entry.rank <= 3) {
      const crownColor = entry.rank === 1 ? 0xFFD700 : entry.rank === 2 ? 0xC0C0C0 : 0xCD7F32;
      const crown = this.add.graphics();
      crown.fillStyle(crownColor);
      crown.fillTriangle(centerX - 140, y - 5, centerX - 135, y - 10, centerX - 130, y - 5);
      crown.fillRect(centerX - 142, y - 5, 12, 3);
      this.leaderboardContainer?.add(crown);
    }
  }

  private createStatsSummary(y: number): void {
    if (!this.leaderboardData) return;

    const centerX = this.scale.width / 2;
    
    let summaryText = '';
    if (this.leaderboardData.userRank) {
      summaryText = tSync('Your rank: {{rank}} of {{total}}', {
        rank: this.leaderboardData.userRank,
        total: this.leaderboardData.totalEntries
      });
    } else {
      summaryText = tSync('Total players: {{total}}', {
        total: this.leaderboardData.totalEntries
      });
    }

    const summary = createCenteredResponsiveText(
      this,
      centerX,
      y,
      summaryText,
      TEXT_CONFIGS.STATS_SMALL
    );
    summary.setColor('#CCCCCC');
    this.leaderboardContainer?.add(summary);
  }

  protected onLanguageChanged(): void {
    // Recreate UI with new language
    this.children.removeAll(true);
    this.typeButtons = [];
    this.leaderboardContainer = null;
    this.loadingText = null;
    this.errorText = null;
    this.retryButton = null;
    
    this.createUI();
    
    // Redisplay leaderboard if we have data
    if (this.leaderboardData) {
      this.displayLeaderboard();
    } else {
      this.loadLeaderboard();
    }
  }

  protected customShutdown(): void {
    // Cleanup
    this.typeButtons = [];
    this.leaderboardContainer = null;
    this.loadingText = null;
    this.errorText = null;
    this.retryButton = null;
    this.leaderboardData = null;
  }
} 