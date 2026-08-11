// Step 12: Production corrective action logging and image uploading to Document Library
console.log("ALC Corrective Action script loaded");

const ALC_CorrectiveAction = {
    failedCheckpoints: [],
    uploadedFiles: {}, // Maps checkpoint index/id to uploaded file details

    // Load and render failed/objected items
    loadFailedItems: async function () {
        if (!ALC_StateMachine.currentTourId) return;

        try {
            ShowLoader();
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
                const assignedAreas = ALC_StateMachine.userAreas || [];
                hasAreaAccess = assignedAreas.some(area => 
                    cp.cr3ea_area && 
                    (cp.cr3ea_area.toLowerCase().includes(area.toLowerCase().trim()) || 
                     area.toLowerCase().trim().includes(cp.cr3ea_area.toLowerCase()))
                );
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
            let fileLabel = "No image uploaded";
            if (prodRemark && prodRemark.includes("| File: ")) {
                const parts = prodRemark.split("| File: ");
                if (parts[1]) fileLabel = `Uploaded: ${parts[1]}`;
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
                    const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${fileName}`;
                    fileBadge = `<a href="${fileUrl}" target="_blank" class="btn btn-xs btn-info" style="margin-left: 10px; padding: 2px 6px; font-size: 11px; text-decoration: none; color: #ffffff; background-color: #0284c7; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa fa-paperclip"></i> View Image</a>`;
                }

                qaRemarkHtml = `<div style="margin-top: 6px; padding: 6px 10px; background: #fff5f5; border-left: 3px solid #ef4444; font-size: 12px; color: #991b1b; border-radius: 4px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <span><strong>QA Defect Observation:</strong> ${cleanQaRemark}</span>
                    ${fileBadge}
                </div>`;
            }

            const row = document.createElement("tr");
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
                        <input type="file" class="form-control-file file-upload-input" data-index="${index}" onchange="ALC_CorrectiveAction.onFileSelected(this, ${index})" ${disabledAttr}>
                        <small id="prod-file-status-${index}" class="form-text text-muted">${fileLabel}</small>
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

    // Handle file input selection
    onFileSelected: async function (input, index) {
        const file = input.files[0];
        if (!file) return;

        const fileStatus = document.getElementById(`prod-file-status-${index}`);
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

    // Production submits corrective actions & uploads files
    submitActions: async function () {
        console.log("ALC_CorrectiveAction.submitActions triggered!");
        console.log("StateMachine Tour ID:", ALC_StateMachine.currentTourId);
        console.log("Checklist Failed Checkpoints Count:", this.failedCheckpoints.length);
        
        if (this.isSubmitting) {
            console.warn("Already submitting actions. Ignoring duplicate request.");
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
                const assignedAreas = ALC_StateMachine.userAreas || [];
                hasAreaAccess = assignedAreas.some(area => 
                    cp.cr3ea_area && 
                    (cp.cr3ea_area.toLowerCase().includes(area.toLowerCase().trim()) || 
                     area.toLowerCase().trim().includes(cp.cr3ea_area.toLowerCase()))
                );

                // If they don't have area access, or if the checkpoint has already been resolved previously, skip saving it.
                // Note: Production role can always edit and save everything.
                const prefilledRemark = cp.cr3ea_defectremarks || "";
                const isAlreadyResolved = prefilledRemark.startsWith("Action: ");
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

                const file = this.uploadedFiles[i];
                const hasExistingFile = prefilledRemark.includes("| File:");

                if (isNonCompliant && !file && !hasExistingFile) {
                    alert(`Uploading a proof image is mandatory for Non-Compliant checkpoint #${i + 1} (${cp.cr3ea_area}).`);
                    HideLoader();
                    const btn = document.getElementById("btn-submit-corrective-actions");
                    if (btn) btn.disabled = false;
                    this.isSubmitting = false;
                    return;
                }

                let uploadedUrl = "";
                let fileName = "";
                if (file) {
                    console.log(`Uploading proof file for row #${i + 1}: ${file.name}`);
                    uploadedUrl = await ALC_DAL.uploadCorrectiveActionFile(
                        file, 
                        ALC_StateMachine.currentTourId, 
                        cp.cr3ea_area, 
                        cp.cr3ea_rajpura_alcsid || `CP-${i}`, 
                        actionTaken
                    );
                    // Parse the final unique filename (containing the timestamp) from the uploaded server relative URL
                    if (uploadedUrl) {
                        fileName = uploadedUrl.substring(uploadedUrl.lastIndexOf("/") + 1);
                    } else {
                        fileName = file.name;
                    }
                    console.log(`Proof uploaded successfully: ${uploadedUrl} (Unique Name: ${fileName})`);
                }

                // Construct defect remarks. If proof file was uploaded, reference the file name only
                // to stay within the 100 character Dataverse limit.
                let remarksVal = `Action: ${actionTaken}`;
                if (fileName) {
                    remarksVal += ` | File: ${fileName}`;
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
                cr3ea_prod_qualitytourid: ALC_StateMachine.currentTourId,
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
                ALC_StateMachine.isReadOnly = true;
                ALC_StateMachine.transitionTo(ALC_STATES.SUMMARY);
                await ALC_Summary.init(ALC_StateMachine.currentTourId);
            } else {
                alert(alertMsg);
                ALC_StateMachine.isReadOnly = true;
                ALC_StateMachine.transitionTo(ALC_STATES.SUMMARY);
                await ALC_Summary.init(ALC_StateMachine.currentTourId);
            }

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
            alert("Error submitting corrective actions: " + errMsg);
        }
    }
};
