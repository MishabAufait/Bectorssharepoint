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

    getRowId: function (row) {
        if (!row || typeof row !== "object") return "";
        if (row.id) return String(row.id).replace(/[{}]/g, "").trim().toLowerCase();
        for (let k in row) {
            if (k.endsWith("id") && typeof row[k] === "string" && /^[0-9a-fA-F-]{36}$/.test(row[k])) {
                if (!k.includes("qualitytourid") && !k.includes("plantid") && !k.includes("modifiedby") && !k.includes("createdby") && !k.includes("bind")) {
                    return String(row[k]).replace(/[{}]/g, "").trim().toLowerCase();
                }
            }
        }
        if (row["@odata.id"]) {
            const m = row["@odata.id"].match(/\(([0-9a-fA-F-]{36})\)/);
            if (m) return m[1].toLowerCase();
        }
        return "";
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
            case "Cream Percentage": this.activeSubChecklistKey = "CHILD_CREAM_PERCENTAGE"; break;
        }

        console.log(`Initializing Re-verify: Key=${this.activeSubChecklistKey}`);
        await this.loadReverifyRows();

        // Lock form if user is not authorized QA Executive
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            PKGOPS_StateMachine.lockReverifyReadOnly(true);
        }
    },

    parseSampleNum: function (row, fallbackIdx) {
        if (!row) return fallbackIdx !== undefined ? fallbackIdx + 1 : 1;
        if (typeof row === "string" || typeof row === "number") {
            const m = String(row).match(/\d+/);
            return m ? parseInt(m[0], 10) : (fallbackIdx !== undefined ? fallbackIdx + 1 : 1);
        }
        if (row.cr3ea_samplenumber) {
            const m = String(row.cr3ea_samplenumber).match(/\d+/);
            if (m) return parseInt(m[0], 10);
        }
        if (row.cr3ea_name) {
            const m = String(row.cr3ea_name).match(/Sample[_\s-]*(\d+)/i);
            if (m) return parseInt(m[1], 10);
        }
        return fallbackIdx !== undefined ? fallbackIdx + 1 : 999;
    },

    loadReverifyRows: async function () {
        const container = document.getElementById("reverify-form-area");
        if (!container) return;

        container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p>Loading corrective actions...</p></div>`;

        try {
            const rows = await PKGOPS_DAL.getSubChecklistRows(this.activeSubChecklistKey, this.currentTourId);
            
            // Filter only rows that had deviations and now have corrective actions (or need QA verification)
            if (this.pkgopsType === "Code Verification") {
                this.reverifyRows = rows
                    .filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed") || (r.cr3ea_defecttype && r.cr3ea_defecttype !== "None" && r.cr3ea_defecttype !== "Okay" && r.cr3ea_deviationstatus !== "Closed"))
                    .sort((a, b) => this.parseSampleNum(a) - this.parseSampleNum(b));
            } else if (this.pkgopsType === "PAPA") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed") || (r.cr3ea_defecttype && r.cr3ea_defecttype !== "Overall Summary" && r.cr3ea_deviationstatus !== "Closed"));
            } else if (this.pkgopsType === "PQI") {
                this.reverifyRows = rows
                    .filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed") || (r.cr3ea_sampleresult === "Not Okay" && r.cr3ea_deviationstatus !== "Closed"))
                    .sort((a, b) => {
                        const numA = this.parseSampleNum(a);
                        const numB = this.parseSampleNum(b);
                        if (numA !== numB) return numA - numB;
                        return (a.cr3ea_samplenumber || "").localeCompare(b.cr3ea_samplenumber || "", undefined, { numeric: true });
                    });
            } else if (this.pkgopsType === "Seal Integrity") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed") || (parseInt(r.cr3ea_noofleakage) > 0 && r.cr3ea_deviationstatus !== "Closed"));
            } else if (this.pkgopsType === "Cream Percentage") {
                this.reverifyRows = rows.filter(r => r.cr3ea_deviationstatus === "Pending Re-Verification" || (r.cr3ea_actiontaken && r.cr3ea_deviationstatus !== "Closed") || (r.cr3ea_status === "Fail" && r.cr3ea_deviationstatus !== "Closed") || r.cr3ea_deviationstatus === "Open");
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
                                let rowId = this.getRowId(row);

                                const actionRaw = row.cr3ea_actiontaken || "";
                                const actionTaken = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[0] || "-";
                                const actionProof = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[1] || "";

                                if (this.pkgopsType === "Code Verification") {
                                    const sampleNo = this.parseSampleNum(row, idx);
                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-start gap-1">
                                            <span class="badge bg-primary" style="font-size: 12px; padding: 4px 8px;">Sample ${sampleNo}</span>
                                            <span class="fw-bold text-danger" style="font-size: 13px;">${row.cr3ea_defecttype || "Code Defect"}</span>
                                            <small class="text-secondary">Batch: ${row.cr3ea_batchno || "-"} | PKD: ${row.cr3ea_pkd || "-"}</small>
                                        </div>
                                    `;
                                } else if (this.pkgopsType === "PAPA") {
                                    defectDesc = row.cr3ea_defecttype || "Appearance Defect";
                                } else if (this.pkgopsType === "PQI") {
                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-start gap-1">
                                            <span class="badge bg-primary" style="font-size: 12px; padding: 4px 8px;">${row.cr3ea_samplenumber || `Sample ${idx + 1}`}</span>
                                            <span class="fw-bold text-danger" style="font-size: 13px;">${row.cr3ea_evaluationtype} Pack Defect</span>
                                        </div>
                                    `;
                                } else if (this.pkgopsType === "Seal Integrity") {
                                    const qty = parseInt(row.cr3ea_samplequantity, 10) || 0;
                                    const leaks = parseInt(row.cr3ea_noofleakage, 10) || 0;
                                    const passPctVal = qty > 0 ? (((Math.max(0, qty - leaks)) / qty) * 100) : 0;
                                    const passPct = passPctVal.toFixed(2) + "%";
                                    const passBadgeClass = passPctVal >= 80 ? "bg-warning text-dark" : "bg-danger";

                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-center justify-content-center gap-1.5 p-1">
                                            <span class="fw-bold text-danger" style="font-size: 13px;">
                                                <i class="fa fa-shield-alt text-danger me-1"></i>Seal Integrity Deviation
                                            </span>
                                            <span class="badge ${passBadgeClass}" style="font-size: 11px; padding: 4px 8px; border-radius: 4px;">
                                                ${passPct} Pass Rate
                                            </span>
                                        </div>
                                        <div class="mt-2 text-start">
                                            ${this.formatSealIntegrityObsHtml(row)}
                                        </div>
                                    `;
                                } else if (this.pkgopsType === "Cream Percentage") {
                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-start gap-1">
                                            <span class="badge bg-danger" style="font-size: 11px;">Cream % Out of Spec</span>
                                            <span class="fw-bold text-dark" style="font-size: 13px;">${row.cr3ea_productname || "-"}</span>
                                            <small class="text-muted">Observed: ${row.cr3ea_creamreading || "-"}% (Min ${row.cr3ea_standardmin || "-"}% - Max ${row.cr3ea_standardmax || "-"}%)</small>
                                        </div>
                                    `;
                                }

                                const defectPhotos = Array.from(new Set((row.cr3ea_codepictureurl || row.cr3ea_batchcodepictureurl || "").split(",").map(u => u.trim()).filter(Boolean)));
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
                                        <td style="width: 32%;">
                                            ${defectDesc}
                                            ${defectPhotosHtml}
                                        </td>
                                        <td style="width: 20%;">${actionTaken}</td>
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
                    const sampleNo = this.parseSampleNum(row, idx);
                    const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, `Reverify_${this.pkgopsType}`, `Sample-${sampleNo}`, remarksVal));
                    const urls = await Promise.all(uploadPromises);
                    const validUrls = urls.filter(Boolean);
                    if (validUrls.length > 0) {
                        const proofUrl = validUrls.join(", ");
                        finalRemarks = finalRemarks ? `${finalRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`;
                    }
                }

                const childId = this.getRowId(row);
                if (!childId) {
                    console.error("Could not find record ID for row:", row);
                    throw new Error("Unable to identify child record ID for re-verification. Please refresh the page and try again.");
                }

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
    },

    formatSealIntegrityObsHtml: function (row) {
        const qty = parseInt(row.cr3ea_samplequantity, 10) || 0;
        const leaks = parseInt(row.cr3ea_noofleakage, 10) || 0;
        const passCount = Math.max(0, qty - leaks);
        const passPctVal = qty > 0 ? ((passCount / qty) * 100) : 100;
        const passPctStr = passPctVal.toFixed(2) + "%";
        const machine = row.cr3ea_machineno || "-";
        const rawDefects = (row.cr3ea_leakagetype || "").trim();

        const defectItems = [];
        if (rawDefects && rawDefects !== "None") {
            const parts = rawDefects.split(",").map(p => p.trim()).filter(Boolean);
            parts.forEach(p => {
                let text = p;
                let count = 1;
                let notes = "";
                let custom = "";

                // Check for notes [notes]
                const notesMatch = text.match(/\[(.*?)\]/);
                if (notesMatch) {
                    notes = notesMatch[1];
                    text = text.replace(/\[(.*?)\]/, "").trim();
                }

                // Check for count : 2
                const countMatch = text.match(/:\s*(\d+)$/);
                if (countMatch) {
                    count = parseInt(countMatch[1], 10) || 1;
                    text = text.replace(/:\s*\d+$/, "").trim();
                }

                // Check for custom (detail)
                const customMatch = text.match(/^(.*?)\s*\((.*?)\)$/);
                if (customMatch) {
                    text = customMatch[1].trim();
                    custom = customMatch[2].trim();
                }

                defectItems.push({
                    type: text,
                    custom: custom,
                    notes: notes,
                    count: count
                });
            });
        }

        const passBadgeClass = passPctVal === 100 ? "bg-success" : (passPctVal >= 80 ? "bg-warning text-dark" : "bg-danger");

        return `
            <div class="text-start" style="font-size: 12px;">
                <!-- Key Metric Badges -->
                <div class="d-flex flex-wrap gap-1 mb-2">
                    <span class="badge bg-secondary" style="font-size: 11px; padding: 4px 8px;">M/C: <strong>${machine}</strong></span>
                    <span class="badge bg-light text-dark border" style="font-size: 11px; padding: 4px 8px;">Tested: <strong>${qty}</strong></span>
                    <span class="badge bg-danger text-white" style="font-size: 11px; padding: 4px 8px;">Leaks: <strong>${leaks}</strong></span>
                    <span class="badge ${passBadgeClass}" style="font-size: 11px; padding: 4px 8px;">Pass: <strong>${passPctStr}</strong></span>
                </div>

                <!-- Defect Breakdown Cards -->
                ${defectItems.length > 0 ? `
                    <div class="p-2 border rounded bg-white" style="border: 1px solid #fed7aa !important; background-color: #fffaf0 !important;">
                        <div class="fw-bold mb-1" style="font-size: 11px; text-transform: uppercase; color: #9a3412;">
                            Observed Defects (${defectItems.length} Type${defectItems.length > 1 ? 's' : ''}):
                        </div>
                        <div class="d-flex flex-column gap-1">
                            ${defectItems.map(d => `
                                <div class="d-flex align-items-center justify-content-between p-1 px-2 rounded bg-white" style="border: 1px solid #fee2e2;">
                                    <div>
                                        <strong class="text-danger">${d.type}</strong>
                                        ${d.custom ? `<span class="text-dark"> &bull; <em>${d.custom}</em></span>` : ''}
                                        ${d.notes ? `<span class="text-muted ms-1" style="font-size: 11px;">[${d.notes}]</span>` : ''}
                                    </div>
                                    <span class="badge bg-danger" style="font-size: 11px; font-weight: 700;">${d.count} ${d.count > 1 ? 'packs' : 'pack'}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                ` : `
                    <div class="text-muted small">No specific defect breakdown recorded.</div>
                `}
            </div>
        `;
    }
};
