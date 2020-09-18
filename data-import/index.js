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
    console.log('pamphlet candidates', pamphletCandidates);
    for (const pamphletCandidate of pamphletCandidates) {
      console.log(
        'Pamphlet candidate:',
        pamphletCandidate.candidate_ballot_name
      );
    }
    for (const userCandidate of userCandidates) {
      console.log('User-defined candidate:', userCandidate.name);
    }

    for (const pdcCandidate of pdcCandidates) {
      if (pdcCandidate.candidate_fullname) {
        console.log('PDC candidate:', pdcCandidate.candidate_fullname);
      }
    }
  });
};

// format all the data
// merge all the data
// -- user-edited wins
// write all the data

main();
