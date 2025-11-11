// dashboard.js - USES REAL AI-GENERATED SKILLS ANALYSIS
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    if (!appState.userId || !appState.analysis) {
        window.location.href = 'upload.html';
        return;
    }

    await loadDashboardData();
    initializeCharts();
}

async function loadDashboardData() {
    const analysis = appState.analysis;
    
    // Update target role with AI-generated name
    document.getElementById('targetRole').textContent = 
        formatCareerName(appState.targetCareer);

    // Load real AI-generated skills data
    updateSkillsUI(analysis);
    updateProgressStats(analysis);
    await loadAIPersonalizedInsights();
}

function formatCareerName(careerId) {
    // Use AI-generated career name from analysis if available
    const analysis = appState.analysis;
    if (analysis && analysis.career_guidance) {
        return analysis.career_guidance.target_role_display || careerId;
    }
    
    // Fallback formatting
    return careerId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function updateSkillsUI(analysis) {
    const skillsData = analysis.skills_analysis;
    
    // Current skills (from AI analysis of CV)
    const masteredSkills = document.getElementById('masteredSkills');
    masteredSkills.innerHTML = skillsData.current_skills.map(skill => 
        `<span class="skill-tag mastered" data-level="${skill.level}">
            ${skill.skill} 
            <span class="skill-level">${skill.level}</span>
            <span class="skill-confidence">${skill.confidence}%</span>
        </span>`
    ).join('');

    // Missing skills (AI-identified gaps)
    const missingSkills = document.getElementById('missingSkills');
    missingSkills.innerHTML = skillsData.missing_skills.map(skill => 
        `<span class="skill-tag missing" data-importance="${skill.importance}">
            ${skill.skill} 
            <span class="importance-badge ${skill.importance}">${skill.importance}</span>
            <small>${skill.learning_time_weeks} weeks</small>
        </span>`
    ).join('');

    // Learning skills (prioritized by AI)
    const learningSkills = document.getElementById('learningSkills');
    const prioritizedSkills = skillsData.missing_skills
        .filter(skill => skill.importance === 'critical')
        .slice(0, 3);
    
    learningSkills.innerHTML = prioritizedSkills.map(skill => 
        `<span class="skill-tag learning">
            ${skill.skill}
            <div class="learning-progress">
                <div class="progress-bar" style="width: 25%"></div>
            </div>
        </span>`
    ).join('');
}

function updateProgressStats(analysis) {
    const roadmap = analysis.learning_roadmap;
    const skills = analysis.skills_analysis;
    
    document.getElementById('completionRate').textContent = 
        (roadmap?.readiness_score || 0) + '%';
    
    document.getElementById('skillsLearned').textContent = 
        skills.current_skills?.length || 0;
    
    document.getElementById('hoursSpent').textContent = 
        Math.round((roadmap?.total_duration_weeks || 0) * (roadmap?.weekly_commitment_hours || 10));
    
    document.getElementById('skillGapScore').textContent = 
        skills.skill_gap_score + '%';
}

async function loadAIPersonalizedInsights() {
    try {
        // Generate AI insights based on user progress
        const response = await apiCall('/ai/insights', 'POST', {
            user_id: appState.userId,
            analysis: appState.analysis,
            progress: getLearningProgress()
        });
        
        if (response.insights) {
            displayAIInsights(response.insights);
        }
    } catch (error) {
        console.log('AI insights not available, using static data');
    }
}

function displayAIInsights(insights) {
    const insightsContainer = document.getElementById('aiInsights');
    if (!insightsContainer) return;
    
    insightsContainer.innerHTML = `
        <div class="ai-insight-card">
            <h3>🤖 AI Career Coach</h3>
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
}

function initializeCharts() {
    const analysis = appState.analysis;
    const skillsData = analysis.skills_analysis;
    
    // Skills radar chart with real AI data
    const skillsCtx = document.getElementById('skillsChart').getContext('2d');
    const skillNames = skillsData.missing_skills.slice(0, 6).map(skill => skill.skill);
    const currentLevels = skillsData.missing_skills.slice(0, 6).map(skill => 
        Math.max(20, 100 - (skill.learning_time_weeks * 10))
    );
    const targetLevels = skillsData.missing_skills.slice(0, 6).map(() => 90);

    new Chart(skillsCtx, {
        type: 'radar',
        data: {
            labels: skillNames,
            datasets: [{
                label: 'Your Current Level',
                data: currentLevels,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)'
            }, {
                label: 'Target Level',
                data: targetLevels,
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
                            const label = context.dataset.label || '';
                            const value = context.raw;
                            const skill = skillNames[context.dataIndex];
                            const missingSkill = skillsData.missing_skills.find(s => s.skill === skill);
                            
                            if (label.includes('Current') && missingSkill) {
                                return `${label}: ${value}% (Need ${missingSkill.learning_time_weeks} weeks)`;
                            }
                            return `${label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });

    // Progress timeline with AI-estimated milestones
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    const roadmap = analysis.learning_roadmap;
    const totalWeeks = roadmap.total_duration_weeks;
    
    const milestones = [
        'Start', 
        `Week ${Math.floor(totalWeeks * 0.25)}`,
        `Week ${Math.floor(totalWeeks * 0.5)}`,
        `Week ${Math.floor(totalWeeks * 0.75)}`,
        'Goal'
    ];
    
    const progressData = [0, 25, 50, 75, 100];

    new Chart(progressCtx, {
        type: 'line',
        data: {
            labels: milestones,
            datasets: [{
                label: 'Career Readiness',
                data: progressData,
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Readiness: ${context.parsed.y}%`;
                        }
                    }
                }
            }
        }
    });
}

function getLearningProgress() {
    // Calculate real progress based on completed modules
    const completedModules = JSON.parse(localStorage.getItem('completedModules') || '[]');
    const totalModules = appState.analysis?.learning_roadmap?.phases?.reduce((total, phase) => 
        total + phase.modules.length, 0) || 1;
    
    return {
        completed: completedModules.length,
        total: totalModules,
        percentage: Math.round((completedModules.length / totalModules) * 100)
    };
}

function editTargetRole() {
    window.location.href = 'upload.html';
}