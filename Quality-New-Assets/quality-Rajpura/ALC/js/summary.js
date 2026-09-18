// Step 14: Tour Summary Report Generation and Repeatability Analysis Module
console.log("ALC Summary Module loaded");

const ALC_Summary = {
    currentTourId: null,
    session: null,
    checkpoints: [],
    configs: [],

    // Bootstraps loading and rendering of the summary page
    init: async function (tourId) {
        this.currentTourId = tourId || ALC_StateMachine.currentTourId;
        if (!this.currentTourId) {
            console.error("ALC_Summary: No current tour ID found.");
            return;
        }

        ShowLoader();
        try {
            await this.loadSummaryData();
            await this.renderSummary();
        } catch (error) {
            console.error("Error generating ALC Summary:", error);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "load summary report")
                : ("Error loading summary report: " + error.message);
            alert(msg);
        } finally {
            HideLoader();
        }
    },

    // Fetches all required data from SharePoint and Dataverse
    loadSummaryData: async function () {
        // 1. Fetch current session details
        const AccessToken = await ALC_DAL.getAccessToken();
        const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
        const url = `${baseApiUrl}/api/data/v9.2/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`;
        const headers = { "Accept": "application/json" };
        if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

        const response = await fetch(url, { headers: headers });
        if (!response.ok) throw new Error(`Failed to retrieve tour session metadata: ${response.status}`);
        const rawSession = await response.json();
        this.session = (typeof QualityRajpura_Config !== 'undefined' && typeof QualityRajpura_Config.normalizeTourRecord === 'function')
            ? QualityRajpura_Config.normalizeTourRecord(rawSession)
            : (typeof normalizeTourRecord === 'function' ? normalizeTourRecord(rawSession) : rawSession);

        // 2. Fetch all checkpoints for the current tour
        this.checkpoints = await ALC_DAL.getCheckpoints(this.currentTourId);

        // 3. Fetch configs from SharePoint to resolve Area Incharges
        this.configs = [];
        try {
            this.configs = await ALC_DAL.getConfig();
        } catch (e) {
            console.warn("Failed to retrieve SharePoint configs for Area Incharge mapping:", e);
        }
    },

    // Dynamic stats and rendering of the summary DOM elements
    renderSummary: async function () {
        if (!this.session) return;

        // 1. Basic Metadata
        const dateStr = this.session.cr3ea_tourstartdate ? moment(this.session.cr3ea_tourstartdate).format("DD-MM-YYYY hh:mm A") : "N/A";
        document.getElementById("sum-exec-prod").innerText = this.session.cr3ea_shiftexecutiveproduction || "N/A";
        document.getElementById("sum-exec-qa").innerText = this.session.cr3ea_tourby || this.session.cr3ea_observedby || "N/A";
        document.getElementById("sum-date-time").innerText = dateStr;
        document.getElementById("sum-line-shift").innerText = `${this.session.cr3ea_lineno || "N/A"} / ${this.session.cr3ea_shift || "N/A"}`;

        document.getElementById("sum-prev-variety").innerText = this.session.cr3ea_previousrunningvariety || "N/A";
        document.getElementById("sum-run-variety").innerText = this.session.cr3ea_runningvariety || "N/A";

        // 2. Resolve Area Incharge names dynamically from configs
        const tourAreas = [...new Set(this.checkpoints.map(cp => cp.cr3ea_area).filter(Boolean))];
        const areaInchargeMap = [];
        tourAreas.forEach(areaName => {
            const configRow = this.configs.find(c =>
                (c.ConfigType === "Area Inspector" || c.ConfigType === "Product User" || c.ConfigType === "Product Incharge") &&
                c.Area &&
                (c.Area.toLowerCase().includes(areaName.toLowerCase().trim()) ||
                    areaName.toLowerCase().trim().includes(c.Area.toLowerCase()))
            );
            if (configRow && configRow.AssignedUser && configRow.AssignedUser.results) {
                const names = configRow.AssignedUser.results.map(u => u.Title).join(", ");
                if (names) {
                    areaInchargeMap.push(`${areaName}: ${names}`);
                }
            }
        });

        const inchargesListEl = document.getElementById("sum-area-incharges-list");
        if (inchargesListEl) {
            inchargesListEl.innerHTML = "";
            if (areaInchargeMap.length > 0) {
                areaInchargeMap.forEach(item => {
                    const [areaName, names] = item.split(": ");
                    const card = document.createElement("div");
                    card.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; padding: 10px 12px; border-radius: 6px; display: flex; flex-direction: column; justify-content: center;";
                    card.innerHTML = `
                        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b;">${areaName}</span>
                        <span style="font-size: 13px; font-weight: bold; color: #1e293b; margin-top: 3px;">${names}</span>
                    `;
                    inchargesListEl.appendChild(card);
                });
            } else {
                inchargesListEl.innerHTML = `<div style="grid-column: 1 / -1; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; color: #64748b; font-size: 13px; text-align: center;">No specific area incharges configured.</div>`;
            }
        }

        // 3. Count conducted tours on the same line today
        let toursCountToday = 1;
        try {
            const sessions = await ALC_DAL.getActiveSessions();
            const todayStr = moment().format("YYYY-MM-DD");
            const lineName = this.session.cr3ea_lineno;
            toursCountToday = sessions.filter(s => {
                const sDate = s.createdon || s.cr3ea_tourstartdate;
                if (!sDate) return false;
                const sDateLocal = moment(sDate).local().format("YYYY-MM-DD");
                return (sDateLocal === todayStr && s.cr3ea_lineno === lineName);
            }).length;
        } catch (e) {
            console.warn("Could not query daily tour count:", e);
        }
        document.getElementById("sum-tours-count").innerText = toursCountToday;

        // 4. Calculate Scores
        let totalMaxPoints = this.checkpoints.length * 2;
        let totalObtainedPoints = 0;

        // Mapped area scoring objects
        const areaStats = {};

        this.checkpoints.forEach(cp => {
            const area = cp.cr3ea_area || "General";
            if (!areaStats[area]) {
                areaStats[area] = { total: 0, obtained: 0 };
            }
            areaStats[area].total += 2;

            // Get obtained score for this checkpoint
            let numericScore = 2; // Default is Okay (2)
            const scoreText = cp.cr3ea_defectcategory || "";

            if (scoreText.includes("(0)") || scoreText === "00" || scoreText.includes("Non-Compliant")) {
                numericScore = 0;
            } else if (scoreText.includes("(1)") || scoreText === "01" || scoreText.includes("Partial")) {
                numericScore = 1;
            }

            totalObtainedPoints += numericScore;
            areaStats[area].obtained += numericScore;
        });

        const overallPercentRaw = totalMaxPoints > 0 ? (totalObtainedPoints / totalMaxPoints) * 100 : 0;
        const overallPercent = overallPercentRaw.toFixed(2);
        const scoreCircle = document.getElementById("sum-score-circle");
        const scoreCard = scoreCircle ? scoreCircle.parentElement : null;
        const isPassingScore = (parseFloat(overallPercent) >= 80);

        const status = this.session.cr3ea_processstatus || this.session.cr3ea_status || "";
        const isExpired = status === "Closed - Expired" || status.includes("Expired");
        const hasNoScore = (totalMaxPoints === 0 || totalObtainedPoints === 0);

        if (scoreCircle) {
            if (isExpired && hasNoScore) {
                scoreCircle.innerText = "Expired";
                scoreCircle.style.fontSize = "16px";
                scoreCircle.style.backgroundColor = "#ef4444";
                scoreCircle.style.boxShadow = "0 4px 6px -1px rgba(239, 68, 68, 0.3)";
            } else {
                scoreCircle.innerText = `${overallPercent}%`;
                if (isPassingScore) {
                    scoreCircle.style.backgroundColor = "#10b981";
                    scoreCircle.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.3)";
                } else {
                    scoreCircle.style.backgroundColor = "#ef4444";
                    scoreCircle.style.boxShadow = "0 4px 6px -1px rgba(239, 68, 68, 0.3)";
                }
            }
        }

        if (scoreCard) {
            if (isExpired && hasNoScore) {
                scoreCard.style.borderColor = "#fecaca";
                scoreCard.style.backgroundColor = "#fef2f2";
            } else if (isPassingScore) {
                scoreCard.style.borderColor = "#bbf7d0";
                scoreCard.style.backgroundColor = "#f0fdf4";
            } else {
                scoreCard.style.borderColor = "#fecaca";
                scoreCard.style.backgroundColor = "#fef2f2";
            }
        }

        const scoreDesc = document.getElementById("sum-score-desc");
        if (scoreDesc) {
            if (isExpired && hasNoScore) {
                scoreDesc.innerText = "Expired while in QA process / In Progress";
                scoreDesc.style.color = "#b91c1c";
            } else if (status === "Closed - Expired") {
                scoreDesc.innerText = `${isPassingScore ? "Success" : "Failed"} - Expired with ${overallPercent}% compliance score.`;
                scoreDesc.style.color = isPassingScore ? "#047857" : "#b91c1c";
            } else if (status.includes("Pending Production")) {
                scoreDesc.innerText = `Pending Production Corrective Actions. Current Score: ${overallPercent}%`;
                scoreDesc.style.color = isPassingScore ? "#047857" : "#b91c1c";
            } else if (status.includes("Pending Re-Verification")) {
                scoreDesc.innerText = `Pending QA Re-Verification. Current Score: ${overallPercent}%`;
                scoreDesc.style.color = isPassingScore ? "#047857" : "#b91c1c";
            } else if (status === "Completed") {
                scoreDesc.innerText = `Excellent! 100% compliance cleared successfully.`;
                scoreDesc.style.color = "#047857";
            } else {
                scoreDesc.innerText = `Completed with ${overallPercent}% compliance score.`;
                scoreDesc.style.color = isPassingScore ? "#047857" : "#b91c1c";
            }
        }

        // 5. Render Area-wise Summary Table
        const areasTbody = document.getElementById("sum-areas-tbody");
        if (areasTbody) {
            areasTbody.innerHTML = "";
            Object.keys(areaStats).sort().forEach(areaName => {
                const stats = areaStats[areaName];
                const areaPercentRaw = stats.total > 0 ? (stats.obtained / stats.total) * 100 : 0;
                const areaPercent = areaPercentRaw.toFixed(2);
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="padding: 10px; font-weight: bold; text-align: left;">${areaName}</td>
                    <td style="padding: 10px;">${stats.total / 2}</td>
                    <td style="padding: 10px;">${stats.obtained / 2}</td>
                    <td style="padding: 10px; font-weight: bold;">${stats.obtained} / ${stats.total}</td>
                    <td style="padding: 10px;">
                        <span class="badge ${parseFloat(areaPercent) >= 100 ? 'badge-success' : 'badge-warning'}" style="font-size: 13px;">${areaPercent}%</span>
                    </td>
                `;
                areasTbody.appendChild(tr);
            });
        }

        // 6. Perform Repeatability Analysis (Last 5 tours on this line)
        await this.renderRepeatabilityAnalysis();

        // 7. Render Detailed Checkpoints Table Grouped by Area Blocks
        const blocksContainer = document.getElementById("sum-checkpoints-blocks-container");
        if (blocksContainer) {
            blocksContainer.innerHTML = "";

            // Map configs for quick Area Incharge lookups
            const areaIncharges = {};
            this.checkpoints.forEach(cp => {
                const areaName = cp.cr3ea_area || "General";
                if (!areaIncharges[areaName]) {
                    const configRow = this.configs.find(c =>
                        c.ConfigType === "Product User" &&
                        c.Area &&
                        (c.Area.toLowerCase().includes(areaName.toLowerCase().trim()) ||
                            areaName.toLowerCase().trim().includes(c.Area.toLowerCase()))
                    );
                    if (configRow && configRow.AssignedUser && configRow.AssignedUser.results) {
                        areaIncharges[areaName] = configRow.AssignedUser.results.map(u => u.Title).join(", ");
                    } else {
                        areaIncharges[areaName] = "N/A";
                    }
                }
            });

            // Group checkpoints by area
            const checkpointsByArea = {};
            this.checkpoints.forEach(cp => {
                const area = cp.cr3ea_area || "General";
                if (!checkpointsByArea[area]) {
                    checkpointsByArea[area] = [];
                }
                checkpointsByArea[area].push(cp);
            });

            // Render each area as a Card Block
            Object.keys(checkpointsByArea).sort().forEach(areaName => {
                const cps = checkpointsByArea[areaName];
                const inchargeNames = areaIncharges[areaName] || "N/A";

                const card = document.createElement("div");
                card.style.cssText = "margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";

                // Card Header (Flex Layout with Title and Team Name)
                const header = document.createElement("div");
                header.style.cssText = "background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;";
                header.innerHTML = `
                    <h5 style="margin: 0; font-weight: bold; color: #1e293b; font-size: 14px;">${areaName}</h5>
                    <div style="font-size: 11px; color: #047857; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                        Incharge: ${inchargeNames}
                    </div>
                `;
                card.appendChild(header);

                // Card Body
                const body = document.createElement("div");
                body.style.cssText = "overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;";

                const table = document.createElement("table");
                table.className = "bs-table";
                table.border = "1";
                table.style.cssText = "width: 100%; min-width: 850px; table-layout: fixed; border-collapse: collapse; text-align: center; font-size: 13px; border: none;";

                table.innerHTML = `
                    <thead>
                        <tr style="background-color: #fcfdfe; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                            <th style="width: 5%; padding: 8px 10px;">Sr No.</th>
                            <th style="width: 45%; padding: 8px 10px; text-align: left;">Checkpoint Details</th>
                            <th style="width: 15%; padding: 8px 10px;">QA Initial Score</th>
                            <th style="width: 20%; padding: 8px 10px; text-align: left;">Corrective Actions Taken</th>
                            <th style="width: 15%; padding: 8px 10px; text-align: left;">QA Remarks</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const tbody = table.querySelector("tbody");

                cps.forEach((cp, idx) => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #f1f5f9";

                    // QA Initial Score Badge
                    const initialScoreText = cp.cr3ea_defectcategory || "Okay (2)";
                    const isFailed = initialScoreText.includes("(0)") ||
                        initialScoreText.includes("(1)") ||
                        initialScoreText.includes("Non-Compliant") ||
                        initialScoreText.includes("Partial") ||
                        initialScoreText === "00" ||
                        initialScoreText === "01";
                    const initialBadge = !isFailed
                        ? `<span class="badge badge-success" style="font-size: 11px;">${initialScoreText}</span>`
                        : `<span class="badge badge-error" style="font-size: 11px;">${initialScoreText}</span>`;

                    // Corrective Actions Column
                    let actionsTakenHtml = '<span class="text-muted">-</span>';
                    let prodRemark = cp.cr3ea_productionremarks || "";

                    if (!prodRemark) {
                        const defectRemarks = cp.cr3ea_defectremarks || "";
                        if (defectRemarks.startsWith("Action:")) {
                            prodRemark = defectRemarks;
                        }
                    }

                    if (prodRemark) {
                        if (prodRemark.includes(" | Re-verified:")) {
                            prodRemark = prodRemark.split(" | Re-verified:")[0].trim();
                        }

                        let textPart = prodRemark;
                        if (prodRemark.startsWith("Action: ")) {
                            textPart = prodRemark.replace("Action: ", "");
                        }
                        let fileName = "";
                        if (textPart.includes("| File:")) {
                            const parts = textPart.split("| File:");
                            textPart = parts[0].trim();
                            fileName = parts[1] ? parts[1].trim() : "";
                        }

                        if (fileName) {
                            const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                            const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${fileName}`;
                            actionsTakenHtml = `${textPart} <br> <a href="${fileUrl}" target="_blank" class="no-print" style="text-decoration: underline; color: #1a73e8; font-weight: bold; font-size: 11px;">View Proof</a>`;
                        } else {
                            actionsTakenHtml = textPart;
                        }
                    }

                    // QA Remarks Column
                    const qaRemark = cp.cr3ea_defectremarks || "";
                    let qaRemarksHtml = '<span class="text-muted">-</span>';

                    let qaDisplayText = "";
                    let qaFileBadge = "";

                    const parts = qaRemark.split(" | Re-verified:");
                    let initialPart = parts[0] ? parts[0].trim() : "";
                    const reverifyParts = parts.slice(1).map(p => p.trim());

                    let qaFileName = "";
                    if (initialPart.toLowerCase().includes("file:")) {
                        const idx = initialPart.toLowerCase().indexOf("file:");
                        qaFileName = initialPart.substring(idx + 5).trim();
                        let textPart = initialPart.substring(0, idx).trim();
                        if (textPart.endsWith("|")) {
                            textPart = textPart.substring(0, textPart.length - 1).trim();
                        }
                        initialPart = textPart;
                    }

                    if (!initialPart && qaFileName) {
                        initialPart = "Image Proof Uploaded";
                    }

                    if (qaFileName) {
                        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                        const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${qaFileName}`;
                        qaFileBadge = ` <a href="${fileUrl}" target="_blank" class="no-print" style="text-decoration: underline; color: #1a73e8; font-weight: bold; font-size: 11px; margin-left: 5px;">View QA Proof</a>`;
                    }

                    let reverifyDisplayText = "";
                    if (reverifyParts.length > 0) {
                        const formattedParts = reverifyParts.map(part => {
                            let cleanReverify = part;
                            let reverifyFileName = "";

                            if (part.toLowerCase().includes("file:")) {
                                const idx = part.toLowerCase().indexOf("file:");
                                reverifyFileName = part.substring(idx + 5).trim();
                                let textPart = part.substring(0, idx).trim();
                                if (textPart.endsWith("|")) {
                                    textPart = textPart.substring(0, textPart.length - 1).trim();
                                }
                                cleanReverify = textPart;
                            }

                            if (!cleanReverify && reverifyFileName) {
                                cleanReverify = "Image Proof Uploaded";
                            }

                            let badgeHtml = "";
                            if (reverifyFileName) {
                                const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                                const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${reverifyFileName}`;
                                badgeHtml = ` <a href="${fileUrl}" target="_blank" class="no-print" style="text-decoration: underline; color: #1a73e8; font-weight: bold; font-size: 11px; margin-left: 5px;">View Re-verify Proof</a>`;
                            }

                            return `<small class="text-success" style="font-weight: bold; display: block; margin-top: 4px;">Re-verified: ${cleanReverify}${badgeHtml}</small>`;
                        });

                        reverifyDisplayText = formattedParts.join("");
                    }

                    const showInitial = initialPart && !initialPart.startsWith("Action:");
                    if (showInitial && reverifyDisplayText) {
                        qaDisplayText = `${initialPart}${qaFileBadge} ${reverifyDisplayText}`;
                    } else if (reverifyDisplayText) {
                        qaDisplayText = reverifyDisplayText;
                    } else if (showInitial) {
                        qaDisplayText = `${initialPart}${qaFileBadge}`;
                    }

                    if (qaDisplayText) {
                        qaRemarksHtml = `<span>${qaDisplayText}</span>`;
                    }

                    tr.innerHTML = `
                        <td style="padding: 10px;">${idx + 1}</td>
                        <td style="padding: 10px; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${cp.cr3ea_criteria}</td>
                        <td style="padding: 10px;">${initialBadge}</td>
                        <td style="padding: 10px; text-align: left; font-size: 12px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${actionsTakenHtml}</td>
                        <td style="padding: 10px; text-align: left; font-size: 12px; word-break: break-word; overflow-wrap: break-word; white-space: normal;">${qaRemarksHtml}</td>
                    `;
                    tbody.appendChild(tr);
                });

                body.appendChild(table);
                card.appendChild(body);
                blocksContainer.appendChild(card);
            });
        }
    },

    // Checks last 5 tours on this line for recurring failures in checkpoints
    renderRepeatabilityAnalysis: async function () {
        const repeatabilityPanel = document.getElementById("sum-repeatability-panel");
        const repeatabilityList = document.getElementById("sum-repeatability-list");
        if (!repeatabilityPanel || !repeatabilityList) return;

        repeatabilityPanel.style.display = "none";
        repeatabilityList.innerHTML = "";

        // Get failed checkpoints in this tour
        const currentFailedCheckpoints = this.checkpoints.filter(cp => {
            const initialScoreText = cp.cr3ea_defectcategory || "";
            return (cp.cr3ea_status === "Not Okay" || initialScoreText.includes("Non-Compliant") || initialScoreText.includes("Partial") || initialScoreText === "00" || initialScoreText === "01");
        });

        if (currentFailedCheckpoints.length === 0) return;

        try {
            // Retrieve recent sessions on this line
            const AccessToken = await ALC_DAL.getAccessToken();
            const apiVersion = "9.2";
            const tableName = QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR;
            const baseApiUrl = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.DATAVERSE_URL) || (typeof environmentUrl !== 'undefined' ? environmentUrl : '');
            const headers = { "Accept": "application/json" };
            if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

            // Fetch last 15 tours to make sure we find at least 5 matching this line
            const filter = `?$filter=(cr3ea_plantid eq '${QualityRajpura_Config.PLANT_ID}' or cr3ea_plantid eq 'Rajpura')&$orderby=cr3ea_tourstartdate desc&$top=15`;
            const response = await fetch(`${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`, { headers: headers });
            if (!response.ok) return;

            const data = await response.json();
            const normalizeFn = (typeof QualityRajpura_Config !== 'undefined' && typeof QualityRajpura_Config.normalizeTourRecord === 'function')
                ? QualityRajpura_Config.normalizeTourRecord.bind(QualityRajpura_Config)
                : (typeof normalizeTourRecord === 'function' ? normalizeTourRecord : (x => x));
            const tours = (data.value || []).map(t => normalizeFn(t));

            // Filter tours matching current line (excluding current session)
            const lineName = this.session.cr3ea_lineno;
            const pastLineTours = tours
                .filter(t => t.cr3ea_lineno === lineName && QualityRajpura_Config.getTourId(t) !== this.currentTourId)
                .sort((a, b) => {
                    const valA = a.cr3ea_tourstartdate || a.createdon || "";
                    const valB = b.cr3ea_tourstartdate || b.createdon || "";
                    const formats = [
                        "YYYY-MM-DDTHH:mm:ssZ",
                        "YYYY-MM-DDTHH:mm:ss.SSSZ",
                        "YYYY-MM-DD HH:mm:ss",
                        "YYYY-MM-DD",
                        "MM-DD-YYYY HH:mm:ss",
                        "MM-DD-YYYY hh:mm A",
                        "MM-DD-YYYY",
                        "M/D/YYYY h:mm A",
                        "M/D/YYYY hh:mm A",
                        "MM/DD/YYYY hh:mm A",
                        "DD-MM-YYYY HH:mm:ss",
                        "DD-MM-YYYY hh:mm A",
                        "DD-MM-YYYY",
                        "D/M/YYYY h:mm A",
                        "D/M/YYYY hh:mm A",
                        "DD/MM/YYYY hh:mm A"
                    ];
                    const timeA = moment(valA, formats, true);
                    const timeB = moment(valB, formats, true);
                    const msA = timeA.isValid() ? timeA.valueOf() : 0;
                    const msB = timeB.isValid() ? timeB.valueOf() : 0;
                    return msB - msA;
                })
                .slice(0, 5);

            if (pastLineTours.length === 0) return;

            // Fetch checkpoints for these past tours in parallel
            const fetchPromises = pastLineTours.map(t => ALC_DAL.getCheckpoints(QualityRajpura_Config.getTourId(t)));
            const pastCheckpointsLists = await Promise.all(fetchPromises);

            const recurringDeviations = [];

            currentFailedCheckpoints.forEach(curCp => {
                let failCount = 0;
                pastCheckpointsLists.forEach((pastList, idx) => {
                    // Match by checkpoint criteria text
                    const match = pastList.find(pc => pc.cr3ea_criteria === curCp.cr3ea_criteria);
                    if (match) {
                        const statusText = match.cr3ea_defectcategory || "";
                        const failed = (match.cr3ea_status === "Not Okay" || statusText.includes("Non-Compliant") || statusText.includes("Partial") || statusText === "00" || statusText === "01");
                        if (failed) {
                            failCount++;
                        }
                    }
                });

                if (failCount > 0) {
                    recurringDeviations.push({
                        area: curCp.cr3ea_area,
                        criteria: curCp.cr3ea_criteria,
                        times: failCount,
                        totalTours: pastLineTours.length
                    });
                }
            });

            if (recurringDeviations.length > 0) {
                repeatabilityPanel.style.display = "block";
                recurringDeviations.forEach(dev => {
                    const li = document.createElement("li");
                    li.innerHTML = `<strong>${dev.area}</strong> (${dev.criteria}) - Failed <strong>${dev.times}</strong> times in the last ${dev.totalTours} conducted tours on this line.`;
                    repeatabilityList.appendChild(li);
                });
            }

        } catch (e) {
            console.warn("Error running repeatability analysis:", e);
        }
    },

    // Printer-friendly trigger
    printSummary: function () {
        window.print();
    },

    // Go back to list queue
    goBackToQueue: function () {
        window.location.search = "";
    }
};
