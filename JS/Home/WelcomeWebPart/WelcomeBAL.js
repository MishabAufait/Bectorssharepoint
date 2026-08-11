var SelectedDepartmentValue = 'All';
var userDepratmentId = 0;
var userRoleSequence = 0;
var departmentTourId = '';
var departmentTourStartDate = '';
var PlantTourStartDate = '';
var PlantId = 0;
var departmentTourStatus = '';
var PlantTourStatus = '';
var RoleName = '';
var userRoleID = 0;
var userPlantId;
var Plantid;
var PlantTourId = '';
var departmentID = '';
var isWelcomeTourInitiated = false;
var DepartmentNameLeftNavi = "";
//var CriteriaNameLeftNavi="";
var LeftNaviDept = "";
var LeftNaviCriteria = "";
var ShiftVal = "";

/* =========================================================
   ✅ UPDATED: Select2 Init (Safe + Popup-aware)
   - avoids double init
   - correct dropdownParent for #shiftPopup
   ========================================================= */
function initSelect2(scope) {
  if (!window.jQuery || !$.fn.select2) return;

  const $scope = scope ? $(scope) : $(document);

  $scope.find("select.form-select").each(function () {
    const $sel = $(this);

    // avoid double init
    if ($sel.hasClass("select2-hidden-accessible")) return;

    // If the select is inside #shiftPopup -> force dropdownParent to that popup-body
    const $shiftPopup = $sel.closest("#shiftPopup");
    const $popupBody = $shiftPopup.length ? $shiftPopup.find(".popup-body") : $sel.closest(".popup-body");

    $sel.select2({
      minimumResultsForSearch: -1,
      dropdownAutoWidth: true,
      width: "100%",
      dropdownParent: $popupBody.length ? $popupBody : $(document.body)
    });
  });
}

$(document).ready(function () {
  var sidebar = $('.sidebar');

  initSelect2(document); // ✅ instead of $(".form-select").select2();

  $('#ShowAnnoucements').show();
  HideAllWebParts();
  welcomeToUser();
  CurrentDateTime();

  setInterval(function () {
    CurrentDateTime();
  }, 60000);

  ShowLoader();
  getHomeEmployeeDetails(getHomeEmployeeDetailsSuccess, EmployeeDetailsFailure);
  initializeOwlCarousel('#CriticalCategoryId');
});

function HideAllWebParts() {
  $('#EmployeeDiv').hide();
  $('#ShowGraph').hide();
  $('#ShowObservation').hide();
  $('#tblTourScores').hide();
  $('#ShowCategory').hide();
}

function ShowAllWebParts() {
  $('#EmployeeDiv').show();
  $('#ShowGraph').show();
  $('#ShowObservation').show();
  $('#tblTourScores').show();
  $('#ShowCategory').show();
}

function welcomeToUser() {
  $('#welcometoUser').text('Hello, ' + currentUser);
  var currentUserProfilePicture = getUserProfilePicture(currentUser);
  $("#userProfileImg").attr("src", currentUserProfilePicture);
}

function getUserProfilePicture(currentUser) {
  var accountName = encodeURIComponent(currentUser);
  var profilePictureUrl = "/_layouts/15/userphoto.aspx?size=L&accountname=" + accountName;
  return profilePictureUrl;
}

function CurrentDateTime() {
  var TodaysDate = moment().format('hh:mmA MMMM DD, YYYY ');
  $('#timeId').text(TodaysDate);
}

function BindEmpMasterLink(empLink, LeftNaviCriteria) {
  $('.custom-left-navigation ul li ul li').each(function () {
    if ($(this).find('a span.menu-item-text').text() == 'Employee Master') {
      $(this).find('a').removeAttr('href');
      $(this).find('a').attr('onclick', "gotoLink('" + empLink + "')");
    }
    else if ($(this).find('a span.menu-item-text').text() == 'Criteria Master') {
      $(this).find('a').removeAttr('href');
      $(this).find('a').attr('onclick', "gotoLink('" + LeftNaviCriteria + "')");
    }
  });
}

function gotoLink(empLink) {
  window.location.href = empLink;
}

/*Get Employee Details starts*/
function getHomeEmployeeDetailsSuccess(collEmployee) {
  if (collEmployee.length > 0) {

    userDepratmentId = collEmployee[0].DepartmentId.toString();
    userRoleSequence = collEmployee[0].RoleSequence;
    userRoleID = collEmployee[0].RoleId.toString();
    userPlantId = collEmployee[0].PlantTitle;
    RoleName = collEmployee[0].RoleName;
    Plantid = collEmployee[0].PlantId.toString();
    EmployeeName = collEmployee[0].Title;
    DepartmentNameLeftNavi = collEmployee[0].DepartmentTitle;

    if (userRoleSequence == 30 || userRoleSequence == 20 || userRoleSequence == 10 || userRoleSequence == 15 || userRoleSequence == 35) {
      LeftNaviDept = SiteAbsoluteUrl + "/Lists/EmployeeList/AllItems.aspx";

      LeftNaviCriteria = SiteAbsoluteUrl + "/Lists/CriteriaMaster/AllItems.aspx?FilterField1=DepartmentId&FilterValue1=" + DepartmentNameLeftNavi + "&FilterType1=Lookup&viewid=156e4b64%2D2362%2D46f5%2D9a33%2D2dc4f5477c4f";
      BindEmpMasterLink(LeftNaviDept, LeftNaviCriteria);

      if (collEmployee[0].PlantId) {
        PlantId = collEmployee[0].PlantTitle;
        $('#hdnPlantId').val(collEmployee[0].PlantId);

        if (PlantId == "Bangalore") {
          $('#EmployeeDiv').show();
          $('#ShowGraph').show();
          $('#ShowObservation').show();
          $('#tblTourScores').show();
        }
        else {
          ShowAllWebParts();
        }
      }

      getDepartments(getDepartmentsSuccess, getDepartmentsFailure);
    }
    else {
      alert('You are not authorized to access this page!');
    }
  }
  else {
    alert('Employee Name or Role not found !');
  }
  HideLoader();
}

function EmployeeDetailsFailure() {
  HideLoader();
}
/*Get Employee Details ends*/

var itemsToToggle = ['My Tours', 'Department Scores', 'Plant Scores'];
toggleHomeMenuItems($('.sidebar'), itemsToToggle, userDepratmentId);

function getDepartmentsSuccess(collDepartment) {
  if (collDepartment.length > 0) {
    var DepartmentDropDown = "<option value='All'>All Department</option>";

    for (var i = 0; i < collDepartment.length; i++) {
      if (collDepartment[i].Title == userPlantId) {
        DepartmentDropDown += "<option value=" + collDepartment[i].Id + ">" + collDepartment[i].Title1 + "</option>";
      }
      else if (userPlantId == "All Plant") {
        DepartmentDropDown += "<option value=" + collDepartment[i].Id + ">" + collDepartment[i].Title1 + "</option>";
      }
    }
    $("#DepartmentDropDownId").empty().append(DepartmentDropDown);
  }

  if (userRoleSequence == 30) {
    $('#DepartmentDropDownId').val('All').trigger('change');
    drpDepartmentChangefun();
  }
  else if (userRoleSequence == 20 || userRoleSequence == 10 || userRoleSequence == 15 || userRoleSequence == 35) {
    $("#DepartmentDropDownId").find('option[value="' + userDepratmentId + '"]').attr('selected', 'selected');
    drpDepartmentChangefun();
    $('#DepartmentDropDownId').prop('disabled', true);
  }
}

function getDepartmentsFailure() { }

function drpDepartmentChangefun() {
  var selectedDepartment = $('#DepartmentDropDownId').val();

  if (selectedDepartment != 'All') {
    SelectedDepartmentValue = selectedDepartment;
  }
  else {
    SelectedDepartmentValue = 'All';
  }

  rawCriticalCategories.length = 0;
  GetCategory(userRoleSequence, GetCategorySuccess, GetCategoryFailure);

  if (SelectedDepartmentValue == 'All') {
    GetObservationReportData(0, ObservationReportSuccess, ObservationReportFailure);
  }
  else if (SelectedDepartmentValue == 79) {
    WcmsObservationReportSuccessData();
  }
  else {
    ObservationReportSuccessData();
  }

  departmentID = (selectedDepartment != 'All') ? selectedDepartment : '';

  rawDepartments.length = 0;
  $('#tourChart').css('height', '500px');
  GetGraphDepartmentMasterData(GetGraphDepartmentMasterDataSuccess, GetGraphDepartmentMasterDataFailure);
}

// save department tour on plan tour click
function AddDepartmentTourOnClick() {
  ShowLoader();

  if (userRoleSequence == 20) {
    if (userDepratmentId == 135 || userDepratmentId == 80 || userDepratmentId == 81) {
      tourPopup();
    }
    else if (userDepratmentId == 79) {
      SaveWarehouseItem();
    }
    else if (userDepratmentId == 82) {
      tourPopup();
    }
    else {
      SaveDepartmentDataItem();
    }
  }
  else if (userRoleSequence == 30) {
    GetPTourItem(userRoleSequence, GetPTourItemSuccess, GetPTourItemFailure);
  }
  else {
    alert("Only Plant Manager and HOD are authorized to Plant Tour");
    HideLoader();
  }
}

/* =========================================================
   ✅ UPDATED: Popup Select2 (destroy + init + delay)
   - prevents multiple select2 instances
   - correct dropdownParent
   - fixes width/position issues when popup opens
   ========================================================= */
function tourPopup() {
  localStorage.setItem("shiftValue", '');

  const shiftPopup = document.querySelector("#shiftPopup");
  shiftPopup.classList.add("is-popup-active");
  $('#shiftPopup').addClass('is-popup-active');

  if (userDepratmentId == 82) {
    $('#tourSelect').empty().append(
      '<option value="Baking & Cooling">Baking & Cooling</option>' +
      '<option value="Coding">Coding</option>' +
      '<option value="Mixing">Mixing</option>' +
      '<option value="Process Format">Process Format</option>' +
      '<option value="PQI">PQI</option>' +
      '<option value="Proofing">Proofing</option>' +
      '<option value="Sieves and magnets">Sieves and magnets</option>'
    );
    $('#shiftPopupDone').attr("onclick", "SaveBakeryDataItem()");
  } else if (userDepratmentId == 135 || userDepratmentId == 80 || userDepratmentId == 81) {
    if (userPlantId === 'Rajpura' || Plantid == '14') {
      $('#tourSelect').empty().append(
        '<option value="ALC">ALC</option>' +
        '<option value="Mixing And Baking">Mixing And Baking</option>' +
        '<option value="Packaging Operations">Packaging Operations</option>' +
        '<option value="CCP, OPRP, Sieves & Magnets">CCP, OPRP, Sieves & Magnets</option>' +
        '<option value="Food Safety">Food Safety</option>'
      );
      $('#shiftPopupDone').attr("onclick", "SaveQualityDataItem()");
    } else {
      $('#tourSelect').empty().append(
        '<option value="Area Line Clearance Checklist">Area Line Clearance Checklist</option>' +
        '<option value="Baking Process Record">Baking Process Record</option>' +
        '<option value="Code Verification Record">Code Verification Record</option>' +
        '<option value="Cream Percentage Checklist">Cream Percentage Checklist</option>' +
        '<option value="OPRP And CCP Record">OPRP And CCP Record</option>' +
        '<option value="Mixing Parameter">Mixing Parameter</option>' +
        '<option value="Product Monitoring Record">Product Monitoring Record</option>' +
        '<option value="Product Quality Index">Product Quality Index</option>' +
        '<option value="Quality Wall Record">Quality Wall Record</option>' +
        '<option value="Seal Integrity Test">Seal Integrity Test</option>' +
        '<option value="Sieves And Magnets New Plant">Sieves And Magnets New Plant</option>' +
        '<option value="Sieves And Magnets Old Plant">Sieves And Magnets Old Plant</option>'
      );
      $('#shiftPopupDone').attr("onclick", "SaveQualityDataItem()");
    }
  }

  const $popupBody = $('#shiftPopup .popup-body');

  // destroy if already initialized
  if ($('#tourSelect').hasClass("select2-hidden-accessible")) {
    $('#tourSelect').select2('destroy');
  }
  if ($('#shiftSelect').hasClass("select2-hidden-accessible")) {
    $('#shiftSelect').select2('destroy');
  }

  // init after popup is visible so select2 can calculate width correctly
  setTimeout(function () {
    $('#tourSelect').select2({
      minimumResultsForSearch: -1,
      dropdownAutoWidth: true,
      width: "100%",
      dropdownParent: $popupBody
    });

    $('#shiftSelect').select2({
      minimumResultsForSearch: -1,
      dropdownAutoWidth: true,
      width: "100%",
      dropdownParent: $popupBody
    });
  }, 50);

  HideLoader();
}

/*Get Department Tour starts*/
function GetDepartmentTourDetailsFailure() { }
function GetDepartmentTourDataDetailsSuccess(data) { }

/* =========================================================
   ✅ FIXED: AccessToken check (was ||, should be &&)
   ✅ FIXED: fetch() "success:" (not valid in fetch) removed
   ✅ FIXED: recursion bug (function calling itself)
   - Now: fetch -> parse -> process list -> BindUrl
   ========================================================= */
async function GetDepartmentTourDetailsSuccess() {
  try {
    var AccessToken = await getAccessToken();
    var tableName = "cr3ea_prod_departmenttours";
    var apiVersion = "9.2";
    var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName + "?$filter=cr3ea_prod_departmenttourid eq '" + DepartmentTourId + "'";

    if (AccessToken === '' || AccessToken === undefined || AccessToken === null) {
      console.warn("Access token missing for GetDepartmentTourDetailsSuccess");
      return;
    }

    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    const response = await fetch(apiUrl, { method: "GET", headers: header });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    // Process Dataverse payload safely
    processDepartmentTourDetailsDataverse(result?.value || []);
  } catch (e) {
    console.error("GetDepartmentTourDetailsSuccess failed:", e);
  }
}

/* ✅ NEW: Dataverse processor (keeps your logic but avoids recursion) */
function processDepartmentTourDetailsDataverse(data) {
  departmentTourId = '';
  var todaysDate = moment().format('MM-DD-YYYY');
  var TourDate = '';

  if (data && data.length > 0) {
    for (var i = 0; i < data.length; i++) {
      departmentTourStatus = data[i].cr3ea_status;
      departmentTourStartDate = data[i].cr3ea_tourstartdate;

      if (data[i].cr3ea_tourstartdate) {
        TourDate = moment(data[i].cr3ea_tourstartdate).format('MM-DD-YYYY');
      }

      if (TourDate == todaysDate) {
        departmentTourId = data[i].cr3ea_prod_departmenttourid;
        departmentTourStartDate = data[i].cr3ea_tourstartdate;
      }
    }
  }

  BindUrlforDepartmentTour();
}

/* NOTE: You had duplicate function name "GetDepartmentTourDetailsSuccess" below.
   Keeping it but RENAMED to avoid override. */
function GetDepartmentTourDetailsSuccess_Legacy(data) {
  departmentTourId = '';
  var todaysDate = moment().format('MM-DD-YYYY');
  var TourDate = '';
  if (data.length > 0) {
    for (i = 0; i < data.length; i++) {
      departmentTourStatus = data[i].Status;
      departmentTourStartDate = data[i].TourStartDate;
      if (data[i].TourStartDate != '' && data[i].TourStartDate != undefined) {
        TourDate = moment(data[i].TourStartDate).format('MM-DD-YYYY');
      }
      if (TourDate == todaysDate) {
        departmentTourId = data[i].Id;
        departmentTourStartDate = data[i].TourStartDate;
      }
    }
  }
  BindUrlforDepartmentTour();
}

function BindUrlforDepartmentTour() {
  if (userRoleSequence == 20) {
    if (departmentTourId != '') {
      if (!isWelcomeTourInitiated) {
        isWelcomeTourInitiated = true;
        $('#LinkPlantTour').css('opacity', '.5');
        $('#LinkPlantTour').removeAttr('onclick');
        if (Plantid == '11') {
          window.location.href = WebAbsoluteUrl + "/Pages/WCMS.aspx?TourId=" + departmentTourId;
        }
        else {
          window.location.href = WebAbsoluteUrl + "/Pages/DepartmentTour.aspx?TourId=" + departmentTourId;
        }
        $('#LinkPlantTour').removeAttr('href');
      }
      HideLoader();
    }
    else {
      if (!isWelcomeTourInitiated) {
        isWelcomeTourInitiated = true;
        $('#LinkPlantTour').removeAttr('onclick');
        $('#LinkPlantTour').css('opacity', '.5');
        SaveDepartmentTItem();
      }
    }
  }
}

/*Create Department Tour */
async function SaveDepartmentDataItem() {
  var TourStartDateDTour = moment().format('M/D/YYYY h:mm A');
  var TourByDTour = _spPageContextInfo.userId.toString();
  var TitleDTour = RoleName + '_' + moment().format('MM-DD-YYYY');
  var AccessToken = await getAccessToken();
  var tableName = "cr3ea_prod_departmenttours";
  var apiVersion = "9.2";
  var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName;

  if (AccessToken != '' && AccessToken != undefined && AccessToken != null) {
    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    const dataToSave = {
      cr3ea_departmentid: userDepratmentId,
      cr3ea_tourstartdate: TourStartDateDTour,
      cr3ea_tourby: EmployeeName,
      cr3ea_status: 'In Progress',
      cr3ea_plantid: Plantid,
      cr3ea_roleid: userRoleID,
      cr3ea_title: TitleDTour
    };

    const isPlantTourExist = await fetch(
      apiUrl + "?$filter=cr3ea_status eq 'In Progress' and cr3ea_departmentid eq '" + userDepratmentId + "'&$top=1",
      { method: "GET", headers: header }
    );

    let plant_tour_res = await isPlantTourExist.json();

    if (plant_tour_res.value.length == 0) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: header,
        body: JSON.stringify(dataToSave)
      });

      let data = await response.json();
      var UniqueValID = data.cr3ea_prod_departmenttourid;
      SaveDTourItemSuccess(UniqueValID);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } else {
      SaveDTourItemSuccess(plant_tour_res.value[0].cr3ea_prod_departmenttourid);
    }
  }
}

/*Create Quality Tour */
async function SaveQualityDataItem() {
  const tourSelect = document.getElementById("tourSelect");
  const ProductValue = tourSelect ? tourSelect.value : "";
  if ((ProductValue === 'Area Line Clearance Checklist' || ProductValue === 'ALC') && 
      (typeof Plantid !== 'undefined' && Plantid == QualityRajpura_Config.PLANT_ID)) {
    const shiftSelect = document.getElementById("shiftSelect");
    if (shiftSelect) {
      localStorage.setItem("shiftValue", shiftSelect.options[shiftSelect.selectedIndex].text);
    }
    let newUrl = "/sites/Mrs_Bectors_PTMS/Pages/ALC.aspx?action=new";
    if (ProductValue === 'ALC') {
      newUrl = "/sites/Mrs_Bectors_PTMS/Pages/AreaLine.aspx?action=new";
    }
    window.location.href = newUrl;
    return;
  }

  const shiftSelect = document.getElementById("shiftSelect");
  const selectedText = shiftSelect.options[shiftSelect.selectedIndex].text;

  localStorage.setItem("shiftValue", selectedText);

  var TourStartDateDTour = moment().format('M/D/YYYY h:mm A');
  var TourByDTour = _spPageContextInfo.userId.toString();
  var TitleDTour = RoleName + '_' + moment().format('MM-DD-YYYY');
  var AccessToken = await getAccessToken();
  var tableName = "cr3ea_prod_qualitytours";
  var apiVersion = "9.2";
  var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName;

  if (AccessToken != '' && AccessToken != undefined && AccessToken != null) {
    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    const actualUserName = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.userDisplayName : EmployeeName;

    const dataToSave = {
      cr3ea_departmentid: userDepratmentId,
      cr3ea_tourstartdate: TourStartDateDTour,
      cr3ea_tourby: actualUserName,
      cr3ea_status: 'In Progress',
      cr3ea_plantid: Plantid,
      cr3ea_observedby: actualUserName,
      cr3ea_roleid: userRoleID,
      cr3ea_title: TitleDTour
    };

    const isPlantTourExist = await fetch(
      apiUrl + "?$filter=cr3ea_status eq 'In Progress' and cr3ea_departmentid eq '" + userDepratmentId + "'&$top=1",
      { method: "GET", headers: header }
    );

    let plant_tour_res = await isPlantTourExist.json();

    if (plant_tour_res.value.length == 0) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: header,
        body: JSON.stringify(dataToSave)
      });

      let data = await response.json();
      var UniqueValID = data.cr3ea_prod_qualitytourid;
      SaveQTourItemSuccess(UniqueValID);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } else {
      SaveQTourItemSuccess(plant_tour_res.value[0].cr3ea_prod_qualitytourid);
    }
  }
}

/*Create Bakery Tour */
async function SaveBakeryDataItem() {
  const shiftSelect = document.getElementById("shiftSelect");
  const selectedText = shiftSelect.options[shiftSelect.selectedIndex].text;

  localStorage.setItem("shiftValue", selectedText);

  var TourStartDateDTour = moment().format('M/D/YYYY h:mm A');
  var TourByDTour = _spPageContextInfo.userId.toString();
  var TitleDTour = RoleName + '_' + moment().format('MM-DD-YYYY');
  var AccessToken = await getAccessToken();
  var tableName = "cr3ea_prod_qualitytours";
  var apiVersion = "9.2";
  var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName;

  if (AccessToken != '' && AccessToken != undefined && AccessToken != null) {
    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    const dataToSave = {
      cr3ea_departmentid: userDepratmentId,
      cr3ea_tourstartdate: TourStartDateDTour,
      cr3ea_tourby: EmployeeName,
      cr3ea_status: 'In Progress',
      cr3ea_plantid: Plantid,
      cr3ea_observedby: EmployeeName,
      cr3ea_roleid: userRoleID,
      cr3ea_title: TitleDTour
    };

    const isPlantTourExist = await fetch(
      apiUrl + "?$filter=cr3ea_status eq 'In Progress' and cr3ea_departmentid eq '" + userDepratmentId + "'&$top=1",
      { method: "GET", headers: header }
    );

    let plant_tour_res = await isPlantTourExist.json();

    if (plant_tour_res.value.length == 0) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: header,
        body: JSON.stringify(dataToSave)
      });

      let data = await response.json();
      var UniqueValID = data.cr3ea_prod_qualitytourid;
      SaveBTourItemSuccess(UniqueValID);

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
    } else {
      SaveBTourItemSuccess(plant_tour_res.value[0].cr3ea_prod_qualitytourid);
    }
  }
}

function SaveDTourItemSuccess(ID) {
  var DepartTourId = ID;
  if (Plantid == '11') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/WCMS.aspx?TourId=" + DepartTourId;
  } else {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/DepartmentTour.aspx?TourId=" + DepartTourId;
  }
  window.location.href = newUrl;
}

function SaveQTourItemSuccess(ID) {
  var QualityTourId = ID;
  var ProductValue = $('#tourSelect').val();

  if (ProductValue == 'Product Quality Index') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/QualityTour.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Cream Percentage Checklist') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Cream.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Sieves And Magnets Old Plant') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/SievesAndMagnetsOldPlant.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Sieves And Magnets New Plant') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/SievesAndMagnetsNewPlant.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Product Monitoring Record') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/ProductMonitoring.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Code Verification Record') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/CodeVerification.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'OPRP And CCP Record') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/OPRP&CCP.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Baking Process Record') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Baking.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Seal Integrity Test') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/VLT.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Quality Wall Record') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Qualitywall.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Mixing Parameter') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Processparamater.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Area Line Clearance Checklist') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/ALC.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'ALC') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/AreaLine.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Mixing And Baking') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Product-Operation.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Packaging Operations') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/CCP-OPRP.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'CCP, OPRP, Sieves & Magnets') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/FoodSafety.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Food Safety') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/MixingAndBaking.aspx?TourId=" + QualityTourId;
  }

  window.location.href = newUrl;
}

function SaveBTourItemSuccess(ID) {
  var QualityTourId = ID;
  var ProductValue = $('#tourSelect').val();

  if (ProductValue == 'Baking & Cooling') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Bakingandcooling.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Coding') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Coding.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Mixing') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Mixing.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Process Format') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/Processformat.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'PQI') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/PQIBakery.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Proofing') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/ProofingBakery.aspx?TourId=" + QualityTourId;
  }
  else if (ProductValue == 'Sieves and magnets') {
    newUrl = "/sites/Mrs_Bectors_PTMS/Pages/SievesAndMagnetsBakery.aspx?TourId=" + QualityTourId;
  }

  window.location.href = newUrl;
}

function tourPopupclose() {
  localStorage.setItem("shiftValue", '');
  const shiftPopup = document.querySelector("#shiftPopup");
  shiftPopup.classList.remove("is-popup-active");
  HideLoader();
}

function SaveDepartmentTourItemFailure() {
  HideLoader();
}
/*Get Department Tour ends*/

/*Get Plant Tour starts*/
function GetPTourItemFailure() {
  HideLoader();
}

function GetPTourItemSuccess(data) {
  PlantTourId = '';
  var todaysDate = moment().format('MM-DD-YYYY');
  var TourDate = '';

  if (data.length > 0) {
    for (i = 0; i < data.length; i++) {
      PlantTourStatus = data[i].Status;
      PlantTourStartDate = data[i].TourStartDate;

      if (data[i].TourStartDate != '' && data[i].TourStartDate != undefined) {
        TourDate = moment(data[i].TourStartDate).format('MM-DD-YYYY');
      }

      if (TourDate == todaysDate) {
        PlantTourId = data[i].Id;
        PlantTourStartDate = data[i].TourStartDate;
      }
    }
  }
  BindUrlforPlantTour();
}

function BindUrlforPlantTour() {
  if (userRoleSequence == 30) {
    if (PlantTourId != '') {
      if (!isWelcomeTourInitiated) {
        isWelcomeTourInitiated = true;
        $('#LinkPlantTour').css('opacity', '.5');
        $('#LinkPlantTour').removeAttr('onclick');
        window.location.href = WebAbsoluteUrl + "/Pages/PlantTour.aspx?PTourId=" + PlantTourId;
        $('#LinkPlantTour').removeAttr('href');
      }
      HideLoader();
    }
    else {
      if (!isWelcomeTourInitiated) {
        isWelcomeTourInitiated = true;
        $('#LinkPlantTour').removeAttr('onclick');
        $('#LinkPlantTour').css('opacity', '.5');
        SavePlanTItem();
      }
    }
  }
}

/*Create Plant Tour*/
function SavePlanTItem() {
  ShowLoader();
  var objPlantTourListEntity = new PlantTourListEntity();
  objPlantTourListEntity.DepartmentId = userDepratmentId;
  objPlantTourListEntity.TourStartDate = moment().format('MM-DD-YYYY HH:mm:ss');
  objPlantTourListEntity.TourBy = _spPageContextInfo.userId;
  objPlantTourListEntity.Status = 'In Progress';
  objPlantTourListEntity.PlantId = PlantId;
  objPlantTourListEntity.RoleId = userRoleID;
  objPlantTourListEntity.Title = RoleName + '_' + moment().format('MM-DD-YYYY');
  SavePTourItem(objPlantTourListEntity, SavePTourItemSuccess, SaveDepartmentTourItemFailure);
}

function SavePTourItemSuccess(data) {
  var PlantTourId = data.d.Id;
  newUrl = "/sites/Mrs_Bectors_PTMS/Pages/PlantTour.aspx?PTourId=" + PlantTourId;
  window.location.href = newUrl;
}
/*Get Plant Tour ends*/

async function ObservationReportSuccessData() {
  var AccessToken = await getAccessToken();
  var tableName = "cr3ea_prod_observationses";
  var apiVersion = "9.2";
  var depID = userDepratmentId;

  var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName +
    "?$filter=(cr3ea_action eq 'Rejected' and cr3ea_status ne 'Closed'" +
    " and cr3ea_departmentid eq '" + depID + "'" +
    (Plantid ? " and cr3ea_plantid eq '" + Plantid + "'" : "") +
    ")&$orderby=modifiedon desc";

  if (AccessToken != '' && AccessToken != undefined && AccessToken != null) {
    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    $.ajax({
      url: apiUrl,
      type: "GET",
      headers: header,
      success: function (data) {
        ObservationReportData(data);
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      }
    });
  }
}

function ObservationReportData(collObservationReport) {
  var temTableHTML = '';

  if (collObservationReport.value.length > 0) {
    var tempObservationReportHtml = '';

    temTableHTML += '<div class="table-wrapper">' +
      '<table class="table tblAdminDashboard" >' +
      '<thead>' +
      '<tr>' +
      '<th>ID</th>' +
      '<th>Observation</th>' +
      '<th>Observed On</th>' +
      '<th>Category</th>' +
      '<th>Where</th>' +
      '<th>What</th>' +
      '<th>Near Miss</th>' +
      ' </tr>' +
      ' </thead> ' +
      '<tbody id="ObservationReportId">' +
      '</tbody >' +
      '</table>' +
      '</div>';

    var recordCount = 0;

    for (var i = 0; i < collObservationReport.value.length; i++) {
      PlantIdValue1 = PlantId;

      if (((PlantIdValue1 == userPlantId || userPlantId == "All Plant") && EmployeeName == collObservationReport.value[i].cr3ea_observedperson) || userRoleSequence == 35) {

        if (recordCount >= 4) break;

        var Severity = '';
        if (collObservationReport.value[i].cr3ea_severityid == '3') {
          Severity = '<div class="form-check"><input class="form-check-input form-check-input-sm" type="checkbox" name="Severity" disabled="disabled" value="Severity" checked></div>';
        }
        else {
          Severity = '<div class="form-check"><input class="form-check-input form-check-input-sm" type="checkbox" name="Severity" disabled="disabled" value="Severity" ></div>';
        }

        var Categorytitle = (collObservationReport.value[i].cr3ea_categoryid == null) ? '' : collObservationReport.value[i].cr3ea_categorytitle;

        tempObservationReportHtml += '<tr>' +
          '<td><a href="/sites/Mrs_Bectors_PTMS/Pages/ObservationClosure.aspx?ReqId=' + collObservationReport.value[i].cr3ea_prod_observationsid + '">' + (i + 1) + '</a></td>' +
          '<td>' + (collObservationReport.value[i].cr3ea_observation ?? '') + '</td>' +
          '<td>' + moment(collObservationReport.value[i].cr3ea_observeddate).format('DD-MMM-YY') + '</td>' +
          '<td>' + Categorytitle + '</td>' +
          '<td>' + collObservationReport.value[i].cr3ea_where + '</td>' +
          '<td>' + collObservationReport.value[i].cr3ea_what + '</td>' +
          '<td>' + Severity + '</td>' +
          '</tr>';

        recordCount++;
      }
    }

    $('#HomeObservationTableId').empty().append(temTableHTML);
    $('#ObservationReportId').empty().append(tempObservationReportHtml);

    var currentId = moment().format('hhmmss');
    $('#tblObservationReport table').attr('id', 'tblObservationReport_' + currentId);
  }
  else {
    temTableHTML += '<div class="table-wrapper">' +
      '<table class="table tblAdminDashboard" >' +
      '<thead>' +
      '<tr>' +
      '<th>ID</th>' +
      '<th>Observation</th>' +
      '<th>Observed On</th>' +
      '<th>Category</th>' +
      '<th>Where</th>' +
      '<th>What</th>' +
      '<th>Near Miss</th>' +
      '</tr>' +
      '</thead> ' +
      '<tbody id="ObservationReportId">' +
      '</tbody>' +
      '</table>' +
      '</div>';

    var noRecordRow = '<tr><td colspan="9">No Records found.</td></tr>';

    $('#HomeObservationTableId').empty().append(temTableHTML);
    $("#ObservationReportId").empty().append(noRecordRow);
  }
}

$('#tblObservationReport table').dataTable({
  "paging": false,
  "ordering": false,
  "info": false,
  "bFilter": false,
  "pageLength": 5
});

function ObservationReportFailureData() {
  alert('Failure in Open Observation');
}

async function SaveWarehouseItem() {
  try {
    const TourStartDateDTour = moment().toISOString();
    const TitleDTour = RoleName + '_' + moment().format('MM-DD-YYYY');
    const AccessToken = await getAccessToken();

    const tableName = "cr3ea_prod_warehousetours";
    const apiVersion = "9.2";
    const apiUrl = `${environmentUrl}/api/data/v${apiVersion}/${tableName}`;

    if (!AccessToken) throw new Error("Access token is missing!");

    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": `Bearer ${AccessToken}`
    };

    const dataToSave = {
      cr3ea_departmentid: userDepratmentId,
      cr3ea_tourstartdate: TourStartDateDTour,
      cr3ea_tourby: EmployeeName,
      cr3ea_status: "In Progress",
      cr3ea_plantid: Plantid,
      cr3ea_roleid: userRoleID,
      cr3ea_title: TitleDTour
    };

    const isPlantTourExist = await fetch(
      `${apiUrl}?$filter=cr3ea_status eq 'In Progress' and cr3ea_departmentid eq '${userDepratmentId}' and cr3ea_tourby eq '${EmployeeName}'&$top=1`,
      { method: "GET", headers }
    );

    const plant_tour_res = await isPlantTourExist.json();

    if (plant_tour_res.value.length === 0) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) throw new Error(`Save error: ${response.statusText}`);

      const data = await response.json();
      SaveDTourItemSuccess(data.cr3ea_prod_warehousetourid);
    } else {
      SaveDTourItemSuccess(plant_tour_res.value[0].cr3ea_prod_warehousetourid);
    }
  } catch (error) {
    console.error("WarehouseItem failed:", error);
  }
}

async function WcmsObservationReportSuccessData() {
  var AccessToken = await getAccessToken();
  var tableName = "cr3ea_prod_wobservationses";
  var apiVersion = "9.2";
  var apiUrl = environmentUrl + "/api/data/v" + apiVersion + "/" + tableName +
    "?$filter=(cr3ea_status eq 'Not Okay' and cr3ea_closurestatus eq 'Pending')" +
    "&$orderby=createdon desc&$top=4";

  if (AccessToken) {
    var header = {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Prefer": "return=representation",
      "Authorization": "Bearer " + AccessToken
    };

    $.ajax({
      url: apiUrl,
      type: "GET",
      headers: header,
      success: function (data) {
        WcmsObservationReportData(data);
        toggleMenuItemsByDepartment(SelectedDepartmentValue);
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      }
    });
  }
}

// Function to hide/show items by department
function toggleMenuItemsByDepartment(departmentId) {
  var itemsToToggle = ['My Tours', 'Department Scores', 'Plant Scores'];
  var menuList = $('.nav-list .list-item');

  menuList.each(function () {
    var itemName = $(this).find('span.item-name').text().trim();

    if (itemName === 'Home') {
      var subListItems = $(this).find(".nav-sub-list .sub-list-item");

      subListItems.each(function () {
        var menulink = $(this).find('a');
        var text = menulink.text().trim();

        if (itemsToToggle.includes(text)) {
          if (departmentId == 79) {
            $(this).hide();
          } else {
            $(this).show();
          }
        }
      });
    }
  });
}

function WcmsObservationReportData(collObservationReport) {
  var temTableHTML = '';

  if (collObservationReport.value.length > 0) {
    var tempObservationReportHtml = '';

    temTableHTML += '<div class="table-wrapper">' +
      '<table class="table tblAdminDashboard" >' +
      '<thead>' +
      '<tr>' +
      '<th>ID</th>' +
      '<th>Observation</th>' +
      '<th>Observed On</th>' +
      '<th>Observed By</th>' +
      '<th>Category</th>' +
      '<th>What</th>' +
      ' </tr>' +
      ' </thead> ' +
      '<tbody id="ObservationReportId">' +
      '</tbody >' +
      '</table>' +
      '</div>';

    var recordCount = 0;

    for (var i = 0; i < collObservationReport.value.length; i++) {
      PlantIdValue1 = PlantId;

      if (((PlantIdValue1 == userPlantId || userPlantId == "All Plant") && EmployeeName == collObservationReport.value[i].cr3ea_observedby) || userRoleSequence == 35) {
        var Categorytitle = (collObservationReport.value[i].cr3ea_categoryid == null) ? '' : collObservationReport.value[i].cr3ea_categorytitle;

        tempObservationReportHtml += '<tr>' +
          '<td><a href="/sites/Mrs_Bectors_PTMS/Pages/ObservationClosure.aspx?ReqId=' + collObservationReport.value[i].cr3ea_prod_wobservationsid + '">' + (i + 1) + '</a></td>' +
          '<td>' + collObservationReport.value[i].cr3ea_defectremarks + '</td>' +
          '<td>' + moment(collObservationReport.value[i].cr3ea_tourstartdate).format('DD-MMM-YY') + '</td>' +
          '<td>' + collObservationReport.value[i].cr3ea_observedby + '</td>' +
          '<td>' + collObservationReport.value[i].cr3ea_area + '</td>' +
          '<td>' + collObservationReport.value[i].cr3ea_criteria + '</td>' +
          '</tr>';

        recordCount++;
      }
    }

    $('#HomeObservationTableId').empty().append(temTableHTML);
    $('#ObservationReportId').empty().append(tempObservationReportHtml);

    var currentId = moment().format('hhmmss');
    $('#tblObservationReport table').attr('id', 'tblObservationReport_' + currentId);
  }
  else {
    temTableHTML += '<div class="table-wrapper">' +
      '<table class="table tblAdminDashboard" >' +
      '<thead>' +
      '<tr>' +
      '<th>ID</th>' +
      '<th>Observation</th>' +
      '<th>Observed On</th>' +
      '<th>Category</th>' +
      '<th>Where</th>' +
      '<th>What</th>' +
      '<th>Near Miss</th>' +
      '</tr>' +
      '</thead> ' +
      '<tbody id="ObservationReportId">' +
      '</tbody>' +
      '</table>' +
      '</div>';

    var noRecordRow = '<tr><td colspan="9">No Records found.</td></tr>';

    $('#HomeObservationTableId').empty().append(temTableHTML);
    $("#ObservationReportId").empty().append(noRecordRow);
  }
}

$('#tblObservationReport table').dataTable({
  "paging": false,
  "ordering": false,
  "info": false,
  "bFilter": false,
  "pageLength": 5
});
