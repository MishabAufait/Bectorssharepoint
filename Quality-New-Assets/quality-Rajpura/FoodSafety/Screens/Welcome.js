// Screen 1: Welcome / Selection Screen
console.log("Welcome Screen loaded");

const WelcomeScreen = {
    init: function () {
        console.log("Initializing Welcome Screen...");
        
        // 1. Pre-populate Shift dropdown using stored localStorage value from welcome page
        const cachedShift = localStorage.getItem("shiftValue") || sessionStorage.getItem("shiftValue");
        if (cachedShift) {
            console.log(`Resolved pre-selected shift from welcome flow: ${cachedShift}`);
            document.getElementById("welcomeShiftSelect").value = cachedShift;
        }

        // 2. Initialize JQuery Select2 UI elements
        DropdownComponent.init("welcomeFoodSafetySelect");
        DropdownComponent.init("welcomeShiftSelect");

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
