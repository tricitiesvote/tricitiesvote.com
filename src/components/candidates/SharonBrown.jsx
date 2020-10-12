import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const SharonBrown = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="superior-court"
      name="Sharon Brown"
      last="Brown"
      image="/images/candidates/sharon-brown.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default SharonBrown;
