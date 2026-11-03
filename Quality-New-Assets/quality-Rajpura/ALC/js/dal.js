// Data Access Layer for Rajpura Quality forms
console.log("ALC DAL loaded");

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

const ALC_DAL = {
    configCache: null,
    _configPromise: null,

    getConfig: async function (forceRefresh) {
        if (this.configCache && !forceRefresh) {
            return this.configCache;
        }

        if (this._configPromise && !forceRefresh) {
            return this._configPromise;
        }

        // Try reading from sessionStorage cache for instant 0ms load
        const CACHE_KEY = "QualityRajpura_ALC_ConfigCache";
        const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
        if (!forceRefresh && typeof sessionStorage !== "undefined") {
            try {
                const cachedStr = sessionStorage.getItem(CACHE_KEY);
                if (cachedStr) {
                    const parsedCache = JSON.parse(cachedStr);
                    if (parsedCache && parsedCache.timestamp && (Date.now() - parsedCache.timestamp < CACHE_TTL) && Array.isArray(parsedCache.data) && parsedCache.data.length > 0) {
                        this.configCache = parsedCache.data;
                        return this.configCache;
                    }
                }
            } catch (e) {
                console.warn("ALC_DAL: Session cache read failed:", e);
            }
        }

        this._configPromise = (async () => {
            const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
                ? QualityRajpura_Config.getSiteBaseUrl()
                : (typeof _spPageContextInfo !== 'undefined' ? (_spPageContextInfo.webAbsoluteUrl || _spPageContextInfo.webServerRelativeUrl) : "");
            const listName = (QualityRajpura_Config && QualityRajpura_Config.SHAREPOINT_LISTS && QualityRajpura_Config.SHAREPOINT_LISTS.ALC) || "Quality-Rajpura-ALC";

            if (!webUrl) {
                console.warn("No SharePoint context detected in ALC_DAL.getConfig. Returning master seed defaults.");
                this.configCache = this.getMasterSeedDefaults();
                return this.configCache;
            }

            try {
                // Primary high-speed direct query (skips separate /Fields roundtrip)
                let allFetchedItems = [];
                const primaryQuery = "?$select=Id,Title,ConfigType,Plant,Area,Region,LineName,ShiftCode,ShiftName,ShiftStart,ShiftEnd,ProductCode,ProductCategory,IsCritical,Remarks,IsActive,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id,QAShiftExecutive/Title,QAShiftExecutive/EMail,QAShiftExecutive/Id&$expand=AssignedUser,EscalationManager,QAShiftExecutive&$top=5000";
                let fetchUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/items${primaryQuery}`;
                
                try {
                    const res = await fetch(fetchUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (res.ok) {
                        const data = await res.json();
                        allFetchedItems = (data && data.d && data.d.results) ? data.d.results : [];
                    } else {
                        throw new Error(`Direct query returned status ${res.status}`);
                    }
                } catch (errDirect) {
                    console.warn("ALC_DAL: Direct fast query failed, falling back to dynamic schema probe:", errDirect);
                    allFetchedItems = [];
                    // Fallback to dynamic schema probing
                    const fieldsUrl = `${webUrl}/_api/web/lists/getByTitle('${listName}')/Fields?$select=InternalName,Title,TypeAsString`;
                    const fieldsResponse = await fetch(fieldsUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (fieldsResponse.ok) {
                        const fieldsData = await fieldsResponse.json();
                        const listFields = fieldsData.d?.results || [];
                        const findField = (possibleNames, displayName) => {
                            let match = listFields.find(f => possibleNames.includes(f.InternalName));
                            if (match) return match;
                            match = listFields.find(f => f.Title === displayName);
                            return match;
                        };

                        const configTypeField = findField(["ConfigType", "Config_x0020_Type"], "Config Type");
                        const plantField = findField(["Plant"], "Plant");
                        const areaField = findField(["Area"], "Area");
                        const regionField = findField(["Region"], "Region");
                        const lineNameField = findField(["LineName", "Line_x0020_Name", "Line"], "Line Name");
                        const shiftCodeField = findField(["ShiftCode", "Shift_x0020_Code", "Shift"], "Shift Code");
                        const shiftNameField = findField(["ShiftName", "Shift_x0020_Name"], "Shift Name");
                        const shiftStartField = findField(["ShiftStart", "Shift_x0020_Start"], "Shift Start");
                        const shiftEndField = findField(["ShiftEnd", "Shift_x0020_End"], "Shift End");
                        const productCodeField = findField(["ProductCode", "Product_x0020_Code", "SKU"], "Product Code");
                        const productCategoryField = findField(["ProductCategory", "Product_x0020_Category"], "Product Category");
                        const isCriticalField = findField(["IsCritical", "Is_x0020_Critical", "Critical"], "Is Critical");
                        const remarksField = findField(["Remarks", "Remarks_x0020_Text"], "Remarks");
                        const isActiveField = findField(["IsActive", "Is_x0020_Active", "Active"], "Is Active");
                        const assignedUserField = findField(["AssignedUser", "Assigned_x0020_User", "AssignedQA", "Assigned_x0020_QA", "QAExecutive", "QA_x0020_Executive"], "Assigned User");
                        const escalationManagerField = findField(["EscalationManager", "Escalation_x0020_Manager", "ProductionIncharge", "Production_x0020_Incharge"], "Escalation Manager");
                        const qaShiftField = findField(["QAShiftExecutive", "QAShift_x0020_Executive", "QAShiftExec", "QAShift_x0020_Exec"], "QA Shift Executive");

                        const selectParts = ["Id", "Title"];
                        const expandParts = [];
                        if (plantField) selectParts.push(plantField.InternalName);
                        if (configTypeField) selectParts.push(configTypeField.InternalName);
                        if (areaField) selectParts.push(areaField.InternalName);
                        if (regionField) selectParts.push(regionField.InternalName);
                        if (lineNameField) selectParts.push(lineNameField.InternalName);
                        if (shiftCodeField) selectParts.push(shiftCodeField.InternalName);
                        if (shiftNameField) selectParts.push(shiftNameField.InternalName);
                        if (shiftStartField) selectParts.push(shiftStartField.InternalName);
                        if (shiftEndField) selectParts.push(shiftEndField.InternalName);
                        if (productCodeField) selectParts.push(productCodeField.InternalName);
                        if (productCategoryField) selectParts.push(productCategoryField.InternalName);
                        if (isCriticalField) selectParts.push(isCriticalField.InternalName);
                        if (remarksField) selectParts.push(remarksField.InternalName);
                        if (isActiveField) selectParts.push(isActiveField.InternalName);

                        if (assignedUserField) {
                            selectParts.push(`${assignedUserField.InternalName}/Title`, `${assignedUserField.InternalName}/EMail`, `${assignedUserField.InternalName}/Id`);
                            expandParts.push(assignedUserField.InternalName);
                        }
                        if (escalationManagerField) {
                            selectParts.push(`${escalationManagerField.InternalName}/Title`, `${escalationManagerField.InternalName}/EMail`, `${escalationManagerField.InternalName}/Id`);
                            expandParts.push(escalationManagerField.InternalName);
                        }
                        if (qaShiftField) {
                            selectParts.push(`${qaShiftField.InternalName}/Title`, `${qaShiftField.InternalName}/EMail`, `${qaShiftField.InternalName}/Id`);
                            expandParts.push(qaShiftField.InternalName);
                        }

                        let q = `?$select=${selectParts.join(",")}&$top=5000`;
                        if (expandParts.length > 0) q += `&$expand=${expandParts.join(",")}`;
                        const fbRes = await fetch(`${webUrl}/_api/web/lists/getByTitle('${listName}')/items${q}`, { headers: { "Accept": "application/json; odata=verbose" } });
                        if (fbRes.ok) {
                            const fbData = await fbRes.json();
                            allFetchedItems = fbData.d?.results || [];
                        }
                    }
                }

                if (allFetchedItems.length === 0) {
                    this.configCache = this.getMasterSeedDefaults();
                    return this.configCache;
                }

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

                const mapped = allFetchedItems.map(item => {
                    const assignedUserNormalized = normalizeUsers(item.AssignedUser || item.Assigned_x0020_User || item.QAExecutive || item.QA_x0020_Executive || item.AssignedQA);
                    const escalationManagerNormalized = normalizeUsers(item.EscalationManager || item.Escalation_x0020_Manager || item.ProductionIncharge || item.Production_x0020_Incharge);
                    const qaShiftNormalized = normalizeUsers(item.QAShiftExecutive || item.QAShift_x0020_Executive || item.QAShiftExec);

                    let finalTitle = (item.Title && item.Title.trim() !== "" && item.Title.trim() !== "N/A") ? item.Title.trim() : "";
                    let extractedSeq = 0;
                    let extractedCrit = false;
                    const seqMatch = finalTitle.match(/^(\d+)[\.\:\-\s]+/);
                    if (seqMatch) {
                        extractedSeq = parseInt(seqMatch[1], 10);
                        finalTitle = finalTitle.substring(seqMatch[0].length).trim();
                    }
                    if (/\[critical(?:\s*gate)?\]/i.test(finalTitle)) {
                        extractedCrit = true;
                        finalTitle = finalTitle.replace(/\[critical(?:\s*gate)?\]\s*/i, "").trim();
                    }

                    const rawIsCritical = item.IsCritical || item.Is_x0020_Critical;
                    const rawCat = item.ProductCategory || item.Product_x0020_Category;
                    const rawRemarks = item.Remarks || item.Remarks_x0020_Text;
                    const rawSeq = item.ShiftCode || item.Shift_x0020_Code || item.ProductCode || item.Product_x0020_Code || item.Sequence || extractedSeq || 0;

                    const isCriticalBool = extractedCrit || (rawIsCritical === true || rawIsCritical === "Yes" || rawIsCritical === 1 ||
                        String(rawCat).toLowerCase() === "critical" || String(rawCat).toLowerCase() === "yes" ||
                        String(rawRemarks).toLowerCase() === "critical");

                    return {
                        Id: item.Id,
                        Title: finalTitle,
                        ConfigType: item.ConfigType || item.Config_x0020_Type || "",
                        Region: item.Region || "",
                        Plant: item.Plant || "Rajpura",
                        Area: item.Area || "",
                        LineName: item.LineName || item.Line_x0020_Name || item.Line || "",
                        ShiftCode: item.ShiftCode || item.Shift_x0020_Code || (extractedSeq ? String(extractedSeq) : ""),
                        ShiftName: item.ShiftName || item.Shift_x0020_Name || "",
                        ShiftStart: item.ShiftStart || item.Shift_x0020_Start || "",
                        ShiftEnd: item.ShiftEnd || item.Shift_x0020_End || "",
                        ProductCode: item.ProductCode || item.Product_x0020_Code || item.SKU || (extractedSeq ? String(extractedSeq) : ""),
                        ProductCategory: rawCat || (isCriticalBool ? "Critical" : "Standard"),
                        IsCritical: isCriticalBool,
                        Sequence: parseInt(rawSeq, 10) || extractedSeq || 0,
                        IsActive: item.IsActive !== false,
                        AssignedUser: assignedUserNormalized,
                        EscalationManager: escalationManagerNormalized,
                        QAShiftExecutive: qaShiftNormalized
                    };
                });

                const finalData = mapped.length > 0 ? mapped : this.getMasterSeedDefaults();
                this.configCache = finalData;

                if (typeof sessionStorage !== "undefined") {
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: finalData }));
                    } catch (e) {
                        console.warn("ALC_DAL: Session cache write failed:", e);
                    }
                }

                console.log(`ALC_DAL: Successfully loaded & cached ${finalData.length} config items.`);
                return finalData;
            } catch (e) {
                console.warn(`ALC_DAL: Error querying list (${listName}). Using master seed defaults:`, e);
                this.configCache = this.getMasterSeedDefaults();
                return this.configCache;
            } finally {
                this._configPromise = null;
            }
        })();

        return this._configPromise;
    },

    /**
     * Master seed fallback dataset for ALC when running locally or during initial onboarding
     */
    getMasterSeedDefaults: function () {
        const seedQuestions = (typeof ALC_CHECKLIST_SEED_DATA !== "undefined" && Array.isArray(ALC_CHECKLIST_SEED_DATA))
            ? ALC_CHECKLIST_SEED_DATA.map(q => ({
                Id: 1000 + q.sequence,
                Title: q.title,
                ConfigType: "Checklist Question",
                Area: q.area,
                ShiftCode: String(q.sequence),
                ProductCode: String(q.sequence),
                Sequence: q.sequence,
                ProductCategory: q.isCritical ? "Critical" : "Standard",
                IsCritical: !!q.isCritical,
                Plant: "Rajpura",
                IsActive: q.isActive !== false
            }))
            : [];

        return [
            // 1. Line Master (8 Lines)
            { Id: 101, Title: "Line No. 1", ConfigType: "Line Master", LineName: "HAAS", Plant: "Rajpura", IsActive: true },
            { Id: 102, Title: "Line No. 2", ConfigType: "Line Master", LineName: "IMAFORNI", Plant: "Rajpura", IsActive: true },
            { Id: 103, Title: "Line No. 3", ConfigType: "Line Master", LineName: "HAAS", Plant: "Rajpura", IsActive: true },
            { Id: 104, Title: "Line No. 4", ConfigType: "Line Master", LineName: "AZAAN", Plant: "Rajpura", IsActive: true },
            { Id: 105, Title: "Line No. 5", ConfigType: "Line Master", LineName: "AZAAN", Plant: "Rajpura", IsActive: true },
            { Id: 106, Title: "Line No. 6", ConfigType: "Line Master", LineName: "AZAAN", Plant: "Rajpura", IsActive: true },
            { Id: 107, Title: "Line No. 7", ConfigType: "Line Master", LineName: "AZAAN", Plant: "Rajpura", IsActive: true },
            { Id: 108, Title: "Line No. 8", ConfigType: "Line Master", LineName: "HAAS", Plant: "Rajpura", IsActive: true },

            // 2. Shift Master (4 Shifts)
            { Id: 201, Title: "Shift A", ConfigType: "Shift Master", ShiftCode: "A", ShiftName: "Morning", ShiftStart: "6:00 A.M.", ShiftEnd: "2:00 P.M.", Plant: "Rajpura", IsActive: true },
            { Id: 202, Title: "Shift B", ConfigType: "Shift Master", ShiftCode: "B", ShiftName: "Evening", ShiftStart: "2:00 P.M.", ShiftEnd: "10:00 P.M.", Plant: "Rajpura", IsActive: true },
            { Id: 203, Title: "Shift C", ConfigType: "Shift Master", ShiftCode: "C", ShiftName: "Night", ShiftStart: "10:00 P.M.", ShiftEnd: "6:00 A.M.", Plant: "Rajpura", IsActive: true },
            { Id: 204, Title: "Shift G", ConfigType: "Shift Master", ShiftCode: "G", ShiftName: "General", ShiftStart: "9:30 A.M.", ShiftEnd: "6:00 P.M.", Plant: "Rajpura", IsActive: true },

            // 3. Area Inspector Assignment (7 Areas)
            { Id: 301, Title: "AREA-01", ConfigType: "Area Inspector", Area: "RM Store", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 302, Title: "AREA-02", ConfigType: "Area Inspector", Area: "Flour & Sugar Handling", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 303, Title: "AREA-03", ConfigType: "Area Inspector", Area: "Chemical Handling Area", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 304, Title: "AREA-04", ConfigType: "Area Inspector", Area: "Mixing", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 305, Title: "AREA-05", ConfigType: "Area Inspector", Area: "Oven", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 306, Title: "AREA-06", ConfigType: "Area Inspector", Area: "Post Bake & Packing Section", Plant: "Rajpura", AssignedUser: { results: [] } },
            { Id: 307, Title: "AREA-07", ConfigType: "Area Inspector", Area: "Biscuit Grinding", Plant: "Rajpura", AssignedUser: { results: [] } },

            // 4. QA Shift Assignment Matrix
            {
                Id: 401,
                Title: "Default",
                ConfigType: "QA Assignment",
                ShiftCode: "Default",
                Plant: "Rajpura",
                AssignedUser: {
                    results: []
                },
                EscalationManager: {
                    results: []
                }
            },
            // Legacy QA User fallback row
            {
                Id: 1,
                Title: "QA User - Rajpura",
                ConfigType: "QA User",
                Area: "General",
                Plant: "Rajpura",
                AssignedUser: {
                    results: []
                },
                EscalationManager: {
                    results: []
                }
            },

            // 5. Product Master (Synchronized with Packaging Operations Master)
            ...((typeof PKG_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(PKG_PRODUCTS_SEED_DATA) && PKG_PRODUCTS_SEED_DATA.length > 0)
                ? PKG_PRODUCTS_SEED_DATA.map((p, idx) => ({
                    Id: 5000 + idx + 1,
                    Title: p.title,
                    ConfigType: "Product Master",
                    ProductCode: p.productCode || "",
                    LineName: p.lineName || "Line 1",
                    ProductCategory: p.productCategory || "General",
                    Plant: "Rajpura",
                    IsActive: true
                }))
                : [
                    { Id: 501, Title: "Cremica Bourbon", ConfigType: "Product Master", ProductCode: "PRD-001", Plant: "Rajpura", IsActive: true },
                    { Id: 502, Title: "Marie Delight", ConfigType: "Product Master", ProductCode: "PRD-002", Plant: "Rajpura", IsActive: true },
                    { Id: 503, Title: "Digestive Crackers", ConfigType: "Product Master", ProductCode: "PRD-003", Plant: "Rajpura", IsActive: true }
                ]),

            // 6. Checklist Questions (46 Questions)
            ...seedQuestions
        ];
    },

    /**
     * Helpers to extract specific master datasets from cached/fetched configs
     */
    getLines: async function () {
        const configs = await this.getConfig();
        const lines = configs.filter(c => c.ConfigType === "Line Master" && c.IsActive !== false);
        return lines.length > 0 ? lines : this.getMasterSeedDefaults().filter(c => c.ConfigType === "Line Master");
    },

    getShifts: async function () {
        const configs = await this.getConfig();
        const shifts = configs.filter(c => c.ConfigType === "Shift Master" && c.IsActive !== false);
        return shifts.length > 0 ? shifts : this.getMasterSeedDefaults().filter(c => c.ConfigType === "Shift Master");
    },

    getAreaInspectors: async function () {
        const configs = await this.getConfig();
        const areas = configs.filter(c => c.ConfigType === "Area Inspector" || c.ConfigType === "Product User" || c.ConfigType === "Product Incharge");
        return areas.length > 0 ? areas : this.getMasterSeedDefaults().filter(c => c.ConfigType === "Area Inspector");
    },

    getQaShiftMatrix: async function () {
        const configs = await this.getConfig();
        const matrix = configs.filter(c => c.ConfigType === "QA Assignment");
        if (matrix.length > 0) return matrix;
        // Fallback to QA User row if matrix rows not yet populated
        const qaUser = configs.filter(c => c.ConfigType === "QA User");
        return qaUser.length > 0 ? qaUser : this.getMasterSeedDefaults().filter(c => c.ConfigType === "QA Assignment");
    },

    getProducts: async function () {
        const configs = await this.getConfig();
        const prods = configs.filter(c => c.ConfigType === "Product Master" && c.IsActive !== false);
        return prods.length > 0 ? prods : this.getMasterSeedDefaults().filter(c => c.ConfigType === "Product Master");
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
            throw new Error("Dataverse Access Token is missing or unauthorized. Cannot save ALC session.");
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.PARENT;
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation"
        };

        const tourId = QualityRajpura_Config.getTourId(sessionData);
        let payload = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.sanitizeParentTourPayload)
            ? QualityRajpura_Config.sanitizeParentTourPayload(sessionData)
            : { ...sessionData };
        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        // Ensure non-existent schema properties are stripped before sending to Dataverse
        delete payload.cr3ea_request_time;
        delete payload.cr3ea_checklist_result;
        delete payload.cr3ea_prod_rajpura_quality_tourid;
        delete payload.cr3ea_rajpura_quality_tourid;
        delete payload.cr3ea_prod_rajpura_quality_toursid;
        delete payload.cr3ea_rajpura_quality_toursid;

        if (tourId) {
            const cleanId = String(tourId).replace(/[{}]/g, "").trim().toLowerCase();
            url += `(${cleanId})`;
            method = "PATCH";
        }

        // Ensure overall score is sent as a string (Dataverse schema defines it as Edm.String)
        if (payload.cr3ea_overall_score !== undefined && payload.cr3ea_overall_score !== null) {
            payload.cr3ea_overall_score = String(payload.cr3ea_overall_score);
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse session save failed: ${response.status} - ${errorText}`);
        }

        if (method === "PATCH") {
            return normalizeTourRecord(sessionData);
        } else {
            let data = {};
            try {
                const text = await response.text();
                if (text && text.trim().length > 0) {
                    data = JSON.parse(text);
                }
            } catch (e) {
                console.warn("Could not parse JSON response from Dataverse saveSession:", e);
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

    // 3. Save Checklist Checkpoints to Dataverse
    saveChecklistRow: async function (rowRecord) {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            throw new Error("Dataverse Access Token is missing or unauthorized. Cannot save checklist row.");
        }

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.CHILD;
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=minimal"
        };

        let url = `${baseApiUrl}/api/data/v${apiVersion}/${tableName}`;
        let method = "POST";

        const rowId = rowRecord.cr3ea_rajpura_alcsid || rowRecord.cr3ea_prod_rajpura_alcsid;
        const payload = { ...rowRecord };

        if (rowId) {
            url += `(${rowId})`;
            method = "PATCH";
            delete payload.cr3ea_rajpura_alcsid;
            delete payload.cr3ea_prod_rajpura_alcsid;
            delete payload["cr3ea_qualitytourid@odata.bind"];
        }

        // Auto-normalize @odata.bind to match child table entity relationship schema
        if (payload["cr3ea_qualitytourid@odata.bind"]) {
            const expectedParent = tableName.includes("_prod_") ? "cr3ea_prod_rajpura_quality_tours" : "cr3ea_rajpura_quality_tours";
            payload["cr3ea_qualitytourid@odata.bind"] = payload["cr3ea_qualitytourid@odata.bind"].replace(
                /\/(cr3ea_prod_rajpura_quality_tours|cr3ea_rajpura_quality_tours)\(/,
                `/${expectedParent}(`
            );
        }

        const response = await this.fetchWithToken(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dataverse checklist row save failed: ${response.status} - ${errorText}`);
        }

        if (response.status === 204 || method === "PATCH") {
            const entityIdHeader = response.headers ? response.headers.get("OData-EntityId") : null;
            if (entityIdHeader) {
                const match = entityIdHeader.match(/\(([0-9a-fA-F-]{36})\)/);
                if (match && match[1]) {
                    rowRecord.cr3ea_rajpura_alcsid = match[1];
                    rowRecord.cr3ea_prod_rajpura_alcsid = match[1];
                }
            }
            return rowRecord;
        } else {
            const data = await response.json();
            const childId = data.cr3ea_rajpura_alcsid || data.cr3ea_prod_rajpura_alcsid;
            if (childId) {
                data.cr3ea_rajpura_alcsid = childId;
                data.cr3ea_prod_rajpura_alcsid = childId;
            }
            return data;
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
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.CHILD;
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');

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
        const rows = data.value || [];
        rows.forEach(r => {
            const childId = r.cr3ea_rajpura_alcsid || r.cr3ea_prod_rajpura_alcsid;
            if (childId) {
                r.cr3ea_rajpura_alcsid = childId;
                r.cr3ea_prod_rajpura_alcsid = childId;
            }
        });
        return rows;
    },

    // Fetch all active tour sessions for Rajpura plant (Plant ID 14)
    getActiveSessions: async function () {
        const AccessToken = await this.getAccessToken();
        if (!AccessToken) {
            console.warn("No token available. Cannot fetch active sessions.");
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

        const filter = `?$filter=(cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}' or cr3ea_plantid eq 'Rajpura')&$orderby=cr3ea_tourstartdate desc&$top=50`;
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
        const results = (data.value || []).map(t => normalizeTourRecord(t));

        // Filter: Keep all active tours + today's completed/closed tours
        const todayStr = moment().format("YYYY-MM-DD");
        return results.filter(session => {
            const statusVal1 = (session.cr3ea_status || "").trim().toLowerCase();
            const statusVal2 = (session.cr3ea_processstatus || "").trim().toLowerCase();

            const isTerminalVal1 = statusVal1 === "completed" ||
                statusVal1 === "closed" ||
                statusVal1 === "closed - expired" ||
                statusVal1 === "failed - expired" ||
                statusVal1 === "success" ||
                statusVal1 === "success - expired" ||
                statusVal1 === "submitted" ||
                statusVal1 === "cancelled" ||
                statusVal1.includes("expired");

            const isTerminalVal2 = statusVal2 === "completed" ||
                statusVal2 === "closed" ||
                statusVal2 === "closed - expired" ||
                statusVal2 === "failed - expired" ||
                statusVal2 === "success" ||
                statusVal2 === "success - expired" ||
                statusVal2 === "submitted" ||
                statusVal2 === "cancelled" ||
                statusVal2.includes("expired");

            const isTerminal = isTerminalVal1 || isTerminalVal2;
            const isActive = !isTerminal;

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
        if (typeof window.compressImageFile === "function" && fileObject && fileObject.type.startsWith("image/")) {
            try {
                fileObject = await window.compressImageFile(fileObject);
            } catch (e) {
                console.warn("Image compression failed, using original: ", e);
            }
        }
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
