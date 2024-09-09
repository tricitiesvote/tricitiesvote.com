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
const saveImagePath = `static/images/candidates/`;
const imageUrlPath = `/images/candidates/`;

const fixurl = url => {
  if (url && !/^(?:f|ht)tps?:\/\//.test(url)) {
    const newUrl = `http://${url}`;
    return newUrl;
  }
  return url;
};

module.exports = async () => {
  const electionId = CONFIG.electionId;
  const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx`;
  const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=${electionId}#`;

  const dataBase = fermata.json(apiUrl)({e: electionId});
  const pamphBase = fermata.raw({base: webUrl});

  // const countyIds = ['03', '11'];
  const countyIds = [''];
  // const raceIds = CONFIG.raceIds;

  // UGLY UGLY UGLY UGLY HACK
  // They started requiring a ballotID in the URL
  // and there is not a good way to bootstrap the ballotID
  // besides going to the page of candidates and opening all of them
  // then dumping the urls in and pulling out all the ballotIDs
  const races = [
    { 
      "raceID": "162270",
      "ballotIDs": ["1577874"]
    },
    { 
      "raceID": "162271",
      "ballotIDs": ["1577875", "1577876"]
    },
    { 
      "raceID": "162286",
      "ballotIDs": ["1577665", "1577666"]
    },
    { 
      "raceID": "162287",
      "ballotIDs": ["1577658", "1577664"]
    },
    { 
      "raceID": "162288",
      "ballotIDs": ["1577672", "1577671"]
    },
    { 
      "raceID": "162291",
      "ballotIDs": ["1577771", "1577774"]
    },
    { 
      "raceID": "162292",
      "ballotIDs": ["1577766", "1577769"]
    },
    { 
      "raceID": "162293",
      "ballotIDs": ["1577765", "1577770"]
    },
    { 
      "raceID": "162127",
      "ballotIDs": ["1577533", "1577534"]
    },
    { 
      "raceID": "162128",
      "ballotIDs": ["1577528", "1577513"]
    },
    { 
      "raceID": "162374",
      "ballotIDs": ["1577659", "1577660"]
    },
    { 
      "raceID": "162375",
      "ballotIDs": ["1578052"]
    },
    { 
      "raceID": "162376",
      "ballotIDs": ["1578053"]
    },
    { 
      "raceID": "162387",
      "ballotIDs": ["1578031", "1578032"]
    },
    { 
      "raceID": "162129",
      "ballotIDs": ["1578099", "1578100"]
    }
  ]
  

  const pamphletCandidates = [];

  for (const countyId of countyIds) {
    for (const race of races) {
      let raceId = race.raceID;
      for (const ballot of race.ballotIDs) {
        const requestUrl = `${apiUrl}?e=${electionId}&r=${raceId}&b=${ballot}la=en&c=${countyId}`;
        // console.log('Requesting URL:', requestUrl);

        try {
          const data = await new Promise((resolve, reject) => {
            dataBase({r: raceId, la: 'en', c: countyId}).get(function(err, data) {
              if (err) {
                console.error('Error fetching data:', err);
                reject(err);
              } else {
                // console.log('Data fetched for raceId:', raceId, 'countyId:', countyId, 'ballotId:', ballot);
                resolve(data);
              }
            });
          });

          if (!data || data.length === 0) {
            console.warn('No data returned for raceId:', raceId, 'countyId:', countyId);
            continue;
          }

          // console.log('Fetched data:', data);

          for (const item of data) {
            // console.log('Processing item:', item);

            const statement_md = markdownify.turndown(item.statement.Statement);
            const pamphletUrl = pamphBase([
              'candidates', raceId, item.statement.BallotID
            ])();

            const thisName = asciify.foldReplacing(item.statement.BallotName);
            let name = thisName;

            if (_.find(NAMES, { altNames: [ thisName ]})) {
              name = _.find(NAMES, { altNames: [ thisName ]}).formattedName;
            }

            let imageUrl = '';
            if (item.statement.Photo) {
              const filename = slugify(name, { lower: true, strict: true });
              const buf = new Buffer.from(item.statement.Photo, 'base64');
              const newFilename = `${filename}-original.png`;
              const saveImageAs = `${saveImagePath}${newFilename}`;
              imageUrl = `${imageUrlPath}${newFilename}`;

              fs.writeFileSync(saveImageAs, buf);
              console.log('Adding photo:', newFilename);
            } else {
              console.log('No photo for:', name);
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
            // console.log('Added candidate:', candidate);
          }
        } catch (error) {
          console.error('Promise rejected:', error);
        }
      }
    }
  }

  // console.log('Pamphlet candidates:', pamphletCandidates);
  return pamphletCandidates;
};