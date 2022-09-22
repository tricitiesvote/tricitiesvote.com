/* eslint-disable no-restricted-syntax */
const soda = require('soda-js');
const _ = require('lodash');
const NAMES = require('./load-config-names.json');
const CONFIG = require('./load-config-election.json');

module.exports = new Promise((resolve, reject) => {
  // https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
  const consumer = new soda.Consumer('data.wa.gov');

  const pdcCandidates = [];
  const filer_ids = [];
  const newCandidates = [];

  consumer
    .query()
    .withDataset('7qr9-q2c9') // campaign finance reports
    .limit(10000)
    .where(
      `
      election_year = '${CONFIG.year}' AND (
        jurisdiction = 'CITY OF RICHLAND' OR
        jurisdiction = 'CITY OF KENNEWICK' OR
        jurisdiction = 'CITY OF WEST RICHLAND' OR
        jurisdiction = 'CITY OF PASCO' OR
        jurisdiction_county = 'BENTON' OR 
        jurisdiction_county = 'FRANKLIN' OR 
        legislative_district = '16' OR 
        legislative_district = '08' OR 
        legislative_district = '09' OR
        legislative_district = '8' OR 
        legislative_district = '9' 
        )
    `
    )
    .getRows()
    .on('success', function(rows) {
      for (const row of rows) {
        // console.log(row);

        // check to see if we already have the candidate
        if (!_.includes(filer_ids, row.filer_id)) {
          let candidateName = row.filer_name;
          if (_.find(NAMES, {'pdcId': row.filer_id}) && row.type === "Candidate") {
            candidateName = _.find(NAMES, {'pdcId': row.filer_id})
          } else if (row.type === "Candidate") {
            // console.log(`{\n  "formattedName": "",\n  "pdcId": "${row.filer_id}",\n  "altNames": [\n    "${row.filer_name}"\n  ]\n},`);
            const thisCandidate = {
              formattedName: "",
              pdcId: row.filer_id,
              altNames: [row.filer_name]
            }
            newCandidates.push(thisCandidate)
          }
          const candidate = {
            pdc_url: `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2021`,
            candidate_filer_id: row.filer_id,
            candidate_fullname: candidateName,
            office: _.startCase(_.lowerCase(row.office)),
            district: parseInt(row.legislative_district, 10),
            position: parseInt(row.position, 10),
            county: _.startCase(_.lowerCase(row.jurisdiction_county)),
            party: _.startCase(_.lowerCase(row.party)),
            election_year: row.election_year,
          };
          filer_ids.push(row.filer_id);
          pdcCandidates.push(candidate);
          // console.log(
          //   '📇',
          //   candidate.candidate_filer_id,
          //   candidate.candidate_fullname
          // );
        }
      }
      if (newCandidates.length > 0) {
        console.log('### Add to load-config-names.json')
        console.log(JSON.stringify(newCandidates, null, 2))
        console.log('### Add to load-config-names.json')
      }
      resolve(pdcCandidates);
    })
    .on('error', function(error) {
      console.log(error);
      reject(error);
    });
});
