// Evidence Preview System for EVID-DGC
class EvidencePreview {
    constructor() {
        this.currentEvidence = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'evidence-modal';
        this.modal.innerHTML = `
            <div class="evidence-modal-content">
                <div class="evidence-modal-header">
                    <h3 id="evidence-title">Evidence Preview</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="evidence-modal-body">
                    <div id="evidence-viewer"></div>
                    <div class="evidence-info">
                        <div class="evidence-metadata"></div>
                        <div class="evidence-actions">
                            <button class="btn-download">Download</button>
                            <button class="btn-verify">Verify Hash</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    bindEvents() {
        this.modal.querySelector('.close-btn').onclick = () => this.close();
        this.modal.onclick = (e) => {
            if (e.target === this.modal) this.close();
        };
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    async show(evidenceId) {
        try {
            const evidence = await this.fetchEvidence(evidenceId);
            this.currentEvidence = evidence;
            this.renderPreview(evidence);
            this.modal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading evidence:', error);
            alert('Failed to load evidence preview');
        }
    }

    async fetchEvidence(evidenceId) {
        const response = await fetch(`/api/evidence/${evidenceId}`);
        if (!response.ok) throw new Error('Failed to fetch evidence');
        return response.json();
    }

    renderPreview(evidence) {
        const viewer = this.modal.querySelector('#evidence-viewer');
        const title = this.modal.querySelector('#evidence-title');
        const metadata = this.modal.querySelector('.evidence-metadata');

        title.textContent = evidence.title;
        
        // Render based on file type
        if (evidence.type.startsWith('image/')) {
            viewer.innerHTML = `<img src="${evidence.file_data}" alt="${evidence.title}" style="max-width: 100%; height: auto;">`;
        } else if (evidence.type === 'application/pdf') {
            viewer.innerHTML = `<iframe src="${evidence.file_data}" width="100%" height="500px"></iframe>`;
        } else if (evidence.type.startsWith('video/')) {
            viewer.innerHTML = `<video controls style="max-width: 100%;"><source src="${evidence.file_data}" type="${evidence.type}"></video>`;
        } else {
            viewer.innerHTML = `<div class="file-preview"><p>File: ${evidence.file_name}</p><p>Type: ${evidence.type}</p><p>Size: ${this.formatFileSize(evidence.file_size)}</p></div>`;
        }

        // Render metadata
        metadata.innerHTML = `
            <div class="metadata-item"><strong>Case ID:</strong> ${evidence.case_id}</div>
            <div class="metadata-item"><strong>Submitted by:</strong> ${evidence.submitted_by}</div>
            <div class="metadata-item"><strong>Date:</strong> ${new Date(evidence.timestamp).toLocaleString()}</div>
            <div class="metadata-item"><strong>Hash:</strong> <code>${evidence.hash}</code></div>
            <div class="metadata-item"><strong>Status:</strong> <span class="status-${evidence.status}">${evidence.status}</span></div>
        `;

        this.bindActionEvents(evidence);
    }

    bindActionEvents(evidence) {
        const downloadBtn = this.modal.querySelector('.btn-download');
        const verifyBtn = this.modal.querySelector('.btn-verify');

        downloadBtn.onclick = () => this.downloadEvidence(evidence);
        verifyBtn.onclick = () => this.verifyHash(evidence);
    }

    downloadEvidence(evidence) {
        const link = document.createElement('a');
        link.href = evidence.file_data;
        link.download = evidence.file_name;
        link.click();
    }

    async verifyHash(evidence) {
        try {
            const response = await fetch(`/api/evidence/${evidence.id}/verify`);
            const result = await response.json();
            
            if (result.valid) {
                alert('✅ Hash verification successful - Evidence integrity confirmed');
            } else {
                alert('❌ Hash verification failed - Evidence may have been tampered with');
            }
        } catch (error) {
            console.error('Hash verification error:', error);
            alert('Failed to verify hash');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    close() {
        this.modal.style.display = 'none';
        this.currentEvidence = null;
    }
}

// Initialize preview system
const evidencePreview = new EvidencePreview();

// Add preview buttons to evidence items
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.evidence-item').forEach(item => {
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn-preview';
        previewBtn.textContent = 'Preview';
        previewBtn.onclick = () => {
            const evidenceId = item.dataset.evidenceId;
            evidencePreview.show(evidenceId);
        };
        item.appendChild(previewBtn);
    });
});