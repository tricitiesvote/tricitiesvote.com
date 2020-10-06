import React from 'react';
import { BradPeck, KimLehrman } from './candidates';
import { StrongA, StrongB, LeanA, LeanB } from './statements';

const CompareStatements = props => {
  
  return (
    <tr>
      <th>Statement A</th>
      <StrongA>
        <BradPeck says="hello" />
      </StrongA>
      <LeanA>
        <KimLehrman says="howdy" />
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>Statement B</th>
    </tr>    
  )

}

export default CompareStatements;
