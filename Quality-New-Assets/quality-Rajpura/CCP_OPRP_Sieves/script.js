// Entry script for Rajpura CCP, OPRP, Sieves & Magnets Quality Tour
console.log("CCP_OPRP_Sieves script.js loaded");

$(document).ready(function () {
    // Resolve logged-in employee detail parameters using standard common module
    if (typeof getEmployeeDetails === "function") {
        getEmployeeDetails(EmployeeDetailsSuccess, EmployeeDetailsFailure);
    } else {
        // Fallback for local sandbox/testing
        CCP_OPRP_Main.init();
    }
});

function EmployeeDetailsSuccess(collEmployee) {
    if (collEmployee.length > 0) {
        PlantId = collEmployee[0].PlantId.toString();
        EmployeeName = collEmployee[0].Title;
        userDepratmentId = collEmployee[0].DepartmentId.toString();
        userRoleSequence = collEmployee[0].RoleSequence;
        userRoleName = collEmployee[0].RoleName;
        UserRoleId = collEmployee[0].RoleId;
        UserName = collEmployee[0].Title;
    }
    
    // Bootstrap form states
    CCP_OPRP_Main.init();
}

function EmployeeDetailsFailure() {
    console.warn("Failed to load SharePoint employee profiles. Resolving using sandbox context.");
    CCP_OPRP_Main.init();
}
