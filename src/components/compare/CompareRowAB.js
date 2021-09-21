import React from 'react';
import { StrongA, LeanA, LeanB, StrongB } from './statements';
import CompareCandidateStatement from './CompareCandidateStatement';

const CompareRowAB = ({statementA, statementB, response}) => {
  return (
    <tr>
      <th>
        <p>{statementA}</p>
      </th>
      <StrongA>
        {response.strongA.map(face => (
          <CompareCandidateStatement
            name={face.name}
            last={face.name.split(" ").pop()}
            image={face.img}
            comment={face.comment}
            mini
          />
        ))}
      </StrongA>
      <LeanA>
        {response.leanA.map(face => (
          <CompareCandidateStatement
            name={face.name}
            last={face.name.split(" ").pop()}
            image={face.img}
            comment={face.comment}
            mini
          />
        ))}
      </LeanA>
      <LeanB>
        {response.leanB.map(face => (
          <CompareCandidateStatement
            name={face.name}
            last={face.name.split(" ").pop()}
            image={face.img}
            comment={face.comment}
            mini
          />
        ))}
      </LeanB>
      <StrongB>
        {response.strongB.map(face => (
          <CompareCandidateStatement
            name={face.name}
            last={face.name.split(" ").pop()}
            image={face.img}
            comment={face.comment}
            mini
          />
        ))}
      </StrongB>
      <th>
        <p>{statementB}</p>
      </th>
    </tr>
  )
};

export default CompareRowAB;

// position="franklin-2"
// mini={mini}
// spec={spec}
// dnr={dnr}

// <CompareCandidateStatement
//   position="franklin-2"
//   name="Ana Ruiz Peralta"
//   last="Peralta"
//   image={face.img}
//   comment={says}
//   mini={mini}
//   spec={spec}
//   dnr={dnr}
// />

// <BrettBorden says="My concern with stimulus packages for businesses is the tendency for them to favor big businesses that don't need it while leaving independents in the rain and the people holding the check." />
// <MaryDye spec="true" dnr="true" />
// <SkylerRude spec="true" dnr="true" />