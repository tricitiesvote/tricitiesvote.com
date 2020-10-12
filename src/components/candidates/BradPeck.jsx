import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const BradPeck = ({ says, spec, mini }) => {
  return (
    <CompareCandidateStatement
      position="franklin-1"
      spec={spec}
      name="Brad Peck"
      last="Peck"
      image="/images/candidates/brad-peck.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default BradPeck;
