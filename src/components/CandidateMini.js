import React from 'react';
import { Link } from 'gatsby';

const CandidateMini = props => {
  const { slug, image, name } = props;
  const url = `/${slug}`;
  return (
    <div className="candidate candidate-mini">
      <Link to={url}>
        <img src={image} alt={name} />
      </Link>
      <h5>
        <Link to={url}>{name}</Link>
      </h5>
    </div>
  );
};

export default CandidateMini;
