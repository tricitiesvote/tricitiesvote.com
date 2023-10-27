import { graphql } from 'gatsby';

export const fragment = graphql`
  fragment CandidateFundraisingDetails on CandidateFundraisingJson {
    id
    unique_donors
    total_raised
    total_cash
    total_in_kind
    donors {
      ...CandidateDonorDetails
    }
    donations {
      ...DonationDetails
    }
  }
`;
