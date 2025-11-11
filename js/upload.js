// upload.js - FIXED ROADMAP GENERATION
console.log('🚀 AI Career Builder loaded');

let selectedCareer = null;
let currentAnalysis = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM ready');
    loadAICareers();
    setupUpload();
    
    // Initialize appState globally
    initializeAppState();
});

function initializeAppState() {
    if (typeof window.appState === 'undefined') {
        window.appState = {
            selectedCareer: null,
            userSkills: [],
            targetCareer: null,
            userId: null,
            analysis: null
        };
        console.log('🔄 App state initialized');
    }
    
    // Load from localStorage if available
    try {
        const savedState = localStorage.getItem('soloLevelingState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            window.appState = { ...window.appState, ...parsedState };
            console.log('💾 Loaded state from storage:', window.appState.userId ? 'User exists' : 'No user');
        }
    } catch (e) {
        console.log('❌ Could not load from storage:', e);
    }
}

async function loadAICareers() {
    try {
        console.log('🔄 Loading AI-generated careers...');
        const response = await fetch('http://localhost:5000/api/careers/list');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.careers && data.careers.length > 0) {
            displayAICareers(data.careers);
        } else {
            showAICareerError('No careers available. Please try again.');
        }
    } catch (error) {
        console.error('❌ Failed to load careers:', error);
        showAICareerError('Unable to load careers. Please check your connection.');
    }
}

function displayAICareers(careers) {
    const careerGrid = document.getElementById('careerGrid');
    
    careerGrid.innerHTML = careers.map(career => `
        <div class="career-card" data-career="${career.id}" onclick="selectCareer('${career.id}')">
            <h3>${career.name}</h3>
            <p>${career.description}</p>
            <div class="career-meta">
                <span class="salary">${career.average_salary_range}</span>
                <span class="growth">${career.growth_outlook}</span>
            </div>
            <div class="technologies">
                ${career.key_technologies ? career.key_technologies.map(tech => 
                    `<span class="tech-tag">${tech}</span>`
                ).join('') : ''}
            </div>
        </div>
    `).join('');
}

function showAICareerError(message) {
    const careerGrid = document.getElementById('careerGrid');
    careerGrid.innerHTML = `
        <div class="ai-error-state">
            <h3>🤖 AI Career Advisor</h3>
            <p>${message}</p>
            <button onclick="loadAICareers()" class="retry-button">
                🔄 Try Again
            </button>
        </div>
    `;
}

function selectCareer(careerId) {
    document.querySelectorAll('.career-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-career="${careerId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCareer = careerId;
        document.getElementById('careerError').style.display = 'none';
    }
    
    console.log('🎯 Selected career:', careerId);
}

function setupUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) {
        console.error('❌ Upload elements not found');
        return;
    }

    uploadArea.addEventListener('click', function() {
        if (!selectedCareer) {
            document.getElementById('careerError').style.display = 'block';
            return;
        }
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0 && selectedCareer) {
            processAIAnalysis(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0 && selectedCareer) {
            processAIAnalysis(e.dataTransfer.files[0]);
        }
    });
}

async function processAIAnalysis(file) {
    console.log('📁 AI analysis for:', file.name, 'Career:', selectedCareer);
    
    // Validate file
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'text/plain'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        showAINotification('Please upload PDF, Word, or text file', 'error');
        return;
    }

    // Show AI loading state
    document.getElementById('uploadArea').style.display = 'none';
    document.getElementById('parsingStatus').style.display = 'block';
    document.getElementById('parsingStatus').innerHTML = `
        <div class="ai-loading">
            <div class="ai-spinner"></div>
            <h3>🤖 AI Career Analysis in Progress</h3>
            <p>Analyzing your CV for <strong>${selectedCareer}</strong> career path...</p>
            <p>This may take a few moments as I create your personalized learning plan.</p>
        </div>
    `;
    
    try {
        console.log('🎯 Starting AI career analysis...');
        const result = await analyzeCareerPath(file, selectedCareer);
        console.log('✅ AI analysis complete:', result);
        
        if (result.success) {
            showAIAnalysis(result);
        } else {
            throw new Error(result.error || 'AI analysis failed');
        }
        
    } catch (error) {
        console.error('❌ AI analysis failed:', error);
        showAINotification('Analysis failed: ' + error.message, 'error');
        resetUpload();
    }
}

async function analyzeCareerPath(file, targetCareer) {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('target_career', targetCareer);
    
    console.log('📤 Sending to backend...');
    
    const response = await fetch('http://localhost:5000/api/skills/analyze', {
        method: 'POST',
        body: formData
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server error: ${response.status}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('📊 Analysis result received');
    return result;
}

function showAIAnalysis(data) {
    console.log('📊 Displaying AI analysis:', data);
    
    // Hide loading, show results
    document.getElementById('parsingStatus').style.display = 'none';
    document.getElementById('analysisResults').style.display = 'block';
    
    // Store analysis data
    currentAnalysis = data;
    
    // Update global app state
    updateAppState(data);
    
    // Display AI-generated results
    displayAIResults(data);
}

function updateAppState(data) {
    if (!window.appState) {
        initializeAppState();
    }
    
    window.appState.userId = data.user_id;
    window.appState.targetCareer = data.target_career;
    window.appState.analysis = data.analysis;
    
    console.log('💾 App state updated:', {
        userId: window.appState.userId,
        targetCareer: window.appState.targetCareer,
        hasAnalysis: !!window.appState.analysis
    });
    
    // Save to localStorage
    saveAppState();
}

function saveAppState() {
    try {
        localStorage.setItem('soloLevelingState', JSON.stringify(window.appState));
        console.log('💾 State saved to localStorage');
    } catch (e) {
        console.log('⚠️ Could not save to localStorage:', e);
    }
}

function displayAIResults(data) {
    const resultsContent = document.getElementById('resultsContent');
    const analysis = data.analysis;
    const skillsData = analysis.skills_analysis;
    const roadmap = analysis.learning_roadmap;
    const guidance = analysis.career_guidance;

    resultsContent.innerHTML = `
        <div class="ai-analysis-header">
            <h2>🎯 Your AI Career Plan for ${data.target_career}</h2>
            <p>Personalized by AI based on your CV analysis</p>
        </div>
        
        <div class="ai-stats-grid">
            <div class="ai-stat-card">
                <div class="stat-value">${roadmap.readiness_score || 65}%</div>
                <div class="stat-label">Career Readiness</div>
            </div>
            <div class="ai-stat-card">
                <div class="stat-value">${roadmap.total_duration_weeks || 16}</div>
                <div class="stat-label">Weeks to Goal</div>
            </div>
            <div class="ai-stat-card">
                <div class="stat-value">${skillsData.missing_skills ? skillsData.missing_skills.length : 0}</div>
                <div class="stat-label">Skills to Learn</div>
            </div>
            <div class="ai-stat-card">
                <div class="stat-value">${skillsData.skill_gap_score || 70}%</div>
                <div class="stat-label">Skill Gap</div>
            </div>
        </div>
        
        <div class="ai-skills-analysis">
            <div class="skills-section">
                <h3>✅ Your Current Skills</h3>
                <div class="skills-grid">
                    ${(skillsData.current_skills || []).map(skill => `
                        <div class="skill-item current">
                            <span class="skill-name">${skill.skill}</span>
                            <span class="skill-level ${skill.level}">${skill.level}</span>
                            ${skill.confidence ? `<span class="skill-confidence">${skill.confidence}%</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="skills-section">
                <h3>🎯 Skills to Master</h3>
                <div class="skills-grid">
                    ${(skillsData.missing_skills || []).map(skill => `
                        <div class="skill-item missing ${skill.importance}">
                            <span class="skill-name">${skill.skill}</span>
                            <span class="skill-importance">${skill.importance}</span>
                            <span class="skill-time">${skill.learning_time_weeks || 2} weeks</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        ${roadmap.overview ? `
            <div class="ai-roadmap-overview">
                <h3>📈 Learning Roadmap</h3>
                <p>${roadmap.overview}</p>
                <div class="roadmap-meta">
                    <span>Duration: ${roadmap.total_duration_weeks || 16} weeks</span>
                    <span>Weekly: ${roadmap.weekly_commitment_hours || 15} hours</span>
                    <span>Phases: ${roadmap.phases ? roadmap.phases.length : 0}</span>
                </div>
            </div>
        ` : ''}
        
        ${guidance ? `
            <div class="ai-career-guidance">
                <h3>💼 AI Career Insights</h3>
                ${guidance.job_market_analysis ? `
                    <div class="guidance-item">
                        <h4>📊 Market Analysis</h4>
                        <p>${guidance.job_market_analysis}</p>
                    </div>
                ` : ''}
                ${guidance.salary_expectations ? `
                    <div class="guidance-item">
                        <h4>💰 Salary Expectations</h4>
                        <p>${guidance.salary_expectations}</p>
                    </div>
                ` : ''}
                ${guidance.portfolio_projects ? `
                    <div class="guidance-item">
                        <h4>🛠️ Recommended Projects</h4>
                        <ul>
                            ${guidance.portfolio_projects.map(project => `<li>${project}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        ` : ''}
        
        <div class="ai-actions">
            <button class="generate-roadmap-btn" onclick="generateAIRoadmap()">
                🚀 Generate Detailed Learning Plan
            </button>
        </div>
    `;
    
    showAINotification('AI career analysis completed successfully! 🎉', 'success');
}

function generateAIRoadmap() {
    console.log('🛠️ Generate roadmap clicked');
    
    if (!currentAnalysis) {
        console.error('❌ No current analysis data');
        showAINotification('No analysis data available. Please upload your CV first.', 'error');
        return;
    }
    
    if (!window.appState || !window.appState.analysis) {
        console.error('❌ App state not properly initialized');
        showAINotification('Application state error. Please refresh and try again.', 'error');
        return;
    }
    
    console.log('📊 Current app state:', {
        userId: window.appState.userId,
        targetCareer: window.appState.targetCareer,
        analysisKeys: Object.keys(window.appState.analysis)
    });
    
    // Double-check state is saved
    saveAppState();
    
    // Verify state was saved
    try {
        const savedState = localStorage.getItem('soloLevelingState');
        if (!savedState) {
            throw new Error('State not saved to storage');
        }
        console.log('✅ State verified in localStorage');
    } catch (e) {
        console.error('❌ State save verification failed:', e);
        showAINotification('Error saving data. Please try again.', 'error');
        return;
    }
    
    showAINotification('Opening your AI-powered learning roadmap...', 'success');
    
    // Redirect to roadmap page
    setTimeout(() => {
        console.log('🔀 Redirecting to roadmap.html');
        window.location.href = 'roadmap.html';
    }, 1000);
}

function resetUpload() {
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('parsingStatus').style.display = 'none';
    document.getElementById('analysisResults').style.display = 'none';
}

function showAINotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.ai-notification').forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
    `;
    notification.innerHTML = `
        <div class="ai-notification-content" style="display: flex; align-items: center; justify-content: space-between;">
            <span class="ai-notification-icon" style="margin-right: 0.5rem;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : '🤖'}
            </span>
            <span class="ai-notification-message" style="flex: 1;">${message}</span>
            <button class="ai-notification-close" onclick="this.parentElement.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: 1rem;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

console.log('✅ AI Career Builder ready');