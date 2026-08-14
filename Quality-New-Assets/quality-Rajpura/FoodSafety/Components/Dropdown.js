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
