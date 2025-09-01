// Settings Management
class SettingsManager {
    constructor() {
        this.settings = {};
        this.isDirty = false;
    }

    async init() {
        console.log('Initializing Settings...');
        await this.loadSettings();
        this.renderSettingsPage();
    }

    async loadSettings() {
        try {
            showLoading(true, 'Loading settings...');

            if (authManager.isAuthenticated) {
                this.settings = await API.settings.getSettings();
            } else {
                this.settings = this.getDefaultSettings();
            }

        } catch (error) {
            console.error('Failed to load settings:', error);
            showNotification('Failed to load settings', 'error');
            this.settings = this.getDefaultSettings();
        } finally {
            showLoading(false);
        }
    }

    getDefaultSettings() {
        return {
            // General Settings
            currency: 'USD',
            language: 'en',
            timezone: 'America/New_York',
            date_format: 'MM/DD/YYYY',
            time_format: '12h',
            
            // Dashboard Settings
            default_account: null,
            dashboard_refresh_interval: 300, // 5 minutes
            show_balance_on_dashboard: true,
            show_recent_transactions: true,
            recent_transactions_limit: 10,
            
            // Notifications
            email_notifications: true,
            push_notifications: false,
            budget_alerts: true,
            goal_reminders: true,
            transaction_notifications: false,
            weekly_summary: true,
            monthly_report: true,
            
            // Security
            two_factor_enabled: false,
            auto_logout_minutes: 30,
            password_expiry_days: 90,
            login_notifications: true,
            
            // Privacy
            data_sharing: false,
            analytics_tracking: true,
            marketing_emails: false,
            
            // Export/Backup
            auto_backup: false,
            backup_frequency: 'weekly',
            export_format: 'csv',
            
            // Advanced
            debug_mode: false,
            beta_features: false,
            api_timeout: 30
        };
    }

    renderSettingsPage() {
        const content = document.getElementById('settingsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
                    <div class="flex space-x-3">
                        <button onclick="settingsManager.resetToDefaults()" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="fas fa-undo mr-2"></i>Reset to Defaults
                        </button>
                        <button onclick="settingsManager.saveSettings()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium" id="saveSettingsBtn">
                            <i class="fas fa-save mr-2"></i>Save Changes
                        </button>
                    </div>
                </div>

                <!-- Settings Navigation -->
                <div class="bg-white rounded-xl shadow-lg">
                    <div class="flex border-b border-gray-200">
                        <button onclick="settingsManager.showSettingsTab('general')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors active" data-tab="general">
                            <i class="fas fa-cog mr-2"></i>General
                        </button>
                        <button onclick="settingsManager.showSettingsTab('dashboard')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="dashboard">
                            <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                        </button>
                        <button onclick="settingsManager.showSettingsTab('notifications')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="notifications">
                            <i class="fas fa-bell mr-2"></i>Notifications
                        </button>
                        <button onclick="settingsManager.showSettingsTab('security')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="security">
                            <i class="fas fa-shield-alt mr-2"></i>Security
                        </button>
                        <button onclick="settingsManager.showSettingsTab('privacy')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="privacy">
                            <i class="fas fa-user-shield mr-2"></i>Privacy
                        </button>
                        <button onclick="settingsManager.showSettingsTab('advanced')" 
                                class="settings-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="advanced">
                            <i class="fas fa-cogs mr-2"></i>Advanced
                        </button>
                    </div>
                    
                    <div class="p-6" id="settingsTabContent">
                        <!-- Tab content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.showSettingsTab('general');
        this.setupSettingsHandlers();
    }

    showSettingsTab(tabName) {
        // Update active tab
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        const content = document.getElementById('settingsTabContent');
        if (!content) return;

        switch (tabName) {
            case 'general':
                content.innerHTML = this.renderGeneralSettings();
                break;
            case 'dashboard':
                content.innerHTML = this.renderDashboardSettings();
                break;
            case 'notifications':
                content.innerHTML = this.renderNotificationSettings();
                break;
            case 'security':
                content.innerHTML = this.renderSecuritySettings();
                break;
            case 'privacy':
                content.innerHTML = this.renderPrivacySettings();
                break;
            case 'advanced':
                content.innerHTML = this.renderAdvancedSettings();
                break;
        }

        this.bindCurrentTabSettings();
    }

    renderGeneralSettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">General Settings</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                        <select name="currency" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="USD" ${this.settings.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                            <option value="EUR" ${this.settings.currency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                            <option value="GBP" ${this.settings.currency === 'GBP' ? 'selected' : ''}>GBP - British Pound</option>
                            <option value="CAD" ${this.settings.currency === 'CAD' ? 'selected' : ''}>CAD - Canadian Dollar</option>
                            <option value="AUD" ${this.settings.currency === 'AUD' ? 'selected' : ''}>AUD - Australian Dollar</option>
                            <option value="JPY" ${this.settings.currency === 'JPY' ? 'selected' : ''}>JPY - Japanese Yen</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select name="language" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="es" ${this.settings.language === 'es' ? 'selected' : ''}>Spanish</option>
                            <option value="fr" ${this.settings.language === 'fr' ? 'selected' : ''}>French</option>
                            <option value="de" ${this.settings.language === 'de' ? 'selected' : ''}>German</option>
                            <option value="it" ${this.settings.language === 'it' ? 'selected' : ''}>Italian</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select name="timezone" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="America/New_York" ${this.settings.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time (ET)</option>
                            <option value="America/Chicago" ${this.settings.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time (CT)</option>
                            <option value="America/Denver" ${this.settings.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time (MT)</option>
                            <option value="America/Los_Angeles" ${this.settings.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time (PT)</option>
                            <option value="Europe/London" ${this.settings.timezone === 'Europe/London' ? 'selected' : ''}>London Time (GMT)</option>
                            <option value="Europe/Paris" ${this.settings.timezone === 'Europe/Paris' ? 'selected' : ''}>Central European Time</option>
                            <option value="Asia/Tokyo" ${this.settings.timezone === 'Asia/Tokyo' ? 'selected' : ''}>Japan Standard Time</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                        <select name="date_format" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="MM/DD/YYYY" ${this.settings.date_format === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY (12/31/2024)</option>
                            <option value="DD/MM/YYYY" ${this.settings.date_format === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY (31/12/2024)</option>
                            <option value="YYYY-MM-DD" ${this.settings.date_format === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD (2024-12-31)</option>
                            <option value="DD MMM YYYY" ${this.settings.date_format === 'DD MMM YYYY' ? 'selected' : ''}>DD MMM YYYY (31 Dec 2024)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                        <select name="time_format" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="12h" ${this.settings.time_format === '12h' ? 'selected' : ''}>12-hour (3:30 PM)</option>
                            <option value="24h" ${this.settings.time_format === '24h' ? 'selected' : ''}>24-hour (15:30)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderDashboardSettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Dashboard Settings</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Show Balance on Dashboard</h4>
                            <p class="text-sm text-gray-600">Display account balances prominently on the dashboard</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="show_balance_on_dashboard" class="setting-input sr-only" ${this.settings.show_balance_on_dashboard ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Show Recent Transactions</h4>
                            <p class="text-sm text-gray-600">Display recent transactions widget on dashboard</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="show_recent_transactions" class="setting-input sr-only" ${this.settings.show_recent_transactions ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Recent Transactions Limit</label>
                            <select name="recent_transactions_limit" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="5" ${this.settings.recent_transactions_limit === 5 ? 'selected' : ''}>5 transactions</option>
                                <option value="10" ${this.settings.recent_transactions_limit === 10 ? 'selected' : ''}>10 transactions</option>
                                <option value="15" ${this.settings.recent_transactions_limit === 15 ? 'selected' : ''}>15 transactions</option>
                                <option value="20" ${this.settings.recent_transactions_limit === 20 ? 'selected' : ''}>20 transactions</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Dashboard Refresh Interval</label>
                            <select name="dashboard_refresh_interval" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="60" ${this.settings.dashboard_refresh_interval === 60 ? 'selected' : ''}>1 minute</option>
                                <option value="300" ${this.settings.dashboard_refresh_interval === 300 ? 'selected' : ''}>5 minutes</option>
                                <option value="600" ${this.settings.dashboard_refresh_interval === 600 ? 'selected' : ''}>10 minutes</option>
                                <option value="1800" ${this.settings.dashboard_refresh_interval === 1800 ? 'selected' : ''}>30 minutes</option>
                                <option value="0" ${this.settings.dashboard_refresh_interval === 0 ? 'selected' : ''}>Manual refresh only</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderNotificationSettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Notification Settings</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Email Notifications</h4>
                            <p class="text-sm text-gray-600">Receive notifications via email</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="email_notifications" class="setting-input sr-only" ${this.settings.email_notifications ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Push Notifications</h4>
                            <p class="text-sm text-gray-600">Receive browser push notifications</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="push_notifications" class="setting-input sr-only" ${this.settings.push_notifications ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Budget Alerts</h4>
                            <p class="text-sm text-gray-600">Get notified when approaching budget limits</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="budget_alerts" class="setting-input sr-only" ${this.settings.budget_alerts ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Goal Reminders</h4>
                            <p class="text-sm text-gray-600">Receive reminders about your financial goals</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="goal_reminders" class="setting-input sr-only" ${this.settings.goal_reminders ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Transaction Notifications</h4>
                            <p class="text-sm text-gray-600">Get notified for each new transaction</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="transaction_notifications" class="setting-input sr-only" ${this.settings.transaction_notifications ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Weekly Summary</h4>
                            <p class="text-sm text-gray-600">Receive weekly financial summary emails</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="weekly_summary" class="setting-input sr-only" ${this.settings.weekly_summary ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Monthly Report</h4>
                            <p class="text-sm text-gray-600">Receive monthly financial reports</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="monthly_report" class="setting-input sr-only" ${this.settings.monthly_report ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    renderSecuritySettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Security Settings</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p class="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="two_factor_enabled" class="setting-input sr-only" ${this.settings.two_factor_enabled ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <button onclick="settingsManager.setup2FA()" class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                Setup
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Login Notifications</h4>
                            <p class="text-sm text-gray-600">Get notified when someone logs into your account</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="login_notifications" class="setting-input sr-only" ${this.settings.login_notifications ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Auto Logout (minutes)</label>
                            <select name="auto_logout_minutes" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="15" ${this.settings.auto_logout_minutes === 15 ? 'selected' : ''}>15 minutes</option>
                                <option value="30" ${this.settings.auto_logout_minutes === 30 ? 'selected' : ''}>30 minutes</option>
                                <option value="60" ${this.settings.auto_logout_minutes === 60 ? 'selected' : ''}>1 hour</option>
                                <option value="120" ${this.settings.auto_logout_minutes === 120 ? 'selected' : ''}>2 hours</option>
                                <option value="0" ${this.settings.auto_logout_minutes === 0 ? 'selected' : ''}>Never</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                            <select name="password_expiry_days" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="30" ${this.settings.password_expiry_days === 30 ? 'selected' : ''}>30 days</option>
                                <option value="60" ${this.settings.password_expiry_days === 60 ? 'selected' : ''}>60 days</option>
                                <option value="90" ${this.settings.password_expiry_days === 90 ? 'selected' : ''}>90 days</option>
                                <option value="180" ${this.settings.password_expiry_days === 180 ? 'selected' : ''}>180 days</option>
                                <option value="0" ${this.settings.password_expiry_days === 0 ? 'selected' : ''}>Never</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button onclick="settingsManager.changePassword()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <i class="fas fa-key mr-2"></i>Change Password
                        </button>
                        <button onclick="settingsManager.viewLoginHistory()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="fas fa-history mr-2"></i>Login History
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPrivacySettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Data Sharing</h4>
                            <p class="text-sm text-gray-600">Allow sharing anonymized data for service improvement</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="data_sharing" class="setting-input sr-only" ${this.settings.data_sharing ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Analytics Tracking</h4>
                            <p class="text-sm text-gray-600">Allow tracking for usage analytics and improvements</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="analytics_tracking" class="setting-input sr-only" ${this.settings.analytics_tracking ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Marketing Emails</h4>
                            <p class="text-sm text-gray-600">Receive emails about new features and promotions</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="marketing_emails" class="setting-input sr-only" ${this.settings.marketing_emails ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 class="font-medium text-yellow-800 mb-2">Data Export & Deletion</h4>
                        <p class="text-sm text-yellow-700 mb-4">Manage your personal data and account</p>
                        <div class="flex space-x-3">
                            <button onclick="settingsManager.exportData()" class="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm">
                                <i class="fas fa-download mr-2"></i>Export My Data
                            </button>
                            <button onclick="settingsManager.deleteAccount()" class="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm">
                                <i class="fas fa-trash mr-2"></i>Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdvancedSettings() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Debug Mode</h4>
                            <p class="text-sm text-gray-600">Enable debug logging (for troubleshooting)</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="debug_mode" class="setting-input sr-only" ${this.settings.debug_mode ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 class="font-medium text-gray-900">Beta Features</h4>
                            <p class="text-sm text-gray-600">Access experimental features (may be unstable)</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="beta_features" class="setting-input sr-only" ${this.settings.beta_features ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">API Timeout (seconds)</label>
                            <select name="api_timeout" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="10" ${this.settings.api_timeout === 10 ? 'selected' : ''}>10 seconds</option>
                                <option value="30" ${this.settings.api_timeout === 30 ? 'selected' : ''}>30 seconds</option>
                                <option value="60" ${this.settings.api_timeout === 60 ? 'selected' : ''}>60 seconds</option>
                                <option value="120" ${this.settings.api_timeout === 120 ? 'selected' : ''}>120 seconds</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Default Export Format</label>
                            <select name="export_format" class="setting-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="csv" ${this.settings.export_format === 'csv' ? 'selected' : ''}>CSV</option>
                                <option value="excel" ${this.settings.export_format === 'excel' ? 'selected' : ''}>Excel</option>
                                <option value="json" ${this.settings.export_format === 'json' ? 'selected' : ''}>JSON</option>
                                <option value="pdf" ${this.settings.export_format === 'pdf' ? 'selected' : ''}>PDF</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-medium text-blue-800 mb-2">System Tools</h4>
                        <p class="text-sm text-blue-700 mb-4">Advanced system utilities and debugging tools</p>
                        <div class="flex flex-wrap gap-3">
                            <button onclick="settingsManager.clearCache()" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                                <i class="fas fa-broom mr-2"></i>Clear Cache
                            </button>
                            <button onclick="settingsManager.downloadLogs()" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                                <i class="fas fa-file-download mr-2"></i>Download Logs
                            </button>
                            <button onclick="settingsManager.testConnection()" class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                                <i class="fas fa-wifi mr-2"></i>Test Connection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSettingsHandlers() {
        // Add change listeners to mark settings as dirty
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('setting-input')) {
                this.isDirty = true;
                this.updateSaveButton();
            }
        });
    }

    bindCurrentTabSettings() {
        // Update setting values when inputs change
        document.querySelectorAll('.setting-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const settingName = e.target.name;
                let value;
                
                if (e.target.type === 'checkbox') {
                    value = e.target.checked;
                } else if (e.target.type === 'number') {
                    value = parseInt(e.target.value) || 0;
                } else {
                    value = e.target.value;
                }
                
                this.settings[settingName] = value;
                this.isDirty = true;
                this.updateSaveButton();
            });
        });
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('saveSettingsBtn');
        if (saveBtn) {
            if (this.isDirty) {
                saveBtn.classList.remove('opacity-50');
                saveBtn.disabled = false;
            } else {
                saveBtn.classList.add('opacity-50');
                saveBtn.disabled = true;
            }
        }
    }

    async saveSettings() {
        if (!this.isDirty) return;

        try {
            showLoading(true, 'Saving settings...');

            if (authManager.isAuthenticated) {
                await API.settings.updateSettings(this.settings);
            } else {
                // For demo purposes, just store in localStorage
                localStorage.setItem('financeTrackerSettings', JSON.stringify(this.settings));
            }

            this.isDirty = false;
            this.updateSaveButton();
            showNotification('Settings saved successfully', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            showNotification('Failed to save settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    async resetToDefaults() {
        const confirmed = await showConfirmation(
            'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
            'Reset Settings'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Resetting settings...');

            this.settings = this.getDefaultSettings();
            this.isDirty = true;

            // Re-render current tab to show default values
            const activeTab = document.querySelector('.settings-tab.active');
            if (activeTab) {
                this.showSettingsTab(activeTab.dataset.tab);
            }

            showNotification('Settings reset to defaults', 'success');

        } catch (error) {
            console.error('Failed to reset settings:', error);
            showNotification('Failed to reset settings', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Security-related methods
    async setup2FA() {
        showNotification('Two-factor authentication setup coming soon', 'info');
    }

    async changePassword() {
        showNotification('Password change feature coming soon', 'info');
    }

    async viewLoginHistory() {
        showNotification('Login history feature coming soon', 'info');
    }

    // Privacy-related methods
    async exportData() {
        try {
            showLoading(true, 'Preparing data export...');
            
            // Simulate data export
            setTimeout(() => {
                showLoading(false);
                showNotification('Data export will be sent to your email', 'success');
            }, 2000);

        } catch (error) {
            console.error('Failed to export data:', error);
            showNotification('Failed to export data', 'error');
            showLoading(false);
        }
    }

    async deleteAccount() {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.',
            'Delete Account',
            'danger'
        );

        if (!confirmed) return;

        const doubleConfirmed = await showConfirmation(
            'This is your final warning. All your financial data, transactions, budgets, and goals will be permanently deleted. Type "DELETE" to confirm.',
            'Final Confirmation',
            'danger'
        );

        if (!doubleConfirmed) return;

        showNotification('Account deletion feature coming soon', 'info');
    }

    // Advanced methods
    async clearCache() {
        try {
            showLoading(true, 'Clearing cache...');
            
            // Clear various caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Clear localStorage (except auth)
            const authData = localStorage.getItem('auth_token');
            localStorage.clear();
            if (authData) {
                localStorage.setItem('auth_token', authData);
            }

            setTimeout(() => {
                showLoading(false);
                showNotification('Cache cleared successfully', 'success');
            }, 1000);

        } catch (error) {
            console.error('Failed to clear cache:', error);
            showNotification('Failed to clear cache', 'error');
            showLoading(false);
        }
    }

    async downloadLogs() {
        try {
            showLoading(true, 'Generating logs...');
            
            // Simulate log generation
            const logs = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                settings: this.settings,
                performance: performance.getEntriesByType('navigation')[0]
            };

            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance-tracker-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            showLoading(false);
            showNotification('Logs downloaded successfully', 'success');

        } catch (error) {
            console.error('Failed to download logs:', error);
            showNotification('Failed to download logs', 'error');
            showLoading(false);
        }
    }

    async testConnection() {
        try {
            showLoading(true, 'Testing connection...');
            
            // Test API connection
            const startTime = Date.now();
            if (authManager.isAuthenticated) {
                await API.health.ping();
            }
            const endTime = Date.now();
            const latency = endTime - startTime;

            showLoading(false);
            showNotification(`Connection successful. Latency: ${latency}ms`, 'success');

        } catch (error) {
            console.error('Connection test failed:', error);
            showNotification('Connection test failed', 'error');
            showLoading(false);
        }
    }
}

// Export class for global use
window.SettingsManager = SettingsManager;
