/* eslint-disable no-restricted-syntax */
// read all the data
const _ = require('lodash');
const fs = require('fs');
const chalk = require('chalk');
const slugify = require('slugify');
const loadPamphletCandidates = require('./loadPamphletCandidates');
const loadUserCandidates = require('./loadUserCandidates');
const loadPdcCandidates = require('./loadPdcCandidates');
const NAMES = require('./load-config-names.json');
const CONFIG = require('./load-config-election.json');

// get the data

const main = () => {
  const loadData = [
    loadPamphletCandidates(),
    loadUserCandidates(),
    loadPdcCandidates(),
  ];

  const candidates = [];

  Promise.all(loadData).then(values => {
    const [guideCs, userCs, pdcCs] = values;

    const mergeCandidate = new Promise((resolve, reject) => {
      // iterate through guide candidates
      for (const guideC of guideCs) {
        const name = guideC.candidate_ballot_name;
        
        const configDetails = (
          // copy-pasta of new loadLetter `findCandidateViaName`…
          _.find(NAMES, { formattedName: name }) ||
          _.find(NAMES, { altNames: [ name ]})
        );
        
        const candidate = {
          name: guideC.candidate_ballot_name,
          slug: slugify(guideC.candidate_ballot_name, {
            lower: true,
            strict: true,
          }),
          email: guideC.email,
          pamphlet_url: guideC.pamphlet_url,
        };

        // if candidate is in the user set
        if (_.findKey(userCs, { name })) {
          // console.log('✅', `User data match for ${name} `);
          const c = _.findKey(userCs, { name });
          candidate.image = userCs[c].image;
          candidate.pdc_url = userCs[c].pdc_url;
          candidate.uuid = userCs[c].uuid;
          candidate.party = userCs[c].party;
          candidate.statement = userCs[c].statement;
          candidate.electionyear = userCs[c].electionyear;
          candidate.office = userCs[c].office;
          candidate.articles = userCs[c].articles;
          candidate.bio = userCs[c].bio;
          candidate.engagement = userCs[c].engagement;
          candidate.hide = userCs[c].hide;
          candidate.incumbent = userCs[c].incumbent;
          candidate.instagram = userCs[c].instagram;
          candidate.lettersyes = userCs[c].lettersyes;
          candidate.lettersno = userCs[c].lettersno;
          candidate.facebook = userCs[c].facebook;
          candidate.twitter = userCs[c].twitter;
          candidate.youtube = userCs[c].youtube;
          candidate.website = userCs[c].website;
          candidate.office = userCs[c].office;
          // console.log(candidate);
        }

        // handle candidates not in user set
        if (!_.findKey(userCs, { name })) {
          // console.log('❌', `No user data for ${name} `);
          const c = _.findKey(userCs, { name });

          candidate.image = guideC.image;
          candidate.statement = guideC.statement;
          candidate.website = guideC.website;

          // find candidates in PDC set to flesh out details
          if (_.findKey(pdcCs, { candidate_fullname: name })) {
            console.log('➕', `Adding data for ${name}`);
            const p = _.findKey(pdcCs, { candidate_fullname: name });

            candidate.pdc_url = pdcCs[p].pdc_url;
            candidate.uuid = pdcCs[p].candidate_filer_id;
            candidate.party = pdcCs[p].party;
            candidate.electionyear = pdcCs[p].election_year;
            candidate.office = pdcCs[p].office;
          }

          // handle candidates not in PDC set
          if (!_.findKey(pdcCs, { candidate_fullname: name })) {
            // console.log('candidate_fullname', name, 'not found');
            console.warn(
              chalk.red('⛔️', name, '— Add uuid or alt name to load-config-names.json')
            );
            candidate.pdc_url = '';
            candidate.uuid = '';
            candidate.party = '';
            candidate.electionyear = CONFIG.year;
            candidate.office = '';
          }
        }
        
        // make sure has a UUID even if stuff above hasn't worked out
        // TODO: this should probably get integrated more holistically?
        if (!candidate.uuid) {
          if (configDetails) {
            candidate.uuid = configDetails.pdcId;
          } else {
            console.warn('🧨', `${name} has no UUID, nor entry in load-config-names!`);
          }
        }
        candidates.push(candidate);
      }
      resolve(candidates);
    });

    // write candidate files
    mergeCandidate.then(candidates => {
      for (const item of candidates) {
        if (!item.slug) {
          // likely means that formattedName still blank in load-config-names…
          console.warn('🚩', "Empty slug (/name) for candidate:", item);
        }
        
        const candidateData = JSON.stringify(item, null, 2);
        // const filePath = `data/candidates-new/${item.electionyear}-${item.slug}.json`;
        const filePath = `data/candidates/${item.electionyear}-${item.slug}.json`;
        console.log(chalk.green('💾', filePath));
        fs.writeFileSync(filePath, candidateData);
      }
    });
  });
};

main();
