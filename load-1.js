const fs = require('fs');
const soda = require('soda-js');
const _ = require('lodash');

// https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
var consumer = new soda.Consumer('data.wa.gov');

const dataSet = [];
const candidates = [];
const filer_ids = [];

consumer.query()
  // .withDataset('kv7h-kjye') // donors
  .withDataset('7qr9-q2c9') // campaign finance reports
  .limit(10000)
  .where(`
    election_year = '2020' AND (
      jurisdiction_county = 'BENTON' OR 
      jurisdiction_county = 'FRANKLIN' OR 
      legislative_district = '16' OR 
      legislative_district = '8' OR 
      legislative_district = '9'
      )
  `)
  .getRows()
    .on('success', function(rows) { 
      rows.forEach((row, index) => {
        // console.log(row);
        let item = {
          // create donation record
          'candidate_filer_id': row.filer_id,
          'pdc_url': `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2020`,
          'candidate_fullname': _.startCase(_.lowerCase(row.filer_name)),
          'candidate_firstname': _.startCase(_.lowerCase(row.first_name)),
          'candidate_lastname': _.startCase(_.lowerCase(row.last_name)),
          'office': _.startCase(_.lowerCase(row.office)),
          'district': parseInt(row.legislative_district, 10),
          'position': parseInt(row.position, 10),
          'county': _.startCase(_.lowerCase(row.jurisdiction_county)),
          'party': _.startCase(_.lowerCase(row.party)),
          'election_year': row.election_year,
          'donor_type': row.code,
          'donation_type': row.cash_or_in_kind,
          'donation_amount': row.amount,
          'donation_date': row.receipt_date,
          'donation_description': row.description,
          'donor_name': _.startCase(_.lowerCase(row.contributor_name)),
          'donor_city': _.startCase(_.lowerCase(row.contributor_city)),
          'election_type': row.primary_general,
          'report_url': row.url.url,
        }
        dataSet.push(item)

        // check to see if we already have the candidate
        if (!_.includes(filer_ids, row.filer_id)) {
          // console.log(row.first_name)
          // const candidate;
          // TODO this is such a big hack
          if (row.first_name === 'LOWELL' && row.last_name === 'PECK') { row.first_name = 'BRAD' }
          if (row.first_name === 'BRADLEY' && row.last_name === 'KLIPPERT') { row.first_name = 'BRAD' }
          if (row.first_name === 'MATTHEW' && row.last_name === 'BEATON') { row.first_name = 'MATT' }
          if (row.first_name === 'RODNEY' && row.last_name === 'MULLEN') { row.first_name = 'ROCKY' }
          if (row.filer_name === 'MULLEN RODNEY J (RODNEY MULLEN)' ) { row.filer_name = 'ROCKY MULLEN' }
          if (row.filer_id === 'JENKW  350') { 
             let candidate = ""
          } else { let candidate = {
              'pdc_url': `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2020`,
              'candidate_filer_id': row.filer_id,
              'candidate_fullname': _.startCase(_.lowerCase(row.filer_name)),
              'candidate_fullname': row.filer_name,
              'candidate_firstname': _.startCase(_.lowerCase(row.first_name)),
              'candidate_lastname': _.startCase(_.lowerCase(row.last_name)),
              'office': _.startCase(_.lowerCase(row.office)),
              'district': parseInt(row.legislative_district, 10),
              'position': parseInt(row.position, 10),
              'county': _.startCase(_.lowerCase(row.jurisdiction_county)),
              'party': _.startCase(_.lowerCase(row.party)),
              'election_year': row.election_year,
            }
            filer_ids.push(row.filer_id);
            candidates.push(candidate);
          }
        }

      })

      // write  donation data
      let data = JSON.stringify(dataSet, null, 2);
      fs.writeFileSync('./data/donors/donors.json', data);
      console.log(dataSet.length, 'items written to data/donors/donations.json');

      // write candidate data
      let candidateData = JSON.stringify(candidates, null, 2);
      fs.writeFileSync('./data/pdcCandidates.json', candidateData);
      console.log(candidates.length, 'items written to data/pdcCandidates.json');
    })
    .on('error', function(error) { console.error(error); });