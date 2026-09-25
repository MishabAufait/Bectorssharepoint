// Main orchestrator for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Main loaded");

const PKGOPS_Main = {
    currentTourId: null,
    currentSession: null,

    redirectToDashboard: function () {
        const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
            ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
            : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
        window.location.href = homeUrl;
    },

    init: async function () {
        console.log("Initializing Packaging Operations form page...");

        // Parse query params
        const urlParams = new URLSearchParams(window.location.search);
        this.currentTourId = urlParams.get("TourId");

        // Save last visited category to localStorage for dashboard persistence
        localStorage.setItem("lastVisitedDashboard", "PackagingOperations");

        // Setup dashboard button link
        const btnDashboard = document.getElementById("btnBackToDashboard");
        if (btnDashboard) {
            btnDashboard.onclick = () => {
                this.redirectToDashboard();
            };
        }

        if (!this.currentTourId) {
            // Setup Mode
            console.log("No TourId in query parameters. Entering SETUP mode.");
            PKGOPS_StateMachine.currentState = PKGOPS_States.SETUP;
            PKGOPS_StateMachine.applyStateUI();
            await PKGOPS_QARequest.init();
        } else {
            // Active Session Mode
            try {
                if (typeof ShowLoader === "function") ShowLoader();

                // Fetch parent tour session data
                this.currentSession = await PKGOPS_DAL.getTour(this.currentTourId);
                PKGOPS_StateMachine.currentSession = this.currentSession;

                if (!this.currentSession) {
                    alert("Invalid Tour ID session. Returning to dashboard.");
                    this.redirectToDashboard();
                    return;
                }

                // Same-day check and auto-expiry logic
                const creationTime = this.currentSession.createdon || this.currentSession.cr3ea_tourstartdate;
                const status = this.currentSession.cr3ea_status || "In Progress";
                if (creationTime) {
                    const parsedDate = moment(creationTime, [
                        "DD-MM-YYYY HH:mm:ss",
                        "DD-MM-YYYY hh:mm A",
                        "YYYY-MM-DDTHH:mm:ssZ",
                        "YYYY-MM-DDTHH:mm:ss.SSSZ",
                        "YYYY-MM-DD HH:mm:ss"
                    ], true);
                    if (parsedDate && parsedDate.isValid()) {
                        const tourDateLocal = parsedDate.local().format("YYYY-MM-DD");
                        const todayLocal = moment().format("YYYY-MM-DD");
                        if (tourDateLocal !== todayLocal && 
                            status !== "Closed - Expired" && 
                            status !== "Completed" && 
                            status !== "Closed" && 
                            status !== "Success") {
                            
                            console.log(`Tour is from a previous day (${tourDateLocal}) and is in state "${status}". Auto-expiring and closing...`);
                            try {
                                const payload = {
                                    cr3ea_status: "Closed - Expired",
                                    cr3ea_processstatus: "Closed - Expired",
                                    cr3ea_islineclear: true
                                };
                                await PKGOPS_DAL.updateTour(this.currentTourId, payload);
                                this.currentSession.cr3ea_status = "Closed - Expired";
                                this.currentSession.cr3ea_processstatus = "Closed - Expired";
                                console.log("Tour successfully closed and expired in Dataverse.");
                            } catch (e) {
                                console.error("Failed to automatically close/expire previous day's tour:", e);
                            }
                        }
                    }
                }

                // Parse current login user context
                const userEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) 
                    ? String(_spPageContextInfo.userEmail).toLowerCase().trim() 
                    : ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userLoginName && _spPageContextInfo.userLoginName.includes("@")) 
                        ? String(_spPageContextInfo.userLoginName).toLowerCase().trim() 
                        : "");

                const userTitle = (typeof EmployeeName !== 'undefined' && EmployeeName) 
                    ? String(EmployeeName).toLowerCase().trim() 
                    : (typeof UserName !== 'undefined' && UserName 
                        ? String(UserName).toLowerCase().trim() 
                        : (typeof currentUser !== "undefined" ? String(currentUser).toLowerCase().trim() : 
                          ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? String(_spPageContextInfo.userDisplayName).toLowerCase().trim() : (sessionStorage.getItem("userName") || ""))));

                // Load config mappings and determine permissions/roles with active session
                const configs = await PKGOPS_DAL.getConfig();
                PKGOPS_StateMachine.calculateRoles(configs, userEmail, userTitle, this.currentSession);

                // Check if tour is Cancelled
                const currentStatus = this.currentSession.cr3ea_processstatus || this.currentSession.cr3ea_status || "";
                if (String(currentStatus).toLowerCase().includes("cancel")) {
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                    this.redirectToDashboard();
                    return;
                }

                // If tour is In Progress and current user is NOT the assigned QA, restrict access and redirect to dashboard like ALC
                const isPkgOpsInProgress = (currentStatus === "QA In Progress" || currentStatus.startsWith("QA In Progress") || currentStatus === "In Progress" || currentStatus === "InProgress-paused" || currentStatus === "Pending QA");
                if (isPkgOpsInProgress && !PKGOPS_StateMachine.isQaUser) {
                    if (typeof HideLoader === "function") HideLoader();
                    alert("This tour is currently in progress for QA evaluation. Access is restricted to the assigned QA Executive.");
                    this.redirectToDashboard();
                    return;
                }

                // If tour is in Re-Verification, restrict access if user is neither QA nor assigned QA
                const isPkgOpsReverify = String(currentStatus).includes("Pending Re-Verification");
                if (isPkgOpsReverify && !PKGOPS_StateMachine.isQaUser && !PKGOPS_StateMachine.isAssignedQA) {
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Access Denied: This tour is currently in QA Re-Verification stage. Only the assigned QA Executive can enter or take actions at this time.");
                    this.redirectToDashboard();
                    return;
                }

                // If tour is in Pending Observation / Production stage, unauthorized users will be routed to read-only Summary by determineState()

                // Determine active state and permissions
                const activeState = PKGOPS_StateMachine.determineState(this.currentSession);
                PKGOPS_StateMachine.applyStateUI();

                // Populate setup summary header
                this.populateSessionHeader();

                // Initialize component controllers based on state
                const pkgopsType = this.currentSession.cr3ea_pkgops_type || "Temperatures & Humidity";

                if (activeState === PKGOPS_States.CHECKLIST_FILL) {
                    await PKGOPS_Checklist.init(this.currentTourId, pkgopsType);
                } else if (activeState === PKGOPS_States.PENDING_PRODUCTION) {
                    await PKGOPS_CorrectiveAction.init(this.currentTourId, pkgopsType);
                } else if (activeState === PKGOPS_States.PENDING_REVERIFICATION) {
                    await PKGOPS_Reverify.init(this.currentTourId, pkgopsType);
                } else if (activeState === PKGOPS_States.COMPLETED) {
                    await PKGOPS_Summary.init(this.currentTourId, pkgopsType, PKGOPS_StateMachine.pendingMessage);
                }

                if (typeof HideLoader === "function") HideLoader();
            } catch (e) {
                if (typeof HideLoader === "function") HideLoader();
                console.error("Failed to initialize active session: ", e);
                const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                    ? QualityRajpura_Config.formatDataverseError(e, "initialize Packaging Operations module")
                    : `Dataverse Connection Failed: Unable to initialize Packaging Operations module.\n\n${(!navigator.onLine ? "No internet connection detected. Please reconnect and try again.\n\n" : "")}${e.message || "Please check network or login session."}`;
                alert(msg);
            }
        }
    },

    resolveUserName: function(emailOrName) {
        if (!emailOrName) return "";
        if (!emailOrName.includes("@")) return emailOrName;
        const clean = emailOrName.split("@")[0].trim();
        return clean.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    },

    // Populate session headers
    populateSessionHeader: function () {
        if (!this.currentSession) return;

        let dateVal = "N/A";
        if (this.currentSession.cr3ea_tourstartdate) {
            const m = moment(this.currentSession.cr3ea_tourstartdate);
            dateVal = m.isValid() ? m.format("DD-MM-YYYY hh:mm A") : this.currentSession.cr3ea_tourstartdate;
        }
        const headerInfo = document.getElementById("header-session-info");
        
        if (headerInfo) {
            headerInfo.innerHTML = `
                <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; font-weight: 600; color: #475569;">
                    <span><strong>Type:</strong> ${this.currentSession.cr3ea_pkgops_type || "N/A"}</span>
                    <span><strong>Line:</strong> ${this.currentSession.cr3ea_lineno || "N/A"}</span>
                    <span><strong>Shift:</strong> ${this.currentSession.cr3ea_shift || "N/A"}</span>
                    <span><strong>Date:</strong> ${dateVal}</span>
                    <span><strong>Shift Executive:</strong> ${this.resolveUserName(this.currentSession.cr3ea_shiftexecutive || this.currentSession.cr3ea_observedby) || "N/A"}</span>
                    <span><strong>Prod Executive:</strong> ${this.resolveUserName(this.currentSession.cr3ea_shiftexecutiveproduction) || "N/A"}</span>
                    <span><strong>QA Executive:</strong> ${this.resolveUserName(this.currentSession.cr3ea_assigned_qa || this.currentSession.cr3ea_tourby) || "N/A"}</span>
                    <span><strong>Status:</strong> <span class="badge badge-fill badge-warning">${this.currentSession.cr3ea_status || "Pending"}</span></span>
                </div>
            `;
        }
    }
};

// Bootstrap page load trigger
$(document).ready(function () {
    PKGOPS_Main.init();
});
