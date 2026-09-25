// Data Access Layer for Rajpura Mixing & Baking Form
console.log("Mixing & Baking DAL loaded");

// Defensive helper for tour ID normalization (self-heals even if older utils.js is cached)
function normalizeTourRecord(record) {
    if (!record || typeof record !== 'object') return record;
    if (typeof QualityRajpura_Config !== 'undefined' && typeof QualityRajpura_Config.normalizeTourRecord === 'function') {
        return QualityRajpura_Config.normalizeTourRecord(record);
    }
    const id = record.cr3ea_prod_rajpura_quality_tourid || 
               record.cr3ea_rajpura_quality_tourid || 
               record.cr3ea_prod_rajpura_quality_toursid || 
               record.cr3ea_rajpura_quality_toursid || 
               record.cr3ea_qualitytourid || "";
    if (id) {
        record.cr3ea_prod_rajpura_quality_tourid = id;
        record.cr3ea_rajpura_quality_tourid = id;
    }
    return record;
}

if (typeof QualityRajpura_Config !== 'undefined') {
    if (typeof QualityRajpura_Config.normalizeTourRecord !== 'function') {
        QualityRajpura_Config.normalizeTourRecord = normalizeTourRecord;
    }
    if (typeof QualityRajpura_Config.getTourId !== 'function') {
        QualityRajpura_Config.getTourId = function (record) {
            if (!record || typeof record !== 'object') return '';
            return record.cr3ea_prod_rajpura_quality_tourid || 
                   record.cr3ea_rajpura_quality_tourid || 
                   record.cr3ea_prod_rajpura_quality_toursid || 
                   record.cr3ea_rajpura_quality_toursid || 
                   record.cr3ea_qualitytourid || '';
        };
    }
}

const MixingBaking_DAL = {
    // 1. Fetch SharePoint configuration mappings
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CONFIG;

        let query = "?$select=Id,Title,ConfigType,Region,Plant,Area," +
            "AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id," +
            "EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id" +
            "&$expand=AssignedUser,EscalationManager" +
            `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;
        let isFallback = false;

        try {
            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                if (!response.ok) throw new Error("Fallback needed");
            } catch (e) {
                isFallback = true;
                query = "?$select=Id,Title,Config_x0020_Type,Region,Plant,Area," +
                    "Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id," +
                    "Escalation_x0020_Manager/Title,Escalation_x0020_Manager/EMail,Escalation_x0020_Manager/Id" +
                    "&$expand=Assigned_x0020_User,Escalation_x0020_Manager" +
                    `&$filter=Plant eq '${QualityRajpura_Config.PLANT_NAME}'`;
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

                const configType = isFallback ? item.Config_x0020_Type : item.ConfigType;

                return {
                    Id: item.Id,
                    Title: configType || item.Title, // Map configType to Title to support existing main.js checks
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
                    AssignedUser: { results: [{ Title: "QA User", EMail: "" }] },
                    EscalationManager: { results: [{ Title: "QA Manager", EMail: "" }] }
                },
                {
                    Id: 2,
                    Title: "Product User",
                    AssignedUser: { results: [{ Title: "Prod User", EMail: "" }] },
                    EscalationManager: { results: [{ Title: "Prod Manager", EMail: "" }] }
                }
            ];
        }
    },

    // 1b. Fetch specific users configuration for Mixing & Baking dropdowns
    getMixingBakingUsersConfig: async function () {
        const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
            ? QualityRajpura_Config.getSiteBaseUrl()
            : ((typeof _spPageContextInfo !== 'undefined' && (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl))
                ? (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl)
                : "");
        const listName = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.SHAREPOINT_LISTS && QualityRajpura_Config.SHAREPOINT_LISTS.MIXING_BAKING)
            ? QualityRajpura_Config.SHAREPOINT_LISTS.MIXING_BAKING
            : "Quality-Rajpura-MixingBaking";

        if (!webUrl) {
            console.warn("No SharePoint context. Returning mock users configuration.");
            return {
                qaUsers: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Gokul K", EMail: "", Id: 108 },
                    { Title: "Aiswarya N V", EMail: "", Id: 109 }
                ],
                prodUsers: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Ajith K", EMail: "", Id: 110 },
                    { Title: "Aiswarya N V", EMail: "", Id: 109 }
                ]
            };
        }

        try {
            // Dynamic schema probing to resolve field internal names
            const fieldsUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/Fields?$select=InternalName,Title,TypeAsString`;
            let listFields = [];
            try {
                const fieldsRes = await fetch(fieldsUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                if (fieldsRes.ok) {
                    const fieldsData = await fieldsRes.json();
                    listFields = (fieldsData && fieldsData.d && fieldsData.d.results) ? fieldsData.d.results : [];
                }
            } catch (errFields) {
                console.warn("MixingBaking_DAL: Schema probing failed, using fallback:", errFields);
            }

            const findField = (possibleNames, displayNames) => {
                const pNames = Array.isArray(possibleNames) ? possibleNames : [possibleNames];
                let match = listFields.find(f => pNames.some(pn => pn.toLowerCase() === f.InternalName.toLowerCase()));
                if (match) return match;
                if (displayNames) {
                    const dNames = Array.isArray(displayNames) ? displayNames : [displayNames];
                    match = listFields.find(f => dNames.some(dn => dn.toLowerCase() === f.Title.toLowerCase()));
                }
                return match;
            };

            const userField = findField(["QA_x0020_Executive", "QAExecutive", "AssignedUser", "Assigned_x0020_User", "AssignedQA"], ["QA Executive", "QAExecutive", "Assigned User"]);
            const prodField = findField(["Production_x0020_Executive", "ProductionExecutive", "ProductionIncharge", "Production_x0020_Incharge"], ["Production Executive", "Production Incharge", "ProductionExecutive"]);

            const uName = userField ? userField.InternalName : "QA_x0020_Executive";
            const pName = prodField ? prodField.InternalName : "Production_x0020_Executive";

            let selectParts = ["Id", "Title", `${uName}/Title`, `${uName}/EMail`, `${uName}/Id`, `${pName}/Title`, `${pName}/EMail`, `${pName}/Id`];
            let expandParts = [uName, pName];

            let query = `?$select=${selectParts.join(",")}&$top=500`;
            if (expandParts.length > 0) query += `&$expand=${expandParts.join(",")}`;

            const url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            let response = null;
            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            } catch (fetchErr) {
                console.warn("MixingBaking_DAL: Initial users query failed:", fetchErr);
            }

            // Robust fallback attempts if initial query failed
            if (!response || !response.ok) {
                const fbQueries = [
                    "?$select=Id,Title,QA_x0020_Executive/Title,QA_x0020_Executive/EMail,QA_x0020_Executive/Id,Production_x0020_Executive/Title,Production_x0020_Executive/EMail,Production_x0020_Executive/Id&$expand=QA_x0020_Executive,Production_x0020_Executive&$top=500",
                    "?$select=Id,Title,QAExecutive/Title,QAExecutive/EMail,QAExecutive/Id,ProductionExecutive/Title,ProductionExecutive/EMail,ProductionExecutive/Id&$expand=QAExecutive,ProductionExecutive&$top=500",
                    "?$select=Id,Title,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id&$expand=AssignedUser&$top=500"
                ];
                for (const fbQ of fbQueries) {
                    try {
                        const fbRes = await fetch(`${webUrl}/_api/web/lists/getByTitle('${listName}')/items${fbQ}`, { headers: { "Accept": "application/json; odata=verbose" } });
                        if (fbRes.ok) {
                            response = fbRes;
                            break;
                        }
                    } catch (e) {}
                }
            }

            if (!response || !response.ok) {
                throw new Error(`SharePoint fetch failed with status ${response ? response.status : 'unknown'}`);
            }

            const data = await response.json();
            const results = (data && data.d && data.d.results) ? data.d.results : [];

            let qaUsers = [];
            let prodUsers = [];

            const addUnique = (targetList, user) => {
                if (!user) return;
                const title = (user.Title || user.title || "").trim();
                const email = (user.EMail || user.email || user.Email || "").trim();
                const id = user.Id || user.id || 0;
                if (!title) return;
                if (!targetList.some(existing => (email && existing.EMail && existing.EMail.toLowerCase() === email.toLowerCase()) || (title && existing.Title && existing.Title.toLowerCase() === title.toLowerCase()))) {
                    targetList.push({ Title: title, EMail: email, Id: id });
                }
            };

            results.forEach(item => {
                const rawQA = (userField && item[userField.InternalName]) || item.QAExecutive || item.QA_x0020_Executive || item.AssignedUser;
                const rawProd = (prodField && item[prodField.InternalName]) || item.ProductionExecutive || item.Production_x0020_Executive || item.ProductionIncharge;

                if (rawQA) {
                    if (rawQA.results && Array.isArray(rawQA.results)) {
                        rawQA.results.forEach(u => addUnique(qaUsers, u));
                    } else if (rawQA.Title || rawQA.EMail) {
                        addUnique(qaUsers, rawQA);
                    }
                }

                if (rawProd) {
                    if (rawProd.results && Array.isArray(rawProd.results)) {
                        rawProd.results.forEach(u => addUnique(prodUsers, u));
                    } else if (rawProd.Title || rawProd.EMail) {
                        addUnique(prodUsers, rawProd);
                    }
                }
            });

            if (qaUsers.length === 0 && prodUsers.length === 0) {
                return {
                    qaUsers: [
                        { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                        { Title: "Gokul K", EMail: "", Id: 108 },
                        { Title: "Aiswarya N V", EMail: "", Id: 109 }
                    ],
                    prodUsers: [
                        { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                        { Title: "Ajith K", EMail: "", Id: 110 },
                        { Title: "Aiswarya N V", EMail: "", Id: 109 }
                    ]
                };
            }

            return { qaUsers, prodUsers };
        } catch (e) {
            console.warn("Failed to fetch Mixing & Baking users configuration from SharePoint. Using mock list:", e);
            return {
                qaUsers: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Gokul K", EMail: "", Id: 108 },
                    { Title: "Aiswarya N V", EMail: "", Id: 109 }
                ],
                prodUsers: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Ajith K", EMail: "", Id: 110 },
                    { Title: "Aiswarya N V", EMail: "", Id: 109 }
                ]
            };
        }
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
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

        const data = await response.json();
        return normalizeTourRecord(data);
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

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
        const existingCycleId = record.cr3ea_prod_rajpura_mixingandbakingid || record.cr3ea_rajpura_mixingandbakingid;
        const payload = { ...record };
        if (existingCycleId) {
            url += `(${existingCycleId})`;
            method = "PATCH";
            delete payload.cr3ea_prod_rajpura_mixingandbakingid;
            delete payload.cr3ea_rajpura_mixingandbakingid;
        }

        // Defensive sanitize: Remove non-existent Dataverse entity attributes if present
        delete payload.cr3ea_gauge;
        delete payload.cr3ea_weightbeforeoil;
        delete payload.cr3ea_weightwithseasoning;
        delete payload.cr3ea_doughconsistency;
        delete payload.cr3ea_doughconsistencystandard;
        delete payload.cr3ea_doughconsistencyobserved;

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return record;
        } else {
            const data = await response.json();
            const childId = data.cr3ea_prod_rajpura_mixingandbakingid || data.cr3ea_rajpura_mixingandbakingid;
            if (childId) {
                data.cr3ea_prod_rajpura_mixingandbakingid = childId;
                data.cr3ea_rajpura_mixingandbakingid = childId;
            }
            return data;
        }
    },

    // 7. Upload attachment file to SharePoint Document Library
    uploadAttachment: async function (fileObject, tourId, cycleNum) {
        if (typeof window.compressImageFile === "function" && fileObject && fileObject.type.startsWith("image/")) {
            try {
                fileObject = await window.compressImageFile(fileObject);
            } catch (e) {
                console.warn("Image compression failed, using original: ", e);
            }
        }
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation",
            "Authorization": `Bearer ${token}`
        };

        const cleanPayload = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.sanitizeParentTourPayload)
            ? QualityRajpura_Config.sanitizeParentTourPayload(payload)
            : { ...payload };
        delete cleanPayload.cr3ea_tourcompletiondate;
        delete cleanPayload.cr3ea_prod_rajpura_quality_tourid;
        delete cleanPayload.cr3ea_rajpura_quality_tourid;
        delete cleanPayload.cr3ea_prod_rajpura_quality_toursid;
        delete cleanPayload.cr3ea_rajpura_quality_toursid;
        delete cleanPayload.cr3ea_lineid;
        delete cleanPayload.cr3ea_departmentid;

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${cleanId})`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(cleanPayload)
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
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

        const tourId = QualityRajpura_Config.getTourId(tourData);
        if (tourId) {
            url += `(${tourId})`;
            method = "PATCH";
        }

        // Mock environments
        if (!baseApiUrl || !token || token.startsWith("mock-")) {
            console.log(`Simulating saveTourSession (${method}) locally:`, tourData);
            if (method === "POST") {
                tourData.cr3ea_prod_rajpura_quality_tourid = "mock-tour-guid-" + Math.floor(Math.random() * 1000000);
            }
            return normalizeTourRecord(tourData);
        }

        const payload = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.sanitizeParentTourPayload)
            ? QualityRajpura_Config.sanitizeParentTourPayload(tourData)
            : { ...tourData };
        delete payload.cr3ea_prod_rajpura_quality_tourid;
        delete payload.cr3ea_rajpura_quality_tourid;
        delete payload.cr3ea_prod_rajpura_quality_toursid;
        delete payload.cr3ea_rajpura_quality_toursid;
        delete payload.cr3ea_lineid;
        delete payload.cr3ea_departmentid;
        delete payload.cr3ea_tourcompletiondate;

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Dataverse save parent tour failed: ${await response.text()}`);
        }

        if (method === "PATCH") {
            return normalizeTourRecord(tourData);
        }

        let data = {};
        try {
            const text = await response.text();
            if (text && text.trim().length > 0) {
                data = JSON.parse(text);
            }
        } catch (e) {
            console.warn("Could not parse JSON response from Dataverse saveTourSession:", e);
        }

        // Extract created ID from OData-EntityId or Location header if not in body
        const entityIdHeader = response.headers.get("OData-EntityId") || response.headers.get("Location") || "";
        const guidMatch = entityIdHeader.match(/\(([0-9a-fA-F-]{36})\)/);
        const headerGuid = guidMatch ? guidMatch[1] : null;

        const normalized = normalizeTourRecord(data);
        if (!normalized.cr3ea_prod_rajpura_quality_tourid && headerGuid) {
            normalized.cr3ea_prod_rajpura_quality_tourid = headerGuid;
            normalized.cr3ea_rajpura_quality_tourid = headerGuid;
        }
        return normalized;
    },

    // Retrieve uploaded files from SharePoint for completed cycle
    getCycleAttachments: async function (tourId, cycleNum) {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const libraryName = QualityRajpura_Config.SHAREPOINT_DOCS.MIXING_BAKING;
        const cleanTourId = tourId ? String(tourId).replace(/[{}]/g, "").trim().toLowerCase() : "";

        if (!webUrl) {
            console.warn("Local mock environment. Returning empty attachments.");
            return [];
        }

        const url = `${webUrl}/_api/web/lists/getByTitle('${libraryName}')/items?$select=Id,Title,FileRef&$filter=QualityTourId eq '${cleanTourId}' and Cycle eq 'Cycle-${cycleNum}'`;
        
        try {
            const response = await $.ajax({
                url: url,
                method: "GET",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            return response.d.results || [];
        } catch (err) {
            console.error("Failed to fetch attachments:", err);
            return [];
        }
    },

    recipesCache: null,

    // Retrieve active product recipes matrix for auto-population dynamically from SharePoint list
    getProductRecipes: async function () {
        if (this.recipesCache && this.recipesCache.length > 0) {
            return this.recipesCache;
        }

        const seedDefaults = (typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA) && MB_RECIPES_SEED_DATA.length > 0) 
            ? MB_RECIPES_SEED_DATA 
            : ((typeof window !== "undefined" && window.MB_RECIPES_SEED_DATA && Array.isArray(window.MB_RECIPES_SEED_DATA) && window.MB_RECIPES_SEED_DATA.length > 0)
                ? window.MB_RECIPES_SEED_DATA
                : []);

        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.MIXING_BAKING;

        if (!webUrl) {
            console.log(`Local environment: Loaded ${seedDefaults.length} seed product recipes.`);
            this.recipesCache = seedDefaults;
            return this.recipesCache;
        }

        try {
            let allFetchedItems = [];
            let nextUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,ConfigType,ProductCategory,Plant,IsActive,RecipeConfig&$top=5000`;

            // Loop through all pages to retrieve all product recipes without SharePoint 100-item cutoff
            while (nextUrl) {
                let response = null;
                try {
                    response = await fetch(nextUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                } catch (e) {}

                if (!response || !response.ok) {
                    // Fallback to Config_x0020_Type only if ConfigType query failed
                    if (allFetchedItems.length === 0 && nextUrl.includes("ConfigType")) {
                        const fallbackUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items?$select=Id,Title,Config_x0020_Type,ProductCategory,Plant,IsActive,RecipeConfig&$top=5000`;
                        try {
                            const fbRes = await fetch(fallbackUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                            if (fbRes.ok) response = fbRes;
                        } catch (err2) {}
                    }
                }

                if (!response || !response.ok) {
                    break;
                }
                const data = await response.json();
                const pageResults = (data && data.d && data.d.results) ? data.d.results : [];
                allFetchedItems = allFetchedItems.concat(pageResults);
                nextUrl = (data && data.d && data.d.__next) ? data.d.__next : null;
            }

            if (allFetchedItems.length > 0) {
                const recipeRows = allFetchedItems.filter(item => {
                    const cType = (item.ConfigType || item.Config_x0020_Type || "").trim().toLowerCase();
                    return cType === "product recipe" || cType === "product_x0020_recipe";
                });

                if (recipeRows.length > 0) {
                    this.recipesCache = recipeRows.map(item => {
                        let parsedStandards = {};
                        const rawJson = item.RecipeConfig || item.Remarks || item.Description || "";
                        if (rawJson && typeof rawJson === "string" && rawJson.trim().startsWith("{")) {
                            try {
                                parsedStandards = JSON.parse(rawJson);
                            } catch (e) {
                                console.warn("Failed parsing RecipeConfig JSON for item:", item.Title, e);
                            }
                        }

                        return {
                            id: item.Id,
                            title: (item.Title || "Unknown Product").trim(),
                            configType: "Product Recipe",
                            productCategory: item.ProductCategory || "General",
                            plant: item.Plant || "Rajpura",
                            isActive: item.IsActive !== false,
                            standards: parsedStandards
                        };
                    });

                    // Sort alphabetically by product title for clean selection
                    this.recipesCache.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

                    console.log(`Successfully loaded ${this.recipesCache.length} product recipes dynamically from SharePoint list "${listName}".`);
                    return this.recipesCache;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch product recipes from SharePoint list. Using seed defaults:", e);
        }

        this.recipesCache = seedDefaults;
        return this.recipesCache;
    }
};
