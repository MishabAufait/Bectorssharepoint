const fs = require('fs');
const content = fs.readFileSync('Quality-New-Assets/quality-Rajpura/PackagingOperations/js/checklist.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('renderPQI') || line.includes('pqiSubChecklistsFilled') || line.includes('submitChecklist') || line.includes('Submit Checklist') || line.includes('btnSubmitChecklist') || line.includes('pqi-sub-select')) {
        console.log(`${idx + 1}: ${line}`);
    }
});
