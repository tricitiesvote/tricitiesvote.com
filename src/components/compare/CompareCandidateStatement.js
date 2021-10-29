import React from 'react';
import { kebabCase } from 'lodash';

const handleClick = e => {
  e.currentTarget.classList.toggle('show');
};

const CompareCandidateStatement = props => {
  const { position, name, last, image, comment, spec, dnr, mini } = props;
  let posClass;
  const p = kebabCase(position)
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
    <div
      className={posClass}
      onClick={handleClick}
    >
      <img alt={name} src={image} />
      <h5>{last}</h5>
        <div className="more">
          <span className="close" />
          <p className="says">{comment}</p>
        </div>
    </div>
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
