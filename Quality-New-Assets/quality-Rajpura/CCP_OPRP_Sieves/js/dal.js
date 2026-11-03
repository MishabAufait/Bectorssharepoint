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
            const assignedQAField = findField(["AssignedQA", "Assigned_x0020_QA"], "Assigned QA");
            const assignedUserField = findField(["AssignedUser", "Assigned_x0020_User"], "Assigned User");
            const escalationManagerField = findField(["EscalationManager", "Escalation_x0020_Manager"], "Escalation Manager");
            const productionInchargeField = findField(["ProductionIncharge", "Production_x0020_Incharge"], "Production Incharge");
            const lineNameField = findField(["LineName", "Line_x0020_Name", "Line"], "Line Name");
            const productCodeField = findField(["ProductCode", "Product_x0020_Code", "SKU"], "Product Code");
            const productCategoryField = findField(["ProductCategory", "Product_x0020_Category", "Category"], "Product Category");
            const isActiveField = findField(["IsActive", "Is_x0020_Active", "Active"], "Is Active");

            console.log("Resolved field internal names on SharePoint:", {
                ConfigType: configTypeField ? configTypeField.InternalName : "NOT_FOUND",
                Plant: plantField ? plantField.InternalName : "NOT_FOUND",
                AssignedQA: assignedQAField ? assignedQAField.InternalName : "NOT_FOUND",
                AssignedUser: assignedUserField ? assignedUserField.InternalName : "NOT_FOUND",
                EscalationManager: escalationManagerField ? escalationManagerField.InternalName : "NOT_FOUND",
                ProductionIncharge: productionInchargeField ? productionInchargeField.InternalName : "NOT_FOUND",
                LineName: lineNameField ? lineNameField.InternalName : "NOT_FOUND",
                ProductCode: productCodeField ? productCodeField.InternalName : "NOT_FOUND",
                ProductCategory: productCategoryField ? productCategoryField.InternalName : "NOT_FOUND",
                IsActive: isActiveField ? isActiveField.InternalName : "NOT_FOUND"
            });

            const selectParts = ["Id", "Title"];
            const expandParts = [];

            if (plantField) selectParts.push(plantField.InternalName);
            if (configTypeField) selectParts.push(configTypeField.InternalName);
            if (lineNameField) selectParts.push(lineNameField.InternalName);
            if (productCodeField) selectParts.push(productCodeField.InternalName);
            if (productCategoryField) selectParts.push(productCategoryField.InternalName);
            if (isActiveField) selectParts.push(isActiveField.InternalName);

            if (assignedQAField) {
                const name = assignedQAField.InternalName;
                selectParts.push(`${name}/Title`, `${name}/EMail`, `${name}/Id`);
                expandParts.push(name);
            }
            if (assignedUserField) {
                const name = assignedUserField.InternalName;
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

            let query = `?$select=${selectParts.join(",")}&$top=5000`;
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
                const configTypeVal = configTypeField ? item[configTypeField.InternalName] : (item.ConfigType || item.Config_x0020_Type || "");
                const plantVal = plantField ? item[plantField.InternalName] : (item.Plant || "Rajpura");
                const lineNameVal = lineNameField ? item[lineNameField.InternalName] : (item.LineName || item.Line_x0020_Name || "");
                const productCodeVal = productCodeField ? item[productCodeField.InternalName] : (item.ProductCode || item.Product_x0020_Code || "");
                const productCategoryVal = productCategoryField ? item[productCategoryField.InternalName] : (item.ProductCategory || item.Product_x0020_Category || "");
                const isActiveVal = isActiveField ? (item[isActiveField.InternalName] !== false) : (item.IsActive !== false);
                
                const extractUserEmail = (u) => {
                    if (!u) return "";
                    let em = u.EMail || u.email || u.Email || "";
                    if (!em || !em.includes("@")) {
                        const match = String(u.Name || u.name || u.LoginName || u.loginName || u.UserPrincipalName || "").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                        if (match) em = match[0].toLowerCase();
                    }
                    return em ? em.toLowerCase() : "";
                };

                const normalizeUsers = (raw) => {
                    if (!raw) return { results: [] };
                    if (raw.results && Array.isArray(raw.results)) {
                        return { results: raw.results.map(u => ({ Title: u.Title || u.title || "", EMail: extractUserEmail(u), Id: u.Id || u.id || "" })) };
                    }
                    if (Array.isArray(raw)) {
                        return { results: raw.map(u => ({ Title: u.Title || u.title || "", EMail: extractUserEmail(u), Id: u.Id || u.id || "" })) };
                    }
                    if (raw.Title || raw.EMail || raw.Name || raw.LoginName) {
                        return { results: [{ Title: raw.Title || raw.title || "", EMail: extractUserEmail(raw), Id: raw.Id || raw.id || "" }] };
                    }
                    return { results: [] };
                };

                const qaNormalized = normalizeUsers(assignedQAField ? item[assignedQAField.InternalName] : null);
                const userNormalized = normalizeUsers(assignedUserField ? item[assignedUserField.InternalName] : null);

                // If AssignedQA was not present on this row but AssignedUser was, map it
                if (qaNormalized.results.length === 0 && userNormalized.results.length > 0) {
                    if (item.Title === "QA User" || item.Title === "QA HOD" || configTypeVal === "QA User" || configTypeVal === "QA HOD") {
                        qaNormalized.results = [...userNormalized.results];
                    }
                }

                const managerNormalized = normalizeUsers(escalationManagerField ? item[escalationManagerField.InternalName] : null);
                const inchargeNormalized = normalizeUsers(productionInchargeField ? item[productionInchargeField.InternalName] : null);

                return {
                    Id: item.Id,
                    Title: item.Title,
                    ConfigType: configTypeVal,
                    Plant: plantVal,
                    LineName: lineNameVal,
                    ProductCode: productCodeVal,
                    ProductCategory: productCategoryVal,
                    IsActive: isActiveVal,
                    AssignedQA: qaNormalized,
                    AssignedUser: userNormalized,
                    EscalationManager: managerNormalized,
                    ProductionIncharge: inchargeNormalized
                };
            });

            this.configCache = mappedConfigs;
            console.log("Successfully fetched and normalized config results:", mappedConfigs);
            return mappedConfigs;

        } catch (e) {
            console.error("Dynamic config loader failed, falling back to mock: ", e);
            const mock = this.getMockConfig();
            this.configCache = mock;
            return mock;
        }
    },

    // Mock configuration fallback for offline/development test
    getMockConfig: function () {
        const seed = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA))
            ? CCP_PRODUCTS_SEED_DATA
            : ((typeof window !== "undefined" && typeof window.CCP_PRODUCTS_SEED_DATA !== "undefined") ? window.CCP_PRODUCTS_SEED_DATA : []);
        
        const seedProducts = seed.map(p => ({
            Id: p.id || 2000,
            Title: p.title,
            ConfigType: "Product Master",
            Plant: p.plant || "Rajpura",
            LineName: p.lineName || "All Lines",
            ProductCode: p.productCode,
            ProductCategory: p.productCategory,
            IsActive: p.isActive !== false,
            AssignedQA: { results: [] },
            AssignedUser: { results: [] },
            EscalationManager: { results: [] },
            ProductionIncharge: { results: [] }
        }));

        return [
            {
                Id: 21,
                Title: "Line-1",
                ConfigType: "CCP_OPRP",
                Plant: "Rajpura",
                LineName: "Line-1",
                IsActive: true,
                AssignedQA: { results: [] },
                AssignedUser: { results: [] },
                ProductionIncharge: { results: [] },
                EscalationManager: { results: [] }
            },
            {
                Id: 22,
                Title: "Sieves & Magnets Line 1",
                ConfigType: "Sieves_Magnets",
                Plant: "Rajpura",
                LineName: "Line-1",
                IsActive: true,
                AssignedQA: { results: [] },
                AssignedUser: { results: [] },
                ProductionIncharge: { results: [] },
                EscalationManager: { results: [] }
            },
            ...seedProducts
        ];
    },

    // Get active products for CCP & OPRP, filtered by selected line with All Lines fallback
    getProducts: function (selectedLine) {
        const configs = this.configCache || [];
        const norm = str => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetLine = norm(selectedLine);

        let products = configs.filter(c => {
            const isProduct = c.ConfigType === "Product Master";
            if (!isProduct) return false;
            if (c.IsActive === false) return false;
            if (!targetLine) return true;

            const pLine = norm(c.LineName);
            return pLine === "alllines" || pLine === "all" || !pLine || pLine === targetLine || pLine.includes(targetLine) || targetLine.includes(pLine);
        });

        // Fallback to seed data if no products in cache yet
        if (products.length === 0) {
            const seed = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA))
                ? CCP_PRODUCTS_SEED_DATA
                : ((typeof window !== "undefined" && typeof window.CCP_PRODUCTS_SEED_DATA !== "undefined") ? window.CCP_PRODUCTS_SEED_DATA : []);
            
            products = seed.map(p => ({
                Id: p.id,
                Title: p.title,
                ConfigType: "Product Master",
                LineName: p.lineName || "All Lines",
                ProductCode: p.productCode,
                ProductCategory: p.productCategory,
                IsActive: p.isActive !== false
            }));
        }

        return products.sort((a, b) => (a.Title || "").localeCompare(b.Title || ""));
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
            let data = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.warn("No JSON body in Dataverse POST response, extracting ID from headers:", jsonErr);
            }

            let resolvedId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                ? QualityRajpura_Config.getTourId(data)
                : (data.cr3ea_prod_rajpura_quality_tourid || data.cr3ea_rajpura_quality_tourid);

            if (!resolvedId) {
                const entityIdHeader = response.headers.get("OData-EntityId") || response.headers.get("Location") || "";
                const match = entityIdHeader.match(/\(([0-9a-fA-F-]{36})\)/);
                if (match && match[1]) {
                    resolvedId = match[1];
                    data.cr3ea_prod_rajpura_quality_tourid = resolvedId;
                    data.cr3ea_rajpura_quality_tourid = resolvedId;
                }
            }

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
        const rawItems = data.value || [];
        return rawItems.map(item => {
            const ccpId = item.cr3ea_prod_rajpura_ccpoprpid || item.cr3ea_rajpura_ccpoprpid || item.cr3ea_ccpoprpid || item.cr3ea_qualitychecklistid;
            if (ccpId) {
                item.cr3ea_prod_rajpura_ccpoprpid = ccpId;
                item.cr3ea_rajpura_ccpoprpid = ccpId;
            }
            const sievesId = item.cr3ea_prod_rajpura_sievesmagnetsid || item.cr3ea_rajpura_sievesmagnetsid || item.cr3ea_sievesmagnetsid || item.cr3ea_qualitychecklistid;
            if (sievesId) {
                item.cr3ea_prod_rajpura_sievesmagnetsid = sievesId;
                item.cr3ea_rajpura_sievesmagnetsid = sievesId;
            }

            if (type !== "CCP") {
                // Parse Sieves & Magnets action history and deviation status from defectremarks / criteria
                const remarks = item.cr3ea_defectremarks || "";
                const isNotOkay = item.cr3ea_criteria === "Not Okay";
                if (remarks.includes(" | Action: ")) {
                    const parts = remarks.split(" | Action: ");
                    const actionAndRev = parts[1] || "";
                    item.cr3ea_actiontaken = actionAndRev.split(" | Re-verified: ")[0] || "";
                    item.cr3ea_deviationstatus = isNotOkay ? "Action Taken" : "Closed";
                } else if (isNotOkay) {
                    item.cr3ea_deviationstatus = "New";
                    item.cr3ea_actiontaken = "";
                } else {
                    item.cr3ea_deviationstatus = "Closed";
                }
            }

            return item;
        });
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

        const rawExistingId = payload[idField] || 
            (type === "CCP" 
                ? (payload.cr3ea_prod_rajpura_ccpoprpid || payload.cr3ea_rajpura_ccpoprpid)
                : (payload.cr3ea_prod_rajpura_sievesmagnetsid || payload.cr3ea_rajpura_sievesmagnetsid));

        const cleanExistingId = (rawExistingId && rawExistingId !== "undefined" && rawExistingId !== "null" && String(rawExistingId).trim() !== "")
            ? String(rawExistingId).trim()
            : null;

        // Clone payload for network transmission to avoid mutating original
        const requestPayload = Object.assign({}, payload);

        if (cleanExistingId) {
            url += `(${cleanExistingId})`;
            method = "PATCH";
            // Strip primary key fields from PATCH request body to prevent Dataverse schema errors
            delete requestPayload.cr3ea_prod_rajpura_ccpoprpid;
            delete requestPayload.cr3ea_rajpura_ccpoprpid;
            delete requestPayload.cr3ea_prod_rajpura_sievesmagnetsid;
            delete requestPayload.cr3ea_rajpura_sievesmagnetsid;
        }

        if (type !== "CCP") {
            // Incorporate actiontaken into defectremarks for Sieves if present and not already merged
            if (payload.cr3ea_actiontaken && !String(requestPayload.cr3ea_defectremarks || "").includes(" | Action: ")) {
                const base = requestPayload.cr3ea_defectremarks || "";
                requestPayload.cr3ea_defectremarks = base ? `${base} | Action: ${payload.cr3ea_actiontaken}` : `Action: ${payload.cr3ea_actiontaken}`;
            }
            // Strip fields that do not exist on the Sieves & Magnets entity
            delete requestPayload.cr3ea_actiontaken;
            delete requestPayload.cr3ea_notifieddepartment;
            delete requestPayload.cr3ea_deviationstatus;
            delete requestPayload.cr3ea_checkpointname;
            delete requestPayload.cr3ea_acceptanceresponse;
            delete requestPayload.cr3ea_shift;
            delete requestPayload.cr3ea_tourstartdate;
            delete requestPayload.cr3ea_observedby;
            delete requestPayload.cr3ea_location;
            delete requestPayload.cr3ea_productname;
            delete requestPayload.cr3ea_category;
            delete requestPayload.cr3ea_prod_rajpura_sievesmagnetsid;
            delete requestPayload.cr3ea_rajpura_sievesmagnetsid;
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            throw new Error(`Dataverse save checklist item failed: ${await response.text()}`);
        }

        if (method === "PATCH") {
            return payload;
        } else {
            const resData = await response.json();
            const childId = resData[idField] || cleanExistingId;
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
                const cycleKey = cycleNum ? `Cycle-${cycleNum}` : null;
                const toDelete = existing.filter(item => {
                    const id = type === "CCP" 
                        ? (item.cr3ea_prod_rajpura_ccpoprpid || item.cr3ea_rajpura_ccpoprpid)
                        : (item.cr3ea_prod_rajpura_sievesmagnetsid || item.cr3ea_rajpura_sievesmagnetsid);
                    return id && (!cycleKey || item.cr3ea_cycle === cycleKey);
                });
                const CHUNK_SIZE = 8;
                for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
                    const chunk = toDelete.slice(i, i + CHUNK_SIZE);
                    await Promise.all(chunk.map(item => {
                        const id = type === "CCP" 
                            ? (item.cr3ea_prod_rajpura_ccpoprpid || item.cr3ea_rajpura_ccpoprpid)
                            : (item.cr3ea_prod_rajpura_sievesmagnetsid || item.cr3ea_rajpura_sievesmagnetsid);
                        return this.deleteChecklistItem(id, type);
                    }));
                }
            }
        } catch (e) {
            console.warn("Checklist cleanup failed, proceeding anyway: ", e);
        }
    },

    // --- Mock Storage Helpers for Local Development ---
    getMockConfig: function () {
        const seed = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA))
            ? CCP_PRODUCTS_SEED_DATA
            : ((typeof window !== "undefined" && typeof window.CCP_PRODUCTS_SEED_DATA !== "undefined") ? window.CCP_PRODUCTS_SEED_DATA : []);

        const seedProducts = seed.map(p => ({
            Id: p.id,
            Title: p.title,
            ConfigType: "Product Master",
            Plant: p.plant || "Rajpura",
            LineName: p.lineName || "All Lines",
            ProductCode: p.productCode || "",
            ProductCategory: p.productCategory || "General",
            IsActive: p.isActive !== false,
            AssignedQA: { results: [] },
            AssignedUser: { results: [] },
            EscalationManager: { results: [] },
            ProductionIncharge: { results: [] }
        }));

        return [
            { Id: 1, Title: "Line-1", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [] }, EscalationManager: { results: [] }, ProductionIncharge: { results: [] } },
            { Id: 2, Title: "Line-2", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [] }, EscalationManager: { results: [] }, ProductionIncharge: { results: [] } },
            { Id: 5, Title: "Line-5", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [] }, EscalationManager: { results: [] }, ProductionIncharge: { results: [] } },
            { Id: 6, Title: "Line-6", ConfigType: "CCP_OPRP", Plant: "Rajpura", AssignedQA: { results: [] }, EscalationManager: { results: [] }, ProductionIncharge: { results: [] } },
            ...seedProducts
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
                cr3ea_assigned_qa: "",
                cr3ea_shiftexecutiveproduction: "",
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
        const cleanTourId = String(tourId || "").replace(/[{}]/g, "").trim().toLowerCase();
        return items.filter(i => {
            const itemTourId = String(i.cr3ea_qualitytourid || "").replace(/[{}]/g, "").trim().toLowerCase();
            return itemTourId === cleanTourId;
        });
    },

    saveMockChecklistItem: function (payload, type) {
        const storeName = type === "CCP" ? "mock_ccpoprp_items" : "mock_sievesmagnets_items";
        const idField = type === "CCP" ? "cr3ea_prod_rajpura_ccpoprpid" : "cr3ea_prod_rajpura_sievesmagnetsid";
        let items = JSON.parse(localStorage.getItem(storeName) || "[]");
 
        if (!payload.cr3ea_qualitytourid && payload["cr3ea_qualitytourid@odata.bind"]) {
            const match = payload["cr3ea_qualitytourid@odata.bind"].match(/\(([0-9a-fA-F-]+)\)/);
            if (match && match[1]) {
                payload.cr3ea_qualitytourid = match[1];
            }
        }

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
