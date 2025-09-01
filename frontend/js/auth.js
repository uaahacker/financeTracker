// Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Initialize the auth manager
    async init() {
        await this.checkAuthStatus();
    }

    // Check if user is authenticated
    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const user = await API.auth.getCurrentUser();
                this.currentUser = user;
                this.isAuthenticated = true;
                this.updateUI();
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }

    // Login user
    async login(username, password) {
        try {
            showLoading(true);
            const response = await API.auth.login(username, password);
            
            this.currentUser = response.user;
            this.isAuthenticated = true;
            this.updateUI();
            
            showNotification('Welcome back!', 'success');
            hideLoginModal();
            
            // Redirect to dashboard if on login page
            if (window.location.pathname.includes('login')) {
                window.location.href = '/';
            }
            
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            showNotification(error.message || 'Login failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Register user
    async register(userData) {
        try {
            showLoading(true);
            const response = await API.auth.register(userData);
            
            showNotification('Registration successful! Please log in.', 'success');
            hideRegisterModal();
            showLoginModal();
            
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            showNotification(error.message || 'Registration failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Logout user
    async logout() {
        try {
            await API.auth.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
            showNotification('Logged out successfully', 'info');
            
            // Redirect to login page
            showLoginModal();
        }
    }

    // Update profile
    async updateProfile(userData) {
        try {
            showLoading(true);
            const response = await API.auth.updateProfile(userData);
            
            this.currentUser = { ...this.currentUser, ...response };
            this.updateUI();
            
            showNotification('Profile updated successfully', 'success');
            return response;
        } catch (error) {
            console.error('Profile update failed:', error);
            showNotification(error.message || 'Profile update failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Change password
    async changePassword(oldPassword, newPassword) {
        try {
            showLoading(true);
            await API.auth.changePassword(oldPassword, newPassword);
            
            showNotification('Password changed successfully', 'success');
        } catch (error) {
            console.error('Password change failed:', error);
            showNotification(error.message || 'Password change failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            showLoading(true);
            await API.auth.resetPassword(email);
            
            showNotification('Password reset email sent', 'success');
        } catch (error) {
            console.error('Password reset failed:', error);
            showNotification(error.message || 'Password reset failed', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Update UI based on auth status
    updateUI() {
        if (this.isAuthenticated && this.currentUser) {
            // Update user info in navbar
            const userNameElement = document.getElementById('userName');
            const userAvatarElement = document.getElementById('userAvatar');
            
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.first_name || this.currentUser.username;
            }
            
            if (userAvatarElement) {
                const displayName = this.currentUser.first_name && this.currentUser.last_name 
                    ? `${this.currentUser.first_name} ${this.currentUser.last_name}`
                    : this.currentUser.username;
                userAvatarElement.src = this.currentUser.avatar || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=667eea&color=fff`;
            }
            
            // Show/hide auth-related elements
            this.toggleAuthElements(true);
        } else {
            this.toggleAuthElements(false);
        }
    }

    // Toggle auth-related UI elements
    toggleAuthElements(isAuthenticated) {
        const authRequiredElements = document.querySelectorAll('[data-auth-required]');
        const authHiddenElements = document.querySelectorAll('[data-auth-hidden]');
        
        authRequiredElements.forEach(element => {
            element.style.display = isAuthenticated ? '' : 'none';
        });
        
        authHiddenElements.forEach(element => {
            element.style.display = isAuthenticated ? 'none' : '';
        });
    }

    // Check if user has permission
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }
        
        // Add permission checking logic here
        return true;
    }

    // Get user display name
    getUserDisplayName() {
        if (!this.currentUser) return 'Guest';
        
        if (this.currentUser.first_name && this.currentUser.last_name) {
            return `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }
        
        return this.currentUser.first_name || this.currentUser.username;
    }
}

// Login Modal
function showLoginModal() {
    const modalHTML = `
        <div id="loginModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <i class="fas fa-chart-line text-4xl text-blue-600 mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-900">Welcome Back</h2>
                        <p class="text-gray-600">Sign in to your account</p>
                    </div>
                    
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label for="loginUsername" class="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                            <input type="text" id="loginUsername" name="username" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        
                        <div>
                            <label for="loginPassword" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div class="relative">
                                <input type="password" id="loginPassword" name="password" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10">
                                <button type="button" id="toggleLoginPassword" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <label class="flex items-center">
                                <input type="checkbox" id="rememberMe" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <button type="button" id="forgotPasswordBtn" class="text-sm text-blue-600 hover:text-blue-800">
                                Forgot password?
                            </button>
                        </div>
                        
                        <button type="submit" class="w-full btn-primary text-white py-2 rounded-lg font-medium">
                            Sign In
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-gray-600">Don't have an account?</p>
                        <button id="showRegisterBtn" class="text-blue-600 hover:text-blue-800 font-medium">
                            Create an account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('toggleLoginPassword').addEventListener('click', togglePasswordVisibility);
    document.getElementById('showRegisterBtn').addEventListener('click', () => {
        hideLoginModal();
        showRegisterModal();
    });
    document.getElementById('forgotPasswordBtn').addEventListener('click', showForgotPasswordModal);
    
    // Close on backdrop click
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') {
            hideLoginModal();
        }
    });
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.remove();
    }
}

// Register Modal
function showRegisterModal() {
    const modalHTML = `
        <div id="registerModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <i class="fas fa-user-plus text-4xl text-green-600 mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-900">Create Account</h2>
                        <p class="text-gray-600">Join Finance Tracker today</p>
                    </div>
                    
                    <form id="registerForm" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" id="firstName" name="first_name" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" id="lastName" name="last_name" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            </div>
                        </div>
                        
                        <div>
                            <label for="registerUsername" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="registerUsername" name="username" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="email" name="email" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        
                        <div>
                            <label for="registerPassword" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div class="relative">
                                <input type="password" id="registerPassword" name="password" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10">
                                <button type="button" id="toggleRegisterPassword" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirm_password" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" id="agreeTerms" required class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                            <span class="ml-2 text-sm text-gray-600">I agree to the <a href="#" class="text-green-600 hover:text-green-800">Terms and Conditions</a></span>
                        </div>
                        
                        <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors">
                            Create Account
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <p class="text-gray-600">Already have an account?</p>
                        <button id="showLoginBtn" class="text-green-600 hover:text-green-800 font-medium">
                            Sign in here
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('toggleRegisterPassword').addEventListener('click', togglePasswordVisibility);
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        hideRegisterModal();
        showLoginModal();
    });
    
    // Close on backdrop click
    document.getElementById('registerModal').addEventListener('click', (e) => {
        if (e.target.id === 'registerModal') {
            hideRegisterModal();
        }
    });
}

function hideRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.remove();
    }
}

// Forgot Password Modal
function showForgotPasswordModal() {
    const modalHTML = `
        <div id="forgotPasswordModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <i class="fas fa-key text-4xl text-yellow-600 mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-900">Reset Password</h2>
                        <p class="text-gray-600">Enter your email to receive reset instructions</p>
                    </div>
                    
                    <form id="forgotPasswordForm" class="space-y-4">
                        <div>
                            <label for="resetEmail" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="resetEmail" name="email" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                        </div>
                        
                        <button type="submit" class="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-medium transition-colors">
                            Send Reset Email
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <button id="backToLoginBtn" class="text-yellow-600 hover:text-yellow-800 font-medium">
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
    document.getElementById('backToLoginBtn').addEventListener('click', () => {
        hideForgotPasswordModal();
        showLoginModal();
    });
    
    // Close on backdrop click
    document.getElementById('forgotPasswordModal').addEventListener('click', (e) => {
        if (e.target.id === 'forgotPasswordModal') {
            hideForgotPasswordModal();
        }
    });
}

function hideForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.remove();
    }
}

// Event Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        await authManager.login(username, password);
    } catch (error) {
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    // Validate passwords match
    if (userData.password !== userData.confirm_password) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Remove confirm_password from data
    delete userData.confirm_password;
    
    try {
        await authManager.register(userData);
    } catch (error) {
        console.error('Registration error:', error);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    
    try {
        await authManager.resetPassword(email);
        hideForgotPasswordModal();
    } catch (error) {
        console.error('Password reset error:', error);
    }
}

function togglePasswordVisibility(e) {
    const button = e.target.closest('button');
    const input = button.previousElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Export class for global use
window.AuthManager = AuthManager;
