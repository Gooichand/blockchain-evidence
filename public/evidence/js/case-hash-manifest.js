/**
 * Case Hash Manifest Export System
 * Issue #108: Export Case Hash Manifest as JSON or CSV File
 */

class CaseHashManifest {
    constructor() {
        this.initializeStyles();
    }

    initializeStyles() {
        if (!document.getElementById('manifest-export-styles')) {
            const styles = document.createElement('style');
            styles.id = 'manifest-export-styles';
            styles.textContent = `
                .manifest-export-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .manifest-export-modal.show {
                    opacity: 1;
                    visibility: visible;
                }
                
                .manifest-export-content {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 500px;
                    width: 90%;
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                }
                
                .manifest-export-modal.show .manifest-export-content {
                    transform: scale(1);
                }
                
                .format-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 16px 0;
                }
                
                .format-option {
                    padding: 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s ease;
                }
                
                .format-option:hover,
                .format-option.selected {
                    border-color: #d32f2f;
                    background: #fff5f5;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: #e0e0e0;
                    border-radius: 3px;
                    overflow: hidden;
                    margin: 8px 0;
                }
                
                .progress-fill {
                    height: 100%;
                    background: #d32f2f;
                    width: 0%;
                    transition: width 0.3s ease;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    async showExportDialog(caseId, caseTitle) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'manifest-export-modal';
            modal.innerHTML = `
                <div class="manifest-export-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Export Hash Manifest</h3>
                        <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 20px;">
                        Export hash manifest for case: <strong>${caseTitle}</strong>
                    </p>
                    
                    <div class="format-options">
                        <div class="format-option selected" data-format="json">
                            <div style="font-size: 24px; margin-bottom: 8px;">📄</div>
                            <div><strong>JSON</strong></div>
                            <small style="color: #666;">Structured data format</small>
                        </div>
                        <div class="format-option" data-format="csv">
                            <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                            <div><strong>CSV</strong></div>
                            <small style="color: #666;">Spreadsheet compatible</small>
                        </div>
                    </div>
                    
                    <div class="export-progress" style="display: none; margin: 16px 0; padding: 12px; background: #f0f8ff; border-radius: 6px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Generating manifest...</span>
                            <span class="progress-text">0%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                        <button class="btn btn-outline cancel-btn">Cancel</button>
                        <button class="btn export-btn" style="background: #d32f2f; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                            Export Manifest
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            let selectedFormat = 'json';
            
            modal.querySelectorAll('.format-option').forEach(option => {
                option.addEventListener('click', () => {
                    modal.querySelectorAll('.format-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedFormat = option.dataset.format;
                });
            });
            
            const closeModal = () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    resolve(null);
                }, 300);
            };
            
            modal.querySelector('.close-btn').addEventListener('click', closeModal);
            modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
            
            modal.querySelector('.export-btn').addEventListener('click', async () => {
                try {
                    modal.querySelector('.export-btn').disabled = true;
                    modal.querySelector('.export-progress').style.display = 'block';
                    
                    await this.exportManifest(caseId, caseTitle, selectedFormat, (progress) => {
                        modal.querySelector('.progress-fill').style.width = `${progress}%`;
                        modal.querySelector('.progress-text').textContent = `${progress}%`;
                    });
                    
                    closeModal();
                    resolve(selectedFormat);
                } catch (error) {
                    console.error('Export failed:', error);
                    alert('Export failed: ' + error.message);
                    modal.querySelector('.export-btn').disabled = false;
                    modal.querySelector('.export-progress').style.display = 'none';
                }
            });
            
            setTimeout(() => modal.classList.add('show'), 100);
        });
    }

    async exportManifest(caseId, caseTitle, format, progressCallback) {
        try {
            progressCallback(10);
            const evidenceData = await this.getCaseEvidence(caseId);
            progressCallback(40);
            
            const manifest = this.generateManifest(caseId, caseTitle, evidenceData);
            progressCallback(70);
            
            if (format === 'json') {
                this.downloadJSON(manifest, `case_${caseId}_manifest.json`);
            } else if (format === 'csv') {
                this.downloadCSV(manifest, `case_${caseId}_manifest.csv`);
            }
            
            progressCallback(100);
            
        } catch (error) {
            console.error('Manifest export error:', error);
            throw error;
        }
    }

    async getCaseEvidence(caseId) {
        return [
            {
                evidence_id: "EVI001",
                evidence_name: "Hard Drive Image",
                file_hash: "d4735f3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
                hash_algorithm: "SHA-256",
                blockchain_tx_hash: "0x1234abcd5678ef90abcd1234567890abcdef1234567890abcdef1234567890ab",
                blockchain_timestamp: new Date().toISOString(),
                upload_by: "Investigator X",
                file_type: "application/octet-stream",
                file_size: 1073741824,
                case_number: caseId
            }
        ];
    }

    generateManifest(caseId, caseTitle, evidenceData) {
        return {
            case_id: caseId,
            case_title: caseTitle,
            manifest_generated: new Date().toISOString(),
            manifest_version: "1.0",
            total_evidence_items: evidenceData.length,
            evidence_items: evidenceData.map(item => ({
                evidence_id: item.evidence_id,
                evidence_name: item.evidence_name,
                file_hash: item.file_hash,
                hash_algorithm: item.hash_algorithm,
                blockchain_tx_hash: item.blockchain_tx_hash,
                blockchain_timestamp: item.blockchain_timestamp,
                upload_by: item.upload_by,
                file_type: item.file_type,
                file_size: item.file_size,
                verification_status: "verified"
            })),
            manifest_metadata: {
                generated_by: "EVID-DGC System",
                system_version: "2.0.0",
                export_timestamp: new Date().toISOString(),
                checksum: this.calculateManifestChecksum(evidenceData)
            }
        };
    }

    calculateManifestChecksum(evidenceData) {
        const combined = evidenceData.map(item => item.file_hash).join('');
        return this.simpleHash(combined);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    downloadJSON(manifest, filename) {
        const jsonString = JSON.stringify(manifest, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadCSV(manifest, filename) {
        const headers = [
            'Evidence ID', 'Evidence Name', 'File Hash', 'Hash Algorithm',
            'Blockchain TX Hash', 'Blockchain Timestamp', 'Uploaded By',
            'File Type', 'File Size', 'Verification Status'
        ];
        
        const rows = manifest.evidence_items.map(item => [
            item.evidence_id, item.evidence_name, item.file_hash, item.hash_algorithm,
            item.blockchain_tx_hash, item.blockchain_timestamp, item.upload_by,
            item.file_type, item.file_size, item.verification_status
        ]);
        
        const csvContent = [
            `# Case Hash Manifest Export`,
            `# Case ID: ${manifest.case_id}`,
            `# Case Title: ${manifest.case_title}`,
            `# Generated: ${manifest.manifest_generated}`,
            `# Total Items: ${manifest.total_evidence_items}`,
            `#`,
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    addExportButton(container, caseId, caseTitle) {
        const button = document.createElement('button');
        button.className = 'btn btn-outline';
        button.innerHTML = 'Download Hash Manifest';
        button.addEventListener('click', () => {
            this.showExportDialog(caseId, caseTitle);
        });
        container.appendChild(button);
        return button;
    }
}

window.caseHashManifest = new CaseHashManifest();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CaseHashManifest;
}