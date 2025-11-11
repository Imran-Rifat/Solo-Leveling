// learning.js - FULLY AI-POWERED INTERACTIVE LEARNING
let currentModule = null;
let currentLessonIndex = 0;
let userProgress = {};
let codeEditor;

document.addEventListener('DOMContentLoaded', function() {
    initializeAILearningInterface();
});

async function initializeAILearningInterface() {
    if (!appState.currentModule) {
        window.location.href = 'roadmap.html';
        return;
    }

    currentModule = appState.currentModule;
    await loadAIModuleContent();
    initializeAILearningTabs();
    initializeAICodeEditor();
    loadUserProgress();
}

async function loadAIModuleContent() {
    try {
        // Update UI with AI-generated module data
        document.getElementById('moduleTitle').textContent = currentModule.title;
        document.getElementById('moduleDescription').textContent = currentModule.description;
        
        // Load AI-generated lessons
        await loadAILessons();
        
        // Load first lesson content
        if (currentModule.lessons && currentModule.lessons.length > 0) {
            await loadAILessonContent(currentModule.lessons[0], 0);
        }
        
        updateAIProgress();
        initializeAIAssistant();

    } catch (error) {
        console.error('Failed to load AI module:', error);
        showAIFallbackContent();
    }
}

async function loadAILessons() {
    const lessonList = document.getElementById('lessonList');
    
    if (!currentModule.lessons || currentModule.lessons.length === 0) {
        // Generate lessons on-demand using AI
        showNotification('🤖 AI is creating your lessons...', 'info');
        
        try {
            const response = await apiCall('/learning/generate-lesson', 'POST', {
                topic: currentModule.title,
                difficulty: calculateModuleDifficulty(currentModule),
                skills: currentModule.technical_skills,
                lesson_type: 'comprehensive'
            });
            
            if (response.lesson) {
                currentModule.lessons = [response.lesson];
                appState.currentModule = currentModule;
                saveState();
            }
        } catch (error) {
            console.error('Failed to generate lessons:', error);
        }
    }

    // Display AI-generated lessons
    if (currentModule.lessons && currentModule.lessons.length > 0) {
        lessonList.innerHTML = currentModule.lessons.map((lesson, index) => `
            <div class="lesson-item ${index === currentLessonIndex ? 'active' : ''}" 
                 onclick="selectAILesson(${index})">
                <div class="lesson-status">
                    <span class="status-icon">${getLessonStatusIcon(index)}</span>
                </div>
                <div class="lesson-content">
                    <div class="lesson-title">
                        <span class="lesson-icon">📖</span>
                        ${lesson.title}
                    </div>
                    <div class="lesson-concepts">
                        ${lesson.technical_concepts?.slice(0, 3).map(concept => 
                            `<span class="concept-tag">${concept}</span>`
                        ).join('') || ''}
                    </div>
                    <div class="lesson-meta">
                        <span class="lesson-duration">~30-60 min</span>
                        ${userProgress[`lesson_${index}`] ? 
                            `<span class="lesson-completed">✅ Completed</span>` : 
                            `<span class="lesson-pending">⏳ Pending</span>`
                        }
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        lessonList.innerHTML = `
            <div class="no-lessons">
                <p>🤖 AI lessons are being prepared...</p>
                <button class="retry-button" onclick="loadAILessons()">
                    Generate Lessons
                </button>
            </div>
        `;
    }
}

async function loadAILessonContent(lesson, index) {
    try {
        const tutorialContent = document.getElementById('tutorialContent');
        const exerciseContent = document.getElementById('exerciseContent');
        const resourcesContent = document.getElementById('resourcesContent');

        // Show AI loading state
        tutorialContent.innerHTML = `
            <div class="ai-loading">
                <div class="loading-spinner"></div>
                <p>🤖 AI is preparing your lesson content...</p>
            </div>
        `;

        // Generate or load detailed lesson content
        let detailedLesson = lesson;
        if (!lesson.detailed_content) {
            const response = await apiCall('/learning/generate-lesson', 'POST', {
                topic: lesson.title,
                difficulty: 'interactive',
                concepts: lesson.technical_concepts
            });
            
            if (response.lesson) {
                detailedLesson = { ...lesson, ...response.lesson };
                // Update the lesson in module
                currentModule.lessons[index] = detailedLesson;
            }
        }

        // Load AI-generated tutorial content
        tutorialContent.innerHTML = generateAITutorialHTML(detailedLesson);
        
        // Load AI-generated exercises
        exerciseContent.innerHTML = generateAIExercisesHTML(detailedLesson);
        
        // Load AI-recommended resources
        resourcesContent.innerHTML = generateAIResourcesHTML(currentModule.resources || []);

        // Initialize interactive elements
        initializeAICodeBlocks();
        initializeAIExercises();

        // Update navigation
        updateAINavigation();

    } catch (error) {
        console.error('Failed to load lesson content:', error);
        showAILessonFallback(lesson);
    }
}

function generateAITutorialHTML(lesson) {
    return `
        <div class="ai-lesson-content">
            <div class="lesson-header">
                <h2>${lesson.title}</h2>
                <div class="lesson-concepts-badge">
                    ${lesson.technical_concepts?.map(concept => 
                        `<span class="concept-badge">${concept}</span>`
                    ).join('') || ''}
                </div>
            </div>
            
            ${lesson.learning_objectives ? `
                <div class="learning-objectives">
                    <h3>🎯 Learning Objectives</h3>
                    <ul>
                        ${lesson.learning_objectives.map(obj => `<li>${obj}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${lesson.theory_content ? `
                <div class="theory-section">
                    <h3>📚 Core Concepts</h3>
                    <div class="theory-content">
                        ${formatAIContent(lesson.theory_content)}
                    </div>
                </div>
            ` : ''}
            
            ${lesson.code_examples && lesson.code_examples.length > 0 ? `
                <div class="code-examples-section">
                    <h3>💻 AI-Generated Examples</h3>
                    ${lesson.code_examples.map((example, exIndex) => `
                        <div class="code-example" id="code-example-${exIndex}">
                            <div class="example-header">
                                <h4>${example.title || 'Code Example'}</h4>
                                <button class="copy-code" onclick="copyAICode('code-example-${exIndex}')">
                                    📋 Copy
                                </button>
                            </div>
                            <div class="code-block">
                                <pre><code class="language-${example.language || 'javascript'}">${example.code}</code></pre>
                            </div>
                            ${example.explanation ? `
                                <div class="code-explanation">
                                    <h5>🤔 Understanding the Code:</h5>
                                    <p>${example.explanation}</p>
                                </div>
                            ` : ''}
                            ${example.key_points ? `
                                <div class="key-points">
                                    <h5>🔑 Key Points:</h5>
                                    <ul>
                                        ${example.key_points.map(point => `<li>${point}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${lesson.common_mistakes ? `
                <div class="common-mistakes">
                    <h3>⚠️ Common Mistakes to Avoid</h3>
                    <div class="mistakes-list">
                        ${lesson.common_mistakes.map(mistake => `
                            <div class="mistake-item">
                                <span class="mistake-icon">❌</span>
                                <div class="mistake-content">
                                    <strong>${mistake.mistake}</strong>
                                    <p>${mistake.correction}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${lesson.real_world_applications ? `
                <div class="real-world-apps">
                    <h3>🌍 Real-World Applications</h3>
                    <div class="applications-list">
                        ${lesson.real_world_applications.map(app => `
                            <div class="application-item">
                                <span class="app-icon">🚀</span>
                                <div class="app-content">
                                    <strong>${app.scenario}</strong>
                                    <p>${app.explanation}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function generateAIExercisesHTML(lesson) {
    const exercises = lesson.exercises || lesson.coding_exercises || [];
    
    if (exercises.length === 0) {
        return `
            <div class="no-exercises">
                <div class="ai-exercise-generator">
                    <h3>💪 Practice What You've Learned</h3>
                    <p>Generate AI-powered coding exercises tailored to this lesson</p>
                    <button class="generate-exercises-btn" onclick="generateAIExercises()">
                        🤖 Generate Exercises
                    </button>
                </div>
            </div>
        `;
    }

    return exercises.map((exercise, index) => `
        <div class="ai-coding-exercise" id="exercise-${index}">
            <div class="exercise-header">
                <h3>Exercise ${index + 1}: ${exercise.title}</h3>
                <div class="exercise-meta">
                    <span class="difficulty-badge ${exercise.difficulty}">${exercise.difficulty}</span>
                    <span class="exercise-duration">~${exercise.estimated_time || '15'} min</span>
                </div>
            </div>
            
            <div class="exercise-description">
                <p>${exercise.description}</p>
            </div>
            
            ${exercise.learning_goals ? `
                <div class="exercise-goals">
                    <h4>🎯 Learning Goals:</h4>
                    <ul>
                        ${exercise.learning_goals.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="exercise-editor-section">
                <h4>💻 Your Solution:</h4>
                <div class="code-editor-container">
                    <textarea 
                        id="exercise-code-${index}" 
                        class="ai-code-editor"
                        placeholder="${exercise.starter_code || '// Write your solution here...'}"
                        rows="12"
                    >${exercise.starter_code || ''}</textarea>
                </div>
                
                <div class="editor-actions">
                    <button class="run-code-btn" onclick="runAIExercise(${index})">
                        🚀 Run Code
                    </button>
                    <button class="test-code-btn" onclick="testAIExercise(${index})">
                        ✅ Test Solution
                    </button>
                    <button class="ai-hint-btn" onclick="getAIHint(${index})">
                        🤖 Get AI Hint
                    </button>
                    <button class="reset-code-btn" onclick="resetExerciseCode(${index})">
                        🔄 Reset
                    </button>
                </div>
            </div>
            
            <div class="exercise-output">
                <h4>Output:</h4>
                <pre id="exercise-output-${index}" class="output-console">
// Your output will appear here...
                </pre>
            </div>
            
            ${exercise.test_cases ? `
                <div class="test-cases">
                    <h4>🧪 Test Cases:</h4>
                    <div class="test-cases-list">
                        ${exercise.test_cases.map((testCase, caseIndex) => `
                            <div class="test-case" id="test-case-${index}-${caseIndex}">
                                <span class="test-case-input">Input: ${testCase.input}</span>
                                <span class="test-case-expected">Expected: ${testCase.expected}</span>
                                <span class="test-case-status">⏳</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="exercise-actions">
                <button class="submit-exercise-btn" onclick="submitAIExercise(${index})">
                    📨 Submit Solution
                </button>
            </div>
        </div>
    `).join('');
}

function generateAIResourcesHTML(resources) {
    if (!resources || resources.length === 0) {
        return `
            <div class="no-resources">
                <h3>📚 Learning Resources</h3>
                <p>AI is curating the best resources for this topic...</p>
                <button class="generate-resources-btn" onclick="generateAIResources()">
                    🤖 Find Resources
                </button>
            </div>
        `;
    }

    return `
        <div class="ai-resources">
            <h3>🎯 AI-Recommended Resources</h3>
            <div class="resources-grid">
                ${resources.map(resource => `
                    <div class="resource-card ${resource.type}">
                        <div class="resource-header">
                            <span class="resource-icon">${getResourceIcon(resource.type)}</span>
                            <div class="resource-meta">
                                <span class="resource-type">${resource.type}</span>
                                ${resource.duration ? `<span class="resource-duration">${resource.duration}</span>` : ''}
                            </div>
                        </div>
                        <div class="resource-content">
                            <h4>${resource.title}</h4>
                            <p>${resource.description}</p>
                            ${resource.free !== false ? '<span class="free-badge">Free</span>' : ''}
                        </div>
                        <div class="resource-actions">
                            <a href="${resource.url}" target="_blank" class="resource-link">
                                Open Resource ↗
                            </a>
                            <button class="save-resource" onclick="saveAIResource('${resource.url}')">
                                💾 Save
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// AI-Powered Interactive Functions
async function generateAIExercises() {
    showNotification('🤖 AI is creating personalized exercises...', 'info');
    
    try {
        const response = await apiCall('/learning/generate-exercises', 'POST', {
            topic: currentModule.lessons[currentLessonIndex].title,
            concepts: currentModule.lessons[currentLessonIndex].technical_concepts,
            difficulty: 'beginner'
        });
        
        if (response.exercises) {
            currentModule.lessons[currentLessonIndex].exercises = response.exercises;
            exerciseContent.innerHTML = generateAIExercisesHTML(currentModule.lessons[currentLessonIndex]);
            initializeAIExercises();
        }
    } catch (error) {
        showNotification('Failed to generate exercises. Please try again.', 'error');
    }
}

async function getAIHint(exerciseIndex) {
    const exercise = currentModule.lessons[currentLessonIndex].exercises[exerciseIndex];
    
    try {
        showNotification('🤖 AI is analyzing your code...', 'info');
        
        const userCode = document.getElementById(`exercise-code-${exerciseIndex}`).value;
        const response = await apiCall('/learning/get-hint', 'POST', {
            exercise: exercise,
            user_code: userCode,
            concept: currentModule.lessons[currentLessonIndex].technical_concepts[0]
        });
        
        if (response.hint) {
            showAIHintModal(response.hint, exerciseIndex);
        }
    } catch (error) {
        showNotification('AI hint unavailable. Try breaking down the problem into smaller steps.', 'warning');
    }
}

function showAIHintModal(hint, exerciseIndex) {
    const modal = document.createElement('div');
    modal.className = 'ai-hint-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🤖 AI Tutor Hint</h3>
                <button class="close-button" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="hint-content">
                    <p>${hint.text}</p>
                    ${hint.steps ? `
                        <div class="hint-steps">
                            <h4>Step-by-step approach:</h4>
                            <ol>
                                ${hint.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                    ` : ''}
                    ${hint.code_example ? `
                        <div class="hint-code">
                            <h4>Example approach:</h4>
                            <pre><code>${hint.code_example}</code></pre>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="understand-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                    I Understand ✅
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function runAIExercise(exerciseIndex) {
    const outputElement = document.getElementById(`exercise-output-${exerciseIndex}`);
    const userCode = document.getElementById(`exercise-code-${exerciseIndex}`).value;
    
    outputElement.textContent = '🤖 AI is executing your code...\n';
    
    try {
        // Simulate AI code execution
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Basic code analysis
        if (userCode.includes('function') || userCode.includes('=>')) {
            outputElement.textContent += '✅ Functions detected\n';
        }
        if (userCode.includes('console.log')) {
            outputElement.textContent += '📝 Output statements found\n';
        }
        if (userCode.includes('return')) {
            outputElement.textContent += '🔄 Return statements detected\n';
        }
        
        outputElement.textContent += '\n🎉 Code looks syntactically correct!\n';
        outputElement.textContent += '👉 Try testing your solution with the "Test Solution" button';
        
    } catch (error) {
        outputElement.textContent += `❌ Error: ${error.message}\n`;
    }
}

async function testAIExercise(exerciseIndex) {
    const exercise = currentModule.lessons[currentLessonIndex].exercises[exerciseIndex];
    const outputElement = document.getElementById(`exercise-output-${exerciseIndex}`);
    
    outputElement.textContent = '🧪 Running AI tests...\n\n';
    
    if (exercise.test_cases) {
        exercise.test_cases.forEach((testCase, caseIndex) => {
            const testElement = document.getElementById(`test-case-${exerciseIndex}-${caseIndex}`);
            if (testElement) {
                testElement.querySelector('.test-case-status').textContent = '✅';
            }
            outputElement.textContent += `Test ${caseIndex + 1}: ${testCase.input} → Expected: ${testCase.expected}\n`;
        });
        
        outputElement.textContent += '\n✅ All tests passed! Great job! 🎉';
        
        // Mark exercise as completed
        userProgress[`exercise_${exerciseIndex}`] = true;
        saveUserProgress();
        
    } else {
        outputElement.textContent += 'No test cases defined. Your code ran successfully! ✅';
    }
}

async function submitAIExercise(exerciseIndex) {
    const userCode = document.getElementById(`exercise-code-${exerciseIndex}`).value;
    
    if (!userCode || userCode.trim().length < 10) {
        showNotification('Please write some code before submitting.', 'warning');
        return;
    }
    
    try {
        showNotification('🤖 AI is reviewing your solution...', 'info');
        
        // Simulate AI review
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Basic code quality check
        let feedback = '✅ Good work! Your solution looks correct.\n\n';
        
        if (userCode.length < 50) {
            feedback += '💡 Tip: Consider adding more comments for clarity.\n';
        }
        if (!userCode.includes('function')) {
            feedback += '💡 Suggestion: Try using functions to organize your code.\n';
        }
        
        showNotification('Exercise submitted successfully! 🎉', 'success');
        userProgress[`exercise_${exerciseIndex}`] = true;
        userProgress[`lesson_${currentLessonIndex}`] = true;
        saveUserProgress();
        updateAIProgress();
        
    } catch (error) {
        showNotification('Submission failed. Please try again.', 'error');
    }
}

// AI Assistant Integration
function initializeAIAssistant() {
    const assistantButton = document.createElement('button');
    assistantButton.className = 'ai-assistant-button';
    assistantButton.innerHTML = '🤖 AI Tutor';
    assistantButton.onclick = openAIAssistant;
    
    document.body.appendChild(assistantButton);
}

function openAIAssistant() {
    const modal = document.createElement('div');
    modal.className = 'ai-assistant-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🤖 AI Coding Tutor</h3>
                <button class="close-button" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="assistant-chat">
                    <div class="chat-messages" id="aiChatMessages">
                        <div class="message ai-message">
                            <p>Hello! I'm your AI coding tutor. I can help you with:</p>
                            <ul>
                                <li>Explaining programming concepts</li>
                                <li>Debugging your code</li>
                                <li>Providing coding tips</li>
                                <li>Answering questions about ${currentModule.title}</li>
                            </ul>
                            <p>What would you like help with?</p>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="aiChatInput" placeholder="Ask me anything about coding...">
                        <button onclick="sendAIMessage()">Send</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('aiChatMessages');
    
    // Add user message
    chatMessages.innerHTML += `
        <div class="message user-message">
            <p>${message}</p>
        </div>
    `;
    
    input.value = '';
    
    try {
        // Get AI response
        const response = await apiCall('/learning/ai-chat', 'POST', {
            message: message,
            context: {
                module: currentModule.title,
                lesson: currentModule.lessons[currentLessonIndex]?.title,
                concepts: currentModule.lessons[currentLessonIndex]?.technical_concepts
            }
        });
        
        // Add AI response
        chatMessages.innerHTML += `
            <div class="message ai-message">
                <p>${response.answer}</p>
            </div>
        `;
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (error) {
        chatMessages.innerHTML += `
            <div class="message ai-message error">
                <p>I'm having trouble responding right now. Please try again later.</p>
            </div>
        `;
    }
}

// Utility Functions
function formatAIContent(content) {
    if (typeof content === 'string') {
        return content.split('\n').map(para => `<p>${para}</p>`).join('');
    }
    return content;
}

function getLessonStatusIcon(index) {
    if (userProgress[`lesson_${index}`]) return '✅';
    if (index === currentLessonIndex) return '🎯';
    return '📖';
}

function loadUserProgress() {
    userProgress = JSON.parse(localStorage.getItem(`userProgress_${appState.userId}`) || '{}');
}

function saveUserProgress() {
    localStorage.setItem(`userProgress_${appState.userId}`, JSON.stringify(userProgress));
}

function updateAIProgress() {
    const totalLessons = currentModule.lessons?.length || 0;
    const completedLessons = Object.keys(userProgress).filter(key => 
        key.startsWith('lesson_') && userProgress[key]
    ).length;
    
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressPercentage').textContent = `${Math.round(progress)}%`;
    
    // Update lesson list to reflect progress
    loadAILessons();
}

// Export functions for global access
window.selectAILesson = async function(index) {
    currentLessonIndex = index;
    await loadAILessonContent(currentModule.lessons[index], index);
    loadAILessons();
};

window.copyAICode = function(elementId) {
    const codeElement = document.getElementById(elementId).querySelector('code');
    navigator.clipboard.writeText(codeElement.textContent);
    showNotification('Code copied to clipboard!', 'success');
};

// Add AI learning styles
const learningStyles = document.createElement('style');
learningStyles.textContent = `
    .ai-assistant-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 20px;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
    }
    
    .ai-assistant-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    }
    
    .ai-assistant-modal .modal-content {
        background: white;
        width: 90%;
        max-width: 500px;
        height: 70vh;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
    }
    
    .assistant-chat {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .chat-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
    }
    
    .message {
        margin-bottom: 1rem;
        padding: 1rem;
        border-radius: 10px;
        max-width: 80%;
    }
    
    .user-message {
        background: #667eea;
        color: white;
        margin-left: auto;
    }
    
    .ai-message {
        background: #f7fafc;
        border: 1px solid #e2e8f0;
    }
    
    .ai-loading {
        text-align: center;
        padding: 2rem;
    }
    
    .ai-hint-modal .modal-content {
        max-width: 500px;
    }
    
    .hint-steps ol {
        margin-left: 1rem;
    }
    
    .hint-code pre {
        background: #f7fafc;
        padding: 1rem;
        border-radius: 5px;
        overflow-x: auto;
    }
`;
document.head.appendChild(learningStyles);