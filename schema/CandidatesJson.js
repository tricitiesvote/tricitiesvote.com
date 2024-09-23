const CandidatesJson = `
  type CandidatesJson implements Node {
    fields:           Fields
    electionyear:     String      
    name:             String      
    party:            String
    incumbent:        Boolean
    yearsin:          String   
    image:            String
    email:            String
    website:          String
    facebook:         String
    twitter:          String
    instagram:        String
    youtube:          String
    pdc_url:          String
    pamphlet_url:     String
    uuid:             String
    hide:             Boolean
    minifiler:        Boolean
    statement:        String
  
    bio:              String
    body:             String
    lettersyes:       String
    lettersno:        String
    articles:         String
    engagement:       String
    office:           OfficesJson @link(by: "title", from: "office")
    endorsements:     [EndorsementsJson] @link(by: "candidate", from: "uuid")
  }`;

module.exports = CandidatesJson;
