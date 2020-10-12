import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DougMcKinley = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="congress"
      name="Doug McKinley"
      last="McKinley"
      image="/images/candidates/doug-mckinley.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default DougMcKinley;
