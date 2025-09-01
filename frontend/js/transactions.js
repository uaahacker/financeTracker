// Transaction Management
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.categories = [];
        this.accounts = [];
        this.currentTransaction = null;
        this.isLoading = false;
        this.filters = {
            search: '',
            category: '',
            account: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            sortBy: '-date'
        };
        this.pagination = {
            page: 1,
            pageSize: 20,
            total: 0
        };
    }

    async init() {
        console.log('Initializing Transactions...');
        await this.loadInitialData();
        this.setupEventListeners();
        this.renderTransactionsPage();
    }

    async loadInitialData() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading transactions...');

            if (authManager.isAuthenticated) {
                await Promise.all([
                    this.loadTransactions(),
                    this.loadCategories(),
                    this.loadAccounts()
                ]);
            } else {
                this.loadMockData();
            }

        } catch (error) {
            console.error('Failed to load transaction data:', error);
            showNotification('Failed to load transactions', 'error');
            this.loadMockData();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    async loadTransactions() {
        try {
            const params = {
                page: this.pagination.page,
                page_size: this.pagination.pageSize,
                ordering: this.filters.sortBy,
                ...this.getFilterParams()
            };

            const response = await API.transactions.getTransactions(params);
            this.transactions = response.results || response;
            this.pagination.total = response.count || this.transactions.length;

        } catch (error) {
            console.error('Failed to load transactions:', error);
            throw error;
        }
    }

    async loadCategories() {
        try {
            this.categories = await API.categories.getCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = this.getMockCategories();
        }
    }

    async loadAccounts() {
        try {
            this.accounts = await API.accounts.getAccounts();
        } catch (error) {
            console.error('Failed to load accounts:', error);
            this.accounts = this.getMockAccounts();
        }
    }

    loadMockData() {
        this.transactions = this.getMockTransactions();
        this.categories = this.getMockCategories();
        this.accounts = this.getMockAccounts();
        this.pagination.total = this.transactions.length;
    }

    getMockTransactions() {
        return [
            {
                id: 1,
                date: '2024-03-15',
                description: 'Grocery Shopping',
                category: { id: 1, name: 'Food', color: '#10B981' },
                account: { id: 1, name: 'Checking Account' },
                amount: -85.50,
                type: 'expense',
                notes: 'Weekly groceries'
            },
            {
                id: 2,
                date: '2024-03-15',
                description: 'Salary',
                category: { id: 8, name: 'Salary', color: '#3B82F6' },
                account: { id: 1, name: 'Checking Account' },
                amount: 3500.00,
                type: 'income',
                notes: 'Monthly salary'
            },
            // Add more mock transactions...
        ];
    }

    getMockCategories() {
        return [
            { id: 1, name: 'Food', color: '#10B981', type: 'expense' },
            { id: 2, name: 'Transportation', color: '#F59E0B', type: 'expense' },
            { id: 3, name: 'Entertainment', color: '#8B5CF6', type: 'expense' },
            { id: 4, name: 'Utilities', color: '#EF4444', type: 'expense' },
            { id: 5, name: 'Healthcare', color: '#06B6D4', type: 'expense' },
            { id: 6, name: 'Shopping', color: '#EC4899', type: 'expense' },
            { id: 7, name: 'Other Expenses', color: '#6B7280', type: 'expense' },
            { id: 8, name: 'Salary', color: '#3B82F6', type: 'income' },
            { id: 9, name: 'Freelance', color: '#10B981', type: 'income' },
            { id: 10, name: 'Investments', color: '#8B5CF6', type: 'income' },
            { id: 11, name: 'Other Income', color: '#F59E0B', type: 'income' }
        ];
    }

    getMockAccounts() {
        return [
            { id: 1, name: 'Checking Account', type: 'checking', balance: 5420.50 },
            { id: 2, name: 'Savings Account', type: 'savings', balance: 12350.00 },
            { id: 3, name: 'Credit Card', type: 'credit', balance: -2340.75 },
            { id: 4, name: 'Investment Account', type: 'investment', balance: 8960.25 }
        ];
    }

    setupEventListeners() {
        // Search and filters
        this.setupFilters();
        
        // Add transaction button
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        // Pagination
        this.setupPagination();
    }

    setupFilters() {
        const searchInput = document.getElementById('transactionSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const accountFilter = document.getElementById('accountFilter');
        const typeFilter = document.getElementById('typeFilter');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        const sortSelect = document.getElementById('sortBy');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounceFilter();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (accountFilter) {
            accountFilter.addEventListener('change', (e) => {
                this.filters.account = e.target.value;
                this.applyFilters();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }

        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.applyFilters();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
            });
        }
    }

    debounceFilter() {
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    async applyFilters() {
        this.pagination.page = 1;
        await this.loadTransactions();
        this.renderTransactionTable();
        this.updatePagination();
    }

    getFilterParams() {
        const params = {};
        
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.category) params.category = this.filters.category;
        if (this.filters.account) params.account = this.filters.account;
        if (this.filters.type) params.type = this.filters.type;
        if (this.filters.dateFrom) params.date_after = this.filters.dateFrom;
        if (this.filters.dateTo) params.date_before = this.filters.dateTo;

        return params;
    }

    renderTransactionsPage() {
        const content = document.getElementById('transactionsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Transactions</h1>
                    <button id="addTransactionBtn" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Add Transaction
                    </button>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input type="text" id="transactionSearch" placeholder="Search transactions..."
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select id="categoryFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
                            <select id="accountFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Accounts</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select id="typeFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">All Types</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                            <input type="date" id="dateFrom" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                            <input type="date" id="dateTo" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select id="sortBy" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="-date">Newest First</option>
                                <option value="date">Oldest First</option>
                                <option value="-amount">Highest Amount</option>
                                <option value="amount">Lowest Amount</option>
                                <option value="description">Description A-Z</option>
                                <option value="-description">Description Z-A</option>
                            </select>
                        </div>
                        <button onclick="transactionManager.clearFilters()" class="text-blue-600 hover:text-blue-800 font-medium">
                            Clear Filters
                        </button>
                    </div>
                </div>

                <!-- Transaction Table -->
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="transactionTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Transactions will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div id="transactionPagination" class="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <!-- Pagination controls will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        // Populate filter dropdowns
        this.populateFilterDropdowns();
        
        // Render transaction table
        this.renderTransactionTable();
        
        // Setup event listeners for the new elements
        this.setupEventListeners();
        
        // Setup pagination
        this.updatePagination();
    }

    populateFilterDropdowns() {
        // Populate category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }

        // Populate account filter
        const accountFilter = document.getElementById('accountFilter');
        if (accountFilter) {
            accountFilter.innerHTML = '<option value="">All Accounts</option>';
            this.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = account.name;
                accountFilter.appendChild(option);
            });
        }
    }

    renderTransactionTable() {
        const tableBody = document.getElementById('transactionTableBody');
        if (!tableBody) return;

        if (this.transactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-receipt text-4xl text-gray-300 mb-4"></i>
                            <p class="text-lg font-medium">No transactions found</p>
                            <p class="text-sm">Try adjusting your filters or add a new transaction</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const transactionRows = this.transactions.map(transaction => {
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
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
                            <div>
                                <div class="font-medium">${transaction.description}</div>
                                ${transaction.notes ? `<div class="text-xs text-gray-500">${transaction.notes}</div>` : ''}
                            </div>
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
                            <button onclick="transactionManager.showEditModal(${transaction.id})" 
                                    class="text-blue-600 hover:text-blue-900 transition-colors" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="transactionManager.duplicateTransaction(${transaction.id})" 
                                    class="text-green-600 hover:text-green-900 transition-colors" title="Duplicate">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button onclick="transactionManager.deleteTransaction(${transaction.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = transactionRows;
    }

    setupPagination() {
        // Pagination will be handled in updatePagination method
    }

    updatePagination() {
        const paginationContainer = document.getElementById('transactionPagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.pagination.total / this.pagination.pageSize);
        const currentPage = this.pagination.page;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = `
                <div class="text-sm text-gray-700">
                    Showing ${this.transactions.length} of ${this.pagination.total} transactions
                </div>
            `;
            return;
        }

        const startItem = (currentPage - 1) * this.pagination.pageSize + 1;
        const endItem = Math.min(currentPage * this.pagination.pageSize, this.pagination.total);

        paginationContainer.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div class="text-sm text-gray-700">
                    Showing ${startItem} to ${endItem} of ${this.pagination.total} transactions
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="transactionManager.goToPage(${currentPage - 1})" 
                            ${currentPage === 1 ? 'disabled' : ''} 
                            class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                    </button>
                    <span class="text-sm text-gray-700">
                        Page ${currentPage} of ${totalPages}
                    </span>
                    <button onclick="transactionManager.goToPage(${currentPage + 1})" 
                            ${currentPage === totalPages ? 'disabled' : ''} 
                            class="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next
                    </button>
                </div>
            </div>
        `;
    }

    async goToPage(page) {
        if (page < 1 || page > Math.ceil(this.pagination.total / this.pagination.pageSize)) {
            return;
        }
        
        this.pagination.page = page;
        await this.loadTransactions();
        this.renderTransactionTable();
        this.updatePagination();
    }

    clearFilters() {
        this.filters = {
            search: '',
            category: '',
            account: '',
            type: '',
            dateFrom: '',
            dateTo: '',
            sortBy: '-date'
        };

        // Clear form inputs
        const searchInput = document.getElementById('transactionSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const accountFilter = document.getElementById('accountFilter');
        const typeFilter = document.getElementById('typeFilter');
        const dateFromInput = document.getElementById('dateFrom');
        const dateToInput = document.getElementById('dateTo');
        const sortSelect = document.getElementById('sortBy');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (accountFilter) accountFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        if (sortSelect) sortSelect.value = '-date';

        this.applyFilters();
    }

    showAddModal() {
        this.currentTransaction = null;
        this.showTransactionModal('Add Transaction');
    }

    async showEditModal(transactionId) {
        try {
            if (authManager.isAuthenticated) {
                this.currentTransaction = await API.transactions.getTransaction(transactionId);
            } else {
                this.currentTransaction = this.transactions.find(t => t.id === transactionId);
            }
            
            if (this.currentTransaction) {
                this.showTransactionModal('Edit Transaction');
            }
        } catch (error) {
            console.error('Failed to load transaction:', error);
            showNotification('Failed to load transaction', 'error');
        }
    }

    showTransactionModal(title) {
        const isEdit = this.currentTransaction !== null;
        const transaction = this.currentTransaction || {};

        const modalHTML = `
            <div id="transactionModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                            <button onclick="transactionManager.hideTransactionModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="transactionForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select id="transactionType" name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="expense" ${transaction.type === 'expense' ? 'selected' : ''}>Expense</option>
                                        <option value="income" ${transaction.type === 'income' ? 'selected' : ''}>Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input type="number" id="transactionAmount" name="amount" step="0.01" required
                                        value="${transaction.amount ? Math.abs(transaction.amount) : ''}"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" id="transactionDescription" name="description" required
                                    value="${transaction.description || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="transactionCategory" name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Account</label>
                                <select id="transactionAccount" name="account" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select Account</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" id="transactionDate" name="date" required
                                    value="${transaction.date || new Date().toISOString().split('T')[0]}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea id="transactionNotes" name="notes" rows="3"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${transaction.notes || ''}</textarea>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="transactionManager.hideTransactionModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    ${isEdit ? 'Update' : 'Add'} Transaction
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate dropdowns
        this.populateModalDropdowns();
        
        // Setup form submission
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Setup type change handler to filter categories
        document.getElementById('transactionType').addEventListener('change', () => {
            this.updateCategoryOptions();
        });

        // Trigger initial category update
        this.updateCategoryOptions();

        // Close on backdrop click
        document.getElementById('transactionModal').addEventListener('click', (e) => {
            if (e.target.id === 'transactionModal') {
                this.hideTransactionModal();
            }
        });
    }

    populateModalDropdowns() {
        const categorySelect = document.getElementById('transactionCategory');
        const accountSelect = document.getElementById('transactionAccount');

        // Populate accounts
        if (accountSelect) {
            accountSelect.innerHTML = '<option value="">Select Account</option>';
            this.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = account.name;
                if (this.currentTransaction && this.currentTransaction.account?.id === account.id) {
                    option.selected = true;
                }
                accountSelect.appendChild(option);
            });
        }
    }

    updateCategoryOptions() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (!typeSelect || !categorySelect) return;

        const selectedType = typeSelect.value;
        const filteredCategories = this.categories.filter(cat => cat.type === selectedType);

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (this.currentTransaction && this.currentTransaction.category?.id === category.id) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    }

    hideTransactionModal() {
        const modal = document.getElementById('transactionModal');
        if (modal) {
            modal.remove();
        }
        this.currentTransaction = null;
    }

    async saveTransaction() {
        try {
            showLoading(true, 'Saving transaction...');

            const formData = new FormData(document.getElementById('transactionForm'));
            const transactionData = {
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                type: formData.get('type'),
                category: parseInt(formData.get('category')),
                account: parseInt(formData.get('account')),
                date: formData.get('date'),
                notes: formData.get('notes') || ''
            };

            // Adjust amount sign based on type
            if (transactionData.type === 'expense' && transactionData.amount > 0) {
                transactionData.amount = -transactionData.amount;
            }

            let savedTransaction;
            if (this.currentTransaction) {
                // Update existing transaction
                if (authManager.isAuthenticated) {
                    savedTransaction = await API.transactions.updateTransaction(this.currentTransaction.id, transactionData);
                } else {
                    // Update in mock data
                    const index = this.transactions.findIndex(t => t.id === this.currentTransaction.id);
                    if (index !== -1) {
                        savedTransaction = { ...transactionData, id: this.currentTransaction.id };
                        // Add category and account objects
                        savedTransaction.category = this.categories.find(c => c.id === transactionData.category);
                        savedTransaction.account = this.accounts.find(a => a.id === transactionData.account);
                        this.transactions[index] = savedTransaction;
                    }
                }
                showNotification('Transaction updated successfully', 'success');
            } else {
                // Create new transaction
                if (authManager.isAuthenticated) {
                    savedTransaction = await API.transactions.createTransaction(transactionData);
                } else {
                    // Add to mock data
                    savedTransaction = { 
                        ...transactionData, 
                        id: Date.now() // Simple ID generation for mock
                    };
                    // Add category and account objects
                    savedTransaction.category = this.categories.find(c => c.id === transactionData.category);
                    savedTransaction.account = this.accounts.find(a => a.id === transactionData.account);
                    this.transactions.unshift(savedTransaction);
                    this.pagination.total++;
                }
                showNotification('Transaction added successfully', 'success');
            }

            this.hideTransactionModal();
            this.renderTransactionTable();
            this.updatePagination();

            // Refresh dashboard if it's the current page
            if (window.dashboardManager && navigationManager.getCurrentPage() === 'dashboard') {
                window.dashboardManager.refreshStats();
            }

        } catch (error) {
            console.error('Failed to save transaction:', error);
            showNotification('Failed to save transaction', 'error');
        } finally {
            showLoading(false);
        }
    }

    async duplicateTransaction(transactionId) {
        try {
            const transaction = authManager.isAuthenticated 
                ? await API.transactions.getTransaction(transactionId)
                : this.transactions.find(t => t.id === transactionId);

            if (transaction) {
                this.currentTransaction = { 
                    ...transaction, 
                    id: null, 
                    date: new Date().toISOString().split('T')[0] 
                };
                this.showTransactionModal('Duplicate Transaction');
            }
        } catch (error) {
            console.error('Failed to duplicate transaction:', error);
            showNotification('Failed to duplicate transaction', 'error');
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
                this.transactions = this.transactions.filter(t => t.id !== transactionId);
                this.pagination.total--;
            }

            showNotification('Transaction deleted successfully', 'success');
            this.renderTransactionTable();
            this.updatePagination();

            // Refresh dashboard if it's the current page
            if (window.dashboardManager && navigationManager.getCurrentPage() === 'dashboard') {
                window.dashboardManager.refreshStats();
            }

        } catch (error) {
            console.error('Failed to delete transaction:', error);
            showNotification('Failed to delete transaction', 'error');
        } finally {
            showLoading(false);
        }
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
window.TransactionManager = TransactionManager;
