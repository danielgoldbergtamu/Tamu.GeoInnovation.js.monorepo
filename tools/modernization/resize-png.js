// node resize-png.js <in.png> <out.png> <width> <height>: resample an image in a browser canvas and save it as PNG.
const fs = require('fs');
const { chromium } = require('@playwright/test');

(async () => {
  const [input, output, width, height] = process.argv.slice(2);
  const source = `data:image/png;base64,${fs.readFileSync(input).toString('base64')}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const result = await page.evaluate(
    async ({ source, width, height }) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL('image/png').split(',')[1];
    },
    { source, width: Number(width), height: Number(height) }
  );
  fs.writeFileSync(output, Buffer.from(result, 'base64'));
  console.log('wrote', output, fs.statSync(output).size, 'bytes');
  await browser.close();
})();
