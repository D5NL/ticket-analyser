// Script om de TypeScript importpaden te corrigeren
// Voegt .js extensie toe aan relatieve imports zonder extensie

const fs = require('fs');
const path = require('path');

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixImportsInFile(fullPath);
    }
  }
}

function fixImportsInFile(filePath) {
  console.log(`Verwerken van: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Regex om imports te vinden die een .js extensie nodig hebben
  const importRegex = /from\s+['"]([./][^'"]*?)(?:['"])/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    // Voeg alleen .js toe als het geen bestandsextensie heeft
    if (!path.extname(importPath)) {
      return `from '${importPath}.js'`;
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
}

// Begin met de src directory
processDirectory('./src'); 