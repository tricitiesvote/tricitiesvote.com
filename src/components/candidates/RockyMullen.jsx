import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const RockyMullen = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="franklin-2"
      name="Rocky Mullen"
      last="Mullen"
      image="/images/candidates/rocky-mullen.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default RockyMullen;
