import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
  72, 96, 128, 144, 152, 192, 384, 512, 1024,
  // iOS spezifische Größen
  180, 167
];

const inputSvg = join(__dirname, '../public/icon-512x512.svg');
const outputDir = join(__dirname, '../public');

async function generateIcons() {
  try {
    const svgBuffer = readFileSync(inputSvg);
    
    console.log('Generiere PNG-Icons...');
    
    for (const size of sizes) {
      const outputPath = join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Erstellt: icon-${size}x${size}.png`);
    }
    
    console.log('\n✅ Alle Icons erfolgreich generiert!');
  } catch (error) {
    console.error('Fehler beim Generieren der Icons:', error);
    process.exit(1);
  }
}

generateIcons();

