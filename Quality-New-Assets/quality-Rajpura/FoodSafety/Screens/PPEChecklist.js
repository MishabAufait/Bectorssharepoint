// Screen 3: PPE Checklist Screen
console.log("PPE Checklist Screen loaded");

const PPEChecklistScreen = {
    items: [
        "Hair Net Wearing Issue / Beard Net",
        "Apron (Torn, Dirty)",
        "Personal Hygiene (Nail without trimming/paint, Heena application)",
        "Jewellery Policy (Bracelet, Thread, Ring, Bindi)"
    ],

    init: function () {
        console.log("Initializing PPE Checklist Screen...");
        
        // 1. Setup default values
        document.getElementById("ppeAreaSelect").value = "Mixing + Oven";
        document.getElementById("ppe-sample-size-input").value = 50;
        document.getElementById("ppe-possible-defects-input").value = 2;

        // 2. Initialize Select2
        DropdownComponent.init("ppeAreaSelect");

        // 3. Render checklist table
        this.renderChecklistTable();

        // 4. Hook up change events
        document.getElementById("ppeAreaSelect").addEventListener("change", () => this.handleAreaChange());
        document.getElementById("ppe-sample-size-input").addEventListener("input", () => this.handleSampleSizeChange());
        document.getElementById("ppe-sample-size-input").addEventListener("change", () => this.handleSampleSizeChange());
        document.getElementById("ppe-possible-defects-input").addEventListener("input", () => this.calculateScores());

        // 5. Render header component
        HeaderComponent.render("ppe-header-wrapper");
    },

    // Handle dependent defaults for Area
    handleAreaChange: function () {
        const area = document.getElementById("ppeAreaSelect").value;
        const sampleSizeInput = document.getElementById("ppe-sample-size-input");
        
        if (area === "Mixing + Oven") {
            sampleSizeInput.value = 50;
        } else if (area === "Packing") {
            sampleSizeInput.value = 100;
        }

        this.handleSampleSizeChange();
    },

    // Handle sample size change dynamically (updates max attribute and clamps existing inputs)
    handleSampleSizeChange: function () {
        const sampleSizeInput = document.getElementById("ppe-sample-size-input");
        let sampleSize = parseInt(sampleSizeInput?.value) || 0;
        if (sampleSize < 1) {
            sampleSize = 1;
            if (sampleSizeInput) sampleSizeInput.value = 1;
        }

        // Update max attribute and display
        const defectInputs = document.querySelectorAll(".ppe-defect-count");
        defectInputs.forEach(inp => {
            inp.max = sampleSize;
        });

        const maxDisplay = document.getElementById("ppe-max-sample-display");
        if (maxDisplay) maxDisplay.innerText = sampleSize;

        // Progressively clamp defect inputs so total never exceeds sample size
        let currentTotal = 0;
        defectInputs.forEach(inp => {
            let val = parseInt(inp.value) || 0;
            if (val < 0) {
                val = 0;
                inp.value = 0;
            }
            if (currentTotal + val > sampleSize) {
                val = Math.max(0, sampleSize - currentTotal);
                inp.value = val;
            }
            currentTotal += val;
        });

        this.calculateScores();
    },

    // Render 4 PPE items in checklist table
    renderChecklistTable: function () {
        const tbody = document.getElementById("ppe-checklist-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";
        const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 50;

        const maxDisplay = document.getElementById("ppe-max-sample-display");
        if (maxDisplay) maxDisplay.innerText = sampleSize;

        this.items.forEach((itemText, index) => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #e2e8f0";
            tr.innerHTML = `
                <td style="padding: 10px; font-weight: bold; width: 5%;">${index + 1}</td>
                <td style="padding: 10px; text-align: left; width: 45%;">${itemText}</td>
                <td style="padding: 10px; width: 15%;">
                    <input type="number" class="form-control ppe-defect-count" 
                           id="ppe-defect-count-${index}" min="0" max="${sampleSize}" value="" placeholder="0" 
                           style="width: 85px; text-align: center; margin: auto;"
                           oninput="PPEChecklistScreen.handleDefectInput(this, ${index})"
                           onchange="PPEChecklistScreen.handleDefectInput(this, ${index})">
                </td>
                <td style="padding: 10px; width: 35%; text-align: left;">
                    <div id="ppe-defect-details-${index}" style="display: none;">
                        <input type="text" class="form-control ppe-remarks-input" id="ppe-remarks-${index}" placeholder="Remarks (optional)" style="font-size: 12px; margin-bottom: 5px; width: 100%;">
                        <div class="ppe-file-wrapper" id="ppe-file-wrapper-${index}">
                            <label class="form-label" style="font-size: 11px; margin-bottom: 2px; color: #64748b; font-weight: 600; display: block;">
                                Proof Image/Doc (Optional):
                            </label>
                            <input type="file" class="form-control ppe-proof-file" id="ppe-proof-${index}" accept="image/*,application/pdf" style="font-size: 12px; padding: 4px 8px; height: auto;">
                            <div id="ppe-existing-proof-${index}" style="display: none; margin-top: 4px;"></div>
                        </div>
                    </div>
                    <span id="ppe-no-defect-msg-${index}" style="color: #94a3b8; font-size: 12px; font-style: italic;">No defects</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.calculateScores();
    },

    // Real-time restriction: prevents defect count or total defects from exceeding sample size
    handleDefectInput: function (input, index) {
        if (typeof FoodSafety_Validator !== 'undefined') {
            FoodSafety_Validator.highlight(input, false);
            FoodSafety_Validator.hideBanner("ppe-validation-banner");
        }

        const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 50;
        const raw = input.value.trim();

        if (raw === "") {
            const detailsEl = document.getElementById(`ppe-defect-details-${index}`);
            const noDefectMsg = document.getElementById(`ppe-no-defect-msg-${index}`);
            if (detailsEl) detailsEl.style.display = "none";
            if (noDefectMsg) noDefectMsg.style.display = "inline";
            this.calculateScores();
            return;
        }

        let val = parseInt(raw);

        if (isNaN(val) || val < 0) {
            val = 0;
            input.value = 0;
        }

        // Calculate total defects entered across all other rows
        const defectInputs = document.querySelectorAll(".ppe-defect-count");
        let otherTotal = 0;
        defectInputs.forEach((inp, i) => {
            if (i !== index) {
                const otherRaw = inp.value.trim();
                if (otherRaw !== "" && !isNaN(parseInt(otherRaw))) {
                    otherTotal += parseInt(otherRaw);
                }
            }
        });

        const maxAllowedForThisInput = Math.max(0, sampleSize - otherTotal);
        const warningEl = document.getElementById("ppe-defect-restriction-msg");

        if (val > maxAllowedForThisInput) {
            input.value = maxAllowedForThisInput;
            val = maxAllowedForThisInput;

            if (warningEl) {
                warningEl.style.display = "block";
                warningEl.innerHTML = `Defect count cannot exceed remaining sample capacity (<strong>${maxAllowedForThisInput}</strong>). Total defects cannot exceed defined Sample Size (<strong>${sampleSize}</strong>).`;
                clearTimeout(this._warningTimeout);
                this._warningTimeout = setTimeout(() => {
                    if (warningEl) warningEl.style.display = "none";
                }, 4500);
            }
        } else {
            if (warningEl && otherTotal + val <= sampleSize) {
                warningEl.style.display = "none";
            }
        }

        const detailsEl = document.getElementById(`ppe-defect-details-${index}`);
        const noDefectMsg = document.getElementById(`ppe-no-defect-msg-${index}`);
        if (val > 0) {
            if (detailsEl) detailsEl.style.display = "block";
            if (noDefectMsg) noDefectMsg.style.display = "none";
        } else {
            if (detailsEl) detailsEl.style.display = "none";
            if (noDefectMsg) noDefectMsg.style.display = "inline";
            const remInp = document.getElementById(`ppe-remarks-${index}`);
            if (remInp) remInp.value = "";
            const fileInp = document.getElementById(`ppe-proof-${index}`);
            if (fileInp) fileInp.value = "";
            const existP = document.getElementById(`ppe-existing-proof-${index}`);
            if (existP) {
                existP.style.display = "none";
                existP.innerHTML = "";
                existP.removeAttribute("data-url");
            }
        }

        this.calculateScores();
    },

    // Recalculate defects and compliance percentages
    calculateScores: function () {
        const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 0;
        const defectInputs = document.querySelectorAll(".ppe-defect-count");
        
        let totalDefects = 0;
        let filledCount = 0;
        defectInputs.forEach(input => {
            const raw = input.value.trim();
            if (raw !== "" && !isNaN(parseInt(raw))) {
                filledCount++;
                totalDefects += parseInt(raw);
            }
        });

        // Strict limit: Total defects cannot exceed sample size
        if (totalDefects > sampleSize && sampleSize > 0) {
            totalDefects = sampleSize;
        }

        // Compute Compliance Percentage
        let compliance = 100;
        if (sampleSize > 0) {
            compliance = ((sampleSize - totalDefects) / sampleSize) * 100;
            // Prevent negative compliance and clamp between 0% and 100%
            if (compliance < 0) compliance = 0;
            if (compliance > 100) compliance = 100;
        }

        const isComplete = filledCount === defectInputs.length && defectInputs.length > 0;
        const progressPercent = defectInputs.length > 0 ? Math.round((filledCount / defectInputs.length) * 100) : 0;

        // Update score indicators
        const totalDefectsDisplay = document.getElementById("ppe-total-defects-display");
        if (totalDefectsDisplay) totalDefectsDisplay.innerText = filledCount > 0 ? totalDefects : "0";

        const complianceDisplay = document.getElementById("ppe-compliance-display");
        if (complianceDisplay) {
            complianceDisplay.innerText = filledCount > 0 ? (compliance.toFixed(2) + "%") : "--";
        }

        const isPass = compliance >= 80;
        const badge = document.getElementById("ppe-score-badge");
        if (badge) {
            if (!isComplete && filledCount === 0) {
                badge.innerText = "Pending";
                badge.style.backgroundColor = "#f1f5f9";
                badge.style.color = "#64748b";
                badge.style.borderColor = "#cbd5e1";
            } else if (isPass) {
                badge.innerText = "Pass";
                badge.style.backgroundColor = "#dcfce7";
                badge.style.color = "#15803d";
                badge.style.borderColor = "#bbf7d0";
            } else {
                badge.innerText = "Fail";
                badge.style.backgroundColor = "#fee2e2";
                badge.style.color = "#b91c1c";
                badge.style.borderColor = "#fecaca";
            }
        }

        // Update progress tracker banner
        const trackerBanner = document.getElementById("ppe-tracker-banner");
        if (trackerBanner) {
            trackerBanner.style.display = "block";
            trackerBanner.querySelector(".tracker-summary-text").innerText = `${filledCount} / ${defectInputs.length} checkpoints filled (${progressPercent}%)`;
            
            const estScoreEl = trackerBanner.querySelector(".tracker-estimated-score");
            if (estScoreEl) {
                estScoreEl.innerText = filledCount > 0 ? (compliance.toFixed(2) + "%") : "--";
                estScoreEl.style.color = !isComplete && filledCount === 0 ? "#64748b" : (isPass ? "#15803d" : "#dc2626");
            }
            
            const trBadge = trackerBanner.querySelector(".tracker-score-badge");
            const trSampleSize = trackerBanner.querySelector(".tracker-count-samplesize");
            const trTotalDefects = trackerBanner.querySelector(".tracker-count-totaldefects");
            const trPossibleDefects = trackerBanner.querySelector(".tracker-count-possibledefects");

            const possibleDefectsVal = parseInt(document.getElementById("ppe-possible-defects-input").value) || 0;

            if (trSampleSize) trSampleSize.innerText = sampleSize;
            if (trTotalDefects) trTotalDefects.innerText = filledCount > 0 ? totalDefects : 0;
            if (trPossibleDefects) trPossibleDefects.innerText = possibleDefectsVal;

            if (trBadge) {
                if (!isComplete && filledCount === 0) {
                    trBadge.innerText = "Pending";
                    trBadge.style.backgroundColor = "#f1f5f9";
                    trBadge.style.color = "#64748b";
                    trBadge.style.borderColor = "#cbd5e1";
                } else {
                    trBadge.innerText = isPass ? "Pass" : "Fail";
                    trBadge.style.backgroundColor = isPass ? "#dcfce7" : "#fee2e2";
                    trBadge.style.color = isPass ? "#15803d" : "#b91c1c";
                    trBadge.style.borderColor = isPass ? "#bbf7d0" : "#fecaca";
                }
            }
            
            const prgBar = trackerBanner.querySelector(".progress-bar");
            if (prgBar) {
                prgBar.style.width = `${progressPercent}%`;
                prgBar.style.backgroundColor = !isComplete && filledCount === 0 ? "#0284c7" : (isPass ? "#16a34a" : "#dc2626");
            }
        }
    },

    // Submit PPE Checklist
    submit: async function () {
        try {
            if (typeof FoodSafety_Validator !== 'undefined') {
                FoodSafety_Validator.clearAll("screen-ppe-checklist");
                FoodSafety_Validator.hideBanner("ppe-validation-banner");
            }

            const areaEl = document.getElementById("ppeAreaSelect");
            const area = areaEl ? areaEl.value.trim() : "";
            const sampleSizeEl = document.getElementById("ppe-sample-size-input");
            const sampleSizeVal = sampleSizeEl ? sampleSizeEl.value.trim() : "";
            const sampleSize = parseInt(sampleSizeVal) || 0;
            const possibleDefectsEl = document.getElementById("ppe-possible-defects-input");
            const possibleDefectsVal = possibleDefectsEl ? possibleDefectsEl.value.trim() : "";
            const possibleDefects = parseInt(possibleDefectsVal) || 0;
            const defectInputs = document.querySelectorAll(".ppe-defect-count");

            const missingFields = [];
            let firstInvalidEl = null;

            if (!area) {
                missingFields.push("Area");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(areaEl, true);
                if (!firstInvalidEl) firstInvalidEl = areaEl;
            }

            if (!sampleSizeVal || isNaN(sampleSize) || sampleSize <= 0) {
                missingFields.push("Valid Sample Size (> 0)");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(sampleSizeEl, true);
                if (!firstInvalidEl) firstInvalidEl = sampleSizeEl;
            }

            if (!possibleDefectsVal || isNaN(possibleDefects) || possibleDefects <= 0) {
                missingFields.push("Total Possible Defects (> 0)");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(possibleDefectsEl, true);
                if (!firstInvalidEl) firstInvalidEl = possibleDefectsEl;
            }

            let unfilledCount = 0;
            let invalidCount = 0;
            let checkTotalDefects = 0;

            defectInputs.forEach((input, index) => {
                const raw = input.value.trim();
                if (raw === "" || isNaN(parseInt(raw))) {
                    unfilledCount++;
                    if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(input, true);
                    if (!firstInvalidEl) firstInvalidEl = input;
                } else {
                    const val = parseInt(raw);
                    if (val < 0 || (sampleSize > 0 && val > sampleSize)) {
                        invalidCount++;
                        if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(input, true);
                        if (!firstInvalidEl) firstInvalidEl = input;
                    }
                    checkTotalDefects += val;
                }
            });

            if (unfilledCount > 0) {
                missingFields.push(`Defect count for ${unfilledCount} checkpoint(s)`);
            }
            if (invalidCount > 0) {
                missingFields.push(`Defect count must be between 0 and Sample Size (${sampleSize})`);
            }
            if (checkTotalDefects > sampleSize && sampleSize > 0) {
                missingFields.push(`Total defects (${checkTotalDefects}) cannot exceed defined Sample Size (${sampleSize})`);
                defectInputs.forEach(input => {
                    if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(input, true);
                });
                if (!firstInvalidEl) firstInvalidEl = defectInputs[0];
            }

            if (missingFields.length > 0) {
                const errorMsg = "Form incomplete: Please complete all required fields before submitting: " + missingFields.join("; ") + ".";
                if (typeof FoodSafety_Validator !== 'undefined') {
                    FoodSafety_Validator.showBanner("ppe-validation-banner", errorMsg);
                }
                alert(errorMsg);
                if (firstInvalidEl) {
                    firstInvalidEl.focus();
                    firstInvalidEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                return;
            }

            ShowLoader();

            let totalDefects = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate;
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            // 1. Prepare child items payloads with proof uploads
            for (let index = 0; index < this.items.length; index++) {
                const itemText = this.items[index];
                const count = parseInt(document.getElementById(`ppe-defect-count-${index}`).value) || 0;
                totalDefects += count;

                let finalRemarks = "";
                if (count > 0) {
                    const remarksInp = document.getElementById(`ppe-remarks-${index}`);
                    const remarks = remarksInp ? remarksInp.value.trim() : "";
                    const fileInput = document.getElementById(`ppe-proof-${index}`);
                    const existingProofEl = document.getElementById(`ppe-existing-proof-${index}`);
                    const existingUrl = existingProofEl ? existingProofEl.getAttribute("data-url") : "";
                    let proofUrl = "";

                    // Strip any previous Proof: path if text input contained it
                    const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                        ? QualityRajpura_Config.parseRemarksAndProof(remarks)
                        : { remarks: remarks.replace(/\|?\s*Proof:\s*.*$/i, "").trim(), proofUrl: "" };
                    const cleanRemarks = parsed.remarks;

                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                        if (typeof ShowProgressLoader === "function") {
                            ShowProgressLoader(10, `Uploading proof for PPE item ${index + 1}...`);
                        }
                        try {
                            proofUrl = await FoodSafety_DAL.uploadAttachmentFile(fileInput.files[0], FoodSafety_Main.state.varTourID, "PPE", `PPE_${index + 1}`, cleanRemarks);
                        } catch (upErr) {
                            console.warn(`Failed to upload proof for PPE item ${index + 1}:`, upErr);
                        }
                    } else if (existingUrl) {
                        proofUrl = existingUrl;
                    } else if (parsed.proofUrl) {
                        proofUrl = parsed.proofUrl;
                    }

                    finalRemarks = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatRemarksWithProof)
                        ? QualityRajpura_Config.formatRemarksWithProof(cleanRemarks, proofUrl)
                        : (proofUrl ? (cleanRemarks ? `${cleanRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`) : cleanRemarks);
                }

                const childPayload = {
                    cr3ea_food_safety_title: `PPE_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                    cr3ea_food_safety_checklisttype: "PPE Checklist",
                    cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                    cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                    cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                    cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                    cr3ea_food_safety_area: area,
                    // OData Lookup Binding for parent Tour Record
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                    cr3ea_food_safety_criteria: itemText,
                    cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                    cr3ea_food_safety_defectcategory: count === 0 ? "Compliant" : "Non-Compliant",
                    cr3ea_food_safety_defectcount: count,
                    cr3ea_food_safety_defectremarks: finalRemarks,
                    cr3ea_food_safety_samplesize: sampleSize,
                    cr3ea_food_safety_totalpossibledefects: possibleDefects,
                    cr3ea_food_safety_date: dateStr,
                    cr3ea_food_safety_time: timeStr
                };
                childRecords.push(childPayload);
            }

            // 2. Calculate compliance and threshold result
            const compliance = sampleSize > 0 ? (((sampleSize - totalDefects) / sampleSize) * 100) : 0;
            const resultStatus = compliance >= 80 ? "Pass" : "Fail";

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete observations...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            console.log(`Submitting ${childRecords.length} child PPE items to Dataverse...`, childRecords);
            
            // 3. Write child rows in parallel chunks of 8
            const CHUNK_SIZE = 8;
            const total = childRecords.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = childRecords.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round((currentCount / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting observations (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => FoodSafety_DAL.saveChecklistItem(rec)));
            }
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing submission...");
            }

            // 4. Update the parent Tour record in Dataverse
            const parentUpdatePayload = {
                cr3ea_prod_rajpura_quality_tourid: FoodSafety_Main.state.varTourID,
                cr3ea_overall_score: compliance.toFixed(2) + "%",
                cr3ea_checklist_result: resultStatus,
                cr3ea_status: "Submitted",
                cr3ea_food_safety_area: area,
                cr3ea_food_safety_samplesize: sampleSize,
                cr3ea_food_safety_totalpossibledefects: possibleDefects,
                cr3ea_food_safety_totaldefects: totalDefects
            };

            console.log("Updating parent tour session record metadata:", parentUpdatePayload);
            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("PPE Checklist submitted successfully!");
            // Reset state and navigate to screen-summary
            const submittedTourId = FoodSafety_Main.state.varTourID;
            FoodSafety_Main.state.varTourID = null;
            FoodSafety_Main.navigateTo("screen-summary");
            if (typeof FoodSafety_Summary !== 'undefined' && FoodSafety_Summary.init) {
                FoodSafety_Summary.init(submittedTourId);
            }
        } catch (error) {
            console.error("Failed submitting PPE checklist:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit PPE checklist")
                : `Error during submission: ${error.message}`;
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    pauseTour: async function () {
        const confirmPause = confirm("Are you sure you want to pause this audit session? Your entered details will be saved, and you can resume later.");
        if (!confirmPause) return;

        try {
            ShowLoader();

            const area = document.getElementById("ppeAreaSelect").value;
            const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 0;
            const possibleDefects = parseInt(document.getElementById("ppe-possible-defects-input").value) || 0;
            const defectInputs = document.querySelectorAll(".ppe-defect-count");
            
            if (sampleSize <= 0) {
                alert("Please enter a valid Sample Size.");
                return;
            }

            // Defect validation before pausing
            let checkTotalDefects = 0;
            defectInputs.forEach(input => {
                checkTotalDefects += (parseInt(input.value) || 0);
            });
            if (checkTotalDefects > sampleSize) {
                alert(`Total defects (${checkTotalDefects}) cannot exceed the defined Sample Size (${sampleSize}). Please adjust the defect counts before pausing.`);
                return;
            }

            let totalDefects = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate || new Date();
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            for (let index = 0; index < this.items.length; index++) {
                const itemText = this.items[index];
                const count = parseInt(document.getElementById(`ppe-defect-count-${index}`).value) || 0;
                totalDefects += count;

                let finalRemarks = "";
                if (count > 0) {
                    const remarksInp = document.getElementById(`ppe-remarks-${index}`);
                    const remarks = remarksInp ? remarksInp.value.trim() : "";
                    const fileInput = document.getElementById(`ppe-proof-${index}`);
                    const existingProofEl = document.getElementById(`ppe-existing-proof-${index}`);
                    const existingUrl = existingProofEl ? existingProofEl.getAttribute("data-url") : "";
                    let proofUrl = "";

                    // Strip any previous Proof: path if text input contained it
                    const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                        ? QualityRajpura_Config.parseRemarksAndProof(remarks)
                        : { remarks: remarks.replace(/\|?\s*Proof:\s*.*$/i, "").trim(), proofUrl: "" };
                    const cleanRemarks = parsed.remarks;

                    if (fileInput && fileInput.files && fileInput.files.length > 0) {
                        if (typeof ShowProgressLoader === "function") {
                            ShowProgressLoader(10, `Uploading proof for PPE item ${index + 1}...`);
                        }
                        try {
                            proofUrl = await FoodSafety_DAL.uploadAttachmentFile(fileInput.files[0], FoodSafety_Main.state.varTourID, "PPE", `PPE_${index + 1}`, cleanRemarks);
                        } catch (upErr) {
                            console.warn(`Failed to upload proof for PPE item ${index + 1}:`, upErr);
                        }
                    } else if (existingUrl) {
                        proofUrl = existingUrl;
                    } else if (parsed.proofUrl) {
                        proofUrl = parsed.proofUrl;
                    }

                    finalRemarks = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatRemarksWithProof)
                        ? QualityRajpura_Config.formatRemarksWithProof(cleanRemarks, proofUrl)
                        : (proofUrl ? (cleanRemarks ? `${cleanRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`) : cleanRemarks);
                }

                const childPayload = {
                    cr3ea_food_safety_title: `PPE_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                    cr3ea_food_safety_checklisttype: "PPE Checklist",
                    cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                    cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                    cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                    cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                    cr3ea_food_safety_area: area,
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                    cr3ea_food_safety_criteria: itemText,
                    cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                    cr3ea_food_safety_defectcategory: count === 0 ? "Compliant" : "Non-Compliant",
                    cr3ea_food_safety_defectcount: count,
                    cr3ea_food_safety_defectremarks: finalRemarks,
                    cr3ea_food_safety_samplesize: sampleSize,
                    cr3ea_food_safety_totalpossibledefects: possibleDefects,
                    cr3ea_food_safety_date: dateStr,
                    cr3ea_food_safety_time: timeStr
                };
                childRecords.push(childPayload);
            }

            const compliance = sampleSize > 0 ? (((sampleSize - totalDefects) / sampleSize) * 100) : 0;
            const resultStatus = compliance >= 80 ? "Pass" : "Fail";

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete observations...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            // Save child records in parallel chunks of 8
            const CHUNK_SIZE = 8;
            const total = childRecords.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = childRecords.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round((currentCount / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Saving paused progress (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => FoodSafety_DAL.saveChecklistItem(rec)));
            }
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing pause...");
            }

            // Update parent session with InProgress-paused status
            const parentUpdatePayload = {
                cr3ea_prod_rajpura_quality_tourid: FoodSafety_Main.state.varTourID,
                cr3ea_overall_score: compliance.toFixed(2) + "%",
                cr3ea_checklist_result: resultStatus,
                cr3ea_status: "InProgress-paused",
                cr3ea_food_safety_area: area,
                cr3ea_food_safety_samplesize: sampleSize,
                cr3ea_food_safety_totalpossibledefects: possibleDefects,
                cr3ea_food_safety_totaldefects: totalDefects
            };

            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("Tour paused successfully!");
            
            // Redirect back to SharePoint Welcome page
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;

        } catch (error) {
            console.error("Failed pausing PPE checklist:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "pause PPE checklist")
                : `Error during pause: ${error.message}`;
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // Resume flow from existing Tour GUID
    resume: async function () {
        try {
            ShowLoader();
            
            // Always render default table structure first so inputs exist in the DOM
            this.renderChecklistTable();
            
            const savedItems = await FoodSafety_DAL.getChecklistItems(FoodSafety_Main.state.varTourID);
            
            if (savedItems && savedItems.length > 0) {
                // Populate Site configuration values
                const first = savedItems[0];
                document.getElementById("ppeAreaSelect").value = first.cr3ea_food_safety_area || first.cr953_food_safety_area || "Mixing + Oven";
                const loadedSampleSize = first.cr3ea_food_safety_samplesize || first.cr953_food_safety_samplesize || 50;
                document.getElementById("ppe-sample-size-input").value = loadedSampleSize;
                document.getElementById("ppe-possible-defects-input").value = first.cr3ea_food_safety_totalpossibledefects || first.cr953_food_safety_totalpossibledefects || 2;
                
                DropdownComponent.init("ppeAreaSelect");

                // Populate row inputs matching criteria
                this.items.forEach((itemText, idx) => {
                    const match = savedItems.find(item => (item.cr3ea_food_safety_criteria === itemText || item.cr953_food_safety_criteria === itemText));
                    if (match) {
                        const input = document.getElementById(`ppe-defect-count-${idx}`);
                        const countVal = (match.cr3ea_food_safety_defectcount !== undefined ? match.cr3ea_food_safety_defectcount : match.cr953_food_safety_defectcount) || 0;
                        if (input) {
                            input.value = Math.max(0, Math.min(countVal, loadedSampleSize));
                        }

                        const detailsEl = document.getElementById(`ppe-defect-details-${idx}`);
                        const noDefectMsg = document.getElementById(`ppe-no-defect-msg-${idx}`);
                        const remarksInp = document.getElementById(`ppe-remarks-${idx}`);
                        const fileWrap = document.getElementById(`ppe-file-wrapper-${idx}`);
                        const existingProofEl = document.getElementById(`ppe-existing-proof-${idx}`);

                        if (countVal > 0) {
                            if (detailsEl) detailsEl.style.display = "block";
                            if (noDefectMsg) noDefectMsg.style.display = "none";

                            const rawRemarks = match.cr3ea_food_safety_defectremarks || match.cr953_food_safety_defectremarks || "";
                            const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                                ? QualityRajpura_Config.parseRemarksAndProof(rawRemarks)
                                : { remarks: "", proofUrl: "" };

                            const remarksText = parsed.remarks;
                            const proofUrl = parsed.proofUrl;

                            if (remarksInp) remarksInp.value = remarksText;
                            if (proofUrl && existingProofEl) {
                                existingProofEl.style.display = "block";
                                existingProofEl.setAttribute("data-url", proofUrl);
                                existingProofEl.innerHTML = `<a href="${proofUrl}" target="_blank" class="badge food-safety-proof-badge" style="background-color: #0284c7 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-decoration: none !important; padding: 4px 10px !important; border-radius: 4px !important; display: inline-flex !important; align-items: center !important; gap: 5px !important; font-size: 11px !important; font-weight: 600 !important;"><span style="color: #ffffff !important;">View Attached Proof</span></a>`;
                            }
                        }
                    }
                });

                // Apply sample size bounds and recalculate scores
                this.handleSampleSizeChange();
            } else {
                this.calculateScores();
            }
        } catch (err) {
            console.error("Failed to resume PPE checklist screen data:", err);
        } finally {
            HideLoader();
        }
    }
};
