// Screen 2: Checklist Information (Common Header Form)
console.log("Checklist Information Screen loaded");

const ChecklistInformationScreen = {
    init: async function () {
        console.log("Initializing Checklist Info Screen...");
        
        // Retrieve shift value from Welcome page popup localStorage cache
        const cachedShift = localStorage.getItem("shiftValue") || "Shift 1";
        FoodSafety_Main.state.selectedShift = cachedShift;
        
        // 1. Populate current date & time
        const now = new Date();
        document.getElementById("info-date-input").value = now.toLocaleDateString();
        document.getElementById("info-time-input").value = now.toLocaleTimeString();
        FoodSafety_Main.state.tourStartDate = now.toISOString();

        // 2. Initialize Checklist Type Dropdown
        DropdownComponent.init("infoChecklistTypeSelect");
        DropdownComponent.init("infoPCIAreaSelect");
        
        // Retrieve route action or selected type if already set
        const typeSelect = document.getElementById("infoChecklistTypeSelect");
        if (typeSelect) {
            // Set initial dropdown value based on state or welcome popup selection
            const cachedTourSelect = localStorage.getItem("tourSelectValue");
            const initialType = FoodSafety_Main.state.selectedChecklistType || 
                                (cachedTourSelect === "CCP, OPRP, Sieves & Magnets" ? "PCI Checklist" : "PPE Checklist");
            typeSelect.value = initialType;
            FoodSafety_Main.state.selectedChecklistType = initialType;
            
            $(typeSelect).val(initialType).trigger("change");
            $(typeSelect).off("change.type").on("change.type", () => this.handleTypeChange());
        }

        // 3. Initialize Site Dropdown & Hook Change listener for Line Dropdown dependency
        DropdownComponent.init("infoSiteSelect");
        DropdownComponent.init("infoLineSelect");
        DropdownComponent.init("infoCycleSelect");

        const siteSelect = document.getElementById("infoSiteSelect");
        if (siteSelect) {
            $(siteSelect).off("change.site").on("change.site", () => this.handleSiteChange());
        }

        // Trigger type change and site change once on load to display dependent fields
        this.handleTypeChange();
        this.handleSiteChange();

        // 4. Fetch SharePoint config and populate QA Executive / Production Incharge dropdowns dynamically
        try {
            const configItems = await FoodSafety_DAL.getConfig();

            // Helper to clear highlights on input change
            const clearInputHighlight = (el) => {
                if (typeof FoodSafety_Validator !== 'undefined') {
                    FoodSafety_Validator.highlight(el, false);
                    FoodSafety_Validator.hideBanner("info-validation-banner");
                }
            };

            $("#infoSiteSelect, #infoLineSelect, #infoCycleSelect, #infoChecklistTypeSelect, #infoPCIAreaSelect").off("change.validation").on("change.validation", function() {
                clearInputHighlight(this);
            });

            const updatePersonnelDropdowns = () => {
                const selectedSite = document.getElementById("infoSiteSelect")?.value || "";
                const selectedTypeFull = document.getElementById("infoChecklistTypeSelect")?.value || "";
                
                let mappedType = "PPE";
                if (selectedTypeFull === "GMP Checklist") mappedType = "GMP";
                else if (selectedTypeFull === "PCI Checklist") mappedType = "PCI";

                let matchingConfigs = configItems.filter(c => {
                    const matchPlant = !selectedSite || !c.Plant || (c.Plant && c.Plant.toLowerCase() === selectedSite.toLowerCase());
                    const matchType = !c.ChecklistType || (c.ChecklistType && c.ChecklistType.toUpperCase().includes(mappedType.toUpperCase()));
                    return matchPlant && matchType;
                });

                if (matchingConfigs.length === 0) {
                    matchingConfigs = configItems;
                }

                // Extract distinct QA Executives
                const qaExecutives = [{ value: "", text: "Select QA Executive" }];
                const qaEmails = new Set();
                matchingConfigs.forEach(item => {
                    const qaList = item.QAExecutives || (item.AssignedQA && item.AssignedQA.results) || (item.AssignedUser && item.AssignedUser.results) || [];
                    if (Array.isArray(qaList)) {
                        qaList.forEach(user => {
                            if (user && user.Title && (!user.EMail || !qaEmails.has(user.EMail.toLowerCase()))) {
                                if (user.EMail) qaEmails.add(user.EMail.toLowerCase());
                                qaExecutives.push({
                                    value: user.EMail || user.Title,
                                    text: user.Title
                                });
                            }
                        });
                    }
                });

                // Extract distinct Production Incharges
                const prodIncharges = [{ value: "", text: "Select Production Executive" }];
                const prodEmails = new Set();
                matchingConfigs.forEach(item => {
                    const prodList = item.ProductionIncharges || item.ProductionExecutive || (item.ProductionIncharge && item.ProductionIncharge.results) || (item.EscalationManager && item.EscalationManager.results) || [];
                    if (Array.isArray(prodList)) {
                        prodList.forEach(user => {
                            if (user && user.Title && (!user.EMail || !prodEmails.has(user.EMail.toLowerCase()))) {
                                if (user.EMail) prodEmails.add(user.EMail.toLowerCase());
                                prodIncharges.push({
                                    value: user.EMail || user.Title,
                                    text: user.Title
                                });
                            }
                        });
                    }
                });

                // Populate QA Executive Dropdown
                DropdownComponent.populate("info-qa-exec-select", qaExecutives, FoodSafety_Main.state.qaExecutive);
                DropdownComponent.init("info-qa-exec-select");

                // Populate Production Executive Dropdown
                DropdownComponent.populate("info-prod-incharge-select", prodIncharges, FoodSafety_Main.state.productionIncharge);
                DropdownComponent.init("info-prod-incharge-select");

                $("#info-qa-exec-select, #info-prod-incharge-select").off("change.validation").on("change.validation", function() {
                    clearInputHighlight(this);
                });
            };

            // Populate Shift Executive (logged-in user who starts the tour)
            const shiftExecInput = document.getElementById("info-shift-exec");
            if (shiftExecInput) {
                const shiftExec = (FoodSafety_Main.state.currentTourRecord && (FoodSafety_Main.state.currentTourRecord.cr3ea_observedby || FoodSafety_Main.state.currentTourRecord.cr3ea_shiftexecutive))
                    ? (FoodSafety_Main.state.currentTourRecord.cr3ea_observedby || FoodSafety_Main.state.currentTourRecord.cr3ea_shiftexecutive)
                    : ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName
                    : (typeof EmployeeName !== 'undefined' && EmployeeName ? EmployeeName : (typeof currentUser !== "undefined" ? currentUser : (typeof UserName !== 'undefined' ? UserName : "Shift Executive"))));
                shiftExecInput.value = (typeof FoodSafety_Summary !== 'undefined' && FoodSafety_Summary.resolveUserName) ? FoodSafety_Summary.resolveUserName(shiftExec) : shiftExec;
            }

            // Bind change hooks to trigger updates
            $("#infoSiteSelect").off("change.pers").on("change.pers", updatePersonnelDropdowns);
            $("#infoChecklistTypeSelect").off("change.pers").on("change.pers", updatePersonnelDropdowns);

            // Populate initially
            updatePersonnelDropdowns();
            
        } catch (e) {
            console.error("Error loading QA/Production config list in Food Safety", e);
        }

        // 5. Render header component
        HeaderComponent.render("info-header-wrapper");
    },

    handleTypeChange: function () {
        const typeSelect = document.getElementById("infoChecklistTypeSelect");
        const checklistType = typeSelect ? typeSelect.value : "PPE Checklist";
        FoodSafety_Main.state.selectedChecklistType = checklistType;
        
        const areaInchargeGroup = document.getElementById("info-area-incharge-group");
        const pciAreaGroup = document.getElementById("info-pci-area-group");
        if (checklistType === "PCI Checklist") {
            if (areaInchargeGroup) areaInchargeGroup.style.display = "block";
            if (pciAreaGroup) pciAreaGroup.style.display = "block";
        } else {
            if (areaInchargeGroup) areaInchargeGroup.style.display = "none";
            if (pciAreaGroup) pciAreaGroup.style.display = "none";
        }
    },

    // Handle site dependent line list
    handleSiteChange: function () {
        const site = document.getElementById("infoSiteSelect").value;
        const lineSelectId = "infoLineSelect";
        
        let lines = [];
        if (site === "Rajpura") {
            lines = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5", "Line 6", "Line 7", "Line 8"];
        } else {
            lines = ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"];
        }

        DropdownComponent.populate(lineSelectId, lines, lines[0]);
    },

    // Submit Common Header (Create Parent Record in Dataverse)
    submit: async function () {
        try {
            if (typeof FoodSafety_Validator !== 'undefined') {
                FoodSafety_Validator.clearAll("screen-checklist-info");
                FoodSafety_Validator.hideBanner("info-validation-banner");
            }

            const checklistTypeEl = document.getElementById("infoChecklistTypeSelect");
            const checklistType = checklistTypeEl ? checklistTypeEl.value : "";
            FoodSafety_Main.state.selectedChecklistType = checklistType;
            
            const siteEl = document.getElementById("infoSiteSelect");
            const site = siteEl ? siteEl.value : "";
            const lineEl = document.getElementById("infoLineSelect");
            const line = lineEl ? lineEl.value : "";
            const qaExecEl = document.getElementById("info-qa-exec-select");
            const qaExec = qaExecEl ? qaExecEl.value : "";
            const prodInchargeEl = document.getElementById("info-prod-incharge-select");
            const prodIncharge = prodInchargeEl ? prodInchargeEl.value : "";
            const shiftEl = document.getElementById("info-shift-exec");
            const shiftExec = shiftEl?.value?.trim() || ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName : (typeof currentUser !== "undefined" ? currentUser : "Shift Executive"));
            const cycleEl = document.getElementById("infoCycleSelect");
            const cycle = cycleEl ? cycleEl.value : "";
            
            let areaIncharge = "";
            let selectedArea = "";
            const pciAreaEl = document.getElementById("infoPCIAreaSelect");
            if (checklistType === "PCI Checklist") {
                areaIncharge = document.getElementById("info-area-incharge-input")?.value?.trim() || prodIncharge;
                selectedArea = pciAreaEl ? pciAreaEl.value : "";
            }

            // Comprehensive Required Fields Validation
            const missingFields = [];
            let firstInvalidEl = null;

            if (!checklistType) {
                missingFields.push("Checklist Type");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(checklistTypeEl, true);
                if (!firstInvalidEl) firstInvalidEl = checklistTypeEl;
            }
            if (!site) {
                missingFields.push("Manufacturing Site");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(siteEl, true);
                if (!firstInvalidEl) firstInvalidEl = siteEl;
            }
            if (!line) {
                missingFields.push("Line");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(lineEl, true);
                if (!firstInvalidEl) firstInvalidEl = lineEl;
            }
            if (!qaExec) {
                missingFields.push("QA Executive");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(qaExecEl, true);
                if (!firstInvalidEl) firstInvalidEl = qaExecEl;
            }
            if (!prodIncharge) {
                missingFields.push("Production Executive");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(prodInchargeEl, true);
                if (!firstInvalidEl) firstInvalidEl = prodInchargeEl;
            }
            if (checklistType === "PCI Checklist" && !selectedArea) {
                missingFields.push("Inspection Block/Area");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(pciAreaEl, true);
                if (!firstInvalidEl) firstInvalidEl = pciAreaEl;
            }
            if (!cycle) {
                missingFields.push("Cycle");
                if (typeof FoodSafety_Validator !== 'undefined') FoodSafety_Validator.highlight(cycleEl, true);
                if (!firstInvalidEl) firstInvalidEl = cycleEl;
            }

            if (missingFields.length > 0) {
                const errorMsg = "Please complete all required fields to start the checklist: " + missingFields.join(", ") + ".";
                if (typeof FoodSafety_Validator !== 'undefined') {
                    FoodSafety_Validator.showBanner("info-validation-banner", errorMsg);
                }
                alert(errorMsg);
                if (firstInvalidEl) {
                    firstInvalidEl.focus();
                }
                return;
            }

            ShowLoader();

            // Check if active session already exists for this line and checklist type today and prompt for override
            if (!FoodSafety_Main.state.varTourID && line) {
                const token = await FoodSafety_DAL.getAccessToken();
                const proceed = await QualityRajpura_Config.checkAndPromptLineOverride({
                    moduleKey: "FOOD_SAFETY",
                    line: line,
                    subType: FoodSafety_Main.state.selectedChecklistType,
                    currentTourId: FoodSafety_Main.state.varTourID,
                    token: token
                });
                if (!proceed) {
                    HideLoader();
                    return;
                }
            }

            // Prepare Table 1 OData Payload (Strict Parent Tour Schema)
            const tourPayload = {
                cr3ea_food_safety_checklisttype: FoodSafety_Main.state.selectedChecklistType,
                cr3ea_plantid: site === "Rajpura" ? QualityRajpura_Config.PLANT_ID : site,
                cr3ea_lineno: line,
                cr3ea_assigned_qa: qaExec,
                cr3ea_shiftexecutiveproduction: prodIncharge,
                cr3ea_observedby: shiftExec, // Shift Executive who started the tour
                cr3ea_tourstartdate: FoodSafety_Main.state.tourStartDate,
                cr3ea_status: "In Progress",
                cr3ea_cycle: cycle,
                cr3ea_shift: FoodSafety_Main.state.selectedShift,
                cr3ea_title: `FoodSafety_${FoodSafety_Main.state.selectedChecklistType.replace(" Checklist", "")}_${site}_${line}_${moment(FoodSafety_Main.state.tourStartDate).format("DDMMYYYY")}`
            };

            if (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist") {
                FoodSafety_Main.state.areaIncharge = areaIncharge;
                FoodSafety_Main.state.selectedArea = selectedArea;
            }

            console.log("Submitting parent tour record payload to Dataverse:", tourPayload);
            
            // Save parent tour and get back generated GUID ID
            const savedTour = await FoodSafety_DAL.saveTourSession(tourPayload);
            const generatedGUID = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                ? QualityRajpura_Config.getTourId(savedTour)
                : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));

            if (!generatedGUID) {
                throw new Error("Dataverse write succeeded but no Tour GUID ID was returned.");
            }

            // Save state variables
            FoodSafety_Main.state.varTourID = generatedGUID;
            FoodSafety_Main.state.selectedSite = site;
            FoodSafety_Main.state.selectedLine = line;
            FoodSafety_Main.state.qaExecutive = qaExec;
            FoodSafety_Main.state.productionIncharge = prodIncharge;
            FoodSafety_Main.state.observedBy = shiftExec;
            if (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist") {
                FoodSafety_Main.state.areaIncharge = areaIncharge;
                FoodSafety_Main.state.selectedArea = selectedArea;
            }
            FoodSafety_Main.state.selectedCycle = cycle;

            console.log(`Parent Tour record saved. GUID resolved: ${generatedGUID}`);
            alert("Tour Session started successfully!");

            // Redirect cleanly to active tour view with TourId so the URL reflects the TourId and leaves action=new
            window.location.href = `?TourId=${generatedGUID}`;
        } catch (error) {
            console.error("Failed to start checklist tour:", error);
            alert(`Error starting checklist: ${error.message}`);
        } finally {
            HideLoader();
        }
    }
};
