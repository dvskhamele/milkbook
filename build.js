import fs from 'fs';
import path from 'path';

// Read the main index.html file
let htmlContent = fs.readFileSync('./index.html', 'utf8');

// For a multi-file structure, we would normally have a build process
// that combines all the separate files into one, but since we're
// maintaining the single-file approach for the browser-based JSX,
// we'll just copy the index.html to dist as is

console.log('Copying index.html to dist folder...');
fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/index.html', htmlContent);

console.log('Build completed successfully!');