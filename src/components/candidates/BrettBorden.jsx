import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const BrettBorden = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa9-rep1"
      name="Brett Borden"
      last="Borden"
      image="/images/candidates/brett-borden.jpeg"
      comment={says}
    />
  )
}

export default BrettBorden;
