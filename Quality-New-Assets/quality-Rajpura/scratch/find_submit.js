const fs = require('fs');
const files = fs.readdirSync('Quality-New-Assets/quality-Rajpura/PackagingOperations/js');
files.forEach(file => {
    const content = fs.readFileSync('Quality-New-Assets/quality-Rajpura/PackagingOperations/js/' + file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('btnSubmitChecklist') || line.includes('submitChecklist')) {
            console.log(`${file}:${idx + 1}: ${line}`);
        }
    });
});
