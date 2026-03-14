const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const targetDirs = ['controllers', 'services'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let changed = false;

    // We look for a variable that was recently assigned an object from a service call
    // and replace 'result' with that variable in subsequent lines within the same block.
    
    let currentVar = null;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Find assignment like 'const user = await ...' or 'const category = await ...'
        // or 'const existingCategory = ...'
        let assignmentMatch = line.match(/const\s+(\w+)\s*=\s*(?:await\s+)?[\w\.]+\(/);
        if (assignmentMatch) {
            currentVar = assignmentMatch[1];
        }

        if (line.includes('(result as any)')) {
            if (currentVar && currentVar !== 'result') {
                lines[i] = line.replace(/\(result as any\)/g, `(${currentVar} as any)`);
                changed = true;
            }
        }
        
        // Reset currentVar on empty lines or function starts to avoid leaking across functions
        if (line.trim() === '' || line.includes('function') || line.includes('=>')) {
            // But don't reset if it's just the start of the current function we are in
            // Actually, if we see a new function, we SHOULD reset.
            if (line.includes('function') || (line.includes('=>') && !line.includes('('))) {
                 // currentVar = null; // Maybe keep it for now
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`Fixed: ${filePath}`);
    }
}

targetDirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            if (file.endsWith('.ts')) {
                processFile(path.join(dirPath, file));
            }
        });
    }
});
