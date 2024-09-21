import React from 'react';
import generateAnswersPropTypes from '../helpers/generatePropTypes';

const CandidateAnswersSchool = ({ answers }) => {
  if (!answers) {
    console.warn('CandidateAnswersCouncil: Missing answers data.');
    return null;
  }

  const {
    question_1,
    question_8,
    question_9,
    question_10,
    question_11,
    question_12,
  } = answers;

  if (
    question_1 ||
    question_8 ||
    question_9 ||
    question_10 ||
    question_11 ||
    question_12
  ) {
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

const schoolQuestionKeys = [
  'question_1',
  'question_8',
  'question_9',
  'question_10',
  'question_11',
  'question_12',
];

CandidateAnswersSchool.propTypes = {
  answers: generateAnswersPropTypes(schoolQuestionKeys),
};

CandidateAnswersSchool.defaultProps = {
  answers: [], // Defaults to an empty array if not provided
};

export default CandidateAnswersSchool;
