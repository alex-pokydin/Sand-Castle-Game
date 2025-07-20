// Script to integrate Suno-generated audio files into the Sand Castle Game
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Audio file mapping for all audio files (Suno + Alternative Sources)
const AUDIO_FILE_MAPPING = {
  // Sound Effects (Alternative Sources: Freesound.org, Zapsplat, etc.)
  'drop.wav': {
    description: 'Part drop sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'sand block drop, wooden block fall, gentle thud'
  },
  'place-good.wav': {
    description: 'Successful placement sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'satisfying click, soft impact, block placement'
  },
  'place-perfect.wav': {
    description: 'Perfect placement sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'magical chime, ascending notes, perfect placement'
  },
  'place-wrong.wav': {
    description: 'Wrong placement sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'soft thud, disappointing, sand falling'
  },
  'wobble.wav': {
    description: 'Unstable warning sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'gentle wobble, rattle, unstable'
  },
  'collapse.wav': {
    description: 'Castle collapse sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'sand collapse, blocks falling, gentle cascade'
  },
  'level-complete-sfx.wav': {
    description: 'Level completion sound effect',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'celebration sound, achievement, success'
  },
  'achievement-sfx.wav': {
    description: 'Achievement sound effect',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'magical sparkle, ascending notes, achievement'
  },
  'combo.wav': {
    description: 'Combo sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'ascending chime, combo, progression'
  },
  'rare-part.wav': {
    description: 'Rare part discovery sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'magical twinkle, treasure, discovery'
  },
  'button-click.wav': {
    description: 'UI button click sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'button click, UI tap, soft click'
  },
  'menu-nav.wav': {
    description: 'Menu navigation sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'menu swoosh, navigation, smooth'
  },
  'settings-toggle.wav': {
    description: 'Settings toggle sound',
    category: 'effects',
    source: 'Alternative (Freesound.org, Zapsplat)',
    searchTerms: 'toggle, switch, settings'
  },

  // Ambient Sounds (Alternative Sources)
  'waves.wav': {
    description: 'Ocean waves',
    category: 'ambient',
    source: 'Alternative (Freesound.org, BBC Sound Effects)',
    searchTerms: 'ocean waves, beach waves, gentle waves'
  },
  'seagull.wav': {
    description: 'Seagull calls',
    category: 'ambient',
    source: 'Alternative (Freesound.org, BBC Sound Effects)',
    searchTerms: 'seagull, bird call, beach birds'
  },
  'wind.wav': {
    description: 'Beach wind',
    category: 'ambient',
    source: 'Alternative (Freesound.org, BBC Sound Effects)',
    searchTerms: 'beach wind, gentle breeze, palm trees'
  },

  // Music (Suno AI)
  'menu-theme.mp3': {
    description: 'Main menu music',
    category: 'music',
    source: 'Suno AI',
    prompt: 'A welcoming, cheerful beach music with ukulele and gentle percussion. Warm and inviting, perfect for a game menu. Kids-friendly, not too energetic. 1-2 minutes loopable.'
  },
  'beach-ambient.mp3': {
    description: 'Background music',
    category: 'music',
    source: 'Suno AI',
    prompt: 'A peaceful, calming beach ambient music with gentle ocean waves, soft wind, and distant seagulls. Warm, sunny atmosphere with subtle tropical instruments. Perfect for a kids\' sand castle building game. 2-3 minutes loopable.'
  },
  'level-complete.mp3': {
    description: 'Level completion music',
    category: 'music',
    source: 'Suno AI',
    prompt: 'A celebratory, upbeat beach music with ukulele, light percussion, and ocean sounds. Joyful and triumphant, perfect for level completion in a kids\' game. 1-2 minutes.'
  },
  'achievement.mp3': {
    description: 'Achievement jingle',
    category: 'music',
    source: 'Suno AI',
    prompt: 'A short, magical jingle with ascending notes and sparkly sounds. Like discovering treasure. Celebratory but gentle for kids. 0.8-1.2 seconds.'
  }
};

/**
 * Create directory structure for audio files
 */
const createAudioDirectories = () => {
  const directories = [
    'public/assets/sounds/effects',
    'public/assets/sounds/ambient',
    'public/assets/sounds/music',
    'suno-generated' // Temporary directory for Suno files
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

/**
 * Generate a checklist of required audio files
 */
const generateAudioChecklist = () => {
  console.log('\n📋 AUDIO GENERATION CHECKLIST\n');
  console.log('Required Audio Files for Sand Castle Game:\n');

  // Group by source
  const sunoFiles = Object.entries(AUDIO_FILE_MAPPING).filter(([_, config]) => config.source === 'Suno AI');
  const alternativeFiles = Object.entries(AUDIO_FILE_MAPPING).filter(([_, config]) => config.source !== 'Suno AI');

  console.log('🎵 MUSIC (Suno AI):\n');
  sunoFiles.forEach(([filename, config]) => {
    console.log(`✅ ${filename}`);
    console.log(`   Category: ${config.category}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Prompt: ${config.prompt}`);
    console.log('');
  });

  console.log('🔊 SOUND EFFECTS (Alternative Sources):\n');
  alternativeFiles.forEach(([filename, config]) => {
    console.log(`✅ ${filename}`);
    console.log(`   Category: ${config.category}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Source: ${config.source}`);
    console.log(`   Search Terms: ${config.searchTerms}`);
    console.log('');
  });

  console.log('📁 File Organization:');
  console.log('├── effects/     (Sound effects for game actions)');
  console.log('├── ambient/     (Background ambient sounds)');
  console.log('└── music/       (Background music tracks)');
  
  console.log('\n🎯 RECOMMENDED SOURCES:');
  console.log('🎵 Music: Suno AI (https://suno.ai)');
  console.log('🔊 Sound Effects: Freesound.org, Zapsplat, BBC Sound Effects');
  console.log('🌊 Ambient: Freesound.org, BBC Sound Effects Library');
};

/**
 * Validate audio files
 */
const validateAudioFiles = () => {
  console.log('\n🔍 VALIDATING AUDIO FILES\n');

  const audioDir = 'suno-generated';
  if (!fs.existsSync(audioDir)) {
    console.log('❌ No "suno-generated" directory found');
    console.log('   Please place your audio files in this directory');
    return;
  }

  const files = fs.readdirSync(audioDir);
  console.log(`Found ${files.length} files in ${audioDir} directory:\n`);

  const sunoFiles = [];
  const alternativeFiles = [];
  const unknownFiles = [];

  files.forEach(file => {
    const expectedConfig = AUDIO_FILE_MAPPING[file];
    if (expectedConfig) {
      if (expectedConfig.source === 'Suno AI') {
        sunoFiles.push({ file, config: expectedConfig });
      } else {
        alternativeFiles.push({ file, config: expectedConfig });
      }
    } else {
      unknownFiles.push(file);
    }
  });

  if (sunoFiles.length > 0) {
    console.log('🎵 SUNO AI MUSIC FILES:');
    sunoFiles.forEach(({ file, config }) => {
      console.log(`✅ ${file} - ${config.description}`);
    });
    console.log('');
  }

  if (alternativeFiles.length > 0) {
    console.log('🔊 ALTERNATIVE SOURCE FILES:');
    alternativeFiles.forEach(({ file, config }) => {
      console.log(`✅ ${file} - ${config.description} (${config.source})`);
    });
    console.log('');
  }

  if (unknownFiles.length > 0) {
    console.log('⚠️  UNKNOWN FILES (may need renaming):');
    unknownFiles.forEach(file => {
      console.log(`❓ ${file}`);
    });
    console.log('');
  }

  console.log(`📊 Summary: ${sunoFiles.length} music files, ${alternativeFiles.length} sound effects, ${unknownFiles.length} unknown files`);
};

/**
 * Integrate audio files into the game
 */
const integrateAudioFiles = () => {
  console.log('\n🔄 INTEGRATING AUDIO FILES\n');

  const audioDir = 'suno-generated';
  if (!fs.existsSync(audioDir)) {
    console.log('❌ No audio files found in suno-generated directory');
    return;
  }

  const files = fs.readdirSync(audioDir);
  let integratedCount = 0;
  let musicCount = 0;
  let effectsCount = 0;

  files.forEach(file => {
    const expectedConfig = AUDIO_FILE_MAPPING[file];
    if (expectedConfig) {
      const sourcePath = path.join(audioDir, file);
      const targetDir = `public/assets/sounds/${expectedConfig.category}`;
      const targetPath = path.join(targetDir, file);

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy file to appropriate location
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Integrated: ${file} → ${targetPath} (${expectedConfig.source})`);
      integratedCount++;
      
      if (expectedConfig.category === 'music') {
        musicCount++;
      } else {
        effectsCount++;
      }
    } else {
      console.log(`⚠️  Skipped: ${file} (not in expected file list)`);
    }
  });

  console.log(`\n🎉 Successfully integrated ${integratedCount} audio files!`);
  console.log(`   🎵 Music: ${musicCount} files`);
  console.log(`   🔊 Sound Effects: ${effectsCount} files`);
};

/**
 * Generate integration report
 */
const generateIntegrationReport = () => {
  console.log('\n📊 AUDIO INTEGRATION REPORT\n');

  const categories = ['effects', 'ambient', 'music'];
  let totalFiles = 0;
  let missingFiles = 0;

  categories.forEach(category => {
    const categoryDir = `public/assets/sounds/${category}`;
    const expectedFiles = Object.entries(AUDIO_FILE_MAPPING)
      .filter(([_, config]) => config.category === category)
      .map(([filename, _]) => filename);

    console.log(`${category.toUpperCase()} (${categoryDir}):`);
    
    if (fs.existsSync(categoryDir)) {
      const existingFiles = fs.readdirSync(categoryDir);
      expectedFiles.forEach(expectedFile => {
        if (existingFiles.includes(expectedFile)) {
          console.log(`  ✅ ${expectedFile}`);
          totalFiles++;
        } else {
          console.log(`  ❌ ${expectedFile} (missing)`);
          missingFiles++;
        }
      });
    } else {
      console.log(`  ❌ Directory not found`);
      missingFiles += expectedFiles.length;
    }
    console.log('');
  });

  console.log(`📈 Summary:`);
  console.log(`  Total files: ${totalFiles + missingFiles}`);
  console.log(`  Present: ${totalFiles}`);
  console.log(`  Missing: ${missingFiles}`);
  console.log(`  Completion: ${Math.round((totalFiles / (totalFiles + missingFiles)) * 100)}%`);
};

/**
 * Generate TypeScript interface for audio files
 */
const generateAudioInterface = () => {
  console.log('\n🔧 GENERATING AUDIO INTERFACE\n');

  const interfaceCode = `// Auto-generated audio file interface
export interface AudioFileConfig {
  filename: string;
  description: string;
  category: 'effects' | 'ambient' | 'music';
  prompt: string;
}

export const AUDIO_FILES: Record<string, AudioFileConfig> = ${JSON.stringify(AUDIO_FILE_MAPPING, null, 2)};

export const AUDIO_CATEGORIES = {
  effects: Object.entries(AUDIO_FILES).filter(([_, config]) => config.category === 'effects'),
  ambient: Object.entries(AUDIO_FILES).filter(([_, config]) => config.category === 'ambient'),
  music: Object.entries(AUDIO_FILES).filter(([_, config]) => config.category === 'music')
} as const;
`;

  fs.writeFileSync('src/types/AudioFiles.ts', interfaceCode);
  console.log('✅ Generated: src/types/AudioFiles.ts');
};

/**
 * Main function
 */
const main = () => {
  console.log('🎵 AUDIO INTEGRATION TOOL\n');

  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'setup':
      createAudioDirectories();
      generateAudioChecklist();
      break;
    
    case 'checklist':
      generateAudioChecklist();
      break;
    
    case 'validate':
      validateAudioFiles();
      break;
    
    case 'integrate':
      integrateAudioFiles();
      break;
    
    case 'report':
      generateIntegrationReport();
      break;
    
    case 'generate-interface':
      generateAudioInterface();
      break;
    
    case 'all':
      createAudioDirectories();
      generateAudioChecklist();
      validateAudioFiles();
      integrateAudioFiles();
      generateIntegrationReport();
      generateAudioInterface();
      break;
    
    default:
      console.log('Usage: node integrate-suno-audio.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  setup              - Create directories and show checklist');
      console.log('  checklist          - Show required audio files and sources');
      console.log('  validate           - Validate audio files');
      console.log('  integrate          - Copy files to game directories');
      console.log('  report             - Generate integration report');
      console.log('  generate-interface - Generate TypeScript interface');
      console.log('  all                - Run all commands');
      console.log('');
      console.log('Example workflow:');
      console.log('  1. node integrate-suno-audio.js setup');
      console.log('  2. Generate music with Suno AI');
      console.log('  3. Download sound effects from Freesound.org/Zapsplat');
      console.log('  4. Place all files in suno-generated/ directory');
      console.log('  5. node integrate-suno-audio.js integrate');
      console.log('  6. node integrate-suno-audio.js report');
      console.log('');
      console.log('🎯 Audio Sources:');
      console.log('  🎵 Music: Suno AI (https://suno.ai)');
      console.log('  🔊 Sound Effects: Freesound.org, Zapsplat, BBC Sound Effects');
  }
};

// Run the script
main(); 