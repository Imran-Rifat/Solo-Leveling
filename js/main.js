// Global state
let appState = {
    currentUser: null,
    selectedCategory: null,
    userSkills: [],
    targetRole: null,
    learningRoadmap: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for saved state
    const savedState = localStorage.getItem('soloLevelingState');
    if (savedState) {
        appState = { ...appState, ...JSON.parse(savedState) };
    }

    // Initialize category selection
    initializeCategorySelection();
}

function initializeCategorySelection() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove active class from all cards
            categoryCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            this.classList.add('active');
            
            // Store selected category
            const category = this.getAttribute('data-category');
            appState.selectedCategory = category;
            saveState();
        });
    });
}

function startJourney() {
    if (!appState.selectedCategory) {
        alert('Please select a job category to continue');
        return;
    }
    
    // Redirect to upload page
    window.location.href = 'upload.html';
}

function saveState() {
    localStorage.setItem('soloLevelingState', JSON.stringify(appState));
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
                border-left: 4px solid #667eea;
            }
            .notification-success { border-left-color: #48bb78; }
            .notification-error { border-left-color: #f56565; }
            .notification-warning { border-left-color: #ed8936; }
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: 1rem;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// API utility functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const baseUrl = 'http://localhost:5000/api';
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        showNotification('Connection error. Please try again.', 'error');
        throw error;
    }
}