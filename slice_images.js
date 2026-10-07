const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputImg = 'C:\\Users\\khush\\.gemini\\antigravity-ide\\brain\\689acc39-7072-436d-a581-09afcd74c1a4\\.user_uploaded\\media_1790755661649.jpg';
const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function cropImages() {
  const metadata = await sharp(inputImg).metadata();
  console.log(`Original Image dimensions: ${metadata.width}x${metadata.height}`);
  const W = metadata.width;
  const H = metadata.height;

  // Let's copy the full image as hero_banner.jpg first
  await sharp(inputImg).toFile(path.join(assetsDir, 'hero_banner.jpg'));

  // Hero section main slice (excluding header)
  // Header height is approx 5% of height (y = 0 to ~50px out of 1000px)
  // Hero section is from top below navbar down to above bottom category grid
  // In coordinates (assuming ~1000x670 image):
  // Let's crop exact bounding boxes based on relative percentages!

  // 1. Thumbnails Carousel row is around y = 64% to 75%
  // 6 Thumbnails side by side from x = 2% to 71%
  const thumbY = Math.round(H * 0.638);
  const thumbH = Math.round(H * 0.106);
  const thumbW = Math.round(W * 0.114);
  const thumbGap = Math.round(W * 0.003);
  const thumbStartX = Math.round(W * 0.021);

  for (let i = 0; i < 6; i++) {
    const cropX = Math.round(thumbStartX + i * (thumbW + thumbGap));
    await sharp(inputImg)
      .extract({ left: cropX, top: thumbY, width: thumbW, height: thumbH })
      .toFile(path.join(assetsDir, `thumb_${i + 1}.jpg`));
    console.log(`Saved thumb_${i + 1}.jpg`);
  }

  // 2. Category grid row (6 items at the bottom)
  // y = 78% to 95%
  const catY = Math.round(H * 0.78);
  const catH = Math.round(H * 0.17);
  const catW = Math.round(W * 0.155);
  const catGap = Math.round(W * 0.008);
  const catStartX = Math.round(W * 0.021);

  for (let i = 0; i < 6; i++) {
    const cropX = Math.round(catStartX + i * (catW + catGap));
    await sharp(inputImg)
      .extract({ left: cropX, top: catY, width: catW, height: catH })
      .toFile(path.join(assetsDir, `cat_${i + 1}.jpg`));
    console.log(`Saved cat_${i + 1}.jpg`);
  }

  console.log('All crops completed successfully!');
}

cropImages().catch(err => console.error(err));
