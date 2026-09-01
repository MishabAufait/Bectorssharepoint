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
        document.getElementById("ppe-sample-size-input").addEventListener("input", () => this.calculateScores());
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

        this.calculateScores();
    },

    // Render 4 PPE items in checklist table
    renderChecklistTable: function () {
        const tbody = document.getElementById("ppe-checklist-tbody");
        if (!tbody) return;

        tbody.innerHTML = "";

        this.items.forEach((itemText, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding: 10px; font-weight: bold;">${index + 1}</td>
                <td style="padding: 10px; text-align: left;">${itemText}</td>
                <td style="padding: 10px;">
                    <input type="number" class="form-control ppe-defect-count" 
                           id="ppe-defect-count-${index}" min="0" value="0" 
                           style="width: 100px; text-align: center; margin: auto;"
                           oninput="PPEChecklistScreen.calculateScores()">
                </td>
            `;
            tbody.appendChild(tr);
        });

        this.calculateScores();
    },

    // Recalculate defects and compliance percentages
    calculateScores: function () {
        const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 0;
        const defectInputs = document.querySelectorAll(".ppe-defect-count");
        
        let totalDefects = 0;
        defectInputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            totalDefects += val;
        });

        // Compute Compliance Percentage
        let compliance = 100;
        if (sampleSize > 0) {
            compliance = ((sampleSize - totalDefects) / sampleSize) * 100;
            // Prevent negative compliance
            if (compliance < 0) compliance = 0;
        }

        // Update score indicators
        document.getElementById("ppe-total-defects-display").innerText = totalDefects;
        document.getElementById("ppe-compliance-display").innerText = compliance.toFixed(2) + "%";

        const badge = document.getElementById("ppe-score-badge");
        if (badge) {
            if (compliance >= 80) {
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
            trackerBanner.querySelector(".tracker-summary-text").innerText = "4 / 4 checkpoints filled (100%)";
            trackerBanner.querySelector(".tracker-estimated-score").innerText = compliance.toFixed(2) + "%";
            
            const trBadge = trackerBanner.querySelector(".tracker-score-badge");
            const trSampleSize = trackerBanner.querySelector(".tracker-count-samplesize");
            const trTotalDefects = trackerBanner.querySelector(".tracker-count-totaldefects");
            const trPossibleDefects = trackerBanner.querySelector(".tracker-count-possibledefects");

            const possibleDefectsVal = parseInt(document.getElementById("ppe-possible-defects-input").value) || 0;

            if (trSampleSize) trSampleSize.innerText = sampleSize;
            if (trTotalDefects) trTotalDefects.innerText = totalDefects;
            if (trPossibleDefects) trPossibleDefects.innerText = possibleDefectsVal;

            const isPass = compliance >= 80;
            if (trBadge) {
                trBadge.innerText = isPass ? "Pass" : "Fail";
                trBadge.style.backgroundColor = isPass ? "#dcfce7" : "#fee2e2";
                trBadge.style.color = isPass ? "#15803d" : "#b91c1c";
                trBadge.style.borderColor = isPass ? "#bbf7d0" : "#fecaca";
            }
            
            const estScoreEl = trackerBanner.querySelector(".tracker-estimated-score");
            if (estScoreEl) {
                estScoreEl.style.color = isPass ? "#15803d" : "#dc2626";
            }
            
            const prgBar = trackerBanner.querySelector(".progress-bar");
            if (prgBar) {
                prgBar.style.width = "100%";
                prgBar.style.backgroundColor = isPass ? "#16a34a" : "#dc2626";
            }
        }
    },

    // Submit PPE Checklist
    submit: async function () {
        try {
            const area = document.getElementById("ppeAreaSelect").value;
            const sampleSize = parseInt(document.getElementById("ppe-sample-size-input").value) || 0;
            const possibleDefects = parseInt(document.getElementById("ppe-possible-defects-input").value) || 0;
            const defectInputs = document.querySelectorAll(".ppe-defect-count");
            
            if (sampleSize <= 0) {
                alert("Please enter a valid Sample Size.");
                return;
            }

            // Input Validation: defect counts must be less than or equal to sample size
            let invalid = false;
            defectInputs.forEach((input, index) => {
                const val = parseInt(input.value) || 0;
                if (val < 0 || val > sampleSize) {
                    alert(`Defect count for Item ${index + 1} must be between 0 and Sample Size (${sampleSize}).`);
                    invalid = true;
                }
            });
            if (invalid) return;

            ShowLoader();

            let totalDefects = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate;
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            // 1. Prepare child items payloads
            this.items.forEach((itemText, index) => {
                const count = parseInt(document.getElementById(`ppe-defect-count-${index}`).value) || 0;
                totalDefects += count;

                const childPayload = {
                    cr953_food_safety_title: `PPE_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                    cr953_food_safety_checklisttype: "PPE Checklist",
                    cr953_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                    cr953_food_safety_line: FoodSafety_Main.state.selectedLine,
                    cr953_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                    cr953_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                    cr953_food_safety_area: area,
                    // OData Lookup Binding for parent Tour Record
                    "cr953_food_safety_tourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${FoodSafety_Main.state.varTourID})`,
                    cr953_food_safety_criteria: itemText,
                    cr953_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                    cr953_food_safety_defectcategory: count === 0 ? "Compliant" : "Non-Compliant",
                    cr953_food_safety_defectcount: count,
                    cr953_food_safety_samplesize: sampleSize,
                    cr953_food_safety_totalpossibledefects: possibleDefects,
                    cr953_food_safety_date: dateStr,
                    cr953_food_safety_time: timeStr
                };
                childRecords.push(childPayload);
            });

            // 2. Calculate compliance and threshold result
            const compliance = sampleSize > 0 ? (((sampleSize - totalDefects) / sampleSize) * 100) : 0;
            const resultStatus = compliance >= 80 ? "Pass" : "Fail";

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete observations...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            console.log(`Submitting ${childRecords.length} child PPE items to Dataverse...`, childRecords);
            
            // 3. Write child rows directly to Dataverse sequentially
            const total = childRecords.length;
            for (let i = 0; i < total; i++) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting observations... (${i + 1} of ${total})`);
                }
                try {
                    await FoodSafety_DAL.saveChecklistItem(childRecords[i]);
                } catch (err) {
                    throw new Error(`Failed to save checkpoint item #${i + 1} (${this.items[i]}): ${err.message}`);
                }
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
                cr3ea_tourcompletiondate: new Date().toISOString(),
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
            alert(`Error during submission: ${error.message}`);
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
            
            let totalDefects = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate || new Date();
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            this.items.forEach((itemText, index) => {
                const count = parseInt(document.getElementById(`ppe-defect-count-${index}`).value) || 0;
                totalDefects += count;

                const childPayload = {
                    cr953_food_safety_title: `PPE_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                    cr953_food_safety_checklisttype: "PPE Checklist",
                    cr953_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                    cr953_food_safety_line: FoodSafety_Main.state.selectedLine,
                    cr953_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                    cr953_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                    cr953_food_safety_area: area,
                    "cr953_food_safety_tourid@odata.bind": `/cr3ea_prod_rajpura_quality_tours(${FoodSafety_Main.state.varTourID})`,
                    cr953_food_safety_criteria: itemText,
                    cr953_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                    cr953_food_safety_defectcategory: count === 0 ? "Compliant" : "Non-Compliant",
                    cr953_food_safety_defectcount: count,
                    cr953_food_safety_samplesize: sampleSize,
                    cr953_food_safety_totalpossibledefects: possibleDefects,
                    cr953_food_safety_date: dateStr,
                    cr953_food_safety_time: timeStr
                };
                childRecords.push(childPayload);
            });

            const compliance = sampleSize > 0 ? (((sampleSize - totalDefects) / sampleSize) * 100) : 0;
            const resultStatus = compliance >= 80 ? "Pass" : "Fail";

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete observations...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            // Save child records sequentially
            const total = childRecords.length;
            for (let i = 0; i < total; i++) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Saving paused progress... (${i + 1} of ${total})`);
                }
                await FoodSafety_DAL.saveChecklistItem(childRecords[i]);
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
            alert(`Error during pause: ${error.message}`);
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
                document.getElementById("ppeAreaSelect").value = first.cr953_food_safety_area || "Mixing + Oven";
                document.getElementById("ppe-sample-size-input").value = first.cr953_food_safety_samplesize || 50;
                document.getElementById("ppe-possible-defects-input").value = first.cr953_food_safety_totalpossibledefects || 2;
                
                DropdownComponent.init("ppeAreaSelect");

                // Populate row inputs matching criteria
                this.items.forEach((itemText, idx) => {
                    const match = savedItems.find(item => item.cr953_food_safety_criteria === itemText);
                    if (match) {
                        const input = document.getElementById(`ppe-defect-count-${idx}`);
                        if (input) input.value = match.cr953_food_safety_defectcount || 0;
                    }
                });
            }

            this.calculateScores();
        } catch (err) {
            console.error("Failed to resume PPE checklist screen data:", err);
        } finally {
            HideLoader();
        }
    }
};
