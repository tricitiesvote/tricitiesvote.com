/* eslint-disable no-restricted-syntax */
// read all the data
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

  Promise.all(loadData).then(values => {
    // console.log(values);
    const [pamphletCandidates, userCandidates, pdcCandidates] = values;
    // console.log(pdcCandidates);
    // console.log('pamphlet candidates', pamphletCandidates);
    for (const pamphletCandidate of pamphletCandidates) {
      console.log('\nPamphlet candidate:');
      console.log(pamphletCandidate.candidate_ballot_name);
    }
    for (const userCandidate of userCandidates) {
      console.log('\nUser-defined candidate:');
      console.log(userCandidate.name);
    }

    for (const pdcCandidate of pdcCandidates) {
      console.log('\nPDC candidate:');
      console.log(pdcCandidate.candidate_fullname);
    }
  });
};

// format all the data
// merge all the data
// -- user-edited wins
// write all the data

main();
