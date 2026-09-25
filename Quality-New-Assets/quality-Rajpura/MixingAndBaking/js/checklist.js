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
                const skuStr = (r.skuRaw || (Array.isArray(r.sku) ? r.sku.join(", ") : "") || "").trim();
                const title = (r.title || r.variety || "").trim();
                const hasSkuInTitle = skuStr && title.toLowerCase().includes(skuStr.toLowerCase());
                
                // If multiple items share same base title, append SKU for clear identification
                const sameTitleCount = activeRecipes.filter(other => (other.title || other.variety || "").trim().toLowerCase() === title.toLowerCase()).length;
                const displayTitle = (skuStr && skuStr !== "-" && skuStr.toUpperCase() !== "NA" && !hasSkuInTitle && sameTitleCount > 1)
                    ? `${title} (${skuStr})`
                    : title;

                const isSelected = (state.product && (
                    state.product.toLowerCase().trim() === title.toLowerCase().trim() ||
                    state.product.toLowerCase().trim() === displayTitle.toLowerCase().trim()
                )) ? 'selected' : '';

                productSelect.append(`<option value="${displayTitle}" data-srno="${r.srNo || ''}" ${isSelected}>${displayTitle}</option>`);
            });

            // Bind change / select2:select to auto-populate open cycle immediately upon product selection
            productSelect.off("change.mbAutoPop select2:select.mbAutoPop").on("change.mbAutoPop select2:select.mbAutoPop", function () {
                const chosen = $(this).val();
                if (chosen) {
                    MixingBaking_Main.state.product = chosen;
                    const activePanels = document.querySelectorAll(".tour-cycle-panel:not(.completed-cycle)");
                    activePanels.forEach(p => {
                        const num = p.id.replace("cycle-", "");
                        MixingBaking_Checklist.populateStandardValues(num, chosen);
                    });
                }
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
                    qaSelect.append(`<option value="${u.EMail || u.Title}" data-email="${u.EMail || ''}" ${selected}>${u.Title}</option>`);
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
                    prodSelect.append(`<option value="${u.EMail || u.Title}" data-email="${u.EMail || ''}" ${selected}>${u.Title}</option>`);
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

        let resolvedQa = qa;
        let resolvedProd = prod;
        const shiftExecEmail = (typeof _spPageContextInfo !== 'undefined')
            ? (typeof ALC_Notification !== "undefined" ? (ALC_Notification.extractEmail(_spPageContextInfo.userEmail) || ALC_Notification.extractEmail(_spPageContextInfo.userLoginName) || "") : (_spPageContextInfo.userEmail || ""))
            : "";

        if (typeof ALC_Notification !== "undefined") {
            if (!resolvedQa || !resolvedQa.includes("@")) {
                const r = await ALC_Notification.resolveUserEmailAsync(qa, state.usersConfig?.qaUsers, null);
                if (r) resolvedQa = r;
            }
            resolvedQa = ALC_Notification.extractEmail(resolvedQa) || resolvedQa;

            if (!resolvedProd || !resolvedProd.includes("@")) {
                const r = await ALC_Notification.resolveUserEmailAsync(prod, state.usersConfig?.prodUsers, null);
                if (r) resolvedProd = r;
            }
            resolvedProd = ALC_Notification.extractEmail(resolvedProd) || resolvedProd;
        }

        ShowLoader();
        try {
            let generatedGUID = MixingBaking_Main.state.varTourID;
            const cleanLine = String(line).replace(/line\s*|-/gi, "").trim();
            const lineLabel = cleanLine ? `Line${cleanLine}` : "Line1";
            const plantId = (site === "Rajpura") ? QualityRajpura_Config.PLANT_ID : site;

            const parentPayload = {
                cr3ea_assigned_qa: resolvedQa,
                cr3ea_tourby: resolvedQa,
                cr3ea_shiftexecutiveproduction: resolvedProd,
                cr3ea_observedby: shiftExecEmail || shiftExec,
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
                <span><strong>Read-Only Mode:</strong> You are viewing this checklist in read-only mode. Only the assigned QA Executive (${assignedQAName || "N/A"}) can edit or complete the quality tour.</span>
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
                                <h4 class="mb-section-title">Ingredient Temperature Checks (&deg;C)</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Ingredient</th>
                                                <th>Standard (&deg;C)</th>
                                                <th>Observed (&deg;C)</th>
                                                <th>Remarks</th>
                                                <th>Action Taken</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderIngRow(cycleNum, "RPO (&deg;C)", "cr3ea_rpo", true)}
                                            ${this.renderIngRow(cycleNum, "Solid Fat (&deg;C)", "cr3ea_solidfat")}
                                            ${this.renderIngRow(cycleNum, "Butter (&deg;C)", "cr3ea_butter")}
                                            ${this.renderIngRow(cycleNum, "Blackjack (Initial) (&deg;C)", "cr3ea_blackjack")}
                                            ${this.renderIngRow(cycleNum, "Sponge (&deg;C)", "cr3ea_spongetemp")}
                                            ${this.renderIngRow(cycleNum, "Slurry (&deg;C)", "cr3ea_slurry")}
                                            ${this.renderIngRow(cycleNum, "Ground Sugar Temp (&deg;C)", "cr3ea_groundsugartemp")}
                                            ${this.renderIngRow(cycleNum, "Ground Sugar Particle Size (Mesh)", "cr3ea_groundsugarparticlesize")}
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
                                        <div class="form-group"><label>Supplier <span style="color: #ef4444; font-weight: bold;">*</span></label><input type="text" class="form-control" id="cr3ea_chocochipssupplier-${cycleNum}" /></div>
                                        <div class="form-group"><label>Temperature (&deg;C) <span style="color: #ef4444; font-weight: bold;">*</span></label><input type="text" class="form-control" id="cr3ea_chocochipstemp-${cycleNum}" /></div>
                                        <div class="form-group"><label>Count (Count/kg)</label><input type="text" class="form-control" id="cr3ea_chocochipscountperkg-${cycleNum}" /></div>
                                        <div class="form-group"><label>Mfg Date</label><input type="date" class="form-control" id="cr3ea_chocochipsmfgdate-${cycleNum}" /></div>
                                        <div class="form-group"><label>Compound/Pure</label><input type="text" class="form-control" id="cr3ea_chocochipscompoundorpure-${cycleNum}" /></div>
                                    </div>
                                    <div class="supplier-card">
                                        <h5>Cashew</h5>
                                        <div class="form-group"><label>Supplier <span style="color: #ef4444; font-weight: bold;">*</span></label><input type="text" class="form-control" id="cr3ea_cashewsupplier-${cycleNum}" /></div>
                                        <div class="form-group"><label>Temperature (&deg;C) <span style="color: #ef4444; font-weight: bold;">*</span></label><input type="text" class="form-control" id="cr3ea_cashewtemp-${cycleNum}" /></div>
                                        <div class="form-group"><label>Count (Count/kg)</label><input type="text" class="form-control" id="cr3ea_cashewcountperkg-${cycleNum}" /></div>
                                        <div class="form-group"><label>Mfg Date</label><input type="date" class="form-control" id="cr3ea_cashewmfgdate-${cycleNum}" /></div>
                                        <div class="form-group"><label>Compound/Pure</label><input type="text" class="form-control" id="cr3ea_cashewcompoundorpure-${cycleNum}" /></div>
                                    </div>
                                </div>

                                <div class="form-grid-three" style="margin-top:20px;">
                                    <div class="form-group">
                                        <label>Flour Supplier <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_floursupplier-${cycleNum}" placeholder="Enter Supplier" />
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Syrup & Blackjack Checks</h4>
                                <div class="table-responsive">
                                    <table class="table mb-standards-table">
                                        <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Temperature (&deg;C)</th>
                                                <th>pH</th>
                                                <th>Brix (&deg;Bx)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>Invert Syrup <span style="color: #ef4444; font-weight: bold;">*</span></strong></td>
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
                                        <label>Product Name <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_spongeproductname-${cycleNum}" placeholder="Sponge Product" />
                                    </div>
                                    <div class="form-group">
                                        <label>Water Quantity (kg/L) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_spongewaterquantity-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Yeast Quantity (kg)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongeyeastquantity-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Water Temp (&deg;C)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongewatertemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Mixing Time (min)</label>
                                        <input type="text" class="form-control" id="cr3ea_spongemixingtime-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Fermentation Start Temp (&deg;C)</label>
                                        <input type="text" class="form-control" id="cr3ea_fermentationstarttemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Room Temp (&deg;C)</label>
                                        <input type="text" class="form-control" id="cr3ea_fermentationroomtemp-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Final Temp After Fermentation (&deg;C)</label>
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
                                            ${this.renderMixingDoughRow(cycleNum, "Creaming Time (min)", "cr3ea_creamingtime", true)}
                                            ${this.renderMixingDoughRow(cycleNum, "Mixing Time (min)", "cr3ea_mixingtime")}
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Temp (&deg;C)", "cr3ea_doughtemp")}
                                            ${this.renderMixingDoughRow(cycleNum, "Jacket Temp (&deg;C)", "cr3ea_jackettemp")}
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
                                        <label>Moulding RPM / Strokes (RPM) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_moulderrpmstrokes-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Sample Count (bis) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_formingsamplecount-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Standard Wet Weight (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_standardwetweight-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Observed Wet Weight (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_observedwetweight-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight Before Sugar Sprinkling (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_weightbeforesugarsprinkling-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight After Sugar Sprinkling (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_weightaftersugarsprinkling-${cycleNum}" />
                                    </div>
                                </div>
                            </div>

                            <!-- TAB 4: BAKING & STANDARDS -->
                            <div class="mb-tab-pane" id="bake-s-${cycleNum}">
                                <h4 class="mb-section-title">Baking Time & Profile</h4>
                                <div class="form-grid-three">
                                    <div class="form-group">
                                        <label>Baking Time (min) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_bakingtime-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Baking Profile Taste <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_bakingprofiletaste-${cycleNum}" />
                                    </div>
                                    <div class="form-group checkbox-align">
                                        <label><input type="checkbox" id="cr3ea_bakingprofileaspertemplate-${cycleNum}" value="Yes" /> Profile As Per Template</label>
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Top Baking Temperatures (&deg;C)</h4>
                                ${this.renderZoneInputs(cycleNum, "top")}

                                <h4 class="mb-section-title" style="margin-top:20px;">Bottom Baking Temperatures (&deg;C)</h4>
                                ${this.renderZoneInputs(cycleNum, "bottom")}

                                <h4 class="mb-section-title" style="margin-top:20px;">QC Physical Standards</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label>Biscuit Length (mm) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitlength-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Width (mm) <span style="color: #ef4444; font-weight: bold;">*</span></label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitwidth-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Biscuit Diameter (mm)</label>
                                        <input type="text" class="form-control" id="cr3ea_biscuitdiameter-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Gauge (mm)</label>
                                        <input type="text" class="form-control" id="cr3ea_gauge-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Standards Sample Count (bis)</label>
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
                                    <div class="form-group">
                                        <label>Weight Before Oil (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_weightbeforeoil-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight After Oil Spray (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_weightafteroilspray-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Weight With Seasoning (g)</label>
                                        <input type="text" class="form-control" id="cr3ea_weightwithseasoning-${cycleNum}" />
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
                                                <td><strong>Top Colour <span style="color: #ef4444; font-weight: bold;">*</span></strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Bottom Colour</strong></td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Moisture (%)</strong></td>
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
                        <button type="button" class="bs-btn bs-btn-outline-secondary" style="padding: 10px 24px; font-weight: 600; font-size: 14px; border-radius: 8px;" onclick="window.location.reload()">Cancel</button>
                        <button type="button" id="complete-tour-form-btn-${cycleNum}" class="bs-btn bs-btn-success" style="padding: 12px 32px; font-weight: 700; font-size: 14px; border-radius: 8px; background-color: #10b981; color: #ffffff; border: none; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" onclick="MixingBaking_Checklist.completeCycleAndTour(${cycleNum})">
                            <i class="fa fa-check-circle me-1"></i> Complete Tour
                        </button>
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

    renderIngRow: function (cycleNum, label, baseName, isRequired = false) {
        const reqStar = isRequired ? '<span style="color: #ef4444; font-weight: bold; margin-left: 2px;">*</span>' : '';
        return `
            <tr>
                <td><strong>${label}${reqStar}</strong></td>
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

    renderMixingDoughRow: function (cycleNum, label, baseName, isRequired = false) {
        const reqStar = isRequired ? '<span style="color: #ef4444; font-weight: bold; margin-left: 2px;">*</span>' : '';
        return `
            <tr>
                <td><strong>${label}${reqStar}</strong></td>
                <td><input type="text" class="form-control" id="${baseName}standard-${cycleNum}" /></td>
                <td><input type="text" class="form-control" id="${baseName}observed-${cycleNum}" /></td>
            </tr>
        `;
    },

    renderZoneInputs: function (cycleNum, level) {
        let html = '<div class="zone-strip-container">';
        for (let i = 1; i <= 7; i++) {
            const reqStar = (i <= 2) ? '<span style="color: #ef4444; font-weight: bold; margin-left: 2px;">*</span>' : '';
            html += `
                <div class="zone-box-item">
                    <label class="zone-box-label">Zone ${i}${reqStar}</label>
                    <input type="text" class="form-control zone-box-input" id="cr3ea_${level}bakingtempzone${i}-${cycleNum}" placeholder="°C" />
                </div>
            `;
        }
        html += `
            <div class="zone-box-item zone-product-temp">
                <label class="zone-box-label">Prod Temp</label>
                <input type="text" class="form-control zone-box-input" id="cr3ea_${level}producttempafterbaking-${cycleNum}" placeholder="°C" />
            </div>
        `;
        html += '</div>';
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
        if (!pane || typeof pane.querySelectorAll !== "function") return false;

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
        if (!panel || typeof panel.querySelector !== "function") return;

        sections.forEach(paneId => {
            const isFilled = this.isSectionFilled(cycleNum, paneId);
            const btn = panel.querySelector(`.mb-tab-btn[onclick*="${paneId}"]`);
            if (btn && btn.classList) {
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

    // Validates that the first 2 fields in each section of each component tab are filled
    validateMandatoryFields: function (cycleNum) {
        const mandatoryFields = [
            // TAB 1: 1. Ingredient Quality
            // Section: Ingredient Temperature Checks
            { id: `cr3ea_rpostandard-${cycleNum}`, label: "RPO Standard", section: "Ingredient Temperature Checks", tabId: `ing-q-${cycleNum}`, tabName: "1. Ingredient Quality" },
            { id: `cr3ea_rpoobserved-${cycleNum}`, label: "RPO Observed", section: "Ingredient Temperature Checks", tabId: `ing-q-${cycleNum}`, tabName: "1. Ingredient Quality" },

            // TAB 2: 2. Material Quality
            // Section: Supplier & Custom Ingredients (Choco Chips)
            { id: `cr3ea_chocochipssupplier-${cycleNum}`, label: "Choco Chips Supplier", section: "Supplier & Custom Ingredients (Choco Chips)", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            { id: `cr3ea_chocochipstemp-${cycleNum}`, label: "Choco Chips Temperature", section: "Supplier & Custom Ingredients (Choco Chips)", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            // Section: Supplier & Custom Ingredients (Cashew)
            { id: `cr3ea_cashewsupplier-${cycleNum}`, label: "Cashew Supplier", section: "Supplier & Custom Ingredients (Cashew)", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            { id: `cr3ea_cashewtemp-${cycleNum}`, label: "Cashew Temperature", section: "Supplier & Custom Ingredients (Cashew)", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            // Section: Flour Supplier
            { id: `cr3ea_floursupplier-${cycleNum}`, label: "Flour Supplier", section: "Supplier & Custom Ingredients", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            // Section: Syrup & Blackjack Checks
            { id: `cr3ea_invertsyruptemp-${cycleNum}`, label: "Invert Syrup Temperature", section: "Syrup & Blackjack Checks", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },
            { id: `cr3ea_invertsyrupph-${cycleNum}`, label: "Invert Syrup pH", section: "Syrup & Blackjack Checks", tabId: `mat-q-${cycleNum}`, tabName: "2. Material Quality" },

            // TAB 3: 3. Mixing & Forming
            // Section: Mixing - Sponge Process
            { id: `cr3ea_spongeproductname-${cycleNum}`, label: "Sponge Product Name", section: "Mixing - Sponge Process", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },
            { id: `cr3ea_spongewaterquantity-${cycleNum}`, label: "Water Quantity (kg/L)", section: "Mixing - Sponge Process", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },
            // Section: Mixing - Dough Process
            { id: `cr3ea_creamingtimestandard-${cycleNum}`, label: "Creaming Time Standard", section: "Mixing - Dough Process", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },
            { id: `cr3ea_creamingtimeobserved-${cycleNum}`, label: "Creaming Time Observed", section: "Mixing - Dough Process", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },
            // Section: Forming & Moulding
            { id: `cr3ea_moulderrpmstrokes-${cycleNum}`, label: "Moulding RPM / Strokes", section: "Forming & Moulding", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },
            { id: `cr3ea_formingsamplecount-${cycleNum}`, label: "Sample Count", section: "Forming & Moulding", tabId: `mix-f-${cycleNum}`, tabName: "3. Mixing & Forming" },

            // TAB 4: 4. Baking & Standards
            // Section: Baking Time & Profile
            { id: `cr3ea_bakingtime-${cycleNum}`, label: "Baking Time (min)", section: "Baking Time & Profile", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            { id: `cr3ea_bakingprofiletaste-${cycleNum}`, label: "Baking Profile Taste", section: "Baking Time & Profile", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            // Section: Top Baking Temperatures (°C)
            { id: `cr3ea_topbakingtempzone1-${cycleNum}`, label: "Top Zone 1 Temp", section: "Top Baking Temperatures", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            { id: `cr3ea_topbakingtempzone2-${cycleNum}`, label: "Top Zone 2 Temp", section: "Top Baking Temperatures", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            // Section: Bottom Baking Temperatures (°C)
            { id: `cr3ea_bottombakingtempzone1-${cycleNum}`, label: "Bottom Zone 1 Temp", section: "Bottom Baking Temperatures", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            { id: `cr3ea_bottombakingtempzone2-${cycleNum}`, label: "Bottom Zone 2 Temp", section: "Bottom Baking Temperatures", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            // Section: QC Physical Standards
            { id: `cr3ea_biscuitlength-${cycleNum}`, label: "Biscuit Length (mm)", section: "QC Physical Standards", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            { id: `cr3ea_biscuitwidth-${cycleNum}`, label: "Biscuit Width (mm)", section: "QC Physical Standards", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            // Section: Quality & Moisture Parameters
            { id: `cr3ea_topcolourstandard-${cycleNum}`, label: "Top Colour Standard", section: "Quality & Moisture Parameters", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" },
            { id: `cr3ea_topcolourobserved-${cycleNum}`, label: "Top Colour Observed", section: "Quality & Moisture Parameters", tabId: `bake-s-${cycleNum}`, tabName: "4. Baking & Standards" }
        ];

        for (const item of mandatoryFields) {
            const el = document.getElementById(item.id);
            if (el) {
                const val = (el.value || "").trim();
                if (!val) {
                    return item; // first missing field
                }
            }
        }
        return null;
    },

    // Complete Cycle and Tour
    completeCycleAndTour: async function (cycleNum) {
        if (!MixingBaking_Main.state.canEditChecklist) {
            alert("Access Denied: Only the assigned QA Executive can complete this tour.");
            return;
        }

        // 0. Validation: Require that mandatory fields in each section are filled
        MixingBaking_Validator.clearAll(cycleNum);

        const missingMandatory = this.validateMandatoryFields(cycleNum);
        if (missingMandatory) {
            const panel = document.getElementById(`cycle-${cycleNum}`);
            const targetBtn = panel?.querySelector(`.mb-tab-btn[onclick*="${missingMandatory.tabId}"]`);
            if (targetBtn) {
                this.switchTab(targetBtn, cycleNum, missingMandatory.tabId);
            }
            const el = document.getElementById(missingMandatory.id);
            if (el) {
                MixingBaking_Validator.highlight(el, true);
                el.focus();
            }
            alert(`Please fill in the mandatory field:\n\n• ${missingMandatory.label} in "${missingMandatory.section}"\n(Tab: ${missingMandatory.tabName})\n\nIf this parameter is not applicable for this product, enter 'NA'.`);
            return;
        }

        const missingSections = this.validateFourSections(cycleNum);
        if (missingSections && missingSections.length > 0) {
            const missingList = missingSections.map(s => `- ${s.name}`).join("\n");
            alert(`Please fill in at least one field in each of the four sections before completing the tour:\n\n${missingList}`);

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
        const qcsList = ["biscuitlength", "biscuitwidth", "biscuitdiameter", "gauge", "standardssamplecount", "biscuitstdweight", "biscuitobservedweight", "weightbeforeoil", "weightafteroilspray", "weightwithseasoning"];
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
                const isNa = val.toUpperCase() === "NA" || val.toUpperCase() === "N/A" || val === "-";
                const isRangeOrUnit = /^[\d\.\s\-\±\'\"\:\%\(\)\/\,]+(min|mins|minutes|g|gm|gms|mm|cm|%|bis|biscuits|strokes|rpm|celsius|deg\s*c|°c)?$/i.test(val) || /as per/i.test(val) || /std/i.test(val) || /pure/i.test(val) || /compound/i.test(val) || /horizontal/i.test(val) || /vertical/i.test(val);
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
                    alert(`Please enter a valid numeric value or 'NA' for: ${f.name}`);
                    el.focus();
                    return;
                }
            }
        }

        const confirmComplete = confirm("Are you sure you want to complete this Quality Tour? This will save all cycle observations and lock the tour.");
        if (!confirmComplete) return;

        if (typeof ShowLoader === "function") ShowLoader();
        try {
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
            const dough = ["creamingtime", "mixingtime", "doughtemp", "jackettemp", "doughstandingtime"];
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

            // 4. Mark parent tour as Completed
            if (MixingBaking_Main.state.varTourID) {
                const parentPayload = {
                    cr3ea_status: "Completed",
                    cr3ea_processstatus: "Completed"
                };
                await MixingBaking_DAL.updateParentTour(MixingBaking_Main.state.varTourID, parentPayload);
            }

            alert("Quality Tour completed and locked successfully!");
            
            // Redirect back to Home Dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
            window.location.href = homeUrl;

        } catch (err) {
            console.error("Failed to complete tour and save cycle data:", err);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "complete tour")
                : ("Failed to complete tour: " + err.message);
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    saveCycle: function (cycleNum) {
        return this.completeCycleAndTour(cycleNum);
    },

    // Render read-only cycle summary block
    renderCompletedSection: function (cycleNum, cycleData) {
        const completedDiv = document.getElementById(`completed-step-${cycleNum}`);
        if (!completedDiv) return;

        const val = (v) => {
            if (v === undefined || v === null) return '<span class="mb-val-empty">-</span>';
            let s = String(v).trim();
            if (!s || s === '-') return '<span class="mb-val-empty">-</span>';
            if (s.toUpperCase() === 'NA') return '<span class="mb-val-na">NA</span>';
            // Clean trailing unit words from older raw records so units don't duplicate with label
            s = s.replace(/\s*(?:min|mins|minutes|°c|c|kg\/l|kg|g|gm|gms|mm|%|bis|pcs|mesh|strokes|rpm)\b/gi, '').trim();
            if (!s || s === '-') return '<span class="mb-val-empty">-</span>';
            return s;
        };

        const metricVal = (v, unit = '') => {
            if (v === undefined || v === null) return '<span class="mb-val-empty">-</span>';
            let s = String(v).trim();
            if (!s || s === '-') return '<span class="mb-val-empty">-</span>';
            if (s.toUpperCase() === 'NA') return '<span class="mb-val-na">NA</span>';
            // Clean unit from raw value before appending stylized unit tag
            s = s.replace(/\s*(?:min|mins|minutes|°c|c|kg\/l|kg|g|gm|gms|mm|%|bis|pcs|mesh|strokes|rpm)\b/gi, '').trim();
            if (!s || s === '-') return '<span class="mb-val-empty">-</span>';
            return `<strong>${s}</strong>${unit ? `<span class="mb-stat-unit" style="margin-left:2px;">${unit}</span>` : ''}`;
        };

        completedDiv.innerHTML = `
            <div class="mb-summary-wrapper">
                <div class="mb-summary-header">
                    <div class="mb-summary-header-left">
                        <div class="mb-summary-icon-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 11l3 3L22 4"></path>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                        </div>
                        <div>
                            <h5 class="mb-summary-title">Cycle ${cycleNum} Saved Details Summary</h5>
                            <p class="mb-summary-subtitle">Quality Parameters Recorded & Verified</p>
                        </div>
                    </div>
                    <span class="mb-summary-status-badge">
                        <span class="mb-summary-status-dot"></span>
                        Submitted & Locked
                    </span>
                </div>

                <!-- TAB NAVIGATION FOR COMPLETED CYCLE (Modern segmented control) -->
                <div class="mb-summary-tabs-nav">
                    <button type="button" class="mb-summary-tab-btn active comp-tab-btn-${cycleNum}" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-ing-q-${cycleNum}')">
                        <span class="mb-tab-num">1</span> Ingredient Quality
                    </button>
                    <button type="button" class="mb-summary-tab-btn comp-tab-btn-${cycleNum}" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mat-q-${cycleNum}')">
                        <span class="mb-tab-num">2</span> Material Quality
                    </button>
                    <button type="button" class="mb-summary-tab-btn comp-tab-btn-${cycleNum}" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mix-f-${cycleNum}')">
                        <span class="mb-tab-num">3</span> Mixing & Forming
                    </button>
                    <button type="button" class="mb-summary-tab-btn comp-tab-btn-${cycleNum}" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-bake-s-${cycleNum}')">
                        <span class="mb-tab-num">4</span> Baking & Standards
                    </button>
                </div>
                
                <div class="summary-sections-container">
                    
                    <!-- TAB 1: INGREDIENT QUALITY -->
                    <div class="comp-tab-pane-${cycleNum} mb-summary-pane" id="comp-ing-q-${cycleNum}" style="display: block;">
                        <div class="mb-summary-pane-header">
                            <span class="accent-bar"></span> 1. Ingredient Quality & Temperatures (&deg;C)
                        </div>
                        
                        <div class="mb-summary-table-wrapper">
                            <table class="mb-summary-table">
                                <thead>
                                    <tr>
                                        <th style="width: 24%;">Ingredient</th>
                                        <th style="width: 16%;">Standard (&deg;C)</th>
                                        <th style="width: 16%;">Observed (&deg;C)</th>
                                        <th style="width: 22%;">Remarks</th>
                                        <th style="width: 22%;">Action Taken</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[
                                        { label: "RPO (°C)", key: "cr3ea_rpo" },
                                        { label: "Solid Fat (°C)", key: "cr3ea_solidfat" },
                                        { label: "Butter (°C)", key: "cr3ea_butter" },
                                        { label: "Blackjack (Initial) (°C)", key: "cr3ea_blackjack" },
                                        { label: "Sponge (°C)", key: "cr3ea_spongetemp" },
                                        { label: "Slurry (°C)", key: "cr3ea_slurry" },
                                        { label: "Ground Sugar Temp (°C)", key: "cr3ea_groundsugartemp" },
                                        { label: "Ground Sugar Particle (Mesh)", key: "cr3ea_groundsugarparticlesize" }
                                    ].map((item) => `
                                        <tr>
                                            <td style="font-weight: 700; color: #1e293b;">${item.label}</td>
                                            <td><span class="mb-standard-pill">${val(cycleData[item.key + "standard"])}</span></td>
                                            <td><span class="mb-observed-val">${val(cycleData[item.key + "observed"])}</span></td>
                                            <td>${val(cycleData[item.key + "remarks"])}</td>
                                            <td>${val(cycleData[item.key + "actiontaken"])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="mb-summary-card" style="margin-top: 14px;">
                            <div class="mb-summary-card-title">
                                <span>Minor Ingredients Checklist</span>
                                <span style="font-size: 11px; font-weight: 600; color: #64748b;">Verification Status</span>
                            </div>
                            <div class="mb-minor-grid">
                                ${[
                                    { label: "Cocoa Powder", key: "cr3ea_cocoapowderdone" },
                                    { label: "SMP", key: "cr3ea_smpdone" },
                                    { label: "Salt 1", key: "cr3ea_salt1done" },
                                    { label: "ABC", key: "cr3ea_abcdone" },
                                    { label: "SBC", key: "cr3ea_sbcdone" },
                                    { label: "Salt 2", key: "cr3ea_salt2done" },
                                    { label: "Others", key: "cr3ea_othersdone" }
                                ].map(item => {
                                    const rawVal = cycleData[item.key];
                                    const isDone = rawVal === "Done";
                                    const isNa = rawVal === "NA";
                                    let badgeClass = isDone ? "is-done" : "is-not-done";
                                    let icon = isDone ? "✓" : "✕";
                                    let text = rawVal || "Not Done";
                                    return `<span class="mb-minor-badge ${badgeClass}">
                                        <span>${icon}</span>
                                        <strong>${item.label}:</strong> ${text}
                                    </span>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: MATERIAL QUALITY -->
                    <div class="comp-tab-pane-${cycleNum} mb-summary-pane" id="comp-mat-q-${cycleNum}" style="display: none;">
                        <div class="mb-summary-pane-header">
                            <span class="accent-bar"></span> 2. Material Quality & Sponge Parameters
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 16px;">
                            <!-- Supplier Details -->
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Supplier Details</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                
                                <div class="mb-stat-tile" style="margin-bottom: 12px;">
                                    <div class="mb-stat-label">Flour Supplier</div>
                                    <div class="mb-stat-value" style="font-size: 14px; color: #1e293b;">${val(cycleData.cr3ea_floursupplier)}</div>
                                </div>

                                <div style="border-top: 1px solid #f1f5f9; padding-top: 10px; margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                        <div class="mb-stat-label">Choco Chips Supplier</div>
                                        <span style="font-size: 12.5px; font-weight: 700; color: #0f172a;">${val(cycleData.cr3ea_chocochipssupplier)}</span>
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                        <span class="mb-pill mb-pill-temp">Temp: <strong>${val(cycleData.cr3ea_chocochipstemp)}°C</strong></span>
                                        <span class="mb-pill mb-pill-count">Count: <strong>${val(cycleData.cr3ea_chocochipscountperkg)}/kg</strong></span>
                                        <span class="mb-pill mb-pill-type">Type: <strong>${val(cycleData.cr3ea_chocochipscompoundorpure)}</strong></span>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid #f1f5f9; padding-top: 10px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                        <div class="mb-stat-label">Cashew Supplier</div>
                                        <span style="font-size: 12.5px; font-weight: 700; color: #0f172a;">${val(cycleData.cr3ea_cashewsupplier)}</span>
                                    </div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                        <span class="mb-pill mb-pill-temp">Temp: <strong>${val(cycleData.cr3ea_cashewtemp)}°C</strong></span>
                                        <span class="mb-pill mb-pill-count">Count: <strong>${val(cycleData.cr3ea_cashewcountperkg)}/kg</strong></span>
                                        <span class="mb-pill mb-pill-type">Type: <strong>${val(cycleData.cr3ea_cashewcompoundorpure)}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Syrups & Liquids -->
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Syrups & Liquids</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                                </div>
                                
                                <div style="margin-bottom: 14px;">
                                    <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Invert Syrup Parameters</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                        <span class="mb-pill mb-pill-temp">Temp: <strong>${val(cycleData.cr3ea_invertsyruptemp)}°C</strong></span>
                                        <span class="mb-pill mb-pill-ph">pH: <strong>${val(cycleData.cr3ea_invertsyrupph)}</strong></span>
                                        <span class="mb-pill mb-pill-brix">Brix: <strong>${val(cycleData.cr3ea_invertsyrupbrix)}°Bx</strong></span>
                                    </div>
                                </div>

                                <div style="border-top: 1px solid #f1f5f9; padding-top: 12px;">
                                    <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Blackjack (2nd Stage)</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                        <span class="mb-pill mb-pill-temp">Temp: <strong>${val(cycleData.cr3ea_blackjack2temp)}°C</strong></span>
                                        <span class="mb-pill mb-pill-ph">pH: <strong>${val(cycleData.cr3ea_blackjack2ph)}</strong></span>
                                        <span class="mb-pill mb-pill-brix">Brix: <strong>${val(cycleData.cr3ea_blackjack2brix)}°Bx</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sponge Parameters Full Width Card -->
                        <div class="mb-summary-card">
                            <div class="mb-summary-card-title">
                                <span>Mixing Sponge Parameters</span>
                                <span style="font-size: 11px; font-weight: 600; color: #64748b;">Stage Formulation & Outcomes</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                                <div class="mb-stat-tile">
                                    <div class="mb-stat-label">Sponge Name</div>
                                    <div class="mb-stat-value">${val(cycleData.cr3ea_spongeproductname)}</div>
                                </div>
                                <div class="mb-stat-tile">
                                    <div class="mb-stat-label">Water Quantity</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_spongewaterquantity, 'kg')}</div>
                                </div>
                                <div class="mb-stat-tile">
                                    <div class="mb-stat-label">Yeast Quantity</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_spongeyeastquantity, 'kg')}</div>
                                </div>
                                <div class="mb-stat-tile is-temp">
                                    <div class="mb-stat-label">Water Temp</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_spongewatertemp, '°C')}</div>
                                </div>
                                <div class="mb-stat-tile">
                                    <div class="mb-stat-label">Mixing Time</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_spongemixingtime, 'min')}</div>
                                </div>
                                <div class="mb-stat-tile is-temp">
                                    <div class="mb-stat-label">Ferm. Start Temp</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_fermentationstarttemp, '°C')}</div>
                                </div>
                                <div class="mb-stat-tile is-temp">
                                    <div class="mb-stat-label">Ferm. Room Temp</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_fermentationroomtemp, '°C')}</div>
                                </div>
                                <div class="mb-stat-tile is-temp">
                                    <div class="mb-stat-label">Final Temp (After Ferm)</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_finaltempafterfermentation, '°C')}</div>
                                </div>
                                <div class="mb-stat-tile">
                                    <div class="mb-stat-label">Final pH</div>
                                    <div class="mb-stat-value">${metricVal(cycleData.cr3ea_finalphafterfermentation)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: MIXING & FORMING -->
                    <div class="comp-tab-pane-${cycleNum} mb-summary-pane" id="comp-mix-f-${cycleNum}" style="display: none;">
                        <div class="mb-summary-pane-header">
                            <span class="accent-bar"></span> 3. Mixing Dough & Forming Stage
                        </div>
                        
                        <div class="mb-summary-table-wrapper">
                            <table class="mb-summary-table">
                                <thead>
                                    <tr>
                                        <th style="width: 44%;">Dough Parameter</th>
                                        <th style="width: 28%;">Standard</th>
                                        <th style="width: 28%;">Observed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[
                                        { label: "Creaming Time (min)", key: "cr3ea_creamingtime" },
                                        { label: "Mixing Time (min)", key: "cr3ea_mixingtime" },
                                        { label: "Dough Temperature (°C)", key: "cr3ea_doughtemp" },
                                        { label: "Jacket of Mixer Temperature (°C)", key: "cr3ea_jackettemp" },
                                        { label: "Dough Consistency", key: "cr3ea_doughconsistency" },
                                        { label: "Dough Standing Time (min)", key: "cr3ea_doughstandingtime" }
                                    ].map((item) => `
                                        <tr>
                                            <td style="font-weight: 700; color: #1e293b;">${item.label}</td>
                                            <td><span class="mb-standard-pill">${val(cycleData[item.key + "standard"])}</span></td>
                                            <td><span class="mb-observed-val">${val(cycleData[item.key + "observed"])}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 14px;">
                            <div class="mb-summary-card" style="display: flex; align-items: center; gap: 14px;">
                                <div class="mb-summary-icon-badge" style="background: #f1f5f9; color: #475569; width: 44px; height: 44px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                </div>
                                <div>
                                    <div class="mb-stat-label">Mixer Type</div>
                                    <div style="font-size: 15px; color: #0f172a; font-weight: 800; margin-top: 2px;">${val(cycleData.cr3ea_typeofmixer)}</div>
                                </div>
                            </div>

                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Forming Details</span>
                                    <span style="font-size: 11px; font-weight: 600; color: #64748b;">Moulding & Weights</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px;">
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Moulder RPM</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_moulderrpmstrokes, 'RPM')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Sample Count</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_formingsamplecount, 'bis')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Wet Wt (Std)</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_standardwetweight, 'g')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Wet Wt (Obs)</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_observedwetweight, 'g')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Wt Before Sugar</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_weightbeforesugarsprinkling, 'g')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Wt After Sugar</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_weightaftersugarsprinkling, 'g')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: BAKING & STANDARDS -->
                    <div class="comp-tab-pane-${cycleNum} mb-summary-pane" id="comp-bake-s-${cycleNum}" style="display: none;">
                        <div class="mb-summary-pane-header">
                            <span class="accent-bar"></span> 4. Baking Stage & Physical Standards
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Baking Settings</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Baking Time</div>
                                        <div class="mb-stat-value">${val(cycleData.cr3ea_bakingtime)}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Taste Profile</div>
                                        <div class="mb-stat-value">${val(cycleData.cr3ea_bakingprofiletaste)}</div>
                                    </div>
                                    <div class="mb-stat-tile" style="grid-column: 1 / -1;">
                                        <div class="mb-stat-label">As Per Template</div>
                                        <div style="margin-top: 2px;">
                                            <span class="mb-pill ${cycleData.cr3ea_bakingprofileaspertemplate === 'Yes' ? 'mb-pill-type' : 'mb-pill-count'}">
                                                ${val(cycleData.cr3ea_bakingprofileaspertemplate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Product Temperatures after Baking</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div class="mb-stat-tile is-temp">
                                        <div class="mb-stat-label">Top Product Temp</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_topproducttempafterbaking, '°C')}</div>
                                    </div>
                                    <div class="mb-stat-tile is-temp">
                                        <div class="mb-stat-label">Bottom Product Temp</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_bottomproducttempafterbaking, '°C')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Baking Zone Temperatures Modern Strip -->
                        <div class="mb-summary-card" style="margin-bottom: 16px;">
                            <div class="mb-summary-card-title">
                                <span>Baking Zone Temperatures (°C)</span>
                                <span style="font-size: 11px; font-weight: 600; color: #64748b;">Zones 1 through 7</span>
                            </div>

                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Top Zone Temperatures:</div>
                                <div class="mb-summary-zone-grid">
                                    ${[1,2,3,4,5,6,7].map(i => `
                                        <div class="mb-summary-zone-item">
                                            <span class="mb-summary-zone-name">Z${i}</span>
                                            <span class="mb-summary-zone-val">${val(cycleData[`cr3ea_topbakingtempzone${i}`])}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div style="border-top: 1px solid #f1f5f9; padding-top: 10px;">
                                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 4px;">Bottom Zone Temperatures:</div>
                                <div class="mb-summary-zone-grid">
                                    ${[1,2,3,4,5,6,7].map(i => `
                                        <div class="mb-summary-zone-item">
                                            <span class="mb-summary-zone-name">Z${i}</span>
                                            <span class="mb-summary-zone-val">${val(cycleData[`cr3ea_bottombakingtempzone${i}`])}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 8px;">
                            <!-- Biscuit Physical Standards -->
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Biscuit Physical Standards</span>
                                    <span style="font-size: 11px; font-weight: 600; color: #64748b;">Dimensions & Weights</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Length</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_biscuitlength, 'mm')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Width</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_biscuitwidth, 'mm')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Diameter</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_biscuitdiameter, 'mm')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Sample Count</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_standardssamplecount, 'bis')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Std Weight</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_biscuitstdweight, 'g')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Obs. Weight</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_biscuitobservedweight, 'g')}</div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Wt After Oil</div>
                                        <div class="mb-stat-value">${metricVal(cycleData.cr3ea_weightafteroilspray, 'g')}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quality & Moisture Parameters -->
                            <div class="mb-summary-card">
                                <div class="mb-summary-card-title">
                                    <span>Quality & Moisture</span>
                                    <span style="font-size: 11px; font-weight: 600; color: #64748b;">Color & Moisture</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Top Colour (Std / Obs)</div>
                                        <div class="mb-stat-value" style="font-size: 12.5px;">${val(cycleData.cr3ea_topcolourstandard)} / <strong>${val(cycleData.cr3ea_topcolourobserved)}</strong></div>
                                    </div>
                                    <div class="mb-stat-tile">
                                        <div class="mb-stat-label">Bottom Colour (Std / Obs)</div>
                                        <div class="mb-stat-value" style="font-size: 12.5px;">${val(cycleData.cr3ea_bottomcolourstandard)} / <strong>${val(cycleData.cr3ea_bottomcolourobserved)}</strong></div>
                                    </div>
                                    <div class="mb-stat-tile" style="grid-column: 1 / -1;">
                                        <div class="mb-stat-label">Moisture % (Std / Obs)</div>
                                        <div class="mb-stat-value" style="font-size: 13.5px; color: #0284c7;">${val(cycleData.cr3ea_moisturestandard)}% / <strong>${val(cycleData.cr3ea_moistureobserved)}%</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Document Attachment Section -->
                        <div id="mb-attachment-container-${cycleNum}-${cycleData.cr3ea_prod_rajpura_mixingandbakingid}" style="margin-top: 16px; padding: 14px 18px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 10px; font-size: 13px;">
                            <span style="color: #64748b;">Checking for uploaded tour document...</span>
                        </div>
                    </div>

                </div>
                <p style="margin-top:20px; font-size:11.5px; color:#64748b; font-style: italic; border-top: 1px solid #f1f5f9; padding-top: 12px; display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    To review complete records or export detailed Excel/PDF reports, please visit the central HOD/PM plant tour dashboard.
                </p>
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
                                    <strong style="color: #1e293b; font-size: 13px;">${file.Title}</strong>
                                </div>
                                <a href="${file.FileRef}" target="_blank" class="bs-btn" style="padding: 6px 14px; font-size: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(37,99,235,0.2);">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    View Attached Document
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
            b.classList.remove("active");
        });
        
        // Highlight active button
        btn.classList.add("active");
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

        // If active uncompleted cycle form exists on page, trigger completeCycleAndTour
        const activeForm = document.getElementById("cycle-1");
        if (activeForm && !activeForm.classList.contains("completed-cycle")) {
            return this.completeCycleAndTour(1);
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

        // Helper to safely format standard value
        const sanitizeStandardValue = (val) => {
            if (val === undefined || val === null) return "";
            if (typeof val === "boolean") return val;
            let str = String(val).trim();
            if (str === "" || str === "-") {
                return "NA";
            }
            return str;
        };

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) {
                if (val === undefined || val === null) return;
                el.value = sanitizeStandardValue(val);
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
            "cr3ea_rpoobserved", "cr3ea_solidfatobserved", "cr3ea_butterobserved", "cr3ea_blackjackobserved", "cr3ea_spongetempobserved", "cr3ea_slurryobserved", "cr3ea_groundsugartempobserved", "cr3ea_groundsugarparticlesizeobserved",
            "cr3ea_chocochipssupplier", "cr3ea_chocochipstemp", "cr3ea_chocochipscountperkg", "cr3ea_chocochipscompoundorpure",
            "cr3ea_cashewsupplier", "cr3ea_cashewtemp", "cr3ea_cashewcountperkg", "cr3ea_cashewcompoundorpure",
            "cr3ea_floursupplier", "cr3ea_invertsyruptemp", "cr3ea_invertsyrupph", "cr3ea_invertsyrupbrix", "cr3ea_blackjack2temp", "cr3ea_blackjack2ph", "cr3ea_blackjack2brix",
            "cr3ea_spongeproductname", "cr3ea_spongewaterquantity", "cr3ea_spongeyeastquantity", "cr3ea_spongewatertemp", "cr3ea_spongemixingtime", "cr3ea_fermentationstarttemp", "cr3ea_fermentationroomtemp", "cr3ea_finaltempafterfermentation", "cr3ea_finalphafterfermentation",
            "cr3ea_creamingtimestandard", "cr3ea_creamingtimeobserved", "cr3ea_mixingtimestandard", "cr3ea_mixingtimeobserved", "cr3ea_doughtempstandard", "cr3ea_doughtempobserved", "cr3ea_doughstandingtimestandard", "cr3ea_doughstandingtimeobserved", "cr3ea_doughconsistency",
            "cr3ea_moulderrpmstrokes", "cr3ea_formingsamplecount", "cr3ea_standardwetweight",
            "cr3ea_bakingtime", "cr3ea_bakingprofiletaste", "cr3ea_biscuitlength", "cr3ea_biscuitwidth", "cr3ea_biscuitdiameter", "cr3ea_gauge", "cr3ea_standardssamplecount", "cr3ea_biscuitstdweight",
            "cr3ea_topcolourstandard", "cr3ea_topcolourobserved", "cr3ea_bottomcolourstandard", "cr3ea_bottomcolourobserved",
            "cr3ea_moisturestandard", "cr3ea_weightbeforeoil", "cr3ea_weightafteroilspray", "cr3ea_weightwithseasoning"
        ];
        fieldsToClear.forEach(f => {
            const el = document.getElementById(`${f}-${cycleNum}`);
            if (el) el.value = "";
        });

        // Lookup recipe dynamically from memory state or seed defaults
        const allRecipes = (typeof MixingBaking_Main !== "undefined" && MixingBaking_Main.state && MixingBaking_Main.state.recipes && MixingBaking_Main.state.recipes.length > 0)
            ? MixingBaking_Main.state.recipes
            : ((typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA)) ? MB_RECIPES_SEED_DATA : []);

        const clean = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const target = clean(product);

        // 1. Direct match on display title or title or variety
        let recipe = allRecipes.find(r => {
            const skuStr = (r.skuRaw || (Array.isArray(r.sku) ? r.sku.join(", ") : "") || "").trim();
            const title = (r.title || r.variety || "").trim();
            const displayTitle = (skuStr && skuStr !== "-" && skuStr.toUpperCase() !== "NA" && !title.toLowerCase().includes(skuStr.toLowerCase()))
                ? `${title} (${skuStr})`
                : title;
            return clean(displayTitle) === target || clean(r.title) === target || clean(r.variety) === target;
        });

        // 2. Combined title + SKU check
        if (!recipe) {
            recipe = allRecipes.find(r => clean(`${r.title} ${r.skuRaw || ""}`) === target);
        }

        // 3. Fallback substring match
        if (!recipe) {
            recipe = allRecipes.find(r => {
                const rTitle = clean(r.title || r.variety || "");
                return rTitle && (target.includes(rTitle) || rTitle.includes(target));
            });
        }

        if (!recipe || (!recipe.standards && typeof recipe !== "object")) {
            console.warn(`No configured recipe standards found for product "${product}".`);
            return;
        }

        const standards = recipe.standards || recipe;
        this.applyRecipeStandards(cycleNum, standards, setVal, setChecked);
        this.updateSectionTabIndicators(cycleNum);
    },

    applyRecipeStandards: function (cycleNum, s, setVal, setChecked) {
        if (!s || typeof s !== "object") return;

        // Helper to check if a value is NA / empty / not applicable
        const isNA = (v) => {
            if (v === undefined || v === null) return true;
            const str = String(v).trim().toUpperCase();
            return str === "" || str === "NA" || str === "N/A" || str === "-";
        };

        // 1. Ingredient Temperatures Standard
        const rpoStd = s.rpoStandard !== undefined ? s.rpoStandard : (s.rpo !== undefined ? s.rpo : "45");
        const solidFatStd = s.solidFatStandard !== undefined ? s.solidFatStandard : (s.solidFat !== undefined ? s.solidFat : "NA");
        const butterStd = s.butterStandard !== undefined ? s.butterStandard : (s.butter !== undefined ? s.butter : "NA");
        const blackJackStd = s.blackJackStandard !== undefined ? s.blackJackStandard : (s.blackJack !== undefined ? s.blackJack : "NA");
        const spongeTempStd = s.spongeTempStandard !== undefined ? s.spongeTempStandard : (s.spongeTemp !== undefined ? s.spongeTemp : "NA");
        const slurryStd = s.slurryStandard !== undefined ? s.slurryStandard : (s.slurry !== undefined ? s.slurry : "NA");
        const groundSugarTempStd = s.groundSugarTempStandard !== undefined ? s.groundSugarTempStandard : (s.groundSugarTemp !== undefined ? s.groundSugarTemp : "NA");
        const groundSugarParticleStd = s.groundSugarParticleSizeStandard !== undefined ? s.groundSugarParticleSizeStandard : (s.groundSugarParticleSize !== undefined ? s.groundSugarParticleSize : "NA");

        setVal(`cr3ea_rpostandard-${cycleNum}`, rpoStd);
        setVal(`cr3ea_solidfatstandard-${cycleNum}`, solidFatStd);
        setVal(`cr3ea_butterstandard-${cycleNum}`, butterStd);
        setVal(`cr3ea_blackjackstandard-${cycleNum}`, blackJackStd);
        setVal(`cr3ea_spongetempstandard-${cycleNum}`, spongeTempStd);
        setVal(`cr3ea_slurrystandard-${cycleNum}`, slurryStd);
        setVal(`cr3ea_groundsugartempstandard-${cycleNum}`, groundSugarTempStd);
        setVal(`cr3ea_groundsugarparticlesizestandard-${cycleNum}`, groundSugarParticleStd);

        // 2. Observed fields auto-set to "NA" if not applicable
        setVal(`cr3ea_rpoobserved-${cycleNum}`, s.rpoObserved !== undefined ? s.rpoObserved : (isNA(rpoStd) ? "NA" : ""));
        setVal(`cr3ea_solidfatobserved-${cycleNum}`, s.solidFatObserved !== undefined ? s.solidFatObserved : (isNA(solidFatStd) ? "NA" : ""));
        setVal(`cr3ea_butterobserved-${cycleNum}`, s.butterObserved !== undefined ? s.butterObserved : (isNA(butterStd) ? "NA" : ""));
        setVal(`cr3ea_blackjackobserved-${cycleNum}`, s.blackJackObserved !== undefined ? s.blackJackObserved : (isNA(blackJackStd) ? "NA" : ""));
        setVal(`cr3ea_spongetempobserved-${cycleNum}`, s.spongeTempObserved !== undefined ? s.spongeTempObserved : (isNA(spongeTempStd) ? "NA" : ""));
        setVal(`cr3ea_slurryobserved-${cycleNum}`, s.slurryObserved !== undefined ? s.slurryObserved : (isNA(slurryStd) ? "NA" : ""));
        setVal(`cr3ea_groundsugartempobserved-${cycleNum}`, s.groundSugarTempObserved !== undefined ? s.groundSugarTempObserved : (isNA(groundSugarTempStd) ? "NA" : ""));
        setVal(`cr3ea_groundsugarparticlesizeobserved-${cycleNum}`, s.groundSugarParticleSizeObserved !== undefined ? s.groundSugarParticleSizeObserved : (isNA(groundSugarParticleStd) ? "NA" : ""));

        // 3. Raw Material Suppliers
        setVal(`cr3ea_chocochipssupplier-${cycleNum}`, s.chocoChipsSupplier !== undefined ? s.chocoChipsSupplier : "NA");
        setVal(`cr3ea_chocochipstemp-${cycleNum}`, s.chocoChipsTemp !== undefined ? s.chocoChipsTemp : "NA");
        setVal(`cr3ea_chocochipscountperkg-${cycleNum}`, s.chocoChipsCountPerKg !== undefined ? s.chocoChipsCountPerKg : "NA");
        setVal(`cr3ea_chocochipscompoundorpure-${cycleNum}`, s.chocoChipsCompoundOrPure !== undefined ? s.chocoChipsCompoundOrPure : "NA");

        setVal(`cr3ea_cashewsupplier-${cycleNum}`, s.cashewSupplier !== undefined ? s.cashewSupplier : "NA");
        setVal(`cr3ea_cashewtemp-${cycleNum}`, s.cashewTemp !== undefined ? s.cashewTemp : "NA");
        setVal(`cr3ea_cashewcountperkg-${cycleNum}`, s.cashewCountPerKg !== undefined ? s.cashewCountPerKg : "NA");
        setVal(`cr3ea_cashewcompoundorpure-${cycleNum}`, s.cashewCompoundOrPure !== undefined ? s.cashewCompoundOrPure : "NA");

        setVal(`cr3ea_floursupplier-${cycleNum}`, s.flourSupplier !== undefined ? s.flourSupplier : "Amul / In-house");

        // 4. Syrups & Liquid Sugars
        setVal(`cr3ea_invertsyruptemp-${cycleNum}`, s.invertSyrupTemp !== undefined ? s.invertSyrupTemp : "NA");
        setVal(`cr3ea_invertsyrupph-${cycleNum}`, s.invertSyrupPh !== undefined ? s.invertSyrupPh : "NA");
        setVal(`cr3ea_invertsyrupbrix-${cycleNum}`, s.invertSyrupBrix !== undefined ? s.invertSyrupBrix : "NA");
        setVal(`cr3ea_blackjack2temp-${cycleNum}`, s.blackJack2Temp !== undefined ? s.blackJack2Temp : "NA");
        setVal(`cr3ea_blackjack2ph-${cycleNum}`, s.blackJack2Ph !== undefined ? s.blackJack2Ph : "NA");
        setVal(`cr3ea_blackjack2brix-${cycleNum}`, s.blackJack2Brix !== undefined ? s.blackJack2Brix : "NA");

        // 5. Sponge & Fermentation
        setVal(`cr3ea_spongeproductname-${cycleNum}`, s.spongeProductName !== undefined ? s.spongeProductName : (s.variety || "NA"));
        setVal(`cr3ea_spongewaterquantity-${cycleNum}`, s.spongeWaterQuantity !== undefined ? s.spongeWaterQuantity : "NA");
        setVal(`cr3ea_spongeyeastquantity-${cycleNum}`, s.spongeYeastQuantity !== undefined ? s.spongeYeastQuantity : "NA");
        setVal(`cr3ea_spongewatertemp-${cycleNum}`, s.spongeWaterTemp !== undefined ? s.spongeWaterTemp : "NA");
        setVal(`cr3ea_spongemixingtime-${cycleNum}`, s.spongeMixingTime !== undefined ? s.spongeMixingTime : "NA");
        setVal(`cr3ea_fermentationstarttemp-${cycleNum}`, s.fermentationStartTemp !== undefined ? s.fermentationStartTemp : "NA");
        setVal(`cr3ea_fermentationroomtemp-${cycleNum}`, s.fermentationRoomTemp !== undefined ? s.fermentationRoomTemp : "NA");
        setVal(`cr3ea_finaltempafterfermentation-${cycleNum}`, s.finalTempAfterFermentation !== undefined ? s.finalTempAfterFermentation : "NA");
        setVal(`cr3ea_finalphafterfermentation-${cycleNum}`, s.finalPhAfterFermentation !== undefined ? s.finalPhAfterFermentation : "NA");

        // 6. Dough Mixing Standards
        setVal(`cr3ea_creamingtimestandard-${cycleNum}`, s.creamingTimeStandard !== undefined ? s.creamingTimeStandard : "10 min");
        if (s.creamingTimeObserved !== undefined) setVal(`cr3ea_creamingtimeobserved-${cycleNum}`, s.creamingTimeObserved);
        setVal(`cr3ea_mixingtimestandard-${cycleNum}`, s.mixingTimeStandard !== undefined ? s.mixingTimeStandard : "5 Min");
        if (s.mixingTimeObserved !== undefined) setVal(`cr3ea_mixingtimeobserved-${cycleNum}`, s.mixingTimeObserved);
        setVal(`cr3ea_doughtempstandard-${cycleNum}`, s.doughTempStandard !== undefined ? s.doughTempStandard : "32-35");
        if (s.doughTempObserved !== undefined) setVal(`cr3ea_doughtempobserved-${cycleNum}`, s.doughTempObserved);
        setVal(`cr3ea_doughstandingtimestandard-${cycleNum}`, s.doughStandingTimeStandard !== undefined ? s.doughStandingTimeStandard : "10 Min");
        if (s.doughStandingTimeObserved !== undefined) setVal(`cr3ea_doughstandingtimeobserved-${cycleNum}`, s.doughStandingTimeObserved);
        setVal(`cr3ea_doughconsistency-${cycleNum}`, s.doughConsistency !== undefined ? s.doughConsistency : "Smooth / Homogeneous");

        // 7. Forming & Moulding
        setVal(`cr3ea_moulderrpmstrokes-${cycleNum}`, s.moulderRpmStrokes !== undefined ? s.moulderRpmStrokes : "NA");
        const formingCount = s.formingSampleCount !== undefined ? s.formingSampleCount : (s.numberOfBiscuits !== undefined ? s.numberOfBiscuits : "10");
        setVal(`cr3ea_formingsamplecount-${cycleNum}`, formingCount);
        setVal(`cr3ea_standardwetweight-${cycleNum}`, s.standardWetWeight !== undefined ? s.standardWetWeight : "NA");

        // 8. Baking Profile
        setVal(`cr3ea_bakingtime-${cycleNum}`, s.bakingTime !== undefined ? s.bakingTime : "4'45\"");
        setVal(`cr3ea_bakingprofiletaste-${cycleNum}`, s.bakingProfileTaste !== undefined ? s.bakingProfileTaste : "Standard / Normal");
        setChecked(`cr3ea_bakingprofileaspertemplate-${cycleNum}`, s.bakingProfileAsPerTemplate !== false);

        // 9. Biscuit Physical Dimensions & Weights
        const biscuitLength = s.biscuitLength !== undefined ? s.biscuitLength : (s.length !== undefined ? s.length : "NA");
        const biscuitWidth = s.biscuitWidth !== undefined ? s.biscuitWidth : (s.width !== undefined ? s.width : "NA");
        const biscuitDiameter = s.biscuitDiameter !== undefined ? s.biscuitDiameter : (s.diameter !== undefined ? s.diameter : "NA");
        const gaugeVal = s.gauge !== undefined ? s.gauge : "NA";
        const stdSampleCount = s.standardsSampleCount !== undefined ? s.standardsSampleCount : (s.numberOfBiscuits !== undefined ? s.numberOfBiscuits : "10");
        const biscuitStdWeight = s.biscuitStdWeight !== undefined ? s.biscuitStdWeight : (s.dryBiscuitWeight !== undefined ? s.dryBiscuitWeight : "NA");
        const wtBeforeOil = s.weightBeforeOil !== undefined ? s.weightBeforeOil : "NA";
        const wtAfterOil = s.weightAfterOilSpray !== undefined ? s.weightAfterOilSpray : (s.weightAfterOil !== undefined ? s.weightAfterOil : "NA");
        const wtSeasoning = s.weightWithSeasoning !== undefined ? s.weightWithSeasoning : "NA";

        setVal(`cr3ea_biscuitlength-${cycleNum}`, biscuitLength);
        setVal(`cr3ea_biscuitwidth-${cycleNum}`, biscuitWidth);
        setVal(`cr3ea_biscuitdiameter-${cycleNum}`, biscuitDiameter);
        setVal(`cr3ea_gauge-${cycleNum}`, gaugeVal);
        setVal(`cr3ea_standardssamplecount-${cycleNum}`, stdSampleCount);
        setVal(`cr3ea_biscuitstdweight-${cycleNum}`, biscuitStdWeight);
        setVal(`cr3ea_weightbeforeoil-${cycleNum}`, wtBeforeOil);
        setVal(`cr3ea_weightafteroilspray-${cycleNum}`, wtAfterOil);
        setVal(`cr3ea_weightwithseasoning-${cycleNum}`, wtSeasoning);

        // 10. Quality & Moisture
        setVal(`cr3ea_topcolourstandard-${cycleNum}`, s.topColourStandard !== undefined ? s.topColourStandard : "As per std");
        setVal(`cr3ea_topcolourobserved-${cycleNum}`, s.topColourObserved !== undefined ? s.topColourObserved : "As per std");
        setVal(`cr3ea_bottomcolourstandard-${cycleNum}`, s.bottomColourStandard !== undefined ? s.bottomColourStandard : "As per std");
        setVal(`cr3ea_bottomcolourobserved-${cycleNum}`, s.bottomColourObserved !== undefined ? s.bottomColourObserved : "As per std");
        setVal(`cr3ea_moisturestandard-${cycleNum}`, s.moistureStandard !== undefined ? s.moistureStandard : (s.moisture !== undefined ? s.moisture : "2.25%"));
    }
};
