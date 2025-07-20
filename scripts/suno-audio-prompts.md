# Suno Audio Generation Prompts for Sand Castle Game

This document contains optimized prompts for generating high-quality audio files using Suno AI for the Sand Castle Game's enhanced audio system.

## 🎵 Background Music

### Beach Ambient Music (Main Theme)
**Prompt:** `A peaceful, calming beach ambient music with gentle ocean waves, soft wind, and distant seagulls. Warm, sunny atmosphere with subtle tropical instruments. Perfect for a kids' sand castle building game. 2-3 minutes loopable.`

**Settings:**
- Duration: 2-3 minutes
- Style: Ambient, Calm, Tropical
- Mood: Peaceful, Relaxing, Happy
- BPM: 80-100

### Level Progression Music
**Prompt:** `Upbeat, cheerful beach music with ukulele, light percussion, and ocean sounds. Celebratory but not overwhelming. Perfect for level completion in a kids' game.`

**Settings:**
- Duration: 1-2 minutes
- Style: Tropical, Cheerful
- Mood: Celebratory, Happy
- BPM: 120-140

## 🔊 Sound Effects

### Part Drop Sound
**Prompt:** `A soft, satisfying "whoosh" sound as a sand castle block falls through the air. Gentle wind resistance, natural and organic. Not too loud or jarring for kids.`

**Settings:**
- Duration: 0.2-0.3 seconds
- Style: Natural, Soft
- Mood: Satisfying, Gentle

### Successful Placement Sound
**Prompt:** `A gentle, satisfying "click" or "thud" as a sand castle block lands perfectly in place. Soft impact, like sand settling. Positive and rewarding.`

**Settings:**
- Duration: 0.1-0.2 seconds
- Style: Natural, Soft
- Mood: Satisfying, Positive

### Perfect Placement Sound
**Prompt:** `A magical, ascending chime sound (C-E-G major chord) as a castle block is placed perfectly. Sparkly, celebratory, but not overwhelming. Like tiny bells or wind chimes.`

**Settings:**
- Duration: 0.5-0.8 seconds
- Style: Magical, Sparkly
- Mood: Celebratory, Magical

### Wrong Placement Sound
**Prompt:** `A soft, gentle "thud" sound as a castle block is placed incorrectly. Disappointing but not harsh or scary for kids. Like sand falling apart.`

**Settings:**
- Duration: 0.3-0.5 seconds
- Style: Natural, Soft
- Mood: Disappointing, Gentle

### Unstable Warning Sound
**Prompt:** `A gentle wobble or rattle sound as a castle block becomes unstable. Like sand shifting or blocks teetering. Warning but not alarming.`

**Settings:**
- Duration: 0.1-0.2 seconds
- Style: Natural, Soft
- Mood: Warning, Gentle

### Castle Collapse Sound
**Prompt:** `A soft, gentle collapse sound as sand castle blocks fall apart. Like sand cascading down. Not dramatic or scary, just natural.`

**Settings:**
- Duration: 1.0-1.5 seconds
- Style: Natural, Soft
- Mood: Gentle, Natural

### Level Complete Sound
**Prompt:** `A celebratory, ascending melody with beach instruments (ukulele, light percussion). Joyful but not overwhelming. Perfect for level completion.`

**Settings:**
- Duration: 2.0-3.0 seconds
- Style: Tropical, Celebratory
- Mood: Joyful, Triumphant

## 🌊 Ambient Sounds

### Ocean Waves
**Prompt:** `Gentle, continuous ocean waves lapping against the shore. Calming, natural, not too loud. Perfect background ambience.`

**Settings:**
- Duration: 3-5 minutes (loopable)
- Style: Natural, Ambient
- Mood: Calming, Peaceful

### Seagull Calls
**Prompt:** `Distant seagull calls over the ocean. Natural, not too frequent, peaceful. Like birds flying overhead occasionally.`

**Settings:**
- Duration: 0.5-1.0 seconds per call
- Style: Natural, Bird sounds
- Mood: Peaceful, Natural

### Beach Wind
**Prompt:** `Gentle beach breeze through palm trees and sand. Soft wind sounds, natural and calming. Not too strong or distracting.`

**Settings:**
- Duration: 2-3 minutes (loopable)
- Style: Natural, Ambient
- Mood: Calming, Refreshing

## 🎮 Game State Sounds

### Achievement Unlock
**Prompt:** `A magical sparkle sound with ascending notes. Like tiny bells or fairy dust. Celebratory but gentle for kids.`

**Settings:**
- Duration: 0.8-1.2 seconds
- Style: Magical, Sparkly
- Mood: Celebratory, Magical

### Combo Sound
**Prompt:** `An ascending chime sequence as multiple blocks are placed correctly. Each note higher than the last. Satisfying progression.`

**Settings:**
- Duration: 0.5-1.0 seconds
- Style: Musical, Chime
- Mood: Satisfying, Progressive

### Rare Part Discovery
**Prompt:** `A magical twinkle sound with golden sparkles. Like discovering treasure. Special and exciting but not overwhelming.`

**Settings:**
- Duration: 0.8-1.2 seconds
- Style: Magical, Sparkly
- Mood: Exciting, Special

## 📱 UI Sounds

### Button Click
**Prompt:** `A soft, satisfying click sound for UI buttons. Gentle and responsive, like a soft tap.`

**Settings:**
- Duration: 0.1-0.2 seconds
- Style: Clean, Soft
- Mood: Responsive, Satisfying

### Menu Navigation
**Prompt:** `A gentle swoosh sound for menu navigation. Smooth and fluid, like sliding through options.`

**Settings:**
- Duration: 0.2-0.3 seconds
- Style: Smooth, Fluid
- Mood: Smooth, Responsive

### Settings Toggle
**Prompt:** `A soft toggle sound for settings changes. Gentle click or switch sound.`

**Settings:**
- Duration: 0.1-0.2 seconds
- Style: Clean, Soft
- Mood: Responsive, Clear

## 🎯 Prompt Optimization Tips

### For Suno AI:
1. **Be Specific**: Include duration, style, and mood
2. **Use Descriptive Language**: "Gentle", "Soft", "Natural", "Magical"
3. **Consider Context**: Mention it's for a kids' game
4. **Avoid Harsh Terms**: Use "gentle" instead of "loud", "soft" instead of "sharp"
5. **Include Musical References**: "C-E-G major chord", "ascending melody"

### Quality Guidelines:
- **Duration**: Keep effects short (0.1-0.5s) for responsiveness
- **Volume**: Generate at consistent levels for easy mixing
- **Looping**: Background music should be seamless when looped
- **Variety**: Generate multiple versions for variety

## 📁 File Organization

### Generated Files Structure:
```
public/assets/sounds/
├── effects/
│   ├── drop.wav              # Part drop sound
│   ├── place-good.wav        # Successful placement
│   ├── place-perfect.wav     # Perfect placement
│   ├── place-wrong.wav       # Wrong placement
│   ├── wobble.wav            # Unstable warning
│   ├── collapse.wav          # Castle collapse
│   ├── level-complete.wav    # Level completion
│   ├── achievement.wav       # Achievement unlock
│   ├── combo.wav             # Combo sound
│   ├── rare-part.wav         # Rare part discovery
│   ├── button-click.wav      # UI button click
│   ├── menu-nav.wav          # Menu navigation
│   └── settings-toggle.wav   # Settings toggle
├── ambient/
│   ├── waves.wav             # Ocean waves
│   ├── seagull.wav           # Seagull calls
│   └── wind.wav              # Beach wind
└── music/
    ├── beach-ambient.mp3     # Main background music
    └── level-progression.mp3 # Level completion music
```

## 🔧 Integration Notes

### Audio File Requirements:
- **Format**: WAV for effects, MP3 for music
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono for effects, Stereo for music
- **Normalization**: -12dB to -6dB for effects, -18dB to -12dB for music

### EnhancedAudioManager Integration:
```typescript
// The generated files will work with our existing EnhancedAudioManager
// Just replace the placeholder files with the Suno-generated ones
```

## 🎨 Creative Variations

### Alternative Prompts for Variety:

#### Drop Sound Variations:
- `A soft "plop" sound as a sand block lands gently`
- `A gentle "thud" with sand settling around it`
- `A satisfying "click" as blocks connect perfectly`

#### Success Sound Variations:
- `A magical sparkle with ascending notes`
- `A gentle chime with ocean breeze`
- `A soft bell ring with tropical undertones`

#### Ambient Variations:
- `Distant waves with gentle seabirds`
- `Soft wind through beach grass`
- `Peaceful ocean with occasional dolphin sounds`

---

**Note**: These prompts are optimized for Suno AI's capabilities and the specific needs of a kids' sand castle building game. The focus is on gentle, natural sounds that enhance the experience without being overwhelming or scary for young players. 