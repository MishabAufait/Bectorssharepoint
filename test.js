const columns = [

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_productname",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Product Name",
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
    "SchemaName": "cr3ea_lineno",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Line No",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_pkdbatchno",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "PKD/Batch No",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 100
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_facilitator",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Facilitator",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 100
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_sku",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "SKU",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 100
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_typeofqualitywall",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Type of Quality Wall",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_memberspresent",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Members Present",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 500
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_packappearancerating",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Pack Appearance Rating",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_sealingqualityrating",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Sealing Quality Rating",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_codingrating",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Coding Rating",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  },

  {
    "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
    "SchemaName": "cr3ea_remarks",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Remarks",
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
    "SchemaName": "cr3ea_overallrating",
    "DisplayName": {
      "LocalizedLabels": [
        {
          "Label": "Overall Rating",
          "LanguageCode": 1033
        }
      ]
    },
    "RequiredLevel": {
      "Value": "None"
    },
    "MaxLength": 70
  }

];


// =============================================================
// DATAVERSE CONFIGURATION
// =============================================================

const baseUrl = "https://org487f0635.crm8.dynamics.com";

const accessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImZFdHFyaEtUMWJYQUdhZlNkUW9OMXZYVFJwSSIsImtpZCI6ImZFdHFyaEtUMWJYQUdhZlNkUW9OMXZYVFJwSSJ9.eyJhdWQiOiJodHRwczovL29yZzQ4N2YwNjM1LmNybTguZHluYW1pY3MuY29tIiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjLyIsImlhdCI6MTc4NzMwMzk3NiwibmJmIjoxNzg3MzAzOTc2LCJleHAiOjE3ODczMDc4NzYsImFpbyI6ImsyRmdZQkRrbEEvMGU2alkxcXo0YjNxUy9nTVZuZTJpMG05RkRDU3JWbTVRLzNHdktRQUEiLCJhcHBpZCI6ImI3MWQyMDM5LWRhZGMtNDM5My04NzQ0LWU3ZjY0OGQwODVhMSIsImFwcGlkYWNyIjoiMSIsImlkcCI6Imh0dHBzOi8vc3RzLndpbmRvd3MubmV0LzhlZmE1Y2UyLTg2ZTQtNDg4Mi04NDBjLWYyNTc4Y2RmMDk0Yy8iLCJpZHR5cCI6ImFwcCIsIm9pZCI6ImJlMDI3YjYzLTYzNWItNDQ0MC04MDg1LWVjNmI0YTZiNjZkMCIsInJoIjoiMS5BVWtBNGx6Nmp1U0dna2lFRFBKWGpOOEpUQWNBQUFBQUFBQUF3QUFBQUFBQUFBQUFBQUJKQUEuIiwic3ViIjoiYmUwMjdiNjMtNjM1Yi00NDQwLTgwODUtZWM2YjRhNmI2NmQwIiwidGVuYW50X3JlZ2lvbl9zY29wZSI6IkFTIiwidGlkIjoiOGVmYTVjZTItODZlNC00ODgyLTg0MGMtZjI1NzhjZGYwOTRjIiwidXRpIjoiRVd4dk5iejV4MEdHbEFKYmtuUWZBQSIsInZlciI6IjEuMCIsInhtc19hY3RfZmN0IjoiMyA5IiwieG1zX2Z0ZCI6IjlMX0J0M2VOT0RGWlVZRERxS00wdzcwRlRCekFsV2RaWG9tVlNkMFh2ck1CYTI5eVpXRnpiM1YwYUMxa2MyMXoiLCJ4bXNfaWRyZWwiOiIyIDciLCJ4bXNfcmQiOiIwLjQyTGxZQkppOUJRUzRXQVhFdGgwY3pNNzQtb0ZMbDFmWjRZZlN1VzlJQ1RDd1NrazhON19KbGRtN3lHM0JYR05MLXRfc0hZSmlYQndDQW13TTBEQUFTZ3RKTUxCTFNSd1lmTzd0aWxtVTlSV2NqX2M1WE4xd3lVQSIsInhtc19zdWJfZmN0IjoiMyA5In0.lXHdJBYqq3qmkxpE57b98AvvExC8TiK56KXfngoB4nXhxu_Dcm3cwdvG8DOwjN7jzan60pCNFK21PWt4_5-WHs3Z_p76buXDO56GeO5gfbcf7jKJ-x7mjHKJgtHVDBvIjqYPwdJiStjh8R9aki_1iHWTccn4Xo3y8_yYE2r8i0TOCNk9tNthBl__K76T_oqymz87KdvcXOvPLyREZrtlT4BgehAQWiD-jAO9Xz2ipsO22YS0LTaUf1QO17CC7Up09Px7MDOKJZ--sPsdQVrojVofCZP1qKQEa5RBNNWIy-L7XHLlBLBdxIVaD3PAs-TcfZx8e06yAK7VSx6AVuSjCw"
const tableLogicalName =
  "cr3ea_prod_rajpura_pkgops_qualitywall";


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