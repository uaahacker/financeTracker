// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = [];
        this.maxNotifications = 5;
    }

    show(message, type = 'info', duration = 5000, actions = []) {
        const notification = this.createNotification(message, type, duration, actions);
        this.addNotification(notification);
        return notification.id;
    }

    createNotification(message, type, duration, actions) {
        const id = Date.now().toString();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const colorMap = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const notification = {
            id,
            message,
            type,
            duration,
            actions,
            element: null,
            timeout: null
        };

        const notificationHTML = `
            <div id="notification-${id}" class="notification bg-white rounded-lg shadow-lg border-l-4 ${colorMap[type].replace('bg-', 'border-')} p-4 mb-2 max-w-sm transform transition-all duration-300">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="${iconMap[type]} text-lg ${colorMap[type].replace('bg-', 'text-')}"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                        ${actions.length > 0 ? this.createActionButtons(actions, id) : ''}
                    </div>
                    <div class="ml-4 flex-shrink-0">
                        <button onclick="notificationManager.dismiss('${id}')" class="text-gray-400 hover:text-gray-600 transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                ${duration > 0 ? `<div class="progress-bar mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div class="progress h-full ${colorMap[type]} transition-all ease-linear" style="animation: shrink ${duration}ms linear;"></div>
                </div>` : ''}
            </div>
        `;

        notification.element = this.createElementFromHTML(notificationHTML);
        return notification;
    }

    createActionButtons(actions, notificationId) {
        const buttonsHTML = actions.map(action => `
            <button onclick="notificationManager.handleAction('${notificationId}', '${action.id}')" 
                    class="mt-2 mr-2 px-3 py-1 text-xs font-medium rounded ${action.style || 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors">
                ${action.label}
            </button>
        `).join('');

        return `<div class="mt-2">${buttonsHTML}</div>`;
    }

    addNotification(notification) {
        // Remove oldest notification if at max capacity
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.dismiss(oldest.id);
        }

        this.notifications.push(notification);
        this.container.appendChild(notification.element);

        // Trigger animation
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 10);

        // Auto dismiss if duration > 0
        if (notification.duration > 0) {
            notification.timeout = setTimeout(() => {
                this.dismiss(notification.id);
            }, notification.duration);
        }
    }

    dismiss(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        // Clear timeout
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }

        // Animate out
        notification.element.classList.remove('show');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    handleAction(notificationId, actionId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        const action = notification.actions.find(a => a.id === actionId);
        if (action && action.handler) {
            action.handler();
        }

        // Dismiss notification after action
        this.dismiss(notificationId);
    }

    dismissAll() {
        [...this.notifications].forEach(notification => {
            this.dismiss(notification.id);
        });
    }

    createElementFromHTML(htmlString) {
        const div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    }
}

// Toast notifications - simpler interface
class ToastManager {
    constructor() {
        this.container = this.createToastContainer();
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const toast = this.createToast(message, type, duration);
        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('animate__animated', 'animate__slideInRight');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    createToast(message, type, duration) {
        const id = Date.now().toString();
        
        const typeStyles = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-times',
            warning: 'fas fa-exclamation',
            info: 'fas fa-info'
        };

        const toast = document.createElement('div');
        toast.id = `toast-${id}`;
        toast.className = `${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-72 max-w-96`;
        
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span class="flex-1">${message}</span>
            <button onclick="toastManager.removeToast(this.parentElement)" class="text-white hover:text-gray-200 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        `;

        return toast;
    }

    removeToast(toast) {
        toast.classList.add('animate__animated', 'animate__slideOutRight');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Progress notification for long operations
class ProgressNotification {
    constructor(title, total = 100) {
        this.title = title;
        this.total = total;
        this.current = 0;
        this.element = this.create();
        this.show();
    }

    create() {
        const id = Date.now().toString();
        const progressHTML = `
            <div id="progress-${id}" class="notification bg-white rounded-lg shadow-lg p-4 mb-2 max-w-sm transform transition-all duration-300">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-900">${this.title}</h4>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <div class="flex justify-between mt-1 text-xs text-gray-500">
                    <span class="progress-text">0/${this.total}</span>
                    <span class="progress-percent">0%</span>
                </div>
            </div>
        `;

        return notificationManager.createElementFromHTML(progressHTML);
    }

    show() {
        notificationManager.container.appendChild(this.element);
        setTimeout(() => {
            this.element.classList.add('show');
        }, 10);
    }

    update(current, text = null) {
        this.current = Math.min(current, this.total);
        const percent = Math.round((this.current / this.total) * 100);
        
        const progressBar = this.element.querySelector('.bg-blue-600');
        const progressText = this.element.querySelector('.progress-text');
        const progressPercent = this.element.querySelector('.progress-percent');
        
        progressBar.style.width = `${percent}%`;
        progressText.textContent = text || `${this.current}/${this.total}`;
        progressPercent.textContent = `${percent}%`;
    }

    complete(message = 'Complete!') {
        this.update(this.total, message);
        setTimeout(() => {
            this.remove();
        }, 2000);
    }

    remove() {
        this.element.classList.remove('show');
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 300);
    }
}

// Global notification functions
function showNotification(message, type = 'info', duration = 5000, actions = []) {
    return notificationManager.show(message, type, duration, actions);
}

function showToast(message, type = 'info', duration = 3000) {
    return toastManager.show(message, type, duration);
}

function showProgress(title, total = 100) {
    return new ProgressNotification(title, total);
}

function dismissNotification(id) {
    notificationManager.dismiss(id);
}

function dismissAllNotifications() {
    notificationManager.dismissAll();
}

// Loading overlay functions
function showLoading(show = true, message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.style.display = 'flex';
        const loadingText = overlay.querySelector('span');
        if (loadingText) {
            loadingText.textContent = message;
        }
    } else {
        overlay.style.display = 'none';
    }
}

// Confirmation dialog
function showConfirmation(message, title = 'Confirm', onConfirm = null, onCancel = null) {
    return new Promise((resolve) => {
        const modalHTML = `
            <div id="confirmationModal" class="fixed inset-0 modal-backdrop z-50 flex items-center justify-center">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate__animated animate__fadeInUp">
                    <div class="p-6">
                        <div class="text-center">
                            <div class="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-exclamation-triangle text-2xl text-yellow-600"></i>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
                            <p class="text-gray-600 mb-6">${message}</p>
                            
                            <div class="flex space-x-3 justify-center">
                                <button id="confirmCancel" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button id="confirmOk" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('confirmationModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');

        function cleanup() {
            modal.remove();
        }

        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
            resolve(false);
        });

        okBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
            resolve(true);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmationModal') {
                cleanup();
                if (onCancel) onCancel();
                resolve(false);
            }
        });
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    .notification {
        transform: translateX(100%);
        opacity: 0;
    }
    
    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Export classes for global use
window.NotificationManager = NotificationManager;
window.ToastManager = ToastManager;
