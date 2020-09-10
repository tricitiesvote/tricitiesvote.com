const CANDIDATE = `
  fragment CandidateDetails on CandidatesJson {
    fields {
      slug
      body_html
      bio_html
      lettersyes_html
      lettersno_html
      articles_html
      engagement_html
      statement_html
      statement_excerpt_html
      body_excerpt_html
      bio_excerpt_html
      lettersyes_html_nowrap
      lettersno_html_nowrap
      bio_html_nowrap
      articles_html_nowrap
      body_html_nowrap
      fundraising {
        ...CandidateFundraisingDetails
      }
    }
    name
    electionyear
    office {
      ...OfficeDetails
    }
    party
    incumbent
    yearsin
    image
    statement
    email
    website
    facebook
    twitter
    instagram
    youtube
    pdc_url
    pamphlet_url
    bio
    lettersyes
    lettersno
    articles
    engagement
    uuid
    hide
  }
`;

export default CANDIDATE;
