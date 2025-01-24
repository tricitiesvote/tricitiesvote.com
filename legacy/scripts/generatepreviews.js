const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const dataDir = 'data/races';
const imageDir = 'static/images';

// Get list of JSON files
const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

// Extract slugs from filenames
const slugs = jsonFiles.map(file => file.slice(5, -5));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' }); // set headless mode to false

  for (const slug of slugs) {
    const page = await browser.newPage();
    // Set the viewport to emulate a high-density (Retina) display
    await page.setViewport({ width: 565, height: 333, deviceScaleFactor: 2 });

    try {
      await page.goto(`http://localhost:8000/${slug}/preview`, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Wait for 5 seconds
      await page.waitForTimeout(5000);

      const element = await page.$('body'); // assuming the element to screenshot is body
      const screenshot = await element.screenshot({
        path: path.join(imageDir, `${slug}.png`),
        clip: {
          x: 0,
          y: 0,
          width: 565,
          height: 333
        }
      });
    } catch (error) {
      console.log(`Failed to load: http://localhost:8000/${slug}/preview`);
    } finally {
      await page.close(); // close the page to free up resources
    }
  }

  await browser.close();
})();