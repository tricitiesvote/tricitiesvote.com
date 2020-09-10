const fs = require('fs');
const soda = require('soda-js');
const _ = require('lodash');

// https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
const consumer = new soda.Consumer('data.wa.gov');

const dataSet = [];
const candidates = [];
const filer_ids = [];

consumer
  .query()
  // .withDataset('kv7h-kjye') // donors
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
    rows.forEach((row, index) => {
      // console.log(row);

      // check to see if we already have the candidate
      if (!_.includes(filer_ids, row.filer_id)) {
        // console.log(row.first_name)
        // const candidate;
        // TODO this is such a big hack
        // if (row.first_name === 'LOWELL' && row.last_name === 'PECK') { row.first_name = 'BRAD' }
        if (row.first_name === 'BRADLEY' && row.last_name === 'KLIPPERT') {
          row.first_name = 'BRAD';
        }
        if (row.first_name === 'MATTHEW' && row.last_name === 'BEATON') {
          row.first_name = 'MATT';
        }
        if (row.first_name === 'RODNEY' && row.last_name === 'MULLEN') {
          row.first_name = 'ROCKY';
        }
        if (row.filer_id === 'LANDD  352') {
          row.filer_name = 'Donnie Landsman';
        }
        if (row.filer_id === 'MCKAW  337') {
          row.filer_name = 'Will McKay';
          row.first_name = 'Will';
        }
        if (row.filer_name === 'MULLEN RODNEY J (RODNEY MULLEN)') {
          row.filer_name = 'ROCKY MULLEN';
        }
        if (row.filer_id === 'JENKW2-350') {
          row.first_name = 'William';
          row.last_name = 'Jenkin';
        }
        if (row.filer_id === 'AJAXS--336') {
          row.first_name = 'Shelley';
          row.last_name = 'Ajax';
        }
        if (row.filer_id === 'JENKW  350') {
          const candidate = '';
        } else {
          const candidate = {
            pdc_url: `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2020`,
            candidate_filer_id: row.filer_id,
            candidate_fullname: _.startCase(_.lowerCase(row.filer_name)),
            candidate_firstname: _.startCase(_.lowerCase(row.first_name)),
            candidate_lastname: _.startCase(_.lowerCase(row.last_name)),
            office: _.startCase(_.lowerCase(row.office)),
            district: parseInt(row.legislative_district, 10),
            position: parseInt(row.position, 10),
            county: _.startCase(_.lowerCase(row.jurisdiction_county)),
            party: _.startCase(_.lowerCase(row.party)),
            election_year: row.election_year,
          };
          filer_ids.push(row.filer_id);
          candidates.push(candidate);
        }
      }
    });

    // write candidate data
    const candidateData = JSON.stringify(candidates, null, 2);
    fs.writeFileSync('./output/pdcCandidates.json', candidateData);
    console.log(
      candidates.length,
      'items written to output/pdcCandidates.json'
    );
  })
  .on('error', function(error) {
    console.error(error);
  });
