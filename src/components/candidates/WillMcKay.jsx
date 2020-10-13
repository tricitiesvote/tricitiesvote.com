import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const WillMcKay = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="benton-3"
      name="Will McKay"
      last="McKay"
      image="/images/candidates/will-mckay.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default WillMcKay;
