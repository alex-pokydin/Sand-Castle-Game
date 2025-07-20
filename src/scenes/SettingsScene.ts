import { tSync, setLanguage, getCurrentLanguage, getAvailableLanguages } from '@/i18n';
import { BaseScene } from '@/scenes/BaseScene';

export class SettingsScene extends BaseScene {
  private languageButtons: Phaser.GameObjects.Container[] = [];
  private isDragging: boolean = false;
  private dragTarget?: Phaser.GameObjects.Container;
  private lastSoundFeedbackTime: number = 0;
  
  constructor() {
    super('SettingsScene');
    // Settings scene uses calm beach ambient music
    this.setBackgroundMusic('background-music');
  }

  // Implementation of abstract methods from BaseScene
  protected async customPreload(): Promise<void> {
    // No custom preload logic needed
  }

  protected customCreate(): void {
    this.createBackground();
    this.createTitle();
    this.createLanguageSelector();
    this.createAudioSettings();
    this.createBackButton();
    this.setupVolumeSliderDragging();
  }

  protected onLanguageChanged(): void {
    this.updateLanguageButtons();
  }

  private createBackground(): void {
    // Use the common beach background from BaseScene
    this.createBeachBackground();
  }

  private createTitle(): void {
    // Use standardized subtitle creation from BaseScene (slightly smaller than main title)
    this.createStandardSubtitle(
      this.scale.width / 2,
      this.scale.height * 0.10,
      tSync('Settings')
    );
  }

  private createLanguageSelector(): void {
    const languages = getAvailableLanguages();
    const currentLang = getCurrentLanguage();
    
    // Language section title
    const sectionTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.18,
      tSync('Language'),
      {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 2,
        align: 'center'
      }
    );
    sectionTitle.setOrigin(0.5);

    // Create dropdown-style language selector
    const dropdownY = this.scale.height * 0.25;
    this.createLanguageDropdown(
      this.scale.width / 2,
      dropdownY,
      languages,
      currentLang,
      (langCode: string) => this.selectLanguage(langCode)
    );
  }

  private createLanguageDropdown(
    x: number,
    y: number,
    languages: any[],
    currentLang: any,
    onSelect: (langCode: string) => void
  ): void {
    const container = this.add.container(x, y);

    const dropdownWidth = 300;
    const dropdownHeight = 50;
    const isExpanded = false;
    
    // Dropdown background
    const background = this.add.graphics();
    background.fillStyle(0x3498DB);
    background.fillRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);
    background.lineStyle(3, 0xFFFFFF);
    background.strokeRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);

    // Current language text
    const currentText = this.add.text(0, 0, currentLang.name, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 1,
        fill: true
      }
    });
    currentText.setOrigin(0.5);

    // Dropdown arrow
    const arrow = this.add.graphics();
    arrow.fillStyle(0xFFFFFF);
    arrow.fillTriangle(
      dropdownWidth/2 - 20, -10,
      dropdownWidth/2 - 10, 0,
      dropdownWidth/2 - 30, 0
    );

    container.add([background, currentText, arrow]);
    container.setSize(dropdownWidth + 20, dropdownHeight + 20);
    container.setInteractive();

    // Store references
    (container as any).background = background;
    (container as any).currentText = currentText;
    (container as any).arrow = arrow;
    (container as any).languages = languages;
    (container as any).currentLang = currentLang;
    (container as any).onSelect = onSelect;
    (container as any).isExpanded = isExpanded;
    (container as any).dropdownWidth = dropdownWidth;
    (container as any).dropdownHeight = dropdownHeight;

    // Button interactions
    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(0x5DADE2);
      background.fillRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);
      background.lineStyle(3, 0xFFFFFF);
      background.strokeRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);
      
      container.setScale(1.02);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(0x3498DB);
      background.fillRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);
      background.lineStyle(3, 0xFFFFFF);
      background.strokeRoundedRect(-dropdownWidth/2, -dropdownHeight/2, dropdownWidth, dropdownHeight, 10);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.98);
      
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.showLanguageOptions(container);
        }
      });
    });

    this.languageButtons.push(container);
  }

  private showLanguageOptions(container: Phaser.GameObjects.Container): void {
    const languages = (container as any).languages;
    const currentLang = (container as any).currentLang;
    const onSelect = (container as any).onSelect;
    const x = container.x;
    const y = container.y;
    const dropdownHeight = (container as any).dropdownHeight;

    // Create options container
    const optionsContainer = this.add.container(x, y + dropdownHeight + 10);
    
    languages.forEach((lang: any, index: number) => {
      const isSelected = lang.code === currentLang.code;
      const optionButton = this.createLanguageOption(
        0,
        index * 45,
        lang,
        isSelected,
        () => {
          onSelect(lang.code);
          this.updateLanguageDropdown(container, lang);
          optionsContainer.destroy();
        }
      );
      optionsContainer.add(optionButton);
    });

    // Add click outside to close
    const clickOutside = this.add.graphics();
    clickOutside.fillStyle(0x000000, 0.3);
    clickOutside.fillRect(0, 0, this.scale.width, this.scale.height);
    clickOutside.setInteractive();
    clickOutside.on('pointerdown', () => {
      optionsContainer.destroy();
      clickOutside.destroy();
    });
  }

  private createLanguageOption(
    x: number,
    y: number,
    language: any,
    isSelected: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const optionWidth = 300;
    const optionHeight = 40;
    
    // Option background
    const background = this.add.graphics();
    const primaryColor = isSelected ? 0x27AE60 : 0x3498DB;
    const hoverColor = isSelected ? 0x2ECC71 : 0x5DADE2;
    
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);
    background.lineStyle(2, 0xFFFFFF);
    background.strokeRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);

    // Language name text
    const optionText = this.add.text(0, 0, language.name, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 1,
        fill: true
      }
    });
    optionText.setOrigin(0.5);

    // Selection indicator
    let selectionIndicator: Phaser.GameObjects.Graphics | undefined;
    if (isSelected) {
      selectionIndicator = this.add.graphics();
      selectionIndicator.fillStyle(0xFFFFFF);
      selectionIndicator.fillCircle(optionWidth/2 - 15, 0, 5);
    }

    const elements = [background, optionText];
    if (selectionIndicator) {
      elements.push(selectionIndicator);
    }
    
    container.add(elements);
    container.setSize(optionWidth + 20, optionHeight + 20);
    container.setInteractive();

    // Store references for updates
    (container as any).background = background;
    (container as any).text = optionText;
    (container as any).selectionIndicator = selectionIndicator;
    (container as any).language = language;
    (container as any).onClick = onClick;
    (container as any).optionWidth = optionWidth;
    (container as any).optionHeight = optionHeight;

    // Button interactions
    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(hoverColor);
      background.fillRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);
      background.lineStyle(2, 0xFFFFFF);
      background.strokeRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);
      
      container.setScale(1.02);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);
      background.lineStyle(2, 0xFFFFFF);
      background.strokeRoundedRect(-optionWidth/2, -optionHeight/2, optionWidth, optionHeight, 8);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.98);
      
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        yoyo: true,
        onComplete: onClick
      });
    });

    return container;
  }

  private updateLanguageDropdown(container: Phaser.GameObjects.Container, newLang: any): void {
    const currentText = (container as any).currentText;
    currentText.setText(newLang.name);
    (container as any).currentLang = newLang;
  }

  private createAudioSettings(): void {
    // Audio section title
    const audioTitle = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.35,
      tSync('Audio Settings'),
      {
        fontSize: '22px',
        fontFamily: 'Arial, sans-serif',
        color: '#2C3E50',
        stroke: '#FFFFFF',
        strokeThickness: 2,
        align: 'center'
      }
    );
    audioTitle.setOrigin(0.5);

    // Music toggle and volume in single line
    this.createMusicToggle();

    // Sound effects toggle and volume in single line
    this.createSoundVolumeSlider();
  }

  private createMusicToggle(): void {
    // Create combined toggle and volume slider in single line
    this.createToggleWithVolume(
      this.scale.width / 2,
      this.scale.height * 0.42,
      tSync('Background Music'),
      this.audioManager.isMusicEnabled(),
      this.audioManager.getMusicVolume(),
      (enabled: boolean) => {
        this.audioManager.setMusicEnabled(enabled);
        // Immediate feedback: start or stop music based on toggle
        if (enabled) {
          this.audioManager.startBackgroundMusic();
        } else {
          this.audioManager.stopBackgroundMusic();
        }
      },
      (volume: number) => {
        this.audioManager.setMusicVolume(volume);
        // Music volume changes are immediately audible if music is playing
      }
    );
  }



    private createSoundVolumeSlider(): void {
    // Create combined toggle and volume slider in single line
    this.createToggleWithVolume(
      this.scale.width / 2,
      this.scale.height * 0.52,
      tSync('Sound Effects'),
      this.audioManager.isEffectsEnabled(),
      this.audioManager.getVolume(),
      (enabled: boolean) => {
        // Set effects enabled state directly
        this.audioManager.setEffectsEnabled(enabled);
      },
      (volume: number) => {
        this.audioManager.setVolume(volume);
        // Play test sound with throttling to avoid spam during dragging
        const now = Date.now();
        if (now - this.lastSoundFeedbackTime > 300) { // Max one sound per 300ms
          this.audioManager.playSound('place-good');
          this.lastSoundFeedbackTime = now;
        }
      }
    );
  }

  /**
   * Setup volume slider dragging functionality
   */
  private setupVolumeSliderDragging(): void {
    // Add global pointer move and up events for smooth dragging
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.dragTarget) {
        this.handleSliderDrag(this.dragTarget, pointer);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.dragTarget = undefined;
    });
  }

  private createToggleWithVolume(
    x: number,
    y: number,
    label: string,
    isEnabled: boolean,
    initialVolume: number,
    onToggle: (enabled: boolean) => void,
    onVolumeChange: (volume: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const totalWidth = 320;
    const height = 50;
    
    // Label
    const labelText = this.add.text(-totalWidth/2, 0, label, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#FFFFFF',
        blur: 1,
        fill: true
      }
    });
    labelText.setOrigin(0, 0.5);

    // Calculate component sizes for proper centering
    const toggleWidth = 55; // toggle button width + padding
    const sliderWidth = 180; // slider width + text + padding
    const spacing = 0; // space between toggle and slider
    
    // Calculate total width of controls
    const controlsWidth = toggleWidth + spacing + sliderWidth;
    
    // Center the controls within the container
    const startX = -controlsWidth / 2;
    
    // Toggle button - positioned at start of controls
    const toggleX = startX + toggleWidth / 2;
    const toggleButton = this.createSmallToggleButton(
      toggleX,
      0,
      isEnabled,
      onToggle
    );

    // Volume slider - positioned after toggle with spacing
    const sliderX = startX + toggleWidth + spacing + sliderWidth / 2;
    const volumeSlider = this.createCompactVolumeSlider(
      sliderX,
      0,
      initialVolume,
      onVolumeChange
    );

    container.add([labelText, toggleButton, volumeSlider]);
    container.setSize(totalWidth, height + 20);
    container.setInteractive();

    return container;
  }

  private createSmallToggleButton(
    x: number,
    y: number,
    isEnabled: boolean,
    onToggle: (enabled: boolean) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const buttonWidth = 50;
    const buttonHeight = 25;
    
    // Button background
    const background = this.add.graphics();
    const primaryColor = isEnabled ? 0x27AE60 : 0xE74C3C;
    const hoverColor = isEnabled ? 0x2ECC71 : 0xEC7063;
    
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
    background.lineStyle(2, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);

    // Toggle indicator
    const toggleIndicator = this.add.graphics();
    const indicatorX = isEnabled ? buttonWidth/2 - 6 : -buttonWidth/2 + 6;
    const indicatorY = 0;
    const indicatorRadius = 5;
    
    toggleIndicator.fillStyle(0xFFFFFF);
    toggleIndicator.fillCircle(indicatorX, indicatorY, indicatorRadius);

    container.add([background, toggleIndicator]);
    container.setSize(buttonWidth + 5, buttonHeight + 5);
    container.setInteractive();

    // Store references for updates
    (container as any).background = background;
    (container as any).toggleIndicator = toggleIndicator;
    (container as any).isEnabled = isEnabled;
    (container as any).onToggle = onToggle;
    (container as any).buttonWidth = buttonWidth;
    (container as any).buttonHeight = buttonHeight;

    // Button interactions
    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(hoverColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
      background.lineStyle(2, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
      
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
      background.lineStyle(2, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 8);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.95);
      
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          const newState = !(container as any).isEnabled;
          (container as any).isEnabled = newState;
          (container as any).onToggle(newState);
          this.updateSmallToggleButton(container, newState);
        }
      });
    });

    return container;
  }

  private updateSmallToggleButton(container: Phaser.GameObjects.Container, isEnabled: boolean): void {
    const background = (container as any).background;
    const toggleIndicator = (container as any).toggleIndicator;
    const buttonWidth = (container as any).buttonWidth;
    const buttonHeight = (container as any).buttonHeight;
    
    // Update background color
    const primaryColor = isEnabled ? 0x27AE60 : 0xE74C3C;
    background.clear();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 6);
    background.lineStyle(2, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 6);

    // Update toggle indicator position
    const indicatorX = isEnabled ? buttonWidth/2 - 6 : -buttonWidth/2 + 6;
    toggleIndicator.clear();
    toggleIndicator.fillStyle(0xFFFFFF);
    toggleIndicator.fillCircle(indicatorX, 0, 5);
  }

  private createCompactVolumeSlider(
    x: number,
    y: number,
    initialVolume: number,
    onChange: (volume: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const sliderWidth = 150;
    const trackHeight = 6;
    const knobRadius = 7;
    
    // Track background
    const trackBg = this.add.graphics();
    trackBg.fillStyle(0xBDC3C7);
    trackBg.fillRoundedRect(-sliderWidth/2, -trackHeight/2, sliderWidth, trackHeight, 3);

    // Track fill
    const trackFill = this.add.graphics();
    trackFill.fillStyle(0x3498DB);
    const fillWidth = (sliderWidth * initialVolume);
    trackFill.fillRoundedRect(-sliderWidth/2, -trackHeight/2, fillWidth, trackHeight, 3);

    // Knob
    const knob = this.add.graphics();
    const knobX = -sliderWidth/2 + (sliderWidth * initialVolume);
    knob.fillStyle(0xFFFFFF);
    knob.fillCircle(knobX, 0, knobRadius);
    knob.lineStyle(2, 0x3498DB);
    knob.strokeCircle(knobX, 0, knobRadius);

    // Volume text
    const volumeText = this.add.text(sliderWidth/2 + 10, 0, `${Math.round(initialVolume * 100)}%`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#2C3E50',
      fontStyle: 'bold'
    });
    volumeText.setOrigin(0, 0.5);

    container.add([trackBg, trackFill, knob, volumeText]);
    container.setSize(sliderWidth + 30, trackHeight + 20);
    container.setInteractive();

    // Store references for updates
    (container as any).trackFill = trackFill;
    (container as any).knob = knob;
    (container as any).volumeText = volumeText;
    (container as any).sliderWidth = sliderWidth;
    (container as any).knobRadius = knobRadius;
    (container as any).onChange = onChange;

    // Slider interactions - support both click and drag
    container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Start dragging
      this.isDragging = true;
      this.dragTarget = container;
      
      // Also handle immediate click
      this.handleSliderDrag(container, pointer);
    });

    return container;
  }

  /**
   * Handle slider dragging
   */
  private handleSliderDrag(container: Phaser.GameObjects.Container, pointer: Phaser.Input.Pointer): void {
    const sliderWidth = (container as any).sliderWidth;
    const onChange = (container as any).onChange;
    
    // Convert pointer position to local coordinates relative to the slider container
    const worldTransform = container.getWorldTransformMatrix();
    const localPointer = worldTransform.applyInverse(pointer.x, pointer.y);
    
    // Calculate position relative to slider center
    const localX = localPointer.x;
    
    // Clamp to slider bounds and calculate volume (0-1)
    const normalizedX = Math.max(-sliderWidth/2, Math.min(sliderWidth/2, localX));
    const volume = Math.max(0, Math.min(1, (normalizedX + sliderWidth/2) / sliderWidth));
    
    this.updateCompactVolumeSlider(container, volume);
    onChange(volume);
  }

  private updateCompactVolumeSlider(container: Phaser.GameObjects.Container, volume: number): void {
    const trackFill = (container as any).trackFill;
    const knob = (container as any).knob;
    const volumeText = (container as any).volumeText;
    const sliderWidth = (container as any).sliderWidth;
    const knobRadius = (container as any).knobRadius;
    
    // Clamp volume to ensure it's between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Update track fill
    trackFill.clear();
    trackFill.fillStyle(0x3498DB);
    const fillWidth = (sliderWidth * clampedVolume);
    trackFill.fillRoundedRect(-sliderWidth/2, -3, fillWidth, 6, 3);

    // Update knob position
    const knobX = -sliderWidth/2 + (sliderWidth * clampedVolume);
    knob.clear();
    knob.fillStyle(0xFFFFFF);
    knob.fillCircle(knobX, 0, knobRadius);
    knob.lineStyle(2, 0x3498DB);
    knob.strokeCircle(knobX, 0, knobRadius);

    // Update volume text
    volumeText.setText(`${Math.round(clampedVolume * 100)}%`);
  }





  private createBackButton(): void {
    this.createKidFriendlyButton(
      this.scale.width / 2,
      this.scale.height * 0.75,
      tSync('Back to Menu'),
      0xE74C3C, // Red
      0xEC7063,
      () => this.goBack()
    );
  }

  private createKidFriendlyButton(
    x: number,
    y: number,
    text: string,
    primaryColor: number,
    hoverColor: number,
    onClick: () => void,
    scale: number = 1
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const buttonWidth = 280 * scale;
    const buttonHeight = 80 * scale;
    
    const background = this.add.graphics();
    background.fillStyle(primaryColor);
    background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
    background.lineStyle(4, 0xFFFFFF);
    background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: `${28 * scale}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#FFFFFF',
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 2,
        fill: true
      }
    });
    buttonText.setOrigin(0.5);

    container.add([background, buttonText]);
    container.setSize(buttonWidth + 20, buttonHeight + 20);
    container.setInteractive();

    container.on('pointerover', () => {
      background.clear();
      background.fillStyle(hoverColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1.05);
    });

    container.on('pointerout', () => {
      background.clear();
      background.fillStyle(primaryColor);
      background.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      background.lineStyle(4, 0xFFFFFF);
      background.strokeRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 20);
      
      container.setScale(1);
    });

    container.on('pointerdown', () => {
      container.setScale(0.95);
      
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100,
        yoyo: true,
        onComplete: onClick
      });
    });

    return container;
  }



  private async selectLanguage(languageCode: string): Promise<void> {
    // Selecting language
    await setLanguage(languageCode);
    this.updateLanguageButtons();
  }

  private updateLanguageButtons(): void {
    const currentLang = getCurrentLanguage();
    
    this.languageButtons.forEach(button => {
      // Update dropdown text if it's a dropdown
      if ((button as any).currentText) {
        const currentText = (button as any).currentText;
        currentText.setText(currentLang.name);
        (button as any).currentLang = currentLang;
      }
    });
  }

  private goBack(): void {
    // Use standardized navigation helper from BaseScene
    this.goToMenu();
  }


} 