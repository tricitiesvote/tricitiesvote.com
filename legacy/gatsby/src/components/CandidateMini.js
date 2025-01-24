import React from 'react';
import { Link } from 'gatsby';
import CandidateEngagement from './CandidateEngagement';
import CandidateEndorsements from './CandidateEndorsements';
import CandidateDonorSummaryMini from './CandidateDonorSummaryMini';

const CandidateMini = props => {
  const {
    slug,
    image,
    name,
    engagement,
    fundraising,
    endorsements,
    minifiler,
  } = props;

  // console.log('props', props);
  const url = `/${slug}`;
  return (
    <div className="candidate candidate-mini">
      {/* <pre><code>{JSON.stringify(fundraising,null,2)}</code></pre> */}
      <Link to={url}>
        <img src={image} alt={name} />
      </Link>
      <h5>
        <Link to={url}>{name}</Link>
      </h5>
      {engagement ? <CandidateEngagement engagement={engagement} /> : ''}
      {fundraising && !minifiler ? (
        <CandidateDonorSummaryMini
          fundraising={fundraising}
          minifiler={minifiler}
          url={url}
        />
      ) : (
        ''
      )}
      {!fundraising || minifiler ? (
        <div className="donor-summary">
          <p>Self-funded / mini-filer</p>
        </div>
      ) : (
        ''
      )}
      <CandidateEndorsements endorsements={endorsements} />
      <Link className="fullLink" to={url}>
        View full profile »
      </Link>
    </div>
  );
};

export default CandidateMini;
