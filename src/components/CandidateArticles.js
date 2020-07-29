import React from 'react';

const CandidateArticles = props => {
  const { articles } = props;

  return (
    <ul className="news">
      <li
        dangerouslySetInnerHTML={{
          __html: articles,
        }}
      />
    </ul>
  );
};

export default CandidateArticles;
