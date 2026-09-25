const fs = require('fs');
const path = require('path');

// 1. Update dashboard.js
const dashPath = 'Quality-New-Assets/quality-Rajpura/common/js/dashboard.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');
const dashIsCrlf = dashContent.includes('\r\n');
let normDash = dashContent.replace(/\r\n/g, '\n');

// Clean user setup block
const targetUserSetup = `        const devKeys = ["mishab", "aufait", "admin", "developer", "tester", "mbfsl", "ptms_uat", "ptms_prd"];
        const isGlobalDevOrAdmin = devKeys.some(d => 
            myUserEmails.some(e => e.includes(d)) || 
            myUserNames.some(n => n.includes(d))
        );

        const isMatchUser = (val) => {
            if (!val) return false;
            if (isGlobalDevOrAdmin) return true;
            const raw = String(val).toLowerCase().trim();
            if (!raw || raw === "n/a" || raw === "none" || raw === "production team" || raw === "qa team") return false;
            const resolved = raw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(raw).toLowerCase().trim() : raw;
            
            for (const em of myUserEmails) {
                if (!em) continue;
                if (raw === em || em.includes(raw) || raw.includes(em)) return true;
                const strippedEm = em.split("@")[0].replace(/[^a-z0-9]/g, "");
                const cleanRaw = raw.replace(/[^a-z0-9]/g, "");
                if (strippedEm && cleanRaw && (cleanRaw === strippedEm || strippedEm.includes(cleanRaw) || cleanRaw.includes(strippedEm))) return true;
            }
            
            for (const nm of myUserNames) {
                if (!nm) continue;
                if (raw === nm || nm.includes(raw) || raw.includes(nm)) return true;
                if (resolved === nm || nm.includes(resolved) || resolved.includes(nm)) return true;
                const cleanNm = nm.replace(/[^a-z0-9]/g, "");
                const cleanRaw = raw.replace(/[^a-z0-9]/g, "");
                const cleanRes = resolved.replace(/[^a-z0-9]/g, "");
                if (cleanNm && cleanRaw && (cleanRaw === cleanNm || cleanRaw.includes(cleanNm) || cleanNm.includes(cleanRaw))) return true;
                if (cleanNm && cleanRes && (cleanRes === cleanNm || cleanRes.includes(cleanNm) || cleanNm.includes(cleanRes))) return true;
            }
            return false;
        };`;

const replUserSetup = `        const isMatchUser = (val) => {
            if (!val) return false;
            const raw = String(val).toLowerCase().trim();
            if (!raw || raw === "n/a" || raw === "none" || raw === "production team" || raw === "qa team") return false;
            const resolved = raw.includes("@") ? ALC_Dashboard.resolveQaNameFromEmail(raw).toLowerCase().trim() : raw;
            
            for (const em of myUserEmails) {
                if (!em) continue;
                if (raw === em || em.includes(raw) || raw.includes(em)) return true;
                const strippedEm = em.split("@")[0].replace(/[^a-z0-9]/g, "");
                const cleanRaw = raw.replace(/[^a-z0-9]/g, "");
                if (strippedEm && cleanRaw && (cleanRaw === strippedEm || (cleanRaw.length >= 3 && strippedEm.length >= 3 && (cleanRaw.includes(strippedEm) || strippedEm.includes(cleanRaw))))) return true;
            }
            
            for (const nm of myUserNames) {
                if (!nm) continue;
                if (raw === nm || nm.includes(raw) || raw.includes(nm)) return true;
                if (resolved === nm || nm.includes(resolved) || resolved.includes(nm)) return true;
                const cleanNm = nm.replace(/[^a-z0-9]/g, "");
                const cleanRaw = raw.replace(/[^a-z0-9]/g, "");
                const cleanRes = resolved.replace(/[^a-z0-9]/g, "");
                if (cleanNm && cleanRaw && (cleanRaw === cleanNm || (cleanRaw.length >= 3 && cleanNm.length >= 3 && (cleanRaw.includes(cleanNm) || cleanNm.includes(cleanRaw))))) return true;
                if (cleanNm && cleanRes && (cleanRes === cleanNm || (cleanRes.length >= 3 && cleanNm.length >= 3 && (cleanRes.includes(cleanNm) || cleanNm.includes(cleanRes))))) return true;
            }
            return false;
        };`;

if (normDash.includes(targetUserSetup)) {
    normDash = normDash.replace(targetUserSetup, replUserSetup);
    console.log("Cleaned user setup in dashboard.js");
} else {
    console.log("targetUserSetup not found in dashboard.js");
}

// Clean Packaging Operations role matching
const targetPkgOps = `                    const qaValues = [t.cr3ea_assigned_qa, t.cr3ea_tourby, t.cr3ea_qaexecutive].filter(Boolean);
                    const isAssignedQA = qaValues.some(isMatchUser) || isGlobalDevOrAdmin;

                    const isQaStatus = (status === "Pending QA" || status === "QA In Progress" || status.startsWith("QA In Progress") || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification" || status === "In Progress" || status === "InProgress-paused");
                    if (isQaStatus && isAssignedQA) {
                        isMyTask = true;
                    }

                    const prodValues = [t.cr3ea_shiftexecutiveproduction, t.cr3ea_shiftexecutive, t.cr3ea_production_incharge, t.cr3ea_observedby].filter(Boolean);
                    const isUserProdExec = prodValues.some(isMatchUser) || isGlobalDevOrAdmin;

                    const isUserProd = Boolean(
                        isUserProdExec ||
                        isGlobalDevOrAdmin ||
                        (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("prod") || DepartmentNameLeftNavi.toLowerCase().includes("pack") || DepartmentNameLeftNavi.toLowerCase().includes("baking") || DepartmentNameLeftNavi.toLowerCase().includes("mixing"))) ||
                        (typeof RoleName === "string" && RoleName.toLowerCase().includes("prod"))
                    );

                    const isUserQA = Boolean(
                        isAssignedQA ||
                        isGlobalDevOrAdmin ||
                        (typeof DepartmentNameLeftNavi === "string" && (DepartmentNameLeftNavi.toLowerCase().includes("qa") || DepartmentNameLeftNavi.toLowerCase().includes("quality"))) ||
                        (typeof RoleName === "string" && (RoleName.toLowerCase().includes("qa") || RoleName.toLowerCase().includes("quality")))
                    );

                    if (status === "Escalated") {
                        if (isUserProdExec || isUserProd) {
                            isMyTask = true;
                        }
                    }

                    const isProdStatus = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production");
                    if (isProdStatus && (isUserProdExec || isUserProd)) {
                        isMyTask = true;
                    }`;

const replPkgOps = `                    const qaValues = [t.cr3ea_assigned_qa, t.cr3ea_tourby, t.cr3ea_qaexecutive].filter(Boolean);
                    const isAssignedQA = qaValues.some(isMatchUser);

                    const isQaStatus = (status === "Pending QA" || status === "QA In Progress" || status.startsWith("QA In Progress") || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification" || status === "In Progress" || status === "InProgress-paused");
                    if (isQaStatus && isAssignedQA) {
                        isMyTask = true;
                    }

                    const prodValues = [t.cr3ea_shiftexecutiveproduction, t.cr3ea_shiftexecutive, t.cr3ea_production_incharge, t.cr3ea_observedby].filter(Boolean);
                    const isUserProdExec = prodValues.some(isMatchUser);

                    if (status === "Escalated") {
                        if (isUserProdExec) {
                            isMyTask = true;
                        }
                    }

                    const isProdStatus = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production");
                    if (isProdStatus && isUserProdExec) {
                        isMyTask = true;
                    }`;

if (normDash.includes(targetPkgOps)) {
    normDash = normDash.replace(targetPkgOps, replPkgOps);
    console.log("Updated Packaging Operations role matching in dashboard.js");
} else {
    console.log("targetPkgOps not found in dashboard.js");
}

// Clean Packaging Operations isClickable check
const targetPkgClick = `                    const isPkgReverify = (status.includes("Pending Re-Verification") || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    const isPkgCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    const isPkgInProgress = (status === "QA In Progress" || status.startsWith("QA In Progress") || status === "In Progress" || status === "InProgress-paused" || status === "Pending QA");
                    const isPkgProdPending = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production" || status === "Production Action Needed");
                    let isClickable = true;
                    if (isPkgCancelled) {
                        isClickable = false;
                    } else if (isPkgInProgress && !isAssignedQA && !isUserQA && !isMyTask) {
                        isClickable = false;
                    } else if (isPkgReverify && !isAssignedQA && !isUserQA && !isMyTask) {
                        isClickable = false;
                    } else if (isPkgProdPending && !isUserProdExec && !isUserProd && !isMyTask) {
                        isClickable = false;
                    }`;

const replPkgClick = `                    const isPkgReverify = (status.includes("Pending Re-Verification") || status === "Pending Re-Verification" || status === "Success - Pending Re-Verification" || status === "Failed - Pending Re-Verification");
                    const isPkgCancelled = String(status).toLowerCase().includes("cancel") || String(t.cr3ea_processstatus || "").toLowerCase().includes("cancel");
                    const isPkgInProgress = (status === "QA In Progress" || status.startsWith("QA In Progress") || status === "In Progress" || status === "InProgress-paused" || status === "Pending QA");
                    const isPkgProdPending = (status.includes("Pending Production") || status.includes("Pending Observation") || status === "Failed - Pending Production" || status === "Success - Pending Production" || status === "Production Action Needed");
                    let isClickable = true;
                    if (isPkgCancelled) {
                        isClickable = false;
                    } else if (isPkgInProgress && !isAssignedQA) {
                        isClickable = false;
                    } else if (isPkgReverify && !isAssignedQA) {
                        isClickable = false;
                    } else if (isPkgProdPending && !isUserProdExec) {
                        isClickable = false;
                    }`;

if (normDash.includes(targetPkgClick)) {
    normDash = normDash.replace(targetPkgClick, replPkgClick);
    console.log("Updated Packaging Operations click matching in dashboard.js");
} else {
    console.log("targetPkgClick not found in dashboard.js");
}

// Clean Food Safety
normDash = normDash.replace(
    'const isAssignedQA = qaValues.some(isMatchUser) || isGlobalDevOrAdmin;',
    'const isAssignedQA = qaValues.some(isMatchUser);'
);

// Clean Mixing & Baking
normDash = normDash.replace(
    'const isAssignedQA = qaValues.some(isMatchUser) || isGlobalDevOrAdmin;',
    'const isAssignedQA = qaValues.some(isMatchUser);'
);

// Clean CCP
normDash = normDash.replace(
    'const isAssignedQA = qaValues.some(isMatchUser) || isGlobalDevOrAdmin;',
    'const isAssignedQA = qaValues.some(isMatchUser);'
);
normDash = normDash.replace(
    'const isUserProdExec = prodValues.some(isMatchUser) || isGlobalDevOrAdmin ||',
    'const isUserProdExec = prodValues.some(isMatchUser) ||'
);

// Clean ALC
normDash = normDash.replace(
    'const isUserEscalationManager = isGlobalDevOrAdmin || (currentUserEmail && escalationEmails.includes(currentUserEmail));',
    'const isUserEscalationManager = Boolean(currentUserEmail && escalationEmails.includes(currentUserEmail));'
);
normDash = normDash.replace(
    'const isUserEscalationManagerByName = isGlobalDevOrAdmin || (currentUserName && escalationEmails.some(email => email.includes(currentUserName)));',
    'const isUserEscalationManagerByName = Boolean(currentUserName && escalationEmails.some(email => email.includes(currentUserName)));'
);
normDash = normDash.replace(
    'const isUserProdExec = prodValues.some(isMatchUser) || isGlobalDevOrAdmin;',
    'const isUserProdExec = prodValues.some(isMatchUser);'
);

fs.writeFileSync(dashPath, dashIsCrlf ? normDash.replace(/\n/g, '\r\n') : normDash, 'utf8');
console.log("dashboard.js successfully updated with strict permissions!");

// 2. Update PackagingOperations/js/state-machine.js
const smPath = 'Quality-New-Assets/quality-Rajpura/PackagingOperations/js/state-machine.js';
let smContent = fs.readFileSync(smPath, 'utf8');
const smIsCrlf = smContent.includes('\r\n');
let normSm = smContent.replace(/\r\n/g, '\n');

// Update calculateRoles in state-machine.js to accurately match user without dummy devKeys
const targetSmCalc = `        // Developer / Admin check
        const devKeys = ["mishab", "aufait", "admin", "developer", "tester", "mbfsl", "ptms_uat", "ptms_prd"];
        const isDev = devKeys.some(d => 
            this.currentUserEmail.includes(d) || 
            this.currentUserName.includes(d) || 
            this.currentUserLogin.includes(d)
        );
        this.isDev = isDev;

        const isUserQA = isAssignedQA || isConfigQA || isDeptQA || isDev;
        const isUserProd = isAssignedProd || isConfigProd || isDeptProd || isDev;

        this.hasAssignedQA = hasAssignedQA;
        this.hasAssignedProd = hasAssignedProd;
        this.isAssignedQA = isAssignedQA;
        this.isAssignedProd = isAssignedProd;
        this.isShiftExec = isAssignedProd;`;

const replSmCalc = `        this.isDev = false;
        const isUserQA = isAssignedQA || isConfigQA || isDeptQA;
        const isUserProd = isAssignedProd || isConfigProd || isDeptProd;

        this.hasAssignedQA = hasAssignedQA;
        this.hasAssignedProd = hasAssignedProd;
        this.isAssignedQA = isAssignedQA;
        this.isAssignedProd = isAssignedProd;
        this.isShiftExec = isAssignedProd;`;

if (normSm.includes(targetSmCalc)) {
    normSm = normSm.replace(targetSmCalc, replSmCalc);
    console.log("Cleaned devKeys in state-machine.js");
} else {
    console.log("targetSmCalc not found in state-machine.js");
}

fs.writeFileSync(smPath, smIsCrlf ? normSm.replace(/\n/g, '\r\n') : normSm, 'utf8');
console.log("state-machine.js successfully updated!");
