/**
 * Evidence Export Module
 * Provides functionality for downloading and exporting evidence with watermarking
 */

class EvidenceExporter {
    constructor(userWallet) {
        this.userWallet = userWallet;
        this.apiBase = '/api/evidence';
    }

    /**
     * Download a single evidence file with watermark
     * @param {number} evidenceId - The ID of the evidence to download
     * @returns {Promise<boolean>} - Success status
     */
    async downloadSingle(evidenceId) {
        try {
            const response = await fetch(`${this.apiBase}/${evidenceId}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userWallet: this.userWallet
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Download failed');
            }

            // Extract filename from response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition ? 
                contentDisposition.split('filename=')[1].replace(/"/g, '') : 
                `evidence_${evidenceId}.bin`;

            // Create and trigger download
            const blob = await response.blob();
            this.triggerDownload(blob, filename);

            return true;
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    /**
     * Export multiple evidence files as ZIP archive
     * @param {number[]} evidenceIds - Array of evidence IDs to export
     * @returns {Promise<boolean>} - Success status
     */
    async bulkExport(evidenceIds) {
        try {
            if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) {
                throw new Error('Evidence IDs array is required');
            }

            if (evidenceIds.length > 50) {
                throw new Error('Maximum 50 files per bulk export');
            }

            const response = await fetch(`${this.apiBase}/bulk-export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    evidenceIds: evidenceIds,
                    userWallet: this.userWallet
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Export failed');
            }

            // Extract filename from response headers
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition ? 
                contentDisposition.split('filename=')[1].replace(/"/g, '') : 
                'evidence_export.zip';

            // Create and trigger download
            const blob = await response.blob();
            this.triggerDownload(blob, filename);

            return true;
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    /**
     * Get download history for specific evidence
     * @param {number} evidenceId - The ID of the evidence
     * @returns {Promise<Object>} - Download history data
     */
    async getDownloadHistory(evidenceId) {
        try {
            const response = await fetch(`${this.apiBase}/${evidenceId}/download-history?userWallet=${this.userWallet}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get download history');
            }

            return await response.json();
        } catch (error) {
            console.error('Download history error:', error);
            throw error;
        }
    }

    /**
     * Check if user has permission to download evidence
     * @returns {Promise<boolean>} - Permission status
     */
    async checkDownloadPermission() {
        try {
            const response = await fetch(`/api/user/${this.userWallet}`);
            const data = await response.json();
            
            if (!data.user) {
                return false;
            }

            // Public viewers cannot download evidence
            return data.user.role !== 'public_viewer';
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }

    /**
     * Trigger file download in browser
     * @param {Blob} blob - File blob to download
     * @param {string} filename - Name of the file
     */
    triggerDownload(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    /**
     * Create download button for evidence item
     * @param {number} evidenceId - Evidence ID
     * @param {string} evidenceName - Evidence name for display
     * @returns {HTMLElement} - Download button element
     */
    createDownloadButton(evidenceId, evidenceName = 'Evidence') {
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-primary';
        button.innerHTML = '📥 Download';
        button.title = `Download ${evidenceName} with watermark`;
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            button.disabled = true;
            button.innerHTML = '⏳ Downloading...';
            
            try {
                await this.downloadSingle(evidenceId);
                button.innerHTML = '✅ Downloaded';
                setTimeout(() => {
                    button.innerHTML = '📥 Download';
                    button.disabled = false;
                }, 2000);
            } catch (error) {
                button.innerHTML = '❌ Failed';
                alert('Download failed: ' + error.message);
                setTimeout(() => {
                    button.innerHTML = '📥 Download';
                    button.disabled = false;
                }, 2000);
            }
        });
        
        return button;
    }

    /**
     * Create bulk export interface
     * @param {number[]} evidenceIds - Array of evidence IDs
     * @returns {HTMLElement} - Bulk export button element
     */
    createBulkExportButton(evidenceIds) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.innerHTML = `📦 Export ${evidenceIds.length} Files`;
        button.title = 'Export selected evidence as ZIP archive with watermarks';
        
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            button.disabled = true;
            button.innerHTML = '⏳ Exporting...';
            
            try {
                await this.bulkExport(evidenceIds);
                button.innerHTML = '✅ Exported';
                setTimeout(() => {
                    button.innerHTML = `📦 Export ${evidenceIds.length} Files`;
                    button.disabled = false;
                }, 2000);
            } catch (error) {
                button.innerHTML = '❌ Failed';
                alert('Export failed: ' + error.message);
                setTimeout(() => {
                    button.innerHTML = `📦 Export ${evidenceIds.length} Files`;
                    button.disabled = false;
                }, 2000);
            }
        });
        
        return button;
    }

    /**
     * Add export functionality to existing evidence table
     * @param {string} tableSelector - CSS selector for evidence table
     * @param {string} evidenceIdAttribute - Attribute name containing evidence ID
     */
    enhanceEvidenceTable(tableSelector, evidenceIdAttribute = 'data-evidence-id') {
        const table = document.querySelector(tableSelector);
        if (!table) {
            console.warn('Evidence table not found:', tableSelector);
            return;
        }

        // Add download buttons to each row
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const evidenceId = row.getAttribute(evidenceIdAttribute);
            if (evidenceId) {
                const actionsCell = row.querySelector('.actions') || row.appendChild(document.createElement('td'));
                actionsCell.classList.add('actions');
                
                const downloadBtn = this.createDownloadButton(parseInt(evidenceId));
                downloadBtn.style.marginRight = '5px';
                actionsCell.appendChild(downloadBtn);
            }
        });

        // Add bulk export functionality if checkboxes exist
        const checkboxes = table.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length > 0) {
            this.addBulkExportControls(table, checkboxes, evidenceIdAttribute);
        }
    }

    /**
     * Add bulk export controls to table
     * @param {HTMLElement} table - Table element
     * @param {NodeList} checkboxes - Checkbox elements
     * @param {string} evidenceIdAttribute - Attribute name containing evidence ID
     */
    addBulkExportControls(table, checkboxes, evidenceIdAttribute) {
        // Create bulk export controls
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'bulk-export-controls';
        controlsDiv.style.cssText = 'margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;';
        
        const selectedCount = document.createElement('span');
        selectedCount.textContent = '0 selected';
        selectedCount.style.marginRight = '15px';
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-primary';
        exportBtn.innerHTML = '📦 Export Selected';
        exportBtn.disabled = true;
        
        controlsDiv.appendChild(selectedCount);
        controlsDiv.appendChild(exportBtn);
        table.parentNode.insertBefore(controlsDiv, table);
        
        // Handle checkbox changes
        const updateControls = () => {
            const selected = Array.from(checkboxes).filter(cb => cb.checked);
            selectedCount.textContent = `${selected.length} selected`;
            exportBtn.disabled = selected.length === 0;
            
            if (selected.length > 0) {
                exportBtn.innerHTML = `📦 Export ${selected.length} Files`;
            } else {
                exportBtn.innerHTML = '📦 Export Selected';
            }
        };
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateControls);
        });
        
        // Handle export button click
        exportBtn.addEventListener('click', async () => {
            const selected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => {
                    const row = cb.closest('tr');
                    return parseInt(row.getAttribute(evidenceIdAttribute));
                })
                .filter(id => !isNaN(id));
            
            if (selected.length > 0) {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '⏳ Exporting...';
                
                try {
                    await this.bulkExport(selected);
                    exportBtn.innerHTML = '✅ Exported';
                    // Clear selections
                    checkboxes.forEach(cb => cb.checked = false);
                    updateControls();
                    setTimeout(() => {
                        exportBtn.innerHTML = '📦 Export Selected';
                    }, 2000);
                } catch (error) {
                    exportBtn.innerHTML = '❌ Failed';
                    alert('Export failed: ' + error.message);
                    setTimeout(() => {
                        updateControls();
                    }, 2000);
                }
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvidenceExporter;
} else if (typeof window !== 'undefined') {
    window.EvidenceExporter = EvidenceExporter;
}