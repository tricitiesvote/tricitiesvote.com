import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const MaryDye = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa9-rep1"
      name="Mary Dye"
      last="Dye"
      image="/images/candidates/mary-dye.jpeg"
      comment={says}
    />
  )
}

export default MaryDye;
