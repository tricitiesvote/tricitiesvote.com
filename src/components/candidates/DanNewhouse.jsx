import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DanNewhouse = ({says}) => {
  
  return (
    <CompareCandidateStatement 
      position="congress"
      name="Dan Newhouse"
      last="Newhouse"
      image="/images/candidates/dan-newhouse.jpeg"
      comment={says}
    />
  )
}

export default DanNewhouse;
