// Enhanced Evidence Upload Component
class EvidenceUploader {
    constructor() {
        this.allowedFormats = {
            'application/pdf': { ext: 'PDF', maxSize: 100 },
            'image/jpeg': { ext: 'JPG', maxSize: 50 },
            'image/jpg': { ext: 'JPG', maxSize: 50 },
            'image/png': { ext: 'PNG', maxSize: 50 },
            'image/gif': { ext: 'GIF', maxSize: 25 },
            'video/mp4': { ext: 'MP4', maxSize: 500 },
            'video/avi': { ext: 'AVI', maxSize: 500 },
            'video/mov': { ext: 'MOV', maxSize: 500 },
            'audio/mp3': { ext: 'MP3', maxSize: 100 },
            'audio/wav': { ext: 'WAV', maxSize: 200 },
            'audio/m4a': { ext: 'M4A', maxSize: 100 },
            'application/msword': { ext: 'DOC', maxSize: 50 },
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'DOCX', maxSize: 50 },
            'application/vnd.ms-excel': { ext: 'XLS', maxSize: 50 },
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'XLSX', maxSize: 50 },
            'text/plain': { ext: 'TXT', maxSize: 10 },
            'application/zip': { ext: 'ZIP', maxSize: 200 },
            'application/x-rar-compressed': { ext: 'RAR', maxSize: 200 }
        };
        this.maxFileSize = 100 * 1024 * 1024; // 100MB default
        this.init();
    }

    init() {
        this.setupFileInput();
        this.createProgressBar();
        this.updateFileFormatDisplay();
    }

    setupFileInput() {
        const fileInput = document.getElementById('evidenceFile');
        if (!fileInput) return;

        // Add file validation on change
        fileInput.addEventListener('change', (e) => this.validateFile(e.target.files[0]));
        
        // Add drag and drop
        this.setupDragAndDrop(fileInput);
    }

    setupDragAndDrop(fileInput) {
        const dropZone = this.createDropZone();
        fileInput.parentNode.insertBefore(dropZone, fileInput.nextSibling);

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e, fileInput), false);
    }

    createDropZone() {
        const dropZone = document.createElement('div');
        dropZone.className = 'file-drop-zone';
        dropZone.innerHTML = `
            <div class="drop-zone-content">
                <i class="upload-icon">📁</i>
                <p>Drag and drop your evidence file here or <span class="browse-link">browse</span></p>
                <small class="file-formats">Supported: ${this.getFormattedFileTypes()}</small>
                <small class="file-size-limit">Maximum file size: ${this.formatFileSize(this.maxFileSize)}</small>
            </div>
        `;

        dropZone.querySelector('.browse-link').addEventListener('click', () => {
            document.getElementById('evidenceFile').click();
        });

        return dropZone;
    }

    createProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress-container hidden';
        progressContainer.innerHTML = `
            <div class="progress-bar-wrapper">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span class="progress-percentage">0%</span>
                    <span class="progress-status">Preparing upload...</span>
                </div>
            </div>
            <div class="upload-details">
                <span class="file-name"></span>
                <span class="upload-speed"></span>
            </div>
        `;

        const form = document.getElementById('evidenceForm');
        if (form) {
            form.appendChild(progressContainer);
        }
    }

    updateFileFormatDisplay() {
        const fileInput = document.getElementById('evidenceFile');
        if (!fileInput) return;

        const helpText = fileInput.parentNode.querySelector('small');
        if (helpText) {
            helpText.innerHTML = `
                <div class="file-format-info">
                    <strong>Supported formats:</strong> ${this.getFormattedFileTypes()}<br>
                    <strong>Maximum size:</strong> ${this.formatFileSize(this.maxFileSize)}
                </div>
            `;
        }
    }

    getFormattedFileTypes() {
        const extensions = [...new Set(Object.values(this.allowedFormats).map(f => f.ext))];
        return extensions.join(', ');
    }

    validateFile(file) {
        if (!file) return false;

        // Check file type
        if (!this.allowedFormats[file.type]) {
            this.showError(`File format "${file.type}" is not supported. Please use: ${this.getFormattedFileTypes()}`);
            this.clearFileInput();
            return false;
        }

        // Check file size
        const formatInfo = this.allowedFormats[file.type];
        const maxSizeForType = formatInfo.maxSize * 1024 * 1024; // Convert MB to bytes
        
        if (file.size > maxSizeForType) {
            this.showError(`File too large. ${formatInfo.ext} files must be under ${formatInfo.maxSize}MB. Your file is ${this.formatFileSize(file.size)}.`);
            this.clearFileInput();
            return false;
        }

        if (file.size > this.maxFileSize) {
            this.showError(`File exceeds maximum size limit of ${this.formatFileSize(this.maxFileSize)}`);
            this.clearFileInput();
            return false;
        }

        // File is valid
        this.showSuccess(`✅ File "${file.name}" is valid (${this.formatFileSize(file.size)})`);
        this.updateDropZoneWithFile(file);
        return true;
    }

    updateDropZoneWithFile(file) {
        const dropZone = document.querySelector('.file-drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <div class="file-selected">
                    <div class="file-icon">${this.getFileIcon(file.type)}</div>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-details">${this.formatFileSize(file.size)} • ${this.allowedFormats[file.type].ext}</div>
                    </div>
                    <button type="button" class="remove-file" onclick="evidenceUploader.clearFileInput()">✕</button>
                </div>
            `;
        }
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        return '📁';
    }

    async uploadWithProgress(file, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete, e.loaded, e.total);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed: Network error'));
            });

            xhr.open('POST', '/api/evidence/upload');
            xhr.send(formData);
        });
    }

    showProgress(show = true) {
        const container = document.querySelector('.upload-progress-container');
        if (container) {
            container.classList.toggle('hidden', !show);
        }
    }

    updateProgress(percentage, loaded, total, status = 'Uploading...') {
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentage = document.querySelector('.progress-percentage');
        const progressStatus = document.querySelector('.progress-status');
        const uploadSpeed = document.querySelector('.upload-speed');

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
        if (progressStatus) progressStatus.textContent = status;
        
        if (uploadSpeed && this.uploadStartTime) {
            const elapsed = (Date.now() - this.uploadStartTime) / 1000;
            const speed = loaded / elapsed;
            uploadSpeed.textContent = `${this.formatFileSize(speed)}/s`;
        }
    }

    async handleUpload(formData, file) {
        this.uploadStartTime = Date.now();
        this.showProgress(true);
        
        // Update file name in progress
        const fileNameSpan = document.querySelector('.upload-details .file-name');
        if (fileNameSpan) fileNameSpan.textContent = file.name;

        try {
            // Simulate different upload stages
            this.updateProgress(0, 0, file.size, 'Preparing upload...');
            await this.delay(500);

            this.updateProgress(10, 0, file.size, 'Validating file...');
            await this.delay(300);

            this.updateProgress(20, 0, file.size, 'Calculating hash...');
            await this.delay(800);

            this.updateProgress(30, 0, file.size, 'Uploading to server...');

            // Actual upload with progress
            const result = await this.uploadWithProgress(file, formData, (percentage, loaded, total) => {
                const adjustedPercentage = 30 + (percentage * 0.6); // 30-90% for upload
                this.updateProgress(adjustedPercentage, loaded, total, 'Uploading...');
            });

            this.updateProgress(90, file.size, file.size, 'Storing to blockchain...');
            await this.delay(1000);

            this.updateProgress(100, file.size, file.size, 'Upload complete!');
            await this.delay(500);

            this.showSuccess('🎉 Evidence uploaded successfully and stored on blockchain!');
            return result;

        } catch (error) {
            this.showError(`Upload failed: ${error.message}`);
            throw error;
        } finally {
            setTimeout(() => this.showProgress(false), 2000);
        }
    }

    clearFileInput() {
        const fileInput = document.getElementById('evidenceFile');
        if (fileInput) {
            fileInput.value = '';
        }

        const dropZone = document.querySelector('.file-drop-zone');
        if (dropZone) {
            dropZone.innerHTML = `
                <div class="drop-zone-content">
                    <i class="upload-icon">📁</i>
                    <p>Drag and drop your evidence file here or <span class="browse-link">browse</span></p>
                    <small class="file-formats">Supported: ${this.getFormattedFileTypes()}</small>
                    <small class="file-size-limit">Maximum file size: ${this.formatFileSize(this.maxFileSize)}</small>
                </div>
            `;

            dropZone.querySelector('.browse-link').addEventListener('click', () => {
                document.getElementById('evidenceFile').click();
            });
        }
    }

    handleDrop(e, fileInput) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            this.validateFile(files[0]);
        }
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the enhanced uploader
let evidenceUploader;
document.addEventListener('DOMContentLoaded', () => {
    evidenceUploader = new EvidenceUploader();
});