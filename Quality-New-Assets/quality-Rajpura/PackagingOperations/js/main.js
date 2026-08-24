// Main orchestrator for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Main loaded");

const PKGOPS_Main = {
    currentTourId: null,
    currentSession: null,

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
            btnDashboard.onclick = function () {
                window.location.href = "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
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
                    window.location.href = "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                    return;
                }

                // Parse current login user context
                const userEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "admin@example.com";
                const userTitle = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "Admin User";

                // Load config mappings and determine permissions/roles
                const configs = await PKGOPS_DAL.getConfig();
                PKGOPS_StateMachine.calculateRoles(configs, userEmail, userTitle);

                // Determine active state
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
                    await PKGOPS_Summary.init(this.currentTourId, pkgopsType);
                }

                if (typeof HideLoader === "function") HideLoader();
            } catch (e) {
                if (typeof HideLoader === "function") HideLoader();
                console.error("Failed to initialize active session: ", e);
            }
        }
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
                    <span><strong>QA Executive:</strong> ${this.currentSession.cr3ea_assigned_qa || "N/A"}</span>
                    <span><strong>Prod Executive:</strong> ${this.currentSession.cr3ea_shiftexecutiveproduction || "N/A"}</span>
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
