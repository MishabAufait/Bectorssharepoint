// Screen 3: PCI Checklist Screen (Pest Control Inspection)
console.log("PCI Checklist Screen loaded");

const PCIChecklistScreen = {
    // Locations lists
    newBlockLocations: [
        "Hand Wash Area", "Plant Entry", "Near Washing Area", "Near Emergency Gate", 
        "Near Packing Area", "Invert Syrup Room", "Broken Room", "Premixing Room", 
        "Mixing Entrance", "Washing Area", "Infront of Terrace Gate", 
        "New Plant Worker Entry 1", "New Plant Worker Entry 2", "Cream Room", 
        "Line 7 Packing", "RM Unloading Bay 1", "RM Unloading Bay 2", 
        "Line 6 Packing", "RM Store 1st Floor"
    ],
    
    oldBlockLocations: [
        "RM Unloading Bay", "Biscuit Grinding Room", "RM Storage", "Outside Cold Room", 
        "Maintenance Change Room", "Outside Maintenance Change Room", "Oven Area", 
        "Outside QA Lab", "Staff Hand Wash", "Outside Staff Canteen", "Staff Canteen", 
        "Near Worker Entry", "Worker Entry Hand Wash Area", "Outside HR Office", 
        "Near PM Warehouse Door", "Near PM Warehouse", "Near FG Warehouse Door", 
        "Outside DH Room", "Near Emergency Exit 1", "Near Emergency Exit 2", 
        "Near Emergency Exit 3", "Near Emergency Exit 4", "Near Emergency Exit 5", 
        "Wash Area", "Mixing Section HAAS Line", "Cooling Conveyor HAAS Line", 
        "Packing Section HAAS Line", "Outside Flavour Room", "New Cold Room Gallery 1", 
        "New Cold Room Gallery 2", "PM Warehouse", "FG Warehouse", "Worker Canteen", 
        "Mondelez Packing", "Line 8 Packing", "Line 8 Mixing", "FG Main Warehouse"
    ],

    observationTypes: ["Lizard", "Insects", "Rodents", "Cockroach", "Store Insects", "Others"],

    init: function () {
        console.log("Initializing PCI Checklist Screen...");
        
        // Reset view state to show checklist directly using area selected in screen 2
        document.getElementById("pci-checklist-panel").style.display = "block";
        HeaderComponent.render("pci-header-wrapper");
        this.renderChecklist();
    },

    // Unlock checklist display on clicking Start Session
    startSession: function () {
        document.getElementById("pci-start-btn").style.display = "none";
        document.getElementById("pci-checklist-panel").style.display = "block";
        document.getElementById("pciAreaSelect").disabled = true;

        this.renderChecklist();
    },

    // Render locations checklist dynamically
    renderChecklist: function () {
        const area = FoodSafety_Main.state.selectedArea || "Old Block";
        const container = document.getElementById("pci-locations-container");
        if (!container) return;

        container.innerHTML = "";

        const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;

        locations.forEach((locName, index) => {
            const rowHtml = `
                <div class="bs-card pci-location-card" id="pci-loc-card-${index}" data-location="${locName}" style="margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: visible; background: #ffffff;">
                    <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                        <h5 style="margin: 0; font-weight: 600; font-size: 14px; color: #1e293b;">${index + 1}. ${locName}</h5>
                        <div class="select2-parent" style="width: 150px;">
                            <select class="form-select pci-status-select" id="pci-status-${index}" onchange="PCIChecklistScreen.handleStatusChange(${index})">
                                <option value="" selected>Select</option>
                                <option value="Okay">Okay</option>
                                <option value="Not Okay">Not Okay</option>
                            </select>
                        </div>
                    </div>
                    <div class="bs-card-body pci-obs-body" id="pci-obs-body-${index}" style="display: none; padding: 15px; background: #fdfdfd;">
                        <div id="pci-observations-list-${index}">
                            <!-- Add observations list dynamically -->
                        </div>
                        <div style="margin-top: 10px;">
                            <button type="button" class="bs-btn bs-btn-secondary" style="font-size: 12px; padding: 5px 12px;" onclick="PCIChecklistScreen.addObservation(${index})">
                                ➕ Add another observation
                            </button>
                        </div>
                    </div>
                </div>
            `;
            const div = document.createElement("div");
            div.innerHTML = rowHtml;
            container.appendChild(div);

            // Initialize status Select2 dropdown
            DropdownComponent.init(`pci-status-${index}`);
        });

        this.calculateScores();
    },

    // Handle status choice changes
    handleStatusChange: function (index) {
        const status = document.getElementById(`pci-status-${index}`).value;
        const obsBody = document.getElementById(`pci-obs-body-${index}`);
        
        if (status === "Not Okay") {
            obsBody.style.display = "block";
            // Pre-add first observation block
            const list = document.getElementById(`pci-observations-list-${index}`);
            if (list && list.children.length === 0) {
                this.addObservation(index);
            }
        } else {
            obsBody.style.display = "none";
            const list = document.getElementById(`pci-observations-list-${index}`);
            if (list) list.innerHTML = "";
        }

        this.calculateScores();
    },

    // Add repeatable observation sub-form
    addObservation: function (locIndex) {
        const list = document.getElementById(`pci-observations-list-${locIndex}`);
        if (!list) return;

        const obsIndex = list.children.length;
        const row = document.createElement("div");
        row.className = "d-flex align-items-center pci-obs-row mb-2";
        row.id = `pci-obs-row-${locIndex}-${obsIndex}`;
        row.style.display = "flex";
        row.style.gap = "10px";
        row.style.marginBottom = "10px";

        // Generate type options
        const typeOptions = this.observationTypes.map(t => `<option value="${t}">${t}</option>`).join("");

        row.innerHTML = `
            <div class="select2-parent" style="flex: 2; min-width: 150px;">
                <select class="form-select pci-obs-type" id="pci-obs-type-${locIndex}-${obsIndex}">
                    ${typeOptions}
                </select>
            </div>
            <div style="flex: 1; min-width: 80px;">
                <input type="number" class="form-control pci-obs-count" id="pci-obs-count-${locIndex}-${obsIndex}" 
                       min="1" value="1" style="height: 42px; text-align: center;" placeholder="Count">
            </div>
            <div style="width: 45px; display: flex; align-items: center; justify-content: center;">
                <button type="button" style="background: transparent; border: none; padding: 0; width: 42px; height: 42px; font-size: 20px; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="PCIChecklistScreen.removeObservation(${locIndex}, ${obsIndex})">
                    🗑
                </button>
            </div>
        `;

        list.appendChild(row);

        // Initialize newly added type Select2 dropdown
        DropdownComponent.init(`pci-obs-type-${locIndex}-${obsIndex}`);
    },

    // Remove repeatable observation sub-form row
    removeObservation: function (locIndex, obsIndex) {
        const row = document.getElementById(`pci-obs-row-${locIndex}-${obsIndex}`);
        if (row) {
            row.remove();
        }
        
        // If no observations left, change status back to Okay
        const list = document.getElementById(`pci-observations-list-${locIndex}`);
        if (list && list.children.length === 0) {
            document.getElementById(`pci-status-${locIndex}`).value = "Okay";
            $(`#pci-status-${locIndex}`).trigger("change");
        }
    },

    // Submit PCI Checklist
    submit: async function () {
        try {
            const area = FoodSafety_Main.state.selectedArea || "Old Block";
            const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate;
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            let hasNotOkay = false;
            // 1. Pre-validation checks
            let unansweredCount = 0;
            let missingObsCount = 0;
            let invalidCountVal = false;

            locations.forEach((locName, idx) => {
                const status = document.getElementById(`pci-status-${idx}`).value;
                if (!status) {
                    unansweredCount++;
                } else if (status === "Not Okay") {
                    const listContainer = document.getElementById(`pci-observations-list-${idx}`);
                    const rows = listContainer ? listContainer.querySelectorAll(".pci-obs-row") : [];
                    if (rows.length === 0) {
                        missingObsCount++;
                    } else {
                        rows.forEach(row => {
                            const countInput = row.querySelector(".pci-obs-count");
                            const count = parseInt(countInput ? countInput.value : 1) || 0;
                            if (count <= 0) {
                                invalidCountVal = true;
                            }
                        });
                    }
                }
            });

            if (unansweredCount > 0 || missingObsCount > 0 || invalidCountVal) {
                let msg = "";
                if (unansweredCount > 0) {
                    msg += `Please select a status for the remaining ${unansweredCount} location(s).\n`;
                }
                if (missingObsCount > 0) {
                    msg += `Please add at least one observation for the ${missingObsCount} location(s) marked as "Not Okay".\n`;
                }
                if (invalidCountVal) {
                    msg += "Observation count for all entries must be at least 1.";
                }
                alert(msg.trim());
                return;
            }

            // 2. Gather all inputs per location
            locations.forEach((locName, idx) => {
                const status = document.getElementById(`pci-status-${idx}`).value;

                if (status === "Okay") {
                    // Okay location - writes exactly 1 child row with status = Okay
                    childRecords.push({
                        cr3ea_food_safety_title: `PCI_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                        cr3ea_food_safety_checklisttype: "PCI Checklist",
                        cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                        cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                        cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                        cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                        cr3ea_food_safety_areaincharge: FoodSafety_Main.state.areaIncharge,
                        cr3ea_food_safety_area: area,
                        cr3ea_food_safety_location: locName,
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                        cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                        cr3ea_food_safety_status: "Okay",
                        cr3ea_food_safety_date: dateStr,
                        cr3ea_food_safety_time: timeStr
                    });
                } else {
                    hasNotOkay = true;
                    const listContainer = document.getElementById(`pci-observations-list-${idx}`);
                    const rows = listContainer ? listContainer.querySelectorAll(".pci-obs-row") : [];

                    rows.forEach(row => {
                        const typeSelect = row.querySelector(".pci-obs-type");
                        const countInput = row.querySelector(".pci-obs-count");

                        const type = typeSelect ? typeSelect.value : "Others";
                        const count = parseInt(countInput ? countInput.value : 1) || 1;

                        childRecords.push({
                            cr3ea_food_safety_title: `PCI_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                            cr3ea_food_safety_checklisttype: "PCI Checklist",
                            cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                            cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                            cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                            cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                            cr3ea_food_safety_areaincharge: FoodSafety_Main.state.areaIncharge,
                            cr3ea_food_safety_area: area,
                            cr3ea_food_safety_location: locName,
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                            cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                            cr3ea_food_safety_status: "Not Okay",
                            cr3ea_food_safety_observationtype: type,
                            cr3ea_food_safety_defectcount: count,
                            cr3ea_food_safety_date: dateStr,
                            cr3ea_food_safety_time: timeStr
                        });
                    });
                }
            });



            ShowLoader();

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete items...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            console.log(`Submitting ${childRecords.length} child PCI rows to Dataverse...`);

            // 2. Sequentially save each row directly to Dataverse
            const total = childRecords.length;
            for (let i = 0; i < total; i++) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting observations... (${i + 1} of ${total})`);
                }
                try {
                    await FoodSafety_DAL.saveChecklistItem(childRecords[i]);
                } catch (err) {
                    const loc = childRecords[i].cr3ea_food_safety_location || childRecords[i].cr953_food_safety_location;
                    throw new Error(`Failed to save location observation #${i + 1} (${loc}): ${err.message}`);
                }
            }
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing submission...");
            }

            // 3. Update the parent Tour Session record in Dataverse
            const parentUpdatePayload = {
                cr3ea_prod_rajpura_quality_tourid: FoodSafety_Main.state.varTourID,
                cr3ea_checklist_result: hasNotOkay ? "Fail" : "Pass",
                cr3ea_status: "Submitted",
                cr3ea_tourcompletiondate: new Date().toISOString(),
                cr3ea_food_safety_area: area
            };

            console.log("Updating parent tour session record metadata:", parentUpdatePayload);
            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("PCI Checklist submitted successfully!");
            // Reset state and navigate to screen-summary
            const submittedTourId = FoodSafety_Main.state.varTourID;
            FoodSafety_Main.state.varTourID = null;
            FoodSafety_Main.navigateTo("screen-summary");
            if (typeof FoodSafety_Summary !== 'undefined' && FoodSafety_Summary.init) {
                FoodSafety_Summary.init(submittedTourId);
            }
        } catch (error) {
            console.error("Failed submitting PCI checklist:", error);
            alert(`Error during submission: ${error.message}`);
        } finally {
            HideLoader();
        }
    },

    calculateScores: function () {
        const area = FoodSafety_Main.state.selectedArea || "Old Block";
        const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;
        const totalCheckpoints = locations.length;

        let okayCount = 0;
        let notOkayCount = 0;
        let pendingCount = 0;

        locations.forEach((locName, idx) => {
            const statusEl = document.getElementById(`pci-status-${idx}`);
            const status = statusEl ? statusEl.value : "";
            if (status === "Okay") {
                okayCount++;
            } else if (status === "Not Okay") {
                notOkayCount++;
            } else {
                pendingCount++;
            }
        });

        const filledCount = okayCount + notOkayCount;
        const progressPercent = totalCheckpoints > 0 ? Math.round((filledCount / totalCheckpoints) * 100) : 0;
        const hasNotOkay = notOkayCount > 0;
        const resultStatus = hasNotOkay ? "Fail" : "Pass";

        // Update progress tracker banner
        const trackerBanner = document.getElementById("pci-tracker-banner");
        if (trackerBanner) {
            trackerBanner.querySelector(".tracker-summary-text").innerHTML = `<strong>${filledCount}</strong> of <strong>${totalCheckpoints}</strong> checkpoints filled (${progressPercent}%)`;
            trackerBanner.querySelector(".tracker-estimated-score").innerText = resultStatus;
            
            const trBadge = trackerBanner.querySelector(".tracker-score-badge");
            const trOkay = trackerBanner.querySelector(".tracker-count-okay");
            const trNotOkay = trackerBanner.querySelector(".tracker-count-notokay");
            const trPending = trackerBanner.querySelector(".tracker-count-pending");

            if (trOkay) trOkay.innerText = okayCount;
            if (trNotOkay) trNotOkay.innerText = notOkayCount;
            if (trPending) trPending.innerText = pendingCount;

            if (trBadge) {
                trBadge.innerText = resultStatus;
                trBadge.style.backgroundColor = !hasNotOkay ? "#dcfce7" : "#fee2e2";
                trBadge.style.color = !hasNotOkay ? "#15803d" : "#b91c1c";
                trBadge.style.borderColor = !hasNotOkay ? "#bbf7d0" : "#fecaca";
            }
            
            const estScoreEl = trackerBanner.querySelector(".tracker-estimated-score");
            if (estScoreEl) {
                estScoreEl.style.color = !hasNotOkay ? "#15803d" : "#dc2626";
            }
            
            const prgBar = trackerBanner.querySelector(".progress-bar");
            if (prgBar) {
                prgBar.style.width = `${progressPercent}%`;
                prgBar.style.backgroundColor = !hasNotOkay ? "#16a34a" : "#dc2626";
            }
        }
    },

    pauseTour: async function () {
        const confirmPause = confirm("Are you sure you want to pause this audit session? Your entered details will be saved, and you can resume later.");
        if (!confirmPause) return;

        try {
            ShowLoader();

            const area = FoodSafety_Main.state.selectedArea || "Old Block";
            const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate || new Date();
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            let hasNotOkay = false;

            // Gather inputs only for locations with selected status
            locations.forEach((locName, idx) => {
                const statusEl = document.getElementById(`pci-status-${idx}`);
                const status = statusEl ? statusEl.value : "";

                if (status) {
                    if (status === "Okay") {
                        childRecords.push({
                            cr3ea_food_safety_title: `PCI_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                            cr3ea_food_safety_checklisttype: "PCI Checklist",
                            cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                            cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                            cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                            cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                            cr3ea_food_safety_areaincharge: FoodSafety_Main.state.areaIncharge,
                            cr3ea_food_safety_area: area,
                            cr3ea_food_safety_location: locName,
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                            cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                            cr3ea_food_safety_status: "Okay",
                            cr3ea_food_safety_date: dateStr,
                            cr3ea_food_safety_time: timeStr
                        });
                    } else {
                        hasNotOkay = true;
                        const listContainer = document.getElementById(`pci-observations-list-${idx}`);
                        const rows = listContainer ? listContainer.querySelectorAll(".pci-obs-row") : [];

                        rows.forEach(row => {
                            const typeSelect = row.querySelector(".pci-obs-type");
                            const countInput = row.querySelector(".pci-obs-count");

                            const type = typeSelect ? typeSelect.value : "Others";
                            const count = parseInt(countInput ? countInput.value : 1) || 1;

                            childRecords.push({
                                cr3ea_food_safety_title: `PCI_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                                cr3ea_food_safety_checklisttype: "PCI Checklist",
                                cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                                cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                                cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                                cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                                cr3ea_food_safety_areaincharge: FoodSafety_Main.state.areaIncharge,
                                cr3ea_food_safety_area: area,
                                cr3ea_food_safety_location: locName,
                                "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                                cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                                cr3ea_food_safety_status: "Not Okay",
                                cr3ea_food_safety_observationtype: type,
                                cr3ea_food_safety_defectcount: count,
                                cr3ea_food_safety_date: dateStr,
                                cr3ea_food_safety_time: timeStr
                            });
                        });
                    }
                }
            });

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete items...");
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
                cr3ea_checklist_result: hasNotOkay ? "Fail" : "Pass",
                cr3ea_status: "InProgress-paused",
                cr3ea_food_safety_area: area
            };

            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("Tour paused successfully!");
            
            // Redirect back to SharePoint Welcome page
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;

        } catch (error) {
            console.error("Failed pausing PCI checklist:", error);
            alert(`Error during pause: ${error.message}`);
        } finally {
            HideLoader();
        }
    },

    // Resume flow from existing Tour ID
    resume: async function () {
        try {
            ShowLoader();
            const savedItems = await FoodSafety_DAL.getChecklistItems(FoodSafety_Main.state.varTourID);
            
            if (savedItems && savedItems.length > 0) {
                // Populate Site configuration values
                const first = savedItems[0];
                const area = first.cr3ea_food_safety_area || first.cr953_food_safety_area || "New Block";
                FoodSafety_Main.state.selectedArea = area;
                
                document.getElementById("pci-checklist-panel").style.display = "block";
                HeaderComponent.render("pci-header-wrapper");
                this.renderChecklist();

                // Group savedItems by location to load repeatable observations
                const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;
                locations.forEach((locName, idx) => {
                    const matches = savedItems.filter(i => (i.cr3ea_food_safety_location === locName || i.cr953_food_safety_location === locName));
                    if (matches.length > 0) {
                        const statusSelect = document.getElementById(`pci-status-${idx}`);
                        const firstMatch = matches[0];
                        
                        if (statusSelect) {
                            const statusVal = firstMatch.cr3ea_food_safety_status || firstMatch.cr953_food_safety_status || "";
                            $(statusSelect).val(statusVal).trigger("change");
                            
                            if (statusVal === "Not Okay") {
                                
                                const list = document.getElementById(`pci-observations-list-${idx}`);
                                if (list) list.innerHTML = ""; // Clear default initial one

                                matches.forEach((match, obsIdx) => {
                                    // Re-add observation row
                                    const row = document.createElement("div");
                                    row.className = "d-flex align-items-center pci-obs-row mb-2";
                                    row.id = `pci-obs-row-${idx}-${obsIdx}`;
                                    row.style.display = "flex";
                                    row.style.gap = "10px";
                                    row.style.marginBottom = "10px";

                                    const obsType = match.cr3ea_food_safety_observationtype || match.cr953_food_safety_observationtype;
                                    const typeOptions = this.observationTypes.map(t => 
                                        `<option value="${t}" ${t === obsType ? 'selected' : ''}>${t}</option>`
                                    ).join("");

                                    const obsCount = match.cr3ea_food_safety_defectcount || match.cr953_food_safety_defectcount || 1;

                                    row.innerHTML = `
                                        <div class="select2-parent" style="flex: 2; min-width: 150px;">
                                             <select class="form-select pci-obs-type" id="pci-obs-type-${idx}-${obsIdx}">
                                                 ${typeOptions}
                                             </select>
                                        </div>
                                        <div style="flex: 1; min-width: 80px;">
                                             <input type="number" class="form-control pci-obs-count" id="pci-obs-count-${idx}-${obsIdx}" 
                                                    min="1" value="${obsCount}" style="height: 42px; text-align: center;">
                                        </div>
                                        <div style="width: 45px; display: flex; align-items: center; justify-content: center;">
                                             <button type="button" style="background: transparent; border: none; padding: 0; width: 42px; height: 42px; font-size: 20px; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="PCIChecklistScreen.removeObservation(${idx}, ${obsIdx})">
                                                 🗑
                                             </button>
                                        </div>
                                    `;
                                    list.appendChild(row);
                                    DropdownComponent.init(`pci-obs-type-${idx}-${obsIdx}`);
                                });
                            }
                        }
                    }
                });
                
                this.calculateScores();
            } else {
                this.init();
            }
        } catch (err) {
            console.error("Failed to resume PCI checklist screen data:", err);
        } finally {
            HideLoader();
        }
    }
};
