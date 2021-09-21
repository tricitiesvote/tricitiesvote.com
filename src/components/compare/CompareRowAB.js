import React from 'react';
import { StrongA, LeanA, LeanB, StrongB } from './statements';

const CompareRowAB = ({statementA, statementB, response}) => {
  return (
    <tr>
      <th>
        <p>{statementA}</p>
      </th>
      <StrongA>
        {response.strongA.map(face => (
          <img width="30px" height="30px" src={face.img} title={face.comment} />
        ))}
      </StrongA>
      <LeanA>
        {response.leanA.map(face => (
          <img width="30px" height="30px" src={face.img} title={face.comment} />
        ))}
      </LeanA>
      <LeanB>
        {response.leanB.map(face => (
          <img width="30px" height="30px" src={face.img} title={face.comment} />
        ))}
      </LeanB>
      <StrongB>
        {response.strongB.map(face => (
          <img width="30px" height="30px" src={face.img} title={face.comment} />
        ))}
      </StrongB>
      <th>
        <p>{statementB}</p>
      </th>
    </tr>
  )
};

export default CompareRowAB;


// <BrettBorden says="My concern with stimulus packages for businesses is the tendency for them to favor big businesses that don't need it while leaving independents in the rain and the people holding the check." />
// <MaryDye spec="true" dnr="true" />
// <SkylerRude spec="true" dnr="true" />