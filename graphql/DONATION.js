const DONATION = `
  fragment DonationDetails on DonationsJson {
    id
    candidate {
      name
      uuid
    }
    donor {
      name
      id
      city
    }
    electionyear
    donation_type
    party
    cash
    detail
    report
    date
    amount
  }
`;

export default DONATION;
