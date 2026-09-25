const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/mb-recipes-seed.js');
const seedContent = fs.readFileSync(seedFile, 'utf8');

// Evaluate MB_RECIPES_SEED_DATA in sandbox
const sandbox = {};
const vm = require('vm');
vm.runInNewContext(seedContent, sandbox);

const recipes = sandbox.MB_RECIPES_SEED_DATA;
console.log(`Loaded ${recipes.length} recipes from seed.`);

// Test matching logic
function findRecipe(productName) {
    if (!productName) return null;
    const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = clean(productName);
    
    // 1. Exact clean match
    let match = recipes.find(r => clean(r.title) === target || clean(r.variety) === target);
    if (match) return match;
    
    // 2. Contains match
    match = recipes.find(r => {
        const rTitle = clean(r.title);
        const rVar = clean(r.variety);
        return target.includes(rTitle) || rTitle.includes(target) || (rVar && (target.includes(rVar) || rVar.includes(target)));
    });
    return match;
}

let passed = 0;
recipes.forEach((r, idx) => {
    const matched = findRecipe(r.title);
    if (matched && matched.srNo === r.srNo) {
        passed++;
    } else {
        console.error(`Failed matching for index ${idx}: "${r.title}"`);
    }
});

console.log(`Matching test: ${passed} / ${recipes.length} passed.`);
