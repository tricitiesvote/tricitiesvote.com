import React from 'react';

const CompareCandidateStatement = props => {
  return (
    <div class=`pos ${candidate.jurisdiction} ${candidate.position}`>
      <img alt={candidate.name} src={candidate.image}>
      <h5>{candidate.lastname}</h5>
      <div class="more">
        <span class="close"></span>
        <p class="comment">{candidate.statement.comment}</p>
      </div>
    </div>
  )
}

export default CompareCandidateStatement;
