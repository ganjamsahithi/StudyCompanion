const { GoogleGenAI } = require('@google/genai');
const fs = require('fs/promises');
const path = require('path');
const mammoth = require('mammoth'); // For .docx conversion
const pdf = require('pdf-parse');   // For .pdf conversion
require('dotenv').config();

// Initialize the Gemini Client
// It securely picks up the GEMINI_API_KEY from the .env file
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';

// --- Helper Functions for File Processing ---

async function extractTextFromFile(filePath, fileName) {
    const fileExtension = path.extname(fileName).toLowerCase();
    
    try {
        const data = await fs.readFile(filePath);

        if (fileExtension === '.docx') {
            // Use mammoth for DOCX files
            const { value: text } = await mammoth.extractRawText({ buffer: data });
            return text;
        } else if (fileExtension === '.pdf') {
            // Use pdf-parse for PDF files
            const dataBuffer = await pdf(data);
            return dataBuffer.text;
        } else if (fileExtension === '.txt' || fileExtension === '.doc') {
            // Assume TXT or simple DOC files can be read directly (or use a buffer)
            return data.toString('utf8');
        } else {
            return null; // Unsupported file type
        }
    } catch (error) {
        console.error(`File Read Error for ${fileName}:`, error);
        // CRITICAL: Return specific error message to be handled by the route
        return { error: `Failed to read/process file: ${fileExtension} format might be corrupted.` };
    }
}


// --- Core AI Service Functions ---

/**
 * Generates a summary and checks the text content for readability.
 * This function is called by routes/documents.js.
 * @param {string} filePath - Local path of the uploaded file.
 * @param {string} fileName - Original file name.
 * @returns {object} { summaryText: string, error: string }
 */
async function generateSummaryFromDocument(filePath, fileName) {
    
    // 1. Convert Binary File to Readable Text
    const extractedContent = await extractTextFromFile(filePath, fileName);
    
    // Check if file extraction failed
    if (extractedContent === null || (typeof extractedContent === 'object' && extractedContent.error)) {
        const errMessage = extractedContent.error || 'The document format is unreadable or unsupported.';
        return { summaryText: null, error: errMessage };
    }
    
    const textContent = extractedContent.substring(0, 50000); // Limit context size for prompt

    // 2. Prepare the Prompt for Gemini
    const systemInstruction = `You are an academic expert. Summarize the following lecture notes or document in a detailed, clear, and concise manner, using headers (## or ###) and bullet points (*) for easy revision.`;
    
    const userPrompt = `Document: ${fileName}\n\nContent:\n${textContent}`;

    try {
        // 3. Call the Gemini API
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
                maxOutputTokens: 1024,
            },
        });
        
        // 4. Return the clean summary text
        return { summaryText: response.text, error: null };
        
    } catch (error) {
        // Catch network or API key errors
        console.error("Gemini API Call Failure:", error);
        return { summaryText: null, error: "AI service failed. Check API key and connection." };
    }
}

// Export functions for use in Express routes
module.exports = {
    generateSummaryFromDocument,
    // Add other AI service functions here (e.g., generateQuiz, chatResponse)
};