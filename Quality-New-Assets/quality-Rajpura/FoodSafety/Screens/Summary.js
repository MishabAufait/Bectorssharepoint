// Screen 5: Summary Screen
console.log("Summary Screen loaded");

const FoodSafety_Summary = {
    ppeItems: [
        "Hair Net Wearing Issue / Beard Net",
        "Apron (Torn, Dirty)",
        "Personal Hygiene (Nail without trimming/paint, Heena application)",
        "Jewellery Policy (Bracelet, Thread, Ring, Bindi)"
    ],

    newBlockLocations: [
        "Hand Wash Area", "Plant Entry", "Near Washing Area", "Near Emergency Gate", 
        "Near Packing Area", "Invert Syrup Room", "Broken Room", "Premixing Room", 
        "Mixing Entrance", "Washing Area", "Infront of Terrace Gate", 
        "New Plant Worker Entry 1", "New Plant Worker Entry 2", "Cream Room", 
        "Line 7 Packing", "RM Unloading Bay 1", "RM Unloading Bay 2", 
        "Line 6 Packing", "RM Store 1st Floor"
    ],
    
    oldBlockLocations: [
        "RM Unloading Bay", "Biscuit Grinding Room", "RM Storage", "Outside Cold Room", 
        "Maintenance Change Room", "Outside Maintenance Change Room", "Oven Area", 
        "Outside QA Lab", "Staff Hand Wash", "Outside Staff Canteen", "Staff Canteen", 
        "Near Worker Entry", "Worker Entry Hand Wash Area", "Outside HR Office", 
        "Near PM Warehouse Door", "Near PM Warehouse", "Near FG Warehouse Door", 
        "Outside DH Room", "Near Emergency Exit 1", "Near Emergency Exit 2", 
        "Near Emergency Exit 3", "Near Emergency Exit 4", "Near Emergency Exit 5", 
        "Wash Area", "Mixing Section HAAS Line", "Cooling Conveyor HAAS Line", 
        "Packing Section HAAS Line", "Outside Flavour Room", "New Cold Room Gallery 1", 
        "New Cold Room Gallery 2", "PM Warehouse", "FG Warehouse", "Worker Canteen", 
        "Mondelez Packing", "Line 8 Packing", "Line 8 Mixing", "FG Main Warehouse"
    ],

    resolveUserName: function(emailOrName) {
        if (!emailOrName) return "";
        if (!emailOrName.includes("@")) return emailOrName;
        const clean = emailOrName.split("@")[0].trim();
        return clean.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    },

    renderRemarksWithProof: function (rawRemarks) {
        if (!rawRemarks || rawRemarks === "--" || rawRemarks === "N/A" || (typeof rawRemarks === "string" && rawRemarks.trim() === "")) {
            return `<span style="color: #94a3b8;">--</span>`;
        }
        const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
            ? QualityRajpura_Config.parseRemarksAndProof(rawRemarks)
            : { remarks: "", proofUrl: "" };

        let remarksText = parsed.remarks;
        let proofUrl = parsed.proofUrl;

        let html = "";
        if (remarksText) {
            html += `<span>${remarksText}</span>`;
        }
        if (proofUrl) {
            const badgeMargin = remarksText ? "margin-left: 8px;" : "";
            html += `
                <a href="${proofUrl}" target="_blank" class="badge food-safety-proof-badge" 
                   style="display: inline-flex !important; align-items: center !important; gap: 5px !important; padding: 4px 10px !important; font-size: 11px !important; background-color: #0284c7 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; border-radius: 4px !important; text-decoration: none !important; font-weight: 600 !important; ${badgeMargin}">
                    <span style="color: #ffffff !important;">📷 View Proof</span>
                </a>
            `;
        }
        return html || `<span style="color: #94a3b8;">--</span>`;
    },

    init: async function (tourId) {
        console.log("Initializing Checklist Summary Screen for Tour ID:", tourId);
        
        try {
            ShowLoader();
            
            HeaderComponent.render("summary-header-wrapper");
            
            const cleanTourId = tourId ? String(tourId).replace(/[{}]/g, "").trim().toLowerCase() : "";
            
            // 1. Fetch Tour History to find parent record details
            const tours = await FoodSafety_DAL.getTourHistory();
            const parent = tours.find(t => {
                const tid = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.getTourId)
                    ? QualityRajpura_Config.getTourId(t)
                    : (t.cr3ea_prod_rajpura_quality_tourid || t.cr3ea_rajpura_quality_tourid);
                return tid && String(tid).replace(/[{}]/g, "").trim().toLowerCase() === cleanTourId;
            });
            
            if (!parent) {
                throw new Error(`Tour session with ID ${tourId} not found in quality tours log.`);
            }
            
            // 2. Fetch associated child checkpoints from Dataverse
            const childItems = await FoodSafety_DAL.getChecklistItems(cleanTourId);
            console.log(`Loaded ${childItems.length} child items for summary.`);
            
            // 3. Render Metadata Info Cards
            let checklistType = parent.cr3ea_food_safety_checklisttype || "";
            if (!checklistType && parent.cr3ea_title) {
                let cleanTitle = parent.cr3ea_title.split("||")[0].trim();
                if (cleanTitle.startsWith("FoodSafety_")) cleanTitle = cleanTitle.replace("FoodSafety_", "");
                if (cleanTitle.startsWith("Food_Safety_")) cleanTitle = cleanTitle.replace("Food_Safety_", "");
                
                if (cleanTitle.startsWith("PPE_") || cleanTitle.includes("PPE")) checklistType = "PPE Checklist";
                else if (cleanTitle.startsWith("GMP_") || cleanTitle.includes("GMP")) checklistType = "GMP Checklist";
                else if (cleanTitle.startsWith("PCI_") || cleanTitle.includes("PCI")) checklistType = "PCI Checklist";
            }
            if (checklistType) {
                const upper = String(checklistType).toUpperCase().trim();
                if (upper.includes("PPE")) checklistType = "PPE Checklist";
                else if (upper.includes("GMP")) checklistType = "GMP Checklist";
                else if (upper.includes("PCI")) checklistType = "PCI Checklist";
            }
            document.getElementById("sum-checklist-type").innerText = checklistType || "--";
            // Resolve manufacturing site and line
            const siteVal = parent.cr3ea_plantid || "--";
            const lineVal = parent.cr3ea_lineno || "--";
            document.getElementById("sum-site-line").innerText = `${siteVal} / ${lineVal}`;
            
            // Resolve QA, Production and Shift executive
            document.getElementById("sum-qa-exec").innerText = FoodSafety_Summary.resolveUserName(parent.cr3ea_assigned_qa) || "--";
            document.getElementById("sum-prod-incharge").innerText = FoodSafety_Summary.resolveUserName(parent.cr3ea_shiftexecutiveproduction) || "--";
            const sumShiftExec = document.getElementById("sum-shift-exec");
            if (sumShiftExec) {
                sumShiftExec.innerText = FoodSafety_Summary.resolveUserName(parent.cr3ea_observedby || parent.cr3ea_shiftexecutive) || "--";
            }
            
            // Resolve shift and cycle
            const shiftVal = parent.cr3ea_shift || "--";
            const cycleVal = parent.cr3ea_food_safety_cycle || "--";
            document.getElementById("sum-shift-cycle").innerText = `${shiftVal} / ${cycleVal}`;
            
            const startDate = parent.cr3ea_tourstartdate;
            const completionDate = parent.cr3ea_tourcompletiondate || parent.modifiedon;
            let dateText = "--";
            if (startDate) {
                dateText = moment(startDate).format("DD-MM-YYYY hh:mm A");
                if (completionDate) {
                    dateText += ` to ${moment(completionDate).format("DD-MM-YYYY hh:mm A")}`;
                }
            }
            document.getElementById("sum-conducted-date").innerText = dateText;
            
            // Render optional fields: Area Incharge and PCI Area Block
            const areaInchargeWrapper = document.getElementById("sum-area-incharge-wrapper");
            if (parent.cr3ea_food_safety_areaincharge) {
                document.getElementById("sum-area-incharge").innerText = parent.cr3ea_food_safety_areaincharge;
                areaInchargeWrapper.style.display = "block";
            } else {
                areaInchargeWrapper.style.display = "none";
            }
            
            const pciAreaWrapper = document.getElementById("sum-pci-area-wrapper");
            if (checklistType === "PCI Checklist" && parent.cr3ea_food_safety_area) {
                document.getElementById("sum-pci-area").innerText = parent.cr3ea_food_safety_area;
                pciAreaWrapper.style.display = "block";
            } else {
                pciAreaWrapper.style.display = "none";
            }
            
            // 4. Render Score Box & Result status
            const status = parent.cr3ea_status || parent.cr3ea_processstatus || "";
            const isExpired = status === "Closed - Expired" || status.includes("Expired");
            const rawScore = parent.cr3ea_overall_score;
            const hasNoScore = !rawScore || rawScore === "0%" || rawScore === "0" || childItems.length === 0;

            const resultStatus = parent.cr3ea_checklist_result || (isExpired ? "Expired" : "Pass");
            
            const scoreBox = document.getElementById("sum-score-box");
            const scoreCircle = document.getElementById("sum-score-circle");
            
            if (isExpired && hasNoScore) {
                document.getElementById("sum-score-circle").innerText = "Expired";
                if (scoreCircle) {
                    scoreCircle.style.fontSize = "16px";
                    scoreCircle.style.backgroundColor = "#ef4444";
                }
                document.getElementById("sum-score-status").innerText = "Expired while In Progress";
                if (scoreBox) {
                    scoreBox.style.borderColor = "#fecaca";
                    scoreBox.style.backgroundColor = "#fee2e2";
                    document.getElementById("sum-score-title").style.color = "#991b1b";
                    document.getElementById("sum-score-status").style.color = "#b91c1c";
                }
            } else {
                let formattedScore = rawScore || "100.00%";
                if (formattedScore && typeof formattedScore === "string" && formattedScore.includes("%")) {
                    const num = parseFloat(formattedScore.replace("%", "").trim());
                    if (!isNaN(num)) {
                        formattedScore = `${num.toFixed(2)}%`;
                    }
                } else if (typeof formattedScore === "number" || !isNaN(parseFloat(formattedScore))) {
                    formattedScore = `${parseFloat(formattedScore).toFixed(2)}%`;
                }
                document.getElementById("sum-score-circle").innerText = formattedScore;
                document.getElementById("sum-score-status").innerText = `Audit Result: ${resultStatus}`;
                
                if (resultStatus === "Pass") {
                    if (scoreBox) {
                        scoreBox.style.borderColor = "#bbf7d0";
                        scoreBox.style.backgroundColor = "#f0fdf4";
                    }
                    if (scoreCircle) {
                        scoreCircle.style.backgroundColor = "#10b981";
                    }
                    document.getElementById("sum-score-title").style.color = "#065f46";
                    document.getElementById("sum-score-status").style.color = "#047857";
                } else {
                    if (scoreBox) {
                        scoreBox.style.borderColor = "#fecaca";
                        scoreBox.style.backgroundColor = "#fee2e2";
                    }
                    if (scoreCircle) {
                        scoreCircle.style.backgroundColor = "#ef4444";
                    }
                    document.getElementById("sum-score-title").style.color = "#991b1b";
                    document.getElementById("sum-score-status").style.color = "#b91c1c";
                }
            }
            
            // 5. Render checkpoints observations table
            const tbody = document.getElementById("sum-checkpoints-tbody");
            tbody.innerHTML = "";
            
            if (checklistType === "PPE Checklist") {
                this.ppeItems.forEach((itemText, idx) => {
                    const match = childItems.find(c => (c.cr3ea_food_safety_criteria === itemText || c.cr953_food_safety_criteria === itemText));
                    const defectCount = match ? (parseInt(match.cr3ea_food_safety_defectcount !== undefined ? match.cr3ea_food_safety_defectcount : match.cr953_food_safety_defectcount) || 0) : 0;
                    const remarks = match ? (match.cr3ea_food_safety_defectremarks || match.cr953_food_safety_defectremarks || "--") : "--";
                    
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #cbd5e1";
                    tr.innerHTML = `
                        <td style="padding: 10px; font-weight: bold;">${idx + 1}</td>
                        <td style="padding: 10px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${itemText}</td>
                        <td style="padding: 10px;">
                            <span class="badge" style="padding: 5px 10px; font-size: 12px; background-color: ${defectCount > 0 ? '#fee2e2' : '#dcfce7'}; color: ${defectCount > 0 ? '#b91c1c' : '#15803d'}; border: 1px solid ${defectCount > 0 ? '#fecaca' : '#bbf7d0'}; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">
                                ${defectCount} Defects
                            </span>
                        </td>
                        <td style="padding: 10px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${this.renderRemarksWithProof(remarks)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else if (checklistType === "GMP Checklist") {
                // List of GMP sections and criteria from GMPChecklistScreen
                const sections = {
                    "Personal Hygiene": [
                        { id: 1, text: "Protective clothing/head covering worn properly" },
                        { id: 2, text: "Freedom from skin disease/wounds" },
                        { id: 3, text: "No small articles carried in shirt pockets" },
                        { id: 4, text: "Hand wash & IPA sanitization followed" },
                        { id: 5, text: "No jewellery/glass bangles/flowers/bindi on shop floor" }
                    ],
                    "Mixing": [
                        { id: 6, text: "Material identification maintained" },
                        { id: 7, text: "Sieving before use done properly" },
                        { id: 8, text: "Covered pre-weighed ingredients stored safely" },
                        { id: 9, text: "Separate stitching-thread disposal maintained" },
                        { id: 10, text: "Sieve & magnet condition checked & OK" },
                        { id: 11, text: "Sieve collection disposal handled properly" },
                        { id: 12, text: "Old dough storage & traceability maintained" },
                        { id: 13, text: "Covered/cleaned storage containers used" },
                        { id: 14, text: "Ingredient traceability record maintained" },
                        { id: 15, text: "Strip curtain cleaning followed" },
                        { id: 16, text: "Clean handling containers used" },
                        { id: 17, text: "Mixer cleaned top & sides" },
                        { id: 18, text: "Premixing/mixing floor cleaned" },
                        { id: 19, text: "Broken-grinding section cleaned & trays identified" },
                        { id: 20, text: "Defectives kept 18\" from wall" },
                        { id: 21, text: "Defectives identified by variety" },
                        { id: 22, text: "Biscuits sorted before grinding (overbaked/foreign matter removed)" },
                        { id: 23, text: "Dust collection tray condition checked & OK" },
                        { id: 24, text: "Metal detector effectiveness check done" },
                        { id: 25, text: "Defective biscuits (usable/unusable) segregated at oven end" },
                        { id: 26, text: "Windows/ventilators meshed & cleaned" },
                        { id: 27, text: "Food-handling containers undamaged" },
                        { id: 28, text: "Band cleaning/condition checked & OK" },
                        { id: 29, text: "Dough collected & transferred safely" },
                        { id: 30, text: "No water stagnation in mixing area" }
                    ],
                    "Packing": [
                        { id: 31, text: "CBB/laminate storage on pallets away from wall" },
                        { id: 32, text: "Cooling/packing conveyors in good condition" },
                        { id: 33, text: "Rollers/scrapers/catch trays clean" },
                        { id: 34, text: "No rejected rolls kept in packing" },
                        { id: 35, text: "Catch trays under machines clean" },
                        { id: 36, text: "Biscuit trays moved on trolleys (not dragged)" },
                        { id: 37, text: "Defective biscuits passed through magnet before grinding" },
                        { id: 38, text: "Tray-packed biscuits not touching tray above" },
                        { id: 39, text: "Cleaning schedules followed" },
                        { id: 40, text: "Day/shift/production-center code legible on pack" },
                        { id: 41, text: "Empty CBB inspected before filling" },
                        { id: 42, text: "No staple pins/rubber bands/threads allowed" },
                        { id: 43, text: "Metal detector checked per line" },
                        { id: 44, text: "Window condition OK" },
                        { id: 45, text: "Floor clean" },
                        { id: 46, text: "Biscuit trays periodically cleaned" }
                    ]
                };
                
                Object.keys(sections).forEach(secName => {
                    sections[secName].forEach(item => {
                        const match = childItems.find(c => (c.cr3ea_food_safety_criteria === item.text || c.cr953_food_safety_criteria === item.text));
                        const status = match ? (match.cr3ea_food_safety_status || match.cr953_food_safety_status || "Pending") : "Pending";
                        const remarks = match ? (match.cr3ea_food_safety_defectremarks || match.cr953_food_safety_defectremarks || "--") : "--";
                        
                        let statusHtml = "";
                        if (status === "Okay") {
                            statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Okay</span>`;
                        } else if (status === "Not Okay") {
                            statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Not Okay</span>`;
                        } else {
                            statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Pending</span>`;
                        }
                        
                        const tr = document.createElement("tr");
                        tr.style.borderBottom = "1px solid #cbd5e1";
                        tr.innerHTML = `
                            <td style="padding: 8px; font-weight: bold;">${item.id}</td>
                            <td style="padding: 8px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">
                                <span style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; display: block; margin-bottom: 2px;">${secName}</span>
                                ${item.text}
                            </td>
                            <td style="padding: 8px;">${statusHtml}</td>
                            <td style="padding: 8px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${this.renderRemarksWithProof(remarks)}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                });
            } else if (checklistType === "PCI Checklist") {
                const area = parent.cr3ea_food_safety_area || "Old Block";
                const locations = area === "New Block" ? this.newBlockLocations : this.oldBlockLocations;
                
                locations.forEach((locName, idx) => {
                    // Match child items by location name
                    const matches = childItems.filter(c => (c.cr3ea_food_safety_location === locName || c.cr953_food_safety_location === locName));
                    
                    let statusHtml = "";
                    let obsHtml = "--";
                    
                    if (matches.length > 0) {
                        const isOkay = matches.every(m => (m.cr3ea_food_safety_status || m.cr953_food_safety_status) === "Okay");
                        
                        if (isOkay) {
                            statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Okay</span>`;
                        } else {
                            statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Not Okay</span>`;
                            
                            // Map all non-okay defects (observation types and counts)
                            const obsItems = matches
                                .filter(m => (m.cr3ea_food_safety_status || m.cr953_food_safety_status) === "Not Okay")
                                .map(m => `${m.cr3ea_food_safety_observationtype || m.cr953_food_safety_observationtype || m.cr3ea_food_safety_criteria || m.cr953_food_safety_criteria || 'Observation'} (${m.cr3ea_food_safety_defectcount || m.cr953_food_safety_defectcount || 1})`);
                            
                            const obsText = obsItems.length > 0 ? obsItems.join(", ") : "--";
                            
                            // Check for proof attachment
                            const proofMatch = matches.find(m => (m.cr3ea_food_safety_defectremarks || m.cr953_food_safety_defectremarks));
                            const proofRemarks = proofMatch ? (proofMatch.cr3ea_food_safety_defectremarks || proofMatch.cr953_food_safety_defectremarks) : "";
                            
                            if (proofRemarks) {
                                obsHtml = `${obsText} ${this.renderRemarksWithProof(proofRemarks)}`;
                            } else {
                                obsHtml = obsText;
                            }
                        }
                    } else {
                        statusHtml = `<span class="badge" style="padding: 5px 10px; font-size: 11px; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 9999px; font-weight: 700; text-transform: uppercase;">Pending</span>`;
                    }
                    
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #cbd5e1";
                    tr.innerHTML = `
                        <td style="padding: 8px; font-weight: bold;">${idx + 1}</td>
                        <td style="padding: 8px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${locName}</td>
                        <td style="padding: 8px;">${statusHtml}</td>
                        <td style="padding: 8px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${obsHtml}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
            
        } catch (error) {
            console.error("Failed loading checklist summary screen:", error);
            alert(`Error loading summary details: ${error.message}`);
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;
        } finally {
            HideLoader();
        }
    },

    closeSummary: function () {
        console.log("Closing summary and clearing state...");
        FoodSafety_Main.state.varTourID = null;
        
        // Redirect back to SharePoint Welcome page
        const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
            ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
            : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            
        window.location.href = welcomeUrl;
    }
};
