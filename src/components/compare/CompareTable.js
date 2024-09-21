import React from 'react';
import _ from 'lodash';
import CompareRowAB from './CompareRowAB';
import sortComparisons from '../../helpers/sortComparisons';

const CompareTable = ({ questions, answers }) => {
  if (!questions || !answers) {
    console.warn('CompareTable: Missing questions or answers data.');
    return null; // TODO: Optionally, render a placeholder message
  }
  const rowDataWithDuplicates = sortComparisons(questions, answers);
  const rowData = _.uniqBy(rowDataWithDuplicates, 'question');
  // console.log('rowData', rowData);

  if (rowData.length === 0) {
    return '';
  }

  return (
    <>
      {answers && answers.length > 0 ? (
        <table>
          <thead>
            <tr className="key">
              <th>Statement A</th>
              <th>Strong A</th>
              <th>Lean A</th>
              <th>Lean B</th>
              <th>Strong B</th>
              <th>Statement B</th>
            </tr>
          </thead>
          <tbody>
            {rowData.map(row => (
              <CompareRowAB
                key={row.question}
                statementA={row.statementA}
                statementB={row.statementB}
                response={row.response}
              />
            ))}
          </tbody>
        </table>
      ) : (
        ''
      )}
    </>
  );
};

export default CompareTable;
