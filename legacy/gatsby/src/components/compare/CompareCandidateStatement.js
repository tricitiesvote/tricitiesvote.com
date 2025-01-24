import React from 'react';
import { kebabCase } from 'lodash';

const handleClick = e => {
  e.currentTarget.classList.toggle('show');
};

const handleKeyDown = e => {
  if (e.keyCode === 13) {
    handleClick();
  }
};

const CompareCandidateStatement = props => {
  const { position, name, last, image, comment, spec, dnr } = props;
  let posClass;
  const p = kebabCase(position);
  if (spec && dnr) {
    posClass = `pos ${p} speculation dnr`;
  }
  if (spec && !dnr) {
    posClass = `pos ${p} speculation`;
  }
  if (!spec) {
    posClass = `pos ${p}`;
  }

  return (
    <button
      type="button"
      className={posClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img alt={name} src={image} />
      <h5>{last}</h5>
      <div className="more">
        <span className="close" />
        <p className="says">{comment}</p>
      </div>
    </button>
  );
};

export default CompareCandidateStatement;

// {!mini ? (
//   <div className="more">
//     <span className="close" />
//     <p className="says">{comment}</p>
//   </div>
// ) : (
//   ''
// )}
