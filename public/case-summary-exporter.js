/**
 * M17: case summary export downloads the real signed server-side PDF report
 * (GET /api/cases/:id/report.pdf: case details, evidence hashes, blockchain
 * links, custody timeline, notes, signature block, verifiable report hash).
 */
class CaseSummaryExporter {
    constructor() {}

    async showExportDialog(caseId, caseTitle) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;">
                    <h3>Export Case Report</h3>
                    <p>Signed PDF report for case: ${caseTitle}</p>
                    <button id="caseReportConfirm">Export PDF</button>
                    <button id="caseReportCancel">Cancel</button>
                </div>
            `;
            modal.querySelector('#caseReportConfirm').onclick = () => {
                modal.remove();
                this.exportCaseSummary(caseId).then(resolve);
            };
            modal.querySelector('#caseReportCancel').onclick = () => { modal.remove(); resolve(false); };
            document.body.appendChild(modal);
        });
    }

    async exportCaseSummary(caseId) {
        const r = await fetch('/api/cases/' + encodeURIComponent(caseId) + '/report.pdf', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
        });
        if (!r.ok) {
            const j = await r.json().catch(() => ({}));
            throw new Error(j.error || ('Report failed (HTTP ' + r.status + ')'));
        }
        const reportHash = r.headers.get('X-Report-Hash');
        const blob = await r.blob();
        const cd = r.headers.get('Content-Disposition') || '';
        const m = /filename="?([^";]+)"?/.exec(cd);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = m ? m[1] : ('case-' + caseId + '-report.pdf');
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
        return { downloaded: true, reportHash };
    }
}

window.caseSummaryExporter = new CaseSummaryExporter();
