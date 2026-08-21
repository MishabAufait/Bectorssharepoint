// Checklist UI Controller for Rajpura Mixing & Baking Form
console.log("Mixing & Baking Checklist Controller loaded");

const MixingBaking_Checklist = {
    // Maps cycle number to attachment files selected for upload
    selectedFiles: {},

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

        const dateHtml = isCompleted && cycleData
            ? `<span class="tour-date" style="font-size: 13px; color: #64748b; font-weight: 500; margin-right: 10px;">${moment(cycleData.createdon || MixingBaking_Main.state.tourData.cr3ea_tourstartdate).format("DD/MM/YYYY")}</span>`
            : '';

        newCycle.innerHTML = `
            <div class="bs-card-header" onclick="MixingBaking_Checklist.togglePanel(${cycleNum})" style="display: ${showHeader ? 'flex' : 'none'}; justify-content: space-between; align-items: center; width: 100%;">
                <h4 class="bs-card-title" style="margin: 0;">Cycle ${cycleNum}</h4>
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
                            <p class="item-value" id="disp-exec-${cycleNum}">${cycleData ? cycleData.cr3ea_observedby : ''}</p>
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
                    const selected = u.Title === MixingBaking_Main.state.qaExecutive ? 'selected' : '';
                    qaSelect.append(`<option value="${u.Title}" ${selected}>${u.Title}</option>`);
                });
            }

            // Populate Production Executive select options
            const prodSelect = $(`#prod-incharge-${cycleNum}`);
            prodSelect.empty().append('<option value="">Select Production Incharge</option>');
            if (MixingBaking_Main.state.usersConfig && MixingBaking_Main.state.usersConfig.prodUsers) {
                MixingBaking_Main.state.usersConfig.prodUsers.forEach(u => {
                    const selected = u.Title === MixingBaking_Main.state.productionIncharge ? 'selected' : '';
                    prodSelect.append(`<option value="${u.Title}" ${selected}>${u.Title}</option>`);
                });
            }

            // Initialize select2 on dropdowns
            $(`#productSelect-${cycleNum}, #executive-name-${cycleNum}, #prod-incharge-${cycleNum}`).select2({
                minimumResultsForSearch: -1,
                dropdownAutoWidth: true,
                width: '100%'
            });
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
        const product = document.getElementById(`productSelect-${cycleNum}`).value;
        const exec = document.getElementById(`executive-name-${cycleNum}`).value;
        const incharge = document.getElementById(`prod-incharge-${cycleNum}`).value;
        const batchNo = document.getElementById(`batch-no-${cycleNum}`).value;

        if (!product || !exec || !batchNo) {
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
                cr3ea_lineid: MixingBaking_Main.state.line || "Line 1",
                cr3ea_plantid: QualityRajpura_Config.PLANT_ID,
                cr3ea_departmentid: typeof userDepratmentId !== 'undefined' && userDepratmentId ? String(userDepratmentId) : QualityRajpura_Config.QUALITY_DEPT_IDS[0],
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
                generatedGUID = savedTour.cr3ea_prod_rajpura_quality_tourid;
                MixingBaking_Main.state.varTourID = generatedGUID;
                console.log("Parent Tour created successfully on start session. GUID resolved:", generatedGUID);
            }

            // Cache locally
            MixingBaking_Main.state.product = product;
            MixingBaking_Main.state.qaExecutive = exec;
            MixingBaking_Main.state.productionIncharge = incharge;
            MixingBaking_Main.state.batchNo = batchNo;

            // Hide Step 1, show details & main form
            const startStep = document.getElementById(`start-step-${cycleNum}`);
            if (startStep) {
                startStep.classList.remove("bs-fade-active", "bs-fade-in");
                startStep.style.display = "none";
            }

            const infoWrapper = document.getElementById(`info-wrapper-${cycleNum}`);
            if (infoWrapper) {
                document.getElementById(`disp-product-${cycleNum}`).innerText = product;
                document.getElementById(`disp-exec-${cycleNum}`).innerText = exec;
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
        ShowLoader();
        try {
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
                record["cr3ea_qualitytourid@odata.bind"] = `/cr3ea_prod_rajpura_quality_tours(${MixingBaking_Main.state.varTourID})`;
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
            <div class="mb-completed-wrapper" style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border-radius: 12px; padding: 20px; margin-top: 15px;">
                <div class="mb-completed-header" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <h5 style="margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;">Cycle ${cycleNum} Saved Details Summary</h5>
                    <span class="badge badge-success" style="background-color: #10b981; color: white; padding: 5px 10px; border-radius: 50px; font-weight: 600; font-size: 11px;">Submitted</span>
                </div>

                <!-- TAB NAVIGATION FOR COMPLETED CYCLE -->
                <div class="mb-tabs-nav" style="display: flex; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; flex-wrap: wrap;">
                    <button type="button" class="mb-tab-btn active comp-tab-btn-${cycleNum}" style="background: #2563eb; color: white; border: 1px solid #2563eb; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-ing-q-${cycleNum}')">1. Ingredient Quality</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mat-q-${cycleNum}')">2. Material Quality</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-mix-f-${cycleNum}')">3. Mixing & Forming</button>
                    <button type="button" class="mb-tab-btn comp-tab-btn-${cycleNum}" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="MixingBaking_Checklist.switchCompletedTab(this, ${cycleNum}, 'comp-bake-s-${cycleNum}')">4. Baking & Standards</button>
                </div>
                
                <div class="summary-sections-container" style="color: #334155; line-height: 1.5;">
                    
                    <!-- TAB 1: INGREDIENT QUALITY -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-ing-q-${cycleNum}" style="display: block; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 15px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">1. Ingredient Quality & Temperatures</h6>
                        
                        <div class="table-responsive" style="margin-bottom: 12px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background: white; border: 1px solid #e2e8f0;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 8px; font-weight: 600;">Ingredient</th>
                                        <th style="padding: 8px; font-weight: 600;">Standard</th>
                                        <th style="padding: 8px; font-weight: 600;">Observed</th>
                                        <th style="padding: 8px; font-weight: 600;">Remarks</th>
                                        <th style="padding: 8px; font-weight: 600;">Action Taken</th>
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
                                    ].map(item => `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 8px; font-weight: 600; color: #475569;">${item.label}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "observed"])}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "remarks"])}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "actiontaken"])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="minor-summary">
                            <span style="font-weight: 600; font-size: 11px; display: block; margin-bottom: 6px; color: #475569;">Minor Ingredients:</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
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
                                    const bg = isDone ? "#e8f5e9" : "#ffebee";
                                    const color = isDone ? "#2e7d32" : "#c62828";
                                    return `<span style="padding: 3px 6px; border-radius: 4px; font-size: 11px; background: ${bg}; color: ${color}; font-weight: 600;">${item.label}: ${cycleData[item.key] || 'Not Done'}</span>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: MATERIAL QUALITY -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-mat-q-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 15px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">2. Material Quality & Sponge</h6>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; font-size: 12px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Supplier Details</span>
                                <div style="margin-bottom: 4px;"><strong>Flour Supplier:</strong> ${val(cycleData.cr3ea_floursupplier)}</div>
                                <div style="margin-bottom: 4px;"><strong>Choco Chips:</strong> ${cycleData.cr3ea_chocochipssupplier ? `${cycleData.cr3ea_chocochipssupplier} | Temp: ${val(cycleData.cr3ea_chocochipstemp)}°C | Count: ${val(cycleData.cr3ea_chocochipscountperkg)}/kg | ${val(cycleData.cr3ea_chocochipscompoundorpure)}` : '-'}</div>
                                <div><strong>Cashew:</strong> ${cycleData.cr3ea_cashewsupplier ? `${cycleData.cr3ea_cashewsupplier} | Temp: ${val(cycleData.cr3ea_cashewtemp)}°C | Count: ${val(cycleData.cr3ea_cashewcountperkg)}/kg | ${val(cycleData.cr3ea_cashewcompoundorpure)}` : '-'}</div>
                            </div>

                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Syrups & Liquids</span>
                                <div style="margin-bottom: 4px;"><strong>Invert Syrup:</strong> Temp: ${val(cycleData.cr3ea_invertsyruptemp)}°C | pH: ${val(cycleData.cr3ea_invertsyrupph)} | Brix: ${val(cycleData.cr3ea_invertsyrupbrix)}</div>
                                <div><strong>Blackjack (2nd):</strong> Temp: ${val(cycleData.cr3ea_blackjack2temp)}°C | pH: ${val(cycleData.cr3ea_blackjack2ph)} | Brix: ${val(cycleData.cr3ea_blackjack2brix)}</div>
                            </div>

                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; grid-column: 1 / -1;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 8px;">Mixing Sponge Parameters</span>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
                                    <div><strong>Sponge Name:</strong> ${val(cycleData.cr3ea_spongeproductname)}</div>
                                    <div><strong>Water Qty:</strong> ${val(cycleData.cr3ea_spongewaterquantity)}</div>
                                    <div><strong>Yeast Qty:</strong> ${val(cycleData.cr3ea_spongeyeastquantity)}</div>
                                    <div><strong>Water Temp:</strong> ${val(cycleData.cr3ea_spongewatertemp)}°C</div>
                                    <div><strong>Mixing Time:</strong> ${val(cycleData.cr3ea_spongemixingtime)} min</div>
                                    <div><strong>Ferm. Start Temp:</strong> ${val(cycleData.cr3ea_fermentationstarttemp)}°C</div>
                                    <div><strong>Ferm. Room Temp:</strong> ${val(cycleData.cr3ea_fermentationroomtemp)}°C</div>
                                    <div><strong>Final Temp:</strong> ${val(cycleData.cr3ea_finaltempafterfermentation)}°C</div>
                                    <div><strong>Final pH:</strong> ${val(cycleData.cr3ea_finalphafterfermentation)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 3: MIXING & FORMING -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-mix-f-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 15px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">3. Mixing Dough & Forming Stage</h6>
                        
                        <div class="table-responsive" style="margin-bottom: 12px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background: white; border: 1px solid #e2e8f0;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 8px; font-weight: 600;">Dough Parameter</th>
                                        <th style="padding: 8px; font-weight: 600;">Standard</th>
                                        <th style="padding: 8px; font-weight: 600;">Observed</th>
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
                                    ].map(item => `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 8px; font-weight: 600; color: #475569;">${item.label}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "standard"])}</td>
                                            <td style="padding: 8px;">${val(cycleData[item.key + "observed"])}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; font-size: 12px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; display: flex; align-items: center;">
                                <div><strong>Mixer Type:</strong> ${val(cycleData.cr3ea_typeofmixer)}</div>
                            </div>
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Forming Details</span>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                                    <div><strong>Moulder RPM:</strong> ${val(cycleData.cr3ea_moulderrpmstrokes)}</div>
                                    <div><strong>Sample Count:</strong> ${val(cycleData.cr3ea_formingsamplecount)}</div>
                                    <div><strong>Wet Weight (Std):</strong> ${val(cycleData.cr3ea_standardwetweight)}</div>
                                    <div><strong>Wet Weight (Obs):</strong> ${val(cycleData.cr3ea_observedwetweight)}</div>
                                    <div><strong>Wt Before Sugar:</strong> ${val(cycleData.cr3ea_weightbeforesugarsprinkling)}</div>
                                    <div><strong>Wt After Sugar:</strong> ${val(cycleData.cr3ea_weightaftersugarsprinkling)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- TAB 4: BAKING & STANDARDS -->
                    <div class="comp-tab-pane-${cycleNum}" id="comp-bake-s-${cycleNum}" style="display: none; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; padding: 15px;">
                        <h6 style="margin-top: 0; margin-bottom: 12px; font-size: 13px; color: #2563eb; font-weight: 700; border-left: 3px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">4. Baking Stage & Physical Standards</h6>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; font-size: 12px; margin-bottom: 12px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Baking Settings</span>
                                <div style="margin-bottom: 4px;"><strong>Baking Time:</strong> ${val(cycleData.cr3ea_bakingtime)}</div>
                                <div style="margin-bottom: 4px;"><strong>Baking Profile - Taste:</strong> ${val(cycleData.cr3ea_bakingprofiletaste)}</div>
                                <div><strong>As per Template:</strong> ${val(cycleData.cr3ea_bakingprofileaspertemplate)}</div>
                            </div>
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Product Temperatures after Baking</span>
                                <div style="margin-bottom: 4px;"><strong>Top Product Temp:</strong> ${val(cycleData.cr3ea_topproducttempafterbaking)}°C</div>
                                <div><strong>Bottom Product Temp:</strong> ${val(cycleData.cr3ea_bottomproducttempafterbaking)}°C</div>
                            </div>
                        </div>

                        <!-- Baking Zone Temperatures Table -->
                        <span style="font-weight: 600; font-size: 11px; display: block; margin-bottom: 6px; color: #475569;">Baking Zone Temperatures (°C):</span>
                        <div class="table-responsive" style="margin-bottom: 12px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; background: white; border: 1px solid #e2e8f0;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 6px; text-align: left; font-weight: 600;">Zone</th>
                                        <th style="padding: 6px; font-weight: 600;">Z1</th>
                                        <th style="padding: 6px; font-weight: 600;">Z2</th>
                                        <th style="padding: 6px; font-weight: 600;">Z3</th>
                                        <th style="padding: 6px; font-weight: 600;">Z4</th>
                                        <th style="padding: 6px; font-weight: 600;">Z5</th>
                                        <th style="padding: 6px; font-weight: 600;">Z6</th>
                                        <th style="padding: 6px; font-weight: 600;">Z7</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 6px; font-weight: 600; text-align: left; color: #475569;">Top</td>
                                        ${[1,2,3,4,5,6,7].map(i => `<td style="padding: 6px;">${val(cycleData[`cr3ea_topbakingtempzone${i}`])}</td>`).join('')}
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px; font-weight: 600; text-align: left; color: #475569;">Bottom</td>
                                        ${[1,2,3,4,5,6,7].map(i => `<td style="padding: 6px;">${val(cycleData[`cr3ea_bottombakingtempzone${i}`])}</td>`).join('')}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; font-size: 12px; margin-top: 8px;">
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Biscuit Physical Standards</span>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                                    <div><strong>Length:</strong> ${val(cycleData.cr3ea_biscuitlength)}</div>
                                    <div><strong>Width:</strong> ${val(cycleData.cr3ea_biscuitwidth)}</div>
                                    <div><strong>Diameter:</strong> ${val(cycleData.cr3ea_biscuitdiameter)}</div>
                                    <div><strong>Sample Count:</strong> ${val(cycleData.cr3ea_standardssamplecount)}</div>
                                    <div><strong>Std Weight:</strong> ${val(cycleData.cr3ea_biscuitstdweight)}</div>
                                    <div><strong>Obs. Weight:</strong> ${val(cycleData.cr3ea_biscuitobservedweight)}</div>
                                    <div><strong>Wt After Oil Spray:</strong> ${val(cycleData.cr3ea_weightafteroilspray)}</div>
                                </div>
                            </div>
                            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                                <span style="font-weight: 700; color: #334155; display: block; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">Quality & Moisture Parameters</span>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 4px; font-weight: 700; margin-bottom: 4px; color: #475569;">
                                    <div>Parameter</div>
                                    <div>Standard</div>
                                    <div>Observed</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 4px; border-bottom: 1px solid #f8fafc; padding-bottom: 2px;">
                                    <div>Top Colour</div>
                                    <div>${val(cycleData.cr3ea_topcolourstandard)}</div>
                                    <div>${val(cycleData.cr3ea_topcolourobserved)}</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 4px; border-bottom: 1px solid #f8fafc; padding-top: 2px; padding-bottom: 2px;">
                                    <div>Bottom Colour</div>
                                    <div>${val(cycleData.cr3ea_bottomcolourstandard)}</div>
                                    <div>${val(cycleData.cr3ea_bottomcolourobserved)}</div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 4px; padding-top: 2px;">
                                    <div>Moisture %</div>
                                    <div>${val(cycleData.cr3ea_moisturestandard)}</div>
                                    <div>${val(cycleData.cr3ea_moistureobserved)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <p style="margin-top:15px; font-size:11px; color:#64748b; font-style: italic;">To review complete records or export detailed Excel/PDF reports, please visit the central HOD/PM plant tour dashboard.</p>
            </div>
        `;
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
        
        // Reset button states for this cycle
        document.querySelectorAll(`.comp-tab-btn-${cycleNum}`).forEach(b => {
            b.style.background = "#f8fafc";
            b.style.color = "#64748b";
            b.style.borderColor = "#e2e8f0";
        });
        
        // Highlight active button
        btn.style.background = "#2563eb";
        btn.style.color = "white";
        btn.style.borderColor = "#2563eb";
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
    }
};
