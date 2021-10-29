import _ from 'lodash';

const sortComparisons = (questions, answers) => {
  // console.log('questions', questions);
  const abQSet = []; // a/b questions
  // TODO: add TF / open-ended questions/answers
  // const tfQSet = []; // true/false questions
  // const oQSet = []; // open-ended questions

  // const tfASet = []; // true/false answers
  // const oASet = []; // open-ended answers

  if (questions) {
    questions.forEach(question => {
      const q = question.node;
      // console.log('question', q);
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
        // console.log('candidateAnswers', candidateAnswers);
        if (candidateAnswers !== null) {
          const thisCandidate = candidateAnswers.fields.responder;
          const candidate = {
            name: thisCandidate.name,
            img: thisCandidate.image,
            comment: candidateAnswers[cId],
            pos: thisCandidate.office.title.slice(-5),
          };
          if (candidateAnswers[qId] === '1') {
            strongA.push(candidate);
          }
          if (candidateAnswers[qId] === '2') {
            leanA.push(candidate);
          }
          if (candidateAnswers[qId] === '3') {
            leanB.push(candidate);
          }
          if (candidateAnswers[qId] === '4') {
            strongB.push(candidate);
          }
        }
        // console.log('abQ.id', abQ.id)
        // if (!_.includes(rowData, abQ.id)) {
        //
        //
        // }
        //
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
    });
    return rowData;
  }
};

export default sortComparisons;
