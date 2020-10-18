import React from 'react';
import { graphql, Link } from 'gatsby';
// import _ from 'lodash'
import DefaultLayout from '../layouts/DefaultLayout';
import Guide from '../components/Guide';
import ContactInline from '../components/ContactInline';

// collect Candidates in Races, collect Races in Guides

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props;
    const siteTitle = data.site.siteMetadata.title;
    const guides = data.guides.edges;

    return (
      <DefaultLayout
        location={data.location}
        title={siteTitle}
        bodyClass="index"
      >
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
        {guides.map(guide => (
          <Guide data={guide} mini="true" />
        ))}

        <ContactInline page="https://tricitiesvote.com" />
      </DefaultLayout>
    );
  }
}

export default SiteIndex;

// copied from graphql/GUIDES
export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    guides: allGuidesJson(
      filter: { electionyear: { eq: "2020" }, type: { eq: "general" } }
    ) {
      edges {
        node {
          fields {
            slug
          }
          races {
            ...RaceDetails
          }
          electionyear
          type
          region
        }
      }
    }
  }
`;
