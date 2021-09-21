import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
// import CompareRowAB from '../components/compare/CompareRowAB';
// <CompareRowAB candidates questions />
// import CompareLegislators from '../components/compare/CompareLegislators';
// import CompareLegislatorsKey from '../components/compare/CompareKey';

// iterate through questions
// get all AB questions 

const CompareCouncil = ({data}) => {
  
  const { allCouncilQuestionsCsv, allCouncilAnswersCsv } = data;
  
  const questions = allCouncilQuestionsCsv.edges;
  const answers = allCouncilAnswersCsv.edges;
  
  console.log('questions', questions);
  console.log('answers', answers);
  
  for (const question of questions) {
    const q = question.node;
    console.log(q.type);
    if (q.type === 'AB') {
      console.log('Statement A:', q.statementA);
      console.log('Statement B:', q.statementB);
    }
  }
  
  return (
    <DefaultLayout
      pageTitle="TEMP Candidate Compare-o-Tron™"
      preview="compare-temp.png"
      url="compare-temp"
    >
    
      
    </DefaultLayout>
  );
}

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
  allCouncilAnswersCsv {
    edges {
      node {
        candidate {
          name
          image
        }
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
