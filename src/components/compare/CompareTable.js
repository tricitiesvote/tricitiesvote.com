import React from 'react';
import _ from 'lodash';
import CompareRowAB from './CompareRowAB';
import sortComparisons from '../../helpers/sortComparisons';

const CompareTable = ({ questions, answers }) => {
  const rowDataWithDuplicates = sortComparisons(questions, answers);
  const rowData = _.uniqBy(rowDataWithDuplicates, 'question');
  // console.log('rowData', rowData);

  return (
    <>
      {answers && answers.length > 1 ? (
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
