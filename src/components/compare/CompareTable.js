import React from 'react';
import _ from 'lodash';
import CompareRowAB from './CompareRowAB';
import sortComparisons from '../../helpers/sortComparisons';

const CompareTable = ({ questions, answers }) => {
  let rowData = null;
  if (answers && answers.length > 1) {
    const rowDataWithDuplicates = sortComparisons(questions, answers);
    rowData = _.uniqBy(rowDataWithDuplicates,'question')
    // console.log('rowData', rowData);
  } else {
    return '';
  }

  return (
    <>
      {rowData ? (
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
      ) : ''
      }
    </>
  );
};

export default CompareTable;
