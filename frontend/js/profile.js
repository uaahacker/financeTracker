// Profile Management
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.profileImage = null;
        this.isEditing = false;
    }

    async init() {
        console.log('Initializing Profile...');
        await this.loadProfile();
        this.renderProfilePage();
    }

    async loadProfile() {
        try {
            showLoading(true, 'Loading profile...');

            if (authManager.isAuthenticated) {
                this.currentUser = await API.auth.getProfile();
            } else {
                this.currentUser = this.getMockProfile();
            }

        } catch (error) {
            console.error('Failed to load profile:', error);
            showNotification('Failed to load profile', 'error');
            this.currentUser = this.getMockProfile();
        } finally {
            showLoading(false);
        }
    }

    getMockProfile() {
        return {
            id: 1,
            username: 'demo_user',
            email: 'demo@example.com',
            first_name: 'Demo',
            last_name: 'User',
            phone: '+1 (555) 123-4567',
            date_of_birth: '1990-01-15',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zip_code: '10001',
            country: 'United States',
            profile_image: null,
            date_joined: '2024-01-01T00:00:00Z',
            last_login: '2024-03-15T10:30:00Z',
            is_verified: true,
            subscription_plan: 'premium',
            preferences: {
                theme: 'light',
                language: 'en',
                timezone: 'America/New_York',
                currency: 'USD'
            },
            stats: {
                total_transactions: 245,
                total_accounts: 4,
                total_budgets: 3,
                total_goals: 5,
                days_active: 74
            }
        };
    }

    renderProfilePage() {
        const content = document.getElementById('profileContent');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">Profile</h1>
                    <div class="flex space-x-3">
                        <button onclick="profileManager.toggleEditMode()" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" id="editToggleBtn">
                            <i class="fas fa-edit mr-2"></i>Edit Profile
                        </button>
                        <button onclick="profileManager.saveProfile()" class="btn-primary text-white px-4 py-2 rounded-lg font-medium hidden" id="saveProfileBtn">
                            <i class="fas fa-save mr-2"></i>Save Changes
                        </button>
                    </div>
                </div>

                <!-- Profile Header Card -->
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div class="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        <!-- Profile Image -->
                        <div class="relative">
                            <div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                <img id="profileImageDisplay" 
                                     src="${this.currentUser.profile_image || ''}" 
                                     alt="Profile" 
                                     class="w-full h-full object-cover ${this.currentUser.profile_image ? '' : 'hidden'}"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                                <div class="w-full h-full flex items-center justify-center text-white text-2xl font-bold ${this.currentUser.profile_image ? 'hidden' : ''}">
                                    ${this.getInitials()}
                                </div>
                            </div>
                            <button onclick="profileManager.changeProfileImage()" 
                                    class="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors profile-edit-only hidden">
                                <i class="fas fa-camera text-sm"></i>
                            </button>
                        </div>

                        <!-- User Info -->
                        <div class="flex-1 text-center md:text-left">
                            <h2 class="text-2xl font-bold mb-1">${this.currentUser.first_name} ${this.currentUser.last_name}</h2>
                            <p class="text-blue-100 mb-2">@${this.currentUser.username}</p>
                            <p class="text-blue-100 text-sm">${this.currentUser.email}</p>
                            <div class="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                                    <i class="fas fa-crown mr-1"></i>
                                    ${this.currentUser.subscription_plan?.charAt(0).toUpperCase() + this.currentUser.subscription_plan?.slice(1) || 'Free'}
                                </span>
                                ${this.currentUser.is_verified ? 
                                    '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white"><i class="fas fa-check-circle mr-1"></i>Verified</span>' 
                                    : ''
                                }
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div class="text-2xl font-bold">${this.currentUser.stats?.total_transactions || 0}</div>
                                <div class="text-blue-100 text-sm">Transactions</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold">${this.currentUser.stats?.days_active || 0}</div>
                                <div class="text-blue-100 text-sm">Days Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile Tabs -->
                <div class="bg-white rounded-xl shadow-lg">
                    <div class="flex border-b border-gray-200">
                        <button onclick="profileManager.showProfileTab('personal')" 
                                class="profile-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors active" data-tab="personal">
                            <i class="fas fa-user mr-2"></i>Personal Info
                        </button>
                        <button onclick="profileManager.showProfileTab('security')" 
                                class="profile-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="security">
                            <i class="fas fa-shield-alt mr-2"></i>Security
                        </button>
                        <button onclick="profileManager.showProfileTab('preferences')" 
                                class="profile-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="preferences">
                            <i class="fas fa-cog mr-2"></i>Preferences
                        </button>
                        <button onclick="profileManager.showProfileTab('activity')" 
                                class="profile-tab px-6 py-4 text-sm font-medium border-b-2 transition-colors" data-tab="activity">
                            <i class="fas fa-chart-line mr-2"></i>Activity
                        </button>
                    </div>
                    
                    <div class="p-6" id="profileTabContent">
                        <!-- Tab content will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Profile Image Modal -->
            <div id="profileImageModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center hidden">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-gray-900">Change Profile Picture</h2>
                            <button onclick="profileManager.hideImageModal()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="text-center">
                                <div class="w-32 h-32 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-4">
                                    <img id="imagePreview" src="" alt="Preview" class="w-full h-full object-cover hidden">
                                    <i class="fas fa-camera text-4xl text-gray-400" id="cameraIcon"></i>
                                </div>
                                <input type="file" id="imageUpload" accept="image/*" class="hidden" onchange="profileManager.previewImage(event)">
                                <button onclick="document.getElementById('imageUpload').click()" 
                                        class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                    <i class="fas fa-upload mr-2"></i>Choose Image
                                </button>
                            </div>
                            
                            <div class="flex space-x-3">
                                <button onclick="profileManager.hideImageModal()" 
                                        class="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button onclick="profileManager.uploadProfileImage()" 
                                        class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium">
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showProfileTab('personal');
    }

    showProfileTab(tabName) {
        // Update active tab
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });

        const content = document.getElementById('profileTabContent');
        if (!content) return;

        switch (tabName) {
            case 'personal':
                content.innerHTML = this.renderPersonalInfo();
                break;
            case 'security':
                content.innerHTML = this.renderSecurityInfo();
                break;
            case 'preferences':
                content.innerHTML = this.renderPreferences();
                break;
            case 'activity':
                content.innerHTML = this.renderActivity();
                break;
        }

        this.bindTabInputs();
    }

    renderPersonalInfo() {
        const isEditing = this.isEditing;
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Personal Information</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input type="text" name="first_name" value="${this.currentUser.first_name || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input type="text" name="last_name" value="${this.currentUser.last_name || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input type="text" name="username" value="${this.currentUser.username || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" name="email" value="${this.currentUser.email || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input type="tel" name="phone" value="${this.currentUser.phone || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input type="date" name="date_of_birth" value="${this.currentUser.date_of_birth || ''}" 
                               ${isEditing ? '' : 'disabled'}
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">Address</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                            <input type="text" name="address" value="${this.currentUser.address || ''}" 
                                   ${isEditing ? '' : 'disabled'}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input type="text" name="city" value="${this.currentUser.city || ''}" 
                                   ${isEditing ? '' : 'disabled'}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                            <input type="text" name="state" value="${this.currentUser.state || ''}" 
                                   ${isEditing ? '' : 'disabled'}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                            <input type="text" name="zip_code" value="${this.currentUser.zip_code || ''}" 
                                   ${isEditing ? '' : 'disabled'}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                            <input type="text" name="country" value="${this.currentUser.country || ''}" 
                                   ${isEditing ? '' : 'disabled'}
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSecurityInfo() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Security Information</h3>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Password</h4>
                                <p class="text-sm text-gray-600">Last changed: ${this.formatDate(this.currentUser.date_joined)}</p>
                            </div>
                            <button onclick="profileManager.changePassword()" 
                                    class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                <i class="fas fa-key mr-2"></i>Change Password
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Two-Factor Authentication</h4>
                                <p class="text-sm text-gray-600">Add an extra layer of security</p>
                            </div>
                            <button onclick="profileManager.setup2FA()" 
                                    class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                <i class="fas fa-shield-alt mr-2"></i>Setup 2FA
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-900">Login Sessions</h4>
                                <p class="text-sm text-gray-600">Manage your active sessions</p>
                            </div>
                            <button onclick="profileManager.manageSessions()" 
                                    class="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                                <i class="fas fa-list mr-2"></i>View Sessions
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-gray-200 pt-6">
                    <h4 class="font-medium text-gray-900 mb-4">Account Status</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center">
                            <div class="${this.currentUser.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} p-2 rounded-lg mr-3">
                                <i class="fas fa-${this.currentUser.is_verified ? 'check-circle' : 'exclamation-circle'}"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">Email Verification</div>
                                <div class="text-sm text-gray-600">${this.currentUser.is_verified ? 'Verified' : 'Not verified'}</div>
                            </div>
                        </div>
                        
                        <div class="flex items-center">
                            <div class="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">Member Since</div>
                                <div class="text-sm text-gray-600">${this.formatDate(this.currentUser.date_joined)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPreferences() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Preferences</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <select name="theme" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="light" ${this.currentUser.preferences?.theme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${this.currentUser.preferences?.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="auto" ${this.currentUser.preferences?.theme === 'auto' ? 'selected' : ''}>Auto</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select name="language" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="en" ${this.currentUser.preferences?.language === 'en' ? 'selected' : ''}>English</option>
                            <option value="es" ${this.currentUser.preferences?.language === 'es' ? 'selected' : ''}>Spanish</option>
                            <option value="fr" ${this.currentUser.preferences?.language === 'fr' ? 'selected' : ''}>French</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <select name="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="America/New_York" ${this.currentUser.preferences?.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
                            <option value="America/Chicago" ${this.currentUser.preferences?.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
                            <option value="America/Denver" ${this.currentUser.preferences?.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
                            <option value="America/Los_Angeles" ${this.currentUser.preferences?.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                        <select name="currency" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="USD" ${this.currentUser.preferences?.currency === 'USD' ? 'selected' : ''}>USD - US Dollar</option>
                            <option value="EUR" ${this.currentUser.preferences?.currency === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                            <option value="GBP" ${this.currentUser.preferences?.currency === 'GBP' ? 'selected' : ''}>GBP - British Pound</option>
                        </select>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">Subscription</h4>
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h5 class="font-medium text-gray-900">Current Plan: ${this.currentUser.subscription_plan?.charAt(0).toUpperCase() + this.currentUser.subscription_plan?.slice(1) || 'Free'}</h5>
                                <p class="text-sm text-gray-600">Access to ${this.currentUser.subscription_plan === 'premium' ? 'all features' : 'basic features'}</p>
                            </div>
                            <button onclick="profileManager.manageBilling()" 
                                    class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                <i class="fas fa-credit-card mr-2"></i>Manage Billing
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivity() {
        return `
            <div class="space-y-6">
                <h3 class="text-lg font-semibold text-gray-900">Account Activity</h3>
                
                <!-- Activity Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-exchange-alt text-blue-600 text-xl mr-3"></i>
                            <div>
                                <div class="text-2xl font-bold text-blue-600">${this.currentUser.stats?.total_transactions || 0}</div>
                                <div class="text-sm text-blue-800">Transactions</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-university text-green-600 text-xl mr-3"></i>
                            <div>
                                <div class="text-2xl font-bold text-green-600">${this.currentUser.stats?.total_accounts || 0}</div>
                                <div class="text-sm text-green-800">Accounts</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-yellow-50 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-piggy-bank text-yellow-600 text-xl mr-3"></i>
                            <div>
                                <div class="text-2xl font-bold text-yellow-600">${this.currentUser.stats?.total_budgets || 0}</div>
                                <div class="text-sm text-yellow-800">Budgets</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-50 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-bullseye text-purple-600 text-xl mr-3"></i>
                            <div>
                                <div class="text-2xl font-bold text-purple-600">${this.currentUser.stats?.total_goals || 0}</div>
                                <div class="text-sm text-purple-800">Goals</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="space-y-4">
                    <h4 class="font-medium text-gray-900">Recent Activity</h4>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center">
                                    <i class="fas fa-sign-in-alt text-green-600 mr-3"></i>
                                    <div>
                                        <div class="font-medium text-gray-900">Logged in</div>
                                        <div class="text-sm text-gray-600">${this.formatDate(this.currentUser.last_login)}</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500">Today</div>
                            </div>
                            
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center">
                                    <i class="fas fa-user-edit text-blue-600 mr-3"></i>
                                    <div>
                                        <div class="font-medium text-gray-900">Profile updated</div>
                                        <div class="text-sm text-gray-600">Personal information changed</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500">2 days ago</div>
                            </div>
                            
                            <div class="flex items-center justify-between py-2">
                                <div class="flex items-center">
                                    <i class="fas fa-plus text-purple-600 mr-3"></i>
                                    <div>
                                        <div class="font-medium text-gray-900">New goal created</div>
                                        <div class="text-sm text-gray-600">Emergency Fund goal</div>
                                    </div>
                                </div>
                                <div class="text-sm text-gray-500">1 week ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindTabInputs() {
        // Add change listeners for preference inputs
        document.querySelectorAll('select[name], input[name]').forEach(input => {
            input.addEventListener('change', () => {
                this.markAsChanged();
            });
        });
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        
        const editBtn = document.getElementById('editToggleBtn');
        const saveBtn = document.getElementById('saveProfileBtn');
        
        if (this.isEditing) {
            editBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel';
            editBtn.classList.add('bg-red-100', 'text-red-600');
            editBtn.classList.remove('bg-gray-100', 'text-gray-600');
            saveBtn.classList.remove('hidden');
            
            // Show edit-only elements
            document.querySelectorAll('.profile-edit-only').forEach(el => {
                el.classList.remove('hidden');
            });
        } else {
            editBtn.innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Profile';
            editBtn.classList.remove('bg-red-100', 'text-red-600');
            editBtn.classList.add('bg-gray-100', 'text-gray-600');
            saveBtn.classList.add('hidden');
            
            // Hide edit-only elements
            document.querySelectorAll('.profile-edit-only').forEach(el => {
                el.classList.add('hidden');
            });
        }
        
        // Re-render current tab
        const activeTab = document.querySelector('.profile-tab.active');
        if (activeTab) {
            this.showProfileTab(activeTab.dataset.tab);
        }
    }

    markAsChanged() {
        // Enable save button
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.classList.remove('opacity-50');
            saveBtn.disabled = false;
        }
    }

    async saveProfile() {
        try {
            showLoading(true, 'Saving profile...');

            // Collect form data
            const formData = {};
            document.querySelectorAll('input[name], select[name], textarea[name]').forEach(input => {
                if (!input.disabled) {
                    formData[input.name] = input.value;
                }
            });

            if (authManager.isAuthenticated) {
                this.currentUser = await API.auth.updateProfile(formData);
            } else {
                // Update mock data
                Object.assign(this.currentUser, formData);
            }

            this.toggleEditMode();
            showNotification('Profile updated successfully', 'success');

        } catch (error) {
            console.error('Failed to save profile:', error);
            showNotification('Failed to save profile', 'error');
        } finally {
            showLoading(false);
        }
    }

    getInitials() {
        const first = this.currentUser.first_name?.charAt(0) || '';
        const last = this.currentUser.last_name?.charAt(0) || '';
        return (first + last).toUpperCase() || 'U';
    }

    changeProfileImage() {
        document.getElementById('profileImageModal').classList.remove('hidden');
    }

    hideImageModal() {
        document.getElementById('profileImageModal').classList.add('hidden');
        // Reset form
        document.getElementById('imageUpload').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('cameraIcon').classList.remove('hidden');
    }

    previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                const icon = document.getElementById('cameraIcon');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                icon.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    async uploadProfileImage() {
        const fileInput = document.getElementById('imageUpload');
        if (!fileInput.files[0]) {
            showNotification('Please select an image', 'error');
            return;
        }

        try {
            showLoading(true, 'Uploading image...');

            if (authManager.isAuthenticated) {
                const formData = new FormData();
                formData.append('profile_image', fileInput.files[0]);
                this.currentUser = await API.auth.uploadProfileImage(formData);
            } else {
                // For demo, use FileReader to create data URL
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.currentUser.profile_image = e.target.result;
                    document.getElementById('profileImageDisplay').src = e.target.result;
                    document.getElementById('profileImageDisplay').classList.remove('hidden');
                    document.getElementById('profileImageDisplay').nextElementSibling.classList.add('hidden');
                };
                reader.readAsDataURL(fileInput.files[0]);
            }

            this.hideImageModal();
            showNotification('Profile image updated successfully', 'success');

        } catch (error) {
            console.error('Failed to upload image:', error);
            showNotification('Failed to upload image', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Security methods
    async changePassword() {
        showNotification('Password change feature coming soon', 'info');
    }

    async setup2FA() {
        showNotification('Two-factor authentication setup coming soon', 'info');
    }

    async manageSessions() {
        showNotification('Session management feature coming soon', 'info');
    }

    async manageBilling() {
        showNotification('Billing management feature coming soon', 'info');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Export class for global use
window.ProfileManager = ProfileManager;
