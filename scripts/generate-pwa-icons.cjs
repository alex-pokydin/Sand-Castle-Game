const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes required by the manifest
const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Path to the SVG icon
const svgPath = path.join(iconsDir, 'icon.svg');

console.log('Converting SVG to PWA-optimized PNG icons...');

// Function to generate PNG from SVG with PWA-specific settings
async function generatePWAPNGFromSVG(size, outputPath) {
  try {
    await sharp(svgPath)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 135, g: 206, b: 235, alpha: 1 } // Sky blue background
      })
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        force: true
      })
      .toFile(outputPath);
    
    console.log(`Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`Error creating ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

// Generate all PNG icons
async function generateAllPWAIcons() {
  console.log('Starting PWA icon generation...');
  
  // Generate main icons
  for (const size of iconSizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await generatePWAPNGFromSVG(size, outputPath);
  }
  
  // Generate additional icons (using 96x96 size)
  const additionalIcons = [
    'play-icon-96x96.png',
    'settings-icon-96x96.png',
    'close-icon-96x96.png'
  ];
  
  for (const iconName of additionalIcons) {
    const outputPath = path.join(iconsDir, iconName);
    await generatePWAPNGFromSVG(96, outputPath);
  }
  
  console.log('PWA icon generation complete!');
  console.log('All PNG icons have been optimized for PWA compatibility.');
}

// Run the generation
generateAllPWAIcons().catch(error => {
  console.error('Error during PWA icon generation:', error);
  process.exit(1);
}); 