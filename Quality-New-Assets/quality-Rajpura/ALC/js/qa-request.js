// Steps 1 to 5: QA Requesting, Timer, and Escalation Logic
console.log("ALC QA Request script loaded");

const ALC_QARequest = {
    qaList: [],
    timerInterval: null,
    escalationTimeLimit: 5 * 60, // 5 minutes in seconds

    // Initialize Step 1
    lines: [],
    shifts: [],
    products: [],
    qaMatrix: [],
    escalationEmailsResolved: [],
    assignedQaEmailResolved: "",

    // Initialize Step 1
    init: async function () {
        try {
            // Load master datasets from SharePoint Config List
            const [lines, shifts, products, qaMatrix] = await Promise.all([
                ALC_DAL.getLines(),
                ALC_DAL.getShifts(),
                ALC_DAL.getProducts(),
                ALC_DAL.getQaShiftMatrix()
            ]);
            this.lines = lines || [];
            this.shifts = shifts || [];
            this.products = products || [];
            this.qaMatrix = qaMatrix || [];
            this.qaList = this.qaMatrix;
        } catch (error) {
            console.error("Failed to load ALC master configs from SharePoint list:", error);
            this.lines = [];
            this.shifts = [];
            this.products = [];
            this.qaMatrix = [];
            this.qaList = [];
        }

        // Populate current Date & Time values on initialization
        const todayDate = moment().format("DD/MM/YYYY");
        const todayTime = moment().format("hh:mm A");

        const headerDate = document.getElementById("header-date");
        if (headerDate) headerDate.value = todayDate;

        const headerTime = document.getElementById("header-time");
        if (headerTime) headerTime.value = todayTime;

        const currentDayEl = document.getElementById("currentDay");
        if (currentDayEl) currentDayEl.innerText = todayDate;

        // Populate Line dropdown with format: ${Title} - ${LineName} (e.g. Line No. 1 - HAAS)
        const lineSelect = document.getElementById("header-line");
        if (lineSelect) {
            lineSelect.innerHTML = `<option value="">Select Line</option>`;
            this.lines.forEach(l => {
                const lineFormatted = (l.LineName && l.LineName.trim()) ? `${l.Title} - ${l.LineName}` : l.Title;
                lineSelect.innerHTML += `<option value="${lineFormatted}" data-title="${l.Title}" data-linename="${l.LineName || ''}">${lineFormatted}</option>`;
            });
        }

        // Populate Shift dropdown with format: Shift ${ShiftCode} - ${ShiftName} (${ShiftStart} - ${ShiftEnd})
        const shiftSelect = document.getElementById("header-shift");
        if (shiftSelect) {
            shiftSelect.innerHTML = `<option value="">Select Shift</option>`;
            this.shifts.forEach(s => {
                const timeStr = (s.ShiftStart && s.ShiftEnd) ? ` (${s.ShiftStart} - ${s.ShiftEnd})` : "";
                const shiftFormatted = `Shift ${s.ShiftCode} - ${s.ShiftName}${timeStr}`;
                shiftSelect.innerHTML += `<option value="${shiftFormatted}" data-code="${s.ShiftCode}">${shiftFormatted}</option>`;
            });
        }

        // Populate Product dropdowns (Previous Variety & New Variety)
        const prevSelect = document.getElementById("header-prev-product");
        const newSelect = document.getElementById("header-new-product");
        [prevSelect, newSelect].forEach(sel => {
            if (sel) {
                sel.innerHTML = `<option value="">Select Product</option>`;
                this.products.forEach(p => {
                    const codeSuffix = p.ProductCode ? ` (${p.ProductCode})` : "";
                    sel.innerHTML += `<option value="${p.Title}">${p.Title}${codeSuffix}</option>`;
                });
            }
        });

        // Restore values if current session exists
        const currentSession = ALC_StateMachine.currentSession;
        if (currentSession) {
            if (lineSelect && currentSession.cr3ea_lineno) {
                lineSelect.value = currentSession.cr3ea_lineno;
            }
            if (shiftSelect && currentSession.cr3ea_shift) {
                shiftSelect.value = currentSession.cr3ea_shift;
            }
            if (prevSelect && currentSession.cr3ea_previousrunningvariety) {
                prevSelect.value = currentSession.cr3ea_previousrunningvariety;
            }
            if (newSelect && currentSession.cr3ea_runningvariety) {
                newSelect.value = currentSession.cr3ea_runningvariety;
            }
        } else {
            // Load pre-selected shift value from Welcome page popup storage
            const storedShift = localStorage.getItem("shiftValue") || sessionStorage.getItem("shiftValue");
            if (shiftSelect && storedShift) {
                for (let i = 0; i < shiftSelect.options.length; i++) {
                    const opt = shiftSelect.options[i];
                    if (opt.value === storedShift || opt.getAttribute("data-code") === storedShift || opt.text.includes(storedShift)) {
                        shiftSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }

        const shiftBadgeEl = document.getElementById("shiftBadge");
        if (shiftSelect) {
            if (shiftBadgeEl) shiftBadgeEl.innerText = shiftSelect.value || "Shift 1";
        }

        // Dynamically update QA Executive dropdown when Line or Shift changes
        if (lineSelect) {
            $(lineSelect).on('change', () => {
                this.populateQASelection();
            });
        }
        if (shiftSelect) {
            $(shiftSelect).on('change', () => {
                if (shiftBadgeEl) shiftBadgeEl.innerText = shiftSelect.value || "Shift 1";
                this.populateQASelection();
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

    // Populate dropdown with QA Executives dynamically filtered by selected Line & Shift
    populateQASelection: function () {
        const qaSelect = document.getElementById("select-qa-executive");
        if (!qaSelect) return;

        const lineSelect = document.getElementById("header-line");
        const shiftSelect = document.getElementById("header-shift");

        const selectedLineVal = lineSelect ? lineSelect.value : "";
        const selectedLineOpt = lineSelect && lineSelect.selectedIndex >= 0 ? lineSelect.options[lineSelect.selectedIndex] : null;
        const selectedLineTitle = selectedLineOpt ? (selectedLineOpt.getAttribute("data-title") || selectedLineVal) : selectedLineVal;

        const selectedShiftVal = shiftSelect ? shiftSelect.value : "";
        const selectedShiftOpt = shiftSelect && shiftSelect.selectedIndex >= 0 ? shiftSelect.options[shiftSelect.selectedIndex] : null;
        const selectedShiftCode = selectedShiftOpt ? (selectedShiftOpt.getAttribute("data-code") || selectedShiftVal) : selectedShiftVal;

        // Helpers to detect Default / Wildcard assignments
        const isDefaultLine = (title) => {
            if (!title) return true;
            const t = String(title).toLowerCase().trim();
            return t === "default" || t === "default line" || t === "all lines" || t === "all";
        };

        const isDefaultShift = (code) => {
            if (!code) return true;
            const c = String(code).toLowerCase().trim();
            return c === "default" || c === "default shift" || c === "all shifts" || c === "all";
        };

        // Match QA shift matrix rows based on Line and Shift
        let matchedRows = [];
        const matrix = this.qaMatrix || [];

        if (selectedLineTitle || selectedShiftCode) {
            // Priority 1: Exact Line and exact Shift (Non-default specific matching)
            matchedRows = matrix.filter(m => {
                if (isDefaultLine(m.Title) || isDefaultShift(m.ShiftCode)) return false;
                const lineMatch = (m.Title && selectedLineTitle && (m.Title.toLowerCase().trim() === selectedLineTitle.toLowerCase().trim() || selectedLineVal.toLowerCase().includes(m.Title.toLowerCase().trim())));
                const shiftMatch = (m.ShiftCode && selectedShiftCode && (m.ShiftCode.toLowerCase().trim() === selectedShiftCode.toLowerCase().trim() || selectedShiftVal.toLowerCase().includes(m.ShiftCode.toLowerCase().trim())));
                return lineMatch && shiftMatch;
            });

            // Priority 2: Exact Line and Default Shift
            if (matchedRows.length === 0) {
                matchedRows = matrix.filter(m => {
                    if (isDefaultLine(m.Title)) return false;
                    const lineMatch = (m.Title && selectedLineTitle && (m.Title.toLowerCase().trim() === selectedLineTitle.toLowerCase().trim() || selectedLineVal.toLowerCase().includes(m.Title.toLowerCase().trim())));
                    return lineMatch && isDefaultShift(m.ShiftCode);
                });
            }

            // Priority 3: Default Line and exact Shift
            if (matchedRows.length === 0) {
                matchedRows = matrix.filter(m => {
                    if (isDefaultShift(m.ShiftCode)) return false;
                    const shiftMatch = (m.ShiftCode && selectedShiftCode && (m.ShiftCode.toLowerCase().trim() === selectedShiftCode.toLowerCase().trim() || selectedShiftVal.toLowerCase().includes(m.ShiftCode.toLowerCase().trim())));
                    return isDefaultLine(m.Title) && shiftMatch;
                });
            }
        }

        // Priority 4: Default Line and Default Shift (Plant-wide fallback)
        if (matchedRows.length === 0) {
            matchedRows = matrix.filter(m => isDefaultLine(m.Title) && isDefaultShift(m.ShiftCode));
        }

        if (matchedRows.length === 0) {
            matchedRows = matrix;
        }

        // Aggregate QA Executives and Escalation Managers from matched rows
        const qaUsersMap = new Map();
        const escalationEmails = [];

        matchedRows.forEach(item => {
            if (item.AssignedUser && item.AssignedUser.results) {
                item.AssignedUser.results.forEach(user => {
                    if (user && user.Title) {
                        const key = (user.EMail || user.Title).toLowerCase().trim();
                        if (!qaUsersMap.has(key)) {
                            qaUsersMap.set(key, { ...user, rowId: item.Id });
                        }
                    }
                });
            }
            if (item.EscalationManager && item.EscalationManager.results) {
                item.EscalationManager.results.forEach(em => {
                    if (em && em.EMail && !escalationEmails.includes(em.EMail)) {
                        escalationEmails.push(em.EMail);
                    }
                });
            }
        });

        // Safety fallback: If matched row had no assigned users, sweep across all available QA rows
        if (qaUsersMap.size === 0 && matrix.length > 0) {
            matrix.forEach(item => {
                if (item.AssignedUser && item.AssignedUser.results) {
                    item.AssignedUser.results.forEach(user => {
                        if (user && user.Title) {
                            const key = (user.EMail || user.Title).toLowerCase().trim();
                            if (!qaUsersMap.has(key)) {
                                qaUsersMap.set(key, { ...user, rowId: item.Id });
                            }
                        }
                    });
                }
                if (item.EscalationManager && item.EscalationManager.results) {
                    item.EscalationManager.results.forEach(em => {
                        if (em && em.EMail && !escalationEmails.includes(em.EMail)) {
                            escalationEmails.push(em.EMail);
                        }
                    });
                }
            });
        }

        this.escalationEmailsResolved = escalationEmails;

        if (qaUsersMap.size === 0) {
            qaSelect.innerHTML = `<option value="">No QA Executive assigned (Please configure in Admin Panel)</option>`;
        } else {
            qaSelect.innerHTML = `<option value="">Select QA Executive</option>`;
            qaUsersMap.forEach(user => {
                qaSelect.innerHTML += `<option value="${user.Id}" data-email="${user.EMail || ''}" data-rowid="${user.rowId}">${user.Title}</option>`;
            });
        }

        // Set the selected value if a session is loaded
        const currentSession = ALC_StateMachine.currentSession;
        if (currentSession) {
            const status = currentSession.cr3ea_processstatus || currentSession.cr3ea_status || "";
            if (status === "Escalated") {
                const escalationPanel = document.getElementById("escalation-alert-panel");
                if (escalationPanel) {
                    escalationPanel.style.display = "block";
                    escalationPanel.innerHTML = `
                        <div style="font-size: 14px; margin-bottom: 12px;">
                            <strong>ESCALATION LOGGED:</strong> QA Executive did not accept the request within the 5-minute limit. This request has been escalated. QA acceptance is locked. The Shift Executive who started the tour can reassign the QA Executive to restart the inspection.
                        </div>
                        <div>
                            <button type="button" class="bs-btn bs-btn-primary" onclick="ALC_Main.reassignQaExecutive()" style="padding: 8px 18px; font-weight: 600; font-size: 14px; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fa fa-refresh"></i> Reassign QA Executive &amp; Restart Request
                            </button>
                        </div>
                    `;
                }
                const qaAcceptPanel = document.getElementById("qa-accept-panel");
                if (qaAcceptPanel) qaAcceptPanel.style.display = "none";
                const acceptBtn = document.getElementById("btn-accept-request");
                if (acceptBtn) {
                    acceptBtn.disabled = true;
                    acceptBtn.style.display = "none";
                }
            }

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
                if (!$(this).hasClass("select2-hidden-accessible")) {
                    $(this).select2({
                        dropdownParent: $(document.body)
                    });
                }
            });
            $(qaSelect).trigger('change.select2');
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

        // Resolve escalation managers
        let escalationEmails = this.escalationEmailsResolved || [];
        if (escalationEmails.length === 0 && configRowId) {
            const configRow = (this.qaMatrix || []).find(c => c.Id == configRowId);
            if (configRow && configRow.EscalationManager && configRow.EscalationManager.results) {
                escalationEmails = configRow.EscalationManager.results.map(em => em.EMail);
            }
        }

        const productionExecName = document.getElementById("header-exec-prod")?.value || "Unknown";
        const currentExecEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? String(_spPageContextInfo.userEmail).trim() : "";
        const productionExecEmailOrName = currentExecEmail || productionExecName;

        const shift = document.getElementById("header-shift")?.value || "Shift 1";
        const line = document.getElementById("header-line")?.value || "Line 1";
        const prevProduct = document.getElementById("header-prev-product")?.value || "";
        const newProduct = document.getElementById("header-new-product")?.value || "";
        const requestTime = new Date().toISOString();

        const headerData = {
            cr3ea_plantid: QualityRajpura_Config.PLANT_ID, // Rajpura Plant Id
            cr3ea_observedby: productionExecEmailOrName,
            cr3ea_tourstartdate: requestTime,
            cr3ea_status: "Pending QA",
            cr3ea_processstatus: "Pending QA",
            cr3ea_title: "ALC_" + moment().format("MM-DD-YYYY_HH:mm"),
            cr3ea_tourby: assignedQaEmail, // Storing QA Email in tourby (must be unique)
            cr3ea_shiftexecutiveproduction: productionExecEmailOrName,
            cr3ea_lineno: line,
            cr3ea_shift: shift,
            cr3ea_previousrunningvariety: prevProduct,
            cr3ea_runningvariety: newProduct,
            cr3ea_assigned_qa: assignedQaEmail,
            cr3ea_escalation_contacts: escalationEmails.join(","),
            cr3ea_islineclear: false // New request starts as Not Clear (No)
        };

        if (ALC_StateMachine.currentTourId) {
            headerData.cr3ea_prod_rajpura_quality_tourid = ALC_StateMachine.currentTourId;
        }

        // Cache escalation details locally
        this.escalationEmailsResolved = escalationEmails;
        this.assignedQaEmailResolved = assignedQaEmail;

        try {
            ShowLoader();

            // Validation: Check for ongoing uncleared sessions on this same line today
            const sessions = await ALC_DAL.getActiveSessions();
            const todayStr = moment().format("YYYY-MM-DD");

            console.log("ALC_QARequest: Checking line clearance override. Target line:", line, "Current Tour ID:", ALC_StateMachine.currentTourId);
            console.log("ALC_QARequest: Retrieved sessions count:", sessions.length, sessions);

            const unclearedSession = sessions.find(s => {
                const cleanCurrentId = ALC_StateMachine.currentTourId ? String(ALC_StateMachine.currentTourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
                const sid = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId) ? QualityRajpura_Config.getTourId(s) : (s.cr3ea_prod_rajpura_quality_tourid || s.cr3ea_rajpura_quality_tourid);
                const cleanSessionId = sid ? String(sid).replace(/[{}]/g, "").trim().toLowerCase() : "";
                
                if (cleanCurrentId && cleanSessionId === cleanCurrentId) {
                    return false;
                }

                // Check if this session belongs to ALC (not other checklist forms)
                const isFSItem = s.cr3ea_food_safety_checklisttype || 
                                 (s.cr3ea_title && (s.cr3ea_title.includes("FoodSafety") || s.cr3ea_title.includes("PPE_") || s.cr3ea_title.includes("GMP_") || s.cr3ea_title.includes("PCI_")));
                const isCCPItem = s.cr3ea_ccp_oprp_sieves_parametertype || 
                                  (s.cr3ea_title && (s.cr3ea_title.includes("CCP_") || s.cr3ea_title.includes("Sieves_")));
                const isMBItem = (s.cr3ea_title && s.cr3ea_title.includes("MixingBaking_"));
                const isPkgOpsItem = s.cr3ea_pkgops_type || (s.cr3ea_title && s.cr3ea_title.includes("PkgOps_"));
                const isAlcItem = !isFSItem && !isCCPItem && !isMBItem && !isPkgOpsItem;

                if (!isAlcItem) {
                    return false;
                }

                const isSameLine = s.cr3ea_lineno === line;
                const isClearedVal = s.cr3ea_islineclear;
                
                const statusVal1 = (s.cr3ea_status || "").trim().toLowerCase();
                const statusVal2 = (s.cr3ea_processstatus || "").trim().toLowerCase();

                const isTerminalVal1 = statusVal1 === "completed" ||
                    statusVal1 === "closed" ||
                    statusVal1 === "closed - expired" ||
                    statusVal1 === "failed - expired" ||
                    statusVal1 === "success" ||
                    statusVal1 === "success - expired" ||
                    statusVal1 === "submitted" ||
                    statusVal1 === "cancelled" ||
                    statusVal1.includes("expired");

                const isTerminalVal2 = statusVal2 === "completed" ||
                    statusVal2 === "closed" ||
                    statusVal2 === "closed - expired" ||
                    statusVal2 === "failed - expired" ||
                    statusVal2 === "success" ||
                    statusVal2 === "success - expired" ||
                    statusVal2 === "submitted" ||
                    statusVal2 === "cancelled" ||
                    statusVal2.includes("expired");

                const isTerminal = isTerminalVal1 || isTerminalVal2;

                const isCleared = isClearedVal === true ||
                    isClearedVal === "true" ||
                    isClearedVal === 1 ||
                    isClearedVal === "1" ||
                    (typeof isClearedVal === "string" && isClearedVal.toLowerCase().trim() === "yes") ||
                    isTerminal;

                const tourDate = s.cr3ea_tourstartdate || s.createdon;
                const isToday = tourDate && (moment(tourDate).local().format("YYYY-MM-DD") === todayStr);

                const matches = isSameLine && !isCleared && isToday;
                console.log(`ALC_QARequest evaluation for TourId: ${s.cr3ea_prod_rajpura_quality_tourid || s.cr3ea_prod_qualitytourid}: ` + 
                            `isSameLine=${isSameLine} (${s.cr3ea_lineno} vs ${line}), ` +
                            `isClearedVal=${isClearedVal}, ` +
                            `status=${status}, ` +
                            `isTerminal=${isTerminal}, ` +
                            `isCleared=${isCleared}, ` +
                            `isToday=${isToday} (${tourDate ? moment(tourDate).local().format("YYYY-MM-DD") : "N/A"} vs ${todayStr}) ` +
                            `-> MATCHES=${matches}`);

                return matches;
            });

            if (unclearedSession) {
                HideLoader();
                const tourTimeStr = unclearedSession.cr3ea_tourstartdate ? moment(unclearedSession.cr3ea_tourstartdate).format("hh:mm A") : "earlier";
                const override = confirm(`${line} already has an active clearance request started at ${tourTimeStr}. Do you want to override and start a new request?`);
                if (!override) {
                    return;
                }
                ShowLoader();
                try {
                    const cancelId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId) ? QualityRajpura_Config.getTourId(unclearedSession) : (unclearedSession.cr3ea_prod_rajpura_quality_tourid || unclearedSession.cr3ea_rajpura_quality_tourid);
                    await ALC_DAL.saveSession({
                        cr3ea_prod_rajpura_quality_tourid: cancelId,
                        cr3ea_status: "Cancelled",
                        cr3ea_processstatus: "Cancelled"
                    });
                } catch (e) {
                    console.warn("Failed to cancel previous session, proceeding anyway:", e);
                }
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
            console.error("Failed to submit request to Dataverse:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit QA request")
                : ("Dataverse Error: Failed to submit request - " + error.message);
            alert(msg);
        }
    },

    // Check if the current request has exceeded the 5-minute acceptance window or is already escalated
    isRequestExpired: function () {
        const session = ALC_StateMachine.currentSession;
        if (session) {
            const status = (session.cr3ea_processstatus || session.cr3ea_status || "").trim().toLowerCase();
            if (status === "escalated") return true;
        }
        const reqTimeStr = this.requestTimeResolved || (session && (session.cr3ea_tourstartdate || session.cr3ea_request_time));
        if (!reqTimeStr) return false;
        const reqTime = new Date(reqTimeStr).getTime();
        if (isNaN(reqTime)) return false;
        const elapsedSeconds = Math.floor((Date.now() - reqTime) / 1000);
        return elapsedSeconds >= this.escalationTimeLimit;
    },

    // Step 3 & 5: Timer & Escalation countdown
    startTimer: function (requestTimeString, qaName) {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timerDisplay = document.getElementById("escalation-timer");
        const requestTime = new Date(requestTimeString).getTime();

        const checkCountdown = async () => {
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - requestTime) / 1000);
            const remainingSeconds = this.escalationTimeLimit - elapsedSeconds;

            if (remainingSeconds <= 0 || isNaN(requestTime)) {
                if (this.timerInterval) clearInterval(this.timerInterval);
                if (timerDisplay) {
                    timerDisplay.innerHTML = `<span class="text-danger font-weight-bold" style="font-size: 16px;">Escalated to Next Level</span>`;
                }

                // Immediately hide and disable QA accept controls
                const qaAcceptPanel = document.getElementById("qa-accept-panel");
                if (qaAcceptPanel) qaAcceptPanel.style.display = "none";

                const acceptBtn = document.getElementById("btn-accept-request");
                if (acceptBtn) {
                    acceptBtn.disabled = true;
                    acceptBtn.style.display = "none";
                }

                await this.resolveEscalationContacts(qaName);
                this.triggerEscalation();
            } else {
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                if (timerDisplay) {
                    timerDisplay.innerHTML = `Time remaining for QA acceptance: <strong>${minutes}:${seconds < 10 ? '0' : ''}${seconds}</strong>`;
                }
            }
        };

        // Run immediately on call to prevent flashing active accept button if already expired
        checkCountdown();
        this.timerInterval = setInterval(checkCountdown, 1000);
    },

    resolveEscalationContacts: async function (qaName) {
        if (this.escalationEmailsResolved && this.escalationEmailsResolved.length > 0) {
            return this.escalationEmailsResolved;
        }

        try {
            // First check if already resolved in qaMatrix
            if (this.qaMatrix && this.qaMatrix.length > 0) {
                const emails = [];
                this.qaMatrix.forEach(row => {
                    if (row.EscalationManager && row.EscalationManager.results) {
                        row.EscalationManager.results.forEach(em => {
                            if (em && em.EMail && !emails.includes(em.EMail)) {
                                emails.push(em.EMail);
                            }
                        });
                    }
                });
                if (emails.length > 0) {
                    this.escalationEmailsResolved = emails;
                    return emails;
                }
            }

            const matrixList = await ALC_DAL.getQaShiftMatrix();
            const emails = [];
            (matrixList || []).forEach(row => {
                if (row.EscalationManager && row.EscalationManager.results) {
                    row.EscalationManager.results.forEach(em => {
                        if (em && em.EMail && !emails.includes(em.EMail)) {
                            emails.push(em.EMail);
                        }
                    });
                }
            });
            if (emails.length > 0) {
                this.escalationEmailsResolved = emails;
                return emails;
            }
        } catch (e) {
            console.error("Failed to dynamically resolve escalation contacts:", e);
        }
        return [];
    },

    // Step 5: Escalation handler
    triggerEscalation: async function () {
        console.warn("QA did not accept request within 5 minutes. Escalating...");

        // Hide QA acceptance controls and disable accept button
        const qaAcceptPanel = document.getElementById("qa-accept-panel");
        if (qaAcceptPanel) qaAcceptPanel.style.display = "none";

        const acceptBtn = document.getElementById("btn-accept-request");
        if (acceptBtn) {
            acceptBtn.disabled = true;
            acceptBtn.style.display = "none";
        }

        const escalationPanel = document.getElementById("escalation-alert-panel");
        if (escalationPanel) {
            escalationPanel.style.display = "block";
            escalationPanel.innerHTML = `
                <div style="font-size: 14px; margin-bottom: 12px;">
                    <strong>ESCALATION LOGGED:</strong> QA Executive did not accept the request within the 5-minute limit. This request has been escalated. QA acceptance is locked. The Shift Executive who started the tour can reassign the QA Executive to restart the inspection.
                </div>
                <div>
                    <button type="button" class="bs-btn bs-btn-primary" onclick="ALC_Main.reassignQaExecutive()" style="padding: 8px 18px; font-weight: 600; font-size: 14px; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="fa fa-refresh"></i> Reassign QA Executive &amp; Restart Request
                    </button>
                </div>
            `;
        }

        const timerDisplay = document.getElementById("escalation-timer");
        if (timerDisplay) {
            timerDisplay.innerHTML = `<span class="text-danger font-weight-bold" style="font-size: 16px;">Escalated to Next Level (Acceptance Window Expired)</span>`;
        }

        // Update local session state and lock editing
        if (ALC_StateMachine.currentSession) {
            ALC_StateMachine.currentSession.cr3ea_status = "Escalated";
            ALC_StateMachine.currentSession.cr3ea_processstatus = "Escalated";
        }
        ALC_StateMachine.isReadOnly = true;

        try {
            if (ALC_StateMachine.currentTourId) {
                const updatePayload = {
                    cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                    cr3ea_status: "Escalated",
                    cr3ea_processstatus: "Escalated"
                };
                await ALC_DAL.saveSession(updatePayload);
                console.log("ALC tour status updated to 'Escalated' in Dataverse.");

                // Trigger Power Automate notification
                if (typeof ALC_Notification !== "undefined") {
                    const session = ALC_StateMachine.currentSession || {};
                    const mergedSession = {
                        ...session,
                        ...updatePayload
                    };
                    let escalationEmails = this.escalationEmailsResolved || [];
                    if (escalationEmails.length === 0 && session.cr3ea_escalation_contacts) {
                        escalationEmails = session.cr3ea_escalation_contacts.split(",").map(e => e.trim()).filter(Boolean);
                    }
                    if (escalationEmails.length === 0) {
                        escalationEmails = await this.resolveEscalationContacts();
                    }
                    const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
                    await ALC_Notification.sendEscalationNotification(mergedSession, qaEmail, escalationEmails);
                }
            }
        } catch (e) {
            console.error("Failed to save escalation status in Dataverse:", e);
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

        // Guard against accepting escalated or expired requests
        const currentSession = ALC_StateMachine.currentSession;
        const currentStatus = (currentSession?.cr3ea_processstatus || currentSession?.cr3ea_status || "").trim().toLowerCase();

        if (currentStatus === "escalated" || this.isRequestExpired()) {
            this.triggerEscalation();
            alert("The 5-minute acceptance window has expired. This request has been escalated and cannot be accepted by QA.\n\nPlease contact the Shift Production Executive to reassign.");
            return;
        }

        // Check live Dataverse status before accepting to prevent accepting an already escalated session
        try {
            ShowLoader();
            const liveSession = await ALC_DAL.getSessionById(ALC_StateMachine.currentTourId);
            const liveStatus = (liveSession?.cr3ea_processstatus || liveSession?.cr3ea_status || "").trim().toLowerCase();
            if (liveStatus === "escalated" || liveStatus === "cancelled") {
                HideLoader();
                this.triggerEscalation();
                alert("This request has been escalated or cancelled and can no longer be accepted by QA.");
                return;
            }
        } catch (checkErr) {
            console.warn("Could not check live status before accepting:", checkErr);
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
            cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
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
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "accept QA request")
                : ("Failed to accept request: " + error.message);
            alert(msg);
        }
    }
};
