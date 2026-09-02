# Dataverse Automated Column Creator Scripts

This folder contains 13 standalone JavaScript scripts designed to automatically add all required columns and lookup relationships to your Dataverse tables.

---

## How It Works

1. **Create the Table Manually** in Power Apps Maker ([make.powerapps.com](https://make.powerapps.com)) using the **Table Logical Name** listed below.
2. **Open the Script** for that table and copy its contents.
3. **Run in Browser Console**:
   - Open any logged-in SharePoint page (e.g. `/sites/Mrs_Bectors_PTMS`) or Power Apps tab in Chrome/Edge.
   - Press `F12` to open DevTools, switch to the **Console** tab.
   - Paste the script and hit `Enter`.
4. The script will:
   - Connect using your active session token.
   - Query existing columns on the table (skipping any that already exist).
   - Create all missing columns with their exact Dataverse types (Text, Multiline, Integer, Decimal, Boolean).
   - Create the One-to-Many Relationship / Lookup column linking to the Parent Tour (`cr3ea_qualitytourid`).
   - Automatically trigger `PublishXml` to publish the table customizations.

---

## Table Reference & Script Mapping

| # | Script Name | UAT Table Logical Name | PROD Table Logical Name | Lookup Logical Name (Power Apps Maker) | Target Table |
|---|---|---|---|---|---|
| **01** | [`01_parent_tour.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/01_parent_tour.js) | `cr3ea_rajpura_quality_tour` | `cr3ea_prod_rajpura_quality_tour` | **None** *(Primary Parent Header)* | N/A |
| **02** | [`02_alc.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/02_alc.js) | `cr3ea_rajpura_alcs` | `cr3ea_prod_rajpura_alcs` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **03** | [`03_food_safety.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/03_food_safety.js) | `cr3ea_foodsafetychecklistforrajpura` | `cr3ea_prod_foodsafetychecklistforrajpura` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **04** | [`04_mixing_baking.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/04_mixing_baking.js) | `cr3ea_rajpura_mixingandbaking` | `cr3ea_prod_rajpura_mixingandbaking` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **05** | [`05_pkgops_temp_humidity.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/05_pkgops_temp_humidity.js) | `cr3ea_rajpura_pkgops_temphumidity` | `cr3ea_prod_rajpura_pkgops_temphumidity` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **06** | [`06_pkgops_code_verification.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/06_pkgops_code_verification.js) | `cr3ea_rajpura_pkgops_codeverification` | `cr3ea_prod_rajpura_pkgops_codeverification` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **07** | [`07_pkgops_papa.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/07_pkgops_papa.js) | `cr3ea_rajpura_pkgops_papa` | `cr3ea_prod_rajpura_pkgops_papa` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **08** | [`08_pkgops_pqi_netweight.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/08_pkgops_pqi_netweight.js) | `cr3ea_rajpura_pkgops_pqi_netweight` | `cr3ea_prod_rajpura_pkgops_pqi_netweight` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **09** | [`09_pkgops_pqi_evaluation.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/09_pkgops_pqi_evaluation.js) | `cr3ea_rajpura_pkgops_pqi_evaluation` | `cr3ea_prod_rajpura_pkgops_pqi_evaluation` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **10** | [`10_pkgops_seal_integrity.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/10_pkgops_seal_integrity.js) | `cr3ea_rajpura_pkgops_sealintegrity` | `cr3ea_prod_rajpura_pkgops_sealintegrity` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **11** | [`11_pkgops_quality_wall.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/11_pkgops_quality_wall.js) | `cr3ea_rajpura_pkgops_qualitywall` | `cr3ea_prod_rajpura_pkgops_qualitywall` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **12** | [`12_ccp_oprp.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/12_ccp_oprp.js) | `cr3ea_rajpura_ccpoprp` | `cr3ea_prod_rajpura_ccpoprp` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |
| **13** | [`13_sieves_magnets.js`](file:///c:/Users/Mishab/OneDrive%20-%20Aufait%20Technologies%20Pvt%20Ltd/Shortcuts/Mrs_Bectors_PTMS%20-%20BectorsSourceCode/dataverse/13_sieves_magnets.js) | `cr3ea_rajpura_sievesmagnets` | `cr3ea_prod_rajpura_sievesmagnets` | `cr3ea_qualitytourid` | `cr3ea_rajpura_quality_tour` / `prod_` |

---

## Switching Environment in the Script

Near the top of each script, you can change the target environment if needed:
```javascript
const ENVIRONMENT = "DEV"; // Options: "DEV", "UAT", "PROD"
```
- When set to `"DEV"` or `"UAT"`, it creates the non-`prod_` columns and connects to that instance.
- When set to `"PROD"`, it targets the `prod_` table name.
