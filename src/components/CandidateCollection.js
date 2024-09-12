import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import Candidate from './Candidate';

// Fragments copied from:
// -- graphql/CANDIDATE
// -- graphql/OFFICE
// -- graphql/FUNDRAISING
// -- graphql/CANDIDATE_DONOR (deleted donor {} )
// -- graphql/DONATION
// NOTE: must be renamed to avoid messing with the originals globally!
// (presumedly to workaround no string interpolation in graphql error? ^nvw)
const CandidateCollection = () => {
  return (
    <StaticQuery
      query={graphql`
        query {
          allCandidatesJson {
            edges {
              node {
                ...CandidateDetails_copy
              }
            }
          }
        }

        fragment OfficeDetails_copy on OfficesJson {
          title
          job
          position
          region
          uuid
        }

        fragment CandidateDonorDetails_copy on CandidateDonorsJson {
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
            ...DonationDetails_copy
          }
        }

        fragment CandidateFundraisingDetails_copy on CandidateFundraisingJson {
          id
          unique_donors
          total_raised
          total_cash
          total_in_kind
          donors {
            ...CandidateDonorDetails_copy
          }
          donations {
            ...DonationDetails_copy
          }
        }

        fragment DonationDetails_copy on DonationsJson {
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

        fragment CandidateDetails_copy on CandidatesJson {
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
              ...CandidateFundraisingDetails_copy
            }
          }
          name
          electionyear
          office {
            ...OfficeDetails_copy
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
