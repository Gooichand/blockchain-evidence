/**
 * Empty States System for Dashboard Tables & Lists
 * Issue #102: Design & Implement Empty States for All Dashboard Tables & Lists
 */

class EmptyStatesSystem {
    constructor() {
        this.emptyStates = {
            cases: {
                icon: 'folder-x',
                title: 'No Cases Yet',
                message: 'Start by creating your first case to begin managing evidence.',
                action: {
                    text: 'Create New Case',
                    handler: () => window.location.href = 'cases.html?action=create',
                    icon: 'plus-circle'
                }
            },
            evidence: {
                icon: 'file-x',
                title: 'No Evidence Items',
                message: 'Upload digital evidence to start building your case.',
                action: {
                    text: 'Upload Evidence',
                    handler: () => window.location.href = 'evidence-manager.html',
                    icon: 'upload'
                }
            },
            users: {
                icon: 'users-x',
                title: 'No Users Found',
                message: 'Add team members to collaborate on cases and evidence.',
                action: {
                    text: 'Invite User',
                    handler: () => window.location.href = 'admin.html#create-user',
                    icon: 'user-plus'
                }
            },
            notifications: {
                icon: 'bell-off',
                title: 'No Notifications',
                message: 'You\'re all caught up! New notifications will appear here.',
                action: null
            },
            activities: {
                icon: 'activity',
                title: 'No Recent Activity',
                message: 'System activities and user actions will be logged here.',
                action: {
                    text: 'View All Logs',
                    handler: () => window.location.href = 'audit-trail.html',
                    icon: 'external-link'
                }
            }
        };
        
        this.initializeStyles();
    }

    initializeStyles() {
        if (document.getElementById('empty-states-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'empty-states-styles';
        styles.textContent = `
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 60px 40px;
                background: white;
                border-radius: 12px;
                border: 2px dashed #e0e0e0;
                margin: 20px 0;
                min-height: 300px;
                transition: all 0.3s ease;
            }
            
            .empty-state:hover {
                border-color: #d32f2f;
                background: #fff5f5;
            }
            
            .empty-state-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
                transition: all 0.3s ease;
            }
            
            .empty-state:hover .empty-state-icon {
                background: linear-gradient(135deg, #ffebee, #ffcdd2);
                transform: scale(1.05);
            }
            
            .empty-state-icon i {
                width: 40px;
                height: 40px;
                color: #999;
                transition: color 0.3s ease;
            }
            
            .empty-state:hover .empty-state-icon i {
                color: #d32f2f;
            }
            
            .empty-state-title {
                font-size: 1.5em;
                font-weight: 700;
                color: #333;
                margin: 0 0 12px 0;
            }
            
            .empty-state-message {
                font-size: 1.1em;
                color: #666;
                line-height: 1.6;
                margin: 0 0 32px 0;
                max-width: 400px;
            }
            
            .empty-state-action {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #d32f2f;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                box-shadow: 0 2px 8px rgba(211, 47, 47, 0.2);
            }
            
            .empty-state-action:hover {
                background: #b71c1c;
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(211, 47, 47, 0.3);
            }
            
            .empty-state-action i {
                width: 18px;
                height: 18px;
            }
            
            .empty-state-inline {
                padding: 40px 20px;
                background: #f8f9fa;
                border: none;
                border-radius: 8px;
                margin: 0;
                min-height: auto;
            }
            
            .empty-state-inline .empty-state-icon {
                width: 48px;
                height: 48px;
                margin-bottom: 12px;
            }
            
            .empty-state-inline .empty-state-icon i {
                width: 24px;
                height: 24px;
            }
            
            .empty-state-inline .empty-state-title {
                font-size: 1.1em;
                margin-bottom: 6px;
            }
            
            .empty-state-inline .empty-state-message {
                font-size: 0.9em;
                margin-bottom: 16px;
            }
        `;
        
        document.head.appendChild(styles);
    }

    render(containerId, stateType, customConfig = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Empty state container not found:', containerId);
            return;
        }

        const config = { ...this.emptyStates[stateType], ...customConfig };
        if (!config) {
            console.error('Unknown empty state type:', stateType);
            return;
        }

        const inlineClass = customConfig.inline ? 'empty-state-inline' : '';

        container.innerHTML = `
            <div class="empty-state ${inlineClass}">
                <div class="empty-state-icon">
                    <i data-lucide="${config.icon}"></i>
                </div>
                <h3 class="empty-state-title">${config.title}</h3>
                <p class="empty-state-message">${config.message}</p>
                
                ${config.action ? `
                    <button class="empty-state-action" onclick="(${config.action.handler.toString()})()">
                        <i data-lucide="${config.action.icon}"></i>
                        ${config.action.text}
                    </button>
                ` : ''}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    replaceTableContent(tableId, stateType, customConfig = {}) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const headerRow = table.querySelector('thead tr');
        const colCount = headerRow ? headerRow.children.length : 1;

        const config = { ...this.emptyStates[stateType], ...customConfig };
        
        tbody.innerHTML = `
            <tr>
                <td colspan="${colCount}" style="padding: 0; border: none;">
                    <div class="empty-state empty-state-inline">
                        <div class="empty-state-icon">
                            <i data-lucide="${config.icon}"></i>
                        </div>
                        <h3 class="empty-state-title">${config.title}</h3>
                        <p class="empty-state-message">${config.message}</p>
                        
                        ${config.action ? `
                            <button class="empty-state-action" onclick="(${config.action.handler.toString()})()">
                                <i data-lucide="${config.action.icon}"></i>
                                ${config.action.text}
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    createCustom(containerId, config) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const defaultConfig = {
            icon: 'inbox',
            title: 'No Data Available',
            message: 'There is no data to display at this time.',
            action: null
        };

        const finalConfig = { ...defaultConfig, ...config };
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="${finalConfig.icon}"></i>
                </div>
                <h3 class="empty-state-title">${finalConfig.title}</h3>
                <p class="empty-state-message">${finalConfig.message}</p>
                
                ${finalConfig.action ? `
                    <button class="empty-state-action" onclick="(${finalConfig.action.handler.toString()})()">
                        <i data-lucide="${finalConfig.action.icon}"></i>
                        ${finalConfig.action.text}
                    </button>
                ` : ''}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

window.emptyStatesSystem = new EmptyStatesSystem();

// Auto-initialize empty states on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const commonContainers = [
        { selector: '#casesTable tbody', type: 'cases' },
        { selector: '#evidenceList', type: 'evidence' },
        { selector: '#usersList', type: 'users' },
        { selector: '#notificationsList', type: 'notifications' },
        { selector: '#activitiesList', type: 'activities' }
    ];

    commonContainers.forEach(({ selector, type }) => {
        const element = document.querySelector(selector);
        if (element && element.children.length === 0) {
            const containerId = element.id || element.parentElement.id;
            if (containerId) {
                window.emptyStatesSystem.render(containerId, type);
            }
        }
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmptyStatesSystem;
}