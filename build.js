// build.js
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'SmartObjects_1.0.0.jsx');

// Order matters if there are dependencies
const files = [
    'utilities.js',
    'logging.js',
    'shapeExpressions.js',
    'shapeFunctions.js',
    'ui.js',
    'main.js',
];

function buildScript() {

    // Concatenate files
    let output = '';
    files.forEach((file) => {
        const filePath = path.join(srcDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        output += '\n' + fileContent;
    });

    // Write to output file
    fs.writeFileSync(outputFile, output);

    console.log('Build complete!');
}

// Check for '--watch' argument
if (process.argv.includes('--watch')) {
    console.log('Watching for file changes...');

    const chokidar = require('chokidar');
    chokidar.watch(srcDir).on('all', (event, path) => {
        console.log(`File ${event} detected in ${path}, rebuilding...`);
        buildScript();
    });
} else {
    buildScript();
}

//Use npm run build to build
//Use npm run watch for auto updates