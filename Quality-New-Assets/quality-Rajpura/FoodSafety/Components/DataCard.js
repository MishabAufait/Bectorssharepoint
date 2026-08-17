// Reusable Data Card Component
console.log("DataCard Component loaded");

const DataCardComponent = {
    // Generate card container with title
    createCard: function (cardTitle, bodyHtml) {
        return `
            <div class="bs-card" style="margin-bottom: 20px;">
                <div class="bs-card-header" style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 20px;">
                    <h4 class="bs-card-title" style="margin: 0; font-weight: 600; font-size: 15px; color: #1e293b;">${cardTitle}</h4>
                </div>
                <div class="bs-card-body" style="padding: 20px;">
                    ${bodyHtml}
                </div>
            </div>
        `;
    },

    // Create a styled table within a card
    createTableCard: function (cardTitle, headers, rowsHtml) {
        const headerCols = headers.map(h => `<th style="${h.style || ''}">${h.text}</th>`).join("");
        const tableHtml = `
            <div class="table-responsive" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="bs-table" style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            ${headerCols}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
        return this.createCard(cardTitle, tableHtml);
    }
};
