import React from 'react';
import { graphql, Link } from 'gatsby';
import CandidateInfo from './CandidateInfo';
import CandidateBody from './CandidateBody';
import CandidateExcerpt from './CandidateExcerpt';
import CandidateLetters from './CandidateLetters';
import CandidateArticles from './CandidateArticles';
import CandidateEngagement from './CandidateEngagement';
import CandidateDonorSummary from './CandidateDonorSummary';
import CandidateDonorSummaryMini from './CandidateDonorSummaryMini';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const md = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const Candidate = props => {
  // TODO: re-add { donors } and var donorsHtml
  const { fullsize } = props;
  const { data } = props;
  const {
    id,
    name,
    image,
    email,
    website,
    facebook,
    twitter,
    instagram,
    youtube,
    pdc_url,
    pamphlet_url,
    fields,
  } = data;

  const {
    slug,
    bio_html,
    body_html,
    body_excerpt_html,
    statement_html,
    engagement_html,
    statement_excerpt_html,
    lettersyes_html_nowrap,
    lettersno_html_nowrap,
    articles_html_nowrap,
    fundraising,
  } = fields;

  const url = `/${slug}`;

  return (
    <div className="candidate" key={id}>
      {/* <pre><code>{JSON.stringify(props,null,2)}</code></pre> */}
      <div className="details">
        <h5>
          <Link to={url}>{name}</Link>
        </h5>
        {bio_html && !fullsize ? <CandidateBody body={bio_html} /> : ''}
        {!bio_html && fullsize ? <CandidateBody body={statement_html} /> : ''}
        {!bio_html && !fullsize ? (
          <CandidateExcerpt url={url} excerpt={statement_excerpt_html} />
        ) : (
          ''
        )}
        {engagement_html ? (
          <CandidateEngagement engagement={engagement_html} />
        ) : (
          ''
        )}
        <CandidateLetters
          yes={lettersyes_html_nowrap}
          no={lettersno_html_nowrap}
        />
        {articles_html_nowrap ? (
          <CandidateArticles articles={articles_html_nowrap} />
        ) : (
          ''
        )}
        {!fullsize ? (
          <div>
            <CandidateBody body={body_excerpt_html} />
            <CandidateDonorSummaryMini fundraising={fundraising} />
            <p><Link to={url}>See full candidate donor details »</Link></p>
          </div>
      ) : (
        ''
      )}
      </div>
      <div className="info">
        <CandidateInfo
          slug={slug}
          name={name}
          image={image}
          email={email}
          website={website}
          facebook={facebook}
          twitter={twitter}
          instagram={instagram}
          youtube={youtube}
          pdc={pdc_url}
          pamphlet={pamphlet_url}
        />
      </div>
      {fullsize ? (
        <div className="candidate-content">
          <CandidateBody body={body_html} />
          <CandidateDonorSummary fundraising={fundraising} />
        </div>
      ) : ( ''
      )}
    </div>
  );
};

export default Candidate;

export const pageQuery = graphql`
  fragment OfficeDetails on OfficesJson {
    title
    job
    position
    region
    uuid
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
        id
        unique_donors
        total_raised
        total_cash
        total_in_kind
        donors {
          id
          name
          city
          type
          donations_count
          total_donated
          total_cash
          total_in_kind
          donations {
            donation_type
            party
            cash
            detail
            report
            amount
            date
          }
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
    articles
    engagement
    uuid
    hide
  }
`;
