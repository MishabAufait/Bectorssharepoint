// =============================================================
// REQUIRED LOOKUPS FOR THIS TABLE (Power Apps Maker Portal):
// -------------------------------------------------------------
// • Lookup Logical Name : cr3ea_qualitytourid
// • Lookup Schema Name  : cr3ea_qualitytourid
// • Display Name        : Quality Tour
// • Related / Target Table : 
//     - UAT  : Rajpura Quality Tour (cr3ea_rajpura_quality_tour)
//     - PROD : Prod Rajpura Quality Tour (cr3ea_prod_rajpura_quality_tour)
// • Relationship Type   : Many-to-One (N:1)
// =============================================================

const columns = [
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_name",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Name", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_productname",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Product Name", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_sku",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "SKU", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    "SchemaName": "cr3ea_averageweight",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Average Weight", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "Precision": 2,
    "MinValue": -100000000000,
    "MaxValue": 100000000000
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    "SchemaName": "cr3ea_giveaway",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Giveaway", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "Precision": 2,
    "MinValue": -100000000000,
    "MaxValue": 100000000000
  }
];

// Add 32 sample weights
for (let i = 1; i <= 32; i++) {
  columns.push({
    "@odata.type": "Microsoft.Dynamics.CRM.DecimalAttributeMetadata",
    "SchemaName": `cr3ea_sampleweight${i}`,
    "DisplayName": {
      "LocalizedLabels": [{ "Label": `Sample Weight ${i}`, "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "Precision": 2,
    "MinValue": -100000000000,
    "MaxValue": 100000000000
  });
}

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl =  "https://org487f0635.crm8.dynamics.com";

// Paste your active Dataverse Bearer token below (or runs automatically in console if logged into SharePoint)
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4ODMzOTYwNSwibmJmIjoxNzg4MzM5NjA1LCJleHAiOjE3ODgzNDM1MDUsImFpbyI6IkFTUUEyLzhjQUFBQVhKY2dtYWpreWFhelJRYlhaUVBJZ0ZHeFFMQ3hFM3FVUUNneG5CVkVUS2c9IiwiYXBwaWQiOiJiNzFkMjAzOS1kYWRjLTQzOTMtODc0NC1lN2Y2NDhkMDg1YTEiLCJhcHBpZGFjciI6IjEiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC84ZWZhNWNlMi04NmU0LTQ4ODItODQwYy1mMjU3OGNkZjA5NGMvIiwiaWR0eXAiOiJhcHAiLCJvaWQiOiJiZTAyN2I2My02MzViLTQ0NDAtODA4NS1lYzZiNGE2YjY2ZDAiLCJyaCI6IjEuQVVrQTRsejZqdVNHZ2tpRURQSlhqTjhKVEFjQUFBQUFBQUFBd0FBQUFBQUFBQUFBQUFCSkFBLiIsInN1YiI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJBUyIsInRpZCI6IjhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0YyIsInV0aSI6IjZuS2V2UWxFejAyMzVhM3Fwd3AwQUEiLCJ2ZXIiOiIxLjAiLCJ4bXNfYWN0X2ZjdCI6IjMgOSIsInhtc19mdGQiOiJSRTFmMXdza2JraTI3MTVDVmViVl9zdGdNZEltVHYxdU0xY1Zxc082SWRrQmFtRndZVzVsWVhOMExXUnpiWE0iLCJ4bXNfaWRyZWwiOiI3IDE4IiwieG1zX3JkIjoiMC40MkxsWUJKaTlCUVM0V0FYRXRoMGN6TTc0LW9GTGwxZlo0WWZTdVc5SUNUQ3dTa2s4TjdfSmxkbTd5RzNCWEdOTC10X3NIWUppWEJ3Q0Ftd00wREFBU2d0Sk1MQkxTUndZZk83dGlsbVU5Uldjal9jNVhOMXd5VUEiLCJ4bXNfc3ViX2ZjdCI6IjMgOSJ9.SgfP0XafiJGe6X1kzdtUop_bWiH--BifWlV0wh1hHTzP-IL-LkFy9A2UKhSwntj5BPf_JngUmGByF1Oy5wJn_aaKN6y0q4ErOMNBm18K2a_ANVExQ-XwjL-1NurVl7et3j4eaoJRqrI6T_uGkSY6V6s8IDBO9_uBZ7R0TQCaUnTA_u2sr5PI_eAq92cL-ioRYLpHnOycfhuwgHF6UpqDv1xRemWknNJ999E6nTZNpIGFhYittcDGDVl8Hv6j8wXRKTBp53qKBtocxxEDpFLNGpMTAVqryKXxtB5pE5GoAz1SdJc76LrPHZ94tJwZYd4FJ_dwn_HLZUMcEVXFCPU8DA"

// Set to cr3ea_rajpura_pkgops_pqi_netweight for UAT, or cr3ea_prod_rajpura_pkgops_pqi_netweight for PROD/DEV
const tableLogicalName = "cr3ea_rajpura_pkgops_pqi_netweight";

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Creation: 08_PKGOPS_PQI_NETWEIGHT");
  console.log("==========================================");
  console.log(`Table: ${tableLogicalName}`);
  console.log(`Columns to create: ${columns.length}`);
  console.log("------------------------------------------");
  console.log("ℹ️  REQUIRED LOOKUPS FOR THIS TABLE:");
  console.log("   • Lookup Logical Name : cr3ea_qualitytourid");
  console.log("   • Lookup Schema Name  : cr3ea_qualitytourid");
  console.log("   • Display Name        : Quality Tour");
  console.log("   • Target Table        : cr3ea_rajpura_quality_tour (or cr3ea_prod_rajpura_quality_tour)");
  console.log("   • Type                : Lookup (Many-to-One / N:1)");
  console.log("------------------------------------------");

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
        console.error(`❌ Failed: ${column.SchemaName}`);
        console.error(`Status: ${response.status}`);
        console.error(errorText);
      }
    } catch (error) {
      console.error(`❌ Exception: ${column.SchemaName}`);
      console.error(error);
    }
  }

  console.log("------------------------------------------");
  console.log("Finished 08_PKGOPS_PQI_NETWEIGHT.");
  console.log("==========================================");
}

// =============================================================
// RUN
// =============================================================

createColumns();
