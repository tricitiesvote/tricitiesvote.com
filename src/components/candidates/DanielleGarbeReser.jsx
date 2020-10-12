import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DanielleGarbeReser = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="wa16-senator"
      name="Danielle Garbe Reser"
      last="Reser"
      image="/images/candidates/danielle-garbe-reser.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default DanielleGarbeReser;
