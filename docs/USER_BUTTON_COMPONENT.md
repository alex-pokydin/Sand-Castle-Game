# UserButton Component

A reusable component for displaying user profile information (name and picture) when the user is authenticated. The component automatically handles authentication state changes and provides multiple styling options.

**Location**: `src/components/UserButton.ts`  
**Import**: `import { createUserButton, UserButton } from '@/components/UserButton';`

## Features

- ✅ **Automatic Authentication Monitoring** - Listens for Firebase auth state changes
- ✅ **Google Profile Picture Loading** - Displays user's Google profile picture when available
- ✅ **Default Avatar Generation** - Creates initials-based avatar when no profile picture exists
- ✅ **Multiple Styling Options** - Full, compact, and minimal styles
- ✅ **Interactive Design** - Hover effects and click animations
- ✅ **Responsive Layout** - Adapts to different screen sizes
- ✅ **Self-Contained** - Handles its own cleanup and resource management

## Quick Start

```typescript
import { createUserButton } from '@/components/UserButton';

// In your scene's create method
protected customCreate(): void {
  // Create a user button at the bottom of the screen
  const userButton = createUserButton(this, {
    x: this.scale.width / 2,
    y: this.scale.height * 0.95,
    style: 'full'
  });
}
```

## Styling Options

### 1. Full Style (Default)
Shows both profile picture and name in a rectangular container.

```typescript
const fullUserButton = createUserButton(this, {
  x: this.scale.width / 2,
  y: this.scale.height * 0.95,
  width: 250,
  height: 50,
  style: 'full',
  showName: true,
  showPicture: true
});
```

**Appearance:**
- Rectangular background with rounded corners
- Profile picture on the left
- User name on the right
- Blue background with white border

### 2. Compact Style
Small circular button, perfect for corners or limited space.

```typescript
const compactUserButton = createUserButton(this, {
  x: this.scale.width - 30,
  y: 30,
  width: 60,
  height: 60,
  style: 'compact',
  showName: false,  // Only shows picture
  showPicture: true
});
```

**Appearance:**
- Circular background
- Profile picture only (no text)
- Smaller size for corner placement

### 3. Minimal Style
Clean, minimal design without background.

```typescript
const minimalUserButton = createUserButton(this, {
  x: 20,
  y: 20,
  style: 'minimal',
  showName: true,
  showPicture: true
});
```

**Appearance:**
- No background
- Profile picture and name only
- Clean, minimal look

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `x` | `number` | **Required** | X position of the button |
| `y` | `number` | **Required** | Y position of the button |
| `width` | `number` | `200` | Width of the button |
| `height` | `number` | `50` | Height of the button |
| `showName` | `boolean` | `true` | Whether to show user's name |
| `showPicture` | `boolean` | `true` | Whether to show user's picture |
| `style` | `'full' \| 'compact' \| 'minimal'` | `'full'` | Styling option |
| `onClick` | `() => void` | `undefined` | Optional click handler |
| `onAuthStateChanged` | `(isAuthenticated: boolean, isAnonymous: boolean) => void` | `undefined` | Auth state change callback |

## Usage Examples

### Basic Integration in MenuScene

```typescript
// In MenuScene.ts
import { createUserButton, UserButton } from '@/components/UserButton';

export class MenuScene extends BaseScene {
  private userButton?: UserButton;

  protected customCreate(): void {
    // ... other UI creation
    
    // Create user profile display at the bottom
    this.userButton = createUserButton(this, {
      x: this.scale.width / 2,
      y: this.scale.height * 0.95,
      width: 250,
      height: 50,
      style: 'full',
      showName: true,
      showPicture: true,
      onClick: () => {
        // Navigate to settings or show user menu
        this.goToSettings();
      },
      onAuthStateChanged: (isAuthenticated: boolean, isAnonymous: boolean) => {
        console.log('Auth state changed:', { isAuthenticated, isAnonymous });
      }
    });
  }

  protected customShutdown(): void {
    // Clean up user button
    if (this.userButton) {
      this.userButton.destroy();
      this.userButton = undefined;
    }
    
    // ... other cleanup
  }
}
```

### Top-Right Corner Compact Button

```typescript
// In GameScene.ts
export class GameScene extends BaseScene {
  private userButton?: UserButton;

  protected customCreate(): void {
    // ... game setup
    
    // Add compact user button in top-right corner
    this.userButton = createUserButton(this, {
      x: this.scale.width - 30,
      y: 30,
      width: 60,
      height: 60,
      style: 'compact',
      showName: false,
      showPicture: true,
      onClick: () => {
        // Pause game and show user menu
        this.scene.pause();
        this.scene.launch('UserMenuScene');
      }
    });
  }
}
```

### Minimal Style for Settings Scene

```typescript
// In SettingsScene.ts
export class SettingsScene extends BaseScene {
  private userButton?: UserButton;

  protected customCreate(): void {
    // ... settings UI
    
    // Add minimal user button in top-left
    this.userButton = createUserButton(this, {
      x: 20,
      y: 20,
      style: 'minimal',
      showName: true,
      showPicture: true,
      onClick: () => {
        // Show user profile details
        this.showUserProfileDetails();
      }
    });
  }
}
```

## Public Methods

The UserButton component provides several public methods for external control:

```typescript
// Get the container for positioning
const container = userButton.getContainer();

// Set position
userButton.setPosition(100, 200);

// Set scale
userButton.setScale(1.2);

// Show/hide the button
userButton.show();
userButton.hide();

// Check authentication status
const isAuth = userButton.isUserAuthenticated();
const isAnonymous = userButton.isUserAnonymous();

// Manually refresh auth state
await userButton.refreshAuthState();

// Clean up resources
userButton.destroy();
```

## Debug Functions

The component includes debug functions available in the browser console:

```javascript
// Test the user button
testUserButton();

// Show/hide the user button
showUserButton();
hideUserButton();
```

## Integration Guidelines

### 1. Scene Integration
- Always create the UserButton in the scene's `customCreate()` method
- Clean up the UserButton in the scene's `customShutdown()` method
- The component handles its own authentication state monitoring

### 2. Positioning
- Use screen-relative positioning for responsive design
- Consider different screen sizes when positioning
- Use appropriate spacing from screen edges

### 3. Styling Selection
- **Full Style**: Use for main menu or prominent locations
- **Compact Style**: Use for game scenes or limited space
- **Minimal Style**: Use for settings or secondary scenes

### 4. Click Handlers
- Keep click handlers simple and focused
- Consider navigation to relevant scenes (settings, profile, etc.)
- Avoid blocking operations in click handlers

### 5. Authentication Callbacks
- Use `onAuthStateChanged` for scene-specific logic
- Handle both authenticated and unauthenticated states
- Consider showing different UI based on auth state

## Best Practices

1. **Consistent Positioning**: Use similar positioning across scenes for consistency
2. **Appropriate Sizing**: Choose button size based on scene importance
3. **Meaningful Actions**: Make click handlers do something useful
4. **Proper Cleanup**: Always destroy the component when scene shuts down
5. **Error Handling**: The component handles errors gracefully, but monitor console for issues

## Troubleshooting

### Button Not Showing
- Check if user is authenticated
- Verify positioning is within screen bounds
- Ensure the scene is active

### Profile Picture Not Loading
- Check if user has a Google profile picture
- Verify network connectivity
- Check browser console for errors

### Performance Issues
- The component is optimized for performance
- Profile pictures are cached automatically
- Cleanup is handled automatically

## Future Enhancements

Potential improvements for the UserButton component:

- [ ] Custom color themes
- [ ] Animation customization
- [ ] Profile picture upload functionality
- [ ] User status indicators
- [ ] Notification badges
- [ ] Accessibility improvements 