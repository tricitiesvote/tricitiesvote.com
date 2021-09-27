import React from 'react';

const CandidateEndorsements = ({ endorsements }) => {
  return (
    <div className="endorsements-summary">
      {endorsements ? (
        <>
          <ul className="recs">
            <h3>Endorsements and letters</h3>
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
    </div>
  );
};

export default CandidateEndorsements;
