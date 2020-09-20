/* eslint-disable no-restricted-syntax */
// read all the data
const _ = require('lodash');
const chalk = require('chalk');
const loadPamphletCandidates = require('./loadPamphletCandidates');
const loadUserCandidates = require('./loadUserCandidates');
const loadPdcCandidates = require('./loadPdcCandidates');

// get the data

const main = () => {
  const loadData = [
    loadPamphletCandidates(),
    loadUserCandidates(),
    loadPdcCandidates,
  ];
  
  const candidates = [];

  Promise.all(loadData).then(values => {
    
    const [guideCs, userCs, pdcCs] = values;

    // iterate through guide candidates
    for (const guideC of guideCs) {
      const name = guideC.candidate_ballot_name;
      const candidate = {};
      
      // if candidate is in the user set
      if (_.findKey(userCs, { name })) {
        const c = _.findKey(userCs, { name });
        
        candidate.name =          guideC.candidate_ballot_name;
        candidate.slug =          _.kebabCase(candidate.cName);
        candidate.website =       guideC.website;
        candidate.email =         guideC.email;
        candidate.pamphlet_url =  guideC.pamphlet_url;
        candidate.image =         userCs[c].pamphlet_url;
        candidate.pdc_url =       userCs[c].pdc_url;
        candidate.uuid =          userCs[c].uuid;
        candidate.party =         userCs[c].party;
        candidate.statement =     userCs[c].statement;
        candidate.office =        userCs[c].office;
      }
      
      // handle candidates not in user set
      if (!_.findKey(userCs, { name })) {
        const c = _.findKey(userCs, { name });
        
        candidate.name =          guideC.candidate_ballot_name;
        candidate.slug =          _.kebabCase(candidate.cName);
        candidate.website =       guideC.website;
        candidate.email =         guideC.email;
        candidate.pamphlet_url =  guideC.pamphlet_url;
        candidate.image =         guideC.image;
        candidate.statement =     guideC.statement;
        
        // find candidates in PDC set to flesh out details
        if (_.findKey(pdcCs, { candidate_fullname: name })) {
          const p = _.findKey(pdcCs, { candidate_fullname: name });
          
          candidate.pdc_url =       pdcCs[p].pdc_url;
          candidate.uuid =          pdcCs[p].candidate_filer_id;
          candidate.party =         pdcCs[p].party;
          candidate.electionyear =  pdcCs[p].election_year;
          candidate.office =        pdcCs[p].office;
        }
        
        // handle candidates not in PDC set
        if (!_.findKey(pdcCs, { candidate_fullname: name })) {
          console.warn((chalk.red( name, '— Add uuid, party, office, and pdc_url manually',)));
          candidate.pdc_url = '';
          candidate.uuid = '';
          candidate.party =  '';
          candidate.electionyear =  '2020';
          candidate.office =  '';
        }
      }
      
      candidates.push(candidate);
      console.log((chalk.green(candidate.name)));
      // console.log((chalk.gray(JSON.stringify(candidate,null,2))));
      
      // write all the data
    }
  });
};



main();
