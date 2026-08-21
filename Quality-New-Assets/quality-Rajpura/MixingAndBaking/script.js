// Mixing & Baking Entry Point Initialization
console.log("Mixing & Baking entry point loaded");

document.addEventListener("DOMContentLoaded", async function () {
    try {
        await MixingBaking_Main.init();
    } catch (error) {
        console.error("Error starting Mixing & Baking module:", error);
    }
});
