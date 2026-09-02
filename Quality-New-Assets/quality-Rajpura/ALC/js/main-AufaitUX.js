// Bootstrap and Orchestration Module for ALC workflow
console.log("ALC Main Controller loaded");

document.addEventListener("DOMContentLoaded", async function () {
    ShowLoader();
    try {
        await ALC_Main.init();
    } catch (error) {
        console.error("Failed to initialize ALC module:", error);
    } finally {
        HideLoader();
    }
});

const ALC_Main = {
    userRole: ALC_ROLES.PRODUCTION,
    currentTourId: null,

    init: async function () {
        // 1. URL parameters check for TourId
        const urlParams = new URLSearchParams(window.location.search);
        this.currentTourId = urlParams.get('TourId');

        // 2. Identify User Role based on SharePoint Config list
        await this.identifyUserRole();

        // 3. Setup event listeners
        this.bindEvents();

        // 4. State routing based on session existence and status
        if (!this.currentTourId) {
            // New request mode (init for Production)
            ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, null);
            await ALC_QARequest.init();
        } else {
            // Existing session mode (resume state)
            await this.resumeSessionState();
        }
    },

    // Identify user role from SharePoint config list Quality-Rajpura
    identifyUserRole: async function () {
        const currentUserName = typeof currentUser !== "undefined" ? currentUser : "";
        const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";

        try {
            const configs = await ALC_DAL.getConfig();

            // Check if current user is listed under QA User config
            const isQaUser = configs.some(c =>
                c.ConfigType === "QA User" &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin)
            );

            // Check if current user is listed under Product Incharge config
            const isProductIncharge = configs.some(c =>
                c.ConfigType === "Product User" &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin)
            );

            if (isQaUser) {
                this.userRole = ALC_ROLES.QUALITY;
            } else if (isProductIncharge) {
                this.userRole = ALC_ROLES.PRODUCT;
            } else {
                this.userRole = ALC_ROLES.PRODUCTION;
            }

            console.log(`Current User Role Resolved to: ${this.userRole}`);
        } catch (error) {
            console.error("Error identifying user role, defaulting to Production:", error);
            this.userRole = ALC_ROLES.PRODUCTION;
        }
    },

    // Fetch existing tour session and transition state
    resumeSessionState: async function () {
        const AccessToken = await ALC_DAL.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const url = `${baseApiUrl}/api/data/v9.2/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`;

        const headers = { "Accept": "application/json" };
        if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

        try {
            const response = await fetch(url, { headers: headers });
            if (!response.ok) throw new Error(`Session fetch failed with status ${response.status}`);

            const session = await response.json();
            const status = session.cr3ea_status;

            console.log(`Resuming session ${this.currentTourId} with Dataverse status: ${status}`);

            // Store globally
            ALC_StateMachine.currentSession = session;

            // Update UI with existing header values
            this.populateHeaderFields(session);

            // Execute transition
            await this.transitionByStatus(status, session);
        } catch (error) {
            console.warn("Failed to fetch session from Dataverse. Loading mock session fallback for testing/offline use:", error);

            // Populate mock session for visual testing/offline execution
            const urlParams = new URLSearchParams(window.location.search);
            const mockStatus = urlParams.get('status') || "QA In Progress";

            const mockSession = {
                cr3ea_prod_rajpura_quality_toursid: this.currentTourId,
                cr3ea_shiftexecutivename: urlParams.get('exec') || "Mishab Muhammad",
                cr3ea_lineno: urlParams.get('line') || "Line 1",
                cr3ea_shift: urlParams.get('shift') || "Shift 1",
                cr3ea_previousrunningvariety: "Bectors Original",
                cr3ea_runningvariety: "Marie Delight",
                cr3ea_status: mockStatus,
                cr3ea_title: "ALC_" + moment().format("MM-DD-YYYY_HH:mm"),
                cr3ea_request_time: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3 minutes ago
            };

            // Store globally
            ALC_StateMachine.currentSession = mockSession;

            this.populateHeaderFields(mockSession);
            await this.transitionByStatus(mockSession.cr3ea_status, mockSession);
        }
    },

    // Route state machine and bootstrap necessary modules based on status
    transitionByStatus: async function (status, session) {
        if (status === "Pending QA") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.PENDING_QA_ACCEPTANCE, this.currentTourId);
            ALC_QARequest.startTimer(ALC_QARequest.requestTimeResolved || session.cr3ea_tourstartdate || session.cr3ea_request_time, session.cr3ea_tourby);
        } else if (status === "QA In Progress") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.QA_CHECKLIST, this.currentTourId);
            ALC_Checklist.renderChecklist();
        } else if (status === "Completed") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.COMPLETED_PASS, this.currentTourId);
        } else if (status === "Failed - Pending Production") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.PRODUCTION_ACTION, this.currentTourId);
            await ALC_CorrectiveAction.loadFailedItems();
        } else if (status === "Pending Re-Verification") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.QA_REVERIFYING, this.currentTourId);
            await ALC_ReVerification.loadReverificationItems();
        } else {
            ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, this.currentTourId);
            await ALC_QARequest.init();
        }
    },

    populateHeaderFields: function (session) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };

        let observedBy = session.cr3ea_observedby || "";
        let shift = "";
        let line = "";
        let prevProduct = "";
        let newProduct = "";
        let requestTime = session.cr3ea_request_time || "";
        let assignedQa = session.cr3ea_assigned_qa || "";
        let escalationContacts = session.cr3ea_escalation_contacts || "";

        // Check if cr3ea_observedby is serialized metadata
        if (observedBy.indexOf("||") !== -1) {
            const parts = observedBy.split("||");
            observedBy = parts[0] ? parts[0].trim() : "";
            shift = parts[1] ? parts[1].trim() : "";
            line = parts[2] ? parts[2].trim() : "";
            prevProduct = parts[3] ? parts[3].trim() : "";
            newProduct = parts[4] ? parts[4].trim() : "";
            requestTime = parts[5] ? parts[5].trim() : "";
            assignedQa = parts[6] ? parts[6].trim() : "";
            escalationContacts = parts[7] ? parts[7].trim() : "";
        }

        // Store resolved values on ALC_QARequest so timer and escalation logic can use them
        ALC_QARequest.requestTimeResolved = requestTime;
        ALC_QARequest.assignedQaEmailResolved = assignedQa;
        ALC_QARequest.escalationEmailsResolved = escalationContacts ? escalationContacts.split(",") : [];

        setVal("header-exec-prod", observedBy || session.cr3ea_shiftexecutiveproduction);
        setVal("header-line", line || session.cr3ea_lineno);
        setVal("header-shift", shift || session.cr3ea_shift);
        setVal("header-prev-product", prevProduct || session.cr3ea_previousrunningvariety);
        setVal("header-new-product", newProduct || session.cr3ea_runningvariety);
        setVal("header-exec-qual", session.cr3ea_tourby || session.cr3ea_shiftexecutivequality);
    },

    // Register button click events
    bindEvents: function () {
        const bindClick = (id, fn) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener("click", fn);
        };

        // Step 2 Submission
        bindClick("btn-submit-request", () => ALC_QARequest.submitRequest());

        // Step 4 Accept
        bindClick("btn-accept-request", () => ALC_QARequest.acceptRequest());

        // Step 7 Checklist Submission
        bindClick("submit-alc-btn", () => ALC_Checklist.submitChecklist());

        // Step 12 Production resubmit
        bindClick("btn-submit-corrective-actions", () => ALC_CorrectiveAction.submitActions());

        // Step 13 QA Re-verification submit
        bindClick("btn-submit-reverification", () => ALC_ReVerification.submitReverification());
    }
};

// Global state changed event listener
window.onStateChanged = function (newState, role) {
    console.log(`UI State Changed: ${newState}`);

    // Automatically trigger loads when transitioning to action views
    if (newState === ALC_STATES.PRODUCTION_ACTION) {
        ALC_CorrectiveAction.loadFailedItems();
    } else if (newState === ALC_STATES.QA_REVERIFYING) {
        ALC_ReVerification.loadReverificationItems();
    }
};
