import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const AnaRuizPeralta = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="franklin-2"
      name="Ana Ruiz Peralta"
      last="Peralta"
      image="/images/candidates/ana-ruiz-peralta.jpeg"
      comment={says}
      mini={mini}
      spec={spec}
      dnr={dnr}
    />
  );
};

export default CandidateFace;
