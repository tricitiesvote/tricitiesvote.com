import React from 'react';

const CompareHeader = props => {
  return (
    <div className="tw-compare-o-tron">
      <h1>
        <span className="fire-up">Let's fire up the ole</span>
        <span className="tw-sub">Candidate Compare-o-Tron™</span>
      </h1>
      {props.children ? props.children : ''}
    </div>
  );
};

export default CompareHeader;
