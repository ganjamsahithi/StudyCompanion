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
        // You would add DOCX parsing logic here using a separate library
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

module.exports = {
    generateSummaryFromDocument,
};