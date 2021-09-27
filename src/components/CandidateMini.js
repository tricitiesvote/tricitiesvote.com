import React from 'react';
import { Link } from 'gatsby';
import CandidateEngagement from './CandidateEngagement';
import CandidateDonorSummaryMini from './CandidateDonorSummaryMini';

const CandidateMini = props => {
  const { slug, image, name, engagement, fundraising } = props;
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
      {fundraising ? (
        <CandidateDonorSummaryMini fundraising={fundraising} />
      ) : (
        <div className="donor-summary">
          <p>No donor data reported</p>
        </div>
      )}
      <Link className="fullLink" to={url}>
        See full profile »
      </Link>
    </div>
  );
};

export default CandidateMini;
