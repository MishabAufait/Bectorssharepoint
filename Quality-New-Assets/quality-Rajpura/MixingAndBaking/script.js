// Mixing & Baking Entry Point Initialization
console.log("Mixing & Baking entry point loaded");

function startMixingBakingApp() {
    if (typeof MixingBaking_Main !== "undefined" && MixingBaking_Main.init) {
        MixingBaking_Main.init().catch(err => {
            console.error("Error starting Mixing & Baking module:", err);
        });
    } else {
        console.warn("MixingBaking_Main not found yet, retrying in 50ms...");
        setTimeout(startMixingBakingApp, 50);
    }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(startMixingBakingApp, 1);
} else {
    document.addEventListener("DOMContentLoaded", startMixingBakingApp);
}
