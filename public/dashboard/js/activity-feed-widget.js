/**
 * Consolidated Activity Feed Widget
 * Issue #103: Add Consolidated Activity Feed Widget to Main Dashboard
 */

class ActivityFeedWidget {
    constructor() {
        this.maxActivities = 15;
        this.refreshInterval = 30000; // 30 seconds
        this.activities = [];
        this.initializeWidget();
    }

    initializeWidget() {
        this.createWidgetStyles();
        this.loadActivities();
        this.startAutoRefresh();
    }

    createWidgetStyles() {
        if (document.getElementById('activity-feed-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'activity-feed-styles';
        styles.textContent = `
            .activity-feed-widget {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 0;
                margin: 20px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .activity-feed-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #f0f0f0;
                background: #f8f9fa;
            }
            
            .activity-feed-title {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0;
                font-size: 1.2em;
                font-weight: 700;
                color: #333;
            }
            
            .activity-feed-controls {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .view-all-btn {
                background: #d32f2f;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 0.9em;
                cursor: pointer;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .activity-feed-content {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .activity-list {
                padding: 0;
                margin: 0;
                list-style: none;
            }
            
            .activity-item {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                padding: 16px 24px;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s ease;
                cursor: pointer;
            }
            
            .activity-item:hover {
                background: #f8f9fa;
            }
            
            .activity-item:last-child {
                border-bottom: none;
            }
            
            .activity-icon {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .activity-icon.evidence {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .activity-icon.case {
                background: #e8f5e8;
                color: #388e3c;
            }
            
            .activity-icon.user {
                background: #f3e5f5;
                color: #7b1fa2;
            }
            
            .activity-icon.system {
                background: #fce4ec;
                color: #c2185b;
            }
            
            .activity-content {
                flex: 1;
                min-width: 0;
            }
            
            .activity-title {
                font-weight: 600;
                color: #333;
                margin: 0 0 4px 0;
                font-size: 0.95em;
                line-height: 1.3;
            }
            
            .activity-description {
                color: #666;
                font-size: 0.9em;
                line-height: 1.4;
                margin: 0 0 8px 0;
            }
            
            .activity-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.8em;
                color: #999;
            }
            
            .activity-empty {
                text-align: center;
                padding: 40px 20px;
                color: #666;
            }
        `;
        
        document.head.appendChild(styles);
    }

    renderWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Activity feed container not found:', containerId);
            return;
        }

        container.innerHTML = `
            <div class="activity-feed-widget">
                <div class="activity-feed-header">
                    <h3 class="activity-feed-title">
                        <i data-lucide="activity"></i>
                        Recent Activity
                    </h3>
                    <div class="activity-feed-controls">
                        <a href="audit-trail.html" class="view-all-btn">
                            <i data-lucide="external-link"></i>
                            View All Activities
                        </a>
                    </div>
                </div>
                
                <div class="activity-feed-content">
                    <div class="activity-loading">
                        Loading recent activities...
                    </div>
                </div>
            </div>
        `;

        this.renderActivities();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadActivities() {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.activities = this.generateMockActivities();
        } catch (error) {
            console.error('Failed to load activities:', error);
            this.activities = [];
        }
    }

    generateMockActivities() {
        const activityTypes = [
            {
                type: 'evidence',
                icon: 'upload',
                title: 'New evidence added in Case #ABC123',
                description: 'Digital forensic image uploaded by Investigator Johnson',
                actor: 'Investigator Johnson',
                link: 'cases.html?id=ABC123'
            },
            {
                type: 'case',
                icon: 'folder',
                title: 'Case #GHI789 moved to Pending Court by Judge Y',
                description: 'Case status changed from Investigation to Court Review',
                actor: 'Judge Y',
                link: 'cases.html?id=GHI789'
            },
            {
                type: 'user',
                icon: 'user-plus',
                title: 'User role changed to Prosecutor',
                description: 'Role elevation approved by Administrator',
                actor: 'Administrator',
                link: 'profile.html'
            },
            {
                type: 'system',
                icon: 'shield',
                title: 'System backup completed successfully',
                description: 'Daily backup of all evidence data completed',
                actor: 'System',
                link: 'system-health.html'
            }
        ];

        return activityTypes.map((template, index) => ({
            id: `activity_${Date.now()}_${index}`,
            ...template,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
            isNew: Math.random() > 0.7
        })).sort((a, b) => b.timestamp - a.timestamp);
    }

    renderActivities() {
        const container = document.querySelector('.activity-feed-content');
        if (!container) return;

        const filteredActivities = this.activities.slice(0, this.maxActivities);

        if (filteredActivities.length === 0) {
            container.innerHTML = `
                <div class="activity-empty">
                    <p>No recent activities found</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <ul class="activity-list">
                    ${filteredActivities.map(activity => this.renderActivityItem(activity)).join('')}
                </ul>
            `;

            container.querySelectorAll('.activity-item').forEach(item => {
                item.addEventListener('click', () => {
                    const link = item.dataset.link;
                    if (link) {
                        window.location.href = link;
                    }
                });
            });
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderActivityItem(activity) {
        const timeAgo = this.formatTimeAgo(activity.timestamp);

        return `
            <li class="activity-item" data-link="${activity.link}">
                <div class="activity-icon ${activity.type}">
                    <i data-lucide="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">
                        <div class="activity-time">
                            <i data-lucide="clock"></i>
                            ${timeAgo}
                        </div>
                        <div class="activity-actor">
                            <i data-lucide="user"></i>
                            ${activity.actor}
                        </div>
                    </div>
                </div>
            </li>
        `;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadActivities().then(() => {
                this.renderActivities();
            });
        }, this.refreshInterval);
    }

    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return new Date(date).toLocaleDateString();
    }

    addActivity(activity) {
        activity.id = `activity_${Date.now()}_${Math.random()}`;
        activity.timestamp = new Date();
        activity.isNew = true;
        
        this.activities.unshift(activity);
        
        if (this.activities.length > this.maxActivities * 2) {
            this.activities = this.activities.slice(0, this.maxActivities * 2);
        }
        
        this.renderActivities();
    }
}

window.activityFeedWidget = new ActivityFeedWidget();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityFeedWidget;
}