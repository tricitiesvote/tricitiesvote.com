const DONOR = `
  fragment DonorDetails on DonorsJson {
    id
    name
    city
    type
    total_donated
    total_cash
    total_in_kind
  }
`;

export default DONOR;
