/* eslint-disable no-restricted-syntax */
// read all the data
const _ = require('lodash');
const loadPamphletCandidates = require('./loadPamphletCandidates');
const loadUserCandidates = require('./loadUserCandidates');
const loadPdcCandidates = require('./loadPdcCandidates');

// get the data

const main = () => {
  const loadData = [
    loadPamphletCandidates(),
    loadUserCandidates(),
    loadPdcCandidates,
  ];

  Promise.all(loadData).then(values => {
    
    const [guideCs, userCs, pdcCs] = values;
    // Guide: candidate_ballot_name
    // PDC:   candidate_fullname
    // User:  name
    
    // console.log(userCs)
    // iterate through guide candidates
    for (const guideC of guideCs) {
      const guideName = guideC.candidate_ballot_name;
      
      // check if there's a match to a user candidate
      if (_.findKey(userCs, { name: guideName })) {
        const userKey = _.findKey(userCs, { name: guideName });
        console.log(userCs[userKey].name, 'from user matches', guideName);
      }
      if (!_.findKey(userCs, { name: guideName })) {
        console.log('need to add', guideName);
      }
      if (_.findKey(pdcCs, { candidate_fullname: guideName })) {
        const pdcKey = _.findKey(pdcCs, { candidate_fullname: guideName });
        console.log(pdcCs[pdcKey].candidate_fullname, 'from PDC matches', guideName);
      }
      if (!_.findKey(pdcCs, { candidate_fullname: guideName })) {
        console.log('not in PDC:', guideName);
      }
      
    }
    
    // // iterate through user candidates
    // for (const userC of userCs) {
    //   const name = userC.candidate_name;
    //   
    //   const pdcC = 
    //   
    //   // iterate through guide candidates
    //   for (const guideCs of guideCs) {
    //     if (_.findKey())
    //   }
    //   
    //   
    // }


    // if (_.findKey(candFundraising, { id: candFundId })) {
    // const key = _.findKey(candFundraising, { id: candFundId });
    // const original = candFundraising[key];
    
    // use user item as anchor, if it exists
    // loop through user item
    // match based on name as key
    // create merged record
    // push merged record

    // const merged = {
    //   name: pamphletRecord.candidate_ballot_name,
    //   slug: _.kebabCase(pamphletRecord.candidate_ballot_name),
    //   uuid: pdcRecord.candidate_filer_id,
    //   party: pdcRecord.party,
    //   statement: pamphletRecord.statement,
    //   electionyear: pdcRecord.election_year,
    //   office: pdcRecord.office,
    //   website: pamphletRecord.website,
    //   email: pamphletRecord.email,
    //   pamphlet_url: pamphletRecord.pamphlet_url,
    //   pdc_url: pdcRecord.pdc_url,
    //   image: pamphletRecord.image,
    // };

    // PAMPHLET -- get updated url, email, website



    // "candidate_ballot_id": 44823,
    // "candidate_ballot_name": "Kim Lehrman",
    // "email": "electkimlehrman@gmail.com",
    // "website": "http://www.electkimlehrman.com",
    // "statement": "**Elected Experience**  \nNo information submitted.  \n  \n**Other Professional Experience**  \n\nAgriculture Educator and FFA Advisor, 2000-2013. Taught Agriculture Science, Horticulture, Floriculture and Welding. Award recipient as Ag. Educator at building, district and state levels. Started Chiawana High School's FFA Chapter and Floral Shop 2009. Custom swathing, baling, and hay stacking 1984-2002.\n\n**Education**  \n\nKamiakin High graduate. Bachelors Degree, General Agriculture Science with a teaching certificate, Minor in Public Relations Washington State University-Pullman, 2000. Masters in Educational Leadership, Washington State University-Tri-Cities, 2006.\n\n**Community Service**  \n\nCoached youth soccer and basketball for 10 seasons, PTO member and ATP Parent Chair, Pro-bond and Levy campaign member; Title 1 School Conference representative; PSD Community Builders; iMPACT! Compassion Center mentor.\n\n**Statement**  \nIn an era of divisive politics, it’s important to focus on the cooperative spirit and common-sense values that make Franklin County a wonderful place. I’m running because my strengths are listening and building bridges over divides. I learned these values while growing up on our family’s alfalfa farm.  \n  \nAs commissioner, I’ll focus on transparency, collaboration, and innovation. Families are struggling more than ever with mental health during COVID-19. The county commission, working with the Sheriff's Office, should be offering greater crisis support services including an App where individuals can report unsafe situations and additional mental health services in partnership with Benton County. We need economic relief for small businesses and a shared smart urban growth criteria with our local city governments. This isn’t the time to rely on broken relationships between commissioners and local residents, and economic and health policy experts. We need collaboration to create innovative ideas and partnerships to save our county. This means engaging with our agriculturists, business owners, and residents about what families and businesses need to recover and thrive.  \n  \nAs a former agriculture educator/FFA Advisor, proud mother, and active community member, I’ll be a commissioner who _leads through listening_. Vote Kim Lehrman!",
    // "pamphlet_url": "https://voter.votewa.gov/genericvoterguide.aspx?e=865#/candidates/29027/44823",
    // "image": "/images/candidates/candidate--kim-lehrman-original.png"

    // // // PDC
    // "pdc_url": "https://www.pdc.wa.gov/browse/campaign-explorer/candidate?filer_id=DELVJ  352&election_year=2020",
    // "candidate_filer_id": "DELVJ  352",
    // "candidate_fullname": "Jerome Delvin",
    // "office": "County Commissioner",
    // "district": null,
    // "position": 1,
    // "county": "Benton",
    // "party": "Republican",
    // "election_year": "2020"
// 
    // // // USER
// 
    // 'uuid'
    // 'office'
    // 'electionyear'
    // 'party'
    // 'name'
    // 'slug'
    // 'statement'
    // 'email'
    // 'pamphlet_url'
    // 'pdc_url'
    // 'instagram'
    // 'twitter'
    // 'youtube'
    // 'facebook'
    // 'website'
    // 'lettersyes'
    // 'lettersno'
    // 'engagement'

  });
};

// format all the data
// merge all the data
// -- user-edited wins
// write all the data

main();
