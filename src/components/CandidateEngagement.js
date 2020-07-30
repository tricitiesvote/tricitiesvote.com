import React from 'react';

const CandidateEngagement = props => {
  const { engagement } = props;

  return (
    <p
      className="engagement"
      dangerouslySetInnerHTML={{
        __html: engagement,
      }}
    />
  );
};

export default CandidateEngagement;
