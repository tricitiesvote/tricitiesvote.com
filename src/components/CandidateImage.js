import React from 'react';
import { Link } from 'gatsby';

const CandidateImage = props => {
  const { slug, image, name } = props;
  const url = `/${slug}`;
  return (
    <Link to={url}>
      <img src={image} alt={name} />
    </Link>
  );
};

export default CandidateImage;
