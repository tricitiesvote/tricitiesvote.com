const sortComparisons = (questions, answers) => {
  // console.log('questions', questions);
  const abQSet = []; // a/b questions
  // TODO: add TF / open-ended questions/answers
  // const tfQSet = []; // true/false questions
  // const oQSet = []; // open-ended questions

  // const tfASet = []; // true/false answers
  // const oASet = []; // open-ended answers

  questions.forEach(question => {
    const q = question.node;
    // if (q.type === 'Open') {
    //   oQSet.push(q);
    // }
    if (q.type === 'AB') {
      abQSet.push(q);
      // console.log('q', q)
    }
    // if (q.type === 'TF') {
    //   tfQSet.push(q);
    // }
  });

  const rowData = [];

  // iterate through a/b
  abQSet.forEach(abQ => {
    const qId = `question_${abQ.id}`;
    const cId = `${qId}c`;
    // console.log('abQ.id', abQ.id)
    const strongA = [];
    const leanA = [];
    const leanB = [];
    const strongB = [];

    answers.forEach(candidateAnswers => {
      const candidate = {
        name: candidateAnswers.node.candidate.name,
        img: candidateAnswers.node.candidate.image,
        comment: candidateAnswers.node[cId],
        pos: candidateAnswers.node.candidate.office.fields.slug.slice(-5),
      };
      if (candidateAnswers.node[qId] === '1') {
        strongA.push(candidate);
      }
      if (candidateAnswers.node[qId] === '2') {
        leanA.push(candidate);
      }
      if (candidateAnswers.node[qId] === '3') {
        leanB.push(candidate);
      }
      if (candidateAnswers.node[qId] === '4') {
        strongB.push(candidate);
      }
    });
    // console.log('abQ.id', abQ.id)
    rowData.push({
      question: abQ.id,
      statementA: abQ.statementA,
      statementB: abQ.statementB,
      response: {
        strongA,
        leanA,
        leanB,
        strongB,
      },
    });
  });
  return rowData;
};

export default sortComparisons;
