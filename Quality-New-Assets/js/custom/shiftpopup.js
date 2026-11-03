
// Open popup on page load
window.addEventListener("load", function () {
  const shiftPopup = document.querySelector(".shift-popup") || document.querySelector("#shiftPopup");

  // NEVER auto-open plant tour popup on Home / Welcome / Dashboard pages
  const isHomeOrDashboard = 
    (typeof window !== 'undefined' && window.location && (
      window.location.pathname.toLowerCase().includes("home.aspx") ||
      window.location.pathname.toLowerCase().includes("welcome")
    )) ||
    document.getElementById("DepartmentTourBtn") !== null ||
    document.getElementById("rajpuraQualityDashboard") !== null ||
    document.getElementById("tblTourScores") !== null ||
    document.getElementById("ShowObservation") !== null;

  if (isHomeOrDashboard) {
    if (shiftPopup) shiftPopup.classList.remove("is-popup-active");
    return;
  }

  const shiftPopupOpener = document.querySelectorAll(".shift-popup-opener");
  let storedValue = sessionStorage.getItem("shiftValue");
  const isQuality = (typeof isQualityDepartment === 'function')
    ? isQualityDepartment()
    : (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.QUALITY_DEPT_IDS)
      ? QualityRajpura_Config.QUALITY_DEPT_IDS.includes(String(typeof userDepratmentId !== 'undefined' ? userDepratmentId : ''))
      : ['39', '80', '81', '135', '18'].includes(String(typeof userDepratmentId !== 'undefined' ? userDepratmentId : ''));

  if (!isQuality && (typeof userDepratmentId === 'undefined' || userDepratmentId != 39)) {
    if (shiftPopup) shiftPopup.classList.remove("is-popup-active");
  } else {
    const badge = document.getElementById("shiftBadge");
    if (badge && storedValue) badge.innerText = storedValue;
    // Only auto-open if #shiftBadge exists (checklist page requiring shift) and storedValue is empty
    if (badge && !storedValue && shiftPopup) {
      shiftPopup.classList.add("is-popup-active");
    } else if (shiftPopup) {
      shiftPopup.classList.remove("is-popup-active");
    }
  }
});

//chnage shift
const shiftChange = () => {
  const shift = document.querySelector("#shiftSelect").value;
  sessionStorage.setItem("shiftValue", shift);
  document.getElementById("shiftBadge").innerText = shift;
  shiftpopupcloser()
}

//cancel button click shift popup
const popupCancelBtns = document.querySelectorAll(".cancel-button-click");
popupCancelBtns.forEach(function (closer) {
  closer.addEventListener("click", function (e) {
    e.preventDefault();

    const popupItem = closer.closest(".main-popup");
    if (!popupItem) return;

    popupItem.classList.remove("is-popup-active");
  });
});

function shiftpopupopener(){
    const shiftPopup = document.querySelector("#shiftPopup");
    if (shiftPopup){shiftPopup.classList.add("is-popup-active");}
}
function shiftpopupcloser(){
    const shiftPopup = document.querySelector("#shiftPopup");
    if (shiftPopup){shiftPopup.classList.remove("is-popup-active");}
}