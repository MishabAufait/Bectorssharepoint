// Re-verification controller for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Re-verification loaded");

const PKGOPS_Reverify = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    reverifyRows: [],

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        
        switch (this.pkgopsType) {
            case "Code Verification": this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION"; break;
            case "PAPA": this.activeSubChecklistKey = "CHILD_PAPA"; break;
            case "PQI": this.activeSubChecklistKey = "CHILD_PQI_EVALUATION"; break;
            case "Seal Integrity": this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY"; break;
        }

        console.log(`Initializing Re-verify: Key=${this.activeSubChecklistKey}`);
        await this.loadReverifyRows();
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
                                let proofUrl = "";
                                let rowId = "";

                                const actionRaw = row.cr3ea_actiontaken || "";
                                const actionTaken = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[0] || "-";
                                const actionProof = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[1] || "";

                                if (this.pkgopsType === "Code Verification") {
                                    defectDesc = row.cr3ea_defecttype || "Code Defect";
                                    proofUrl = row.cr3ea_codepictureurl || actionProof || "";
                                    rowId = row.cr3ea_prod_rajpura_pkgops_codeverificationid;
                                } else if (this.pkgopsType === "PAPA") {
                                    defectDesc = row.cr3ea_defecttype || "Appearance Defect";
                                    proofUrl = actionProof || "";
                                    rowId = row.cr3ea_prod_rajpura_pkgops_papaid;
                                } else if (this.pkgopsType === "PQI") {
                                    defectDesc = `${row.cr3ea_evaluationtype} Pack Defect (${row.cr3ea_samplenumber})`;
                                    proofUrl = row.cr3ea_batchcodepictureurl || actionProof || "";
                                    rowId = row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid;
                                } else if (this.pkgopsType === "Seal Integrity") {
                                    defectDesc = "Leakage Defect";
                                    proofUrl = actionProof || "";
                                    rowId = row.cr3ea_prod_rajpura_pkgops_sealintegrityid;
                                }

                                const proofLink = proofUrl
                                    ? `<a href="${proofUrl}" target="_blank" class="btn btn-sm btn-outline-info">View Attachment</a>`
                                    : `<span class="text-secondary" style="font-style: italic; font-size: 12px;">No proof uploaded</span>`;

                                return `
                                    <tr data-rowid="${rowId}">
                                        <td><strong>${defectDesc}</strong></td>
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
                                            <input type="file" class="form-control" id="rev-file-${idx}" accept="image/*">
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
                let proofUrl = "";
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    proofUrl = await PKGOPS_DAL.uploadAttachmentFile(fileInput.files[0], this.currentTourId, `Reverify_${this.pkgopsType}`, `REV-${idx}`, remarksVal);
                    if (proofUrl) {
                        finalRemarks = finalRemarks ? `${finalRemarks} | Proof: ${proofUrl}` : `Proof: ${proofUrl}`;
                    }
                }

                // Update child record deviation status
                let updatePayload = {
                    cr3ea_deviationstatus: statusVal === "Pass" ? "Closed" : "Failed - Pending Production",
                    cr3ea_actiontaken: (row.cr3ea_actiontaken || "") + " | QA: " + (finalRemarks || "None")
                };

                if (this.pkgopsType === "Code Verification") {
                    updatePayload.cr3ea_prod_rajpura_pkgops_codeverificationid = row.cr3ea_prod_rajpura_pkgops_codeverificationid;
                } else if (this.pkgopsType === "PAPA") {
                    updatePayload.cr3ea_prod_rajpura_pkgops_papaid = row.cr3ea_prod_rajpura_pkgops_papaid;
                } else if (this.pkgopsType === "PQI") {
                    updatePayload.cr3ea_prod_rajpura_pkgops_pqi_evaluationid = row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid;
                } else if (this.pkgopsType === "Seal Integrity") {
                    updatePayload.cr3ea_prod_rajpura_pkgops_sealintegrityid = row.cr3ea_prod_rajpura_pkgops_sealintegrityid;
                }

                await PKGOPS_DAL.saveSubChecklistRow(this.activeSubChecklistKey, updatePayload);
            }

            // Transition parent status based on re-verify outcome
            const tourPayload = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
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
            alert(overallPass ? "Re-verification succeeded. Quality Tour closed successfully!" : "Re-verification failed. Tour returned to Production HOD.");
            window.location.reload();
        } catch (error) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to submit re-verification: ", error);
            alert("Submission failed. Please check connection and try again.");
        }
    }
};
