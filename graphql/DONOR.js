const DONOR = `
  fragment DonorDetails on DonorsJson {
    id
    name
    city
    type
    donations_count
    total_donated
    total_cash
    total_in_kind
    donations {
      ...DonationDetails
    }
  }
`;

export default DONOR;
