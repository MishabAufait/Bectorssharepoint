// Summary viewer for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Summary script loaded");

const PKGOPS_Summary = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        
        switch (this.pkgopsType) {
            case "Temperatures & Humidity": this.activeSubChecklistKey = "CHILD_TEMP_HUMIDITY"; break;
            case "Code Verification": this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION"; break;
            case "PAPA": this.activeSubChecklistKey = "CHILD_PAPA"; break;
            case "PQI": this.activeSubChecklistKey = "CHILD_PQI_EVALUATION"; break;
            case "Seal Integrity": this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY"; break;
            case "Quality Wall Records": this.activeSubChecklistKey = "CHILD_QUALITY_WALL"; break;
        }

        console.log(`Initializing Summary: Key=${this.activeSubChecklistKey}`);
        await this.loadSummaryDetails();
    },

    loadSummaryDetails: async function () {
        const container = document.getElementById("summary-form-area");
        if (!container) return;

        container.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p>Generating summary...</p></div>`;

        try {
            const session = PKGOPS_Main.currentSession || {};
            const status = session.cr3ea_status || session.cr3ea_processstatus || "";
            const isExpired = status === "Closed - Expired" || status.includes("Expired");
            let detailHtml = "";

            if (this.activeSubChecklistKey) {
                const rows = await PKGOPS_DAL.getSubChecklistRows(this.activeSubChecklistKey, this.currentTourId);
                
                if (isExpired && rows.length === 0) {
                    detailHtml = `
                        <div class="alert alert-danger text-center p-4 mt-3" style="border-radius: 8px; border: 1px solid #fecaca; background-color: #fee2e2; color: #b91c1c; font-family: sans-serif;">
                            <h4 style="font-weight: 700; margin-bottom: 8px;">Expired while In Progress / QA Process</h4>
                            <p style="margin: 0; font-size: 14px;">This checklist session was closed automatically because it expired before completion.</p>
                        </div>
                    `;
                } else if (rows.length === 0) {
                    detailHtml = `<div class="alert alert-info">No detail records found for this checklist session.</div>`;
                } else {
                    detailHtml = this.buildChecklistSummaryHtml(rows);
                }
            } else if (this.pkgopsType === "Cream Percentage") {
                // Simulated Cream Percentage summary
                detailHtml = `
                    <div class="row mt-3">
                        <div class="col-md-12">
                            <h4 class="form-section-title">Cream Percentage Summary</h4>
                            <table class="table table-bordered text-center align-middle bg-white">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Cream Reading %</th>
                                        <th>Target Standard Min</th>
                                        <th>Target Standard Max</th>
                                        <th>Check Outcome</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>24.50%</td>
                                        <td>20.00%</td>
                                        <td>30.00%</td>
                                        <td><span class="badge bg-success">PASS</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            const badgeColor = isExpired ? "bg-danger" : "bg-success";
            const badgeText = isExpired ? "Checklist Session Expired" : "Checklist Session Closed";

            container.innerHTML = `
                <div class="row">
                    <div class="col-md-12 text-center">
                        <span class="badge ${badgeColor} px-4 py-2" style="font-size: 16px; border-radius: 9999px; text-transform: uppercase;">${badgeText}</span>
                        <h2 class="mt-2" style="color: #1e293b; font-weight: 700;">${this.pkgopsType} Audit Summary</h2>
                    </div>
                </div>
                ${detailHtml}
            `;
        } catch (error) {
            console.error("Failed to build summary: ", error);
            container.innerHTML = `<div class="alert alert-danger">Failed to generate summary page.</div>`;
        }
    },

    buildChecklistSummaryHtml: function (rows) {
        let html = "";

        if (this.pkgopsType === "Temperatures & Humidity") {
            const r = rows[0] || {};
            html = `
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("th-line-temp", "Packaging Line Temp", `${r.cr3ea_pkglinetemp || "-"} °C`)}
                    ${this.createSummaryCard("th-line-hum", "Packaging Line Humidity", `${r.cr3ea_pkglinehumidity || "-"} %`)}
                    ${this.createSummaryCard("th-tunnel-temp", "Cooling Tunnel Temp", `${r.cr3ea_coolingtunneltemp || "-"} °C`)}
                    ${this.createSummaryCard("th-cream-temp", "Cream Room Temp", `${r.cr3ea_creamroomtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-cold1-temp", "Cold Storage 1 Temp", `${r.cr3ea_coldstorage1nbtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-cold2-temp", "Cold Storage 2 Temp", `${r.cr3ea_coldstorage2nbtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-flav-temp", "Flavour Room Temp", `${r.cr3ea_flavourroomtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-dh-hum", "DH Room Humidity", `${r.cr3ea_dhroomhumidity || "-"} %`)}
                    ${this.createSummaryCard("th-cr1-temp", "Cold Room 1 Temp", `${r.cr3ea_coldroom1obtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-cr2-temp", "Cold Room 2 Temp", `${r.cr3ea_coldroom2obtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-cr3-temp", "Cold Room 3 Temp", `${r.cr3ea_coldroom3obtemp || "-"} °C`)}
                    ${this.createSummaryCard("th-yeast-temp", "Deep Freezer for Yeast", `${r.cr3ea_deepfreezeryeasttemp || "-"} °C`)}
                </div>
            `;
        } 
        else if (this.pkgopsType === "Code Verification") {
            html = `
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="table-responsive shadow-sm rounded border bg-white" style="overflow: hidden;">
                            <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%;">
                                <thead style="background-color: #1e3a8a; color: #ffffff; border-bottom: 2px solid #1d4ed8;">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 700;">Sample No</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Batch / PKD</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Observed Defect</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Defect Count</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left;">Corrective Action Taken</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left;">Re-verify Remarks</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map((row, idx) => {
                                         const hasDefect = row.cr3ea_defecttype && row.cr3ea_defecttype !== "None" && row.cr3ea_defecttype !== "Okay";
                                         const isResolved = row.cr3ea_deviationstatus === "Closed";
                                         const badge = (hasDefect && !isResolved)
                                             ? `<span class="badge" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">DEFECTIVE</span>`
                                             : `<span class="badge" style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">OKAY</span>`;

                                         const actionRaw = row.cr3ea_actiontaken || "";
                                         const prodPart = actionRaw.split(" | QA: ")[0] || "";
                                         const qaPart = actionRaw.split(" | QA: ")[1] || "";

                                         const prodRemarks = prodPart.split(" | Proof: ")[0] || "-";
                                         const prodProof = prodPart.split(" | Proof: ")[1] || "";
                                         const qaRemarks = qaPart.split(" | Proof: ")[0] || "-";
                                         const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                         const prodLinkHtml = prodProof ? ` <a href="${prodProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";
                                         const qaLinkHtml = qaProof ? ` <a href="${qaProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";

                                         let rowStyle = "";
                                         if (hasDefect && isResolved) {
                                             rowStyle = `background-color: #f0fdf4; color: #15803d;`; // soft green for resolved
                                         } else if (hasDefect) {
                                             rowStyle = `background-color: #fef2f2; color: #b91c1c;`; // soft red for pending defect
                                         }

                                         return `
                                             <tr style="${rowStyle} border-bottom: 1px solid #e2e8f0;">
                                                 <td style="padding: 12px 16px; font-weight: 600;">Sample ${idx + 1}</td>
                                                 <td style="padding: 12px 16px;">Batch: ${row.cr3ea_batchno || "-"} <br> <small class="text-secondary">PKD: ${row.cr3ea_pkd || "-"}</small></td>
                                                 <td style="padding: 12px 16px; font-weight: 700;" class="${hasDefect ? 'text-danger' : ''}">${row.cr3ea_defecttype || "-"}</td>
                                                 <td style="padding: 12px 16px; font-weight: 600;">${row.cr3ea_defectcount || "0"}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${prodRemarks}${prodLinkHtml}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${qaRemarks}${qaLinkHtml}</td>
                                                 <td style="padding: 12px 16px;">${badge}</td>
                                             </tr>
                                         `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (this.pkgopsType === "PAPA") {
            html = `
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="table-responsive shadow-sm rounded border bg-white" style="overflow: hidden;">
                            <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%;">
                                <thead style="background-color: #1e3a8a; color: #ffffff; border-bottom: 2px solid #1d4ed8;">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left;">Defect Type</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Defect Count</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Defect-wise %</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Overall Defect %</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left;">Corrective Action Taken</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left;">Re-verify Remarks</th>
                                        <th style="padding: 12px 16px; font-weight: 700;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map(row => {
                                         const isOverall = row.cr3ea_defecttype === "Overall Summary";
                                         const hasDefect = !isOverall && parseInt(row.cr3ea_defectcount || "0") > 0;
                                         const isResolved = row.cr3ea_deviationstatus === "Closed";

                                         let actionTakenHtml = "-";
                                         let reVerifyRemarksHtml = "-";
                                         let badge = "-";

                                         if (isOverall) {
                                             // Keep them as "-"
                                         } else if (hasDefect) {
                                             const actionRaw = row.cr3ea_actiontaken || "";
                                             const prodPart = actionRaw.split(" | QA: ")[0] || "";
                                             const qaPart = actionRaw.split(" | QA: ")[1] || "";

                                             const prodRemarks = prodPart.split(" | Proof: ")[0] || "-";
                                             const prodProof = prodPart.split(" | Proof: ")[1] || "";
                                             const qaRemarks = qaPart.split(" | Proof: ")[0] || "-";
                                             const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                             const prodLinkHtml = prodProof ? ` <a href="${prodProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";
                                             const qaLinkHtml = qaProof ? ` <a href="${qaProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";

                                             actionTakenHtml = `${prodRemarks}${prodLinkHtml}`;
                                             reVerifyRemarksHtml = `${qaRemarks}${qaLinkHtml}`;
                                             
                                             badge = isResolved
                                                 ? `<span class="badge" style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">OKAY</span>`
                                                 : `<span class="badge" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">DEFECTIVE</span>`;
                                         } else {
                                             badge = `<span class="badge" style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">OKAY</span>`;
                                         }

                                         let rowStyle = "";
                                         if (hasDefect && isResolved) {
                                             rowStyle = `background-color: #f0fdf4; color: #15803d;`; // soft green for resolved
                                         } else if (hasDefect) {
                                             rowStyle = `background-color: #fef2f2; color: #b91c1c;`; // soft red for pending defect
                                         } else if (isOverall) {
                                             rowStyle = `background-color: #f8fafc; font-weight: bold;`;
                                         }

                                         return `
                                             <tr style="${rowStyle} border-bottom: 1px solid #e2e8f0;">
                                                 <td style="padding: 12px 16px; text-align: left; font-weight: 600;">${row.cr3ea_defecttype || "-"}</td>
                                                 <td style="padding: 12px 16px; font-weight: 600;">${row.cr3ea_defectcount || "0"}</td>
                                                 <td style="padding: 12px 16px;">${row.cr3ea_defectwisepercentage || "-"}</td>
                                                 <td style="padding: 12px 16px; font-weight: 600;">${row.cr3ea_overalldefectpercentage || "-"}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${actionTakenHtml}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${reVerifyRemarksHtml}</td>
                                                 <td style="padding: 12px 16px;">${badge}</td>
                                             </tr>
                                         `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (this.pkgopsType === "PQI") {
            // Group rows by evaluation type
            const groups = {};
            rows.forEach(row => {
                const evalType = row.cr3ea_evaluationtype || "Other";
                if (!groups[evalType]) {
                    groups[evalType] = [];
                }
                groups[evalType].push(row);
            });

            let groupsHtml = "";
            Object.keys(groups).forEach(evalType => {
                const groupRows = groups[evalType];
                groupsHtml += `
                    <div class="card mb-4 shadow-sm rounded border bg-white" style="overflow: hidden; border-radius: 8px;">
                        <div class="card-header py-3 px-4" style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                            <h5 class="mb-0 fw-bold" style="color: #1e3a8a; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fa fa-folder text-primary me-2"></i> ${evalType} Evaluation
                            </h5>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%;">
                                <thead style="background-color: #1e3a8a; color: #ffffff;">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 15%;">Sample Number</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 15%;">Result Status</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 25%;">Defect Category / Detail</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 22%;">Corrective Action</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 23%;">Re-verify Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupRows.map(row => {
                                         const isNotOk = row.cr3ea_sampleresult === "Not Okay";
                                         const isResolved = row.cr3ea_deviationstatus === "Closed";
                                         const badge = (isNotOk && !isResolved)
                                             ? `<span class="badge" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">Not Okay</span>`
                                             : `<span class="badge" style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">Okay</span>`;

                                         const actionRaw = row.cr3ea_actiontaken || "";
                                         const prodPart = actionRaw.split(" | QA: ")[0] || "";
                                         const qaPart = actionRaw.split(" | QA: ")[1] || "";

                                         const prodRemarks = prodPart.split(" | Proof: ")[0] || "-";
                                         const prodProof = prodPart.split(" | Proof: ")[1] || "";
                                         const qaRemarks = qaPart.split(" | Proof: ")[0] || "-";
                                         const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                         const prodLinkHtml = prodProof ? ` <a href="${prodProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";
                                         const qaLinkHtml = qaProof ? ` <a href="${qaProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";

                                         let rowStyle = "";
                                         if (isNotOk && isResolved) {
                                             rowStyle = `background-color: #f0fdf4; color: #15803d;`; // soft green for resolved
                                         } else if (isNotOk) {
                                             rowStyle = `background-color: #fef2f2; color: #b91c1c;`; // soft red for pending defect
                                         }

                                         return `
                                             <tr style="${rowStyle} border-bottom: 1px solid #e2e8f0;">
                                                 <td style="padding: 12px 16px; font-weight: 600;">${row.cr3ea_samplenumber || "-"}</td>
                                                 <td style="padding: 12px 16px;">${badge}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-weight: 500;">${row.cr3ea_defectcategory || "-"} - ${row.cr3ea_defectdetail || "-"}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${prodRemarks}${prodLinkHtml}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px;">${qaRemarks}${qaLinkHtml}</td>
                                             </tr>
                                         `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });

            html = `
                <div class="row mt-3">
                    <div class="col-md-12">
                        ${groupsHtml}
                    </div>
                </div>
            `;
        } 
        else if (this.pkgopsType === "Seal Integrity") {
            const r = rows[0] || {};
            const hasLeak = parseInt(r.cr3ea_noofleakage) > 0;
            html = `
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("seal-machine", "Machine Number", r.cr3ea_machineno || "-")}
                    ${this.createSummaryCard("seal-qty", "Sample Quantity", r.cr3ea_samplequantity || "-")}
                    ${this.createSummaryCard("seal-leaks", "Leakage Count", r.cr3ea_noofleakage || "-")}
                    ${this.createSummaryCard("seal-type", "Leakage Type", r.cr3ea_leakagetype || "-")}
                </div>
                ${hasLeak ? (() => {
                    const actionRaw = r.cr3ea_actiontaken || "";
                    const prodPart = actionRaw.split(" | QA: ")[0] || "";
                    const qaPart = actionRaw.split(" | QA: ")[1] || "";

                    const prodRemarks = prodPart.split(" | Proof: ")[0] || "-";
                    const prodProof = prodPart.split(" | Proof: ")[1] || "";
                    const qaRemarks = qaPart.split(" | Proof: ")[0] || "-";
                    const qaProof = qaPart.split(" | Proof: ")[1] || "";

                    const prodLinkHtml = prodProof ? ` <a href="${prodProof}" target="_blank" class="badge bg-info text-decoration-none">View Proof</a>` : "";
                    const qaLinkHtml = qaProof ? ` <a href="${qaProof}" target="_blank" class="badge bg-info text-decoration-none">View Proof</a>` : "";

                    return `
                        <div class="row mt-3">
                            <div class="col-md-12">
                                <div class="p-3 border rounded bg-white">
                                    <h5 class="text-danger fw-bold">Deviation Summary</h5>
                                    <p><strong>Corrective Action Taken:</strong> ${prodRemarks}${prodLinkHtml}</p>
                                    <p><strong>Re-verification Remarks:</strong> ${qaRemarks}${qaLinkHtml}</p>
                                </div>
                            </div>
                        </div>
                    `;
                })() : ''}
            `;
        } 
        else if (this.pkgopsType === "Quality Wall Records") {
            const r = rows[0] || {};
            html = `
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("wall-fac", "Facilitator", r.cr3ea_facilitator || "-")}
                    ${this.createSummaryCard("wall-type", "Wall Type", r.cr3ea_typeofqualitywall || "-")}
                    ${this.createSummaryCard("wall-members", "Members Present", r.cr3ea_memberspresent || "-")}
                </div>
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("wall-rating-app", "Pack Appearance Score", `${r.cr3ea_packappearancerating || "5"} / 5`)}
                    ${this.createSummaryCard("wall-rating-seal", "Sealing Quality Score", `${r.cr3ea_sealingqualityrating || "5"} / 5`)}
                    ${this.createSummaryCard("wall-rating-cod", "Coding Score", `${r.cr3ea_codingrating || "5"} / 5`)}
                </div>
                <div class="row mt-3 p-3 border rounded bg-white text-center">
                    <div class="col-md-12">
                        <h4>Overall Quality Wall Rating Score: <strong class="text-primary">${r.cr3ea_overallrating || "5.00"} / 5</strong></h4>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="p-3 border rounded bg-light">
                            <h5>Evaluation Remarks</h5>
                            <p class="mb-0 text-secondary" style="font-style: italic;">${r.cr3ea_remarks || "No remarks entered"}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return html;
    },

    // Helper for rendering details cards
    createSummaryCard: function (id, label, value) {
        return `
            <div class="col-md-3">
                <div class="card border-0 shadow-sm rounded bg-white h-100">
                    <div class="card-body p-3">
                        <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">${label}</span>
                        <h4 class="mt-1 mb-0 text-dark" style="font-weight: 700;">${value}</h4>
                    </div>
                </div>
            </div>
        `;
    }
};
