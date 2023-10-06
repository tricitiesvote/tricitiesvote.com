/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const fermata = require('fermata');
const Turndown = require('turndown');
const _ = require('lodash');
const slugify = require('slugify');
const asciify = require('fold-to-ascii');
const NAMES = require('./load-config-names.json');
const CONFIG = require('./load-config-election.json');

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

  const electionId = CONFIG.electionId;

  const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx`;
  const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=${electionId}#`;

  const dataBase = fermata.json(apiUrl)({e:electionId});
  const pamphBase = fermata.raw({base:webUrl});

  const countyIds = ['03', '11'];
  const raceIds = CONFIG.raceIds;

  const pamphletCandidates = [];

  countyIds.forEach(function(countyId) {
    raceIds.forEach(function(raceId) {
      dataBase({r:raceId, la:'', c:countyId}).get(function(err, data) {

        for (const item of data) {
          const statement_md = markdownify.turndown(item.statement.Statement);
          const pamphletUrl = pamphBase([
            'candidates', raceId, item.statement.BallotID
          ])();

          const thisName = asciify.foldReplacing(item.statement.BallotName);
          let name = thisName
          
          // if the name used in the ballot data matches an alternate name, use that
          if (_.find(NAMES, { altNames: [ thisName ]})) {
            name = _.find(NAMES, { altNames: [ thisName ]}).formattedName
          }
      
          let photo = `data:image/png;base64,${item.statement.Photo}`
      
          // Get images base64, convert to file, save it
          let imageUrl = '';
          if (item.statement.Photo) {
            const filename = slugify(name, { lower: true, strict: true });
            const buf = new Buffer.from(item.statement.Photo, 'base64');
            const newFilename = `${filename}-original.png`;
            const saveImageAs = `${saveImagePath}${newFilename}`;
            imageUrl = `${imageUrlPath}${newFilename}`;
            
            // TODO: re-enable photo write
            // TODO: why did I have to re-enable this?
            fs.writeFileSync(saveImageAs, buf);
            console.log('🌠', 'Adding photo', `${newFilename}`);
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
            '✏️',
            `${candidate.candidate_ballot_name} candidate data`
          );
        }
        if (err) {
          console.log(err);
        }
      })
    })
  });

  return pamphletCandidates;
};
