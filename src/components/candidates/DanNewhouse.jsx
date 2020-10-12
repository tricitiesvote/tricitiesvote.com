import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DanNewhouse = ({ says, spec, dnr, mini }) => {
  return (
    <CompareCandidateStatement
      position="congress"
      spec={spec}
      dnr={dnr}
      name="Dan Newhouse"
      last="Newhouse"
      image="/images/candidates/dan-newhouse.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default DanNewhouse;
