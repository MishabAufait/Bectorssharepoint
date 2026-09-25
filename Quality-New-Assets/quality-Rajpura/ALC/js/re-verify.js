// Step 13: QA Re-verification Logic (verify failed checkpoints only)
console.log("ALC Re-Verification script loaded");

const ALC_ReVerification = {
    failedCheckpoints: [],
    uploadedFiles: {}, // Maps checkpoint index to Array of File objects: [File1, File2, ...]

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

    // Handle file input selection (supporting multiple files)
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
            // Avoid duplicate additions in the same checkpoint
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
        const fileStatus = document.getElementById(`reverify-file-status-${index}`);
        if (!fileStatus) return;

        const files = this.uploadedFiles[index] || [];
        if (files.length === 0) {
            fileStatus.innerHTML = '<span class="text-muted">No image uploaded</span>';
            return;
        }

        let chipsHtml = `<div class="alc-file-chips-container">`;
        chipsHtml += `<div style="font-size: 11px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 4px;"><i class="fa fa-check-circle"></i> ${files.length} photo(s) selected:</div>`;
        files.forEach((file, fIdx) => {
            chipsHtml += `
                <div class="alc-file-chip">
                    <span class="chip-name" title="${this.escapeHtml(file.name)}"><i class="fa fa-image"></i> ${this.escapeHtml(file.name)}</span>
                    <button type="button" class="chip-remove-btn" onclick="ALC_ReVerification.removeFile(${index}, ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    // Load and render failed items for re-verification
    loadReverificationItems: async function () {
        if (!ALC_StateMachine.currentTourId) return;

        try {
            ShowLoader();
            const checkpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);
            this.allCheckpoints = checkpoints;

            // Only re-verify the items that were previously marked Not Okay
            this.failedCheckpoints = checkpoints.filter(c =>
                c.cr3ea_status === "Not Okay" ||
                c.cr3ea_defectcategory.includes("00") ||
                c.cr3ea_defectcategory.includes("01") ||
                c.cr3ea_defectcategory.includes("Non-Compliant") ||
                c.cr3ea_defectcategory.includes("Partial")
            );

            this.uploadedFiles = {}; // Reset cache
            this.renderReverifyTable();
            HideLoader();
        } catch (error) {
            HideLoader();
            console.error("Failed to load checkpoints for QA re-verification:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "load checkpoints for QA re-verification")
                : ("Dataverse Error: Failed to load checkpoints for QA re-verification - " + (error.message || ""));
            alert(msg);
        }
    },

    // Render table
    renderReverifyTable: function () {
        const tbody = document.getElementById("reverify-checkpoints-body");
        if (!tbody) return;

        if (this.failedCheckpoints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-success">All checkpoints have been cleared!</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        this.failedCheckpoints.forEach((cp, index) => {
            const row = document.createElement("tr");

            // Display QA initial defect remarks & proof if present
            let qaDefectHtml = "";
            const qaDefectFiles = [];
            const defectRemark = cp.cr3ea_defectremarks || "";
            if (defectRemark) {
                let cleanDefectRemark = defectRemark;
                let defectFileName = "";
                if (defectRemark.toLowerCase().includes("file:")) {
                    const idx = defectRemark.toLowerCase().indexOf("file:");
                    defectFileName = defectRemark.substring(idx + 5).trim();
                    let textPart = defectRemark.substring(0, idx).trim();
                    if (textPart.endsWith("|")) {
                        textPart = textPart.substring(0, textPart.length - 1).trim();
                    }
                    cleanDefectRemark = textPart;
                }
                if (!cleanDefectRemark && defectFileName) {
                    cleanDefectRemark = "Image Proof Uploaded";
                }
                let defectFileBadges = "";
                if (defectFileName) {
                    const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                    const dFiles = defectFileName.split(",").map(f => f.trim()).filter(Boolean);
                    dFiles.forEach(f => qaDefectFiles.push(f));
                    defectFileBadges = dFiles.map((f, fIdx) => {
                        const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${f}`;
                        return `<a href="${fileUrl}" target="_blank" class="btn btn-xs btn-outline-danger" style="margin-left: 4px; padding: 1px 5px; font-size: 10px; text-decoration: none; border-radius: 3px;" title="${f}"><i class="fa fa-paperclip"></i> Defect Photo${dFiles.length > 1 ? ' (' + (fIdx + 1) + ')' : ''}</a>`;
                    }).join("");
                }
                qaDefectHtml = `<div style="margin-top: 4px; font-size: 11px; color: #991b1b;">
                    <strong>QA Defect:</strong> ${cleanDefectRemark}${defectFileBadges}
                </div>`;
            }

            // Display Production Corrective Action remarks & proof
            let prodRemarksHtml = cp.cr3ea_productionremarks || "";
            if (!prodRemarksHtml && cp.cr3ea_defectremarks && cp.cr3ea_defectremarks.startsWith("Action:")) {
                prodRemarksHtml = cp.cr3ea_defectremarks;
            }
            if (prodRemarksHtml.includes(" | Re-verified:")) {
                prodRemarksHtml = prodRemarksHtml.split(" | Re-verified:")[0].trim();
            }
            const isReady = prodRemarksHtml && prodRemarksHtml.trim().startsWith("Action:");

            if (prodRemarksHtml.includes("| File:")) {
                const parts = prodRemarksHtml.split("| File:");
                const textPart = parts[0].trim();
                const fileName = parts[1] ? parts[1].trim() : "";
                if (fileName) {
                    const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                    let fList = fileName.split(",").map(f => f.trim()).filter(Boolean);
                    // Filter out QA defect files if they were previously merged into production remarks
                    if (qaDefectFiles.length > 0) {
                        const prodOnly = fList.filter(f => !qaDefectFiles.includes(f));
                        if (prodOnly.length > 0) {
                            fList = prodOnly;
                        }
                    }
                    const links = fList.map((f, fIdx) => {
                        const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${f}`;
                        return `<a href="${fileUrl}" target="_blank" style="text-decoration: underline; color: #1a73e8; font-weight: bold; margin-left: 4px;" title="${f}">View Proof${fList.length > 1 ? ' (' + (fIdx + 1) + ')' : ''}</a>`;
                    }).join("");
                    prodRemarksHtml = `${textPart} | ${links}`;
                }
            }

            const disabledAttr = isReady ? "" : "disabled";

            row.innerHTML = `
                 <td>${index + 1}</td>
                 <td style="text-align: left;">
                     <strong>${cp.cr3ea_area}</strong><br>
                     <span class="text-secondary">${cp.cr3ea_criteria}</span>
                     ${qaDefectHtml}
                     <div style="margin-top: 4px;">
                         <small class="text-info">${isReady ? prodRemarksHtml : '<span class="badge" style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 11px;">Waiting for Production Action</span>'}</small>
                     </div>
                 </td>
                 <td>
                      <select class="form-select reverify-score-select" data-index="${index}" ${disabledAttr}>
                          <option value="" selected>Select</option>
                          <option value="Compliant (2)">Compliant</option>
                          <option value="Partial (1)">Partial</option>
                          <option value="Non-Compliant (0)">Non-Compliant</option>
                      </select>
                 </td>
                 <td>
                     <input type="text" class="form-control reverify-remarks-input" data-index="${index}" placeholder="Enter Remarks" ${disabledAttr}>
                 </td>
                 <td>
                     <div class="custom-file-upload">
                         <input type="file" class="form-control-file file-upload-input" data-index="${index}" accept="image/*" multiple onchange="ALC_ReVerification.onFileSelected(this, ${index})" ${disabledAttr}>
                         <div id="reverify-file-status-${index}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;">No image uploaded</div>
                     </div>
                 </td>
             `;
            tbody.appendChild(row);
        });

        const trackerBanner = document.getElementById("reverify-tracker-banner");
        if (trackerBanner) trackerBanner.style.display = "hidden";

        // Initialize Select2 on dropdowns and bind tracker updates
        const selectElements = tbody.querySelectorAll("select");
        selectElements.forEach(select => {
            if (window.jQuery && $.fn.select2) {
                $(select).select2({ minimumResultsForSearch: -1, width: "100%" });
                if (!select.disabled) {
                    $(select).off("change.reverify-tracker").on("change.reverify-tracker", () => {
                        this.updateTracker();
                    });
                }
            } else if (!select.disabled) {
                select.addEventListener("change", () => {
                    this.updateTracker();
                });
            }
        });

        this.updateTracker();
    },

    // QA Submits Re-Verification
    submitReverification: async function () {
        if (!ALC_StateMachine.currentTourId) return;

        // Validate that all checkpoints have a selection, and images if Non-Compliant
        let isIncomplete = false;
        let hasMissingMandatoryFile = false;
        let missingFileIndex = -1;
        let firstInvalidEl = null;

        for (let i = 0; i < this.failedCheckpoints.length; i++) {
            const selectEl = document.querySelector(`.reverify-score-select[data-index='${i}']`);
            if (selectEl && !selectEl.disabled) {
                const val = selectEl.value;
                if (!val) {
                    isIncomplete = true;
                    selectEl.style.borderColor = "#ef4444";
                    if (!firstInvalidEl) firstInvalidEl = selectEl;
                } else {
                    selectEl.style.borderColor = "";
                    if (val.includes("Non-Compliant")) {
                        const files = this.uploadedFiles[i] || [];
                        if (files.length === 0) {
                            hasMissingMandatoryFile = true;
                            if (missingFileIndex === -1) {
                                missingFileIndex = i + 1;
                            }
                            const fileInput = document.querySelector(`.file-upload-input[data-index='${i}']`);
                            if (fileInput && !firstInvalidEl) firstInvalidEl = fileInput;
                        }
                    }
                }
            }
        }

        if (isIncomplete) {
            alert("Please select compliance score for all checkpoints before submitting.");
            if (firstInvalidEl) {
                firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (hasMissingMandatoryFile) {
            alert(`Uploading a proof image is mandatory for Non-Compliant checkpoint #${missingFileIndex}.`);
            if (firstInvalidEl) {
                firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        let anyFailedAgain = false;

        try {
            ShowLoader();

            // 1. Update the re-verified checkpoints
            for (let i = 0; i < this.failedCheckpoints.length; i++) {
                const cp = this.failedCheckpoints[i];
                const selectEl = document.querySelector(`.reverify-score-select[data-index='${i}']`);
                const remarksEl = document.querySelector(`.reverify-remarks-input[data-index='${i}']`);

                if (!selectEl || selectEl.disabled) {
                    continue;
                }

                const scoreText = selectEl ? selectEl.value : "Compliant (2)";
                const remarks = remarksEl ? remarksEl.value.trim() : "";

                let status = "OK";
                if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant") ||
                    scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                    status = "Not Okay";
                    anyFailedAgain = true;
                }

                // Upload QA Re-verification Image if selected
                const files = this.uploadedFiles[i] || [];
                let uploadedFileNames = [];
                if (files.length > 0) {
                    try {
                        const uploadPromises = files.map(file =>
                            ALC_DAL.uploadCorrectiveActionFile(
                                file,
                                ALC_StateMachine.currentTourId,
                                cp.cr3ea_area,
                                cp.cr3ea_rajpura_alcsid || `CP-${i}`,
                                remarks
                            ).then(uploadedUrl => {
                                if (uploadedUrl) {
                                    return uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                                }
                                return file.name;
                            })
                        );
                        uploadedFileNames = await Promise.all(uploadPromises);
                    } catch (uploadError) {
                        console.error(`Failed to upload QA re-verification file for checkpoint #${i + 1}:`, uploadError);
                        alert(`File upload failed for checkpoint #${i + 1}. Storing without file.`);
                    }
                }

                const validNames = uploadedFileNames.filter(Boolean);
                const fileString = validNames.join(", ");

                let baseRemark = cp.cr3ea_defectremarks || "";

                let reverifyVal = remarks;
                if (fileString) {
                    reverifyVal = reverifyVal ? `${reverifyVal} | File: ${fileString}` : ` | File: ${fileString}`;
                }

                const finalRemarks = reverifyVal
                    ? (baseRemark ? `${baseRemark} | Re-verified: ${reverifyVal}` : `Re-verified: ${reverifyVal}`)
                    : cp.cr3ea_defectremarks;

                // Update checkpoint record in Dataverse
                const updatedRecord = {
                    cr3ea_rajpura_alcsid: cp.cr3ea_rajpura_alcsid,
                    cr3ea_status: status,
                    // Increment cycle to show re-verification cycle
                    cr3ea_cycle: `Cycle-2`,
                    cr3ea_defectcategory: scoreText,
                    cr3ea_defectremarks: finalRemarks
                };
                if (status === "Not Okay") {
                    updatedRecord.cr3ea_productionremarks = "";
                }
                await ALC_DAL.saveChecklistRow(updatedRecord);
            }

            // Compute overall score & check critical items
            const allCheckpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);
            let totalMaxScore = allCheckpoints.length * 2;
            let totalObtainedScore = 0;
            let hasCriticalFailure = false;
            const failedCriticalItems = [];

            let configs = [];
            try {
                configs = await ALC_DAL.getConfig();
            } catch (cfgErr) {
                console.warn("Could not load configs in reverify:", cfgErr);
            }
            const questionConfigs = configs.filter(c => c.ConfigType === "Checklist Question");

            allCheckpoints.forEach(cp => {
                const scoreText = cp.cr3ea_defectcategory || "Okay (2)";
                let numericScore = 2;
                if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant")) {
                    numericScore = 0;
                } else if (scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                    numericScore = 1;
                }
                totalObtainedScore += numericScore;

                // Check if this checkpoint is critical
                let isCritical = false;
                const criteriaText = (cp.cr3ea_criteria || "").toLowerCase().trim();
                const matchedCfg = questionConfigs.find(q => {
                    const qTitle = (q.Title || "").toLowerCase().trim();
                    const qRemarks = (q.Remarks || "").toLowerCase().trim();
                    return (qTitle && (criteriaText.includes(qTitle) || qTitle.includes(criteriaText))) ||
                           (qRemarks && (criteriaText.includes(qRemarks) || qRemarks.includes(criteriaText)));
                });

                if (matchedCfg) {
                    isCritical = !!(matchedCfg.isCritical ||
                        matchedCfg.IsCritical === true ||
                        matchedCfg.ProductCategory === "Critical" ||
                        matchedCfg.Remarks === "Critical");
                } else if (typeof ALC_CHECKLIST_SEED_DATA !== 'undefined' && Array.isArray(ALC_CHECKLIST_SEED_DATA)) {
                    const seedItem = ALC_CHECKLIST_SEED_DATA.find(s => {
                        const sText = (s.description || s.title || "").toLowerCase().trim();
                        return sText && (criteriaText.includes(sText) || sText.includes(criteriaText));
                    });
                    if (seedItem) {
                        isCritical = !!seedItem.isCritical;
                    }
                }

                if (isCritical && (numericScore === 0 || numericScore === 1)) {
                    hasCriticalFailure = true;
                    failedCriticalItems.push({
                        criteria: cp.cr3ea_criteria || "Critical Checkpoint",
                        score: numericScore,
                        remarks: cp.cr3ea_defectremarks || cp.cr3ea_defectcategory || "Non-Compliant",
                        area: cp.cr3ea_area || ""
                    });
                }
            });

            const overallPercentRaw = totalMaxScore > 0 ? (totalObtainedScore / totalMaxScore) * 100 : 0;
            const overallPercent = overallPercentRaw.toFixed(2);

            // Determine if there are still any failed checkpoints (failed just now, or still waiting for production action)
            let hasUnresolvedItems = anyFailedAgain;
            for (let i = 0; i < this.failedCheckpoints.length; i++) {
                const selectEl = document.querySelector(`.reverify-score-select[data-index='${i}']`);
                if (selectEl && selectEl.disabled) {
                    hasUnresolvedItems = true;
                }
            }

            // 2. Evaluate overall result based on score threshold (80%) AND critical items
            let isPass = (parseFloat(overallPercent) >= 80) && !hasCriticalFailure;
            let statusText = "Completed";
            let stateNext = ALC_STATES.SUMMARY;

            if (ALC_StateMachine.isPreviousDay) {
                isPass = false;
                statusText = "Closed - Expired";
                stateNext = ALC_STATES.SUMMARY;
            } else if (hasCriticalFailure) {
                isPass = false;
                statusText = "Failed - Pending Production";
                stateNext = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) ? ALC_STATES.PRODUCTION_ACTION : ALC_STATES.SUMMARY;
            } else if (hasUnresolvedItems) {
                statusText = isPass ? "Success - Pending Production" : "Failed - Pending Production";
                // QA (not in production team) should go to Summary page instead of Production Action
                stateNext = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) ? ALC_STATES.PRODUCTION_ACTION : ALC_STATES.SUMMARY;
            }

            // Get base title
            const session = ALC_StateMachine.currentSession || {};
            const baseTitle = session.cr3ea_title || ("ALC_" + moment().format("MM-DD-YYYY_HH:mm"));
            const cleanBaseTitle = baseTitle.split("||")[0].trim();

            const dbStatusValue = statusText === "Success - Pending Production" ? "Failed - Pending Production" : statusText;

            const isLineClearVal = isPass && !ALC_StateMachine.isPreviousDay;

            const sessionUpdate = {
                cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                cr3ea_status: dbStatusValue,
                cr3ea_processstatus: statusText,
                cr3ea_title: cleanBaseTitle,
                cr3ea_overall_score: String(overallPercent),
                cr3ea_checklist_result: ALC_StateMachine.isPreviousDay ? "Expired" : (isPass ? "Pass" : "Fail"),
                cr3ea_islineclear: isLineClearVal
            };
            await ALC_DAL.saveSession(sessionUpdate);

            // Trigger Power Automate notification
            try {
                if (typeof ALC_Notification !== "undefined") {
                    const fullSession = Object.assign({}, ALC_StateMachine.currentSession, sessionUpdate);
                    const isPass = (sessionUpdate.cr3ea_checklist_result === "Pass");
                    await ALC_Notification.sendReverificationComplete(
                        fullSession,
                        overallPercent,
                        sessionUpdate.cr3ea_checklist_result,
                        isPass
                    );

                    // Send detailed Critical Gate incident alert to Top Management (ALC) team if any critical parameter failed
                    if (hasCriticalFailure && failedCriticalItems.length > 0) {
                        try {
                            await ALC_Notification.sendCriticalGateFailureNotification(
                                fullSession,
                                failedCriticalItems,
                                configs
                            );
                        } catch (critNotifErr) {
                            console.warn("Failed to trigger Critical Gate failure alert in reverify:", critNotifErr);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to trigger re-verification complete notification:", err);
            }

            HideLoader();

            if (ALC_StateMachine.isPreviousDay) {
                alert(`Observations Submitted Successfully! Since this is a previous day's observation, the session has been closed as Expired without line clearance.`);
            } else if (statusText === "Success - Pending Production") {
                alert(`Re-verification complete. Current score is: ${overallPercent}% (Success). However, since there are still failing checkpoints, assigning back to Production.`);
            } else if (statusText === "Completed") {
                alert(`ALC Re-Verification Cleared Successfully! Overall Score: ${overallPercent}%`);
            } else {
                alert(`Re-Verification failed. Current score is: ${overallPercent}%. Some checkpoints are still non-compliant. Returning to production.`);
            }

            // Redirect to dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = homeUrl;

        } catch (error) {
            HideLoader();
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit re-verification")
                : ("Dataverse Error: Failed to submit re-verification - " + error.message);
            alert(msg);
        }
    },

    // Update Re-verification Progress Tracker banner dynamically
    updateTracker: function () {
        if (!this.allCheckpoints || this.allCheckpoints.length === 0) return;

        let totalCheckpoints = this.allCheckpoints.length;
        let filledCount = 0;
        let compliantCount = 0;
        let partialCount = 0;
        let nonCompliantCount = 0;
        let pendingCount = 0;

        let totalObtainedScore = 0;
        const totalMaxScore = totalCheckpoints * 2;

        // Create a map of the failed checkpoints currently being edited in the DOM
        const reverifyDropdowns = document.querySelectorAll(".reverify-score-select");
        const dropdownScores = {};
        reverifyDropdowns.forEach(select => {
            const index = parseInt(select.getAttribute("data-index"));
            const val = select.value;
            dropdownScores[index] = val;
        });

        this.allCheckpoints.forEach((cp, idx) => {
            // Find if this checkpoint is one of the failed checkpoints being re-verified
            const failedIndex = this.failedCheckpoints.findIndex(f => f.cr3ea_rajpura_alcsid === cp.cr3ea_rajpura_alcsid);

            let scoreValue = cp.cr3ea_defectcategory || "Compliant (2)";

            // If it is in the failed checkpoints list and is being edited, override with the dropdown value
            if (failedIndex !== -1 && reverifyDropdowns.length > 0) {
                const liveVal = dropdownScores[failedIndex];
                if (liveVal !== undefined && liveVal !== "") {
                    scoreValue = liveVal;
                }
            }

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
            } else {
                pendingCount++;
            }
        });

        const progressPercent = totalCheckpoints > 0 ? Math.round((filledCount / totalCheckpoints) * 100) : 0;
        const estimatedScorePercent = totalMaxScore > 0 ? ((totalObtainedScore / totalMaxScore) * 100).toFixed(2) : "0.00";
        const isPass = parseFloat(estimatedScorePercent) >= 80;

        // Update DOM elements
        const summaryTextEl = document.getElementById("reverify-tracker-summary-text");
        if (summaryTextEl) {
            summaryTextEl.innerHTML = `<strong>${filledCount}</strong> of <strong>${totalCheckpoints}</strong> checkpoints filled (${progressPercent}%)`;
        }

        const progressBarEl = document.getElementById("reverify-tracker-progress-bar");
        if (progressBarEl) {
            progressBarEl.style.width = `${progressPercent}%`;
            progressBarEl.setAttribute("aria-valuenow", progressPercent);
        }

        const estimatedScoreEl = document.getElementById("reverify-tracker-estimated-score");
        if (estimatedScoreEl) {
            estimatedScoreEl.innerText = `${estimatedScorePercent}%`;
        }

        const scoreBadgeEl = document.getElementById("reverify-tracker-score-badge");
        if (scoreBadgeEl) {
            if (isPass) {
                scoreBadgeEl.innerText = "Pass";
                scoreBadgeEl.style.backgroundColor = "#dcfce7";
                scoreBadgeEl.style.color = "#15803d";
                scoreBadgeEl.style.borderColor = "#bbf7d0";
            } else {
                scoreBadgeEl.innerText = "Fail";
                scoreBadgeEl.style.backgroundColor = "#fee2e2";
                scoreBadgeEl.style.color = "#b91c1c";
                scoreBadgeEl.style.borderColor = "#fecaca";
            }
        }

        const countCompliantEl = document.getElementById("reverify-tracker-count-compliant");
        if (countCompliantEl) countCompliantEl.innerText = compliantCount;

        const countPartialEl = document.getElementById("reverify-tracker-count-partial");
        if (countPartialEl) countPartialEl.innerText = partialCount;

        const countNonCompliantEl = document.getElementById("reverify-tracker-count-noncompliant");
        if (countNonCompliantEl) countNonCompliantEl.innerText = nonCompliantCount;

        const countUnselectedEl = document.getElementById("reverify-tracker-count-unselected");
        if (countUnselectedEl) countUnselectedEl.innerText = pendingCount;
    }
};
