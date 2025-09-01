// Reports Management
class ReportManager {
    constructor() {
        this.currentPeriod = 'month';
        this.reportData = {};
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Reports...');
        await this.loadReportData();
        this.renderReportsPage();
    }

    async loadReportData() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading reports...');

            if (authManager.isAuthenticated) {
                await this.loadRealReportData();
            } else {
                this.loadMockReportData();
            }

        } catch (error) {
            console.error('Failed to load report data:', error);
            showNotification('Failed to load reports', 'error');
            this.loadMockReportData();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    async loadRealReportData() {
        try {
            const [incomeExpense, categoryReport, monthlyTrends] = await Promise.all([
                API.reports.getIncomeExpenseReport(this.currentPeriod),
                API.reports.getCategoryReport(this.currentPeriod),
                API.reports.getMonthlyTrends()
            ]);

            this.reportData = {
                incomeExpense,
                categoryReport,
                monthlyTrends
            };
        } catch (error) {
            console.error('Error loading real report data:', error);
            throw error;
        }
    }

    loadMockReportData() {
        this.reportData = {
            incomeExpense: chartManager.generateSampleData('incomeExpense', this.currentPeriod),
            categoryReport: chartManager.generateSampleData('category', this.currentPeriod),
            monthlyTrends: chartManager.generateSampleData('trends', this.currentPeriod)
        };
    }

    renderReportsPage() {
        const content = document.getElementById('reportsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Financial Reports</h1>
                    <div class="flex items-center space-x-4">
                        <select id="reportPeriod" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="week">This Week</option>
                            <option value="month" selected>This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                        <button onclick="reportManager.exportReport()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                            <i class="fas fa-download mr-2"></i>Export
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-arrow-up text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Income</p>
                                <p class="text-2xl font-bold text-green-600" id="reportTotalIncome">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-arrow-down text-2xl text-red-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Expenses</p>
                                <p class="text-2xl font-bold text-red-600" id="reportTotalExpenses">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-balance-scale text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Net Income</p>
                                <p class="text-2xl font-bold text-blue-600" id="reportNetIncome">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-percentage text-2xl text-purple-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Savings Rate</p>
                                <p class="text-2xl font-bold text-purple-600" id="reportSavingsRate">0%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Income vs Expenses -->
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Trend</h3>
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="reportsIncomeExpenseChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Category Breakdown -->
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="reportsCategoryChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Monthly Trends -->
                <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="reportsMonthlyTrendsChart"></canvas>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Top Categories -->
                    <div class="bg-white rounded-xl shadow-lg">
                        <div class="p-6 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-900">Top Expense Categories</h3>
                        </div>
                        <div class="p-6">
                            <div id="topCategoriesTable" class="space-y-3">
                                <!-- Top categories will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Transactions Summary -->
                    <div class="bg-white rounded-xl shadow-lg">
                        <div class="p-6 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-900">Transaction Summary</h3>
                        </div>
                        <div class="p-6">
                            <div id="transactionSummaryTable" class="space-y-3">
                                <!-- Transaction summary will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Export Options -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="reportManager.exportToPDF()" class="flex items-center justify-center px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            Export to PDF
                        </button>
                        <button onclick="reportManager.exportToCSV()" class="flex items-center justify-center px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                            <i class="fas fa-file-csv mr-2"></i>
                            Export to CSV
                        </button>
                        <button onclick="reportManager.exportToExcel()" class="flex items-center justify-center px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateReportSummary();
        this.renderCharts();
        this.renderDetailedTables();
    }

    setupEventListeners() {
        const periodSelect = document.getElementById('reportPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.loadReportData().then(() => {
                    this.updateReportSummary();
                    this.renderCharts();
                    this.renderDetailedTables();
                });
            });
        }
    }

    updateReportSummary() {
        const incomeData = this.reportData.incomeExpense?.income || [];
        const expenseData = this.reportData.incomeExpense?.expenses || [];

        const totalIncome = incomeData.reduce((sum, amount) => sum + amount, 0);
        const totalExpenses = expenseData.reduce((sum, amount) => sum + amount, 0);
        const netIncome = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

        document.getElementById('reportTotalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('reportTotalExpenses').textContent = this.formatCurrency(totalExpenses);
        document.getElementById('reportNetIncome').textContent = this.formatCurrency(netIncome);
        document.getElementById('reportSavingsRate').textContent = `${savingsRate.toFixed(1)}%`;
    }

    renderCharts() {
        // Income vs Expenses Chart
        chartManager.createIncomeExpenseChart('reportsIncomeExpenseChart', this.reportData.incomeExpense);
        
        // Category Chart
        chartManager.createCategoryChart('reportsCategoryChart', this.reportData.categoryReport);
        
        // Monthly Trends Chart
        chartManager.createMonthlyTrendChart('reportsMonthlyTrendsChart', this.reportData.monthlyTrends);
    }

    renderDetailedTables() {
        this.renderTopCategories();
        this.renderTransactionSummary();
    }

    renderTopCategories() {
        const container = document.getElementById('topCategoriesTable');
        if (!container) return;

        const categoryData = this.reportData.categoryReport;
        if (!categoryData || !categoryData.labels || !categoryData.values) {
            container.innerHTML = '<p class="text-gray-500">No category data available</p>';
            return;
        }

        // Combine labels and values, then sort by value
        const categories = categoryData.labels.map((label, index) => ({
            name: label,
            amount: categoryData.values[index] || 0
        })).sort((a, b) => b.amount - a.amount).slice(0, 5);

        const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

        const categoriesHTML = categories.map((category, index) => {
            const percentage = totalAmount > 0 ? ((category.amount / totalAmount) * 100) : 0;
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-3">
                        <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span class="font-medium text-gray-900">${category.name}</span>
                    </div>
                    <div class="text-right">
                        <div class="font-medium text-gray-900">${this.formatCurrency(category.amount)}</div>
                        <div class="text-sm text-gray-600">${percentage.toFixed(1)}%</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = categoriesHTML;
    }

    renderTransactionSummary() {
        const container = document.getElementById('transactionSummaryTable');
        if (!container) return;

        // Mock transaction summary data
        const summary = [
            { label: 'Total Transactions', value: '127', icon: 'fas fa-exchange-alt', color: 'text-blue-600' },
            { label: 'Income Transactions', value: '23', icon: 'fas fa-arrow-up', color: 'text-green-600' },
            { label: 'Expense Transactions', value: '104', icon: 'fas fa-arrow-down', color: 'text-red-600' },
            { label: 'Average Transaction', value: this.formatCurrency(125.50), icon: 'fas fa-calculator', color: 'text-purple-600' },
            { label: 'Largest Expense', value: this.formatCurrency(2450.00), icon: 'fas fa-exclamation-triangle', color: 'text-orange-600' }
        ];

        const summaryHTML = summary.map(item => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="${item.icon} ${item.color}"></i>
                    <span class="font-medium text-gray-900">${item.label}</span>
                </div>
                <div class="font-semibold ${item.color}">${item.value}</div>
            </div>
        `).join('');

        container.innerHTML = summaryHTML;
    }

    async exportReport() {
        const exportOptions = [
            { id: 'pdf', label: 'PDF Report', icon: 'fas fa-file-pdf' },
            { id: 'csv', label: 'CSV Data', icon: 'fas fa-file-csv' },
            { id: 'excel', label: 'Excel Spreadsheet', icon: 'fas fa-file-excel' }
        ];

        // Show export options modal
        this.showExportModal(exportOptions);
    }

    showExportModal(options) {
        const modalHTML = `
            <div id="exportModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">Export Report</h2>
                            <button onclick="reportManager.hideExportModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="space-y-3">
                            ${options.map(option => `
                                <button onclick="reportManager.exportToFormat('${option.id}')" 
                                        class="w-full flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                    <i class="${option.icon} text-2xl text-gray-600 mr-4"></i>
                                    <span class="font-medium text-gray-900">${option.label}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Close on backdrop click
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target.id === 'exportModal') {
                this.hideExportModal();
            }
        });
    }

    hideExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.remove();
        }
    }

    async exportToFormat(format) {
        try {
            showLoading(true, `Exporting to ${format.toUpperCase()}...`);
            
            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            showNotification(`Report exported to ${format.toUpperCase()} successfully`, 'success');
            this.hideExportModal();
            
        } catch (error) {
            console.error('Export failed:', error);
            showNotification('Export failed', 'error');
        } finally {
            showLoading(false);
        }
    }

    exportToPDF() {
        this.exportToFormat('pdf');
    }

    exportToCSV() {
        this.exportToFormat('csv');
    }

    exportToExcel() {
        this.exportToFormat('excel');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }
}

// Export class for global use
window.ReportManager = ReportManager;
