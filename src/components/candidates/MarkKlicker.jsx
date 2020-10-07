import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const MarkKlicker = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-rep1"
      name="Mark Klicker"
      last="Klicker"
      image="/images/candidates/mark-klicker.jpeg"
      comment={says}
    />
  )
}

export default MarkKlicker;
