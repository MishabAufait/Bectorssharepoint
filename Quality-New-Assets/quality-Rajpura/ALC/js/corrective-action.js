// Step 12: Production corrective action logging and image uploading to Document Library
console.log("ALC Corrective Action script loaded");

const ALC_CorrectiveAction = {
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
        const fileStatus = document.getElementById(`prod-file-status-${index}`);
        if (!fileStatus) return;

        const files = this.uploadedFiles[index] || [];
        if (files.length === 0) {
            const row = fileStatus.closest("tr");
            const existingProof = row ? row.getAttribute("data-existing-proof") : null;
            if (existingProof) {
                const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                const prodFiles = existingProof.split(",").map(f => f.trim()).filter(Boolean);
                if (prodFiles.length > 0) {
                    fileStatus.innerHTML = `<div class="alc-saved-file-links-container">` +
                        prodFiles.map((f, fIdx) => {
                            const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${f}`;
                            return `<a href="${fileUrl}" target="_blank" class="alc-saved-file-link" title="${f}"><i class="fa fa-paperclip"></i> Proof ${prodFiles.length > 1 ? (fIdx + 1) : ''}</a>`;
                        }).join("") + `</div>`;
                    return;
                }
            }
            fileStatus.innerHTML = '<span class="text-muted">No image uploaded</span>';
            return;
        }

        let chipsHtml = `<div class="alc-file-chips-container">`;
        chipsHtml += `<div style="font-size: 11px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 4px;"><i class="fa fa-check-circle"></i> ${files.length} photo(s) selected:</div>`;
        files.forEach((file, fIdx) => {
            chipsHtml += `
                <div class="alc-file-chip">
                    <span class="chip-name" title="${this.escapeHtml(file.name)}"><i class="fa fa-image"></i> ${this.escapeHtml(file.name)}</span>
                    <button type="button" class="chip-remove-btn" onclick="ALC_CorrectiveAction.removeFile(${index}, ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    // Load and render failed/objected items
    loadFailedItems: async function () {
        if (!ALC_StateMachine.currentTourId) return;

        try {
            ShowLoader();
            this.uploadedFiles = {}; // Reset cache
            // Fetch all checkpoints saved in Dataverse
            const checkpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);

            // Filter failed items: score is "Partial" or "Non-Compliant" (0 or 1)
            this.failedCheckpoints = checkpoints.filter(c =>
                c.cr3ea_status === "Not Okay" ||
                (c.cr3ea_defectcategory && (
                    c.cr3ea_defectcategory.includes("00") ||
                    c.cr3ea_defectcategory.includes("01") ||
                    c.cr3ea_defectcategory.includes("Non-Compliant") ||
                    c.cr3ea_defectcategory.includes("Partial")
                ))
            );

            this.renderFailedItemsTable();
            HideLoader();
        } catch (error) {
            HideLoader();
            console.error("Failed to load ALC checklists for production actions:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "load checklists for corrective action")
                : ("Dataverse Error: Failed to load checklists for corrective action - " + (error.message || ""));
            alert(msg);
        }
    },

    // Render failed checkpoints table for corrective actions input
    renderFailedItemsTable: function () {
        const tbody = document.getElementById("failed-checkpoints-body");
        if (!tbody) return;

        if (this.failedCheckpoints.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No failed checkpoints found.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        const isReadOnlyState = ALC_StateMachine.isReadOnly ||
            ((ALC_StateMachine.currentSession &&
                (ALC_StateMachine.currentSession.cr3ea_status === "Closed - Expired" ||
                    ALC_StateMachine.currentSession.cr3ea_processstatus === "Closed - Expired")) &&
                !(ALC_StateMachine.isProductionUser || ALC_StateMachine.isProductUser));

        let renderedCount = 0;
        let userPendingCount = 0;

        this.failedCheckpoints.forEach((cp, index) => {
            // Determine if the user has access to edit this specific area (using fuzzy substring comparison)
            let hasAreaAccess = false;
            if (!isReadOnlyState) {
                if (ALC_StateMachine.isProductionUser) {
                    hasAreaAccess = true;
                } else {
                    const assignedAreas = ALC_StateMachine.userAreas || [];
                    hasAreaAccess = assignedAreas.some(area =>
                        cp.cr3ea_area &&
                        (cp.cr3ea_area.toLowerCase().includes(area.toLowerCase().trim()) ||
                            area.toLowerCase().trim().includes(cp.cr3ea_area.toLowerCase()))
                    );
                }
            } else {
                // If it is read-only (Closed or Completed), show all rows to everyone
                hasAreaAccess = true;
            }

            // During active editing state, show ONLY checkpoints belonging to the logged-in user's assigned areas
            if (!isReadOnlyState && !hasAreaAccess) {
                console.log(`Skipping render of checkpoint #${index + 1} (${cp.cr3ea_area}) as it is outside the user's assigned areas.`);
                return;
            }

            renderedCount++;

            // If it is already resolved, show the remark and keep it disabled for this user session (unless they are PRODUCTION and want to edit it)
            const prefilledRemark = cp.cr3ea_defectremarks || "";
            let prodRemark = cp.cr3ea_productionremarks || "";
            if (!prodRemark && prefilledRemark.startsWith("Action:")) {
                prodRemark = prefilledRemark;
            }
            const isAlreadyResolved = !!prodRemark;

            // Increment pending count if user has access to this checkpoint but hasn't resolved it yet
            if (hasAreaAccess && !isAlreadyResolved) {
                userPendingCount++;
            }

            // Allow editing if the user has access to this area
            const canEditRow = hasAreaAccess && !isAlreadyResolved;

            const disabledAttr = canEditRow ? "" : "disabled";
            const readonlyAttr = canEditRow ? "" : "readonly";

            // Format file status label if prefilled remarks show a file upload
            let existingProdProofHtml = "";
            let existingProdFileNames = "";
            if (prodRemark && prodRemark.includes("| File: ")) {
                const parts = prodRemark.split("| File: ");
                if (parts[1]) {
                    existingProdFileNames = parts[1].trim();
                    const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                    let prodFiles = existingProdFileNames.split(",").map(f => f.trim()).filter(Boolean);
                    if (prefilledRemark && prefilledRemark.includes("File:")) {
                        const qaFilePart = prefilledRemark.split(/file:/i)[1] || "";
                        const qaFiles = qaFilePart.split(",").map(f => f.trim()).filter(Boolean);
                        if (qaFiles.length > 0) {
                            const filtered = prodFiles.filter(f => !qaFiles.includes(f));
                            if (filtered.length > 0) {
                                prodFiles = filtered;
                            }
                        }
                    }
                    if (prodFiles.length > 0) {
                        existingProdProofHtml = `<div class="alc-saved-file-links-container">` +
                            prodFiles.map((f, fIdx) => {
                                const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${f}`;
                                return `<a href="${fileUrl}" target="_blank" class="alc-saved-file-link" title="${f}"><i class="fa fa-paperclip"></i> Proof ${prodFiles.length > 1 ? (fIdx + 1) : ''}</a>`;
                            }).join("") + `</div>`;
                    }
                }
            }

            // Separate QA remarks and Production corrective action remarks
            let qaRemark = "";
            let cleanAction = "";

            if (isAlreadyResolved) {
                cleanAction = prodRemark.replace("Action: ", "");
                if (cleanAction.includes(" | File: ")) {
                    cleanAction = cleanAction.split(" | File: ")[0];
                }
                if (cp.cr3ea_productionremarks && prefilledRemark) {
                    qaRemark = prefilledRemark;
                }
            } else {
                qaRemark = prefilledRemark;
            }

            // Parse QA observation remarks and check if they attached a proof file
            let qaRemarkHtml = "";
            if (qaRemark) {
                let cleanQaRemark = qaRemark;
                let fileBadge = "";
                let fileName = "";
                if (qaRemark.toLowerCase().includes("file:")) {
                    const idx = qaRemark.toLowerCase().indexOf("file:");
                    fileName = qaRemark.substring(idx + 5).trim();
                    let textPart = qaRemark.substring(0, idx).trim();
                    if (textPart.endsWith("|")) {
                        textPart = textPart.substring(0, textPart.length - 1).trim();
                    }
                    cleanQaRemark = textPart;
                }

                if (!cleanQaRemark && fileName) {
                    cleanQaRemark = "Image Proof Uploaded";
                }

                if (fileName) {
                    const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                    const qaFiles = fileName.split(",").map(f => f.trim()).filter(Boolean);
                    fileBadge = qaFiles.map((f, i) => {
                        const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${f}`;
                        return `<a href="${fileUrl}" target="_blank" class="btn btn-xs btn-info" style="margin-left: 6px; padding: 2px 6px; font-size: 11px; text-decoration: none; color: #ffffff; background-color: #0284c7; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="${f}"><i class="fa fa-paperclip"></i> Photo ${qaFiles.length > 1 ? (i + 1) : ''}</a>`;
                    }).join("");
                }

                qaRemarkHtml = `<div style="margin-top: 6px; padding: 6px 10px; background: #fff5f5; border-left: 3px solid #ef4444; font-size: 12px; color: #991b1b; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                    <span><strong>QA Defect Observation:</strong> ${cleanQaRemark}</span>
                    <div style="display: inline-flex; flex-wrap: wrap; gap: 4px;">${fileBadge}</div>
                </div>`;
            }

            const row = document.createElement("tr");
            if (existingProdFileNames) {
                row.setAttribute("data-existing-proof", existingProdFileNames);
            }
            row.innerHTML = `
                <td>${renderedCount}</td>
                <td style="text-align: left;">
                    <strong>${cp.cr3ea_area}</strong><br>
                    <span class="text-secondary">${cp.cr3ea_criteria}</span>
                    ${qaRemarkHtml}
                </td>
                <td><span class="badge badge-danger">${cp.cr3ea_defectcategory}</span></td>
                <td>
                    <textarea class="form-control action-remark-input" data-index="${index}" rows="2" placeholder="Describe action taken..." ${readonlyAttr} ${disabledAttr}>${cleanAction}</textarea>
                </td>
                <td>
                    <div class="custom-file-upload">
                        <input type="file" class="form-control-file file-upload-input" data-index="${index}" accept="image/*" multiple onchange="ALC_CorrectiveAction.onFileSelected(this, ${index})" ${disabledAttr}>
                        <div id="prod-file-status-${index}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;">
                            ${existingProdProofHtml || '<span class="text-muted">No image uploaded</span>'}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Hide submit button and its wrapper if the user has 0 pending items to resolve in their assigned areas
        const correctiveSubmitBtn = document.getElementById("btn-submit-corrective-actions");
        if (correctiveSubmitBtn) {
            const isHidden = (userPendingCount === 0);
            correctiveSubmitBtn.style.display = isHidden ? "none" : "block";
            const wrapper = correctiveSubmitBtn.closest(".tour-cyle-btn-wrapper");
            if (wrapper) {
                wrapper.style.display = isHidden ? "none" : "flex";
            }
        }

        // Submit button visibility is managed by StateMachine based on role permissions and read-only state.
    },

    // Production submits corrective actions & uploads files
    submitActions: async function () {
        console.log("ALC_CorrectiveAction.submitActions triggered!");
        console.log("StateMachine Tour ID:", ALC_StateMachine.currentTourId);
        console.log("Checklist Failed Checkpoints Count:", this.failedCheckpoints.length);

        if (this.isSubmitting) {
            console.warn("Already submitting actions. Ignoring duplicate request.");
            return;
        }

        if (ALC_StateMachine.isReadOnly || ALC_StateMachine.currentState === ALC_STATES.QA_REVERIFYING) {
            console.warn("Aborting submitActions: form is in read-only or re-verification state.");
            return;
        }

        const rows = document.querySelectorAll("#failed-checkpoints-body tr");
        console.log("DOM Rows Count in failed-checkpoints-body:", rows.length);

        if (!ALC_StateMachine.currentTourId) {
            console.warn("Aborting submitActions: currentTourId is empty.");
            return;
        }

        if (rows.length === 0 || this.failedCheckpoints.length === 0) {
            console.warn("Aborting submitActions: no failed checkpoints or rows found.");
            return;
        }

        this.isSubmitting = true;
        const correctiveSubmitBtn = document.getElementById("btn-submit-corrective-actions");
        if (correctiveSubmitBtn) {
            correctiveSubmitBtn.disabled = true;
        }

        try {
            ShowLoader();

            let savedAny = false;

            for (let i = 0; i < this.failedCheckpoints.length; i++) {
                const cp = this.failedCheckpoints[i];
                console.log(`Processing corrective action row #${i + 1}: Checkpoint ID = ${cp.cr3ea_rajpura_alcsid}`);

                // Determine if the current user has access to edit this specific area
                let hasAreaAccess = false;
                if (ALC_StateMachine.isProductionUser) {
                    hasAreaAccess = true;
                } else {
                    const assignedAreas = ALC_StateMachine.userAreas || [];
                    hasAreaAccess = assignedAreas.some(area =>
                        cp.cr3ea_area &&
                        (cp.cr3ea_area.toLowerCase().includes(area.toLowerCase().trim()) ||
                            area.toLowerCase().trim().includes(cp.cr3ea_area.toLowerCase()))
                    );
                }

                // If they don't have area access, or if the checkpoint has already been resolved previously, skip saving it.
                // Note: Production role can always edit and save everything.
                const prefilledRemark = cp.cr3ea_defectremarks || "";
                let prodRemark = cp.cr3ea_productionremarks || "";
                if (!prodRemark && prefilledRemark.startsWith("Action:")) {
                    prodRemark = prefilledRemark;
                }
                const isAlreadyResolved = !!prodRemark;
                const canEditRow = hasAreaAccess && !isAlreadyResolved;

                if (!canEditRow) {
                    console.log(`Skipping checkpoint #${i + 1} (${cp.cr3ea_area}) as user does not have edit access or it was already resolved.`);
                    continue;
                }

                const remarkInput = document.querySelector(`.action-remark-input[data-index='${i}']`);
                const actionTaken = remarkInput ? remarkInput.value.trim() : "";
                console.log(`Action remarks for row #${i + 1}: "${actionTaken}"`);

                if (!actionTaken) {
                    alert(`Please provide action remarks for checkpoint #${i + 1}`);
                    HideLoader();
                    const btn = document.getElementById("btn-submit-corrective-actions");
                    if (btn) btn.disabled = false;
                    this.isSubmitting = false;
                    return;
                }

                // Mandatory image check for Non-Compliant checkpoints
                const isNonCompliant = cp.cr3ea_defectcategory &&
                    (cp.cr3ea_defectcategory.toLowerCase().includes("non-compliant") ||
                        cp.cr3ea_defectcategory.includes("00") ||
                        cp.cr3ea_defectcategory.includes("01"));

                const files = this.uploadedFiles[i] || [];
                const hasExistingFile = !!(prodRemark && prodRemark.includes("| File:"));

                if (isNonCompliant && files.length === 0 && !hasExistingFile) {
                    alert(`Uploading a proof image is mandatory for Non-Compliant checkpoint #${i + 1} (${cp.cr3ea_area}).`);
                    HideLoader();
                    const btn = document.getElementById("btn-submit-corrective-actions");
                    if (btn) btn.disabled = false;
                    this.isSubmitting = false;
                    return;
                }

                let uploadedFileNames = [];
                if (files.length > 0) {
                    console.log(`Uploading ${files.length} proof file(s) for row #${i + 1}`);
                    const uploadPromises = files.map(file =>
                        ALC_DAL.uploadCorrectiveActionFile(
                            file,
                            ALC_StateMachine.currentTourId,
                            cp.cr3ea_area,
                            cp.cr3ea_rajpura_alcsid || `CP-${i}`,
                            actionTaken
                        ).then(uploadedUrl => {
                            if (uploadedUrl) {
                                return uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                            }
                            return file.name;
                        })
                    );
                    uploadedFileNames = await Promise.all(uploadPromises);
                    console.log(`Proof file(s) uploaded successfully:`, uploadedFileNames);
                }

                // Combine existing PRODUCTION file names only (do NOT include QA defect photos)
                let existingFileNames = "";
                if (hasExistingFile && prodRemark && prodRemark.includes("| File:")) {
                    existingFileNames = prodRemark.split("| File:")[1].trim();
                    if (existingFileNames.includes("|")) {
                        existingFileNames = existingFileNames.split("|")[0].trim();
                    }
                    // Filter out any QA defect files if they were previously merged into prodRemark
                    if (prefilledRemark && prefilledRemark.includes("File:")) {
                        const qaFilePart = prefilledRemark.split(/file:/i)[1] || "";
                        const qaFiles = qaFilePart.split(",").map(f => f.trim()).filter(Boolean);
                        if (qaFiles.length > 0) {
                            const pFiles = existingFileNames.split(",").map(f => f.trim()).filter(Boolean);
                            const filtered = pFiles.filter(f => !qaFiles.includes(f));
                            existingFileNames = filtered.join(", ");
                        }
                    }
                }

                const allFilesList = [
                    ...existingFileNames.split(",").map(f => f.trim()).filter(Boolean),
                    ...uploadedFileNames.filter(Boolean)
                ];
                const uniqueFiles = Array.from(new Set(allFilesList));
                const finalFileString = uniqueFiles.join(", ");

                // Construct defect remarks. If proof file was uploaded, reference the file names
                let remarksVal = `Action: ${actionTaken}`;
                if (finalFileString) {
                    remarksVal += ` | File: ${finalFileString}`;
                }

                // Truncate to 1000 chars (matching the new Dataverse column limit)
                if (remarksVal.length > 1000) {
                    remarksVal = remarksVal.substring(0, 997) + "...";
                }

                // Update checklist checkpoint record in Dataverse with action details
                const updatedRecord = {
                    cr3ea_rajpura_alcsid: cp.cr3ea_rajpura_alcsid,
                    cr3ea_productionremarks: remarksVal
                };
                console.log(`Saving checklist row details:`, updatedRecord);
                await ALC_DAL.saveChecklistRow(updatedRecord);
                savedAny = true;
            }

            if (!savedAny && ALC_StateMachine.isProductUser) {
                alert("No new actions to submit for your assigned areas.");
                HideLoader();
                return;
            }

            // Check if there are STILL any failed checkpoints without action remarks (both in Dataverse and our local list)
            const latestCheckpoints = await ALC_DAL.getCheckpoints(ALC_StateMachine.currentTourId);
            const stillPendingActions = latestCheckpoints.some(c => {
                const isFailed = c.cr3ea_status === "Not Okay" ||
                    (c.cr3ea_defectcategory && (
                        c.cr3ea_defectcategory.includes("00") ||
                        c.cr3ea_defectcategory.includes("01") ||
                        c.cr3ea_defectcategory.includes("Non-Compliant") ||
                        c.cr3ea_defectcategory.includes("Partial")
                    ));
                let prodRemark = c.cr3ea_productionremarks || "";
                if (!prodRemark) {
                    const defectRemarks = c.cr3ea_defectremarks || "";
                    if (defectRemarks.startsWith("Action:")) {
                        prodRemark = defectRemarks;
                    }
                }
                return isFailed && !prodRemark.trim();
            });

            // Transition Tour Session status to Pending Re-Verification (we transition immediately so QA can re-verify submitted areas)
            const isExpired = ALC_StateMachine.isPreviousDay ||
                (ALC_StateMachine.currentSession &&
                    (ALC_StateMachine.currentSession.cr3ea_status === "Closed - Expired" ||
                        ALC_StateMachine.currentSession.cr3ea_processstatus === "Closed - Expired"));

            const isSuccessTour = ALC_StateMachine.currentSession &&
                ALC_StateMachine.currentSession.cr3ea_processstatus === "Success - Pending Production";
            const targetStatus = isExpired ? "Closed - Expired" : (isSuccessTour ? "Success - Pending Re-Verification" : "Pending Re-Verification");
            const dbStatusValue = targetStatus === "Success - Pending Re-Verification" ? "Pending Re-Verification" : targetStatus;

            const sessionUpdate = {
                cr3ea_prod_rajpura_quality_tourid: ALC_StateMachine.currentTourId,
                cr3ea_status: dbStatusValue,
                cr3ea_processstatus: targetStatus
            };
            console.log("Saving quality tour status updates:", sessionUpdate);
            await ALC_DAL.saveSession(sessionUpdate);

            // Trigger Power Automate notification
            try {
                if (typeof ALC_Notification !== "undefined") {
                    const fullSession = Object.assign({}, ALC_StateMachine.currentSession, sessionUpdate);
                    await ALC_Notification.sendResubmitRequest(fullSession, stillPendingActions);
                }
            } catch (err) {
                console.error("Failed to trigger resubmit re-verification notification:", err);
            }

            HideLoader();
            this.isSubmitting = false;
            if (correctiveSubmitBtn) {
                correctiveSubmitBtn.disabled = false;
            }

            let alertMsg = "All corrective actions submitted successfully. Assigning back to QA for re-verification.";
            if (stillPendingActions) {
                alertMsg = "Corrective actions submitted for your area! Some areas are still pending, but the tour is now assigned back to QA for partial re-verification.";
            }

            if (isExpired) {
                alert("Corrective actions submitted successfully! Since this session is from a previous day, it remains Closed as Expired.");
            } else {
                alert(alertMsg);
            }

            // Redirect to dashboard
            const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
            window.location.href = homeUrl;

        } catch (error) {
            HideLoader();
            this.isSubmitting = false;
            const btn = document.getElementById("btn-submit-corrective-actions");
            if (btn) {
                btn.disabled = false;
            }
            console.error("Error inside submitActions:", error);

            // Extract descriptive error message from jQuery jqXHR / standard Error objects
            let errMsg = error.message;
            if (!errMsg) {
                if (error.responseText) {
                    try {
                        const parsed = JSON.parse(error.responseText);
                        errMsg = parsed.error ? parsed.error.message.value : error.responseText;
                    } catch (e) {
                        errMsg = error.responseText;
                    }
                } else if (error.statusText) {
                    errMsg = error.statusText;
                } else {
                    errMsg = JSON.stringify(error);
                }
            }
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error || errMsg, "submit corrective actions")
                : ("Dataverse Error: Failed to submit corrective actions - " + errMsg);
            alert(msg);
        }
    }
};
