// Re-verification controller for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Re-verification loaded");

const PKGOPS_Reverify = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    reverifyRows: [],
    uploadedFiles: {}, // Maps idx to Array of File objects

    escapeHtml: function (str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    onFileSelected: async function (input, idx) {
        if (!input.files || input.files.length === 0) return;

        if (!this.uploadedFiles[idx]) {
            this.uploadedFiles[idx] = [];
        }

        const selectedFiles = Array.from(input.files);
        let invalidCount = 0;

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(file.name);
            if (!isImage) {
                invalidCount++;
                continue;
            }
            const exists = this.uploadedFiles[idx].some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                this.uploadedFiles[idx].push(file);
            }
        }

        if (invalidCount > 0) {
            alert(`${invalidCount} non-image file(s) were ignored. Only image files (JPG, PNG, WebP, etc.) are allowed.`);
        }

        input.value = "";
        this.renderFileStatus(idx);
    },

    removeFile: function (idx, fileIdx) {
        if (this.uploadedFiles[idx] && this.uploadedFiles[idx][fileIdx]) {
            this.uploadedFiles[idx].splice(fileIdx, 1);
            if (this.uploadedFiles[idx].length === 0) {
                delete this.uploadedFiles[idx];
            }
        }
        this.renderFileStatus(idx);
    },

    renderFileStatus: function (idx) {
        const fileStatus = document.getElementById(`rev-file-status-${idx}`);
        if (!fileStatus) return;

        const files = this.uploadedFiles[idx] || [];
        if (files.length === 0) {
            fileStatus.innerHTML = "";
            return;
        }

        let chipsHtml = `<div class="pkgops-file-chips-container">`;
        chipsHtml += `<div style="font-size: 11px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 4px;"><i class="fa fa-check-circle"></i> ${files.length} photo(s) selected:</div>`;
        files.forEach((file, fIdx) => {
            chipsHtml += `
                <div class="pkgops-file-chip">
                    <span class="chip-name" title="${this.escapeHtml(file.name)}"><i class="fa fa-image"></i> ${this.escapeHtml(file.name)}</span>
                    <button type="button" class="chip-remove-btn" onclick="PKGOPS_Reverify.removeFile(${idx}, ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        this.uploadedFiles = {};
        
        switch (this.pkgopsType) {
            case "Code Verification": this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION"; break;
            case "PAPA": this.activeSubChecklistKey = "CHILD_PAPA"; break;
            case "PQI": this.activeSubChecklistKey = "CHILD_PQI_EVALUATION"; break;
            case "Seal Integrity": this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY"; break;
        }

        console.log(`Initializing Re-verify: Key=${this.activeSubChecklistKey}`);
        await this.loadReverifyRows();

        // Lock form if user is not authorized QA Executive
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            PKGOPS_StateMachine.lockReverifyReadOnly(true);
        }
    },

    loadReverifyRows: async function () {
        const container = document.getElementById("reverify-form-area");
        if (!container) return;

        container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p>Loading corrective actions...</p></div>`;

        try {
            const rows = await PKGOPS_DAL.getSubChecklistRows(this.activeSubChecklistKey, this.currentTourId);
            
            // Filter only rows that had deviations and now have corrective actions
            if (this.pkgopsType === "Code Verification") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed"));
            } else if (this.pkgopsType === "PAPA") {
                this.reverifyRows = rows.filter(r => r.cr3ea_actiontaken);
            } else if (this.pkgopsType === "PQI") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed"));
            } else if (this.pkgopsType === "Seal Integrity") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed"));
            }

            if (this.reverifyRows.length === 0) {
                container.innerHTML = `<div class="alert alert-success">No pending re-verifications found.</div>`;
                return;
            }

            this.renderReverifyTable(container);
        } catch (error) {
            console.error("Failed to load reverifications:", error);
            container.innerHTML = `<div class="alert alert-danger">Error loading re-verification list.</div>`;
        }
    },

    renderReverifyTable: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">QA Re-Verification Dashboard</h3>
                    <p class="text-primary fw-bold">Production has submitted corrective action. Review proof and select Pass/Fail for each.</p>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-md-12">
                    <table class="table table-bordered text-center align-middle">
                        <thead class="table-primary">
                            <tr>
                                <th>Defect</th>
                                <th>Corrective Action Taken</th>
                                <th>Action Proof Picture</th>
                                <th>Re-Verification Status</th>
                                <th>Re-Verification Remarks</th>
                                <th>Upload Re-Verification Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.reverifyRows.map((row, idx) => {
                                let defectDesc = "";
                                let rowId = "";

                                const actionRaw = row.cr3ea_actiontaken || "";
                                const actionTaken = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[0] || "-";
                                const actionProof = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[1] || "";

                                if (this.pkgopsType === "Code Verification") {
                                    defectDesc = row.cr3ea_defecttype || "Code Defect";
                                    rowId = row.cr3ea_rajpura_pkgops_codeverificationid || row.cr3ea_prod_rajpura_pkgops_codeverificationid || row.id;
                                } else if (this.pkgopsType === "PAPA") {
                                    defectDesc = row.cr3ea_defecttype || "Appearance Defect";
                                    rowId = row.cr3ea_rajpura_pkgops_papaid || row.cr3ea_prod_rajpura_pkgops_papaid || row.id;
                                } else if (this.pkgopsType === "PQI") {
                                    defectDesc = `${row.cr3ea_evaluationtype} Pack Defect (${row.cr3ea_samplenumber})`;
                                    rowId = row.cr3ea_rajpura_pkgops_pqi_evaluationid || row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid || row.id;
                                } else if (this.pkgopsType === "Seal Integrity") {
                                    defectDesc = "Leakage Defect";
                                    rowId = row.cr3ea_rajpura_pkgops_sealintegrityid || row.cr3ea_prod_rajpura_pkgops_sealintegrityid || row.id;
                                }

                                const defectPhotos = (row.cr3ea_codepictureurl || row.cr3ea_batchcodepictureurl || "").split(",").map(u => u.trim()).filter(Boolean);
                                let defectPhotosHtml = "";
                                if (defectPhotos.length > 0) {
                                    defectPhotosHtml = `<div class="mt-1 pkgops-saved-file-links-container">` +
                                        defectPhotos.map((u, pIdx) => `<a href="${u}" target="_blank" class="pkgops-saved-file-link"><i class="fa fa-image"></i> Defect Photo ${defectPhotos.length > 1 ? pIdx + 1 : ''}</a>`).join("") +
                                        `</div>`;
                                }

                                const actionProofUrls = (actionProof || "").split(",").map(u => u.trim()).filter(Boolean);
                                let proofLink = `<span class="text-secondary" style="font-style: italic; font-size: 12px;">No proof uploaded</span>`;
                                if (actionProofUrls.length > 0) {
                                    proofLink = `<div class="d-flex flex-wrap gap-1 justify-content-center">` +
                                        actionProofUrls.map((u, pIdx) => `<a href="${u}" target="_blank" class="btn btn-sm btn-outline-info" style="font-size: 11px; padding: 2px 6px;"><i class="fa fa-image"></i> Proof ${actionProofUrls.length > 1 ? pIdx + 1 : ''}</a>`).join("") +
                                        `</div>`;
                                }

                                return `
                                    <tr data-rowid="${rowId}">
                                        <td>
                                            <strong>${defectDesc}</strong>
                                            ${defectPhotosHtml}
                                        </td>
                                        <td>${actionTaken}</td>
                                        <td>${proofLink}</td>
                                        <td>
                                            <select class="form-select reverify-status-select" id="rev-status-${idx}">
                                                <option value="Pass">Okay</option>
                                                <option value="Fail">Not Okay</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control" id="rev-remarks-${idx}" placeholder="Optional remarks...">
                                        </td>
                                        <td>
                                            <input type="file" class="form-control" id="rev-file-${idx}" accept="image/*" multiple onchange="PKGOPS_Reverify.onFileSelected(this, ${idx})">
                                            <div id="rev-file-status-${idx}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;"></div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    submitReverification: async function () {
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            alert("Access Denied: Only the assigned QA Executive can submit re-verification.");
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            }
            return;
        }

        const currentTourStatus = PKGOPS_StateMachine.currentSession?.cr3ea_processstatus || PKGOPS_StateMachine.currentSession?.cr3ea_status || "";
        if (!currentTourStatus.includes("Pending Re-Verification")) {
            alert("This tour is currently in Pending Observation stage. Re-verification can only be submitted after Production completes corrective actions.");
            return;
        }

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            let overallPass = true;

            for (let idx = 0; idx < this.reverifyRows.length; idx++) {
                const row = this.reverifyRows[idx];
                const statusVal = document.getElementById(`rev-status-${idx}`).value;
                const remarksVal = document.getElementById(`rev-remarks-${idx}`).value;
                const fileInput = document.getElementById(`rev-file-${idx}`);

                if (statusVal === "Fail") {
                    overallPass = false;
                }

                let finalRemarks = remarksVal;
                const files = this.uploadedFiles[idx] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                if (files.length > 0) {
                    const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, `Reverify_${this.pkgopsType}`, `REV-${idx}`, remarksVal));
                    const urls = await Promise.all(uploadPromises);
                    const validUrls = urls.filter(Boolean);
                    if (validUrls.length > 0) {
                        const proofUrl = validUrls.join(", ");
                        finalRemarks = finalRemarks ? `${finalRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`;
                    }
                }

                const childId = row.cr3ea_rajpura_pkgops_sealintegrityid ||
                                row.cr3ea_prod_rajpura_pkgops_sealintegrityid ||
                                row.cr3ea_rajpura_pkgops_codeverificationid ||
                                row.cr3ea_prod_rajpura_pkgops_codeverificationid ||
                                row.cr3ea_rajpura_pkgops_papaid ||
                                row.cr3ea_prod_rajpura_pkgops_papaid ||
                                row.cr3ea_rajpura_pkgops_pqi_evaluationid ||
                                row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid ||
                                row.id;

                // Update child record deviation status
                let updatePayload = {
                    id: childId,
                    cr3ea_deviationstatus: statusVal === "Pass" ? "Closed" : "Failed - Pending Production",
                    cr3ea_actiontaken: (row.cr3ea_actiontaken || "") + " | QA: " + (finalRemarks || "None")
                };

                await PKGOPS_DAL.saveSubChecklistRow(this.activeSubChecklistKey, updatePayload);
            }

            // Transition parent status based on re-verify outcome
            const tourPayload = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
                cr3ea_rajpura_quality_tourid: this.currentTourId,
                cr3ea_islineclear: overallPass,
                cr3ea_status: overallPass ? "Completed" : "Failed - Pending Production",
                cr3ea_processstatus: overallPass ? "Completed" : "Failed - Pending Production"
            };

            await PKGOPS_DAL.saveTour(tourPayload);

            // Trigger notification
            if (typeof ALC_Notification !== "undefined") {
                const fullSession = {
                    ...PKGOPS_StateMachine.currentSession,
                    ...tourPayload
                };
                const score = overallPass ? 100 : 0;
                const result = overallPass ? "Pass" : "Fail";
                await ALC_Notification.sendReverificationComplete(fullSession, score, result, overallPass);
            }

            if (typeof HideLoader === "function") HideLoader();
            alert(overallPass ? "Re-verification succeeded. Quality Tour closed successfully!" : "Re-verification failed. Tour returned to Production for Corrective Action.");

            // Redirect to dashboard like in ALC
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            } else {
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = homeUrl;
            }
        } catch (error) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to submit re-verification: ", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit re-verification")
                : ("Submission failed: " + (error.message || "Please check connection and try again."));
            alert(msg);
        }
    }
};
