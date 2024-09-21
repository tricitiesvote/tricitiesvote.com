import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import CompareTable from '../components/compare/CompareTable';

const CompareCityCouncilPage = ({ data }) => {
  const { allQs, allAs } = data;

  if (!allQs || !allAs) {
    console.warn('CompareCityCouncilPage: Missing questions or answers data.');
    return (
      <DefaultLayout
        pageTitle="City Council Candidate Compare-o-Tron™"
        preview="compare-temp.png"
        url="compare-temp"
      >
        <CompareHeader />
        <p>Comparison data is currently unavailable.</p>
      </DefaultLayout>
    );
  }

  const questions = allQs.edges;
  const answers = allAs.edges;

  return (
    <DefaultLayout
      pageTitle="City Council Candidate Compare-o-Tron™"
      preview="compare-temp.png"
      url="compare-temp"
    >
      <CompareHeader />
      <CompareTable questions={questions} answers={answers} />
    </DefaultLayout>
  );
};

export default CompareCityCouncilPage;
