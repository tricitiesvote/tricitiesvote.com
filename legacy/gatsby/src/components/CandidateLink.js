import React from 'react';

const CandidateLink = props => {
  const { title, link, emoji, emojilabel } = props;
  return (
    <li>
      <span role="img" aria-label={emojilabel}>
        {emoji}
      </span>
      <a href={link} target="_blank" rel="noreferrer">
        {title}
      </a>
    </li>
  );
};

export default CandidateLink;
