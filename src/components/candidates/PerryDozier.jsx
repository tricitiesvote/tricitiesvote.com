import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const PerryDozier = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-senator"
      name="Perry Dozier"
      last="Dozier"
      image="/images/candidates/perry-dozier.jpeg"
      comment={says}
    />
  )
}

export default PerryDozier;
