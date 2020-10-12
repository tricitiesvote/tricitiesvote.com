import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const MaryDye = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa9-rep1"
      name="Mary Dye"
      last="Dye"
      image="/images/candidates/mary-dye.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default MaryDye;
