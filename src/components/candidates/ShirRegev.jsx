import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const ShirRegev = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa8-rep1"
      name="Shir Regev"
      last="Regev"
      image="/images/candidates/shir-regev.jpeg"
      comment={says}
    />
  )
}

export default ShirRegev;
