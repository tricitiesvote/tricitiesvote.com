import React from 'react';
import CompareCandidateStatement from '../CompareCandidateStatement';

const KimLehrman = ({ says }) => {
  return (
    <CompareCandidateStatement
      position="franklin-1"
      name="Kim Lehrman"
      last="Lehrman"
      image="/images/candidates/kim-lehrman.jpeg"
      comment={says}
    />
  );
};

export default KimLehrman;
