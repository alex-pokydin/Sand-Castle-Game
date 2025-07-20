# Development State Persistence

This document explains how the game state persistence system works during development, allowing you to maintain your game progress between page refreshes.

## How It Works

The game automatically saves your complete game state every 5 seconds and restores it when you refresh the page during development. This includes:

- **Current Scene**: Automatically restores the exact scene you were in
- **Game Progress**: Current level, score, lives
- **Castle State**: All dropped parts and their positions
- **Statistics**: Various game counters and achievements
- **UI State**: Text displays and game interface state
- **Scene-Specific Data**: Menu state, pause data, etc.

## Automatic Features

### Auto-Save
- **Frequency**: Every 5 seconds during gameplay
- **Storage**: Browser's localStorage
- **Scope**: Complete game state including all dropped parts
- **Expiration**: Automatically cleared after 24 hours

### Auto-Restore
- **Trigger**: Page refresh or browser reload
- **Condition**: Automatically detects and restores the last active scene
- **Process**: 
  - Restores the exact scene you were in (GameScene, MenuScene, etc.)
  - Recreates all dropped parts and restores game state
  - Restores scene-specific data (menu state, pause data, etc.)
- **Fallback**: Starts MenuScene if no saved state exists

## Debug Functions

The following functions are available in the browser console for development:

### `debugGameState.info()`
Shows information about the currently saved state:
```javascript
debugGameState.info()
// Returns: { exists: true, timestamp: 1234567890, age: "5 minutes ago" }
```

### `debugGameState.load()`
Loads and displays details of the saved state:
```javascript
debugGameState.load()
// Shows: Level, score, lives, parts count, timestamp
```

### `debugGameState.save()`
Manually saves the current game state:
```javascript
debugGameState.save()
// Saves current state immediately
```

### `debugGameState.forceSave()`
Force saves the current state (same as save):
```javascript
debugGameState.forceSave()
// Force save current state
```

### `debugGameState.clear()`
Clears the saved game state:
```javascript
debugGameState.clear()
// Removes saved state from localStorage
```

### `debugGameState.disableAutoSave()`
Disables automatic saving:
```javascript
debugGameState.disableAutoSave()
// Stops auto-save (useful for testing)
```

## Usage Examples

### Check if you have a saved game
```javascript
debugGameState.info()
```

### Continue from where you left off
Simply refresh the page - the game will automatically restore the exact scene and state you were in.

### Start fresh (clear saved state)
```javascript
debugGameState.clear()
// Then refresh the page
```

### Manual save during development
```javascript
debugGameState.save()
```

## Technical Details

### What Gets Saved
- **Scene Information**: Current scene name and scene-specific data
- Complete `GameState` object
- All dropped `CastlePart` data with positions
- Ground violation records
- Game statistics and counters
- UI text states
- Game mechanics state (speed, direction)
- Menu state (pause data, game paused status)

### What Gets Restored
- **Exact Scene**: The scene you were in when you refreshed
- All game state variables
- Dropped parts recreated with correct positions
- Physics bodies restored
- UI updated to reflect saved state
- Statistics and counters restored
- Scene-specific data (menu state, pause data, etc.)

### Storage Location
- **Key**: `sand-castle-dev-state`
- **Location**: Browser localStorage
- **Format**: JSON with versioning
- **Size**: Typically 1-10KB depending on game state

### Version Compatibility
- **Current Version**: `1.0.0`
- **Auto-Cleanup**: Old versions are automatically cleared
- **Future-Proof**: Version checking prevents corruption

## Troubleshooting

### State Not Restoring
1. Check if state exists: `debugGameState.info()`
2. Verify state age (cleared after 24 hours)
3. Check browser console for errors
4. Try clearing and starting fresh: `debugGameState.clear()`

### Parts Not Appearing
1. Check if parts were actually saved: `debugGameState.load()`
2. Verify physics setup completed before restoration
3. Check for console errors during part recreation

### Performance Issues
1. Disable auto-save: `debugGameState.disableAutoSave()`
2. Clear old state: `debugGameState.clear()`
3. Check localStorage size in browser dev tools

## Development Workflow

### Typical Development Session
1. Start game and play normally
2. Make code changes
3. Refresh page to test changes
4. Exact scene and game state automatically restores
5. Continue development from where you left off

### Testing Different Scenarios
1. Play to a specific game state
2. Save manually: `debugGameState.save()`
3. Make code changes
4. Refresh to test with that exact state

### Debugging Game Issues
1. Reproduce issue in game
2. Save state: `debugGameState.save()`
3. Make fixes to code
4. Refresh to test fix with same state

This system makes development much more efficient by eliminating the need to replay through the same game scenarios repeatedly! 