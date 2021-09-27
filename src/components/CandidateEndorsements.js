import React from 'react';

const CandidateEndorsements = ({ endorsements }) => {
  return (
    <>
      {endorsements ? (
        <>
          <ul className="recs">
            <h3>Endorsements and letters</h3>
            <p>
              <em>Written</em> letters describing why people support or oppose
              the candidate.
            </p>
            {endorsements.map(e => (
              <>
                {e.forAgainst === 'for' ? (
                  <li className="yes">
                    <a href={e.url}>{e.endorser}</a>
                  </li>
                ) : (
                  ''
                )}
                {e.forAgainst === 'against' ? (
                  <li className="no">
                    <a href={e.url}>{e.endorser}</a>
                  </li>
                ) : (
                  ''
                )}
              </>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h3>Endorsements and letters</h3>
          <p>No letters of support or opposition listed yet.</p>
        </>
      )}
    </>
  );
};

export default CandidateEndorsements;
