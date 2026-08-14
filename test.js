const columns = [

  // =========================================================
  // 1. FOOD SAFETY CHECKLIST TYPE
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_checklisttype",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Food Safety Checklist Type",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MaxLength": 100
  },


  // =========================================================
  // 2. AREA / BLOCK
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_area",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Area / Block",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MaxLength": 100
  },


  // =========================================================
  // 3. AREA INCHARGE
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_areaincharge",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Area Incharge",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MaxLength": 100
  },


  // =========================================================
  // 4. SAMPLE SIZE
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_samplesize",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Sample Size",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MinValue": 0,

    "MaxValue": 2147483647,

    "Format": "None"
  },


  // =========================================================
  // 5. TOTAL POSSIBLE DEFECTS
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_totalpossibledefects",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Total Possible Defects",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MinValue": 0,

    "MaxValue": 2147483647,

    "Format": "None"
  },


  // =========================================================
  // 6. TOTAL DEFECTS
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_totaldefects",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Total Defects",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MinValue": 0,

    "MaxValue": 2147483647,

    "Format": "None"
  },


  // =========================================================
  // 7. CYCLE
  // =========================================================
  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",

    "SchemaName": "cr3ea_food_safety_cycle",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Cycle",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MaxLength": 100
  }

];


// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl = "https://org487f0635.crm8.dynamics.com";

const accessToken = "";


// Existing table
const tableLogicalName =
  "cr3ea_prod_rajpura_quality_tour";


// =============================================================
// CREATE COLUMNS
// =============================================================

async function createColumns() {

  const url =
    `${baseUrl}/api/data/v9.2/EntityDefinitions` +
    `(LogicalName='${tableLogicalName}')/Attributes`;


  console.log("==========================================");
  console.log("Dataverse Column Creation");
  console.log("==========================================");

  console.log(`Table: ${tableLogicalName}`);
  console.log(`Columns to create: ${columns.length}`);

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


      if (response.ok) {

        console.log(
          `✅ Created successfully: ${column.SchemaName}`
        );

      } else {

        const errorText = await response.text();

        console.error(
          `❌ Failed: ${column.SchemaName}`
        );

        console.error(
          `Status: ${response.status}`
        );

        console.error(errorText);

      }

    } catch (error) {

      console.error(
        `❌ Exception: ${column.SchemaName}`
      );

      console.error(error);

    }

  }


  console.log("------------------------------------------");
  console.log("Finished.");
  console.log("==========================================");
}


// =============================================================
// RUN
// =============================================================

createColumns();