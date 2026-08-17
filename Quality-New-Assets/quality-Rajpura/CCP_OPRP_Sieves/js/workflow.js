// Workflow and Deviation State Machine for Rajpura CCP, OPRP, Sieves & Magnets Quality form
console.log("CCP_OPRP_Sieves Workflow loaded");

const CCP_OPRP_Workflow = {
    // 1. Raise deviation alerts and trigger SharePoint notification flows
    notifyProductionDepartment: async function (record) {
        console.log(`Raising deviation for checkpoint: ${record.cr3ea_checkpointname}`);
        
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        if (!webUrl) {
            console.log("Mocking Production email notification: QA has flagged a deviation on " + record.cr3ea_checkpointname);
            return;
        }

        try {
            // Find Line config to notify Production Incharges
            const line = record.cr3ea_location || "Sieves & Magnets";
            const config = CCP_OPRP_Main.configList.find(c => 
                (c.Title === line || line === "Sieves & Magnets" || c.Title === "Line-1" /* fallback */) &&
                (c.ConfigType === "CCP_OPRP" || c.ConfigType === "Sieves_Magnets" || c.ConfigType === "Sieves and Magnets")
            );
            
            if (config && config.ProductionIncharge && config.ProductionIncharge.results) {
                const emails = config.ProductionIncharge.results.map(p => p.EMail).filter(Boolean);
                if (emails.length > 0) {
                    await this.sendNotificationEmail(emails, record);
                }
            }
        } catch (e) {
            console.warn("Failed to dispatch deviation email: ", e);
        }
    },

    // 2. Overdue Cycle Escalation (8-hour window)
    checkEscalationStatus: async function (cycleRecord) {
        const checkTimeStr = cycleRecord.cr3ea_tourstartdate; // format: MM-DD-YYYY or timestamp
        if (!checkTimeStr) return;

        const checkTime = new Date(checkTimeStr).getTime();
        const now = new Date().getTime();
        const eightHours = 8 * 60 * 60 * 1000;

        if (now - checkTime > eightHours && cycleRecord.cr3ea_escalated !== "Yes") {
            console.warn(`Cycle ${cycleRecord.cr3ea_cycle} is overdue by 8 hours. Triggering escalation!`);
            
            // Update Dataverse flag
            const payload = {
                cr3ea_escalated: "Yes",
                cr3ea_deviationstatus: "Escalated"
            };
            
            const idField = "cr3ea_prod_rajpura_ccpoprpid";
            if (cycleRecord[idField]) {
                await CCP_OPRP_DAL.saveChecklistItem({
                    [idField]: cycleRecord[idField],
                    ...payload
                }, "CCP");
            }
            
            // Notify managers
            await this.notifyEscalationManagers(cycleRecord);
        }
    },

    notifyEscalationManagers: async function (record) {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        if (!webUrl) {
            console.log("Mocking manager escalation: Cycle is overdue by 8 hours!");
            return;
        }

        try {
            const line = record.cr3ea_location;
            const config = CCP_OPRP_Main.configList.find(c => c.Title === line && c.ConfigType === "CCP_OPRP");
            
            if (config && config.EscalationManager && config.EscalationManager.results) {
                const emails = config.EscalationManager.results.map(m => m.EMail).filter(Boolean);
                if (emails.length > 0) {
                    console.log(`Sending escalation email to managers: ${emails.join(", ")}`);
                }
            }
        } catch (e) {
            console.warn("Escalation email trigger failed: ", e);
        }
    },

    sendNotificationEmail: async function (recipientEmails, record) {
        // SharePoint Utility Email dispatch endpoint
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const emailUrl = `${webUrl}/_api/SP.Utilities.Utility.SendEmail`;

        const bodyText = `
            Dear Production Team,<br/><br/>
            A quality deviation has been logged during the CCP/OPRP Plant Tour.<br/><br/>
            <strong>Details:</strong><br/>
            - Cycle: ${record.cr3ea_cycle}<br/>
            - Line: ${record.cr3ea_location}<br/>
            - Checkpoint: ${record.cr3ea_checkpointname}<br/>
            - Deviation Details: ${record.cr3ea_defectremarks}<br/>
            - Initial Corrective Action Taken: ${record.cr3ea_actiontaken || "None stated"}<br/><br/>
            Please review and take corrective actions immediately.
        `;

        const payload = {
            'properties': {
                '__metadata': { 'type': 'SP.Utilities.EmailProperties' },
                'To': { 'results': recipientEmails },
                'Subject': `Quality Tour Deviation: ${record.cr3ea_checkpointname} (Line ${record.cr3ea_location})`,
                'Body': bodyText
            }
        };

        const headers = {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json;odata=verbose",
            "X-RequestDigest": document.getElementById("__REQUESTDIGEST")?.value || ""
        };

        await fetch(emailUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
    }
};
