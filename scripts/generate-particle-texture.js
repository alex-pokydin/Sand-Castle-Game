// Script to generate a simple particle texture for visual effects
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple particle texture as SVG
const generateParticleTexture = () => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#FFFFFF;stop-opacity:0.7" />
      <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0" />
    </radialGradient>
  </defs>
  <circle cx="16" cy="16" r="12" fill="url(#particleGradient)" />
</svg>`;

  const filepath = path.join('public/assets', 'particle.svg');
  fs.writeFileSync(filepath, svg);
  console.log(`Generated: ${filepath}`);
};

// Create directories and generate texture
const createDirectories = () => {
  const dirs = ['public/assets'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

createDirectories();
generateParticleTexture();
console.log('\n✅ Particle texture generated!'); 