// Checklist renderer and validator for Mrs Bector's Packaging Operations (Rajpura)
console.log("Packaging Operations Checklist loaded");

const PKGOPS_PAPA_DEFECTS_FLAT = [
    // A Defects - Product
    { category: "A", type: "Product", name: "Foreign matter" },
    { category: "A", type: "Product", name: "Burnt taste" },
    { category: "A", type: "Product", name: "Rancid cookie" },
    { category: "A", type: "Product", name: "Off Odour/flavour" },
    { category: "A", type: "Product", name: "Soggy/Moist cookie" },
    { category: "A", type: "Product", name: "Stale taste" },
    { category: "A", type: "Product", name: "Sugary/Grainy feel in cream" },
    { category: "A", type: "Product", name: "Unpleasant After taste" },
    { category: "A", type: "Product", name: "Crushed Biscuits" },
    { category: "A", type: "Product", name: "Carbon Particles at bottom" },
    { category: "A", type: "Product", name: "Flaking" },
    { category: "A", type: "Product", name: "Others" },

    // A Defects - Pack
    { category: "A", type: "Pack", name: "Foreign matter" },
    { category: "A", type: "Pack", name: "Illegible code" },
    { category: "A", type: "Pack", name: "No Code" },
    { category: "A", type: "Pack", name: "Wrong Code" },
    { category: "A", type: "Pack", name: "Underweight Below MPE" },
    { category: "A", type: "Pack", name: "Cross packing/labelling" },
    { category: "A", type: "Pack", name: "Wrong MRP" },
    { category: "A", type: "Pack", name: "Art work & label error" },
    { category: "A", type: "Pack", name: "Torn/Tear Pack" },
    { category: "A", type: "Pack", name: "Pack Delamination" },
    { category: "A", type: "Pack", name: "Disc Out" },
    { category: "A", type: "Pack", name: "Flap Open" },
    { category: "A", type: "Pack", name: "Empty Pack" },
    { category: "A", type: "Pack", name: "Cut pack/Pin hole" },
    { category: "A", type: "Pack", name: "Wrinkles in sealing (>2mm)" },
    { category: "A", type: "Pack", name: "Damaged tin" },
    { category: "A", type: "Pack", name: "Wrong lid" },
    { category: "A", type: "Pack", name: "Wrong colour or artwork" },
    { category: "A", type: "Pack", name: "Others" },

    // B Defects - Product
    { category: "B", type: "Product", name: "Blister" },
    { category: "B", type: "Product", name: "Dust on Biscuit" },
    { category: "B", type: "Product", name: "Broken" },
    { category: "B", type: "Product", name: "DE shaped" },
    { category: "B", type: "Product", name: "Mould Embossing absent" },
    { category: "B", type: "Product", name: "Edge Dark" },
    { category: "B", type: "Product", name: "Oozing" },
    { category: "B", type: "Product", name: "Less Nuts" },
    { category: "B", type: "Product", name: "Hard bite" },
    { category: "B", type: "Product", name: "Bottom scrap/tailing" },
    { category: "B", type: "Product", name: "Joint biscuits" },
    { category: "B", type: "Product", name: "Less seasoning" },
    { category: "B", type: "Product", name: "Slight unbaked" },
    { category: "B", type: "Product", name: "Assortment not proper" },
    { category: "B", type: "Product", name: "Less sugar/excess sugar" },
    { category: "B", type: "Product", name: "Others" },

    // B Defects - Pack
    { category: "B", type: "Pack", name: "Carton Skewing" },
    { category: "B", type: "Pack", name: "Damaged CBB" },
    { category: "B", type: "Pack", name: "Burnt seal" },
    { category: "B", type: "Pack", name: "Loose pack" },
    { category: "B", type: "Pack", name: "coding out" },
    { category: "B", type: "Pack", name: "Code smudged" },
    { category: "B", type: "Pack", name: "CBB tape in open" },
    { category: "B", type: "Pack", name: "Improper taping of CBB" },
    { category: "B", type: "Pack", name: "Poor Gazetting" },
    { category: "B", type: "Pack", name: "Torn poly" },
    { category: "B", type: "Pack", name: "Polybag - unsealed" },
    { category: "B", type: "Pack", name: "Seal leakage/Cut On Seal" },
    { category: "B", type: "Pack", name: "Silver line on sealing" },
    { category: "B", type: "Pack", name: "Illegible code on CBB" },
    { category: "B", type: "Pack", name: "improper sealing on cup" },
    { category: "B", type: "Pack", name: "Damge duplex/open duplex" },
    { category: "B", type: "Pack", name: "Cross Pasting" },
    { category: "B", type: "Pack", name: "Glue excess/less" },
    { category: "B", type: "Pack", name: "Underweight above MPE" },
    { category: "B", type: "Pack", name: "Flap open <10 mm" },
    { category: "B", type: "Pack", name: "Less bulge" },
    { category: "B", type: "Pack", name: "Weak seal" },
    { category: "B", type: "Pack", name: "Tight Lid" },
    { category: "B", type: "Pack", name: "Code smudge on TIN" },
    { category: "B", type: "Pack", name: "Dent on tin/ Disc out" },
    { category: "B", type: "Pack", name: "Others" },

    // C Defects - Product
    { category: "C", type: "Product", name: "Tailing" },
    { category: "C", type: "Product", name: "Oozing Out" },
    { category: "C", type: "Product", name: "Chipping" },
    { category: "C", type: "Product", name: "Chocking" },
    { category: "C", type: "Product", name: "Docker pin not visible" },
    { category: "C", type: "Product", name: "Bottom chippings" },
    { category: "C", type: "Product", name: "Wegging" },
    { category: "C", type: "Product", name: "Others" },

    // C Defects - Pack
    { category: "C", type: "Pack", name: "ROGH TAPING ON TIN" },
    { category: "C", type: "Pack", name: "Wrinkles on primary pack" },
    { category: "C", type: "Pack", name: "Slant pack" },
    { category: "C", type: "Pack", name: "Overweight >5% of declared weight" },
    { category: "C", type: "Pack", name: "Others" }
];

const PKGOPS_DEFECT_DETAILS_BY_CATEGORY = {
    "Category A": [
        "Foreign matter",
        "Burnt taste",
        "Rancid cookie",
        "Off Odour/flavour",
        "Soggy/Moist cookie",
        "Stale taste",
        "Sugary/Grainy feel in cream",
        "Unpleasant After taste",
        "Crushed Biscuits",
        "Carbon Particles at bottom",
        "Flaking",
        "Illegible code",
        "No Code",
        "Wrong Code",
        "Underweight Below MPE",
        "Cross packing/labelling",
        "Wrong MRP",
        "Art work & label error",
        "Torn/Tear Pack",
        "Pack Delamination",
        "Disc Out",
        "Flap Open",
        "Empty Pack",
        "Cut pack/Pin hole",
        "Wrinkles in sealing (>2mm)",
        "Damaged tin",
        "Wrong lid",
        "Wrong colour or artwork",
        "Others"
    ],
    "Category B": [
        "Blister",
        "Dust on Biscuit",
        "Broken",
        "DE shaped",
        "Mould Embossing absent",
        "Edge Dark",
        "Oozing",
        "Less Nuts",
        "Hard bite",
        "Bottom scrap/tailing",
        "Joint biscuits",
        "Less seasoning",
        "Slight unbaked",
        "Assortment not proper",
        "Less sugar/excess sugar",
        "Carton Skewing",
        "Damaged CBB",
        "Burnt seal",
        "Loose pack",
        "Coding out",
        "Code smudged",
        "CBB tape in open",
        "Improper taping of CBB",
        "Poor Gazetting",
        "Torn poly",
        "Polybag - unsealed",
        "Seal leakage/Cut On Seal",
        "Silver line on sealing",
        "Illegible code on CBB",
        "Improper sealing on cup",
        "Damge duplex/open duplex",
        "Cross Pasting",
        "Glue excess/less",
        "Underweight above MPE",
        "Flap open <10 mm",
        "Weak seal",
        "Tight Lid",
        "Code smudge on TIN",
        "Dent on tin/Disc out",
        "Less bulge",
        "Others"
    ],
    "Category C": [
        "Tailing",
        "Oozing Out",
        "Chipping",
        "Chocking",
        "Docker pin not visible",
        "Bottom chippings",
        "Wegging",
        "ROGH TAPING ON TIN",
        "Wrinkles on primary pack",
        "Slant pack",
        "Overweight >5% of declared weight",
        "Code smudge on TIN",
        "Dent on tin/Disc out",
        "Less bulge",
        "Others"
    ]
};
PKGOPS_DEFECT_DETAILS_BY_CATEGORY["A"] = PKGOPS_DEFECT_DETAILS_BY_CATEGORY["Category A"];
PKGOPS_DEFECT_DETAILS_BY_CATEGORY["B"] = PKGOPS_DEFECT_DETAILS_BY_CATEGORY["Category B"];
PKGOPS_DEFECT_DETAILS_BY_CATEGORY["C"] = PKGOPS_DEFECT_DETAILS_BY_CATEGORY["Category C"];

const PKGOPS_Validator = {
    highlight: function (element, isInvalid) {
        if (!element) return;
        if (isInvalid) {
            element.style.borderColor = "#ef4444";
            element.style.boxShadow = "0 0 0 0.2rem rgba(239, 68, 68, 0.25)";
        } else {
            element.style.borderColor = "";
            element.style.boxShadow = "";
        }
    },
    clearAll: function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const inputs = container.querySelectorAll("input, select, textarea");
        inputs.forEach(el => this.highlight(el, false));
    }
};

const PKGOPS_Checklist = {
    currentTourId: null,
    pkgopsType: null,
    activeSubChecklistKey: null,
    uploadedFiles: {}, // Maps key (e.g. "cv-0", "pqi-0") to Array of File objects: [File1, File2, ...]

    escapeHtml: function (str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    onFileSelected: async function (input, key) {
        if (!input.files || input.files.length === 0) return;

        if (!this.uploadedFiles[key]) {
            this.uploadedFiles[key] = [];
        }

        const selectedFiles = Array.from(input.files);
        let invalidCount = 0;

        for (const file of selectedFiles) {
            const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(file.name);
            if (!isImage) {
                invalidCount++;
                continue;
            }
            const exists = this.uploadedFiles[key].some(f => f.name === file.name && f.size === file.size);
            if (!exists) {
                this.uploadedFiles[key].push(file);
            }
        }

        if (invalidCount > 0) {
            alert(`${invalidCount} non-image file(s) were ignored. Only image files (JPG, PNG, WebP, etc.) are allowed.`);
        }

        input.value = "";
        this.renderFileStatus(key);
    },

    removeFile: function (key, fileIdx) {
        if (this.uploadedFiles[key] && this.uploadedFiles[key][fileIdx]) {
            this.uploadedFiles[key].splice(fileIdx, 1);
            if (this.uploadedFiles[key].length === 0) {
                delete this.uploadedFiles[key];
            }
        }
        this.renderFileStatus(key);
    },

    renderFileStatus: function (key) {
        const fileStatus = document.getElementById(`file-status-${key}`);
        if (!fileStatus) return;

        const files = this.uploadedFiles[key] || [];
        if (files.length === 0) {
            const row = fileStatus.closest("tr");
            const existingFiles = row ? row.getAttribute("data-existing-files") : null;
            if (!existingFiles) {
                fileStatus.innerHTML = "";
            }
            return;
        }

        let chipsHtml = `<div class="pkgops-file-chips-container">`;
        chipsHtml += `<div style="font-size: 11px; font-weight: 600; color: #15803d; display: flex; align-items: center; gap: 4px;"><i class="fa fa-check-circle"></i> ${files.length} photo(s) selected:</div>`;
        files.forEach((file, fIdx) => {
            chipsHtml += `
                <div class="pkgops-file-chip">
                    <span class="chip-name" title="${this.escapeHtml(file.name)}"><i class="fa fa-image"></i> ${this.escapeHtml(file.name)}</span>
                    <button type="button" class="chip-remove-btn" onclick="PKGOPS_Checklist.removeFile('${key}', ${fIdx})" title="Remove photo">&times;</button>
                </div>`;
        });
        chipsHtml += `</div>`;
        fileStatus.innerHTML = chipsHtml;
    },

    pqiSubChecklistsFilled: {
        NetWeight: false,
        Product: false,
        Primary: false,
        Secondary: false,
        CBB: false
    },

    allProducts: [],
    lineProducts: [],
    categories: [],
    products: [],
    skus: [],
    selectedLine: "",

    init: async function (tourId, pkgopsType) {
        this.currentTourId = tourId;
        this.pkgopsType = pkgopsType;
        this.pqiSubChecklistsFilled = {
            NetWeight: false,
            Product: false,
            Primary: false,
            Secondary: false,
            CBB: false
        };
        this.savedPqiNetWeight = null;
        this.savedPqiEvaluations = [];
        this._previousPqiSubSelect = "NetWeight";
        
        console.log(`Initializing Checklist: TourId=${tourId}, Type=${pkgopsType}`);

        // Fetch master products and SKUs for the selected line dynamically from SharePoint list
        const selectedLine = (typeof PKGOPS_StateMachine !== "undefined" && PKGOPS_StateMachine.currentSession && PKGOPS_StateMachine.currentSession.cr3ea_lineno) || document.getElementById("setup-line")?.value || "";
        this.selectedLine = selectedLine;

        try {
            // 1. Get all products across all lines (for master catalog & category resolution)
            this.allProducts = await PKGOPS_DAL.getAllProducts();
            
            // 2. Get line-filtered products matching the active line
            this.lineProducts = await PKGOPS_DAL.getProducts(selectedLine);
            
            // 3. Get master categories across SharePoint list for the selected line
            this.categories = await PKGOPS_DAL.getProductCategories(selectedLine);
            
            // 4. Get SKU master
            this.skus = await PKGOPS_DAL.getSkus();
        } catch (err) {
            console.warn("Failed to load products/skus from DAL:", err);
            this.allProducts = (PKGOPS_DAL.getMasterSeedDefaults ? PKGOPS_DAL.getMasterSeedDefaults() : []).filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return cType === "product master" || cType === "product_x0020_master";
            });
            this.lineProducts = this.allProducts;
            const catSet = new Set();
            this.allProducts.forEach(p => {
                if (p.ProductCategory && p.ProductCategory.trim()) catSet.add(p.ProductCategory.trim());
            });
            this.categories = Array.from(catSet).sort((a, b) => a.localeCompare(b));
            this.skus = (PKGOPS_DAL.getMasterSeedDefaults ? PKGOPS_DAL.getMasterSeedDefaults() : []).filter(c => {
                const cType = (c.ConfigType || "").trim().toLowerCase();
                return cType === "sku master" || cType === "sku_x0020_master";
            });
        }

        this.products = this.lineProducts;

        console.log(`PKGOPS_Checklist: Loaded ${this.lineProducts.length} line products (from ${this.allProducts.length} master products) across ${this.categories.length} categories for line "${selectedLine || 'All'}".`);

        this.renderChecklistForm();
        await this.loadSavedValues();

        // If user is not authorized QA, lock inputs
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            PKGOPS_StateMachine.lockChecklistReadOnly(true);
        }
    },

    getCategoryOptionsHtml: function (selectedCategory) {
        let html = `<option value="">All Categories</option>`;
        (this.categories || []).forEach(cat => {
            const isSel = (selectedCategory && selectedCategory.toLowerCase() === cat.toLowerCase()) ? 'selected' : '';
            html += `<option value="${cat}" ${isSel}>${cat}</option>`;
        });
        return html;
    },

    getProductOptionsHtml: function (selectedValue, categoryFilter) {
        // Base product list: line-filtered products if available, otherwise all products
        let prods = (this.lineProducts && this.lineProducts.length > 0) ? this.lineProducts : (this.allProducts || []);
        
        // If categoryFilter is provided (and not empty / "All Categories"), filter by category
        if (categoryFilter && categoryFilter.trim() && categoryFilter.toLowerCase() !== "all categories") {
            const lowerCat = categoryFilter.toLowerCase().trim();
            let catProds = prods.filter(p => {
                const pCat = (p.ProductCategory || "").toLowerCase().trim();
                if (lowerCat === "general") {
                    return pCat === "general" || !pCat;
                }
                return pCat === lowerCat;
            });

            // If line-filtered prods has no matching items in this category, search master catalog for items in this category
            if (catProds.length === 0 && this.allProducts && this.allProducts.length > 0) {
                catProds = this.allProducts.filter(p => {
                    const pCat = (p.ProductCategory || "").toLowerCase().trim();
                    if (lowerCat === "general") {
                        return pCat === "general" || !pCat;
                    }
                    return pCat === lowerCat;
                });
            }

            if (catProds.length > 0) {
                prods = catProds;
            }
        }

        let html = `<option value="">Select Product</option>`;
        let selectedFound = false;

        prods.forEach(p => {
            const code = p.ProductCode ? ` (${p.ProductCode})` : '';
            const isSel = (selectedValue && (selectedValue === p.Title || selectedValue === `${p.Title}${code}` || selectedValue === p.ProductCode)) ? 'selected' : '';
            if (isSel) selectedFound = true;
            html += `<option value="${p.Title}" data-category="${p.ProductCategory || ''}" ${isSel}>${p.Title}${code}</option>`;
        });

        // If a previously saved value is not in the filtered list, keep it visible and selected so saved data is never lost
        if (selectedValue && !selectedFound) {
            const fallbackProd = (this.allProducts || []).find(p => p.Title === selectedValue || `${p.Title} (${p.ProductCode})` === selectedValue || p.ProductCode === selectedValue);
            const cat = fallbackProd ? (fallbackProd.ProductCategory || '') : '';
            html += `<option value="${selectedValue}" data-category="${cat}" selected>${selectedValue}</option>`;
        }

        return html;
    },

    onCategoryChange: function (sectionPrefix) {
        const catEl = document.getElementById(`${sectionPrefix}-category`);
        const prodEl = document.getElementById(`${sectionPrefix}-product`);
        const skuEl = document.getElementById(`${sectionPrefix}-sku`);
        if (!prodEl) return;
        const selectedCategory = catEl ? catEl.value : "";
        
        prodEl.innerHTML = this.getProductOptionsHtml("", selectedCategory);
        
        if (window.jQuery && $.fn.select2 && $(prodEl).hasClass("select2-hidden-accessible")) {
            $(prodEl).val("").trigger('change');
        } else {
            prodEl.value = "";
        }

        if (skuEl) {
            skuEl.value = "";
            if (sectionPrefix === "pqi" && typeof this.onPqiSkuChange === "function") {
                this.onPqiSkuChange();
            }
        }
    },

    onProductChange: function (sectionPrefix) {
        const prodEl = document.getElementById(`${sectionPrefix}-product`);
        const catEl = document.getElementById(`${sectionPrefix}-category`);
        const skuEl = document.getElementById(`${sectionPrefix}-sku`);
        if (!prodEl) return;
        
        const selectedTitle = prodEl.value || "";

        // Instantly populate SKU with selected Product Name
        if (skuEl) {
            skuEl.value = selectedTitle;
            if (sectionPrefix === "pqi" && typeof this.onPqiSkuChange === "function") {
                this.onPqiSkuChange();
            }
        }

        if (!selectedTitle) return;

        // Find the selected product in allProducts
        const matched = (this.allProducts || []).find(p => p.Title === selectedTitle || `${p.Title} (${p.ProductCode})` === selectedTitle || p.ProductCode === selectedTitle);
        if (matched && matched.ProductCategory && catEl) {
            const currentCat = catEl.value;
            if (!currentCat || currentCat.toLowerCase() !== matched.ProductCategory.toLowerCase()) {
                catEl.value = matched.ProductCategory;
                if (window.jQuery && $.fn.select2 && $(catEl).hasClass("select2-hidden-accessible")) {
                    $(catEl).val(matched.ProductCategory).trigger('change.select2');
                }
                // Update product dropdown options to reflect this category while maintaining selection
                prodEl.innerHTML = this.getProductOptionsHtml(selectedTitle, matched.ProductCategory);
                if (window.jQuery && $.fn.select2 && $(prodEl).hasClass("select2-hidden-accessible")) {
                    $(prodEl).val(selectedTitle).trigger('change.select2');
                }
                if (skuEl) {
                    skuEl.value = selectedTitle;
                }
            }
        }
    },

    setProductWithCategory: function (sectionPrefix, productName) {
        if (!productName) return;
        const catEl = document.getElementById(`${sectionPrefix}-category`);
        const prodEl = document.getElementById(`${sectionPrefix}-product`);
        const skuEl = document.getElementById(`${sectionPrefix}-sku`);
        if (!prodEl) return;

        const matched = (this.allProducts || []).find(p => p.Title === productName || `${p.Title} (${p.ProductCode})` === productName || p.ProductCode === productName);
        const category = matched ? (matched.ProductCategory || "") : "";

        if (catEl && category) {
            catEl.value = category;
            if (window.jQuery && $.fn.select2 && $(catEl).hasClass("select2-hidden-accessible")) {
                $(catEl).val(category).trigger('change.select2');
            }
            prodEl.innerHTML = this.getProductOptionsHtml(productName, category);
        } else {
            prodEl.innerHTML = this.getProductOptionsHtml(productName, "");
        }

        this.setSelectValueSafely(`${sectionPrefix}-product`, productName);

        if (skuEl) {
            skuEl.value = productName;
            if (sectionPrefix === "pqi" && typeof this.onPqiSkuChange === "function") {
                this.onPqiSkuChange();
            }
        }
    },

    getSkuOptionsHtml: function (selectedValue) {
        let html = `<option value="">Select SKU</option>`;
        (this.skus || []).forEach(s => {
            const isSel = (selectedValue && selectedValue === s.Title) ? 'selected' : '';
            html += `<option value="${s.Title}" ${isSel}>${s.Title}</option>`;
        });
        return html;
    },

    getSkuDatalistHtml: function () {
        let html = `<datalist id="sku-master-datalist">`;
        (this.skus || []).forEach(s => {
            html += `<option value="${s.Title}"></option>`;
        });
        html += `</datalist>`;
        return html;
    },

    initSelect2OnChecklist: function () {
        if (window.jQuery && $.fn.select2) {
            setTimeout(() => {
                $('#checklist-form-area select.form-select').each(function () {
                    if (!$(this).hasClass("select2-hidden-accessible")) {
                        $(this).select2({
                            dropdownParent: $(this).parent(),
                            width: '100%'
                        });
                    }
                });

                // Ensure product dropdown changes instantly propagate to SKU
                const prefixes = ["cv", "papa", "pqi", "seal", "cream", "wall"];
                prefixes.forEach(prefix => {
                    $(`#${prefix}-product`).off("change.pkgupsku select2:select.pkgupsku").on("change.pkgupsku select2:select.pkgupsku", function () {
                        PKGOPS_Checklist.onProductChange(prefix);
                    });
                });
            }, 50);
        }
    },

    setSelectValueSafely: function (elementId, value) {
        const el = document.getElementById(elementId);
        if (!el || !value) return;
        if (el.tagName === "INPUT") {
            el.value = value;
            return;
        }
        let found = false;
        if (el.options) {
            for (let i = 0; i < el.options.length; i++) {
                if (el.options[i].value === value || el.options[i].text.includes(value)) {
                    el.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found && value) {
                const opt = new Option(value, value, true, true);
                el.add(opt);
            }
        }
        if (window.jQuery && $.fn.select2 && $(el).hasClass("select2-hidden-accessible")) {
            $(el).val(value).trigger('change');
        }
    },

    // Main router rendering the sub-checklist forms
    renderChecklistForm: function () {
        const container = document.getElementById("checklist-form-area");
        if (!container) return;

        container.innerHTML = "";

        switch (this.pkgopsType) {
            case "Temperatures & Humidity":
                this.activeSubChecklistKey = "CHILD_TEMP_HUMIDITY";
                this.renderTempHumidity(container);
                break;
            case "Code Verification":
                this.activeSubChecklistKey = "CHILD_CODE_VERIFICATION";
                this.renderCodeVerification(container);
                break;
            case "PAPA":
                this.activeSubChecklistKey = "CHILD_PAPA";
                this.renderPAPA(container);
                break;
            case "PQI":
                this.renderPQI(container);
                break;
            case "Seal Integrity":
                this.activeSubChecklistKey = "CHILD_SEAL_INTEGRITY";
                this.renderSealIntegrity(container);
                break;
            case "Cream Percentage":
                this.renderCreamPercentage(container);
                break;
            case "Quality Wall Records":
                this.activeSubChecklistKey = "CHILD_QUALITY_WALL";
                this.renderQualityWall(container);
                break;
            default:
                container.innerHTML = `<div class="alert alert-info">Invalid checklist type: ${this.pkgopsType}</div>`;
        }

        this.initSelect2OnChecklist();
        this.updateSubmitButtonVisibility();
    },

    updateSubmitButtonVisibility: function () {
        const submitBtn = document.getElementById("btnSubmitChecklist");
        if (!submitBtn) return;
        if (this.pkgopsType === "PQI") {
            const keys = ["NetWeight", "Product", "Primary", "Secondary", "CBB"];
            const allFilled = keys.every(k => !!(this.pqiSubChecklistsFilled && this.pqiSubChecklistsFilled[k]));
            submitBtn.style.display = allFilled ? "inline-block" : "none";
        } else {
            submitBtn.style.display = "inline-block";
        }
    },

    // 1. Temperatures & Humidity Form
    renderTempHumidity: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Temperatures & Humidity Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                ${this.createNumericField("pkglinetemp", "Packaging Line Temp (&deg;C)")}
                ${this.createNumericField("pkglinehumidity", "Packaging Line Humidity (%)")}
                ${this.createNumericField("coolingtunneltemp", "Cooling Tunnel Temp (&deg;C)")}
                ${this.createNumericField("creamroomtemp", "Cream Room Temp (&deg;C)")}
                ${this.createNumericField("coldstorage1temp", "Cold Storage 1 Temp (&deg;C)")}
                ${this.createNumericField("coldstorage2temp", "Cold Storage 2 Temp (&deg;C)")}
                ${this.createNumericField("flavourroomtemp", "Flavour Room Temp (&deg;C)")}
                ${this.createNumericField("dhroomhumidity", "DH Room Humidity (%)")}
                ${this.createNumericField("coldroom1temp", "Cold Room 1 Temp (&deg;C)")}
                ${this.createNumericField("coldroom2temp", "Cold Room 2 Temp (&deg;C)")}
                ${this.createNumericField("coldroom3temp", "Cold Room 3 Temp (&deg;C)")}
                ${this.createNumericField("deepfreezeryeasttemp", "Deep Freezer for Yeast (&deg;C)")}
            </div>
        `;
    },

    // Helper for numeric inputs
    createNumericField: function (id, label) {
        return `
            <div class="col-md-3">
                <div class="form-group mb-3">
                    <label class="form-label">${label}</label>
                    <input type="text" class="form-control numeric-input" id="th-${id}" placeholder="e.g. 24.5 or NA">
                </div>
            </div>
        `;
    },

    // 2. Code Verification Form
    renderCodeVerification: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Code Verification Details</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-3">
                    <label class="form-label">Product Category</label>
                    <select class="form-select" id="cv-category" onchange="PKGOPS_Checklist.onCategoryChange('cv')">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Product Name</label>
                    <div class="select2-parent">
                        <select class="form-select" id="cv-product" onchange="PKGOPS_Checklist.onProductChange('cv')">
                            ${this.getProductOptionsHtml()}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="cv-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Batch No</label>
                    <input type="text" class="form-control" id="cv-batch" placeholder="Enter Batch No">
                </div>
                <div class="col-md-3">
                    <label class="form-label">PKD</label>
                    <input type="date" class="form-control" id="cv-pkd">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Expiry Date</label>
                    <input type="date" class="form-control" id="cv-expiry">
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-12">
                    <h4 class="form-section-title">Sample Evaluation (Ok / Not Ok)</h4>
                    <table class="table table-bordered mt-2 text-center align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Sample No</th>
                                <th>Status</th>
                                <th>Defect Category</th>
                                <th>Defect Count</th>
                                <th>Upload Image</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Array.from({ length: 10 }).map((_, idx) => `
                                <tr>
                                    <td>Sample ${idx + 1}</td>
                                    <td>
                                        <select class="form-select cv-sample-status" id="cv-status-${idx}" onchange="PKGOPS_Checklist.toggleCvDefectFields(${idx})">
                                            <option value="Okay">Okay</option>
                                            <option value="Not Okay">Not Okay</option>
                                        </select>
                                    </td>
                                    <td>
                                        <select class="form-select cv-defect-category" id="cv-defect-${idx}" disabled>
                                            <option value="">Select Defect</option>
                                            <option value="Wrong PKD">Wrong PKD</option>
                                            <option value="Wrong Expiry">Wrong Expiry</option>
                                            <option value="Smudge Print">Smudge Print</option>
                                            <option value="Missing Print">Missing Print</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="number" class="form-control cv-defect-count" id="cv-count-${idx}" placeholder="Count" min="1" disabled>
                                    </td>
                                    <td>
                                        <input type="file" class="form-control cv-file-upload" id="cv-file-${idx}" accept="image/*" multiple disabled onchange="PKGOPS_Checklist.onFileSelected(this, 'cv-${idx}')">
                                        <div id="file-status-cv-${idx}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;"></div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    toggleCvDefectFields: function (idx) {
        const status = document.getElementById(`cv-status-${idx}`).value;
        const defectSelect = document.getElementById(`cv-defect-${idx}`);
        const countInput = document.getElementById(`cv-count-${idx}`);
        const fileInput = document.getElementById(`cv-file-${idx}`);

        if (status === "Not Okay") {
            defectSelect.disabled = false;
            countInput.disabled = false;
            fileInput.disabled = false;
        } else {
            defectSelect.disabled = true;
            countInput.disabled = true;
            fileInput.disabled = true;
            defectSelect.value = "";
            countInput.value = "";
            fileInput.value = "";
            delete this.uploadedFiles[`cv-${idx}`];
            this.renderFileStatus(`cv-${idx}`);
        }
    },

    // 3. PAPA Form
    renderPAPA: function (container) {
        // Group the flat list by category and type to render
        const grouped = {
            "A": { "Product": [], "Pack": [] },
            "B": { "Product": [], "Pack": [] },
            "C": { "Product": [], "Pack": [] }
        };

        PKGOPS_PAPA_DEFECTS_FLAT.forEach((defect, idx) => {
            grouped[defect.category][defect.type].push({
                ...defect,
                flatIndex: idx
            });
        });

        let categoriesHtml = "";
        ["A", "B", "C"].forEach(cat => {
            const prodList = grouped[cat]["Product"];
            const packList = grouped[cat]["Pack"];
            const catLabel = cat === 'A' ? 'Critical' : (cat === 'B' ? 'Major' : 'Minor');
            const badgeBg = cat === 'A' ? 'bg-danger' : (cat === 'B' ? 'bg-warning text-dark' : 'bg-secondary');

            categoriesHtml += `
                <div class="card mb-4 shadow-sm border rounded" style="border-radius: 8px; overflow: hidden;">
                    <div class="card-header py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style="background-color: #1e3a8a; color: #ffffff; border-bottom: 2px solid #1d4ed8;">
                        <h5 class="mb-0 fw-bold" style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                            Category ${cat} Defects (${catLabel})
                        </h5>
                        <div class="d-flex align-items-center gap-2">
                            <span id="papa-cat-${cat.toLowerCase()}-header-text" class="badge ${badgeBg}" style="font-size: 11px; font-weight: 600;">
                                0 Defects (0.00%)
                            </span>
                            <div class="progress" style="height: 8px; width: 130px; background-color: rgba(255,255,255,0.25); border-radius: 4px; overflow: hidden;">
                                <div id="papa-cat-${cat.toLowerCase()}-header-bar" class="progress-bar ${badgeBg}" style="width: 0%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-3">
                        <div class="row g-4">
                            <!-- Product Defects -->
                            <div class="col-md-6 border-end">
                                <div class="p-2 bg-light mb-3 rounded" style="border-left: 4px solid #3b82f6;">
                                    <h6 class="mb-0 fw-bold text-primary" style="font-size: 13px; text-transform: uppercase;">Product Defects</h6>
                                </div>
                                <div style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
                                    <table class="table table-sm table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style="width: 55%; font-size: 11px;">Defect</th>
                                                <th style="width: 15%; text-align: center; font-size: 11px;">Select</th>
                                                <th style="width: 30%; font-size: 11px;">Count / %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${prodList.map(item => `
                                                <tr>
                                                    <td style="font-size: 12.5px; font-weight: 500;">${item.name}</td>
                                                    <td style="text-align: center; position: relative;">
                                                        <input type="checkbox" class="form-check-input papa-defect-chk" id="papa-chk-${item.flatIndex}" onchange="PKGOPS_Checklist.togglePapaDefect(${item.flatIndex})" style="position: relative !important; float: none !important; margin: 0 auto !important; display: inline-block !important; width: 16px !important; height: 16px !important; opacity: 1 !important; visibility: visible !important;">
                                                    </td>
                                                    <td>
                                                        <div class="input-group input-group-sm">
                                                            <input type="number" class="form-control papa-defect-count" id="papa-count-${item.flatIndex}" value="0" min="0" max="100" disabled oninput="PKGOPS_Checklist.calculatePapaPercentages()" style="width: 55px;">
                                                            <span class="input-group-text fw-bold text-secondary" id="papa-pct-${item.flatIndex}" style="font-size: 10px;">0.0%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <!-- Pack Defects -->
                            <div class="col-md-6">
                                <div class="p-2 bg-light mb-3 rounded" style="border-left: 4px solid #10b981;">
                                    <h6 class="mb-0 fw-bold text-success" style="font-size: 13px; text-transform: uppercase;">Pack Defects</h6>
                                </div>
                                <div style="max-height: 380px; overflow-y: auto; padding-right: 5px;">
                                    <table class="table table-sm table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style="width: 55%; font-size: 11px;">Defect</th>
                                                <th style="width: 15%; text-align: center; font-size: 11px;">Select</th>
                                                <th style="width: 30%; font-size: 11px;">Count / %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${packList.map(item => `
                                                <tr>
                                                    <td style="font-size: 12.5px; font-weight: 500;">${item.name}</td>
                                                    <td style="text-align: center; position: relative;">
                                                        <input type="checkbox" class="form-check-input papa-defect-chk" id="papa-chk-${item.flatIndex}" onchange="PKGOPS_Checklist.togglePapaDefect(${item.flatIndex})" style="position: relative !important; float: none !important; margin: 0 auto !important; display: inline-block !important; width: 16px !important; height: 16px !important; opacity: 1 !important; visibility: visible !important;">
                                                    </td>
                                                    <td>
                                                        <div class="input-group input-group-sm">
                                                            <input type="number" class="form-control papa-defect-count" id="papa-count-${item.flatIndex}" value="0" min="0" max="100" disabled oninput="PKGOPS_Checklist.calculatePapaPercentages()" style="width: 55px;">
                                                            <span class="input-group-text fw-bold text-secondary" id="papa-pct-${item.flatIndex}" style="font-size: 10px;">0.0%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">PAPA (Product Attributes & Packaging Appearance)</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-3">
                    <label class="form-label fw-bold">Product Category</label>
                    <select class="form-select" id="papa-category" onchange="PKGOPS_Checklist.onCategoryChange('papa')">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Product Name</label>
                    <div class="select2-parent">
                        <select class="form-select" id="papa-product" onchange="PKGOPS_Checklist.onProductChange('papa')">
                            ${this.getProductOptionsHtml()}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">SKU</label>
                    <input type="text" class="form-control" id="papa-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="col-md-3">
                    <label class="form-label fw-bold">Sample Size (Biscuits)</label>
                    <input type="number" class="form-control" id="papa-sample-size" value="100" readonly>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-12">
                    <h4 class="form-section-title mb-3">Defect Sampling (Check and enter defect counts)</h4>
                    ${categoriesHtml}
                </div>
            </div>

            <!-- Category-wise & Overall Defect Summary Card with Progress Bars -->
            <div class="card mb-4 shadow-sm border rounded bg-white" style="border-radius: 8px; border: 1px solid #cbd5e1 !important;">
                <div class="card-header py-3 px-4 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 fw-bold text-dark" style="font-size: 15px;">
                        <i class="fa fa-chart-pie text-primary me-2"></i> Category-wise Defect Progress & Summary
                    </h5>
                    <span class="text-muted" style="font-size: 12px; font-weight: 500;">Live Defect Percentage Tracking</span>
                </div>
                <div class="card-body p-4">
                    <div class="row g-4">
                        <!-- Category A (Critical) -->
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-bold text-danger" style="font-size: 13px;">Category A (Critical)</span>
                                    <span id="papa-cat-a-count-badge" class="badge bg-danger" style="font-size: 11px;">0 Defects</span>
                                </div>
                                <h4 class="mb-1 fw-bold text-dark" id="papa-cat-a-pct-text">0.00%</h4>
                                <div class="progress mb-2" style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div id="papa-cat-a-bar" class="progress-bar bg-danger" role="progressbar" style="width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Critical product/pack defects</small>
                            </div>
                        </div>
                        <!-- Category B (Major) -->
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-bold text-warning text-dark" style="font-size: 13px;">Category B (Major)</span>
                                    <span id="papa-cat-b-count-badge" class="badge bg-warning text-dark" style="font-size: 11px;">0 Defects</span>
                                </div>
                                <h4 class="mb-1 fw-bold text-dark" id="papa-cat-b-pct-text">0.00%</h4>
                                <div class="progress mb-2" style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div id="papa-cat-b-bar" class="progress-bar bg-warning text-dark" role="progressbar" style="width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Major quality defects</small>
                            </div>
                        </div>
                        <!-- Category C (Minor) -->
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-bold text-secondary" style="font-size: 13px;">Category C (Minor)</span>
                                    <span id="papa-cat-c-count-badge" class="badge bg-secondary" style="font-size: 11px;">0 Defects</span>
                                </div>
                                <h4 class="mb-1 fw-bold text-dark" id="papa-cat-c-pct-text">0.00%</h4>
                                <div class="progress mb-2" style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div id="papa-cat-c-bar" class="progress-bar bg-secondary" role="progressbar" style="width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Minor aesthetic defects</small>
                            </div>
                        </div>
                        <!-- Overall Defect Summary -->
                        <div class="col-md-3">
                            <div class="p-3 border rounded bg-light h-100" style="border-left: 4px solid #1e3a8a !important;">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <span class="fw-bold text-primary" style="font-size: 13px;">Overall Defect Rate</span>
                                    <span id="papa-total-count" class="badge bg-primary" style="font-size: 11px;">0 Total Defects</span>
                                </div>
                                <h4 class="mb-1 fw-bold text-danger" id="papa-total-pct">0.00%</h4>
                                <div class="progress mb-2" style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                    <div id="papa-total-bar" class="progress-bar bg-danger" role="progressbar" style="width: 0%; transition: width 0.3s ease;"></div>
                                </div>
                                <small class="text-muted" style="font-size: 11px;">Combined PAPA deviation rate</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    togglePapaDefect: function (idx) {
        const chk = document.getElementById(`papa-chk-${idx}`);
        const countInput = document.getElementById(`papa-count-${idx}`);

        if (chk.checked) {
            countInput.disabled = false;
        } else {
            countInput.disabled = true;
            countInput.value = "0";
            this.calculatePapaPercentages();
        }
    },

    calculatePapaPercentages: function () {
        const sampleSize = parseInt(document.getElementById("papa-sample-size")?.value) || 100;
        let totalCount = 0;
        let catACount = 0;
        let catBCount = 0;
        let catCCount = 0;

        for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
            const defectItem = PKGOPS_PAPA_DEFECTS_FLAT[i];
            const countInput = document.getElementById(`papa-count-${i}`);
            if (!countInput) continue;
            
            let countVal = parseInt(countInput.value) || 0;
            if (countVal < 0) {
                countVal = 0;
                countInput.value = "0";
            }
            if (countVal > sampleSize) {
                countVal = sampleSize;
                countInput.value = sampleSize;
            }
            const pctSpan = document.getElementById(`papa-pct-${i}`);
            
            const pct = (countVal / sampleSize) * 100;
            if (pctSpan) pctSpan.innerText = `${pct.toFixed(2)}%`;
            totalCount += countVal;

            if (defectItem.category === "A") catACount += countVal;
            else if (defectItem.category === "B") catBCount += countVal;
            else if (defectItem.category === "C") catCCount += countVal;
        }

        const catAPct = ((catACount / sampleSize) * 100);
        const catBPct = ((catBCount / sampleSize) * 100);
        const catCPct = ((catCCount / sampleSize) * 100);
        const totalPct = ((totalCount / sampleSize) * 100);

        // Update Category A metrics & progress bar
        const catACntBadge = document.getElementById("papa-cat-a-count-badge");
        if (catACntBadge) catACntBadge.innerText = `${catACount} Defect${catACount !== 1 ? 's' : ''}`;
        const catAPctText = document.getElementById("papa-cat-a-pct-text");
        if (catAPctText) catAPctText.innerText = `${catAPct.toFixed(2)}%`;
        const catABar = document.getElementById("papa-cat-a-bar");
        if (catABar) catABar.style.width = `${Math.min(catAPct, 100)}%`;
        const catAHdrText = document.getElementById("papa-cat-a-header-text");
        if (catAHdrText) catAHdrText.innerText = `${catACount} Defects (${catAPct.toFixed(2)}%)`;
        const catAHdrBar = document.getElementById("papa-cat-a-header-bar");
        if (catAHdrBar) catAHdrBar.style.width = `${Math.min(catAPct, 100)}%`;

        // Update Category B metrics & progress bar
        const catBCntBadge = document.getElementById("papa-cat-b-count-badge");
        if (catBCntBadge) catBCntBadge.innerText = `${catBCount} Defect${catBCount !== 1 ? 's' : ''}`;
        const catBPctText = document.getElementById("papa-cat-b-pct-text");
        if (catBPctText) catBPctText.innerText = `${catBPct.toFixed(2)}%`;
        const catBBar = document.getElementById("papa-cat-b-bar");
        if (catBBar) catBBar.style.width = `${Math.min(catBPct, 100)}%`;
        const catBHdrText = document.getElementById("papa-cat-b-header-text");
        if (catBHdrText) catBHdrText.innerText = `${catBCount} Defects (${catBPct.toFixed(2)}%)`;
        const catBHdrBar = document.getElementById("papa-cat-b-header-bar");
        if (catBHdrBar) catBHdrBar.style.width = `${Math.min(catBPct, 100)}%`;

        // Update Category C metrics & progress bar
        const catCCntBadge = document.getElementById("papa-cat-c-count-badge");
        if (catCCntBadge) catCCntBadge.innerText = `${catCCount} Defect${catCCount !== 1 ? 's' : ''}`;
        const catCPctText = document.getElementById("papa-cat-c-pct-text");
        if (catCPctText) catCPctText.innerText = `${catCPct.toFixed(2)}%`;
        const catCBar = document.getElementById("papa-cat-c-bar");
        if (catCBar) catCBar.style.width = `${Math.min(catCPct, 100)}%`;
        const catCHdrText = document.getElementById("papa-cat-c-header-text");
        if (catCHdrText) catCHdrText.innerText = `${catCCount} Defects (${catCPct.toFixed(2)}%)`;
        const catCHdrBar = document.getElementById("papa-cat-c-header-bar");
        if (catCHdrBar) catCHdrBar.style.width = `${Math.min(catCPct, 100)}%`;

        // Update Overall Total metrics & progress bar
        const totalCountSpan = document.getElementById("papa-total-count");
        if (totalCountSpan) totalCountSpan.innerText = `${totalCount} Total Defect${totalCount !== 1 ? 's' : ''}`;
        const totalPctSpan = document.getElementById("papa-total-pct");
        if (totalPctSpan) totalPctSpan.innerText = `${totalPct.toFixed(2)}%`;
        const totalBar = document.getElementById("papa-total-bar");
        if (totalBar) {
            totalBar.style.width = `${Math.min(totalPct, 100)}%`;
            totalBar.className = totalCount > 0 ? "progress-bar bg-danger" : "progress-bar bg-success";
        }
    },

    // 4. PQI branching screen
    renderPQI: function (container) {
        this._previousPqiSubSelect = "NetWeight";
        container.innerHTML = `
            <!-- PQI Common Header Details Card (Frozen on top for all sub-evaluations) -->
            <div class="card mb-3 shadow-sm border rounded bg-white" style="border-radius: 8px; border: 1px solid #cbd5e1 !important;">
                <div class="card-header py-2.5 px-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <h6 class="mb-0 fw-bold text-dark"><i class="fa fa-box text-primary me-2"></i>PQI Common Header Details</h6>
                    <span class="text-muted" style="font-size: 11px; font-weight: 500;">Common for Net Weight to CBB Evaluation</span>
                </div>
                <div class="card-body p-3">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Product Category</label>
                            <select class="form-select" id="pqi-category" onchange="PKGOPS_Checklist.onCategoryChange('pqi')">
                                ${this.getCategoryOptionsHtml()}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label fw-bold">Product Name</label>
                            <div class="select2-parent">
                                <select class="form-select" id="pqi-product" onchange="PKGOPS_Checklist.onProductChange('pqi')">
                                    ${this.getProductOptionsHtml()}
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-bold">SKU</label>
                            <input type="text" class="form-control" id="pqi-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;" onchange="PKGOPS_Checklist.onPqiSkuChange()" oninput="PKGOPS_Checklist.onPqiSkuChange()">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-bold">PKD</label>
                            <input type="date" class="form-control" id="pqi-pkd">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label fw-bold">Batch Code</label>
                            <input type="text" class="form-control" id="pqi-batch" placeholder="Batch Code">
                        </div>
                    </div>
                </div>
            </div>

            <div class="row align-items-center mt-2">
                <div class="col-md-6">
                    <div class="form-group mb-0">
                        <label class="form-label fw-bold">PQI Sub-Evaluation Select</label>
                        <select id="pqi-sub-select" class="form-select" onchange="PKGOPS_Checklist.loadPqiSubForm()" style="font-weight: 600;">
                            <option value="NetWeight">1. Net Weight Evaluation</option>
                            <option value="Product">2. Product Evaluation</option>
                            <option value="Primary">3. Primary Pack Evaluation</option>
                            <option value="Secondary">4. Secondary Pack Evaluation</option>
                            <option value="CBB">5. CBB Evaluation</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6 d-flex align-items-center justify-content-end gap-2 flex-wrap pt-md-3">
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-netweight">Net Weight: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-product">Product: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-primary">Primary: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-secondary">Secondary: Pending</span>
                    <span class="badge bg-secondary pqi-status-badge" id="badge-pqi-cbb">CBB: Pending</span>
                </div>
            </div>
            <div id="pqi-sub-container" class="mt-3 p-3 border rounded bg-light">
                <!-- PQI Sub forms render here -->
            </div>
            <div class="mt-3 text-end">
                <button type="button" class="btn btn-primary" onclick="PKGOPS_Checklist.saveCurrentPqiSubForm()">Save Evaluation Component</button>
            </div>
        `;
        this.loadPqiSubForm();
        this.updatePqiBadges();
    },

    onPqiSkuChange: function () {
        const skuVal = document.getElementById("pqi-sku")?.value || "";
        const stdInput = document.getElementById("pqi-nw-standard");
        if (stdInput && skuVal) {
            const skuNum = parseFloat(String(skuVal).replace(/[^0-9.]/g, ""));
            if (!isNaN(skuNum) && skuNum > 0) {
                stdInput.value = skuNum;
                this.calculateNetWeightMetrics();
            }
        }
    },

    updatePqiBadges: function () {
        const keys = ["NetWeight", "Product", "Primary", "Secondary", "CBB"];
        keys.forEach(k => {
            const badge = document.getElementById(`badge-pqi-${k.toLowerCase()}`);
            if (!badge) return;
            const isFilled = !!this.pqiSubChecklistsFilled[k];
            if (isFilled) {
                badge.className = "badge bg-success pqi-status-badge";
                badge.innerText = `${k === "NetWeight" ? "Net Weight" : k}: Saved`;
            } else {
                badge.className = "badge bg-secondary pqi-status-badge";
                badge.innerText = `${k === "NetWeight" ? "Net Weight" : k}: Pending`;
            }
        });

        this.updateSubmitButtonVisibility();
    },

    captureActivePqiSubFormState: function (prevVal) {
        if (!prevVal) return;
        const product = document.getElementById("pqi-product")?.value || "";
        const sku = document.getElementById("pqi-sku")?.value || "";
        const pkd = document.getElementById("pqi-pkd")?.value || "";
        const batch = document.getElementById("pqi-batch")?.value || "";

        if (prevVal === "NetWeight") {
            const standard = document.getElementById("pqi-nw-standard")?.value || "150";
            const weights = {};
            let hasAny = false;
            for (let i = 0; i < 15; i++) {
                const w = document.getElementById(`pqi-weight-${i}`)?.value;
                if (w !== undefined && w !== "") {
                    weights[`cr3ea_sampleweight${i + 1}`] = parseFloat(w) || 0;
                    hasAny = true;
                }
            }
            if (product || sku || hasAny) {
                this.savedPqiNetWeight = {
                    ...(this.savedPqiNetWeight || {}),
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_standardweight: standard,
                    ...weights
                };
            }
        } else {
            const capturedRows = [];
            let hasAny = !!(product || sku || pkd || batch);
            for (let idx = 0; idx < 10; idx++) {
                const status = document.getElementById(`pqi-eval-status-${idx}`)?.value || "Okay";
                const cat = document.getElementById(`pqi-eval-cat-${idx}`)?.value || "";
                const detail = document.getElementById(`pqi-eval-detail-${idx}`)?.value || "";
                if (status === "Not Okay" || cat || detail) hasAny = true;

                const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === prevVal && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                capturedRows.push({
                    cr3ea_evaluationtype: prevVal,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_pkd: pkd,
                    cr3ea_batchcode: batch,
                    cr3ea_samplenumber: `Sample ${idx + 1}`,
                    cr3ea_sampleresult: status,
                    cr3ea_defectcategory: cat,
                    cr3ea_defectdetail: detail,
                    cr3ea_batchcodepictureurl: (existingPrev && existingPrev.cr3ea_batchcodepictureurl) || ""
                });
            }
            if (hasAny) {
                this.savedPqiEvaluations = (this.savedPqiEvaluations || []).filter(r => r.cr3ea_evaluationtype !== prevVal).concat(capturedRows);
            }
        }
    },

    loadPqiSubForm: function () {
        const select = document.getElementById("pqi-sub-select");
        const subContainer = document.getElementById("pqi-sub-container");
        if (!select || !subContainer) return;

        const val = select.value;
        if (this._previousPqiSubSelect && this._previousPqiSubSelect !== val) {
            this.captureActivePqiSubFormState(this._previousPqiSubSelect);
        }
        this._previousPqiSubSelect = val;

        subContainer.innerHTML = "";

        if (val === "NetWeight") {
            const skuVal = document.getElementById("pqi-sku")?.value || "";
            let defaultStd = "150";
            if (skuVal) {
                const skuNum = parseFloat(String(skuVal).replace(/[^0-9.]/g, ""));
                if (!isNaN(skuNum) && skuNum > 0) defaultStd = String(skuNum);
            }

            subContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Standard Weight (g)</label>
                        <input type="number" class="form-control" id="pqi-nw-standard" value="${defaultStd}" oninput="PKGOPS_Checklist.calculateNetWeightMetrics()">
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h4 class="form-section-title">Sample Weight Entries (g)</h4>
                    </div>
                    ${Array.from({ length: 15 }).map((_, idx) => `
                        <div class="col-md-2 mt-2">
                            <label class="form-label font-weight-bold" style="font-size: 11px;">Sample ${idx + 1}</label>
                            <input type="number" step="0.01" class="form-control pqi-weight-input" id="pqi-weight-${idx}" oninput="PKGOPS_Checklist.calculateNetWeightMetrics()" placeholder="Weight">
                        </div>
                    `).join('')}
                </div>
                <div class="row mt-4 p-3 border rounded bg-white text-center">
                    <div class="col-md-6">
                        <h5>Average Weight: <span id="pqi-average-weight" class="text-primary fw-bold">-</span></h5>
                    </div>
                    <div class="col-md-6">
                        <h5>Give-Away: <span id="pqi-giveaway" class="text-danger fw-bold">-</span></h5>
                    </div>
                </div>
            `;
        } else {
            // Render evaluation forms (Product, Primary, Secondary, CBB)
            subContainer.innerHTML = `
                <div class="row">
                    <div class="col-md-12">
                        <!-- Live Evaluation Defect Summary with Progress Bar -->
                        <div class="card mb-3 border rounded shadow-sm bg-white" style="border: 1px solid #cbd5e1 !important;">
                            <div class="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h6 class="mb-1 fw-bold text-dark" style="font-size: 14px;">
                                        <i class="fa fa-tachometer text-primary me-1"></i> ${val} Evaluation Defect Rate
                                    </h6>
                                    <span id="pqi-eval-defect-stats" class="text-secondary fw-semibold" style="font-size: 12px;">
                                        0 of 10 Samples Defective (0.00% Defect Rate)
                                    </span>
                                </div>
                                <div style="flex: 1; max-width: 320px; min-width: 180px;">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="text-muted fw-bold" style="font-size: 11px;">DEFECT %</span>
                                        <span id="pqi-eval-defect-pct-badge" class="badge bg-success" style="font-size: 11px;">0.00%</span>
                                    </div>
                                    <div class="progress" style="height: 8px; background-color: #e2e8f0; border-radius: 4px; overflow: hidden;">
                                        <div id="pqi-eval-defect-bar" class="progress-bar bg-success" role="progressbar" style="width: 0%; transition: width 0.3s ease;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h4 class="form-section-title">Sample Evaluation (Ok / Not Ok)</h4>
                        <table class="table table-bordered mt-2 text-center align-middle">
                            <thead class="table-light">
                                <th>Sample No</th>
                                <th>Status</th>
                                <th>Defect Category</th>
                                <th>Defect Detail</th>
                                <th>Photo Reference</th>
                            </thead>
                            <tbody>
                                ${Array.from({ length: 10 }).map((_, idx) => `
                                    <tr>
                                        <td>Sample ${idx + 1}</td>
                                        <td>
                                            <select class="form-select pqi-eval-status" id="pqi-eval-status-${idx}" onchange="PKGOPS_Checklist.togglePqiDefectFields(${idx})">
                                                <option value="Okay">Okay</option>
                                                <option value="Not Okay">Not Okay</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select class="form-select pqi-eval-defect-cat" id="pqi-eval-cat-${idx}" disabled onchange="PKGOPS_Checklist.onPqiDefectCatChange(${idx})">
                                                <option value="">-- Select Category --</option>
                                                <option value="Category A">Category A</option>
                                                <option value="Category B">Category B</option>
                                                <option value="Category C">Category C</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select class="form-select pqi-eval-defect-detail" id="pqi-eval-detail-${idx}" disabled>
                                                <option value="">-- Select Detail --</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="file" class="form-control pqi-eval-file" id="pqi-eval-file-${idx}" accept="image/*" multiple disabled onchange="PKGOPS_Checklist.onFileSelected(this, 'pqi-${idx}')">
                                            <div id="file-status-pqi-${idx}" class="form-text text-muted" style="margin-top: 4px; font-size: 11px;"></div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
        this.populateActivePqiSubForm();
        this.updatePqiBadges();
        this.initSelect2OnChecklist();
    },

    onPqiDefectCatChange: function (idx, selectedDetail) {
        const catSelect = document.getElementById(`pqi-eval-cat-${idx}`);
        const detailSelect = document.getElementById(`pqi-eval-detail-${idx}`);
        if (!catSelect || !detailSelect) return;

        PKGOPS_Validator.highlight(catSelect, false);

        const catVal = (catSelect.value || "").trim();
        const details = PKGOPS_DEFECT_DETAILS_BY_CATEGORY[catVal] || [];

        if (!catVal || details.length === 0) {
            detailSelect.innerHTML = `<option value="">-- Select Detail --</option>`;
            detailSelect.disabled = true;
            detailSelect.value = "";
        } else {
            let optionsHtml = `<option value="">-- Select Detail --</option>`;
            details.forEach(d => {
                optionsHtml += `<option value="${d}">${d}</option>`;
            });
            detailSelect.innerHTML = optionsHtml;
            const statusEl = document.getElementById(`pqi-eval-status-${idx}`);
            if (statusEl && statusEl.value === "Not Okay") {
                detailSelect.disabled = false;
            }
            if (selectedDetail) {
                detailSelect.value = selectedDetail;
                if (!detailSelect.value && selectedDetail) {
                    const opt = document.createElement("option");
                    opt.value = selectedDetail;
                    opt.textContent = selectedDetail;
                    opt.selected = true;
                    detailSelect.appendChild(opt);
                    detailSelect.value = selectedDetail;
                }
            }
        }
    },

    togglePqiDefectFields: function (idx) {
        const status = document.getElementById(`pqi-eval-status-${idx}`)?.value;
        const catSelect = document.getElementById(`pqi-eval-cat-${idx}`);
        const detailSelect = document.getElementById(`pqi-eval-detail-${idx}`);
        const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

        if (status === "Not Okay") {
            if (catSelect) catSelect.disabled = false;
            if (detailSelect) {
                if (catSelect && catSelect.value) {
                    detailSelect.disabled = false;
                } else {
                    detailSelect.disabled = true;
                }
            }
            if (fileInput) fileInput.disabled = false;
        } else {
            if (catSelect) {
                catSelect.disabled = true;
                catSelect.value = "";
                PKGOPS_Validator.highlight(catSelect, false);
            }
            if (detailSelect) {
                detailSelect.disabled = true;
                detailSelect.innerHTML = `<option value="">-- Select Detail --</option>`;
                detailSelect.value = "";
                PKGOPS_Validator.highlight(detailSelect, false);
            }
            if (fileInput) {
                fileInput.disabled = true;
                fileInput.value = "";
                PKGOPS_Validator.highlight(fileInput, false);
                const row = fileInput.closest("tr");
                if (row) row.removeAttribute("data-existing-files");
            }
            delete this.uploadedFiles[`pqi-${idx}`];
            const fileStatus = document.getElementById(`file-status-pqi-${idx}`);
            if (fileStatus) fileStatus.innerHTML = "";
        }
        this.calculatePqiEvaluationMetrics();
    },

    calculatePqiEvaluationMetrics: function () {
        let notOkCount = 0;
        const totalSamples = 10;
        for (let i = 0; i < totalSamples; i++) {
            const statusEl = document.getElementById(`pqi-eval-status-${i}`);
            if (statusEl && statusEl.value === "Not Okay") {
                notOkCount++;
            }
        }
        const pct = (notOkCount / totalSamples) * 100;
        const statsEl = document.getElementById("pqi-eval-defect-stats");
        const pctBadge = document.getElementById("pqi-eval-defect-pct-badge");
        const prgBar = document.getElementById("pqi-eval-defect-bar");

        if (statsEl) {
            statsEl.innerHTML = `<strong>${notOkCount}</strong> of <strong>${totalSamples}</strong> Samples Defective (<strong>${pct.toFixed(2)}%</strong> Defect Rate)`;
        }
        if (pctBadge) {
            pctBadge.innerText = `${pct.toFixed(2)}%`;
            pctBadge.className = notOkCount > 0 ? "badge bg-danger" : "badge bg-success";
        }
        if (prgBar) {
            prgBar.style.width = `${Math.min(pct, 100)}%`;
            prgBar.className = notOkCount > 0 ? "progress-bar bg-danger" : "progress-bar bg-success";
        }
    },

    calculateNetWeightMetrics: function () {
        const stdWeight = parseFloat(document.getElementById("pqi-nw-standard")?.value) || 0;
        const weights = [];

        document.querySelectorAll(".pqi-weight-input").forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) weights.push(val);
        });

        const avgSpan = document.getElementById("pqi-average-weight");
        const gaSpan = document.getElementById("pqi-giveaway");

        if (!avgSpan || !gaSpan) return;

        if (weights.length === 0) {
            avgSpan.innerText = "-";
            gaSpan.innerText = "-";
            return;
        }

        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
        const giveAway = (stdWeight > 0 && avg > stdWeight) ? (avg - stdWeight) : 0;

        avgSpan.innerText = `${avg.toFixed(2)} g`;
        gaSpan.innerText = `${giveAway.toFixed(2)} g`;
    },

    saveCurrentPqiSubForm: async function () {
        const select = document.getElementById("pqi-sub-select");
        const val = select.value;

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            PKGOPS_Validator.clearAll("checklist-form-area");

            // Validate common top fields first
            const commonHeaders = [
                { id: "pqi-product", name: "Product Name" },
                { id: "pqi-sku", name: "SKU" }
            ];
            if (val !== "NetWeight") {
                commonHeaders.push({ id: "pqi-pkd", name: "PKD" });
                commonHeaders.push({ id: "pqi-batch", name: "Batch Code" });
            }

            for (let h of commonHeaders) {
                const el = document.getElementById(h.id);
                if (!el || !el.value.trim()) {
                    if (el) PKGOPS_Validator.highlight(el, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert(`Please fill in the required field: ${h.name}`);
                    if (el) el.focus();
                    return;
                }
            }

            const product = document.getElementById("pqi-product").value;
            const sku = document.getElementById("pqi-sku").value;
            const pkd = document.getElementById("pqi-pkd")?.value || "";
            const batch = document.getElementById("pqi-batch")?.value || "";

            if (val === "NetWeight") {
                const standardEl = document.getElementById("pqi-nw-standard");
                if (!standardEl || !standardEl.value.trim()) {
                    if (standardEl) PKGOPS_Validator.highlight(standardEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Please fill in the required field: Standard Weight");
                    if (standardEl) standardEl.focus();
                    return;
                }

                const standardVal = parseFloat(standardEl.value) || 0;
                if (standardVal <= 0) {
                    PKGOPS_Validator.highlight(standardEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Standard Weight must be greater than 0.");
                    standardEl.focus();
                    return;
                }

                // Check 15 weights
                for (let i = 0; i < 15; i++) {
                    const weightEl = document.getElementById(`pqi-weight-${i}`);
                    const wVal = parseFloat(weightEl.value);
                    if (!weightEl || isNaN(wVal) || wVal <= 0) {
                        PKGOPS_Validator.highlight(weightEl, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please enter a valid weight greater than 0 for Sample ${i + 1}.`);
                        weightEl.focus();
                        return;
                    }
                }

                const weights = [];
                for (let i = 0; i < 15; i++) {
                    const weightVal = parseFloat(document.getElementById(`pqi-weight-${i}`).value) || 0;
                    weights.push(weightVal);
                }

                const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
                const giveAway = (standardVal > 0 && avg > standardVal) ? (avg - standardVal) : 0;

                const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();
                const netWeightRecord = {
                    cr3ea_name: `PQI_NetWeight_${sku}_${moment().format("DD-MM-YYYY")}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_averageweight: Number(avg.toFixed(2)),
                    cr3ea_giveaway: Number(giveAway.toFixed(2)),
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                };

                // Add weights
                weights.forEach((w, idx) => {
                    netWeightRecord[`cr3ea_sampleweight${idx + 1}`] = Number(w.toFixed(2));
                });

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PQI_NET_WEIGHT", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_NET_WEIGHT", netWeightRecord);
                this.savedPqiNetWeight = { ...netWeightRecord, cr3ea_standardweight: standardVal };
                this.pqiSubChecklistsFilled.NetWeight = true;
                this.updatePqiBadges();
            } else {
                // Validate 10 sample evaluation rows
                for (let idx = 0; idx < 10; idx++) {
                    const statusEl = document.getElementById(`pqi-eval-status-${idx}`);
                    if (!statusEl) continue;
                    if (statusEl.value === "Not Okay") {
                        const catEl = document.getElementById(`pqi-eval-cat-${idx}`);
                        const detailEl = document.getElementById(`pqi-eval-detail-${idx}`);
                        const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

                        if (!catEl || !catEl.value.trim()) {
                            if (catEl) PKGOPS_Validator.highlight(catEl, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please select a defect category for Sample ${idx + 1}.`);
                            if (catEl) catEl.focus();
                            return;
                        }

                        if (!detailEl || !detailEl.value.trim()) {
                            if (detailEl) PKGOPS_Validator.highlight(detailEl, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please select defect details for Sample ${idx + 1}.`);
                            if (detailEl) detailEl.focus();
                            return;
                        }

                        const files = this.uploadedFiles[`pqi-${idx}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                        const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === val && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                        const hasOldPhoto = existingPrev && existingPrev.cr3ea_batchcodepictureurl;

                        if (files.length === 0 && !hasOldPhoto) {
                            if (fileInput) PKGOPS_Validator.highlight(fileInput, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please upload a proof image for defective Sample ${idx + 1}.`);
                            if (fileInput) fileInput.focus();
                            return;
                        }
                    }
                }

                const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PQI_EVALUATION", this.currentTourId, val);
                const newEvalRows = [];
                // Save each sample evaluation row to CHILD_PQI_EVALUATION
                for (let idx = 0; idx < 10; idx++) {
                    const status = document.getElementById(`pqi-eval-status-${idx}`).value;
                    const cat = document.getElementById(`pqi-eval-cat-${idx}`).value;
                    const detail = document.getElementById(`pqi-eval-detail-${idx}`).value;
                    const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

                    let pictureUrl = "";
                    const files = this.uploadedFiles[`pqi-${idx}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                    if (files.length > 0) {
                        const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, `PQI_${val}`, `PQI-Sample-${idx}`, detail));
                        const urls = await Promise.all(uploadPromises);
                        const validUrls = urls.filter(Boolean);
                        const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === val && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                        const existingUrl = (existingPrev && existingPrev.cr3ea_batchcodepictureurl) ? existingPrev.cr3ea_batchcodepictureurl.trim() : "";
                        if (existingUrl) {
                            pictureUrl = existingUrl + ", " + validUrls.join(", ");
                        } else {
                            pictureUrl = validUrls.join(", ");
                        }
                    } else {
                        const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === val && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                        if (existingPrev && existingPrev.cr3ea_batchcodepictureurl) {
                            pictureUrl = existingPrev.cr3ea_batchcodepictureurl;
                        }
                    }

                    const evalRecord = {
                        cr3ea_name: `PQI_Evaluation_${val}_${sku}`,
                        cr3ea_evaluationtype: val,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_pkd: pkd,
                        cr3ea_batchcode: batch,
                        cr3ea_samplenumber: `Sample ${idx + 1}`,
                        cr3ea_sampleresult: status,
                        cr3ea_defectcategory: cat,
                        cr3ea_defectdetail: detail,
                        cr3ea_batchcodepictureurl: pictureUrl,
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                    };

                    newEvalRows.push(evalRecord);
                }

                // High-performance parallel batch save in waves
                const CHUNK_SIZE = 5;
                for (let i = 0; i < newEvalRows.length; i += CHUNK_SIZE) {
                    const chunk = newEvalRows.slice(i, i + CHUNK_SIZE);
                    await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_EVALUATION", rec)));
                }

                this.savedPqiEvaluations = (this.savedPqiEvaluations || []).filter(r => r.cr3ea_evaluationtype !== val).concat(newEvalRows);
                this.pqiSubChecklistsFilled[val] = true;
                this.updatePqiBadges();
            }

            if (typeof HideLoader === "function") HideLoader();
            alert("Evaluation component saved successfully!");
        } catch (error) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to save PQI component: ", error);
            const msg = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(error, "save evaluation component entry")
                : `Failed to save component entry: ${error.message || error}`;
            alert(msg);
        }
    },

    // 5. Seal Integrity Form
    renderSealIntegrity: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Seal Integrity Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-3">
                    <label class="form-label">Product Category</label>
                    <select class="form-select" id="seal-category" onchange="PKGOPS_Checklist.onCategoryChange('seal')">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Product Name</label>
                    <div class="select2-parent">
                        <select class="form-select" id="seal-product" onchange="PKGOPS_Checklist.onProductChange('seal')">
                            ${this.getProductOptionsHtml()}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="seal-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Machine No</label>
                    <input type="text" class="form-control" id="seal-machine" placeholder="Machine No">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Sample Quantity</label>
                    <input type="number" class="form-control" id="seal-qty" value="10" min="1">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Leakage Count</label>
                    <input type="number" class="form-control" id="seal-leak-count" value="0" min="0">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Leakage Type</label>
                    <select class="form-select" id="seal-leak-type">
                        <option value="None">None</option>
                        <option value="Joint Leakage">Joint Leakage</option>
                        <option value="Side Sealing Leakage">Side Sealing Leakage</option>
                        <option value="Puncture">Puncture</option>
                    </select>
                </div>
            </div>
        `;
    },

    // 6. Cream Percentage Form
    renderCreamPercentage: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Cream Percentage Entry</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-3">
                    <label class="form-label">Product Category</label>
                    <select class="form-select" id="cream-category" onchange="PKGOPS_Checklist.onCategoryChange('cream')">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Product Name</label>
                    <div class="select2-parent">
                        <select class="form-select" id="cream-product" onchange="PKGOPS_Checklist.onProductChange('cream')">
                            ${this.getProductOptionsHtml()}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="cream-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Sample Size</label>
                    <input type="number" class="form-control" id="cream-sample-size" value="10" min="1">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Cream Percentage Reading (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-reading" oninput="PKGOPS_Checklist.checkCreamStatus()" placeholder="Reading %">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Standard Min (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-min" value="20" oninput="PKGOPS_Checklist.checkCreamStatus()">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Standard Max (%)</label>
                    <input type="number" step="0.01" class="form-control" id="cream-max" value="30" oninput="PKGOPS_Checklist.checkCreamStatus()">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Status</label>
                    <input type="text" class="form-control fw-bold" id="cream-status" value="Pass" readonly style="color: green;">
                </div>
            </div>
        `;
    },

    checkCreamStatus: function () {
        const reading = parseFloat(document.getElementById("cream-reading").value) || 0;
        const min = parseFloat(document.getElementById("cream-min").value) || 0;
        const max = parseFloat(document.getElementById("cream-max").value) || 0;

        const statusInput = document.getElementById("cream-status");
        if (reading >= min && reading <= max) {
            statusInput.value = "Pass";
            statusInput.style.color = "green";
        } else {
            statusInput.value = "Fail";
            statusInput.style.color = "red";
        }
    },

    // 7. Quality Wall Records Form
    renderQualityWall: function (container) {
        container.innerHTML = `
            <div class="row">
                <div class="col-md-12">
                    <h3 class="form-section-title">Quality Wall Evaluation</h3>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-md-3">
                    <label class="form-label">Product Category</label>
                    <select class="form-select" id="wall-category" onchange="PKGOPS_Checklist.onCategoryChange('wall')">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Product Name</label>
                    <div class="select2-parent">
                        <select class="form-select" id="wall-product" onchange="PKGOPS_Checklist.onProductChange('wall')">
                            ${this.getProductOptionsHtml()}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label class="form-label">SKU</label>
                    <input type="text" class="form-control" id="wall-sku" placeholder="SKU" readonly style="background-color: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Wall Type</label>
                    <select class="form-select" id="wall-type">
                        <option value="Main Wall">Main Wall</option>
                        <option value="Line Wall">Line Wall</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Facilitator</label>
                    <div class="pkgops-user-picker-container" id="picker-container-wall-facilitator">
                        <input type="hidden" id="wall-facilitator" value="">
                        <div class="pkgops-selected-chips-box" id="selected-chips-box-wall-facilitator" onclick="const inp = document.getElementById('picker-input-wall-facilitator'); if(inp) inp.focus();">
                            <div id="chips-list-wall-facilitator" class="d-inline-flex flex-wrap gap-1 align-items-center"></div>
                            <input type="text" id="picker-input-wall-facilitator" class="pkgops-picker-search-input" placeholder="Search facilitator..." oninput="PKGOPS_Checklist.onPickerSearch('wall-facilitator', this.value)" autocomplete="off">
                        </div>
                        <div id="dropdown-wall-facilitator" class="pkgops-picker-dropdown" style="display: none;"></div>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Search from employee directory</div>
                </div>
                <div class="col-md-8">
                    <label class="form-label">Members Present</label>
                    <div class="pkgops-user-picker-container" id="picker-container-wall-members">
                        <input type="hidden" id="wall-members" value="">
                        <div class="pkgops-selected-chips-box" id="selected-chips-box-wall-members" onclick="const inp = document.getElementById('picker-input-wall-members'); if(inp) inp.focus();">
                            <div id="chips-list-wall-members" class="d-inline-flex flex-wrap gap-1 align-items-center"></div>
                            <input type="text" id="picker-input-wall-members" class="pkgops-picker-search-input" placeholder="Type name or email to add member..." oninput="PKGOPS_Checklist.onPickerSearch('wall-members', this.value)" autocomplete="off">
                        </div>
                        <div id="dropdown-wall-members" class="pkgops-picker-dropdown" style="display: none;"></div>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Select multiple team members attending evaluation</div>
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-4">
                    <label class="form-label">Pack Appearance Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-appearance" min="1" max="5" step="1" value="5" oninput="PKGOPS_Checklist.validateRatingInput(this)" onblur="PKGOPS_Checklist.onRatingBlur(this)">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Sealing Quality Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-sealing" min="1" max="5" step="1" value="5" oninput="PKGOPS_Checklist.validateRatingInput(this)" onblur="PKGOPS_Checklist.onRatingBlur(this)">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Coding Rating (1-5)</label>
                    <input type="number" class="form-control star-rating-input" id="wall-rating-coding" min="1" max="5" step="1" value="5" oninput="PKGOPS_Checklist.validateRatingInput(this)" onblur="PKGOPS_Checklist.onRatingBlur(this)">
                </div>
            </div>
            <div class="row mt-4 text-center p-3 border rounded bg-white">
                <div class="col-md-12">
                    <h4>Overall Rating Score: <span id="wall-overall-rating" class="text-primary fw-bold">5.00 / 5</span></h4>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-12">
                    <label class="form-label">Remarks</label>
                    <textarea class="form-control" id="wall-remarks" rows="3" placeholder="Enter remarks"></textarea>
                </div>
            </div>
        `;
        this.initQualityWallPickerState();
    },

    wallPickerState: {
        "wall-facilitator": [],
        "wall-members": []
    },
    _pickerDocClickBound: false,

    initQualityWallPickerState: function () {
        this.wallPickerState = {
            "wall-facilitator": [],
            "wall-members": []
        };
        // Pre-fetch employee directory in background
        if (typeof PKGOPS_DAL !== "undefined" && typeof PKGOPS_DAL.getEmployeeList === "function") {
            PKGOPS_DAL.getEmployeeList().catch(err => console.warn("Failed prefetching employees:", err));
        }

        if (!this._pickerDocClickBound) {
            this._pickerDocClickBound = true;
            document.addEventListener("click", function (e) {
                const pickers = ["wall-facilitator", "wall-members"];
                pickers.forEach(key => {
                    const container = document.getElementById(`picker-container-${key}`);
                    const dropdown = document.getElementById(`dropdown-${key}`);
                    if (container && dropdown && !container.contains(e.target)) {
                        dropdown.style.display = "none";
                    }
                });
            });
        }
    },

    getInitials: function (name) {
        if (!name || typeof name !== "string") return "U";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    escapeHtml: function (text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    onPickerSearch: async function (pickerKey, query) {
        const dropdown = document.getElementById(`dropdown-${pickerKey}`);
        if (!dropdown) return;

        if (!query || query.trim().length < 1) {
            dropdown.style.display = "none";
            return;
        }

        const q = query.toLowerCase().trim();
        const employees = await PKGOPS_DAL.getEmployeeList();
        const selectedUsers = this.wallPickerState[pickerKey] || [];
        const selectedEmails = selectedUsers.map(u => (u.email || u.title || "").toLowerCase());

        const matches = employees.filter(emp => {
            const empEmail = (emp.email || "").toLowerCase();
            const empTitle = (emp.title || "").toLowerCase();
            if (empEmail && selectedEmails.includes(empEmail)) return false;
            if (!empEmail && selectedEmails.includes(empTitle)) return false;

            const nameMatch = empTitle.includes(q);
            const emailMatch = empEmail.includes(q);
            const deptMatch = (emp.department || "").toLowerCase().includes(q);
            return nameMatch || emailMatch || deptMatch;
        }).slice(0, 10);

        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding: 10px 14px; font-size: 12.5px; color: #94a3b8;">No matching employee found</div>`;
            dropdown.style.display = "block";
            return;
        }

        dropdown.innerHTML = matches.map(emp => `
            <div class="pkgops-picker-item" onclick="PKGOPS_Checklist.onSelectPickerUser('${pickerKey}', '${emp.id}')">
                <span class="pkgops-user-avatar" style="width: 28px; height: 28px; font-size: 12px;">${this.getInitials(emp.title)}</span>
                <div class="pkgops-picker-item-info">
                    <div class="pkgops-picker-item-name">${this.escapeHtml(emp.title)}</div>
                    <div class="pkgops-picker-item-sub">${this.escapeHtml(emp.email || "No email")} &bull; ${this.escapeHtml(emp.department || "Plant")}</div>
                </div>
                <span style="font-size: 16px; color: #2563eb; font-weight: bold;">+</span>
            </div>
        `).join("");
        dropdown.style.display = "block";
    },

    onSelectPickerUser: async function (pickerKey, empId) {
        const employees = await PKGOPS_DAL.getEmployeeList();
        const emp = employees.find(e => String(e.id) === String(empId));
        if (!emp) return;

        if (!this.wallPickerState[pickerKey]) this.wallPickerState[pickerKey] = [];

        if (pickerKey === "wall-facilitator") {
            // Single select for Facilitator
            this.wallPickerState[pickerKey] = [{
                id: emp.id,
                title: emp.title,
                email: emp.email || emp.title
            }];
        } else {
            // Multi select for Members Present
            if (!this.wallPickerState[pickerKey].some(u => String(u.id) === String(emp.id) || (u.email && u.email.toLowerCase() === (emp.email || "").toLowerCase()))) {
                this.wallPickerState[pickerKey].push({
                    id: emp.id,
                    title: emp.title,
                    email: emp.email || emp.title
                });
            }
        }

        this.renderPickerChips(pickerKey);
        this.syncPickerHiddenInput(pickerKey);

        const input = document.getElementById(`picker-input-${pickerKey}`);
        if (input) {
            input.value = "";
            if (pickerKey !== "wall-facilitator") {
                input.focus();
            }
        }
        const dropdown = document.getElementById(`dropdown-${pickerKey}`);
        if (dropdown) dropdown.style.display = "none";
    },

    onRemovePickerChip: function (pickerKey, identifier) {
        if (!this.wallPickerState[pickerKey]) return;
        this.wallPickerState[pickerKey] = this.wallPickerState[pickerKey].filter(u => 
            String(u.id) !== String(identifier) && u.email !== identifier && u.title !== identifier
        );
        this.renderPickerChips(pickerKey);
        this.syncPickerHiddenInput(pickerKey);

        const input = document.getElementById(`picker-input-${pickerKey}`);
        if (input) {
            input.focus();
        }
    },

    renderPickerChips: function (pickerKey) {
        const container = document.getElementById(`chips-list-${pickerKey}`);
        if (!container) return;

        const users = this.wallPickerState[pickerKey] || [];
        const isFacilitator = pickerKey === "wall-facilitator";

        container.innerHTML = users.map(u => `
            <span class="pkgops-user-chip ${isFacilitator ? 'facilitator' : ''}" title="${this.escapeHtml(u.email || u.title)}">
                <span class="pkgops-user-avatar">${this.getInitials(u.title)}</span>
                <span>${this.escapeHtml(u.title)}</span>
                <button type="button" class="pkgops-user-chip-remove" onclick="PKGOPS_Checklist.onRemovePickerChip('${pickerKey}', '${u.id || u.email || u.title}')" title="Remove">&times;</button>
            </span>
        `).join("");

        const input = document.getElementById(`picker-input-${pickerKey}`);
        if (input) {
            if (isFacilitator && users.length > 0) {
                input.style.display = "none";
            } else {
                input.style.display = "inline-block";
                input.placeholder = isFacilitator ? "Search facilitator..." : (users.length === 0 ? "Type name or email to add member..." : "Add another member...");
            }
        }

        // Reset error highlight on box if valid
        const box = document.getElementById(`selected-chips-box-${pickerKey}`);
        if (box && users.length > 0) {
            box.style.borderColor = "#cbd5e1";
        }
    },

    syncPickerHiddenInput: function (pickerKey) {
        const hiddenInput = document.getElementById(pickerKey);
        if (!hiddenInput) return;

        const users = this.wallPickerState[pickerKey] || [];
        const emails = users.map(u => (u.email || u.title || "").trim()).filter(Boolean);
        hiddenInput.value = emails.join(", ");
    },

    populatePickerFromSavedValue: async function (pickerKey, rawValue) {
        if (!rawValue || typeof rawValue !== "string" || !rawValue.trim()) return;

        const employees = await PKGOPS_DAL.getEmployeeList();
        const parts = rawValue.split(/[,;]+/).map(p => p.trim()).filter(Boolean);

        const list = [];
        for (let part of parts) {
            const lowerPart = part.toLowerCase();
            let match = employees.find(e => e.email && e.email.toLowerCase() === lowerPart);
            if (!match) {
                match = employees.find(e => e.title && e.title.toLowerCase() === lowerPart);
            }
            if (match) {
                list.push({
                    id: match.id,
                    title: match.title,
                    email: match.email || match.title
                });
            } else {
                let friendlyName = part;
                if (part.includes("@")) {
                    friendlyName = part.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                }
                list.push({
                    id: part,
                    title: friendlyName,
                    email: part
                });
            }
        }

        this.wallPickerState[pickerKey] = list;
        this.renderPickerChips(pickerKey);
        this.syncPickerHiddenInput(pickerKey);
    },

    validateRatingInput: function (input) {
        if (!input) return;
        let val = input.value;
        if (val === "") {
            this.calculateOverallWallRating();
            return;
        }
        let num = parseFloat(val);
        if (isNaN(num)) {
            input.value = "5";
        } else if (num > 5) {
            input.value = "5";
        } else if (num < 0) {
            input.value = "1";
        }
        this.calculateOverallWallRating();
    },

    onRatingBlur: function (input) {
        if (!input) return;
        let val = input.value;
        let num = parseFloat(val);
        if (val === "" || isNaN(num) || num < 1) {
            input.value = "1";
        } else if (num > 5) {
            input.value = "5";
        }
        this.calculateOverallWallRating();
    },

    calculateOverallWallRating: function () {
        const clamp = (val) => {
            if (val === "" || val === null || val === undefined) return 5;
            const n = parseFloat(val);
            if (isNaN(n)) return 5;
            return Math.min(5, Math.max(1, n));
        };

        const appInput = document.getElementById("wall-rating-appearance");
        const sealInput = document.getElementById("wall-rating-sealing");
        const codInput = document.getElementById("wall-rating-coding");

        const app = appInput ? clamp(appInput.value) : 5;
        const seal = sealInput ? clamp(sealInput.value) : 5;
        const cod = codInput ? clamp(codInput.value) : 5;

        const avg = (app + seal + cod) / 3;
        const ratingSpan = document.getElementById("wall-overall-rating");
        if (ratingSpan) {
            ratingSpan.innerText = `${avg.toFixed(2)} / 5`;
            if (avg < 3) {
                ratingSpan.className = "text-danger fw-bold";
            } else if (avg < 4) {
                ratingSpan.className = "text-warning fw-bold";
            } else {
                ratingSpan.className = "text-primary fw-bold";
            }
        }
    },

    // Submit complete checklist
    submitChecklist: async function () {
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            alert("Access Denied: Only the assigned QA Executive can submit the checklist.");
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            }
            return;
        }

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            let hasDeviation = false;
            let categoryADefects = [];
            let targetTourRecord = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
                cr3ea_islineclear: true,
                cr3ea_status: "Completed",
                cr3ea_processstatus: "Completed"
            };

            if (this.pkgopsType === "Temperatures & Humidity") {
                PKGOPS_Validator.clearAll("checklist-container");
                const fields = [
                    { id: "th-pkglinetemp", name: "Packaging Line Temp" },
                    { id: "th-pkglinehumidity", name: "Packaging Line Humidity" },
                    { id: "th-coolingtunneltemp", name: "Cooling Tunnel Temp" },
                    { id: "th-creamroomtemp", name: "Cream Room Temp" },
                    { id: "th-coldstorage1temp", name: "Cold Storage 1 Temp" },
                    { id: "th-coldstorage2temp", name: "Cold Storage 2 Temp" },
                    { id: "th-flavourroomtemp", name: "Flavour Room Temp" },
                    { id: "th-dhroomhumidity", name: "DH Room Humidity" },
                    { id: "th-coldroom1temp", name: "Cold Room 1 Temp" },
                    { id: "th-coldroom2temp", name: "Cold Room 2 Temp" },
                    { id: "th-coldroom3temp", name: "Cold Room 3 Temp" },
                    { id: "th-deepfreezeryeasttemp", name: "Deep Freezer for Yeast" }
                ];

                for (let f of fields) {
                    const el = document.getElementById(f.id);
                    if (!el) continue;
                    const val = el.value.trim();
                    if (!val) {
                        PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please fill in the required field: ${f.name}`);
                        el.focus();
                        return;
                    }
                    const isNa = val.toUpperCase() === "NA" || val.toUpperCase() === "N/A";
                    const isNum = !isNaN(parseFloat(val)) && isFinite(val);
                    if (!isNa && !isNum) {
                        PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please enter a valid numeric value or 'NA' for: ${f.name}`);
                        el.focus();
                        return;
                    }
                }

                const record = {
                    cr3ea_name: `TempHumidity_${moment().format("DD-MM-YYYY")}`,
                    cr3ea_pkglinetemp: document.getElementById("th-pkglinetemp").value,
                    cr3ea_pkglinehumidity: document.getElementById("th-pkglinehumidity").value,
                    cr3ea_coolingtunneltemp: document.getElementById("th-coolingtunneltemp").value,
                    cr3ea_creamroomtemp: document.getElementById("th-creamroomtemp").value,
                    cr3ea_coldstorage1nbtemp: document.getElementById("th-coldstorage1temp").value,
                    cr3ea_coldstorage2nbtemp: document.getElementById("th-coldstorage2temp").value,
                    cr3ea_flavourroomtemp: document.getElementById("th-flavourroomtemp").value,
                    cr3ea_dhroomhumidity: document.getElementById("th-dhroomhumidity").value,
                    cr3ea_coldroom1obtemp: document.getElementById("th-coldroom1temp").value,
                    cr3ea_coldroom2obtemp: document.getElementById("th-coldroom2temp").value,
                    cr3ea_coldroom3obtemp: document.getElementById("th-coldroom3temp").value,
                    cr3ea_deepfreezeryeasttemp: document.getElementById("th-deepfreezeryeasttemp").value,
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_TEMP_HUMIDITY", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_TEMP_HUMIDITY", record);
            } 
            else if (this.pkgopsType === "Code Verification") {
                PKGOPS_Validator.clearAll("checklist-container");
                const headers = [
                    { id: "cv-product", name: "Product Name" },
                    { id: "cv-sku", name: "SKU" },
                    { id: "cv-batch", name: "Batch No" },
                    { id: "cv-pkd", name: "PKD" },
                    { id: "cv-expiry", name: "Expiry Date" }
                ];
                for (let h of headers) {
                    const el = document.getElementById(h.id);
                    if (!el || !el.value.trim()) {
                        if (el) PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please fill in the required header field: ${h.name}`);
                        if (el) el.focus();
                        return;
                    }
                }

                const pkdEl = document.getElementById("cv-pkd");
                const expEl = document.getElementById("cv-expiry");
                if (pkdEl && expEl) {
                    const pkdVal = new Date(pkdEl.value);
                    const expVal = new Date(expEl.value);
                    if (expVal < pkdVal) {
                        PKGOPS_Validator.highlight(expEl, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert("Expiry Date cannot be earlier than PKD (Packaging Date).");
                        expEl.focus();
                        return;
                    }
                }

                for (let i = 0; i < 10; i++) {
                    const statusEl = document.getElementById(`cv-status-${i}`);
                    if (!statusEl) continue;
                    if (statusEl.value === "Not Okay") {
                        const defectEl = document.getElementById(`cv-defect-${i}`);
                        const countEl = document.getElementById(`cv-count-${i}`);
                        const fileInput = document.getElementById(`cv-file-${i}`);

                        if (!defectEl || !defectEl.value) {
                            if (defectEl) PKGOPS_Validator.highlight(defectEl, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please select a defect category for Sample ${i + 1}.`);
                            if (defectEl) defectEl.focus();
                            return;
                        }

                        const countVal = parseInt(countEl.value) || 0;
                        if (!countEl || countVal < 1) {
                            if (countEl) PKGOPS_Validator.highlight(countEl, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please enter a defect count greater than 0 for Sample ${i + 1}.`);
                            if (countEl) countEl.focus();
                            return;
                        }

                        const files = this.uploadedFiles[`cv-${i}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                        const existingPrev = (this.savedCodeVerificationRows || []).find(r => r.cr3ea_samplenumber === `Sample ${i + 1}`);
                        const hasOldPhoto = existingPrev && existingPrev.cr3ea_codepictureurl;

                        if (files.length === 0 && !hasOldPhoto) {
                            if (fileInput) PKGOPS_Validator.highlight(fileInput, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please upload a proof image for defective Sample ${i + 1}.`);
                            if (fileInput) fileInput.focus();
                            return;
                        }
                    }
                }

                const product = document.getElementById("cv-product").value;
                const sku = document.getElementById("cv-sku").value;
                const batch = document.getElementById("cv-batch").value;
                const pkd = document.getElementById("cv-pkd").value;
                const expiry = document.getElementById("cv-expiry").value;

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_CODE_VERIFICATION", this.currentTourId);
                for (let i = 0; i < 10; i++) {
                    const status = document.getElementById(`cv-status-${i}`).value;
                    const defect = document.getElementById(`cv-defect-${i}`).value;
                    const count = parseInt(document.getElementById(`cv-count-${i}`).value) || 0;
                    const fileInput = document.getElementById(`cv-file-${i}`);

                    let pictureUrl = "";
                    const files = this.uploadedFiles[`cv-${i}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                    if (files.length > 0) {
                        const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, "Code Verification", `Sample-${i}`, defect));
                        const urls = await Promise.all(uploadPromises);
                        const validUrls = urls.filter(Boolean);
                        const existingPrev = (this.savedCodeVerificationRows || []).find(r => r.cr3ea_samplenumber === `Sample ${i + 1}`);
                        const existingUrl = (existingPrev && existingPrev.cr3ea_codepictureurl) ? existingPrev.cr3ea_codepictureurl.trim() : "";
                        if (existingUrl) {
                            pictureUrl = existingUrl + ", " + validUrls.join(", ");
                        } else {
                            pictureUrl = validUrls.join(", ");
                        }
                    } else {
                        const existingPrev = (this.savedCodeVerificationRows || []).find(r => r.cr3ea_samplenumber === `Sample ${i + 1}`);
                        if (existingPrev && existingPrev.cr3ea_codepictureurl) {
                            pictureUrl = existingPrev.cr3ea_codepictureurl;
                        }
                    }

                    if (status === "Not Okay") {
                        hasDeviation = true;
                    }

                    const cvRecord = {
                        cr3ea_name: `CodeVerification_${sku}`,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_batchno: batch,
                        cr3ea_pkd: pkd,
                        cr3ea_expirydate: expiry,
                        cr3ea_noofsamples: "10",
                        cr3ea_defecttype: status === "Not Okay" ? defect : "None",
                        cr3ea_defectcount: String(count),
                        cr3ea_codepictureurl: pictureUrl,
                        cr3ea_deviationstatus: status === "Not Okay" ? "Open" : "None",
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                    };
                    cvRecordsToSave.push(cvRecord);
                }

                // Batch upload Code Verification records in parallel waves
                const CHUNK_SIZE_CV = 5;
                for (let j = 0; j < cvRecordsToSave.length; j += CHUNK_SIZE_CV) {
                    const chunk = cvRecordsToSave.slice(j, j + CHUNK_SIZE_CV);
                    await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_CODE_VERIFICATION", rec)));
                }
            } 
            else if (this.pkgopsType === "PAPA") {
                PKGOPS_Validator.clearAll("checklist-container");
                const headers = [
                    { id: "papa-product", name: "Product Name" },
                    { id: "papa-sku", name: "SKU" },
                    { id: "papa-sample-size", name: "Sample Size" }
                ];
                for (let h of headers) {
                    const el = document.getElementById(h.id);
                    if (!el || !el.value.trim()) {
                        if (el) PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please fill in the required header field: ${h.name}`);
                        if (el) el.focus();
                        return;
                    }
                }

                const sampleSize = parseInt(document.getElementById("papa-sample-size").value) || 100;
                if (sampleSize < 1) {
                    const el = document.getElementById("papa-sample-size");
                    PKGOPS_Validator.highlight(el, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Sample size must be at least 1.");
                    el.focus();
                    return;
                }

                let sumCounts = 0;
                for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
                    const chk = document.getElementById(`papa-chk-${i}`);
                    if (!chk) continue;
                    if (chk.checked) {
                        const countEl = document.getElementById(`papa-count-${i}`);
                        const countVal = parseInt(countEl.value) || 0;
                        if (countVal < 1) {
                            PKGOPS_Validator.highlight(countEl, true);
                            if (typeof HideLoader === "function") HideLoader();
                            alert(`Please enter a defect count greater than 0 for checked defect: ${PKGOPS_PAPA_DEFECTS_FLAT[i].name}.`);
                            countEl.focus();
                            return;
                        }
                        sumCounts += countVal;
                    }
                }

                if (sumCounts > sampleSize) {
                    if (typeof HideLoader === "function") HideLoader();
                    alert(`Total defect counts (${sumCounts}) cannot exceed the sample size (${sampleSize}).`);
                    return;
                }

                const product = document.getElementById("papa-product").value;
                const sku = document.getElementById("papa-sku").value;

                let overallDefectCount = 0;
                categoryADefects = [];

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PAPA", this.currentTourId);
                const papaRecordsToSave = [];

                for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
                    const chk = document.getElementById(`papa-chk-${i}`);
                    if (!chk) continue;
                    const isChecked = chk.checked;
                    const count = parseInt(document.getElementById(`papa-count-${i}`).value) || 0;

                    if (isChecked && count > 0) {
                        hasDeviation = true;
                        overallDefectCount += count;

                        const defectItem = PKGOPS_PAPA_DEFECTS_FLAT[i];
                        if (defectItem.category === "Category A" || defectItem.category === "A") {
                            categoryADefects.push({
                                name: defectItem.name,
                                count: count,
                                remarks: `${product} (SKU: ${sku})`,
                                area: `PAPA (${defectItem.type || "Defect"})`
                            });
                        }

                        const papaRecord = {
                            cr3ea_name: `PAPA_${sku}`,
                            cr3ea_productname: product,
                            cr3ea_sku: sku,
                            cr3ea_noofsamples: String(sampleSize),
                            cr3ea_defecttype: `${defectItem.name} (${defectItem.category} - ${defectItem.type})`,
                            cr3ea_defectcount: String(count),
                            cr3ea_defectwisepercentage: `${((count / sampleSize) * 100).toFixed(2)}%`,
                            cr3ea_deviationstatus: "Open",
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                        };
                        papaRecordsToSave.push(papaRecord);
                    }
                }

                if (overallDefectCount > 0 || true) { // Always save overall summary or if overallDefectCount > 0
                    // Update overall score/percentage on parent or final PAPA row
                    const finalPapaRecord = {
                        cr3ea_name: `PAPA_Overall_${sku}`,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_noofsamples: String(sampleSize),
                        cr3ea_defecttype: "Overall Summary",
                        cr3ea_defectcount: String(overallDefectCount),
                        cr3ea_overalldefectpercentage: `${((overallDefectCount / sampleSize) * 100).toFixed(2)}%`,
                        cr3ea_deviationstatus: "None",
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                    };
                    papaRecordsToSave.push(finalPapaRecord);
                }

                // Batch upload PAPA records in parallel waves
                const CHUNK_SIZE_PAPA = 5;
                for (let k = 0; k < papaRecordsToSave.length; k += CHUNK_SIZE_PAPA) {
                    const chunk = papaRecordsToSave.slice(k, k + CHUNK_SIZE_PAPA);
                    await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_PAPA", rec)));
                }
            } 
            else if (this.pkgopsType === "PQI") {
                // Ensure all 5 are completed
                const uncompleted = Object.keys(this.pqiSubChecklistsFilled).filter(k => !this.pqiSubChecklistsFilled[k]);
                if (uncompleted.length > 0) {
                    alert(`Please complete and save all 5 evaluations first. Remaining: ${uncompleted.join(", ")}`);
                    if (typeof HideLoader === "function") HideLoader();
                    return;
                }

                // Check if any sample was Not Okay across evaluations
                const pqiRows = await PKGOPS_DAL.getSubChecklistRows("CHILD_PQI_EVALUATION", this.currentTourId);
                const pqiFails = pqiRows.some(r => r.cr3ea_sampleresult === "Not Okay");
                if (pqiFails) {
                    hasDeviation = true;
                }

                // Collect Category A defects from all 4 evaluation components (Product, Primary, Secondary, CBB - Net Weight is excluded as it has no Category A)
                categoryADefects = [];
                for (let r of pqiRows) {
                    if (r.cr3ea_sampleresult === "Not Okay") {
                        const cat = (r.cr3ea_defectcategory || "").trim();
                        if (cat === "Category A" || cat === "A") {
                            categoryADefects.push({
                                name: r.cr3ea_defectdetail || r.cr3ea_defectcategory || "Critical Defect",
                                count: 1,
                                remarks: `${r.cr3ea_productname || ""} (SKU: ${r.cr3ea_sku || ""}) - ${r.cr3ea_samplenumber || ""}`,
                                area: `PQI (${r.cr3ea_evaluationtype || "Evaluation"})`
                            });
                        }
                    }
                }
            } 
            else if (this.pkgopsType === "Seal Integrity") {
                PKGOPS_Validator.clearAll("checklist-container");
                const headers = [
                    { id: "seal-product", name: "Product Name" },
                    { id: "seal-sku", name: "SKU" },
                    { id: "seal-machine", name: "Machine No" },
                    { id: "seal-qty", name: "Sample Quantity" },
                    { id: "seal-leak-count", name: "Leakage Count" }
                ];
                for (let h of headers) {
                    const el = document.getElementById(h.id);
                    if (!el || el.value.trim() === "") {
                        if (el) PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please fill in the required field: ${h.name}`);
                        if (el) el.focus();
                        return;
                    }
                }

                const qtyEl = document.getElementById("seal-qty");
                const leakEl = document.getElementById("seal-leak-count");
                const qtyVal = parseInt(qtyEl.value) || 0;
                const leakVal = parseInt(leakEl.value) || 0;
                const typeEl = document.getElementById("seal-leak-type");
                const typeVal = typeEl.value;

                if (qtyVal < 1) {
                    PKGOPS_Validator.highlight(qtyEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Sample Quantity must be at least 1.");
                    qtyEl.focus();
                    return;
                }

                if (leakVal < 0) {
                    PKGOPS_Validator.highlight(leakEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Leakage Count cannot be negative.");
                    leakEl.focus();
                    return;
                }

                if (leakVal > qtyVal) {
                    PKGOPS_Validator.highlight(leakEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Leakage Count cannot exceed Sample Quantity.");
                    leakEl.focus();
                    return;
                }

                if (leakVal > 0 && typeVal === "None") {
                    PKGOPS_Validator.highlight(typeEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Please select a valid Leakage Type when Leakage Count is greater than 0.");
                    typeEl.focus();
                    return;
                }

                if (leakVal === 0 && typeVal !== "None") {
                    PKGOPS_Validator.highlight(typeEl, true);
                    if (typeof HideLoader === "function") HideLoader();
                    alert("Leakage Type must be 'None' when Leakage Count is 0.");
                    typeEl.focus();
                    return;
                }

                const product = document.getElementById("seal-product").value;
                const sku = document.getElementById("seal-sku").value;
                const machine = document.getElementById("seal-machine").value;
                const qty = document.getElementById("seal-qty").value;
                const leakage = parseInt(document.getElementById("seal-leak-count").value) || 0;
                const type = document.getElementById("seal-leak-type").value;

                if (leakage > 0) {
                    hasDeviation = true;
                }

                const sealRecord = {
                    cr3ea_name: `SealIntegrity_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_machineno: machine,
                    cr3ea_samplequantity: qty,
                    cr3ea_noofleakage: String(leakage),
                    cr3ea_leakagetype: type,
                    cr3ea_deviationstatus: leakage > 0 ? "Open" : "None",
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_SEAL_INTEGRITY", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_SEAL_INTEGRITY", sealRecord);
            } 
            else if (this.pkgopsType === "Cream Percentage") {
                // No table defined, we simulate it or save placeholders dynamically if they exist
                const product = document.getElementById("cream-product").value;
                const sku = document.getElementById("cream-sku").value;
                const reading = parseFloat(document.getElementById("cream-reading").value) || 0;
                const status = document.getElementById("cream-status").value;

                if (status === "Fail") {
                    hasDeviation = true;
                }
            } 
            else if (this.pkgopsType === "Quality Wall Records") {
                PKGOPS_Validator.clearAll("checklist-container");
                const headers = [
                    { id: "wall-product", name: "Product Name" },
                    { id: "wall-sku", name: "SKU" },
                    { id: "wall-facilitator", name: "Facilitator" },
                    { id: "wall-type", name: "Type of Quality Wall" },
                    { id: "wall-members", name: "Members Present" },
                    { id: "wall-rating-appearance", name: "Appearance Rating" },
                    { id: "wall-rating-sealing", name: "Sealing Quality Rating" },
                    { id: "wall-rating-coding", name: "Coding Rating" }
                ];
                for (let h of headers) {
                    const el = document.getElementById(h.id);
                    if (!el || !el.value.trim()) {
                        if (h.id === "wall-facilitator" || h.id === "wall-members") {
                            const box = document.getElementById(`selected-chips-box-${h.id}`);
                            if (box) box.style.borderColor = "#ef4444";
                            const input = document.getElementById(`picker-input-${h.id}`);
                            if (input) input.focus();
                        } else if (el) {
                            PKGOPS_Validator.highlight(el, true);
                            el.focus();
                        }
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`Please select or fill in the required field: ${h.name}`);
                        return;
                    }
                }

                const ratings = [
                    { id: "wall-rating-appearance", name: "Pack Appearance Rating" },
                    { id: "wall-rating-sealing", name: "Sealing Quality Rating" },
                    { id: "wall-rating-coding", name: "Coding Rating" }
                ];
                for (let r of ratings) {
                    const el = document.getElementById(r.id);
                    const val = parseFloat(el.value);
                    if (isNaN(val) || val < 1 || val > 5) {
                        PKGOPS_Validator.highlight(el, true);
                        if (typeof HideLoader === "function") HideLoader();
                        alert(`${r.name} score must be between 1 and 5.`);
                        el.focus();
                        return;
                    }
                }

                const product = document.getElementById("wall-product").value;
                const sku = document.getElementById("wall-sku").value;
                const facilitator = document.getElementById("wall-facilitator").value;
                const type = document.getElementById("wall-type").value;
                const members = document.getElementById("wall-members").value;
                const clamp = (v) => Math.min(5, Math.max(1, parseFloat(v) || 5));
                const app = clamp(document.getElementById("wall-rating-appearance").value);
                const seal = clamp(document.getElementById("wall-rating-sealing").value);
                const cod = clamp(document.getElementById("wall-rating-coding").value);
                const remarks = document.getElementById("wall-remarks").value;

                const ratingVal = ((app + seal + cod) / 3).toFixed(2);

                const wallRecord = {
                    cr3ea_name: `QualityWall_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_facilitator: facilitator,
                    cr3ea_typeofqualitywall: type,
                    cr3ea_memberspresent: members,
                    cr3ea_packappearancerating: String(app),
                    cr3ea_sealingqualityrating: String(seal),
                    cr3ea_codingrating: String(cod),
                    cr3ea_overallrating: String(ratingVal),
                    cr3ea_remarks: remarks,
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_QUALITY_WALL", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_QUALITY_WALL", wallRecord);
            }

            // If deviation is present, transition to Failed - Pending Production
            if (hasDeviation) {
                targetTourRecord.cr3ea_status = "Failed - Pending Production";
                targetTourRecord.cr3ea_processstatus = "Failed - Pending Production";
                targetTourRecord.cr3ea_islineclear = false;
            }

            console.log("Updating parent tour with final checklist state: ", targetTourRecord);
            await PKGOPS_DAL.saveTour(targetTourRecord);

            // Trigger notification
            if (typeof ALC_Notification !== "undefined") {
                try {
                    const score = hasDeviation ? 0 : 100;
                    const result = hasDeviation ? "Fail" : "Pass";
                    const isPass = !hasDeviation;
                    const activeConfigs = (typeof PKGOPS_StateMachine !== "undefined" && PKGOPS_StateMachine.configs) 
                        ? PKGOPS_StateMachine.configs 
                        : ((typeof PKGOPS_DAL !== "undefined" && PKGOPS_DAL.configs) ? PKGOPS_DAL.configs : []);

                    const mergedSession = {
                        ...PKGOPS_StateMachine.currentSession,
                        ...targetTourRecord,
                        cr3ea_pkgops_type: this.pkgopsType || (PKGOPS_StateMachine.currentSession && PKGOPS_StateMachine.currentSession.cr3ea_pkgops_type) || "Packaging Operations"
                    };

                    await ALC_Notification.sendVerificationComplete(
                        mergedSession,
                        score,
                        result,
                        isPass,
                        activeConfigs
                    );

                    // Send detailed Category A critical defect notification to Top Management (General)
                    if (categoryADefects.length > 0) {
                        try {
                            await ALC_Notification.sendCategoryAFailureNotification(
                                mergedSession,
                                categoryADefects,
                                {
                                    prefix: "PKGOPS_",
                                    parentType: "Packaging_Operations",
                                    type: this.pkgopsType || "Packaging Operations"
                                },
                                activeConfigs
                            );
                        } catch (catAErr) {
                            console.warn("Failed to dispatch Category A critical defect notification:", catAErr);
                        }
                    }
                } catch (notifErr) {
                    console.warn("ALC_Notification trigger failed (non-blocking):", notifErr);
                }
            }

            if (typeof HideLoader === "function") HideLoader();
            alert(hasDeviation ? "Defects identified. Session submitted to Production for Corrective Action." : "Checklist completed and saved successfully!");
            
            // Redirect to dashboard like in ALC
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            } else {
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = homeUrl;
            }
        } catch (e) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to submit checklist: ", e);
            const msg = (typeof QualityRajpura_Config !== 'undefined' && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(e, "submit Packaging Operations checklist")
                : ("Submission failed: " + (e.message || "Please check entries and try again."));
            alert(msg);
        }
    },

    pauseChecklist: async function () {
        if (typeof PKGOPS_StateMachine !== "undefined" && !PKGOPS_StateMachine.isQaUser) {
            alert("Access Denied: Only the assigned QA Executive can pause the checklist.");
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            }
            return;
        }

        if (typeof ShowLoader === "function") ShowLoader();

        try {
            if (this.pkgopsType === "Temperatures & Humidity") {
                const record = {
                    cr3ea_name: `TempHumidity_${moment().format("DD-MM-YYYY")}`,
                    cr3ea_pkglinetemp: document.getElementById("th-pkglinetemp")?.value || "",
                    cr3ea_pkglinehumidity: document.getElementById("th-pkglinehumidity")?.value || "",
                    cr3ea_coolingtunneltemp: document.getElementById("th-coolingtunneltemp")?.value || "",
                    cr3ea_creamroomtemp: document.getElementById("th-creamroomtemp")?.value || "",
                    cr3ea_coldstorage1nbtemp: document.getElementById("th-coldstorage1temp")?.value || "",
                    cr3ea_coldstorage2nbtemp: document.getElementById("th-coldstorage2temp")?.value || "",
                    cr3ea_flavourroomtemp: document.getElementById("th-flavourroomtemp")?.value || "",
                    cr3ea_dhroomhumidity: document.getElementById("th-dhroomhumidity")?.value || "",
                    cr3ea_coldroom1obtemp: document.getElementById("th-coldroom1temp")?.value || "",
                    cr3ea_coldroom2obtemp: document.getElementById("th-coldroom2temp")?.value || "",
                    cr3ea_coldroom3obtemp: document.getElementById("th-coldroom3temp")?.value || "",
                    cr3ea_deepfreezeryeasttemp: document.getElementById("th-deepfreezeryeasttemp")?.value || "",
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_TEMP_HUMIDITY", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_TEMP_HUMIDITY", record);
            } 
            else if (this.pkgopsType === "Code Verification") {
                const product = document.getElementById("cv-product")?.value || "";
                const sku = document.getElementById("cv-sku")?.value || "";
                const batch = document.getElementById("cv-batch")?.value || "";
                const pkd = document.getElementById("cv-pkd")?.value || null;
                const expiry = document.getElementById("cv-expiry")?.value || null;

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_CODE_VERIFICATION", this.currentTourId);
                const cvRecordsToSave = [];

                for (let i = 0; i < 10; i++) {
                    const status = document.getElementById(`cv-status-${i}`)?.value || "Okay";
                    const defect = document.getElementById(`cv-defect-${i}`)?.value || "";
                    const count = parseInt(document.getElementById(`cv-count-${i}`)?.value) || 0;
                    const fileInput = document.getElementById(`cv-file-${i}`);

                    let pictureUrl = "";
                    const files = this.uploadedFiles[`cv-${i}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                    if (files.length > 0) {
                        const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, "Code Verification", `Sample-${i}`, defect));
                        const urls = await Promise.all(uploadPromises);
                        const validUrls = urls.filter(Boolean);
                        const existingPrev = (this.savedCodeVerificationRows || []).find(r => r.cr3ea_samplenumber === `Sample ${i + 1}`);
                        const existingUrl = (existingPrev && existingPrev.cr3ea_codepictureurl) ? existingPrev.cr3ea_codepictureurl.trim() : "";
                        if (existingUrl) {
                            pictureUrl = existingUrl + ", " + validUrls.join(", ");
                        } else {
                            pictureUrl = validUrls.join(", ");
                        }
                    } else {
                        const existingPrev = (this.savedCodeVerificationRows || []).find(r => r.cr3ea_samplenumber === `Sample ${i + 1}`);
                        if (existingPrev && existingPrev.cr3ea_codepictureurl) {
                            pictureUrl = existingPrev.cr3ea_codepictureurl;
                        }
                    }

                    const cvRecord = {
                        cr3ea_name: `CodeVerification_${sku}`,
                        cr3ea_productname: product,
                        cr3ea_sku: sku,
                        cr3ea_batchno: batch,
                        cr3ea_noofsamples: "10",
                        cr3ea_defecttype: status === "Not Okay" ? defect : "None",
                        cr3ea_defectcount: String(count),
                        cr3ea_codepictureurl: pictureUrl,
                        cr3ea_deviationstatus: status === "Not Okay" ? "Open" : "None",
                        "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                    };
                    if (pkd) cvRecord.cr3ea_pkd = pkd;
                    if (expiry) cvRecord.cr3ea_expirydate = expiry;
                    cvRecordsToSave.push(cvRecord);
                }

                // Save in parallel chunks (waves of 6)
                for (let i = 0; i < cvRecordsToSave.length; i += 6) {
                    const chunk = cvRecordsToSave.slice(i, i + 6);
                    await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_CODE_VERIFICATION", rec)));
                }
            } 
            else if (this.pkgopsType === "PAPA") {
                const product = document.getElementById("papa-product")?.value || "";
                const sku = document.getElementById("papa-sku")?.value || "";
                const sampleSize = parseInt(document.getElementById("papa-sample-size")?.value) || 100;

                let overallDefectCount = 0;

                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PAPA", this.currentTourId);
                const draftPapaRecords = [];

                for (let i = 0; i < PKGOPS_PAPA_DEFECTS_FLAT.length; i++) {
                    const chk = document.getElementById(`papa-chk-${i}`);
                    if (!chk) continue;
                    const isChecked = chk.checked;
                    const count = parseInt(document.getElementById(`papa-count-${i}`)?.value) || 0;

                    if (isChecked && count > 0) {
                        overallDefectCount += count;

                        const papaRecord = {
                            cr3ea_name: `PAPA_${sku}`,
                            cr3ea_productname: product,
                            cr3ea_sku: sku,
                            cr3ea_noofsamples: String(sampleSize),
                            cr3ea_defecttype: `${PKGOPS_PAPA_DEFECTS_FLAT[i].name} (${PKGOPS_PAPA_DEFECTS_FLAT[i].category} - ${PKGOPS_PAPA_DEFECTS_FLAT[i].type})`,
                            cr3ea_defectcount: String(count),
                            cr3ea_defectwisepercentage: `${((count / sampleSize) * 100).toFixed(2)}%`,
                            cr3ea_deviationstatus: "Open",
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                        };
                        draftPapaRecords.push(papaRecord);
                    }
                }

                const finalPapaRecord = {
                    cr3ea_name: `PAPA_Overall_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_noofsamples: String(sampleSize),
                    cr3ea_defecttype: "Overall Summary",
                    cr3ea_defectcount: String(overallDefectCount),
                    cr3ea_overalldefectpercentage: `${((overallDefectCount / sampleSize) * 100).toFixed(2)}%`,
                    cr3ea_deviationstatus: "None",
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${this.currentTourId})`
                };
                draftPapaRecords.push(finalPapaRecord);

                const CHUNK_SIZE_DRAFT_PAPA = 5;
                for (let n = 0; n < draftPapaRecords.length; n += CHUNK_SIZE_DRAFT_PAPA) {
                    const chunk = draftPapaRecords.slice(n, n + CHUNK_SIZE_DRAFT_PAPA);
                    await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_PAPA", rec)));
                }
            } 
            else if (this.pkgopsType === "PQI") {
                const product = document.getElementById("pqi-product")?.value || "";
                const sku = document.getElementById("pqi-sku")?.value || "";
                const pkd = document.getElementById("pqi-pkd")?.value || null;
                const batch = document.getElementById("pqi-batch")?.value || "";
                const val = document.getElementById("pqi-sub-select")?.value || "NetWeight";

                if (val === "NetWeight") {
                    const standard = parseFloat(document.getElementById("pqi-nw-standard")?.value) || 0;

                    const weights = [];
                    let hasAnyWeight = false;
                    for (let i = 0; i < 15; i++) {
                        const weightInput = document.getElementById(`pqi-weight-${i}`);
                        const weightVal = weightInput ? parseFloat(weightInput.value) : NaN;
                        if (!isNaN(weightVal)) {
                            weights.push(weightVal);
                            if (weightVal > 0) hasAnyWeight = true;
                        } else {
                            weights.push(0);
                        }
                    }

                    if (product || sku || hasAnyWeight || standard > 0) {
                        const filledWeights = weights.filter(w => w > 0);
                        const avg = filledWeights.length > 0 ? (filledWeights.reduce((a, b) => a + b, 0) / filledWeights.length) : 0;
                        const giveAway = (standard > 0 && avg > standard && avg > 0) ? (avg - standard) : 0;
                        const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();

                        const netWeightRecord = {
                            cr3ea_name: `PQI_NetWeight_${sku || 'Draft'}_${moment().format("DD-MM-YYYY")}`,
                            cr3ea_productname: product,
                            cr3ea_sku: sku,
                            cr3ea_averageweight: Number(avg.toFixed(2)),
                            cr3ea_giveaway: Number(giveAway.toFixed(2)),
                            "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                        };

                        weights.forEach((w, idx) => {
                            netWeightRecord[`cr3ea_sampleweight${idx + 1}`] = Number(w.toFixed(2));
                        });

                        await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PQI_NET_WEIGHT", this.currentTourId);
                        await PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_NET_WEIGHT", netWeightRecord);
                        this.savedPqiNetWeight = { ...netWeightRecord, cr3ea_standardweight: standard };
                        this.pqiSubChecklistsFilled.NetWeight = true;
                        this.updatePqiBadges();
                    }
                } else {
                    let hasAnyData = !!(product || sku || pkd || batch);
                    for (let idx = 0; idx < 10; idx++) {
                        const status = document.getElementById(`pqi-eval-status-${idx}`)?.value || "Okay";
                        const cat = document.getElementById(`pqi-eval-cat-${idx}`)?.value || "";
                        const detail = document.getElementById(`pqi-eval-detail-${idx}`)?.value || "";
                        if (status === "Not Okay" || cat || detail) {
                            hasAnyData = true;
                            break;
                        }
                    }

                    if (hasAnyData) {
                        const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();
                        await PKGOPS_DAL.cleanSubChecklistRows("CHILD_PQI_EVALUATION", this.currentTourId, val);
                        const newEvalRows = [];
                        for (let idx = 0; idx < 10; idx++) {
                            const status = document.getElementById(`pqi-eval-status-${idx}`)?.value || "Okay";
                            const cat = document.getElementById(`pqi-eval-cat-${idx}`)?.value || "";
                            const detail = document.getElementById(`pqi-eval-detail-${idx}`)?.value || "";
                            const fileInput = document.getElementById(`pqi-eval-file-${idx}`);

                            let pictureUrl = "";
                            const files = this.uploadedFiles[`pqi-${idx}`] || (fileInput && fileInput.files && fileInput.files.length ? Array.from(fileInput.files) : []);
                            if (files.length > 0) {
                                const uploadPromises = files.map(file => PKGOPS_DAL.uploadAttachmentFile(file, this.currentTourId, `PQI_${val}`, `PQI-Sample-${idx}`, detail));
                                const urls = await Promise.all(uploadPromises);
                                const validUrls = urls.filter(Boolean);
                                const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === val && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                                const existingUrl = (existingPrev && existingPrev.cr3ea_batchcodepictureurl) ? existingPrev.cr3ea_batchcodepictureurl.trim() : "";
                                if (existingUrl) {
                                    pictureUrl = existingUrl + ", " + validUrls.join(", ");
                                } else {
                                    pictureUrl = validUrls.join(", ");
                                }
                            } else {
                                const existingPrev = (this.savedPqiEvaluations || []).find(r => r.cr3ea_evaluationtype === val && r.cr3ea_samplenumber === `Sample ${idx + 1}`);
                                if (existingPrev && existingPrev.cr3ea_batchcodepictureurl) {
                                    pictureUrl = existingPrev.cr3ea_batchcodepictureurl;
                                }
                            }

                            const evalRecord = {
                                cr3ea_name: `PQI_Evaluation_${val}_${sku || 'Draft'}`,
                                cr3ea_evaluationtype: val,
                                cr3ea_productname: product,
                                cr3ea_sku: sku,
                                cr3ea_batchcode: batch,
                                cr3ea_samplenumber: `Sample ${idx + 1}`,
                                cr3ea_sampleresult: status,
                                cr3ea_defectcategory: cat,
                                cr3ea_defectdetail: detail,
                                cr3ea_batchcodepictureurl: pictureUrl,
                                "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                            };
                            if (pkd) evalRecord.cr3ea_pkd = pkd;

                            newEvalRows.push(evalRecord);
                        }

                        const CHUNK_SIZE_DRAFT_PQI = 5;
                        for (let p = 0; p < newEvalRows.length; p += CHUNK_SIZE_DRAFT_PQI) {
                            const chunk = newEvalRows.slice(p, p + CHUNK_SIZE_DRAFT_PQI);
                            await Promise.all(chunk.map(rec => PKGOPS_DAL.saveSubChecklistRow("CHILD_PQI_EVALUATION", rec)));
                        }

                        this.savedPqiEvaluations = (this.savedPqiEvaluations || []).filter(r => r.cr3ea_evaluationtype !== val).concat(newEvalRows);
                        this.pqiSubChecklistsFilled[val] = true;
                        this.updatePqiBadges();
                    }
                }
            }
            else if (this.pkgopsType === "Seal Integrity") {
                const product = document.getElementById("seal-product")?.value || "";
                const sku = document.getElementById("seal-sku")?.value || "";
                const machine = document.getElementById("seal-machine")?.value || "";
                const qty = document.getElementById("seal-qty")?.value || "";
                const leakage = parseInt(document.getElementById("seal-leak-count")?.value) || 0;
                const type = document.getElementById("seal-leak-type")?.value || "None";
                const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();

                const sealRecord = {
                    cr3ea_name: `SealIntegrity_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_machineno: machine,
                    cr3ea_samplequantity: qty,
                    cr3ea_noofleakage: String(leakage),
                    cr3ea_leakagetype: type,
                    cr3ea_deviationstatus: leakage > 0 ? "Open" : "None",
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_SEAL_INTEGRITY", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_SEAL_INTEGRITY", sealRecord);
            } 
            else if (this.pkgopsType === "Quality Wall Records") {
                const product = document.getElementById("wall-product")?.value || "";
                const sku = document.getElementById("wall-sku")?.value || "";
                const facilitator = document.getElementById("wall-facilitator")?.value || "";
                const type = document.getElementById("wall-type")?.value || "";
                const members = document.getElementById("wall-members")?.value || "";
                const clamp = (v) => Math.min(5, Math.max(1, parseFloat(v) || 5));
                const app = clamp(document.getElementById("wall-rating-appearance")?.value);
                const seal = clamp(document.getElementById("wall-rating-sealing")?.value);
                const cod = clamp(document.getElementById("wall-rating-coding")?.value);
                const remarks = document.getElementById("wall-remarks")?.value || "";
                const cleanTourId = String(this.currentTourId).replace(/[{}]/g, "").trim().toLowerCase();

                const ratingVal = ((app + seal + cod) / 3).toFixed(2);

                const wallRecord = {
                    cr3ea_name: `QualityWall_${sku}`,
                    cr3ea_productname: product,
                    cr3ea_sku: sku,
                    cr3ea_facilitator: facilitator,
                    cr3ea_typeofqualitywall: type,
                    cr3ea_memberspresent: members,
                    cr3ea_packappearancerating: String(app),
                    cr3ea_sealingqualityrating: String(seal),
                    cr3ea_codingrating: String(cod),
                    cr3ea_overallrating: String(ratingVal),
                    cr3ea_remarks: remarks,
                    "cr3ea_qualitytourid@odata.bind": `/${QualityRajpura_Config.DATAVERSE_TABLES.PARENT_TOUR}(${cleanTourId})`
                };
                await PKGOPS_DAL.cleanSubChecklistRows("CHILD_QUALITY_WALL", this.currentTourId);
                await PKGOPS_DAL.saveSubChecklistRow("CHILD_QUALITY_WALL", wallRecord);
            }

            // Save parent status to QA In Progress to keep it active
            let targetTourRecord = {
                cr3ea_prod_rajpura_quality_tourid: this.currentTourId,
                cr3ea_status: "QA In Progress",
                cr3ea_processstatus: "QA In Progress"
            };
            await PKGOPS_DAL.saveTour(targetTourRecord);

            if (typeof HideLoader === "function") HideLoader();
            alert("Tour progress paused and saved successfully.");
            
            // Redirect to dashboard like in ALC
            if (typeof PKGOPS_Main !== "undefined" && typeof PKGOPS_Main.redirectToDashboard === "function") {
                PKGOPS_Main.redirectToDashboard();
            } else {
                const homeUrl = (typeof _spPageContextInfo !== 'undefined' && _spPageContextInfo.webAbsoluteUrl)
                    ? `${_spPageContextInfo.webAbsoluteUrl}/Pages/Home.aspx`
                    : (typeof QualityRajpura_Config !== 'undefined' ? QualityRajpura_Config.getSiteBaseUrl() : "/sites/Mrs_Bectors_PTMS") + "/Pages/Home.aspx";
                window.location.href = homeUrl;
            }
        } catch (e) {
            if (typeof HideLoader === "function") HideLoader();
            console.error("Failed to pause tour: ", e);
            const msg = (typeof QualityRajpura_Config !== "undefined" && QualityRajpura_Config.formatDataverseError)
                ? QualityRajpura_Config.formatDataverseError(e, "pause tour")
                : `Failed to pause tour: ${e.message || e}`;
            alert(msg);
        }
    },

    loadSavedValues: async function () {
        try {
            if (this.pkgopsType === "Temperatures & Humidity") {
                const rows = await PKGOPS_DAL.getSubChecklistRows("CHILD_TEMP_HUMIDITY", this.currentTourId);
                if (rows && rows.length > 0) {
                    const row = rows[0];
                    if (document.getElementById("th-pkglinetemp")) document.getElementById("th-pkglinetemp").value = row.cr3ea_pkglinetemp || "";
                    if (document.getElementById("th-pkglinehumidity")) document.getElementById("th-pkglinehumidity").value = row.cr3ea_pkglinehumidity || "";
                    if (document.getElementById("th-coolingtunneltemp")) document.getElementById("th-coolingtunneltemp").value = row.cr3ea_coolingtunneltemp || "";
                    if (document.getElementById("th-creamroomtemp")) document.getElementById("th-creamroomtemp").value = row.cr3ea_creamroomtemp || "";
                    if (document.getElementById("th-coldstorage1temp")) document.getElementById("th-coldstorage1temp").value = row.cr3ea_coldstorage1nbtemp || "";
                    if (document.getElementById("th-coldstorage2temp")) document.getElementById("th-coldstorage2temp").value = row.cr3ea_coldstorage2nbtemp || "";
                    if (document.getElementById("th-flavourroomtemp")) document.getElementById("th-flavourroomtemp").value = row.cr3ea_flavourroomtemp || "";
                    if (document.getElementById("th-dhroomhumidity")) document.getElementById("th-dhroomhumidity").value = row.cr3ea_dhroomhumidity || "";
                    if (document.getElementById("th-coldroom1temp")) document.getElementById("th-coldroom1temp").value = row.cr3ea_coldroom1obtemp || "";
                    if (document.getElementById("th-coldroom2temp")) document.getElementById("th-coldroom2temp").value = row.cr3ea_coldroom2obtemp || "";
                    if (document.getElementById("th-coldroom3temp")) document.getElementById("th-coldroom3temp").value = row.cr3ea_coldroom3obtemp || "";
                    if (document.getElementById("th-deepfreezeryeasttemp")) document.getElementById("th-deepfreezeryeasttemp").value = row.cr3ea_deepfreezeryeasttemp || "";
                }
            } 
            else if (this.pkgopsType === "Code Verification") {
                const rows = await PKGOPS_DAL.getSubChecklistRows("CHILD_CODE_VERIFICATION", this.currentTourId);
                if (rows && rows.length > 0) {
                    this.savedCodeVerificationRows = rows;
                    const firstRow = rows[0];
                    if (document.getElementById("cv-product")) this.setProductWithCategory("cv", firstRow.cr3ea_productname);
                    if (document.getElementById("cv-sku")) this.setSelectValueSafely("cv-sku", firstRow.cr3ea_sku);
                    if (document.getElementById("cv-batch")) document.getElementById("cv-batch").value = firstRow.cr3ea_batchno || "";
                    if (document.getElementById("cv-pkd") && firstRow.cr3ea_pkd) {
                        document.getElementById("cv-pkd").value = moment(firstRow.cr3ea_pkd).format("YYYY-MM-DD");
                    }
                    if (document.getElementById("cv-expiry") && firstRow.cr3ea_expirydate) {
                        document.getElementById("cv-expiry").value = moment(firstRow.cr3ea_expirydate).format("YYYY-MM-DD");
                    }

                    rows.forEach((row, i) => {
                        if (i < 10) {
                            const status = row.cr3ea_defecttype && row.cr3ea_defecttype !== "None" ? "Not Okay" : "Okay";
                            const statusSelect = document.getElementById(`cv-status-${i}`);
                            if (statusSelect) {
                                statusSelect.value = status;
                                PKGOPS_Checklist.toggleCvDefectFields(i);
                            }
                            if (status === "Not Okay") {
                                const defectSelect = document.getElementById(`cv-defect-${i}`);
                                if (defectSelect) defectSelect.value = row.cr3ea_defecttype || "";
                                const countInput = document.getElementById(`cv-count-${i}`);
                                if (countInput) countInput.value = row.cr3ea_defectcount || "";

                                const savedUrls = (row.cr3ea_codepictureurl || "").split(",").map(u => u.trim()).filter(Boolean);
                                if (savedUrls.length > 0) {
                                    const fileStatus = document.getElementById(`file-status-cv-${i}`);
                                    const fileInput = document.getElementById(`cv-file-${i}`);
                                    if (fileInput) {
                                        const tr = fileInput.closest("tr");
                                        if (tr) tr.setAttribute("data-existing-files", "true");
                                    }
                                    if (fileStatus) {
                                        let linksHtml = `<div class="pkgops-saved-file-links-container">`;
                                        savedUrls.forEach((u, uIdx) => {
                                            const fileName = u.substring(u.lastIndexOf("/") + 1) || `Photo ${uIdx + 1}`;
                                            linksHtml += `<a href="${u}" target="_blank" class="pkgops-saved-file-link"><i class="fa fa-paperclip"></i> ${fileName}</a>`;
                                        });
                                        linksHtml += `</div>`;
                                        fileStatus.innerHTML = linksHtml;
                                    }
                                }
                            }
                        }
                    });
                }
            } 
            else if (this.pkgopsType === "PAPA") {
                const rows = await PKGOPS_DAL.getSubChecklistRows("CHILD_PAPA", this.currentTourId);
                if (rows && rows.length > 0) {
                    const firstRow = rows.find(r => r.cr3ea_defecttype === "Overall Summary") || rows[0];
                    if (document.getElementById("papa-product")) this.setProductWithCategory("papa", firstRow.cr3ea_productname);
                    if (document.getElementById("papa-sku")) this.setSelectValueSafely("papa-sku", firstRow.cr3ea_sku);
                    if (document.getElementById("papa-sample-size")) document.getElementById("papa-sample-size").value = firstRow.cr3ea_noofsamples || "100";

                    rows.forEach(row => {
                        if (row.cr3ea_defecttype && row.cr3ea_defecttype !== "Overall Summary") {
                            const rawDefect = row.cr3ea_defecttype;
                            const idxBracket = rawDefect.lastIndexOf(" (");
                            const cleanName = idxBracket !== -1 ? rawDefect.substring(0, idxBracket).trim() : rawDefect.trim();

                            const matches = rawDefect.match(/\((A|B|C)\s*-\s*(Product|Pack)\)/i);
                            const category = matches ? matches[1].toUpperCase() : null;
                            const type = matches ? matches[2] : null;

                            const flatIdx = PKGOPS_PAPA_DEFECTS_FLAT.findIndex(d => 
                                d.name.trim().toLowerCase() === cleanName.toLowerCase() &&
                                (!category || d.category === category) &&
                                (!type || d.type.toLowerCase() === type.toLowerCase())
                            );

                            if (flatIdx !== -1) {
                                const chk = document.getElementById(`papa-chk-${flatIdx}`);
                                if (chk) {
                                    chk.checked = true;
                                    PKGOPS_Checklist.togglePapaDefect(flatIdx);
                                }
                                const countInput = document.getElementById(`papa-count-${flatIdx}`);
                                if (countInput) countInput.value = row.cr3ea_defectcount || "0";
                            }
                        }
                    });
                    PKGOPS_Checklist.calculatePapaPercentages();
                }
            } 
            else if (this.pkgopsType === "PQI") {
                // High-performance parallel fetch for Net Weight and Evaluation records
                const [nwRows, evalRows] = await Promise.all([
                    PKGOPS_DAL.getSubChecklistRows("CHILD_PQI_NET_WEIGHT", this.currentTourId),
                    PKGOPS_DAL.getSubChecklistRows("CHILD_PQI_EVALUATION", this.currentTourId)
                ]);

                if (nwRows && nwRows.length > 0) {
                    const row = nwRows[0];
                    this.savedPqiNetWeight = row;
                    this.pqiSubChecklistsFilled.NetWeight = true;
                }

                if (evalRows && evalRows.length > 0) {
                    this.savedPqiEvaluations = evalRows;
                    const types = ["Product", "Primary", "Secondary", "CBB"];
                    types.forEach(t => {
                        const hasType = evalRows.some(r => r.cr3ea_evaluationtype === t);
                        if (hasType) {
                            this.pqiSubChecklistsFilled[t] = true;
                        }
                    });
                }

                this.updatePqiBadges();
                this.populateActivePqiSubForm();
            } 
            else if (this.pkgopsType === "Seal Integrity") {
                const rows = await PKGOPS_DAL.getSubChecklistRows("CHILD_SEAL_INTEGRITY", this.currentTourId);
                if (rows && rows.length > 0) {
                    const row = rows[0];
                    if (document.getElementById("seal-product")) this.setProductWithCategory("seal", row.cr3ea_productname);
                    if (document.getElementById("seal-sku")) this.setSelectValueSafely("seal-sku", row.cr3ea_sku);
                    if (document.getElementById("seal-machine")) document.getElementById("seal-machine").value = row.cr3ea_machineno || "";
                    if (document.getElementById("seal-qty")) document.getElementById("seal-qty").value = row.cr3ea_samplequantity || "10";
                    if (document.getElementById("seal-leak-count")) document.getElementById("seal-leak-count").value = row.cr3ea_noofleakage || "0";
                    if (document.getElementById("seal-leak-type")) document.getElementById("seal-leak-type").value = row.cr3ea_leakagetype || "None";
                }
            } 
            else if (this.pkgopsType === "Quality Wall Records") {
                const rows = await PKGOPS_DAL.getSubChecklistRows("CHILD_QUALITY_WALL", this.currentTourId);
                if (rows && rows.length > 0) {
                    const row = rows[0];
                    if (document.getElementById("wall-product")) this.setProductWithCategory("wall", row.cr3ea_productname);
                    if (document.getElementById("wall-sku")) this.setSelectValueSafely("wall-sku", row.cr3ea_sku);
                    await Promise.all([
                        row.cr3ea_facilitator ? this.populatePickerFromSavedValue("wall-facilitator", row.cr3ea_facilitator) : Promise.resolve(),
                        row.cr3ea_memberspresent ? this.populatePickerFromSavedValue("wall-members", row.cr3ea_memberspresent) : Promise.resolve()
                    ]);
                    if (document.getElementById("wall-type")) document.getElementById("wall-type").value = row.cr3ea_typeofqualitywall || "";
                    if (document.getElementById("wall-rating-appearance")) document.getElementById("wall-rating-appearance").value = row.cr3ea_packappearancerating || "5";
                    if (document.getElementById("wall-rating-sealing")) document.getElementById("wall-rating-sealing").value = row.cr3ea_sealingqualityrating || "5";
                    if (document.getElementById("wall-rating-coding")) document.getElementById("wall-rating-coding").value = row.cr3ea_codingrating || "5";
                    if (document.getElementById("wall-remarks")) document.getElementById("wall-remarks").value = row.cr3ea_remarks || "";
                    PKGOPS_Checklist.calculateOverallWallRating();
                }
            }
        } catch (e) {
            console.error("loadSavedValues failed: ", e);
        }
    },

    populatePqiCommonFields: function () {
        const prodEl = document.getElementById("pqi-product");
        if (!prodEl) return;

        const nw = this.savedPqiNetWeight;
        const evals = this.savedPqiEvaluations || [];
        const firstEval = evals.length > 0 ? evals[0] : null;

        const savedProd = (nw && nw.cr3ea_productname) || (firstEval && firstEval.cr3ea_productname) || "";
        const savedSku = (nw && nw.cr3ea_sku) || (firstEval && firstEval.cr3ea_sku) || "";
        const savedPkd = (firstEval && firstEval.cr3ea_pkd) || "";
        const savedBatch = (firstEval && firstEval.cr3ea_batchcode) || "";

        if (savedProd && !prodEl.value) {
            this.setProductWithCategory("pqi", savedProd);
        }
        if (savedSku && document.getElementById("pqi-sku") && !document.getElementById("pqi-sku").value) {
            this.setSelectValueSafely("pqi-sku", savedSku);
        }
        if (savedPkd && document.getElementById("pqi-pkd") && !document.getElementById("pqi-pkd").value) {
            document.getElementById("pqi-pkd").value = moment(savedPkd).format("YYYY-MM-DD");
        }
        if (savedBatch && document.getElementById("pqi-batch") && !document.getElementById("pqi-batch").value) {
            document.getElementById("pqi-batch").value = savedBatch;
        }
    },

    populateActivePqiSubForm: function () {
        this.populatePqiCommonFields();
        const select = document.getElementById("pqi-sub-select");
        if (!select) return;
        const val = select.value;

        if (val === "NetWeight") {
            const row = this.savedPqiNetWeight;
            let std = row ? row.cr3ea_standardweight : null;
            if (!std) {
                const currentSku = document.getElementById("pqi-sku")?.value || (row && row.cr3ea_sku);
                if (currentSku) {
                    const skuNum = parseFloat(String(currentSku).replace(/[^0-9.]/g, ""));
                    if (!isNaN(skuNum) && skuNum > 0) std = skuNum;
                }
            }
            if (document.getElementById("pqi-nw-standard")) {
                document.getElementById("pqi-nw-standard").value = std || "150";
            }

            if (row) {
                for (let i = 0; i < 15; i++) {
                    const weightEl = document.getElementById(`pqi-weight-${i}`);
                    if (weightEl) {
                        const valWeight = row[`cr3ea_sampleweight${i + 1}`];
                        weightEl.value = (valWeight !== null && valWeight !== undefined && valWeight !== "" && valWeight !== 0) ? valWeight : (valWeight === 0 ? "0" : "");
                    }
                }
                PKGOPS_Checklist.calculateNetWeightMetrics();
            }
        } else {
            const rows = this.savedPqiEvaluations;
            if (rows && rows.length > 0) {
                const subRows = rows.filter(r => r.cr3ea_evaluationtype === val);
                if (subRows.length > 0) {
                    subRows.forEach((row, i) => {
                        if (i < 10) {
                            const statusSelect = document.getElementById(`pqi-eval-status-${i}`);
                            if (statusSelect) {
                                statusSelect.value = row.cr3ea_sampleresult || "Okay";
                                PKGOPS_Checklist.togglePqiDefectFields(i);
                            }
                            const catSelect = document.getElementById(`pqi-eval-cat-${i}`);
                            if (catSelect && row.cr3ea_defectcategory) {
                                let catVal = row.cr3ea_defectcategory;
                                if (catVal === "A") catVal = "Category A";
                                if (catVal === "B") catVal = "Category B";
                                if (catVal === "C") catVal = "Category C";
                                catSelect.value = catVal;
                                PKGOPS_Checklist.onPqiDefectCatChange(i, row.cr3ea_defectdetail || "");
                            }

                            const savedUrls = (row.cr3ea_batchcodepictureurl || "").split(",").map(u => u.trim()).filter(Boolean);
                            if (savedUrls.length > 0) {
                                const fileStatus = document.getElementById(`file-status-pqi-${i}`);
                                const fileInput = document.getElementById(`pqi-eval-file-${i}`);
                                if (fileInput) {
                                    const tr = fileInput.closest("tr");
                                    if (tr) tr.setAttribute("data-existing-files", "true");
                                }
                                if (fileStatus) {
                                    let linksHtml = `<div class="pkgops-saved-file-links-container">`;
                                    savedUrls.forEach((u, uIdx) => {
                                        const fileName = u.substring(u.lastIndexOf("/") + 1) || `Photo ${uIdx + 1}`;
                                        linksHtml += `<a href="${u}" target="_blank" class="pkgops-saved-file-link"><i class="fa fa-paperclip"></i> ${fileName}</a>`;
                                    });
                                    linksHtml += `</div>`;
                                    fileStatus.innerHTML = linksHtml;
                                }
                            }
                        }
                    });
                    PKGOPS_Checklist.calculatePqiEvaluationMetrics();
                }
            }
        }
    }
};
