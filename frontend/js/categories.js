// Categories Management
class CategoryManager {
    constructor() {
        this.categories = [];
        this.currentCategory = null;
        this.isLoading = false;
    }

    async init() {
        console.log('Initializing Categories...');
        await this.loadCategories();
        this.renderCategoriesPage();
    }

    async loadCategories() {
        try {
            this.isLoading = true;
            showLoading(true, 'Loading categories...');

            if (authManager.isAuthenticated) {
                this.categories = await API.categories.getCategories();
            } else {
                this.categories = this.getMockCategories();
            }

        } catch (error) {
            console.error('Failed to load categories:', error);
            showNotification('Failed to load categories', 'error');
            this.categories = this.getMockCategories();
        } finally {
            this.isLoading = false;
            showLoading(false);
        }
    }

    getMockCategories() {
        return [
            { id: 1, name: 'Food & Dining', color: '#10B981', type: 'expense', description: 'Groceries, restaurants, takeout' },
            { id: 2, name: 'Transportation', color: '#F59E0B', type: 'expense', description: 'Gas, public transit, parking' },
            { id: 3, name: 'Entertainment', color: '#8B5CF6', type: 'expense', description: 'Movies, games, hobbies' },
            { id: 4, name: 'Utilities', color: '#EF4444', type: 'expense', description: 'Electricity, water, internet' },
            { id: 5, name: 'Healthcare', color: '#06B6D4', type: 'expense', description: 'Medical, dental, pharmacy' },
            { id: 6, name: 'Shopping', color: '#EC4899', type: 'expense', description: 'Clothing, electronics, home goods' },
            { id: 7, name: 'Education', color: '#14B8A6', type: 'expense', description: 'Books, courses, tuition' },
            { id: 8, name: 'Travel', color: '#F97316', type: 'expense', description: 'Flights, hotels, vacation' },
            { id: 9, name: 'Insurance', color: '#84CC16', type: 'expense', description: 'Auto, health, home insurance' },
            { id: 10, name: 'Other Expenses', color: '#6B7280', type: 'expense', description: 'Miscellaneous expenses' },
            { id: 11, name: 'Salary', color: '#3B82F6', type: 'income', description: 'Primary employment income' },
            { id: 12, name: 'Freelance', color: '#10B981', type: 'income', description: 'Contract and freelance work' },
            { id: 13, name: 'Investments', color: '#8B5CF6', type: 'income', description: 'Dividends, capital gains' },
            { id: 14, name: 'Rental Income', color: '#F59E0B', type: 'income', description: 'Property rental income' },
            { id: 15, name: 'Business Income', color: '#EF4444', type: 'income', description: 'Business profits and revenue' },
            { id: 16, name: 'Other Income', color: '#6B7280', type: 'income', description: 'Miscellaneous income' }
        ];
    }

    renderCategoriesPage() {
        const content = document.getElementById('categoriesContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
                    <button onclick="categoryManager.showAddModal()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
                        <i class="fas fa-plus mr-2"></i>Add Category
                    </button>
                </div>

                <!-- Category Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-red-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-arrow-down text-2xl text-red-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Expense Categories</p>
                                <p class="text-2xl font-bold text-gray-900" id="expenseCategoriesCount">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-green-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-arrow-up text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Income Categories</p>
                                <p class="text-2xl font-bold text-gray-900" id="incomeCategoriesCount">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl shadow-lg card-hover">
                        <div class="flex items-center">
                            <div class="bg-blue-100 p-3 rounded-lg mr-4">
                                <i class="fas fa-tags text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Categories</p>
                                <p class="text-2xl font-bold text-gray-900" id="totalCategoriesCount">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Categories Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Expense Categories -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-arrow-down text-red-500 mr-2"></i>
                                Expense Categories
                            </h3>
                            <button onclick="categoryManager.showAddModal('expense')" class="text-red-600 hover:text-red-800 font-medium">
                                <i class="fas fa-plus mr-1"></i>Add
                            </button>
                        </div>
                        <div id="expenseCategoriesList" class="space-y-3">
                            <!-- Expense categories will be loaded here -->
                        </div>
                    </div>

                    <!-- Income Categories -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                <i class="fas fa-arrow-up text-green-500 mr-2"></i>
                                Income Categories
                            </h3>
                            <button onclick="categoryManager.showAddModal('income')" class="text-green-600 hover:text-green-800 font-medium">
                                <i class="fas fa-plus mr-1"></i>Add
                            </button>
                        </div>
                        <div id="incomeCategoriesList" class="space-y-3">
                            <!-- Income categories will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Category Usage Chart -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Category Usage</h3>
                    <div class="chart-container" style="height: 400px;">
                        <canvas id="categoryUsageChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.updateCategoryStats();
        this.renderCategoryLists();
        this.initializeCategoryChart();
    }

    updateCategoryStats() {
        const expenseCategories = this.categories.filter(cat => cat.type === 'expense');
        const incomeCategories = this.categories.filter(cat => cat.type === 'income');

        document.getElementById('expenseCategoriesCount').textContent = expenseCategories.length;
        document.getElementById('incomeCategoriesCount').textContent = incomeCategories.length;
        document.getElementById('totalCategoriesCount').textContent = this.categories.length;
    }

    renderCategoryLists() {
        this.renderCategoryList('expense');
        this.renderCategoryList('income');
    }

    renderCategoryList(type) {
        const containerId = type === 'expense' ? 'expenseCategoriesList' : 'incomeCategoriesList';
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = this.categories.filter(cat => cat.type === type);

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-tags text-3xl text-gray-300 mb-2"></i>
                    <p>No ${type} categories yet</p>
                    <button onclick="categoryManager.showAddModal('${type}')" class="text-blue-600 hover:text-blue-800 font-medium mt-2">
                        Add your first ${type} category
                    </button>
                </div>
            `;
            return;
        }

        const categoryItems = categories.map(category => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 rounded-full" style="background-color: ${category.color}"></div>
                    <div>
                        <h4 class="font-medium text-gray-900">${category.name}</h4>
                        ${category.description ? `<p class="text-sm text-gray-600">${category.description}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="categoryManager.showEditModal(${category.id})" 
                            class="text-blue-600 hover:text-blue-900 transition-colors" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="categoryManager.deleteCategory(${category.id})" 
                            class="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoryItems;
    }

    initializeCategoryChart() {
        // This would show category usage statistics
        const chartData = chartManager.generateSampleData('category', 'month');
        chartManager.createCategoryChart('categoryUsageChart', chartData);
    }

    showAddModal(type = 'expense') {
        this.currentCategory = null;
        this.showCategoryModal('Add Category', type);
    }

    async showEditModal(categoryId) {
        try {
            if (authManager.isAuthenticated) {
                this.currentCategory = await API.categories.getCategory(categoryId);
            } else {
                this.currentCategory = this.categories.find(c => c.id === categoryId);
            }
            
            if (this.currentCategory) {
                this.showCategoryModal('Edit Category');
            }
        } catch (error) {
            console.error('Failed to load category:', error);
            showNotification('Failed to load category', 'error');
        }
    }

    showCategoryModal(title, defaultType = 'expense') {
        const isEdit = this.currentCategory !== null;
        const category = this.currentCategory || { type: defaultType };

        const modalHTML = `
            <div id="categoryModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">${title}</h2>
                            <button onclick="categoryManager.hideCategoryModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <form id="categoryForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" id="categoryName" name="name" required
                                    value="${category.name || ''}"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select id="categoryType" name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="expense" ${category.type === 'expense' ? 'selected' : ''}>Expense</option>
                                    <option value="income" ${category.type === 'income' ? 'selected' : ''}>Income</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                <div class="flex items-center space-x-2">
                                    <input type="color" id="categoryColor" name="color" 
                                        value="${category.color || '#6B7280'}"
                                        class="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer">
                                    <input type="text" id="categoryColorHex" 
                                        value="${category.color || '#6B7280'}"
                                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                </div>
                                <div class="mt-2 flex flex-wrap gap-2">
                                    ${this.getColorPresets().map(color => `
                                        <button type="button" onclick="categoryManager.selectColor('${color}')" 
                                                class="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                                style="background-color: ${color}"></button>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                <textarea id="categoryDescription" name="description" rows="3"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${category.description || ''}</textarea>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="categoryManager.hideCategoryModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    ${isEdit ? 'Update' : 'Add'} Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup color input synchronization
        this.setupColorInputs();
        
        // Setup form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // Close on backdrop click
        document.getElementById('categoryModal').addEventListener('click', (e) => {
            if (e.target.id === 'categoryModal') {
                this.hideCategoryModal();
            }
        });
    }

    setupColorInputs() {
        const colorInput = document.getElementById('categoryColor');
        const colorHexInput = document.getElementById('categoryColorHex');

        if (colorInput && colorHexInput) {
            colorInput.addEventListener('change', (e) => {
                colorHexInput.value = e.target.value;
            });

            colorHexInput.addEventListener('input', (e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                    colorInput.value = value;
                }
            });
        }
    }

    getColorPresets() {
        return [
            '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
            '#06B6D4', '#84CC16', '#F97316', '#6B7280', '#14B8A6', '#F43F5E'
        ];
    }

    selectColor(color) {
        const colorInput = document.getElementById('categoryColor');
        const colorHexInput = document.getElementById('categoryColorHex');
        
        if (colorInput) colorInput.value = color;
        if (colorHexInput) colorHexInput.value = color;
    }

    hideCategoryModal() {
        const modal = document.getElementById('categoryModal');
        if (modal) {
            modal.remove();
        }
        this.currentCategory = null;
    }

    async saveCategory() {
        try {
            showLoading(true, 'Saving category...');

            const formData = new FormData(document.getElementById('categoryForm'));
            const categoryData = {
                name: formData.get('name'),
                type: formData.get('type'),
                color: formData.get('color') || document.getElementById('categoryColor').value,
                description: formData.get('description') || ''
            };

            let savedCategory;
            if (this.currentCategory) {
                // Update existing category
                if (authManager.isAuthenticated) {
                    savedCategory = await API.categories.updateCategory(this.currentCategory.id, categoryData);
                } else {
                    // Update in mock data
                    const index = this.categories.findIndex(c => c.id === this.currentCategory.id);
                    if (index !== -1) {
                        savedCategory = { ...categoryData, id: this.currentCategory.id };
                        this.categories[index] = savedCategory;
                    }
                }
                showNotification('Category updated successfully', 'success');
            } else {
                // Create new category
                if (authManager.isAuthenticated) {
                    savedCategory = await API.categories.createCategory(categoryData);
                } else {
                    // Add to mock data
                    savedCategory = { 
                        ...categoryData, 
                        id: Date.now() // Simple ID generation for mock
                    };
                    this.categories.push(savedCategory);
                }
                showNotification('Category added successfully', 'success');
            }

            this.hideCategoryModal();
            this.updateCategoryStats();
            this.renderCategoryLists();

        } catch (error) {
            console.error('Failed to save category:', error);
            showNotification('Failed to save category', 'error');
        } finally {
            showLoading(false);
        }
    }

    async deleteCategory(categoryId) {
        const confirmed = await showConfirmation(
            'Are you sure you want to delete this category? This action cannot be undone.',
            'Delete Category'
        );

        if (!confirmed) return;

        try {
            showLoading(true, 'Deleting category...');

            if (authManager.isAuthenticated) {
                await API.categories.deleteCategory(categoryId);
            } else {
                // Remove from mock data
                this.categories = this.categories.filter(c => c.id !== categoryId);
            }

            showNotification('Category deleted successfully', 'success');
            this.updateCategoryStats();
            this.renderCategoryLists();

        } catch (error) {
            console.error('Failed to delete category:', error);
            if (error.status === 400) {
                showNotification('Cannot delete category that is in use by transactions', 'error');
            } else {
                showNotification('Failed to delete category', 'error');
            }
        } finally {
            showLoading(false);
        }
    }
}

// Export class for global use
window.CategoryManager = CategoryManager;
