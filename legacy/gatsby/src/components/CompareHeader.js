import React from 'react';

const CompareHeader = ({ children }) => {
  return (
    <div className="tw-compare-o-tron">
      <h1>
        <span className="fire-up">Let&rsquo;s fire up the ole</span>
        <span className="tw-sub">Candidate Compare-o-Tron™</span>
      </h1>
      {children || ''}
    </div>
  );
};

export default CompareHeader;
