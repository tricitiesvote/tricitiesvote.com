import React from 'react';

const CandidateBody = props => {
  const { body } = props;
  return (
    <>
      {body ? (
        <div
          className="candidate-body"
          dangerouslySetInnerHTML={{
            __html: body,
          }}
        />
      ) : (
        ''
      )}
    </>
  );
};

export default CandidateBody;
