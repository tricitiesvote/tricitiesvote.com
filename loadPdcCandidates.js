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
      election_year = '2021' AND (
        jurisdiction = 'CITY OF RICHLAND' OR
        jurisdiction = 'CITY OF KENNEWICK' OR
        jurisdiction = 'CITY OF WEST RICHLAND' OR
        jurisdiction = 'CITY OF PASCO'
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
            'ALVAM  352': 'Michael Alvarez',
            'PHILA  301': 'Amy Phillips',
            'BYRDA--353': 'Audra Byrd',
            'GARCD--352': 'Danica Garcia',
            'NIELD--150': 'David Nielsen',
            'BULLG--338': 'Gary Bullert',
            'CLEAH  352': 'Heather Cleary',
            'BROWI--307': 'Irving Brown, Sr.',
            'KENNJ--302': 'John Kennedy',
            'PERAL  337': 'Leo Perales',
            'VALEM--338': 'Micah Valentine',
            'ANDRM--301': 'Michelle Andres',
            'TORRN--301': 'Nikki Torres',
            'RODGS--639': 'Scott Rodgers',
            'FITZC--352': 'Chauné Fitzgerald',
            // 'FITZC--352': "CHAUNE' FITZGERALD",
            'SHORK--336': 'Ken Short',
            'LEE SR 337': 'Steve Lee',
            'BRITD  336': 'Don Britain',
            'MCKAW  337': 'Bill McKay',
            'WIREE  352': 'Ginger Wireman',
            'LUKSR  352': 'Ryan Lukson',
            'LOHRJ--336': 'Jason Lohr',
            'MEEHB--336': 'Bryan Meehan-Verhei',
            'CRAWG--338': 'Gretl Crawford',
            'ANDEL--337': 'Loren Anderson',
            'JONEJH 352': 'Jhoanna R. Jones',
            'BORIM--517': 'Marianne Boring',
            'MORAK  353': 'Kate Moran',
          };

          const candidate = {
            pdc_url: `https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=${row.filer_id}&election_year=2021`,
            candidate_filer_id: row.filer_id,
            // is this tied to the name lookup?
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
          console.log(
            '📇',
            candidate.candidate_filer_id,
            candidate.candidate_fullname
          );
        }
      }
      resolve(pdcCandidates);
    })
    .on('error', function(error) {
      reject(error);
    });
});
