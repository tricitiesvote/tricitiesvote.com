// read all the data
const loadPamphletCandidates = require('./loadPamphletCandidates');
const loadUserCandidates = require('./loadUserCandidates');
const loadPdcCandidates = require('./loadPdcCandidates');

// get the data

const main = () => {
  const loadData = [
    loadPamphletCandidates,
    loadUserCandidates,
    loadPdcCandidates,
  ];

  Promise.all(loadData).then(values => {
    console.log(values);
    // const { pamphletCandidates, userCandidates, pdcCandidates } = values;
  });
};

// format all the data
// merge all the data
// -- user-edited wins
// write all the data

main();
