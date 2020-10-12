import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const PerryDozier = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa16-senator"
      name="Perry Dozier"
      last="Dozier"
      image="/images/candidates/perry-dozier.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default PerryDozier;
