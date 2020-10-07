import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DanielleGarbeReser = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-senator"
      name="Danielle Garbe Reser"
      last="Reser"
      image="/images/candidates/danielle-garbe-reser.jpeg"
      comment={says}
    />
  )
}

export default DanielleGarbeReser;
