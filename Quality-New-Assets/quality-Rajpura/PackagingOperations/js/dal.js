// Data Access Layer for Rajpura Packaging Operations forms
console.log("Packaging Operations DAL loaded");

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

const PKGOPS_DAL = {
    configCache: null,

    // 1. Fetch SharePoint configuration mappings
    getConfig: async function (forceRefresh) {
        if (this.configCache && !forceRefresh) {
            return this.configCache;
        }

        const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
            ? QualityRajpura_Config.getSiteBaseUrl()
            : ((typeof _spPageContextInfo !== 'undefined' && (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl))
                ? (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl)
                : "");
        const listName = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.SHAREPOINT_LISTS && QualityRajpura_Config.SHAREPOINT_LISTS.PACKAGING_OPERATIONS)
            ? QualityRajpura_Config.SHAREPOINT_LISTS.PACKAGING_OPERATIONS
            : "Quality-Rajpura-PackagingOperations";

        if (!webUrl) {
            console.log("Local development: returning master seed defaults for Packaging Operations config.");
            this.configCache = this.getMasterSeedDefaults();
            return this.configCache;
        }

        let allFetchedItems = [];
        let configTypeField = null;
        let plantField = null;
        let areaField = null;
        let lineNameField = null;
        let productCodeField = null;
        let productCategoryField = null;
        let isActiveField = null;
        let userField = null;
        let prodField = null;
        let managerField = null;

        try {
            // Step 1: Dynamically probe list schema fields to prevent OData 400 Bad Request
            const fieldsUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/Fields?$select=InternalName,Title,TypeAsString,AllowMultipleValues`;
            let listFields = [];
            try {
                const fieldsResponse = await fetch(fieldsUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                if (fieldsResponse.ok) {
                    const fieldsData = await fieldsResponse.json();
                    listFields = (fieldsData && fieldsData.d && fieldsData.d.results) ? fieldsData.d.results : [];
                }
            } catch (errFields) {
                console.warn("PKGOPS_DAL: Schema probing failed, continuing with dynamic field fallback:", errFields);
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

            configTypeField = findField(["ConfigType", "Config_x0020_Type"], ["Config Type", "ConfigType"]);
            plantField = findField(["Plant"], ["Plant"]);
            areaField = findField(["Area"], ["Area"]);
            lineNameField = findField(["LineName", "Line_x0020_Name", "Line"], ["Line Name", "Line"]);
            productCodeField = findField(["ProductCode", "Product_x0020_Code", "SKU"], ["Product Code", "SKU"]);
            productCategoryField = findField(["ProductCategory", "Product_x0020_Category", "Category"], ["Product Category", "Category"]);
            isActiveField = findField(["IsActive", "Is_x0020_Active", "Active"], ["Is Active", "Active"]);

            userField = findField(["AssignedUser", "Assigned_x0020_User", "QAExecutive", "QA_x0020_Executive", "AssignedQA", "Assigned_x0020_QA"], ["Assigned User", "QA Executive", "QAExecutive", "Assigned QA"]);
            prodField = findField(["ProductionIncharge", "Production_x0020_Incharge", "ProductionExecutive", "Production_x0020_Executive"], ["Production Incharge", "Production Executive"]);
            managerField = findField(["EscalationManager", "Escalation_x0020_Manager"], ["Escalation Manager"]);

            const selectParts = ["Id", "Title"];
            const expandParts = [];

            if (configTypeField) selectParts.push(configTypeField.InternalName);
            if (plantField) selectParts.push(plantField.InternalName);
            if (areaField) selectParts.push(areaField.InternalName);
            if (lineNameField) selectParts.push(lineNameField.InternalName);
            if (productCodeField) selectParts.push(productCodeField.InternalName);
            if (productCategoryField) selectParts.push(productCategoryField.InternalName);
            if (isActiveField) selectParts.push(isActiveField.InternalName);

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
            if (managerField) {
                const mName = managerField.InternalName;
                selectParts.push(`${mName}/Title`, `${mName}/EMail`, `${mName}/Id`);
                expandParts.push(mName);
            }

            // Step 2: Query items with dynamic select and expand
            let query = `?$select=${selectParts.join(",")}&$top=5000`;
            if (expandParts.length > 0) query += `&$expand=${expandParts.join(",")}`;

            let nextUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;

            while (nextUrl) {
                const response = await fetch(nextUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                if (!response.ok) throw new Error(`Fetch failed with status ${response.status} (${response.statusText})`);
                const data = await response.json();
                const pageResults = (data && data.d && data.d.results) ? data.d.results : [];
                allFetchedItems = allFetchedItems.concat(pageResults);
                nextUrl = (data && data.d && data.d.__next) ? data.d.__next : null;
            }

            console.log(`PKGOPS_DAL: Fetched ${allFetchedItems.length} raw items from list '${listName}'`);
        } catch (e) {
            console.warn("Primary dynamic SharePoint config fetch failed, attempting fallback query:", e);
            allFetchedItems = [];
            try {
                // Fallback attempt with commonly used fields
                const fbQuery = "?$select=Id,Title,ConfigType,Config_x0020_Type,Plant,Area,ProductCode,LineName,ProductCategory,IsActive,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id&$expand=AssignedUser&$top=5000";
                let fbUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${fbQuery}`;
                while (fbUrl) {
                    const fbRes = await fetch(fbUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (!fbRes.ok) throw new Error(`Fallback query failed with status ${fbRes.status}`);
                    const fbData = await fbRes.json();
                    const pageResults = (fbData && fbData.d && fbData.d.results) ? fbData.d.results : [];
                    allFetchedItems = allFetchedItems.concat(pageResults);
                    fbUrl = (fbData && fbData.d && fbData.d.__next) ? fbData.d.__next : null;
                }
            } catch (errFb1) {
                console.warn("Fallback query with AssignedUser failed, attempting Assigned_x0020_User query:", errFb1);
                try {
                    const fbQuery2 = "?$select=Id,Title,ConfigType,Config_x0020_Type,Plant,Area,ProductCode,LineName,ProductCategory,IsActive,Assigned_x0020_User/Title,Assigned_x0020_User/EMail,Assigned_x0020_User/Id&$expand=Assigned_x0020_User&$top=5000";
                    let fbUrl2 = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${fbQuery2}`;
                    while (fbUrl2) {
                        const fbRes2 = await fetch(fbUrl2, { headers: { "Accept": "application/json; odata=verbose" } });
                        if (!fbRes2.ok) throw new Error(`Fallback query 2 failed with status ${fbRes2.status}`);
                        const fbData2 = await fbRes2.json();
                        const pageResults2 = (fbData2 && fbData2.d && fbData2.d.results) ? fbData2.d.results : [];
                        allFetchedItems = allFetchedItems.concat(pageResults2);
                        fbUrl2 = (fbData2 && fbData2.d && fbData2.d.__next) ? fbData2.d.__next : null;
                    }
                } catch (errFb2) {
                    console.warn("All SharePoint config queries failed, using master seed defaults:", errFb2);
                    this.configCache = this.getMasterSeedDefaults();
                    return this.configCache;
                }
            }
        }

        if (allFetchedItems.length === 0) {
            console.warn("SharePoint config returned 0 items, using master seed defaults.");
            this.configCache = this.getMasterSeedDefaults();
            return this.configCache;
        }

        const normalizeUsersArray = (raw) => {
            if (!raw) return { results: [] };
            if (raw.results && Array.isArray(raw.results)) return raw;
            if (Array.isArray(raw)) return { results: raw };
            if (raw.Title || raw.EMail || raw.Id || raw.title || raw.email) return { results: [raw] };
            return { results: [] };
        };

        const toCleanUserList = (rawNormalized) => {
            if (!rawNormalized || !rawNormalized.results) return [];
            return rawNormalized.results.map(u => ({
                id: u.Id || u.id || 0,
                title: u.Title || u.title || "Unknown",
                email: u.EMail || u.email || u.Email || ""
            }));
        };

        const safeStr = (val) => (val === null || val === undefined) ? "" : String(val).trim();

        this.configCache = allFetchedItems.map(item => {
            const rawUser = item.AssignedUser || item.Assigned_x0020_User || item.QAExecutive || item.QA_x0020_Executive || item.AssignedQA || item.Assigned_x0020_QA;
            const rawProd = item.ProductionIncharge || item.Production_x0020_Incharge || item.ProductionExecutive || item.Production_x0020_Executive;
            const rawManager = item.EscalationManager || item.Escalation_x0020_Manager;

            const assignedUserNormalized = normalizeUsersArray(rawUser);
            const prodInchargeNormalized = normalizeUsersArray(rawProd);
            const escalationManagerNormalized = normalizeUsersArray(rawManager);

            const rawConfigType = safeStr(configTypeField ? item[configTypeField.InternalName] : (item.ConfigType || item.Config_x0020_Type));
            const rawLineName = safeStr(lineNameField ? item[lineNameField.InternalName] : (item.LineName || item.Line_x0020_Name || item.Line));
            const rawProductCode = safeStr(productCodeField ? item[productCodeField.InternalName] : (item.ProductCode || item.Product_x0020_Code || item.SKU));
            const rawProductCategory = safeStr(productCategoryField ? item[productCategoryField.InternalName] : (item.ProductCategory || item.Product_x0020_Category || item.Category));
            const rawPlant = safeStr(plantField ? item[plantField.InternalName] : item.Plant) || "Rajpura";
            const rawArea = safeStr(areaField ? item[areaField.InternalName] : item.Area);
            const rawIsActive = isActiveField ? (item[isActiveField.InternalName] !== false) : (item.IsActive !== false);
            const finalTitle = safeStr(item.Title);

            return {
                Id: item.Id,
                id: item.Id,
                Title: finalTitle,
                title: finalTitle,
                ConfigType: rawConfigType || (finalTitle.toLowerCase().includes("qa") ? "QA User" : (finalTitle.toLowerCase().includes("prod") ? "Production Incharge" : "Product Master")),
                configType: rawConfigType || (finalTitle.toLowerCase().includes("qa") ? "QA User" : (finalTitle.toLowerCase().includes("prod") ? "Production Incharge" : "Product Master")),
                Region: "",
                Plant: rawPlant,
                plant: rawPlant,
                Area: rawArea,
                area: rawArea,
                ProductCode: rawProductCode,
                productCode: rawProductCode,
                LineName: rawLineName,
                lineName: rawLineName,
                ProductCategory: rawProductCategory || "General",
                productCategory: rawProductCategory || "General",
                IsActive: typeof rawIsActive === "boolean" ? rawIsActive : true,
                isActive: typeof rawIsActive === "boolean" ? rawIsActive : true,
                AssignedUser: assignedUserNormalized,
                assignedUsers: toCleanUserList(assignedUserNormalized),
                ProductionIncharge: prodInchargeNormalized,
                productionIncharges: toCleanUserList(prodInchargeNormalized),
                EscalationManager: escalationManagerNormalized,
                escalationManagers: toCleanUserList(escalationManagerNormalized),
                raw: item
            };
        });

        console.log(`PKGOPS_DAL: Successfully loaded ${this.configCache.length} configuration & master records dynamically from SharePoint list "${listName}".`);
        return this.configCache;
    },

    // Built-in seed master defaults for offline/local development
    getMasterSeedDefaults: function () {
        return [
            // 1. Role assignments
            {
                Id: 1,
                id: 1,
                Title: "QA User",
                title: "QA User",
                ConfigType: "QA User",
                configType: "QA User",
                Plant: "Rajpura",
                plant: "Rajpura",
                IsActive: true,
                isActive: true,
                AssignedUser: {
                    results: [
                        { Id: 101, Title: "Mishab Muhammed", EMail: "mishab@bectorfoods.com" },
                        { Id: 108, Title: "Gokul K", EMail: "gokul.k@bectorfoods.com" },
                        { Id: 112, Title: "Babifas P", EMail: "babifas.p@bectorfoods.com" }
                    ]
                },
                assignedUsers: [
                    { id: 101, title: "Mishab Muhammed", email: "mishab@bectorfoods.com" },
                    { id: 108, title: "Gokul K", email: "gokul.k@bectorfoods.com" },
                    { id: 112, title: "Babifas P", email: "babifas.p@bectorfoods.com" }
                ],
                EscalationManager: { results: [] },
                escalationManagers: []
            },
            {
                Id: 2,
                id: 2,
                Title: "Production Incharge",
                title: "Production Incharge",
                ConfigType: "Production Incharge",
                configType: "Production Incharge",
                Plant: "Rajpura",
                plant: "Rajpura",
                IsActive: true,
                isActive: true,
                AssignedUser: {
                    results: [
                        { Id: 101, Title: "Mishab Muhammed", EMail: "mishab@bectorfoods.com" }
                    ]
                },
                assignedUsers: [
                    { id: 101, title: "Mishab Muhammed", email: "mishab@bectorfoods.com" }
                ],
                EscalationManager: { results: [] },
                escalationManagers: []
            },

            // 2. Product Master (1,105 Products across Lines 1 to 8 & Festive Packs)
            ...(typeof PKG_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(PKG_PRODUCTS_SEED_DATA) && PKG_PRODUCTS_SEED_DATA.length > 0
                ? PKG_PRODUCTS_SEED_DATA.map((p, idx) => ({
                    Id: 300 + idx,
                    Title: p.title,
                    ProductCode: p.productCode || "",
                    LineName: p.lineName || "All Lines",
                    ProductCategory: p.productCategory || "General",
                    ConfigType: "Product Master",
                    Plant: "Rajpura",
                    IsActive: true
                }))
                : [
                    { Id: 301, Title: "Cremica Bourbon", ProductCode: "PRD-001", LineName: "Line 1", ProductCategory: "Cream", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 302, Title: "Cremica Butter Cookies", ProductCode: "PRD-002", LineName: "Line 2", ProductCategory: "Cookies", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 303, Title: "Cremica Digestive Crackers", ProductCode: "PRD-003", LineName: "Line 3", ProductCategory: "Crackers", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 304, Title: "Cremica Marie Classic", ProductCode: "PRD-004", LineName: "Line 4", ProductCategory: "Health Biscuits", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 305, Title: "Cremica Magic Cream Chocolate", ProductCode: "PRD-005", LineName: "Line 5", ProductCategory: "Cream", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 306, Title: "Cremica Magic Cream Elaichi", ProductCode: "PRD-006", LineName: "Line 5", ProductCategory: "Cream", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 307, Title: "Cremica Glucose Power", ProductCode: "PRD-007", LineName: "Line 6", ProductCategory: "Glucose", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 308, Title: "Cremica Coconut Crunch", ProductCode: "PRD-008", LineName: "Line 7", ProductCategory: "Cookies", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 309, Title: "Cremica Nice Sugar Sprinkled", ProductCode: "PRD-009", LineName: "Line 8", ProductCategory: "Cookies", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true },
                    { Id: 310, Title: "Bectors Original Crackers", ProductCode: "PRD-010", LineName: "All Lines", ProductCategory: "Crackers", ConfigType: "Product Master", Plant: "Rajpura", IsActive: true }
                ]
            ),

            // 3. SKU Master (Pack Sizes / SKUs)
            { Id: 401, Title: "50g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 402, Title: "75g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 403, Title: "100g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 404, Title: "120g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 405, Title: "150g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 406, Title: "200g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 407, Title: "250g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 408, Title: "300g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 409, Title: "500g", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true },
            { Id: 410, Title: "1kg Family Pack", ProductCode: "", ConfigType: "SKU Master", Plant: "Rajpura", IsActive: true }
        ];
    },

    // Helper: Get all active products from SharePoint list (or fallback seed)
    getAllProducts: async function (forceRefresh) {
        try {
            const configs = await this.getConfig(forceRefresh);
            let products = configs.filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return (cType === "product master" || cType === "product_x0020_master") && c.IsActive !== false;
            });
            products.sort((a, b) => (a.Title || "").localeCompare(b.Title || ""));
            return products;
        } catch (e) {
            console.error("Error fetching all products from DAL:", e);
            return (this.getMasterSeedDefaults ? this.getMasterSeedDefaults() : []).filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return cType === "product master" || cType === "product_x0020_master";
            });
        }
    },

    // Helper: Get active products (filtered dynamically by selected line from SharePoint list)
    getProducts: async function (selectedLine, forceRefresh) {
        try {
            const allProducts = await this.getAllProducts(forceRefresh);
            if (!selectedLine || typeof selectedLine !== "string" || !selectedLine.trim() || selectedLine.trim().toLowerCase() === "all lines") {
                return allProducts;
            }

            // Extract line number if present, e.g. "Line 1", "Line No. 1", "Line 1 - HAAS", "1"
            const lineNumMatch = String(selectedLine).match(/(?:line\s*(?:no\.?)?\s*|^)(\d+)/i);
            const lineNum = lineNumMatch ? lineNumMatch[1] : null;

            const cleanSelectedLine = String(selectedLine).toLowerCase().replace(/[^a-z0-9]/g, "");

            const filtered = allProducts.filter(p => {
                const pLineRaw = (p.LineName || "").trim();
                // Products with empty LineName, "All Lines", or "Default" apply to all lines
                if (!pLineRaw || pLineRaw.toLowerCase().includes("all") || pLineRaw.toLowerCase().includes("default")) return true;
                
                if (lineNum) {
                    const pLineNumMatch = pLineRaw.match(/(?:line\s*(?:no\.?)?\s*|^)(\d+)/i);
                    if (pLineNumMatch && pLineNumMatch[1] === lineNum) return true;
                }

                const pLineClean = pLineRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
                return pLineClean.includes(cleanSelectedLine) || cleanSelectedLine.includes(pLineClean);
            });

            return filtered.length > 0 ? filtered : allProducts;
        } catch (e) {
            console.error("Error fetching products from DAL:", e);
            return (this.getMasterSeedDefaults ? this.getMasterSeedDefaults() : []).filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return cType === "product master" || cType === "product_x0020_master";
            });
        }
    },

    // Helper: Get unique product categories dynamically derived from the SharePoint list / master seed catalogue
    getProductCategories: async function (selectedLine, forceRefresh) {
        const prods = selectedLine ? await this.getProducts(selectedLine, forceRefresh) : await this.getAllProducts(forceRefresh);
        const catSet = new Set();
        prods.forEach(p => {
            if (p.ProductCategory && p.ProductCategory.trim()) {
                catSet.add(p.ProductCategory.trim());
            }
        });

        // If line-filtered categories is empty or very limited, also include all categories from master catalog
        if (selectedLine && catSet.size <= 1) {
            const allProds = await this.getAllProducts(forceRefresh);
            allProds.forEach(p => {
                if (p.ProductCategory && p.ProductCategory.trim()) {
                    catSet.add(p.ProductCategory.trim());
                }
            });
        }

        return Array.from(catSet).sort((a, b) => a.localeCompare(b));
    },

    // Helper: Get active SKUs dynamically
    getSkus: async function (forceRefresh) {
        try {
            const configs = await this.getConfig(forceRefresh);
            return configs.filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return (cType === "sku master" || cType === "sku_x0020_master") && c.IsActive !== false;
            });
        } catch (e) {
            console.error("Error fetching SKUs from DAL:", e);
            return (this.getMasterSeedDefaults ? this.getMasterSeedDefaults() : []).filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return cType === "sku master" || cType === "sku_x0020_master";
            });
        }
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
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        const tourId = QualityRajpura_Config.getTourId(tourData);
        let payload = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.sanitizeParentTourPayload)
            ? QualityRajpura_Config.sanitizeParentTourPayload(tourData)
            : { ...tourData };
        delete payload.cr3ea_request_time;
        delete payload.cr3ea_checklist_result;
        delete payload.cr3ea_prod_rajpura_quality_tourid;
        delete payload.cr3ea_rajpura_quality_tourid;
        delete payload.cr3ea_prod_rajpura_quality_toursid;
        delete payload.cr3ea_rajpura_quality_toursid;
        delete payload.cr3ea_tourcompletiondate;

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        if (tourId) {
            url += `(${tourId})`;
            method = "PATCH";
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse parent tour save failed: ${response.status} - ${errorText}`);
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
                console.warn("Could not parse JSON response from Dataverse saveTour:", e);
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

    updateTour: async function (tourId, payload) {
        const data = { ...payload };
        if (tourId) {
            data.cr3ea_prod_rajpura_quality_tourid = tourId;
            data.cr3ea_rajpura_quality_tourid = tourId;
        }
        return this.saveTour(data);
    },

    // 5. Retrieve Active/Recent Tours for the Dashboard/State
    getTours: async function (topCount = 50) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating getTours locally.");
            return [];
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

        const headers = {
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        };

        const filter = `?$filter=(cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}' or cr3ea_plantid eq 'Rajpura')&$orderby=cr3ea_tourstartdate desc&$top=${topCount}`;
        const url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`;

        const response = await this.fetchWithToken(url, { method: "GET", headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch Dataverse tours: ${response.statusText}`);
        }

        const data = await response.json();
        const tours = data.value || [];
        return tours.map(t => normalizeTourRecord(t));
    },

    // 6. Retrieve Single Tour by ID
    getTour: async function (tourId) {
        return this.getTourById(tourId);
    },

    getParentTour: async function (tourId) {
        return this.getTourById(tourId);
    },

    getTourById: async function (tourId) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken || !tourId) return null;

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
            throw new Error(`Failed to fetch Tour by ID: ${response.statusText}`);
        }
        const data = await response.json();
        return normalizeTourRecord(data);
    },

    // 7. Generic Child Sub-Checklist CRUD Operations
    // 7.a Save / Update Sub-checklist Row
    saveSubChecklistRow: async function (subChecklistKey, record) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Simulating saveSubChecklistRow locally.");
            return record;
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PACKAGING_OPERATIONS[subChecklistKey];
        if (!tableName) {
            throw new Error(`Invalid subChecklistKey provided: ${subChecklistKey}`);
        }

        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=minimal"
        };

        // Determine ID column name based on entity
        let idColumn = "";
        const isProd = tableName.includes("_prod_");
        const p = isProd ? "cr3ea_prod_rajpura_pkgops_" : "cr3ea_rajpura_pkgops_";
        if (subChecklistKey === "CHILD_TEMP_HUMIDITY") idColumn = p + "temphumidityid";
        else if (subChecklistKey === "CHILD_CODE_VERIFICATION") idColumn = p + "codeverificationid";
        else if (subChecklistKey === "CHILD_PAPA") idColumn = p + "papaid";
        else if (subChecklistKey === "CHILD_PQI_NET_WEIGHT") idColumn = p + "pqi_netweightid";
        else if (subChecklistKey === "CHILD_PQI_EVALUATION") idColumn = p + "pqi_evaluationid";
        else if (subChecklistKey === "CHILD_SEAL_INTEGRITY") idColumn = p + "sealintegrityid";
        else if (subChecklistKey === "CHILD_QUALITY_WALL") idColumn = p + "qualitywallid";

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        const baseSuffix = idColumn.replace(/^cr3ea_(prod_)?rajpura_pkgops_/, "");
        const existingRowId = record[idColumn] || 
                              record["cr3ea_prod_rajpura_pkgops_" + baseSuffix] ||
                              record["cr3ea_rajpura_pkgops_" + baseSuffix] ||
                              record.id;

        const cleanRecord = { ...record };

        if (existingRowId) {
            url += `(${existingRowId})`;
            method = "PATCH";
            delete cleanRecord[idColumn];
            delete cleanRecord["cr3ea_prod_rajpura_pkgops_" + baseSuffix];
            delete cleanRecord["cr3ea_rajpura_pkgops_" + baseSuffix];
            delete cleanRecord.id;

            // Strip any table primary ID property ending with "id" so PATCH never fails on schema mismatch
            Object.keys(cleanRecord).forEach(k => {
                if (k.endsWith("id") && !k.includes("@") && k !== "cr3ea_plantid") {
                    delete cleanRecord[k];
                }
            });
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(cleanRecord)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sub-checklist Dataverse save failed (${subChecklistKey}): ${response.status} - ${errorText}`);
        }

        if (response.status === 204 || method === "PATCH") {
            const entityIdHeader = response.headers ? response.headers.get("OData-EntityId") : null;
            if (entityIdHeader) {
                const match = entityIdHeader.match(/\(([0-9a-fA-F-]{36})\)/);
                if (match && match[1]) {
                    record[idColumn] = match[1];
                    if (baseSuffix) {
                        record["cr3ea_prod_rajpura_pkgops_" + baseSuffix] = match[1];
                        record["cr3ea_rajpura_pkgops_" + baseSuffix] = match[1];
                    }
                }
            }
            return record;
        } else {
            const result = await response.json();
            if (baseSuffix) {
                result["cr3ea_prod_rajpura_pkgops_" + baseSuffix] = result[idColumn] || existingRowId;
                result["cr3ea_rajpura_pkgops_" + baseSuffix] = result[idColumn] || existingRowId;
            }
            return result;
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

        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
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
        const rows = data.value || [];

        // Normalize IDs across environments
        rows.forEach(item => {
            for (let k in item) {
                if (k.startsWith("cr3ea_rajpura_pkgops_") && k.endsWith("id")) {
                    const prodKey = "cr3ea_prod_rajpura_pkgops_" + k.substring("cr3ea_rajpura_pkgops_".length);
                    if (!item[prodKey]) item[prodKey] = item[k];
                } else if (k.startsWith("cr3ea_prod_rajpura_pkgops_") && k.endsWith("id")) {
                    const uatKey = "cr3ea_rajpura_pkgops_" + k.substring("cr3ea_prod_rajpura_pkgops_".length);
                    if (!item[uatKey]) item[uatKey] = item[k];
                }
            }
        });

        return rows;
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

        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
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
                const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PACKAGING_OPERATIONS[subChecklistKey] || "";
                const isProd = tableName.includes("_prod_");
                const p = isProd ? "cr3ea_prod_rajpura_pkgops_" : "cr3ea_rajpura_pkgops_";

                let idColumn = "";
                if (subChecklistKey === "CHILD_TEMP_HUMIDITY") idColumn = p + "temphumidityid";
                else if (subChecklistKey === "CHILD_CODE_VERIFICATION") idColumn = p + "codeverificationid";
                else if (subChecklistKey === "CHILD_PAPA") idColumn = p + "papaid";
                else if (subChecklistKey === "CHILD_PQI_NET_WEIGHT") idColumn = p + "pqi_netweightid";
                else if (subChecklistKey === "CHILD_PQI_EVALUATION") idColumn = p + "pqi_evaluationid";
                else if (subChecklistKey === "CHILD_SEAL_INTEGRITY") idColumn = p + "sealintegrityid";
                else if (subChecklistKey === "CHILD_QUALITY_WALL") idColumn = p + "qualitywallid";

                const baseSuffix = idColumn.replace(/^cr3ea_(prod_)?rajpura_pkgops_/, "");

                for (let item of existing) {
                    if (evaluationType && item.cr3ea_evaluationtype !== evaluationType) {
                        continue;
                    }
                    const guid = item[idColumn] || 
                                 item["cr3ea_prod_rajpura_pkgops_" + baseSuffix] ||
                                 item["cr3ea_rajpura_pkgops_" + baseSuffix];
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
        } else if (this._cachedDigest) {
            requestDigest = this._cachedDigest;
        } else {
            const digestResponse = await $.ajax({
                url: `${webUrl}/_api/contextinfo`,
                method: "POST",
                headers: { "Accept": "application/json; odata=verbose" }
            });
            requestDigest = digestResponse.d.GetContextWebInformation.FormDigestValue;
            this._cachedDigest = requestDigest;
            setTimeout(() => { this._cachedDigest = null; }, 20 * 60 * 1000);
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
    },

    employeesCache: null,

    // 10. Load Employee Directory from SharePoint / siteusers / mock fallback
    getEmployeeList: async function () {
        if (this.employeesCache && this.employeesCache.length > 0) {
            return this.employeesCache;
        }

        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
        try {
            const query = "?$select=Id,Title,EmployeeName/Id,EmployeeName/Title,EmployeeName/EMail,DepartmentId/Id,DepartmentId/Title,PlantId/Id,PlantId/Title&$expand=EmployeeName,DepartmentId,PlantId&$filter=IsActive eq 1&$top=500";
            const url = `${webUrl}/_api/web/lists/getByTitle('EmployeeList')/items${query}`;
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (response.ok) {
                const data = await response.json();
                const results = data.d.results || [];
                const emps = results.map(item => {
                    const emp = item.EmployeeName || {};
                    const dept = item.DepartmentId ? item.DepartmentId.Title : "";
                    const plant = item.PlantId ? item.PlantId.Title : "";
                    return {
                        id: emp.Id || item.Id,
                        spUserId: emp.Id || null,
                        title: emp.Title || item.Title || "Unknown",
                        email: emp.EMail || "",
                        department: dept,
                        plant: plant
                    };
                }).filter(e => e.title && e.title !== "Unknown");
                if (emps.length > 0) {
                    this.employeesCache = emps;
                    return this.employeesCache;
                }
            }
        } catch (e) {
            console.warn("PKGOPS_DAL: Failed to load EmployeeList, attempting fallback to siteusers:", e);
        }

        // Fallback: Query siteusers
        try {
            const url = `${webUrl}/_api/web/siteusers?$filter=PrincipalType eq 1&$top=200`;
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (response.ok) {
                const data = await response.json();
                const results = data.d.results || [];
                const emps = results.map(u => ({
                    id: u.Id,
                    spUserId: u.Id,
                    title: u.Title,
                    email: u.Email || "",
                    department: "Quality / Plant",
                    plant: "Rajpura"
                }));
                if (emps.length > 0) {
                    this.employeesCache = emps;
                    return this.employeesCache;
                }
            }
        } catch (err) {
            console.warn("PKGOPS_DAL: Fallback to mock employees for offline dev:", err);
        }

        // Default mock employees for local test / preview
        this.employeesCache = [
            { id: 101, spUserId: 101, title: "Mishab Muhammed", email: "mishab@bectors.com", department: "Quality Assurance", plant: "Rajpura" },
            { id: 102, spUserId: 102, title: "Ankur Sharma", email: "ankur.sharma@bectors.com", department: "Quality Assurance", plant: "Rajpura" },
            { id: 103, spUserId: 103, title: "Suresh Kumar", email: "suresh.kumar@bectors.com", department: "Quality HOD", plant: "Rajpura" },
            { id: 104, spUserId: 104, title: "Mahesh Singh", email: "mahesh.singh@bectors.com", department: "Production", plant: "Rajpura" },
            { id: 105, spUserId: 105, title: "Rajesh Verma", email: "rajesh.verma@bectors.com", department: "Production Incharge", plant: "Rajpura" },
            { id: 106, spUserId: 106, title: "Vikas Patel", email: "vikas.patel@bectors.com", department: "Quality Executive", plant: "Rajpura" },
            { id: 107, spUserId: 107, title: "Priya Nair", email: "priya.nair@bectors.com", department: "Packaging Quality", plant: "Rajpura" },
            { id: 108, spUserId: 108, title: "Gokul K", email: "gokul.k@bectors.com", department: "Quality Assurance", plant: "Rajpura" },
            { id: 109, spUserId: 109, title: "Aiswarya N V", email: "aiswarya.nv@bectors.com", department: "Quality Assurance", plant: "Rajpura" },
            { id: 110, spUserId: 110, title: "Ajith K", email: "ajith.k@bectors.com", department: "Production", plant: "Rajpura" },
            { id: 111, spUserId: 111, title: "Shaan Arshaqu", email: "shaan.arshaqu@bectors.com", department: "Production", plant: "Rajpura" }
        ];
        return this.employeesCache;
    },

    // 11. Resolve user emails or names to Display Names for UI presentation
    resolveUserDisplayNames: async function (rawEmailsOrNames) {
        if (!rawEmailsOrNames || typeof rawEmailsOrNames !== 'string') return "-";
        const trimmed = rawEmailsOrNames.trim();
        if (!trimmed) return "-";

        const employees = await this.getEmployeeList();
        const parts = trimmed.split(/[,;]+/).map(p => p.trim()).filter(Boolean);

        const resolvedNames = parts.map(part => {
            const lowerPart = part.toLowerCase();
            let match = employees.find(e => e.email && e.email.toLowerCase() === lowerPart);
            if (!match) {
                match = employees.find(e => e.title && e.title.toLowerCase() === lowerPart);
            }
            if (match) return match.title;
            if (part.includes("@")) {
                const namePart = part.split("@")[0].replace(/[._-]/g, " ");
                return namePart.replace(/\b\w/g, l => l.toUpperCase());
            }
            return part;
        });

        return resolvedNames.join(", ");
    }
};
