// Checklist Rendering Engine for Rajpura CCP, OPRP, Sieves & Magnets Quality form
console.log("CCP_OPRP_Sieves Checklist Renderer loaded");

const CCP_OPRP_Checklist = {
    // Checkpoints list mapped by Line
    lineCheckpoints: {
        "Line-1": ["OPRP-1: Rotary (Metal Detector)", "OPRP-2: Rotary (Metal Detector)", "CCP: Packing (Metal Detector)"],
        "Line-2": ["OPRP-1: Rotary (Metal Detector)", "OPRP: Rework (Metal Detector)", "CCP: Packing (Metal Detector)"],
        "Line-3": ["OPRP-1: Rotary (Metal Detector)", "OPRP: Offline (Metal Detector)", "CCP: Packing (Metal Detector)"],
        "Line-4": ["OPRP-1: Rotary (Metal Detector)", "OPRP: Rework (Metal Detector)", "CCP: Packing (Metal Detector)"],
        "Line-5": ["OPRP-1: Rotary (Metal Detector)", "OPRP-2: Shell (Metal Detector)", "OPRP-3: Rework (Metal Detector)", "CCP: Post Cooling Tunnel (Metal Detector)"],
        "Line-6": ["OPRP-1: Rotary (Metal Detector)", "OPRP-2: Rework (Metal Detector)", "CCP: Post Cooling Tunnel (Metal Detector)"],
        "Line-7": ["OPRP-1: Rotary (Metal Detector)", "OPRP-2: Shell (Metal Detector)", "OPRP-3: Rework (Metal Detector)", "CCP (Metal Detector)"],
        "Line-8": ["OPRP-1: Rotary (Metal Detector)", "OPRP-2: Rotary (Metal Detector)", "CCP: Packing (Metal Detector)"],
        "FFS": ["CCP-1: Packing (Metal Detector)", "CCP-2: Packing (Metal Detector)"]
    },

    // Sieves & Magnets Checklists grouped by plant location and frequency
    sieveItems: {
        "NewPlant_8hrs": [
            "Sugar Sifter Pre-Mixing Area",
            "Sugar Sifter RM Area",
            "Maida Sifter Sieve Double Decker L-5&7",
            "Maida Sifter Sieve Double Decker L-6"
        ],
        "NewPlant_4hrs": [
            "Biscuits Dust 1 (L-5&7)",
            "Biscuits Dust 2 (L-6)",
            "Chemical Sifter 1",
            "Chemical Sifter 2",
            "Chemical Sifter 3 (Cocoa powder)",
            "Chemical Sifter 4 (SMP)",
            "Invert Syrup - Bucket Filter",
            "Black jack - Bucket Filter",
            "Sugar Grinding Room"
        ],
        "OldPlant_8hrs": [
            "Sugar Sifter 1",
            "Sugar Sifter 2",
            "Sugar grinder mesh - Line 1",
            "Sugar grinder mesh - Line 2",
            "Sugar grinder mesh - Line 3",
            "Sugar grinder mesh - Line 4",
            "Maida Sifter Sieve - Line 5",
            "Maida Sifter Sieve - Line 6",
            "Maida Sifter Sieve - Line 3",
            "Maida Sifter Sieve - Line 4",
            "Sugar Mesh at rotary line-1",
            "Biscuits Dust 1",
            "Biscuits Dust 2",
            "Chemical Sifter 1",
            "Chemical Sifter 3",
            "Chemical Sifter 5",
            "Atta shifter",
            "Maida Sieve for sampling",
            "Invert Syrup - Bucket Filter (Every Batch Change)"
        ],
        "OldPlant_4hrs": [
            "Maida hopper magnet line-1",
            "Maida hopper magnet line-2",
            "Maida hopper magnet line-3",
            "Maida hopper magnet line-4",
            "Sugar grinder Magnet",
            "Biscuit dust magnet 1",
            "Biscuit dust magnet 2"
        ]
    },

    // Resolve cycle status based on subcheck records and shutdown status
    getCycleStatus: function (cycleData) {
        if (!cycleData) return "Upcoming";
        
        // Check for shutdown
        const shutdownRow = (cycleData.rows || []).find(r => r.cr3ea_checkpointname === "Shutdown Closure");
        if (shutdownRow) {
            return "Not Operational";
        }

        const rows = cycleData.rows || [];

        // Check if there is a metadata initialization row (draft/paused status)
        const hasInitRow = rows.some(r => r.cr3ea_checkpointname === "Metadata Initialization" || r.cr3ea_description === "Metadata Initialization");
        const hasActualChecks = rows.some(r => r.cr3ea_checkpointname !== "Metadata Initialization" && r.cr3ea_checkpointname !== "Shutdown Closure" && r.cr3ea_description !== "Metadata Initialization");

        if (hasInitRow) {
            return hasActualChecks ? "Checklist Filling - Paused" : "Checklist Filling";
        }

        const deviations = rows.filter(r => r.cr3ea_acceptanceresponse === "Not Okay");

        if (deviations.length === 0) {
            return "Completed";
        }

        let hasEscalated = false;
        let hasActionTaken = false;
        let hasPendingAction = false;

        deviations.forEach(r => {
            const status = r.cr3ea_deviationstatus || "";
            if (status === "Escalated") hasEscalated = true;
            else if (status === "Action Taken") hasActionTaken = true;
            else if (status === "Closed") {
                // Resolved/Closed subcheck
            } else {
                hasPendingAction = true;
            }
        });

        if (hasEscalated) return "Escalated";
        if (hasActionTaken) return "Pending QA Re-Verification";
        if (hasPendingAction) return "Pending Production Action";
        return "Completed";
    },

    // Generates active step indicators like ALC
    generateStepperHtml: function (status) {
        const steps = [
            { id: 1, label: "Setup Info" },
            { id: 2, label: "Checklist Fill" },
            { id: 3, label: "Action Plan" },
            { id: 4, label: "Re-Verify" },
            { id: 5, label: "Closed" }
        ];

        let activeIdx = 0;
        if (status === "Metadata Setup") activeIdx = 0;
        else if (status === "Checklist Filling" || status === "Checklist Filling - Paused") activeIdx = 1;
        else if (status === "Pending Production Action") activeIdx = 2;
        else if (status === "Pending QA Re-Verification") activeIdx = 3;
        else if (status === "Completed" || status === "Not Operational" || status === "Escalated") activeIdx = 4;

        let html = `
            <div class="tour-workflow-stepper" style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; flex-wrap: wrap;">
        `;

        steps.forEach((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isActive = idx === activeIdx;

            if (isCompleted) {
                html += `
                    <div class="step-item completed" style="display: flex; align-items: center; color: #16a34a; font-weight: 500; font-size: 12px; gap: 4px;">
                        <span style="font-weight: bold;">✓</span>
                        <span>${step.label}</span>
                    </div>
                `;
            } else if (isActive) {
                html += `
                    <div class="step-item active" style="display: flex; align-items: center; color: #ffffff; background: #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 12px; gap: 4px;">
                        <span>${step.id}.</span>
                        <span>${step.label}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="step-item upcoming" style="display: flex; align-items: center; color: #94a3b8; font-weight: 500; font-size: 12px; gap: 4px;">
                        <span>${step.id}.</span>
                        <span>${step.label}</span>
                    </div>
                `;
            }

            if (idx < steps.length - 1) {
                html += `
                    <div style="color: #cbd5e1; font-weight: bold; font-size: 12px;">➔</div>
                `;
            }
        });

        html += `</div>`;
        return html;
    },

    // Dynamic Cycle Card Generator
    renderCycleSection: function (cycleNum, isCompleted = false, cycleData = null) {
        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (!parentElement) return;

        const cycleId = `cycle-${cycleNum}`;
        const newCycle = document.createElement("div");
        newCycle.classList.add("bs-card", "bs-card-secondary", "tour-cycle-panel");
        newCycle.id = cycleId;

        let dateStr = moment().format("DD/MM/YYYY");
        if (isCompleted && cycleData) {
            const rawDate = cycleData.sessionTime || (CCP_OPRP_Main.state.tourData ? CCP_OPRP_Main.state.tourData.cr3ea_tourstartdate : null);
            if (rawDate) {
                dateStr = moment(rawDate).format("DD/MM/YYYY");
            }
        }
        const status = isCompleted ? this.getCycleStatus(cycleData) : "Metadata Setup";
        const isClosedCycle = isCompleted && status !== "Checklist Filling" && status !== "Checklist Filling - Paused";

        let badgeColor = "#64748b";
        let badgeBg = "#f1f5f9";
        if (status === "Metadata Setup") { badgeColor = "#2563eb"; badgeBg = "#dbeafe"; }
        else if (status === "Checklist Filling" || status === "Checklist Filling - Paused") { badgeColor = "#d97706"; badgeBg = "#fef3c7"; }
        else if (status === "Completed") { badgeColor = "#16a34a"; badgeBg = "#dcfce7"; }
        else if (status === "Pending Production Action") { badgeColor = "#ea580c"; badgeBg = "#ffedd5"; }
        else if (status === "Pending QA Re-Verification") { badgeColor = "#7c3aed"; badgeBg = "#ede9fe"; }
        else if (status === "Escalated" || status === "Not Operational") { badgeColor = "#dc2626"; badgeBg = "#fee2e2"; }

        let headerHtml = `
            <div class="bs-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <h4 class="bs-card-title" style="margin: 0;">Cycle ${cycleNum}</h4>
                    <span class="badge" style="background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${status}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="tour-date" style="font-size: 13px; color: #64748b; font-weight: 500;">${dateStr}</span>
                    <button type="button" class="bs-btn icon-btn bs-card-toggler-btn" onclick="CCP_OPRP_Checklist.togglePanel(${cycleNum})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3.66667 5.66666L8.33333 10.3333L13 5.66666" stroke="#0C0D10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        let bodyHtml = "";
        const stepperHtml = this.generateStepperHtml(status);

        if (isClosedCycle) {
            const displayTitle = CCP_OPRP_Main.state.category === "CCP" ? "CCP & OPRP Checklist Summary" : "Sieves & Magnets Checklist Summary";
            const tableHtml = this.generateSummaryTable(cycleData);

            bodyHtml = `
                <div class="bs-card-body" style="display: block;">
                    ${stepperHtml}
                    <div class="tour-cycle-info-wrapper" style="margin-bottom: 15px;">
                        <div class="tour-cyle-start-info" style="display: flex; flex-wrap: wrap; gap: 15px; background: #f8fafc; padding: 12px; border-radius: 8px;">
                            ${CCP_OPRP_Main.state.category === "CCP" ? `
                                <div><strong>Product:</strong> ${cycleData.productName || "N/A"}</div>
                                <div><strong>Executive:</strong> ${cycleData.executiveName || "N/A"}</div>
                                <div><strong>Line:</strong> ${cycleData.location || "N/A"}</div>
                                <div><strong>Response:</strong> ${cycleData.response || "OK"}</div>
                            ` : `
                                <div><strong>Executive:</strong> ${cycleData.executiveName || "N/A"}</div>
                                <div><strong>Frequency:</strong> ${CCP_OPRP_Main.state.frequency === "4hrs" ? "4-Hour Check" : "Once a Shift (8-Hour Check)"}</div>
                                <div><strong>Response:</strong> ${cycleData.response || "OK"}</div>
                            `}
                        </div>
                    </div>
                    <div class="tour-cyle-step-completed">
                        <h5 style="margin-top: 0; font-weight: bold; color: #1e293b;">${displayTitle}</h5>
                        ${tableHtml}
                    </div>
                    ${this.generateDeviationWorkflowUI(cycleNum, cycleData)}
                </div>
            `;
        } else {
            const activeFormHtml = this.generateActiveForm(cycleNum);
            bodyHtml = `
                <div class="bs-card-body" style="display: block;">
                    ${stepperHtml}
                    ${activeFormHtml}
                </div>
            `;
        }

        newCycle.innerHTML = headerHtml + bodyHtml;
        parentElement.appendChild(newCycle);

        if (!isClosedCycle) {
            newCycle.classList.add("bs-card-toggler-is-active");
            if (CCP_OPRP_Main.state.category === "CCP" && status === "Metadata Setup") {
                this.handleAcceptanceToggle(cycleNum);
            }
            
            // Auto initialize checklist view if it's already in filling status (reload support)
            if ((status === "Checklist Filling" || status === "Checklist Filling - Paused") && cycleData) {
                // Pre-fill fields in active view on render tick
                setTimeout(() => {
                    CCP_OPRP_Checklist.initializeChecklistSession(cycleNum, cycleData);
                }, 0);
            }
        }
    },

    togglePanel: function (cycleNum) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        if (!panel) return;
        panel.classList.toggle("bs-card-toggler-is-active");
    },

    // Generates metadata startup/acceptance selection inputs
    generateActiveForm: function (cycleNum) {
        const isCCP = CCP_OPRP_Main.state.category === "CCP";
        const currentLine = CCP_OPRP_Main.state.selectedLine;
        const canEdit = CCP_OPRP_Main.state.canEditChecklist;
        const disabledAttr = canEdit ? "" : "disabled";
        const displayBtn = canEdit ? "block" : "none";
        
        let startForm = "";
        let warningBanner = "";

        if (!canEdit) {
            warningBanner = `
                <div style="padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; color: #b45309; font-size: 13px; font-weight: 500; margin-bottom: 15px;">
                    ⚠️ You are viewing this checklist in read-only mode. Only the assigned QA Executive (${CCP_OPRP_Main.state.qaExecutive || "N/A"}) can edit these details.
                </div>
            `;
        }

        if (isCCP) {
            // Acceptance Choice
            startForm = `
                <div class="tour-cyle-step-start" id="start-step-${cycleNum}">
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label class="form-label">Acceptance Response</label>
                        <div class="acceptance-toggles" style="display: flex; gap: 10px;">
                            <button type="button" class="bs-btn bs-btn-outline-primary active" ${disabledAttr} data-val="OK" onclick="CCP_OPRP_Checklist.setAcceptance(${cycleNum}, 'OK')">OK</button>
                            <button type="button" class="bs-btn bs-btn-outline-primary" ${disabledAttr} data-val="Line Not Operational" onclick="CCP_OPRP_Checklist.setAcceptance(${cycleNum}, 'Line Not Operational')">Line Not Operational</button>
                            <button type="button" class="bs-btn bs-btn-outline-primary" ${disabledAttr} data-val="Plant Not Operational" onclick="CCP_OPRP_Checklist.setAcceptance(${cycleNum}, 'Plant Not Operational')">Plant Not Operational</button>
                        </div>
                    </div>
 
                    <div id="shutdown-reason-group-${cycleNum}" class="form-group" style="display: none; margin-bottom: 15px;">
                        <label class="form-label">Reason for Shutdown / Closure</label>
                        <input type="text" class="form-control" id="shutdown-reason-${cycleNum}" ${disabledAttr} placeholder="Enter reason here..." />
                    </div>
 
                    <div id="session-metadata-fields-${cycleNum}">
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label">Product Name</label>
                            <input type="text" class="form-control" id="product-name-${cycleNum}" ${disabledAttr} placeholder="Enter Product Name..." />
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label">Shift Executive (Production)</label>
                            <input type="text" class="form-control" id="executive-name-${cycleNum}" ${disabledAttr} value="${CCP_OPRP_Main.state.productionIncharge}" placeholder="Enter Production Executive Name..." />
                        </div>
                        <div class="form-group" style="margin-bottom: 12px;">
                            <label class="form-label">Line No</label>
                            <input type="text" class="form-control" id="line-no-${cycleNum}" value="${currentLine}" disabled />
                        </div>
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label class="form-label">Session Time</label>
                            <input type="time" class="form-control" id="session-time-${cycleNum}" ${disabledAttr} value="${moment().format("HH:mm")}" />
                        </div>
                    </div>
 
                    <div style="margin-top: 15px; display: ${displayBtn};">
                        <button type="button" class="bs-btn bs-btn-primary" onclick="CCP_OPRP_Checklist.startSession(${cycleNum})">Start Session</button>
                    </div>
                </div>
            `;
        } else {
            // Sieves & Magnets Start Form
            startForm = `
                <div class="tour-cyle-step-start" id="start-step-${cycleNum}">
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label">Shift Executive (Production)</label>
                        <input type="text" class="form-control" id="executive-name-${cycleNum}" ${disabledAttr} value="${CCP_OPRP_Main.state.productionIncharge}" />
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                        <label class="form-label">Frequency</label>
                        <input type="text" class="form-control" id="frequency-${cycleNum}" value="${CCP_OPRP_Main.state.frequency === "4hrs" ? "4-Hour Check" : "Once a Shift (8-Hour Check)"}" disabled />
                    </div>
                    <div style="margin-top: 15px; display: ${displayBtn};">
                        <button type="button" class="bs-btn bs-btn-primary" onclick="CCP_OPRP_Checklist.startSession(${cycleNum})">Start Session</button>
                    </div>
                </div>
            `;
        }
 
        // Checklist containers (hidden by default until start session)
        const checklistBody = `
            <div class="tour-cycle-info-wrapper" id="info-wrapper-${cycleNum}" style="display: none; margin-bottom: 15px;">
                <div class="tour-cyle-start-info" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e2e8f0; padding: 12px; border-radius: 8px;"></div>
            </div>
 
            <div class="tour-cyle-step-form" id="checklist-form-${cycleNum}" style="display: none;">
                <!-- Tab Headers and content panels will render here -->
                <div class="tabs-header-container" id="tabs-header-${cycleNum}" style="display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 15px; overflow-x: auto; padding-bottom: 5px;"></div>
                <div class="tabs-panes-container" id="tabs-panes-${cycleNum}"></div>
 
                <div class="form-footer" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    <button type="button" class="bs-btn bs-btn-outline-primary" onclick="window.location.reload()">Cancel</button>
                    <button type="button" class="bs-btn bs-btn-secondary" style="display: ${displayBtn}; background-color: #64748b !important; color: #ffffff !important; border: none !important;" onclick="CCP_OPRP_Checklist.saveSession(${cycleNum}, true)">Pause</button>
                    <button type="button" class="bs-btn bs-btn-primary" style="display: ${displayBtn};" onclick="CCP_OPRP_Checklist.saveSession(${cycleNum}, false)">Save Session</button>
                </div>
            </div>
        `;
 
        return warningBanner + startForm + checklistBody;
    },

    // Handles toggle state switches in the start panel
    setAcceptance: function (cycleNum, val) {
        const startDiv = document.getElementById(`start-step-${cycleNum}`);
        startDiv.querySelectorAll(".acceptance-toggles button").forEach(b => b.classList.remove("active"));
        
        const activeBtn = startDiv.querySelector(`.acceptance-toggles button[data-val="${val}"]`);
        if (activeBtn) activeBtn.classList.add("active");

        const shutdownGroup = document.getElementById(`shutdown-reason-group-${cycleNum}`);
        const metaFields = document.getElementById(`session-metadata-fields-${cycleNum}`);

        if (val === "OK") {
            shutdownGroup.style.display = "none";
            metaFields.style.display = "block";
        } else {
            shutdownGroup.style.display = "block";
            metaFields.style.display = "none";
        }
    },

    handleAcceptanceToggle: function (cycleNum) {
        this.setAcceptance(cycleNum, "OK");
    },

    // Session Unlock Transition (Saves initial metadata record immediately to Dataverse)
    startSession: async function (cycleNum) {
        const category = CCP_OPRP_Main.state.category;
        const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
        const formContainer = document.getElementById(`checklist-form-${cycleNum}`);
        
        let startData = {};
        
        if (category === "CCP") {
            const startDiv = document.getElementById(`start-step-${cycleNum}`);
            const response = startDiv.querySelector(".acceptance-toggles button.active").dataset.val;

            if (response !== "OK") {
                const reason = document.getElementById(`shutdown-reason-${cycleNum}`).value;
                if (!reason) {
                    alert("Please provide the reason for closure/shutdown.");
                    return;
                }
                startData = { response, reason, productName: "N/A", executiveName: CCP_OPRP_Main.state.productionIncharge || "", location: CCP_OPRP_Main.state.selectedLine, sessionTime: moment().format("HH:mm") };
                
                // Immediately save shutdown cycle
                this.saveShutdownSession(cycleNum, startData);
                return;
            } else {
                const product = document.getElementById(`product-name-${cycleNum}`).value;
                const executiveName = document.getElementById(`executive-name-${cycleNum}`).value;
                const sessionTime = document.getElementById(`session-time-${cycleNum}`).value;

                if (!product || !executiveName) {
                    alert("Please fill in Product Name and Production Incharge fields.");
                    return;
                }
                startData = { response: "OK", productName: product, executiveName, location: CCP_OPRP_Main.state.selectedLine, sessionTime };
            }
        } else {
            const executiveName = document.getElementById(`executive-name-${cycleNum}`).value;
            if (!executiveName) {
                alert("Please fill in the Production Incharge field.");
                return;
            }
            startData = { response: "OK", productName: "N/A", executiveName, location: "Sieves & Magnets", sessionTime: moment().format("HH:mm") };
        }

        // Cache parameters to DOM elements for retrieval on save
        infoWrapper.dataset.product = startData.productName;
        infoWrapper.dataset.executive = startData.executiveName;
        infoWrapper.dataset.location = startData.location;
        infoWrapper.dataset.time = startData.sessionTime;
        infoWrapper.dataset.response = startData.response;

        // Persist started cycle metadata immediately in Dataverse
        ShowLoader();
        const tourId = CCP_OPRP_Main.state.varTourID;
        const shift = sessionStorage.getItem("shiftValue") || "Shift-1";

        let initRecord = {};
        if (category === "CCP") {
            initRecord = {
                "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                "cr3ea_title": `OPRP_CCP_${moment().format("DD-MM-YYYY")}_Line${startData.location}_Cycle-${cycleNum}_INIT`,
                "cr3ea_cycle": `Cycle-${cycleNum}`,
                "cr3ea_shift": shift,
                "cr3ea_tourstartdate": moment().format("MM-DD-YYYY"),
                "cr3ea_observedby": CCP_OPRP_Main.state.qaExecutive,
                "cr3ea_location": startData.location,
                "cr3ea_productname": startData.productName,
                "cr3ea_category": "CCP",
                "cr3ea_checkpointname": "Metadata Initialization",
                "cr3ea_acceptanceresponse": "In Progress"
            };
        } else {
            initRecord = {
                "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                "cr3ea_title": `Sieves_${moment().format("DD-MM-YYYY")}_Cycle-${cycleNum}_INIT`,
                "cr3ea_cycle": `Cycle-${cycleNum}`,
                "cr3ea_frequency": CCP_OPRP_Main.state.frequency,
                "cr3ea_description": "Metadata Initialization",
                "cr3ea_criteria": "In Progress"
            };
        }

        try {
            await CCP_OPRP_DAL.saveChecklistItem(initRecord, category);
            HideLoader();
            
            // Reload page or re-init history to load checklist view
            await CCP_OPRP_Main.init();
        } catch (err) {
            HideLoader();
            console.error("Failed to save initial metadata: ", err);
            alert("Failed to initialize session: " + err.message);
        }
    },

    // Resumes active checklist filling state from Dataverse record on page load
    initializeChecklistSession: function (cycleNum, cycleData) {
        const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
        if (!infoWrapper) return;
        const infoContent = infoWrapper.querySelector(".tour-cyle-start-info");
        const formContainer = document.getElementById(`checklist-form-${cycleNum}`);
        
        const startData = {
            response: cycleData.response || "OK",
            productName: cycleData.productName || "N/A",
            executiveName: cycleData.executiveName || CCP_OPRP_Main.state.qaExecutive,
            location: cycleData.location || CCP_OPRP_Main.state.selectedLine,
            sessionTime: cycleData.sessionTime || moment().format("HH:mm")
        };

        if (CCP_OPRP_Main.state.category === "CCP") {
            infoContent.innerHTML = `
                <div><strong>Product:</strong> ${startData.productName}</div>
                <div><strong>Executive Name:</strong> ${startData.executiveName}</div>
                <div><strong>Line No:</strong> ${startData.location}</div>
                <div><strong>Session Time:</strong> ${startData.sessionTime}</div>
                <div><strong>Response:</strong> ${startData.response}</div>
            `;
        } else {
            infoContent.innerHTML = `
                <div><strong>Executive Name:</strong> ${startData.executiveName}</div>
                <div><strong>Frequency:</strong> ${CCP_OPRP_Main.state.frequency}</div>
                <div><strong>Response:</strong> ${startData.response}</div>
            `;
        }

        // Cache parameters to DOM elements for retrieval on save
        infoWrapper.dataset.product = startData.productName;
        infoWrapper.dataset.executive = startData.executiveName;
        infoWrapper.dataset.location = startData.location;
        infoWrapper.dataset.time = startData.sessionTime;
        infoWrapper.dataset.response = startData.response;

        // Pre-populate parameter inputs in the DOM so dynamic rows can fetch them
        const productInput = document.getElementById(`product-name-${cycleNum}`);
        if (productInput) productInput.value = startData.productName;

        const execInput = document.getElementById(`executive-name-${cycleNum}`);
        if (execInput) execInput.value = startData.executiveName;

        const timeInput = document.getElementById(`session-time-${cycleNum}`);
        if (timeInput) timeInput.value = startData.sessionTime;

        document.getElementById(`start-step-${cycleNum}`).style.display = "none";
        infoWrapper.style.display = "block";
        formContainer.style.display = "block";

        // Generate checklists
        this.generateChecklistUI(cycleNum);

        const rows = cycleData.rows || [];
        const isCCP = CCP_OPRP_Main.state.category === "CCP";

        if (isCCP) {
            // Pre-process: Detect max row count per tab pane
            const maxRowsPerTab = {}; // Map of tabIdx -> maxRowNumber
            const line = CCP_OPRP_Main.state.selectedLine;
            const checkpoints = this.lineCheckpoints[line] || ["CCP (Metal Detector)"];

            rows.forEach(row => {
                if (row.cr3ea_checkpointname === "Metadata Initialization" || row.cr3ea_description === "Metadata Initialization") return;
                
                const fullName = row.cr3ea_checkpointname || "";
                const parts = fullName.split(" - ");
                const parentName = parts[0];
                
                const tabIdx = checkpoints.indexOf(parentName);
                if (tabIdx !== -1) {
                    let rowNum = 1;
                    if (parts[1] && parts[1].startsWith("Row ")) {
                        rowNum = parseInt(parts[1].replace("Row ", "")) || 1;
                    }
                    maxRowsPerTab[tabIdx] = Math.max(maxRowsPerTab[tabIdx] || 1, rowNum);
                }
            });

            // Recreate the dynamic rows for each tab pane
            checkpoints.forEach((cpName, tabIdx) => {
                const maxRows = maxRowsPerTab[tabIdx] || 1;
                // r = 2 because generateChecklistUI already appended Row 1
                for (let r = 2; r <= maxRows; r++) {
                    this.addChecklistRow(cycleNum, tabIdx);
                }
            });
        }

        // Pre-populate any checks saved in cycleData.rows (Pause/Resume support)
        rows.forEach(row => {
            if (row.cr3ea_checkpointname === "Metadata Initialization" || row.cr3ea_description === "Metadata Initialization") return;
            
            if (isCCP) {
                const fullName = row.cr3ea_checkpointname || "";
                const parts = fullName.split(" - ");
                const parentName = parts[0];
                
                let rowNum = 1;
                let subLabel = "";
                if (parts[1] && parts[1].startsWith("Row ")) {
                    rowNum = parseInt(parts[1].replace("Row ", "")) || 1;
                    subLabel = parts.slice(2).join(" - ");
                } else {
                    subLabel = parts.slice(1).join(" - ");
                }

                // Find the tab pane matching parentName
                const panes = formContainer.querySelectorAll(".tab-pane-content");
                panes.forEach(pane => {
                    if (pane.dataset.checkpoint === parentName) {
                        const checkpoints = this.lineCheckpoints[CCP_OPRP_Main.state.selectedLine] || ["CCP (Metal Detector)"];
                        const tabIdx = checkpoints.indexOf(parentName);
                        
                        const rowId = `row-${cycleNum}-${tabIdx}-${rowNum}`;
                        const rowWrapper = pane.querySelector(`#${rowId}`);
                        if (rowWrapper) {
                            const checkRows = rowWrapper.querySelectorAll(".checkpoint-check-row");
                            checkRows.forEach(checkRow => {
                                const labelSpan = checkRow.querySelector(".check-label");
                                if (labelSpan && labelSpan.innerText.trim() === subLabel.trim()) {
                                    const response = row.cr3ea_acceptanceresponse || "OK";
                                    const isNotOkay = response.includes("Not Okay");
                                    
                                    const btnNotOk = checkRow.querySelector('[data-status="not-okay"]');
                                    const btnOk = checkRow.querySelector('[data-status="okay"]');
                                    
                                    if (isNotOkay) {
                                        btnNotOk.classList.add("badge-fill");
                                        btnOk.classList.remove("badge-fill");
                                        
                                        const remarksField = checkRow.querySelector(".defect-remarks-field");
                                        if (remarksField) {
                                            remarksField.style.display = "block";
                                            const input = remarksField.querySelector("input");
                                            if (input) input.value = row.cr3ea_defectremarks || "";
                                        }
                                    } else {
                                        btnOk.classList.add("badge-fill");
                                        btnNotOk.classList.remove("badge-fill");
                                    }

                                    if (row.cr3ea_acceptanceresponse && row.cr3ea_acceptanceresponse.includes("(")) {
                                        const match = row.cr3ea_acceptanceresponse.match(/\(([^)]+)\)/);
                                        if (match) {
                                            const valInput = checkRow.querySelector(".check-val-input");
                                            if (valInput) valInput.value = match[1];
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            } else {
                // Sieves mapping
                const sieveRows = formContainer.querySelectorAll(".sieve-item-row");
                sieveRows.forEach(sieveRow => {
                    if (sieveRow.dataset.description === row.cr3ea_description) {
                        const isNotOkay = row.cr3ea_criteria === "Not Okay";
                        const btnNotOk = sieveRow.querySelector('[data-status="not-okay"]');
                        const btnOk = sieveRow.querySelector('[data-status="okay"]');
                        
                        if (isNotOkay) {
                            btnNotOk.classList.add("badge-fill");
                            btnOk.classList.remove("badge-fill");
                            const remarksField = sieveRow.querySelector(".defect-remarks-field");
                            if (remarksField) {
                                remarksField.style.display = "block";
                                const input = remarksField.querySelector("input");
                                if (input) input.value = row.cr3ea_defectremarks || "";
                            }
                        } else {
                            btnOk.classList.add("badge-fill");
                            btnNotOk.classList.remove("badge-fill");
                        }
                    }
                });
            }
        });
    },

    // Installs checkpoints dynamically
    generateChecklistUI: function (cycleNum) {
        const category = CCP_OPRP_Main.state.category;
        const tabsHeader = document.getElementById(`tabs-header-${cycleNum}`);
        const tabsPanes = document.getElementById(`tabs-panes-${cycleNum}`);
        const canEdit = CCP_OPRP_Main.state.canEditChecklist;
        const disabledAttr = canEdit ? "" : "disabled";
        
        tabsHeader.innerHTML = "";
        tabsPanes.innerHTML = "";

        if (category === "CCP") {
            const line = CCP_OPRP_Main.state.selectedLine;
            const checkpoints = this.lineCheckpoints[line] || ["CCP (Metal Detector)"];

            checkpoints.forEach((cpName, idx) => {
                const tabId = `tab-${cycleNum}-${idx}`;
                const paneId = `pane-${cycleNum}-${idx}`;
                
                // Add Tab Header Button
                const cleanName = cpName.split(":")[0];
                const activeClass = idx === 0 ? "active" : "";
                tabsHeader.insertAdjacentHTML("beforeend", `
                    <button type="button" class="tab-header-btn ${activeClass}" id="${tabId}" onclick="CCP_OPRP_Checklist.switchTab('${cycleNum}', ${idx}, ${checkpoints.length})">${cleanName}</button>
                `);

                // Add Tab Content Pane
                const displayStyle = idx === 0 ? "block" : "none";
                const displayAddRow = canEdit ? "block" : "none";
                tabsPanes.insertAdjacentHTML("beforeend", `
                    <div class="tab-pane-content" id="${paneId}" style="display: ${displayStyle};" data-checkpoint="${cpName}">
                        <div class="rows-container"></div>
                        <div style="margin-top: 15px; margin-bottom: 10px; display: ${displayAddRow};">
                            <button type="button" class="bs-btn bs-btn-outline-primary btn-sm" onclick="CCP_OPRP_Checklist.addChecklistRow('${cycleNum}', ${idx})">+ Add Row</button>
                        </div>
                    </div>
                `);

                // Append initial row
                this.addChecklistRow(cycleNum, idx);
            });
        } else {
            // Sieves & Magnets (Single tab, list checkpoints directly)
            tabsHeader.style.display = "none";
            
            // Get checklist items based on frequency and plant grouping
            const plantGroup = CCP_OPRP_Main.state.site === "Rajpura" ? "NewPlant" : "OldPlant";
            const freqSuffix = CCP_OPRP_Main.state.frequency === "4hrs" ? "4hrs" : "8hrs";
            const items = this.sieveItems[`${plantGroup}_${freqSuffix}`] || [];

            let listHtml = `
                <div class="tab-pane-content" id="pane-${cycleNum}-0" style="display: block;">
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            `;

            items.forEach((itemText, itemIdx) => {
                const itemId = `sieve-${cycleNum}-${itemIdx}`;
                listHtml += `
                    <div class="bs-card bs-card-light bs-card-sm sieve-item-row" style="margin-bottom: 12px; border-left: 4px solid #64748b;" data-description="${itemText}">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <h5 style="margin: 0; font-weight: 600; color: #334155;">${itemText}</h5>
                            <div class="toggle-switch-badge">
                                <button type="button" class="badge badge-lg badge-error" ${disabledAttr} data-status="not-okay" onclick="CCP_OPRP_Checklist.toggleStatus(this, 'not-okay')">Not Okay</button>
                                <button type="button" class="badge badge-lg badge-success badge-fill" ${disabledAttr} data-status="okay" onclick="CCP_OPRP_Checklist.toggleStatus(this, 'okay')">Okay</button>
                            </div>
                        </div>
                        <div class="defect-remarks-field" style="display: none; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                            <label class="form-label" style="font-size: 12px; color: #475569;">Defect Remarks</label>
                            <input type="text" class="form-control" ${disabledAttr} placeholder="Enter remarks..." style="height: 34px;" />
                        </div>
                    </div>
                `;
            });

            listHtml += `
                    </div>
                </div>
            `;
            tabsPanes.innerHTML = listHtml;
        }
    },

    switchTab: function (cycleNum, targetIdx, total) {
        for (let i = 0; i < total; i++) {
            const header = document.getElementById(`tab-${cycleNum}-${i}`);
            const pane = document.getElementById(`pane-${cycleNum}-${i}`);
            if (header && pane) {
                if (i === targetIdx) {
                    header.classList.add("active");
                    pane.style.display = "block";
                } else {
                    header.classList.remove("active");
                    pane.style.display = "none";
                }
            }
        }
    },

    // Dynamically adds rows inside OPRP/CCP sub-tabs
    addChecklistRow: function (cycleNum, tabIdx) {
        const pane = document.getElementById(`pane-${cycleNum}-${tabIdx}`);
        const rowsContainer = pane.querySelector(".rows-container");
        const rowCount = rowsContainer.children.length + 1;
        const rowId = `row-${cycleNum}-${tabIdx}-${rowCount}`;
        const canEdit = CCP_OPRP_Main.state.canEditChecklist;

        const rowHtml = `
            <div class="bs-card bs-card-light bs-card-sm checkpoint-inner-row" id="${rowId}" style="margin-bottom: 15px; border: 1px solid #cbd5e1; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                    <strong style="color: #475569;">Row ${rowCount}</strong>
                    ${(rowCount > 1 && canEdit) ? `<button type="button" class="bs-btn btn-sm btn-link" style="color: #ef4444;" onclick="CCP_OPRP_Checklist.removeChecklistRow('${rowId}')">Remove</button>` : ""}
                </div>

                <!-- Column Metadata display -->
                <div style="display: flex; gap: 10px; margin-bottom: 15px; background: #f1f5f9; padding: 10px; border-radius: 6px; flex-wrap: wrap;">
                    <div style="font-size: 12px;"><strong>Product:</strong> ${document.getElementById(`product-name-${cycleNum}`).value}</div>
                    <div style="font-size: 12px;"><strong>Exec:</strong> ${document.getElementById(`executive-name-${cycleNum}`).value}</div>
                    <div style="font-size: 12px;"><strong>Line:</strong> ${CCP_OPRP_Main.state.selectedLine}</div>
                </div>

                <!-- Checkpoints list (FE, NFE, SS) -->
                <div class="checkpoints-block-list">
                    <!-- FE Checkpoints -->
                    <div style="margin-bottom: 15px;">
                        <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">FE (Ferrous) Check</h6>
                        ${this.generateCheckRow("FE - Centre 1st Pass", "fecentrepass1", cycleNum, tabIdx, rowCount)}
                        ${this.generateCheckRow("FE - Centre 2nd Pass", "fecentrepass2", cycleNum, tabIdx, rowCount)}
                    </div>

                    <!-- NFE Checkpoints -->
                    <div style="margin-bottom: 15px;">
                        <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">NFE (Non-Ferrous) Check</h6>
                        ${this.generateCheckRow("NFE - Centre 1st Pass", "nfecentrepass1", cycleNum, tabIdx, rowCount)}
                        ${this.generateCheckRow("NFE - Centre 2nd Pass", "nfecentrepass2", cycleNum, tabIdx, rowCount)}
                    </div>

                    <!-- SS Checkpoints -->
                    <div style="margin-bottom: 15px;">
                        <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">SS (Stainless Steel) Check</h6>
                        ${this.generateCheckRow("SS - Centre 1st Pass", "sscentrepass1", cycleNum, tabIdx, rowCount)}
                        ${this.generateCheckRow("SS - Centre 2nd Pass", "sscentrepass2", cycleNum, tabIdx, rowCount)}
                    </div>

                    <!-- MD Checkpoint (holds actual value) -->
                    <div>
                        <h6 style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">M.D. Sensitivity & Rejection in Time</h6>
                        ${this.generateCheckRow("MD Sensitivity Check", "mdsensitivity", cycleNum, tabIdx, rowCount, true)}
                    </div>
                </div>
            </div>
        `;

        rowsContainer.insertAdjacentHTML("beforeend", rowHtml);
    },

    removeChecklistRow: function (rowId) {
        const row = document.getElementById(rowId);
        if (row) row.remove();
    },

    generateCheckRow: function (label, key, cycleNum, tabIdx, rowCount, hasValueField = false) {
        const uniqueId = `check-${cycleNum}-${tabIdx}-${rowCount}-${key}`;
        const canEdit = CCP_OPRP_Main.state.canEditChecklist;
        const disabledAttr = canEdit ? "" : "disabled";
        
        let valueInputHtml = "";
        if (hasValueField) {
            valueInputHtml = `
                <div style="margin-top: 8px;">
                    <label class="form-label" style="font-size: 11px; color: #64748b;">Sensitivity Value (e.g. 1.2mm)</label>
                    <input type="text" class="form-control check-val-input" ${disabledAttr} placeholder="Enter sensitivity value..." style="height: 32px;" />
                </div>
            `;
        }

        return `
            <div class="checkpoint-check-row" data-key="${key}" data-label="${label}" style="display: flex; flex-direction: column; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="check-label" style="font-size: 13px; font-weight: 500; color: #334155;">${label}</span>
                    <div class="toggle-switch-badge">
                        <button type="button" class="badge badge-lg badge-error" ${disabledAttr} data-status="not-okay" onclick="CCP_OPRP_Checklist.toggleStatus(this, 'not-okay')">Not Okay</button>
                        <button type="button" class="badge badge-lg badge-success badge-fill" ${disabledAttr} data-status="okay" onclick="CCP_OPRP_Checklist.toggleStatus(this, 'okay')">Okay</button>
                    </div>
                </div>
                
                ${valueInputHtml}

                <div class="defect-remarks-field" style="display: none; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                    <div>
                        <label class="form-label" style="font-size: 11px; color: #475569; margin-bottom: 2px;">Defect Remarks</label>
                        <input type="text" class="form-control check-remarks-input" ${disabledAttr} placeholder="Enter remarks..." style="height: 32px;" />
                    </div>
                </div>
            </div>
        `;
    },

    toggleStatus: function (btn, status) {
        const container = btn.closest(".toggle-switch-badge");
        const remarksField = btn.closest(".checkpoint-check-row") ? btn.closest(".checkpoint-check-row").querySelector(".defect-remarks-field") : btn.closest(".sieve-item-row").querySelector(".defect-remarks-field");

        container.querySelectorAll("button").forEach(b => b.classList.remove("badge-fill"));
        btn.classList.add("badge-fill");

        if (status === "not-okay") {
            if (remarksField) remarksField.style.display = "block";
        } else {
            if (remarksField) remarksField.style.display = "none";
        }
    },

    // Save cycle submissions (loop save to Dataverse)
    saveSession: async function (cycleNum, isPause = false) {
        const category = CCP_OPRP_Main.state.category;
        const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
        
        const productName = infoWrapper.dataset.product;
        const executiveName = infoWrapper.dataset.executive;
        const location = infoWrapper.dataset.location;
        const time = infoWrapper.dataset.time;
        const responseVal = infoWrapper.dataset.response;

        const tourId = CCP_OPRP_Main.state.varTourID;
        const shift = sessionStorage.getItem("shiftValue") || "Shift-1";
        
        let records = [];

        ShowLoader();

        try {
            if (category === "CCP") {
                const paneElements = document.querySelectorAll(`#tabs-panes-${cycleNum} .tab-pane-content`);
                
                paneElements.forEach(pane => {
                    const checkpointName = pane.dataset.checkpoint;
                    const rows = pane.querySelectorAll(".checkpoint-inner-row");

                    rows.forEach((row, rowIdx) => {
                        const checkRows = row.querySelectorAll(".checkpoint-check-row");
                        
                        checkRows.forEach(check => {
                            const key = check.dataset.key;
                            const labelEl = check.querySelector(".check-label");
                            const label = labelEl ? labelEl.innerText.replace(":", "").trim() : key;
                            const isNotOkay = check.querySelector('[data-status="not-okay"]').classList.contains("badge-fill");
                            
                            let value = "OK";
                            let remarks = "";
                            let action = "";
                            
                            if (isNotOkay) {
                                remarks = check.querySelector(".check-remarks-input")?.value || "No remarks";
                                value = "Not Okay";
                            }

                            let checkRecord = {
                                "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                                "cr3ea_title": `OPRP_CCP_${moment().format("DD-MM-YYYY")}_Line${location}_Cycle-${cycleNum}`,
                                "cr3ea_cycle": `Cycle-${cycleNum}`,
                                "cr3ea_shift": shift,
                                "cr3ea_tourstartdate": moment().format("MM-DD-YYYY"),
                                "cr3ea_observedby": CCP_OPRP_Main.state.qaExecutive,
                                "cr3ea_location": location,
                                "cr3ea_productname": productName,
                                "cr3ea_category": checkpointName.includes("CCP") ? "CCP" : "OPRP",
                                "cr3ea_checkpointname": `${checkpointName} - Row ${rowIdx + 1} - ${label}`,
                                "cr3ea_acceptanceresponse": value
                            };

                            if (isNotOkay) {
                                checkRecord.cr3ea_defectremarks = remarks;
                                checkRecord.cr3ea_actiontaken = "";
                                checkRecord.cr3ea_notifieddepartment = "Production";
                                checkRecord.cr3ea_deviationstatus = "New";
                            }

                            if (key === "mdsensitivity") {
                                const sensVal = check.querySelector(".check-val-input")?.value || "N/A";
                                checkRecord.cr3ea_acceptanceresponse = `${value} (${sensVal})`;
                            }

                            records.push(checkRecord);
                        });
                    });
                });
            } else {
                // Sieves & Magnets mapping
                const sieveRows = document.querySelectorAll(`#tabs-panes-${cycleNum} .sieve-item-row`);
                
                sieveRows.forEach(row => {
                    const desc = row.dataset.description;
                    const isNotOkay = row.querySelector('[data-status="not-okay"]').classList.contains("badge-fill");
                    const remarks = isNotOkay ? (row.querySelector(".defect-remarks-field input")?.value || "No remarks") : "";

                    const record = {
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                        "cr3ea_title": `Sieves_${moment().format("DD-MM-YYYY")}_Cycle-${cycleNum}`,
                        "cr3ea_cycle": `Cycle-${cycleNum}`,
                        "cr3ea_criteria": isNotOkay ? "Not Okay" : "Okay",
                        "cr3ea_description": desc,
                        "cr3ea_defectremarks": remarks,
                        "cr3ea_frequency": CCP_OPRP_Main.state.frequency
                    };

                    records.push(record);
                });
            }

            // If the user requested to pause, append the Metadata Initialization record to preserve checklist filling state
            if (isPause) {
                let initRecord = {};
                if (category === "CCP") {
                    initRecord = {
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                        "cr3ea_title": `OPRP_CCP_${moment().format("DD-MM-YYYY")}_Line${location}_Cycle-${cycleNum}_INIT`,
                        "cr3ea_cycle": `Cycle-${cycleNum}`,
                        "cr3ea_shift": shift,
                        "cr3ea_tourstartdate": moment().format("MM-DD-YYYY"),
                        "cr3ea_observedby": CCP_OPRP_Main.state.qaExecutive,
                        "cr3ea_location": location,
                        "cr3ea_productname": productName,
                        "cr3ea_category": "CCP",
                        "cr3ea_checkpointname": "Metadata Initialization",
                        "cr3ea_acceptanceresponse": "In Progress"
                    };
                } else {
                    initRecord = {
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                        "cr3ea_title": `Sieves_${moment().format("DD-MM-YYYY")}_Cycle-${cycleNum}_INIT`,
                        "cr3ea_cycle": `Cycle-${cycleNum}`,
                        "cr3ea_frequency": CCP_OPRP_Main.state.frequency,
                        "cr3ea_description": "Metadata Initialization",
                        "cr3ea_criteria": "In Progress"
                    };
                }
                records.push(initRecord);
            }

            console.log("Submitting checklist records to Dataverse: ", records);

            // Sequentially write records to child table
            const total = records.length;
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, isPause ? "Pausing checklist..." : "Submitting checklist...");
            }

            // Cleanup old rows before rewriting (pauses/resumes support)
            await CCP_OPRP_DAL.cleanChecklistItems(tourId, category, cycleNum);

            for (let i = 0; i < total; i++) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, isPause ? `Saving progress... (${i + 1} of ${total})` : `Saving checks... (${i + 1} of ${total})`);
                }
                const saved = await CCP_OPRP_DAL.saveChecklistItem(records[i], category);
                
                // Dispatch notification for deviations (only when final submitting, not on pause)
                if (!isPause && records[i].cr3ea_deviationstatus === "New") {
                    await CCP_OPRP_Workflow.notifyProductionDepartment(saved);
                }
            }

            alert(isPause ? "Progress paused and saved successfully." : "Cycle session saved successfully.");
            
            // Reload page to display completed summary panel and prepare next cycle
            await CCP_OPRP_Main.init();
            HideLoader();

        } catch (err) {
            HideLoader();
            console.error("Save session failed: ", err);
            alert("Failed to save checklists: " + err.message);
        }
    },

    // Save cycle when closed (Line/Plant Not Operational)
    saveShutdownSession: async function (cycleNum, startData) {
        ShowLoader();
        const tourId = CCP_OPRP_Main.state.varTourID;
        const shift = sessionStorage.getItem("shiftValue") || "Shift-1";

        try {
            const shutdownRecord = {
                "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${tourId})`,
                "cr3ea_title": `OPRP_CCP_${moment().format("DD-MM-YYYY")}_Line${startData.location}_Cycle-${cycleNum}_SHUTDOWN`,
                "cr3ea_cycle": `Cycle-${cycleNum}`,
                "cr3ea_shift": shift,
                "cr3ea_tourstartdate": moment().format("MM-DD-YYYY"),
                "cr3ea_observedby": CCP_OPRP_Main.state.qaExecutive,
                "cr3ea_location": startData.location,
                "cr3ea_productname": "Shutdown",
                "cr3ea_category": "OPRP",
                "cr3ea_checkpointname": "Shutdown Closure",
                "cr3ea_acceptanceresponse": startData.response,
                "cr3ea_defectremarks": startData.reason
            };

            await CCP_OPRP_DAL.saveChecklistItem(shutdownRecord, "CCP");
            alert("Shutdown/Closure logged successfully.");
            await CCP_OPRP_Main.init();
            HideLoader();
        } catch (err) {
            HideLoader();
            console.error("Failed to log shutdown: ", err);
            alert("Shutdown log failed: " + err.message);
        }
    },

    // Generates Summary view for saved Cycles
    generateSummaryTable: function (cycleData) {
        const isCCP = CCP_OPRP_Main.state.category === "CCP";

        if (isCCP) {
            // Check if this was a shutdown cycle
            const shutdownRow = (cycleData.rows || []).find(r => r.cr3ea_checkpointname === "Shutdown Closure");
            if (shutdownRow) {
                return `
                    <div style="padding: 12px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; color: #991b1b; font-size: 13px; font-weight: 500; margin-top: 10px;">
                        ⚠️ <strong>Closure Status:</strong> ${shutdownRow.cr3ea_acceptanceresponse || "Not Operational"}<br/>
                        <strong>Reason:</strong> ${shutdownRow.cr3ea_defectremarks || "Not provided"}
                    </div>
                `;
            }

            // Group flat subcheck records by parent checkpoint name and row index
            const checkpointsMap = {};

            (cycleData.rows || []).forEach(row => {
                const fullName = row.cr3ea_checkpointname || "";
                const parts = fullName.split(" - ");
                const parentName = parts[0] || "Unknown Checkpoint";
                
                let mapKey = parentName;
                let subLabel = "";
                
                if (parts[1] && parts[1].startsWith("Row ")) {
                    mapKey = `${parentName} - ${parts[1]}`;
                    subLabel = parts.slice(2).join(" - ");
                } else {
                    mapKey = `${parentName} - Row 1`;
                    subLabel = parts.slice(1).join(" - ");
                }

                if (!checkpointsMap[mapKey]) {
                    checkpointsMap[mapKey] = {
                        name: mapKey,
                        fecentrepass1: "OK",
                        fecentrepass2: "OK",
                        nfecentrepass1: "OK",
                        nfecentrepass2: "OK",
                        sscentrepass1: "OK",
                        sscentrepass2: "OK",
                        mdsensitivity: "OK",
                        mdsensitivityvalue: "N/A"
                    };
                }

                let val = row.cr3ea_acceptanceresponse || "OK";
                // If deviation has been verified and closed by QA, display it as "OK" (Resolved)
                if (row.cr3ea_deviationstatus === "Closed") {
                    val = "OK";
                }
                const labelLower = subLabel.toLowerCase();
                
                if ((labelLower.includes("fe") && !labelLower.includes("nfe") && labelLower.includes("1st")) || labelLower === "fecentrepass1") {
                    checkpointsMap[mapKey].fecentrepass1 = val;
                } else if ((labelLower.includes("fe") && !labelLower.includes("nfe") && labelLower.includes("2nd")) || labelLower === "fecentrepass2") {
                    checkpointsMap[mapKey].fecentrepass2 = val;
                } else if ((labelLower.includes("nfe") && labelLower.includes("1st")) || labelLower === "nfecentrepass1") {
                    checkpointsMap[mapKey].nfecentrepass1 = val;
                } else if ((labelLower.includes("nfe") && labelLower.includes("2nd")) || labelLower === "nfecentrepass2") {
                    checkpointsMap[mapKey].nfecentrepass2 = val;
                } else if ((labelLower.includes("ss") && labelLower.includes("1st")) || labelLower === "sscentrepass1") {
                    checkpointsMap[mapKey].sscentrepass1 = val;
                } else if ((labelLower.includes("ss") && labelLower.includes("2nd")) || labelLower === "sscentrepass2") {
                    checkpointsMap[mapKey].sscentrepass2 = val;
                } else if (labelLower.includes("md") || labelLower.includes("sensitivity") || labelLower === "mdsensitivity") {
                    if (val.includes("(")) {
                        const match = val.match(/\(([^)]+)\)/);
                        checkpointsMap[mapKey].mdsensitivity = val.split(" ")[0];
                        checkpointsMap[mapKey].mdsensitivityvalue = match ? match[1] : "N/A";
                    } else {
                        checkpointsMap[mapKey].mdsensitivity = val;
                    }
                }
            });

            const collapsedRows = Object.values(checkpointsMap);

            return `
                <div class="bs-table-container">
                    <table class="bs-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #cbd5e1;">
                                <th style="border: 1px solid #94a3b8; padding: 6px;">Checkpoint</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">FE-1</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">FE-2</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">NFE-1</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">NFE-2</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">SS-1</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">SS-2</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">MD Sens</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${collapsedRows.map(row => `
                                <tr>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px;"><strong>${row.name}</strong></td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.fecentrepass1?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.fecentrepass1 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.fecentrepass2?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.fecentrepass2 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.nfecentrepass1?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.nfecentrepass1 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.nfecentrepass2?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.nfecentrepass2 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.sscentrepass1?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.sscentrepass1 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.sscentrepass2?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.sscentrepass2 || "OK"}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${row.mdsensitivity?.includes('Not Okay') ? 'not-ok-text' : 'ok-text'}">${row.mdsensitivityvalue && row.mdsensitivityvalue !== "N/A" ? row.mdsensitivityvalue : (row.mdsensitivity || "OK")}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            // Sieve summary Table
            return `
                <div class="bs-table-container">
                    <table class="bs-table" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: #cbd5e1;">
                                <th style="border: 1px solid #94a3b8; padding: 6px;">Sieve Description</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">Status</th>
                                <th style="border: 1px solid #94a3b8; padding: 6px;">Defect Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${cycleData.rows.map(row => {
                                const isClosed = row.cr3ea_deviationstatus === "Closed";
                                const displayCriteria = isClosed ? "Okay" : (row.cr3ea_criteria || "Okay");
                                return `
                                <tr>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px;">${row.cr3ea_description}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;" class="${displayCriteria === 'Not Okay' ? 'not-ok-text' : 'ok-text'}"><strong>${displayCriteria}</strong></td>
                                    <td style="border: 1px solid #cbd5e1; padding: 6px;">${row.cr3ea_defectremarks || "-"}</td>
                                </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            `;
        }
    },

    generateDeviationWorkflowUI: function (cycleNum, cycleData) {
        const status = this.getCycleStatus(cycleData);
        if (status === "Completed" || status === "Not Operational" || status === "Upcoming" || status === "Metadata Setup" || status === "Checklist Filling") {
            return "";
        }

        const rows = cycleData.rows || [];
        const isCCP = CCP_OPRP_Main.state.category === "CCP";
        const idField = isCCP ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";

        const deviations = rows.filter(r => {
            const resp = isCCP ? r.cr3ea_acceptanceresponse : r.cr3ea_criteria;
            return resp === "Not Okay" || (resp && resp.includes("Not Okay"));
        });

        if (deviations.length === 0) return "";

        let html = `
            <div class="deviation-workflow-panel" style="margin-top: 24px; padding: 20px; border: 1px solid #fee2e2; border-left: 4px solid #ea580c; background: #fffcfb; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                <h5 style="margin-top: 0; margin-bottom: 18px; color: #ea580c; font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; font-family: 'Outfit', 'Inter', sans-serif;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #ea580c;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Quality Deviation Registered
                </h5>
        `;

        const canEditAction = CCP_OPRP_Main.state.canEditCorrectiveAction && status === "Pending Production Action";
        const canVerify = CCP_OPRP_Main.state.canEditChecklist && status === "Pending QA Re-Verification";

        deviations.forEach((dev, idx) => {
            const checkName = isCCP ? dev.cr3ea_checkpointname : dev.cr3ea_description;
            const idVal = dev[idField];
            const rawRemarks = dev.cr3ea_defectremarks || "";
            const remarksParts = rawRemarks.split(" | Re-verified: ");
            const baseRemark = remarksParts[0] || "";
            
            // Format checkpoint name details
            const nameParts = checkName.split(" - ");
            const tabName = nameParts[0] || "";
            let testName = nameParts.slice(1).join(" - ");

            // Apply fallbacks for older raw database keys
            if (testName === "sscentrepass1") testName = "SS - Centre 1st Pass";
            else if (testName === "sscentrepass2") testName = "SS - Centre 2nd Pass";
            else if (testName === "fecentrepass1") testName = "FE - Centre 1st Pass";
            else if (testName === "fecentrepass2") testName = "FE - Centre 2nd Pass";
            else if (testName === "nfecentrepass1") testName = "NFE - Centre 1st Pass";
            else if (testName === "nfecentrepass2") testName = "NFE - Centre 2nd Pass";
            else if (testName === "mdsensitivity") testName = "MD Sensitivity Check";

            // Determine check category/group title
            let groupTitle = "";
            if (testName.toLowerCase().startsWith("fe")) {
                groupTitle = "FE (Ferrous) Check";
            } else if (testName.toLowerCase().startsWith("nfe")) {
                groupTitle = "NFE (Non-Ferrous) Check";
            } else if (testName.toLowerCase().startsWith("ss")) {
                groupTitle = "SS (Stainless Steel) Check";
            } else if (testName.toLowerCase().includes("md") || testName.toLowerCase().includes("sensitivity")) {
                groupTitle = "M.D. Sensitivity Check";
            } else {
                groupTitle = "Checklist Parameter Check";
            }

            html += `
                <div class="deviation-item" data-id="${idVal}" data-remarks="${baseRemark}" style="background: #ffffff; border: 1px solid #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">
                        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">${tabName}</span>
                        <span style="font-size: 12px; font-weight: 700; color: #ea580c; font-family: 'Outfit', sans-serif;">${groupTitle}</span>
                    </div>
                    <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></span>
                        ${testName}
                    </div>
                    <div style="font-size: 13px; margin-bottom: 14px; background: #fff5f5; padding: 10px 14px; border-radius: 6px; border: 1px solid #fee2e2; display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #ef4444; font-weight: 800; letter-spacing: 0.5px;">QA Remarks</span>
                        <span style="color: #b91c1c; font-weight: 500; font-family: 'Inter', sans-serif;">${baseRemark}</span>
                    </div>
            `;

            if (status === "Pending Production Action") {
                if (canEditAction) {
                    html += `
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Corrective Action Plan (Production)</label>
                            <input type="text" class="form-control deviation-action-input" placeholder="Describe corrective action taken..." style="height: 38px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; width: 100%; box-sizing: border-box; transition: all 0.2s;" />
                        </div>
                    `;
                } else {
                    html += `
                        <div style="font-size: 13px; color: #94a3b8; font-style: italic;">Awaiting Production Incharge to enter Action Plan.</div>
                    `;
                }
            } else {
                // Pending Re-verification, closed, or escalated
                html += `
                    <div style="font-size: 13px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
                        <span style="font-size: 10px; text-transform: uppercase; color: #16a34a; font-weight: 800; letter-spacing: 0.5px;">Action Plan Taken</span>
                        <span style="color: #15803d; font-weight: 600; font-family: 'Inter', sans-serif;">${dev.cr3ea_actiontaken || "No action described"}</span>
                    </div>
                `;

                if (status === "Pending QA Re-Verification") {
                    if (canVerify) {
                        html += `
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Re-verification Comment (QA)</label>
                                <input type="text" class="form-control deviation-verify-input" placeholder="Enter verification comments..." style="height: 38px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; width: 100%; box-sizing: border-box; transition: all 0.2s;" />
                            </div>
                        `;
                    } else {
                        html += `
                            <div style="font-size: 13px; color: #94a3b8; font-style: italic;">Awaiting QA Executive to verify corrective actions.</div>
                        `;
                    }
                } else {
                    const closureComments = remarksParts[1] || "Closed";
                    html += `
                        <div style="font-size: 13px; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 800; letter-spacing: 0.5px;">QA Closure Comments</span>
                            <span style="color: #334155; font-weight: 600; font-family: 'Inter', sans-serif;">${closureComments}</span>
                        </div>
                    `;
                }
            }

            html += `</div>`;
        });

        if (status === "Pending Production Action" && canEditAction) {
            html += `
                <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button type="button" class="bs-btn bs-btn-primary btn-sm" style="padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px;" onclick="CCP_OPRP_Checklist.submitCorrectiveActions(${cycleNum})">Submit Corrective Actions</button>
                </div>
            `;
        } else if (status === "Pending QA Re-Verification" && canVerify) {
            html += `
                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
                    <button type="button" class="bs-btn bs-btn-outline-primary btn-sm" style="padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px;" onclick="CCP_OPRP_Checklist.submitQAClosure(${cycleNum}, false)">Reject Actions</button>
                    <button type="button" class="bs-btn bs-btn-primary btn-sm" style="padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px;" onclick="CCP_OPRP_Checklist.submitQAClosure(${cycleNum}, true)">Approve & Close Cycle</button>
                </div>
            `;
        }

        html += `</div>`;
        return html;
    },

    submitCorrectiveActions: async function (cycleNum) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        const deviationItems = panel.querySelectorAll(".deviation-item");
        const category = CCP_OPRP_Main.state.category;

        const total = deviationItems.length;
        if (total === 0) return;

        if (typeof ShowProgressLoader === "function") {
            ShowProgressLoader(0, "Submitting corrective actions...");
        } else {
            ShowLoader();
        }

        try {
            let i = 0;
            for (const item of deviationItems) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting corrective action (${i + 1} of ${total})...`);
                }

                const guid = item.dataset.id;
                const actionInput = item.querySelector(".deviation-action-input");
                if (actionInput) {
                    const actionVal = actionInput.value;
                    if (!actionVal) {
                        alert("Please specify the action taken plan for all deviations.");
                        HideLoader();
                        return;
                    }
                    
                    const payload = {
                        cr3ea_actiontaken: actionVal,
                        cr3ea_deviationstatus: "Action Taken"
                    };

                    const idField = category === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
                    payload[idField] = guid;

                    await CCP_OPRP_DAL.saveChecklistItem(payload, category);
                }
                i++;
            }

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing corrective actions...");
            }
            alert("Corrective actions submitted successfully.");
            await CCP_OPRP_Main.init();
            HideLoader();
        } catch (err) {
            HideLoader();
            console.error("Failed to submit corrective action: ", err);
            alert("Failed to submit corrective action plan: " + err.message);
        }
    },

    submitQAClosure: async function (cycleNum, isApproved) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        const deviationItems = panel.querySelectorAll(".deviation-item");
        const category = CCP_OPRP_Main.state.category;

        const total = deviationItems.length;
        if (total === 0) return;

        if (typeof ShowProgressLoader === "function") {
            ShowProgressLoader(0, isApproved ? "Closing cycle..." : "Rejecting actions...");
        } else {
            ShowLoader();
        }

        try {
            let i = 0;
            for (const item of deviationItems) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, isApproved ? `Approving closures (${i + 1} of ${total})...` : `Rejecting corrective actions (${i + 1} of ${total})...`);
                }

                const guid = item.dataset.id;
                const verifyInput = item.querySelector(".deviation-verify-input");
                const commentVal = verifyInput ? verifyInput.value : "";
                const baseRemark = item.dataset.remarks || "";
                
                const verifyComment = commentVal || (isApproved ? "Approved & Closed" : "Corrective Action Rejected");
                const finalRemarks = `${baseRemark} | Re-verified: ${verifyComment}`;

                const payload = {
                    cr3ea_deviationstatus: isApproved ? "Closed" : "Pending Action",
                    cr3ea_defectremarks: finalRemarks
                };

                const idField = category === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
                payload[idField] = guid;

                await CCP_OPRP_DAL.saveChecklistItem(payload, category);
                i++;
            }

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing closure...");
            }
            alert(isApproved ? "Cycle closed successfully." : "Corrective action rejected. Cycle returned to production.");
            await CCP_OPRP_Main.init();
            HideLoader();
        } catch (err) {
            HideLoader();
            console.error("Failed to submit QA closure: ", err);
            alert("Failed to submit QA closure: " + err.message);
        }
    },

    completeTour: async function () {
        if (!CCP_OPRP_Main.state.varTourID) {
            alert("No active tour found to complete.");
            return;
        }

        const isQA = CCP_OPRP_Main.state.canEditChecklist;
        if (!isQA) {
            alert("Only the assigned QA Executive can complete this tour.");
            return;
        }

        const confirmComplete = confirm("Are you sure you want to complete this Quality Tour? This will lock the tour from further edits.");
        if (!confirmComplete) return;

        ShowLoader();
        try {
            const category = CCP_OPRP_Main.state.category;
            const items = await CCP_OPRP_DAL.getChecklistItems(CCP_OPRP_Main.state.varTourID, category);
            
            const isCCP = category === "CCP";

            // Check for unresolved deviations
            const unresolvedDeviations = items.filter(item => {
                const resp = isCCP ? item.cr3ea_acceptanceresponse : item.cr3ea_criteria;
                const isNotOkay = resp === "Not Okay" || (resp && resp.includes("Not Okay"));
                return isNotOkay && item.cr3ea_deviationstatus !== "Closed";
            });

            if (unresolvedDeviations.length > 0) {
                HideLoader();
                const cycleList = [...new Set(unresolvedDeviations.map(d => d.cr3ea_cycle || "Cycle-1"))].sort();
                alert(`Cannot complete the tour. The following cycles have unresolved deviations or pending QA re-verifications: ${cycleList.join(", ")}.\n\nPlease resolve all quality deviations before completing the tour.`);
                return;
            }

            // Mark parent tour as Completed
            const payload = {
                cr3ea_prod_rajpura_quality_tourid: CCP_OPRP_Main.state.varTourID,
                cr3ea_status: "Completed",
                cr3ea_processstatus: "Completed",
                cr3ea_tourcompletiondate: new Date().toISOString()
            };

            await CCP_OPRP_DAL.saveTourSession(payload);
            HideLoader();
            alert("Quality Tour completed and locked successfully!");
            
            // Redirect back to Home Dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
            window.location.href = homeUrl;

        } catch (err) {
            HideLoader();
            console.error("Failed to complete tour: ", err);
            alert("Failed to complete tour: " + err.message);
        }
    }
};
