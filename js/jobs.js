// jobs.js - AI-POWERED JOB MATCHING
let allJobs = [];

document.addEventListener('DOMContentLoaded', function() {
    loadAIMatchingJobs();
});

async function loadAIMatchingJobs() {
    const jobsGrid = document.getElementById('jobsGrid');
    
    try {
        // Show AI-powered loading message
        jobsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>🤖 AI is finding perfect job matches for you...</p>
            </div>
        `;

        // Get AI-analyzed skills from app state
        const analysis = appState.analysis;
        if (!analysis || !analysis.skills_analysis) {
            throw new Error('No skills analysis available');
        }

        const userSkills = analysis.skills_analysis.current_skills.map(skill => skill.skill);
        const targetRole = appState.targetCareer;
        
        if (userSkills.length === 0) {
            jobsGrid.innerHTML = `
                <div class="no-jobs">
                    <h3>No skills profile found</h3>
                    <p>Please upload your CV first to get AI-powered job matches</p>
                    <a href="upload.html" class="apply-button">Upload CV</a>
                </div>
            `;
            return;
        }

        // Call AI-powered job matching API
        const response = await apiCall('/jobs/match', 'POST', {
            skills: userSkills,
            category: targetRole,
            experience: getExperienceLevel(analysis)
        });

        allJobs = response.matched_jobs || [];
        
        if (allJobs.length === 0) {
            jobsGrid.innerHTML = `
                <div class="no-jobs">
                    <h3>🎯 AI Job Match Results</h3>
                    <p>No immediate matches found. Focus on learning these skills first:</p>
                    <div class="priority-skills">
                        ${analysis.skills_analysis.missing_skills
                            .filter(skill => skill.importance === 'critical')
                            .slice(0, 3)
                            .map(skill => `<span class="skill-tag missing">${skill.skill}</span>`)
                            .join('')}
                    </div>
                    <button class="apply-button" onclick="loadAIMatchingJobs()">
                        🔄 Refresh Matches
                    </button>
                </div>
            `;
        } else {
            displayAIJobs(allJobs);
        }

    } catch (error) {
        console.error('AI job matching failed:', error);
        jobsGrid.innerHTML = `
            <div class="no-jobs">
                <h3>🤖 AI Assistant</h3>
                <p>I'm having trouble accessing job data right now.</p>
                <div class="ai-suggestions">
                    <p><strong>Suggested actions:</strong></p>
                    <ul>
                        <li>Check your learning roadmap for skill development</li>
                        <li>Practice with coding exercises</li>
                        <li>Try again in a few minutes</li>
                    </ul>
                </div>
                <button class="apply-button" onclick="loadAIMatchingJobs()">
                    Retry AI Matching
                </button>
            </div>
        `;
    }
}

function getExperienceLevel(analysis) {
    const skills = analysis.skills_analysis.current_skills;
    if (skills.some(skill => skill.level === 'advanced')) return 'experienced';
    if (skills.some(skill => skill.level === 'intermediate')) return 'intermediate';
    return 'beginner';
}

function displayAIJobs(jobs) {
    const jobsGrid = document.getElementById('jobsGrid');
    
    jobsGrid.innerHTML = `
        <div class="ai-match-header">
            <h3>🎯 AI-Curated Job Matches</h3>
            <p>Based on your skills, experience, and career goals</p>
        </div>
        ${jobs.map(job => `
            <div class="job-card" data-match="${job.match_percentage}">
                <div class="job-header">
                    <div class="job-info">
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">🏢 ${job.company}</div>
                        <div class="job-location">📍 ${job.location}</div>
                        ${job.salary_range ? `
                            <div class="job-salary">💰 ${job.salary_range}</div>
                        ` : ''}
                    </div>
                    <div class="match-badge ${getMatchClass(job.match_percentage)}">
                        ${job.match_percentage}% Match
                    </div>
                </div>
                
                <div class="job-description">
                    ${job.job_description || `Great opportunity for ${appState.targetCareer} developers`}
                </div>
                
                <div class="job-skills">
                    <div class="skills-section">
                        <strong>✅ Your Matching Skills:</strong>
                        <div class="skills-tags">
                            ${renderSkillTags(job.matching_skills || [], 'matching')}
                        </div>
                    </div>
                    <div class="skills-section">
                        <strong>📚 Skills to Develop:</strong>
                        <div class="skills-tags">
                            ${renderSkillTags(job.missing_skills || [], 'missing')}
                        </div>
                    </div>
                </div>
                
                ${job.tags ? `
                    <div class="job-tags">
                        ${job.tags.map(tag => `<span class="job-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="job-actions">
                    <a href="${job.application_url || '#'}" target="_blank" class="apply-button">
                        📨 Apply Now
                    </a>
                    <button class="save-button" onclick="saveAIJob('${job.id}')">
                        💾 Save Job
                    </button>
                    <button class="analyze-button" onclick="analyzeJobFit('${job.id}')">
                        🤖 Analyze Fit
                    </button>
                </div>
            </div>
        `).join('')}
    `;
}

function getMatchClass(percentage) {
    if (percentage >= 80) return 'excellent-match';
    if (percentage >= 60) return 'good-match';
    if (percentage >= 40) return 'fair-match';
    return 'low-match';
}

function renderSkillTags(skills, type) {
    if (!skills || skills.length === 0) {
        return `<span class="no-skills">No ${type === 'matching' ? 'matching' : 'missing'} skills identified</span>`;
    }
    
    return skills.map(skill => 
        `<span class="skill-tag ${type}">${type === 'matching' ? '✓' : '📚'} ${skill}</span>`
    ).join('');
}

async function analyzeJobFit(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    try {
        showNotification('🤖 AI is analyzing your fit for this job...', 'info');
        
        const response = await apiCall('/ai/analyze-job-fit', 'POST', {
            job: job,
            user_skills: appState.analysis.skills_analysis.current_skills,
            missing_skills: appState.analysis.skills_analysis.missing_skills
        });

        if (response.analysis) {
            showJobFitAnalysis(response.analysis);
        }
    } catch (error) {
        showNotification('AI analysis unavailable. Check job requirements manually.', 'warning');
    }
}

function showJobFitAnalysis(analysis) {
    const modal = document.createElement('div');
    modal.className = 'ai-analysis-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🤖 AI Job Fit Analysis</h3>
                <button class="close-button" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="analysis-content">
                <div class="fit-score">
                    <div class="score-circle">${analysis.fit_score}%</div>
                    <h4>Overall Fit Score</h4>
                </div>
                <div class="analysis-details">
                    <div class="strengths">
                        <h5>✅ Your Strengths:</h5>
                        <ul>
                            ${analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="gaps">
                        <h5>📚 Areas to Improve:</h5>
                        <ul>
                            ${analysis.improvement_areas.map(area => `<li>${area}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="recommendations">
                        <h5>🎯 Recommendations:</h5>
                        <p>${analysis.recommendations}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function filterJobs() {
    const jobType = document.getElementById('jobType').value;
    const location = document.getElementById('location').value;
    const matchThreshold = parseInt(document.getElementById('matchThreshold').value);
    
    let filteredJobs = allJobs;
    
    // Filter by AI match score
    filteredJobs = filteredJobs.filter(job => job.match_percentage >= matchThreshold);
    
    // Filter by location (if specified)
    if (location) {
        filteredJobs = filteredJobs.filter(job => 
            job.location.toLowerCase().includes(location.toLowerCase())
        );
    }
    
    // Filter by job type (if specified)
    if (jobType && jobType !== 'all') {
        filteredJobs = filteredJobs.filter(job => 
            job.tags && job.tags.includes(jobType)
        );
    }
    
    if (filteredJobs.length === 0) {
        document.getElementById('jobsGrid').innerHTML = `
            <div class="no-jobs">
                <h3>No jobs match your current filters</h3>
                <p>Try adjusting the match threshold or search criteria</p>
                <button class="apply-button" onclick="resetFilters()">
                    Reset Filters
                </button>
            </div>
        `;
    } else {
        displayAIJobs(filteredJobs);
    }
}

function resetFilters() {
    document.getElementById('jobType').value = 'all';
    document.getElementById('location').value = '';
    document.getElementById('matchThreshold').value = '50';
    displayAIJobs(allJobs);
}

function refreshJobs() {
    allJobs = [];
    loadAIMatchingJobs();
}

function saveAIJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    // Save to user's profile
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    if (!savedJobs.find(j => j.id === jobId)) {
        savedJobs.push(job);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    }
    
    showNotification('Job saved to your profile! 🤖', 'success');
    
    // Update button
    const button = event.target;
    button.textContent = '✅ Saved';
    button.disabled = true;
}

// Add CSS for new elements
const style = document.createElement('style');
style.textContent = `
    .ai-match-header {
        grid-column: 1 / -1;
        text-align: center;
        margin-bottom: 2rem;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px;
    }
    
    .match-badge.excellent-match { background: #48bb78; }
    .match-badge.good-match { background: #ed8936; }
    .match-badge.fair-match { background: #ecc94b; }
    .match-badge.low-match { background: #f56565; }
    
    .ai-analysis-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .ai-analysis-modal .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .skills-section {
        margin-bottom: 1rem;
    }
    
    .job-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
    }
    
    .job-tag {
        background: #e2e8f0;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);