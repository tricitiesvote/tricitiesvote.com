import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const JeromeDelvin = ({ says, spec, mini }) => {
  return (
    <CompareCandidateStatement
      position="benton-1"
      name="Jerome Delvin"
      last="Delvin"
      image="/images/candidates/jerome-delvin.jpeg"
      comment={says}
      spec={spec}
      mini={mini}
    />
  );
};

export default JeromeDelvin;
