// Data Access Layer for Food Safety Checklist (Dataverse & SharePoint)
console.log("Food Safety DAL loaded");

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

const FoodSafety_DAL = {
    // 1. Get SharePoint Config (for QA Executives & Production Incharges listing)
    getConfig: async function () {
        const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
            ? QualityRajpura_Config.getSiteBaseUrl()
            : ((typeof _spPageContextInfo !== 'undefined' && (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl))
                ? (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl)
                : "");
        const listName = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.SHAREPOINT_LISTS && QualityRajpura_Config.SHAREPOINT_LISTS.FOOD_SAFETY)
            ? QualityRajpura_Config.SHAREPOINT_LISTS.FOOD_SAFETY
            : "Quality-Rajpura-FoodSafety";

        if (!webUrl) {
            console.warn("No SharePoint context. Returning mock Food Safety configurations.");
            return this.getMockConfig();
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
                console.warn("FoodSafety_DAL: Schema probing failed, using fallback:", errFields);
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

            const plantField = findField(["Plant"], ["Plant"]);
            const checklistTypeField = findField(["ChecklistType", "Checklist_x0020_Type"], ["Checklist Type", "ChecklistType"]);
            const userField = findField(["QAExecutive", "QA_x0020_Executive", "AssignedUser", "Assigned_x0020_User", "AssignedQA"], ["QA Executive", "Assigned User", "QAExecutive"]);
            const prodField = findField(["ProductionIncharge", "Production_x0020_Incharge", "ProductionExecutive", "Production_x0020_Executive"], ["Production Incharge", "Production Executive"]);

            const selectParts = ["Id", "Title"];
            const expandParts = [];

            if (plantField) selectParts.push(plantField.InternalName);
            if (checklistTypeField) selectParts.push(checklistTypeField.InternalName);

            if (userField) {
                const uName = userField.InternalName;
                selectParts.push(`${uName}/Title`, `${uName}/EMail`, `${uName}/Id`);
                expandParts.push(uName);
            }
            if (prodField) {
                const pName = prodField.InternalName;
                selectParts.push(`${pName}/Title`, `${pName}/EMail`, `${pName}/Id`);
                expandParts.push(pName);
            }

            let query = `?$select=${selectParts.join(",")}&$top=500`;
            if (expandParts.length > 0) query += `&$expand=${expandParts.join(",")}`;

            const url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });

            if (!response.ok) {
                throw new Error(`SharePoint fetch failed with status ${response.status}`);
            }

            const data = await response.json();
            const results = (data && data.d && data.d.results) ? data.d.results : [];

            if (results.length === 0) {
                return this.getMockConfig();
            }

            const normalizeUsers = (raw) => {
                if (!raw) return [];
                if (raw.results && Array.isArray(raw.results)) {
                    return raw.results.map(u => ({ Title: u.Title || u.title || "", EMail: u.EMail || u.email || "", Id: u.Id || u.id || "" }));
                }
                if (Array.isArray(raw)) {
                    return raw.map(u => ({ Title: u.Title || u.title || "", EMail: u.EMail || u.email || "", Id: u.Id || u.id || "" }));
                }
                if (raw.Title || raw.EMail || raw.title || raw.email) {
                    return [{ Title: raw.Title || raw.title || "", EMail: raw.EMail || raw.email || "", Id: raw.Id || raw.id || "" }];
                }
                return [];
            };

            return results.map(item => {
                const rawQA = (userField && item[userField.InternalName]) || item.QAExecutive || item.QA_x0020_Executive || item.AssignedUser;
                const rawProd = (prodField && item[prodField.InternalName]) || item.ProductionIncharge || item.Production_x0020_Incharge;
                const plantVal = (plantField && item[plantField.InternalName]) || item.Plant || "Rajpura";
                const typeVal = (checklistTypeField && item[checklistTypeField.InternalName]) || item.ChecklistType || item.Checklist_x0020_Type || item.Title || "";

                return {
                    Id: item.Id,
                    Title: item.Title || "",
                    Plant: plantVal,
                    ChecklistType: typeVal,
                    QAExecutives: normalizeUsers(rawQA),
                    ProductionIncharges: normalizeUsers(rawProd)
                };
            });
        } catch (e) {
            console.warn("FoodSafety SharePoint config fetch failed. Falling back to mock config:", e);
            return this.getMockConfig();
        }
    },

    getMockConfig: function () {
        return [
            {
                Id: 1,
                Title: "PPE Checklist",
                Plant: "Rajpura",
                ChecklistType: "PPE",
                QAExecutives: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Gokul K", EMail: "", Id: 108 },
                    { Title: "Babifas P", EMail: "", Id: 112 }
                ],
                ProductionIncharges: [
                    { Title: "Shaan Arshaqu", EMail: "", Id: 111 },
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 }
                ]
            },
            {
                Id: 2,
                Title: "GMP Checklist",
                Plant: "Rajpura",
                ChecklistType: "GMP",
                QAExecutives: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 },
                    { Title: "Gokul K", EMail: "", Id: 108 }
                ],
                ProductionIncharges: [
                    { Title: "Shaan Arshaqu", EMail: "", Id: 111 },
                    { Title: "Ajith K", EMail: "", Id: 110 }
                ]
            },
            {
                Id: 3,
                Title: "PCI Checklist",
                Plant: "Rajpura",
                ChecklistType: "PCI",
                QAExecutives: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 }
                ],
                ProductionIncharges: [
                    { Title: "Mishab Muhammed", EMail: "", Id: 101 }
                ]
            }
        ];
    },

    // 2. Get Dataverse Access Token (with fallback)
    getAccessToken: async function () {
        if (typeof getAccessToken === "function") {
            return await getAccessToken();
        }
        const storedToken = JSON.parse(localStorage.getItem("access_token"));
        const currentTime = new Date().getTime() / 1000;
        if (storedToken && storedToken.expires_at > currentTime) {
            return storedToken.token;
        }
        return "mock-token-" + Date.now();
    },

    // 3. fetch wrapper injecting Bearer token
    fetchWithToken: async function (url, options = {}) {
        let token = await this.getAccessToken();
        if (!options.headers) {
            options.headers = {};
        }
        if (token && !token.startsWith("mock-token")) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }

        let response;
        try {
            response = await fetch(url, options);
        } catch (e) {
            // Local dev / network failure mock fallback
            if (options.method === "POST" || options.method === "PATCH") {
                console.log(`Mock-save success for URL: ${url}`);
                const requestBody = options.body ? JSON.parse(options.body) : {};
                const isParentTour = url.includes(QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR) || url.includes("quality_tour");
                const idField = isParentTour
                    ? (url.includes("_prod_") ? "cr3ea_prod_rajpura_quality_tourid" : "cr3ea_rajpura_quality_tourid")
                    : (url.includes("_prod_") ? "cr3ea_prod_foodsafetychecklistforrajpuraid" : "cr3ea_foodsafetychecklistforrajpuraid");
                
                return {
                    ok: true,
                    json: async () => ({
                        [idField]: requestBody[idField] || "mock-guid-" + Math.random().toString(36).substring(2, 15),
                        ...requestBody
                    })
                };
            }
            throw e;
        }

        if (response.status === 401) {
            console.warn("FoodSafety_DAL: 401 Unauthorized. Clearing token cache & retrying...");
            localStorage.removeItem("access_token");
            const freshToken = await this.getAccessToken();
            if (freshToken && !freshToken.startsWith("mock-token")) {
                options.headers["Authorization"] = `Bearer ${freshToken}`;
                response = await fetch(url, options);
            }
        }
        return response;
    },

    // 4. Save/Update Tour Session (Parent Record)
    saveTourSession: async function (tourData) {
        const token = await this.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.PARENT; // Entity set plural name

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

        // Check if we are running in simulated environment
        if (!baseApiUrl || token.startsWith("mock-token")) {
            console.log(`Simulating SaveTourSession (${method}) locally:`, tourData);
            if (method === "POST") {
                tourData.cr3ea_prod_rajpura_quality_tourid = "mock-tour-guid-" + Math.floor(Math.random() * 1000000);
            }
            // Save to localStorage for dashboard history mapping
            this.saveToMockTourHistory(tourData);
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
        delete payload.cr3ea_food_safety_cycle;
        delete payload.cr3ea_request_time;
        delete payload.cr3ea_checklist_result;
        delete payload.cr3ea_tourcompletiondate;

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save tour session failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return normalizeTourRecord(tourData);
        } else {
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
        }
    },

    // 5. Save Checklist Item Row (Child Record)
    saveChecklistItem: async function (itemData) {
        const token = await this.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.CHILD; // Entity set plural name

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=minimal"
        };

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        const rowId = itemData.cr3ea_foodsafetychecklistforrajpuraid || itemData.cr3ea_prod_foodsafetychecklistforrajpuraid || itemData.cr953_foodsafetychecklistforrajpuraid || itemData.cr953_prod_foodsafetychecklistforrajpuraid;
        if (rowId) {
            url += `(${rowId})`;
            method = "PATCH";
        }

        if (!baseApiUrl || token.startsWith("mock-token")) {
            console.log(`Simulating SaveChecklistItem (${method}) locally:`, itemData);
            if (method === "POST") {
                itemData.cr3ea_foodsafetychecklistforrajpuraid = "mock-child-guid-" + Math.floor(Math.random() * 1000000);
                itemData.cr953_foodsafetychecklistforrajpuraid = itemData.cr3ea_foodsafetychecklistforrajpuraid;
            }
            this.saveToMockItemHistory(itemData);
            return itemData;
        }

        const payload = Object.assign({}, itemData);
        // Normalize Tour lookup binding for Dataverse table (supports cr3ea_qualitytourid like other modules)
        if (tableName.includes("cr3ea_")) {
            const bindUri = payload["cr3ea_qualitytourid@odata.bind"]
                         || payload["cr3ea_food_safety_tourid@odata.bind"] 
                         || payload["cr3ea_rajpura_quality_tour@odata.bind"] 
                         || payload["cr953_food_safety_tourid@odata.bind"];
            if (bindUri) {
                delete payload["cr3ea_food_safety_tourid@odata.bind"];
                delete payload["cr3ea_rajpura_quality_tour@odata.bind"];
                delete payload["cr953_food_safety_tourid@odata.bind"];
                payload["cr3ea_qualitytourid@odata.bind"] = bindUri;
            }
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save checklist item failed: ${response.status} - ${errorText}`);
        }

        if (response.status === 204 || method === "PATCH") {
            const entityIdHeader = response.headers ? response.headers.get("OData-EntityId") : null;
            if (entityIdHeader) {
                const match = entityIdHeader.match(/\(([0-9a-fA-F-]{36})\)/);
                if (match && match[1]) {
                    itemData.cr3ea_foodsafetychecklistforrajpuraid = match[1];
                    itemData.cr3ea_prod_foodsafetychecklistforrajpuraid = match[1];
                    itemData.cr953_foodsafetychecklistforrajpuraid = match[1];
                    itemData.cr953_prod_foodsafetychecklistforrajpuraid = match[1];
                }
            }
            return itemData;
        } else {
            const data = await response.json();
            const childId = data.cr3ea_foodsafetychecklistforrajpuraid || data.cr3ea_prod_foodsafetychecklistforrajpuraid || data.cr953_foodsafetychecklistforrajpuraid || data.cr953_prod_foodsafetychecklistforrajpuraid;
            if (childId) {
                data.cr3ea_foodsafetychecklistforrajpuraid = childId;
                data.cr3ea_prod_foodsafetychecklistforrajpuraid = childId;
                data.cr953_foodsafetychecklistforrajpuraid = childId;
                data.cr953_prod_foodsafetychecklistforrajpuraid = childId;
            }
            return data;
        }
    },

    // 5.b Retrieve Single Tour by ID
    getTour: async function (tourId) {
        return this.getTourById(tourId);
    },

    getParentTour: async function (tourId) {
        return this.getTourById(tourId);
    },

    getTourById: async function (tourId) {
        const token = await this.getAccessToken();
        if (!token || !tourId) return null;

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.PARENT;
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${cleanId})`;
        const response = await this.fetchWithToken(url, { method: "GET", headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch Food Safety tour by ID: ${response.statusText}`);
        }
        const data = await response.json();
        return normalizeTourRecord(data);
    },

    // 6. Get Tour History (for Dashboard and analytics)
    getTourHistory: async function () {
        const token = await this.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.PARENT;

        if (!baseApiUrl || token.startsWith("mock-token")) {
            return this.getMockTourHistory();
        }

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const filter = `?$filter=(cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}' or cr3ea_plantid eq 'Rajpura')&$orderby=cr3ea_tourstartdate desc&$top=100`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Dataverse tour history: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return (data.value || []).map(t => normalizeTourRecord(t));
    },

    // 7. Get Checklist Items for a Tour ID
    getChecklistItems: async function (tourId) {
        const token = await this.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.CHILD;

        if (!baseApiUrl || token.startsWith("mock-token")) {
            return this.getMockItemHistory(tourId);
        }

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
            throw new Error(`Failed to fetch Dataverse checklist items: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.value || [];
    },

    // 8. Delete a Checklist Item by GUID
    deleteChecklistItem: async function (guid) {
        const token = await this.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.CHILD;

        if (!baseApiUrl || token.startsWith("mock-token")) {
            this.deleteMockChecklistItem(guid);
            return true;
        }

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${guid})`;
        const response = await this.fetchWithToken(url, {
            method: "DELETE",
            headers: headers
        });

        if (!response.ok && response.status !== 204) {
            const errorText = await response.text();
            throw new Error(`Failed to delete Dataverse item: ${response.status} - ${errorText}`);
        }
        return true;
    },

    // 9. Clean up all existing child checklist items for a Tour ID
    cleanChecklistItems: async function (tourId) {
        try {
            const existing = await this.getChecklistItems(tourId);
            if (existing && existing.length > 0) {
                console.log(`Cleaning up ${existing.length} obsolete child records for Tour ID: ${tourId}`);
                for (const item of existing) {
                    const childGuid = item.cr3ea_foodsafetychecklistforrajpuraid || item.cr3ea_prod_foodsafetychecklistforrajpuraid || item.cr953_foodsafetychecklistforrajpuraid || item.cr953_prod_foodsafetychecklistforrajpuraid;
                    if (childGuid) {
                        await this.deleteChecklistItem(childGuid);
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to clean up old checklist items, proceeding with save:", e);
        }
    },

    // 10. Upload proof document / image to SharePoint Document Library FoodSafetyRajpuraDocs
    uploadAttachmentFile: async function (fileObject, tourId, checklistType, checkpointId, actionRemarks) {
        if (!fileObject) return "";

        // Client-side image compression
        if (typeof window.compressImageFile === "function" && fileObject.type && fileObject.type.startsWith("image/")) {
            try {
                fileObject = await window.compressImageFile(fileObject);
            } catch (e) {
                console.warn("Image compression failed, using original: ", e);
            }
        }

        const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
            ? QualityRajpura_Config.getSiteBaseUrl()
            : ((typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl) ? _spPageContextInfo.webAbsoluteUrl : "");
        const webServerRelativeUrl = typeof _spPageContextInfo !== 'undefined' ? (_spPageContextInfo.webServerRelativeUrl || "") : "";
        const libraryName = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.SHAREPOINT_DOCS && QualityRajpura_Config.SHAREPOINT_DOCS.FOOD_SAFETY)
            ? QualityRajpura_Config.SHAREPOINT_DOCS.FOOD_SAFETY
            : "FoodSafetyRajpuraDocs";

        if (!webUrl || webUrl.startsWith("http://localhost") || webUrl.startsWith("file://")) {
            console.log("Mock file upload in local environment:", fileObject.name);
            return `/sites/Mrs_Bectors_PTMS/${libraryName}/mock_${Date.now()}_${fileObject.name}`;
        }

        const serverRelativeUrl = webServerRelativeUrl === "/" || !webServerRelativeUrl
            ? `/${libraryName}`
            : `${webServerRelativeUrl}/${libraryName}`;

        let requestDigest = "";
        const requestDigestEl = document.getElementById("__REQUESTDIGEST");
        if (requestDigestEl && requestDigestEl.value) {
            requestDigest = requestDigestEl.value;
        } else if (this._cachedDigest) {
            requestDigest = this._cachedDigest;
        } else {
            try {
                const digestResponse = await $.ajax({
                    url: `${webUrl}/_api/contextinfo`,
                    method: "POST",
                    headers: { "Accept": "application/json; odata=verbose" }
                });
                requestDigest = digestResponse.d.GetContextWebInformation.FormDigestValue;
                this._cachedDigest = requestDigest;
                setTimeout(() => { this._cachedDigest = null; }, 20 * 60 * 1000);
            } catch (dErr) {
                console.warn("Failed fetching digest from contextinfo:", dErr);
            }
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
        } else if (uploadResponse.d && uploadResponse.d.ServerRelativeUrl) {
            try {
                const fileUrl = uploadResponse.d.ServerRelativeUrl;
                const itemResponse = await $.ajax({
                    url: `${webUrl}/_api/web/getFileByServerRelativeUrl('${fileUrl}')/ListItemAllFields`,
                    method: "GET",
                    headers: { "Accept": "application/json; odata=verbose" }
                });
                fileItemId = itemResponse.d.Id;
            } catch (itemErr) {
                console.warn("Could not retrieve ListItemAllFields:", itemErr);
            }
        }

        // Optional metadata tagging (safe fallback if custom columns are not yet provisioned on library)
        if (fileItemId) {
            try {
                if (!this._cachedEntityType) this._cachedEntityType = {};
                let listItemEntityType = this._cachedEntityType[libraryName];
                if (!listItemEntityType) {
                    const entityResponse = await $.ajax({
                        url: `${webUrl}/_api/web/lists/getByTitle('${libraryName}')?$select=ListItemEntityTypeFullName`,
                        method: "GET",
                        headers: { "Accept": "application/json; odata=verbose" }
                    });
                    listItemEntityType = entityResponse.d.ListItemEntityTypeFullName;
                    this._cachedEntityType[libraryName] = listItemEntityType;
                }

                const metadataPayload = {
                    "__metadata": { "type": listItemEntityType },
                    "Title": uniqueFileName
                };
                if (tourId) metadataPayload["QualityTourId"] = tourId;
                if (checklistType) metadataPayload["ChecklistType"] = checklistType;
                if (checkpointId) metadataPayload["CheckpointID"] = String(checkpointId);
                if (actionRemarks) metadataPayload["ActionRemarks"] = String(actionRemarks);

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
            } catch (metaErr) {
                console.warn("Metadata tagging optional update skipped or failed:", metaErr);
            }
        }

        return uploadResponse.d.ServerRelativeUrl;
    },

    deleteMockChecklistItem: function (guid) {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_items") || "[]");
        history = history.filter(i => (i.cr3ea_foodsafetychecklistforrajpuraid !== guid && i.cr953_foodsafetychecklistforrajpuraid !== guid));
        localStorage.setItem("mock_foodsafety_items", JSON.stringify(history));
    },

    // --- Mock Storage Helpers for Local Development ---
    saveToMockTourHistory: function (tour) {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_tours") || "[]");
        const idx = history.findIndex(t => t.cr3ea_prod_rajpura_quality_tourid === tour.cr3ea_prod_rajpura_quality_tourid);
        if (idx !== -1) {
            history[idx] = { ...history[idx], ...tour };
        } else {
            history.unshift(tour);
        }
        localStorage.setItem("mock_foodsafety_tours", JSON.stringify(history));
    },

    saveToMockItemHistory: function (item) {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_items") || "[]");
        const idx = history.findIndex(i => (
            (i.cr3ea_foodsafetychecklistforrajpuraid && i.cr3ea_foodsafetychecklistforrajpuraid === item.cr3ea_foodsafetychecklistforrajpuraid) ||
            (i.cr953_foodsafetychecklistforrajpuraid && i.cr953_foodsafetychecklistforrajpuraid === item.cr953_foodsafetychecklistforrajpuraid)
        ));
        if (idx !== -1) {
            history[idx] = { ...history[idx], ...item };
        } else {
            history.push(item);
        }
        localStorage.setItem("mock_foodsafety_items", JSON.stringify(history));
    },

    getMockTourHistory: function () {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_tours") || "[]");
        if (history.length === 0) {
            // Seed a mock tour for demonstration
            history = [
                {
                    cr3ea_prod_rajpura_quality_tourid: "mock-tour-guid-1",
                    cr3ea_food_safety_checklisttype: "PPE Checklist",
                    cr3ea_plantid: "Rajpura",
                    cr3ea_lineno: "Line 1",
                    cr3ea_assigned_qa: "QA Executive 1",
                    cr3ea_shiftexecutiveproduction: "Production Lead",
                    cr3ea_tourstartdate: new Date(Date.now() - 86400000 * 2).toISOString(),
                    cr3ea_tourcompletiondate: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
                    cr3ea_status: "Submitted",
                    cr3ea_checklist_result: "Pass",
                    cr3ea_overall_score: "96%",
                    cr3ea_food_safety_area: "Packing",
                    cr3ea_food_safety_cycle: "Cycle-1"
                },
                {
                    cr3ea_prod_rajpura_quality_tourid: "mock-tour-guid-2",
                    cr3ea_food_safety_checklisttype: "GMP Checklist",
                    cr3ea_plantid: "Rajpura",
                    cr3ea_lineno: "Line 2",
                    cr3ea_assigned_qa: "QA Executive 2",
                    cr3ea_shiftexecutiveproduction: "Production Lead 2",
                    cr3ea_tourstartdate: new Date(Date.now() - 86400000).toISOString(),
                    cr3ea_tourcompletiondate: new Date(Date.now() - 86400000 + 1200000).toISOString(),
                    cr3ea_status: "Submitted",
                    cr3ea_checklist_result: "Fail",
                    cr3ea_overall_score: "78%",
                    cr3ea_food_safety_cycle: "Cycle-2"
                }
            ];
            localStorage.setItem("mock_foodsafety_tours", JSON.stringify(history));
        }
        return history;
    },

    getMockItemHistory: function (tourId) {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_items") || "[]");
        const cleanId = String(tourId).toLowerCase().trim();
        return history.filter(item => {
            const itemTourId = item.cr3ea_rajpura_quality_tour || item.cr3ea_food_safety_tourid || item.cr953_food_safety_tourid || "";
            // Handle mock structures
            return String(itemTourId).toLowerCase().includes(cleanId) || 
                   (item.cr3ea_rajpura_quality_tour && item.cr3ea_rajpura_quality_tour.cr3ea_prod_rajpura_quality_tourid && 
                    String(item.cr3ea_rajpura_quality_tour.cr3ea_prod_rajpura_quality_tourid).toLowerCase().includes(cleanId)) ||
                   (item.cr3ea_food_safety_tourid && item.cr3ea_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid && 
                    String(item.cr3ea_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid).toLowerCase().includes(cleanId)) ||
                   (item.cr953_food_safety_tourid && item.cr953_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid && 
                    String(item.cr953_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid).toLowerCase().includes(cleanId));
        });
    }
};
