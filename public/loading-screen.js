document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressText = document.querySelector('.progress-text');
    const messages = document.querySelectorAll('.loading-messages .message');
    
    let currentMessage = 0;
    let progress = 0;
    let startTime = Date.now();
    const MINIMUM_DISPLAY_TIME = 5000; 
    
    function initLoadingScreen() {
        simulateLoading();
        cycleMessages();
        
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime);
        
        setTimeout(() => {
            setProgress(100);
            
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 800);
            }, 500);
        }, remainingTime);
    }
    
    function simulateLoading() {
        const steps = [
            { progress: 20, text: 'Initializing Blockchain Layer...' },
            { progress: 40, text: 'Loading Digital Evidence Database...' },
            { progress: 60, text: 'Verifying Chain of Custody...' },
            { progress: 80, text: 'Applying Access Controls...' },
            { progress: 95, text: 'Finalizing Audit Logs...' }
        ];
        
        steps.forEach((step, index) => {
            setTimeout(() => {
                setProgress(step.progress);
                if (progressText) progressText.textContent = step.text;
            }, index * 600); 
        });
    }
    
    function cycleMessages() {
        setInterval(() => {
            if (messages.length > 0) {
                messages[currentMessage].classList.remove('active');
                currentMessage = (currentMessage + 1) % messages.length;
                messages[currentMessage].classList.add('active');
            }
        }, 2000);
    }
    
    function setProgress(value) {
        progress = value;
        if (progressFill) progressFill.style.width = `${value}%`;
        if (progressPercentage) progressPercentage.textContent = `${value}%`;
    }
    
    initLoadingScreen();
});