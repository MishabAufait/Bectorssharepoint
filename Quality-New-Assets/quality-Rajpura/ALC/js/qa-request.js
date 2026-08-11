// Steps 1 to 5: QA Requesting, Timer, and Escalation Logic
console.log("ALC QA Request script loaded");

const ALC_QARequest = {
    qaList: [],
    timerInterval: null,
    escalationTimeLimit: 5 * 60, // 5 minutes in seconds

    // Initialize Step 1
    init: async function () {
        try {
            // Load QA Executives from SharePoint Config List
            const configs = await ALC_DAL.getConfig();
            this.qaList = configs.filter(c => c.ConfigType === "QA User");
        } catch (error) {
            console.error("Failed to load QA config from SharePoint list:", error);
        }

        // Fallback to mock QA users if SharePoint query failed or returned empty results
        if (!this.qaList || this.qaList.length === 0) {
            console.log("Populating mock QA users for preview/development fallback");
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
        
        // Populate current Date & Time values on initialization
        const todayDate = moment().format("DD/MM/YYYY");
        const todayTime = moment().format("hh:mm A");

        const headerDate = document.getElementById("header-date");
        if (headerDate) headerDate.value = todayDate;

        const headerTime = document.getElementById("header-time");
        if (headerTime) headerTime.value = todayTime;

        const currentDayEl = document.getElementById("currentDay");
        if (currentDayEl) currentDayEl.innerText = `• ${todayDate}`;

        // Load pre-selected shift value from Welcome page popup storage
        const storedShift = localStorage.getItem("shiftValue") || sessionStorage.getItem("shiftValue");
        const shiftSelect = document.getElementById("header-shift");
        if (shiftSelect && storedShift) {
            shiftSelect.value = storedShift;
        }

        const shiftBadgeEl = document.getElementById("shiftBadge");
        if (shiftSelect) {
            if (shiftBadgeEl) shiftBadgeEl.innerText = shiftSelect.value || "Shift 1";
            // Dynamically update top-bar shift badge when user changes shift selection
            $(shiftSelect).on('change', function () {
                if (shiftBadgeEl) shiftBadgeEl.innerText = this.value || "Shift 1";
            });
        }

        // Set default Shift Executive Production to the logged-in SharePoint user
        const execProdInput = document.getElementById("header-exec-prod");
        if (execProdInput && !execProdInput.value) {
            const userDisplayName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : (typeof EmployeeName !== 'undefined' ? EmployeeName : "");
            execProdInput.value = userDisplayName;
        }

        this.populateQASelection();
    },

    // Populate dropdown with QA Executives
    populateQASelection: function () {
        const qaSelect = document.getElementById("select-qa-executive");
        if (!qaSelect) return;

        qaSelect.innerHTML = `<option value="">Select QA Executive</option>`;
        this.qaList.forEach(item => {
            if (item.AssignedUser && item.AssignedUser.results) {
                // Support multiple assigned users per config row
                item.AssignedUser.results.forEach(user => {
                    qaSelect.innerHTML += `<option value="${user.Id}" data-email="${user.EMail}" data-rowid="${item.Id}">${user.Title}</option>`;
                });
            }
        });

        // Set the selected value if a session is loaded
        const currentSession = ALC_StateMachine.currentSession;
        if (currentSession) {
            const assignedQa = currentSession.cr3ea_assigned_qa || "";
            const qaExecRaw = currentSession.cr3ea_tourby || currentSession.cr3ea_shiftexecutivequality || currentSession.cr3ea_assigned_qa || "";
            let qaExec = qaExecRaw;
            if (qaExecRaw && qaExecRaw.includes("@") && typeof ALC_StateMachine !== 'undefined' && typeof ALC_StateMachine.resolveQaNameFromEmail === 'function') {
                qaExec = ALC_StateMachine.resolveQaNameFromEmail(qaExecRaw);
            }

            if (assignedQa) {
                const lowerAssignedQa = assignedQa.toLowerCase().trim();
                let foundOption = false;
                for (let i = 0; i < qaSelect.options.length; i++) {
                    const opt = qaSelect.options[i];
                    const optEmail = opt.getAttribute("data-email") || "";
                    if (optEmail.toLowerCase().trim() === lowerAssignedQa) {
                        qaSelect.value = opt.value;
                        foundOption = true;
                        break;
                    }
                }
                if (!foundOption && qaExec) {
                    const lowerQaExec = qaExec.toLowerCase().trim();
                    for (let i = 0; i < qaSelect.options.length; i++) {
                        const opt = qaSelect.options[i];
                        if (opt.text.toLowerCase().trim() === lowerQaExec || opt.value === assignedQa) {
                            qaSelect.value = opt.value;
                            foundOption = true;
                            break;
                        }
                    }
                }
            }
        }

        // Initialize Select2 on ALL selects with .form-select class
        if (window.jQuery && $.fn.select2) {
            $('select.form-select').each(function () {
                $(this).select2({
                    dropdownParent: $(this).parent()
                });
            });
        }
    },

    // Step 2: Production Submits Request
    submitRequest: async function () {
        const qaSelect = document.getElementById("select-qa-executive");
        if (!qaSelect || !qaSelect.value) {
            alert("Please select a QA Executive to assign.");
            return;
        }

        const selectedOption = qaSelect.options[qaSelect.selectedIndex];
        const assignedQaEmail = selectedOption.getAttribute("data-email");
        const assignedQaName = selectedOption.text;
        const configRowId = selectedOption.getAttribute("data-rowid");

        // Find escalation managers for the selected QA Config row
        const configRow = this.qaList.find(c => c.Id == configRowId);
        let escalationEmails = [];
        if (configRow && configRow.EscalationManager && configRow.EscalationManager.results) {
            escalationEmails = configRow.EscalationManager.results.map(em => em.EMail);
        }

        const productionExecName = document.getElementById("header-exec-prod")?.value || "Unknown";
        const shift = document.getElementById("header-shift")?.value || "Shift 1";
        const line = document.getElementById("header-line")?.value || "Line 1";
        const prevProduct = document.getElementById("header-prev-product")?.value || "";
        const newProduct = document.getElementById("header-new-product")?.value || "";
        const requestTime = new Date().toISOString();

        const headerData = {
            cr3ea_plantid: QualityRajpura_Config.PLANT_ID, // Rajpura Plant Id
            cr3ea_observedby: productionExecName,
            cr3ea_tourstartdate: requestTime,
            cr3ea_status: "Pending QA",
            cr3ea_processstatus: "Pending QA",
            cr3ea_title: "ALC_" + moment().format("MM-DD-YYYY_HH:mm"),
            cr3ea_tourby: assignedQaEmail, // Storing QA Email in tourby (must be unique)
            cr3ea_shiftexecutiveproduction: productionExecName,
            cr3ea_lineno: line,
            cr3ea_shift: shift,
            cr3ea_previousrunningvariety: prevProduct,
            cr3ea_runningvariety: newProduct,
            cr3ea_assigned_qa: assignedQaEmail,
            cr3ea_request_time: requestTime,
            cr3ea_escalation_contacts: escalationEmails.join(","),
            cr3ea_islineclear: false // New request starts as Not Clear (No)
        };

        if (ALC_StateMachine.currentTourId) {
            headerData.cr3ea_prod_qualitytourid = ALC_StateMachine.currentTourId;
        }

        // Cache escalation details locally
        this.escalationEmailsResolved = escalationEmails;
        this.assignedQaEmailResolved = assignedQaEmail;

        try {
            ShowLoader();

            // Validation: Check for ongoing uncleared sessions on this same line today
            const sessions = await ALC_DAL.getActiveSessions();
            const todayStr = moment().format("YYYY-MM-DD");
            
            const unclearedSession = sessions.find(s => {
                if (ALC_StateMachine.currentTourId && s.cr3ea_prod_qualitytourid === ALC_StateMachine.currentTourId) {
                    return false;
                }
                const isSameLine = s.cr3ea_lineno === line;
                const isClearedVal = s.cr3ea_islineclear;
                const status = s.cr3ea_processstatus || s.cr3ea_status || "";
                const isCleared = isClearedVal === true || 
                                  isClearedVal === "true" || 
                                  isClearedVal === 1 || 
                                  isClearedVal === "1" || 
                                  isClearedVal === "Yes" || 
                                  status === "Completed" || 
                                  status === "Closed" || 
                                  status === "Closed - Expired" || 
                                  status === "Success";

                const tourDate = s.cr3ea_tourstartdate || s.createdon;
                const isToday = tourDate && (moment(tourDate).local().format("YYYY-MM-DD") === todayStr);

                return isSameLine && !isCleared && isToday;
            });

            if (unclearedSession) {
                HideLoader();
                const tourTimeStr = unclearedSession.cr3ea_tourstartdate ? moment(unclearedSession.cr3ea_tourstartdate).format("hh:mm A") : "earlier";
                alert(`Cannot start a new tour on ${line}. The previous tour on this line (started at ${tourTimeStr}) is still pending line clearance.`);
                return;
            }

            const session = await ALC_DAL.saveSession(headerData);
            
            // Trigger Power Automate notification
            try {
                if (typeof ALC_Notification !== "undefined") {
                    await ALC_Notification.sendSubmitRequest(session, assignedQaEmail, escalationEmails);
                }
            } catch (err) {
                console.error("Failed to trigger submit ALC notification:", err);
            }

            HideLoader();
            alert("Request submitted to QA successfully!");
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
            window.location.href = homeUrl;
        } catch (error) {
            HideLoader();
            alert("Failed to submit request: " + error.message);
        }
    },

    // Step 3 & 5: Timer & Escalation countdown
    startTimer: function (requestTimeString, qaName) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timerDisplay = document.getElementById("escalation-timer");
        const requestTime = new Date(requestTimeString).getTime();

        this.timerInterval = setInterval(async () => {
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - requestTime) / 1000);
            const remainingSeconds = this.escalationTimeLimit - elapsedSeconds;

            if (remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                if (timerDisplay) timerDisplay.innerHTML = `<span class="text-danger font-weight-bold">Escalated to Next Level</span>`;
                
                await this.resolveEscalationContacts(qaName);
                this.triggerEscalation();
            } else {
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                if (timerDisplay) {
                    timerDisplay.innerHTML = `Time remaining for QA acceptance: <strong>${minutes}:${seconds < 10 ? '0' : ''}${seconds}</strong>`;
                }
            }
        }, 1000);
    },

    resolveEscalationContacts: async function (qaName) {
        if (this.escalationEmailsResolved && this.escalationEmailsResolved.length > 0) {
            return this.escalationEmailsResolved;
        }
        
        try {
            const configList = await ALC_DAL.getConfig();
            const configRow = configList.find(c => c.Title === qaName || c.AssignedUser === qaName);
            if (configRow && configRow.EscalationManager && configRow.EscalationManager.results) {
                this.escalationEmailsResolved = configRow.EscalationManager.results.map(em => em.EMail);
                return this.escalationEmailsResolved;
            }
        } catch (e) {
            console.error("Failed to dynamically resolve escalation contacts:", e);
        }
        return [];
    },

    // Step 5: Escalation handler
    triggerEscalation: function () {
        console.warn("QA did not accept request within 5 minutes. Escalating...");
        const escalationPanel = document.getElementById("escalation-alert-panel");
        if (escalationPanel) {
            escalationPanel.style.display = "block";
        }
        
        // Custom visual notification state update
        if (typeof window.onEscalationTriggered === "function") {
            window.onEscalationTriggered();
        }
    },

    // Step 4: QA accepts the request
    acceptRequest: async function () {
        if (!ALC_StateMachine.currentTourId) {
            alert("No active session ID found.");
            return;
        }

        let qaEmail = typeof currentUserEmail !== "undefined" ? currentUserEmail : "";
        if (!qaEmail && typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) {
            qaEmail = _spPageContextInfo.userEmail;
        }
        if (!qaEmail && typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) {
            qaEmail = _spPageContextInfo.userDisplayName;
        }
        if (!qaEmail) {
            // Fallback to cached assigned QA email
            qaEmail = this.assignedQaEmailResolved || "";
        }
        if (!qaEmail) {
            // Fallback if still empty
            qaEmail = "QA Executive";
        }

        const updateData = {
            cr3ea_prod_qualitytourid: ALC_StateMachine.currentTourId,
            cr3ea_status: "QA In Progress",
            cr3ea_processstatus: "QA In Progress",
            cr3ea_tourby: qaEmail
        };

        try {
            ShowLoader();
            await ALC_DAL.saveSession(updateData);
            HideLoader();
            
            if (this.timerInterval) clearInterval(this.timerInterval);
            
            // Advance state
            ALC_StateMachine.transitionTo(ALC_STATES.QA_CHECKLIST);
        } catch (error) {
            HideLoader();
            alert("Failed to accept request: " + error.message);
        }
    }
};
