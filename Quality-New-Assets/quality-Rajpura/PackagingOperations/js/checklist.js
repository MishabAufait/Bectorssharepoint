// Checklist renderer and validator for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Checklist loaded");

const PKGOPS_PAPA_DEFECTS_FLAT = [
    // A Defects - Product
    { category: "A", type: "Product", name: "Foreign matter" },
    { category: "A", type: "Product", name: "Burnt taste" },
    { category: "A", type: "Product", name: "Rancid cookie" },
    { category: "A", type: "Product", name: "Off Odour/flavour" },
    { category: "A", type: "Product", name: "Soggy/Moist cookie" },
    { category: "A", type: "Product", name: "Stale taste" },
    { category: "A", type: "Product", name: "Sugary/Grainy feel in cream" },
    { category: "A", type: "Product", name: "Unpleasant After taste" },
    { category: "A", type: "Product", name: "Crushed Biscuits" },
    { category: "A", type: "Product", name: "Carbon Particles at bottom" },
    { category: "A", type: "Product", name: "Flaking" },
    { category: "A", type: "Product", name: "Others" },

    // A Defects - Pack
    { category: "A", type: "Pack", name: "Foreign matter" },
    { category: "A", type: "Pack", name: "Illegible code" },
    { category: "A", type: "Pack", name: "No Code" },
    { category: "A", type: "Pack", name: "Wrong Code" },
    { category: "A", type: "Pack", name: "Underweight Below MPE" },
    { category: "A", type: "Pack", name: "Cross packing/labelling" },
    { category: "A", type: "Pack", name: "Wrong MRP" },
    { category: "A", type: "Pack", name: "Art work & label error" },
    { category: "A", type: "Pack", name: "Torn/Tear Pack" },
    { category: "A", type: "Pack", name: "Pack Delamination" },
    { category: "A", type: "Pack", name: "Disc Out" },
    { category: "A", type: "Pack", name: "Flap Open" },
    { category: "A", type: "Pack", name: "Empty Pack" },
    { category: "A", type: "Pack", name: "Cut pack/Pin hole" },
    { category: "A", type: "Pack", name: "Wrinkles in sealing (>2mm)" },
    { category: "A", type: "Pack", name: "Damaged tin" },
    { category: "A", type: "Pack", name: "Wrong lid" },
    { category: "A", type: "Pack", name: "Wrong colour or artwork" },
    { category: "A", type: "Pack", name: "Others" },

    // B Defects - Product
    { category: "B", type: "Product", name: "Blister" },
    { category: "B", type: "Product", name: "Dust on Biscuit" },
    { category: "B", type: "Product", name: "Broken" },
    { category: "B", type: "Product", name: "DE shaped" },
    { category: "B", type: "Product", name: "Mould Embossing absent" },
    { category: "B", type: "Product", name: "Edge Dark" },
    { category: "B", type: "Product", name: "Oozing" },
    { category: "B", type: "Product", name: "Less Nuts" },
    { category: "B", type: "Product", name: "Hard bite" },
    { category: "B", type: "Product", name: "Bottom scrap/tailing" },
    { category: "B", type: "Product", name: "Joint biscuits" },
    { category: "B", type: "Product", name: "Less seasoning" },
    { category: "B", type: "Product", name: "Slight unbaked" },
    { category: "B", type: "Product", name: "Assortment not proper" },
    { category: "B", type: "Product", name: "Less sugar/excess sugar" },
    { category: "B", type: "Product", name: "Others" },

    // B Defects - Pack
    { category: "B", type: "Pack", name: "Carton Skewing" },
    { category: "B", type: "Pack", name: "Damaged CBB" },
    { category: "B", type: "Pack", name: "Burnt seal" },
    { category: "B", type: "Pack", name: "Loose pack" },
    { category: "B", type: "Pack", name: "coding out" },
    { category: "B", type: "Pack", name: "Code smudged" },
    { category: "B", type: "Pack", name: "CBB tape in open" },
    { category: "B", type: "Pack", name: "Improper taping of CBB" },
    { category: "B", type: "Pack", name: "Poor Gazetting" },
    { category: "B", type: "Pack", name: "Torn poly" },
    { category: "B", type: "Pack", name: "Polybag - unsealed" },
    { category: "B", type: "Pack", name: "Seal leakage/Cut On Seal" },
    { category: "B", type: "Pack", name: "Silver line on sealing" },
    { category: "B", type: "Pack", name: "Illegible code on CBB" },
    { category: "B", type: "Pack", name: "improper sealing on cup" },
    { category: "B", type: "Pack", name: "Damge duplex/open duplex" },
    { category: "B", type: "Pack", name: "Cross Pasting" },
    { category: "B", type: "Pack", name: "Glue excess/less" },
    { category: "B", type: "Pack", name: "Underweight above MPE" },
    { category: "B", type: "Pack", name: "Flap open <10 mm" },
    { category: "B", type: "Pack", name: "Less bulge" },
    { category: "B", type: "Pack", name: "Weak seal" },
    { category: "B", type: "Pack", name: "Tight Lid" },
    { category: "B", type: "Pack", name: "Code smudge on TIN" },
    { category: "B", type: "Pack", name: "Dent on tin/ Disc out" },
    { category: "B", type: "Pack", name: "Others" },

    // C Defects - Product
    { category: "C", type: "Product", name: "Tailing" },
    { category: "C", type: "Product", name: "Oozing Out" },
    { category: "C", type: "Product", name: "Chipping" },
    { category: "C", type: "Product", name: "Chocking" },
    { category: "C", type: "Product", name: "Docker pin not visible" },
    { category: "C", type: "Product", name: "Bottom chippings" },
    { category: "C", type: "Product", name: "Wegging" },
    { category: "C", type: "Product", name: "Others" },

    // C Defects - Pack
    { category: "C", type: "Pack", name: "ROGH TAPING ON TIN" },
    { category: "C", type: "Pack", name: "Wrinkles on primary pack" },
    { category: "C", type: "Pack", name: "Slant pack" },
    { category: "C", type: "Pack", name: "Overweight >5% of declared weight" },
    { category: "C", type: "Pack", name: "Others" }
];

const PKGOPS_Checklist = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    pqiSubChecklistsFilled: {
        NetWeight: false,
        Product: false,
        Primary: false,
        Secondary: false,
        CBB: false
    },

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        
        console.log(`Initializing Checklist: TourId=${tourId}, Type=${pkgopsType}`);
        this.renderChecklistForm();
    },

    // Main router rendering the sub-checklist forms
    renderChecklistForm: function () {
        const container = document.getElementById("checklist-form-area");
        if (!container) return;

        container.innerHTML = "";

        switch (this.pkgopsType) {
            case "Temperatures & Humidity":
                this.activeSubChecklistKey = "CHILD_TEMP_HUMIDITY";
                this.renderTempHumidity(container);
                break;
            case "Code Verification":
                this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION";
                this.renderCodeVerification(container);
                break;
            case "PAPA":
                this.activeSubChecklistKey = "CHILD_PAPA";
                this.renderPAPA(container);
                break;
            case "PQI":
                this.renderPQI(container);
                break;
            case "Seal Integrity":
                this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY";
                this.renderSealIntegrity(container);
                break;
            case "Cream Percentage":
                this.renderCreamPercentage(container);
                break;
            case "Quality Wall Records":
                this.activeSubChecklistKey = "CHILD_QUALITY_WALL";
                this.renderQualityWall(container);
                break;
            default:
                container.innerHTML = `<div class="alert alert-info">Invalid checklist type: ${this.pkgopsType}</div>`;
        }
    },

    // 1. Temperatures & Humidity Form
    renderTempHumidity: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Temperatures & Humidity Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                ${this.createNumericField("pkglinetemp", "Packaging Line Temp (°C)")}
                ${this.createNumericField("pkglinehumidity", "Packaging Line Humidity (%)")}
                ${this.createNumericField("coolingtunneltemp", "Cooling Tunnel Temp (°C)")}
                ${this.createNumericField("creamroomtemp", "Cream Room Temp (°C)")}
                ${this.createNumericField("coldstorage1temp", "Cold Storage 1 Temp (°C)")}
                ${this.createNumericField("coldstorage2temp", "Cold Storage 2 Temp (°C)")}
                ${this.createNumericField("flavourroomtemp", "Flavour Room Temp (°C)")}
                ${this.createNumericField("dhroomhumidity", "DH Room Humidity (%)")}
                ${this.createNumericField("coldroom1temp", "Cold Room 1 Temp (°C)")}
                ${this.createNumericField("coldroom2temp", "Cold Room 2 Temp (°C)")}
                ${this.createNumericField("coldroom3temp", "Cold Room 3 Temp (°C)")}
                ${this.createNumericField("deepfreezeryeasttemp", "Deep Freezer for Yeast (°C)")}
            </div>
        `;
    },

    // Helper for numeric inputs
    createNumericField: function (id, label) {
        return `
            <div class="col-md-3">
                <div class="form-group mb-3">
                    <label class="form-label">${label}</label>
                    <input type="text" class="form-control numeric-input" id="th-${id}" placeholder="e.g. 24.5 or NA">
                </div>
            </div>
        `;
    },

    // 2. Code Verification Form
    renderCodeVerification: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Code Verification Details</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-control" id="cv-product" placeholder="Enter Product Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="cv-sku" placeholder="Enter SKU">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Batch No</label>
                    <input type="text" class="form-control" id="cv-batch" placeholder="Enter Batch No">
                </div>
                <div class="col-md-4">
                    <label class="form-label">PKD</label>
                    <input type="date" class="form-control" id="cv-pkd">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Expiry Date</label>
                    <input type="date" class="form-control" id="cv-expiry">
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-12">
                    <h4 class="form-section-title">Sample Evaluation (Ok / Not Ok)</h4>
                    <table class="table table-bordered mt-2 text-center align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Sample No</th>
                                <th>Status</th>
                                <th>Defect Category</th>
                                <th>Defect Count</th>
                                <th>Upload Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({ length: 10 }).map((_, idx) => `
                                <tr>
                                    <td>Sample ${idx + 1}</td>
                                    <td>
                                        <select class="form-select cv-sample-status" id="cv-status-${idx}" onchange="PKGOPS_Checklist.toggleCvDefectFields(${idx})">
                                            <option value="Okay">Okay</option>
                                            <option value="Not Okay">Not Okay</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select class="form-select cv-defect-category" id="cv-defect-${idx}" disabled>
                                            <option value="">Select Defect</option>
                                            <option value="Wrong PKD">Wrong PKD</option>
                                            <option value="Wrong Expiry">Wrong Expiry</option>
                                            <option value="Smudge Print">Smudge Print</option>
                                            <option value="Missing Print">Missing Print</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="number" class="form-control cv-defect-count" id="cv-count-${idx}" placeholder="Count" min="1" disabled>
                                    </td>
                                    <td>
                                        <input type="file" class="form-control cv-file-upload" id="cv-file-${idx}" accept="image/*" disabled>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    toggleCvDefectFields: function (idx) {
        const status = document.getElementById(`cv-status-${idx}`).value;
        const defectSelect = document.getElementById(`cv-defect-${idx}`);
        const countInput = document.getElementById(`cv-count-${idx}`);
        const fileInput = document.getElementById(`cv-file-${idx}`);

        if (status === "Not Okay") {
            defectSelect.disabled = false;
            countInput.disabled = false;
            fileInput.disabled = false;
        } else {
            defectSelect.disabled = true;
            countInput.disabled = true;
            fileInput.disabled = true;
            defectSelect.value = "";
            countInput.value = "";
            fileInput.value = "";
        }
    },

    // 3. PAPA Form
    renderPAPA: function (container) {
        // Group the flat list by category and type to render
        const grouped = {
            "A": { "Product": [], "Pack": [] },
            "B": { "Product": [], "Pack": [] },
            "C": { "Product": [], "Pack": [] }
        };

        PKGOPS_PAPA_DEFECTS_FLAT.forEach((defect, idx) => {
            grouped[defect.category][defect.type].push({
                ...defect,
                flatIndex: idx
            });
        });

        let categoriesHtml = "";
        ["A", "B", "C"].forEach(cat => {
            const prodList = grouped[cat]["Product"];
            const packList = grouped[cat]["Pack"];

            categoriesHtml += `
                <div class="card mb-4 shadow-sm border rounded" style="border-radius: 8px; overflow: hidden;">
                    <div class="card-header py-2.5 px-4" style="background-color: #1e3a8a; color: #ffffff; border-bottom: 2px solid #1d4ed8;">
                        <h5 class="mb-0 fw-bold" style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Category ${cat} Defects
                        </h5>
                    </div>
                    <div class="card-body p-3">
                        <div class="row g-4">
                            <!-- Product Defects -->
                            <div class="col-md-6 border-end">
                                <div class="p-2 bg-light mb-3 rounded" style="border-left: 4px solid #3b82f6;">
                                    <h6 class="mb-0 fw-bold text-primary" style="font-size: 13px; text-transform: uppercase;">Product Defects</h6>
                                </div>
                                <div style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
                                    <table class="table table-sm table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style="width: 55%; font-size: 11px;">Defect</th>
                                                <th style="width: 15%; text-align: center; font-size: 11px;">Select</th>
                                                <th style="width: 30%; font-size: 11px;">Count / %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${prodList.map(item => `
                                                <tr>
                                                    <td style="font-size: 12.5px; font-weight: 500;">${item.name}</td>
                                                    <td style="text-align: center; position: relative;">
                                                        <input type="checkbox" class="form-check-input papa-defect-chk" id="papa-chk-${item.flatIndex}" onchange="PKGOPS_Checklist.togglePapaDefect(${item.flatIndex})" style="position: relative !important; float: none !important; margin: 0 auto !important; display: inline-block !important; width: 16px !important; height: 16px !important; opacity: 1 !important; visibility: visible !important;">
                                                    </td>
                                                    <td>
                                                        <div class="input-group input-group-sm">
                                                            <input type="number" class="form-control papa-defect-count" id="papa-count-${item.flatIndex}" value="0" min="0" disabled oninput="PKGOPS_Checklist.calculatePapaPercentages()" style="width: 55px;">
                                                            <span class="input-group-text fw-bold text-secondary" id="papa-pct-${item.flatIndex}" style="font-size: 10px;">0.0%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <!-- Pack Defects -->
                            <div class="col-md-6">
                                <div class="p-2 bg-light mb-3 rounded" style="border-left: 4px solid #10b981;">
                                    <h6 class="mb-0 fw-bold text-success" style="font-size: 13px; text-transform: uppercase;">Pack Defects</h6>
                                </div>
                                <div style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
                                    <table class="table table-sm table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style="width: 55%; font-size: 11px;">Defect</th>
                                                <th style="width: 15%; text-align: center; font-size: 11px;">Select</th>
                                                <th style="width: 30%; font-size: 11px;">Count / %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${packList.map(item => `
                                                <tr>
                                                    <td style="font-size: 12.5px; font-weight: 500;">${item.name}</td>
                                                    <td style="text-align: center; position: relative;">
                                                        <input type="checkbox" class="form-check-input papa-defect-chk" id="papa-chk-${item.flatIndex}" onchange="PKGOPS_Checklist.togglePapaDefect(${item.flatIndex})" style="position: relative !important; float: none !important; margin: 0 auto !important; display: inline-block !important; width: 16px !important; height: 16px !important; opacity: 1 !important; visibility: visible !important;">
                                                    </td>
                                                    <td>
                                                        <div class="input-group input-group-sm">
                                                            <input type="number" class="form-control papa-defect-count" id="papa-count-${item.flatIndex}" value="0" min="0" disabled oninput="PKGOPS_Checklist.calculatePapaPercentages()" style="width: 55px;">
                                                            <span class="input-group-text fw-bold text-secondary" id="papa-pct-${item.flatIndex}" style="font-size: 10px;">0.0%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">PAPA (Product Attributes & Packaging Appearance)</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <label class="form-label fw-bold">Product Name</label>
                    <input type="text" class="form-control" id="papa-product" placeholder="Enter Product Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">SKU</label>
                    <input type="text" class="form-control" id="papa-sku" placeholder="Enter SKU">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">Sample Size (Biscuits)</label>
                    <input type="number" class="form-control" id="papa-sample-size" value="100" readonly>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-12">
                    <h4 class="form-section-title mb-3">Defect Sampling (Check and enter defect counts)</h4>
                    ${categoriesHtml}
                </div>
            </div>

            <!-- Overall Summary Card -->
            <div class="card mb-4 shadow-sm border rounded bg-light" style="border-radius: 8px;">
                <div class="card-body p-3 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold text-dark" style="font-size: 14px;">Overall Defect Summary</h5>
                    <div class="d-flex gap-4">
                        <div>
                            <span class="text-secondary fw-semibold">Total Defect Count:</span>
                            <span id="papa-total-count" class="fw-bold text-primary ms-2" style="font-size: 15px;">0</span>
                        </div>
                        <div>
                            <span class="text-secondary fw-semibold">Overall Defect Percentage:</span>
                            <span id="papa-total-pct" class="fw-bold text-danger ms-2" style="font-size: 15px;">0.00%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12 text-end">
                    <button type="button" class="btn btn-success px-4 fw-bold" onclick="event.preventDefault(); PKGOPS_Checklist.submitChecklist()"><i class="fa fa-save"></i> Save PAPA Form</button>
                </div>
            </div>
        `;
    },

    togglePapaDefect: function (idx) {
        const chk = document.getElementById(`papa-chk-${idx}`);
        const countInput = document.getElementById(`papa-count-${idx}`);

        if (chk.checked) {
            countInput.disabled = false;
        } else {
            countInput.disabled = true;
            countInput.value = "0";
            this.calculatePapaPercentages();
        }
    },

    calculatePapaPercentages: function () {
        const sampleSize = parseInt(document.getElementById("papa-sample-size").value) || 100;
        let totalCount = 0;

        for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
            const countInput = document.getElementById(`papa-count-${i}`);
            if (!countInput) continue;
            
            const countVal = parseInt(countInput.value) || 0;
            const pctSpan = document.getElementById(`papa-pct-${i}`);
            
            const pct = (countVal / sampleSize) * 100;
            if (pctSpan) pctSpan.innerText = `${pct.toFixed(2)}%`;
            totalCount += countVal;
        }

        const totalCountSpan = document.getElementById("papa-total-count");
        const totalPctSpan = document.getElementById("papa-total-pct");

        if (totalCountSpan) totalCountSpan.innerText = totalCount;
        if (totalPctSpan) totalPctSpan.innerText = `${((totalCount / sampleSize) * 100).toFixed(2)}%`;
    },

    // 4. PQI branching screen
    renderPQI: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group mb-3">
                        <label class="form-label fw-bold">PQI Sub-Evaluation Select</label>
                        <select id="pqi-sub-select" class="form-select" onchange="PKGOPS_Checklist.loadPqiSubForm()" style="font-weight: 600;">
                            <option value="NetWeight">1. Net Weight Evaluation</option>
                            <option value="Product">2. Product Evaluation</option>
                            <option value="Primary">3. Primary Pack Evaluation</option>
                            <option value="Secondary">4. Secondary Pack Evaluation</option>
                            <option value="CBB">5. CBB Evaluation</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6 d-flex align-items-center justify-content-end gap-2">
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-netweight">Net Weight: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-product">Product: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-primary">Primary: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-secondary">Secondary: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-cbb">CBB: Pending</span>
                </div>
            </div>
            <div id="pqi-sub-container" class="mt-3 p-3 border rounded bg-light">
                <!-- PQI Sub forms render here -->
            </div>
            <div class="mt-3 text-end">
                <button type="button" class="btn btn-primary" onclick="PKGOPS_Checklist.saveCurrentPqiSubForm()">Save Evaluation Component</button>
            </div>
        `;
        this.loadPqiSubForm();
    },

    loadPqiSubForm: function () {
        const select = document.getElementById("pqi-sub-select");
        const subContainer = document.getElementById("pqi-sub-container");
        if (!select || !subContainer) return;

        const val = select.value;
        subContainer.innerHTML = "";

        if (val === "NetWeight") {
            subContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Product Name</label>
                        <input type="text" class="form-control" id="pqi-nw-product" placeholder="Product Name">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">SKU</label>
                        <input type="text" class="form-control" id="pqi-nw-sku" placeholder="SKU">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Standard Weight (g)</label>
                        <input type="number" class="form-control" id="pqi-nw-standard" value="150" oninput="PKGOPS_Checklist.calculateNetWeightMetrics()">
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h4 class="form-section-title">Sample Weight Entries (g)</h4>
                    </div>
                    ${Array.from({ length: 15 }).map((_, idx) => `
                        <div class="col-md-2 mt-2">
                            <label class="form-label font-weight-bold" style="font-size: 11px;">Sample ${idx + 1}</label>
                            <input type="number" step="0.01" class="form-control pqi-weight-input" id="pqi-weight-${idx}" oninput="PKGOPS_Checklist.calculateNetWeightMetrics()" placeholder="Weight">
                        </div>
                    `).join('')}
                </div>
                <div class="row mt-4 p-3 border rounded bg-white text-center">
                    <div class="col-md-6">
                        <h5>Average Weight: <span id="pqi-average-weight" class="text-primary fw-bold">-</span></h5>
                    </div>
                    <div class="col-md-6">
                        <h5>Give-Away: <span id="pqi-giveaway" class="text-danger fw-bold">-</span></h5>
                    </div>
                </div>
            `;
        } else {
            // Render evaluation forms (Product, Primary, Secondary, CBB)
            subContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Product Name</label>
                        <input type="text" class="form-control" id="pqi-eval-product" placeholder="Product Name">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">SKU</label>
                        <input type="text" class="form-control" id="pqi-eval-sku" placeholder="SKU">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">PKD</label>
                        <input type="date" class="form-control" id="pqi-eval-pkd">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Batch Code</label>
                        <input type="text" class="form-control" id="pqi-eval-batch" placeholder="Batch Code">
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h4 class="form-section-title">Sample Evaluation (Ok / Not Ok)</h4>
                        <table class="table table-bordered mt-2 text-center align-middle">
                            <thead class="table-light">
                                <th>Sample No</th>
                                <th>Status</th>
                                <th>Defect Category</th>
                                <th>Defect Detail</th>
                                <th>Photo Reference</th>
                            </thead>
                            <tbody>
                                ${Array.from({ length: 10 }).map((_, idx) => `
                                    <tr>
                                        <td>Sample ${idx + 1}</td>
                                        <td>
                                            <select class="form-select pqi-eval-status" id="pqi-eval-status-${idx}" onchange="PKGOPS_Checklist.togglePqiDefectFields(${idx})">
                                                <option value="Okay">Okay</option>
                                                <option value="Not Okay">Not Okay</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control pqi-eval-defect-cat" id="pqi-eval-cat-${idx}" placeholder="Category" disabled>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control pqi-eval-defect-detail" id="pqi-eval-detail-${idx}" placeholder="Detail" disabled>
                                        </td>
                                        <td>
                                            <input type="file" class="form-control pqi-eval-file" id="pqi-eval-file-${idx}" accept="image/*" disabled>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    },

    togglePqiDefectFields: function (idx) {
        const status = document.getElementById(`pqi-eval-status-${idx}`).value;
        const catInput = document.getElementById(`pqi-eval-cat-${idx}`);
        const detailInput = document.getElementById(`pqi-eval-detail-${idx}`);
        const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

        if (status === "Not Okay") {
            catInput.disabled = false;
            detailInput.disabled = false;
            fileInput.disabled = false;
        } else {
            catInput.disabled = true;
            detailInput.disabled = true;
            fileInput.disabled = true;
            catInput.value = "";
            detailInput.value = "";
            fileInput.value = "";
        }
    },

    calculateNetWeightMetrics: function () {
        const stdWeight = parseFloat(document.getElementById("pqi-nw-standard").value) || 0;
        const weights = [];

        document.querySelectorAll(".pqi-weight-input").forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) weights.push(val);
        });

        const avgSpan = document.getElementById("pqi-average-weight");
        const gaSpan = document.getElementById("pqi-giveaway");

        if (weights.length === 0) {
            avgSpan.innerText = "-";
            gaSpan.innerText = "-";
            return;
        }

        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        const giveAway = stdWeight > avg ? stdWeight - avg : 0;

        avgSpan.innerText = `${avg.toFixed(2)} g`;
        gaSpan.innerText = `${giveAway.toFixed(2)} g`;
    },

    saveCurrentPqiSubForm: async function () {
        const select = document.getElementById("pqi-sub-select");
        const val = select.value;

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            if (val === "NetWeight") {
                const product = document.getElementById("pqi-nw-product").value;
                const sku = document.getElementById("pqi-nw-sku").value;
                const standard = parseFloat(document.getElementById("pqi-nw-standard").value) || 0;

                const weights = [];
                for (let i = 0; i < 15; i++) {
                    const weightVal = parseFloat(document.getElementById(`pqi-weight-${i}`).value) || 0;
                    weights.push(weightVal);
                }

                const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
                const giveAway = standard > avg ? standard - avg : 0;

                const netWeightRecord = {
                    cr3ea_name: `PQI_NetWeight_${sku}_${moment().format("DD-MM-YYYY")}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_averageweight: String(avg),
                    cr3ea_giveaway: String(giveAway),
                    "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                };

                // Add weights
                weights.forEach((w, idx) => {
                    netWeightRecord[`cr3ea_sampleweight${idx + 1}`] = String(w);
                });

                await PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_NET_WEIGHT", netWeightRecord);
                this.pqiSubChecklistsFilled.NetWeight = true;
                document.getElementById("badge-pqi-netweight").className = "badge bg-success pqi-status-badge";
                document.getElementById("badge-pqi-netweight").innerText = "Net Weight: Saved";
            } else {
                // Save Pack evaluation
                const product = document.getElementById("pqi-eval-product").value;
                const sku = document.getElementById("pqi-eval-sku").value;
                const pkd = document.getElementById("pqi-eval-pkd").value;
                const batch = document.getElementById("pqi-eval-batch").value;

                // Save each sample evaluation row to CHILD_PQI_EVALUATION
                for (let idx = 0; idx < 10; idx++) {
                    const status = document.getElementById(`pqi-eval-status-${idx}`).value;
                    const cat = document.getElementById(`pqi-eval-cat-${idx}`).value;
                    const detail = document.getElementById(`pqi-eval-detail-${idx}`).value;
                    const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

                    let pictureUrl = "";
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        pictureUrl = await PKGOPS_DAL.uploadAttachmentFile(fileInput.files[0], this.currentTourId, `PQI_${val}`, `PQI-Sample-${idx}`, detail);
                    }

                    const evalRecord = {
                        cr3ea_name: `PQI_Evaluation_${val}_${sku}`,
                        cr3ea_evaluationtype: val,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_pkd: pkd,
                        cr3ea_batchcode: batch,
                        cr3ea_samplenumber: `Sample ${idx + 1}`,
                        cr3ea_sampleresult: status,
                        cr3ea_defectcategory: cat,
                        cr3ea_defectdetail: detail,
                        cr3ea_batchcodepictureurl: pictureUrl,
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                    };

                    await PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_EVALUATION", evalRecord);
                }

                this.pqiSubChecklistsFilled[val] = true;
                const badgeId = `badge-pqi-${val.toLowerCase()}`;
                const badge = document.getElementById(badgeId);
                if (badge) {
                    badge.className = "badge bg-success pqi-status-badge";
                    badge.innerText = `${val}: Saved`;
                }
            }

            if (typeof HideLoader === "function") HideLoader();
            alert("Evaluation component saved successfully!");
        } catch (error) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to save PQI component: ", error);
            alert("Failed to save component entry. Please try again.");
        }
    },

    // 5. Seal Integrity Form
    renderSealIntegrity: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Seal Integrity Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-control" id="seal-product" placeholder="Product Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="seal-sku" placeholder="SKU">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Machine No</label>
                    <input type="text" class="form-control" id="seal-machine" placeholder="Machine No">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Sample Quantity</label>
                    <input type="number" class="form-control" id="seal-qty" value="10" min="1">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Leakage Count</label>
                    <input type="number" class="form-control" id="seal-leak-count" value="0" min="0">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Leakage Type</label>
                    <select class="form-select" id="seal-leak-type">
                        <option value="None">None</option>
                        <option value="Joint Leakage">Joint Leakage</option>
                        <option value="Side Sealing Leakage">Side Sealing Leakage</option>
                        <option value="Puncture">Puncture</option>
                    </select>
                </div>
            </div>
        `;
    },

    // 6. Cream Percentage Form
    renderCreamPercentage: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Cream Percentage Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-control" id="cream-product" placeholder="Product Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="cream-sku" placeholder="SKU">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Sample Size</label>
                    <input type="number" class="form-control" id="cream-sample-size" value="10" min="1">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Cream Percentage Reading (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-reading" oninput="PKGOPS_Checklist.checkCreamStatus()" placeholder="Reading %">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Standard Min (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-min" value="20" oninput="PKGOPS_Checklist.checkCreamStatus()">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Standard Max (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-max" value="30" oninput="PKGOPS_Checklist.checkCreamStatus()">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Status</label>
                    <input type="text" class="form-control fw-bold" id="cream-status" value="Pass" readonly style="color: green;">
                </div>
            </div>
        `;
    },

    checkCreamStatus: function () {
        const reading = parseFloat(document.getElementById("cream-reading").value) || 0;
        const min = parseFloat(document.getElementById("cream-min").value) || 0;
        const max = parseFloat(document.getElementById("cream-max").value) || 0;

        const statusInput = document.getElementById("cream-status");
        if (reading >= min && reading <= max) {
            statusInput.value = "Pass";
            statusInput.style.color = "green";
        } else {
            statusInput.value = "Fail";
            statusInput.style.color = "red";
        }
    },

    // 7. Quality Wall Records Form
    renderQualityWall: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Quality Wall Evaluation</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-4">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-control" id="wall-product" placeholder="Product Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="wall-sku" placeholder="SKU">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Facilitator</label>
                    <input type="text" class="form-control" id="wall-facilitator" placeholder="Facilitator Name">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Wall Type</label>
                    <select class="form-select" id="wall-type">
                        <option value="Main Wall">Main Wall</option>
                        <option value="Line Wall">Line Wall</option>
                    </select>
                </div>
                <div class="col-md-8">
                    <label class="form-label">Members Present</label>
                    <input type="text" class="form-control" id="wall-members" placeholder="Enter names separated by commas">
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-4">
                    <label class="form-label">Pack Appearance Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-appearance" min="1" max="5" value="5" oninput="PKGOPS_Checklist.calculateOverallWallRating()">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Sealing Quality Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-sealing" min="1" max="5" value="5" oninput="PKGOPS_Checklist.calculateOverallWallRating()">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Coding Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-coding" min="1" max="5" value="5" oninput="PKGOPS_Checklist.calculateOverallWallRating()">
                </div>
            </div>
            <div class="row mt-4 text-center p-3 border rounded bg-white">
                <div class="col-md-12">
                    <h4>Overall Rating Score: <span id="wall-overall-rating" class="text-primary fw-bold">5.00 / 5</span></h4>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-12">
                    <label class="form-label">Remarks</label>
                    <textarea class="form-control" id="wall-remarks" rows="3" placeholder="Enter remarks"></textarea>
                </div>
            </div>
        `;
    },

    calculateOverallWallRating: function () {
        const app = parseFloat(document.getElementById("wall-rating-appearance").value) || 0;
        const seal = parseFloat(document.getElementById("wall-rating-sealing").value) || 0;
        const cod = parseFloat(document.getElementById("wall-rating-coding").value) || 0;

        const avg = (app + seal + cod) / 3;
        const ratingSpan = document.getElementById("wall-overall-rating");
        if (ratingSpan) ratingSpan.innerText = `${avg.toFixed(2)} / 5`;
    },

    // Submit complete checklist
    submitChecklist: async function () {
        if (typeof ShowLoader === "function") ShowLoader();

        try {
            let hasDeviation = false;
            let targetTourRecord = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
                cr3ea_islineclear: true,
                cr3ea_status: "Completed",
                cr3ea_processstatus: "Completed"
            };

            if (this.pkgopsType === "Temperatures & Humidity") {
                const record = {
                    cr3ea_name: `TempHumidity_${moment().format("DD-MM-YYYY")}`,
                    cr3ea_pkglinetemp: document.getElementById("th-pkglinetemp").value,
                    cr3ea_pkglinehumidity: document.getElementById("th-pkglinehumidity").value,
                    cr3ea_coolingtunneltemp: document.getElementById("th-coolingtunneltemp").value,
                    cr3ea_creamroomtemp: document.getElementById("th-creamroomtemp").value,
                    cr3ea_coldstorage1nbtemp: document.getElementById("th-coldstorage1temp").value,
                    cr3ea_coldstorage2nbtemp: document.getElementById("th-coldstorage2temp").value,
                    cr3ea_flavourroomtemp: document.getElementById("th-flavourroomtemp").value,
                    cr3ea_dhroomhumidity: document.getElementById("th-dhroomhumidity").value,
                    cr3ea_coldroom1obtemp: document.getElementById("th-coldroom1temp").value,
                    cr3ea_coldroom2obtemp: document.getElementById("th-coldroom2temp").value,
                    cr3ea_coldroom3obtemp: document.getElementById("th-coldroom3temp").value,
                    cr3ea_deepfreezeryeasttemp: document.getElementById("th-deepfreezeryeasttemp").value,
                    "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                };
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_TEMP_HUMIDITY", record);
            } 
            else if (this.pkgopsType === "Code Verification") {
                const product = document.getElementById("cv-product").value;
                const sku = document.getElementById("cv-sku").value;
                const batch = document.getElementById("cv-batch").value;
                const pkd = document.getElementById("cv-pkd").value;
                const expiry = document.getElementById("cv-expiry").value;

                for (let i = 0; i < 10; i++) {
                    const status = document.getElementById(`cv-status-${i}`).value;
                    const defect = document.getElementById(`cv-defect-${i}`).value;
                    const count = parseInt(document.getElementById(`cv-count-${i}`).value) || 0;
                    const fileInput = document.getElementById(`cv-file-${i}`);

                    let pictureUrl = "";
                    if (fileInput && fileInput.files && fileInput.files[0]) {
                        pictureUrl = await PKGOPS_DAL.uploadAttachmentFile(fileInput.files[0], this.currentTourId, "Code Verification", `Sample-${i}`, defect);
                    }

                    if (status === "Not Okay") {
                        hasDeviation = true;
                    }

                    const cvRecord = {
                        cr3ea_name: `CodeVerification_${sku}`,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_batchno: batch,
                        cr3ea_pkd: pkd,
                        cr3ea_expirydate: expiry,
                        cr3ea_noofsamples: "10",
                        cr3ea_defecttype: status === "Not Okay" ? defect : "None",
                        cr3ea_defectcount: String(count),
                        cr3ea_codepictureurl: pictureUrl,
                        cr3ea_deviationstatus: status === "Not Okay" ? "Open" : "None",
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                    };
                    await PKGOPS_DAL.saveSubChecklistRow("CHILD_CODE_VERIFICATION", cvRecord);
                }
            } 
            else if (this.pkgopsType === "PAPA") {
                const product = document.getElementById("papa-product").value;
                const sku = document.getElementById("papa-sku").value;
                const sampleSize = document.getElementById("papa-sample-size").value;

                let overallDefectCount = 0;

                for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
                    const chk = document.getElementById(`papa-chk-${i}`);
                    if (!chk) continue;
                    const isChecked = chk.checked;
                    const count = parseInt(document.getElementById(`papa-count-${i}`).value) || 0;

                    if (isChecked && count > 0) {
                        hasDeviation = true;
                        overallDefectCount += count;

                        const papaRecord = {
                            cr3ea_name: `PAPA_${sku}`,
                            cr3ea_productname: product,
                            cr3ea_sku: sku,
                            cr3ea_noofsamples: sampleSize,
                            cr3ea_defecttype: `${PKGOPS_PAPA_DEFECTS_FLAT[i].name} (${PKGOPS_PAPA_DEFECTS_FLAT[i].category} - ${PKGOPS_PAPA_DEFECTS_FLAT[i].type})`,
                            cr3ea_defectcount: String(count),
                            cr3ea_defectwisepercentage: `${((count / sampleSize) * 100).toFixed(2)}%`,
                            cr3ea_deviationstatus: "Open",
                            "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                        };
                        await PKGOPS_DAL.saveSubChecklistRow("CHILD_PAPA", papaRecord);
                    }
                }

                if (overallDefectCount > 0 || true) { // Always save overall summary or if overallDefectCount > 0
                    // Update overall score/percentage on parent or final PAPA row
                    const finalPapaRecord = {
                        cr3ea_name: `PAPA_Overall_${sku}`,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_noofsamples: sampleSize,
                        cr3ea_defecttype: "Overall Summary",
                        cr3ea_defectcount: String(overallDefectCount),
                        cr3ea_overalldefectpercentage: `${((overallDefectCount / sampleSize) * 100).toFixed(2)}%`,
                        cr3ea_deviationstatus: "None",
                        "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                    };
                    await PKGOPS_DAL.saveSubChecklistRow("CHILD_PAPA", finalPapaRecord);
                }
            } 
            else if (this.pkgopsType === "PQI") {
                // Ensure all 5 are completed
                const uncompleted = Object.keys(this.pqiSubChecklistsFilled).filter(k => !this.pqiSubChecklistsFilled[k]);
                if (uncompleted.length > 0) {
                    alert(`Please complete and save all 5 evaluations first. Remaining: ${uncompleted.join(", ")}`);
                    if (typeof HideLoader === "function") HideLoader();
                    return;
                }

                // Check if any sample was Not Okay across evaluations
                const pqiRows = await PKGOPS_DAL.getSubChecklistRows("CHILD_PQI_EVALUATION", this.currentTourId);
                const pqiFails = pqiRows.some(r => r.cr3ea_sampleresult === "Not Okay");
                if (pqiFails) {
                    hasDeviation = true;
                }
            } 
            else if (this.pkgopsType === "Seal Integrity") {
                const product = document.getElementById("seal-product").value;
                const sku = document.getElementById("seal-sku").value;
                const machine = document.getElementById("seal-machine").value;
                const qty = document.getElementById("seal-qty").value;
                const leakage = parseInt(document.getElementById("seal-leak-count").value) || 0;
                const type = document.getElementById("seal-leak-type").value;

                if (leakage > 0) {
                    hasDeviation = true;
                }

                const sealRecord = {
                    cr3ea_name: `SealIntegrity_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_machineno: machine,
                    cr3ea_samplequantity: qty,
                    cr3ea_noofleakage: String(leakage),
                    cr3ea_leakagetype: type,
                    cr3ea_deviationstatus: leakage > 0 ? "Open" : "None",
                    "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                };
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_SEAL_INTEGRITY", sealRecord);
            } 
            else if (this.pkgopsType === "Cream Percentage") {
                // No table defined, we simulate it or save placeholders dynamically if they exist
                const product = document.getElementById("cream-product").value;
                const sku = document.getElementById("cream-sku").value;
                const reading = parseFloat(document.getElementById("cream-reading").value) || 0;
                const status = document.getElementById("cream-status").value;

                if (status === "Fail") {
                    hasDeviation = true;
                }
            } 
            else if (this.pkgopsType === "Quality Wall Records") {
                const product = document.getElementById("wall-product").value;
                const sku = document.getElementById("wall-sku").value;
                const facilitator = document.getElementById("wall-facilitator").value;
                const type = document.getElementById("wall-type").value;
                const members = document.getElementById("wall-members").value;
                const app = document.getElementById("wall-rating-appearance").value;
                const seal = document.getElementById("wall-rating-sealing").value;
                const cod = document.getElementById("wall-rating-coding").value;
                const remarks = document.getElementById("wall-remarks").value;

                const ratingVal = (parseFloat(app) + parseFloat(seal) + parseFloat(cod)) / 3;

                const wallRecord = {
                    cr3ea_name: `QualityWall_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_facilitator: facilitator,
                    cr3ea_typeofqualitywall: type,
                    cr3ea_memberspresent: members,
                    cr3ea_packappearancerating: String(app),
                    cr3ea_sealingqualityrating: String(seal),
                    cr3ea_codingrating: String(cod),
                    cr3ea_overallrating: String(ratingVal),
                    cr3ea_remarks: remarks,
                    "cr3ea_qualitytourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`
                };
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_QUALITY_WALL", wallRecord);
            }

            // If deviation is present, transition to Failed - Pending Production
            if (hasDeviation) {
                targetTourRecord.cr3ea_status = "Failed - Pending Production";
                targetTourRecord.cr3ea_processstatus = "Failed - Pending Production";
                targetTourRecord.cr3ea_islineclear = false;
            }

            console.log("Updating parent tour with final checklist state: ", targetTourRecord);
            await PKGOPS_DAL.saveTour(targetTourRecord);

            if (typeof HideLoader === "function") HideLoader();
            alert(hasDeviation ? "Defects identified. Session submitted to Production for Corrective Action." : "Checklist completed and saved successfully!");
            
            // Reload page to refresh routing and update states
            window.location.reload();
        } catch (e) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to submit checklist: ", e);
            alert("Submission failed. Please check entries and try again.");
        }
    }
};
