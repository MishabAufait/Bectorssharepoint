// State Machine for Rajpura Packaging Operations
console.log("Packaging Operations State Machine loaded");

const PKGOPS_States = {
    SETUP: "SETUP",
    CHECKLIST_FILL: "CHECKLIST_FILL",
    PENDING_PRODUCTION: "PENDING_PRODUCTION",
    PENDING_REVERIFICATION: "PENDING_REVERIFICATION",
    COMPLETED: "COMPLETED"
};

const PKGOPS_StateMachine = {
    currentState: PKGOPS_States.SETUP,
    currentUserRoles: [], // Can include "QUALITY", "PRODUCTION", "PRODUCT"
    currentUserEmail: "",
    currentUserName: "",

    // Calculate current user roles based on SharePoint config mapping results
    calculateRoles: function (configData, loginEmail, loginName) {
        this.currentUserEmail = (loginEmail || "").toLowerCase().trim();
        this.currentUserName = (loginName || "").toLowerCase().trim();
        this.currentUserRoles = [];

        if (configData && Array.isArray(configData)) {
            configData.forEach(conf => {
                const configType = String(conf.ConfigType || "").trim();
                const assignedUsers = (conf.AssignedUser && conf.AssignedUser.results) ? conf.AssignedUser.results : [];
                const escalationManagers = (conf.EscalationManager && conf.EscalationManager.results) ? conf.EscalationManager.results : [];

                const isAssigned = assignedUsers.some(user => {
                    const email = String(user.EMail || "").toLowerCase().trim();
                    const title = String(user.Title || "").toLowerCase().trim();
                    return (this.currentUserEmail && email === this.currentUserEmail) ||
                           (this.currentUserName && title === this.currentUserName);
                });

                const isEscalation = escalationManagers.some(user => {
                    const email = String(user.EMail || "").toLowerCase().trim();
                    const title = String(user.Title || "").toLowerCase().trim();
                    return (this.currentUserEmail && email === this.currentUserEmail) ||
                           (this.currentUserName && title === this.currentUserName);
                });

                if (isAssigned || isEscalation) {
                    if (configType === "QA User" || configType === "QA HOD") {
                        if (!this.currentUserRoles.includes("QUALITY")) {
                            this.currentUserRoles.push("QUALITY");
                        }
                    } else if (configType === "Production Incharge" || configType === "Production HOD") {
                        if (!this.currentUserRoles.includes("PRODUCTION")) {
                            this.currentUserRoles.push("PRODUCTION");
                        }
                    } else if (configType === "Product User" || configType === "Product HOD") {
                        if (!this.currentUserRoles.includes("PRODUCT")) {
                            this.currentUserRoles.push("PRODUCT");
                        }
                    }
                }
            });
        }

        // Fallback or Developer access check
        if (this.currentUserEmail.includes("mishab") || this.currentUserEmail.includes("aufait") || this.currentUserName.includes("admin")) {
            if (!this.currentUserRoles.includes("QUALITY")) this.currentUserRoles.push("QUALITY");
            if (!this.currentUserRoles.includes("PRODUCTION")) this.currentUserRoles.push("PRODUCTION");
            if (!this.currentUserRoles.includes("PRODUCT")) this.currentUserRoles.push("PRODUCT");
        }

        console.log("Calculated User Roles:", this.currentUserRoles);
    },

    // Get active state based on Parent Tour entity data
    determineState: function (tourRecord) {
        const tourId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
            ? QualityRajpura_Config.getTourId(tourRecord)
            : (tourRecord && (tourRecord.cr3ea_prod_rajpura_quality_tourid || tourRecord.cr3ea_rajpura_quality_tourid));
        if (!tourRecord || !tourId) {
            this.currentState = PKGOPS_States.SETUP;
            return this.currentState;
        }

        const status = tourRecord.cr3ea_processstatus || tourRecord.cr3ea_status || "Pending QA";

        if (status === "Completed" || status === "Closed" || status === "Closed - Expired" || status === "Success" || status === "Success - Expired") {
            this.currentState = PKGOPS_States.COMPLETED;
        } else if (status === "Failed - Pending Production" || status === "Pending Observation" || status === "Production Action Needed") {
            this.currentState = PKGOPS_States.PENDING_PRODUCTION;
        } else if (status === "Pending Re-Verification" || status === "Failed - Pending Re-Verification") {
            this.currentState = PKGOPS_States.PENDING_REVERIFICATION;
        } else {
            this.currentState = PKGOPS_States.CHECKLIST_FILL;
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
        if (saveButton) saveButton.style.display = shouldLock ? "none" : "block";
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
    }
};
