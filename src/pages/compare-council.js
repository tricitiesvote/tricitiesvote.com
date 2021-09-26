import React from 'react';
import _ from 'lodash';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareTable from '../components/compare/CompareTable';

const CompareCouncil = ({ data }) => {
  const { allCouncilQuestionsCsv, allCouncilAnswersCsv } = data;

  const questions = allCouncilQuestionsCsv.edges;
  const answers = allCouncilAnswersCsv.edges;

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

// allCouncilAnswersCsv(
//   filter: { region: { eq: "Kennewick" }, position: { eq: "1" } }
// ) {

export const pageQuery = graphql`
  query {
    allCouncilQuestionsCsv {
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
    allCouncilAnswersCsv(filter: { region: { eq: "Richland" } }) {
      edges {
        node {
          candidate {
            name
            image
            office {
              fields {
                slug
              }
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

export default CompareCouncil;
