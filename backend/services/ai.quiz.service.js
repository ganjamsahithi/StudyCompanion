// backend/services/ai.quiz.service.js
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({}); 

const QUIZ_SCHEMA = {
    type: "OBJECT",
    properties: {
        title: { type: "STRING", description: "A concise, descriptive title for the quiz." },
        courseName: { type: "STRING" },
        questions: {
            type: "ARRAY",
            description: "A list of 5-8 quiz questions.",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "NUMBER", description: "Unique ID for the question (1, 2, 3...)." },
                    questionText: { type: "STRING", description: "The question text." },
                    type: { type: "STRING", enum: ["MCQ", "TrueFalse", "ShortAnswer"] },
                    options: { type: "ARRAY", items: { type: "STRING" }, description: "4 possible choices for MCQ, empty for others." },
                    correctAnswer: { type: "STRING", description: "The single correct answer text." },
                    topic: { type: "STRING", description: "The topic the question tests." },
                    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
                },
                required: ["id", "questionText", "type", "correctAnswer", "topic", "difficulty"]
            }
        }
    },
    required: ["title", "courseName", "questions"]
};

async function generateQuizFromTopics(courseName, topics) {
    const topicsList = topics.map(t => `${t.topic} (Difficulty: ${t.difficulty || 'Medium'})`).join('; ');
    
    const systemPrompt = `You are a test creation expert. Your task is to generate a comprehensive 5-question quick quiz for a student in ${courseName}. The quiz must cover the listed topics and use a mix of MCQ, True/False, and Short Answer questions. All questions MUST have a clearly defined single correct answer.`;
    
    const userPrompt = `Generate a 5-question quiz for the course ${courseName}. Focus on these topics: ${topicsList}. The output MUST strictly adhere to the provided JSON schema.`;

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

        quizData.questions = quizData.questions.map((q, index) => ({
            ...q,
            id: index + 1,
            courseName: courseName
        }));

        return quizData;

    } catch (error) {
        console.error('Gemini Quiz Generation Failed:', error);
        throw new Error('Failed to generate quiz. Ensure API Key is correct and quota is available.');
    }
}

module.exports = {
    generateQuizFromTopics,
};