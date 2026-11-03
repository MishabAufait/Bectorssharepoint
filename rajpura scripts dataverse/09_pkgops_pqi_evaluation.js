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
const tableLogicalName = "cr3ea_rajpura_pkgops_pqi_evaluation";

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
    "SchemaName": "cr3ea_evaluationtype",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Evaluation Type", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
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
    "SchemaName": "cr3ea_pkd",
    "DisplayName": { "LocalizedLabels": [{ "Label": "PKD", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_batchcode",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Batch Code", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_samplenumber",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Sample Number", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_sampleresult",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Sample Result", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_defectcategory",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Defect Category", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_defectdetail",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Defect Detail", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_batchcodepictureurl",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Batch Code Picture URL", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 500
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
  }
];

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  if (!accessToken || accessToken === "PASTE_YOUR_ACCESS_TOKEN_HERE") {
    console.error("❌ Missing valid accessToken. Please paste it into the accessToken variable.");
    alert("❌ Please paste your valid Dataverse accessToken before running.");
    return;
  }

  const url = `${baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Sync: 09_PKGOPS_PQI_EVALUATION (NON-PROD)");
  console.log("==========================================");
  console.log(`Table: ${tableLogicalName}`);

  for (const column of columns) {
    console.log(`Creating: ${column.SchemaName}`);

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
        if (errorText.includes("already exists") || response.status === 409) {
          console.log(`ℹ️ Already exists: ${column.SchemaName}`);
        } else {
          console.error(`❌ Failed: ${column.SchemaName}`, errorText);
        }
      }
    } catch (error) {
      console.error(`❌ Exception: ${column.SchemaName}`, error);
    }
  }

  // Publish
  try {
    await fetch(`${baseUrl}/api/data/v9.2/PublishXml`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ParameterXml: `<importexportxml><entities><entity>${tableLogicalName}</entity></entities></importexportxml>` })
    });
    console.log(`📢 Published customizations for ${tableLogicalName}`);
  } catch (e) { }

  console.log("------------------------------------------");
  console.log("Finished 09_PKGOPS_PQI_EVALUATION.");
  console.log("==========================================");
}

createColumns();
