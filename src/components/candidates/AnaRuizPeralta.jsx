import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const AnaRuizPeralta = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="franklin-2"
      name="Ana Ruiz Peralta"
      last="Peralta"
      image="/images/candidates/ana-ruiz-peralta.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default AnaRuizPeralta;
