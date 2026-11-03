// ALC Rajpura Dataverse Submission Logic
console.log("ALC module loaded");

document.addEventListener("DOMContentLoaded", function () {
    const submitBtn = document.getElementById("submit-alc-btn");
    
    if (submitBtn) {
        submitBtn.addEventListener("click", handleALCSubmit);
    }
});

async function handleALCSubmit() {
    try {
        const buttons = document.querySelectorAll("button");
        buttons.forEach(button => button.disabled = true);
        
        if (typeof ShowLoader === "function") ShowLoader();

        // 1. Collect Header Data
        const headerData = {
            date: document.getElementById("header-date")?.value || new Date().toLocaleDateString(),
            time: document.getElementById("header-time")?.value || new Date().toLocaleTimeString(),
            plant: document.getElementById("header-plant")?.value || "Rajpura",
            line: document.getElementById("header-line")?.value || "N/A",
            shift: document.getElementById("header-shift")?.value || "Shift 1",
            execProd: document.getElementById("header-exec-prod")?.value || "",
            prevProduct: document.getElementById("header-prev-product")?.value || "",
            newProduct: document.getElementById("header-new-product")?.value || "",
            execQual: document.getElementById("header-exec-qual")?.value || "",
            qaShiftExec: (window.jQuery && $("#header-qa-shift-exec").length) ? ($("#header-qa-shift-exec").val() || "") : (document.getElementById("header-qa-shift-exec")?.value || "")
        };

        // Dynamically fetch UserName from SharePoint context if the custom global is missing
        let observedBy = typeof UserName !== 'undefined' && UserName ? UserName : "Unknown User";
        if (observedBy === "Unknown User" && typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.userDisplayName) {
            observedBy = _spPageContextInfo.userDisplayName;
        }

        // Dynamically fetch TourId from the URL Query Parameters
        const urlParams = new URLSearchParams(window.location.search);
        let tourId = urlParams.get('TourId');
        if (!tourId && typeof QualityTourId !== 'undefined' && QualityTourId) {
            tourId = QualityTourId;
        }
        if (!tourId) {
            tourId = "N/A";
        }

        const tourStartDate = typeof moment !== 'undefined' ? moment().format('MM-DD-YYYY') : new Date().toLocaleDateString();

        // 2. Collect Questions Data
        const collectedData = [];
        
        // Find all question cards (skipping the first card which is the header inputs)
        const cards = document.querySelectorAll(".plan-tour-body .bs-card");
        
        cards.forEach((card, index) => {
            // Skip the first card (Checklist Information)
            if (index === 0) return;

            const areaName = card.querySelector(".bs-card-title")?.innerText.trim() || "Unknown Area";
            const tableRows = card.querySelectorAll("tbody tr");

            tableRows.forEach(row => {
                const tds = row.querySelectorAll("td");
                if (tds.length >= 4) {
                    const criteria = tds[1].innerText.trim();
                    const complianceSelect = tds[2].querySelector("select");
                    const remarksInput = tds[3].querySelector("input");

                    const complianceScore = complianceSelect ? complianceSelect.value : "";
                    const remarks = remarksInput ? remarksInput.value : "";
                    
                    // Determine status based on compliance score
                    let status = "OK";
                    if (complianceScore.includes("00") || complianceScore.includes("Non-Compliant")) {
                        status = "Not Okay";
                    }

                    // 3. Map to Dataverse Schema
                    collectedData.push({
                        "cr3ea_qualitytourid@odata.bind": tourId && tourId !== "N/A" ? `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${String(tourId).replace(/[{}]/g, "").trim().toLowerCase()})` : null,
                        "cr3ea_title": `ALC_${tourStartDate}`,
                        "cr3ea_cycle": `Cycle-1`, // Hardcoded to Cycle 1 as per new UI
                        "cr3ea_shift": headerData.shift,
                        "cr3ea_tourstartdate": tourStartDate,
                        "cr3ea_observedby": observedBy,
                        "cr3ea_lineno": headerData.line,
                        "cr3ea_previousrunningvariety": headerData.prevProduct,
                        "cr3ea_runningvariety": headerData.newProduct,
                        "cr3ea_executivename": `Prod: ${headerData.execProd} | Qual: ${headerData.execQual}`, // Combined both executives
                        "cr3ea_area": areaName,
                        "cr3ea_criteria": criteria,
                        "cr3ea_status": status,
                        "cr3ea_defectcategory": complianceScore,
                        "cr3ea_defectremarks": remarks,
                        // Custom fields requested to be passed
                        "cr3ea_time": headerData.time,
                        "cr3ea_plant": headerData.plant,
                        "cr3ea_shiftexecutiveproduction": headerData.execProd,
                        "cr3ea_executivename": headerData.qaShiftExec || headerData.execQual || ""
                    });
                }
            });
        });

        if (collectedData.length === 0) {
            if (typeof HideLoader === "function") HideLoader();
            alert("No data to submit.");
            buttons.forEach(button => button.disabled = false);
            return;
        }

        console.log("Submitting 46 rows to Dataverse...", collectedData);

        // 4. Submit to Dataverse
        const AccessToken = typeof getAccessToken !== 'undefined' ? await getAccessToken() : null;
        if (!AccessToken) {
            console.error("No access token available. Simulating success for local dev.");
            if (typeof HideLoader === "function") HideLoader();
            alert(`${collectedData.length} records saved successfully (Simulated)`);
            buttons.forEach(button => button.disabled = false);
            return;
        }

        const headers = {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            "Prefer": "return=representation",
            "Authorization": `Bearer ${AccessToken}`
        };

        const apiVersion = "9.2";
        const tableName = QualityRajpura_Config.DATAVERSE_TABLES.ALC.CHILD;
        const apiUrl = `${typeof environmentUrl !== 'undefined' ? environmentUrl : ''}/api/data/v${apiVersion}/${tableName}`;

        const total = collectedData.length;
        for (let i = 0; i < total; i++) {
            const percent = Math.round((i / total) * 100);
            if (typeof ShowProgressLoader === "function") {
                ShowProgressLoader(percent, `Saving changeover records... (${i + 1} of ${total})`);
            }
            const record = collectedData[i];
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed to save record: ${response.status} - ${errText}`);
            }
            console.log('Record saved:', await response.json());
        }

        if (typeof ShowProgressLoader === "function") {
            ShowProgressLoader(100, "Finalizing clearance submission...");
        }

        if (typeof HideLoader === "function") HideLoader();
        alert(`${collectedData.length} records saved successfully!`);
        buttons.forEach(button => button.disabled = false);

    } catch (error) {
        if (typeof HideLoader === "function") HideLoader();
        console.error('Error saving records:', error);
        alert('Failed to save records. Please try again or check console for errors.');
        const buttons = document.querySelectorAll("button");
        buttons.forEach(button => button.disabled = false);
    }
}
