import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const MattBoehnke = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa8-rep2"
      name="Matt Boehnke"
      last="Boehnke"
      image="/images/candidates/matt-boehnke.jpeg"
      comment={says}
    />
  )
}

export default MattBoehnke;
