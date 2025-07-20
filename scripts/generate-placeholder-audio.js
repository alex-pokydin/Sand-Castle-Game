// Script to generate placeholder audio files for development
// This creates simple sine wave audio files for testing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const createDirectories = () => {
  const dirs = [
    'public/assets/sounds/effects',
    'public/assets/sounds/music'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Generate a simple sine wave WAV file
const generateSineWave = (frequency, duration, filename) => {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2); // WAV header + 16-bit samples
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Generate sine wave samples
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.3; // 30% volume
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }
  
  fs.writeFileSync(filename, buffer);
  console.log(`Generated: ${filename}`);
};

// Generate all placeholder audio files
const generateAudioFiles = () => {
  createDirectories();
  
  const audioFiles = [
    { name: 'drop.wav', freq: 800, duration: 0.2 },
    { name: 'place-good.wav', freq: 1000, duration: 0.1 },
    { name: 'place-perfect.wav', freq: 1200, duration: 0.5 },
    { name: 'wobble.wav', freq: 200, duration: 0.1 },
    { name: 'collapse.wav', freq: 150, duration: 1.0 },
    { name: 'level-complete.wav', freq: 1000, duration: 2.0 },
    { name: 'waves.wav', freq: 50, duration: 3.0 },
    { name: 'seagull.wav', freq: 1200, duration: 1.5 },
    { name: 'wind.wav', freq: 100, duration: 2.0 }
  ];
  
  audioFiles.forEach(file => {
    const filepath = path.join('public/assets/sounds/effects', file.name);
    generateSineWave(file.freq, file.duration, filepath);
  });
  
  // Generate background music (longer, more complex)
  const musicFile = path.join('public/assets/sounds/music', 'beach-ambient.mp3');
  // For now, just create a placeholder file
  fs.writeFileSync(musicFile, 'placeholder-music-file');
  console.log(`Generated: ${musicFile} (placeholder)`);
  
  console.log('\n✅ All placeholder audio files generated!');
  console.log('Note: These are simple sine wave files for testing.');
  console.log('Replace with actual audio files for production.');
};

// Run the script
generateAudioFiles(); 