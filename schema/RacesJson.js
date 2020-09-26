const RacesJson = `
type RacesJson implements Node {
  office:           OfficesJson @link(by: "title", from: "office")
  electionyear:     String
  title:            String
  type:             String
  uuid:             String
  intro:            String
  body:             String
  candidates:       [CandidatesJson] @link(by: "uuid", from: "candidates")
  hide:             Boolean
}
`;

export default RacesJson;
