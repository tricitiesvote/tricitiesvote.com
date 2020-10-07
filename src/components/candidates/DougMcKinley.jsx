import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DougMcKinley = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="congress"
      name="Doug McKinley"
      last="McKinley"
      image="/images/candidates/doug-mckinley.jpeg"
      comment={says}
    />
  )
}

export default DougMcKinley;
