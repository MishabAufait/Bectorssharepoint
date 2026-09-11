// Shared Dropdown Component helper
console.log("Dropdown Component helper loaded");

const DropdownComponent = {
    // Initialize standard select element with Select2
    init: function (elementId, options = {}) {
        const el = $(`#${elementId}`);
        if (!el.length || !window.jQuery || !$.fn.select2) return;

        // Prevent double init
        if (el.hasClass("select2-hidden-accessible")) {
            el.select2("destroy");
        }

        const defaultOpts = {
            minimumResultsForSearch: -1,
            dropdownAutoWidth: true,
            width: "100%",
            dropdownParent: $(document.body)
        };

        el.select2($.extend(defaultOpts, options));
    },

    // Populate option tags dynamically and select default
    populate: function (elementId, arrayOptions, defaultValue) {
        const select = document.getElementById(elementId);
        if (!select) return;

        select.innerHTML = "";
        arrayOptions.forEach(opt => {
            const option = document.createElement("option");
            if (typeof opt === "string") {
                option.value = opt;
                option.text = opt;
            } else {
                option.value = opt.value;
                option.text = opt.text;
            }
            select.appendChild(option);
        });

        if (defaultValue) {
            select.value = defaultValue;
        }

        // Trigger change to update Select2 UI
        if ($(select).hasClass("select2-hidden-accessible")) {
            $(select).trigger("change");
        }
    }
};

// Global Food Safety Form Validator & Notification Helper
const FoodSafety_Validator = {
    highlight: function (element, isInvalid) {
        if (!element) return;
        const $el = $(element);
        if (isInvalid) {
            $el.addClass("fs-input-error");
            if ($el.hasClass("select2-hidden-accessible")) {
                $el.next(".select2-container").addClass("fs-input-error");
            }
        } else {
            $el.removeClass("fs-input-error");
            if ($el.hasClass("select2-hidden-accessible")) {
                $el.next(".select2-container").removeClass("fs-input-error");
            }
        }
    },
    showBanner: function (bannerId, message) {
        const banner = document.getElementById(bannerId);
        if (banner) {
            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; text-align: left;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>${message}</span>
                </div>
            `;
            banner.classList.add("is-visible");
            banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    },
    hideBanner: function (bannerId) {
        const banner = document.getElementById(bannerId);
        if (banner) {
            banner.classList.remove("is-visible");
            banner.innerHTML = "";
        }
    },
    clearAll: function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const inputs = container.querySelectorAll("input, select, textarea");
        inputs.forEach(el => this.highlight(el, false));
    }
};
