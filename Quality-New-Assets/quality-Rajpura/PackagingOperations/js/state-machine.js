// State Machine for Rajpura Packaging Operations
console.log("Packaging Operations State Machine loaded");

const PKGOPS_States = {
    SETUP: "SETUP",
    CHECKLIST_FILL: "CHECKLIST_FILL",
    PENDING_PRODUCTION: "PENDING_PRODUCTION",
    PENDING_REVERIFICATION: "PENDING_REVERIFICATION",
    COMPLETED: "COMPLETED"
};

const PKGOPS_Roles = {
    QUALITY: "QUALITY",
    PRODUCTION: "PRODUCTION",
    PRODUCT: "PRODUCT"
};

const PKGOPS_StateMachine = {
    currentState: PKGOPS_States.SETUP,
    currentUserRoles: [], // Can include "QUALITY", "PRODUCTION", "PRODUCT"
    currentUserEmail: "",
    currentUserName: "",
    currentUserLogin: "",
    isQaUser: false,
    isProductionUser: false,
    isProductUser: false,
    isReadOnly: false,
    pendingMessage: "",
    currentSession: null,

    // Calculate current user roles based on SharePoint config mapping results and tour session assignments
    calculateRoles: function (configData, loginEmail, loginName, session) {
        let rawEmail = (loginEmail || "").toLowerCase().trim();
        if (rawEmail.includes("|")) {
            rawEmail = rawEmail.split("|").pop().trim();
        }
        this.currentUserEmail = rawEmail;
        this.currentUserName = (loginName || "").toLowerCase().trim();
        this.currentUserLogin = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? String(_spPageContextInfo.userDisplayName).toLowerCase().trim() 
            : this.currentUserName;
        this.currentUserRoles = [];
        this.currentSession = session || this.currentSession;

        // 1. SharePoint Master config list mappings
        let isConfigQA = false;
        let isConfigProd = false;

        const matchConfigUser = (u) => {
            if (!u) return false;
            const uEmail = String(u.EMail || u.email || u.Email || "").toLowerCase().trim();
            const uTitle = String(u.Title || u.title || "").toLowerCase().trim();
            const uTitleClean = uTitle.replace(/[^a-z0-9]/g, "");
            const cleanName1 = this.currentUserName.replace(/[^a-z0-9]/g, "");
            const cleanName2 = this.currentUserLogin.replace(/[^a-z0-9]/g, "");
            const uEmailUserPart = uEmail.includes("@") ? uEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : uEmail.replace(/[^a-z0-9]/g, "");
            const myEmailUserPart = this.currentUserEmail.includes("@") ? this.currentUserEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : this.currentUserEmail.replace(/[^a-z0-9]/g, "");

            return (this.currentUserEmail && uEmail && (this.currentUserEmail === uEmail || this.currentUserEmail.includes(uEmail) || uEmail.includes(this.currentUserEmail))) ||
                   (myEmailUserPart && uEmailUserPart && myEmailUserPart === uEmailUserPart && myEmailUserPart.length > 0) ||
                   (this.currentUserName && uTitle && (this.currentUserName === uTitle || this.currentUserName.includes(uTitle) || uTitle.includes(this.currentUserName))) ||
                   (this.currentUserLogin && uTitle && (this.currentUserLogin === uTitle || this.currentUserLogin.includes(uTitle) || uTitle.includes(this.currentUserLogin))) ||
                   (cleanName1 && uTitleClean && (cleanName1 === uTitleClean || cleanName1.includes(uTitleClean) || uTitleClean.includes(cleanName1))) ||
                   (cleanName2 && uTitleClean && (cleanName2 === uTitleClean || cleanName2.includes(uTitleClean) || uTitleClean.includes(cleanName2)));
        };

        if (configData && Array.isArray(configData)) {
            configData.forEach(conf => {
                const configType = String(conf.ConfigType || conf.configType || conf.Title || conf.title || "").trim();
                let assignedUsers = [];
                if (conf.AssignedUser && conf.AssignedUser.results) assignedUsers = conf.AssignedUser.results;
                else if (conf.assignedUsers && Array.isArray(conf.assignedUsers)) assignedUsers = conf.assignedUsers;
                else if (conf.ProductionIncharge && conf.ProductionIncharge.results) assignedUsers = conf.ProductionIncharge.results;
                else if (conf.productionIncharges && Array.isArray(conf.productionIncharges)) assignedUsers = conf.productionIncharges;
                else if (conf.AssignedQA && conf.AssignedQA.results) assignedUsers = conf.AssignedQA.results;

                let escalationManagers = [];
                if (conf.EscalationManager && conf.EscalationManager.results) escalationManagers = conf.EscalationManager.results;
                else if (conf.escalationManagers && Array.isArray(conf.escalationManagers)) escalationManagers = conf.escalationManagers;

                const isAssigned = assignedUsers.some(matchConfigUser);
                const isEscalation = escalationManagers.some(matchConfigUser);

                if (isAssigned || isEscalation) {
                    const cTypeLower = configType.toLowerCase();
                    if (cTypeLower.includes("qa") || cTypeLower.includes("quality")) {
                        isConfigQA = true;
                        if (!this.currentUserRoles.includes("QUALITY")) this.currentUserRoles.push("QUALITY");
                    } else if (cTypeLower.includes("production") || cTypeLower.includes("incharge") || cTypeLower.includes("prod")) {
                        isConfigProd = true;
                        if (!this.currentUserRoles.includes("PRODUCTION")) this.currentUserRoles.push("PRODUCTION");
                    }
                }
            });
        }

        // 2. Department & Global Role matching
        const isDeptQA = (typeof DepartmentNameLeftNavi === "string" && DepartmentNameLeftNavi.toLowerCase().includes("quality")) ||
                         (typeof RoleName === "string" && RoleName.toLowerCase().includes("qa"));

        const isDeptProd = (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("prod") || DepartmentNameLeftNavi.toLowerCase().includes("baking") || DepartmentNameLeftNavi.toLowerCase().includes("mixing") || DepartmentNameLeftNavi.toLowerCase().includes("pack"))) ||
                           (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod"));

        // 3. Extract assigned users from tour record
        let isAssignedQA = false;
        let isAssignedProd = false;
        let hasAssignedQA = false;
        let hasAssignedProd = false;

        if (session) {
            const qaRaw = String(session.cr3ea_assigned_qa || session.cr3ea_qaexecutive || session.cr3ea_tourby || "").toLowerCase().trim();
            const qaResolved = (typeof PKGOPS_Main !== "undefined" && PKGOPS_Main.resolveUserName) ? PKGOPS_Main.resolveUserName(qaRaw).toLowerCase().trim() : qaRaw;
            if (qaRaw) {
                hasAssignedQA = true;
                const cleanQaRaw = qaRaw.replace(/[^a-z0-9]/g, "");
                const cleanQaResolved = qaResolved.replace(/[^a-z0-9]/g, "");
                const qaUserPart = qaRaw.includes("@") ? qaRaw.split("@")[0].replace(/[^a-z0-9]/g, "") : qaRaw.replace(/[^a-z0-9]/g, "");
                const myEmailUserPart = this.currentUserEmail.includes("@") ? this.currentUserEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : this.currentUserEmail.replace(/[^a-z0-9]/g, "");
                const cleanName1 = this.currentUserName.replace(/[^a-z0-9]/g, "");
                const cleanName2 = this.currentUserLogin.replace(/[^a-z0-9]/g, "");

                if (this.currentUserEmail && (this.currentUserEmail === qaRaw || this.currentUserEmail.includes(qaRaw) || qaRaw.includes(this.currentUserEmail))) {
                    isAssignedQA = true;
                } else if (qaUserPart && myEmailUserPart && qaUserPart === myEmailUserPart && myEmailUserPart.length > 0) {
                    isAssignedQA = true;
                } else if (cleanName1 && (cleanQaRaw === cleanName1 || cleanQaRaw.includes(cleanName1) || cleanName1.includes(cleanQaRaw) || cleanQaResolved === cleanName1 || cleanQaResolved.includes(cleanName1))) {
                    isAssignedQA = true;
                } else if (cleanName2 && (cleanQaRaw === cleanName2 || cleanQaRaw.includes(cleanName2) || cleanName2.includes(cleanQaRaw) || cleanQaResolved === cleanName2 || cleanQaResolved.includes(cleanName2))) {
                    isAssignedQA = true;
                }
            }

            const prodRaw = String(session.cr3ea_shiftexecutiveproduction || session.cr3ea_production_incharge || session.cr3ea_observedby || "").toLowerCase().trim();
            const prodResolved = (typeof PKGOPS_Main !== "undefined" && PKGOPS_Main.resolveUserName) ? PKGOPS_Main.resolveUserName(prodRaw).toLowerCase().trim() : prodRaw;
            if (prodRaw) {
                hasAssignedProd = true;
                const cleanProdRaw = prodRaw.replace(/[^a-z0-9]/g, "");
                const cleanProdResolved = prodResolved.replace(/[^a-z0-9]/g, "");
                const prodUserPart = prodRaw.includes("@") ? prodRaw.split("@")[0].replace(/[^a-z0-9]/g, "") : prodRaw.replace(/[^a-z0-9]/g, "");
                const myEmailUserPart = this.currentUserEmail.includes("@") ? this.currentUserEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : this.currentUserEmail.replace(/[^a-z0-9]/g, "");
                const cleanName1 = this.currentUserName.replace(/[^a-z0-9]/g, "");
                const cleanName2 = this.currentUserLogin.replace(/[^a-z0-9]/g, "");

                if (this.currentUserEmail && (this.currentUserEmail === prodRaw || this.currentUserEmail.includes(prodRaw) || prodRaw.includes(this.currentUserEmail))) {
                    isAssignedProd = true;
                } else if (prodUserPart && myEmailUserPart && prodUserPart === myEmailUserPart && myEmailUserPart.length > 0) {
                    isAssignedProd = true;
                } else if (cleanName1 && (cleanProdRaw === cleanName1 || cleanProdRaw.includes(cleanName1) || cleanName1.includes(cleanProdRaw) || cleanProdResolved === cleanName1 || cleanProdResolved.includes(cleanName1))) {
                    isAssignedProd = true;
                } else if (cleanName2 && (cleanProdRaw === cleanName2 || cleanProdRaw.includes(cleanName2) || cleanName2.includes(cleanProdRaw) || cleanProdResolved === cleanName2 || cleanProdResolved.includes(cleanName2))) {
                    isAssignedProd = true;
                }
            }
        }

        // Developer / Admin check
        const devKeys = ["mishab", "aufait", "admin", "developer", "tester"];
        const isDev = devKeys.some(d => 
            this.currentUserEmail.includes(d) || 
            this.currentUserName.includes(d) || 
            this.currentUserLogin.includes(d)
        );
        this.isDev = isDev;

        const isUserQA = isAssignedQA || isConfigQA || isDeptQA || isDev;
        const isUserProd = isAssignedProd || isConfigProd || isDeptProd || isDev;

        this.hasAssignedQA = hasAssignedQA;
        this.hasAssignedProd = hasAssignedProd;
        this.isAssignedQA = isAssignedQA;
        this.isAssignedProd = isAssignedProd;
        this.isShiftExec = isAssignedProd;

        // 4. Strict Role Decision per stage
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = (urlParams.get("role") || "").toUpperCase();

        const status = session ? (session.cr3ea_processstatus || session.cr3ea_status || "") : "";
        const isPendingProdAction = status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Production Action Needed";
        const isPendingQAVerify = status.includes("Pending Re-Verification") || status.includes("Pending QA Re-Verification");
        const isTourInProgress = status === "QA In Progress" || status.startsWith("QA In Progress") || status === "In Progress" || status === "Pending QA" || status === "InProgress-paused";

        let isQaRole = false;
        let isProdRole = false;

        if (urlRole === "QA") {
            isQaRole = true;
            isProdRole = false;
        } else if (urlRole === "PRODUCTION" || urlRole === "PROD" || urlRole === "PRODUCT") {
            isQaRole = false;
            isProdRole = true;
        } else if (isPendingProdAction) {
            // Production Corrective Action stage: strictly Production role for assigned Prod, Prod team, or Dev
            if (isAssignedProd || isUserProd) {
                isProdRole = true;
                isQaRole = false;
            } else {
                isProdRole = false;
                isQaRole = isUserQA;
            }
        } else if (isPendingQAVerify || isTourInProgress) {
            // QA Checklist & Re-verification stages: strictly QA role for assigned QA, QA team, or Dev
            if (isAssignedQA || isUserQA) {
                isQaRole = true;
                isProdRole = false;
            } else {
                isQaRole = false;
                isProdRole = isUserProd;
            }
        } else {
            // Setup or Completed fallback
            if (isAssignedQA && !isAssignedProd) {
                isQaRole = true;
                isProdRole = false;
            } else if (isAssignedProd && !isAssignedQA) {
                isQaRole = false;
                isProdRole = true;
            } else if (isUserQA) {
                isQaRole = true;
                isProdRole = false;
            } else if (isUserProd) {
                isQaRole = false;
                isProdRole = true;
            }
        }

        this.isQaUser = isQaRole;
        this.isProductionUser = isProdRole;

        console.log("PackagingOperations: Final User Role Assignment:", {
            currentUserEmail: this.currentUserEmail,
            currentUserName: this.currentUserName,
            isQaUser: this.isQaUser,
            isProductionUser: this.isProductionUser,
            isAssignedQA: this.isAssignedQA,
            isAssignedProd: this.isAssignedProd,
            tourStatus: status
        });
    },

    // Get active state based on Parent Tour entity data and role permissions
    determineState: function (tourRecord) {
        this.currentSession = tourRecord;
        const tourId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
            ? QualityRajpura_Config.getTourId(tourRecord)
            : (tourRecord && (tourRecord.cr3ea_prod_rajpura_quality_tourid || tourRecord.cr3ea_rajpura_quality_tourid));
        if (!tourRecord || !tourId) {
            this.currentState = PKGOPS_States.SETUP;
            this.isReadOnly = false;
            this.pendingMessage = "";
            return this.currentState;
        }

        const status = tourRecord.cr3ea_processstatus || tourRecord.cr3ea_status || "Pending QA";

        // Terminal statuses: Completed / Closed / Expired
        if (status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success" || status === "Success - Expired") {
            this.currentState = PKGOPS_States.COMPLETED;
            this.isReadOnly = true;
            this.pendingMessage = "";
            console.log(`Tour is in terminal status: ${status}. Showing read-only Summary.`);
            return this.currentState;
        }

        // Production Corrective Action stage: Failed - Pending Production / Pending Observation
        if (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Production Action Needed" || status === "Failed - Pending Production") {
            if (this.isProductionUser) {
                this.currentState = PKGOPS_States.PENDING_PRODUCTION;
                this.isReadOnly = false;
                this.pendingMessage = "";
                console.log(`Assigned Production Executive opening corrective action. Loading PENDING_PRODUCTION state.`);
            } else {
                // QA or other user viewing corrective action: route to read-only summary with awaiting badge
                this.currentState = PKGOPS_States.COMPLETED;
                this.isReadOnly = true;
                const prodRaw = (this.currentSession && (this.currentSession.cr3ea_shiftexecutiveproduction || this.currentSession.cr3ea_production_incharge || this.currentSession.cr3ea_observedby)) || "";
                const prodName = prodRaw ? ((typeof PKGOPS_Main !== "undefined" && PKGOPS_Main.resolveUserName) ? PKGOPS_Main.resolveUserName(prodRaw) : prodRaw) : "Production Executive";
                this.pendingMessage = `Pending with: Production Executive (${prodName}) for Corrective Actions`;
                console.log(`User is not assigned Production Executive. Showing read-only Summary.`);
            }
            return this.currentState;
        }

        // QA Re-verification stage: Pending Re-Verification
        if (status.includes("Pending Re-Verification") || status.includes("Pending QA Re-Verification")) {
            if (this.isQaUser) {
                this.currentState = PKGOPS_States.PENDING_REVERIFICATION;
                this.isReadOnly = false;
                this.pendingMessage = "";
                console.log(`Assigned QA user opening re-verification. Loading PENDING_REVERIFICATION state.`);
            } else {
                // Production or unauthorized user viewing re-verification: route to read-only summary
                this.currentState = PKGOPS_States.COMPLETED;
                this.isReadOnly = true;
                const qaRaw = (this.currentSession && (this.currentSession.cr3ea_assigned_qa || this.currentSession.cr3ea_qaexecutive || this.currentSession.cr3ea_tourby)) || "";
                const qaName = qaRaw ? ((typeof PKGOPS_Main !== "undefined" && PKGOPS_Main.resolveUserName) ? PKGOPS_Main.resolveUserName(qaRaw) : qaRaw) : "QA Executive";
                this.pendingMessage = `Pending with: QA Executive (${qaName}) for Re-Verification`;
                console.log(`User is NOT assigned QA for re-verification. Showing read-only Summary.`);
            }
            return this.currentState;
        }

        // QA Checklist Filling stage: QA In Progress / Pending QA / In Progress
        if (this.isQaUser) {
            this.currentState = PKGOPS_States.CHECKLIST_FILL;
            this.isReadOnly = false;
            this.pendingMessage = "";
            console.log(`Assigned QA user opening checklist. Loading CHECKLIST_FILL state.`);
        } else {
            // Production or other user viewing in-progress QA checklist
            this.currentState = PKGOPS_States.COMPLETED;
            this.isReadOnly = true;
            const qaRaw = (this.currentSession && (this.currentSession.cr3ea_assigned_qa || this.currentSession.cr3ea_qaexecutive || this.currentSession.cr3ea_tourby)) || "";
            const qaName = qaRaw ? ((typeof PKGOPS_Main !== "undefined" && PKGOPS_Main.resolveUserName) ? PKGOPS_Main.resolveUserName(qaRaw) : qaRaw) : "QA Executive";
            this.pendingMessage = `Pending with: QA Executive (${qaName}) for Checklist Completion`;
            console.log(`User is NOT assigned QA for QA In Progress. Showing read-only Summary.`);
        }

        console.log(`Determined State: ${this.currentState} (Record Status: ${status})`);
        return this.currentState;
    },

    // Apply visibility classes to DOM containers based on calculated state
    applyStateUI: function () {
        // Toggle view containers
        const setupContainer = document.getElementById("setup-container");
        const checklistContainer = document.getElementById("checklist-container");
        const correctiveActionContainer = document.getElementById("corrective-action-container");
        const reverifyContainer = document.getElementById("reverify-container");
        const summaryContainer = document.getElementById("summary-container");

        if (setupContainer) setupContainer.style.display = "none";
        if (checklistContainer) checklistContainer.style.display = "none";
        if (correctiveActionContainer) correctiveActionContainer.style.display = "none";
        if (reverifyContainer) reverifyContainer.style.display = "none";
        if (summaryContainer) summaryContainer.style.display = "none";

        // Update active stepper state visually
        const step1 = document.getElementById("step-setup");
        const step2 = document.getElementById("step-checklist");
        const step3 = document.getElementById("step-action");
        const step4 = document.getElementById("step-reverify");
        const step5 = document.getElementById("step-summary");

        const removeActive = el => el && el.classList.remove("active", "completed");
        removeActive(step1);
        removeActive(step2);
        removeActive(step3);
        removeActive(step4);
        removeActive(step5);

        const addState = (el, cls) => el && el.classList.add(cls);

        switch (this.currentState) {
            case PKGOPS_States.SETUP:
                if (setupContainer) setupContainer.style.display = "block";
                addState(step1, "active");
                break;

            case PKGOPS_States.CHECKLIST_FILL:
                if (checklistContainer) checklistContainer.style.display = "block";
                addState(step1, "completed");
                addState(step2, "active");
                break;

            case PKGOPS_States.PENDING_PRODUCTION:
                if (correctiveActionContainer) correctiveActionContainer.style.display = "block";
                addState(step1, "completed");
                addState(step2, "completed");
                addState(step3, "active");
                break;

            case PKGOPS_States.PENDING_REVERIFICATION:
                if (reverifyContainer) reverifyContainer.style.display = "block";
                addState(step1, "completed");
                addState(step2, "completed");
                addState(step3, "completed");
                addState(step4, "active");
                break;

            case PKGOPS_States.COMPLETED:
                if (summaryContainer) summaryContainer.style.display = "block";
                addState(step1, "completed");
                addState(step2, "completed");
                addState(step3, "completed");
                addState(step4, "completed");
                addState(step5, "active");
                break;
        }
    },

    // Disables all inputs in the checklist panel to make it read-only
    lockChecklistReadOnly: function (shouldLock) {
        const checklistDiv = document.getElementById("checklist-container");
        if (!checklistDiv) return;
        const inputs = checklistDiv.querySelectorAll("input, select, textarea, button");
        inputs.forEach(input => {
            if (input.id !== "btnBackToDashboard") {
                input.disabled = shouldLock;
            }
        });
        const saveButton = document.getElementById("btnSubmitChecklist");
        if (saveButton) {
            if (shouldLock) {
                saveButton.style.display = "none";
            } else if (typeof PKGOPS_Checklist !== "undefined" && PKGOPS_Checklist.updateSubmitButtonVisibility) {
                PKGOPS_Checklist.updateSubmitButtonVisibility();
            } else {
                saveButton.style.display = "block";
            }
        }
        const pauseButton = document.getElementById("btnPauseChecklist");
        if (pauseButton) pauseButton.style.display = shouldLock ? "none" : "inline-block";
    },

    // Disables all inputs in the corrective action panel to make it read-only
    lockCorrectiveActionReadOnly: function (shouldLock) {
        const actionDiv = document.getElementById("corrective-action-container");
        if (!actionDiv) return;
        const inputs = actionDiv.querySelectorAll("input, select, textarea, button");
        inputs.forEach(input => {
            if (input.id !== "btnBackToDashboard") {
                input.disabled = shouldLock;
            }
        });
        const submitButton = document.getElementById("btnSubmitCorrectiveAction");
        if (submitButton) submitButton.style.display = shouldLock ? "none" : "block";
    },

    // Disables all inputs in the re-verification panel to make it read-only
    lockReverifyReadOnly: function (shouldLock) {
        const reverifyDiv = document.getElementById("reverify-container");
        if (!reverifyDiv) return;
        const inputs = reverifyDiv.querySelectorAll("input, select, textarea, button");
        inputs.forEach(input => {
            if (input.id !== "btnBackToDashboard") {
                input.disabled = shouldLock;
            }
        });
        const submitButton = document.getElementById("btnSubmitReverification");
        if (submitButton) submitButton.style.display = shouldLock ? "none" : "block";
    }
};
