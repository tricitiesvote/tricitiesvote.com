const DONATION = `
  fragment DonationDetails on DonationsJson {
    id
    candidate {
      ...CandidateDetails
    }
    donor
    electionyear
    donation_type
    party
    cash
    detail
    report
    date
  }
`;

export default DONATION;
