import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const JeromeDelvin = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="benton-1"
      name="Jerome Delvin"
      last="Delvin"
      image="/images/candidates/jerome-delvin.jpeg"
      comment={says}
    />
  )
}

export default JeromeDelvin;
