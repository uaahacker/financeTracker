// Navigation and Page Management
class NavigationManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.pageHistory = ['dashboard'];
        this.maxHistory = 10;
        this.init();
    }

    init() {
        this.setupSidebarToggle();
        this.setupNavigation();
        this.setupProfileDropdown();
        this.handleInitialPage();
    }

    setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle && sidebar && sidebarOverlay) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });

            sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });

            // Close sidebar on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isSidebarOpen()) {
                    this.closeSidebar();
                }
            });
        }
    }

    setupNavigation() {
        // Sidebar navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.id.replace('Link', '');
                this.navigateTo(pageId);
            });
        });

        // Quick action buttons
        this.setupQuickActions();

        // Breadcrumb navigation (if implemented)
        this.setupBreadcrumbs();
    }

    setupQuickActions() {
        const addTransactionBtn = document.getElementById('addTransactionBtn');
        const viewAllTransactionsBtn = document.getElementById('viewAllTransactionsBtn');

        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.openTransactionModal();
            });
        }

        if (viewAllTransactionsBtn) {
            viewAllTransactionsBtn.addEventListener('click', () => {
                this.navigateTo('transactions');
            });
        }
    }

    setupProfileDropdown() {
        const profileDropdown = document.getElementById('profileDropdown');
        const profileMenu = document.getElementById('profileMenu');

        if (profileDropdown && profileMenu) {
            profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileMenu();
            });

            // Profile menu items
            const profileLink = document.getElementById('profileLink');
            const accountLink = document.getElementById('accountLink');
            const logoutBtn = document.getElementById('logoutBtn');

            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openProfileModal();
                    this.closeProfileMenu();
                });
            }

            if (accountLink) {
                accountLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo('settings');
                    this.closeProfileMenu();
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                    this.closeProfileMenu();
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                this.closeProfileMenu();
            });
        }
    }

    setupBreadcrumbs() {
        // Implementation for breadcrumb navigation
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (breadcrumbContainer) {
            this.updateBreadcrumbs();
        }
    }

    // Navigation methods
    navigateTo(pageId) {
        if (pageId === this.currentPage) return;

        // Validate page exists
        const pageContent = document.getElementById(`${pageId}Content`);
        if (!pageContent) {
            console.error(`Page content not found: ${pageId}Content`);
            return;
        }

        // Hide current page
        this.hideCurrentPage();

        // Update navigation state
        this.updatePageHistory(pageId);
        this.currentPage = pageId;

        // Update UI
        this.updateActiveNavLink(pageId);
        this.showPage(pageId);
        this.updatePageTitle(pageId);
        this.updateBreadcrumbs();

        // Close sidebar on mobile after navigation
        if (window.innerWidth < 768) {
            this.closeSidebar();
        }

        // Trigger page-specific initialization
        this.initializePage(pageId);

        // Update URL without page reload
        this.updateURL(pageId);
    }

    hideCurrentPage() {
        const currentPageContent = document.getElementById(`${this.currentPage}Content`);
        if (currentPageContent) {
            currentPageContent.classList.add('hidden');
        }
    }

    showPage(pageId) {
        const pageContent = document.getElementById(`${pageId}Content`);
        if (pageContent) {
            pageContent.classList.remove('hidden');
            pageContent.classList.add('fade-in');

            // Remove animation class after animation completes
            setTimeout(() => {
                pageContent.classList.remove('fade-in');
            }, 500);
        }
    }

    updateActiveNavLink(pageId) {
        // Remove active class from all nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active', 'bg-blue-100', 'text-blue-700');
            link.classList.add('text-gray-900');
        });

        // Add active class to current nav link
        const activeLink = document.getElementById(`${pageId}Link`);
        if (activeLink) {
            activeLink.classList.add('active', 'bg-blue-100', 'text-blue-700');
            activeLink.classList.remove('text-gray-900');
        }
    }

    updatePageTitle(pageId) {
        const titles = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            categories: 'Categories',
            accounts: 'Accounts',
            reports: 'Reports',
            budgets: 'Budgets',
            goals: 'Goals',
            settings: 'Settings'
        };

        const title = titles[pageId] || 'Finance Tracker';
        document.title = `${title} - Finance Tracker`;
    }

    updateBreadcrumbs() {
        const breadcrumbContainer = document.getElementById('breadcrumbContainer');
        if (!breadcrumbContainer) return;

        const breadcrumbs = this.generateBreadcrumbs();
        breadcrumbContainer.innerHTML = breadcrumbs;
    }

    generateBreadcrumbs() {
        const pageNames = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            categories: 'Categories',
            accounts: 'Accounts',
            reports: 'Reports',
            budgets: 'Budgets',
            goals: 'Goals',
            settings: 'Settings'
        };

        const breadcrumbHTML = `
            <nav class="flex" aria-label="Breadcrumb">
                <ol class="flex items-center space-x-4">
                    <li>
                        <div>
                            <a href="#" onclick="navigationManager.navigateTo('dashboard')" class="text-gray-400 hover:text-gray-500">
                                <i class="fas fa-home"></i>
                                <span class="sr-only">Home</span>
                            </a>
                        </div>
                    </li>
                    ${this.currentPage !== 'dashboard' ? `
                    <li>
                        <div class="flex items-center">
                            <i class="fas fa-chevron-right text-gray-400 mr-4"></i>
                            <span class="text-gray-500 font-medium">${pageNames[this.currentPage] || this.currentPage}</span>
                        </div>
                    </li>
                    ` : ''}
                </ol>
            </nav>
        `;

        return breadcrumbHTML;
    }

    updatePageHistory(pageId) {
        // Remove if already in history
        this.pageHistory = this.pageHistory.filter(page => page !== pageId);
        
        // Add to beginning
        this.pageHistory.unshift(pageId);
        
        // Limit history size
        if (this.pageHistory.length > this.maxHistory) {
            this.pageHistory = this.pageHistory.slice(0, this.maxHistory);
        }
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'dashboard':
                if (window.dashboardManager) {
                    window.dashboardManager.init();
                }
                break;
            case 'transactions':
                if (window.transactionManager) {
                    window.transactionManager.init();
                }
                break;
            case 'categories':
                if (window.categoryManager) {
                    window.categoryManager.init();
                }
                break;
            case 'accounts':
                if (window.accountManager) {
                    window.accountManager.init();
                }
                break;
            case 'reports':
                if (window.reportManager) {
                    window.reportManager.init();
                }
                break;
            case 'budgets':
                if (window.budgetManager) {
                    window.budgetManager.init();
                }
                break;
            case 'goals':
                if (window.goalManager) {
                    window.goalManager.init();
                }
                break;
            case 'settings':
                if (window.settingsManager) {
                    window.settingsManager.init();
                }
                break;
        }
    }

    updateURL(pageId) {
        const url = pageId === 'dashboard' ? '/' : `/#/${pageId}`;
        window.history.pushState({ page: pageId }, '', url);
    }

    handleInitialPage() {
        // Get page from URL hash
        const hash = window.location.hash.slice(1);
        const initialPage = hash.startsWith('/') ? hash.slice(1) : (hash || 'dashboard');
        
        // Navigate to initial page
        this.navigateTo(initialPage);
    }

    // Sidebar methods
    toggleSidebar() {
        if (this.isSidebarOpen()) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) {
            sidebar.classList.remove('-translate-x-full');
        }
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar) {
            sidebar.classList.add('-translate-x-full');
        }
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    isSidebarOpen() {
        const sidebar = document.getElementById('sidebar');
        return sidebar && !sidebar.classList.contains('-translate-x-full');
    }

    // Profile menu methods
    toggleProfileMenu() {
        const menu = document.getElementById('profileMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    }

    closeProfileMenu() {
        const menu = document.getElementById('profileMenu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }

    // Modal methods
    openTransactionModal() {
        if (window.transactionManager) {
            window.transactionManager.showAddModal();
        } else {
            showNotification('Transaction feature loading...', 'info');
        }
    }

    openProfileModal() {
        if (window.profileManager) {
            window.profileManager.showEditModal();
        } else {
            showNotification('Profile feature loading...', 'info');
        }
    }

    // Logout handler
    async handleLogout() {
        const confirmed = await showConfirmation(
            'Are you sure you want to logout?',
            'Confirm Logout'
        );

        if (confirmed && window.authManager) {
            await window.authManager.logout();
        }
    }

    // Back navigation
    goBack() {
        if (this.pageHistory.length > 1) {
            const previousPage = this.pageHistory[1];
            this.navigateTo(previousPage);
        }
    }

    // Refresh current page
    refresh() {
        this.initializePage(this.currentPage);
        showToast('Page refreshed', 'success');
    }

    // Get current page
    getCurrentPage() {
        return this.currentPage;
    }

    // Get page history
    getPageHistory() {
        return [...this.pageHistory];
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        navigationManager.navigateTo(event.state.page);
    } else {
        navigationManager.navigateTo('dashboard');
    }
});

// Handle refresh button
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            navigationManager.refresh();
            
            // Add visual feedback
            const icon = refreshBtn.querySelector('i');
            if (icon) {
                icon.classList.add('animate-spin');
                setTimeout(() => {
                    icon.classList.remove('animate-spin');
                }, 1000);
            }
        });
    }
});

// Export class for global use
window.NavigationManager = NavigationManager;
