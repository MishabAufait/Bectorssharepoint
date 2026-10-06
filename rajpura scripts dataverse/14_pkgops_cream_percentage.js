// =============================================================
// REQUIRED LOOKUPS FOR THIS TABLE (Power Apps Maker Portal):
// -------------------------------------------------------------
// • Lookup Logical Name : cr3ea_qualitytourid
// • Lookup Schema Name  : cr3ea_qualitytourid
// • Display Name        : Quality Tour
// • Related / Target Table : Rajpura Quality Tour (cr3ea_rajpura_quality_tour)
// • Relationship Type   : Many-to-One (N:1)
// =============================================================

// =============================================================
// MANUAL CONFIGURATION (NON-PROD / UAT / DEV)
// =============================================================
const baseUrl = "https://org487f0635.crm8.dynamics.com"; // Change to your environment URL if needed
const accessToken = "PASTE_YOUR_ACCESS_TOKEN_HERE";
const tableLogicalNameCandidates = [
  "cr3ea_rajpura_pkgops_creampercentages",
  "cr3ea_rajpura_pkgops_creampercentage",
  "cr3ea_prod_rajpura_pkgops_creampercentages",
  "cr3ea_prod_rajpura_pkgops_creampercentage"
];

const previousColumnsToDelete = [];

const columns = [
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_name",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Name", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_productcategory",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Product Category", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_productname",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Product Name", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_sku",
    "DisplayName": { "LocalizedLabels": [{ "Label": "SKU", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_samplesize",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Sample Size", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_creamreading",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cream Percentage Reading", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_standardmin",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Standard Min", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_standardmax",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Standard Max", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_status",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Status", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_deviationstatus",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Deviation Status", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_actiontaken",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Action Taken", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 2000
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    "SchemaName": "cr3ea_remarks",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Remarks", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 1000
  }
];

// =============================================================
// CREATE / CLEAN COLUMNS
// =============================================================

async function createColumns() {
  const effectiveToken = (typeof accessToken === "string" && accessToken.startsWith("eyJ")) ? accessToken : (typeof getAccessToken === "function" ? await getAccessToken() : null) || JSON.parse(localStorage.getItem("access_token") || "{}").token;
  if (!effectiveToken) {
    console.error("❌ Missing valid accessToken. Please paste it into the accessToken variable.");
    alert("❌ Please paste your valid Dataverse accessToken before running.");
    return;
  }

  console.log("==========================================");
  console.log("Dataverse Column Sync: 14_PKGOPS_CREAM_PERCENTAGE");
  console.log("==========================================");

  let activeTableLogicalName = "";
  let existingMap = new Map();

  // 1. Detect existing table logical name
  for (const candidate of tableLogicalNameCandidates) {
    const attrUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${candidate}')/Attributes?$select=LogicalName,MetadataId`;
    try {
      const res = await fetch(attrUrl, {
        headers: { "Authorization": `Bearer ${effectiveToken}`, "Accept": "application/json" }
      });
      if (res.ok) {
        activeTableLogicalName = candidate;
        const data = await res.json();
        (data.value || []).forEach(a => existingMap.set((a.LogicalName || "").toLowerCase(), a.MetadataId));
        console.log(`✅ Found active table: ${activeTableLogicalName}`);
        break;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  if (!activeTableLogicalName) {
    console.error("❌ Could not find table in Dataverse. Checked candidates:", tableLogicalNameCandidates);
    alert("❌ Table not found in Dataverse. Please check the environment URL or table name.");
    return;
  }

  // 2. Delete previous obsolete columns
  for (const oldCol of previousColumnsToDelete) {
    const lower = oldCol.toLowerCase();
    if (existingMap.has(lower)) {
      const metadataId = existingMap.get(lower);
      try {
        const delRes = await fetch(`${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${activeTableLogicalName}')/Attributes(${metadataId})`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${effectiveToken}`, "Accept": "application/json" }
        });
        if (delRes.ok || delRes.status === 204) {
          console.log(`🗑️ Deleted previous column: ${oldCol}`);
          existingMap.delete(lower);
        }
      } catch (err) {
        console.error(`Failed to delete ${oldCol}:`, err);
      }
    }
  }

  // 3. Create fresh new columns
  const url = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${activeTableLogicalName}')/Attributes`;
  for (const column of columns) {
    if (existingMap.has(column.SchemaName.toLowerCase())) {
      console.log(`ℹ️ Already exists: ${column.SchemaName}`);
      continue;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${effectiveToken}`,
          "Content-Type": "application/json; charset=utf-8",
          "Accept": "application/json"
        },
        body: JSON.stringify(column)
      });

      if (response.ok || response.status === 204) {
        console.log(`✅ Created: ${column.SchemaName} (${column.DisplayName.LocalizedLabels[0].Label})`);
      } else {
        const err = await response.text();
        console.error(`❌ Failed: ${column.SchemaName}`, err);
      }
    } catch (e) {
      console.error(`❌ Error creating ${column.SchemaName}:`, e);
    }
  }

  // 4. Publish Customizations
  console.log("Publishing customizations...");
  try {
    const pubRes = await fetch(`${baseUrl}/api/data/v9.2/PublishAllXml`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${effectiveToken}`, "Content-Type": "application/json; charset=utf-8" }
    });
    if (pubRes.ok) {
      console.log("🎉 Customizations published successfully!");
      alert("🎉 Cream Percentage columns created and published successfully!");
    } else {
      console.warn("⚠️ Publish returned status:", pubRes.status);
    }
  } catch (e) {
    console.error("❌ Failed to publish:", e);
  }
}

createColumns();
