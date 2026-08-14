// Shared Header Component
console.log("Header Component loaded");

const HeaderComponent = {
    render: function (containerId) {
        // Resolve target header wrappers across checklist views
        const targets = containerId ? [containerId] : [
            "welcome-header-wrapper",
            "info-header-wrapper",
            "ppe-header-wrapper",
            "gmp-header-wrapper",
            "pci-header-wrapper",
            "dashboard-header-wrapper"
        ];

        const dateStr = FoodSafety_Main.state.tourStartDate 
            ? moment(FoodSafety_Main.state.tourStartDate).format("DD-MM-YYYY")
            : moment().format("DD-MM-YYYY");
            
        const shiftText = FoodSafety_Main.state.selectedShift || "Shift 1";
        const titleText = FoodSafety_Main.state.varTourID 
            ? `${FoodSafety_Main.state.selectedChecklistType.toUpperCase()} (RAJPURA)`
            : "FOOD SAFETY CHECKLIST (RAJPURA)";

        const areaBadgeHtml = (FoodSafety_Main.state.selectedChecklistType === "PCI Checklist" && FoodSafety_Main.state.selectedArea)
            ? `<span class="badge badge-info" id="areaBadge" style="background-color: #6366f1; color: #ffffff; font-weight: bold; margin-right: 5px;">${FoodSafety_Main.state.selectedArea}</span>`
            : "";

        targets.forEach(tid => {
            const container = document.getElementById(tid);
            if (!container) return;

            container.innerHTML = `
                <div class="plan-tour-header" style="margin-bottom: 20px;">
                    <div class="tour-header-info-wrapper" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <h3 class="tour-header-title" style="margin: 0; font-weight: bold; font-size: 18px; color: #0f172a;">${titleText}</h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${areaBadgeHtml}
                            <span class="badge badge-success" id="shiftBadge" style="background-color: #98d6d8; color: #ffffff; font-weight: bold;">${shiftText}</span>
                            <span class="tour-date" id="currentDay" style="font-size: 13px; color: #475569; font-weight: 500;">${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
};
