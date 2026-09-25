// Central Power Automate Notification Integration for ALC
console.log("ALC Notification Module loaded");

// Replace this placeholder with the actual Power Automate Flow HTTP trigger URL
const ALC_NOTIFICATION_FLOW_URL = "https://86c49df27027e13c808b32506fa981.d1.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/12/workflows/42a6c8814f9f4479b348f034f1084f99/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=rd6tp8DE5TveTIWR97PfKAKQRcH2d9qQ4BAUyGhHDm4";

const ALC_Notification = {
    // Validates whether an email is a dummy/mock placeholder
    isDummyEmail: function (email) {
        if (!email || typeof email !== "string") return true;
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes("@") || !trimmed.includes(".")) return true;
        const dummyDomains = [
            "bectorfoods.com",
            "example.com",
            "test.com",
            "sample.com",
            "invalid.com",
            "temp.com",
            "localhost",
            "domain.com"
        ];
        const parts = trimmed.split("@");
        if (parts.length !== 2) return true;
        const domain = parts[1];
        if (dummyDomains.some(d => domain === d || domain.endsWith("." + d))) return true;
        const dummyKeywords = ["dummy", "fake", "placeholder", "mockuser", "testuser", "nobody"];
        if (dummyKeywords.some(k => trimmed.includes(k))) return true;
        return false;
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
                const val = String(payload[field]).trim();
                if (val.includes("(") && val.includes(")")) {
                    const match = val.match(/\(([^)]+)\)/);
                    if (match && match[1] && this.isDummyEmail(match[1])) {
                        payload[field] = val.split("(")[0].trim() || "";
                    }
                } else if (val.includes("@") && this.isDummyEmail(val)) {
                    payload[field] = "";
                }
            }
        });

        // Required Array Property: RecipientEmails (strip out dummy/mock emails)
        if (!Array.isArray(payload.RecipientEmails)) {
            payload.RecipientEmails = payload.RecipientEmails ? [String(payload.RecipientEmails)] : [];
        }
        payload.RecipientEmails = payload.RecipientEmails
            .map(e => (typeof e === "string" ? e.trim().toLowerCase() : ""))
            .filter(e => e.includes("@") && !this.isDummyEmail(e));

        // Optional Array Properties: EscalationEmails
        if (!Array.isArray(payload.EscalationEmails)) {
            payload.EscalationEmails = [];
        } else {
            payload.EscalationEmails = payload.EscalationEmails
                .map(e => (typeof e === "string" ? e.trim().toLowerCase() : ""))
                .filter(e => e.includes("@") && !this.isDummyEmail(e));
        }

        // Optional Array Properties: TopManagementEmails
        if (!Array.isArray(payload.TopManagementEmails)) {
            payload.TopManagementEmails = [];
        } else {
            payload.TopManagementEmails = payload.TopManagementEmails
                .map(e => (typeof e === "string" ? e.trim().toLowerCase() : ""))
                .filter(e => e.includes("@") && !this.isDummyEmail(e));
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

    // Dynamic resolution of Production Executive email from SharePoint configurations or context
    resolveProductionExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby;
        if (!name) return "";
        if (typeof name === "string" && name.includes("@")) {
            if (!this.isDummyEmail(name)) {
                return name.trim().toLowerCase();
            }
        }

        // 1. Try resolving using SharePoint configurations list
        let activeConfigs = [];
        if (configs && configs.length > 0) {
            activeConfigs = configs;
        } else if (typeof ALC_StateMachine !== "undefined" && ALC_StateMachine.configs) {
            activeConfigs = ALC_StateMachine.configs;
        } else if (typeof ALC_QARequest !== "undefined" && ALC_QARequest.qaMatrix) {
            activeConfigs = ALC_QARequest.qaMatrix;
        } else if (typeof PKGOPS_QARequest !== "undefined" && PKGOPS_QARequest.qaList) {
            activeConfigs = PKGOPS_QARequest.qaList;
        }

        if (activeConfigs.length > 0) {
            for (const config of activeConfigs) {
                if (config.AssignedUser && config.AssignedUser.results) {
                    const user = config.AssignedUser.results.find(u => u.Title === name || (u.Title && name.includes(u.Title)));
                    if (user && user.EMail && !this.isDummyEmail(user.EMail)) {
                        return user.EMail.trim().toLowerCase();
                    }
                }
                if (config.ProductionIncharge && config.ProductionIncharge.results) {
                    const user = config.ProductionIncharge.results.find(u => u.Title === name || (u.Title && name.includes(u.Title)));
                    if (user && user.EMail && !this.isDummyEmail(user.EMail)) {
                        return user.EMail.trim().toLowerCase();
                    }
                }
            }
        }

        // 2. Fall back to current context if the logged-in user is the executive
        const currentEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";
        const currentName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
        if (currentName && name && currentName.toLowerCase().trim() === name.toLowerCase().trim() && currentEmail) {
            if (!this.isDummyEmail(currentEmail)) {
                return currentEmail.trim().toLowerCase();
            }
        }

        return "";
    },

    // Dynamic resolution of Production Executive display name
    resolveProductionExecutiveName: function (session, configs) {
        if (!session) return "Unknown";
        const rawName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        if (!rawName.includes("@")) return rawName;

        let activeConfigs = [];
        if (configs && configs.length > 0) {
            activeConfigs = configs;
        } else if (typeof ALC_StateMachine !== "undefined" && ALC_StateMachine.configs) {
            activeConfigs = ALC_StateMachine.configs;
        } else if (typeof ALC_QARequest !== "undefined" && ALC_QARequest.qaMatrix) {
            activeConfigs = ALC_QARequest.qaMatrix;
        } else if (typeof PKGOPS_QARequest !== "undefined" && PKGOPS_QARequest.qaList) {
            activeConfigs = PKGOPS_QARequest.qaList;
        }

        if (activeConfigs.length > 0) {
            for (const config of activeConfigs) {
                if (config.AssignedUser && config.AssignedUser.results) {
                    const user = config.AssignedUser.results.find(u => u.EMail && u.EMail.toLowerCase() === rawName.toLowerCase());
                    if (user && user.Title) return user.Title;
                }
            }
        }

        // Fallback: format email prefix "mishab.m@..." -> "Mishab M"
        const prefix = rawName.split("@")[0].trim().replace(/[._]/g, " ");
        return prefix.replace(/\b\w/g, l => l.toUpperCase());
    },

    // Dynamic resolution of QA Shift Executive email from SharePoint configurations or session
    resolveQAShiftExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality;
        if (!name) return "";
        if (name.includes("@") && !this.isDummyEmail(name)) return name.trim().toLowerCase();

        let activeConfigs = [];
        if (configs && configs.length > 0) {
            activeConfigs = configs;
        } else if (typeof ALC_StateMachine !== "undefined" && ALC_StateMachine.configs) {
            activeConfigs = ALC_StateMachine.configs;
        } else if (typeof ALC_QARequest !== "undefined" && ALC_QARequest.qaMatrix) {
            activeConfigs = ALC_QARequest.qaMatrix;
        } else if (typeof PKGOPS_QARequest !== "undefined" && PKGOPS_QARequest.qaList) {
            activeConfigs = PKGOPS_QARequest.qaList;
        }

        if (activeConfigs.length > 0) {
            for (const config of activeConfigs) {
                // Check QAShiftExecutive results
                if (config.QAShiftExecutive && config.QAShiftExecutive.results) {
                    const user = config.QAShiftExecutive.results.find(u => u.Title === name || (u.Title && name.includes(u.Title)));
                    if (user && user.EMail && !this.isDummyEmail(user.EMail)) return user.EMail.trim().toLowerCase();
                }
                // Check AssignedUser results
                if (config.AssignedUser && config.AssignedUser.results) {
                    const user = config.AssignedUser.results.find(u => u.Title === name || (u.Title && name.includes(u.Title)));
                    if (user && user.EMail && !this.isDummyEmail(user.EMail)) return user.EMail.trim().toLowerCase();
                }
            }
        }

        return "";
    },

    // Parse escalation contact emails from the saved comma-separated string in Dataverse (ALC only)
    parseEscalationEmails: function (session) {
        if (!session) return [];
        const meta = this.resolveChecklistMeta(session);
        // Escalation managers are exclusively applicable to Area Line Clearance (ALC)
        if (meta.prefix !== "ALC_" && meta.parentType !== "ALC") {
            return [];
        }
        if (!session.cr3ea_escalation_contacts) return [];
        if (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.parseEscalationContacts) {
            return QualityRajpura_Config.parseEscalationContacts(session.cr3ea_escalation_contacts);
        }
        if (typeof QualityRajpura_Utils !== 'undefined' && QualityRajpura_Utils.parseEscalationContacts) {
            return QualityRajpura_Utils.parseEscalationContacts(session.cr3ea_escalation_contacts);
        }
        const rawStr = String(session.cr3ea_escalation_contacts).split("||")[0].trim();
        return rawStr
            .split(",")
            .map(e => e.trim().toLowerCase())
            .filter(e => e.includes("@") && !this.isDummyEmail(e));
    },

    // 1. Triggered on initial Tour request submission
    sendSubmitRequest: async function (session, qaEmail, escalationEmails) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session);
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const resolvedQaEmail = qaEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session);

        const recipients = [resolvedQaEmail].filter(Boolean);
        if (qaShiftEmail && !recipients.includes(qaShiftEmail)) {
            recipients.push(qaShiftEmail);
        }

        const meta = this.resolveChecklistMeta(session);
        const isALC = (meta.prefix === "ALC_" || meta.parentType === "ALC");
        const resolvedEscalationEmails = isALC ? (escalationEmails || []) : [];

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
            "RecipientEmails": recipients,
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
        const prodEmail = this.resolveProductionExecutiveEmail(session, configs);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session, configs);
        const escalationEmails = this.parseEscalationEmails(session);

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
            "RecipientEmails": recipients,
            "EscalationEmails": escalationEmails
        };
        await this.sendNotificationFlow(payload);
    },

    // 3. Triggered when Resubmitting corrective actions
    sendResubmitRequest: async function (session, stillPendingActions) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session);
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session);

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
            "RecipientEmails": recipients,
            "EscalationEmails": []
        };
        await this.sendNotificationFlow(payload);
    },

    // 4. Triggered when QA completes re-verification
    sendReverificationComplete: async function (session, score, result, isPass) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session);
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session);
        const escalationEmails = this.parseEscalationEmails(session);

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
            "RecipientEmails": recipients,
            "EscalationEmails": escalationEmails
        };
        await this.sendNotificationFlow(payload);
    },

    // 5. Triggered when QA acceptance timer expires and session is escalated
    sendEscalationNotification: async function (session, qaEmail, escalationEmails) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session);
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const resolvedQaEmail = qaEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session);

        let escList = Array.isArray(escalationEmails) && escalationEmails.length > 0
            ? escalationEmails
            : this.parseEscalationEmails(session);

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
            "RecipientEmails": recipients.length > 0 ? recipients : [resolvedQaEmail].filter(Boolean),
            "EscalationEmails": escList,
            "Comments": "QA Executive did not accept the clearance request within the 5-minute limit. This notification is sent to the Escalation Manager for informational purposes only. No action is required from the Escalation Manager."
        };
        await this.sendNotificationFlow(payload);
    },

    // 6. Triggered when QA accepts a request post-escalation / delayed
    sendPostEscalationAcceptanceNotification: async function (session, auditObj, escalationEmails) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = this.resolveProductionExecutiveName(session);
        const prodEmail = this.resolveProductionExecutiveEmail(session);

        let escList = Array.isArray(escalationEmails) && escalationEmails.length > 0
            ? escalationEmails
            : this.parseEscalationEmails(session);

        const audit = auditObj || (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.parseEscalationAudit ? QualityRajpura_Config.parseEscalationAudit(session) : null) || {};

        const qaEmail = audit.acceptedByEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaDisplayName = audit.acceptedByName || qaEmail;
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session);

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
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail].filter(Boolean),
            "EscalationEmails": escList,
            "Comments": `QA Executive ${qaDisplayName} has accepted the line clearance request after escalation with a delay of ${delayMins} minute(s). Inspection is now in progress.`
        };
        await this.sendNotificationFlow(payload);
    },

    _topManagementCache: null,
    _topManagementCacheExpiry: 0,

    // Fetches configured Top Management emails from the SharePoint AdminPanel list
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

        try {
            const endpoint = `${siteUrl}/_api/web/lists/getByTitle('AdminPanel')/items?$select=Id,Title,TopManagementALC/EMail,TopManagementALC/Title,TopManagementGeneral/EMail,TopManagementGeneral/Title&$expand=TopManagementALC,TopManagementGeneral&$top=1`;
            const res = await fetch(endpoint, {
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose"
                }
            });

            if (res.ok) {
                const data = await res.json();
                const item = data.d?.results?.[0] || data.d?.[0] || null;
                if (item) {
                    const rawAlc = item.TopManagementALC || item.TopManagement_x0020_ALC || item.TopManagementAlc;
                    const alcResults = rawAlc?.results || (Array.isArray(rawAlc) ? rawAlc : (rawAlc ? [rawAlc] : []));
                    alcResults.forEach(u => {
                        const email = (u.EMail || u.email || u.Email || "").trim().toLowerCase();
                        if (email && email.includes("@") && !alcEmails.includes(email)) {
                            alcEmails.push(email);
                        }
                    });

                    const rawGen = item.TopManagementGeneral || item.TopManagement_x0020_General || item.TopManagementgeneral;
                    const genResults = rawGen?.results || (Array.isArray(rawGen) ? rawGen : (rawGen ? [rawGen] : []));
                    genResults.forEach(u => {
                        const email = (u.EMail || u.email || u.Email || "").trim().toLowerCase();
                        if (email && email.includes("@") && !genEmails.includes(email)) {
                            genEmails.push(email);
                        }
                    });
                }
            }
        } catch (err) {
            console.warn("ALC_Notification: Could not fetch Top Management emails from AdminPanel:", err);
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
        const prodEmail = this.resolveProductionExecutiveEmail(session, configs);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session, configs);
        const escalationEmails = this.parseEscalationEmails(session);

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
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail].filter(Boolean),
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
        const prodEmail = this.resolveProductionExecutiveEmail(session, configs);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const qaShiftName = session.cr3ea_executivename || session.cr3ea_shiftexecutivequality || "";
        const qaShiftEmail = this.resolveQAShiftExecutiveEmail(session, configs);
        const escalationEmails = this.parseEscalationEmails(session);

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
            "RecipientEmails": recipients.length > 0 ? recipients : [qaEmail].filter(Boolean),
            "TopManagementEmails": topMgmtGenEmails,
            "EscalationEmails": escalationEmails,
            "NotificationType": "Critical Alert",
            "ActionRequired": "Immediate Attention Required. Category A (Critical) defect recorded during quality inspection.",
            "Comments": `Category A Critical Defect recorded in ${meta.type}. ${formattedDefects.length} critical defect(s) detected. Production corrective action required.`
        };

        await this.sendNotificationFlow(payload);
    }
};
