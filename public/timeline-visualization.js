// Interactive Timeline Visualization JavaScript
let timeline = null;
let timelineData = [];
let allEvidence = [];
let currentCase = null;
let isFullscreen = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadCases();
    initializeTimeline();
});

// Load available cases
async function loadCases() {
    try {
        const result = await window.apiClient.get('/cases');
        
        if (result.success) {
            const caseSelect = document.getElementById('caseSelect');
            caseSelect.innerHTML = '<option value="">Select a case...</option>' +
                result.cases.map(case_ => 
                    `<option value="${case_.id}">${case_.title} (${case_.id})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading cases:', error);
    }
}

// Initialize timeline
function initializeTimeline() {
    const container = document.getElementById('timeline');
    
    const options = {
        width: '100%',
        height: '500px',
        margin: { item: 10, axis: 40 },
        orientation: 'top',
        zoomable: true,
        moveable: true,
        showCurrentTime: true,
        showMajorLabels: true,
        showMinorLabels: true,
        format: {
            minorLabels: {
                millisecond: 'SSS',
                second: 's',
                minute: 'HH:mm',
                hour: 'HH:mm',
                weekday: 'ddd D',
                day: 'D',
                week: 'w',
                month: 'MMM',
                year: 'YYYY'
            },
            majorLabels: {
                millisecond: 'HH:mm:ss',
                second: 'D MMMM HH:mm',
                minute: 'ddd D MMMM',
                hour: 'ddd D MMMM',
                weekday: 'MMMM YYYY',
                day: 'MMMM YYYY',
                week: 'MMMM YYYY',
                month: 'YYYY',
                year: ''
            }
        },
        tooltip: {
            followMouse: true,
            overflowMethod: 'cap'
        },
        onInitialDrawComplete: function() {
            console.log('Timeline initialized');
        }
    };
    
    timeline = new vis.Timeline(container, new vis.DataSet([]), options);
    
    // Add click event listener
    timeline.on('select', function(event) {
        if (event.items.length > 0) {
            const itemId = event.items[0];
            showEvidenceDetails(itemId);
        }
    });
    
    // Add double-click event for fullscreen
    timeline.on('doubleClick', function(event) {
        toggleFullscreen();
    });
}

// Load evidence for selected case
async function loadCaseEvidence() {
    const caseId = document.getElementById('caseSelect').value;
    if (!caseId) {
        clearTimeline();
        return;
    }
    
    currentCase = caseId;
    
    try {
        const result = await window.apiClient.get(`/evidence/case/${caseId}`, { skipWalletAuth: true });
        
        allEvidence = (result.data || result.evidence || []).map(item => ({
            id: item.id,
            title: item.title || item.name || item.file_name || 'Unnamed Evidence',
            type: item.type || item.file_type || 'unknown',
            timestamp: item.timestamp || item.created_at || new Date().toISOString(),
            submitted_by: item.submitted_by || item.user_wallet || 'Unknown',
            case_id: item.case_id || caseId,
            description: item.description || '',
            file_name: item.file_name || item.name || '',
            file_size: item.file_size || 0,
            hash: item.hash || '',
            status: item.status || 'submitted'
        }));
        populateFilters();
        updateTimeline();
        updateStatistics();
        analyzeTimelineGaps();
    } catch (error) {
        console.error('Error loading case evidence:', error);
        alert('Failed to load evidence for this case: ' + (error.message || error));
    }
}

// Populate filter dropdowns
function populateFilters() {
    // Populate uploader filter
    const uploaders = [...new Set(allEvidence.map(e => e.submitted_by))];
    const uploaderSelect = document.getElementById('uploaderFilter');
    uploaderSelect.innerHTML = '<option value="all">All Uploaders</option>' +
        uploaders.map(uploader => 
            `<option value="${uploader}">${uploader.substring(0, 8)}...</option>`
        ).join('');
}

// Update timeline with filtered data
function updateTimeline() {
    const filteredEvidence = getFilteredEvidence();
    const timelineItems = createTimelineItems(filteredEvidence);
    
    if (timeline) {
        timeline.setData(new vis.DataSet(timelineItems));
        
        // Fit timeline to show all items
        if (timelineItems.length > 0) {
            setTimeout(() => {
                timeline.fit();
            }, 100);
        }
    }
    
    // Update mobile timeline
    updateMobileTimeline(filteredEvidence);
}

// Get filtered evidence based on current filters
function getFilteredEvidence() {
    let filtered = [...allEvidence];
    
    // Filter by type
    const typeFilter = document.getElementById('typeFilter').value;
    if (typeFilter !== 'all') {
        filtered = filtered.filter(e => e.type.toLowerCase().includes(typeFilter));
    }
    
    // Filter by date range
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filtered = filtered.filter(e => new Date(e.timestamp) <= endDateTime);
    }
    
    // Filter by uploader
    const uploaderFilter = document.getElementById('uploaderFilter').value;
    if (uploaderFilter !== 'all') {
        filtered = filtered.filter(e => e.submitted_by === uploaderFilter);
    }
    
    return filtered;
}

// Create timeline items from evidence data
function createTimelineItems(evidence) {
    return evidence.map(item => {
        const evidenceType = getEvidenceType(item.type);
        const color = getTypeColor(evidenceType);
        
        return {
            id: item.id,
            content: `<div style="padding: 5px;">
                        <strong>${item.title}</strong><br>
                        <small>${evidenceType} • ${item.submitted_by.substring(0, 8)}...</small>
                      </div>`,
            start: new Date(item.timestamp),
            type: 'point',
            className: `evidence-type-${evidenceType}`,
            style: `background-color: ${color}; border-color: ${color};`,
            title: `${item.title}\nType: ${evidenceType}\nSubmitted: ${new Date(item.timestamp).toLocaleString()}\nBy: ${item.submitted_by.substring(0, 8)}...`
        };
    });
}

// Get evidence type from file type
function getEvidenceType(type) {
    if (type.includes('image') || type.includes('photo')) return 'photo';
    if (type.includes('video')) return 'video';
    if (type.includes('audio')) return 'audio';
    if (type.includes('document') || type.includes('pdf') || type.includes('text')) return 'document';
    return 'physical';
}

// Get color for evidence type
function getTypeColor(type) {
    const colors = {
        photo: '#3b82f6',
        document: '#10b981',
        video: '#8b5cf6',
        audio: '#f59e0b',
        physical: '#ef4444'
    };
    return colors[type] || '#6b7280';
}

// Update mobile timeline
function updateMobileTimeline(evidence) {
    const container = document.getElementById('mobileTimelineList');
    
    if (evidence.length === 0) {
        container.innerHTML = '<p>No evidence found for selected filters.</p>';
        return;
    }
    
    // Sort by timestamp
    const sortedEvidence = evidence.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    container.innerHTML = sortedEvidence.map(item => {
        const evidenceType = getEvidenceType(item.type);
        const color = getTypeColor(evidenceType);
        
        return `
            <div class="mobile-timeline-item" style="border-left: 4px solid ${color}; padding: 15px; margin: 10px 0; background: white; border-radius: 4px;" onclick="showEvidenceDetails(${item.id})">
                <h4>${item.title}</h4>
                <p><strong>Type:</strong> ${evidenceType}</p>
                <p><strong>Date:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                <p><strong>Submitted by:</strong> ${item.submitted_by.substring(0, 8)}...</p>
            </div>
        `;
    }).join('');
}

// Show evidence details in modal
function showEvidenceDetails(evidenceId) {
    const evidence = allEvidence.find(e => e.id == evidenceId);
    if (!evidence) return;
    
    const modal = document.getElementById('evidenceModal');
    const details = document.getElementById('evidenceDetails');
    
    details.innerHTML = `
        <div class="evidence-popup">
            <h3>${evidence.title}</h3>
            <p><strong>Case ID:</strong> ${evidence.case_id}</p>
            <p><strong>Type:</strong> ${getEvidenceType(evidence.type)}</p>
            <p><strong>Description:</strong> ${evidence.description || 'No description'}</p>
            <p><strong>File Name:</strong> ${evidence.file_name}</p>
            <p><strong>File Size:</strong> ${formatFileSize(evidence.file_size)}</p>
            <p><strong>Hash:</strong> <code>${evidence.hash}</code></p>
            <p><strong>Submitted:</strong> ${new Date(evidence.timestamp).toLocaleString()}</p>
            <p><strong>Submitted By:</strong> ${evidence.submitted_by}</p>
            <p><strong>Status:</strong> ${evidence.status}</p>
            
            <div style="margin-top: 15px;">
                <button onclick="downloadEvidence(${evidence.id})" class="btn btn-primary">Download</button>
                <button onclick="verifyEvidence(${evidence.id})" class="btn btn-secondary">Verify</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close evidence modal
function closeEvidenceModal() {
    document.getElementById('evidenceModal').style.display = 'none';
}

// Timeline control functions
function zoomIn() {
    if (timeline) {
        timeline.zoomIn(0.2);
    }
}

function zoomOut() {
    if (timeline) {
        timeline.zoomOut(0.2);
    }
}

function resetZoom() {
    if (timeline && allEvidence.length > 0) {
        timeline.fit();
    }
}

function fitTimeline() {
    if (timeline) {
        timeline.fit();
    }
}

// Filter functions
function filterTimeline() {
    updateTimeline();
    updateStatistics();
    analyzeTimelineGaps();
}

function resetFilters() {
    document.getElementById('typeFilter').value = 'all';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('uploaderFilter').value = 'all';
    filterTimeline();
}

// Toggle fullscreen mode
function toggleFullscreen() {
    const container = document.querySelector('.timeline-container');
    
    if (!isFullscreen) {
        container.classList.add('timeline-fullscreen');
        document.body.style.overflow = 'hidden';
        isFullscreen = true;
        
        // Resize timeline
        setTimeout(() => {
            if (timeline) {
                timeline.redraw();
                timeline.fit();
            }
        }, 100);
    } else {
        container.classList.remove('timeline-fullscreen');
        document.body.style.overflow = 'auto';
        isFullscreen = false;
        
        // Resize timeline
        setTimeout(() => {
            if (timeline) {
                timeline.redraw();
                timeline.fit();
            }
        }, 100);
    }
}

// Update statistics
function updateStatistics() {
    const filteredEvidence = getFilteredEvidence();
    const statsDiv = document.getElementById('timelineStats');
    
    if (filteredEvidence.length === 0) {
        statsDiv.style.display = 'none';
        return;
    }
    
    const typeStats = {};
    const uploaderStats = {};
    
    filteredEvidence.forEach(item => {
        const type = getEvidenceType(item.type);
        typeStats[type] = (typeStats[type] || 0) + 1;
        
        const uploader = item.submitted_by.substring(0, 8) + '...';
        uploaderStats[uploader] = (uploaderStats[uploader] || 0) + 1;
    });
    
    const dates = filteredEvidence.map(e => new Date(e.timestamp)).sort((a, b) => a - b);
    const dateRange = dates.length > 0 ? 
        `${dates[0].toLocaleDateString()} - ${dates[dates.length - 1].toLocaleDateString()}` : 'N/A';
    
    statsDiv.innerHTML = `
        <h3>Timeline Statistics</h3>
        <p><strong>Total Evidence:</strong> ${filteredEvidence.length}</p>\n        <p><strong>Date Range:</strong> ${dateRange}</p>
        <p><strong>By Type:</strong> ${Object.entries(typeStats).map(([type, count]) => `${type}: ${count}`).join(', ')}</p>
        <p><strong>By Uploader:</strong> ${Object.entries(uploaderStats).map(([uploader, count]) => `${uploader}: ${count}`).join(', ')}</p>
    `;
    
    statsDiv.style.display = 'block';
}

// Analyze timeline gaps
function analyzeTimelineGaps() {
    const filteredEvidence = getFilteredEvidence();
    const gapsDiv = document.getElementById('timelineGaps');
    
    if (filteredEvidence.length < 2) {
        gapsDiv.style.display = 'none';
        return;
    }
    
    const sortedEvidence = filteredEvidence.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const gaps = [];
    
    for (let i = 1; i < sortedEvidence.length; i++) {
        const prevDate = new Date(sortedEvidence[i - 1].timestamp);
        const currDate = new Date(sortedEvidence[i].timestamp);
        const gapHours = (currDate - prevDate) / (1000 * 60 * 60);
        
        // Consider gaps longer than 24 hours as significant
        if (gapHours > 24) {
            gaps.push({
                start: prevDate,
                end: currDate,
                duration: gapHours
            });
        }
    }
    
    if (gaps.length === 0) {
        gapsDiv.style.display = 'none';
        return;
    }
    
    gapsDiv.innerHTML = `
        <h3>⚠️ Timeline Gaps Analysis</h3>
        <p>Found ${gaps.length} significant gap(s) in evidence collection:</p>
        ${gaps.map(gap => `
            <div class="timeline-gap">
                <strong>Gap:</strong> ${gap.start.toLocaleString()} - ${gap.end.toLocaleString()}<br>
                <strong>Duration:</strong> ${Math.round(gap.duration)} hours (${Math.round(gap.duration / 24)} days)
            </div>
        `).join('')}
    `;
    
    gapsDiv.style.display = 'block';
}

// Export functions
async function exportTimelineImage() {
    try {
        const timelineElement = document.getElementById('timeline');
        const canvas = await html2canvas(timelineElement);
        
        const link = document.createElement('a');
        link.download = `timeline_${currentCase}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch (error) {
        console.error('Export image error:', error);
        alert('Failed to export timeline as image');
    }
}

async function exportTimelinePDF() {
    try {
        const signedHeaders = await window.apiClient.getAuthHeaders();
        const response = await fetch(`${window.config.API_BASE_URL}/timeline/export-pdf`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...signedHeaders
            },
            body: JSON.stringify({
                caseId: currentCase,
                evidence: getFilteredEvidence()
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `timeline_${currentCase}_${new Date().toISOString().split('T')[0]}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Failed to generate PDF');
        }
    } catch (error) {
        console.error('Export PDF error:', error);
        alert('Failed to export timeline as PDF: ' + error.message);
    }
}

function exportTimelineData() {
    const filteredEvidence = getFilteredEvidence();
    const exportData = {
        caseId: currentCase,
        exportDate: new Date().toISOString(),
        totalEvidence: filteredEvidence.length,
        evidence: filteredEvidence.map(item => ({
            id: item.id,
            title: item.title,
            type: getEvidenceType(item.type),
            timestamp: item.timestamp,
            submittedBy: item.submitted_by,
            hash: item.hash
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `timeline_data_${currentCase}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Utility functions
function clearTimeline() {
    if (timeline) {
        timeline.setData(new vis.DataSet([]));
    }
    document.getElementById('timelineStats').style.display = 'none';
    document.getElementById('timelineGaps').style.display = 'none';
    document.getElementById('mobileTimelineList').innerHTML = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function downloadEvidence(evidenceId) {
    try {
        const signedHeaders = await window.apiClient.getAuthHeaders();
        const apiUrl = window.config?.API_BASE_URL || '/api';
        const response = await fetch(`${apiUrl}/evidence/${evidenceId}/download`, {
            method: 'POST',
            headers: { ...signedHeaders }
        });

        if (!response.ok) {
            let msg = 'Download failed';
            try {
                const j = await response.json();
                if (j && j.error) msg = j.error;
            } catch (_) { /* non-JSON error body */ }
            throw new Error(msg);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const cd = response.headers.get('Content-Disposition') || '';
        const m = cd.match(/filename="?([^";]+)"?/);
        a.href = url;
        a.download = m ? m[1] : `evidence_${evidenceId}`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download evidence error:', error);
        alert('Download failed: ' + (error.message || error));
    }
}

async function verifyEvidence(evidenceId) {
    try {
        const result = await window.apiClient.get(`/evidence/${evidenceId}/verify`, { skipWalletAuth: true });
        const data = result.data || result;
        if (data.valid === true || data.blockchainVerified === true) {
            alert('✅ Hash verified: blockchain match confirmed.');
        } else {
            alert('⚠️ Verification inconclusive: ' + ((data.errors && data.errors.join(', ')) || data.error || 'record not found on-chain'));
        }
    } catch (error) {
        alert('Verification failed: ' + (error.message || error));
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('evidenceModal');
    if (event.target === modal) {
        closeEvidenceModal();
    }
};