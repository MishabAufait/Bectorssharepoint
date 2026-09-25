// Central Power Automate Notification Integration for ALC
console.log("ALC Notification Module loaded");

// Replace this placeholder with the actual Power Automate Flow HTTP trigger URL
const ALC_NOTIFICATION_FLOW_URL = "https://86c49df27027e13c808b32506fa981.d1.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/12/workflows/42a6c8814f9f4479b348f034f1084f99/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rd6tp8DE5TveTIWR97PfKAKQRcH2d9qQ4BAUyGhHDm4";

const ALC_Notification = {
    // In-memory cache for resolved user emails
    _userEmailCache: {},

    // Helper: extracts a valid email address from any string or claim (e.g. "i:0#.f|membership|user@bectors.com")
    extractEmail: function (val) {
        if (!val) return "";
        const str = (typeof val === "string") ? val.trim() : (val.EMail || val.email || val.Email || val.Name || val.name || val.UserName || val.LoginName || val.UserPrincipalName || "");
        if (!str || typeof str !== "string") return "";
        const match = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match && match[0]) {
            return match[0].toLowerCase();
        }
        return "";
    },

    // Validates whether an email is a syntactically valid email address
    isValidEmail: function (email) {
        if (!email || typeof email !== "string") return false;
        const trimmed = email.trim().toLowerCase();
        return Boolean(trimmed.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
    },

    // Validates email validity (alias for backward compatibility)
    isDummyEmail: function (email) {
        return !this.isValidEmail(email);
    },

    // Sanitizes outgoing payload to strictly adhere to Power Automate Flow JSON trigger schema
    sanitizePayload: function (rawPayload) {
        const payload = (rawPayload && typeof rawPayload === "object") ? { ...rawPayload } : {};

        // Required String Properties
        payload.Scenario = String(payload.Scenario || "UNKNOWN_SCENARIO").trim();
        payload.ParentChecklistType = String(payload.ParentChecklistType || "Area_Line_Clearance").trim();
        payload.ChecklistType = String(payload.ChecklistType || "Area Line Clearance").trim();
        payload.TourId = String(payload.TourId || "N/A").trim();
        payload.Line = String(payload.Line || "N/A").trim();
        payload.Shift = String(payload.Shift || "N/A").trim();

        // Sanitize string email properties: eliminate dummy emails
        const emailFields = [
            "ProductionExecutiveEmail",
            "QAExecutiveEmail",
            "QAShiftExecutiveEmail",
            "AcceptedByQA"
        ];
        emailFields.forEach(field => {
            if (payload[field]) {
                const extracted = this.extractEmail(payload[field]);
                payload[field] = extracted || (String(payload[field]).includes("@") ? "" : String(payload[field]).trim());
            }
        });

        // Required Array Property: RecipientEmails (strip out dummy/mock emails)
        if (!Array.isArray(payload.RecipientEmails)) {
            payload.RecipientEmails = payload.RecipientEmails ? [String(payload.RecipientEmails)] : [];
        }
        payload.RecipientEmails = payload.RecipientEmails
            .map(e => this.extractEmail(e))
            .filter(Boolean);

        // Optional Array Properties: EscalationEmails
        if (!Array.isArray(payload.EscalationEmails)) {
            payload.EscalationEmails = [];
        } else {
            payload.EscalationEmails = payload.EscalationEmails
                .map(e => this.extractEmail(e))
                .filter(Boolean);
        }

        // Optional Array Properties: TopManagementEmails
        if (!Array.isArray(payload.TopManagementEmails)) {
            payload.TopManagementEmails = [];
        } else {
            payload.TopManagementEmails = payload.TopManagementEmails
                .map(e => this.extractEmail(e))
                .filter(Boolean);
        }

        if (!Array.isArray(payload.CriticalFailures)) {
            payload.CriticalFailures = [];
        }
        if (!Array.isArray(payload.CategoryADefects)) {
            payload.CategoryADefects = [];
        }

        // Clean any null or undefined values to avoid schema mismatch errors (Status 400)
        for (const key of Object.keys(payload)) {
            const val = payload[key];
            if (val === null || val === undefined) {
                if (key.startsWith("Is") || key === "IsPass") {
                    payload[key] = false;
                } else {
                    payload[key] = "";
                }
            } else if (typeof val === "number") {
                if (key.includes("Score") || key.includes("Result") || key.includes("Delay")) {
                    payload[key] = String(val);
                }
            }
        }

        return payload;
    },

    // Resolves Tour GUID across all schema variants
    resolveTourId: function (session) {
        if (!session) return "N/A";
        if (typeof QualityRajpura_Config !== "undefined" && typeof QualityRajpura_Config.getTourId === "function") {
            const id = QualityRajpura_Config.getTourId(session);
            if (id) return String(id).replace(/[{}]/g, "").trim();
        }
        const id = session.cr3ea_prod_rajpura_quality_tourid || 
                   session.cr3ea_rajpura_quality_tourid || 
                   session.cr3ea_prod_rajpura_quality_toursid || 
                   session.cr3ea_rajpura_quality_toursid || 
                   session.cr3ea_qualitytourid || 
                   session.id || 
                   "";
        return id ? String(id).replace(/[{}]/g, "").trim() : "N/A";
    },

    // Helper to send JSON payloads to Power Automate
    sendNotificationFlow: async function (rawPayload) {
        const payload = this.sanitizePayload(rawPayload);
        console.log("ALC_Notification: Outgoing notification payload:", payload);

        // Fetch flow URL dynamically based on environment
        const flowUrl = (typeof QualityRajpura_Config !== "undefined" && typeof QualityRajpura_Config.getCurrentConfig === "function")
            ? QualityRajpura_Config.getCurrentConfig().FLOW_URL
            : ALC_NOTIFICATION_FLOW_URL;

        if (!flowUrl || flowUrl.includes("EXAMPLE_WORKFLOW_ID") || flowUrl.includes("placeholder")) {
            console.warn("ALC_Notification: Power Automate flow URL is not configured. Outgoing payload logged above.");
            return;
        }

        try {
            const response = await fetch(flowUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed response status ${response.status} (${response.statusText}): ${errText}`);
            }
            console.log("ALC_Notification: Sent to Power Automate successfully.");
        } catch (error) {
            console.error("ALC_Notification: Error triggering Power Automate webhook:", error);
        }
    },

    // Dynamic resolution of Checklist metadata from the session object
    resolveChecklistMeta: function (session) {
        if (!session) {
            return {
                prefix: "ALC_",
                parentType: "Area_Line_Clearance",
                type: "Area Line Clearance"
            };
        }

        const title = String(session.cr3ea_title || "").toLowerCase();
        
        // 1. Packaging Operations
        if (session.cr3ea_pkgops_type) {
            return {
                prefix: "PKGOPS_",
                parentType: "Packaging_Operations",
                type: session.cr3ea_pkgops_type
            };
        }
        if (title.startsWith("pkgops_") || title.includes("pkgops")) {
            return {
                prefix: "PKGOPS_",
                parentType: "Packaging_Operations",
                type: "Packaging Operations"
            };
        }

        // 2. Food Safety Checklists
        if (session.cr3ea_food_safety_checklisttype) {
            return {
                prefix: "FOODSAFETY_",
                parentType: "Food_Safety",
                type: session.cr3ea_food_safety_checklisttype
            };
        }
        if (title.startsWith("foodsafety_") || title.startsWith("food_safety_") || title.includes("ppe_") || title.includes("gmp_") || title.includes("pci_")) {
            let type = "Food Safety Checklist";
            if (title.includes("ppe_")) type = "PPE Checklist";
            else if (title.includes("gmp_")) type = "GMP Checklist";
            else if (title.includes("pci_")) type = "PCI Checklist";
            return {
                prefix: "FOODSAFETY_",
                parentType: "Food_Safety",
                type: type
            };
        }

        // 3. CCP, OPRP & Sieves
        if (session.cr3ea_ccp_oprp_sieves_parametertype) {
            return {
                prefix: "CCP_",
                parentType: "CCP_OPRP_Sieves_Magnets",
                type: session.cr3ea_ccp_oprp_sieves_parametertype
            };
        }
        if (title.includes("ccp_") || title.includes("sieves_") || title.includes("sieves") || title.includes("magnet")) {
            let type = "CCP, OPRP & Sieves Monitoring";
            if (title.includes("sieves_") || title.includes("sieves") || title.includes("magnet")) type = "Sieves & Magnets Monitoring";
            else if (title.includes("ccp_") || title.includes("oprp")) type = "CCP & OPRP Checklist";
            return {
                prefix: "CCP_",
                parentType: "CCP_OPRP_Sieves_Magnets",
                type: type
            };
        }

        // 4. Mixing & Baking
        if (title.startsWith("mixingbaking_") || title.includes("mixingbaking") || title.includes("mixing_baking") || title.includes("mixing") || title.includes("baking")) {
            return {
                prefix: "MIXINGBAKING_",
                parentType: "Mixing_Baking",
                type: "Mixing & Baking"
            };
        }

        // 5. Default is Area Line Clearance (ALC)
        return {
            prefix: "ALC_",
            parentType: "Area_Line_Clearance",
            type: "Area Line Clearance"
        };
    },

    // Collect all active in-memory configurations and employee directories
    _collectAllActiveConfigs: function (passedConfigs) {
        const list = [];
        if (passedConfigs && Array.isArray(passedConfigs) && passedConfigs.length > 0) {
            list.push(...passedConfigs);
        }
        if (typeof PKGOPS_StateMachine !== "undefined" && Array.isArray(PKGOPS_StateMachine.configs)) {
            list.push(...PKGOPS_StateMachine.configs);
        }
        if (typeof PKGOPS_DAL !== "undefined" && Array.isArray(PKGOPS_DAL.configs)) {
            list.push(...PKGOPS_DAL.configs);
        }
        if (typeof ALC_StateMachine !== "undefined" && Array.isArray(ALC_StateMachine.configs)) {
            list.push(...ALC_StateMachine.configs);
        }
        if (typeof ALC_QARequest !== "undefined" && Array.isArray(ALC_QARequest.qaMatrix)) {
            list.push(...ALC_QARequest.qaMatrix);
        }
        if (typeof PKGOPS_QARequest !== "undefined" && Array.isArray(PKGOPS_QARequest.qaList)) {
            list.push(...PKGOPS_QARequest.qaList);
        }
        if (typeof FOODSAFETY_StateMachine !== "undefined" && Array.isArray(FOODSAFETY_StateMachine.configs)) {
            list.push(...FOODSAFETY_StateMachine.configs);
        }
        if (typeof CCP_StateMachine !== "undefined" && Array.isArray(CCP_StateMachine.configs)) {
            list.push(...CCP_StateMachine.configs);
        }
        if (typeof MIXING_StateMachine !== "undefined" && Array.isArray(MIXING_StateMachine.configs)) {
            list.push(...MIXING_StateMachine.configs);
        }
        if (typeof BAKING_StateMachine !== "undefined" && Array.isArray(BAKING_StateMachine.configs)) {
            list.push(...BAKING_StateMachine.configs);
        }
        if (typeof Rajpura_Admin !== "undefined" && Rajpura_Admin.configs) {
            Object.values(Rajpura_Admin.configs).forEach(cfgArr => {
                if (Array.isArray(cfgArr)) list.push(...cfgArr);
            });
        }
        if (typeof QualityRajpura_Config !== "undefined" && Array.isArray(QualityRajpura_Config.configs)) {
            list.push(...QualityRajpura_Config.configs);
        }
        return list;
    },

    // Universal Asynchronous User Email Resolver
    resolveUserEmailAsync: async function (userVal, configs, session) {
        if (!userVal && session) {
            userVal = session.cr3ea_shiftexecutiveproduction || 
                      session.cr3ea_tourby || 
                      session.cr3ea_assigned_qa || 
                      session.cr3ea_observedby || 
                      session.cr3ea_production_incharge || 
                      session.cr3ea_executivename || 
                      "";
        }
        if (!userVal) return "";

        const siteUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
            ? _spPageContextInfo.webAbsoluteUrl
            : (typeof QualityRajpura_Config !== 'undefined' && typeof QualityRajpura_Config.getSiteBaseUrl === 'function' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS");

        // If userVal is an object (e.g. SharePoint Person object)
        if (typeof userVal === "object") {
            const objDirectEmail = this.extractEmail(userVal);
            if (objDirectEmail) return objDirectEmail;

            // If user object has Id, query getuserbyid directly from SharePoint
            const uId = userVal.Id || userVal.id || userVal.spUserId || userVal.ID;
            if (uId) {
                try {
                    const uRes = await fetch(`${siteUrl}/_api/web/getuserbyid(${uId})?$select=Id,Title,Email,LoginName,UserPrincipalName`, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (uRes.ok) {
                        const uData = await uRes.json();
                        const spUser = uData.d || uData;
                        const spEmail = this.extractEmail(spUser.Email || spUser.EMail || spUser.LoginName || spUser.UserPrincipalName);
                        if (spEmail) {
                            const k = String(userVal.Title || userVal.title || uId).toLowerCase();
                            this._userEmailCache[k] = spEmail;
                            return spEmail;
                        }
                    }
                } catch (uidErr) {
                    console.warn("ALC_Notification: Error resolving getuserbyid:", uidErr);
                }
            }

            userVal = userVal.Title || userVal.title || userVal.Name || userVal.name || String(uId || "");
        }

        const rawStr = String(userVal).trim();
        if (!rawStr || rawStr === "N/A" || rawStr.toLowerCase() === "unknown") return "";

        // 1. Direct check: extract email from string
        const directEmail = this.extractEmail(rawStr);
        if (directEmail) {
            return directEmail;
        }

        const lookupKey = rawStr.toLowerCase();
        if (this._userEmailCache[lookupKey]) {
            return this._userEmailCache[lookupKey];
        }

        // 2. Search all in-memory config matrices
        const allConfigs = this._collectAllActiveConfigs(configs);
        for (const config of allConfigs) {
            const userGroups = [
                config.AssignedUser?.results || (Array.isArray(config.AssignedUser) ? config.AssignedUser : (config.AssignedUser ? [config.AssignedUser] : [])),
                config.assignedUsers || [],
                config.ProductionIncharge?.results || (Array.isArray(config.ProductionIncharge) ? config.ProductionIncharge : (config.ProductionIncharge ? [config.ProductionIncharge] : [])),
                config.productionIncharges || [],
                config.QAShiftExecutive?.results || (Array.isArray(config.QAShiftExecutive) ? config.QAShiftExecutive : (config.QAShiftExecutive ? [config.QAShiftExecutive] : [])),
                config.qaShiftExecutives || [],
                config.EscalationManager?.results || (Array.isArray(config.EscalationManager) ? config.EscalationManager : (config.EscalationManager ? [config.EscalationManager] : [])),
                config.escalationManagers || [],
                config.QAExecutives || [],
                config.Admins?.results || (Array.isArray(config.Admins) ? config.Admins : (config.Admins ? [config.Admins] : []))
            ];

            for (const grp of userGroups) {
                for (const u of grp) {
                    if (!u) continue;
                    const uTitle = (u.Title || u.title || "").trim().toLowerCase();
                    const uName = (u.Name || u.name || "").trim().toLowerCase();
                    const uEmail = this.extractEmail(u);
                    const uId = String(u.Id || u.id || u.spUserId || "");

                    if (uEmail) {
                        if (uTitle === lookupKey || uName === lookupKey || uId === lookupKey ||
                            (uTitle && lookupKey.includes(uTitle)) || (lookupKey && uTitle.includes(lookupKey)) ||
                            (uName && lookupKey.includes(uName)) || (uEmail.split("@")[0] === lookupKey)) {
                            this._userEmailCache[lookupKey] = uEmail;
                            return uEmail;
                        }
                    }
                }
            }
        }

        // 3. Search master EmployeeList directories if loaded in memory
        const employeeDirs = [
            (typeof PKGOPS_DAL !== "undefined" && Array.isArray(PKGOPS_DAL.employees)) ? PKGOPS_DAL.employees : [],
            (typeof Rajpura_Admin !== "undefined" && Array.isArray(Rajpura_Admin.employees)) ? Rajpura_Admin.employees : []
        ];
        for (const dir of employeeDirs) {
            for (const emp of dir) {
                if (!emp) continue;
                const empTitle = (emp.title || emp.Title || "").trim().toLowerCase();
                const empEmail = this.extractEmail(emp.email || emp.EMail);
                if (empEmail) {
                    if (empTitle === lookupKey || empTitle.includes(lookupKey) || lookupKey.includes(empTitle) || empEmail.split("@")[0] === lookupKey) {
                        this._userEmailCache[lookupKey] = empEmail;
                        return empEmail;
                    }
                }
            }
        }

        // 4. Match against current SharePoint logged-in user context
        if (typeof _spPageContextInfo !== "undefined") {
            const currentName = (_spPageContextInfo.userDisplayName || "").trim().toLowerCase();
            const currentLogin = (_spPageContextInfo.userLoginName || "").trim().toLowerCase();
            const currentEmail = this.extractEmail(_spPageContextInfo.userEmail) || this.extractEmail(_spPageContextInfo.userLoginName);

            if (currentEmail) {
                if (currentName === lookupKey || lookupKey.includes(currentName) || currentName.includes(lookupKey) ||
                    currentLogin.includes(lookupKey) || lookupKey.includes(currentLogin.split("@")[0])) {
                    this._userEmailCache[lookupKey] = currentEmail;
                    return currentEmail;
                }
            }
        }

        // 5. Query SharePoint REST API directly for site user / employee lookup
        try {
            // 5a. Query Site Users
            const encKey = encodeURIComponent(rawStr);
            const userUrl = `${siteUrl}/_api/web/siteusers?$filter=substringof('${encKey}',Title) or substringof('${encKey}',Email) or substringof('${encKey}',LoginName)&$top=5`;
            const res = await fetch(userUrl, { headers: { "Accept": "application/json; odata=verbose" } });
            if (res.ok) {
                const data = await res.json();
                const users = (data.d && data.d.results) ? data.d.results : (data.value || []);
                for (const u of users) {
                    const email = this.extractEmail(u.Email || u.EMail || u.LoginName || u.UserPrincipalName);
                    if (email) {
                        this._userEmailCache[lookupKey] = email;
                        return email;
                    }
                }
            }
        } catch (spUserErr) {
            console.warn("ALC_Notification: Error resolving user from siteusers:", spUserErr);
        }

        try {
            // 5b. Query EmployeeList
            const encKey = encodeURIComponent(rawStr);
            const empUrl = `${siteUrl}/_api/web/lists/getByTitle('EmployeeList')/items?$select=Title,EmployeeName/Title,EmployeeName/EMail&$expand=EmployeeName&$filter=substringof('${encKey}',Title) or substringof('${encKey}',EmployeeName/Title)&$top=5`;
            const res = await fetch(empUrl, { headers: { "Accept": "application/json; odata=verbose" } });
            if (res.ok) {
                const data = await res.json();
                const items = (data.d && data.d.results) ? data.d.results : (data.value || []);
                for (const item of items) {
                    const emp = item.EmployeeName || {};
                    const email = this.extractEmail(emp.EMail || emp.Email || emp.Title);
                    if (email) {
                        this._userEmailCache[lookupKey] = email;
                        return email;
                    }
                }
            }
        } catch (empErr) {
            console.warn("ALC_Notification: Error resolving user from EmployeeList:", empErr);
        }

        // 6. Query SharePoint Site User Information List (hidden list supporting substringof)
        try {
            const encKey = encodeURIComponent(rawStr);
            const userUrl = `${siteUrl}/_api/web/siteuserinfolist/items?$select=Id,Title,EMail,Name,UserName&$filter=substringof('${encKey}',Title) or substringof('${encKey}',Name) or substringof('${encKey}',EMail)&$top=5`;
            const res = await fetch(userUrl, { headers: { "Accept": "application/json; odata=verbose" } });
            if (res.ok) {
                const data = await res.json();
                const users = (data.d && data.d.results) ? data.d.results : (data.value || []);
                for (const u of users) {
                    const email = this.extractEmail(u.EMail || u.Name || u.UserName || u.Title);
                    if (email) {
                        this._userEmailCache[lookupKey] = email;
                        return email;
                    }
                }
            }
        } catch (spUserErr) {
            console.warn("ALC_Notification: Error resolving user from siteuserinfolist:", spUserErr);
        }

        // 7. Context-based Line/Shift fallback: find matching line/shift config
        if (session && (session.cr3ea_lineno || session.cr3ea_shift)) {
            const line = String(session.cr3ea_lineno || "").trim().toLowerCase();
            const shift = String(session.cr3ea_shift || "").trim().toLowerCase();
            for (const config of allConfigs) {
                const cfgLine = String(config.LineNo || config.Line || config.cr3ea_lineno || "").trim().toLowerCase();
                const cfgShift = String(config.Shift || config.cr3ea_shift || "").trim().toLowerCase();
                if ((!line || cfgLine === line || cfgLine.includes(line)) && (!shift || cfgShift === shift || cfgShift.includes(shift))) {
                    const fallbackUsers = [
                        ...(config.ProductionIncharge?.results || (config.ProductionIncharge ? [config.ProductionIncharge] : [])),
                        ...(config.AssignedUser?.results || (config.AssignedUser ? [config.AssignedUser] : [])),
                        ...(config.productionIncharges || []),
                        ...(config.assignedUsers || [])
                    ];
                    for (const u of fallbackUsers) {
                        const email = this.extractEmail(u);
                        if (email) {
                            this._userEmailCache[lookupKey] = email;
                            return email;
                        }
                    }
                }
            }
        }

        // 8. Absolute fallback: current logged in user
        if (typeof _spPageContextInfo !== "undefined") {
            const fallbackEmail = this.extractEmail(_spPageContextInfo.userLoginName) || this.extractEmail(_spPageContextInfo.userEmail);
            if (fallbackEmail) {
                return fallbackEmail;
            }
        }

        return "";
    },

    // Synchronous fallback resolver (calls cache or in-memory configs)
    resolveUserEmail: function (userVal, configs, session) {
        if (!userVal && session) {
            userVal = session.cr3ea_shiftexecutiveproduction || 
                      session.cr3ea_tourby || 
                      session.cr3ea_assigned_qa || 
                      session.cr3ea_observedby || 
                      session.cr3ea_production_incharge || 
                      "";
        }
        if (!userVal) return "";
        if (typeof userVal === "object") {
            const objEmail = (userVal.EMail || userVal.email || userVal.Email || "").trim().toLowerCase();
            if (objEmail && objEmail.includes("@") && !this.isDummyEmail(objEmail)) return objEmail;
            userVal = userVal.Title || userVal.title || userVal.Name || userVal.name || "";
        }
        const rawStr = String(userVal).trim();
        if (rawStr.includes("@") && !this.isDummyEmail(rawStr)) return rawStr.toLowerCase();
        const lookupKey = rawStr.toLowerCase();
        if (this._userEmailCache[lookupKey]) return this._userEmailCache[lookupKey];

        const allConfigs = this._collectAllActiveConfigs(configs);
        for (const config of allConfigs) {
            const userGroups = [
                config.AssignedUser?.results || (Array.isArray(config.AssignedUser) ? config.AssignedUser : (config.AssignedUser ? [config.AssignedUser] : [])),
                config.assignedUsers || [],
                config.ProductionIncharge?.results || (Array.isArray(config.ProductionIncharge) ? config.ProductionIncharge : (config.ProductionIncharge ? [config.ProductionIncharge] : [])),
                config.productionIncharges || [],
                config.QAShiftExecutive?.results || (Array.isArray(config.QAShiftExecutive) ? config.QAShiftExecutive : (config.QAShiftExecutive ? [config.QAShiftExecutive] : [])),
                config.qaShiftExecutives || [],
                config.QAExecutives || []
            ];
            for (const grp of userGroups) {
                for (const u of grp) {
                    if (!u) continue;
                    const uTitle = (u.Title || u.title || "").trim().toLowerCase();
                    const uEmail = (u.EMail || u.email || u.Email || "").trim().toLowerCase();
                    if (uEmail && uEmail.includes("@") && !this.isDummyEmail(uEmail)) {
                        if (uTitle === lookupKey || uTitle.includes(lookupKey) || lookupKey.includes(uTitle)) {
                            this._userEmailCache[lookupKey] = uEmail;
                            return uEmail;
                        }
                    }
                }
            }
        }

        if (typeof _spPageContextInfo !== "undefined" && _spPageContextInfo.userEmail) {
            const currentName = (_spPageContextInfo.userDisplayName || "").trim().toLowerCase();
            if (currentName === lookupKey || lookupKey.includes(currentName) || currentName.includes(lookupKey)) {
                return _spPageContextInfo.userEmail.trim().toLowerCase();
            }
        }

        return "";
    },

    // Dynamic resolution of Production Executive email
    resolveProductionExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || session.cr3ea_production_incharge || session.cr3ea_shiftexecutive;
        return this.resolveUserEmail(name, configs, session);
    },

    resolveProductionExecutiveEmailAsync: async function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || session.cr3ea_production_incharge || session.cr3ea_shiftexecutive;
        return await this.resolveUserEmailAsync(name, configs, session);
    },

    // Dynamic resolution of Production Executive display name
    resolveProductionExecutiveName: function (session, configs) {
        if (!session) return "Production Executive";
        const rawName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || session.cr3ea_production_incharge || session.cr3ea_shiftexecutive || "Production Executive";
        if (!rawName.includes("@")) return rawName;

        const allConfigs = this._collectAllActiveConfigs(configs);
        for (const config of allConfigs) {
            const users = [
                ...(config.ProductionIncharge?.results || (config.ProductionIncharge ? [config.ProductionIncharge] : [])),
                ...(config.AssignedUser?.results || (config.AssignedUser ? [config.AssignedUser] : [])),
                ...(config.productionIncharges || []),
                ...(config.assignedUsers || [])
            ];
            for (const user of users) {
                const uEmail = (user.EMail || user.email || "").toLowerCase();
                if (uEmail && uEmail === rawName.toLowerCase() && (user.Title || user.title)) {
                    return user.Title || user.title;
                }
            }
        }

        // Fallback: format email prefix "mishab.m@..." -> "Mishab M"
        const prefix = rawName.split("@")[0].trim().replace(/[._]/g, " ");
        return prefix.replace(/\b\w/g, l => l.toUpperCase());
    },

    // Dynamic resolution of QA Executive email
    resolveQAExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const rawQa = session.cr3ea_tourby || session.cr3ea_assigned_qa || session.cr3ea_qaexecutive || session.cr3ea_executivename || "";
        const email = this.resolveUserEmail(rawQa, configs, session);
        if (email) return email;
        if (typeof _spPageContextInfo !== "undefined" && _spPageContextInfo.userEmail && !this.isDummyEmail(_spPageContextInfo.userEmail)) {
            return _spPageContextInfo.userEmail.trim().toLowerCase();
        }
        return "";
    },

    resolveQAExecutiveEmailAsync: async function (session, configs) {
        if (!session) return "";
        const rawQa = session.cr3ea_tourby || session.cr3ea_assigned_qa || session.cr3ea_qaexecutive || session.cr3ea_executivename || "";
        const email = await this.resolveUserEmailAsync(rawQa, configs, session);
        if (email) return email;
        if (typeof _spPageContextInfo !== "undefined" && _spPageContextInfo.userEmail && !this.isDummyEmail(_spPageContextInfo.userEmail)) {
            return _spPageContextInfo.userEmail.trim().toLowerCase();
        }
        return "";
    },

    // Dynamic resolution of QA Shift Executive email from SharePoint configurations or session
    resolveQAShiftExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality;
        return this.resolveUserEmail(name, configs, session);
    },

    resolveQAShiftExecutiveEmailAsync: async function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality;
        return await this.resolveUserEmailAsync(name, configs, session);
    },

    // Parse escalation contact emails from Dataverse session or fall back to configured escalation managers
    parseEscalationEmails: function (session, configs) {
        if (!session) return [];
        const emails = [];

        // 1. If explicit escalation contacts string is present in session
        if (session.cr3ea_escalation_contacts) {
            const rawStr = String(session.cr3ea_escalation_contacts).split("||")[0].trim();
            rawStr.split(",").forEach(e => {
                const clean = e.trim().toLowerCase();
                if (clean.includes("@") && !this.isDummyEmail(clean) && !emails.includes(clean)) {
                    emails.push(clean);
                }
            });
        }

        // 2. Fallback: retrieve escalation managers from active configs matching line & shift
        if (emails.length === 0) {
            const allConfigs = this._collectAllActiveConfigs(configs);
            const line = String(session.cr3ea_lineno || "").trim().toLowerCase();
            const shift = String(session.cr3ea_shift || "").trim().toLowerCase();

            for (const config of allConfigs) {
                const cfgLine = String(config.LineNo || config.Line || config.cr3ea_lineno || "").trim().toLowerCase();
                const cfgShift = String(config.Shift || config.cr3ea_shift || "").trim().toLowerCase();
                const matchesLine = !line || !cfgLine || cfgLine === line || cfgLine.includes(line) || cfgLine === "all lines";
                const matchesShift = !shift || !cfgShift || cfgShift === shift || cfgShift.includes(shift) || cfgShift === "all shifts";

                if (matchesLine && matchesShift) {
                    const mgrs = [
                        ...(config.EscalationManager?.results || (config.EscalationManager ? [config.EscalationManager] : [])),
                        ...(config.escalationManagers || []),
                        ...(config.ProductionIncharge?.results || (config.ProductionIncharge ? [config.ProductionIncharge] : [])),
                        ...(config.productionIncharges || [])
                    ];
                    for (const m of mgrs) {
                        const email = (m?.EMail || m?.email || m?.Email || "").trim().toLowerCase();
                        if (email && email.includes("@") && !this.isDummyEmail(email) && !emails.includes(email)) {
                            emails.push(email);
                        }
                    }
                }
            }
        }

        return emails;
    },

    resolveEscalationEmailsAsync: async function (session, configs) {
        const emails = this.parseEscalationEmails(session, configs);
        if (emails.length > 0) return emails;

        // Try resolving individual escalation names via universal resolver
        const allConfigs = this._collectAllActiveConfigs(configs);
        for (const config of allConfigs) {
            const mgrs = [
                ...(config.EscalationManager?.results || (config.EscalationManager ? [config.EscalationManager] : [])),
                ...(config.escalationManagers || [])
            ];
            for (const m of mgrs) {
                const resolved = await this.resolveUserEmailAsync(m, configs, session);
                if (resolved && !emails.includes(resolved)) {
                    emails.push(resolved);
                }
            }
        }
        return emails;
    },

    // 1. Triggered on initial Tour request submission
    sendSubmitRequest: async function (session, qaEmail, escalationEmails, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const resolvedQaEmail = (qaEmail && qaEmail.includes("@")) ? qaEmail.trim().toLowerCase() : await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);

        const recipients = [resolvedQaEmail].filter(Boolean);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        const meta = this.resolveChecklistMeta(session);
        const resolvedEscalationEmails = (escalationEmails && escalationEmails.length > 0) 
            ? escalationEmails 
            : await this.resolveEscalationEmailsAsync(session, configs);

        const payload = {
            "Scenario": "SUBMIT_" + meta.prefix + "REQUEST",
            "NotificationCategory": "Normal",
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": resolvedQaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "Score": "0.00",
            "Result": "Pending Score",
            "IsPass": false,
            "RecipientEmails": recipients.length > 0 ? recipients : [resolvedQaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": resolvedEscalationEmails
        };
        await this.sendNotificationFlow(payload);
    },

    // 2. Triggered on QA initial verification submission
    sendVerificationComplete: async function (session, score, result, isPass, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const qaEmail = await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);
        const escalationEmails = await this.resolveEscalationEmailsAsync(session, configs);

        const audit = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.parseEscalationAudit)
            ? QualityRajpura_Config.parseEscalationAudit(session)
            : null;

        // Build recipient list: always include Production and QA
        const recipients = [prodEmail, qaEmail].filter(Boolean);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        // If check fails, append escalation managers to the recipient list
        if (!isPass && escalationEmails.length > 0) {
            escalationEmails.forEach(email => {
                if (!recipients.includes(email)) {
                    recipients.push(email);
                }
            });
        }

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": (meta.prefix === "ALC_") ? "INITIAL_VERIFICATION_COMPLETE" : (meta.prefix + "VERIFICATION_COMPLETE"),
            "NotificationCategory": "Normal",
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "RequestRaisedAt": audit && audit.tourStartTime ? (typeof moment !== 'undefined' ? moment(audit.tourStartTime).format("DD-MM-YYYY hh:mm A") : audit.tourStartTime) : (session.cr3ea_tourstartdate ? (typeof moment !== 'undefined' ? moment(session.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : session.cr3ea_tourstartdate) : "N/A"),
            "EscalationThreshold": audit && audit.escalationThresholdTime ? (typeof moment !== 'undefined' ? moment(audit.escalationThresholdTime).format("DD-MM-YYYY hh:mm A") + " (Expired)" : "Expired") : "N/A",
            "QAAcceptedAt": audit && audit.acceptedTime ? (typeof moment !== 'undefined' ? moment(audit.acceptedTime).format("DD-MM-YYYY hh:mm A") : audit.acceptedTime) : "N/A",
            "DelayDuration": audit ? `${audit.delayMinutes || 0} Minutes` : "0 Minutes",
            "AcceptedByQA": audit ? `${audit.acceptedByName || qaEmail} (${audit.acceptedByEmail || qaEmail})` : qaEmail,
            "Score": String(score) + "%",
            "Result": result || "Fail",
            "IsPass": isPass,
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": escalationEmails
        };
        await this.sendNotificationFlow(payload);
    },

    // 3. Triggered when Resubmitting corrective actions
    sendResubmitRequest: async function (session, stillPendingActions, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const qaEmail = await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);

        const recipients = [qaEmail].filter(Boolean);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": (meta.prefix === "ALC_") ? "RESUBMIT_REVERIFICATION_REQUEST" : ("RESUBMIT_" + meta.prefix + "REVERIFICATION_REQUEST"),
            "NotificationCategory": "Normal",
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "Score": session.cr3ea_overall_score ? String(session.cr3ea_overall_score) + "%" : "Pending Score",
            "Result": stillPendingActions ? "Partial Action Submitted" : "All Actions Submitted",
            "IsPass": false,
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": []
        };
        await this.sendNotificationFlow(payload);
    },

    // 4. Triggered when QA completes re-verification
    sendReverificationComplete: async function (session, score, result, isPass, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const qaEmail = await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);
        const escalationEmails = await this.resolveEscalationEmailsAsync(session, configs);

        const audit = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.parseEscalationAudit)
            ? QualityRajpura_Config.parseEscalationAudit(session)
            : null;

        // Build recipient list
        const recipients = [prodEmail, qaEmail].filter(Boolean);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        // If fails, append escalation managers to CC/recipients
        if (!isPass && escalationEmails.length > 0) {
            escalationEmails.forEach(email => {
                if (!recipients.includes(email)) {
                    recipients.push(email);
                }
            });
        }

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": (meta.prefix === "ALC_") ? "REVERIFICATION_COMPLETE" : (meta.prefix + "REVERIFICATION_COMPLETE"),
            "NotificationCategory": "Normal",
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "RequestRaisedAt": audit && audit.tourStartTime ? (typeof moment !== 'undefined' ? moment(audit.tourStartTime).format("DD-MM-YYYY hh:mm A") : audit.tourStartTime) : (session.cr3ea_tourstartdate ? (typeof moment !== 'undefined' ? moment(session.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : session.cr3ea_tourstartdate) : "N/A"),
            "EscalationThreshold": audit && audit.escalationThresholdTime ? (typeof moment !== 'undefined' ? moment(audit.escalationThresholdTime).format("DD-MM-YYYY hh:mm A") + " (Expired)" : "Expired") : "N/A",
            "QAAcceptedAt": audit && audit.acceptedTime ? (typeof moment !== 'undefined' ? moment(audit.acceptedTime).format("DD-MM-YYYY hh:mm A") : audit.acceptedTime) : "N/A",
            "DelayDuration": audit ? `${audit.delayMinutes || 0} Minutes` : "0 Minutes",
            "AcceptedByQA": audit ? `${audit.acceptedByName || qaEmail} (${audit.acceptedByEmail || qaEmail})` : qaEmail,
            "Score": String(score) + "%",
            "Result": result || "Fail",
            "IsPass": isPass,
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": escalationEmails
        };
        await this.sendNotificationFlow(payload);
    },

    // 5. Triggered when QA acceptance timer expires and session is escalated
    sendEscalationNotification: async function (session, qaEmail, escalationEmails, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const resolvedQaEmail = (qaEmail && qaEmail.includes("@")) ? qaEmail.trim().toLowerCase() : await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);

        let escList = Array.isArray(escalationEmails) && escalationEmails.length > 0
            ? escalationEmails
            : await this.resolveEscalationEmailsAsync(session, configs);

        // Build recipient list: Escalation Managers are primary recipients, with Production Executive and QA Executive included
        const recipients = [...escList];
        if (prodEmail && !recipients.includes(prodEmail)) {
            recipients.push(prodEmail);
        }
        if (resolvedQaEmail && !recipients.includes(resolvedQaEmail)) {
            recipients.push(resolvedQaEmail);
        }
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        const meta = this.resolveChecklistMeta(session);
        const reqTime = session.cr3ea_tourstartdate || session.createdon;
        const reqTimeFormatted = reqTime ? (typeof moment !== 'undefined' ? moment(reqTime).format("DD-MM-YYYY hh:mm A") : reqTime) : "N/A";
        const thresholdTime = reqTime ? (typeof moment !== 'undefined' ? moment(new Date(new Date(reqTime).getTime() + 5 * 60 * 1000)).format("DD-MM-YYYY hh:mm A") : "5 Minutes Limit") : "5 Minutes Limit";

        const payload = {
            "Scenario": meta.prefix + "ESCALATION",
            "NotificationCategory": "Escalation",
            "IsEscalation": true,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": resolvedQaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "RequestRaisedAt": reqTimeFormatted,
            "EscalationThreshold": thresholdTime + " (Expired)",
            "Score": "0.00",
            "Result": "Escalated",
            "IsPass": false,
            "NotificationType": "Informational",
            "ActionRequired": "None - Informational Only. Shift Executive can reassign QA Executive or QA can accept.",
            "RecipientEmails": recipients.length > 0 ? recipients : [resolvedQaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": escList,
            "Comments": "QA Executive did not accept the clearance request within the 5-minute limit. This notification is sent to the Escalation Manager for informational purposes only. No action is required from the Escalation Manager."
        };
        await this.sendNotificationFlow(payload);
    },

    // 6. Triggered when QA accepts a request post-escalation / delayed
    sendPostEscalationAcceptanceNotification: async function (session, auditObj, escalationEmails, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);

        let escList = Array.isArray(escalationEmails) && escalationEmails.length > 0
            ? escalationEmails
            : await this.resolveEscalationEmailsAsync(session, configs);

        const audit = auditObj || (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.parseEscalationAudit ? QualityRajpura_Config.parseEscalationAudit(session) : null) || {};

        const qaEmail = audit.acceptedByEmail || await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaDisplayName = audit.acceptedByName || qaEmail;
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);

        const reqTimeFormatted = audit.tourStartTime ? (typeof moment !== 'undefined' ? moment(audit.tourStartTime).format("DD-MM-YYYY hh:mm A") : audit.tourStartTime) : (session.cr3ea_tourstartdate ? (typeof moment !== 'undefined' ? moment(session.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : session.cr3ea_tourstartdate) : "N/A");
        const thresholdFormatted = audit.escalationThresholdTime ? (typeof moment !== 'undefined' ? moment(audit.escalationThresholdTime).format("DD-MM-YYYY hh:mm A") + " (Expired)" : "5 Minutes Limit Expired") : "5 Minutes Limit Expired";
        const acceptedTimeFormatted = audit.acceptedTime ? (typeof moment !== 'undefined' ? moment(audit.acceptedTime).format("DD-MM-YYYY hh:mm A") : audit.acceptedTime) : (typeof moment !== 'undefined' ? moment().format("DD-MM-YYYY hh:mm A") : "Just now");
        const delayMins = (audit.delayMinutes !== undefined && audit.delayMinutes !== null) ? audit.delayMinutes : 0;
        const delayFormatted = `${delayMins} Minutes`;

        // Build recipient list: Escalation Managers, Production Executive, QA Executive, and QA Shift Executive
        const recipients = [...escList];
        if (prodEmail && !recipients.includes(prodEmail)) recipients.push(prodEmail);
        if (qaEmail && !recipients.includes(qaEmail)) recipients.push(qaEmail);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) recipients.push(qaShiftEmail);

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": meta.prefix + "POST_ESCALATION_ACCEPTED",
            "NotificationCategory": "Post-Escalation",
            "IsEscalation": false,
            "IsPostEscalation": true,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAExecutiveName": qaDisplayName,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "RequestRaisedAt": reqTimeFormatted,
            "EscalationThreshold": thresholdFormatted,
            "QAAcceptedAt": acceptedTimeFormatted,
            "DelayDuration": delayFormatted,
            "AcceptedByQA": `${qaDisplayName} (${qaEmail})`,
            "Score": "0.00",
            "Result": "Accepted (Delayed)",
            "IsPass": false,
            "NotificationType": "Informational",
            "ActionRequired": "None - Informational Only. Inspection has resumed.",
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "EscalationEmails": escList,
            "Comments": `QA Executive ${qaDisplayName} has accepted the line clearance request after escalation with a delay of ${delayMins} minute(s). Inspection is now in progress.`
        };
        await this.sendNotificationFlow(payload);
    },

    _topManagementCache: null,
    _topManagementCacheExpiry: 0,

    // Fetches configured Top Management emails from the SharePoint AdminPanel list with schema-resilient multi-probing
    fetchTopManagementEmails: async function (category) {
        const now = Date.now();
        if (this._topManagementCache && now < this._topManagementCacheExpiry) {
            return category === "ALC" ? (this._topManagementCache.alc || []) : (this._topManagementCache.general || []);
        }

        const siteUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
            ? _spPageContextInfo.webAbsoluteUrl
            : (typeof QualityRajpura_Config !== 'undefined' && typeof QualityRajpura_Config.getSiteBaseUrl === 'function' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS");

        const alcEmails = [];
        const genEmails = [];

        // Check if already in Rajpura_Admin state in-memory
        if (typeof Rajpura_Admin !== "undefined" && Rajpura_Admin.topManagementState) {
            (Rajpura_Admin.topManagementState.alcUsers || []).forEach(u => {
                const em = (u.email || u.EMail || "").trim().toLowerCase();
                if (em && em.includes("@") && !this.isDummyEmail(em) && !alcEmails.includes(em)) alcEmails.push(em);
            });
            (Rajpura_Admin.topManagementState.generalUsers || []).forEach(u => {
                const em = (u.email || u.EMail || "").trim().toLowerCase();
                if (em && em.includes("@") && !this.isDummyEmail(em) && !genEmails.includes(em)) genEmails.push(em);
            });
        }

        const listNames = ["AdminPanel", "Admin Panel", "Admin_Panel", "Admin_x0020_Panel"];
        let loaded = (alcEmails.length > 0 && genEmails.length > 0);

        for (const listName of listNames) {
            if (loaded) break;
            const queries = [
                "?$select=Id,Title,TopManagementALC/Id,TopManagementALC/Title,TopManagementALC/EMail,TopManagementALC/Name,TopManagementGeneral/Id,TopManagementGeneral/Title,TopManagementGeneral/EMail,TopManagementGeneral/Name&$expand=TopManagementALC,TopManagementGeneral&$top=5",
                "?$select=Id,Title,TopManagement_x0020_ALC/Id,TopManagement_x0020_ALC/Title,TopManagement_x0020_ALC/EMail,TopManagement_x0020_General/Id,TopManagement_x0020_General/Title,TopManagement_x0020_General/EMail&$expand=TopManagement_x0020_ALC,TopManagement_x0020_General&$top=5",
                "?$top=5"
            ];

            for (const q of queries) {
                try {
                    const endpoint = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${q}`;
                    const res = await fetch(endpoint, {
                        headers: {
                            "Accept": "application/json; odata=verbose",
                            "Content-Type": "application/json; odata=verbose"
                        }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const items = (data.d && data.d.results) ? data.d.results : (data.value || []);
                        if (items.length > 0) {
                            for (const item of items) {
                                // Extract ALC users
                                const rawAlc = item.TopManagementALC || item.TopManagement_x0020_ALC || item.TopManagementAlc;
                                const alcResults = rawAlc?.results || (Array.isArray(rawAlc) ? rawAlc : (rawAlc ? [rawAlc] : []));
                                for (const u of alcResults) {
                                    let email = this.extractEmail(u);
                                    if (!email) {
                                        email = await this.resolveUserEmailAsync(u);
                                    }
                                    if (email && !alcEmails.includes(email)) {
                                        alcEmails.push(email);
                                    }
                                }

                                // Extract General users
                                const rawGen = item.TopManagementGeneral || item.TopManagement_x0020_General || item.TopManagementgeneral || item.TopManagementTemplates || item.TopManagementOther;
                                const genResults = rawGen?.results || (Array.isArray(rawGen) ? rawGen : (rawGen ? [rawGen] : []));
                                for (const u of genResults) {
                                    let email = this.extractEmail(u);
                                    if (!email) {
                                        email = await this.resolveUserEmailAsync(u);
                                    }
                                    if (email && !genEmails.includes(email)) {
                                        genEmails.push(email);
                                    }
                                }

                                // Extract Admins as fallback
                                const rawAdmins = item.Admins || item.Admin || item.Administrators;
                                const adminResults = rawAdmins?.results || (Array.isArray(rawAdmins) ? rawAdmins : (rawAdmins ? [rawAdmins] : []));
                                for (const u of adminResults) {
                                    let email = this.extractEmail(u);
                                    if (!email) {
                                        email = await this.resolveUserEmailAsync(u);
                                    }
                                    if (email) {
                                        if (alcEmails.length === 0 && !alcEmails.includes(email)) alcEmails.push(email);
                                        if (genEmails.length === 0 && !genEmails.includes(email)) genEmails.push(email);
                                    }
                                }
                            }

                            if (alcEmails.length > 0 || genEmails.length > 0) {
                                loaded = true;
                                break;
                            }
                        }
                    }
                } catch (err) {
                    console.warn(`ALC_Notification: Could not fetch Top Management from '${listName}':`, err);
                }
            }
        }

        // Fallback: If AdminPanel is not configured yet in UAT, populate from configured Escalation Managers across all lines
        if (alcEmails.length === 0 || genEmails.length === 0) {
            const allConfigs = this._collectAllActiveConfigs();
            for (const config of allConfigs) {
                const mgrs = [
                    ...(config.EscalationManager?.results || (config.EscalationManager ? [config.EscalationManager] : [])),
                    ...(config.escalationManagers || [])
                ];
                for (const m of mgrs) {
                    const em = this.extractEmail(m);
                    if (em) {
                        if (alcEmails.length === 0 && !alcEmails.includes(em)) alcEmails.push(em);
                        if (genEmails.length === 0 && !genEmails.includes(em)) genEmails.push(em);
                    }
                }
            }
        }

        if (genEmails.length === 0 && alcEmails.length > 0) {
            genEmails.push(...alcEmails);
        }
        if (alcEmails.length === 0 && genEmails.length > 0) {
            alcEmails.push(...genEmails);
        }

        // Cache for 5 minutes
        this._topManagementCache = {
            alc: alcEmails,
            general: genEmails
        };
        this._topManagementCacheExpiry = now + 5 * 60 * 1000;

        return category === "ALC" ? alcEmails : genEmails;
    },

    // 7. Triggered on ALC Critical Gate failure
    sendCriticalGateFailureNotification: async function (session, failedCriticalItems, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const qaEmail = await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);
        const escalationEmails = await this.resolveEscalationEmailsAsync(session, configs);

        let topMgmtAlcEmails = [];
        try {
            topMgmtAlcEmails = await this.fetchTopManagementEmails("ALC");
        } catch (e) {
            console.warn("ALC_Notification: Failed fetching Top Management ALC emails:", e);
        }

        // Build combined recipients: Top Management (ALC) + QA Executive + Shift Production Executive + QA Shift Executive + Escalation Managers
        const recipients = [...topMgmtAlcEmails];
        if (qaEmail && !recipients.includes(qaEmail)) recipients.push(qaEmail);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) recipients.push(qaShiftEmail);
        if (prodEmail && !recipients.includes(prodEmail)) recipients.push(prodEmail);
        escalationEmails.forEach(email => {
            if (email && !recipients.includes(email)) recipients.push(email);
        });

        // Ensure at least one recipient exists to avoid flow execution failures
        if (recipients.length === 0) {
            const fallbackUser = this.extractEmail(typeof _spPageContextInfo !== 'undefined' ? (_spPageContextInfo.userLoginName || _spPageContextInfo.userEmail) : "");
            if (fallbackUser) recipients.push(fallbackUser);
        }
        if (topMgmtAlcEmails.length === 0 && recipients.length > 0) {
            topMgmtAlcEmails = [...recipients];
        }

        const items = Array.isArray(failedCriticalItems) ? failedCriticalItems : [];
        const formattedCritList = items.map(item => ({
            "Checkpoint": item.criteria || item.cr3ea_criteria || item.title || "Critical Checkpoint",
            "Score": item.score !== undefined ? String(item.score) : (item.cr3ea_defectcategory || "0"),
            "Remarks": item.remarks || item.defectremarks || item.cr3ea_defectremarks || item.scoreText || item.cr3ea_defectcategory || "Non-Compliant",
            "Area": item.area || item.cr3ea_area || ""
        }));

        const meta = this.resolveChecklistMeta(session);
        const overallScore = session.cr3ea_overall_score !== undefined ? String(session.cr3ea_overall_score) : "0";

        const payload = {
            "Scenario": "ALC_CRITICAL_GATE_FAILURE",
            "NotificationCategory": "Critical Gate Failure",
            "IsCriticalFailure": true,
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "Score": overallScore.includes("%") ? overallScore : (overallScore + "%"),
            "Result": "Failed - Critical Gate Violation",
            "IsPass": false,
            "FailedCriticalCount": formattedCritList.length,
            "CriticalFailures": formattedCritList,
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "TopManagementEmails": topMgmtAlcEmails,
            "EscalationEmails": escalationEmails,
            "NotificationType": "Critical Alert",
            "ActionRequired": "Immediate Corrective Action Required. Critical Gate parameter(s) failed during Area Line Clearance inspection.",
            "Comments": `Critical Gate violation detected in Area Line Clearance. ${formattedCritList.length} critical parameter(s) failed. Clearance cannot proceed until corrective actions are completed and re-verified.`
        };

        await this.sendNotificationFlow(payload);
    },

    // 8. Triggered when Category A (Critical) defect occurs in the other 4 Quality templates
    sendCategoryAFailureNotification: async function (session, categoryADefects, moduleMeta, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session, configs);
        const prodEmail = await this.resolveProductionExecutiveEmailAsync(session, configs);
        const qaEmail = await this.resolveQAExecutiveEmailAsync(session, configs);
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = await this.resolveQAShiftExecutiveEmailAsync(session, configs);
        const escalationEmails = await this.resolveEscalationEmailsAsync(session, configs);

        let topMgmtGenEmails = [];
        try {
            topMgmtGenEmails = await this.fetchTopManagementEmails("General");
        } catch (e) {
            console.warn("ALC_Notification: Failed fetching Top Management General emails:", e);
        }

        // Build combined recipients: Top Management (General) + QA Executive + QA Shift Executive + Production Incharge/Executive + Escalation Managers
        const recipients = [...topMgmtGenEmails];
        if (qaEmail && !recipients.includes(qaEmail)) recipients.push(qaEmail);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) recipients.push(qaShiftEmail);
        if (prodEmail && !recipients.includes(prodEmail)) recipients.push(prodEmail);
        escalationEmails.forEach(email => {
            if (email && !recipients.includes(email)) recipients.push(email);
        });

        // Ensure at least one recipient exists to avoid flow execution failures
        if (recipients.length === 0) {
            const fallbackUser = this.extractEmail(typeof _spPageContextInfo !== 'undefined' ? (_spPageContextInfo.userLoginName || _spPageContextInfo.userEmail) : "");
            if (fallbackUser) recipients.push(fallbackUser);
        }
        if (topMgmtGenEmails.length === 0 && recipients.length > 0) {
            topMgmtGenEmails = [...recipients];
        }

        const defects = Array.isArray(categoryADefects) ? categoryADefects : [];
        const formattedDefects = defects.map(d => ({
            "DefectTitle": d.name || d.title || d.defectType || d.criteria || "Category A Critical Defect",
            "Severity": "Category A (Critical)",
            "DefectCount": d.count !== undefined ? d.count : (d.defectCount !== undefined ? d.defectCount : 1),
            "Remarks": d.remarks || d.defectRemarks || d.description || "",
            "Area": d.area || d.machine || d.subType || ""
        }));

        const meta = moduleMeta || this.resolveChecklistMeta(session);
        const overallScore = session.cr3ea_overall_score !== undefined ? String(session.cr3ea_overall_score) : "0";

        const payload = {
            "Scenario": meta.prefix + "CATEGORY_A_CRITICAL_FAILURE",
            "NotificationCategory": "Category A Critical Defect",
            "IsCriticalFailure": true,
            "IsEscalation": false,
            "IsPostEscalation": false,
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": this.resolveTourId(session),
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "QAShiftExecutiveName": qaShiftName || "N/A",
            "QAShiftExecutiveEmail": qaShiftEmail || "",
            "Score": overallScore.includes("%") ? overallScore : (overallScore + "%"),
            "Result": "Failed - Category A Defect Present",
            "IsPass": false,
            "CategoryADefectsCount": formattedDefects.length,
            "CategoryADefects": formattedDefects,
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail || prodEmail].filter(Boolean),
            "TopManagementEmails": topMgmtGenEmails,
            "EscalationEmails": escalationEmails,
            "NotificationType": "Critical Alert",
            "ActionRequired": "Immediate Attention Required. Category A (Critical) defect recorded during quality inspection.",
            "Comments": `Category A Critical Defect recorded in ${meta.type}. ${formattedDefects.length} critical defect(s) detected. Production corrective action required.`
        };

        await this.sendNotificationFlow(payload);
    }
};

