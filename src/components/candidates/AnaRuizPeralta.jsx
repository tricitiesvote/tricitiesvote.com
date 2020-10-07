import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const AnaRuizPeralta = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="franklin-1"
      name="Ana Ruiz Peralta"
      last="Peralta"
      image="/images/candidates/ana-ruiz-peralta.jpeg"
      comment={says}
    />
  )
}

export default AnaRuizPeralta;
