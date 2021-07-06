/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const fermata = require('fermata');
const Turndown = require('turndown');
const _ = require('lodash');
const slugify = require('slugify');
const asciify = require('fold-to-ascii');

const markdownify = new Turndown();
// const saveImagePath = `./static/images/candidates/${filename}-original.png`,
const saveImagePath = `static/images/candidates/`;
const imageUrlPath = `/images/candidates/`;

// check that urls are properly formatted
const fixurl = url => {
  if (url && !/^(?:f|ht)tps?:\/\//.test(url)) {
    const newUrl = `http://${url}`;
    return newUrl;
  }
  return url;
};

module.exports = () => {
  // https://voter.votewa.gov/elections/candidate.ashx?e=865&r=57373&la=&c=
  // https://voter.votewa.gov/elections/candidate.ashx?e=870&r=61241&la=&c=03
  // https://voter.votewa.gov/elections/candidate.ashx?e={{election_id}}&r={{race_id}}&la=&c=

  const electionId = '870';

  const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx?e=`;
  const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=`;

  const bentonRaceIds = [
    61241, // Kenn council 1
    61243, // Kenn council 3
    61244, // Kenn council 4
    61248, // Rich council 1
    61249, // Rich council 2
    61271, // Kenn schools 1
    61272, // Kenn schools 2
    61278, // Rich schools 1
  ];

  const franklinRaceIds = [
    63782, // Pasco schools 5
    63786, // Pasco council 3
  ];

  const countyIds = ['03', '11'];
  const raceIds = [bentonRaceIds, franklinRaceIds];

  const pamphletCandidates = [];

  raceIds.forEach(function(county, i) {
    for (const raceId of county) {
      const raceUrl = `${apiUrl + electionId}&r=${raceId}&la=&c=${
        countyIds[i]
      }`;
      console.log('raceUrl', raceUrl);
      const site = fermata.json(raceUrl);

      site.get(function(err, data) {
        // console.log(data);

        for (const item of data) {
          const statement_md = markdownify.turndown(item.statement.Statement);
          const pamphletUrl = `${webUrl +
            electionId}#\/candidates\/${raceId}\/${item.statement.BallotID}`;
          const name = asciify.foldReplacing(item.statement.BallotName);
          // if (name === "Douglas E. McKinley") name = "Doug McKinley"
          // let photo = `data:image/png;base64,${item.statement.Photo}`
          // console.log('photo', item.statement.Photo);

          // Get images base64, convert to file, save it
          let imageUrl = '';
          if (item.statement.Photo) {
            const filename = slugify(name, { lower: true, strict: true });
            const buf = new Buffer.from(item.statement.Photo, 'base64');
            const newFilename = `${filename}-original.png`;
            const saveImageAs = `${saveImagePath}${newFilename}`;
            imageUrl = `${imageUrlPath}${newFilename}`;
            fs.writeFileSync(saveImageAs, buf);
            console.log(`🌠 ${saveImagePath}${newFilename}`);
          }

          const candidate = {
            candidate_ballot_id: item.statement.BallotID,
            candidate_ballot_name: name,
            email: item.statement.OrgEmail,
            website: fixurl(item.statement.OrgWebsite),
            statement: statement_md,
            pamphlet_url: pamphletUrl,
            image: imageUrl,
          };
          pamphletCandidates.push(candidate);
          console.log(candidate.candidate_ballot_name);
        }
        if (err) {
          console.log(err);
        }
      });
    }
  });

  return pamphletCandidates;
};
