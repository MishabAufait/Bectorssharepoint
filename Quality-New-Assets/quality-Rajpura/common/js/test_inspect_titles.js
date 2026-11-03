const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/mb-recipes-seed.js');
const seedContent = fs.readFileSync(seedFile, 'utf8');

const sandbox = {};
const vm = require('vm');
vm.runInNewContext(seedContent, sandbox);

const recipes = sandbox.MB_RECIPES_SEED_DATA;
recipes.forEach((r, idx) => {
    console.log(`${idx + 1}. [srNo: ${r.srNo}] title: "${r.title}", variety: "${r.variety}", skuRaw: "${r.skuRaw}"`);
});
