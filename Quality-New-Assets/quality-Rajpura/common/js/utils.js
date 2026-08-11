// Common utility functions for Rajpura Quality forms
console.log("Rajpura Common Utils Loaded");

// Global Quality Rajpura IDs configuration
const QualityRajpura_Config = {
    PLANT_ID: "14",
    PLANT_NAME: "Rajpura",
    QUALITY_DEPT_IDS: ["80", "81", "135"]
};

// Export globally for standard script tags
window.QualityRajpura_Config = QualityRajpura_Config;

// Example: function to handle date formatting
function formatRajpuraDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}
