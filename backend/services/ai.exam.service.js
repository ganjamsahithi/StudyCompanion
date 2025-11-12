// backend/services/ai.exam.service.js

const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini AI client (expects GEMINI_API_KEY in env)
const ai = new GoogleGenAI({});

const EXAM_PREDICTION_SCHEMA = {
    type: "OBJECT",
    properties: {
        topicsLikely: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    topic: { type: "STRING" },
                    description: { type: "STRING" },
                    importance: { type: "STRING", enum: ["High", "Medium", "Low"] },
                    lastAppeared: { type: "STRING" }
                },
                required: ["topic", "description", "importance"]
            }
        },
        documentsAnalyzed: { type: "NUMBER" },
        studyTip: { type: "STRING" },
        weakAreas: {
            type: "ARRAY",
            items: { type: "STRING" }
        },
        revisionRoadmap: {
            type: "OBJECT",
            properties: {
                phases: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            phase: { type: "STRING" },
                            startDate: { type: "STRING" },
                            tasks: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        task: { type: "STRING" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    required: ["topicsLikely", "documentsAnalyzed", "studyTip", "weakAreas", "revisionRoadmap"]
};

const TOPIC_SYLLABUS_SCHEMA = {
    type: "OBJECT",
    properties: {
        overview: { type: "STRING" },
        subtopics: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    description: { type: "STRING" },
                    keyPoints: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                }
            }
        },
        learningObjectives: {
            type: "ARRAY",
            items: { type: "STRING" }
        },
        studyTips: {
            type: "ARRAY",
            items: { type: "STRING" }
        },
        estimatedStudyTime: { type: "STRING" }
    },
    required: ["overview", "subtopics", "learningObjectives"]
};

const QUIZ_SCHEMA = {
    type: "OBJECT",
    properties: {
        title: {
            type: "STRING",
            description: "Title of the quiz"
        },
        quizType: {
            type: "STRING",
            enum: ["Easy", "Medium", "Hard", "Mixed"],
            description: "Difficulty level of the quiz"
        },
        questions: {
            type: "ARRAY",
            description: "Array of EXACTLY 11 questions (10 MCQs + 1 typing question)",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "NUMBER" },
                    text: { type: "STRING", description: "Question text" },
                    type: { type: "STRING", enum: ["MCQ", "ShortAnswer"] },
                    options: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "EXACTLY 4 options for MCQ, empty array for ShortAnswer"
                    },
                    answer: { type: "STRING", description: "Correct answer" },
                    topic: { type: "STRING", description: "Related topic" },
                    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] }
                },
                required: ["id", "text", "type", "answer", "topic", "difficulty"]
            }
        }
    },
    required: ["title", "quizType", "questions"]
};

/**
 * Generates a quiz with 10 MCQs + 1 typing question
 */
async function generateQuiz(courseName, difficulty, questionCount = 10, includeTypingQuestion = true, documentContext = '') {
    const systemPrompt = `You are an expert quiz creator for ${courseName}. 

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${questionCount} multiple-choice questions (MCQs)
- Generate EXACTLY 1 short answer (typing) question
- Total questions MUST be ${questionCount + 1}
- Each MCQ MUST have EXACTLY 4 distinct options
- Questions MUST be relevant to ${courseName}
- Difficulty level: ${difficulty}
- All questions MUST have ONE correct answer
- Generate UNIQUE questions each time - avoid repetition

MCQ Format:
- type: "MCQ"
- options: array of EXACTLY 4 strings
- answer: one of the 4 options (exact match)

Typing Question Format:
- type: "ShortAnswer"  
- options: empty array []
- answer: expected answer description`;

    const userPrompt = `Generate a ${difficulty} quiz for ${courseName} with EXACTLY ${questionCount} MCQ questions and EXACTLY 1 typing question (total ${questionCount + 1} questions).

${documentContext ? `Base questions on this course content:\n${documentContext.substring(0, 3000)}` : `Generate questions based on core concepts of ${courseName}`}

Question Requirements:
1. MCQs (Questions 1-${questionCount}): Test fundamental concepts, practical applications, and problem-solving
2. Typing Question (Question ${questionCount + 1}): Test comprehensive understanding with open-ended answer
3. All questions MUST be unique and avoid common/generic questions
4. Questions should cover different aspects of ${courseName}
5. Make questions exam-realistic and valuable for learning

IMPORTANT: Return EXACTLY ${questionCount + 1} questions, no more, no less.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                responseMimeType: "application/json",
                responseSchema: QUIZ_SCHEMA,
                temperature: 0.9, // Higher temperature for more variety
            }
        });

        const jsonString = response.text.trim();
        const quizData = JSON.parse(jsonString);

        // Validate question count
        if (!quizData.questions || quizData.questions.length < (questionCount + 1)) {
            console.warn(`AI generated only ${quizData.questions?.length || 0} questions, expected ${questionCount + 1}`);
            // Fill with fallback questions if needed
            quizData.questions = ensureQuestionCount(quizData.questions || [], courseName, difficulty, questionCount + 1);
        }

        // Validate and format questions
        quizData.questions = quizData.questions.slice(0, questionCount + 1).map((q, index) => {
            q.id = index + 1;
            
            // Ensure MCQ has 4 options
            if (q.type === 'MCQ') {
                if (!q.options || q.options.length !== 4) {
                    q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
                }
                // Ensure answer is one of the options
                if (!q.options.includes(q.answer)) {
                    q.answer = q.options[0];
                }
            }
            
            // Ensure ShortAnswer has empty options
            if (q.type === 'ShortAnswer') {
                q.options = [];
            }
            
            // Ensure difficulty matches quiz difficulty for consistency
            if (!q.difficulty) {
                q.difficulty = difficulty === 'Mixed' ? ['Easy', 'Medium', 'Hard'][index % 3] : difficulty;
            }
            
            return q;
        });

        quizData.courseName = courseName;
        quizData.title = quizData.title || `${courseName} ${difficulty} Quiz`;
        quizData.quizType = difficulty;

        console.log(`✅ Quiz generated: ${quizData.questions.length} questions for ${courseName}`);

        return quizData;

    } catch (error) {
        console.error('❌ Quiz Generation Failed:', error);
        return generateFallbackQuiz(courseName, difficulty, questionCount, includeTypingQuestion);
    }
}

/**
 * Ensures quiz has the required number of questions
 */
function ensureQuestionCount(existingQuestions, courseName, difficulty, requiredCount) {
    const questions = [...existingQuestions];
    
    while (questions.length < requiredCount) {
        const index = questions.length + 1;
        const isMCQ = index <= (requiredCount - 1);
        
        questions.push({
            id: index,
            text: isMCQ 
                ? `Question ${index}: What is an important concept in ${courseName}?`
                : `Explain a key topic you've learned in ${courseName}.`,
            type: isMCQ ? 'MCQ' : 'ShortAnswer',
            options: isMCQ ? ['Concept A', 'Concept B', 'Concept C', 'Concept D'] : [],
            answer: isMCQ ? 'Concept A' : 'Student should provide detailed explanation.',
            topic: courseName,
            difficulty: difficulty === 'Mixed' ? ['Easy', 'Medium', 'Hard'][index % 3] : difficulty
        });
    }
    
    return questions;
}

/**
 * Generates a fallback quiz if AI fails
 */
function generateFallbackQuiz(courseName, difficulty, questionCount, includeTypingQuestion) {
    console.log('⚠️ Generating fallback quiz...');
    
    const mcqs = [];
    
    const topics = [
        'Fundamentals', 'Core Concepts', 'Advanced Topics', 
        'Practical Applications', 'Theory', 'Problem Solving',
        'Best Practices', 'Key Principles', 'Implementation', 'Analysis'
    ];
    
    for (let i = 1; i <= questionCount; i++) {
        const topic = topics[i % topics.length];
        mcqs.push({
            id: i,
            text: `Which of the following best describes ${topic} in ${courseName}?`,
            type: 'MCQ',
            options: [
                `${topic} involves method A`,
                `${topic} involves method B`,
                `${topic} involves method C`,
                `${topic} involves method D`
            ],
            answer: `${topic} involves method A`,
            topic: topic,
            difficulty: difficulty === 'Mixed' ? ['Easy', 'Medium', 'Hard'][i % 3] : difficulty
        });
    }
    
    const questions = [...mcqs];
    
    if (includeTypingQuestion) {
        questions.push({
            id: questionCount + 1,
            text: `Explain the most important concept you've studied in ${courseName} and how it applies in practice.`,
            type: 'ShortAnswer',
            options: [],
            answer: 'Student should provide a comprehensive explanation covering key concepts, applications, and real-world relevance.',
            topic: courseName,
            difficulty: difficulty
        });
    }
    
    return {
        title: `${courseName} ${difficulty} Quiz`,
        quizType: difficulty,
        questions: questions,
        courseName: courseName
    };
}

/**
 * Generates exam prediction report for a course
 */
async function generateExamPrediction(courseName, courseData) {
    const { tasks, documents } = courseData;
    
    console.log(`📚 Generating exam prediction for ${courseName}`);
    
    // Find the nearest exam task, or use default values if no tasks found
    const examTask = tasks && tasks.length > 0 
        ? (tasks.find(t => t.taskType === 'Exam') || tasks[0])
        : null;
    
    // Calculate days until exam (use a default date if no task found)
    const today = new Date();
    let examDate = new Date();
    examDate.setDate(examDate.getDate() + 7); // Default to 7 days from now
    let daysUntilExam = 7;
    let examTaskName = 'General Exam';
    
    if (examTask) {
        examDate = new Date(examTask.dueDate);
        daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        examTaskName = examTask.taskName || 'General Exam';
    }
    
    // Prepare document summaries
    const documentSummaries = documents && documents.length > 0
        ? documents.map((doc, idx) => `${idx + 1}. ${doc.fileName}: ${doc.summary || 'No summary available'}`).join('\n\n')
        : '';
    
    const systemPrompt = `You are an expert academic AI assistant specializing in exam preparation. Analyze course materials and generate comprehensive exam predictions.`;
    
    const userPrompt = `Generate an exam preparation report for the course "${courseName}".

**Exam Details:**
- Exam: ${examTaskName}
- Exam Date: ${examDate.toISOString().split('T')[0]}
- Days Until Exam: ${daysUntilExam}
- Documents Analyzed: ${documents ? documents.length : 0}

**Course Materials:**
${documentSummaries || 'No course materials uploaded yet. Based on the course name "' + courseName + '", generate comprehensive exam predictions covering typical topics, concepts, and study areas that would be relevant for this subject. Use your knowledge of the subject matter to create realistic predictions.'}

**Requirements:**
1. Identify 5-8 most important topics likely to appear on the exam (use your knowledge of ${courseName} if no materials provided)
2. For each topic, provide: topic name, description, importance level (High/Medium/Low), and when it last appeared
3. Identify 3-5 weak areas that need focus
4. Provide a personalized study tip based on days remaining
5. Create a revision roadmap with phases, each phase having a start date and specific tasks
6. If exam is within 7 days, emphasize urgent focus on high-priority topics only
7. Even without uploaded materials, generate realistic and helpful predictions based on standard ${courseName} curriculum

Return the response in the specified JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                responseMimeType: "application/json",
                responseSchema: EXAM_PREDICTION_SCHEMA,
                temperature: 0.7,
            }
        });

        const jsonString = response.text.trim();
        const predictionData = JSON.parse(jsonString);
        
        // Add metadata
        predictionData.documentsAnalyzed = documents ? documents.length : 0;
        predictionData.courseName = courseName;
        predictionData.examDate = examDate.toISOString().split('T')[0];
        predictionData.daysUntilExam = daysUntilExam;
        
        // Ensure topicsLikely has lastAppeared if missing
        if (predictionData.topicsLikely) {
            predictionData.topicsLikely = predictionData.topicsLikely.map((topic, idx) => ({
                ...topic,
                lastAppeared: topic.lastAppeared || `Recently covered`,
                importance: topic.importance || (idx < 3 ? 'High' : idx < 5 ? 'Medium' : 'Low')
            }));
        }
        
        console.log(`✅ Exam prediction generated: ${predictionData.topicsLikely?.length || 0} topics`);
        
        return predictionData;
        
    } catch (error) {
        console.error('❌ Exam Prediction Generation Failed:', error);
        
        // Return fallback prediction
        return {
            topicsLikely: [
                {
                    topic: 'Core Concepts',
                    description: 'Fundamental principles and theories',
                    importance: 'High',
                    lastAppeared: 'Frequently tested'
                },
                {
                    topic: 'Practical Applications',
                    description: 'Real-world applications and case studies',
                    importance: 'High',
                    lastAppeared: 'Commonly included'
                }
            ],
            documentsAnalyzed: documents ? documents.length : 0,
            studyTip: daysUntilExam <= 7 
                ? `Focus on high-priority topics only. Review key concepts daily.`
                : `Create a study schedule covering all topics. Review materials regularly.`,
            weakAreas: ['Need more practice', 'Review key concepts', 'Focus on fundamentals'],
            revisionRoadmap: {
                phases: [
                    {
                        phase: 'Phase 1: Foundation Review',
                        startDate: new Date().toISOString().split('T')[0],
                        tasks: [
                            { task: 'Review core concepts' },
                            { task: 'Study fundamental principles' }
                        ]
                    }
                ]
            }
        };
    }
}

/**
 * Generates detailed syllabus for a specific topic
 */
async function generateTopicSyllabus(courseName, topicName, topicDescription) {
    console.log(`📖 Generating syllabus for topic: ${topicName}`);
    
    const systemPrompt = `You are an expert academic AI assistant. Generate comprehensive, detailed syllabi for specific course topics.`;
    
    const userPrompt = `Generate a detailed syllabus for the topic "${topicName}" in the course "${courseName}".

**Topic Description:**
${topicDescription || 'General topic in the course'}

**Requirements:**
1. Provide a comprehensive overview of the topic
2. Break down into 3-6 key subtopics with descriptions
3. List 3-5 learning objectives
4. Provide 3-5 study tips specific to this topic
5. Estimate realistic study time needed

Return the response in the specified JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                responseMimeType: "application/json",
                responseSchema: TOPIC_SYLLABUS_SCHEMA,
                temperature: 0.7,
            }
        });

        const jsonString = response.text.trim();
        const syllabusData = JSON.parse(jsonString);
        
        // Ensure estimatedStudyTime is present
        if (!syllabusData.estimatedStudyTime) {
            syllabusData.estimatedStudyTime = '2-4 hours';
        }
        
        console.log(`✅ Topic syllabus generated for: ${topicName}`);
        
        return syllabusData;
        
    } catch (error) {
        console.error('❌ Topic Syllabus Generation Failed:', error);
        
        // Return fallback syllabus
        return {
            overview: `This topic covers ${topicName} in the context of ${courseName}. It is an important area that requires thorough understanding.`,
            subtopics: [
                {
                    name: 'Introduction',
                    description: 'Basic concepts and definitions',
                    keyPoints: ['Key concept 1', 'Key concept 2', 'Key concept 3']
                },
                {
                    name: 'Core Principles',
                    description: 'Fundamental principles and theories',
                    keyPoints: ['Principle 1', 'Principle 2']
                }
            ],
            learningObjectives: [
                'Understand the fundamental concepts',
                'Apply principles to solve problems',
                'Analyze real-world applications'
            ],
            studyTips: [
                'Review the material regularly',
                'Practice with examples',
                'Focus on understanding, not memorization'
            ],
            estimatedStudyTime: '2-4 hours'
        };
    }
}

// Make sure this is exported
module.exports = {
    generateExamPrediction,
    generateTopicSyllabus,
    generateQuiz,
};