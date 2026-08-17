const columns = [

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",

    "SchemaName": "cr3ea_title",

    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Title",
          "LanguageCode": 1033
        }
      ]
    },

    "RequiredLevel": {
      "Value": "None"
    },

    "MaxLength": 200
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_cycle",
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
    "MaxLength": 50
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_criteria",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Criteria",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 50
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_description",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Description",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 250
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_defectremarks",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Defect Remarks",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 1000
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_frequency",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Frequency",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 20
  }

];

// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl = "https://org487f0635.crm8.dynamics.com";

const accessToken = ""

// New table logical name
const tableLogicalName =
  "cr3ea_prod_rajpura_sievesmagnets";


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