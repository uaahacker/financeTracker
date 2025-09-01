// API Configuration and HTTP Client
class APIClient {
    constructor() {
        this.baseURL = 'http://127.0.0.1:8000/api';
        this.token = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
    }

    // Set authentication token
    setToken(token, refreshToken = null) {
        this.token = token;
        localStorage.setItem('authToken', token);
        if (refreshToken) {
            this.refreshToken = refreshToken;
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    // Clear authentication
    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
    }

    // Get default headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle 401 - try to refresh token
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request
                    config.headers = this.getHeaders();
                    const retryResponse = await fetch(url, config);
                    return await this.handleResponse(retryResponse);
                }
            }
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request failed:', error);
            throw new APIError('Network error occurred', 0);
        }
    }

    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new APIError(
                data.message || data.detail || `HTTP ${response.status}`,
                response.status,
                data
            );
        }

        return data;
    }

    // Refresh access token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.access);
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            this.clearAuth();
            return false;
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // File upload
    async upload(endpoint, formData) {
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return this.request(endpoint, {
            method: 'POST',
            headers,
            body: formData
        });
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// API Service classes
class AuthAPI {
    constructor(client) {
        this.client = client;
    }

    async login(username, password) {
        const response = await this.client.post('/auth/login/', {
            username,
            password
        });
        
        if (response.access) {
            this.client.setToken(response.access, response.refresh);
        }
        
        return response;
    }

    async register(userData) {
        return this.client.post('/auth/register/', userData);
    }

    async logout() {
        try {
            if (this.client.refreshToken) {
                await this.client.post('/auth/logout/', {
                    refresh_token: this.client.refreshToken
                });
            }
        } finally {
            this.client.clearAuth();
        }
    }

    async getCurrentUser() {
        return this.client.get('/auth/user/');
    }

    async updateProfile(userData) {
        return this.client.patch('/auth/user/', userData);
    }

    async changePassword(oldPassword, newPassword) {
        return this.client.post('/auth/change-password/', {
            old_password: oldPassword,
            new_password: newPassword
        });
    }

    async resetPassword(email) {
        return this.client.post('/auth/password-reset/', { email });
    }
}

class TransactionAPI {
    constructor(client) {
        this.client = client;
    }

    async getTransactions(filters = {}) {
        return this.client.get('/transactions/', filters);
    }

    async getTransaction(id) {
        return this.client.get(`/transactions/${id}/`);
    }

    async createTransaction(data) {
        return this.client.post('/transactions/', data);
    }

    async updateTransaction(id, data) {
        return this.client.put(`/transactions/${id}/`, data);
    }

    async deleteTransaction(id) {
        return this.client.delete(`/transactions/${id}/`);
    }

    async getTransactionStats(period = 'month') {
        return this.client.get('/transactions/stats/', { period });
    }
}

class CategoryAPI {
    constructor(client) {
        this.client = client;
    }

    async getCategories() {
        return this.client.get('/categories/');
    }

    async getCategory(id) {
        return this.client.get(`/categories/${id}/`);
    }

    async createCategory(data) {
        return this.client.post('/categories/', data);
    }

    async updateCategory(id, data) {
        return this.client.put(`/categories/${id}/`, data);
    }

    async deleteCategory(id) {
        return this.client.delete(`/categories/${id}/`);
    }

    async getCategoryStats() {
        return this.client.get('/categories/stats/');
    }
}

class AccountAPI {
    constructor(client) {
        this.client = client;
    }

    async getAccounts() {
        return this.client.get('/accounts/');
    }

    async getAccount(id) {
        return this.client.get(`/accounts/${id}/`);
    }

    async createAccount(data) {
        return this.client.post('/accounts/', data);
    }

    async updateAccount(id, data) {
        return this.client.put(`/accounts/${id}/`, data);
    }

    async deleteAccount(id) {
        return this.client.delete(`/accounts/${id}/`);
    }

    async getAccountBalance(id) {
        return this.client.get(`/accounts/${id}/balance/`);
    }
}

class BudgetAPI {
    constructor(client) {
        this.client = client;
    }

    async getBudgets() {
        return this.client.get('/budgets/');
    }

    async getBudget(id) {
        return this.client.get(`/budgets/${id}/`);
    }

    async createBudget(data) {
        return this.client.post('/budgets/', data);
    }

    async updateBudget(id, data) {
        return this.client.put(`/budgets/${id}/`, data);
    }

    async deleteBudget(id) {
        return this.client.delete(`/budgets/${id}/`);
    }

    async getBudgetProgress(id) {
        return this.client.get(`/budgets/${id}/progress/`);
    }
}

class GoalAPI {
    constructor(client) {
        this.client = client;
    }

    async getGoals() {
        return this.client.get('/goals/');
    }

    async getGoal(id) {
        return this.client.get(`/goals/${id}/`);
    }

    async createGoal(data) {
        return this.client.post('/goals/', data);
    }

    async updateGoal(id, data) {
        return this.client.put(`/goals/${id}/`, data);
    }

    async deleteGoal(id) {
        return this.client.delete(`/goals/${id}/`);
    }

    async updateGoalProgress(id, amount) {
        return this.client.post(`/goals/${id}/progress/`, { amount });
    }
}

class ReportAPI {
    constructor(client) {
        this.client = client;
    }

    async getDashboardStats() {
        return this.client.get('/reports/dashboard/');
    }

    async getIncomeExpenseReport(period = 'month') {
        return this.client.get('/reports/income-expense/', { period });
    }

    async getCategoryReport(period = 'month') {
        return this.client.get('/reports/category/', { period });
    }

    async getAccountReport() {
        return this.client.get('/reports/accounts/');
    }

    async getMonthlyTrends() {
        return this.client.get('/reports/trends/');
    }

    async exportReport(type, format = 'csv') {
        return this.client.get(`/reports/export/${type}/`, { format });
    }
}

// Initialize API client and services
const apiClient = new APIClient();
const authAPI = new AuthAPI(apiClient);
const transactionAPI = new TransactionAPI(apiClient);
const categoryAPI = new CategoryAPI(apiClient);
const accountAPI = new AccountAPI(apiClient);
const budgetAPI = new BudgetAPI(apiClient);
const goalAPI = new GoalAPI(apiClient);
const reportAPI = new ReportAPI(apiClient);

// Export for use in other modules
window.API = {
    client: apiClient,
    auth: authAPI,
    transactions: transactionAPI,
    categories: categoryAPI,
    accounts: accountAPI,
    budgets: budgetAPI,
    goals: goalAPI,
    reports: reportAPI,
    APIError
};

// Make APIClient available globally
window.APIClient = APIClient;
