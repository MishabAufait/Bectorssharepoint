const fs = require('fs');
const path = require('path');

const seedFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/mb-recipes-seed.js');
const seedContent = fs.readFileSync(seedFile, 'utf8');

const checklistFile = path.resolve('c:/Users/Mishab/OneDrive - Aufait Technologies Pvt Ltd/Shortcuts/Mrs_Bectors_PTMS - BectorsSourceCode/Quality-New-Assets/quality-Rajpura/MixingAndBaking/js/checklist.js');
let checklistContent = fs.readFileSync(checklistFile, 'utf8');

const elements = {};

const mockDocument = {
    getElementById: (id) => {
        if (!elements[id]) {
            elements[id] = { id: id, value: "", checked: false, style: {} };
        }
        return elements[id];
    },
    querySelectorAll: () => [],
    querySelector: () => null
};

const mockWindow = {
    document: mockDocument,
    console: console,
    MixingBaking_Main: {
        state: {
            recipes: [],
            product: ""
        }
    },
    $: () => ({ off: () => ({ on: () => {} }), append: () => {}, empty: () => ({ append: () => {} }), val: () => "" }),
    moment: () => ({ format: () => "01/01/2026" })
};

const vm = require('vm');
const context = vm.createContext({
    document: mockDocument,
    window: mockWindow,
    console: console,
    $: mockWindow.$,
    moment: mockWindow.moment,
    MixingBaking_Main: mockWindow.MixingBaking_Main
});

// Run seed data in context
vm.runInContext(seedContent + "\nwindow.MB_RECIPES_SEED_DATA = MB_RECIPES_SEED_DATA;", context);
mockWindow.MixingBaking_Main.state.recipes = context.window.MB_RECIPES_SEED_DATA;

// Run checklist.js in context and export MixingBaking_Checklist to window
vm.runInContext(checklistContent + "\nwindow.MixingBaking_Checklist = MixingBaking_Checklist;", context);

const checklist = context.window.MixingBaking_Checklist;
const recipes = context.window.MB_RECIPES_SEED_DATA;
console.log(`Running Vanilla Simulation on ${recipes.length} recipes...`);

let passed = 0;
recipes.forEach((r, idx) => {
    // Clear elements
    for (let k in elements) {
        elements[k].value = "";
        elements[k].checked = false;
    }

    // Call populateStandardValues
    checklist.populateStandardValues(1, r.title);

    const s = r.standards || {};
    const lengthVal = elements[`cr3ea_biscuitlength-1`]?.value;
    const widthVal = elements[`cr3ea_biscuitwidth-1`]?.value;
    const diamVal = elements[`cr3ea_biscuitdiameter-1`]?.value;
    const gaugeVal = elements[`cr3ea_gauge-1`]?.value;
    const stdWtVal = elements[`cr3ea_biscuitstdweight-1`]?.value;
    const moistVal = elements[`cr3ea_moisturestandard-1`]?.value;
    const bakeTimeVal = elements[`cr3ea_bakingtime-1`]?.value;
    const sampleCountVal = elements[`cr3ea_standardssamplecount-1`]?.value;
    const rpoStdVal = elements[`cr3ea_rpostandard-1`]?.value;

    if (lengthVal && diamVal && gaugeVal && stdWtVal && moistVal && bakeTimeVal && sampleCountVal && rpoStdVal) {
        passed++;
    } else {
        console.error(`Failed at ${idx + 1}: ${r.title}`, {
            lengthVal, diamVal, gaugeVal, stdWtVal, moistVal, bakeTimeVal, sampleCountVal, rpoStdVal
        });
    }
});

console.log(`\n======================================================`);
console.log(`Autopopulation Verification: ${passed} / ${recipes.length} PASSED`);
console.log(`======================================================\n`);
