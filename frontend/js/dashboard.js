// Dashboard Management
class DashboardManager {
    constructor() {
        this.isLoading = false;
        this.data = {
            stats: {},
            charts: {},
            transactions: []
        };
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.autoRefreshTime = 5 * 60 * 1000; // 5 minutes
    }

    async init() {
        console.log('Initializing Dashboard...');
        await this.loadDashboardData();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Period change listeners for charts
        const incomeExpenseChartPeriod = document.getElementById('incomeExpenseChartPeriod');
        const categoryChartPeriod = document.getElementById('categoryChartPeriod');

        if (incomeExpenseChartPeriod) {
            incomeExpenseChartPeriod.addEventListener('change', () => {
                this.updateIncomeExpenseChart(incomeExpenseChartPeriod.value);
            });
        }

        if (categoryChartPeriod) {
            categoryChartPeriod.addEventListener('change', () => {
                this.updateCategoryChart(categoryChartPeriod.value);
            });
        }

        // Quick action buttons
        this.setupQuickActionButtons();
    }

    setupQuickActionButtons() {
        const quickActionButtons = document.querySelectorAll('[data-quick-action]');
        quickActionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-quick-action');
                this.handleQuickAction(action);
            });
        });
    }

    async loadDashboardData() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            showLoading(true, 'Loading dashboard data...');

            // Load data from API or use mock data
            if (authManager.isAuthenticated) {
                await this.loadRealData();
            } else {
                this.loadMockData();
            }

            this.updateDashboardUI();
            this.initializeCharts();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            showNotification('Failed to load dashboard data', 'error');
            this.loadMockData(); // Fallback to mock data
            this.updateDashboardUI();
            this.initializeCharts();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    async loadRealData() {
        try {
            // Parallel API calls for better performance
            const [statsResponse, transactionsResponse] = await Promise.all([
                API.reports.getDashboardStats(),
                API.transactions.getTransactions({ limit: 10, ordering: '-date' })
            ]);

            this.data.stats = statsResponse;
            this.data.transactions = transactionsResponse.results || transactionsResponse;

            // Load chart data
            await this.loadChartData();

        } catch (error) {
            console.error('Error loading real data:', error);
            throw error;
        }
    }

    async loadChartData() {
        try {
            const [incomeExpenseData, categoryData] = await Promise.all([
                API.reports.getIncomeExpenseReport('month'),
                API.reports.getCategoryReport('month')
            ]);

            this.data.charts = {
                incomeExpense: incomeExpenseData,
                category: categoryData
            };

        } catch (error) {
            console.error('Error loading chart data:', error);
            // Generate fallback chart data
            this.data.charts = {
                incomeExpense: chartManager.generateSampleData('incomeExpense', 'month'),
                category: chartManager.generateSampleData('category', 'month')
            };
        }
    }

    loadMockData() {
        // Mock statistics
        this.data.stats = {
            total_balance: 15420.50,
            total_income: 8500.00,
            total_expenses: 3250.75,
            savings_rate: 61.8,
            balance_change: 12.5,
            income_change: 8.3,
            expense_change: -2.1,
            savings_change: 15.2
        };

        // Mock transactions
        this.data.transactions = [
            {
                id: 1,
                date: '2024-03-15',
                description: 'Grocery Shopping',
                category: { name: 'Food', color: '#10B981' },
                account: { name: 'Checking Account' },
                amount: -85.50,
                type: 'expense'
            },
            {
                id: 2,
                date: '2024-03-15',
                description: 'Salary',
                category: { name: 'Income', color: '#3B82F6' },
                account: { name: 'Checking Account' },
                amount: 3500.00,
                type: 'income'
            },
            {
                id: 3,
                date: '2024-03-14',
                description: 'Gas Station',
                category: { name: 'Transportation', color: '#F59E0B' },
                account: { name: 'Credit Card' },
                amount: -45.20,
                type: 'expense'
            },
            {
                id: 4,
                date: '2024-03-14',
                description: 'Coffee Shop',
                category: { name: 'Food', color: '#10B981' },
                account: { name: 'Checking Account' },
                amount: -4.75,
                type: 'expense'
            },
            {
                id: 5,
                date: '2024-03-13',
                description: 'Netflix Subscription',
                category: { name: 'Entertainment', color: '#8B5CF6' },
                account: { name: 'Credit Card' },
                amount: -15.99,
                type: 'expense'
            }
        ];

        // Mock chart data
        this.data.charts = {
            incomeExpense: chartManager.generateSampleData('incomeExpense', 'month'),
            category: chartManager.generateSampleData('category', 'month')
        };
    }

    updateDashboardUI() {
        this.updateStatsCards();
        this.updateRecentTransactions();
    }

    updateStatsCards() {
        const stats = this.data.stats;

        // Update total balance
        const totalBalanceEl = document.getElementById('totalBalance');
        const balanceChangeEl = document.getElementById('balanceChange');
        if (totalBalanceEl) {
            totalBalanceEl.textContent = this.formatCurrency(stats.total_balance || 0);
        }
        if (balanceChangeEl) {
            const change = stats.balance_change || 0;
            balanceChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
            balanceChangeEl.className = `text-sm ${change >= 0 ? 'text-white/80' : 'text-red-200'}`;
        }

        // Update total income
        const totalIncomeEl = document.getElementById('totalIncome');
        const incomeChangeEl = document.getElementById('incomeChange');
        if (totalIncomeEl) {
            totalIncomeEl.textContent = this.formatCurrency(stats.total_income || 0);
        }
        if (incomeChangeEl) {
            const change = stats.income_change || 0;
            incomeChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
            incomeChangeEl.className = `text-sm ${change >= 0 ? 'text-white/80' : 'text-red-200'}`;
        }

        // Update total expenses
        const totalExpensesEl = document.getElementById('totalExpenses');
        const expenseChangeEl = document.getElementById('expenseChange');
        if (totalExpensesEl) {
            totalExpensesEl.textContent = this.formatCurrency(stats.total_expenses || 0);
        }
        if (expenseChangeEl) {
            const change = stats.expense_change || 0;
            expenseChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
            expenseChangeEl.className = `text-sm ${change <= 0 ? 'text-white/80' : 'text-red-200'}`;
        }

        // Update savings rate
        const savingsRateEl = document.getElementById('savingsRate');
        const savingsChangeEl = document.getElementById('savingsChange');
        if (savingsRateEl) {
            savingsRateEl.textContent = `${(stats.savings_rate || 0).toFixed(1)}%`;
        }
        if (savingsChangeEl) {
            const change = stats.savings_change || 0;
            savingsChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}% from last month`;
            savingsChangeEl.className = `text-sm ${change >= 0 ? 'text-gray-600' : 'text-red-500'}`;
        }
    }

    updateRecentTransactions() {
        const tableBody = document.getElementById('recentTransactionsTable');
        if (!tableBody) return;

        if (this.data.transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-receipt text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium">No transactions yet</p>
                            <p class="text-sm">Start by adding your first transaction</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const transactionRows = this.data.transactions.map(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            const amountClass = transaction.amount >= 0 ? 'text-green-600' : 'text-red-600';
            const amountPrefix = transaction.amount >= 0 ? '+' : '';

            return `
                <tr class="table-row-hover">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${formattedDate}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                        <div class="flex items-center">
                            <div class="w-2 h-2 rounded-full mr-3" style="background-color: ${transaction.category?.color || '#6B7280'}"></div>
                            ${transaction.description}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${transaction.category?.name || 'Uncategorized'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${transaction.account?.name || 'Unknown'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${amountClass}">
                        ${amountPrefix}${this.formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center justify-end space-x-2">
                            <button onclick="dashboardManager.editTransaction(${transaction.id})" 
                                    class="text-blue-600 hover:text-blue-900 transition-colors">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="dashboardManager.deleteTransaction(${transaction.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = transactionRows;
    }

    initializeCharts() {
        // Initialize income vs expense chart
        const incomeExpenseData = this.data.charts.incomeExpense;
        chartManager.createIncomeExpenseChart('incomeExpenseChart', incomeExpenseData);

        // Initialize category chart
        const categoryData = this.data.charts.category;
        chartManager.createCategoryChart('categoryChart', categoryData);
    }

    async updateIncomeExpenseChart(period) {
        try {
            showLoading(true, 'Updating chart...');
            
            let chartData;
            if (authManager.isAuthenticated) {
                chartData = await API.reports.getIncomeExpenseReport(period);
            } else {
                chartData = chartManager.generateSampleData('incomeExpense', period);
            }

            chartManager.updateChart('incomeExpenseChart', {
                labels: chartData.labels,
                datasets: [
                    { data: chartData.income },
                    { data: chartData.expenses }
                ]
            });

        } catch (error) {
            console.error('Failed to update income/expense chart:', error);
            showNotification('Failed to update chart', 'error');
        } finally {
            showLoading(false);
        }
    }

    async updateCategoryChart(period) {
        try {
            showLoading(true, 'Updating chart...');
            
            let chartData;
            if (authManager.isAuthenticated) {
                chartData = await API.reports.getCategoryReport(period);
            } else {
                chartData = chartManager.generateSampleData('category', period);
            }

            chartManager.updateChart('categoryChart', {
                labels: chartData.labels,
                datasets: [{ data: chartData.values }]
            });

        } catch (error) {
            console.error('Failed to update category chart:', error);
            showNotification('Failed to update chart', 'error');
        } finally {
            showLoading(false);
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-transaction':
                if (window.transactionManager) {
                    window.transactionManager.showAddModal();
                } else {
                    showNotification('Transaction feature loading...', 'info');
                }
                break;
            case 'create-goal':
                if (window.goalManager) {
                    window.goalManager.showAddModal();
                } else {
                    navigationManager.navigateTo('goals');
                }
                break;
            case 'view-reports':
                navigationManager.navigateTo('reports');
                break;
            default:
                console.warn('Unknown quick action:', action);
        }
    }

    async editTransaction(transactionId) {
        if (window.transactionManager) {
            await window.transactionManager.showEditModal(transactionId);
        } else {
            showNotification('Transaction feature loading...', 'info');
        }
    }

    async deleteTransaction(transactionId) {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete this transaction?',
            'Delete Transaction'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Deleting transaction...');
            
            if (authManager.isAuthenticated) {
                await API.transactions.deleteTransaction(transactionId);
            } else {
                // Remove from mock data
                this.data.transactions = this.data.transactions.filter(t => t.id !== transactionId);
            }

            showNotification('Transaction deleted successfully', 'success');
            this.updateRecentTransactions();
            this.refreshStats();

        } catch (error) {
            console.error('Failed to delete transaction:', error);
            showNotification('Failed to delete transaction', 'error');
        } finally {
            showLoading(false);
        }
    }

    async refreshStats() {
        try {
            if (authManager.isAuthenticated) {
                const stats = await API.reports.getDashboardStats();
                this.data.stats = stats;
            } else {
                // Recalculate mock stats
                this.calculateMockStats();
            }
            
            this.updateStatsCards();
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    }

    calculateMockStats() {
        const transactions = this.data.transactions;
        const totalIncome = transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = Math.abs(transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0));

        this.data.stats = {
            ...this.data.stats,
            total_income: totalIncome,
            total_expenses: totalExpenses,
            total_balance: this.data.stats.total_balance + (totalIncome - totalExpenses),
            savings_rate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        };
    }

    startAutoRefresh() {
        if (!this.autoRefreshEnabled) return;

        this.refreshInterval = setInterval(() => {
            if (navigationManager.getCurrentPage() === 'dashboard') {
                this.loadDashboardData();
            }
        }, this.autoRefreshTime);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    destroy() {
        this.stopAutoRefresh();
        chartManager.destroyChart('incomeExpenseChart');
        chartManager.destroyChart('categoryChart');
    }
}

// Export class for global use
window.DashboardManager = DashboardManager;
