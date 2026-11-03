const fs = require('fs');
const content = fs.readFileSync('Quality-New-Assets/quality-Rajpura/PackagingOperations/js/checklist.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('sku')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
