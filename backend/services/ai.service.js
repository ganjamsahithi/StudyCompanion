// backend/services/ai.service.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const pdf = require('pdf-parse'); // For reading PDF files

// Initialize the Gemini AI client
// It automatically looks for GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({}); 

/**
 * Extracts text content from a given file path based on its extension.
 * Currently supports PDF and TXT.
 * @param {string} filePath - Path to the uploaded file.
 * @param {string} fileName - Name of the file for logging/type checking.
 * @returns {Promise<string>} - The extracted text content.
 */
async function extractTextFromFile(filePath, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        console.log(`[AI Service] Parsing PDF: ${fileName}`);
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;

    } else if (extension === 'txt') {
        console.log(`[AI Service] Reading TXT: ${fileName}`);
        return fs.readFileSync(filePath, 'utf-8');

    } else {
        // Fallback for unsupported types
        console.warn(`[AI Service] Unsupported file type: ${extension}. Reading raw text.`);
        return fs.readFileSync(filePath, 'utf-8');
    }
}

/**
 * Generates a concise summary from a document using the Gemini API.
 * @param {string} filePath - Path to the file on the server.
 * @param {string} fileName - Name of the file.
 * @returns {Promise<string>} - The generated summary text.
 */
async function generateSummaryFromDocument(filePath, fileName) {
    // 1. Extract text content
    const documentText = await extractTextFromFile(filePath, fileName);

    // 2. Prepare the prompt for the LLM
    const systemPrompt = `You are an intelligent student academic assistant. Your goal is to summarize large documents concisely, focusing on key concepts, definitions, and main arguments. Format the output with clear headings and bullet points for easy revision. The tone should be academic and helpful.`;
    const userPrompt = `Generate a detailed summary for the following academic document, ensuring the summary is easy for a college student to use for revision. Document Text:\n\n${documentText}`;

    // 3. Call the Gemini API
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            // Reduce temperature for factual summaries
            temperature: 0.2, 
        }
    });

    return response.text;
}

/**
 * Generates a short, topic-based title for a new chat thread.
 * @param {string} firstMessage - The student's initial message.
 * @param {string} agentResponse - The agent's first detailed response.
 * @returns {Promise<string>} - A short, descriptive title.
 */
async function generateChatTitle(firstMessage, agentResponse) {
    const combinedText = `User asked: "${firstMessage}". Agent responded with an explanation.`;
    
    const systemPrompt = `You are a title generator. Analyze the text provided and create a short (5-word max), descriptive title for the conversation topic. Only output the title string. Examples: 'DFS vs BFS', 'Thermodynamics Laws', 'Text Mining Intro'.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: combinedText }] }],
            config: {
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                temperature: 0.1, 
            }
        });
        // Trim any extra quotes or whitespace the AI might add
        let title = response.text.trim().replace(/^['"](.*)['"]$/, '$1');
        return title.substring(0, 50); // Ensure title isn't too long for the database
        
    } catch (error) {
        console.error("AI Title Generation Failed:", error);
        return firstMessage.substring(0, 20) + '...'; // Fallback to a truncated message
    }
}

module.exports = {
    generateSummaryFromDocument,
    generateChatTitle, // Export the new function
};