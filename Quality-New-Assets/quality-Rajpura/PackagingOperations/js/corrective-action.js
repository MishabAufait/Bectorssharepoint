// Production Corrective Action controller for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Corrective Action loaded");

const PKGOPS_CorrectiveAction = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    deviatedRows: [],

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        
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
                this.deviatedRows = rows.filter(r => r.cr3ea_defecttype && r.cr3ea_defecttype !== "None" && r.cr3ea_defecttype !== "Okay");
            } else if (this.pkgopsType === "PAPA") {
                this.deviatedRows = rows.filter(r => r.cr3ea_defecttype && r.cr3ea_defecttype !== "Overall Summary");
            } else if (this.pkgopsType === "PQI") {
                this.deviatedRows = rows.filter(r => r.cr3ea_sampleresult === "Not Okay");
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
                                    defectDesc = row.cr3ea_defecttype || "Code Defect";
                                    obsDetails = `Batch: ${row.cr3ea_batchno || "-"} | PKD: ${row.cr3ea_pkd || "-"} | Defect Count: ${row.cr3ea_defectcount || "1"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_codeverificationid || row.cr3ea_prod_rajpura_pkgops_codeverificationid || row.id;
                                } else if (this.pkgopsType === "PAPA") {
                                    defectDesc = row.cr3ea_defecttype || "Appearance Defect";
                                    obsDetails = `Defect Count: ${row.cr3ea_defectcount || "1"} | Percentage: ${row.cr3ea_defectwisepercentage || "1%"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_papaid || row.cr3ea_prod_rajpura_pkgops_papaid || row.id;
                                } else if (this.pkgopsType === "PQI") {
                                    defectDesc = `${row.cr3ea_evaluationtype} Pack Defect`;
                                    obsDetails = `${row.cr3ea_samplenumber} - Category: ${row.cr3ea_defectcategory || "-"} | Details: ${row.cr3ea_defectdetail || "-"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_pqi_evaluationid || row.cr3ea_prod_rajpura_pkgops_pqi_evaluationid || row.id;
                                } else if (this.pkgopsType === "Seal Integrity") {
                                    defectDesc = "Leakage Detected";
                                    obsDetails = `Leakages: ${row.cr3ea_noofleakage || "1"} | Type: ${row.cr3ea_leakagetype || "-"}`;
                                    rowId = row.cr3ea_rajpura_pkgops_sealintegrityid || row.cr3ea_prod_rajpura_pkgops_sealintegrityid || row.id;
                                }

                                const actionRaw = row.cr3ea_actiontaken || "";
                                const actionRemarksOnly = actionRaw.split(" | QA: ")[0].split(" | Proof: ")[0] || "";

                                const qaPart = actionRaw.split(" | QA: ")[1] || "";
                                const qaRemarks = qaPart.split(" | Proof: ")[0] || "";
                                const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                let qaReverifyHtml = "";
                                if (qaRemarks || qaProof) {
                                    const proofBadge = qaProof 
                                        ? `<br><a href="${qaProof}" target="_blank" class="badge bg-warning text-dark text-decoration-none mt-1"><i class="fa fa-image"></i> View QA Proof</a>` 
                                        : "";
                                    qaReverifyHtml = `<div class="mt-2 p-1 border border-danger rounded bg-light-danger" style="font-size: 11px; text-align: left; background-color: #fff5f5; color: #c53030; border-color: #feb2b2;">
                                        <strong>QA Reject Remarks:</strong> ${qaRemarks || "None"}${proofBadge}
                                    </div>`;
                                }

                                return `
                                    <tr data-rowid="${rowId}">
                                        <td><strong>${defectDesc}</strong></td>
                                        <td>
                                            <div>${obsDetails}</div>
                                            ${qaReverifyHtml}
                                        </td>
                                        <td>
                                            <textarea class="form-control action-taken-input" id="act-remarks-${idx}" rows="2" placeholder="Describe actions taken...">${actionRemarksOnly}</textarea>
                                        </td>
                                        <td>
                                            <input type="file" class="form-control action-file-input" id="act-file-${idx}" accept="image/*">
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

                let proofUrl = "";
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    proofUrl = await PKGOPS_DAL.uploadAttachmentFile(fileInput.files[0], this.currentTourId, `Corrective_${this.pkgopsType}`, `CA-${idx}`, remarksVal);
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

                if (this.pkgopsType === "Code Verification" && (proofUrl || row.cr3ea_codepictureurl)) {
                    updatePayload.cr3ea_codepictureurl = proofUrl || row.cr3ea_codepictureurl;
                } else if (this.pkgopsType === "PQI" && (proofUrl || row.cr3ea_batchcodepictureurl)) {
                    updatePayload.cr3ea_batchcodepictureurl = proofUrl || row.cr3ea_batchcodepictureurl;
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
    }
};
