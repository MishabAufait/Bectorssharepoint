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
        const currentUserName = (typeof currentUser !== "undefined" && currentUser) ? String(currentUser).trim() : "";
        const currentUserLogin = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? String(_spPageContextInfo.userDisplayName).trim() : "";
        const currentUserEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? String(_spPageContextInfo.userEmail).trim() : "";

        try {
            const configs = await ALC_DAL.getConfig();

            const cleanMyEmail = (currentUserEmail || "").toLowerCase().trim();
            const myEmailUserPart = cleanMyEmail.includes("@") ? cleanMyEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : cleanMyEmail.replace(/[^a-z0-9]/g, "");
            const cleanName1 = (currentUserName || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            const cleanName2 = (currentUserLogin || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

            const isUserMatch = (u) => {
                if (!u) return false;
                const uTitle = (u.Title || "").toLowerCase().trim();
                const uEmail = (u.EMail || "").toLowerCase().trim();
                const uTitleClean = uTitle.replace(/[^a-z0-9]/g, "");
                const uEmailUserPart = uEmail.includes("@") ? uEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : uEmail.replace(/[^a-z0-9]/g, "");

                return (uTitle && (uTitle === (currentUserName || "").toLowerCase() || uTitle === (currentUserLogin || "").toLowerCase())) ||
                       (uTitleClean && (uTitleClean === cleanName1 || uTitleClean === cleanName2)) ||
                       (uEmail && cleanMyEmail && uEmail === cleanMyEmail) ||
                       (uEmailUserPart && myEmailUserPart && uEmailUserPart === myEmailUserPart && myEmailUserPart.length > 0);
            };

            // Check if current user is listed under QA User config
            const isQaUser = configs.some(c =>
                (c.ConfigType === "QA User" || c.Title === "QA User" || c.ConfigType === "QA HOD" || c.Title === "QA HOD" || c.ConfigType === "QA Assignment") &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(isUserMatch)
            );

            // Check if current user is listed under Area Inspector / Product Incharge config
            const isAreaConfig = (c) => {
                const ct = (c.ConfigType || "").toLowerCase().trim();
                const t = (c.Title || "").toLowerCase().trim();
                return ct === "area inspector" || ct === "product user" || ct === "product incharge" || ct === "production user" ||
                       t.startsWith("product incharge") || t.startsWith("area-");
            };

            const isProductIncharge = configs.some(c =>
                isAreaConfig(c) &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(isUserMatch)
            );

            const userAreas = configs
                .filter(c =>
                    isAreaConfig(c) &&
                    c.AssignedUser &&
                    c.AssignedUser.results &&
                    c.AssignedUser.results.some(isUserMatch)
                )
                .map(c => {
                    if (c.Area && c.Area.trim() !== "") return c.Area.trim();
                    const title = (c.Title || "").trim();
                    if (title.includes(" - ")) return title.split(" - ")[1].trim();
                    return title.replace(/^AREA-\d+\s*[-:\u2022]?\s*/i, "").trim();
                })
                .filter(Boolean);

            ALC_StateMachine.userAreas = [...new Set(userAreas)];

            if (isQaUser) {
                this.userRole = ALC_ROLES.QUALITY;
            } else if (isProductIncharge || ALC_StateMachine.userAreas.length > 0) {
                this.userRole = ALC_ROLES.PRODUCT;
            } else {
                this.userRole = ALC_ROLES.PRODUCTION;
            }

            ALC_StateMachine.isQaUser = (this.userRole === ALC_ROLES.QUALITY);
            ALC_StateMachine.isGeneralQaUser = isQaUser;
            ALC_StateMachine.isProductUser = (ALC_StateMachine.userAreas.length > 0);
            ALC_StateMachine.isProductionUser = (!isQaUser && ALC_StateMachine.userAreas.length === 0);

            console.log(`Current User Role Resolved to: ${this.userRole}, Areas: ${JSON.stringify(ALC_StateMachine.userAreas)}`);
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
            console.error("Failed to fetch session from Dataverse:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "load ALC tour session")
                : `Dataverse Connection Failed: Tour session not found in database or failed to load.\n\n${(!navigator.onLine ? "No internet connection detected. Please reconnect and try again.\n\n" : "")}${error.message || ""}`;
            alert(msg);
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;
        }
    },

    // Route state machine and bootstrap necessary modules based on status
    transitionByStatus: async function (status, session) {
        if (status === "Pending QA") {
            ALC_StateMachine.init(this.userRole, ALC_STATES.PENDING_QA_ACCEPTANCE, this.currentTourId);
            ALC_QARequest.startTimer(ALC_QARequest.requestTimeResolved || session.cr3ea_tourstartdate || session.cr3ea_request_time, session.cr3ea_tourby);
        } else if (status === "QA In Progress" || status.startsWith("QA In Progress")) {
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
