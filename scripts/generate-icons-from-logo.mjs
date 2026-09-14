import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const logoPath = path.resolve(rootDir, 'public/logo.png');
const iconsDir = path.resolve(rootDir, 'public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function resizeIcons() {
  if (!fs.existsSync(logoPath)) {
    console.error('❌ public/logo.png not found!');
    process.exit(1);
  }

  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const dest = path.join(iconsDir, `icon${size}.png`);
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 100 })
      .toFile(dest);
    console.log(`✓ Generated icon${size}.png from public/logo.png`);
  }

  console.log('✅ All icons generated from your logo!');
}

resizeIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
