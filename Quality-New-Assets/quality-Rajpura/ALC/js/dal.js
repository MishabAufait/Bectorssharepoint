// Data Access Layer for Rajpura Quality forms
console.log("ALC DAL loaded");

const ALC_DAL = {
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.ALC;

        // Try first schema (no spaces in internal names)
        let query = "?$select=Id,Title,ConfigType,Region,Plant,Area," +
            "AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id," +
            "EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id" +
            "&$expand=AssignedUser,EscalationManager" +
            "&$filter=Plant eq 'Rajpura'";

        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (!response.ok) throw new Error("Fallback needed");
        } catch (e) {
            // Try fallback schema (spaces encoded as _x0020_ in internal names)
            isFallback = true;
            query = "?$select=Id,Title,Config_x0020_Type,Region,Plant,Area," +
                "Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id," +
                "Escalation_x0020_Manager/Title,Escalation_x0020_Manager/EMail,Escalation_x0020_Manager/Id" +
                "&$expand=Assigned_x0020_User,Escalation_x0020_Manager" +
                "&$filter=Plant eq 'Rajpura'";
            url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch SharePoint config: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.d.results;

        // Map keys so the consumer doesn't have to care about internal name differences
        return results.map(item => {
            const rawUser = isFallback ? item.Assigned_x0020_User : item.AssignedUser;
            const rawManager = isFallback ? item.Escalation_x0020_Manager : item.EscalationManager;

            // Normalize AssignedUser to always have a 'results' array
            let assignedUserNormalized = { results: [] };
            if (rawUser) {
                if (rawUser.results && Array.isArray(rawUser.results)) {
                    assignedUserNormalized = rawUser;
                } else if (rawUser.Title || rawUser.EMail) {
                    assignedUserNormalized = { results: [rawUser] };
                }
            }

            // Normalize EscalationManager to always have a 'results' array
            let escalationManagerNormalized = { results: [] };
            if (rawManager) {
                if (rawManager.results && Array.isArray(rawManager.results)) {
                    escalationManagerNormalized = rawManager;
                } else if (rawManager.Title || rawManager.EMail) {
                    escalationManagerNormalized = { results: [rawManager] };
                }
            }

            return {
                Id: item.Id,
                Title: item.Title,
                ConfigType: isFallback ? item.Config_x0020_Type : item.ConfigType,
                Region: item.Region,
                Plant: item.Plant,
                Area: item.Area,
                AssignedUser: assignedUserNormalized,
                EscalationManager: escalationManagerNormalized
            };
        });
    },

    // Get Dataverse access token
    getAccessToken: async function () {
        if (typeof getAccessToken === "function") {
            return await getAccessToken();
        }
        // Fallback for local development or missing context
        const storedToken = JSON.parse(localStorage.getItem("access_token"));
        const currentTime = new Date().getTime() / 1000;
        if (storedToken && storedToken.expires_at > currentTime) {
            return storedToken.token;
        }
        return null;
    },

    // Fetch wrapper that handles token injection and 401 retries
    fetchWithToken: async function (url, options = {}) {
        let token = await this.getAccessToken();
        if (!options.headers) {
            options.headers = {};
        }
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }

        let response = await fetch(url, options);
        if (response.status === 401) {
            console.warn("ALC_DAL: 401 Unauthorized detected. Clearing cached token and retrying...");
            localStorage.removeItem("access_token");
            const freshToken = await this.getAccessToken();
            if (freshToken) {
                options.headers["Authorization"] = `Bearer ${freshToken}`;
                response = await fetch(url, options);
            }
        }
        return response;
    },

    // 2. Create or Update Dataverse ALC Session
    saveSession: async function (sessionData) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating saveSession locally.");
            return { cr3ea_prod_rajpura_quality_tourid: "mock-session-id-" + Date.now() };
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.PARENT; // Reuse existing entity or define custom state columns
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        if (sessionData.cr3ea_prod_rajpura_quality_tourid) {
            url += `(${sessionData.cr3ea_prod_rajpura_quality_tourid})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(sessionData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse session save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return sessionData;
        } else {
            return await response.json();
        }
    },

    // 3. Save Checklist Checkpoints to Dataverse
    saveChecklistRow: async function (rowRecord) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating checklist row save locally.");
            return { cr3ea_rajpura_alcsid: "mock-row-id-" + Date.now() };
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.CHILD;
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        if (rowRecord.cr3ea_rajpura_alcsid) {
            url += `(${rowRecord.cr3ea_rajpura_alcsid})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(rowRecord)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse checklist row save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return rowRecord;
        } else {
            return await response.json();
        }
    },

    // Fetch existing checkpoints for a Quality Tour ID
    getCheckpoints: async function (tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating getCheckpoints locally.");
            return [];
        }

        const apiVersion = "9.2";
        const tableName = "cr3ea_rajpura_alcses";
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const cleanTourId = tourId ? String(tourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
        const filter = `?$filter=_cr3ea_qualitytourid_value eq '${cleanTourId}'`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Dataverse checkpoints: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.value;
    },

    // Fetch all active tour sessions for Rajpura plant (Plant ID 14)
    getActiveSessions: async function () {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating getActiveSessions locally.");
            return [
                {
                    cr3ea_prod_rajpura_quality_tourid: "mock-active-1",
                    cr3ea_status: "Pending QA",
                    cr3ea_processstatus: "Pending QA",
                    cr3ea_shiftexecutiveproduction: "Akkib AM",
                    cr3ea_lineno: "Line 1",
                    cr3ea_shift: "Shift 1",
                    cr3ea_tourstartdate: new Date().toISOString(),
                    cr3ea_tourby: "Mishab Muhammad"
                }
            ];
        }

        const apiVersion = "9.2";
        const tableName = "cr3ea_prod_rajpura_quality_tours";
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const filter = `?$filter=cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}'&$orderby=cr3ea_tourstartdate desc&$top=50`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Dataverse active sessions: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const results = data.value || [];

        // Filter: Keep all active tours + today's completed/closed tours
        const todayStr = moment().format("YYYY-MM-DD");
        return results.filter(session => {
            const status = session.cr3ea_processstatus || session.cr3ea_status || "";
            const isActive = (status !== "Completed" && status !== "Closed" && status !== "Closed - Expired");

            if (isActive) {
                return true;
            } else {
                const creationTime = session.createdon || session.cr3ea_tourstartdate;
                if (creationTime) {
                    const tourDateStr = moment(creationTime).local().format("YYYY-MM-DD");
                    return (tourDateStr === todayStr);
                }
                return false;
            }
        });
    },

    // 4. Upload Attachment to SharePoint Document Library
    uploadCorrectiveActionFile: async function (fileObject, tourId, areaName, checkpointId, actionRemarks) {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const webServerRelativeUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webServerRelativeUrl : "";
        const libraryName = QualityRajpura_Config.SHAREPOINT_DOCS.ALC_CORRECTIVE_ACTIONS;

        // Build proper server relative URL for folder
        const serverRelativeUrl = webServerRelativeUrl === "/"
            ? `/${libraryName}`
            : `${webServerRelativeUrl}/${libraryName}`;

        // 1. Get Request Digest (Form Digest)
        let requestDigest = "";
        const requestDigestEl = document.getElementById("__REQUESTDIGEST");
        if (requestDigestEl && requestDigestEl.value) {
            requestDigest = requestDigestEl.value;
        } else {
            const digestResponse = await $.ajax({
                url: `${webUrl}/_api/contextinfo`,
                method: "POST",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            requestDigest = digestResponse.d.GetContextWebInformation.FormDigestValue;
        }

        // 2. Read file as ArrayBuffer
        const fileBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(fileObject);
        });

        // 3. Generate unique filename (e.g. proof_20260803_134639_CP-1.png)
        const dotIndex = fileObject.name.lastIndexOf(".");
        let baseName = fileObject.name;
        let extension = "";
        if (dotIndex !== -1) {
            baseName = fileObject.name.substring(0, dotIndex);
            extension = fileObject.name.substring(dotIndex);
        }
        // Clean special characters to avoid SharePoint upload issues
        baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const timestamp = typeof moment !== 'undefined' ? moment().format("YYYYMMDD_HHmmss") : Date.now();
        const safeCheckpointId = checkpointId ? String(checkpointId).replace(/[^a-zA-Z0-9_-]/g, "_") : "";
        const uniqueFileName = safeCheckpointId
            ? `${baseName}_${timestamp}_${safeCheckpointId}${extension}`
            : `${baseName}_${timestamp}${extension}`;

        // 4. Upload File via GetFolderByServerRelativeUrl
        const fileAddUrl = `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativeUrl}')/Files/add(url='${uniqueFileName}', overwrite=true)?$expand=ListItemAllFields`;
        const uploadResponse = await $.ajax({
            url: fileAddUrl,
            method: "POST",
            data: fileBuffer,
            processData: false,
            contentType: "application/octet-stream", // Prevent jQuery from corrupting binary stream
            headers: {
                "Accept": "application/json; odata=verbose",
                "X-RequestDigest": requestDigest
            }
        });

        let fileItemId = null;
        if (uploadResponse.d && uploadResponse.d.ListItemAllFields && uploadResponse.d.ListItemAllFields.Id) {
            fileItemId = uploadResponse.d.ListItemAllFields.Id;
        } else {
            // Fallback: Fetch item fields explicitly using ServerRelativeUrl
            const fileUrl = uploadResponse.d.ServerRelativeUrl;
            const itemResponse = await $.ajax({
                url: `${webUrl}/_api/web/getFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            fileItemId = itemResponse.d.Id;
        }

        // Fetch ListItemEntityTypeFullName dynamically from SharePoint to bypass type resolution error
        const entityResponse = await $.ajax({
            url: `${webUrl}/_api/web/lists/getByTitle('${libraryName}')?$select=ListItemEntityTypeFullName`,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        const listItemEntityType = entityResponse.d.ListItemEntityTypeFullName;

        // 4. Update File Metadata
        const metadataPayload = {
            "__metadata": { "type": listItemEntityType },
            "Title": uniqueFileName, // Set Title using the unique timestamped filename
            "QualityTourId": tourId,
            "AreaName": areaName,
            "CheckpointID": checkpointId,
            "ActionTaken": actionRemarks
        };

        const updateUrl = `${webUrl}/_api/web/lists/getByTitle('${libraryName}')/items(${fileItemId})`;
        await $.ajax({
            url: updateUrl,
            method: "POST",
            data: JSON.stringify(metadataPayload),
            headers: {
                "Accept": "application/json; odata=verbose",
                "Content-Type": "application/json; odata=verbose",
                "X-RequestDigest": requestDigest,
                "X-HTTP-Method": "MERGE",
                "IF-MATCH": "*"
            }
        });

        return uploadResponse.d.ServerRelativeUrl;
    }
};
