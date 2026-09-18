// Main Orchestrator for Rajpura CCP, OPRP, Sieves & Magnets Quality form
console.log("CCP_OPRP_Sieves Main JS loaded");

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
            overlay.innerHTML = ""; // Clear progress loader box
        }
    };
})();

const CCP_OPRP_Main = {
    state: {
        varTourID: null,
        tourData: {},
        category: null, // "CCP" or "SIEVES"
        frequency: "4hrs", // "4hrs" or "8hrs" for Sieves
        selectedLine: "",
        product: "",
        qaExecutive: "",
        productionIncharge: "",
        site: "",
        cycleCounter: 1
    },

    init: async function () {
        // Save last visited dashboard category
        localStorage.setItem("lastVisitedDashboard", "CCP_OPRP_Sieves");

        this.state.varTourID = this.getQueryStringParam("TourId");
        
        try {
            // 1. Fetch configs from SharePoint mapping list
            this.configList = await CCP_OPRP_DAL.getConfig();
            console.log("SharePoint configuration mappings loaded:", this.configList);

            // 2. Fetch Parent Tour details
            if (this.state.varTourID) {
                this.state.tourData = await CCP_OPRP_DAL.getParentTour(this.state.varTourID);
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
                                    cr3ea_processstatus: "Closed - Expired"
                                };
                                await CCP_OPRP_DAL.updateParentTour(this.state.varTourID, payload);
                                this.state.tourData.cr3ea_status = "Closed - Expired";
                                this.state.tourData.cr3ea_processstatus = "Closed - Expired";
                                console.log("Tour successfully closed and expired in Dataverse.");
                            } catch (e) {
                                console.error("Failed to automatically close/expire previous day's tour:", e);
                            }
                        }
                    }
                }

                const pType = this.state.tourData.cr3ea_ccp_oprp_sieves_parametertype || 
                              (this.state.tourData.cr3ea_title && this.state.tourData.cr3ea_title.startsWith("CCP_") ? "CCP & OPRP" : 
                              (this.state.tourData.cr3ea_title && this.state.tourData.cr3ea_title.startsWith("Sieves_") ? "Sieves and Magnets" : ""));
                if (pType) {
                    // Tour already initialized, load checklist form directly
                    this.state.category = pType === "CCP & OPRP" ? "CCP" : "SIEVES";
                    this.state.frequency = this.state.tourData.cr3ea_ccp_oprp_sieves_frequency || "4hrs";
                    this.state.selectedLine = this.state.tourData.cr3ea_lineno || this.state.tourData.cr3ea_lineid || "";
                    this.state.product = this.state.tourData.cr3ea_runningvariety || this.state.tourData.cr3ea_productname || "";
                    this.state.qaExecutive = this.state.tourData.cr3ea_assigned_qa || "";
                    this.state.productionIncharge = this.state.tourData.cr3ea_shiftexecutiveproduction || "";
                    this.state.site = this.state.tourData.cr3ea_plantid || "Rajpura";
                }
            }

            // 3. Resolve user roles and authorizations
            await this.identifyUserRole();

            // If tour is Cancelled, restrict access and redirect to dashboard
            const tourStatusVal = String(this.state.tourData?.cr3ea_processstatus || this.state.tourData?.cr3ea_status || "").toLowerCase().trim();
            if (this.state.varTourID && tourStatusVal.includes("cancel")) {
                if (typeof HideLoader === "function") HideLoader();
                alert("Access Denied: This observation has been cancelled and cannot be accessed.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            // Check stage-specific access permissions
            const isTourInProgress = (tourStatusVal === "in-progress" || tourStatusVal === "in progress" || tourStatusVal === "inprogress-paused" || tourStatusVal === "pending qa");
            const isPendingProdAction = (tourStatusVal === "pending production action" || tourStatusVal.includes("pending production") || tourStatusVal.includes("pending observation") || tourStatusVal === "escalated");
            const isPendingQAVerify = (tourStatusVal === "pending qa re-verification" || tourStatusVal.includes("re-verification") || tourStatusVal.includes("re-verify"));

            // 1. Pending Production Action: strictly accessible only to assigned Production Incharge
            if (this.state.varTourID && isPendingProdAction && !this.state.isProductionUser && !this.state.isDev) {
                if (typeof HideLoader === "function") HideLoader();
                alert("Access Denied: This tour is currently in Pending Production Action stage. Access is restricted to the assigned Production Incharge.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            // 2. In Progress / Evaluation: accessible only to assigned personnel
            const canAccessTour = this.state.isAssignedQA || this.state.isAssignedProd || this.state.isQaUser || this.state.isProductionUser || this.state.isDev;
            if (this.state.varTourID && isTourInProgress && !canAccessTour) {
                if (typeof HideLoader === "function") HideLoader();
                alert("This tour is currently in progress for QA evaluation. Access is restricted to assigned personnel.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            if (this.state.varTourID && (this.state.tourData.cr3ea_ccp_oprp_sieves_parametertype || this.state.category)) {
                document.getElementById("setup-form-container").style.display = "none";
                document.getElementById("checklist-main-container").style.display = "block";
                
                // Render header title
                const titleText = this.state.category === "CCP" ? "CCP & OPRP RECORD" : "SIEVES & MAGNETS MONITORING RECORD";
                document.querySelector(".tour-header-title").innerText = `${titleText} (RAJPURA)`;

                await this.loadCyclesHistory();

                // Toggle complete tour button visibility: strictly visible only for QA Executive
                const compContainer = document.getElementById("complete-tour-btn-container");
                if (compContainer) {
                    const isCompleted = this.state.tourData && (
                        this.state.tourData.cr3ea_status === "Completed" || 
                        this.state.tourData.cr3ea_status === "Success" || 
                        this.state.tourData.cr3ea_status === "Closed" ||
                        this.state.tourData.cr3ea_status === "Closed - Expired"
                    );
                    const isQAUser = this.state.isQaRole;
                    const isProdOnly = this.state.isProdOnly;
                    compContainer.style.display = (isCompleted || !isQAUser || isProdOnly || !this.state.canEditChecklist) ? "none" : "flex";
                }
            } else {
                // Tour exists but parameters are not set yet, show setup form
                this.renderSetupForm();
            }
        } catch (err) {
            console.error("Initialization failed: ", err);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "initialize CCP, OPRP, Sieves & Magnets module")
                : `Dataverse Connection Failed: Unable to initialize CCP, OPRP, Sieves & Magnets module.\n\n${(!navigator.onLine ? "No internet connection detected. Please reconnect and try again.\n\n" : "")}${err.message || "Please check network or login session."}`;
            alert(msg);
        }
    },

    identifyUserRole: async function () {
        // 1. Extract logged-in user credentials from SharePoint context & session storage
        let rawEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) 
            ? String(_spPageContextInfo.userEmail).trim() 
            : ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userLoginName) 
                ? String(_spPageContextInfo.userLoginName).trim() 
                : "");

        if (!rawEmail) {
            rawEmail = sessionStorage.getItem("userEmail") || sessionStorage.getItem("UserEmail") || "";
        }

        // Clean claims prefix (e.g., "i:0#.f|membership|mishab@aufaitcloud.com" -> "mishab@aufaitcloud.com")
        let currentUserEmail = rawEmail.toLowerCase().trim();
        if (currentUserEmail.includes("|")) {
            currentUserEmail = currentUserEmail.split("|").pop().trim();
        }

        const currentUserName = (typeof EmployeeName !== 'undefined' && EmployeeName) 
            ? String(EmployeeName).toLowerCase().trim() 
            : (typeof UserName !== 'undefined' && UserName 
                ? String(UserName).toLowerCase().trim() 
                : (typeof currentUser !== "undefined" ? String(currentUser).toLowerCase().trim() : 
                  ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? String(_spPageContextInfo.userDisplayName).toLowerCase().trim() : (sessionStorage.getItem("userName") || ""))));
        
        const currentUserLogin = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? String(_spPageContextInfo.userDisplayName).toLowerCase().trim() 
            : currentUserName;

        // Developer / Admin check
        const devKeys = ["mishab", "aufait", "admin", "developer", "tester"];
        const isDev = devKeys.some(d => 
            currentUserEmail.includes(d) || 
            currentUserName.includes(d) || 
            currentUserLogin.includes(d)
        );
        this.state.isDev = isDev;

        // 2. Extract QA Executive and Production Incharge directly from Parent Tour record
        // Mirroring dashboard.js matching exactly:
        // QA: t.cr3ea_assigned_qa || t.cr3ea_qaexecutive || t.cr3ea_tourby || ""
        // Prod: t.cr3ea_shiftexecutiveproduction || t.cr3ea_production_incharge || t.cr3ea_observedby || ""
        const t = this.state.tourData || {};
        const qaEmail = String(t.cr3ea_assigned_qa || t.cr3ea_qaexecutive || t.cr3ea_tourby || "").toLowerCase().trim();
        const qaResolvedName = (typeof qaEmail === "string" && qaEmail.includes("@"))
            ? ((typeof CCP_OPRP_Checklist !== "undefined" && CCP_OPRP_Checklist.resolveUserName) ? CCP_OPRP_Checklist.resolveUserName(qaEmail).toLowerCase().trim() : qaEmail)
            : qaEmail;

        const prodExecRawVal = String(t.cr3ea_shiftexecutiveproduction || t.cr3ea_production_incharge || t.cr3ea_observedby || "").toLowerCase().trim();
        const prodExecResolvedVal = (typeof prodExecRawVal === "string" && prodExecRawVal.includes("@"))
            ? ((typeof CCP_OPRP_Checklist !== "undefined" && CCP_OPRP_Checklist.resolveUserName) ? CCP_OPRP_Checklist.resolveUserName(prodExecRawVal).toLowerCase().trim() : prodExecRawVal)
            : prodExecRawVal;

        // Symmetric user matching function (identical to dashboard.js cross-checking user email / display name / resolved name)
        const isAssignedQA = Boolean(
            (currentUserEmail && qaEmail && (currentUserEmail === qaEmail || currentUserEmail.includes(qaEmail) || qaEmail.includes(currentUserEmail))) ||
            (currentUserName && qaEmail && (currentUserName === qaEmail || currentUserName.includes(qaEmail) || qaEmail.includes(currentUserName))) ||
            (currentUserName && qaResolvedName && (currentUserName === qaResolvedName || currentUserName.includes(qaResolvedName) || qaResolvedName.includes(currentUserName))) ||
            (currentUserLogin && qaResolvedName && (currentUserLogin === qaResolvedName || currentUserLogin.includes(qaResolvedName) || qaResolvedName.includes(currentUserLogin)))
        );

        const isAssignedProd = Boolean(
            (currentUserEmail && prodExecRawVal && (currentUserEmail === prodExecRawVal || currentUserEmail.includes(prodExecRawVal) || prodExecRawVal.includes(currentUserEmail))) ||
            (currentUserName && prodExecRawVal && (currentUserName === prodExecRawVal || currentUserName.includes(prodExecRawVal) || prodExecRawVal.includes(currentUserName))) ||
            (currentUserName && prodExecResolvedVal && (currentUserName === prodExecResolvedVal || currentUserName.includes(prodExecResolvedVal) || prodExecResolvedVal.includes(currentUserName))) ||
            (currentUserLogin && prodExecResolvedVal && (currentUserLogin === prodExecResolvedVal || currentUserLogin.includes(prodExecResolvedVal) || prodExecResolvedVal.includes(currentUserLogin)))
        );

        // 3. Department & Global Role matching (Identical to dashboard.js)
        const isDeptQA = (typeof DepartmentNameLeftNavi === "string" && DepartmentNameLeftNavi.toLowerCase().includes("quality")) ||
                         (typeof RoleName === "string" && RoleName.toLowerCase().includes("qa"));

        const isDeptProd = (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("prod") || DepartmentNameLeftNavi.toLowerCase().includes("baking") || DepartmentNameLeftNavi.toLowerCase().includes("mixing"))) ||
                           (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod"));

        // 4. SharePoint Master config list mappings
        let isConfigQA = false;
        let isConfigProd = false;

        const matchConfigUser = (u) => {
            if (!u) return false;
            const uEmail = String(u.EMail || "").toLowerCase().trim();
            const uTitle = String(u.Title || "").toLowerCase().trim();
            return (currentUserEmail && uEmail && (currentUserEmail === uEmail || currentUserEmail.includes(uEmail) || uEmail.includes(currentUserEmail))) ||
                   (currentUserName && uTitle && (currentUserName === uTitle || currentUserName.includes(uTitle) || uTitle.includes(currentUserName))) ||
                   (currentUserLogin && uTitle && (currentUserLogin === uTitle || currentUserLogin.includes(uTitle) || uTitle.includes(currentUserLogin)));
        };

        if (Array.isArray(this.configList) && this.configList.length > 0) {
            this.configList.forEach(c => {
                if (c.AssignedQA && c.AssignedQA.results) {
                    if (c.AssignedQA.results.some(u => matchConfigUser(u))) isConfigQA = true;
                }
                if (c.AssignedUser && c.AssignedUser.results) {
                    if (c.AssignedUser.results.some(u => matchConfigUser(u))) {
                        const titleLower = String(c.Title || c.ConfigType || "").toLowerCase();
                        if (titleLower.includes("qa")) isConfigQA = true;
                        if (titleLower.includes("prod")) isConfigProd = true;
                    }
                }
                if (c.ProductionIncharge && c.ProductionIncharge.results) {
                    if (c.ProductionIncharge.results.some(u => matchConfigUser(u))) isConfigProd = true;
                }
            });
        }

        // 5. Aggregate QA vs Production qualifications
        const isUserQA = isAssignedQA || isConfigQA || isDeptQA || isDev;
        const isUserProd = isAssignedProd || isConfigProd || isDeptProd || isDev;

        // 6. Tour status evaluation
        const tourStatus = String(t.cr3ea_processstatus || t.cr3ea_status || "In Progress").trim();
        const isTourInProgress = (tourStatus.toLowerCase() === "in progress" || tourStatus.toLowerCase() === "in-progress" || tourStatus.toLowerCase() === "inprogress-paused" || tourStatus.toLowerCase() === "pending qa");
        const isPendingProdAction = (tourStatus === "Pending Production Action" || tourStatus.includes("Pending Production") || tourStatus.includes("Pending Observation") || tourStatus === "Escalated");
        const isPendingQAVerify = (tourStatus === "Pending QA Re-Verification" || tourStatus.includes("Re-Verification") || tourStatus.includes("Re-verify"));
        const isTourCompleted = (tourStatus === "Completed" || tourStatus === "Success" || tourStatus === "Closed" || tourStatus === "Closed - Expired");

        this.state.hasAssignedQA = Boolean(qaEmail);
        this.state.hasAssignedProd = Boolean(prodExecRawVal);
        this.state.isAssignedQA = isAssignedQA;
        this.state.isAssignedProd = isAssignedProd;
        this.state.isQaUser = isUserQA;
        this.state.isProductionUser = isUserProd;

        // 7. Strict Active Role Decision (Aligned with Dashboard Yellow-Highlight Task Matrix)
        let isQaRole = false;
        let isProdRole = false;

        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = (urlParams.get("role") || "").toUpperCase();

        if (urlRole === "QA") {
            isQaRole = true;
            isProdRole = false;
        } else if (urlRole === "PRODUCTION" || urlRole === "PROD" || urlRole === "PRODUCT") {
            isQaRole = false;
            isProdRole = true;
        } else if (isPendingProdAction) {
            // Tour is pending Production Action (Highlighted for Production on Dashboard)
            if (isUserProd) {
                isQaRole = false;
                isProdRole = true;
            } else {
                isQaRole = true;
                isProdRole = false;
            }
        } else if (isPendingQAVerify) {
            // Tour is pending QA Re-verification (Highlighted for QA on Dashboard)
            if (isUserQA) {
                isQaRole = true;
                isProdRole = false;
            } else {
                isQaRole = false;
                isProdRole = true;
            }
        } else if (isTourInProgress) {
            // Tour is In Progress for QA inspection (Highlighted for QA on Dashboard)
            if (isUserQA) {
                isQaRole = true;
                isProdRole = false;
            } else {
                isQaRole = false;
                isProdRole = true;
            }
        } else {
            // Completed, closed or general fallback:
            if (isAssignedQA && !isAssignedProd) {
                isQaRole = true;
                isProdRole = false;
            } else if (isAssignedProd && !isAssignedQA) {
                isQaRole = false;
                isProdRole = true;
            } else if (isUserQA && !isUserProd) {
                isQaRole = true;
                isProdRole = false;
            } else if (isUserProd && !isUserQA) {
                isQaRole = false;
                isProdRole = true;
            } else {
                isQaRole = true;
                isProdRole = false;
            }
        }

        this.state.isQaRole = isQaRole;
        this.state.isProdRole = isProdRole;
        this.state.isProdOnly = isProdRole && !isQaRole;

        // 8. Strict Permissions:
        // - Checklist Filling: STRICTLY QA Executive, only when tour is in progress & not completed
        this.state.canEditChecklist = isQaRole && isTourInProgress && !isTourCompleted;

        // - Corrective Action: STRICTLY Production Incharge, only when tour status is Pending Production Action
        this.state.canEditCorrectiveAction = isProdRole && !isQaRole && isPendingProdAction && !isTourCompleted;

        // - QA Re-Verification: STRICTLY QA Executive, only when tour status is Pending QA Re-Verification
        this.state.canReverify = isQaRole && isPendingQAVerify && !isTourCompleted;

        console.log("CCP/OPRP/Sieves User tour role resolved:", {
            currentUserEmail,
            currentUserName,
            tourQA: qaEmail,
            tourQA_resolved: qaResolvedName,
            tourProd: prodExecRawVal,
            tourProd_resolved: prodExecResolvedVal,
            isAssignedQA,
            isAssignedProd,
            isDeptQA,
            isDeptProd,
            isConfigQA,
            isConfigProd,
            isUserQA,
            isUserProd,
            tourStatus,
            activePOV: isQaRole ? "QA Executive" : "Production Incharge",
            canEditChecklist: this.state.canEditChecklist,
            canEditCorrectiveAction: this.state.canEditCorrectiveAction,
            canReverify: this.state.canReverify
        });
    },

    renderSetupForm: function () {
        document.getElementById("setup-form-container").style.display = "block";
        document.getElementById("checklist-main-container").style.display = "none";

        const shiftExecName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? _spPageContextInfo.userDisplayName 
            : (typeof EmployeeName !== 'undefined' && EmployeeName ? EmployeeName : (typeof currentUser !== "undefined" ? currentUser : "Shift Executive"));
        const shiftExecInput = document.getElementById("setup-shift-exec");
        if (shiftExecInput) {
            shiftExecInput.value = shiftExecName;
        }

        if (!this.state.isQaUser && !this.state.isDev) {
            $('#setup-type, #setup-site, #setup-line, #setup-product, #setup-freq, #setup-qa, #setup-prod').prop('disabled', true);
        }

        // Setup dropdown listeners
        const typeSelect = document.getElementById("setup-type");
        const lineSelect = document.getElementById("setup-line");
        const freqGroup = document.getElementById("setup-freq-group");
        const lineGroup = document.getElementById("setup-line-group");
        const productGroup = document.getElementById("setup-product-group");

        const updatePersonnel = () => {
            const typeVal = typeSelect.value;
            const lineVal = lineSelect.value;
            const qaSelect = document.getElementById("setup-qa");
            const prodSelect = document.getElementById("setup-prod");

            qaSelect.innerHTML = "";
            prodSelect.innerHTML = "";

            let matchingConfigs = [];
            if (typeVal === "Sieves and Magnets") {
                matchingConfigs = this.configList.filter(c => c.ConfigType === "Sieves_Magnets" || c.ConfigType === "Sieves and Magnets");
            } else {
                matchingConfigs = this.configList.filter(c => c.ConfigType === "CCP_OPRP" || c.ConfigType === "CCP & OPRP");
            }

            console.log("updatePersonnel triggered:", {
                typeVal: typeVal,
                configList: this.configList,
                matchingConfigs: matchingConfigs
            });

            const qas = {};
            const prods = {};

            matchingConfigs.forEach(c => {
                if (c.AssignedQA && c.AssignedQA.results) {
                    c.AssignedQA.results.forEach(u => {
                        if (u.EMail && u.Title) qas[u.EMail.toLowerCase().trim()] = u.Title;
                    });
                }
                if (c.ProductionIncharge && c.ProductionIncharge.results) {
                    c.ProductionIncharge.results.forEach(u => {
                        if (u.EMail && u.Title) prods[u.EMail.toLowerCase().trim()] = u.Title;
                    });
                }
            });

            console.log("Extracted personnel sets from SharePoint:", {
                qas: qas,
                prods: prods
            });

            // Add empty choice at the top
            qaSelect.insertAdjacentHTML("beforeend", `<option value="">Select QA Executive...</option>`);
            prodSelect.insertAdjacentHTML("beforeend", `<option value="">Select Production Executive...</option>`);

            for (const email in qas) {
                qaSelect.insertAdjacentHTML("beforeend", `<option value="${email}">${qas[email]}</option>`);
            }

            for (const email in prods) {
                prodSelect.insertAdjacentHTML("beforeend", `<option value="${email}">${prods[email]}</option>`);
            }

            // Set initial value to empty
            qaSelect.value = "";
            prodSelect.value = "";

            // Pre-select active user email if matching option exists
            const myEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? String(_spPageContextInfo.userEmail).toLowerCase().trim() : "";
            if (myEmail) {
                const options = Array.from(qaSelect.options);
                const match = options.find(opt => opt.value.toLowerCase() === myEmail);
                if (match) {
                    qaSelect.value = match.value;
                }
            } else if (typeof EmployeeName !== 'undefined' && EmployeeName) {
                const options = Array.from(qaSelect.options);
                const match = options.find(opt => opt.text.toLowerCase() === EmployeeName.toLowerCase());
                if (match) {
                    qaSelect.value = match.value;
                }
            }

            // Initialize select2 on personnel elements
            $('#setup-qa, #setup-prod').select2({
                minimumResultsForSearch: -1,
                dropdownAutoWidth: false,
                width: '100%'
            });

            // Dynamically validate and enable/disable the start button
            const validateStartButton = () => {
                const qaVal = $('#setup-qa').val();
                const prodVal = $('#setup-prod').val();
                const btn = document.getElementById("start-tour-btn");
                if (btn) {
                    if (!this.state.isQaUser) {
                        btn.disabled = true;
                        btn.innerText = "QA Authorization Required";
                    } else {
                        btn.disabled = (!qaVal || !prodVal);
                        btn.innerText = "Start Quality Tour";
                    }
                }
            };

            // Bind Select2 change listener
            $('#setup-qa, #setup-prod').off('change.validation').on('change.validation', validateStartButton);

            // Run initial check
            validateStartButton();
            $('#setup-qa, #setup-prod').trigger('change');
        };

        const updateProductDropdown = () => {
            const lineVal = lineSelect ? lineSelect.value : "";
            const productSelect = document.getElementById("setup-product");
            if (!productSelect) return;

            const products = CCP_OPRP_DAL.getProducts(lineVal);
            const currentSelected = $(productSelect).val() || productSelect.value;

            productSelect.innerHTML = "";
            if (products.length > 0) {
                products.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = p.Title;
                    opt.textContent = p.Title;
                    if (p.Title === currentSelected) opt.selected = true;
                    productSelect.appendChild(opt);
                });
            } else {
                productSelect.innerHTML = `<option value="General Production">General Production</option>`;
            }

            $('#setup-product').select2({
                minimumResultsForSearch: 5,
                dropdownAutoWidth: false,
                width: '100%'
            });
        };

        // Register select2 change events
        $('#setup-type').on("change", () => {
            if (typeSelect.value === "Sieves and Magnets") {
                freqGroup.style.display = "block";
                lineGroup.style.display = "none";
                productGroup.style.display = "none";
            } else {
                freqGroup.style.display = "none";
                lineGroup.style.display = "block";
                productGroup.style.display = "block";
            }
            updatePersonnel();
            updateProductDropdown();
        });

        $('#setup-line').on("change", () => {
            updatePersonnel();
            updateProductDropdown();
        });

        // Trigger personnel and product dropdown load initially
        updatePersonnel();
        updateProductDropdown();
    },

    startTour: async function () {
        const typeVal = $('#setup-type').val() || document.getElementById("setup-type")?.value || "";
        const siteVal = $('#setup-site').val() || document.getElementById("setup-site")?.value || "Rajpura";
        const lineVal = $('#setup-line').val() || document.getElementById("setup-line")?.value || "";
        const productVal = $('#setup-product').val() || document.getElementById("setup-product")?.value || "";
        const freqVal = $('#setup-freq').val() || document.getElementById("setup-freq")?.value || "4hrs";
        const prodVal = $('#setup-prod').val() || document.getElementById("setup-prod")?.value || "";
        const qaVal = $('#setup-qa').val() || document.getElementById("setup-qa")?.value || "";

        if (!prodVal || !qaVal) {
            alert("Please select both Production Executive and QA Executive.");
            return;
        }

        const shiftExecEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? _spPageContextInfo.userEmail : "";
        const shiftExecName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? _spPageContextInfo.userDisplayName 
            : (typeof EmployeeName !== 'undefined' ? EmployeeName : (typeof currentUser !== "undefined" ? currentUser : "Shift Executive"));

        const btn = document.getElementById("start-tour-btn");
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Starting Tour...";
        }

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateStr = `${dd}${mm}${yyyy}`;
        const titlePrefix = typeVal === "CCP & OPRP" ? "CCP" : "Sieves";
        const lineStr = typeVal === "CCP & OPRP" ? lineVal : "All";

        const payload = {
            cr3ea_ccp_oprp_sieves_parametertype: typeVal,
            cr3ea_ccp_oprp_sieves_frequency: typeVal === "Sieves and Magnets" ? freqVal : null,
            cr3ea_runningvariety: typeVal === "CCP & OPRP" ? productVal : null,
            cr3ea_plantid: siteVal === "Rajpura" ? QualityRajpura_Config.PLANT_ID : siteVal,
            cr3ea_lineno: typeVal === "CCP & OPRP" ? lineVal : null,
            cr3ea_assigned_qa: qaVal,
            cr3ea_qaexecutive: qaVal,
            cr3ea_shiftexecutiveproduction: prodVal,
            cr3ea_production_incharge: prodVal,
            cr3ea_observedby: prodVal,
            cr3ea_tourby: shiftExecEmail || shiftExecName,
            cr3ea_shiftexecutive: shiftExecName,
            cr3ea_status: "In Progress",
            cr3ea_processstatus: "In Progress",
            cr3ea_shift: sessionStorage.getItem("shiftValue") || "Shift-1",
            cr3ea_tourstartdate: now.toISOString(),
            cr3ea_title: `${titlePrefix}_${siteVal}_${lineStr}_${dateStr}`
        };

        try {
            if (this.state.varTourID) {
                payload.cr3ea_prod_rajpura_quality_tourid = this.state.varTourID;
            } else if (typeVal === "CCP & OPRP" && lineVal) {
                // Check if active session already exists for this line today and prompt for override
                const token = await CCP_OPRP_DAL.getAccessToken();
                const proceed = await QualityRajpura_Config.checkAndPromptLineOverride({
                    moduleKey: "CCP",
                    line: lineVal,
                    currentTourId: this.state.varTourID,
                    token: token
                });
                if (!proceed) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerText = "Start Quality Tour";
                    }
                    return;
                }
            }
            
            if (typeof ShowLoader === "function") ShowLoader();

            const savedTour = await CCP_OPRP_DAL.saveTourSession(payload);
            const savedId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                ? QualityRajpura_Config.getTourId(savedTour)
                : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));

            const targetTourId = savedId || this.state.varTourID;
            if (targetTourId) {
                console.log(`Tour session successfully started with TourId: ${targetTourId}. Redirecting to dashboard...`);
                if (typeof HideLoader === "function") HideLoader();
                alert("Quality tour started successfully.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            throw new Error("Tour session was saved, but Tour ID was not returned by Dataverse.");
        } catch (err) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to start tour: ", err);
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Start Quality Tour";
            }
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(err, "initialize tour checklist")
                : ("Error initializing tour checklist: " + (err.message || "Please try again."));
            alert(msg);
        }
    },

    loadCyclesHistory: async function () {
        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (parentElement) parentElement.innerHTML = '';

        try {
            // Load child records from Dataverse
            const items = await CCP_OPRP_DAL.getChecklistItems(this.state.varTourID, this.state.category);
            
            // Group records by cycle key
            const grouped = {};
            items.forEach(item => {
                const cycleKey = item.cr3ea_cycle || "Cycle-1";
                const cycleNum = parseInt(cycleKey.replace("Cycle-", "")) || 1;
                
                if (!grouped[cycleNum]) {
                    grouped[cycleNum] = {
                        cycleNum: cycleNum,
                        productName: CCP_OPRP_Main.state.tourData?.cr3ea_runningvariety || "",
                        executiveName: CCP_OPRP_Main.state.qaExecutive || "",
                        location: CCP_OPRP_Main.state.selectedLine || "",
                        sessionTime: "",
                        response: "OK",
                        rows: []
                    };
                }
                
                if (item.cr3ea_productname) grouped[cycleNum].productName = item.cr3ea_productname;
                if (item.cr3ea_observedby) grouped[cycleNum].executiveName = item.cr3ea_observedby;
                else if (item.cr3ea_executivename) grouped[cycleNum].executiveName = item.cr3ea_executivename;
                if (item.cr3ea_location) grouped[cycleNum].location = item.cr3ea_location;
                if (item.cr3ea_tourstartdate) {
                    grouped[cycleNum].sessionTime = item.cr3ea_tourstartdate;
                } else if (item.createdon) {
                    grouped[cycleNum].sessionTime = item.createdon;
                }
                
                grouped[cycleNum].rows.push(item);
            });

            // Compute overall cycle response status cleanly
            Object.values(grouped).forEach(cGroup => {
                const shutdownRow = cGroup.rows.find(r => r.cr3ea_checkpointname === "Shutdown Closure");
                if (shutdownRow) {
                    cGroup.response = shutdownRow.cr3ea_acceptanceresponse || "Line Not Operational";
                } else {
                    const hasNotOk = cGroup.rows.some(r => {
                        const resp = r.cr3ea_acceptanceresponse || "";
                        const crit = r.cr3ea_criteria || "";
                        const devStatus = r.cr3ea_deviationstatus || "";
                        return ((resp.includes("Not Okay") || crit === "Not Okay") && devStatus !== "Closed") || (devStatus && devStatus !== "Closed");
                    });
                    cGroup.response = hasNotOk ? "Deviations Found" : "OK";
                }
            });

            const cyclesList = Object.values(grouped).sort((a, b) => a.cycleNum - b.cycleNum);
            const isTourCompleted = this.state.tourData?.cr3ea_status === "Completed" || 
                                     this.state.tourData?.cr3ea_status === "Success" || 
                                     this.state.tourData?.cr3ea_status === "Closed" ||
                                     this.state.tourData?.cr3ea_status === "Closed - Expired";
            
            const isProdOnly = this.state.isProdOnly;

            if (cyclesList.length > 0) {
                // Pre-populate state setup info from Cycle 1 so subsequent cycles inherit them
                const firstCycle = cyclesList[0];
                if (firstCycle.productName) this.state.product = firstCycle.productName;
                if (firstCycle.executiveName) this.state.qaExecutive = firstCycle.executiveName;
                if (firstCycle.location) this.state.selectedLine = firstCycle.location;

                let cyclesToRender = cyclesList;
                if (isProdOnly) {
                    // Production Executive: only see cycles with defects/deviations!
                    cyclesToRender = cyclesList.filter(cData => {
                        const status = CCP_OPRP_Checklist.getCycleStatus(cData);
                        const hasDeviations = (cData.rows || []).some(r => {
                            const resp = r.cr3ea_acceptanceresponse || "";
                            const crit = r.cr3ea_criteria || "";
                            const devStatus = r.cr3ea_deviationstatus || "";
                            return ((resp.includes("Not Okay") || crit === "Not Okay") && devStatus !== "Closed") || (devStatus && devStatus !== "Closed");
                        });
                        return hasDeviations || status === "Pending Production Action" || status === "Pending QA Re-Verification" || status === "Escalated";
                    });

                    if (cyclesToRender.length === 0) {
                        if (parentElement) {
                            parentElement.innerHTML = `
                                <div class="alert alert-success text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #bbf7d0; background-color: #f0fdf4; color: #166534; font-family: 'Outfit', sans-serif;">
                                    <h4 style="font-weight: 700; margin-bottom: 8px; font-size: 16px;">No Pending Deviations</h4>
                                    <p style="margin: 0; font-size: 13px;">No quality defects or deviations were recorded for this tour requiring Production corrective action.</p>
                                </div>
                            `;
                        }
                    }
                }

                // Self-heal parent tour process status if deviations exist and tour was left In Progress
                const hasPendingActionCycle = cyclesList.some(c => CCP_OPRP_Checklist.getCycleStatus(c) === "Pending Production Action");
                const hasPendingReverifyCycle = cyclesList.some(c => CCP_OPRP_Checklist.getCycleStatus(c) === "Pending QA Re-Verification");
                const currentProcStatus = this.state.tourData?.cr3ea_processstatus || "";
                if (!isTourCompleted) {
                    if (hasPendingActionCycle && currentProcStatus !== "Pending Production Action") {
                        if (this.state.tourData) this.state.tourData.cr3ea_processstatus = "Pending Production Action";
                        this.setRoleAndPermissions(this.state.tourData);
                        CCP_OPRP_DAL.updateParentTour(this.state.varTourID, { cr3ea_processstatus: "Pending Production Action" }).catch(() => {});
                    } else if (hasPendingReverifyCycle && currentProcStatus !== "Pending QA Re-Verification") {
                        if (this.state.tourData) this.state.tourData.cr3ea_processstatus = "Pending QA Re-Verification";
                        this.setRoleAndPermissions(this.state.tourData);
                        CCP_OPRP_DAL.updateParentTour(this.state.varTourID, { cr3ea_processstatus: "Pending QA Re-Verification" }).catch(() => {});
                    }
                }

                cyclesToRender.forEach(cData => {
                    CCP_OPRP_Checklist.renderCycleSection(cData.cycleNum, true, cData);
                });
                
                const lastCycle = cyclesList[cyclesList.length - 1];
                const lastStatus = CCP_OPRP_Checklist.getCycleStatus(lastCycle);
                const isLastCycleFinished = lastStatus !== "Checklist Filling" && 
                                            lastStatus !== "Checklist Filling - Paused" && 
                                            lastStatus !== "Metadata Setup" && 
                                            lastStatus !== "Upcoming";

                this.state.cycleCounter = Math.max(...cyclesList.map(c => c.cycleNum)) + 1;

                // Render next cycle slot ONLY for QA Executive and only if preceding cycles are finished and parent tour is open
                if (!isProdOnly && !isTourCompleted && isLastCycleFinished && this.state.canEditChecklist) {
                    CCP_OPRP_Checklist.renderCycleSection(this.state.cycleCounter, false);
                }
            } else {
                this.state.cycleCounter = 1;
                if (isTourCompleted && (this.state.tourData?.cr3ea_status === "Closed - Expired" || String(this.state.tourData?.cr3ea_status).includes("Expired"))) {
                    if (parentElement) {
                        parentElement.innerHTML = `
                            <div class="alert alert-danger text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #fecaca; background-color: #fee2e2; color: #b91c1c; font-family: sans-serif;">
                                <h4 style="font-weight: 700; margin-bottom: 8px;">Expired while In Progress / QA Process</h4>
                                <p style="margin: 0; font-size: 14px;">This checklist session was closed automatically because it expired before completion.</p>
                            </div>
                        `;
                    }
                } else if (!isTourCompleted && !isProdOnly) {
                    CCP_OPRP_Checklist.renderCycleSection(1, false);
                } else if (isProdOnly && parentElement) {
                    parentElement.innerHTML = `
                        <div class="alert alert-info text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #bfdbfe; background-color: #eff6ff; color: #1e40af; font-family: 'Outfit', sans-serif;">
                            <h4 style="font-weight: 700; margin-bottom: 8px; font-size: 16px;">Tour In Progress</h4>
                            <p style="margin: 0; font-size: 13px;">Awaiting QA Executive to perform checks. Any defect cycles will appear here for corrective action.</p>
                        </div>
                    `;
                }
            }
            
        } catch (e) {
            console.error("Failed to load cycles history: ", e);
            // Render at least Cycle-1 on error if not completed
            const isTourCompleted = this.state.tourData?.cr3ea_status === "Completed" || 
                                     this.state.tourData?.cr3ea_status === "Success" || 
                                     this.state.tourData?.cr3ea_status === "Closed" ||
                                     this.state.tourData?.cr3ea_status === "Closed - Expired";
            if (!isTourCompleted) {
                CCP_OPRP_Checklist.renderCycleSection(1, false);
            }
        }
    },

    getQueryStringParam: function (name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};
