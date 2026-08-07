// Evidence Integrity Verification JavaScript
let selectedFile = null;
let selectedFiles = [];
let verificationHistory = JSON.parse(localStorage.getItem('verificationHistory') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupDragAndDrop();
    loadVerificationHistory();
});

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files } });
        }
    });
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    selectedFile = file;
    document.getElementById('verifyBtn').disabled = false;
    
    // Update upload zone
    const uploadText = document.getElementById('uploadText');
    uploadText.innerHTML = `
        <h3>✅ File Selected: ${file.name}</h3>
        <p>Size: ${formatFileSize(file.size)} | Type: ${file.type || 'Unknown'}</p>
        <p>Click "Verify File Integrity" to check against blockchain records</p>
    `;
    
    // Show file info
    showFileInfo(file);
}

// Handle bulk file selection
function handleBulkFileSelect(event) {
    selectedFiles = Array.from(event.target.files);
    document.getElementById('bulkVerifyBtn').disabled = selectedFiles.length === 0;
    
    const bulkResults = document.getElementById('bulkResults');
    bulkResults.innerHTML = `
        <p>Selected ${selectedFiles.length} files for bulk verification:</p>
        <ul>
            ${selectedFiles.map(file => `<li>${file.name} (${formatFileSize(file.size)})</li>`).join('')}
        </ul>
    `;
}

// Show file information
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
        <h3>File Information</h3>
        <p><strong>Name:</strong> ${file.name}</p>
        <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
        <p><strong>Type:</strong> ${file.type || 'Unknown'}</p>
        <p><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</p>
    `;
}

// Calculate file hash
async function calculateFileHash(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize API response ({ success: true, data: {...} } -> data object)
function unwrapVerification(result) {
    if (result && result.data && typeof result.data === 'object' && 'verified' in result.data) {
        return result.data;
    }
    return result;
}

// Verify single file
async function verifyFile() {
    if (!selectedFile) return;
    
    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.disabled = true;
    verifyBtn.textContent = '🔄 Verifying...';
    
    try {
        // Calculate file hash
        const calculatedHash = await calculateFileHash(selectedFile);
        
        // Get evidence ID if provided
        const evidenceId = document.getElementById('evidenceId').value;
        
        // Call verification API using secure apiClient
        const result = await window.apiClient.post('/evidence/verify-integrity', {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            calculatedHash,
            evidenceId: evidenceId || null
        });

        const data = unwrapVerification(result);
        
        displayVerificationResult(data, calculatedHash);
        
        // Add to history
        addToHistory({
            fileName: selectedFile.name,
            result: data.verified ? 'verified' : 'tampered',
            timestamp: new Date().toISOString(),
            hash: calculatedHash,
            evidenceId: evidenceId || null
        });
        
        // Generate QR code
        if (data.verified) {
            generateQRCode(data.verificationUrl || `${window.location.origin}/verify/${calculatedHash}`);
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        showError('Verification failed: ' + (error.message || 'Please try again.'));
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '🔍 Verify File Integrity';
    }
}

// Verify bulk files
async function verifyBulkFiles() {
    if (selectedFiles.length === 0) return;
    
    const bulkVerifyBtn = document.getElementById('bulkVerifyBtn');
    bulkVerifyBtn.disabled = true;
    bulkVerifyBtn.textContent = '🔄 Verifying...';
    
    const bulkResults = document.getElementById('bulkResults');
    bulkResults.innerHTML = '<h3>Bulk Verification Results:</h3>';
    
    let verified = 0;
    let tampered = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
            const calculatedHash = await calculateFileHash(file);
            const result = await window.apiClient.post('/evidence/verify-integrity', {
                fileName: file.name,
                fileSize: file.size,
                calculatedHash
            });
            
            const data = unwrapVerification(result);
            const resultClass = data.verified ? 'result-verified' : 'result-tampered';
            const resultIcon = data.verified ? '✅' : '❌';
            const resultText = data.verified ? 'Verified' : 'Tampered';
            
            if (data.verified) verified++;
            else tampered++;
            
            bulkResults.innerHTML += `
                <div class="verification-result ${resultClass}">
                    <strong>${resultIcon} ${file.name}</strong> - ${resultText}
                    <br><small>Hash: ${calculatedHash.substring(0, 16)}...</small>
                </div>
            `;
            
        } catch (error) {
            bulkResults.innerHTML += `
                <div class="verification-result result-tampered">
                    <strong>❌ ${file.name}</strong> - Error: ${error.message}
                </div>
            `;
            tampered++;
        }
    }
    
    bulkResults.innerHTML += `
        <div class="verification-summary">
            <h4>Summary: ${verified} Verified, ${tampered} Issues Found</h4>
        </div>
    `;
    
    bulkVerifyBtn.disabled = false;
    bulkVerifyBtn.textContent = '🔍 Verify All Files';
}

// Display verification result
function displayVerificationResult(result, calculatedHash) {
    const resultDiv = document.getElementById('verificationResult');
    resultDiv.style.display = 'block';
    
    const isVerified = result.verified;    const resultClass = isVerified ? 'result-verified' : 'result-tampered';
    const resultIcon = isVerified ? '✅' : '❌';
    const resultText = isVerified ? 'VERIFIED' : 'TAMPERED';
    
    resultDiv.className = `verification-result ${resultClass}`;
    resultDiv.innerHTML = `
        <h2>${resultIcon} ${resultText}</h2>
        <p><strong>File Status:</strong> ${isVerified ? 'File integrity confirmed' : 'File has been modified'}</p>
        <p><strong>Blockchain Match:</strong> ${isVerified ? 'Hash matches blockchain record' : 'Hash does not match blockchain record'}</p>
        
        <div class="hash-display">
            <strong>Calculated Hash:</strong><br>
            ${calculatedHash}
        </div>
        
        ${result.blockchainHash ? `
            <div class="hash-display">
                <strong>Blockchain Hash:</strong><br>
                ${result.blockchainHash}
            </div>
        ` : ''}
        
        <div style="margin-top: 15px;">
            <button onclick="downloadCertificate()" class="btn-download">📄 Download Certificate</button>
            <button onclick="emailResults()" class="btn-download">📧 Email Results</button>
        </div>
        
        ${result.evidence ? `
            <div style="margin-top: 15px; text-align: left;">
                <h4>Evidence Details:</h4>
                <p><strong>Evidence ID:</strong> ${result.evidence.id}</p>
                <p><strong>Case:</strong> ${result.evidence.case_id}</p>
                <p><strong>Submitted:</strong> ${new Date(result.evidence.timestamp).toLocaleString()}</p>
                <p><strong>Submitted By:</strong> ${result.evidence.submitted_by}</p>
            </div>
        ` : ''}
    `;
}

// Generate QR code
function generateQRCode(url) {
    const qrSection = document.getElementById('qrSection');
    const qrContainer = document.getElementById('qrCodeContainer');
    
    qrSection.style.display = 'block';
    qrContainer.innerHTML = '';
    
    QRCode.toCanvas(qrContainer, url, {
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff'
    }, (error) => {
        if (error) {
            console.error('QR Code generation error:', error);
            qrContainer.innerHTML = '<p>Error generating QR code</p>';
        }
    });
}

// Download verification certificate
async function downloadCertificate() {
    try {
        // apiClient doesn't handle binary blobs yet, so we use a custom signed fetch wrapper
        const signedHeaders = await window.apiClient.getAuthHeaders();
        const apiUrl = window.config?.API_BASE_URL || '/api';

        const evidenceIdInput = document.getElementById('evidenceId');
        const evidenceId = evidenceIdInput ? evidenceIdInput.value.trim() : '';

        const response = await fetch(`${apiUrl}/evidence/verification-certificate`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...signedHeaders
            },
            body: JSON.stringify({
                fileName: selectedFile ? selectedFile.name : 'verification',
                evidenceId: evidenceId || undefined,
                verificationResult: 'verified',
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `verification_certificate_${selectedFile ? selectedFile.name : 'evidence'}_${Date.now()}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            let message = 'Failed to generate certificate';
            try {
                const j = await response.json();
                if (j && j.error) message = j.error;
            } catch (_) { /* ignore */ }
            throw new Error(message);
        }
    } catch (error) {
        console.error('Certificate download error:', error);
        showError('Failed to download certificate: ' + (error.message || 'please ensure the evidence ID was provided and you are signed in'));
    }
}

// Email verification results
function emailResults() {
    const subject = `Evidence Verification Results - ${selectedFile.name}`;
    const body = `Evidence verification completed for file: ${selectedFile.name}\n\nPlease check the attached certificate for detailed results.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Add to verification history
function addToHistory(entry) {
    verificationHistory.unshift(entry);
    if (verificationHistory.length > 50) {
        verificationHistory = verificationHistory.slice(0, 50);
    }
    localStorage.setItem('verificationHistory', JSON.stringify(verificationHistory));
    loadVerificationHistory();
}

// Load verification history
function loadVerificationHistory() {
    const historyDiv = document.getElementById('verificationHistory');
    
    if (verificationHistory.length === 0) {
        historyDiv.innerHTML = '<p>No verification history found.</p>';
        return;
    }
    
    historyDiv.innerHTML = verificationHistory.map(entry => {
        const resultIcon = entry.result === 'verified' ? '✅' : '❌';
        const resultClass = entry.result === 'verified' ? 'result-verified' : 'result-tampered';
        
        return `
            <div class="verification-result ${resultClass}" style="margin: 10px 0; padding: 10px;">
                <strong>${resultIcon} ${entry.fileName}</strong>
                <br><small>Verified: ${new Date(entry.timestamp).toLocaleString()}</small>
                <br><small>Hash: ${entry.hash.substring(0, 32)}...</small>
                ${entry.evidenceId ? `<br><small>Evidence ID: ${entry.evidenceId}</small>` : ''}
            </div>
        `;
    }).join('');
}

// Clear verification history
function clearHistory() {
    if (confirm('Are you sure you want to clear verification history?')) {
        verificationHistory = [];
        localStorage.removeItem('verificationHistory');
        loadVerificationHistory();
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    const resultDiv = document.getElementById('verificationResult');
    resultDiv.style.display = 'block';
    resultDiv.className = 'verification-result result-tampered';
    resultDiv.innerHTML = `
        <h2>❌ Error</h2>
        <p>${message}</p>
    `;
}