const request = require('request');
const cheerio = require('cheerio');

request('https://voter.votewa.gov/genericvoterguide.aspx?e=865#/candidates/57373/66947', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    console.log(html);
  }
});