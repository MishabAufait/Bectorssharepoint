// Production Corrective Action controller for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Corrective Action loaded");

const PKGOPS_CorrectiveAction = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    deviatedRows: [],
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
        const fileStatus = document.getElementById(`act-file-status-${idx}`);
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
                    <button type="button" class="chip-remove-btn" onclick="PKGOPS_CorrectiveAction.removeFile(${idx}, ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        this.uploadedFiles = {};
        
        // Map table keys
        switch (this.pkgopsType) {
            case "Code Verification": this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION"; break;
            case "PAPA": this.activeSubChecklistKey = "CHILD_PAPA"; break;
            case "PQI": this.activeSubChecklistKey = "CHILD_PQI_EVALUATION"; break;
            case "Seal Integrity": this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY"; break;
            case "Cream Percentage": this.activeSubChecklistKey = "CHILD_PQI_EVALUATION"; break; // Cream simulated/default
        }

        console.log(`Initializing Corrective Action: Key=${this.activeSubChecklistKey}`);
        await this.loadDeviatedRows();

        // Lock form if user is not authorized Production personnel
        const hasProdRole = typeof PKGOPS_StateMachine !== "undefined" && PKGOPS_StateMachine.isProductionUser;
        if (!hasProdRole && typeof PKGOPS_StateMachine !== "undefined") {
            PKGOPS_StateMachine.lockCorrectiveActionReadOnly(true);
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

    loadDeviatedRows: async function () {
        const container = document.getElementById("corrective-action-form-area");
        if (!container) return;

        container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p>Loading observations...</p></div>`;

        try {
            if (!this.activeSubChecklistKey) {
                container.innerHTML = `<div class="alert alert-info">No active deviation workflow required for this sub-checklist.</div>`;
                return;
            }

            const rows = await PKGOPS_DAL.getSubChecklistRows(this.activeSubChecklistKey, this.currentTourId);
            
            // Filter only rows that have deviations
            if (this.pkgopsType === "Code Verification") {
                this.deviatedRows = rows
                    .filter(r => r.cr3ea_defecttype && r.cr3ea_defecttype !== "None" && r.cr3ea_defecttype !== "Okay")
                    .sort((a, b) => this.parseSampleNum(a) - this.parseSampleNum(b));
            } else if (this.pkgopsType === "PAPA") {
                this.deviatedRows = rows.filter(r => r.cr3ea_defecttype && r.cr3ea_defecttype !== "Overall Summary");
            } else if (this.pkgopsType === "PQI") {
                this.deviatedRows = rows
                    .filter(r => r.cr3ea_sampleresult === "Not Okay")
                    .sort((a, b) => {
                        const numA = this.parseSampleNum(a);
                        const numB = this.parseSampleNum(b);
                        if (numA !== numB) return numA - numB;
                        return (a.cr3ea_samplenumber || "").localeCompare(b.cr3ea_samplenumber || "", undefined, { numeric: true });
                    });
            } else if (this.pkgopsType === "Seal Integrity") {
                this.deviatedRows = rows.filter(r => parseInt(r.cr3ea_noofleakage) > 0);
            } else {
                this.deviatedRows = [];
            }

            if (this.deviatedRows.length === 0) {
                container.innerHTML = `<div class="alert alert-success">No deviations found for this session.</div>`;
                return;
            }

            this.renderDeviationTable(container);
        } catch (error) {
            console.error("Failed to load deviations:", error);
            container.innerHTML = `<div class="alert alert-danger">Error loading deviations list.</div>`;
        }
    },

    renderDeviationTable: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Production Corrective Action Form</h3>
                    <p class="text-danger fw-bold">Defect/Deviation identified by QA. Enter corrective actions and upload proof pictures below.</p>
                </div>
            </div>
            <div class="row mt-2">
                <div class="col-md-12">
                    <table class="table table-bordered text-center align-middle">
                        <thead class="table-danger">
                            <tr>
                                <th>Defect Description</th>
                                <th>QA Observation details</th>
                                <th>Corrective Action Taken</th>
                                <th>Upload Corrective Action Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.deviatedRows.map((row, idx) => {
                                let defectDesc = "";
                                let obsDetails = "";
                                let rowId = "";

                                if (this.pkgopsType === "Code Verification") {
                                    const sampleNo = this.parseSampleNum(row, idx);
                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-start gap-1">
                                            <span class="badge bg-primary" style="font-size: 12px; padding: 4px 8px;">Sample ${sampleNo}</span>
                                            <span class="fw-bold text-danger" style="font-size: 13px;">${row.cr3ea_defecttype || "Code Defect"}</span>
                                        </div>
                                    `;
                                    obsDetails = `Batch: ${row.cr3ea_batchno || "-"} | PKD: ${row.cr3ea_pkd || "-"} | Defect Count: ${row.cr3ea_defectcount || "1"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_codeverificationid || row.cr3ea_prod_rajpura_pkgops_codeverificationid || row.id;
                                } else if (this.pkgopsType === "PAPA") {
                                    defectDesc = row.cr3ea_defecttype || "Appearance Defect";
                                    obsDetails = `Defect Count: ${row.cr3ea_defectcount || "1"} | Percentage: ${row.cr3ea_defectwisepercentage || "1%"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_papaid || row.cr3ea_prod_rajpura_pkgops_papaid || row.id;
                                } else if (this.pkgopsType === "PQI") {
                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-start gap-1">
                                            <span class="badge bg-primary" style="font-size: 12px; padding: 4px 8px;">${row.cr3ea_samplenumber || `Sample ${idx + 1}`}</span>
                                            <span class="fw-bold text-danger" style="font-size: 13px;">${row.cr3ea_evaluationtype} Pack Defect</span>
                                        </div>
                                    `;
                                    obsDetails = `Category: ${row.cr3ea_defectcategory || "-"} | Details: ${row.cr3ea_defectdetail || "-"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_pqi_evaluationid || row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid || row.id;
                                } else if (this.pkgopsType === "Seal Integrity") {
                                    const qty = parseInt(row.cr3ea_samplequantity, 10) || 0;
                                    const leaks = parseInt(row.cr3ea_noofleakage, 10) || 0;
                                    const passPctVal = qty > 0 ? (((Math.max(0, qty - leaks)) / qty) * 100) : 0;
                                    const passPct = passPctVal.toFixed(2) + "%";
                                    const passBadgeClass = passPctVal >= 80 ? "bg-warning text-dark" : "bg-danger";

                                    defectDesc = `
                                        <div class="d-flex flex-column align-items-center justify-content-center gap-1.5 p-1">
                                            <span class="fw-bold text-danger" style="font-size: 13px;">
                                                <i class="fa fa-exclamation-triangle text-danger me-1"></i>Seal Integrity Deviation
                                            </span>
                                            <span class="badge ${passBadgeClass}" style="font-size: 11px; padding: 4px 8px; border-radius: 4px;">
                                                ${passPct} Pass Rate
                                            </span>
                                        </div>
                                    `;
                                    obsDetails = this.formatSealIntegrityObsHtml(row);
                                    rowId = row.cr3ea_rajpura_pkgops_sealintegrityid || row.cr3ea_prod_rajpura_pkgops_sealintegrityid || row.id;
                                }

                                const defectPhotos = Array.from(new Set((row.cr3ea_codepictureurl || row.cr3ea_batchcodepictureurl || "").split(",").map(u => u.trim()).filter(Boolean)));
                                let defectPhotosHtml = "";
                                if (defectPhotos.length > 0) {
                                    defectPhotosHtml = `<div class="mt-1 pkgops-saved-file-links-container">` +
                                        defectPhotos.map((u, pIdx) => `<a href="${u}" target="_blank" class="pkgops-saved-file-link"><i class="fa fa-image"></i> Defect Photo ${defectPhotos.length > 1 ? pIdx + 1 : ''}</a>`).join("") +
                                        `</div>`;
                                }

                                const actionRaw = row.cr3ea_actiontaken || "";
                                const actionRemarksOnly = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[0] || "";
                                const actionProof = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[1] || "";

                                const qaPart = actionRaw.split(" | QA: ")[1] || "";
                                const qaRemarks = qaPart.split(" | Proof: ")[0] || "";
                                const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                let qaReverifyHtml = "";
                                if (qaRemarks || qaProof) {
                                    const qaProofUrls = (qaProof || "").split(",").map(u => u.trim()).filter(Boolean);
                                    const proofBadges = qaProofUrls.map((u, pIdx) => 
                                        `<a href="${u}" target="_blank" class="badge bg-warning text-dark text-decoration-none mt-1 me-1"><i class="fa fa-image"></i> View QA Proof ${qaProofUrls.length > 1 ? pIdx + 1 : ''}</a>`
                                    ).join("");
                                    qaReverifyHtml = `<div class="mt-2 p-1 border border-danger rounded bg-light-danger" style="font-size: 11px; text-align: left; background-color: #fff5f5; color: #c53030; border-color: #feb2b2;">
                                        <strong>QA Reject Remarks:</strong> ${qaRemarks || "None"}${proofBadges ? '<br>' + proofBadges : ''}
                                    </div>`;
                                }

                                let existingProofHtml = "";
                                if (actionProof) {
                                    const existingUrls = actionProof.split(",").map(u => u.trim()).filter(Boolean);
                                    if (existingUrls.length > 0) {
                                        existingProofHtml = `<div class="pkgops-saved-file-links-container mt-1">` +
                                            existingUrls.map((u, pIdx) => `<a href="${u}" target="_blank" class="pkgops-saved-file-link"><i class="fa fa-paperclip"></i> Saved Proof ${existingUrls.length > 1 ? pIdx + 1 : ''}</a>`).join("") +
                                            `</div>`;
                                    }
                                }

                                return `
                                    <tr data-rowid="${rowId}">
                                        <td style="width: 25%;">${defectDesc}</td>
                                        <td style="width: 35%;">
                                            <div>${obsDetails}</div>
                                            ${defectPhotosHtml}
                                            ${qaReverifyHtml}
                                        </td>
                                        <td style="width: 20%;">
                                            <textarea class="form-control action-taken-input" id="act-remarks-${idx}" rows="2" placeholder="Describe actions taken...">${actionRemarksOnly}</textarea>
                                        </td>
                                        <td>
                                            <input type="file" class="form-control action-file-input" id="act-file-${idx}" accept="image/*" multiple onchange="PKGOPS_CorrectiveAction.onFileSelected(this, ${idx})">
                                            <div id="act-file-status-${idx}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;">
                                                ${existingProofHtml}
                                            </div>
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

    submitCorrectiveAction: async function () {
        const hasProdRole = typeof PKGOPS_StateMachine !== "undefined" && PKGOPS_StateMachine.isProductionUser;
        if (!hasProdRole) {
            alert("Access Denied: Only the assigned Production Executive can submit corrective actions.");
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            }
            return;
        }

        const currentTourStatus = PKGOPS_StateMachine.currentSession?.cr3ea_processstatus || PKGOPS_StateMachine.currentSession?.cr3ea_status || "";
        if (currentTourStatus.includes("Pending Re-Verification")) {
            alert("This tour is already in QA Re-Verification stage. Corrective actions cannot be submitted at this time.");
            return;
        }

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            for (let idx = 0; idx < this.deviatedRows.length; idx++) {
                const row = this.deviatedRows[idx];
                const remarksVal = document.getElementById(`act-remarks-${idx}`).value;
                const fileInput = document.getElementById(`act-file-${idx}`);

                if (!remarksVal.trim()) {
                    alert("Please enter corrective actions for all listed deviations.");
                    if (typeof HideLoader === "function") HideLoader();
                    return;
                }

                const actionRaw = row.cr3ea_actiontaken || "";
                const existingActionProof = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[1] || "";

                const files = this.uploadedFiles[idx] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                let proofUrl = "";
                if (files.length > 0) {
                    const sampleNo = this.parseSampleNum(row, idx);
                    const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, `Corrective_${this.pkgopsType}`, `Sample-${sampleNo}`, remarksVal));
                    const urls = await Promise.all(uploadPromises);
                    const validUrls = urls.filter(Boolean);
                    if (existingActionProof) {
                        proofUrl = existingActionProof + ", " + validUrls.join(", ");
                    } else {
                        proofUrl = validUrls.join(", ");
                    }
                } else if (existingActionProof) {
                    proofUrl = existingActionProof;
                }

                let actionValue = remarksVal;
                if (proofUrl) {
                    actionValue += " | Proof: " + proofUrl;
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

                // Update child record
                let updatePayload = {
                    id: childId,
                    cr3ea_actiontaken: actionValue,
                    cr3ea_deviationstatus: "Pending Re-Verification"
                };

                if (this.pkgopsType === "Code Verification" && row.cr3ea_codepictureurl) {
                    updatePayload.cr3ea_codepictureurl = row.cr3ea_codepictureurl;
                } else if (this.pkgopsType === "PQI" && row.cr3ea_batchcodepictureurl) {
                    updatePayload.cr3ea_batchcodepictureurl = row.cr3ea_batchcodepictureurl;
                }

                await PKGOPS_DAL.saveSubChecklistRow(this.activeSubChecklistKey, updatePayload);
            }

            // Transition parent status to Pending Re-Verification
            const tourPayload = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
                cr3ea_rajpura_quality_tourid: this.currentTourId,
                cr3ea_status: "Pending Re-Verification",
                cr3ea_processstatus: "Pending Re-Verification"
            };
            await PKGOPS_DAL.saveTour(tourPayload);

            // Trigger notification
            if (typeof ALC_Notification !== "undefined") {
                const fullSession = {
                    ...PKGOPS_StateMachine.currentSession,
                    ...tourPayload
                };
                await ALC_Notification.sendResubmitRequest(fullSession, false);
            }

            if (typeof HideLoader === "function") HideLoader();
            alert("Corrective Action submitted to QA for Re-verification successfully!");

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
            console.error("Failed to submit corrective action: ", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "submit corrective actions")
                : ("Submission failed: " + (error.message || "Please check connection and files, and try again."));
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
                    <div class="p-2 border rounded" style="border: 1px solid #fed7aa !important; background-color: #fffaf0 !important;">
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
