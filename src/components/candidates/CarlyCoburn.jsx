import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const CarlyCoburn = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-rep2"
      name="Carly Coburn"
      last="Coburn"
      image="/images/candidates/carly-coburn.jpeg"
      comment={says}
    />
  )
}

export default CarlyCoburn;
