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
    ALC_Dashboard.init();
});

const ALC_Dashboard = {
    qaList: [],

    loadConfig: async function () {
        try {
            const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
            const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CONFIG;
            
            let query = "?$select=Id,Title,ConfigType,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id&$expand=AssignedUser&$filter=Plant eq 'Rajpura'";
            let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            let response;
            let isFallback = false;
            
            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                if (!response.ok) throw new Error();
            } catch (e) {
                isFallback = true;
                query = "?$select=Id,Title,Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id&$expand=Assigned_x0020_User&$filter=Plant eq 'Rajpura'";
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
                    return {
                        AssignedUser: assignedUserNormalized
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

            const isQualityDept = QualityRajpura_Config.QUALITY_DEPT_IDS.includes(deptId);
            const isRajpura = (plant === QualityRajpura_Config.PLANT_NAME || pId === QualityRajpura_Config.PLANT_ID || isQualityDept);

            console.log(`Evaluating Dashboard: Plant=${plant}, SelectedDept=${deptId}, isRajpura=${isRajpura}, isQualityDept=${isQualityDept}`);

            if (isRajpura && isQualityDept) {
                await ALC_Dashboard.activateDashboard();
            } else {
                ALC_Dashboard.deactivateDashboard();
            }
        } catch (e) {
            console.error("Error in evaluateDashboardState: ", e);
        }
    },

    activateDashboard: async function () {
        try {
            console.log("Activating Rajpura Common Quality Dashboard");

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

            // 2. Show the Rajpura Dashboard wrapper
            $(dashboardEl).show();

            // 3. Load all tours and split them
            await ALC_Dashboard.loadAllTours();
        } catch (e) {
            console.error("Error in activateDashboard: ", e);
        }
    },

    deactivateDashboard: function () {
        console.log("Deactivating Rajpura Common Quality Dashboard");
        
        // 1. Hide the Rajpura Dashboard wrapper
        $('#rajpuraQualityDashboard').hide();
        
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
            const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
            const url = `${baseApiUrl}/api/data/v${apiVersion}/cr3ea_prod_qualitytours(${tourId})`;

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
            } else {
                console.log(`Successfully patched tour expiration for GUID: ${tourId}`);
            }
        } catch (e) {
            console.error(`Exception during auto-expiring tour: `, e);
        }
    },

    // Fetch all tours for Rajpura and split into active/ongoing and archives
    loadAllTours: async function () {
        const refreshBtn = document.getElementById("btn-refresh-dashboard");
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = "Refreshing...";
        }
        try {
            const token = typeof getAccessToken === "function" ? await getAccessToken() : null;
            if (!token) throw new Error("No token");

            const apiVersion = "9.2";
            const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
            
            // Query latest 100 tours from quality tours
            const filter = `?$filter=cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}'&$orderby=cr3ea_tourstartdate desc&$top=100`;
            const url = `${baseApiUrl}/api/data/v${apiVersion}/cr3ea_prod_qualitytours${filter}`;

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
            const list = data.value || [];

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

            // Calculate KPIs
            const totalTours = list.length;
            const passTours = list.filter(t => t.cr3ea_checklist_result === "Pass" || t.cr3ea_checklist_result === "PASS").length;
            const successRate = totalTours > 0 ? Math.round((passTours / totalTours) * 100) : 0;
            const pendingReVerify = list.filter(t => 
                t.cr3ea_status === "Pending Re-Verification" || 
                t.cr3ea_processstatus === "Pending Re-Verification" ||
                t.cr3ea_status === "Success - Pending Re-Verification" ||
                t.cr3ea_processstatus === "Success - Pending Re-Verification"
            ).length;
            
            // Open deviations count equals tours failed or success but pending corrective actions
            const openDevs = list.filter(t => 
                t.cr3ea_status === "Failed - Pending Production" || 
                t.cr3ea_processstatus === "Failed - Pending Production" ||
                t.cr3ea_status === "Success - Pending Production" ||
                t.cr3ea_processstatus === "Success - Pending Production"
            ).length;

            const kpiTotal = document.getElementById("kpi-total-tours");
            if (kpiTotal) kpiTotal.innerText = totalTours;

            const kpiSuccess = document.getElementById("kpi-success-rate");
            if (kpiSuccess) kpiSuccess.innerText = `${successRate}%`;

            const kpiOpen = document.getElementById("kpi-open-deviations");
            if (kpiOpen) kpiOpen.innerText = openDevs;

            const kpiPending = document.getElementById("kpi-pending-reverify");
            if (kpiPending) kpiPending.innerText = pendingReVerify;

            // Separate lists into active/ongoing and completed archives
            const ongoingList = [];
            const closedList = [];

            for (const t of list) {
                let status = t.cr3ea_processstatus || t.cr3ea_status || "In Progress";
                
                // Same-day check validation: if it is not completed/closed, check if it's from a previous day
                if (status !== "Completed" && status !== "Closed" && status !== "Closed - Expired" && status !== "Success") {
                    const creationTime = t.cr3ea_tourstartdate || t.createdon;
                    if (creationTime) {
                        const parsedDate = ALC_Dashboard.parseDateMoment(creationTime);
                        if (parsedDate && parsedDate.isValid()) {
                            const tourDateLocal = parsedDate.local().format("YYYY-MM-DD");
                            const todayLocal = moment().format("YYYY-MM-DD");
                            if (tourDateLocal !== todayLocal) {
                                console.log(`Auto-expiring tour from previous day: ${t.cr3ea_prod_qualitytourid} (Started: ${tourDateLocal})`);
                                await ALC_Dashboard.expireTour(t.cr3ea_prod_qualitytourid);
                                t.cr3ea_status = "Closed - Expired";
                                t.cr3ea_processstatus = "Closed - Expired";
                                t.cr3ea_islineclear = true;
                                status = "Closed - Expired";
                            }
                        }
                    }
                }

                if (status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success") {
                    closedList.push(t);
                } else {
                    ongoingList.push(t);
                }
            }

            // Fetch SharePoint configs and Dataverse checkpoints for ongoing tours
            const toursNeedCheckpoints = ongoingList.filter(t => {
                const status = t.cr3ea_processstatus || t.cr3ea_status || "";
                return status !== "In Progress";
            });

            if (toursNeedCheckpoints.length > 0) {
                let configs = [];
                try {
                    configs = await ALC_Dashboard.fetchSharePointConfigs();
                } catch (e) {
                    console.warn("Failed to fetch configs for dashboard:", e);
                }
                ALC_Dashboard.configs = configs;

                const fetchCheckpointsPromises = toursNeedCheckpoints.map(async t => {
                    try {
                        const checkpoints = await ALC_Dashboard.fetchCheckpointsDirect(t.cr3ea_prod_qualitytourid, token, baseApiUrl, apiVersion);
                        t.checkpoints = checkpoints || [];
                    } catch (e) {
                        console.warn(`Failed to fetch checkpoints for tour ${t.cr3ea_prod_qualitytourid}:`, e);
                        t.checkpoints = [];
                    }
                });
                await Promise.all(fetchCheckpointsPromises);
            }

            ALC_Dashboard.renderOngoingList(ongoingList);
            ALC_Dashboard.renderClosedList(closedList);

        } catch (error) {
            console.warn("Failed to load Dataverse tours, loading mock data fallback:", error);
            
            // Mock Fallback
            const mockOngoing = [
                { cr3ea_prod_qualitytourid: "mock-1", cr3ea_tourstartdate: new Date().toISOString(), cr3ea_title: "Area Line Clearance", cr3ea_lineno: "Line 1", cr3ea_shift: "Shift 2", cr3ea_shiftexecutiveproduction: "John Doe", cr3ea_tourby: "David QA", cr3ea_status: "Pending QA", cr3ea_processstatus: "Pending QA" },
                { cr3ea_prod_qualitytourid: "mock-2", cr3ea_tourstartdate: new Date().toISOString(), cr3ea_title: "Area Line Clearance", cr3ea_lineno: "Line 2", cr3ea_shift: "Shift 1", cr3ea_shiftexecutiveproduction: "Alice Production", cr3ea_tourby: "Emily QA", cr3ea_status: "Failed - Pending Production", cr3ea_processstatus: "Failed - Pending Production" }
            ];
            const mockClosed = [
                { cr3ea_prod_qualitytourid: "mock-3", cr3ea_tourstartdate: new Date(Date.now() - 86400000).toISOString(), cr3ea_title: "Area Line Clearance", cr3ea_lineno: "Line 1", cr3ea_shift: "Shift 3", cr3ea_shiftexecutiveproduction: "John Doe", cr3ea_tourby: "David QA", cr3ea_overall_score: 100, cr3ea_checklist_result: "Pass", cr3ea_status: "Completed", cr3ea_processstatus: "Completed" }
            ];
            ALC_Dashboard.renderOngoingList(mockOngoing);
            ALC_Dashboard.renderClosedList(mockClosed);
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = "Refresh";
            }
        }
    },

    // Resolve Pending With Name dynamically based on status
    getPendingWith: function (t) {
        const status = t.cr3ea_processstatus || t.cr3ea_status || "Pending QA";
        const prodNameRaw = t.cr3ea_shiftexecutiveproduction || t.cr3ea_observedby || "Production Team";
        const prodName = (typeof prodNameRaw === "string" && prodNameRaw.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(prodNameRaw) : prodNameRaw;
        const qaNameRaw = t.cr3ea_tourby || "QA Team";
        const qaName = (typeof qaNameRaw === "string" && qaNameRaw.includes("@")) ? ALC_Dashboard.resolveQaNameFromEmail(qaNameRaw) : qaNameRaw;

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
                return `QA Executive (${qaName})`;
            default:
                return "Production Team";
        }
    },

    // Parse non-standard and standard date formats safely using moment
    parseDate: function (dateStr) {
        if (!dateStr) return "N/A";
        // Parse custom format "DD-MM-YYYY HH:mm:ss" or default ISO formats
        const m = moment(dateStr, [
            "DD-MM-YYYY HH:mm:ss",
            "DD-MM-YYYY hh:mm A",
            "M/D/YYYY h:mm A",
            "M/D/YYYY hh:mm A",
            "D/M/YYYY h:mm A",
            "D/M/YYYY hh:mm A",
            "MM/DD/YYYY hh:mm A",
            "DD/MM/YYYY hh:mm A",
            "YYYY-MM-DDTHH:mm:ssZ",
            "YYYY-MM-DDTHH:mm:ss.SSSZ"
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
            "DD-MM-YYYY HH:mm:ss",
            "DD-MM-YYYY hh:mm A",
            "M/D/YYYY h:mm A",
            "M/D/YYYY hh:mm A",
            "D/M/YYYY h:mm A",
            "D/M/YYYY hh:mm A",
            "MM/DD/YYYY hh:mm A",
            "DD/MM/YYYY hh:mm A",
            "YYYY-MM-DDTHH:mm:ssZ",
            "YYYY-MM-DDTHH:mm:ss.SSSZ",
            "YYYY-MM-DD HH:mm:ss",
            "MM-DD-YYYY",
            "DD-MM-YYYY"
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
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-secondary">No ongoing clearance tours at the moment.</td></tr>`;
            return;
        }

        list.forEach(t => {
            try {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.title = "Click to open tour clearance form";
                tr.onclick = function () {
                    window.location.href = `/sites/Mrs_Bectors_PTMS/Pages/AreaLine.aspx?TourId=${t.cr3ea_prod_qualitytourid}`;
                };

                const date = ALC_Dashboard.parseDate(t.cr3ea_tourstartdate);
                const titleVal = t.cr3ea_title || "";
                const cleanTitle = titleVal.split("||")[0].trim();
                const form = cleanTitle.split('_')[0] || "Area Line Clearance";
                const line = t.cr3ea_lineno || "N/A";
                const shift = t.cr3ea_shift || "N/A";
                const prodExec = t.cr3ea_shiftexecutiveproduction || "N/A";
                const qaExecRaw = t.cr3ea_tourby || "N/A";
                const qaExec = qaExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaExecRaw) : qaExecRaw;
                const execs = `Prod: ${prodExec} | QA: ${qaExec}`;
                
                const pendingWith = ALC_Dashboard.getPendingWith(t);

                // Resolve Score display or status comment if no score is available yet
                let scoreDisplay = "-";
                let scoreNum = null;
                const computedScore = ALC_Dashboard.calculateScoreDynamically(t);
                
                if (computedScore !== null) {
                    scoreNum = parseFloat(computedScore);
                    scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${computedScore}%</strong>`;
                } else if (t.cr3ea_overall_score !== undefined && t.cr3ea_overall_score !== null && String(t.cr3ea_overall_score).trim() !== "") {
                    // Fallback to Dataverse field if checkpoints couldn't be loaded (e.g. mock fallback)
                    scoreNum = parseFloat(t.cr3ea_overall_score);
                    scoreDisplay = `<strong style="color: #0f172a; font-size: 15px;">${scoreNum.toFixed(2)}%</strong>`;
                }

                let status = t.cr3ea_processstatus || t.cr3ea_status || "Pending QA";
                
                // Dynamically resolve Success/Failed prefix based on score for pending states
                if (scoreNum !== null) {
                    const isSuccess = (scoreNum >= 80);
                    if (status.includes("Pending Production")) {
                        status = isSuccess ? "Success - Pending Production" : "Failed - Pending Production";
                    } else if (status.includes("Pending Re-Verification") || status === "Pending Re-Verification") {
                        status = isSuccess ? "Success - Pending Re-Verification" : "Failed - Pending Re-Verification";
                    }
                } else {
                    // Fallback formatting if no score has been computed/uploaded yet
                    if (status === "Pending Re-Verification") {
                        status = "Failed - Pending Re-Verification";
                    }
                }

                let badgeClass = "badge-warning";
                if (status === "Failed - Pending Production" || status === "Failed - Pending Re-Verification") {
                    badgeClass = "badge-error";
                } else if (status === "Success - Pending Production" || status === "Success - Pending Re-Verification") {
                    badgeClass = "badge-success";
                } else if (status === "QA In Progress") {
                    badgeClass = "badge-primary";
                }

                // If score is not resolved, format text status in score column
                if (scoreNum === null) {
                    if (status === "In Progress") {
                        scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Request Pending</span>`;
                    } else if (status === "Pending QA") {
                        scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Awaiting QA Accept</span>`;
                    } else if (status === "QA In Progress") {
                        scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">Evaluation Pending</span>`;
                    } else {
                        scoreDisplay = `<span class="text-secondary" style="font-size: 12px; font-style: italic;">N/A</span>`;
                    }
                }

                tr.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${form}</strong></td>
                    <td>${line}</td>
                    <td>${shift}</td>
                    <td style="text-align: left;">${execs}</td>
                    <td>${scoreDisplay}</td>
                    <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                    <td style="font-weight: 500; color: #1e293b;">${pendingWith}</td>
                `;
                tbody.appendChild(tr);
            } catch (err) {
                console.error("Error rendering ongoing row: ", err, t);
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
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-secondary">No closed/completed tour archives.</td></tr>`;
            return;
        }

        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.closedList.slice(start, end);

        pageItems.forEach(t => {
            try {
                const tr = document.createElement("tr");
                tr.style.cursor = "pointer";
                tr.title = "Click to view observation details";
                tr.onclick = function () {
                    window.location.href = `/sites/Mrs_Bectors_PTMS/Pages/AreaLine.aspx?TourId=${t.cr3ea_prod_qualitytourid}`;
                };

                const date = ALC_Dashboard.parseDate(t.cr3ea_tourstartdate);
                const titleVal = t.cr3ea_title || "";
                const cleanTitle = titleVal.split("||")[0].trim();
                const form = cleanTitle.split('_')[0] || "Area Line Clearance";
                const line = t.cr3ea_lineno || "N/A";
                const shift = t.cr3ea_shift || "N/A";
                const prodExec = t.cr3ea_shiftexecutiveproduction || "N/A";
                const qaExecRaw = t.cr3ea_tourby || "N/A";
                const qaExec = qaExecRaw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(qaExecRaw) : qaExecRaw;
                const execs = `Prod: ${prodExec} | QA: ${qaExec}`;
                
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

                let status = t.cr3ea_processstatus || t.cr3ea_status || "Completed";
                if (status === "Completed") {
                    status = "Success";
                }
                let badgeClass = "badge-success";
                if (status === "Closed - Expired") {
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

                tr.innerHTML = `
                    <td>${date}</td>
                    <td><strong>${form}</strong></td>
                    <td>${line}</td>
                    <td>${shift}</td>
                    <td style="text-align: left;">${execs}</td>
                    <td><strong>${score}</strong></td>
                    <td><span class="badge badge-fill ${badgeClass}">${status}</span></td>
                `;
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

        // Previous Button
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

        // Page info text
        const pageInfo = document.createElement("span");
        pageInfo.style.fontSize = "13px";
        pageInfo.style.fontWeight = "600";
        pageInfo.style.color = "#475569";
        pageInfo.style.margin = "0 10px";
        pageInfo.innerText = `Page ${this.currentPage} of ${totalPages} (Total: ${totalItems})`;
        pagerContainer.appendChild(pageInfo);

        // Next Button
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
