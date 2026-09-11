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
        UAT: {
            TENANT_URL: "https://bectors.sharepoint.com/sites/PTMS_UAT",
            DATAVERSE_URL: "https://orgea61b289.crm8.dynamics.com",
            FLOW_URL: "https://defaultaa44c5c154484e7488d917838a6f9d.5a.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/19/workflows/def2982fbbfd44c5b6c2802642d63c52/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=koDPeZndomoORPqxJrsyG3OfSvXZ3K2xpplHuKj78vM", 
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
            FLOW_URL: "",
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
        PACKAGING_OPERATIONS: "PackagingOperations_Docs",
        FOOD_SAFETY: "FoodSafetyRajpuraDocs"
    },

    // Helper to safely parse remarks text and proof URL from delimited string
    parseRemarksAndProof: function (raw) {
        if (!raw || typeof raw !== "string") return { remarks: "", proofUrl: "" };
        var rawTrimmed = raw.trim();
        if (!rawTrimmed || rawTrimmed === "--" || rawTrimmed === "N/A") return { remarks: "", proofUrl: "" };

        var remarks = rawTrimmed;
        var proofUrl = "";

        if (rawTrimmed.includes(" | Proof: ")) {
            var parts = rawTrimmed.split(" | Proof: ");
            remarks = parts[0].trim();
            proofUrl = parts.slice(1).join(" | Proof: ").trim();
        } else if (rawTrimmed.includes("| Proof: ")) {
            var parts2 = rawTrimmed.split("| Proof: ");
            remarks = parts2[0].trim();
            proofUrl = parts2.slice(1).join("| Proof: ").trim();
        } else if (rawTrimmed.startsWith("Proof: ")) {
            remarks = "";
            proofUrl = rawTrimmed.substring(7).trim();
        } else if (rawTrimmed.includes("Proof: ")) {
            var parts3 = rawTrimmed.split("Proof: ");
            remarks = parts3[0].replace(/[\|\-\s]+$/, "").trim();
            proofUrl = parts3.slice(1).join("Proof: ").trim();
        } else if (rawTrimmed.startsWith("/sites/") || rawTrimmed.startsWith("http://") || rawTrimmed.startsWith("https://")) {
            remarks = "";
            proofUrl = rawTrimmed.trim();
        }

        if (remarks.startsWith("Proof: ") || remarks.startsWith("/sites/") || remarks.startsWith("http")) {
            remarks = "";
        }

        return { remarks: remarks, proofUrl: proofUrl };
    },

    // Helper to safely format clean remarks text with proof URL
    formatRemarksWithProof: function (remarks, proofUrl) {
        var cleanRemarks = remarks || "";
        if (typeof cleanRemarks === "string") {
            var parsed = this.parseRemarksAndProof(cleanRemarks);
            cleanRemarks = parsed.remarks;
            if (!proofUrl && parsed.proofUrl) {
                proofUrl = parsed.proofUrl;
            }
        }
        cleanRemarks = (cleanRemarks || "").trim();
        if (proofUrl) {
            return cleanRemarks ? cleanRemarks + " | Proof: " + proofUrl : "Proof: " + proofUrl;
        }
        return cleanRemarks;
    },

    // Fetches recent parent tours from Dataverse
    fetchRecentTours: async function (token, topCount = 50) {
        if (!token) {
            try {
                const stored = JSON.parse(localStorage.getItem("access_token") || "null");
                if (stored && stored.token) token = stored.token;
            } catch (e) {}
        }
        if (!token) return [];
        const apiVersion = "9.2";
        const tableName = this.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = this.DATAVERSE_URL || "";
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}?$filter=(cr3ea_plantid eq '${this.PLANT_ID}' or cr3ea_plantid eq 'Rajpura' or cr3ea_plantid eq '2' or cr3ea_plantid eq '14')&$orderby=cr3ea_tourstartdate desc&$top=${topCount}`;
        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };
        try {
            const response = await fetch(url, { method: "GET", headers });
            if (!response.ok) return [];
            const data = await response.json();
            return (data.value || []).map(t => this.normalizeTourRecord(t));
        } catch (e) {
            console.warn("fetchRecentTours error:", e);
            return [];
        }
    },

    // Cancels an active parent tour session in Dataverse
    cancelTourSession: async function (tourId, token) {
        if (!tourId) return false;
        if (!token) {
            try {
                const stored = JSON.parse(localStorage.getItem("access_token") || "null");
                if (stored && stored.token) token = stored.token;
            } catch (e) {}
        }
        if (!token) return false;
        const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();
        const apiVersion = "9.2";
        const tableName = this.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = this.DATAVERSE_URL || "";
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${cleanId})`;
        const payload = {
            cr3ea_status: "Cancelled",
            cr3ea_processstatus: "Cancelled"
        };
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };
        try {
            const resp = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(payload) });
            return resp.ok;
        } catch (e) {
            console.warn("cancelTourSession error:", e);
            return false;
        }
    },

    // Checks if an active tour already exists for the same line today and prompts user for override confirmation
    checkAndPromptLineOverride: async function (options) {
        const { moduleKey, line, subType, currentTourId, token } = options || {};
        if (!line) return true;

        const normLine = (str) => {
            let s = String(str || "").toLowerCase().replace(/[\s\-_]/g, "");
            if (s.startsWith("line")) {
                s = s.substring(4);
            }
            return s;
        };

        const cleanLine = normLine(line);
        const cleanCurrentId = currentTourId ? String(currentTourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
        const todayStr = (typeof moment !== "undefined") ? moment().format("YYYY-MM-DD") : new Date().toISOString().split("T")[0];

        try {
            const tours = await this.fetchRecentTours(token, 50);

            const activeSession = tours.find(s => {
                const sid = this.getTourId(s);
                const cleanSessionId = sid ? String(sid).replace(/[{}]/g, "").trim().toLowerCase() : "";
                if (cleanCurrentId && cleanSessionId === cleanCurrentId) return false;

                // Line match (e.g. "Line 1", "Line-1", "Line1", "1")
                const sLine = normLine(s.cr3ea_lineno || s.cr3ea_lineid || "");
                if (sLine !== cleanLine) return false;

                // Module match
                const title = s.cr3ea_title || "";
                const paramType = s.cr3ea_ccp_oprp_sieves_parametertype || "";
                const pkgOpsType = s.cr3ea_pkgops_type || "";
                const fsType = s.cr3ea_food_safety_checklisttype || "";

                let moduleMatch = false;
                if (moduleKey === "CCP") {
                    moduleMatch = paramType === "CCP & OPRP" || title.startsWith("CCP_");
                } else if (moduleKey === "PKGOPS") {
                    if (subType) {
                        moduleMatch = pkgOpsType === subType || title.includes(String(subType).replace(/[^a-zA-Z0-9]/g, ""));
                    } else {
                        moduleMatch = !!pkgOpsType || title.startsWith("PkgOps_");
                    }
                } else if (moduleKey === "FOOD_SAFETY") {
                    if (subType) {
                        moduleMatch = fsType === subType || title.includes(String(subType).replace(" Checklist", ""));
                    } else {
                        moduleMatch = !!fsType || title.startsWith("FoodSafety_");
                    }
                } else if (moduleKey === "MIXING_BAKING") {
                    moduleMatch = title.startsWith("MixingBaking_");
                } else if (moduleKey === "ALC") {
                    moduleMatch = !paramType && !pkgOpsType && !fsType && !title.startsWith("MixingBaking_");
                }

                if (!moduleMatch) return false;

                // Date match (must be from today)
                const tourDate = s.cr3ea_tourstartdate || s.createdon;
                const sDateStr = (typeof moment !== "undefined" && tourDate)
                    ? moment(tourDate).local().format("YYYY-MM-DD")
                    : (tourDate ? new Date(tourDate).toISOString().split("T")[0] : "");
                if (sDateStr !== todayStr) return false;

                // Status match (must not be terminal)
                const st1 = (s.cr3ea_status || "").trim().toLowerCase();
                const st2 = (s.cr3ea_processstatus || "").trim().toLowerCase();
                const isTerminal = st1 === "completed" || st1 === "closed" || st1 === "closed - expired" ||
                                   st1 === "failed - expired" || st1 === "success" || st1 === "success - expired" ||
                                   st1 === "submitted" || st1 === "cancelled" || st1.includes("expired") ||
                                   st2 === "completed" || st2 === "closed" || st2 === "closed - expired" ||
                                   st2 === "failed - expired" || st2 === "success" || st2 === "success - expired" ||
                                   st2 === "submitted" || st2 === "cancelled" || st2.includes("expired");

                if (isTerminal) return false;

                // For ALC, check if line was already cleared
                const isClearedVal = s.cr3ea_islineclear;
                const isCleared = isClearedVal === true || isClearedVal === 1 || isClearedVal === "1" ||
                                  (typeof isClearedVal === "string" && isClearedVal.toLowerCase().trim() === "yes");
                if (moduleKey === "ALC" && isCleared) return false;

                return true;
            });

            if (activeSession) {
                if (typeof HideLoader === "function") HideLoader();
                const tourDate = activeSession.cr3ea_tourstartdate || activeSession.createdon;
                const tourTimeStr = (typeof moment !== "undefined" && tourDate)
                    ? moment(tourDate).format("hh:mm A")
                    : "earlier today";
                const moduleNameDisplay = subType || (moduleKey === "CCP" ? "CCP & OPRP" : moduleKey === "PKGOPS" ? "Packaging Operations" : moduleKey === "FOOD_SAFETY" ? "Food Safety" : moduleKey === "MIXING_BAKING" ? "Mixing & Baking" : "Quality");
                const override = confirm(`${line} already has an active ${moduleNameDisplay} tour started at ${tourTimeStr}. Do you want to override and start a new tour?`);
                if (!override) {
                    return false;
                }
                if (typeof ShowLoader === "function") ShowLoader();
                const cancelId = this.getTourId(activeSession);
                if (cancelId) {
                    await this.cancelTourSession(cancelId, token);
                    console.log(`Cancelled previous active session ${cancelId} for ${line}`);
                }
            }
        } catch (err) {
            console.warn("checkAndPromptLineOverride check failed, proceeding anyway:", err);
        }

        return true;
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
