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
            alert("Error loading summary report: " + error.message);
        } finally {
            HideLoader();
        }
    },

    // Fetches all required data from SharePoint and Dataverse
    loadSummaryData: async function () {
        // 1. Fetch current session details
        const AccessToken = await ALC_DAL.getAccessToken();
        const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
        const url = `${baseApiUrl}/api/data/v9.2/cr3ea_prod_qualitytours(${this.currentTourId})`;
        const headers = { "Accept": "application/json" };
        if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

        const response = await fetch(url, { headers: headers });
        if (!response.ok) throw new Error(`Failed to retrieve tour session metadata: ${response.status}`);
        this.session = await response.json();

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
                c.ConfigType === "Product User" && 
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
        document.getElementById("sum-area-incharges-list").innerText = areaInchargeMap.length > 0 ? areaInchargeMap.join(" | ") : "No specific area incharges configured.";

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
        if (scoreCircle) {
            scoreCircle.innerText = `${overallPercent}%`;
            if (isPassingScore) {
                scoreCircle.style.backgroundColor = "#10b981";
                scoreCircle.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.3)";
            } else {
                scoreCircle.style.backgroundColor = "#ef4444";
                scoreCircle.style.boxShadow = "0 4px 6px -1px rgba(239, 68, 68, 0.3)";
            }
        }

        if (scoreCard) {
            if (isPassingScore) {
                scoreCard.style.borderColor = "#bbf7d0";
                scoreCard.style.backgroundColor = "#f0fdf4";
            } else {
                scoreCard.style.borderColor = "#fecaca";
                scoreCard.style.backgroundColor = "#fef2f2";
            }
        }
        
        const scoreDesc = document.getElementById("sum-score-desc");
        if (scoreDesc) {
            const status = this.session.cr3ea_processstatus || this.session.cr3ea_status || "";
            if (status === "Closed - Expired") {
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

        // 7. Render Detailed Checkpoints Table
        const checkpointsTbody = document.getElementById("sum-checkpoints-tbody");
        if (checkpointsTbody) {
            checkpointsTbody.innerHTML = "";
            const sortedCheckpoints = [...this.checkpoints].sort((a, b) => {
                const areaA = a.cr3ea_area || "";
                const areaB = b.cr3ea_area || "";
                return areaA.localeCompare(areaB);
            });
            sortedCheckpoints.forEach((cp, index) => {
                const tr = document.createElement("tr");
                
                // QA Initial Score Badge
                const initialScoreText = cp.cr3ea_defectcategory || "Okay (2)";
                const isFailed = initialScoreText.includes("(0)") || 
                                 initialScoreText.includes("(1)") || 
                                 initialScoreText.includes("Non-Compliant") || 
                                 initialScoreText.includes("Partial") ||
                                 initialScoreText === "00" ||
                                 initialScoreText === "01";
                const initialBadge = !isFailed 
                    ? `<span class="badge badge-success">${initialScoreText}</span>` 
                    : `<span class="badge badge-error">${initialScoreText}</span>`;

                // Corrective Actions Column
                let actionsTakenHtml = '<span class="text-muted">-</span>';
                let prodRemark = cp.cr3ea_productionremarks || "";
                
                // Fallback to checking cr3ea_defectremarks if it starts with legacy "Action:"
                if (!prodRemark) {
                    const defectRemarks = cp.cr3ea_defectremarks || "";
                    if (defectRemarks.startsWith("Action:")) {
                        prodRemark = defectRemarks;
                    }
                }

                if (prodRemark) {
                    // Strip re-verification suffix if present in legacy remark
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

                // QA Remarks Column (preserves both initial defect and re-verification remarks, and extracts QA proof file)
                const qaRemark = cp.cr3ea_defectremarks || "";
                let qaRemarksHtml = '<span class="text-muted">-</span>';
                
                let qaDisplayText = "";
                let qaFileBadge = "";
                let initialPart = qaRemark;
                let reverifyPart = "";

                if (qaRemark.includes(" | Re-verified:")) {
                    const parts = qaRemark.split(" | Re-verified:");
                    initialPart = parts[0].trim();
                    reverifyPart = parts[1] ? parts[1].trim() : "";
                }

                // Extract QA proof file if present in initial part
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

                // Extract QA re-verification proof file if present in reverify part
                let reverifyDisplayText = "";
                let reverifyFileBadge = "";
                if (reverifyPart) {
                    let cleanReverify = reverifyPart;
                    let reverifyFileName = "";
                    if (reverifyPart.toLowerCase().includes("file:")) {
                        const idx = reverifyPart.toLowerCase().indexOf("file:");
                        reverifyFileName = reverifyPart.substring(idx + 5).trim();
                        let textPart = reverifyPart.substring(0, idx).trim();
                        if (textPart.endsWith("|")) {
                            textPart = textPart.substring(0, textPart.length - 1).trim();
                        }
                        cleanReverify = textPart;
                    }
                    if (!cleanReverify && reverifyFileName) {
                        cleanReverify = "Image Proof Uploaded";
                    }
                    if (reverifyFileName) {
                        const webUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "";
                        const fileUrl = `${webUrl}/ALC_CorrectiveActions_Docs/${reverifyFileName}`;
                        reverifyFileBadge = ` <a href="${fileUrl}" target="_blank" class="no-print" style="text-decoration: underline; color: #2e7d32; font-weight: bold; font-size: 11px; margin-left: 5px;">View Re-verify Proof</a>`;
                    }
                    reverifyDisplayText = `<small class="text-success" style="font-weight: bold;">Re-verified: ${cleanReverify}${reverifyFileBadge}</small>`;
                }

                const showInitial = initialPart && !initialPart.startsWith("Action:");
                if (showInitial && reverifyDisplayText) {
                    qaDisplayText = `${initialPart}${qaFileBadge} <br> ${reverifyDisplayText}`;
                } else if (reverifyDisplayText) {
                    qaDisplayText = reverifyDisplayText;
                } else if (showInitial) {
                    qaDisplayText = `${initialPart}${qaFileBadge}`;
                }

                if (qaDisplayText) {
                    qaRemarksHtml = `<span>${qaDisplayText}</span>`;
                }

                tr.innerHTML = `
                    <td style="padding: 10px;">${index + 1}</td>
                    <td style="padding: 10px; font-weight: bold; text-align: left;">${cp.cr3ea_area}</td>
                    <td style="padding: 10px; text-align: left;">${cp.cr3ea_criteria}</td>
                    <td style="padding: 10px;">${initialBadge}</td>
                    <td style="padding: 10px; text-align: left; font-size: 12px;">${actionsTakenHtml}</td>
                    <td style="padding: 10px; text-align: left; font-size: 12px;">${qaRemarksHtml}</td>
                `;
                checkpointsTbody.appendChild(tr);
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
            const tableName = "cr3ea_prod_qualitytours";
            const baseApiUrl = typeof environmentUrl !== 'undefined' ? environmentUrl : '';
            const headers = { "Accept": "application/json" };
            if (AccessToken) headers["Authorization"] = `Bearer ${AccessToken}`;

            // Fetch last 15 tours to make sure we find at least 5 matching this line
            const filter = `?$filter=cr3ea_plantid eq '14'&$orderby=cr3ea_tourstartdate desc&$top=15`;
            const response = await fetch(`${baseApiUrl}/api/data/v${apiVersion}/${tableName}${filter}`, { headers: headers });
            if (!response.ok) return;

            const data = await response.json();
            const tours = data.value || [];
            
            // Filter tours matching current line (excluding current session)
            const lineName = this.session.cr3ea_lineno;
            const pastLineTours = tours
                .filter(t => t.cr3ea_lineno === lineName && t.cr3ea_prod_qualitytourid !== this.currentTourId)
                .sort((a, b) => {
                    const valA = a.cr3ea_tourstartdate || a.createdon || "";
                    const valB = b.cr3ea_tourstartdate || b.createdon || "";
                    const formats = [
                        "DD-MM-YYYY HH:mm:ss",
                        "DD-MM-YYYY hh:mm A",
                        "M/D/YYYY h:mm A",
                        "M/D/YYYY hh:mm A",
                        "D/M/YYYY h:mm A",
                        "D/M/YYYY hh:mm A",
                        "MM/DD/YYYY hh:mm A",
                        "DD/MM/YYYY hh:mm A",
                        "YYYY-MM-DDTHH:mm:ssZ",
                        "YYYY-MM-DDTHH:mm:ss.SSSZ",
                        "YYYY-MM-DD HH:mm:ss"
                    ];
                    const timeA = moment(valA, formats);
                    const timeB = moment(valB, formats);
                    const msA = timeA.isValid() ? timeA.valueOf() : 0;
                    const msB = timeB.isValid() ? timeB.valueOf() : 0;
                    return msB - msA;
                })
                .slice(0, 5);

            if (pastLineTours.length === 0) return;

            // Fetch checkpoints for these past tours in parallel
            const fetchPromises = pastLineTours.map(t => ALC_DAL.getCheckpoints(t.cr3ea_prod_qualitytourid));
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
