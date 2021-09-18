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

  const electionId = '871'; // 2021 general

  const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx?e=`;
  const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=`;

  const bentonRaceIds = [
    // these ids have to be changed every primary/general election
    66322, // Kennewick Council 1
    66323, // Kennewick Council 2
    66324, // Kennewick Council 3
    66308, // Kennewick Council 4
    66314, // Richland Council 1
    66313, // Richland Council 2
    66315, // Richland Council 3
    66316, // Richland Council 4
    66312, // Richland Council 7
    66318, // West Richland Council 1
    66317, // West Richland Council 2
    66321, // West Richland Council 3
    66319, // West Richland Council 4
    66320, // West Richland Mayor
    68357, // Kennewick Schools 1
    68358, // Kennewick Schools 2
    68367, // Richland Schools 1
    68366, // Richland Schools 2
    68368, // Richland Schools 3
  ];

  const franklinRaceIds = [
    // these ids have to be changed every primary/general election
    66435, // Pasco Council 1
    66436, // Pasco Council 3
    66437, // Pasco Council 4
    66438, // Pasco Council 6
    68476, // Pasco School Director 3
    68478, // Pasco School Director 4
    68477, // Pasco School Director 5 
  ];

  const countyIds = ['03', '11'];
  const raceIds = [bentonRaceIds, franklinRaceIds];

  const pamphletCandidates = [];

  raceIds.forEach(function(county, i) {
    for (const raceId of county) {
      const raceUrl = `${apiUrl + electionId}&r=${raceId}&la=&c=${
        countyIds[i]
      }`;
      // console.log('raceUrl', raceUrl);
      const site = fermata.json(raceUrl);

      site.get(function(err, data) {
        // console.log(data);

        for (const item of data) {
          const statement_md = markdownify.turndown(item.statement.Statement);
          const pamphletUrl = `${webUrl + electionId}#/candidates/${raceId}/${
            item.statement.BallotID
          }`;
          let name = asciify.foldReplacing(item.statement.BallotName);
          if (name === "CHAUNE' FITZGERALD") name = 'Chauné Fitzgerald';
          if (name === "BRENT GERRY") name = 'Brent Gerry';
          if (name === 'Jhoanna R. Jones') name = 'Jhoanna Jones';
          if (name === 'Amy Freeman Phillips') name = 'Amy Phillips';
          if (name === 'John H. Trumbo') name = 'John Trumbo';
          if (name === 'MIKE LUZZO') name = 'Mike Luzzo';
          if (name === 'THERESA RICHARDSON') name = 'Theresa Richardson';
          if (name === 'Leo A. Perales') name = 'Leo Perales';
          if (name === 'Steven X Martinez') name = 'Steven Martinez';
          if (name === 'Irving L. Brown Sr.') name = 'Irving Brown, Sr.';
          if (name === 'LOREN ANDERSON') name = 'Loren Anderson';
          if (name === 'Scott E. Rodgers') name = 'Scott Rodgers';
          if (name === 'UBY CREEK') name = 'Uby Creek';
          let photo = `data:image/png;base64,${item.statement.Photo}`
          // console.log('photo for', name, photo);

          // Get images base64, convert to file, save it
          let imageUrl = '';
          if (item.statement.Photo) {
            const filename = slugify(name, { lower: true, strict: true });
            const buf = new Buffer.from(item.statement.Photo, 'base64');
            const newFilename = `${filename}-original.png`;
            const saveImageAs = `${saveImagePath}${newFilename}`;
            imageUrl = `${imageUrlPath}${newFilename}`;
            
            // TODO: re-enable photo write
            // fs.writeFileSync(saveImageAs, buf);
            // console.log('🌠', 'Adding photo', `${newFilename}`);
          } else {
            console.log('❌', `No photo for ${name}`);
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
          console.log(
            '➕',
            '',
            `${candidate.candidate_ballot_name} candidate data`
          );
        }
        if (err) {
          console.log(err);
        }
      });
    }
  });

  return pamphletCandidates;
};
