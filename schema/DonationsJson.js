const DonationsJson = `
type DonationsJson implements Node {
  id:               String
  candidate:        CandidatesJson @link(by: "uuid", from: "candidate")
  donor:            DonorsJson @link
  electionyear:     String
  donation_type:    String
  party:            String
  cash:             Boolean
  detail:           String
  report:           String
  amount:           Int
  date:             String
}
`;

export default DonationsJson;