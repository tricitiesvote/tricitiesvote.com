const fs = require('fs');
const path = require('path');

// Function to generate a 10-character unique ID
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 10);
}

// Get the directory path from the command-line arguments
const dirPath = process.argv[2];

if (!dirPath) {
    console.error('Please provide a directory path.');
    process.exit(1);
}

// Read all files in the directory
fs.readdir(dirPath, (err, files) => {
  if (err) {
    console.error('Could not list the directory.', err);
    process.exit(1);
  } 

  let ids = new Set();

  files.forEach((file, index) => {
    if (path.extname(file) === '.json') {
      let filePath = path.join(dirPath, file);

      // Read the file
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading file from disk: ${filePath}`, err);
          return;
        }

        // Parse the JSON file
        let jsonData = JSON.parse(data);

        // Generate a unique 10-character ID
        let newId;
        do {
          newId = generateUniqueId();
        } while (ids.has(newId));
        ids.add(newId);

        // Modify the uuid field
        jsonData.uuid = newId;

        // Write the modified data back to the file
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
          if (err) {
            console.error(`Error writing file on disk: ${filePath}`, err);
          }
        });
      });
    }
  });
});
