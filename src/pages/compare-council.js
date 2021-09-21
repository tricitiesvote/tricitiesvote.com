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
  
  const abQSet = [ ];  // a/b questions
  const tfQSet = [ ];  // true/false questions
  const oQSet  = [ ];  // open-ended questions

  const tfASet = [ ];  // true/false answers
  const oASet  = [ ];  // open-ended answers
  const cSet   = [ ];  // a/b comments
  
  for (const question of questions) {
    const q = question.node;
    if (q.type === 'Open') {
      oQSet.push(q)
    }
    if (q.type === 'AB') {
      abQSet.push(q)
    }
    if (q.type === 'TF') {
      tfQSet.push(q)
    }
  }
  
  // can we match a question with the answer?
  // make a list of question objects
  // make a list of answer objects
  
  // make a list of the questions in the answer set 
  // match up questions in answer set to question descriptions?
  
  // iterate through answers
  // build one row 
  
  const rowData = [];
  
  // iterate through a/b
  for (const abQ of abQSet) {
    const qname = "question_" + abQ.id;
    const abASet = [ ];  // a/b answers
    for (const candidateAnswers of answers) {
      abASet.push({
        name: candidateAnswers.node.candidate.name,
        img: candidateAnswers.node.candidate.img,
        answer: candidateAnswers.node.[qname],
        comment: candidateAnswers.node.[qname + "c"]
      })
    }
    rowData.push({
      [abQ.id]: abASet
    })

    console.log('rowData', rowData);
    // console.log(name, answer, comment);
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
