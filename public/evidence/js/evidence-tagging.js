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

    async loadTags() {
        try {
            const response = await fetch('/api/tags');
            const data = await response.json();
            if (data.success) {
                this.tags = data.tags;
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
        const userWallet = localStorage.getItem('userWallet');

        try {
            const response = await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('tagName'),
                    color: formData.get('tagColor'),
                    category: formData.get('tagCategory'),
                    userWallet
                })
            });

            const data = await response.json();
            if (data.success) {
                this.tags.push(data.tag);
                this.renderTagList();
                e.target.reset();
                this.showMessage('Tag created successfully', 'success');
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error creating tag', 'error');
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
        const userWallet = localStorage.getItem('userWallet');
        try {
            const response = await fetch(`/api/evidence/${evidenceId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagIds, userWallet })
            });

            const data = await response.json();
            if (data.success) {
                this.showMessage('Tags added successfully', 'success');
                return true;
            } else {
                this.showMessage(data.error, 'error');
                return false;
            }
        } catch (error) {
            this.showMessage('Error adding tags', 'error');
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

        const userWallet = localStorage.getItem('userWallet');
        try {
            const response = await fetch('/api/evidence/batch-tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    evidenceIds: selectedEvidence,
                    tagIds: selectedTagIds,
                    userWallet
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showMessage(`Tagged ${data.tagged_count} items successfully`, 'success');
                this.selectedTags.clear();
                this.updateSelectedTagsDisplay();
            } else {
                this.showMessage(data.error, 'error');
            }
        } catch (error) {
            this.showMessage('Error batch tagging', 'error');
        }
    }

    getSelectedEvidence() {
        const checkboxes = document.querySelectorAll('.evidence-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    async filterByTags(tagIds, logic = 'AND') {
        try {
            const response = await fetch(`/api/evidence/by-tags?tagIds=${tagIds.join(',')}&logic=${logic}`);
            const data = await response.json();
            if (data.success) {
                this.renderFilteredEvidence(data.evidence);
                return data.evidence;
            }
        } catch (error) {
            console.error('Filter by tags error:', error);
        }
        return [];
    }

    renderFilteredEvidence(evidence) {
        const evidenceContainer = document.getElementById('evidenceContainer');
        if (!evidenceContainer) return;

        evidenceContainer.innerHTML = evidence.map(item => `
            <div class="evidence-item" data-evidence-id="${item.id}">
                <div class="evidence-header">
                    <input type="checkbox" class="evidence-checkbox" value="${item.id}">
                    <h4>${item.name || 'Unnamed Evidence'}</h4>
                </div>
                <div class="evidence-details">
                    <p><strong>Case:</strong> ${item.case_number || 'N/A'}</p>
                    <p><strong>Type:</strong> ${item.file_type || 'Unknown'}</p>
                    <p><strong>Hash:</strong> ${item.hash?.substring(0, 16)}...</p>
                    <p><strong>Submitted:</strong> ${new Date(item.timestamp).toLocaleDateString()}</p>
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
        `).join('');
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