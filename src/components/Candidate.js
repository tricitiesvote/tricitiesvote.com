import React from 'react';
import { Link } from 'gatsby';
import CandidateInfo from './CandidateInfo';
import CandidateBody from './CandidateBody';
import CandidateExcerpt from './CandidateExcerpt';
import CandidateArticles from './CandidateArticles';
import CandidateEngagement from './CandidateEngagement';
import CandidateEndorsements from './CandidateEndorsements';
import CandidateDonorSummary from './CandidateDonorSummary';
import CandidateDonorSummaryMini from './CandidateDonorSummaryMini';
import CandidateAnswersCouncil from './CandidateAnswersCouncil';
import CandidateAnswersSchool from './CandidateAnswersSchool';
import CANDIDATE from '../../graphql/CANDIDATE';

const Candidate = props => {
  // console.log(props);
  // TODO: re-add { donors } and var donorsHtml
  const { fullsize, data, children } = props;
  const {
    uuid,
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
    endorsements,
    minifiler,
  } = data;

  const {
    slug,
    bio_html,
    body_html,
    body_excerpt_html,
    statement_html,
    engagement_html,
    statement_excerpt_html,
    articles_html,
    fundraising,
    school_answers,
    council_answers,
  } = fields;

  // console.log('fields', fields);
  // console.log('council_answers', council_answers);
  // console.log('school_answers', school_answers);

  const url = `/${slug}`;

  return (
    <>
      <div className="candidate" key={uuid}>
        {/* <pre>
          <code>{JSON.stringify(props, null, 2)}</code>
        </pre> */}
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
          <CandidateEndorsements endorsements={endorsements} />
          {articles_html ? <CandidateArticles articles={articles_html} /> : ''}
          {!fullsize ? (
            <div>
              <CandidateBody body={body_excerpt_html} />
              <CandidateDonorSummaryMini
                fundraising={fundraising}
                minifiler={minifiler}
              />
            </div>
          ) : (
            ''
          )}
          <p>
            <a href={url}>See full candidate details »</a>
          </p>
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
            <pre>{JSON.stringify(council_answers, null, 2)}</pre>
            {school_answers ? (
              <CandidateAnswersSchool answers={school_answers} />
            ) : (
              ''
            )}
            {council_answers ? (
              <CandidateAnswersCouncil answers={council_answers} />
            ) : (
              ''
            )}
            <CandidateDonorSummary
              fundraising={fundraising}
              slug={slug}
              minifiler={minifiler}
            />
          </div>
        ) : (
          ''
        )}
      </div>
      {children || ''}
    </>
  );
};

export default Candidate;

export const pageQuery = CANDIDATE;
