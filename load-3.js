const fs = require('fs');
// const Fuse = require('fuse.js');
const fuzzysort = require('fuzzysort')
const _ = require('lodash');

// read and parse pamphlet data
const pamphletCandidates = fs.readFileSync('./data/pamphletCandidates.json');
const pamphletData = JSON.parse(pamphletCandidates);

// read and parse pdc data
const pdcCandidates = fs.readFileSync('./data/pdcCandidates.json');
const pdcData = JSON.parse(pdcCandidates);

// const data = [];

const options = {
  threshold: -100000,
  allowTypo: true,
  keys: [
    "candidate_firstname",
    "candidate_lastname",
    "candidate_fullname",
  ]
};

for (const pamphletRecord of pamphletData) {
  let ballot_name = pamphletRecord.candidate_ballot_name.replace(/\./g, "")
  // console.log('\n===== pamphlet name:', ballot_name);

  // search pdc dataset for names matching pamphlet name
  // let match = fuse.search(pamphletRecord.candidate_ballot_name);
  let match = fuzzysort.go(ballot_name, pdcData, options);
  // if (match) {
  //   console.log('========= pdc match:', match);
  // }
  // if (match[0] && match[0].obj) {
  //   console.log('========= pdc match:', match[0].obj.candidate_fullname);
  // }
  // if (!match[0]) {
  //   console.log('========= pdc match:', match);
  // }

  if (match[0]) {
    let pdcRecord = match[0].obj;
    // console.log('========= pdc match:', pdcRecord.candidate_fullname);
    let merged = {
      name: pamphletRecord.candidate_ballot_name,
      slug: _.kebabCase(pamphletRecord.candidate_ballot_name),
      uuid: pdcRecord.candidate_filer_id,
      party: pdcRecord.party,
      statement: pamphletRecord.statement,
      statement_html: pamphletRecord.statement_html,
      electionyear: pdcRecord.election_year,
      office: pdcRecord.office,
      website: pamphletRecord.website,
      email: pamphletRecord.email,
      pamphlet_url: pamphletRecord.pamphlet_url,
      pdc_url: pdcRecord.pdc_url,
      image: pamphletRecord.image,
    }

    // add merged item 
    // data.push(merged);
    let candidateData = JSON.stringify(merged, null, 2);
    fs.writeFileSync(`./data/candidates/${merged.electionyear}-${merged.slug}.json`, candidateData);
    console.log('⚪️', `/data/candidates/${merged.electionyear}-${merged.slug}.json`);

  } else {
    let unmerged = {
      name: pamphletRecord.candidate_ballot_name,
      slug: _.kebabCase(pamphletRecord.candidate_ballot_name),
      uuid: _.kebabCase(pamphletRecord.candidate_ballot_name),
      party: '',
      statement_html: pamphletRecord.statement_html,
      // TODO fix this
      electionyear: '2020',
      office: '',
      website: pamphletRecord.website,
      email: pamphletRecord.email,
      pamphlet_url: pamphletRecord.pamphlet_url,
      pdc_url: '',
      image: pamphletRecord.image,
      // need to add this to data
      pdc_filed: false,
    }
    let candidateData = JSON.stringify(unmerged, null, 2);
    fs.writeFileSync(`./data/candidates/${unmerged.electionyear}-${unmerged.slug}.json`, candidateData);
    console.log('🔴', `/data/candidates/${unmerged.electionyear}-${unmerged.slug}.json`);
  }
  
}

// let candidateData = JSON.stringify(data, null, 2);
// fs.writeFileSync('./data/candidates.json', candidateData);
// console.log(data.length, 'items written to data/candidates.json');
