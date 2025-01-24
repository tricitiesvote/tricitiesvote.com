import React from 'react';

const CandidateAnswersCouncil = ({ answers }) => {
  const { question_1, question_11, question_12 } = answers;

  return (
    <div className="answers">
      {question_1 ? (
        <div className="q-and-a">
          <h5>Question 1</h5>
          <p>{question_1}</p>
        </div>
      ) : (
        ''
      )}
      {question_11 ? (
        <div className="q-and-a">
          <h5>Question 11</h5>
          <p>{question_11}</p>
        </div>
      ) : (
        ''
      )}
      {question_12 ? (
        <div className="q-and-a">
          <h5>Question 12</h5>
          <p>{question_12}</p>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default CandidateAnswersCouncil;
