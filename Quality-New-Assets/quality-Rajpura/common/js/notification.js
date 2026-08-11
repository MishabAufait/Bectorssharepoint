// Central Power Automate Notification Integration for ALC
console.log("ALC Notification Module loaded");

// Replace this placeholder with the actual Power Automate Flow HTTP trigger URL
const ALC_NOTIFICATION_FLOW_URL = "https://86c49df27027e13c808b32506fa981.d1.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/11/workflows/EXAMPLE_WORKFLOW_ID/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=EXAMPLE_SIGNATURE";

const ALC_Notification = {
    // Helper to send JSON payloads to Power Automate
    sendNotificationFlow: async function (payload) {
        console.log("ALC_Notification: Outgoing notification payload:", payload);
        
        if (!ALC_NOTIFICATION_FLOW_URL || ALC_NOTIFICATION_FLOW_URL.includes("EXAMPLE_WORKFLOW_ID")) {
            console.warn("ALC_Notification: Power Automate flow URL is not configured. Outgoing payload logged above.");
            return;
        }

        try {
            const response = await fetch(ALC_NOTIFICATION_FLOW_URL, {
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

    // Dynamic resolution of Production Executive email from SharePoint configurations or context
    resolveProductionExecutiveEmail: function (session, configs) {
        if (!session) return "";
        const name = session.cr3ea_shiftexecutiveproduction;
        if (!name) return "";

        // 1. Try resolving using SharePoint configurations list
        const activeConfigs = configs || ALC_StateMachine.configs || [];
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

    // 1. Triggered on initial ALC Tour request submission
    sendSubmitRequest: async function (session, qaEmail, escalationEmails) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);

        const payload = {
            "Scenario": "SUBMIT_ALC_REQUEST",
            "TourId": session.cr3ea_prod_qualitytourid || "N/A",
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

        const payload = {
            "Scenario": "INITIAL_VERIFICATION_COMPLETE",
            "TourId": session.cr3ea_prod_qualitytourid || "N/A",
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

    // 3. Triggered when Production resubmits corrective actions
    sendResubmitRequest: async function (session, stillPendingActions) {
        if (!session) return;
        const line = session.cr3ea_lineno || "N/A";
        const shift = session.cr3ea_shift || "N/A";
        const prodName = session.cr3ea_shiftexecutiveproduction || session.cr3ea_observedby || "Unknown";
        const prodEmail = this.resolveProductionExecutiveEmail(session);
        const qaEmail = session.cr3ea_tourby || session.cr3ea_assigned_qa || "";

        const payload = {
            "Scenario": "RESUBMIT_REVERIFICATION_REQUEST",
            "TourId": session.cr3ea_prod_qualitytourid || "N/A",
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

        const payload = {
            "Scenario": "REVERIFICATION_COMPLETE",
            "TourId": session.cr3ea_prod_qualitytourid || "N/A",
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
    }
};
