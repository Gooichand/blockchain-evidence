document.addEventListener('DOMContentLoaded', function () {
    const loadingScreen = document.getElementById('loading-screen');
    const progressFill = document.querySelector('.progress-fill');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressText = document.querySelector('.progress-text');
    const messages = document.querySelectorAll('.loading-messages .message');

    let currentMessage = 0;
    let messageInterval = null;
    let loadingCompleted = false;

    const MINIMUM_DISPLAY_TIME = 5000;
    const startTime = Date.now();

    /* ------------------ INIT ------------------ */

    function initLoadingScreen() {
        simulateLoading();
        startMessageCycle();
    }

    /* ------------------ FAKE PROGRESS ------------------ */

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
                if (!loadingCompleted) {
                    setProgress(step.progress);
                    if (progressText) progressText.textContent = step.text;
                }
            }, index * 600);
        });
    }

    /* ------------------ MESSAGE CYCLING ------------------ */

    function startMessageCycle() {
        if (messages.length === 0) return;

        messageInterval = setInterval(() => {
            messages[currentMessage].classList.remove('active');
            currentMessage = (currentMessage + 1) % messages.length;
            messages[currentMessage].classList.add('active');
        }, 2000);
    }

    function stopMessageCycle() {
        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
    }

    /* ------------------ PROGRESS ------------------ */

    function setProgress(value) {
        if (progressFill) progressFill.style.width = `${value}%`;
        if (progressPercentage) progressPercentage.textContent = `${value}%`;
    }

    /* ------------------ PUBLIC API ------------------ */
   
    window.completeLoading = function () {
        if (loadingCompleted) return;
        loadingCompleted = true;

        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);

        setTimeout(() => {
            setProgress(100);
            stopMessageCycle();

            loadingScreen.classList.add('fade-out');

            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 800);
        }, remainingTime);
    };

    initLoadingScreen();
});