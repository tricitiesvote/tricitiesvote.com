import React from 'react';
import { graphql, Link } from 'gatsby';
// import _ from 'lodash'
import DefaultLayout from '../layouts/DefaultLayout';
// import Guide from '../components/Guide';
import RaceListMini from '../components/RaceListMini';
import ContactInline from '../components/ContactInline';

// collect Candidates in Races, collect Races in Guides

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props;
    const races = data.races.edges;

    return (
      <DefaultLayout title="Tri-Cities Vote" bodyClass="index">
        <div className="intro">
          <h1>
            <span>🗳</span>
            Tri-Cities Vote:
            <br /> 2020 Election
          </h1>
          <h2>
            A nonpartisan community-driven collection
            <br /> of information to help you decide.
          </h2>
          <h2>
            <Link to="/compare-legislators">Compare legislators »</Link>
            <Link to="/compare-commissioners">Compare commissioners »</Link>
            <br />
            <Link to="/benton">Benton County »</Link>
            <Link to="/franklin">Franklin County »</Link>
          </h2>
          <p>
            Literally working on this right now.
            <br />
            <a href="http://tricitiesdaily.com">Follow Tri-Cities Daily</a> for
            the latest updates.
          </p>
        </div>
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
      filter: { electionyear: { eq: "2020" }, type: { eq: "general" } }
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
          }
        }
      }
    }
  }
`;
