import React from 'react';

const CompareStatements = props => {
  
  return (
    <tr>
      <th>{statementA}</th>
        <td className="strong-a">
          // map matching candidate statements here
          <CompareCandidateStatement candidate={} question={} />
        </td>
        <td className="lean-a>
          // map matching candidate statements here
          <CompareCandidateStatement candidate={} question={} />
        </td>
        <td className="lean-b">
          // map matching candidate statements here
          <CompareCandidateStatement candidate={} question={} />
        </td>
        <td className="strong-b">
          // map matching candidate statements here
          <CompareCandidateStatement candidate={} question={} />
        </td>
      <th>{statementB}</th>
    </tr>
  )
  
}

export default CompareStatements;
