/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const fermata = require('fermata');
const Turndown = require('turndown');
const _ = require('lodash');
const asciify = require('fold-to-ascii');

const markdownify = new Turndown();
// const saveImagePath = `./static/images/candidates/${filename}-original.png`,
const saveImagePath = `./output/candidate-`;
const imageUrlPath = `/images/candidates/candidate-`;

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
  // https://voter.votewa.gov/elections/candidate.ashx?e={{election_id}}&r={{race_id}}&la=&c=

  const electionId = '866';

  const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx?e=`;
  const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=`;

  const raceIds = [
    60376, // Dist 16 senator
    60378, // Dist 16 rep 1
    60377, // Dist 16 rep 2
    60476, // Dist 8 rep 1
    60477, // Dist 8 rep 2
    60479, // Dist 9 rep 1
    60210, // Franklin Comm 1
    60211, // Franklin Comm 2
    60197, // Benton Comm 1
    60198, // Benton Comm 3
    60303, // Ben-Frnk Judge 1
    60262, // US House of Reps
  ];

  const pamphletCandidates = [];

  for (const raceId of raceIds) {
    const raceUrl = `${apiUrl + electionId}&r=${raceId}&la=&c=`;
    const site = fermata.json(raceUrl);

    site.get(function(err, data) {
      // console.log(data)

      for (const item of data) {
        const statement_md = markdownify.turndown(item.statement.Statement);
        const pamphletUrl = `${webUrl + electionId}#\/candidates\/${raceId}\/${
          item.statement.BallotID
        }`;
        // let photo = `data:image/png;base64,${item.statement.Photo}`

        // Get images base64, convert to file, save it
        const filename = _.kebabCase(item.statement.BallotName);
        const buf = new Buffer.from(item.statement.Photo, 'base64');
        const newFilename = `${filename}-original.png`;
        const imageUrl = `${imageUrlPath}-${newFilename}`;
        const saveImageAs = `${saveImagePath}-${newFilename}`;
        fs.writeFileSync(saveImageAs, buf);
        // console.log(`🌠 ${imageUrl}`);

        const candidate = {
          candidate_ballot_id: item.statement.BallotID,
          candidate_ballot_name: asciify.foldReplacing(
            item.statement.BallotName
          ),
          email: item.statement.OrgEmail,
          website: fixurl(item.statement.OrgWebsite),
          statement: statement_md,
          pamphlet_url: pamphletUrl,
          image: imageUrl,
        };
        pamphletCandidates.push(candidate);
        // console.log(candidate.candidate_ballot_name)
      };
    });
  };

  return pamphletCandidates;
};
