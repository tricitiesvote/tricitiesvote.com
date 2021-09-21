import React from 'react';
import DefaultLayout from '../layouts/DefaultLayout';
import CompareHeader from '../components/CompareHeader';
import _ from 'lodash';
import CompareRowAB from '../components/compare/CompareRowAB';
// <CompareRowAB candidates questions />
// import CompareLegislators from '../components/compare/CompareLegislators';
// import CompareLegislatorsKey from '../components/compare/CompareKey';

// iterate through questions
// get all AB questions 

const CompareCouncil = ({data}) => {
  
  const { allCouncilQuestionsCsv, allCouncilAnswersCsv } = data;
  
  const questions = allCouncilQuestionsCsv.edges;
  const answers = allCouncilAnswersCsv.edges;
  
  // console.log('questions', questions);
  // console.log('answers', answers);
  
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
      // console.log('q', q)
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
    const qId = "question_" + abQ.id;
    const cId = qId + "c";
    // console.log('abQ.id', abQ.id)
    const strongA = [ ];
    const leanA = [ ];
    const leanB = [ ];
    const strongB = [ ];
    for (const candidateAnswers of answers) {
      const candidate = {
        name: candidateAnswers.node.candidate.name,
        img: candidateAnswers.node.candidate.image,
        comment: candidateAnswers.node[cId]
      }
      if (candidateAnswers.node[qId] === "1") {
        strongA.push(candidate);
      }
      if (candidateAnswers.node[qId] === "2") {
        leanA.push(candidate);
      }
      if (candidateAnswers.node[qId] === "3") {
        leanB.push(candidate);
      }
      if (candidateAnswers.node[qId] === "5") {
        strongB.push(candidate);
      }
    }
    // console.log('abQ.id', abQ.id)
    rowData.push({
      question: abQ.id,
      statementA: abQ.statementA,
      statementB: abQ.statementB,
      response: {
        strongA,
        leanA,
        leanB,
        strongB
      }
    })

    // console.log('rowData', rowData);
    // console.log(name, answer, comment);
  }
  
  
  return (
    <DefaultLayout
      pageTitle="TEMP Candidate Compare-o-Tron™"
      preview="compare-temp.png"
      url="compare-temp"
    >
    <table>
      <thead>
        <tr>
          <th>Statement A</th>
          <th>Strong A</th>
          <th>Lean A</th>
          <th>Lean B</th>
          <th>Strong B</th>
          <th>Statement B</th>
        </tr>
      </thead>
      <tbody>
        {rowData.map(row => (
          <CompareRowAB statementA={row.statementA} statementB={row.statementB} response={row.response} />
        ))}
      </tbody>
    </table>
      
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
