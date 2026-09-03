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

    // 1. Create a cycle panel section (either active form or completed read-only card)
    createCycleSection: function (cycleNum, isCompleted = false, cycleData = null) {
        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (!parentElement) return;

        const newCycle = document.createElement("div");
        newCycle.classList.add("bs-card-toggler", "bs-card", "bs-card-secondary", "tour-cycle-panel");
        if (isCompleted) newCycle.classList.add("completed-cycle");
        newCycle.setAttribute("id", `cycle-${cycleNum}`);

        const showHeader = isCompleted || !!(MixingBaking_Main.state.product);

        const initialBodyStyle = isCompleted
            ? "max-height: 0px !important; height: 0px !important; overflow: hidden !important; display: block !important;"
            : "max-height: none !important; height: auto !important; overflow: visible !important; display: block !important;";

        // Resolve status dynamically to match CCP/OPRP badges
        let status = "Metadata Setup";
        if (isCompleted) {
            status = "Completed";
        } else if (MixingBaking_Main.state.product) {
            status = "Checklist Filling";
        }

        let badgeColor = "#64748b";
        let badgeBg = "#f1f5f9";
        if (status === "Metadata Setup") { badgeColor = "#2563eb"; badgeBg = "#dbeafe"; }
        else if (status === "Checklist Filling") { badgeColor = "#d97706"; badgeBg = "#fef3c7"; }
        else if (status === "Completed") { badgeColor = "#16a34a"; badgeBg = "#dcfce7"; }

        let dateStr = "";
        if (isCompleted && cycleData) {
            // 1. Try to parse date from the title (e.g. MixingBaking_LineN/A_Cycle-1_21-08-2026)
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
                // 2. Fallback to createdon or parent tour start date
                const rawDate = cycleData.createdon || (MixingBaking_Main.state.tourData ? MixingBaking_Main.state.tourData.cr3ea_tourstartdate : null);
                if (rawDate) {
                    dateStr = moment(rawDate).format("DD/MM/YYYY");
                } else {
                    dateStr = moment().format("DD/MM/YYYY");
                }
            }
        }

        const dateHtml = dateStr
            ? `<span class="tour-date" style="font-size: 13px; color: #64748b; font-weight: 500; margin-right: 10px;">${dateStr}</span>`
            : '';

        newCycle.innerHTML = `
            <div class="bs-card-header" onclick="MixingBaking_Checklist.togglePanel(${cycleNum})" style="display: ${showHeader ? 'flex' : 'none'}; justify-content: space-between; align-items: center; width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <h4 class="bs-card-title" style="margin: 0;">Cycle ${cycleNum}</h4>
                    <span class="badge" style="background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${status}</span>
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
                <!-- Stepper matching CCP/OPRP -->
                ${!isCompleted ? `
                <div class="stepper-wrapper" style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 15px; font-size: 13px;">
                        <span class="stepper-item ${!MixingBaking_Main.state.product ? 'active' : ''}" style="font-weight: ${!MixingBaking_Main.state.product ? '700' : '500'}; color: ${!MixingBaking_Main.state.product ? '#2563eb' : '#64748b'}; background: ${!MixingBaking_Main.state.product ? '#dbeafe' : 'transparent'}; padding: 4px 10px; border-radius: 4px;">1. Setup Info</span>
                        <span style="color: #cbd5e1;">➔</span>
                        <span class="stepper-item ${MixingBaking_Main.state.product ? 'active' : ''}" style="font-weight: ${MixingBaking_Main.state.product ? '700' : '500'}; color: ${MixingBaking_Main.state.product ? '#2563eb' : '#64748b'}; background: ${MixingBaking_Main.state.product ? '#dbeafe' : 'transparent'}; padding: 4px 10px; border-radius: 4px;">2. Checklist Fill</span>
                        <span style="color: #cbd5e1;">➔</span>
                        <span class="stepper-item" style="font-weight: 500; color: #64748b; padding: 4px 10px; border-radius: 4px;">3. Completed</span>
                    </div>
                </div>
                ` : ''}

                <!-- STEP 1: START CYCLE FORM -->
                <div class="tour-cyle-step tour-cyle-step-start bs-fade-elem ${isCompleted ? '' : 'bs-fade-active bs-fade-in'}" id="start-step-${cycleNum}" style="display: ${isCompleted ? 'none' : 'block'};">
                    <form class="tour-cyle-info-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Product Name</label>
                                <div class="select2-parent">
                                    <select id="productSelect-${cycleNum}" class="form-select select2-init">
                                        <option value="Marie Classic">Marie Classic</option>
                                        <option value="Cremica Bourbon">Cremica Bourbon</option>
                                        <option value="Bourbon">Bourbon</option>
                                        <option value="Chelsea Vanilla">Chelsea Vanilla</option>
                                        <option value="Classic Crackers">Classic Crackers</option>
                                        <option value="Goldmarie">Goldmarie</option>
                                        <option value="Digestive Biscuits">Digestive Biscuits</option>
                                        <option value="Butter Cookies">Butter Cookies</option>
                                        <option value="Choco Chips Biscuits">Choco Chips Biscuits</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Executive Name</label>
                                <div class="select2-parent">
                                    <select id="executive-name-${cycleNum}" class="form-select select2-init">
                                        <option value="">Select Executive</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Production Incharge</label>
                                <div class="select2-parent">
                                    <select id="prod-incharge-${cycleNum}" class="form-select select2-init">
                                        <option value="">Select Production Incharge</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Batch No</label>
                                <input type="text" class="form-control" id="batch-no-${cycleNum}" placeholder="Enter Batch No" />
                            </div>
                        </div>
                        <div class="form-footer" style="margin-top: 15px;">
                            <button type="button" class="bs-btn bs-btn-primary" onclick="MixingBaking_Checklist.startSession(${cycleNum})">Start Session</button>
                        </div>
                    </form>
                </div>

                <!-- STEP 2: SUMMARY METADATA INFO HEADER -->
                <div class="tour-cycle-info-wrapper" id="info-wrapper-${cycleNum}" style="display: ${isCompleted ? 'block' : 'none'};">
                    <div class="tour-cyle-start-info">
                        <div class="start-info-item">
                            <p class="item-label">Product</p>
                            <p class="item-value" id="disp-product-${cycleNum}">${cycleData ? cycleData.cr3ea_productname : ''}</p>
                        </div>
                        <div class="start-info-item">
                            <p class="item-label">Executive Name</p>
                            <p class="item-value" id="disp-exec-${cycleNum}">${cycleData ? MixingBaking_Checklist.resolveUserName(cycleData.cr3ea_observedby) : ''}</p>
                        </div>
                        <div class="start-info-item">
                            <p class="item-label">Batch No</p>
                            <p class="item-value" id="disp-batch-${cycleNum}">${cycleData ? cycleData.cr3ea_batchno : ''}</p>
                        </div>
                        <div class="start-info-item">
                            <p class="item-label">Shift</p>
                            <p class="item-value" id="disp-shift-${cycleNum}">${cycleData ? cycleData.cr3ea_shift : ''}</p>
                        </div>
                    </div>
                </div>

                <!-- STEP 3: MAIN FORM WITH 4 DETAILED TABS -->
                <div class="tour-cyle-step tour-cyle-step-form bs-fade-elem" id="checklist-form-${cycleNum}" style="display: none;">
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

                                <h4 class="mb-section-title" style="margin-top:20px;">Mixing Sponge (Observed Values Only)</h4>
                                <div class="form-grid">
                                    <div class="form-group"><label>Sponge Product Name</label><input type="text" class="form-control" id="cr3ea_spongeproductname-${cycleNum}" /></div>
                                    <div class="form-group"><label>Water Quantity</label><input type="text" class="form-control" id="cr3ea_spongewaterquantity-${cycleNum}" /></div>
                                    <div class="form-group"><label>Yeast Quantity</label><input type="text" class="form-control" id="cr3ea_spongeyeastquantity-${cycleNum}" /></div>
                                    <div class="form-group"><label>Water Temperature</label><input type="text" class="form-control" id="cr3ea_spongewatertemp-${cycleNum}" /></div>
                                    <div class="form-group"><label>Mixing Time</label><input type="text" class="form-control" id="cr3ea_spongemixingtime-${cycleNum}" /></div>
                                    <div class="form-group"><label>Fermentation Start Temp</label><input type="text" class="form-control" id="cr3ea_fermentationstarttemp-${cycleNum}" /></div>
                                    <div class="form-group"><label>Fermentation Room Temp</label><input type="text" class="form-control" id="cr3ea_fermentationroomtemp-${cycleNum}" /></div>
                                    <div class="form-group"><label>Final Temp After Fermentation</label><input type="text" class="form-control" id="cr3ea_finaltempafterfermentation-${cycleNum}" /></div>
                                    <div class="form-group"><label>Final pH After Fermentation</label><input type="text" class="form-control" id="cr3ea_finalphafterfermentation-${cycleNum}" /></div>
                                </div>
                            </div>

                            <!-- TAB 3: MIXING DOUGH & FORMING -->
                            <div class="mb-tab-pane" id="mix-f-${cycleNum}">
                                <h4 class="mb-section-title">Mixing Dough Parameters</h4>
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
                                            ${this.renderMixingDoughRow(cycleNum, "Creaming Time", "cr3ea_creamingtime")}
                                            ${this.renderMixingDoughRow(cycleNum, "Mixing Time", "cr3ea_mixingtime")}
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Temperature", "cr3ea_doughtemp")}
                                            ${this.renderMixingDoughRow(cycleNum, "Jacket of Mixer Temperature", "cr3ea_jackettemp")}
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Consistency", "cr3ea_doughconsistency")}
                                            ${this.renderMixingDoughRow(cycleNum, "Dough Standing Time", "cr3ea_doughstandingtime")}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="form-grid-three" style="margin-top:20px;">
                                    <div class="form-group">
                                        <label>Type of Mixer</label>
                                        <div class="mixer-radio-group">
                                            <label><input type="radio" name="cr3ea_typeofmixer-${cycleNum}" value="Vertical" checked /> Vertical</label>
                                            <label style="margin-left: 15px;"><input type="radio" name="cr3ea_typeofmixer-${cycleNum}" value="Horizontal" /> Horizontal</label>
                                        </div>
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Forming Stage</h4>
                                <div class="form-grid">
                                    <div class="form-group"><label>Moulder RPM/Strokes</label><input type="text" class="form-control" id="cr3ea_moulderrpmstrokes-${cycleNum}" /></div>
                                    <div class="form-group"><label>Number of Biscuits (sample count)</label><input type="text" class="form-control" id="cr3ea_formingsamplecount-${cycleNum}" /></div>
                                    <div class="form-group"><label>Standard Wet Weight</label><input type="text" class="form-control" id="cr3ea_standardwetweight-${cycleNum}" /></div>
                                    <div class="form-group"><label>Observed Wet Weight</label><input type="text" class="form-control" id="cr3ea_observedwetweight-${cycleNum}" /></div>
                                    <div class="form-group"><label>Biscuit Weight Before Sugar Sprinkling</label><input type="text" class="form-control" id="cr3ea_weightbeforesugarsprinkling-${cycleNum}" /></div>
                                    <div class="form-group"><label>Biscuit Weight After Sugar Sprinkling</label><input type="text" class="form-control" id="cr3ea_weightaftersugarsprinkling-${cycleNum}" /></div>
                                </div>
                            </div>

                            <!-- TAB 4: BAKING & QC STANDARDS -->
                            <div class="mb-tab-pane" id="bake-s-${cycleNum}">
                                <h4 class="mb-section-title">Baking Stage Parameters</h4>
                                <div class="form-grid-three">
                                    <div class="form-group"><label>Baking Time</label><input type="text" class="form-control" id="cr3ea_bakingtime-${cycleNum}" /></div>
                                    <div class="form-group"><label>Baking Profile - Taste</label><input type="text" class="form-control" id="cr3ea_bakingprofiletaste-${cycleNum}" /></div>
                                    <div class="form-group" style="display:flex; align-items:center; height:100%; margin-top:25px;">
                                        <label><input type="checkbox" id="cr3ea_bakingprofileaspertemplate-${cycleNum}" value="Yes" /> As per Baking Template (confirm)</label>
                                    </div>
                                </div>

                                <div class="baking-temp-zones-container" style="margin-top:15px; display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                    <div class="zone-card">
                                        <h5>Top Baking Zone Temperatures (°C)</h5>
                                        <div class="zone-inputs-grid">
                                            ${this.renderZoneInputs(cycleNum, "top")}
                                        </div>
                                    </div>
                                    <div class="zone-card">
                                        <h5>Bottom Baking Zone Temperatures (°C)</h5>
                                        <div class="zone-inputs-grid">
                                            ${this.renderZoneInputs(cycleNum, "bottom")}
                                        </div>
                                    </div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Biscuit Physical Standards</h4>
                                <div class="form-grid">
                                    <div class="form-group"><label>Length</label><input type="text" class="form-control" id="cr3ea_biscuitlength-${cycleNum}" /></div>
                                    <div class="form-group"><label>Width</label><input type="text" class="form-control" id="cr3ea_biscuitwidth-${cycleNum}" /></div>
                                    <div class="form-group"><label>Diameter</label><input type="text" class="form-control" id="cr3ea_biscuitdiameter-${cycleNum}" /></div>
                                    <div class="form-group"><label>Number of Biscuits (Standards sample)</label><input type="text" class="form-control" id="cr3ea_standardssamplecount-${cycleNum}" /></div>
                                    <div class="form-group"><label>Std Weight</label><input type="text" class="form-control" id="cr3ea_biscuitstdweight-${cycleNum}" /></div>
                                    <div class="form-group"><label>Observed Weight</label><input type="text" class="form-control" id="cr3ea_biscuitobservedweight-${cycleNum}" /></div>
                                </div>

                                <h4 class="mb-section-title" style="margin-top:20px;">Biscuit Quality & Moisture</h4>
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
                                                <td>Top Colour</td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_topcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td>Bottom Colour</td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourstandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_bottomcolourobserved-${cycleNum}" /></td>
                                            </tr>
                                            <tr>
                                                <td>Moisture %</td>
                                                <td><input type="text" class="form-control" id="cr3ea_moisturestandard-${cycleNum}" /></td>
                                                <td><input type="text" class="form-control" id="cr3ea_moistureobserved-${cycleNum}" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="form-grid-three" style="margin-top:15px;">
                                    <div class="form-group">
                                        <label>Biscuit Weight After Oil Spray</label>
                                        <input type="text" class="form-control" id="cr3ea_weightafteroilspray-${cycleNum}" />
                                    </div>
                                    <div class="form-group">
                                        <label>Upload Support Document / Photo</label>
                                        <input type="file" class="form-control" id="mb-file-upload-${cycleNum}" onchange="MixingBaking_Checklist.onFileSelected(this, ${cycleNum})" />
                                        <small id="mb-file-status-${cycleNum}" class="form-text text-muted" style="margin-top: 5px; display: block;">No file selected</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-footer" style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: flex-end; gap: 15px;">
                        <button type="button" class="bs-btn bs-btn-outline-primary" onclick="window.location.reload()">Cancel</button>
                        <button type="button" class="bs-btn bs-btn-primary" onclick="MixingBaking_Checklist.saveCycle(${cycleNum})">Submit Cycle Data</button>
                    </div>
                </div>

                <!-- STEP 4: COMPLETED CYCLE READ-ONLY DETAILS -->
                <div class="tour-cyle-step tour-cyle-step-completed" id="completed-step-${cycleNum}" style="display: ${isCompleted ? 'block' : 'none'};">
                    <!-- Populated dynamically via renderCompletedSection -->
                </div>
            </div>
        `;

        parentElement.appendChild(newCycle);

        if (isCompleted && cycleData) {
            this.renderCompletedSection(cycleNum, cycleData);
        } else {
            // Populate QA Executive select options
            const qaSelect = $(`#executive-name-${cycleNum}`);
            qaSelect.empty().append('<option value="">Select Executive</option>');
            if (MixingBaking_Main.state.usersConfig && MixingBaking_Main.state.usersConfig.qaUsers) {
                MixingBaking_Main.state.usersConfig.qaUsers.forEach(u => {
                    const selected = u.EMail && MixingBaking_Main.state.qaExecutive && u.EMail.toLowerCase() === MixingBaking_Main.state.qaExecutive.toLowerCase() ? 'selected' : '';
                    qaSelect.append(`<option value="${u.EMail || u.Title}" ${selected}>${u.Title}</option>`);
                });
            }

            // Populate Production Executive select options
            const prodSelect = $(`#prod-incharge-${cycleNum}`);
            prodSelect.empty().append('<option value="">Select Production Incharge</option>');
            if (MixingBaking_Main.state.usersConfig && MixingBaking_Main.state.usersConfig.prodUsers) {
                MixingBaking_Main.state.usersConfig.prodUsers.forEach(u => {
                    const selected = u.EMail && MixingBaking_Main.state.productionIncharge && u.EMail.toLowerCase() === MixingBaking_Main.state.productionIncharge.toLowerCase() ? 'selected' : '';
                    prodSelect.append(`<option value="${u.EMail || u.Title}" ${selected}>${u.Title}</option>`);
                });
            }

            // Initialize select2 on dropdowns
            $(`#productSelect-${cycleNum}, #executive-name-${cycleNum}, #prod-incharge-${cycleNum}`).select2({
                minimumResultsForSearch: -1,
                dropdownAutoWidth: false,
                width: '100%'
            });

            // Auto-populate standards if session already started (reopening)
            if (MixingBaking_Main.state.product) {
                this.populateStandardValues(cycleNum, MixingBaking_Main.state.product);
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

    // Step 1 Click - Start Session
    startSession: async function (cycleNum) {
        MixingBaking_Validator.clearAll(cycleNum);
        const productEl = document.getElementById(`productSelect-${cycleNum}`);
        const execEl = document.getElementById(`executive-name-${cycleNum}`);
        const batchEl = document.getElementById(`batch-no-${cycleNum}`);

        const product = productEl?.value || "";
        const exec = execEl?.value || "";
        const incharge = document.getElementById(`prod-incharge-${cycleNum}`).value;
        const batchNo = batchEl?.value?.trim() || "";

        if (!product || !exec || !batchNo) {
            if (productEl && !product) MixingBaking_Validator.highlight(productEl, true);
            if (execEl && !exec) MixingBaking_Validator.highlight(execEl, true);
            if (batchEl && !batchNo) MixingBaking_Validator.highlight(batchEl, true);
            alert("Please fill in Product, Executive Name, and Batch No.");
            return;
        }

        ShowLoader();
        try {
            // Save executive & production details to the main parent tour record
            let generatedGUID = MixingBaking_Main.state.varTourID;

            const rawLine = MixingBaking_Main.state.line || localStorage.getItem("LineNo") || "N/A";
            const cleanLine = String(rawLine).replace(/line\s*|-/gi, "").trim();
            const lineLabel = cleanLine ? `Line${cleanLine}` : "LineN/A";

            const parentPayload = {
                cr3ea_assigned_qa: exec,
                cr3ea_shiftexecutiveproduction: incharge,
                cr3ea_observedby: exec,
                cr3ea_status: "In Progress",
                cr3ea_shift: MixingBaking_Main.state.shift || localStorage.getItem("shiftValue") || "Shift-1",
                cr3ea_lineno: MixingBaking_Main.state.line || "Line 1",
                cr3ea_plantid: QualityRajpura_Config.PLANT_ID,
                cr3ea_title: `MixingBaking_${lineLabel}_Cycle-${cycleNum}_${moment().format('DD-MM-YYYY')}`
            };

            if (generatedGUID) {
                // If it already exists, update it
                await MixingBaking_DAL.updateParentTour(generatedGUID, parentPayload);
                console.log("Parent Tour updated successfully with session details.");
            } else {
                // If it does not exist (action=new), create it now!
                parentPayload.cr3ea_tourstartdate = new Date().toISOString();
                const savedTour = await MixingBaking_DAL.saveTourSession(parentPayload);
                generatedGUID = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                    ? QualityRajpura_Config.getTourId(savedTour)
                    : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));
                MixingBaking_Main.state.varTourID = generatedGUID;
                console.log("Parent Tour created successfully on start session. GUID resolved:", generatedGUID);
            }

            // Cache locally
            MixingBaking_Main.state.product = product;
            MixingBaking_Main.state.qaExecutive = exec;
            MixingBaking_Main.state.productionIncharge = incharge;
            MixingBaking_Main.state.batchNo = batchNo;

            // Show Complete Quality Tour button if user can edit
            const compContainer = document.getElementById("complete-tour-btn-container");
            if (compContainer && MixingBaking_Main.state.canEditChecklist) {
                compContainer.style.display = "flex";
            }

            // Hide Step 1, show details & main form
            const startStep = document.getElementById(`start-step-${cycleNum}`);
            if (startStep) {
                startStep.classList.remove("bs-fade-active", "bs-fade-in");
                startStep.style.display = "none";
            }

            const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
            if (infoWrapper) {
                document.getElementById(`disp-product-${cycleNum}`).innerText = product;
                document.getElementById(`disp-exec-${cycleNum}`).innerText = MixingBaking_Checklist.resolveUserName(exec);
                document.getElementById(`disp-batch-${cycleNum}`).innerText = batchNo;
                document.getElementById(`disp-shift-${cycleNum}`).innerText = MixingBaking_Main.state.shift;
                infoWrapper.style.display = "block";
            }

            const chkForm = document.getElementById(`checklist-form-${cycleNum}`);
            if (chkForm) {
                chkForm.classList.add("bs-fade-active", "bs-fade-in");
                chkForm.style.display = "block";
            }

            // Show the Cycle Header since the session has started
            const cardHeader = document.querySelector(`#cycle-${cycleNum} .bs-card-header`);
            if (cardHeader) {
                cardHeader.style.display = "flex";
            }

            // Auto-populate standards based on product selected
            this.populateStandardValues(cycleNum, product);
        } catch (err) {
            console.error("Failed to start session:", err);
            alert("Failed to start session: " + err.message);
        } finally {
            HideLoader();
        }
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
    },

    // Step 3 Click - Submit Cycle
    saveCycle: async function (cycleNum) {
        if (typeof ShowLoader === "function") ShowLoader();
        try {
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

            // 5. Mixing Dough
            const doughList = ["creamingtime", "mixingtime", "doughtemp", "jackettemp", "doughconsistency", "doughstandingtime"];
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

            // 8. QC Physical Standards & Quality/Moisture
            const qcsList = ["biscuitlength", "biscuitwidth", "biscuitdiameter", "standardssamplecount", "biscuitstdweight", "biscuitobservedweight", "weightafteroilspray"];
            qcsList.forEach(q => {
                numericFields.push({ id: `cr3ea_${q}-${cycleNum}`, name: `QC Standard: ${q}` });
            });

            const qcPairsList = ["topcolour", "bottomcolour", "moisture"];
            qcPairsList.forEach(q => {
                numericFields.push({ id: `cr3ea_${q}standard-${cycleNum}`, name: `${q} Standard` });
                numericFields.push({ id: `cr3ea_${q}observed-${cycleNum}`, name: `${q} Observed` });
            });

            // Run validation loop
            MixingBaking_Validator.clearAll(cycleNum);
            for (let f of numericFields) {
                const el = document.getElementById(f.id);
                if (!el) continue;
                const val = el.value.trim();
                if (val !== "") {
                    const isNa = val.toUpperCase() === "NA" || val.toUpperCase() === "N/A";
                    const isNum = !isNaN(parseFloat(val)) && isFinite(val);
                    if (!isNa && !isNum) {
                        MixingBaking_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please enter a valid numeric value or 'NA' for: ${f.name}`);
                        el.focus();
                        return;
                    }
                }
            }

            // 1. Gather form values
            const record = {
                "cr3ea_title": `MixingBaking_Line${MixingBaking_Main.state.line}_Cycle-${cycleNum}_${moment().format("DD-MM-YYYY")}`,
                "cr3ea_cycle": `Cycle-${cycleNum}`,
                "cr3ea_shift": MixingBaking_Main.state.shift,
                "cr3ea_observedby": MixingBaking_Main.state.qaExecutive,
                "cr3ea_productname": MixingBaking_Main.state.product,
                "cr3ea_lineno": MixingBaking_Main.state.line,
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
            alert("Failed to save cycle data: " + err.message);
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
                        
                        <div class="table-responsive" style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background: white;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Ingredient</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Standard</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Observed</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Remarks</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Action Taken</th>
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
                                            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${item.label}</td>
                                            <td style="padding: 10px 12px; color: #334155;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${val(cycleData[item.key + "observed"])}</td>
                                            <td style="padding: 10px 12px; color: #64748b;">${val(cycleData[item.key + "remarks"])}</td>
                                            <td style="padding: 10px 12px; color: #64748b;">${val(cycleData[item.key + "actiontaken"])}</td>
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
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_chocochipstemp)}°C</strong></span>
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
                                            <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_cashewtemp)}°C</strong></span>
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
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_invertsyruptemp)}°C</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">pH: <strong>${val(cycleData.cr3ea_invertsyrupph)}</strong></span>
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Brix: <strong>${val(cycleData.cr3ea_invertsyrupbrix)}</strong></span>
                                    </div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 12px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Blackjack (2nd Stage)</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 11px; color: #475569;">
                                        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Temp: <strong>${val(cycleData.cr3ea_blackjack2temp)}°C</strong></span>
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
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongewatertemp)}°C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Mixing Time</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_spongemixingtime)} min</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Fermentation Start Temp</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_fermentationstarttemp)}°C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Fermentation Room Temp</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_fermentationroomtemp)}°C</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Final Temp (After Ferm)</div>
                                        <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_finaltempafterfermentation)}°C</div>
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
                        
                        <div class="table-responsive" style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background: white;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Dough Parameter</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Standard</th>
                                        <th style="padding: 10px 12px; font-weight: 600; color: #475569;">Observed</th>
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
                                            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${item.label}</td>
                                            <td style="padding: 10px 12px; color: #334155;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${val(cycleData[item.key + "observed"])}</td>
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
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_topproducttempafterbaking)}°C</div>
                                </div>
                                <div style="border-top: 1px solid #f8fafc; padding-top: 8px;">
                                    <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Bottom Product Temp</div>
                                    <div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px;">${val(cycleData.cr3ea_bottomproducttempafterbaking)}°C</div>
                                </div>
                            </div>
                        </div>

                        <!-- Baking Zone Temperatures Table -->
                        <span style="font-weight: 700; font-size: 11px; display: block; margin-bottom: 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Baking Zone Temperatures (°C):</span>
                        <div class="table-responsive" style="margin-bottom: 16px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; background: white;">
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
                const hasStarted = MixingBaking_Main.state.product !== "";
                document.getElementById(`start-step-${cycleNum}`).style.display = hasStarted ? "none" : "block";
                document.getElementById(`checklist-form-${cycleNum}`).style.display = hasStarted ? "block" : "none";
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
            alert("Failed to complete tour: " + err.message);
        }
    },

    populateStandardValues: function (cycleNum, product) {
        console.log(`Populating standard values for Product: ${product}, Cycle: ${cycleNum}`);
        
        // Helper to safely set element value
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        // Helper to safely check a checkbox
        const setChecked = (id, isChecked) => {
            const el = document.getElementById(id);
            if (el) el.checked = isChecked;
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

        // 1. Chelsea Vanilla
        if (product === "Chelsea Vanilla") {
            // Ingredient Temp
            setVal(`cr3ea_rpostandard-${cycleNum}`, "45 Celsius");
            setVal(`cr3ea_solidfatstandard-${cycleNum}`, "15 Celsius");
            setVal(`cr3ea_butterstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_blackjackstandard-${cycleNum}`, "35 Celsius");
            setVal(`cr3ea_spongetempstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_slurrystandard-${cycleNum}`, "NA");
            setVal(`cr3ea_groundsugartempstandard-${cycleNum}`, "NA");

            setVal(`cr3ea_butterobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_spongetempobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_slurryobserved-${cycleNum}`, "NA");

            // Supplier Materials
            setVal(`cr3ea_chocochipssupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipstemp-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_cashewsupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_floursupplier-${cycleNum}`, "NA");

            // Syrups
            setVal(`cr3ea_invertsyruptemp-${cycleNum}`, "35 Celsius");
            setVal(`cr3ea_blackjack2temp-${cycleNum}`, "35 Celsius");

            // Mixing Sponge
            setVal(`cr3ea_spongeproductname-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewaterquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongeyeastquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewatertemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationstarttemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationroomtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_finaltempafterfermentation-${cycleNum}`, "NA");
            setVal(`cr3ea_finalphafterfermentation-${cycleNum}`, "NA");

            // Mixing Dough standard
            setVal(`cr3ea_creamingtimestandard-${cycleNum}`, "10 min");
            setVal(`cr3ea_mixingtimestandard-${cycleNum}`, "5 Min");
            setVal(`cr3ea_doughtempstandard-${cycleNum}`, "32-35 celsius");
            setVal(`cr3ea_doughstandingtimestandard-${cycleNum}`, "15 Min");

            // Forming
            setVal(`cr3ea_moulderrpmstrokes-${cycleNum}`, "NA");
            setVal(`cr3ea_formingsamplecount-${cycleNum}`, "10 bis");
            setVal(`cr3ea_standardwetweight-${cycleNum}`, "31g");

            // Baking
            setChecked(`cr3ea_bakingprofileaspertemplate-${cycleNum}`, true);

            // Biscuit Standards
            setVal(`cr3ea_biscuitlength-${cycleNum}`, "NA");
            setVal(`cr3ea_biscuitwidth-${cycleNum}`, "NA");
            setVal(`cr3ea_biscuitdiameter-${cycleNum}`, "42mm");
            setVal(`cr3ea_standardssamplecount-${cycleNum}`, "10 bis");
            setVal(`cr3ea_biscuitstdweight-${cycleNum}`, "27g");

            // Quality & Moisture
            setVal(`cr3ea_topcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_topcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_moisturestandard-${cycleNum}`, "1.75%");
            setVal(`cr3ea_weightafteroilspray-${cycleNum}`, "NA");
        }
        // 2. Butter Cookies
        else if (product === "Butter Cookies") {
            // Ingredient Temp
            setVal(`cr3ea_rpostandard-${cycleNum}`, "45 Celsius");
            setVal(`cr3ea_solidfatstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_butterstandard-${cycleNum}`, "5 Celsius");
            setVal(`cr3ea_blackjackstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_spongetempstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_slurrystandard-${cycleNum}`, "NA");
            setVal(`cr3ea_groundsugartempstandard-${cycleNum}`, "NA");

            setVal(`cr3ea_solidfatobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_blackjackobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_spongetempobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_slurryobserved-${cycleNum}`, "NA");

            // Supplier Materials
            setVal(`cr3ea_chocochipssupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipstemp-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_cashewsupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_floursupplier-${cycleNum}`, "NA");

            // Syrups
            setVal(`cr3ea_invertsyruptemp-${cycleNum}`, "35 Celsius");
            setVal(`cr3ea_blackjack2temp-${cycleNum}`, "NA");

            // Mixing Sponge
            setVal(`cr3ea_spongeproductname-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewaterquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongeyeastquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewatertemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationstarttemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationroomtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_finaltempafterfermentation-${cycleNum}`, "NA");
            setVal(`cr3ea_finalphafterfermentation-${cycleNum}`, "NA");

            // Mixing Dough standard
            setVal(`cr3ea_creamingtimestandard-${cycleNum}`, "10 min");
            setVal(`cr3ea_mixingtimestandard-${cycleNum}`, "5 Min");
            setVal(`cr3ea_doughtempstandard-${cycleNum}`, "32-35 celsius");
            setVal(`cr3ea_doughstandingtimestandard-${cycleNum}`, "10 Min");

            // Forming
            setVal(`cr3ea_moulderrpmstrokes-${cycleNum}`, "NA");
            setVal(`cr3ea_formingsamplecount-${cycleNum}`, "7 bis");
            setVal(`cr3ea_standardwetweight-${cycleNum}`, "38g");

            // Baking
            setChecked(`cr3ea_bakingprofileaspertemplate-${cycleNum}`, true);

            // Biscuit Standards
            setVal(`cr3ea_biscuitlength-${cycleNum}`, "NA");
            setVal(`cr3ea_biscuitwidth-${cycleNum}`, "NA");
            setVal(`cr3ea_biscuitdiameter-${cycleNum}`, "44mm");
            setVal(`cr3ea_standardssamplecount-${cycleNum}`, "7 bis");
            setVal(`cr3ea_biscuitstdweight-${cycleNum}`, "33g");

            // Quality & Moisture
            setVal(`cr3ea_topcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_topcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_moisturestandard-${cycleNum}`, "2.00%");
            setVal(`cr3ea_weightafteroilspray-${cycleNum}`, "NA");
        }
        // 3. Bourbon / Cremica Bourbon
        else if (product === "Bourbon" || product === "Cremica Bourbon") {
            // Ingredient Temp
            setVal(`cr3ea_rpostandard-${cycleNum}`, "45 Celsius");
            setVal(`cr3ea_solidfatstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_butterstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_blackjackstandard-${cycleNum}`, "35 Celsius");
            setVal(`cr3ea_spongetempstandard-${cycleNum}`, "NA");
            setVal(`cr3ea_slurrystandard-${cycleNum}`, "NA");
            setVal(`cr3ea_groundsugartempstandard-${cycleNum}`, "NA");

            setVal(`cr3ea_solidfatobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_butterobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_spongetempobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_slurryobserved-${cycleNum}`, "NA");
            setVal(`cr3ea_groundsugartempobserved-${cycleNum}`, "NA");

            // Supplier Materials
            setVal(`cr3ea_chocochipssupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipstemp-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_chocochipscompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_cashewsupplier-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcountperkg-${cycleNum}`, "NA");
            setVal(`cr3ea_cashewcompoundorpure-${cycleNum}`, "NA");

            setVal(`cr3ea_floursupplier-${cycleNum}`, "NA");

            // Syrups
            setVal(`cr3ea_invertsyruptemp-${cycleNum}`, "35 Celsius");
            setVal(`cr3ea_blackjack2temp-${cycleNum}`, "35 Celsius");

            // Mixing Sponge
            setVal(`cr3ea_spongeproductname-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewaterquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongeyeastquantity-${cycleNum}`, "NA");
            setVal(`cr3ea_spongewatertemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationstarttemp-${cycleNum}`, "NA");
            setVal(`cr3ea_fermentationroomtemp-${cycleNum}`, "NA");
            setVal(`cr3ea_finaltempafterfermentation-${cycleNum}`, "NA");
            setVal(`cr3ea_finalphafterfermentation-${cycleNum}`, "NA");

            // Mixing Dough standard
            setVal(`cr3ea_creamingtimestandard-${cycleNum}`, "10 min");
            setVal(`cr3ea_mixingtimestandard-${cycleNum}`, "6-7 Min");
            setVal(`cr3ea_doughtempstandard-${cycleNum}`, "32-35 celsius");
            setVal(`cr3ea_doughstandingtimestandard-${cycleNum}`, "10 Min");

            // Forming
            setVal(`cr3ea_moulderrpmstrokes-${cycleNum}`, "NA");
            setVal(`cr3ea_formingsamplecount-${cycleNum}`, "14");
            setVal(`cr3ea_standardwetweight-${cycleNum}`, "58g");

            // Baking
            setChecked(`cr3ea_bakingprofileaspertemplate-${cycleNum}`, true);

            // Biscuit Standards
            setVal(`cr3ea_biscuitlength-${cycleNum}`, "55mm");
            setVal(`cr3ea_biscuitwidth-${cycleNum}`, "25mm");
            setVal(`cr3ea_biscuitdiameter-${cycleNum}`, "NA");
            setVal(`cr3ea_standardssamplecount-${cycleNum}`, "14");
            setVal(`cr3ea_biscuitstdweight-${cycleNum}`, "49g");

            // Quality & Moisture
            setVal(`cr3ea_topcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_topcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourstandard-${cycleNum}`, "As per std");
            setVal(`cr3ea_bottomcolourobserved-${cycleNum}`, "As per std");
            setVal(`cr3ea_moisturestandard-${cycleNum}`, "1.5%");
            setVal(`cr3ea_weightafteroilspray-${cycleNum}`, "NA");
        }
    }
};
