// Setup and Session creation for Packaging Operations
console.log("Packaging Operations QA Request script loaded");

const PKGOPS_QARequest = {
    qaList: [],

    // Initialize the setup page
    init: async function () {
        try {
            // Load QA Executives from SharePoint Config List
            const configs = await PKGOPS_DAL.getConfig();
            this.qaList = configs.filter(c => c.ConfigType === "QA User" || c.ConfigType === "QA HOD");
        } catch (error) {
            console.error("Failed to load QA config from SharePoint list:", error);
        }

        // Fallback to mock QA users if SharePoint query fails
        if (!this.qaList || this.qaList.length === 0) {
            console.log("Populating mock QA users for development fallback");
            this.qaList = [
                {
                    Id: 1,
                    ConfigType: "QA User",
                    AssignedUser: {
                        results: [
                            { Id: 101, Title: "Mishab Muhammad", EMail: "mishab@example.com" },
                            { Id: 102, Title: "Gokul K", EMail: "gokul@example.com" }
                        ]
                    }
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

        // Set Shift
        const storedShift = localStorage.getItem("shiftValue") || sessionStorage.getItem("shiftValue");
        const shiftSelect = document.getElementById("setup-shift");
        if (shiftSelect && storedShift) {
            shiftSelect.value = storedShift;
        }

        // Default Shift Executive Production to logged-in user name
        const execProdInput = document.getElementById("setup-exec-prod");
        if (execProdInput && !execProdInput.value) {
            const userDisplayName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : (typeof EmployeeName !== 'undefined' ? EmployeeName : "Admin User");
            execProdInput.value = userDisplayName;
        }

        this.populateQASelection();

        // Initialize Select2 on ALL selects with .form-select class
        if (window.jQuery && $.fn.select2) {
            $('select.form-select').each(function () {
                $(this).select2({
                    dropdownParent: $(this).parent()
                });
            });
        }
    },

    // Populate the QA selection select tag
    populateQASelection: function () {
        const qaSelect = document.getElementById("setup-qa-executive");
        if (!qaSelect) return;

        qaSelect.innerHTML = `<option value="">Select QA Executive</option>`;
        this.qaList.forEach(item => {
            if (item.AssignedUser && item.AssignedUser.results) {
                item.AssignedUser.results.forEach(user => {
                    qaSelect.innerHTML += `<option value="${user.Id}" data-email="${user.EMail}" data-rowid="${item.Id}">${user.Title}</option>`;
                });
            }
        });

        // If active session exists, pre-select
        if (PKGOPS_StateMachine.currentSession) {
            const assignedQa = PKGOPS_StateMachine.currentSession.cr3ea_assigned_qa || "";
            if (assignedQa) {
                const lowerAssignedQa = assignedQa.toLowerCase().trim();
                for (let i = 0; i < qaSelect.options.length; i++) {
                    const opt = qaSelect.options[i];
                    const optEmail = opt.getAttribute("data-email") || "";
                    if (optEmail.toLowerCase().trim() === lowerAssignedQa) {
                        qaSelect.value = opt.value;
                        break;
                    }
                }
            }
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
        const assignedQaEmail = selectedOption.getAttribute("data-email");
        const configRowId = selectedOption.getAttribute("data-rowid");

        // Escalation managers
        const configRow = this.qaList.find(c => c.Id == configRowId);
        let escalationEmails = [];
        if (configRow && configRow.EscalationManager && configRow.EscalationManager.results) {
            escalationEmails = configRow.EscalationManager.results.map(em => em.EMail);
        }

        const site = document.getElementById("setup-site")?.value || "Rajpura";
        const line = document.getElementById("setup-line")?.value || "Line 1";
        const shift = document.getElementById("setup-shift")?.value || "Shift 1";
        const prodExecName = document.getElementById("setup-exec-prod")?.value || "Unknown";
        const pkgOpsType = document.getElementById("setup-pkgops-type")?.value || "Temperatures & Humidity";

        const currentExecEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? String(_spPageContextInfo.userEmail).trim() : "";
        const productionExecEmailOrName = currentExecEmail || prodExecName;

        const tourStartDate = new Date().toISOString();
        const titleStr = `PkgOps_${pkgOpsType.replace(/[^a-zA-Z0-9]/g, "")}_${line.replace(/\s+/g, "")}_${moment().format("DD-MM-YYYY_HHmm")}`;

        const tourData = {
            cr3ea_plantid: QualityRajpura_Config.PLANT_ID,
            cr3ea_observedby: productionExecEmailOrName,
            cr3ea_tourstartdate: tourStartDate,
            cr3ea_status: "QA In Progress",
            cr3ea_processstatus: "QA In Progress",
            cr3ea_title: titleStr,
            cr3ea_tourby: assignedQaEmail,
            cr3ea_shiftexecutiveproduction: productionExecEmailOrName,
            cr3ea_lineno: line,
            cr3ea_shift: shift,
            cr3ea_assigned_qa: assignedQaEmail,
            cr3ea_escalation_contacts: escalationEmails.join(","),
            cr3ea_islineclear: false,
            cr3ea_pkgops_type: pkgOpsType
        };

        try {
            if (typeof ShowLoader === "function") ShowLoader();
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
            
            // Redirect to active tour view
            window.location.href = `?TourId=${tourId}`;
        } catch (e) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to start Packaging Operations tour:", e);
            alert("Failed to start Packaging Operations session. Please try again.");
        }
    }
};
