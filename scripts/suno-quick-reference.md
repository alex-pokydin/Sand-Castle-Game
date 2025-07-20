# 🎵 Audio Quick Reference - Suno Music + Alternative Sources

## 🎵 Music Generation (Suno AI - Priority 1)

### Main Menu Music (NEW!)
```
A welcoming, cheerful beach music with ukulele and gentle percussion. Warm and inviting, perfect for a game menu. Kids-friendly, not too energetic. 1-2 minutes loopable.
```

### Background Music
```
A peaceful, calming beach ambient music with gentle ocean waves, soft wind, and distant seagulls. Warm, sunny atmosphere with subtle tropical instruments. Perfect for a kids' sand castle building game. 2-3 minutes loopable.
```

### Level Complete Music (Updated - Full Track)
```
A celebratory, upbeat beach music with ukulele, light percussion, and ocean sounds. Joyful and triumphant, perfect for level completion in a kids' game. 1-2 minutes.
```

### Achievement Music (NEW!)
```
A short, magical jingle with ascending notes and sparkly sounds. Like discovering treasure. Celebratory but gentle for kids. 0.8-1.2 seconds.
```

## 🔊 Sound Effects (Alternative Sources - Priority 1)

### Recommended Sources:
- **Freesound.org** - Best free quality
- **Zapsplat** - High quality, free with attribution
- **BBC Sound Effects** - Professional quality
- **OpenGameArt.org** - Game-focused sounds

### Core Sound Effects Search Terms:

#### Drop Sound
**Search:** `sand block drop, wooden block fall, gentle thud`
**Duration:** 0.2 seconds
**Keywords:** soft, gentle, natural

#### Success Sound
**Search:** `satisfying click, soft impact, block placement`
**Duration:** 0.1 seconds
**Keywords:** positive, rewarding, satisfying

#### Perfect Placement
**Search:** `magical chime, ascending notes, perfect placement`
**Duration:** 0.5 seconds
**Keywords:** magical, sparkly, celebratory

#### Wrong Placement
**Search:** `soft thud, disappointing, sand falling`
**Duration:** 0.3 seconds
**Keywords:** gentle, disappointing, natural

#### Collapse Sound
**Search:** `sand collapse, blocks falling, gentle cascade`
**Duration:** 1.0 seconds
**Keywords:** natural, gentle, soft

#### Level Complete Sound Effect
**Search:** `celebration sound, achievement, success`
**Duration:** 0.5 seconds
**Keywords:** celebratory, positive, rewarding

## 🌊 Ambient Sounds (Alternative Sources - Priority 2)

### Ocean Waves
**Search:** `ocean waves, beach waves, gentle waves`
**Duration:** 3 minutes (loopable)
**Source:** Freesound.org, BBC Sound Effects

### Seagull Calls
**Search:** `seagull, bird call, beach birds`
**Duration:** 0.5 seconds
**Source:** Freesound.org, BBC Sound Effects

## 🎮 Game State Sounds (Alternative Sources - Priority 2)

### Achievement Sound Effect
**Search:** `magical sparkle, ascending notes, achievement`
**Duration:** 0.8 seconds
**Source:** Freesound.org, Zapsplat

### Combo Sound
**Search:** `ascending chime, combo, progression`
**Duration:** 0.5 seconds
**Source:** Freesound.org, Zapsplat

## 📱 UI Sounds (Alternative Sources - Priority 3)

### Button Click
**Search:** `button click, UI tap, soft click`
**Duration:** 0.1 seconds
**Source:** Freesound.org, Zapsplat

---

## 🚀 Quick Start Workflow

1. **Generate Music with Suno** - Menu theme, background, level complete, achievement
2. **Download Sound Effects** - Use Freesound.org/Zapsplat for core effects
3. **Test Integration** - Use the integration script to add files
4. **Add Ambients** - Download waves and seagulls from BBC/Freesound
5. **Polish** - Add UI sounds and remaining effects

## 📋 File Naming Convention

Use these exact filenames for automatic integration:

**Effects:**
- `drop.wav`
- `place-good.wav`
- `place-perfect.wav`
- `place-wrong.wav`
- `collapse.wav`
- `level-complete-sfx.wav`
- `achievement-sfx.wav`
- `combo.wav`

**Ambient:**
- `waves.wav`
- `seagull.wav`

**Music:**
- `menu-theme.mp3`
- `beach-ambient.mp3`
- `level-complete.mp3`
- `achievement.mp3`

## 🔧 Integration Commands

```bash
# Setup directories and show checklist
node scripts/integrate-suno-audio.js setup

# After generating files, place them in suno-generated/ directory
# Then integrate them:
node scripts/integrate-suno-audio.js integrate

# Check progress:
node scripts/integrate-suno-audio.js report
```

---

**Pro Tips:**
- **Music**: Always mention "kids' game" in Suno prompts for appropriate tone
- **Sound Effects**: Use "gentle", "soft", "natural" keywords when searching
- **Duration**: Keep effects short (0.1-0.5s) for responsiveness
- **Quality**: Download multiple versions and choose the best
- **Testing**: Test with the game before finalizing
- **Sources**: Start with Freesound.org for best free quality 