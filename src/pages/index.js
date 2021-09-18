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
            <br /> 2021 Election
          </h1>
          <h2>
            A nonpartisan community-driven collection
            <br /> of information to help you decide.
          </h2>
          <p>
            <a href="mailto:adamavenir@hey.com">Reach out</a> to get involved
          </p>
        </div>
        <div className="howto">
          <h1>How to use this guide</h1>
          <div className="intro-container">
            <div>
              <img
                src="/images/compare-two.jpg"
                alt="comparing two candidates"
              />
              <h3>
                Research candidates’ views,
                <br /> donors, and endorsements
              </h3>
              <p>
                <strong>Dang near everything on this site is a link.</strong>{' '}
                We’ve collected links to regional questionnaires, interviews,
                forums, and written endorsements, plus donor data for all
                Washington State PDC candidates. (We’ll get FEC data next time
                around.) You can compare side by side or look at each candidate
                and see their donor details. You can drill all the way down to
                the candidate’s PDC filing.
              </p>
            </div>
            <div>
              <img src="/images/compare.png" alt="compare all candidates" />
              <h3>
                Quickly compare candidate
                <br /> leanings on top issues
              </h3>
              <p>
                Our A/B questionnaire is based on top issues identified over
                recent years by the public and candidates themselves. Our
                process is imperfect, but it’s intended to be nonpartisan and
                impartial while mirroring the messiness of being an elected
                official and a voter, where nearly all decisions are choices
                between two options you didn’t come up with.{' '}
                <a href="/about">Read more about our approach</a>.
              </p>
            </div>
            <div>
              <img
                src="/images/comment.jpg"
                alt="additional comments from candidates"
              />
              <h3>
                Click candidates‘ faces for
                <br /> their additional comments
              </h3>
              <p>
                We painstakingly worked to encourage all candidates to
                participate. Our process is rigorous and some chose not to.
              </p>
              <p>
                We have done our best to speculate on the positions of
                candidates who did not answer to the best of our ability based
                on comments, traditional party positions, publicly available
                information, and input from engaged citizens.
              </p>
            </div>
          </div>
        </div>
        <div className="intro">
          <h2>
            <Link to="/compare-legislators">
              Compare all area legislators »
            </Link>
            <Link to="/compare-commissioners">
              Compare all area commissioners »
            </Link>
          </h2>
        </div>
        <h1>Candidate engagement overview</h1>
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
