# Sand Castle Game - Design Document

> **📝 Living Document**: This design specification is actively being developed and refined. As we implement features and gather insights during development, we'll expand this document to cover additional use cases, edge cases, and technical considerations that emerge during the building process.

## 🏰 Game Overview

**Sand Castle** is a mobile-first web game where players build a castle by precisely dropping sand castle parts. The game combines timing, precision, and physics for an engaging experience suitable for kids.

### 🎯 Target Audience & User Personas
- **Primary**: Kids ages 6-12 (with parent supervision for younger ones)
- **Secondary**: Family casual gamers, parents playing with kids
- **Accessibility**: Touch-first interface, simple mechanics, immediate visual feedback

### 🏆 Definition of Success (MVP)
- **Core Experience**: Player can complete first 5 levels with clear progression
- **Technical**: Runs smoothly on mid-range mobile devices (iPhone 12/Android equivalent, 60fps target)
- **Engagement**: Average session >3 minutes, 60%+ level completion rate
- **Stability**: Physics feel predictable and consistent, <10% player reports of "unfair" failures

### 🚧 Key Constraints & Assumptions
- **Budget**: Zero initial budget (free tools/hosting only)
- **Platform**: Web-first, PWA-ready, no app store requirements
- **Content**: Start with 5 MVP levels, expand based on >60% completion rate and user feedback

### 🎨 Development Philosophy: "Vibe Coding"
- **Iterative Development**: Implement MVP features first, then enhance based on playtesting feedback
- **Sustainable Progress**: Complete each development phase milestone before moving to next
- **Feature Validation**: New features only added after core mechanics feel satisfying to play
- **Quality over Quantity**: Prioritize polishing existing features over adding new ones
- **Developer-Player Feedback Loop**: If developers don't enjoy using a feature, redesign it

## 🔐 Google Authentication Setup

The game now supports Google authentication for cloud saves, leaderboards, and cross-device progress sync.

### Firebase Configuration

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication and Firestore

2. **Enable Google Authentication**:
   - In Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

3. **Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Firestore Rules**:
   Update your Firestore security rules to allow authenticated access:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /sessions/{sessionId} {
         allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       match /leaderboards/{type}/entries/{entryId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

### Authentication Features

- **Google Sign-In**: Users can sign in with their Google account
- **Anonymous Play**: Guest users can play without signing in
- **Account Linking**: Anonymous users can link their Google account later
- **Cloud Saves**: Game progress automatically syncs across devices
- **Leaderboards**: Scores are tracked per user account
- **Cross-Device Sync**: Continue playing on any device

### Usage in Game

- **Settings Menu**: Access authentication options in the Settings scene
- **Automatic Sync**: Cloud saves happen automatically during gameplay
- **Offline Support**: Game works offline, syncs when connection restored

## 🎮 Core Game Mechanics

### 1. Level-Based Part System (NEW!)
- **Part Levels**: Castle parts have levels 1-6, representing building floors/tiers
- **Visual Distinction**: Each level has unique appearance (color/texture) for clear identification
- **Level Indicators**: Visual numbers or symbols on parts to show their level
- **Progressive Complexity**: Higher levels unlock as players build successfully

#### Visual Distinction

Each level has unique colors:
- **Level 1**: Brown (foundation)
- **Level 2**: Chocolate (base walls)
- **Level 3**: Sandy brown (upper walls)
- **Level 4**: Plum (tower sections)
- **Level 5**: Medium purple (decorative)
- **Level 6**: Gold (pinnacles/flags)

### 2. Strategic Placement Rules
- **Level 1 Parts**: Can only be placed directly on the ground (foundation)
- **Level 2 Parts**: Can only be placed on top of Level 1 parts
- **Level 3-6 Parts**: Can only be placed on parts of the previous level (N can only go on N-1)
- **Wrong Placement**: Instant destruction with score penalty if placed incorrectly
- **Visual Feedback**: Green/red preview showing valid/invalid placement zones

### 3. Smart Part Spawning
- **Adaptive Spawning**: Parts appear based on current castle height
  - No castle built → Only Level 1 parts spawn
  - Level 1 exists → Level 1 and 2 parts can spawn
  - Level 2 exists → Level 1, 2, and 3 parts can spawn
  - And so on up to Level 6
- **Random Selection**: Parts chosen randomly from available levels
- **Strategic Challenge**: Players must balance building foundation vs. building up

### 4. Castle Part Movement
- **Top Movement**: Castle parts move horizontally left-right at the top of the screen
- **Speed Variation**: Movement speed increases with level progression
- **Visual Feedback**: Parts cast a simple shadow directly below showing landing position
- **Level Display**: Parts show their level number/color while moving

### 5. Drop Mechanism
- **Input**: Single tap/click to release the part
- **Physics**: Gravity-based falling (9.8 units/second²) with 5% air resistance for visual appeal
- **Placement Validation**: Real-time check for valid placement target
- **Visual**: Smooth animation with particle effects (sand dust) on impact

### 6. Success Detection & Penalties

Using **Matter.js physics engine** for realistic stability detection:

#### Primary: Physics-Based Stability
- **Perfect Stability**: Part settles with minimal movement (100 points)
- **Good Stability**: Slight wobble but settles quickly (75 points) 
- **Poor Stability**: Excessive wobbling, near collapse (25 points)
- **Wrong Placement**: Instant destruction (-50 points penalty)
- **Collapse**: Castle parts fall or tip over (0 points, life lost)

#### Visual Feedback System
- **Green Glow**: Stable parts (velocity < 0.1)
- **Yellow Glow**: Slightly unstable (velocity 0.1-0.5)
- **Red Glow + Wobble**: Unstable parts (velocity > 0.5)
- **Destruction Effect**: Particle explosion for wrong placements

#### Physics Implementation
```typescript
// Updated type definitions for level-based parts
interface CastlePartData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number; // NEW: 1-6 part level
  velocity: { x: number; y: number };
  isStable: boolean;
  placedOnValidTarget: boolean; // NEW: placement validation
}

interface PlacementResult {
  valid: boolean;
  targetLevel: number | null; // What level this part was placed on
  penaltyApplied: boolean;
}

interface StabilityResult {
  stable: boolean;
  unstableParts: CastlePartData[];
  stabilityScore: number;
}

// Enhanced placement validation
function validatePlacement(part: CastlePartData, existingParts: CastlePartData[]): PlacementResult {
  // Level 1 parts can only be placed on ground
  if (part.level === 1) {
    return { valid: true, targetLevel: 0, penaltyApplied: false }; // Ground = level 0
  }
  
  // Find parts underneath this position
  const partsBelow = existingParts.filter(existing => 
    Math.abs(existing.x - part.x) < (existing.width + part.width) / 2 &&
    existing.y < part.y &&
    Math.abs(existing.y - part.y) < existing.height + 10 // 10px tolerance
  );
  
  // Check if any part below has the correct level (part.level - 1)
  const validTarget = partsBelow.find(below => below.level === part.level - 1);
  
  return {
    valid: validTarget !== undefined,
    targetLevel: validTarget?.level || null,
    penaltyApplied: !validTarget
  };
}

// Realistic sand physics properties
const sandPartProperties: Matter.IBodyDefinition = {
  density: 0.8,
  friction: 0.3,
  frictionStatic: 0.8,
  restitution: 0.1 // Low bounce for sand
};
```

### 7. Progressive Level Goals
- **Level 1**: 2 parts total (tutorial - learn basic stacking)
- **Level 2**: 3 parts total (learn level system)
- **Level 3**: 5 parts total (build strategy)
- **Level 4**: 10 parts total (logistics challenge)
- **Level 5**: 15 parts total (advanced planning)
- **Level 6+**: +5 parts each level (endless challenge)

### 8. Strategic Scoring System
- **Placement Bonus**: Correct level placement (+10 bonus points)
- **Height Bonus**: Building higher levels gives multiplier (Level 6 parts = 6x base score)
- **Efficiency Bonus**: Completing level with fewer attempts
- **Penalty System**: Wrong placement (-50 points), destruction cleanup
- **Combo System**: Consecutive correct placements increase score multiplier

### 9. Enhanced Losing Mechanisms
- **Placement Penalties**: Wrong level placement results in part destruction
- **Score Penalties**: -50 points per destroyed part
- **Stability System**: Castle collapses if too unstable (primary loss condition)
- **Resource Management**: Must plan which levels to build when
- **Limited Attempts**: 3 total failures per level (wrong placement counts as failure)

## 🎨 Visual Design (Kids-Oriented)

### Art Style
- **Color Palette**: Primary sand colors (#F4D03F, #E67E22, #D2691E), accent blue (#3498DB), white (#FFFFFF)
- **Border Radius**: 8px minimum for all interactive elements, 4px for decorative elements
- **Cartoon Style**: Flat design with subtle gradients, no photorealistic textures
- **UI Element Sizes**: Minimum 44px touch targets (iOS guidelines), 16px+ font sizes

### Background Options
1. **Real Beach Photo**: Blurred/stylized real beach imagery
2. **Vector Beach Scene**: Simplified cartoon beach with waves, clouds, sun
3. **Canvas Animation**: Animated waves, moving clouds, seagulls

### UI Elements
- **Score Display**: Large, colorful numbers
- **Progress Bar**: Visual castle completion indicator
- **Lives/Attempts**: Heart icons or sand bucket indicators
- **Level Indicator**: Beach flag or sandcastle size comparison

## 🔊 Audio Design

### Sound Effects
- **Part Drop**: 0.2s whoosh sound, decreasing pitch (800Hz to 400Hz)
- **Successful Placement**: 0.1s click sound, 1000Hz tone
- **Perfect Placement**: 0.5s ascending chime (C-E-G major chord)
- **Miss/Failure**: 0.3s soft thud, 200Hz low tone (volume <50% of other sounds)
- **Level Complete**: 2s celebratory melody in C major
- **Game Over**: 1s gentle upward melody encouraging retry

### Background Music
- **Beach Theme**: 120 BPM instrumental track with ocean wave samples, major key (C or G major)
- **Volume Control**: Persistent mute button in top-right corner, 0-100% volume slider in settings
- **Adaptive**: Increase tempo by 10 BPM and add percussion layers for levels 3-5

## 📱 Technical Requirements

### Platform Support
- **Primary**: Mobile browsers (iOS Safari, Android Chrome)
- **Secondary**: Desktop browsers (Chrome, Firefox, Safari, Edge)
- **Responsive**: Adapts to various screen sizes (320px to 1920px+)

### Technologies
- **Language**: TypeScript (for code stability and better IDE support)
- **Game Framework**: Phaser.js 3.x (includes WebGL/Canvas rendering)
- **Physics Engine**: Matter.js (available as Phaser plugin for realistic stability)
- **Audio**: Howler.js (mobile-optimized sound management)
- **Backend**: Firebase SDK (authentication, firestore, analytics)
- **Internationalization**: Custom i18n system with English phrases as keys
- **Build Tool**: Vite (fast development and optimized builds)
- **PWA**: Progressive Web App capabilities for mobile installation

### Performance
- **60 FPS**: Smooth animations and physics
- **Fast Loading**: Optimized assets under 1.5MB total
- **Offline Support**: Basic gameplay works without internet
- **Touch Responsive**: <100ms input lag

## 🌍 Multi-Language Support

### Core Approach
Using **English phrases as translation keys** with automatic fallback:
```typescript
t("Play Game")              // Returns "Play Game" or "Грати"
t("Level Complete!")        // Returns "Level Complete!" or "Рівень пройдено!"
```

### Supported Languages
- **English** (en) - Primary language, built into translation keys
- **Ukrainian** (ua) - Target user base, full translation required
- **Post-MVP**: Spanish, Polish, German (regional expansion)

### Technical Implementation & Usage
- **JavaScript Translation Files**: `en.ts` (minimal locale settings), `ua.ts` (full translations)
- **Lazy Loading**: Languages loaded on-demand for performance
- **Automatic Detection**: Browser language → saved preference → English fallback
- **Variable Interpolation**: `t("Score: {{score}}", { score: 1250 })`
- **Bundle Size**: <6KB total (English: ~0.5KB, Ukrainian: ~3KB on demand)

```typescript
// Usage in game scenes
import { t, tSync } from '@/i18n';

// Async (when loading language)
const text = await t("Play Game");

// Sync (when language already loaded)
this.button.setText(tSync("Play Game"));
```

### Language Selection
Simple settings interface with flag icons for English/Ukrainian selection.


## 🔥 Firebase Integration

### Features
- **User Profiles**: Anonymous or social login
- **Score Tracking**: Personal best scores and progress
- **Leaderboards**: Global and friends high scores
- **Level Progress**: Cloud save for completed levels
- **Analytics**: Player behavior and difficulty analysis

### Data Structure
```typescript
import { Timestamp } from 'firebase/firestore';

// User Profile
interface UserProfile {
  userId: string;
  displayName: string;
  currentLevel: number;
  highScore: number;
  totalCastlesBuilt: number;
  perfectDrops: number;
  createdAt: Timestamp;
}

// Game Session
interface GameSession {
  sessionId: string;
  userId: string;
  level: number;
  score: number;
  drops: Array<{
    accuracy: number;
    points: number;
    timestamp: number;
  }>;
  completed: boolean;
  duration: number;
}
```

## 👨‍💻 Required Skills Profile

**You are a professional full-stack game developer** with expertise in:

### Core Development
- **TypeScript/JavaScript**: Advanced ES6+ features, strong typing, async programming
- **Game Development**: 2D game mechanics, game loops, scene management, player input handling
- **Physics Programming**: Understanding of collision detection, stability calculations, realistic movement
- **Mobile-First Development**: Touch interfaces, responsive design, performance optimization for mobile devices

### Technical Stack Expertise
- **Phaser.js**: Scene management, sprite handling, input systems, audio integration, WebGL/Canvas rendering
- **Matter.js**: Physics bodies, constraints, collision detection, world simulation, performance tuning
- **Firebase**: Authentication, Firestore database, real-time updates, cloud functions, hosting and deployment
- **Vite**: Modern build tooling, hot module replacement, production optimization, asset bundling

### Frontend Specialization
- **Web APIs**: Canvas/WebGL, Web Audio API, touch events, device orientation, localStorage
- **Performance**: 60fps optimization, memory management, asset loading strategies, mobile browser compatibility
- **PWA Development**: Service workers, offline functionality, app-like experiences, mobile installation

### Game Design & UX
- **Kids-Oriented Design**: Age-appropriate interfaces, colorful and engaging visuals, intuitive interactions
- **Internationalization**: Multi-language support, cultural considerations, text rendering for different languages
- **Audio Integration**: Sound effect timing, mobile audio restrictions, background music management
- **Accessibility**: Touch-friendly UI, clear visual feedback, inclusive design principles

### DevOps & Quality
- **Code Quality**: ESLint configuration, TypeScript strict mode, code organization and modularity
- **Testing**: Game logic testing, cross-device compatibility, performance benchmarking
- **Deployment**: Build optimization, CDN usage, Firebase hosting, continuous deployment

### Nice-to-Have Skills
- **Game Analytics**: Player behavior tracking, A/B testing, performance metrics
- **Vector Graphics**: Creating simple game assets, SVG optimization
- **Database Design**: Efficient data structures for leaderboards and player progress

**Expected Experience Level**: 3+ years in web development with 1+ years in game development or equivalent project complexity.

## ⚠️ Risk Assessment & Mitigation

### High-Risk Areas
- **Physics Complexity**: Matter.js might be overkill for simple stacking
  - *Mitigation*: Start with basic collision detection, upgrade if needed
- **Mobile Performance**: Complex physics + visual effects on older devices
  - *Mitigation*: Performance testing early, fallback to simpler graphics
- **Audio on Mobile**: iOS/Android audio restrictions and user experience
  - *Mitigation*: Howler.js handles most issues, graceful degradation without sound

### Medium-Risk Areas  
- **Kids UX**: What's actually fun and not frustrating for this age group?
  - *Mitigation*: Simple prototype testing with target users early
- **Level Design**: How many levels is "just right" vs overwhelming?
  - *Mitigation*: Start with 5 levels for MVP, expand based on completion rates
- **Asset Creation**: Creating quality visual and audio assets with zero budget
  - *Mitigation*: Start with placeholder assets, improve incrementally
- **Scope Creep**: Feature list growing beyond "vibe coding" sustainability
  - *Mitigation*: Regular scope reviews, stick to MVP-first approach

## 📋 MVP vs Future Features

### ✅ Must-Have (MVP)
- Basic castle part dropping with touch controls
- 5 levels with increasing difficulty  
- Simple stability physics (green/red feedback)
- Basic sound effects (drop, success, fail)
- Score tracking (local storage)
- Multi-language support (English, Ukrainian)
- Basic Firebase setup (anonymous auth, simple progress saving)

### 🔄 Should-Have (Post-MVP)
- Visual effects and enhanced audio
- Advanced Firebase features  
- More complex castle parts

### 💭 Could-Have (Future)
- Multiplayer and achievements
- Level editor and alternative modes

## 🧪 Validation Approach

### Continuous Validation
- **Feel-Based Testing**: Does it feel fun and responsive when you play it?
- **Technical Check-ins**: Regular mobile device testing for performance
- **Organic Feedback**: Share prototypes when they feel ready for eyes-on
- **Intuitive Iterations**: If something feels off, trust that instinct and adjust

### Key Validation Moments
- **First Drop**: When the basic dropping mechanic feels satisfying
- **First Stack**: When stacking 2-3 parts feels stable and fun
- **First Level**: When completing a simple castle feels rewarding
- **Performance Baseline**: When it runs smoothly on your primary test device

## 🚀 Development Flow (Balanced & Organic)

### Foundation Phase: "Get Something Moving"
- [ ] Initialize Vite project with TypeScript template
- [ ] Set up TypeScript configuration and ESLint rules
- [ ] Install and configure Phaser.js with TypeScript definitions
- [ ] Create basic game scene with a moving castle part
- [ ] Add touch/click input for dropping parts
- [ ] Simple collision detection (parts land and stay put)
- [ ] **Milestone**: First satisfying drop experience

### Core Mechanics: "Make It Feel Good"
- [ ] Integrate Matter.js for realistic physics
- [ ] Configure sand-like properties (density, friction, bounce)
- [ ] Implement basic stability checking
- [ ] Add visual feedback (green/red indicators)
- [ ] Basic sound effects for drops and placements
- [ ] **Milestone**: Stacking 2-3 parts feels fun and stable

### Game Structure: "Build the Loop"
- [ ] Multi-language support (English, Ukrainian)
- [ ] Simple UI for kids (big buttons, clear feedback)
- [ ] Mobile optimization and touch improvements
- [ ] **Milestone**: Complete castle-building experience

### Polish & Enhancement: "Make It Shine"
- [ ] Visual effects (particles, glows, smooth animations)
- [ ] Enhanced audio (background music, better sound effects)
- [ ] More castle part varieties 
- [ ] PWA features for mobile installation
- [ ] **Milestone**: Polished, shareable game experience

### Optional Extensions: "Follow the Fun"
- [ ] Firebase integration (leaderboards, cloud saves)
- [ ] Achievement system
- [ ] Social features - score board
- [ ] **Milestone**: Enhanced features that emerged organically

## 🎯 Success Metrics
- **Engagement**: Average session duration >3 minutes
- **Retention**: 40%+ players return within 24 hours
- **Completion**: 60%+ players complete first 5 levels
- **Performance**: 60 FPS on mid-range mobile devices (iPhone 12/Android equivalent)
- **Compatibility**: Works on iOS 14.5+, Android 8.0+, Chrome 90+, Safari 14+ (covering ~85% of mobile users)

---

## 🚀 Getting Started

### Package.json
```json
{
  "name": "sand-castle-game",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "phaser": "^3.70.0",
    "howler": "^2.2.3",
    "firebase": "^10.0.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "typescript": "^5.0.0",
    "@types/howler": "^2.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "deploy": "npm run build && firebase deploy"
  }
}
```

### File Structure
```
sand-castle-game/
├── index.html                  # Main HTML file
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── .eslintrc.json             # ESLint configuration
├── src/
│   ├── main.ts                # Game initialization
│   ├── types/                 # TypeScript type definitions
│   │   ├── Game.ts           # Game-specific types
│   │   └── Physics.ts        # Physics-related types
│   ├── i18n/                  # Internationalization
│   │   ├── index.ts          # Translation system core
│   │   ├── detect.ts         # Language detection
│   │   └── translations/     # Translation files
│   │       ├── en.ts         # English locale settings (minimal)
│   │       └── ua.ts         # Ukrainian translations
│   ├── components/            # Reusable UI components
│   │   └── UserButton.ts     # User profile display component
│   ├── scenes/
│   │   ├── MenuScene.ts      # Main menu
│   │   ├── GameScene.ts      # Core gameplay
│   │   └── GameOverScene.ts  # End game screen
│   ├── objects/
│   │   ├── CastlePart.ts     # Castle part class
│   │   └── StabilityManager.ts # Physics stability logic
│   ├── utils/
│   │   ├── AudioManager.ts   # Howler.js wrapper
│   │   └── FirebaseConfig.ts # Firebase setup
│   └── assets/
│       ├── images/           # Castle parts, backgrounds
│       └── sounds/           # Audio files
├── public/
│   ├── favicon.ico
│   └── manifest.json         # PWA manifest
└── firebase.json             # Firebase configuration
```

### TypeScript Configuration

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/scenes/*": ["scenes/*"],
      "@/objects/*": ["objects/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"]
    }
  },
  "include": ["src"]
}
```

#### .eslintrc.json
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "root": true,
  "env": {
    "browser": true,
    "es2020": true
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

### Quick Start Commands
```bash
# Setup project with TypeScript
npm create vite@latest sand-castle-game --template vanilla-ts
cd sand-castle-game
npm install phaser howler firebase
npm install -D typescript @types/howler @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Deploy to Firebase
npm run deploy
```

### Prerequisites
```bash
# Required tools
Node.js 18+ (LTS recommended)
npm 9+ or yarn 3+
Git 2.30+
VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Auto Rename Tag
  - GitLens
```

### First-Time Setup
```bash
# 1. Clone or create repository
git init sand-castle-game
cd sand-castle-game

# 2. Initialize project
npm create vite@latest . --template vanilla-ts

# 3. Install dependencies
npm install phaser@^3.70.0 howler@^2.2.3 firebase@^10.0.0
npm install -D @types/howler @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# 4. Start development server
npm run dev

# 5. Open http://localhost:5173 in browser
# 6. Test on mobile device using local network IP
```

### Development Workflow
```bash
# Daily development flow
git pull origin main              # Get latest changes
npm run dev                       # Start dev server
# ... code, test, iterate ...
npm run type-check               # Check TypeScript
npm run lint                     # Check code quality
git add . && git commit -m "..."  # Commit changes
git push origin feature-branch   # Push changes
```

## 🔮 Future Considerations & Improvements

As we develop the Sand Castle game, this document will evolve to address:

### Potential Enhancements
- **Advanced Physics**: More complex stability calculations, wind effects, erosion
- **Accessibility**: Screen reader support, color-blind friendly palettes, motor accessibility
- **Performance**: Advanced optimization techniques for lower-end devices
- **Monetization**: Ad integration, premium features, cosmetic purchases
- **Social Features**: Friend systems, shared leaderboards, castle sharing
- **Analytics**: Detailed player behavior tracking and game balance adjustments

### Technical Debt & Refactoring
- **Code Architecture**: As the game grows, we may need to refactor for better modularity
- **Asset Management**: Optimized asset loading and caching strategies
- **State Management**: More sophisticated game state handling for complex features
- **Testing**: Unit tests, integration tests, and automated gameplay testing

### Platform Expansion
- **Native Mobile**: PWA to native app conversion considerations
- **Desktop Features**: Keyboard shortcuts, window resizing, multi-monitor support
- **VR/AR**: Future immersive platform adaptations

### Community & Content
- **Level Editor**: Player-created levels and challenges
- **Modding Support**: Community-generated castle parts and themes
- **Educational Content**: Teaching real architecture and engineering concepts

### Code Standards
#### TypeScript Standards
```typescript
// Use descriptive names and strong typing
interface CastlePartData {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  velocity: { x: number; y: number };
  isStable: boolean;
}

// Use const assertions and enums for constants
const PART_TYPES = ['base', 'wall', 'tower', 'decoration'] as const;
type PartType = typeof PART_TYPES[number];

// Prefer function declarations for main functions
function checkStability(parts: CastlePartData[]): StabilityResult {
  // Implementation
}

// Use arrow functions for callbacks and short utilities
const isMoving = (part: CastlePartData) => 
  Math.abs(part.velocity.x) > 0.1 || Math.abs(part.velocity.y) > 0.1;
```

#### File Organization
```
src/
├── main.ts                    # Entry point
├── config/                    # Game configuration
│   ├── gameConfig.ts         # Phaser game config
│   └── constants.ts          # Game constants
├── i18n/                      # Internationalization
│   ├── index.ts              # Translation system core
│   ├── detect.ts             # Language detection
│   └── translations/         # Translation files (en, es, fr)
├── scenes/                    # Phaser scenes
│   ├── MenuScene.ts
│   ├── GameScene.ts
│   └── GameOverScene.ts
├── objects/                   # Game objects (matches File Structure above)
│   ├── CastlePart.ts
│   ├── Castle.ts
│   └── StabilityManager.ts
├── utils/                     # Utilities
│   ├── AudioManager.ts
│   ├── FirebaseConfig.ts
│   ├── math.ts
│   └── helpers.ts
└── types/                     # Type definitions
    ├── Game.ts
    └── Physics.ts
```

#### Naming Conventions
- **Files**: PascalCase for classes and managers (`CastlePart.ts`, `AudioManager.ts`)
- **Classes**: PascalCase (`class StabilityManager`)
- **Functions**: camelCase (`function calculateStability()`)
- **Constants**: UPPER_SNAKE_CASE (`const MAX_PARTS = 10`)
- **Interfaces**: PascalCase with descriptive names (`interface GameState`)

## 🎨 Asset Requirements & Guidelines

### Visual Assets Needed
```
assets/
├── images/
│   ├── parts/                 # Castle part sprites
│   │   ├── base-block.png    # 80x40px, sand-colored
│   │   ├── wall-block.png    # 80x60px, brick texture
│   │   ├── tower-top.png     # 80x80px, pointed roof
│   │   └── decoration.png    # 40x40px, flags/details
│   ├── backgrounds/
│   │   ├── beach-bg.jpg      # 1920x1080px, beach scene
│   │   └── sky-gradient.png  # 1920x400px, beach sky
│   └── ui/
│       ├── button-play.png   # 120x60px, kid-friendly
│       ├── button-pause.png  # 60x60px, touch-friendly
│       └── icons/            # 32x32px icons for UI
└── sounds/
    ├── effects/
    │   ├── drop.wav          # Part drop sound (0.2s)
    │   ├── place-good.wav    # Successful placement (0.3s)
    │   ├── place-perfect.wav # Perfect placement (0.5s)
    │   ├── wobble.wav        # Unstable warning (0.1s loop)
    │   └── collapse.wav      # Castle collapse (1.0s)
    └── music/
        └── beach-ambient.mp3 # Background music (2-3min loop)
```

### Asset Specifications
- **Image Format**: PNG for sprites with transparency, JPG for backgrounds
- **Resolution**: 2x for retina displays, optimized for mobile
- **Color Palette**: Warm beach colors (sandy yellows, ocean blues, sunset oranges)
- **Audio Format**: WAV for effects, MP3 for music
- **File Size**: Individual images <50KB, audio files <100KB, total assets <1.5MB

## 🎯 Strategic Mitigation Approach

### Core Strategy: Start Simple, Validate Early
- **MVP First**: Get basic dropping mechanic working and test with real kids
- **Progressive Enhancement**: Add complexity only after validating core fun factor
- **Performance Budget**: Set strict limits and test on low-end devices from day one
- **Graceful Degradation**: Game works even when advanced features fail

### Validation Gates
- **Developer Satisfaction**: If feature takes >2 days to implement or feels frustrating, simplify approach
- **Target User Testing**: Test with 3-5 kids (ages 6-12) at each milestone
- **Device Performance**: Maintain 60fps on iPhone 12 / Samsung Galaxy A52 as baseline
- **Resource Check**: Each milestone should complete within current available development time

---

**Current Status**: ✅ Complete developer handoff package ready

**What's Included**: Technical specs, development environment, code standards, asset requirements, testing strategy, deployment process, and step-by-step getting started guide.

**What's Missing**: Assets (can be placeholder colored rectangles initially), Firebase project setup (can be done later), and the actual code (that's the fun part to build!).

This document provides everything a developer needs to start building the Sand Castle game using the "vibe coding" approach. The technical foundation is solid, the creative direction is clear, and the development process is designed for sustainable, enjoyable progress. Time to start building something awesome! 🏰 