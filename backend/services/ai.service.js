const { GoogleGenAI } = require('@google/genai');
const fs = require('fs/promises'); // <-- CHANGE 1: Use fs.promises for async file ops
const fsSync = require('fs');     // <-- Use fsSync for synchronous checks (if absolutely necessary)
const path = require('path');
const pdfParse = require('pdf-parse'); 
const mammoth = require('mammoth');
const { createWorker } = require('tesseract.js'); 
const fileType = require('file-type'); 

// Initialize the Gemini AI client (expects GEMINI_API_KEY in env)
const ai = new GoogleGenAI({});
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif']);
const tmpOcrDir = path.join(__dirname, '..', 'tmp_ocr');


// --- Diagnostic logger (Now asynchronous) ---
async function logDiagnostic(filePath, buffer) {
  try {
    const stat = await fs.stat(filePath); // <-- ASYNC
    console.log('--- File Diagnostic ---');
    console.log('Path:', filePath);
    console.log('Size (bytes):', stat.size);
    console.log('Extension:', path.extname(filePath));
    console.log('First 128 bytes (hex):', buffer.slice(0, 128).toString('hex').slice(0, 400));
    console.log('-----------------------');
  } catch (e) {
    console.warn('Diagnostic logging failed:', e.message);
  }
}

// OCR helper using tesseract.js (Now asynchronous)
async function ocrBufferUsingTesseract(buffer, filePath) {
  if (!fsSync.existsSync(tmpOcrDir)) await fs.mkdir(tmpOcrDir, { recursive: true }); // <-- ASYNC mkdir

  const ext = path.extname(filePath) || '.png';
  const tmpFile = path.join(tmpOcrDir, `ocr_${Date.now()}${ext}`);
  
  await fs.writeFile(tmpFile, buffer); // <-- ASYNC write

  const worker = createWorker(); 
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(tmpFile);
    await worker.terminate();
    try { await fs.unlink(tmpFile); } catch (e) {} // <-- ASYNC unlink
    if (text && text.trim().length) return text.trim();
    throw new Error('OCR produced empty text.');
  } catch (err) {
    try { await worker.terminate(); } catch (_) {}
    try { await fs.unlink(tmpFile); } catch (_) {} // <-- ASYNC unlink
    throw new Error('Tesseract OCR failed: ' + err.message);
  }
}

/**
 * Extracts text from filePath (handles pdf, docx, txt, images, and tries OCR fallback)
 */
async function extractTextFromFile(filePath, fileName = '') {
  // CRITICAL FIX: Check existence synchronously only if necessary, but read ASYNCHRONOUSLY
  if (!fsSync.existsSync(filePath)) throw new Error('File not found: ' + filePath);

  const buffer = await fs.readFile(filePath); // <-- CHANGE 2: ASYNC file read
  await logDiagnostic(filePath, buffer);

  let ft = null;
  try { ft = await fileType.fromBuffer(buffer); } catch (e) { ft = null; }
  if (ft) console.log('Detected mime:', ft.mime);

  const ext = (fileName && fileName.includes('.')) ? '.' + fileName.split('.').pop().toLowerCase() : path.extname(filePath).toLowerCase();

  // 1) PDF
  if (ext === '.pdf' || (ft && ft.mime === 'application/pdf')) {
    try {
      const pdfData = await pdfParse(buffer);
      const text = pdfData && pdfData.text ? pdfData.text.trim() : '';
      if (text && text.length > 20) {
        console.log('pdf-parse succeeded, length:', text.length);
        return text;
      }
      console.warn('pdf-parse produced empty/short text — falling back to OCR (likely scanned PDF).');
      return await ocrBufferUsingTesseract(buffer, filePath);
    } catch (err) {
      console.error('pdf-parse threw error:', err.message);
      // fallback to OCR
      try {
        return await ocrBufferUsingTesseract(buffer, filePath);
      } catch (ocrErr) {
        throw new Error('Failed to parse PDF and OCR fallback also failed: ' + ocrErr.message);
      }
    }
  }

  // 2) DOCX
  if (ext === '.docx' || (ft && ft.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result && result.value ? result.value.trim() : '';
      if (text && text.length) return text;
      throw new Error('DOCX parsed but produced no text.');
    } catch (err) {
      console.error('DOCX parse error:', err.message);
      throw new Error('Failed to extract text from DOCX: ' + err.message);
    }
  }

  // 3) Plain txt
  if (ext === '.txt' || (ft && ft.mime === 'text/plain')) {
    try {
      return buffer.toString('utf8');
    } catch (e) {
      throw new Error('Failed to read text file: ' + e.message);
    }
  }

  // 4) Image files -> run OCR
  if (IMAGE_EXTS.has(ext) || (ft && ft.mime && ft.mime.startsWith('image/'))) {
    try {
      return await ocrBufferUsingTesseract(buffer, filePath);
    } catch (err) {
      throw new Error('Failed OCR on image: ' + err.message);
    }
  }

  // 5) Try decode utf8 as last resort
  try {
    const text = buffer.toString('utf8').trim();
    if (text && text.length) return text;
  } catch (e) { /* ignore */ }

  throw new Error('Unsupported file type or no extractable text found.');
}

// ... (Rest of generateSummaryFromDocument remains the same) ...

async function generateSummaryFromDocument(filePath, fileName) {
  // Extract text (may throw)
  const documentText = await extractTextFromFile(filePath, fileName);

  if (!documentText || documentText.length < 50) {
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
      },
    });

    return response.text;

  } catch (error) {
    console.error('AI Summarization Generation Failed:', error);
    throw new Error('Gemini API call failed. Check AI quota and API key.');
  }
}

async function extractOnly(filePath, fileName = '') {
  return await extractTextFromFile(filePath, fileName);
}

module.exports = {
  generateSummaryFromDocument,
  extractTextFromFile,
  extractOnly
};