/**
 * Enhanced UI Interactions for Blockchain Evidence Management System
 * Adds smooth animations, scroll effects, and professional user experience
 */

(function() {
    'use strict';

    // Initialize all enhancements when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        initNavbarScroll();
        initSmoothScrollLinks();
        initCardAnimations();
        initParallaxEffect();
        initFormEnhancements();
        initLoadingAnimations();
        initTooltips();
        initMenuToggle();
    }

    /**
     * Enhanced Navbar Scroll Effect
     */
    function initNavbarScroll() {
        const header = document.querySelector('.header-nav');
        if (!header) return;

        let lastScroll = 0;
        const scrollThreshold = 100;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add scrolled class for styling
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Auto-hide on scroll down (optional)
            if (currentScroll > scrollThreshold) {
                if (currentScroll > lastScroll && !header.classList.contains('scroll-hidden')) {
                    // Scrolling down
                    // Uncomment to enable auto-hide: header.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    header.style.transform = 'translateY(0)';
                }
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    function initSmoothScrollLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || !href) return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without jumping
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    /**
     * Card Entrance Animations
     */
    function initCardAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(30px)';
                    
                    setTimeout(() => {
                        entry.target.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 100);
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe cards, sections, and other elements
        const animateElements = document.querySelectorAll('.card, .step-item, .role-card, .doc-item, .contact-item, .faq-item');
        animateElements.forEach((el, index) => {
            // Stagger the animations
            el.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(el);
        });
    }

    /**
     * Parallax Effect for Hero Section
     */
    function initParallaxEffect() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            
            if (scrolled < window.innerHeight) {
                heroSection.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
                heroSection.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
            }
        }, { passive: true });
    }

    /**
     * Form Field Enhancements
     */
    function initFormEnhancements() {
        // Add floating label effect
        const formControls = document.querySelectorAll('.form-control');
        
        formControls.forEach(input => {
            // Add focus/blur effects
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('form-group-focused');
            });

            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('form-group-focused');
                if (this.value) {
                    this.parentElement.classList.add('form-group-filled');
                } else {
                    this.parentElement.classList.remove('form-group-filled');
                }
            });

            // Check initial state
            if (input.value) {
                input.parentElement.classList.add('form-group-filled');
            }
        });

        // Add validation feedback
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                // Add visual feedback for form submission
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.classList.add('btn-loading');
                }
            });
        });
    }

    /**
     * Loading Animations
     */
    function initLoadingAnimations() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple CSS if not exists
        if (!document.getElementById('ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                .btn {
                    position: relative;
                    overflow: hidden;
                }
                .ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple-animation 0.6s ease-out;
                    pointer-events: none;
                }
                @keyframes ripple-animation {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
                .btn-loading {
                    position: relative;
                    pointer-events: none;
                }
                .btn-loading::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    top: 50%;
                    left: 50%;
                    margin-left: -8px;
                    margin-top: -8px;
                    border: 2px solid transparent;
                    border-top-color: currentColor;
                    border-radius: 50%;
                    animation: button-loading-spinner 0.6s linear infinite;
                }
                @keyframes button-loading-spinner {
                    from { transform: rotate(0turn); }
                    to { transform: rotate(1turn); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Simple Tooltips
     */
    function initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(el => {
            el.addEventListener('mouseenter', function(e) {
                const tooltipText = this.getAttribute('data-tooltip');
                if (!tooltipText) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = tooltipText;
                document.body.appendChild(tooltip);

                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

                setTimeout(() => tooltip.classList.add('visible'), 10);

                this._tooltip = tooltip;
            });

            el.addEventListener('mouseleave', function() {
                if (this._tooltip) {
                    this._tooltip.classList.remove('visible');
                    setTimeout(() => {
                        if (this._tooltip) {
                            this._tooltip.remove();
                            delete this._tooltip;
                        }
                    }, 200);
                }
            });
        });

        // Add tooltip styles
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `
                .custom-tooltip {
                    position: fixed;
                    background: rgba(17, 24, 39, 0.95);
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    pointer-events: none;
                    z-index: 10000;
                    opacity: 0;
                    transform: translateY(5px);
                    transition: opacity 0.2s, transform 0.2s;
                    white-space: nowrap;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .custom-tooltip.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Enhanced Mobile Menu Toggle
     */
    function initMenuToggle() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (!menuToggle || !navMenu) return;

        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            
            // Update icon
            const icon = menuToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.setAttribute('data-lucide', 'x');
                } else {
                    icon.setAttribute('data-lucide', 'menu');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });
    }

    /**
     * Page Load Animation
     */
    window.addEventListener('load', () => {
        document.body.classList.add('page-loaded');
        
        // Add page load animation styles
        if (!document.getElementById('page-load-styles')) {
            const style = document.createElement('style');
            style.id = 'page-load-styles';
            style.textContent = `
                body {
                    opacity: 0;
                    transition: opacity 0.3s ease-in;
                }
                body.page-loaded {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    });

    /**
     * Add subtle mouse tracking effect to cards (optional)
     */
    function initCardMouseTracking() {
        const cards = document.querySelectorAll('.card, .role-card, .step-item');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }

    // Uncomment to enable 3D card effect
    // initCardMouseTracking();

    /**
     * Console branding (professional touch)
     */
    console.log('%c🔐 Blockchain Evidence Management System', 'color: #2563eb; font-size: 20px; font-weight: bold;');
    console.log('%c💼 Professional UI v2.0', 'color: #10b981; font-size: 14px;');
    console.log('%cBuilt for Law Enforcement & Legal Professionals', 'color: #6b7280; font-size: 12px; font-style: italic;');

})();
