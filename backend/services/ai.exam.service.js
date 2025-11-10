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
            description: "Array of 11 questions (10 MCQs + 1 typing question)",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "NUMBER" },
                    text: { type: "STRING", description: "Question text" },
                    type: { type: "STRING", enum: ["MCQ", "ShortAnswer"] },
                    options: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "4 options for MCQ, empty for ShortAnswer"
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
 * Generates a fallback quiz if AI generation fails
 */
function generateFallbackQuiz(courseName, difficulty, questionCount, includeTypingQuestion) {
    const mcqs = [];
    
    for (let i = 1; i <= questionCount; i++) {
        mcqs.push({
            id: i,
            text: `Sample MCQ ${i} for ${courseName} (${difficulty} level)`,
            type: 'MCQ',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            answer: 'Option A',
            topic: courseName,
            difficulty: difficulty
        });
    }
    
    const questions = [...mcqs];
    
    if (includeTypingQuestion) {
        questions.push({
            id: questionCount + 1,
            text: `Explain a key concept in ${courseName} that you've studied recently.`,
            type: 'ShortAnswer',
            options: [],
            answer: 'Student should provide a detailed explanation of the concept.',
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

// Export the function
module.exports = {
    generateExamPrediction,
    generateTopicSyllabus,
    generateQuiz,  // ADD THIS EXPORT
};
