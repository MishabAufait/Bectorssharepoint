const fs = require('fs');
const css = fs.readFileSync('Quality-New-Assets/quality-Rajpura/common/css/admin.css', 'utf8');
const js = fs.readFileSync('Quality-New-Assets/quality-Rajpura/common/js/admin.js', 'utf8');

const set = new Set();
const r = /class=["']([^"']+)["']/g;
let m;
while ((m = r.exec(js)) !== null) {
    m[1].split(/\s+/).forEach(c => {
        if (c && !c.includes('${') && !c.includes('}')) set.add(c);
    });
}

const missing = [];
for (const c of Array.from(set).sort()) {
    if (!css.includes(c)) {
        missing.push(c);
    }
}

console.log('Classes used in admin.js not found in admin.css:');
console.log(missing);
