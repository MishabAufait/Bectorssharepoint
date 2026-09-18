// Checklist UI Controller for Rajpura Mixing & Baking Form
console.log("Mixing & Baking Checklist Controller loaded");

const MixingBaking_Validator = {
    highlight: function (element, isInvalid) {
        if (!element) return;
        if (isInvalid) {
            element.style.borderColor = "#ef4444";
            element.style.boxShadow = "0 0 0 0.2rem rgba(239, 68, 68, 0.25)";
        } else {
            element.style.borderColor = "";
            element.style.boxShadow = "";
        }
    },
    clearAll: function (cycleNum) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        if (!panel) return;
        const inputs = panel.querySelectorAll("input, select, textarea");
        inputs.forEach(el => this.highlight(el, false));
    }
};

const MixingBaking_Checklist = {
    // Maps cycle number to attachment files selected for upload
    selectedFiles: {},

    resolveUserName: function(emailOrName) {
        if (!emailOrName) return "";
        if (!emailOrName.includes("@")) return emailOrName;
        if (typeof MixingBaking_Main !== "undefined" && MixingBaking_Main.state && MixingBaking_Main.state.usersConfig) {
            const list = [...(MixingBaking_Main.state.usersConfig.qaUsers || []), ...(MixingBaking_Main.state.usersConfig.prodUsers || [])];
            const match = list.find(u => u.EMail && u.EMail.toLowerCase() === emailOrName.toLowerCase());
            if (match) return match.Title;
        }
        const clean = emailOrName.split("@")[0].trim();
        return clean.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    },

    // ========================================================
    // SCREEN 1: CHECKLIST INFORMATION (SETUP FORM) METHODS
    // ========================================================

    initChecklistInfoForm: function () {
        console.log("Initializing Checklist Information Form...");
        const state = MixingBaking_Main.state;

        // Date
        const dateInput = document.getElementById("info-date-input");
        if (dateInput) {
            dateInput.value = moment().format("DD/MM/YYYY");
        }

        // Site select
        const siteSelect = $("#info-site-select");
        if (siteSelect.length) {
            siteSelect.val(state.site || "Rajpura");
        }

        // Line select based on site
        this.onInfoSiteChange();
        const lineSelect = $("#info-line-select");
        if (lineSelect.length && state.line) {
            lineSelect.val(state.line);
        }

        // Product select (from recipes)
        const productSelect = $("#info-product-select");
        if (productSelect.length) {
            productSelect.empty().append('<option value="">Select Product</option>');
            const recipesList = (state.recipes && state.recipes.length > 0)
                ? state.recipes
                : ((typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA)) ? MB_RECIPES_SEED_DATA : []);

            const activeRecipes = recipesList.filter(r => r.isActive !== false);
            activeRecipes.forEach(r => {
                const isSelected = (state.product && (state.product.toLowerCase().trim() === r.title.toLowerCase().trim())) ? 'selected' : '';
                productSelect.append(`<option value="${r.title}" ${isSelected}>${r.title}</option>`);
            });
        }

        // QA Executive select
        const qaSelect = $("#info-qa-select");
        if (qaSelect.length) {
            qaSelect.empty().append('<option value="">Select QA Executive</option>');
            if (state.usersConfig && state.usersConfig.qaUsers) {
                const myEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? _spPageContextInfo.userEmail.toLowerCase().trim() : "";
                const myName = (typeof currentUser !== "undefined" && currentUser) ? currentUser.toLowerCase().trim() : "";

                state.usersConfig.qaUsers.forEach(u => {
                    let selected = '';
                    if (state.qaExecutive) {
                        selected = (u.EMail && u.EMail.toLowerCase() === state.qaExecutive.toLowerCase()) || (u.Title && u.Title.toLowerCase() === state.qaExecutive.toLowerCase()) ? 'selected' : '';
                    } else if (state.isQaUser) {
                        if ((u.EMail && myEmail && u.EMail.toLowerCase() === myEmail) || (u.Title && myName && u.Title.toLowerCase() === myName)) {
                            selected = 'selected';
                        }
                    }
                    qaSelect.append(`<option value="${u.EMail || u.Title}" ${selected}>${u.Title}</option>`);
                });
            }
        }

        // Production Executive select
        const prodSelect = $("#info-prod-select");
        if (prodSelect.length) {
            prodSelect.empty().append('<option value="">Select Production Executive</option>');
            if (state.usersConfig && state.usersConfig.prodUsers) {
                state.usersConfig.prodUsers.forEach(u => {
                    const selected = (state.productionIncharge && ((u.EMail && u.EMail.toLowerCase() === state.productionIncharge.toLowerCase()) || (u.Title && u.Title.toLowerCase() === state.productionIncharge.toLowerCase()))) ? 'selected' : '';
                    prodSelect.append(`<option value="${u.EMail || u.Title}" ${selected}>${u.Title}</option>`);
                });
            }
        }

        // Shift Executive (logged-in user who starts the tour - read-only)
        const shiftExecInput = document.getElementById("info-shift-exec");
        if (shiftExecInput) {
            const shiftExec = (state.tourData && (state.tourData.cr3ea_observedby || state.tourData.cr3ea_shiftexecutive)) 
                ? (state.tourData.cr3ea_observedby || state.tourData.cr3ea_shiftexecutive)
                : ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName 
                : (typeof EmployeeName !== 'undefined' && EmployeeName ? EmployeeName : (typeof currentUser !== "undefined" ? currentUser : (typeof UserName !== 'undefined' ? UserName : "Shift Executive"))));
            shiftExecInput.value = this.resolveUserName(shiftExec);
        }

        // Batch input
        const batchInput = document.getElementById("info-batch-input");
        if (batchInput) {
            batchInput.value = state.batchNo || "";
        }

        // Initialize Select2 on dropdowns safely if library is available
        if (typeof $ !== "undefined" && $.fn && $.fn.select2) {
            $("#info-site-select, #info-line-select, #info-qa-select, #info-prod-select").select2({
                minimumResultsForSearch: -1,
                dropdownAutoWidth: false,
                width: '100%'
            });

            $("#info-product-select").select2({
                dropdownAutoWidth: false,
                width: '100%'
            });
        }

        // Enforce read-only if not QA
        if (!state.canEditChecklist) {
            $("#info-site-select, #info-line-select, #info-product-select, #info-qa-select, #info-prod-select").prop('disabled', true);
            if (batchInput) batchInput.disabled = true;
        }
    },

    onInfoSiteChange: function () {
        const site = $("#info-site-select").val() || document.getElementById("info-site-select")?.value || "Rajpura";
        const lineSelect = $("#info-line-select");
        if (!lineSelect.length) return;

        const currentVal = lineSelect.val();
        let lines = [];
        if (site === "Rajpura") {
            lines = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5", "Line 6", "Line 7", "Line 8"];
        } else {
            lines = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"];
        }

        lineSelect.empty();
        lines.forEach(l => {
            lineSelect.append(`<option value="${l}">${l}</option>`);
        });

        if (currentVal && lines.includes(currentVal)) {
            lineSelect.val(currentVal);
        } else {
            lineSelect.val(lines[0]);
        }

        if (lineSelect.hasClass && lineSelect.hasClass("select2-hidden-accessible")) {
            lineSelect.trigger("change.select2");
            lineSelect.trigger("change");
        }
    },

    startSessionFromInfoForm: async function () {
        if (!MixingBaking_Main.state.canEditChecklist) {
            alert("Access Denied: Only the assigned QA Executive can start a checklist session.");
            return;
        }

        const siteEl = document.getElementById("info-site-select");
        const lineEl = document.getElementById("info-line-select");
        const productEl = document.getElementById("info-product-select");
        const qaEl = document.getElementById("info-qa-select");
        const prodEl = document.getElementById("info-prod-select");
        const shiftEl = document.getElementById("info-shift-exec");
        const batchEl = document.getElementById("info-batch-input");

        const site = $("#info-site-select").val() || siteEl?.value || "Rajpura";
        const line = $("#info-line-select").val() || lineEl?.value || "Line 1";
        const product = $("#info-product-select").val() || productEl?.value || "";
        const qa = $("#info-qa-select").val() || qaEl?.value || "";
        const prod = $("#info-prod-select").val() || prodEl?.value || "";
        const shiftExec = shiftEl?.value?.trim() || ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName : (typeof currentUser !== "undefined" ? currentUser : "Shift Executive"));
        const batchNo = batchEl?.value?.trim() || "";

        // Clear previous highlights
        [siteEl, lineEl, productEl, qaEl, prodEl, batchEl].forEach(el => MixingBaking_Validator.highlight(el, false));

        if (!site || !line || !product || !qa || !prod || !batchNo) {
            if (!site && siteEl) MixingBaking_Validator.highlight(siteEl, true);
            if (!line && lineEl) MixingBaking_Validator.highlight(lineEl, true);
            if (!product && productEl) MixingBaking_Validator.highlight(productEl, true);
            if (!qa && qaEl) MixingBaking_Validator.highlight(qaEl, true);
            if (!prod && prodEl) MixingBaking_Validator.highlight(prodEl, true);
            if (!batchNo && batchEl) MixingBaking_Validator.highlight(batchEl, true);
            alert("Please fill in all required fields:\n- Manufacturing Site\n- Line No\n- Product Name\n- QA Executive\n- Production Executive\n- Batch No");
            return;
        }

        ShowLoader();
        try {
            let generatedGUID = MixingBaking_Main.state.varTourID;
            const cleanLine = String(line).replace(/line\s*|-/gi, "").trim();
            const lineLabel = cleanLine ? `Line${cleanLine}` : "Line1";
            const plantId = (site === "Rajpura") ? QualityRajpura_Config.PLANT_ID : site;

            const parentPayload = {
                cr3ea_assigned_qa: qa,
                cr3ea_shiftexecutiveproduction: prod,
                cr3ea_observedby: shiftExec,
                cr3ea_status: "In Progress",
                cr3ea_shift: MixingBaking_Main.state.shift || sessionStorage.getItem("shiftValue") || "Shift-1",
                cr3ea_lineno: line,
                cr3ea_plantid: plantId,
                cr3ea_title: `MixingBaking_${lineLabel}_Tour_${moment().format('DD-MM-YYYY')}`,
                cr3ea_runningvariety: product,
                cr3ea_batchno: batchNo
            };

            if (generatedGUID) {
                await MixingBaking_DAL.updateParentTour(generatedGUID, parentPayload);
                console.log("Parent Tour updated successfully with Checklist Info:", generatedGUID);
            } else {
                // Check line override prompt
                const targetLine = line || MixingBaking_Main.state.line || "Line 1";
                const token = await MixingBaking_DAL.getAccessToken();
                const proceed = await QualityRajpura_Config.checkAndPromptLineOverride({
                    moduleKey: "MIXING_BAKING",
                    line: targetLine,
                    currentTourId: null,
                    token: token
                });
                if (!proceed) {
                    HideLoader();
                    return;
                }

                parentPayload.cr3ea_tourstartdate = new Date().toISOString();
                const savedTour = await MixingBaking_DAL.saveTourSession(parentPayload);
                generatedGUID = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                    ? QualityRajpura_Config.getTourId(savedTour)
                    : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));
                MixingBaking_Main.state.varTourID = generatedGUID;
                console.log("Parent Tour created successfully. GUID:", generatedGUID);

                if (generatedGUID) {
                    try {
                        const currentUrl = new URL(window.location.href);
                        currentUrl.searchParams.delete('action');
                        currentUrl.searchParams.set('TourId', generatedGUID);
                        window.history.replaceState({ tourId: generatedGUID }, '', currentUrl.toString());
                        if (window.parent && window.parent !== window && window.parent.location && window.parent.location.href) {
                            const parentUrl = new URL(window.parent.location.href);
                            parentUrl.searchParams.delete('action');
                            parentUrl.searchParams.set('TourId', generatedGUID);
                            window.parent.history.replaceState({ tourId: generatedGUID }, '', parentUrl.toString());
                        }
                    } catch (e) {}
                }
            }

            // Update local state
            MixingBaking_Main.state.site = site;
            MixingBaking_Main.state.line = line;
            MixingBaking_Main.state.product = product;
            MixingBaking_Main.state.qaExecutive = qa;
            MixingBaking_Main.state.productionIncharge = prod;
            MixingBaking_Main.state.observedBy = shiftExec;
            MixingBaking_Main.state.batchNo = batchNo;
            if (!MixingBaking_Main.state.tourData) MixingBaking_Main.state.tourData = {};
            MixingBaking_Main.state.tourData.cr3ea_runningvariety = product;
            MixingBaking_Main.state.tourData.cr3ea_batchno = batchNo;
            MixingBaking_Main.state.tourData.cr3ea_assigned_qa = qa;
            MixingBaking_Main.state.tourData.cr3ea_shiftexecutiveproduction = prod;
            MixingBaking_Main.state.tourData.cr3ea_observedby = shiftExec;

            // Switch screen: Hide Screen 1, Show Screen 2
            const screenInfo = document.getElementById("screen-checklist-info");
            const screenCycles = document.getElementById("screen-cycles-container");
            if (screenInfo) screenInfo.style.display = "none";
            if (screenCycles) screenCycles.style.display = "block";

            // Render Persistent Header Summary
            this.renderHeaderSummary();

            // Load Cycles History (creates Cycle 1 in checklist fill mode)
            await MixingBaking_Main.loadCyclesHistory();

            // Show complete tour button if QA
            const compContainer = document.getElementById("complete-tour-btn-container");
            if (compContainer && MixingBaking_Main.state.canEditChecklist) {
                compContainer.style.display = "flex";
            }
        } catch (err) {
            console.error("Failed to start session from info form:", err);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "start checklist session")
                : ("Failed to start session: " + err.message);
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // ========================================================
    // SCREEN 2: PERSISTENT HEADER SUMMARY & CYCLES CONTROLLER
    // ========================================================

    renderHeaderSummary: function () {
        const state = MixingBaking_Main.state;

        const elSite = document.getElementById("hdr-site");
        if (elSite) elSite.innerText = state.site || "Rajpura";

        const elLine = document.getElementById("hdr-line");
        if (elLine) elLine.innerText = state.line || "Line 1";

        const elProduct = document.getElementById("hdr-product");
        if (elProduct) elProduct.innerText = state.product || "-";

        const elQa = document.getElementById("hdr-qa");
        if (elQa) elQa.innerText = this.resolveUserName(state.qaExecutive || state.tourData?.cr3ea_assigned_qa || "-");

        const elProd = document.getElementById("hdr-prod");
        if (elProd) elProd.innerText = this.resolveUserName(state.productionIncharge || state.tourData?.cr3ea_shiftexecutiveproduction || "-");

        const elShiftExec = document.getElementById("hdr-shift-exec");
        if (elShiftExec) {
            const starter = state.tourData?.cr3ea_observedby || state.tourData?.cr3ea_shiftexecutive || state.observedBy || ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName : (typeof currentUser !== 'undefined' ? currentUser : "-"));
            elShiftExec.innerText = this.resolveUserName(starter);
        }

        const elBatch = document.getElementById("hdr-batch");
        if (elBatch) elBatch.innerText = state.batchNo || "-";

        const elShift = document.getElementById("hdr-shift");
        if (elShift) elShift.innerText = (state.shift || "Shift 1").replace("-", " ");

        const elDate = document.getElementById("hdr-date");
        if (elDate) {
            const rawDate = state.tourData ? (state.tourData.cr3ea_tourstartdate || state.tourData.createdon) : null;
            elDate.innerText = rawDate ? moment(rawDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY");
        }

        // Edit button visibility
        const editBtn = document.getElementById("mb-edit-info-btn");
        const isTourCompleted = state.tourData && (
            state.tourData.cr3ea_status === "Completed" || 
            state.tourData.cr3ea_status === "Success" || 
            state.tourData.cr3ea_status === "Closed" || 
            state.tourData.cr3ea_status === "Closed - Expired"
        );
        if (editBtn) {
            editBtn.style.display = (!state.canEditChecklist || isTourCompleted) ? "none" : "inline-flex";
        }
    },

    editChecklistInfo: function () {
        if (!MixingBaking_Main.state.canEditChecklist) {
            alert("Access Denied: Only the assigned QA Executive can edit Checklist Information.");
            return;
        }

        const screenInfo = document.getElementById("screen-checklist-info");
        const screenCycles = document.getElementById("screen-cycles-container");

        // Sync info form with current state
        this.initChecklistInfoForm();

        if (screenCycles) screenCycles.style.display = "none";
        if (screenInfo) {
            screenInfo.style.display = "block";
            screenInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    addNewCycle: function () {
        if (!MixingBaking_Main.state.canEditChecklist) {
            alert("Access Denied: Only the assigned QA Executive can add cycles.");
            return;
        }

        // Determine new cycle number
        MixingBaking_Main.state.cycleCounter = (MixingBaking_Main.state.cycleCounter || 1) + 1;
        const newCycleNum = MixingBaking_Main.state.cycleCounter;

        // Collapse all previous cycles
        document.querySelectorAll(".tour-cycle-panel").forEach(p => {
            p.classList.remove("bs-card-toggler-is-active");
            p.style.cssText = "height: 80px !important; overflow: hidden !important; display: block !important;";
            const body = p.querySelector(".bs-card-body");
            if (body) body.style.cssText = "max-height: 0px !important; height: 0px !important; overflow: hidden !important; display: block !important;";
        });

        // Hide add button while filling
        const addBtnContainer = document.getElementById("add-cycle-btn-container");
        if (addBtnContainer) addBtnContainer.style.display = "none";

        // Create the new active cycle
        this.createCycleSection(newCycleNum, false);

        // Scroll to the new cycle smoothly
        setTimeout(() => {
            const newEl = document.getElementById(`cycle-${newCycleNum}`);
            if (newEl) {
                newEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    },

    // 1. Create a cycle panel section (either active form or completed read-only card)
    createCycleSection: function (cycleNum, isCompleted = false, cycleData = null) {
        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (!parentElement) return;

        const newCycle = document.createElement("div");
        newCycle.classList.add("bs-card-toggler", "bs-card", "bs-card-secondary", "tour-cycle-panel");
        if (isCompleted) {
            newCycle.classList.add("completed-cycle");
        } else {
            newCycle.classList.add("bs-card-toggler-is-active");
        }
        newCycle.setAttribute("id", `cycle-${cycleNum}`);

        const initialBodyStyle = isCompleted
            ? "max-height: 0px !important; height: 0px !important; overflow: hidden !important; display: block !important;"
            : "max-height: none !important; height: auto !important; overflow: visible !important; display: block !important;";

        const status = isCompleted ? "Completed" : "In Progress";
        const badgeBg = isCompleted ? "#dcfce7" : "#fef3c7";
        const badgeColor = isCompleted ? "#16a34a" : "#d97706";

        let dateStr = "";
        if (isCompleted && cycleData) {
            const title = cycleData.cr3ea_title || cycleData.Title || "";
            const parts = title.split("_");
            let parsedDate = null;
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1];
                if (/^\d{2}-\d{2}-\d{4}$/.test(lastPart)) {
                    parsedDate = moment(lastPart, "DD-MM-YYYY");
                }
            }
            if (parsedDate && parsedDate.isValid()) {
                dateStr = parsedDate.format("DD/MM/YYYY");
            } else {
                const rawDate = cycleData.createdon || (MixingBaking_Main.state.tourData ? MixingBaking_Main.state.tourData.cr3ea_tourstartdate : null);
                dateStr = rawDate ? moment(rawDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY");
            }
        }

        const canEdit = MixingBaking_Main.state.canEditChecklist;
        const assignedQAName = this.resolveUserName(MixingBaking_Main.state.qaExecutive || MixingBaking_Main.state.tourData?.cr3ea_assigned_qa || "QA Executive");

        const readOnlyBannerHtml = (!isCompleted && !canEdit)
            ? `<div class="alert alert-warning" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; font-size: 13px;">
                <span style="font-weight: bold; font-size: 14px; background: #f59e0b; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">!</span>
                <span><strong>Read-Only Mode:</strong> You are viewing this checklist in read-only mode. Only the assigned QA Executive (${assignedQAName || "N/A"}) can edit or submit cycle data.</span>
            </div>`
            : '';

        const dateHtml = dateStr
            ? `<span class="tour-date" style="font-size: 13px; color: #64748b; font-weight: 500; margin-right: 10px;">${dateStr}</span>`
            : '';

        newCycle.innerHTML = `
            <div class="bs-card-header" onclick="MixingBaking_Checklist.togglePanel(${cycleNum})" style="display: flex; justify-content: space-between; align-items: center; width: 100%; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <h4 class="bs-card-title" style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">Cycle ${cycleNum}</h4>
                    <span class="badge cycle-status-badge" id="cycle-status-badge-${cycleNum}" style="background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${status}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                    ${dateHtml}
                    <button type="button" class="bs-btn icon-btn bs-card-toggler-btn" style="padding: 0; background: transparent; border: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3.66667 5.66666L8.33333 10.3333L13 5.66666" stroke="#0C0D10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="bs-card-body" style="${initialBodyStyle}">
                ${readOnlyBannerHtml}

                <!-- MAIN CHECKLIST FORM WITH 4 DETAILED TABS -->
                <div class="tour-cyle-step tour-cyle-step-form bs-fade-elem bs-fade-active bs-fade-in" id="checklist-form-${cycleNum}" style="display: ${isCompleted ? 'none' : 'block'};">
                    <div class="mb-tabs-container">
                        <!-- Navigation tabs -->
                        <div class="mb-tabs-nav">
                            <button type="button" class="mb-tab-btn active" onclick="MixingBaking_Checklist.switchTab(this, ${cycleNum}, 'ing-q-${cycleNum}')">1. Ingredient Quality</button>
                            <button type="button" class="mb-tab-btn" onclick="MixingBaking_Checklist.switchTab(this, ${cycleNum}, 'mat-q-${cycleNum}')">2. Material Quality</button>
                            <button type="button" class="mb-tab-btn" onclick="MixingBaking_Checklist.switchTab(this, ${cycleNum}, 'mix-f-${cycleNum}')">3. Mixing & Forming</button>
                            <button type="button" class="mb-tab-btn" onclick="MixingBaking_Checklist.switchTab(this, ${cycleNum}, 'bake-s-${cycleNum}')">4. Baking & Standards</button>
                        </div>

                        <!-- Tab contents -->
                        <div class="mb-tabs-content">
                            <!-- TAB 1: INGREDIENT QUALITY -->
                            <div class="mb-tab-pane active" id="ing-q-${cycleNum}">
                                <h4 class="mb-section-title">Ingredient Temperature Checks</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Ingredient</th>
                                                <th>Standard</th>
                                                <th>Observed</th>
                                                <th>Remarks</th>
                                                <th>Action Taken</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderIngRow(cycleNum, "RPO", "cr3ea_rpo")}
                                            ${this.renderIngRow(cycleNum, "Solid Fat", "cr3ea_solidfat")}
                                            ${this.renderIngRow(cycleNum, "Butter", "cr3ea_butter")}
                                            ${this.renderIngRow(cycleNum, "Blackjack (Initial)", "cr3ea_blackjack")}
                                            ${this.renderIngRow(cycleNum, "Sponge", "cr3ea_spongetemp")}
                                            ${this.renderIngRow(cycleNum, "Slurry", "cr3ea_slurry")}
                                            ${this.renderIngRow(cycleNum, "Ground Sugar Temp", "cr3ea_groundsugartemp")}
                                            ${this.renderIngRow(cycleNum, "Ground Sugar Particle", "cr3ea_groundsugarparticlesize")}
                                        </tbody>
                                    </table>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Minor Ingredients Checklist</h4>
                                <div class="minor-checklist-grid">
                                    ${this.renderMinorItem(cycleNum, "Cocoa Powder", "cr3ea_cocoapowderdone")}
                                    ${this.renderMinorItem(cycleNum, "SMP", "cr3ea_smpdone")}
                                    ${this.renderMinorItem(cycleNum, "Salt 1", "cr3ea_salt1done")}
                                    ${this.renderMinorItem(cycleNum, "ABC", "cr3ea_abcdone")}
                                    ${this.renderMinorItem(cycleNum, "SBC", "cr3ea_sbcdone")}
                                    ${this.renderMinorItem(cycleNum, "Salt 2", "cr3ea_salt2done")}
                                    ${this.renderMinorItem(cycleNum, "Others", "cr3ea_othersdone")}
                                </div>
                            </div>

                            <!-- TAB 2: MATERIAL QUALITY & SPONGE -->
                            <div class="mb-tab-pane" id="mat-q-${cycleNum}">
                                <h4 class="mb-section-title">Supplier & Custom Ingredients</h4>
                                <div class="supplier-section-grid">
                                    <div class="supplier-card">
                                        <h5>Choco Chips</h5>
                                        <div class="form-group"><label>Supplier</label><input type="text" class="form-control" id="cr3ea_chocochipssupplier-${cycleNum}" /></div>
                                        <div class="form-group"><label>Temperature</label><input type="text" class="form-control" id="cr3ea_chocochipstemp-${cycleNum}" /></div>
                                        <div class="form-group"><label>Count/kg</label><input type="text" class="form-control" id="cr3ea_chocochipscountperkg-${cycleNum}" /></div>
                                        <div class="form-group"><label>Mfg Date</label><input type="date" class="form-control" id="cr3ea_chocochipsmfgdate-${cycleNum}" /></div>
                                        <div class="form-group"><label>Compound/Pure</label><input type="text" class="form-control" id="cr3ea_chocochipscompoundorpure-${cycleNum}" /></div>
                                    </div>
                                    <div class="supplier-card">
                                        <h5>Cashew</h5>
                                        <div class="form-group"><label>Supplier</label><input type="text" class="form-control" id="cr3ea_cashewsupplier-${cycleNum}" /></div>
                                        <div class="form-group"><label>Temperature</label><input type="text" class="form-control" id="cr3ea_cashewtemp-${cycleNum}" /></div>
                                        <div class="form-group"><label>Count/kg</label><input type="text" class="form-control" id="cr3ea_cashewcountperkg-${cycleNum}" /></div>
                                        <div class="form-group"><label>Mfg Date</label><input type="date" class="form-control" id="cr3ea_cashewmfgdate-${cycleNum}" /></div>
                                        <div class="form-group"><label>Compound/Pure</label><input type="text" class="form-control" id="cr3ea_cashewcompoundorpure-${cycleNum}" /></div>
                                    </div>
                                </div>

                                <div class="form-grid-three" style="margin-top:20px;">
                                    <div class="form-group">
                                        <label>Flour Supplier</label>
                                        <input type="text" class="form-control" id="cr3ea_floursupplier-${cycleNum}" placeholder="Enter Supplier" />
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Syrup & Blackjack Checks</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Temperature</th>
                                                <th>pH</th>
                                                <th>Brix</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Invert Syrup</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_invertsyruptemp-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_invertsyrupph-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_invertsyrupbrix-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Blackjack (2nd Check)</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_blackjack2temp-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_blackjack2ph-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_blackjack2brix-${cycleNum}" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- TAB 3: MIXING & FORMING -->
                            <div class="mb-tab-pane" id="mix-f-${cycleNum}">
                                <h4 class="mb-section-title">Mixing - Sponge Process</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Product Name</label>
                                        <input type="text" class="form-control" id="cr3ea_spongeproductname-${cycleNum}" placeholder="Sponge Product" />
                                    </div>
                                    <div class="form-group">
                                        <label>Water Quantity (kg/L)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongewaterquantity-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Yeast Quantity (kg)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongeyeastquantity-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Water Temp</label>
                                        <input type="text" class="form-control" id="cr3ea_spongewatertemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Mixing Time (min)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongemixingtime-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Fermentation Start Temp</label>
                                        <input type="text" class="form-control" id="cr3ea_fermentationstarttemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Room Temp</label>
                                        <input type="text" class="form-control" id="cr3ea_fermentationroomtemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Final Temp After Fermentation</label>
                                        <input type="text" class="form-control" id="cr3ea_finaltempafterfermentation-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Final pH After Fermentation</label>
                                        <input type="text" class="form-control" id="cr3ea_finalphafterfermentation-${cycleNum}" />
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Mixing - Dough Process</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Standard</th>
                                                <th>Observed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderMixingDoughRow(cycleNum, "Creaming Time (min)", "cr3ea_creamingtime")}
                                            ${this.renderMixingDoughRow(cycleNum, "Mixing Time (min)", "cr3ea_mixingtime")}
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Temp", "cr3ea_doughtemp")}
                                            ${this.renderMixingDoughRow(cycleNum, "Jacket Temp", "cr3ea_jackettemp")}
                                            <tr>
                                                <td><strong>Dough Consistency</strong></td>
                                                <td colspan="2"><input type="text" class="form-control" id="cr3ea_doughconsistency-${cycleNum}" placeholder="Consistency details..." /></td>
                                            </tr>
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Standing Time (min)", "cr3ea_doughstandingtime")}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="form-group" style="margin-top:15px;">
                                    <label class="form-label">Type of Mixer</label>
                                    <div class="radio-group-inline">
                                        <label><input type="radio" name="cr3ea_typeofmixer-${cycleNum}" value="Vertical" checked /> Vertical</label>
                                        <label><input type="radio" name="cr3ea_typeofmixer-${cycleNum}" value="Horizontal" /> Horizontal</label>
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Forming & Moulding</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Moulding RPM / Strokes</label>
                                        <input type="text" class="form-control" id="cr3ea_moulderrpmstrokes-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Sample Count</label>
                                        <input type="text" class="form-control" id="cr3ea_formingsamplecount-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Standard Wet Weight</label>
                                        <input type="text" class="form-control" id="cr3ea_standardwetweight-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Observed Wet Weight</label>
                                        <input type="text" class="form-control" id="cr3ea_observedwetweight-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight Before Sugar Sprinkling</label>
                                        <input type="text" class="form-control" id="cr3ea_weightbeforesugarsprinkling-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight After Sugar Sprinkling</label>
                                        <input type="text" class="form-control" id="cr3ea_weightaftersugarsprinkling-${cycleNum}" />
                                    </div>
                                </div>
                            </div>

                            <!-- TAB 4: BAKING & STANDARDS -->
                            <div class="mb-tab-pane" id="bake-s-${cycleNum}">
                                <h4 class="mb-section-title">Baking Time & Profile</h4>
                                <div class="form-grid-three">
                                    <div class="form-group">
                                        <label>Baking Time (min)</label>
                                        <input type="text" class="form-control" id="cr3ea_bakingtime-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Baking Profile Taste</label>
                                        <input type="text" class="form-control" id="cr3ea_bakingprofiletaste-${cycleNum}" />
                                    </div>
                                    <div class="form-group checkbox-align">
                                        <label><input type="checkbox" id="cr3ea_bakingprofileaspertemplate-${cycleNum}" value="Yes" /> Profile As Per Template</label>
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Top Baking Temperatures (&deg;C)</h4>
                                <div class="zone-grid">
                                    ${this.renderZoneInputs(cycleNum, "top")}
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Bottom Baking Temperatures (&deg;C)</h4>
                                <div class="zone-grid">
                                    ${this.renderZoneInputs(cycleNum, "bottom")}
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">QC Physical Standards</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Biscuit Length (mm)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitlength-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Width (mm)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitwidth-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Diameter (mm)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitdiameter-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Standards Sample Count</label>
                                        <input type="text" class="form-control" id="cr3ea_standardssamplecount-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Std Weight (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitstdweight-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Observed Weight (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitobservedweight-${cycleNum}" />
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Quality & Moisture Parameters</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Standard</th>
                                                <th>Observed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Top Colour</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Bottom Colour</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Moisture %</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_moisturestandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_moistureobserved-${cycleNum}" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-footer" style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: ${canEdit ? 'flex' : 'none'}; justify-content: flex-end; gap: 15px;">
                        <button type="button" class="bs-btn bs-btn-primary" style="padding: 10px 24px; font-weight: 700; font-size: 14px; border-radius: 8px;" onclick="MixingBaking_Checklist.saveCycle(${cycleNum})">Submit Cycle Data</button>
                    </div>
                </div>

                <!-- COMPLETED CYCLE READ-ONLY DETAILS -->
                <div class="tour-cyle-step tour-cyle-step-completed" id="completed-step-${cycleNum}" style="display: ${isCompleted ? 'block' : 'none'};">
                    <!-- Populated dynamically via renderCompletedSection -->
                </div>
            </div>
        `;

        parentElement.appendChild(newCycle);

        if (isCompleted && cycleData) {
            this.renderCompletedSection(cycleNum, cycleData);
        } else {
            // Auto-populate standards directly from selected product
            this.populateStandardValues(cycleNum, MixingBaking_Main.state.product);
            this.bindSectionStatusTracker(cycleNum);
            this.updateSectionTabIndicators(cycleNum);

            // Enforce read-only disabled state on active cycle if user is not authorized QA
            if (!canEdit) {
                $(`#checklist-form-${cycleNum} input, #checklist-form-${cycleNum} select, #checklist-form-${cycleNum} textarea`).prop('disabled', true);
            }
        }
    },

    renderIngRow: function (cycleNum, label, baseName) {
        return `
            <tr>
                <td><strong>${label}</strong></td>
                <td><input type="text" class="form-control" id="${baseName}standard-${cycleNum}" placeholder="Std" /></td>
                <td><input type="text" class="form-control" id="${baseName}observed-${cycleNum}" placeholder="Obs" /></td>
                <td><input type="text" class="form-control" id="${baseName}remarks-${cycleNum}" placeholder="Remarks" /></td>
                <td><input type="text" class="form-control" id="${baseName}actiontaken-${cycleNum}" placeholder="Action" /></td>
            </tr>
        `;
    },

    renderMinorItem: function (cycleNum, label, schemaName) {
        return `
            <div class="minor-checklist-item">
                <label><input type="checkbox" id="${schemaName}-${cycleNum}" value="Done" /> ${label}</label>
            </div>
        `;
    },

    renderMixingDoughRow: function (cycleNum, label, baseName) {
        return `
            <tr>
                <td><strong>${label}</strong></td>
                <td><input type="text" class="form-control" id="${baseName}standard-${cycleNum}" /></td>
                <td><input type="text" class="form-control" id="${baseName}observed-${cycleNum}" /></td>
            </tr>
        `;
    },

    renderZoneInputs: function (cycleNum, level) {
        let html = '';
        for (let i = 1; i <= 7; i++) {
            html += `
                <div class="zone-input-group">
                    <label>Zone ${i}</label>
                    <input type="text" class="form-control" id="cr3ea_${level}bakingtempzone${i}-${cycleNum}" />
                </div>
            `;
        }
        html += `
            <div class="zone-input-group">
                <label>Product Temp</label>
                <input type="text" class="form-control" id="cr3ea_${level}producttempafterbaking-${cycleNum}" />
            </div>
        `;
        return html;
    },

    switchTab: function (btn, cycleNum, targetPaneId) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        if (!panel) return;

        panel.querySelectorAll(".mb-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        panel.querySelectorAll(".mb-tab-pane").forEach(p => p.classList.remove("active"));
        const pane = document.getElementById(targetPaneId);
        if (pane) pane.classList.add("active");
    },

    onFileSelected: function (input, cycleNum) {
        const file = input.files[0];
        const statusLabel = document.getElementById(`mb-file-status-${cycleNum}`);
        if (file) {
            this.selectedFiles[cycleNum] = file;
            statusLabel.innerText = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        } else {
            delete this.selectedFiles[cycleNum];
            statusLabel.innerText = "No file selected";
        }
        this.updateSectionTabIndicators(cycleNum);
    },

    // Checks whether a given tab pane has at least one field filled
    isSectionFilled: function (cycleNum, paneId) {
        const pane = document.getElementById(paneId);
        if (!pane) return false;

        const elements = pane.querySelectorAll("input, textarea, select");
        for (const el of elements) {
            if (el.type === "radio") {
                // Ignore pre-checked default radio (e.g. Type of Mixer "Vertical")
                continue;
            } else if (el.type === "checkbox") {
                if (el.checked) return true;
            } else if (el.type === "file") {
                if (el.files && el.files.length > 0) return true;
            } else if (el.type === "hidden") {
                continue;
            } else {
                const val = el.value ? el.value.trim() : "";
                if (val !== "") return true;
            }
        }
        return false;
    },

    // Validates that each of the four sections has at least one field filled
    validateFourSections: function (cycleNum) {
        const sections = [
            { id: `ing-q-${cycleNum}`, name: "1. Ingredient Quality" },
            { id: `mat-q-${cycleNum}`, name: "2. Material Quality" },
            { id: `mix-f-${cycleNum}`, name: "3. Mixing & Forming" },
            { id: `bake-s-${cycleNum}`, name: "4. Baking & Standards" }
        ];

        const missing = [];
        for (const sec of sections) {
            if (!this.isSectionFilled(cycleNum, sec.id)) {
                missing.push(sec);
            }
        }
        return missing;
    },

    // Updates tab buttons with checkmarks dynamically when section has data
    updateSectionTabIndicators: function (cycleNum) {
        const sections = [
            `ing-q-${cycleNum}`,
            `mat-q-${cycleNum}`,
            `mix-f-${cycleNum}`,
            `bake-s-${cycleNum}`
        ];

        const panel = document.getElementById(`cycle-${cycleNum}`);
        if (!panel) return;

        sections.forEach(paneId => {
            const isFilled = this.isSectionFilled(cycleNum, paneId);
            const btn = panel.querySelector(`.mb-tab-btn[onclick*="${paneId}"]`);
            if (btn) {
                if (isFilled) {
                    btn.classList.add("section-filled");
                } else {
                    btn.classList.remove("section-filled");
                }
            }
        });
    },

    // Binds input and change event listeners to update tab indicators in real-time
    bindSectionStatusTracker: function (cycleNum) {
        const formEl = document.getElementById(`checklist-form-${cycleNum}`);
        if (!formEl || formEl.hasAttribute("data-status-bound")) return;
        formEl.setAttribute("data-status-bound", "true");

        const handler = () => {
            this.updateSectionTabIndicators(cycleNum);
        };
        formEl.addEventListener("input", handler);
        formEl.addEventListener("change", handler);
    },

    // Step 3 Click - Submit Cycle
    saveCycle: async function (cycleNum) {
        if (!MixingBaking_Main.state.canEditChecklist) {
            alert("Access Denied: Only the assigned QA Executive can submit cycle data.");
            return;
        }

        if (typeof ShowLoader === "function") ShowLoader();
        try {
            MixingBaking_Validator.clearAll(cycleNum);

            // 0. Validation: Require that each of the four sections has at least one field filled
            const missingSections = this.validateFourSections(cycleNum);
            if (missingSections && missingSections.length > 0) {
                if (typeof HideLoader === "function") HideLoader();
                const missingList = missingSections.map(s => `- ${s.name}`).join("\n");
                alert(`Please fill in at least one field in each of the four sections before submitting:\n\n${missingList}`);

                // Automatically switch to the first missing section tab
                const firstMissing = missingSections[0];
                const panel = document.getElementById(`cycle-${cycleNum}`);
                const targetBtn = panel?.querySelector(`.mb-tab-btn[onclick*="${firstMissing.id}"]`);
                if (targetBtn) {
                    this.switchTab(targetBtn, cycleNum, firstMissing.id);
                }
                const firstInput = document.getElementById(firstMissing.id)?.querySelector("input:not([type='radio']):not([type='hidden']), textarea, select");
                if (firstInput) {
                    MixingBaking_Validator.highlight(firstInput, true);
                    firstInput.focus();
                }
                return;
            }

            const numericFields = [];
            
            // 1. Ingredients
            const ingredientsList = ["rpo", "solidfat", "butter", "blackjack", "spongetemp", "slurry", "groundsugartemp", "groundsugarparticlesize"];
            ingredientsList.forEach(ing => {
                numericFields.push({ id: `cr3ea_${ing}standard-${cycleNum}`, name: `${ing} Standard` });
                numericFields.push({ id: `cr3ea_${ing}observed-${cycleNum}`, name: `${ing} Observed` });
            });

            // 2. Custom Ingredients (Choco chips / Cashew)
            const customIngsList = ["chocochips", "cashew"];
            customIngsList.forEach(c => {
                numericFields.push({ id: `cr3ea_${c}temp-${cycleNum}`, name: `${c} Temperature` });
                numericFields.push({ id: `cr3ea_${c}countperkg-${cycleNum}`, name: `${c} Count/kg` });
            });

            // 3. Syrups
            const syrupsList = ["invertsyrup", "blackjack2"];
            syrupsList.forEach(s => {
                numericFields.push({ id: `cr3ea_${s}temp-${cycleNum}`, name: `${s} Temperature` });
                numericFields.push({ id: `cr3ea_${s}ph-${cycleNum}`, name: `${s} pH` });
                numericFields.push({ id: `cr3ea_${s}brix-${cycleNum}`, name: `${s} Brix` });
            });

            // 4. Mixing Sponge
            const spongeList = ["spongewaterquantity", "spongeyeastquantity", "spongewatertemp", "spongemixingtime", "fermentationstarttemp", "fermentationroomtemp", "finaltempafterfermentation", "finalphafterfermentation"];
            spongeList.forEach(s => {
                numericFields.push({ id: `cr3ea_${s}-${cycleNum}`, name: `Sponge ${s}` });
            });

            // 5. Mixing Dough (excluding text field doughconsistency)
            const doughList = ["creamingtime", "mixingtime", "doughtemp", "jackettemp", "doughstandingtime"];
            doughList.forEach(d => {
                numericFields.push({ id: `cr3ea_${d}standard-${cycleNum}`, name: `Dough ${d} Standard` });
                numericFields.push({ id: `cr3ea_${d}observed-${cycleNum}`, name: `Dough ${d} Observed` });
            });

            // 6. Forming
            const formingList = ["moulderrpmstrokes", "formingsamplecount", "standardwetweight", "observedwetweight", "weightbeforesugarsprinkling", "weightaftersugarsprinkling"];
            formingList.forEach(f => {
                numericFields.push({ id: `cr3ea_${f}-${cycleNum}`, name: `Forming ${f}` });
            });

            // 7. Baking Zone Temperatures & Product Temps
            numericFields.push({ id: `cr3ea_bakingtime-${cycleNum}`, name: "Baking Time" });
            for (let i = 1; i <= 7; i++) {
                numericFields.push({ id: `cr3ea_topbakingtempzone${i}-${cycleNum}`, name: `Top Baking Zone ${i}` });
                numericFields.push({ id: `cr3ea_bottombakingtempzone${i}-${cycleNum}`, name: `Bottom Baking Zone ${i}` });
            }
            numericFields.push({ id: `cr3ea_topproducttempafterbaking-${cycleNum}`, name: "Top Product Temp After Baking" });
            numericFields.push({ id: `cr3ea_bottomproducttempafterbaking-${cycleNum}`, name: "Bottom Product Temp After Baking" });

            // 8. QC Physical Standards & Quality/Moisture (excluding qualitative colour parameters)
            const qcsList = ["biscuitlength", "biscuitwidth", "biscuitdiameter", "standardssamplecount", "biscuitstdweight", "biscuitobservedweight", "weightafteroilspray"];
            qcsList.forEach(q => {
                numericFields.push({ id: `cr3ea_${q}-${cycleNum}`, name: `QC Standard: ${q}` });
            });

            const qcPairsList = ["moisture"];
            qcPairsList.forEach(q => {
                numericFields.push({ id: `cr3ea_${q}standard-${cycleNum}`, name: `${q} Standard` });
                numericFields.push({ id: `cr3ea_${q}observed-${cycleNum}`, name: `${q} Observed` });
            });

            // Run numeric validation loop
            for (let f of numericFields) {
                const el = document.getElementById(f.id);
                if (!el) continue;
                const val = el.value.trim();
                if (val !== "") {
                    const isNa = val.toUpperCase() === "NA" || val.toUpperCase() === "N/A";
                    const isRangeOrUnit = /^[\d\.\s\-]+(min|g|mm|%|bis)?$/i.test(val) || val.toLowerCase() === "as per std" || val.toLowerCase() === "std";
                    const isNum = (!isNaN(parseFloat(val)) && isFinite(val)) || isRangeOrUnit;
                    if (!isNa && !isNum) {
                        const parentPane = el.closest(".mb-tab-pane");
                        if (parentPane) {
                            const panel = document.getElementById(`cycle-${cycleNum}`);
                            const targetBtn = panel?.querySelector(`.mb-tab-btn[onclick*="${parentPane.id}"]`);
                            if (targetBtn) {
                                MixingBaking_Checklist.switchTab(targetBtn, cycleNum, parentPane.id);
                            }
                        }
                        MixingBaking_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please enter a valid numeric value or 'NA' for: ${f.name}`);
                        el.focus();
                        return;
                    }
                }
            }

            // 1. Gather form values
            const lineStr = (MixingBaking_Main.state.line || "Line 1").replace(/\s+/g, "");
            const formattedLine = lineStr.toLowerCase().startsWith("line") ? lineStr : `Line${lineStr}`;
            const record = {
                "cr3ea_title": `MixingBaking_${formattedLine}_Cycle-${cycleNum}_${moment().format("DD-MM-YYYY")}`,
                "cr3ea_cycle": `Cycle-${cycleNum}`,
                "cr3ea_shift": MixingBaking_Main.state.shift,
                "cr3ea_observedby": MixingBaking_Main.state.qaExecutive,
                "cr3ea_productname": MixingBaking_Main.state.product,
                "cr3ea_lineno": MixingBaking_Main.state.line || "Line 1",
                "cr3ea_productionincharge": MixingBaking_Main.state.productionIncharge,
                "cr3ea_batchno": MixingBaking_Main.state.batchNo
            };

            // Associate with parent quality tour
            if (MixingBaking_Main.state.varTourID) {
                record["cr3ea_qualitytourid@odata.bind"] = `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${MixingBaking_Main.state.varTourID})`;
            }

            // Ingredient temperatures
            const ingredients = ["rpo", "solidfat", "butter", "blackjack", "spongetemp", "slurry", "groundsugartemp", "groundsugarparticlesize"];
            ingredients.forEach(ing => {
                record[`cr3ea_${ing}standard`] = document.getElementById(`cr3ea_${ing}standard-${cycleNum}`)?.value || "";
                record[`cr3ea_${ing}observed`] = document.getElementById(`cr3ea_${ing}observed-${cycleNum}`)?.value || "";
                record[`cr3ea_${ing}remarks`] = document.getElementById(`cr3ea_${ing}remarks-${cycleNum}`)?.value || "";
                record[`cr3ea_${ing}actiontaken`] = document.getElementById(`cr3ea_${ing}actiontaken-${cycleNum}`)?.value || "";
            });

            // Minor Checklist
            const minors = ["cocoapowderdone", "smpdone", "salt1done", "abcdone", "sbcdone", "salt2done", "othersdone"];
            minors.forEach(m => {
                const cb = document.getElementById(`cr3ea_${m}-${cycleNum}`);
                record[`cr3ea_${m}`] = cb && cb.checked ? "Done" : "Not Done";
            });

            // Choco Chips & Cashews
            const customIngs = ["chocochips", "cashew"];
            customIngs.forEach(c => {
                record[`cr3ea_${c}supplier`] = document.getElementById(`cr3ea_${c}supplier-${cycleNum}`)?.value || "";
                record[`cr3ea_${c}temp`] = document.getElementById(`cr3ea_${c}temp-${cycleNum}`)?.value || "";
                record[`cr3ea_${c}countperkg`] = document.getElementById(`cr3ea_${c}countperkg-${cycleNum}`)?.value || "";
                record[`cr3ea_${c}mfgdate`] = document.getElementById(`cr3ea_${c}mfgdate-${cycleNum}`)?.value || null;
                record[`cr3ea_${c}compoundorpure`] = document.getElementById(`cr3ea_${c}compoundorpure-${cycleNum}`)?.value || "";
            });

            record["cr3ea_floursupplier"] = document.getElementById(`cr3ea_floursupplier-${cycleNum}`)?.value || "";

            // Syrups
            const syrups = ["invertsyrup", "blackjack2"];
            syrups.forEach(s => {
                record[`cr3ea_${s}temp`] = document.getElementById(`cr3ea_${s}temp-${cycleNum}`)?.value || "";
                record[`cr3ea_${s}ph`] = document.getElementById(`cr3ea_${s}ph-${cycleNum}`)?.value || "";
                record[`cr3ea_${s}brix`] = document.getElementById(`cr3ea_${s}brix-${cycleNum}`)?.value || "";
            });

            // Mixing Sponge
            const sponge = ["spongeproductname", "spongewaterquantity", "spongeyeastquantity", "spongewatertemp", "spongemixingtime", "fermentationstarttemp", "fermentationroomtemp", "finaltempafterfermentation", "finalphafterfermentation"];
            sponge.forEach(s => {
                record[`cr3ea_${s}`] = document.getElementById(`cr3ea_${s}-${cycleNum}`)?.value || "";
            });

            // Mixing Dough
            const dough = ["creamingtime", "mixingtime", "doughtemp", "jackettemp", "doughconsistency", "doughstandingtime"];
            dough.forEach(d => {
                record[`cr3ea_${d}standard`] = document.getElementById(`cr3ea_${d}standard-${cycleNum}`)?.value || "";
                record[`cr3ea_${d}observed`] = document.getElementById(`cr3ea_${d}observed-${cycleNum}`)?.value || "";
            });

            const mixerVal = document.querySelector(`input[name="cr3ea_typeofmixer-${cycleNum}"]:checked`);
            record["cr3ea_typeofmixer"] = mixerVal ? mixerVal.value : "Vertical";

            // Forming
            const forming = ["moulderrpmstrokes", "formingsamplecount", "standardwetweight", "observedwetweight", "weightbeforesugarsprinkling", "weightaftersugarsprinkling"];
            forming.forEach(f => {
                record[`cr3ea_${f}`] = document.getElementById(`cr3ea_${f}-${cycleNum}`)?.value || "";
            });

            // Baking
            record["cr3ea_bakingtime"] = document.getElementById(`cr3ea_bakingtime-${cycleNum}`)?.value || "";
            record["cr3ea_bakingprofiletaste"] = document.getElementById(`cr3ea_bakingprofiletaste-${cycleNum}`)?.value || "";

            const templateCb = document.getElementById(`cr3ea_bakingprofileaspertemplate-${cycleNum}`);
            record["cr3ea_bakingprofileaspertemplate"] = templateCb && templateCb.checked ? "Yes" : "No";

            for (let i = 1; i <= 7; i++) {
                record[`cr3ea_topbakingtempzone${i}`] = document.getElementById(`cr3ea_topbakingtempzone${i}-${cycleNum}`)?.value || "";
                record[`cr3ea_bottombakingtempzone${i}`] = document.getElementById(`cr3ea_bottombakingtempzone${i}-${cycleNum}`)?.value || "";
            }
            record["cr3ea_topproducttempafterbaking"] = document.getElementById(`cr3ea_topproducttempafterbaking-${cycleNum}`)?.value || "";
            record["cr3ea_bottomproducttempafterbaking"] = document.getElementById(`cr3ea_bottomproducttempafterbaking-${cycleNum}`)?.value || "";

            // QC Standards
            const qcs = ["biscuitlength", "biscuitwidth", "biscuitdiameter", "standardssamplecount", "biscuitstdweight", "biscuitobservedweight", "weightafteroilspray"];
            qcs.forEach(q => {
                record[`cr3ea_${q}`] = document.getElementById(`cr3ea_${q}-${cycleNum}`)?.value || "";
            });

            const qcPairs = ["topcolour", "bottomcolour", "moisture"];
            qcPairs.forEach(q => {
                record[`cr3ea_${q}standard`] = document.getElementById(`cr3ea_${q}standard-${cycleNum}`)?.value || "";
                record[`cr3ea_${q}observed`] = document.getElementById(`cr3ea_${q}observed-${cycleNum}`)?.value || "";
            });

            // 2. Submit record to Dataverse
            const savedData = await MixingBaking_DAL.saveCycle(record);
            console.log("Cycle record saved in Dataverse:", savedData);

            // 3. Upload file attachment to SharePoint if selected
            const file = this.selectedFiles[cycleNum];
            if (file) {
                console.log(`Uploading file attachment: ${file.name}`);
                const sharepointUrl = await MixingBaking_DAL.uploadAttachment(file, MixingBaking_Main.state.varTourID, cycleNum);
                console.log("File attached successfully:", sharepointUrl);
            }

            alert(`Cycle ${cycleNum} submitted successfully!`);
            window.location.reload();

        } catch (err) {
            console.error("Failed to save cycle data:", err);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "save cycle data")
                : ("Failed to save cycle data: " + err.message);
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // Render read-only cycle summary block
    renderCompletedSection: function (cycleNum, cycleData) {
        const completedDiv = document.getElementById(`completed-step-${cycleNum}`);
        if (!completedDiv) return;

        const val = (v) => v && String(v).trim() ? v : '-';

        completedDiv.innerHTML = `
            <div class="mb-completed-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border-radius: 12px; padding: 24px; margin-top: 15px;">
                <div class="mb-completed-header" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h5 style="margin: 0; font-size: 15px; font-weight: 700; color: #0f172a;">Cycle ${cycleNum} Saved Details Summary</h5>
                    <span class="badge" style="background-color: #dcfce7; color: #16a34a; padding: 6px 12px; border-radius: 50px; font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                        <span style="width: 6px; height: 6px; background: #16a34a; border-radius: 50%;"></span>
                        Submitted
                    </span>
                </div>

                <!-- TAB NAVIGATION FOR COMPLETED CYCLE (Modern segmented control) -->
                <div class="mb-tabs-nav" style="display: flex; gap: 4px; padding: 4px; background: #f1f5f9; border-radius: 8px; margin-bottom: 20px; width: 100%; box-sizing: border-box;">
                    <button type="button" class="mb-tab-btn active comp-tab-btn-${cycleNum}" style="flex: 1; border: none; background: #ffffff; color: #1e293b; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-ing-q-${cycleNum}')">1. Ingredient Quality</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="flex: 1; border: none; background: transparent; color: #475569; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mat-q-${cycleNum}')">2. Material Quality</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="flex: 1; border: none; background: transparent; color: #475569; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mix-f-${cycleNum}')">3. Mixing & Forming</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="flex: 1; border: none; background: transparent; color: #475569; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-bake-s-${cycleNum}')">4. Baking & Standards</button>
                </div>
                
                <div class="summary-sections-container" style="color: #334155; line-height: 1.5;">
                    
                    <!-- TAB 1: INGREDIENT QUALITY -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-ing-q-${cycleNum}" style="display: block; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 16px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">1. Ingredient Quality & Temperatures</h6>
                        
                        <div class="table-responsive" style="margin-bottom: 12px; border-radius: 8px; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; min-width: 650px; table-layout: fixed; border-collapse: collapse; font-size: 12px; text-align: left; background: white;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="width: 22%; padding: 10px 12px; font-weight: 600; color: #475569;">Ingredient</th>
                                        <th style="width: 15%; padding: 10px 12px; font-weight: 600; color: #475569;">Standard</th>
                                        <th style="width: 15%; padding: 10px 12px; font-weight: 600; color: #475569;">Observed</th>
                                        <th style="width: 24%; padding: 10px 12px; font-weight: 600; color: #475569;">Remarks</th>
                                        <th style="width: 24%; padding: 10px 12px; font-weight: 600; color: #475569;">Action Taken</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[
                                        { label: "RPO", key: "cr3ea_rpo" },
                                        { label: "Solid Fat", key: "cr3ea_solidfat" },
                                        { label: "Butter", key: "cr3ea_butter" },
                                        { label: "Blackjack (Initial)", key: "cr3ea_blackjack" },
                                        { label: "Sponge", key: "cr3ea_spongetemp" },
                                        { label: "Slurry", key: "cr3ea_slurry" },
                                        { label: "Ground Sugar Temp", key: "cr3ea_groundsugartemp" },
                                        { label: "Ground Sugar Particle", key: "cr3ea_groundsugarparticlesize" }
                                    ].map((item, idx) => `
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${item.label}</td>
                                            <td style="padding: 10px 12px; color: #334155; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "observed"])}</td>
                                            <td style="padding: 10px 12px; color: #64748b; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "remarks"])}</td>
                                            <td style="padding: 10px 12px; color: #64748b; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "actiontaken"])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="minor-summary" style="margin-top: 16px; background: white; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px;">
                            <span style="font-weight: 700; font-size: 11px; display: block; margin-bottom: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Minor Ingredients Checklist:</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${[
                                    { label: "Cocoa Powder", key: "cr3ea_cocoapowderdone" },
                                    { label: "SMP", key: "cr3ea_smpdone" },
                                    { label: "Salt 1", key: "cr3ea_salt1done" },
                                    { label: "ABC", key: "cr3ea_abcdone" },
                                    { label: "SBC", key: "cr3ea_sbcdone" },
                                    { label: "Salt 2", key: "cr3ea_salt2done" },
                                    { label: "Others", key: "cr3ea_othersdone" }
                                ].map(item => {
                                    const isDone = cycleData[item.key] === "Done";
                                    const bg = isDone ? "#dcfce7" : "#fee2e2";
                                    const color = isDone ? "#15803d" : "#b91c1c";
                                    return `<span style="padding: 4px 8px; border-radius: 6px; font-size: 11px; background: ${bg}; color: ${color}; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                        <span style="width: 5px; height: 5px; background: ${color}; border-radius: 50%;"></span>
                                        ${item.label}: ${cycleData[item.key] || 'Not Done'}
                                    </span>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: MATERIAL QUALITY -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-mat-q-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 16px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">2. Material Quality & Sponge</h6>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 12px;">
                            <!-- Supplier Details -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px;">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 4px;">Supplier Details</span>
                                <div>
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Flour Supplier</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_floursupplier)}</div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 8px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Choco Chips Supplier</div>
                                    ${cycleData.cr3ea_chocochipssupplier ? `
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${cycleData.cr3ea_chocochipssupplier}</div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_chocochipstemp)}&deg;C</strong></span>
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Count: <strong>${val(cycleData.cr3ea_chocochipscountperkg)}/kg</strong></span>
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Type: <strong>${val(cycleData.cr3ea_chocochipscompoundorpure)}</strong></span>
                                        </div>
                                    ` : '<div style="color: #94a3b8; font-size: 12px; font-style: italic; margin-top: 2px;">No Choco Chips data</div>'}
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 8px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Cashew Supplier</div>
                                    ${cycleData.cr3ea_cashewsupplier ? `
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${cycleData.cr3ea_cashewsupplier}</div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_cashewtemp)}&deg;C</strong></span>
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Count: <strong>${val(cycleData.cr3ea_cashewcountperkg)}/kg</strong></span>
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Type: <strong>${val(cycleData.cr3ea_cashewcompoundorpure)}</strong></span>
                                        </div>
                                    ` : '<div style="color: #94a3b8; font-size: 12px; font-style: italic; margin-top: 2px;">No Cashew data</div>'}
                                </div>
                            </div>

                            <!-- Syrups & Liquids -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px;">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 4px;">Syrups & Liquids</span>
                                <div>
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Invert Syrup</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_invertsyruptemp)}&deg;C</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">pH: <strong>${val(cycleData.cr3ea_invertsyrupph)}</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Brix: <strong>${val(cycleData.cr3ea_invertsyrupbrix)}</strong></span>
                                    </div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 12px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Blackjack (2nd Stage)</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_blackjack2temp)}&deg;C</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">pH: <strong>${val(cycleData.cr3ea_blackjack2ph)}</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Brix: <strong>${val(cycleData.cr3ea_blackjack2brix)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Sponge Parameters -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; grid-column: 1 / -1; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">Mixing Sponge Parameters</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Sponge Name</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongeproductname)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Water Quantity</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongewaterquantity)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Yeast Quantity</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongeyeastquantity)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Water Temp</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongewatertemp)}&deg;C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Mixing Time</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongemixingtime)} min</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Fermentation Start Temp</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_fermentationstarttemp)}&deg;C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Fermentation Room Temp</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_fermentationroomtemp)}&deg;C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Final Temp (After Ferm)</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_finaltempafterfermentation)}&deg;C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Final pH</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_finalphafterfermentation)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: MIXING & FORMING -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-mix-f-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 16px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">3. Mixing Dough & Forming Stage</h6>
                        
                        <div class="table-responsive" style="margin-bottom: 12px; border-radius: 8px; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; min-width: 450px; table-layout: fixed; border-collapse: collapse; font-size: 12px; text-align: left; background: white;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="width: 40%; padding: 10px 12px; font-weight: 600; color: #475569;">Dough Parameter</th>
                                        <th style="width: 30%; padding: 10px 12px; font-weight: 600; color: #475569;">Standard</th>
                                        <th style="width: 30%; padding: 10px 12px; font-weight: 600; color: #475569;">Observed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[
                                        { label: "Creaming Time", key: "cr3ea_creamingtime" },
                                        { label: "Mixing Time", key: "cr3ea_mixingtime" },
                                        { label: "Dough Temperature", key: "cr3ea_doughtemp" },
                                        { label: "Jacket of Mixer Temperature", key: "cr3ea_jackettemp" },
                                        { label: "Dough Consistency", key: "cr3ea_doughconsistency" },
                                        { label: "Dough Standing Time", key: "cr3ea_doughstandingtime" }
                                    ].map((item, idx) => `
                                        <tr style="border-bottom: 1px solid #f1f5f9; background: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${item.label}</td>
                                            <td style="padding: 10px 12px; color: #334155; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${val(cycleData[item.key + "observed"])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 12px; margin-top: 16px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                <div>
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Mixer Type</div>
                                    <div style="font-size: 14px; color: #1e293b; font-weight: 700; margin-top: 2px;">${val(cycleData.cr3ea_typeofmixer)}</div>
                                </div>
                            </div>
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">Forming Details</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Moulder RPM</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_moulderrpmstrokes)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Sample Count</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_formingsamplecount)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Wet Weight (Std)</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_standardwetweight)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Wet Weight (Obs)</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_observedwetweight)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Wt Before Sugar</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_weightbeforesugarsprinkling)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Weight After Sugar</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_weightaftersugarsprinkling)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: BAKING & STANDARDS -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-bake-s-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 16px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">4. Baking Stage & Physical Standards</h6>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; font-size: 12px; margin-bottom: 16px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 8px;">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 4px;">Baking Settings</span>
                                <div>
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Baking Time</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_bakingtime)}</div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 6px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Baking Taste Profile</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_bakingprofiletaste)}</div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 6px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">As per template</div>
                                    <div style="margin-top: 4px;">
                                        <span style="padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${cycleData.cr3ea_bakingprofileaspertemplate === 'Yes' ? '#dcfce7' : '#fee2e2'}; color: ${cycleData.cr3ea_bakingprofileaspertemplate === 'Yes' ? '#15803d' : '#b91c1c'};">
                                            ${val(cycleData.cr3ea_bakingprofileaspertemplate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 10px;">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 4px;">Product Temperatures after Baking</span>
                                <div>
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Top Product Temp</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_topproducttempafterbaking)}&deg;C</div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 8px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Bottom Product Temp</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_bottomproducttempafterbaking)}&deg;C</div>
                                </div>
                            </div>
                        </div>

                        <!-- Baking Zone Temperatures Table -->
                        <span style="font-weight: 700; font-size: 11px; display: block; margin-bottom: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Baking Zone Temperatures (&deg;C):</span>
                        <div class="table-responsive" style="margin-bottom: 16px; border-radius: 8px; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; min-width: 600px; table-layout: fixed; border-collapse: collapse; font-size: 11px; text-align: center; background: white;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 8px 10px; text-align: left; font-weight: 600; color: #475569;">Zone</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z1</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z2</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z3</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z4</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z5</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z6</th>
                                        <th style="padding: 8px 10px; font-weight: 600; color: #475569;">Z7</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 8px 10px; font-weight: 600; text-align: left; color: #475569; background: #fcfcfc;">Top</td>
                                        ${[1,2,3,4,5,6,7].map(i => `<td style="padding: 8px 10px;">${val(cycleData[`cr3ea_topbakingtempzone${i}`])}</td>`).join('')}
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 10px; font-weight: 600; text-align: left; color: #475569; background: #fcfcfc;">Bottom</td>
                                        ${[1,2,3,4,5,6,7].map(i => `<td style="padding: 8px 10px;">${val(cycleData[`cr3ea_bottombakingtempzone${i}`])}</td>`).join('')}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; font-size: 12px; margin-top: 8px;">
                            <!-- Biscuit Physical Standards -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">Biscuit Physical Standards</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px;">
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Length</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_biscuitlength)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Width</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_biscuitwidth)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Diameter</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_biscuitdiameter)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Sample Count</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_standardssamplecount)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Std Weight</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_biscuitstdweight)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Obs. Weight</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_biscuitobservedweight)}</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Wt After Oil</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_weightafteroilspray)}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quality & Moisture Parameters -->
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                <span style="font-weight: 700; font-size: 13px; color: #1e293b; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">Quality & Moisture Parameters</span>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; font-weight: 700; margin-bottom: 6px; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                                    <div>Parameter</div>
                                    <div>Standard</div>
                                    <div>Observed</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; border-bottom: 1px solid #f8fafc; padding-bottom: 4px; font-size: 12px;">
                                    <div style="font-weight: 600; color: #334155;">Top Colour</div>
                                    <div style="color: #64748b;">${val(cycleData.cr3ea_topcolourstandard)}</div>
                                    <div style="font-weight: 600; color: #0f172a;">${val(cycleData.cr3ea_topcolourobserved)}</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; border-bottom: 1px solid #f8fafc; padding-top: 4px; padding-bottom: 4px; font-size: 12px;">
                                    <div style="font-weight: 600; color: #334155;">Bottom Colour</div>
                                    <div style="color: #64748b;">${val(cycleData.cr3ea_bottomcolourstandard)}</div>
                                    <div style="font-weight: 600; color: #0f172a;">${val(cycleData.cr3ea_bottomcolourobserved)}</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 6px; padding-top: 4px; font-size: 12px;">
                                    <div style="font-weight: 600; color: #334155;">Moisture %</div>
                                    <div style="color: #64748b;">${val(cycleData.cr3ea_moisturestandard)}</div>
                                    <div style="font-weight: 600; color: #0f172a;">${val(cycleData.cr3ea_moistureobserved)}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Document Attachment Section -->
                        <div id="mb-attachment-container-${cycleNum}-${cycleData.cr3ea_prod_rajpura_mixingandbakingid}" style="margin-top: 16px; padding: 12px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 13px;">
                            <span style="color: #64748b;">Checking for uploaded document...</span>
                        </div>
                    </div>

                </div>
                <p style="margin-top:20px; font-size:11px; color:#64748b; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 12px;">To review complete records or export detailed Excel/PDF reports, please visit the central HOD/PM plant tour dashboard.</p>
            </div>
        `;

        // Fetch and render document link asynchronously
        (async () => {
            try {
                const attachments = await MixingBaking_DAL.getCycleAttachments(MixingBaking_Main.state.varTourID, cycleNum);
                const placeholder = document.getElementById(`mb-attachment-container-${cycleNum}-${cycleData.cr3ea_prod_rajpura_mixingandbakingid}`);
                if (placeholder) {
                    if (attachments && attachments.length > 0) {
                        const file = attachments[0];
                        placeholder.style.borderStyle = "solid";
                        placeholder.style.borderColor = "#e2e8f0";
                        placeholder.style.background = "#ffffff";
                        placeholder.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <strong style="color: #334155; font-size: 13px;">${file.Title}</strong>
                                </div>
                                <a href="${file.FileRef}" target="_blank" class="bs-btn" style="padding: 6px 12px; font-size: 12px; background: #2563eb; color: white; border: none; border-radius: 4px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    View Document
                                </a>
                            </div>
                        `;
                    } else {
                        placeholder.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px; color: #64748b;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <span>No document uploaded for this cycle</span>
                            </div>
                        `;
                    }
                }
            } catch (err) {
                console.error("Failed to load completed cycle attachment:", err);
            }
        })();
    },

    switchCompletedTab: function (btn, cycleNum, paneId) {
        // Hide all panes for this cycle
        document.querySelectorAll(`.comp-tab-pane-${cycleNum}`).forEach(pane => {
            pane.style.display = "none";
        });
        
        // Show current pane
        const activePane = document.getElementById(paneId);
        if (activePane) {
            activePane.style.display = "block";
        }
        
        // Toggle button active classes matching the segmented navigation style
        document.querySelectorAll(`.comp-tab-btn-${cycleNum}`).forEach(b => {
            b.style.background = "transparent";
            b.style.color = "#475569";
            b.style.boxShadow = "none";
        });
        
        // Highlight active button
        btn.style.background = "#ffffff";
        btn.style.color = "#1e293b";
        btn.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)";
    },

    // Collapsible Accordion toggler handler
    togglePanel: function (cycleNum) {
        const panel = document.getElementById(`cycle-${cycleNum}`);
        if (!panel) return;

        const isCompleted = panel.classList.contains("completed-cycle");
        const body = panel.querySelector(".bs-card-body");

        panel.classList.toggle("bs-card-toggler-is-active");
        const isActive = panel.classList.contains("bs-card-toggler-is-active");

        if (isActive) {
            panel.style.cssText = "height: auto !important; overflow: visible !important; display: block !important;";
            body.style.cssText = "max-height: none !important; height: auto !important; overflow: visible !important; display: block !important;";

            // Focus on start or checklist form
            if (isCompleted) {
                document.getElementById(`completed-step-${cycleNum}`).style.display = "block";
                document.getElementById(`info-wrapper-${cycleNum}`).style.display = "block";
            } else {
                // Determine whether started
                const hasStarted = (cycleNum === 1 && !!MixingBaking_Main.state.product) || (cycleNum > 1);
                document.getElementById(`start-step-${cycleNum}`).style.display = hasStarted ? "none" : "block";
                document.getElementById(`checklist-form-${cycleNum}`).style.display = hasStarted ? "block" : "none";
                const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
                if (infoWrapper) infoWrapper.style.display = hasStarted ? "block" : "none";
            }
        } else {
            panel.style.cssText = "height: 80px !important; overflow: hidden !important; display: block !important;";
            body.style.cssText = "max-height: 0px !important; height: 0px !important; overflow: hidden !important; display: block !important;";
        }
    },

    completeTour: async function () {
        if (!MixingBaking_Main.state.varTourID) {
            alert("No active tour found to complete.");
            return;
        }

        const isQA = MixingBaking_Main.state.canEditChecklist;
        if (!isQA) {
            alert("Only the assigned QA Executive can complete this tour.");
            return;
        }

        const confirmComplete = confirm("Are you sure you want to complete this Quality Tour? This will lock the tour from further edits.");
        if (!confirmComplete) return;

        ShowLoader();
        try {
            // Mark parent tour as Completed in Dataverse
            const payload = {
                cr3ea_status: "Completed",
                cr3ea_processstatus: "Completed"
            };

            await MixingBaking_DAL.updateParentTour(MixingBaking_Main.state.varTourID, payload);
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
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "complete tour")
                : ("Failed to complete tour: " + err.message);
            alert(msg);
        }
    },

    populateStandardValues: function (cycleNum, product) {
        if (!product) return;
        console.log(`Populating standard values dynamically for Product: "${product}", Cycle: ${cycleNum}`);

        // Helper to safely set element value (stripping redundant "Celsius" if present)
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                if (val === undefined || val === null) return;
                if (typeof val === "string") {
                    val = val.replace(/\s*celsius/gi, "").trim();
                }
                el.value = val;
            }
        };

        // Helper to safely check a checkbox
        const setChecked = (id, isChecked) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!isChecked;
        };

        // Clean values before prefilling standard fields to prevent bleed
        const fieldsToClear = [
            "cr3ea_rpostandard", "cr3ea_solidfatstandard", "cr3ea_butterstandard", "cr3ea_blackjackstandard", "cr3ea_spongetempstandard", "cr3ea_slurrystandard", "cr3ea_groundsugartempstandard", "cr3ea_groundsugarparticlesizestandard",
            "cr3ea_rpoobserved", "cr3ea_solidfatobserved", "cr3ea_butterobserved", "cr3ea_blackjackobserved", "cr3ea_spongetempobserved", "cr3ea_slurryobserved",
            "cr3ea_chocochipssupplier", "cr3ea_chocochipstemp", "cr3ea_chocochipscountperkg", "cr3ea_chocochipscompoundorpure",
            "cr3ea_cashewsupplier", "cr3ea_cashewtemp", "cr3ea_cashewcountperkg", "cr3ea_cashewcompoundorpure",
            "cr3ea_floursupplier", "cr3ea_invertsyruptemp", "cr3ea_blackjack2temp",
            "cr3ea_spongeproductname", "cr3ea_spongewaterquantity", "cr3ea_spongeyeastquantity", "cr3ea_spongewatertemp", "cr3ea_fermentationstarttemp", "cr3ea_fermentationroomtemp", "cr3ea_finaltempafterfermentation", "cr3ea_finalphafterfermentation",
            "cr3ea_creamingtimestandard", "cr3ea_creamingtimeobserved", "cr3ea_mixingtimestandard", "cr3ea_mixingtimeobserved", "cr3ea_doughtempstandard", "cr3ea_doughtempobserved", "cr3ea_doughstandingtimestandard", "cr3ea_doughstandingtimeobserved",
            "cr3ea_moulderrpmstrokes", "cr3ea_formingsamplecount", "cr3ea_standardwetweight",
            "cr3ea_biscuitlength", "cr3ea_biscuitwidth", "cr3ea_biscuitdiameter", "cr3ea_standardssamplecount", "cr3ea_biscuitstdweight",
            "cr3ea_topcolourstandard", "cr3ea_topcolourobserved", "cr3ea_bottomcolourstandard", "cr3ea_bottomcolourobserved",
            "cr3ea_moisturestandard", "cr3ea_weightafteroilspray"
        ];
        fieldsToClear.forEach(f => {
            const el = document.getElementById(`${f}-${cycleNum}`);
            if (el) el.value = "";
        });

        // Lookup recipe dynamically from memory state or seed defaults
        const allRecipes = (typeof MixingBaking_Main !== "undefined" && MixingBaking_Main.state && MixingBaking_Main.state.recipes && MixingBaking_Main.state.recipes.length > 0)
            ? MixingBaking_Main.state.recipes
            : ((typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA)) ? MB_RECIPES_SEED_DATA : []);

        const cleanProd = String(product).toLowerCase().trim();
        const recipe = allRecipes.find(r => r.title && r.title.toLowerCase().trim() === cleanProd);

        if (!recipe || !recipe.standards) {
            console.warn(`No configured recipe standards found for product "${product}". Checking fallback variations...`);
            // Check substring match
            const fallbackRecipe = allRecipes.find(r => r.title && (cleanProd.includes(r.title.toLowerCase().trim()) || r.title.toLowerCase().trim().includes(cleanProd)));
            if (fallbackRecipe && fallbackRecipe.standards) {
                this.applyRecipeStandards(cycleNum, fallbackRecipe.standards, setVal, setChecked);
            }
            return;
        }

        this.applyRecipeStandards(cycleNum, recipe.standards, setVal, setChecked);
    },

    applyRecipeStandards: function (cycleNum, s, setVal, setChecked) {
        if (!s || typeof s !== "object") return;

        // 1. Ingredient Temperatures Standard
        if (s.rpoStandard !== undefined) setVal(`cr3ea_rpostandard-${cycleNum}`, s.rpoStandard);
        if (s.solidFatStandard !== undefined) setVal(`cr3ea_solidfatstandard-${cycleNum}`, s.solidFatStandard);
        if (s.butterStandard !== undefined) setVal(`cr3ea_butterstandard-${cycleNum}`, s.butterStandard);
        if (s.blackJackStandard !== undefined) setVal(`cr3ea_blackjackstandard-${cycleNum}`, s.blackJackStandard);
        if (s.spongeTempStandard !== undefined) setVal(`cr3ea_spongetempstandard-${cycleNum}`, s.spongeTempStandard);
        if (s.slurryStandard !== undefined) setVal(`cr3ea_slurrystandard-${cycleNum}`, s.slurryStandard);
        if (s.groundSugarTempStandard !== undefined) setVal(`cr3ea_groundsugartempstandard-${cycleNum}`, s.groundSugarTempStandard);
        if (s.groundSugarParticleSizeStandard !== undefined) setVal(`cr3ea_groundsugarparticlesizestandard-${cycleNum}`, s.groundSugarParticleSizeStandard);

        // 2. Observed fields auto-set to "NA"
        if (s.rpoObserved !== undefined) setVal(`cr3ea_rpoobserved-${cycleNum}`, s.rpoObserved);
        if (s.butterObserved !== undefined) setVal(`cr3ea_butterobserved-${cycleNum}`, s.butterObserved);
        if (s.solidFatObserved !== undefined) setVal(`cr3ea_solidfatobserved-${cycleNum}`, s.solidFatObserved);
        if (s.blackJackObserved !== undefined) setVal(`cr3ea_blackjackobserved-${cycleNum}`, s.blackJackObserved);
        if (s.spongeTempObserved !== undefined) setVal(`cr3ea_spongetempobserved-${cycleNum}`, s.spongeTempObserved);
        if (s.slurryObserved !== undefined) setVal(`cr3ea_slurryobserved-${cycleNum}`, s.slurryObserved);
        if (s.groundSugarTempObserved !== undefined) setVal(`cr3ea_groundsugartempobserved-${cycleNum}`, s.groundSugarTempObserved);
        if (s.groundSugarParticleSizeObserved !== undefined) setVal(`cr3ea_groundsugarparticlesizeobserved-${cycleNum}`, s.groundSugarParticleSizeObserved);

        // 3. Raw Material Suppliers
        if (s.chocoChipsSupplier !== undefined) setVal(`cr3ea_chocochipssupplier-${cycleNum}`, s.chocoChipsSupplier);
        if (s.chocoChipsTemp !== undefined) setVal(`cr3ea_chocochipstemp-${cycleNum}`, s.chocoChipsTemp);
        if (s.chocoChipsCountPerKg !== undefined) setVal(`cr3ea_chocochipscountperkg-${cycleNum}`, s.chocoChipsCountPerKg);
        if (s.chocoChipsCompoundOrPure !== undefined) setVal(`cr3ea_chocochipscompoundorpure-${cycleNum}`, s.chocoChipsCompoundOrPure);

        if (s.cashewSupplier !== undefined) setVal(`cr3ea_cashewsupplier-${cycleNum}`, s.cashewSupplier);
        if (s.cashewTemp !== undefined) setVal(`cr3ea_cashewtemp-${cycleNum}`, s.cashewTemp);
        if (s.cashewCountPerKg !== undefined) setVal(`cr3ea_cashewcountperkg-${cycleNum}`, s.cashewCountPerKg);
        if (s.cashewCompoundOrPure !== undefined) setVal(`cr3ea_cashewcompoundorpure-${cycleNum}`, s.cashewCompoundOrPure);

        if (s.flourSupplier !== undefined) setVal(`cr3ea_floursupplier-${cycleNum}`, s.flourSupplier);

        // 4. Syrups & Liquid Sugars
        if (s.invertSyrupTemp !== undefined) setVal(`cr3ea_invertsyruptemp-${cycleNum}`, s.invertSyrupTemp);
        if (s.blackJack2Temp !== undefined) setVal(`cr3ea_blackjack2temp-${cycleNum}`, s.blackJack2Temp);

        // 5. Sponge & Fermentation
        if (s.spongeProductName !== undefined) setVal(`cr3ea_spongeproductname-${cycleNum}`, s.spongeProductName);
        if (s.spongeWaterQuantity !== undefined) setVal(`cr3ea_spongewaterquantity-${cycleNum}`, s.spongeWaterQuantity);
        if (s.spongeYeastQuantity !== undefined) setVal(`cr3ea_spongeyeastquantity-${cycleNum}`, s.spongeYeastQuantity);
        if (s.spongeWaterTemp !== undefined) setVal(`cr3ea_spongewatertemp-${cycleNum}`, s.spongeWaterTemp);
        if (s.fermentationStartTemp !== undefined) setVal(`cr3ea_fermentationstarttemp-${cycleNum}`, s.fermentationStartTemp);
        if (s.fermentationRoomTemp !== undefined) setVal(`cr3ea_fermentationroomtemp-${cycleNum}`, s.fermentationRoomTemp);
        if (s.finalTempAfterFermentation !== undefined) setVal(`cr3ea_finaltempafterfermentation-${cycleNum}`, s.finalTempAfterFermentation);
        if (s.finalPhAfterFermentation !== undefined) setVal(`cr3ea_finalphafterfermentation-${cycleNum}`, s.finalPhAfterFermentation);

        // 6. Dough Mixing Standards
        if (s.creamingTimeStandard !== undefined) setVal(`cr3ea_creamingtimestandard-${cycleNum}`, s.creamingTimeStandard);
        if (s.creamingTimeObserved !== undefined) setVal(`cr3ea_creamingtimeobserved-${cycleNum}`, s.creamingTimeObserved);
        if (s.mixingTimeStandard !== undefined) setVal(`cr3ea_mixingtimestandard-${cycleNum}`, s.mixingTimeStandard);
        if (s.mixingTimeObserved !== undefined) setVal(`cr3ea_mixingtimeobserved-${cycleNum}`, s.mixingTimeObserved);
        if (s.doughTempStandard !== undefined) setVal(`cr3ea_doughtempstandard-${cycleNum}`, s.doughTempStandard);
        if (s.doughTempObserved !== undefined) setVal(`cr3ea_doughtempobserved-${cycleNum}`, s.doughTempObserved);
        if (s.doughStandingTimeStandard !== undefined) setVal(`cr3ea_doughstandingtimestandard-${cycleNum}`, s.doughStandingTimeStandard);
        if (s.doughStandingTimeObserved !== undefined) setVal(`cr3ea_doughstandingtimeobserved-${cycleNum}`, s.doughStandingTimeObserved);

        // 7. Forming & Moulding
        if (s.moulderRpmStrokes !== undefined) setVal(`cr3ea_moulderrpmstrokes-${cycleNum}`, s.moulderRpmStrokes);
        if (s.formingSampleCount !== undefined) setVal(`cr3ea_formingsamplecount-${cycleNum}`, s.formingSampleCount);
        if (s.standardWetWeight !== undefined) setVal(`cr3ea_standardwetweight-${cycleNum}`, s.standardWetWeight);

        // 8. Baking Profile
        if (s.bakingProfileAsPerTemplate !== undefined) {
            setChecked(`cr3ea_bakingprofileaspertemplate-${cycleNum}`, s.bakingProfileAsPerTemplate);
        }

        // 9. Biscuit Physical Dimensions
        if (s.biscuitLength !== undefined) setVal(`cr3ea_biscuitlength-${cycleNum}`, s.biscuitLength);
        if (s.biscuitWidth !== undefined) setVal(`cr3ea_biscuitwidth-${cycleNum}`, s.biscuitWidth);
        if (s.biscuitDiameter !== undefined) setVal(`cr3ea_biscuitdiameter-${cycleNum}`, s.biscuitDiameter);
        if (s.standardsSampleCount !== undefined) setVal(`cr3ea_standardssamplecount-${cycleNum}`, s.standardsSampleCount);
        if (s.biscuitStdWeight !== undefined) setVal(`cr3ea_biscuitstdweight-${cycleNum}`, s.biscuitStdWeight);

        // 10. Quality & Moisture
        if (s.topColourStandard !== undefined) setVal(`cr3ea_topcolourstandard-${cycleNum}`, s.topColourStandard);
        if (s.topColourObserved !== undefined) setVal(`cr3ea_topcolourobserved-${cycleNum}`, s.topColourObserved);
        if (s.bottomColourStandard !== undefined) setVal(`cr3ea_bottomcolourstandard-${cycleNum}`, s.bottomColourStandard);
        if (s.bottomColourObserved !== undefined) setVal(`cr3ea_bottomcolourobserved-${cycleNum}`, s.bottomColourObserved);
        if (s.moistureStandard !== undefined) setVal(`cr3ea_moisturestandard-${cycleNum}`, s.moistureStandard);
        if (s.weightAfterOilSpray !== undefined) setVal(`cr3ea_weightafteroilspray-${cycleNum}`, s.weightAfterOilSpray);
    }
};
