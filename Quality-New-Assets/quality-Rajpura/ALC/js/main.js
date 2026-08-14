// Bootstrap and Orchestration Module for ALC workflow
console.log("ALC Main Controller loaded");

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

document.addEventListener("DOMContentLoaded", async function () {
    ShowLoader();
    try {
        await ALC_Main.init();
    } catch (error) {
        console.error("Failed to initialize ALC module:", error);
    } finally {
        HideLoader();
    }
});

const ALC_Main = {
    userRole: ALC_ROLES.PRODUCTION,
    currentTourId: null,

    init: async function () {
        // Save last visited dashboard category
        localStorage.setItem("lastVisitedDashboard", "ALC");

        // 1. URL parameters check for TourId
        const urlParams = new URLSearchParams(window.location.search);
        this.currentTourId = urlParams.get('TourId');

        // 2. Identify User Role based on SharePoint Config list
        await this.identifyUserRole();

        // 3. Setup event listeners
        this.bindEvents();

        // 4. State routing based on session existence and status
        if (!this.currentTourId) {
            // Direct to Checklist Information form
            ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, null);
            await ALC_QARequest.init();
        } else {
            // Existing session mode (resume state)
            await this.resumeSessionState();
        }
    },

    // Identify user role from SharePoint config list Quality-Rajpura
    identifyUserRole: async function () {
        const currentUserName = typeof currentUser !== "undefined" ? currentUser : "";
        const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
        const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";

        try {
            const configs = await ALC_DAL.getConfig();

            // Check if current user is listed under QA User config
            const isQaUser = configs.some(c =>
                c.ConfigType === "QA User" &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin || (u.EMail && u.EMail.toLowerCase() === currentUserEmail.toLowerCase()))
            );

            // Check if current user is listed under Product Incharge config
            const isProductIncharge = configs.some(c =>
                c.ConfigType === "Product User" &&
                c.AssignedUser &&
                c.AssignedUser.results &&
                c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin || (u.EMail && u.EMail.toLowerCase() === currentUserEmail.toLowerCase()))
            );

            // Always parse and assign areas the user owns if they match any Product User configurations
            const userAreas = configs
                .filter(c =>
                    c.ConfigType === "Product User" &&
                    c.AssignedUser &&
                    c.AssignedUser.results &&
                    c.AssignedUser.results.some(u => u.Title === currentUserName || u.Title === currentUserLogin || (u.EMail && u.EMail.toLowerCase() === currentUserEmail.toLowerCase()))
                )
                .map(c => c.Area);
            ALC_StateMachine.userAreas = userAreas || [];
            console.log(`Assigned areas resolved: ${JSON.stringify(userAreas)}`);

            if (isQaUser) {
                this.userRole = ALC_ROLES.QUALITY;
            } else if (isProductIncharge || userAreas.length > 0) {
                this.userRole = ALC_ROLES.PRODUCT;
            } else {
                this.userRole = ALC_ROLES.PRODUCTION;
            }

            // Allow URL override for testing/debugging (e.g. ?role=PRODUCT or ?role=PRODUCTION)
            const urlRole = new URLSearchParams(window.location.search).get('role');
            if (urlRole && ALC_ROLES[urlRole.toUpperCase()]) {
                this.userRole = ALC_ROLES[urlRole.toUpperCase()];
                console.log(`User role overridden via URL parameter to: ${this.userRole}`);
            }

            // Set granular flags on ALC_StateMachine
            ALC_StateMachine.isQaUser = isQaUser;
            ALC_StateMachine.isProductUser = (userAreas.length > 0);
            ALC_StateMachine.isProductionUser = (!isQaUser && userAreas.length === 0);

            // Align granular flags if role override is requested via URL parameter
            if (urlRole) {
                const upperRole = urlRole.toUpperCase();
                ALC_StateMachine.isQaUser = (upperRole === ALC_ROLES.QUALITY);
                ALC_StateMachine.isProductUser = (upperRole === ALC_ROLES.PRODUCT);
                ALC_StateMachine.isProductionUser = (upperRole === ALC_ROLES.PRODUCTION);
            }

            console.log(`Current User Role Resolved to: ${this.userRole}`);

            // Populate visual diagnostics banner (commented out)
            /*
            const diagBanner = document.getElementById("diagnostic-role-banner");
            if (diagBanner) {
                diagBanner.style.display = "block";
                const diagName = document.getElementById("diag-user-name");
                if (diagName) diagName.innerText = currentUserLogin || currentUserName || "Unknown User";
                const diagEmail = document.getElementById("diag-user-email");
                if (diagEmail) diagEmail.innerText = currentUserEmail || "No Email Resolved";
                const diagRole = document.getElementById("diag-user-role");
                if (diagRole) {
                    diagRole.innerText = this.userRole;
                    diagRole.className = `badge badge-${this.userRole === ALC_ROLES.PRODUCTION ? 'primary' : (this.userRole === ALC_ROLES.QUALITY ? 'success' : 'info')}`;
                }
                const diagAreas = document.getElementById("diag-user-areas");
                if (diagAreas) {
                    const areas = ALC_StateMachine.userAreas || [];
                    diagAreas.innerText = areas.length > 0 ? areas.join(", ") : "None";
                }
            }
            */
        } catch (error) {
            console.error("Error identifying user role, defaulting to Production:", error);
            this.userRole = ALC_ROLES.PRODUCTION;
        }
    },

    // Render the Active Requests Queue Dashboard
    renderDashboardQueue: async function () {
        const tbody = document.getElementById("dashboard-queue-tbody");
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">Fetching active requests...</td></tr>';

        try {
            const sessions = await ALC_DAL.getActiveSessions();
            if (sessions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No active clearance requests at this moment.</td></tr>';
                return;
            }

            // Sort active sessions list by start date/time (latest first)
            sessions.sort((a, b) => {
                const valA = a.cr3ea_tourstartdate || a.createdon || "";
                const valB = b.cr3ea_tourstartdate || b.createdon || "";
                const formats = [
                    "YYYY-MM-DDTHH:mm:ssZ",
                    "YYYY-MM-DDTHH:mm:ss.SSSZ",
                    "YYYY-MM-DD HH:mm:ss",
                    "YYYY-MM-DD",
                    "MM-DD-YYYY HH:mm:ss",
                    "MM-DD-YYYY hh:mm A",
                    "MM-DD-YYYY",
                    "M/D/YYYY h:mm A",
                    "M/D/YYYY hh:mm A",
                    "MM/DD/YYYY hh:mm A",
                    "DD-MM-YYYY HH:mm:ss",
                    "DD-MM-YYYY hh:mm A",
                    "DD-MM-YYYY",
                    "D/M/YYYY h:mm A",
                    "D/M/YYYY hh:mm A",
                    "DD/MM/YYYY hh:mm A"
                ];
                const timeA = moment(valA, formats, true);
                const timeB = moment(valB, formats, true);
                const msA = timeA.isValid() ? timeA.valueOf() : 0;
                const msB = timeB.isValid() ? timeB.valueOf() : 0;
                return msB - msA;
            });

            tbody.innerHTML = "";
            sessions.forEach(session => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #e2e8f0";

                const dateStr = session.cr3ea_tourstartdate ? moment(session.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : "N/A";
                const line = session.cr3ea_lineno || "N/A";
                const shift = session.cr3ea_shift || "N/A";
                const prodExec = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "N/A";
                const qaExec = session.cr3ea_tourby || "N/A";
                const status = session.cr3ea_processstatus || session.cr3ea_status || "Pending";

                // Evaluate Is Line Clear (Check if true/Yes/1 OR terminal success/expired status)
                const isClearedVal = session.cr3ea_islineclear;
                const isCleared = isClearedVal === true ||
                    isClearedVal === "true" ||
                    isClearedVal === 1 ||
                    isClearedVal === "1" ||
                    isClearedVal === "Yes" ||
                    status === "Completed" ||
                    status === "Closed" ||
                    status === "Closed - Expired" ||
                    status === "Success";

                const clearBadgeHtml = isCleared
                    ? '<span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Yes</span>'
                    : '<span class="badge badge-error" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">No</span>';

                let actionBtnHtml = "";
                const tourId = session.cr3ea_prod_rajpura_quality_tourid;

                if (this.userRole === ALC_ROLES.QUALITY) {
                    if (status === "Pending QA") {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-primary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">Accept Request</button>`;
                    } else if (status === "QA In Progress") {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-primary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">Resume Checklist</button>`;
                    } else if (status === "Pending Re-Verification") {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-primary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">Re-Verify</button>`;
                    } else {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-secondary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">View</button>`;
                    }
                } else if (this.userRole === ALC_ROLES.PRODUCT) {
                    if (status === "Failed - Pending Production") {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-danger bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">Submit Actions</button>`;
                    } else {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-secondary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">View</button>`;
                    }
                } else { // PRODUCTION / Shift Executive
                    if (status === "Failed - Pending Production" || status === "Pending Re-Verification") {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-primary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">Resume</button>`;
                    } else {
                        actionBtnHtml = `<button type="button" class="bs-btn bs-btn-secondary bs-btn-sm" onclick="ALC_Main.routeToSession('${tourId}')">View</button>`;
                    }
                }

                tr.innerHTML = `
                    <td style="padding: 12px 15px;">${dateStr}</td>
                    <td style="padding: 12px 15px;">${line}</td>
                    <td style="padding: 12px 15px;">${shift}</td>
                    <td style="padding: 12px 15px;">${prodExec}</td>
                    <td style="padding: 12px 15px;">${qaExec}</td>
                    <td style="padding: 12px 15px;"><span class="badge ${status === 'Pending QA' ? 'badge-warning' : (status === 'Failed - Pending Production' ? 'badge-error' : 'badge-success')}">${status}</span></td>
                    <td style="padding: 12px 15px; text-align: center;">${clearBadgeHtml}</td>
                    <td style="padding: 12px 15px; text-align: center;">${actionBtnHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            console.error("Error rendering dashboard queue:", e);
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #ef4444;">Failed to fetch active requests from Dataverse.</td></tr>';
        }
    },

    routeToSession: function (tourId) {
        window.location.search = `?TourId=${tourId}`;
    },

    // Fetch existing tour session and transition state
    resumeSessionState: async function () {
        const AccessToken = await ALC_DAL.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const url = `${baseApiUrl}/api/data/v9.2/cr3ea_prod_rajpura_quality_tours(${this.currentTourId})`;

        const headers = { "Accept": "application/json" };
        if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

        try {
            const response = await fetch(url, { headers: headers });
            if (!response.ok) throw new Error(`Session fetch failed with status ${response.status}`);

            const session = await response.json();
            const status = session.cr3ea_processstatus || "In Progress";

            console.log(`Resuming session ${this.currentTourId} with Dataverse status: ${status}`);

            // Store globally
            ALC_StateMachine.currentSession = session;

            // Restrict QA role access only to the assigned QA for this specific tour session
            if (ALC_StateMachine.isQaUser) {
                const assignedQAString = (session.cr3ea_assigned_qa || session.cr3ea_tourby || "").toLowerCase().trim();
                const myEmail = (typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "").toLowerCase().trim();
                const myName1 = (typeof currentUser !== "undefined" ? currentUser : "").toLowerCase().trim();
                const myName2 = (typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "").toLowerCase().trim();

                let isAssignedQA = false;

                if (assignedQAString) {
                    // Match directly against current user info (email, username, display name)
                    if (myEmail && (myEmail === assignedQAString || assignedQAString.includes(myEmail) || myEmail.includes(assignedQAString))) {
                        isAssignedQA = true;
                    } else if (myName1 && (myName1 === assignedQAString || assignedQAString.includes(myName1) || myName1.includes(assignedQAString))) {
                        isAssignedQA = true;
                    } else if (myName2 && (myName2 === assignedQAString || assignedQAString.includes(myName2) || myName2.includes(assignedQAString))) {
                        isAssignedQA = true;
                    } else {
                        // Check SharePoint configurations to see if the assigned user matches the logged-in user
                        const configs = await ALC_DAL.getConfig();
                        const matchedConfig = configs.find(c =>
                            c.ConfigType === "QA User" &&
                            c.AssignedUser &&
                            c.AssignedUser.results &&
                            c.AssignedUser.results.some(u => {
                                const uTitle = (u.Title || "").toLowerCase().trim();
                                const uEmail = (u.EMail || "").toLowerCase().trim();

                                // Matches the assigned QA
                                const matchesAssigned = (uTitle === assignedQAString || uEmail === assignedQAString || assignedQAString.includes(uTitle) || assignedQAString.includes(uEmail));
                                // Matches the logged-in user
                                const matchesMe = (uTitle === myName1 || uTitle === myName2 || (uEmail && uEmail === myEmail));

                                return matchesAssigned && matchesMe;
                            })
                        );
                        if (matchedConfig) isAssignedQA = true;
                    }
                } else {
                    // Default to true if no QA has been assigned yet
                    isAssignedQA = true;
                }

                ALC_StateMachine.isQaUser = isAssignedQA;
                if (!isAssignedQA) {
                    this.userRole = ALC_ROLES.PRODUCTION;
                }
                console.log(`QA User Access Check: Assigned QA = ${assignedQAString}, My Email = ${myEmail}, My Name1 = ${myName1}, My Name2 = ${myName2}. Is Assigned QA = ${isAssignedQA}`);
            }

            // Same-day check
            const creationTime = session.createdon || session.cr3ea_tourstartdate;
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
                    const isToday = (tourDateLocal === todayLocal);

                    console.log(`Same-day check: TourDateLocal=${tourDateLocal}, TodayLocal=${todayLocal}, isToday=${isToday}`);

                    ALC_StateMachine.isPreviousDay = !isToday;
                }
            }

            // Update UI with existing header values
            this.populateHeaderFields(session);

            // Execute transition
            await this.transitionByStatus(status, session);
        } catch (error) {
            console.warn("Failed to fetch session from Dataverse. Loading mock session fallback for testing/offline use:", error);

            // Populate mock session for visual testing/offline execution
            const urlParams = new URLSearchParams(window.location.search);
            const mockStatus = urlParams.get('status') || "QA In Progress";

            const mockSession = {
                cr3ea_prod_rajpura_quality_toursid: this.currentTourId,
                cr3ea_shiftexecutiveproduction: urlParams.get('exec') || "Shift Executive User",
                cr3ea_lineno: urlParams.get('line') || "Line 1",
                cr3ea_shift: urlParams.get('shift') || "Shift 1",
                cr3ea_previousrunningvariety: "Bectors Original",
                cr3ea_runningvariety: "Marie Delight",
                cr3ea_status: mockStatus,
                cr3ea_processstatus: mockStatus,
                cr3ea_title: "ALC_" + moment().format("MM-DD-YYYY_HH:mm"),
                cr3ea_tourstartdate: new Date().toISOString()
            };

            // Store globally
            ALC_StateMachine.currentSession = mockSession;

            this.populateHeaderFields(mockSession);
            await this.transitionByStatus(mockSession.cr3ea_status, mockSession);
        }
    },

    // Route state machine and bootstrap necessary modules based on status
    transitionByStatus: async function (status, session) {
        // Fetch checkpoints first so we can check roles/actions
        let checkpoints = [];
        try {
            checkpoints = await ALC_DAL.getCheckpoints(this.currentTourId);
        } catch (e) {
            console.error("Error fetching checkpoints for routing:", e);
        }

        const isExpired = status === "Closed - Expired";

        // Determine if the current user is the shift executive on this tour (case-insensitive, trimmed comparison)
        const currentUserName = (typeof currentUser !== "undefined" ? currentUser : "").trim().toLowerCase();
        const currentUserLogin = (typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "").trim().toLowerCase();
        const shiftExecDb = (session && session.cr3ea_shiftexecutiveproduction ? session.cr3ea_shiftexecutiveproduction : "").trim().toLowerCase();

        const isShiftExec = shiftExecDb && (
            shiftExecDb === currentUserName ||
            shiftExecDb === currentUserLogin
        );

        // Update granular flags dynamically based on the session executive
        if (isShiftExec) {
            ALC_StateMachine.isProductionUser = true;
        } else {
            ALC_StateMachine.isProductionUser = false;
        }

        // Define terminal statuses
        if (status === "Completed" || status === "Closed" || status === "Success") {
            ALC_StateMachine.isReadOnly = true;
            ALC_StateMachine.init(this.userRole, ALC_STATES.SUMMARY, this.currentTourId);
            await ALC_Summary.init(this.currentTourId);
            return;
        }

        // Direct routing for initial and acceptance statuses to completely avoid summary redirects
        if (status === "In Progress") {
            const hasInitAction = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser);
            ALC_StateMachine.isReadOnly = !hasInitAction;
            ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, this.currentTourId);
            await ALC_QARequest.init();
            return;
        }

        if (status === "Pending QA") {
            const hasAcceptAction = ALC_StateMachine.isQaUser;
            ALC_StateMachine.isReadOnly = !hasAcceptAction;

            // Check if current user is an escalation manager for this tour
            const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";
            const currentUserName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
            const escalationContactsStr = session.cr3ea_escalation_contacts || "";
            const escalationEmails = escalationContactsStr.toLowerCase().split(",").map(e => e.trim());

            // Also resolve from config row matching QA email (since Escalation Manager is multiperson select)
            const qaEmailVal = (session.cr3ea_assigned_qa || session.cr3ea_tourby || "").toLowerCase().trim();
            try {
                const configList = await ALC_DAL.getConfig();
                if (qaEmailVal && configList) {
                    const matchConfig = configList.find(c =>
                        c.AssignedUser && c.AssignedUser.results &&
                        c.AssignedUser.results.some(u => u.EMail && u.EMail.toLowerCase().trim() === qaEmailVal)
                    );
                    if (matchConfig && matchConfig.EscalationManager && matchConfig.EscalationManager.results) {
                        matchConfig.EscalationManager.results.forEach(m => {
                            if (m.EMail) {
                                const emailLower = m.EMail.toLowerCase().trim();
                                if (!escalationEmails.includes(emailLower)) {
                                    escalationEmails.push(emailLower);
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch config list for main.js escalation check:", e);
            }

            const isUserEscalationManager = currentUserEmail && escalationEmails.includes(currentUserEmail.toLowerCase().trim());
            const isUserEscalationManagerByName = currentUserName && escalationEmails.some(email => email.includes(currentUserName.toLowerCase().trim()));

            const isEscalationManagerForThisTour = isUserEscalationManager || isUserEscalationManagerByName;

            // If the user is the escalation manager, override routing to show the request details in read-only mode
            if (isEscalationManagerForThisTour) {
                ALC_StateMachine.isReadOnly = true;
                ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, this.currentTourId);
                await ALC_QARequest.init();
                return;
            }

            ALC_StateMachine.init(this.userRole, ALC_STATES.PENDING_QA_ACCEPTANCE, this.currentTourId);
            ALC_QARequest.startTimer(ALC_QARequest.requestTimeResolved || session.cr3ea_tourstartdate || session.cr3ea_request_time, session.cr3ea_tourby);
            return;
        }

        // Define role action checks
        let hasAction = false;
        let pendingMsg = "";

        if (status === "QA In Progress") {
            if (ALC_StateMachine.isQaUser) {
                hasAction = true;
            } else {
                pendingMsg = `Pending with: QA Executive for Checklist Completion`;
            }
        } else if (status === "Failed - Pending Production" || status === "Success - Pending Production") {
            if (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) {
                const hasPending = this.hasPendingProductionActions(checkpoints, ALC_StateMachine.isProductionUser, ALC_StateMachine.isProductUser, ALC_StateMachine.userAreas);
                if (hasPending) {
                    hasAction = true;
                } else {
                    pendingMsg = `Pending with: Production Team for Corrective Actions`;
                }
            } else {
                pendingMsg = `Pending with: Production Team for Corrective Actions`;
            }
        } else if (status === "Pending Re-Verification" || status === "Success - Pending Re-Verification") {
            const isProdOrProduct = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser);
            const hasPendingProd = isProdOrProduct && this.hasPendingProductionActions(checkpoints, ALC_StateMachine.isProductionUser, ALC_StateMachine.isProductUser, ALC_StateMachine.userAreas);
            if (ALC_StateMachine.isQaUser || hasPendingProd) {
                hasAction = true;
            } else {
                pendingMsg = `Pending with: QA Executive for Re-Verification`;
            }
        }

        // Check if expired
        if (isExpired) {
            const hasPending = checkpoints.some(c =>
                (c.cr3ea_status === "Not Okay" ||
                    (c.cr3ea_defectcategory && (
                        c.cr3ea_defectcategory.includes("Non-Compliant") ||
                        c.cr3ea_defectcategory.includes("Partial") ||
                        c.cr3ea_defectcategory.includes("00") ||
                        c.cr3ea_defectcategory.includes("01")
                    ))) &&
                (!c.cr3ea_productionremarks && (!c.cr3ea_defectremarks || !c.cr3ea_defectremarks.trim().startsWith("Action:")))
            );

            if ((ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) && hasPending) {
                console.log("Production/Product User opening expired session with pending actions. Loading in PRODUCTION_ACTION state.");
                ALC_StateMachine.isReadOnly = false;
                ALC_StateMachine.init(this.userRole, ALC_STATES.PRODUCTION_ACTION, this.currentTourId);
                await ALC_CorrectiveAction.loadFailedItems();
            } else {
                console.log("Expired session is fully resolved or opened by QA. Loading in read-only summary mode.");
                ALC_StateMachine.isReadOnly = true;
                ALC_StateMachine.init(this.userRole, ALC_STATES.SUMMARY, this.currentTourId);
                await ALC_Summary.init(this.currentTourId);
            }
            return;
        }

        // Execute routing based on action availability
        if (hasAction) {
            ALC_StateMachine.isReadOnly = false;
            if (status === "Pending QA") {
                ALC_StateMachine.init(this.userRole, ALC_STATES.PENDING_QA_ACCEPTANCE, this.currentTourId);
                ALC_QARequest.startTimer(ALC_QARequest.requestTimeResolved || session.cr3ea_tourstartdate || session.cr3ea_request_time, session.cr3ea_tourby);
            } else if (status === "QA In Progress") {
                ALC_StateMachine.init(this.userRole, ALC_STATES.QA_CHECKLIST, this.currentTourId);
            } else if (status === "Failed - Pending Production" || status === "Success - Pending Production") {
                ALC_StateMachine.init(this.userRole, ALC_STATES.PRODUCTION_ACTION, this.currentTourId);
                await ALC_CorrectiveAction.loadFailedItems();
            } else if (status === "Pending Re-Verification" || status === "Success - Pending Re-Verification") {
                const isProdOrProduct = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser);
                const hasPendingProd = isProdOrProduct && this.hasPendingProductionActions(checkpoints, ALC_StateMachine.isProductionUser, ALC_StateMachine.isProductUser, ALC_StateMachine.userAreas);
                if (hasPendingProd) {
                    console.log("Conflict detected: User has pending production actions. Prioritizing PRODUCTION_ACTION state.");
                    ALC_StateMachine.init(this.userRole, ALC_STATES.PRODUCTION_ACTION, this.currentTourId);
                    await ALC_CorrectiveAction.loadFailedItems();
                } else {
                    ALC_StateMachine.init(this.userRole, ALC_STATES.QA_REVERIFYING, this.currentTourId);
                    await ALC_CorrectiveAction.loadFailedItems();
                    await ALC_ReVerification.loadReverificationItems();
                }
            } else {
                ALC_StateMachine.init(this.userRole, ALC_STATES.INIT_PRODUCTION, this.currentTourId);
                await ALC_QARequest.init();
            }
        } else {
            // User does not have action on in-progress tour
            if (status === "QA In Progress") {
                alert("This tour is currently paused for QA evaluation. Access is restricted to the assigned QA Executive.");
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
                window.location.href = homeUrl;
                return;
            }

            // User does not have action - show summary page in read-only
            console.log(`User has no action on in-progress tour with status: ${status}. Showing read-only Summary Page.`);
            ALC_StateMachine.isReadOnly = true;
            ALC_StateMachine.init(this.userRole, ALC_STATES.SUMMARY, this.currentTourId);
            await ALC_Summary.init(this.currentTourId, pendingMsg || `Pending with: ${status}`);
        }
    },

    // Helper to determine if production/product user has any pending actions
    hasPendingProductionActions: function (checkpoints, isProductionUser, isProductUser, userAreas) {
        const failedItems = checkpoints.filter(c => {
            const isFailed = c.cr3ea_status === "Not Okay" ||
                (c.cr3ea_defectcategory && (
                    c.cr3ea_defectcategory.includes("00") ||
                    c.cr3ea_defectcategory.includes("01") ||
                    c.cr3ea_defectcategory.includes("Non-Compliant") ||
                    c.cr3ea_defectcategory.includes("Partial")
                ));
            const hasRemarks = c.cr3ea_productionremarks && c.cr3ea_productionremarks.trim().startsWith("Action:");
            return isFailed && !hasRemarks;
        });

        if (failedItems.length === 0) return false;
        if (isProductionUser) return true; // Production Exec can edit all areas
        if (isProductUser) {
            const assignedAreas = userAreas || [];
            return failedItems.some(c => {
                const hasAreaAccess = assignedAreas.some(area =>
                    c.cr3ea_area &&
                    (c.cr3ea_area.toLowerCase().includes(area.toLowerCase().trim()) ||
                        area.toLowerCase().trim().includes(c.cr3ea_area.toLowerCase()))
                );
                return hasAreaAccess;
            });
        }
        return false;
    },

    populateHeaderFields: function (session) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };

        let observedBy = session.cr3ea_observedby || "";
        let shift = session.cr3ea_shift || "";
        let line = session.cr3ea_lineno || "";
        let prevProduct = session.cr3ea_previousrunningvariety || "";
        let newProduct = session.cr3ea_runningvariety || "";
        let requestTime = session.cr3ea_request_time || "";
        let assignedQa = session.cr3ea_assigned_qa || "";
        let escalationContacts = session.cr3ea_escalation_contacts || "";

        // Check if cr3ea_observedby is serialized metadata (fallback for older records)
        if (observedBy.indexOf("||") !== -1) {
            const parts = observedBy.split("||");
            observedBy = parts[0] ? parts[0].trim() : "";
            shift = shift || (parts[1] ? parts[1].trim() : "");
            line = line || (parts[2] ? parts[2].trim() : "");
            prevProduct = prevProduct || (parts[3] ? parts[3].trim() : "");
            newProduct = newProduct || (parts[4] ? parts[4].trim() : "");
            if (parts[5]) requestTime = requestTime || parts[5].trim();
            if (parts[6]) assignedQa = assignedQa || parts[6].trim();
            if (parts[7]) escalationContacts = escalationContacts || parts[7].trim();
        }

        // Prioritize native columns
        let prodExec = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || observedBy;
        if (ALC_StateMachine.currentState === ALC_STATES.INIT_PRODUCTION && !session.cr3ea_shiftexecutiveproduction) {
            const actualUser = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
            if (actualUser) {
                prodExec = actualUser;
            }
        }
        let qaExec = "";
        if (!session.cr3ea_assigned_qa) {
            qaExec = "QA user";
        } else {
            let qaExecRaw = session.cr3ea_tourby || session.cr3ea_shiftexecutivequality || session.cr3ea_assigned_qa || "";
            qaExec = qaExecRaw;
            if (qaExecRaw && qaExecRaw.includes("@") && typeof ALC_StateMachine !== 'undefined' && typeof ALC_StateMachine.resolveQaNameFromEmail === 'function') {
                qaExec = ALC_StateMachine.resolveQaNameFromEmail(qaExecRaw);
            }
        }

        // Store resolved values on ALC_QARequest so timer and escalation logic can use them
        ALC_QARequest.requestTimeResolved = requestTime || session.cr3ea_tourstartdate;
        ALC_QARequest.assignedQaEmailResolved = assignedQa;
        ALC_QARequest.escalationEmailsResolved = escalationContacts ? escalationContacts.split(",") : [];

        const tourDate = session.cr3ea_tourstartdate || requestTime;
        const dateFormatted = tourDate ? moment(tourDate).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY");
        const timeFormatted = tourDate ? moment(tourDate).format("hh:mm A") : moment().format("hh:mm A");

        setVal("header-date", dateFormatted);
        setVal("header-time", timeFormatted);

        const currentDayEl = document.getElementById("currentDay");
        if (currentDayEl) currentDayEl.innerText = `• ${dateFormatted}`;

        const shiftBadgeEl = document.getElementById("shiftBadge");
        if (shiftBadgeEl) shiftBadgeEl.innerText = shift || "Shift 1";

        setVal("header-exec-prod", prodExec);
        setVal("header-line", line);
        setVal("header-shift", shift);
        setVal("header-prev-product", prevProduct);
        setVal("header-new-product", newProduct);
        setVal("header-exec-qual", qaExec);
        const shiftExecDisplay = document.getElementById("shift-executive-display");
        if (shiftExecDisplay) shiftExecDisplay.innerText = prodExec || "N/A";

        const qaDisplay = document.getElementById("qa-executive-display");
        const qaDisplayWrapper = document.getElementById("qa-executive-display-wrapper");
        if (qaExec && qaDisplay) {
            qaDisplay.innerText = qaExec;
            if (qaDisplayWrapper) qaDisplayWrapper.style.display = "inline-block";
        } else if (qaDisplayWrapper) {
            qaDisplayWrapper.style.display = "none";
        }

        // Trigger Select2 updates so dropdown selections render correctly
        if (window.jQuery && $.fn.select2) {
            $("#header-line").trigger("change");
            $("#header-shift").trigger("change");
            $("#header-prev-product").trigger("change");
            $("#header-new-product").trigger("change");
        }
    },

    // Register button click events
    bindEvents: function () {
        const bindClick = (id, fn) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener("click", fn);
        };

        // Dashboard Start Session Button
        bindClick("btn-start-new-session", () => {
            ALC_StateMachine.transitionTo(ALC_STATES.INIT_PRODUCTION);
            ALC_QARequest.init();
        });

        // Step 2 Submission
        bindClick("btn-submit-request", () => ALC_QARequest.submitRequest());

        // Step 4 Accept
        bindClick("btn-accept-request", () => ALC_QARequest.acceptRequest());

        // Step 7 Checklist Submission
        bindClick("submit-alc-btn", () => ALC_Checklist.submitChecklist());

        // Step 12 Production resubmit
        bindClick("btn-submit-corrective-actions", () => ALC_CorrectiveAction.submitActions());

        // Step 13 QA Re-verification submit
        bindClick("btn-submit-reverification", () => ALC_ReVerification.submitReverification());
    }
};

// Global state changed event listener
window.onStateChanged = async function (newState, role) {
    console.log(`UI State Changed: ${newState}`);

    // Automatically trigger loads when transitioning to action views
    if (newState === ALC_STATES.PRODUCTION_ACTION) {
        ALC_CorrectiveAction.loadFailedItems();
    } else if (newState === ALC_STATES.QA_REVERIFYING) {
        ALC_ReVerification.loadReverificationItems();
    } else if (newState === ALC_STATES.QA_CHECKLIST) {
        ALC_Checklist.renderChecklist();
        await ALC_Checklist.loadSavedCheckpoints();
    }
};
