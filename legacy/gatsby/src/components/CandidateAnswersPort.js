import React from 'react';

const CandidateAnswersPort = ({ answers }) => {
  const {
    question_1,
    question_8,
    question_9,
    question_10,
    question_11,
    question_12,
  } = answers;
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
      {question_1 ? (
        <div className="q-and-a">
          <h5>Question 8</h5>
          <p>{question_8}</p>
        </div>
      ) : (
        ''
      )}
      {question_1 ? (
        <div className="q-and-a">
          <h5>Question 9</h5>
          <p>{question_9}</p>
        </div>
      ) : (
        ''
      )}
      {question_1 ? (
        <div className="q-and-a">
          <h5>Question 10</h5>
          <p>{question_10}</p>
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

export default CandidateAnswersPort;
