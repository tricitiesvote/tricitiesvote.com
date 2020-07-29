const fs = require('fs');
const soda = require('soda-js');
const _ = require('lodash');

// https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
const consumer = new soda.Consumer('data.wa.gov');

const donations = [];
const donors = [];
const donorIds = [];

consumer
  .query()
  .withDataset('kv7h-kjye') // donors
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
      const date = Date.parse(row.receipt_date);
      const donation = {
        // create donation record
        candidate_filer_id: row.filer_id,
        candidate_party: _.startCase(_.lowerCase(row.party)),
        donation_type: row.cash_or_in_kind,
        donation_amount: parseInt(row.amount, 10),
        donation_date: date,
        donation_description: row.description,
        donation_report_url: row.url.url,
      };
      donations.push(donation);

      const id = _.kebabCase(_.lowerCase(row.contributor_name));

      // check to see if we already have the donor
      if (!_.includes(donorIds, id)) {
        // console.log(row.first_name)
        // const candidate;
        const donor = {
          election_year: row.election_year,
          donor_type: row.code,
          donor_id: id,
          donor_name: _.startCase(_.lowerCase(row.contributor_name)),
          donor_city: _.startCase(_.lowerCase(row.contributor_city)),
        };
        donorIds.push(id);
        donors.push(donor);
      }
    });

    // write  donation data
    const donationData = JSON.stringify(donations, null, 2);
    fs.writeFileSync('./data/donations/donations.json', donationData);
    console.log(
      donations.length,
      'items written to data/donations/donations.json'
    );

    // write donor data
    const donorData = JSON.stringify(donors, null, 2);
    fs.writeFileSync('./data/donors/donors.json', donorData);
    console.log(donors.length, 'items written to data/donors/donors.json');
  })
  .on('error', function(error) {
    console.error(error);
  });
