// Common utility functions for Rajpura Quality forms
console.log("Rajpura Common Utils Loaded");

// Global Quality Rajpura configuration
const QualityRajpura_Config = {
    get PLANT_ID() {
        return this.getCurrentConfig().PLANT_ID;
    },
    get PLANT_NAME() {
        return this.getCurrentConfig().PLANT_NAME;
    },
    get QUALITY_DEPT_IDS() {
        return this.getCurrentConfig().QUALITY_DEPT_IDS;
    },
    get DATAVERSE_URL() {
        return this.getCurrentConfig().DATAVERSE_URL || "https://org487f0635.crm8.dynamics.com";
    },
    get FLOW_URL() {
        return this.getCurrentConfig().FLOW_URL;
    },
    get DATAVERSE_TABLES() {
        return this.getCurrentConfig().DATAVERSE_TABLES;
    },

    // Environment configurations for DEV, UAT, and PROD
    ENVIRONMENTS: {
        DEV: {
            TENANT_URL: "https://aufaitcloud.sharepoint.com/sites/Mrs_Bectors_PTMS",
            DATAVERSE_URL: "https://org487f0635.crm8.dynamics.com",
            FLOW_URL: "https://prod-23.northcentralus.logic.azure.com:443/workflows/placeholder-dev-flow", // Replace with actual Dev Notification Flow URL
            PLANT_ID: "14",
            PLANT_NAME: "Rajpura",
            QUALITY_DEPT_IDS: ["80", "81", "135"],
            DATAVERSE_TABLES: {
                PARENT_TOUR: "cr3ea_prod_rajpura_quality_tours",
                ALC: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_rajpura_alcses"
                },
                FOOD_SAFETY: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_foodsafetychecklistforrajpuras"
                },
                MIXING_BAKING: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_prod_rajpura_mixingandbakings"
                },
                PACKAGING_OPERATIONS: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD_TEMP_HUMIDITY: "cr3ea_prod_rajpura_pkgops_temphumidities",
                    CHILD_CODE_VERIFICATION: "cr3ea_prod_rajpura_pkgops_codeverifications",
                    CHILD_PAPA: "cr3ea_prod_rajpura_pkgops_papas",
                    CHILD_PQI_NET_WEIGHT: "cr3ea_prod_rajpura_pkgops_pqi_netweights",
                    CHILD_PQI_EVALUATION: "cr3ea_prod_rajpura_pkgops_pqi_evaluations",
                    CHILD_SEAL_INTEGRITY: "cr3ea_prod_rajpura_pkgops_sealintegrities",
                    CHILD_QUALITY_WALL: "cr3ea_prod_rajpura_pkgops_qualitywalls"
                },
                CCP_OPRP_SIEVES_MAGNETS: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD_CCP: "cr3ea_prod_rajpura_ccpoprps",
                    CHILD_SIEVES: "cr3ea_prod_rajpura_sievesmagnetses"
                }
            }
        },
        UAT: {
            TENANT_URL: "https://bectors.sharepoint.com/sites/PTMS_UAT",
            DATAVERSE_URL: "https://orgea61b289.crm8.dynamics.com",
            FLOW_URL: "https://prod-15.northcentralus.logic.azure.com:443/workflows/placeholder-uat-flow", // Replace with actual UAT Notification Flow URL
            PLANT_ID: "2",
            PLANT_NAME: "Rajpura",
            QUALITY_DEPT_IDS: ["18", "81", "135"],
            DATAVERSE_TABLES: {
                PARENT_TOUR: "cr3ea_rajpura_quality_tours",
                ALC: {
                    PARENT: "cr3ea_rajpura_quality_tours",
                    CHILD: "cr3ea_rajpura_alcses"
                },
                FOOD_SAFETY: {
                    PARENT: "cr3ea_rajpura_quality_tours",
                    CHILD: "cr3ea_foodsafetychecklistforrajpuras"
                },
                MIXING_BAKING: {
                    PARENT: "cr3ea_rajpura_quality_tours",
                    CHILD: "cr3ea_rajpura_mixingandbakings"
                },
                PACKAGING_OPERATIONS: {
                    PARENT: "cr3ea_rajpura_quality_tours",
                    CHILD_TEMP_HUMIDITY: "cr3ea_rajpura_pkgops_temphumidities",
                    CHILD_CODE_VERIFICATION: "cr3ea_rajpura_pkgops_codeverifications",
                    CHILD_PAPA: "cr3ea_rajpura_pkgops_papas",
                    CHILD_PQI_NET_WEIGHT: "cr3ea_rajpura_pkgops_pqi_netweights",
                    CHILD_PQI_EVALUATION: "cr3ea_rajpura_pkgops_pqi_evaluations",
                    CHILD_SEAL_INTEGRITY: "cr3ea_rajpura_pkgops_sealintegrities",
                    CHILD_QUALITY_WALL: "cr3ea_rajpura_pkgops_qualitywalls"
                },
                CCP_OPRP_SIEVES_MAGNETS: {
                    PARENT: "cr3ea_rajpura_quality_tours",
                    CHILD_CCP: "cr3ea_rajpura_ccpoprps",
                    CHILD_SIEVES: "cr3ea_rajpura_sievesmagnetses"
                }
            }
        },
        PROD: {
            TENANT_URL: "https://bectors.sharepoint.com/sites/PTMS_PRD",
            DATAVERSE_URL: "https://orgea61b289.crm8.dynamics.com",
            FLOW_URL: "https://default8efa5ce286e44882840cf2578cdf09.4c.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/14/workflows/a60198cce93940a2b4ab778d1ba39e04/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kJNXOOocZbvwbjuFQx2uNiZ_TXNWnX7wfBpH6nk_Ilg",
            PLANT_ID: "2",
            PLANT_NAME: "Rajpura",
            QUALITY_DEPT_IDS: ["39", "81", "135"],
            DATAVERSE_TABLES: {
                PARENT_TOUR: "cr3ea_prod_rajpura_quality_tours",
                ALC: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_prod_rajpura_alcses"
                },
                FOOD_SAFETY: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_prod_foodsafetychecklistforrajpuras"
                },
                MIXING_BAKING: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD: "cr3ea_prod_rajpura_mixingandbakings"
                },
                PACKAGING_OPERATIONS: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD_TEMP_HUMIDITY: "cr3ea_prod_rajpura_pkgops_temphumidities",
                    CHILD_CODE_VERIFICATION: "cr3ea_prod_rajpura_pkgops_codeverifications",
                    CHILD_PAPA: "cr3ea_prod_rajpura_pkgops_papas",
                    CHILD_PQI_NET_WEIGHT: "cr3ea_prod_rajpura_pkgops_pqi_netweights",
                    CHILD_PQI_EVALUATION: "cr3ea_prod_rajpura_pkgops_pqi_evaluations",
                    CHILD_SEAL_INTEGRITY: "cr3ea_prod_rajpura_pkgops_sealintegrities",
                    CHILD_QUALITY_WALL: "cr3ea_prod_rajpura_pkgops_qualitywalls"
                },
                CCP_OPRP_SIEVES_MAGNETS: {
                    PARENT: "cr3ea_prod_rajpura_quality_tours",
                    CHILD_CCP: "cr3ea_prod_rajpura_ccpoprps",
                    CHILD_SIEVES: "cr3ea_prod_rajpura_sievesmagnetses"
                }
            }
        }
    },

    // Resolves current environment dynamically based on site URL context
    getEnvironment: function () {
        const currentUrl = window.location.href.toLowerCase();
        if (currentUrl.includes("ptms_prd")) {
            return "PROD";
        } else if (currentUrl.includes("ptms_uat")) {
            return "UAT";
        } else if (currentUrl.includes("bectors.sharepoint.com")) {
            // Any site collection on the Bectors tenant (e.g. Mrs_Bectors_PTMS) is UAT unless ptms_prd
            return "UAT";
        } else if (currentUrl.includes("aufaitcloud") || currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
            return "DEV";
        }
        return "DEV"; // Default fallback
    },

    getCurrentConfig: function () {
        const env = this.getEnvironment();
        return this.ENVIRONMENTS[env];
    },

    // Resolves tour GUID across schemas
    getTourId: function (record) {
        if (!record || typeof record !== "object") return "";
        return record.cr3ea_prod_rajpura_quality_tourid || 
               record.cr3ea_rajpura_quality_tourid || 
               record.cr3ea_prod_rajpura_quality_toursid || 
               record.cr3ea_rajpura_quality_toursid || 
               record.cr3ea_qualitytourid || 
               "";
    },

    // Synchronizes both prod and uat tourid properties on the record
    normalizeTourRecord: function (record) {
        if (!record || typeof record !== "object") return record;
        const id = this.getTourId(record);
        if (id) {
            record.cr3ea_prod_rajpura_quality_tourid = id;
            record.cr3ea_rajpura_quality_tourid = id;
        }
        return record;
    },

    // Strict column whitelist for the Parent Tour entity (cr3ea_rajpura_quality_tour / cr3ea_prod_rajpura_quality_tour)
    PARENT_TOUR_COLUMNS: [
        "cr3ea_title",
        "cr3ea_tourstartdate",
        "cr3ea_plantid",
        "cr3ea_shift",
        "cr3ea_lineno",
        "cr3ea_assigned_qa",
        "cr3ea_shiftexecutiveproduction",
        "cr3ea_status",
        "cr3ea_processstatus",
        "cr3ea_observedby",
        "cr3ea_tourby",
        "cr3ea_previousrunningvariety",
        "cr3ea_runningvariety",
        "cr3ea_executivename",
        "cr3ea_overall_score",
        "cr3ea_total_checkpoints",
        "cr3ea_compliant_count",
        "cr3ea_non_compliant_count",
        "cr3ea_escalation_contacts",
        "cr3ea_islineclear",
        "cr3ea_pkgops_type",
        "cr3ea_ccp_oprp_sieves_parametertype",
        "cr3ea_ccp_oprp_sieves_frequency",
        "cr3ea_food_safety_checklisttype",
        "cr3ea_batchno",
        "cr3ea_cycle"
    ],

    // Strips invalid properties and maps aliases before sending parent tour to Dataverse
    sanitizeParentTourPayload: function (payload) {
        if (!payload || typeof payload !== "object") return payload;
        const clean = {};
        const validSet = new Set(this.PARENT_TOUR_COLUMNS);

        // Map common aliases to their proper schema column names
        if (payload.cr3ea_lineid && !payload.cr3ea_lineno) payload.cr3ea_lineno = payload.cr3ea_lineid;
        if (payload.cr3ea_food_safety_cycle && !payload.cr3ea_cycle) payload.cr3ea_cycle = payload.cr3ea_food_safety_cycle;
        if (payload.cr3ea_ccp_oprp_sieves_productvariety && !payload.cr3ea_runningvariety) payload.cr3ea_runningvariety = payload.cr3ea_ccp_oprp_sieves_productvariety;

        for (const key of Object.keys(payload)) {
            if (validSet.has(key)) {
                clean[key] = payload[key];
            }
        }
        return clean;
    },

    // Resolves current server-relative site URL based on environment (DEV, UAT, PROD)
    getSiteBaseUrl: function () {
        if (typeof _spPageContextInfo !== "undefined" && _spPageContextInfo.webServerRelativeUrl) {
            return _spPageContextInfo.webServerRelativeUrl.replace(/\/+$/, "");
        }
        const currentUrl = window.location.href.toLowerCase();
        if (currentUrl.includes("ptms_uat")) {
            return "/sites/PTMS_UAT";
        } else if (currentUrl.includes("ptms_prd")) {
            return "/sites/PTMS_PRD";
        }
        return "/sites/Mrs_Bectors_PTMS";
    },

    // SharePoint List Names categorized by form
    SHAREPOINT_LISTS: {
        CONFIG: "Quality-Rajpura-ALC",
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
        MIXING_BAKING: "MixingBaking_Docs",
        PACKAGING_OPERATIONS: "PackagingOperations_Docs"
    }
};

// Export globally for standard script tags
window.QualityRajpura_Config = QualityRajpura_Config;

// Automatically sync environmentUrl for Dataverse operations across all quality modules
if (typeof window !== "undefined") {
    try {
        Object.defineProperty(window, "environmentUrl", {
            get: function () {
                return (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.DATAVERSE_URL)
                    ? QualityRajpura_Config.DATAVERSE_URL
                    : "https://orgea61b289.crm8.dynamics.com";
            },
            set: function () {},
            configurable: true
        });
    } catch (e) {
        window.environmentUrl = QualityRajpura_Config.DATAVERSE_URL;
    }
}



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

/**
 * Compresses an image file on the client-side using Canvas to optimize upload speeds.
 * @param {File} file - The file selected from input or camera.
 * @param {Object} options - Custom options (maxWidth, maxHeight, quality).
 * @returns {Promise<File>} - Resolves to the compressed File object.
 */
window.compressImageFile = function (file, options = {}) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith("image/")) {
            return resolve(file);
        }

        const maxWidth = options.maxWidth || 1024;
        const maxHeight = options.maxHeight || 1024;
        const quality = options.quality !== undefined ? options.quality : 0.7;

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            let newName = file.name;
                            const lastDot = newName.lastIndexOf(".");
                            if (lastDot !== -1) {
                                newName = newName.substring(0, lastDot) + ".jpg";
                            } else {
                                newName = newName + ".jpg";
                            }
                            const compressedFile = new File([blob], newName, {
                                type: "image/jpeg",
                                lastModified: Date.now()
                            });
                            console.log(`Image compressed: ${file.name} (${Math.round(file.size / 1024)} KB -> ${Math.round(compressedFile.size / 1024)} KB)`);
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = function () {
                resolve(file);
            };
            img.src = event.target.result;
        };
        reader.onerror = function () {
            resolve(file);
        };
        reader.readAsDataURL(file);
    });
};
