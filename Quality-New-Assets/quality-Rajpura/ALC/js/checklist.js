// Steps 6 to 9: Checklist filling, scoring calculation, and validation logic
console.log("ALC Checklist script loaded");

const ALC_Validator = {
    highlight: function (element, isInvalid) {
        if (!element) return;
        if (isInvalid) {
            element.style.borderColor = "#ef4444";
            element.style.boxShadow = "0 0 0 0.2rem rgba(239, 68, 68, 0.25)";
        } else {
            element.style.borderColor = "";
            element.style.boxShadow = "";
        }
    },
    clearAll: function () {
        const container = document.getElementById("section-checklist-filling");
        if (!container) return;
        const inputs = container.querySelectorAll("input, select, textarea");
        inputs.forEach(el => this.highlight(el, false));
        const fileLabels = container.querySelectorAll(".custom-file-upload");
        fileLabels.forEach(el => {
            el.style.border = "";
            el.style.boxShadow = "";
        });
    }
};

const ALC_Checklist = {
    checkpoints: [],
    uploadedFiles: {}, // Maps checkpoint row index to an Array of File objects: [File1, File2, ...]

    // Handle file selection (supporting multiple files)
    onFileSelected: async function (input, index) {
        if (!input.files || input.files.length === 0) return;

        if (!this.uploadedFiles[index]) {
            this.uploadedFiles[index] = [];
        }

        const selectedFiles = Array.from(input.files);
        let invalidCount = 0;

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(file.name);
            if (!isImage) {
                invalidCount++;
                continue;
            }
            // Avoid duplicate additions in the same batch/list
            const alreadyAdded = this.uploadedFiles[index].some(f => f.name === file.name && f.size === file.size);
            if (!alreadyAdded) {
                this.uploadedFiles[index].push(file);
            }
        }

        if (invalidCount > 0) {
            alert(`${invalidCount} non-image file(s) were ignored. Only image files (JPG, PNG, WebP, etc.) are allowed.`);
        }

        // Reset input value so user can click to add more files or re-select
        input.value = "";

        this.renderFileStatus(index);
    },

    // Remove single file from selected list before submitting
    removeFile: function (index, fileIdx) {
        if (this.uploadedFiles[index] && this.uploadedFiles[index][fileIdx]) {
            this.uploadedFiles[index].splice(fileIdx, 1);
            if (this.uploadedFiles[index].length === 0) {
                delete this.uploadedFiles[index];
            }
        }
        this.renderFileStatus(index);
    },

    // Render chips and count for selected files
    renderFileStatus: function (index) {
        const fileStatus = document.getElementById(`file-status-${index}`);
        if (!fileStatus) return;

        const files = this.uploadedFiles[index] || [];
        if (files.length === 0) {
            const row = fileStatus.closest("tr");
            const existingFiles = row ? row.getAttribute("data-existing-files") : null;
            if (!existingFiles) {
                fileStatus.innerHTML = "No image uploaded";
            } else {
                fileStatus.innerHTML = "";
            }
            return;
        }

        let chipsHtml = `<div class="alc-file-chips-container">`;
        chipsHtml += `<div style="font-size: 11px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 4px;"><i class="fa fa-check-circle"></i> ${files.length} photo(s) selected:</div>`;
        files.forEach((file, fIdx) => {
            chipsHtml += `
                <div class="alc-file-chip">
                    <span class="chip-name" title="${this.escapeHtml(file.name)}"><i class="fa fa-image"></i> ${this.escapeHtml(file.name)}</span>
                    <button type="button" class="chip-remove-btn" onclick="ALC_Checklist.removeFile(${index}, ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    // Helper to escape HTML safely
    escapeHtml: function (str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Dynamically render checklist questions loaded from SharePoint list (or seed fallback)
    renderChecklist: async function () {
        const trackerBanner = document.getElementById("checklist-tracker-banner");
        if (trackerBanner) trackerBanner.style.display = "block";

        const scrollContainer = document.getElementById("alc-checklist-scroll-container");
        if (!scrollContainer) {
            console.error("ALC_Checklist: #alc-checklist-scroll-container not found in DOM");
            return;
        }

        // Show loading state while fetching config
        scrollContainer.innerHTML = `
            <div id="alc-checklist-loading" style="text-align: center; padding: 40px; color: #64748b;">
                <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem; margin-bottom: 10px; display: inline-block;"></div>
                <div style="font-weight: 500; font-size: 15px;">Loading checklist questions from master list...</div>
            </div>
        `;

        let configs = [];
        try {
            configs = await ALC_DAL.getConfig();
        } catch (e) {
            console.warn("ALC_Checklist: Could not load configs from SharePoint, falling back to seed defaults:", e);
        }

        let qConfigs = (configs || []).filter(c => (c.ConfigType === "Checklist Question" || c.ConfigType === "Question") && c.IsActive !== false);

        // Fallback to seed data if no questions configured or list empty
        if (!qConfigs || qConfigs.length === 0) {
            console.log("ALC_Checklist: No live question configs found, using seed catalog defaults.");
            const seedQuestions = (typeof ALC_CHECKLIST_SEED_DATA !== "undefined" && Array.isArray(ALC_CHECKLIST_SEED_DATA)) ? ALC_CHECKLIST_SEED_DATA : [];
            qConfigs = seedQuestions.map(s => ({
                Id: 1000 + s.sequence,
                Title: s.title,
                ConfigType: "Checklist Question",
                Area: s.area,
                Sequence: s.sequence,
                IsCritical: !!s.isCritical,
                IsActive: s.isActive !== false
            }));
        }

        // Sort questions by Sequence
        qConfigs.sort((a, b) => {
            const seqA = parseInt(a.Sequence, 10) || parseInt(a.ShiftCode, 10) || parseInt(a.ProductCode, 10) || 0;
            const seqB = parseInt(b.Sequence, 10) || parseInt(b.ShiftCode, 10) || parseInt(b.ProductCode, 10) || 0;
            if (seqA !== seqB) return seqA - seqB;
            return (a.Id || 0) - (b.Id || 0);
        });

        // Group questions by Area preserving sequence order
        const areaMap = new Map();
        qConfigs.forEach(q => {
            const area = (q.Area || "General Inspection Area").trim();
            if (!areaMap.has(area)) {
                areaMap.set(area, []);
            }
            areaMap.get(area).push(q);
        });

        let globalFileIdx = 0;
        let html = "";

        areaMap.forEach((questions, areaName) => {
            html += `
            <div class="bs-card" style="margin-bottom: 20px;">
                <div class="bs-card-header">
                    <h4 class="bs-card-title">${this.escapeHtml(areaName)}</h4>
                </div>
                <div class="bs-card-body" style="overflow-x: auto;">
                    <div class="bs-table-container">
                        <table class="bs-table" border="1" style="border-collapse: collapse; width: 100%; min-width: 800px; text-align: center; font-size: 14px;">
                            <thead>
                                <tr>
                                    <th style="width: 5%;">Sr No.</th>
                                    <th style="width: 40%;">Description</th>
                                    <th style="width: 15%;">Compliance Score</th>
                                    <th style="width: 20%;">Remarks</th>
                                    <th style="width: 20%;">Upload Image</th>
                                </tr>
                            </thead>
                            <tbody>`;

            questions.forEach(q => {
                const seq = q.Sequence || (globalFileIdx + 1);
                const isCritical = !!q.IsCritical;
                const cleanTitle = (q.Title || "").trim();
                const fIndex = globalFileIdx;
                globalFileIdx++;

                const criticalBadgeHtml = isCritical ? ` <span class="alc-critical-badge" title="Critical Gate: Tour fails if this parameter is Non-Compliant or Partial"><i class="fa fa-exclamation-triangle"></i> CRITICAL GATE</span>` : '';

                html += `
                    <tr data-is-critical="${isCritical ? 'true' : 'false'}" data-sequence="${seq}" data-area="${this.escapeHtml(areaName)}">
                        <td>${seq}</td>
                        <td style="text-align: left;">
                            <span class="criteria-text">${this.escapeHtml(cleanTitle)}</span>${criticalBadgeHtml}
                        </td>
                        <td>
                            <select class="form-select">
                                <option value="" selected>Select</option>
                                <option value="Compliant (2)">Compliant</option>
                                <option value="Partial (1)">Partial</option>
                                <option value="Non-Compliant (0)">Non-Compliant</option>
                            </select>
                        </td>
                        <td>
                            <input type="text" class="form-control" placeholder="Enter remarks if defect">
                        </td>
                        <td>
                            <div class="custom-file-upload">
                                <input type="file" class="form-control-file file-upload-input" data-index="${fIndex}" multiple onchange="ALC_Checklist.onFileSelected(this, ${fIndex})">
                                <div id="file-status-${fIndex}" class="form-text text-muted" style="margin-top: 4px; font-size: 12px;">No image uploaded</div>
                            </div>
                        </td>
                    </tr>`;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        });

        scrollContainer.innerHTML = html;

        // Collect check rows from the DOM and initialize Select2 if needed
        const selectElements = scrollContainer.querySelectorAll("tbody select");
        selectElements.forEach(select => {
            if (window.jQuery && $.fn.select2) {
                $(select).select2({ minimumResultsForSearch: -1, width: "100%" });
                $(select).off("change.tracker").on("change.tracker", () => {
                    this.updateTracker();
                });
            } else {
                select.addEventListener("change", () => {
                    this.updateTracker();
                });
            }
        });
        this.updateTracker();
    },

    loadSavedCheckpoints: async function () {
        try {
            ShowLoader();
            console.log("ALC_Checklist: loadSavedCheckpoints initialized for TourId:", ALC_StateMachine.currentTourId);
            const checkpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);
            this.checkpoints = checkpoints || [];
            console.log("ALC_Checklist: Fetched checkpoints count:", this.checkpoints.length, this.checkpoints);

            // Loop through DOM checklist items
            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
            console.log("ALC_Checklist: Found checklist rows in DOM:", rows.length);
            rows.forEach((row, idx) => {
                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteriaSpan = tds[1].querySelector(".criteria-text");
                    const criteria = criteriaSpan ? criteriaSpan.innerText.trim() : tds[1].innerText.replace(/CRITICAL(?: GATE)?/gi, "").trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    // Find matching saved checkpoint
                    const cleanCriteria = criteria.toLowerCase().trim();
                    const cp = this.checkpoints.find(c => {
                        const cpCrit = (c.cr3ea_criteria || "").replace(/CRITICAL(?: GATE)?/gi, "").toLowerCase().trim();
                        return cpCrit === cleanCriteria || (c.cr3ea_criteria || "").trim().toLowerCase() === cleanCriteria;
                    });
                    if (cp) {
                        console.log(`ALC_Checklist: Matched saved checkpoint for row #${idx + 1} (${criteria}):`, cp);
                        let selectVal = "Compliant (2)";
                        if (cp.cr3ea_defectcategory) {
                            selectVal = cp.cr3ea_defectcategory;
                        } else if (cp.cr3ea_status === "Not Okay") {
                            selectVal = "Non-Compliant (0)";
                        }

                        if (selectEl) {
                            selectEl.value = selectVal;
                            if (window.jQuery && $.fn.select2) {
                                $(selectEl).trigger('change');
                            }
                        }

                        let cleanRemarks = cp.cr3ea_defectremarks || "";
                        let savedFiles = [];
                        if (cleanRemarks.includes("File:")) {
                            const fileIdx = cleanRemarks.indexOf("File:");
                            const filePart = cleanRemarks.substring(fileIdx + 5).trim();
                            let textPart = cleanRemarks.substring(0, fileIdx).trim();
                            if (textPart.endsWith("|")) {
                                textPart = textPart.substring(0, textPart.length - 1).trim();
                            }
                            cleanRemarks = textPart;
                            savedFiles = filePart.split(",").map(f => f.trim()).filter(Boolean);
                        }

                        if (remarksEl) {
                            remarksEl.value = cleanRemarks;
                        }

                        if (savedFiles.length > 0) {
                            row.setAttribute("data-existing-files", savedFiles.join(","));
                        }

                        // Show file previews in 5th column
                        const customFileUploadEl = row.querySelector(".custom-file-upload");
                        const fileStatusEl = row.querySelector(".custom-file-upload div") || row.querySelector(".custom-file-upload small");
                        
                        if (customFileUploadEl) {
                            const oldPreview = customFileUploadEl.querySelector(".alc-saved-file-links-container");
                            if (oldPreview) oldPreview.remove();

                            if (savedFiles.length > 0) {
                                const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                                const linksContainer = document.createElement("div");
                                linksContainer.className = "alc-saved-file-links-container";

                                const countLabel = document.createElement("div");
                                countLabel.style.fontSize = "11px";
                                countLabel.style.fontWeight = "600";
                                countLabel.style.color = "#1d4ed8";
                                countLabel.style.width = "100%";
                                countLabel.innerHTML = `<i class="fa fa-paperclip"></i> Saved Photos (${savedFiles.length}):`;
                                linksContainer.appendChild(countLabel);

                                savedFiles.forEach((fName, fI) => {
                                    const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${fName}`;
                                    const previewLink = document.createElement("a");
                                    previewLink.href = fileUrl;
                                    previewLink.target = "_blank";
                                    previewLink.className = "alc-saved-file-link";
                                    previewLink.title = fName;
                                    previewLink.innerHTML = `<i class="fa fa-eye"></i> Photo ${fI + 1}`;
                                    linksContainer.appendChild(previewLink);
                                });

                                if (fileStatusEl) fileStatusEl.innerHTML = "";
                                customFileUploadEl.appendChild(linksContainer);
                            } else {
                                if (fileStatusEl) fileStatusEl.innerHTML = "No image uploaded";
                            }
                        }
                    } else {
                        // Debug unmatched rows
                        if (idx < 3) {
                            console.log(`ALC_Checklist: No match found for DOM row #${idx + 1} (${criteria})`);
                        }
                    }
                }
            });
            HideLoader();
        } catch (e) {
            HideLoader();
            console.error("Failed to load saved checklist checkpoints:", e);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(e, "load saved checklist checkpoints")
                : ("Dataverse Error: Failed to load saved checklist checkpoints: " + (e.message || ""));
            alert(msg);
        }
    },

    // Step 7 & 8: Calculate score and evaluation (returns a Promise to ensure completeness)
    calculateScore: async function () {
        return new Promise((resolve) => {
            ALC_Validator.clearAll();
            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
            let totalMaxScore = 0;
            let totalObtainedScore = 0;
            let hasDefects = false;
            let hasCriticalFailure = false;
            const criticalFailures = [];
            let incompleteCount = 0;
            let missingFilesCount = 0;
            let missingRemarksCount = 0;
            const scores = [];

            rows.forEach((row, idx) => {
                const selectEl = row.querySelector("select");
                const remarksEl = row.querySelector("input[type='text']");
                const isCritical = row.getAttribute("data-is-critical") === "true";
                const area = row.getAttribute("data-area") || row.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim() || "General Inspection Area";
                const criteriaSpan = row.querySelector(".criteria-text");
                const criteria = criteriaSpan ? criteriaSpan.innerText.trim() : (row.querySelectorAll("td")[1]?.innerText.replace(/CRITICAL(?: GATE)?/gi, "").trim() || "");
                const remarksVal = remarksEl ? remarksEl.value.trim() : "";

                if (selectEl) {
                    const scoreValue = selectEl.value;
                    if (!scoreValue || scoreValue === "") {
                        incompleteCount++;
                        ALC_Validator.highlight(selectEl, true);
                    }
                    let numericalScore = 2; // Default to Compliant (2)
                    let isNonCompliant = false;

                    if (scoreValue.includes("(0)") || scoreValue === "00" || scoreValue.includes("Non-Compliant")) {
                        numericalScore = 0;
                        hasDefects = true;
                        isNonCompliant = true;
                    } else if (scoreValue.includes("(1)") || scoreValue === "01" || scoreValue.includes("Partial")) {
                        numericalScore = 1;
                        hasDefects = true;
                    } else if (scoreValue.includes("(2)") || scoreValue === "02" || scoreValue.includes("Compliant")) {
                        numericalScore = 2;
                    }

                    // For non-compliant or OFI scores, remarks are mandatory
                    if ((numericalScore === 0 || numericalScore === 1) && !remarksVal) {
                        missingRemarksCount++;
                        if (remarksEl) ALC_Validator.highlight(remarksEl, true);
                    }

                    // Critical Gate Check: Non-compliant (0) or Partial (1) on any critical item fails the tour
                    if (isCritical && (numericalScore === 0 || numericalScore === 1)) {
                        hasCriticalFailure = true;
                        criticalFailures.push({
                            rowIdx: idx + 1,
                            criteria: criteria,
                            score: numericalScore,
                            scoreText: scoreValue,
                            area: area,
                            remarks: remarksVal || scoreValue
                        });
                    }

                    const files = this.uploadedFiles[idx] || [];
                    const hasNewFiles = Array.isArray(files) ? files.length > 0 : !!files;
                    const existingSavedFiles = row.getAttribute("data-existing-files");
                    const fileStatusEl = row.querySelector(".custom-file-upload div") || row.querySelector(".custom-file-upload small");
                    const hasExistingFile = !!existingSavedFiles || (fileStatusEl && (fileStatusEl.innerText.includes("Uploaded:") || fileStatusEl.innerText.includes("Saved Photos")));

                    if (isNonCompliant && !hasNewFiles && !hasExistingFile) {
                        missingFilesCount++;
                        const fileInput = row.querySelector("input[type='file']");
                        if (fileInput) ALC_Validator.highlight(fileInput, true);
                        const fileLabel = row.querySelector(".custom-file-upload");
                        if (fileLabel) {
                            fileLabel.style.border = "1px solid #ef4444";
                            fileLabel.style.boxShadow = "0 0 0 0.2rem rgba(239, 68, 68, 0.25)";
                        }
                    }

                    totalObtainedScore += numericalScore;
                    totalMaxScore += 2; // Each checkpoint has max score of 2

                    scores.push({
                        criteria: criteria,
                        score: numericalScore,
                        isCritical: isCritical,
                        area: area,
                        remarks: remarksVal
                    });
                }
            });

            if (incompleteCount > 0 || missingFilesCount > 0 || missingRemarksCount > 0) {
                let msg = "";
                if (incompleteCount > 0) {
                    msg += `Please select compliance score for the remaining ${incompleteCount} checkpoint(s).\n`;
                }
                if (missingRemarksCount > 0) {
                    msg += `Please provide defect remarks for the ${missingRemarksCount} non-compliant/partial checkpoint(s).\n`;
                }
                if (missingFilesCount > 0) {
                    msg += `Uploading a proof image is mandatory for ${missingFilesCount} Non-Compliant checkpoint(s).`;
                }
                alert(msg.trim());

                // Smoothly scroll to the first invalid row/element inside the scroll container
                const firstInvalid = document.querySelector("#section-checklist-filling input[style*='border-color'], #section-checklist-filling select[style*='border-color'], #section-checklist-filling .custom-file-upload[style*='border']");
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (typeof firstInvalid.focus === 'function') {
                        try { firstInvalid.focus(); } catch (e) {}
                    }
                }

                resolve(null);
                return;
            }

            const scorePercentRaw = totalMaxScore > 0 ? (totalObtainedScore / totalMaxScore) * 100 : 0;
            const scorePercent = scorePercentRaw.toFixed(2);
            const isPass = (parseFloat(scorePercent) >= 80) && !hasCriticalFailure;

            resolve({
                percent: scorePercent,
                isPass: isPass,
                hasDefects: hasDefects,
                hasCriticalFailure: hasCriticalFailure,
                criticalFailures: criticalFailures,
                scores: scores
            });
        });
    },

    // Step 9: Submit and evaluate ALC Checklist
    submitChecklist: async function () {
        if (!ALC_StateMachine.currentTourId) {
            alert("No active session ID found.");
            return;
        }

        const evaluation = await this.calculateScore();
        if (!evaluation) return;

        let isPass = evaluation.isPass;
        let statusText = "Completed";
        let stateNext = ALC_STATES.SUMMARY;

        if (ALC_StateMachine.isPreviousDay) {
            isPass = false;
            statusText = "Closed - Expired";
            stateNext = ALC_STATES.SUMMARY;
        } else if (evaluation.hasCriticalFailure) {
            isPass = false;
            statusText = "Failed - Pending Production";
            stateNext = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) ? ALC_STATES.PRODUCTION_ACTION : ALC_STATES.SUMMARY;
        } else if (evaluation.hasDefects) {
            statusText = isPass ? "Success - Pending Production" : "Failed - Pending Production";
            // QA (not in production team) should go to Summary page instead of Production Action
            stateNext = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) ? ALC_STATES.PRODUCTION_ACTION : ALC_STATES.SUMMARY;
        }

        try {
            ShowLoader();

            // 1. Upload any defect proof images in parallel first
            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
            const uploadTasks = [];
            Object.keys(this.uploadedFiles).forEach(idx => {
                const files = this.uploadedFiles[idx];
                if (!files) return;
                const fileList = Array.isArray(files) ? files : [files];
                const row = rows[idx];
                const cardHeader = row?.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim() || "Area";
                const remarks = row?.querySelectorAll("td")[3]?.querySelector("input")?.value || "";

                fileList.forEach((file, fileIdx) => {
                    uploadTasks.push({
                        rowIdx: idx,
                        file: file,
                        fileIdx: fileIdx,
                        cardHeader: cardHeader,
                        remarks: remarks,
                        checkpointId: `CP-${idx}-${fileIdx + 1}`
                    });
                });
            });

            const uploadedFileNames = {}; // maps rowIdx -> Array of uploaded file names

            if (uploadTasks.length > 0) {
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(10, `Uploading ${uploadTasks.length} defect photo(s)...`);
                }
                await Promise.all(uploadTasks.map(async (task) => {
                    try {
                        const uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                            task.file,
                            ALC_StateMachine.currentTourId,
                            task.cardHeader,
                            task.checkpointId,
                            task.remarks
                        );
                        let finalName = "";
                        if (uploadedUrl) {
                            finalName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                        } else {
                            finalName = task.file.name;
                        }
                        if (!uploadedFileNames[task.rowIdx]) {
                            uploadedFileNames[task.rowIdx] = [];
                        }
                        uploadedFileNames[task.rowIdx].push(finalName);
                    } catch (uploadError) {
                        console.error(`Failed to upload QA file for row #${Number(task.rowIdx) + 1} (${task.file.name}):`, uploadError);
                    }
                }));
            }

            // 2. Prepare all row records
            const recordsToSave = [];
            let areaName = "Unknown Area";
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cardHeader = row.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim();
                if (cardHeader) areaName = cardHeader;

                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteriaSpan = tds[1].querySelector(".criteria-text");
                    const criteria = criteriaSpan ? criteriaSpan.innerText.trim() : tds[1].innerText.replace(/CRITICAL(?: GATE)?/gi, "").trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    const scoreText = selectEl ? selectEl.value : "Compliant (2)";
                    const remarks = remarksEl ? remarksEl.value : "";

                    let status = "OK";
                    if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant") ||
                        scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                        status = "Not Okay";
                    }

                    let remarksVal = remarks;
                    const newFiles = uploadedFileNames[i] || [];
                    const allFiles = [...newFiles];
                    
                    const existingSaved = row.getAttribute("data-existing-files");
                    if (existingSaved) {
                        const prevFiles = existingSaved.split(",").map(f => f.trim()).filter(Boolean);
                        prevFiles.forEach(pf => {
                            if (!allFiles.includes(pf)) allFiles.push(pf);
                        });
                    }

                    if (allFiles.length > 0) {
                        remarksVal = remarksVal ? `${remarksVal} | File: ${allFiles.join(", ")}` : ` | File: ${allFiles.join(", ")}`;
                    }

                    const rowRecord = {
                        "cr3ea_qualitytourid@odata.bind": ALC_StateMachine.currentTourId ? `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${String(ALC_StateMachine.currentTourId).replace(/[{}]/g, "").trim().toLowerCase()})` : null,
                        "cr3ea_title": `ALC_${moment().format('MM-DD-YYYY')}`,
                        "cr3ea_cycle": `Cycle-1`,
                        "cr3ea_area": areaName,
                        "cr3ea_criteria": criteria,
                        "cr3ea_status": status,
                        "cr3ea_defectcategory": scoreText,
                        "cr3ea_defectremarks": remarksVal
                    };

                    const existingCp = (this.checkpoints || []).find(c => {
                        const cpCrit = (c.cr3ea_criteria || "").replace(/CRITICAL(?: GATE)?/gi, "").toLowerCase().trim();
                        return cpCrit === criteria.toLowerCase().trim() || (c.cr3ea_criteria || "").trim().toLowerCase() === criteria.toLowerCase().trim();
                    });
                    if (existingCp && existingCp.cr3ea_rajpura_alcsid) {
                        rowRecord.cr3ea_rajpura_alcsid = existingCp.cr3ea_rajpura_alcsid;
                    }

                    recordsToSave.push(rowRecord);
                }
            }

            // 3. Save checkpoints in controlled parallel chunks (8 concurrent requests per wave)
            const CHUNK_SIZE = 8;
            const total = recordsToSave.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = recordsToSave.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round(15 + (currentCount / total) * 75);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Submitting checkpoints (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => ALC_DAL.saveChecklistRow(rec)));
            }

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(95, "Finalizing tour session status...");
            }

            // 2. Update Tour Session status in Dataverse
            const session = ALC_StateMachine.currentSession || {};
            const baseTitle = session.cr3ea_title || ("ALC_" + moment().format("MM-DD-YYYY_HH:mm"));
            const cleanBaseTitle = baseTitle.split("||")[0].trim();

            const dbStatusValue = statusText === "Success - Pending Production" ? "Failed - Pending Production" : statusText;

            const isLineClearVal = isPass;

            const sessionUpdate = {
                cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                cr3ea_status: dbStatusValue,
                cr3ea_processstatus: statusText,
                cr3ea_title: cleanBaseTitle,
                cr3ea_overall_score: String(evaluation.percent),
                cr3ea_checklist_result: ALC_StateMachine.isPreviousDay ? "Expired" : (isPass ? "Pass" : "Fail"),
                cr3ea_islineclear: isLineClearVal
            };
            await ALC_DAL.saveSession(sessionUpdate);

            // Trigger Power Automate notification
            try {
                if (typeof ALC_Notification !== "undefined") {
                    let activeConfigs = [];
                    try {
                        activeConfigs = await ALC_DAL.getConfig();
                    } catch (configErr) {
                        console.warn("Failed to fetch configs for email resolution:", configErr);
                    }
                    const fullSession = Object.assign({}, ALC_StateMachine.currentSession, sessionUpdate);
                    await ALC_Notification.sendVerificationComplete(
                        fullSession,
                        evaluation.percent,
                        sessionUpdate.cr3ea_checklist_result,
                        isPass,
                        activeConfigs
                    );

                    // Send detailed Critical Gate incident alert to Top Management (ALC) team if any critical parameter failed
                    if (evaluation.hasCriticalFailure && evaluation.criticalFailures && evaluation.criticalFailures.length > 0) {
                        try {
                            await ALC_Notification.sendCriticalGateFailureNotification(
                                fullSession,
                                evaluation.criticalFailures,
                                activeConfigs
                            );
                        } catch (critNotifErr) {
                            console.warn("Failed to trigger Critical Gate failure alert:", critNotifErr);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to trigger verification complete notification:", err);
            }

            HideLoader();

            // Notify user with Alert
            if (ALC_StateMachine.isPreviousDay) {
                alert(`Observations Submitted Successfully! Since this is a previous day's observation, the session has been closed as Expired without line clearance.`);
            } else if (evaluation.hasCriticalFailure) {
                alert(`ALC Checklist Failed (Critical Gate Violation). Score: ${evaluation.percent}%. ${evaluation.criticalFailures.length} critical parameter(s) were non-compliant or partial. Forwarding to production for corrective actions.`);
            } else if (statusText === "Success - Pending Production") {
                alert(`ALC Checklist Submitted successfully with Success Score: ${evaluation.percent}%. Forwarding to production for corrective actions.`);
            } else if (statusText === "Completed") {
                alert(`ALC Cleared Successfully! Score: ${evaluation.percent}%`);
            } else {
                alert(`ALC Checklist Failed. Score: ${evaluation.percent}%. Forwarding to production for corrective actions.`);
            }

            // Redirect to dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = homeUrl;

        } catch (error) {
            HideLoader();
            console.error("Error submitting ALC to Dataverse:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit ALC checklist")
                : ("Dataverse Error: Failed to submit ALC checklist: " + (error.message || ""));
            alert(msg);
        }
    },

    // Update Progress Tracker Banner dynamically
    updateTracker: function () {
        const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
        const totalCheckpoints = rows.length;
        let filledCount = 0;
        let compliantCount = 0;
        let partialCount = 0;
        let nonCompliantCount = 0;
        let pendingCount = 0;
        let hasLiveCriticalFailure = false;
        let liveCriticalFailureCount = 0;

        let totalObtainedScore = 0;
        const totalMaxScore = totalCheckpoints * 2; // Always out of full checklist size

        rows.forEach(row => {
            const selectEl = row.querySelector("select");
            const isCritical = row.getAttribute("data-is-critical") === "true";
            if (selectEl) {
                const scoreValue = selectEl.value;
                if (scoreValue) {
                    filledCount++;
                    let numericalScore = 2;
                    if (scoreValue.includes("Non-Compliant") || scoreValue.includes("(0)") || scoreValue === "00") {
                        numericalScore = 0;
                        nonCompliantCount++;
                    } else if (scoreValue.includes("Partial") || scoreValue.includes("(1)") || scoreValue === "01") {
                        numericalScore = 1;
                        partialCount++;
                    } else {
                        compliantCount++;
                    }
                    totalObtainedScore += numericalScore;

                    if (isCritical && (numericalScore === 0 || numericalScore === 1)) {
                        hasLiveCriticalFailure = true;
                        liveCriticalFailureCount++;
                    }
                } else {
                    pendingCount++;
                }
            }
        });

        // Compute estimated percentage
        const progressPercent = totalCheckpoints > 0 ? Math.round((filledCount / totalCheckpoints) * 100) : 0;
        const estimatedScorePercent = totalMaxScore > 0 ? ((totalObtainedScore / totalMaxScore) * 100).toFixed(2) : "0.00";
        const isPass = (parseFloat(estimatedScorePercent) >= 80) && !hasLiveCriticalFailure;

        // Update DOM elements
        const summaryTextEl = document.getElementById("tracker-summary-text");
        if (summaryTextEl) {
            summaryTextEl.innerHTML = `<strong>${filledCount}</strong> of <strong>${totalCheckpoints}</strong> checkpoints filled (${progressPercent}%)`;
        }

        const progressBarEl = document.getElementById("tracker-progress-bar");
        if (progressBarEl) {
            progressBarEl.style.width = `${progressPercent}%`;
            progressBarEl.setAttribute("aria-valuenow", progressPercent);
        }

        const estimatedScoreEl = document.getElementById("tracker-estimated-score");
        if (estimatedScoreEl) {
            estimatedScoreEl.innerText = `${estimatedScorePercent}%`;
        }

        const scoreBadgeEl = document.getElementById("tracker-score-badge");
        if (scoreBadgeEl) {
            if (hasLiveCriticalFailure) {
                scoreBadgeEl.innerText = "Fail (Critical Gate)";
                scoreBadgeEl.style.backgroundColor = "#fee2e2";
                scoreBadgeEl.style.color = "#b91c1c";
                scoreBadgeEl.style.borderColor = "#fca5a5";
                scoreBadgeEl.title = `${liveCriticalFailureCount} critical parameter(s) non-compliant or partial`;
            } else if (isPass) {
                scoreBadgeEl.innerText = "Pass";
                scoreBadgeEl.style.backgroundColor = "#dcfce7";
                scoreBadgeEl.style.color = "#15803d";
                scoreBadgeEl.style.borderColor = "#bbf7d0";
                scoreBadgeEl.title = "Passing score (>= 80% with no critical gate failures)";
            } else {
                scoreBadgeEl.innerText = "Fail (< 80%)";
                scoreBadgeEl.style.backgroundColor = "#fee2e2";
                scoreBadgeEl.style.color = "#b91c1c";
                scoreBadgeEl.style.borderColor = "#fecaca";
                scoreBadgeEl.title = "Score is below 80% threshold";
            }
        }

        const countCompliantEl = document.getElementById("tracker-count-compliant");
        if (countCompliantEl) countCompliantEl.innerText = compliantCount;

        const countPartialEl = document.getElementById("tracker-count-partial");
        if (countPartialEl) countPartialEl.innerText = partialCount;

        const countNonCompliantEl = document.getElementById("tracker-count-noncompliant");
        if (countNonCompliantEl) countNonCompliantEl.innerText = nonCompliantCount;

        const countPendingEl = document.getElementById("tracker-count-pending");
        if (countPendingEl) countPendingEl.innerText = pendingCount;
    },
    // Pause the active tour checklist
    pauseTour: async function () {
        if (!ALC_StateMachine.currentTourId) {
            alert("No active session ID found.");
            return;
        }

        const confirmPause = confirm("Are you sure you want to pause the tour? Your progress will be saved, and you can resume it later from the dashboard.");
        if (!confirmPause) return;

        try {
            ShowLoader();

            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");

            // Calculate current score based on all checklist rows (out of total points)
            const totalMaxPoints = rows.length * 2;
            let totalObtainedPoints = 0;
            let filledCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const selectEl = row.querySelector("select");
                if (selectEl && selectEl.value) {
                    filledCount++;
                    let numericScore = 2;
                    const val = selectEl.value;
                    if (val.includes("Non-Compliant") || val.includes("(0)") || val === "00") {
                        numericScore = 0;
                    } else if (val.includes("Partial") || val.includes("(1)") || val === "01") {
                        numericScore = 1;
                    }
                    totalObtainedPoints += numericScore;
                }
            }
            const currentScore = totalMaxPoints > 0 ? ((totalObtainedPoints / totalMaxPoints) * 100).toFixed(2) : "0.00";

            // 1. Upload any defect proof images in parallel first
            const uploadTasks = [];
            Object.keys(this.uploadedFiles).forEach(idx => {
                const files = this.uploadedFiles[idx];
                if (!files) return;
                const fileList = Array.isArray(files) ? files : [files];
                const row = rows[idx];
                const cardHeader = row?.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim() || "Area";
                const remarks = row?.querySelectorAll("td")[3]?.querySelector("input")?.value || "";

                fileList.forEach((file, fileIdx) => {
                    uploadTasks.push({
                        rowIdx: idx,
                        file: file,
                        fileIdx: fileIdx,
                        cardHeader: cardHeader,
                        remarks: remarks,
                        checkpointId: `CP-${idx}-${fileIdx + 1}`
                    });
                });
            });

            const uploadedFileNames = {}; // maps rowIdx -> Array of uploaded file names

            if (uploadTasks.length > 0) {
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(10, `Uploading ${uploadTasks.length} defect photo(s)...`);
                }
                await Promise.all(uploadTasks.map(async (task) => {
                    try {
                        const uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                            task.file,
                            ALC_StateMachine.currentTourId,
                            task.cardHeader,
                            task.checkpointId,
                            task.remarks
                        );
                        let finalName = "";
                        if (uploadedUrl) {
                            finalName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                        } else {
                            finalName = task.file.name;
                        }
                        if (!uploadedFileNames[task.rowIdx]) {
                            uploadedFileNames[task.rowIdx] = [];
                        }
                        uploadedFileNames[task.rowIdx].push(finalName);
                    } catch (uploadError) {
                        console.error(`Failed to upload QA file for row #${Number(task.rowIdx) + 1} (${task.file.name}) during pause:`, uploadError);
                    }
                }));
            }

            // 2. Prepare all row records
            const recordsToSave = [];
            let areaName = "Unknown Area";
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cardHeader = row.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim();
                if (cardHeader) areaName = cardHeader;

                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteriaSpan = tds[1].querySelector(".criteria-text");
                    const criteria = criteriaSpan ? criteriaSpan.innerText.trim() : tds[1].innerText.replace(/CRITICAL(?: GATE)?/gi, "").trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    const scoreText = selectEl ? selectEl.value : "";
                    const remarks = remarksEl ? remarksEl.value.trim() : "";

                    if (!scoreText) continue;

                    let status = "OK";
                    if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant") ||
                        scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                        status = "Not Okay";
                    }

                    let remarksVal = remarks;
                    const newFiles = uploadedFileNames[i] || [];
                    const allFiles = [...newFiles];
                    
                    const existingSaved = row.getAttribute("data-existing-files");
                    if (existingSaved) {
                        const prevFiles = existingSaved.split(",").map(f => f.trim()).filter(Boolean);
                        prevFiles.forEach(pf => {
                            if (!allFiles.includes(pf)) allFiles.push(pf);
                        });
                    }

                    if (allFiles.length > 0) {
                        remarksVal = remarksVal ? `${remarksVal} | File: ${allFiles.join(", ")}` : ` | File: ${allFiles.join(", ")}`;
                    }

                    const rowRecord = {
                        "cr3ea_qualitytourid@odata.bind": ALC_StateMachine.currentTourId ? `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${String(ALC_StateMachine.currentTourId).replace(/[{}]/g, "").trim().toLowerCase()})` : null,
                        "cr3ea_title": `ALC_${moment().format('MM-DD-YYYY')}`,
                        "cr3ea_cycle": `Cycle-1`,
                        "cr3ea_area": areaName,
                        "cr3ea_criteria": criteria,
                        "cr3ea_status": status,
                        "cr3ea_defectcategory": scoreText,
                        "cr3ea_defectremarks": remarksVal
                    };

                    const existingCp = (this.checkpoints || []).find(c => {
                        const cpCrit = (c.cr3ea_criteria || "").replace(/CRITICAL(?: GATE)?/gi, "").toLowerCase().trim();
                        return cpCrit === criteria.toLowerCase().trim() || (c.cr3ea_criteria || "").trim().toLowerCase() === criteria.toLowerCase().trim();
                    });
                    if (existingCp && existingCp.cr3ea_rajpura_alcsid) {
                        rowRecord.cr3ea_rajpura_alcsid = existingCp.cr3ea_rajpura_alcsid;
                    }

                    recordsToSave.push(rowRecord);
                }
            }

            // 3. Save checkpoints in controlled parallel chunks (8 concurrent requests per wave)
            const CHUNK_SIZE = 8;
            const total = recordsToSave.length;
            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = recordsToSave.slice(i, i + CHUNK_SIZE);
                const currentCount = Math.min(i + CHUNK_SIZE, total);
                const percent = Math.round(15 + (currentCount / total) * 75);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Saving checkpoints (${currentCount} of ${total})...`);
                }
                await Promise.all(chunk.map(rec => ALC_DAL.saveChecklistRow(rec)));
            }

            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(100, "Finalizing pause...");
            }

            // Save session status as "QA In Progress" with dynamic score
            const session = ALC_StateMachine.currentSession || {};
            const baseTitle = session.cr3ea_title || ("ALC_" + moment().format("MM-DD-YYYY_HH:mm"));
            const cleanBaseTitle = baseTitle.split("||")[0].trim();

            await ALC_DAL.saveSession({
                cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                cr3ea_status: "QA In Progress",
                cr3ea_processstatus: "QA In Progress",
                cr3ea_overall_score: String(currentScore),
                cr3ea_title: cleanBaseTitle
            });

            HideLoader();
            alert("Tour paused and progress saved successfully!");

            // Redirect to dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = homeUrl;
        } catch (error) {
            HideLoader();
            console.error("Error pausing tour:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "pause ALC tour")
                : ("Dataverse Error: Failed to pause tour: " + (error.message || ""));
            alert(msg);
        }
    }
};
