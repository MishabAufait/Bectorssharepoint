// Data Access Layer for Food Safety Checklist (Dataverse & SharePoint)
console.log("Food Safety DAL loaded");

const FoodSafety_DAL = {
    // 1. Get SharePoint Config (for QA Executives listing)
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.FOOD_SAFETY;

        let query = "?$select=Id,Title," +
            "QAExecutive/Title,QAExecutive/EMail,QAExecutive/Id," +
            "ProductionIncharge/Title,ProductionIncharge/EMail,ProductionIncharge/Id" +
            "&$expand=QAExecutive,ProductionIncharge";

        let url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
        let response;

        try {
            response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
        } catch (e) {
            console.warn("Could not reach SharePoint config. Simulating local config.");
            return this.getMockConfig();
        }

        if (!response || !response.ok) {
            console.warn("SharePoint config response not OK. Simulating local config.");
            return this.getMockConfig();
        }

        const data = await response.json();
        const results = data.d.results;

        return results.map(item => {
            let qaList = [];
            if (item.QAExecutive && item.QAExecutive.results && Array.isArray(item.QAExecutive.results)) {
                qaList = item.QAExecutive.results.map(u => ({ Title: u.Title, EMail: u.EMail, Id: u.Id }));
            } else if (item.QAExecutive && item.QAExecutive.Title) {
                qaList = [{ Title: item.QAExecutive.Title, EMail: item.QAExecutive.EMail, Id: item.QAExecutive.Id }];
            }

            let prodList = [];
            if (item.ProductionIncharge && item.ProductionIncharge.results && Array.isArray(item.ProductionIncharge.results)) {
                prodList = item.ProductionIncharge.results.map(u => ({ Title: u.Title, EMail: u.EMail, Id: u.Id }));
            } else if (item.ProductionIncharge && item.ProductionIncharge.Title) {
                prodList = [{ Title: item.ProductionIncharge.Title, EMail: item.ProductionIncharge.EMail, Id: item.ProductionIncharge.Id }];
            }

            return {
                Id: item.Id,
                Title: item.Title,
                QAExecutives: qaList,
                ProductionIncharges: prodList
            };
        });
    },

    getMockConfig: function () {
        return [
            {
                Id: 1,
                Title: "QA Config 1",
                QAExecutives: [
                    { Title: "Mishab Muhammed", EMail: "mishab@bectors.com" }
                ],
                ProductionIncharges: [
                    { Title: "Mishab Muhammed", EMail: "mishab@bectors.com" }
                ]
            },
            {
                Id: 2,
                Title: "QA Config 2",
                QAExecutives: [
                    { Title: "Gokul K", EMail: "gokul@bectors.com" }
                ],
                ProductionIncharges: [
                    { Title: "Shaan Arshaqu", EMail: "shaan@bectors.com" }
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
                const idField = url.includes("cr3ea_prod_rajpura_quality_tours") 
                    ? "cr3ea_prod_rajpura_quality_tourid" 
                    : "cr953_foodsafetychecklistforrajpuraid";
                
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

    // 4. Save Tour Session (Parent Record)
    saveTourSession: async function (tourData) {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
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

        if (tourData.cr3ea_prod_rajpura_quality_tourid) {
            url += `(${tourData.cr3ea_prod_rajpura_quality_tourid})`;
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
            return tourData;
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(tourData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save tour session failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return tourData;
        } else {
            return await response.json();
        }
    },

    // 5. Save Checklist Item Row (Child Record)
    saveChecklistItem: async function (itemData) {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.CHILD; // Entity set plural name

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        if (itemData.cr953_foodsafetychecklistforrajpuraid) {
            url += `(${itemData.cr953_foodsafetychecklistforrajpuraid})`;
            method = "PATCH";
        }

        if (!baseApiUrl || token.startsWith("mock-token")) {
            console.log(`Simulating SaveChecklistItem (${method}) locally:`, itemData);
            if (method === "POST") {
                itemData.cr953_foodsafetychecklistforrajpuraid = "mock-child-guid-" + Math.floor(Math.random() * 1000000);
            }
            this.saveToMockItemHistory(itemData);
            return itemData;
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(itemData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse save checklist item failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return itemData;
        } else {
            return await response.json();
        }
    },

    // 6. Get Tour History (for Dashboard and analytics)
    getTourHistory: async function () {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
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

        // Fetch last 100 tours where checklist type is PPE, GMP or PCI
        const filter = `?$filter=(contains(cr3ea_food_safety_checklisttype,'Checklist') or cr3ea_food_safety_checklisttype eq 'PPE Checklist' or cr3ea_food_safety_checklisttype eq 'GMP Checklist' or cr3ea_food_safety_checklisttype eq 'PCI Checklist')&$orderby=cr3ea_tourstartdate desc&$top=100`;
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
        return data.value || [];
    },

    // 7. Get Checklist Items for a Tour ID
    getChecklistItems: async function (tourId) {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
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
        const filter = `?$filter=cr953_food_safety_tourid/cr3ea_prod_rajpura_quality_tourid eq '${cleanTourId}'`;
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

    // 8. Delete a Checklist Item Row (Child Record)
    deleteChecklistItem: async function (guid) {
        const token = await this.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.FOOD_SAFETY.CHILD;

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}(${guid})`;

        if (!baseApiUrl || token.startsWith("mock-token")) {
            console.log(`Simulating DeleteChecklistItem locally: ${guid}`);
            this.deleteMockChecklistItem(guid);
            return true;
        }

        const response = await this.fetchWithToken(url, {
            method: "DELETE",
            headers: headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse delete checklist item failed: ${response.status} - ${errorText}`);
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
                    if (item.cr953_foodsafetychecklistforrajpuraid) {
                        await this.deleteChecklistItem(item.cr953_foodsafetychecklistforrajpuraid);
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to clean up old checklist items, proceeding with save:", e);
        }
    },

    deleteMockChecklistItem: function (guid) {
        let history = JSON.parse(localStorage.getItem("mock_foodsafety_items") || "[]");
        history = history.filter(i => i.cr953_foodsafetychecklistforrajpuraid !== guid);
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
        const idx = history.findIndex(i => i.cr953_foodsafetychecklistforrajpuraid === item.cr953_foodsafetychecklistforrajpuraid);
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
            const itemTourId = item.cr953_food_safety_tourid || "";
            // Handle mock structures
            return String(itemTourId).toLowerCase().includes(cleanId) || 
                   (item.cr953_food_safety_tourid && item.cr953_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid && 
                    String(item.cr953_food_safety_tourid.cr3ea_prod_rajpura_quality_tourid).toLowerCase().includes(cleanId));
        });
    }
};
