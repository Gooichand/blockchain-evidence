// Specialized Viewer Classes for Evidence Preview System

// PDF Viewer Class
class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageCount = 0;
        this.scale = 1.0;
        this.canvas = null;
        this.ctx = null;
        this.renderTask = null;
    }

    async load(evidence) {
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        try {
            // For demo purposes, we'll create a mock PDF or load from a URL
            const pdfUrl = this.getMockPdfUrl(evidence);
            
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            this.pdfDoc = await loadingTask.promise;
            this.pageCount = this.pdfDoc.numPages;
            
            document.getElementById('pageCount').textContent = this.pageCount;
            document.getElementById('pageNum').max = this.pageCount;
            
            await this.renderPage(this.pageNum);
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw new Error('Failed to load PDF document');
        }
    }

    getMockPdfUrl(evidence) {
        // In a real implementation, this would fetch the actual PDF file
        // For demo, we'll use a sample PDF or create one
        return 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgo3MiA3MjAgVGQKKEV2aWRlbmNlIERvY3VtZW50KSBUagpFVApzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0NSAwMDAwMCBuIAowMDAwMDAwMzIyIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE0CiUlRU9G';
    }

    async renderPage(num) {
        if (this.renderTask) {
            this.renderTask.cancel();
        }

        const page = await this.pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: this.scale });
        
        this.canvas.height = viewport.height;
        this.canvas.width = viewport.width;

        const renderContext = {
            canvasContext: this.ctx,
            viewport: viewport
        };

        this.renderTask = page.render(renderContext);
        await this.renderTask.promise;
        
        this.pageNum = num;
        document.getElementById('pageNum').value = num;
        this.updateZoomDisplay();
    }

    async previousPage() {
        if (this.pageNum <= 1) return;
        await this.renderPage(this.pageNum - 1);
    }

    async nextPage() {
        if (this.pageNum >= this.pageCount) return;
        await this.renderPage(this.pageNum + 1);
    }

    async goToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.pageCount) return;
        await this.renderPage(pageNum);
    }

    async zoomPdf(factor) {
        this.scale *= factor;
        await this.renderPage(this.pageNum);
    }

    updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = Math.round(this.scale * 100) + '%';
    }

    cleanup() {
        if (this.renderTask) {
            this.renderTask.cancel();
        }
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
        }
    }
}

// Image Viewer Class
class ImageViewer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.fabricCanvas = null;
        this.image = null;
        this.scale = 1;
        this.rotation = 0;
        this.panX = 0;
        this.panY = 0;
        this.annotationsEnabled = false;
    }

    async load(evidence) {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        try {
            const imageUrl = this.getMockImageUrl(evidence);
            this.image = new Image();
            
            await new Promise((resolve, reject) => {
                this.image.onload = resolve;
                this.image.onerror = reject;
                this.image.src = imageUrl;
            });

            this.setupCanvas();
            this.renderImage();
            this.updateImageInfo();
            
        } catch (error) {
            console.error('Error loading image:', error);
            throw new Error('Failed to load image');
        }
    }

    getMockImageUrl(evidence) {
        // Generate a mock image or use a placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Create a gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some text
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Evidence Image', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(evidence.file_name, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`ID: ${evidence.id}`, canvas.width / 2, canvas.height / 2 + 60);
        
        return canvas.toDataURL();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Setup Fabric.js for annotations
        this.fabricCanvas = new fabric.Canvas(this.canvas);
        this.fabricCanvas.isDrawingMode = false;
        
        // Add pan and zoom functionality
        this.setupPanZoom();
    }

    setupPanZoom() {
        let isDragging = false;
        let lastX, lastY;

        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.annotationsEnabled) {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging && !this.annotationsEnabled) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                this.panX += deltaX;
                this.panY += deltaY;
                lastX = e.clientX;
                lastY = e.clientY;
                this.renderImage();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(zoomFactor);
        });
    }

    renderImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2 + this.panX, this.canvas.height / 2 + this.panY);
        this.ctx.rotate(this.rotation * Math.PI / 180);
        this.ctx.scale(this.scale, this.scale);
        
        const drawWidth = this.image.width;
        const drawHeight = this.image.height;
        
        this.ctx.drawImage(
            this.image,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
        );
        
        this.ctx.restore();
        this.updateImageInfo();
    }

    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(10, this.scale));
        this.renderImage();
    }

    rotate(degrees) {
        this.rotation += degrees;
        this.rotation = this.rotation % 360;
        this.renderImage();
    }

    reset() {
        this.scale = 1;
        this.rotation = 0;
        this.panX = 0;
        this.panY = 0;
        this.renderImage();
    }

    fitToScreen() {
        const scaleX = this.canvas.width / this.image.width;
        const scaleY = this.canvas.height / this.image.height;
        this.scale = Math.min(scaleX, scaleY) * 0.9;
        this.panX = 0;
        this.panY = 0;
        this.renderImage();
    }

    actualSize() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.renderImage();
    }

    toggleAnnotations() {
        this.annotationsEnabled = !this.annotationsEnabled;
        const tools = document.querySelector('.annotation-tools');
        tools.style.display = this.annotationsEnabled ? 'block' : 'none';
        
        if (this.annotationsEnabled) {
            this.fabricCanvas.isDrawingMode = true;
            this.fabricCanvas.freeDrawingBrush.width = 3;
            this.fabricCanvas.freeDrawingBrush.color = '#ff0000';
        } else {
            this.fabricCanvas.isDrawingMode = false;
        }
    }

    updateImageInfo() {
        document.getElementById('imageResolution').textContent = `${this.image.width} × ${this.image.height}`;
        document.getElementById('imageZoom').textContent = Math.round(this.scale * 100) + '%';
    }

    cleanup() {
        if (this.fabricCanvas) {
            this.fabricCanvas.dispose();
        }
    }
}

// Video Viewer Class
class VideoViewer {
    constructor() {
        this.video = null;
        this.isPlaying = false;
        this.currentFrame = 0;
        this.frameRate = 30;
    }

    async load(evidence) {
        this.video = document.getElementById('videoPlayer');
        
        try {
            const videoUrl = this.getMockVideoUrl(evidence);
            this.video.src = videoUrl;
            
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = resolve;
                this.video.onerror = reject;
            });

            this.setupVideoControls();
            this.updateVideoInfo();
            
        } catch (error) {
            console.error('Error loading video:', error);
            throw new Error('Failed to load video');
        }
    }

    getMockVideoUrl(evidence) {
        // For demo purposes, create a canvas-based video or use a sample
        // In real implementation, this would be the actual video file
        return 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTYgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAGGlvZHMAAAAAEICAgAcAT////v7/AAAF+XRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAALgAAAB4AAAAAAACRlbW1kaWEAAAAgbWRoZAAAAAAAAAAAAAAAAAAAKAAAABQAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAALgAAAB4AAASAAAAEhhdmNDAQBkAB//4QAaZ2QAH6zZQbCWhAAAAwAEAAADAPA8SJZYAQAGaOvjyyLAAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAABAAAAFAAAABxzdHNjAAAAAAAAAAEAAAABAAAAAQAAAAEAAAAUc3RzegAAAAAAAAAEAAAAASAAAAEUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTcuODMuMTAw';
    }

    setupVideoControls() {
        this.video.addEventListener('timeupdate', () => {
            this.updateTimeDisplay();
        });

        this.video.addEventListener('loadedmetadata', () => {
            this.updateDurationDisplay();
        });

        // Custom controls
        document.getElementById('playbackSpeed').addEventListener('change', (e) => {
            this.video.playbackRate = parseFloat(e.target.value);
        });
    }

    togglePlayback() {
        if (this.video.paused) {
            this.video.play();
            this.isPlaying = true;
        } else {
            this.video.pause();
            this.isPlaying = false;
        }
    }

    skip(seconds) {
        this.video.currentTime += seconds;
    }

    setSpeed(speed) {
        this.video.playbackRate = speed;
    }

    updateTimeDisplay() {
        const current = this.formatTime(this.video.currentTime);
        document.getElementById('currentTime').textContent = current;
    }

    updateDurationDisplay() {
        const duration = this.formatTime(this.video.duration);
        document.getElementById('duration').textContent = duration;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    cleanup() {
        if (this.video) {
            this.video.pause();
            this.video.src = '';
        }
    }
}

// Audio Viewer Class
class AudioViewer {
    constructor() {
        this.audio = null;
        this.audioContext = null;
        this.analyser = null;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
    }

    async load(evidence) {
        this.audio = document.getElementById('audioPlayer');
        this.canvas = document.getElementById('audioCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        try {
            const audioUrl = this.getMockAudioUrl(evidence);
            this.audio.src = audioUrl;
            
            await this.setupAudioContext();
            this.setupControls();
            this.startVisualization();
            
        } catch (error) {
            console.error('Error loading audio:', error);
            throw new Error('Failed to load audio');
        }
    }

    getMockAudioUrl(evidence) {
        // Generate a simple audio tone for demo
        return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    }

    async setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        const source = this.audioContext.createMediaElementSource(this.audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.analyser.fftSize = 256;
    }

    setupControls() {
        document.getElementById('playPauseAudio').addEventListener('click', () => {
            this.togglePlayback();
        });

        document.getElementById('audioSeeker').addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        });

        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
        });

        this.audio.addEventListener('timeupdate', () => {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            document.getElementById('audioSeeker').value = progress;
        });
    }

    togglePlayback() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    startVisualization() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            this.ctx.fillStyle = 'rgb(0, 0, 0)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const barWidth = (this.canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                this.ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                this.ctx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    cleanup() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Document Viewer Class
class DocumentViewer {
    constructor() {
        this.documentData = null;
    }

    async load(evidence) {
        try {
            this.documentData = evidence;
            this.displayDocumentInfo();
        } catch (error) {
            console.error('Error loading document:', error);
            throw new Error('Failed to load document');
        }
    }

    displayDocumentInfo() {
        document.getElementById('documentSize').textContent = this.formatFileSize(this.documentData.file_size);
        document.getElementById('documentType').textContent = this.documentData.type;
        
        const preview = document.querySelector('.document-preview');
        preview.innerHTML = `
            <div class="document-icon">${this.getDocumentIcon(this.documentData.type)}</div>
            <h3>${this.documentData.file_name}</h3>
            <p>Document preview not available for this format.</p>
            <p>File size: ${this.formatFileSize(this.documentData.file_size)}</p>
            <button class="preview-btn" onclick="evidencePreview.downloadEvidence()">
                📄 Download to View
            </button>
        `;
    }

    getDocumentIcon(mimeType) {
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
        if (mimeType.includes('text')) return '📄';
        return '📋';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    cleanup() {
        // No cleanup needed for document viewer
    }
}

// Archive Viewer Class
class ArchiveViewer {
    constructor() {
        this.archiveData = null;
        this.extractedFiles = [];
    }

    async load(evidence) {
        try {
            this.archiveData = evidence;
            await this.analyzeArchive();
            this.displayArchiveInfo();
        } catch (error) {
            console.error('Error loading archive:', error);
            throw new Error('Failed to load archive');
        }
    }

    async analyzeArchive() {
        // Mock archive analysis
        this.extractedFiles = [
            { name: 'document1.pdf', size: 1024000, type: 'application/pdf' },
            { name: 'image1.jpg', size: 512000, type: 'image/jpeg' },
            { name: 'folder/', size: 0, type: 'directory' },
            { name: 'folder/data.txt', size: 2048, type: 'text/plain' }
        ];
    }

    displayArchiveInfo() {
        document.getElementById('archiveFileCount').textContent = `${this.extractedFiles.length} files`;
        document.getElementById('archiveSize').textContent = this.formatFileSize(this.archiveData.file_size);
        
        const tree = document.getElementById('archiveTree');
        tree.innerHTML = this.generateFileTree();
    }

    generateFileTree() {
        return this.extractedFiles.map(file => `
            <div class="archive-file-item">
                <span class="file-icon">${this.getFileIcon(file.type)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
        `).join('');
    }

    getFileIcon(type) {
        if (type === 'directory') return '📁';
        if (type.includes('image')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('text')) return '📝';
        return '📋';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    cleanup() {
        // No cleanup needed for archive viewer
    }
}