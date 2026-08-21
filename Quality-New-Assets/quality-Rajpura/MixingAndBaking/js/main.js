// Main Orchestrator for Rajpura Mixing & Baking Form
console.log("Mixing & Baking Main JS loaded");

// Intercept ShowLoader and HideLoader to show/hide full screen loading overlay
(function () {
    const originalShowLoader = window.ShowLoader;
    const originalHideLoader = window.HideLoader;

    window.ShowLoader = function () {
        if (typeof originalShowLoader === "function") originalShowLoader();
        const overlay = document.getElementById("loading-overlay");
        if (overlay) overlay.style.display = "block";
    };

    window.HideLoader = function () {
        if (typeof originalHideLoader === "function") originalHideLoader();
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.style.display = "none";
            overlay.innerHTML = "";
        }
    };
})();

const MixingBaking_Main = {
    state: {
        varTourID: null,
        tourData: {},
        qaExecutive: "",
        productionIncharge: "",
        shift: "Shift-1",
        line: "N/A",
        product: "",
        batchNo: "",
        observedBy: "",
        cycleCounter: 1,
        isQaUser: false,
        isProductionUser: false
    },

    init: async function () {
        ShowLoader();
        // Save last visited dashboard category
        localStorage.setItem("lastVisitedDashboard", "MixingBaking");

        // 1. Get TourId from query parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.state.varTourID = urlParams.get('TourId');

        try {
            // 2. Fetch SharePoint config list user mappings
            this.configList = await MixingBaking_DAL.getConfig();
            console.log("SharePoint configuration mappings loaded:", this.configList);

            // Fetch specific users configuration for Mixing & Baking dropdowns
            this.state.usersConfig = await MixingBaking_DAL.getMixingBakingUsersConfig();
            console.log("Mixing & Baking users configuration loaded:", this.state.usersConfig);

            // 3. Fetch Parent Tour details
            if (this.state.varTourID) {
                this.state.tourData = await MixingBaking_DAL.getParentTour(this.state.varTourID);
                console.log("Parent Tour details loaded:", this.state.tourData);

                // Populate state with parent tour values
                this.state.line = this.state.tourData.cr3ea_lineno || this.state.tourData.cr3ea_lineid || "N/A";
                this.state.qaExecutive = this.state.tourData.cr3ea_assigned_qa || "";
                this.state.productionIncharge = this.state.tourData.cr3ea_shiftexecutiveproduction || "";
                this.state.shift = this.state.tourData.cr3ea_shift || sessionStorage.getItem("shiftValue") || "Shift-1";
                this.state.observedBy = typeof UserName !== 'undefined' ? UserName : "Unknown User";
            }

            // 4. Resolve roles and permissions
            await this.identifyUserRole();

            // Render details
            document.getElementById("currentDay").innerText = moment().format("DD/MM/YYYY");
            document.getElementById("shiftBadge").innerText = this.state.shift.replace("-", " ");
            document.getElementById("shiftSelect").value = this.state.shift;

            // 5. Load historical records and render active cycle
            await this.loadCyclesHistory();

        } catch (err) {
            console.error("Mixing & Baking Initialization failed:", err);
            alert("Initialization failed: " + err.message);
        } finally {
            HideLoader();
        }
    },

    // Identify user role from SharePoint config list mappings
    identifyUserRole: async function () {
        const currentUserName = typeof currentUser !== "undefined" ? currentUser : "";
        const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
        const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";

        // Default flags
        this.state.isQaUser = false;
        this.state.isProductionUser = false;

        // Check QA executive mappings
        const isQa = this.configList.some(c =>
            c.Title === "QA User" &&
            c.AssignedUser &&
            c.AssignedUser.results &&
            c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin || (u.EMail && u.EMail.toLowerCase() === currentUserEmail.toLowerCase()))
        );

        // Check Production Incharge mappings
        const isProd = this.configList.some(c =>
            c.Title === "Product User" &&
            c.AssignedUser &&
            c.AssignedUser.results &&
            c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin || (u.EMail && u.EMail.toLowerCase() === currentUserEmail.toLowerCase()))
        );

        this.state.isQaUser = isQa;
        this.state.isProductionUser = isProd;

        console.log(`User Permissions resolved: QA=${isQa}, Prod=${isProd}`);
    },

    // Retrieve active cycle records and trigger UI generation
    loadCyclesHistory: async function () {
        if (!this.state.varTourID) {
            // Render first cycle if no parent tour (local simulation)
            MixingBaking_Checklist.createCycleSection(1, false);
            return;
        }

        const completedCycles = await MixingBaking_DAL.getCycles(this.state.varTourID);
        console.log("Loaded completed cycles:", completedCycles);

        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (parentElement) parentElement.innerHTML = '';

        const getCycleNum = (cycleStr) => {
            if (!cycleStr) return null;
            const match = String(cycleStr).match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
        };

        if (completedCycles && completedCycles.length > 0) {
            const cycleNumbers = [];
            completedCycles.forEach(cycleRecord => {
                const cycleNum = getCycleNum(cycleRecord.cr3ea_cycle) || 1;
                cycleNumbers.push(cycleNum);
                MixingBaking_Checklist.createCycleSection(cycleNum, true, cycleRecord);
            });

            // Find next cycle number
            const validNums = cycleNumbers.filter(n => !isNaN(n) && n > 0);
            this.state.cycleCounter = validNums.length > 0 ? Math.max(...validNums) + 1 : completedCycles.length + 1;
            MixingBaking_Checklist.createCycleSection(this.state.cycleCounter, false);
        } else {
            // Start fresh
            this.state.cycleCounter = 1;
            MixingBaking_Checklist.createCycleSection(1, false);
        }
    }
};
