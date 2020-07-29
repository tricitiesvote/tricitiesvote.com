import React from 'react';
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

  return (
    <fragment>
      <CandidateImage slug={slug} name={name} image={image} />
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
    </fragment>
  );
};

export default CandidateInfo;
