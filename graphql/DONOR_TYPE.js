const CANDIDATE_DONOR_TYPE = `
  fragment CandidateDonorTypeDetails on CandidateDonorTypesJson {
    id
    candidate {
      ...CandidateDetails
    }
    donor_type
    total_donated
    total_cash
    total_in_kind
    donations {
      ...DonationDetails
    }
  }
`;

module.exports = CANDIDATE_DONOR_TYPE;
