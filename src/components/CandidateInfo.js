import React from 'react';
import { Link } from 'gatsby';
import CandidateLinkCollection from './CandidateLinkCollection';
import CandidateImage from './CandidateImage';

const CandidateInfo = props => {
  const {
    slug,
    image,
    name,
    email,
    website,
    facebook,
    twitter,
    instagram,
    youtube,
    pdc,
    pamphlet,
    notes,
  } = props;

  const url = `/${slug}`;

  return (
    <>
      <CandidateImage slug={slug} name={name} image={image} />
      <h5 className="candidate-image-name">
        <Link to={url}>{name}</Link>
      </h5>
      <CandidateLinkCollection
        slug={slug}
        email={email}
        website={website}
        facebook={facebook}
        twitter={twitter}
        instagram={instagram}
        youtube={youtube}
        pdc={pdc}
        pamphlet={pamphlet}
        notes={notes}
      />
    </>
  );
};

export default CandidateInfo;
