import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import CompareTable from './CompareTable';

const CompareSchoolBoardCandidates = ({ questions, answers }) => {
  console.log('CompareSchoolBoardCandidates', data);
  return <CompareTable questions={questions} answers={answers} />;
};

export default CompareSchoolBoardCandidates;
