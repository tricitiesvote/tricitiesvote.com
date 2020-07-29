import React from 'react';
import { Link } from 'gatsby';

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
      {!no && !yes ? (
        <li className="yes">
          No letters yet. <Link to="/letters">Write one</Link>.
        </li>
      ) : (
        ''
      )}
    </ul>
  );
};

export default CandidateLetters;
