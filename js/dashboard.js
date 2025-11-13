// dashboard.js - FIXED CAREER DISPLAY
console.log('🚀 Dashboard loaded');

// Global appState
let appState = {
    userId: null,
    targetCareer: null,
    analysis: null,
    userProfile: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initializing dashboard...');
    initializeDashboard();
});

async function initializeDashboard() {
    // Load user profile and state
    await loadUserData();
    
    if (!appState.userProfile || !appState.userProfile.career) {
        console.log('❌ No user profile found, redirecting to setup');
        window.location.href = 'index.html';
        return;
    }

    console.log('✅ User profile loaded:', appState.userProfile);
    
    // Update UI with user data
    updateDashboardUI();
    initializeCharts();
    await loadAIPersonalizedInsights();
}

async function loadUserData() {
    try {
        // Load user profile from localStorage
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
            appState.userProfile = JSON.parse(userProfile);
            console.log('👤 User profile:', appState.userProfile);
        }

        // Load app state from localStorage
        const savedState = localStorage.getItem('soloLevelingState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState = { ...appState, ...parsedState };
            console.log('💾 App state loaded');
        }

    } catch (error) {
        console.error('❌ Failed to load user data:', error);
    }
}

function updateDashboardUI() {
    // Update target role with user's actual career choice
    const targetRoleElement = document.getElementById('targetRole');
    if (targetRoleElement && appState.userProfile) {
        const careerName = formatCareerName(appState.userProfile.career);
        targetRoleElement.textContent = careerName;
        console.log('🎯 Target role updated to:', careerName);
    }

    // Update skills display based on career
    updateSkillsDisplay();
    updateProgressStats();
}

function formatCareerName(careerId) {
    const careerMap = {
        'fullstack': 'Full-Stack Developer',
        'frontend': 'Frontend Developer',
        'backend': 'Backend Developer',
        'datascience': 'Data Scientist',
        'machinelearning': 'Machine Learning Engineer',
        'mobile': 'Mobile Developer',
        'devops': 'DevOps Engineer',
        'cybersecurity': 'Cyber Security Analyst',
        'uxui': 'UX/UI Designer',
        'qa': 'QA Engineer'
    };
    
    return careerMap[careerId] || careerId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateSkillsDisplay() {
    const career = appState.userProfile.career;
    
    // Define skills for each career path
    const careerSkills = {
        'fullstack': {
            mastered: ['HTML', 'CSS', 'JavaScript', 'Git'],
            learning: ['React', 'Node.js', 'Express', 'MongoDB'],
            missing: ['Docker', 'AWS', 'GraphQL', 'TypeScript']
        },
        'frontend': {
            mastered: ['HTML', 'CSS', 'JavaScript'],
            learning: ['React', 'Vue.js', 'SASS', 'Webpack'],
            missing: ['TypeScript', 'Next.js', 'Jest', 'Accessibility']
        },
        'backend': {
            mastered: ['JavaScript', 'Node.js', 'SQL'],
            learning: ['Express', 'MongoDB', 'REST APIs', 'Authentication'],
            missing: ['Docker', 'Redis', 'Microservices', 'GraphQL']
        },
        'datascience': {
            mastered: ['Python', 'Pandas', 'Statistics'],
            learning: ['NumPy', 'Matplotlib', 'SQL', 'Data Cleaning'],
            missing: ['Machine Learning', 'TensorFlow', 'Deep Learning', 'Big Data']
        },
        'machinelearning': {
            mastered: ['Python', 'Linear Algebra', 'Statistics'],
            learning: ['Scikit-learn', 'Pandas', 'NumPy', 'Data Preprocessing'],
            missing: ['TensorFlow', 'PyTorch', 'Neural Networks', 'Computer Vision']
        },
        'mobile': {
            mastered: ['JavaScript', 'React'],
            learning: ['React Native', 'Mobile UI', 'State Management'],
            missing: ['iOS Development', 'Android Development', 'App Store Deployment']
        },
        'devops': {
            mastered: ['Linux', 'Git', 'Basic Scripting'],
            learning: ['Docker', 'CI/CD', 'Cloud Basics', 'Networking'],
            missing: ['Kubernetes', 'AWS/Azure', 'Terraform', 'Monitoring']
        },
        'cybersecurity': {
            mastered: ['Networking', 'Operating Systems'],
            learning: ['Security Fundamentals', 'Encryption', 'Firewalls'],
            missing: ['Penetration Testing', 'Security Tools', 'Incident Response']
        },
        'uxui': {
            mastered: ['Design Principles', 'Wireframing'],
            learning: ['Figma', 'User Research', 'Prototyping'],
            missing: ['UX Writing', 'Accessibility', 'Design Systems']
        },
        'qa': {
            mastered: ['Testing Concepts', 'Manual Testing'],
            learning: ['Test Cases', 'Bug Tracking', 'Regression Testing'],
            missing: ['Automated Testing', 'Selenium', 'Performance Testing']
        }
    };

    const skills = careerSkills[career] || careerSkills['fullstack'];

    // Update mastered skills
    const masteredSkillsElement = document.getElementById('masteredSkills');
    masteredSkillsElement.innerHTML = skills.mastered.map(skill => 
        `<span class="skill-tag mastered">${skill}</span>`
    ).join('');

    // Update learning skills
    const learningSkillsElement = document.getElementById('learningSkills');
    learningSkillsElement.innerHTML = skills.learning.map(skill => 
        `<span class="skill-tag learning">${skill}</span>`
    ).join('');

    // Update missing skills
    const missingSkillsElement = document.getElementById('missingSkills');
    missingSkillsElement.innerHTML = skills.missing.map(skill => 
        `<span class="skill-tag missing">${skill}</span>`
    ).join('');
}

function updateProgressStats() {
    // Calculate progress based on career and user data
    const career = appState.userProfile.career;
    
    // Mock progress data - in real app, this would come from user's actual progress
    const progressData = {
        completionRate: Math.floor(Math.random() * 30) + 10, // 10-40%
        skillsLearned: Math.floor(Math.random() * 8) + 2,    // 2-10 skills
        hoursSpent: Math.floor(Math.random() * 50) + 10      // 10-60 hours
    };

    document.getElementById('completionRate').textContent = `${progressData.completionRate}%`;
    document.getElementById('skillsLearned').textContent = progressData.skillsLearned;
    document.getElementById('hoursSpent').textContent = progressData.hoursSpent;
}

function initializeCharts() {
    const career = appState.userProfile.career;
    
    // Skills radar chart
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    
    // Define chart data based on career
    const chartData = getChartDataForCareer(career);

    new Chart(skillsCtx, {
        type: 'radar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Your Current Level',
                data: chartData.currentLevels,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)'
            }, {
                label: 'Target Level',
                data: chartData.targetLevels,
                backgroundColor: 'rgba(240, 147, 251, 0.2)',
                borderColor: 'rgba(240, 147, 251, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(240, 147, 251, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // Progress timeline chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    
    new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: ['Start', 'Week 2', 'Week 4', 'Week 6', 'Week 8', 'Goal'],
            datasets: [{
                label: 'Career Readiness',
                data: [0, 15, 30, 50, 70, 100],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function getChartDataForCareer(career) {
    // Define different skill sets for each career
    const careerChartData = {
        'fullstack': {
            labels: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases', 'DevOps'],
            currentLevels: [65, 70, 45, 40, 35, 20],
            targetLevels: [90, 90, 85, 85, 80, 75]
        },
        'frontend': {
            labels: ['HTML/CSS', 'JavaScript', 'React', 'Responsive', 'Performance', 'Accessibility'],
            currentLevels: [70, 65, 40, 50, 30, 25],
            targetLevels: [95, 90, 85, 90, 80, 85]
        },
        'backend': {
            labels: ['Node.js', 'Databases', 'APIs', 'Security', 'Performance', 'DevOps'],
            currentLevels: [45, 40, 35, 30, 25, 20],
            targetLevels: [85, 85, 90, 85, 80, 75]
        },
        'datascience': {
            labels: ['Python', 'Statistics', 'ML Basics', 'Data Viz', 'SQL', 'Big Data'],
            currentLevels: [60, 55, 30, 45, 40, 20],
            targetLevels: [90, 85, 80, 80, 85, 75]
        },
        'machinelearning': {
            labels: ['Python', 'Math/Stats', 'ML Algorithms', 'Deep Learning', 'Data Prep', 'Deployment'],
            currentLevels: [65, 50, 35, 20, 45, 15],
            targetLevels: [90, 85, 85, 80, 85, 75]
        }
    };

    return careerChartData[career] || careerChartData['fullstack'];
}

async function loadAIPersonalizedInsights() {
    try {
        const career = appState.userProfile.career;
        
        // Generate AI insights based on career
        const insights = generateCareerInsights(career);
        
        // Display insights
        displayAIInsights(insights);
        
        // Update recommendations
        updateRecommendations(career);

    } catch (error) {
        console.log('AI insights not available, using static data');
    }
}

function generateCareerInsights(career) {
    const insightsMap = {
        'fullstack': {
            recommendation: "Focus on building full-stack projects to connect frontend and backend skills. Start with a simple CRUD application using React and Node.js.",
            metrics: [
                { name: "Frontend Progress", value: "45%" },
                { name: "Backend Progress", value: "40%" },
                { name: "Database Skills", value: "35%" }
            ]
        },
        'frontend': {
            recommendation: "Master React ecosystem and modern CSS. Build responsive, accessible web applications with good user experience.",
            metrics: [
                { name: "React Proficiency", value: "40%" },
                { name: "CSS Mastery", value: "70%" },
                { name: "JavaScript Skills", value: "65%" }
            ]
        },
        'backend': {
            recommendation: "Focus on API design, database optimization, and server security. Practice building scalable backend systems.",
            metrics: [
                { name: "API Development", value: "35%" },
                { name: "Database Skills", value: "40%" },
                { name: "Security Knowledge", value: "30%" }
            ]
        },
        'datascience': {
            recommendation: "Build strong foundation in statistics and data manipulation. Practice with real datasets and focus on model interpretation.",
            metrics: [
                { name: "Data Analysis", value: "55%" },
                { name: "Machine Learning", value: "30%" },
                { name: "Statistical Knowledge", value: "50%" }
            ]
        }
    };

    return insightsMap[career] || insightsMap['fullstack'];
}

function displayAIInsights(insights) {
    const insightsContainer = document.getElementById('aiInsights');
    const insightsCard = document.getElementById('aiInsightsCard');
    
    if (!insightsContainer) return;
    
    insightsContainer.innerHTML = `
        <div class="ai-insight-card">
            <div class="insight-content">
                <p>${insights.recommendation}</p>
                <div class="insight-metrics">
                    ${insights.metrics ? insights.metrics.map(metric => `
                        <div class="metric">
                            <strong>${metric.name}:</strong> ${metric.value}
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        </div>
    `;
    
    insightsCard.style.display = 'block';
}

function updateRecommendations(career) {
    const recommendationsList = document.getElementById('recommendationsList');
    
    const careerRecommendations = {
        'fullstack': [
            { icon: '🎯', title: 'Build Full-Stack Apps', desc: 'Create projects combining frontend and backend technologies' },
            { icon: '⚡', title: 'Learn Database Design', desc: 'Master SQL and NoSQL databases for data persistence' },
            { icon: '📈', title: 'Practice Deployment', desc: 'Learn to deploy applications to cloud platforms' }
        ],
        'frontend': [
            { icon: '🎯', title: 'Master React Hooks', desc: 'Deep dive into useState, useEffect and custom hooks' },
            { icon: '⚡', title: 'Learn State Management', desc: 'Understand Redux or Context API for complex apps' },
            { icon: '📈', title: 'Build Responsive UIs', desc: 'Create mobile-first, accessible web interfaces' }
        ],
        'backend': [
            { icon: '🎯', title: 'API Design Patterns', desc: 'Learn RESTful API design and best practices' },
            { icon: '⚡', title: 'Database Optimization', desc: 'Master query optimization and indexing' },
            { icon: '📈', title: 'Authentication Systems', desc: 'Implement secure login and authorization' }
        ],
        'datascience': [
            { icon: '🎯', title: 'Data Cleaning Practice', desc: 'Work with messy real-world datasets' },
            { icon: '⚡', title: 'Statistical Analysis', desc: 'Master hypothesis testing and statistical methods' },
            { icon: '📈', title: 'Visualization Skills', desc: 'Create compelling data visualizations' }
        ]
    };

    const recommendations = careerRecommendations[career] || careerRecommendations['fullstack'];
    
    recommendationsList.innerHTML = recommendations.map(rec => `
        <div class="recommendation">
            <div class="rec-icon">${rec.icon}</div>
            <div class="rec-content">
                <h4>${rec.title}</h4>
                <p>${rec.desc}</p>
            </div>
        </div>
    `).join('');
}

function editTargetRole() {
    // Redirect to profile page to change career
    window.location.href = 'profile.html';
}

// Add some CSS for the new elements
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .ai-insight-card {
        background: var(--bg-light);
        padding: 1.5rem;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--primary-color);
    }
    
    .insight-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .metric {
        background: white;
        padding: 0.75rem;
        border-radius: var(--border-radius);
        text-align: center;
    }
    
    .loading-skills {
        color: var(--text-light);
        font-style: italic;
        padding: 1rem;
        text-align: center;
    }
`;
document.head.appendChild(dashboardStyles);

console.log('✅ Dashboard ready');