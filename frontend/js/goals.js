// Goals Management
class GoalManager {
    constructor() {
        this.goals = [];
        this.currentGoal = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Goals...');
        await this.loadGoals();
        this.renderGoalsPage();
    }

    async loadGoals() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading goals...');

            if (authManager.isAuthenticated) {
                this.goals = await API.goals.getGoals();
            } else {
                this.goals = this.getMockGoals();
            }

        } catch (error) {
            console.error('Failed to load goals:', error);
            showNotification('Failed to load goals', 'error');
            this.goals = this.getMockGoals();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    getMockGoals() {
        return [
            {
                id: 1,
                name: 'Emergency Fund',
                description: 'Build 6 months of emergency savings',
                type: 'savings',
                target_amount: 15000,
                current_amount: 8500,
                target_date: '2024-12-31',
                category: { id: 1, name: 'Emergency Fund', color: '#EF4444' },
                is_active: true,
                priority: 'high',
                created_at: '2024-01-01'
            },
            {
                id: 2,
                name: 'Vacation to Europe',
                description: 'Save for a 2-week European vacation',
                type: 'savings',
                target_amount: 5000,
                current_amount: 2800,
                target_date: '2024-07-15',
                category: { id: 2, name: 'Travel', color: '#F59E0B' },
                is_active: true,
                priority: 'medium',
                created_at: '2024-01-15'
            },
            {
                id: 3,
                name: 'Pay Off Credit Card',
                description: 'Pay off high-interest credit card debt',
                type: 'debt',
                target_amount: 3200,
                current_amount: 1200,
                target_date: '2024-06-30',
                category: { id: 3, name: 'Debt Payment', color: '#10B981' },
                is_active: true,
                priority: 'high',
                created_at: '2024-02-01'
            },
            {
                id: 4,
                name: 'New Car Down Payment',
                description: 'Save for a down payment on a new car',
                type: 'savings',
                target_amount: 8000,
                current_amount: 1500,
                target_date: '2025-03-01',
                category: { id: 4, name: 'Transportation', color: '#8B5CF6' },
                is_active: true,
                priority: 'low',
                created_at: '2024-02-15'
            }
        ];
    }

    renderGoalsPage() {
        const content = document.getElementById('goalsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Financial Goals</h1>
                    <button onclick="goalManager.showAddModal()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Create Goal
                    </button>
                </div>

                <!-- Goals Overview -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-bullseye text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Goals</p>
                                <p class="text-2xl font-bold text-blue-600" id="totalGoals">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-chart-line text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Target</p>
                                <p class="text-2xl font-bold text-green-600" id="totalTarget">$0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-purple-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-piggy-bank text-2xl text-purple-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Saved</p>
                                <p class="text-2xl font-bold text-purple-600" id="totalSaved">$0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-yellow-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-trophy text-2xl text-yellow-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Avg. Progress</p>
                                <p class="text-2xl font-bold text-yellow-600" id="avgProgress">0%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goal Progress Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Goal Progress Overview</h3>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="goalProgressChart"></canvas>
                    </div>
                </div>

                <!-- Filter Tabs -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <div class="flex flex-wrap gap-2 mb-6">
                        <button onclick="goalManager.filterGoals('all')" 
                                class="goal-filter-tab px-4 py-2 rounded-lg font-medium transition-colors active" data-filter="all">
                            All Goals
                        </button>
                        <button onclick="goalManager.filterGoals('savings')" 
                                class="goal-filter-tab px-4 py-2 rounded-lg font-medium transition-colors" data-filter="savings">
                            <i class="fas fa-piggy-bank mr-1"></i>Savings
                        </button>
                        <button onclick="goalManager.filterGoals('debt')" 
                                class="goal-filter-tab px-4 py-2 rounded-lg font-medium transition-colors" data-filter="debt">
                            <i class="fas fa-credit-card mr-1"></i>Debt
                        </button>
                        <button onclick="goalManager.filterGoals('high')" 
                                class="goal-filter-tab px-4 py-2 rounded-lg font-medium transition-colors" data-filter="high">
                            <i class="fas fa-exclamation-circle mr-1"></i>High Priority
                        </button>
                    </div>

                    <!-- Goal Cards -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="goalCards">
                        <!-- Goal cards will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        this.updateGoalOverview();
        this.renderGoalCards();
        this.initializeGoalChart();
    }

    updateGoalOverview() {
        const totalGoals = this.goals.length;
        const totalTarget = this.goals.reduce((sum, goal) => sum + goal.target_amount, 0);
        const totalSaved = this.goals.reduce((sum, goal) => sum + goal.current_amount, 0);
        const avgProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

        document.getElementById('totalGoals').textContent = totalGoals;
        document.getElementById('totalTarget').textContent = this.formatCurrency(totalTarget);
        document.getElementById('totalSaved').textContent = this.formatCurrency(totalSaved);
        document.getElementById('avgProgress').textContent = `${avgProgress.toFixed(1)}%`;
    }

    renderGoalCards(filter = 'all') {
        const container = document.getElementById('goalCards');
        if (!container) return;

        let filteredGoals = this.goals;
        
        if (filter === 'savings') {
            filteredGoals = this.goals.filter(goal => goal.type === 'savings');
        } else if (filter === 'debt') {
            filteredGoals = this.goals.filter(goal => goal.type === 'debt');
        } else if (filter === 'high') {
            filteredGoals = this.goals.filter(goal => goal.priority === 'high');
        }

        if (filteredGoals.length === 0) {
            container.innerHTML = `
                <div class="col-span-2 text-center py-12 text-gray-500">
                    <i class="fas fa-bullseye text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">No goals found</p>
                    <p class="text-sm mb-4">${filter === 'all' ? 'Create your first financial goal to start saving' : `No ${filter} goals found`}</p>
                    ${filter === 'all' ? `
                    <button onclick="goalManager.showAddModal()" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Create Goal
                    </button>
                    ` : ''}
                </div>
            `;
            return;
        }

        const goalCards = filteredGoals.map(goal => {
            const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const remaining = goal.target_amount - goal.current_amount;
            const isCompleted = percentage >= 100;
            const daysLeft = this.getDaysUntil(goal.target_date);
            
            let statusColor = 'bg-blue-500';
            let statusText = 'In Progress';
            if (isCompleted) {
                statusColor = 'bg-green-500';
                statusText = 'Completed';
            } else if (daysLeft < 0) {
                statusColor = 'bg-red-500';
                statusText = 'Overdue';
            } else if (daysLeft < 30) {
                statusColor = 'bg-yellow-500';
                statusText = 'Due Soon';
            }

            let priorityIcon = 'fas fa-circle';
            let priorityColor = 'text-gray-400';
            if (goal.priority === 'high') {
                priorityIcon = 'fas fa-exclamation-circle';
                priorityColor = 'text-red-500';
            } else if (goal.priority === 'medium') {
                priorityIcon = 'fas fa-circle';
                priorityColor = 'text-yellow-500';
            } else {
                priorityColor = 'text-green-500';
            }

            return `
                <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 card-hover border border-gray-200">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <div class="w-4 h-4 rounded-full mr-3" style="background-color: ${goal.category?.color || '#6B7280'}"></div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">${goal.name}</h3>
                                <p class="text-sm text-gray-600">${goal.description}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <i class="${priorityIcon} ${priorityColor}" title="${goal.priority} priority"></i>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor} text-white">
                                ${statusText}
                            </span>
                            <div class="relative">
                                <button onclick="goalManager.toggleGoalMenu(${goal.id})" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div id="goalMenu-${goal.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                    <button onclick="goalManager.showAddProgressModal(${goal.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-plus mr-2"></i>Add Progress
                                    </button>
                                    <button onclick="goalManager.showEditModal(${goal.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-edit mr-2"></i>Edit Goal
                                    </button>
                                    <button onclick="goalManager.toggleGoalStatus(${goal.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <i class="fas fa-${goal.is_active ? 'pause' : 'play'} mr-2"></i>${goal.is_active ? 'Pause' : 'Activate'} Goal
                                    </button>
                                    <button onclick="goalManager.deleteGoal(${goal.id})" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                        <i class="fas fa-trash mr-2"></i>Delete Goal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <!-- Progress Bar -->
                        <div>
                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress: ${this.formatCurrency(goal.current_amount)}</span>
                                <span>Target: ${this.formatCurrency(goal.target_amount)}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="h-4 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}" 
                                     style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            <div class="flex justify-between text-sm mt-1">
                                <span class="text-gray-600">${percentage.toFixed(1)}% completed</span>
                                <span class="${remaining > 0 ? 'text-red-600' : 'text-green-600'} font-medium">
                                    ${remaining > 0 ? this.formatCurrency(remaining) + ' remaining' : 'Goal achieved!'}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Goal Details -->
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">Type:</span>
                                <span class="font-medium text-gray-900 ml-1 capitalize">${goal.type}</span>
                            </div>
                            <div>
                                <span class="text-gray-600">Priority:</span>
                                <span class="font-medium text-gray-900 ml-1 capitalize">${goal.priority}</span>
                            </div>
                        </div>
                        
                        <!-- Timeline -->
                        <div class="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                            <div>
                                <span class="text-gray-600">Target Date:</span>
                                <span class="font-medium text-gray-900 ml-1">${new Date(goal.target_date).toLocaleDateString()}</span>
                            </div>
                            <div class="${daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-yellow-600' : 'text-green-600'} font-medium">
                                ${daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                                  daysLeft === 0 ? 'Due today' : 
                                  `${daysLeft} days left`}
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="flex space-x-2 pt-2">
                            <button onclick="goalManager.showAddProgressModal(${goal.id})" 
                                    class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                <i class="fas fa-plus mr-1"></i>Add Progress
                            </button>
                            <button onclick="goalManager.showGoalDetails(${goal.id})" 
                                    class="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                <i class="fas fa-chart-line mr-1"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = goalCards;
    }

    filterGoals(filter) {
        // Update active tab
        document.querySelectorAll('.goal-filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });

        this.renderGoalCards(filter);
    }

    initializeGoalChart() {
        const chartData = {
            labels: this.goals.map(g => g.name),
            target: this.goals.map(g => g.target_amount),
            current: this.goals.map(g => g.current_amount),
            colors: this.goals.map(g => g.category?.color || '#6B7280')
        };
        chartManager.createGoalProgressChart('goalProgressChart', chartData);
    }

    getDaysUntil(dateString) {
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    toggleGoalMenu(goalId) {
        const menu = document.getElementById(`goalMenu-${goalId}`);
        if (menu) {
            menu.classList.toggle('hidden');
        }

        // Close other menus
        document.querySelectorAll('[id^="goalMenu-"]').forEach(otherMenu => {
            if (otherMenu.id !== `goalMenu-${goalId}`) {
                otherMenu.classList.add('hidden');
            }
        });
    }

    showAddModal() {
        this.currentGoal = null;
        this.showGoalModal('Create Goal');
    }

    async showEditModal(goalId) {
        try {
            if (authManager.isAuthenticated) {
                this.currentGoal = await API.goals.getGoal(goalId);
            } else {
                this.currentGoal = this.goals.find(g => g.id === goalId);
            }
            
            if (this.currentGoal) {
                this.showGoalModal('Edit Goal');
            }
        } catch (error) {
            console.error('Failed to load goal:', error);
            showNotification('Failed to load goal', 'error');
        }
    }

    showGoalModal(title) {
        const isEdit = this.currentGoal !== null;
        const goal = this.currentGoal || {};

        const modalHTML = `
            <div id="goalModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                            <button onclick="goalManager.hideGoalModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="goalForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                                <input type="text" id="goalName" name="name" required
                                    value="${goal.name || ''}"
                                    placeholder="e.g., Emergency Fund"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea id="goalDescription" name="description" rows="2"
                                    placeholder="Describe your goal..."
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${goal.description || ''}</textarea>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                                    <select id="goalType" name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="savings" ${goal.type === 'savings' ? 'selected' : ''}>Savings</option>
                                        <option value="debt" ${goal.type === 'debt' ? 'selected' : ''}>Debt Payment</option>
                                        <option value="investment" ${goal.type === 'investment' ? 'selected' : ''}>Investment</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select id="goalPriority" name="priority" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option value="low" ${goal.priority === 'low' ? 'selected' : ''}>Low</option>
                                        <option value="medium" ${goal.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                        <option value="high" ${goal.priority === 'high' ? 'selected' : ''}>High</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                                    <input type="number" id="goalTargetAmount" name="target_amount" step="0.01" required
                                        value="${goal.target_amount || ''}"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                                    <input type="number" id="goalCurrentAmount" name="current_amount" step="0.01"
                                        value="${goal.current_amount || 0}"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                                <input type="date" id="goalTargetDate" name="target_date" required
                                    value="${goal.target_date || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="goalCategory" name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                            
                            <div class="flex items-center">
                                <input type="checkbox" id="goalActive" name="is_active" 
                                    ${goal.is_active !== false ? 'checked' : ''}
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <label for="goalActive" class="ml-2 text-sm text-gray-700">Goal is active</label>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="goalManager.hideGoalModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    ${isEdit ? 'Update' : 'Create'} Goal
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
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Close on backdrop click
        document.getElementById('goalModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalModal') {
                this.hideGoalModal();
            }
        });
    }

    async populateCategoryDropdown() {
        const categorySelect = document.getElementById('goalCategory');
        if (!categorySelect) return;

        try {
            let categories;
            if (authManager.isAuthenticated) {
                categories = await API.categories.getCategories();
            } else {
                categories = categoryManager.getMockCategories();
            }

            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (this.currentGoal && this.currentGoal.category?.id === category.id) {
                    option.selected = true;
                }
                categorySelect.appendChild(option);
            });

        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    hideGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.remove();
        }
        this.currentGoal = null;
    }

    showAddProgressModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const modalHTML = `
            <div id="progressModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">Add Progress</h2>
                            <button onclick="goalManager.hideProgressModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                            <h3 class="font-medium text-gray-900">${goal.name}</h3>
                            <p class="text-sm text-gray-600">Current: ${this.formatCurrency(goal.current_amount)} / ${this.formatCurrency(goal.target_amount)}</p>
                        </div>
                        
                        <form id="progressForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Amount to Add</label>
                                <input type="number" id="progressAmount" name="amount" step="0.01" required
                                    placeholder="0.00"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                                <textarea id="progressNote" name="note" rows="2"
                                    placeholder="Add a note about this progress..."
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="goalManager.hideProgressModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    Add Progress
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup form submission
        document.getElementById('progressForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProgress(goalId);
        });

        // Close on backdrop click
        document.getElementById('progressModal').addEventListener('click', (e) => {
            if (e.target.id === 'progressModal') {
                this.hideProgressModal();
            }
        });
    }

    hideProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) {
            modal.remove();
        }
    }

    async addProgress(goalId) {
        try {
            showLoading(true, 'Adding progress...');

            const formData = new FormData(document.getElementById('progressForm'));
            const amount = parseFloat(formData.get('amount'));
            const note = formData.get('note');

            const goal = this.goals.find(g => g.id === goalId);
            if (!goal) return;

            const newCurrentAmount = goal.current_amount + amount;

            if (authManager.isAuthenticated) {
                await API.goals.updateGoal(goalId, { current_amount: newCurrentAmount });
            } else {
                // Update in mock data
                goal.current_amount = newCurrentAmount;
            }

            this.hideProgressModal();
            showNotification('Progress added successfully', 'success');
            
            // Check if goal is completed
            if (newCurrentAmount >= goal.target_amount) {
                showNotification('🎉 Congratulations! Goal completed!', 'success');
            }

            this.updateGoalOverview();
            this.renderGoalCards();
            this.initializeGoalChart();

        } catch (error) {
            console.error('Failed to add progress:', error);
            showNotification('Failed to add progress', 'error');
        } finally {
            showLoading(false);
        }
    }

    async saveGoal() {
        try {
            showLoading(true, 'Saving goal...');

            const formData = new FormData(document.getElementById('goalForm'));
            const goalData = {
                name: formData.get('name'),
                description: formData.get('description'),
                type: formData.get('type'),
                priority: formData.get('priority'),
                target_amount: parseFloat(formData.get('target_amount')),
                current_amount: parseFloat(formData.get('current_amount')) || 0,
                target_date: formData.get('target_date'),
                category: parseInt(formData.get('category')),
                is_active: formData.has('is_active')
            };

            let savedGoal;
            if (this.currentGoal) {
                // Update existing goal
                if (authManager.isAuthenticated) {
                    savedGoal = await API.goals.updateGoal(this.currentGoal.id, goalData);
                } else {
                    // Update in mock data
                    const index = this.goals.findIndex(g => g.id === this.currentGoal.id);
                    if (index !== -1) {
                        savedGoal = { ...goalData, id: this.currentGoal.id };
                        // Add category object
                        savedGoal.category = categoryManager.getMockCategories().find(c => c.id === goalData.category);
                        this.goals[index] = savedGoal;
                    }
                }
                showNotification('Goal updated successfully', 'success');
            } else {
                // Create new goal
                if (authManager.isAuthenticated) {
                    savedGoal = await API.goals.createGoal(goalData);
                } else {
                    // Add to mock data
                    savedGoal = { ...goalData, id: Date.now(), created_at: new Date().toISOString() };
                    // Add category object
                    savedGoal.category = categoryManager.getMockCategories().find(c => c.id === goalData.category);
                    this.goals.push(savedGoal);
                }
                showNotification('Goal created successfully', 'success');
            }

            this.hideGoalModal();
            this.updateGoalOverview();
            this.renderGoalCards();
            this.initializeGoalChart();

        } catch (error) {
            console.error('Failed to save goal:', error);
            showNotification('Failed to save goal', 'error');
        } finally {
            showLoading(false);
        }
    }

    async toggleGoalStatus(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (!goal) return;

            const newStatus = !goal.is_active;
            const statusText = newStatus ? 'activated' : 'paused';

            if (authManager.isAuthenticated) {
                await API.goals.updateGoal(goalId, { is_active: newStatus });
            } else {
                // Update in mock data
                goal.is_active = newStatus;
            }

            showNotification(`Goal ${statusText} successfully`, 'success');
            this.renderGoalCards();

        } catch (error) {
            console.error('Failed to toggle goal status:', error);
            showNotification('Failed to update goal status', 'error');
        }
    }

    async deleteGoal(goalId) {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete this goal? This action cannot be undone.',
            'Delete Goal'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Deleting goal...');

            if (authManager.isAuthenticated) {
                await API.goals.deleteGoal(goalId);
            } else {
                // Remove from mock data
                this.goals = this.goals.filter(g => g.id !== goalId);
            }

            showNotification('Goal deleted successfully', 'success');
            this.updateGoalOverview();
            this.renderGoalCards();
            this.initializeGoalChart();

        } catch (error) {
            console.error('Failed to delete goal:', error);
            showNotification('Failed to delete goal', 'error');
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
window.GoalManager = GoalManager;
