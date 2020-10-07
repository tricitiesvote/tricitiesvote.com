import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const SharonBrown = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="superior-court"
      name="Sharon Brown"
      last="Brown"
      image="/images/candidates/sharon-brown.jpeg"
      comment={says}
    />
  )
}

export default SharonBrown;
