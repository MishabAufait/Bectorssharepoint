// Screen 1: Welcome / Selection Screen
console.log("Welcome Screen loaded");

const WelcomeScreen = {
    init: function () {
        console.log("Initializing Welcome Screen...");
        
        // Helper to determine current shift by time if not already stored
        const getAutoShift = () => {
            const now = new Date();
            const totalMinutes = now.getHours() * 60 + now.getMinutes();
            if (totalMinutes >= 420 && totalMinutes < 900) return "Shift 1";
            if (totalMinutes >= 900 && totalMinutes < 1380) return "Shift 2";
            return "Shift 3";
        };

        // 1. Pre-populate Shift dropdown using stored localStorage value from welcome page or time
        const cachedShift = (sessionStorage.getItem("shiftValue") || localStorage.getItem("shiftValue") || getAutoShift()).replace("-", " ");
        FoodSafety_Main.state.selectedShift = cachedShift;
        const shiftEl = document.getElementById("welcomeShiftSelect");
        if (shiftEl) {
            shiftEl.value = cachedShift;
        }

        // 2. Initialize JQuery Select2 UI elements
        DropdownComponent.init("welcomeFoodSafetySelect");
        DropdownComponent.init("welcomeShiftSelect");

        if (shiftEl) {
            $(shiftEl).off("change.shift").on("change.shift", function () {
                const newShift = (this.value || "Shift 1").replace("-", " ");
                FoodSafety_Main.state.selectedShift = newShift;
                sessionStorage.setItem("shiftValue", newShift);
                localStorage.setItem("shiftValue", newShift);
                const shiftBadges = document.querySelectorAll("#shiftBadge");
                shiftBadges.forEach(b => b.innerText = newShift);
            });
        }

        // 3. Render Component Header
        HeaderComponent.render("welcome-header-wrapper");
    },

    // Continue to Checklist Info (Screen 2)
    continue: function () {
        const foodSafetyType = document.getElementById("welcomeFoodSafetySelect").value;
        const shift = document.getElementById("welcomeShiftSelect").value;

        if (!foodSafetyType || !shift) {
            alert("Please make a valid selection.");
            return;
        }

        // Save selected choices to global orchestrator state
        FoodSafety_Main.state.selectedChecklistType = foodSafetyType;
        FoodSafety_Main.state.selectedShift = shift;

        // Navigate to ChecklistInformation (Screen 2)
        FoodSafety_Main.navigateTo("screen-checklist-info");
        
        // Initialize Screen 2
        if (typeof ChecklistInformationScreen !== 'undefined' && ChecklistInformationScreen.init) {
            ChecklistInformationScreen.init();
        }
    },

    // Go to Analytics Dashboard (View 4)
    viewDashboard: function () {
        FoodSafety_Main.navigateTo("screen-dashboard");
        if (typeof DashboardScreen !== 'undefined' && DashboardScreen.init) {
            DashboardScreen.init();
        }
    }
};
