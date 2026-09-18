// Summary viewer for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Summary script loaded");

const PKGOPS_Summary = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    pendingMessage: "",

    formatPercentage: function (val) {
        if (val === null || val === undefined || val === "" || val === "-") return "-";
        const clean = String(val).replace("%", "").trim();
        const num = parseFloat(clean);
        if (isNaN(num)) return val;
        return `${num.toFixed(2)}%`;
    },

    formatNumber2Dec: function (val) {
        if (val === null || val === undefined || val === "" || val === "-") return "-";
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        return num.toFixed(2);
    },

    init: async function (tourId, pkgopsType, pendingMessage) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        this.pendingMessage = pendingMessage || "";
        
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
                    detailHtml = await this.buildChecklistSummaryHtml(rows);
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

            let badgeColor = isExpired ? "bg-danger" : "bg-success";
            let badgeText = isExpired ? "Checklist Session Expired" : "Checklist Session Closed";

            let pendingBannerHtml = "";
            if (this.pendingMessage) {
                badgeColor = "bg-warning text-dark";
                badgeText = status || "In Progress";
                pendingBannerHtml = `
                    <div class="alert alert-warning text-center fw-bold mt-3 mb-3" style="font-size: 15px; border-radius: 8px; border: 1px solid #fde68a; background-color: #fef3c7; color: #92400e;">
                        <i class="fa fa-clock-o me-2"></i> ${this.pendingMessage}
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="row">
                    <div class="col-md-12 text-center">
                        <span class="badge ${badgeColor} px-4 py-2" style="font-size: 16px; border-radius: 9999px; text-transform: uppercase;">${badgeText}</span>
                        <h2 class="mt-2" style="color: #1e293b; font-weight: 700;">${this.pkgopsType} Audit Summary</h2>
                    </div>
                </div>
                ${pendingBannerHtml}
                ${detailHtml}
            `;
        } catch (error) {
            console.error("Failed to build summary: ", error);
            container.innerHTML = `<div class="alert alert-danger">Failed to generate summary page.</div>`;
        }
    },

    buildChecklistSummaryHtml: async function (rows) {
        let html = "";

        if (this.pkgopsType === "Temperatures & Humidity") {
            const r = rows[0] || {};
            html = `
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("th-line-temp", "Packaging Line Temp", `${r.cr3ea_pkglinetemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-line-hum", "Packaging Line Humidity", `${r.cr3ea_pkglinehumidity || "-"} %`)}
                    ${this.createSummaryCard("th-tunnel-temp", "Cooling Tunnel Temp", `${r.cr3ea_coolingtunneltemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-cream-temp", "Cream Room Temp", `${r.cr3ea_creamroomtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-cold1-temp", "Cold Storage 1 Temp", `${r.cr3ea_coldstorage1nbtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-cold2-temp", "Cold Storage 2 Temp", `${r.cr3ea_coldstorage2nbtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-flav-temp", "Flavour Room Temp", `${r.cr3ea_flavourroomtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-dh-hum", "DH Room Humidity", `${r.cr3ea_dhroomhumidity || "-"} %`)}
                    ${this.createSummaryCard("th-cr1-temp", "Cold Room 1 Temp", `${r.cr3ea_coldroom1obtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-cr2-temp", "Cold Room 2 Temp", `${r.cr3ea_coldroom2obtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-cr3-temp", "Cold Room 3 Temp", `${r.cr3ea_coldroom3obtemp || "-"} &deg;C`)}
                    ${this.createSummaryCard("th-yeast-temp", "Deep Freezer for Yeast", `${r.cr3ea_deepfreezeryeasttemp || "-"} &deg;C`)}
                </div>
            `;
        } 
        else if (this.pkgopsType === "Code Verification") {
            html = `
                <div class="row mt-3">
                    <div class="col-md-12">
                        <div class="table-responsive shadow-sm rounded border bg-white" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
                            <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%; min-width: 900px; table-layout: fixed;">
                                <thead style="background-color: #1e3a8a; color: #ffffff; border-bottom: 2px solid #1d4ed8;">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 10%;">Sample No</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 14%;">Batch / PKD</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 14%;">Observed Defect</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 9%;">Defect Count</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 23%;">Corrective Action Taken</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 22%;">Re-verify Remarks</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 8%;">Status</th>
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
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${prodRemarks}${prodLinkHtml}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${qaRemarks}${qaLinkHtml}</td>
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
            const firstRow = rows.find(r => r.cr3ea_defecttype === "Overall Summary") || rows[0] || {};
            const productName = firstRow.cr3ea_productname || "-";
            const sku = firstRow.cr3ea_sku || "-";
            const sampleSize = parseInt(firstRow.cr3ea_noofsamples || "100") || 100;

            // Separate overall summary row from actual defect rows
            const overallRow = rows.find(r => r.cr3ea_defecttype === "Overall Summary");
            const defectRows = rows.filter(r => r.cr3ea_defecttype && r.cr3ea_defecttype !== "Overall Summary");

            // Calculate totals
            let totalDefectCount = defectRows.reduce((sum, r) => sum + (parseInt(r.cr3ea_defectcount) || 0), 0);
            if (totalDefectCount === 0 && overallRow && parseInt(overallRow.cr3ea_defectcount) > 0) {
                totalDefectCount = parseInt(overallRow.cr3ea_defectcount);
            }
            const overallDefectPct = ((totalDefectCount / sampleSize) * 100).toFixed(2);
            const conformingCount = Math.max(0, sampleSize - totalDefectCount);
            const conformancePct = ((conformingCount / sampleSize) * 100).toFixed(2);

            // Classification & Severity counts
            let catACount = 0;
            let catBCount = 0;
            let catCCount = 0;
            let prodDefectCount = 0;
            let packDefectCount = 0;

            defectRows.forEach(r => {
                const count = parseInt(r.cr3ea_defectcount) || 0;
                const dType = r.cr3ea_defecttype || "";
                if (dType.includes("(A -") || dType.includes("(A)")) catACount += count;
                else if (dType.includes("(B -") || dType.includes("(B)")) catBCount += count;
                else if (dType.includes("(C -") || dType.includes("(C)")) catCCount += count;

                if (dType.includes("- Product")) prodDefectCount += count;
                else if (dType.includes("- Pack")) packDefectCount += count;
            });

            // Helper to parse defect display
            const parseDefectInfo = (rawStr) => {
                if (!rawStr) return { name: "-", badge: "" };
                const match = rawStr.match(/^(.*?)\s*\(([A-C])\s*-\s*(Product|Pack)\)$/i);
                if (match) {
                    const name = match[1].trim();
                    const cat = match[2].toUpperCase();
                    const scope = match[3];
                    let badgeClass = "bg-danger";
                    let catLabel = "Critical";
                    if (cat === "B") { badgeClass = "bg-warning text-dark"; catLabel = "Major"; }
                    else if (cat === "C") { badgeClass = "bg-secondary"; catLabel = "Minor"; }
                    return {
                        name: name,
                        badge: `<span class="badge ${badgeClass} ms-1" style="font-size: 11px; padding: 3px 6px;">Cat ${cat} (${scope} - ${catLabel})</span>`
                    };
                }
                return { name: rawStr, badge: "" };
            };

            html = `
                <!-- Executive KPI Cards -->
                <div class="row mt-3 g-3">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Audited Product</span>
                                <h5 class="mt-1 mb-0 text-dark fw-bold text-truncate" title="${productName}">${productName}</h5>
                                <small class="text-muted">SKU: <strong>${sku}</strong></small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Total Samples Audited</span>
                                <h4 class="mt-1 mb-0 text-dark fw-bold">${sampleSize} <span style="font-size: 13px; font-weight: 500; color: #64748b;">Units</span></h4>
                                <small class="text-muted">PAPA Sample Base</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Conformance Rate</span>
                                <h4 class="mt-1 mb-0 text-success fw-bold">${conformancePct}%</h4>
                                <small class="text-success fw-semibold">${conformingCount} / ${sampleSize} Units Pass</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Overall Defect Rate</span>
                                <h4 class="mt-1 mb-0 ${totalDefectCount > 0 ? 'text-danger' : 'text-success'} fw-bold">${overallDefectPct}%</h4>
                                <small class="${totalDefectCount > 0 ? 'text-danger' : 'text-success'} fw-semibold">${totalDefectCount} Total Defect Units</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Severity & Classification Cards -->
                <div class="row mt-3 g-3">
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Category A (Critical)</span>
                                <h4 class="mt-1 mb-0 ${catACount > 0 ? 'text-danger' : 'text-dark'} fw-bold">${catACount} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${((catACount/sampleSize)*100).toFixed(2)}%)</span></h4>
                                <small class="${catACount > 0 ? 'text-danger fw-semibold' : 'text-muted'}">${catACount > 0 ? 'Critical Deviations' : 'Zero Critical Defects'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Category B (Major)</span>
                                <h4 class="mt-1 mb-0 ${catBCount > 0 ? 'text-warning text-dark' : 'text-dark'} fw-bold">${catBCount} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${((catBCount/sampleSize)*100).toFixed(2)}%)</span></h4>
                                <small class="${catBCount > 0 ? 'text-warning text-dark fw-semibold' : 'text-muted'}">${catBCount > 0 ? 'Major Deviations' : 'Zero Major Defects'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Category C (Minor)</span>
                                <h4 class="mt-1 mb-0 ${catCCount > 0 ? 'text-secondary' : 'text-dark'} fw-bold">${catCCount} <span style="font-size: 13px; font-weight: 500; color: #64748b;">(${((catCCount/sampleSize)*100).toFixed(2)}%)</span></h4>
                                <small class="text-muted">${catCCount > 0 ? 'Minor Deviations' : 'Zero Minor Defects'}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm rounded bg-white h-100">
                            <div class="card-body p-3">
                                <span class="text-secondary font-weight-bold" style="font-size: 11px; text-transform: uppercase;">Defect Domain Scope</span>
                                <h5 class="mt-1 mb-0 text-dark fw-bold">Product: ${prodDefectCount} | Pack: ${packDefectCount}</h5>
                                <small class="text-muted">Observed Distribution</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Observations & Corrective Actions -->
                ${defectRows.length > 0 ? `
                    <div class="row mt-4">
                        <div class="col-md-12">
                            <div class="card border-0 shadow-sm rounded bg-white" style="overflow: hidden; border-radius: 8px;">
                                <div class="card-header py-3 px-4 bg-white border-bottom d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0 fw-bold" style="color: #1e3a8a; font-size: 15px;">
                                        <i class="fa fa-list-ul text-primary me-2"></i> Observed Defect Details & Resolution
                                    </h5>
                                    <span class="badge bg-secondary">${defectRows.length} Defect Type(s) Observed</span>
                                </div>
                                <div class="table-responsive" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
                                    <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%; min-width: 900px; table-layout: fixed;">
                                        <thead style="background-color: #1e3a8a; color: #ffffff;">
                                            <tr>
                                                <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 26%;">Defect Observation</th>
                                                <th style="padding: 12px 16px; font-weight: 700; width: 10%;">Defect Count</th>
                                                <th style="padding: 12px 16px; font-weight: 700; width: 11%;">Defect %</th>
                                                <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 22%;">Corrective Action Taken</th>
                                                <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 21%;">Re-verify Remarks</th>
                                                <th style="padding: 12px 16px; font-weight: 700; width: 10%;">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${defectRows.map(row => {
                                                const defectInfo = parseDefectInfo(row.cr3ea_defecttype);
                                                const isResolved = row.cr3ea_deviationstatus === "Closed";

                                                const actionRaw = row.cr3ea_actiontaken || "";
                                                const prodPart = actionRaw.split(" | QA: ")[0] || "";
                                                const qaPart = actionRaw.split(" | QA: ")[1] || "";

                                                const prodRemarks = prodPart.split(" | Proof: ")[0] || "-";
                                                const prodProof = prodPart.split(" | Proof: ")[1] || "";
                                                const qaRemarks = qaPart.split(" | Proof: ")[0] || "-";
                                                const qaProof = qaPart.split(" | Proof: ")[1] || "";

                                                const prodLinkHtml = prodProof ? ` <a href="${prodProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";
                                                const qaLinkHtml = qaProof ? ` <a href="${qaProof}" target="_blank" class="badge bg-info text-decoration-none" style="font-size: 10px; font-weight: 600;"><i class="fa fa-image"></i> View Proof</a>` : "";

                                                const badge = isResolved
                                                    ? `<span class="badge" style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">OKAY</span>`
                                                    : `<span class="badge" style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; display: inline-block;">DEFECTIVE</span>`;

                                                const rowStyle = isResolved
                                                    ? `background-color: #f0fdf4; color: #15803d;`
                                                    : `background-color: #fef2f2; color: #b91c1c;`;

                                                const rawPct = row.cr3ea_defectwisepercentage || ((parseInt(row.cr3ea_defectcount) || 0) / sampleSize * 100);
                                                const formattedPct = PKGOPS_Summary.formatPercentage(rawPct);

                                                return `
                                                    <tr style="${rowStyle} border-bottom: 1px solid #e2e8f0;">
                                                        <td style="padding: 12px 16px; text-align: left; font-weight: 600;">
                                                            <div>${defectInfo.name}</div>
                                                            <div class="mt-1">${defectInfo.badge}</div>
                                                        </td>
                                                        <td style="padding: 12px 16px; font-weight: 700; font-size: 15px;">${row.cr3ea_defectcount || "0"}</td>
                                                        <td style="padding: 12px 16px; font-weight: 600;">${formattedPct}</td>
                                                        <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${prodRemarks}${prodLinkHtml}</td>
                                                        <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${qaRemarks}${qaLinkHtml}</td>
                                                        <td style="padding: 12px 16px;">${badge}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="row mt-4">
                        <div class="col-md-12">
                            <div class="card border-0 shadow-sm rounded p-4 text-center" style="border: 1px solid #bbf7d0 !important; background-color: #f0fdf4 !important;">
                                <div class="text-success mb-2" style="font-size: 36px;"><i class="fa fa-check-circle"></i></div>
                                <h5 class="fw-bold text-success mb-1">100.00% Quality Conformance</h5>
                                <p class="text-secondary mb-0" style="font-size: 14px;">All sampled units (${sampleSize} units) conformed to specifications. Zero product or packaging defects were observed during this PAPA audit.</p>
                            </div>
                        </div>
                    </div>
                `}
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
                        <div class="table-responsive" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
                            <table class="table table-hover align-middle mb-0" style="border-collapse: collapse; width: 100%; min-width: 850px; table-layout: fixed;">
                                <thead style="background-color: #1e3a8a; color: #ffffff;">
                                    <tr>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 14%;">Sample Number</th>
                                        <th style="padding: 12px 16px; font-weight: 700; width: 12%;">Result Status</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 26%;">Defect Category / Detail</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 24%;">Corrective Action</th>
                                        <th style="padding: 12px 16px; font-weight: 700; text-align: left; width: 24%;">Re-verify Remarks</th>
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
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${prodRemarks}${prodLinkHtml}</td>
                                                 <td style="padding: 12px 16px; text-align: left; font-size: 13px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${qaRemarks}${qaLinkHtml}</td>
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
                                    <p style="word-break: break-word; overflow-wrap: break-word; white-space: normal;"><strong>Corrective Action Taken:</strong> ${prodRemarks}${prodLinkHtml}</p>
                                    <p style="word-break: break-word; overflow-wrap: break-word; white-space: normal;"><strong>Re-verification Remarks:</strong> ${qaRemarks}${qaLinkHtml}</p>
                                </div>
                            </div>
                        </div>
                    `;
                })() : ''}
            `;
        } 
        else if (this.pkgopsType === "Quality Wall Records") {
            const r = rows[0] || {};
            const facDisplayName = await PKGOPS_DAL.resolveUserDisplayNames(r.cr3ea_facilitator);
            const membersDisplayName = await PKGOPS_DAL.resolveUserDisplayNames(r.cr3ea_memberspresent);

            html = `
                <div class="row mt-3 g-3">
                    ${this.createSummaryCard("wall-fac", "Facilitator", facDisplayName)}
                    ${this.createSummaryCard("wall-type", "Wall Type", r.cr3ea_typeofqualitywall || "-")}
                    ${this.createSummaryCard("wall-members", "Members Present", membersDisplayName)}
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
                            <p class="mb-0 text-secondary" style="font-style: italic; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${r.cr3ea_remarks || "No remarks entered"}</p>
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
