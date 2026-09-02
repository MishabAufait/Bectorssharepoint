// =============================================================
// REQUIRED LOOKUPS FOR THIS TABLE (Power Apps Maker Portal):
// -------------------------------------------------------------
// • Lookup Logical Name : None (This is the Primary Parent / Header Table)
// • Lookup Schema Name  : None
// • All other 12 child checklist tables link back to this table.
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
    "SchemaName": "cr3ea_tourstartdate",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Tour Start Date", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_plantid",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Plant ID", "LanguageCode": 1033 }]
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
    "SchemaName": "cr3ea_lineno",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Line No", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_assigned_qa",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Assigned QA", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_shiftexecutiveproduction",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Shift Executive Production", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_status",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Status", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_processstatus",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Process Status", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
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
    "SchemaName": "cr3ea_tourby",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Tour By", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_previousrunningvariety",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Previous Running Variety", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_runningvariety",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Running Variety", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_executivename",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Executive Name", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_overall_score",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Overall Score", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    "SchemaName": "cr3ea_total_checkpoints",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Total Checkpoints", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MinValue": 0,
    "MaxValue": 2147483647
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    "SchemaName": "cr3ea_compliant_count",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Compliant Count", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MinValue": 0,
    "MaxValue": 2147483647
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
    "SchemaName": "cr3ea_non_compliant_count",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Non Compliant Count", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MinValue": 0,
    "MaxValue": 2147483647
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.MemoAttributeMetadata",
    "SchemaName": "cr3ea_escalation_contacts",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Escalation Contacts", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 4000
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
    "SchemaName": "cr3ea_islineclear",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Is Line Clear", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "OptionSet": {
      "TrueOption": { "Value": 1, "Label": { "LocalizedLabels": [{ "Label": "Yes", "LanguageCode": 1033 }] } },
      "FalseOption": { "Value": 0, "Label": { "LocalizedLabels": [{ "Label": "No", "LanguageCode": 1033 }] } }
    }
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_pkgops_type",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Packaging Ops Type", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_ccp_oprp_sieves_parametertype",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Parameter Type", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_ccp_oprp_sieves_frequency",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Frequency", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_food_safety_checklisttype",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Checklist Type", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_batchno",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Batch No", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_cycle",
    "DisplayName": {
      "LocalizedLabels": [{ "Label": "Cycle", "LanguageCode": 1033 }]
    },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  }
];

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl =  "https://org487f0635.crm8.dynamics.com";

// Paste your active Dataverse Bearer token below (or runs automatically in console if logged into SharePoint)
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4ODI2NjkxOCwibmJmIjoxNzg4MjY2OTE4LCJleHAiOjE3ODgyNzA4MTgsImFpbyI6ImsyRmdZT0FLMnA2c3lXYzZWZVhTMzN6TEF5V2l4ZGticHMxN2RubW01TUZMcVI5aVd5UUEiLCJhcHBpZCI6ImI3MWQyMDM5LWRhZGMtNDM5My04NzQ0LWU3ZjY0OGQwODVhMSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0Yy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInJoIjoiMS5BVWtBNGx6Nmp1U0dna2lFRFBKWGpOOEpUQWNBQUFBQUFBQUF3QUFBQUFBQUFBQUFBQUJKQUEuIiwic3ViIjoiYmUwMjdiNjMtNjM1Yi00NDQwLTgwODUtZWM2YjRhNmI2NmQwIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkFTIiwidGlkIjoiOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjIiwidXRpIjoienVzU2ZGaVFwMEdMNkY4Q0VDNWFBQSIsInZlciI6IjEuMCIsInhtc19hY3RfZmN0IjoiOSAzIiwieG1zX2Z0ZCI6ImwwX20zRkVhSElJYUdsc2pBQ1FJU3E4aVdITDlZbk92NW9sTTRtQU40S1FCYTI5eVpXRmpaVzUwY21Gc0xXUnpiWE0iLCJ4bXNfaWRyZWwiOiIyIDciLCJ4bXNfcmQiOiIwLjQyTGxZQkppOUJRUzRXQVhFdGgwY3pNNzQtb0ZMbDFmWjRZZlN1VzlJQ1RDd1NrazhON19KbGRtN3lHM0JYR05MLXRfc0hZSmlYQndDQW13TTBEQUFTZ3RKTUxCTFNTUVBQdEsyV2NQa2Z2M2NtMHlGOTlyMGdBQSIsInhtc19zdWJfZmN0IjoiMyA5In0.EJLHCgQY0QpPE5O8iwf4O-kt3xU-EHcIL_WaiQz7zyHLcubfRtEx3YfiS0_LPRtX0nxWVL8U4syxZKOhQY4JwLVO6NLdPP30dA1u4aVt5GGZy0R4_8beugoIEkv7F14ZEpFbD62ra8P_kt2tGoi8ZkJb7hsTAarQ6772OyIM4X1l9XFUhtCeK5QE0_v6A1mt5MMX-iY2g5kreQqQUUTq-MeLzuft1kDTHexmcFQTfeeeQkPJWpPUATcD9Q-un7FwA-7B4M4fjzEOqCUcUX1BVn5Du4N4UyjA-_a1vY6tikO8dJe2tgHqRIWkdJubo2fHKfYeHpEJIaIC7nclm9Vryw"
// Set to cr3ea_rajpura_quality_tour for UAT, or cr3ea_prod_rajpura_quality_tour for PROD/DEV
const tableLogicalName = "cr3ea_rajpura_quality_tour";

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Creation: 01_PARENT_TOUR");
  console.log("==========================================");
  console.log(`Table: ${tableLogicalName}`);
  console.log(`Columns to create: ${columns.length}`);
  console.log("------------------------------------------");
  console.log("ℹ️  REQUIRED LOOKUPS FOR THIS TABLE:");
  console.log("   • Lookup Logical Name : None (Primary Parent Header Table)");
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
  console.log("Finished 01_PARENT_TOUR.");
  console.log("==========================================");
}

// =============================================================
// RUN
// =============================================================

createColumns();
