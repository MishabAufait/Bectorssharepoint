// Main Orchestrator for Rajpura CCP, OPRP, Sieves & Magnets Quality form
console.log("CCP_OPRP_Sieves Main JS loaded");

// Intercept ShowLoader and HideLoader to show/hide full screen loading overlay
(function () {
    const originalShowLoader = window.ShowLoader;
    const originalHideLoader = window.HideLoader;

    window.ShowLoader = function () {
        if (typeof originalShowLoader === "function") originalShowLoader();
        const overlay = document.getElementById("loading-overlay");
        if (overlay) overlay.style.display = "block";
    };

    window.HideLoader = function () {
        if (typeof originalHideLoader === "function") originalHideLoader();
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.style.display = "none";
            overlay.innerHTML = ""; // Clear progress loader box
        }
    };
})();

const CCP_OPRP_Main = {
    state: {
        varTourID: null,
        tourData: {},
        category: null, // "CCP" or "SIEVES"
        frequency: "4hrs", // "4hrs" or "8hrs" for Sieves
        selectedLine: "",
        qaExecutive: "",
        productionIncharge: "",
        site: "",
        cycleCounter: 1
    },

    init: async function () {
        // Save last visited dashboard category
        localStorage.setItem("lastVisitedDashboard", "CCP_OPRP_Sieves");

        this.state.varTourID = this.getQueryStringParam("TourId");
        
        try {
            // 1. Fetch configs from SharePoint mapping list
            this.configList = await CCP_OPRP_DAL.getConfig();
            console.log("SharePoint configuration mappings loaded:", this.configList);

            // 2. Fetch Parent Tour details
            if (this.state.varTourID) {
                this.state.tourData = await CCP_OPRP_DAL.getParentTour(this.state.varTourID);
                console.log("Parent Tour details loaded:", this.state.tourData);
                
                // Expiry Check: Check if tour was created on a previous day and is not terminal
                const creationTime = this.state.tourData.createdon || this.state.tourData.cr3ea_tourstartdate;
                const status = this.state.tourData.cr3ea_status || "In Progress";
                if (creationTime) {
                    const parsedDate = moment(creationTime, [
                        "DD-MM-YYYY HH:mm:ss",
                        "DD-MM-YYYY hh:mm A",
                        "YYYY-MM-DDTHH:mm:ssZ",
                        "YYYY-MM-DDTHH:mm:ss.SSSZ",
                        "YYYY-MM-DD HH:mm:ss"
                    ], true);
                    if (parsedDate && parsedDate.isValid()) {
                        const tourDateLocal = parsedDate.local().format("YYYY-MM-DD");
                        const todayLocal = moment().format("YYYY-MM-DD");
                        if (tourDateLocal !== todayLocal && 
                            status !== "Closed - Expired" && 
                            status !== "Completed" && 
                            status !== "Closed" && 
                            status !== "Success") {
                            
                            console.log(`Tour is from a previous day (${tourDateLocal}) and is in state "${status}". Auto-expiring and closing...`);
                            try {
                                const payload = {
                                    cr3ea_status: "Closed - Expired",
                                    cr3ea_processstatus: "Closed - Expired"
                                };
                                await CCP_OPRP_DAL.updateParentTour(this.state.varTourID, payload);
                                this.state.tourData.cr3ea_status = "Closed - Expired";
                                this.state.tourData.cr3ea_processstatus = "Closed - Expired";
                                console.log("Tour successfully closed and expired in Dataverse.");
                            } catch (e) {
                                console.error("Failed to automatically close/expire previous day's tour:", e);
                            }
                        }
                    }
                }

                const pType = this.state.tourData.cr3ea_ccp_oprp_sieves_parametertype;
                if (pType) {
                    // Tour already initialized, load checklist form directly
                    this.state.category = pType === "CCP & OPRP" ? "CCP" : "SIEVES";
                    this.state.frequency = this.state.tourData.cr3ea_ccp_oprp_sieves_frequency || "4hrs";
                    this.state.selectedLine = this.state.tourData.cr3ea_lineno || this.state.tourData.cr3ea_lineid || "";
                    this.state.product = this.state.tourData.cr3ea_runningvariety || this.state.tourData.cr3ea_productname || "";
                    this.state.qaExecutive = this.state.tourData.cr3ea_assigned_qa || "";
                    this.state.productionIncharge = this.state.tourData.cr3ea_shiftexecutiveproduction || "";
                    this.state.site = this.state.tourData.cr3ea_plantid || "Rajpura";
                }
            }

            // 3. Resolve user roles and authorizations
            await this.identifyUserRole();

            if (this.state.varTourID && this.state.tourData.cr3ea_ccp_oprp_sieves_parametertype) {
                document.getElementById("setup-form-container").style.display = "none";
                document.getElementById("checklist-main-container").style.display = "block";
                
                // Render header title
                const titleText = this.state.category === "CCP" ? "CCP & OPRP RECORD" : "SIEVES & MAGNETS MONITORING RECORD";
                document.querySelector(".tour-header-title").innerText = `${titleText} (RAJPURA)`;

                await this.loadCyclesHistory();

                // Toggle complete tour button visibility
                const compContainer = document.getElementById("complete-tour-btn-container");
                if (compContainer) {
                    const isCompleted = this.state.tourData.cr3ea_status === "Completed" || 
                                        this.state.tourData.cr3ea_status === "Success" || 
                                        this.state.tourData.cr3ea_status === "Closed" ||
                                        this.state.tourData.cr3ea_status === "Closed - Expired";
                    compContainer.style.display = (isCompleted || !this.state.canEditChecklist) ? "none" : "flex";
                }
            } else {
                // Tour exists but parameters are not set yet, show setup form
                this.renderSetupForm();
            }
        } catch (err) {
            console.error("Initialization failed: ", err);
            alert("Dataverse Connection Failed: Unable to initialize CCP, OPRP, Sieves & Magnets module.\n\n" + (err.message || "Please check network or login session."));
        }
    },

    identifyUserRole: async function () {
        const currentUserName = typeof currentUser !== "undefined" ? currentUser : "";
        const currentUserLogin = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : "";
        const currentUserEmail = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userEmail : "";

        // Default flags
        this.state.isQaUser = false;
        this.state.isProductionUser = false;
        this.state.isEscalationManager = false;

        const currentLine = this.state.selectedLine;
        const configType = this.state.category === "CCP" ? "CCP_OPRP" : "Sieves_Magnets";

        // Find configuration matching active line / config type
        const config = this.configList.find(c => 
            (c.ConfigType === configType || (configType === "Sieves_Magnets" && c.ConfigType === "Sieves and Magnets")) &&
            (!currentLine || c.Title === currentLine)
        );

        const matchUser = (userResults) => {
            if (!userResults || !userResults.results) return false;
            const loginEmail = String(currentUserEmail || "").toLowerCase().trim();
            const loginPart = loginEmail.split("@")[0];
            return userResults.results.some(u => {
                const uEmail = String(u.EMail || "").toLowerCase().trim();
                const uPart = uEmail.split("@")[0];
                return loginEmail && uEmail && (loginEmail === uEmail || (uPart && loginPart && uPart === loginPart));
            });
        };

        if (config) {
            this.state.isQaUser = matchUser(config.AssignedQA);
            this.state.isProductionUser = matchUser(config.ProductionIncharge);
            this.state.isEscalationManager = matchUser(config.EscalationManager);
        }

        // If not matched to line-specific config, check if user matches ANY QA config in list
        if (!this.state.isQaUser) {
            this.state.isQaUser = this.configList.some(c => matchUser(c.AssignedQA));
        }
        if (!this.state.isProductionUser) {
            this.state.isProductionUser = this.configList.some(c => matchUser(c.ProductionIncharge));
        }
        if (!this.state.isEscalationManager) {
            this.state.isEscalationManager = this.configList.some(c => matchUser(c.EscalationManager));
        }

        // URL Override for testing and verification
        const urlRole = new URLSearchParams(window.location.search).get('role');
        if (urlRole) {
            const roleUpper = urlRole.toUpperCase();
            if (roleUpper === "QA") {
                this.state.isQaUser = true;
                this.state.isProductionUser = false;
                this.state.isEscalationManager = false;
            } else if (roleUpper === "PRODUCTION") {
                this.state.isQaUser = false;
                this.state.isProductionUser = true;
                this.state.isEscalationManager = false;
            } else if (roleUpper === "ESCALATION") {
                this.state.isQaUser = false;
                this.state.isProductionUser = false;
                this.state.isEscalationManager = true;
            } else if (roleUpper === "VIEWER") {
                this.state.isQaUser = false;
                this.state.isProductionUser = false;
                this.state.isEscalationManager = false;
            }
            console.log(`User role overridden via URL to: ${roleUpper}`);
        }

        // Calculate final permissions
        const assignedQA = (this.state.tourData?.cr3ea_assigned_qa || "").toLowerCase().trim();
        const myEmail = currentUserEmail.toLowerCase().trim();
        const myName1 = currentUserName.toLowerCase().trim();
        const myName2 = currentUserLogin.toLowerCase().trim();

        let isAssignedQA = false;
        if (!assignedQA) {
            isAssignedQA = this.state.isQaUser;
        } else {
            const cleanAssignedQA = assignedQA.toLowerCase().trim();
            const myEmailPart = myEmail.split("@")[0].trim();
            const qaEmailPart = cleanAssignedQA.split("@")[0].trim();
            isAssignedQA = (myEmail && (myEmail === cleanAssignedQA || myEmail.includes(cleanAssignedQA) || cleanAssignedQA.includes(myEmail) || (myEmailPart && qaEmailPart && myEmailPart === qaEmailPart)));
        }

        this.state.canEditChecklist = isAssignedQA;
        this.state.canEditCorrectiveAction = this.state.isProductionUser || this.state.isEscalationManager;

        console.log("User roles and authorization resolved:", {
            currentUserEmail,
            isQaUser: this.state.isQaUser,
            isProductionUser: this.state.isProductionUser,
            isEscalationManager: this.state.isEscalationManager,
            isAssignedQA,
            canEditChecklist: this.state.canEditChecklist,
            canEditCorrectiveAction: this.state.canEditCorrectiveAction
        });
    },

    renderSetupForm: function () {
        document.getElementById("setup-form-container").style.display = "block";
        document.getElementById("checklist-main-container").style.display = "none";

        if (!this.state.isQaUser) {
            $('#setup-type, #setup-site, #setup-line, #setup-product, #setup-freq, #setup-qa, #setup-prod').prop('disabled', true);
        }

        // Setup dropdown listeners
        const typeSelect = document.getElementById("setup-type");
        const lineSelect = document.getElementById("setup-line");
        const freqGroup = document.getElementById("setup-freq-group");
        const lineGroup = document.getElementById("setup-line-group");
        const productGroup = document.getElementById("setup-product-group");

        const updatePersonnel = () => {
            const typeVal = typeSelect.value;
            const lineVal = lineSelect.value;
            const qaSelect = document.getElementById("setup-qa");
            const prodSelect = document.getElementById("setup-prod");

            qaSelect.innerHTML = "";
            prodSelect.innerHTML = "";

            let matchingConfigs = [];
            if (typeVal === "Sieves and Magnets") {
                matchingConfigs = this.configList.filter(c => c.ConfigType === "Sieves_Magnets" || c.ConfigType === "Sieves and Magnets");
            } else {
                matchingConfigs = this.configList.filter(c => c.ConfigType === "CCP_OPRP" || c.ConfigType === "CCP & OPRP");
            }

            console.log("updatePersonnel triggered:", {
                typeVal: typeVal,
                configList: this.configList,
                matchingConfigs: matchingConfigs
            });

            const qas = {};
            const prods = {};

            matchingConfigs.forEach(c => {
                if (c.AssignedQA && c.AssignedQA.results) {
                    c.AssignedQA.results.forEach(u => {
                        if (u.EMail && u.Title) qas[u.EMail.toLowerCase().trim()] = u.Title;
                    });
                }
                if (c.ProductionIncharge && c.ProductionIncharge.results) {
                    c.ProductionIncharge.results.forEach(u => {
                        if (u.EMail && u.Title) prods[u.EMail.toLowerCase().trim()] = u.Title;
                    });
                }
            });

            console.log("Extracted personnel sets from SharePoint:", {
                qas: qas,
                prods: prods
            });

            // Add empty choice at the top
            qaSelect.insertAdjacentHTML("beforeend", `<option value="">Select QA Executive...</option>`);
            prodSelect.insertAdjacentHTML("beforeend", `<option value="">Select Production Executive...</option>`);

            for (const email in qas) {
                qaSelect.insertAdjacentHTML("beforeend", `<option value="${email}">${qas[email]}</option>`);
            }

            for (const email in prods) {
                prodSelect.insertAdjacentHTML("beforeend", `<option value="${email}">${prods[email]}</option>`);
            }

            // Set initial value to empty
            qaSelect.value = "";
            prodSelect.value = "";

            // Pre-select active user email if matching option exists
            const myEmail = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userEmail) ? String(_spPageContextInfo.userEmail).toLowerCase().trim() : "";
            if (myEmail) {
                const options = Array.from(qaSelect.options);
                const match = options.find(opt => opt.value.toLowerCase() === myEmail);
                if (match) {
                    qaSelect.value = match.value;
                }
            } else if (typeof EmployeeName !== 'undefined' && EmployeeName) {
                const options = Array.from(qaSelect.options);
                const match = options.find(opt => opt.text.toLowerCase() === EmployeeName.toLowerCase());
                if (match) {
                    qaSelect.value = match.value;
                }
            }

            // Initialize select2 on personnel elements
            $('#setup-qa, #setup-prod').select2({
                minimumResultsForSearch: -1,
                dropdownAutoWidth: true,
                width: '100%'
            });

            // Dynamically validate and enable/disable the start button
            const validateStartButton = () => {
                const qaVal = $('#setup-qa').val();
                const prodVal = $('#setup-prod').val();
                const btn = document.getElementById("start-tour-btn");
                if (btn) {
                    if (!this.state.isQaUser) {
                        btn.disabled = true;
                        btn.innerText = "QA Authorization Required";
                    } else {
                        btn.disabled = (!qaVal || !prodVal);
                        btn.innerText = "Start Quality Tour";
                    }
                }
            };

            // Bind Select2 change listener
            $('#setup-qa, #setup-prod').off('change.validation').on('change.validation', validateStartButton);

            // Run initial check
            validateStartButton();
            $('#setup-qa, #setup-prod').trigger('change');
        };

        // Register select2 change events
        $('#setup-type').on("change", () => {
            if (typeSelect.value === "Sieves and Magnets") {
                freqGroup.style.display = "block";
                lineGroup.style.display = "none";
                productGroup.style.display = "none";
            } else {
                freqGroup.style.display = "none";
                lineGroup.style.display = "block";
                productGroup.style.display = "block";
            }
            updatePersonnel();
        });

        $('#setup-line').on("change", () => {
            updatePersonnel();
        });

        // Trigger personnel dropdown load initially
        updatePersonnel();
    },

    startTour: async function () {
        const typeVal = document.getElementById("setup-type").value;
        const siteVal = document.getElementById("setup-site").value;
        const lineVal = document.getElementById("setup-line")?.value || "";
        const productVal = document.getElementById("setup-product")?.value || "";
        const freqVal = document.getElementById("setup-freq")?.value || "4hrs";
        const prodVal = document.getElementById("setup-prod").value;
        const qaVal = document.getElementById("setup-qa").value;

        if (!prodVal || !qaVal) {
            alert("Please fill in QA Executive and Shift Production Incharge names.");
            return;
        }

        const btn = document.getElementById("start-tour-btn");
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Starting Tour...";
        }

        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateStr = `${dd}${mm}${yyyy}`;
        const titlePrefix = typeVal === "CCP & OPRP" ? "CCP" : "Sieves";
        const lineStr = typeVal === "CCP & OPRP" ? lineVal : "All";

        const payload = {
            cr3ea_ccp_oprp_sieves_parametertype: typeVal,
            cr3ea_ccp_oprp_sieves_frequency: typeVal === "Sieves and Magnets" ? freqVal : null,
            cr3ea_runningvariety: typeVal === "CCP & OPRP" ? productVal : null,
            cr3ea_plantid: siteVal === "Rajpura" ? QualityRajpura_Config.PLANT_ID : siteVal,
            cr3ea_lineno: typeVal === "CCP & OPRP" ? lineVal : null,
            cr3ea_assigned_qa: qaVal,
            cr3ea_shiftexecutiveproduction: prodVal,
            cr3ea_observedby: prodVal,
            cr3ea_status: "In Progress",
            cr3ea_shift: sessionStorage.getItem("shiftValue") || "Shift-1",
            cr3ea_tourstartdate: now.toISOString(),
            cr3ea_title: `${titlePrefix}_${siteVal}_${lineStr}_${dateStr}`
        };

        try {
            if (this.state.varTourID) {
                payload.cr3ea_prod_rajpura_quality_tourid = this.state.varTourID;
            }
            
            const savedTour = await CCP_OPRP_DAL.saveTourSession(payload);
            const savedId = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                ? QualityRajpura_Config.getTourId(savedTour)
                : (savedTour && (savedTour.cr3ea_prod_rajpura_quality_tourid || savedTour.cr3ea_rajpura_quality_tourid));
            if (!this.state.varTourID && savedId) {
                this.state.varTourID = savedId;
            }
            
            // Set active states
            this.state.category = typeVal === "CCP & OPRP" ? "CCP" : "SIEVES";
            this.state.frequency = freqVal;
            this.state.selectedLine = lineVal;
            this.state.qaExecutive = qaVal;
            this.state.productionIncharge = prodVal;
            this.state.site = siteVal;

            document.getElementById("setup-form-container").style.display = "none";
            document.getElementById("checklist-main-container").style.display = "block";
            
            const titleText = this.state.category === "CCP" ? "CCP & OPRP RECORD" : "SIEVES & MAGNETS MONITORING RECORD";
            document.querySelector(".tour-header-title").innerText = `${titleText} (RAJPURA)`;

            await this.loadCyclesHistory();
        } catch (err) {
            console.error("Failed to start tour: ", err);
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Start Quality Tour";
            }
            alert("Error initializing tour checklist. Please try again.");
        }
    },

    loadCyclesHistory: async function () {
        const parentElement = document.querySelector(".tour-cycle-card-panel-lists");
        if (parentElement) parentElement.innerHTML = '';

        try {
            // Load child records from Dataverse
            const items = await CCP_OPRP_DAL.getChecklistItems(this.state.varTourID, this.state.category);
            
            // Group records by cycle key
            const grouped = {};
            items.forEach(item => {
                const cycleKey = item.cr3ea_cycle || "Cycle-1";
                const cycleNum = parseInt(cycleKey.replace("Cycle-", "")) || 1;
                
                if (!grouped[cycleNum]) {
                    grouped[cycleNum] = {
                        cycleNum: cycleNum,
                        productName: "",
                        executiveName: CCP_OPRP_Main.state.productionIncharge || "",
                        location: CCP_OPRP_Main.state.selectedLine || "",
                        sessionTime: "",
                        response: "OK",
                        rows: []
                    };
                }
                
                if (item.cr3ea_productname) grouped[cycleNum].productName = item.cr3ea_productname;
                if (item.cr3ea_executivename) grouped[cycleNum].executiveName = item.cr3ea_executivename;
                if (item.cr3ea_location) grouped[cycleNum].location = item.cr3ea_location;
                if (item.cr3ea_tourstartdate) {
                    grouped[cycleNum].sessionTime = item.cr3ea_tourstartdate;
                } else if (item.createdon) {
                    grouped[cycleNum].sessionTime = item.createdon;
                }
                if (item.cr3ea_acceptanceresponse && item.cr3ea_acceptanceresponse !== "In Progress") {
                    grouped[cycleNum].response = item.cr3ea_acceptanceresponse;
                }
                
                grouped[cycleNum].rows.push(item);
            });

            const cyclesList = Object.values(grouped).sort((a, b) => a.cycleNum - b.cycleNum);
            const isTourCompleted = this.state.tourData?.cr3ea_status === "Completed" || 
                                     this.state.tourData?.cr3ea_status === "Success" || 
                                     this.state.tourData?.cr3ea_status === "Closed" ||
                                     this.state.tourData?.cr3ea_status === "Closed - Expired";
            
            if (cyclesList.length > 0) {
                cyclesList.forEach(cData => {
                    CCP_OPRP_Checklist.renderCycleSection(cData.cycleNum, true, cData);
                });
                
                const lastCycle = cyclesList[cyclesList.length - 1];
                const lastStatus = CCP_OPRP_Checklist.getCycleStatus(lastCycle);
                const isLastCycleFinished = lastStatus === "Completed" || lastStatus === "Not Operational" || lastStatus === "Escalated";

                this.state.cycleCounter = Math.max(...cyclesList.map(c => c.cycleNum)) + 1;

                // Render next cycle slot ONLY if preceding cycles are finished and parent tour is open
                if (!isTourCompleted && isLastCycleFinished) {
                    CCP_OPRP_Checklist.renderCycleSection(this.state.cycleCounter, false);
                }
            } else {
                this.state.cycleCounter = 1;
                if (isTourCompleted && (this.state.tourData?.cr3ea_status === "Closed - Expired" || String(this.state.tourData?.cr3ea_status).includes("Expired"))) {
                    if (parentElement) {
                        parentElement.innerHTML = `
                            <div class="alert alert-danger text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #fecaca; background-color: #fee2e2; color: #b91c1c; font-family: sans-serif;">
                                <h4 style="font-weight: 700; margin-bottom: 8px;">Expired while In Progress / QA Process</h4>
                                <p style="margin: 0; font-size: 14px;">This checklist session was closed automatically because it expired before completion.</p>
                            </div>
                        `;
                    }
                } else if (!isTourCompleted) {
                    CCP_OPRP_Checklist.renderCycleSection(1, false);
                }
            }
            
        } catch (e) {
            console.error("Failed to load cycles history: ", e);
            // Render at least Cycle-1 on error if not completed
            const isTourCompleted = this.state.tourData?.cr3ea_status === "Completed" || 
                                     this.state.tourData?.cr3ea_status === "Success" || 
                                     this.state.tourData?.cr3ea_status === "Closed" ||
                                     this.state.tourData?.cr3ea_status === "Closed - Expired";
            if (!isTourCompleted) {
                CCP_OPRP_Checklist.renderCycleSection(1, false);
            }
        }
    },

    getQueryStringParam: function (name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};
