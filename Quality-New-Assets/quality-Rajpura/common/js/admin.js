/**
 * ==========================================================================
 * Rajpura Quality Forms Admin Panel
 * Form User & Role Assignment Controller for Mrs. Bectors PTMS
 * ==========================================================================
 */

console.log("Rajpura Quality Admin Panel Controller Loaded");

const Rajpura_Admin = {
    activeTab: "ALC",
    activeSubSection: "users", // "users" or "products" for other checklist forms
    alcSubTab: "qa-matrix", // "qa-matrix", "areas", "lines", "shifts", "products", "questions" for ALC
    pkgSubTab: "users", // "users", "products", "skus" for PackagingOperations
    mbSubTab: "users", // "users", "recipes" for MixingAndBaking
    ccpSubTab: "users", // "users", "products" for CCP_OPRP_Sieves
    configs: {},
    employees: [],
    listSchemas: {},
    isLoading: false,
    searchFilter: "",
    alcQuestionState: {
        areaFilter: "ALL",
        criticalFilter: "ALL",
        statusFilter: "ALL",
        searchTerm: ""
    },
    pkgProductState: {
        currentPage: 1,
        pageSize: 25,
        searchTerm: "",
        lineFilter: "ALL",
        categoryFilter: "ALL",
        statusFilter: "ALL",
        sortBy: "title",
        sortAsc: true
    },
    _pkgSearchTimeout: null,
    ccpProductState: {
        currentPage: 1,
        pageSize: 25,
        searchTerm: "",
        lineFilter: "ALL",
        categoryFilter: "ALL",
        statusFilter: "ALL",
        sortBy: "title",
        sortAsc: true
    },
    _ccpSearchTimeout: null,
    mbRecipeState: {
        currentPage: 1,
        pageSize: 25,
        searchTerm: "",
        categoryFilter: "ALL",
        statusFilter: "ALL",
        sortBy: "title",
        sortAsc: true
    },
    _mbSearchTimeout: null,

    // Built-in Catalog of 46 Standard ALC Checklist Questions
    DEFAULT_ALC_QUESTIONS: [
        // 1. RM Store Area (Wheat Flour Handling)
        { sequence: 1, area: "RM Store Area (Wheat Flour Handling)", title: "Floor Condition - To be cleaned", isCritical: false, isActive: true },
        { sequence: 2, area: "RM Store Area (Wheat Flour Handling)", title: "No scrap at RM storage area", isCritical: false, isActive: true },
        { sequence: 3, area: "RM Store Area (Wheat Flour Handling)", title: "Sign of Infestation, Crawling marks", isCritical: true, isActive: true },

        // 2. Flour & Sugar Handling
        { sequence: 4, area: "Flour & Sugar Handling", title: "Maida and Sugar handling area Cleanliness -Floor, wall, ceiling, railing, cuving", isCritical: false, isActive: true },
        { sequence: 5, area: "Flour & Sugar Handling", title: "Sieve Condition- free from damage and Cleanliness", isCritical: true, isActive: true },
        { sequence: 6, area: "Flour & Sugar Handling", title: "Magnet Position and cleanliness", isCritical: true, isActive: true },
        { sequence: 7, area: "Flour & Sugar Handling", title: "Free from pest", isCritical: true, isActive: true },
        { sequence: 8, area: "Flour & Sugar Handling", title: "No damage and loose thread in cotton bellows", isCritical: false, isActive: true },

        // 3. Chemical Handling Area
        { sequence: 9, area: "Chemical Handling Area", title: "All utensils are clean and free from damage", isCritical: false, isActive: true },
        { sequence: 10, area: "Chemical Handling Area", title: "All sieve condition- Free from damage and cleanliness", isCritical: true, isActive: true },
        { sequence: 11, area: "Chemical Handling Area", title: "All Magnets in place and to be clean", isCritical: true, isActive: true },
        { sequence: 12, area: "Chemical Handling Area", title: "All ingredient trollies to be identified", isCritical: false, isActive: true },
        { sequence: 13, area: "Chemical Handling Area", title: "All trollleys to be clean and free from damage", isCritical: false, isActive: true },
        { sequence: 14, area: "Chemical Handling Area", title: "Check for overall area cleanliness", isCritical: false, isActive: true },

        // 4. Mixing
        { sequence: 15, area: "Mixing", title: "All gasket to be free from damage", isCritical: false, isActive: true },
        { sequence: 16, area: "Mixing", title: "Floor condition - to be clean", isCritical: false, isActive: true },
        { sequence: 17, area: "Mixing", title: "Free from scrap accumulation at mixing", isCritical: false, isActive: true },
        { sequence: 18, area: "Mixing", title: "No loose nut , bolts , electrical cable,loose tape on floor/ equipment.", isCritical: true, isActive: true },
        { sequence: 19, area: "Mixing", title: "No damage and loose thread in cotton bellows", isCritical: false, isActive: true },
        { sequence: 20, area: "Mixing", title: "All utensils are clean and free from damage", isCritical: false, isActive: true },
        { sequence: 21, area: "Mixing", title: "All catch trays are in place and clean", isCritical: false, isActive: true },
        { sequence: 22, area: "Mixing", title: "No damage or loose threads in all conveyors(Cotton & PU)", isCritical: true, isActive: true },
        { sequence: 23, area: "Mixing", title: "All previous running raw material which will not be used in next running variety should be transferred back to rm store.", isCritical: true, isActive: true },
        { sequence: 24, area: "Mixing", title: "All hoppers and sprinklinlers should be clean and free from extraneous material.", isCritical: true, isActive: true },
        { sequence: 25, area: "Mixing", title: "Dough trollies in use are properly Cleaned", isCritical: false, isActive: true },
        { sequence: 26, area: "Mixing", title: "Running variety should be dispalyed on board", isCritical: false, isActive: true },
        { sequence: 27, area: "Mixing", title: "Mixer should be clean and free from any left over dough", isCritical: true, isActive: true },
        { sequence: 28, area: "Mixing", title: "Rotary Moulder,Cross Over Conveyor and Feed rollers should be cleaned", isCritical: true, isActive: true },

        // 5. Oven
        { sequence: 29, area: "Oven", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
        { sequence: 30, area: "Oven", title: "Remove all broken from Oven end", isCritical: false, isActive: true },
        { sequence: 31, area: "Oven", title: "All trollies used to be clean and free from damage", isCritical: false, isActive: true },

        // 6. Post Bake & Packing Section
        { sequence: 32, area: "Post Bake & Packing Section", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
        { sequence: 33, area: "Post Bake & Packing Section", title: "Return back all previous laminate/Trays/CBB/Tins and get issued running variety with proper checking", isCritical: true, isActive: true },
        { sequence: 34, area: "Post Bake & Packing Section", title: "All catch trays are in place and clean", isCritical: false, isActive: true },
        { sequence: 35, area: "Post Bake & Packing Section", title: "No old Biscuits are present in packing area including MD Rejection bin", isCritical: true, isActive: true },
        { sequence: 36, area: "Post Bake & Packing Section", title: "All crates and trollies are clean and free from damage", isCritical: false, isActive: true },
        { sequence: 37, area: "Post Bake & Packing Section", title: "No loose nut , bolts , electrical cable,loose tape on floor/ equipment.", isCritical: true, isActive: true },
        { sequence: 38, area: "Post Bake & Packing Section", title: "No damage or loose threads in all conveyors.", isCritical: true, isActive: true },
        { sequence: 39, area: "Post Bake & Packing Section", title: "Conveyor rollers should be cleaned", isCritical: false, isActive: true },
        { sequence: 40, area: "Post Bake & Packing Section", title: "No WIP/Previous variety material to be kept on shopfloor", isCritical: true, isActive: true },
        { sequence: 41, area: "Post Bake & Packing Section", title: "All Packing machines running/idle and its contact surfaces should be cleaned", isCritical: true, isActive: true },
        { sequence: 42, area: "Post Bake & Packing Section", title: "Proper arrangement of RC and identification on the same", isCritical: false, isActive: true },

        // 7. Biscuit Grinding
        { sequence: 43, area: "Biscuit Grinding", title: "Check for overall area cleaniness", isCritical: false, isActive: true },
        { sequence: 44, area: "Biscuit Grinding", title: "All sieve condition- Free from damage and cleanliness", isCritical: true, isActive: true },
        { sequence: 45, area: "Biscuit Grinding", title: "All Magnets are in place and to be clean.", isCritical: true, isActive: true },
        { sequence: 46, area: "Biscuit Grinding", title: "All Trollies used are clean", isCritical: false, isActive: true }
    ],

    // Form configurations mapped to their corresponding SharePoint lists
    FORMS: {
        ALC: {
            key: "ALC",
            name: "Area Line Clearance (ALC)",
            shortName: "ALC",
            listName: "Quality-Rajpura-ALC",
            badgeClass: "badge-primary",
            description: "Manage ALC Master Data: QA Shift Matrix, 7 Area Inspectors, 8 Lines, 4 Shifts, Product Catalogue, and 46 Checklist Questions Master (Critical Gate Configuration).",
            roleTypes: ["QA Assignment", "Area Inspector", "Line Master", "Shift Master", "Product Master", "Checklist Question", "QA User", "Product User"],
            userFieldNames: ["AssignedUser", "Assigned_x0020_User"],
            qaShiftFieldNames: ["QAShiftExecutive", "QAShift_x0020_Executive", "QAShiftExec", "QAShift_x0020_Exec"],
            managerFieldNames: ["EscalationManager", "Escalation_x0020_Manager"],
            hasLines: true
        },
        FoodSafety: {
            key: "FoodSafety",
            name: "Food Safety Checklist",
            shortName: "Food Safety",
            listName: "Quality-Rajpura-FoodSafety",
            badgeClass: "badge-success",
            description: "Assign QA Executives and Production Incharges for Food Safety tours (PPE, GMP, PCI checklists).",
            roleTypes: ["PPE Checklist", "GMP Checklist", "PCI Checklist", "PPE", "GMP", "PCI"],
            roleLabel: "Checklist Type",
            userLabel: "QA Executive",
            prodLabel: "Production Incharge",
            userFieldNames: ["QAExecutive", "QA_x0020_Executive", "AssignedUser"],
            prodFieldNames: ["ProductionIncharge", "Production_x0020_Incharge"],
            managerFieldNames: null,
            hasLines: false
        },
        CCP_OPRP_Sieves: {
            key: "CCP_OPRP_Sieves",
            name: "CCP, OPRP & Sieves",
            shortName: "CCP / OPRP / Sieves",
            listName: "Quality-Rajpura-CCPOPRP",
            badgeClass: "badge-warning",
            description: "Manage CCP, OPRP & Sieves Master Data: Role Assignments (QA, Production & Escalation Managers) and Product Master Catalogue.",
            roleTypes: ["CCP_OPRP", "Sieves_Magnets", "QA User", "Production User", "Product Master"],
            lines: ["Line-1", "Line-2", "Line-3", "Line-4", "Line-5", "Line-6", "Line-7", "Line-8", "FFS", "All Lines", "General"],
            userFieldNames: ["AssignedQA", "Assigned_x0020_QA", "AssignedUser"],
            prodFieldNames: ["ProductionIncharge", "Production_x0020_Incharge"],
            managerFieldNames: ["EscalationManager", "Escalation_x0020_Manager"],
            hasLines: true
        },
        MixingAndBaking: {
            key: "MixingAndBaking",
            name: "Mixing & Baking Checklist",
            shortName: "Mixing & Baking",
            listName: "Quality-Rajpura-MixingBaking",
            badgeClass: "badge-danger",
            description: "Manage Mixing & Baking Master Data: Role Assignments (QA & Production) and Master Product Recipe Quality Targets.",
            roleTypes: ["Mixing & Baking Execution", "QA Executive", "Production Executive", "Product Recipe"],
            roleLabel: "Configuration",
            userLabel: "QA Executive",
            prodLabel: "Production Executive",
            userFieldNames: ["QA_x0020_Executive", "QAExecutive", "AssignedUser", "Assigned_x0020_User"],
            prodFieldNames: ["Production_x0020_Executive", "ProductionExecutive", "ProductionIncharge", "Production_x0020_Incharge"],
            managerFieldNames: null,
            hasLines: false
        },
        PackagingOperations: {
            key: "PackagingOperations",
            name: "Packaging Operations",
            shortName: "Packaging Ops",
            listName: "Quality-Rajpura-PackagingOperations",
            badgeClass: "badge-purple",
            description: "Manage Packaging Operations Master Data: Role Assignments (QA & Production), Product Master (Line & Category), and SKU Master catalogue.",
            roleTypes: ["QA User", "QA HOD", "Production Incharge", "Production HOD", "Product Master", "SKU Master"],
            userFieldNames: ["AssignedUser", "Assigned_x0020_User"],
            managerFieldNames: ["EscalationManager", "Escalation_x0020_Manager"],
            hasLines: false
        },
        TopManagement: {
            key: "TopManagement",
            name: "Top Management Escalation Matrix",
            shortName: "Top Management",
            listName: "AdminPanel",
            badgeClass: "badge-danger",
            description: "Configure Executive Leadership distribution lists for automated Critical Incident (ALC Critical Gate) and Category-A alerts across all quality forms."
        }
    },

    topManagementState: {
        itemId: null,
        alcUsers: [],
        generalUsers: [],
        isLoading: false
    },

    /**
     * Checks if current URL requests Admin Panel instead of Rajpura Dashboard
     */
    detectAdminUrl: function () {
        try {
            const search = window.location.search.toLowerCase();
            const hash = window.location.hash.toLowerCase();
            const path = window.location.pathname.toLowerCase();
            const params = new URLSearchParams(window.location.search);

            if (params.get("view") === "admin" || params.get("mode") === "admin" || params.get("page") === "admin") return true;
            if (params.get("admin") !== null) return true;
            if (hash.includes("admin")) return true;
            if (path.includes("admin")) return true;
            if (search.includes("admin")) return true;
        } catch (e) {
            console.warn("URL admin check failed:", e);
        }
        return false;
    },

    /**
     * Cache of authorized admin users and access state
     */
    _authorizedAdmins: null,
    _isCurrentAdmin: null,

    /**
     * Fetch authorized admins from the 'AdminPanel' SharePoint list
     */
    getAuthorizedAdmins: async function () {
        if (this._authorizedAdmins !== null) return this._authorizedAdmins;

        const siteUrl = this.getSiteUrl();
        const listNames = ["AdminPanel", "Admin Panel", "Admin_Panel", "Admin_x0020_Panel"];
        let admins = [];

        for (const listName of listNames) {
            try {
                // Query with expanded Admins multi-person field
                const query = "?$select=Id,Title,Admins/Id,Admins/Title,Admins/EMail,Admins/Name,Admins/UserName&$expand=Admins&$top=100";
                const url = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
                const res = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                
                if (res.ok) {
                    const data = await res.json();
                    const items = (data.d && data.d.results) ? data.d.results : (data.value || []);
                    
                    items.forEach(item => {
                        // Admins multi-person field can be array or results object
                        const adminField = item.Admins || item.Admin || item.AdminsId;
                        const userList = (adminField && adminField.results) ? adminField.results : (Array.isArray(adminField) ? adminField : (adminField ? [adminField] : []));
                        
                        userList.forEach(u => {
                            if (u) {
                                admins.push({
                                    id: u.Id || null,
                                    title: (u.Title || "").trim(),
                                    email: (u.EMail || u.Email || "").trim().toLowerCase(),
                                    name: (u.Name || u.UserName || "").trim().toLowerCase()
                                });
                            }
                        });

                        // Fallback: If Title field itself contains user name / email
                        if (item.Title && typeof item.Title === "string" && !item.Title.toLowerCase().includes("admin")) {
                            admins.push({
                                id: null,
                                title: item.Title.trim(),
                                email: item.Title.includes("@") ? item.Title.trim().toLowerCase() : "",
                                name: item.Title.trim().toLowerCase()
                            });
                        }
                    });

                    if (admins.length > 0) {
                        console.log(`Loaded ${admins.length} authorized admins from SharePoint list '${listName}':`, admins);
                        break;
                    }
                }
            } catch (err) {
                console.warn(`Error querying list '${listName}' for AdminPanel access:`, err);
            }
        }

        // Fallback for localhost testing
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (admins.length === 0 && isLocal) {
            admins = [
                { id: 1, title: "Mishab Muhammed", email: "mishab@bectors.com", name: "mishab" },
                { id: 2, title: "Gokul K", email: "gokul.k@bectors.com", name: "gokul" }
            ];
        }

        this._authorizedAdmins = admins;
        return admins;
    },

    /**
     * Checks if current logged-in user is an authorized admin in 'AdminPanel' list
     */
    checkAdminAccess: async function () {
        if (this._isCurrentAdmin !== null) return this._isCurrentAdmin;

        try {
            const adminList = await this.getAuthorizedAdmins();
            
            // If list was queried and returned items, strictly match against user
            if (adminList && adminList.length > 0) {
                const currentDisplayName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) ? _spPageContextInfo.userDisplayName.trim() : "";
                const currentUserEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? _spPageContextInfo.userEmail.trim().toLowerCase() : "";
                const currentLoginName = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userLoginName) ? _spPageContextInfo.userLoginName.trim().toLowerCase() : "";
                const currentUserId = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userId) ? _spPageContextInfo.userId : null;
                const globalCurrentUser = (typeof currentUser !== "undefined" && currentUser) ? String(currentUser).trim() : "";
                const globalUserName = (typeof UserName !== "undefined" && UserName) ? String(UserName).trim() : "";
                const globalEmployeeName = (typeof EmployeeName !== "undefined" && EmployeeName) ? String(EmployeeName).trim() : "";

                const myEmails = [currentUserEmail, globalCurrentUser.includes("@") ? globalCurrentUser.toLowerCase() : "", globalUserName.includes("@") ? globalUserName.toLowerCase() : ""].filter(Boolean);
                const myNames = [currentDisplayName, globalCurrentUser, globalUserName, globalEmployeeName].filter(Boolean).map(n => n.toLowerCase());
                const myCleanNames = myNames.map(n => n.replace(/[^a-z0-9]/g, ""));

                const isAuthorized = adminList.some(admin => {
                    // 1. Check ID match
                    if (currentUserId && admin.id && String(currentUserId) === String(admin.id)) return true;

                    // 2. Check Email match
                    if (admin.email) {
                        const adminEmail = admin.email.toLowerCase();
                        const adminEmailUser = adminEmail.split("@")[0].replace(/[^a-z0-9]/g, "");
                        if (myEmails.some(e => e === adminEmail || e.includes(adminEmail) || adminEmail.includes(e))) return true;
                        if (myCleanNames.some(cn => cn === adminEmailUser || (cn.length > 3 && adminEmailUser.includes(cn)))) return true;
                    }

                    // 3. Check Title / Display Name match
                    if (admin.title) {
                        const adminTitle = admin.title.toLowerCase();
                        const adminCleanTitle = adminTitle.replace(/[^a-z0-9]/g, "");
                        if (myNames.some(n => n === adminTitle || n.includes(adminTitle) || adminTitle.includes(n))) return true;
                        if (myCleanNames.some(cn => cn === adminCleanTitle || (cn.length > 3 && (cn.includes(adminCleanTitle) || adminCleanTitle.includes(cn))))) return true;
                    }

                    // 4. Check Login Name match
                    if (admin.name) {
                        const adminName = admin.name.toLowerCase();
                        if (currentLoginName && (currentLoginName.includes(adminName) || adminName.includes(currentLoginName))) return true;
                    }

                    return false;
                });

                this._isCurrentAdmin = isAuthorized;
                console.log(`Admin access check result for user [${currentDisplayName} / ${currentUserEmail}]: authorized = ${isAuthorized}`);
                return isAuthorized;
            }

            const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
            this._isCurrentAdmin = isLocal;
            return this._isCurrentAdmin;
        } catch (e) {
            console.error("Error evaluating admin access:", e);
            this._isCurrentAdmin = false;
            return false;
        }
    },

    /**
     * Switch view smoothly to Admin Panel
     */
    switchToAdmin: async function () {
        console.log("Switching view to Rajpura Admin Panel");
        const hasAccess = await this.checkAdminAccess();
        if (!hasAccess) {
            alert("Access Denied: You do not have permission to access the Quality Admin Panel. Only users configured in the AdminPanel list are authorized.");
            return;
        }

        try {
            const url = new URL(window.location.href);
            url.searchParams.set("view", "admin");
            window.history.pushState({ view: "admin" }, "", url.toString());
        } catch (e) {}

        await this.activateAdminPanel();
    },

    /**
     * Switch view back to Rajpura Dashboard
     */
    switchToDashboard: function () {
        console.log("Switching view back to Rajpura Quality Dashboard");
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete("view");
            url.searchParams.delete("admin");
            url.searchParams.delete("mode");
            window.history.pushState({ view: "dashboard" }, "", url.toString());
        } catch (e) {}

        $('#rajpuraAdminPanel').hide();
        $('#rajpuraDashboardView').show();
        $('#rajpuraQualityDashboard').show();
        if (typeof ALC_Dashboard !== 'undefined' && ALC_Dashboard.activateDashboard) {
            ALC_Dashboard.activateDashboard();
        }
    },

    /**
     * Entry initialization for Admin Panel
     */
    init: async function () {
        console.log("Initializing Rajpura Admin Panel module");
        this.injectStylesheet();

        // Ensure container exists inside #rajpuraQualityDashboard (strictly Rajpura Quality section)
        let container = document.getElementById("rajpuraAdminPanel");
        const qualitySection = document.getElementById("rajpuraQualityDashboard");
        if (!container && qualitySection) {
            container = document.createElement("div");
            container.id = "rajpuraAdminPanel";
            container.style.display = "none";
            qualitySection.appendChild(container);
        } else if (!container && !qualitySection) {
            // Standalone page fallback
            container = document.createElement("div");
            container.id = "rajpuraAdminPanel";
            container.style.display = "none";
            document.body.appendChild(container);
        }

        // Only auto-activate on load if standalone admin page (WelcomePage is orchestrated by dashboard.js)
        const isStandalone = window.location.pathname.toLowerCase().includes("rajpuraadmin") || document.getElementById("rajpuraDashboardView") === null;
        if (isStandalone && this.detectAdminUrl()) {
            await this.activateAdminPanel();
        }
    },

    /**
     * Dynamically inject admin.css if not already in document
     */
    injectStylesheet: function () {
        const cssId = "rajpura-admin-css";
        if (!document.getElementById(cssId)) {
            const link = document.createElement("link");
            link.id = cssId;
            link.rel = "stylesheet";
            const webUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl)
                ? QualityRajpura_Config.getSiteBaseUrl()
                : (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webServerRelativeUrl
                    ? _spPageContextInfo.webServerRelativeUrl.replace(/\/+$/, '')
                    : "/sites/Mrs_Bectors_PTMS");
            link.href = `${webUrl}/BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/css/admin.css?v=2.6`;
            document.head.appendChild(link);
        }
    },

    /**
     * Activates and renders the Admin Panel
     */
    activateAdminPanel: async function () {
        console.log("Activating Rajpura Admin Panel");
        const panel = document.getElementById("rajpuraAdminPanel");
        if (!panel) return;

        // Verify admin permissions from AdminPanel list
        const hasAccess = await this.checkAdminAccess();
        if (!hasAccess) {
            console.warn("Access Denied: Current user is not in the AdminPanel list.");
            
            // If embedded inside dashboard, alert and restore Dashboard view
            const dashboardEl = document.getElementById("rajpuraQualityDashboard");
            if (dashboardEl && typeof ALC_Dashboard !== "undefined" && ALC_Dashboard.activateDashboard) {
                alert("Access Denied: You do not have permission to access the Quality Admin Panel. Only users configured in the AdminPanel list are authorized.");
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("view");
                    url.searchParams.delete("admin");
                    window.history.replaceState({}, "", url.toString());
                } catch (e) {}
                await ALC_Dashboard.activateDashboard();
                return;
            }

            // If standalone page, display styled Access Denied card
            $(panel).show();
            panel.innerHTML = `
                <div style="max-width: 600px; margin: 80px auto; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                    <div style="font-size: 48px; margin-bottom: 16px;"></div>
                    <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Access Denied</h2>
                    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
                        You do not have administrative permission to view or manage the Quality Admin Panel. Access is restricted to authorized users configured in the <strong>AdminPanel</strong> master directory.
                    </p>
                    <button type="button" onclick="window.location.href=(typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : '/sites/Mrs_Bectors_PTMS') + '/Pages/Home.aspx'" class="bs-btn bs-btn-primary" style="padding: 10px 24px; font-weight: 600; border-radius: 8px; font-size: 14px; cursor: pointer; background-color: #1e40af; color: #ffffff; border: none;">
                        Return to Dashboard
                    </button>
                </div>
            `;
            return;
        }

        // Ensure Admin Panel is strictly nested inside #rajpuraQualityDashboard when present
        const qualitySection = document.getElementById("rajpuraQualityDashboard");
        if (qualitySection && !panel.closest("#rajpuraQualityDashboard")) {
            qualitySection.appendChild(panel);
        }

        // Show parent Rajpura Quality section and hide the dashboard card view
        if (qualitySection) $(qualitySection).show();
        $('#rajpuraDashboardView').hide();

        // Hide default SharePoint webparts
        $('#ShowObservation, #tblTourScores, #tblOpenObservationInner, #divtblDepartmentScores, .tblTourScores').hide();
        $('#tblOpenObservationInner').closest('.container-fluid').hide();
        $('#ShowCategory, #ShowGraph').hide();

        $(panel).show();

        // Render initial UI frame
        this.renderUIFrame();

        // Load data asynchronously
        await Promise.all([
            this.loadEmployeeDirectory(),
            this.loadAllFormConfigs()
        ]);

        this.renderCurrentTab();
        this.updateStatsCounters();
    },

    /**
     * Helper to safely escape HTML special characters
     */
    escapeHtml: function (str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    },

    /**
     * Helper to extract 2-letter uppercase initials from a name
     */
    getInitials: function (name) {
        if (!name) return "U";
        const parts = String(name).trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    /**
     * Base site URL resolver
     */
    getSiteUrl: function () {
        if (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getSiteBaseUrl) {
            return QualityRajpura_Config.getSiteBaseUrl();
        }
        if (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl) {
            return _spPageContextInfo.webAbsoluteUrl;
        }
        return window.location.origin + "/sites/Mrs_Bectors_PTMS";
    },

    /**
     * Fetches form digest for SharePoint REST POST / MERGE operations
     */
    getFormDigest: async function () {
        if (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.formDigestValue) {
            return _spPageContextInfo.formDigestValue;
        }
        const elem = document.getElementById("__REQUESTDIGEST") || document.querySelector("input[name='__REQUESTDIGEST']");
        if (elem && elem.value && elem.value.length > 10) {
            return elem.value;
        }
        try {
            const siteUrl = this.getSiteUrl();
            const res = await fetch(`${siteUrl}/_api/contextinfo`, {
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose"
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.d && data.d.GetContextWebInformation && data.d.GetContextWebInformation.FormDigestValue) {
                    return data.d.GetContextWebInformation.FormDigestValue;
                }
            }
        } catch (e) {
            console.warn("Could not fetch form digest via contextinfo:", e);
        }
        if (typeof $("#__REQUESTDIGEST").val() === "string" && $("#__REQUESTDIGEST").val().length > 10) {
            return $("#__REQUESTDIGEST").val();
        }
        return "";
    },

    /**
     * Loads full employee master directory for user assignment search
     */
    loadEmployeeDirectory: async function () {
        try {
            const siteUrl = this.getSiteUrl();
            const query = "?$select=Id,Title,EmployeeName/Id,EmployeeName/Title,EmployeeName/EMail,DepartmentId/Id,DepartmentId/Title,PlantId/Id,PlantId/Title&$expand=EmployeeName,DepartmentId,PlantId&$filter=IsActive eq 1&$top=500";
            const url = `${siteUrl}/_api/web/lists/getByTitle('EmployeeList')/items${query}`;

            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (response.ok) {
                const data = await response.json();
                const results = data.d.results || [];
                this.employees = results.map(item => {
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
                console.log(`Loaded ${this.employees.length} employees from EmployeeList`);
                return;
            }
        } catch (e) {
            console.warn("Failed to load EmployeeList, attempting fallback to siteusers:", e);
        }

        // Fallback: Query siteusers
        try {
            const siteUrl = this.getSiteUrl();
            const url = `${siteUrl}/_api/web/siteusers?$filter=PrincipalType eq 1&$top=200`;
            const response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            if (response.ok) {
                const data = await response.json();
                const results = data.d.results || [];
                this.employees = results.map(u => ({
                    id: u.Id,
                    spUserId: u.Id,
                    title: u.Title,
                    email: u.Email,
                    department: "Quality / Plant",
                    plant: "Rajpura"
                }));
                console.log(`Loaded ${this.employees.length} users from siteusers fallback`);
                return;
            }
        } catch (err) {
            console.warn("Fallback to mock employees for offline dev:", err);
        }

        // Default mock employees for local test preview
        if (this.employees.length === 0) {
            this.employees = [
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
        }
    },

    /**
     * Probes SharePoint list fields to identify internal schema names
     */
    probeListSchema: async function (listName) {
        if (this.listSchemas[listName]) return this.listSchemas[listName];
        try {
            const siteUrl = this.getSiteUrl();
            const listUrl = `${siteUrl}/_api/web/lists/getByTitle('${listName}')?$select=ListItemEntityTypeFullName`;
            const fieldsUrl = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/Fields?$select=InternalName,Title,TypeAsString`;

            const [listRes, fieldsRes] = await Promise.all([
                fetch(listUrl, { headers: { "Accept": "application/json; odata=verbose" } }).catch(() => null),
                fetch(fieldsUrl, { headers: { "Accept": "application/json; odata=verbose" } }).catch(() => null)
            ]);

            let entityTypeName = `SP.Data.${listName.replace(/-/g, '_x002d_').replace(/ /g, '_x0020_')}ListItem`;
            if (listRes && listRes.ok) {
                try {
                    const listData = await listRes.json();
                    if (listData.d && listData.d.ListItemEntityTypeFullName) {
                        entityTypeName = listData.d.ListItemEntityTypeFullName;
                    }
                } catch (_) {}
            }

            let fields = [];
            if (fieldsRes && fieldsRes.ok) {
                try {
                    const data = await fieldsRes.json();
                    fields = data.d.results || [];
                } catch (_) {}
            }

            const schema = {
                entityTypeName: entityTypeName,
                fields: fields,
                findField: function (possibleNames, displayNames) {
                    if (!fields || fields.length === 0) return null;
                    const pNames = (Array.isArray(possibleNames) ? possibleNames : [possibleNames]).filter(Boolean);
                    let match = fields.find(f => pNames.some(pn => pn.toLowerCase() === (f.InternalName || "").toLowerCase()));
                    if (match) return match;
                    if (displayNames) {
                        const dNames = (Array.isArray(displayNames) ? displayNames : [displayNames]).filter(Boolean);
                        match = fields.find(f => dNames.some(dn => dn.toLowerCase() === (f.Title || "").toLowerCase()));
                    }
                    return match;
                }
            };
            this.listSchemas[listName] = schema;
            return schema;
        } catch (e) {
            console.warn(`Could not probe schema for list ${listName}:`, e);
        }
        return null;
    },

    /**
     * Loads user configuration rows for all 5 forms
     */
    loadAllFormConfigs: async function () {
        this.isLoading = true;
        const keys = Object.keys(this.FORMS);
        for (const key of keys) {
            await this.loadSingleFormConfig(key);
        }
        this.isLoading = false;
    },

    /**
     * Loads config rows for a single form list
     */
    loadSingleFormConfig: async function (formKey) {
        if (formKey === "TopManagement") {
            return await this.loadTopManagementConfig();
        }

        const formDef = this.FORMS[formKey];
        if (!formDef) return;

        const siteUrl = this.getSiteUrl();
        const listName = formDef.listName;

        try {
            const schema = await this.probeListSchema(listName);

            // Dynamic field names
            const configTypeField = schema ? schema.findField(["ConfigType", "Config_x0020_Type"], "Config Type") : null;
            const plantField = schema ? schema.findField(["Plant"], "Plant") : null;
            const areaField = schema ? schema.findField(["Area"], "Area") : null;
            const regionField = schema ? schema.findField(["Region"], "Region") : null;
            const checklistTypeField = schema ? schema.findField(["ChecklistType", "Checklist_x0020_Type"], "Checklist Type") : null;

            const userField = schema ? schema.findField(formDef.userFieldNames, ["QA Executive", "QAExecutive", "QA_x0020_Executive", "Assigned User", "Assigned QA"]) : null;
            const prodField = schema && formDef.prodFieldNames ? schema.findField(formDef.prodFieldNames, ["Production Executive", "ProductionExecutive", "Production_x0020_Executive", "Production Incharge", "Production Shift"]) : null;
            const managerField = schema && formDef.managerFieldNames ? schema.findField(formDef.managerFieldNames, ["Escalation Manager", "EscalationManager", "Escalation_x0020_Manager"]) : null;

            const selectParts = ["Id", "Title"];
            const expandParts = [];

            if (configTypeField) selectParts.push(configTypeField.InternalName);
            else if (!schema) selectParts.push("ConfigType");

            if (plantField) selectParts.push(plantField.InternalName);
            else if (!schema) selectParts.push("Plant");

            if (areaField) selectParts.push(areaField.InternalName);
            else if (!schema) selectParts.push("Area");

            if (regionField) selectParts.push(regionField.InternalName);
            else if (!schema && formKey === "ALC") selectParts.push("Region");

            if (checklistTypeField) selectParts.push(checklistTypeField.InternalName);
            else if (!schema && formKey === "FoodSafety" && !selectParts.includes("ChecklistType")) selectParts.push("ChecklistType");

            // Include master fields for ALC, PackagingOperations, CCP_OPRP_Sieves, and MixingAndBaking list
            const lineF = schema ? schema.findField(["LineName", "Line_x0020_Name", "Line"], "Line Name") : null;
            const shiftCodeF = schema ? schema.findField(["ShiftCode", "Shift_x0020_Code", "Shift"], "Shift Code") : null;
            const shiftNameF = schema ? schema.findField(["ShiftName", "Shift_x0020_Name"], "Shift Name") : null;
            const shiftStartF = schema ? schema.findField(["ShiftStart", "Shift_x0020_Start"], "Shift Start") : null;
            const shiftEndF = schema ? schema.findField(["ShiftEnd", "Shift_x0020_End"], "Shift End") : null;
            const prodCodeF = schema ? schema.findField(["ProductCode", "Product_x0020_Code", "SKU"], "Product Code") : null;
            const prodCatF = schema ? schema.findField(["ProductCategory", "Product_x0020_Category"], "Product Category") : null;
            const isActF = schema ? schema.findField(["IsActive", "Is_x0020_Active", "Active"], "Is Active") : null;
            const isCritF = schema ? schema.findField(["IsCritical", "Is_x0020_Critical", "Critical"], "Is Critical") : null;
            const remF = schema ? schema.findField(["Remarks", "Remarks_x0020_Text"], "Remarks") : null;
            const recipeF = schema ? schema.findField(["RecipeConfig", "Recipe_x0020_Config"], "Recipe Config") : null;

            if (formKey === "ALC") {
                if (lineF && !selectParts.includes(lineF.InternalName)) selectParts.push(lineF.InternalName);
                if (shiftCodeF && !selectParts.includes(shiftCodeF.InternalName)) selectParts.push(shiftCodeF.InternalName);
                if (prodCodeF && !selectParts.includes(prodCodeF.InternalName)) selectParts.push(prodCodeF.InternalName);
                if (prodCatF && !selectParts.includes(prodCatF.InternalName)) selectParts.push(prodCatF.InternalName);
                if (shiftNameF && !selectParts.includes(shiftNameF.InternalName)) selectParts.push(shiftNameF.InternalName);
                if (shiftStartF && !selectParts.includes(shiftStartF.InternalName)) selectParts.push(shiftStartF.InternalName);
                if (shiftEndF && !selectParts.includes(shiftEndF.InternalName)) selectParts.push(shiftEndF.InternalName);
                if (isActF && !selectParts.includes(isActF.InternalName)) selectParts.push(isActF.InternalName);
                if (isCritF && !selectParts.includes(isCritF.InternalName)) selectParts.push(isCritF.InternalName);
                if (remF && !selectParts.includes(remF.InternalName)) selectParts.push(remF.InternalName);
            } else if (formKey === "PackagingOperations" || formKey === "CCP_OPRP_Sieves") {
                if (prodCodeF && !selectParts.includes(prodCodeF.InternalName)) selectParts.push(prodCodeF.InternalName);
                if (lineF && !selectParts.includes(lineF.InternalName)) selectParts.push(lineF.InternalName);
                if (prodCatF && !selectParts.includes(prodCatF.InternalName)) selectParts.push(prodCatF.InternalName);
                if (isActF && !selectParts.includes(isActF.InternalName)) selectParts.push(isActF.InternalName);
            } else if (formKey === "MixingAndBaking") {
                if (prodCatF && !selectParts.includes(prodCatF.InternalName)) selectParts.push(prodCatF.InternalName);
                if (isActF && !selectParts.includes(isActF.InternalName)) selectParts.push(isActF.InternalName);
                if (recipeF && !selectParts.includes(recipeF.InternalName)) selectParts.push(recipeF.InternalName);
                if (remF && !selectParts.includes(remF.InternalName)) selectParts.push(remF.InternalName);
            }

            // User Field
            const uInternalName = userField ? userField.InternalName : null;
            if (uInternalName) {
                selectParts.push(`${uInternalName}/Title`, `${uInternalName}/EMail`, `${uInternalName}/Id`);
                expandParts.push(uInternalName);
            }

            // Production Field
            const pInternalName = prodField ? prodField.InternalName : null;
            if (pInternalName) {
                selectParts.push(`${pInternalName}/Title`, `${pInternalName}/EMail`, `${pInternalName}/Id`);
                expandParts.push(pInternalName);
            }

            // Manager Field
            const mInternalName = managerField ? managerField.InternalName : null;
            if (mInternalName) {
                selectParts.push(`${mInternalName}/Title`, `${mInternalName}/EMail`, `${mInternalName}/Id`);
                expandParts.push(mInternalName);
            }

            // QA Shift Executive Field (ALC)
            const qaShiftField = schema && formDef.qaShiftFieldNames ? schema.findField(formDef.qaShiftFieldNames, ["QA Shift Executive", "QAShiftExecutive"]) : null;
            const qsInternalName = qaShiftField ? qaShiftField.InternalName : null;
            if (qsInternalName) {
                selectParts.push(`${qsInternalName}/Title`, `${qsInternalName}/EMail`, `${qsInternalName}/Id`);
                expandParts.push(qsInternalName);
            }

            let query = `?$select=${selectParts.join(",")}&$top=5000`;
            if (expandParts.length > 0) query += `&$expand=${expandParts.join(",")}`;
            if (plantField) {
                query += `&$filter=${plantField.InternalName} eq 'Rajpura'`;
            }

            let url = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${query}`;
            let response = null;
            try {
                response = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
            } catch (fetchErr) {
                console.warn(`Initial fetch for ${listName} failed:`, fetchErr);
            }

            // Fallback for ALC if master fields not present or need basic query
            if ((!response || !response.ok) && formKey === "ALC") {
                const fbQueries = [
                    "?$select=Id,Title,ConfigType,Plant,Area,LineName,ShiftCode,ProductCode,ProductCategory,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,QAShiftExecutive/Title,QAShiftExecutive/EMail,QAShiftExecutive/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id&$expand=AssignedUser,QAShiftExecutive,EscalationManager&$filter=Plant eq 'Rajpura'&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,Area,LineName,ShiftCode,ProductCode,ProductCategory,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id&$expand=AssignedUser,EscalationManager&$filter=Plant eq 'Rajpura'&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,Area,LineName,ShiftCode,ProductCode,ProductCategory,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id&$expand=AssignedUser&$filter=Plant eq 'Rajpura'&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,Area,LineName,ShiftCode,ProductCode,ProductCategory&$filter=Plant eq 'Rajpura'&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,Area,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id,EscalationManager/Title,EscalationManager/EMail,EscalationManager/Id&$expand=AssignedUser,EscalationManager&$filter=Plant eq 'Rajpura'&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,Area&$top=5000",
                    "?$select=Id,Title&$top=5000"
                ];
                for (const q of fbQueries) {
                    try {
                        const fbUrl = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${q}`;
                        const fbRes = await fetch(fbUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                        if (fbRes.ok) {
                            response = fbRes;
                            break;
                        }
                    } catch (err) {}
                }
            }

            // Fallback for space-encoded field names (QA_x0020_Executive, Production_x0020_Executive)
            if ((!response || !response.ok) && formKey === "MixingAndBaking") {
                const fbQueries = [
                    "?$select=Id,Title,ConfigType,Plant,ProductCategory,IsActive,RecipeConfig,QA_x0020_Executive/Title,QA_x0020_Executive/EMail,QA_x0020_Executive/Id,Production_x0020_Executive/Title,Production_x0020_Executive/EMail,Production_x0020_Executive/Id&$expand=QA_x0020_Executive,Production_x0020_Executive&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,ProductCategory,IsActive,RecipeConfig,QAExecutive/Title,QAExecutive/EMail,QAExecutive/Id,ProductionExecutive/Title,ProductionExecutive/EMail,ProductionExecutive/Id&$expand=QAExecutive,ProductionExecutive&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,ProductCategory,IsActive,RecipeConfig,AssignedUser/Title,AssignedUser/EMail,AssignedUser/Id&$expand=AssignedUser&$top=5000",
                    "?$select=Id,Title,ConfigType,Plant,ProductCategory,IsActive,RecipeConfig&$top=5000",
                    "?$select=Id,Title,Config_x0020_Type,Plant,ProductCategory,IsActive,RecipeConfig,QA_x0020_Executive/Title,QA_x0020_Executive/EMail,QA_x0020_Executive/Id,Production_x0020_Executive/Title,Production_x0020_Executive/EMail,Production_x0020_Executive/Id&$expand=QA_x0020_Executive,Production_x0020_Executive&$top=5000"
                ];
                for (const q of fbQueries) {
                    try {
                        const fbUrl = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${q}`;
                        const fbRes = await fetch(fbUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                        if (fbRes.ok) {
                            response = fbRes;
                            break;
                        }
                    } catch (err) {}
                }
            }

            // Fallback for space-encoded field names for FoodSafety
            if ((!response || !response.ok) && formKey === "FoodSafety") {
                const fbQuery = "?$select=Id,Title,Plant,ChecklistType,QA_x0020_Executive/Title,QA_x0020_Executive/EMail,QA_x0020_Executive/Id,Production_x0020_Incharge/Title,Production_x0020_Incharge/EMail,Production_x0020_Incharge/Id&$expand=QA_x0020_Executive,Production_x0020_Incharge";
                const fbUrl = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${fbQuery}`;
                try {
                    const fbRes = await fetch(fbUrl, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (fbRes.ok) response = fbRes;
                } catch (err) {}
            }

            if (response && response.ok) {
                const data = await response.json();
                const results = data.d.results || [];

                this.configs[formKey] = results.map(item => {
                    const rawUser = (userField && item[userField.InternalName]) ||
                        item.QAExecutive ||
                        item.QA_x0020_Executive ||
                        item.AssignedUser ||
                        item.Assigned_x0020_User ||
                        item.AssignedQA ||
                        item.Assigned_x0020_QA;

                    const rawProd = (prodField && item[prodField.InternalName]) ||
                        item.ProductionExecutive ||
                        item.Production_x0020_Executive ||
                        item.ProductionIncharge ||
                        item.Production_x0020_Incharge;

                    const rawMgr = (managerField && item[managerField.InternalName]) ||
                        item.EscalationManager ||
                        item.Escalation_x0020_Manager;

                    const rawQaShift = (qaShiftField && item[qaShiftField.InternalName]) ||
                        item.QAShiftExecutive ||
                        item.QAShift_x0020_Executive;

                    const rawChecklistType = (checklistTypeField && item[checklistTypeField.InternalName]) ||
                        item.ChecklistType ||
                        item.Checklist_x0020_Type || "";

                    const rawConfigType = (configTypeField && item[configTypeField.InternalName]) ||
                        item.ConfigType ||
                        item.Config_x0020_Type || "";

                    let finalTitle = (item.Title && item.Title.trim() !== "" && item.Title.trim() !== "N/A") ? item.Title.trim() : "";
                    let finalConfigType = rawConfigType || rawChecklistType || "";

                    let parsedRecipe = {};
                    if (item.RecipeConfig || item.Remarks || item.Description) {
                        const rawJson = item.RecipeConfig || item.Remarks || item.Description || "";
                        if (rawJson && typeof rawJson === "string" && rawJson.trim().startsWith("{")) {
                            try {
                                parsedRecipe = JSON.parse(rawJson);
                            } catch (e) {
                                console.warn("Failed parsing RecipeConfig JSON for item:", item.Title, e);
                            }
                        }
                    }

                    // Extract sequence and critical markers if encoded in Title (e.g. "1. [CRITICAL] Floor...")
                    let extractedSeq = 0;
                    let extractedCritical = false;
                    const seqMatch = finalTitle.match(/^(\d+)[\.\:\-\s]+/);
                    if (seqMatch) {
                        extractedSeq = parseInt(seqMatch[1], 10);
                        finalTitle = finalTitle.substring(seqMatch[0].length).trim();
                    }
                    if (/\[critical(?:\s*gate)?\]/i.test(finalTitle)) {
                        extractedCritical = true;
                        finalTitle = finalTitle.replace(/\[critical(?:\s*gate)?\]\s*/i, "").trim();
                    }

                    const rawIsCritical = isCritF ? item[isCritF.InternalName] : (item.IsCritical || item.Is_x0020_Critical);
                    const rawRemarks = remF ? item[remF.InternalName] : (item.Remarks || item.Remarks_x0020_Text);
                    const rawCat = prodCatF ? item[prodCatF.InternalName] : (item.ProductCategory || "");
                    const isCriticalBool = extractedCritical || (rawIsCritical === true || rawIsCritical === "Yes" || rawIsCritical === 1 ||
                        String(rawCat).toLowerCase() === "critical" || String(rawCat).toLowerCase() === "yes" ||
                        String(rawRemarks).toLowerCase() === "critical");
                    const rawSeq = shiftCodeF ? item[shiftCodeF.InternalName] : (prodCodeF ? item[prodCodeF.InternalName] : (item.Sequence || extractedSeq || 0));

                    return {
                        id: item.Id,
                        title: finalTitle,
                        configType: finalConfigType,
                        checklistType: rawChecklistType || finalTitle,
                        area: areaField ? item[areaField.InternalName] : (item.Area || ""),
                        plant: plantField ? item[plantField.InternalName] : (item.Plant || "Rajpura"),
                        lineName: lineF ? item[lineF.InternalName] : (item.LineName || ""),
                        shiftCode: shiftCodeF ? item[shiftCodeF.InternalName] : (extractedSeq ? String(extractedSeq) : ""),
                        shiftName: shiftNameF ? item[shiftNameF.InternalName] : (item.ShiftName || ""),
                        shiftStart: shiftStartF ? item[shiftStartF.InternalName] : (item.ShiftStart || ""),
                        shiftEnd: shiftEndF ? item[shiftEndF.InternalName] : (item.ShiftEnd || ""),
                        productCode: prodCodeF ? item[prodCodeF.InternalName] : (extractedSeq ? String(extractedSeq) : ""),
                        productCategory: rawCat || (isCriticalBool ? "Critical" : "Standard"),
                        isCritical: isCriticalBool,
                        sequence: parseInt(rawSeq, 10) || extractedSeq || 0,
                        isActive: isActF ? (item[isActF.InternalName] !== false) : (item.IsActive !== false),
                        recipeConfig: parsedRecipe,
                        assignedUsers: this.normalizeUsers(rawUser),
                        qaShiftExecutives: this.normalizeUsers(rawQaShift),
                        productionIncharges: this.normalizeUsers(rawProd),
                        escalationManagers: this.normalizeUsers(rawMgr),
                        raw: item
                    };
                });

                // In Packaging Operations, strictly exclude legacy/obsolete "Product User" / "Product HOD" rows unless they are Master rows
                if (formKey === "PackagingOperations") {
                    this.configs[formKey] = this.configs[formKey].filter(r => {
                        const t = (r.title || "").toLowerCase();
                        const c = (r.configType || "").toLowerCase();
                        if (c === "product master" || c === "sku master") return true;
                        return !t.includes("product user") && !c.includes("product user") && !t.includes("product hod") && !c.includes("product hod");
                    });
                }

                console.log(`Loaded ${this.configs[formKey].length} rows for ${formDef.name}`);
                return;
            }
        } catch (e) {
            console.warn(`Failed to fetch config for ${formKey} from SharePoint:`, e);
        }

        // Mock fallback preview for offline/development test
        if (!this.configs[formKey] || this.configs[formKey].length === 0) {
            this.configs[formKey] = this.getMockConfigForForm(formKey);
        }
    },

    /**
     * Normalizes person or group SharePoint field into a clean array of user objects
     */
    normalizeUsers: function (raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) {
            return raw
                .filter(u => u && (u.Id || u.id || u.Title || u.title || u.EMail || u.email))
                .map(u => ({
                    id: u.Id || u.id || u.ID || null,
                    spUserId: u.Id || u.id || u.ID || null,
                    title: (u.Title || u.title || "").trim(),
                    email: (u.EMail || u.Email || u.email || "").trim()
                }));
        }
        if (raw.results && Array.isArray(raw.results)) {
            return raw.results
                .filter(u => u && (u.Id || u.id || u.Title || u.title || u.EMail || u.email))
                .map(u => ({
                    id: u.Id || u.id || u.ID || null,
                    spUserId: u.Id || u.id || u.ID || null,
                    title: (u.Title || u.title || "").trim(),
                    email: (u.EMail || u.Email || u.email || "").trim()
                }));
        }
        if (raw.Title || raw.EMail || raw.Id || raw.title || raw.email || raw.id) {
            return [{
                id: raw.Id || raw.id || raw.ID || null,
                spUserId: raw.Id || raw.id || raw.ID || null,
                title: (raw.Title || raw.title || "").trim(),
                email: (raw.EMail || raw.Email || raw.email || "").trim()
            }];
        }
        return [];
    },

    /**
     * Generates default realistic mock config data when SharePoint is offline
     */
    getMockConfigForForm: function (formKey) {
        if (formKey === "ALC") {
            return [
                // 1. Line Master (8 Lines)
                { id: 101, title: "Line No. 1", configType: "Line Master", lineName: "HAAS", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 102, title: "Line No. 2", configType: "Line Master", lineName: "IMAFORNI", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 103, title: "Line No. 3", configType: "Line Master", lineName: "HAAS", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 104, title: "Line No. 4", configType: "Line Master", lineName: "AZAAN", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 105, title: "Line No. 5", configType: "Line Master", lineName: "AZAAN", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 106, title: "Line No. 6", configType: "Line Master", lineName: "AZAAN", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 107, title: "Line No. 7", configType: "Line Master", lineName: "AZAAN", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 108, title: "Line No. 8", configType: "Line Master", lineName: "HAAS", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },

                // 2. Shift Master (4 Shifts)
                { id: 201, title: "Shift A", configType: "Shift Master", shiftCode: "A", shiftName: "Morning", shiftStart: "6:00 A.M.", shiftEnd: "2:00 P.M.", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 202, title: "Shift B", configType: "Shift Master", shiftCode: "B", shiftName: "Evening", shiftStart: "2:00 P.M.", shiftEnd: "10:00 P.M.", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 203, title: "Shift C", configType: "Shift Master", shiftCode: "C", shiftName: "Night", shiftStart: "10:00 P.M.", shiftEnd: "6:00 A.M.", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 204, title: "Shift G", configType: "Shift Master", shiftCode: "G", shiftName: "General", shiftStart: "9:30 A.M.", shiftEnd: "6:00 P.M.", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },

                // 3. Area Inspector Assignment (7 Areas)
                { id: 301, title: "AREA-01", configType: "Area Inspector", area: "RM Store", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 104, title: "Rajesh Kumar", email: "" }, { id: 105, title: "Karan Singh", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 302, title: "AREA-02", configType: "Area Inspector", area: "Flour & Sugar Handling", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 106, title: "Asit Kumar", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 303, title: "AREA-03", configType: "Area Inspector", area: "Chemical Handling Area", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 106, title: "Asit Kumar", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 304, title: "AREA-04", configType: "Area Inspector", area: "Mixing", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 107, title: "Jayant Shrivastava", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 305, title: "AREA-05", configType: "Area Inspector", area: "Oven", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 108, title: "Maheshwar Yadav", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 306, title: "AREA-06", configType: "Area Inspector", area: "Post Bake & Packing Section", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 109, title: "Satish Verma", email: "" }], escalationManagers: [], productionIncharges: [] },
                { id: 307, title: "AREA-07", configType: "Area Inspector", area: "Biscuit Grinding", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 105, title: "Karan Singh", email: "" }, { id: 109, title: "Satish Verma", email: "" }], escalationManagers: [], productionIncharges: [] },

                // 4. QA Shift Assignment Matrix
                {
                    id: 401,
                    title: "Default",
                    configType: "QA Assignment",
                    shiftCode: "Default",
                    plant: "Rajpura",
                    isActive: true,
                    assignedUsers: [
                        { id: 101, title: "QA Process Team 1", email: "" },
                        { id: 102, title: "QA Process Team 2", email: "" }
                    ],
                    escalationManagers: [
                        { id: 105, title: "Karan Singh", email: "" },
                        { id: 106, title: "Asit Kumar", email: "" }
                    ],
                    productionIncharges: []
                },
                {
                    id: 402,
                    title: "Line No. 1",
                    configType: "QA Assignment",
                    shiftCode: "A",
                    plant: "Rajpura",
                    isActive: true,
                    assignedUsers: [
                        { id: 101, title: "QA Process Team 1", email: "" }
                    ],
                    escalationManagers: [
                        { id: 105, title: "Karan Singh", email: "" }
                    ],
                    productionIncharges: []
                },

                // 5. Product Master (Changeover Varieties)
                { id: 501, title: "Cremica Bourbon", configType: "Product Master", productCode: "PRD-001", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 502, title: "Marie Delight", configType: "Product Master", productCode: "PRD-002", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 503, title: "Digestive Crackers", configType: "Product Master", productCode: "PRD-003", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] }
            ];
        }
        if (formKey === "FoodSafety") {
            return [
                {
                    id: 11,
                    title: "PPE Checklist",
                    configType: "PPE Checklist",
                    checklistType: "PPE",
                    plant: "Rajpura",
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectors.com" }
                    ],
                    productionIncharges: [
                        { id: 111, title: "Shaan Arshaqu", email: "shaan.arshaqu@bectors.com" },
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }
                    ],
                    escalationManagers: []
                },
                {
                    id: 12,
                    title: "GMP Checklist",
                    configType: "GMP Checklist",
                    checklistType: "GMP",
                    plant: "Rajpura",
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectors.com" }
                    ],
                    productionIncharges: [
                        { id: 111, title: "Shaan Arshaqu", email: "shaan.arshaqu@bectors.com" },
                        { id: 110, title: "Ajith K", email: "ajith.k@bectors.com" }
                    ],
                    escalationManagers: []
                },
                {
                    id: 13,
                    title: "PCI Checklist",
                    configType: "PCI Checklist",
                    checklistType: "PCI",
                    plant: "Rajpura",
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }
                    ],
                    productionIncharges: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }
                    ],
                    escalationManagers: []
                }
            ];
        }
        if (formKey === "CCP_OPRP_Sieves") {
            const rawSeedProducts = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA))
                ? CCP_PRODUCTS_SEED_DATA
                : ((typeof window !== "undefined" && typeof window.CCP_PRODUCTS_SEED_DATA !== "undefined") ? window.CCP_PRODUCTS_SEED_DATA : []);
            
            const seedItems = rawSeedProducts.map((p, idx) => ({
                id: 2000 + idx,
                title: p.title,
                configType: "Product Master",
                plant: p.plant || "Rajpura",
                lineName: p.lineName || "All Lines",
                productCode: p.productCode || `CCP-ALL-${String(idx + 1).padStart(3, '0')}`,
                productCategory: p.productCategory || "General",
                isActive: p.isActive !== false,
                raw: { Title: p.title, LineName: p.lineName || "All Lines", ProductCode: p.productCode, ProductCategory: p.productCategory, IsActive: p.isActive !== false }
            }));

            return [
                { id: 21, title: "Line-1", configType: "CCP_OPRP", area: "Line-1", plant: "Rajpura", assignedUsers: [{ id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }], productionIncharges: [{ id: 104, title: "Mahesh Singh", email: "mahesh.singh@bectors.com" }], escalationManagers: [{ id: 103, title: "Suresh Kumar", email: "suresh.kumar@bectors.com" }] },
                { id: 22, title: "Line-2", configType: "CCP_OPRP", area: "Line-2", plant: "Rajpura", assignedUsers: [{ id: 102, title: "Ankur Sharma", email: "ankur.sharma@bectors.com" }], productionIncharges: [{ id: 105, title: "Rajesh Verma", email: "rajesh.verma@bectors.com" }], escalationManagers: [{ id: 103, title: "Suresh Kumar", email: "suresh.kumar@bectors.com" }] },
                { id: 23, title: "Line-5", configType: "CCP_OPRP", area: "Line-5", plant: "Rajpura", assignedUsers: [{ id: 106, title: "Vikas Patel", email: "vikas.patel@bectors.com" }], productionIncharges: [{ id: 104, title: "Mahesh Singh", email: "mahesh.singh@bectors.com" }], escalationManagers: [{ id: 103, title: "Suresh Kumar", email: "suresh.kumar@bectors.com" }] },
                { id: 24, title: "Line-6", configType: "CCP_OPRP", area: "Line-6", plant: "Rajpura", assignedUsers: [{ id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }], productionIncharges: [{ id: 105, title: "Rajesh Verma", email: "rajesh.verma@bectors.com" }], escalationManagers: [{ id: 103, title: "Suresh Kumar", email: "suresh.kumar@bectors.com" }] },
                ...seedItems
            ];
        }
        if (formKey === "MixingAndBaking") {
            const rawSeedList = (typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA) && MB_RECIPES_SEED_DATA.length > 0)
                ? MB_RECIPES_SEED_DATA
                : ((typeof window.MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(window.MB_RECIPES_SEED_DATA) && window.MB_RECIPES_SEED_DATA.length > 0)
                    ? window.MB_RECIPES_SEED_DATA
                    : this.getStandardMbSeedRecipes());

            const seedRecipes = rawSeedList.map((r, idx) => ({
                id: r.id || (901 + idx),
                title: r.title,
                configType: "Product Recipe",
                productCategory: r.productCategory || "Cookies",
                plant: "Rajpura",
                isActive: r.isActive !== false,
                recipeConfig: r.standards || {},
                assignedUsers: [],
                productionIncharges: [],
                escalationManagers: []
            }));

            return [
                {
                    id: 1,
                    title: "Mixing & Baking Execution",
                    configType: "Mixing & Baking Execution",
                    area: "Mixing & Baking Line",
                    plant: "Rajpura",
                    isActive: true,
                    assignedUsers: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" },
                        { id: 108, title: "Gokul K", email: "gokul.k@bectors.com" },
                        { id: 109, title: "Aiswarya N V", email: "aiswarya.nv@bectors.com" }
                    ],
                    productionIncharges: [
                        { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" },
                        { id: 110, title: "Ajith K", email: "ajith.k@bectors.com" },
                        { id: 109, title: "Aiswarya N V", email: "aiswarya.nv@bectors.com" }
                    ],
                    escalationManagers: []
                },
                ...seedRecipes
            ];
        }
        if (formKey === "PackagingOperations") {
            const seedProducts = (typeof PKG_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(PKG_PRODUCTS_SEED_DATA) && PKG_PRODUCTS_SEED_DATA.length > 0)
                ? PKG_PRODUCTS_SEED_DATA.map((p, idx) => ({
                    id: 1000 + idx,
                    title: p.title,
                    configType: "Product Master",
                    productCode: p.productCode || "",
                    lineName: p.lineName || "All Lines",
                    productCategory: p.productCategory || "General",
                    plant: "Rajpura",
                    isActive: true,
                    assignedUsers: [],
                    escalationManagers: [],
                    productionIncharges: []
                }))
                : [
                    { id: 601, title: "Cremica Bourbon", configType: "Product Master", productCode: "PRD-001", lineName: "Line 1", productCategory: "Cream", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 602, title: "Cremica Butter Cookies", configType: "Product Master", productCode: "PRD-002", lineName: "Line 2", productCategory: "Cookies", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 603, title: "Cremica Digestive Crackers", configType: "Product Master", productCode: "PRD-003", lineName: "Line 3", productCategory: "Crackers", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 604, title: "Cremica Marie Classic", configType: "Product Master", productCode: "PRD-004", lineName: "Line 4", productCategory: "Health Biscuits", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 605, title: "Cremica Magic Cream Chocolate", configType: "Product Master", productCode: "PRD-005", lineName: "Line 5", productCategory: "Cream", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 606, title: "Cremica Magic Cream Elaichi", configType: "Product Master", productCode: "PRD-006", lineName: "Line 5", productCategory: "Cream", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 607, title: "Cremica Glucose Power", configType: "Product Master", productCode: "PRD-007", lineName: "Line 6", productCategory: "Glucose", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 608, title: "Cremica Coconut Crunch", configType: "Product Master", productCode: "PRD-008", lineName: "Line 7", productCategory: "Cookies", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 609, title: "Cremica Nice Sugar Sprinkled", configType: "Product Master", productCode: "PRD-009", lineName: "Line 8", productCategory: "Cookies", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                    { id: 610, title: "Bectors Original Crackers", configType: "Product Master", productCode: "PRD-010", lineName: "All Lines", productCategory: "Crackers", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] }
                ];

            return [
                // 1. Role Assignments
                { id: 41, title: "QA User", configType: "QA User", area: "Packaging Lines", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 101, title: "Mishab Muhammed", email: "" }, { id: 108, title: "Gokul K", email: "" }, { id: 112, title: "Babifas P", email: "" }], productionIncharges: [], escalationManagers: [] },
                { id: 42, title: "Production Incharge", configType: "Production Incharge", area: "Packaging Area", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 101, title: "Mishab Muhammed", email: "" }], productionIncharges: [], escalationManagers: [] },
                { id: 43, title: "QA HOD", configType: "QA HOD", area: "Quality Assurance", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 201, title: "Jayant Shrivastava", email: "" }], productionIncharges: [], escalationManagers: [] },
                { id: 44, title: "Production HOD", configType: "Production HOD", area: "Plant Production", plant: "Rajpura", isActive: true, assignedUsers: [{ id: 202, title: "Maheshwar Yadav", email: "" }], productionIncharges: [], escalationManagers: [] },

                // 2. Product Master (1,105 Products)
                ...seedProducts,

                // 3. SKU Master
                { id: 701, title: "50g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 702, title: "75g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 703, title: "100g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 704, title: "120g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 705, title: "150g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 706, title: "200g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 707, title: "250g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 708, title: "300g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 709, title: "500g", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] },
                { id: 710, title: "1kg Family Pack", configType: "SKU Master", productCode: "", plant: "Rajpura", isActive: true, assignedUsers: [], escalationManagers: [], productionIncharges: [] }
            ];
        }
        return [];
    },

    /**
     * Renders outer frame containing Header, Quick Stats, and Navigation Tabs
     */
    renderUIFrame: function () {
        const container = document.getElementById("rajpuraAdminPanel");
        if (!container) return;

        const tabsHtml = Object.keys(this.FORMS).map(key => {
            const form = this.FORMS[key];
            const isActive = this.activeTab === key ? "active" : "";
            return `
                <button type="button" class="admin-tab-btn ${isActive}" onclick="Rajpura_Admin.switchTab('${key}')">
                    <span>${form.shortName}</span>
                    <span class="admin-tab-badge" id="badge-count-${key}">0</span>
                </button>
            `;
        }).join("");

        container.innerHTML = `
            <!-- Header Card -->
            <div class="admin-header-card">
                <div class="admin-header-left">
                    <div class="admin-header-icon"></div>
                    <div>
                        <h2 class="admin-header-title">Rajpura Quality Admin Panel</h2>
                        <p class="admin-header-subtitle">
                            <span>Master Data & Role Permissions</span>
                            <span class="admin-header-badge" id="admin-status-pill">Live Synced</span>
                        </p>
                    </div>
                </div>
                <div class="admin-header-actions">
                    <button type="button" class="admin-btn-refresh" onclick="Rajpura_Admin.refreshAll()">
                        Refresh
                    </button>
                    <button type="button" class="admin-btn-dashboard" onclick="Rajpura_Admin.switchToDashboard()">
                        Quality Dashboard
                    </button>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="admin-tabs-nav">
                ${tabsHtml}
            </div>

            <!-- Active Form Content Mount -->
            <div id="adminTabContentMount">
                <div class="admin-empty-state">
                    <div class="admin-loading-spinner"></div>
                    <div style="margin-top: 12px; font-weight: 500;">Loading configurations...</div>
                </div>
            </div>

            <!-- Modal Mount Point -->
            <div id="adminModalMount"></div>

            <!-- Toast Notifications Container -->
            <div id="adminToastContainer"></div>
        `;
    },

    /**
     * Switch active form tab
     */
    switchTab: function (tabKey) {
        this.activeTab = tabKey;
        this.searchFilter = "";

        // Update tab buttons
        $(".admin-tab-btn").removeClass("active");
        $(`.admin-tab-btn:has(span:contains('${this.FORMS[tabKey].shortName}'))`).addClass("active");

        this.renderCurrentTab();
    },

    /**
     * Switch sub-section: "users" (Assign Users) vs "products" (Product Management)
     */
    switchSubSection: function (subKey) {
        this.activeSubSection = subKey;
        this.renderCurrentTab();
    },

    /**
     * Switch ALC Master sub-tab
     */
    switchAlcSubTab: function (subTabKey) {
        this.alcSubTab = subTabKey;
        this.searchFilter = "";
        this.renderCurrentTab();
    },

    getAlcSubTabLabel: function (key) {
        switch (key) {
            case "qa-matrix": return "QA Shift Assignment Matrix";
            case "areas": return "Area Inspector Assignment (7 Areas)";
            case "lines": return "Production Line Master (8 Lines)";
            case "shifts": return "Shift Master (4 Shifts)";
            case "products": return "Changeover Product Catalogue";
            case "questions": return "Checklist Questions Master (46 Parameters)";
            default: return "ALC Master Suite";
        }
    },

    /**
     * Switch Packaging Operations sub-tab
     */
    switchPkgSubTab: function (subTabKey) {
        this.pkgSubTab = subTabKey;
        this.searchFilter = "";
        this.renderCurrentTab();
    },

    getPkgSubTabLabel: function (key) {
        switch (key) {
            case "users": return "Role & User Assignments (QA, Production & HODs)";
            case "products": return "Product Master Catalogue (Line & Category)";
            case "skus": return "SKU / Weight Master";
            default: return "Packaging Operations Master Suite";
        }
    },

    /**
     * Switch Mixing & Baking sub-tab: "users" vs "recipes"
     */
    switchMbSubTab: function (subTabKey) {
        this.mbSubTab = subTabKey;
        this.searchFilter = "";
        this.renderCurrentTab();
    },

    getMbSubTabLabel: function (key) {
        switch (key) {
            case "users": return "Role & User Assignments (QA & Production Executives)";
            case "recipes": return "Product Recipes Master Catalogue (Quality Standards)";
            default: return "Mixing & Baking Master Suite";
        }
    },

    /**
     * Renders content of currently selected tab & active subsection
     */
    renderCurrentTab: function () {
        const mount = document.getElementById("adminTabContentMount");
        if (!mount) return;

        const form = this.FORMS[this.activeTab];
        if (!form) return;

        // Special dedicated view for Top Management Escalation Matrix
        if (this.activeTab === "TopManagement") {
            this.renderTopManagementTab();
            return;
        }

        let rows = this.configs[this.activeTab] || [];

        // Special 6-subtab layout for ALC Master Data Management
        if (this.activeTab === "ALC") {
            const alcSub = this.alcSubTab || "qa-matrix";
            const qCount = rows.filter(r => r.configType === "Checklist Question").length;
            const subnavHtml = `
                <div class="admin-subnav-container">
                    <div class="admin-subnav-tabs">
                        <button type="button" class="admin-subnav-btn ${alcSub === 'qa-matrix' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('qa-matrix')">
                            <span class="subnav-icon"></span>
                            <span>QA Shift Matrix</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${alcSub === 'areas' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('areas')">
                            <span class="subnav-icon"></span>
                            <span>Area Inspectors</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${alcSub === 'lines' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('lines')">
                            <span class="subnav-icon"></span>
                            <span>Line Master</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${alcSub === 'shifts' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('shifts')">
                            <span class="subnav-icon"></span>
                            <span>Shift Master</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${alcSub === 'products' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('products')">
                            <span class="subnav-icon"></span>
                            <span>Product Catalogue</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${alcSub === 'questions' ? 'active' : ''}" onclick="Rajpura_Admin.switchAlcSubTab('questions')">
                            <span class="subnav-icon"></span>
                            <span>Checklist Questions (${qCount})</span>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <button type="button" id="admin-btn-seed-alc" class="admin-btn-secondary" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 5px; font-weight: 600; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; border-radius: 8px; cursor: not-allowed !important; opacity: 0.6; pointer-events: none;" disabled title="Seeding is disabled">
                            Seed Master Data
                        </button>
                    </div>
                </div>
            `;

            let contentHtml = "";
            if (alcSub === "qa-matrix") contentHtml = this.renderAlcQaMatrix(rows);
            else if (alcSub === "areas") contentHtml = this.renderAlcAreaInspectors(rows);
            else if (alcSub === "lines") contentHtml = this.renderAlcLineMaster(rows);
            else if (alcSub === "shifts") contentHtml = this.renderAlcShiftMaster(rows);
            else if (alcSub === "products") contentHtml = this.renderAlcProductCatalogue(rows);
            else if (alcSub === "questions") contentHtml = this.renderAlcQuestions(rows);

            mount.innerHTML = `
                ${subnavHtml}
                ${contentHtml}
            `;
            return;
        }

        // Special 3-subtab layout for Packaging Operations Master Suite
        if (this.activeTab === "PackagingOperations") {
            const pkgSub = this.pkgSubTab || "users";
            const subnavHtml = `
                <div class="admin-subnav-container">
                    <div class="admin-subnav-tabs">
                        <button type="button" class="admin-subnav-btn ${pkgSub === 'users' ? 'active' : ''}" onclick="Rajpura_Admin.switchPkgSubTab('users')">
                            <span class="subnav-icon"></span>
                            <span>Role & User Assignments</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${pkgSub === 'products' ? 'active' : ''}" onclick="Rajpura_Admin.switchPkgSubTab('products')">
                            <span class="subnav-icon"></span>
                            <span>Product Master Catalogue</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${pkgSub === 'skus' ? 'active' : ''}" onclick="Rajpura_Admin.switchPkgSubTab('skus')">
                            <span class="subnav-icon"></span>
                            <span>SKU / Weight Master</span>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" id="admin-btn-seed-pkg" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 5px;" disabled title="Seeding is disabled">
                            Seed Products (1,105)
                        </button>
                    </div>
                </div>
            `;

            let contentHtml = "";
            if (pkgSub === "users") {
                let userRows = rows.filter(r => !["Product Master", "SKU Master", "Line Master", "Shift Master", "Area Inspector"].includes(r.configType));
                if (this.searchFilter.trim() !== "") {
                    const q = this.searchFilter.toLowerCase().trim();
                    userRows = userRows.filter(r => {
                        const titleMatch = (r.title || "").toLowerCase().includes(q);
                        const typeMatch = (r.configType || "").toLowerCase().includes(q);
                        const areaMatch = (r.area || "").toLowerCase().includes(q);
                        const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                        const mgrMatch = (r.escalationManagers || []).some(m => (m.title || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q));
                        const prodMatch = (r.productionIncharges || []).some(p => (p.title || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
                        return titleMatch || typeMatch || areaMatch || userMatch || mgrMatch || prodMatch;
                    });
                }
                contentHtml = this.renderCardsGrid(form, userRows);
            } else if (pkgSub === "products") {
                contentHtml = this.renderPkgProductCatalogue(rows);
                mount.innerHTML = `
                    ${subnavHtml}
                    ${contentHtml}
                `;
                this.updatePkgProductTable(rows);
                return;
            } else if (pkgSub === "skus") {
                contentHtml = this.renderPkgSkuMaster(rows);
            }

            mount.innerHTML = `
                ${subnavHtml}
                ${contentHtml}
            `;
            return;
        }

        // Special 2-subtab layout for Mixing & Baking Master Suite
        if (this.activeTab === "MixingAndBaking") {
            const mbSub = this.mbSubTab || "users";
            const subnavHtml = `
                <div class="admin-subnav-container">
                    <div class="admin-subnav-tabs">
                        <button type="button" class="admin-subnav-btn ${mbSub === 'users' ? 'active' : ''}" onclick="Rajpura_Admin.switchMbSubTab('users')">
                            <span class="subnav-icon"></span>
                            <span>Role & User Assignments</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${mbSub === 'recipes' ? 'active' : ''}" onclick="Rajpura_Admin.switchMbSubTab('recipes')">
                            <span class="subnav-icon"></span>
                            <span>Product Recipes Master Catalogue</span>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button type="button" id="admin-btn-seed-mb" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 5px;" disabled title="Seeding is disabled">
                            Seed Recipes
                        </button>
                    </div>
                </div>
            `;

            let contentHtml = "";
            if (mbSub === "users") {
                let userRows = rows.filter(r => r.configType !== "Product Recipe");
                if (this.searchFilter.trim() !== "") {
                    const q = this.searchFilter.toLowerCase().trim();
                    userRows = userRows.filter(r => {
                        const titleMatch = (r.title || "").toLowerCase().includes(q);
                        const typeMatch = (r.configType || "").toLowerCase().includes(q);
                        const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                        const prodMatch = (r.productionIncharges || []).some(p => (p.title || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
                        return titleMatch || typeMatch || userMatch || prodMatch;
                    });
                }
                contentHtml = this.renderCardsGrid(form, userRows);
            } else if (mbSub === "recipes") {
                contentHtml = this.renderMbRecipeCatalogue(rows);
                mount.innerHTML = `
                    ${subnavHtml}
                    ${contentHtml}
                `;
                this.updateMbRecipeTable(rows);
                return;
            }

            mount.innerHTML = `
                ${subnavHtml}
                ${contentHtml}
            `;
            return;
        }

        // Special 2-subtab layout for CCP, OPRP & Sieves Master Suite
        if (this.activeTab === "CCP_OPRP_Sieves") {
            const ccpSub = this.ccpSubTab || "users";
            const subnavHtml = `
                <div class="admin-subnav-container">
                    <div class="admin-subnav-tabs">
                        <button type="button" class="admin-subnav-btn ${ccpSub === 'users' ? 'active' : ''}" onclick="Rajpura_Admin.switchCcpSubTab('users')">
                            <span class="subnav-icon"></span>
                            <span>Role & User Assignments</span>
                        </button>
                        <button type="button" class="admin-subnav-btn ${ccpSub === 'products' ? 'active' : ''}" onclick="Rajpura_Admin.switchCcpSubTab('products')">
                            <span class="subnav-icon"></span>
                            <span>Product Master Catalogue</span>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" id="admin-btn-seed-ccp" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 5px;" disabled title="Seeding is disabled">
                            Seed Products (13)
                        </button>
                    </div>
                </div>
            `;

            let contentHtml = "";
            if (ccpSub === "users") {
                let userRows = rows.filter(r => r.configType !== "Product Master");
                if (this.searchFilter.trim() !== "") {
                    const q = this.searchFilter.toLowerCase().trim();
                    userRows = userRows.filter(r => {
                        const titleMatch = (r.title || "").toLowerCase().includes(q);
                        const typeMatch = (r.configType || "").toLowerCase().includes(q);
                        const areaMatch = (r.area || "").toLowerCase().includes(q);
                        const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                        const mgrMatch = (r.escalationManagers || []).some(m => (m.title || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q));
                        const prodMatch = (r.productionIncharges || []).some(p => (p.title || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
                        return titleMatch || typeMatch || areaMatch || userMatch || mgrMatch || prodMatch;
                    });
                }
                contentHtml = this.renderCardsGrid(form, userRows);
            } else if (ccpSub === "products") {
                contentHtml = this.renderCcpProductCatalogue(rows);
                mount.innerHTML = `
                    ${subnavHtml}
                    ${contentHtml}
                `;
                this.updateCcpProductTable(rows);
                return;
            }

            mount.innerHTML = `
                ${subnavHtml}
                ${contentHtml}
            `;
            return;
        }

        // Apply search filter if present (for user assignment cards)
        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            rows = rows.filter(r => {
                const titleMatch = (r.title || "").toLowerCase().includes(q);
                const typeMatch = (r.configType || "").toLowerCase().includes(q);
                const areaMatch = (r.area || "").toLowerCase().includes(q);
                const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                const mgrMatch = (r.escalationManagers || []).some(m => (m.title || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q));
                const prodMatch = (r.productionIncharges || []).some(p => (p.title || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
                return titleMatch || typeMatch || areaMatch || userMatch || mgrMatch || prodMatch;
            });
        }

        // For Food Safety, directly render User & Role Assignments without Product Section
        mount.innerHTML = this.renderCardsGrid(form, rows);
    },

    /**
     * ALC Master: QA Shift Assignment Matrix View
     */
    renderAlcQaMatrix: function (rows) {
        let matrixRows = rows.filter(r => r.configType === "QA Assignment" || r.configType === "QA User");
        if (matrixRows.length === 0) {
            matrixRows = rows.filter(r => !["Area Inspector", "Product User", "Product Incharge", "Line Master", "Shift Master", "Product Master"].includes(r.configType));
        }

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            matrixRows = matrixRows.filter(r => {
                const titleMatch = (r.title || "").toLowerCase().includes(q);
                const lineMatch = (r.lineName || "").toLowerCase().includes(q);
                const shiftMatch = (r.shiftCode || "").toLowerCase().includes(q) || (r.shiftName || "").toLowerCase().includes(q);
                const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                const qaShiftMatch = (r.qaShiftExecutives || []).some(qs => (qs.title || "").toLowerCase().includes(q) || (qs.email || "").toLowerCase().includes(q));
                const mgrMatch = (r.escalationManagers || []).some(m => (m.title || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q));
                return titleMatch || lineMatch || shiftMatch || userMatch || qaShiftMatch || mgrMatch;
            });
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> QA Shift Assignment Matrix</h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddAlcQaMatrixModal()">
                            + Add Shift Assignment
                        </button>
                    </div>
                </div>

                <div class="admin-cards-grid-container">
                    ${matrixRows.length > 0 ? `
                        <div class="admin-cards-grid">
                            ${matrixRows.map(r => {
                                const displayLine = (!r.title || r.title === 'Default' || r.title === 'All Lines') ? 'Default (All Lines)' : r.title;
                                const displayShift = (!r.shiftCode || r.shiftCode === 'Default' || r.shiftCode === 'All Shifts') ? 'Default (All Shifts)' : (r.shiftCode.startsWith('Shift ') ? r.shiftCode : `Shift ${r.shiftCode}`);
                                return `
                                <div class="admin-role-card ${r.isActive === false ? 'is-inactive' : ''}">
                                    <div class="admin-card-header">
                                        <div class="admin-card-header-left">
                                            <div class="admin-card-title-row">
                                                <h4 class="admin-card-title">${this.escapeHtml(displayLine)}</h4>
                                                <span class="admin-line-badge" style="font-size: 12px;"> ${this.escapeHtml(displayShift)}</span>
                                                <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('ALC', ${r.id})" title="Click to toggle active status">
                                                    &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="admin-card-header-right">
                                            <button type="button" class="admin-btn-manage-users" onclick="Rajpura_Admin.openEditAlcQaMatrixModal(${r.id})">
                                                Edit Assignment
                                            </button>
                                        </div>
                                    </div>
                                    <div class="admin-card-body">
                                        <div class="admin-card-section">
                                            <div class="admin-card-section-header">
                                                <div class="admin-card-section-title">
                                                    <span class="role-icon"></span>
                                                    <span>Assigned QA Executives / Operators</span>
                                                    <span class="admin-count-pill">${(r.assignedUsers || []).length}</span>
                                                </div>
                                            </div>
                                            <div class="admin-users-list">
                                                ${(r.assignedUsers && r.assignedUsers.length > 0) ? r.assignedUsers.map(u => `
                                                    <span class="admin-user-chip qa" title="${this.escapeHtml(u.email || u.title)}">
                                                        <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                                                        <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                                                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('ALC', ${r.id}, 'assignedUsers', ${u.id})" title="Remove QA user">&times;</button>
                                                    </span>
                                                `).join("") : `<span class="admin-no-users">No QA Executives assigned</span>`}
                                            </div>
                                        </div>
                                        <div class="admin-card-section has-divider">
                                            <div class="admin-card-section-header">
                                                <div class="admin-card-section-title">
                                                    <span class="role-icon"></span>
                                                    <span>QA Shift Executives</span>
                                                    <span class="admin-count-pill">${(r.qaShiftExecutives || []).length}</span>
                                                </div>
                                            </div>
                                            <div class="admin-users-list">
                                                ${(r.qaShiftExecutives && r.qaShiftExecutives.length > 0) ? r.qaShiftExecutives.map(u => `
                                                    <span class="admin-user-chip qa-shift" title="${this.escapeHtml(u.email || u.title)}" style="background: #ede9fe; color: #6d28d9; border-color: #ddd6fe;">
                                                        <span class="admin-user-avatar" style="background: #7c3aed; color: #ffffff;">${this.getInitials(u.title)}</span>
                                                        <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                                                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('ALC', ${r.id}, 'qaShiftExecutives', ${u.id})" title="Remove QA shift executive">&times;</button>
                                                    </span>
                                                `).join("") : `<span class="admin-no-users">No QA Shift Executives assigned</span>`}
                                            </div>
                                        </div>
                                        <div class="admin-card-section has-divider">
                                            <div class="admin-card-section-header">
                                                <div class="admin-card-section-title">
                                                    <span class="role-icon"></span>
                                                    <span>5-Minute Escalation Managers</span>
                                                    <span class="admin-count-pill">${(r.escalationManagers || []).length}</span>
                                                </div>
                                            </div>
                                            <div class="admin-users-list">
                                                ${(r.escalationManagers && r.escalationManagers.length > 0) ? r.escalationManagers.map(m => `
                                                    <span class="admin-user-chip mgr" title="${this.escapeHtml(m.email || m.title)}" style="background: #fef3c7; color: #92400e; border-color: #fde68a;">
                                                        <span class="admin-user-avatar" style="background: #d97706; color: #ffffff;">${this.getInitials(m.title)}</span>
                                                        <span class="admin-user-name">${this.escapeHtml(m.title)}</span>
                                                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('ALC', ${r.id}, 'escalationManagers', ${m.id})" title="Remove manager">&times;</button>
                                                    </span>
                                                `).join("") : `<span class="admin-no-users">No escalation manager configured</span>`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="admin-empty-state">
                            <span class="admin-empty-icon"></span>
                            <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No QA Shift Matrix Rows Found</div>
                            <div style="font-size: 13px; color: #64748b;">Click "+ Add Shift Assignment" to define a Line & Shift QA assignment rule.</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * ALC Master: Area Inspector Assignment (7 Areas) View
     */
    renderAlcAreaInspectors: function (rows) {
        let areaRows = rows.filter(r => r.configType === "Area Inspector" || r.configType === "Product User" || r.configType === "Product Incharge");

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            areaRows = areaRows.filter(r => {
                const titleMatch = (r.title || "").toLowerCase().includes(q);
                const areaMatch = (r.area || "").toLowerCase().includes(q);
                const userMatch = (r.assignedUsers || []).some(u => (u.title || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
                const mgrMatch = (r.escalationManagers || []).some(m => (m.title || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q));
                return titleMatch || areaMatch || userMatch || mgrMatch;
            });
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Area Inspector Assignment (7 Factory Areas)</h3>
                    </div>
                </div>

                <div class="admin-cards-grid-container">
                    ${areaRows.length > 0 ? `
                        <div class="admin-cards-grid">
                            ${areaRows.map(r => `
                                <div class="admin-role-card">
                                    <div class="admin-card-header">
                                        <div class="admin-card-header-left">
                                            <div class="admin-card-title-row">
                                                <h4 class="admin-card-title">${this.escapeHtml(r.title || 'AREA')} &bull; ${this.escapeHtml(r.area || r.title)}</h4>
                                                <span class="admin-status-pill active">&bull; Active</span>
                                            </div>
                                        </div>
                                        <div class="admin-card-header-right">
                                            <button type="button" class="admin-btn-manage-users" onclick="Rajpura_Admin.openEditAlcAreaModal(${r.id})">
                                                Edit Inspectors
                                            </button>
                                        </div>
                                    </div>
                                    <div class="admin-card-body">
                                        <div class="admin-card-section">
                                            <div class="admin-card-section-header">
                                                <div class="admin-card-section-title">
                                                    <span class="role-icon"></span>
                                                    <span>Assigned Area Incharges / Inspectors</span>
                                                    <span class="admin-count-pill">${(r.assignedUsers || []).length}</span>
                                                </div>
                                            </div>
                                            <div class="admin-users-list">
                                                ${(r.assignedUsers && r.assignedUsers.length > 0) ? r.assignedUsers.map(u => `
                                                    <span class="admin-user-chip prod" title="${this.escapeHtml(u.email || u.title)}" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">
                                                        <span class="admin-user-avatar" style="background: #059669; color: #ffffff;">${this.getInitials(u.title)}</span>
                                                        <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                                                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('ALC', ${r.id}, 'assignedUsers', ${u.id})" title="Remove inspector">&times;</button>
                                                    </span>
                                                `).join("") : `<span class="admin-no-users">No inspectors assigned</span>`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    ` : `
                        <div class="admin-empty-state">
                            <span class="admin-empty-icon"></span>
                            <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No Area Inspector Rows Found</div>
                            <div style="font-size: 13px; color: #64748b;">Area inspector configurations will synchronize from server.</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * ALC Master: Production Line Master (8 Lines) View
     */
    renderAlcLineMaster: function (rows) {
        let lineRows = rows.filter(r => r.configType === "Line Master");

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            lineRows = lineRows.filter(r => (r.title || "").toLowerCase().includes(q) || (r.lineName || "").toLowerCase().includes(q));
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Production Line Master (8 Lines)</h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddAlcLineModal()">
                            + Add Line
                        </button>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Line Number</th>
                                <th style="width: 25%;">Machine / Line Name</th>
                                <th style="width: 30%;">Full Line Name</th>
                                <th style="width: 10%;">Status</th>
                                <th style="width: 10%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lineRows.length > 0 ? lineRows.map(r => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${this.escapeHtml(r.title)}</div>
                                    </td>
                                    <td>
                                        <span class="admin-sku-tag" style="font-size: 13px; font-weight: 600; color: #1e40af;">${this.escapeHtml(r.lineName || "HAAS")}</span>
                                    </td>
                                    <td>
                                        <span style="font-weight: 600; color: #1e3a8a; background: #eff6ff; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe; font-size: 13px;">
                                            ${this.escapeHtml(r.title)}${r.lineName ? ` - ${this.escapeHtml(r.lineName)}` : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('ALC', ${r.id})" title="Click to toggle status">
                                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="admin-product-actions">
                                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditAlcLineModal(${r.id})" title="Edit Line">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="5" style="text-align: center; padding: 32px; color: #64748b;">
                                        No production lines found. Click "+ Add Line" to add one.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * ALC Master: Shift Master (4 Shifts) View
     */
    renderAlcShiftMaster: function (rows) {
        let shiftRows = rows.filter(r => r.configType === "Shift Master");

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            shiftRows = shiftRows.filter(r => (r.shiftCode || "").toLowerCase().includes(q) || (r.shiftName || "").toLowerCase().includes(q) || (r.title || "").toLowerCase().includes(q) || (r.shiftStart || "").toLowerCase().includes(q) || (r.shiftEnd || "").toLowerCase().includes(q));
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Shift Master (4 Operating Shifts)</h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddAlcShiftModal()">
                            + Add Shift
                        </button>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 15%;">Shift Code</th>
                                <th style="width: 20%;">Shift Name</th>
                                <th style="width: 25%;">Operating Window</th>
                                <th style="width: 28%;">Shift Specification</th>
                                <th style="width: 12%;">Status</th>
                                <th style="width: 10%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shiftRows.length > 0 ? shiftRows.map(r => `
                                <tr>
                                    <td>
                                        <span class="admin-sku-tag" style="font-size: 13px; font-weight: 700; color: #0284c7;">Shift ${this.escapeHtml(r.shiftCode || r.title)}</span>
                                    </td>
                                    <td>
                                        <strong style="color: #0f172a; font-size: 13.5px;">${this.escapeHtml(r.shiftName || "Morning")}</strong>
                                    </td>
                                    <td>
                                        <span style="color: #475569; font-weight: 500;"> ${this.escapeHtml(r.shiftStart || "6:00 A.M.")} &ndash; ${this.escapeHtml(r.shiftEnd || "2:00 P.M.")}</span>
                                    </td>
                                    <td>
                                        <span style="font-weight: 600; color: #1e3a8a; background: #eff6ff; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe; font-size: 12.5px;">
                                            Shift ${this.escapeHtml(r.shiftCode || "")} - ${this.escapeHtml(r.shiftName || "")} (${this.escapeHtml(r.shiftStart || "")} - ${this.escapeHtml(r.shiftEnd || "")})
                                        </span>
                                    </td>
                                    <td>
                                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('ALC', ${r.id})" title="Click to toggle status">
                                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="admin-product-actions">
                                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditAlcShiftModal(${r.id})" title="Edit Shift">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 32px; color: #64748b;">
                                        No shifts configured. Click "+ Add Shift" to create one.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * ALC Master: Changeover Product Catalogue View
     */
    renderAlcProductCatalogue: function (rows) {
        let prodRows = rows.filter(r => r.configType === "Product Master");

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            prodRows = prodRows.filter(r => (r.title || "").toLowerCase().includes(q) || (r.productCode || "").toLowerCase().includes(q) || (r.productCategory || "").toLowerCase().includes(q));
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Changeover Product Catalogue</h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddAlcProductModal()">
                            + Add Product
                        </button>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 45%;">Product Name & Variety</th>
                                <th style="width: 30%;">Product Code / SKU</th>
                                <th style="width: 12%;">Status</th>
                                <th style="width: 13%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prodRows.length > 0 ? prodRows.map(r => `
                                <tr>
                                    <td>
                                        <div class="admin-product-name-cell">
                                            <div class="product-avatar"></div>
                                            <div>
                                                <div class="product-name">${this.escapeHtml(r.title)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="admin-sku-tag" style="font-size: 13px; font-weight: 600;">${this.escapeHtml(r.productCode || "PRD-001")}</span>
                                    </td>
                                    <td>
                                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('ALC', ${r.id})" title="Click to toggle status">
                                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="admin-product-actions">
                                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditAlcProductModal(${r.id})" title="Edit Product">
                                                Edit
                                            </button>
                                            <button type="button" class="admin-btn-action" style="color: #dc2626;" onclick="Rajpura_Admin.confirmDeleteRow('ALC', ${r.id})" title="Delete Product">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="4" style="text-align: center; padding: 32px; color: #64748b;">
                                        No changeover products found. Click "+ Add Product" to add one.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * ALC: 46 Checklist Questions Master View & Critical Gate Configuration
     */
    renderAlcQuestions: function (rows) {
        // Strictly only show real items retrieved from SharePoint list
        const allQuestions = (rows || this.configs.ALC || []).filter(r => {
            const cfg = (r.configType || r.ConfigType || "").toLowerCase();
            return cfg === "checklist question" && r.id > 0;
        });

        const syncedCount = allQuestions.length;
        const totalQuestions = allQuestions.length;
        const criticalCount = allQuestions.filter(r => r.isCritical).length;
        const standardCount = totalQuestions - criticalCount;

        const st = this.alcQuestionState;
        let filtered = [...allQuestions];

        // 1. Area Filter
        if (st.areaFilter && st.areaFilter !== "ALL") {
            filtered = filtered.filter(r => (r.area || "").toLowerCase() === st.areaFilter.toLowerCase());
        }

        // 2. Critical Gate Filter
        if (st.criticalFilter && st.criticalFilter !== "ALL") {
            if (st.criticalFilter === "CRITICAL") {
                filtered = filtered.filter(r => !!r.isCritical);
            } else if (st.criticalFilter === "STANDARD") {
                filtered = filtered.filter(r => !r.isCritical);
            }
        }

        // 3. Status Filter
        if (st.statusFilter && st.statusFilter !== "ALL") {
            if (st.statusFilter === "ACTIVE") {
                filtered = filtered.filter(r => r.isActive !== false);
            } else if (st.statusFilter === "INACTIVE") {
                filtered = filtered.filter(r => r.isActive === false);
            }
        }

        // 4. Search Filter
        const query = (st.searchTerm || this.searchFilter || "").toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(r => 
                (r.title || "").toLowerCase().includes(query) ||
                (r.area || "").toLowerCase().includes(query) ||
                String(r.sequence || "").includes(query) ||
                (r.isCritical ? "critical gate" : "standard").includes(query)
            );
        }

        // Sort by sequence number ascending
        filtered.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        // Distinct areas
        const distinctAreas = [
            "RM Store Area (Wheat Flour Handling)",
            "Flour & Sugar Handling",
            "Chemical Handling Area",
            "Mixing",
            "Oven",
            "Post Bake & Packing Section",
            "Biscuit Grinding"
        ];
        allQuestions.forEach(q => {
            if (q.area && !distinctAreas.includes(q.area)) distinctAreas.push(q.area);
        });

        const areaOptionsHtml = distinctAreas.map(a => 
            `<option value="${this.escapeHtml(a)}" ${st.areaFilter === a ? 'selected' : ''}>${this.escapeHtml(a)}</option>`
        ).join("");

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header" style="flex-wrap: wrap; gap: 12px;">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> ALC Checklist Questions Master (46 Parameters)</h3>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
                            Define checklist questions and toggle <strong>Critical Gate</strong> rules. Any non-compliant/partial critical question fails the tour.
                        </p>
                    </div>
                    <div class="admin-panel-actions" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <div class="admin-critical-stat-pill">
                            <span>Total: <strong>${totalQuestions}</strong></span>
                            <span>&bull;</span>
                            <span class="critical-count">Critical Gate: <strong>${criticalCount}</strong></span>
                            <span>&bull;</span>
                            <span class="standard-count">Standard: <strong>${standardCount}</strong></span>
                        </div>
                        <button type="button" id="btn-sync-alc-questions" class="admin-btn-sync-questions" style="border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none;" disabled title="Syncing questions is disabled">
                            <span style="font-size: 14px;">🔄</span>
                            <span>Sync 46 Questions to SharePoint List</span>
                        </button>
                    </div>
                </div>

                <!-- Sync Status Banner -->
                ${syncedCount === 0 ? `
                    <div style="margin: 0 20px 14px 20px; padding: 14px 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;">
                        <div>
                            <div style="font-weight: 700; color: #1e40af; font-size: 13.5px; margin-bottom: 2px;">
                                No Questions in SharePoint List
                            </div>
                            <div style="font-size: 13px; color: #2563eb;">
                                Checklist questions have not been added to <code>Quality-Rajpura-ALC</code> list yet. Click <strong>Sync 46 Questions to SharePoint List</strong> to populate all 46 parameters.
                            </div>
                        </div>
                        <button type="button" class="admin-btn-sync-questions" style="font-size: 12px; padding: 6px 14px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none;" disabled title="Syncing questions is disabled">
                            Sync 46 Questions Now
                        </button>
                    </div>
                ` : `
                    <div style="margin: 0 20px 14px 20px; padding: 10px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                        <div style="font-size: 13px; color: #065f46;">
                            ✓ <strong>${syncedCount} Questions Synced from SharePoint:</strong> Maintained live in <code>Quality-Rajpura-ALC</code> list. Criticality toggles update live.
                        </div>
                        ${syncedCount < 46 ? `
                            <button type="button" class="admin-btn-sync-questions" style="font-size: 12px; padding: 5px 14px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none;" disabled title="Syncing questions is disabled">
                                Sync Remaining Questions
                            </button>
                        ` : ''}
                    </div>
                `}

                <!-- Filters Bar -->
                <div class="admin-filters-bar" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="flex: 1; min-width: 220px;">
                        <input type="text" class="admin-search-input" style="width: 100%;" placeholder="Search question description, area, seq..." value="${this.escapeHtml(st.searchTerm || this.searchFilter || '')}" oninput="Rajpura_Admin.onAlcQuestionSearchInput(this.value)" />
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <select class="admin-filter-select" id="alc-q-filter-area" onchange="Rajpura_Admin.onAlcQuestionAreaChange(this.value)" style="min-width: 180px;">
                            <option value="ALL" ${st.areaFilter === 'ALL' ? 'selected' : ''}>All Areas (${distinctAreas.length})</option>
                            ${areaOptionsHtml}
                        </select>
                        <select class="admin-filter-select" id="alc-q-filter-critical" onchange="Rajpura_Admin.onAlcQuestionCriticalChange(this.value)" style="min-width: 150px;">
                            <option value="ALL" ${st.criticalFilter === 'ALL' ? 'selected' : ''}>All Gate Types</option>
                            <option value="CRITICAL" ${st.criticalFilter === 'CRITICAL' ? 'selected' : ''}>Critical Gate (${criticalCount})</option>
                            <option value="STANDARD" ${st.criticalFilter === 'STANDARD' ? 'selected' : ''}>Standard (${standardCount})</option>
                        </select>
                        <select class="admin-filter-select" id="alc-q-filter-status" onchange="Rajpura_Admin.onAlcQuestionStatusChange(this.value)" style="min-width: 120px;">
                            <option value="ALL" ${st.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                            <option value="ACTIVE" ${st.statusFilter === 'ACTIVE' ? 'selected' : ''}>Active</option>
                            <option value="INACTIVE" ${st.statusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                        </select>
                        <button type="button" class="admin-btn-reset-filters" onclick="Rajpura_Admin.resetAlcQuestionFilters()" title="Reset all filters">
                            Reset
                        </button>
                    </div>
                </div>

                <!-- Questions Table -->
                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 6%; text-align: center;">Seq #</th>
                                <th style="width: 22%;">Area / Department</th>
                                <th style="width: 46%;">Checklist Question Description</th>
                                <th style="width: 14%; text-align: center;">Gate Type</th>
                                <th style="width: 6%; text-align: center;">Status</th>
                                <th style="width: 6%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length > 0 ? filtered.map(r => `
                                <tr>
                                    <td style="text-align: center;">
                                        <span class="admin-alc-seq-badge">${r.sequence || '-'}</span>
                                    </td>
                                    <td>
                                        <span class="admin-alc-area-tag">${this.escapeHtml(r.area || "General")}</span>
                                    </td>
                                    <td>
                                        <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; line-height: 1.4;">
                                            ${this.escapeHtml(r.title)}
                                        </div>
                                    </td>
                                    <td style="text-align: center;">
                                        ${r.isCritical ? `
                                            <button type="button" class="admin-critical-badge critical" onclick="Rajpura_Admin.toggleAlcQuestionCritical(${r.id}, ${r.sequence})" title="Click to toggle to Standard parameter">
                                                <span>&#9888;</span>
                                                <span>Critical Gate</span>
                                            </button>
                                        ` : `
                                            <button type="button" class="admin-critical-badge standard" onclick="Rajpura_Admin.toggleAlcQuestionCritical(${r.id}, ${r.sequence})" title="Click to toggle to Critical Gate (tour fails if non-compliant)">
                                                <span>&#10003;</span>
                                                <span>Standard</span>
                                            </button>
                                        `}
                                    </td>
                                    <td style="text-align: center;">
                                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleAlcQuestionActive(${r.id}, ${r.sequence})" title="Click to toggle active status">
                                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="admin-product-actions">
                                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditAlcQuestionModal(${r.id}, ${r.sequence})" title="Edit Question Details">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 48px 20px; color: #64748b;">
                                        <div style="font-size: 32px; margin-bottom: 10px;">📋</div>
                                        <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 6px;">
                                            ${totalQuestions === 0 ? "No Checklist Questions in SharePoint List" : "No checklist questions found matching your filter criteria"}
                                        </div>
                                        ${totalQuestions === 0 ? `
                                            <div style="font-size: 13px; color: #64748b; max-width: 520px; margin: 0 auto 16px auto; line-height: 1.5;">
                                                Checklist questions have not been added to <code>Quality-Rajpura-ALC</code> list yet. Click the sync button below to add all 46 standard parameters.
                                            </div>
                                            <button type="button" class="admin-btn-sync-questions" style="border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none;" disabled title="Syncing questions is disabled">
                                                <span>🔄</span>
                                                <span>Sync 46 Questions to SharePoint List</span>
                                            </button>
                                        ` : `
                                            <div style="font-size: 13px; color: #64748b;">Try adjusting your search or filter options.</div>
                                        `}
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    onAlcQuestionAreaChange: function (val) {
        this.alcQuestionState.areaFilter = val;
        this.renderCurrentTab();
    },

    onAlcQuestionCriticalChange: function (val) {
        this.alcQuestionState.criticalFilter = val;
        this.renderCurrentTab();
    },

    onAlcQuestionStatusChange: function (val) {
        this.alcQuestionState.statusFilter = val;
        this.renderCurrentTab();
    },

    onAlcQuestionSearchInput: function (val) {
        this.alcQuestionState.searchTerm = val;
        this.searchFilter = val;
        this.renderCurrentTab();
    },

    resetAlcQuestionFilters: function () {
        this.alcQuestionState = {
            areaFilter: "ALL",
            criticalFilter: "ALL",
            statusFilter: "ALL",
            searchTerm: ""
        };
        this.searchFilter = "";
        this.renderCurrentTab();
    },

    /**
     * Sync and bulk-insert all 46 standard checklist questions into Quality-Rajpura-ALC SharePoint list
     */
    syncAlcQuestionsToSharePoint: async function () {
        console.warn("Syncing ALC questions functionality is disabled in the admin panel.");
        this.showToast("Syncing checklist questions is currently disabled.", "warning");
        return;
    },

    toggleAlcQuestionCritical: async function (rowId, sequence) {
        let rows = this.configs.ALC || [];
        let row = rows.find(r => r.id === rowId);

        // If not yet in SharePoint, find in defaults
        if (!row) {
            const seq = sequence || (rowId < 0 ? Math.abs(rowId) - 1000 : 0);
            const def = (this.DEFAULT_ALC_QUESTIONS || []).find(d => d.sequence === seq);
            if (def) {
                row = {
                    id: rowId,
                    title: def.title,
                    configType: "Checklist Question",
                    area: def.area,
                    sequence: def.sequence,
                    isCritical: def.isCritical,
                    isActive: true
                };
            }
        }

        if (!row) return;

        const newCritical = !row.isCritical;
        row.isCritical = newCritical;
        row.productCategory = newCritical ? "Critical" : "Standard";

        const seqNum = row.sequence || sequence || 1;
        const cleanTitle = (row.title || "").replace(/^\d+[\.\:\-\s]+/, "").replace(/\[critical(?:\s*gate)?\]\s*/i, "").trim();
        const formattedTitle = `${seqNum}. ${newCritical ? '[CRITICAL] ' : ''}${cleanTitle}`;

        const payload = {
            Title: formattedTitle,
            ConfigType: "Checklist Question",
            Area: row.area || "",
            ShiftCode: String(seqNum),
            ProductCode: String(seqNum),
            Sequence: seqNum,
            ProductCategory: newCritical ? "Critical" : "Standard",
            IsCritical: newCritical,
            Remarks: newCritical ? "Critical" : "",
            Plant: "Rajpura",
            Region: "North",
            IsActive: row.isActive !== false
        };

        const targetId = (row.id && row.id > 0) ? row.id : null;
        const success = await this.persistItemToSharePoint("ALC", targetId, payload);
        if (success) {
            this.showToast(`Question #${seqNum} set to ${newCritical ? 'CRITICAL GATE' : 'STANDARD'}`, "success");
            await this.loadSingleFormConfig("ALC");
            this.renderCurrentTab();
        } else {
            this.showToast(`Failed to update Criticality in SharePoint`, "error");
        }
    },

    toggleAlcQuestionActive: async function (rowId, sequence) {
        let rows = this.configs.ALC || [];
        let row = rows.find(r => r.id === rowId);

        if (!row) {
            const seq = sequence || (rowId < 0 ? Math.abs(rowId) - 1000 : 0);
            const def = (this.DEFAULT_ALC_QUESTIONS || []).find(d => d.sequence === seq);
            if (def) {
                row = {
                    id: rowId,
                    title: def.title,
                    configType: "Checklist Question",
                    area: def.area,
                    sequence: def.sequence,
                    isCritical: def.isCritical,
                    isActive: true
                };
            }
        }

        if (!row) return;

        const newActive = row.isActive === false ? true : false;
        row.isActive = newActive;

        const payload = {
            Title: row.title,
            ConfigType: "Checklist Question",
            Area: row.area || "",
            ShiftCode: String(row.sequence || ""),
            ProductCode: String(row.sequence || ""),
            Sequence: row.sequence || 0,
            ProductCategory: row.isCritical ? "Critical" : "Standard",
            IsCritical: !!row.isCritical,
            Remarks: row.isCritical ? "Critical" : "",
            Plant: "Rajpura",
            IsActive: newActive
        };

        const targetId = (row.id && row.id > 0) ? row.id : null;
        const success = await this.persistItemToSharePoint("ALC", targetId, payload);
        if (success) {
            this.showToast(`Question #${row.sequence || ''} status set to ${newActive ? 'Active' : 'Inactive'}`, "success");
            await this.loadSingleFormConfig("ALC");
            this.renderCurrentTab();
        }
    },

    openEditAlcQuestionModal: function (rowId, sequence) {
        let row = (this.configs.ALC || []).find(r => r.id === rowId);
        if (!row) {
            const seq = sequence || (rowId < 0 ? Math.abs(rowId) - 1000 : 0);
            const def = (this.DEFAULT_ALC_QUESTIONS || []).find(d => d.sequence === seq);
            if (def) {
                row = {
                    id: rowId,
                    title: def.title,
                    configType: "Checklist Question",
                    area: def.area,
                    sequence: def.sequence,
                    isCritical: def.isCritical,
                    isActive: true
                };
            }
        }
        if (!row) return;

        const distinctAreas = [
            "RM Store Area (Wheat Flour Handling)",
            "Flour & Sugar Handling",
            "Chemical Handling Area",
            "Mixing",
            "Oven",
            "Post Bake & Packing Section",
            "Biscuit Grinding"
        ];
        if (row.area && !distinctAreas.includes(row.area)) distinctAreas.push(row.area);

        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card" style="max-width: 580px;">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit Question #${row.sequence || ''} &bull; ALC Master</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Seq #</label>
                                <input type="number" id="modal-alc-q-seq" class="admin-form-input" value="${row.sequence || 1}" readonly style="background: #f1f5f9; cursor: not-allowed;" />
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">Factory Area / Department <span style="color: #dc2626;">*</span></label>
                                <select id="modal-alc-q-area" class="admin-form-input">
                                    ${distinctAreas.map(a => `<option value="${this.escapeHtml(a)}" ${row.area === a ? 'selected' : ''}>${this.escapeHtml(a)}</option>`).join("")}
                                </select>
                            </div>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Checklist Question / Parameter Description <span style="color: #dc2626;">*</span></label>
                            <textarea id="modal-alc-q-title" class="admin-form-input" rows="3">${this.escapeHtml(row.title)}</textarea>
                        </div>
                        <div class="admin-form-group" style="background: ${row.isCritical ? '#fef2f2' : '#f8fafc'}; border: 1px solid ${row.isCritical ? '#fca5a5' : '#e2e8f0'}; padding: 12px; border-radius: 8px; margin-top: 8px;">
                            <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin: 0;">
                                <input type="checkbox" id="modal-alc-q-critical" ${row.isCritical ? 'checked' : ''} style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer;" />
                                <div>
                                    <div style="font-weight: 700; color: #991b1b; font-size: 13.5px;">Mark as Critical Gate Parameter</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                                        If non-compliant or partial during tour inspection, the tour will automatically be evaluated and recorded as Failed regardless of overall score.
                                    </div>
                                </div>
                            </label>
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                            <input type="checkbox" id="modal-alc-q-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-alc-q-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active (Visible in ALC tour checklist)</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-alc-q" onclick="Rajpura_Admin.saveAlcQuestion(${row.id}, ${row.sequence})">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    saveAlcQuestion: async function (rowId, sequence) {
        const seqVal = document.getElementById("modal-alc-q-seq")?.value;
        const areaVal = document.getElementById("modal-alc-q-area")?.value;
        const titleVal = document.getElementById("modal-alc-q-title")?.value.trim();
        const isCriticalVal = document.getElementById("modal-alc-q-critical")?.checked;
        const isActiveVal = document.getElementById("modal-alc-q-active")?.checked;

        if (!titleVal) {
            alert("Please enter a Question Description.");
            return;
        }

        const btn = document.getElementById("btn-save-alc-q");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const sequenceNum = parseInt(seqVal, 10) || sequence || 1;
        const cleanTitle = (titleVal || "").replace(/^\d+[\.\:\-\s]+/, "").replace(/\[critical(?:\s*gate)?\]\s*/i, "").trim();
        const formattedTitle = `${sequenceNum}. ${isCriticalVal ? '[CRITICAL] ' : ''}${cleanTitle}`;

        const payload = {
            Title: formattedTitle,
            ConfigType: "Checklist Question",
            Area: areaVal || "General",
            ShiftCode: String(sequenceNum),
            ProductCode: String(sequenceNum),
            Sequence: sequenceNum,
            ProductCategory: isCriticalVal ? "Critical" : "Standard",
            IsCritical: isCriticalVal,
            Remarks: isCriticalVal ? "Critical" : "",
            Plant: "Rajpura",
            Region: "North",
            IsActive: isActiveVal !== false
        };

        const targetId = (rowId && rowId > 0) ? rowId : null;
        const success = await this.persistItemToSharePoint("ALC", targetId, payload);
        if (success) {
            this.showToast(`Question #${sequenceNum} saved successfully`, "success");
            this.closeModal();
            await this.loadSingleFormConfig("ALC");
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Changes";
            btn.disabled = false;
        }
    },

    /**
     * Packaging Operations: Product Master Catalogue View (High-Performance Paginated + Dynamic Filters)
     */
    renderPkgProductCatalogue: function (rows) {
        const allProducts = (rows || this.configs.PackagingOperations || []).filter(r => r.configType === "Product Master");
        const distinctLines = this.getPkgDistinctLines(allProducts);
        const distinctCategories = this.getPkgDistinctCategories(allProducts);
        const st = this.pkgProductState;

        const lineOptionsHtml = distinctLines.map(l => 
            `<option value="${this.escapeHtml(l.value)}" ${st.lineFilter === l.value ? 'selected' : ''}>${this.escapeHtml(l.label)}</option>`
        ).join("");

        const catOptionsHtml = distinctCategories.map(c => 
            `<option value="${this.escapeHtml(c.value)}" ${st.categoryFilter === c.value ? 'selected' : ''}>${this.escapeHtml(c.label)}</option>`
        ).join("");

        return `
            <div class="admin-panel-card" id="pkg-product-catalogue-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Product Master Catalogue <span class="admin-badge" id="pkg-product-counter-badge" style="font-size: 13px; font-weight: 600; color: #7c3aed; background: #f5f3ff; padding: 2px 10px; border-radius: 12px; border: 1px solid #ddd6fe; margin-left: 8px;">${allProducts.length} items</span></h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" id="admin-btn-seed-pkg-inline" class="admin-btn-secondary" style="font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 6px;" disabled title="Seeding is disabled">
                            Seed Products (1,105)
                        </button>
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddPkgProductModal()">
                            + Add Product
                        </button>
                    </div>
                </div>

                <!-- Dynamic Multi-Criteria Filter Bar -->
                <div class="admin-dynamic-filter-bar">
                    <div class="admin-filter-group">
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Line:</span>
                            <select class="admin-filter-select" id="pkg-filter-line" onchange="Rajpura_Admin.onPkgLineFilterChange(this.value)">
                                ${lineOptionsHtml}
                            </select>
                        </div>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Category:</span>
                            <select class="admin-filter-select" id="pkg-filter-category" onchange="Rajpura_Admin.onPkgCategoryFilterChange(this.value)">
                                ${catOptionsHtml}
                            </select>
                        </div>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Status:</span>
                            <select class="admin-filter-select" id="pkg-filter-status" onchange="Rajpura_Admin.onPkgStatusFilterChange(this.value)" style="min-width: 110px;">
                                <option value="ALL" ${st.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                                <option value="ACTIVE" ${st.statusFilter === 'ACTIVE' ? 'selected' : ''}>Active Only</option>
                                <option value="INACTIVE" ${st.statusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="admin-filter-group">
                        <button type="button" class="admin-btn-reset-filters" onclick="Rajpura_Admin.resetPkgFilters()" title="Reset all filters">
                            Reset Filters
                        </button>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Rows per page:</span>
                            <select class="admin-page-size-select" id="pkg-page-size" onchange="Rajpura_Admin.onPkgPageSizeChange(this.value)">
                                <option value="25" ${st.pageSize === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${st.pageSize === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${st.pageSize === 100 ? 'selected' : ''}>100</option>
                                <option value="250" ${st.pageSize === 250 ? 'selected' : ''}>250</option>
                                <option value="9999" ${st.pageSize === 9999 ? 'selected' : ''}>All</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 32%;" class="admin-sortable-th ${st.sortBy === 'title' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onPkgSortChange('title')">
                                    Product Name & Description <span class="admin-sort-indicator">${st.sortBy === 'title' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 16%;" class="admin-sortable-th ${st.sortBy === 'productCode' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onPkgSortChange('productCode')">
                                    Product Code / SKU <span class="admin-sort-indicator">${st.sortBy === 'productCode' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 16%;" class="admin-sortable-th ${st.sortBy === 'lineName' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onPkgSortChange('lineName')">
                                    Associated Line <span class="admin-sort-indicator">${st.sortBy === 'lineName' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 14%;" class="admin-sortable-th ${st.sortBy === 'productCategory' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onPkgSortChange('productCategory')">
                                    Category <span class="admin-sort-indicator">${st.sortBy === 'productCategory' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 10%; text-align: center;" class="admin-sortable-th ${st.sortBy === 'isActive' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onPkgSortChange('isActive')">
                                    Status <span class="admin-sort-indicator">${st.sortBy === 'isActive' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 12%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="pkg-product-table-mount">
                            <!-- Dynamic 25-Row Paginated Slice Mounted Here -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Footer -->
                <div id="pkg-pagination-mount">
                    <!-- Pagination Controls Mounted Here -->
                </div>
            </div>
        `;
    },

    getPkgDistinctLines: function (products) {
        const counts = {};
        let total = 0;
        (products || []).forEach(p => {
            const line = (p.lineName && p.lineName.trim()) ? p.lineName.trim() : "All Lines";
            counts[line] = (counts[line] || 0) + 1;
            total++;
        });
        const lines = Object.keys(counts).sort((a, b) => {
            if (a === "All Lines") return -1;
            if (b === "All Lines") return 1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        const result = [{ value: "ALL", label: `All Lines (${total})` }];
        lines.forEach(l => {
            result.push({ value: l, label: `${l} (${counts[l]})` });
        });
        return result;
    },

    getPkgDistinctCategories: function (products) {
        const counts = {};
        let total = 0;
        (products || []).forEach(p => {
            const cat = (p.productCategory && p.productCategory.trim()) ? p.productCategory.trim() : "General";
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });
        const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
        const result = [{ value: "ALL", label: `All Categories (${total})` }];
        categories.forEach(c => {
            result.push({ value: c, label: `${c} (${counts[c]})` });
        });
        return result;
    },

    getFilteredPkgProducts: function (allRows) {
        const products = (allRows || this.configs.PackagingOperations || []).filter(r => r.configType === "Product Master");
        const st = this.pkgProductState;
        const search = (st.searchTerm || "").toLowerCase().trim();
        const line = st.lineFilter || "ALL";
        const cat = st.categoryFilter || "ALL";
        const status = st.statusFilter || "ALL";

        return products.filter(p => {
            if (line !== "ALL") {
                const pLine = (p.lineName && p.lineName.trim()) ? p.lineName.trim() : "All Lines";
                if (pLine !== line) return false;
            }
            if (cat !== "ALL") {
                const pCat = (p.productCategory && p.productCategory.trim()) ? p.productCategory.trim() : "General";
                if (pCat !== cat) return false;
            }
            if (status === "ACTIVE" && p.isActive === false) return false;
            if (status === "INACTIVE" && p.isActive !== false) return false;

            if (search) {
                const t = (p.title || "").toLowerCase();
                const c = (p.productCode || "").toLowerCase();
                const l = (p.lineName || "").toLowerCase();
                const k = (p.productCategory || "").toLowerCase();
                if (!t.includes(search) && !c.includes(search) && !l.includes(search) && !k.includes(search)) {
                    return false;
                }
            }
            return true;
        }).sort((a, b) => {
            let valA = a[st.sortBy];
            let valB = b[st.sortBy];
            if (typeof valA === "boolean") {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            } else {
                valA = (valA || "").toString().toLowerCase();
                valB = (valB || "").toString().toLowerCase();
            }
            if (valA < valB) return st.sortAsc ? -1 : 1;
            if (valA > valB) return st.sortAsc ? 1 : -1;
            return 0;
        });
    },

    updatePkgProductTable: function (allRows) {
        const tableBody = document.getElementById("pkg-product-table-mount");
        const paginationMount = document.getElementById("pkg-pagination-mount");
        if (!tableBody || !paginationMount) return;

        const rawRows = allRows || this.configs.PackagingOperations || [];
        const totalCatalogCount = rawRows.filter(r => r.configType === "Product Master").length;
        const filtered = this.getFilteredPkgProducts(rawRows);
        const totalFiltered = filtered.length;

        const st = this.pkgProductState;
        const pageSize = parseInt(st.pageSize, 10) || 25;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

        if (st.currentPage > totalPages) st.currentPage = totalPages;
        if (st.currentPage < 1) st.currentPage = 1;
        const curPage = st.currentPage;

        const startIdx = (curPage - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, totalFiltered);
        const pageSlice = filtered.slice(startIdx, endIdx);

        const badge = document.getElementById("pkg-product-counter-badge");
        if (badge) {
            badge.innerText = `${totalFiltered}${totalFiltered !== totalCatalogCount ? ` / ${totalCatalogCount}` : ''} items`;
        }

        if (pageSlice.length > 0) {
            tableBody.innerHTML = pageSlice.map(r => `
                <tr>
                    <td>
                        <div class="admin-product-name-cell">
                            <div class="product-avatar"></div>
                            <div>
                                <div class="product-name">${this.escapeHtml(r.title)}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="admin-sku-tag" style="font-size: 13px; font-weight: 600;">${this.escapeHtml(r.productCode || "PRD-001")}</span>
                    </td>
                    <td>
                        <span class="admin-line-badge" style="font-size: 12.5px;"> ${this.escapeHtml(r.lineName || "All Lines")}</span>
                    </td>
                    <td>
                        <span style="font-size: 13px; font-weight: 600; color: #6d28d9; background: #f5f3ff; padding: 3px 8px; border-radius: 6px; border: 1px solid #ddd6fe;">${this.escapeHtml(r.productCategory || "General")}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('PackagingOperations', ${r.id})" title="Click to toggle status">
                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div class="admin-product-actions">
                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditPkgProductModal(${r.id})" title="Edit Product">
                                Edit
                            </button>
                            <button type="button" class="admin-btn-action" style="color: #dc2626;" onclick="Rajpura_Admin.confirmDeleteRow('PackagingOperations', ${r.id})" title="Delete Product">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 36px 20px; color: #64748b;">
                        <div style="font-size: 28px; margin-bottom: 6px;"></div>
                        <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No products match current filters</div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Try adjusting your search keyword, line, or category filters.</div>
                        <button type="button" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 5px 12px;" onclick="Rajpura_Admin.resetPkgFilters()">
                            Reset All Filters
                        </button>
                    </td>
                </tr>
            `;
        }

        if (totalFiltered === 0) {
            paginationMount.innerHTML = "";
            return;
        }

        const showingFrom = totalFiltered > 0 ? startIdx + 1 : 0;
        const showingTo = endIdx;

        const pageButtons = [];
        const maxVisibleButtons = 5;
        let startPage = Math.max(1, curPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
        if (endPage - startPage < maxVisibleButtons - 1) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onPkgPageChange(1)">1</button>`);
            if (startPage > 2) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
        }

        for (let p = startPage; p <= endPage; p++) {
            pageButtons.push(`
                <button type="button" class="admin-page-btn ${p === curPage ? 'active' : ''}" onclick="Rajpura_Admin.onPkgPageChange(${p})">
                    ${p}
                </button>
            `);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onPkgPageChange(${totalPages})">${totalPages}</button>`);
        }

        paginationMount.innerHTML = `
            <div class="admin-pagination-container">
                <div class="admin-pagination-info">
                    <span>Showing <strong>${showingFrom}-${showingTo}</strong> of <strong>${totalFiltered}</strong> products${totalFiltered !== totalCatalogCount ? ` (filtered from ${totalCatalogCount})` : ''}</span>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <span>Page <strong>${curPage}</strong> of <strong>${totalPages}</strong></span>
                </div>
                <div class="admin-pagination-controls">
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onPkgPageChange(1)" title="First Page">
                        &laquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onPkgPageChange(${curPage - 1})" title="Previous Page">
                        &lsaquo;
                    </button>
                    ${pageButtons.join("")}
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onPkgPageChange(${curPage + 1})" title="Next Page">
                        &rsaquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onPkgPageChange(${totalPages})" title="Last Page">
                        &raquo;
                    </button>
                </div>
            </div>
        `;
    },

    onPkgProductSearchInput: function (val) {
        this.pkgProductState.searchTerm = val;
        this.pkgProductState.currentPage = 1;
        const clearBtn = document.getElementById("pkg-product-search-clear");
        if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
        if (this._pkgSearchTimeout) clearTimeout(this._pkgSearchTimeout);
        this._pkgSearchTimeout = setTimeout(() => {
            this.updatePkgProductTable();
        }, 120);
    },

    clearPkgProductSearch: function () {
        this.pkgProductState.searchTerm = "";
        this.pkgProductState.currentPage = 1;
        const inp = document.getElementById("pkg-product-search-input");
        if (inp) inp.value = "";
        const clearBtn = document.getElementById("pkg-product-search-clear");
        if (clearBtn) clearBtn.style.display = "none";
        this.updatePkgProductTable();
        if (inp) inp.focus();
    },

    onPkgLineFilterChange: function (val) {
        this.pkgProductState.lineFilter = val;
        this.pkgProductState.currentPage = 1;
        this.updatePkgProductTable();
    },

    onPkgCategoryFilterChange: function (val) {
        this.pkgProductState.categoryFilter = val;
        this.pkgProductState.currentPage = 1;
        this.updatePkgProductTable();
    },

    onPkgStatusFilterChange: function (val) {
        this.pkgProductState.statusFilter = val;
        this.pkgProductState.currentPage = 1;
        this.updatePkgProductTable();
    },

    onPkgPageSizeChange: function (val) {
        this.pkgProductState.pageSize = parseInt(val, 10) || 25;
        this.pkgProductState.currentPage = 1;
        this.updatePkgProductTable();
    },

    onPkgPageChange: function (page) {
        this.pkgProductState.currentPage = page;
        this.updatePkgProductTable();
        const card = document.getElementById("pkg-product-catalogue-card");
        if (card) {
            const rect = card.getBoundingClientRect();
            if (rect.top < 0) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    onPkgSortChange: function (field) {
        if (this.pkgProductState.sortBy === field) {
            this.pkgProductState.sortAsc = !this.pkgProductState.sortAsc;
        } else {
            this.pkgProductState.sortBy = field;
            this.pkgProductState.sortAsc = true;
        }
        this.updatePkgProductTable();
    },

    resetPkgFilters: function () {
        this.pkgProductState.searchTerm = "";
        this.pkgProductState.lineFilter = "ALL";
        this.pkgProductState.categoryFilter = "ALL";
        this.pkgProductState.statusFilter = "ALL";
        this.pkgProductState.currentPage = 1;

        const searchInput = document.getElementById("pkg-product-search-input");
        if (searchInput) searchInput.value = "";
        const lineSelect = document.getElementById("pkg-filter-line");
        if (lineSelect) lineSelect.value = "ALL";
        const catSelect = document.getElementById("pkg-filter-category");
        if (catSelect) catSelect.value = "ALL";
        const statusSelect = document.getElementById("pkg-filter-status");
        if (statusSelect) statusSelect.value = "ALL";

        this.updatePkgProductTable();
    },

    /**
     * CCP, OPRP & Sieves: Sub-Tab Switcher
     */
    switchCcpSubTab: function (tab) {
        this.ccpSubTab = tab;
        this.searchFilter = "";
        this.renderCurrentTab();
    },

    getCcpSubTabLabel: function (tab) {
        switch (tab) {
            case "users": return "Role & User Assignments";
            case "products": return "Product Master Catalogue";
            default: return "Role & User Assignments";
        }
    },

    /**
     * CCP, OPRP & Sieves: Product Master Catalogue View (High-Performance Paginated + Dynamic Filters)
     */
    renderCcpProductCatalogue: function (rows) {
        const allProducts = (rows || this.configs.CCP_OPRP_Sieves || []).filter(r => r.configType === "Product Master");
        const distinctLines = this.getCcpDistinctLines(allProducts);
        const distinctCategories = this.getCcpDistinctCategories(allProducts);
        const st = this.ccpProductState;

        const lineOptionsHtml = distinctLines.map(l => 
            `<option value="${this.escapeHtml(l.value)}" ${st.lineFilter === l.value ? 'selected' : ''}>${this.escapeHtml(l.label)}</option>`
        ).join("");

        const catOptionsHtml = distinctCategories.map(c => 
            `<option value="${this.escapeHtml(c.value)}" ${st.categoryFilter === c.value ? 'selected' : ''}>${this.escapeHtml(c.label)}</option>`
        ).join("");

        return `
            <div class="admin-panel-card" id="ccp-product-catalogue-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Product Master Catalogue <span class="admin-badge" id="ccp-product-counter-badge" style="font-size: 13px; font-weight: 600; color: #d97706; background: #fffbeb; padding: 2px 10px; border-radius: 12px; border: 1px solid #fde68a; margin-left: 8px;">${allProducts.length} items</span></h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" id="admin-btn-seed-ccp-inline" class="admin-btn-secondary" style="font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 6px;" disabled title="Seeding is disabled">
                            Seed Products (13)
                        </button>
                        <button type="button" class="admin-btn-product-add" style="background: #d97706; border-color: #d97706;" onclick="Rajpura_Admin.openAddCcpProductModal()">
                            + Add Product
                        </button>
                    </div>
                </div>

                <!-- Dynamic Multi-Criteria Filter Bar -->
                <div class="admin-dynamic-filter-bar">
                    <div class="admin-filter-group">
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Line:</span>
                            <select class="admin-filter-select" id="ccp-filter-line" onchange="Rajpura_Admin.onCcpLineFilterChange(this.value)">
                                ${lineOptionsHtml}
                            </select>
                        </div>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Category:</span>
                            <select class="admin-filter-select" id="ccp-filter-category" onchange="Rajpura_Admin.onCcpCategoryFilterChange(this.value)">
                                ${catOptionsHtml}
                            </select>
                        </div>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Status:</span>
                            <select class="admin-filter-select" id="ccp-filter-status" onchange="Rajpura_Admin.onCcpStatusFilterChange(this.value)" style="min-width: 110px;">
                                <option value="ALL" ${st.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                                <option value="ACTIVE" ${st.statusFilter === 'ACTIVE' ? 'selected' : ''}>Active Only</option>
                                <option value="INACTIVE" ${st.statusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="admin-filter-group">
                        <button type="button" class="admin-btn-reset-filters" onclick="Rajpura_Admin.resetCcpFilters()" title="Reset all filters">
                            Reset Filters
                        </button>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Rows per page:</span>
                            <select class="admin-page-size-select" id="ccp-page-size" onchange="Rajpura_Admin.onCcpPageSizeChange(this.value)">
                                <option value="25" ${st.pageSize === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${st.pageSize === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${st.pageSize === 100 ? 'selected' : ''}>100</option>
                                <option value="250" ${st.pageSize === 250 ? 'selected' : ''}>250</option>
                                <option value="9999" ${st.pageSize === 9999 ? 'selected' : ''}>All</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 32%;" class="admin-sortable-th ${st.sortBy === 'title' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onCcpSortChange('title')">
                                    Product Name & Description <span class="admin-sort-indicator">${st.sortBy === 'title' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 16%;" class="admin-sortable-th ${st.sortBy === 'productCode' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onCcpSortChange('productCode')">
                                    Product Code / SKU <span class="admin-sort-indicator">${st.sortBy === 'productCode' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 16%;" class="admin-sortable-th ${st.sortBy === 'lineName' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onCcpSortChange('lineName')">
                                    Associated Line <span class="admin-sort-indicator">${st.sortBy === 'lineName' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 14%;" class="admin-sortable-th ${st.sortBy === 'productCategory' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onCcpSortChange('productCategory')">
                                    Category <span class="admin-sort-indicator">${st.sortBy === 'productCategory' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 10%; text-align: center;" class="admin-sortable-th ${st.sortBy === 'isActive' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onCcpSortChange('isActive')">
                                    Status <span class="admin-sort-indicator">${st.sortBy === 'isActive' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 12%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ccp-product-table-mount">
                            <!-- Dynamic Paginated Slice Mounted Here -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Footer -->
                <div id="ccp-pagination-mount">
                    <!-- Pagination Controls Mounted Here -->
                </div>
            </div>
        `;
    },

    getCcpDistinctLines: function (products) {
        const counts = {};
        let total = 0;
        (products || []).forEach(p => {
            const line = (p.lineName && p.lineName.trim()) ? p.lineName.trim() : "All Lines";
            counts[line] = (counts[line] || 0) + 1;
            total++;
        });
        const lines = Object.keys(counts).sort((a, b) => {
            if (a === "All Lines") return -1;
            if (b === "All Lines") return 1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
        });
        const result = [{ value: "ALL", label: `All Lines (${total})` }];
        lines.forEach(l => {
            result.push({ value: l, label: `${l} (${counts[l]})` });
        });
        return result;
    },

    getCcpDistinctCategories: function (products) {
        const counts = {};
        let total = 0;
        (products || []).forEach(p => {
            const cat = (p.productCategory && p.productCategory.trim()) ? p.productCategory.trim() : "General";
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });
        const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
        const result = [{ value: "ALL", label: `All Categories (${total})` }];
        categories.forEach(c => {
            result.push({ value: c, label: `${c} (${counts[c]})` });
        });
        return result;
    },

    getFilteredCcpProducts: function (allRows) {
        const products = (allRows || this.configs.CCP_OPRP_Sieves || []).filter(r => r.configType === "Product Master");
        const st = this.ccpProductState;
        const search = (st.searchTerm || "").toLowerCase().trim();
        const line = st.lineFilter || "ALL";
        const cat = st.categoryFilter || "ALL";
        const status = st.statusFilter || "ALL";

        return products.filter(p => {
            if (line !== "ALL") {
                const pLine = (p.lineName && p.lineName.trim()) ? p.lineName.trim() : "All Lines";
                if (pLine !== line) return false;
            }
            if (cat !== "ALL") {
                const pCat = (p.productCategory && p.productCategory.trim()) ? p.productCategory.trim() : "General";
                if (pCat !== cat) return false;
            }
            if (status === "ACTIVE" && p.isActive === false) return false;
            if (status === "INACTIVE" && p.isActive !== false) return false;

            if (search) {
                const t = (p.title || "").toLowerCase();
                const c = (p.productCode || "").toLowerCase();
                const l = (p.lineName || "").toLowerCase();
                const k = (p.productCategory || "").toLowerCase();
                if (!t.includes(search) && !c.includes(search) && !l.includes(search) && !k.includes(search)) {
                    return false;
                }
            }
            return true;
        }).sort((a, b) => {
            let valA = a[st.sortBy];
            let valB = b[st.sortBy];
            if (typeof valA === "boolean") {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            } else {
                valA = (valA || "").toString().toLowerCase();
                valB = (valB || "").toString().toLowerCase();
            }
            if (valA < valB) return st.sortAsc ? -1 : 1;
            if (valA > valB) return st.sortAsc ? 1 : -1;
            return 0;
        });
    },

    updateCcpProductTable: function (allRows) {
        const tableBody = document.getElementById("ccp-product-table-mount");
        const paginationMount = document.getElementById("ccp-pagination-mount");
        if (!tableBody || !paginationMount) return;

        const rawRows = allRows || this.configs.CCP_OPRP_Sieves || [];
        const totalCatalogCount = rawRows.filter(r => r.configType === "Product Master").length;
        const filtered = this.getFilteredCcpProducts(rawRows);
        const totalFiltered = filtered.length;

        const st = this.ccpProductState;
        const pageSize = parseInt(st.pageSize, 10) || 25;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

        if (st.currentPage > totalPages) st.currentPage = totalPages;
        if (st.currentPage < 1) st.currentPage = 1;
        const curPage = st.currentPage;

        const startIdx = (curPage - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, totalFiltered);
        const pageSlice = filtered.slice(startIdx, endIdx);

        const badge = document.getElementById("ccp-product-counter-badge");
        if (badge) {
            badge.innerText = `${totalFiltered}${totalFiltered !== totalCatalogCount ? ` / ${totalCatalogCount}` : ''} items`;
        }

        if (pageSlice.length > 0) {
            tableBody.innerHTML = pageSlice.map(r => `
                <tr>
                    <td>
                        <div class="admin-product-name-cell">
                            <div class="product-avatar" style="background: #fffbeb; color: #d97706;"></div>
                            <div>
                                <div class="product-name">${this.escapeHtml(r.title)}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="admin-sku-tag" style="font-size: 13px; font-weight: 600;">${this.escapeHtml(r.productCode || "PRD-001")}</span>
                    </td>
                    <td>
                        <span class="admin-line-badge" style="font-size: 12.5px;"> ${this.escapeHtml(r.lineName || "All Lines")}</span>
                    </td>
                    <td>
                        <span style="font-size: 13px; font-weight: 600; color: #b45309; background: #fffbeb; padding: 3px 8px; border-radius: 6px; border: 1px solid #fde68a;">${this.escapeHtml(r.productCategory || "General")}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('CCP_OPRP_Sieves', ${r.id})" title="Click to toggle status">
                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div class="admin-product-actions">
                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditCcpProductModal(${r.id})" title="Edit Product">
                                Edit
                            </button>
                            <button type="button" class="admin-btn-action" style="color: #dc2626;" onclick="Rajpura_Admin.confirmDeleteRow('CCP_OPRP_Sieves', ${r.id})" title="Delete Product">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("");
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 36px 20px; color: #64748b;">
                        <div style="font-size: 28px; margin-bottom: 6px;"></div>
                        <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No products match current filters</div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Try adjusting your search keyword, line, or category filters.</div>
                        <button type="button" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 5px 12px;" onclick="Rajpura_Admin.resetCcpFilters()">
                            Reset All Filters
                        </button>
                    </td>
                </tr>
            `;
        }

        if (totalFiltered === 0) {
            paginationMount.innerHTML = "";
            return;
        }

        const showingFrom = totalFiltered > 0 ? startIdx + 1 : 0;
        const showingTo = endIdx;

        const pageButtons = [];
        const maxVisibleButtons = 5;
        let startPage = Math.max(1, curPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
        if (endPage - startPage < maxVisibleButtons - 1) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onCcpPageChange(1)">1</button>`);
            if (startPage > 2) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
        }

        for (let p = startPage; p <= endPage; p++) {
            pageButtons.push(`
                <button type="button" class="admin-page-btn ${p === curPage ? 'active' : ''}" onclick="Rajpura_Admin.onCcpPageChange(${p})">
                    ${p}
                </button>
            `);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onCcpPageChange(${totalPages})">${totalPages}</button>`);
        }

        paginationMount.innerHTML = `
            <div class="admin-pagination-container">
                <div class="admin-pagination-info">
                    <span>Showing <strong>${showingFrom}-${showingTo}</strong> of <strong>${totalFiltered}</strong> products${totalFiltered !== totalCatalogCount ? ` (filtered from ${totalCatalogCount})` : ''}</span>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <span>Page <strong>${curPage}</strong> of <strong>${totalPages}</strong></span>
                </div>
                <div class="admin-pagination-controls">
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onCcpPageChange(1)" title="First Page">
                        &laquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onCcpPageChange(${curPage - 1})" title="Previous Page">
                        &lsaquo;
                    </button>
                    ${pageButtons.join("")}
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onCcpPageChange(${curPage + 1})" title="Next Page">
                        &rsaquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onCcpPageChange(${totalPages})" title="Last Page">
                        &raquo;
                    </button>
                </div>
            </div>
        `;
    },

    onCcpProductSearchInput: function (val) {
        this.ccpProductState.searchTerm = val;
        this.ccpProductState.currentPage = 1;
        const clearBtn = document.getElementById("ccp-product-search-clear");
        if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
        if (this._ccpSearchTimeout) clearTimeout(this._ccpSearchTimeout);
        this._ccpSearchTimeout = setTimeout(() => {
            this.updateCcpProductTable();
        }, 120);
    },

    clearCcpProductSearch: function () {
        this.ccpProductState.searchTerm = "";
        this.ccpProductState.currentPage = 1;
        const inp = document.getElementById("ccp-product-search-input");
        if (inp) inp.value = "";
        const clearBtn = document.getElementById("ccp-product-search-clear");
        if (clearBtn) clearBtn.style.display = "none";
        this.updateCcpProductTable();
        if (inp) inp.focus();
    },

    onCcpLineFilterChange: function (val) {
        this.ccpProductState.lineFilter = val;
        this.ccpProductState.currentPage = 1;
        this.updateCcpProductTable();
    },

    onCcpCategoryFilterChange: function (val) {
        this.ccpProductState.categoryFilter = val;
        this.ccpProductState.currentPage = 1;
        this.updateCcpProductTable();
    },

    onCcpStatusFilterChange: function (val) {
        this.ccpProductState.statusFilter = val;
        this.ccpProductState.currentPage = 1;
        this.updateCcpProductTable();
    },

    onCcpPageSizeChange: function (val) {
        this.ccpProductState.pageSize = parseInt(val, 10) || 25;
        this.ccpProductState.currentPage = 1;
        this.updateCcpProductTable();
    },

    onCcpPageChange: function (page) {
        this.ccpProductState.currentPage = page;
        this.updateCcpProductTable();
        const card = document.getElementById("ccp-product-catalogue-card");
        if (card) {
            const rect = card.getBoundingClientRect();
            if (rect.top < 0) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    },

    onCcpSortChange: function (field) {
        if (this.ccpProductState.sortBy === field) {
            this.ccpProductState.sortAsc = !this.ccpProductState.sortAsc;
        } else {
            this.ccpProductState.sortBy = field;
            this.ccpProductState.sortAsc = true;
        }
        this.updateCcpProductTable();
    },

    resetCcpFilters: function () {
        this.ccpProductState.searchTerm = "";
        this.ccpProductState.lineFilter = "ALL";
        this.ccpProductState.categoryFilter = "ALL";
        this.ccpProductState.statusFilter = "ALL";
        this.ccpProductState.currentPage = 1;

        const searchInput = document.getElementById("ccp-product-search-input");
        if (searchInput) searchInput.value = "";
        const lineSelect = document.getElementById("ccp-filter-line");
        if (lineSelect) lineSelect.value = "ALL";
        const catSelect = document.getElementById("ccp-filter-category");
        if (catSelect) catSelect.value = "ALL";
        const statusSelect = document.getElementById("ccp-filter-status");
        if (statusSelect) statusSelect.value = "ALL";

        this.updateCcpProductTable();
    },

    /**
     * Packaging Operations: SKU / Weight Master View
     */
    renderPkgSkuMaster: function (rows) {
        let skuRows = rows.filter(r => r.configType === "SKU Master");

        if (this.searchFilter.trim() !== "") {
            const q = this.searchFilter.toLowerCase().trim();
            skuRows = skuRows.filter(r => (r.title || "").toLowerCase().includes(q));
        }

        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> SKU / Weight Master</h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddPkgSkuModal()">
                            + Add SKU Weight
                        </button>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 60%;">SKU Weight / Pack Size</th>
                                <th style="width: 20%;">Status</th>
                                <th style="width: 20%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${skuRows.length > 0 ? skuRows.map(r => `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <span style="font-size: 18px;"></span>
                                            <div>
                                                <strong style="color: #0f172a; font-size: 14px;">${this.escapeHtml(r.title)}</strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleItemActive('PackagingOperations', ${r.id})" title="Click to toggle status">
                                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="admin-product-actions">
                                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditPkgSkuModal(${r.id})" title="Edit SKU">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td colspan="3" style="text-align: center; padding: 32px; color: #64748b;">
                                        No SKUs configured. Click "+ Add SKU Weight" to add one.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * ALC Modals: Line Master Add & Edit
     */
    openAddAlcLineModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add Production Line &bull; Line Master</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Line Number Identifier <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-line-title" class="admin-form-input" placeholder="e.g. Line No. 9" />
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">Standard naming convention: Line No. 1, Line No. 2, etc.</div>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Machine / Line Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-line-name" class="admin-form-input" placeholder="e.g. HAAS, IMAFORNI, AZAAN" />
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">The equipment manufacturer or line specification.</div>
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-line-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-line-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active (Available in ALC dropdown)</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-line" onclick="Rajpura_Admin.saveAlcLine()">
                            Save Line to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openEditAlcLineModal: function (rowId) {
        const row = (this.configs.ALC || []).find(r => r.id === rowId);
        if (!row) return;
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit Production Line &bull; ${this.escapeHtml(row.title)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Line Number Identifier <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-line-title" class="admin-form-input" value="${this.escapeHtml(row.title)}" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Machine / Line Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-line-name" class="admin-form-input" value="${this.escapeHtml(row.lineName || '')}" placeholder="e.g. HAAS, IMAFORNI, AZAAN" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-line-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-line-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active (Available in ALC dropdown)</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-line" onclick="Rajpura_Admin.saveAlcLine(${rowId})">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    saveAlcLine: async function (rowId) {
        const title = document.getElementById("modal-line-title")?.value.trim();
        const lineName = document.getElementById("modal-line-name")?.value.trim();
        const isActive = document.getElementById("modal-line-active")?.checked;

        if (!title) {
            alert("Please enter a Line Number (e.g. Line No. 1)");
            return;
        }

        const btn = document.getElementById("btn-save-line");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: title,
            ConfigType: "Line Master",
            LineName: lineName || "",
            Plant: "Rajpura",
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("ALC", rowId, payload);
        if (success) {
            this.showToast(rowId ? `Line '${title}' updated successfully` : `Line '${title}' added successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Line to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * ALC Modals: Shift Master Add & Edit
     */
    openAddAlcShiftModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add Shift &bull; Shift Master</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Shift Code <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-shift-code" class="admin-form-input" placeholder="e.g. A, B, C, G" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Shift Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-shift-name" class="admin-form-input" placeholder="e.g. Morning, Evening, Night, General" />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Start Time</label>
                                <input type="text" id="modal-shift-start" class="admin-form-input" placeholder="e.g. 6:00 A.M." />
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">End Time</label>
                                <input type="text" id="modal-shift-end" class="admin-form-input" placeholder="e.g. 2:00 P.M." />
                            </div>
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-shift-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-shift-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-shift" onclick="Rajpura_Admin.saveAlcShift()">
                            Save Shift to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openEditAlcShiftModal: function (rowId) {
        const row = (this.configs.ALC || []).find(r => r.id === rowId);
        if (!row) return;
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit Shift &bull; Shift ${this.escapeHtml(row.shiftCode || row.title)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Shift Code <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-shift-code" class="admin-form-input" value="${this.escapeHtml(row.shiftCode || '')}" placeholder="e.g. A, B, C, G" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Shift Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-shift-name" class="admin-form-input" value="${this.escapeHtml(row.shiftName || '')}" placeholder="e.g. Morning, Evening, Night, General" />
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Start Time</label>
                                <input type="text" id="modal-shift-start" class="admin-form-input" value="${this.escapeHtml(row.shiftStart || '')}" placeholder="e.g. 6:00 A.M." />
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">End Time</label>
                                <input type="text" id="modal-shift-end" class="admin-form-input" value="${this.escapeHtml(row.shiftEnd || '')}" placeholder="e.g. 2:00 P.M." />
                            </div>
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-shift-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-shift-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-shift" onclick="Rajpura_Admin.saveAlcShift(${rowId})">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    saveAlcShift: async function (rowId) {
        const code = document.getElementById("modal-shift-code")?.value.trim();
        const name = document.getElementById("modal-shift-name")?.value.trim();
        const start = document.getElementById("modal-shift-start")?.value.trim();
        const end = document.getElementById("modal-shift-end")?.value.trim();
        const isActive = document.getElementById("modal-shift-active")?.checked;

        if (!code || !name) {
            alert("Please enter Shift Code and Shift Name");
            return;
        }

        const btn = document.getElementById("btn-save-shift");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: `Shift ${code}`,
            ConfigType: "Shift Master",
            ShiftCode: code,
            ShiftName: name,
            ShiftStart: start || "",
            ShiftEnd: end || "",
            Plant: "Rajpura",
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("ALC", rowId, payload);
        if (success) {
            this.showToast(rowId ? `Shift ${code} updated successfully` : `Shift ${code} added successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Shift to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * ALC Modals: Product Master Add & Edit
     */
    openAddAlcProductModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add Changeover Product &bull; Product Master</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Variety Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-prod-title" class="admin-form-input" placeholder="e.g. Cremica Bourbon, Marie Delight" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code (Optional)</label>
                            <input type="text" id="modal-prod-code" class="admin-form-input" placeholder="e.g. PRD-001" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-prod-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-prod-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-prod" onclick="Rajpura_Admin.saveAlcProduct()">
                            Save Product to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openEditAlcProductModal: function (rowId) {
        const row = (this.configs.ALC || []).find(r => r.id === rowId);
        if (!row) return;
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit Changeover Product &bull; ${this.escapeHtml(row.title)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Variety Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-prod-title" class="admin-form-input" value="${this.escapeHtml(row.title)}" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code (Optional)</label>
                            <input type="text" id="modal-prod-code" class="admin-form-input" value="${this.escapeHtml(row.productCode || '')}" placeholder="e.g. PRD-001" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-prod-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-prod-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" class="admin-btn-secondary" style="color: #dc2626; border-color: #fecaca; background: #fff5f5;" onclick="Rajpura_Admin.confirmDeleteRow('ALC', ${rowId})">
                            Delete Product
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                            <button type="button" class="admin-btn-primary" id="btn-save-prod" onclick="Rajpura_Admin.saveAlcProduct(${rowId})">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    saveAlcProduct: async function (rowId) {
        const title = document.getElementById("modal-prod-title")?.value.trim();
        const code = document.getElementById("modal-prod-code")?.value.trim();
        const isActive = document.getElementById("modal-prod-active")?.checked;

        if (!title) {
            alert("Please enter Product Name");
            return;
        }

        const btn = document.getElementById("btn-save-prod");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: title,
            ConfigType: "Product Master",
            ProductCode: code || "",
            Plant: "Rajpura",
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("ALC", rowId, payload);
        if (success) {
            this.showToast(rowId ? `Product '${title}' updated successfully` : `Product '${title}' added successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Product to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * ALC Modals: QA Shift Matrix Add & Edit
     */
    openAddAlcQaMatrixModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const lines = (this.configs.ALC || []).filter(r => r.configType === "Line Master");
        const shifts = (this.configs.ALC || []).filter(r => r.configType === "Shift Master");

        const lineOptions = `<option value="Default">Default (All Lines)</option>` +
            lines.map(l => `<option value="${this.escapeHtml(l.title)}">${this.escapeHtml(l.title)}${l.lineName ? ` - ${this.escapeHtml(l.lineName)}` : ''}</option>`).join("");

        const shiftOptions = `<option value="Default">Default (All Shifts)</option>` +
            shifts.map(s => `<option value="${this.escapeHtml(s.shiftCode || s.title)}">Shift ${this.escapeHtml(s.shiftCode || s.title)} - ${this.escapeHtml(s.shiftName || '')}</option>`).join("");

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add QA Shift Assignment &bull; ALC</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Line Selection</label>
                                <select id="modal-matrix-line" class="admin-form-select">
                                    ${lineOptions}
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">Shift Selection</label>
                                <select id="modal-matrix-shift" class="admin-form-select">
                                    ${shiftOptions}
                                </select>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">Assigned QA Executives / Operators (Multi-User Selection) <span style="color: #dc2626;">*</span></label>
                            <div class="admin-user-picker-container" id="modal-picker-users">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-users').focus()">
                                    <div id="selected-chips-users" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-users" class="admin-picker-search-input" placeholder="Type employee name or email to assign QA..." oninput="Rajpura_Admin.onPickerSearch('users', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-users" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">QA Shift Executives (Multi-Select)</label>
                            <div class="admin-user-picker-container" id="modal-picker-qa-shift">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-qa-shift').focus()">
                                    <div id="selected-chips-qa-shift" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-qa-shift" class="admin-picker-search-input" placeholder="Type employee name or email to assign QA Shift Executive..." oninput="Rajpura_Admin.onPickerSearch('qa-shift', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-qa-shift" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">5-Minute Escalation Managers (Multi-User Selection)</label>
                            <div class="admin-user-picker-container" id="modal-picker-mgr">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-mgr').focus()">
                                    <div id="selected-chips-mgr" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-mgr" class="admin-picker-search-input" placeholder="Type employee name or email for escalation..." oninput="Rajpura_Admin.onPickerSearch('mgr', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-mgr" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-matrix-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-matrix-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-matrix" onclick="Rajpura_Admin.saveAlcQaMatrix(null)">
                            Save QA Assignment to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.pickerState = { users: [], 'qa-shift': [], prod: [], mgr: [] };
    },

    openEditAlcQaMatrixModal: function (rowId) {
        const row = rowId ? (this.configs.ALC || []).find(r => r.id === rowId) : null;
        if (!row && rowId) return;

        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const lines = (this.configs.ALC || []).filter(r => r.configType === "Line Master");
        const shifts = (this.configs.ALC || []).filter(r => r.configType === "Shift Master");

        const isDefaultLine = !row || !row.title || row.title === 'Default' || row.title === 'All Lines';
        const isDefaultShift = !row || !row.shiftCode || row.shiftCode === 'Default' || row.shiftCode === 'All Shifts';

        const lineOptions = `<option value="Default" ${isDefaultLine ? 'selected' : ''}>Default (All Lines)</option>` +
            lines.map(l => `<option value="${this.escapeHtml(l.title)}" ${(row && row.title === l.title) ? 'selected' : ''}>${this.escapeHtml(l.title)}${l.lineName ? ` - ${this.escapeHtml(l.lineName)}` : ''}</option>`).join("");

        const shiftOptions = `<option value="Default" ${isDefaultShift ? 'selected' : ''}>Default (All Shifts)</option>` +
            shifts.map(s => `<option value="${this.escapeHtml(s.shiftCode || s.title)}" ${(row && row.shiftCode === s.shiftCode) ? 'selected' : ''}>Shift ${this.escapeHtml(s.shiftCode || s.title)} - ${this.escapeHtml(s.shiftName || '')}</option>`).join("");

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit QA Shift Assignment &bull; ${this.escapeHtml(row ? row.title : 'New')}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Line Selection</label>
                                <select id="modal-matrix-line" class="admin-form-select">
                                    ${lineOptions}
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">Shift Selection</label>
                                <select id="modal-matrix-shift" class="admin-form-select">
                                    ${shiftOptions}
                                </select>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">Assigned QA Executives / Operators <span style="color: #dc2626;">*</span></label>
                            <div class="admin-user-picker-container" id="modal-picker-users">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-users').focus()">
                                    <div id="selected-chips-users" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-users" class="admin-picker-search-input" placeholder="Type employee name or email to assign QA..." oninput="Rajpura_Admin.onPickerSearch('users', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-users" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">QA Shift Executives (Multi-Select)</label>
                            <div class="admin-user-picker-container" id="modal-picker-qa-shift">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-qa-shift').focus()">
                                    <div id="selected-chips-qa-shift" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-qa-shift" class="admin-picker-search-input" placeholder="Type employee name or email to assign QA Shift Executive..." oninput="Rajpura_Admin.onPickerSearch('qa-shift', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-qa-shift" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">5-Minute Escalation Managers</label>
                            <div class="admin-user-picker-container" id="modal-picker-mgr">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-mgr').focus()">
                                    <div id="selected-chips-mgr" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-mgr" class="admin-picker-search-input" placeholder="Type employee name or email for escalation..." oninput="Rajpura_Admin.onPickerSearch('mgr', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-mgr" style="display: none;"></div>
                            </div>
                        </div>

                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-matrix-active" ${(!row || row.isActive !== false) ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-matrix-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-matrix" onclick="Rajpura_Admin.saveAlcQaMatrix(${rowId || 'null'})">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.pickerState = {
            users: [...((row && row.assignedUsers) || [])],
            'qa-shift': [...((row && row.qaShiftExecutives) || [])],
            prod: [],
            mgr: [...((row && row.escalationManagers) || [])]
        };

        this.renderSelectedChips("users");
        this.renderSelectedChips("qa-shift");
        this.renderSelectedChips("mgr");
    },

    saveAlcQaMatrix: async function (rowId) {
        const line = document.getElementById("modal-matrix-line")?.value;
        const shift = document.getElementById("modal-matrix-shift")?.value;
        const assignedUsers = this.pickerState.users || [];
        const qaShiftExecutives = this.pickerState['qa-shift'] || this.pickerState.qaShift || [];
        const escalationManagers = this.pickerState.mgr || [];
        const isActive = document.getElementById("modal-matrix-active")?.checked;

        if (assignedUsers.length === 0) {
            alert("Please select at least one QA Executive");
            return;
        }

        const btn = document.getElementById("btn-save-matrix");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: line || "Default",
            ConfigType: "QA Assignment",
            ShiftCode: shift || "Default",
            Plant: "Rajpura",
            AssignedUsers: assignedUsers,
            QAShiftExecutives: qaShiftExecutives,
            EscalationManagers: escalationManagers,
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("ALC", rowId, payload);
        if (success) {
            this.showToast(rowId ? "QA Shift Assignment updated successfully" : "QA Shift Assignment added successfully", "success");
            this.closeModal();
            await this.loadSingleFormConfig("ALC");
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save QA Assignment to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * ALC Modals: Area Inspector Assignment Edit
     */
    openEditAlcAreaModal: function (rowId) {
        const row = (this.configs.ALC || []).find(r => r.id === rowId);
        if (!row) return;

        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Assign Area Incharges &bull; ${this.escapeHtml(row.title)} (${this.escapeHtml(row.area || row.title)})</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-readonly-meta-grid">
                            <div class="admin-readonly-item">
                                <span class="admin-readonly-label">Area Code</span>
                                <span class="admin-readonly-value"><span class="admin-role-badge">${this.escapeHtml(row.title)}</span></span>
                            </div>
                            <div class="admin-readonly-item">
                                <span class="admin-readonly-label">Area Name</span>
                                <span class="admin-readonly-value" style="color: #0f172a; font-weight: 600;">${this.escapeHtml(row.area || row.title)}</span>
                            </div>
                        </div>

                        <div class="admin-form-group">
                            <label class="admin-form-label">Assigned Area Incharges / Inspectors (Multi-User Selection) <span style="color: #dc2626;">*</span></label>
                            <div class="admin-user-picker-container" id="modal-picker-users">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-users').focus()">
                                    <div id="selected-chips-users" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-users" class="admin-picker-search-input" placeholder="Type employee name or email to assign area inspector..." oninput="Rajpura_Admin.onPickerSearch('users', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-users" style="display: none;"></div>
                            </div>
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">Search from master EmployeeList to assign inspectors. Click &times; on chip to remove.</div>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-area" onclick="Rajpura_Admin.saveAlcAreaInspector(${rowId})">
                            Save Area Inspectors
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.pickerState = {
            users: [...(row.assignedUsers || [])],
            prod: [],
            mgr: []
        };

        this.renderSelectedChips("users");
    },

    saveAlcAreaInspector: async function (rowId) {
        const row = (this.configs.ALC || []).find(r => r.id === rowId);
        const assignedUsers = this.pickerState.users || [];

        if (assignedUsers.length === 0) {
            alert("Please select at least one Area Inspector");
            return;
        }

        const btn = document.getElementById("btn-save-area");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: (row && row.title) || "AREA",
            ConfigType: "Area Inspector",
            Area: (row && row.area) || "",
            Plant: "Rajpura",
            AssignedUsers: assignedUsers,
            EscalationManagers: [],
            IsActive: true
        };

        const success = await this.persistItemToSharePoint("ALC", rowId, payload);
        if (success) {
            this.showToast(`Area Incharges for '${payload.Area || payload.Title}' updated successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Area Inspectors";
            btn.disabled = false;
        }
    },

    /**
     * Packaging Operations Modals: Product Master Add & Edit
     */
    openAddPkgProductModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add Product &bull; Packaging Operations</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-prod-title" class="admin-form-input" placeholder="e.g. Cremica Bourbon, Cremica Butter Cookies" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code / SKU</label>
                            <input type="text" id="modal-pkg-prod-code" class="admin-form-input" placeholder="e.g. PRD-001, BRB-50G" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Associated Production Line</label>
                            <select id="modal-pkg-prod-line" class="admin-form-input">
                                <option value="All Lines">All Lines</option>
                                <option value="Line 1">Line 1</option>
                                <option value="Line 2">Line 2</option>
                                <option value="Line 3">Line 3</option>
                                <option value="Line 4">Line 4</option>
                                <option value="Line 5">Line 5</option>
                                <option value="Line 6">Line 6</option>
                                <option value="Line 7">Line 7</option>
                                <option value="Line 8">Line 8</option>
                            </select>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Category</label>
                            <input type="text" id="modal-pkg-prod-cat" class="admin-form-input" placeholder="e.g. Cream, Cookies, Crackers, Health Biscuits, Glucose" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-pkg-prod-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-pkg-prod-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-pkg-prod" onclick="Rajpura_Admin.savePkgProduct()">
                            Save Product to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openEditPkgProductModal: function (rowId) {
        const row = (this.configs.PackagingOperations || []).find(r => r.id === rowId);
        if (!row) return;
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit Product &bull; ${this.escapeHtml(row.title)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Name <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-prod-title" class="admin-form-input" value="${this.escapeHtml(row.title)}" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code / SKU</label>
                            <input type="text" id="modal-pkg-prod-code" class="admin-form-input" value="${this.escapeHtml(row.productCode || '')}" placeholder="e.g. PRD-001" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Associated Production Line</label>
                            <select id="modal-pkg-prod-line" class="admin-form-input">
                                <option value="All Lines" ${row.lineName === 'All Lines' ? 'selected' : ''}>All Lines</option>
                                <option value="Line 1" ${row.lineName === 'Line 1' ? 'selected' : ''}>Line 1</option>
                                <option value="Line 2" ${row.lineName === 'Line 2' ? 'selected' : ''}>Line 2</option>
                                <option value="Line 3" ${row.lineName === 'Line 3' ? 'selected' : ''}>Line 3</option>
                                <option value="Line 4" ${row.lineName === 'Line 4' ? 'selected' : ''}>Line 4</option>
                                <option value="Line 5" ${row.lineName === 'Line 5' ? 'selected' : ''}>Line 5</option>
                                <option value="Line 6" ${row.lineName === 'Line 6' ? 'selected' : ''}>Line 6</option>
                                <option value="Line 7" ${row.lineName === 'Line 7' ? 'selected' : ''}>Line 7</option>
                                <option value="Line 8" ${row.lineName === 'Line 8' ? 'selected' : ''}>Line 8</option>
                            </select>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Category</label>
                            <input type="text" id="modal-pkg-prod-cat" class="admin-form-input" value="${this.escapeHtml(row.productCategory || '')}" placeholder="e.g. Cream, Cookies, Crackers" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-pkg-prod-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-pkg-prod-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" class="admin-btn-secondary" style="color: #dc2626; border-color: #fecaca; background: #fff5f5;" onclick="Rajpura_Admin.confirmDeleteRow('PackagingOperations', ${rowId})">
                            Delete Product
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                            <button type="button" class="admin-btn-primary" id="btn-save-pkg-prod" onclick="Rajpura_Admin.savePkgProduct(${rowId})">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    savePkgProduct: async function (rowId) {
        const title = document.getElementById("modal-pkg-prod-title")?.value.trim();
        const code = document.getElementById("modal-pkg-prod-code")?.value.trim();
        const line = document.getElementById("modal-pkg-prod-line")?.value;
        const category = document.getElementById("modal-pkg-prod-cat")?.value.trim();
        const isActive = document.getElementById("modal-pkg-prod-active")?.checked;

        if (!title) {
            alert("Please enter a Product Name");
            return;
        }

        const btn = document.getElementById("btn-save-pkg-prod");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: title,
            ConfigType: "Product Master",
            ProductCode: code || "",
            LineName: line || "All Lines",
            ProductCategory: category || "",
            Plant: "Rajpura",
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("PackagingOperations", rowId, payload);
        if (success) {
            this.showToast(rowId ? `Product '${title}' updated successfully` : `Product '${title}' added successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Product to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * Packaging Operations Modals: SKU / Weight Master Add & Edit
     */
    openAddPkgSkuModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add SKU Weight &bull; Packaging Operations</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">SKU Weight / Pack Size <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-sku-title" class="admin-form-input" placeholder="e.g. 50g, 100g, 250g, 500g, 1kg Family Pack" />
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 3px;">Standard packaging weight denomination used in checks.</div>
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-pkg-sku-active" checked style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-pkg-sku-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-pkg-sku" onclick="Rajpura_Admin.savePkgSku()">
                            Save SKU to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    openEditPkgSkuModal: function (rowId) {
        const row = (this.configs.PackagingOperations || []).find(r => r.id === rowId);
        if (!row) return;
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;
        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">Edit SKU Weight &bull; ${this.escapeHtml(row.title)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">SKU Weight / Pack Size <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-sku-title" class="admin-form-input" value="${this.escapeHtml(row.title)}" />
                        </div>
                        <div class="admin-form-group" style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="checkbox" id="modal-pkg-sku-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                            <label for="modal-pkg-sku-active" style="cursor: pointer; font-size: 13.5px; font-weight: 500; margin: 0;">Is Active</label>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-pkg-sku" onclick="Rajpura_Admin.savePkgSku(${rowId})">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    savePkgSku: async function (rowId) {
        const title = document.getElementById("modal-pkg-sku-title")?.value.trim();
        const isActive = document.getElementById("modal-pkg-sku-active")?.checked;

        if (!title) {
            alert("Please enter an SKU Weight / Pack Size");
            return;
        }

        const btn = document.getElementById("btn-save-pkg-sku");
        if (btn) { btn.innerText = "Saving..."; btn.disabled = true; }

        const payload = {
            Title: title,
            ConfigType: "SKU Master",
            Plant: "Rajpura",
            IsActive: isActive !== false
        };

        const success = await this.persistItemToSharePoint("PackagingOperations", rowId, payload);
        if (success) {
            this.showToast(rowId ? `SKU '${title}' updated successfully` : `SKU '${title}' added successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save SKU to SharePoint";
            btn.disabled = false;
        }
    },

    /**
     * Mixing & Baking: Product Recipes Master Catalogue View (High-Performance Paginated + Variety Search & Dynamic Filters)
     */
    renderMbRecipeCatalogue: function (rows) {
        const allRecipes = (rows || this.configs.MixingAndBaking || []).filter(r => r.configType === "Product Recipe");
        const distinctCategories = this.getMbDistinctCategories(allRecipes);
        const st = this.mbRecipeState;

        const catOptionsHtml = distinctCategories.map(c => 
            `<option value="${this.escapeHtml(c.value)}" ${st.categoryFilter === c.value ? 'selected' : ''}>${this.escapeHtml(c.label)}</option>`
        ).join("");

        return `
            <div class="admin-panel-card" id="mb-recipe-catalogue-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title"> Product Recipes Master Catalogue <span class="admin-badge" id="mb-recipe-counter-badge" style="font-size: 13px; font-weight: 600; color: #dc2626; background: #fef2f2; padding: 2px 10px; border-radius: 12px; border: 1px solid #fecaca; margin-left: 8px;">${allRecipes.length} items</span></h3>
                    </div>
                    <div class="admin-panel-actions">
                        <button type="button" id="admin-btn-seed-mb-inline" class="admin-btn-secondary" style="font-size: 13px; font-weight: 600; padding: 7px 14px; border-radius: 8px; border-color: #cbd5e1; color: #94a3b8; background: #f1f5f9; cursor: not-allowed !important; opacity: 0.6; pointer-events: none; display: inline-flex; align-items: center; gap: 6px;" disabled title="Seeding is disabled">
                            Seed Recipes
                        </button>
                        <button type="button" class="admin-btn-product-add" style="background: #dc2626; border-color: #dc2626;" onclick="Rajpura_Admin.openAddMbRecipeModal()">
                            + Add Product Recipe
                        </button>
                    </div>
                </div>

                <!-- Dynamic Variety Search & Multi-Criteria Filter Bar -->
                <div class="admin-dynamic-filter-bar">
                    <div class="admin-filter-group" style="flex: 1; max-width: 380px;">
                        <div class="admin-filter-item" style="width: 100%; position: relative;">
                            <input type="text" id="mb-recipe-search-input" class="admin-search-input" style="width: 100%; padding-left: 32px; padding-right: 28px; box-sizing: border-box;" placeholder="Search variety name, SKU, category..." value="${this.escapeHtml(st.searchTerm)}" oninput="Rajpura_Admin.onMbRecipeSearchInput(this.value)" />
                            <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; font-size: 13px;">🔍</span>
                            <button type="button" id="mb-recipe-search-clear" onclick="Rajpura_Admin.clearMbRecipeSearch()" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 15px; display: ${st.searchTerm ? 'inline-flex' : 'none'}; align-items: center; justify-content: center; padding: 0;" title="Clear search">&times;</button>
                        </div>
                    </div>
                    <div class="admin-filter-group">
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Category:</span>
                            <select class="admin-filter-select" id="mb-filter-category" onchange="Rajpura_Admin.onMbCategoryFilterChange(this.value)">
                                ${catOptionsHtml}
                            </select>
                        </div>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Status:</span>
                            <select class="admin-filter-select" id="mb-filter-status" onchange="Rajpura_Admin.onMbStatusFilterChange(this.value)" style="min-width: 110px;">
                                <option value="ALL" ${st.statusFilter === 'ALL' ? 'selected' : ''}>All Statuses</option>
                                <option value="ACTIVE" ${st.statusFilter === 'ACTIVE' ? 'selected' : ''}>Active Only</option>
                                <option value="INACTIVE" ${st.statusFilter === 'INACTIVE' ? 'selected' : ''}>Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="admin-filter-group">
                        <button type="button" class="admin-btn-reset-filters" onclick="Rajpura_Admin.resetMbRecipeFilters()" title="Reset all filters">
                            Reset Filters
                        </button>
                        <div class="admin-filter-item">
                            <span class="admin-filter-label">Rows per page:</span>
                            <select class="admin-page-size-select" id="mb-page-size" onchange="Rajpura_Admin.onMbPageSizeChange(this.value)">
                                <option value="25" ${st.pageSize === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${st.pageSize === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${st.pageSize === 100 ? 'selected' : ''}>100</option>
                                <option value="9999" ${st.pageSize === 9999 ? 'selected' : ''}>All</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Product Recipes Table -->
                <div class="admin-table-container">
                    <table class="admin-product-table">
                        <thead>
                            <tr>
                                <th style="width: 22%;" class="admin-sortable-th ${st.sortBy === 'title' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onMbSortChange('title')">
                                    Variety & Category <span class="admin-sort-indicator">${st.sortBy === 'title' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 13%;">SKU(s)</th>
                                <th style="width: 13%;">Biscuits & Weight</th>
                                <th style="width: 18%;">Dimensions & Gauge</th>
                                <th style="width: 13%;">Baking & Moisture</th>
                                <th style="width: 11%;">Oil & Seasoning</th>
                                <th style="width: 5%; text-align: center;" class="admin-sortable-th ${st.sortBy === 'isActive' ? (st.sortAsc ? 'sorted-asc' : 'sorted-desc') : ''}" onclick="Rajpura_Admin.onMbSortChange('isActive')">
                                    Status <span class="admin-sort-indicator">${st.sortBy === 'isActive' ? (st.sortAsc ? '&#9650;' : '&#9660;') : '&#8645;'}</span>
                                </th>
                                <th style="width: 5%; text-align: center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="mb-recipe-table-mount">
                            <!-- Dynamic Paginated Rows Mounted Here -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination Footer -->
                <div id="mb-pagination-mount">
                    <!-- Pagination Controls Mounted Here -->
                </div>
            </div>
        `;
    },

    getMbDistinctCategories: function (recipes) {
        const counts = {};
        let total = 0;
        (recipes || []).forEach(r => {
            const cat = (r.productCategory && r.productCategory.trim()) ? r.productCategory.trim() : "General";
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });
        const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));
        const result = [{ value: "ALL", label: `All Categories (${total})` }];
        categories.forEach(c => {
            result.push({ value: c, label: `${c} (${counts[c]})` });
        });
        return result;
    },

    getFilteredMbRecipes: function (allRows) {
        const recipes = (allRows || this.configs.MixingAndBaking || []).filter(r => r.configType === "Product Recipe");
        const st = this.mbRecipeState;
        const search = (st.searchTerm || "").toLowerCase().trim();
        const cat = st.categoryFilter || "ALL";
        const status = st.statusFilter || "ALL";

        return recipes.filter(r => {
            if (cat !== "ALL") {
                const rCat = (r.productCategory && r.productCategory.trim()) ? r.productCategory.trim() : "General";
                if (rCat !== cat) return false;
            }
            if (status === "ACTIVE" && r.isActive === false) return false;
            if (status === "INACTIVE" && r.isActive !== false) return false;

            if (search) {
                const s = r.recipeConfig || r.standards || {};
                const t = (r.title || s.variety || "").toLowerCase();
                const k = (r.productCategory || "").toLowerCase();
                const skuStr = Array.isArray(s.sku || r.sku) ? (s.sku || r.sku).join(" ") : String(s.sku || r.sku || "");
                const skuRaw = String(s.skuRaw || "").toLowerCase();
                const gauge = String(s.gauge || "").toLowerCase();
                const moisture = String(s.moisture || s.moistureStandard || "").toLowerCase();
                const time = String(s.bakingTime || "").toLowerCase();
                const dia = String(s.diameter || s.biscuitDiameter || "").toLowerCase();
                const len = String(s.length || s.biscuitLength || "").toLowerCase();
                const wid = String(s.width || s.biscuitWidth || "").toLowerCase();
                const wt = String(s.dryBiscuitWeight || s.biscuitStdWeight || "").toLowerCase();

                if (!t.includes(search) &&
                    !k.includes(search) &&
                    !skuStr.toLowerCase().includes(search) &&
                    !skuRaw.includes(search) &&
                    !gauge.includes(search) &&
                    !moisture.includes(search) &&
                    !time.includes(search) &&
                    !dia.includes(search) &&
                    !len.includes(search) &&
                    !wid.includes(search) &&
                    !wt.includes(search)) {
                    return false;
                }
            }
            return true;
        }).sort((a, b) => {
            let valA = a[st.sortBy];
            let valB = b[st.sortBy];
            if (typeof valA === "boolean") {
                valA = valA ? 1 : 0;
                valB = valB ? 1 : 0;
            } else {
                valA = (valA || "").toString().toLowerCase();
                valB = (valB || "").toString().toLowerCase();
            }
            if (valA < valB) return st.sortAsc ? -1 : 1;
            if (valA > valB) return st.sortAsc ? 1 : -1;
            return 0;
        });
    },

    updateMbRecipeTable: function (allRows) {
        const tableBody = document.getElementById("mb-recipe-table-mount");
        const paginationMount = document.getElementById("mb-pagination-mount");
        if (!tableBody || !paginationMount) return;

        const rawRows = allRows || this.configs.MixingAndBaking || [];
        const totalCatalogCount = rawRows.filter(r => r.configType === "Product Recipe").length;
        const filtered = this.getFilteredMbRecipes(rawRows);
        const totalFiltered = filtered.length;

        const st = this.mbRecipeState;
        const pageSize = parseInt(st.pageSize, 10) || 25;
        const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

        if (st.currentPage > totalPages) st.currentPage = totalPages;
        if (st.currentPage < 1) st.currentPage = 1;
        const curPage = st.currentPage;

        const startIdx = (curPage - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, totalFiltered);
        const pageSlice = filtered.slice(startIdx, endIdx);

        const badge = document.getElementById("mb-recipe-counter-badge");
        if (badge) {
            badge.innerText = `${totalFiltered}${totalFiltered !== totalCatalogCount ? ` / ${totalCatalogCount}` : ''} items`;
        }

        if (pageSlice.length > 0) {
            tableBody.innerHTML = pageSlice.map(r => {
                const s = r.recipeConfig || r.standards || {};
                const rawSkus = s.sku || r.sku || [];
                const skus = Array.isArray(rawSkus) ? rawSkus : (typeof rawSkus === "string" ? rawSkus.split(",").map(x => x.trim()).filter(Boolean) : []);
                
                const numBiscuits = s.numberOfBiscuits !== undefined && s.numberOfBiscuits !== null && s.numberOfBiscuits !== "NA" ? s.numberOfBiscuits : (s.standardsSampleCount || "-");
                const dryWeight = s.dryBiscuitWeight || s.biscuitStdWeight || "-";
                const gauge = s.gauge && s.gauge !== "NA" ? s.gauge : null;
                const diameter = s.diameter && s.diameter !== "NA" ? s.diameter : (s.biscuitDiameter && s.biscuitDiameter !== "NA" ? s.biscuitDiameter : null);
                const length = s.length && s.length !== "NA" ? s.length : (s.biscuitLength && s.biscuitLength !== "NA" ? s.biscuitLength : null);
                const width = s.width && s.width !== "NA" ? s.width : (s.biscuitWidth && s.biscuitWidth !== "NA" ? s.biscuitWidth : null);
                const bakingTime = s.bakingTime && s.bakingTime !== "NA" ? s.bakingTime : null;
                const moisture = (s.moisture && s.moisture !== "NA" && s.moisture !== "—") ? s.moisture : (s.moistureStandard && s.moistureStandard !== "NA" ? s.moistureStandard : "-");
                const beforeOil = s.weightBeforeOil && s.weightBeforeOil !== "NA" ? s.weightBeforeOil : null;
                const afterOil = s.weightAfterOil && s.weightAfterOil !== "NA" ? s.weightAfterOil : (s.weightAfterOilSpray && s.weightAfterOilSpray !== "NA" ? s.weightAfterOilSpray : null);
                const seasoning = s.weightWithSeasoning && s.weightWithSeasoning !== "NA" ? s.weightWithSeasoning : null;

                return `
                <tr>
                    <td>
                        <div class="admin-product-name-cell">
                            <div class="product-avatar" style="background: #fef2f2; border-color: #fecaca; color: #dc2626;"></div>
                            <div>
                                <div class="product-name" style="font-weight: 700; color: #0f172a;">${this.escapeHtml(r.title || s.variety || 'Unknown')}</div>
                                <div style="margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 11px; font-weight: 600; color: #dc2626; background: #fee2e2; padding: 2px 7px; border-radius: 4px;">${this.escapeHtml(r.productCategory || "General")}</span>
                                    ${s.srNo ? `<span style="font-size: 11px; color: #64748b; font-weight: 600;">#${s.srNo}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${skus.length > 0 ? skus.map(k => `<span style="font-size: 11px; font-weight: 600; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 1px 6px; border-radius: 4px;">${this.escapeHtml(k)}</span>`).join("") : '<span style="color: #94a3b8; font-size: 12px;">-</span>'}
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                            <div><strong>${this.escapeHtml(String(numBiscuits))}</strong> ${typeof numBiscuits === 'number' || (!String(numBiscuits).includes('g') && !String(numBiscuits).includes('bis') && numBiscuits !== '-') ? 'bis' : ''}</div>
                            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Dry Wt: <strong style="color: #0f172a;">${this.escapeHtml(String(dryWeight))}</strong></div>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                            ${gauge ? `<div>Gauge: <strong style="color: #0f172a;">${this.escapeHtml(gauge)}</strong></div>` : ''}
                            ${diameter ? `<div>Dia: <strong>${this.escapeHtml(diameter)}</strong></div>` : ''}
                            ${(length || width) ? `<div>${length ? 'L: <strong>' + this.escapeHtml(length) + '</strong>' : ''} ${width ? 'W: <strong>' + this.escapeHtml(width) + '</strong>' : ''}</div>` : ''}
                            ${(!gauge && !diameter && !length && !width) ? '<span style="color: #94a3b8;">-</span>' : ''}
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 12px; line-height: 1.5; color: #334155;">
                            ${bakingTime ? `<div>Time: <strong>${this.escapeHtml(bakingTime)}</strong></div>` : ''}
                            <div>Moisture: <strong style="color: #15803d;">${this.escapeHtml(String(moisture))}</strong></div>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 11.5px; line-height: 1.4; color: #334155;">
                            ${beforeOil ? `<div>Pre-Oil: <strong>${this.escapeHtml(beforeOil)}</strong></div>` : ''}
                            ${afterOil ? `<div>Post-Oil: <strong>${this.escapeHtml(afterOil)}</strong></div>` : ''}
                            ${seasoning ? `<div style="color: #b45309;">Season: <strong>${this.escapeHtml(seasoning)}</strong></div>` : ''}
                            ${(!beforeOil && !afterOil && !seasoning) ? '<span style="color: #94a3b8;">-</span>' : ''}
                        </div>
                    </td>
                    <td style="text-align: center;">
                        <span class="admin-status-pill ${r.isActive !== false ? 'active' : 'inactive'}" style="cursor: pointer;" onclick="Rajpura_Admin.toggleMbRecipeActive(${r.id})" title="Click to toggle status">
                            &bull; ${r.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <div class="admin-product-actions">
                            <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.openEditMbRecipeModal(${r.id})" title="Edit Recipe Standards">
                                Edit
                            </button>
                            <button type="button" class="admin-btn-action" style="color: #dc2626;" onclick="Rajpura_Admin.deleteMbRecipe(${r.id})" title="Delete Recipe">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join("");
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 36px 20px; color: #64748b;">
                        <div style="font-size: 28px; margin-bottom: 6px;"></div>
                        <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No recipes match current variety filters</div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Try adjusting your variety search keyword or category filter.</div>
                        <button type="button" class="admin-btn-secondary" style="font-size: 12px; font-weight: 600; padding: 5px 12px;" onclick="Rajpura_Admin.resetMbRecipeFilters()">
                            Reset All Filters
                        </button>
                    </td>
                </tr>
            `;
        }

        if (totalFiltered === 0) {
            paginationMount.innerHTML = "";
            return;
        }

        const showingFrom = totalFiltered > 0 ? startIdx + 1 : 0;
        const showingTo = endIdx;

        const pageButtons = [];
        const maxVisibleButtons = 5;
        let startPage = Math.max(1, curPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
        if (endPage - startPage < maxVisibleButtons - 1) {
            startPage = Math.max(1, endPage - maxVisibleButtons + 1);
        }

        if (startPage > 1) {
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onMbRecipePageChange(1)">1</button>`);
            if (startPage > 2) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
        }

        for (let p = startPage; p <= endPage; p++) {
            pageButtons.push(`
                <button type="button" class="admin-page-btn ${p === curPage ? 'active' : ''}" onclick="Rajpura_Admin.onMbRecipePageChange(${p})">
                    ${p}
                </button>
            `);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageButtons.push(`<span class="admin-page-dots">&hellip;</span>`);
            }
            pageButtons.push(`<button type="button" class="admin-page-btn" onclick="Rajpura_Admin.onMbRecipePageChange(${totalPages})">${totalPages}</button>`);
        }

        paginationMount.innerHTML = `
            <div class="admin-pagination-container">
                <div class="admin-pagination-info">
                    <span>Showing <strong>${showingFrom}-${showingTo}</strong> of <strong>${totalFiltered}</strong> recipes${totalFiltered !== totalCatalogCount ? ` (filtered from ${totalCatalogCount})` : ''}</span>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <span>Page <strong>${curPage}</strong> of <strong>${totalPages}</strong></span>
                </div>
                <div class="admin-pagination-controls">
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onMbRecipePageChange(1)" title="First Page">
                        &laquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === 1 ? 'disabled' : ''} onclick="Rajpura_Admin.onMbRecipePageChange(${curPage - 1})" title="Previous Page">
                        &lsaquo;
                    </button>
                    ${pageButtons.join("")}
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onMbRecipePageChange(${curPage + 1})" title="Next Page">
                        &rsaquo;
                    </button>
                    <button type="button" class="admin-page-btn" ${curPage === totalPages ? 'disabled' : ''} onclick="Rajpura_Admin.onMbRecipePageChange(${totalPages})" title="Last Page">
                        &raquo;
                    </button>
                </div>
            </div>
        `;
    },

    onMbRecipeSearchInput: function (val) {
        this.mbRecipeState.searchTerm = val;
        this.mbRecipeState.currentPage = 1;
        const clearBtn = document.getElementById("mb-recipe-search-clear");
        if (clearBtn) clearBtn.style.display = val ? "inline-flex" : "none";
        if (this._mbSearchTimeout) clearTimeout(this._mbSearchTimeout);
        this._mbSearchTimeout = setTimeout(() => {
            this.updateMbRecipeTable();
        }, 120);
    },

    clearMbRecipeSearch: function () {
        this.mbRecipeState.searchTerm = "";
        this.mbRecipeState.currentPage = 1;
        const inp = document.getElementById("mb-recipe-search-input");
        if (inp) inp.value = "";
        const clearBtn = document.getElementById("mb-recipe-search-clear");
        if (clearBtn) clearBtn.style.display = "none";
        this.updateMbRecipeTable();
        if (inp) inp.focus();
    },

    onMbCategoryFilterChange: function (val) {
        this.mbRecipeState.categoryFilter = val;
        this.mbRecipeState.currentPage = 1;
        this.updateMbRecipeTable();
    },

    onMbStatusFilterChange: function (val) {
        this.mbRecipeState.statusFilter = val;
        this.mbRecipeState.currentPage = 1;
        this.updateMbRecipeTable();
    },

    onMbPageSizeChange: function (val) {
        this.mbRecipeState.pageSize = parseInt(val, 10) || 25;
        this.mbRecipeState.currentPage = 1;
        this.updateMbRecipeTable();
    },

    onMbRecipePageChange: function (page) {
        this.mbRecipeState.currentPage = page;
        this.updateMbRecipeTable();
        const card = document.getElementById("mb-recipe-catalogue-card");
        if (card) {
            try {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {}
        }
    },

    onMbSortChange: function (field) {
        if (this.mbRecipeState.sortBy === field) {
            this.mbRecipeState.sortAsc = !this.mbRecipeState.sortAsc;
        } else {
            this.mbRecipeState.sortBy = field;
            this.mbRecipeState.sortAsc = true;
        }
        this.renderCurrentTab();
    },

    resetMbRecipeFilters: function () {
        this.mbRecipeState.searchTerm = "";
        this.mbRecipeState.categoryFilter = "ALL";
        this.mbRecipeState.statusFilter = "ALL";
        this.mbRecipeState.currentPage = 1;
        const searchInput = document.getElementById("mb-recipe-search-input");
        if (searchInput) searchInput.value = "";
        const clearBtn = document.getElementById("mb-recipe-search-clear");
        if (clearBtn) clearBtn.style.display = "none";
        const catSelect = document.getElementById("mb-filter-category");
        if (catSelect) catSelect.value = "ALL";
        const statusSelect = document.getElementById("mb-filter-status");
        if (statusSelect) statusSelect.value = "ALL";
        this.updateMbRecipeTable();
    },

        switchMbModalTab: function (tabId) {
        document.querySelectorAll(".admin-modal-tab-btn").forEach(b => b.classList.remove("active"));
        const activeBtn = document.querySelector(`.admin-modal-tab-btn[onclick*="${tabId}"]`);
        if (activeBtn) activeBtn.classList.add("active");

        document.querySelectorAll(".admin-mb-modal-pane").forEach(p => p.style.display = "none");
        const activePane = document.getElementById(tabId);
        if (activePane) {
            activePane.style.display = "block";
            const modalBody = activePane.closest(".admin-modal-body");
            if (modalBody) modalBody.scrollTop = 0;
        }
    },

    /**
     * Add & Edit Modals for Mixing & Baking Product Recipe
     */
    openAddMbRecipeModal: function () {
        this.openMbRecipeModalInternal(null, {});
    },

    openEditMbRecipeModal: function (rowId) {
        const row = (this.configs.MixingAndBaking || []).find(r => r.id === rowId);
        if (!row) return;
        this.openMbRecipeModalInternal(rowId, row);
    },

    openMbRecipeModalInternal: function (rowId, row) {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isEdit = !!rowId;
        const s = (row && (row.recipeConfig || row.standards)) || {};
        const rawSkus = s.sku || (row && row.sku) || [];
        const skusStr = Array.isArray(rawSkus) ? rawSkus.join(", ") : String(rawSkus || "");

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card admin-modal-xl">
                    <div class="admin-modal-header" style="background: linear-gradient(90deg, #fff1f2 0%, #ffffff 100%);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;"></span>
                            <div>
                                <h4 class="admin-modal-title">${isEdit ? `Edit Product Recipe &bull; ${this.escapeHtml(row.title || s.variety || '')}` : "+ Add New Product Recipe &bull; Mixing & Baking"}</h4>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Mixing & Baking Quality Target Standards Master</div>
                            </div>
                        </div>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>

                    <div class="admin-modal-body" style="padding: 20px 24px; max-height: 76vh; overflow-y: auto;">
                        <!-- PINNED TOP CARD: PRODUCT IDENTIFICATION & SKUs -->
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
                            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                                <span></span> <span>Product Master Profile & Pack SKUs</span>
                            </div>
                            <div class="admin-modal-grid-4" style="align-items: flex-end;">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Product Name / Variety <span style="color: #dc2626;">*</span></label>
                                    <input type="text" id="modal-mb-title" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(row ? (row.title || s.variety || '') : '')}" placeholder="e.g. Party Cracker, Bledor Club, Marie classic" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Product Category</label>
                                    <select id="modal-mb-category" class="admin-form-input">
                                        <option value="Crackers" ${row && row.productCategory === 'Crackers' ? 'selected' : ''}>Crackers</option>
                                        <option value="Cookies" ${row && row.productCategory === 'Cookies' ? 'selected' : ''}>Cookies</option>
                                        <option value="Cream" ${row && row.productCategory === 'Cream' ? 'selected' : ''}>Cream</option>
                                        <option value="Health Biscuits" ${row && row.productCategory === 'Health Biscuits' ? 'selected' : ''}>Health Biscuits</option>
                                        <option value="Glucose" ${row && row.productCategory === 'Glucose' ? 'selected' : ''}>Glucose</option>
                                        <option value="Digestive" ${row && row.productCategory === 'Digestive' ? 'selected' : ''}>Digestive</option>
                                        <option value="Wafers" ${row && row.productCategory === 'Wafers' ? 'selected' : ''}>Wafers</option>
                                        <option value="General" ${(!row || !row.productCategory || row.productCategory === 'General') ? 'selected' : ''}>General</option>
                                    </select>
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Pack SKUs (comma-separated)</label>
                                    <input type="text" id="modal-mb-sku" class="admin-form-input" value="${this.escapeHtml(skusStr)}" placeholder="e.g. 32g, 35g, 60g, 70g, 140g, 400g" />
                                </div>
                                <div class="admin-form-group" style="padding-bottom: 6px;">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 7px 10px; border-radius: 6px;">
                                        <input type="checkbox" id="modal-mb-active" ${!row || row.isActive !== false ? 'checked' : ''} style="width: 17px; height: 17px; cursor: pointer;" />
                                        <span>Product Enabled</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- 4 SUBPARTS NAVIGATION TABS -->
                        <div class="admin-modal-tabs-nav">
                            <button type="button" class="admin-modal-tab-btn active" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-ing')">
                                <span class="tab-step-label">1. Ingredient Temps</span>
                                <span class="tab-step-sub">8 Parameters (RPO, Fats, Sugar)</span>
                            </button>
                            <button type="button" class="admin-modal-tab-btn" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mat')">
                                <span class="tab-step-label">2. Materials & Sponge</span>
                                <span class="tab-step-sub">14 Parameters (Chips, Nuts, Ferm)</span>
                            </button>
                            <button type="button" class="admin-modal-tab-btn" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mix')">
                                <span class="tab-step-label">3. Mixing & Dough</span>
                                <span class="tab-step-sub">8 Parameters (Timings, Wet Wt)</span>
                            </button>
                            <button type="button" class="admin-modal-tab-btn" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-bake')">
                                <span class="tab-step-label">4. Baking, Dimensions & Quality</span>
                                <span class="tab-step-sub">Gauge, Dia, Weights, Moisture</span>
                            </button>
                        </div>

                        <!-- SUBPART 1: INGREDIENT STANDARD TEMPERATURES (deg C) -->
                        <div id="mb-modal-tab-ing" class="admin-mb-modal-pane" style="display: block;">
                            <div class="admin-modal-section-title">Subpart 1 &bull; Ingredient Standard Temperatures (&deg;C)</div>
                            <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Standard target temperatures and particle sizes. When "NA" is set, the operator form automatically prefills "NA".</div>
                            
                            <div class="admin-modal-grid-4">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">RPO Standard (&deg;C)</label>
                                    <input type="text" id="modal-mb-rpostandard" class="admin-form-input" value="${this.escapeHtml(s.rpoStandard || '45')}" placeholder="e.g. 45" />
                                    <input type="hidden" id="modal-mb-rpoobserved" value="${this.escapeHtml(s.rpoObserved || '')}" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Solid Fat Standard (&deg;C)</label>
                                    <input type="text" id="modal-mb-solidfatstandard" class="admin-form-input" value="${this.escapeHtml(s.solidFatStandard || 'NA')}" placeholder="e.g. 15 or NA" />
                                    <input type="text" id="modal-mb-solidfatobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.solidFatObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Butter Standard (&deg;C)</label>
                                    <input type="text" id="modal-mb-butterstandard" class="admin-form-input" value="${this.escapeHtml(s.butterStandard || 'NA')}" placeholder="e.g. 5 or NA" />
                                    <input type="text" id="modal-mb-butterobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.butterObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Black Jack Standard (&deg;C)</label>
                                    <input type="text" id="modal-mb-blackjackstandard" class="admin-form-input" value="${this.escapeHtml(s.blackJackStandard || 'NA')}" placeholder="e.g. 35 or NA" />
                                    <input type="text" id="modal-mb-blackjackobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.blackJackObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Sponge Temp Std (&deg;C)</label>
                                    <input type="text" id="modal-mb-spongetempstandard" class="admin-form-input" value="${this.escapeHtml(s.spongeTempStandard || 'NA')}" placeholder="e.g. 28-30 or NA" />
                                    <input type="text" id="modal-mb-spongetempobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.spongeTempObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Slurry Standard (&deg;C)</label>
                                    <input type="text" id="modal-mb-slurrystandard" class="admin-form-input" value="${this.escapeHtml(s.slurryStandard || 'NA')}" placeholder="e.g. 30 or NA" />
                                    <input type="text" id="modal-mb-slurryobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.slurryObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Ground Sugar Temp Std (&deg;C)</label>
                                    <input type="text" id="modal-mb-groundsugartempstandard" class="admin-form-input" value="${this.escapeHtml(s.groundSugarTempStandard || 'NA')}" placeholder="e.g. 25 or NA" />
                                    <input type="text" id="modal-mb-groundsugartempobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.groundSugarTempObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Ground Sugar Particle Size</label>
                                    <input type="text" id="modal-mb-groundsugarparticlesizestandard" class="admin-form-input" value="${this.escapeHtml(s.groundSugarParticleSizeStandard || 'NA')}" placeholder="e.g. 100 mesh or NA" />
                                    <input type="text" id="modal-mb-groundsugarparticlesizeobserved" class="admin-form-input" style="margin-top: 4px; font-size: 11px; padding: 4px 8px; color: #64748b;" value="${this.escapeHtml(s.groundSugarParticleSizeObserved || '')}" placeholder="Observed default (e.g. NA)" />
                                </div>
                            </div>

                            <div class="admin-subpart-nav-footer">
                                <span style="font-size: 12px; color: #64748b;">Subpart 1 of 4 completed</span>
                                <button type="button" class="admin-btn-secondary" style="font-weight: 700; color: #dc2626; border-color: #f87171;" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mat')">
                                    Next: 2. Materials & Sponge
                                </button>
                            </div>
                        </div>

                        <!-- SUBPART 2: RAW MATERIALS, SYRUPS & SPONGE -->
                        <div id="mb-modal-tab-mat" class="admin-mb-modal-pane" style="display: none;">
                            <div class="admin-modal-section-title">Subpart 2.1 &bull; Choco Chips Specifications</div>
                            <div class="admin-modal-grid-4">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Supplier Name</label>
                                    <input type="text" id="modal-mb-chocochipssupplier" class="admin-form-input" value="${this.escapeHtml(s.chocoChipsSupplier || 'NA')}" placeholder="Supplier or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-chocochipstemp" class="admin-form-input" value="${this.escapeHtml(s.chocoChipsTemp || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Count / kg</label>
                                    <input type="text" id="modal-mb-chocochipscountperkg" class="admin-form-input" value="${this.escapeHtml(s.chocoChipsCountPerKg || 'NA')}" placeholder="Count or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Compound / Pure</label>
                                    <input type="text" id="modal-mb-chocochipscompoundorpure" class="admin-form-input" value="${this.escapeHtml(s.chocoChipsCompoundOrPure || 'NA')}" placeholder="Compound/Pure or NA" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 2.2 &bull; Cashew & Flour Specifications</div>
                            <div class="admin-modal-grid-4">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Cashew Supplier</label>
                                    <input type="text" id="modal-mb-cashewsupplier" class="admin-form-input" value="${this.escapeHtml(s.cashewSupplier || 'NA')}" placeholder="Supplier or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Cashew Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-cashewtemp" class="admin-form-input" value="${this.escapeHtml(s.cashewTemp || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Cashew Count / kg</label>
                                    <input type="text" id="modal-mb-cashewcountperkg" class="admin-form-input" value="${this.escapeHtml(s.cashewCountPerKg || 'NA')}" placeholder="Count or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Flour Supplier</label>
                                    <input type="text" id="modal-mb-floursupplier" class="admin-form-input" value="${this.escapeHtml(s.flourSupplier || 'NA')}" placeholder="Supplier or NA" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 2.3 &bull; Syrups & Liquid Sugars</div>
                            <div class="admin-modal-grid-2">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Invert Syrup Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-invertsyruptemp" class="admin-form-input" value="${this.escapeHtml(s.invertSyrupTemp || '35')}" placeholder="e.g. 35 or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Black Jack (2nd Stage) Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-blackjack2temp" class="admin-form-input" value="${this.escapeHtml(s.blackJack2Temp || 'NA')}" placeholder="e.g. 35 or NA" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 2.4 &bull; Mixing Sponge & Fermentation Targets</div>
                            <div class="admin-modal-grid-4">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Sponge Product Name</label>
                                    <input type="text" id="modal-mb-spongeproductname" class="admin-form-input" value="${this.escapeHtml(s.spongeProductName || 'NA')}" placeholder="e.g. Marie Sponge or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Water Quantity (kg/L)</label>
                                    <input type="text" id="modal-mb-spongewaterquantity" class="admin-form-input" value="${this.escapeHtml(s.spongeWaterQuantity || 'NA')}" placeholder="Qty or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Yeast Quantity (kg)</label>
                                    <input type="text" id="modal-mb-spongeyeastquantity" class="admin-form-input" value="${this.escapeHtml(s.spongeYeastQuantity || 'NA')}" placeholder="Qty or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Water Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-spongewatertemp" class="admin-form-input" value="${this.escapeHtml(s.spongeWaterTemp || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Ferm Start Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-fermentationstarttemp" class="admin-form-input" value="${this.escapeHtml(s.fermentationStartTemp || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Ferm Room Temp (&deg;C)</label>
                                    <input type="text" id="modal-mb-fermentationroomtemp" class="admin-form-input" value="${this.escapeHtml(s.fermentationRoomTemp || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Final Temp (After Ferm)</label>
                                    <input type="text" id="modal-mb-finaltempafterfermentation" class="admin-form-input" value="${this.escapeHtml(s.finalTempAfterFermentation || 'NA')}" placeholder="Temp or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Final pH</label>
                                    <input type="text" id="modal-mb-finalphafterfermentation" class="admin-form-input" value="${this.escapeHtml(s.finalPhAfterFermentation || 'NA')}" placeholder="pH or NA" />
                                </div>
                            </div>

                            <div class="admin-subpart-nav-footer">
                                <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-ing')">
                                    Back: 1. Ingredient Temps
                                </button>
                                <button type="button" class="admin-btn-secondary" style="font-weight: 700; color: #dc2626; border-color: #f87171;" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mix')">
                                    Next: 3. Mixing & Dough
                                </button>
                            </div>
                        </div>

                        <!-- SUBPART 3: DOUGH MIXING & FORMING -->
                        <div id="mb-modal-tab-mix" class="admin-mb-modal-pane" style="display: none;">
                            <div class="admin-modal-section-title">Subpart 3.1 &bull; Dough Mixing Targets</div>
                            <div class="admin-modal-grid-4">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Creaming Time Std</label>
                                    <input type="text" id="modal-mb-creamingtimestandard" class="admin-form-input" value="${this.escapeHtml(s.creamingTimeStandard || '10 min')}" placeholder="e.g. 10 min" />
                                    <input type="hidden" id="modal-mb-creamingtimeobserved" value="${this.escapeHtml(s.creamingTimeObserved || '')}" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Mixing Time Std</label>
                                    <input type="text" id="modal-mb-mixingtimestandard" class="admin-form-input" value="${this.escapeHtml(s.mixingTimeStandard || '5 Min')}" placeholder="e.g. 5 Min" />
                                    <input type="hidden" id="modal-mb-mixingtimeobserved" value="${this.escapeHtml(s.mixingTimeObserved || '')}" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Dough Temp Std (&deg;C)</label>
                                    <input type="text" id="modal-mb-doughtempstandard" class="admin-form-input" value="${this.escapeHtml(s.doughTempStandard || '32-35')}" placeholder="e.g. 32-35" />
                                    <input type="hidden" id="modal-mb-doughtempobserved" value="${this.escapeHtml(s.doughTempObserved || '')}" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Dough Standing Time</label>
                                    <input type="text" id="modal-mb-doughstandingtimestandard" class="admin-form-input" value="${this.escapeHtml(s.doughStandingTimeStandard || '10 Min')}" placeholder="e.g. 10 Min" />
                                    <input type="hidden" id="modal-mb-doughstandingtimeobserved" value="${this.escapeHtml(s.doughStandingTimeObserved || '')}" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 3.2 &bull; Forming & Moulding Specifications</div>
                            <div class="admin-modal-grid-3">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Moulder RPM / Strokes</label>
                                    <input type="text" id="modal-mb-moulderrpmstrokes" class="admin-form-input" value="${this.escapeHtml(s.moulderRpmStrokes || 'NA')}" placeholder="e.g. 45 or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Forming Sample Count</label>
                                    <input type="text" id="modal-mb-formingsamplecount" class="admin-form-input" value="${this.escapeHtml(s.formingSampleCount || '10 bis')}" placeholder="e.g. 10 bis, 14 bis" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Standard Wet Weight</label>
                                    <input type="text" id="modal-mb-standardwetweight" class="admin-form-input" value="${this.escapeHtml(s.standardWetWeight || '31g')}" placeholder="e.g. 31g, 58g" />
                                </div>
                            </div>

                            <div class="admin-subpart-nav-footer">
                                <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mat')">
                                    Back: 2. Materials & Sponge
                                </button>
                                <button type="button" class="admin-btn-secondary" style="font-weight: 700; color: #dc2626; border-color: #f87171;" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-bake')">
                                    Next: 4. Baking, Dimensions & Quality
                                </button>
                            </div>
                        </div>

                        <!-- SUBPART 4: BAKING, DIMENSIONS & QUALITY -->
                        <div id="mb-modal-tab-bake" class="admin-mb-modal-pane" style="display: none;">
                            <div class="admin-modal-section-title">Subpart 4.1 &bull; Baking Profile & Timings</div>
                            <div class="admin-modal-grid-2" style="align-items: center; margin-bottom: 14px;">
                                <div class="admin-form-group">
                                    <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; background: #fff5f5; border: 1px solid #fed7aa; padding: 10px 14px; border-radius: 8px;">
                                        <input type="checkbox" id="modal-mb-bakingprofileaspertemplate" ${s.bakingProfileAsPerTemplate !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                                        <span>Baking Profile As Per Template</span>
                                    </label>
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Baking Time</label>
                                    <input type="text" id="modal-mb-bakingtime" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(s.bakingTime || '')}" placeholder="e.g. 4'45\", 4\", 5'50\", 6'30\"" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 4.2 &bull; Biscuit Physical Dimensions, Count & Weight</div>
                            <div class="admin-modal-grid-3">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Number of Biscuits (Count) <span style="color: #dc2626;">*</span></label>
                                    <input type="text" id="modal-mb-numberofbiscuits" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(s.numberOfBiscuits !== undefined && s.numberOfBiscuits !== null ? String(s.numberOfBiscuits) : (s.standardsSampleCount || ''))}" placeholder="e.g. 11, 10, 15, 3" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Dry Biscuit Weight <span style="color: #dc2626;">*</span></label>
                                    <input type="text" id="modal-mb-drybiscuitweight" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(s.dryBiscuitWeight || s.biscuitStdWeight || '')}" placeholder="e.g. 32g, 25g, 78g" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Gauge Specification</label>
                                    <input type="text" id="modal-mb-gauge" class="admin-form-input" value="${this.escapeHtml(s.gauge || '')}" placeholder="e.g. 69±1mm, 13±1mm, 40±1mm" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Diameter Specification</label>
                                    <input type="text" id="modal-mb-biscuitdiameter" class="admin-form-input" value="${this.escapeHtml(s.diameter || s.biscuitDiameter || '')}" placeholder="e.g. 44±1mm, 48±1mm, 58±1mm" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Length Specification</label>
                                    <input type="text" id="modal-mb-biscuitlength" class="admin-form-input" value="${this.escapeHtml(s.length || s.biscuitLength || '')}" placeholder="e.g. 95±1mm, 42±1mm, 60+1mm" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Width Specification</label>
                                    <input type="text" id="modal-mb-biscuitwidth" class="admin-form-input" value="${this.escapeHtml(s.width || s.biscuitWidth || '')}" placeholder="e.g. 60±1mm, 42±1mm, 60+1mm" />
                                </div>
                            </div>

                            <div class="admin-modal-section-title">Subpart 4.3 &bull; Oil, Seasoning & Quality Moisture Standards</div>
                            <div class="admin-modal-grid-3">
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Weight Before Oil</label>
                                    <input type="text" id="modal-mb-weightbeforeoil" class="admin-form-input" value="${this.escapeHtml(s.weightBeforeOil || '')}" placeholder="e.g. 29.72g, 23g, 71.8g" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Weight After Oil</label>
                                    <input type="text" id="modal-mb-weightafteroil" class="admin-form-input" value="${this.escapeHtml(s.weightAfterOil || s.weightAfterOilSpray || '')}" placeholder="e.g. 32g, 25g, 73g" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Weight With Seasoning</label>
                                    <input type="text" id="modal-mb-weightwithseasoning" class="admin-form-input" value="${this.escapeHtml(s.weightWithSeasoning || '')}" placeholder="e.g. 25g or NA" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Moisture Standard % <span style="color: #dc2626;">*</span></label>
                                    <input type="text" id="modal-mb-moisturestandard" class="admin-form-input" style="font-weight: 700; color: #15803d;" value="${this.escapeHtml(s.moisture || s.moistureStandard || '')}" placeholder="e.g. 2.25%, 2.00%, 1.75%" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Top Colour Standard</label>
                                    <input type="text" id="modal-mb-topcolourstandard" class="admin-form-input" value="${this.escapeHtml(s.topColourStandard || 'As per std')}" placeholder="As per std" />
                                    <input type="hidden" id="modal-mb-topcolourobserved" value="${this.escapeHtml(s.topColourObserved || 'As per std')}" />
                                </div>
                                <div class="admin-form-group">
                                    <label class="admin-form-label">Bottom Colour Standard</label>
                                    <input type="text" id="modal-mb-bottomcolourstandard" class="admin-form-input" value="${this.escapeHtml(s.bottomColourStandard || 'As per std')}" placeholder="As per std" />
                                    <input type="hidden" id="modal-mb-bottomcolourobserved" value="${this.escapeHtml(s.bottomColourObserved || 'As per std')}" />
                                </div>
                            </div>

                            <div class="admin-subpart-nav-footer">
                                <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.switchMbModalTab('mb-modal-tab-mix')">
                                    Back: 3. Mixing & Dough
                                </button>
                                <button type="button" class="admin-btn-primary" style="background: #dc2626; border-color: #dc2626; font-weight: 700;" onclick="Rajpura_Admin.saveMbRecipe(${rowId || 'null'})">
                                    Save Complete Recipe (All Parameters)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-mb-recipe" style="background: #dc2626; border-color: #dc2626;" onclick="Rajpura_Admin.saveMbRecipe(${rowId || 'null'})">
                            ${isEdit ? 'Save Recipe Changes' : 'Save Product Recipe'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    saveMbRecipe: async function (rowId) {
        const title = document.getElementById("modal-mb-title")?.value.trim();
        const category = document.getElementById("modal-mb-category")?.value.trim() || "General";
        const isActive = document.getElementById("modal-mb-active")?.checked !== false;

        if (!title) {
            alert("Please enter a Product Name / Variety");
            return;
        }

        const val = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : "";
        };

        const isChk = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        };

        const rawSku = val("modal-mb-sku");
        const skuArray = rawSku ? rawSku.split(",").map(x => x.trim()).filter(Boolean) : [];

        const numBiscuitsRaw = val("modal-mb-numberofbiscuits");
        const parsedNumBiscuits = /^d+$/.test(numBiscuitsRaw) ? parseInt(numBiscuitsRaw, 10) : (numBiscuitsRaw || "NA");

        const dryWt = val("modal-mb-drybiscuitweight") || "NA";
        const gaugeVal = val("modal-mb-gauge") || "NA";
        const diaVal = val("modal-mb-biscuitdiameter") || "NA";
        const lenVal = val("modal-mb-biscuitlength") || "NA";
        const widVal = val("modal-mb-biscuitwidth") || "NA";
        const moistureVal = val("modal-mb-moisturestandard") || "NA";
        const bakeTime = val("modal-mb-bakingtime") || "NA";
        const preOil = val("modal-mb-weightbeforeoil") || "NA";
        const postOil = val("modal-mb-weightafteroil") || "NA";
        const seasonVal = val("modal-mb-weightwithseasoning") || "NA";

        const existingRow = rowId ? (this.configs.MixingAndBaking || []).find(r => r.id === rowId) : null;
        const existingStandards = (existingRow && (existingRow.recipeConfig || existingRow.standards)) || {};

        const standards = {
            // Core dataset fields
            srNo: existingStandards.srNo || (existingRow ? existingRow.srNo : null) || rowId || 1,
            variety: title,
            sku: skuArray,
            numberOfBiscuits: parsedNumBiscuits,
            dryBiscuitWeight: dryWt,
            gauge: gaugeVal,
            diameter: diaVal,
            length: lenVal,
            width: widVal,
            moisture: moistureVal,
            bakingTime: bakeTime,
            weightBeforeOil: preOil,
            weightAfterOil: postOil,
            weightWithSeasoning: seasonVal,

            // Legacy parameter field aliases for backward compatibility with checklist:
            formingSampleCount: String(parsedNumBiscuits),
            standardsSampleCount: String(parsedNumBiscuits),
            biscuitStdWeight: dryWt,
            biscuitDiameter: diaVal,
            biscuitLength: lenVal,
            biscuitWidth: widVal,
            moistureStandard: moistureVal,
            weightAfterOilSpray: postOil,
            bakingProfileAsPerTemplate: isChk("modal-mb-bakingprofileaspertemplate"),

            // 1. Ingredient Standard Temperatures (deg C)
            rpoStandard: val("modal-mb-rpostandard") || existingStandards.rpoStandard || "45",
            solidFatStandard: val("modal-mb-solidfatstandard") || existingStandards.solidFatStandard || "NA",
            butterStandard: val("modal-mb-butterstandard") || existingStandards.butterStandard || "NA",
            blackJackStandard: val("modal-mb-blackjackstandard") || existingStandards.blackJackStandard || "NA",
            spongeTempStandard: val("modal-mb-spongetempstandard") || existingStandards.spongeTempStandard || "NA",
            slurryStandard: val("modal-mb-slurrystandard") || existingStandards.slurryStandard || "NA",
            groundSugarTempStandard: val("modal-mb-groundsugartempstandard") || existingStandards.groundSugarTempStandard || "NA",
            groundSugarParticleSizeStandard: val("modal-mb-groundsugarparticlesizestandard") || existingStandards.groundSugarParticleSizeStandard || "NA",

            // 2. Observed fields auto-set
            rpoObserved: val("modal-mb-rpoobserved") || "",
            butterObserved: val("modal-mb-butterobserved") || "",
            solidFatObserved: val("modal-mb-solidfatobserved") || "",
            blackJackObserved: val("modal-mb-blackjackobserved") || "",
            spongeTempObserved: val("modal-mb-spongetempobserved") || "",
            slurryObserved: val("modal-mb-slurryobserved") || "",
            groundSugarTempObserved: val("modal-mb-groundsugartempobserved") || "",
            groundSugarParticleSizeObserved: val("modal-mb-groundsugarparticlesizeobserved") || "",

            // 3. Raw Material Suppliers
            chocoChipsSupplier: val("modal-mb-chocochipssupplier") || existingStandards.chocoChipsSupplier || "NA",
            chocoChipsTemp: val("modal-mb-chocochipstemp") || existingStandards.chocoChipsTemp || "NA",
            chocoChipsCountPerKg: val("modal-mb-chocochipscountperkg") || existingStandards.chocoChipsCountPerKg || "NA",
            chocoChipsCompoundOrPure: val("modal-mb-chocochipscompoundorpure") || existingStandards.chocoChipsCompoundOrPure || "NA",

            cashewSupplier: val("modal-mb-cashewsupplier") || existingStandards.cashewSupplier || "NA",
            cashewTemp: val("modal-mb-cashewtemp") || existingStandards.cashewTemp || "NA",
            cashewCountPerKg: val("modal-mb-cashewcountperkg") || existingStandards.cashewCountPerKg || "NA",
            cashewCompoundOrPure: val("modal-mb-cashewcompoundorpure") || existingStandards.cashewCompoundOrPure || "NA",

            flourSupplier: val("modal-mb-floursupplier") || existingStandards.flourSupplier || "NA",

            // 4. Syrups & Liquid Sugars
            invertSyrupTemp: val("modal-mb-invertsyruptemp") || existingStandards.invertSyrupTemp || "35",
            blackJack2Temp: val("modal-mb-blackjack2temp") || existingStandards.blackJack2Temp || "NA",

            // 5. Sponge & Fermentation
            spongeProductName: val("modal-mb-spongeproductname") || existingStandards.spongeProductName || "NA",
            spongeWaterQuantity: val("modal-mb-spongewaterquantity") || existingStandards.spongeWaterQuantity || "NA",
            spongeYeastQuantity: val("modal-mb-spongeyeastquantity") || existingStandards.spongeYeastQuantity || "NA",
            spongeWaterTemp: val("modal-mb-spongewatertemp") || existingStandards.spongeWaterTemp || "NA",
            fermentationStartTemp: val("modal-mb-fermentationstarttemp") || existingStandards.fermentationStartTemp || "NA",
            fermentationRoomTemp: val("modal-mb-fermentationroomtemp") || existingStandards.fermentationRoomTemp || "NA",
            finalTempAfterFermentation: val("modal-mb-finaltempafterfermentation") || existingStandards.finalTempAfterFermentation || "NA",
            finalPhAfterFermentation: val("modal-mb-finalphafterfermentation") || existingStandards.finalPhAfterFermentation || "NA",

            // 6. Dough Mixing Standards
            creamingTimeStandard: val("modal-mb-creamingtimestandard") || existingStandards.creamingTimeStandard || "10 min",
            creamingTimeObserved: val("modal-mb-creamingtimeobserved") || "",
            mixingTimeStandard: val("modal-mb-mixingtimestandard") || existingStandards.mixingTimeStandard || "5 Min",
            mixingTimeObserved: val("modal-mb-mixingtimeobserved") || "",
            doughTempStandard: val("modal-mb-doughtempstandard") || existingStandards.doughTempStandard || "32-35",
            doughTempObserved: val("modal-mb-doughtempobserved") || "",
            doughStandingTimeStandard: val("modal-mb-doughstandingtimestandard") || existingStandards.doughStandingTimeStandard || "10 Min",
            doughStandingTimeObserved: val("modal-mb-doughstandingtimeobserved") || "",

            // 7. Forming & Moulding
            moulderRpmStrokes: val("modal-mb-moulderrpmstrokes") || existingStandards.moulderRpmStrokes || "NA",
            standardWetWeight: val("modal-mb-standardwetweight") || existingStandards.standardWetWeight || "NA",

            // 8. Colors
            topColourStandard: val("modal-mb-topcolourstandard") || "As per std",
            topColourObserved: val("modal-mb-topcolourobserved") || "As per std",
            bottomColourStandard: val("modal-mb-bottomcolourstandard") || "As per std",
            bottomColourObserved: val("modal-mb-bottomcolourobserved") || "As per std"
        };

        const btn = document.getElementById("btn-save-mb-recipe");
        if (btn) { btn.innerText = "Saving Recipe..."; btn.disabled = true; }

        const payload = {
            Title: title,
            ConfigType: "Product Recipe",
            ProductCategory: category,
            Plant: "Rajpura",
            IsActive: isActive,
            RecipeConfig: JSON.stringify(standards)
        };

        const success = await this.persistItemToSharePoint("MixingAndBaking", rowId, payload);
        if (success) {
            // Clear DAL cache if loaded in same window context
            if (typeof MixingBaking_DAL !== "undefined" && MixingBaking_DAL.recipesCache) {
                MixingBaking_DAL.recipesCache = null;
            }
            this.showToast(rowId ? `Recipe for '${title}' updated successfully` : `Recipe for '${title}' created successfully`, "success");
            this.closeModal();
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else if (btn) {
            btn.innerText = "Save Product Recipe";
            btn.disabled = false;
        }
    },

    toggleMbRecipeActive: async function (rowId) {
        const row = (this.configs.MixingAndBaking || []).find(r => r.id === rowId);
        if (!row) return;

        const newStatus = row.isActive === false ? true : false;
        row.isActive = newStatus;

        const payload = {
            Title: (row.raw && typeof row.raw.Title === "string") ? row.raw.Title : row.title,
            Plant: "Rajpura",
            ConfigType: "Product Recipe",
            ProductCategory: row.productCategory || "General",
            IsActive: newStatus,
            RecipeConfig: typeof row.recipeConfig === "object" ? JSON.stringify(row.recipeConfig) : (row.recipeConfig || "{}")
        };

        await this.persistItemToSharePoint("MixingAndBaking", rowId, payload);
        this.showToast(`Product Recipe '${row.title}' set to ${newStatus ? 'Active' : 'Inactive'}`, "info");
        this.renderCurrentTab();
        this.updateStatsCounters();
    },

    deleteMbRecipe: async function (rowId) {
        const row = (this.configs.MixingAndBaking || []).find(r => r.id === rowId);
        if (!row) return;

        if (!confirm(`Are you sure you want to delete product recipe '${row.title}'?`)) {
            return;
        }

        const siteUrl = this.getSiteUrl();
        const listName = "Quality-Rajpura-MixingBaking";

        if (siteUrl && rowId && typeof rowId === "number" && rowId < 900) {
            try {
                const digest = await this.getFormDigest();
                const deleteUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${rowId})`;
                await fetch(deleteUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": digest,
                        "X-HTTP-Method": "DELETE",
                        "If-Match": "*"
                    }
                });
            } catch (e) {
                console.warn("SharePoint delete error:", e);
            }
        }

        this.configs.MixingAndBaking = (this.configs.MixingAndBaking || []).filter(r => r.id !== rowId);
        if (typeof MixingBaking_DAL !== "undefined" && MixingBaking_DAL.recipesCache) {
            MixingBaking_DAL.recipesCache = null;
        }

        this.showToast(`Product Recipe '${row.title}' deleted successfully`, "info");
        this.renderCurrentTab();
        this.updateStatsCounters();
    },

    deleteAllMbRecipes: async function () {
        const currentRecipes = (this.configs.MixingAndBaking || []).filter(r => r.configType === "Product Recipe");
        
        if (!confirm(`Are you sure you want to DELETE ALL (${currentRecipes.length}) Product Recipes from Mixing & Baking in SharePoint? This action cannot be undone.`)) {
            return;
        }

        const btn1 = document.getElementById("admin-btn-delete-all-mb");
        const btn2 = document.getElementById("admin-btn-delete-all-mb-top");
        const updateBtns = (txt, dis) => {
            [btn1, btn2].forEach(b => {
                if (b) {
                    b.disabled = !!dis;
                    b.innerHTML = txt;
                }
            });
        };

        updateBtns(`Deleting all recipes...`, true);

        const siteUrl = this.getSiteUrl();
        const listName = "Quality-Rajpura-MixingBaking";
        let deletedCount = 0;

        try {
            if (siteUrl) {
                const digest = await this.getFormDigest();
                let existingItems = [];
                try {
                    let existingRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$select=Id,Title,ConfigType&$top=5000`, {
                        headers: { "Accept": "application/json;odata=verbose" }
                    });
                    if (!existingRes.ok) {
                        existingRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$select=Id,Title&$top=5000`, {
                            headers: { "Accept": "application/json;odata=verbose" }
                        });
                    }
                    if (existingRes.ok) {
                        const existingData = await existingRes.json();
                        existingItems = (existingData.d && existingData.d.results) || [];
                    }
                } catch (e) {
                    console.warn("Could not fetch items from SharePoint for deletion:", e);
                }

                const recipeItemsToDelete = existingItems.filter(ex => {
                    const ct = (ex.ConfigType || "").trim().toLowerCase();
                    return ct === "product recipe" || ct === "productrecipe" || ct === "recipe" || (ex.Id && ex.Id > 1);
                });

                if (recipeItemsToDelete.length > 0) {
                    let delIdx = 0;
                    for (const oldItem of recipeItemsToDelete) {
                        delIdx++;
                        if (delIdx % 5 === 0 || delIdx === recipeItemsToDelete.length) {
                            updateBtns(`Deleting (${delIdx} / ${recipeItemsToDelete.length})...`, true);
                        }
                        const deleteUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items(${oldItem.Id})`;
                        try {
                            const delRes = await fetch(deleteUrl, {
                                method: "POST",
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "Content-Type": "application/json;odata=verbose",
                                    "X-RequestDigest": digest,
                                    "X-HTTP-Method": "DELETE",
                                    "If-Match": "*"
                                }
                            });
                            if (delRes.ok) {
                                deletedCount++;
                            }
                        } catch (delErr) {
                            console.warn("Error deleting recipe item ID " + oldItem.Id, delErr);
                        }
                    }
                }
            }

            // Clean in-memory configs
            this.configs.MixingAndBaking = (this.configs.MixingAndBaking || []).filter(r => r.configType !== "Product Recipe");
            if (typeof MixingBaking_DAL !== "undefined" && MixingBaking_DAL.recipesCache) {
                MixingBaking_DAL.recipesCache = null;
            }

            if (deletedCount > 0) {
                this.showToast(`Successfully deleted ${deletedCount} product recipes from SharePoint list.`, "success");
            } else {
                this.showToast(`All product recipes deleted.`, "info");
            }

            await this.loadSingleFormConfig("MixingAndBaking");
            this.renderCurrentTab();
            this.updateStatsCounters();
        } catch (err) {
            console.error("Error deleting all recipes:", err);
            this.showToast("Error deleting recipes: " + (err.message || err), "error");
        } finally {
            updateBtns(`Delete All Recipes`, false);
        }
    },

    /**
     * Complete Master Seed Dataset for standard 71 Mrs. Bectors Products (Mixing & Baking)
     */
    getStandardMbSeedRecipes: function () {
        if (typeof MB_RECIPES_SEED_DATA !== "undefined" && Array.isArray(MB_RECIPES_SEED_DATA) && MB_RECIPES_SEED_DATA.length > 0) {
            return MB_RECIPES_SEED_DATA;
        }
        if (typeof window !== "undefined" && window.MB_RECIPES_SEED_DATA && Array.isArray(window.MB_RECIPES_SEED_DATA) && window.MB_RECIPES_SEED_DATA.length > 0) {
            return window.MB_RECIPES_SEED_DATA;
        }
        return [];
    },

    seedMbRecipesMasterData: async function () {
        console.warn("Seeding functionality is disabled in the admin panel.");
        this.showToast("Seeding master data is currently disabled.", "warning");
        return;
    },

    /**
     * seedPkgProductMasterData: async function () {
        console.warn("Seeding functionality is disabled in the admin panel.");
        this.showToast("Seeding master data is currently disabled.", "warning");
        return;

        let rawSeedList = (typeof PKG_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(PKG_PRODUCTS_SEED_DATA) && PKG_PRODUCTS_SEED_DATA.length > 0)
            ? PKG_PRODUCTS_SEED_DATA
            : ((typeof window !== "undefined" && window.PKG_PRODUCTS_SEED_DATA && Array.isArray(window.PKG_PRODUCTS_SEED_DATA) && window.PKG_PRODUCTS_SEED_DATA.length > 0)
                ? window.PKG_PRODUCTS_SEED_DATA
                : []);

        if (rawSeedList.length === 0) {
            updateBtns(`Loading seed dataset...`, true);
            try {
                const siteUrl = this.getSiteUrl();
                const seedUrl = (siteUrl ? siteUrl : "/sites/Mrs_Bectors_PTMS") + "/BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/pkg-products-seed.js?v=" + Date.now();
                await new Promise((resolve) => {
                    const s = document.createElement("script");
                    s.src = seedUrl;
                    s.onload = resolve;
                    s.onerror = resolve;
                    document.head.appendChild(s);
                });
            } catch (e) {
                console.warn("Dynamic load of pkg-products-seed.js failed:", e);
            }

            rawSeedList = (typeof PKG_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(PKG_PRODUCTS_SEED_DATA) && PKG_PRODUCTS_SEED_DATA.length > 0)
                ? PKG_PRODUCTS_SEED_DATA
                : ((typeof window !== "undefined" && window.PKG_PRODUCTS_SEED_DATA && Array.isArray(window.PKG_PRODUCTS_SEED_DATA) && window.PKG_PRODUCTS_SEED_DATA.length > 0)
                    ? window.PKG_PRODUCTS_SEED_DATA
                    : []);
        }

        if (rawSeedList.length === 0) {
            this.showToast("Could not load master seed products from pkg-products-seed.js.", "warning");
            updateBtns(`Bulk Add / Seed (1,105)`, false);
            if (btn1) btn1.innerHTML = `Seed Master Records (1,105)`;
            return;
        }

        updateBtns(`Initializing (${rawSeedList.length} items)...`, true);

        const siteUrl = this.getSiteUrl();
        const listName = "Quality-Rajpura-PackagingOperations";

        try {
            const digest = await this.getFormDigest();
            let insertedCount = 0;
            let skippedCount = 0;

            let entityTypeName = "SP.Data.Quality_x002d_Rajpura_x002d_PackagingOperationsListItem";
            try {
                const listMetaRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')?$select=ListItemEntityTypeFullName`, {
                    headers: { "Accept": "application/json;odata=verbose" }
                });
                if (listMetaRes.ok) {
                    const listMetaData = await listMetaRes.json();
                    if (listMetaData.d && listMetaData.d.ListItemEntityTypeFullName) {
                        entityTypeName = listMetaData.d.ListItemEntityTypeFullName;
                    }
                }
            } catch (e) {}

            // Query existing items with pagination to avoid duplicates
            let existingItems = [];
            try {
                let nextUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$select=Id,Title,ProductCode,ConfigType&$top=5000`;
                while (nextUrl) {
                    const existingRes = await fetch(nextUrl, {
                        headers: { "Accept": "application/json;odata=verbose" }
                    });
                    if (existingRes.ok) {
                        const existingData = await existingRes.json();
                        const pageItems = (existingData.d && existingData.d.results) ? existingData.d.results : [];
                        existingItems = existingItems.concat(pageItems);
                        nextUrl = (existingData.d && existingData.d.__next) ? existingData.d.__next : null;
                    } else {
                        break;
                    }
                }
            } catch (fetchErr) {
                console.warn("Could not query existing items from list:", fetchErr);
            }

            const existingMap = new Set(existingItems.map(ex => (ex.Title || "").trim().toLowerCase()));

            // Filter items that need insertion
            const toInsert = rawSeedList.filter(item => {
                const titleLower = (item.title || "").trim().toLowerCase();
                if (existingMap.has(titleLower)) {
                    skippedCount++;
                    return false;
                }
                return true;
            });

            console.log(`Packaging Operations: ${existingItems.length} existing in list, ${toInsert.length} to insert, ${skippedCount} skipped.`);

            // Insert in parallel batches (chunk size 15 for fast & reliable SharePoint execution)
            const chunkSize = 15;
            for (let i = 0; i < toInsert.length; i += chunkSize) {
                const chunk = toInsert.slice(i, i + chunkSize);
                updateBtns(`Seeding Products (${insertedCount + skippedCount} / ${rawSeedList.length})...`, true);

                await Promise.all(chunk.map(async (item) => {
                    const postUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
                    const payload = {
                        __metadata: { type: entityTypeName },
                        Title: item.title,
                        ConfigType: "Product Master",
                        ProductCode: item.productCode || "",
                        LineName: item.lineName || "Line 1",
                        ProductCategory: item.productCategory || "General",
                        Plant: "Rajpura",
                        IsActive: true
                    };

                    try {
                        const res = await fetch(postUrl, {
                            method: "POST",
                            headers: {
                                "Accept": "application/json;odata=verbose",
                                "Content-Type": "application/json;odata=verbose",
                                "X-RequestDigest": digest
                            },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            insertedCount++;
                            existingMap.add((item.title || "").trim().toLowerCase());
                        } else {
                            // Try fallback payload without custom fields if column names differ
                            const fbPayload = {
                                __metadata: { type: entityTypeName },
                                Title: item.title,
                                ConfigType: "Product Master",
                                Plant: "Rajpura",
                                IsActive: true
                            };
                            const fbRes = await fetch(postUrl, {
                                method: "POST",
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "Content-Type": "application/json;odata=verbose",
                                    "X-RequestDigest": digest
                                },
                                body: JSON.stringify(fbPayload)
                            });
                            if (fbRes.ok) {
                                insertedCount++;
                                existingMap.add((item.title || "").trim().toLowerCase());
                            } else {
                                console.warn("Failed inserting product:", item.title, await res.text());
                            }
                        }
                    } catch (postErr) {
                        console.warn("Network error inserting product:", item.title, postErr);
                    }
                }));
            }

            if (insertedCount > 0 || skippedCount > 0) {
                this.showToast(`Packaging Master Products: ${insertedCount} inserted to SharePoint list, ${skippedCount} already existed.`, "success");
            } else {
                this.showToast("Local preview fallback: 1,105 master products initialized in memory.", "info");
            }

            await this.loadSingleFormConfig("PackagingOperations");
            this.renderCurrentTab();
            this.updateStatsCounters();
        } catch (err) {
            console.error("Error seeding Packaging products:", err);
            this.showToast("Seeding error: " + (err.message || err), "warning");
            await this.loadSingleFormConfig("PackagingOperations");
            this.renderCurrentTab();
        } finally {
            updateBtns(`Bulk Add / Seed (1,105)`, false);
            if (btn1) btn1.innerHTML = `Seed Master Records (1,105)`;
        }
    },

    openAddPkgProductModal: function () {
        this.openPkgProductModalInternal(null, {});
    },

    openEditPkgProductModal: function (rowId) {
        const row = (this.configs.PackagingOperations || []).find(r => r.id === rowId);
        if (!row) return;
        this.openPkgProductModalInternal(rowId, row);
    },

    openPkgProductModalInternal: function (rowId, row) {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isEdit = !!rowId;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header" style="background: linear-gradient(90deg, #faf5ff 0%, #ffffff 100%);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;"></span>
                            <div>
                                <h4 class="admin-modal-title">${isEdit ? `Edit Product Master &bull; ${this.escapeHtml(row.title)}` : "+ Add New Packaging Product Master"}</h4>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Packaging Operations &bull; Master Catalogue</div>
                            </div>
                        </div>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>

                    <div class="admin-modal-body" style="padding: 20px 24px;">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Name / Description <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-title" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(row.title || '')}" placeholder="e.g. CHOCOCHIP COOKIES 75GM[6 KG]" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code / SKU <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-pkg-code" class="admin-form-input" value="${this.escapeHtml(row.productCode || '')}" placeholder="e.g. 5003146" />
                        </div>
                        <div class="admin-modal-group-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Associated Line</label>
                                <select id="modal-pkg-line" class="admin-form-input">
                                    <option value="All Lines" ${row.lineName === 'All Lines' ? 'selected' : ''}>All Lines</option>
                                    <option value="Line 1" ${row.lineName === 'Line 1' ? 'selected' : ''}>Line 1</option>
                                    <option value="Line 2" ${row.lineName === 'Line 2' ? 'selected' : ''}>Line 2</option>
                                    <option value="Line 3" ${row.lineName === 'Line 3' ? 'selected' : ''}>Line 3</option>
                                    <option value="Line 4" ${row.lineName === 'Line 4' ? 'selected' : ''}>Line 4</option>
                                    <option value="Line 5" ${row.lineName === 'Line 5' ? 'selected' : ''}>Line 5</option>
                                    <option value="Line 6" ${row.lineName === 'Line 6' ? 'selected' : ''}>Line 6</option>
                                    <option value="Line 7" ${row.lineName === 'Line 7' ? 'selected' : ''}>Line 7</option>
                                    <option value="Line 8" ${row.lineName === 'Line 8' ? 'selected' : ''}>Line 8</option>
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">Category</label>
                                <input type="text" id="modal-pkg-category" class="admin-form-input" value="${this.escapeHtml(row.productCategory || 'Wirecut')}" placeholder="e.g. Wirecut, Moulded, Cookies" />
                            </div>
                        </div>
                        <div class="admin-form-group" style="margin-top: 10px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 14px; border-radius: 6px;">
                                <input type="checkbox" id="modal-pkg-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                                <span>Product Enabled / Active</span>
                            </label>
                        </div>
                    </div>

                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" style="background: #7c3aed; border-color: #7c3aed; font-weight: 700;" onclick="Rajpura_Admin.savePkgProduct(${isEdit ? rowId : 'null'})">
                            ${isEdit ? "Update Product" : "Save Product"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    savePkgProduct: async function (rowId) {
        const titleEl = document.getElementById("modal-pkg-title");
        const codeEl = document.getElementById("modal-pkg-code");
        const lineEl = document.getElementById("modal-pkg-line");
        const catEl = document.getElementById("modal-pkg-category");
        const activeEl = document.getElementById("modal-pkg-active");

        const title = (titleEl ? titleEl.value : "").trim();
        const code = (codeEl ? codeEl.value : "").trim();
        const line = lineEl ? lineEl.value : "All Lines";
        const cat = (catEl ? catEl.value : "").trim() || "General";
        const isActive = activeEl ? activeEl.checked : true;

        if (!title) {
            alert("Please enter a Product Name.");
            if (titleEl) titleEl.focus();
            return;
        }

        const payload = {
            Title: title,
            ConfigType: "Product Master",
            ProductCode: code,
            LineName: line,
            ProductCategory: cat,
            Plant: "Rajpura",
            IsActive: isActive
        };

        const success = await this.persistItemToSharePoint("PackagingOperations", rowId, payload);
        if (success) {
            this.closeModal();
            this.showToast(`Packaging product '${title}' saved successfully.`, "success");
            await this.loadSingleFormConfig("PackagingOperations");
            this.renderCurrentTab();
            this.updateStatsCounters();
        }
    },

    openAddPkgSkuModal: function () {
        this.openPkgSkuModalInternal(null, {});
    },

    openEditPkgSkuModal: function (rowId) {
        const row = (this.configs.PackagingOperations || []).find(r => r.id === rowId);
        if (!row) return;
        this.openPkgSkuModalInternal(rowId, row);
    },

    openPkgSkuModalInternal: function (rowId, row) {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isEdit = !!rowId;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header" style="background: linear-gradient(90deg, #faf5ff 0%, #ffffff 100%);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;"></span>
                            <div>
                                <h4 class="admin-modal-title">${isEdit ? `Edit SKU Weight &bull; ${this.escapeHtml(row.title)}` : "+ Add New SKU Weight"}</h4>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Packaging Operations &bull; Standard Weights</div>
                            </div>
                        </div>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>

                    <div class="admin-modal-body" style="padding: 20px 24px;">
                        <div class="admin-form-group">
                            <label class="admin-form-label">SKU Weight / Pack Size <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-sku-title" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(row.title || '')}" placeholder="e.g. 50g, 75g, 100g, 1kg" />
                        </div>
                        <div class="admin-form-group" style="margin-top: 10px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 14px; border-radius: 6px;">
                                <input type="checkbox" id="modal-sku-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                                <span>SKU Weight Enabled / Active</span>
                            </label>
                        </div>
                    </div>

                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" style="background: #7c3aed; border-color: #7c3aed; font-weight: 700;" onclick="Rajpura_Admin.savePkgSku(${isEdit ? rowId : 'null'})">
                            ${isEdit ? "Update SKU Weight" : "Save SKU Weight"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    savePkgSku: async function (rowId) {
        const titleEl = document.getElementById("modal-sku-title");
        const activeEl = document.getElementById("modal-sku-active");

        const title = (titleEl ? titleEl.value : "").trim();
        const isActive = activeEl ? activeEl.checked : true;

        if (!title) {
            alert("Please enter a SKU weight/pack size.");
            if (titleEl) titleEl.focus();
            return;
        }

        const payload = {
            Title: title,
            ConfigType: "SKU Master",
            Plant: "Rajpura",
            IsActive: isActive
        };

        const success = await this.persistItemToSharePoint("PackagingOperations", rowId, payload);
        if (success) {
            this.closeModal();
            this.showToast(`SKU weight '${title}' saved successfully.`, "success");
            await this.loadSingleFormConfig("PackagingOperations");
            this.renderCurrentTab();
            this.updateStatsCounters();
        }
    },

    /**
     * Seeds initial 13 Plant-Wide Product Master records into SharePoint list: Quality-Rajpura-CCPOPRP.
     */
    seedCcpProductMasterData: async function () {
        console.warn("Seeding functionality is disabled in the admin panel.");
        this.showToast("Seeding master data is currently disabled.", "warning");
        return;

        let rawSeedList = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA) && CCP_PRODUCTS_SEED_DATA.length > 0)
            ? CCP_PRODUCTS_SEED_DATA
            : ((typeof window !== "undefined" && window.CCP_PRODUCTS_SEED_DATA && Array.isArray(window.CCP_PRODUCTS_SEED_DATA) && window.CCP_PRODUCTS_SEED_DATA.length > 0)
                ? window.CCP_PRODUCTS_SEED_DATA
                : []);

        if (rawSeedList.length === 0) {
            updateBtns(`Loading seed dataset...`, true);
            try {
                const siteUrl = this.getSiteUrl();
                const seedUrl = (siteUrl ? siteUrl : "/sites/Mrs_Bectors_PTMS") + "/BectorsSourceCode/Quality-New-Assets/quality-Rajpura/common/js/ccp-products-seed.js?v=" + Date.now();
                await new Promise((resolve) => {
                    const s = document.createElement("script");
                    s.src = seedUrl;
                    s.onload = resolve;
                    s.onerror = resolve;
                    document.head.appendChild(s);
                });
            } catch (e) {
                console.warn("Dynamic load of ccp-products-seed.js failed:", e);
            }

            rawSeedList = (typeof CCP_PRODUCTS_SEED_DATA !== "undefined" && Array.isArray(CCP_PRODUCTS_SEED_DATA) && CCP_PRODUCTS_SEED_DATA.length > 0)
                ? CCP_PRODUCTS_SEED_DATA
                : ((typeof window !== "undefined" && window.CCP_PRODUCTS_SEED_DATA && Array.isArray(window.CCP_PRODUCTS_SEED_DATA) && window.CCP_PRODUCTS_SEED_DATA.length > 0)
                    ? window.CCP_PRODUCTS_SEED_DATA
                    : []);
        }

        if (rawSeedList.length === 0) {
            this.showToast("Could not load master seed products from ccp-products-seed.js.", "warning");
            updateBtns(`Seed CCP Products (13)`, false);
            return;
        }

        updateBtns(`Initializing (${rawSeedList.length} items)...`, true);

        const siteUrl = this.getSiteUrl();
        const listName = "Quality-Rajpura-CCPOPRP";

        try {
            const digest = await this.getFormDigest();
            let insertedCount = 0;
            let skippedCount = 0;

            let entityTypeName = "SP.Data.Quality_x002d_Rajpura_x002d_CCPOPRPListItem";
            try {
                const listMetaRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')?$select=ListItemEntityTypeFullName`, {
                    headers: { "Accept": "application/json;odata=verbose" }
                });
                if (listMetaRes.ok) {
                    const listMetaData = await listMetaRes.json();
                    if (listMetaData.d && listMetaData.d.ListItemEntityTypeFullName) {
                        entityTypeName = listMetaData.d.ListItemEntityTypeFullName;
                    }
                }
            } catch (e) {}

            // Query existing items to avoid duplicates
            let existingItems = [];
            try {
                let nextUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$select=Id,Title,ProductCode,ConfigType&$top=5000`;
                while (nextUrl) {
                    const existingRes = await fetch(nextUrl, {
                        headers: { "Accept": "application/json;odata=verbose" }
                    });
                    if (existingRes.ok) {
                        const existingData = await existingRes.json();
                        const pageItems = (existingData.d && existingData.d.results) ? existingData.d.results : [];
                        existingItems = existingItems.concat(pageItems);
                        nextUrl = (existingData.d && existingData.d.__next) ? existingData.d.__next : null;
                    } else {
                        break;
                    }
                }
            } catch (fetchErr) {
                console.warn("Could not query existing items from list:", fetchErr);
            }

            const existingMap = new Set(existingItems.map(ex => (ex.Title || "").trim().toLowerCase()));

            const toInsert = rawSeedList.filter(item => {
                const titleLower = (item.title || "").trim().toLowerCase();
                if (existingMap.has(titleLower)) {
                    skippedCount++;
                    return false;
                }
                return true;
            });

            console.log(`CCP Products: ${existingItems.length} existing in list, ${toInsert.length} to insert, ${skippedCount} skipped.`);

            // Insert in parallel batches
            const chunkSize = 10;
            for (let i = 0; i < toInsert.length; i += chunkSize) {
                const chunk = toInsert.slice(i, i + chunkSize);
                updateBtns(`Seeding Products (${insertedCount + skippedCount} / ${rawSeedList.length})...`, true);

                await Promise.all(chunk.map(async (item) => {
                    const postUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
                    const payload = {
                        __metadata: { type: entityTypeName },
                        Title: item.title,
                        ConfigType: "Product Master",
                        ProductCode: item.productCode || "",
                        LineName: item.lineName || "All Lines",
                        ProductCategory: item.productCategory || "General",
                        Plant: "Rajpura",
                        IsActive: item.isActive !== false
                    };

                    try {
                        const res = await fetch(postUrl, {
                            method: "POST",
                            headers: {
                                "Accept": "application/json;odata=verbose",
                                "Content-Type": "application/json;odata=verbose",
                                "X-RequestDigest": digest
                            },
                            body: JSON.stringify(payload)
                        });

                        if (res.ok) {
                            insertedCount++;
                            existingMap.add((item.title || "").trim().toLowerCase());
                        } else {
                            // Fallback payload
                            const fbPayload = {
                                __metadata: { type: entityTypeName },
                                Title: item.title,
                                ConfigType: "Product Master",
                                Plant: "Rajpura",
                                IsActive: true
                            };
                            const fbRes = await fetch(postUrl, {
                                method: "POST",
                                headers: {
                                    "Accept": "application/json;odata=verbose",
                                    "Content-Type": "application/json;odata=verbose",
                                    "X-RequestDigest": digest
                                },
                                body: JSON.stringify(fbPayload)
                            });
                            if (fbRes.ok) {
                                insertedCount++;
                                existingMap.add((item.title || "").trim().toLowerCase());
                            } else {
                                console.warn("Failed inserting CCP product:", item.title, await res.text());
                            }
                        }
                    } catch (postErr) {
                        console.warn("Network error inserting CCP product:", item.title, postErr);
                    }
                }));
            }

            if (insertedCount > 0 || skippedCount > 0) {
                this.showToast(`CCP Master Products: ${insertedCount} inserted to SharePoint list, ${skippedCount} already existed.`, "success");
            } else {
                this.showToast("Local preview fallback: 13 master products initialized in memory.", "info");
            }

            await this.loadSingleFormConfig("CCP_OPRP_Sieves");
            this.renderCurrentTab();
            this.updateStatsCounters();
        } catch (err) {
            console.error("Error seeding CCP products:", err);
            this.showToast("Seeding error: " + (err.message || err), "warning");
            await this.loadSingleFormConfig("CCP_OPRP_Sieves");
            this.renderCurrentTab();
        } finally {
            updateBtns(`Seed CCP Products (13)`, false);
        }
    },

    openAddCcpProductModal: function () {
        this.openCcpProductModalInternal(null, {});
    },

    openEditCcpProductModal: function (rowId) {
        const row = (this.configs.CCP_OPRP_Sieves || []).find(r => r.id === rowId);
        if (!row) return;
        this.openCcpProductModalInternal(rowId, row);
    },

    openCcpProductModalInternal: function (rowId, row) {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isEdit = !!rowId;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header" style="background: linear-gradient(90deg, #fffbeb 0%, #ffffff 100%);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;"></span>
                            <div>
                                <h4 class="admin-modal-title">${isEdit ? `Edit Product Master &bull; ${this.escapeHtml(row.title)}` : "+ Add New CCP Product Master"}</h4>
                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">CCP & OPRP &bull; Master Catalogue</div>
                            </div>
                        </div>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>

                    <div class="admin-modal-body" style="padding: 20px 24px;">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Name / Variety <span style="color: #dc2626;">*</span></label>
                            <input type="text" id="modal-ccp-title" class="admin-form-input" style="font-weight: 600;" value="${this.escapeHtml(row.title || '')}" placeholder="e.g. Cremica Tomato Ketchup, Bourbon Biscuit, Chocolate Sauce" />
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Product Code / SKU</label>
                            <input type="text" id="modal-ccp-code" class="admin-form-input" value="${this.escapeHtml(row.productCode || '')}" placeholder="e.g. CCP-ALL-001 or PRD-001" />
                        </div>
                        <div class="admin-modal-group-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                            <div class="admin-form-group">
                                <label class="admin-form-label">Associated Production Line</label>
                                <select id="modal-ccp-line" class="admin-form-input">
                                    <option value="All Lines" ${row.lineName === 'All Lines' || !row.lineName ? 'selected' : ''}>All Lines (Available on Every Line)</option>
                                    <option value="Line-1" ${row.lineName === 'Line-1' || row.lineName === 'Line 1' ? 'selected' : ''}>Line 1</option>
                                    <option value="Line-2" ${row.lineName === 'Line-2' || row.lineName === 'Line 2' ? 'selected' : ''}>Line 2</option>
                                    <option value="Line-3" ${row.lineName === 'Line-3' || row.lineName === 'Line 3' ? 'selected' : ''}>Line 3</option>
                                    <option value="Line-4" ${row.lineName === 'Line-4' || row.lineName === 'Line 4' ? 'selected' : ''}>Line 4</option>
                                    <option value="Line-5" ${row.lineName === 'Line-5' || row.lineName === 'Line 5' ? 'selected' : ''}>Line 5</option>
                                    <option value="Line-6" ${row.lineName === 'Line-6' || row.lineName === 'Line 6' ? 'selected' : ''}>Line 6</option>
                                    <option value="Line-7" ${row.lineName === 'Line-7' || row.lineName === 'Line 7' ? 'selected' : ''}>Line 7</option>
                                    <option value="Line-8" ${row.lineName === 'Line-8' || row.lineName === 'Line 8' ? 'selected' : ''}>Line 8</option>
                                    <option value="FFS" ${row.lineName === 'FFS' ? 'selected' : ''}>FFS Line</option>
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-form-label">Product Category</label>
                                <input type="text" id="modal-ccp-category" class="admin-form-input" value="${this.escapeHtml(row.productCategory || 'General')}" placeholder="e.g. Sauces & Condiments, Cookies, Crackers" />
                            </div>
                        </div>
                        <div class="admin-form-group" style="margin-top: 10px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 14px; border-radius: 6px;">
                                <input type="checkbox" id="modal-ccp-active" ${row.isActive !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                                <span>Product Enabled / Active (Visible in CCP Checklists)</span>
                            </label>
                        </div>
                    </div>

                    <div class="admin-modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" style="background: #d97706; border-color: #d97706; font-weight: 700;" onclick="Rajpura_Admin.saveCcpProduct(${isEdit ? rowId : 'null'})">
                            ${isEdit ? "Update Product" : "Save Product"}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    saveCcpProduct: async function (rowId) {
        const titleEl = document.getElementById("modal-ccp-title");
        const codeEl = document.getElementById("modal-ccp-code");
        const lineEl = document.getElementById("modal-ccp-line");
        const catEl = document.getElementById("modal-ccp-category");
        const activeEl = document.getElementById("modal-ccp-active");

        const title = (titleEl ? titleEl.value : "").trim();
        const code = (codeEl ? codeEl.value : "").trim();
        const line = lineEl ? lineEl.value : "All Lines";
        const cat = (catEl ? catEl.value : "").trim() || "General";
        const isActive = activeEl ? activeEl.checked : true;

        if (!title) {
            alert("Please enter a Product Name / Variety.");
            if (titleEl) titleEl.focus();
            return;
        }

        const payload = {
            Title: title,
            ConfigType: "Product Master",
            ProductCode: code,
            LineName: line,
            ProductCategory: cat,
            Plant: "Rajpura",
            IsActive: isActive
        };

        const success = await this.persistItemToSharePoint("CCP_OPRP_Sieves", rowId, payload);
        if (success) {
            this.closeModal();
            this.showToast(`CCP product '${title}' saved successfully.`, "success");
            await this.loadSingleFormConfig("CCP_OPRP_Sieves");
            this.renderCurrentTab();
            this.updateStatsCounters();
        }
    },

    /**
     * Toggles an item active/inactive status across ALC or other masters
     */
    toggleItemActive: async function (formKey, rowId) {
        const row = (this.configs[formKey] || []).find(r => r.id === rowId);
        if (!row) return;

        const newStatus = row.isActive === false ? true : false;
        row.isActive = newStatus;

        const payload = {
            Title: (row.raw && typeof row.raw.Title === "string") ? row.raw.Title : row.title,
            Plant: row.plant || "Rajpura",
            ConfigType: row.configType,
            ...(formKey === "ALC" && row.area ? { Area: row.area } : {}),
            LineName: row.lineName,
            ShiftCode: row.shiftCode,
            ShiftName: row.shiftName,
            ShiftStart: row.shiftStart,
            ShiftEnd: row.shiftEnd,
            ProductCode: row.productCode,
            ProductCategory: row.productCategory,
            IsActive: newStatus,
            AssignedUsers: row.assignedUsers || [],
            ProductionIncharges: row.productionIncharges || [],
            EscalationManagers: row.escalationManagers || []
        };

        await this.persistItemToSharePoint(formKey, rowId, payload);
        this.showToast(`Status for '${row.title}' set to ${newStatus ? 'Active' : 'Inactive'}`, "info");
        if (formKey === "PackagingOperations" && this.pkgSubTab === "products") {
            this.updatePkgProductTable();
        } else if (formKey === "CCP_OPRP_Sieves" && this.ccpSubTab === "products") {
            this.updateCcpProductTable();
        } else {
            this.renderCurrentTab();
        }
        this.updateStatsCounters();
    },

    /**
     * Local memory sync helper so UI immediately responds in dev and live
     */
    syncConfigRowInMemory: function (formKey, itemId, payload) {
        if (!this.configs[formKey]) this.configs[formKey] = [];
        if (itemId) {
            const idx = this.configs[formKey].findIndex(r => r.id == itemId);
            if (idx >= 0) {
                const existing = this.configs[formKey][idx];
                this.configs[formKey][idx] = {
                    ...existing,
                    title: payload.Title !== undefined ? payload.Title : existing.title,
                    configType: payload.ConfigType !== undefined ? payload.ConfigType : existing.configType,
                    area: payload.Area !== undefined ? payload.Area : existing.area,
                    lineName: payload.LineName !== undefined ? payload.LineName : existing.lineName,
                    shiftCode: payload.ShiftCode !== undefined ? payload.ShiftCode : existing.shiftCode,
                    shiftName: payload.ShiftName !== undefined ? payload.ShiftName : existing.shiftName,
                    shiftStart: payload.ShiftStart !== undefined ? payload.ShiftStart : existing.shiftStart,
                    shiftEnd: payload.ShiftEnd !== undefined ? payload.ShiftEnd : existing.shiftEnd,
                    productCode: payload.ProductCode !== undefined ? payload.ProductCode : existing.productCode,
                    productCategory: payload.ProductCategory !== undefined ? payload.ProductCategory : existing.productCategory,
                    recipeConfig: payload.RecipeConfig !== undefined ? (typeof payload.RecipeConfig === "string" ? (payload.RecipeConfig.startsWith("{") ? JSON.parse(payload.RecipeConfig) : {}) : payload.RecipeConfig) : existing.recipeConfig,
                    isActive: payload.IsActive !== undefined ? payload.IsActive : existing.isActive,
                    assignedUsers: payload.AssignedUsers || existing.assignedUsers,
                    productionIncharges: payload.ProductionIncharges || existing.productionIncharges,
                    escalationManagers: payload.EscalationManagers || existing.escalationManagers
                };
            }
        } else {
            this.configs[formKey].push({
                id: Date.now(),
                title: payload.Title || "",
                configType: payload.ConfigType || "",
                area: payload.Area || "",
                plant: "Rajpura",
                lineName: payload.LineName || "",
                shiftCode: payload.ShiftCode || "",
                shiftName: payload.ShiftName || "",
                shiftStart: payload.ShiftStart || "",
                shiftEnd: payload.ShiftEnd || "",
                productCode: payload.ProductCode || "",
                productCategory: payload.ProductCategory || "",
                recipeConfig: payload.RecipeConfig !== undefined ? (typeof payload.RecipeConfig === "string" ? (payload.RecipeConfig.startsWith("{") ? JSON.parse(payload.RecipeConfig) : {}) : payload.RecipeConfig) : {},
                isActive: payload.IsActive !== false,
                assignedUsers: payload.AssignedUsers || [],
                productionIncharges: payload.ProductionIncharges || [],
                escalationManagers: payload.EscalationManagers || []
            });
        }
    },

    /**
     * Seeds initial Line Master (8 lines), Shift Master (4 shifts), Area Inspectors (7 areas),
     * Product Catalogue, and QA Assignment Matrix into SharePoint list: Quality-Rajpura-ALC.
     */
    seedAlcMasterData: async function () {
        console.warn("Seeding functionality is disabled in the admin panel.");
        this.showToast("Seeding master data is currently disabled.", "warning");
        return;

        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const siteUrl = this.getSiteUrl();
        const listName = "Quality-Rajpura-ALC";

        const seedLines = [
            { Title: "Line No. 1", LineName: "HAAS", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 2", LineName: "IMAFORNI", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 3", LineName: "HAAS", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 4", LineName: "AZAAN", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 5", LineName: "AZAAN", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 6", LineName: "AZAAN", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 7", LineName: "AZAAN", ConfigType: "Line Master", IsActive: true },
            { Title: "Line No. 8", LineName: "HAAS", ConfigType: "Line Master", IsActive: true }
        ];

        const seedShifts = [
            { Title: "Shift A", ShiftCode: "A", ShiftName: "Morning", ShiftStart: "6:00 A.M.", ShiftEnd: "2:00 P.M.", ConfigType: "Shift Master", IsActive: true },
            { Title: "Shift B", ShiftCode: "B", ShiftName: "Evening", ShiftStart: "2:00 P.M.", ShiftEnd: "10:00 P.M.", ConfigType: "Shift Master", IsActive: true },
            { Title: "Shift C", ShiftCode: "C", ShiftName: "Night", ShiftStart: "10:00 P.M.", ShiftEnd: "6:00 A.M.", ConfigType: "Shift Master", IsActive: true },
            { Title: "Shift G", ShiftCode: "G", ShiftName: "General", ShiftStart: "9:00 A.M.", ShiftEnd: "5:30 P.M.", ConfigType: "Shift Master", IsActive: true }
        ];

        const seedAreas = [
            { Title: "AREA-01", Area: "RM Store", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-02", Area: "Flour & Sugar Handling", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-03", Area: "Chemical Handling Area", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-04", Area: "Mixing", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-05", Area: "Oven", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-06", Area: "Post Bake & Packing Section", ConfigType: "Area Inspector", IsActive: true },
            { Title: "AREA-07", Area: "Biscuit Grinding", ConfigType: "Area Inspector", IsActive: true }
        ];

        const seedProducts = [
            { Title: "Cremica Bourbon", ProductCode: "PRD-001", ConfigType: "Product Master", IsActive: true },
            { Title: "Cremica Butter Cookies", ProductCode: "PRD-002", ConfigType: "Product Master", IsActive: true },
            { Title: "Cremica Digestive", ProductCode: "PRD-003", ConfigType: "Product Master", IsActive: true },
            { Title: "Cremica Marie Classic", ProductCode: "PRD-004", ConfigType: "Product Master", IsActive: true },
            { Title: "Cremica Magic Cream", ProductCode: "PRD-005", ConfigType: "Product Master", IsActive: true }
        ];

        const seedQaMatrix = [
            { Title: "Default", ShiftCode: "Default", ConfigType: "QA Assignment", IsActive: true }
        ];

        const allSeedItems = [...seedLines, ...seedShifts, ...seedAreas, ...seedProducts, ...seedQaMatrix];

        if (isLocal) {
            this.showToast(`Local Environment: ${allSeedItems.length} default master records initialized in memory.`, "success");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `Populate Master Seed Records`;
            }
            return;
        }

        try {
            const digest = await this.getFormDigest();
            let insertedCount = 0;
            let skippedCount = 0;

            // Retrieve exact SharePoint List Item Entity Type
            let entityTypeName = `SP.Data.Quality_x002d_Rajpura_x002d_ALCListItem`;
            try {
                const listMetaRes = await fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')?$select=ListItemEntityTypeFullName`, {
                    headers: { "Accept": "application/json;odata=verbose" }
                });
                if (listMetaRes.ok) {
                    const listMetaData = await listMetaRes.json();
                    if (listMetaData.d && listMetaData.d.ListItemEntityTypeFullName) {
                        entityTypeName = listMetaData.d.ListItemEntityTypeFullName;
                    }
                }
            } catch (e) {}

            // Fetch existing items to prevent duplicates
            const getUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items?$select=Id,Title,ConfigType,LineName,ShiftCode,ProductCode&$top=500`;
            const existingRes = await fetch(getUrl, {
                headers: { "Accept": "application/json;odata=verbose" }
            });
            const existingData = await existingRes.json();
            const existingItems = (existingData.d && existingData.d.results) || [];

            for (const item of allSeedItems) {
                const alreadyExists = existingItems.some(ex => 
                    (ex.Title || "").trim().toLowerCase() === (item.Title || "").trim().toLowerCase() &&
                    (ex.ConfigType || "").trim().toLowerCase() === (item.ConfigType || "").trim().toLowerCase()
                );

                if (alreadyExists) {
                    skippedCount++;
                    continue;
                }

                const postUrl = `${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`;
                const payload = {
                    __metadata: { type: entityTypeName },
                    Title: item.Title,
                    ConfigType: item.ConfigType,
                    Plant: "Rajpura",
                    IsActive: item.IsActive !== false
                };
                if (item.LineName) payload.LineName = item.LineName;
                if (item.ShiftCode) payload.ShiftCode = item.ShiftCode;
                if (item.ShiftName) payload.ShiftName = item.ShiftName;
                if (item.ShiftStart) payload.ShiftStart = item.ShiftStart;
                if (item.ShiftEnd) payload.ShiftEnd = item.ShiftEnd;
                if (item.ProductCode) payload.ProductCode = item.ProductCode;
                if (item.Area) payload.Area = item.Area;

                const res = await fetch(postUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "Content-Type": "application/json;odata=verbose",
                        "X-RequestDigest": digest
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    insertedCount++;
                } else {
                    console.warn("Failed to insert seed item:", item.Title, await res.text());
                }
            }

            this.showToast(`Master Data Initialized: ${insertedCount} items inserted, ${skippedCount} already existed.`, "success");
            await this.refreshCurrentTab();
        } catch (err) {
            console.error("Error seeding ALC master data:", err);
            this.showToast("Error inserting master records to SharePoint: " + (err.message || err), "error");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `Populate Master Seed Records`;
            }
        }
    },


    /**
     * Renders card grid view for Assign Users sub-section
     */
    renderCardsGrid: function (form, rows) {
        return `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title">${form.name} &bull; User Assignments</h3>
                    </div>
                </div>

                <div class="admin-cards-grid-container">
                    ${rows.length > 0 ? `
                        <div class="admin-cards-grid">
                            ${rows.map(r => this.renderRoleCard(form, r)).join("")}
                        </div>
                    ` : `
                        <div class="admin-empty-state">
                            <span class="admin-empty-icon"></span>
                            <div style="font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">No Roles Found</div>
                            <div style="font-size: 13px; color: #64748b;">No configuration rows match your search query. Try clearing the search filter.</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Checks if a configuration row represents a Product / Production role (Product Incharge, Production Incharge, etc.)
     */
    isProductOrProdRole: function (row) {
        if (!row) return false;
        const text = `${row.title || ""} ${row.configType || ""}`.toLowerCase();
        return text.includes("product") || text.includes("production") || (text.includes("incharge") && !text.includes("qa"));
    },

    /**
     * Checks if a configuration row represents a QA role (QA User, QA HOD, etc.)
     */
    isQaRole: function (row) {
        if (!row) return false;
        const text = `${row.title || ""} ${row.configType || ""}`.toLowerCase();
        return text.includes("qa") || !this.isProductOrProdRole(row);
    },

    /**
     * Backward compatibility aliases
     */
    isAlcProductRole: function (row) {
        return this.isProductOrProdRole(row);
    },
    isAlcQaRole: function (row) {
        return this.isQaRole(row);
    },

    /**
     * Renders an interactive full-width card for a single role / line configuration
     */
    renderRoleCard: function (form, row) {
        const isAlc = form.key === "ALC";
        const isPkgOps = form.key === "PackagingOperations";
        const isRowBased = isAlc || isPkgOps;

        const isProd = isRowBased && this.isProductOrProdRole(row);
        const isQa = isRowBased && !isProd;

        // In ALC:
        // - QA User cards display Assigned QA Executives and Escalation Managers
        // - Product Incharge cards display ONLY Assigned Product Executives (no escalation manager)
        // In PackagingOperations:
        // - Neither QA User nor Production Incharge cards display Escalation Managers
        const hasProd = !isRowBased && !!form.prodFieldNames;
        const hasMgr = isAlc ? (isQa && !!form.managerFieldNames) : (isPkgOps ? false : !!form.managerFieldNames);

        let userLabel = form.userLabel || "Assigned QA Executives / Operators";
        let userIcon = "";
        let userChipClass = "qa";
        if (isAlc) {
            if (isProd) {
                userLabel = "Assigned Product Executives";
                userIcon = "";
                userChipClass = "prod";
            } else {
                userLabel = "Assigned QA Executives / Operators";
                userIcon = "";
                userChipClass = "qa";
            }
        } else if (isPkgOps) {
            if (isProd) {
                userLabel = "Assigned Production Incharges";
                userIcon = "";
                userChipClass = "prod";
            } else {
                userLabel = "Assigned QA Executives / Operators";
                userIcon = "";
                userChipClass = "qa";
            }
        }

        const userCount = (row.assignedUsers || []).length +
            (hasProd ? (row.productionIncharges || []).length : 0) +
            (hasMgr ? (row.escalationManagers || []).length : 0);

        const userChips = (row.assignedUsers && row.assignedUsers.length > 0)
            ? row.assignedUsers.map(u => `
                <span class="admin-user-chip ${userChipClass}" title="${this.escapeHtml(u.email || u.title)}">
                    <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                    <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                    <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('${form.key}', ${row.id}, 'assignedUsers', ${u.id})" title="Remove user">&times;</button>
                </span>
            `).join("")
            : `<span class="admin-no-users">No personnel assigned</span>`;

        const prodChips = hasProd
            ? ((row.productionIncharges && row.productionIncharges.length > 0)
                ? row.productionIncharges.map(u => `
                    <span class="admin-user-chip prod" title="${this.escapeHtml(u.email || u.title)}">
                        <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                        <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('${form.key}', ${row.id}, 'productionIncharges', ${u.id})" title="Remove user">&times;</button>
                    </span>
                `).join("")
                : `<span class="admin-no-users">None</span>`)
            : "";

        const mgrChips = hasMgr
            ? ((row.escalationManagers && row.escalationManagers.length > 0)
                ? row.escalationManagers.map(u => `
                    <span class="admin-user-chip mgr" title="${this.escapeHtml(u.email || u.title)}">
                        <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                        <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                        <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveUser('${form.key}', ${row.id}, 'escalationManagers', ${u.id})" title="Remove user">&times;</button>
                    </span>
                `).join("")
                : `<span class="admin-no-users">None</span>`)
            : "";

        return `
            <div class="admin-role-card full-width" id="card-${form.key}-${row.id}">
                <div class="admin-card-header">
                    <div class="admin-card-header-left">
                        <div class="admin-card-title-row">
                            <h4 class="admin-card-role-title">${this.escapeHtml(row.title || row.configType)}</h4>
                            <span class="admin-card-status-badge">
                                <span class="status-dot">&bull;</span>
                                <span>${userCount} Personnel Assigned</span>
                            </span>
                        </div>
                        <div class="admin-card-tags">
                            ${row.configType && row.configType !== row.title ? `<span class="admin-card-tag config">${this.escapeHtml(row.configType)}</span>` : ""}
                            ${row.area ? `<span class="admin-card-tag area"> ${this.escapeHtml(row.area)}</span>` : ""}
                        </div>
                    </div>
                    <div class="admin-card-header-right">
                        <button type="button" class="admin-btn-manage-users" onclick="Rajpura_Admin.openEditModal('${form.key}', ${row.id})" title="Manage user assignments for ${this.escapeHtml(row.title || row.configType)}">
                            <span class="btn-icon"></span> Manage Users
                        </button>
                    </div>
                </div>

                <div class="admin-card-body">
                    <!-- Primary Assigned Users Section (QA Executives or Product Executives) -->
                    <div class="admin-card-section">
                        <div class="admin-card-section-header">
                            <div class="admin-card-section-title">
                                <span class="role-icon">${userIcon}</span>
                                <span>${this.escapeHtml(userLabel)}</span>
                                <span class="admin-count-pill">${(row.assignedUsers || []).length}</span>
                            </div>
                        </div>
                        <div class="admin-users-list">
                            ${userChips}
                        </div>
                    </div>

                    <!-- Production Incharge Section (if applicable) -->
                    ${hasProd ? `
                        <div class="admin-card-section has-divider">
                            <div class="admin-card-section-header">
                                <div class="admin-card-section-title">
                                    <span class="role-icon"></span>
                                    <span>${this.escapeHtml(form.prodLabel || "Production Incharge")}</span>
                                    <span class="admin-count-pill">${(row.productionIncharges || []).length}</span>
                                </div>
                            </div>
                            <div class="admin-users-list">
                                ${prodChips}
                            </div>
                        </div>
                    ` : ""}

                    <!-- Escalation Manager Section (if applicable - shown for QA User cards) -->
                    ${hasMgr ? `
                        <div class="admin-card-section has-divider">
                            <div class="admin-card-section-header">
                                <div class="admin-card-section-title">
                                    <span class="role-icon"></span>
                                    <span>Escalation Manager</span>
                                    <span class="admin-count-pill">${(row.escalationManagers || []).length}</span>
                                </div>
                            </div>
                            <div class="admin-users-list">
                                ${mgrChips}
                            </div>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    },

    /**
     * Renders the Product Management catalogue interface for a form
     */
    renderProductManagement: function (form) {
        const sampleProducts = this.getProductCatalogueForForm(form.key);

        return `
            <div class="admin-product-container">
                <div class="admin-product-card">
                    <div class="admin-product-header">
                        <div class="admin-product-header-info">
                            <h3 class="admin-product-title"> Product Management &bull; ${form.name}</h3>
                            <p class="admin-product-subtitle">Manage products, recipes, SKU codes, and line associations configured for ${form.shortName}.</p>
                        </div>
                        <div class="admin-product-header-actions">
                            <button type="button" class="admin-btn-product-add" onclick="Rajpura_Admin.openAddProductModal('${form.key}')">
                                + Add Product
                            </button>
                        </div>
                    </div>

                    <!-- SharePoint Integration Readiness Alert Banner -->
                    <div class="admin-product-alert">
                        <div class="admin-product-alert-icon"></div>
                        <div class="admin-product-alert-content">
                            <div class="admin-product-alert-title">SharePoint Product List Ready for Live Connection</div>
                            <div class="admin-product-alert-text">
                                This section is staged to synchronize with the upcoming SharePoint Master Product List. Once the list name and columns are provided, products will automatically sync bidirectionally for ${form.name}.
                            </div>
                        </div>
                    </div>

                    <!-- Toolbar for Products -->
                    <div class="admin-product-toolbar">
                        <div class="admin-product-filters">
                            <select id="adminProductFilterLine" class="admin-product-filter-select" onchange="Rajpura_Admin.onProductFilterChange()">
                                <option value="">All Production Lines</option>
                                <option value="Line-1">Line 1</option>
                                <option value="Line-2">Line 2</option>
                                <option value="Line-3">Line 3</option>
                                <option value="Line-4">Line 4</option>
                                <option value="Line-5">Line 5</option>
                                <option value="Line-6">Line 6</option>
                            </select>
                            <select id="adminProductFilterStatus" class="admin-product-filter-select" onchange="Rajpura_Admin.onProductFilterChange()">
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <!-- Product Master Catalogue Table -->
                    <div class="admin-table-container">
                        <table class="admin-product-table">
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Product Name & Variant</th>
                                    <th style="width: 15%;">SKU / Code</th>
                                    <th style="width: 18%;">Associated Line(s)</th>
                                    <th style="width: 15%;">Category</th>
                                    <th style="width: 12%;">Status</th>
                                    <th style="width: 15%; text-align: center;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="adminProductTableBody">
                                ${sampleProducts.map(p => `
                                    <tr>
                                        <td>
                                            <div class="admin-product-name-cell">
                                                <div class="product-avatar"></div>
                                                <div>
                                                    <div class="product-name">${this.escapeHtml(p.name)}</div>
                                                    <div class="product-subtext">${this.escapeHtml(p.brand || "Mrs. Bectors")} &bull; Pack: ${this.escapeHtml(p.packSize || "Standard")}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="admin-sku-tag">${this.escapeHtml(p.sku)}</span>
                                        </td>
                                        <td>
                                            <span class="admin-line-badge">${this.escapeHtml(p.lines || "All Lines")}</span>
                                        </td>
                                        <td>
                                            <span style="font-size: 12.5px; color: #94a3b8;">${this.escapeHtml(p.category)}</span>
                                        </td>
                                        <td>
                                            <span class="admin-status-pill ${p.status === 'Active' ? 'active' : 'inactive'}">
                                                &bull; ${p.status}
                                            </span>
                                        </td>
                                        <td style="text-align: center;">
                                            <div class="admin-product-actions">
                                                <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.editProductItem('${form.key}', '${p.sku}')" title="Edit Product">
                                                    Edit
                                                </button>
                                                <button type="button" class="admin-btn-action" onclick="Rajpura_Admin.toggleProductStatus('${form.key}', '${p.sku}')" title="Toggle Status">
                                                    ${p.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Helper to return catalogue products for a specific form section
     */
    getProductCatalogueForForm: function (formKey) {
        if (!this.productCatalogues) {
            this.productCatalogues = {};
        }
        if (this.productCatalogues[formKey]) {
            return this.productCatalogues[formKey];
        }

        let items = [];
        if (formKey === "PackagingOperations") {
            items = [
                { name: "Cremica Bourbon 150g", brand: "Cremica", packSize: "150g", sku: "SKU-CR-BRB-150", lines: "Line-1, Line-2", category: "Biscuits", status: "Active" },
                { name: "English Oven Multigrain Bread", brand: "English Oven", packSize: "400g", sku: "SKU-EO-MLT-400", lines: "Line-5, Line-6", category: "Breads", status: "Active" },
                { name: "Cremica Marie Classic 200g", brand: "Cremica", packSize: "200g", sku: "SKU-CR-MAR-200", lines: "Line-1, Line-3", category: "Biscuits", status: "Active" },
                { name: "English Oven Premium White Bread", brand: "English Oven", packSize: "350g", sku: "SKU-EO-WHT-350", lines: "Line-5", category: "Breads", status: "Active" },
                { name: "Cremica Digestive High Fibre 250g", brand: "Cremica", packSize: "250g", sku: "SKU-CR-DIG-250", lines: "Line-2, Line-4", category: "Biscuits", status: "Inactive" }
            ];
        } else if (formKey === "CCP_OPRP_Sieves") {
            items = [
                { name: "Line 1 - Cremica Gold Biscuits", brand: "Cremica", packSize: "100g", sku: "CCP-L1-GLD-100", lines: "Line-1", category: "Biscuits Line 1", status: "Active" },
                { name: "Line 2 - Digestive & Cracker Dough", brand: "Cremica", packSize: "Bulk Mix", sku: "CCP-L2-DGT-MIX", lines: "Line-2", category: "Biscuits Line 2", status: "Active" },
                { name: "Line 5 - English Oven Brown Bread", brand: "English Oven", packSize: "400g", sku: "CCP-L5-BRN-400", lines: "Line-5", category: "Bread Line 5", status: "Active" },
                { name: "Line 6 - English Oven Sandwich Bread", brand: "English Oven", packSize: "500g", sku: "CCP-L6-SDW-500", lines: "Line-6", category: "Bread Line 6", status: "Active" }
            ];
        } else if (formKey === "MixingAndBaking") {
            items = [
                { name: "Butter Cookies Dough Recipe #4", brand: "Cremica", packSize: "500kg Batch", sku: "MB-REC-BC-04", lines: "Mixing Line 1", category: "Cookie Dough", status: "Active" },
                { name: "Multigrain Sponge & Dough Pre-Mix", brand: "English Oven", packSize: "800kg Batch", sku: "MB-REC-MG-08", lines: "Mixing Line 5", category: "Bread Sponge", status: "Active" },
                { name: "Marie Classic Oven Baking Profile A", brand: "Cremica", packSize: "Continuous", sku: "MB-PRF-MAR-01", lines: "Oven Line 1", category: "Baking Profile", status: "Active" },
                { name: "Sweet Bun Fermentation & Bake", brand: "English Oven", packSize: "300kg Batch", sku: "MB-REC-SB-03", lines: "Bake Line 6", category: "Buns", status: "Active" }
            ];
        } else {
            // ALC or general
            items = [
                { name: "Biscuit Production Line Clearance Standard", brand: "Cremica", packSize: "Line 1-4", sku: "ALC-STD-BSC-01", lines: "Line-1, Line-2, Line-3, Line-4", category: "Line Clearance", status: "Active" },
                { name: "Bread Production Line Clearance Standard", brand: "English Oven", packSize: "Line 5-6", sku: "ALC-STD-BRD-02", lines: "Line-5, Line-6", category: "Line Clearance", status: "Active" },
                { name: "Changeover Sanitization Protocol - Allergen Free", brand: "Quality", packSize: "Plant Wide", sku: "ALC-ALL-CLN-03", lines: "All Lines", category: "Allergen Clean", status: "Active" }
            ];
        }

        this.productCatalogues[formKey] = items;
        return items;
    },

    openAddProductModal: function (formKey) {
        this.showToast("Product list integration is ready. You will be able to add products directly to the SharePoint list once configured.", "info");
    },

    editProductItem: function (formKey, sku) {
        this.showToast(`Editing product ${sku} will sync with SharePoint list once connected.`, "info");
    },

    toggleProductStatus: function (formKey, sku) {
        const items = this.getProductCatalogueForForm(formKey);
        const item = items.find(p => p.sku === sku);
        if (item) {
            item.status = item.status === "Active" ? "Inactive" : "Active";
            this.renderCurrentTab();
            this.showToast(`Product ${sku} status updated to ${item.status}`, "success");
        }
    },

    onProductSearch: function (val) {
        const q = (val || "").toLowerCase().trim();
        const rows = document.querySelectorAll("#adminProductTableBody tr");
        rows.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(q) ? "" : "none";
        });
    },

    onProductFilterChange: function () {
        const lineEl = document.getElementById("adminProductFilterLine");
        const statusEl = document.getElementById("adminProductFilterStatus");
        const lineVal = (lineEl ? lineEl.value : "").toLowerCase();
        const statusVal = (statusEl ? statusEl.value : "").toLowerCase();
        const rows = document.querySelectorAll("#adminProductTableBody tr");
        rows.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            const matchesLine = !lineVal || text.includes(lineVal);
            const matchesStatus = !statusVal || text.includes(statusVal);
            tr.style.display = (matchesLine && matchesStatus) ? "" : "none";
        });
    },

    /**
     * Search filter handler with debouncing and seamless focus restoration
     */
    onSearchInput: function (val) {
        this.searchFilter = val;
        if (this._searchDebounceTimer) clearTimeout(this._searchDebounceTimer);
        this._searchDebounceTimer = setTimeout(() => {
            const activeEl = document.activeElement;
            const isSearchFocused = activeEl && activeEl.classList && activeEl.classList.contains("admin-search-input");
            const cursorStart = isSearchFocused ? activeEl.selectionStart : null;
            const cursorEnd = isSearchFocused ? activeEl.selectionEnd : null;

            this.renderCurrentTab();

            if (isSearchFocused) {
                const newSearchInput = document.querySelector(".admin-search-input");
                if (newSearchInput) {
                    newSearchInput.focus();
                    if (cursorStart !== null && cursorEnd !== null) {
                        try {
                            newSearchInput.setSelectionRange(cursorStart, cursorEnd);
                        } catch (e) {
                            const len = newSearchInput.value.length;
                            newSearchInput.setSelectionRange(len, len);
                        }
                    }
                }
            }
        }, 120);
    },

    clearSearch: function () {
        this.searchFilter = "";
        this.renderCurrentTab();
        const newSearchInput = document.querySelector(".admin-search-input");
        if (newSearchInput) newSearchInput.focus();
    },

    /**
     * Update metric counters across all form tabs and top statistics
     */
    updateStatsCounters: function () {
        let totalAssignedUsers = 0;
        let totalManagers = 0;

        Object.keys(this.FORMS).forEach(key => {
            const list = this.configs[key] || [];
            const countBadge = document.getElementById(`badge-count-${key}`);
            if (countBadge) countBadge.innerText = list.length;

            list.forEach(r => {
                if (r.configType === "Product Master" || r.configType === "SKU Master" || r.configType === "Product Recipe") {
                    return;
                }
                totalAssignedUsers += (r.assignedUsers || []).length;
                totalAssignedUsers += (r.productionIncharges || []).length;
                totalManagers += (r.escalationManagers || []).length;
            });
        });

        const elUsers = document.getElementById("stat-users-count");
        if (elUsers) elUsers.innerText = totalAssignedUsers;

        const elMgrs = document.getElementById("stat-managers-count");
        if (elMgrs) elMgrs.innerText = totalManagers;

        const elEmps = document.getElementById("stat-employees-count");
        if (elEmps) elEmps.innerText = this.employees.length;
    },

    /**
     * Refresh all data
     */
    refreshAll: async function () {
        this.showToast("Syncing with SharePoint lists...", "info");
        await Promise.all([
            this.loadEmployeeDirectory(),
            this.loadAllFormConfigs()
        ]);
        this.renderCurrentTab();
        this.updateStatsCounters();
        this.showToast("SharePoint data refreshed successfully", "success");
    },

    /**
     * Opens modal to add a completely new assignment row
     */
    openAddModal: function (formKey) {
        const form = this.FORMS[formKey];
        if (!form) return;

        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const roleOptions = form.roleTypes.map(r => `<option value="${this.escapeHtml(r)}">${this.escapeHtml(r)}</option>`).join("");
        const lineFieldHtml = form.hasLines && form.lines ? `
            <div class="admin-form-group">
                <label class="admin-form-label">Line / Area Selection</label>
                <select id="modal-field-line" class="admin-form-select">
                    ${form.lines.map(l => `<option value="${this.escapeHtml(l)}">${this.escapeHtml(l)}</option>`).join("")}
                </select>
            </div>
        ` : `
            <div class="admin-form-group">
                <label class="admin-form-label">Title / Area Identifier</label>
                <input type="text" id="modal-field-title" class="admin-form-input" placeholder="e.g. Line 1-6 or QA Executive" />
            </div>
        `;

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">+ Add New Assignment &bull; ${form.name}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Role / Config Type</label>
                            <select id="modal-field-role" class="admin-form-select" onchange="Rajpura_Admin.onRoleTypeChange(this.value)">
                                ${roleOptions}
                                <option value="__CUSTOM__">+ Enter custom role name...</option>
                            </select>
                            <input type="text" id="modal-field-role-custom" class="admin-form-input" style="display: none; margin-top: 6px;" placeholder="Type custom role type" />
                        </div>

                        ${lineFieldHtml}

                        <div class="admin-form-group">
                            <label class="admin-form-label">${form.userLabel || "Assigned Users (Multi-User Selection)"}</label>
                            <div class="admin-user-picker-container" id="modal-picker-users">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-users').focus()">
                                    <div id="selected-chips-users" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-users" class="admin-picker-search-input" placeholder="Type employee name or email..." oninput="Rajpura_Admin.onPickerSearch('users', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-users" style="display: none;"></div>
                            </div>
                        </div>

                        ${form.prodFieldNames ? `
                            <div class="admin-form-group">
                                <label class="admin-form-label">${form.prodLabel || "Production Incharge"}</label>
                                <div class="admin-user-picker-container" id="modal-picker-prod">
                                    <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-prod').focus()">
                                        <div id="selected-chips-prod" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                        <input type="text" id="picker-input-prod" class="admin-picker-search-input" placeholder="Search ${form.prodLabel || 'production incharge'}..." oninput="Rajpura_Admin.onPickerSearch('prod', this.value)" autocomplete="off" />
                                    </div>
                                    <div class="admin-picker-dropdown" id="dropdown-prod" style="display: none;"></div>
                                </div>
                            </div>
                        ` : ""}

                        ${form.managerFieldNames ? `
                            <div class="admin-form-group">
                                <label class="admin-form-label">Escalation Manager</label>
                                <div class="admin-user-picker-container" id="modal-picker-mgr">
                                    <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-mgr').focus()">
                                        <div id="selected-chips-mgr" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                        <input type="text" id="picker-input-mgr" class="admin-picker-search-input" placeholder="Search escalation manager..." oninput="Rajpura_Admin.onPickerSearch('mgr', this.value)" autocomplete="off" />
                                    </div>
                                    <div class="admin-picker-dropdown" id="dropdown-mgr" style="display: none;"></div>
                                </div>
                            </div>
                        ` : ""}
                    </div>
                    <div class="admin-modal-footer">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-assignment" onclick="Rajpura_Admin.submitAddAssignment('${formKey}')">
                            Save to SharePoint
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize state arrays for picker
        this.pickerState = {
            users: [],
            prod: [],
            mgr: []
        };
    },

    /**
     * Opens modal to edit user assignments for an existing role/line row
     */
    openEditModal: function (formKey, rowId) {
        const form = this.FORMS[formKey];
        if (!form) return;

        const row = (this.configs[formKey] || []).find(r => r.id === rowId);
        if (!row) return;

        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isAlc = formKey === "ALC";
        const isPkgOps = formKey === "PackagingOperations";
        const isRowBased = isAlc || isPkgOps;

        const isProd = isRowBased && this.isProductOrProdRole(row);
        const isQa = isRowBased && !isProd;

        const showProd = !isRowBased && !!form.prodFieldNames;
        // In ALC: only QA User cards have Escalation Manager; Product Incharge cards do NOT have Escalation Manager
        // In PackagingOperations: NO cards have Escalation Manager
        const showMgr = isAlc ? (isQa && !!form.managerFieldNames) : (isPkgOps ? false : !!form.managerFieldNames);

        let modalTitle = ` Assign Users - ${form.name}`;
        let userSectionTitle = form.userLabel || "Assigned Users (QA Executives / Operators)";
        let userPlaceholder = "Type employee name or email to assign...";
        let userHelper = "Search from master EmployeeList to add users. Click &times; on chip to remove.";

        if (isAlc) {
            if (isProd) {
                modalTitle = ` Assign Product Executives - ${row.title || row.configType}`;
                userSectionTitle = "Assigned Product Executives";
                userPlaceholder = "Type employee name or email to add Product Executive...";
                userHelper = "Search from master EmployeeList to assign Product Executives. Click &times; on chip to remove.";
            } else {
                modalTitle = ` Assign QA Executives & Escalation Managers - ${row.title || row.configType}`;
                userSectionTitle = "Assigned QA Executives / Operators";
                userPlaceholder = "Type employee name or email to add QA Executive...";
                userHelper = "Search from master EmployeeList to assign QA Executives and Escalation Managers. Click &times; on chip to remove.";
            }
        } else if (isPkgOps) {
            if (isProd) {
                modalTitle = ` Assign Production Incharges - ${row.title || row.configType}`;
                userSectionTitle = "Assigned Production Incharges";
                userPlaceholder = "Type employee name or email to add Production Incharge...";
                userHelper = "Search from master EmployeeList to assign Production Incharges. Click &times; on chip to remove.";
            } else {
                modalTitle = ` Assign QA Executives - ${row.title || row.configType}`;
                userSectionTitle = "Assigned QA Executives / Operators";
                userPlaceholder = "Type employee name or email to add QA Executive...";
                userHelper = "Search from master EmployeeList to assign QA Executives. Click &times; on chip to remove.";
            }
        }

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">${this.escapeHtml(modalTitle)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">

                        <!-- Context Metadata -->
                        <div class="admin-readonly-meta-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 20px;">
                            <div class="admin-readonly-item">
                                <span class="admin-readonly-label">Role / Category</span>
                                <span class="admin-readonly-value"><span class="admin-role-badge">${this.escapeHtml(row.configType || row.title)}</span></span>
                            </div>
                            <div class="admin-readonly-item">
                                <span class="admin-readonly-label">${form.hasLines ? "Line / Area" : "Scope"}</span>
                                <span class="admin-readonly-value" style="color: #0f172a; font-weight: 600;">${this.escapeHtml(row.title || row.area || "Plant Level")}</span>
                            </div>
                        </div>

                        <!-- Active User Assignment Section: QA / Product Executives -->
                        <div class="admin-form-group">
                            <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                <span>${this.escapeHtml(userSectionTitle)}</span>
                                <span style="font-size: 11.5px; color: #1e40af; font-weight: 600;">Editable &bull; Multi-User</span>
                            </label>
                            <div class="admin-user-picker-container" id="modal-picker-users">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-users').focus()">
                                    <div id="selected-chips-users" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-users" class="admin-picker-search-input" placeholder="${userPlaceholder}" oninput="Rajpura_Admin.onPickerSearch('users', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-users" style="display: none;"></div>
                            </div>
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">${userHelper}</div>
                        </div>

                        <!-- Active User Assignment Section: Production Incharge / Executive -->
                        ${showProd ? `
                            <div class="admin-form-group">
                                <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>${form.prodLabel || "Production Incharge"}</span>
                                    <span style="font-size: 11.5px; color: #1e40af; font-weight: 600;">Editable &bull; Multi-User</span>
                                </label>
                                <div class="admin-user-picker-container" id="modal-picker-prod">
                                    <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-prod').focus()">
                                        <div id="selected-chips-prod" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                        <input type="text" id="picker-input-prod" class="admin-picker-search-input" placeholder="Search ${form.prodLabel || 'production incharge'}..." oninput="Rajpura_Admin.onPickerSearch('prod', this.value)" autocomplete="off" />
                                    </div>
                                    <div class="admin-picker-dropdown" id="dropdown-prod" style="display: none;"></div>
                                </div>
                            </div>
                        ` : ""}

                        <!-- Active User Assignment Section: Escalation Manager (only rendered if applicable) -->
                        ${showMgr ? `
                            <div class="admin-form-group">
                                <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>Escalation Manager</span>
                                    <span style="font-size: 11.5px; color: #1e40af; font-weight: 600;">Editable</span>
                                </label>
                                <div class="admin-user-picker-container" id="modal-picker-mgr">
                                    <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-mgr').focus()">
                                        <div id="selected-chips-mgr" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                        <input type="text" id="picker-input-mgr" class="admin-picker-search-input" placeholder="Search escalation manager..." oninput="Rajpura_Admin.onPickerSearch('mgr', this.value)" autocomplete="off" />
                                    </div>
                                    <div class="admin-picker-dropdown" id="dropdown-mgr" style="display: none;"></div>
                                </div>
                            </div>
                        ` : ""}
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-assignment" onclick="Rajpura_Admin.submitUpdateAssignment('${formKey}', ${rowId})">
                            Save User Assignments
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize state arrays for picker
        this.pickerState = {
            users: [...(row.assignedUsers || [])],
            prod: showProd ? [...(row.productionIncharges || [])] : [],
            mgr: showMgr ? [...(row.escalationManagers || [])] : []
        };

        this.renderSelectedChips("users");
        if (showProd) {
            this.renderSelectedChips("prod");
        }
        if (showMgr) {
            this.renderSelectedChips("mgr");
        }
    },

    /**
     * Quick-add a user to a specific field on a row without opening full edit modal
     */
    openAddUserPickerModal: function (formKey, rowId, fieldKey) {
        this.openEditModal(formKey, rowId);
        setTimeout(() => {
            const pickerKey = (fieldKey === "productionIncharges" || fieldKey === "prod") ? "prod"
                : (fieldKey === "escalationManagers" || fieldKey === "mgr") ? "mgr"
                : "users";
            const input = document.getElementById(`picker-input-${pickerKey}`);
            if (input) input.focus();
        }, 150);
    },

    /**
     * Handler for custom role option toggle in modal
     */
    onRoleTypeChange: function (val) {
        const customEl = document.getElementById("modal-field-role-custom");
        if (customEl) {
            customEl.style.display = val === "__CUSTOM__" ? "block" : "none";
            if (val === "__CUSTOM__") customEl.focus();
        }
    },

    /**
     * Autocomplete search input for user picker
     */
    onPickerSearch: function (pickerType, query) {
        const dropdown = document.getElementById(`dropdown-${pickerType}`);
        if (!dropdown) return;

        if (!query || query.trim().length < 1) {
            dropdown.style.display = "none";
            return;
        }

        const q = query.toLowerCase().trim();
        const selectedIds = (this.pickerState[pickerType] || []).map(u => u.id);

        const matches = this.employees.filter(emp => {
            if (selectedIds.includes(emp.id)) return false;
            const nameMatch = (emp.title || "").toLowerCase().includes(q);
            const emailMatch = (emp.email || "").toLowerCase().includes(q);
            const deptMatch = (emp.department || "").toLowerCase().includes(q);
            return nameMatch || emailMatch || deptMatch;
        }).slice(0, 10);

        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding: 10px 14px; font-size: 12.5px; color: #94a3b8;">No matching employee found</div>`;
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = matches.map(emp => `
            <div class="admin-picker-item" onclick="Rajpura_Admin.onSelectPickerUser('${pickerType}', ${emp.id})">
                <span class="admin-user-avatar" style="width: 28px; height: 28px; font-size: 12px;">${this.getInitials(emp.title)}</span>
                <div class="admin-picker-item-info">
                    <div class="admin-picker-item-name">${this.escapeHtml(emp.title)}</div>
                    <div class="admin-picker-item-sub">${this.escapeHtml(emp.email || "No email")} &bull; ${this.escapeHtml(emp.department || "Plant")}</div>
                </div>
                <span style="font-size: 16px; color: #2563eb;">+</span>
            </div>
        `).join("");
        dropdown.style.display = "block";
    },

    /**
     * User selection click handler in dropdown
     */
    onSelectPickerUser: function (pickerType, empId) {
        const emp = this.employees.find(e => e.id === empId);
        if (!emp) return;

        if (!this.pickerState[pickerType]) this.pickerState[pickerType] = [];
        if (!this.pickerState[pickerType].some(u => u.id === emp.id)) {
            this.pickerState[pickerType].push({
                id: emp.id,
                title: emp.title,
                email: emp.email
            });
        }

        this.renderSelectedChips(pickerType);

        // Reset input and dropdown
        const input = document.getElementById(`picker-input-${pickerType}`);
        if (input) {
            input.value = "";
            input.focus();
        }
        const dropdown = document.getElementById(`dropdown-${pickerType}`);
        if (dropdown) dropdown.style.display = "none";
    },

    /**
     * Remove a chip from user picker in modal
     */
    onRemovePickerChip: function (pickerType, userId) {
        if (!this.pickerState[pickerType]) return;
        this.pickerState[pickerType] = this.pickerState[pickerType].filter(u => u.id !== userId);
        this.renderSelectedChips(pickerType);
    },

    /**
     * Re-renders tag chips inside modal input container
     */
    renderSelectedChips: function (pickerType) {
        const container = document.getElementById(`selected-chips-${pickerType}`);
        if (!container) return;

        const users = this.pickerState[pickerType] || [];
        container.innerHTML = users.map(u => `
            <span class="admin-user-chip ${pickerType}" style="margin: 2px;">
                <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                <span>${this.escapeHtml(u.title)}</span>
                <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.onRemovePickerChip('${pickerType}', ${u.id})">&times;</button>
            </span>
        `).join("");
    },

    /**
     * Close modal dialog
     */
    closeModal: function () {
        const mount = document.getElementById("adminModalMount");
        if (mount) mount.innerHTML = "";
    },

    onModalBackdropClick: function (e) {
        if (e.target && e.target.id === "adminModalBackdrop") {
            this.closeModal();
        }
    },

    /**
     * Resolves SharePoint internal user ID for saving
     */
    resolveSpUserId: async function (user) {
        if (!user) return null;
        if (user.spUserId) return user.spUserId;
        if (typeof user.id === "number" && user.id < 10000) return user.id;

        // Try ensureuser via SharePoint REST
        if (user.email) {
            try {
                const siteUrl = this.getSiteUrl();
                const digest = await this.getFormDigest();
                const res = await fetch(`${siteUrl}/_api/web/ensureuser`, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json; odata=verbose",
                        "Content-Type": "application/json; odata=verbose",
                        "X-RequestDigest": digest
                    },
                    body: JSON.stringify({ logonName: user.email })
                });
                if (res.ok) {
                    const data = await res.json();
                    return data.d.Id;
                }
            } catch (e) {}
        }
        return user.id || null;
    },

    /**
     * Saves a newly created assignment to SharePoint
     */
    submitAddAssignment: async function (formKey) {
        const form = this.FORMS[formKey];
        if (!form) return;

        const roleSelect = document.getElementById("modal-field-role");
        let roleVal = roleSelect ? roleSelect.value : "";
        if (roleVal === "__CUSTOM__") {
            const customInput = document.getElementById("modal-field-role-custom");
            roleVal = customInput ? customInput.value.trim() : "";
        }

        const lineEl = document.getElementById("modal-field-line");
        const titleInput = document.getElementById("modal-field-title");
        let titleVal = lineEl ? lineEl.value : (titleInput ? titleInput.value.trim() : "");
        if (!titleVal) titleVal = roleVal || "Assignment";

        const assignedUsers = this.pickerState.users || [];
        const prodUsers = this.pickerState.prod || [];
        const mgrUsers = this.pickerState.mgr || [];

        const btnSave = document.getElementById("btn-save-assignment");
        if (btnSave) {
            btnSave.innerText = "Saving...";
            btnSave.disabled = true;
        }

        const payload = {
            Title: titleVal,
            Plant: "Rajpura",
            ConfigType: roleVal,
            AssignedUsers: assignedUsers,
            ProductionIncharges: prodUsers,
            EscalationManagers: mgrUsers
        };

        const success = await this.persistItemToSharePoint(formKey, null, payload);
        if (success) {
            this.showToast(`New assignment for ${titleVal} added successfully`, "success");
            this.closeModal();
            await this.loadSingleFormConfig(formKey);
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else {
            if (btnSave) {
                btnSave.innerText = "Save to SharePoint";
                btnSave.disabled = false;
            }
        }
    },

    /**
     * Saves an updated assignment to SharePoint
     */
    submitUpdateAssignment: async function (formKey, rowId) {
        const form = this.FORMS[formKey];
        if (!form) return;

        const row = (this.configs[formKey] || []).find(r => r.id === rowId);
        if (!row) return;

        const isAlc = formKey === "ALC";
        const isPkgOps = formKey === "PackagingOperations";
        const isRowBased = isAlc || isPkgOps;
        const isProd = isRowBased && this.isProductOrProdRole(row);

        const assignedUsers = this.pickerState.users || [];
        const prodUsers = this.pickerState.prod || [];
        // In ALC: Product Incharge roles have NO escalation manager
        // In PackagingOperations: Escalation Manager is completely removed for all roles
        const mgrUsers = (isPkgOps || isProd) ? [] : (this.pickerState.mgr || []);

        const btnSave = document.getElementById("btn-save-assignment");
        if (btnSave) {
            btnSave.innerText = "Saving User Assignments...";
            btnSave.disabled = true;
        }

        // Strictly preserve all existing system metadata (Title, Plant, ConfigType, ChecklistType, Area) as read-only
        const payload = {
            Title: (row.raw && typeof row.raw.Title === "string") ? row.raw.Title : row.title,
            Plant: row.plant || "Rajpura",
            ConfigType: row.configType,
            ChecklistType: row.checklistType,
            ...(isAlc && row.area ? { Area: row.area } : {}),
            AssignedUsers: assignedUsers,
            ProductionIncharges: prodUsers,
            EscalationManagers: mgrUsers
        };

        const success = await this.persistItemToSharePoint(formKey, rowId, payload);
        if (success) {
            this.showToast(`User assignments for '${row.title}' updated successfully`, "success");
            this.closeModal();
            await this.loadSingleFormConfig(formKey);
            this.renderCurrentTab();
            this.updateStatsCounters();
        } else {
            if (btnSave) {
                btnSave.innerText = "Save User Assignments";
                btnSave.disabled = false;
            }
        }
    },

    /**
     * Quick-remove a single user directly from a row
     */
    quickRemoveUser: async function (formKey, rowId, fieldKey, userId) {
        const row = (this.configs[formKey] || []).find(r => r.id === rowId);
        if (!row) return;

        const isAlc = formKey === "ALC";
        const isPkgOps = formKey === "PackagingOperations";
        const isRowBased = isAlc || isPkgOps;
        const isProd = isRowBased && this.isProductOrProdRole(row);

        const userList = row[fieldKey] || [];
        const userToRemove = userList.find(u => u.id === userId);
        const remainingUsers = userList.filter(u => u.id !== userId);

        if (!confirm(`Remove ${userToRemove ? userToRemove.title : "this user"} from ${row.title}?`)) return;

        const payload = {
            Title: (row.raw && typeof row.raw.Title === "string") ? row.raw.Title : row.title,
            Plant: row.plant || "Rajpura",
            ConfigType: row.configType,
            ChecklistType: row.checklistType,
            ...(isAlc && row.area ? { Area: row.area } : {}),
            AssignedUsers: fieldKey === "assignedUsers" ? remainingUsers : row.assignedUsers,
            QAShiftExecutives: fieldKey === "qaShiftExecutives" ? remainingUsers : row.qaShiftExecutives,
            ProductionIncharges: fieldKey === "productionIncharges" ? remainingUsers : row.productionIncharges,
            EscalationManagers: (isPkgOps || isProd) ? [] : (fieldKey === "escalationManagers" ? remainingUsers : row.escalationManagers)
        };

        const success = await this.persistItemToSharePoint(formKey, rowId, payload);
        if (success) {
            this.showToast(`User removed successfully`, "success");
            row[fieldKey] = remainingUsers;
            this.renderCurrentTab();
            this.updateStatsCounters();
        }
    },

    /**
     * Confirmation dialog to delete an entire assignment row
     */
    confirmDeleteRow: async function (formKey, rowId) {
        const form = this.FORMS[formKey];
        const row = (this.configs[formKey] || []).find(r => r.id === rowId);
        if (!row) return;

        // Safety guard: only allow deleting Product Master items
        if (row.configType !== "Product Master") {
            this.showToast("Deleting non-product master records is disabled.", "warning");
            return;
        }

        if (!confirm(`Are you sure you want to delete product '${row.title}' from ${form ? form.name : formKey}?`)) {
            return;
        }

        const success = await this.deleteItemFromSharePoint(formKey, rowId);
        if (success) {
            this.showToast(`Assignment '${row.title}' deleted successfully`, "warning");
            this.closeModal();
            this.configs[formKey] = (this.configs[formKey] || []).filter(r => r.id !== rowId);
            this.renderCurrentTab();
            this.updateStatsCounters();
        }
    },

    /**
     * Persists (POST or MERGE) item changes to SharePoint list
     */
    persistItemToSharePoint: async function (formKey, itemId, payload) {
        const formDef = this.FORMS[formKey];
        if (!formDef) return false;

        const siteUrl = this.getSiteUrl();
        const listName = formDef.listName;

        try {
            const schema = await this.probeListSchema(listName);
            const digest = await this.getFormDigest();

            // Resolve user IDs only if explicit lists are provided
            const userIds = [];
            if (payload.AssignedUsers && Array.isArray(payload.AssignedUsers)) {
                for (const u of payload.AssignedUsers) {
                    const spId = await this.resolveSpUserId(u);
                    if (spId) userIds.push(spId);
                }
            }

            const qaShiftIds = [];
            if (payload.QAShiftExecutives && Array.isArray(payload.QAShiftExecutives)) {
                for (const u of payload.QAShiftExecutives) {
                    const spId = await this.resolveSpUserId(u);
                    if (spId) qaShiftIds.push(spId);
                }
            }

            const prodIds = [];
            if (payload.ProductionIncharges && Array.isArray(payload.ProductionIncharges)) {
                for (const u of payload.ProductionIncharges) {
                    const spId = await this.resolveSpUserId(u);
                    if (spId) prodIds.push(spId);
                }
            }

            const mgrIds = [];
            if (payload.EscalationManagers && Array.isArray(payload.EscalationManagers) && formDef.managerFieldNames) {
                for (const u of payload.EscalationManagers) {
                    const spId = await this.resolveSpUserId(u);
                    if (spId) mgrIds.push(spId);
                }
            }

            // Map internal field names
            const configTypeField = schema ? schema.findField(["ConfigType", "Config_x0020_Type"], "Config Type") : null;
            const plantField = schema ? schema.findField(["Plant"], "Plant") : null;
            const regionField = schema ? schema.findField(["Region"], "Region") : null;
            const checklistTypeField = schema ? schema.findField(["ChecklistType", "Checklist_x0020_Type"], "Checklist Type") : null;
            const areaField = schema ? schema.findField(["Area"], "Area") : null;
            const lineField = schema ? schema.findField(["LineName", "Line_x0020_Name", "Line"], "Line Name") : null;
            const shiftCodeField = schema ? schema.findField(["ShiftCode", "Shift_x0020_Code", "Shift"], "Shift Code") : null;
            const shiftNameField = schema ? schema.findField(["ShiftName", "Shift_x0020_Name"], "Shift Name") : null;
            const shiftStartField = schema ? schema.findField(["ShiftStart", "Shift_x0020_Start"], "Shift Start") : null;
            const shiftEndField = schema ? schema.findField(["ShiftEnd", "Shift_x0020_End"], "Shift End") : null;
            const prodCodeField = schema ? schema.findField(["ProductCode", "Product_x0020_Code", "SKU"], "Product Code") : null;
            const prodCatField = schema ? schema.findField(["ProductCategory", "Product_x0020_Category"], "Product Category") : null;
            const isCriticalField = schema ? schema.findField(["IsCritical", "Is_x0020_Critical", "Critical"], "Is Critical") : null;
            const remarksField = schema ? schema.findField(["Remarks", "Remarks_x0020_Text"], "Remarks") : null;
            const recipeField = schema ? schema.findField(["RecipeConfig", "Recipe_x0020_Config"], "Recipe Config") : null;
            const isActiveField = schema ? schema.findField(["IsActive", "Is_x0020_Active", "Active"], "Is Active") : null;

            const userField = schema ? schema.findField(formDef.userFieldNames, ["QA Executive", "QAExecutive", "Assigned User", "Assigned QA"]) : null;
            const qaShiftField = schema && formDef.qaShiftFieldNames ? schema.findField(formDef.qaShiftFieldNames, ["QA Shift Executive", "QAShiftExecutive"]) : null;
            const prodField = schema && formDef.prodFieldNames ? schema.findField(formDef.prodFieldNames, ["Production Incharge", "Production Executive", "Production Shift"]) : null;
            const managerField = schema && formDef.managerFieldNames ? schema.findField(formDef.managerFieldNames, ["Escalation Manager"]) : null;

            let entityType = (schema && schema.entityTypeName);
            if (!entityType) {
                entityType = `SP.Data.${listName.replace(/-/g, '_x002d_').replace(/ /g, '_x0020_')}ListItem`;
            }

            const spPayload = {
                __metadata: { type: entityType }
            };
            if (payload.Title !== undefined) {
                spPayload.Title = payload.Title;
            }

            if (configTypeField && payload.ConfigType) spPayload[configTypeField.InternalName] = payload.ConfigType;
            else if (!schema && payload.ConfigType) spPayload["ConfigType"] = payload.ConfigType;

            if (checklistTypeField && payload.ChecklistType) spPayload[checklistTypeField.InternalName] = payload.ChecklistType;
            else if (!schema && formKey === "FoodSafety" && payload.ChecklistType) spPayload["ChecklistType"] = payload.ChecklistType;

            if (plantField) spPayload[plantField.InternalName] = payload.Plant || "Rajpura";
            else if (!schema) spPayload["Plant"] = "Rajpura";

            if (regionField) spPayload[regionField.InternalName] = payload.Region || "North";
            else if (!schema && formKey === "ALC") spPayload["Region"] = "North";

            if (areaField && payload.Area) spPayload[areaField.InternalName] = payload.Area;
            else if (!schema && payload.Area) spPayload["Area"] = payload.Area;

            // User Field - only if explicitly provided in payload and userField exists
            if (payload.AssignedUsers !== undefined && userField) {
                const isMulti = userField.TypeAsString === "UserMulti";
                const idProp = `${userField.InternalName}Id`;
                spPayload[idProp] = isMulti ? { results: userIds } : (userIds.length > 0 ? userIds[0] : null);
            }

                        // QA Shift Executive Field - only if explicitly provided in payload
            if (payload.QAShiftExecutives !== undefined) {
                const fn = qaShiftField ? qaShiftField.InternalName : "QAShiftExecutive";
                const isMulti = !qaShiftField || qaShiftField.TypeAsString === "UserMulti";
                const idProp = `${fn}Id`;
                spPayload[idProp] = isMulti ? { results: qaShiftIds } : (qaShiftIds.length > 0 ? qaShiftIds[0] : null);
            }

            // Production Field - only if explicitly provided in payload and prodField exists
            if (payload.ProductionIncharges !== undefined && prodField) {
                const isMulti = prodField.TypeAsString === "UserMulti";
                const idProp = `${prodField.InternalName}Id`;
                spPayload[idProp] = isMulti ? { results: prodIds } : (prodIds.length > 0 ? prodIds[0] : null);
            }

            // Manager Field - only if explicitly provided in payload and managerField exists
            if (payload.EscalationManagers !== undefined && managerField) {
                const isMulti = managerField.TypeAsString === "UserMulti";
                const idProp = `${managerField.InternalName}Id`;
                spPayload[idProp] = isMulti ? { results: mgrIds } : (mgrIds.length > 0 ? mgrIds[0] : null);
            }

            // Master & Product Data Fields (strictly guarded by schema)
            if (lineField && payload.LineName !== undefined && payload.LineName !== null) spPayload[lineField.InternalName] = payload.LineName;
            if (shiftCodeField && payload.ShiftCode !== undefined && payload.ShiftCode !== null) spPayload[shiftCodeField.InternalName] = payload.ShiftCode;
            if (prodCodeField && payload.ProductCode !== undefined && payload.ProductCode !== null) spPayload[prodCodeField.InternalName] = payload.ProductCode;
            if (prodCatField && payload.ProductCategory !== undefined && payload.ProductCategory !== null) spPayload[prodCatField.InternalName] = payload.ProductCategory;

            if (shiftNameField && payload.ShiftName !== undefined && payload.ShiftName !== null) spPayload[shiftNameField.InternalName] = payload.ShiftName;
            if (shiftStartField && payload.ShiftStart !== undefined && payload.ShiftStart !== null) spPayload[shiftStartField.InternalName] = payload.ShiftStart;
            if (shiftEndField && payload.ShiftEnd !== undefined && payload.ShiftEnd !== null) spPayload[shiftEndField.InternalName] = payload.ShiftEnd;

            if (isCriticalField && payload.IsCritical !== undefined && payload.IsCritical !== null) spPayload[isCriticalField.InternalName] = !!payload.IsCritical;
            if (remarksField && payload.Remarks !== undefined && payload.Remarks !== null) spPayload[remarksField.InternalName] = payload.Remarks;

            if (recipeField && payload.RecipeConfig !== undefined && payload.RecipeConfig !== null) {
                spPayload[recipeField.InternalName] = typeof payload.RecipeConfig === "string" ? payload.RecipeConfig : JSON.stringify(payload.RecipeConfig);
            }
            if (isActiveField && payload.IsActive !== undefined && payload.IsActive !== null) spPayload[isActiveField.InternalName] = !!payload.IsActive;

            const headers = {
                "Accept": "application/json; odata=verbose",
                "Content-Type": "application/json; odata=verbose",
                "X-RequestDigest": digest
            };

            let endpoint = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items`;
            let method = "POST";

            if (itemId) {
                endpoint += `(${itemId})`;
                headers["X-HTTP-Method"] = "MERGE";
                headers["If-Match"] = "*";
            }

            console.log(`[Admin] Persisting item to ${listName} (${method}):`, spPayload);

            let response = await fetch(endpoint, {
                method: method,
                headers: headers,
                body: JSON.stringify(spPayload)
            });

            if (!response.ok) {
                let errDetail = "";
                try {
                    const errObj = await response.json();
                    errDetail = errObj?.error?.message?.value || JSON.stringify(errObj);
                } catch (_) {
                    errDetail = await response.text();
                }
                console.error(`[Admin] SharePoint returned ${response.status} saving to ${listName}:`, errDetail, spPayload);
                throw new Error(`SharePoint returned ${response.status}: ${errDetail || response.statusText}`);
            }

            console.log(`[Admin] Successfully persisted item to ${listName}:`, itemId || "NEW");
            return true;
        } catch (e) {
            console.error("SharePoint save error:", e);
            return false;
        }
    },

    /**
     * Synchronizes updated or newly added row into in-memory configs array
     */
    syncConfigRowInMemory: function (formKey, itemId, payload) {
        if (!this.configs[formKey]) this.configs[formKey] = [];
        const isCriticalBool = (payload.IsCritical === true || payload.IsCritical === "Yes" || payload.IsCritical === 1 ||
            String(payload.ProductCategory).toLowerCase() === "critical" || String(payload.ProductCategory).toLowerCase() === "yes" ||
            String(payload.Remarks).toLowerCase() === "critical");

        if (itemId) {
            const idx = this.configs[formKey].findIndex(r => r.id === itemId);
            if (idx !== -1) {
                const existing = this.configs[formKey][idx];
                this.configs[formKey][idx] = {
                    ...existing,
                    title: payload.Title !== undefined ? payload.Title : existing.title,
                    configType: payload.ConfigType !== undefined ? payload.ConfigType : existing.configType,
                    checklistType: payload.ChecklistType !== undefined ? payload.ChecklistType : existing.checklistType,
                    area: payload.Area !== undefined ? payload.Area : existing.area,
                    lineName: payload.LineName !== undefined ? payload.LineName : existing.lineName,
                    shiftCode: payload.ShiftCode !== undefined ? payload.ShiftCode : existing.shiftCode,
                    shiftName: payload.ShiftName !== undefined ? payload.ShiftName : existing.shiftName,
                    shiftStart: payload.ShiftStart !== undefined ? payload.ShiftStart : existing.shiftStart,
                    shiftEnd: payload.ShiftEnd !== undefined ? payload.ShiftEnd : existing.shiftEnd,
                    productCode: payload.ProductCode !== undefined ? payload.ProductCode : existing.productCode,
                    productCategory: payload.ProductCategory !== undefined ? payload.ProductCategory : (payload.IsCritical !== undefined ? (payload.IsCritical ? "Critical" : "Standard") : existing.productCategory),
                    isCritical: payload.IsCritical !== undefined ? !!payload.IsCritical : (existing.isCritical !== undefined ? existing.isCritical : isCriticalBool),
                    sequence: payload.Sequence !== undefined ? payload.Sequence : (existing.sequence || parseInt(payload.ShiftCode || payload.ProductCode, 10) || 0),
                    isActive: payload.IsActive !== undefined ? !!payload.IsActive : existing.isActive,
                    recipeConfig: payload.RecipeConfig !== undefined ? payload.RecipeConfig : existing.recipeConfig,
                    assignedUsers: payload.AssignedUsers !== undefined ? payload.AssignedUsers : existing.assignedUsers,
                    productionIncharges: payload.ProductionIncharges !== undefined ? payload.ProductionIncharges : existing.productionIncharges,
                    escalationManagers: payload.EscalationManagers !== undefined ? payload.EscalationManagers : existing.escalationManagers
                };
            }
        } else {
            const newId = Date.now();
            this.configs[formKey].push({
                id: newId,
                title: payload.Title || "",
                configType: payload.ConfigType || "",
                checklistType: payload.ChecklistType || payload.Title || "",
                area: payload.Area || "",
                plant: payload.Plant || "Rajpura",
                lineName: payload.LineName || "",
                shiftCode: payload.ShiftCode || "",
                shiftName: payload.ShiftName || "",
                shiftStart: payload.ShiftStart || "",
                shiftEnd: payload.ShiftEnd || "",
                productCode: payload.ProductCode || "",
                productCategory: payload.ProductCategory || (payload.IsCritical ? "Critical" : "Standard"),
                isCritical: payload.IsCritical !== undefined ? !!payload.IsCritical : isCriticalBool,
                sequence: payload.Sequence !== undefined ? payload.Sequence : (parseInt(payload.ShiftCode || payload.ProductCode, 10) || (this.configs[formKey].filter(r => r.configType === "Checklist Question").length + 1)),
                isActive: payload.IsActive !== false,
                recipeConfig: payload.RecipeConfig || {},
                assignedUsers: payload.AssignedUsers || [],
                productionIncharges: payload.ProductionIncharges || [],
                escalationManagers: payload.EscalationManagers || []
            });
        }
    },

    /**
     * Deletes an item from SharePoint list
     */
    deleteItemFromSharePoint: async function (formKey, itemId) {
        const formDef = this.FORMS[formKey];
        if (!formDef || !itemId) return false;

        const siteUrl = this.getSiteUrl();
        const listName = formDef.listName;

        try {
            const digest = await this.getFormDigest();
            const endpoint = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${itemId})`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "X-RequestDigest": digest,
                    "X-HTTP-Method": "DELETE",
                    "If-Match": "*"
                }
            });

            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status}`);
            }
            if (this.configs[formKey]) {
                this.configs[formKey] = this.configs[formKey].filter(r => r.id !== itemId);
            }
            return true;
        } catch (e) {
            console.warn("SharePoint delete error (simulating local delete):", e);
            if (this.configs[formKey]) {
                this.configs[formKey] = this.configs[formKey].filter(r => r.id !== itemId);
            }
            return true;
        }
    },

    /**
     * Displays a floating toast notification
     */
    showToast: function (message, type = "info") {
        const container = document.getElementById("adminToastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `admin-toast ${type}`;
        const icon = type === "success" ? "&#10003;" : (type === "error" ? "&times;" : (type === "warning" ? "" : "i"));
        toast.innerHTML = `<span>${icon}</span><span>${this.escapeHtml(message)}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            $(toast).fadeOut(300, () => toast.remove());
        }, 3500);
    },

    /**
     * Helper: extracts user initials from display name
     */
    getInitials: function (name) {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    },

    /**
     * Helper: sanitizes string for HTML display
     */
    /**
     * Updates badge count numbers on navigation tabs
     */
    updateStatsCounters: function () {
        Object.keys(this.FORMS).forEach(key => {
            const badge = document.getElementById(`badge-count-${key}`);
            if (!badge) return;
            if (key === "TopManagement") {
                const total = (this.topManagementState.alcUsers?.length || 0) + (this.topManagementState.generalUsers?.length || 0);
                badge.innerText = total;
            } else {
                const count = (this.configs[key] || []).length;
                badge.innerText = count;
            }
        });
    },

    /**
     * Loads Top Management configuration from SharePoint 'AdminPanel' list
     */
    loadTopManagementConfig: async function () {
        this.topManagementState.isLoading = true;
        const siteUrl = this.getSiteUrl();
        const listNames = ["AdminPanel", "Admin Panel", "Admin_Panel", "Admin_x0020_Panel"];
        
        let loaded = false;
        for (const listName of listNames) {
            if (loaded) break;
            const queries = [
                "?$select=Id,Title,Admins/Id,Admins/Title,Admins/EMail,TopManagementALC/Id,TopManagementALC/Title,TopManagementALC/EMail,TopManagementGeneral/Id,TopManagementGeneral/Title,TopManagementGeneral/EMail&$expand=Admins,TopManagementALC,TopManagementGeneral&$top=5",
                "?$select=Id,Title,TopManagementALC/Id,TopManagementALC/Title,TopManagementALC/EMail,TopManagementGeneral/Id,TopManagementGeneral/Title,TopManagementGeneral/EMail&$expand=TopManagementALC,TopManagementGeneral&$top=5",
                "?$select=Id,Title,TopManagement_x0020_ALC/Id,TopManagement_x0020_ALC/Title,TopManagement_x0020_ALC/EMail,TopManagement_x0020_General/Id,TopManagement_x0020_General/Title,TopManagement_x0020_General/EMail&$expand=TopManagement_x0020_ALC,TopManagement_x0020_General&$top=5",
                "?$top=5"
            ];

            for (const q of queries) {
                try {
                    const url = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items${q}`;
                    const res = await fetch(url, { headers: { "Accept": "application/json; odata=verbose" } });
                    if (res.ok) {
                        const data = await res.json();
                        const items = (data.d && data.d.results) ? data.d.results : (data.value || []);
                        if (items.length > 0) {
                            const item = items[0];
                            this.topManagementState.itemId = item.Id;

                            const rawAlc = item.TopManagementALC || item.TopManagement_x0020_ALC || item.TopManagementAlc;
                            this.topManagementState.alcUsers = this.normalizeUsers(rawAlc);

                            const rawGen = item.TopManagementGeneral || item.TopManagement_x0020_General || item.TopManagementgeneral || item.TopManagementTemplates || item.TopManagementOther;
                            this.topManagementState.generalUsers = this.normalizeUsers(rawGen);

                            console.log("Loaded Top Management Config from AdminPanel list:", this.topManagementState);
                            loaded = true;
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Error querying list '${listName}' for TopManagement with query '${q}':`, err);
                }
            }
        }

        // Mock fallback if offline or local
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocal && !loaded && this.topManagementState.alcUsers.length === 0 && this.topManagementState.generalUsers.length === 0) {
            this.topManagementState.alcUsers = [
                { id: 101, title: "Mishab Muhammed", email: "mishab@bectors.com" }
            ];
            this.topManagementState.generalUsers = [
                { id: 108, title: "Gokul K", email: "gokul.k@bectors.com" }
            ];
        }

        this.topManagementState.isLoading = false;
        this.updateStatsCounters();
        return this.topManagementState;
    },

    /**
     * Saves Top Management configuration to SharePoint 'AdminPanel' list
     */
    saveTopManagementConfig: async function (btnSave) {
        const siteUrl = this.getSiteUrl();
        const listName = "AdminPanel";
        const itemId = this.topManagementState.itemId || 1;

        try {
            const digest = await this.getFormDigest();
            const alcUserIds = [];
            for (const u of (this.topManagementState.alcUsers || [])) {
                const spId = await this.resolveSpUserId(u);
                if (spId) alcUserIds.push(spId);
            }

            const genUserIds = [];
            for (const u of (this.topManagementState.generalUsers || [])) {
                const spId = await this.resolveSpUserId(u);
                if (spId) genUserIds.push(spId);
            }

            const payload = {
                "__metadata": { "type": "SP.Data.AdminPanelListItem" },
                "TopManagementALCId": { "results": alcUserIds },
                "TopManagementGeneralId": { "results": genUserIds }
            };

            const url = `${siteUrl}/_api/web/lists/getByTitle('${listName}')/items(${itemId})`;
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "Content-Type": "application/json; odata=verbose",
                    "X-RequestDigest": digest,
                    "X-HTTP-Method": "MERGE",
                    "If-Match": "*"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok || res.status === 204) {
                this.showToast("Top Management escalation matrix updated successfully!", "success");
                this.updateStatsCounters();
                return true;
            } else {
                const errText = await res.text();
                console.error("Failed saving TopManagement:", res.status, errText);
                this.showToast("SharePoint Error: " + res.statusText, "error");
                if (btnSave) {
                    btnSave.innerText = "Save Changes";
                    btnSave.disabled = false;
                }
                return false;
            }
        } catch (e) {
            console.error("Error in saveTopManagementConfig:", e);
            this.showToast("Error saving Top Management: " + e.message, "error");
            if (btnSave) {
                btnSave.innerText = "Save Changes";
                btnSave.disabled = false;
            }
            return false;
        }
    },

    /**
     * Renders Top Management Configuration View with standard clean cards & people picker
     */
    renderTopManagementTab: function () {
        const mount = document.getElementById("adminTabContentMount");
        if (!mount) return;

        const alcUsers = this.topManagementState.alcUsers || [];
        const genUsers = this.topManagementState.generalUsers || [];

        mount.innerHTML = `
            <div class="admin-panel-card">
                <div class="admin-panel-header">
                    <div class="admin-panel-title-area">
                        <h3 class="admin-panel-title">Top Management Escalation Matrix</h3>
                        <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">
                            Configure executive distribution lists for automated incident email notifications on critical failures.
                        </p>
                    </div>
                </div>

                <div class="admin-cards-grid-container">
                    <div class="admin-cards-grid">
                        <!-- Card 1: ALC Critical Gate Escalation Team -->
                        <div class="admin-role-card">
                            <div class="admin-card-header">
                                <div class="admin-card-header-left">
                                    <div class="admin-card-title-row">
                                        <h4 class="admin-card-title">ALC Critical Gate Escalation Team</h4>
                                        <span class="admin-card-tag config" style="font-size: 11.5px;">ALC Checklist</span>
                                    </div>
                                </div>
                                <div class="admin-card-header-right">
                                    <button type="button" class="admin-btn-manage-users" onclick="Rajpura_Admin.openTopManagementModal('alc')">
                                        + Add Member
                                    </button>
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-card-section">
                                    <div class="admin-card-section-header">
                                        <div class="admin-card-section-title">
                                            <span class="role-icon"></span>
                                            <span>Designated Leadership Members</span>
                                            <span class="admin-count-pill">${alcUsers.length}</span>
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                                        <i class="fa fa-envelope-o" style="color: #2563eb;"></i> Dispatched on any ALC Critical Gate failure during tour inspection.
                                    </div>
                                    <div class="admin-users-list">
                                        ${alcUsers.length > 0 ? alcUsers.map(u => `
                                            <span class="admin-user-chip qa" title="${this.escapeHtml(u.email || u.title)}">
                                                <span class="admin-user-avatar">${this.getInitials(u.title)}</span>
                                                <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                                                <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveTopManagementUser('alc', ${u.id})" title="Remove member">&times;</button>
                                            </span>
                                        `).join("") : `<span class="admin-no-users">No ALC leadership members assigned</span>`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 2: Quality Templates (Category A) Escalation Team -->
                        <div class="admin-role-card">
                            <div class="admin-card-header">
                                <div class="admin-card-header-left">
                                    <div class="admin-card-title-row">
                                        <h4 class="admin-card-title">Quality Templates (Category A) Escalation Team</h4>
                                        <span class="admin-card-tag area" style="font-size: 11.5px; background: #fff1f2; color: #e11d48; border-color: #fecdd3;">4 Quality Forms</span>
                                    </div>
                                </div>
                                <div class="admin-card-header-right">
                                    <button type="button" class="admin-btn-manage-users" onclick="Rajpura_Admin.openTopManagementModal('general')">
                                        + Add Member
                                    </button>
                                </div>
                            </div>
                            <div class="admin-card-body">
                                <div class="admin-card-section">
                                    <div class="admin-card-section-header">
                                        <div class="admin-card-section-title">
                                            <span class="role-icon"></span>
                                            <span>Designated Leadership Members</span>
                                            <span class="admin-count-pill">${genUsers.length}</span>
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                                        <i class="fa fa-envelope-o" style="color: #e11d48;"></i> Dispatched on Category A (Critical) defects in Mixing, Baking, Packaging, CCP/OPRP/Sieves, or Food Safety.
                                    </div>
                                    <div class="admin-users-list">
                                        ${genUsers.length > 0 ? genUsers.map(u => `
                                            <span class="admin-user-chip prod" style="background: #fff1f2; color: #9f1239; border-color: #fecdd3;" title="${this.escapeHtml(u.email || u.title)}">
                                                <span class="admin-user-avatar" style="background: #e11d48; color: #ffffff;">${this.getInitials(u.title)}</span>
                                                <span class="admin-user-name">${this.escapeHtml(u.title)}</span>
                                                <button type="button" class="admin-user-chip-remove" onclick="Rajpura_Admin.quickRemoveTopManagementUser('general', ${u.id})" title="Remove member">&times;</button>
                                            </span>
                                        `).join("") : `<span class="admin-no-users">No Quality Templates leadership members assigned</span>`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Opens standard people picker modal for Top Management section
     */
    openTopManagementModal: function (section) {
        const mount = document.getElementById("adminModalMount");
        if (!mount) return;

        const isAlc = section === "alc";
        const currentUsers = isAlc ? (this.topManagementState.alcUsers || []) : (this.topManagementState.generalUsers || []);

        this.pickerState = {
            topmgmt: [...currentUsers]
        };

        const modalTitle = isAlc 
            ? "Assign ALC Critical Gate Escalation Members"
            : "Assign Quality Templates (Category A) Escalation Members";

        mount.innerHTML = `
            <div class="admin-modal-backdrop" id="adminModalBackdrop" onclick="Rajpura_Admin.onModalBackdropClick(event)">
                <div class="admin-modal-card">
                    <div class="admin-modal-header">
                        <h4 class="admin-modal-title">${this.escapeHtml(modalTitle)}</h4>
                        <button type="button" class="admin-modal-close" onclick="Rajpura_Admin.closeModal()">&times;</button>
                    </div>
                    <div class="admin-modal-body">
                        <div class="admin-form-group">
                            <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Assigned Leadership Members</span>
                                <span style="font-size: 11.5px; color: #1e40af; font-weight: 600;">Editable &bull; Multi-User</span>
                            </label>
                            <div class="admin-user-picker-container" id="modal-picker-topmgmt">
                                <div class="admin-selected-chips-box" onclick="document.getElementById('picker-input-topmgmt').focus()">
                                    <div id="selected-chips-topmgmt" style="display: flex; flex-wrap: wrap; gap: 4px;"></div>
                                    <input type="text" id="picker-input-topmgmt" class="admin-picker-search-input" placeholder="Search employee name or email to add..." oninput="Rajpura_Admin.onPickerSearch('topmgmt', this.value)" autocomplete="off" />
                                </div>
                                <div class="admin-picker-dropdown" id="dropdown-topmgmt" style="display: none;"></div>
                            </div>
                            <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">
                                Search from master EmployeeList to add executive members. Click &times; on chip to remove.
                            </div>
                        </div>
                    </div>
                    <div class="admin-modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="admin-btn-secondary" onclick="Rajpura_Admin.closeModal()">Cancel</button>
                        <button type="button" class="admin-btn-primary" id="btn-save-topmgmt-modal" onclick="Rajpura_Admin.submitTopManagementModal('${section}')">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.renderSelectedChips("topmgmt");
        setTimeout(() => {
            const input = document.getElementById("picker-input-topmgmt");
            if (input) input.focus();
        }, 100);
    },

    /**
     * Submits updated Top Management members from modal and persists to SharePoint
     */
    submitTopManagementModal: async function (section) {
        const isAlc = section === "alc";
        const selectedUsers = this.pickerState.topmgmt || [];

        const btnSave = document.getElementById("btn-save-topmgmt-modal");
        if (btnSave) {
            btnSave.innerText = "Saving to SharePoint...";
            btnSave.disabled = true;
        }

        if (isAlc) {
            this.topManagementState.alcUsers = selectedUsers;
        } else {
            this.topManagementState.generalUsers = selectedUsers;
        }

        const success = await this.saveTopManagementConfig(btnSave);
        if (success) {
            this.closeModal();
            this.renderTopManagementTab();
            this.updateStatsCounters();
        }
    },

    /**
     * Quick-remove a member directly from role card and update SharePoint
     */
    quickRemoveTopManagementUser: async function (section, userId) {
        const isAlc = section === "alc";
        const currentList = isAlc ? (this.topManagementState.alcUsers || []) : (this.topManagementState.generalUsers || []);
        const userToRemove = currentList.find(u => u.id === userId);

        if (!confirm(`Remove ${userToRemove ? userToRemove.title : 'this member'} from Top Management escalation?`)) {
            return;
        }

        const remaining = currentList.filter(u => u.id !== userId);
        if (isAlc) {
            this.topManagementState.alcUsers = remaining;
        } else {
            this.topManagementState.generalUsers = remaining;
        }

        await this.saveTopManagementConfig();
        this.renderTopManagementTab();
        this.updateStatsCounters();
    }
};

// Auto-initialize when document is ready
$(document).ready(function () {
    Rajpura_Admin.init();
});

// Expose to window for global access
window.Rajpura_Admin = Rajpura_Admin;
