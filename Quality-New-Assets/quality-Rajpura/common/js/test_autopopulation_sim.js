const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/mb-recipes-seed.js');
const seedContent = fs.readFileSync(seedFile, 'utf8');

const checklistFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/MixingAndBaking/js/checklist.js');
let checklistContent = fs.readFileSync(checklistFile, 'utf8');

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="cycle-1"></div></body></html>`, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

// Attach mock objects
window.MB_RECIPES_SEED_DATA = [];
const vm = require('vm');
vm.runInContext(seedContent, dom.getInternalVMContext());

// Render a mock cycle form with all standard input IDs
const cycleNum = 1;
const allInputIds = [
    `cr3ea_rpostandard-${cycleNum}`, `cr3ea_solidfatstandard-${cycleNum}`, `cr3ea_butterstandard-${cycleNum}`, `cr3ea_blackjackstandard-${cycleNum}`, `cr3ea_spongetempstandard-${cycleNum}`, `cr3ea_slurrystandard-${cycleNum}`, `cr3ea_groundsugartempstandard-${cycleNum}`, `cr3ea_groundsugarparticlesizestandard-${cycleNum}`,
    `cr3ea_rpoobserved-${cycleNum}`, `cr3ea_solidfatobserved-${cycleNum}`, `cr3ea_butterobserved-${cycleNum}`, `cr3ea_blackjackobserved-${cycleNum}`, `cr3ea_spongetempobserved-${cycleNum}`, `cr3ea_slurryobserved-${cycleNum}`, `cr3ea_groundsugartempobserved-${cycleNum}`, `cr3ea_groundsugarparticlesizeobserved-${cycleNum}`,
    `cr3ea_chocochipssupplier-${cycleNum}`, `cr3ea_chocochipstemp-${cycleNum}`, `cr3ea_chocochipscountperkg-${cycleNum}`, `cr3ea_chocochipscompoundorpure-${cycleNum}`,
    `cr3ea_cashewsupplier-${cycleNum}`, `cr3ea_cashewtemp-${cycleNum}`, `cr3ea_cashewcountperkg-${cycleNum}`, `cr3ea_cashewcompoundorpure-${cycleNum}`,
    `cr3ea_floursupplier-${cycleNum}`, `cr3ea_invertsyruptemp-${cycleNum}`, `cr3ea_invertsyrupph-${cycleNum}`, `cr3ea_invertsyrupbrix-${cycleNum}`, `cr3ea_blackjack2temp-${cycleNum}`, `cr3ea_blackjack2ph-${cycleNum}`, `cr3ea_blackjack2brix-${cycleNum}`,
    `cr3ea_spongeproductname-${cycleNum}`, `cr3ea_spongewaterquantity-${cycleNum}`, `cr3ea_spongeyeastquantity-${cycleNum}`, `cr3ea_spongewatertemp-${cycleNum}`, `cr3ea_spongemixingtime-${cycleNum}`, `cr3ea_fermentationstarttemp-${cycleNum}`, `cr3ea_fermentationroomtemp-${cycleNum}`, `cr3ea_finaltempafterfermentation-${cycleNum}`, `cr3ea_finalphafterfermentation-${cycleNum}`,
    `cr3ea_creamingtimestandard-${cycleNum}`, `cr3ea_creamingtimeobserved-${cycleNum}`, `cr3ea_mixingtimestandard-${cycleNum}`, `cr3ea_mixingtimeobserved-${cycleNum}`, `cr3ea_doughtempstandard-${cycleNum}`, `cr3ea_doughtempobserved-${cycleNum}`, `cr3ea_doughstandingtimestandard-${cycleNum}`, `cr3ea_doughstandingtimeobserved-${cycleNum}`, `cr3ea_doughconsistency-${cycleNum}`,
    `cr3ea_moulderrpmstrokes-${cycleNum}`, `cr3ea_formingsamplecount-${cycleNum}`, `cr3ea_standardwetweight-${cycleNum}`,
    `cr3ea_bakingtime-${cycleNum}`, `cr3ea_bakingprofiletaste-${cycleNum}`, `cr3ea_bakingprofileaspertemplate-${cycleNum}`, `cr3ea_biscuitlength-${cycleNum}`, `cr3ea_biscuitwidth-${cycleNum}`, `cr3ea_biscuitdiameter-${cycleNum}`, `cr3ea_gauge-${cycleNum}`, `cr3ea_standardssamplecount-${cycleNum}`, `cr3ea_biscuitstdweight-${cycleNum}`,
    `cr3ea_topcolourstandard-${cycleNum}`, `cr3ea_topcolourobserved-${cycleNum}`, `cr3ea_bottomcolourstandard-${cycleNum}`, `cr3ea_bottomcolourobserved-${cycleNum}`,
    `cr3ea_moisturestandard-${cycleNum}`, `cr3ea_weightbeforeoil-${cycleNum}`, `cr3ea_weightafteroilspray-${cycleNum}`, `cr3ea_weightwithseasoning-${cycleNum}`
];

const container = document.getElementById("cycle-1");
allInputIds.forEach(id => {
    const input = document.createElement("input");
    input.id = id;
    if (id.includes("aspertemplate")) {
        input.type = "checkbox";
    }
    container.appendChild(input);
});

// Provide stub for MixingBaking_Main
window.MixingBaking_Main = {
    state: {
        recipes: window.MB_RECIPES_SEED_DATA,
        product: ""
    }
};
window.$ = () => ({ off: () => ({ on: () => {} }), append: () => {}, empty: () => ({ append: () => {} }), val: () => "" });

// Run checklist in sandbox
vm.runInContext(checklistContent, dom.getInternalVMContext());

const recipes = window.MB_RECIPES_SEED_DATA;
console.log(`Starting autopopulation test for all ${recipes.length} products...`);

let successCount = 0;
recipes.forEach((r, idx) => {
    // Call populateStandardValues
    window.MixingBaking_Checklist.populateStandardValues(1, r.title);
    
    const s = r.standards || {};
    const lengthVal = document.getElementById(`cr3ea_biscuitlength-1`).value;
    const widthVal = document.getElementById(`cr3ea_biscuitwidth-1`).value;
    const diamVal = document.getElementById(`cr3ea_biscuitdiameter-1`).value;
    const gaugeVal = document.getElementById(`cr3ea_gauge-1`).value;
    const stdWtVal = document.getElementById(`cr3ea_biscuitstdweight-1`).value;
    const moistVal = document.getElementById(`cr3ea_moisturestandard-1`).value;
    const bakeTimeVal = document.getElementById(`cr3ea_bakingtime-1`).value;
    const sampleCountVal = document.getElementById(`cr3ea_standardssamplecount-1`).value;

    const expectedLength = s.length === "-" ? "NA" : (s.length || s.biscuitLength || "NA");
    const expectedDiam = s.diameter === "-" ? "NA" : (s.diameter || s.biscuitDiameter || "NA");
    const expectedGauge = s.gauge === "-" ? "NA" : (s.gauge || "NA");
    const expectedStdWt = s.dryBiscuitWeight === "-" ? "NA" : (s.dryBiscuitWeight || s.biscuitStdWeight || "NA");
    const expectedMoist = s.moisture === "-" ? "NA" : (s.moisture || s.moistureStandard || "2.25%");

    // Verify key fields are populated
    if (lengthVal && diamVal && gaugeVal && stdWtVal && moistVal && bakeTimeVal && sampleCountVal) {
        successCount++;
    } else {
        console.error(`Autopopulation incomplete for ${r.title} (srNo ${r.srNo}):`, {
            lengthVal, diamVal, gaugeVal, stdWtVal, moistVal, bakeTimeVal, sampleCountVal
        });
    }
});

console.log(`\n======================================================`);
console.log(`Autopopulation Verification: ${successCount} / ${recipes.length} PASSED`);
console.log(`======================================================\n`);
