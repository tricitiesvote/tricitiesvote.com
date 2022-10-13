import React from 'react';
import { graphql } from 'gatsby';
// import _ from 'lodash'
import DefaultLayout from '../layouts/DefaultLayout';
// import Guide from '../components/Guide';
import RaceListMini from '../components/RaceListMini';
import ContactInline from '../components/ContactInline';
import HowToUseThisGuide from '../components/HowToUseThisGuide'

// collect Candidates in Races, collect Races in Guides

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props;
    const races = data.races.edges;

    return (
      <DefaultLayout title="Tri-Cities Vote" bodyClass="index" url="">
        <div className="intro">
          <h1>
            <span>🗳</span>
            Tri-Cities Vote:
            <br /> 2022 Election
          </h1>
          <h2>
            A nonpartisan community-driven collection
            <br /> of information to help you decide.
          </h2>
        </div>
        {/* <div className="intro">
          <h2>
            <Link to="/compare-legislators">
              Compare all area legislators »
            </Link>
            <Link to="/compare-commissioners">
              Compare all area commissioners »
            </Link>
          </h2>
        </div>
        <h1>Candidate engagement overview</h1> */}
        <RaceListMini data={races} />

        <ContactInline page="https://tricitiesvote.com" />
      </DefaultLayout>
    );
  }
}

export default SiteIndex;

// copied from graphql/GUIDES
export const pageQuery = graphql`
  query {
    races: allRacesJson(
      filter: { electionyear: { eq: "2022" }, type: { eq: "general" } }
      sort: { fields: office___title, order: ASC }
    ) {
      edges {
        node {
          id
          fields {
            slug
          }
          office {
            title
            region
          }
          candidates {
            fields {
              slug
              engagement_html
              fundraising {
                total_raised
                unique_donors
                total_in_kind
                total_cash
              }
              slug
            }
            image
            id
            name
            uuid
            hide
            minifiler
            endorsements {
              id
              candidate
              type
              url
              endorser
              forAgainst
            }
          }
        }
      }
    }
  }
`;
