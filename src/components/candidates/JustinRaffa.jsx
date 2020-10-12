import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const JustinRaffa = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="benton-1"
      name="Justin Raffa"
      last="Raffa"
      image="/images/candidates/justin-raffa.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default JustinRaffa;
