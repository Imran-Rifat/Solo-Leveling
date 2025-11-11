// roadmap.js - FIXED STATE LOADING
console.log('🚀 AI Roadmap loaded');

// Global appState - MUST match upload.js structure
let appState = {
    userId: null,
    targetCareer: null,
    analysis: null,
    currentModule: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Roadmap DOM ready');
    initializeAIRoadmap();
});

function initializeAIRoadmap() {
    console.log('🔄 Initializing AI roadmap...');
    
    // Load state from localStorage
    loadAppState();
    
    // Verify we have the required data
    if (!appState.userId || !appState.analysis) {
        console.error('❌ Missing required data:', {
            userId: appState.userId,
            hasAnalysis: !!appState.analysis
        });
        showAIErrorState('Please complete the CV analysis first.');
        return;
    }
    
    console.log('✅ App state loaded:', {
        userId: appState.userId,
        targetCareer: appState.targetCareer,
        analysisKeys: Object.keys(appState.analysis)
    });
    
    loadAICurriculum();
    initializeAIInteractions();
}

function loadAppState() {
    try {
        const savedState = localStorage.getItem('soloLevelingState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState = { ...appState, ...parsedState };
            console.log('💾 State loaded from storage');
        } else {
            console.error('❌ No saved state found in localStorage');
        }
    } catch (e) {
        console.error('❌ Failed to load state:', e);
    }
}

async function loadAICurriculum() {
    try {
        const analysis = appState.analysis;
        
        if (!analysis) {
            throw new Error('No analysis data available');
        }
        
        // Display AI-generated content
        document.getElementById('targetCareerName').textContent = 
            appState.targetCareer || 'Your Career';
        
        document.getElementById('roadmapDescription').textContent = 
            analysis.learning_roadmap?.overview || 'AI-generated personalized learning path';

        // Update AI-calculated stats
        updateAIStats(analysis);
        
        // Display AI-generated learning phases
        displayAIPhases(analysis.learning_roadmap?.phases || []);

        // Load AI career guidance
        displayAIGuidance(analysis.career_guidance);

    } catch (error) {
        console.error('Failed to load AI curriculum:', error);
        showAIErrorState('Failed to load learning roadmap. Please try again.');
    }
}

function updateAIStats(analysis) {
    const roadmap = analysis.learning_roadmap;
    const skills = analysis.skills_analysis;
    
    document.getElementById('totalModules').textContent = 
        calculateAIModules(roadmap);
    
    document.getElementById('totalWeeks').textContent = 
        roadmap?.total_duration_weeks || '16';
    
    document.getElementById('skillsToLearn').textContent = 
        skills.missing_skills?.length || 0;
    
    document.getElementById('readinessScore').textContent = 
        (roadmap?.readiness_score || 65) + '%';
}

function calculateAIModules(roadmap) {
    if (!roadmap?.phases) return 0;
    return roadmap.phases.reduce((total, phase) => total + (phase.modules?.length || 0), 0);
}

function displayAIPhases(phases) {
    const timeline = document.getElementById('roadmapTimeline');
    
    if (!phases || phases.length === 0) {
        showAIEmptyState();
        return;
    }

    timeline.innerHTML = phases.map((phase, phaseIndex) => `
        <div class="ai-phase" data-phase="${phase.phase_id}">
            <div class="ai-phase-header">
                <div class="phase-meta">
                    <span class="phase-badge">Phase ${phaseIndex + 1}</span>
                    <span class="phase-duration">${phase.duration_weeks} weeks</span>
                </div>
                <div class="phase-content">
                    <h2>${phase.title}</h2>
                    <p class="phase-description">${phase.description || 'AI-designed learning phase'}</p>
                    
                    ${phase.focus_areas ? `
                        <div class="focus-areas">
                            <strong>Focus Areas:</strong>
                            ${phase.focus_areas.map(area => `<span class="focus-tag">${area}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${phase.learning_objectives ? `
                        <div class="learning-objectives">
                            <h4>🎯 Learning Objectives</h4>
                            <ul>
                                ${phase.learning_objectives.map(obj => `<li>${obj}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="ai-modules-grid">
                ${phase.modules ? phase.modules.map(module => `
                    <div class="ai-module-card" data-module="${module.module_id}">
                        <div class="module-header">
                            <div class="module-meta">
                                <span class="module-duration">${module.duration_weeks} weeks</span>
                                <span class="module-difficulty">${getAIDifficulty(module)}</span>
                            </div>
                            <h3>${module.title}</h3>
                        </div>
                        
                        <p class="module-description">${module.description}</p>
                        
                        ${module.technical_skills ? `
                            <div class="module-skills">
                                <h4>🛠️ Technical Skills</h4>
                                <div class="skills-grid">
                                    ${module.technical_skills.map(skill => 
                                        `<span class="skill-badge">${skill}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${module.learning_outcomes ? `
                            <div class="learning-outcomes">
                                <h4>📚 You Will Learn</h4>
                                <ul>
                                    ${module.learning_outcomes.map(outcome => `<li>${outcome}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="module-actions">
                            <button class="ai-start-button" onclick="startAIModule('${module.module_id}')">
                                Start Learning 🤖
                            </button>
                        </div>
                    </div>
                `).join('') : '<p>No modules defined for this phase</p>'}
            </div>
        </div>
    `).join('');
}

function getAIDifficulty(module) {
    const weeks = module.duration_weeks || 2;
    if (weeks <= 2) return 'Beginner';
    if (weeks <= 4) return 'Intermediate';
    return 'Advanced';
}

function displayAIGuidance(guidance) {
    const guidanceContainer = document.getElementById('careerGuidance');
    if (!guidanceContainer || !guidance) return;

    guidanceContainer.innerHTML = `
        <div class="ai-guidance-card">
            <h3>🤖 AI Career Coach</h3>
            
            ${guidance.job_market_analysis ? `
                <div class="guidance-section">
                    <h4>📈 Market Insights</h4>
                    <p>${guidance.job_market_analysis}</p>
                </div>
            ` : ''}
            
            ${guidance.salary_expectations ? `
                <div class="guidance-section">
                    <h4>💰 Salary Guide</h4>
                    <p>${guidance.salary_expectations}</p>
                </div>
            ` : ''}
            
            ${guidance.portfolio_projects ? `
                <div class="guidance-section">
                    <h4>🎯 Portfolio Projects</h4>
                    <ul>
                        ${guidance.portfolio_projects.map(project => `<li>${project}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${guidance.interview_preparation ? `
                <div class="guidance-section">
                    <h4>💼 Interview Prep</h4>
                    <ul>
                        ${guidance.interview_preparation.map(topic => `<li>${topic}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

function startAIModule(moduleId) {
    const module = findAIModule(moduleId);
    if (module) {
        appState.currentModule = module;
        saveAIState();
        window.location.href = 'learning.html';
    } else {
        showAINotification('Module not found in AI data', 'error');
    }
}

function findAIModule(moduleId) {
    const phases = appState.analysis?.learning_roadmap?.phases || [];
    for (const phase of phases) {
        if (phase.modules) {
            const module = phase.modules.find(m => m.module_id === moduleId);
            if (module) return module;
        }
    }
    return null;
}

function showAIErrorState(message) {
    const timeline = document.getElementById('roadmapTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = `
        <div class="ai-error-state">
            <h3>🤖 AI Roadmap Generator</h3>
            <p>${message || 'I\'m currently creating your personalized learning path...'}</p>
            <p>This may take a moment as I analyze the best approach for your career goals.</p>
            <div class="error-actions">
                <button onclick="location.reload()" class="retry-button">
                    🔄 Refresh Roadmap
                </button>
                <button onclick="window.location.href='upload.html'" class="secondary-button">
                    📊 Back to Analysis
                </button>
            </div>
        </div>
    `;
}

function showAIEmptyState() {
    const timeline = document.getElementById('roadmapTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = `
        <div class="ai-empty-state">
            <h3>🚀 Ready for AI-Powered Learning?</h3>
            <p>Your personalized curriculum is being prepared based on your career goals and current skills.</p>
            <button onclick="window.location.href='upload.html'" class="cta-button">
                Start Career Analysis
            </button>
        </div>
    `;
}

function initializeAIInteractions() {
    // Add AI-powered interactions
    const phaseHeaders = document.querySelectorAll('.ai-phase-header');
    phaseHeaders.forEach(header => {
        header.addEventListener('click', function() {
            this.parentElement.classList.toggle('expanded');
        });
    });
}

function saveAIState() {
    try {
        localStorage.setItem('soloLevelingState', JSON.stringify(appState));
        console.log('💾 AI state saved');
    } catch (e) {
        console.log('❌ AI state save failed');
    }
}

function showAINotification(message, type = 'info') {
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
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

console.log('✅ AI Roadmap ready');