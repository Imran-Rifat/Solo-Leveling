// roadmap.js - COMPLETELY REWRITTEN WITH PROPER STATE MANAGEMENT
console.log('🚀 AI Roadmap System loaded');

// Global app state with proper initialization
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

// Career-specific configurations
const careerConfigs = {
    'fullstack': {
        title: 'Full-Stack Developer',
        description: 'Master both frontend and backend technologies',
        skills: ['JavaScript', 'React', 'Node.js', 'Database', 'APIs'],
        codingLanguages: ['JavaScript', 'Python', 'SQL']
    },
    'frontend': {
        title: 'Frontend Developer',
        description: 'Specialize in user interface and client-side development',
        skills: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'UI/UX'],
        codingLanguages: ['JavaScript', 'TypeScript']
    },
    'backend': {
        title: 'Backend Developer',
        description: 'Focus on server-side logic and database management',
        skills: ['Node.js', 'Python', 'Java', 'Database', 'APIs'],
        codingLanguages: ['JavaScript', 'Python', 'Java', 'C#']
    },
    'datascience': {
        title: 'Data Scientist',
        description: 'Analyze data and build machine learning models',
        skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization'],
        codingLanguages: ['Python', 'R', 'SQL']
    },
    'machinelearning': {
        title: 'Machine Learning Engineer',
        description: 'Design and implement ML systems and algorithms',
        skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'Data Engineering'],
        codingLanguages: ['Python', 'C++']
    },
    'mobile': {
        title: 'Mobile Developer',
        description: 'Build applications for iOS and Android platforms',
        skills: ['React Native', 'Swift', 'Kotlin', 'Mobile UI', 'APIs'],
        codingLanguages: ['JavaScript', 'Swift', 'Kotlin', 'Java']
    },
    'devops': {
        title: 'DevOps Engineer',
        description: 'Manage deployment, infrastructure, and CI/CD pipelines',
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
        codingLanguages: ['Python', 'JavaScript', 'Bash']
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
        
        // Check if we have a valid saved roadmap
        if (appState.roadmapGenerated && appState.roadmapData && isValidRoadmap(appState.roadmapData)) {
            console.log('✅ Loading existing roadmap from storage');
            displayExistingRoadmap();
            return;
        }
        
        // Check if we have user profile for new roadmap generation
        if (!appState.userProfile || !appState.userProfile.career) {
            console.error('❌ Missing user profile data');
            showAIErrorState('Please complete your career setup first. Redirecting to profile...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 3000);
            return;
        }
        
        console.log('🆕 Generating new AI-powered roadmap...');
        await generateNewRoadmap();
        
    } catch (error) {
        console.error('❌ Roadmap initialization failed:', error);
        showAIErrorState('Failed to initialize roadmap system. Please try again.');
    }
}

async function loadCompleteAppState() {
    try {
        console.log('💾 Loading application state...');
        
        // Load user profile
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
            appState.userProfile = JSON.parse(userProfile);
            console.log('👤 User profile loaded:', {
                name: appState.userProfile.name,
                career: appState.userProfile.career,
                experience: appState.userProfile.experience
            });
        }

        // Load complete app state
        const savedState = localStorage.getItem('soloLevelingState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState = { ...appState, ...parsedState };
            console.log('💾 App state loaded from storage');
            
            // Validate and set roadmap data
            if (parsedState.roadmapData && isValidRoadmap(parsedState.roadmapData)) {
                appState.roadmapData = parsedState.roadmapData;
                appState.roadmapGenerated = true;
                console.log('📊 Valid roadmap data found');
            } else if (parsedState.analysis?.learning_roadmap && isValidRoadmap(parsedState.analysis.learning_roadmap)) {
                appState.roadmapData = parsedState.analysis.learning_roadmap;
                appState.roadmapGenerated = true;
                console.log('📚 Legacy roadmap data migrated');
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to load app state:', error);
        // Reset state on error
        appState.roadmapGenerated = false;
        appState.roadmapData = null;
    }
}

function isValidRoadmap(roadmap) {
    return roadmap && 
           typeof roadmap === 'object' && 
           Array.isArray(roadmap.phases) && 
           roadmap.phases.length > 0 &&
           roadmap.total_duration_weeks > 0;
}

async function generateNewRoadmap() {
    try {
        const career = appState.userProfile.career;
        const userName = appState.userProfile.name;
        const experience = appState.userProfile.experience;
        
        console.log('🎯 Generating roadmap for:', { career, userName, experience });
        
        // Update UI immediately
        updateBasicUI(career, userName);
        showAILoadingState();

        // Generate AI roadmap
        const aiRoadmap = await generateAIRoadmap(career, experience, userName);
        
        if (aiRoadmap && aiRoadmap.success !== false && isValidRoadmap(aiRoadmap)) {
            // Save roadmap data immediately
            await saveRoadmapData(aiRoadmap);
            
            // Display the new roadmap
            displayRoadmapContent(aiRoadmap);
            
            showAINotification('🎉 AI roadmap generated successfully!', 'success');
            
        } else {
            throw new Error('Invalid roadmap data received from AI');
        }

    } catch (error) {
        console.error('❌ Failed to generate new roadmap:', error);
        showAIErrorState('Failed to generate AI roadmap. Loading demo roadmap...');
        loadDemoRoadmap();
    }
}

function updateBasicUI(career, userName) {
    const careerConfig = careerConfigs[career] || careerConfigs['fullstack'];
    
    document.getElementById('targetCareerName').textContent = careerConfig.title;
    document.getElementById('roadmapDescription').textContent = `Personalized learning path for ${userName}`;
}

async function generateAIRoadmap(career, experience, userName) {
    try {
        console.log('🤖 Calling AI roadmap generation API...');
        
        const cvAnalysis = appState.analysis || {};
        const userSkills = cvAnalysis.skills_analysis?.current_skills || [];
        
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
                timeframe_weeks: 24
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const roadmapData = await response.json();
        console.log('✅ AI roadmap API response received');
        
        if (!roadmapData.success) {
            throw new Error(roadmapData.error || 'Roadmap generation failed');
        }

        return roadmapData;

    } catch (error) {
        console.error('❌ AI roadmap generation failed:', error);
        // Return high-quality fallback roadmap
        return generateComprehensiveFallbackRoadmap(career, experience, userName);
    }
}

function generateComprehensiveFallbackRoadmap(career, experience, userName) {
    console.log('🔄 Generating comprehensive fallback roadmap');
    
    const careerConfig = careerConfigs[career] || careerConfigs['fullstack'];
    const codingLanguages = careerConfig.codingLanguages || ['JavaScript', 'Python'];
    
    return {
        overview: `Comprehensive ${careerConfig.title} learning path for ${userName}. This roadmap covers essential skills and technologies needed to become a proficient ${careerConfig.title}.`,
        total_duration_weeks: 24,
        weekly_commitment_hours: 15,
        readiness_score: Math.floor(Math.random() * 30) + 40, // 40-70%
        phases: [
            {
                phase_id: "phase_foundation",
                title: "Foundation Skills",
                description: `Build fundamental programming and computer science knowledge for ${careerConfig.title} role`,
                duration_weeks: 6,
                focus_areas: ["Programming Basics", "Computer Science Fundamentals", "Development Tools"],
                learning_objectives: [
                    "Master core programming concepts",
                    "Understand algorithms and data structures",
                    "Learn version control with Git",
                    "Set up development environment"
                ],
                modules: [
                    {
                        module_id: "module_programming_basics",
                        title: `${codingLanguages[0]} Programming Fundamentals`,
                        description: `Learn ${codingLanguages[0]} syntax, data types, control structures, and basic programming concepts`,
                        duration_weeks: 3,
                        technical_skills: [codingLanguages[0], "Data Types", "Control Structures", "Functions", "Debugging"],
                        learning_outcomes: [
                            `Write basic ${codingLanguages[0]} programs`,
                            "Understand variables and data types",
                            "Implement functions and control flow",
                            "Debug and test simple programs"
                        ],
                        resources: [
                            {
                                "title": `${codingLanguages[0]} Official Documentation`,
                                "url": "https://developer.mozilla.org/docs/Web/JavaScript",
                                "type": "documentation",
                                "free": true,
                                "description": `Official ${codingLanguages[0]} documentation and tutorials`
                            },
                            {
                                "title": "freeCodeCamp Programming Course",
                                "url": "https://www.freecodecamp.org/",
                                "type": "interactive",
                                "free": true,
                                "description": "Interactive programming courses"
                            }
                        ]
                    },
                    {
                        module_id: "module_data_structures",
                        title: "Data Structures & Algorithms",
                        description: "Essential data structures and algorithm concepts for efficient programming",
                        duration_weeks: 3,
                        technical_skills: ["Algorithms", "Data Structures", "Problem Solving", "Time Complexity"],
                        learning_outcomes: [
                            "Implement common data structures",
                            "Solve algorithmic problems",
                            "Analyze time and space complexity",
                            "Apply data structures to real problems"
                        ],
                        resources: [
                            {
                                "title": "GeeksforGeeks DSA",
                                "url": "https://www.geeksforgeeks.org/data-structures/",
                                "type": "tutorial",
                                "free": true,
                                "description": "Comprehensive data structures tutorials"
                            }
                        ]
                    }
                ]
            },
            {
                phase_id: "phase_core_tech",
                title: "Core Technologies",
                description: `Master the essential technologies and frameworks for ${careerConfig.title}`,
                duration_weeks: 8,
                focus_areas: careerConfig.skills.slice(0, 3),
                learning_objectives: [
                    "Learn core frameworks and libraries",
                    "Understand database design and management",
                    "Build complete applications",
                    "Implement best practices"
                ],
                modules: [
                    {
                        module_id: "module_frameworks",
                        title: `${careerConfig.title} Frameworks`,
                        description: `Learn the main frameworks and tools used in ${careerConfig.title} development`,
                        duration_weeks: 4,
                        technical_skills: careerConfig.skills.slice(0, 4),
                        learning_outcomes: [
                            "Build applications using industry-standard frameworks",
                            "Understand framework architecture and patterns",
                            "Implement common features and components",
                            "Follow best practices and conventions"
                        ],
                        resources: [
                            {
                                "title": "Framework Official Documentation",
                                "url": "https://reactjs.org/docs/getting-started.html",
                                "type": "documentation",
                                "free": true,
                                "description": "Official framework documentation"
                            }
                        ]
                    },
                    {
                        module_id: "module_database",
                        title: "Database Systems",
                        description: "Learn database design, management, and optimization",
                        duration_weeks: 4,
                        technical_skills: ["SQL", "Database Design", "ORM", "Performance"],
                        learning_outcomes: [
                            "Design efficient database schemas",
                            "Write complex SQL queries",
                            "Understand database optimization",
                            "Implement data access layers"
                        ],
                        resources: [
                            {
                                "title": "SQL Tutorial",
                                "url": "https://www.w3schools.com/sql/",
                                "type": "tutorial",
                                "free": true,
                                "description": "Comprehensive SQL tutorial"
                            }
                        ]
                    }
                ]
            },
            {
                phase_id: "phase_advanced",
                title: "Advanced Concepts",
                description: "Deep dive into advanced topics and real-world application development",
                duration_weeks: 6,
                focus_areas: ["System Design", "Performance", "Security", "Deployment"],
                learning_objectives: [
                    "Design scalable systems",
                    "Optimize application performance",
                    "Implement security best practices",
                    "Deploy and maintain applications"
                ],
                modules: [
                    {
                        module_id: "module_system_design",
                        title: "System Design & Architecture",
                        description: "Learn to design scalable and maintainable software systems",
                        duration_weeks: 3,
                        technical_skills: ["System Design", "Architecture Patterns", "Scalability", "Microservices"],
                        learning_outcomes: [
                            "Design software architecture",
                            "Understand scalability patterns",
                            "Implement microservices architecture",
                            "Plan for system growth"
                        ],
                        resources: [
                            {
                                "title": "System Design Primer",
                                "url": "https://github.com/donnemartin/system-design-primer",
                                "type": "tutorial",
                                "free": true,
                                "description": "Learn how to design large-scale systems"
                            }
                        ]
                    },
                    {
                        module_id: "module_deployment",
                        title: "Deployment & DevOps",
                        description: "Learn to deploy, monitor, and maintain applications in production",
                        duration_weeks: 3,
                        technical_skills: ["Deployment", "CI/CD", "Monitoring", "Containers"],
                        learning_outcomes: [
                            "Deploy applications to cloud platforms",
                            "Set up CI/CD pipelines",
                            "Monitor application performance",
                            "Use containerization technologies"
                        ],
                        resources: [
                            {
                                "title": "Docker Getting Started",
                                "url": "https://docs.docker.com/get-started/",
                                "type": "tutorial",
                                "free": true,
                                "description": "Learn containerization with Docker"
                            }
                        ]
                    }
                ]
            },
            {
                phase_id: "phase_projects",
                title: "Portfolio Projects",
                description: "Build real-world projects and prepare for job applications",
                duration_weeks: 4,
                focus_areas: ["Project Development", "Portfolio Building", "Interview Preparation"],
                learning_objectives: [
                    "Build complete portfolio projects",
                    "Showcase skills to employers",
                    "Prepare for technical interviews",
                    "Develop professional network"
                ],
                modules: [
                    {
                        module_id: "module_portfolio",
                        title: "Portfolio Development",
                        description: "Build and showcase projects that demonstrate your skills",
                        duration_weeks: 2,
                        technical_skills: ["Project Planning", "Implementation", "Documentation", "Deployment"],
                        learning_outcomes: [
                            "Plan and execute complete projects",
                            "Document code and projects effectively",
                            "Deploy projects for public access",
                            "Create compelling project presentations"
                        ],
                        resources: [
                            {
                                "title": "Project Ideas Repository",
                                "url": "https://github.com/florinpop17/app-ideas",
                                "type": "project",
                                "free": true,
                                "description": "Collection of project ideas for developers"
                            }
                        ]
                    },
                    {
                        module_id: "module_interview",
                        title: "Interview Preparation",
                        description: "Prepare for technical interviews and job applications",
                        duration_weeks: 2,
                        technical_skills: ["Problem Solving", "System Design", "Behavioral Interviews", "Negotiation"],
                        learning_outcomes: [
                            "Solve technical interview problems",
                            "Design systems in interviews",
                            "Handle behavioral questions",
                            "Negotiate job offers"
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
            job_market_analysis: `The demand for ${careerConfig.title} roles remains strong with competitive salaries. Companies are looking for developers who can build scalable applications and work across the stack.`,
            salary_expectations: `Entry-level: $70,000 - $90,000 | Mid-level: $90,000 - $130,000 | Senior: $130,000 - $180,000+`,
            portfolio_projects: [
                `Build a full-stack web application`,
                `Create a RESTful API with database integration`,
                `Develop a responsive frontend application`,
                `Implement a machine learning model (for ML roles)`,
                `Containerize and deploy an application`
            ],
            interview_preparation: [
                "Data structures and algorithms",
                "System design questions",
                "Framework-specific concepts",
                "Database design and optimization",
                "Behavioral and situational questions"
            ]
        }
    };
}

async function saveRoadmapData(roadmapData) {
    try {
        // Update app state
        appState.roadmapData = roadmapData;
        appState.roadmapGenerated = true;
        appState.lastGenerated = new Date().toISOString();
        
        // Also update legacy structure for compatibility
        appState.analysis = {
            ...appState.analysis,
            learning_roadmap: roadmapData
        };

        // Save to localStorage
        localStorage.setItem('soloLevelingState', JSON.stringify(appState));
        
        console.log('💾 Roadmap data saved successfully:', {
            phases: roadmapData.phases?.length || 0,
            totalWeeks: roadmapData.total_duration_weeks,
            modules: calculateTotalModules(roadmapData),
            timestamp: appState.lastGenerated
        });
        
        return true;
    } catch (error) {
        console.error('❌ Failed to save roadmap data:', error);
        return false;
    }
}

function displayExistingRoadmap() {
    console.log('🔄 Displaying existing roadmap from storage');
    
    const career = appState.userProfile.career;
    const userName = appState.userProfile.name;
    
    updateBasicUI(career, userName);
    displayRoadmapContent(appState.roadmapData);
    
    showAINotification('📚 Roadmap loaded from your saved progress!', 'success');
}

function displayRoadmapContent(roadmapData) {
    console.log('🎨 Rendering roadmap content...');
    
    // Update stats
    updateAIStats(roadmapData);
    
    // Display phases and modules
    displayAIPhases(roadmapData.phases || []);
    
    // Display career guidance
    displayAIGuidance(roadmapData.career_guidance);
    
    console.log('✅ Roadmap content rendered successfully');
}

function updateAIStats(roadmap) {
    document.getElementById('totalModules').textContent = calculateTotalModules(roadmap);
    document.getElementById('totalWeeks').textContent = roadmap.total_duration_weeks || '24';
    document.getElementById('skillsToLearn').textContent = calculateTotalSkills(roadmap);
    document.getElementById('readinessScore').textContent = (roadmap.readiness_score || 50) + '%';
    
    // Update last generated time
    updateLastGeneratedTime();
}

function updateLastGeneratedTime() {
    let lastGeneratedElement = document.getElementById('lastGenerated');
    if (!lastGeneratedElement) {
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            lastGeneratedElement = document.createElement('div');
            lastGeneratedElement.id = 'lastGenerated';
            lastGeneratedElement.className = 'stat-card';
            lastGeneratedElement.innerHTML = `
                <div class="stat-value" id="lastGeneratedTime">Just now</div>
                <div class="stat-label">Last Generated</div>
            `;
            statsGrid.appendChild(lastGeneratedElement);
        }
    }
    
    if (appState.lastGenerated) {
        const time = new Date(appState.lastGenerated).toLocaleString();
        document.getElementById('lastGeneratedTime').textContent = time;
    }
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

    console.log(`📚 Rendering ${phases.length} phases...`);
    
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
                }).join('') : '<p>No modules defined for this phase</p>'}
            </div>
        </div>
        `;
    }).join('');
    
    console.log('✅ All phases rendered successfully');
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

// Enhanced programming language detection
function detectProgrammingLanguage(module) {
    if (!module) return null;
    
    const moduleText = (
        (module.title || '') + ' ' + 
        (module.description || '') + ' ' + 
        (module.technical_skills?.join(' ') || '')
    ).toLowerCase();

    const languagePatterns = {
        'JavaScript': ['javascript', 'js', 'react', 'node', 'express', 'frontend', 'web', 'typescript'],
        'Python': ['python', 'django', 'flask', 'pandas', 'numpy', 'scikit', 'tensorflow', 'pytorch', 'data science', 'machine learning'],
        'Java': ['java', 'spring', 'hibernate', 'android', 'enterprise', 'jvm'],
        'C++': ['c++', 'cpp', 'game development', 'system programming', 'embedded'],
        'C#': ['c#', 'csharp', '.net', 'unity', 'windows', 'asp.net'],
        'SQL': ['sql', 'database', 'mysql', 'postgresql', 'mongodb', 'query'],
        'HTML/CSS': ['html', 'css', 'frontend', 'web design', 'responsive'],
        'TypeScript': ['typescript', 'ts', 'type safety', 'angular']
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
                <button onclick="loadDemoRoadmap()" class="secondary-button">
                    🎯 Load Demo Roadmap
                </button>
                ${appState.roadmapData ? `
                    <button onclick="displayExistingRoadmap()" class="secondary-button">
                        📂 Load Last Saved Roadmap
                    </button>
                ` : ''}
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
            <button onclick="regenerateRoadmap()" class="cta-button">
                Generate AI Roadmap
            </button>
        </div>
    `;
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
        
        window.location.href = `DSA.html?language=${encodeURIComponent(programmingLanguage)}&module=${encodeURIComponent(moduleName)}&career=${encodeURIComponent(career)}&title=${encodeURIComponent(module.title)}`;
    } else {
        showAINotification('Module not found in roadmap data', 'error');
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
        showAINotification('Module not found in roadmap data', 'error');
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
                        <p><strong>What you'll learn:</strong></p>
                        <ul>
                            ${module.learning_outcomes ? module.learning_outcomes.map(outcome => `<li>${outcome}</li>`).join('') : '<li>Practical coding skills</li>'}
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
    if (!appState.roadmapData?.phases) {
        return null;
    }
    
    for (const phase of appState.roadmapData.phases) {
        if (phase.modules) {
            const module = phase.modules.find(m => m.module_id === moduleId);
            if (module) return module;
        }
    }
    return null;
}

// Roadmap management functions
function regenerateRoadmap() {
    console.log('🔄 User requested roadmap regeneration');
    
    // Clear existing roadmap data
    appState.roadmapGenerated = false;
    appState.roadmapData = null;
    
    // Save cleared state
    saveAIState();
    
    // Show loading and generate new roadmap
    showAILoadingState();
    showAINotification('Generating new AI roadmap...', 'info');
    
    setTimeout(() => {
        generateNewRoadmap();
    }, 1000);
}

function loadDemoRoadmap() {
    const career = appState.userProfile.career;
    const userName = appState.userProfile.name;
    const experience = appState.userProfile.experience;
    
    const demoRoadmap = generateComprehensiveFallbackRoadmap(career, experience, userName);
    
    updateAIStats(demoRoadmap);
    displayAIPhases(demoRoadmap.phases);
    displayAIGuidance(demoRoadmap.career_guidance);
    
    showAINotification('Demo roadmap loaded successfully!', 'success');
}

function saveAIState() {
    try {
        localStorage.setItem('soloLevelingState', JSON.stringify(appState));
        console.log('💾 App state saved');
    } catch (e) {
        console.error('❌ App state save failed:', e);
    }
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
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add enhanced CSS for new elements
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    .loading-steps {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 1.5rem 0;
        text-align: left;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .loading-step {
        padding: 0.5rem;
        border-radius: 6px;
        background: #f7fafc;
        transition: all 0.3s ease;
    }
    
    .loading-step.active {
        background: #667eea;
        color: white;
        font-weight: bold;
    }
    
    .loading-note {
        font-size: 0.9rem;
        color: #718096;
        margin-top: 1rem;
    }
    
    .coding-module {
        border-left: 4px solid #4cc9f0;
    }
    
    .coding-start {
        background: linear-gradient(135deg, #4cc9f0, #4361ee);
    }
    
    .coding-start:hover {
        background: linear-gradient(135deg, #3aa8d8, #3a0ca3);
        transform: translateY(-2px);
    }
    
    .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
        flex-wrap: wrap;
    }
    
    .retry-button, .secondary-button, .cta-button {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .secondary-button {
        background: #e2e8f0;
        color: #4a5568;
    }
    
    .secondary-button:hover {
        background: #cbd5e0;
    }
    
    .ai-loading-state, .ai-error-state, .ai-empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin: 2rem 0;
    }
`;
document.head.appendChild(enhancedStyles);

console.log('✅ Enhanced Roadmap System Ready');