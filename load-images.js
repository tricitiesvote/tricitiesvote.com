const fs = require('fs');
const fermata = require('fermata');
const _ = require('lodash');

const electionId = '865';

// https://voter.votewa.gov/elections/candidate.ashx?e=865&r=57373&la=&c=

const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx?e=`

const raceIds = [
  57346, // Dist 16 senator
  57252, // Dist 16 rep 1
  57300, // Dist 16 rep 2
  57291, // Dist 8 rep 1
  57339, // Dist 8 rep 2
  57365, // Dist 9 senator
  57292, // Dist 9 rep 1
  57340, // Dist 9 rep 2
  27186, // Benton Comm 1
  27187, // Benton Comm 3
  29027, // Franklin Comm 1
  29028, // Franklin Comm 2
  57064  // Ben-Frnk Judge 1
]

const candidates = []

raceIds.forEach((raceId, index) => {

  const raceUrl = apiUrl + electionId + `&r=` + raceId + `&la=&c=`;
  const site = fermata.json(raceUrl);

  site.get(function (err, data) {

    data.forEach((item, index) => {
      let filename = _.kebabCase(item.statement.BallotName);
      let buf = new Buffer(item.statement.Photo, 'base64');
      fs.writeFileSync(`./static/images/candidates/${filename}-original.png`, buf);
    })

  });
})
