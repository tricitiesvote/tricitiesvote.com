import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import Candidate from './Candidate';

// Fragments copied from:
// -- graphql/CANDIDATE
// -- graphql/OFFICE
// -- graphql/FUNDRAISING
// -- graphql/CANDIDATE_DONOR (deleted donor {} )
// -- graphql/DONATION
const CandidateCollection = () => {
  return (
    <StaticQuery
      query={graphql`
        query {
          allCandidatesJson {
            edges {
              node {
                ...CandidateDetails
              }
            }
          }
        }

        fragment OfficeDetails on OfficesJson {
          title
          job
          position
          region
          uuid
        }

        fragment CandidateDonorDetails on CandidateDonorsJson {
          id
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

        fragment CandidateFundraisingDetails on CandidateFundraisingJson {
          id
          unique_donors
          total_raised
          total_cash
          total_in_kind
          donors {
            ...CandidateDonorDetails
          }
          donations {
            ...DonationDetails
          }
        }

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
          endorsements {
            id
            candidate
            name
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
      `}
      render={data => (
        <div className="candidate-set">
          {data.allCandidatesJson.edges.map(edge => (
            <Candidate data={edge.node} fullsize="false" />
          ))}
        </div>
      )}
    />
  );
};

export default CandidateCollection;
