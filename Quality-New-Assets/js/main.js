//Tour ID
QualityTourId = GetQueryStringParams('TourId');
//cycle id extractor
function incrementCycleId(cycleId) {
  let match = cycleId.match(/(\D+)(\d+)/);
  if (match) {
    let prefix = match[1];
    let number = parseInt(match[2], 10) + 1;
    return prefix + number;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", async function () {
  initializeApplication();
});

const shiftPopup = document.querySelector("#shiftPopup");
if (shiftPopup) {
  const isHomeOrDashboard = 
    (typeof window !== 'undefined' && window.location && (
      window.location.pathname.toLowerCase().includes("home.aspx") ||
      window.location.pathname.toLowerCase().includes("welcome")
    )) ||
    document.getElementById("DepartmentTourBtn") !== null ||
    document.getElementById("rajpuraQualityDashboard") !== null;

  if (!isHomeOrDashboard) {
    const storedShift = sessionStorage.getItem("shiftValue");
    if (!storedShift) {
      shiftPopup.classList.add("is-popup-active");
    }
  }
}

// Function to update the product name in the UI
function updateProductNamecbb(cycleNum) {
  const storedProduct = sessionStorage.getItem("product");
  const storedBatchNo = sessionStorage.getItem("BatchNo");
  const storedLineNo = sessionStorage.getItem("LineNo");
  const storedExpiry = sessionStorage.getItem("Expiry");
  const storedPackaged = sessionStorage.getItem("Packaged");
  document.getElementById(`product-${cycleNum}`).innerText = storedProduct;
  document.getElementById(`batchNo-${cycleNum}`).innerText = storedBatchNo;
  document.getElementById(`lineNo-${cycleNum}`).innerText = storedLineNo;
  document.getElementById(`Expiry-${cycleNum}`).innerText = storedExpiry;
  document.getElementById(`Packaged-${cycleNum}`).innerText = storedPackaged;
}
// Function to update the product name in the UI secondary tab
function updateProductNamesecondary(cycleNum) {
  const storedProduct = sessionStorage.getItem("product");
  const storedBatchNo = sessionStorage.getItem("BatchNo");
  const storedLineNo = sessionStorage.getItem("LineNo");
  const storedExpiry = sessionStorage.getItem("Expiry");
  const storedPackaged = sessionStorage.getItem("Packaged");
  document.getElementById(`secondary-product-${cycleNum}`).innerText = storedProduct;
  document.getElementById(`secondary-batchNo-${cycleNum}`).innerText = storedBatchNo;
  document.getElementById(`secondary-lineNo-${cycleNum}`).innerText = storedLineNo;
  document.getElementById(`secondary-Expiry-${cycleNum}`).innerText = storedExpiry;
  document.getElementById(`secondary-Packaged-${cycleNum}`).innerText = storedPackaged;
}
// Function to update the product name in the UI primary tab
function updateProductNameprimary(cycleNum) {
  const storedProduct = sessionStorage.getItem("product");
  const storedBatchNo = sessionStorage.getItem("BatchNo");
  const storedLineNo = sessionStorage.getItem("LineNo");
  const storedExpiry = sessionStorage.getItem("Expiry");
  const storedPackaged = sessionStorage.getItem("Packaged");
  document.getElementById(`primary-product-${cycleNum}`).innerText = storedProduct;
  document.getElementById(`primary-batchNo-${cycleNum}`).innerText = storedBatchNo;
  document.getElementById(`primary-lineNo-${cycleNum}`).innerText = storedLineNo;
  document.getElementById(`primary-Expiry-${cycleNum}`).innerText = storedExpiry;
  document.getElementById(`primary-Packaged-${cycleNum}`).innerText = storedPackaged;
}
// Function to update the product name in the UI product tab
function updateProductNameproduct(cycleNum) {
  const storedProduct = sessionStorage.getItem("product");
  const storedBatchNo = sessionStorage.getItem("BatchNo");
  const storedLineNo = sessionStorage.getItem("LineNo");
  const storedExpiry = sessionStorage.getItem("Expiry");
  const storedPackaged = sessionStorage.getItem("Packaged");
  document.getElementById(`product-product-${cycleNum}`).innerText = storedProduct;
  document.getElementById(`product-batchNo-${cycleNum}`).innerText = storedBatchNo;
  document.getElementById(`product-lineNo-${cycleNum}`).innerText = storedLineNo;
  document.getElementById(`product-Expiry-${cycleNum}`).innerText = storedExpiry;
  document.getElementById(`product-Packaged-${cycleNum}`).innerText = storedPackaged;
}
//function is used to extract number from string
function extractNumber(text) {
  // Find first number in string
  let match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
//function is used to open tour cycle edit popup
function openCycleEditPopup(cycleNum) {
  const tourCycleStartPopup = document.querySelector("#tourCycleStartPopup");
  tourCycleStartPopup.classList.add("is-popup-active");
  document.querySelector('.popup-header-title').innerText = `Cycle-${cycleNum}`;
  const storedProduct = sessionStorage.getItem("product");
  const storedBatchNo = sessionStorage.getItem("BatchNo");
  const storedLineNo = sessionStorage.getItem("LineNo");
  const storedExpiry = sessionStorage.getItem("Expiry");
  const storedPackaged = sessionStorage.getItem("Packaged");
  document.getElementById(`startPopupProductSelect`).value = storedProduct ? storedProduct : '';
  document.getElementById(`startPopupbatch-no`).value = storedBatchNo ? storedBatchNo : '';
  document.getElementById(`startPopupline-no`).value = storedLineNo ? storedLineNo : '';
  document.getElementById(`startPopupExpiryDatepicker`).value = storedExpiry ? storedExpiry : '';
  document.getElementById(`startPopupPackagedDatepicker`).value = storedPackaged ? storedPackaged : '';
}

//function used to save new changes in tour cycle
function cyclepopupsavebtnclick() {
  let header = document.querySelector('.popup-header-title');
  let text = document.querySelector('.popup-header-title').textContent;
  let cycleNum = extractNumber(text);
  const product = document.getElementById(`startPopupProductSelect`).value;
  const BatchNo = document.getElementById(`startPopupbatch-no`).value;
  const LineNo = document.getElementById(`startPopupline-no`).value;
  const Expiry = document.getElementById(`startPopupExpiryDatepicker`).value;
  const Packaged = document.getElementById(`startPopupPackagedDatepicker`).value;
  sessionStorage.setItem('product', product)
  sessionStorage.setItem('BatchNo', BatchNo)
  sessionStorage.setItem('LineNo', LineNo)
  sessionStorage.setItem('Expiry', Expiry)
  sessionStorage.setItem('Packaged', Packaged)
  updateProductName(cycleNum)
  const tourCycleStartPopup = document.querySelector("#tourCycleStartPopup");
  tourCycleStartPopup.classList.remove("is-popup-active");
}
document.addEventListener("DOMContentLoaded", function () {
  const secondaryTab = document.querySelector('.bs-nav-link[data-tab="main-tab-secondary"]');
  const primaryTab = document.querySelector('.bs-nav-link[data-tab="main-tab-primary"]');
  const productTab = document.querySelector('.bs-nav-link[data-tab="main-tab-product"]');

  if (secondaryTab) {
    secondaryTab.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor behavior

      const defaultPanelOpensecondary = document.querySelectorAll('.tour-cycle-panel-secondary.secondary-bs-card-toggler-is-active');

      if (defaultPanelOpensecondary) {
        const defaultPanelBody = document.querySelector('.bs-card-body-secondary-1');
        defaultPanelBody.style.maxHeight = "100%";
      }
    });
  }
  if (primaryTab) {
    primaryTab.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor behavior

      const defaultPanelOpenPrimary = document.querySelectorAll('.tour-cycle-panel-primary.primary-bs-card-toggler-is-active');

      if (defaultPanelOpenPrimary) {
        const defaultPanelBody = document.querySelector('.bs-card-body-primary-1');
        defaultPanelBody.style.maxHeight = "100%";
      }
    });
  }
  if (productTab) {
    productTab.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor behavior

      const defaultPanelOpenproduct = document.querySelectorAll('.tour-cycle-panel-product.product-bs-card-toggler-is-active');

      if (defaultPanelOpenproduct) {
        const defaultPanelBody = document.querySelector('.bs-card-body-product-1');
        defaultPanelBody.style.maxHeight = "100%";
      }
    });
  }
});


document.addEventListener('click', (event) => {
  if (event.target.classList.contains('cycle-estimation-action-elem')) {
    const btn = event.target;
    const currentParent = btn.closest('.tour-cycle-estimation-item');

    // Remove 'badge-fill' class from all buttons inside this card
    currentParent.querySelectorAll('.cycle-estimation-action-elem').forEach((b) => {
      b.classList.remove('badge-fill');
    });

    // Add 'badge-fill' to the clicked button
    btn.classList.add('badge-fill');

    const currenPanelBody = currentParent.querySelector('.bs-card-body');
    const currenParentPanel = currentParent.closest('.tour-cycle-panel');
    const currenParentPanelBody = currenParentPanel?.querySelector('.bs-card-body');

    currentParent.classList.toggle('bs-card-toggler-is-active');

    if (btn.classList.contains('badge-error')) {
      if (currenPanelBody.style.maxHeight) {
        currenPanelBody.style.maxHeight = null;
      } else {
        currenPanelBody.style.maxHeight = '100%';
        if (currenParentPanelBody) {
          currenParentPanelBody.style.maxHeight =
            currenParentPanelBody.offsetHeight + currenPanelBody.scrollHeight + 'px';
        }
      }
    }

    if (btn.classList.contains('badge-success')) {
      currenPanelBody.style.maxHeight = null;
      if (currenParentPanelBody) {
        currenParentPanelBody.style.maxHeight =
          currenParentPanelBody.offsetHeight + currenPanelBody.scrollHeight + 'px';
      }
    }
  }
});

function initializeApplication() {
    document.querySelector('.tour-date').textContent = moment().format('DD/MM/YYYY');
}

