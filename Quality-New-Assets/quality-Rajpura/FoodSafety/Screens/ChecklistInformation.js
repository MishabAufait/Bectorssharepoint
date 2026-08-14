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

        // 4. Fetch SharePoint config and populate QA Executive / Production Incharge dropdowns
        try {
            const configItems = await FoodSafety_DAL.getConfig();
            
            // Extract distinct QA Executives
            const qaExecutives = [];
            const qaEmails = new Set();
            configItems.forEach(item => {
                if (item.QAExecutives && Array.isArray(item.QAExecutives)) {
                    item.QAExecutives.forEach(user => {
                        if (user && user.Title && !qaEmails.has(user.EMail)) {
                            qaEmails.add(user.EMail);
                            qaExecutives.push({
                                value: user.EMail,
                                text: user.Title
                            });
                        }
                    });
                }
            });

            // Extract distinct Production Incharges
            const prodIncharges = [];
            const prodEmails = new Set();
            configItems.forEach(item => {
                if (item.ProductionIncharges && Array.isArray(item.ProductionIncharges)) {
                    item.ProductionIncharges.forEach(user => {
                        if (user && user.Title && !prodEmails.has(user.EMail)) {
                            prodEmails.add(user.EMail);
                            prodIncharges.push({
                                value: user.EMail,
                                text: user.Title
                            });
                        }
                    });
                }
            });

            // Populate QA Executive Dropdown
            DropdownComponent.populate("info-qa-exec-select", qaExecutives, FoodSafety_Main.state.qaExecutive);
            DropdownComponent.init("info-qa-exec-select");

            // Populate Production Incharge Dropdown
            DropdownComponent.populate("info-prod-incharge-select", prodIncharges, FoodSafety_Main.state.productionIncharge);
            DropdownComponent.init("info-prod-incharge-select");
            
        } catch (e) {
            console.error("Error loading QA/Production config list", e);
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
            const checklistType = document.getElementById("infoChecklistTypeSelect").value;
            FoodSafety_Main.state.selectedChecklistType = checklistType;
            
            const site = document.getElementById("infoSiteSelect").value;
            const line = document.getElementById("infoLineSelect").value;
            const qaExec = document.getElementById("info-qa-exec-select").value;
            const prodIncharge = document.getElementById("info-prod-incharge-select").value;
            const cycle = document.getElementById("infoCycleSelect").value;
            
            let areaIncharge = "";
            let selectedArea = "";
            if (checklistType === "PCI Checklist") {
                areaIncharge = document.getElementById("info-area-incharge-input").value.trim();
                // Fall back to Production Incharge if Area Incharge is blank
                if (!areaIncharge) {
                    areaIncharge = prodIncharge;
                }
                selectedArea = document.getElementById("infoPCIAreaSelect").value;
            }

            // Input Validations
            if (!qaExec) {
                alert("Please select a QA Executive.");
                return;
            }
            if (!prodIncharge) {
                alert("Please select a Production Incharge.");
                return;
            }

            ShowLoader();

            // Prepare Table 1 OData Payload
            const tourPayload = {
                cr3ea_food_safety_checklisttype: FoodSafety_Main.state.selectedChecklistType,
                cr3ea_plantid: site === "Rajpura" ? QualityRajpura_Config.PLANT_ID : site,
                cr3ea_lineid: line,
                cr3ea_lineno: line,
                cr3ea_assigned_qa: qaExec,
                cr3ea_shiftexecutiveproduction: prodIncharge,
                cr3ea_observedby: prodIncharge, // Writes Prod Incharge to observedby field (ALC standard)
                cr3ea_tourstartdate: FoodSafety_Main.state.tourStartDate,
                cr3ea_status: "In Progress",
                cr3ea_food_safety_cycle: cycle,
                cr3ea_shift: FoodSafety_Main.state.selectedShift,
                cr3ea_title: `FoodSafety_${FoodSafety_Main.state.selectedChecklistType.replace(" Checklist", "")}_${site}_${line}_${moment(FoodSafety_Main.state.tourStartDate).format("DDMMYYYY")}`
            };

            if (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist") {
                tourPayload.cr3ea_food_safety_areaincharge = areaIncharge;
                tourPayload.cr3ea_food_safety_area = selectedArea;
            }

            console.log("Submitting parent tour record payload to Dataverse:", tourPayload);
            
            // Save parent tour and get back generated GUID ID
            const savedTour = await FoodSafety_DAL.saveTourSession(tourPayload);
            const generatedGUID = savedTour.cr3ea_prod_rajpura_quality_tourid;

            if (!generatedGUID) {
                throw new Error("Dataverse write succeeded but no Tour GUID ID was returned.");
            }

            // Save state variables
            FoodSafety_Main.state.varTourID = generatedGUID;
            FoodSafety_Main.state.selectedSite = site;
            FoodSafety_Main.state.selectedLine = line;
            FoodSafety_Main.state.qaExecutive = qaExec;
            FoodSafety_Main.state.productionIncharge = prodIncharge;
            if (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist") {
                FoodSafety_Main.state.areaIncharge = areaIncharge;
                FoodSafety_Main.state.selectedArea = selectedArea;
            }
            FoodSafety_Main.state.selectedCycle = cycle;

            console.log(`Parent Tour record saved. GUID resolved: ${generatedGUID}`);
            alert("Tour Session started successfully!");

            // Route to Screen 3 (whichever checklist is selected)
            if (FoodSafety_Main.state.selectedChecklistType === "PPE Checklist") {
                FoodSafety_Main.navigateTo("screen-ppe-checklist");
                if (typeof PPEChecklistScreen !== 'undefined' && PPEChecklistScreen.init) {
                    PPEChecklistScreen.init();
                }
            } else if (FoodSafety_Main.state.selectedChecklistType === "GMP Checklist") {
                FoodSafety_Main.navigateTo("screen-gmp-checklist");
                if (typeof GMPChecklistScreen !== 'undefined' && GMPChecklistScreen.init) {
                    GMPChecklistScreen.init();
                }
            } else if (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist") {
                FoodSafety_Main.navigateTo("screen-pci-checklist");
                if (typeof PCIChecklistScreen !== 'undefined' && PCIChecklistScreen.init) {
                    PCIChecklistScreen.init();
                }
            }
        } catch (error) {
            console.error("Failed to start checklist tour:", error);
            alert(`Error starting checklist: ${error.message}`);
        } finally {
            HideLoader();
        }
    }
};
