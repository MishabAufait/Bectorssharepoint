// Data Access Layer for Rajpura Mixing & Baking Form
console.log("Mixing & Baking DAL loaded");

const MixingBaking_DAL = {
    // 1. Fetch SharePoint configuration mappings
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CONFIG;

        let query = "?$select=Id,Title,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id&$expand=AssignedUser,EscalationManager&$filter=Plant eq 'Rajpura'";
        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                if (!response.ok) throw new Error("Fallback needed");
            } catch (e) {
                isFallback = true;
                query = "?$select=Id,Title,Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id,Escalation_x0020_Manager/Title,Escalation_x0020_Manager/EMail,Escalation_x0020_Manager/Id&$expand=Assigned_x0020_User,Escalation_x0020_Manager&$filter=Plant eq 'Rajpura'";
                url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            }

            if (!response || !response.ok) {
                throw new Error("SharePoint response not OK");
            }

            const data = await response.json();
            return data.d.results.map(item => {
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
                    Title: item.Title, // e.g. "QA User" or "Product User"
                    AssignedUser: assignedUserNormalized,
                    EscalationManager: escalationManagerNormalized
                };
            });
        } catch (err) {
            console.warn("SharePoint config fetch failed. Falling back to default mock permissions.", err);
            return [
                {
                    Id: 1,
                    Title: "QA User",
                    AssignedUser: { results: [{ Title: "QA User", EMail: "qa@example.com" }] },
                    EscalationManager: { results: [{ Title: "QA Manager", EMail: "qamanager@example.com" }] }
                },
                {
                    Id: 2,
                    Title: "Product User",
                    AssignedUser: { results: [{ Title: "Prod User", EMail: "prod@example.com" }] },
                    EscalationManager: { results: [{ Title: "Prod Manager", EMail: "prodmanager@example.com" }] }
                }
            ];
        }
    },

    // 1b. Fetch specific users configuration for Mixing & Baking dropdowns
    getMixingBakingUsersConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.MIXING_BAKING;

        if (!webUrl) {
            console.warn("No SharePoint context. Returning mock users configuration.");
            return {
                qaUsers: [
                    { Title: "Mishab Muhammed", EMail: "mishab@example.com" },
                    { Title: "Gokul K", EMail: "gokul@example.com" }
                ],
                prodUsers: [
                    { Title: "Mishab Muhammed", EMail: "mishab@example.com" },
                    { Title: "Ajith K", EMail: "ajith@example.com" }
                ]
            };
        }

        let query = "?$select=Id,Title,QAExecutive/Title,QAExecutive/EMail,QAExecutive/Id,ProductionExecutive/Title,ProductionExecutive/EMail,ProductionExecutive/Id&$expand=QAExecutive,ProductionExecutive";
        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (!response.ok) throw new Error("Fallback needed");
        } catch (e) {
            isFallback = true;
            query = "?$select=Id,Title,QA_x0020_Executive/Title,QA_x0020_Executive/EMail,QA_x0020_Executive/Id,Production_x0020_Executive/Title,Production_x0020_Executive/EMail,Production_x0020_Executive/Id&$expand=QA_x0020_Executive,Production_x0020_Executive";
            url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
        }

        if (!response || !response.ok) {
            console.warn("Failed to fetch Mixing & Baking users configuration from SharePoint. Using mock list.");
            return {
                qaUsers: [
                    { Title: "Mishab Muhammed", EMail: "mishab@example.com" },
                    { Title: "Gokul K", EMail: "gokul@example.com" }
                ],
                prodUsers: [
                    { Title: "Mishab Muhammed", EMail: "mishab@example.com" },
                    { Title: "Ajith K", EMail: "ajith@example.com" }
                ]
            };
        }

        const data = await response.json();
        const results = data.d.results || [];

        let qaUsers = [];
        let prodUsers = [];

        results.forEach(item => {
            const rawQA = isFallback ? item.QA_x0020_Executive : item.QAExecutive;
            const rawProd = isFallback ? item.Production_x0020_Executive : item.ProductionExecutive;

            if (rawQA) {
                if (rawQA.results && Array.isArray(rawQA.results)) {
                    rawQA.results.forEach(u => {
                        if (!qaUsers.some(existing => existing.Title === u.Title)) {
                            qaUsers.push({ Title: u.Title, EMail: u.EMail, Id: u.Id });
                        }
                    });
                } else if (rawQA.Title) {
                    if (!qaUsers.some(existing => existing.Title === rawQA.Title)) {
                        qaUsers.push({ Title: rawQA.Title, EMail: rawQA.EMail, Id: rawQA.Id });
                    }
                }
            }

            if (rawProd) {
                if (rawProd.results && Array.isArray(rawProd.results)) {
                    rawProd.results.forEach(u => {
                        if (!prodUsers.some(existing => existing.Title === u.Title)) {
                            prodUsers.push({ Title: u.Title, EMail: u.EMail, Id: u.Id });
                        }
                    });
                } else if (rawProd.Title) {
                    if (!prodUsers.some(existing => existing.Title === rawProd.Title)) {
                        prodUsers.push({ Title: rawProd.Title, EMail: rawProd.EMail, Id: rawProd.Id });
                    }
                }
            }
        });

        return { qaUsers, prodUsers };
    },

    // 2. Retrieve Dataverse Access Token
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

    // 3. Fetch wrapper injecting bearer token
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
            console.warn("MixingBaking_DAL: 401 Unauthorized. Retrying with a fresh token...");
            localStorage.removeItem("access_token");
            const freshToken = await this.getAccessToken();
            if (freshToken) {
                options.headers["Authorization"] = `Bearer ${freshToken}`;
                response = await fetch(url, options);
            }
        }
        return response;
    },

    // 4. Retrieve Parent Tour Details
    getParentTour: async function (tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No Dataverse token available. Simulating parent tour fetch.");
            return {
                cr3ea_prod_rajpura_quality_tourid: tourId,
                cr3ea_lineno: "Line-1",
                cr3ea_assigned_qa: "QA User",
                cr3ea_shiftexecutiveproduction: "Prod User",
                cr3ea_plantid: "Rajpura",
                cr3ea_tourstartdate: moment().format("MM-DD-YYYY"),
                cr3ea_shift: "Shift-1"
            };
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${tourId})`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch parent tour details: ${response.status} - ${errorText}`);
        }

        return await response.json();
    },

    // 5. Get Saved Cycles for the active tour
    getCycles: async function (tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Returning empty cycle history locally.");
            return [];
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.MIXING_BAKING.CHILD;
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const cleanTourId = tourId ? String(tourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
        const filter = `?$filter=_cr3ea_qualitytourid_value eq '${cleanTourId}'&$orderby=createdon asc`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Mixing & Baking cycle history: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.value;
    },

    // 6. Save (Create or Update) a Cycle record in Dataverse
    saveCycle: async function (record) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token. Simulating cycle record save locally.");
            return { cr3ea_prod_rajpura_mixingandbakingid: "mock-cycle-id-" + Date.now() };
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.MIXING_BAKING.CHILD;
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

        // Check if updating
        if (record.cr3ea_prod_rajpura_mixingandbakingid) {
            url += `(${record.cr3ea_prod_rajpura_mixingandbakingid})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return record;
        } else {
            return await response.json();
        }
    },

    // 7. Upload attachment file to SharePoint Document Library
    uploadAttachment: async function (fileObject, tourId, cycleNum) {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const webServerRelativeUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webServerRelativeUrl : "";
        const libraryName = QualityRajpura_Config.SHAREPOINT_DOCS.MIXING_BAKING;

        // Build proper server relative URL for folder
        const serverRelativeUrl = webServerRelativeUrl === "/"
            ? `/${libraryName}`
            : `${webServerRelativeUrl}/${libraryName}`;

        // 1. Get request digest
        let requestDigest = "";
        const digestEl = document.getElementById("__REQUESTDIGEST");
        if (digestEl && digestEl.value) {
            requestDigest = digestEl.value;
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

        // 3. Generate unique filename (clean special characters)
        const dotIndex = fileObject.name.lastIndexOf(".");
        let baseName = fileObject.name;
        let extension = "";
        if (dotIndex !== -1) {
            baseName = fileObject.name.substring(0, dotIndex);
            extension = fileObject.name.substring(dotIndex);
        }
        baseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const timestamp = typeof moment !== 'undefined' ? moment().format("YYYYMMDD_HHmmss") : Date.now();
        const uniqueFileName = `${baseName}_${timestamp}_Cycle_${cycleNum}${extension}`;

        // 4. Upload file to Document Library
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
            // Fallback: Fetch item fields explicitly
            const fileUrl = uploadResponse.d.ServerRelativeUrl;
            const itemResponse = await $.ajax({
                url: `${webUrl}/_api/web/getFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            fileItemId = itemResponse.d.Id;
        }

        // Fetch ListItemEntityTypeFullName dynamically
        const entityResponse = await $.ajax({
            url: `${webUrl}/_api/web/lists/getByTitle('${libraryName}')?$select=ListItemEntityTypeFullName`,
            method: "GET",
            headers: { "Accept": "application/json; odata=verbose" }
        });
        const listItemEntityType = entityResponse.d.ListItemEntityTypeFullName;

        // 5. Update File Metadata
        const cleanTourId = tourId ? String(tourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
        const metadataPayload = {
            "__metadata": { "type": listItemEntityType },
            "Title": uniqueFileName,
            "QualityTourId": cleanTourId,
            "Cycle": `Cycle-${cycleNum}`
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

    // 8. Update parent quality tour details in Dataverse
    updateParentTour: async function (tourId, payload) {
        const token = await this.getAccessToken();
        if (!tourId || !token || token.startsWith("mock-")) {
            console.warn("No token/TourId or mock session. Simulating parent tour update.");
            return true;
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation",
            "Authorization": `Bearer ${token}`
        };

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${cleanId})`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update parent tour: ${response.status} - ${errorText}`);
        }
        return true;
    },

    // 9. Save/Create parent tour session
    saveTourSession: async function (tourData) {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;

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

        // Mock environments
        if (!baseApiUrl || !token || token.startsWith("mock-")) {
            console.log(`Simulating saveTourSession (${method}) locally:`, tourData);
            if (method === "POST") {
                tourData.cr3ea_prod_rajpura_quality_tourid = "mock-tour-guid-" + Math.floor(Math.random() * 1000000);
            }
            return tourData;
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(tourData)
        });

        if (!response.ok) {
            throw new Error(`Dataverse save parent tour failed: ${await response.text()}`);
        }

        if (method === "PATCH") {
            return { cr3ea_prod_rajpura_quality_tourid: tourData.cr3ea_prod_rajpura_quality_tourid };
        }

        return await response.json();
    }
};
