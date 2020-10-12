import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const BradKlippert = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa8-rep1"
      name="Brad Klippert"
      last="Klippert"
      image="/images/candidates/brad-klippert.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default BradKlippert;
