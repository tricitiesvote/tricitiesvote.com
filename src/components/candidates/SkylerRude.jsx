import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const SkylerRude = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="wa16-rep2"
      name="Skyler Rude"
      last="Rude"
      image="/images/candidates/skyler-rude.jpeg"
      comment={says}
    />
  )
}

export default SkylerRude;
