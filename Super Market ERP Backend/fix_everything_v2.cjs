const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const targetDirs = ['controllers', 'services'];

const varMap = {
    'auth.controller.ts': 'user',
    'inventory.controller.ts': 'category', // for category controllers
    'stockbatch.controller.ts': 'batch',
    'analytics.service.ts': 'analytics',
    'auth.service.ts': 'user',
    'category.service.ts': 'category',
    'porderDetail.service.ts': 'poDetail',
    'procurement.service.ts': 'po',
    'sales.service.ts': 'sale'
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix result?.(result as any)["Prop"] pattern
    content = content.replace(/result\?\.\(result as any\)\["(\w+)"\]/g, 'result.user.$1');
    content = content.replace(/result\?\.\(result as any\)\["(\w+)"\]/g, 'result.user.$1'); // run twice if nested or similar

    // Fix (result as any)["Prop"] where result is clearly not in scope but we had a recent var
    let lines = content.split('\n');
    let currentVar = null;
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Capture common assignment variables
        let assignmentMatch = line.match(/const\s+(\w+)\s*=\s*(?:await\s+)?[\w\.]+\(/);
        if (assignmentMatch) {
            let v = assignmentMatch[1];
            if (!['result', 'req', 'res', 'next', 'db', 't', 'sequelize'].includes(v)) {
                currentVar = v;
            }
        }

        if (line.includes('result as any')) {
             // If 'result' is not defined in this function but we have 'currentVar'
             // Or if it's after an assignment where result wasn't the target.
             // Actually, if we see result as any and we are getting a TS error find name result, we should replace it.
             // But here we just guess.
             if (currentVar && !content.includes(`const result =`) && !content.includes(`let result =`)) {
                 lines[i] = line.replace(/result/g, currentVar);
                 changed = true;
             }
        }
        
        // Specific fixes for inventory.controller.ts
        if (filePath.endsWith('inventory.controller.ts')) {
            if (line.includes('(result as any)')) {
                lines[i] = line.replace(/result/g, 'existingCategory');
                changed = true;
            }
        }

        // Specific fixes for auth.controller.ts
        if (filePath.endsWith('auth.controller.ts')) {
            if (line.includes('(result as any)')) {
                // If in updateProfile, maybe result.user
                if (line.includes('result?.(user as any)')) {
                     // already fixed?
                }
            }
        }
    }
    
    content = lines.join('\n');

    // Final cleanup of common bad patterns
    content = content.replace(/\(result as any\)\["(\w+)"\]/g, '(result as any).$1');
    content = content.replace(/result\?\.\(result as any\)\.(\w+)/g, 'result.user.$1');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Processed: ${filePath}`);
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
