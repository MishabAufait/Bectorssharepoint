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
    "SchemaName": "cr3ea_title",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Title", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_cycle",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Cycle", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_shift",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Shift", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_tourstartdate",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Tour Start Date", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_observedby",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Observed By", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_location",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Location", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
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
    "SchemaName": "cr3ea_category",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Category", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_checkpointname",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Checkpoint Name", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_acceptanceresponse",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Acceptance Response", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_defectremarks",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Defect Remarks", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 2000
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_actiontaken",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Action Taken", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 2000
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_notifieddepartment",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Notified Department", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_deviationstatus",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Deviation Status", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  }
];

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl = "https://orgea61b289.crm8.dynamics.com";

// Paste your active Dataverse Bearer token below (or runs automatically in console if logged into SharePoint)
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4ODMyOTU4MywibmJmIjoxNzg4MzI5NTgzLCJleHAiOjE3ODgzMzM0ODMsImFpbyI6ImsyRmdZQ2krM2RlZ2NUQklKMjJQK1Q2WERjVUoydEhwaWJhVFgwem1YNzZxUTIzUDhWc0EiLCJhcHBpZCI6ImI3MWQyMDM5LWRhZGMtNDM5My04NzQ0LWU3ZjY0OGQwODVhMSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0Yy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInJoIjoiMS5BVWtBNGx6Nmp1U0dna2lFRFBKWGpOOEpUQWNBQUFBQUFBQUF3QUFBQUFBQUFBQUFBQUJKQUEuIiwic3ViIjoiYmUwMjdiNjMtNjM1Yi00NDQwLTgwODUtZWM2YjRhNmI2NmQwIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkFTIiwidGlkIjoiOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjIiwidXRpIjoiU1NINWd4LVg3azJxZlBDaVFOMXdBQSIsInZlciI6IjEuMCIsInhtc19hY3RfZmN0IjoiOSAzIiwieG1zX2Z0ZCI6InRKcjR1YTBBenBqbHBhN3VYa3F3UTJXNS1janRRLXR6MTRYMlVZQ0dZN1FCYW1Gd1lXNWxZWE4wTFdSemJYTSIsInhtc19pZHJlbCI6IjcgMjAiLCJ4bXNfcmQiOiIwLjQyTGxZQkppOUJRUzRXQVhFdGgwY3pNNzQtb0ZMbDFmWjRZZlN1VzlJQ1RDd1NrazhON19KbGRtN3lHM0JYR05MLXRfc0hZSmlYQndDQW13TTBEQUFTZ3RKTUxCTFNTUVBQdEsyV2NQa2Z2M2NtMHlGOTlyMGdBQSIsInhtc19zdWJfZmN0IjoiOSAzIn0.ERLbtLKlFzhXrVxTthXrwc1jyVcEIQ4_yJgot5M_Ia2ArIMv-obmI6nPx9G8jVI8VWgYi9NqcJ_rypHfycdZceXABy-LCKz8a5Vv0HRrEwKdK9zHSn-WTPIFD0WnScbpga6M6og7i29TqFA13yes3ZbUg38_kqF8U6cGVCsFV2A3o2qYEBVouvOw3yUnmEBR1c4iwKAL1cdHpTJlQ4fxF1UATq_bi9UyusUJ00TAV-BjkgyQvNs7s62r2_-9OPNL7wbW5VWbrY45XrdjyIx3pl15VCg6p5RG8F9Vr07Nc-gMSpoy8DgaWOWVj7gSWbZt-D3VNzBlnUUF_zpAT4db3w"

// Set to cr3ea_rajpura_ccpoprp for UAT, or cr3ea_prod_rajpura_ccpoprp for PROD/DEV
const tableLogicalName = "cr3ea_rajpura_ccpoprp";

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Creation: 12_CCP_OPRP");
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
  console.log("Finished 12_CCP_OPRP.");
  console.log("==========================================");
}

// =============================================================
// RUN
// =============================================================

createColumns();
