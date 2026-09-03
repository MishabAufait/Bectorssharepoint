// =============================================================
// MASTER DATAVERSE COLUMN SETUP: ALL PACKAGING OPERATIONS TABLES (NON-PROD / UAT)
// =============================================================
// This script:
// 1. Fetches all existing attributes on each Packaging Operations UAT table
// 2. Automatically DELETES all previous/outdated legacy columns
// 3. Creates all fresh, working columns matching DEV
// 4. Publishes table customizations
// =============================================================

// =============================================================
// MANUAL CONFIGURATION
// =============================================================
const baseUrl = "https://orgea61b289.crm8.dynamics.com";
const accessToken = "PASTE_YOUR_ACCESS_TOKEN_HERE";

(async function setupAndCleanAllPackagingOperationsColumns() {
  console.log("===============================================================");
  console.log("🚀 STARTING: CLEAN PREVIOUS & SYNC NEW DATAVERSE COLUMNS (NON-PROD UAT)");
  console.log("===============================================================");

  if (!accessToken || accessToken === "PASTE_YOUR_ACCESS_TOKEN_HERE") {
    alert("❌ Please paste your valid Dataverse accessToken in the accessToken variable before running.");
    console.error("❌ Missing valid accessToken.");
    return;
  }

  const tableDefinitions = [
    // -------------------------------------------------------------
    // 1. TEMPERATURES & HUMIDITY
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_temphumidity",
      displayName: "05_PKGOPS_TEMP_HUMIDITY",
      previousColumnsToDelete: [
        "cr3ea_ambienttemp",
        "cr3ea_ambienthumidity",
        "cr3ea_doughroomtemp",
        "cr3ea_doughroomhumidity",
        "cr3ea_coldroom1temp",
        "cr3ea_coldroom2temp"
      ],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_pkglinetemp", Display: "Packaging Line Temp", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_pkglinehumidity", Display: "Packaging Line Humidity", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coolingtunneltemp", Display: "Cooling Tunnel Temp", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_creamroomtemp", Display: "Cream Room Temp", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coldstorage1nbtemp", Display: "Cold Storage 1 Temp NB", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coldstorage2nbtemp", Display: "Cold Storage 2 Temp NB", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_flavourroomtemp", Display: "Flavour Room Temp", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_dhroomhumidity", Display: "DH Room Humidity", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coldroom1obtemp", Display: "Cold Room 1 Temp OB", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coldroom2obtemp", Display: "Cold Room 2 Temp OB", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_coldroom3obtemp", Display: "Cold Room 3 Temp OB", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_deepfreezeryeasttemp", Display: "Deep Freezer Yeast Temp", Type: "String", MaxLength: 50 }
      ]
    },

    // -------------------------------------------------------------
    // 2. CODE VERIFICATION
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_codeverification",
      displayName: "06_PKGOPS_CODE_VERIFICATION",
      previousColumnsToDelete: [
        "cr3ea_product",
        "cr3ea_samplesize",
        "cr3ea_status",
        "cr3ea_lineno",
        "cr3ea_usebydate",
        "cr3ea_mrp",
        "cr3ea_usp"
      ],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 150 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_batchno", Display: "Batch No", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_pkd", Display: "PKD", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_expirydate", Display: "Expiry Date", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_noofsamples", Display: "No of Samples", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_defecttype", Display: "Defect Type", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_defectcount", Display: "Defect Count", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_codepictureurl", Display: "Code Picture URL", Type: "String", MaxLength: 500 },
        { SchemaName: "cr3ea_deviationstatus", Display: "Deviation Status", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_actiontaken", Display: "Action Taken", Type: "String", MaxLength: 2000 }
      ]
    },

    // -------------------------------------------------------------
    // 3. PAPA
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_papa",
      displayName: "07_PKGOPS_PAPA",
      previousColumnsToDelete: [
        "cr3ea_product",
        "cr3ea_evaluationtype",
        "cr3ea_defectcategory",
        "cr3ea_defectdetail"
      ],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 150 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_noofsamples", Display: "No of Samples", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_defecttype", Display: "Defect Type", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_defectcount", Display: "Defect Count", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_defectwisepercentage", Display: "Defectwise Percentage", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_overalldefectpercentage", Display: "Overall Defect Percentage", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_deviationstatus", Display: "Deviation Status", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_actiontaken", Display: "Action Taken", Type: "String", MaxLength: 2000 }
      ]
    },

    // -------------------------------------------------------------
    // 4. PQI NET WEIGHT
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_pqi_netweight",
      displayName: "08_PKGOPS_PQI_NETWEIGHT",
      previousColumnsToDelete: [],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 150 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_averageweight", Display: "Average Weight", Type: "Decimal", Precision: 2 },
        { SchemaName: "cr3ea_giveaway", Display: "Giveaway", Type: "Decimal", Precision: 2 },
        ...Array.from({ length: 32 }, (_, i) => ({
          SchemaName: `cr3ea_sampleweight${i + 1}`,
          Display: `Sample Weight ${i + 1}`,
          Type: "Decimal",
          Precision: 2
        }))
      ]
    },

    // -------------------------------------------------------------
    // 5. PQI EVALUATION
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_pqi_evaluation",
      displayName: "09_PKGOPS_PQI_EVALUATION",
      previousColumnsToDelete: [],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_evaluationtype", Display: "Evaluation Type", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 150 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_pkd", Display: "PKD", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_batchcode", Display: "Batch Code", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_samplenumber", Display: "Sample Number", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_sampleresult", Display: "Sample Result", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_defectcategory", Display: "Defect Category", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_defectdetail", Display: "Defect Detail", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_batchcodepictureurl", Display: "Batch Code Picture URL", Type: "String", MaxLength: 500 },
        { SchemaName: "cr3ea_deviationstatus", Display: "Deviation Status", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_actiontaken", Display: "Action Taken", Type: "String", MaxLength: 2000 }
      ]
    },

    // -------------------------------------------------------------
    // 6. SEAL INTEGRITY
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_sealintegrity",
      displayName: "10_PKGOPS_SEAL_INTEGRITY",
      previousColumnsToDelete: [
        "cr3ea_noofpackschecked",
        "cr3ea_pressureheld",
        "cr3ea_holdingtime"
      ],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 150 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_machineno", Display: "Machine No", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_samplequantity", Display: "Sample Quantity", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_noofleakage", Display: "No of Leakage", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_leakagetype", Display: "Leakage Type", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_deviationstatus", Display: "Deviation Status", Type: "String", MaxLength: 50 },
        { SchemaName: "cr3ea_actiontaken", Display: "Action Taken", Type: "String", MaxLength: 2000 }
      ]
    },

    // -------------------------------------------------------------
    // 7. QUALITY WALL
    // -------------------------------------------------------------
    {
      tableName: "cr3ea_rajpura_pkgops_qualitywall",
      displayName: "11_PKGOPS_QUALITY_WALL",
      previousColumnsToDelete: [],
      newColumns: [
        { SchemaName: "cr3ea_name", Display: "Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_productname", Display: "Product Name", Type: "String", MaxLength: 250 },
        { SchemaName: "cr3ea_lineno", Display: "Line No", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_pkdbatchno", Display: "PKD/Batch No", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_facilitator", Display: "Facilitator", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_sku", Display: "SKU", Type: "String", MaxLength: 100 },
        { SchemaName: "cr3ea_typeofqualitywall", Display: "Type of Quality Wall", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_memberspresent", Display: "Members Present", Type: "String", MaxLength: 500 },
        { SchemaName: "cr3ea_packappearancerating", Display: "Pack Appearance Rating", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_sealingqualityrating", Display: "Sealing Quality Rating", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_codingrating", Display: "Coding Rating", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_overallrating", Display: "Overall Rating", Type: "String", MaxLength: 70 },
        { SchemaName: "cr3ea_remarks", Display: "Remarks", Type: "String", MaxLength: 1000 }
      ]
    }
  ];

  for (const tableDef of tableDefinitions) {
    console.log(`\n===============================================================`);
    console.log(`📋 Processing Table: ${tableDef.tableName} (${tableDef.displayName})`);
    console.log(`===============================================================`);

    // STEP 1: Query existing attributes to find IDs
    const attrUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableDef.tableName}')/Attributes?$select=LogicalName,MetadataId,IsCustomAttribute`;
    let existingAttrs = [];
    try {
      const getRes = await fetch(attrUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });
      if (getRes.ok) {
        const data = await getRes.json();
        existingAttrs = data.value || [];
      } else {
        console.warn(`⚠️ Could not list existing attributes for ${tableDef.tableName}: ${getRes.status}`);
      }
    } catch (e) {
      console.error(`❌ Failed to query existing attributes for ${tableDef.tableName}:`, e);
    }

    const existingMap = new Map();
    existingAttrs.forEach(a => {
      existingMap.set((a.LogicalName || "").toLowerCase(), a.MetadataId);
    });

    // STEP 2: DELETE PREVIOUS/OBSOLETE COLUMNS
    if (tableDef.previousColumnsToDelete && tableDef.previousColumnsToDelete.length > 0) {
      console.log(`--- Checking previous columns to delete ---`);
      for (const oldCol of tableDef.previousColumnsToDelete) {
        const lowerOld = oldCol.toLowerCase();
        if (existingMap.has(lowerOld)) {
          const metadataId = existingMap.get(lowerOld);
          const delUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableDef.tableName}')/Attributes(${metadataId})`;
          try {
            const delRes = await fetch(delUrl, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json"
              }
            });
            if (delRes.ok || delRes.status === 204) {
              console.log(`  🗑️ DELETED previous column: ${oldCol}`);
              existingMap.delete(lowerOld);
            } else {
              const errText = await delRes.text();
              console.warn(`  ⚠️ Could not delete ${oldCol} (${delRes.status}):`, errText);
            }
          } catch (delErr) {
            console.error(`  ❌ Error deleting ${oldCol}:`, delErr);
          }
        } else {
          console.log(`  ℹ️ Previous column already absent: ${oldCol}`);
        }
      }
    }

    // STEP 3: CREATE MISSING NEW COLUMNS
    console.log(`--- Verifying / creating new columns ---`);
    const createUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableDef.tableName}')/Attributes`;

    for (const col of tableDef.newColumns) {
      const lowerNew = col.SchemaName.toLowerCase();
      if (existingMap.has(lowerNew)) {
        console.log(`  ℹ️ Column exists: ${col.SchemaName}`);
        continue;
      }

      const body = col.Type === "Decimal" 
        ? {
            "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
            "SchemaName": col.SchemaName,
            "DisplayName": { "LocalizedLabels": [{ "Label": col.Display, "LanguageCode": 1033 }] },
            "RequiredLevel": { "Value": "None" },
            "Precision": col.Precision || 2,
            "MinValue": -100000000000,
            "MaxValue": 100000000000
          }
        : {
            "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
            "SchemaName": col.SchemaName,
            "DisplayName": { "LocalizedLabels": [{ "Label": col.Display, "LanguageCode": 1033 }] },
            "RequiredLevel": { "Value": "None" },
            "MaxLength": col.MaxLength || 100
          };

      try {
        const response = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "OData-Version": "4.0",
            "OData-MaxVersion": "4.0"
          },
          body: JSON.stringify(body)
        });

        if (response.ok || response.status === 204) {
          console.log(`  ✅ Created new column: ${col.SchemaName} (${col.Display})`);
        } else {
          const errText = await response.text();
          if (errText.includes("already exists") || response.status === 409) {
            console.log(`  ℹ️ Already exists: ${col.SchemaName}`);
          } else {
            console.error(`  ❌ Failed to create ${col.SchemaName} (${response.status}):`, errText);
          }
        }
      } catch (err) {
        console.error(`  ❌ Exception creating ${col.SchemaName}:`, err);
      }
    }

    // STEP 4: PUBLISH CUSTOMIZATIONS FOR THIS TABLE
    try {
      const pubRes = await fetch(`${baseUrl}/api/data/v9.2/PublishXml`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ParameterXml: `<importexportxml><entities><entity>${tableDef.tableName}</entity></entities></importexportxml>`
        })
      });
      if (pubRes.ok || pubRes.status === 204) {
        console.log(`  📢 Published customizations for ${tableDef.tableName}`);
      }
    } catch (pubErr) {
      // Non-blocking
    }
  }

  console.log("\n===============================================================");
  console.log("🎉 ALL NON-PROD (UAT) TABLES CLEANED & SYNCHRONIZED!");
  console.log("===============================================================");
})();
