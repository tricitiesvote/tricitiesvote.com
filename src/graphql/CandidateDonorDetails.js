import { graphql } from 'gatsby';

export const fragment = graphql`
  fragment CandidateDonorDetails on CandidateDonorsJson {
    id
    donor {
      ...DonorDetails
    }
    candidate {
      name
      uuid
    }
    name
    city
    total_donated
    total_cash
    total_in_kind
    donations {
      ...DonationDetails
    }
  }
`;
