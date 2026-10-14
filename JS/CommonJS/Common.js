if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}

var myToast = '';

var GLOBALROOTSITE = window.location.origin;
var SiteAbsoluteUrl;
var SiteRelativeUrl;
var WebAbsoluteUrl;
var WebRelativeUrl;

$(document).ready(function () {
    var sidebar = $('.sidebar');
    var menuList = sidebar.find('.nav-list .list-item');
    menuList.each(function () {
        var itemName = $(this).find('span.item-name').text();

        if (itemName.trim() === 'Reports') {
    var subListItems = $(this).find(".nav-sub-list .sub-list-item");
    var menulink = $(this).find('a');

    subListItems.each(function () {
        var menulink = $(this).find('a');

        if (menulink.text() === '\n\t\t\t\t\tTours Report' || menulink.text().trim() === 'Tours Report') {
    menulink.attr({
        "href": "https://app.powerbi.com/reportEmbed?reportId=4147eb94-3935-41f7-a629-3a86b5f549c8&autoAuth=true&ctid=aa44c5c1-5448-4e74-88d9-17838a6f9d5a",
        "target": "_blank"
    });
    }
    else if (menulink.text() === '\n\t\t\t\t\tQuality Biscuit Report' || menulink.text() === '\n\t\t\t\t\tQuality Tours Report' || menulink.text().trim() === 'Quality Biscuit Report' || menulink.text().trim() === 'Quality Tours Report') {
        menulink.attr({
            "href": "https://app.powerbi.com/reportEmbed?reportId=a51c1eab-db99-44fc-9c0c-93536c90f0ed&autoAuth=true&ctid=aa44c5c1-5448-4e74-88d9-17838a6f9d5a",
            "target": "_blank"
        });
    }
    else if (menulink.text() === '\n\t\t\t\t\tQuality Bakery Report' || menulink.text().trim() === 'Quality Bakery Report') {
        menulink.attr({
            "href": "https://app.powerbi.com/reportEmbed?reportId=62f422de-3be3-4c5e-916c-b6c64aae9ae7&autoAuth=true&ctid=aa44c5c1-5448-4e74-88d9-17838a6f9d5a",
            "target": "_blank"
        });
    }
    else if (menulink.text().toLowerCase().indexOf('rajpura') !== -1) {
        menulink.attr({
            "href": "https://app.fabric.microsoft.com/links/hf07t1lliz?ctid=aa44c5c1-5448-4e74-88d9-17838a6f9d5a&pbi_source=linkShare",
            "target": "_blank"
        });
    }
    });

    var hasRajpura = false;
    subListItems.each(function () {
        if ($(this).find('a').text().toLowerCase().indexOf('rajpura') !== -1) {
            hasRajpura = true;
        }
    });
    if (!hasRajpura && subListItems.length > 0) {
        $(this).find(".nav-sub-list").append(
            '<li class="sub-list-item">' +
                '<a class="bec-fs-md" href="https://app.fabric.microsoft.com/links/hf07t1lliz?ctid=aa44c5c1-5448-4e74-88d9-17838a6f9d5a&pbi_source=linkShare" target="_blank">' +
                    'Rajpura Report' +
                '</a>' +
            '</li>'
        );
    }
}

        // Check if the menu item text is 'Administrator'
        if (itemName.trim() === 'Administrator') {
            var subListItems = $(this).find(".nav-sub-list .sub-list-item")
            subListItems.each(function () {
                var menulink = $(this).find('a')
                if (menulink.text() === 'Role Master') {
                    menulink.attr("href", "https://bectors.sharepoint.com/sites/PTMS_PRD/Lists/RoleMaster/AllItems.aspx?npsAction=createList")
                }
                else if (menulink.text() === 'Criteria Master') {
                    menulink.attr("href", "https://bectors.sharepoint.com/sites/PTMS_PRD/Lists/CriteriaMaster/AllItems.aspx?npsAction=createList")
                }
                else if (menulink.text() === 'Employees') {
                    menulink.attr("href", "https://bectors.sharepoint.com/sites/PTMS_PRD/Lists/EmployeeList/AllItems.aspx?npsAction=createList")
                }
                else if (menulink.text() === 'Plant Managers' || menulink.text() === 'Department Head') {
                    $(this).hide();
                }
                else if (menulink.text() === 'YearMaster') {
                    menulink.attr("href", "https://bectors.sharepoint.com/sites/PTMS_PRD/Lists/YearMaster/AllItems.aspx?npsAction=createList")
                }
                
            });
        }
        else if (itemName.trim() === 'Documentation') {
            var subListItems = $(this).find(".nav-sub-list .sub-list-item")
            subListItems.each(function () {
                var menulink = $(this).find('a')
                if (menulink.text() === 'Admin Manual') {
                    menulink.attr({
                        "href": "/sites/PTMS_PRD/Shared%20Documents/Bectors_PTMS_User_Manual%20V1.0.docx?d=w9947a3866687484485dee1698917d30c&csf=1&web=1&e=dmRZMJ",
                        "target": "_blank"
                    });
                    menulink.click(function () {
                        ViewPolicyDoc(this);
                    });
                }
                else if (menulink.text() === 'User Manual') {
                    menulink.attr({
                        "href": "/sites/PTMS_PRD/Shared%20Documents/Bectors_PTMS_User_Manual%20V1.0.pdf?csf=1&web=1&e=disEj6",
                        "target": "_blank"
                    });
                    menulink.click(function () {
                        ViewPolicyDoc(this);
                    });
                }
            });
        }
    });

    WebAbsoluteUrl = _spPageContextInfo.webAbsoluteUrl;
    WebRelativeUrl = _spPageContextInfo.webServerRelativeUrl;
    SiteAbsoluteUrl = _spPageContextInfo.siteAbsoluteUrl;
    SiteRelativeUrl = _spPageContextInfo.siteServerRelativeUrl;
    SiteUrl = _spPageContextInfo.siteAbsoluteUrl;
    SetMaxLength();

    initializeSideNav();

    // Call to check for user group memberships
    SP.SOD.executeFunc('sp.js', 'SP.ClientContext', function () {
        checkUserGroups(function (groups) {
            // Show sections based on user groups


            if (groups.includes("Administrator")) {
                menuList.each(function () {
                    var itemName = $(this).find('span.item-name').text();

                    // Check if the menu item text is 'Administrator'
                    if (itemName.trim() === 'Administrator') {
                        $(this).show();  // Hide the menu item
                    }

                    // Visible Documentation menu lists 'Admin Manual' for only Administrators
                    menuList.each(function () {
                        var subMenuListItems = $(this).find(".nav-sub-list .sub-list-item");
                        subMenuListItems.each(function () {
                            var subMenuLink = $(this).find('a');
                            if (subMenuLink.text().trim() === "Admin Manual") {
                                $(this).show();
                            }
                        });
                    });
                });
            } else {
                menuList.each(function () {
                    var itemName = $(this).find('span.item-name').text();

                    // Check if the menu item text is 'Administrator'
                    if (itemName.trim() === 'Administrator') {
                        $(this).hide();  // Show the menu item
                    }

                    // Hide Documentation menu lists 'Admin Manual' for other users
                    menuList.each(function () {
                        var subMenuListItems = $(this).find(".nav-sub-list .sub-list-item");
                        subMenuListItems.each(function () {
                            var subMenuLink = $(this).find('a');
                            if (subMenuLink.text().trim() === "Admin Manual") {
                                $(this).hide();
                            }
                        });
                    });
                });
            }
        });

    });

    function ViewPolicyDoc(data) {
        var siteUrl = _spPageContextInfo.webAbsoluteUrl;
        var fileRelativeUrl = $(data).attr('href');

        // Check for Excel files and open in SharePoint viewer
        if (fileRelativeUrl.toLowerCase().indexOf(".xls") !== -1 ||
            fileRelativeUrl.toLowerCase().indexOf(".xlsx") !== -1) {
            var viewUrl = siteUrl + '/_layouts/15/Doc.aspx?sourcedoc=' + encodeURIComponent(fileRelativeUrl) +
                '&file=' + encodeURIComponent(fileRelativeUrl) +
                '&action=default&mobileredirect=true';
            window.open(viewUrl, "_blank");
        }
        // Check for Word files
        else if (fileRelativeUrl.toLowerCase().indexOf(".doc") !== -1 ||
            fileRelativeUrl.toLowerCase().indexOf(".docx") !== -1) {
            console.log(fileRelativeUrl);
            var modifiedFileRelativeUrl = fileRelativeUrl.replace('/sites/PTMS_PRD', '');
            var viewerUrl = siteUrl + '/_layouts/15/Doc.aspx?sourcedoc=' + encodeURIComponent(fileRelativeUrl) +
                '&file=' + encodeURIComponent(modifiedFileRelativeUrl) +
                '&action=default&mobileredirect=true';
            window.open(viewerUrl, "_blank");
        }
        // Handle PDF files
        else {
            var modifiedFileRelativeUrl = fileRelativeUrl.replace('/sites/PTMS_PRD', '');
            var pdfUrl = siteUrl + modifiedFileRelativeUrl; // Direct link to PDF
            window.open(pdfUrl, "_blank");
        }
    }

    function PowerBiView(data){
        var fileRelativeUrl = $(data).attr('href');
        var modifiedFileRelativeUrl = fileRelativeUrl;
            window.open(modifiedFileRelativeUrl, "_blank");
    }


    // Function to check user group memberships
    function checkUserGroups(callback) {
        var context = SP.ClientContext.get_current();
        var web = context.get_web();
        var currentUser = web.get_currentUser();
        var groups = currentUser.get_groups();

        context.load(currentUser);
        context.load(groups);

        context.executeQueryAsync(function () {
            var groupNames = [];
            var groupEnumerator = groups.getEnumerator();

            while (groupEnumerator.moveNext()) {
                var group = groupEnumerator.get_current();
                groupNames.push(group.get_title());
            }

            callback(groupNames);
        }, function (sender, args) {
            console.error('Failed to get groups: ' + args.get_message());
            callback([]);
        });
    }

});

function initializeSideNav() {
    var listItems = $(".sidebar .nav-list .list-item");
    listItems.first().addClass("active");

    listItems.each(function () {
    var item = $(this);
    var spanEl = item.find("span").first();

    // Unbind previous click handler before binding
    spanEl.off("click").on("click", function () {
        listItems.not(item).removeClass("active");
        item.toggleClass("active");

        // On mobile, auto-close sidebar after selection
        if (window.innerWidth <= 768) {
            $(".sidebar-container").removeClass("mobile-open");
        }
    });
});


    $(".sidebar-container .nav-list .list-item").each(function () {
        $(this).find(".item-title").click(function () {
            var sidebarContainer = $(".sidebar-container");
            if (sidebarContainer.hasClass("collapsed")) {
                sidebarContainer.removeClass("collapsed");
                $(".sidebar-container .nav-list .list-item").each(function () {
                    $(this).find(".item-name").css("visibility", "visible");
                });
            }
        });
    });

    var sidebarToggleBtn = $("#sidebarToggle");
    sidebarToggleBtn.off("click").on("click", function (e) {
    e.preventDefault();

    if (window.innerWidth <= 768) {
        $(".sidebar-container").toggleClass("mobile-open");
    } else {
        $(".sidebar .sidebar-container").toggleClass("collapsed");
        $(".sidebar-container .nav-list .list-item").each(function () {
            $(this).removeClass("active");
            if ($(".sidebar-container").hasClass("collapsed")) {
                $(this).find(".item-title .item-name").css("visibility", "hidden");
            } else {
                $(this).find(".item-title .item-name").css("visibility", "visible");
            }
        });
    }
});

}


var requestURL = "{0}/_api/Web/Lists/GetByTitle('{1}')/Items{2}";

var requestLibraryURL = "{0}/_api/Web/GetFolderByServerRelativeUrl('{1}'){2}";
var requestLibraryFolderURL = "{0}/_api/Web/GetFolderByServerRelativeUrl('{1}'){2}";

/* Common functions (general) */
// create JavaScript object to create headers for request
var requestHeaders =
{
    "accept": "application/json;odata=verbose",
    "X-RequestDigest": $("#__REQUESTDIGEST").val()
}


/*
This function will use to format string just like String.Format() (IFormatProvider for .NET).
It will format string as per argument and value provided to it.
*/
String.prototype.format = function () {
    var me = this;
    for (var i = 0; i < arguments.length; i++)
        me = me.replace(new RegExp('\\{' + i + '\\}', 'g'), arguments[i]);
    return me;
}


/*
This function will distinct array and return new distinct array
*/
function ArrayDistinct(a) {
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
}

/*
Setting up globla variables availabelon page load complete
*/

/*
Tis function is helper function of Rest api. It creates and retrurn filter part of rest api
Parameter:
ObjectArray - Array of value needs to filter
FieldName - FieldName on which above array value will be filtered
*/
function CreateFilterQueryFromArray(ObjectArray, FieldName) {
    var FilterByString = '';
    if (ObjectArray != null) {
        ObjectArray.forEach(function (objTemp) {
            FilterByString += FieldName + " eq " + objTemp + " or ";
        });
        FilterByString = FilterByString.substring(0, FilterByString.length - 3);
    }
    return FilterByString;
}

/*--- SharePoint related functions  ----*/

/* 
Update link for Creating New Posts 

Parameter
url - page url to open in dialog box
title - title of the dialog box
*/
function ShowSPDialog(url, title) {
    //alert('hi');
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            url: url,
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 800,
            //height: 500,
            autoSize: true
        });
    }, 'sp.js');
}

function ShowSPDialogWithResult(url, title, DialogResultCallBack) {
    //alert('hi');
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            url: url,
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 800,
            //height: 500,
            autoSize: true,
            dialogReturnValueCallback: DialogResultCallBack
        });
    }, 'sp.js');
}

function ShowSPDialogWithResultdynamicheight(url, title, height, width, DialogResultCallBack) {
    //alert('hi');
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            url: url,
            title: title,
            allowMaximize: false,
            showClose: true,
            width: width,
            height: height,
            autoSize: true,
            dialogReturnValueCallback: DialogResultCallBack
        });
    }, 'sp.js');
}


function initializeTable(tableId) {
    $('#' + tableId).DataTable({
        searching: true,
        "autoWidth": false,
        "lengthMenu": [10, 20, 30, 40]
    });

}

function ShowSPDialogWithResultFixedHeight(url, title, DialogResultCallBack) {
    //alert('hi');
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            url: url,
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 800,
            height: 300,
            //autoSize: true,	        
            dialogReturnValueCallback: DialogResultCallBack
        });
    }, 'sp.js');
}


function ShowSPDialogHTMLwithHeight(elementID, title, height) {
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            html: document.getElementById(elementID),
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 640,
            height: height,
            //height: 320,
            autoSize: true
        });
    }, 'sp.js');
}


function ShowSPDialogHTML(elementID, title) {
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            html: document.getElementById(elementID),
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 640,
            //height: 200,
            //height: 320,
            autoSize: true
        });
    }, 'sp.js');
}

function ShowSPDialogHTMLwithCallback(elementID, title, DialogResultCallBack) {
    ExecuteOrDelayUntilScriptLoaded(function () {
        SP.UI.ModalDialog.showModalDialog({
            html: document.getElementById(elementID),
            title: title,
            allowMaximize: false,
            showClose: true,
            //width: 640,
            //height: 200,
            //height: 320,
            autoSize: true,
            dialogReturnValueCallback: DialogResultCallBack

        });
    }, 'sp.js');
}



// datepart: 'y', 'm', 'w', 'd', 'h', 'n', 's'
Date.dateDiff = function (datepart, fromdate, todate) {
    datepart = datepart.toLowerCase();
    var diff = todate - fromdate;
    var divideBy = {
        w: 604800000,
        d: 86400000,
        h: 3600000,
        n: 60000,
        s: 1000
    };

    return Math.floor(diff / divideBy[datepart]);
}


function DateConversion(datetime) {

    var date = moment(datetime);
    return date.format('DD-MM-YYYY HH:mm A');

    /*
     var d1=new Date(datetime);
    
            var curr_year = d1.getFullYear();
    
            var curr_month = d1.getMonth() + 1; //Months are zero based
            if (curr_month < 10)
                curr_month = "0" + curr_month;
    
            var curr_date = d1.getDate();
            if (curr_date < 10)
                curr_date = "0" + curr_date;
    
            var curr_hour = d1.getHours();
            var currsit="AM";
            if (curr_hour < 12)
            {
                curr_hour = "0" + curr_hour ;
                currsit=" AM";
            }
            else if (curr_hour > 11)
            {
                curr_hour = "0" + parseInt(curr_hour-12);
                currsit=" PM";
            }
                
                
    
            var curr_min = d1.getMinutes();
            if (curr_min < 10)
                curr_min = "0" + curr_min;
                
                
                
    
            var curr_sec = d1.getSeconds();     
            if (curr_sec < 10)
                curr_sec = "0" + curr_sec;
    
            //var newtimestamp = curr_date + "/" + curr_month + "/" + curr_year + " " + curr_hour.slice(-2) + ":" + curr_min +" "+currsit;
            var newtimestamp = curr_date + "-" + curr_month + "-" + curr_year + " " + curr_hour.slice(-2) + ":" + curr_min +" "+currsit;
            return newtimestamp;
            */
}



function SortArrayByName(a, b) {
    if (a.name < b.name)
        return -1;
    else if (a.name > b.name)
        return 1;
    else
        return 0;
}

function ShowLoader() {
    $(".Loader").show();
}
function HideLoader() {
    $(".Loader").hide();
}

function GetQueryStringParams(key) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == key) {
            return sParameterName[1];
        }
    }

    return '';
}
function formatCRDate(UnformatedDate) {
    //var date = moment(UnformatedDate);
    //return date.format('DD-MM-YYYY');


    var date = UnformatedDate;
    var formatteddate = UnformatedDate.split('-')[2] + "-" + UnformatedDate.split('-')[1] + "-" + UnformatedDate.split('-')[0];
    return formatteddate;

}

function formatRestDate(UnformatedDate) {

    var date = UnformatedDate.split('T')[0];
    var formatteddate = date.split('-')[2] + "-" + date.split('-')[1] + "-" + date.split('-')[0];
    return formatteddate;
}


function ShowErrorValidations(textmsg, msgtype, headingtext) {

    if (textmsg.indexOf('<br/>') != -1) {
        var allmessages = textmsg.split('<br/>');
        if (allmessages.length > 0) {
            if (allmessages.length > 7) {
                for (var i = 0; i < 7; i++) {
                    if (allmessages[i].trim() != '') {
                        ShowErrorToast(allmessages[i], msgtype, headingtext);
                    }
                }

            }
            else {
                for (var i = 0; i < allmessages.length; i++) {
                    if (allmessages[i].trim() != '') {
                        ShowErrorToast(allmessages[i], msgtype, headingtext);
                    }
                }
            }
        }
        else {
            ShowErrorToast(textmsg, msgtype, headingtext);
        }
    }
    else {
        ShowErrorToast(textmsg, msgtype, headingtext);
    }
}

function ShowErrorToast(textmsg, msgtype, headingtext) {
    $.toast({
        heading: '<b>' + headingtext + '<b>',
        text: textmsg,
        icon: msgtype,
        stack: 7,
        position: 'bottom-right',
        bgColor: '#ef3834',
        textColor: '#FFFFFF',
        loader: false,
        hideAfter: 3000,
    });




}


function ensureLoggedUser(webUrl, loginName) {
    var payload = { 'logonName': loginName };
    return $.ajax({
        url: webUrl + "/_api/web/ensureuser",
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(payload),
        headers: {
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "accept": "application/json;odata=verbose"
        }
    });
}


function ensureLoggedUserSync(webUrl, loginName) {
    var payload = { 'logonName': loginName };
    return $.ajax({
        url: webUrl + "/_api/web/ensureuser",
        type: "POST",
        async: false,
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(payload),
        headers: {
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "accept": "application/json;odata=verbose"
        }
    });
}


function CapexNumberTemp(OU, CapexId) {
    var CapexId = CapexId;
    var NewCapexId = "00000" + CapexId;
    var OUText = OU.split('_')[0];
    var CapexGenerated = OUText + '_' + NewCapexId.slice(-5);
    return CapexGenerated;

}

function NumericValidations(classname) {
    $("." + classname).on('keyup', function () {
        var regex = /^[0-9]*$/;
        if (!regex.test($(this).val())) {
            $(this).val('')
            var msg = 'Only numeric value is allowed in ' + $(this).attr('name') + ' field';
            ShowErrorValidations(msg, 'error', 'Validation Failed');
        }
    });
}

function NumericLimitValidations(classname, limit) {
    $(".SetLimit").on('keyup', function () {
        if (!(parseInt($(this).val()) <= limit)) {
            $(this).val('')
            var msg = 'Enter Less Than or Equal to 1000 in ' + $(this).attr('name') + ' field';
            ShowErrorValidations(msg, 'error', 'Validation Failed');
        }
    });
}

function SetMaxLength() {
    $("input[type=text]").attr('maxlength', '240');
}


function GetSmallThumbnailURL(ImageURL) {
    var imagenamewithExtension = ImageURL.substr(ImageURL.lastIndexOf('/') + 1);
    var imageURLwithoutImagename = ImageURL.substr(0, ImageURL.lastIndexOf('/'));
    var imagenamewithoutExtn = imagenamewithExtension.substr(0, imagenamewithExtension.lastIndexOf('.'));
    var imageExtn = ImageURL.substr(ImageURL.lastIndexOf('.') + 1);
    var smallThumbimagename = imageURLwithoutImagename + '/_t/' + imagenamewithoutExtn + '_' + imageExtn + '.jpg';
    return smallThumbimagename;
}

function GetLargeThumbnailURL(ImageURL) {
    var imagenamewithExtension = ImageURL.substr(ImageURL.lastIndexOf('/') + 1);
    var imageURLwithoutImagename = ImageURL.substr(0, ImageURL.lastIndexOf('/'));
    var imagenamewithoutExtn = imagenamewithExtension.substr(0, imagenamewithExtension.lastIndexOf('.'));
    var imageExtn = ImageURL.substr(ImageURL.lastIndexOf('.') + 1);
    var LargeThumbimagename = imageURLwithoutImagename + '/_w/' + imagenamewithoutExtn + '_' + imageExtn + '.jpg';
    return LargeThumbimagename;
}

function sendEmailUsingRest(from, to, body, subject, Success, Failure) {
    //Get the relative url of the site
    var to1 = [to];
    if (to.indexOf(',') != -1) {
        to1 = to.split(',');
    }
    var siteurl = _spPageContextInfo.webServerRelativeUrl;
    var urlTemplate = siteurl + "/_api/SP.Utilities.Utility.SendEmail";
    $.ajax({
        contentType: 'application/json',
        url: urlTemplate,
        type: "POST",
        data: JSON.stringify({
            'properties': {
                '__metadata': {
                    'type': 'SP.Utilities.EmailProperties'
                },
                'From': from,
                'To': {
                    'results': to1 //[to]
                },
                'Body': body,
                'Subject': subject
            }
        }),
        headers: {
            "Accept": "application/json;odata=verbose",
            "content-type": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        },
        success: function (data) {
            Success(data);

        },
        error: function (err) {
            Failure(err);

        }
    });
}

function InitializeDatePicker(DatePickerId) {
    $("#" + DatePickerId).fdatepicker();
}


function RequestTablewithsearch(tableId) {

    $('#' + tableId + ' thead tr').clone(true).appendTo('#' + tableId + ' thead');
    $('#' + tableId).css("width", "100%");

    $('#' + tableId + ' thead tr:eq(1) th').each(function (i) {
        var title = $(this).text();
        //var thclass=$(this).attr('class');
        if (title.trim() != '') {
            $(this).html('<input type="text" placeholder="Filter ' + title + '" style="width:100%"/>');
            $('input', this).on('keyup change', function () {
                if (table.column(i).search() !== this.value) {
                    table
                        .column(i)
                        .search(this.value)
                        .draw();
                }
            });
        }

    });

    var table = $("#" + tableId).DataTable({

        initComplete: function () {




        },
        "aaSorting": [],
        columnDefs: [{ orderable: false, targets: [0] }],
        fixedHeader: true,
        orderCellsTop: true,
        dom: 'Bfrtip',
        "lengthMenu": [10, 20, 30, 40],
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Export to Excel',
                //title: 'All Request',
                className: 'btn btn-primary',
            },]

    });



    $('.dataTables_filter').hide();
}

/*
function RequestTablewithsearch(tableId)
{
    
var table =$("#"+tableId).DataTable({
	
   initComplete: function() { 	
   
    $('#' + tableId+  ' thead tr').clone(true).appendTo( '#' + tableId+  ' thead' );
         $('#' + tableId).css("width","100%");
    	
        $('#' + tableId+  ' thead tr:eq(1) th').each( function (i) {
        var title = $(this).text();
        //var thclass=$(this).attr('class');
        if(title.trim()!='')
        {
        $(this).html( '<input type="text" placeholder="Filter '+title+'" style="width:100%"/>' );
        $( 'input', this ).on( 'keyup change', function () {
        if ( table.column(i).search() !== this.value ) {
        table
           .column(i)
           .search( this.value )
           .draw();
        }
        });
        }
    	
        });
    	
	
     } ,
     "aaSorting": [],
        columnDefs: [ { orderable: false, targets: [0]}],
        fixedHeader: true,
         dom: 'Bfrtip',
         "lengthMenu": [5, 10, 15,20],
      buttons: [
                    {
              extend: 'excelHtml5',
              text:'Export to Excel',
              //title: 'All Request',
             //className:'red'
          },          ]
	
    });
	
    $('.dataTables_filter').hide();
}
*/

function RequestTablewithsearchwithPageSize(tableId, pagsize) {

    $('#' + tableId + ' thead tr').clone(true).appendTo('#' + tableId + ' thead');
    $('#' + tableId).css("width", "100%");

    $('#' + tableId + ' thead tr:eq(1) th').each(function (i) {
        var title = $(this).text();
        //var thclass=$(this).attr('class');
        if (title.trim() != '') {
            $(this).html('<input type="text" placeholder="Filter ' + title + '" style="width:100%"/>');
            $('input', this).on('keyup change', function () {
                if (table.column(i).search() !== this.value) {
                    table
                        .column(i)
                        .search(this.value)
                        .draw();
                }
            });
        }

    });

    var table = $("#" + tableId).DataTable({


        initComplete: function () {



        },
        "aaSorting": [],
        columnDefs: [{ orderable: false, targets: [0] }],
        fixedHeader: true,
        orderCellsTop: true,
        dom: 'Bfrtip',
        "lengthMenu": [pagsize, pagsize * 2, pagsize * 3, pagsize * 4],
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Export to Excel',
                //title: 'All Request',
                className: 'btn btn-primary',
            },]

    });
}



function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}

function initializeOwlCarousel(elementId) {
    var carousel = $(elementId);
    carousel.owlCarousel({
        margin: 10,
        nav: false,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 3
            },
            1000: {
                items: 5
            }
        }
    })
}

function updateOwlCarousel(elementId) {
    $(elementId).trigger('destroy.owl.carousel');
    $(elementId).html($(elementId).html()).removeClass('owl-loaded');

    initializeOwlCarousel(elementId);
}

// Go back button

window.goBack = function (e) {
    var defaultLocation = "http://www.mysite.com";
    var oldHash = window.location.hash;

    history.back(); // Try to go back

    var newHash = window.location.hash;

    /* If the previous page hasn't been loaded in a given time (in this case
    * 1000ms) the user is redirected to the default location given above.
    * This enables you to redirect the user to another page.
    *
    * However, you should check whether there was a referrer to the current
    * site. This is a good indicator for a previous entry in the history
    * session.
    *
    * Also you should check whether the old location differs only in the hash,
    * e.g. /index.html#top --> /index.html# shouldn't redirect to the default
    * location.
    */

    if (
        newHash === oldHash &&
        (typeof (document.referrer) !== "string" || document.referrer === "")
    ) {
        window.setTimeout(function () {
            // redirect to default location
            window.location.href = defaultLocation;
        }, 1000); // set timeout in ms
    }
    if (e) {
        if (e.preventDefault)
            e.preventDefault();
        if (e.preventPropagation)
            e.preventPropagation();
    }
    return false; // stop event propagation and browser default event
}

async function getAccessToken() {
    const storedToken = JSON.parse(localStorage.getItem("access_token"));
    const currentTime = new Date().getTime() / 1000; // Current time in seconds
 
    // If there's a stored token and it's still valid, return it
    if (storedToken && storedToken.expires_at > currentTime) {
        return storedToken.token;
    }
    else{
        localStorage.removeItem("access_token");
    }
 
    var isBectors = (window.location.href || "").toLowerCase().indexOf("bectors.sharepoint.com") !== -1 || (window.location.href || "").toLowerCase().indexOf("ptms_uat") !== -1 || (window.location.href || "").toLowerCase().indexOf("ptms_prd") !== -1;

    const flowUrl = isBectors
        ? "https://prod-24.centralindia.logic.azure.com:443/workflows/7b6770178a5b424baddc640faef80342/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-vK5eFyMUINt3lp8qvpPzPSN0SwXDf9efw5a4T_SzEI"
        : "https://86c49df27027e13c808b32506fa981.d1.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/11/workflows/182bf483e5b84314aba7baf2612543fc/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oE7DjCwm3S0c-8PZlVFIYGCIL61LybVqodXyqq9U0HY";
 
    try {
        const response = await fetch(flowUrl, {
            method: "POST", // Ensure this matches the method expected by your flow
            headers: {
                "Content-Type": "application/json", // Required by the flow
            },
            body: JSON.stringify({}) // Send an empty JSON object if required
        });
 
        if (!response.ok) {
            throw new Error(`Failed to fetch token from Power Automate: ${response.statusText}`);
        }
 
        const data = await response.json(); // Assuming the flow returns a JSON object with the token and expiry
        const expiresAt = currentTime + data.expires_in;
 
        // Store the token and expiration in localStorage
        localStorage.setItem(
            "access_token",
            JSON.stringify({
                token: data.access_token,
                expires_at: expiresAt
            })
        );
 
        return data.access_token;
        console.log(data.access_token);
    } catch (error) {
        console.error("Error fetching token from Power Automate:", error);
        return null;
    }
}

$(document).ready(function () {
  $('#tourSelect').select2({
    dropdownParent: $('#shiftPopup')
  });

  $('#shiftSelect').select2({
    dropdownParent: $('#shiftPopup')
  });
});

function hideSection( sectioId ) {
  const element = document.getElementById( sectioId );
  if ( element && !element.classList?.contains( 'd-none' ) ) {
    element.classList.add( 'd-none' );
  }
}


function showhiddenSection( sectioId ) {
  if ( document.getElementById( sectioId )?.classList?.contains( 'd-none' ) ) {
    document.getElementById( sectioId )?.classList.remove( 'd-none' );
  }
}