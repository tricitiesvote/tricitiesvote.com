import React from 'react';

const CandidateEngagement = props => {
  const { engagement } = props;

  return (
    <>
      {engagement ? (
        <div className="engagement">
          <h4>Engagement:</h4>
          <div
            dangerouslySetInnerHTML={{
              __html: engagement,
            }}
          />
        </div>
      ) : (
        ''
      )}
    </>
  );
};

export default CandidateEngagement;
