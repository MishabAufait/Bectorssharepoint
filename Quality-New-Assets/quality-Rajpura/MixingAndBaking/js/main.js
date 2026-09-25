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
        site: "Rajpura",
        line: "Line 1",
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

            // Fetch product recipes standards matrix
            this.state.recipes = await MixingBaking_DAL.getProductRecipes();
            console.log(`Mixing & Baking product recipes loaded (${this.state.recipes.length} products):`, this.state.recipes);

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
                this.state.line = this.state.tourData.cr3ea_lineno || this.state.tourData.cr3ea_lineid || "Line 1";
                const rawPlant = this.state.tourData.cr3ea_plantid;
                this.state.site = (rawPlant === "14" || rawPlant === "2" || rawPlant === "Rajpura" || !rawPlant) ? "Rajpura" : rawPlant;
                this.state.qaExecutive = this.state.tourData.cr3ea_assigned_qa || "";
                this.state.productionIncharge = this.state.tourData.cr3ea_shiftexecutiveproduction || "";
                this.state.shift = this.state.tourData.cr3ea_shift || sessionStorage.getItem("shiftValue") || "Shift-1";
                this.state.observedBy = typeof UserName !== 'undefined' ? UserName : "Unknown User";
                if (this.state.tourData.cr3ea_runningvariety) {
                    this.state.product = this.state.tourData.cr3ea_runningvariety;
                }
                if (this.state.tourData.cr3ea_batchno) {
                    this.state.batchNo = this.state.tourData.cr3ea_batchno;
                }
            }

            // 4. Resolve roles and permissions
            await this.identifyUserRole();

            // Calculate final permissions
            const assignedQA = String(this.state.tourData?.cr3ea_assigned_qa || "").trim();
            const cleanAssignedQA = assignedQA.toLowerCase();
            const assignedUserPart = cleanAssignedQA.includes("@") ? cleanAssignedQA.split("@")[0].replace(/[^a-z0-9]/g, "") : cleanAssignedQA.replace(/[^a-z0-9]/g, "");

            const currentUserName = typeof currentUser !== "undefined" ? String(currentUser).trim() : "";
            const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? String(_spPageContextInfo.userDisplayName || "").trim() : "";
            const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? String(_spPageContextInfo.userEmail || "").trim() : "";

            const cleanMyEmail = currentUserEmail.toLowerCase().trim();
            const myEmailUserPart = cleanMyEmail.includes("@") ? cleanMyEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : cleanMyEmail.replace(/[^a-z0-9]/g, "");
            const cleanName1 = currentUserName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            const cleanName2 = currentUserLogin.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

            const isDev = this.state.isDev || ["mishab", "aufait", "admin", "developer", "tester"].some(d => cleanMyEmail.includes(d) || cleanName1.includes(d) || cleanName2.includes(d));
            this.state.isDev = isDev;

            let isAssignedQA = false;
            if (!assignedQA) {
                // If tour is unassigned, any QA can start sessions and fill cycles
                isAssignedQA = this.state.isQaUser || isDev;
            } else {
                // Check if current user is the assigned QA
                const emailMatch = (cleanMyEmail && (cleanMyEmail === cleanAssignedQA || cleanAssignedQA.includes(cleanMyEmail) || cleanMyEmail.includes(cleanAssignedQA))) ||
                                   (myEmailUserPart && assignedUserPart && myEmailUserPart === assignedUserPart && myEmailUserPart.length > 0);

                const nameMatch = (cleanName1 && (cleanName1 === assignedUserPart || cleanAssignedQA.includes(cleanName1) || cleanName1.includes(assignedUserPart))) ||
                                  (cleanName2 && (cleanName2 === assignedUserPart || cleanAssignedQA.includes(cleanName2) || cleanName2.includes(assignedUserPart)));

                const resolvedAssigned = (typeof MixingBaking_Checklist !== "undefined" && MixingBaking_Checklist.resolveUserName) ? MixingBaking_Checklist.resolveUserName(assignedQA).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
                const resolvedMatch = resolvedAssigned && (cleanName1.includes(resolvedAssigned) || cleanName2.includes(resolvedAssigned) || resolvedAssigned.includes(cleanName1) || resolvedAssigned.includes(cleanName2));

                isAssignedQA = ((emailMatch || nameMatch || resolvedMatch || isDev) && this.state.isQaUser) || isDev;
            }

            // URL override (?role=QA, ?role=PRODUCTION, ?role=VIEWER)
            const urlRole = new URLSearchParams(window.location.search).get("role");
            if (urlRole) {
                if (urlRole.toUpperCase() === "QA") isAssignedQA = true;
                else isAssignedQA = false;
            }

            // Allow editing/completing in mock local simulation or new tour creation
            if (!this.state.varTourID) {
                isAssignedQA = this.state.isQaUser || isDev || true;
            }

            this.state.canEditChecklist = isAssignedQA;
            this.state.isAssignedQA = isAssignedQA;
            console.log(`Mixing & Baking: canEditChecklist=${this.state.canEditChecklist} (isQaUser=${this.state.isQaUser}, assignedQA="${assignedQA}")`);

            // If tour is Cancelled, restrict access and redirect to dashboard
            const mbStatus = String(this.state.tourData?.cr3ea_processstatus || this.state.tourData?.cr3ea_status || "In Progress").toLowerCase().trim();
            if (this.state.varTourID && mbStatus.includes("cancel")) {
                if (typeof HideLoader === "function") HideLoader();
                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            // If tour is In Progress and current user is NOT the assigned QA, restrict access and redirect to dashboard like ALC & PackagingOperations
            const isMbInProgress = (mbStatus === "in-progress" || mbStatus === "in progress" || mbStatus === "inprogress-paused" || mbStatus === "pending qa");
            if (this.state.varTourID && isMbInProgress && !isAssignedQA && !isDev) {
                if (typeof HideLoader === "function") HideLoader();
                alert("This tour is currently in progress for QA evaluation. Access is restricted to the assigned QA Executive.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            // Render header details safely
            const currentDayEl = document.getElementById("currentDay");
            if (currentDayEl) currentDayEl.innerText = moment().format("DD/MM/YYYY");
            const shiftBadgeEl = document.getElementById("shiftBadge");
            if (shiftBadgeEl) shiftBadgeEl.innerText = (this.state.shift || "Shift-1").replace("-", " ");
            const shiftSelectEl = document.getElementById("shiftSelect");
            if (shiftSelectEl) {
                shiftSelectEl.value = this.state.shift || "Shift-1";
                if (typeof $ !== "undefined" && $(shiftSelectEl).hasClass("select2-hidden-accessible")) {
                    $(shiftSelectEl).trigger("change");
                }
            }

            // 5. Initialize Checklist Info Form
            try {
                if (typeof MixingBaking_Checklist !== "undefined" && MixingBaking_Checklist.initChecklistInfoForm) {
                    MixingBaking_Checklist.initChecklistInfoForm();
                }
            } catch (errForm) {
                console.error("Failed to initialize checklist info form:", errForm);
            }

            // 6. Check whether tour session has already been started with product metadata
            const screenInfo = document.getElementById("screen-checklist-info");
            const screenCycles = document.getElementById("screen-cycles-container");

            const isTourAlreadyStarted = !!(this.state.product && this.state.product.trim() !== "");

            if (!isTourAlreadyStarted) {
                // Fresh Tour / Tour without product metadata: Show Checklist Information form first (matching Food Safety pattern)
                if (screenInfo) {
                    screenInfo.style.display = "block";
                    screenInfo.style.opacity = "1";
                    screenInfo.classList.add("bs-fade-active", "bs-fade-in");
                }
                if (screenCycles) {
                    screenCycles.style.display = "none";
                    screenCycles.classList.remove("bs-fade-active", "bs-fade-in");
                }
            } else {
                // Active/Existing Tour with product metadata: Show persistent summary header and cycles list directly
                if (screenInfo) {
                    screenInfo.style.display = "none";
                    screenInfo.classList.remove("bs-fade-active", "bs-fade-in");
                }
                if (screenCycles) {
                    screenCycles.style.display = "block";
                    screenCycles.style.opacity = "1";
                    screenCycles.classList.add("bs-fade-active", "bs-fade-in");
                }
                MixingBaking_Checklist.renderHeaderSummary();
                await this.loadCyclesHistory();
            }

        } catch (err) {
            console.error("Mixing & Baking Initialization failed:", err);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "initialize Mixing & Baking module")
                : `Dataverse Connection Failed: Unable to initialize Mixing & Baking module.\n\n${(!navigator.onLine ? "No internet connection detected. Please reconnect and try again.\n\n" : "")}${err.message || "Please check network or login session."}`;
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // Identify user role from SharePoint config list mappings
    identifyUserRole: async function () {
        const currentUserName = typeof currentUser !== "undefined" ? String(currentUser).trim() : "";
        const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? String(_spPageContextInfo.userDisplayName || "").trim() : "";
        const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? String(_spPageContextInfo.userEmail || "").trim() : "";

        const cleanMyEmail = currentUserEmail.toLowerCase().trim();
        const myEmailUserPart = cleanMyEmail.includes("@") ? cleanMyEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : cleanMyEmail.replace(/[^a-z0-9]/g, "");
        const cleanName1 = currentUserName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        const cleanName2 = currentUserLogin.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

        // Default flags
        let isQa = false;
        let isProd = false;

        const checkUserMatch = (u) => {
            if (!u) return false;
            const uTitle = String(u.Title || "").toLowerCase().trim();
            const uEmail = String(u.EMail || "").toLowerCase().trim();
            const uTitleClean = uTitle.replace(/[^a-z0-9]/g, "");
            const uEmailUserPart = uEmail.includes("@") ? uEmail.split("@")[0].replace(/[^a-z0-9]/g, "") : uEmail.replace(/[^a-z0-9]/g, "");

            return (cleanMyEmail && uEmail && (cleanMyEmail === uEmail || uEmail.includes(cleanMyEmail) || cleanMyEmail.includes(uEmail))) ||
                   (myEmailUserPart && uEmailUserPart && myEmailUserPart === uEmailUserPart && myEmailUserPart.length > 0) ||
                   (cleanName1 && uTitleClean && (cleanName1 === uTitleClean || cleanName1.includes(uTitleClean) || uTitleClean.includes(cleanName1))) ||
                   (cleanName2 && uTitleClean && (cleanName2 === uTitleClean || cleanName2.includes(uTitleClean) || uTitleClean.includes(cleanName2)));
        };

        // 1. Check QA executive mappings from main config list
        if (Array.isArray(this.configList)) {
            isQa = this.configList.some(c =>
                (c.Title === "QA User" || c.Title === "QA HOD" || c.ConfigType === "QA User" || c.ConfigType === "QA HOD") &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => checkUserMatch(u))
            );

            // Check Production Incharge mappings
            isProd = this.configList.some(c =>
                (c.Title === "Product User" || c.Title === "Production User" || c.ConfigType === "Product User" || c.ConfigType === "Production User") &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => checkUserMatch(u))
            );
        }

        // 2. Also check Mixing & Baking specific usersConfig list
        if (this.state.usersConfig && Array.isArray(this.state.usersConfig.qaUsers)) {
            if (this.state.usersConfig.qaUsers.some(u => checkUserMatch(u))) {
                isQa = true;
            }
        }
        if (this.state.usersConfig && Array.isArray(this.state.usersConfig.prodUsers)) {
            if (this.state.usersConfig.prodUsers.some(u => checkUserMatch(u))) {
                isProd = true;
            }
        }

        // 3. Developer / Admin fallback for testing
        const devEmails = ["mishab", "aufait", "admin", "developer", "tester"];
        const isDev = devEmails.some(d => cleanMyEmail.includes(d) || cleanName1.includes(d) || cleanName2.includes(d));
        this.state.isDev = isDev;
        if (isDev) {
            console.log("Admin / Dev user detected: granting QA permissions");
            isQa = true;
        }

        // 4. URL role override for testing (?role=QA, ?role=PRODUCTION, ?role=VIEWER)
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = (urlParams.get("role") || "").toUpperCase();
        if (urlRole === "QA") {
            isQa = true;
            isProd = false;
        } else if (urlRole === "PRODUCTION" || urlRole === "PRODUCT") {
            isQa = false;
            isProd = true;
        } else if (urlRole === "VIEWER") {
            isQa = false;
            isProd = false;
        }

        this.state.isQaUser = isQa;
        this.state.isProductionUser = isProd;

        console.log(`Mixing & Baking User Permissions resolved: QA=${isQa}, Prod=${isProd}`);
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

        // Hide add-cycle button since each tour has strictly only 1 cycle
        const addBtnContainer = document.getElementById("add-cycle-btn-container");
        if (addBtnContainer) addBtnContainer.style.display = "none";

        if (completedCycles && completedCycles.length > 0) {
            const firstCycle = completedCycles[0];
            if (firstCycle.cr3ea_productname) this.state.product = firstCycle.cr3ea_productname;
            if (firstCycle.cr3ea_batchno) this.state.batchNo = firstCycle.cr3ea_batchno;
            if (firstCycle.cr3ea_lineno) this.state.line = firstCycle.cr3ea_lineno;
            if (firstCycle.cr3ea_plantid) this.state.site = firstCycle.cr3ea_plantid;
            if (firstCycle.cr3ea_observedby) this.state.qaExecutive = firstCycle.cr3ea_observedby;
            if (firstCycle.cr3ea_productionincharge) this.state.productionIncharge = firstCycle.cr3ea_productionincharge;
            if (firstCycle.cr3ea_shift) this.state.shift = firstCycle.cr3ea_shift;

            completedCycles.forEach(cycleRecord => {
                const cycleNum = getCycleNum(cycleRecord.cr3ea_cycle) || 1;
                MixingBaking_Checklist.createCycleSection(cycleNum, true, cycleRecord);
            });
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
