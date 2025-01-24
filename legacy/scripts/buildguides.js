const fs = require('fs');
const path = require('path');

// Read all files in the races directory
const raceFiles = fs.readdirSync('data/races').filter(file => path.extname(file) === '.json');
const raceData = raceFiles.map(file => {
  const content = fs.readFileSync(path.join('data/races', file));
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing file ${file}:`, error);
    return null;
  }
}).filter(Boolean); // Remove null entries

// Read all files in the guides directory
const guideFiles = fs.readdirSync('data/guides').filter(file => path.extname(file) === '.json');
guideFiles.forEach(file => {
  const filePath = path.join('data/guides', file);
  const content = fs.readFileSync(filePath);
  try {
    const guide = JSON.parse(content);

    // Filter races that belong to the current guide region
    const regionRaces = raceData.filter(race => {
      const officeRegion = race.office.split(' ')[0];
      return officeRegion === guide.region;
    });

    // Update the races field with the UUIDs of the filtered races
    guide.races = regionRaces.map(race => race.uuid);

    // Write the updated guide back to the file
    fs.writeFileSync(filePath, JSON.stringify(guide, null, 2));
  } catch (error) {
    console.error(`Error parsing file ${file}:`, error);
  }
});