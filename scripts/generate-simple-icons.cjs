const fs = require('fs');
const path = require('path');

// Icon sizes required by the manifest
const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating simple PNG icon files...');

// This is a base64-encoded 1x1 blue PNG
const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Convert base64 to buffer
const pngBuffer = Buffer.from(base64PNG, 'base64');

// Create PNG files for each size
iconSizes.forEach(size => {
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Created: icon-${size}x${size}.png`);
});

// Create additional icons mentioned in the manifest
const additionalIcons = [
  'play-icon-96x96.png',
  'settings-icon-96x96.png',
  'close-icon-96x96.png'
];

additionalIcons.forEach(iconName => {
  const iconPath = path.join(iconsDir, iconName);
  fs.writeFileSync(iconPath, pngBuffer);
  console.log(`Created: ${iconName}`);
});

console.log('Icon generation complete!');
console.log('Note: These are simple 1x1 blue PNG files. For production-quality icons, use a proper image processing library like sharp.'); 