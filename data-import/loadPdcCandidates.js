/* eslint-disable no-restricted-syntax */
const soda = require('soda-js');
const _ = require('lodash');

module.exports = new Promise((resolve, reject) => {
  // https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
  const consumer = new soda.Consumer('data.wa.gov');

  const pdcCandidates = [];
  const filer_ids = [];

  consumer
    .query()
    .withDataset('7qr9-q2c9') // campaign finance reports
    .limit(10000)
    .where(
      `
      election_year = '2020' AND (
        jurisdiction_county = 'BENTON' OR 
        jurisdiction_county = 'FRANKLIN' OR 
        legislative_district = '16' OR 
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

          const candidateNames = {
            'BEAVJ  337': 'James "Jim" Beaver',
            'DELVJ  352': 'Jerome Delvin',
            'WALSM  362': 'Maureen Walsh',
            'MULLR  301': 'Rocky Mullen',
            'RUDES  504': 'Skyler Rude',
            'BOEHM  336': 'Matt Boehnke',
            'KLIPB  336': 'Brad Klippert',
            'DOZIP  361': 'Perry Dozier',
            'REGES  354': 'Shir Regev',
            'RESED--362': 'Danielle Garbe Reser',
            'CHVAF--362': 'Frances Chvatal',
            'KLICM--362': 'Mark Klicker',
            'PERAA--301': 'Ana Ruiz Peralta',
            'LANDD  352': 'Donnie Landsman',
            'PETED  338': 'Dave Petersen',
            'LEHRK--302': 'Kim Lehrman',
            'RAFFJ--352': 'Justin Raffa',
            'BROWS  337': 'Sharon Brown',
            'MCKAW  337': 'Will McKay',
            'PECKL  301': 'Brad Peck',
            'COBUC--814': 'Carly Coburn',
          };

          const candidate = {
            pdc_url: `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2020`,
            candidate_filer_id: row.filer_id,
            candidate_fullname: candidateNames[row.filer_id],
            office: _.startCase(_.lowerCase(row.office)),
            district: parseInt(row.legislative_district, 10),
            position: parseInt(row.position, 10),
            county: _.startCase(_.lowerCase(row.jurisdiction_county)),
            party: _.startCase(_.lowerCase(row.party)),
            election_year: row.election_year,
          };
          filer_ids.push(row.filer_id);
          pdcCandidates.push(candidate);
          // console.log(candidate.candidate_fullname);
        }
      }
      resolve(pdcCandidates);
    })
    .on('error', function(error) {
      reject(error);
    });
});
