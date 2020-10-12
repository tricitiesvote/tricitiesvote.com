import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const LarryStanley = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa8-rep2"
      name="Larry Stanley"
      last="Stanley"
      image="/images/candidates/larry-stanley.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default LarryStanley;
