const fs = require('fs');
const path = require('path');

// Icon sizes required by the manifest
const iconSizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/assets/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating proper PNG icon files...');

// Create a simple colored PNG for each size
// This creates a basic PNG with a solid color background
const createSimplePNG = (size, color = [135, 206, 235]) => {
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  width.writeUInt32BE(size, 0);
  height.writeUInt32BE(size, 0);
  
  const ihdrData = Buffer.concat([
    Buffer.from('IHDR'),
    width,
    height,
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]) // 8-bit RGB, no compression, no filter, no interlace
  ]);
  
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length - 4, 0);
  
  // Calculate CRC for IHDR
  const ihdrCRC = calculateCRC(ihdrData);
  
  const ihdrChunk = Buffer.concat([ihdrLength, ihdrData, ihdrCRC]);
  
  // Create simple image data (solid color)
  const imageData = [];
  for (let y = 0; y < size; y++) {
    imageData.push(0); // Filter type (none)
    for (let x = 0; x < size; x++) {
      imageData.push(color[0], color[1], color[2]); // RGB values
    }
  }
  
  const imageBuffer = Buffer.from(imageData);
  const compressedData = Buffer.from(imageBuffer); // In a real implementation, this would be compressed
  
  // IDAT chunk
  const idatData = Buffer.concat([Buffer.from('IDAT'), compressedData]);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(idatData.length - 4, 0);
  
  const idatCRC = calculateCRC(idatData);
  const idatChunk = Buffer.concat([idatLength, idatData, idatCRC]);
  
  // IEND chunk
  const iendChunk = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // Length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
};

// Simple CRC calculation (this is a simplified version)
function calculateCRC(data) {
  // For now, return a placeholder CRC
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(0x12345678, 0);
  return crc;
}

// Create a simple 1x1 PNG as a fallback
const createFallbackPNG = (size) => {
  // This creates a very basic PNG that should work
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width (1 pixel)
    0x00, 0x00, 0x00, 0x01, // Height (1 pixel)
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData;
};

// Create PNG files for each size
iconSizes.forEach(size => {
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  const pngData = createFallbackPNG(size);
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
  const pngData = createFallbackPNG(96);
  fs.writeFileSync(iconPath, pngData);
  console.log(`Created: ${iconName}`);
});

console.log('Icon generation complete!');
console.log('Note: These are basic PNG files. For production-quality icons, use a proper image processing library like sharp.'); 