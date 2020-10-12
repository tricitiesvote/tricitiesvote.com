import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const DavePetersen = ({ says, mini }) => {
  return (
    <CompareCandidateStatement
      position="superior-court"
      name="Dave Petersen"
      last="Petersen"
      image="/images/candidates/dave-petersen.jpeg"
      comment={says}
      mini={mini}
    />
  );
};

export default DavePetersen;
