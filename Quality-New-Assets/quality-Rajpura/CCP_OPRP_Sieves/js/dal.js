// Data Access Layer for Rajpura CCP, OPRP, Sieves & Magnets Quality form
console.log("CCP_OPRP_Sieves DAL loaded");

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

const CCP_OPRP_DAL = {
    // 1. Load SharePoint Configuration List mappings with dynamic column name resolution
    getConfig: async function () {
        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        const listName = QualityRajpura_Config.SHAREPOINT_LISTS.CCP_OPRP_SIEVES_MAGNETS;

        if (!webUrl) {
            console.warn("No SharePoint context. Returning mock configurations.");
            return this.getMockConfig();
        }

        try {
            // Probe list fields dynamically first to prevent OData 400 Bad Request
            const fieldsUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/Fields?$select=InternalName,Title,TypeAsString`;
            console.log("Probing SharePoint fields from: ", fieldsUrl);
            const fieldsResponse = await fetch(fieldsUrl, { headers: { "Accept": "application/json; odata=verbose" } });
            
            if (!fieldsResponse.ok) {
                throw new Error(`Failed to fetch list schema fields: ${fieldsResponse.statusText}`);
            }
            
            const fieldsData = await fieldsResponse.json();
            const listFields = fieldsData.d.results || [];
            console.log("All list fields found on SharePoint list:", listFields.map(f => `${f.Title} (${f.InternalName}) [${f.TypeAsString}]`));

            // Match fields dynamically by internal name lists or display titles
            const findField = (possibleNames, displayName) => {
                let match = listFields.find(f => possibleNames.includes(f.InternalName));
                if (match) return match;
                match = listFields.find(f => f.Title === displayName);
                return match;
            };

            const configTypeField = findField(["ConfigType", "Config_x0020_Type"], "Config Type");
            const plantField = findField(["Plant"], "Plant");
            const assignedQAField = findField(["AssignedQA", "Assigned_x0020_QA", "AssignedUser", "Assigned_x0020_User"], "Assigned QA");
            const escalationManagerField = findField(["EscalationManager", "Escalation_x0020_Manager"], "Escalation Manager");
            const productionInchargeField = findField(["ProductionIncharge", "Production_x0020_Incharge"], "Production Incharge");

            console.log("Resolved field internal names on SharePoint:", {
                ConfigType: configTypeField ? configTypeField.InternalName : "NOT_FOUND",
                Plant: plantField ? plantField.InternalName : "NOT_FOUND",
                AssignedQA: assignedQAField ? assignedQAField.InternalName : "NOT_FOUND",
                EscalationManager: escalationManagerField ? escalationManagerField.InternalName : "NOT_FOUND",
                ProductionIncharge: productionInchargeField ? productionInchargeField.InternalName : "NOT_FOUND"
            });

            const selectParts = ["Id", "Title"];
            const expandParts = [];

            if (plantField) selectParts.push(plantField.InternalName);
            if (configTypeField) selectParts.push(configTypeField.InternalName);

            if (assignedQAField) {
                const name = assignedQAField.InternalName;
                selectParts.push(`${name}/Title`, `${name}/EMail`, `${name}/Id`);
                expandParts.push(name);
            }
            if (escalationManagerField) {
                const name = escalationManagerField.InternalName;
                selectParts.push(`${name}/Title`, `${name}/EMail`, `${name}/Id`);
                expandParts.push(name);
            }
            if (productionInchargeField) {
                const name = productionInchargeField.InternalName;
                selectParts.push(`${name}/Title`, `${name}/EMail`, `${name}/Id`);
                expandParts.push(name);
            }

            let query = `?$select=${selectParts.join(",")}`;
            if (expandParts.length > 0) {
                query += `&$expand=${expandParts.join(",")}`;
            }
            if (plantField) {
                query += `&$filter=${plantField.InternalName} eq '${QualityRajpura_Config.PLANT_NAME}'`;
            }

            const url = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            console.log("Fetching configuration data items from URL: ", url);
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch config data: ${response.statusText}`);
            }

            const data = await response.json();
            const results = data.d.results || [];

            const mappedConfigs = results.map(item => {
                const configTypeVal = configTypeField ? item[configTypeField.InternalName] : "";
                const plantVal = plantField ? item[plantField.InternalName] : "Rajpura";
                
                const rawQA = assignedQAField ? item[assignedQAField.InternalName] : null;
                let qaNormalized = { results: [] };
                if (rawQA) {
                    if (rawQA.results && Array.isArray(rawQA.results)) {
                        qaNormalized = rawQA;
                    } else if (rawQA.Title || rawQA.EMail) {
                        qaNormalized = { results: [rawQA] };
                    }
                }

                const rawManager = escalationManagerField ? item[escalationManagerField.InternalName] : null;
                let managerNormalized = { results: [] };
                if (rawManager) {
                    if (rawManager.results && Array.isArray(rawManager.results)) {
                        managerNormalized = rawManager;
                    } else if (rawManager.Title || rawManager.EMail) {
                        managerNormalized = { results: [rawManager] };
                    }
                }

                const rawIncharge = productionInchargeField ? item[productionInchargeField.InternalName] : null;
                let inchargeNormalized = { results: [] };
                if (rawIncharge) {
                    if (rawIncharge.results && Array.isArray(rawIncharge.results)) {
                        inchargeNormalized = rawIncharge;
                    } else if (rawIncharge.Title || rawIncharge.EMail) {
                        inchargeNormalized = { results: [rawIncharge] };
                    }
                }

                return {
                    Id: item.Id,
                    Title: item.Title,
                    ConfigType: configTypeVal,
                    Plant: plantVal,
                    AssignedQA: qaNormalized,
                    EscalationManager: managerNormalized,
                    ProductionIncharge: inchargeNormalized
                };
            });

            console.log("Successfully fetched and normalized config results:", mappedConfigs);
            return mappedConfigs;

        } catch (e) {
            console.error("Dynamic config loader failed, falling back to mock: ", e);
            return this.getMockConfig();
        }
    },

    // 2. Dataverse Token Access
    getAccessToken: async function () {
        if (typeof getAccessToken === "function") {
            return await getAccessToken();
        }
        const storedToken = JSON.parse(localStorage.getItem("access_token"));
        const currentTime = new Date().getTime() / 1000;
        if (storedToken && storedToken.expires_at > currentTime) {
            return storedToken.token;
        }
        return "mock-token";
    },

    // 3. Fetch wrapper with refresh handling
    fetchWithToken: async function (url, options = {}) {
        let token = await this.getAccessToken();
        if (!options.headers) options.headers = {};
        if (token && !token.startsWith("mock-")) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
        let response = await fetch(url, options);
        if (response.status === 401) {
            localStorage.removeItem("access_token");
            const freshToken = await this.getAccessToken();
            if (freshToken && !freshToken.startsWith("mock-")) {
                options.headers["Authorization"] = `Bearer ${freshToken}`;
                response = await fetch(url, options);
            }
        }
        return response;
    },

    // 4. Fetch Quality Tour Parent details
    getParentTour: async function (tourId) {
        const token = await this.getAccessToken();
        if (!tourId || token.startsWith("mock-")) {
            return this.getMockParentTour(tourId);
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
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
            throw new Error(`Failed to load parent tour: ${response.statusText}`);
        }
        return normalizeTourRecord(await response.json());
    },

    // 5. Update Quality Tour Parent details
    updateParentTour: async function (tourId, payload) {
        const token = await this.getAccessToken();
        if (!tourId || token.startsWith("mock-")) {
            return this.updateMockParentTour(tourId, payload);
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
            "Prefer": "return=representation"
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
        const response = await this.fetchWithToken(url, {
            method: "PATCH",
            headers,
            body: JSON.stringify(cleanPayload)
        });

        if (!response.ok) {
            throw new Error(`Failed to update parent tour: ${await response.text()}`);
        }
        return true;
    },

    // 5b. Save/Create parent tour session
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
        if (!baseApiUrl || token.startsWith("mock-")) {
            console.log(`Simulating saveTourSession (${method}) locally:`, tourData);
            if (method === "POST") {
                tourData.cr3ea_prod_rajpura_quality_tourid = "mock-tour-guid-" + Math.floor(Math.random() * 1000000);
            }
            this.updateMockParentTour(tourData.cr3ea_prod_rajpura_quality_tourid, tourData);
            return normalizeTourRecord(tourData);
        }

        const payload = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.sanitizeParentTourPayload)
            ? QualityRajpura_Config.sanitizeParentTourPayload(tourData)
            : { ...tourData };
        delete payload.cr3ea_prod_rajpura_quality_tourid;
        delete payload.cr3ea_rajpura_quality_tourid;
        delete payload.cr3ea_prod_rajpura_quality_toursid;
        delete payload.cr3ea_rajpura_quality_toursid;
        delete payload.cr3ea_ccp_oprp_sieves_productvariety;
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
        } else {
            const data = await response.json();
            return normalizeTourRecord(data);
        }
    },

    // 6. Get child records by type (CCP or Sieves)
    getChecklistItems: async function (tourId, type) {
        const token = await this.getAccessToken();
        if (!tourId || token.startsWith("mock-")) {
            return this.getMockChecklistItems(tourId, type);
        }

        const apiVersion = "9.2";
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();
        const tableName = type === "CCP" 
            ? QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_CCP
            : QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_SIEVES;

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const filter = `?$filter=_cr3ea_qualitytourid_value eq '${cleanId}'`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, { method: "GET", headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch checklist items: ${response.statusText}`);
        }
        const data = await response.json();
        return data.value || [];
    },

    // 7. Save child record
    saveChecklistItem: async function (payload, type) {
        const token = await this.getAccessToken();
        if (token.startsWith("mock-")) {
            return this.saveMockChecklistItem(payload, type);
        }

        const apiVersion = "9.2";
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const tableName = type === "CCP" 
            ? QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_CCP
            : QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_SIEVES;

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        // Determine GUID parameter key
        const isProd = tableName.includes("_prod_");
        const idField = type === "CCP" 
            ? (isProd ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_rajpura_ccpoprpid")
            : (isProd ? "cr3ea_prod_rajpura_sievesmagnetsid" : "cr3ea_rajpura_sievesmagnetsid");
        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        const existingId = payload[idField] || 
            (type === "CCP" 
                ? (payload.cr3ea_prod_rajpura_ccpoprpid || payload.cr3ea_rajpura_ccpoprpid)
                : (payload.cr3ea_prod_rajpura_sievesmagnetsid || payload.cr3ea_rajpura_sievesmagnetsid));

        if (existingId) {
            url += `(${existingId})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Dataverse save checklist item failed: ${await response.text()}`);
        }

        if (method === "PATCH") {
            return payload;
        } else {
            const resData = await response.json();
            const childId = resData[idField] || existingId;
            if (childId) {
                if (type === "CCP") {
                    resData.cr3ea_prod_rajpura_ccpoprpid = childId;
                    resData.cr3ea_rajpura_ccpoprpid = childId;
                } else {
                    resData.cr3ea_prod_rajpura_sievesmagnetsid = childId;
                    resData.cr3ea_rajpura_sievesmagnetsid = childId;
                }
            }
            return resData;
        }
    },

    // 8. Delete child record
    deleteChecklistItem: async function (guid, type) {
        const token = await this.getAccessToken();
        if (token.startsWith("mock-")) {
            return this.deleteMockChecklistItem(guid, type);
        }

        const apiVersion = "9.2";
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const tableName = type === "CCP" 
            ? QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_CCP
            : QualityRajpura_Config.DATAVERSE_TABLES.CCP_OPRP_SIEVES_MAGNETS.CHILD_SIEVES;

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

    // 9. Clean all child records for a TourId & specific Cycle
    cleanChecklistItems: async function (tourId, type, cycleNum) {
        try {
            const existing = await this.getChecklistItems(tourId, type);
            if (existing && existing.length > 0) {
                const idField = type === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
                const cycleKey = cycleNum ? `Cycle-${cycleNum}` : null;
                for (const item of existing) {
                    if (item[idField]) {
                        // If cycleNum is provided, only clean up items belonging to that cycle
                        if (!cycleKey || item.cr3ea_cycle === cycleKey) {
                            await this.deleteChecklistItem(item[idField], type);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Checklist cleanup failed, proceeding anyway: ", e);
        }
    },

    // --- Mock Storage Helpers for Local Development ---
    getMockConfig: function () {
        return [
            { Id: 1, Title: "Line-1", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [{ Title: "QA Ankur", EMail: "ankur@sp.com" }] }, EscalationManager: { results: [{ Title: "Mgr Suresh", EMail: "suresh@sp.com" }] }, ProductionIncharge: { results: [{ Title: "Prod Mahesh", EMail: "mahesh@sp.com" }] } },
            { Id: 2, Title: "Line-2", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [{ Title: "QA Ankur", EMail: "ankur@sp.com" }] }, EscalationManager: { results: [{ Title: "Mgr Suresh", EMail: "suresh@sp.com" }] }, ProductionIncharge: { results: [{ Title: "Prod Mahesh", EMail: "mahesh@sp.com" }] } },
            { Id: 5, Title: "Line-5", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [{ Title: "QA Ankur", EMail: "ankur@sp.com" }] }, EscalationManager: { results: [{ Title: "Mgr Suresh", EMail: "suresh@sp.com" }] }, ProductionIncharge: { results: [{ Title: "Prod Mahesh", EMail: "mahesh@sp.com" }] } },
            { Id: 6, Title: "Line-6", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [{ Title: "QA Ankur", EMail: "ankur@sp.com" }] }, EscalationManager: { results: [{ Title: "Mgr Suresh", EMail: "suresh@sp.com" }] }, ProductionIncharge: { results: [{ Title: "Prod Mahesh", EMail: "mahesh@sp.com" }] } }
        ];
    },

    getMockParentTour: function (tourId) {
        let tours = JSON.parse(localStorage.getItem("mock_parent_tours") || "[]");
        let match = tours.find(t => t.cr3ea_prod_rajpura_quality_tourid === tourId);
        if (!match) {
            match = {
                cr3ea_prod_rajpura_quality_tourid: tourId || "mock-tour-guid",
                cr3ea_plantid: "Rajpura",
                cr3ea_lineno: "Line-5",
                cr3ea_assigned_qa: "QA Ankur",
                cr3ea_shiftexecutiveproduction: "Prod Mahesh",
                cr3ea_ccp_oprp_sieves_parametertype: "CCP & OPRP",
                cr3ea_ccp_oprp_sieves_frequency: "4hrs",
                cr3ea_status: "In Progress"
            };
        }
        return match;
    },

    updateMockParentTour: function (tourId, payload) {
        let tours = JSON.parse(localStorage.getItem("mock_parent_tours") || "[]");
        let idx = tours.findIndex(t => t.cr3ea_prod_rajpura_quality_tourid === tourId);
        let match = idx !== -1 ? tours[idx] : this.getMockParentTour(tourId);
        Object.assign(match, payload);
        if (idx !== -1) tours[idx] = match;
        else tours.push(match);
        localStorage.setItem("mock_parent_tours", JSON.stringify(tours));
        return true;
    },

    getMockChecklistItems: function (tourId, type) {
        const storeName = type === "CCP" ? "mock_ccpoprp_items" : "mock_sievesmagnets_items";
        let items = JSON.parse(localStorage.getItem(storeName) || "[]");
        return items.filter(i => i.cr3ea_qualitytourid === tourId);
    },

    saveMockChecklistItem: function (payload, type) {
        const storeName = type === "CCP" ? "mock_ccpoprp_items" : "mock_sievesmagnets_items";
        const idField = type === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
        let items = JSON.parse(localStorage.getItem(storeName) || "[]");
 
        if (!payload[idField]) {
            payload[idField] = "mock-child-" + Math.random().toString(36).substr(2, 9);
            items.push(payload);
        } else {
            let idx = items.findIndex(i => i[idField] === payload[idField]);
            if (idx !== -1) {
                items[idx] = Object.assign({}, items[idx], payload);
            } else {
                items.push(payload);
            }
        }
        localStorage.setItem(storeName, JSON.stringify(items));
        return payload;
    },

    deleteMockChecklistItem: function (guid, type) {
        const storeName = type === "CCP" ? "mock_ccpoprp_items" : "mock_sievesmagnets_items";
        const idField = type === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
        let items = JSON.parse(localStorage.getItem(storeName) || "[]");
        items = items.filter(i => i[idField] !== guid);
        localStorage.setItem(storeName, JSON.stringify(items));
        return true;
    }
};
