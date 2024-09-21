const CANDIDATE = `
  fragment CandidateDetails on CandidatesJson {
    fields {
      slug
      bio_html
      body_html
      body_excerpt_html
      statement_html
      engagement_html
      statement_excerpt_html
      articles_html
      fundraising {
        ...CandidateFundraisingDetails
      }
      school_answers {
        candidate
        region
        position
        question_1
        question_8
        question_9
        question_10
        question_11
        question_12
      }
      council_answers {
        candidate
        region
        position
        question_1
        question_2
        question_3
        question_4
        question_4c
        question_5
        question_5c
        question_6
        question_6c
        question_7
        question_7c
        question_8
        question_8c
        question_9
        question_9c
        question_10
        question_10c
        question_11
        question_12
      }
      responder {
        name
        image
        uuid
        fields {
          slug
        }
        office {
          title
          position
          region
        }
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
    endorsements {
      id
      candidate
      type
      url
      endorser
      forAgainst
    }
    articles
    engagement
    uuid
    hide
    minifiler
  }
`;

export default CANDIDATE;
