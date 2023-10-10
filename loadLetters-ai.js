const puppeteer = require('puppeteer');
const fs = require('fs');
const OpenAIApi = require('openai');
require('dotenv').config();

// Setting up the OpenAI client
const openai = new OpenAIApi({
    key: process.env.OPENAI_API_KEY
});

var timeOutLength = 15000;

async function scrapeTriCityHeraldUrls(timeOutLength) {
    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
    const page = await browser.newPage();
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
              letters.push(content.join('\n'));
          }
      });

      return letters;
  });
};




const analyzeLetterWithOpenAI = async (letterContent, candidates) => {
    const candidateNames = candidates.map(c => c.formattedName);
    const candidateList = candidateNames.join(', ');

    const promptText = `
        Here's a list of candidate names: ${candidateList}. 
        If the letter is one of support or opposition to a candidate with one of these candidates' last names 
        (and likely first name or seems similar enough), extract the sentiment, rationale, and the author's name 
        from the following letter: "${letterContent}" and provide the answer as a valid json object in this conceptual format: 
        {"candidate": <CANDIDATE NAME>, "author": <NAME OF AUTHOR>, "forOrAgainst": <EITHER "for" or "against" HERE>, "rationale": <RATIONALE - 120 CHARACTER MAX>. } 
        If the letter does not meet this criteria, return an empty json object.
        If the letter is about multiple candidates, return a json object for each candidate.
        Your answer will be used directly by an API, so in all cases your reply should not include anything except for the resulting JSON object.
        This is important! In ALL cases, your answer should ONLY include JSON and nothing else.
    `;

    console.log("Letter:\n", letterContent, '\n\n')

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: promptText.trim() }],
      model: 'gpt-4',
    });

    // console.log("Response message:", JSON.stringify(response, null, 2));

    try {
        // Attempt to parse the response content
        const parsedContent = JSON.parse(response.choices[0].message.content);
    
        // Check if the parsed content is an empty object
        if (Object.keys(parsedContent).length === 0) {
            return {};
        } else {
            return parsedContent;
        }
    } catch (error) {
        // If there's a parsing error, log the response content and return false
        console.error("Failed to parse JSON:", response.choices[0].message.content);
        return false;
    }
    
};

(async () => {
    // Load candidate data
    const candidates = JSON.parse(fs.readFileSync('load-config-names.json', 'utf-8'));
    const letterURLs = await scrapeTriCityHeraldUrls();
    // console.log("Letter URLs:", letterURLs)

    const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    const results = [];

    for (const url of letterURLs) {
        console.log("Loading URL:", url);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537');
        try {
          await page.goto(
            url,
            {
              waitUntil: 'networkidle2',
              timeout: 60000,
              ignoreHTTPSErrors: true,
            }
          );
          const letters = await extractLettersFromPage(page);

          for (const letter of letters) {
            const analysis = await analyzeLetterWithOpenAI(letter, candidates);
            if (analysis === false) {
                console.log("Failed to parse letter:", letter);
                continue;
            } else {
              console.log("Analysis:", analysis);
              results.push(analysis);
            }
        }

        } catch (error) {
            console.error(`Failed to navigate to ${url} due to ${error.message}`);
        }
        
    }

    fs.writeFileSync('letters.csv', 'candidate,author,forOrAgainst,rationale\n');
    for (const result of results) {
        console.log("Writing:", result);
        fs.appendFileSync('letters.csv', `${result.candidate},${result.author},${result.forOrAgainst},${result.rationale}\n`);
    }
    // await page.close();
    // await browser.close();
})();