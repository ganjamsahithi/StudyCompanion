const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini AI client
const ai = new GoogleGenAI({}); 

// Define the schema used by the Exam Predictor frontend
const EXAM_DATA_SCHEMA = {
    type: "OBJECT",
    properties: {
        examDate: { type: "STRING", description: "Predicted or scheduled exam date in YYYY-MM-DD format." },
        topicsLikely: {
            type: "ARRAY",
            description: "List of 3 to 5 high-probability topics based on combined analysis.",
            items: {
                type: "OBJECT",
                properties: {
                    topic: { type: "STRING" },
                    probability: { type: "NUMBER" },
                    importance: { type: "STRING", enum: ["Critical", "High", "Medium"] },
                    lastAppeared: { type: "STRING" },
                    description: { type: "STRING" }
                },
                required: ["topic", "probability", "importance"]
            }
        },
        professorEmphasis: {
            type: "ARRAY",
            description: "Areas the professor emphasized.",
            items: {
                type: "OBJECT",
                properties: {
                    topic: { type: "STRING" },
                    mentions: { type: "NUMBER" },
                    recentLectures: { type: "STRING" }
                },
                required: ["topic", "mentions", "recentLectures"]
            }
        },
        practiceQuestions: {
            type: "ARRAY",
            description: "5 personalized practice questions.",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "NUMBER" },
                    question: { type: "STRING" },
                    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
                    estimatedTime: { type: "STRING" },
                    topic: { type: "STRING" }
                },
                required: ["id", "question", "difficulty", "estimatedTime", "topic"]
            }
        },
        revisionRoadmap: {
            type: "OBJECT",
            description: "A phased study plan.",
            properties: {
                daysUntilExam: { type: "NUMBER" },
                totalStudyHours: { type: "NUMBER" },
                recommendedDailyHours: { type: "NUMBER" },
                phases: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            phase: { type: "STRING" },
                            duration: { type: "STRING" },
                            startDate: { type: "STRING" },
                            endDate: { type: "STRING" },
                            tasks: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        task: { type: "STRING" },
                                        hours: { type: "NUMBER" },
                                        priority: { type: "STRING", enum: ["Critical", "High", "Medium"] }
                                    },
                                    required: ["task", "hours", "priority"]
                                }
                            }
                        }
                    }
                }
            },
            required: ["daysUntilExam", "totalStudyHours", "recommendedDailyHours", "phases"]
        },
        studyTip: { type: "STRING", description: "A personalized study recommendation" },
        weakAreas: {
            type: "ARRAY",
            description: "Areas that need more focus",
            items: { type: "STRING" }
        },
        documentsAnalyzed: { type: "NUMBER", description: "Number of documents analyzed" }
    },
    required: ["examDate", "topicsLikely", "professorEmphasis", "practiceQuestions", "revisionRoadmap"]
};

// ============= NEW SCHEMA FOR TOPIC SYLLABUS =============
const TOPIC_SYLLABUS_SCHEMA = {
    type: "OBJECT",
    properties: {
        overview: {
            type: "STRING",
            description: "A comprehensive 2-3 sentence overview of the topic"
        },
        subtopics: {
            type: "ARRAY",
            description: "List of 4-8 key subtopics that students should master",
            items: {
                type: "OBJECT",
                properties: {
                    name: { 
                        type: "STRING",
                        description: "Name of the subtopic" 
                    },
                    description: { 
                        type: "STRING",
                        description: "Brief explanation of what this subtopic covers" 
                    },
                    keyPoints: {
                        type: "ARRAY",
                        description: "3-5 essential points or concepts within this subtopic",
                        items: { type: "STRING" }
                    }
                },
                required: ["name", "description", "keyPoints"]
            }
        },
        learningObjectives: {
            type: "ARRAY",
            description: "5-7 specific learning objectives students should achieve",
            items: { type: "STRING" }
        },
        studyTips: {
            type: "ARRAY",
            description: "4-6 practical study tips specific to this topic",
            items: { type: "STRING" }
        },
        estimatedStudyTime: {
            type: "STRING",
            description: "Estimated time needed to master this topic (e.g., '8-10 hours')"
        }
    },
    required: ["overview", "subtopics", "learningObjectives", "studyTips", "estimatedStudyTime"]
};
// ============= END OF NEW SCHEMA =============


/**
 * Generates a full exam prediction report using the Gemini API.
 */
async function generateExamPrediction(courseName, courseData) {
    const systemPrompt = `You are an expert academic data scientist and predictor. Your job is to analyze the provided student data and course name (${courseName}). If specific notes or tasks are missing, you must use your general knowledge about ${courseName} to generate a hyper-realistic, structured exam preparation report in the exact JSON format specified. Do NOT generate content for irrelevant subjects. **Your generated content MUST match the subject provided in courseName (e.g., if it is 'Aptitude', do NOT output 'Data Structures').**`;

    const tasksSummary = courseData.tasks.length > 0
        ? courseData.tasks.map(t => `Task: ${t.taskName} (${t.taskType}) due ${new Date(t.dueDate).toLocaleDateString()}. Completed: ${t.isCompleted}`).join('\n')
        : "No academic tasks found for this course.";

    const documentsSummary = courseData.documents.length > 0
        ? courseData.documents.map(d => `Document: ${d.fileName} (Summary: ${d.summary ? d.summary.substring(0, 100) + '...' : 'Not yet summarized'}).`).join('\n')
        : "No notes or summarized documents found for this course. Base your predictions on general subject knowledge of " + courseName;

    const userPrompt = `Generate the comprehensive Exam Prediction Report for the course ${courseName}.
        ---
        Student Activity Data:
        \n${tasksSummary}
        \n${documentsSummary}
        ---
        Based on this data, fill the entire required JSON schema for the exam predictor.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                responseMimeType: "application/json",
                responseSchema: EXAM_DATA_SCHEMA,
                temperature: 0.5,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error('Gemini Exam Prediction Failed:', error);
        throw new Error('AI generation failed. Ensure the API key is correct and document summaries exist.');
    }
}

// ============= NEW FUNCTION FOR TOPIC SYLLABUS =============
/**
 * Generates detailed syllabus for a specific topic using Gemini AI
 */
async function generateTopicSyllabus(courseName, topicName, topicDescription) {
    const systemPrompt = `You are an expert academic curriculum designer and educator specializing in ${courseName}. 
Your task is to create a comprehensive, detailed syllabus for the topic "${topicName}" that would help students 
prepare for an exam. The syllabus should be structured, practical, and focused on exam preparation. 
Use your extensive knowledge of ${courseName} to provide accurate and relevant information.`;

    const userPrompt = `Create a detailed syllabus for the following topic in ${courseName}:

Topic: ${topicName}
${topicDescription ? `Description: ${topicDescription}` : ''}

Please provide:
1. A comprehensive overview of this topic
2. All major subtopics with detailed explanations and key concepts
3. Specific learning objectives that students should achieve
4. Practical study tips tailored to this topic
5. An estimated study time for mastering this topic

Make the content exam-focused, practical, and comprehensive. Include real-world applications where relevant.`;

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
        const syllabus = JSON.parse(jsonString);

        // Add metadata
        syllabus.topicName = topicName;
        syllabus.courseName = courseName;
        syllabus.generatedAt = new Date().toISOString();

        return syllabus;

    } catch (error) {
        console.error('Gemini Topic Syllabus Generation Failed:', error);
        throw new Error('Failed to generate topic syllabus. Please try again.');
    }
}
// ============= END OF NEW FUNCTION =============

// Add this function to your backend/services/ai.exam.service.js file

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
 * @param {string} courseName - Name of the course
 * @param {string} difficulty - Easy, Medium, Hard, or Mixed
 * @param {number} questionCount - Number of MCQs (default 10)
 * @param {boolean} includeTypingQuestion - Whether to include a typing question
 * @param {string} documentContext - Context from uploaded documents
 */
async function generateQuiz(courseName, difficulty, questionCount = 10, includeTypingQuestion = true, documentContext = '') {
    const systemPrompt = `You are an expert quiz creator for ${courseName}. 
Create exactly ${questionCount} multiple-choice questions (MCQs) and ${includeTypingQuestion ? '1 short answer (typing) question' : '0 typing questions'}.\n\nRequirements:\n- Each MCQ must have EXACTLY 4 distinct options labeled A, B, C, D\n- Questions must be relevant to ${courseName}\n- Difficulty level: ${difficulty}\n- All questions must have ONE correct answer\n- The typing question should test comprehensive understanding\n- Use the provided document context if available, otherwise use general knowledge about ${courseName}\n\nFormat requirements:\n- MCQ questions: type = "MCQ", options = array of 4 strings\n- Typing question: type = "ShortAnswer", options = empty array\n- Correct answer must be provided for all questions`;

    const userPrompt = `Generate a ${difficulty} quiz for ${courseName} with ${questionCount} MCQs and ${includeTypingQuestion ? '1' : '0'} typing question(s).\n\n${documentContext ? `Use this course content as reference:\n${documentContext.substring(0, 2000)}` : `Base questions on general knowledge of ${courseName}`}\n\nEnsure questions test:\n- Fundamental concepts\n- Practical applications  \n- Problem-solving abilities\n- Comprehension and analysis\n\nThe quiz should be comprehensive and suitable for exam preparation.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                responseMimeType: "application/json",
                responseSchema: QUIZ_SCHEMA,
                temperature: 0.7,
            }
        });

        const jsonString = response.text.trim();
        const quizData = JSON.parse(jsonString);

        // Validate and format questions
        quizData.questions = quizData.questions.map((q, index) => {
            q.id = index + 1;
            
            // Ensure MCQ has 4 options
            if (q.type === 'MCQ' && (!q.options || q.options.length !== 4)) {
                q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
            }
            
            // Ensure ShortAnswer has empty options
            if (q.type === 'ShortAnswer') {
                q.options = [];
            }
            
            return q;
        });

        quizData.courseName = courseName;
        quizData.title = quizData.title || `${courseName} ${difficulty} Quiz`;
        quizData.quizType = difficulty;

        console.log(`Quiz generated: ${quizData.questions.length} questions`);

        return quizData;

    } catch (error) {
        console.error('Quiz Generation Failed:', error);
        
        // Fallback quiz if AI fails
        return generateFallbackQuiz(courseName, difficulty, questionCount, includeTypingQuestion);
    }
}

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

// Make sure this is exported
module.exports = {
    generateExamPrediction,
    generateTopicSyllabus,
    generateQuiz,
};
