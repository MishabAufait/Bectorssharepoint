// Step 13: QA Re-verification Logic (verify failed checkpoints only)
console.log("ALC Re-Verification script loaded");

const ALC_ReVerification = {
    failedCheckpoints: [],
    uploadedFiles: {},

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

            let remarksHtml = cp.cr3ea_productionremarks || "";
            if (!remarksHtml && cp.cr3ea_defectremarks && cp.cr3ea_defectremarks.startsWith("Action:")) {
                remarksHtml = cp.cr3ea_defectremarks;
            }
            if (remarksHtml.includes(" | Re-verified:")) {
                remarksHtml = remarksHtml.split(" | Re-verified:")[0].trim();
            }
            const isReady = remarksHtml && remarksHtml.trim().startsWith("Action:");

            if (remarksHtml.includes("| File:")) {
                const parts = remarksHtml.split("| File:");
                const textPart = parts[0].trim();
                const fileName = parts[1] ? parts[1].trim() : "";
                if (fileName) {
                    const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                    const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${fileName}`;
                    remarksHtml = `${textPart} | <a href="${fileUrl}" target="_blank" style="text-decoration: underline; color: #1a73e8; font-weight: bold;">View Proof (${fileName})</a>`;
                }
            }

            const disabledAttr = isReady ? "" : "disabled";

            row.innerHTML = `
                 <td>${index + 1}</td>
                 <td style="text-align: left;">
                     <strong>${cp.cr3ea_area}</strong><br>
                     <span class="text-secondary">${cp.cr3ea_criteria}</span><br>
                     <small class="text-info">${isReady ? remarksHtml : '<span class="badge" style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 11px;">Waiting for Production Action</span>'}</small>
                 </td>
                 <td>
                      <select class="form-select reverify-score-select" data-index="${index}" ${disabledAttr}>
                          <option value="" selected>Select</option>
                          <option value="Compliant (2)">Compliant (2)</option>
                          <option value="Partial (1)">Partial (1)</option>
                          <option value="Non-Compliant (0)">Non-Compliant (0)</option>
                      </select>
                 </td>
                 <td>
                     <input type="text" class="form-control reverify-remarks-input" data-index="${index}" placeholder="Enter Remarks" ${disabledAttr}>
                 </td>
                 <td>
                     <div class="custom-file-upload">
                         <input type="file" class="form-control-file file-upload-input" data-index="${index}" onchange="ALC_ReVerification.onFileSelected(this, ${index})" ${disabledAttr}>
                         <small id="reverify-file-status-${index}" class="form-text text-muted">No image uploaded</small>
                     </div>
                 </td>
             `;
            tbody.appendChild(row);
        });

        const trackerBanner = document.getElementById("reverify-tracker-banner");
        if (trackerBanner) trackerBanner.style.display = "block";

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

    // Handle file input selection
    onFileSelected: async function (input, index) {
        const file = input.files[0];
        if (!file) return;

        const fileStatus = document.getElementById(`reverify-file-status-${index}`);
        if (fileStatus) fileStatus.innerText = `Reading file: ${file.name}...`;

        // Check if image format
        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed.");
            input.value = "";
            if (fileStatus) fileStatus.innerText = "No image uploaded";
            return;
        }

        // Cache the file object to be uploaded on submission
        this.uploadedFiles[index] = file;
        if (fileStatus) fileStatus.innerHTML = `<span class="text-success">✔ ${file.name} ready</span>`;
    },

    // QA Submits Re-Verification
    submitReverification: async function () {
        if (!ALC_StateMachine.currentTourId) return;

        // Validate that all checkpoints have a selection, and images if Non-Compliant
        let isIncomplete = false;
        let hasMissingMandatoryFile = false;
        let missingFileIndex = -1;

        for (let i = 0; i < this.failedCheckpoints.length; i++) {
            const selectEl = document.querySelector(`.reverify-score-select[data-index='${i}']`);
            if (selectEl) {
                const val = selectEl.value;
                if (!val) {
                    isIncomplete = true;
                } else if (val.includes("Non-Compliant")) {
                    const file = this.uploadedFiles[i];
                    if (!file) {
                        hasMissingMandatoryFile = true;
                        if (missingFileIndex === -1) {
                            missingFileIndex = i + 1;
                        }
                    }
                }
            }
        }

        if (isIncomplete) {
            alert("Please select compliance score for all checkpoints before submitting.");
            return;
        }

        if (hasMissingMandatoryFile) {
            alert(`Uploading a proof image is mandatory for Non-Compliant checkpoint #${missingFileIndex}.`);
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
                const file = this.uploadedFiles[i];
                let fileName = "";
                if (file) {
                    try {
                        const uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                            file,
                            ALC_StateMachine.currentTourId,
                            cp.cr3ea_area,
                            cp.cr3ea_rajpura_alcsid || `CP-${i}`,
                            remarks
                        );
                        if (uploadedUrl) {
                            fileName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                        } else {
                            fileName = file.name;
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload QA re-verification file for checkpoint #${i + 1}:`, uploadError);
                        alert(`File upload failed for checkpoint #${i + 1}. Storing without file.`);
                    }
                }

                let baseRemark = cp.cr3ea_defectremarks || "";
                if (baseRemark.includes(" | Re-verified:")) {
                    baseRemark = baseRemark.split(" | Re-verified:")[0].trim();
                }

                let reverifyVal = remarks;
                if (fileName) {
                    reverifyVal = reverifyVal ? `${reverifyVal} | File: ${fileName}` : `File: ${fileName}`;
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

            // Compute overall score
            const allCheckpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);
            let totalMaxScore = allCheckpoints.length * 2;
            let totalObtainedScore = 0;

            allCheckpoints.forEach(cp => {
                const scoreText = cp.cr3ea_defectcategory || "Okay (2)";
                let numericScore = 2;
                if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant")) {
                    numericScore = 0;
                } else if (scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                    numericScore = 1;
                }
                totalObtainedScore += numericScore;
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

            // 2. Evaluate overall result based on score threshold (80%)
            let isPass = (parseFloat(overallPercent) >= 80);
            let statusText = "Completed";
            let stateNext = ALC_STATES.SUMMARY;

            if (ALC_StateMachine.isPreviousDay) {
                isPass = false;
                statusText = "Closed - Expired";
                stateNext = ALC_STATES.SUMMARY;
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

            const isLineClearVal = (parseFloat(overallPercent) >= 80 || ALC_StateMachine.isPreviousDay);

            const sessionUpdate = {
                cr3ea_prod_qualitytourid: ALC_StateMachine.currentTourId,
                cr3ea_status: dbStatusValue,
                cr3ea_processstatus: statusText,
                cr3ea_title: cleanBaseTitle,
                cr3ea_overall_score: String(overallPercent),
                cr3ea_checklist_result: ALC_StateMachine.isPreviousDay ? "Expired" : (parseFloat(overallPercent) >= 80 ? "Pass" : "Fail"),
                cr3ea_islineclear: isLineClearVal
            };
            await ALC_DAL.saveSession(sessionUpdate);

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

            // Transition state
            ALC_StateMachine.transitionTo(stateNext);
            if (stateNext === ALC_STATES.SUMMARY) {
                await ALC_Summary.init(ALC_StateMachine.currentTourId);
            }

        } catch (error) {
            HideLoader();
            alert("Error submitting re-verification: " + error.message);
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
                if (liveVal !== undefined) {
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
