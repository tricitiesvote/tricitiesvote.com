import React from 'react';
import { Link } from 'gatsby';

const CandidateExcerpt = props => {
  const { url, excerpt } = props;
  return (
    <div className="candidate-bio excerpt">
      <div
        dangerouslySetInnerHTML={{
          __html: excerpt,
        }}
      />
      <Link className="candidate-link" to={url}>
        More »
      </Link>
    </div>
  );
};

export default CandidateExcerpt;
