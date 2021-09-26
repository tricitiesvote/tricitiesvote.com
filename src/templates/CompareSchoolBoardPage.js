import React from 'react';
import _ from 'lodash';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareTable from '../components/compare/CompareTable';

const CompareSchoolBoardPage = ({ data }) => {
  const { allSchoolQuestionsCsv, allSchoolAnswersCsv } = data;

  const questions = allSchoolQuestionsCsv.edges;
  const answers = allSchoolAnswersCsv.edges;

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

// filter by region
// allCouncilAnswersCsv(
//   filter: { region: { eq: "Kennewick" } }) {

// filter by city and position
// allCouncilAnswersCsv(
//   filter: { region: { eq: "Kennewick" }, position: { eq: "1" } }) {

// filter by provided slug
// allCouncilAnswersCsv(filter: {candidate: {office: {fields: {slug: {eq: "kennewick-city-council-pos-1"}}}}}) {

export const pageQuery = graphql`
  query($slug: String!) {
    allSchoolQuestionsCsv {
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
    allSchoolAnswersCsv(
      filter: {
        candidate: { office: { fields: { regionslug: { eq: $slug } } } }
      }
    ) {
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
          question_9
          question_10
          question_11
          question_12
        }
      }
    }
  }
`;

export default CompareSchoolBoardPage;
