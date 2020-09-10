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
    const guides = data.allGuidesJson.edges;

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
            <Link to="/benton">Benton County »</Link>
            <Link to="/franklin">Franklin County »</Link>
          </h2>
          <p>
            Get a quick overview of all of our area’s local
            <br /> candidates in elimination races below.
          </p>
          <p>
            <a href="http://tricitiesdaily.com">Follow Tri-Cities Daily</a> for
            the latest updates.
          </p>
          <p><strong>Media:</strong> Please feel free to use this site for research<br/> or data analysis. Just attribute tricitiesvote.com</p>
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

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }

    allGuidesJson(
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
