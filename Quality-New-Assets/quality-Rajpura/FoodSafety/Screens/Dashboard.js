// Screen 4: Analytics Summary & Trend Dashboard Screen
console.log("Analytics Dashboard Screen loaded");

const DashboardScreen = {
    tours: [],
    filteredTours: [],

    resolveUserName: function(emailOrName) {
        if (!emailOrName) return "";
        if (!emailOrName.includes("@")) return emailOrName;
        const clean = emailOrName.split("@")[0].trim();
        return clean.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    },

    init: async function () {
        console.log("Initializing Analytics Dashboard Screen...");
        HeaderComponent.render("dashboard-header-wrapper");

        // Set default filter date range (last 30 days)
        const end = moment();
        const start = moment().subtract(30, 'days');
        document.getElementById("filter-start-date").value = start.format("YYYY-MM-DD");
        document.getElementById("filter-end-date").value = end.format("YYYY-MM-DD");

        // Initialize Select2 dropdowns on filters
        DropdownComponent.init("filterSiteSelect");
        DropdownComponent.init("filterLineSelect");
        DropdownComponent.init("filterTypeSelect");

        this.bindEvents();
        await this.loadData();
    },

    bindEvents: function () {
        // Handle filter triggers
        document.getElementById("filterSiteSelect").addEventListener("change", () => this.applyFilters());
        document.getElementById("filterLineSelect").addEventListener("change", () => this.applyFilters());
        document.getElementById("filterTypeSelect").addEventListener("change", () => this.applyFilters());
        document.getElementById("filter-start-date").addEventListener("change", () => this.applyFilters());
        document.getElementById("filter-end-date").addEventListener("change", () => this.applyFilters());
        
        // Handle close button
        const closeBtn = document.getElementById("pci-dashboard-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                FoodSafety_Main.navigateTo("screen-welcome");
                WelcomeScreen.init();
            });
        }
    },

    loadData: async function () {
        try {
            ShowLoader();
            this.tours = await FoodSafety_DAL.getTourHistory();
            console.log(`Dashboard: Loaded ${this.tours.length} audits from Dataverse.`);
            this.applyFilters();
        } catch (e) {
            console.error("Dashboard failed to fetch audits list:", e);
            alert("Failed to retrieve quality tours history.");
        } finally {
            HideLoader();
        }
    },

    applyFilters: function () {
        const site = document.getElementById("filterSiteSelect").value;
        const line = document.getElementById("filterLineSelect").value;
        const type = document.getElementById("filterTypeSelect").value;
        const startVal = document.getElementById("filter-start-date").value;
        const endVal = document.getElementById("filter-end-date").value;

        const start = startVal ? moment(startVal).startOf('day') : null;
        const end = endVal ? moment(endVal).endOf('day') : null;

        this.filteredTours = this.tours.filter(t => {
            // Site filter
            if (site !== "All" && t.cr3ea_plantid !== site) return false;
            // Line filter
            if (line !== "All" && t.cr3ea_lineno !== line) return false;
            // Checklist Type filter
            if (type !== "All" && t.cr3ea_food_safety_checklisttype !== type) return false;
            
            // Date filter
            if (t.cr3ea_tourstartdate) {
                const tourDate = moment(t.cr3ea_tourstartdate);
                if (start && tourDate.isBefore(start)) return false;
                if (end && tourDate.isAfter(end)) return false;
            }
            return true;
        });

        console.log(`Dashboard: Filtered list contains ${this.filteredTours.length} audits.`);
        this.renderMetrics();
        this.renderTable();
        this.drawTrendChart();
    },

    renderMetrics: function () {
        const total = this.filteredTours.length;
        
        let passCount = 0;
        let scoreSum = 0;
        let scoreCount = 0;

        this.filteredTours.forEach(t => {
            if (t.cr3ea_checklist_result === "Pass") {
                passCount++;
            }
            
            // Collect compliance numbers
            if (t.cr3ea_overall_score && t.cr3ea_overall_score !== "N/A") {
                const num = parseFloat(t.cr3ea_overall_score);
                if (!isNaN(num)) {
                    scoreSum += num;
                    scoreCount++;
                }
            }
        });

        const avgScore = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) + "%" : "N/A";
        const successRate = total > 0 ? ((passCount / total) * 100).toFixed(1) + "%" : "0.0%";

        document.getElementById("metric-total-audits").innerText = total;
        document.getElementById("metric-avg-score").innerText = avgScore;
        document.getElementById("metric-success-rate").innerText = successRate;
    },

    renderTable: function () {
        const tbody = document.getElementById("dashboard-table-tbody");
        if (!tbody) return;

        if (this.filteredTours.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="padding: 20px; color: #64748b;">No matching audit records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        this.filteredTours.forEach(t => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";
            tr.style.borderBottom = "1px solid #e2e8f0";
            tr.title = "Click to view area-wise observation breakdown";
            tr.onclick = () => this.loadAuditBreakdown(t.cr3ea_prod_rajpura_quality_tourid, t);

            const dateStr = t.cr3ea_tourstartdate ? moment(t.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : "N/A";
            const score = t.cr3ea_overall_score || "N/A";
            const result = t.cr3ea_checklist_result || "N/A";
            const badgeClass = result === "Pass" ? "badge-success" : "badge-error";

            tr.innerHTML = `
                <td style="padding: 12px 15px;">${dateStr}</td>
                <td style="padding: 12px 15px; font-weight: 500; text-align: left;">${t.cr3ea_food_safety_checklisttype}</td>
                <td style="padding: 12px 15px;">${t.cr3ea_plantid || 'N/A'}</td>
                <td style="padding: 12px 15px;">${t.cr3ea_lineno || 'N/A'}</td>
                <td style="padding: 12px 15px; font-weight: bold; color: #0284c7;">${score}</td>
                <td style="padding: 12px 15px;"><span class="badge ${badgeClass}">${result}</span></td>
                <td style="padding: 12px 15px; color: #475569; font-size: 13px;">${this.resolveUserName(t.cr3ea_assigned_qa) || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Load child checklist items for selected audit row
    loadAuditBreakdown: async function (tourId, tourRecord) {
        try {
            ShowLoader();
            console.log(`Loading checklist details for audit: ${tourId}`);
            
            const items = await FoodSafety_DAL.getChecklistItems(tourId);
            const detailPanel = document.getElementById("dashboard-breakdown-panel");
            const detailTbody = document.getElementById("breakdown-table-tbody");
            const aggregateTbody = document.getElementById("breakdown-aggregate-tbody");

            if (!detailPanel || !detailTbody || !aggregateTbody) return;

            detailPanel.style.display = "block";
            document.getElementById("breakdown-title").innerText = `Audit Breakdown: ${tourRecord.cr3ea_food_safety_checklisttype} (${moment(tourRecord.cr3ea_tourstartdate).format("DD-MM-YYYY")})`;

            if (!items || items.length === 0) {
                detailTbody.innerHTML = `<tr><td colspan="5" style="padding: 15px; color: #64748b;">No checklist checkpoints logged for this session.</td></tr>`;
                aggregateTbody.innerHTML = `<tr><td colspan="3" style="padding: 15px; color: #64748b;">No data.</td></tr>`;
                return;
            }

            // 1. Render checkpoint list
            detailTbody.innerHTML = "";
            items.forEach((item, index) => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #e2e8f0";

                let statusText = "";
                let badgeStyle = "";
                let remarks = "";

                if (tourRecord.cr3ea_food_safety_checklisttype === "PPE Checklist") {
                    statusText = item.cr3ea_food_safety_defectcategory || item.cr953_food_safety_defectcategory || "Compliant";
                    badgeStyle = statusText === "Compliant" ? "badge-success" : "badge-error";
                    const count = item.cr3ea_food_safety_defectcount !== undefined ? item.cr3ea_food_safety_defectcount : (item.cr953_food_safety_defectcount || 0);
                    remarks = `Defect Count: ${count}`;
                } else if (tourRecord.cr3ea_food_safety_checklisttype === "GMP Checklist") {
                    statusText = item.cr3ea_food_safety_status || item.cr953_food_safety_status || "Okay";
                    badgeStyle = statusText === "Okay" ? "badge-success" : "badge-error";
                    remarks = item.cr3ea_food_safety_defectremarks || item.cr953_food_safety_defectremarks || "N/A";
                } else { // PCI
                    statusText = item.cr3ea_food_safety_status || item.cr953_food_safety_status || "Okay";
                    badgeStyle = statusText === "Okay" ? "badge-success" : "badge-error";
                    const obsType = item.cr3ea_food_safety_observationtype || item.cr953_food_safety_observationtype;
                    const obsCount = item.cr3ea_food_safety_defectcount !== undefined ? item.cr3ea_food_safety_defectcount : (item.cr953_food_safety_defectcount || 0);
                    remarks = obsType 
                        ? `${obsType} (Count: ${obsCount})` 
                        : "N/A";
                }

                const areaName = item.cr3ea_food_safety_area || item.cr953_food_safety_area || 'General';
                const locOrCriteria = item.cr3ea_food_safety_location || item.cr953_food_safety_location || item.cr3ea_food_safety_criteria || item.cr953_food_safety_criteria;

                tr.innerHTML = `
                    <td style="padding: 10px;">${index + 1}</td>
                    <td style="padding: 10px; font-weight: 500; text-align: left;">${areaName}</td>
                    <td style="padding: 10px; text-align: left;">${locOrCriteria}</td>
                    <td style="padding: 10px;"><span class="badge ${badgeStyle}">${statusText}</span></td>
                    <td style="padding: 10px; color: #475569; font-size: 13px; text-align: left;">${remarks}</td>
                `;
                detailTbody.appendChild(tr);
            });

            // 2. Aggregate Area-wise observation counts and "Not Okay" findings
            const areaMap = {};
            items.forEach(item => {
                const area = item.cr3ea_food_safety_area || item.cr953_food_safety_area || "General";
                if (!areaMap[area]) {
                    areaMap[area] = { total: 0, notOkay: 0 };
                }
                
                areaMap[area].total++;
                
                // Evaluate Not Okay states
                if (tourRecord.cr3ea_food_safety_checklisttype === "PPE Checklist") {
                    const defectCat = item.cr3ea_food_safety_defectcategory || item.cr953_food_safety_defectcategory;
                    const defectCnt = item.cr3ea_food_safety_defectcount !== undefined ? item.cr3ea_food_safety_defectcount : item.cr953_food_safety_defectcount;
                    if (defectCat === "Non-Compliant" || (defectCnt && defectCnt > 0)) {
                        areaMap[area].notOkay++;
                    }
                } else {
                    const st = item.cr3ea_food_safety_status || item.cr953_food_safety_status;
                    if (st === "Not Okay") {
                        areaMap[area].notOkay++;
                    }
                }
            });

            aggregateTbody.innerHTML = "";
            Object.keys(areaMap).forEach(area => {
                const tr = document.createElement("tr");
                tr.style.borderBottom = "1px solid #e2e8f0";
                
                const stats = areaMap[area];
                const notOkayBadge = stats.notOkay > 0 
                    ? `<span class="badge badge-error">${stats.notOkay}</span>`
                    : `<span class="badge badge-success">0</span>`;

                tr.innerHTML = `
                    <td style="padding: 10px; font-weight: 600; text-align: left; color: #1e293b;">${area}</td>
                    <td style="padding: 10px;">${stats.total}</td>
                    <td style="padding: 10px;">${notOkayBadge}</td>
                `;
                aggregateTbody.appendChild(tr);
            });

            // Scroll down to the breakdown panel smoothly
            detailPanel.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            console.error("Error loading checklist detailed breakdown:", e);
        } finally {
            HideLoader();
        }
    },

    // Render an SVG Line Chart plotting score trends over time
    drawTrendChart: function () {
        const container = document.getElementById("trend-chart-container");
        if (!container) return;

        // Collect tours that have valid scores (sort chronologically)
        const dataPoints = this.filteredTours
            .filter(t => t.cr3ea_overall_score && t.cr3ea_overall_score !== "N/A" && t.cr3ea_tourstartdate)
            .map(t => ({
                date: moment(t.cr3ea_tourstartdate),
                score: parseFloat(t.cr3ea_overall_score)
            }))
            .sort((a, b) => a.date.valueOf() - b.date.valueOf());

        if (dataPoints.length === 0) {
            container.innerHTML = `
                <div style="height: 250px; display: flex; align-items: center; justify-content: center; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 14px;">
                    No score trend data available for current selection.
                </div>
            `;
            return;
        }

        // SVG Chart coordinates
        const width = 800;
        const height = 250;
        const padding = 40;

        const chartW = width - (padding * 2);
        const chartH = height - (padding * 2);

        // Find min/max scores
        const maxScore = 100;
        const minScore = 0;

        // Generate coordinates
        const pts = dataPoints.map((dp, idx) => {
            const x = padding + (dataPoints.length > 1 ? (idx / (dataPoints.length - 1)) * chartW : chartW / 2);
            // Y inverted in SVG (0 is top)
            const y = padding + chartH - ((dp.score / 100) * chartH);
            return { x, y, score: dp.score, dateStr: dp.date.format("DD MMM") };
        });

        // Generate line path
        let pathD = "";
        if (pts.length === 1) {
            pathD = `M ${pts[0].x - 10} ${pts[0].y} L ${pts[0].x + 10} ${pts[0].y}`;
        } else {
            pathD = pts.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(" ");
        }

        // Draw grids & labels
        let gridLines = "";
        // Horizontal lines (25%, 50%, 75%, 100%)
        const gridSteps = [0, 25, 50, 75, 100];
        gridSteps.forEach(step => {
            const y = padding + chartH - ((step / 100) * chartH);
            gridLines += `
                <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
                <text x="${padding - 10}" y="${y + 4}" fill="#64748b" font-size="10" font-family="Outfit, sans-serif" text-anchor="end">${step}%</text>
            `;
        });

        // Vertical date labels (draw maximum of 6 date labels to avoid overlap)
        let dateLabels = "";
        const labelInterval = Math.ceil(pts.length / 6);
        pts.forEach((pt, idx) => {
            if (idx % labelInterval === 0 || idx === pts.length - 1) {
                dateLabels += `
                    <line x1="${pt.x}" y1="${padding}" x2="${pt.x}" y2="${height - padding}" stroke="#f1f5f9" stroke-width="1" />
                    <text x="${pt.x}" y="${height - padding + 15}" fill="#64748b" font-size="10" font-family="Outfit, sans-serif" text-anchor="middle">${pt.dateStr}</text>
                `;
            }
        });

        // Data point dots
        let dots = "";
        pts.forEach((pt) => {
            dots += `
                <g class="chart-dot-group">
                    <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#0284c7" stroke="#ffffff" stroke-width="1.5" />
                    <text x="${pt.x}" y="${pt.y - 8}" fill="#0f172a" font-size="10" font-weight="bold" font-family="Outfit, sans-serif" text-anchor="middle">${pt.score.toFixed(0)}%</text>
                </g>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; overflow: visible;">
                ${gridLines}
                ${dateLabels}
                <!-- Line Path -->
                <path d="${pathD}" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                ${dots}
            </svg>
        `;
    }
};
