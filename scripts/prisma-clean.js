const fs = require('fs');
const path = require('path');

if (process.platform !== 'linux') {
  console.log('Skipping Prisma binary cleanup on non-Linux platform.');
  process.exit(0);
}

const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const filesToRemove = [
  'libquery_engine-darwin-arm64.dylib.node',
  'libquery_engine-darwin.dylib.node',
  'libquery_engine-windows.dll.node',
  'query_engine-windows.dll.node'
];

filesToRemove.forEach(file => {
  const target = path.join(prismaDir, file);
  if (fs.existsSync(target)) {
    try {
      fs.unlinkSync(target);
      console.log(`Removed ${file}`);
    } catch (error) {
      console.warn(`Failed to remove ${file}:`, error.message);
    }
  }
});
