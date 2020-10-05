import React from 'react';
import CompareCandidateStatement from './CompareCandidateStatement';

const CompareStatements = props => {
  
  return (
    <tr>
      <th>Statement A</th>
        <td className="strong-a">
          <CompareCandidateStatement 
            jurisdiction="" position="" name="" lastname="" image="" comment=""
          />
        </td>
        <td className="lean-a">
          <CompareCandidateStatement 
            jurisdiction="" position="" name="" lastname="" image="" comment=""
        />
        </td>
        <td className="lean-b">
          <CompareCandidateStatement 
            jurisdiction="" position="" name="" lastname="" image="" comment=""
        />
        </td>
        <td className="strong-b">
          <CompareCandidateStatement 
            jurisdiction="" position="" name="" lastname="" image="" comment=""
        />
        </td>
      <th>Statement B</th>
    </tr>
  )
  
}

export default CompareStatements;
