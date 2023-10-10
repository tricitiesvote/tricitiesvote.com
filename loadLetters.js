const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

var timeOutLength = 15000;

async function scrapeTriCityHeraldUrls(timeOutLength) {
    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    // Intercept the 'Set-Cookie' header on responses
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        req.continue();
    });
    page.on('response', async (response) => {
        const headers = response.headers();
        delete headers['set-cookie'];
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537');
    await page.goto(
      'https://tri-cityherald.com/opinion/letters-to-the-editor/',
      {
        waitUntil: 'networkidle2',
        timeout: 0,
        ignoreHTTPSErrors: true,
      }
    );
    console.log("Navigating to:", 'https://tri-cityherald.com/opinion/letters-to-the-editor/')

    const extractedUrls = await page.evaluate((timeOutLength) => {
      console.log("Evaluating...");
      return new Promise(resolve => {
          const currentYear = new Date().getFullYear();
          const targetDate = new Date(currentYear, 4, 1);  // 4 represents May (0-indexed)
          console.log("Loading all letters to the editor after", targetDate)
          
          function parseDate(str) {
              console.log("Parsing date:", str);
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              let cleanStr = str.replace('UPDATED', '').trim();
              let [monthStr, day, yearPart] = cleanStr.match(/([a-zA-Z]+) (\d+), (\d+)/).slice(1);
              const monthIndex = months.findIndex(month => month.toLowerCase() === monthStr.toLowerCase());
              const year = parseInt(yearPart, 10);
              const dayNum = parseInt(day, 10);
              return new Date(year, monthIndex, dayNum);
          }
        
          function extractURLs() {
              console.log("Extracting URLs...");
              return Array.from(document.querySelectorAll('a[href^="https://www.tri-cityherald.com/opinion/letters-to-the-editor/article"]'))
                .map(a => a.href.split('#')[0].split('?')[0]);
          }

          function loadMoreUntilDate() {
              console.log("Loading more until date...");
              const initialCount = document.querySelectorAll('.time').length;
              try {
                  document.getElementsByClassName("load-more")[0].children[0].click();
                  console.log("Clicked load more...");
              } catch (e) {
                  return resolve('Error loading more data.');
              }

              setTimeout(() => {
                  const newCount = document.querySelectorAll('.time').length;
                  if (newCount <= initialCount) {
                      return resolve(extractURLs());
                  }

                  const newDates = Array.from(document.querySelectorAll('.time')).slice(initialCount).map(div => parseDate(div.innerText.trim()));
                  if (newDates.some(date => date < targetDate)) {
                      console.log("Reached target date.")
                      console.log("Extracting URLs...")
                      console.log(extractURLs());
                      return resolve(extractURLs());
                  } else {
                      loadMoreUntilDate();
                  }
              }, timeOutLength);
          }

          loadMoreUntilDate();
      });
  });
  // await page.close();
  // await browser.close();
  // console.log("Extracted URLs:", extractedUrls);
  return extractedUrls;
}

const extractLettersFromPage = async (page) => {
    return await page.evaluate(() => {
        const letters = [];
        const h3Elements = document.querySelectorAll('h3');
  
        h3Elements.forEach((h3, index) => {
            const content = [];
            const author = h3.innerText.trim();
  
            let node = h3.nextElementSibling;
            while (node && (node.tagName !== 'H3' || index === h3Elements.length - 1 && node.tagName !== 'DIV')) {
                if (node.tagName === 'P' && 
                    !node.querySelector('div') && 
                    node.innerText.trim() !== '' && 
                    !node.innerText.includes("Send letters to letters@tricityherald.com.") && 
                    !node.innerText.includes("Ballots for the Nov.") && 
                    !node.innerText.includes("to be considered for publication")) {
                    content.push(node.innerText);
                }
                node = node.nextElementSibling;
            }
  
            if (content.length) {
                letters.push({ author, content: content.join('\n') });
            }
        });
  
        return letters;
    });
  };
  
  const filterLetterByCandidateName = (letter, candidates) => {
      return candidates.filter(candidate => letter.content.includes(candidate.lastName));
  };

const handleRequest = (req) => {
    req.continue();
};

const handleResponse = async (response) => {
    const headers = response.headers();
    delete headers['set-cookie'];
};


(async () => {
    // Load candidate data
    const candidates = JSON.parse(fs.readFileSync('load-config-names.json', 'utf-8'));
    const letterURLs = await scrapeTriCityHeraldUrls(timeOutLength);

    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    const results = [];

    for (const url of letterURLs) {
        let delay = Math.floor(Math.random() * (20000 - 15000 + 1)) + 15000;  // Delay for 15-20 seconds
        console.log(`Waiting for ${delay / 1000} seconds before fetching the next page...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log("Loading URL:", url);
        try {
            // Intercept the 'Set-Cookie' header on responses
            await page.setRequestInterception(true);
            page.on('request', handleRequest);
            page.on('response', handleResponse);

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537');
            await page.goto(
                url,
                {
                    waitUntil: 'networkidle2',
                    timeout: 60000,
                    ignoreHTTPSErrors: true,
                }
            );

            const letters = await extractLettersFromPage(page);

            for (const letterObj of letters) {
                const candidateNames = candidates.map(c => c.formattedName);
                for (const candidateName of candidateNames) {
                    if (letterObj.content.includes(candidateName)) {
                        results.push({
                            candidate: candidateName,
                            author: letterObj.author,  // Extracted from the object
                            forOrAgainst: "",  // This is left blank as per your instruction
                            content: letterObj.content
                        });
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to navigate to ${url} due to ${error.message}`);
        }

        page.removeListener('request', handleRequest);
        page.removeListener('response', handleResponse);
    }

    fs.writeFileSync('letters.csv', 'candidate,author,forOrAgainst,content\n');
    for (const result of results) {
        fs.appendFileSync('letters.csv', `${result.candidate},${result.author},${result.forOrAgainst},"${result.content.replace(/"/g, '""')}"\n`);  // Escaping double quotes in content
    }

    // await page.close();
    // await browser.close();
})();