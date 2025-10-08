// backend/routes/documents.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let Document = require('../models/document.model');
const aiService = require('../services/ai.service'); // Import the AI service

// --- File Upload Setup (Multer) ---

// Create the 'uploads' directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Files are saved in the 'backend/uploads' folder
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Creates a unique filename (e.g., 1678888888888-lecture_notes.pdf)
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

// Filter file types to only allow PDF, DOCX, and TXT
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /\.(pdf|docx|txt|doc)$/i;
    const isAllowed = allowedExtensions.test(file.originalname);
    
    // Check MIME type as a fallback, though extension check is often more reliable
    const isMimeAllowed = file.mimetype.match(/pdf|word|text/);

    if (isAllowed || isMimeAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit to 10MB
    fileFilter: fileFilter
});


// --- API Endpoints ---

// GET /documents/ - List all uploaded documents
router.route('/').get((req, res) => {
    Document.find()
        .sort({ uploadedDate: -1 }) // Show newest first
        .then(documents => res.json(documents))
        .catch(err => res.status(400).json('Error fetching documents: ' + err));
});

// POST /documents/upload - Upload a new document and save metadata
router.route('/upload').post(upload.single('document'), (req, res) => {
    if (!req.file) {
        if (req.fileValidationError) {
             return res.status(400).json({ message: req.fileValidationError });
        }
        return res.status(400).json({ message: 'Error: No file selected or file type is invalid.' });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path; // Absolute path on the server
    const fileMimeType = req.file.mimetype;
    const userId = req.body.userId || 'default_user'; 

    const newDocument = new Document({
        fileName,
        filePath,
        fileMimeType,
        userId,
        summary: null, // Summary is null initially
    });

    newDocument.save()
        .then(doc => res.json({ message: 'Document uploaded successfully, awaiting summary.', document: doc }))
        .catch(err => res.status(400).json('Error saving document metadata: ' + err));
});


// GET /documents/summary/:id - Get a specific document's summary
router.route('/summary/:id').get((req, res) => {
    Document.findById(req.params.id)
        .then(doc => {
            if (!doc) {
                return res.status(404).json('Document not found.');
            }
            // Return only the summary content and filename
            res.json({ fileName: doc.fileName, summary: doc.summary });
        })
        .catch(err => res.status(400).json('Error fetching summary: ' + err));
});


// POST /documents/summarize/:id - Trigger AI summarization and update document
router.route('/summarize/:id').post(async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        // If summary already exists, return it immediately to save AI cost
        if (doc.summary) {
            return res.json({ 
                message: 'Summary already generated.',
                summary: doc.summary 
            });
        }

        // 1. Trigger the AI Service to read the file and summarize
        const summaryText = await aiService.generateSummaryFromDocument(doc.filePath, doc.fileName);

        // 2. Save the generated summary back to the database
        doc.summary = summaryText;
        await doc.save();

        res.json({ message: 'Summary generated successfully.', summary: summaryText });

    } catch (error) {
        console.error('AI Summarization Error:', error);
        res.status(500).json({ message: 'Failed to generate summary.', error: error.message });
    }
});


module.exports = router;