// roadmap.js - COMPLETE OPENAI API INTEGRATION
console.log('🚀 AI Roadmap System loaded');

// Global app state
let appState = {
    userId: null,
    targetCareer: null,
    analysis: null,
    currentModule: null,
    userProfile: null,
    roadmapGenerated: false,
    roadmapData: null,
    lastGenerated: null
};

// Career configurations
const careerConfigs = {
    'fullstack': {
        title: 'Full-Stack Developer',
        description: 'Master both frontend and backend web development',
        skills: ['JavaScript', 'React', 'Node.js', 'Database', 'APIs', 'HTML/CSS'],
        languages: ['JavaScript', 'Python', 'SQL']
    },
    'frontend': {
        title: 'Frontend Developer',
        description: 'Specialize in user interface and client-side development',
        skills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'UI/UX'],
        languages: ['JavaScript', 'TypeScript']
    },
    'backend': {
        title: 'Backend Developer',
        description: 'Focus on server-side logic and database management',
        skills: ['Node.js', 'Python', 'Java', 'Database', 'APIs', 'Authentication'],
        languages: ['JavaScript', 'Python', 'Java', 'C#']
    },
    'datascience': {
        title: 'Data Scientist',
        description: 'Analyze data and build machine learning models',
        skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization'],
        languages: ['Python', 'R', 'SQL']
    },
    'machinelearning': {
        title: 'Machine Learning Engineer',
        description: 'Design and implement AI models and systems',
        skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Data Engineering'],
        languages: ['Python', 'C++']
    },
    'mobile': {
        title: 'Mobile Developer',
        description: 'Build applications for iOS and Android platforms',
        skills: ['React Native', 'Swift', 'Kotlin', 'Mobile UI', 'APIs'],
        languages: ['JavaScript', 'Swift', 'Kotlin', 'Java']
    },
    'devops': {
        title: 'DevOps Engineer',
        description: 'Manage deployment, infrastructure, and CI/CD pipelines',
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
        languages: ['Python', 'JavaScript', 'Bash']
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Roadmap DOM ready');
    initializeAIRoadmap();
});

async function initializeAIRoadmap() {
    console.log('🔄 Initializing AI roadmap system...');
    
    try {
        // Load all state from localStorage
        await loadCompleteAppState();
        
        // Check if we need to regenerate roadmap
        if (shouldRegenerateRoadmap()) {
            console.log('🔄 Regenerating roadmap...');
            await generateNewRoadmap();
        } else if (appState.roadmapGenerated && appState.roadmapData && isValidRoadmap(appState.roadmapData)) {
            console.log('✅ Loading existing roadmap from storage');
            displayExistingRoadmap();
        } else {
            console.log('🆕 No valid roadmap found, generating new one...');
            await generateNewRoadmap();
        }
        
    } catch (error) {
        console.error('❌ Roadmap initialization failed:', error);
        showAIErrorState('Failed to load roadmap. Please try again.');
    }
}

async function loadCompleteAppState() {
    try {
        console.log('💾 Loading application state...');
        
        // Load user profile
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
            appState.userProfile = JSON.parse(userProfile);
            console.log('👤 User profile loaded:', appState.userProfile);
        }

        // Load complete app state
        const savedState = localStorage.getItem('soloLevelingState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState = { ...appState, ...parsedState };
            console.log('💾 App state loaded from storage');
        }
        
    } catch (error) {
        console.error('❌ Failed to load app state:', error);
        appState.roadmapGenerated = false;
        appState.roadmapData = null;
    }
}

function shouldRegenerateRoadmap() {
    if (!appState.userProfile || !appState.userProfile.career) {
        console.log('❌ No user profile found');
        return false;
    }
    
    if (!appState.roadmapData || !appState.roadmapGenerated) {
        console.log('🔄 No existing roadmap found');
        return true;
    }
    
    const currentCareer = appState.userProfile.career;
    const roadmapCareer = appState.roadmapData.career || appState.targetCareer;
    
    if (currentCareer !== roadmapCareer) {
        console.log(`🔄 Career changed from ${roadmapCareer} to ${currentCareer}`);
        return true;
    }
    
    if (!isValidRoadmap(appState.roadmapData)) {
        console.log('🔄 Invalid roadmap data');
        return true;
    }
    
    return false;
}

function isValidRoadmap(roadmap) {
    return roadmap && 
           typeof roadmap === 'object' && 
           Array.isArray(roadmap.phases) && 
           roadmap.phases.length > 0;
}

async function generateNewRoadmap() {
    try {
        const career = appState.userProfile.career;
        const userName = appState.userProfile.name;
        const experience = appState.userProfile.experience;
        
        console.log('🎯 Generating roadmap for:', { career, userName, experience });
        
        // Update UI
        updateBasicUI(career, userName);
        showAILoadingState();

        // Generate AI roadmap using OpenAI
        const aiRoadmap = await generateAIRoadmap(career, experience, userName);
        
        if (aiRoadmap && aiRoadmap.success !== false && isValidRoadmap(aiRoadmap)) {
            // Add career information
            aiRoadmap.career = career;
            
            // Save and display
            await saveRoadmapData(aiRoadmap);
            displayRoadmapContent(aiRoadmap);
            
            showAINotification(`🎉 ${getCareerTitle(career)} roadmap generated!`, 'success');
            
        } else {
            throw new Error('Invalid roadmap data from AI');
        }

    } catch (error) {
        console.error('❌ Failed to generate roadmap:', error);
        showAIErrorState('AI generation failed. Loading career-specific content...');
        loadCareerSpecificContent();
    }
}

async function generateAIRoadmap(career, experience, userName) {
    try {
        console.log('🤖 Calling OpenAI API for roadmap generation...');
        
        const cvAnalysis = appState.analysis || {};
        const userSkills = cvAnalysis.skills_analysis?.current_skills || [];
        
        // Prepare the prompt for OpenAI
        const prompt = createOpenAIPrompt(career, experience, userName, userSkills);
        
        const response = await fetch('http://localhost:5000/api/ai/generate-roadmap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                career: career,
                experience_level: experience,
                user_name: userName,
                user_skills: userSkills,
                timeframe_weeks: 24,
                prompt: prompt
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ OpenAI API response received');
        
        if (!result.success) {
            throw new Error(result.error || 'OpenAI generation failed');
        }

        return result;

    } catch (error) {
        console.error('❌ OpenAI API call failed:', error);
        // Return a high-quality fallback roadmap
        return generateComprehensiveFallback(career, experience, userName);
    }
}

function createOpenAIPrompt(career, experience, userName, userSkills) {
    const careerConfig = careerConfigs[career] || careerConfigs['fullstack'];
    const careerTitle = careerConfig.title;
    
    const skillsText = userSkills.map(skill => skill.skill).join(', ') || 'No specific skills identified';
    
    return `
Create a comprehensive, practical learning roadmap for ${userName}, a ${experience} level learner who wants to become a ${careerTitle}.

CAREER TARGET: ${careerTitle}
EXPERIENCE LEVEL: ${experience}
USER NAME: ${userName}
EXISTING SKILLS: ${skillsText}
TIMEFRAME: 24 weeks
WEEKLY COMMITMENT: 15 hours per week

Please generate a structured, industry-relevant learning path with:

1. 4-6 learning phases with clear progression
2. Each phase should have 2-3 practical modules
3. Each module must include:
   - Specific, actionable learning objectives
   - Technical skills that will be acquired
   - Real-world applications and projects
   - Duration in weeks (1-4 weeks per module)
   - 2-3 high-quality, free learning resources
   - Clear learning outcomes

4. Include career guidance with:
   - Current job market analysis for this role
   - Realistic salary expectations
   - Portfolio project recommendations
   - Interview preparation topics

IMPORTANT: Focus on practical, hands-on learning. Include coding exercises, projects, and real-world applications.

Return ONLY valid JSON in this exact structure:
{
    "overview": "Brief description of the learning path",
    "total_duration_weeks": 24,
    "weekly_commitment_hours": 15,
    "readiness_score": 65,
    "phases": [
        {
            "phase_id": "phase_1",
            "title": "Phase title",
            "description": "Phase description",
            "duration_weeks": 6,
            "focus_areas": ["Area 1", "Area 2"],
            "learning_objectives": ["Objective 1", "Objective 2"],
            "modules": [
                {
                    "module_id": "module_1_1",
                    "title": "Module title",
                    "description": "Module description",
                    "duration_weeks": 3,
                    "technical_skills": ["Skill 1", "Skill 2"],
                    "learning_outcomes": ["Outcome 1", "Outcome 2"],
                    "resources": [
                        {
                            "title": "Resource title",
                            "url": "https://real-website.com/path",
                            "type": "tutorial|course|documentation|project",
                            "free": true,
                            "description": "Brief description of what this resource offers"
                        }
                    ]
                }
            ]
        }
    ],
    "career_guidance": {
        "job_market_analysis": "Current market analysis",
        "salary_expectations": "Salary ranges for different levels",
        "portfolio_projects": ["Project 1", "Project 2", "Project 3"],
        "interview_preparation": ["Topic 1", "Topic 2", "Topic 3"]
    }
}

Make it practical, industry-relevant, and tailored for a ${experience} level learner. Include real resources from platforms like freeCodeCamp, MDN, official documentation, and other reputable free learning platforms.
`;
}

function generateComprehensiveFallback(career, experience, userName) {
    console.log('🔄 Generating comprehensive fallback roadmap');
    
    const careerConfig = careerConfigs[career] || careerConfigs['fullstack'];
    const careerTitle = careerConfig.title;
    
    return {
        overview: `Comprehensive ${careerTitle} learning path for ${userName}. This roadmap covers essential skills and practical projects to become job-ready.`,
        total_duration_weeks: 24,
        weekly_commitment_hours: 15,
        readiness_score: Math.floor(Math.random() * 30) + 40,
        phases: [
            {
                phase_id: "phase_foundation",
                title: `${careerTitle} Fundamentals`,
                description: `Build strong foundation in core ${careerTitle.toLowerCase()} concepts and technologies`,
                duration_weeks: 6,
                focus_areas: ["Core Concepts", "Essential Tools", "Basic Projects"],
                learning_objectives: [
                    "Master fundamental concepts and principles",
                    "Learn essential development tools and workflows",
                    "Build basic projects to apply knowledge"
                ],
                modules: [
                    {
                        module_id: "module_programming_basics",
                        title: `${careerConfig.languages[0]} Programming`,
                        description: `Learn ${careerConfig.languages[0]} programming fundamentals and best practices`,
                        duration_weeks: 3,
                        technical_skills: [careerConfig.languages[0], "Programming Basics", "Debugging"],
                        learning_outcomes: [
                            `Write basic ${careerConfig.languages[0]} programs`,
                            "Understand programming concepts and patterns",
                            "Debug and test code effectively"
                        ],
                        resources: [
                            {
                                "title": `${careerConfig.languages[0]} Official Documentation`,
                                "url": "https://developer.mozilla.org/docs/Web/JavaScript",
                                "type": "documentation",
                                "free": true,
                                "description": `Official ${careerConfig.languages[0]} documentation and guides`
                            },
                            {
                                "title": "freeCodeCamp Programming Course",
                                "url": "https://www.freecodecamp.org/",
                                "type": "course",
                                "free": true,
                                "description": "Interactive programming courses and projects"
                            }
                        ]
                    },
                    {
                        module_id: "module_core_concepts",
                        title: `${careerTitle} Core Concepts`,
                        description: `Master the fundamental concepts and patterns used in ${careerTitle.toLowerCase()} roles`,
                        duration_weeks: 3,
                        technical_skills: careerConfig.skills.slice(0, 4),
                        learning_outcomes: [
                            "Understand core concepts and architecture",
                            "Apply best practices and patterns",
                            "Build foundational projects"
                        ],
                        resources: [
                            {
                                "title": `${careerTitle} Best Practices`,
                                "url": "https://github.com/",
                                "type": "tutorial",
                                "free": true,
                                "description": "Industry best practices and patterns"
                            }
                        ]
                    }
                ]
            },
            {
                phase_id: "phase_development",
                title: "Practical Development",
                description: "Apply concepts to real-world projects and scenarios",
                duration_weeks: 8,
                focus_areas: ["Project Development", "Advanced Concepts", "Real-world Applications"],
                learning_objectives: [
                    "Build complete projects from scratch",
                    "Apply advanced concepts and techniques",
                    "Solve real-world problems"
                ],
                modules: [
                    {
                        module_id: "module_projects",
                        title: "Project Development",
                        description: "Build practical projects to apply your skills",
                        duration_weeks: 4,
                        technical_skills: [...careerConfig.skills.slice(0, 4), "Project Management"],
                        learning_outcomes: [
                            "Plan and execute complete projects",
                            "Apply skills to real scenarios",
                            "Debug and optimize applications"
                        ],
                        resources: [
                            {
                                "title": "Project Ideas and Tutorials",
                                "url": "https://github.com/florinpop17/app-ideas",
                                "type": "project",
                                "free": true,
                                "description": "Collection of project ideas for practice"
                            }
                        ]
                    },
                    {
                        module_id: "module_advanced",
                        title: "Advanced Techniques",
                        description: "Learn advanced concepts and optimization techniques",
                        duration_weeks: 4,
                        technical_skills: [...careerConfig.skills.slice(2, 6), "Performance", "Optimization"],
                        learning_outcomes: [
                            "Implement advanced features",
                            "Optimize application performance",
                            "Apply industry best practices"
                        ],
                        resources: [
                            {
                                "title": "Advanced Concepts Guide",
                                "url": "https://developer.mozilla.org/",
                                "type": "documentation",
                                "free": true,
                                "description": "Advanced concepts and techniques"
                            }
                        ]
                    }
                ]
            },
            {
                phase_id: "phase_specialization",
                title: "Specialization & Career",
                description: "Focus on specialization areas and career preparation",
                duration_weeks: 6,
                focus_areas: ["Specialization", "Portfolio", "Interview Preparation"],
                learning_objectives: [
                    "Develop specialized expertise",
                    "Build professional portfolio",
                    "Prepare for job interviews"
                ],
                modules: [
                    {
                        module_id: "module_portfolio",
                        title: "Portfolio Development",
                        description: "Create a professional portfolio showcasing your skills",
                        duration_weeks: 3,
                        technical_skills: ["Portfolio Development", "Project Presentation", "GitHub"],
                        learning_outcomes: [
                            "Build professional portfolio",
                            "Showcase projects effectively",
                            "Create compelling project documentation"
                        ],
                        resources: [
                            {
                                "title": "Portfolio Guide",
                                "url": "https://medium.com/",
                                "type": "tutorial",
                                "free": true,
                                "description": "Guide to building developer portfolios"
                            }
                        ]
                    },
                    {
                        module_id: "module_interview",
                        title: "Interview Preparation",
                        description: "Prepare for technical interviews and job applications",
                        duration_weeks: 3,
                        technical_skills: ["Problem Solving", "System Design", "Communication"],
                        learning_outcomes: [
                            "Solve technical interview problems",
                            "Design systems effectively",
                            "Communicate technical concepts clearly"
                        ],
                        resources: [
                            {
                                "title": "Tech Interview Handbook",
                                "url": "https://www.techinterviewhandbook.org/",
                                "type": "guide",
                                "free": true,
                                "description": "Comprehensive technical interview preparation"
                            }
                        ]
                    }
                ]
            }
        ],
        career_guidance: {
            job_market_analysis: `The demand for ${careerTitle} roles continues to grow with competitive salaries and opportunities across industries. Companies are looking for practical skills and project experience.`,
            salary_expectations: `Entry-level: $70,000 - $90,000 | Mid-level: $90,000 - $130,000 | Senior: $130,000 - $180,000+`,
            portfolio_projects: [
                `Build a complete ${careerTitle.toLowerCase()} application`,
                "Create a portfolio showcasing 3-5 quality projects",
                "Contribute to open source projects",
                "Document your learning journey and projects"
            ],
            interview_preparation: [
                "Data structures and algorithms",
                "System design concepts",
                "Technical problem solving",
                "Behavioral interviews",
                "Project discussions and code reviews"
            ]
        }
    };
}

async function saveRoadmapData(roadmapData) {
    try {
        appState.roadmapData = roadmapData;
        appState.roadmapGenerated = true;
        appState.targetCareer = roadmapData.career;
        appState.lastGenerated = new Date().toISOString();
        
        localStorage.setItem('soloLevelingState', JSON.stringify(appState));
        
        console.log('💾 Roadmap saved for career:', roadmapData.career);
        return true;
    } catch (error) {
        console.error('❌ Failed to save roadmap:', error);
        return false;
    }
}

function displayExistingRoadmap() {
    console.log('🔄 Displaying existing roadmap');
    
    const career = appState.userProfile.career;
    const userName = appState.userProfile.name;
    
    updateBasicUI(career, userName);
    displayRoadmapContent(appState.roadmapData);
    
    showAINotification(`📚 ${getCareerTitle(career)} roadmap loaded!`, 'success');
}

function updateBasicUI(career, userName) {
    const careerTitle = getCareerTitle(career);
    
    document.getElementById('targetCareerName').textContent = careerTitle;
    document.getElementById('roadmapDescription').textContent = `Personalized learning path for ${userName}`;
}

function getCareerTitle(career) {
    const careerConfig = careerConfigs[career] || careerConfigs['fullstack'];
    return careerConfig.title;
}

function displayRoadmapContent(roadmapData) {
    console.log('🎨 Rendering roadmap content');
    
    updateAIStats(roadmapData);
    displayAIPhases(roadmapData.phases || []);
    displayAIGuidance(roadmapData.career_guidance);
    
    console.log('✅ Roadmap content rendered');
}

function updateAIStats(roadmap) {
    document.getElementById('totalModules').textContent = calculateTotalModules(roadmap);
    document.getElementById('totalWeeks').textContent = roadmap.total_duration_weeks || '24';
    document.getElementById('skillsToLearn').textContent = calculateTotalSkills(roadmap);
    document.getElementById('readinessScore').textContent = (roadmap.readiness_score || 50) + '%';
}

function calculateTotalModules(roadmap) {
    if (!roadmap.phases) return 0;
    return roadmap.phases.reduce((total, phase) => total + (phase.modules?.length || 0), 0);
}

function calculateTotalSkills(roadmap) {
    if (!roadmap.phases) return 0;
    let skills = new Set();
    
    roadmap.phases.forEach(phase => {
        phase.modules?.forEach(module => {
            module.technical_skills?.forEach(skill => skills.add(skill));
        });
    });
    
    return skills.size;
}

function displayAIPhases(phases) {
    const timeline = document.getElementById('roadmapTimeline');
    
    if (!phases || phases.length === 0) {
        showAIEmptyState();
        return;
    }

    timeline.innerHTML = phases.map((phase, phaseIndex) => {
        return `
        <div class="ai-phase" data-phase="${phase.phase_id}">
            <div class="ai-phase-header">
                <div class="phase-meta">
                    <span class="phase-badge">Phase ${phaseIndex + 1}</span>
                    <span class="phase-duration">${phase.duration_weeks} weeks</span>
                </div>
                <div class="phase-content">
                    <h2>${phase.title}</h2>
                    <p class="phase-description">${phase.description}</p>
                    
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
                ${phase.modules ? phase.modules.map(module => {
                    const programmingLanguage = detectProgrammingLanguage(module);
                    const isCoding = programmingLanguage !== null;
                    
                    return `
                    <div class="ai-module-card ${isCoding ? 'coding-module' : ''}" data-module="${module.module_id}">
                        <div class="module-header">
                            <div class="module-meta">
                                <span class="module-duration">${module.duration_weeks} weeks</span>
                                <span class="module-difficulty">${getAIDifficulty(module)}</span>
                                ${isCoding ? `
                                    <span class="coding-badge" data-language="${programmingLanguage}">
                                        💻 ${programmingLanguage}
                                    </span>
                                ` : ''}
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
                        
                        ${module.resources && module.resources.length > 0 ? `
                            <div class="module-resources">
                                <h4>📖 Learning Resources</h4>
                                <div class="resources-list">
                                    ${module.resources.map(resource => `
                                        <div class="resource-item">
                                            <div class="resource-header">
                                                <a href="${resource.url}" target="_blank" class="resource-link">
                                                    ${resource.title} ${resource.free ? '🆓' : ''}
                                                </a>
                                                <span class="resource-type">${resource.type}</span>
                                            </div>
                                            ${resource.description ? `<p class="resource-description">${resource.description}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="module-actions">
                            ${isCoding ? `
                                <button class="ai-start-button coding-start" onclick="startCodingModule('${module.module_id}', '${programmingLanguage}')">
                                    🚀 Start ${programmingLanguage} Coding
                                </button>
                                <button class="btn-outline" onclick="showCodingPreview('${module.module_id}', '${programmingLanguage}')">
                                    👀 Preview Exercises
                                </button>
                            ` : `
                                <button class="ai-start-button" onclick="startTheoryModule('${module.module_id}')">
                                    📚 Start Learning
                                </button>
                            `}
                        </div>
                    </div>
                    `;
                }).join('') : '<p>No modules in this phase</p>'}
            </div>
        </div>
        `;
    }).join('');
}

function displayAIGuidance(guidance) {
    if (!guidance) return;
    
    let guidanceContainer = document.getElementById('careerGuidance');
    if (!guidanceContainer) {
        guidanceContainer = document.createElement('div');
        guidanceContainer.id = 'careerGuidance';
        guidanceContainer.className = 'career-guidance-section';
        document.querySelector('.roadmap-container').appendChild(guidanceContainer);
    }

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

function detectProgrammingLanguage(module) {
    if (!module) return null;
    
    const moduleText = (
        (module.title || '') + ' ' + 
        (module.description || '') + ' ' + 
        (module.technical_skills?.join(' ') || '')
    ).toLowerCase();

    const languagePatterns = {
        'JavaScript': ['javascript', 'js', 'react', 'node', 'express', 'frontend', 'web'],
        'Python': ['python', 'django', 'flask', 'pandas', 'numpy', 'data science', 'machine learning'],
        'Java': ['java', 'spring', 'android', 'enterprise'],
        'C++': ['c++', 'cpp', 'game development', 'system programming'],
        'C#': ['c#', 'csharp', '.net', 'unity', 'windows'],
        'TypeScript': ['typescript', 'ts', 'type safety'],
        'SQL': ['sql', 'database', 'mysql', 'postgresql'],
        'HTML/CSS': ['html', 'css', 'frontend', 'web design']
    };

    for (const [language, patterns] of Object.entries(languagePatterns)) {
        for (const pattern of patterns) {
            if (moduleText.includes(pattern.toLowerCase())) {
                return language;
            }
        }
    }

    return null;
}

function getAIDifficulty(module) {
    const weeks = module.duration_weeks || 2;
    if (weeks <= 2) return 'Beginner';
    if (weeks <= 4) return 'Intermediate';
    return 'Advanced';
}

function showAILoadingState() {
    const timeline = document.getElementById('roadmapTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = `
        <div class="ai-loading-state">
            <div class="ai-spinner"></div>
            <h3>🤖 AI is generating your personalized roadmap</h3>
            <p>Analyzing career requirements and creating optimal learning path...</p>
            <div class="loading-steps">
                <div class="loading-step active">📊 Analyzing your profile</div>
                <div class="loading-step">🎯 Designing learning path</div>
                <div class="loading-step">📚 Curating resources</div>
                <div class="loading-step">💾 Saving your roadmap</div>
            </div>
            <p class="loading-note">This may take 20-30 seconds</p>
        </div>
    `;
}

function showAIErrorState(message) {
    const timeline = document.getElementById('roadmapTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = `
        <div class="ai-error-state">
            <h3>🤖 Roadmap Generator</h3>
            <p>${message || 'Unable to load roadmap at this time.'}</p>
            <div class="error-actions">
                <button onclick="regenerateRoadmap()" class="retry-button">
                    🔄 Generate New Roadmap
                </button>
                <button onclick="loadCareerSpecificContent()" class="secondary-button">
                    🎯 Load Career Content
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
            <p>Your personalized curriculum is being prepared based on your career goals.</p>
            <button onclick="regenerateRoadmap()" class="cta-button">
                Generate AI Roadmap
            </button>
        </div>
    `;
}

function loadCareerSpecificContent() {
    const career = appState.userProfile.career;
    const userName = appState.userProfile.name;
    const experience = appState.userProfile.experience;
    
    const roadmap = generateComprehensiveFallback(career, experience, userName);
    
    updateAIStats(roadmap);
    displayAIPhases(roadmap.phases);
    displayAIGuidance(roadmap.career_guidance);
    
    showAINotification(`🎯 ${getCareerTitle(career)} content loaded!`, 'success');
}

function regenerateRoadmap() {
    console.log('🔄 User requested roadmap regeneration');
    
    appState.roadmapGenerated = false;
    appState.roadmapData = null;
    
    localStorage.setItem('soloLevelingState', JSON.stringify(appState));
    
    showAILoadingState();
    showAINotification('Generating new AI roadmap...', 'info');
    
    setTimeout(() => {
        generateNewRoadmap();
    }, 1000);
}

// Module interaction functions
function startCodingModule(moduleId, programmingLanguage) {
    const module = findAIModule(moduleId);
    if (module) {
        appState.currentModule = module;
        saveAIState();
        
        console.log(`🚀 Starting coding module: ${module.title} with ${programmingLanguage}`);
        
        const moduleName = module.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const career = appState.userProfile.career;
        
window.location.href = `dsa.html?language=${encodeURIComponent(programmingLanguage)}&module=${encodeURIComponent(moduleName)}&career=${encodeURIComponent(career)}&title=${encodeURIComponent(module.title)}`;    } else {
        showAINotification('Module not found', 'error');
    }
}

function startTheoryModule(moduleId) {
    const module = findAIModule(moduleId);
    if (module) {
        appState.currentModule = module;
        saveAIState();
        
        console.log(`📚 Starting theory module: ${module.title}`);
        window.location.href = 'learning.html';
    } else {
        showAINotification('Module not found', 'error');
    }
}

function showCodingPreview(moduleId, programmingLanguage) {
    const module = findAIModule(moduleId);
    if (module) {
        const modal = document.createElement('div');
        modal.className = 'ai-modal-overlay';
        modal.innerHTML = `
            <div class="ai-modal-content">
                <div class="modal-header">
                    <h3>💻 ${module.title}</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="coding-preview">
                        <h4>Programming Language: ${programmingLanguage}</h4>
                        <p><strong>Duration:</strong> ${module.duration_weeks} weeks</p>
                        <p><strong>Skills you'll learn:</strong></p>
                        <ul>
                            ${module.technical_skills ? module.technical_skills.map(skill => `<li>${skill}</li>`).join('') : '<li>Practical programming skills</li>'}
                        </ul>
                        <div class="preview-actions">
                            <button class="btn-primary" onclick="startCodingModule('${moduleId}', '${programmingLanguage}')">
                                Start Coding in ${programmingLanguage}
                            </button>
                            <button class="btn-outline" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function findAIModule(moduleId) {
    if (!appState.roadmapData?.phases) return null;
    
    for (const phase of appState.roadmapData.phases) {
        if (phase.modules) {
            const module = phase.modules.find(m => m.module_id === moduleId);
            if (module) return module;
        }
    }
    return null;
}

function saveAIState() {
    try {
        localStorage.setItem('soloLevelingState', JSON.stringify(appState));
    } catch (e) {
        console.error('❌ Failed to save state:', e);
    }
}

function showAINotification(message, type = 'info') {
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
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

console.log('✅ OpenAI-Powered Roadmap System Ready');