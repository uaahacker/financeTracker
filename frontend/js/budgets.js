// Budgets Management
class BudgetManager {
    constructor() {
        this.budgets = [];
        this.currentBudget = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Budgets...');
        await this.loadBudgets();
        this.renderBudgetsPage();
    }

    async loadBudgets() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading budgets...');

            if (authManager.isAuthenticated) {
                this.budgets = await API.budgets.getBudgets();
            } else {
                this.budgets = this.getMockBudgets();
            }

        } catch (error) {
            console.error('Failed to load budgets:', error);
            showNotification('Failed to load budgets', 'error');
            this.budgets = this.getMockBudgets();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    getMockBudgets() {
        return [
            {
                id: 1,
                name: 'Monthly Food Budget',
                category: { id: 1, name: 'Food & Dining', color: '#10B981' },
                amount: 800,
                spent: 650,
                period: 'monthly',
                start_date: '2024-03-01',
                end_date: '2024-03-31',
                is_active: true,
                notifications: true
            },
            {
                id: 2,
                name: 'Transportation Budget',
                category: { id: 2, name: 'Transportation', color: '#F59E0B' },
                amount: 400,
                spent: 420,
                period: 'monthly',
                start_date: '2024-03-01',
                end_date: '2024-03-31',
                is_active: true,
                notifications: true
            },
            {
                id: 3,
                name: 'Entertainment Budget',
                category: { id: 3, name: 'Entertainment', color: '#8B5CF6' },
                amount: 300,
                spent: 180,
                period: 'monthly',
                start_date: '2024-03-01',
                end_date: '2024-03-31',
                is_active: true,
                notifications: false
            }
        ];
    }

    renderBudgetsPage() {
        const content = document.getElementById('budgetsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Budgets</h1>
                    <button onclick="budgetManager.showAddModal()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Create Budget
                    </button>
                </div>

                <!-- Budget Overview -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-clipboard-list text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Budgets</p>
                                <p class="text-2xl font-bold text-blue-600" id="totalBudgets">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-dollar-sign text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Budgeted</p>
                                <p class="text-2xl font-bold text-green-600" id="totalBudgeted">$0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-receipt text-2xl text-red-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Spent</p>
                                <p class="text-2xl font-bold text-red-600" id="totalSpent">$0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-percentage text-2xl text-purple-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Avg. Usage</p>
                                <p class="text-2xl font-bold text-purple-600" id="avgUsage">0%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Budget Progress Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="budgetProgressChart"></canvas>
                    </div>
                </div>

                <!-- Budget Cards -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="budgetCards">
                    <!-- Budget cards will be loaded here -->
                </div>
            </div>
        `;

        this.updateBudgetOverview();
        this.renderBudgetCards();
        this.initializeBudgetChart();
    }

    updateBudgetOverview() {
        const totalBudgets = this.budgets.length;
        const totalBudgeted = this.budgets.reduce((sum, budget) => sum + budget.amount, 0);
        const totalSpent = this.budgets.reduce((sum, budget) => sum + budget.spent, 0);
        const avgUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

        document.getElementById('totalBudgets').textContent = totalBudgets;
        document.getElementById('totalBudgeted').textContent = this.formatCurrency(totalBudgeted);
        document.getElementById('totalSpent').textContent = this.formatCurrency(totalSpent);
        document.getElementById('avgUsage').textContent = `${avgUsage.toFixed(1)}%`;
    }

    renderBudgetCards() {
        const container = document.getElementById('budgetCards');
        if (!container) return;

        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i class="fas fa-piggy-bank text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">No budgets yet</p>
                    <p class="text-sm mb-4">Create your first budget to start tracking your spending</p>
                    <button onclick="budgetManager.showAddModal()" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Create Budget
                    </button>
                </div>
            `;
            return;
        }

        const budgetCards = this.budgets.map(budget => {
            const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - budget.spent;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > 80;

            let statusColor = 'bg-green-500';
            let statusText = 'On Track';
            if (isOverBudget) {
                statusColor = 'bg-red-500';
                statusText = 'Over Budget';
            } else if (isNearLimit) {
                statusColor = 'bg-yellow-500';
                statusText = 'Near Limit';
            }

            return `
                <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <div class="w-4 h-4 rounded-full mr-3" style="background-color: ${budget.category?.color || '#6B7280'}"></div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${budget.name}</h3>
                                <p class="text-sm text-gray-600">${budget.category?.name || 'No Category'}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} text-white">
                                ${statusText}
                            </span>
                            <div class="relative">
                                <button onclick="budgetManager.toggleBudgetMenu(${budget.id})" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div id="budgetMenu-${budget.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                    <button onclick="budgetManager.showEditModal(${budget.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-edit mr-2"></i>Edit Budget
                                    </button>
                                    <button onclick="budgetManager.toggleBudgetStatus(${budget.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-${budget.is_active ? 'pause' : 'play'} mr-2"></i>${budget.is_active ? 'Pause' : 'Activate'} Budget
                                    </button>
                                    <button onclick="budgetManager.deleteBudget(${budget.id})" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                        <i class="fas fa-trash mr-2"></i>Delete Budget
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Progress Bar -->
                        <div>
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Spent: ${this.formatCurrency(budget.spent)}</span>
                                <span>Budget: ${this.formatCurrency(budget.amount)}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="h-3 rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}" 
                                     style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <div class="flex justify-between text-sm mt-1">
                                <span class="text-gray-600">${percentage.toFixed(1)}% used</span>
                                <span class="${remaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium">
                                    ${remaining >= 0 ? this.formatCurrency(remaining) + ' left' : this.formatCurrency(Math.abs(remaining)) + ' over'}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Budget Details -->
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">Period:</span>
                                <span class="font-medium text-gray-900 ml-1">${budget.period}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Notifications:</span>
                                <span class="font-medium text-gray-900 ml-1">${budget.notifications ? 'On' : 'Off'}</span>
                            </div>
                        </div>
                        
                        ${budget.start_date && budget.end_date ? `
                        <div class="text-sm text-gray-600 pt-2 border-t border-gray-200">
                            ${new Date(budget.start_date).toLocaleDateString()} - ${new Date(budget.end_date).toLocaleDateString()}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = budgetCards;
    }

    initializeBudgetChart() {
        const chartData = {
            labels: this.budgets.map(b => b.name),
            budget: this.budgets.map(b => b.amount),
            spent: this.budgets.map(b => b.spent)
        };
        chartManager.createBudgetProgressChart('budgetProgressChart', chartData);
    }

    toggleBudgetMenu(budgetId) {
        const menu = document.getElementById(`budgetMenu-${budgetId}`);
        if (menu) {
            menu.classList.toggle('hidden');
        }

        // Close other menus
        document.querySelectorAll('[id^="budgetMenu-"]').forEach(otherMenu => {
            if (otherMenu.id !== `budgetMenu-${budgetId}`) {
                otherMenu.classList.add('hidden');
            }
        });
    }

    showAddModal() {
        this.currentBudget = null;
        this.showBudgetModal('Create Budget');
    }

    async showEditModal(budgetId) {
        try {
            if (authManager.isAuthenticated) {
                this.currentBudget = await API.budgets.getBudget(budgetId);
            } else {
                this.currentBudget = this.budgets.find(b => b.id === budgetId);
            }
            
            if (this.currentBudget) {
                this.showBudgetModal('Edit Budget');
            }
        } catch (error) {
            console.error('Failed to load budget:', error);
            showNotification('Failed to load budget', 'error');
        }
    }

    showBudgetModal(title) {
        const isEdit = this.currentBudget !== null;
        const budget = this.currentBudget || {};

        const modalHTML = `
            <div id="budgetModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                            <button onclick="budgetManager.hideBudgetModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="budgetForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
                                <input type="text" id="budgetName" name="name" required
                                    value="${budget.name || ''}"
                                    placeholder="e.g., Monthly Food Budget"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="budgetCategory" name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
                                <input type="number" id="budgetAmount" name="amount" step="0.01" required
                                    value="${budget.amount || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Period</label>
                                <select id="budgetPeriod" name="period" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="weekly" ${budget.period === 'weekly' ? 'selected' : ''}>Weekly</option>
                                    <option value="monthly" ${budget.period === 'monthly' ? 'selected' : ''}>Monthly</option>
                                    <option value="quarterly" ${budget.period === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                                    <option value="yearly" ${budget.period === 'yearly' ? 'selected' : ''}>Yearly</option>
                                </select>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input type="date" id="budgetStartDate" name="start_date" required
                                        value="${budget.start_date || ''}"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input type="date" id="budgetEndDate" name="end_date" required
                                        value="${budget.end_date || ''}"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                            </div>
                            
                            <div class="space-y-3">
                                <div class="flex items-center">
                                    <input type="checkbox" id="budgetActive" name="is_active" 
                                        ${budget.is_active !== false ? 'checked' : ''}
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    <label for="budgetActive" class="ml-2 text-sm text-gray-700">Budget is active</label>
                                </div>
                                
                                <div class="flex items-center">
                                    <input type="checkbox" id="budgetNotifications" name="notifications" 
                                        ${budget.notifications !== false ? 'checked' : ''}
                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    <label for="budgetNotifications" class="ml-2 text-sm text-gray-700">Enable notifications when approaching limit</label>
                                </div>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="budgetManager.hideBudgetModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    ${isEdit ? 'Update' : 'Create'} Budget
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Populate categories
        this.populateCategoryDropdown();
        
        // Setup form submission
        document.getElementById('budgetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });

        // Close on backdrop click
        document.getElementById('budgetModal').addEventListener('click', (e) => {
            if (e.target.id === 'budgetModal') {
                this.hideBudgetModal();
            }
        });
    }

    async populateCategoryDropdown() {
        const categorySelect = document.getElementById('budgetCategory');
        if (!categorySelect) return;

        try {
            let categories;
            if (authManager.isAuthenticated) {
                categories = await API.categories.getCategories();
            } else {
                categories = categoryManager.getMockCategories();
            }

            // Filter to expense categories only
            const expenseCategories = categories.filter(cat => cat.type === 'expense');

            categorySelect.innerHTML = '<option value="">Select Category</option>';
            expenseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (this.currentBudget && this.currentBudget.category?.id === category.id) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });

        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    hideBudgetModal() {
        const modal = document.getElementById('budgetModal');
        if (modal) {
            modal.remove();
        }
        this.currentBudget = null;
    }

    async saveBudget() {
        try {
            showLoading(true, 'Saving budget...');

            const formData = new FormData(document.getElementById('budgetForm'));
            const budgetData = {
                name: formData.get('name'),
                category: parseInt(formData.get('category')),
                amount: parseFloat(formData.get('amount')),
                period: formData.get('period'),
                start_date: formData.get('start_date'),
                end_date: formData.get('end_date'),
                is_active: formData.has('is_active'),
                notifications: formData.has('notifications')
            };

            let savedBudget;
            if (this.currentBudget) {
                // Update existing budget
                if (authManager.isAuthenticated) {
                    savedBudget = await API.budgets.updateBudget(this.currentBudget.id, budgetData);
                } else {
                    // Update in mock data
                    const index = this.budgets.findIndex(b => b.id === this.currentBudget.id);
                    if (index !== -1) {
                        savedBudget = { 
                            ...budgetData, 
                            id: this.currentBudget.id,
                            spent: this.currentBudget.spent
                        };
                        // Add category object
                        savedBudget.category = categoryManager.getMockCategories().find(c => c.id === budgetData.category);
                        this.budgets[index] = savedBudget;
                    }
                }
                showNotification('Budget updated successfully', 'success');
            } else {
                // Create new budget
                if (authManager.isAuthenticated) {
                    savedBudget = await API.budgets.createBudget(budgetData);
                } else {
                    // Add to mock data
                    savedBudget = { 
                        ...budgetData, 
                        id: Date.now(), // Simple ID generation for mock
                        spent: 0
                    };
                    // Add category object
                    savedBudget.category = categoryManager.getMockCategories().find(c => c.id === budgetData.category);
                    this.budgets.push(savedBudget);
                }
                showNotification('Budget created successfully', 'success');
            }

            this.hideBudgetModal();
            this.updateBudgetOverview();
            this.renderBudgetCards();
            this.initializeBudgetChart();

        } catch (error) {
            console.error('Failed to save budget:', error);
            showNotification('Failed to save budget', 'error');
        } finally {
            showLoading(false);
        }
    }

    async toggleBudgetStatus(budgetId) {
        try {
            const budget = this.budgets.find(b => b.id === budgetId);
            if (!budget) return;

            const newStatus = !budget.is_active;
            const statusText = newStatus ? 'activated' : 'paused';

            if (authManager.isAuthenticated) {
                await API.budgets.updateBudget(budgetId, { is_active: newStatus });
            } else {
                // Update in mock data
                budget.is_active = newStatus;
            }

            showNotification(`Budget ${statusText} successfully`, 'success');
            this.renderBudgetCards();

        } catch (error) {
            console.error('Failed to toggle budget status:', error);
            showNotification('Failed to update budget status', 'error');
        }
    }

    async deleteBudget(budgetId) {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete this budget? This action cannot be undone.',
            'Delete Budget'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Deleting budget...');

            if (authManager.isAuthenticated) {
                await API.budgets.deleteBudget(budgetId);
            } else {
                // Remove from mock data
                this.budgets = this.budgets.filter(b => b.id !== budgetId);
            }

            showNotification('Budget deleted successfully', 'success');
            this.updateBudgetOverview();
            this.renderBudgetCards();
            this.initializeBudgetChart();

        } catch (error) {
            console.error('Failed to delete budget:', error);
            showNotification('Failed to delete budget', 'error');
        } finally {
            showLoading(false);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Export class for global use
window.BudgetManager = BudgetManager;
