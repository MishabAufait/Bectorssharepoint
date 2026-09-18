// Screen 3: GMP Checklist Screen
console.log("GMP Checklist Screen loaded");

const GMPChecklistScreen = {
    // 46 checklist items grouped by section
    sections: {
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
    },

    init: function () {
        console.log("Initializing GMP Checklist Screen...");
        this.renderTables();
        HeaderComponent.render("gmp-header-wrapper");
    },

    // Dynamically render tables for each section
    renderTables: function () {
        const wrapper = document.getElementById("gmp-tables-wrapper");
        if (!wrapper) return;

        wrapper.innerHTML = "";

        // Loop sections
        Object.keys(this.sections).forEach(secName => {
            const itemsList = this.sections[secName];
            
            let rowsHtml = "";
            itemsList.forEach(item => {
                rowsHtml += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: bold; width: 5%;">${item.id}</td>
                        <td style="padding: 10px; text-align: left; width: 45%;">${item.text}</td>
                        <td style="padding: 10px; width: 20%;">
                            <div class="select2-parent">
                                <select class="form-select gmp-status-select" id="gmp-status-${item.id}" 
                                        onchange="GMPChecklistScreen.handleStatusChange(${item.id})">
                                    <option value="" selected>Select</option>
                                    <option value="Okay">Okay</option>
                                    <option value="Not Okay">Not Okay</option>
                                </select>
                            </div>
                        </td>
                        <td style="padding: 10px; width: 30%;">
                            <input type="text" class="form-control gmp-remarks-input" id="gmp-remarks-${item.id}" 
                                   placeholder="Remarks (required if Not Okay)" style="display: none; width: 100%;">
                            <div class="gmp-file-wrapper" id="gmp-file-wrapper-${item.id}" style="display: none; margin-top: 6px; text-align: left;">
                                <label class="form-label" style="font-size: 11px; margin-bottom: 2px; color: #64748b; font-weight: 600; display: block;">
                                    Proof Image/Doc (Optional):
                                </label>
                                <input type="file" class="form-control gmp-proof-file" id="gmp-proof-${item.id}" accept="image/*,application/pdf" style="font-size: 12px; padding: 4px 8px; height: auto;">
                                <div id="gmp-existing-proof-${item.id}" style="display: none; margin-top: 4px;"></div>
                            </div>
                        </td>
                    </tr>
                `;
            });

            const cardHtml = DataCardComponent.createTableCard(secName, [
                { text: "No.", style: "width: 5%;" },
                { text: "Checkpoint Criteria", style: "width: 45%; text-align: left;" },
                { text: "Status", style: "width: 20%;" },
                { text: "Remarks & Proof", style: "width: 30%;" }
            ], rowsHtml);

            const div = document.createElement("div");
            div.innerHTML = cardHtml;
            wrapper.appendChild(div);

            // Initialize Select2 on the newly rendered selects
            itemsList.forEach(item => {
                DropdownComponent.init(`gmp-status-${item.id}`);
                const remInput = document.getElementById(`gmp-remarks-${item.id}`);
                if (remInput) {
                    remInput.addEventListener("input", function() {
                        if (typeof FoodSafety_Validator !== "undefined") {
                            FoodSafety_Validator.highlight(this, false);
                        }
                    });
                }
            });
        });

        this.calculateScores();
    },

    // Show/hide and validate remarks field based on Status value
    handleStatusChange: function (itemId) {
        const statusSelect = document.getElementById(`gmp-status-${itemId}`);
        const status = statusSelect ? statusSelect.value : "";
        const remarksInput = document.getElementById(`gmp-remarks-${itemId}`);
        const fileWrap = document.getElementById(`gmp-file-wrapper-${itemId}`);
        const fileInp = document.getElementById(`gmp-proof-${itemId}`);
        const existProof = document.getElementById(`gmp-existing-proof-${itemId}`);
        
        if (typeof FoodSafety_Validator !== "undefined" && statusSelect) {
            FoodSafety_Validator.highlight(statusSelect, false);
        }

        if (remarksInput) {
            if (status === "Not Okay") {
                remarksInput.style.display = "block";
                if (fileWrap) fileWrap.style.display = "block";
                remarksInput.focus();
            } else {
                remarksInput.style.display = "none";
                remarksInput.value = "";
                if (fileWrap) fileWrap.style.display = "none";
                if (fileInp) fileInp.value = "";
                if (existProof) {
                    existProof.style.display = "none";
                    existProof.innerHTML = "";
                    existProof.removeAttribute("data-url");
                }
                if (typeof FoodSafety_Validator !== "undefined") {
                    FoodSafety_Validator.highlight(remarksInput, false);
                }
            }
        }
        
        this.calculateScores();
    },

    // Auto-calculate scores dynamically
    calculateScores: function () {
        let totalOkay = 0;
        let totalItems = 46;
        let packingOkay = 0;
        let packingItems = 16;

        // Iterate through all sections to count Okay states
        Object.keys(this.sections).forEach(secName => {
            const list = this.sections[secName];
            list.forEach(item => {
                const statusSelect = document.getElementById(`gmp-status-${item.id}`);
                const isOkay = statusSelect && statusSelect.value === "Okay";
                
                if (isOkay) {
                    totalOkay++;
                    if (secName === "Packing") {
                        packingOkay++;
                    }
                }
            });
        });

        const gmpScore = (totalOkay / totalItems) * 100;
        const packingScore = (packingOkay / packingItems) * 100;

        document.getElementById("gmp-total-score-display").innerText = gmpScore.toFixed(2) + "%";
        document.getElementById("gmp-packing-score-display").innerText = packingScore.toFixed(2) + "%";

        const badge = document.getElementById("gmp-score-badge");
        if (badge) {
            if (gmpScore >= 80) {
                badge.innerText = "Pass";
                badge.style.backgroundColor = "#dcfce7";
                badge.style.color = "#15803d";
                badge.style.borderColor = "#bbf7d0";
            } else {
                badge.innerText = "Fail";
                badge.style.backgroundColor = "#fee2e2";
                badge.style.color = "#b91c1c";
                badge.style.borderColor = "#fecaca";
            }
        }

        // Count totals for progress tracker
        let okayCount = 0;
        let notOkayCount = 0;
        let pendingCount = 0;

        Object.keys(this.sections).forEach(secName => {
            const list = this.sections[secName];
            list.forEach(item => {
                const statusSelect = document.getElementById(`gmp-status-${item.id}`);
                const status = statusSelect ? statusSelect.value : "";
                if (status === "Okay") {
                    okayCount++;
                } else if (status === "Not Okay") {
                    notOkayCount++;
                } else {
                    pendingCount++;
                }
            });
        });

        const filledCount = okayCount + notOkayCount;
        const progressPercent = Math.round((filledCount / 46) * 100);

        // Update progress tracker banner
        const trackerBanner = document.getElementById("gmp-tracker-banner");
        if (trackerBanner) {
            trackerBanner.querySelector(".tracker-summary-text").innerHTML = `<strong>${filledCount}</strong> of <strong>46</strong> checkpoints filled (${progressPercent}%)`;
            trackerBanner.querySelector(".tracker-estimated-score").innerText = gmpScore.toFixed(2) + "%";
            
            const packingScoreEl = document.getElementById("tracker-packing-score");
            if (packingScoreEl) {
                packingScoreEl.innerText = packingScore.toFixed(2) + "%";
            }
            
            const trBadge = trackerBanner.querySelector(".tracker-score-badge");
            const trOkay = trackerBanner.querySelector(".tracker-count-okay");
            const trNotOkay = trackerBanner.querySelector(".tracker-count-notokay");
            const trPending = trackerBanner.querySelector(".tracker-count-pending");

            if (trOkay) trOkay.innerText = okayCount;
            if (trNotOkay) trNotOkay.innerText = notOkayCount;
            if (trPending) trPending.innerText = pendingCount;

            const isPass = gmpScore >= 80;
            if (trBadge) {
                trBadge.innerText = isPass ? "Pass" : "Fail";
                trBadge.style.backgroundColor = isPass ? "#dcfce7" : "#fee2e2";
                trBadge.style.color = isPass ? "#15803d" : "#b91c1c";
                trBadge.style.borderColor = isPass ? "#bbf7d0" : "#fecaca";
            }
            
            const estScoreEl = trackerBanner.querySelector(".tracker-estimated-score");
            if (estScoreEl) {
                estScoreEl.style.color = isPass ? "#15803d" : "#dc2626";
            }
            
            const prgBar = trackerBanner.querySelector(".progress-bar");
            if (prgBar) {
                prgBar.style.width = `${progressPercent}%`;
                prgBar.style.backgroundColor = isPass ? "#16a34a" : "#dc2626";
            }
        }
    },

    // Submit GMP Checklist
    submit: async function () {
        try {
            if (typeof FoodSafety_Validator !== "undefined") {
                FoodSafety_Validator.clearAll("screen-gmp-checklist");
                FoodSafety_Validator.hideBanner("gmp-validation-banner");
            }

            // Validate: All 46 checkpoints must be filled, and remarks required if Not Okay
            let unansweredCount = 0;
            let missingRemarksCount = 0;
            let firstInvalidEl = null;

            Object.keys(this.sections).forEach(secName => {
                const list = this.sections[secName];
                list.forEach(item => {
                    const statusSelect = document.getElementById(`gmp-status-${item.id}`);
                    const remarksInput = document.getElementById(`gmp-remarks-${item.id}`);
                    const status = statusSelect ? statusSelect.value : "";
                    const remarks = remarksInput ? remarksInput.value.trim() : "";

                    if (!status) {
                        unansweredCount++;
                        if (typeof FoodSafety_Validator !== "undefined" && statusSelect) {
                            FoodSafety_Validator.highlight(statusSelect, true);
                        }
                        if (!firstInvalidEl) firstInvalidEl = statusSelect;
                    } else if (status === "Not Okay" && !remarks) {
                        missingRemarksCount++;
                        if (typeof FoodSafety_Validator !== "undefined" && remarksInput) {
                            FoodSafety_Validator.highlight(remarksInput, true);
                        }
                        if (!firstInvalidEl) firstInvalidEl = remarksInput;
                    }
                });
            });

            if (unansweredCount > 0 || missingRemarksCount > 0) {
                const missingList = [];
                if (unansweredCount > 0) {
                    missingList.push(`Status selection for ${unansweredCount} checkpoint(s)`);
                }
                if (missingRemarksCount > 0) {
                    missingList.push(`Defect remarks for ${missingRemarksCount} checkpoint(s) marked as "Not Okay"`);
                }

                if (typeof FoodSafety_Validator !== "undefined") {
                    FoodSafety_Validator.showBanner("gmp-validation-banner", missingList);
                }

                let alertMsg = "Please complete all required fields before submitting:\n";
                missingList.forEach(item => alertMsg += `- ${item}\n`);
                alert(alertMsg.trim());

                if (firstInvalidEl) {
                    firstInvalidEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    firstInvalidEl.focus();
                }
                return;
            }

            ShowLoader();

            let totalOkay = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate;
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            // Prepare checklist payload rows with proof uploads
            for (const secName of Object.keys(this.sections)) {
                const list = this.sections[secName];
                for (const item of list) {
                    const status = document.getElementById(`gmp-status-${item.id}`).value;
                    const remarks = document.getElementById(`gmp-remarks-${item.id}`).value.trim();
                    
                    if (status === "Okay") {
                        totalOkay++;
                    }

                    let cleanRemarks = remarks;
                    let proofUrl = "";
                    if (status === "Not Okay") {
                        const fileInput = document.getElementById(`gmp-proof-${item.id}`);
                        const existingProofEl = document.getElementById(`gmp-existing-proof-${item.id}`);
                        const existingUrl = existingProofEl ? existingProofEl.getAttribute("data-url") : "";

                        // Strip any previous Proof: path if text input contained it
                        const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                            ? QualityRajpura_Config.parseRemarksAndProof(remarks)
                            : { remarks: remarks.replace(/\|?\s*Proof:\s*.*$/i, "").trim(), proofUrl: "" };
                        cleanRemarks = parsed.remarks;

                        if (fileInput && fileInput.files && fileInput.files.length > 0) {
                            if (typeof ShowProgressLoader === "function") {
                                ShowProgressLoader(10, `Uploading proof document for ${secName} item ${item.id}...`);
                            }
                            try {
                                proofUrl = await FoodSafety_DAL.uploadAttachmentFile(fileInput.files[0], FoodSafety_Main.state.varTourID, "GMP", `GMP_${item.id}`, cleanRemarks);
                            } catch (upErr) {
                                console.warn(`Failed to upload proof for GMP item ${item.id}:`, upErr);
                            }
                        } else if (existingUrl) {
                            proofUrl = existingUrl;
                        } else if (parsed.proofUrl) {
                            proofUrl = parsed.proofUrl;
                        }
                    }

                    const finalRemarks = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatRemarksWithProof)
                        ? QualityRajpura_Config.formatRemarksWithProof(cleanRemarks, proofUrl)
                        : (proofUrl ? (cleanRemarks ? `${cleanRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`) : cleanRemarks);

                    const childPayload = {
                        cr3ea_food_safety_title: `GMP_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                        cr3ea_food_safety_checklisttype: "GMP Checklist",
                        cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                        cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                        cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                        cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                        cr3ea_food_safety_area: secName,
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                        cr3ea_food_safety_criteria: item.text,
                        cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                        cr3ea_food_safety_status: status,
                        cr3ea_food_safety_defectremarks: finalRemarks,
                        cr3ea_food_safety_date: dateStr,
                        cr3ea_food_safety_time: timeStr
                    };
                    childRecords.push(childPayload);
                }
            }

            const gmpScore = (totalOkay / 46) * 100;
            const resultStatus = gmpScore >= 80 ? "Pass" : "Fail";

            ShowLoader();

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete checkpoints...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            console.log(`Submitting ${childRecords.length} child GMP checkpoints to Dataverse...`);

            // Save all child records in parallel chunks of 8
            const CHUNK_SIZE = 8;
            const total = childRecords.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = childRecords.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round((currentCount / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting checkpoints (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => FoodSafety_DAL.saveChecklistItem(rec)));
            }
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing submission...");
            }

            // Update parent Tour Session metadata record in Dataverse
            const parentUpdatePayload = {
                cr3ea_prod_rajpura_quality_tourid: FoodSafety_Main.state.varTourID,
                cr3ea_overall_score: gmpScore.toFixed(2) + "%",
                cr3ea_checklist_result: resultStatus,
                cr3ea_status: "Submitted"
            };

            console.log("Updating parent tour session record metadata:", parentUpdatePayload);
            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("GMP Checklist submitted successfully!");
            // Reset state and navigate to screen-summary
            const submittedTourId = FoodSafety_Main.state.varTourID;
            FoodSafety_Main.state.varTourID = null;
            FoodSafety_Main.navigateTo("screen-summary");
            if (typeof FoodSafety_Summary !== 'undefined' && FoodSafety_Summary.init) {
                FoodSafety_Summary.init(submittedTourId);
            }
        } catch (error) {
            console.error("Failed submitting GMP checklist:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit GMP checklist")
                : `Error during submission: ${error.message}`;
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    pauseTour: async function () {
        const confirmPause = confirm("Are you sure you want to pause this audit session? Your entered details will be saved, and you can resume later.");
        if (!confirmPause) return;

        try {
            ShowLoader();

            let totalOkay = 0;
            const childRecords = [];
            const tourDate = FoodSafety_Main.state.tourStartDate || new Date();
            const dateStr = moment(tourDate).format("MM-DD-YYYY");
            const timeStr = moment(tourDate).format("hh:mm A");

            // Prepare child checklist items payloads only for selected ones
            for (const secName of Object.keys(this.sections)) {
                const list = this.sections[secName];
                for (const item of list) {
                    const statusSelect = document.getElementById(`gmp-status-${item.id}`);
                    const status = statusSelect ? statusSelect.value : "";
                    const remarksInput = document.getElementById(`gmp-remarks-${item.id}`);
                    const remarks = remarksInput ? remarksInput.value.trim() : "";

                    if (status) {
                        if (status === "Okay") {
                            totalOkay++;
                        }

                        let cleanRemarks = remarks;
                        let proofUrl = "";
                        if (status === "Not Okay") {
                            const fileInput = document.getElementById(`gmp-proof-${item.id}`);
                            const existingProofEl = document.getElementById(`gmp-existing-proof-${item.id}`);
                            const existingUrl = existingProofEl ? existingProofEl.getAttribute("data-url") : "";

                            // Strip any previous Proof: path if text input contained it
                            const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                                ? QualityRajpura_Config.parseRemarksAndProof(remarks)
                                : { remarks: remarks.replace(/\|?\s*Proof:\s*.*$/i, "").trim(), proofUrl: "" };
                            cleanRemarks = parsed.remarks;

                            if (fileInput && fileInput.files && fileInput.files.length > 0) {
                                if (typeof ShowProgressLoader === "function") {
                                    ShowProgressLoader(10, `Uploading proof document for ${secName} item ${item.id}...`);
                                }
                                try {
                                    proofUrl = await FoodSafety_DAL.uploadAttachmentFile(fileInput.files[0], FoodSafety_Main.state.varTourID, "GMP", `GMP_${item.id}`, cleanRemarks);
                                } catch (upErr) {
                                    console.warn(`Failed to upload proof for GMP item ${item.id}:`, upErr);
                                }
                            } else if (existingUrl) {
                                proofUrl = existingUrl;
                            } else if (parsed.proofUrl) {
                                proofUrl = parsed.proofUrl;
                            }
                        }

                        const finalRemarks = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatRemarksWithProof)
                            ? QualityRajpura_Config.formatRemarksWithProof(cleanRemarks, proofUrl)
                            : (proofUrl ? (cleanRemarks ? `${cleanRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`) : cleanRemarks);

                        const childPayload = {
                            cr3ea_food_safety_title: `GMP_${FoodSafety_Main.state.selectedSite}_${FoodSafety_Main.state.selectedLine}_${dateStr}`,
                            cr3ea_food_safety_checklisttype: "GMP Checklist",
                            cr3ea_food_safety_manufacturingsite: FoodSafety_Main.state.selectedSite,
                            cr3ea_food_safety_line: FoodSafety_Main.state.selectedLine,
                            cr3ea_food_safety_qaexecutive: FoodSafety_Main.state.qaExecutive,
                            cr3ea_food_safety_productionincharge: FoodSafety_Main.state.productionIncharge,
                            cr3ea_food_safety_area: secName,
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${FoodSafety_Main.state.varTourID})`,
                            cr3ea_food_safety_criteria: item.text,
                            cr3ea_food_safety_cycle: FoodSafety_Main.state.selectedCycle,
                            cr3ea_food_safety_status: status,
                            cr3ea_food_safety_defectremarks: finalRemarks,
                            cr3ea_food_safety_date: dateStr,
                            cr3ea_food_safety_time: timeStr
                        };
                        childRecords.push(childPayload);
                    }
                }
            }

            const gmpScore = (totalOkay / 46) * 100;
            const resultStatus = gmpScore >= 80 ? "Pass" : "Fail";

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(0, "Cleaning up obsolete checkpoints...");
            }
            await FoodSafety_DAL.cleanChecklistItems(FoodSafety_Main.state.varTourID);

            // Save child records in parallel chunks of 8
            const CHUNK_SIZE = 8;
            const total = childRecords.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = childRecords.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round((currentCount / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Saving paused progress (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => FoodSafety_DAL.saveChecklistItem(rec)));
            }
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing pause...");
            }

            // Update parent session record with status "InProgress-paused"
            const parentUpdatePayload = {
                cr3ea_prod_rajpura_quality_tourid: FoodSafety_Main.state.varTourID,
                cr3ea_overall_score: gmpScore.toFixed(2) + "%",
                cr3ea_checklist_result: resultStatus,
                cr3ea_status: "InProgress-paused"
            };

            await FoodSafety_DAL.saveTourSession(parentUpdatePayload);

            alert("Tour paused successfully!");
            
            // Redirect back to SharePoint Welcome page
            const welcomeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = welcomeUrl;

        } catch (error) {
            console.error("Failed pausing GMP checklist:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "pause GMP checklist")
                : `Error during pause: ${error.message}`;
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // Resume flow from existing Tour ID
    resume: async function () {
        try {
            ShowLoader();
            
            // Always render default tables structure first so inputs exist in the DOM
            this.renderTables();
            
            const savedItems = await FoodSafety_DAL.getChecklistItems(FoodSafety_Main.state.varTourID);
            
            if (savedItems && savedItems.length > 0) {
                // Populate row selectors
                Object.keys(this.sections).forEach(secName => {
                    const list = this.sections[secName];
                    list.forEach(item => {
                        const match = savedItems.find(i => (i.cr3ea_food_safety_criteria === item.text || i.cr953_food_safety_criteria === item.text));
                        if (match) {
                            const statusSelect = document.getElementById(`gmp-status-${item.id}`);
                            const remarksInput = document.getElementById(`gmp-remarks-${item.id}`);
                            const fileWrap = document.getElementById(`gmp-file-wrapper-${item.id}`);
                            const existingProofEl = document.getElementById(`gmp-existing-proof-${item.id}`);
                            
                            if (statusSelect) {
                                const statusVal = match.cr3ea_food_safety_status || match.cr953_food_safety_status || "";
                                $(statusSelect).val(statusVal).trigger("change");
                            }
                            if (remarksInput) {
                                const rawRemarks = match.cr3ea_food_safety_defectremarks || match.cr953_food_safety_defectremarks || "";
                                const parsed = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.parseRemarksAndProof)
                                    ? QualityRajpura_Config.parseRemarksAndProof(rawRemarks)
                                    : { remarks: "", proofUrl: "" };
                                
                                const remarksText = parsed.remarks;
                                const proofUrl = parsed.proofUrl;

                                remarksInput.value = remarksText;
                                
                                const effectiveStatus = match.cr3ea_food_safety_status || match.cr953_food_safety_status;
                                if (effectiveStatus === "Not Okay") {
                                    remarksInput.style.display = "block";
                                    if (fileWrap) fileWrap.style.display = "block";
                                    if (proofUrl && existingProofEl) {
                                        existingProofEl.style.display = "block";
                                        existingProofEl.setAttribute("data-url", proofUrl);
                                        existingProofEl.innerHTML = `<a href="${proofUrl}" target="_blank" class="badge food-safety-proof-badge" style="background-color: #0284c7 !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; text-decoration: none !important; padding: 4px 10px !important; border-radius: 4px !important; display: inline-flex !important; align-items: center !important; gap: 5px !important; font-size: 11px !important; font-weight: 600 !important;"><span style="color: #ffffff !important;">View Attached Proof</span></a>`;
                                    }
                                }
                            }
                        }
                    });
                });
            }

            this.calculateScores();
        } catch (err) {
            console.error("Failed to resume GMP checklist screen data:", err);
        } finally {
            HideLoader();
        }
    }
};
