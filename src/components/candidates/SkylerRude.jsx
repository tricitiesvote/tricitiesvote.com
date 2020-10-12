import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const SkylerRude = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa16-rep2"
      name="Skyler Rude"
      last="Rude"
      image="/images/candidates/skyler-rude.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default SkylerRude;
