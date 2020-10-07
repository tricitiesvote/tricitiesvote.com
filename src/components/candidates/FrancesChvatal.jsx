import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const FrancesChvatal = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-rep1"
      name="Frances Chvatal"
      last="Chvatal"
      image="/images/candidates/frances-chvatal.jpeg"
      comment={says}
    />
  )
}

export default FrancesChvatal;
