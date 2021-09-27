import React from 'react';

const CandidateEndorsements = ({ endorsements }) => {
  return (
    <>
      {endorsements ? (
        <>
          <h2>Endorsements and letters to the editor</h2>
          <p>
            <em>Written</em> letters describing why people support or oppose the
            candidate.
          </p>
          <ul className="recs">
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
          <h3>Endorsements and letters to the editor</h3>
          <p>
            We collect <em>written</em> letters describing why people support or
            oppose the candidate. This candidate does not have any listed yet.
          </p>
        </>
      )}
    </>
  );
};

export default CandidateEndorsements;
