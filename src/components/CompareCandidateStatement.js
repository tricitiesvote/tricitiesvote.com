import React from 'react';
// import _ from 'lodash';

const handleClick = e => {
  e.currentTarget.classList.toggle('show');
};

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
    <div
      className={posClass}
      onClick={handleClick}
      onKeyPress={handleClick}
      role="switch"
      tabIndex="0"
      aria-checked="false"
    >
      <img alt={name} src={image} />
      <h5>{last}</h5>
      {!mini ? (
        <div className="more">
          <span className="close" />
          <p className="says">{comment}</p>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default CompareCandidateStatement;
