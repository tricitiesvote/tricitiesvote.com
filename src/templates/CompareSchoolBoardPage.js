import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import CompareTable from '../components/compare/CompareTable';

const CompareSchoolBoardPage = ({ data }) => {
  const { allQs, allAs } = data;

  const questions = allQs.edges;
  const answers = allAs.edges;

  console.log('data', data);

  return (
    <DefaultLayout
      pageTitle="School Board Candidate Compare-o-Tron™"
      preview="compare-temp.png"
      url="compare-temp"
    >
      <CompareHeader />
      <CompareTable questions={questions} answers={answers} />
    </DefaultLayout>
  );
};

export default CompareSchoolBoardPage;
