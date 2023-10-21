const fs = require('fs');
const path = require('path');

const candidatesDir = path.join(__dirname, 'data/candidates');
const racesDir = path.join(__dirname, 'data/races');

// Read all files in the candidates directory
const candidateFiles = fs.readdirSync(candidatesDir).filter(file => file.endsWith('.json'));

// Read all files in the races directory
const raceFiles = fs.readdirSync(racesDir).filter(file => file.endsWith('.json'));

// Load all race data into memory
const races = raceFiles.map(file => {
  const content = fs.readFileSync(path.join(racesDir, file), 'utf8');
  return JSON.parse(content);
});

// Iterate over each candidate file
candidateFiles.forEach(file => {
  const filePath = path.join(candidatesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const candidate = JSON.parse(content);

  // Find the race where the candidate's uuid is in the candidates array
  const race = races.find(r => r.candidates.includes(candidate.uuid));

  // If a matching race is found, update the office field in the candidate data
  if (race) {
    candidate.office = race.office;

    // Write the updated candidate data back to the file
    fs.writeFileSync(filePath, JSON.stringify(candidate, null, 2), 'utf8');
  }
});
