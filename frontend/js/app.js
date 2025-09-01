// Main Application Controller
class FinanceTrackerApp {
    constructor() {
        this.isInitialized = false;
        this.currentPage = 'dashboard';
        this.managers = {};
        this.loadingStack = [];
        this.version = '1.0.0';
    }

    async init() {
        console.log('🚀 Initializing Finance Tracker v' + this.version);
        
        try {
            // Show initial loading
            this.showGlobalLoading(true, 'Initializing application...');

            // Initialize core components
            await this.initializeCore();
            
            // Initialize managers
            await this.initializeManagers();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup navigation
            await this.initializeNavigation();
            
            // Load initial page
            await this.loadInitialPage();
            
            // Setup auto-refresh
            this.setupAutoRefresh();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Finance Tracker initialized successfully');
            showNotification('Welcome to Finance Tracker!', 'success');
            
        } catch (error) {
            console.error('❌ Failed to initialize Finance Tracker:', error);
            showNotification('Failed to initialize application', 'error');
            this.showErrorFallback();
        } finally {
            this.showGlobalLoading(false);
        }
    }

    async initializeCore() {
        // Initialize API client
        window.API = new APIClient();
        
        // Initialize notification systems
        window.notificationManager = new NotificationManager();
        window.toastManager = new ToastManager();
        
        // Initialize chart manager
        window.chartManager = new ChartManager();
        
        // Initialize authentication
        window.authManager = new AuthManager();
        await window.authManager.init();
        
        // Initialize navigation
        window.navigationManager = new NavigationManager();
    }

    async initializeManagers() {
        // Initialize all page managers
        this.managers = {
            dashboard: new DashboardManager(),
            transactions: new TransactionManager(),
            accounts: new AccountManager(),
            categories: new CategoryManager(),
            budgets: new BudgetManager(),
            goals: new GoalManager(),
            reports: new ReportManager(),
            settings: new SettingsManager(),
            profile: new ProfileManager()
        };

        // Store managers globally for access
        Object.entries(this.managers).forEach(([name, manager]) => {
            window[`${name}Manager`] = manager;
        });

        console.log('📋 Managers initialized:', Object.keys(this.managers));
    }

    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleWindowResize();
        }, 250));

        // Handle online/offline status
        window.addEventListener('online', () => {
            showNotification('Connection restored', 'success');
            this.refreshCurrentPage();
        });

        window.addEventListener('offline', () => {
            showNotification('You are offline', 'warning');
        });

        // Handle visibility change (tab focus)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshCurrentPage();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showNotification('An unexpected error occurred', 'error');
        });

        // Handle clicks outside modals/dropdowns
        document.addEventListener('click', (e) => {
            this.handleOutsideClicks(e);
        });

        console.log('🎯 Global event listeners setup complete');
    }

    async initializeNavigation() {
        navigationManager.onNavigate = async (page) => {
            await this.navigateToPage(page);
        };
        
        await navigationManager.init();
    }

    async loadInitialPage() {
        // Determine initial page from URL hash or default to dashboard
        const hash = window.location.hash.slice(1);
        const initialPage = hash && this.managers[hash] ? hash : 'dashboard';
        
        await this.navigateToPage(initialPage);
    }

    async navigateToPage(page) {
        if (!this.managers[page]) {
            console.warn(`Unknown page: ${page}`);
            return;
        }

        try {
            // Show page loading
            this.showPageLoading(true);
            
            // Update current page
            this.currentPage = page;
            
            // Update URL hash
            window.location.hash = page;
            
            // Update navigation
            navigationManager.setActivePage(page);
            
            // Show the content container for the page
            this.showPageContent(page);
            
            // Initialize the page manager
            if (this.managers[page].init) {
                await this.managers[page].init();
            }
            
            console.log(`📄 Navigated to ${page}`);
            
        } catch (error) {
            console.error(`Failed to navigate to ${page}:`, error);
            showNotification(`Failed to load ${page}`, 'error');
        } finally {
            this.showPageLoading(false);
        }
    }

    showPageContent(page) {
        // Hide all page contents
        document.querySelectorAll('[id$="Content"]').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show the requested page content
        const pageContent = document.getElementById(`${page}Content`);
        if (pageContent) {
            pageContent.style.display = 'block';
        }
    }

    setupAutoRefresh() {
        // Auto-refresh dashboard data every 5 minutes
        setInterval(() => {
            if (this.currentPage === 'dashboard' && !document.hidden) {
                this.refreshCurrentPage();
            }
        }, 5 * 60 * 1000);
    }

    async refreshCurrentPage() {
        if (this.managers[this.currentPage]?.refresh) {
            try {
                await this.managers[this.currentPage].refresh();
            } catch (error) {
                console.error('Failed to refresh page:', error);
            }
        }
    }

    handleWindowResize() {
        // Re-render charts on resize
        if (window.chartManager) {
            chartManager.resizeAllCharts();
        }
        
        // Update navigation for mobile
        if (window.navigationManager) {
            navigationManager.updateMobileNav();
        }
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        // Ctrl/Cmd + shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k': // Search
                    e.preventDefault();
                    this.openSearch();
                    break;
                case 'n': // New transaction
                    e.preventDefault();
                    if (this.currentPage === 'transactions') {
                        transactionManager.showAddModal();
                    }
                    break;
                case 's': // Save
                    e.preventDefault();
                    this.handleSave();
                    break;
                case 'r': // Refresh
                    e.preventDefault();
                    this.refreshCurrentPage();
                    break;
            }
        }

        // Navigation shortcuts
        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToPage('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToPage('transactions');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateToPage('accounts');
                    break;
                case '4':
                    e.preventDefault();
                    this.navigateToPage('budgets');
                    break;
                case '5':
                    e.preventDefault();
                    this.navigateToPage('goals');
                    break;
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    }

    handleOutsideClicks(e) {
        // Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-toggle')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }

        // Close date pickers when clicking outside
        if (!e.target.closest('.datepicker') && !e.target.closest('input[type="date"]')) {
            document.querySelectorAll('.datepicker').forEach(picker => {
                picker.classList.add('hidden');
            });
        }
    }

    openSearch() {
        // Global search functionality
        showNotification('Global search coming soon!', 'info');
    }

    handleSave() {
        // Handle save shortcuts based on current page
        const currentManager = this.managers[this.currentPage];
        if (currentManager?.save) {
            currentManager.save();
        }
    }

    closeModals() {
        // Close all open modals
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.remove();
        });
    }

    showGlobalLoading(show, message = 'Loading...') {
        if (show) {
            this.loadingStack.push(message);
        } else {
            this.loadingStack.pop();
        }

        const isLoading = this.loadingStack.length > 0;
        const currentMessage = this.loadingStack[this.loadingStack.length - 1] || 'Loading...';

        showLoading(isLoading, currentMessage);
    }

    showPageLoading(show) {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showErrorFallback() {
        document.body.innerHTML = `
            <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div class="mb-6">
                        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-900 mb-2">Application Error</h1>
                        <p class="text-gray-600">Something went wrong while loading the application.</p>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="window.location.reload()" 
                                class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-redo mr-2"></i>Reload Application
                        </button>
                        
                        <button onclick="localStorage.clear(); window.location.reload()" 
                                class="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="fas fa-trash mr-2"></i>Clear Data & Reload
                        </button>
                    </div>
                    
                    <div class="mt-6 text-sm text-gray-500">
                        <p>If the problem persists, please contact support.</p>
                        <p class="mt-1">Error details have been logged to the console.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public methods for external use
    getCurrentPage() {
        return this.currentPage;
    }

    getManager(name) {
        return this.managers[name];
    }

    isReady() {
        return this.isInitialized;
    }

    getVersion() {
        return this.version;
    }

    // App lifecycle methods
    async restart() {
        console.log('🔄 Restarting Finance Tracker...');
        
        // Clear current state
        this.isInitialized = false;
        this.loadingStack = [];
        
        // Re-initialize
        await this.init();
    }

    async shutdown() {
        console.log('🛑 Shutting down Finance Tracker...');
        
        // Cleanup managers
        Object.values(this.managers).forEach(manager => {
            if (manager.cleanup) {
                manager.cleanup();
            }
        });
        
        // Clear intervals and timeouts
        // (In a real app, you'd track these and clear them)
        
        this.isInitialized = false;
        console.log('✅ Finance Tracker shutdown complete');
    }
}

// Global utility functions
window.showLoading = function(show, message = 'Loading...') {
    let loader = document.getElementById('globalLoader');
    
    if (!loader) {
        // Create loader if it doesn't exist
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="text-gray-700 font-medium" id="loadingMessage">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    const messageEl = document.getElementById('loadingMessage');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    loader.style.display = show ? 'flex' : 'none';
};

window.showNotification = function(message, type = 'info', duration = 5000) {
    if (window.notificationManager) {
        notificationManager.show(message, type, duration);
    } else {
        // Fallback notification
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};

window.showToast = function(message, type = 'info') {
    if (window.toastManager) {
        toastManager.show(message, type);
    } else {
        console.log(`[TOAST ${type.toUpperCase()}] ${message}`);
    }
};

window.showProgress = function(message, progress = 0) {
    if (window.notificationManager) {
        return notificationManager.showProgress(message, progress);
    }
    return null;
};

window.updateProgress = function(id, progress, message) {
    if (window.notificationManager) {
        notificationManager.updateProgress(id, progress, message);
    }
};

window.hideProgress = function(id) {
    if (window.notificationManager) {
        notificationManager.hideProgress(id);
    }
};

window.showConfirmation = function(message, title = 'Confirm', type = 'warning') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                        }">
                            <i class="fas fa-${
                                type === 'danger' ? 'exclamation-triangle text-red-600' : 'question-circle text-yellow-600'
                            } text-xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    </div>
                    
                    <p class="text-gray-600 mb-6">${message}</p>
                    
                    <div class="flex space-x-3">
                        <button onclick="resolveConfirmation(false)" 
                                class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onclick="resolveConfirmation(true)" 
                                class="flex-1 px-4 py-2 ${
                                    type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                } text-white rounded-lg transition-colors">
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.resolveConfirmation = (result) => {
            modal.remove();
            delete window.resolveConfirmation;
            resolve(result);
        };
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.resolveConfirmation(false);
            }
        });
    });
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Starting Finance Tracker initialization...');
        
        // Check if all required classes are available
        const requiredClasses = [
            'APIClient', 'AuthManager', 'NotificationManager', 'ChartManager',
            'NavigationManager', 'DashboardManager', 'TransactionManager',
            'AccountManager', 'CategoryManager', 'BudgetManager', 'GoalManager',
            'ReportManager', 'SettingsManager', 'ProfileManager'
        ];
        
        for (const className of requiredClasses) {
            if (typeof window[className] === 'undefined') {
                throw new Error(`Required class ${className} is not defined`);
            }
        }
        
        console.log('✅ All required classes are available');
        
        window.app = new FinanceTrackerApp();
        await app.init();
        
    } catch (error) {
        console.error('❌ Critical initialization error:', error);
        
        // Show a user-friendly error message
        document.body.innerHTML = `
            <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div class="mb-6">
                        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                        <h1 class="text-2xl font-bold text-gray-900 mb-2">Initialization Error</h1>
                        <p class="text-gray-600">Failed to load the application properly.</p>
                        <p class="text-sm text-red-600 mt-2">${error.message}</p>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="window.location.reload()" 
                                class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-redo mr-2"></i>Reload Application
                        </button>
                        
                        <button onclick="console.log('Debug info:', {error, window})" 
                                class="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            <i class="fas fa-bug mr-2"></i>Show Debug Info
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
});

// Export for global use
window.FinanceTrackerApp = FinanceTrackerApp;
