const fs = require('fs');
const soda = require('soda-js');
const _ = require('lodash');

var consumer = new soda.Consumer('data.wa.gov');

const dataSet = [];

consumer.query()
  .withDataset('kv7h-kjye')
  .where({ election_year: '2020', jurisdiction_county: 'BENTON' || 'FRANKLIN' })
  .getRows()
    .on('success', function(rows) { 
      rows.forEach((row, index) => {
        // console.log(row);
        // console.log(row.first_name);
        // console.log('-------')
        candidateName = _.startCase(_.lowerCase(row.first_name)) + ' ' + _.startCase(_.lowerCase(row.last_name)) 
        let item = {
          'candidate_id': row.filer_id,
          'candidate_fullname': _.startCase(_.lowerCase(row.filer_name)),
          'candidate_firstname': _.startCase(_.lowerCase(row.first_name)),
          'candidate_lastname': _.startCase(_.lowerCase(row.last_name)),
          'office': _.startCase(_.lowerCase(row.office)),
          'district': parseInt(row.legislative_district, 10),
          'position': parseInt(row.position, 10),
          'county': _.startCase(_.lowerCase(row.jurisdiction_county)),
          'election_year': row.election_year,
          'donor_type': row.code,
          'donation_type': row.cash_or_in_kind,
          'donation_amount': row.amount,
          'donation_data': row.receipt_date,
          'donation_description': row.description,
          'donor_name': _.startCase(_.lowerCase(row.contributor_name)),
          'donor_city': _.startCase(_.lowerCase(row.contributor_city)),
          'election_type': row.primary_general,
          'report_url': row.url.url,
        }
        dataSet.push(item)
        // console.log(item.candidate_fullname, item.report_url)
      })
      let data = JSON.stringify(dataSet, null, 2);
      fs.writeFileSync('donations.json', data);
      // console.log(rows)
    })
    .on('error', function(error) { console.error(error); });

