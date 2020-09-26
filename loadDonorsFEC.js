/* eslint-disable func-names */
const fs = require('fs');
const soda = require('soda-js');
const _ = require('lodash');
require("dotenv").config({ path: `.env` });
console.log(process.env.FEC_API_KEY);
// 
// // https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data


function _requestForOffset(path, offset) {
     return superagent.get(`https://api.example.com/${path}`).query({offset});
}

async function getAllPages() {
    const limit = 50;
    let offset = 0, total;
    do {
        const response = await _requestForOffset("listings/active", offset);
        total = response.body.total;
        offset += limit;
    } 
    while(offset < total);
}


// const consumer = new soda.Consumer('data.wa.gov');
// 
// const donations = [];
// const candFundraising = [];
// const donors = [];
// const candDonors = [];
// const candDonorTypes = [];
// 
// const slug = input => {
//   return _.kebabCase(_.lowerCase(input));
// };
// const capitalize = input => {
//   return _.startCase(_.lowerCase(input));
// };
// 
// // TODO: this is currently running constantly
// // and only needs to run at the end of the forEach
// const writeData = dataSet => {
//   dataSet.forEach(item => {
//     const { data, name } = item;
//     const jsonData = JSON.stringify(data, null, 2);
//     const path = `./data/donations/${name}.json`;
//     fs.writeFileSync(path, jsonData);
//     console.log(data.length, `items written to ${path}`);
//   });
// };
// 
// consumer
//   .query()
//   .withDataset('kv7h-kjye') // donors
//   .limit(10000)
//   .where(
//     `
//     election_year = '2020' AND (
//       jurisdiction_county = 'BENTON' OR 
//       jurisdiction_county = 'FRANKLIN' OR 
//       legislative_district = '16' OR 
//       legislative_district = '8' OR 
//       legislative_district = '9'
//       )
//   `
//   )
//   .getRows()
//   .on('success', function (rows) {
//     rows.forEach((row, i) => {
//       const date = Date.parse(row.receipt_date);
//       const donationId = slug(
//         `${row.filer_id}-${row.contributor_name}-${row.election_year}-${i}`
//       );
//       const donorId = slug(row.contributor_name);
//       const candId = row.filer_id;
//       const candFundId = slug(`${candId}-funding`);
//       const candDonorId = slug(`${candId}-${row.contributor_name}`);
//       const donorTypeId = slug(`${candId}-${row.code}`);
//       const party = capitalize(row.party);
//       const amount = parseInt(row.amount, 10);
//       const contribName = capitalize(row.contributor_name);
//       const contribCity = capitalize(row.contributor_city);
// 
//       let cash;
//       let cash_amt;
//       let in_kind_amt;
// 
//       if (row.cash_or_in_kind === 'Cash') {
//         cash = true;
//         cash_amt = amount;
//         in_kind_amt = 0;
//       }
//       if (row.cash_or_in_kind === 'In kind') {
//         cash = false;
//         cash_amt = 0;
//         in_kind_amt = amount;
//       }
// 
//       const donation = {
//         id: donationId,
//         candidate: candId,
//         donor: donorId,
//         electionyear: row.election_year,
//         donation_type: row.code,
//         party,
//         cash,
//         detail: row.description,
//         report: row.url.url,
//         amount,
//         date,
//       };
//       donations.push(donation);
// 
//       if (_.findKey(candFundraising, { id: candFundId })) {
//         const key = _.findKey(candFundraising, { id: candFundId });
//         const original = candFundraising[key];
//         original.unique_donors += 1;
//         original.total_raised += amount;
//         original.total_cash += cash_amt;
//         original.total_in_kind += in_kind_amt;
//         original.donations.push(donationId);
//         if (!_.includes(original.donors, candDonorId)) {
//           original.donors.push(candDonorId);
//         }
//       } else {
//         const candFund = {
//           id: candFundId,
//           candidate: candId,
//           unique_donors: 1,
//           total_raised: amount,
//           total_cash: cash_amt,
//           total_in_kind: in_kind_amt,
//           donors: [candDonorId],
//           donations: [],
//         };
//         candFund.donations.push(donationId);
//         candFundraising.push(candFund);
//       }
// 
//       // need to somehow nest donors' totals by candidate,
//       // and group donors donation by candidate
// 
//       if (_.findKey(donors, { id: donorId })) {
//         const key = _.findKey(donors, { id: donorId });
//         const original = donors[key];
//         original.donations_count += 1;
//         original.total_donated += amount;
//         original.total_cash += cash_amt;
//         original.total_in_kind += in_kind_amt;
//         if (!_.includes(original.funded, candId)) {
//           original.funded.push(candId);
//         }
//         original.donations.push(donationId);
//       } else {
//         const donor = {
//           id: donorId,
//           name: contribName,
//           city: contribCity,
//           type: row.code,
//           donations_count: 1,
//           total_donated: amount,
//           total_cash: cash_amt,
//           total_in_kind: in_kind_amt,
//           funded: [candId],
//           donations: [],
//         };
//         donor.donations.push(donationId);
//         donors.push(donor);
//       }
// 
//       if (_.findKey(candDonors, { id: candDonorId })) {
//         const key = _.findKey(candDonors, { id: candDonorId });
//         const original = candDonors[key];
//         original.total_donated += amount;
//         original.total_cash += cash_amt;
//         original.total_in_kind += in_kind_amt;
//         original.donations.push(donationId);
//       } else {
//         const candDonor = {
//           id: candDonorId,
//           donor: donorId,
//           candidate: candId,
//           name: contribName,
//           city: contribCity,
//           total_donated: amount,
//           total_cash: cash_amt,
//           total_in_kind: in_kind_amt,
//           donations: [],
//         };
//         candDonor.donations.push(donationId);
//         candDonors.push(candDonor);
//       }
// 
//       if (_.findKey(candDonorTypes, { id: donorTypeId })) {
//         const key = _.findKey(candDonorTypes, { id: donorTypeId });
//         const original = candDonorTypes[key];
//         original.total_donated += amount;
//         original.total_cash += cash_amt;
//         original.total_in_kind += in_kind_amt;
//         original.donations.push(donationId);
//       } else {
//         const candDonorType = {
//           id: donorTypeId,
//           candidate: candId,
//           donor_type: row.code,
//           total_donated: amount,
//           total_cash: cash_amt,
//           total_in_kind: in_kind_amt,
//           donations: [],
//         };
//         candDonorType.donations.push(donationId);
//         candDonorTypes.push(candDonorType);
//       }
//     });
// 
//     const dataSet = [
//       { data: donations, name: 'donations' },
//       { data: candFundraising, name: 'candidate-fundraising' },
//       { data: donors, name: 'donors' },
//       { data: candDonors, name: 'candidate-donors' },
//       { data: candDonorTypes, name: 'donor-types' },
//     ];
// 
//     writeData(dataSet);
//   })
//   .on('error', error => {
//     console.error(error);
//   });
