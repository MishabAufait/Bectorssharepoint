const fs = require('fs');
const s = fs.readFileSync('Quality-New-Assets/quality-Rajpura/common/js/admin.js', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
    if (l.includes('method: "POST"') || l.includes("method: 'POST'") || l.includes('JSON.stringify') || l.includes('contextinfo')) {
        console.log((i+1) + ': ' + l.trim());
    }
});
