const fs = require('fs');
const path = require('path');

exports.loadUserCandidates = () => {
  const candidatePath = '../data/candidates';
  const candidateFiles = fs.readdirSync(candidatePath);
  const userCandidates = [];

  candidateFiles.forEach(file => {
    const fileData = fs.readFileSync(path.join(candidatePath, file));
    const candidateData = JSON.parse(fileData.toString());
    userCandidates.push(candidateData);
  });

  return userCandidates;
};