import React from 'react';

const CompareCandidateStatement = props => {
  const { position, name, last, image, comment, spec, dnr, mini } = props;
  let posClass;
  if (spec && dnr) {
    posClass = `pos ${position} speculation dnr`;
  }
  if (spec && !dnr) {
    posClass = `pos ${position} speculation`;
  }
  if (!spec) {
    posClass = `pos ${position}`;
  }

  return (
    <div className={posClass}>
      <img alt={name} src={image} />
      {/* <img alt={name} src="/images/blank.png" /> */}
      <h5>{last}</h5>
      {!mini ? (
        <div className="more">
          <span className="close" />
          <p className="comment">{comment}</p>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default CompareCandidateStatement;
