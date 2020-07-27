const fs = require('fs');
const Fuse = require('fuse.js');
const _ = require('lodash');

// read and parse pamphlet data
const pamphletCandidates = fs.readFileSync('./data/pamphletCandidates.json');
const pamphletData = JSON.parse(pamphletCandidates);

// read and parse pdc data
const pdcCandidates = fs.readFileSync('./data/pdcCandidates.json');
const pdcData = JSON.parse(pdcCandidates);

// const data = [];

const options = {
  threshhold: 0.2,
  keys: [
    "candidate_fullname",
    "candidate_lastname"
  ]
};

const fuse = new Fuse(pdcData, options);

for (const pamphletRecord of pamphletData) {
  console.log('\n===== pamphlet name:', pamphletRecord.candidate_ballot_name);

  // search pdc dataset for names matching pamphlet name
  let match = fuse.search(pamphletRecord.candidate_ballot_name);
  // console.log('===== match', JSON.stringify(match[0], null, 2));
  if (match[0]) {
    let pdcRecord = match[0].item;
    console.log('========= pdc match:', pdcRecord.candidate_fullname);
    let merged = {
      name: pamphletRecord.candidate_ballot_name,
      slug: _.kebabCase(pamphletRecord.candidate_ballot_name),
      uuid: pdcRecord.candidate_filer_id,
      party: pdcRecord.party,
      statement_html: pamphletRecord.statement_html,
      electionyear: pdcRecord.election_year,
      office: pdcRecord.office,
      website: pamphletRecord.website,
      email: pamphletRecord.email,
      pamphlet_url: pamphletRecord.pamphlet_url,
      pdc_url: pdcRecord.pdc_url,
    }

    // add merged item 
    // data.push(merged);
    let candidateData = JSON.stringify(merged, null, 2);
    fs.writeFileSync(`./data/candidates/${merged.electionyear}-${merged.slug}.json`, candidateData);

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
    }
    let candidateData = JSON.stringify(unmerged, null, 2);
    fs.writeFileSync(`./data/candidates/${unmerged.electionyear}-${unmerged.slug}.json`, candidateData);
  }
  
}

// let candidateData = JSON.stringify(data, null, 2);
// fs.writeFileSync('./data/candidates.json', candidateData);
// console.log(data.length, 'items written to data/candidates.json');
