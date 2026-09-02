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
        isProductionUser: false,
        canEditChecklist: false
    },

    init: async function () {
        ShowLoader();
        // Save last visited dashboard category
        localStorage.setItem("lastVisitedDashboard", "MixingAndBaking");

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

                // Expiry Check: Check if tour was created on a previous day and is not terminal
                const creationTime = this.state.tourData.createdon || this.state.tourData.cr3ea_tourstartdate;
                const status = this.state.tourData.cr3ea_status || "In Progress";
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
                                    cr3ea_status: "Closed - Expired",
                                    cr3ea_processstatus: "Closed - Expired",
                                    cr3ea_islineclear: true
                                };
                                await MixingBaking_DAL.updateParentTour(this.state.varTourID, payload);
                                this.state.tourData.cr3ea_status = "Closed - Expired";
                                this.state.tourData.cr3ea_processstatus = "Closed - Expired";
                                console.log("Tour successfully closed and expired in Dataverse.");
                            } catch (e) {
                                console.error("Failed to automatically close/expire previous day's tour:", e);
                            }
                        }
                    }
                }

                // Populate state with parent tour values
                this.state.line = this.state.tourData.cr3ea_lineno || this.state.tourData.cr3ea_lineid || "N/A";
                this.state.qaExecutive = this.state.tourData.cr3ea_assigned_qa || "";
                this.state.productionIncharge = this.state.tourData.cr3ea_shiftexecutiveproduction || "";
                this.state.shift = this.state.tourData.cr3ea_shift || sessionStorage.getItem("shiftValue") || "Shift-1";
                this.state.observedBy = typeof UserName !== 'undefined' ? UserName : "Unknown User";
            }

            // 4. Resolve roles and permissions
            await this.identifyUserRole();

            // Calculate final permissions matching Sieves
            const assignedQA = (this.state.tourData?.cr3ea_assigned_qa || "").toLowerCase().trim();
            const currentUserName = typeof currentUser !== "undefined" ? currentUser : "";
            const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
            const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";

            const myEmail = currentUserEmail.toLowerCase().trim();
            const myName1 = currentUserName.toLowerCase().trim();
            const myName2 = currentUserLogin.toLowerCase().trim();

            let isAssignedQA = false;
            if (!assignedQA) {
                isAssignedQA = this.state.isQaUser;
            } else {
                const cleanAssignedQA = assignedQA.toLowerCase().trim();
                const myEmailPart = myEmail.split("@")[0].trim();
                const qaEmailPart = cleanAssignedQA.split("@")[0].trim();

                isAssignedQA = (myEmail && (myEmail === cleanAssignedQA || myEmail.includes(cleanAssignedQA) || cleanAssignedQA.includes(myEmail) || (myEmailPart && qaEmailPart && myEmailPart === qaEmailPart))) ||
                               this.state.isQaUser;
            }

            // Allow editing/completing in mock local simulation
            if (!this.state.varTourID) {
                isAssignedQA = true;
            }

            this.state.canEditChecklist = isAssignedQA;

            // Render details
            document.getElementById("currentDay").innerText = moment().format("DD/MM/YYYY");
            document.getElementById("shiftBadge").innerText = this.state.shift.replace("-", " ");
            document.getElementById("shiftSelect").value = this.state.shift;

            // 5. Load historical records and render active cycle
            await this.loadCyclesHistory();

            // Toggle complete tour button visibility
            const compContainer = document.getElementById("complete-tour-btn-container");
            if (compContainer) {
                const isTourCompleted = this.state.tourData.cr3ea_status === "Completed" || 
                                         this.state.tourData.cr3ea_status === "Success" || 
                                         this.state.tourData.cr3ea_status === "Closed" || 
                                         this.state.tourData.cr3ea_status === "Closed - Expired";
                compContainer.style.display = (isTourCompleted || !this.state.canEditChecklist || !this.state.product) ? "none" : "flex";
            }

        } catch (err) {
            console.error("Mixing & Baking Initialization failed:", err);
            alert("Dataverse Connection Failed: Unable to initialize Mixing & Baking module.\n\n" + (err.message || "Please check network or login session."));
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
            c.AssignedUser.results.some(u => {
                const uEmail = String(u.EMail || "").toLowerCase().trim();
                const loginEmail = String(currentUserEmail || "").toLowerCase().trim();
                const uPart = uEmail.split("@")[0];
                const loginPart = loginEmail.split("@")[0];
                return loginEmail && uEmail && (loginEmail === uEmail || (uPart && loginPart && uPart === loginPart));
            })
        );

        // Check Production Incharge mappings
        const isProd = this.configList.some(c =>
            c.Title === "Product User" &&
            c.AssignedUser &&
            c.AssignedUser.results &&
            c.AssignedUser.results.some(u => {
                const uEmail = String(u.EMail || "").toLowerCase().trim();
                const loginEmail = String(currentUserEmail || "").toLowerCase().trim();
                const uPart = uEmail.split("@")[0];
                const loginPart = loginEmail.split("@")[0];
                return loginEmail && uEmail && (loginEmail === uEmail || (uPart && loginPart && uPart === loginPart));
            })
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

        const isTourCompleted = this.state.tourData?.cr3ea_status === "Completed" || 
                                 this.state.tourData?.cr3ea_status === "Success" || 
                                 this.state.tourData?.cr3ea_status === "Closed" || 
                                 this.state.tourData?.cr3ea_status === "Closed - Expired";

        if (completedCycles && completedCycles.length > 0) {
            this.state.product = completedCycles[0].cr3ea_productname || "";
            const cycleNumbers = [];
            completedCycles.forEach(cycleRecord => {
                const cycleNum = getCycleNum(cycleRecord.cr3ea_cycle) || 1;
                cycleNumbers.push(cycleNum);
                MixingBaking_Checklist.createCycleSection(cycleNum, true, cycleRecord);
            });

            // Find next cycle number
            const validNums = cycleNumbers.filter(n => !isNaN(n) && n > 0);
            this.state.cycleCounter = validNums.length > 0 ? Math.max(...validNums) + 1 : completedCycles.length + 1;
            
            // Only render active card if tour is not completed
            if (!isTourCompleted) {
                MixingBaking_Checklist.createCycleSection(this.state.cycleCounter, false);
            }
        } else {
            // Start fresh ONLY if tour is not completed
            if (!isTourCompleted) {
                this.state.cycleCounter = 1;
                MixingBaking_Checklist.createCycleSection(1, false);
            } else if (isTourCompleted && (this.state.tourData?.cr3ea_status === "Closed - Expired" || String(this.state.tourData?.cr3ea_status).includes("Expired"))) {
                if (parentElement) {
                    parentElement.innerHTML = `
                        <div class="alert alert-danger text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #fecaca; background-color: #fee2e2; color: #b91c1c; font-family: sans-serif;">
                            <h4 style="font-weight: 700; margin-bottom: 8px;">Expired while In Progress / QA Process</h4>
                            <p style="margin: 0; font-size: 14px;">This checklist session was closed automatically because it expired before completion.</p>
                        </div>
                    `;
                }
            }
        }
    }
};
