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
  // 1. Core Header
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_title",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Title", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 250
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_cycle",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Cycle", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_shift",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Shift", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_observedby",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Observed By", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
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
    "SchemaName": "cr3ea_lineno",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Line No", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 50
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_productionincharge",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Production Incharge", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_batchno",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Batch No", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 100
  },
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_floursupplier",
    "DisplayName": { "LocalizedLabels": [{ "Label": "Flour Supplier", "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": 150
  }
];

// Helper to push string columns easily
function addStr(name, display, len = 100) {
  columns.push({
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": name,
    "DisplayName": { "LocalizedLabels": [{ "Label": display, "LanguageCode": 1033 }] },
    "RequiredLevel": { "Value": "None" },
    "MaxLength": len
  });
}

// 2. Ingredients (standard, observed, remarks, action taken)
const ingredients = ["rpo", "solidfat", "butter", "blackjack", "spongetemp", "slurry", "groundsugartemp", "groundsugarparticlesize"];
ingredients.forEach(ing => {
  addStr(`cr3ea_${ing}standard`, `${ing} Standard`);
  addStr(`cr3ea_${ing}observed`, `${ing} Observed`);
  addStr(`cr3ea_${ing}remarks`, `${ing} Remarks`, 1000);
  addStr(`cr3ea_${ing}actiontaken`, `${ing} Action Taken`, 1000);
});

// 3. Minor Checklist
const minors = ["cocoapowderdone", "smpdone", "salt1done", "abcdone", "sbcdone", "salt2done", "othersdone"];
minors.forEach(m => addStr(`cr3ea_${m}`, `${m}`, 50));

// 4. Choco chips & Cashews
const customIngs = ["chocochips", "cashew"];
customIngs.forEach(c => {
  addStr(`cr3ea_${c}supplier`, `${c} Supplier`, 150);
  addStr(`cr3ea_${c}temp`, `${c} Temp`, 50);
  addStr(`cr3ea_${c}countperkg`, `${c} Count Per Kg`, 50);
  addStr(`cr3ea_${c}mfgdate`, `${c} Mfg Date`, 50);
  addStr(`cr3ea_${c}compoundorpure`, `${c} Compound/Pure`, 50);
});

// 5. Syrups
const syrups = ["invertsyrup", "blackjack2"];
syrups.forEach(s => {
  addStr(`cr3ea_${s}temp`, `${s} Temp`, 50);
  addStr(`cr3ea_${s}ph`, `${s} pH`, 50);
  addStr(`cr3ea_${s}brix`, `${s} Brix`, 50);
});

// 6. Mixing Sponge
const sponge = ["spongeproductname", "spongewaterquantity", "spongeyeastquantity", "spongewatertemp", "spongemixingtime", "fermentationstarttemp", "fermentationroomtemp", "finaltempafterfermentation", "finalphafterfermentation"];
sponge.forEach(s => addStr(`cr3ea_${s}`, `${s}`, 100));

// 7. Mixing Dough
const dough = ["creamingtime", "mixingtime", "doughtemp", "jackettemp", "doughconsistency", "doughstandingtime"];
dough.forEach(d => {
  addStr(`cr3ea_${d}standard`, `${d} Standard`, 100);
  addStr(`cr3ea_${d}observed`, `${d} Observed`, 100);
});
addStr("cr3ea_typeofmixer", "Type of Mixer", 50);

// 8. Forming
const forming = ["moulderrpmstrokes", "formingsamplecount", "standardwetweight", "observedwetweight", "weightbeforesugarsprinkling", "weightaftersugarsprinkling"];
forming.forEach(f => addStr(`cr3ea_${f}`, `${f}`, 100));

// 9. Baking
addStr("cr3ea_bakingtime", "Baking Time", 50);
addStr("cr3ea_bakingprofiletaste", "Baking Profile Taste", 100);
addStr("cr3ea_bakingprofileaspertemplate", "Baking Profile As Per Template", 50);

for (let i = 1; i <= 7; i++) {
  addStr(`cr3ea_topbakingtempzone${i}`, `Top Baking Temp Zone ${i}`, 50);
  addStr(`cr3ea_bottombakingtempzone${i}`, `Bottom Baking Temp Zone ${i}`, 50);
}
addStr("cr3ea_topproducttempafterbaking", "Top Product Temp After Baking", 50);
addStr("cr3ea_bottomproducttempafterbaking", "Bottom Product Temp After Baking", 50);

// 10. QC Standards
const qcs = ["biscuitlength", "biscuitwidth", "biscuitdiameter", "standardssamplecount", "biscuitstdweight", "biscuitobservedweight", "weightafteroilspray"];
qcs.forEach(q => addStr(`cr3ea_${q}`, `${q}`, 100));

const qcPairs = ["topcolour", "bottomcolour", "moisture"];
qcPairs.forEach(q => {
  addStr(`cr3ea_${q}standard`, `${q} Standard`, 100);
  addStr(`cr3ea_${q}observed`, `${q} Observed`, 100);
});

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl =  "https://org487f0635.crm8.dynamics.com";

// Paste your active Dataverse Bearer token below (or runs automatically in console if logged into SharePoint)
const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCIsImtpZCI6IlQ1aDQwcTdHMHg0OXFuNDFsTTkta0tqcEQ5OCJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4ODMyOTU4MywibmJmIjoxNzg4MzI5NTgzLCJleHAiOjE3ODgzMzM0ODMsImFpbyI6ImsyRmdZQ2krM2RlZ2NUQklKMjJQK1Q2WERjVUoydEhwaWJhVFgwem1YNzZxUTIzUDhWc0EiLCJhcHBpZCI6ImI3MWQyMDM5LWRhZGMtNDM5My04NzQ0LWU3ZjY0OGQwODVhMSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0Yy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInJoIjoiMS5BVWtBNGx6Nmp1U0dna2lFRFBKWGpOOEpUQWNBQUFBQUFBQUF3QUFBQUFBQUFBQUFBQUJKQUEuIiwic3ViIjoiYmUwMjdiNjMtNjM1Yi00NDQwLTgwODUtZWM2YjRhNmI2NmQwIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkFTIiwidGlkIjoiOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjIiwidXRpIjoiU1NINWd4LVg3azJxZlBDaVFOMXdBQSIsInZlciI6IjEuMCIsInhtc19hY3RfZmN0IjoiOSAzIiwieG1zX2Z0ZCI6InRKcjR1YTBBenBqbHBhN3VYa3F3UTJXNS1janRRLXR6MTRYMlVZQ0dZN1FCYW1Gd1lXNWxZWE4wTFdSemJYTSIsInhtc19pZHJlbCI6IjcgMjAiLCJ4bXNfcmQiOiIwLjQyTGxZQkppOUJRUzRXQVhFdGgwY3pNNzQtb0ZMbDFmWjRZZlN1VzlJQ1RDd1NrazhON19KbGRtN3lHM0JYR05MLXRfc0hZSmlYQndDQW13TTBEQUFTZ3RKTUxCTFNTUVBQdEsyV2NQa2Z2M2NtMHlGOTlyMGdBQSIsInhtc19zdWJfZmN0IjoiOSAzIn0.ERLbtLKlFzhXrVxTthXrwc1jyVcEIQ4_yJgot5M_Ia2ArIMv-obmI6nPx9G8jVI8VWgYi9NqcJ_rypHfycdZceXABy-LCKz8a5Vv0HRrEwKdK9zHSn-WTPIFD0WnScbpga6M6og7i29TqFA13yes3ZbUg38_kqF8U6cGVCsFV2A3o2qYEBVouvOw3yUnmEBR1c4iwKAL1cdHpTJlQ4fxF1UATq_bi9UyusUJ00TAV-BjkgyQvNs7s62r2_-9OPNL7wbW5VWbrY45XrdjyIx3pl15VCg6p5RG8F9Vr07Nc-gMSpoy8DgaWOWVj7gSWbZt-D3VNzBlnUUF_zpAT4db3w"

// Set to cr3ea_rajpura_mixingandbaking for UAT, or cr3ea_prod_rajpura_mixingandbaking for PROD/DEV
const tableLogicalName = "cr3ea_rajpura_mixingandbaking";

// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {
  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;

  console.log("==========================================");
  console.log("Dataverse Column Creation: 04_MIXING_BAKING");
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
  console.log("Finished 04_MIXING_BAKING.");
  console.log("==========================================");
}

// =============================================================
// RUN
// =============================================================

createColumns();
