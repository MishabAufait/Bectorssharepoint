/**
 * ALC 46 Standard Checklist Questions Catalog Seed Data
 * Area Line Clearance Checklist Definition
 */

const ALC_CHECKLIST_SEED_DATA = [
    // 1. RM Store Area (Wheat Flour Handling)
    { id: 1, sequence: 1, area: "RM Store Area (Wheat Flour Handling)", title: "Floor Condition - To be cleaned", isCritical: false, isActive: true },
    { id: 2, sequence: 2, area: "RM Store Area (Wheat Flour Handling)", title: "No scrap at RM storage area", isCritical: false, isActive: true },
    { id: 3, sequence: 3, area: "RM Store Area (Wheat Flour Handling)", title: "Sign of Infestation, Crawling marks", isCritical: true, isActive: true },

    // 2. Flour & Sugar Handling
    { id: 4, sequence: 4, area: "Flour & Sugar Handling", title: "Maida and Sugar handling area Cleanliness -Floor, wall, ceiling, railing, cuving", isCritical: false, isActive: true },
    { id: 5, sequence: 5, area: "Flour & Sugar Handling", title: "Sieve Condition- free from damage and Cleanliness", isCritical: true, isActive: true },
    { id: 6, sequence: 6, area: "Flour & Sugar Handling", title: "Magnet Position and cleanliness", isCritical: true, isActive: true },
    { id: 7, sequence: 7, area: "Flour & Sugar Handling", title: "Free from pest", isCritical: true, isActive: true },
    { id: 8, sequence: 8, area: "Flour & Sugar Handling", title: "No damage and loose thread in cotton bellows", isCritical: false, isActive: true },

    // 3. Chemical Handling Area
    { id: 9, sequence: 9, area: "Chemical Handling Area", title: "All utensils are clean and free from damage", isCritical: false, isActive: true },
    { id: 10, sequence: 10, area: "Chemical Handling Area", title: "All sieve condition- Free from damage and cleanliness", isCritical: true, isActive: true },
    { id: 11, sequence: 11, area: "Chemical Handling Area", title: "All Magnets in place and to be clean", isCritical: true, isActive: true },
    { id: 12, sequence: 12, area: "Chemical Handling Area", title: "All ingredient trollies to be identified", isCritical: false, isActive: true },
    { id: 13, sequence: 13, area: "Chemical Handling Area", title: "All trollleys to be clean and free from damage", isCritical: false, isActive: true },
    { id: 14, sequence: 14, area: "Chemical Handling Area", title: "Check for overall area cleanliness", isCritical: false, isActive: true },

    // 4. Mixing
    { id: 15, sequence: 15, area: "Mixing", title: "All gasket to be free from damage", isCritical: false, isActive: true },
    { id: 16, sequence: 16, area: "Mixing", title: "Floor condition - to be clean", isCritical: false, isActive: true },
    { id: 17, sequence: 17, area: "Mixing", title: "Free from scrap accumulation at mixing", isCritical: false, isActive: true },
    { id: 18, sequence: 18, area: "Mixing", title: "No loose nut , bolts , electrical cable,loose tape on floor/ equipment.", isCritical: true, isActive: true },
    { id: 19, sequence: 19, area: "Mixing", title: "No damage and loose thread in cotton bellows", isCritical: false, isActive: true },
    { id: 20, sequence: 20, area: "Mixing", title: "All utensils are clean and free from damage", isCritical: false, isActive: true },
    { id: 21, sequence: 21, area: "Mixing", title: "All catch trays are in place and clean", isCritical: false, isActive: true },
    { id: 22, sequence: 22, area: "Mixing", title: "No damage or loose threads in all conveyors(Cotton & PU)", isCritical: true, isActive: true },
    { id: 23, sequence: 23, area: "Mixing", title: "All previous running raw material which will not be used in next running variety should be transferred back to rm store.", isCritical: true, isActive: true },
    { id: 24, sequence: 24, area: "Mixing", title: "All hoppers and sprinklinlers should be clean and free from extraneous material.", isCritical: true, isActive: true },
    { id: 25, sequence: 25, area: "Mixing", title: "Dough trollies in use are properly Cleaned", isCritical: false, isActive: true },
    { id: 26, sequence: 26, area: "Mixing", title: "Running variety should be dispalyed on board", isCritical: false, isActive: true },
    { id: 27, sequence: 27, area: "Mixing", title: "Mixer should be clean and free from any left over dough", isCritical: true, isActive: true },
    { id: 28, sequence: 28, area: "Mixing", title: "Rotary Moulder,Cross Over Conveyor and Feed rollers should be cleaned", isCritical: true, isActive: true },

    // 5. Oven
    { id: 29, sequence: 29, area: "Oven", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
    { id: 30, sequence: 30, area: "Oven", title: "Remove all broken from Oven end", isCritical: false, isActive: true },
    { id: 31, sequence: 31, area: "Oven", title: "All trollies used to be clean and free from damage", isCritical: false, isActive: true },

    // 6. Post Bake & Packing Section
    { id: 32, sequence: 32, area: "Post Bake & Packing Section", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
    { id: 33, sequence: 33, area: "Post Bake & Packing Section", title: "Return back all previous laminate/Trays/CBB/Tins and get issued running variety with proper checking", isCritical: true, isActive: true },
    { id: 34, sequence: 34, area: "Post Bake & Packing Section", title: "All catch trays are in place and clean", isCritical: false, isActive: true },
    { id: 35, sequence: 35, area: "Post Bake & Packing Section", title: "No old Biscuits are present in packing area including MD Rejection bin", isCritical: true, isActive: true },
    { id: 36, sequence: 36, area: "Post Bake & Packing Section", title: "All crates and trollies are clean and free from damage", isCritical: false, isActive: true },
    { id: 37, sequence: 37, area: "Post Bake & Packing Section", title: "No loose nut , bolts , electrical cable,loose tape on floor/ equipment.", isCritical: true, isActive: true },
    { id: 38, sequence: 38, area: "Post Bake & Packing Section", title: "No damage or loose threads in all conveyors.", isCritical: true, isActive: true },
    { id: 39, sequence: 39, area: "Post Bake & Packing Section", title: "Conveyor rollers should be cleaned", isCritical: false, isActive: true },
    { id: 40, sequence: 40, area: "Post Bake & Packing Section", title: "No WIP/Previous variety material to be kept on shopfloor", isCritical: true, isActive: true },
    { id: 41, sequence: 41, area: "Post Bake & Packing Section", title: "All Packing machines running/idle and its contact surfaces should be cleaned", isCritical: true, isActive: true },
    { id: 42, sequence: 42, area: "Post Bake & Packing Section", title: "Proper arrangement of RC and identification on the same", isCritical: false, isActive: true },

    // 7. Biscuit Grinding
    { id: 43, sequence: 43, area: "Biscuit Grinding", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
    { id: 44, sequence: 44, area: "Biscuit Grinding", title: "All sieve condition- Free from damage and cleanliness", isCritical: true, isActive: true },
    { id: 45, sequence: 45, area: "Biscuit Grinding", title: "All Magnets are in place and to be clean.", isCritical: true, isActive: true },
    { id: 46, sequence: 46, area: "Biscuit Grinding", title: "All Trollies used are clean", isCritical: false, isActive: true }
];

if (typeof window !== "undefined") {
    window.ALC_CHECKLIST_SEED_DATA = ALC_CHECKLIST_SEED_DATA;
}
