// Help Center Functionality
class HelpCenter {
    constructor() {
        this.searchIndex = [];
        this.currentSection = 'getting-started';
        this.init();
    }

    init() {
        this.buildSearchIndex();
        this.setupEventListeners();
    }

    buildSearchIndex() {
        // Build search index from all help content
        const sections = document.querySelectorAll('.help-section');
        
        sections.forEach(section => {
            const sectionId = section.id.replace('-section', '');
            const articles = section.querySelectorAll('.help-article');
            
            articles.forEach(article => {
                const title = article.querySelector('h2')?.textContent || '';
                const content = article.textContent || '';
                
                this.searchIndex.push({
                    section: sectionId,
                    title: title,
                    content: content.toLowerCase(),
                    element: article
                });
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('helpSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                searchInput?.focus();
            }
        });
    }

    handleSearch() {
        const query = document.getElementById('helpSearch').value.toLowerCase().trim();
        
        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }

        const results = this.searchIndex.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.content.includes(query)
        );

        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        // Hide all sections first
        document.querySelectorAll('.help-section').forEach(section => {
            section.classList.remove('active');
        });

        // Create or update search results section
        let searchSection = document.getElementById('search-results-section');
        if (!searchSection) {
            searchSection = document.createElement('div');
            searchSection.id = 'search-results-section';
            searchSection.className = 'help-section';
            document.querySelector('.help-content').appendChild(searchSection);
        }

        searchSection.innerHTML = `
            <h1>Search Results for "${query}"</h1>
            <p class="search-meta">${results.length} result(s) found</p>
            
            ${results.length === 0 ? `
                <div class="no-results">
                    <i data-lucide="search-x"></i>
                    <h3>No results found</h3>
                    <p>Try different keywords or browse the categories on the left.</p>
                </div>
            ` : `
                <div class="search-results">
                    ${results.map(result => `
                        <div class="search-result-item" onclick="showHelpSection('${result.section}')">
                            <h3>${this.highlightText(result.title, query)}</h3>
                            <p class="result-section">${this.getSectionName(result.section)}</p>
                            <p class="result-excerpt">${this.getExcerpt(result.content, query)}</p>
                        </div>
                    `).join('')}
                </div>
            `}
        `;

        searchSection.classList.add('active');
        lucide.createIcons();

        // Update navigation
        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    clearSearchResults() {
        const searchSection = document.getElementById('search-results-section');
        if (searchSection) {
            searchSection.remove();
        }

        // Show the current section
        this.showSection(this.currentSection);
    }

    highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    getExcerpt(content, query, maxLength = 200) {
        const queryIndex = content.toLowerCase().indexOf(query.toLowerCase());
        if (queryIndex === -1) {
            return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
        }

        const start = Math.max(0, queryIndex - 50);
        const end = Math.min(content.length, queryIndex + query.length + 150);
        let excerpt = content.substring(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < content.length) excerpt = excerpt + '...';

        return this.highlightText(excerpt, query);
    }

    getSectionName(sectionId) {
        const sectionNames = {
            'getting-started': 'Getting Started',
            'case-management': 'Case Management',
            'evidence': 'Evidence Handling',
            'roles': 'User Roles',
            'security': 'Security & Privacy',
            'troubleshooting': 'Troubleshooting'
        };
        return sectionNames[sectionId] || sectionId;
    }

    showSection(sectionId) {
        this.currentSection = sectionId;
        
        // Clear search
        document.getElementById('helpSearch').value = '';
        this.clearSearchResults();

        // Hide all sections
        document.querySelectorAll('.help-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`[onclick="showHelpSection('${sectionId}')"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Scroll to top
        document.querySelector('.help-content').scrollTop = 0;
    }
}

// FAQ functionality
function toggleFaq(element) {
    const faqItem = element.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    
    faqItem.classList.toggle('active');
    
    if (faqItem.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = '0';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Global functions
function showHelpSection(sectionId) {
    if (window.helpCenter) {
        window.helpCenter.showSection(sectionId);
    }
}

function searchHelp() {
    if (window.helpCenter) {
        window.helpCenter.handleSearch();
    }
}

// Initialize help center
document.addEventListener('DOMContentLoaded', () => {
    window.helpCenter = new HelpCenter();
});

// Export
window.HelpCenter = HelpCenter;