// Central Power Automate Notification Integration for ALC
console.log("ALC Notification Module loaded");

// Replace this placeholder with the actual Power Automate Flow HTTP trigger URL
const ALC_NOTIFICATION_FLOW_URL = "https://default8efa5ce286e44882840cf2578cdf09.4c.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/14/workflows/a60198cce93940a2b4ab778d1ba39e04/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kJNXOOocZbvwbjuFQx2uNiZ_TXNWnX7wfBpH6nk_Ilg";

const ALC_Notification = {
    // Helper to send JSON payloads to Power Automate
    sendNotificationFlow: async function (payload) {
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
                throw new Error(`Failed response status: ${response.status}`);
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
        const name = session.cr3ea_shiftexecutiveproduction;
        if (!name) return "";

        // 1. Try resolving using SharePoint configurations list
        let activeConfigs = [];
        if (configs && configs.length > 0) {
            activeConfigs = configs;
        } else if (typeof ALC_StateMachine !== "undefined" && ALC_StateMachine.configs) {
            activeConfigs = ALC_StateMachine.configs;
        } else if (typeof PKGOPS_QARequest !== "undefined" && PKGOPS_QARequest.qaList) {
            activeConfigs = PKGOPS_QARequest.qaList;
        }

        if (activeConfigs.length > 0) {
            for (const config of activeConfigs) {
                if (config.AssignedUser && config.AssignedUser.results) {
                    const user = config.AssignedUser.results.find(u => u.Title === name);
                    if (user && user.EMail) {
                        return user.EMail;
                    }
                }
            }
        }

        // 2. Fall back to current context if the logged-in user is the executive
        const currentEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";
        const currentName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
        if (currentName && name && currentName.toLowerCase().trim() === name.toLowerCase().trim() && currentEmail) {
            return currentEmail;
        }

        return "";
    },

    // Parse escalation contact emails from the saved comma-separated string in Dataverse
    parseEscalationEmails: function (session) {
        if (!session || !session.cr3ea_escalation_contacts) return [];
        return session.cr3ea_escalation_contacts
            .split(",")
            .map(e => e.trim())
            .filter(e => e.includes("@"));
    },

    // 1. Triggered on initial Tour request submission
    sendSubmitRequest: async function (session, qaEmail, escalationEmails) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": "SUBMIT_" + meta.prefix + "REQUEST",
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": session.cr3ea_prod_rajpura_quality_tourid || "N/A",
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa || "",
            "Score": "0.00",
            "Result": "Pending Score",
            "IsPass": false,
            "RecipientEmails": [qaEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa].filter(Boolean),
            "EscalationEmails": escalationEmails || []
        };
        await this.sendNotificationFlow(payload);
    },

    // 2. Triggered on QA initial verification submission
    sendVerificationComplete: async function (session, score, result, isPass, configs) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session, configs);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const escalationEmails = this.parseEscalationEmails(session);

        // Build recipient list: always include Production and QA
        const recipients = [prodEmail, qaEmail].filter(Boolean);

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
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": session.cr3ea_prod_rajpura_quality_tourid || "N/A",
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
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
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": (meta.prefix === "ALC_") ? "RESUBMIT_REVERIFICATION_REQUEST" : ("RESUBMIT_" + meta.prefix + "REVERIFICATION_REQUEST"),
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": session.cr3ea_prod_rajpura_quality_tourid || "N/A",
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
            "Score": session.cr3ea_overall_score ? String(session.cr3ea_overall_score) + "%" : "Pending Score",
            "Result": stillPendingActions ? "Partial Action Submitted" : "All Actions Submitted",
            "IsPass": false,
            "RecipientEmails": [qaEmail].filter(Boolean),
            "EscalationEmails": []
        };
        await this.sendNotificationFlow(payload);
    },

    // 4. Triggered when QA completes re-verification
    sendReverificationComplete: async function (session, score, result, isPass) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";
        const escalationEmails = this.parseEscalationEmails(session);

        // Build recipient list
        const recipients = [prodEmail, qaEmail].filter(Boolean);

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
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": session.cr3ea_prod_rajpura_quality_tourid || "N/A",
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": qaEmail,
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
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);

        let escList = Array.isArray(escalationEmails) && escalationEmails.length > 0
            ? escalationEmails
            : this.parseEscalationEmails(session);

        const resolvedQaEmail = qaEmail || session.cr3ea_tourby || session.cr3ea_assigned_qa || "";

        // Build recipient list: Escalation Managers are primary recipients, with Production Executive and QA Executive included
        const recipients = [...escList];
        if (prodEmail && !recipients.includes(prodEmail)) {
            recipients.push(prodEmail);
        }
        if (resolvedQaEmail && !recipients.includes(resolvedQaEmail)) {
            recipients.push(resolvedQaEmail);
        }

        const meta = this.resolveChecklistMeta(session);
        const payload = {
            "Scenario": meta.prefix + "ESCALATION",
            "ParentChecklistType": meta.parentType,
            "ChecklistType": meta.type,
            "TourId": session.cr3ea_prod_rajpura_quality_tourid || "N/A",
            "Line": line,
            "Shift": shift,
            "PrevProduct": session.cr3ea_previousrunningvariety || "N/A",
            "NewProduct": session.cr3ea_runningvariety || "N/A",
            "ProductionExecutiveName": prodName,
            "ProductionExecutiveEmail": prodEmail,
            "QAExecutiveEmail": resolvedQaEmail,
            "Score": "0.00",
            "Result": "Escalated",
            "IsPass": false,
            "NotificationType": "Informational",
            "ActionRequired": "None - Informational Only. Shift Executive can reassign QA Executive.",
            "RecipientEmails": recipients.length > 0 ? recipients : [resolvedQaEmail].filter(Boolean),
            "EscalationEmails": escList,
            "Comments": "QA Executive did not accept the clearance request within the 5-minute limit. This notification is sent to the Escalation Manager for informational purposes only. No action is required from the Escalation Manager."
        };
        await this.sendNotificationFlow(payload);
    }
};
