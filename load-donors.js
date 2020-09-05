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
      const donorId = _.kebabCase(_.lowerCase(row.contributor_name));

      const donation = {
        // create donation record
        donor_slug: donorId,
        electionyear: row.election_year,
        donation_type: row.code,
        donor_name: _.startCase(_.lowerCase(row.contributor_name)),
        donor_city: _.startCase(_.lowerCase(row.contributor_city)),
        candidate: row.filer_id,
        candidate_name: row.filer_name,
        party: _.startCase(_.lowerCase(row.party)),
        type: row.cash_or_in_kind,
        amount: parseInt(row.amount, 10),
        date,
        detail: row.description,
        report: row.url.url,
      };
      donations.push(donation);

      // check to see if we already have the donor
      if (!_.includes(donorIds, donorId)) {
        const donor = {
          electionyear: row.election_year,
          type: row.code,
          slug: donorId,
          name: _.startCase(_.lowerCase(row.contributor_name)),
          city: _.startCase(_.lowerCase(row.contributor_city)),
        };
        donorIds.push(donorId);
        donors.push(donor);
      }
    });

    const donationsByCandidate = {};

    donations.forEach(donation => {
      const { candidate, donor_slug, amount } = donation;
      if (
        !donationsByCandidate[candidate] ||
        !donationsByCandidate[candidate][donor_slug]
      ) {
        const thisDonation = {
          [candidate]: {
            [donor_slug]: { donations: [], total: 0 },
          },
        };
        _.merge(donationsByCandidate, thisDonation);
      }
      if (donationsByCandidate[candidate][donor_slug]) {
        donationsByCandidate[candidate][donor_slug].donations.push(amount);
        donationsByCandidate[candidate][donor_slug].total += amount;
      } else {
        return console.error('something broke', donation.donor_slug);
      }
      return donationsByCandidate;
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

    // write candidate donation data
    const candidateDonationData = JSON.stringify(donationsByCandidate, null, 2);
    fs.writeFileSync(
      './data/candidate-donors/candidate-donors.json',
      candidateDonationData
    );
    console.log('data/candidate-donors/candidate-donors.json written');
  })
  .on('error', error => {
    console.error(error);
  });
