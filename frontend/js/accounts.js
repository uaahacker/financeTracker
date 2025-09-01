// Accounts Management
class AccountManager {
    constructor() {
        this.accounts = [];
        this.currentAccount = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Accounts...');
        await this.loadAccounts();
        this.renderAccountsPage();
    }

    async loadAccounts() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading accounts...');

            if (authManager.isAuthenticated) {
                this.accounts = await API.accounts.getAccounts();
            } else {
                this.accounts = this.getMockAccounts();
            }

        } catch (error) {
            console.error('Failed to load accounts:', error);
            showNotification('Failed to load accounts', 'error');
            this.accounts = this.getMockAccounts();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    getMockAccounts() {
        return [
            { 
                id: 1, 
                name: 'Main Checking', 
                type: 'checking', 
                balance: 5420.50, 
                description: 'Primary checking account',
                bank: 'Chase Bank',
                account_number: '****1234',
                is_active: true
            },
            { 
                id: 2, 
                name: 'Emergency Savings', 
                type: 'savings', 
                balance: 12350.00, 
                description: 'Emergency fund savings',
                bank: 'Chase Bank',
                account_number: '****5678',
                is_active: true
            },
            { 
                id: 3, 
                name: 'Credit Card', 
                type: 'credit', 
                balance: -2340.75, 
                description: 'Main credit card',
                bank: 'American Express',
                account_number: '****9012',
                is_active: true
            },
            { 
                id: 4, 
                name: 'Investment Portfolio', 
                type: 'investment', 
                balance: 8960.25, 
                description: 'Stock and bond investments',
                bank: 'Fidelity',
                account_number: '****3456',
                is_active: true
            }
        ];
    }

    renderAccountsPage() {
        const content = document.getElementById('accountsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Accounts</h1>
                    <button onclick="accountManager.showAddModal()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Add Account
                    </button>
                </div>

                <!-- Account Summary -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-wallet text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Assets</p>
                                <p class="text-2xl font-bold text-green-600" id="totalAssets">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-credit-card text-2xl text-red-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Liabilities</p>
                                <p class="text-2xl font-bold text-red-600" id="totalLiabilities">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-chart-line text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Net Worth</p>
                                <p class="text-2xl font-bold text-blue-600" id="netWorth">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-university text-2xl text-purple-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Accounts</p>
                                <p class="text-2xl font-bold text-purple-600" id="totalAccounts">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Accounts Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="accountsGrid">
                    <!-- Account cards will be loaded here -->
                </div>

                <!-- Account Balance Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Balances</h3>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="accountBalanceChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.updateAccountSummary();
        this.renderAccountCards();
        this.initializeAccountChart();
    }

    updateAccountSummary() {
        const assets = this.accounts
            .filter(acc => acc.balance > 0)
            .reduce((sum, acc) => sum + acc.balance, 0);
        
        const liabilities = Math.abs(this.accounts
            .filter(acc => acc.balance < 0)
            .reduce((sum, acc) => sum + acc.balance, 0));
        
        const netWorth = assets - liabilities;

        document.getElementById('totalAssets').textContent = this.formatCurrency(assets);
        document.getElementById('totalLiabilities').textContent = this.formatCurrency(liabilities);
        document.getElementById('netWorth').textContent = this.formatCurrency(netWorth);
        document.getElementById('totalAccounts').textContent = this.accounts.length;
    }

    renderAccountCards() {
        const container = document.getElementById('accountsGrid');
        if (!container) return;

        if (this.accounts.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i class="fas fa-university text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">No accounts yet</p>
                    <p class="text-sm mb-4">Add your first account to get started</p>
                    <button onclick="accountManager.showAddModal()" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Add Account
                    </button>
                </div>
            `;
            return;
        }

        const accountCards = this.accounts.map(account => {
            const typeConfig = this.getAccountTypeConfig(account.type);
            const balanceClass = account.balance >= 0 ? 'text-green-600' : 'text-red-600';
            const balancePrefix = account.balance >= 0 ? '' : '-';

            return `
                <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <div class="${typeConfig.bgColor} p-3 rounded-lg mr-4">
                                <i class="${typeConfig.icon} text-2xl ${typeConfig.textColor}"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${account.name}</h3>
                                <p class="text-sm text-gray-600">${typeConfig.label}</p>
                                ${account.bank ? `<p class="text-xs text-gray-500">${account.bank}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="accountManager.showEditModal(${account.id})" 
                                    class="text-blue-600 hover:text-blue-900 transition-colors" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="accountManager.toggleAccountStatus(${account.id})" 
                                    class="${account.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} transition-colors" 
                                    title="${account.is_active ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${account.is_active ? 'pause' : 'play'}"></i>
                            </button>
                            <button onclick="accountManager.deleteAccount(${account.id})" 
                                    class="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-medium text-gray-600">Current Balance</span>
                            <span class="text-xl font-bold ${balanceClass}">
                                ${balancePrefix}${this.formatCurrency(Math.abs(account.balance))}
                            </span>
                        </div>
                        
                        ${account.account_number ? `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-600">Account Number</span>
                            <span class="text-sm font-mono text-gray-900">${account.account_number}</span>
                        </div>
                        ` : ''}
                        
                        ${account.description ? `
                        <div class="pt-2 border-t border-gray-200">
                            <p class="text-sm text-gray-600">${account.description}</p>
                        </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${account.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button onclick="accountManager.viewAccountDetails(${account.id})" 
                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = accountCards;
    }

    getAccountTypeConfig(type) {
        const configs = {
            checking: {
                label: 'Checking Account',
                icon: 'fas fa-money-check',
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-600'
            },
            savings: {
                label: 'Savings Account',
                icon: 'fas fa-piggy-bank',
                bgColor: 'bg-green-100',
                textColor: 'text-green-600'
            },
            credit: {
                label: 'Credit Card',
                icon: 'fas fa-credit-card',
                bgColor: 'bg-red-100',
                textColor: 'text-red-600'
            },
            investment: {
                label: 'Investment Account',
                icon: 'fas fa-chart-line',
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-600'
            },
            loan: {
                label: 'Loan Account',
                icon: 'fas fa-hand-holding-usd',
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-600'
            },
            other: {
                label: 'Other Account',
                icon: 'fas fa-university',
                bgColor: 'bg-gray-100',
                textColor: 'text-gray-600'
            }
        };

        return configs[type] || configs.other;
    }

    initializeAccountChart() {
        const chartData = {
            labels: this.accounts.map(acc => acc.name),
            values: this.accounts.map(acc => acc.balance)
        };
        chartManager.createAccountBalanceChart('accountBalanceChart', chartData);
    }

    showAddModal() {
        this.currentAccount = null;
        this.showAccountModal('Add Account');
    }

    async showEditModal(accountId) {
        try {
            if (authManager.isAuthenticated) {
                this.currentAccount = await API.accounts.getAccount(accountId);
            } else {
                this.currentAccount = this.accounts.find(a => a.id === accountId);
            }
            
            if (this.currentAccount) {
                this.showAccountModal('Edit Account');
            }
        } catch (error) {
            console.error('Failed to load account:', error);
            showNotification('Failed to load account', 'error');
        }
    }

    showAccountModal(title) {
        const isEdit = this.currentAccount !== null;
        const account = this.currentAccount || {};

        const modalHTML = `
            <div id="accountModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                            <button onclick="accountManager.hideAccountModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="accountForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                <input type="text" id="accountName" name="name" required
                                    value="${account.name || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                                <select id="accountType" name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select Type</option>
                                    <option value="checking" ${account.type === 'checking' ? 'selected' : ''}>Checking Account</option>
                                    <option value="savings" ${account.type === 'savings' ? 'selected' : ''}>Savings Account</option>
                                    <option value="credit" ${account.type === 'credit' ? 'selected' : ''}>Credit Card</option>
                                    <option value="investment" ${account.type === 'investment' ? 'selected' : ''}>Investment Account</option>
                                    <option value="loan" ${account.type === 'loan' ? 'selected' : ''}>Loan Account</option>
                                    <option value="other" ${account.type === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                                <input type="number" id="accountBalance" name="balance" step="0.01" required
                                    value="${account.balance || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Bank/Institution (Optional)</label>
                                <input type="text" id="accountBank" name="bank"
                                    value="${account.bank || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Account Number (Optional)</label>
                                <input type="text" id="accountNumber" name="account_number"
                                    value="${account.account_number || ''}"
                                    placeholder="****1234"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea id="accountDescription" name="description" rows="3"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${account.description || ''}</textarea>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="accountActive" name="is_active" 
                                    ${account.is_active !== false ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <label for="accountActive" class="ml-2 text-sm text-gray-700">Account is active</label>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="accountManager.hideAccountModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    ${isEdit ? 'Update' : 'Add'} Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup form submission
        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        // Close on backdrop click
        document.getElementById('accountModal').addEventListener('click', (e) => {
            if (e.target.id === 'accountModal') {
                this.hideAccountModal();
            }
        });
    }

    hideAccountModal() {
        const modal = document.getElementById('accountModal');
        if (modal) {
            modal.remove();
        }
        this.currentAccount = null;
    }

    async saveAccount() {
        try {
            showLoading(true, 'Saving account...');

            const formData = new FormData(document.getElementById('accountForm'));
            const accountData = {
                name: formData.get('name'),
                type: formData.get('type'),
                balance: parseFloat(formData.get('balance')),
                bank: formData.get('bank') || '',
                account_number: formData.get('account_number') || '',
                description: formData.get('description') || '',
                is_active: formData.has('is_active')
            };

            let savedAccount;
            if (this.currentAccount) {
                // Update existing account
                if (authManager.isAuthenticated) {
                    savedAccount = await API.accounts.updateAccount(this.currentAccount.id, accountData);
                } else {
                    // Update in mock data
                    const index = this.accounts.findIndex(a => a.id === this.currentAccount.id);
                    if (index !== -1) {
                        savedAccount = { ...accountData, id: this.currentAccount.id };
                        this.accounts[index] = savedAccount;
                    }
                }
                showNotification('Account updated successfully', 'success');
            } else {
                // Create new account
                if (authManager.isAuthenticated) {
                    savedAccount = await API.accounts.createAccount(accountData);
                } else {
                    // Add to mock data
                    savedAccount = { 
                        ...accountData, 
                        id: Date.now() // Simple ID generation for mock
                    };
                    this.accounts.push(savedAccount);
                }
                showNotification('Account added successfully', 'success');
            }

            this.hideAccountModal();
            this.updateAccountSummary();
            this.renderAccountCards();
            this.initializeAccountChart();

        } catch (error) {
            console.error('Failed to save account:', error);
            showNotification('Failed to save account', 'error');
        } finally {
            showLoading(false);
        }
    }

    async toggleAccountStatus(accountId) {
        try {
            const account = this.accounts.find(a => a.id === accountId);
            if (!account) return;

            const newStatus = !account.is_active;
            const statusText = newStatus ? 'activated' : 'deactivated';

            if (authManager.isAuthenticated) {
                await API.accounts.updateAccount(accountId, { is_active: newStatus });
            } else {
                // Update in mock data
                account.is_active = newStatus;
            }

            showNotification(`Account ${statusText} successfully`, 'success');
            this.renderAccountCards();

        } catch (error) {
            console.error('Failed to toggle account status:', error);
            showNotification('Failed to update account status', 'error');
        }
    }

    async deleteAccount(accountId) {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete this account? This action cannot be undone.',
            'Delete Account'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Deleting account...');

            if (authManager.isAuthenticated) {
                await API.accounts.deleteAccount(accountId);
            } else {
                // Remove from mock data
                this.accounts = this.accounts.filter(a => a.id !== accountId);
            }

            showNotification('Account deleted successfully', 'success');
            this.updateAccountSummary();
            this.renderAccountCards();
            this.initializeAccountChart();

        } catch (error) {
            console.error('Failed to delete account:', error);
            if (error.status === 400) {
                showNotification('Cannot delete account that has transactions', 'error');
            } else {
                showNotification('Failed to delete account', 'error');
            }
        } finally {
            showLoading(false);
        }
    }

    viewAccountDetails(accountId) {
        // This could open a detailed view or navigate to account-specific transactions
        showNotification('Account details feature coming soon', 'info');
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
window.AccountManager = AccountManager;
