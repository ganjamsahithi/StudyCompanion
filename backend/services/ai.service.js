// backend/services/ai.service.js
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const pdf = require('pdf-parse'); // For reading PDF files
const mammoth = require('mammoth'); // For reading DOCX files

// Initialize the Gemini AI client
// It automatically looks for GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({}); 

/**
 * Extracts text content from a given file path based on its extension.
 * This is the critical section for handling different file formats.
 */
async function extractTextFromFile(filePath, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    // 1. Check if the file exists before attempting to read
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found on server: ${filePath}`);
    }

    if (extension === 'pdf') {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            if (!data.text || data.text.length < 10) {
                 throw new Error("PDF parsing returned empty or very short text.");
            }
            return data.text;
        } catch (e) {
            console.error('PDF Parsing Failed:', e);
            throw new Error('Failed to parse PDF content. It might be corrupt or image-only.');
        }
    } else if (extension === 'docx' || extension === 'doc') {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (e) {
            console.error('DOCX Parsing Failed:', e);
            throw new Error('Failed to parse DOCX content. Ensure mammoth is installed.');
        }
    } else if (extension === 'txt') {
        return fs.readFileSync(filePath, 'utf-8');
    } else {
        throw new Error(`Unsupported file type for summarization: ${extension}`);
    }
}

/**
 * Generates a concise summary from a document using the Gemini API.
 */
async function generateSummaryFromDocument(filePath, fileName) {
    const documentText = await extractTextFromFile(filePath, fileName);
    
    if (documentText.length < 50) {
        throw new Error('Document text is too short or failed to extract content properly.');
    }

    const systemPrompt = `You are a knowledgeable, concise, and helpful study agent. Your task is to summarize the provided document text for a university student. Create a summary in clear, easy-to-read Markdown format.

Instructions:
1. Start with a strong, single-sentence overview of the main topic.
2. Use bullet points to list the 3-5 most important concepts, figures, or takeaways.
3. Use bolding (**word**) for key terms.
4. The output must be pure Markdown, suitable for direct display.`;

    const userPrompt = `Please summarize the following document content:\n\n---\n\n${documentText}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                temperature: 0.2, 
                maxOutputTokens: 1024,
            }
        });

        return response.text;

    } catch (error) {
        console.error('AI Summarization Generation Failed:', error);
        // Re-throw a simpler error message to the frontend
        throw new Error(`Gemini API call failed. Check AI quota and API key.`);
    }
}

/**
 * Generates a short, topic-based title for a new chat thread.
 */
async function generateChatTitle(firstMessage, agentResponse) {
    const combinedText = `User asked: "${firstMessage}". Agent responded with an explanation.`;
    
    const systemPrompt = `You are a title generator. Analyze the text provided and create a short (5-word max), descriptive title for the conversation topic. Only output the title string. Examples: 'DFS vs BFS', 'Thermodynamics Laws', 'Text Mining Intro'.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: combinedText }] }],
            config: {
                systemInstruction: { parts: [{ text: systemPrompt }] },
                temperature: 0.1, 
            }
        });
        let title = response.text.trim().replace(/^['"](.*)['"]$/, '$1');
        return title.substring(0, 50);
        
    } catch (error) {
        console.error("AI Title Generation Failed:", error);
        return firstMessage.substring(0, 20) + '...';
    }
}

module.exports = {
    generateSummaryFromDocument,
    generateChatTitle, 
};