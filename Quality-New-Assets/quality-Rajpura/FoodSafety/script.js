// Food Safety Checklist Orchestrator & State Router
console.log("Food Safety Script Bootstrapping");

// Intercept ShowLoader and HideLoader to show/hide full screen loading overlay blocking the background
(function () {
    const originalShowLoader = window.ShowLoader;
    const originalHideLoader = window.HideLoader;

    window.ShowLoader = function () {
        if (typeof originalShowLoader === "function") {
            try { originalShowLoader(); } catch (e) {}
        } else {
            console.log("Spinner Active (fallback)");
        }
        const overlay = document.getElementById("loading-overlay");
        if (overlay) overlay.style.display = "block";
    };

    window.HideLoader = function () {
        if (typeof originalHideLoader === "function") {
            try { originalHideLoader(); } catch (e) {}
        } else {
            console.log("Spinner Inactive (fallback)");
        }
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.style.display = "none";
            overlay.innerHTML = ""; // Clear progress loader box
        }
    };
})();

const FoodSafety_Main = {
    // Navigation & State Variables
    state: {
        varTourID: null,
        selectedChecklistType: "PPE Checklist", // Defaults
        selectedShift: "Shift 1",
        selectedSite: "Rajpura",
        selectedLine: "Line 1",
        qaExecutive: "",
        productionIncharge: "",
        areaIncharge: "",
        selectedCycle: "Cycle-1",
        tourStartDate: null,
        currentTourRecord: null,
        selectedArea: "" // Area/Block selection for PCI Checklist
    },

    // Initialize module
    init: async function () {
        console.log("Initializing Food Safety App...");
        localStorage.setItem("lastVisitedDashboard", "FoodSafety");
        this.bindGlobalEvents();

        // Check URL parameters for resuming an existing session
        const urlParams = new URLSearchParams(window.location.search);
        const tourId = urlParams.get("TourId");

        if (tourId) {
            this.state.varTourID = tourId;
            await this.resumeSession(tourId);
        } else {
            // New Session - Load Screen 2 (Checklist Information Screen) directly
            this.navigateTo("screen-checklist-info");
            // Trigger load events in screens
            if (typeof ChecklistInformationScreen !== 'undefined' && ChecklistInformationScreen.init) {
                ChecklistInformationScreen.init();
            }
        }
    },

    // Transition view helper with smooth display toggles
    navigateTo: function (screenId) {
        console.log(`Routing to screen: ${screenId}`);
        
        // Hide all screens
        const screens = [
            "screen-welcome",
            "screen-checklist-info",
            "screen-ppe-checklist",
            "screen-gmp-checklist",
            "screen-pci-checklist",
            "screen-dashboard",
            "screen-summary"
        ];
        
        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) {
                el.style.display = "none";
                el.classList.remove("bs-fade-in", "bs-fade-active");
            }
        });

        // Show target screen
        const targetEl = document.getElementById(screenId);
        if (targetEl) {
            targetEl.style.display = "block";
            // Add subtle fade-in transition
            setTimeout(() => {
                targetEl.classList.add("bs-fade-in", "bs-fade-active");
            }, 50);
        }
    },

    // Bind common header elements and clicks
    bindGlobalEvents: function () {
        // Add listeners for custom navigation if any
    },

    // Resume session from TourId
    resumeSession: async function (tourId) {
        try {
            ShowLoader();
            console.log(`Resuming Tour Session: ${tourId}`);
            
            // Get tour records from local database / mock
            const tours = await FoodSafety_DAL.getTourHistory();
            const tour = tours.find(t => t.cr3ea_prod_rajpura_quality_tourid === tourId);
            
            if (!tour) {
                alert("Tour session not found in database.");
                const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = welcomeUrl;
                return;
            }

            this.state.currentTourRecord = tour;

            // Expiry Check: Check if tour was created on a previous day and is not terminal
            const creationTime = tour.createdon || tour.cr3ea_tourstartdate;
            let status = tour.cr3ea_status || "In Progress";
            if (creationTime) {
                const parsedDate = moment(creationTime, [
                    "DD-MM-YYYY HH:mm:ss",
                    "DD-MM-YYYY hh:mm A",
                    "YYYY-MM-DDTHH:mm:ssZ",
                    "YYYY-MM-DDTHH:mm:ss.SSSZ",
                    "YYYY-MM-DD HH:mm:ss"
                ], true);
                if (parsedDate && parsedDate.isValid()) {
                    const tourDateLocal = parsedDate.local().format("YYYY-MM-DD");
                    const todayLocal = moment().format("YYYY-MM-DD");
                    if (tourDateLocal !== todayLocal && 
                        status !== "Closed - Expired" && 
                        status !== "Completed" && 
                        status !== "Closed" && 
                        status !== "Success") {
                        
                        console.log(`Tour is from a previous day (${tourDateLocal}) and is in state "${status}". Auto-expiring and closing...`);
                        try {
                            const payload = {
                                cr3ea_prod_rajpura_quality_tourid: tourId,
                                cr3ea_status: "Closed - Expired",
                                cr3ea_processstatus: "Closed - Expired",
                                cr3ea_islineclear: true
                            };
                            await FoodSafety_DAL.saveTourSession(payload);
                            tour.cr3ea_status = "Closed - Expired";
                            tour.cr3ea_processstatus = "Closed - Expired";
                            status = "Closed - Expired";
                            console.log("Tour successfully closed and expired in Dataverse.");
                        } catch (e) {
                            console.error("Failed to automatically close/expire previous day's tour:", e);
                        }
                    }
                }
            }

            this.state.selectedChecklistType = tour.cr3ea_food_safety_checklisttype;
            this.state.selectedShift = tour.cr3ea_shift || "Shift 1";
            this.state.selectedSite = tour.cr3ea_plantid || "Rajpura";
            this.state.selectedLine = tour.cr3ea_lineno || "Line 1";
            this.state.qaExecutive = tour.cr3ea_assigned_qa || "";
            this.state.productionIncharge = tour.cr3ea_shiftexecutiveproduction || "";
            this.state.areaIncharge = tour.cr3ea_food_safety_areaincharge || "";
            this.state.selectedArea = tour.cr3ea_food_safety_area || "";
            this.state.selectedCycle = tour.cr3ea_food_safety_cycle || "Cycle-1";
            this.state.tourStartDate = tour.cr3ea_tourstartdate;

            // Render header info
            if (typeof HeaderComponent !== 'undefined' && HeaderComponent.render) {
                HeaderComponent.render();
            }

            // If session is already submitted or closed/expired, prevent editing and navigate directly to summary page
            if (status === "Submitted" || status === "Closed - Expired" || status === "Closed" || status === "Completed" || status === "Success") {
                this.navigateTo("screen-summary");
                if (typeof FoodSafety_Summary !== 'undefined' && FoodSafety_Summary.init) {
                    await FoodSafety_Summary.init(tourId);
                }
                return;
            }

            // Route directly to Checklist Screen
            if (this.state.selectedChecklistType === "PPE Checklist") {
                this.navigateTo("screen-ppe-checklist");
                if (typeof PPEChecklistScreen !== 'undefined' && PPEChecklistScreen.resume) {
                    await PPEChecklistScreen.resume();
                }
            } else if (this.state.selectedChecklistType === "GMP Checklist") {
                this.navigateTo("screen-gmp-checklist");
                if (typeof GMPChecklistScreen !== 'undefined' && GMPChecklistScreen.resume) {
                    await GMPChecklistScreen.resume();
                }
            } else if (this.state.selectedChecklistType === "PCI Checklist") {
                this.navigateTo("screen-pci-checklist");
                if (typeof PCIChecklistScreen !== 'undefined' && PCIChecklistScreen.resume) {
                    await PCIChecklistScreen.resume();
                }
            } else {
                alert("Unknown checklist type resolved from Tour.");
                this.navigateTo("screen-welcome");
            }
        } catch (e) {
            console.error("Error resuming session:", e);
            alert("Failed to load tour session details.");
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;
        } finally {
            HideLoader();
        }
    }
};

// Start application when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    FoodSafety_Main.init().catch(err => {
        console.error("Bootstrapping failed:", err);
    });
});
