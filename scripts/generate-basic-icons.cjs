const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes required by the manifest
const iconSizes = [192, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating basic solid-color PNG icons...');

// Function to generate a simple solid-color PNG
async function generateBasicPNG(size, outputPath) {
  try {
    // Create a simple solid-color image
    const image = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 135, g: 206, b: 235, alpha: 1 } // Sky blue
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log(`Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`Error creating ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

// Generate basic PNG icons
async function generateBasicIcons() {
  console.log('Starting basic icon generation...');
  
  // Generate main icons
  for (const size of iconSizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await generateBasicPNG(size, outputPath);
  }
  
  // Generate additional icons
  const additionalIcons = [
    'play-icon-96x96.png',
    'settings-icon-96x96.png',
    'close-icon-96x96.png'
  ];
  
  for (const iconName of additionalIcons) {
    const outputPath = path.join(iconsDir, iconName);
    await generateBasicPNG(96, outputPath);
  }
  
  console.log('Basic icon generation complete!');
  console.log('All icons are simple solid-color PNGs that should work with PWA.');
}

// Run the generation
generateBasicIcons().catch(error => {
  console.error('Error during basic icon generation:', error);
  process.exit(1);
}); 