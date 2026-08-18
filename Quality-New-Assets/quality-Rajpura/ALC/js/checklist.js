// Steps 6 to 9: Checklist filling, scoring calculation, and validation logic
console.log("ALC Checklist script loaded");

const ALC_Checklist = {
    checkpoints: [],
    uploadedFiles: {},

    // Handle file selection
    onFileSelected: async function (input, index) {
        const file = input.files[0];
        if (!file) return;

        const fileStatus = document.getElementById(`file-status-${index}`);
        if (fileStatus) fileStatus.innerText = `Reading file: ${file.name}...`;

        if (!file.type.startsWith("image/")) {
            alert("Only image files are allowed.");
            input.value = "";
            if (fileStatus) fileStatus.innerText = "No image uploaded";
            return;
        }

        this.uploadedFiles[index] = file;
        if (fileStatus) fileStatus.innerHTML = `<span class="text-success">✔ ${file.name} ready</span>`;
    },

    // Render Checklist
    renderChecklist: function () {
        const trackerBanner = document.getElementById("checklist-tracker-banner");
        if (trackerBanner) trackerBanner.style.display = "block";

        // Collect check rows from the DOM and initialize Select2 if needed
        const selectElements = document.querySelectorAll("#section-checklist-filling tbody select");
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
                    const criteria = tds[1].innerText.trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    // Find matching saved checkpoint
                    const cp = this.checkpoints.find(c => c.cr3ea_criteria === criteria);
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
                        let fileLabel = "No image uploaded";
                        let fileName = "";
                        if (cleanRemarks.includes("File:")) {
                            if (cleanRemarks.includes("| File:")) {
                                const parts = cleanRemarks.split("| File:");
                                cleanRemarks = parts[0].trim();
                                fileName = parts[1] ? parts[1].trim() : "";
                            } else {
                                fileName = cleanRemarks.replace("File:", "").trim();
                                cleanRemarks = "";
                            }
                            if (fileName) {
                                fileLabel = `Uploaded: ${fileName}`;
                            }
                        }

                        if (remarksEl) {
                            remarksEl.value = cleanRemarks;
                        }

                        // Show file label in 5th column
                        const customFileUploadEl = row.querySelector(".custom-file-upload");
                        const fileStatusEl = row.querySelector(".custom-file-upload small");
                        if (fileStatusEl) {
                            fileStatusEl.innerText = fileLabel;

                            // Remove any existing preview button/link to prevent duplicates
                            if (customFileUploadEl) {
                                const oldPreview = customFileUploadEl.querySelector(".image-preview-btn");
                                if (oldPreview) oldPreview.remove();
                            }

                            if (fileName && customFileUploadEl) {
                                const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                                const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${fileName}`;

                                const previewLink = document.createElement("a");
                                previewLink.href = fileUrl;
                                previewLink.target = "_blank";
                                previewLink.className = "image-preview-btn btn btn-sm btn-link text-info ms-2";
                                previewLink.style.display = "inline-block";
                                previewLink.style.textDecoration = "underline";
                                previewLink.style.fontSize = "12px";
                                previewLink.innerHTML = `<i class="fa fa-eye"></i> View Image`;
                                fileStatusEl.parentNode.appendChild(previewLink);
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
        }
    },

    // Step 7 & 8: Calculate score and evaluation (returns a Promise to ensure completeness)
    calculateScore: async function () {
        return new Promise((resolve) => {
            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
            let totalMaxScore = 0;
            let totalObtainedScore = 0;
            let hasDefects = false;
            let incompleteCount = 0;
            let missingFilesCount = 0;
            let missingFileIndex = -1;
            const scores = [];

            rows.forEach((row, idx) => {
                const selectEl = row.querySelector("select");
                const remarksEl = row.querySelector("input[type='text']");
                if (selectEl) {
                    const scoreValue = selectEl.value;
                    if (!scoreValue || scoreValue === "") {
                        incompleteCount++;
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

                    const file = this.uploadedFiles[idx];
                    if (isNonCompliant && !file) {
                        missingFilesCount++;
                        if (missingFileIndex === -1) {
                            missingFileIndex = idx + 1; // 1-based index
                        }
                    }

                    totalObtainedScore += numericalScore;
                    totalMaxScore += 2; // Each checkpoint has max score of 2

                    scores.push({
                        criteria: row.querySelectorAll("td")[1]?.innerText.trim() || "",
                        score: numericalScore,
                        remarks: remarksEl ? remarksEl.value.trim() : ""
                    });
                }
            });

            if (incompleteCount > 0 || missingFilesCount > 0) {
                let msg = "";
                if (incompleteCount > 0) {
                    msg += `Please select compliance score for the remaining ${incompleteCount} checkpoint(s).\n`;
                }
                if (missingFilesCount > 0) {
                    msg += `Uploading a proof image is mandatory for ${missingFilesCount} Non-Compliant checkpoint(s).`;
                }
                alert(msg.trim());
                resolve(null);
                return;
            }

            const scorePercentRaw = totalMaxScore > 0 ? (totalObtainedScore / totalMaxScore) * 100 : 0;
            const scorePercent = scorePercentRaw.toFixed(2);

            resolve({
                percent: scorePercent,
                hasDefects: hasDefects,
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

        let isPass = (parseFloat(evaluation.percent) >= 80);
        let statusText = "Completed";
        let stateNext = ALC_STATES.SUMMARY;

        if (ALC_StateMachine.isPreviousDay) {
            isPass = false;
            statusText = "Closed - Expired";
            stateNext = ALC_STATES.SUMMARY;
        } else if (evaluation.hasDefects) {
            statusText = isPass ? "Success - Pending Production" : "Failed - Pending Production";
            // QA (not in production team) should go to Summary page instead of Production Action
            stateNext = (ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser) ? ALC_STATES.PRODUCTION_ACTION : ALC_STATES.SUMMARY;
        }

        try {
            ShowLoader();

            // 1. Save all checklist rows to Dataverse
            const rows = document.querySelectorAll("#section-checklist-filling tbody tr");
            let areaName = "Unknown Area";

            // Loop through DOM checklist items
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                // Check if this row is under a card section to capture Area Title
                const cardHeader = row.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim();
                if (cardHeader) areaName = cardHeader;

                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteria = tds[1].innerText.trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    const scoreText = selectEl ? selectEl.value : "Compliant (2)";
                    const remarks = remarksEl ? remarksEl.value : "";

                    let status = "OK";
                    if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant") ||
                        scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                        status = "Not Okay";
                    }

                    // Upload QA Image if selected
                    const file = this.uploadedFiles[i];
                    let fileName = "";
                    if (file) {
                        try {
                            const uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                                file,
                                ALC_StateMachine.currentTourId,
                                areaName,
                                `CP-${i}`,
                                remarks
                            );
                            if (uploadedUrl) {
                                fileName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                            } else {
                                fileName = file.name;
                            }
                        } catch (uploadError) {
                            console.error(`Failed to upload QA file for row #${i + 1}:`, uploadError);
                            alert(`File upload failed for checkpoint #${i + 1}. Storing without file.`);
                        }
                    }

                    let remarksVal = remarks;
                    if (fileName) {
                        remarksVal = remarksVal ? `${remarksVal} | File: ${fileName}` : ` | File: ${fileName}`;
                    } else {
                        // Keep previously saved filename if already there
                        const existingLabel = row.querySelector(".custom-file-upload small")?.innerText || "";
                        if (existingLabel.startsWith("Uploaded: ")) {
                            const prevFileName = existingLabel.replace("Uploaded: ", "").trim();
                            remarksVal = remarksVal ? `${remarksVal} | File: ${prevFileName}` : ` | File: ${prevFileName}`;
                        }
                    }

                    const rowRecord = {
                        "cr3ea_qualitytourid@odata.bind": ALC_StateMachine.currentTourId ? `/cr3ea_prod_rajpura_quality_tours(${String(ALC_StateMachine.currentTourId).replace(/[{}]/g, "").trim().toLowerCase()})` : null,
                        "cr3ea_title": `ALC_${moment().format('MM-DD-YYYY')}`,
                        "cr3ea_cycle": `Cycle-1`,
                        "cr3ea_area": areaName,
                        "cr3ea_criteria": criteria,
                        "cr3ea_status": status,
                        "cr3ea_defectcategory": scoreText,
                        "cr3ea_defectremarks": remarksVal
                    };

                    // Prevent duplicates: search this.checkpoints for existing record
                    const existingCp = (this.checkpoints || []).find(c => c.cr3ea_criteria === criteria);
                    if (existingCp && existingCp.cr3ea_rajpura_alcsid) {
                        rowRecord.cr3ea_rajpura_alcsid = existingCp.cr3ea_rajpura_alcsid;
                    }

                    // Save each checkpoint mapping to Dataverse Schema
                    await ALC_DAL.saveChecklistRow(rowRecord);
                }
            }

            // 2. Update Tour Session status in Dataverse
            const session = ALC_StateMachine.currentSession || {};
            const baseTitle = session.cr3ea_title || ("ALC_" + moment().format("MM-DD-YYYY_HH:mm"));
            const cleanBaseTitle = baseTitle.split("||")[0].trim();

            const dbStatusValue = statusText === "Success - Pending Production" ? "Failed - Pending Production" : statusText;

            const isLineClearVal = (evaluation.percent >= 80 || ALC_StateMachine.isPreviousDay);

            const sessionUpdate = {
                cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                cr3ea_status: dbStatusValue,
                cr3ea_processstatus: statusText,
                cr3ea_title: cleanBaseTitle,
                cr3ea_overall_score: String(evaluation.percent),
                cr3ea_checklist_result: ALC_StateMachine.isPreviousDay ? "Expired" : (evaluation.percent >= 80 ? "Pass" : "Fail"),
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
                    const isPass = (sessionUpdate.cr3ea_checklist_result === "Pass");
                    await ALC_Notification.sendVerificationComplete(
                        fullSession,
                        evaluation.percent,
                        sessionUpdate.cr3ea_checklist_result,
                        isPass,
                        activeConfigs
                    );
                }
            } catch (err) {
                console.error("Failed to trigger initial verification complete notification:", err);
            }

            HideLoader();

            // Notify user with Alert
            if (ALC_StateMachine.isPreviousDay) {
                alert(`Observations Submitted Successfully! Since this is a previous day's observation, the session has been closed as Expired without line clearance.`);
            } else if (statusText === "Success - Pending Production") {
                alert(`ALC Checklist Submitted successfully with Success Score: ${evaluation.percent}%. Forwarding to production for corrective actions.`);
            } else if (statusText === "Completed") {
                alert(`ALC Cleared Successfully! Score: ${evaluation.percent}%`);
            } else {
                alert(`ALC Checklist Failed. Score: ${evaluation.percent}%. Forwarding to production for corrective actions.`);
            }

            // Transition to Next State
            ALC_StateMachine.transitionTo(stateNext);
            if (stateNext === ALC_STATES.SUMMARY) {
                await ALC_Summary.init(ALC_StateMachine.currentTourId);
            }

        } catch (error) {
            HideLoader();
            alert("Error submitting ALC: " + error.message);
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

        let totalObtainedScore = 0;
        const totalMaxScore = totalCheckpoints * 2; // Always out of full checklist size

        rows.forEach(row => {
            const selectEl = row.querySelector("select");
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
                } else {
                    pendingCount++;
                }
            }
        });

        // Compute estimated percentage
        const progressPercent = totalCheckpoints > 0 ? Math.round((filledCount / totalCheckpoints) * 100) : 0;
        const estimatedScorePercent = totalMaxScore > 0 ? ((totalObtainedScore / totalMaxScore) * 100).toFixed(2) : "0.00";
        const isPass = parseFloat(estimatedScorePercent) >= 80;

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
            let areaName = "Unknown Area";

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

            // Loop and save each filled checkpoint row sequentially
            const total = rows.length;
            for (let i = 0; i < total; i++) {
                const percent = Math.round((i / total) * 100);
                if (typeof ShowProgressLoader === "function") {
                    ShowProgressLoader(percent, `Saving paused progress... (${i + 1} of ${total})`);
                }
                const row = rows[i];
                const cardHeader = row.closest(".bs-card")?.querySelector(".bs-card-title")?.innerText.trim();
                if (cardHeader) areaName = cardHeader;

                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteria = tds[1].innerText.trim();
                    const selectEl = tds[2].querySelector("select");
                    const remarksEl = tds[3].querySelector("input");

                    const scoreText = selectEl ? selectEl.value : "";
                    const remarks = remarksEl ? remarksEl.value.trim() : "";

                    // If not selected/filled, skip saving to keep DB clean
                    if (!scoreText) continue;

                    let status = "OK";
                    if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant") ||
                        scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                        status = "Not Okay";
                    }

                    // Upload QA Image if selected
                    const file = this.uploadedFiles[i];
                    let fileName = "";
                    if (file) {
                        try {
                            const uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                                file,
                                ALC_StateMachine.currentTourId,
                                areaName,
                                `CP-${i}`,
                                remarks
                            );
                            if (uploadedUrl) {
                                fileName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                            }
                        } catch (uploadError) {
                            console.error(`Failed to upload QA file for row #${i + 1} during pause:`, uploadError);
                        }
                    }

                    // Build remarks string
                    let remarksVal = remarks;
                    if (fileName) {
                        remarksVal = remarksVal ? `${remarksVal} | File: ${fileName}` : ` | File: ${fileName}`;
                    } else {
                        // Keep previously saved filename if already there
                        const existingLabel = row.querySelector(".custom-file-upload small")?.innerText || "";
                        if (existingLabel.startsWith("Uploaded: ")) {
                            const prevFileName = existingLabel.replace("Uploaded: ", "").trim();
                            remarksVal = remarksVal ? `${remarksVal} | File: ${prevFileName}` : ` | File: ${prevFileName}`;
                        }
                    }

                    const rowRecord = {
                        "cr3ea_qualitytourid@odata.bind": ALC_StateMachine.currentTourId ? `/cr3ea_prod_rajpura_quality_tours(${String(ALC_StateMachine.currentTourId).replace(/[{}]/g, "").trim().toLowerCase()})` : null,
                        "cr3ea_title": `ALC_${moment().format('MM-DD-YYYY')}`,
                        "cr3ea_cycle": `Cycle-1`,
                        "cr3ea_area": areaName,
                        "cr3ea_criteria": criteria,
                        "cr3ea_status": status,
                        "cr3ea_defectcategory": scoreText,
                        "cr3ea_defectremarks": remarksVal
                    };

                    // Prevent duplicates: search this.checkpoints for existing record
                    const existingCp = (this.checkpoints || []).find(c => c.cr3ea_criteria === criteria);
                    if (existingCp && existingCp.cr3ea_rajpura_alcsid) {
                        rowRecord.cr3ea_rajpura_alcsid = existingCp.cr3ea_rajpura_alcsid;
                    }

                    await ALC_DAL.saveChecklistRow(rowRecord);
                }
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
                : "/sites/Mrs_Bectors_PTMS/Pages/Home.aspx";
            window.location.href = homeUrl;
        } catch (error) {
            HideLoader();
            console.error("Error pausing tour:", error);
            alert("Failed to pause tour: " + error.message);
        }
    }
};
