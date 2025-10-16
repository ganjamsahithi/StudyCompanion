// backend/services/ai.exam.service.js
const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini AI client
const ai = new GoogleGenAI({}); 

// Define the schema used by the Exam Predictor frontend (schema omitted for brevity, assumed correct)
const EXAM_DATA_SCHEMA = {
    type: "OBJECT",
    // ... (rest of the detailed schema properties for topicsLikely, practiceQuestions, etc.)
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
                    lastAppeared: { type: "STRING" }
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
        }
    },
    required: ["examDate", "topicsLikely", "professorEmphasis", "practiceQuestions", "revisionRoadmap"]
};


/**
 * Generates a full exam prediction report using the Gemini API.
 */
async function generateExamPrediction(courseName, courseData) {
    // FIX: Explicitly tells AI to use general knowledge if notes are missing and forbids irrelevant content.
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

module.exports = {
    generateExamPrediction,
};