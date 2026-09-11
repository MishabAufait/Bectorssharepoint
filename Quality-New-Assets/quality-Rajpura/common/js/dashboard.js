// Common Quality Dashboard controller for Rajpura plant forms
console.log("Rajpura Quality Dashboard Script loaded");

$(document).ready(function () {
    // Dynamically inject common/css/global.css to style the Rajpura Quality Dashboard without modifying WelcomePage.html
    const linkId = "rajpura-quality-global-css";
    if (!document.getElementById(linkId)) {
        const link = document.createElement("link");
        link.id = linkId;
        const webUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webServerRelativeUrl)
            ? _spPageContextInfo.webServerRelativeUrl.replace(/\/+$/, '')
            : (window.location.href.toLowerCase().indexOf("ptms_uat") !== -1 ? "/sites/PTMS_UAT" :
              (window.location.href.toLowerCase().indexOf("ptms_prd") !== -1 ? "/sites/PTMS_PRD" : "/sites/Mrs_Bectors_PTMS"));
        link.href = `${webUrl}/BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/css/global.css`;
        document.head.appendChild(link);
    }

    // Dynamically inject common/js/admin.js if not yet loaded
    const adminScriptId = "rajpura-quality-admin-js";
    if (!document.getElementById(adminScriptId) && typeof window.Rajpura_Admin === 'undefined') {
        const script = document.createElement("script");
        script.id = adminScriptId;
        const webUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webServerRelativeUrl)
            ? _spPageContextInfo.webServerRelativeUrl.replace(/\/+$/, '')
            : (window.location.href.toLowerCase().indexOf("ptms_uat") !== -1 ? "/sites/PTMS_UAT" :
              (window.location.href.toLowerCase().indexOf("ptms_prd") !== -1 ? "/sites/PTMS_PRD" : "/sites/Mrs_Bectors_PTMS"));
        script.src = `${webUrl}/BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/admin.js?v=2.0`;
        document.body.appendChild(script);
    }
    ALC_Dashboard.init();
});

const ALC_Dashboard = {
    qaList: [],
    selectedCategory: (() => {
        const val = localStorage.getItem("lastVisitedDashboard");
        const valid = ["ALC", "FoodSafety", "CCP_OPRP_Sieves", "MixingAndBaking", "PackagingOperations"];
        return valid.includes(val) ? val : "ALC";
    })(),
    allToursRaw: [],

    loadConfig: async function () {
        try {
            const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
            const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CONFIG;

            let query = `?$select=Id,Title,ConfigType,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id&$expand=AssignedUser,EscalationManager&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
            let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            let response;
            let isFallback = false;

            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                if (!response.ok) throw new Error();
            } catch (e) {
                isFallback = true;
                query = `?$select=Id,Title,Config_x0020_Type,Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id,Escalation_x0020_Manager/Title,Escalation_x0020_Manager/EMail,Escalation_x0020_Manager/Id&$expand=Assigned_x0020_User,Escalation_x0020_Manager&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
                url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            }

            if (response && response.ok) {
                const data = await response.json();
                const results = data.d.results;
                this.qaList = results.map(item => {
                    const rawUser = isFallback ? item.Assigned_x0020_User : item.AssignedUser;
                    let assignedUserNormalized = { results: [] };
                    if (rawUser) {
                        if (rawUser.results && Array.isArray(rawUser.results)) {
                            assignedUserNormalized = rawUser;
                        } else if (rawUser.Title || rawUser.EMail) {
                            assignedUserNormalized = { results: [rawUser] };
                        }
                    }

                    const rawManager = isFallback ? item.Escalation_x0020_Manager : item.EscalationManager;
                    let escalationManagerNormalized = { results: [] };
                    if (rawManager) {
                        if (rawManager.results && Array.isArray(rawManager.results)) {
                            escalationManagerNormalized = rawManager;
                        } else if (rawManager.Title || rawManager.EMail) {
                            escalationManagerNormalized = { results: [rawManager] };
                        }
                    }

                    const configType = isFallback ? item.Config_x0020_Type : item.ConfigType;

                    return {
                        Title: configType || item.Title,
                        AssignedUser: assignedUserNormalized,
                        EscalationManager: escalationManagerNormalized
                    };
                });
            }
        } catch (err) {
            console.error("Failed to load QA config list in dashboard:", err);
        }
    },

    resolveQaNameFromEmail: function (email) {
        if (!email) return "N/A";
        if (this.qaList && this.qaList.length > 0) {
            for (const item of this.qaList) {
                if (item.AssignedUser && item.AssignedUser.results) {
                    const match = item.AssignedUser.results.find(u => u.EMail && u.EMail.toLowerCase() === email.toLowerCase());
                    if (match) return match.Title;
                }
            }
        }
        // Fallback parsing (e.g. mishab.muhammed@domain.com -> Mishab Muhammed)
        if (email.includes("@")) {
            const clean = email.split("@")[0].trim();
            const parts = clean.split(".");
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        }
        return email;
    },

    init: async function () {
        // Poll every 100ms for up to 10 seconds to wait for async WelcomeWebPart user variables to load
        let attempts = 0;
        const maxAttempts = 100;

        const checkInterval = setInterval(async () => {
            const plant = typeof userPlantId !== 'undefined' ? userPlantId : "";
            const deptId = typeof userDepratmentId !== 'undefined' ? userDepratmentId.toString() : "";
            const pId = typeof Plantid !== 'undefined' ? Plantid.toString() : "";

            attempts++;

            if (plant !== "" || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.log(`Resolved user details after ${attempts * 100}ms. Plant=${plant}, Dept=${deptId}`);

                // Load QA configurations
                await ALC_Dashboard.loadConfig();

                // Initial evaluation of dashboard state
                await ALC_Dashboard.evaluateDashboardState();

                // Set up event listener on department dropdown changes to dynamically switch dashboards
                const deptDropdown = document.getElementById("DepartmentDropDownId");
                if (deptDropdown) {
                    $(deptDropdown).on("change", async () => {
                        console.log("Department dropdown changed to: " + deptDropdown.value);
                        await ALC_Dashboard.evaluateDashboardState();
                    });
                }

                // Set up event listener on dashboard category dropdown selection changes
                const categoryDropdown = document.getElementById("dashboardCategorySelect");
                if (categoryDropdown) {
                    $(categoryDropdown).off("change.cat").on("change.cat", () => {
                        console.log("Dashboard category changed to: " + categoryDropdown.value);
                        ALC_Dashboard.selectedCategory = categoryDropdown.value;
                        localStorage.setItem("lastVisitedDashboard", categoryDropdown.value);
                        ALC_Dashboard.applyCategoryFilter();
                    });
                }
            }
        }, 100);
    },

    evaluateDashboardState: async function () {
        try {
            const plant = typeof userPlantId !== 'undefined' ? userPlantId : "";
            const pId = typeof Plantid !== 'undefined' ? Plantid.toString() : "";

            // Read selected department from dropdown if it is chosen, fallback to user's profile department
            const dropdownEl = document.getElementById("DepartmentDropDownId");
            const deptId = (dropdownEl && dropdownEl.value !== "All") ? dropdownEl.value.toString() : (typeof userDepratmentId !== 'undefined' ? userDepratmentId.toString() : "");

            // 1. Check if department is Quality
            const isQualityDept = (typeof isQualityDepartment === 'function' && isQualityDepartment()) ||
                QualityRajpura_Config.QUALITY_DEPT_IDS.includes(deptId) ||
                (typeof DepartmentNameLeftNavi === "string" && DepartmentNameLeftNavi.toLowerCase().includes("quality"));

            // 2. Check if department is Production (authorized for line tour tracking only)
            const isProdDept = (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("prod") || DepartmentNameLeftNavi.toLowerCase().includes("baking") || DepartmentNameLeftNavi.toLowerCase().includes("mixing"))) ||
                (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod")) ||
                deptId === "82";

            // 3. Check if plant is strictly Rajpura
            const isPlantRajpura = (typeof isRajpuraPlant === 'function' && isRajpuraPlant()) ||
                (typeof plant === 'string' && plant.toLowerCase().indexOf('rajpura') !== -1) ||
                pId === QualityRajpura_Config.PLANT_ID ||
                pId === "14" ||
                pId === "2" ||
                (plant === "" && pId === ""); // Local / offline fallback when not initialized

            // 4. Strict Rajpura Quality qualification
            const isRajpuraQuality = isPlantRajpura && isQualityDept;
            const isRajpuraAuthorized = isPlantRajpura && (isQualityDept || isProdDept);

            console.log(`Evaluating Dashboard: Plant=${plant}, SelectedDept=${deptId}, isPlantRajpura=${isPlantRajpura}, isRajpuraQuality=${isRajpuraQuality}, isRajpuraAuthorized=${isRajpuraAuthorized}`);

            if (isRajpuraAuthorized) {
                // Admin Panel is strictly available under Rajpura Quality section only for authorized Admins
                if (isRajpuraQuality && typeof Rajpura_Admin !== 'undefined' && Rajpura_Admin.detectAdminUrl && Rajpura_Admin.detectAdminUrl()) {
                    const isAdmin = (typeof Rajpura_Admin.checkAdminAccess === "function") ? await Rajpura_Admin.checkAdminAccess() : false;
                    if (isAdmin) {
                        await Rajpura_Admin.activateAdminPanel();
                    } else {
                        console.warn("User attempted Admin view without AdminPanel list authorization. Redirecting to Quality Dashboard.");
                        try {
                            const url = new URL(window.location.href);
                            url.searchParams.delete("view");
                            url.searchParams.delete("admin");
                            window.history.replaceState({}, "", url.toString());
                        } catch (e) {}
                        await ALC_Dashboard.activateDashboard(isRajpuraQuality);
                    }
                } else {
                    await ALC_Dashboard.activateDashboard(isRajpuraQuality);
                }
            } else {
                ALC_Dashboard.deactivateDashboard();
            }
        } catch (e) {
            console.error("Error in evaluateDashboardState: ", e);
        }
    },

    activateDashboard: async function (isRajpuraQualityParam) {
        try {
            console.log("Activating Rajpura Common Quality Dashboard");

            const plant = typeof userPlantId !== 'undefined' ? userPlantId : "";
            const pId = typeof Plantid !== 'undefined' ? Plantid.toString() : "";
            const dropdownEl = document.getElementById("DepartmentDropDownId");
            const deptId = (dropdownEl && dropdownEl.value !== "All") ? dropdownEl.value.toString() : (typeof userDepratmentId !== 'undefined' ? userDepratmentId.toString() : "");

            const isRajpuraQuality = (typeof isRajpuraQualityParam === 'boolean') ? isRajpuraQualityParam : (
                ((typeof isRajpuraPlant === 'function' && isRajpuraPlant()) || (typeof plant === 'string' && plant.toLowerCase().indexOf('rajpura') !== -1) || pId === QualityRajpura_Config.PLANT_ID || pId === "14" || pId === "2" || (plant === "" && pId === "")) &&
                ((typeof isQualityDepartment === 'function' && isQualityDepartment()) || QualityRajpura_Config.QUALITY_DEPT_IDS.includes(deptId) || (typeof DepartmentNameLeftNavi === "string" && DepartmentNameLeftNavi.toLowerCase().includes("quality")))
            );

            // Safeguard: if URL requests admin panel AND is strictly Rajpura Quality, render admin panel instead if authorized
            if (isRajpuraQuality && typeof Rajpura_Admin !== 'undefined' && Rajpura_Admin.detectAdminUrl && Rajpura_Admin.detectAdminUrl()) {
                const isAdmin = (typeof Rajpura_Admin.checkAdminAccess === "function") ? await Rajpura_Admin.checkAdminAccess() : false;
                if (isAdmin) {
                    await Rajpura_Admin.activateAdminPanel();
                    return;
                } else {
                    try {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("view");
                        url.searchParams.delete("admin");
                        window.history.replaceState({}, "", url.toString());
                    } catch (e) {}
                }
            }

            const dashboardEl = document.getElementById("rajpuraQualityDashboard");
            if (!dashboardEl) {
                console.warn("Custom Rajpura dashboard element (#rajpuraQualityDashboard) not found in DOM (possibly cached). Aborting activation.");
                return;
            }

            // 1. Hide generic default dashboards and prevent horizontal overflow
            $('#ShowObservation').hide();
            $('#tblTourScores, #tblOpenObservationInner, #divtblDepartmentScores, .tblTourScores').hide();
            $('#tblOpenObservationInner').closest('.container-fluid').hide();
            $('#ShowCategory').hide();
            $('#ShowGraph').hide();

            // 2. Hide Admin Panel container when viewing standard Quality Dashboard
            $('#rajpuraAdminPanel').hide();

            // 3. Show the Rajpura Dashboard wrapper and Dashboard view
            $(dashboardEl).show();
            $('#rajpuraDashboardView').show();

            // 4. Inject Admin Panel button into header ONLY for Rajpura Quality section AND if user is in AdminPanel list
            if (isRajpuraQuality) {
                const isAdmin = (typeof Rajpura_Admin !== 'undefined' && typeof Rajpura_Admin.checkAdminAccess === 'function') 
                    ? await Rajpura_Admin.checkAdminAccess() 
                    : false;

                if (isAdmin) {
                    if (!document.getElementById("btn-goto-admin-panel")) {
                        const headerRight = $(dashboardEl).find(".bs-card-header > div").first();
                        if (headerRight.length) {
                            const adminBtnHtml = `
                                <button type="button" id="btn-goto-admin-panel" onclick="Rajpura_Admin.switchToAdmin()" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; border-radius: 6px; background-color: #1e40af; color: #ffffff; border: none; cursor: pointer; box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2); transition: all 0.15s ease;">
                                    ⚙️ Admin Panel
                                </button>
                            `;
                            headerRight.append(adminBtnHtml);
                        }
                    }
                } else {
                    $('#btn-goto-admin-panel').remove();
                }
            } else {
                $('#btn-goto-admin-panel').remove();
            }

            // Bind category selector if present in DOM
            const categoryDropdown = document.getElementById("dashboardCategorySelect");
            if (categoryDropdown) {
                $(categoryDropdown).off("change.cat").on("change.cat", () => {
                    console.log("Dashboard category changed to: " + categoryDropdown.value);
                    ALC_Dashboard.selectedCategory = categoryDropdown.value;
                    localStorage.setItem("lastVisitedDashboard", categoryDropdown.value);
                    ALC_Dashboard.applyCategoryFilter();
                });
                // Sync select state with category (triggers Select2 UI update)
                $(categoryDropdown).val(ALC_Dashboard.selectedCategory).trigger("change");
            }

            // 5. Load all tours and split them
            await ALC_Dashboard.loadAllTours();
        } catch (e) {
            console.error("Error in activateDashboard: ", e);
        }
    },

    deactivateDashboard: function () {
        console.log("Deactivating Rajpura Common Quality Dashboard");

        // 1. Hide the Rajpura Dashboard, Admin Panel wrappers and button
        $('#rajpuraQualityDashboard').hide();
        $('#rajpuraDashboardView').hide();
        $('#rajpuraAdminPanel').hide();
        $('#btn-goto-admin-panel').remove();

        // 2. Restore visibility of default SharePoint dashboards
        $('#ShowObservation').show();
        $('#tblTourScores, #tblOpenObservationInner, #divtblDepartmentScores, .tblTourScores').show();
        $('#tblOpenObservationInner').closest('.container-fluid').show();
        $('#ShowCategory').show();
        $('#ShowGraph').show();
    },

    expireTour: async function (tourId) {
        try {
            console.log(`Auto-expiring Quality Tour GUID: ${tourId}`);
            const token = typeof getAccessToken === "function" ? await getAccessToken() : null;
            if (!token) {
                console.warn("Could not retrieve token to auto-expire tour");
                return;
            }

            const apiVersion = "9.2";
            const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
            const url = `${baseApiUrl}/api/data/v${apiVersion}/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${tourId})`;

            const body = {
                cr3ea_status: "Closed - Expired",
                cr3ea_processstatus: "Closed - Expired",
                cr3ea_islineclear: true
            };

            let response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (response.status === 401) {
                console.warn("expireTour: 401 Unauthorized detected. Clearing cached token and retrying...");
                localStorage.removeItem("access_token");
                const freshToken = typeof getAccessToken === "function" ? await getAccessToken() : null;
                if (freshToken) {
                    response = await fetch(url, {
                        method: "PATCH",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "OData-MaxVersion": "4.0",
                            "OData-Version": "4.0",
                            "Authorization": `Bearer ${freshToken}`
                        },
                        body: JSON.stringify(body)
                    });
                }
            }

            if (!response.ok) {
                const text = await response.text();
                console.error(`Failed to patch tour expiration in Dataverse: ${text}`);
                return false;
            } else {
                console.log(`Successfully patched tour expiration for GUID: ${tourId}`);
                return true;
            }
        } catch (e) {
            console.error(`Exception during auto-expiring tour: `, e);
            return false;
        }
    },

    // Fetch all tours for Rajpura and split into active/ongoing and archives
    loadAllTours: async function () {
        const refreshBtn = document.getElementById("btn-refresh-dashboard");
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = "⌛ Refreshing...";
        }
        try {
            const token = typeof getAccessToken === "function" ? await getAccessToken() : null;
            if (!token) throw new Error("No token");

            const apiVersion = "9.2";
            const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

            const filter = `?$filter=(cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}' or cr3ea_plantid eq 'Rajpura')&$orderby=cr3ea_tourstartdate desc&$top=100`;
            const url = `${baseApiUrl}/api/data/v${apiVersion}/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}${filter}`;

            let response = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json; charset=utf-8",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    "Prefer": "return=representation",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                console.warn("loadAllTours: 401 Unauthorized detected. Clearing cached token and retrying...");
                localStorage.removeItem("access_token");
                const freshToken = typeof getAccessToken === "function" ? await getAccessToken() : null;
                if (freshToken) {
                    response = await fetch(url, {
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json; charset=utf-8",
                            "OData-MaxVersion": "4.0",
                            "OData-Version": "4.0",
                            "Prefer": "return=representation",
                            "Authorization": `Bearer ${freshToken}`
                        }
                    });
                }
            }

            if (!response.ok) throw new Error("OData fetch failed");
            const data = await response.json();
            const rawList = data.value || [];
            const list = rawList.map(item => {
                return (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.normalizeTourRecord)
                    ? QualityRajpura_Config.normalizeTourRecord(item)
                    : item;
            });

            // Auto-expire previous day's active tours
            const todayLocal = moment().format("YYYY-MM-DD");
            const expirePromises = [];
            for (const t of list) {
                let status = t.cr3ea_processstatus || t.cr3ea_status || "In Progress";
                const isTerminal = status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success" || status === "Success - Expired" || status === "Submitted";
                
                if (!isTerminal) {
                    const creationTime = t.cr3ea_tourstartdate || t.createdon;
                    if (creationTime) {
                        const parsedDate = ALC_Dashboard.parseDateMoment(creationTime);
                        if (parsedDate && parsedDate.isValid()) {
                            const tourDateLocal = parsedDate.local().format("YYYY-MM-DD");
                            if (tourDateLocal !== todayLocal) {
                                const tourId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                                    ? QualityRajpura_Config.getTourId(t)
                                    : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                                console.log(`Auto-expiring tour from previous day in dashboard: ${tourId} (Started: ${tourDateLocal})`);
                                if (tourId) {
                                    expirePromises.push(
                                        ALC_Dashboard.expireTour(tourId)
                                            .then((success) => {
                                                if (success) {
                                                    t.cr3ea_status = "Closed - Expired";
                                                    t.cr3ea_processstatus = "Closed - Expired";
                                                    t.cr3ea_islineclear = true;
                                                }
                                            })
                                    );
                                }
                            }
                        }
                    }
                }
            }
            if (expirePromises.length > 0) {
                await Promise.all(expirePromises);
            }

            // Sort all tours by start date/time (latest first)
            list.sort((a, b) => {
                const valA = a.cr3ea_tourstartdate || a.createdon || "";
                const valB = b.cr3ea_tourstartdate || b.createdon || "";

                const timeA = ALC_Dashboard.parseDateMoment(valA);
                const timeB = ALC_Dashboard.parseDateMoment(valB);

                const msA = (timeA && timeA.isValid()) ? timeA.valueOf() : 0;
                const msB = (timeB && timeB.isValid()) ? timeB.valueOf() : 0;

                return msB - msA;
            });

            ALC_Dashboard.allToursRaw = list;

            // Trigger category filtering and rendering
            await ALC_Dashboard.applyCategoryFilter();

        } catch (error) {
            console.error("Failed to load Dataverse tours:", error);
            alert("Dataverse Connection Failed: Unable to retrieve tour history from Dataverse.\n\n" + (error.message || "Please verify your login session or network connection."));
            ALC_Dashboard.allToursRaw = [];
            await ALC_Dashboard.applyCategoryFilter();
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = "🔄 Refresh";
            }
        }
    },

    applyCategoryFilter: async function () {
        const isFS = this.selectedCategory === "FoodSafety";
        const isCCP = this.selectedCategory === "CCP_OPRP_Sieves";
        const isMB = this.selectedCategory === "MixingAndBaking";
        const isPkgOps = this.selectedCategory === "PackagingOperations";
        
        // Filter raw list
        const filteredList = this.allToursRaw.filter(t => {
            const titleVal = String(t.cr3ea_title || "");
            let cleanTitle = titleVal.split("||")[0].trim();
            
            const isMBTitle = cleanTitle.startsWith("MixingBaking_") || cleanTitle.toLowerCase().includes("mixingbaking");
            const isMBItem = isMBTitle;

            const isFSPrefix = cleanTitle.startsWith("FoodSafety_") || cleanTitle.startsWith("Food_Safety_");
            if (isFSPrefix) {
                cleanTitle = cleanTitle.replace("FoodSafety_", "").replace("Food_Safety_", "");
            }
            const isFSTitle = isFSPrefix || cleanTitle.startsWith("PPE_") || cleanTitle.startsWith("GMP_") || cleanTitle.startsWith("PCI_") || cleanTitle.toLowerCase().includes("checklist");
            const hasFSField = t.cr3ea_food_safety_checklisttype;
            const isFSItem = !!hasFSField || isFSTitle;
            
            const hasCCPField = t.cr3ea_ccp_oprp_sieves_parametertype;
            const isCCPTitle = cleanTitle.startsWith("CCP_") || cleanTitle.startsWith("Sieves_") || cleanTitle.toLowerCase().includes("ccp") || cleanTitle.toLowerCase().includes("sieves");
            const isCCPItem = !!hasCCPField || isCCPTitle;

            const isPkgOpsTitle = cleanTitle.startsWith("PkgOps_") || cleanTitle.startsWith("PackagingOperations_") || cleanTitle.toLowerCase().includes("pkgops");
            const hasPkgOpsField = t.cr3ea_pkgops_type;
            const isPkgOpsItem = !!hasPkgOpsField || isPkgOpsTitle;

            if (isFS) {
                return isFSItem;
            } else if (isCCP) {
                return isCCPItem;
            } else if (isMB) {
                return isMBItem;
            } else if (isPkgOps) {
                return isPkgOpsItem;
            } else {
                return !isFSItem && !isCCPItem && !isMBItem && !isPkgOpsItem;
            }
        });

        // Update headers & labels
        this.updateKpiLabels();
        this.updateTableHeaders();

        // Calculate KPIs for filtered list
        const totalTours = filteredList.length;
        
        let metric2 = 0; // Lines On Hold (ALC) or Failed (FS) or Overdue (CCP)
        let metric3 = 0; // Open Observations (ALC) or In Progress (FS) or In Progress (CCP)
        let metric4 = 0; // Open Re-verifications (ALC) or Passed (FS) or Completed (CCP)

        const ongoingList = [];
        const closedList = [];

        for (const t of filteredList) {
            let status = t.cr3ea_processstatus || t.cr3ea_status || "In Progress";
            const isCancelled = String(status).toLowerCase().includes("cancel");
            const isTerminal = isCancelled || status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success" || status === "Success - Expired" || status === "Submitted";
            
            if (isTerminal) {
                closedList.push(t);
                if (isCancelled) {
                    // Cancelled tours are archived, do not count towards success/pass metrics
                } else if (isFS) {
                    if (t.cr3ea_checklist_result === "Pass") {
                        metric4++;
                    } else if (t.cr3ea_checklist_result === "Fail") {
                        metric2++;
                    }
                } else if (isCCP) {
                    metric4++; // Completed
                } else if (isMB) {
                    metric4++; // Submitted/Completed
                } else if (isPkgOps) {
                    metric4++; // Completed/Success
                }
            } else {
                ongoingList.push(t);
                if (isFS) {
                    metric3++; // In Progress
                } else if (isCCP) {
                    metric3++; // In Progress
                    if (t.cr3ea_escalated === "Yes" || t.cr3ea_status === "Escalated") {
                        metric2++; // Overdue / Escalated
                    }
                } else if (isMB) {
                    metric3++; // In Progress
                } else if (isPkgOps) {
                    metric3++; // In Progress
                }
            }
        }

        if (!isFS && !isCCP && !isMB) {
            // ALC and Packaging Operations KPIs calculations
            metric2 = filteredList.filter(t => {
                const titleVal = t.cr3ea_title || "";
                const cleanTitle = titleVal.split("||")[0].trim();
                const form = cleanTitle.split('_')[0] || "Area Line Clearance";
                const isAlcOrPkg = form.toLowerCase().includes("line") || 
                                   form.toLowerCase().includes("alc") || 
                                   form.toLowerCase().includes("clearance") ||
                                   form.toLowerCase().includes("pkg") ||
                                   form.toLowerCase().includes("packaging") ||
                                   t.cr3ea_pkgops_type;
                if (!isAlcOrPkg) return false;

                const status = t.cr3ea_processstatus || t.cr3ea_status || "In Progress";
                const isTerminal = status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success" || status === "Success - Expired";
                if (isTerminal) return false;

                const isClearedVal = t.cr3ea_islineclear;
                const isCleared = isClearedVal === true ||
                    isClearedVal === "true" ||
                    isClearedVal === 1 ||
                    isClearedVal === "1" ||
                    isClearedVal === "Yes";
                return !isCleared;
            }).length;

            metric3 = filteredList.filter(t =>
                t.cr3ea_status === "Failed - Pending Production" ||
                t.cr3ea_processstatus === "Failed - Pending Production" ||
                t.cr3ea_status === "Success - Pending Production" ||
                t.cr3ea_processstatus === "Success - Pending Production"
            ).length;

            metric4 = filteredList.filter(t =>
                t.cr3ea_status === "Pending Re-Verification" ||
                t.cr3ea_processstatus === "Pending Re-Verification" ||
                t.cr3ea_status === "Success - Pending Re-Verification" ||
                t.cr3ea_processstatus === "Success - Pending Re-Verification"
            ).length;
        }

        // Set KPI numbers in HTML
        const kpiTotal = document.getElementById("kpi-total-tours");
        if (kpiTotal) kpiTotal.innerText = totalTours;

        const kpiSuccess = document.getElementById("kpi-success-rate");
        if (kpiSuccess) kpiSuccess.innerText = metric2;

        const kpiOpen = document.getElementById("kpi-open-deviations");
        if (kpiOpen) kpiOpen.innerText = metric3;

        const kpiPending = document.getElementById("kpi-pending-reverify");
        if (kpiPending) kpiPending.innerText = metric4;

        // Fetch checkpoints for ALC ongoing lists if needed
        if (!isFS) {
            const toursNeedCheckpoints = ongoingList.filter(t => {
                const status = t.cr3ea_processstatus || t.cr3ea_status || "";
                return status !== "In Progress";
            });

            if (toursNeedCheckpoints.length > 0) {
                const token = typeof getAccessToken === "function" ? await getAccessToken() : null;
                const apiVersion = "9.2";
                const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
                
                let configs = [];
                try {
                    configs = await ALC_Dashboard.fetchSharePointConfigs();
                } catch (e) {
                    console.warn("Failed to fetch configs for dashboard:", e);
                }
                ALC_Dashboard.configs = configs;

                const fetchCheckpointsPromises = toursNeedCheckpoints.map(async t => {
                    const tourId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                        ? QualityRajpura_Config.getTourId(t)
                        : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                    try {
                        const checkpoints = await ALC_Dashboard.fetchCheckpointsDirect(tourId, token, baseApiUrl, apiVersion);
                        t.checkpoints = checkpoints || [];
                    } catch (e) {
                        console.warn(`Failed to fetch checkpoints for tour ${tourId}:`, e);
                        t.checkpoints = [];
                    }
                });
                await Promise.all(fetchCheckpointsPromises);
            }
        }

        this.renderOngoingList(ongoingList);
        this.renderClosedList(closedList);
    },

    updateKpiLabels: function () {
        const isFS = this.selectedCategory === "FoodSafety";
        const isCCP = this.selectedCategory === "CCP_OPRP_Sieves";
        const isMB = this.selectedCategory === "MixingAndBaking";
        
        const label2 = document.getElementById("kpi-success-rate") ? document.getElementById("kpi-success-rate").previousElementSibling : null;
        const label3 = document.getElementById("kpi-open-deviations") ? document.getElementById("kpi-open-deviations").previousElementSibling : null;
        const label4 = document.getElementById("kpi-pending-reverify") ? document.getElementById("kpi-pending-reverify").previousElementSibling : null;
        
        if (isFS) {
            if (label2) label2.innerText = "Failed Audits";
            if (label3) label3.innerText = "In Progress";
            if (label4) label4.innerText = "Passed Audits";
        } else if (isCCP) {
            if (label2) label2.innerText = "Overdue Tours";
            if (label3) label3.innerText = "In Progress";
            if (label4) label4.innerText = "Completed Tours";
        } else if (isMB) {
            if (label2) label2.innerText = "Failed Batches";
            if (label3) label3.innerText = "In Progress";
            if (label4) label4.innerText = "Submitted Tours";
        } else {
            if (label2) label2.innerText = "Lines On Hold";
            if (label3) label3.innerText = "Open Observations";
            if (label4) label4.innerText = "Open Re-verifications";
        }
    },

    updateTableHeaders: function () {
        const isFS = this.selectedCategory === "FoodSafety";
        const isCCP = this.selectedCategory === "CCP_OPRP_Sieves";
        const isMB = this.selectedCategory === "MixingAndBaking";
        const isPkgOps = this.selectedCategory === "PackagingOperations";
        const isALC = this.selectedCategory === "ALC";
        const ongoingTable = document.getElementById("rajpura-ongoing-tbody") ? document.getElementById("rajpura-ongoing-tbody").closest("table") : null;
        const closedTable = document.getElementById("rajpura-cycles-tbody") ? document.getElementById("rajpura-cycles-tbody").closest("table") : null;

        // Show/hide Score column dynamically (only visible for ALC)
        if (ongoingTable) {
            const headers = ongoingTable.querySelectorAll("thead th");
            if (headers.length >= 9) {
                headers[5].style.display = isALC ? "" : "none";
            }
        }
        if (closedTable) {
            const headers = closedTable.querySelectorAll("thead th");
            if (headers.length >= 8) {
                headers[5].style.display = isALC ? "" : "none";
            }
        }

        if (isFS) {
            if (ongoingTable) {
                const headers = ongoingTable.querySelectorAll("thead th");
                if (headers.length >= 9) {
                    headers[1].innerText = "Checklist Type";
                    headers[6].innerText = "Cycle";
                    headers[7].innerText = "Status";
                    headers[8].innerText = "QA / Incharge";
                }
            }
            if (closedTable) {
                const headers = closedTable.querySelectorAll("thead th");
                if (headers.length >= 8) {
                    headers[1].innerText = "Checklist Type";
                    headers[6].innerText = "Cycle";
                    headers[7].innerText = "Result";
                }
            }
        } else if (isCCP) {
            if (ongoingTable) {
                const headers = ongoingTable.querySelectorAll("thead th");
                if (headers.length >= 9) {
                    headers[1].innerText = "Verification Type";
                    headers[6].innerText = "Frequency / Product";
                    headers[7].innerText = "Status";
                    headers[8].innerText = "QA / Incharge";
                }
            }
            if (closedTable) {
                const headers = closedTable.querySelectorAll("thead th");
                if (headers.length >= 8) {
                    headers[1].innerText = "Verification Type";
                    headers[6].innerText = "Frequency / Product";
                    headers[7].innerText = "Result";
                }
            }
        } else if (isMB) {
            if (ongoingTable) {
                const headers = ongoingTable.querySelectorAll("thead th");
                if (headers.length >= 9) {
                    headers[1].innerText = "Checklist Form";
                    headers[6].innerText = "Product / Batch";
                    headers[7].innerText = "Status";
                    headers[8].innerText = "QA / Incharge";
                }
            }
            if (closedTable) {
                const headers = closedTable.querySelectorAll("thead th");
                if (headers.length >= 8) {
                    headers[1].innerText = "Checklist Form";
                    headers[6].innerText = "Product / Batch";
                    headers[7].innerText = "Result";
                }
            }
        } else {
            if (ongoingTable) {
                const headers = ongoingTable.querySelectorAll("thead th");
                if (headers.length >= 9) {
                    headers[1].innerText = "Checklist Form";
                    headers[6].innerText = "Is Line Clear";
                    headers[7].innerText = "Status";
                    headers[8].innerText = "Pending With";
                }
            }
            if (closedTable) {
                const headers = closedTable.querySelectorAll("thead th");
                if (headers.length >= 8) {
                    headers[1].innerText = "Checklist Form";
                    headers[6].innerText = "Is Line Clear";
                    headers[7].innerText = "Status / Result";
                }
            }
        }
    },

    // Resolve Pending With Name dynamically based on status
    getPendingWith: function (t) {
        let status = t.cr3ea_processstatus || t.cr3ea_status || "Pending QA";
        const prodNameRaw = t.cr3ea_shiftexecutiveproduction || t.cr3ea_observedby || "Production Team";
        const prodName = prodNameRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodNameRaw) : prodNameRaw;
        const qaNameRaw = t.cr3ea_tourby || "QA Team";
        const qaName = qaNameRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaNameRaw) : qaNameRaw;

        const requestTimeString = t.cr3ea_request_time || t.cr3ea_tourstartdate || t.createdon;
        if (status === "Pending QA" && requestTimeString) {
            const reqTime = new Date(requestTimeString).getTime();
            const now = new Date().getTime();
            if (!isNaN(reqTime) && (now - reqTime > 5 * 60 * 1000)) {
                // Only escalate if it is from today (not expired/previous day)
                const tourDateLocal = moment(requestTimeString).local().format("YYYY-MM-DD");
                const todayLocal = moment().format("YYYY-MM-DD");
                if (tourDateLocal === todayLocal) {
                    status = "Escalated";
                }
            }
        }

        switch (status) {
            case "Escalated":
                return `Shift Executive (${prodName})`;
            case "Pending QA":
                return `QA Incharge (${qaName})`;
            case "QA In Progress":
                return `QA Executive (${qaName})`;
            case "Failed - Pending Production":
            case "Success - Pending Production":
                // Resolve area-wise pending production assignees
                const assignees = ALC_Dashboard.getAreaAssigneesForFailedCheckpoints(t);
                if (assignees && assignees.length > 0) {
                    return `Production Exec (${assignees.join(", ")})`;
                }
                return `Production Exec (${prodName})`;
            case "Pending Re-Verification":
            case "Success - Pending Re-Verification":
            case "Failed - Pending Re-Verification":
                const pendingProds = ALC_Dashboard.getAreaAssigneesForFailedCheckpoints(t);
                if (pendingProds && pendingProds.length > 0) {
                    return `QA Executive (${qaName}) & Production Exec (${pendingProds.join(", ")})`;
                }
                return `QA Executive (${qaName})`;
            default:
                return "Production Team";
        }
    },

    // Parse non-standard and standard date formats safely using moment
    parseDate: function (dateStr) {
        if (!dateStr) return "N/A";
        // Parse custom format or default ISO formats
        const m = moment(dateStr, [
            "YYYY-MM-DDTHH:mm:ssZ",
            "YYYY-MM-DDTHH:mm:ss.SSSZ",
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD",
            "MM-DD-YYYY HH:mm:ss",
            "MM-DD-YYYY hh:mm A",
            "MM-DD-YYYY",
            "M/D/YYYY h:mm A",
            "M/D/YYYY hh:mm A",
            "MM/DD/YYYY hh:mm A",
            "DD-MM-YYYY HH:mm:ss",
            "DD-MM-YYYY hh:mm A",
            "DD-MM-YYYY",
            "D/M/YYYY h:mm A",
            "D/M/YYYY hh:mm A",
            "DD/MM/YYYY hh:mm A"
        ], true); // strict parsing

        if (m.isValid()) {
            return m.format("DD-MM-YYYY hh:mm A");
        }

        // Fallback to loose parsing
        const looseM = moment(dateStr);
        return looseM.isValid() ? looseM.format("DD-MM-YYYY hh:mm A") : dateStr;
    },

    // Parse date strictly returning moment object
    parseDateMoment: function (dateStr) {
        if (!dateStr) return null;
        const m = moment(dateStr, [
            "YYYY-MM-DDTHH:mm:ssZ",
            "YYYY-MM-DDTHH:mm:ss.SSSZ",
            "YYYY-MM-DD HH:mm:ss",
            "YYYY-MM-DD",
            "MM-DD-YYYY HH:mm:ss",
            "MM-DD-YYYY hh:mm A",
            "MM-DD-YYYY",
            "M/D/YYYY h:mm A",
            "M/D/YYYY hh:mm A",
            "MM/DD/YYYY hh:mm A",
            "DD-MM-YYYY HH:mm:ss",
            "DD-MM-YYYY hh:mm A",
            "DD-MM-YYYY",
            "D/M/YYYY h:mm A",
            "D/M/YYYY hh:mm A",
            "DD/MM/YYYY hh:mm A"
        ], true); // strict parsing

        if (m.isValid()) return m;

        const looseM = moment(dateStr);
        return looseM.isValid() ? looseM : null;
    },

    renderOngoingList: function (list) {
        const tbody = document.getElementById("rajpura-ongoing-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center py-3 text-secondary">No ongoing clearance tours at the moment.</td></tr>`;
            return;
        }

        const isFS = this.selectedCategory === "FoodSafety";
        const isCCP = this.selectedCategory === "CCP_OPRP_Sieves";
        const isMB = this.selectedCategory === "MixingAndBaking";
        const isPkgOps = this.selectedCategory === "PackagingOperations";
        const currentUserEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? _spPageContextInfo.userEmail.toLowerCase().trim() : "";
        const currentUserName = (typeof EmployeeName !== 'undefined' && EmployeeName) ? EmployeeName.toLowerCase().trim() :
            ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName.toLowerCase().trim() : "");

        list.forEach(t => {
            try {
                const tr = document.createElement("tr");
                const date = ALC_Dashboard.parseDate(t.cr3ea_tourstartdate);
                const line = t.cr3ea_lineno || "N/A";
                const shift = t.cr3ea_shift || "N/A";

                if (isFS) {
                    let form = t.cr3ea_food_safety_checklisttype;
                    if (!form && t.cr3ea_title) {
                        let cleanTitle = t.cr3ea_title.split("||")[0].trim();
                        if (cleanTitle.startsWith("FoodSafety_")) cleanTitle = cleanTitle.replace("FoodSafety_", "");
                        if (cleanTitle.startsWith("Food_Safety_")) cleanTitle = cleanTitle.replace("Food_Safety_", "");
                        
                        if (cleanTitle.startsWith("PPE_")) form = "PPE Checklist";
                        else if (cleanTitle.startsWith("GMP_")) form = "GMP Checklist";
                        else if (cleanTitle.startsWith("PCI_")) form = "PCI Checklist";
                    }
                    if (!form) form = "Food Safety Checklist";
                    const qaName = t.cr3ea_assigned_qa || "N/A";
                    const qaExec = qaName.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = prodInchargeRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    let scoreDisplay = "-";
                    if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null) {
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${t.cr3ea_overall_score}</strong>`;
                    }
                    
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.cr3ea_food_safety_cycle || "Cycle-1"}</span>`;
                    
                    let status = t.cr3ea_status || "In Progress";
                    let badgeClass = "badge-warning";
                    if (status === "Submitted") badgeClass = "badge-success";
                    
                    const isProgress = (status.toLowerCase() === "in-progress" || status.toLowerCase() === "in progress" || status.toLowerCase() === "inprogress-paused");
                    const pendingWith = isProgress ? `QA Executive (${qaExec})` : "Completed";
 
                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;">${scoreDisplay}</td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                        <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                    `;
                    
                    let isMyTask = false;
                    const isQaStatus = (status === "Pending QA" || status === "QA In Progress" || status === "In Progress" || status === "InProgress-paused" || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    if (isQaStatus) {
                        const qaEmail = (t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                        const qaResolvedName = qaEmail.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaEmail).toLowerCase().trim() : qaEmail;
                        if ((currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail))) ||
                            (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
                            (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName)))) {
                            isMyTask = true;
                        }
                    }
 
                    if (isMyTask) {
                        tr.classList.add("my-task-row");
                    }
 
                    const isFsCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    let isClickable = true;
                    if (isFsCancelled) {
                        isClickable = false;
                    } else if ((status === "In Progress" || status === "InProgress-paused") && !isMyTask) {
                        isClickable = false;
                    }
 
                    if (isClickable) {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open Food Safety checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/FoodSafety.aspx?TourId=${tourId}`;
                        };
                    } else {
                        tr.style.cursor = "default";
                        tr.title = isFsCancelled 
                            ? "This observation has been cancelled and cannot be accessed." 
                            : "This tour is in progress by another QA and is only accessible to the assigned QA Executive.";
                        tr.onclick = function (e) {
                            if (e) e.stopPropagation();
                            if (isFsCancelled) {
                                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                            } else {
                                alert("Access Denied: This tour is currently in progress by QA. Only the assigned QA Executive can enter.");
                            }
                        };
                    }
                } else if (isMB) {
                    const form = "Mixing & Baking";
                    const qaName = t.cr3ea_assigned_qa || t.cr3ea_tourby || "N/A";
                    const qaExec = qaName.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = prodInchargeRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    const scoreDisplay = "-";
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Mixing & Baking</span>`;
                    
                    let status = t.cr3ea_status || "In Progress";
                    let badgeClass = "badge-warning";
                    if (status === "Submitted" || status === "Completed") badgeClass = "badge-success";
                    
                    const isProgress = (String(status).toLowerCase() === "in-progress" || String(status).toLowerCase() === "in progress" || String(status).toLowerCase() === "inprogress-paused");
                    const pendingWith = isProgress ? `QA Executive (${qaExec})` : "Completed";

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;">${scoreDisplay}</td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                        <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                    `;
                    
                    let isMyTask = false;
                    const isQaStatus = (status === "In Progress" || status === "InProgress-paused" || status === "Pending QA");
                    if (isQaStatus) {
                        const qaEmail = String(t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                        const qaResolvedName = qaEmail.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaEmail).toLowerCase().trim() : qaEmail;
                        if ((currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail))) ||
                            (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
                            (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName)))) {
                            isMyTask = true;
                        }
                    }

                    if (isMyTask) {
                        tr.classList.add("my-task-row");
                    }

                    const isMbCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    let isClickable = true;
                    if (isMbCancelled) {
                        isClickable = false;
                    } else if (isQaStatus && !isMyTask) {
                        isClickable = false;
                    }

                    if (isClickable) {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open Mixing & Baking checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/MixingAndBaking.aspx?TourId=${tourId}`;
                        };
                    } else {
                        tr.style.cursor = "default";
                        tr.title = isMbCancelled 
                            ? "This observation has been cancelled and cannot be accessed." 
                            : "This tour is currently in progress by QA and is only accessible to the assigned QA Executive.";
                        tr.onclick = function (e) {
                            if (e) e.stopPropagation();
                            if (isMbCancelled) {
                                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                            } else {
                                alert("Access Denied: This tour is currently in progress by QA. Only the assigned QA Executive can enter.");
                            }
                        };
                    }
                } else if (isCCP) {
                    let form = t.cr3ea_ccp_oprp_sieves_parametertype;
                    if (!form && t.cr3ea_title) {
                        const cleanTitle = String(t.cr3ea_title).split("||")[0].trim();
                        if (cleanTitle.includes("Sieves") || cleanTitle.includes("sieves")) form = "Sieves & Magnets";
                        else form = "CCP & OPRP";
                    }
                    if (!form) form = "CCP, OPRP & Sieves";

                    const qaName = t.cr3ea_assigned_qa || t.cr3ea_tourby || "N/A";
                    const qaExec = (typeof qaName === "string" && qaName.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = (typeof prodInchargeRaw === "string" && prodInchargeRaw.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    let scoreDisplay = "-";
                    if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null) {
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${t.cr3ea_overall_score}</strong>`;
                    }
                    
                    const freqText = t.cr3ea_ccp_oprp_sieves_frequency || t.cr3ea_ccp_oprp_sieves_productvariety || "2-Hour Check";
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${freqText}</span>`;
                    
                    let status = t.cr3ea_processstatus || t.cr3ea_status || "In Progress";
                    let badgeClass = "badge-warning";
                    if (status === "Submitted" || status === "Completed" || status === "Success") badgeClass = "badge-success";
                    else if (status === "Escalated") badgeClass = "badge-error";
                    else if (status === "Pending Production Action" || status.includes("Pending Production") || status.includes("Pending Observation")) badgeClass = "badge-error";
                    else if (status === "Pending QA Re-Verification" || status.includes("Re-Verification")) badgeClass = "badge-primary";
                    
                    const isProgress = (String(status).toLowerCase() === "in-progress" || String(status).toLowerCase() === "in progress" || String(status).toLowerCase() === "inprogress-paused");
                    let pendingWith = isProgress ? `QA Executive (${qaExec})` : status;
                    if (status === "Pending Production Action" || status.includes("Pending Production")) {
                        pendingWith = `Production Incharge (${prodIncharge})`;
                    } else if (status === "Pending QA Re-Verification" || status.includes("Re-Verification")) {
                        pendingWith = `QA Executive (${qaExec})`;
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;">${scoreDisplay}</td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                        <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                    `;
                    
                    let isMyTask = false;
                    const isQaStatus = (status === "In Progress" || status === "InProgress-paused" || status === "Escalated" || status === "Pending QA Re-Verification" || status === "Pending QA");
                    if (isQaStatus) {
                        const qaEmail = String(t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                        const qaResolvedName = (typeof qaEmail === "string" && qaEmail.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(qaEmail).toLowerCase().trim() : qaEmail;
                        if ((currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail))) ||
                            (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
                            (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName)))) {
                            isMyTask = true;
                        }
                    }

                    // Also check if current user is Production team for this tour or in general
                    const prodExecRawVal = String(t.cr3ea_shiftexecutiveproduction || t.cr3ea_production_incharge || t.cr3ea_observedby || "").toLowerCase().trim();
                    const prodExecResolvedVal = (typeof prodExecRawVal === "string" && prodExecRawVal.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(prodExecRawVal).toLowerCase().trim() : prodExecRawVal;
                    const isUserProdExec = (currentUserEmail && prodExecRawVal && (currentUserEmail === prodExecRawVal || currentUserEmail.includes(prodExecRawVal) || prodExecRawVal.includes(currentUserEmail))) ||
                        (currentUserName && prodExecRawVal && (currentUserName === prodExecRawVal || currentUserName.includes(prodExecRawVal) || prodExecRawVal.includes(currentUserName))) ||
                        (currentUserName && prodExecResolvedVal && (currentUserName === prodExecResolvedVal || currentUserName.includes(prodExecResolvedVal) || prodExecResolvedVal.includes(currentUserName))) ||
                        (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("prod") || DepartmentNameLeftNavi.toLowerCase().includes("baking") || DepartmentNameLeftNavi.toLowerCase().includes("mixing"))) ||
                        (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod"));

                    const isProdPending = (status === "Pending Production Action" || status.includes("Pending Production") || status.includes("Pending Observation") || status === "Escalated");
                    const isReverifyStatus = (status === "Pending QA Re-Verification" || status.includes("Re-Verification") || status.includes("Re-verify"));

                    const isCcpCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");

                    // Re-verification, In Progress, and Cancelled are strictly QA's responsibility / terminal. Production person does NOT have pending task!
                    if (!isReverifyStatus && !isProgress && !isCcpCancelled && isUserProdExec && isProdPending) {
                        isMyTask = true;
                    }

                    if (isMyTask) {
                        tr.classList.add("my-task-row");
                    }

                    let isClickable = true;
                    if (isCcpCancelled) {
                        isClickable = false;
                    } else if (isProgress && !isMyTask) {
                        isClickable = false;
                    } else if (isReverifyStatus && isUserProdExec && !isMyTask) {
                        isClickable = false;
                    } else if (isProdPending && !isUserProdExec) {
                        isClickable = false;
                    }

                    if (isClickable) {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open CCP/OPRP checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            const roleParam = isProdPending ? "&role=PRODUCTION" : (isReverifyStatus || isProgress ? "&role=QA" : "");
                            window.location.href = `${siteBase}/Pages/CCP-OPRP.aspx?TourId=${tourId}${roleParam}`;
                        };
                    } else {
                        tr.style.cursor = "default";
                        tr.title = isCcpCancelled
                            ? "This observation has been cancelled and cannot be accessed."
                            : (isProdPending
                                ? "This tour is in Pending Production Action stage and is accessible only to the assigned Production Incharge."
                                : (isReverifyStatus 
                                    ? "This tour is in QA Re-Verification stage and awaiting QA Executive action." 
                                    : "This tour is currently in progress by QA and is only accessible to the assigned QA Executive."));
                        tr.onclick = function (e) {
                            if (e) e.stopPropagation();
                            if (isCcpCancelled) {
                                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                            } else if (isProdPending) {
                                alert("Access Denied: This tour is currently in Pending Production Action stage. Only the assigned Production Incharge can enter and submit corrective actions.");
                            } else if (isReverifyStatus) {
                                alert("Access Denied: This tour is currently in QA Re-Verification stage. Production team cannot enter or take actions at this time.");
                            } else {
                                alert("Access Denied: This tour is currently in progress by QA. Only the assigned QA Executive can enter.");
                            }
                        };
                    }
                } else if (isPkgOps) {
                    const subType = t.cr3ea_pkgops_type || "Packaging Operations";
                    const form = `Packaging - ${subType}`;
                    const prodExecRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodExec = prodExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodExecRaw) : prodExecRaw;
                    const qaExecRaw = t.cr3ea_tourby || "N/A";
                    const qaExec = qaExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaExecRaw) : qaExecRaw;
                    const execs = `Shift: ${prodExec} | QA: ${qaExec}`;
 
                    const pendingWith = ALC_Dashboard.getPendingWith(t);
 
                    let scoreDisplay = "-";
                    let scoreNum = null;
                    const computedScore = ALC_Dashboard.calculateScoreDynamically(t);
 
                    if (computedScore !== null) {
                        scoreNum = parseFloat(computedScore);
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${computedScore}%</strong>`;
                    } else if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null && String(t.cr3ea_overall_score).trim() !== "") {
                        scoreNum = parseFloat(t.cr3ea_overall_score);
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${scoreNum.toFixed(2)}%</strong>`;
                    }

                    let status = t.cr3ea_processstatus || t.cr3ea_status || "Pending QA";

                    let isEscalated = false;
                    const requestTimeString = t.cr3ea_request_time || t.cr3ea_tourstartdate || t.createdon;
                    if (status === "Pending QA" && requestTimeString) {
                        const reqTime = new Date(requestTimeString).getTime();
                        const now = new Date().getTime();
                        if (!isNaN(reqTime) && (now - reqTime > 5 * 60 * 1000)) {
                            const tourDateLocal = moment(requestTimeString).local().format("YYYY-MM-DD");
                            const todayLocal = moment().format("YYYY-MM-DD");
                            if (tourDateLocal === todayLocal) {
                                isEscalated = true;
                                status = "Escalated";
                            }
                        }
                    }

                    if (scoreNum !== null) {
                        const isSuccess = (scoreNum >= 80);
                        if (status.includes("Pending Production")) {
                            status = isSuccess ? "Success - Pending Production" : "Failed - Pending Production";
                        } else if (status.includes("Pending Re-Verification") || status === "Pending Re-Verification") {
                            status = isSuccess ? "Success - Pending Re-Verification" : "Failed - Pending Re-Verification";
                        }
                    } else {
                        if (status === "Pending Re-Verification") {
                            status = "Failed - Pending Re-Verification";
                        }
                    }

                    let badgeClass = "badge-warning";
                    let isMyTask = false;

                    const qaEmail = (t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                    const qaResolvedName = qaEmail.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaEmail).toLowerCase().trim() : qaEmail;
                    const isAssignedQA = Boolean(
                        (currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail))) ||
                        (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
                        (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName)))
                    );

                    const isQaStatus = (status === "Pending QA" || status === "QA In Progress" || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification" || status === "In Progress" || status === "InProgress-paused");
                    if (isQaStatus && isAssignedQA) {
                        isMyTask = true;
                    }

                    const prodExecRawVal = (t.cr3ea_shiftexecutiveproduction || t.cr3ea_observedby || "").toLowerCase().trim();
                    const prodExecResolvedVal = prodExecRawVal.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodExecRawVal).toLowerCase().trim() : prodExecRawVal;
                    const isUserProdExec = Boolean(
                        (currentUserName && prodExecRawVal && (prodExecRawVal === currentUserName || prodExecRawVal.includes(currentUserName) || currentUserName.includes(prodExecRawVal))) ||
                        (currentUserName && prodExecResolvedVal && (prodExecResolvedVal === currentUserName || prodExecResolvedVal.includes(currentUserName) || currentUserName.includes(prodExecResolvedVal))) ||
                        (currentUserEmail && prodExecRawVal && (currentUserEmail === prodExecRawVal || currentUserEmail.includes(prodExecRawVal.replace(/\s+/g, ".")))) ||
                        (currentUserEmail && prodExecRawVal.includes("@") && currentUserEmail === prodExecRawVal)
                    );

                    const isUserProd = Boolean(
                        isUserProdExec ||
                        (typeof DepartmentNameLeftNavi === "string" && DepartmentNameLeftNavi.toLowerCase().includes("prod")) ||
                        (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod"))
                    );

                    const isUserQA = Boolean(
                        isAssignedQA ||
                        (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("qa") || DepartmentNameLeftNavi.toLowerCase().includes("quality"))) ||
                        (typeof RoleName === "string" && (RoleName.toLowerCase().includes("qa") || RoleName.toLowerCase().includes("quality")))
                    );

                    if (status === "Escalated") {
                        if (isUserProdExec) {
                            isMyTask = true;
                        }
                    }

                    const isProdStatus = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production");
                    if (isProdStatus && isUserProdExec) {
                        isMyTask = true;
                    }

                    if (isMyTask) {
                        tr.classList.add("my-task-row");
                    }

                    if (status === "Failed - Pending Production" || status === "Failed - Pending Re-Verification" || status === "Escalated") {
                        badgeClass = "badge-error";
                    } else if (status === "Success - Pending Production" || status === "Success - Pending Re-Verification") {
                        badgeClass = "badge-success";
                    } else if (status === "QA In Progress") {
                        badgeClass = "badge-warning";
                    }

                    if (scoreNum === null) {
                        if (status === "In Progress") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Request Pending</span>`;
                        } else if (status === "Pending QA") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Awaiting QA Accept</span>`;
                        } else if (status === "Escalated") {
                            scoreDisplay = `<span class="text-danger font-weight-bold" style="font-size: 12px;">ESCALATED</span>`;
                        } else if (status === "QA In Progress") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Evaluation Pending</span>`;
                        } else {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">N/A</span>`;
                        }
                    }

                    let clearBadgeHtml = "-";
                    const isClearedVal = t.cr3ea_islineclear;
                    const isCleared = isClearedVal === true ||
                        isClearedVal === "true" ||
                        isClearedVal === 1 ||
                        isClearedVal === "1" ||
                        isClearedVal === "Yes" ||
                        status === "Completed" ||
                        status === "Closed" ||
                        status === "Closed - Expired" ||
                        status === "Success";

                    clearBadgeHtml = isCleared
                        ? '<span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Yes</span>'
                        : '<span class="badge badge-error" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">No</span>';

                    let displayStatus = status;
                    if (displayStatus.includes("Pending Production")) {
                        displayStatus = displayStatus.replace("Pending Production", "Pending Observation");
                    } else if (displayStatus === "QA In Progress") {
                        displayStatus = "QA In Progress (Paused)";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;">${scoreDisplay}</td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${displayStatus}</span></td>
                        <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                    `;

                    const isPkgReverify = (status.includes("Pending Re-Verification") || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    const isPkgCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    const isPkgInProgress = (status === "QA In Progress" || status === "In Progress" || status === "InProgress-paused" || status === "Pending QA");
                    const isPkgProdPending = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production" || status === "Production Action Needed");
                    let isClickable = true;
                    if (isPkgCancelled) {
                        isClickable = false;
                    } else if (isPkgInProgress && !isAssignedQA && !isUserQA && !isMyTask) {
                        isClickable = false;
                    } else if (isPkgReverify && !isAssignedQA && !isUserQA && !isMyTask) {
                        isClickable = false;
                    } else if (isPkgProdPending && !isUserProdExec && !isUserProd && !isMyTask) {
                        isClickable = false;
                    }

                    if (isClickable) {
                        tr.style.cursor = "pointer";
                        if (status === "Escalated" && isUserProdExec) {
                            tr.title = "Action Required: QA acceptance timed out. Click to reassign QA Executive.";
                        } else {
                            tr.title = "Click to open Packaging Operations checklist";
                        }
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            const roleParam = isPkgProdPending ? "&role=PRODUCTION" : (isPkgReverify || isPkgInProgress ? "&role=QA" : "");
                            window.location.href = `${siteBase}/Pages/Product-Operation.aspx?TourId=${tourId}${roleParam}`;
                        };
                    } else {
                        tr.style.cursor = "default";
                        tr.title = isPkgCancelled
                            ? "This observation has been cancelled and cannot be accessed."
                            : (isPkgReverify 
                                ? "This tour is in QA Re-Verification stage and awaiting QA Executive action." 
                                : (isPkgProdPending 
                                    ? "This tour is in Pending Observation stage and awaiting Production action." 
                                    : "This tour is currently in progress by QA and is only accessible to the assigned QA Executive."));
                        tr.onclick = function (e) {
                            if (e) e.stopPropagation();
                            if (isPkgCancelled) {
                                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                            } else if (isPkgReverify) {
                                alert("Access Denied: This tour is currently in QA Re-Verification stage. Only the assigned QA Executive can enter.");
                            } else if (isPkgProdPending) {
                                alert("Access Denied: This tour is currently in Pending Observation stage. Only authorized Production personnel can enter.");
                            } else {
                                alert("Access Denied: This tour is currently in progress by QA. Only the assigned QA Executive can enter.");
                            }
                        };
                    }
                } else {
                    const titleVal = t.cr3ea_title || "";
                    const cleanTitle = titleVal.split("||")[0].trim();
                    const form = cleanTitle.split('_')[0] || "Area Line Clearance";
                    const prodExecRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodExec = prodExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodExecRaw) : prodExecRaw;
                    const qaExecRaw = t.cr3ea_tourby || "N/A";
                    const qaExec = qaExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaExecRaw) : qaExecRaw;
                    const execs = `Shift: ${prodExec} | QA: ${qaExec}`;
 
                    const pendingWith = ALC_Dashboard.getPendingWith(t);
 
                    let scoreDisplay = "-";
                    let scoreNum = null;
                    const computedScore = ALC_Dashboard.calculateScoreDynamically(t);
 
                    if (computedScore !== null) {
                        scoreNum = parseFloat(computedScore);
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${computedScore}%</strong>`;
                    } else if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null && String(t.cr3ea_overall_score).trim() !== "") {
                        scoreNum = parseFloat(t.cr3ea_overall_score);
                        scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${scoreNum.toFixed(2)}%</strong>`;
                    }

                    let status = t.cr3ea_processstatus || t.cr3ea_status || "Pending QA";

                    let isEscalated = false;
                    const requestTimeString = t.cr3ea_request_time || t.cr3ea_tourstartdate || t.createdon;
                    if (status === "Pending QA" && requestTimeString) {
                        const reqTime = new Date(requestTimeString).getTime();
                        const now = new Date().getTime();
                        if (!isNaN(reqTime) && (now - reqTime > 5 * 60 * 1000)) {
                            const tourDateLocal = moment(requestTimeString).local().format("YYYY-MM-DD");
                            const todayLocal = moment().format("YYYY-MM-DD");
                            if (tourDateLocal === todayLocal) {
                                isEscalated = true;
                                status = "Escalated";
                            }
                        }
                    }

                    if (scoreNum !== null) {
                        const isSuccess = (scoreNum >= 80);
                        if (status.includes("Pending Production")) {
                            status = isSuccess ? "Success - Pending Production" : "Failed - Pending Production";
                        } else if (status.includes("Pending Re-Verification") || status === "Pending Re-Verification") {
                            status = isSuccess ? "Success - Pending Re-Verification" : "Failed - Pending Re-Verification";
                        }
                    } else {
                        if (status === "Pending Re-Verification") {
                            status = "Failed - Pending Re-Verification";
                        }
                    }

                    let badgeClass = "badge-warning";

                    let isMyTask = false;

                    const isQaStatus = (status === "Pending QA" || status === "QA In Progress" || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    if (isQaStatus) {
                        const qaEmail = (t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                        const qaResolvedName = qaEmail.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaEmail).toLowerCase().trim() : qaEmail;
                        if ((currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail))) ||
                            (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
                            (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName)))) {
                            isMyTask = true;
                        }
                    }

                    const escalationContactsStr = t.cr3ea_escalation_contacts || "";
                    const escalationEmails = escalationContactsStr.toLowerCase().split(",").map(e => e.trim());

                    const qaEmailVal = (t.cr3ea_assigned_qa || t.cr3ea_tourby || "").toLowerCase().trim();
                    if (qaEmailVal && ALC_Dashboard.qaList) {
                        const matchConfig = ALC_Dashboard.qaList.find(c =>
                            c.AssignedUser && c.AssignedUser.results &&
                            c.AssignedUser.results.some(u => u.EMail && u.EMail.toLowerCase().trim() === qaEmailVal)
                        );
                        if (matchConfig && matchConfig.EscalationManager && matchConfig.EscalationManager.results) {
                            matchConfig.EscalationManager.results.forEach(m => {
                                if (m.EMail) {
                                    const emailLower = m.EMail.toLowerCase().trim();
                                    if (!escalationEmails.includes(emailLower)) {
                                        escalationEmails.push(emailLower);
                                    }
                                }
                            });
                        }
                    }

                    const isUserEscalationManager = currentUserEmail && escalationEmails.includes(currentUserEmail);
                    const isUserEscalationManagerByName = currentUserName && escalationEmails.some(email => email.includes(currentUserName));

                    const isEscalatedForMe = isEscalated && (isUserEscalationManager || isUserEscalationManagerByName);

                    const prodExecRawVal = (t.cr3ea_shiftexecutiveproduction || t.cr3ea_observedby || "").toLowerCase().trim();
                    const prodExecResolvedVal = prodExecRawVal.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodExecRawVal).toLowerCase().trim() : prodExecRawVal;
                    const isUserProdExec = (currentUserName && prodExecRawVal && (prodExecRawVal === currentUserName || prodExecRawVal.includes(currentUserName) || currentUserName.includes(prodExecRawVal))) ||
                        (currentUserName && prodExecResolvedVal && (prodExecResolvedVal === currentUserName || prodExecResolvedVal.includes(currentUserName) || currentUserName.includes(prodExecResolvedVal))) ||
                        (currentUserEmail && prodExecRawVal && (currentUserEmail === prodExecRawVal || currentUserEmail.includes(prodExecRawVal.replace(/\s+/g, ".")))) ||
                        (currentUserEmail && prodExecRawVal.includes("@") && currentUserEmail === prodExecRawVal);

                    if (status === "Escalated") {
                        if (isUserProdExec) {
                            isMyTask = true;
                        }
                    }

                    const isProdStatus = (status === "Failed - Pending Production" || status === "Success - Pending Production");
                    const isReverifyStatus = (status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    let isAlcAssigneeMatch = false;

                    if (isProdStatus || isReverifyStatus) {
                        const assignees = ALC_Dashboard.getAreaAssigneesForFailedCheckpoints(t);

                        isAlcAssigneeMatch = assignees && assignees.some(name => {
                            const cleanName = name.toLowerCase().trim();
                            return cleanName === currentUserName ||
                                (currentUserName && (cleanName.includes(currentUserName) || currentUserName.includes(cleanName))) ||
                                (currentUserEmail && currentUserEmail.includes(cleanName.replace(/\s+/g, ".")));
                        });

                        if (isProdStatus) {
                            const hasNoPendingForThisAreaOwner = assignees && assignees.length > 0 && !isAlcAssigneeMatch;
                            if (isUserProdExec || !hasNoPendingForThisAreaOwner) {
                                isMyTask = true;
                            }
                        } else if (isReverifyStatus) {
                            // Re-verification is strictly QA's responsibility. Production person does NOT have pending task during re-verification!
                        }
                    }

                    if (isMyTask) {
                        tr.classList.add("my-task-row");
                    }

                    if (isEscalatedForMe && !isMyTask) {
                        tr.classList.add("escalated-task-row");
                        tr.title = "CRITICAL: This tour has escalated! Click to view details.";
                    }

                    if (status === "Failed - Pending Production" || status === "Failed - Pending Re-Verification" || status === "Escalated") {
                        badgeClass = "badge-error";
                    } else if (status === "Success - Pending Production" || status === "Success - Pending Re-Verification") {
                        badgeClass = "badge-success";
                    } else if (status === "QA In Progress") {
                        badgeClass = "badge-warning";
                    }

                    if (scoreNum === null) {
                        if (status === "In Progress") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Request Pending</span>`;
                        } else if (status === "Pending QA") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Awaiting QA Accept</span>`;
                        } else if (status === "Escalated") {
                            scoreDisplay = `<span class="text-danger font-weight-bold" style="font-size: 12px;">ESCALATED</span>`;
                        } else if (status === "QA In Progress") {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Evaluation Pending</span>`;
                        } else {
                            scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">N/A</span>`;
                        }
                    }

                    let clearBadgeHtml = "-";
                    const isAlcTour = (form.toLowerCase().includes("line") || form.toLowerCase().includes("alc") || form.toLowerCase().includes("clearance"));
                    if (isAlcTour) {
                        const isClearedVal = t.cr3ea_islineclear;
                        const isCleared = isClearedVal === true ||
                            isClearedVal === "true" ||
                            isClearedVal === 1 ||
                            isClearedVal === "1" ||
                            isClearedVal === "Yes" ||
                            status === "Completed" ||
                            status === "Closed" ||
                            status === "Closed - Expired" ||
                            status === "Success";

                        clearBadgeHtml = isCleared
                            ? '<span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Yes</span>'
                            : '<span class="badge badge-error" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">No</span>';
                    }

                    let displayStatus = status;
                    if (displayStatus.includes("Pending Production")) {
                        displayStatus = displayStatus.replace("Pending Production", "Pending Observation");
                    } else if (displayStatus === "QA In Progress") {
                        displayStatus = "QA In Progress (Paused)";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td>${scoreDisplay}</td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${displayStatus}</span></td>
                        <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                    `;

                    const isAlcCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    let isClickable = true;
                    if (isAlcCancelled) {
                        isClickable = false;
                    } else if (status === "QA In Progress" && !isMyTask) {
                        isClickable = false;
                    } else if (isReverifyStatus && (isUserProdExec || isAlcAssigneeMatch) && !isMyTask) {
                        isClickable = false;
                    }

                    if (isClickable) {
                        tr.style.cursor = "pointer";
                        if (status === "Escalated" && isUserProdExec) {
                            tr.title = "Action Required: QA acceptance timed out. Click to reassign QA Executive.";
                        } else if (isEscalatedForMe) {
                            tr.title = "CRITICAL: This tour has escalated! Click to view details.";
                        } else {
                            tr.title = "Click to open tour clearance form";
                        }
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/AreaLine.aspx?TourId=${tourId}`;
                        };
                    } else {
                        tr.style.cursor = "default";
                        tr.title = isAlcCancelled
                            ? "This observation has been cancelled and cannot be accessed."
                            : (isReverifyStatus ? "This tour is in QA Re-Verification stage and awaiting QA Executive action." : "This tour is currently in progress by QA and is only accessible to the assigned QA Executive.");
                        tr.onclick = function (e) {
                            if (e) e.stopPropagation();
                            if (isAlcCancelled) {
                                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                            } else if (isReverifyStatus) {
                                alert("Access Denied: This tour is currently in QA Re-Verification stage. Production team cannot enter or take actions at this time.");
                            } else {
                                alert("Access Denied: This tour is currently in progress by QA. Only the assigned QA Executive can enter.");
                            }
                        };
                    }
                }

                tbody.appendChild(tr);
            } catch (err) {
                console.error("Error rendering ongoing row: ", err, t);
                alert("Error rendering ongoing row: " + err.message + "\nStack: " + err.stack);
            }
        });
    },

    currentPage: 1,
    pageSize: 10,
    closedList: [],

    // Render Archives table
    renderClosedList: function (list) {
        const tbody = document.getElementById("rajpura-cycles-tbody");
        if (!tbody) return;

        this.closedList = list || [];
        this.currentPage = 1;

        this.renderClosedListPaged();
    },

    renderClosedListPaged: function () {
        const tbody = document.getElementById("rajpura-cycles-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (this.closedList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-secondary">No closed/completed tour archives.</td></tr>`;
            return;
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.closedList.slice(start, end);

        const isFS = this.selectedCategory === "FoodSafety";
        const isCCP = this.selectedCategory === "CCP_OPRP_Sieves";
        const isMB = this.selectedCategory === "MixingAndBaking";
        const isPkgOps = this.selectedCategory === "PackagingOperations";

        pageItems.forEach(t => {
            try {
                const tr = document.createElement("tr");
                const date = ALC_Dashboard.parseDate(t.cr3ea_tourstartdate);
                const line = t.cr3ea_lineno || "N/A";
                const shift = t.cr3ea_shift || "N/A";

                if (isFS) {
                    let form = t.cr3ea_food_safety_checklisttype;
                    if (!form && t.cr3ea_title) {
                        let cleanTitle = t.cr3ea_title.split("||")[0].trim();
                        if (cleanTitle.startsWith("FoodSafety_")) cleanTitle = cleanTitle.replace("FoodSafety_", "");
                        if (cleanTitle.startsWith("Food_Safety_")) cleanTitle = cleanTitle.replace("Food_Safety_", "");
                        
                        if (cleanTitle.startsWith("PPE_")) form = "PPE Checklist";
                        else if (cleanTitle.startsWith("GMP_")) form = "GMP Checklist";
                        else if (cleanTitle.startsWith("PCI_")) form = "PCI Checklist";
                    }
                    if (!form) form = "Food Safety Checklist";
                    const qaName = t.cr3ea_assigned_qa || "N/A";
                    const qaExec = qaName.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = prodInchargeRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    let score = "-";
                    if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null) {
                        score = t.cr3ea_overall_score;
                    }
                    
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${t.cr3ea_food_safety_cycle || "Cycle-1"}</span>`;
                    
                    const rawStatus = t.cr3ea_processstatus || t.cr3ea_status || t.cr3ea_checklist_result || "";
                    const isCancelled = String(rawStatus).toLowerCase().includes("cancel");

                    let status = t.cr3ea_checklist_result || t.cr3ea_status || "Completed";
                    let badgeClass = "badge-success";
                    if (isCancelled) {
                        status = "Cancelled";
                        badgeClass = "badge-error";
                    } else if (status === "Fail") {
                        badgeClass = "badge-error";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;"><strong>${score}</strong></td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    `;
                    
                    if (isCancelled) {
                        tr.style.cursor = "default";
                        tr.title = "This observation has been cancelled and cannot be accessed.";
                        tr.onclick = function () {
                            alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                        };
                    } else {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open Food Safety checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/FoodSafety.aspx?TourId=${tourId}`;
                        };
                    }
                } else if (isMB) {
                    const form = "Mixing & Baking";
                    const qaName = t.cr3ea_assigned_qa || t.cr3ea_tourby || "N/A";
                    const qaExec = qaName.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = prodInchargeRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    const score = "-";
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Mixing & Baking</span>`;
                    
                    const isCancelled = String(t.cr3ea_processstatus || t.cr3ea_status || "").toLowerCase().includes("cancel");
                    let status = t.cr3ea_status || "Completed";
                    let badgeClass = "badge-success";
                    if (isCancelled) {
                        status = "Cancelled";
                        badgeClass = "badge-error";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;"><strong>${score}</strong></td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    `;
                    
                    if (isCancelled) {
                        tr.style.cursor = "default";
                        tr.title = "This observation has been cancelled and cannot be accessed.";
                        tr.onclick = function () {
                            alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                        };
                    } else {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open Mixing & Baking checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/MixingAndBaking.aspx?TourId=${tourId}`;
                        };
                    }
                } else if (isCCP) {
                    let form = t.cr3ea_ccp_oprp_sieves_parametertype;
                    if (!form && t.cr3ea_title) {
                        const cleanTitle = String(t.cr3ea_title).split("||")[0].trim();
                        if (cleanTitle.includes("Sieves") || cleanTitle.includes("sieves")) form = "Sieves & Magnets";
                        else form = "CCP & OPRP";
                    }
                    if (!form) form = "CCP, OPRP & Sieves";

                    const qaName = t.cr3ea_assigned_qa || t.cr3ea_tourby || "N/A";
                    const qaExec = (typeof qaName === "string" && qaName.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = (typeof prodInchargeRaw === "string" && prodInchargeRaw.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    let score = "-";
                    if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null) {
                        score = t.cr3ea_overall_score;
                    }
                    
                    const freqText = t.cr3ea_ccp_oprp_sieves_frequency || t.cr3ea_ccp_oprp_sieves_productvariety || "2-Hour Check";
                    const clearBadgeHtml = `<span class="badge badge-warning" style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${freqText}</span>`;
                    
                    const isCancelled = String(t.cr3ea_processstatus || t.cr3ea_status || "").toLowerCase().includes("cancel");
                    let status = t.cr3ea_status || "Completed";
                    let badgeClass = "badge-success";
                    if (isCancelled) {
                        status = "Cancelled";
                        badgeClass = "badge-error";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;"><strong>${score}</strong></td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    `;
                    
                    if (isCancelled) {
                        tr.style.cursor = "default";
                        tr.title = "This observation has been cancelled and cannot be accessed.";
                        tr.onclick = function () {
                            alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                        };
                    } else {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open CCP/OPRP checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/CCP-OPRP.aspx?TourId=${tourId}`;
                        };
                    }
                } else if (isPkgOps) {
                    const subType = t.cr3ea_pkgops_type || "Packaging Operations";
                    const form = `Packaging - ${subType}`;
                    const qaName = t.cr3ea_assigned_qa || t.cr3ea_tourby || "N/A";
                    const qaExec = qaName.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaName) : qaName;
                    const prodInchargeRaw = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const prodIncharge = prodInchargeRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(prodInchargeRaw) : prodInchargeRaw;
                    const execs = `QA: ${qaExec} | Prod: ${prodIncharge}`;
                    
                    let score = "-";
                    if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null && String(t.cr3ea_overall_score).trim() !== "") {
                        score = `${parseFloat(t.cr3ea_overall_score).toFixed(2)}%`;
                    }
                    
                    let clearBadgeHtml = "-";
                    const isClearedVal = t.cr3ea_islineclear;
                    const isCleared = isClearedVal === true ||
                        isClearedVal === "true" ||
                        isClearedVal === 1 ||
                        isClearedVal === "1" ||
                        isClearedVal === "Yes";

                    clearBadgeHtml = isCleared
                        ? '<span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Yes</span>'
                        : '<span class="badge badge-error" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">No</span>';
                    
                    const isCancelled = String(t.cr3ea_processstatus || t.cr3ea_status || "").toLowerCase().includes("cancel");
                    let status = t.cr3ea_status || "Completed";
                    let badgeClass = "badge-success";
                    if (isCancelled) {
                        status = "Cancelled";
                        badgeClass = "badge-error";
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td style="display: none;"><strong>${score}</strong></td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    `;
                    
                    if (isCancelled) {
                        tr.style.cursor = "default";
                        tr.title = "This observation has been cancelled and cannot be accessed.";
                        tr.onclick = function () {
                            alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                        };
                    } else {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open Packaging Operations checklist";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/Product-Operation.aspx?TourId=${tourId}`;
                        };
                    }
                } else {
                    const titleVal = t.cr3ea_title || "";
                    const cleanTitle = titleVal.split("||")[0].trim();
                    const form = cleanTitle.split('_')[0] || "Area Line Clearance";
                    const prodExec = t.cr3ea_shiftexecutiveproduction || "N/A";
                    const qaExecRaw = t.cr3ea_tourby || "N/A";
                    const qaExec = qaExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaExecRaw) : qaExecRaw;
                    const execs = `Shift: ${prodExec} | QA: ${qaExec}`;

                    let score = (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null) ? `${t.cr3ea_overall_score}%` : "N/A";
                    let result = t.cr3ea_checklist_result || "N/A";

                    if (titleVal.indexOf("||") !== -1) {
                        const titleParts = titleVal.split("||");
                        const scorePart = titleParts[1] ? titleParts[1].trim() : "";
                        const resultPart = titleParts[2] ? titleParts[2].trim() : "";
                        if (scorePart.startsWith("Score:")) {
                            score = scorePart.replace("Score:", "").trim();
                        } else if (scorePart) {
                            score = scorePart;
                        }
                        if (score && score !== "N/A" && !score.includes("%")) {
                            score = `${score}%`;
                        }
                        result = resultPart || result;
                    }

                    const isCancelled = String(t.cr3ea_processstatus || t.cr3ea_status || "").toLowerCase().includes("cancel");
                    let status = t.cr3ea_processstatus || t.cr3ea_status || "Completed";
                    if (status === "Completed") {
                        status = "Success";
                    }
                    let badgeClass = "badge-success";
                    if (isCancelled) {
                        status = "Cancelled";
                        badgeClass = "badge-error";
                    } else if (status === "Closed - Expired") {
                        const scoreVal = t.cr3ea_overall_score ? parseFloat(t.cr3ea_overall_score) : 0;
                        if (scoreVal >= 80) {
                            status = "Success - Expired";
                            badgeClass = "badge-success";
                        } else {
                            status = "Failed - Expired";
                            badgeClass = "badge-error";
                        }
                    } else if (status === "Closed") {
                        badgeClass = "badge-secondary";
                    } else if (status === "Success") {
                        badgeClass = "badge-success";
                    }

                    let clearBadgeHtml = "-";
                    const isAlcTour = (form.toLowerCase().includes("line") || form.toLowerCase().includes("alc") || form.toLowerCase().includes("clearance"));
                    if (isAlcTour) {
                        const isClearedVal = t.cr3ea_islineclear;
                        const isCleared = isClearedVal === true ||
                            isClearedVal === "true" ||
                            isClearedVal === 1 ||
                            isClearedVal === "1" ||
                            isClearedVal === "Yes" ||
                            status === "Completed" ||
                            status === "Closed" ||
                            status === "Closed - Expired" ||
                            status === "Success" ||
                            status === "Success - Expired";

                        clearBadgeHtml = isCleared
                            ? '<span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Yes</span>'
                            : '<span class="badge badge-error" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">No</span>';
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td><strong>${form}</strong></td>
                        <td>${line}</td>
                        <td>${shift}</td>
                        <td style="text-align: left;">${execs}</td>
                        <td><strong>${score}</strong></td>
                        <td>${clearBadgeHtml}</td>
                        <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    `;
                    
                    if (isCancelled) {
                        tr.style.cursor = "default";
                        tr.title = "This observation has been cancelled and cannot be accessed.";
                        tr.onclick = function () {
                            alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                        };
                    } else {
                        tr.style.cursor = "pointer";
                        tr.title = "Click to open tour clearance form";
                        tr.onclick = function () {
                            const tourId = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getTourId)
                                ? QualityRajpura_Config.getTourId(t)
                                : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                            const siteBase = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.getSiteBaseUrl)
                                ? QualityRajpura_Config.getSiteBaseUrl()
                                : "/sites/Mrs_Bectors_PTMS";
                            window.location.href = `${siteBase}/Pages/AreaLine.aspx?TourId=${tourId}`;
                        };
                    }
                }

                tbody.appendChild(tr);
            } catch (err) {
                console.error("Error rendering closed row: ", err, t);
            }
        });

        // Render pagination controls
        const tableResponsive = tbody.closest(".table-responsive");
        if (!tableResponsive) return;

        let pagerContainer = document.getElementById("rajpura-closed-pager");
        if (!pagerContainer) {
            pagerContainer = document.createElement("div");
            pagerContainer.id = "rajpura-closed-pager";
            pagerContainer.style.display = "flex";
            pagerContainer.style.justifyContent = "center";
            pagerContainer.style.alignItems = "center";
            pagerContainer.style.gap = "8px";
            pagerContainer.style.marginTop = "15px";
            pagerContainer.style.marginBottom = "15px";
            tableResponsive.parentNode.insertBefore(pagerContainer, tableResponsive.nextSibling);
        }

        pagerContainer.innerHTML = "";

        const totalItems = this.closedList.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);

        if (totalPages <= 1) {
            pagerContainer.style.display = "none";
            return;
        } else {
            pagerContainer.style.display = "flex";
        }

        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "bs-btn bs-btn-secondary";
        prevBtn.style.padding = "6px 14px";
        prevBtn.style.fontSize = "13px";
        prevBtn.style.fontWeight = "600";
        prevBtn.style.borderRadius = "6px";
        prevBtn.style.border = "1px solid #cbd5e1";
        prevBtn.style.backgroundColor = this.currentPage === 1 ? "#f8fafc" : "#ffffff";
        prevBtn.style.color = this.currentPage === 1 ? "#94a3b8" : "#334155";
        prevBtn.style.cursor = this.currentPage === 1 ? "not-allowed" : "pointer";
        prevBtn.innerText = "Previous";
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderClosedListPaged();
            }
        };
        pagerContainer.appendChild(prevBtn);

        const pageInfo = document.createElement("span");
        pageInfo.style.fontSize = "13px";
        pageInfo.style.fontWeight = "600";
        pageInfo.style.color = "#475569";
        pageInfo.style.margin = "0 10px";
        pageInfo.innerText = `Page ${this.currentPage} of ${totalPages} (Total: ${totalItems})`;
        pagerContainer.appendChild(pageInfo);

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "bs-btn bs-btn-secondary";
        nextBtn.style.padding = "6px 14px";
        nextBtn.style.fontSize = "13px";
        nextBtn.style.fontWeight = "600";
        nextBtn.style.borderRadius = "6px";
        nextBtn.style.border = "1px solid #cbd5e1";
        nextBtn.style.backgroundColor = this.currentPage === totalPages ? "#f8fafc" : "#ffffff";
        nextBtn.style.color = this.currentPage === totalPages ? "#94a3b8" : "#334155";
        nextBtn.style.cursor = this.currentPage === totalPages ? "not-allowed" : "pointer";
        nextBtn.innerText = "Next";
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderClosedListPaged();
            }
        };
        pagerContainer.appendChild(nextBtn);
    },

    // Fetch SharePoint configurations for the plant
    fetchSharePointConfigs: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CONFIG;

        let query = "?$select=Id,Title,ConfigType,Region,Plant,Area," +
            "AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id" +
            "&$expand=AssignedUser" +
            `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;

        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (!response.ok) throw new Error("Fallback needed");
        } catch (e) {
            isFallback = true;
            query = "?$select=Id,Title,Config_x0020_Type,Region,Plant,Area," +
                "Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id" +
                "&$expand=Assigned_x0020_User" +
                `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
            url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch SharePoint config on dashboard: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.d.results;

        return results.map(item => {
            const rawUser = isFallback ? item.Assigned_x0020_User : item.AssignedUser;
            let assignedUserNormalized = { results: [] };
            if (rawUser) {
                if (rawUser.results && Array.isArray(rawUser.results)) {
                    assignedUserNormalized = rawUser;
                } else if (rawUser.Title || rawUser.EMail) {
                    assignedUserNormalized = { results: [rawUser] };
                }
            }
            return {
                Id: item.Id,
                Title: item.Title,
                ConfigType: isFallback ? item.Config_x0020_Type : item.ConfigType,
                Area: item.Area,
                AssignedUser: assignedUserNormalized
            };
        });
    },

    // Fetch checkpoints for a tour directly from Dataverse
    fetchCheckpointsDirect: async function (tourId, token, baseApiUrl, apiVersion) {
        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.CHILD;
        const filter = `?$filter=_cr3ea_qualitytourid_value eq '${tourId}'`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await fetch(url, { headers: headers });
        if (!response.ok) {
            throw new Error(`Dataverse fetch checkpoints failed: ${response.status}`);
        }
        const data = await response.json();
        return data.value;
    },

    // Helper to extract unique production area assignees from failed checkpoints
    getAreaAssigneesForFailedCheckpoints: function (t) {
        if (!t.checkpoints || t.checkpoints.length === 0 || !ALC_Dashboard.configs || ALC_Dashboard.configs.length === 0) {
            return [];
        }

        const pendingFailedCheckpoints = t.checkpoints.filter(cp => {
            const isFailed = cp.cr3ea_status === "Not Okay" ||
                (cp.cr3ea_defectcategory && (
                    cp.cr3ea_defectcategory.includes("00") ||
                    cp.cr3ea_defectcategory.includes("01") ||
                    cp.cr3ea_defectcategory.includes("Non-Compliant") ||
                    cp.cr3ea_defectcategory.includes("Partial")
                ));
            const hasRemarks = cp.cr3ea_productionremarks || (cp.cr3ea_defectremarks && cp.cr3ea_defectremarks.trim().startsWith("Action:"));
            return isFailed && !hasRemarks;
        });

        if (pendingFailedCheckpoints.length === 0) {
            return [];
        }

        const assigneeNames = new Set();
        pendingFailedCheckpoints.forEach(cp => {
            const areaName = cp.cr3ea_area;
            if (!areaName) return;

            const configRow = ALC_Dashboard.configs.find(c =>
                c.ConfigType === "Product User" &&
                c.Area &&
                (c.Area.toLowerCase().includes(areaName.toLowerCase().trim()) ||
                    areaName.toLowerCase().trim().includes(c.Area.toLowerCase()))
            );

            if (configRow && configRow.AssignedUser && configRow.AssignedUser.results) {
                configRow.AssignedUser.results.forEach(u => {
                    if (u.Title) {
                        assigneeNames.add(u.Title);
                    }
                });
            }
        });

        return Array.from(assigneeNames);
    },

    // Dynamically calculate score from fetched checkpoints (identical to Summary page logic)
    calculateScoreDynamically: function (t) {
        const status = t.cr3ea_processstatus || t.cr3ea_status || "";
        if (status === "QA In Progress" || status === "Pending QA" || status === "In Progress" || status === "Escalated") {
            return null;
        }

        if (!t.checkpoints || t.checkpoints.length === 0) {
            return null;
        }

        let totalMaxPoints = 0;
        let totalObtainedPoints = 0;

        t.checkpoints.forEach(cp => {
            totalMaxPoints += 2;

            let numericScore = 2; // Default is Okay (2)
            const scoreText = cp.cr3ea_defectcategory || "";

            if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant")) {
                numericScore = 0;
            } else if (scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                numericScore = 1;
            }

            totalObtainedPoints += numericScore;
        });

        if (totalMaxPoints === 0) return null;
        const percentRaw = (totalObtainedPoints / totalMaxPoints) * 100;
        return percentRaw.toFixed(2);
    }
};
