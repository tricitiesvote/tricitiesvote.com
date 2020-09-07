const CANDIDATE_FUNDRAISING = `
  fragment CandidateFundraisingDetails on CandidateFundraisingJson {
    id
    unique_donors
    total_raised
    total_cash
    total_in_kind
    donors {
      ...DonorDetails
    }
    donations {
      ...DonationDetails
    }
  }
`;

export default CANDIDATE_FUNDRAISING;
