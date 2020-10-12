import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const BrettBorden = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa9-rep1"
      name="Brett Borden"
      last="Borden"
      image="/images/candidates/brett-borden.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default BrettBorden;
