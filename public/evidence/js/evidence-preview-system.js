// Evidence Preview System - Comprehensive Multi-Format Viewer
class EvidencePreviewSystem {
    constructor() {
        this.currentEvidence = null;
        this.currentViewer = null;
        this.previewModal = null;
        this.watermarkEnabled = true;
        this.downloadPermissions = new Set(['investigator', 'forensic_analyst', 'legal_professional', 'evidence_manager', 'admin']);
        this.viewerInstances = new Map();
        this.supportedFormats = {
            pdf: ['application/pdf'],
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
            video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'],
            audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'],
            document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'],
            archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
        };
        this.init();
    }

    init() {
        this.createPreviewModal();
        this.setupEventListeners();
        this.loadExternalLibraries();
        this.initializeViewers();
    }

    async loadExternalLibraries() {
        // Load PDF.js
        if (!window.pdfjsLib) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        // Load Pannellum for 360° image viewing
        if (!window.pannellum) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js');
            await this.loadCSS('https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css');
        }

        // Load Fabric.js for image annotations
        if (!window.fabric) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js');
        }

        // Load JSZip for archive preview
        if (!window.JSZip) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadCSS(href) {
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            document.head.appendChild(link);
        });
    }

    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'evidence-preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-overlay" onclick="evidencePreview.closePreview()"></div>
            <div class="preview-modal-container">
                <div class="preview-modal-header">
                    <div class="preview-header-info">
                        <h2 class="preview-title">Evidence Preview</h2>
                        <div class="preview-metadata">
                            <span class="evidence-id"></span>
                            <span class="evidence-type"></span>
                            <span class="evidence-size"></span>
                        </div>
                    </div>
                    <div class="preview-header-controls">
                        <div class="preview-toolbar">
                            <button class="preview-btn" id="toggleWatermark" title="Toggle Watermark">
                                <i class="icon-watermark">💧</i>
                            </button>
                            <button class="preview-btn" id="toggleFullscreen" title="Fullscreen">
                                <i class="icon-fullscreen">⛶</i>
                            </button>
                            <button class="preview-btn" id="rotateLeft" title="Rotate Left">
                                <i class="icon-rotate-left">↺</i>
                            </button>
                            <button class="preview-btn" id="rotateRight" title="Rotate Right">
                                <i class="icon-rotate-right">↻</i>
                            </button>
                            <button class="preview-btn" id="zoomIn" title="Zoom In">
                                <i class="icon-zoom-in">🔍+</i>
                            </button>
                            <button class="preview-btn" id="zoomOut" title="Zoom Out">
                                <i class="icon-zoom-out">🔍-</i>
                            </button>
                            <button class="preview-btn" id="resetView" title="Reset View">
                                <i class="icon-reset">↻</i>
                            </button>
                            <button class="preview-btn download-btn" id="downloadOriginal" title="Download Original">
                                <i class="icon-download">⬇️</i>
                            </button>
                        </div>
                        <button class="preview-close" onclick="evidencePreview.closePreview()">✕</button>
                    </div>
                </div>
                <div class="preview-modal-body">
                    <div class="preview-content-container">
                        <div class="preview-viewer-area">
                            <!-- PDF Viewer -->
                            <div class="pdf-viewer viewer-container" style="display: none;">
                                <div class="pdf-controls">
                                    <button class="pdf-btn" id="prevPage">◀ Previous</button>
                                    <span class="page-info">
                                        Page <input type="number" id="pageNum" min="1" value="1"> of <span id="pageCount">0</span>
                                    </span>
                                    <button class="pdf-btn" id="nextPage">Next ▶</button>
                                    <div class="pdf-zoom-controls">
                                        <button class="pdf-btn" id="zoomOutPdf">-</button>
                                        <span id="zoomLevel">100%</span>
                                        <button class="pdf-btn" id="zoomInPdf">+</button>
                                    </div>
                                </div>
                                <div class="pdf-canvas-container">
                                    <canvas id="pdfCanvas"></canvas>
                                </div>
                            </div>

                            <!-- Image Viewer -->
                            <div class="image-viewer viewer-container" style="display: none;">
                                <div class="image-controls">
                                    <button class="img-btn" id="fitToScreen">Fit to Screen</button>
                                    <button class="img-btn" id="actualSize">Actual Size</button>
                                    <button class="img-btn" id="toggleAnnotations">Annotations</button>
                                    <div class="image-info">
                                        <span id="imageResolution"></span>
                                        <span id="imageZoom">100%</span>
                                    </div>
                                </div>
                                <div class="image-canvas-container">
                                    <canvas id="imageCanvas"></canvas>
                                </div>
                                <div class="annotation-tools" style="display: none;">
                                    <button class="annotation-btn" data-tool="pen">✏️ Pen</button>
                                    <button class="annotation-btn" data-tool="rectangle">⬜ Rectangle</button>
                                    <button class="annotation-btn" data-tool="circle">⭕ Circle</button>
                                    <button class="annotation-btn" data-tool="arrow">➡️ Arrow</button>
                                    <button class="annotation-btn" data-tool="text">📝 Text</button>
                                    <input type="color" id="annotationColor" value="#ff0000">
                                    <button class="annotation-btn" id="clearAnnotations">🗑️ Clear</button>
                                </div>
                            </div>

                            <!-- Video Viewer -->
                            <div class="video-viewer viewer-container" style="display: none;">
                                <div class="video-controls-top">
                                    <button class="video-btn" id="togglePlayback">⏯️</button>
                                    <button class="video-btn" id="skipBackward">⏪</button>
                                    <button class="video-btn" id="skipForward">⏩</button>
                                    <div class="video-time">
                                        <span id="currentTime">00:00</span> / <span id="duration">00:00</span>
                                    </div>
                                    <div class="video-speed">
                                        <select id="playbackSpeed">
                                            <option value="0.25">0.25x</option>
                                            <option value="0.5">0.5x</option>
                                            <option value="1" selected>1x</option>
                                            <option value="1.25">1.25x</option>
                                            <option value="1.5">1.5x</option>
                                            <option value="2">2x</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="video-container">
                                    <video id="videoPlayer" controls preload="metadata">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                                <div class="video-analysis-tools">
                                    <button class="analysis-btn" id="frameByFrame">Frame by Frame</button>
                                    <button class="analysis-btn" id="captureFrame">📸 Capture Frame</button>
                                    <button class="analysis-btn" id="videoMetadata">📊 Metadata</button>
                                </div>
                            </div>

                            <!-- Audio Viewer -->
                            <div class="audio-viewer viewer-container" style="display: none;">
                                <div class="audio-visualizer">
                                    <canvas id="audioCanvas"></canvas>
                                </div>
                                <div class="audio-controls">
                                    <button class="audio-btn" id="playPauseAudio">⏯️</button>
                                    <div class="audio-progress">
                                        <input type="range" id="audioSeeker" min="0" max="100" value="0">
                                    </div>
                                    <div class="audio-volume">
                                        <button class="audio-btn" id="muteAudio">🔊</button>
                                        <input type="range" id="volumeControl" min="0" max="100" value="50">
                                    </div>
                                </div>
                                <audio id="audioPlayer" preload="metadata"></audio>
                            </div>

                            <!-- Document Viewer -->
                            <div class="document-viewer viewer-container" style="display: none;">
                                <div class="document-controls">
                                    <button class="doc-btn" id="downloadDoc">📄 Download</button>
                                    <div class="document-info">
                                        <span id="documentSize"></span>
                                        <span id="documentType"></span>
                                    </div>
                                </div>
                                <div class="document-content">
                                    <div class="document-preview">
                                        <div class="document-icon">📄</div>
                                        <p>Document preview not available. Click download to view the file.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Archive Viewer -->
                            <div class="archive-viewer viewer-container" style="display: none;">
                                <div class="archive-controls">
                                    <button class="archive-btn" id="extractArchive">📦 Extract</button>
                                    <div class="archive-info">
                                        <span id="archiveFileCount"></span>
                                        <span id="archiveSize"></span>
                                    </div>
                                </div>
                                <div class="archive-content">
                                    <div class="archive-tree" id="archiveTree"></div>
                                </div>
                            </div>

                            <!-- Unsupported Format -->
                            <div class="unsupported-viewer viewer-container" style="display: none;">
                                <div class="unsupported-content">
                                    <div class="unsupported-icon">❓</div>
                                    <h3>Preview Not Available</h3>
                                    <p>This file format is not supported for preview.</p>
                                    <button class="preview-btn download-btn" onclick="evidencePreview.downloadEvidence()">
                                        <i class="icon-download">⬇️</i> Download to View
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Watermark Overlay -->
                        <div class="watermark-overlay" id="watermarkOverlay">
                            <div class="watermark-text">FOR DEMONSTRATION ONLY</div>
                            <div class="watermark-details">
                                <div class="watermark-case">Case: <span id="watermarkCase"></span></div>
                                <div class="watermark-user">Viewed by: <span id="watermarkUser"></span></div>
                                <div class="watermark-time">Time: <span id="watermarkTime"></span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Evidence Information Panel -->
                    <div class="evidence-info-panel">
                        <div class="info-section">
                            <h3>Evidence Details</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Evidence ID:</label>
                                    <span id="infoEvidenceId"></span>
                                </div>
                                <div class="info-item">
                                    <label>Case ID:</label>
                                    <span id="infoCaseId"></span>
                                </div>
                                <div class="info-item">
                                    <label>File Name:</label>
                                    <span id="infoFileName"></span>
                                </div>
                                <div class="info-item">
                                    <label>File Size:</label>
                                    <span id="infoFileSize"></span>
                                </div>
                                <div class="info-item">
                                    <label>File Type:</label>
                                    <span id="infoFileType"></span>
                                </div>
                                <div class="info-item">
                                    <label>Hash (SHA-256):</label>
                                    <span id="infoHash" class="hash-display"></span>
                                </div>
                                <div class="info-item">
                                    <label>Submitted By:</label>
                                    <span id="infoSubmittedBy"></span>
                                </div>
                                <div class="info-item">
                                    <label>Timestamp:</label>
                                    <span id="infoTimestamp"></span>
                                </div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h3>Chain of Custody</h3>
                            <div class="custody-timeline" id="custodyTimeline">
                                <!-- Populated dynamically -->
                            </div>
                        </div>

                        <div class="info-section">
                            <h3>Actions</h3>
                            <div class="action-buttons">
                                <button class="action-btn verify-btn" onclick="evidencePreview.verifyIntegrity()">
                                    🔍 Verify Integrity
                                </button>
                                <button class="action-btn blockchain-btn" onclick="evidencePreview.viewBlockchainProof()">
                                    ⛓️ Blockchain Proof
                                </button>
                                <button class="action-btn export-btn" onclick="evidencePreview.exportMetadata()">
                                    📊 Export Metadata
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.previewModal = modal;
    }

    setupEventListeners() {
        // Toolbar controls
        document.getElementById('toggleWatermark').addEventListener('click', () => this.toggleWatermark());
        document.getElementById('toggleFullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('rotateLeft').addEventListener('click', () => this.rotateView(-90));
        document.getElementById('rotateRight').addEventListener('click', () => this.rotateView(90));
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomView(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomView(0.8));
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('downloadOriginal').addEventListener('click', () => this.downloadEvidence());

        // PDF controls
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        document.getElementById('pageNum').addEventListener('change', (e) => this.goToPage(parseInt(e.target.value)));
        document.getElementById('zoomInPdf').addEventListener('click', () => this.zoomPdf(1.2));
        document.getElementById('zoomOutPdf').addEventListener('click', () => this.zoomPdf(0.8));

        // Image controls
        document.getElementById('fitToScreen').addEventListener('click', () => this.fitImageToScreen());
        document.getElementById('actualSize').addEventListener('click', () => this.showActualSize());
        document.getElementById('toggleAnnotations').addEventListener('click', () => this.toggleAnnotations());

        // Video controls
        document.getElementById('togglePlayback').addEventListener('click', () => this.toggleVideoPlayback());
        document.getElementById('skipBackward').addEventListener('click', () => this.skipVideo(-10));
        document.getElementById('skipForward').addEventListener('click', () => this.skipVideo(10));
        document.getElementById('playbackSpeed').addEventListener('change', (e) => this.setPlaybackSpeed(e.target.value));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    initializeViewers() {
        this.viewerInstances.set('pdf', new PDFViewer());
        this.viewerInstances.set('image', new ImageViewer());
        this.viewerInstances.set('video', new VideoViewer());
        this.viewerInstances.set('audio', new AudioViewer());
        this.viewerInstances.set('document', new DocumentViewer());
        this.viewerInstances.set('archive', new ArchiveViewer());
    }

    async openPreview(evidenceId, evidenceData = null) {
        try {
            this.currentEvidence = evidenceData || await this.fetchEvidenceData(evidenceId);
            
            if (!this.currentEvidence) {
                throw new Error('Evidence not found');
            }

            this.showModal();
            this.populateEvidenceInfo();
            this.setupWatermark();
            await this.loadAndDisplayEvidence();
            this.logPreviewAccess();

        } catch (error) {
            console.error('Error opening preview:', error);
            this.showError('Failed to load evidence preview: ' + error.message);
        }
    }

    async fetchEvidenceData(evidenceId) {
        const response = await fetch(`/api/evidence/${evidenceId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch evidence data');
        }
        return await response.json();
    }

    showModal() {
        this.previewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closePreview() {
        this.previewModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.cleanup();
    }

    cleanup() {
        // Stop any playing media
        const video = document.getElementById('videoPlayer');
        const audio = document.getElementById('audioPlayer');
        
        if (video) video.pause();
        if (audio) audio.pause();

        // Clear canvases
        const canvases = this.previewModal.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Reset viewer states
        this.viewerInstances.forEach(viewer => {
            if (viewer.cleanup) viewer.cleanup();
        });

        this.currentEvidence = null;
        this.currentViewer = null;
    }

    populateEvidenceInfo() {
        const evidence = this.currentEvidence;
        
        // Header info
        document.querySelector('.preview-title').textContent = evidence.title || evidence.file_name;
        document.querySelector('.evidence-id').textContent = `ID: ${evidence.id}`;
        document.querySelector('.evidence-type').textContent = evidence.type;
        document.querySelector('.evidence-size').textContent = this.formatFileSize(evidence.file_size);

        // Detailed info panel
        document.getElementById('infoEvidenceId').textContent = evidence.id;
        document.getElementById('infoCaseId').textContent = evidence.case_id;
        document.getElementById('infoFileName').textContent = evidence.file_name;
        document.getElementById('infoFileSize').textContent = this.formatFileSize(evidence.file_size);
        document.getElementById('infoFileType').textContent = evidence.type;
        document.getElementById('infoHash').textContent = evidence.hash;
        document.getElementById('infoSubmittedBy').textContent = evidence.submitted_by;
        document.getElementById('infoTimestamp').textContent = new Date(evidence.timestamp).toLocaleString();

        // Chain of custody
        this.populateChainOfCustody();
    }

    populateChainOfCustody() {
        const timeline = document.getElementById('custodyTimeline');
        const events = [
            {
                action: 'Evidence Uploaded',
                user: this.currentEvidence.submitted_by,
                timestamp: this.currentEvidence.timestamp,
                details: 'Initial evidence submission'
            },
            {
                action: 'Preview Accessed',
                user: this.getCurrentUser(),
                timestamp: new Date().toISOString(),
                details: 'Evidence preview opened'
            }
        ];

        timeline.innerHTML = events.map(event => `
            <div class="custody-event">
                <div class="custody-timestamp">${new Date(event.timestamp).toLocaleString()}</div>
                <div class="custody-action">${event.action}</div>
                <div class="custody-user">by ${event.user}</div>
                <div class="custody-details">${event.details}</div>
            </div>
        `).join('');
    }

    setupWatermark() {
        const overlay = document.getElementById('watermarkOverlay');
        const currentUser = this.getCurrentUser();
        
        document.getElementById('watermarkCase').textContent = this.currentEvidence.case_id;
        document.getElementById('watermarkUser').textContent = currentUser;
        document.getElementById('watermarkTime').textContent = new Date().toLocaleString();
        
        overlay.style.display = this.watermarkEnabled ? 'block' : 'none';
    }

    async loadAndDisplayEvidence() {
        const fileType = this.detectFileType(this.currentEvidence.type);
        const viewer = this.viewerInstances.get(fileType);
        
        if (!viewer) {
            this.showUnsupportedFormat();
            return;
        }

        this.currentViewer = viewer;
        this.hideAllViewers();
        this.showViewer(fileType);
        
        try {
            await viewer.load(this.currentEvidence);
        } catch (error) {
            console.error('Error loading evidence:', error);
            this.showError('Failed to load evidence: ' + error.message);
        }
    }

    detectFileType(mimeType) {
        for (const [type, formats] of Object.entries(this.supportedFormats)) {
            if (formats.includes(mimeType)) {
                return type;
            }
        }
        return 'unsupported';
    }

    hideAllViewers() {
        const viewers = this.previewModal.querySelectorAll('.viewer-container');
        viewers.forEach(viewer => viewer.style.display = 'none');
    }

    showViewer(type) {
        const viewer = this.previewModal.querySelector(`.${type}-viewer`);
        if (viewer) {
            viewer.style.display = 'block';
        }
    }

    showUnsupportedFormat() {
        this.hideAllViewers();
        this.showViewer('unsupported');
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Unknown User';
    }

    toggleWatermark() {
        this.watermarkEnabled = !this.watermarkEnabled;
        const overlay = document.getElementById('watermarkOverlay');
        overlay.style.display = this.watermarkEnabled ? 'block' : 'none';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.previewModal.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    async downloadEvidence() {
        const currentUser = this.getCurrentUser();
        const userRole = this.getUserRole();
        
        if (!this.downloadPermissions.has(userRole)) {
            this.showError('You do not have permission to download evidence files.');
            return;
        }

        try {
            const response = await fetch(`/api/evidence/${this.currentEvidence.id}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userWallet: currentUser,
                    reason: 'Evidence preview download'
                })
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentEvidence.file_name;
            a.click();
            window.URL.revokeObjectURL(url);

            this.logDownloadAction();

        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to download evidence: ' + error.message);
        }
    }

    getUserRole() {
        return localStorage.getItem('userRole') || 'public_viewer';
    }

    logPreviewAccess() {
        // Log preview access for audit trail
        fetch('/api/evidence/log-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                evidenceId: this.currentEvidence.id,
                action: 'preview_accessed',
                user: this.getCurrentUser(),
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }

    logDownloadAction() {
        fetch('/api/evidence/log-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                evidenceId: this.currentEvidence.id,
                action: 'evidence_downloaded',
                user: this.getCurrentUser(),
                timestamp: new Date().toISOString()
            })
        }).catch(console.error);
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    handleKeyboardShortcuts(e) {
        if (!this.previewModal.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                this.closePreview();
                break;
            case 'f':
            case 'F':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleFullscreen();
                }
                break;
            case 'w':
            case 'W':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleWatermark();
                }
                break;
            case 'd':
            case 'D':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.downloadEvidence();
                }
                break;
        }
    }

    // Additional methods for specific viewer controls
    rotateView(degrees) {
        if (this.currentViewer && this.currentViewer.rotate) {
            this.currentViewer.rotate(degrees);
        }
    }

    zoomView(factor) {
        if (this.currentViewer && this.currentViewer.zoom) {
            this.currentViewer.zoom(factor);
        }
    }

    resetView() {
        if (this.currentViewer && this.currentViewer.reset) {
            this.currentViewer.reset();
        }
    }

    // PDF specific methods
    previousPage() {
        if (this.currentViewer && this.currentViewer.previousPage) {
            this.currentViewer.previousPage();
        }
    }

    nextPage() {
        if (this.currentViewer && this.currentViewer.nextPage) {
            this.currentViewer.nextPage();
        }
    }

    goToPage(pageNum) {
        if (this.currentViewer && this.currentViewer.goToPage) {
            this.currentViewer.goToPage(pageNum);
        }
    }

    zoomPdf(factor) {
        if (this.currentViewer && this.currentViewer.zoomPdf) {
            this.currentViewer.zoomPdf(factor);
        }
    }

    // Image specific methods
    fitImageToScreen() {
        if (this.currentViewer && this.currentViewer.fitToScreen) {
            this.currentViewer.fitToScreen();
        }
    }

    showActualSize() {
        if (this.currentViewer && this.currentViewer.actualSize) {
            this.currentViewer.actualSize();
        }
    }

    toggleAnnotations() {
        if (this.currentViewer && this.currentViewer.toggleAnnotations) {
            this.currentViewer.toggleAnnotations();
        }
    }

    // Video specific methods
    toggleVideoPlayback() {
        if (this.currentViewer && this.currentViewer.togglePlayback) {
            this.currentViewer.togglePlayback();
        }
    }

    skipVideo(seconds) {
        if (this.currentViewer && this.currentViewer.skip) {
            this.currentViewer.skip(seconds);
        }
    }

    setPlaybackSpeed(speed) {
        if (this.currentViewer && this.currentViewer.setSpeed) {
            this.currentViewer.setSpeed(parseFloat(speed));
        }
    }

    // Action methods
    async verifyIntegrity() {
        try {
            const response = await fetch(`/api/evidence/${this.currentEvidence.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: this.getCurrentUser()
                })
            });

            const result = await response.json();
            
            if (result.verified) {
                this.showSuccess('Evidence integrity verified successfully');
            } else {
                this.showError('Evidence integrity verification failed');
            }
        } catch (error) {
            this.showError('Failed to verify evidence integrity');
        }
    }

    async viewBlockchainProof() {
        try {
            const response = await fetch(`/api/evidence/${this.currentEvidence.id}/blockchain-proof`);
            const proof = await response.json();
            
            // Show blockchain proof in a new modal or panel
            this.showBlockchainProof(proof);
        } catch (error) {
            this.showError('Failed to retrieve blockchain proof');
        }
    }

    showBlockchainProof(proof) {
        // Implementation for showing blockchain proof
        console.log('Blockchain proof:', proof);
    }

    exportMetadata() {
        const metadata = {
            evidenceId: this.currentEvidence.id,
            caseId: this.currentEvidence.case_id,
            fileName: this.currentEvidence.file_name,
            fileSize: this.currentEvidence.file_size,
            hash: this.currentEvidence.hash,
            timestamp: this.currentEvidence.timestamp,
            submittedBy: this.currentEvidence.submitted_by,
            exportedBy: this.getCurrentUser(),
            exportTimestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `evidence_${this.currentEvidence.id}_metadata.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize the evidence preview system
let evidencePreview;
document.addEventListener('DOMContentLoaded', () => {
    evidencePreview = new EvidencePreviewSystem();
});

// Export for global access
window.evidencePreview = evidencePreview;