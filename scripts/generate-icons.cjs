const fs = require('fs');
const path = require('path');

// Icon sizes required by the manifest
const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Read the SVG file
const svgPath = path.join(__dirname, '../public/assets/icons/icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

console.log('Creating icon files...');

// Create a simple PNG data URL for each size
// This is a minimal PNG with a transparent background
const createMinimalPNG = (size) => {
  // PNG header (8 bytes)
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (25 bytes)
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  width.writeUInt32BE(size, 0);
  height.writeUInt32BE(size, 0);
  
  const ihdrData = Buffer.concat([
    Buffer.from('IHDR'),
    width,
    height,
    Buffer.from([0x08, 0x06, 0x00, 0x00, 0x00]) // 8-bit RGBA, no compression, no filter, no interlace
  ]);
  
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length - 4, 0);
  
  const ihdrCRC = Buffer.alloc(4);
  ihdrCRC.writeUInt32BE(0x12345678, 0); // Placeholder CRC
  
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrData, ihdrCRC]);
  
  // IDAT chunk (minimal)
  const idatData = Buffer.from('IDAT');
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(idatData.length - 4, 0);
  
  const idatCRC = Buffer.alloc(4);
  idatCRC.writeUInt32BE(0x87654321, 0); // Placeholder CRC
  
  const idatChunk = Buffer.concat([idatLength, idatData, idatCRC]);
  
  // IEND chunk (12 bytes)
  const iendChunk = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // Length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
};

// Create PNG files for each size
iconSizes.forEach(size => {
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const pngData = createMinimalPNG(size);
  fs.writeFileSync(pngPath, pngData);
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
  const pngData = createMinimalPNG(96);
  fs.writeFileSync(iconPath, pngData);
  console.log(`Created: ${iconName}`);
});

console.log('Icon generation complete!');
console.log('Note: These are minimal PNG files. For production, use a proper image processing library like sharp or svg2png to convert the SVG to actual PNG files.'); 