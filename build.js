// build.js
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const srcDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'SmartObjects.jsx');
const pidFile = path.join(__dirname, 'watcher.pid'); // PID file path

const version = '1.3.0';

// Order matters if there are dependencies
const files = [
  'utilities.js',
  'logging.js',
  'shapeExpressions.js',
  'shapeFunctions.js',
  'textExpressions.js',
  'textFunctions.js',
  'ui.js',
  'main.js',
];

function buildScript() {
  // Concatenate files
  let output = `// Version: ${version}\n`;
  files.forEach((file) => {
    const filePath = path.join(srcDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    output += '\n' + fileContent;
  });

  // Write to output file
  fs.writeFileSync(outputFile, output);

  // Print build complete with system time
  const currentTime = new Date().toLocaleString();
  console.log(`Build complete at ${currentTime}!`);
}

// Write the PID to a file when in watch mode
if (process.argv.includes('--watch')) {
  fs.writeFileSync(pidFile, process.pid.toString());

  // Ensure the PID file is deleted when the process exits
  process.on('exit', () => {
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  });

  console.log('Watching for file changes...');

  const watcher = chokidar.watch(srcDir);

  watcher.on('all', (event, path) => {
    console.log(`File ${event} detected in ${path}, rebuilding...`);
    buildScript();
  });
} else {
  buildScript();
}
