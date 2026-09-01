// Data Access Layer for Rajpura Packaging Operations forms
console.log("Packaging Operations DAL loaded");

const PKGOPS_DAL = {
    // 1. Fetch SharePoint configuration mappings
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.PACKAGING_OPERATIONS;

        // Try first schema (no spaces in internal names)
        let query = "?$select=Id,Title,ConfigType,Plant,Area," +
            "AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id," +
            "EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id" +
            "&$expand=AssignedUser,EscalationManager" +
            `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;

        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (!response.ok) throw new Error("Fallback needed");
        } catch (e) {
            // Try fallback schema (spaces encoded as _x0020_ in internal names)
            isFallback = true;
            query = "?$select=Id,Title,Config_x0020_Type,Plant,Area," +
                "Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id," +
                "Escalation_x0020_Manager/Title,Escalation_x0020_Manager/EMail,Escalation_x0020_Manager/Id" +
                "&$expand=Assigned_x0020_User,Escalation_x0020_Manager" +
                `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
            url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch SharePoint config: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.d.results;

        return results.map(item => {
            const rawUser = isFallback ? item.Assigned_x0020_User : item.AssignedUser;
            const rawManager = isFallback ? item.Escalation_x0020_Manager : item.EscalationManager;

            let assignedUserNormalized = { results: [] };
            if (rawUser) {
                if (rawUser.results && Array.isArray(rawUser.results)) {
                    assignedUserNormalized = rawUser;
                } else if (rawUser.Title || rawUser.EMail) {
                    assignedUserNormalized = { results: [rawUser] };
                }
            }

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
                Region: "",
                Plant: item.Plant,
                Area: item.Area,
                AssignedUser: assignedUserNormalized,
                EscalationManager: escalationManagerNormalized
            };
        });
    },

    // 2. Fetch Dataverse access token
    getAccessToken: async function () {
        if (typeof getAccessToken === "function") {
            return await getAccessToken();
        }
        const storedToken = JSON.parse(localStorage.getItem("access_token"));
        const currentTime = new Date().getTime() / 1000;
        if (storedToken && storedToken.expires_at > currentTime) {
            return storedToken.token;
        }
        return null;
    },

    // 3. Fetch wrapper injecting Authorization token
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
            console.warn("PKGOPS_DAL: 401 Unauthorized detected. Clearing cached token and retrying...");
            localStorage.removeItem("access_token");
            const freshToken = await this.getAccessToken();
            if (freshToken) {
                options.headers["Authorization"] = `Bearer ${freshToken}`;
                response = await fetch(url, options);
            }
        }
        return response;
    },

    // 4. Save or Update Parent Tour in Dataverse
    saveTour: async function (tourData) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating saveTour locally.");
            return { cr3ea_prod_rajpura_quality_tourid: tourData.cr3ea_prod_rajpura_quality_tourid || "mock-tour-id-" + Date.now() };
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
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

        if (tourData.cr3ea_prod_rajpura_quality_tourid) {
            url += `(${tourData.cr3ea_prod_rajpura_quality_tourid})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(tourData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse parent tour save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return tourData;
        } else {
            return await response.json();
        }
    },

    // 5. Fetch Parent Tour by ID
    getTour: async function (tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating getTour locally.");
            return null;
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const cleanTourId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${cleanTourId})`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Dataverse tour: ${response.status} - ${errorText}`);
        }

        return await response.json();
    },

    // 6. Save Checklist row in specific sub-checklist tables
    saveSubChecklistRow: async function (subChecklistKey, record) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating saveSubChecklistRow locally.");
            return record;
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PACKAGING_OPERATIONS[subChecklistKey];
        if (!tableName) {
            throw new Error(`Invalid sub-checklist key mapping: ${subChecklistKey}`);
        }

        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        // Determine ID column name based on entity
        let idColumn = "";
        if (subChecklistKey === "CHILD_TEMP_HUMIDITY") idColumn = "cr3ea_prod_rajpura_pkgops_temphumidityid";
        else if (subChecklistKey === "CHILD_CODE_VERIFICATION") idColumn = "cr3ea_prod_rajpura_pkgops_codeverificationid";
        else if (subChecklistKey === "CHILD_PAPA") idColumn = "cr3ea_prod_rajpura_pkgops_papaid";
        else if (subChecklistKey === "CHILD_PQI_NET_WEIGHT") idColumn = "cr3ea_prod_rajpura_pkgops_pqi_netweightid";
        else if (subChecklistKey === "CHILD_PQI_EVALUATION") idColumn = "cr3ea_prod_rajpura_pkgops_pqi_evaluationid";
        else if (subChecklistKey === "CHILD_SEAL_INTEGRITY") idColumn = "cr3ea_prod_rajpura_pkgops_sealintegrityid";
        else if (subChecklistKey === "CHILD_QUALITY_WALL") idColumn = "cr3ea_prod_rajpura_pkgops_qualitywallid";

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        if (record[idColumn]) {
            url += `(${record[idColumn]})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse sub-checklist row save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return record;
        } else {
            return await response.json();
        }
    },

    // 7. Fetch all child rows for a tour ID across a specific child entity
    getSubChecklistRows: async function (subChecklistKey, tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating getSubChecklistRows locally.");
            return [];
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PACKAGING_OPERATIONS[subChecklistKey];
        if (!tableName) {
            return [];
        }

        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const cleanTourId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();
        const filter = `?$filter=_cr3ea_qualitytourid_value eq '${cleanTourId}'`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch sub-checklist rows: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.value || [];
    },

    // 7.b Delete Sub-checklist Row
    deleteSubChecklistRow: async function (subChecklistKey, guid) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating deleteSubChecklistRow locally.");
            return true;
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PACKAGING_OPERATIONS[subChecklistKey];
        if (!tableName) return false;

        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${guid})`;
        const response = await this.fetchWithToken(url, { method: "DELETE", headers });

        if (!response.ok) {
            throw new Error(`Dataverse delete failed: ${await response.text()}`);
        }
        return true;
    },

    // 7.c Clean all existing sub-checklist rows for a tour ID
    cleanSubChecklistRows: async function (subChecklistKey, tourId, evaluationType) {
        try {
            const existing = await this.getSubChecklistRows(subChecklistKey, tourId);
            if (existing && existing.length > 0) {
                let idColumn = "";
                if (subChecklistKey === "CHILD_TEMP_HUMIDITY") idColumn = "cr3ea_prod_rajpura_pkgops_temphumidityid";
                else if (subChecklistKey === "CHILD_CODE_VERIFICATION") idColumn = "cr3ea_prod_rajpura_pkgops_codeverificationid";
                else if (subChecklistKey === "CHILD_PAPA") idColumn = "cr3ea_prod_rajpura_pkgops_papaid";
                else if (subChecklistKey === "CHILD_PQI_NET_WEIGHT") idColumn = "cr3ea_prod_rajpura_pkgops_pqi_netweightid";
                else if (subChecklistKey === "CHILD_PQI_EVALUATION") idColumn = "cr3ea_prod_rajpura_pkgops_pqi_evaluationid";
                else if (subChecklistKey === "CHILD_SEAL_INTEGRITY") idColumn = "cr3ea_prod_rajpura_pkgops_sealintegrityid";
                else if (subChecklistKey === "CHILD_QUALITY_WALL") idColumn = "cr3ea_prod_rajpura_pkgops_qualitywallid";

                for (let item of existing) {
                    if (evaluationType && item.cr3ea_evaluationtype !== evaluationType) {
                        continue;
                    }
                    const guid = item[idColumn];
                    if (guid) {
                        await this.deleteSubChecklistRow(subChecklistKey, guid);
                    }
                }
            }
        } catch (e) {
            console.error("cleanSubChecklistRows failed: ", e);
        }
    },

    // 8. Upload photo file to SharePoint Document Library PackagingOperations_Docs
    uploadAttachmentFile: async function (fileObject, tourId, pkgOpsType, checkpointId, actionRemarks) {
        if (typeof window.compressImageFile === "function" && fileObject && fileObject.type.startsWith("image/")) {
            try {
                fileObject = await window.compressImageFile(fileObject);
            } catch (e) {
                console.warn("Image compression failed, using original: ", e);
            }
        }
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const webServerRelativeUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webServerRelativeUrl : "";
        const libraryName = QualityRajpura_Config.SHAREPOINT_DOCS.PACKAGING_OPERATIONS;

        const serverRelativeUrl = webServerRelativeUrl === "/"
            ? `/${libraryName}`
            : `${webServerRelativeUrl}/${libraryName}`;

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

        const fileBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = err => reject(err);
            reader.readAsArrayBuffer(fileObject);
        });

        const dotIndex = fileObject.name.lastIndexOf(".");
        let baseName = fileObject.name;
        let extension = "";
        if (dotIndex !== -1) {
            baseName = fileObject.name.substring(0, dotIndex);
            extension = fileObject.name.substring(dotIndex);
        }
        baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const timestamp = typeof moment !== 'undefined' ? moment().format("YYYYMMDD_HHmmss") : Date.now();
        const safeCheckpointId = checkpointId ? String(checkpointId).replace(/[^a-zA-Z0-9_-]/g, "_") : "";
        const uniqueFileName = safeCheckpointId
            ? `${baseName}_${timestamp}_${safeCheckpointId}${extension}`
            : `${baseName}_${timestamp}${extension}`;

        const fileAddUrl = `${webUrl}/_api/web/GetFolderByServerRelativeUrl('${serverRelativeUrl}')/Files/add(url='${uniqueFileName}', overwrite=true)?$expand=ListItemAllFields`;
        const uploadResponse = await $.ajax({
            url: fileAddUrl,
            method: "POST",
            data: fileBuffer,
            processData: false,
            contentType: "application/octet-stream",
            headers: {
                "Accept": "application/json; odata=verbose",
                "X-RequestDigest": requestDigest
            }
        });

        let fileItemId = null;
        if (uploadResponse.d && uploadResponse.d.ListItemAllFields && uploadResponse.d.ListItemAllFields.Id) {
            fileItemId = uploadResponse.d.ListItemAllFields.Id;
        } else {
            const fileUrl = uploadResponse.d.ServerRelativeUrl;
            const itemResponse = await $.ajax({
                url: `${webUrl}/_api/web/getFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            fileItemId = itemResponse.d.Id;
        }

        const entityResponse = await $.ajax({
            url: `${webUrl}/_api/web/lists/getByTitle('${libraryName}')?$select=ListItemEntityTypeFullName`,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        const listItemEntityType = entityResponse.d.ListItemEntityTypeFullName;

        const metadataPayload = {
            "__metadata": { "type": listItemEntityType },
            "Title": uniqueFileName,
            "QualityTourId": tourId,
            "PackagingOpsType": pkgOpsType,
            "CheckpointID": checkpointId,
            "ActionRemarks": actionRemarks
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
    },

    // 9. Fetch all attachments for a specific tour session
    getAttachments: async function (tourId) {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const libraryName = QualityRajpura_Config.SHAREPOINT_DOCS.PACKAGING_OPERATIONS;

        const query = `?$filter=QualityTourId eq '${tourId}'`;
        const url = `${webUrl}/_api/web/lists/getByTitle('${libraryName}')/items${query}`;

        try {
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (!response.ok) return [];
            const data = await response.json();
            return data.d.results || [];
        } catch (e) {
            console.error("Error fetching attachments: ", e);
            return [];
        }
    }
};
