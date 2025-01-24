import React from 'react';

const CandidateArticles = props => {
  const { articles } = props;

  return (
    <div
      className="news"
      dangerouslySetInnerHTML={{
        __html: articles,
      }}
    />
  );
};

export default CandidateArticles;
