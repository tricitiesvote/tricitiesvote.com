import React from 'react';
import { StrongA, LeanA, LeanB, StrongB } from './statements';

const CompareRowAB = () => {
  return (
    <tr>
      <th>
        <p>{statementA}</p>
      </th>
      <StrongA>
      </StrongA>
      <LeanA>
        <BrettBorden says="My concern with stimulus packages for businesses is the tendency for them to favor big businesses that don't need it while leaving independents in the rain and the people holding the check." />
        <MaryDye spec="true" dnr="true" />
        <SkylerRude spec="true" dnr="true" />
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>
        <p>{statementB}</p>
      </th>
    </tr>
  )
};

export default CompareRowAB;