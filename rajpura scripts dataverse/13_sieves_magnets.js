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
    "SchemaName": "cr3ea_criteria",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Criteria", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_description",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Description", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
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
    "SchemaName": "cr3ea_frequency",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Frequency", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  }
];

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl = "https://orgea61b289.crm8.dynamics.com";

// Paste your active Dataverse Bearer token below (or runs automatically in console if logged into SharePoint)
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4ODMzMzUzNywibmJmIjoxNzg4MzMzNTM3LCJleHAiOjE3ODgzMzc0MzcsImFpbyI6ImsyRmdZTkRlTE1DM1FMZnJnMTdxcGtaVG5zZDJQOEp1Tkl1MzJ1Ylhac1lhNjNRdC9RVUEiLCJhcHBpZCI6ImI3MWQyMDM5LWRhZGMtNDM5My04NzQ0LWU3ZjY0OGQwODVhMSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0Yy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInJoIjoiMS5BVWtBNGx6Nmp1U0dna2lFRFBKWGpOOEpUQWNBQUFBQUFBQUF3QUFBQUFBQUFBQUFBQUJKQUEuIiwic3ViIjoiYmUwMjdiNjMtNjM1Yi00NDQwLTgwODUtZWM2YjRhNmI2NmQwIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkFTIiwidGlkIjoiOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjIiwidXRpIjoieVdFSWFRcEtIME93VWR0eGpsVUhBQSIsInZlciI6IjEuMCIsInhtc19hY3RfZmN0IjoiMyA5IiwieG1zX2Z0ZCI6IkpCNnpNQWdrYnJTR21ubnB1aFpwdEpVWDMta2E3b1VFcmZHSTdmMlFQVXNCYTI5eVpXRnpiM1YwYUMxa2MyMXoiLCJ4bXNfaWRyZWwiOiI3IDYiLCJ4bXNfcmQiOiIwLjQyTGxZQkppOUJRUzRXQVhFdGgwY3pNNzQtb0ZMbDFmWjRZZlN1VzlJQ1RDd1NrazhON19KbGRtN3lHM0JYR05MLXRfc0hZSmlYQndDQW13TTBEQUFTZ3RKTUxCTFNTUVBQdEsyV2NQa2Z2M2NtMHlGOTlyMGdBQSIsInhtc19zdWJfZmN0IjoiMyA5In0.eM9wS5xnPIJZjSY8IlF1Ht1XI3U-AzEH2dfX5qGIr_eO_HfiGjMqYnlPdM-m2YpaDIqmn_8PaaBvDlRuWxKOS9laKMsCRHrunGSEdYJ2a7QjBch96VPyQmmBS82juulmB3Vcse-tVPdORIKRNjFTCrpOs8WYh3-_7ZOI37mPo9h0Ah0vCFWvI5GhYU_PYpbXt6Z4jgBQifalRIioRr4X6EZ3PkC8VL38jJPhkf7dRB0o12ouCfYHnmKFV7zyiXf8Max9wWE-K5sQMTENdTfs8KL10bGGhSqvNaag9OY3Bzbfvt_oKxaG2Sj9JZHhiIlsTCARUWJrdEePUr6-5oNAhg"


// Set to cr3ea_rajpura_sievesmagnets for UAT, or cr3ea_prod_rajpura_sievesmagnets for PROD/DEV
const tableLogicalName = "cr3ea_rajpura_sievesmagnets";

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Creation: 13_SIEVES_MAGNETS");
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
  console.log("Finished 13_SIEVES_MAGNETS.");
  console.log("==========================================");
}

// =============================================================
// RUN
// =============================================================

createColumns();
