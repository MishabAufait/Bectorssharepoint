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
// MANUAL CONFIGURATION (NON-PROD / UAT)
// =============================================================
const baseUrl = "https://orgea61b289.crm8.dynamics.com";
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZ2VhNjFiMjg5LmFwaS5jcm04LmR5bmFtaWNzLmNvbSIsImlzcyI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0L2FhNDRjNWMxLTU0NDgtNGU3NC04OGQ5LTE3ODM4YTZmOWQ1YS8iLCJpYXQiOjE3ODg0MzQ2NzQsIm5iZiI6MTc4ODQzNDY3NCwiZXhwIjoxNzg4NDM4NTc0LCJhaW8iOiJrMkZnWUhqMHUvSWpML3U2SUdHSjFFLzErdytjeWtndkVWUHRaSDVvZSt2UnA0VERQak1CIiwiYXBwaWQiOiJmODNiMmU2OC00MzZjLTQxN2ItYjgwNy04NGVjYmNlYzhjYTMiLCJhcHBpZGFjciI6IjEiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9hYTQ0YzVjMS01NDQ4LTRlNzQtODhkOS0xNzgzOGE2ZjlkNWEvIiwiaWR0eXAiOiJhcHAiLCJvaWQiOiI1NGFhMTdlNS1mN2NiLTQ3NWEtYmE5Mi04Y2EyYTMwMjA5ZTgiLCJyaCI6IjEuQVZVQXdjVkVxa2hVZEU2STJSZURpbS1kV2djQUFBQUFBQUFBd0FBQUFBQUFBQUFBQUFCVkFBLiIsInN1YiI6IjU0YWExN2U1LWY3Y2ItNDc1YS1iYTkyLThjYTJhMzAyMDllOCIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJBUyIsInRpZCI6ImFhNDRjNWMxLTU0NDgtNGU3NC04OGQ5LTE3ODM4YTZmOWQ1YSIsInV0aSI6IlVqN3FQc3NjZ0VTLVRwbXhuZjVuQUEiLCJ2ZXIiOiIxLjAiLCJ4bXNfYWN0X2ZjdCI6IjMgOSIsInhtc19mdGQiOiIyZHZIWUNjeU5pMXEwMW52VnNMLWpLMTNab292aWEtYzA4NHBVMmRaa1FvQmEyOXlaV0ZqWlc1MGNtRnNMV1J6YlhNIiwieG1zX2lkcmVsIjoiMTYgNyIsInhtc19yZCI6IjAuNDJMbFlCSmlEQlVTNFdBWEVqaXdjLTZ2aDBLZkhLZkVNbDFuX1hXSVRVaUVnMU5JNEloYjg0YklaV2Etcy1mVnNtVC1XdjVRU0lTRFEwaUFuUUVDRGtCcElSRU9iaUdCOHBzcDVxSVJ6MTQxaGV4aFhsSDhaakVBIiwieG1zX3N1Yl9mY3QiOiIzIDkifQ.YUkkBudqRuGXr7DbxHYfPuTmhRsLxhNGORv55pBG7n4krngDTafmOx3B9kZ-1A0jZUlBIPxgr6CLpCh_0nTPT00vKqwk84MtMIJ5AQpWFZumNRIqOV484gFmk21IINbzEUY_xpateSUEAL0noeQXUmbYzlOW0Kl6c2JNgDJqBFUQF1188SThH5F8MUl6yFqR4HAuIozhGGcUMEk_RB9NhhXrekCXvMjC1mKOJOdCawTYYd1_ABkpSHS2r7xXw1yjNQfF6LZBathsbGIpuMpKpfc4048Wh50yfiDbuZAcKzOxzou7yJjLSxduvNcmVJV3EuL0YeQ122BJ4aMfG1tf5A";
const tableLogicalName = "cr3ea_rajpura_pkgops_temphumidity";

const previousColumnsToDelete = [
  "cr3ea_ambienttemp",
  "cr3ea_ambienthumidity",
  "cr3ea_doughroomtemp",
  "cr3ea_doughroomhumidity",
  "cr3ea_coldroom1temp",
  "cr3ea_coldroom2temp"
];

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
    "SchemaName": "cr3ea_pkglinetemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Packaging Line Temp", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_pkglinehumidity",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Packaging Line Humidity", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coolingtunneltemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cooling Tunnel Temp", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_creamroomtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cream Room Temp", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coldstorage1nbtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cold Storage 1 Temp NB", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coldstorage2nbtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cold Storage 2 Temp NB", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_flavourroomtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Flavour Room Temp", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_dhroomhumidity",
    "DisplayName": { "LocalizedLabels": [{ "Label": "DH Room Humidity", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coldroom1obtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cold Room 1 Temp OB", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coldroom2obtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cold Room 2 Temp OB", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_coldroom3obtemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cold Room 3 Temp OB", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_deepfreezeryeasttemp",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Deep Freezer Yeast Temp", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  }
];

// =============================================================
// CREATE / CLEAN COLUMNS
// =============================================================

async function createColumns() {
  if (!accessToken || accessToken === "PASTE_YOUR_ACCESS_TOKEN_HERE") {
    console.error("❌ Missing valid accessToken. Please paste it into the accessToken variable.");
    alert("❌ Please paste your valid Dataverse accessToken before running.");
    return;
  }

  console.log("==========================================");
  console.log("Dataverse Column Sync: 05_PKGOPS_TEMP_HUMIDITY (NON-PROD)");
  console.log("==========================================");
  console.log(`Table: ${tableLogicalName}`);

  // 1. Get existing attributes to find IDs for deletion
  const attrUrl = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableLogicalName}')/Attributes?$select=LogicalName,MetadataId`;
  let existingMap = new Map();
  try {
    const res = await fetch(attrUrl, {
      headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      (data.value || []).forEach(a => existingMap.set((a.LogicalName || "").toLowerCase(), a.MetadataId));
    }
  } catch (e) {
    console.error("Could not fetch existing attributes:", e);
  }

  // 2. Delete previous obsolete columns
  for (const oldCol of previousColumnsToDelete) {
    const lower = oldCol.toLowerCase();
    if (existingMap.has(lower)) {
      const metadataId = existingMap.get(lower);
      try {
        const delRes = await fetch(`${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableLogicalName}')/Attributes(${metadataId})`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
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
  const url = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableLogicalName}')/Attributes`;
  for (const column of columns) {
    if (existingMap.has(column.SchemaName.toLowerCase())) {
      console.log(`ℹ️ Already exists: ${column.SchemaName}`);
      continue;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "OData-Version": "4.0",
          "OData-MaxVersion": "4.0"
        },
        body: JSON.stringify(column)
      });

      if (response.ok || response.status === 204) {
        console.log(`✅ Created successfully: ${column.SchemaName}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed: ${column.SchemaName}`, errorText);
      }
    } catch (error) {
      console.error(`❌ Exception: ${column.SchemaName}`, error);
    }
  }

  // 4. Publish
  try {
    await fetch(`${baseUrl}/api/data/v9.2/PublishXml`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ParameterXml: `<importexportxml><entities><entity>${tableLogicalName}</entity></entities></importexportxml>` })
    });
    console.log(`📢 Published customizations for ${tableLogicalName}`);
  } catch (e) { }

  console.log("------------------------------------------");
  console.log("Finished 05_PKGOPS_TEMP_HUMIDITY.");
  console.log("==========================================");
}

createColumns();
