// Evidence Tagging System
class EvidenceTagging {
    constructor() {
        this.tags = [];
        this.selectedTags = new Set();
        this.init();
    }

    async init() {
        await this.loadTags();
        this.setupEventListeners();
    }

    async loadAllEvidence() {
        const result = await window.apiClient.get('/evidence', { skipWalletAuth: true });
        return (result.data || result.evidence || []);
    }

    async loadTags() {
        try {
            const result = await window.apiClient.get('/tags');
            if (result.success) {
                this.tags = result.tags;
                this.renderTagList();
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    setupEventListeners() {
        // Tag creation form
        const createTagForm = document.getElementById('createTagForm');
        if (createTagForm) {
            createTagForm.addEventListener('submit', (e) => this.handleCreateTag(e));
        }

        // Tag search
        const tagSearch = document.getElementById('tagSearch');
        if (tagSearch) {
            tagSearch.addEventListener('input', (e) => this.handleTagSearch(e));
        }

        // Batch tagging
        const batchTagBtn = document.getElementById('batchTagBtn');
        if (batchTagBtn) {
            batchTagBtn.addEventListener('click', () => this.handleBatchTag());
        }
    }

    renderTagList() {
        const tagContainer = document.getElementById('tagContainer');
        if (!tagContainer) return;

        tagContainer.innerHTML = this.tags.map(tag => `
            <div class="tag-item" data-tag-id="${tag.id}">
                <span class="tag-badge" style="background-color: ${tag.color}">
                    ${tag.name}
                </span>
                <span class="tag-usage">${tag.usage_count}</span>
                <span class="tag-category">${tag.category}</span>
            </div>
        `).join('');
    }

    async handleCreateTag(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const result = await window.apiClient.post('/tags', {
                name: formData.get('tagName'),
                color: formData.get('tagColor'),
                category: formData.get('tagCategory')
            });

            if (result.success) {
                this.tags.push(result.tag);
                this.renderTagList();
                e.target.reset();
                this.showMessage('Tag created successfully', 'success');
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error creating tag: ' + error.message, 'error');
        }
    }

    async handleTagSearch(e) {
        const query = e.target.value;
        try {
            const response = await fetch(`/api/tags/suggest?query=${encodeURIComponent(query)}&limit=20`);
            const data = await response.json();
            if (data.success) {
                this.renderTagSuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Tag search error:', error);
        }
    }

    renderTagSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('tagSuggestions');
        if (!suggestionsContainer) return;

        suggestionsContainer.innerHTML = suggestions.map(tag => `
            <div class="tag-suggestion" data-tag-id="${tag.id}">
                <span class="tag-badge" style="background-color: ${tag.color}">
                    ${tag.name}
                </span>
                <button onclick="evidenceTagging.selectTag(${tag.id})" class="btn-select-tag">
                    Select
                </button>
            </div>
        `).join('');
    }

    selectTag(tagId) {
        if (this.selectedTags.has(tagId)) {
            this.selectedTags.delete(tagId);
        } else {
            this.selectedTags.add(tagId);
        }
        this.updateSelectedTagsDisplay();
    }

    updateSelectedTagsDisplay() {
        const selectedContainer = document.getElementById('selectedTags');
        if (!selectedContainer) return;

        const selectedTagsArray = Array.from(this.selectedTags).map(id => 
            this.tags.find(tag => tag.id === id)
        ).filter(Boolean);

        selectedContainer.innerHTML = selectedTagsArray.map(tag => `
            <span class="selected-tag" style="background-color: ${tag.color}">
                ${tag.name}
                <button onclick="evidenceTagging.selectTag(${tag.id})" class="remove-tag">×</button>
            </span>
        `).join('');
    }

    async tagEvidence(evidenceId, tagIds) {
        try {
            // Note: apiClient.post handles the signature prompting if the route is secure
            const result = await window.apiClient.post(`/evidence/${evidenceId}/tags`, { tagIds });

            if (result.success) {
                this.showMessage('Tags added and verified on blockchain', 'success');
                return true;
            } else {
                this.showMessage(result.error, 'error');
                return false;
            }
        } catch (error) {
            this.showMessage('Error adding tags: ' + error.message, 'error');
            return false;
        }
    }

    async handleBatchTag() {
        const selectedEvidence = this.getSelectedEvidence();
        const selectedTagIds = Array.from(this.selectedTags);
        
        if (selectedEvidence.length === 0) {
            this.showMessage('Please select evidence items', 'warning');
            return;
        }

        if (selectedTagIds.length === 0) {
            this.showMessage('Please select tags', 'warning');
            return;
        }

        try {
            const result = await window.apiClient.post('/evidence/batch-tag', {
                evidenceIds: selectedEvidence,
                tagIds: selectedTagIds
            });

            if (result.success) {
                this.showMessage(`Tagged ${result.tagged_count} items successfully`, 'success');
                this.selectedTags.clear();
                this.updateSelectedTagsDisplay();
                // Reload evidence to show new tags
                const evidence = await this.loadAllEvidence();
                this.renderFilteredEvidence(evidence);
            } else {
                this.showMessage(result.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error batch tagging: ' + error.message, 'error');
        }
    }

    getSelectedEvidence() {
        const checkboxes = document.querySelectorAll('.evidence-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    async filterByTags(tagIds, logic = 'AND') {
        try {
            const result = await window.apiClient.get(`/evidence/by-tags?tagIds=${tagIds.join(',')}&logic=${logic}`);
            if (result.success) {
                this.renderFilteredEvidence(result.evidence);
                return result.evidence;
            }
        } catch (error) {
            console.error('Filter by tags error:', error);
        }
        return [];
    }

    renderFilteredEvidence(evidence) {
        const evidenceContainer = document.getElementById('evidenceContainer');
        if (!evidenceContainer) return;

        evidenceContainer.innerHTML = evidence.map(rawItem => {
            const item = {
                ...rawItem,
                name: rawItem.title || rawItem.name || rawItem.file_name || 'Unnamed Evidence',
                file_type: rawItem.type || rawItem.file_type || 'Unknown',
                case_number: rawItem.case_number || rawItem.case_id || 'N/A'
            };
            return `
            <div class="evidence-item" data-evidence-id="${item.id}">
                <div class="evidence-header">
                    <input type="checkbox" class="evidence-checkbox" value="${item.id}">
                    <h4>${item.name}</h4>
                </div>
                <div class="evidence-details">
                    <p><strong>Case:</strong> ${item.case_number}</p>
                    <p><strong>Type:</strong> ${item.file_type}</p>
                    <p><strong>Hash:</strong> ${item.hash ? item.hash.substring(0, 16) + '...' : 'N/A'}</p>
                    <p><strong>Submitted:</strong> ${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div class="evidence-tags">
                    ${this.renderEvidenceTags(item.evidence_tags || [])}
                </div>
                <div class="evidence-actions">
                    <button onclick="evidenceTagging.showTagModal(${item.id})" class="btn-tag">
                        Add Tags
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    renderEvidenceTags(evidenceTags) {
        return evidenceTags.map(et => `
            <span class="evidence-tag" style="background-color: ${et.tags?.color || '#3B82F6'}">
                ${et.tags?.name || 'Unknown'}
            </span>
        `).join('');
    }

    showTagModal(evidenceId) {
        const modal = document.getElementById('tagModal');
        if (modal) {
            modal.style.display = 'block';
            modal.dataset.evidenceId = evidenceId;
        }
    }

    hideTagModal() {
        const modal = document.getElementById('tagModal');
        if (modal) {
            modal.style.display = 'none';
            delete modal.dataset.evidenceId;
        }
    }

    async applyTagsToEvidence() {
        const modal = document.getElementById('tagModal');
        const evidenceId = modal?.dataset.evidenceId;
        
        if (!evidenceId) return;

        const selectedTagIds = Array.from(this.selectedTags);
        if (selectedTagIds.length === 0) {
            this.showMessage('Please select at least one tag', 'warning');
            return;
        }

        const success = await this.tagEvidence(evidenceId, selectedTagIds);
        if (success) {
            this.hideTagModal();
            this.selectedTags.clear();
            this.updateSelectedTagsDisplay();
        }
    }

    async filterBySelectedTags() {
        const selectedTagIds = Array.from(this.selectedTags);
        if (selectedTagIds.length === 0) {
            this.showMessage('Please select tags to filter by', 'warning');
            return;
        }
        const logic = document.querySelector('input[name="filterLogic"]:checked').value;
        await this.filterByTags(selectedTagIds, logic);
    }

    async loadSavedFilters() {
        try {
            const r = await window.apiClient.get('/saved-filters', { skipWalletAuth: true });
            const sel = document.getElementById('savedFilterSelect');
            if (!sel) return;
            sel.innerHTML = '<option value="">Saved filters...</option>' +
                (r.filters || []).map(f => `<option value="${f.id}">${f.name.replace(/</g, '&lt;')}</option>`).join('');
            this.savedFilters = r.filters || [];
        } catch (e) {
            console.error('saved filters load failed', e);
        }
    }

    applySavedFilter(id) {
        const f = (this.savedFilters || []).find(x => String(x.id) === String(id));
        if (!f) return;
        this.selectedTags = new Set(f.filter.tagIds);
        this.updateSelectedTagsDisplay();
        const radio = document.querySelector(`input[name="filterLogic"][value="${f.filter.logic}"]`);
        if (radio) radio.checked = true;
        this.filterByTags(f.filter.tagIds, f.filter.logic);
    }

    async saveCurrentFilter() {
        const nameEl = document.getElementById('savedFilterName');
        const name = (nameEl.value || '').trim();
        if (!name) { this.showMessage('Enter a name for the filter', 'warning'); return; }
        const tagIds = Array.from(this.selectedTags);
        if (tagIds.length === 0) { this.showMessage('Select at least one tag first', 'warning'); return; }
        const logic = document.querySelector('input[name="filterLogic"]:checked').value;
        try {
            await window.apiClient.post('/saved-filters', { name, filter: { tagIds, logic } }, { skipWalletAuth: true });
            nameEl.value = '';
            await this.loadSavedFilters();
            this.showMessage(`Filter "${name}" saved`, 'success');
        } catch (e) {
            this.showMessage('Could not save filter: ' + (e.message || e), 'error');
        }
    }

    async deleteSavedFilter() {
        const sel = document.getElementById('savedFilterSelect');
        const id = sel.value;
        if (!id) { this.showMessage('Select a saved filter to delete', 'warning'); return; }
        try {
            await window.apiClient.delete(`/saved-filters/${id}`, { skipWalletAuth: true });
            await this.loadSavedFilters();
            this.showMessage('Filter deleted', 'success');
        } catch (e) {
            this.showMessage('Could not delete filter: ' + (e.message || e), 'error');
        }
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.evidenceTagging = new EvidenceTagging();
});
