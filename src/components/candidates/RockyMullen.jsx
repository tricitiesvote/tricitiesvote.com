import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const RockyMullen = ({ says }) => {
  return (
    <CompareCandidateStatement
      position="franklin-2"
      name="Rocky Mullen"
      last="Mullen"
      image="/images/candidates/rocky-mullen.jpeg"
      comment={says}
    />
  );
};

export default RockyMullen;
