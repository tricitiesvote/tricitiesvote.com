const RacesJson = `
type RacesJson implements Node {
  office:           OfficesJson @link(by: "title", from: "office")
  fields:           Fields
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

module.exports = RacesJson;
