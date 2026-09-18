// Setup and Session creation for Packaging Operations
console.log("Packaging Operations QA Request script loaded");

const PKGOPS_QARequest = {
    qaList: [],
    prodList: [],

    // Initialize the setup page
    init: async function () {
        try {
            // Load QA & Production Executives from SharePoint Config List
            const configs = await PKGOPS_DAL.getConfig();
            this.qaList = (configs || []).filter(c => {
                const type = (c.ConfigType || c.configType || "").toLowerCase().trim();
                const title = (c.Title || c.title || "").toLowerCase().trim();
                // Match QA User, QA HOD, QA Executive, QA Operator, etc.
                if (type.includes("qa") || title.includes("qa")) {
                    return !type.includes("product master") && !type.includes("sku master");
                }
                return false;
            });

            this.prodList = (configs || []).filter(c => {
                const type = (c.ConfigType || c.configType || "").toLowerCase().trim();
                const title = (c.Title || c.title || "").toLowerCase().trim();
                // Match Production Incharge, Production Executive, Production User, etc.
                if (type.includes("prod") || type.includes("incharge") || title.includes("prod") || title.includes("incharge")) {
                    return !type.includes("product master") && !type.includes("sku master");
                }
                return false;
            });

            console.log(`PKGOPS_QARequest: Filtered ${this.qaList.length} QA and ${this.prodList.length} Production config rows from SharePoint list.`);
        } catch (error) {
            console.error("Failed to load QA / Production config from SharePoint list:", error);
        }

        // Check if we got any assigned users in the filtered QA list
        const totalQaUsersFound = (this.qaList || []).reduce((acc, item) => {
            const raw = item.AssignedUser?.results || item.assignedUsers || item.Assigned_x0020_User?.results || [];
            return acc + (Array.isArray(raw) ? raw.length : (raw ? 1 : 0));
        }, 0);

        // Fallback to mock QA users if query failed or returned no users
        if (!this.qaList || this.qaList.length === 0 || totalQaUsersFound === 0) {
            console.log("Populating mock QA users for development fallback");
            this.qaList = [
                {
                    Id: 1,
                    id: 1,
                    Title: "QA User",
                    title: "QA User",
                    ConfigType: "QA User",
                    configType: "QA User",
                    Plant: "Rajpura",
                    AssignedUser: {
                        results: [
                            { Id: 101, Title: "Mishab Muhammed", EMail: "mishab@bectorfoods.com" },
                            { Id: 108, Title: "Gokul K", EMail: "gokul.k@bectorfoods.com" },
                            { Id: 112, Title: "Babifas P", EMail: "babifas.p@bectorfoods.com" }
                        ]
                    },
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectorfoods.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectorfoods.com" },
                        { id: 112, title: "Babifas P", email: "babifas.p@bectorfoods.com" }
                    ]
                }
            ];
        }

        // Check if we got any assigned users in the filtered Production list
        const totalProdUsersFound = (this.prodList || []).reduce((acc, item) => {
            const raw = item.ProductionIncharge?.results || item.productionIncharges || item.AssignedUser?.results || item.assignedUsers || [];
            return acc + (Array.isArray(raw) ? raw.length : (raw ? 1 : 0));
        }, 0);

        // Fallback to mock Production users if query failed or returned no users
        if (!this.prodList || this.prodList.length === 0 || totalProdUsersFound === 0) {
            console.log("Populating mock Production users for development fallback");
            this.prodList = [
                {
                    Id: 2,
                    id: 2,
                    Title: "Production Incharge",
                    title: "Production Incharge",
                    ConfigType: "Production Incharge",
                    configType: "Production Incharge",
                    Plant: "Rajpura",
                    AssignedUser: {
                        results: [
                            { Id: 101, Title: "Mishab Muhammed", EMail: "mishab@bectorfoods.com" },
                            { Id: 108, Title: "Gokul K", EMail: "gokul.k@bectorfoods.com" },
                            { Id: 112, Title: "Babifas P", EMail: "babifas.p@bectorfoods.com" }
                        ]
                    },
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectorfoods.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectorfoods.com" },
                        { id: 112, title: "Babifas P", email: "babifas.p@bectorfoods.com" }
                    ],
                    ProductionIncharge: {
                        results: [
                            { Id: 101, Title: "Mishab Muhammed", EMail: "mishab@bectorfoods.com" },
                            { Id: 108, Title: "Gokul K", EMail: "gokul.k@bectorfoods.com" },
                            { Id: 112, Title: "Babifas P", EMail: "babifas.p@bectorfoods.com" }
                        ]
                    },
                    productionIncharges: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectorfoods.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectorfoods.com" },
                        { id: 112, title: "Babifas P", email: "babifas.p@bectorfoods.com" }
                    ]
                }
            ];
        }

        // Set Date and Time
        const todayDate = moment().format("DD/MM/YYYY");
        const todayTime = moment().format("hh:mm A");

        const setupDateInput = document.getElementById("setup-date");
        if (setupDateInput) setupDateInput.value = todayDate;

        const setupTimeInput = document.getElementById("setup-time");
        if (setupTimeInput) setupTimeInput.value = todayTime;

        // Set Shift Executive (logged-in user who starts the tour)
        const shiftExecInput = document.getElementById("setup-shift-exec");
        const currentUserName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? _spPageContextInfo.userDisplayName 
            : (typeof EmployeeName !== 'undefined' && EmployeeName ? EmployeeName : (typeof currentUser !== "undefined" ? currentUser : "Shift Executive"));
        if (shiftExecInput) {
            shiftExecInput.value = currentUserName;
        }

        // Set Shift
        const storedShift = localStorage.getItem("shiftValue") || sessionStorage.getItem("shiftValue");
        const shiftSelect = document.getElementById("setup-shift");
        if (shiftSelect && storedShift) {
            shiftSelect.value = storedShift;
        }

        this.populateQASelection();
        this.populateProductionSelection();

        // Initialize Select2 on ALL selects with .form-select class
        if (window.jQuery && $.fn.select2) {
            $('select.form-select').each(function () {
                if (!$(this).hasClass("select2-hidden-accessible")) {
                    $(this).select2({
                        dropdownParent: $(this).parent()
                    });
                }
            });
        }
    },

    // Populate the QA selection select tag
    populateQASelection: function () {
        const qaSelect = document.getElementById("setup-qa-executive");
        if (!qaSelect) return;

        const uniqueUsers = [];
        const seenKeys = new Set();

        const addUser = (u, rowId) => {
            if (!u) return;
            const title = (u.Title || u.title || "").trim();
            const email = (u.EMail || u.email || u.Email || "").trim();
            const id = u.Id || u.id || u.spUserId || "";
            if (!title) return;
            const key = (email || title).toLowerCase();
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            uniqueUsers.push({ id, title, email, rowId });
        };

        (this.qaList || []).forEach(item => {
            const rowId = item.Id || item.id || "";
            const raw = item.AssignedUser || item.Assigned_x0020_User || item.assignedUsers || item.QAExecutive || item.QA_x0020_Executive || item.AssignedQA;
            if (!raw) return;
            if (raw.results && Array.isArray(raw.results)) {
                raw.results.forEach(u => addUser(u, rowId));
            } else if (Array.isArray(raw)) {
                raw.forEach(u => addUser(u, rowId));
            } else if (typeof raw === "object") {
                addUser(raw, rowId);
            }
        });

        // Rebuild option tags
        qaSelect.innerHTML = `<option value="">Select QA Executive</option>`;
        uniqueUsers.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.email || u.id || u.title;
            opt.setAttribute("data-email", u.email || "");
            opt.setAttribute("data-rowid", u.rowId || "");
            opt.setAttribute("data-id", u.id || "");
            opt.textContent = u.title;
            qaSelect.appendChild(opt);
        });

        console.log(`PKGOPS_QARequest: Populated ${uniqueUsers.length} QA Executive options into select element.`);

        // If active session exists, pre-select
        if (PKGOPS_StateMachine.currentSession) {
            const assignedQa = (PKGOPS_StateMachine.currentSession.cr3ea_assigned_qa || PKGOPS_StateMachine.currentSession.cr3ea_tourby || "").toLowerCase().trim();
            if (assignedQa) {
                for (let i = 0; i < qaSelect.options.length; i++) {
                    const opt = qaSelect.options[i];
                    const optEmail = (opt.getAttribute("data-email") || "").toLowerCase().trim();
                    const optVal = (opt.value || "").toLowerCase().trim();
                    const optText = (opt.textContent || "").toLowerCase().trim();
                    if ((optEmail && optEmail === assignedQa) || optVal === assignedQa || optText === assignedQa) {
                        qaSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }

        // Trigger Select2 refresh if select2 is initialized
        if (window.jQuery && $.fn.select2 && $(qaSelect).hasClass("select2-hidden-accessible")) {
            $(qaSelect).trigger("change.select2");
        }
    },

    // Populate the Shift Executive Production select tag
    populateProductionSelection: function () {
        const prodSelect = document.getElementById("setup-exec-prod");
        if (!prodSelect) return;

        const uniqueUsers = [];
        const seenKeys = new Set();

        const addUser = (u, rowId) => {
            if (!u) return;
            const title = (u.Title || u.title || "").trim();
            const email = (u.EMail || u.email || u.Email || "").trim();
            const id = u.Id || u.id || u.spUserId || "";
            if (!title) return;
            const key = (email || title).toLowerCase();
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            uniqueUsers.push({ id, title, email, rowId });
        };

        (this.prodList || []).forEach(item => {
            const rowId = item.Id || item.id || "";
            const raw = item.ProductionIncharge || item.Production_x0020_Incharge || item.productionIncharges || item.AssignedUser || item.Assigned_x0020_User || item.assignedUsers || item.ProductionExecutive;
            if (!raw) return;
            if (raw.results && Array.isArray(raw.results)) {
                raw.results.forEach(u => addUser(u, rowId));
            } else if (Array.isArray(raw)) {
                raw.forEach(u => addUser(u, rowId));
            } else if (typeof raw === "object") {
                addUser(raw, rowId);
            }
        });

        // Also ensure current logged in user is included in the list for ease of assignment
        const currentUserName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) 
            ? _spPageContextInfo.userDisplayName 
            : (typeof EmployeeName !== 'undefined' ? EmployeeName : "");
        const currentUserEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) 
            ? String(_spPageContextInfo.userEmail).trim() 
            : "";
        if (currentUserName) {
            addUser({ Title: currentUserName, EMail: currentUserEmail, Id: 999 }, "CURRENT_USER");
        }

        // Rebuild option tags
        prodSelect.innerHTML = `<option value="">Select Production Executive</option>`;
        uniqueUsers.forEach(u => {
            const opt = document.createElement("option");
            opt.value = u.email || u.title;
            opt.setAttribute("data-email", u.email || "");
            opt.setAttribute("data-rowid", u.rowId || "");
            opt.setAttribute("data-id", u.id || "");
            opt.textContent = u.title;
            prodSelect.appendChild(opt);
        });

        console.log(`PKGOPS_QARequest: Populated ${uniqueUsers.length} Production Executive options into select element.`);

        // Pre-selection logic: active session value > current logged in user > first option
        let preSelected = false;
        if (PKGOPS_StateMachine.currentSession) {
            const savedProd = (PKGOPS_StateMachine.currentSession.cr3ea_shiftexecutiveproduction || PKGOPS_StateMachine.currentSession.cr3ea_observedby || "").toLowerCase().trim();
            if (savedProd) {
                for (let i = 0; i < prodSelect.options.length; i++) {
                    const opt = prodSelect.options[i];
                    const optEmail = (opt.getAttribute("data-email") || "").toLowerCase().trim();
                    const optVal = (opt.value || "").toLowerCase().trim();
                    const optText = (opt.textContent || "").toLowerCase().trim();
                    if ((optEmail && optEmail === savedProd) || optVal === savedProd || optText === savedProd) {
                        prodSelect.selectedIndex = i;
                        preSelected = true;
                        break;
                    }
                }
            }
        }

        if (!preSelected && currentUserName) {
            for (let i = 0; i < prodSelect.options.length; i++) {
                const opt = prodSelect.options[i];
                const optText = (opt.textContent || "").toLowerCase().trim();
                const optEmail = (opt.getAttribute("data-email") || "").toLowerCase().trim();
                if (optText === currentUserName.toLowerCase() || (currentUserEmail && optEmail === currentUserEmail.toLowerCase())) {
                    prodSelect.selectedIndex = i;
                    break;
                }
            }
        }

        // Trigger Select2 refresh if select2 is initialized
        if (window.jQuery && $.fn.select2 && $(prodSelect).hasClass("select2-hidden-accessible")) {
            $(prodSelect).trigger("change.select2");
        }
    },

    // Create new parent Quality Tour session
    startQualityTour: async function () {
        const qaSelect = document.getElementById("setup-qa-executive");
        if (!qaSelect || !qaSelect.value) {
            alert("Please select a QA Executive to assign.");
            return;
        }

        const selectedOption = qaSelect.options[qaSelect.selectedIndex];
        const assignedQaEmail = selectedOption.getAttribute("data-email") || selectedOption.value || selectedOption.textContent || "";
        const configRowId = selectedOption.getAttribute("data-rowid");

        // Shift Executive (logged-in user starting tour)
        const shiftExecName = document.getElementById("setup-shift-exec")?.value || 
            ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName : "Shift Executive");

        // Production Executive selection
        const prodSelect = document.getElementById("setup-exec-prod");
        let productionExecEmailOrName = "";
        if (prodSelect) {
            if (prodSelect.tagName === "SELECT" && prodSelect.selectedIndex >= 0) {
                const opt = prodSelect.options[prodSelect.selectedIndex];
                productionExecEmailOrName = opt.getAttribute("data-email") || opt.value || opt.textContent || "";
            } else {
                productionExecEmailOrName = prodSelect.value || "";
            }
        }
        if (!productionExecEmailOrName) {
            alert("Please select a Production Executive.");
            return;
        }

        // Escalation managers
        const configRow = (this.qaList || []).find(c => (c.Id == configRowId || c.id == configRowId));
        let escalationEmails = [];
        if (configRow) {
            const mgrs = configRow.EscalationManager?.results || configRow.escalationManagers || [];
            if (Array.isArray(mgrs)) {
                escalationEmails = mgrs.map(em => em.EMail || em.email).filter(Boolean);
            }
        }

        const site = document.getElementById("setup-site")?.value || "Rajpura";
        const line = document.getElementById("setup-line")?.value || "Line 1";
        const shift = document.getElementById("setup-shift")?.value || "Shift 1";
        const pkgOpsType = document.getElementById("setup-pkgops-type")?.value || "Temperatures & Humidity";

        const tourStartDate = new Date().toISOString();
        const titleStr = `PkgOps_${pkgOpsType.replace(/[^a-zA-Z0-9]/g, "")}_${line.replace(/\s+/g, "")}_${moment().format("DD-MM-YYYY_HHmm")}`;

        const tourData = {
            cr3ea_plantid: QualityRajpura_Config.PLANT_ID,
            cr3ea_observedby: shiftExecName || productionExecEmailOrName,
            cr3ea_shiftexecutive: shiftExecName,
            cr3ea_shiftexecutiveproduction: productionExecEmailOrName,
            cr3ea_tourstartdate: tourStartDate,
            cr3ea_status: "QA In Progress",
            cr3ea_processstatus: "QA In Progress",
            cr3ea_title: titleStr,
            cr3ea_tourby: assignedQaEmail,
            cr3ea_lineno: line,
            cr3ea_shift: shift,
            cr3ea_assigned_qa: assignedQaEmail,
            cr3ea_escalation_contacts: escalationEmails.join(","),
            cr3ea_islineclear: false,
            cr3ea_pkgops_type: pkgOpsType
        };

        try {
            if (typeof ShowLoader === "function") ShowLoader();

            // Check if active session already exists for this line and type today and prompt for override
            const token = await PKGOPS_DAL.getAccessToken();
            const proceed = await QualityRajpura_Config.checkAndPromptLineOverride({
                moduleKey: "PKGOPS",
                line: line,
                subType: pkgOpsType,
                currentTourId: null,
                token: token
            });
            if (!proceed) {
                if (typeof HideLoader === "function") HideLoader();
                return;
            }

            console.log("Saving Parent Tour session:", tourData);
            
            const savedTour = await PKGOPS_DAL.saveTour(tourData);
            const tourId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                ? QualityRajpura_Config.getTourId(savedTour)
                : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));
            
            // Trigger notification
            if (typeof ALC_Notification !== "undefined") {
                await ALC_Notification.sendSubmitRequest(savedTour, assignedQaEmail, escalationEmails);
            }

            if (typeof HideLoader === "function") HideLoader();
            
            alert("Quality Tour initiated and submitted to QA successfully!");

            // Redirect to dashboard like in ALC
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            } else {
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = homeUrl;
            }
        } catch (e) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to start Packaging Operations tour:", e);
            const msg = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(e, "start Packaging Operations session")
                : `Failed to start Packaging Operations session: ${e.message || e}`;
            alert(msg);
        }
    }
};
