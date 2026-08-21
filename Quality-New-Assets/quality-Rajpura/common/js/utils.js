// Common utility functions for Rajpura Quality forms
console.log("Rajpura Common Utils Loaded");

// Global Quality Rajpura configuration
const QualityRajpura_Config = {
    PLANT_ID: "14",
    PLANT_NAME: "Rajpura",
    QUALITY_DEPT_IDS: ["80", "81", "135"],

    // SharePoint List Names categorized by form
    SHAREPOINT_LISTS: {
        CONFIG: "Quality-Rajpura",
        ALC: "Quality-Rajpura-ALC",
        FOOD_SAFETY: "Quality-Rajpura-FoodSafety",
        MIXING_BAKING: "Quality-Rajpura-MixingBaking",
        PACKAGING_OPERATIONS: "Quality-Rajpura-PackagingOperations",
        CCP_OPRP_SIEVES_MAGNETS: "Quality-Rajpura-CCPOPRP"
    },

    // SharePoint Document Libraries
    SHAREPOINT_DOCS: {
        ALC_CORRECTIVE_ACTIONS: "ALC_CorrectiveActions_Docs",
        CCP_OPRP_CORRECTIVE_ACTIONS: "CCP_OPRP_CorrectiveActions_Docs",
        MIXING_BAKING: "MixingBaking_Docs"
    },

    // Dataverse Table Names categorized by form
    DATAVERSE_TABLES: {
        // Parent Tour table used by all quality checklist forms
        PARENT_TOUR: "cr3ea_prod_rajpura_quality_tours",

        // Individual form configurations
        ALC: {
            PARENT: "cr3ea_prod_rajpura_quality_tours",
            CHILD: "cr3ea_rajpura_alcses"
        },
        FOOD_SAFETY: {
            PARENT: "cr3ea_prod_rajpura_quality_tours",
            CHILD: "cr953_foodsafetychecklistforrajpuras"
        },
        MIXING_BAKING: {
            PARENT: "cr3ea_prod_rajpura_quality_tours",
            CHILD: "cr3ea_prod_rajpura_mixingandbakings"
        },
        PACKAGING_OPERATIONS: {
            PARENT: "cr3ea_prod_rajpura_quality_tours",
            CHILD: ""
        },
        CCP_OPRP_SIEVES_MAGNETS: {
            PARENT: "cr3ea_prod_rajpura_quality_tours",
            CHILD_CCP: "cr3ea_prod_rajpura_ccpoprps",      // logical name: cr3ea_prod_rajpura_ccpoprp
            CHILD_SIEVES: "cr3ea_prod_rajpura_sievesmagnetses" // logical name: cr3ea_prod_rajpura_sievesmagnets
        }
    }
};

// Export globally for standard script tags
window.QualityRajpura_Config = QualityRajpura_Config;

// Example: function to handle date formatting
function formatRajpuraDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Global helper for showing progress percentages inside full screen loader
window.ShowProgressLoader = function (percentage, text = "Submitting data...") {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;
    
    overlay.style.display = "block";
    
    // Inject spin animation style block if missing
    if (!document.getElementById("progress-loader-spin-style")) {
        const style = document.createElement("style");
        style.id = "progress-loader-spin-style";
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    overlay.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ffffff; padding: 25px 35px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; align-items: center; gap: 15px; border: 1px solid #e2e8f0; min-width: 280px; z-index: 100001; box-sizing: border-box;">
            <div style="width: 36px; height: 36px; border: 3px solid #f3f3f3; border-top: 3px solid #1a73e8; border-radius: 50%; animation: spin 0.8s linear infinite; box-sizing: border-box;"></div>
            <div style="font-size: 14px; font-weight: 600; color: #1e293b; text-align: center; font-family: 'Outfit', 'Inter', sans-serif;">${text}</div>
            <div style="font-size: 18px; font-weight: 700; color: #1a73e8; font-family: 'Outfit', 'Inter', sans-serif;">${percentage}%</div>
            <div style="width: 100%; background-color: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; box-sizing: border-box;">
                <div style="width: ${percentage}%; background-color: #1a73e8; height: 100%; transition: width 0.2s ease;"></div>
            </div>
        </div>
    `;
};
