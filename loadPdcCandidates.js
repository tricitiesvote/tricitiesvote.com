/* eslint-disable no-restricted-syntax */
const soda = require('soda-js');
const _ = require('lodash');

module.exports = new Promise((resolve, reject) => {
  // https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data
  const consumer = new soda.Consumer('data.wa.gov');

  const pdcCandidates = [];
  const filer_ids = [];

  const candidateNames = {
    'PHILA  301': 'Amy Phillips',
    'BYRDA--353': 'Audra Byrd',
    'MCKAW  337': 'Bill McKay',
    // bob thompson
    'ANDEB--503': 'Brandon Anderson',
    'MEEHB--336': 'Bryan Meehan-Verhei',
    'FITZC--352': 'Chauné Fitzgerald',
    'GARCD--352': 'Danica Garcia',
    'NIELD--150': 'David Nielsen',
    'BRITD  336': 'Don Britain',
    // elijah stanfield
    // erin steinert
    // gabe galbraith
    'BULLG--338': 'Gary Bullert',
    'WIREE  352': 'Ginger Wireman', // not added
    'CRAWG--338': 'Gretl Crawford',
    'CLEAH  352': 'Heather Cleary',
    'BROWI--307': 'Irving Brown, Sr.',
    // jacob finkbeiner
    // james langford
    'LOHRJ--336': 'Jason Lohr',
    'JONEJH 352': 'Jhoanna Jones',
    'KENNJ--302': 'John Kennedy',
    // john trumbo
    'MORAK  353': 'Kate Moran', // not added
    'SHORK--336': 'Ken Short',
    'PERAL  337': 'Leo Perales',
    'ANDEL--337': 'Loren Anderson', // not added
    'BORIM--517': 'Marianne Boring',
    'VALEM--338': 'Micah Valentine',
    'ALVAM  352': 'Michael Alvarez', // not added
    'ANDRM--301': 'Michelle Andres',
    // mike luzzo
    'TORRN--301': 'Nikki Torres',
    'LUKSR  352': 'Ryan Lukson',
    'RODGS--639': 'Scott Rodgers',
    'LEE SR 337': 'Steve Lee', // not added
    // steven martinez
    // theresa richardson
    // uby creek
  };

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
          // console.log(
          //   '📇',
          //   candidate.candidate_filer_id,
          //   candidate.candidate_fullname
          // );
        }
      }
      resolve(pdcCandidates);
    })
    .on('error', function(error) {
      reject(error);
    });
});
