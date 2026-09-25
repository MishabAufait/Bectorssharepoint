const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/mb-recipes-seed.js');
const seedContent = fs.readFileSync(seedFile, 'utf8');

const sandbox = {};
const vm = require('vm');
vm.runInNewContext(seedContent, sandbox);

const recipes = sandbox.MB_RECIPES_SEED_DATA;

// Generate unique display title for each recipe
function getRecipeDisplayTitle(r) {
    const title = (r.title || r.variety || "Unknown").trim();
    const sku = (r.skuRaw || (Array.isArray(r.sku) ? r.sku.join(", ") : "") || "").trim();
    if (!sku || sku === "-" || sku.toUpperCase() === "NA" || title.toLowerCase().includes(sku.toLowerCase())) {
        return title;
    }
    // If title doesn't already contain sku, check if there are duplicate titles
    const sameTitleCount = recipes.filter(other => (other.title || other.variety || "").trim().toLowerCase() === title.toLowerCase()).length;
    if (sameTitleCount > 1) {
        return `${title} (${sku})`;
    }
    return title;
}

// Lookup recipe by user selection
function lookupRecipe(selectedText) {
    if (!selectedText) return null;
    const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = clean(selectedText);
    
    // 1. Check exact match on generated display title
    let match = recipes.find(r => clean(getRecipeDisplayTitle(r)) === target);
    if (match) return match;
    
    // 2. Check exact match on title or variety
    match = recipes.find(r => clean(r.title) === target || clean(r.variety) === target);
    if (match) return match;
    
    // 3. Check combined title + sku
    match = recipes.find(r => {
        const fullWithSku = clean(`${r.title} ${r.skuRaw || ""}`);
        return fullWithSku === target;
    });
    if (match) return match;
    
    // 4. Fallback substring match
    match = recipes.find(r => {
        const rTitle = clean(r.title);
        return target.includes(rTitle) || rTitle.includes(target);
    });
    return match;
}

// Test each of the 71 products
let passed = 0;
recipes.forEach((r, idx) => {
    const displayTitle = getRecipeDisplayTitle(r);
    const found = lookupRecipe(displayTitle);
    if (found && found.srNo === r.srNo) {
        passed++;
    } else {
        console.error(`Failed at index ${idx}: expected srNo ${r.srNo}, got srNo ${found?.srNo} for displayTitle "${displayTitle}"`);
    }
});

console.log(`Unique Display Title Matching: ${passed} / ${recipes.length} passed.`);
