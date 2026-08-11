// State Machine and Role-based UI visibility manager for ALC form
console.log("ALC State Machine loaded");

const ALC_STATES = {
    SESSION_DASHBOARD: "SESSION_DASHBOARD",         // Active sessions list / entry page
    INIT_PRODUCTION: "INIT_PRODUCTION",           // Step 1 / 1a
    PENDING_QA_ACCEPTANCE: "PENDING_QA_ACCEPTANCE", // Step 2 / 3
    QA_ACCEPTED: "QA_ACCEPTED",                     // Step 4 / 5
    QA_CHECKLIST: "QA_CHECKLIST",                   // Step 6 / 7 / 8 / 9
    COMPLETED_PASS: "COMPLETED_PASS",               // Step 10
    PRODUCTION_ACTION: "PRODUCTION_ACTION",         // Step 11 / 12
    QA_REVERIFYING: "QA_REVERIFYING",                // Step 13
    SUMMARY: "SUMMARY"                              // Step 14: Summary Page
};

const ALC_ROLES = {
    PRODUCTION: "PRODUCTION", // Shift Executive Production
    QUALITY: "QUALITY",       // QA Executive
    PRODUCT: "PRODUCT"        // Product Incharge / Area Owner
};

const ALC_StateMachine = {
    currentState: ALC_STATES.INIT_PRODUCTION,
    userRole: ALC_ROLES.PRODUCTION, // Default role
    currentTourId: null,
    isReadOnly: false,
    isPreviousDay: false,

    init: function (role, initialState, tourId) {
        this.userRole = role || ALC_ROLES.PRODUCTION;
        this.currentState = initialState || ALC_STATES.INIT_PRODUCTION;
        this.currentTourId = tourId || null;
        // Preserve values if pre-set, otherwise default to false
        this.isReadOnly = this.isReadOnly || false;
        this.isPreviousDay = this.isPreviousDay || false;
        
        console.log(`Initialized StateMachine with Role: ${this.userRole}, State: ${this.currentState}, TourId: ${this.currentTourId}, isReadOnly: ${this.isReadOnly}, isPreviousDay: ${this.isPreviousDay}`);
        this.transitionTo(this.currentState);
    },

    transitionTo: function (newState) {
        this.currentState = newState;
        this.applyVisibilityRules();
        this.updateStepper();
        
        // Trigger page-level state actions
        if (typeof window.onStateChanged === "function") {
            window.onStateChanged(newState, this.userRole);
        }
    },

    applyVisibilityRules: function () {
        // Hide all major step panels first
        const sections = [
            "#section-session-dashboard",
            "#section-production-init",
            "#section-pending-qa",
            "#section-checklist-filling",
            "#section-result-pass",
            "#section-result-fail",
            "#section-reverification",
            "#section-tour-summary"
        ];
        
        sections.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = "none";
        });

        // Hide warning banner by default
        const banner = document.getElementById("previous-day-warning-banner");
        if (banner) banner.style.display = "none";

        // Set visibility based on state
        switch (this.currentState) {
            case ALC_STATES.SESSION_DASHBOARD:
                this.showElement("#section-session-dashboard");
                // Only production roles can see the "Start New Request" button
                if (ALC_StateMachine.isProductionUser) {
                    this.showElement("#btn-start-new-session");
                } else {
                    this.hideElement("#btn-start-new-session");
                }
                break;

            case ALC_STATES.INIT_PRODUCTION:
                this.showElement("#section-production-init");
                this.setFieldsDisabled("#section-production-init", this.isReadOnly);
                const submitReqBtn = document.getElementById("btn-submit-request");
                if (submitReqBtn) {
                    submitReqBtn.style.display = this.isReadOnly ? "none" : "block";
                    const wrapper = submitReqBtn.closest(".tour-cyle-btn-wrapper");
                    if (wrapper) {
                        wrapper.style.display = this.isReadOnly ? "none" : "flex";
                    }
                }
                break;

            case ALC_STATES.PENDING_QA_ACCEPTANCE:
                this.showElement("#section-pending-qa");
                // QA team should see "Accept" controls, Production sees "Waiting"
                if (ALC_StateMachine.isQaUser && !this.isReadOnly) {
                    this.showElement("#qa-accept-panel");
                    this.hideElement("#production-wait-panel");
                } else {
                    this.hideElement("#qa-accept-panel");
                    this.showElement("#production-wait-panel");
                }
                break;

            case ALC_STATES.QA_CHECKLIST: {
                this.showElement("#section-checklist-filling");
                
                const isChecklistExpired = this.isPreviousDay || 
                                           (this.currentSession && 
                                            (this.currentSession.cr3ea_status === "Closed - Expired" || 
                                             this.currentSession.cr3ea_processstatus === "Closed - Expired"));

                // Disable inputs if read-only, not QA, or expired
                this.setFieldsDisabled("#section-checklist-filling", this.isReadOnly || !this.isQaUser || isChecklistExpired);
                
                const submitBtn = document.getElementById("submit-alc-btn");
                const pauseBtn = document.getElementById("pause-alc-btn");
                if (submitBtn) {
                    const isSubmitHidden = (this.isReadOnly || isChecklistExpired || !this.isQaUser);
                    submitBtn.style.display = isSubmitHidden ? "none" : "block";
                    if (pauseBtn) pauseBtn.style.display = isSubmitHidden ? "none" : "block";
                    const wrapper = submitBtn.closest(".tour-cyle-btn-wrapper");
                    if (wrapper) {
                        wrapper.style.display = isSubmitHidden ? "none" : "flex";
                    }
                }
                // Show warning banner if session is previous day or expired
                if (isChecklistExpired && banner) {
                    banner.style.display = "block";
                }
                break;
            }

            case ALC_STATES.COMPLETED_PASS:
                this.showElement("#section-result-pass");
                break;

            case ALC_STATES.PRODUCTION_ACTION: {
                this.showElement("#section-result-fail");
                const isActionExpired = this.isPreviousDay || 
                                        (this.currentSession && 
                                         (this.currentSession.cr3ea_status === "Closed - Expired" || 
                                          this.currentSession.cr3ea_processstatus === "Closed - Expired"));

                // Allow Production and Product Incharge roles to perform corrective actions (even if expired)
                const hasActionAccess = (this.isProductionUser || this.isProductUser);
                this.setFieldsDisabled("#section-result-fail", this.isReadOnly || !hasActionAccess);
                const correctiveSubmitBtn = document.getElementById("btn-submit-corrective-actions");
                if (correctiveSubmitBtn) {
                    const isCorrectiveHidden = (this.isReadOnly || !hasActionAccess);
                    correctiveSubmitBtn.style.display = isCorrectiveHidden ? "none" : "block";
                    const wrapper = correctiveSubmitBtn.closest(".tour-cyle-btn-wrapper");
                    if (wrapper) {
                        wrapper.style.display = isCorrectiveHidden ? "none" : "flex";
                    }
                }
                // Show warning banner if session is previous day or expired
                if (isActionExpired && banner) {
                    banner.style.display = "block";
                }
                break;
            }

            case ALC_STATES.QA_REVERIFYING: {
                this.showElement("#section-reverification");
                
                // Hide production corrective action logging section for QA users since they use the re-verification table
                if (!this.isQaUser) {
                    this.showElement("#section-result-fail");
                }

                const isReverifyExpired = this.isPreviousDay || 
                                           (this.currentSession && 
                                            (this.currentSession.cr3ea_status === "Closed - Expired" || 
                                             this.currentSession.cr3ea_processstatus === "Closed - Expired"));

                // Disable inputs if read-only, not QA, or expired
                this.setFieldsDisabled("#section-reverification", this.isReadOnly || !this.isQaUser || isReverifyExpired);
                
                const reverifySubmitBtn = document.getElementById("btn-submit-reverification");
                if (reverifySubmitBtn) {
                    const isReverifyHidden = (this.isReadOnly || isReverifyExpired || !this.isQaUser);
                    reverifySubmitBtn.style.display = isReverifyHidden ? "none" : "block";
                    const wrapper = reverifySubmitBtn.closest(".tour-cyle-btn-wrapper");
                    if (wrapper) {
                        wrapper.style.display = isReverifyHidden ? "none" : "flex";
                    }
                }

                // Let Production/Product Incharge edit corrective actions if they have pending actions
                const hasActionAccess = (this.isProductionUser || this.isProductUser);
                this.setFieldsDisabled("#section-result-fail", this.isReadOnly || !hasActionAccess);
                
                const correctiveSubmitBtn = document.getElementById("btn-submit-corrective-actions");
                if (correctiveSubmitBtn) {
                    const isCorrectiveHidden = (this.isReadOnly || !hasActionAccess);
                    correctiveSubmitBtn.style.display = isCorrectiveHidden ? "none" : "block";
                    const wrapper2 = correctiveSubmitBtn.closest(".tour-cyle-btn-wrapper");
                    if (wrapper2) {
                        wrapper2.style.display = isCorrectiveHidden ? "none" : "flex";
                    }
                }

                // Show warning banner if session is previous day or expired
                if (isReverifyExpired && banner) {
                    banner.style.display = "block";
                }
                break;
            }

            case ALC_STATES.SUMMARY:
                this.showElement("#section-tour-summary");
                // The summary view is always read-only
                this.setFieldsDisabled("#section-tour-summary", true);
                break;
        }
    },

    showElement: function (selector) {
        const el = document.querySelector(selector);
        if (el) el.style.display = "block";
    },

    hideElement: function (selector) {
        const el = document.querySelector(selector);
        if (el) el.style.display = "none";
    },

    setFieldsDisabled: function (selector, disabled) {
        const parent = document.querySelector(selector);
        if (!parent) return;
        
        const inputs = parent.querySelectorAll("input, select, textarea, button:not(.print-btn):not(.nav-btn)");
        inputs.forEach(el => {
            // Keep submit/navigation buttons enabled for non-restricted states
            if (el.classList.contains("nav-btn")) return;
            el.disabled = disabled;
        });
    },

    updateStepper: function () {
        const stepperContainer = document.querySelector(".tour-workflow-stepper");
        const breadcrumbContainer = document.getElementById("stepper-breadcrumb-container");
        if (!stepperContainer || !breadcrumbContainer) return;

        // Hide stepper if on the session dashboard list view
        if (this.currentState === ALC_STATES.SESSION_DASHBOARD) {
            stepperContainer.style.display = "none";
            return;
        } else {
            stepperContainer.style.display = "block";
        }

        // Define all step labels in order
        const allSteps = [
            { id: 1, label: "Request Info" },
            { id: 2, label: "QA Accept" },
            { id: 3, label: "Checklist Fill" },
            { id: 4, label: "Action Plan" },
            { id: 5, label: "Re-Verify" },
            { id: 6, label: "Finished" }
        ];

        // Map current state to step index (0 to 5)
        let activeIndex = 0;
        switch (this.currentState) {
            case ALC_STATES.INIT_PRODUCTION:
                activeIndex = 0;
                break;
            case ALC_STATES.PENDING_QA_ACCEPTANCE:
                activeIndex = 1;
                break;
            case ALC_STATES.QA_CHECKLIST:
                activeIndex = 2;
                break;
            case ALC_STATES.PRODUCTION_ACTION:
                activeIndex = 3;
                break;
            case ALC_STATES.QA_REVERIFYING:
                activeIndex = 4;
                break;
            case ALC_STATES.COMPLETED_PASS:
            case ALC_STATES.SUMMARY:
                activeIndex = 5;
                break;
        }

        // Render steps dynamically (only up to current step, hidden future steps)
        let html = "";
        for (let i = 0; i <= activeIndex; i++) {
            const step = allSteps[i];
            const isLast = (i === activeIndex);
            
            if (isLast) {
                // Active step
                html += `
                    <div class="breadcrumb-step active" style="display: flex; align-items: center; background-color: #2563eb; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-weight: 600; box-shadow: 0 1px 2px rgba(37,99,235,0.2);">
                        <span style="margin-right: 5px;">${step.id}.</span>
                        <span>${step.label}</span>
                    </div>
                `;
            } else {
                // Completed previous steps
                html += `
                    <div class="breadcrumb-step completed" style="display: flex; align-items: center; color: #16a34a; font-weight: 500; gap: 4px;">
                        <span style="font-weight: bold; font-size: 14px;">✓</span>
                        <span>${step.label}</span>
                    </div>
                    <div class="breadcrumb-separator" style="color: #cbd5e1; font-weight: bold; margin: 0 4px;">&gt;</div>
                `;
            }
        }
        
        breadcrumbContainer.innerHTML = html;
    },

    resolveQaNameFromEmail: function (email) {
        if (!email) return "";
        if (typeof ALC_QARequest !== 'undefined' && ALC_QARequest.qaList) {
            for (const item of ALC_QARequest.qaList) {
                if (item.AssignedUser && item.AssignedUser.results) {
                    const match = item.AssignedUser.results.find(u => u.EMail && u.EMail.toLowerCase() === email.toLowerCase());
                    if (match) return match.Title;
                }
            }
        }
        // Fallback parsing (e.g. gokul.aufait@domain.com -> Gokul Aufait)
        if (email.includes("@")) {
            const clean = email.split("@")[0].trim();
            const parts = clean.split(".");
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
        }
        return email;
    }
};
