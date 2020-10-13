import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const JimBeaver = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="benton-3"
      name="Jim Beaver"
      last="Beaver"
      image="/images/candidates/james-r-beaver.jpeg"
      comment={says}
      dnr={dnr}
      spec={spec}
      mini={mini}
    />
  );
};

export default JimBeaver;
