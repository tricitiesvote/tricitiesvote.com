import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const MattBoehnke = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa8-rep2"
      name="Matt Boehnke"
      last="Boehnke"
      image="/images/candidates/matt-boehnke.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default MattBoehnke;
