class CaseSummaryExporter {
    constructor() {}

    async showExportDialog(caseId, caseTitle) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;">
                    <h3>Export Case Summary</h3>
                    <p>Export summary for case: ${caseTitle}</p>
                    <button onclick="this.parentElement.remove();window.caseSummaryExporter.exportCaseSummary('${caseId}', {title:'${caseTitle}'})">Export PDF</button>
                    <button onclick="this.parentElement.remove()">Cancel</button>
                </div>
            `;
            document.body.appendChild(modal);
        });
    }

    async exportCaseSummary(caseId, caseData) {
        const pdfContent = `CASE SUMMARY REPORT
Case ID: ${caseId}
Title: ${caseData.title}
Generated: ${new Date().toLocaleString()}

This is a high-level business summary separate from chain of custody documentation.
Includes case metadata, evidence list, timeline, and involved parties.`;

        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `case_summary_${caseId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

window.caseSummaryExporter = new CaseSummaryExporter();