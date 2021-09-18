import React from 'react';

const CandidateLetters = props => {
  const { yes, no } = props;

  return (
    <ul className="recs">
      {yes ? (
        <li
          className="yes"
          dangerouslySetInnerHTML={{
            __html: yes,
          }}
        />
      ) : (
        ''
      )}
      {no ? (
        <li
          className="no"
          dangerouslySetInnerHTML={{
            __html: no,
          }}
        />
      ) : (
        ''
      )}
    </ul>
  );
};

export default CandidateLetters;
