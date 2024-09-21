import React from 'react';
import generateAnswersPropTypes from '../helpers/generatePropTypes';

const CandidateAnswersCouncil = ({ answers }) => {
  if (!answers) {
    console.warn('CandidateAnswersCouncil: Missing answers data.');
    return null;
  }

  const { question_1, question_11, question_12 } = answers;

  if (question_1 || question_11 || question_12) {
    return (
      <div className="answers">
        {answers.map((answer, index) => (
          <div className="q-and-a">
            <h5>Question {index + 1}</h5>
            <p>{answer[`question_${index + 1}`]}</p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const councilQuestionKeys = [
  'question_1',
  'question_2',
  'question_3',
  'question_4',
  'question_4c',
  'question_5',
  'question_5c',
  'question_6',
  'question_6c',
  'question_7',
  'question_7c',
  'question_8',
  'question_8c',
  'question_9',
  'question_9c',
  'question_10',
  'question_10c',
  'question_11',
  'question_12',
];

CandidateAnswersCouncil.propTypes = {
  answers: generateAnswersPropTypes(councilQuestionKeys),
};

CandidateAnswersCouncil.defaultProps = {
  answers: [], // Defaults to an empty array if not provided
};

export default CandidateAnswersCouncil;
