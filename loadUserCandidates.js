const fs = require('fs');
const path = require('path');

module.exports = () => {
  const candidatePath = 'data/candidates/';
  const candidateFiles = fs.readdirSync(candidatePath);
  const userCandidates = [];

  if (
    candidateFiles.length > 0 &&
    !(candidateFiles.length === 1 && candidateFiles[0] === '.DS_Store')
  ) {
    console.log('candidateFiles.length', candidateFiles.length);
    console.log('candidateFiles[0]', candidateFiles[0]);
    candidateFiles.forEach(file => {
      const fileData = fs.readFileSync(path.join(candidatePath, file));
      const candidateData = JSON.parse(fileData.toString());
      userCandidates.push(candidateData);
    });
  }

  return userCandidates;
};
