import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const ShirRegev = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa8-rep1"
      name="Shir Regev"
      last="Regev"
      image="/images/candidates/shir-regev.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default ShirRegev;
