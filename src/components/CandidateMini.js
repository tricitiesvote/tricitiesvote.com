import React from 'react';
import { Link } from 'gatsby';
import CandidateEngagement from './CandidateEngagement';

const CandidateMini = props => {
  const { slug, image, name, engagement } = props;
  const url = `/${slug}`;
  return (
    <div className="candidate candidate-mini">
      <Link to={url}>
        <img src={image} alt={name} />
      </Link>
      <h5>
        <Link to={url}>{name}</Link>
      </h5>
      <CandidateEngagement engagement={engagement} />
    </div>
  );
};

export default CandidateMini;
