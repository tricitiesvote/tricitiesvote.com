import React from 'react';
import { graphql } from 'gatsby';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareTable from '../components/compare/CompareTable';

const CompareAllCouncil = ({ data }) => {
  const { allQs, allAs } = data;

  console.log('data', data);

  const questions = allQs.edges;
  const answers = allAs.edges;

  return (
    <DefaultLayout
      pageTitle="TEMP Candidate Compare-o-Tron™"
      preview="compare-temp.png"
      url="compare-temp"
    >
      <CompareTable questions={questions} answers={answers} />
    </DefaultLayout>
  );
};

export const pageQuery = graphql`
  query {
    allQs: allCouncilQuestionsCsv {
      edges {
        node {
          question
          statementA
          statementB
          type
          id
        }
      }
    }
    allAs: allCouncilAnswersCsv {
      edges {
        node {
          candidate {
            name
            image
            uuid
            fields {
              slug
            }
            office {
              title
              position
              region
            }
          }
          region
          position
          question_1
          question_2
          question_2c
          question_3
          question_3c
          question_4
          question_4c
          question_5
          question_5c
          question_6
          question_6c
          question_7
          question_7c
          question_8
          question_8c
          question_9
          question_9c
          question_10
          question_10c
          question_11
          question_12
        }
      }
    }
  }
`;

export default CompareAllCouncil;
