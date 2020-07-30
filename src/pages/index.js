import React from 'react';
import { graphql } from 'gatsby';
// import _ from 'lodash'
import DefaultLayout from '../layouts/DefaultLayout';
import Guide from '../components/Guide';
import ContactInline from '../components/ContactInline';

// collect Candidates in Races, collect Races in Guides

class SiteIndex extends React.Component {
  render() {
    const { data } = this.props;
    const siteTitle = data.site.siteMetadata.title;
    const guides = data.allGuidesJson.edges;

    return (
      <DefaultLayout
        location={data.location}
        title={siteTitle}
        bodyClass="index"
      >
        <p className="notice">
          More updates coming...
          <br />
          <a href="http://tricitiesdaily.com">Follow Tri-Cities Daily</a> for
          the latest.
        </p>
        {guides.map(guide => (
          <Guide data={guide} mini="true" />
        ))}

        <ContactInline page="https://tricitiesvote.com" />
      </DefaultLayout>
    );
  }
}

export default SiteIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }

    allGuidesJson(
      filter: { electionyear: { eq: "2020" }, type: { eq: "primary" } }
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
