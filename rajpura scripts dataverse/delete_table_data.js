/**
 * =========================================================================
 * DATAVERSE TABLE DATA DELETION SCRIPT (PROD / UAT / DEV)
 * =========================================================================
 * 
 * Purpose:
 *   Deletes all records (or records matching a filter) from one or more
 *   specified Dataverse tables.
 * 
 * How to Run:
 *   1. Open any logged-in SharePoint page (e.g. /sites/PTMS_PRD/Pages/Home.aspx)
 *      or Power Apps Maker in your browser.
 *   2. Press F12 -> Open Console tab.
 *   3. Set the `TABLES_TO_CLEAR` array below to the table(s) you want to clear.
 *   4. Copy and paste this entire script into the console and hit Enter.
 *   5. Alternatively, once pasted, you can run anytime:
 *        clearDataverseTable("cr3ea_prod_rajpura_alcs");
 * 
 * =========================================================================
 * REFERENCE: RAJPURA TABLE NAMES
 * =========================================================================
 * 
 * PROD Tables:
 *   • Parent Tours                   : "cr3ea_prod_rajpura_quality_tours"
 *   • Area Line Clearance (ALC)      : "cr3ea_prod_rajpura_alcs"
 *   • Food Safety Checklist          : "cr3ea_prod_foodsafetychecklistforrajpuras"
 *   • Mixing & Baking                : "cr3ea_prod_rajpura_mixingandbakings"
 *   • Pkg Ops - Temp & Humidity      : "cr3ea_prod_rajpura_pkgops_temphumiditys"
 *   • Pkg Ops - Code Verification    : "cr3ea_prod_rajpura_pkgops_codeverifications"
 *   • Pkg Ops - PAPA                 : "cr3ea_prod_rajpura_pkgops_papas"
 *   • Pkg Ops - PQI Net Weight       : "cr3ea_prod_rajpura_pkgops_pqi_netweights"
 *   • Pkg Ops - PQI Evaluation       : "cr3ea_prod_rajpura_pkgops_pqi_evaluations"
 *   • Pkg Ops - Seal Integrity       : "cr3ea_prod_rajpura_pkgops_sealintegrities"
 *   • Pkg Ops - Quality Wall         : "cr3ea_prod_rajpura_pkgops_qualitywalls"
 *   • Pkg Ops - Cream Percentage     : "cr3ea_prod_rajpura_pkgops_creampercentages"
 *   • CCP / OPRP                     : "cr3ea_prod_rajpura_ccpoprps"
 *   • Sieves & Magnets               : "cr3ea_prod_rajpura_sievesmagnets"
 * 
 * UAT Tables (without prod_ prefix):
 *   • Parent Tours                   : "cr3ea_rajpura_quality_tours"
 *   • ALC                            : "cr3ea_rajpura_alcs"
 *   • Food Safety                    : "cr3ea_foodsafetychecklistforrajpuras"
 *   • Mixing & Baking                : "cr3ea_rajpura_mixingandbakings"
 *   • Pkg Ops - Cream Percentage     : "cr3ea_rajpura_pkgops_creampercentages"
 *   • CCP / OPRP                     : "cr3ea_rajpura_ccpoprps"
 *   • Sieves & Magnets               : "cr3ea_rajpura_sievesmagnets"
 * =========================================================================
 */

(async function () {
    // =========================================================================
    // 1. CONFIGURATION
    // =========================================================================

    // Dataverse Environment Base URL
    const BASE_URL = "https://orgea61b289.crm8.dynamics.com";
    const API_VERSION = "9.2";

    // Specify the table(s) to clear. Can be EntitySetName or LogicalName.
    // Example: ["cr3ea_prod_rajpura_alcs", "cr3ea_prod_rajpura_quality_tours"]
    const TABLES_TO_CLEAR = [
    ];

    // Optional: Add an OData $filter string if you only want to delete specific records.
    // Leave as "" to delete ALL records in the table.
    // Example: "cr3ea_plantid eq '2'" or "createdon lt 2026-10-01"
    const ODATA_FILTER = "";

    // Optional: Paste manual Bearer token if running outside of authenticated browser session.
    // Leave as "" to automatically detect token from current session.
    //const MANUAL_ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImRndlNEdks4QTVLeUt5cHB3MWRBd1RYRDNDQSIsImtpZCI6ImRndlNEdks4QTVLeUt5cHB3MWRBd1RYRDNDQSJ9.eyJhdWQiOiJodHRwczovL29yZ2VhNjFiMjg5LmFwaS5jcm04LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2FhNDRjNWMxLTU0NDgtNGU3NC04OGQ5LTE3ODM4YTZmOWQ1YS8iLCJpYXQiOjE3OTExOTM3NTUsIm5iZiI6MTc5MTE5Mzc1NSwiZXhwIjoxNzkxMTk3NjU1LCJhaW8iOiJrMk5nWUZnWjVKTzBZRys0c09XeEo3MGJ5bTJQL1YxWFZtOXl1RGQ5M25wZFd5OU82V0FBIiwiYXBwaWQiOiJmODNiMmU2OC00MzZjLTQxN2ItYjgwNy04NGVjYmNlYzhjYTMiLCJhcHBpZGFjciI6IjEiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9hYTQ0YzVjMS01NDQ4LTRlNzQtODhkOS0xNzgzOGE2ZjlkNWEvIiwiaWR0eXAiOiJhcHAiLCJvaWQiOiI1NGFhMTdlNS1mN2NiLTQ3NWEtYmE5Mi04Y2EyYTMwMjA5ZTgiLCJyaCI6IjEuQVZVQXdjVkVxa2hVZEU2STJSZURpbS1kV2djQUFBQUFBQUFBd0FBQUFBQUFBQUFBQUFCVkFBLiIsInN1YiI6IjU0YWExN2U1LWY3Y2ItNDc1YS1iYTkyLThjYTJhMzAyMDllOCIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJBUyIsInRpZCI6ImFhNDRjNWMxLTU0NDgtNGU3NC04OGQ5LTE3ODM4YTZmOWQ1YSIsInV0aSI6Ikt2ZG5aZFlGdUVLcUxzU1FodG5iQUEiLCJ2ZXIiOiIxLjAiLCJ4bXNfYWN0X2ZjdCI6IjkgMyIsInhtc19hdWRfZ3VpZCI6IjAwMDAwMDA3LTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMCIsInhtc19mdGQiOiJIS2Q3UDByblpfbGt6V1VpNnFCLWU0UHV4N21udkJONklTSU5yODdLSEJnQmFtRndZVzVsWVhOMExXUnpiWE0iLCJ4bXNfaWRyZWwiOiI3IDMwIiwieG1zX3JkIjoiMC40MkxsWUJKaURCVVM0V0FYRWppd2MtNnZoMEtmSEtmRU1sMW5fWFdJVFVpRWcxTkk0SWhiODRiSVpXYS1zLWZWc21ULVd2NVFTSVNEUTBpQW5RRUNEa0JwSVJFT2JpR0J1X3pDS3l2ZTEtV2xyQW1Ra1pRLTlRc0EiLCJ4bXNfc3ViX2ZjdCI6IjMgOSJ9.VG4KFJyLKE1xAJ1YdSZUu_FQpYWBnVlUs_S8GMQhsoC2P_Ah3uJy0YTuLLp-uNSB_4RVwLz2tALMQ3aTTIq1EeBdE_3ij92ISWhrDHpisD95KGQx-w51KX1vLTDd0-6vd7bKJvni19xT9Qr9J2nbrAFvqWgiQUHoLR9ri_xlrDoz3-FaTP8fUTRTiPyFw0H22_WMnfI03cWOdq3UrMStir_iZwLCVVM38LEiGVpnSybyNX5t62ImpTvaY-DIerU37mxcPqYOe-qmRhgqVB04P5CB-nUkbbeAIEM9DdNrn_PjmfDOX8PfofhkxVpCkN8gK9j4VS-4rbDbNO1ms1nZbg"
    // Batch deletion concurrency (number of parallel DELETE requests)
    const CONCURRENCY_CHUNK_SIZE = 10;

    // =========================================================================
    // 2. TOKEN RESOLVER
    // =========================================================================

    async function resolveAccessToken() {
        if (MANUAL_ACCESS_TOKEN && MANUAL_ACCESS_TOKEN.trim().length > 20) {
            return MANUAL_ACCESS_TOKEN.trim();
        }

        // Try getting token from active page DALs if available
        try {
            if (typeof QualityRajpura_Config !== "undefined" && typeof QualityRajpura_Config.getAccessToken === "function") {
                const tok = await QualityRajpura_Config.getAccessToken();
                if (tok) return tok;
            }
            if (typeof ALC_DAL !== "undefined" && typeof ALC_DAL.getAccessToken === "function") {
                const tok = await ALC_DAL.getAccessToken();
                if (tok) return tok;
            }
            if (typeof FoodSafety_DAL !== "undefined" && typeof FoodSafety_DAL.getAccessToken === "function") {
                const tok = await FoodSafety_DAL.getAccessToken();
                if (tok) return tok;
            }
        } catch (e) {
            // Ignore and fallback to storage search
        }

        // Search sessionStorage & localStorage for cached Bearer tokens
        if (typeof window !== "undefined") {
            const storages = [sessionStorage, localStorage];
            for (const store of storages) {
                if (!store) continue;
                for (let i = 0; i < store.length; i++) {
                    const key = store.key(i);
                    const val = store.getItem(key);
                    if (!val) continue;

                    // Direct token string
                    if (val.startsWith("eyJ") && val.split(".").length === 3) {
                        return val;
                    }

                    // ADAL / MSAL JSON cache objects
                    if (val.includes("secret") || val.includes("access_token") || val.includes("accessToken")) {
                        try {
                            const parsed = JSON.parse(val);
                            const token = parsed.secret || parsed.access_token || parsed.accessToken;
                            if (token && token.startsWith("eyJ")) {
                                return token;
                            }
                        } catch (e) {
                            // not JSON, continue
                        }
                    }
                }
            }
        }

        throw new Error("No Dataverse Access Token found. Please paste a valid Bearer token into MANUAL_ACCESS_TOKEN at the top of the script.");
    }

    // =========================================================================
    // 3. TABLE METADATA RESOLVER (Resolves EntitySetName & Primary ID Field)
    // =========================================================================

    async function resolveTableInfo(tableName, token) {
        const cleanName = tableName.trim().toLowerCase();

        // 1. Try querying EntityDefinitions with LogicalName
        const logicalUrl = `${BASE_URL}/api/data/v${API_VERSION}/EntityDefinitions(LogicalName='${cleanName}')?$select=EntitySetName,PrimaryIdAttribute,LogicalName`;
        try {
            const res = await fetch(logicalUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                }
            });
            if (res.ok) {
                const data = await res.json();
                return {
                    logicalName: data.LogicalName,
                    entitySetName: data.EntitySetName,
                    primaryIdAttribute: data.PrimaryIdAttribute
                };
            }
        } catch (e) {
            // Continue to fallback
        }

        // 2. Try querying EntityDefinitions filtering by EntitySetName
        const setUrl = `${BASE_URL}/api/data/v${API_VERSION}/EntityDefinitions?$filter=EntitySetName eq '${cleanName}'&$select=EntitySetName,PrimaryIdAttribute,LogicalName`;
        try {
            const res = await fetch(setUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0"
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.value && data.value.length > 0) {
                    return {
                        logicalName: data.value[0].LogicalName,
                        entitySetName: data.value[0].EntitySetName,
                        primaryIdAttribute: data.value[0].PrimaryIdAttribute
                    };
                }
            }
        } catch (e) {
            // Continue to fallback
        }

        // 3. Direct heuristic fallback
        let entitySetName = cleanName;
        if (!entitySetName.endsWith("s")) {
            entitySetName += "s";
        }
        let primaryId = cleanName.endsWith("s") ? cleanName.slice(0, -1) + "id" : cleanName + "id";

        return {
            logicalName: cleanName,
            entitySetName: entitySetName,
            primaryIdAttribute: primaryId
        };
    }

    // =========================================================================
    // 4. FETCH ALL RECORD IDs (Supports Pagination via @odata.nextLink)
    // =========================================================================

    async function fetchAllRecordIds(entitySetName, primaryIdField, filterQuery, token) {
        const records = [];
        let url = `${BASE_URL}/api/data/v${API_VERSION}/${entitySetName}?$select=${primaryIdField}`;
        if (filterQuery && filterQuery.trim().length > 0) {
            url += `&$filter=${encodeURIComponent(filterQuery.trim())}`;
        }

        console.log(`🔍 Querying records from '${entitySetName}'...`);

        while (url) {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    "Prefer": "odata.maxpagesize=5000"
                }
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Failed to fetch records from '${entitySetName}': ${res.status} ${res.statusText} - ${errText}`);
            }

            const data = await res.json();
            const items = data.value || [];

            for (const item of items) {
                let id = item[primaryIdField];
                if (!id) {
                    // Fallback: search any key ending in 'id' or extract from @odata.id
                    for (const k of Object.keys(item)) {
                        if (k.toLowerCase().endsWith("id") && !k.startsWith("@")) {
                            id = item[k];
                            break;
                        }
                    }
                    if (!id && item["@odata.id"]) {
                        const m = item["@odata.id"].match(/\(([0-9a-fA-F-]{36})\)/);
                        if (m) id = m[1];
                    }
                }
                if (id) {
                    records.push(String(id).replace(/[{}]/g, "").trim().toLowerCase());
                }
            }

            url = data["@odata.nextLink"] || null;
            if (url) {
                console.log(`   Fetched ${records.length} records so far, loading next page...`);
            }
        }

        return records;
    }

    // =========================================================================
    // 5. DELETE SINGLE RECORD
    // =========================================================================

    async function deleteRecord(entitySetName, recordId, token) {
        const cleanId = String(recordId).replace(/[{}]/g, "").trim().toLowerCase();
        const url = `${BASE_URL}/api/data/v${API_VERSION}/${entitySetName}(${cleanId})`;

        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0"
            }
        });

        if (res.status === 204 || res.status === 200 || res.status === 404) {
            return { success: true, id: cleanId };
        } else {
            const errText = await res.text();
            return { success: false, id: cleanId, status: res.status, error: errText };
        }
    }

    // =========================================================================
    // 6. MAIN TABLE CLEAR FUNCTION
    // =========================================================================

    async function clearTable(tableName, filterQuery) {
        console.log("\n=========================================================================");
        console.log(`🚀 STARTING TABLE DATA PURGE: [ ${tableName} ]`);
        console.log("=========================================================================");

        const token = await resolveAccessToken();
        const info = await resolveTableInfo(tableName, token);

        console.log(`📋 Resolved Metadata:`);
        console.log(`   • Entity Set Name     : ${info.entitySetName}`);
        console.log(`   • Logical Name        : ${info.logicalName}`);
        console.log(`   • Primary ID Field    : ${info.primaryIdAttribute}`);
        if (filterQuery) {
            console.log(`   • Filter Query        : ${filterQuery}`);
        } else {
            console.log(`   • Filter Query        : NONE (Targeting ALL records)`);
        }

        const recordIds = await fetchAllRecordIds(info.entitySetName, info.primaryIdAttribute, filterQuery, token);
        const total = recordIds.length;

        if (total === 0) {
            console.log(`ℹ️  No records found in '${info.entitySetName}'. Nothing to delete.`);
            console.log("=========================================================================\n");
            return { table: info.entitySetName, total: 0, deleted: 0, failed: 0 };
        }

        console.log(`\n⚠️  Found ${total} record(s) to DELETE from '${info.entitySetName}'.`);
        console.log(`⏳ Commencing parallel deletion in batches of ${CONCURRENCY_CHUNK_SIZE}...`);

        let deletedCount = 0;
        let failedCount = 0;
        const failedRecords = [];

        for (let i = 0; i < total; i += CONCURRENCY_CHUNK_SIZE) {
            const chunk = recordIds.slice(i, i + CONCURRENCY_CHUNK_SIZE);
            const results = await Promise.all(chunk.map(id => deleteRecord(info.entitySetName, id, token)));

            for (const r of results) {
                if (r.success) {
                    deletedCount++;
                } else {
                    failedCount++;
                    failedRecords.push(r);
                }
            }

            const current = Math.min(i + CONCURRENCY_CHUNK_SIZE, total);
            const pct = ((current / total) * 100).toFixed(1);
            console.log(`   [Progress] ${current}/${total} (${pct}%) — Deleted: ${deletedCount}, Failed: ${failedCount}`);
        }

        console.log("\n-------------------------------------------------------------------------");
        console.log(`🏁 FINISHED: [ ${info.entitySetName} ]`);
        console.log(`   • Total Found   : ${total}`);
        console.log(`   • Successfully Deleted : ${deletedCount}`);
        console.log(`   • Failed        : ${failedCount}`);

        if (failedCount > 0) {
            console.warn(`⚠️ First few failures:`, failedRecords.slice(0, 5));
        }

        console.log("=========================================================================\n");
        return { table: info.entitySetName, total, deleted: deletedCount, failed: failedCount };
    }

    // Expose global helper function on window so user can call clearDataverseTable("tableName") anytime in console
    if (typeof window !== "undefined") {
        window.clearDataverseTable = async function (tableInput, customFilter) {
            try {
                return await clearTable(tableInput, customFilter || "");
            } catch (err) {
                console.error("❌ Error clearing table:", err);
            }
        };
    }

    // =========================================================================
    // 7. EXECUTION
    // =========================================================================

    try {
        console.log("=========================================================================");
        console.log("🧹 DATAVERSE BULK DATA DELETION TOOL");
        console.log("=========================================================================");

        if (!TABLES_TO_CLEAR || TABLES_TO_CLEAR.length === 0) {
            console.warn("⚠️ No tables specified in `TABLES_TO_CLEAR`. Set table names at the top of script.");
            return;
        }

        for (const tbl of TABLES_TO_CLEAR) {
            await clearTable(tbl, ODATA_FILTER);
        }

        console.log("🎉 All requested tables have been processed!");
        console.log("💡 Tip: You can also clear any table directly in this console anytime by running:");
        console.log('   clearDataverseTable("cr3ea_prod_rajpura_alcs");');
        console.log("=========================================================================\n");

    } catch (globalErr) {
        console.error("❌ Fatal Error during deletion execution:", globalErr);
    }
})();
